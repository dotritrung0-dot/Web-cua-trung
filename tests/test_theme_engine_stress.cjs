#!/usr/bin/env node
/**
 * tests/test_theme_engine_stress.cjs
 *
 * EMPIRICAL CHALLENGER AUTOMATED STRESS HARNESS
 * Milestone 2: Quad-Theme Restoration & WCAG AA Contrast
 *
 * Exhaustively stress-tests:
 * 1. Canonical theme rotation (cyber -> gear5 -> sakura -> gojo -> cyber)
 * 2. Alias normalization (exact, hyphenated, merged, mixed case, whitespace)
 * 3. Fault injection: invalid inputs (null, undefined, "", numbers, objects, attack strings)
 * 4. Fault injection: localStorage security/quota errors and _themeMem fallback
 * 5. Event dispatch verification (av:theme-changed payload and propagation)
 * 6. UI Synchronization (#avThemeBtn desktop & mobile label, icon, aria)
 * 7. Full production js/tech.js integration execution
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const TECH_JS_PATH = path.join(ROOT_DIR, 'js', 'tech.js');

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
    console.error(`         ${err.message}`);
  }
}

/**
 * Creates an isolated mock browser environment for testing Theme Engine functions.
 */
function createMockEnvironment(options = {}) {
  const {
    throwOnStorageGet = false,
    throwOnStorageSet = false,
    initialStorage = {},
    innerWidth = 1024,
    hasThemeBtn = true
  } = options;

  const storageData = { ...initialStorage };
  const eventLog = [];

  class MockElement {
    constructor(tag, id = null) {
      this.tagName = tag.toUpperCase();
      this.attributes = new Map();
      this.style = {};
      this.children = [];
      this.innerHTML = '';
      this.title = '';
      this.onclick = null;
      if (id) {
        this.setAttribute('id', id);
      }
    }
    setAttribute(k, v) {
      this.attributes.set(k, String(v));
    }
    getAttribute(k) {
      return this.attributes.has(k) ? this.attributes.get(k) : null;
    }
    removeAttribute(k) {
      this.attributes.delete(k);
    }
    hasAttribute(k) {
      return this.attributes.has(k);
    }
  }

  const docEl = new MockElement('html');
  const bodyEl = new MockElement('body');
  const themeBtn = hasThemeBtn ? new MockElement('button', 'avThemeBtn') : null;

  const listeners = new Map();

  const mockDoc = {
    documentElement: docEl,
    body: bodyEl,
    getElementById: (id) => {
      if (id === 'avThemeBtn') return themeBtn;
      return null;
    },
    createElement: (tag) => new MockElement(tag),
    addEventListener: (type, handler) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener: (type, handler) => {
      if (listeners.has(type)) {
        listeners.set(type, listeners.get(type).filter((h) => h !== handler));
      }
    },
    dispatchEvent: (event) => {
      eventLog.push(event);
      const list = listeners.get(event.type) || [];
      for (const h of list) {
        h(event);
      }
      return true;
    }
  };

  const mockLocalStorage = {
    getItem(k) {
      if (throwOnStorageGet) {
        const err = new Error('The operation is insecure.');
        err.name = 'SecurityError';
        throw err;
      }
      return Object.prototype.hasOwnProperty.call(storageData, k) ? storageData[k] : null;
    },
    setItem(k, v) {
      if (throwOnStorageSet) {
        const err = new Error('QuotaExceededError or SecurityError');
        err.name = 'SecurityError';
        throw err;
      }
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

  const mockWin = {
    document: mockDoc,
    localStorage: mockLocalStorage,
    innerWidth,
    matchMedia: () => ({ matches: false }),
    AVStore: {
      toast: (msg) => { mockWin._lastToast = msg; }
    },
    _lastToast: null
  };
  mockWin.window = mockWin;

  return {
    window: mockWin,
    document: mockDoc,
    themeBtn,
    eventLog,
    storageData,
    listeners
  };
}

/**
 * Extracts and compiles the Theme Engine code block from js/tech.js.
 */
function loadThemeEngineModule(env) {
  const content = fs.readFileSync(TECH_JS_PATH, 'utf8');

  // Match the Theme Engine block between lines ~2010 and ~2145
  const startMarker = 'var THEMES = [';
  const endMarker = 'window.AV_THEMES = THEMES;';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not locate Theme Engine boundaries in js/tech.js');
  }

  const codeChunk = content.substring(startIndex, endIndex + endMarker.length);

  // Wrap in a function that receives window, document, localStorage
  const wrapped = `
    (function(window, document, localStorage, CustomEvent) {
      ${codeChunk}
    })(mockEnv.window, mockEnv.document, mockEnv.window.localStorage, CustomEvent);
  `;

  vm.runInNewContext(wrapped, {
    mockEnv: env,
    CustomEvent: global.CustomEvent,
    Array,
    Object,
    JSON,
    console
  });

  return {
    applyTheme: env.window.applyTheme,
    getTheme: env.window.getTheme,
    AV_THEMES: env.window.AV_THEMES
  };
}

console.log('======================================================================');
console.log('EMPIRICAL CHALLENGER: Theme Engine Automated Stress Harness');
console.log('Target: ' + TECH_JS_PATH);
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// SUITE 1: Canonical Theme Rotation & Invariants
// -----------------------------------------------------------------------------
console.log('Suite 1: Canonical Theme Rotation & Invariants');

test('1.1: AV_THEMES contains exactly 4 canonical themes in contract order', () => {
  const env = createMockEnvironment();
  const engine = loadThemeEngineModule(env);
  const ids = Array.from(engine.AV_THEMES).map((t) => t.id);
  assert.deepStrictEqual([...ids], ['cyber', 'gear5', 'sakura', 'gojo']);
});

test('1.2: Step-by-step canonical rotation sequence (cyber -> gear5 -> sakura -> gojo -> cyber)', () => {
  const env = createMockEnvironment();
  const engine = loadThemeEngineModule(env);

  // Initial is cyber
  assert.strictEqual(engine.getTheme(), 'cyber');
  assert.strictEqual(env.document.documentElement.getAttribute('data-theme'), 'cyber');

  // Simulate rotation logic from Quick Dock onclick
  function rotate() {
    const cur = engine.getTheme();
    let idx = -1;
    for (let i = 0; i < engine.AV_THEMES.length; i++) {
      if (engine.AV_THEMES[i].id === cur) {
        idx = i;
        break;
      }
    }
    const next = engine.AV_THEMES[(idx + 1) % engine.AV_THEMES.length];
    engine.applyTheme(next.id, true);
    return next.id;
  }

  assert.strictEqual(rotate(), 'gear5');
  assert.strictEqual(engine.getTheme(), 'gear5');
  assert.strictEqual(env.document.documentElement.getAttribute('data-theme'), 'gear5');

  assert.strictEqual(rotate(), 'sakura');
  assert.strictEqual(engine.getTheme(), 'sakura');
  assert.strictEqual(env.document.documentElement.getAttribute('data-theme'), 'sakura');

  assert.strictEqual(rotate(), 'gojo');
  assert.strictEqual(engine.getTheme(), 'gojo');
  assert.strictEqual(env.document.documentElement.getAttribute('data-theme'), 'gojo');

  assert.strictEqual(rotate(), 'cyber');
  assert.strictEqual(engine.getTheme(), 'cyber');
  assert.strictEqual(env.document.documentElement.getAttribute('data-theme'), 'cyber');
});

test('1.3: Endurance stress rotation (100 cycles without drift or degradation)', () => {
  const env = createMockEnvironment();
  const engine = loadThemeEngineModule(env);

  const expectedSequence = ['gear5', 'sakura', 'gojo', 'cyber'];

  for (let cycle = 0; cycle < 100; cycle++) {
    const cur = engine.getTheme();
    let idx = -1;
    for (let i = 0; i < engine.AV_THEMES.length; i++) {
      if (engine.AV_THEMES[i].id === cur) {
        idx = i;
        break;
      }
    }
    const next = engine.AV_THEMES[(idx + 1) % engine.AV_THEMES.length];
    engine.applyTheme(next.id, false);

    const expected = expectedSequence[cycle % 4];
    assert.strictEqual(engine.getTheme(), expected, `Drift detected at cycle ${cycle}`);
    assert.strictEqual(env.document.documentElement.getAttribute('data-theme'), expected);
  }
});

test('1.4: Rotation starting from aliased state correctly advances to next canonical', () => {
  const env = createMockEnvironment();
  const engine = loadThemeEngineModule(env);

  // Apply alias 'dark-knight' (which maps to gear5)
  engine.applyTheme('dark-knight', false);
  assert.strictEqual(engine.getTheme(), 'gear5');

  // Rotate once
  const cur = engine.getTheme();
  let idx = -1;
  for (let i = 0; i < engine.AV_THEMES.length; i++) {
    if (engine.AV_THEMES[i].id === cur) {
      idx = i;
      break;
    }
  }
  const next = engine.AV_THEMES[(idx + 1) % engine.AV_THEMES.length];
  engine.applyTheme(next.id, false);
  assert.strictEqual(next.id, 'sakura');
  assert.strictEqual(engine.getTheme(), 'sakura');
});

test('1.5: Rotation recovers safely if storage was somehow corrupted (idx = -1)', () => {
  const env = createMockEnvironment();
  const engine = loadThemeEngineModule(env);

  // Force an unknown theme into storage
  env.storageData['av_theme'] = 'corrupt-alien-theme';

  // Even if getTheme was somehow corrupted, rotation handler uses (-1 + 1) % 4 = 0 -> cyber
  const cur = 'corrupt-alien-theme';
  let idx = -1;
  for (let i = 0; i < engine.AV_THEMES.length; i++) {
    if (engine.AV_THEMES[i].id === cur) {
      idx = i;
      break;
    }
  }
  assert.strictEqual(idx, -1);
  const next = engine.AV_THEMES[(idx + 1) % engine.AV_THEMES.length];
  assert.strictEqual(next.id, 'cyber');
  engine.applyTheme(next.id, false);
  assert.strictEqual(engine.getTheme(), 'cyber');
});

// -----------------------------------------------------------------------------
// SUITE 2: Comprehensive Alias Normalization
// -----------------------------------------------------------------------------
console.log('\nSuite 2: Comprehensive Alias Normalization');

const aliasTestMatrix = [
  // Canonical keys
  ['cyber', 'cyber'],
  ['gear5', 'gear5'],
  ['sakura', 'sakura'],
  ['gojo', 'gojo'],

  // Standard aliases
  ['default', 'cyber'],
  ['dark-knight', 'gear5'],
  ['darkknight', 'gear5'],
  ['sakura-pastel', 'sakura'],
  ['sakurapastel', 'sakura'],
  ['cyber-neon', 'gojo'],
  ['cyberneon', 'gojo'],

  // Case variants
  ['DEFAULT', 'cyber'],
  ['Default', 'cyber'],
  ['dEfAuLt', 'cyber'],
  ['DARK-KNIGHT', 'gear5'],
  ['Dark-Knight', 'gear5'],
  ['dArK-kNiGhT', 'gear5'],
  ['DARKKNIGHT', 'gear5'],
  ['DarkKnight', 'gear5'],
  ['SAKURA-PASTEL', 'sakura'],
  ['Sakura-Pastel', 'sakura'],
  ['SAKURAPASTEL', 'sakura'],
  ['SakuraPastel', 'sakura'],
  ['CYBER-NEON', 'gojo'],
  ['Cyber-Neon', 'gojo'],
  ['CYBERNEON', 'gojo'],
  ['CyberNeon', 'gojo'],
  ['CYBER', 'cyber'],
  ['GEAR5', 'gear5'],
  ['SAKURA', 'sakura'],
  ['GOJO', 'gojo'],
  ['GoJo', 'gojo'],

  // Whitespace variants
  ['  cyber  ', 'cyber'],
  ['\tdark-knight\t', 'gear5'],
  ['\nsakura-pastel\n', 'sakura'],
  ['  cyber-neon  ', 'gojo'],
  ['  default  ', 'cyber'],
  ['  DarkKnight  ', 'gear5'],
  ['  SakuraPastel  ', 'sakura'],
  ['  CyberNeon  ', 'gojo']
];

test(`2.1: All ${aliasTestMatrix.length} alias and case matrix entries normalize correctly`, () => {
  const env = createMockEnvironment();
  const engine = loadThemeEngineModule(env);

  for (const [input, expected] of aliasTestMatrix) {
    engine.applyTheme(input, false);
    const active = engine.getTheme();
    const attr = env.document.documentElement.getAttribute('data-theme');
    const stored = env.storageData['av_theme'];

    assert.strictEqual(
      active,
      expected,
      `Failed to normalize '${input}': got '${active}', expected '${expected}'`
    );
    assert.strictEqual(
      attr,
      expected,
      `DOM data-theme not synced for '${input}': got '${attr}'`
    );
    assert.strictEqual(
      stored,
      expected,
      `localStorage not canonicalized for '${input}': got '${stored}'`
    );
  }
});

// -----------------------------------------------------------------------------
// SUITE 3: Fault Injection & Boundary Values (Adversarial Inputs)
// -----------------------------------------------------------------------------
console.log('\nSuite 3: Fault Injection & Boundary Values (Adversarial Inputs)');

const adversarialInputs = [
  ['null', null],
  ['undefined', undefined],
  ['empty string', ''],
  ['whitespace spaces', '   '],
  ['whitespace tabs and newlines', '\t\r\n'],
  ['number 0', 0],
  ['number 1', 1],
  ['number -1', -1],
  ['number float', 3.14159],
  ['NaN', NaN],
  ['Infinity', Infinity],
  ['boolean true', true],
  ['boolean false', false],
  ['empty object', {}],
  ['object with theme prop', { theme: 'sakura' }],
  ['empty array', []],
  ['array with valid theme', ['gear5']],
  ['function', () => {}],
  ['Symbol', Symbol('theme')],
  ['unknown theme matrix', 'matrix'],
  ['unknown theme dark', 'dark'],
  ['unknown theme light', 'light'],
  ['unknown theme non_existent_99', 'non_existent_99'],
  ['prototype attack __proto__', '__proto__'],
  ['prototype attack constructor', 'constructor'],
  ['prototype attack toString', 'toString'],
  ['prototype attack valueOf', 'valueOf'],
  ['prototype attack hasOwnProperty', 'hasOwnProperty'],
  ['null byte prefix', '\0cyber'],
  ['null byte suffix', 'cyber\0'],
  ['emoji string', '🌸⚡☀️❄️'],
  ['XSS payload', '<script>alert(1)</script>'],
  ['SQL injection fragment', "'; DROP TABLE themes; --"]
];

for (const [desc, val] of adversarialInputs) {
  test(`3.x: Adversarial input '${desc}' gracefully falls back to 'cyber' without throwing`, () => {
    const env = createMockEnvironment();
    const engine = loadThemeEngineModule(env);

    // Should not throw
    assert.doesNotThrow(() => {
      engine.applyTheme(val, false);
    });

    const active = engine.getTheme();
    const attr = env.document.documentElement.getAttribute('data-theme');
    const stored = env.storageData['av_theme'];

    assert.strictEqual(active, 'cyber', `Expected 'cyber', got '${active}' for input '${desc}'`);
    assert.strictEqual(attr, 'cyber');
    assert.strictEqual(stored, 'cyber');
  });
}

// -----------------------------------------------------------------------------
// SUITE 4: Fault Injection — Blocked / Throwing Storage & Memory Fallback
// -----------------------------------------------------------------------------
console.log('\nSuite 4: Fault Injection — Blocked Storage & Memory Fallback');

test('4.1: SecurityError on localStorage.setItem falls back to _themeMem', () => {
  const env = createMockEnvironment({ throwOnStorageSet: true });
  const engine = loadThemeEngineModule(env);

  // Set theme to sakura when localStorage write throws
  assert.doesNotThrow(() => {
    engine.applyTheme('sakura', false);
  });

  // Active theme is remembered via _themeMem
  assert.strictEqual(engine.getTheme(), 'sakura');
  assert.strictEqual(env.document.documentElement.getAttribute('data-theme'), 'sakura');
});

test('4.2: SecurityError on localStorage.getItem falls back to _themeMem', () => {
  const env = createMockEnvironment({ throwOnStorageGet: true });
  const engine = loadThemeEngineModule(env);

  // Set theme to gojo
  engine.applyTheme('gojo', false);

  // getTheme throws on getItem, but falls back to _themeMem
  assert.doesNotThrow(() => {
    const theme = engine.getTheme();
    assert.strictEqual(theme, 'gojo');
  });
});

test('4.3: Both getItem and setItem throw SecurityError: complete memory lifecycle', () => {
  const env = createMockEnvironment({
    throwOnStorageGet: true,
    throwOnStorageSet: true
  });
  const engine = loadThemeEngineModule(env);

  // Sequence of theme switches
  const themesToTest = ['gear5', 'sakura', 'gojo', 'cyber', 'gear5'];
  for (const t of themesToTest) {
    assert.doesNotThrow(() => {
      engine.applyTheme(t, false);
    });
    assert.strictEqual(engine.getTheme(), t);
    assert.strictEqual(env.document.documentElement.getAttribute('data-theme'), t);
  }
});

test('4.4: Storage blocked, initial getTheme() defaults safely to cyber', () => {
  const env = createMockEnvironment({ throwOnStorageGet: true });
  // Do NOT apply theme yet, just check getTheme() with empty _themeMem
  const engine = loadThemeEngineModule(env);
  assert.strictEqual(engine.getTheme(), 'cyber');
});

// -----------------------------------------------------------------------------
// SUITE 5: CustomEvent 'av:theme-changed' Event Dispatching
// -----------------------------------------------------------------------------
console.log('\nSuite 5: CustomEvent av:theme-changed Dispatching');

test('5.1: av:theme-changed dispatches on document with correct detail payload', () => {
  const env = createMockEnvironment();
  const engine = loadThemeEngineModule(env);

  let capturedEvent = null;
  env.document.addEventListener('av:theme-changed', (e) => {
    capturedEvent = e;
  });

  engine.applyTheme('gear5', false);

  assert.ok(capturedEvent, 'Event av:theme-changed was not dispatched');
  assert.strictEqual(capturedEvent.type, 'av:theme-changed');
  assert.ok(capturedEvent.bubbles, 'Event should bubble');
  assert.ok(capturedEvent.cancelable, 'Event should be cancelable');
  assert.strictEqual(capturedEvent.detail && capturedEvent.detail.theme, 'gear5');
});

test('5.2: Event detail carries CANONICAL theme when alias is passed', () => {
  const env = createMockEnvironment();
  const engine = loadThemeEngineModule(env);

  const capturedDetails = [];
  env.document.addEventListener('av:theme-changed', (e) => {
    capturedDetails.push(e.detail && e.detail.theme);
  });

  engine.applyTheme('dark-knight', false);
  engine.applyTheme('sakura-pastel', false);
  engine.applyTheme('cyber-neon', false);
  engine.applyTheme('default', false);

  assert.deepStrictEqual([...capturedDetails], ['gear5', 'sakura', 'gojo', 'cyber']);
});

test('5.3: Event detail carries CANONICAL cyber when invalid input is passed', () => {
  const env = createMockEnvironment();
  const engine = loadThemeEngineModule(env);

  let lastDetail = null;
  env.document.addEventListener('av:theme-changed', (e) => {
    lastDetail = e.detail;
  });

  engine.applyTheme(null, false);
  assert.strictEqual(lastDetail && lastDetail.theme, 'cyber');

  engine.applyTheme('completely-invalid-theme-xyz', false);
  assert.strictEqual(lastDetail && lastDetail.theme, 'cyber');
});

test('5.4: Exactly 1 event dispatched per applyTheme invocation', () => {
  const env = createMockEnvironment();
  const engine = loadThemeEngineModule(env);

  let eventCount = 0;
  env.document.addEventListener('av:theme-changed', () => {
    eventCount++;
  });

  engine.applyTheme('sakura', false);
  assert.strictEqual(eventCount, 1);

  engine.applyTheme('gojo', false);
  assert.strictEqual(eventCount, 2);
});

// -----------------------------------------------------------------------------
// SUITE 6: UI Synchronization & Quick Dock Button State
// -----------------------------------------------------------------------------
console.log('\nSuite 6: UI Synchronization & Quick Dock Button State');

test('6.1: #avThemeBtn updates emoji and label on desktop (innerWidth > 768)', () => {
  const env = createMockEnvironment({ innerWidth: 1024, hasThemeBtn: true });
  const engine = loadThemeEngineModule(env);

  engine.applyTheme('cyber', false);
  assert.strictEqual(env.themeBtn.innerHTML, '⚡<small>Giao diện</small>');
  assert.ok(env.themeBtn.title.includes('Mặc định'));
  assert.ok(env.themeBtn.getAttribute('aria-label').includes('Mặc định'));

  engine.applyTheme('gear5', false);
  assert.strictEqual(env.themeBtn.innerHTML, '☀️<small>Giao diện</small>');
  assert.ok(env.themeBtn.title.includes('Dark Knight'));

  engine.applyTheme('sakura', false);
  assert.strictEqual(env.themeBtn.innerHTML, '🌸<small>Giao diện</small>');
  assert.ok(env.themeBtn.title.includes('Sakura'));

  engine.applyTheme('gojo', false);
  assert.strictEqual(env.themeBtn.innerHTML, '❄️<small>Giao diện</small>');
  assert.ok(env.themeBtn.title.includes('Cyber Neon'));
});

test('6.2: #avThemeBtn updates label on mobile (innerWidth <= 768)', () => {
  const env = createMockEnvironment({ innerWidth: 480, hasThemeBtn: true });
  const engine = loadThemeEngineModule(env);

  engine.applyTheme('sakura', false);
  assert.strictEqual(env.themeBtn.innerHTML, '🌸<small>Chủ đề</small>');
});

test('6.3: applyTheme operates safely when #avThemeBtn is absent in DOM (null check)', () => {
  const env = createMockEnvironment({ hasThemeBtn: false });
  const engine = loadThemeEngineModule(env);

  assert.doesNotThrow(() => {
    engine.applyTheme('gear5', false);
    engine.applyTheme('sakura', true);
  });
  assert.strictEqual(engine.getTheme(), 'gear5' === 'gear5' ? 'sakura' : 'gear5');
  assert.strictEqual(env.document.documentElement.getAttribute('data-theme'), 'sakura');
});

test('6.4: Toast notification triggered when notify = true and Store.toast exists', () => {
  const env = createMockEnvironment();
  const engine = loadThemeEngineModule(env);

  // notify = false
  env.window._lastToast = null;
  engine.applyTheme('gear5', false);
  assert.strictEqual(env.window._lastToast, null);

  // notify = true
  engine.applyTheme('sakura', true);
  assert.ok(env.window._lastToast && env.window._lastToast.includes('Sakura Pastel'));
});

// -----------------------------------------------------------------------------
// SUITE 7: Full js/tech.js Integration Execution
// -----------------------------------------------------------------------------
console.log('\nSuite 7: Full js/tech.js Integration Execution');

test('7.1: Entire un-shimmed production js/tech.js evaluates with 0 exceptions', () => {
  const elementsById = new Map();
  const eventListeners = new Map();

  class MockElement {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.attributes = new Map();
      this.children = [];
      this.style = {};
      this.dataset = {};
      this._innerHTML = '';
      this._textContent = '';
    }
    setAttribute(k, v) {
      this.attributes.set(k, String(v));
      if (k === 'id') elementsById.set(v, this);
    }
    getAttribute(k) {
      return this.attributes.has(k) ? this.attributes.get(k) : null;
    }
    removeAttribute(k) {
      this.attributes.delete(k);
    }
    hasAttribute(k) {
      return this.attributes.has(k);
    }
    get id() {
      return this.getAttribute('id') || '';
    }
    set id(v) {
      this.setAttribute('id', v);
    }
    get innerHTML() {
      return this._innerHTML;
    }
    set innerHTML(html) {
      this._innerHTML = html;
      const regex = /id=["\']([^"\']+)["\']/g;
      let m;
      while ((m = regex.exec(html)) !== null) {
        const child = new MockElement('div');
        child.id = m[1];
        elementsById.set(m[1], child);
      }
    }
    get textContent() {
      return this._textContent;
    }
    set textContent(v) {
      this._textContent = v;
    }
    appendChild(c) {
      this.children.push(c);
      return c;
    }
    removeChild(c) {
      const i = this.children.indexOf(c);
      if (i >= 0) this.children.splice(i, 1);
      return c;
    }
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() {
      return true;
    }
    focus() {}
    select() {}
    contains() {
      return false;
    }
    getContext() {
      return {
        clearRect: () => {},
        fillRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        drawImage: () => {}
      };
    }
  }

  const docElement = new MockElement('html');
  const bodyElement = new MockElement('body');

  const mockDoc = {
    documentElement: docElement,
    body: bodyElement,
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => elementsById.get(id) || null,
    querySelector: (s) => {
      if (s.startsWith('#')) {
        const id = s.slice(1);
        return elementsById.get(id) || null;
      }
      return null;
    },
    querySelectorAll: () => [],
    addEventListener: (e, h) => {
      if (!eventListeners.has(e)) eventListeners.set(e, []);
      eventListeners.get(e).push(h);
    },
    removeEventListener: () => {},
    dispatchEvent: (e) => {
      const list = eventListeners.get(e.type) || [];
      for (const h of list) h(e);
      return true;
    }
  };

  const mockWindow = {
    document: mockDoc,
    innerWidth: 1024,
    innerHeight: 768,
    matchMedia: () => ({ matches: true }),
    addEventListener: () => {},
    removeEventListener: () => {},
    location: { protocol: 'file:' },
    navigator: {},
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    performance: { now: () => Date.now() },
    localStorage: {
      _data: {},
      getItem(k) {
        return this._data[k] || null;
      },
      setItem(k, v) {
        this._data[k] = String(v);
      },
      removeItem(k) {
        delete this._data[k];
      },
      clear() {
        this._data = {};
      }
    }
  };
  mockWindow.window = mockWindow;

  const code = fs.readFileSync(TECH_JS_PATH, 'utf8');

  assert.doesNotThrow(() => {
    vm.runInNewContext(code, {
      ...mockWindow,
      window: mockWindow,
      document: mockDoc,
      localStorage: mockWindow.localStorage,
      CustomEvent: global.CustomEvent,
      console: console,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setInterval: setInterval,
      clearInterval: clearInterval
    });
  });

  // Verify exported API
  assert.strictEqual(typeof mockWindow.applyTheme, 'function');
  assert.strictEqual(typeof mockWindow.getTheme, 'function');
  assert.ok(Array.isArray(mockWindow.AV_THEMES));
  assert.strictEqual(mockWindow.AV_THEMES.length, 4);

  // Verify initial theme applied
  assert.strictEqual(mockWindow.getTheme(), 'cyber');
  assert.strictEqual(docElement.getAttribute('data-theme'), 'cyber');
  assert.strictEqual(mockWindow.localStorage.getItem('av_theme'), 'cyber');

  // Verify applying theme via exported API
  mockWindow.applyTheme('sakura-pastel', false);
  assert.strictEqual(mockWindow.getTheme(), 'sakura');
  assert.strictEqual(docElement.getAttribute('data-theme'), 'sakura');
  assert.strictEqual(mockWindow.localStorage.getItem('av_theme'), 'sakura');
});

console.log('\n======================================================================');
console.log(`STRESS HARNESS COMPLETED`);
console.log(`Total Tests : ${totalTests}`);
console.log(`Passed      : ${passedTests}`);
console.log(`Failed      : ${failedTests.length}`);
console.log('======================================================================\n');

if (failedTests.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
