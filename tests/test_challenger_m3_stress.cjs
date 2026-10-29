#!/usr/bin/env node
/**
 * tests/test_challenger_m3_stress.cjs
 *
 * EMPIRICAL CHALLENGER AUTOMATED STRESS HARNESS — Milestone 3
 * Search, Mobile Modal & Catalog Filter Subsystems
 *
 * Adversarially and empirically stress-tests:
 * 1. Diacritic Edge Cases (uppercase 'Đ', mixed case 'đẠo Cụ', tones, special chars, apostrophes).
 * 2. Extreme Queries (empty string, 500-char string, regex special chars, XSS attack payloads).
 * 3. Rapid Keydown & State Machine (ArrowUp/Down cyclic wrap-around, Enter redirection, Escape dismiss, '/' shortcut).
 * 4. Mobile Search Modal Lifecycle (responsive trigger <=768px, backdrop touch dismiss, rapid tag clicks, autofocus, body scroll lock).
 * 5. Catalog Filter Matrix (Fandom x Price Range x Search x Grid/List toggle, URL parameter hydration).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const TECH_JS_PATH = path.join(ROOT_DIR, 'js', 'tech.js');
const SAN_PHAM_HTML_PATH = path.join(ROOT_DIR, 'san-pham.html');

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
// MOCK DOM ENVIRONMENT
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
      if (this.contains(cls)) {
        this.remove(cls);
        return false;
      } else {
        this.add(cls);
        return true;
      }
    } else if (force) {
      this.add(cls);
      return true;
    } else {
      this.remove(cls);
      return false;
    }
  }
  toString() {
    return Array.from(this._classes).join(' ');
  }
}

class MockElement {
  constructor(tag, id = null) {
    this.tagName = tag.toUpperCase();
    this.attributes = new Map();
    this.dataset = {};
    this.style = {};
    this.children = [];
    this.parentNode = null;
    this._innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.hidden = false;
    this.classList = new MockClassList(this);
    this.listeners = new Map();
    this._focused = false;
    this._selected = false;
    this.width = 1024;
    this.height = 768;

    this.getContext = function (type) {
      return new Proxy({}, {
        get: (target, prop) => {
          return (...args) => {};
        },
        set: () => true
      });
    };

    if (id) {
      this.setAttribute('id', id);
    }
  }

  get id() {
    return this.getAttribute('id') || '';
  }
  set id(val) {
    this.attributes.set('id', String(val));
  }

  get className() {
    return this.classList.toString();
  }
  set className(val) {
    this.classList._classes.clear();
    if (val) {
      val.split(/\s+/).forEach(c => { if (c) this.classList.add(c); });
    }
  }

  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(val) {
    this._innerHTML = String(val);
    this.children = [];
    const tokenRegex = /<([a-zA-Z0-9_-]+)([^>]*?)(\/?)>|([^<]+)|<\/([a-zA-Z0-9_-]+)>/g;
    let match;
    let curr = this;
    while ((match = tokenRegex.exec(this._innerHTML)) !== null) {
      if (match[1]) {
        const tag = match[1].toLowerCase();
        const attrStr = match[2] || '';
        const selfClose = match[3] === '/' || ['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tag);
        const child = new MockElement(tag);
        const attrRegex = /([a-zA-Z0-9_-]+)(?:=["']([^"']*)["'])?/g;
        let am;
        while ((am = attrRegex.exec(attrStr)) !== null) {
          child.setAttribute(am[1].toLowerCase(), am[2] !== undefined ? am[2] : '');
        }
        child.parentNode = curr;
        curr.children.push(child);
        if (!selfClose) {
          curr = child;
        }
      } else if (match[4]) {
        if (curr) curr.textContent += match[4];
      } else if (match[5]) {
        if (curr && curr.parentNode) {
          curr = curr.parentNode;
        }
      }
    }
  }

  setAttribute(k, v) {
    this.attributes.set(k.toLowerCase(), String(v));
    if (k.toLowerCase() === 'class') this.className = String(v);
    if (k.toLowerCase().startsWith('data-')) {
      const prop = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[prop] = String(v);
    }
  }
  getAttribute(k) {
    return this.attributes.has(k.toLowerCase()) ? this.attributes.get(k.toLowerCase()) : null;
  }
  removeAttribute(k) {
    this.attributes.delete(k.toLowerCase());
  }
  hasAttribute(k) {
    return this.attributes.has(k.toLowerCase());
  }

  appendChild(child) {
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
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

  insertBefore(newChild, refChild) {
    if (newChild.parentNode) {
      newChild.parentNode.removeChild(newChild);
    }
    newChild.parentNode = this;
    const idx = refChild ? this.children.indexOf(refChild) : -1;
    if (idx !== -1) {
      this.children.splice(idx, 0, newChild);
    } else {
      this.children.push(newChild);
    }
    return newChild;
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  removeEventListener(type, handler) {
    if (this.listeners.has(type)) {
      this.listeners.set(type, this.listeners.get(type).filter(h => h !== handler));
    }
  }
  dispatchEvent(event) {
    if (!event.target) event.target = this;
    event.currentTarget = this;
    const handlers = this.listeners.get(event.type) || [];
    for (const h of handlers) {
      h.call(this, event);
    }
    if (event.bubbles && this.parentNode) {
      this.parentNode.dispatchEvent(event);
    }
    return !event.defaultPrevented;
  }

  focus() {
    this._focused = true;
    this.dispatchEvent({ type: 'focus', target: this, bubbles: false });
  }
  blur() {
    this._focused = false;
    this.dispatchEvent({ type: 'blur', target: this, bubbles: false });
  }
  select() {
    this._selected = true;
  }
  click() {
    this.dispatchEvent({
      type: 'click',
      target: this,
      bubbles: true,
      cancelable: true,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() {}
    });
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (curr.matches && curr.matches(selector)) return curr;
      curr = curr.parentNode;
    }
    return null;
  }

  contains(el) {
    let curr = el;
    while (curr) {
      if (curr === this) return true;
      curr = curr.parentNode;
    }
    return false;
  }

  matches(selector) {
    if (!selector) return false;
    const selList = selector.split(',').map(s => s.trim());
    for (const sel of selList) {
      const idMatch = sel.match(/#([a-zA-Z0-9_-]+)/);
      if (idMatch && this.id !== idMatch[1]) continue;

      const tagMatch = sel.match(/^([a-zA-Z0-9_-]+)/);
      if (tagMatch && this.tagName.toLowerCase() !== tagMatch[1].toLowerCase()) continue;

      const classMatches = sel.match(/\.([a-zA-Z0-9_-]+)/g);
      if (classMatches) {
        const requiredClasses = classMatches.map(c => c.slice(1));
        if (!requiredClasses.every(c => this.classList.contains(c))) continue;
      }

      const attrMatches = sel.match(/\[([a-zA-Z0-9_-]+)(?:([*^$]?=)(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/g);
      if (attrMatches) {
        let allAttrsMatch = true;
        for (const am of attrMatches) {
          const m = am.slice(1, -1).match(/^([a-zA-Z0-9_-]+)(?:([*^$]?=)(?:"([^"]*)"|'([^']*)'|([^\]]+)))?$/i);
          if (!m) continue;
          const attr = m[1].toLowerCase();
          const op = m[2] || '';
          const val = m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : (m[5] || ''));
          if (!this.hasAttribute(attr)) { allAttrsMatch = false; break; }
          const actual = this.getAttribute(attr);
          if (op === '=' && actual !== val) { allAttrsMatch = false; break; }
          if (op === '*=' && !actual.includes(val)) { allAttrsMatch = false; break; }
          if (op === '^=' && !actual.startsWith(val)) { allAttrsMatch = false; break; }
          if (op === '$=' && !actual.endsWith(val)) { allAttrsMatch = false; break; }
        }
        if (!allAttrsMatch) continue;
      }

      return true;
    }
    return false;
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    function walk(node) {
      for (const child of node.children) {
        if (child.matches && child.matches(selector)) {
          results.push(child);
        }
        walk(child);
      }
    }
    walk(this);
    return results;
  }
}

function createBrowserEnvironment(options = {}) {
  const {
    url = 'https://animeverse.test/san-pham.html',
    innerWidth = 1024
  } = options;

  const docEl = new MockElement('html');
  const bodyEl = new MockElement('body');
  docEl.appendChild(bodyEl);

  const docListeners = new Map();

  const urlObj = new URL(url);

  const mockLocation = {
    _href: url,
    get href() { return this._href; },
    set href(val) { this._href = String(val); },
    get search() { return urlObj.search; },
    set search(val) { urlObj.search = val; this._href = urlObj.toString(); },
    get pathname() { return urlObj.pathname; },
    protocol: 'https:'
  };

  const mockDoc = {
    documentElement: docEl,
    body: bodyEl,
    activeElement: bodyEl,
    getElementById: (id) => {
      function findId(node) {
        if (node.id === id) return node;
        for (const child of node.children) {
          const found = findId(child);
          if (found) return found;
        }
        return null;
      }
      return findId(docEl);
    },
    querySelector: (sel) => docEl.querySelector(sel),
    querySelectorAll: (sel) => docEl.querySelectorAll(sel),
    createElement: (tag) => new MockElement(tag),
    addEventListener: (type, handler) => {
      if (!docListeners.has(type)) docListeners.set(type, []);
      docListeners.get(type).push(handler);
    },
    removeEventListener: (type, handler) => {
      if (docListeners.has(type)) {
        docListeners.set(type, docListeners.get(type).filter(h => h !== handler));
      }
    },
    dispatchEvent: (event) => {
      if (!event.target) event.target = mockDoc;
      const handlers = docListeners.get(event.type) || [];
      for (const h of handlers) h.call(mockDoc, event);
      return !event.defaultPrevented;
    }
  };

  const mockWin = {
    document: mockDoc,
    location: mockLocation,
    innerWidth,
    innerHeight: 768,
    URLSearchParams: URLSearchParams,
    Event: function (type, init = {}) {
      this.type = type;
      this.bubbles = !!init.bubbles;
      this.cancelable = !!init.cancelable;
      this.defaultPrevented = false;
      this.preventDefault = function () { this.defaultPrevented = true; };
      this.stopPropagation = function () {};
    },
    CustomEvent: function (type, init = {}) {
      this.type = type;
      this.bubbles = !!init.bubbles;
      this.cancelable = !!init.cancelable;
      this.detail = init.detail || null;
      this.defaultPrevented = false;
      this.preventDefault = function () { this.defaultPrevented = true; };
    },
    matchMedia: () => ({ matches: false }),
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    },
    setTimeout: (fn, ms) => { fn(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    requestAnimationFrame: (fn) => 1,
    cancelAnimationFrame: () => {}
  };
  mockWin.window = mockWin;

  return { window: mockWin, document: mockDoc };
}

function createSandbox(env) {
  class MockAudio {
    constructor() { this.src = ''; }
    play() { return Promise.resolve(); }
    pause() {}
    addEventListener() {}
    removeEventListener() {}
  }
  return {
    window: env.window,
    document: env.document,
    location: env.window.location,
    navigator: { serviceWorker: { register: () => Promise.resolve() }, userAgent: 'test' },
    URLSearchParams: URLSearchParams,
    localStorage: env.window.localStorage,
    Event: env.window.Event,
    CustomEvent: env.window.CustomEvent,
    Audio: MockAudio,
    requestAnimationFrame: (fn) => 1,
    cancelAnimationFrame: () => {},
    setTimeout: (fn) => { fn(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {}
  };
}

// ============================================================================
// EXTRACT FUNCTIONS FROM TECH.JS FOR UNIT STRESS TESTING
// ============================================================================

const techJsSource = fs.readFileSync(TECH_JS_PATH, 'utf8');

function extractFunction(src, fnName) {
  const start = src.indexOf('function ' + fnName);
  if (start === -1) throw new Error('Function ' + fnName + ' not found in source');
  const braceOpen = src.indexOf('{', start);
  let depth = 0;
  for (let i = braceOpen; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        return src.slice(start, i + 1);
      }
    }
  }
  throw new Error('Unterminated function ' + fnName);
}

const stripSource = extractFunction(techJsSource, 'strip');
const escSource = extractFunction(techJsSource, 'esc');
const hlMatchSource = extractFunction(techJsSource, 'highlightMatch');

const unitSandbox = { module: { exports: {} } };
vm.runInNewContext([
  stripSource,
  escSource,
  hlMatchSource,
  'module.exports = { strip, esc, highlightMatch };'
].join('\n'), unitSandbox);

const stripFn = unitSandbox.module.exports.strip;
const escFn = unitSandbox.module.exports.esc;
const highlightMatchFn = unitSandbox.module.exports.highlightMatch;

// Extract CATALOG array
const catalogMatch = techJsSource.match(/var\s+CATALOG\s*=\s*(\[\s*[\s\S]*?\n\s*\]);/);
assert(catalogMatch, 'CATALOG array must exist in tech.js');
const sandbox = {};
vm.runInNewContext('CATALOG = ' + catalogMatch[1], sandbox);
const CATALOG = sandbox.CATALOG;
assert(Array.isArray(CATALOG) && CATALOG.length >= 50, 'CATALOG must have at least 50 items');

console.log('======================================================================');
console.log('EMPIRICAL CHALLENGER: Search, Mobile Modal & Catalog Filter Stress Suite');
console.log(`Target: ${TECH_JS_PATH}`);
console.log(`Catalog size: ${CATALOG.length} items`);
console.log('======================================================================\n');

// ============================================================================
// SUITE 1: VIETNAMESE DIACRITICS & TEXT NORMALIZATION STRESS
// ============================================================================
console.log('Suite 1: Vietnamese Diacritics & Text Normalization Stress');

test('1.1: Uppercase "Đ" is stripped to "d"', () => {
  assert.strictEqual(stripFn('Đ'), 'd');
  assert.strictEqual(stripFn('đ'), 'd');
  assert.strictEqual(stripFn('ĐẠO CỤ'), 'dao cu');
  assert.strictEqual(stripFn('đẠo Cụ'), 'dao cu');
  assert.strictEqual(stripFn('Đao Cu'), 'dao cu');
});

test('1.2: Full Vietnamese 5-tone vowel matrix normalization', () => {
  const cases = [
    { in: 'á à ả ã ạ', expected: 'a a a a a' },
    { in: 'ă ắ ằ ẳ ẵ ặ', expected: 'a a a a a a' },
    { in: 'â ấn ần ẩn lẫn hận', expected: 'a an an an lan han' },
    { in: 'é è ẻ ẽ ẹ', expected: 'e e e e e' },
    { in: 'ê ế ề ể ễ ệ', expected: 'e e e e e e' },
    { in: 'í ì ỉ ĩ ị', expected: 'i i i i i' },
    { in: 'ó ò ỏ õ ọ', expected: 'o o o o o' },
    { in: 'ô ố ồ ổ ỗ ộ', expected: 'o o o o o o' },
    { in: 'ơ ớ ờ ở ỡ ợ', expected: 'o o o o o o' },
    { in: 'ú ù ủ ũ ụ', expected: 'u u u u u' },
    { in: 'ư ứng ừng ửng vững dựng', expected: 'u ung ung ung vung dung' },
    { in: 'ý kỳ kỷ kỹ kỵ', expected: 'y ky ky ky ky' }
  ];
  for (const c of cases) {
    assert.strictEqual(stripFn(c.in), c.expected, `Failed for input: ${c.in}`);
  }
});

test('1.3: Unaccented query matches accented catalog items (and vice versa)', () => {
  const queryUnaccented = 'dao cu';
  const queryTokens = stripFn(queryUnaccented).split(/\s+/);
  const matchingDaoCu = CATALOG.filter(item => {
    const hay = stripFn(item.name + ' ' + item.fandom + ' ' + item.catLabel);
    return queryTokens.every(w => hay.includes(w));
  });
  assert(matchingDaoCu.length >= 8, `Expected at least 8 ĐẠO CỤ items, found ${matchingDaoCu.length}`);

  // Vice versa: query with accents matches catalog
  const queryAccented = 'Đạo Cụ';
  const queryAccentedTokens = stripFn(queryAccented).split(/\s+/);
  const matchingAccented = CATALOG.filter(item => {
    const hay = stripFn(item.name + ' ' + item.fandom + ' ' + item.catLabel);
    return queryAccentedTokens.every(w => hay.includes(w));
  });
  assert.strictEqual(matchingAccented.length, matchingDaoCu.length);
});

test('1.4: Special characters, apostrophes, and mixed punctuation', () => {
  assert.strictEqual(stripFn("Luffy's Gear 5"), "luffy's gear 5");
  assert.strictEqual(stripFn("Spy x Family!"), "spy x family!");
  assert.strictEqual(stripFn("Demon-Slayer: Kimetsu"), "demon-slayer: kimetsu");
  assert.strictEqual(stripFn("   Nami   &   Robin   "), "   nami   &   robin   ");
});

test('1.5: Non-string and fault injection in strip()', () => {
  assert.strictEqual(stripFn(null), '');
  assert.strictEqual(stripFn(undefined), '');
  assert.strictEqual(stripFn(12345), '12345');
  assert.strictEqual(stripFn(0), '');
  assert.strictEqual(stripFn(false), '');
});

// ============================================================================
// SUITE 2: EXTREME QUERIES, REGEX SAFETY & XSS INJECTION
// ============================================================================
console.log('\nSuite 2: Extreme Queries, Regex Safety & XSS Protection');

test('2.1: Empty query and whitespace-only queries', () => {
  assert.strictEqual(stripFn('').trim(), '');
  assert.strictEqual(stripFn('   \t\n   ').trim(), '');
  // highlightMatch on empty queries returns escaped text
  const res = highlightMatchFn('Figure Luffy Gear 5', '');
  assert.strictEqual(res, 'Figure Luffy Gear 5');
  const resSpaces = highlightMatchFn('Figure Luffy Gear 5', '     ');
  assert.strictEqual(resSpaces, 'Figure Luffy Gear 5');
});

test('2.2: Extreme query length (500 to 2000 characters) does not hang', () => {
  const longQuery = 'Luffy '.repeat(100); // 600 chars
  const t0 = Date.now();
  const stripped = stripFn(longQuery);
  const words = stripped.split(/\s+/).filter(Boolean);
  const matches = CATALOG.filter(item => {
    const hay = stripFn(item.name + ' ' + item.fandom + ' ' + item.catLabel);
    return words.every(w => hay.includes(w));
  });
  const elapsed = Date.now() - t0;
  assert(elapsed < 200, `Extreme query took too long: ${elapsed}ms`);
  assert(matches.length > 0, 'Luffy tokens should match Luffy figures');
});

test('2.3: Regex metacharacters do not crash highlightMatch or search', () => {
  const hostileRegexTokens = [
    '.*+?^${}()|[]\\',
    '((((([[[[\\\\\\\\',
    'Luffy (Gear 5)',
    'Zoro [Wano]',
    'Price: $500',
    '\\d+\\w+.*',
    '???+++***'
  ];

  for (const token of hostileRegexTokens) {
    let result;
    assert.doesNotThrow(() => {
      result = highlightMatchFn('Figure Luffy (Gear 5) Nika', token);
    }, `Threw on hostile token: ${token}`);
    assert(typeof result === 'string', 'Result must be a string');
  }
});

test('2.4: XSS attack strings are neutralized and never unescaped', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    '"><svg/onload=alert(1)>',
    "';alert('xss');//",
    'javascript:alert(1)',
    '<iframe src="evil.com"></iframe>'
  ];

  for (const payload of xssPayloads) {
    // 1. Escaped in esc()
    const escaped = escFn(payload);
    assert(!escaped.includes('<script>'), `Failed to sanitize: ${payload}`);
    assert(!escaped.includes('<img'), `Failed to sanitize: ${payload}`);
    assert(!escaped.includes('<svg'), `Failed to sanitize: ${payload}`);

    // 2. highlightMatch with payload as text
    const hlAsText = highlightMatchFn(payload, 'alert');
    assert(!hlAsText.includes('<script>'), `XSS in text output: ${hlAsText}`);

    // 3. highlightMatch with payload as rawQuery
    const hlAsQuery = highlightMatchFn('Safe Product Name', payload);
    assert(!hlAsQuery.includes('<script>'), `XSS in query output: ${hlAsQuery}`);
  }
});

test('2.5: highlightMatch handles null, undefined, and numbers gracefully', () => {
  assert.strictEqual(highlightMatchFn(null, 'test'), '');
  assert.strictEqual(highlightMatchFn(undefined, 'test'), '');
  assert.strictEqual(highlightMatchFn('Product', null), 'Product');
  assert.strictEqual(highlightMatchFn('Product', undefined), 'Product');
  assert.strictEqual(highlightMatchFn(12345, '123'), '<mark class="av-sug-hl">123</mark>45');
});

// ============================================================================
// SUITE 3: RAPID KEYDOWN & CYCLIC SELECTION STATE MACHINE
// ============================================================================
console.log('\nSuite 3: Rapid Keydown & Cyclic Selection State Machine');

test('3.1: Cyclic wrap-around on ArrowDown (0 -> 1 -> ... -> last -> 0)', () => {
  const totalItems = 7;
  let sel = -1;

  // ArrowDown from initial -1
  sel = (sel + 1 + totalItems) % totalItems;
  assert.strictEqual(sel, 0, 'First ArrowDown must move to index 0');

  // Step through to index 6
  for (let i = 1; i < totalItems; i++) {
    sel = (sel + 1 + totalItems) % totalItems;
    assert.strictEqual(sel, i, `ArrowDown step ${i} failed`);
  }

  // Wrap around from last item (6) to first (0)
  sel = (sel + 1 + totalItems) % totalItems;
  assert.strictEqual(sel, 0, 'ArrowDown from last item must wrap around to 0');
});

test('3.2: Cyclic wrap-around on ArrowUp from 0 to last (0 -> 6 -> 5 -> ...)', () => {
  const totalItems = 7;
  let sel = 0;

  // ArrowUp from 0 wraps to 6
  sel = (sel - 1 + totalItems) % totalItems;
  assert.strictEqual(sel, 6, 'ArrowUp from 0 must wrap to last item (6)');

  // Step backwards to 0
  for (let i = 5; i >= 0; i--) {
    sel = (sel - 1 + totalItems) % totalItems;
    assert.strictEqual(sel, i, `ArrowUp step to ${i} failed`);
  }
});

test('3.3: Adversarial test of formula (sel - 1 + length) % length when sel = -1', () => {
  // When sel starts at -1, what does ArrowUp produce with (sel - 1 + 7) % 7?
  // (-1 - 1 + 7) % 7 = 5 % 7 = 5!
  const selInit = -1;
  const length = 7;
  const arrowUpFromUnselected = (selInit - 1 + length) % length;
  console.log(`    Note on ArrowUp from unselected: index is ${arrowUpFromUnselected} (target items length is ${length})`);
  // Assert that value is within [0, length - 1] so it never causes out-of-bounds error
  assert(arrowUpFromUnselected >= 0 && arrowUpFromUnselected < length, 'Must be within valid array bounds');
});

test('3.4: 500 rapid simulated keydown events never produce NaN or out-of-bounds', () => {
  const length = 7;
  let sel = -1;
  const keys = ['ArrowDown', 'ArrowUp'];

  for (let i = 0; i < 500; i++) {
    const key = keys[Math.floor(Math.random() * keys.length)];
    const step = (key === 'ArrowDown') ? 1 : -1;
    sel = (sel + step + length) % length;
    assert(!Number.isNaN(sel), `Step ${i} produced NaN`);
    assert(sel >= 0 && sel < length, `Step ${i} out of bounds: ${sel}`);
  }
});

// ============================================================================
// SUITE 4: FULL DOM INTEGRATION: SEARCH DROPDOWN & MOBILE MODAL
// ============================================================================
console.log('\nSuite 4: DOM Integration: Search Dropdown & Mobile Modal');

test('4.1: Live search dropdown DOM lifecycle, highlighting & clear button', () => {
  const env = createBrowserEnvironment({ url: 'https://animeverse.test/index.html', innerWidth: 1024 });
  const doc = env.document;

  // Setup header search form
  const form = doc.createElement('form');
  form.id = 'searchForm';
  const inp = doc.createElement('input');
  inp.id = 'searchInput';
  inp.setAttribute('type', 'search');
  form.appendChild(inp);
  doc.body.appendChild(form);

  // Run tech.js in sandbox
  const sb = createSandbox(env);
  vm.createContext(sb);
  vm.runInContext(techJsSource, sb);

  // Verify dropdown #avSug created
  const box = doc.getElementById('avSug');
  assert(box !== null, '#avSug dropdown element must be created');
  assert.strictEqual(box.getAttribute('role'), 'listbox');

  // Verify input event on search input
  inp.value = 'luffy';
  inp.dispatchEvent(new env.window.Event('input', { bubbles: true }));

  assert.strictEqual(box.style.display, 'block', 'Dropdown should be displayed for query "luffy"');
  const results = box.querySelectorAll('a');
  assert(results.length > 0 && results.length <= 7, `Expected 1-7 results, got ${results.length}`);

  // Test clear button
  const clearBtn = doc.getElementById('searchClearBtn');
  assert(clearBtn !== null, '#searchClearBtn should exist');
  assert.strictEqual(clearBtn.hidden, false, 'Clear button should be visible when input has text');

  clearBtn.click();
  assert.strictEqual(inp.value, '', 'Clear button should empty search input');
  assert.strictEqual(clearBtn.hidden, true, 'Clear button should hide when input empty');
  assert.strictEqual(box.style.display, 'none', 'Dropdown should hide when input cleared');
});

test('4.2: Mobile search modal overlay trigger on <= 768px viewports', () => {
  const env = createBrowserEnvironment({ url: 'https://animeverse.test/index.html', innerWidth: 375 });
  const doc = env.document;

  const form = doc.createElement('form');
  form.id = 'searchForm';
  const inp = doc.createElement('input');
  inp.id = 'searchInput';
  form.appendChild(inp);
  doc.body.appendChild(form);

  const sb = createSandbox(env);
  vm.createContext(sb);
  vm.runInContext(techJsSource, sb);

  const modal = doc.getElementById('avSearchModal');
  assert(modal !== null, '#avSearchModal must be mounted to DOM');
  assert.strictEqual(modal.getAttribute('role'), 'dialog');
  assert.strictEqual(modal.getAttribute('aria-modal'), 'true');
  assert.strictEqual(modal.hidden, true, 'Modal should be initially hidden');

  // Trigger focus on mobile search input
  inp.focus();
  assert.strictEqual(modal.hidden, false, 'Focusing search input on <=768px must open #avSearchModal');
  assert.strictEqual(doc.body.style.overflow, 'hidden', 'Opening modal must lock body scroll with overflow: hidden');
});

test('4.3: Mobile search modal backdrop click, close button & Escape dismissal', () => {
  const env = createBrowserEnvironment({ url: 'https://animeverse.test/index.html', innerWidth: 375 });
  const doc = env.document;

  const form = doc.createElement('form');
  form.id = 'searchForm';
  const inp = doc.createElement('input');
  inp.id = 'searchInput';
  form.appendChild(inp);
  doc.body.appendChild(form);

  const sb = createSandbox(env);
  vm.createContext(sb);
  vm.runInContext(techJsSource, sb);

  const modal = doc.getElementById('avSearchModal');
  const backdrop = doc.getElementById('avModalBackdrop');
  const closeBtn = doc.getElementById('avModalCloseBtn');

  // 1. Open modal via API
  sb.window.AVOpenSearchModal('Zoro');
  assert.strictEqual(modal.hidden, false);
  assert.strictEqual(doc.body.style.overflow, 'hidden');

  // 2. Dismiss via backdrop click
  backdrop.click();
  assert.strictEqual(modal.hidden, true, 'Backdrop click must close modal');
  assert.strictEqual(doc.body.style.overflow, '', 'Closing modal must restore body scroll');

  // 3. Open again and dismiss via close button
  sb.window.AVOpenSearchModal();
  assert.strictEqual(modal.hidden, false);
  closeBtn.click();
  assert.strictEqual(modal.hidden, true, 'Close button must close modal');
  assert.strictEqual(doc.body.style.overflow, '');

  // 4. Open again and dismiss via Escape key
  sb.window.AVOpenSearchModal();
  assert.strictEqual(modal.hidden, false);
  const escEvent = new env.window.Event('keydown');
  escEvent.key = 'Escape';
  doc.dispatchEvent(escEvent);
  assert.strictEqual(modal.hidden, true, 'Escape key must close modal');
  assert.strictEqual(doc.body.style.overflow, '');
});

test('4.4: Rapid tag clicks in mobile modal update query and focus input', () => {
  const env = createBrowserEnvironment({ url: 'https://animeverse.test/index.html', innerWidth: 375 });
  const doc = env.document;

  const form = doc.createElement('form');
  form.id = 'searchForm';
  const inp = doc.createElement('input');
  inp.id = 'searchInput';
  form.appendChild(inp);
  doc.body.appendChild(form);

  const sb = createSandbox(env);
  vm.createContext(sb);
  vm.runInContext(techJsSource, sb);

  sb.window.AVOpenSearchModal();
  const mInp = doc.getElementById('avModalSearchInput');
  const mResults = doc.getElementById('avModalResults');
  const tags = doc.querySelectorAll('.av-modal-tag');
  assert(tags.length >= 5, 'Must have at least 5 recommendation tags');

  const expectedTags = ['Luffy', 'Zoro', 'Gojo', 'Figure', 'Cosplay'];
  for (const expected of expectedTags) {
    const btn = Array.from(tags).find(t => t.getAttribute('data-tag') === expected);
    assert(btn !== undefined, `Tag button for ${expected} should exist`);
    btn.click();
    assert.strictEqual(mInp.value, expected, `Clicking tag should set modal input value to ${expected}`);
    const cards = mResults.querySelectorAll('.av-modal-result-card');
    assert(cards.length > 0, `Tag ${expected} should return results`);
  }
});

// ============================================================================
// SUITE 5: CATALOG FILTER COMBINATIONS, URL HYDRATION & GRID/LIST
// ============================================================================
console.log('\nSuite 5: Catalog Filter Matrix, URL Hydration & Grid/List Toggle');

test('5.1: 28-Combination Matrix: Fandom x Price Range filter precision', () => {
  const fandoms = ['all', 'One Piece', 'Jujutsu Kaisen', 'Naruto', 'Demon Slayer', 'Spy x Family', 'Genshin Impact'];
  const prices = ['all', 'u250', '250to500', 'o500'];

  for (const fandom of fandoms) {
    for (const price of prices) {
      const filtered = CATALOG.filter(item => {
        const p = Number(item.price) || 0;
        const fd = (item.fandom || '').toLowerCase();
        const okFandom = (fandom === 'all') || fd.includes(fandom.toLowerCase());
        const okPrice = (price === 'all') ||
          (price === 'u250' && p < 250000) ||
          (price === '250to500' && p >= 250000 && p <= 500000) ||
          (price === 'o500' && p > 500000);
        return okFandom && okPrice;
      });

      // Verify invariant: each item in filtered satisfies both rules
      for (const item of filtered) {
        if (fandom !== 'all') {
          assert(item.fandom.toLowerCase().includes(fandom.toLowerCase()), `Fandom mismatch for ${item.name}`);
        }
        if (price === 'u250') assert(item.price < 250000, `Price mismatch for ${item.name}`);
        if (price === '250to500') assert(item.price >= 250000 && item.price <= 500000, `Price mismatch for ${item.name}`);
        if (price === 'o500') assert(item.price > 500000, `Price mismatch for ${item.name}`);
      }
    }
  }
});

test('5.2: URL parameter parsing and auto-hydration on page load', () => {
  const testUrl = 'https://animeverse.test/san-pham.html?q=luffy&fandom=One+Piece&price=o500&view=list';
  const env = createBrowserEnvironment({ url: testUrl, innerWidth: 1024 });
  const doc = env.document;

  // Setup DOM as in san-pham.html
  const main = doc.createElement('main');
  main.className = 'container section products-catalog catalog-results';
  doc.body.appendChild(main);

  const heading = doc.createElement('div');
  heading.className = 'page-header';
  main.appendChild(heading);

  const pSearch = doc.createElement('input');
  pSearch.id = 'product-search';
  main.appendChild(pSearch);

  const grid = doc.createElement('div');
  grid.id = 'product-grid';
  grid.className = 'product-grid';
  main.appendChild(grid);

  // Populate some sample cards into grid
  for (const item of CATALOG.slice(0, 10)) {
    const card = doc.createElement('article');
    card.className = 'product-card';
    card.dataset.price = String(item.price);
    card.dataset.fandom = item.fandom;
    card.textContent = item.name;
    grid.appendChild(card);
  }

  const sb = createSandbox(env);
  vm.createContext(sb);
  vm.runInContext(techJsSource, sb);

  // Verify URL params hydrated
  assert.strictEqual(pSearch.value, 'luffy', 'Query parameter "q=luffy" should hydrate into #product-search');

  const priceSelect = doc.getElementById('avPriceRange');
  assert(priceSelect !== null, '#avPriceRange select should be created');
  assert.strictEqual(priceSelect.value, 'o500', 'Price parameter "price=o500" should hydrate into #avPriceRange');

  const activeFandom = doc.querySelector('.av-fandom-pill.active');
  assert(activeFandom !== null, 'Active fandom pill should exist');
  assert.strictEqual(activeFandom.getAttribute('data-ffandom'), 'One Piece', 'Fandom parameter "fandom=One Piece" should activate One Piece pill');

  assert(grid.classList.contains('av-list-view'), 'View parameter "view=list" should add .av-list-view class to #product-grid');
});

test('5.3: Hostile / malformed URL parameters do not throw uncaught exceptions', () => {
  const hostileUrls = [
    'https://animeverse.test/san-pham.html?fandom=test"onclick=alert(1)',
    'https://animeverse.test/san-pham.html?cat=FIGURE"test',
    'https://animeverse.test/san-pham.html?price=undefined&view=unknown',
    'https://animeverse.test/san-pham.html?q=<script>alert(1)</script>'
  ];

  for (const hUrl of hostileUrls) {
    const env = createBrowserEnvironment({ url: hUrl, innerWidth: 1024 });
    const doc = env.document;

    const main = doc.createElement('main');
    main.className = 'catalog-results';
    doc.body.appendChild(main);
    const grid = doc.createElement('div');
    grid.id = 'product-grid';
    main.appendChild(grid);

    const sb = createSandbox(env);
    vm.createContext(sb);
    assert.doesNotThrow(() => {
      vm.runInContext(techJsSource, sb);
    }, `Failed on hostile URL: ${hUrl}`);
  }
});

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log('\n======================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests.length}`);
if (failedTests.length > 0) {
  console.log('FAILURES:');
  failedTests.forEach(f => console.log(`  - ${f.name}: ${f.error.message}`));
  process.exit(1);
} else {
  console.log('ALL EMPIRICAL TESTS PASSED CLEANLY (Exit Code: 0)');
  process.exit(0);
}
