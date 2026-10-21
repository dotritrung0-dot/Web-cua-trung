#!/usr/bin/env node
/**
 * tests/test_challenger_m4_particles_stress.cjs
 *
 * EMPIRICAL CHALLENGER ADVERSARIAL STRESS HARNESS — Milestone 4
 * Particle Physics, Badge Pulse & Reduced-Motion Accessibility Subsystems
 *
 * Exhaustively stress-tests:
 * 1. Rapid Cart Additions Stress & Zero DOM Leaks (100 rapid calls, frame debounce,
 *    multi-burst sliding window, store integration, DOM cleanup verification).
 * 2. Null / Undefined / Malformed Source Element Handling (fallback coordinates window.innerWidth/2,
 *    window.innerHeight/2, mobile/desktop viewports, detached nodes, no unhandled exceptions).
 * 3. Reduced-Motion Accessibility Subsystem (prefers-reduced-motion media query simulation,
 *    0 particles spawned, tilt bypassed, coarse pointer touch guard, CSS @media rules audit).
 * 4. Badge Pulse Keyframe & CSS Bundle Verification (@keyframes avBadgePulse, avBadgePop,
 *    avCartParticleBurst, avMotionCartBump, selector bindings, bundle syntax & zero-drift).
 * 5. Trajectory Physics & 3D Tilt Mathematical Sanity (clamping [-8.5, 8.5], upward bias,
 *    Sakura Pastel palette, specular glare opacity [0.14, 0.18], NaN/Infinity avoidance).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const MOTION_JS_PATH = path.join(ROOT_DIR, 'js', 'motion.js');
const SITE_JS_PATH = path.join(ROOT_DIR, 'js', 'site.js');
const MOTION_CSS_PATH = path.join(ROOT_DIR, 'css', 'motion.css');
const BUNDLE_CSS_PATH = path.join(ROOT_DIR, 'css', 'bundle.css');

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
// CSS BLOCK EXTRACTOR & TOKEN VALIDATOR
// ============================================================================

function extractBlock(css, startPattern) {
  const match = css.match(startPattern);
  if (!match) return null;
  const startIdx = match.index + match[0].length;
  let depth = 1;
  let idx = startIdx;
  while (idx < css.length && depth > 0) {
    if (css[idx] === '{') depth++;
    else if (css[idx] === '}') depth--;
    idx++;
  }
  return css.slice(startIdx, idx - 1);
}

function extractAllBlocks(css, startPattern) {
  const blocks = [];
  let match;
  const regex = new RegExp(startPattern.source, 'g');
  while ((match = regex.exec(css)) !== null) {
    const startIdx = match.index + match[0].length;
    let depth = 1;
    let idx = startIdx;
    while (idx < css.length && depth > 0) {
      if (css[idx] === '{') depth++;
      else if (css[idx] === '}') depth--;
      idx++;
    }
    blocks.push(css.slice(startIdx, idx - 1));
    regex.lastIndex = idx;
  }
  return blocks;
}

function validateTokens(css) {
  let inComment = false;
  let inString = null;
  let braceOpen = 0, braceClose = 0;
  let parenOpen = 0, parenClose = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (inComment) {
      if (ch === '*' && css[i + 1] === '/') {
        inComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (ch === inString && css[i - 1] !== '\\') {
        inString = null;
      }
      continue;
    }
    if (ch === '/' && css[i + 1] === '*') {
      inComment = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }
    if (ch === '{') braceOpen++;
    else if (ch === '}') braceClose++;
    else if (ch === '(') parenOpen++;
    else if (ch === ')') parenClose++;
  }
  return { braceOpen, braceClose, parenOpen, parenClose };
}

// ============================================================================
// LIGHTWEIGHT MOCK DOM & VIRTUAL TIMER ENVIRONMENT
// ============================================================================

class MockStyle {
  constructor() {
    this._props = new Map();
  }
  setProperty(prop, val) {
    this._props.set(prop, String(val));
    const camel = prop.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
    this[camel] = String(val);
  }
  getPropertyValue(prop) {
    return this._props.has(prop) ? this._props.get(prop) : '';
  }
  removeProperty(prop) {
    this._props.delete(prop);
    const camel = prop.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
    delete this[camel];
  }
}

function createMockStyle() {
  const target = new MockStyle();
  return new Proxy(target, {
    set(obj, prop, value) {
      obj._props.set(prop, String(value));
      obj[prop] = String(value);
      return true;
    },
    get(obj, prop) {
      if (prop in obj) return obj[prop];
      if (obj._props.has(prop)) return obj._props.get(prop);
      return '';
    }
  });
}

class MockElement {
  constructor(tag, id = null, className = '') {
    this.tagName = tag.toUpperCase();
    this.attributes = new Map();
    this.style = createMockStyle();
    this.children = [];
    this.parentNode = null;
    this._textContent = '';
    this.value = '';
    this.hidden = false;
    this.listeners = new Map();
    this.classList = {
      _classes: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
      add: (...cls) => {
        for (const c of cls) if (c) this.classList._classes.add(c);
      },
      remove: (...cls) => {
        for (const c of cls) this.classList._classes.delete(c);
      },
      contains: (c) => this.classList._classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (this.classList._classes.has(c)) {
            this.classList._classes.delete(c);
            return false;
          } else {
            this.classList._classes.add(c);
            return true;
          }
        }
        if (force) {
          this.classList._classes.add(c);
          return true;
        } else {
          this.classList._classes.delete(c);
          return false;
        }
      }
    };
    this.dataset = {};
    if (id) {
      this.setAttribute('id', id);
    }
    if (className) {
      this.className = className;
    }
  }

  get className() {
    return Array.from(this.classList._classes).join(' ');
  }

  set className(val) {
    this.classList._classes.clear();
    if (val) {
      val.split(/\s+/).filter(Boolean).forEach((c) => this.classList._classes.add(c));
    }
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(v) {
    this._textContent = (v === null || v === undefined) ? '' : String(v);
  }

  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    if (k === 'id') this.id = String(v);
    if (k.startsWith('data-')) {
      const dataKey = k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      this.dataset[dataKey] = String(v);
    }
  }

  getAttribute(k) {
    return this.attributes.has(k) ? this.attributes.get(k) : null;
  }

  removeAttribute(k) {
    this.attributes.delete(k);
    if (k === 'id') delete this.id;
  }

  hasAttribute(k) {
    return this.attributes.has(k);
  }

  appendChild(child) {
    if (child.parentNode && child.parentNode.removeChild) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx > -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
      return child;
    }
    return null;
  }

  getBoundingClientRect() {
    return {
      left: 100,
      top: 200,
      right: 220,
      bottom: 250,
      width: 120,
      height: 50
    };
  }

  closest(selector) {
    if (!selector) return null;
    let curr = this;
    while (curr) {
      if (curr.matches && curr.matches(selector)) {
        return curr;
      }
      curr = curr.parentNode;
    }
    return null;
  }

  matches(selector) {
    if (!selector) return false;
    const parts = selector.split(',').map((s) => s.trim());
    for (const part of parts) {
      if (part.startsWith('#') && this.id === part.slice(1)) return true;
      if (part.startsWith('.') && this.classList.contains(part.slice(1))) return true;
      if (part.toUpperCase() === this.tagName) return true;
      if (part.startsWith('[') && part.endsWith(']')) {
        const attr = part.slice(1, -1);
        if (this.hasAttribute(attr)) return true;
      }
    }
    return false;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const selectors = selector.split(',').map((s) => s.trim());

    function walk(node) {
      for (const child of node.children) {
        let matched = false;
        for (const s of selectors) {
          if (child.matches(s)) {
            matched = true;
            break;
          }
        }
        if (matched) results.push(child);
        walk(child);
      }
    }
    walk(this);
    return results;
  }

  addEventListener(event, fn, opts) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push({ fn, opts });
  }

  removeEventListener(event, fn) {
    if (this.listeners.has(event)) {
      const list = this.listeners.get(event).filter((item) => item.fn !== fn);
      this.listeners.set(event, list);
    }
  }

  dispatchEvent(event) {
    const evType = typeof event === 'string' ? event : event.type;
    if (this.listeners.has(evType)) {
      const list = this.listeners.get(evType).slice();
      for (const item of list) {
        item.fn(event);
      }
    }
  }
}

/**
 * Creates an isolated Mock Browser Sandbox with Virtual Clock support
 */
function createMotionSandbox(options = {}) {
  const {
    prefersReducedMotion = false,
    isFinePointer = true,
    innerWidth = 1280,
    innerHeight = 720,
    initialStorage = {}
  } = options;

  let virtualTime = 1000000;
  let timerIdSeq = 1;
  const activeTimers = new Map();

  function customSetTimeout(fn, delay) {
    const id = timerIdSeq++;
    const triggerAt = virtualTime + (Number(delay) || 0);
    activeTimers.set(id, { fn, triggerAt });
    return id;
  }

  function customClearTimeout(id) {
    activeTimers.delete(id);
  }

  function advanceTimersByTime(ms) {
    virtualTime += ms;
    let processed = true;
    while (processed) {
      processed = false;
      let earliestId = null;
      let earliestTime = Infinity;

      for (const [id, timer] of activeTimers.entries()) {
        if (timer.triggerAt <= virtualTime && timer.triggerAt < earliestTime) {
          earliestTime = timer.triggerAt;
          earliestId = id;
        }
      }

      if (earliestId !== null) {
        const timer = activeTimers.get(earliestId);
        activeTimers.delete(earliestId);
        timer.fn();
        processed = true;
      }
    }
  }

  const storageData = { ...initialStorage };
  const mockLocalStorage = {
    getItem(k) {
      return Object.prototype.hasOwnProperty.call(storageData, k) ? storageData[k] : null;
    },
    setItem(k, v) {
      storageData[k] = String(v);
    },
    removeItem(k) {
      delete storageData[k];
    },
    clear() {
      for (const k of Object.keys(storageData)) delete storageData[k];
    },
    _raw: storageData
  };

  const docEl = new MockElement('html');
  docEl.setAttribute('data-theme', 'sakura');
  const bodyEl = new MockElement('body');
  docEl.appendChild(bodyEl);

  const documentListeners = new Map();
  const windowListeners = new Map();

  class MockCustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail || null;
      this.bubbles = init.bubbles || false;
      this.cancelable = init.cancelable || false;
    }
  }

  const mockDoc = {
    documentElement: docEl,
    body: bodyEl,
    readyState: 'complete',
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => {
      return docEl.querySelector('#' + id);
    },
    querySelector: (sel) => {
      return docEl.querySelector(sel);
    },
    querySelectorAll: (sel) => {
      return docEl.querySelectorAll(sel);
    },
    addEventListener: (ev, fn, opts) => {
      if (!documentListeners.has(ev)) documentListeners.set(ev, []);
      documentListeners.get(ev).push({ fn, opts });
    },
    removeEventListener: (ev, fn) => {
      if (documentListeners.has(ev)) {
        documentListeners.set(
          ev,
          documentListeners.get(ev).filter((item) => item.fn !== fn)
        );
      }
    },
    dispatchEvent: (ev) => {
      const evType = typeof ev === 'string' ? ev : ev.type;
      if (documentListeners.has(evType)) {
        for (const item of documentListeners.get(evType).slice()) {
          item.fn(ev);
        }
      }
    }
  };

  const mockWin = {
    innerWidth: innerWidth,
    innerHeight: innerHeight,
    document: mockDoc,
    localStorage: mockLocalStorage,
    CustomEvent: MockCustomEvent,
    Event: MockCustomEvent,
    Date: {
      now: () => virtualTime
    },
    setTimeout: customSetTimeout,
    clearTimeout: customClearTimeout,
    requestAnimationFrame: (cb) => {
      return customSetTimeout(cb, 16);
    },
    cancelAnimationFrame: (id) => {
      customClearTimeout(id);
    },
    matchMedia: (query) => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return { matches: prefersReducedMotion };
      }
      if (query === '(hover: hover) and (pointer: fine)') {
        return { matches: isFinePointer };
      }
      return { matches: false };
    },
    addEventListener: (ev, fn, opts) => {
      if (!windowListeners.has(ev)) windowListeners.set(ev, []);
      windowListeners.get(ev).push({ fn, opts });
    },
    removeEventListener: (ev, fn) => {
      if (windowListeners.has(ev)) {
        windowListeners.set(
          ev,
          windowListeners.get(ev).filter((item) => item.fn !== fn)
        );
      }
    },
    dispatchEvent: (ev) => {
      const evType = typeof ev === 'string' ? ev : ev.type;
      if (windowListeners.has(evType)) {
        for (const item of windowListeners.get(evType).slice()) {
          item.fn(ev);
        }
      }
    }
  };

  mockWin.window = mockWin;
  mockDoc.defaultView = mockWin;

  const sandboxContext = vm.createContext(mockWin);

  function loadModule(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    const script = new vm.Script(code, { filename: filePath });
    script.runInContext(sandboxContext);
  }

  return {
    window: mockWin,
    document: mockDoc,
    localStorage: mockLocalStorage,
    loadModule,
    advanceTimersByTime,
    getVirtualTime: () => virtualTime,
    getActiveTimersCount: () => activeTimers.size
  };
}

// ============================================================================
// SUITE 1: RAPID CART ADDITIONS STRESS & ZERO DOM LEAKS
// ============================================================================
console.log('\n--- SUITE 1: RAPID CART ADDITIONS STRESS & ZERO DOM LEAKS ---');

test('1.1: Single AVCartCelebration burst spawns exactly 16 particles with Sakura Pastel tokens', () => {
  const env = createMotionSandbox();
  env.loadModule(MOTION_JS_PATH);

  assert.strictEqual(typeof env.window.AVCartCelebration, 'function', 'AVCartCelebration must be exported on window');

  const btn = env.document.createElement('button');
  btn.getBoundingClientRect = () => ({ left: 200, top: 300, width: 80, height: 40 });
  env.document.body.appendChild(btn);

  env.window.AVCartCelebration(btn);

  const particles = env.document.querySelectorAll('.av-cart-particle');
  assert.strictEqual(particles.length, 16, 'Burst must spawn exactly 16 particles (range 14-20)');

  const validColors = new Set(['#e11d74', '#9333ea', '#0284c7', '#fbbf24']);
  const validSymbols = new Set(['🌸', '✦', '★', '✨', '❀']);

  for (const p of particles) {
    assert.strictEqual(p.style.left, '240px', 'left coordinate must be button center: 200 + 80/2 = 240px');
    assert.strictEqual(p.style.top, '320px', 'top coordinate must be button center: 300 + 40/2 = 320px');
    assert.ok(validColors.has(p.style.color), `Color ${p.style.color} must belong to Sakura Pastel palette`);
    assert.ok(validSymbols.has(p.textContent), `Symbol ${p.textContent} must belong to celebratory anime symbols`);

    const tx = p.style.getPropertyValue('--tx');
    const ty = p.style.getPropertyValue('--ty');
    const rot = p.style.getPropertyValue('--rot');

    assert.ok(tx.endsWith('px'), `tx must have px suffix, got ${tx}`);
    assert.ok(ty.endsWith('px'), `ty must have px suffix, got ${ty}`);
    assert.ok(rot.endsWith('deg'), `rot must have deg suffix, got ${rot}`);
  }
});

test('1.2: All 16 particles from single burst are removed from DOM after 850ms', () => {
  const env = createMotionSandbox();
  env.loadModule(MOTION_JS_PATH);

  const btn = env.document.createElement('button');
  env.document.body.appendChild(btn);

  env.window.AVCartCelebration(btn);
  assert.strictEqual(env.document.querySelectorAll('.av-cart-particle').length, 16);

  // Before 850ms: particles still present
  env.advanceTimersByTime(800);
  assert.strictEqual(env.document.querySelectorAll('.av-cart-particle').length, 16);

  // At 850ms: all particles cleaned up
  env.advanceTimersByTime(60);
  assert.strictEqual(env.document.querySelectorAll('.av-cart-particle').length, 0, 'Particles must be 0 after 850ms');
  assert.strictEqual(env.document.body.children.length, 1, 'Only original button must remain');
});

test('1.3: 100 rapid synchronous calls within 40ms frame are debounced to 1 set of 16 particles (0 leaks)', () => {
  const env = createMotionSandbox();
  env.loadModule(MOTION_JS_PATH);

  const btn = env.document.createElement('button');
  env.document.body.appendChild(btn);

  // Rapid burst of 100 calls in the same millisecond with same element
  for (let i = 0; i < 100; i++) {
    env.window.AVCartCelebration(btn);
  }

  // Anti-spam debounce must keep particle count at exactly 16
  const particles = env.document.querySelectorAll('.av-cart-particle');
  assert.strictEqual(particles.length, 16, 'Debounce must prevent spawning 1600 particles in same frame');

  // Advance time past 850ms
  env.advanceTimersByTime(860);
  assert.strictEqual(env.document.querySelectorAll('.av-cart-particle').length, 0, 'All particles must be removed');
});

test('1.4: 100 rapid spaced bursts (every 45ms) spawn 1600 particles and achieve 100% cleanup with ZERO leaks', () => {
  const env = createMotionSandbox();
  env.loadModule(MOTION_JS_PATH);

  const btn = env.document.createElement('button');
  env.document.body.appendChild(btn);

  let peakParticles = 0;

  // 100 calls, advancing 45ms per call (total 4500ms elapsed)
  for (let i = 0; i < 100; i++) {
    env.window.AVCartCelebration(btn);
    const count = env.document.querySelectorAll('.av-cart-particle').length;
    if (count > peakParticles) peakParticles = count;
    env.advanceTimersByTime(45);
  }

  // During active window, sliding window should be around 16 * ceil(850 / 45) = 16 * 19 = ~304
  assert.ok(peakParticles > 16 && peakParticles <= 320, `Peak concurrent particles must be controlled: got ${peakParticles}`);

  // Now advance time to let remaining bursts expire (850ms + margin)
  env.advanceTimersByTime(900);

  const remaining = env.document.querySelectorAll('.av-cart-particle').length;
  assert.strictEqual(remaining, 0, `All 1,600 spawned particles must be 100% removed, got ${remaining}`);
  assert.strictEqual(env.document.body.children.length, 1, 'Only original button should remain in body');
  assert.strictEqual(env.getActiveTimersCount(), 0, 'Zero pending cleanup timers, zero memory leaks');
});

test('1.5: 100 rapid calls to Store.addToCart() in site.js increment XP, cap qty, and clean up all particles', () => {
  const env = createMotionSandbox({
    initialStorage: { av_cart: '[]', av_xp: '0' }
  });
  env.loadModule(SITE_JS_PATH);
  env.loadModule(MOTION_JS_PATH);

  const cartBadge = env.document.createElement('span');
  cartBadge.className = 'cart-badge';
  env.document.body.appendChild(cartBadge);

  const btn = env.document.createElement('button');
  env.document.body.appendChild(btn);

  assert.ok(env.window.AVStore, 'AVStore must be exported');

  // Perform 100 rapid addToCart calls
  for (let i = 0; i < 100; i++) {
    env.window.AVStore.addToCart(
      { id: 'sp17', name: 'Mô hình Anya Forger', price: 450000, img: 'anh/sp17/sp17_1.webp' },
      btn
    );
    env.advanceTimersByTime(45);
  }

  // Store checks
  const cart = env.window.AVStore.cartGet();
  assert.strictEqual(cart.length, 1, 'Cart must have 1 unique item ID');
  assert.strictEqual(cart[0].qty, 99, 'Quantity must clamp to maximum 99');

  const xp = env.window.AVStore.xpGet();
  assert.strictEqual(xp, 1120, '100 cart additions must award 100 * 10 = 1000 XP (+ 120 baseline)');

  assert.strictEqual(cartBadge.textContent, '99', 'Badge textContent must show 99 when cart item qty is capped at 99');
  assert.ok(cartBadge.classList.contains('has-items'), 'Badge must have has-items class');
  assert.ok(cartBadge.classList.contains('pulse'), 'Badge must have pulse class');

  // Add a second item to exceed 99 threshold (99 + 1 = 100 items)
  env.window.AVStore.addToCart(
    { id: 'sp18', name: 'Mô hình Chainsaw Man', price: 420000, img: 'anh/sp18/sp18_1.webp' },
    btn
  );
  assert.strictEqual(cartBadge.textContent, '99+', 'Badge textContent must show 99+ when total items exceed 99');

  // Advance time past 900ms to allow all particles to clean up
  env.advanceTimersByTime(900);

  const remainingParticles = env.document.querySelectorAll('.av-cart-particle');
  assert.strictEqual(remainingParticles.length, 0, 'All particles from 100 Store additions must be cleaned up');
});

// ============================================================================
// SUITE 2: NULL / UNDEFINED / MALFORMED SOURCE ELEMENT HANDLING
// ============================================================================
console.log('\n--- SUITE 2: NULL / UNDEFINED / MALFORMED SOURCE ELEMENT HANDLING ---');

test('2.1: AVCartCelebration(null) defaults coordinates to (innerWidth/2, innerHeight/2) without throwing', () => {
  const env = createMotionSandbox({ innerWidth: 1920, innerHeight: 1080 });
  env.loadModule(MOTION_JS_PATH);

  assert.doesNotThrow(() => {
    env.window.AVCartCelebration(null);
  }, 'AVCartCelebration(null) must not throw');

  const particles = env.document.querySelectorAll('.av-cart-particle');
  assert.strictEqual(particles.length, 16);

  for (const p of particles) {
    assert.strictEqual(p.style.left, '960px', 'left coordinate must be innerWidth / 2 = 960px');
    assert.strictEqual(p.style.top, '540px', 'top coordinate must be innerHeight / 2 = 540px');
  }

  env.advanceTimersByTime(860);
  assert.strictEqual(env.document.querySelectorAll('.av-cart-particle').length, 0, 'Null-source particles clean up cleanly');
});

test('2.2: Viewport variations: mobile (375x667) and ultrawide (3440x1440) compute exact center coordinates', () => {
  // Mobile
  const envMobile = createMotionSandbox({ innerWidth: 375, innerHeight: 667 });
  envMobile.loadModule(MOTION_JS_PATH);
  envMobile.window.AVCartCelebration(null);
  const pMobile = envMobile.document.querySelectorAll('.av-cart-particle')[0];
  assert.strictEqual(pMobile.style.left, '187.5px');
  assert.strictEqual(pMobile.style.top, '333.5px');

  // Ultrawide
  const envWide = createMotionSandbox({ innerWidth: 3440, innerHeight: 1440 });
  envWide.loadModule(MOTION_JS_PATH);
  envWide.window.AVCartCelebration(null);
  const pWide = envWide.document.querySelectorAll('.av-cart-particle')[0];
  assert.strictEqual(pWide.style.left, '1720px');
  assert.strictEqual(pWide.style.top, '720px');
});

test('2.3: AVCartCelebration(undefined) handles undefined source element safely', () => {
  const env = createMotionSandbox({ innerWidth: 1000, innerHeight: 800 });
  env.loadModule(MOTION_JS_PATH);

  assert.doesNotThrow(() => {
    env.window.AVCartCelebration(undefined);
  });

  const p = env.document.querySelectorAll('.av-cart-particle')[0];
  assert.strictEqual(p.style.left, '500px');
  assert.strictEqual(p.style.top, '400px');
});

test('2.4: AVCartCelebration({}) handles plain object without getBoundingClientRect safely', () => {
  const env = createMotionSandbox({ innerWidth: 800, innerHeight: 600 });
  env.loadModule(MOTION_JS_PATH);

  assert.doesNotThrow(() => {
    env.window.AVCartCelebration({});
  });

  const p = env.document.querySelectorAll('.av-cart-particle')[0];
  assert.strictEqual(p.style.left, '400px');
  assert.strictEqual(p.style.top, '300px');
});

test('2.5: Detached DOM element (not appended to body) spawns and cleans up without errors', () => {
  const env = createMotionSandbox();
  env.loadModule(MOTION_JS_PATH);

  const detached = env.document.createElement('div');
  detached.getBoundingClientRect = () => ({ left: 50, top: 75, width: 100, height: 50 });

  assert.doesNotThrow(() => {
    env.window.AVCartCelebration(detached);
  });

  const particles = env.document.querySelectorAll('.av-cart-particle');
  assert.strictEqual(particles.length, 16);
  assert.strictEqual(particles[0].style.left, '100px'); // 50 + 100/2
  assert.strictEqual(particles[0].style.top, '100px');  // 75 + 50/2

  env.advanceTimersByTime(860);
  assert.strictEqual(env.document.querySelectorAll('.av-cart-particle').length, 0);
});

test('2.6: AVFlyToCart(null, img) handles null source element safely and spawns particles', () => {
  const env = createMotionSandbox({ innerWidth: 1200, innerHeight: 800 });
  env.loadModule(MOTION_JS_PATH);

  const cartNav = env.document.createElement('a');
  cartNav.className = 'cart-nav';
  cartNav.setAttribute('href', 'gio-hang.html');
  cartNav.getBoundingClientRect = () => ({ left: 1100, top: 20, width: 40, height: 40 });
  env.document.body.appendChild(cartNav);

  assert.doesNotThrow(() => {
    env.window.AVFlyToCart(null, 'anh/sp1.webp');
  });

  const particles = env.document.querySelectorAll('.av-cart-particle');
  assert.strictEqual(particles.length, 16, 'Fly to cart must trigger celebratory burst');

  const flyer = env.document.querySelectorAll('.av-motion-flyer');
  assert.strictEqual(flyer.length, 1, 'Flyer element must be created');

  env.advanceTimersByTime(860);
  assert.strictEqual(env.document.querySelectorAll('.av-cart-particle').length, 0);
  assert.strictEqual(env.document.querySelectorAll('.av-motion-flyer').length, 0);
});

// ============================================================================
// SUITE 3: REDUCED-MOTION ACCESSIBILITY SUBSYSTEM
// ============================================================================
console.log('\n--- SUITE 3: REDUCED-MOTION ACCESSIBILITY SUBSYSTEM ---');

test('3.1: When prefers-reduced-motion is true, AVCartCelebration is a no-op and spawns 0 particles', () => {
  const env = createMotionSandbox({ prefersReducedMotion: true });
  env.loadModule(MOTION_JS_PATH);

  const btn = env.document.createElement('button');
  env.document.body.appendChild(btn);

  assert.doesNotThrow(() => {
    env.window.AVCartCelebration(btn);
  });

  const particles = env.document.querySelectorAll('.av-cart-particle');
  assert.strictEqual(particles.length, 0, 'Zero particles spawned under prefers-reduced-motion');
});

test('3.2: When prefers-reduced-motion is true, AVFlyToCart is a no-op and spawns 0 flyers', () => {
  const env = createMotionSandbox({ prefersReducedMotion: true });
  env.loadModule(MOTION_JS_PATH);

  const btn = env.document.createElement('button');
  env.document.body.appendChild(btn);

  assert.doesNotThrow(() => {
    env.window.AVFlyToCart(btn, 'anh/sp1.webp');
  });

  assert.strictEqual(env.document.querySelectorAll('.av-motion-flyer').length, 0, 'Zero flyers spawned');
  assert.strictEqual(env.document.querySelectorAll('.av-cart-particle').length, 0, 'Zero particles spawned');
});

test('3.3: When prefers-reduced-motion is true, AVInitTilt is a no-op and card tilt is bypassed', () => {
  const env = createMotionSandbox({ prefersReducedMotion: true });
  env.loadModule(MOTION_JS_PATH);

  const card = env.document.createElement('div');
  card.className = 'product-card';
  env.document.body.appendChild(card);

  env.window.AVInitTilt(card);

  assert.strictEqual(card.classList.contains('av-motion-tilt'), false, 'av-motion-tilt must NOT be added');
  assert.strictEqual(card._avTiltBound, undefined, 'Tilt listeners must NOT be bound');
});

test('3.4: Coarse pointer guard: on touch devices without fine pointer, card tilt is bypassed', () => {
  const env = createMotionSandbox({
    prefersReducedMotion: false,
    isFinePointer: false // Touch screen / mobile
  });
  env.loadModule(MOTION_JS_PATH);

  const card = env.document.createElement('div');
  card.className = 'product-card';
  env.document.body.appendChild(card);

  env.window.AVInitTilt(card);

  assert.strictEqual(card.classList.contains('av-motion-tilt'), false, 'Tilt must NOT be bound on coarse touch pointer');
});

test('3.5: CSS Audit: css/bundle.css includes complete @media (prefers-reduced-motion: reduce) overrides', () => {
  const bundleCss = fs.readFileSync(BUNDLE_CSS_PATH, 'utf8');

  assert.ok(
    bundleCss.includes('@media (prefers-reduced-motion: reduce)'),
    'bundle.css must contain @media (prefers-reduced-motion: reduce)'
  );

  const reducedBlocks = extractAllBlocks(bundleCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/);
  assert.ok(reducedBlocks.length > 0, 'Must extract reduced-motion blocks from bundle.css');

  const reducedBlock = reducedBlocks.find((b) => b.includes('.av-cart-particle'));
  assert.ok(reducedBlock, 'Must find motion reduced-motion block containing .av-cart-particle');

  // Particle suppression
  assert.ok(
    reducedBlock.includes('.av-cart-particle') && reducedBlock.includes('display: none !important'),
    'Particles must be display: none !important in reduced motion'
  );

  // Tilt suppression
  assert.ok(
    reducedBlock.includes('.av-motion-tilt') && reducedBlock.includes('transform: none !important'),
    'Tilt must be transform: none !important'
  );

  // Badge animation suppression
  assert.ok(
    reducedBlock.includes('.cart-badge') && reducedBlock.includes('animation: none !important'),
    'Badge pulse animation must be none !important'
  );

  // Modal transitions suppression
  assert.ok(
    reducedBlock.includes('.av-backdrop') && reducedBlock.includes('transition: none !important'),
    'Modal transitions must be none !important'
  );
});

// ============================================================================
// SUITE 4: BADGE PULSE KEYFRAME & CSS BUNDLE VERIFICATION
// ============================================================================
console.log('\n--- SUITE 4: BADGE PULSE KEYFRAME & CSS BUNDLE VERIFICATION ---');

test('4.1: Compiled css/bundle.css contains @keyframes avBadgePulse with breathing cycle', () => {
  const bundleCss = fs.readFileSync(BUNDLE_CSS_PATH, 'utf8');

  assert.ok(bundleCss.includes('@keyframes avBadgePulse'), 'Must contain @keyframes avBadgePulse');

  const kfBody = extractBlock(bundleCss, /@keyframes\s+avBadgePulse\s*\{/);
  assert.ok(kfBody, 'avBadgePulse keyframes block must be extracted');

  assert.ok(kfBody.includes('0%, 100%'), 'Must define 0%, 100% stop');
  assert.ok(kfBody.includes('transform: scale(1)'), '0%, 100% must have transform: scale(1)');
  assert.ok(kfBody.includes('50%'), 'Must define 50% breathing peak stop');
  assert.ok(kfBody.includes('transform: scale(1.06)'), '50% must have transform: scale(1.06)');

  // Box shadow Sakura Pastel pink glows
  assert.ok(kfBody.includes('rgba(216, 20, 105, 0.4)'), 'Must include 0.4 sakura shadow');
  assert.ok(kfBody.includes('rgba(225, 29, 116, 0.65)'), 'Must include 0.65 glowing sakura shadow');
});

test('4.2: Selector bindings for avBadgePulse include .badge-pulse, .cart-badge, .av-badge-count', () => {
  const bundleCss = fs.readFileSync(BUNDLE_CSS_PATH, 'utf8');

  const selectors = ['.badge-pulse', '.cart-badge', '.av-badge-count', '.cart-badge.has-items', '.cart-badge.pulse'];
  for (const s of selectors) {
    assert.ok(bundleCss.includes(s), `bundle.css must include selector ${s}`);
  }

  assert.ok(
    bundleCss.includes('animation: avBadgePulse 2.2s ease-in-out infinite'),
    'Must define 2.2s ease-in-out infinite pulse animation'
  );
});

test('4.3: Compiled css/bundle.css contains @keyframes avBadgePop for rapid quantity updates', () => {
  const bundleCss = fs.readFileSync(BUNDLE_CSS_PATH, 'utf8');
  assert.ok(bundleCss.includes('@keyframes avBadgePop'), 'Must contain @keyframes avBadgePop');
  assert.ok(bundleCss.includes('.av-badge-pop'), 'Must contain .av-badge-pop class');
  assert.ok(bundleCss.includes('scale(1.32)'), 'Pop keyframes must scale to 1.32 peak');
});

test('4.4: Compiled css/bundle.css contains @keyframes avCartParticleBurst (0.85s)', () => {
  const bundleCss = fs.readFileSync(BUNDLE_CSS_PATH, 'utf8');
  assert.ok(bundleCss.includes('@keyframes avCartParticleBurst'), 'Must contain @keyframes avCartParticleBurst');
  assert.ok(bundleCss.includes('animation: avCartParticleBurst 0.85s'), 'Must use 0.85s duration');
  assert.ok(bundleCss.includes('var(--tx, 0px)'), 'Keyframes must read --tx');
  assert.ok(bundleCss.includes('var(--ty, -24px)'), 'Keyframes must read --ty');
});

test('4.5: Compiled css/bundle.css contains @keyframes avMotionCartBump (0.5s bounce)', () => {
  const bundleCss = fs.readFileSync(BUNDLE_CSS_PATH, 'utf8');
  assert.ok(bundleCss.includes('@keyframes avMotionCartBump'), 'Must contain @keyframes avMotionCartBump');
  assert.ok(bundleCss.includes('.av-motion-cart-bump'), 'Must contain .av-motion-cart-bump class');
});

test('4.6: css/bundle.css syntax check: token-level brace and parenthesis balance diff = 0', () => {
  const bundleCss = fs.readFileSync(BUNDLE_CSS_PATH, 'utf8');
  const tokens = validateTokens(bundleCss);

  assert.strictEqual(
    tokens.braceOpen,
    tokens.braceClose,
    `Brace mismatch: open ${tokens.braceOpen} != close ${tokens.braceClose}`
  );
  assert.strictEqual(
    tokens.parenOpen,
    tokens.parenClose,
    `Parenthesis mismatch: open ${tokens.parenOpen} != close ${tokens.parenClose}`
  );
});

test('4.7: scripts/bundle_css.py --check exits with code 0 (zero drift between css/ and bundle.css)', () => {
  const res = execSync('python3 scripts/bundle_css.py --check', {
    cwd: ROOT_DIR,
    encoding: 'utf8'
  });
  assert.ok(res.includes('is up to date and valid'), 'Bundle check must report up to date and valid');
});

// ============================================================================
// SUITE 5: MATHEMATICAL SANITY & ADVERSARIAL TILT ROBUSTNESS
// ============================================================================
console.log('\n--- SUITE 5: MATHEMATICAL SANITY & ADVERSARIAL TILT ROBUSTNESS ---');

test('5.1: Monte Carlo 500 particle trajectory physics: zero NaN, zero Infinity, verified upward bias', () => {
  const env = createMotionSandbox();
  env.loadModule(MOTION_JS_PATH);

  const btn = env.document.createElement('button');
  env.document.body.appendChild(btn);

  let totalParticlesChecked = 0;
  let upwardCount = 0;

  for (let burst = 0; burst < 32; burst++) {
    env.advanceTimersByTime(50);
    env.window.AVCartCelebration(btn);

    const particles = env.document.querySelectorAll('.av-cart-particle');
    for (const p of particles) {
      totalParticlesChecked++;
      const txStr = p.style.getPropertyValue('--tx');
      const tyStr = p.style.getPropertyValue('--ty');
      const rotStr = p.style.getPropertyValue('--rot');

      assert.ok(!txStr.includes('NaN'), `--tx must not be NaN: ${txStr}`);
      assert.ok(!tyStr.includes('NaN'), `--ty must not be NaN: ${tyStr}`);
      assert.ok(!rotStr.includes('NaN'), `--rot must not be NaN: ${rotStr}`);

      const txVal = parseFloat(txStr);
      const tyVal = parseFloat(tyStr);
      const rotVal = parseFloat(rotStr);

      assert.ok(Number.isFinite(txVal), `tx must be finite: ${txVal}`);
      assert.ok(Number.isFinite(tyVal), `ty must be finite: ${tyVal}`);
      assert.ok(Number.isFinite(rotVal), `rot must be finite: ${rotVal}`);

      if (tyVal < 0) upwardCount++;
    }

    env.advanceTimersByTime(860);
  }

  assert.strictEqual(totalParticlesChecked, 32 * 16, 'Checked exactly 512 particles');
  assert.ok(upwardCount / totalParticlesChecked >= 0.55, `Particles should have upward bias: ${upwardCount}/${totalParticlesChecked}`);
});

test('5.2: 3D Tilt Math: Center pointer yields 0deg; boundaries clamped to ±8.5deg', () => {
  const env = createMotionSandbox({ isFinePointer: true });
  env.loadModule(MOTION_JS_PATH);

  const card = env.document.createElement('div');
  card.className = 'product-card';
  card.getBoundingClientRect = () => ({
    left: 100,
    top: 100,
    width: 200,
    height: 300,
    right: 300,
    bottom: 400
  });
  env.document.body.appendChild(card);

  env.window.AVInitTilt(card);
  assert.ok(card.classList.contains('av-motion-tilt'));

  // Simulate mouseenter
  card.dispatchEvent('pointerenter');

  // Center pointer: clientX = 200 (100 + 100), clientY = 250 (100 + 150)
  card.dispatchEvent({ type: 'pointermove', clientX: 200, clientY: 250 });
  env.advanceTimersByTime(20); // RAF executes

  assert.strictEqual(parseFloat(card.style.getPropertyValue('--tilt-x')), 0, 'Center rotX must be ~0deg');
  assert.strictEqual(parseFloat(card.style.getPropertyValue('--tilt-y')), 0, 'Center rotY must be ~0deg');
  assert.strictEqual(card.style.getPropertyValue('--glare-opacity'), '0.14', 'Center glare opacity must be baseline 0.14');

  // Extreme top-left pointer: clientX = -500, clientY = -500 (adversarial out-of-bounds)
  card.dispatchEvent({ type: 'pointermove', clientX: -500, clientY: -500 });
  env.advanceTimersByTime(20);

  // Clamped: relX=0, relY=0 -> normX=-1, normY=-1 -> rotX = 8.50deg, rotY = -8.50deg
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '8.50deg', 'RotX clamped to +8.50deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '-8.50deg', 'RotY clamped to -8.50deg');
  assert.strictEqual(card.style.getPropertyValue('--glare-opacity'), '0.18', 'Corner glare opacity must cap at 0.18');

  // Mouse leave
  card.dispatchEvent('pointerleave');
  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '0deg', 'RotX resets to 0deg on leave');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '0deg', 'RotY resets to 0deg on leave');
  assert.strictEqual(card.style.getPropertyValue('--glare-opacity'), '0', 'Glare opacity resets to 0 on leave');
  assert.strictEqual(card.classList.contains('is-tilting'), false, 'is-tilting class removed on leave');
});

test('5.3: Specular glare CSS theme-tuning in motion.css maps Sakura Pastel #e11d74', () => {
  const motionCss = fs.readFileSync(MOTION_CSS_PATH, 'utf8');

  assert.ok(
    motionCss.includes('html[data-theme="sakura"] .av-motion-tilt::after'),
    'motion.css must tune glare for html[data-theme="sakura"]'
  );
  assert.ok(
    motionCss.includes('rgba(225, 29, 116, var(--glare-opacity, 0.14))'),
    'Sakura pastel specular glare must use #e11d74 (225, 29, 116)'
  );
});

// ============================================================================
// TEST SUMMARY & FINAL VERDICT
// ============================================================================
console.log('\n================================================================');
console.log('CHALLENGER M4_2 TEST EXECUTION SUMMARY');
console.log('================================================================');
console.log(`Total Assertions/Tests : ${totalTests}`);
console.log(`Passed                 : ${passedTests}`);
console.log(`Failed                 : ${failedTests.length}`);

if (failedTests.length > 0) {
  console.error('\nFAILED TESTS:');
  for (const f of failedTests) {
    console.error(`- ${f.name}: ${f.error.message}`);
  }
  process.exit(1);
} else {
  console.log('\nVERDICT: ALL TESTS PASSED EMPIRICALLY (APPROVE)');
  process.exit(0);
}
