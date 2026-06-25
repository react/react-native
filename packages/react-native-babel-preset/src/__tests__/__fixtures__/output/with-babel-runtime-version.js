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
 *   - With specific babel runtime version
 *   - Options: {"dev":false,"enableBabelRuntime":"7.25.0"}
 */

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
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
var _wrapRegExp2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapRegExp"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _callSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/callSuper"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _classPrivateFieldLooseBase2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseBase"));
var _classPrivateFieldLooseKey2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldLooseKey"));
var _awaitAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/awaitAsyncGenerator"));
var _wrapAsyncGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapAsyncGenerator"));
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _jsxRuntime = require("react/jsx-runtime");
var _dataUtils = require("./data-utils");
var _count = (0, _classPrivateFieldLooseKey2.default)("count");
var _instances = (0, _classPrivateFieldLooseKey2.default)("instances");
var _increment = (0, _classPrivateFieldLooseKey2.default)("increment");
var Counter = exports.Counter = function () {
  function Counter() {
    (0, _classCallCheck2.default)(this, Counter);
    Object.defineProperty(this, _increment, {
      value: _increment2
    });
    Object.defineProperty(this, _count, {
      writable: true,
      value: 0
    });
    (0, _classPrivateFieldLooseBase2.default)(Counter, _instances)[_instances]++;
  }
  return (0, _createClass2.default)(Counter, [{
    key: "value",
    get: function () {
      return (0, _classPrivateFieldLooseBase2.default)(this, _count)[_count];
    }
  }, {
    key: "increment",
    value: function increment() {
      (0, _classPrivateFieldLooseBase2.default)(this, _increment)[_increment]();
    }
  }], [{
    key: "instanceCount",
    get: function () {
      return (0, _classPrivateFieldLooseBase2.default)(Counter, _instances)[_instances];
    }
  }]);
}();
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
    for (var i = 0; i < max; i++) {
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
var _age = (0, _classPrivateFieldLooseKey2.default)("age");
var Animal = exports.Animal = function () {
  function Animal(name, age) {
    (0, _classCallCheck2.default)(this, Animal);
    Object.defineProperty(this, _age, {
      writable: true,
      value: void 0
    });
    this.name = name;
    (0, _classPrivateFieldLooseBase2.default)(this, _age)[_age] = age;
  }
  return (0, _createClass2.default)(Animal, [{
    key: "speak",
    value: function speak() {
      return `${this.name} makes a sound`;
    }
  }, {
    key: "age",
    get: function () {
      return (0, _classPrivateFieldLooseBase2.default)(this, _age)[_age];
    }
  }]);
}();
var Dog = exports.Dog = function (_Animal2) {
  function Dog(name, age, breed) {
    var _this;
    (0, _classCallCheck2.default)(this, Dog);
    _this = (0, _callSuper2.default)(this, Dog, [name, age]);
    _this.breed = breed;
    return _this;
  }
  (0, _inherits2.default)(Dog, _Animal2);
  return (0, _createClass2.default)(Dog, [{
    key: "speak",
    value: function speak() {
      return `${this.name} barks!`;
    }
  }, {
    key: "fetchTreats",
    value: function () {
      var _fetchTreats = (0, _asyncToGenerator2.default)(function* () {
        yield new Promise(resolve => setTimeout(resolve, 100));
        return ['bone', 'biscuit', 'toy'];
      });
      function fetchTreats() {
        return _fetchTreats.apply(this, arguments);
      }
      return fetchTreats;
    }()
  }]);
}(Animal);
function processUser({
  name,
  age = 18,
  ...rest
}) {
  var _rest$city = rest.city,
    city = _rest$city === void 0 ? 'Unknown' : _rest$city;
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
  for (var _ref of pairs) {
    var _ref2 = (0, _slicedToArray2.default)(_ref, 2);
    var a = _ref2[0];
    var b = _ref2[1];
    total += a + b;
  }
  return total;
}
function parseDate(dateString) {
  var regex = (0, _wrapRegExp2.default)(/(\d{4})-(\d{2})-(\d{2})/, {
    year: 1,
    month: 2,
    day: 3
  });
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
  var match = text.match(/(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEDC-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDDFF\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9\uDEF0-\uDEF8])/);
  return match?.[0];
}
var MyClass = exports.MyClass = (0, _createClass2.default)(function MyClass(value) {
  (0, _classCallCheck2.default)(this, MyClass);
  this.value = value;
});
function loadModule() {
  return _loadModule.apply(this, arguments);
}
function _loadModule() {
  _loadModule = (0, _asyncToGenerator2.default)(function* () {
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
  var _useState = (0, _react.useState)(initialCount),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    count = _useState2[0],
    setCount = _useState2[1];
  var _useState3 = (0, _react.useState)(Status.Active),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    status = _useState4[0],
    setStatus = _useState4[1];
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
    _handleAsyncClick = (0, _asyncToGenerator2.default)(function* () {
      var data = yield fetchData('/api/data');
      console.log(data);
    });
    return _handleAsyncClick.apply(this, arguments);
  }
  var handleClick = function () {
    var _ref3 = (0, _asyncToGenerator2.default)(function* () {
      yield handleAsyncClick();
      setStatus(Status.Pending);
    });
    return function handleClick() {
      return _ref3.apply(this, arguments);
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