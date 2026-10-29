#!/usr/bin/env node
/**
 * tests/test_challenger_m4_tilt_glare.cjs
 *
 * EMPIRICAL CHALLENGER ADVERSARIAL STRESS HARNESS — Milestone 4
 * Subsystem: 3D Card Tilt & Specular Glare Micro-Interactions (Feature F7)
 *
 * Exhaustively stress-tests:
 * 1. Tilt Rotation Bounds Clamping (±8.5deg bounds under extreme coordinates -500px to +2000px, Monte Carlo)
 * 2. Specular Glare Tracking (CSS variables --glare-x, --glare-y, --tilt-gx, --tilt-gy, --glare-opacity [0.14 - 0.18])
 * 3. Pointerleave / Mouseleave Reset (0deg angles, 0 opacity, .is-tilting removal, pending RAF cancellation)
 * 4. Touch & Coarse Pointer Protection ((hover: hover) and (pointer: fine) guard, zero listener attachment)
 * 5. RAF Debouncing & 1,000 Event Burst (cancelAnimationFrame debouncing, high-frequency pointer burst)
 * 6. Edge Cases & Defensive Resilience (zero-dimension cards, detached cards, duplicate attach idempotence, prefers-reduced-motion)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const MOTION_JS_PATH = path.join(ROOT_DIR, 'js', 'motion.js');
const MOTION_CSS_PATH = path.join(ROOT_DIR, 'css', 'motion.css');

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failedTests.push({ name, error: err });
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.stack || err.message}`);
  }
}

// ============================================================================
// LIGHTWEIGHT ADVERSARIAL DOM SIMULATOR FOR MOTION TESTS
// ============================================================================

class MockClassList {
  constructor(el) {
    this._el = el;
    this._classes = new Set();
  }
  add(...cls) {
    for (const c of cls) if (c) this._classes.add(c);
  }
  remove(...cls) {
    for (const c of cls) this._classes.delete(c);
  }
  contains(cls) {
    return this._classes.has(cls);
  }
  toggle(cls, force) {
    if (force === undefined) {
      if (this.contains(cls)) { this.remove(cls); return false; }
      else { this.add(cls); return true; }
    }
    if (force) { this.add(cls); return true; }
    else { this.remove(cls); return false; }
  }
  toString() {
    return Array.from(this._classes).join(' ');
  }
}

class MockStyle {
  constructor() {
    this._props = new Map();
  }
  setProperty(prop, val) {
    this._props.set(prop, String(val));
  }
  getPropertyValue(prop) {
    return this._props.get(prop) || '';
  }
  removeProperty(prop) {
    this._props.delete(prop);
  }
}

class MockElement {
  constructor(tagName, id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = new MockClassList(this);
    if (className) {
      className.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
    }
    this.style = new MockStyle();
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this._listeners = new Map();
    this._rect = { left: 100, top: 100, width: 300, height: 400, right: 400, bottom: 500 };
  }

  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : null; }
  hasAttribute(k) { return this.attributes.has(k); }
  removeAttribute(k) { this.attributes.delete(k); }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  getBoundingClientRect() {
    return { ...this._rect };
  }

  setMockRect(rect) {
    this._rect = { ...this._rect, ...rect };
  }

  addEventListener(event, fn, opts) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push({ fn, opts });
  }

  removeEventListener(event, fn) {
    if (!this._listeners.has(event)) return;
    this._listeners.set(event, this._listeners.get(event).filter(l => l.fn !== fn));
  }

  dispatchEvent(event) {
    event.target = this;
    event.currentTarget = this;
    const list = this._listeners.get(event.type) || [];
    for (const l of list) {
      l.fn(event);
    }
    return true;
  }

  matches(sel) {
    const parts = sel.split(',').map(s => s.trim());
    return parts.some(part => {
      if (part.startsWith('.')) {
        return this.classList.contains(part.substring(1));
      }
      if (part.startsWith('#')) {
        return this.id === part.substring(1);
      }
      return this.tagName.toLowerCase() === part.toLowerCase();
    });
  }

  querySelector(sel) {
    for (const child of this.children) {
      if (child.matches && child.matches(sel)) return child;
      if (child.querySelector) {
        const found = child.querySelector(sel);
        if (found) return found;
      }
    }
    return null;
  }

  querySelectorAll(sel) {
    const res = [];
    function walk(node) {
      for (const ch of node.children) {
        if (ch.matches && ch.matches(sel)) res.push(ch);
        if (ch.children) walk(ch);
      }
    }
    walk(this);
    return res;
  }
}

function createMotionHarness(options = {}) {
  const isFine = options.isFinePointer !== undefined ? options.isFinePointer : true;
  const isReduced = options.isReducedMotion !== undefined ? options.isReducedMotion : false;

  let rafQueue = [];
  let nextRafId = 1;
  const canceledRafIds = new Set();

  function mockRequestAnimationFrame(cb) {
    const id = nextRafId++;
    rafQueue.push({ id, cb });
    return id;
  }

  function mockCancelAnimationFrame(id) {
    canceledRafIds.add(id);
  }

  function flushRaf() {
    const currentQueue = [...rafQueue];
    rafQueue = [];
    let executed = 0;
    for (const item of currentQueue) {
      if (!canceledRafIds.has(item.id)) {
        item.cb(Date.now());
        executed++;
      }
    }
    return executed;
  }

  const documentElement = new MockElement('html');
  const body = new MockElement('body');
  documentElement.appendChild(body);

  const doc = {
    readyState: 'complete',
    documentElement,
    body,
    createElement: (tag) => new MockElement(tag),
    querySelector: (sel) => documentElement.querySelector(sel),
    querySelectorAll: (sel) => documentElement.querySelectorAll(sel),
    addEventListener: (evt, fn) => {
      documentElement.addEventListener(evt, fn);
    },
    removeEventListener: (evt, fn) => {
      documentElement.removeEventListener(evt, fn);
    }
  };

  const win = {
    document: doc,
    innerHeight: 900,
    innerWidth: 1440,
    matchMedia: (query) => {
      if (query.includes('prefers-reduced-motion')) {
        return { matches: isReduced, addEventListener: () => {}, removeEventListener: () => {} };
      }
      if (query.includes('hover: hover') && query.includes('pointer: fine')) {
        return { matches: isFine, addEventListener: () => {}, removeEventListener: () => {} };
      }
      return { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
    },
    requestAnimationFrame: mockRequestAnimationFrame,
    cancelAnimationFrame: mockCancelAnimationFrame,
    setTimeout: (fn, delay) => {
      return setTimeout(fn, delay);
    },
    clearTimeout: (id) => clearTimeout(id),
    Date: Date,
    Math: Math,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN
  };

  const sandbox = {
    window: win,
    document: doc,
    requestAnimationFrame: mockRequestAnimationFrame,
    cancelAnimationFrame: mockCancelAnimationFrame,
    console: console,
    Date: Date,
    Math: Math,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id)
  };

  vm.createContext(sandbox);

  // Read motion.js source
  const motionJsCode = fs.readFileSync(MOTION_JS_PATH, 'utf-8');
  vm.runInContext(motionJsCode, sandbox);

  return {
    window: sandbox.window,
    document: sandbox.document,
    flushRaf,
    getPendingRafCount: () => rafQueue.filter(item => !canceledRafIds.has(item.id)).length,
    createCard: (className = 'product-card', rect = {}) => {
      const card = new MockElement('div', '', className);
      if (rect) card.setMockRect(rect);
      sandbox.document.body.appendChild(card);
      return card;
    }
  };
}

// ============================================================================
// TEST SUITE EXECUTION
// ============================================================================

console.log('===================================================================');
console.log('STARTING EMPIRICAL CHALLENGER STRESS SUITE: 3D CARD TILT & GLARE');
console.log('===================================================================\n');

// ----------------------------------------------------------------------------
// SUITE 1: TILT ROTATION BOUNDS CLAMPING (±8.5deg)
// ----------------------------------------------------------------------------
console.log('--- SUITE 1: TILT ROTATION BOUNDS CLAMPING (±8.5deg) ---');

test('TC1.1: Center pointer position produces exactly 0deg (or ±0.00deg) tilt', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card', { left: 100, top: 100, width: 200, height: 300 });
  harness.window.AVInitTilt(card);

  // Card center: left + 100 = 200, top + 150 = 250
  card.dispatchEvent({ type: 'pointerenter', clientX: 200, clientY: 250 });
  card.dispatchEvent({ type: 'pointermove', clientX: 200, clientY: 250 });
  harness.flushRaf();

  const tiltX = parseFloat(card.style.getPropertyValue('--tilt-x'));
  const tiltY = parseFloat(card.style.getPropertyValue('--tilt-y'));

  assert.strictEqual(tiltX, 0, `tiltX at center must be 0, got ${tiltX}`);
  assert.strictEqual(tiltY, 0, `tiltY at center must be 0, got ${tiltY}`);
  assert.strictEqual(card.classList.contains('is-tilting'), true, 'Card must have .is-tilting while active');
});

test('TC1.2: Four cardinal corners reach exactly ±8.50deg', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card', { left: 100, top: 100, width: 200, height: 200, right: 300, bottom: 300 });
  harness.window.AVInitTilt(card);

  // Top-Left corner: clientX=100 (relX=0, normX=-1), clientY=100 (relY=0, normY=-1)
  // rotX = -(-1) * 8.5 = +8.50deg, rotY = -1 * 8.5 = -8.50deg
  card.dispatchEvent({ type: 'pointermove', clientX: 100, clientY: 100 });
  harness.flushRaf();
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '8.50deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '-8.50deg');

  // Top-Right corner: clientX=300 (relX=1, normX=1), clientY=100 (relY=0, normY=-1)
  // rotX = +8.50deg, rotY = +8.50deg
  card.dispatchEvent({ type: 'pointermove', clientX: 300, clientY: 100 });
  harness.flushRaf();
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '8.50deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '8.50deg');

  // Bottom-Left corner: clientX=100 (relX=0, normX=-1), clientY=300 (relY=1, normY=1)
  // rotX = -8.50deg, rotY = -8.50deg
  card.dispatchEvent({ type: 'pointermove', clientX: 100, clientY: 300 });
  harness.flushRaf();
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '-8.50deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '-8.50deg');

  // Bottom-Right corner: clientX=300 (relX=1, normX=1), clientY=300 (relY=1, normY=1)
  // rotX = -8.50deg, rotY = +8.50deg
  card.dispatchEvent({ type: 'pointermove', clientX: 300, clientY: 300 });
  harness.flushRaf();
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '-8.50deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '8.50deg');
});

test('TC1.3: Far out-of-bounds pointer coordinates (-500px, +2000px) clamp strictly to ±8.50deg', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card', { left: 100, top: 100, width: 200, height: 200, right: 300, bottom: 300 });
  harness.window.AVInitTilt(card);

  // Far negative: clientX = -500, clientY = -500
  card.dispatchEvent({ type: 'pointermove', clientX: -500, clientY: -500 });
  harness.flushRaf();
  let tiltX = parseFloat(card.style.getPropertyValue('--tilt-x'));
  let tiltY = parseFloat(card.style.getPropertyValue('--tilt-y'));
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '8.50deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '-8.50deg');
  assert(Math.abs(tiltX) <= 8.5 && Math.abs(tiltY) <= 8.5);

  // Far positive: clientX = +2000, clientY = +2000
  card.dispatchEvent({ type: 'pointermove', clientX: 2000, clientY: 2000 });
  harness.flushRaf();
  tiltX = parseFloat(card.style.getPropertyValue('--tilt-x'));
  tiltY = parseFloat(card.style.getPropertyValue('--tilt-y'));
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '-8.50deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '8.50deg');
  assert(Math.abs(tiltX) <= 8.5 && Math.abs(tiltY) <= 8.5);
});

test('TC1.4: Monte Carlo stress testing: 1,000 random extreme coordinates strictly respect ±8.5deg bounds', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card', { left: 50, top: 50, width: 250, height: 350 });
  harness.window.AVInitTilt(card);

  for (let i = 0; i < 1000; i++) {
    // Generate random coordinates between -10,000 and +10,000
    const randX = (Math.random() - 0.5) * 20000;
    const randY = (Math.random() - 0.5) * 20000;

    card.dispatchEvent({ type: 'pointermove', clientX: randX, clientY: randY });
    harness.flushRaf();

    const rawTiltX = card.style.getPropertyValue('--tilt-x');
    const rawTiltY = card.style.getPropertyValue('--tilt-y');
    assert(rawTiltX.endsWith('deg'), `TiltX must end with 'deg', got ${rawTiltX}`);
    assert(rawTiltY.endsWith('deg'), `TiltY must end with 'deg', got ${rawTiltY}`);

    const numX = parseFloat(rawTiltX);
    const numY = parseFloat(rawTiltY);
    assert(!isNaN(numX), `TiltX must not be NaN at (${randX}, ${randY})`);
    assert(!isNaN(numY), `TiltY must not be NaN at (${randX}, ${randY})`);
    assert(Math.abs(numX) <= 8.5001, `TiltX ${numX} exceeded 8.5deg bound`);
    assert(Math.abs(numY) <= 8.5001, `TiltY ${numY} exceeded 8.5deg bound`);
  }
});

// ----------------------------------------------------------------------------
// SUITE 2: SPECULAR GLARE TRACKING & OPACITY MODULATION
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 2: SPECULAR GLARE TRACKING & OPACITY MODULATION ---');

test('TC2.1: Specular glare variables --tilt-gx, --tilt-gy, --glare-x, --glare-y format and bounds [0.0%, 100.0%]', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('deal-card', { left: 100, top: 100, width: 200, height: 200 });
  harness.window.AVInitTilt(card);

  // Center: 50.0%
  card.dispatchEvent({ type: 'pointermove', clientX: 200, clientY: 200 });
  harness.flushRaf();

  assert.strictEqual(card.style.getPropertyValue('--tilt-gx'), '50.0%');
  assert.strictEqual(card.style.getPropertyValue('--tilt-gy'), '50.0%');
  assert.strictEqual(card.style.getPropertyValue('--glare-x'), '50.0%');
  assert.strictEqual(card.style.getPropertyValue('--glare-y'), '50.0%');
  assert.strictEqual(card.style.getPropertyValue('--mx'), '50.0%');
  assert.strictEqual(card.style.getPropertyValue('--my'), '50.0%');

  // Extreme negative coordinate clamps to 0.0%
  card.dispatchEvent({ type: 'pointermove', clientX: -999, clientY: -999 });
  harness.flushRaf();
  assert.strictEqual(card.style.getPropertyValue('--tilt-gx'), '0.0%');
  assert.strictEqual(card.style.getPropertyValue('--tilt-gy'), '0.0%');
  assert.strictEqual(card.style.getPropertyValue('--glare-x'), '0.0%');
  assert.strictEqual(card.style.getPropertyValue('--glare-y'), '0.0%');

  // Extreme positive coordinate clamps to 100.0%
  card.dispatchEvent({ type: 'pointermove', clientX: 9999, clientY: 9999 });
  harness.flushRaf();
  assert.strictEqual(card.style.getPropertyValue('--tilt-gx'), '100.0%');
  assert.strictEqual(card.style.getPropertyValue('--tilt-gy'), '100.0%');
  assert.strictEqual(card.style.getPropertyValue('--glare-x'), '100.0%');
  assert.strictEqual(card.style.getPropertyValue('--glare-y'), '100.0%');
});

test('TC2.2: Glare opacity modulates dynamically between 0.14 and 0.18 based on distance from center', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card', { left: 100, top: 100, width: 200, height: 200 });
  harness.window.AVInitTilt(card);

  // Center pointer -> distance = 0 -> opacity = 0.14
  card.dispatchEvent({ type: 'pointermove', clientX: 200, clientY: 200 });
  harness.flushRaf();
  assert.strictEqual(card.style.getPropertyValue('--glare-opacity'), '0.14');

  // Corner pointer -> distance = sqrt(1+1) = 1.414 -> 0.14 + min(0.04, 1.414*0.04) = 0.18
  card.dispatchEvent({ type: 'pointermove', clientX: 300, clientY: 300 });
  harness.flushRaf();
  assert.strictEqual(card.style.getPropertyValue('--glare-opacity'), '0.18');

  // Intermediate point: half-way from center
  card.dispatchEvent({ type: 'pointermove', clientX: 250, clientY: 200 });
  harness.flushRaf();
  const midOpacity = parseFloat(card.style.getPropertyValue('--glare-opacity'));
  assert(midOpacity >= 0.14 && midOpacity <= 0.18, `Opacity ${midOpacity} out of [0.14, 0.18]`);
});

// ----------------------------------------------------------------------------
// SUITE 3: POINTERLEAVE / MOUSELEAVE RESET BEHAVIOR
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 3: POINTERLEAVE / MOUSELEAVE RESET BEHAVIOR ---');

test('TC3.1: pointerleave resets angles to 0deg and glare opacity to 0', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card', { left: 100, top: 100, width: 200, height: 200 });
  harness.window.AVInitTilt(card);

  // Tilt card first
  card.dispatchEvent({ type: 'pointermove', clientX: 300, clientY: 300 });
  harness.flushRaf();
  assert.strictEqual(card.classList.contains('is-tilting'), true);
  assert.notStrictEqual(card.style.getPropertyValue('--tilt-x'), '0deg');

  // Trigger pointerleave
  card.dispatchEvent({ type: 'pointerleave' });

  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '0deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '0deg');
  assert.strictEqual(card.style.getPropertyValue('--glare-opacity'), '0');
  assert.strictEqual(card.classList.contains('is-tilting'), false, 'is-tilting must be removed on leave');
});

test('TC3.2: mouseleave resets angles to 0deg and glare opacity to 0 identically', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('av-motion-tilt', { left: 50, top: 50, width: 200, height: 200 });
  harness.window.AVInitTilt(card);

  card.dispatchEvent({ type: 'mousemove', clientX: 50, clientY: 50 });
  harness.flushRaf();
  assert.strictEqual(card.classList.contains('is-tilting'), true);

  card.dispatchEvent({ type: 'mouseleave' });

  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '0deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '0deg');
  assert.strictEqual(card.style.getPropertyValue('--glare-opacity'), '0');
  assert.strictEqual(card.classList.contains('is-tilting'), false);
});

test('TC3.3: Race condition test: pointerleave immediately cancels pending RAF, preventing stale tilt', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card', { left: 100, top: 100, width: 200, height: 200 });
  harness.window.AVInitTilt(card);

  // Pointer moves, scheduling a RAF that has NOT yet executed
  card.dispatchEvent({ type: 'pointermove', clientX: 300, clientY: 300 });
  assert.strictEqual(harness.getPendingRafCount(), 1, 'RAF must be scheduled');

  // User rapidly moves pointer out before next screen frame
  card.dispatchEvent({ type: 'pointerleave' });

  // Now the animation frame ticks
  const executed = harness.flushRaf();
  assert.strictEqual(executed, 0, 'Canceled RAF callback must not execute');

  // Card must remain in pristine reset state
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '0deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '0deg');
  assert.strictEqual(card.style.getPropertyValue('--glare-opacity'), '0');
  assert.strictEqual(card.classList.contains('is-tilting'), false);
});

// ----------------------------------------------------------------------------
// SUITE 4: TOUCH & COARSE POINTER PROTECTION
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 4: TOUCH & COARSE POINTER PROTECTION ---');

test('TC4.1: Touch / coarse pointer device ((hover: hover) and (pointer: fine) = false) does not attach tilt listeners', () => {
  const harness = createMotionHarness({ isFinePointer: false });
  const card = harness.createCard('product-card', { left: 100, top: 100, width: 200, height: 200 });

  // Try initializing tilt on coarse pointer device
  harness.window.AVInitTilt(card);

  // Verify .av-motion-tilt was NOT added
  assert.strictEqual(card.classList.contains('av-motion-tilt'), false, '.av-motion-tilt must NOT be added on touch');

  // Verify glare element was NOT injected
  assert.strictEqual(card.querySelector('.av-card-glare'), null, '.av-card-glare must NOT be created on touch');

  // Verify card._avTiltBound flag is not set
  assert.strictEqual(Boolean(card._avTiltBound), false, '_avTiltBound must remain false');

  // Simulate touch / pointer moves on card
  card.dispatchEvent({ type: 'pointermove', clientX: 300, clientY: 300 });
  const executed = harness.flushRaf();

  assert.strictEqual(executed, 0, 'No RAF must be scheduled or executed on touch');
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '', 'Tilt variables must remain unset on touch');
  assert.strictEqual(card.classList.contains('is-tilting'), false);
});

test('TC4.2: Direct target invocation AVInitTilt(card) respects coarse pointer guard', () => {
  const harness = createMotionHarness({ isFinePointer: false });
  const card = harness.createCard('deal-card');

  harness.window.AVInitTilt(card);
  assert.strictEqual(card.classList.contains('av-motion-tilt'), false);
  assert.strictEqual(card.querySelector('.av-card-glare'), null);
});

// ----------------------------------------------------------------------------
// SUITE 5: RAF DEBOUNCING & 1,000 EVENT BURST
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 5: RAF DEBOUNCING & 1,000 EVENT BURST ---');

test('TC5.1: 1,000 simulated rapid pointer events in a single frame are debounced to exactly 1 RAF execution', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card', { left: 100, top: 100, width: 200, height: 200 });
  harness.window.AVInitTilt(card);

  const startTime = Date.now();

  // Burst of 1,000 pointermove events (from top-left 100,100 to bottom-right 300,300)
  for (let i = 0; i < 1000; i++) {
    const progress = i / 999;
    card.dispatchEvent({
      type: 'pointermove',
      clientX: 100 + progress * 200,
      clientY: 100 + progress * 200
    });
  }

  const durationMs = Date.now() - startTime;
  console.log(`    -> 1,000 events processed in ${durationMs}ms`);
  assert(durationMs < 100, `Burst of 1,000 events took too long (${durationMs}ms)`);

  // Assert only 1 active RAF is pending
  assert.strictEqual(harness.getPendingRafCount(), 1, 'Only the most recent RAF should be active');

  // Flush RAF
  const executed = harness.flushRaf();
  assert.strictEqual(executed, 1, 'Exactly 1 RAF execution should occur');

  // Assert final state reflects the 1,000th event (bottom-right: rotX=-8.50deg, rotY=8.50deg)
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '-8.50deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '8.50deg');
});

test('TC5.2: Interleaved burst of 500 pointermove and 500 mousemove events debounces cleanly', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card', { left: 100, top: 100, width: 200, height: 200 });
  harness.window.AVInitTilt(card);

  for (let i = 0; i < 500; i++) {
    card.dispatchEvent({ type: 'pointermove', clientX: 200, clientY: 200 });
    card.dispatchEvent({ type: 'mousemove', clientX: 100, clientY: 100 });
  }

  assert.strictEqual(harness.getPendingRafCount(), 1);
  const executed = harness.flushRaf();
  assert.strictEqual(executed, 1);
  // Final event was mousemove at top-left corner (100, 100) -> rotX = +8.50deg, rotY = -8.50deg
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '8.50deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '-8.50deg');
});

test('TC5.3: Rapid enter-move-leave chatter (100 cycles) leaves card cleanly reset to 0deg', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card', { left: 100, top: 100, width: 200, height: 200 });
  harness.window.AVInitTilt(card);

  for (let i = 0; i < 100; i++) {
    card.dispatchEvent({ type: 'pointerenter', clientX: 150, clientY: 150 });
    card.dispatchEvent({ type: 'pointermove', clientX: 180 + (i % 50), clientY: 180 + (i % 50) });
    if (i % 2 === 0) {
      harness.flushRaf();
    }
    card.dispatchEvent({ type: 'pointerleave' });
  }

  harness.flushRaf();
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '0deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '0deg');
  assert.strictEqual(card.style.getPropertyValue('--glare-opacity'), '0');
  assert.strictEqual(card.classList.contains('is-tilting'), false);
});

// ----------------------------------------------------------------------------
// SUITE 6: DEFENSIVE RESILIENCE & EDGE CASES
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 6: DEFENSIVE RESILIENCE & EDGE CASES ---');

test('TC6.1: Zero-dimension card (width=0 or height=0) safely aborts without NaN or division by zero', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card', { left: 100, top: 100, width: 0, height: 0 });
  harness.window.AVInitTilt(card);

  card.dispatchEvent({ type: 'pointermove', clientX: 150, clientY: 150 });
  harness.flushRaf();

  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '');
  assert.strictEqual(card.classList.contains('is-tilting'), false);
});

test('TC6.2: Existing .av-card-glare in DOM is reused without duplicating glare element', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card');

  // Pre-insert a glare element
  const existingGlare = new MockElement('div', '', 'av-card-glare');
  card.appendChild(existingGlare);

  harness.window.AVInitTilt(card);

  const glares = card.querySelectorAll('.av-card-glare');
  assert.strictEqual(glares.length, 1, 'Must not duplicate .av-card-glare element');
});

test('TC6.3: Calling AVInitTilt multiple times on same card is idempotent', () => {
  const harness = createMotionHarness();
  const card = harness.createCard('product-card');

  harness.window.AVInitTilt(card);
  harness.window.AVInitTilt(card);
  harness.window.AVInitTilt(card);

  // Check listener count on card
  const moveListeners = card._listeners.get('pointermove') || [];
  assert.strictEqual(moveListeners.length, 1, 'Only one pointermove listener should be attached');
});

test('TC6.4: prefers-reduced-motion: reduce disables tilt and registers safe stubs', () => {
  const harness = createMotionHarness({ isReducedMotion: true });
  const card = harness.createCard('product-card');

  assert.strictEqual(typeof harness.window.AVInitTilt, 'function');
  assert.strictEqual(typeof harness.window.AVFlyToCart, 'function');
  assert.strictEqual(typeof harness.window.AVCartCelebration, 'function');

  // Invoking AVInitTilt on reduced-motion does nothing
  harness.window.AVInitTilt(card);
  assert.strictEqual(card.classList.contains('av-motion-tilt'), false);
  assert.strictEqual(card.querySelector('.av-card-glare'), null);
});

test('TC6.5: Verify motion.css rules enforce perspective 1000px, preserve-3d, and clamp values', () => {
  const cssContent = fs.readFileSync(MOTION_CSS_PATH, 'utf-8');

  // Perspective 1000px
  assert(cssContent.includes('perspective: 1000px'), 'motion.css must declare perspective: 1000px');
  assert(cssContent.includes('transform-style: preserve-3d'), 'motion.css must declare transform-style: preserve-3d');
  assert(cssContent.includes('var(--tilt-x, 0deg)'), 'motion.css must reference --tilt-x');
  assert(cssContent.includes('var(--tilt-y, 0deg)'), 'motion.css must reference --tilt-y');
  assert(cssContent.includes('var(--glare-opacity'), 'motion.css must reference --glare-opacity');
  assert(cssContent.includes('var(--tilt-gx'), 'motion.css must reference --tilt-gx');
  assert(cssContent.includes('var(--tilt-gy'), 'motion.css must reference --tilt-gy');
  assert(cssContent.includes('transition: transform 0.4s'), 'motion.css must have smooth return transition (0.4s)');
  assert(cssContent.includes('@media (prefers-reduced-motion: reduce)'), 'motion.css must include reduced motion query');
});

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================

console.log('\n===================================================================');
console.log(`TEST RUN FINISHED: ${passedTests}/${totalTests} PASSED`);
if (failedTests.length > 0) {
  console.log(`FAILED TESTS (${failedTests.length}):`);
  failedTests.forEach(f => console.log(` - ${f.name}: ${f.error.message}`));
  console.log('VERDICT: REQUEST_CHANGES');
  process.exit(1);
} else {
  console.log('VERDICT: APPROVE');
  console.log('===================================================================');
  process.exit(0);
}
