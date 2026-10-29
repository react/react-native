/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated
 * @noformat
 * @noflow
 * @nolint
 *
 * This is a snapshot of the transform output for testing purposes.
 * To update, run: js1 test transform-snapshot-test.js -u
 *
 * Transform configuration:
 *   - Without babel runtime helpers
 *   - Options: {"dev":false,"enableBabelRuntime":false}
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LegacyComponent = exports.Dog = exports.Counter = exports.Animal = void 0;
exports.ModernComponent = ModernComponent;
exports.MyClass = void 0;
exports.asyncNumberGenerator = asyncNumberGenerator;
Object.defineProperty(exports, "default", {
  enumerable: true,
  get: function () {
    return _dataUtils.fetchData;
  }
});
exports.getNestedValue = getNestedValue;
exports.loadModule = loadModule;
exports.matchEmoji = matchEmoji;
exports.mergeConfigs = mergeConfigs;
exports.parseDate = parseDate;
exports.processUser = processUser;
exports.safeJsonParse = safeJsonParse;
exports.sumPairs = sumPairs;
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _jsxRuntime = require("react/jsx-runtime");
var _dataUtils = require("./data-utils");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classPrivateFieldLooseBase(e, t) { if (!{}.hasOwnProperty.call(e, t)) throw new TypeError("attempted to use private field on non-instance"); return e; }
var id = 0;
function _classPrivateFieldLooseKey(e) { return "__private_" + id++ + "_" + e; }
function _awaitAsyncGenerator(e) { return new _OverloadYield(e, 0); }
function _wrapAsyncGenerator(e) { return function () { return new AsyncGenerator(e.apply(this, arguments)); }; }
function AsyncGenerator(e) { var r, t; function resume(r, t) { try { var n = e[r](t), o = n.value, u = o instanceof _OverloadYield; Promise.resolve(u ? o.v : o).then(function (t) { if (u) { var i = "return" === r ? "return" : "next"; if (!o.k || t.done) return resume(i, t); t = e[i](t).value; } settle(n.done ? "return" : "normal", t); }, function (e) { resume("throw", e); }); } catch (e) { settle("throw", e); } } function settle(e, n) { switch (e) { case "return": r.resolve({ value: n, done: !0 }); break; case "throw": r.reject(n); break; default: r.resolve({ value: n, done: !1 }); } (r = r.next) ? resume(r.key, r.arg) : t = null; } this._invoke = function (e, n) { return new Promise(function (o, u) { var i = { key: e, arg: n, resolve: o, reject: u, next: null }; t ? t = t.next = i : (r = t = i, resume(e, n)); }); }, "function" != typeof e.return && (this.return = void 0); }
AsyncGenerator.prototype["function" == typeof Symbol && Symbol.asyncIterator || "@@asyncIterator"] = function () { return this; }, AsyncGenerator.prototype.next = function (e) { return this._invoke("next", e); }, AsyncGenerator.prototype.throw = function (e) { return this._invoke("throw", e); }, AsyncGenerator.prototype.return = function (e) { return this._invoke("return", e); };
function _OverloadYield(e, d) { this.v = e, this.k = d; }
var _count = _classPrivateFieldLooseKey("count");
var _instances = _classPrivateFieldLooseKey("instances");
var _increment = _classPrivateFieldLooseKey("increment");
class Counter {
  constructor() {
    Object.defineProperty(this, _increment, {
      value: _increment2
    });
    Object.defineProperty(this, _count, {
      writable: true,
      value: 0
    });
    _classPrivateFieldLooseBase(Counter, _instances)[_instances]++;
  }
  get value() {
    return _classPrivateFieldLooseBase(this, _count)[_count];
  }
  increment() {
    _classPrivateFieldLooseBase(this, _increment)[_increment]();
  }
  static get instanceCount() {
    return _classPrivateFieldLooseBase(Counter, _instances)[_instances];
  }
}
exports.Counter = Counter;
function _increment2() {
  _classPrivateFieldLooseBase(this, _count)[_count]++;
}
Object.defineProperty(Counter, _instances, {
  writable: true,
  value: 0
});
function asyncNumberGenerator(_x) {
  return _asyncNumberGenerator.apply(this, arguments);
}
function _asyncNumberGenerator() {
  _asyncNumberGenerator = _wrapAsyncGenerator(function* (max) {
    for (var i = 0; i < max; i++) {
      yield _awaitAsyncGenerator(new Promise(resolve => setTimeout(resolve, 100)));
      yield i;
    }
  });
  return _asyncNumberGenerator.apply(this, arguments);
}
function fetchData(_x2) {
  return _fetchData.apply(this, arguments);
}
function _fetchData() {
  _fetchData = _asyncToGenerator(function* (url) {
    var response = yield fetch(url);
    var data = yield response.json();
    return {
      data
    };
  });
  return _fetchData.apply(this, arguments);
}
function getNestedValue(obj) {
  return obj?.a?.b?.c ?? 42;
}
class Animal {
  #age;
  constructor(name, age) {
    this.name = name;
    this.#age = age;
  }
  speak() {
    return `${this.name} makes a sound`;
  }
  get age() {
    return this.#age;
  }
}
exports.Animal = Animal;
class Dog extends Animal {
  constructor(name, age, breed) {
    super(name, age);
    this.breed = breed;
  }
  speak() {
    return `${this.name} barks!`;
  }
  fetchTreats() {
    return _asyncToGenerator(function* () {
      yield new Promise(resolve => setTimeout(resolve, 100));
      return ['bone', 'biscuit', 'toy'];
    })();
  }
}
exports.Dog = Dog;
function processUser({
  name,
  age = 18,
  ...rest
}) {
  var {
    city = 'Unknown'
  } = rest;
  return `${name} (${age}) from ${city}`;
}
function mergeConfigs(base, ...overrides) {
  return {
    ...base,
    ...overrides.reduce((acc, o) => ({
      ...acc,
      ...o
    }), {})
  };
}
function sumPairs(pairs) {
  var total = 0;
  for (var [a, b] of pairs) {
    total += a + b;
  }
  return total;
}
function parseDate(dateString) {
  var regex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
  var match = dateString.match(regex);
  if (match?.groups) {
    return {
      year: match.groups.year,
      month: match.groups.month,
      day: match.groups.day
    };
  }
  return null;
}
function safeJsonParse(input) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}
function matchEmoji(text) {
  var match = text.match(/\p{Emoji}/u);
  return match?.[0];
}
var MyClass = class {
  constructor(value) {
    this.value = value;
  }
};
exports.MyClass = MyClass;
function loadModule() {
  return _loadModule.apply(this, arguments);
}
function _loadModule() {
  _loadModule = _asyncToGenerator(function* () {
    var module = yield import('./some-module');
    return module.default;
  });
  return _loadModule.apply(this, arguments);
}
var LegacyComponent = exports.LegacyComponent = React.createClass({
  displayName: 'LegacyComponent',
  getInitialState() {
    return {
      count: 0
    };
  },
  render() {
    return (0, _jsxRuntime.jsx)("div", {
      children: this.state.count
    });
  }
});
function ModernComponent({
  initialCount = 0
}) {
  var [count, setCount] = (0, _react.useState)(initialCount);
  var [status, setStatus] = (0, _react.useState)(Status.Active);
  (0, _react.useEffect)(() => {
    var timer = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  function handleAsyncClick() {
    return _handleAsyncClick.apply(this, arguments);
  }
  function _handleAsyncClick() {
    _handleAsyncClick = _asyncToGenerator(function* () {
      var data = yield fetchData('/api/data');
      console.log(data);
    });
    return _handleAsyncClick.apply(this, arguments);
  }
  var handleClick = function () {
    var _ref = _asyncToGenerator(function* () {
      yield handleAsyncClick();
      setStatus(Status.Pending);
    });
    return function handleClick() {
      return _ref.apply(this, arguments);
    };
  }();
  return (0, _jsxRuntime.jsxs)("div", {
    children: [(0, _jsxRuntime.jsx)("span", {
      "data-testid": "count",
      children: count
    }), (0, _jsxRuntime.jsx)("span", {
      "data-testid": "status",
      children: String(status)
    }), (0, _jsxRuntime.jsx)("button", {
      onClick: handleClick,
      children: "Increment"
    }), (0, _jsxRuntime.jsx)(LegacyComponent, {})]
  });
}