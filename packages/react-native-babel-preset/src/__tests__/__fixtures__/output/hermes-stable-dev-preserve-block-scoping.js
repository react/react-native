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
 *   - Hermes stable transform profile in development mode with unstable_preserveBlockScoping enabled
 *   - Options: {"dev":true,"unstable_transformProfile":"hermes-stable","customTransformOptions":{"unstable_preserveBlockScoping":true}}
 */

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
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
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classPrivateFieldLooseBase2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseBase"));
var _classPrivateFieldLooseKey2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseKey"));
var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/awaitAsyncGenerator"));
var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapAsyncGenerator"));
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _jsxRuntime = require("react/jsx-runtime");
var _dataUtils = require("./data-utils");
var _jsxFileName = "/absolute/path/to/input.js";
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
var _count = (0, _classPrivateFieldLooseKey2.default)("count");
var _instances = (0, _classPrivateFieldLooseKey2.default)("instances");
var _increment = (0, _classPrivateFieldLooseKey2.default)("increment");
class Counter {
  constructor() {
    Object.defineProperty(this, _increment, {
      value: _increment2
    });
    Object.defineProperty(this, _count, {
      writable: true,
      value: 0
    });
    (0, _classPrivateFieldLooseBase2.default)(Counter, _instances)[_instances]++;
  }
  get value() {
    return (0, _classPrivateFieldLooseBase2.default)(this, _count)[_count];
  }
  increment() {
    (0, _classPrivateFieldLooseBase2.default)(this, _increment)[_increment]();
  }
  static get instanceCount() {
    return (0, _classPrivateFieldLooseBase2.default)(Counter, _instances)[_instances];
  }
}
exports.Counter = Counter;
function _increment2() {
  (0, _classPrivateFieldLooseBase2.default)(this, _count)[_count]++;
}
Object.defineProperty(Counter, _instances, {
  writable: true,
  value: 0
});
function asyncNumberGenerator(_x) {
  return _asyncNumberGenerator.apply(this, arguments);
}
function _asyncNumberGenerator() {
  _asyncNumberGenerator = (0, _wrapAsyncGenerator2.default)(function* (max) {
    for (let i = 0; i < max; i++) {
      yield (0, _awaitAsyncGenerator2.default)(new Promise(resolve => setTimeout(resolve, 100)));
      yield i;
    }
  });
  return _asyncNumberGenerator.apply(this, arguments);
}
function fetchData(_x2) {
  return _fetchData.apply(this, arguments);
}
function _fetchData() {
  _fetchData = (0, _asyncToGenerator2.default)(function* (url) {
    const response = yield fetch(url);
    const data = yield response.json();
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
    return (0, _asyncToGenerator2.default)(function* () {
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
  const {
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
  let total = 0;
  for (const [a, b] of pairs) {
    total += a + b;
  }
  return total;
}
function parseDate(dateString) {
  const regex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
  const match = dateString.match(regex);
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
  const match = text.match(/\p{Emoji}/u);
  return match?.[0];
}
const MyClass = class {
  constructor(value) {
    this.value = value;
  }
};
exports.MyClass = MyClass;
function loadModule() {
  return _loadModule.apply(this, arguments);
}
function _loadModule() {
  _loadModule = (0, _asyncToGenerator2.default)(function* () {
    const module = yield import('./some-module');
    return module.default;
  });
  return _loadModule.apply(this, arguments);
}
const LegacyComponent = exports.LegacyComponent = React.createClass({
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
  const [count, setCount] = (0, _react.useState)(initialCount);
  const [status, setStatus] = (0, _react.useState)(Status.Active);
  (0, _react.useEffect)(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  function handleAsyncClick() {
    return _handleAsyncClick.apply(this, arguments);
  }
  function _handleAsyncClick() {
    _handleAsyncClick = (0, _asyncToGenerator2.default)(function* () {
      const data = yield fetchData('/api/data');
      console.log(data);
    });
    return _handleAsyncClick.apply(this, arguments);
  }
  const handleClick = function () {
    var _ref = (0, _asyncToGenerator2.default)(function* () {
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