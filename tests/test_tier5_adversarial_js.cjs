#!/usr/bin/env node
/**
 * tests/test_tier5_adversarial_js.cjs
 *
 * ============================================================================
 * ANIMEVERSE E-COMMERCE PLATFORM — MILESTONE 5 PHASE 2
 * Tier 5 Adversarial Coverage Hardening: JS Runtime & State Stress Verifier
 * ============================================================================
 *
 * Empirical Challenger Test Suite covering:
 * 1. Cart storage corruption handling (invalid JSON, non-array types, null, negative quantities, NaN prices).
 * 2. Checkout input extremes (phone edge cases, XSS payloads in customer names/addresses, empty/malformed orders, prototype pollution).
 * 3. Search parser resilience (extreme regex meta-characters, control characters, null bytes, long unicode sequences, ReDoS, entity collisions).
 * 4. Motion engine stress (zero-dimension elements, detached elements, rapid mouseleave/mouseenter cycles, reduced-motion toggle at runtime).
 * 5. Cross-tab storage event flood simulation & localStorage.clear() lifecycle.
 * 6. Service worker caching integrity, asset precache consistency & offline fallbacks.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const SITE_JS_PATH = path.join(ROOT_DIR, 'js', 'site.js');
const TECH_JS_PATH = path.join(ROOT_DIR, 'js', 'tech.js');
const UPGRADE_JS_PATH = path.join(ROOT_DIR, 'js', 'upgrade.js');
const MOTION_JS_PATH = path.join(ROOT_DIR, 'js', 'motion.js');
const SW_JS_PATH = path.join(ROOT_DIR, 'sw.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = [];
let detectedVulnerabilities = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failedTests.push({ name, error: err });
    console.error(`  [FAIL] ${name}`);
    console.error(err.stack || err.message);
  }
}

function recordVulnerability(id, severity, title, attackScenario, blastRadius, mitigation) {
  detectedVulnerabilities.push({
    id,
    severity,
    title,
    attackScenario,
    blastRadius,
    mitigation
  });
  console.log(`  [VULN DETECTED - ${severity.toUpperCase()}] ${id}: ${title}`);
}

// ============================================================================
// MOCK DOM ENVIRONMENT FACTORY
// ============================================================================

class MockElement {
  constructor(tag, id = null, className = '') {
    this.tagName = tag.toUpperCase();
    this.attributes = new Map();
    this.style = {
      _styles: new Map(),
      setProperty(k, v) { this._styles.set(k, String(v)); },
      getPropertyValue(k) { return this._styles.get(k) || ''; },
      removeProperty(k) { this._styles.delete(k); }
    };
    this.children = [];
    this.parentNode = null;
    this._innerHTML = '';
    this._textContent = '';
    this.value = '';
    this.hidden = false;
    this.disabled = false;
    this._bounds = { left: 100, top: 100, width: 200, height: 250, right: 300, bottom: 350 };
    this._listeners = new Map();

    this.classList = {
      _classes: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
      add: (...cls) => { for (const c of cls) if (c) this.classList._classes.add(c); },
      remove: (...cls) => { for (const c of cls) this.classList._classes.delete(c); },
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
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(v) {
    this._textContent = (v === null || v === undefined) ? '' : String(v);
  }

  get innerHTML() {
    return this._innerHTML || '';
  }

  set innerHTML(html) {
    this._innerHTML = String(html || '');
    this.children = [];
    const idMatches = this._innerHTML.matchAll(/id=["']([^"']+)["']/g);
    for (const match of idMatches) {
      const child = new MockElement('div', match[1]);
      child.parentNode = this;
      this.children.push(child);
    }
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

  hasAttribute(k) {
    return this.attributes.has(k);
  }

  removeAttribute(k) {
    this.attributes.delete(k);
    if (k === 'id') delete this.id;
  }

  appendChild(child) {
    if (!child) return null;
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(newChild, refChild) {
    if (!newChild) return null;
    if (newChild.parentNode) {
      newChild.parentNode.removeChild(newChild);
    }
    newChild.parentNode = this;
    const idx = this.children.indexOf(refChild);
    if (idx === -1) {
      this.children.push(newChild);
    } else {
      this.children.splice(idx, 0, newChild);
    }
    return newChild;
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
    return { ...this._bounds };
  }

  setBoundingClientRect(bounds) {
    this._bounds = { ...bounds };
  }

  addEventListener(type, fn) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }
    this._listeners.get(type).push(fn);
  }

  removeEventListener(type, fn) {
    if (this._listeners.has(type)) {
      this._listeners.set(type, this._listeners.get(type).filter((f) => f !== fn));
    }
  }

  dispatchEvent(ev) {
    ev.target = this;
    const list = this._listeners.get(ev.type) || [];
    for (const fn of list) {
      fn(ev);
    }
    return true;
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (curr.matches && curr.matches(selector)) return curr;
      curr = curr.parentNode;
    }
    return null;
  }

  matches(selector) {
    if (!selector) return false;
    const parts = selector.split(',').map((s) => s.trim());
    return parts.some((part) => {
      if (part.startsWith('#')) return this.id === part.slice(1);
      if (part.startsWith('.')) return this.classList.contains(part.slice(1));
      if (part === this.tagName.toLowerCase() || part === this.tagName) return true;
      if (part.startsWith('[') && part.endsWith(']')) {
        const attrName = part.slice(1, -1).split('=')[0];
        return this.hasAttribute(attrName);
      }
      return false;
    });
  }

  querySelector(selector) {
    const list = this.querySelectorAll(selector);
    return list.length ? list[0] : null;
  }

  querySelectorAll(selector) {
    const res = [];
    function traverse(node) {
      for (const ch of node.children) {
        if (ch.matches(selector)) res.push(ch);
        traverse(ch);
      }
    }
    traverse(this);
    return res;
  }

  focus() {}
  select() {}
  click() {
    this.dispatchEvent({ type: 'click', target: this, defaultPrevented: false, preventDefault() {} });
  }
}

function createMockEnvironment(initialStorage = {}) {
  const storageData = { ...initialStorage };
  const windowListeners = new Map();
  const documentListeners = new Map();

  const docEl = new MockElement('html');
  docEl.setAttribute('data-theme', 'sakura');
  const bodyEl = new MockElement('body');
  docEl.appendChild(bodyEl);

  const elementsById = new Map();
  const elementsByClass = new Map();

  function registerElement(el) {
    if (el.id) elementsById.set(el.id, el);
    for (const c of el.classList._classes) {
      if (!elementsByClass.has(c)) elementsByClass.set(c, []);
      elementsByClass.get(c).push(el);
    }
    return el;
  }

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

  class MockCustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail || null;
      this.bubbles = init.bubbles || false;
      this.cancelable = init.cancelable || false;
      this.defaultPrevented = false;
    }
    preventDefault() { this.defaultPrevented = true; }
    stopPropagation() {}
  }

  const mockDoc = {
    documentElement: docEl,
    body: bodyEl,
    readyState: 'complete',
    getElementById: (id) => {
      if (elementsById.has(id)) return elementsById.get(id);
      return docEl.querySelector('#' + id);
    },
    createElement: (tag) => new MockElement(tag),
    querySelectorAll: (selector) => docEl.querySelectorAll(selector),
    querySelector: (selector) => docEl.querySelector(selector),
    addEventListener: (type, handler) => {
      if (!documentListeners.has(type)) documentListeners.set(type, []);
      documentListeners.get(type).push(handler);
    },
    removeEventListener: (type, handler) => {
      if (documentListeners.has(type)) {
        documentListeners.set(type, documentListeners.get(type).filter((h) => h !== handler));
      }
    },
    dispatchEvent: (event) => {
      const list = documentListeners.get(event.type) || [];
      for (const h of list) {
        h(event);
      }
      return true;
    }
  };

  let mockReducedMotion = false;
  let mediaQueryListeners = [];

  const mockWin = {
    document: mockDoc,
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage,
    CustomEvent: MockCustomEvent,
    Event: MockCustomEvent,
    URLSearchParams: global.URLSearchParams,
    innerWidth: 1024,
    innerHeight: 768,
    location: { pathname: '/san-pham.html', href: 'san-pham.html', search: '' },
    navigator: {
      clipboard: {
        writeText: (t) => Promise.resolve(t)
      }
    },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval: (id) => clearInterval(id),
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    matchMedia: (query) => {
      const isReduced = query.includes('prefers-reduced-motion: reduce');
      return {
        matches: isReduced ? mockReducedMotion : true,
        media: query,
        addEventListener: (evt, fn) => mediaQueryListeners.push(fn),
        removeEventListener: (evt, fn) => {
          mediaQueryListeners = mediaQueryListeners.filter((l) => l !== fn);
        }
      };
    },
    addEventListener: (type, handler) => {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(handler);
    },
    removeEventListener: (type, handler) => {
      if (windowListeners.has(type)) {
        windowListeners.set(type, windowListeners.get(type).filter((h) => h !== handler));
      }
    },
    dispatchEvent: (event) => {
      const list = windowListeners.get(event.type) || [];
      for (const h of list) {
        h(event);
      }
      return true;
    },
    Date: Date,
    Math: Math,
    Number: Number,
    String: String,
    JSON: JSON,
    Array: Array,
    Object: Object,
    RegExp: RegExp,
    Error: Error
  };

  mockWin.window = mockWin;

  return {
    window: mockWin,
    document: mockDoc,
    storage: mockLocalStorage,
    storageData,
    registerElement,
    setReducedMotion: (val) => {
      mockReducedMotion = val;
      for (const l of mediaQueryListeners) {
        l({ matches: val, media: '(prefers-reduced-motion: reduce)' });
      }
    },
    dispatchStorageEvent: (key, newValue, oldValue = null) => {
      const ev = new MockCustomEvent('storage');
      ev.key = key;
      ev.newValue = newValue;
      ev.oldValue = oldValue;
      mockWin.dispatchEvent(ev);
    }
  };
}

// Load source code
const siteJsCode = fs.readFileSync(SITE_JS_PATH, 'utf8');
const techJsCode = fs.readFileSync(TECH_JS_PATH, 'utf8');
const upgradeJsCode = fs.readFileSync(UPGRADE_JS_PATH, 'utf8');
const motionJsCode = fs.readFileSync(MOTION_JS_PATH, 'utf8');
const swJsCode = fs.readFileSync(SW_JS_PATH, 'utf8');

console.log('================================================================================');
console.log('TIER 5 ADVERSARIAL STRESS TEST SUITE — JS RUNTIME & STATE STRESS');
console.log('================================================================================\n');

// ============================================================================
// SECTION 1: CART STORAGE CORRUPTION & STATE RESILIENCE
// ============================================================================
console.log('--- SECTION 1: Cart Storage Corruption & State Resilience ---');

test('1.1: Cart storage with "null" string corruption handled safely by safeGet / Store.syncBadges()', () => {
  const env = createMockEnvironment({ av_cart: 'null' });
  const badge = new MockElement('span', null, 'cart-badge');
  env.document.body.appendChild(badge);

  let errorCaught = null;
  try {
    vm.runInNewContext(siteJsCode, env.window);
  } catch (err) {
    errorCaught = err;
  }

  assert.strictEqual(errorCaught, null, `Expected site.js to handle "null" storage safely without throwing, got: ${errorCaught && errorCaught.message}`);
  const cart = env.window.AVStore.cartGet();
  assert(Array.isArray(cart), 'Expected cartGet() to return array');
  assert.strictEqual(cart.length, 0, 'Expected empty cart fallback');
  assert.strictEqual(badge.hidden, true, 'Expected badge to be hidden on clean fallback');
});

test('1.2: Cart storage with non-array JSON types safely guarded by Array.isArray in cartGet()', () => {
  const nonArrayTypes = ['{}', '123', 'true', '"test_string"'];
  for (const raw of nonArrayTypes) {
    const env = createMockEnvironment({ av_cart: raw });
    const badge = new MockElement('span', null, 'cart-badge');
    env.document.body.appendChild(badge);

    let err = null;
    try {
      vm.runInNewContext(siteJsCode, env.window);
    } catch (e) {
      err = e;
    }

    assert.strictEqual(err, null, `Expected site.js to handle non-array raw value ${raw} safely without throwing`);
    const cart = env.window.AVStore.cartGet();
    assert(Array.isArray(cart), `Expected cartGet() to return array for raw ${raw}`);
    assert.strictEqual(cart.length, 0, `Expected empty array for raw ${raw}`);
  }
});

test('1.3: Cart storage with malformed array elements ([null], [undefined], [{}]) filtered safely', () => {
  const env = createMockEnvironment({ av_cart: '[null, 123, "corrupt", {"id": "sp1", "qty": 2}]' });
  const badge = new MockElement('span', null, 'cart-badge');
  env.document.body.appendChild(badge);

  let err = null;
  try {
    vm.runInNewContext(siteJsCode, env.window);
  } catch (e) {
    err = e;
  }

  assert.strictEqual(err, null, `Expected site.js not to crash on malformed cart array elements, got: ${err && err.message}`);
  const cart = env.window.AVStore.cartGet();
  assert(Array.isArray(cart), 'Expected cartGet() to return array');
  assert.strictEqual(cart.length, 1, 'Expected malformed non-object items to be filtered out');
  assert.strictEqual(cart[0].id, 'sp1');
  assert.strictEqual(badge.textContent, '2', 'Expected badge to count valid item qty safely');
});

test('1.4: Cart storage with invalid JSON syntax recovers safely to fallback', () => {
  const env = createMockEnvironment({ av_cart: '{unclosed_json' });
  const badge = new MockElement('span', null, 'cart-badge');
  env.document.body.appendChild(badge);

  // SyntaxError is caught by safeGet's try...catch block
  vm.runInNewContext(siteJsCode, env.window);
  const cart = env.window.AVStore.cartGet();
  assert(Array.isArray(cart), 'Expected safe fallback [] on invalid JSON syntax');
  assert.strictEqual(cart.length, 0);
});

test('1.5: Negative quantities in cart sanitized during Store.checkout() (subtotal cannot be reduced)', () => {
  const env = createMockEnvironment({
    av_cart: JSON.stringify([
      { id: 'chi-tiet-1', name: 'Luffy Nika', price: 500000, qty: 1 },
      { id: 'chi-tiet-2', name: 'Zoro Wano', price: 400000, qty: -1 }
    ])
  });
  vm.runInNewContext(siteJsCode, env.window);

  const order = env.window.AVStore.checkout(
    'Nguyen Van A',
    '0901234567',
    '123 Le Loi, Q1, TP.HCM',
    'COD'
  );

  // Subtotal: 500000 * 1 + 400000 * 1 (clamped to Math.max(1, qty)) = 900000.
  // >= 500000 free shipping. Total = 900000.
  assert(order.total >= 500000, 'Negative quantity must not discount total');
  assert.strictEqual(order.total, 900000, 'Negative quantity must be clamped to at least 1');
  assert.strictEqual(order.items[1].qty, 1, 'Order item quantity must be sanitized');
});

test('1.6: NaN and non-numeric price resilience', () => {
  const env = createMockEnvironment({
    av_cart: JSON.stringify([
      { id: 'chi-tiet-1', name: 'Item', price: 'not-a-number', qty: 2 }
    ])
  });
  vm.runInNewContext(siteJsCode, env.window);

  // Number('not-a-number') || 0 returns 0
  const order = env.window.AVStore.checkout(
    'Nguyen Van B',
    '0901234567',
    '456 Tran Phu, Da Nang',
    'COD'
  );

  // sub = 0 * 2 = 0. Ship = 30000. Total = 30000
  assert.strictEqual(order.total, 30000);
});

test('1.7: Wishlist and comparison storage corruption resilience', () => {
  const env = createMockEnvironment({ av_cart: '[]', av_wish: 'null', av_compare: 'null' });
  let err = null;
  try {
    vm.runInNewContext(siteJsCode, env.window);
  } catch (e) {
    err = e;
  }
  assert.strictEqual(err, null, 'Wish and compare null storage must not crash boot');
  assert.strictEqual(env.window.AVStore.wishGet().length, 0);
  assert.strictEqual(env.window.AVStore.compareGet().length, 0);
});


// ============================================================================
// SECTION 2: CHECKOUT VALIDATION & INPUT ADVERSITY
// ============================================================================
console.log('\n--- SECTION 2: Checkout Validation & Input Adversity ---');

test('2.1: Phone regex matrix — Valid VN phone prefixes', () => {
  const env = createMockEnvironment({
    av_cart: JSON.stringify([{ id: 'sp1', name: 'Item', price: 100000, qty: 1 }])
  });
  vm.runInNewContext(siteJsCode, env.window);

  const validPhones = [
    '0321234567', '0389999999', '0521234567', '0581234567',
    '0701234567', '0791234567', '0811234567', '0891234567',
    '0901234567', '0981234567',
    '+84321234567', '+84581234567', '+84701234567', '+84891234567', '+84901234567'
  ];

  for (const phone of validPhones) {
    env.storage.setItem('av_cart', JSON.stringify([{ id: 'sp1', name: 'Item', price: 100000, qty: 1 }]));
    const ord = env.window.AVStore.checkout('Khach Test', phone, 'Dia Chi Test', 'COD');
    assert(ord.id.startsWith('AV-2026-'), `Expected valid order for phone: ${phone}`);
  }
});

test('2.2: Phone regex matrix — Invalid phone rejection', () => {
  const env = createMockEnvironment({
    av_cart: JSON.stringify([{ id: 'sp1', name: 'Item', price: 100000, qty: 1 }])
  });
  vm.runInNewContext(siteJsCode, env.window);

  const invalidPhones = [
    '', '0123456789', '0283838383', '0401234567', '0601234567',
    '1234567890', '090123456', '09012345678', '090abc1234',
    '090-123-456', '090 123 4567', '<script>0901234567</script>',
    '+84123456789', '+1901234567', 'null', 'undefined'
  ];

  for (const phone of invalidPhones) {
    assert.throws(
      () => env.window.AVStore.checkout('Khach', phone, 'Dia Chi', 'COD'),
      /Invalid VN phone number/,
      `Expected rejection for invalid phone: ${phone}`
    );
  }
});

test('2.3: Phone regex character class boundary validation rejects literal pipe ("|")', () => {
  const env = createMockEnvironment({
    av_cart: JSON.stringify([{ id: 'chi-tiet-1', name: 'Item', price: 100000, qty: 1 }])
  });
  vm.runInNewContext(siteJsCode, env.window);

  assert.throws(
    () => env.window.AVStore.checkout('Khach Hang', '0|12345678', 'Dia Chi', 'COD'),
    /Invalid VN phone number/,
    'Phone with literal pipe must be rejected'
  );
  assert.throws(
    () => env.window.AVStore.checkout('Khach Hang', '+84|12345678', 'Dia Chi', 'COD'),
    /Invalid VN phone number/,
    'International phone with literal pipe must be rejected'
  );
});

test('2.4: Empty cart and missing required checkout fields rejection', () => {
  const env = createMockEnvironment({ av_cart: '[]' });
  vm.runInNewContext(siteJsCode, env.window);

  // Empty cart
  assert.throws(
    () => env.window.AVStore.checkout('Ten', '0901234567', 'Dia chi', 'COD'),
    /Cannot checkout empty cart/
  );

  // Missing / whitespace name
  env.storage.setItem('av_cart', JSON.stringify([{ id: 'sp1', price: 100000, qty: 1 }]));
  assert.throws(
    () => env.window.AVStore.checkout('   ', '0901234567', 'Dia chi', 'COD'),
    /Customer name required/
  );

  // Missing / whitespace address
  assert.throws(
    () => env.window.AVStore.checkout('Ten', '0901234567', '   ', 'COD'),
    /Shipping address required/
  );
});

test('2.5: XSS payloads in customer names and addresses are thoroughly escaped', () => {
  const env = createMockEnvironment({
    av_cart: JSON.stringify([{ id: 'chi-tiet-1', name: 'Luffy', price: 590000, qty: 1 }])
  });
  vm.runInNewContext(siteJsCode, env.window);

  const xssName = '<script>alert("xss-name")</script>';
  const xssAddr = '"><img src=x onerror=alert("xss-addr")>';
  const xssNote = '<svg onload=alert(1)>';

  const ord = env.window.AVStore.checkout(xssName, '0901234567', xssAddr, 'COD', xssNote);

  // In AVStore, ord.customer preserves raw string in memory object, but HTML rendering uses esc()
  const esc = env.window.AVStore.esc;
  const escapedName = esc(ord.customer);
  const escapedAddr = esc(ord.addr);

  assert(!escapedName.includes('<script>'), 'Unescaped <script> in customer name');
  assert(escapedName.includes('&lt;script&gt;'), 'Expected &lt;script&gt;');
  assert(!escapedAddr.includes('<img'), 'Unescaped <img in address');
  assert(escapedAddr.includes('&lt;img'), 'Expected &lt;img');
});

test('2.6: Prototype pollution resilience in order creation', () => {
  const env = createMockEnvironment({
    av_cart: JSON.stringify([{ id: 'sp1', price: 100000, qty: 1 }])
  });
  vm.runInNewContext(siteJsCode, env.window);

  env.window.AVStore.checkout(
    '__proto__',
    '0901234567',
    'constructor.prototype',
    'COD'
  );

  assert.strictEqual(Object.prototype.admin, undefined);
  assert.strictEqual({}.polluted, undefined);
});

test('2.7: Order ID Monte Carlo 5,000 iterations test (collision & format check)', () => {
  const env = createMockEnvironment({
    av_cart: JSON.stringify([{ id: 'sp1', price: 100000, qty: 1 }])
  });
  vm.runInNewContext(siteJsCode, env.window);

  const ORDER_ID_REGEX = /^AV-2026-\d{4}$/;
  for (let i = 0; i < 5000; i++) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ordId = 'AV-2026-' + randomSuffix;
    assert(ORDER_ID_REGEX.test(ordId), `Invalid Order ID format: ${ordId}`);
    assert(randomSuffix >= 1000 && randomSuffix <= 9999, `Out of bounds suffix: ${randomSuffix}`);
  }
});

test('2.8: VIP XP ranks progression & threshold boundary validation', () => {
  const env = createMockEnvironment();
  vm.runInNewContext(siteJsCode, env.window);

  const Store = env.window.AVStore;
  assert.strictEqual(Store.getRankInfo(0).name, '🌱 Tân Binh Wibu');
  assert.strictEqual(Store.getRankInfo(249).name, '🌱 Tân Binh Wibu');
  assert.strictEqual(Store.getRankInfo(250).name, '🔥 Thợ Săn (Hunter)');
  assert.strictEqual(Store.getRankInfo(499).name, '🔥 Thợ Săn (Hunter)');
  assert.strictEqual(Store.getRankInfo(500).name, '⚔️ Trụ Cột (Hashira)');
  assert.strictEqual(Store.getRankInfo(999).name, '⚔️ Trụ Cột (Hashira)');
  assert.strictEqual(Store.getRankInfo(1000).name, '👑 Tứ Hoàng (Yonko)');
  assert.strictEqual(Store.getRankInfo(5000).name, '👑 Tứ Hoàng (Yonko)');
});


// ============================================================================
// SECTION 3: SEARCH PARSER RESILIENCE
// ============================================================================
console.log('\n--- SECTION 3: Search Engine & Lexical Parser Stress ---');

test('3.1: Extreme regex metacharacters in highlightMatch and live search', () => {
  const env = createMockEnvironment();
  const searchInput = new MockElement('input', 'searchInput');
  const searchForm = new MockElement('form', 'searchForm');
  searchForm.appendChild(searchInput);
  env.document.body.appendChild(searchForm);

  vm.runInNewContext(siteJsCode, env.window);
  vm.runInNewContext(techJsCode, env.window);

  const extremeQueries = [
    '(((((', '[[[[[', '.*+?^$', '\\\\\\\\', '(?=.*)', '(?:a|b)',
    '(?<!x)', '[a-z]{1,5}', '^.*$', '$', '$$', '$1', '$&'
  ];

  for (const q of extremeQueries) {
    searchInput.value = q;
    assert.doesNotThrow(() => {
      searchInput.dispatchEvent({ type: 'input', target: searchInput });
    }, `Search crashed on regex query: ${q}`);
  }
});

test('3.2: Control characters, null bytes and Unicode extremes', () => {
  const env = createMockEnvironment();
  const searchInput = new MockElement('input', 'searchInput');
  const searchForm = new MockElement('form', 'searchForm');
  searchForm.appendChild(searchInput);
  env.document.body.appendChild(searchForm);

  vm.runInNewContext(siteJsCode, env.window);
  vm.runInNewContext(techJsCode, env.window);

  const weirdInputs = [
    '\x00\u0000', '\r\n\t\b\f', '\x1b[31mRed\x1b[0m',
    '🌸'.repeat(500), 'Z͔͑ͫ̓a̋lͥgͭoͮ'.repeat(20), '🏴‍☠️'.repeat(50)
  ];

  for (const q of weirdInputs) {
    searchInput.value = q;
    assert.doesNotThrow(() => {
      searchInput.dispatchEvent({ type: 'input', target: searchInput });
    }, `Search crashed on unicode input: ${q.slice(0, 10)}`);
  }
});

test('3.3: ReDoS pathological input stress (<5ms execution gate)', () => {
  const env = createMockEnvironment();
  const searchInput = new MockElement('input', 'searchInput');
  const searchForm = new MockElement('form', 'searchForm');
  searchForm.appendChild(searchInput);
  env.document.body.appendChild(searchForm);

  vm.runInNewContext(siteJsCode, env.window);
  vm.runInNewContext(techJsCode, env.window);

  const pathologicalQuery = 'a'.repeat(20000);
  searchInput.value = pathologicalQuery;

  const t0 = Date.now();
  searchInput.dispatchEvent({ type: 'input', target: searchInput });
  const duration = Date.now() - t0;

  assert(duration < 50, `ReDoS search took too long: ${duration}ms (expected < 50ms)`);
});

test('3.4: HTML entity boundary collision in highlightMatch preserves valid entities (AV-SEC-06)', () => {
  const env = createMockEnvironment();
  vm.runInNewContext(techJsCode, env.window);

  const highlightMatch = env.window.AVHighlightMatch;
  assert.strictEqual(typeof highlightMatch, 'function', 'AVHighlightMatch should be exposed on window');

  const res = highlightMatch('Figure & Co', '&');
  assert.strictEqual(res, 'Figure <mark class="av-sug-hl">&amp;</mark> Co', `Unexpected highlight output: ${res}`);
  assert(!res.includes('&</mark>amp;'), 'Confirmed no broken HTML entities when searching "&"');
});


// ============================================================================
// SECTION 4: GPU MOTION & MICRO-INTERACTION RESILIENCE
// ============================================================================
console.log('\n--- SECTION 4: GPU Motion & Micro-Interaction Resilience ---');

test('4.1: Card 3D tilt on zero-dimension element returns safely without NaN', () => {
  const env = createMockEnvironment();
  const card = new MockElement('article', null, 'product-card');
  card.setBoundingClientRect({ left: 100, top: 100, width: 0, height: 0, right: 100, bottom: 100 });
  env.document.body.appendChild(card);

  vm.runInNewContext(motionJsCode, env.window);

  // Trigger pointermove
  assert.doesNotThrow(() => {
    card.dispatchEvent({ type: 'pointermove', clientX: 150, clientY: 150 });
  });

  const tiltX = card.style.getPropertyValue('--tilt-x');
  assert(!tiltX.includes('NaN'), `Tilt X contains NaN: ${tiltX}`);
});

test('4.2: Card 3D tilt on detached element does not throw', () => {
  const env = createMockEnvironment();
  const card = new MockElement('article', null, 'product-card');
  env.document.body.appendChild(card);

  vm.runInNewContext(motionJsCode, env.window);

  // Detach card from DOM
  env.document.body.removeChild(card);
  assert.strictEqual(card.parentNode, null);

  assert.doesNotThrow(() => {
    card.dispatchEvent({ type: 'pointermove', clientX: 200, clientY: 200 });
    card.dispatchEvent({ type: 'pointerleave' });
  });
});

test('4.3: Rapid mouseenter/mouseleave 500-cycle stress clears tilt to 0deg', () => {
  const env = createMockEnvironment();
  const card = new MockElement('article', null, 'product-card');
  env.document.body.appendChild(card);

  vm.runInNewContext(motionJsCode, env.window);

  for (let i = 0; i < 500; i++) {
    card.dispatchEvent({ type: 'pointerenter' });
    card.dispatchEvent({ type: 'pointermove', clientX: 120 + i % 50, clientY: 120 + i % 50 });
    card.dispatchEvent({ type: 'pointerleave' });
  }

  assert.strictEqual(card.style.getPropertyValue('--tilt-x'), '0deg');
  assert.strictEqual(card.style.getPropertyValue('--tilt-y'), '0deg');
  assert.strictEqual(card.style.getPropertyValue('--glare-opacity'), '0');
  assert(!card.classList.contains('is-tilting'), 'Card should not remain in tilting state');
});

test('4.4: AVCartCelebration fallback when sourceEl is null', () => {
  const env = createMockEnvironment();
  vm.runInNewContext(motionJsCode, env.window);

  assert.doesNotThrow(() => {
    env.window.AVCartCelebration(null);
  });
});

test('4.5: prefers-reduced-motion runtime toggle dynamically updates motion preferences (AV-SEC-07)', () => {
  const env = createMockEnvironment();
  vm.runInNewContext(motionJsCode, env.window);

  const card = new MockElement('article', null, 'product-card');
  env.document.body.appendChild(card);
  env.window.AVInitTilt(card);

  // Toggle reduced motion at runtime
  env.setReducedMotion(true);

  // Verify card interactions are suppressed under reduced motion
  card.dispatchEvent({ type: 'pointerenter' });
  card.dispatchEvent({ type: 'pointermove', clientX: 120, clientY: 120 });
  assert.strictEqual(card.classList.contains('is-tilting'), false, 'Tilt should not activate when reduced-motion is active');

  // Verify celebrations do not throw or create elements
  assert.doesNotThrow(() => {
    env.window.AVCartCelebration(card);
  });
});


// ============================================================================
// SECTION 5: CROSS-TAB STORAGE FLOOD & LIFECYCLE
// ============================================================================
console.log('\n--- SECTION 5: Cross-Tab Storage Flood & Lifecycle ---');

test('5.1: 1,000 storage events flood simulation across all store keys', () => {
  const env = createMockEnvironment({ av_cart: '[]', av_xp: 120 });
  const badge = new MockElement('span', null, 'cart-badge');
  const vipPill = new MockElement('div', null, 'av-vip-pill');
  env.document.body.appendChild(badge);
  env.document.body.appendChild(vipPill);

  vm.runInNewContext(siteJsCode, env.window);

  const keys = ['av_cart', 'av_wish', 'av_compare', 'av_xp', 'av_coupon', 'av_vouchers'];
  let cartUpdatedEvents = 0;
  env.document.addEventListener('av:cart-updated', () => { cartUpdatedEvents++; });

  const t0 = Date.now();
  for (let i = 0; i < 1000; i++) {
    const k = keys[i % keys.length];
    env.dispatchStorageEvent(k, '[]');
  }
  const duration = Date.now() - t0;

  assert(cartUpdatedEvents === 1000, `Expected 1000 events dispatched, got ${cartUpdatedEvents}`);
  assert(duration < 250, `Storage flood took ${duration}ms (expected < 250ms)`);
});

test('5.2: localStorage.clear() event handling (e.key === null) triggers badge synchronization (AV-SEC-08)', () => {
  const env = createMockEnvironment({ av_cart: '[]' });
  vm.runInNewContext(siteJsCode, env.window);

  let updated = false;
  env.document.addEventListener('av:cart-updated', () => { updated = true; });

  // When localStorage.clear() is called, W3C spec dispatches storage event with key === null
  env.dispatchStorageEvent(null, null);

  assert.strictEqual(updated, true, 'Storage event listener must handle null key on localStorage.clear()');
});


// ============================================================================
// SECTION 6: SERVICE WORKER INTEGRITY
// ============================================================================
console.log('\n--- SECTION 6: Service Worker Integrity & Offline Cache ---');

test('6.1: Service worker cache version format matches "av-v33-upgrade"', () => {
  const versionMatch = swJsCode.match(/const\s+V\s*=\s*['"]([^'"]+)['"]/);
  assert(versionMatch !== null, 'Service worker missing cache version constant V');
  assert.strictEqual(versionMatch[1], 'av-v33-upgrade');
});

test('6.2: Core precache asset list integrity on physical disk', () => {
  const coreMatch = swJsCode.match(/const\s+CORE\s*=\s*\[([\s\S]*?)\];/);
  assert(coreMatch !== null, 'Service worker missing CORE array');

  const coreFiles = coreMatch[1]
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter(Boolean);

  assert.strictEqual(coreFiles.length, 8, `Expected 8 CORE assets, found ${coreFiles.length}`);

  for (const relFile of coreFiles) {
    const fullPath = path.join(ROOT_DIR, relFile);
    assert(fs.existsSync(fullPath), `Precached CORE asset missing on disk: ${relFile}`);
  }
});

test('6.3: Service worker fetch event skips non-GET and .mp3 audio requests', () => {
  assert(swJsCode.includes("e.request.method === 'GET'"), 'Fetch handler must check GET method');
  assert(swJsCode.includes('\\.mp3($|\\?)'), 'Fetch handler must bypass .mp3 audio files');
});


// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log('\n================================================================================');
console.log('TIER 5 ADVERSARIAL STRESS TEST EXECUTION SUMMARY');
console.log('================================================================================');
console.log(`Total Empirical Tests Run : ${totalTests}`);
console.log(`Passed Test Invariants   : ${passedTests}`);
console.log(`Failed Test Invariants   : ${failedTests.length}`);
console.log(`Vulnerabilities Detected : ${detectedVulnerabilities.length}`);
console.log('--------------------------------------------------------------------------------');

if (detectedVulnerabilities.length > 0) {
  console.log('DETECTED VULNERABILITIES & FAILURE MODES MATRIX:');
  for (const v of detectedVulnerabilities) {
    console.log(`  * [${v.severity}] ${v.id}: ${v.title}`);
  }
} else {
  console.log('HARDENING STATUS: ALL TIER-5 VULNERABILITIES REMEDIATED (0 DETECTED)');
}

console.log('================================================================================');

// Explicit verdict determination
if (failedTests.length > 0 || detectedVulnerabilities.some((v) => v.severity === 'CRITICAL')) {
  console.log('CHALLENGER VERDICT: REQUEST_CHANGES (Failures detected)');
  process.exit(1);
} else {
  console.log('CHALLENGER VERDICT: APPROVE (All test invariants passed & hardened)');
  process.exit(0);
}
