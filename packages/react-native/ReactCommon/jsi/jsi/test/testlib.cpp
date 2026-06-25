/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsi/test/testlib.h>

#include <gtest/gtest.h>
#include <jsi/decorator.h>
#include <jsi/jsi.h>

#include <stdlib.h>
#include <chrono>
#include <functional>
#include <thread>
#include <unordered_map>
#include <unordered_set>

using namespace facebook::jsi;

class JSITest : public JSITestBase {};

TEST_P(JSITest, RuntimeTest) {
  auto v = rt.evaluateJavaScript(std::make_unique<StringBuffer>("1"), "");
  EXPECT_EQ(v.getNumber(), 1);

  rt.evaluateJavaScript(std::make_unique<StringBuffer>("x = 1"), "");
  EXPECT_EQ(rt.global().getProperty(rt, "x").getNumber(), 1);
}

TEST_P(JSITest, PropNameIDTest) {
  // This is a little weird to test, because it doesn't really exist
  // in JS yet.  All I can do is create them, compare them, and
  // receive one as an argument to a HostObject.

  PropNameID quux = PropNameID::forAscii(rt, "quux1", 4);
  PropNameID movedQuux = std::move(quux);
  EXPECT_EQ(movedQuux.utf8(rt), "quux");
  movedQuux = PropNameID::forAscii(rt, "quux2");
  EXPECT_EQ(movedQuux.utf8(rt), "quux2");
  PropNameID copiedQuux = PropNameID(rt, movedQuux);
  EXPECT_TRUE(PropNameID::compare(rt, movedQuux, copiedQuux));

  EXPECT_TRUE(PropNameID::compare(rt, movedQuux, movedQuux));
  EXPECT_TRUE(
      PropNameID::compare(
          rt, movedQuux, PropNameID::forAscii(rt, std::string("quux2"))));
  EXPECT_FALSE(
      PropNameID::compare(
          rt, movedQuux, PropNameID::forAscii(rt, std::string("foo"))));
  uint8_t utf8[] = {0xF0, 0x9F, 0x86, 0x97};
  PropNameID utf8PropNameID = PropNameID::forUtf8(rt, utf8, sizeof(utf8));
  EXPECT_EQ(
      utf8PropNameID.utf8(rt), reinterpret_cast<const char*>(u8"\U0001F197"));
  EXPECT_TRUE(
      PropNameID::compare(
          rt, utf8PropNameID, PropNameID::forUtf8(rt, utf8, sizeof(utf8))));
  PropNameID nonUtf8PropNameID = PropNameID::forUtf8(rt, "meow");
  EXPECT_TRUE(
      PropNameID::compare(
          rt, nonUtf8PropNameID, PropNameID::forAscii(rt, "meow")));
  EXPECT_EQ(nonUtf8PropNameID.utf8(rt), "meow");
  PropNameID strPropNameID =
      PropNameID::forString(rt, String::createFromAscii(rt, "meow"));
  EXPECT_TRUE(PropNameID::compare(rt, nonUtf8PropNameID, strPropNameID));

  auto names = PropNameID::names(
      rt, "Ala", std::string("ma"), PropNameID::forAscii(rt, "kota"));
  EXPECT_EQ(names.size(), 3);
  EXPECT_TRUE(
      PropNameID::compare(rt, names[0], PropNameID::forAscii(rt, "Ala")));
  EXPECT_TRUE(
      PropNameID::compare(rt, names[1], PropNameID::forAscii(rt, "ma")));
  EXPECT_TRUE(
      PropNameID::compare(rt, names[2], PropNameID::forAscii(rt, "kota")));
}

TEST_P(JSITest, StringTest) {
  EXPECT_TRUE(checkValue(String::createFromAscii(rt, "foobar", 3), "'foo'"));
  EXPECT_TRUE(checkValue(String::createFromAscii(rt, "foobar"), "'foobar'"));

  std::string baz = "baz";
  EXPECT_TRUE(checkValue(String::createFromAscii(rt, baz), "'baz'"));

  uint8_t utf8[] = {0xF0, 0x9F, 0x86, 0x97};
  EXPECT_TRUE(checkValue(
      String::createFromUtf8(rt, utf8, sizeof(utf8)), "'\\uD83C\\uDD97'"));

  EXPECT_EQ(eval("'quux'").getString(rt).utf8(rt), "quux");
  EXPECT_EQ(eval("'\\u20AC'").getString(rt).utf8(rt), "\xe2\x82\xac");

  String quux = String::createFromAscii(rt, "quux");
  String movedQuux = std::move(quux);
  EXPECT_EQ(movedQuux.utf8(rt), "quux");
  movedQuux = String::createFromAscii(rt, "quux2");
  EXPECT_EQ(movedQuux.utf8(rt), "quux2");
}

TEST_P(JSITest, StringLengthTest) {
  // Test ASCII string length
  String ascii = String::createFromAscii(rt, "hello");
  EXPECT_EQ(ascii.length(rt), 5);

  // Test empty string
  String empty = String::createFromAscii(rt, "");
  EXPECT_EQ(empty.length(rt), 0);

  // Test euro sign '€' (U+20AC) - BMP character, 1 code unit
  String euro = eval("'\\u20AC'").getString(rt);
  EXPECT_EQ(euro.length(rt), 1);

  // Test codepoint requiring 2 code units (surrogate pair)
  // U+1F408 (🐈) is encoded as \uD83D\uDC08 in UTF-16
  String emoji = eval("'\\uD83D\\uDC08'").getString(rt);
  EXPECT_EQ(emoji.length(rt), 2);

  // Test another surrogate pair: U+10000 (first supplementary character)
  String supplementary = eval("'\\uD800\\uDC00'").getString(rt);
  EXPECT_EQ(supplementary.length(rt), 2);

  // Test lone high surrogate (U+D800)
  String loneHighSurrogate = eval("'\\uD800'").getString(rt);
  EXPECT_EQ(loneHighSurrogate.length(rt), 1);

  // Test lone low surrogate (U+DC00)
  String loneLowSurrogate = eval("'\\uDC00'").getString(rt);
  EXPECT_EQ(loneLowSurrogate.length(rt), 1);

  // Test lone surrogate in the middle of a string
  String mixedWithLoneSurrogate = eval("'a\\uD800b'").getString(rt);
  EXPECT_EQ(mixedWithLoneSurrogate.length(rt), 3);

  // Unicode Max Value is U+10FFFF, U+11FFFF is invalid
  // But it could be theoretically encoded as \uDBFF\uDFFF
  String invalid = eval("'\\uDBFF\\uDFFF'").getString(rt);
  EXPECT_EQ(invalid.length(rt), 2);
}

TEST_P(JSITest, ObjectTest) {
  eval("x = {1:2, '3':4, 5:'six', 'seven':['eight', 'nine']}");
  Object x = rt.global().getPropertyAsObject(rt, "x");
  EXPECT_EQ(x.getPropertyNames(rt).size(rt), 4);
  EXPECT_TRUE(x.hasProperty(rt, "1"));
  EXPECT_TRUE(x.hasProperty(rt, PropNameID::forAscii(rt, "1")));
  EXPECT_FALSE(x.hasProperty(rt, "2"));
  EXPECT_FALSE(x.hasProperty(rt, PropNameID::forAscii(rt, "2")));
  EXPECT_TRUE(x.hasProperty(rt, "3"));
  EXPECT_TRUE(x.hasProperty(rt, PropNameID::forAscii(rt, "3")));
  EXPECT_TRUE(x.hasProperty(rt, "seven"));
  EXPECT_TRUE(x.hasProperty(rt, PropNameID::forAscii(rt, "seven")));
  EXPECT_EQ(x.getProperty(rt, "1").getNumber(), 2);
  EXPECT_EQ(x.getProperty(rt, PropNameID::forAscii(rt, "1")).getNumber(), 2);
  EXPECT_EQ(x.getProperty(rt, "3").getNumber(), 4);
  Value five = 5;
  EXPECT_EQ(
      x.getProperty(rt, PropNameID::forString(rt, five.toString(rt)))
          .getString(rt)
          .utf8(rt),
      "six");

  x.setProperty(rt, "ten", 11);
  EXPECT_EQ(x.getPropertyNames(rt).size(rt), 5);
  EXPECT_TRUE(eval("x.ten == 11").getBool());

  x.setProperty(rt, "e_as_float", 2.71f);
  EXPECT_TRUE(eval("Math.abs(x.e_as_float - 2.71) < 0.001").getBool());

  x.setProperty(rt, "e_as_double", 2.71);
  EXPECT_TRUE(eval("x.e_as_double == 2.71").getBool());

  uint8_t utf8[] = {0xF0, 0x9F, 0x86, 0x97};
  String nonAsciiName = String::createFromUtf8(rt, utf8, sizeof(utf8));
  x.setProperty(rt, PropNameID::forString(rt, nonAsciiName), "emoji");
  EXPECT_EQ(x.getPropertyNames(rt).size(rt), 8);
  EXPECT_TRUE(eval("x['\\uD83C\\uDD97'] == 'emoji'").getBool());

  Object seven = x.getPropertyAsObject(rt, "seven");
  EXPECT_TRUE(seven.isArray(rt));
  Object evalf = rt.global().getPropertyAsObject(rt, "eval");
  EXPECT_TRUE(evalf.isFunction(rt));

  Object movedX = Object(rt);
  movedX = std::move(x);
  EXPECT_EQ(movedX.getPropertyNames(rt).size(rt), 8);
  EXPECT_EQ(movedX.getProperty(rt, "1").getNumber(), 2);

  Object obj = Object(rt);
  obj.setProperty(rt, "roses", "red");
  obj.setProperty(rt, "violets", "blue");
  Object oprop = Object(rt);
  obj.setProperty(rt, "oprop", oprop);
  obj.setProperty(rt, "aprop", Array(rt, 1));

  EXPECT_TRUE(function(
                  "function (obj) { return "
                  "obj.roses == 'red' && "
                  "obj['violets'] == 'blue' && "
                  "typeof obj.oprop == 'object' && "
                  "Array.isArray(obj.aprop); }")
                  .call(rt, obj)
                  .getBool());

  // Check that getPropertyNames doesn't return non-enumerable
  // properties.
  obj = function(
            "function () {"
            "  obj = {};"
            "  obj.a = 1;"
            "  Object.defineProperty(obj, 'b', {"
            "    enumerable: false,"
            "    value: 2"
            "  });"
            "  return obj;"
            "}")
            .call(rt)
            .getObject(rt);
  EXPECT_EQ(obj.getProperty(rt, "a").getNumber(), 1);
  EXPECT_EQ(obj.getProperty(rt, "b").getNumber(), 2);
  Array names = obj.getPropertyNames(rt);
  EXPECT_EQ(names.size(rt), 1);
  EXPECT_EQ(names.getValueAtIndex(rt, 0).getString(rt).utf8(rt), "a");

  // This Runtime Decorator is used to test the default implementation of
  // Runtime::has/get/setProperty with Value overload
  class RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    explicit RD(Runtime& rt) : RuntimeDecorator(rt) {}

    Value getProperty(const Object& object, const Value& name) override {
      return Runtime::getProperty(object, name);
    }

    bool hasProperty(const Object& object, const Value& name) override {
      return Runtime::hasProperty(object, name);
    }

    void setPropertyValue(
        const Object& object,
        const Value& name,
        const Value& value) override {
      Runtime::setPropertyValue(object, name, value);
    }
  };

  RD rd = RD(rt);

  obj = eval("const obj = {}; obj;").getObject(rd);
  auto propVal = Value(123);
  obj.setProperty(rd, propVal, 456);
  EXPECT_TRUE(obj.hasProperty(rd, propVal));
  auto getRes = obj.getProperty(rd, propVal);
  EXPECT_EQ(getRes.getNumber(), 456);

  /// The property is non-writable so it should fail
  obj = eval(
            "Object.defineProperty(obj, '456', {"
            "  value: 10,"
            "  writable: false,});")
            .getObject(rd);
  auto unwritableProp = Value(456);
  EXPECT_THROW(obj.setProperty(rd, unwritableProp, 1), JSError);

  auto badObjKey = eval(
      "var badObj = {"
      "    toString: function() {"
      "        throw new Error('something went wrong');"
      "    }"
      "};"
      "badObj;");
  EXPECT_THROW(obj.setProperty(rd, badObjKey, 123), JSError);
  EXPECT_THROW(obj.hasProperty(rd, badObjKey), JSError);
  EXPECT_THROW(obj.getProperty(rd, badObjKey), JSError);
}

TEST_P(JSITest, HostObjectTest) {
  class ConstantHostObject : public HostObject {
    Value get(Runtime&, const PropNameID& sym) override {
      return 9000;
    }

    void set(Runtime&, const PropNameID&, const Value&) override {}
  };

  Object cho =
      Object::createFromHostObject(rt, std::make_shared<ConstantHostObject>());
  EXPECT_TRUE(function("function (obj) { return obj.someRandomProp == 9000; }")
                  .call(rt, cho)
                  .getBool());
  EXPECT_TRUE(cho.isHostObject(rt));
  EXPECT_TRUE(cho.getHostObject<ConstantHostObject>(rt).get() != nullptr);

  struct SameRuntimeHostObject : HostObject {
    SameRuntimeHostObject(Runtime& rt) : rt_(rt) {};

    Value get(Runtime& rt, const PropNameID& sym) override {
      EXPECT_EQ(&rt, &rt_);
      return Value();
    }

    void set(Runtime& rt, const PropNameID& name, const Value& value) override {
      EXPECT_EQ(&rt, &rt_);
    }

    std::vector<PropNameID> getPropertyNames(Runtime& rt) override {
      EXPECT_EQ(&rt, &rt_);
      return {};
    }

    Runtime& rt_;
  };

  Object srho = Object::createFromHostObject(
      rt, std::make_shared<SameRuntimeHostObject>(rt));
  // Test get's Runtime is as expected
  function("function (obj) { return obj.isSame; }").call(rt, srho);
  // ... and set
  function("function (obj) { obj['k'] = 'v'; }").call(rt, srho);
  // ... and getPropertyNames
  function("function (obj) { for (k in obj) {} }").call(rt, srho);

  class TwiceHostObject : public HostObject {
    Value get(Runtime& rt, const PropNameID& sym) override {
      return String::createFromUtf8(rt, sym.utf8(rt) + sym.utf8(rt));
    }

    void set(Runtime&, const PropNameID&, const Value&) override {}
  };

  Object tho =
      Object::createFromHostObject(rt, std::make_shared<TwiceHostObject>());
  EXPECT_TRUE(function("function (obj) { return obj.abc == 'abcabc'; }")
                  .call(rt, tho)
                  .getBool());
  EXPECT_TRUE(function("function (obj) { return obj['def'] == 'defdef'; }")
                  .call(rt, tho)
                  .getBool());
  EXPECT_TRUE(function("function (obj) { return obj[12] === '1212'; }")
                  .call(rt, tho)
                  .getBool());
  EXPECT_TRUE(tho.isHostObject(rt));
  EXPECT_TRUE(
      std::dynamic_pointer_cast<ConstantHostObject>(tho.getHostObject(rt)) ==
      nullptr);
  EXPECT_TRUE(tho.getHostObject<TwiceHostObject>(rt).get() != nullptr);

  class PropNameIDHostObject : public HostObject {
    Value get(Runtime& rt, const PropNameID& sym) override {
      if (PropNameID::compare(rt, sym, PropNameID::forAscii(rt, "undef"))) {
        return Value::undefined();
      } else {
        return PropNameID::compare(
            rt, sym, PropNameID::forAscii(rt, "somesymbol"));
      }
    }

    void set(Runtime&, const PropNameID&, const Value&) override {}
  };

  Object sho = Object::createFromHostObject(
      rt, std::make_shared<PropNameIDHostObject>());
  EXPECT_TRUE(sho.isHostObject(rt));
  EXPECT_TRUE(function("function (obj) { return obj.undef; }")
                  .call(rt, sho)
                  .isUndefined());
  EXPECT_TRUE(function("function (obj) { return obj.somesymbol; }")
                  .call(rt, sho)
                  .getBool());
  EXPECT_FALSE(function("function (obj) { return obj.notsomuch; }")
                   .call(rt, sho)
                   .getBool());

  class BagHostObject : public HostObject {
   public:
    const std::string& getThing() {
      return bag_["thing"];
    }

   private:
    Value get(Runtime& rt, const PropNameID& sym) override {
      if (sym.utf8(rt) == "thing") {
        return String::createFromUtf8(rt, bag_[sym.utf8(rt)]);
      }
      return Value::undefined();
    }

    void set(Runtime& rt, const PropNameID& sym, const Value& val) override {
      std::string key(sym.utf8(rt));
      if (key == "thing") {
        bag_[key] = val.toString(rt).utf8(rt);
      }
    }

    std::unordered_map<std::string, std::string> bag_;
  };

  std::shared_ptr<BagHostObject> shbho = std::make_shared<BagHostObject>();
  Object bho = Object::createFromHostObject(rt, shbho);
  EXPECT_TRUE(bho.isHostObject(rt));
  EXPECT_TRUE(function("function (obj) { return obj.undef; }")
                  .call(rt, bho)
                  .isUndefined());
  EXPECT_EQ(
      function("function (obj) { obj.thing = 'hello'; return obj.thing; }")
          .call(rt, bho)
          .toString(rt)
          .utf8(rt),
      "hello");
  EXPECT_EQ(shbho->getThing(), "hello");

  class ThrowingHostObject : public HostObject {
    Value get(Runtime& rt, const PropNameID& sym) override {
      throw std::runtime_error("Cannot get");
    }

    void set(Runtime& rt, const PropNameID& sym, const Value& val) override {
      throw std::runtime_error("Cannot set");
    }
  };

  Object thro =
      Object::createFromHostObject(rt, std::make_shared<ThrowingHostObject>());
  EXPECT_TRUE(thro.isHostObject(rt));
  std::string exc;
  try {
    function("function (obj) { return obj.thing; }").call(rt, thro);
  } catch (const JSError& ex) {
    exc = ex.what();
  }
  EXPECT_NE(exc.find("Cannot get"), std::string::npos);
  exc = "";
  try {
    function("function (obj) { obj.thing = 'hello'; }").call(rt, thro);
  } catch (const JSError& ex) {
    exc = ex.what();
  }
  EXPECT_NE(exc.find("Cannot set"), std::string::npos);

  class NopHostObject : public HostObject {};
  Object nopHo =
      Object::createFromHostObject(rt, std::make_shared<NopHostObject>());
  EXPECT_TRUE(nopHo.isHostObject(rt));
  EXPECT_TRUE(function("function (obj) { return obj.thing; }")
                  .call(rt, nopHo)
                  .isUndefined());

  std::string nopExc;
  try {
    function("function (obj) { obj.thing = 'pika'; }").call(rt, nopHo);
  } catch (const JSError& ex) {
    nopExc = ex.what();
  }
  EXPECT_NE(nopExc.find("TypeError: "), std::string::npos);

  class HostObjectWithPropertyNames : public HostObject {
    std::vector<PropNameID> getPropertyNames(Runtime& rt) override {
      return PropNameID::names(
          rt, "a_prop", "1", "false", "a_prop", "3", "c_prop");
    }
  };

  Object howpn = Object::createFromHostObject(
      rt, std::make_shared<HostObjectWithPropertyNames>());
  EXPECT_TRUE(
      function(
          "function (o) { return Object.getOwnPropertyNames(o).length == 5 }")
          .call(rt, howpn)
          .getBool());

  auto hasOwnPropertyName = function(
      "function (o, p) {"
      "  return Object.getOwnPropertyNames(o).indexOf(p) >= 0"
      "}");
  EXPECT_TRUE(
      hasOwnPropertyName.call(rt, howpn, String::createFromAscii(rt, "a_prop"))
          .getBool());
  EXPECT_TRUE(
      hasOwnPropertyName.call(rt, howpn, String::createFromAscii(rt, "1"))
          .getBool());
  EXPECT_TRUE(
      hasOwnPropertyName.call(rt, howpn, String::createFromAscii(rt, "false"))
          .getBool());
  EXPECT_TRUE(
      hasOwnPropertyName.call(rt, howpn, String::createFromAscii(rt, "3"))
          .getBool());
  EXPECT_TRUE(
      hasOwnPropertyName.call(rt, howpn, String::createFromAscii(rt, "c_prop"))
          .getBool());
  EXPECT_FALSE(hasOwnPropertyName
                   .call(rt, howpn, String::createFromAscii(rt, "not_existing"))
                   .getBool());
}

TEST_P(JSITest, HostObjectProtoTest) {
  class ProtoHostObject : public HostObject {
    Value get(Runtime& rt, const PropNameID&) override {
      return String::createFromAscii(rt, "phoprop");
    }
  };

  rt.global().setProperty(
      rt,
      "pho",
      Object::createFromHostObject(rt, std::make_shared<ProtoHostObject>()));

  EXPECT_EQ(
      eval("({__proto__: pho})[Symbol.toPrimitive]").getString(rt).utf8(rt),
      "phoprop");
}

TEST_P(JSITest, ArrayTest) {
  eval("x = {1:2, '3':4, 5:'six', 'seven':['eight', 'nine']}");

  Object x = rt.global().getPropertyAsObject(rt, "x");
  Array names = x.getPropertyNames(rt);
  EXPECT_EQ(names.size(rt), 4);
  std::unordered_set<std::string> strNames;
  for (size_t i = 0; i < names.size(rt); ++i) {
    Value n = names.getValueAtIndex(rt, i);
    EXPECT_TRUE(n.isString());
    strNames.insert(n.getString(rt).utf8(rt));
  }

  EXPECT_EQ(strNames.size(), 4);
  EXPECT_EQ(strNames.count("1"), 1);
  EXPECT_EQ(strNames.count("3"), 1);
  EXPECT_EQ(strNames.count("5"), 1);
  EXPECT_EQ(strNames.count("seven"), 1);

  Object seven = x.getPropertyAsObject(rt, "seven");
  Array arr = seven.getArray(rt);

  EXPECT_EQ(arr.size(rt), 2);
  EXPECT_EQ(arr.getValueAtIndex(rt, 0).getString(rt).utf8(rt), "eight");
  EXPECT_EQ(arr.getValueAtIndex(rt, 1).getString(rt).utf8(rt), "nine");
  // TODO: test out of range

  EXPECT_EQ(x.getPropertyAsObject(rt, "seven").getArray(rt).size(rt), 2);

  // Check that property access with both symbols and strings can access
  // array values.
  EXPECT_EQ(seven.getProperty(rt, "0").getString(rt).utf8(rt), "eight");
  EXPECT_EQ(seven.getProperty(rt, "1").getString(rt).utf8(rt), "nine");
  seven.setProperty(rt, "1", "modified");
  EXPECT_EQ(seven.getProperty(rt, "1").getString(rt).utf8(rt), "modified");
  EXPECT_EQ(arr.getValueAtIndex(rt, 1).getString(rt).utf8(rt), "modified");
  EXPECT_EQ(
      seven.getProperty(rt, PropNameID::forAscii(rt, "0"))
          .getString(rt)
          .utf8(rt),
      "eight");
  seven.setProperty(rt, PropNameID::forAscii(rt, "0"), "modified2");
  EXPECT_EQ(arr.getValueAtIndex(rt, 0).getString(rt).utf8(rt), "modified2");

  Array alpha = Array(rt, 4);
  EXPECT_TRUE(alpha.getValueAtIndex(rt, 0).isUndefined());
  EXPECT_TRUE(alpha.getValueAtIndex(rt, 3).isUndefined());
  EXPECT_EQ(alpha.size(rt), 4);
  alpha.setValueAtIndex(rt, 0, "a");
  alpha.setValueAtIndex(rt, 1, "b");
  EXPECT_EQ(alpha.length(rt), 4);
  alpha.setValueAtIndex(rt, 2, "c");
  alpha.setValueAtIndex(rt, 3, "d");
  EXPECT_EQ(alpha.size(rt), 4);

  EXPECT_TRUE(
      function(
          "function (arr) { return "
          "arr.length == 4 && "
          "['a','b','c','d'].every(function(v,i) { return v === arr[i]}); }")
          .call(rt, alpha)
          .getBool());

  Array alpha2 = Array(rt, 1);
  alpha2 = std::move(alpha);
  EXPECT_EQ(alpha2.size(rt), 4);

  // Test getting/setting an element that is an accessor.
  auto arrWithAccessor =
      eval(
          "Object.defineProperty([], '0', {set(){ throw 72 }, get(){ return 45 }});")
          .getObject(rt)
          .getArray(rt);
  try {
    arrWithAccessor.setValueAtIndex(rt, 0, 1);
    FAIL() << "Expected exception";
  } catch (const JSError& err) {
    EXPECT_EQ(err.value().getNumber(), 72);
  }
  EXPECT_EQ(arrWithAccessor.getValueAtIndex(rt, 0).getNumber(), 45);
}

TEST_P(JSITest, FunctionTest) {
  // test move ctor
  Function fmove = function("function() { return 1 }");
  {
    Function g = function("function() { return 2 }");
    fmove = std::move(g);
  }
  EXPECT_EQ(fmove.call(rt).getNumber(), 2);

  // This tests all the function argument converters, and all the
  // non-lvalue overloads of call().
  Function f = function(
      "function(n, b, d, df, i, s1, s2, s3, s_sun, s_bad, o, a, f, v) { "
      "return "
      "n === null && "
      "b === true && "
      "d === 3.14 && "
      "Math.abs(df - 2.71) < 0.001 && "
      "i === 17 && "
      "s1 == 's1' && "
      "s2 == 's2' && "
      "s3 == 's3' && "
      "s_sun == 's\\u2600' && "
      "typeof s_bad == 'string' && "
      "typeof o == 'object' && "
      "Array.isArray(a) && "
      "typeof f == 'function' && "
      "v == 42 }");
  EXPECT_TRUE(f.call(
                   rt,
                   nullptr,
                   true,
                   3.14,
                   2.71f,
                   17,
                   "s1",
                   String::createFromAscii(rt, "s2"),
                   std::string{"s3"},
                   std::string{reinterpret_cast<const char*>(u8"s\u2600")},
                   // invalid UTF8 sequence due to unexpected continuation byte
                   std::string{"s\x80"},
                   Object(rt),
                   Array(rt, 1),
                   function("function(){}"),
                   Value(42))
                  .getBool());

  // lvalue overloads of call()
  Function flv = function(
      "function(s, o, a, f, v) { return "
      "s == 's' && "
      "typeof o == 'object' && "
      "Array.isArray(a) && "
      "typeof f == 'function' && "
      "v == 42 }");

  String s = String::createFromAscii(rt, "s");
  Object o = Object(rt);
  Array a = Array(rt, 1);
  Value v = 42;
  EXPECT_TRUE(flv.call(rt, s, o, a, f, v).getBool());

  Function f1 = function("function() { return 1; }");
  Function f2 = function("function() { return 2; }");
  f2 = std::move(f1);
  EXPECT_EQ(f2.call(rt).getNumber(), 1);
}

TEST_P(JSITest, FunctionThisTest) {
  Function checkPropertyFunction =
      function("function() { return this.a === 'a_property' }");

  Object jsObject = Object(rt);
  jsObject.setProperty(rt, "a", String::createFromUtf8(rt, "a_property"));

  class APropertyHostObject : public HostObject {
    Value get(Runtime& rt, const PropNameID& sym) override {
      return String::createFromUtf8(rt, "a_property");
    }

    void set(Runtime&, const PropNameID&, const Value&) override {}
  };
  Object hostObject =
      Object::createFromHostObject(rt, std::make_shared<APropertyHostObject>());

  EXPECT_TRUE(checkPropertyFunction.callWithThis(rt, jsObject).getBool());
  EXPECT_TRUE(checkPropertyFunction.callWithThis(rt, hostObject).getBool());
  EXPECT_FALSE(checkPropertyFunction.callWithThis(rt, Array(rt, 5)).getBool());
  EXPECT_FALSE(checkPropertyFunction.call(rt).getBool());
}

TEST_P(JSITest, FunctionConstructorTest) {
  Function ctor = function(
      "function (a) {"
      "  if (typeof a !== 'undefined') {"
      "   this.pika = a;"
      "  }"
      "}");
  ctor.getProperty(rt, "prototype")
      .getObject(rt)
      .setProperty(rt, "pika", "chu");
  auto empty = ctor.callAsConstructor(rt);
  EXPECT_TRUE(empty.isObject());
  auto emptyObj = std::move(empty).getObject(rt);
  EXPECT_EQ(emptyObj.getProperty(rt, "pika").getString(rt).utf8(rt), "chu");
  auto who = ctor.callAsConstructor(rt, "who");
  EXPECT_TRUE(who.isObject());
  auto whoObj = std::move(who).getObject(rt);
  EXPECT_EQ(whoObj.getProperty(rt, "pika").getString(rt).utf8(rt), "who");

  auto instanceof = function("function (o, b) { return o instanceof b; }");
  EXPECT_TRUE(instanceof.call(rt, emptyObj, ctor).getBool());
  EXPECT_TRUE(instanceof.call(rt, whoObj, ctor).getBool());

  auto dateCtor = rt.global().getPropertyAsFunction(rt, "Date");
  auto date = dateCtor.callAsConstructor(rt);
  EXPECT_TRUE(date.isObject());
  EXPECT_TRUE(instanceof.call(rt, date, dateCtor).getBool());
  // Sleep for 50 milliseconds
  std::this_thread::sleep_for(std::chrono::milliseconds(50));
  EXPECT_GE(
      function("function (d) { return (new Date()).getTime() - d.getTime(); }")
          .call(rt, date)
          .getNumber(),
      50);
}

TEST_P(JSITest, InstanceOfTest) {
  auto ctor = function("function Rick() { this.say = 'wubalubadubdub'; }");
  auto newObj = function("function (ctor) { return new ctor(); }");
  auto instance = newObj.call(rt, ctor).getObject(rt);
  EXPECT_TRUE(instance.instanceOf(rt, ctor));
  EXPECT_EQ(
      instance.getProperty(rt, "say").getString(rt).utf8(rt), "wubalubadubdub");
  EXPECT_FALSE(Object(rt).instanceOf(rt, ctor));
  EXPECT_TRUE(ctor.callAsConstructor(rt, nullptr, 0)
                  .getObject(rt)
                  .instanceOf(rt, ctor));
}

TEST_P(JSITest, HostFunctionTest) {
  auto one = std::make_shared<int>(1);
  Function plusOne = Function::createFromHostFunction(
      rt,
      PropNameID::forAscii(rt, "plusOne"),
      2,
      [one, savedRt = &rt](
          Runtime& rt, const Value& thisVal, const Value* args, size_t count) {
        EXPECT_EQ(savedRt, &rt);
        // We don't know if we're in strict mode or not, so it's either global
        // or undefined.
        EXPECT_TRUE(
            Value::strictEquals(rt, thisVal, rt.global()) ||
            thisVal.isUndefined());
        return *one + args[0].getNumber() + args[1].getNumber();
      });

  EXPECT_EQ(plusOne.call(rt, 1, 2).getNumber(), 4);
  EXPECT_TRUE(checkValue(plusOne.call(rt, 3, 5), "9"));
  rt.global().setProperty(rt, "plusOne", plusOne);
  EXPECT_TRUE(eval("plusOne(20, 300) == 321").getBool());

  Function dot = Function::createFromHostFunction(
      rt,
      PropNameID::forAscii(rt, "dot"),
      2,
      [](Runtime& rt, const Value& thisVal, const Value* args, size_t count) {
        EXPECT_TRUE(
            Value::strictEquals(rt, thisVal, rt.global()) ||
            thisVal.isUndefined());
        if (count != 2) {
          throw std::runtime_error("expected 2 args");
        }
        std::string ret = args[0].getString(rt).utf8(rt) + "." +
            args[1].getString(rt).utf8(rt);
        return String::createFromUtf8(
            rt, reinterpret_cast<const uint8_t*>(ret.data()), ret.size());
      });

  rt.global().setProperty(rt, "cons", dot);
  EXPECT_TRUE(eval("cons('left', 'right') == 'left.right'").getBool());
  EXPECT_TRUE(eval("cons.name == 'dot'").getBool());
  EXPECT_TRUE(eval("cons.length == 2").getBool());
  EXPECT_TRUE(eval("cons instanceof Function").getBool());

  EXPECT_TRUE(eval(
                  "(function() {"
                  "  try {"
                  "    cons('fail'); return false;"
                  "  } catch (e) {"
                  "    return ((e instanceof Error) &&"
                  "            (e.message == 'Exception in HostFunction: ' +"
                  "                          'expected 2 args'));"
                  "  }})()")
                  .getBool());

  Function coolify = Function::createFromHostFunction(
      rt,
      PropNameID::forAscii(rt, "coolify"),
      0,
      [](Runtime& rt, const Value& thisVal, const Value* args, size_t count) {
        EXPECT_EQ(count, 0);
        std::string ret = thisVal.toString(rt).utf8(rt) + " is cool";
        return String::createFromUtf8(
            rt, reinterpret_cast<const uint8_t*>(ret.data()), ret.size());
      });
  rt.global().setProperty(rt, "coolify", coolify);
  EXPECT_TRUE(eval("coolify.name == 'coolify'").getBool());
  EXPECT_TRUE(eval("coolify.length == 0").getBool());
  EXPECT_TRUE(eval("coolify.bind('R&M')() == 'R&M is cool'").getBool());
  EXPECT_TRUE(eval(
                  "(function() {"
                  "  var s = coolify.bind(function(){})();"
                  "  return s.lastIndexOf(' is cool') == (s.length - 8);"
                  "})()")
                  .getBool());

  Function lookAtMe = Function::createFromHostFunction(
      rt,
      PropNameID::forAscii(rt, "lookAtMe"),
      0,
      [](Runtime& rt, const Value& thisVal, const Value* args, size_t count)
          -> Value {
        EXPECT_TRUE(thisVal.isObject());
        EXPECT_EQ(
            thisVal.getObject(rt)
                .getProperty(rt, "name")
                .getString(rt)
                .utf8(rt),
            "mr.meeseeks");
        return Value();
      });
  rt.global().setProperty(rt, "lookAtMe", lookAtMe);
  EXPECT_TRUE(eval("lookAtMe.bind({'name': 'mr.meeseeks'})()").isUndefined());

  struct Callable {
    Callable(std::string s) : str(s) {}

    Value
    operator()(Runtime& rt, const Value&, const Value* args, size_t count) {
      if (count != 1) {
        return Value();
      }
      return String::createFromUtf8(
          rt, args[0].toString(rt).utf8(rt) + " was called with " + str);
    }

    std::string str;
  };

  Function callable = Function::createFromHostFunction(
      rt,
      PropNameID::forAscii(rt, "callable"),
      1,
      Callable("std::function::target"));
  EXPECT_EQ(
      function("function (f) { return f('A cat'); }")
          .call(rt, callable)
          .getString(rt)
          .utf8(rt),
      "A cat was called with std::function::target");
  EXPECT_TRUE(callable.isHostFunction(rt));
  EXPECT_TRUE(callable.getHostFunction(rt).target<Callable>() != nullptr);

  std::string strval = "strval1";
  auto getter = Object(rt);
  getter.setProperty(
      rt,
      "get",
      Function::createFromHostFunction(
          rt,
          PropNameID::forAscii(rt, "getter"),
          1,
          [&strval](
              Runtime& rt,
              const Value& thisVal,
              const Value* args,
              size_t count) -> Value {
            return String::createFromUtf8(rt, strval);
          }));
  auto obj = Object(rt);
  rt.global()
      .getPropertyAsObject(rt, "Object")
      .getPropertyAsFunction(rt, "defineProperty")
      .call(rt, obj, "prop", getter);
  EXPECT_TRUE(function("function(value) { return value.prop == 'strval1'; }")
                  .call(rt, obj)
                  .getBool());
  strval = "strval2";
  EXPECT_TRUE(function("function(value) { return value.prop == 'strval2'; }")
                  .call(rt, obj)
                  .getBool());
}

TEST_P(JSITest, ValueTest) {
  EXPECT_TRUE(checkValue(Value::undefined(), "undefined"));
  EXPECT_TRUE(checkValue(Value(), "undefined"));
  EXPECT_TRUE(checkValue(Value::null(), "null"));
  EXPECT_TRUE(checkValue(nullptr, "null"));

  EXPECT_TRUE(checkValue(Value(false), "false"));
  EXPECT_TRUE(checkValue(false, "false"));
  EXPECT_TRUE(checkValue(true, "true"));

  EXPECT_TRUE(checkValue(Value(1.5), "1.5"));
  EXPECT_TRUE(checkValue(2.5, "2.5"));

  EXPECT_TRUE(checkValue(Value(10), "10"));
  EXPECT_TRUE(checkValue(20, "20"));
  EXPECT_TRUE(checkValue(30, "30"));

  // rvalue implicit conversion
  EXPECT_TRUE(checkValue(String::createFromAscii(rt, "one"), "'one'"));
  // lvalue explicit copy
  String s = String::createFromAscii(rt, "two");
  EXPECT_TRUE(checkValue(Value(rt, s), "'two'"));

  {
    // rvalue assignment of trivial value
    Value v1 = 100;
    Value v2 = String::createFromAscii(rt, "hundred");
    v2 = std::move(v1);
    EXPECT_TRUE(v2.isNumber());
    EXPECT_EQ(v2.getNumber(), 100);
  }

  {
    // rvalue assignment of js heap value
    Value v1 = String::createFromAscii(rt, "hundred");
    Value v2 = 100;
    v2 = std::move(v1);
    EXPECT_TRUE(v2.isString());
    EXPECT_EQ(v2.getString(rt).utf8(rt), "hundred");
  }

  Object o = Object(rt);
  EXPECT_TRUE(function("function(value) { return typeof(value) == 'object'; }")
                  .call(rt, Value(rt, o))
                  .getBool());

  uint8_t utf8[] = "[null, 2, \"c\", \"emoji: \xf0\x9f\x86\x97\", {}]";

  EXPECT_TRUE(
      function(
          "function (arr) { return "
          "Array.isArray(arr) && "
          "arr.length == 5 && "
          "arr[0] === null && "
          "arr[1] == 2 && "
          "arr[2] == 'c' && "
          "arr[3] == 'emoji: \\uD83C\\uDD97' && "
          "typeof arr[4] == 'object'; }")
          .call(rt, Value::createFromJsonUtf8(rt, utf8, sizeof(utf8) - 1))
          .getBool());

  EXPECT_TRUE(eval("undefined").isUndefined());
  EXPECT_TRUE(eval("null").isNull());
  EXPECT_TRUE(eval("true").isBool());
  EXPECT_TRUE(eval("false").isBool());
  EXPECT_TRUE(eval("123").isNumber());
  EXPECT_TRUE(eval("123.4").isNumber());
  EXPECT_TRUE(eval("'str'").isString());
  // "{}" returns undefined.  empty code block?
  EXPECT_TRUE(eval("({})").isObject());
  EXPECT_TRUE(eval("[]").isObject());
  EXPECT_TRUE(eval("(function(){})").isObject());

  EXPECT_EQ(eval("123").getNumber(), 123);
  EXPECT_EQ(eval("123.4").getNumber(), 123.4);
  EXPECT_EQ(eval("'str'").getString(rt).utf8(rt), "str");
  EXPECT_TRUE(eval("[]").getObject(rt).isArray(rt));

  EXPECT_TRUE(eval("true").asBool());
  EXPECT_THROW(eval("123").asBool(), JSIException);
  EXPECT_EQ(eval("456").asNumber(), 456);
  EXPECT_THROW(eval("'word'").asNumber(), JSIException);
  EXPECT_EQ(
      eval("({1:2, 3:4})").asObject(rt).getProperty(rt, "1").getNumber(), 2);
  EXPECT_THROW(eval("'oops'").asObject(rt), JSIException);

  EXPECT_EQ(eval("['zero',1,2,3]").toString(rt).utf8(rt), "zero,1,2,3");
}

TEST_P(JSITest, IsIntegerTest) {
  // Non-number values should return false
  EXPECT_FALSE(Value::undefined().isInteger());
  EXPECT_FALSE(Value::null().isInteger());
  EXPECT_FALSE(Value(true).isInteger());
  EXPECT_FALSE(Value(false).isInteger());
  EXPECT_FALSE(Value(rt, String::createFromAscii(rt, "42")).isInteger());
  EXPECT_FALSE(Value(rt, Object(rt)).isInteger());

  // NaN should return false
  EXPECT_FALSE(Value(std::numeric_limits<double>::quiet_NaN()).isInteger());

  // Infinity should return false
  EXPECT_FALSE(Value(std::numeric_limits<double>::infinity()).isInteger());
  EXPECT_FALSE(Value(-std::numeric_limits<double>::infinity()).isInteger());

  // Non-integer numbers should return false
  EXPECT_FALSE(Value(1.5).isInteger());
  EXPECT_FALSE(Value(-2.3).isInteger());
  EXPECT_FALSE(Value(0.1).isInteger());

  // Integer numbers should return true
  EXPECT_TRUE(Value(0).isInteger());
  EXPECT_TRUE(Value(0.0).isInteger());
  EXPECT_TRUE(Value(-0.0).isInteger());
  EXPECT_TRUE(Value(1).isInteger());
  EXPECT_TRUE(Value(-1).isInteger());
  EXPECT_TRUE(Value(42).isInteger());
  EXPECT_TRUE(Value(1000000).isInteger());
  EXPECT_TRUE(Value(-999999).isInteger());

  // Large integers that can be exactly represented as doubles
  EXPECT_TRUE(Value(static_cast<double>(1LL << 52)).isInteger());
  EXPECT_TRUE(Value(static_cast<double>(-(1LL << 52))).isInteger());
}

TEST_P(JSITest, EqualsTest) {
  EXPECT_TRUE(Object::strictEquals(rt, rt.global(), rt.global()));
  EXPECT_TRUE(Value::strictEquals(rt, 1, 1));
  EXPECT_FALSE(Value::strictEquals(rt, true, 1));
  EXPECT_FALSE(Value::strictEquals(rt, true, false));
  EXPECT_TRUE(Value::strictEquals(rt, false, false));
  EXPECT_FALSE(Value::strictEquals(rt, nullptr, 1));
  EXPECT_TRUE(Value::strictEquals(rt, nullptr, nullptr));
  EXPECT_TRUE(Value::strictEquals(rt, Value::undefined(), Value()));
  EXPECT_TRUE(Value::strictEquals(rt, rt.global(), Value(rt.global())));
  EXPECT_FALSE(
      Value::strictEquals(
          rt,
          std::numeric_limits<double>::quiet_NaN(),
          std::numeric_limits<double>::quiet_NaN()));
  EXPECT_FALSE(
      Value::strictEquals(
          rt,
          std::numeric_limits<double>::signaling_NaN(),
          std::numeric_limits<double>::signaling_NaN()));
  EXPECT_TRUE(Value::strictEquals(rt, +0.0, -0.0));
  EXPECT_TRUE(Value::strictEquals(rt, -0.0, +0.0));

  Function noop = Function::createFromHostFunction(
      rt,
      PropNameID::forAscii(rt, "noop"),
      0,
      [](const Runtime&, const Value&, const Value*, size_t) {
        return Value();
      });
  auto noopDup = Value(rt, noop).getObject(rt);
  EXPECT_TRUE(Object::strictEquals(rt, noop, noopDup));
  EXPECT_TRUE(Object::strictEquals(rt, noopDup, noop));
  EXPECT_FALSE(Object::strictEquals(rt, noop, rt.global()));
  EXPECT_TRUE(Object::strictEquals(rt, noop, noop));
  EXPECT_TRUE(Value::strictEquals(rt, Value(rt, noop), Value(rt, noop)));

  String str = String::createFromAscii(rt, "rick");
  String strDup = String::createFromAscii(rt, "rick");
  String otherStr = String::createFromAscii(rt, "morty");
  EXPECT_TRUE(String::strictEquals(rt, str, str));
  EXPECT_TRUE(String::strictEquals(rt, str, strDup));
  EXPECT_TRUE(String::strictEquals(rt, strDup, str));
  EXPECT_FALSE(String::strictEquals(rt, str, otherStr));
  EXPECT_TRUE(Value::strictEquals(rt, Value(rt, str), Value(rt, str)));
  EXPECT_FALSE(Value::strictEquals(rt, Value(rt, str), Value(rt, noop)));
  EXPECT_FALSE(Value::strictEquals(rt, Value(rt, str), 1.0));
}

TEST_P(JSITest, ExceptionStackTraceTest) {
  static const char invokeUndefinedScript[] =
      "function hello() {"
      "  var a = {}; a.log(); }"
      "function world() { hello(); }"
      "world()";
  std::string stack;
  try {
    rt.evaluateJavaScript(
        std::make_unique<StringBuffer>(invokeUndefinedScript), "");
  } catch (JSError& e) {
    stack = e.getStack();
  }
  EXPECT_NE(stack.find("world"), std::string::npos);
}

TEST_P(JSITest, PreparedJavaScriptSourceTest) {
  rt.evaluateJavaScript(std::make_unique<StringBuffer>("var q = 0;"), "");
  auto prep = rt.prepareJavaScript(std::make_unique<StringBuffer>("q++;"), "");
  EXPECT_EQ(rt.global().getProperty(rt, "q").getNumber(), 0);
  rt.evaluatePreparedJavaScript(prep);
  EXPECT_EQ(rt.global().getProperty(rt, "q").getNumber(), 1);
  rt.evaluatePreparedJavaScript(prep);
  EXPECT_EQ(rt.global().getProperty(rt, "q").getNumber(), 2);
}

TEST_P(JSITest, PreparedJavaScriptURLInBacktrace) {
  std::string sourceURL = "//PreparedJavaScriptURLInBacktrace/Test/URL";
  std::string throwingSource =
      "function thrower() { throw new Error('oops')}"
      "thrower();";
  auto prep = rt.prepareJavaScript(
      std::make_unique<StringBuffer>(throwingSource), sourceURL);
  try {
    rt.evaluatePreparedJavaScript(prep);
    FAIL() << "prepareJavaScript should have thrown an exception";
  } catch (facebook::jsi::JSError err) {
    EXPECT_NE(std::string::npos, err.getStack().find(sourceURL))
        << "Backtrace should contain source URL";
  }
}

namespace {

unsigned countOccurences(const std::string& of, const std::string& in) {
  unsigned occurences = 0;
  std::string::size_type lastOccurence = -1;
  while ((lastOccurence = in.find(of, lastOccurence + 1)) !=
         std::string::npos) {
    occurences++;
  }
  return occurences;
}

} // namespace

TEST_P(JSITest, JSErrorsArePropagatedNicely) {
  unsigned callsBeforeError = 5;

  Function sometimesThrows = function(
      "function sometimesThrows(shouldThrow, callback) {"
      "  if (shouldThrow) {"
      "    throw Error('Omg, what a nasty exception')"
      "  }"
      "  callback(callback);"
      "}");

  Function callback = Function::createFromHostFunction(
      rt,
      PropNameID::forAscii(rt, "callback"),
      0,
      [&sometimesThrows, &callsBeforeError](
          Runtime& rt, const Value& thisVal, const Value* args, size_t count) {
        return sometimesThrows.call(rt, --callsBeforeError == 0, args[0]);
      });

  try {
    sometimesThrows.call(rt, false, callback);
  } catch (JSError& error) {
    EXPECT_EQ(error.getMessage(), "Omg, what a nasty exception");
    EXPECT_EQ(countOccurences("sometimesThrows", error.getStack()), 6);

    // system JSC JSI does not implement host function names
    // EXPECT_EQ(countOccurences("callback", error.getStack(rt)), 5);
  }
}

TEST_P(JSITest, JSErrorsCanBeConstructedWithStack) {
  auto err = JSError(rt, "message", "stack");
  EXPECT_EQ(err.getMessage(), "message");
  EXPECT_EQ(err.getStack(), "stack");
}

TEST_P(JSITest, JSErrorDoesNotInfinitelyRecurse) {
  Value globalError = rt.global().getProperty(rt, "Error");
  rt.global().setProperty(rt, "Error", Value::undefined());
  try {
    rt.global().getPropertyAsFunction(rt, "NotAFunction");
    FAIL() << "expected exception";
  } catch (const JSError& ex) {
    EXPECT_EQ(
        ex.getMessage(),
        "callGlobalFunction: JS global property 'Error' is undefined, "
        "expected a Function (while raising getPropertyAsObject: "
        "property 'NotAFunction' is undefined, expected an Object)");
  }

  // If Error is missing, this is fundamentally a problem with JS code
  // messing up the global object, so it should present in JS code as
  // a catchable string.  Not an Error (because that's broken), or as
  // a C++ failure.

  auto fails = [](Runtime& rt, const Value&, const Value*, size_t) -> Value {
    return rt.global().getPropertyAsObject(rt, "NotAProperty");
  };
  EXPECT_EQ(
      function(
          "function (f) { try { f(); return 'undefined'; }"
          "catch (e) { return typeof e; } }")
          .call(
              rt,
              Function::createFromHostFunction(
                  rt, PropNameID::forAscii(rt, "fails"), 0, fails))
          .getString(rt)
          .utf8(rt),
      "string");

  rt.global().setProperty(rt, "Error", globalError);
}

TEST_P(JSITest, JSErrorStackOverflowHandling) {
  rt.global().setProperty(
      rt,
      "callSomething",
      Function::createFromHostFunction(
          rt,
          PropNameID::forAscii(rt, "callSomething"),
          0,
          [this](
              Runtime& rt2,
              const Value& thisVal,
              const Value* args,
              size_t count) {
            EXPECT_EQ(&rt, &rt2);
            return function("function() { return 0; }").call(rt);
          }));
  try {
    eval("(function f() { callSomething(); f.apply(); })()");
    FAIL();
  } catch (const JSError& ex) {
    EXPECT_NE(std::string(ex.what()).find("exceeded"), std::string::npos);
  }
}

TEST_P(JSITest, ScopeDoesNotCrashTest) {
  Scope scope(rt);
  Object o(rt);
}

TEST_P(JSITest, ScopeDoesNotCrashWhenValueEscapes) {
  Value v;
  Scope::callInNewScope(rt, [&]() {
    Object o(rt);
    o.setProperty(rt, "a", 5);
    v = std::move(o);
  });
  EXPECT_EQ(v.getObject(rt).getProperty(rt, "a").getNumber(), 5);
}

// Verifies you can have a host object that emulates a normal object
TEST_P(JSITest, HostObjectWithValueMembers) {
  class Bag : public HostObject {
   public:
    Bag() = default;

    const Value& operator[](const std::string& name) const {
      auto iter = data_.find(name);
      if (iter == data_.end()) {
        return undef_;
      }
      return iter->second;
    }

   protected:
    Value get(Runtime& rt, const PropNameID& name) override {
      return Value(rt, (*this)[name.utf8(rt)]);
    }

    void set(Runtime& rt, const PropNameID& name, const Value& val) override {
      data_.emplace(name.utf8(rt), Value(rt, val));
    }

    Value undef_;
    std::map<std::string, Value> data_;
  };

  auto sharedBag = std::make_shared<Bag>();
  auto& bag = *sharedBag;
  Object jsbag = Object::createFromHostObject(rt, std::move(sharedBag));
  auto set = function(
      "function (o) {"
      "  o.foo = 'bar';"
      "  o.count = 37;"
      "  o.nul = null;"
      "  o.iscool = true;"
      "  o.obj = { 'foo': 'bar' };"
      "}");
  set.call(rt, jsbag);
  auto checkFoo = function("function (o) { return o.foo === 'bar'; }");
  auto checkCount = function("function (o) { return o.count === 37; }");
  auto checkNul = function("function (o) { return o.nul === null; }");
  auto checkIsCool = function("function (o) { return o.iscool === true; }");
  auto checkObj = function(
      "function (o) {"
      "  return (typeof o.obj) === 'object' && o.obj.foo === 'bar';"
      "}");
  // Check this looks good from js
  EXPECT_TRUE(checkFoo.call(rt, jsbag).getBool());
  EXPECT_TRUE(checkCount.call(rt, jsbag).getBool());
  EXPECT_TRUE(checkNul.call(rt, jsbag).getBool());
  EXPECT_TRUE(checkIsCool.call(rt, jsbag).getBool());
  EXPECT_TRUE(checkObj.call(rt, jsbag).getBool());

  // Check this looks good from c++
  EXPECT_EQ(bag["foo"].getString(rt).utf8(rt), "bar");
  EXPECT_EQ(bag["count"].getNumber(), 37);
  EXPECT_TRUE(bag["nul"].isNull());
  EXPECT_TRUE(bag["iscool"].getBool());
  EXPECT_EQ(
      bag["obj"].getObject(rt).getProperty(rt, "foo").getString(rt).utf8(rt),
      "bar");
}

TEST_P(JSITest, DecoratorTest) {
  struct Count {
    // init here is just to show that a With type does not need to be
    // default constructible.
    explicit Count(int init) : count(init) {}

    // Test optional before method.

    void after() {
      ++count;
    }

    int count;
  };

  static constexpr int kInit = 17;

  class CountRuntime final : public WithRuntimeDecorator<Count> {
   public:
    explicit CountRuntime(std::shared_ptr<Runtime> rt)
        : WithRuntimeDecorator<Count>(*rt, count_),
          rt_(std::move(rt)),
          count_(kInit) {}

    int count() {
      return count_.count;
    }

   private:
    std::shared_ptr<Runtime> rt_;
    Count count_;
  };

  CountRuntime crt(factory());

  crt.description();
  EXPECT_EQ(crt.count(), kInit + 1);

  crt.global().setProperty(crt, "o", Object(crt));
  EXPECT_EQ(crt.count(), kInit + 6);
}

TEST_P(JSITest, MultiDecoratorTest) {
  struct Inc {
    void before() {
      ++count;
    }

    // Test optional after method.

    int count = 0;
  };

  struct Nest {
    void before() {
      ++nest;
    }

    void after() {
      --nest;
    }

    int nest = 0;
  };

  class MultiRuntime final
      : public WithRuntimeDecorator<std::tuple<Inc, Nest>> {
   public:
    explicit MultiRuntime(std::shared_ptr<Runtime> rt)
        : WithRuntimeDecorator<std::tuple<Inc, Nest>>(*rt, tuple_),
          rt_(std::move(rt)) {}

    int count() {
      return std::get<0>(tuple_).count;
    }
    int nest() {
      return std::get<1>(tuple_).nest;
    }

   private:
    std::shared_ptr<Runtime> rt_;
    std::tuple<Inc, Nest> tuple_;
  };

  MultiRuntime mrt(factory());

  Function expectNestOne = Function::createFromHostFunction(
      mrt,
      PropNameID::forAscii(mrt, "expectNestOne"),
      0,
      [](Runtime& rt, const Value& thisVal, const Value* args, size_t count) {
        MultiRuntime* funcmrt = dynamic_cast<MultiRuntime*>(&rt);
        EXPECT_TRUE(funcmrt != nullptr);
        EXPECT_EQ(funcmrt->count(), 3);
        EXPECT_EQ(funcmrt->nest(), 1);
        return Value::undefined();
      });

  expectNestOne.call(mrt);

  EXPECT_EQ(mrt.count(), 3);
  EXPECT_EQ(mrt.nest(), 0);
}

TEST_P(JSITest, SymbolTest) {
  if (!rt.global().hasProperty(rt, "Symbol")) {
    // Symbol is an es6 feature which doesn't exist in older VMs.  So
    // the tests which might be elsewhere are all here so they can be
    // skipped.
    return;
  }

  // ObjectTest
  eval("x = {1:2, 'three':Symbol('four')}");
  Object x = rt.global().getPropertyAsObject(rt, "x");
  EXPECT_EQ(x.getPropertyNames(rt).size(rt), 2);
  EXPECT_TRUE(x.hasProperty(rt, "three"));
  EXPECT_EQ(
      x.getProperty(rt, "three").getSymbol(rt).toString(rt), "Symbol(four)");

  // ValueTest
  EXPECT_TRUE(eval("Symbol('sym')").isSymbol());
  EXPECT_EQ(eval("Symbol('sym')").getSymbol(rt).toString(rt), "Symbol(sym)");

  // EqualsTest
  EXPECT_FALSE(
      Symbol::strictEquals(
          rt,
          eval("Symbol('a')").getSymbol(rt),
          eval("Symbol('a')").getSymbol(rt)));
  EXPECT_TRUE(
      Symbol::strictEquals(
          rt,
          eval("Symbol.for('a')").getSymbol(rt),
          eval("Symbol.for('a')").getSymbol(rt)));
  EXPECT_FALSE(
      Value::strictEquals(rt, eval("Symbol('a')"), eval("Symbol('a')")));
  EXPECT_TRUE(
      Value::strictEquals(
          rt, eval("Symbol.for('a')"), eval("Symbol.for('a')")));
  EXPECT_FALSE(Value::strictEquals(rt, eval("Symbol('a')"), eval("'a'")));
}

TEST_P(JSITest, JSErrorTest) {
  // JSError creation can lead to further errors.  Make sure these
  // cases are handled and don't cause weird crashes or other issues.
  //
  // Getting message property can throw

  EXPECT_THROW(
      eval(
          "var GetMessageThrows = {get message() { throw Error('ex'); }};"
          "throw GetMessageThrows;"),
      JSIException);

  EXPECT_THROW(
      eval(
          "var GetMessageThrows = {get message() { throw GetMessageThrows; }};"
          "throw GetMessageThrows;"),
      JSIException);

  // Converting exception message to String can throw

  EXPECT_THROW(
      eval(
          "Object.defineProperty("
          "  globalThis, 'String', {configurable:true, get() { var e = Error(); e.message = 23; throw e; }});"
          "var e = Error();"
          "e.message = 17;"
          "throw e;"),
      JSIException);

  EXPECT_THROW(
      eval(
          "var e = Error();"
          "Object.defineProperty("
          "  e, 'message', {configurable:true, get() { throw Error('getter'); }});"
          "throw e;"),
      JSIException);

  EXPECT_THROW(
      eval(
          "var e = Error();"
          "String = function() { throw Error('ctor'); };"
          "throw e;"),
      JSIException);

  // Converting an exception message to String can return a non-String

  EXPECT_THROW(
      eval(
          "String = function() { return 42; };"
          "var e = Error();"
          "e.message = 17;"
          "throw e;"),
      JSIException);

  // Exception can be non-Object

  EXPECT_THROW(eval("throw 17;"), JSIException);

  EXPECT_THROW(eval("throw undefined;"), JSIException);

  // Converting exception with no message or stack property to String can throw

  EXPECT_THROW(
      eval(
          "var e = {toString() { throw new Error('errstr'); }};"
          "throw e;"),
      JSIException);
}

TEST_P(JSITest, CreateErrorTest) {
  // Test JSError::createEvalError
  {
    try {
      throw JSError::createEvalError(rt, "eval error");
    } catch (const JSError& e) {
      // getMessage() checks the C++ JSError's cached message.
      // The "message" property check verifies the JS object was constructed
      // correctly, since they are populated independently.
      EXPECT_EQ(e.getMessage(), "eval error");
      Object caughtObj = e.value().getObject(rt);
      EXPECT_EQ(
          caughtObj.getProperty(rt, "message").getString(rt).utf8(rt),
          "eval error");
      EXPECT_TRUE(rt.instanceOf(
          caughtObj, rt.global().getPropertyAsFunction(rt, "EvalError")));
    }
  }

  // Test JSError::createRangeError
  {
    try {
      throw JSError::createRangeError(rt, "range error");
    } catch (const JSError& e) {
      EXPECT_EQ(e.getMessage(), "range error");
      Object caughtObj = e.value().getObject(rt);
      EXPECT_EQ(
          caughtObj.getProperty(rt, "message").getString(rt).utf8(rt),
          "range error");
      EXPECT_TRUE(rt.instanceOf(
          caughtObj, rt.global().getPropertyAsFunction(rt, "RangeError")));
    }
  }

  // Test JSError::createReferenceError
  {
    try {
      throw JSError::createReferenceError(rt, "reference error");
    } catch (const JSError& e) {
      EXPECT_EQ(e.getMessage(), "reference error");
      Object caughtObj = e.value().getObject(rt);
      EXPECT_EQ(
          caughtObj.getProperty(rt, "message").getString(rt).utf8(rt),
          "reference error");
      EXPECT_TRUE(rt.instanceOf(
          caughtObj, rt.global().getPropertyAsFunction(rt, "ReferenceError")));
    }
  }

  // Test JSError::createSyntaxError
  {
    try {
      throw JSError::createSyntaxError(rt, "syntax error");
    } catch (const JSError& e) {
      EXPECT_EQ(e.getMessage(), "syntax error");
      Object caughtObj = e.value().getObject(rt);
      EXPECT_EQ(
          caughtObj.getProperty(rt, "message").getString(rt).utf8(rt),
          "syntax error");
      EXPECT_TRUE(rt.instanceOf(
          caughtObj, rt.global().getPropertyAsFunction(rt, "SyntaxError")));
    }
  }

  // Test JSError::createTypeError
  {
    try {
      throw JSError::createTypeError(rt, "type error");
    } catch (const JSError& e) {
      EXPECT_EQ(e.getMessage(), "type error");
      Object caughtObj = e.value().getObject(rt);
      EXPECT_EQ(
          caughtObj.getProperty(rt, "message").getString(rt).utf8(rt),
          "type error");
      EXPECT_TRUE(rt.instanceOf(
          caughtObj, rt.global().getPropertyAsFunction(rt, "TypeError")));
    }
  }

  // Test JSError::createURIError
  {
    try {
      throw JSError::createURIError(rt, "uri error");
    } catch (const JSError& e) {
      EXPECT_EQ(e.getMessage(), "uri error");
      Object caughtObj = e.value().getObject(rt);
      EXPECT_EQ(
          caughtObj.getProperty(rt, "message").getString(rt).utf8(rt),
          "uri error");
      EXPECT_TRUE(rt.instanceOf(
          caughtObj, rt.global().getPropertyAsFunction(rt, "URIError")));
    }
  }
}

TEST_P(JSITest, MicrotasksTest) {
  try {
    rt.global().setProperty(rt, "globalValue", String::createFromAscii(rt, ""));

    auto microtask1 =
        function("function microtask1() { globalValue += 'hello'; }");
    auto microtask2 =
        function("function microtask2() { globalValue += ' world' }");

    rt.queueMicrotask(microtask1);
    rt.queueMicrotask(microtask2);

    EXPECT_EQ(
        rt.global().getProperty(rt, "globalValue").asString(rt).utf8(rt), "");

    rt.drainMicrotasks();

    EXPECT_EQ(
        rt.global().getProperty(rt, "globalValue").asString(rt).utf8(rt),
        "hello world");

    // Microtasks shouldn't run again
    rt.drainMicrotasks();

    EXPECT_EQ(
        rt.global().getProperty(rt, "globalValue").asString(rt).utf8(rt),
        "hello world");
  } catch (const JSINativeException&) {
    // queueMicrotask() is unimplemented by some runtimes, ignore such failures.
  }
}

//----------------------------------------------------------------------
// Test that multiple levels of delegation in DecoratedHostObjects works.

class RD1 : public RuntimeDecorator<Runtime, Runtime> {
 public:
  RD1(Runtime& plain) : RuntimeDecorator(plain) {}

  Object createObject(std::shared_ptr<HostObject> ho) {
    class DHO1 : public DecoratedHostObject {
     public:
      using DecoratedHostObject::DecoratedHostObject;

      Value get(Runtime& rt, const PropNameID& name) override {
        numGets++;
        return DecoratedHostObject::get(rt, name);
      }
    };
    return Object::createFromHostObject(
        plain(), std::make_shared<DHO1>(*this, ho));
  }

  static unsigned numGets;
};

class RD2 : public RuntimeDecorator<Runtime, Runtime> {
 public:
  RD2(Runtime& plain) : RuntimeDecorator(plain) {}

  Object createObject(std::shared_ptr<HostObject> ho) {
    class DHO2 : public DecoratedHostObject {
     public:
      using DecoratedHostObject::DecoratedHostObject;

      Value get(Runtime& rt, const PropNameID& name) override {
        numGets++;
        return DecoratedHostObject::get(rt, name);
      }
    };
    return Object::createFromHostObject(
        plain(), std::make_shared<DHO2>(*this, ho));
  }

  static unsigned numGets;
};

class HO : public HostObject {
 public:
  explicit HO(Runtime* expectedRT) : expectedRT_(expectedRT) {}

  Value get(Runtime& rt, const PropNameID& name) override {
    EXPECT_EQ(expectedRT_, &rt);
    return Value(17.0);
  }

 private:
  // The runtime we expect to be called with.
  Runtime* expectedRT_;
};

unsigned RD1::numGets = 0;
unsigned RD2::numGets = 0;

TEST_P(JSITest, MultilevelDecoratedHostObject) {
  // This test will be run for various test instantiations, so initialize these
  // counters.
  RD1::numGets = 0;
  RD2::numGets = 0;

  RD1 rd1(rt);
  RD2 rd2(rd1);
  // We expect the "get" operation of ho to be called with rd2.
  auto ho = std::make_shared<HO>(&rd2);
  auto obj = Object::createFromHostObject(rd2, ho);
  Value v = obj.getProperty(rd2, "p");
  EXPECT_TRUE(v.isNumber());
  EXPECT_EQ(17.0, v.asNumber());
  auto ho2 = obj.getHostObject(rd2);
  EXPECT_EQ(ho, ho2);
  EXPECT_EQ(1, RD1::numGets);
  EXPECT_EQ(1, RD2::numGets);
}

TEST_P(JSITest, ArrayBufferSizeTest) {
  auto ab =
      eval("var x = new ArrayBuffer(10); x").getObject(rt).getArrayBuffer(rt);
  EXPECT_EQ(ab.size(rt), 10);

  try {
    // Ensure we can safely write some data to the buffer.
    memset(ab.data(rt), 0xab, 10);
  } catch (const JSINativeException&) {
    // data() is unimplemented by some runtimes, ignore such failures.
  }

  // Ensure that setting the byteLength property does not change the length.
  eval("Object.defineProperty(x, 'byteLength', {value: 20})");
  EXPECT_EQ(ab.size(rt), 10);
}

namespace {

struct IntState : public NativeState {
  explicit IntState(int value) : value(value) {}
  int value;
};

} // namespace

TEST_P(JSITest, NativeState) {
  Object holder(rt);
  EXPECT_FALSE(holder.hasNativeState(rt));

  auto stateValue = std::make_shared<IntState>(42);
  holder.setNativeState(rt, stateValue);
  EXPECT_TRUE(holder.hasNativeState(rt));
  EXPECT_EQ(
      std::dynamic_pointer_cast<IntState>(holder.getNativeState(rt))->value,
      42);

  stateValue = std::make_shared<IntState>(21);
  holder.setNativeState(rt, stateValue);
  EXPECT_TRUE(holder.hasNativeState(rt));
  EXPECT_EQ(
      std::dynamic_pointer_cast<IntState>(holder.getNativeState(rt))->value,
      21);

  // There's currently way to "delete" the native state of a component fully
  // Even when reset with nullptr, hasNativeState will still return true
  holder.setNativeState(rt, nullptr);
  EXPECT_TRUE(holder.hasNativeState(rt));
  EXPECT_TRUE(holder.getNativeState(rt) == nullptr);
}

TEST_P(JSITest, NativeStateSymbolOverrides) {
  Object holder(rt);

  auto stateValue = std::make_shared<IntState>(42);
  holder.setNativeState(rt, stateValue);

  // Attempting to change configurable attribute of unconfigurable property
  try {
    function(
        "function (obj) {"
        "  var mySymbol = Symbol();"
        "  obj[mySymbol] = 'foo';"
        "  var allSymbols = Object.getOwnPropertySymbols(obj);"
        "  for (var sym of allSymbols) {"
        "    Object.defineProperty(obj, sym, {configurable: true, writable: true});"
        "    obj[sym] = 'bar';"
        "  }"
        "}")
        .call(rt, holder);
  } catch (const JSError& ex) {
    // On JSC this throws, but it doesn't on Hermes
    std::string exc = ex.what();
    EXPECT_NE(
        exc.find(
            "Attempting to change configurable attribute of unconfigurable property"),
        std::string::npos);
  }

  EXPECT_TRUE(holder.hasNativeState(rt));
  EXPECT_EQ(
      std::dynamic_pointer_cast<IntState>(holder.getNativeState(rt))->value,
      42);
}

TEST_P(JSITest, UTF8ExceptionTest) {
  // Test that a native exception containing UTF-8 characters is correctly
  // passed through.
  Function throwUtf8 = Function::createFromHostFunction(
      rt,
      PropNameID::forAscii(rt, "throwUtf8"),
      1,
      [](Runtime& rt, const Value&, const Value* args, size_t) -> Value {
        throw JSINativeException(args[0].asString(rt).utf8(rt));
      });
  std::string utf8 = "👍";
  try {
    throwUtf8.call(rt, utf8);
    FAIL();
  } catch (const JSError& e) {
    EXPECT_NE(e.getMessage().find(utf8), std::string::npos);
  }
}

TEST_P(JSITest, UTF16ConversionTest) {
  // This Runtime Decorator is used to test the conversion from UTF-8 to UTF-16
  // in the default utf16 method for runtimes that do not provide their own
  // utf16 implementation.
  class UTF16RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    UTF16RD(Runtime& rt) : RuntimeDecorator(rt) {}

    std::string utf8(const String&) override {
      return utf8Str;
    }

    std::u16string utf16(const String& str) override {
      return Runtime::utf16(str);
    }

    std::string utf8Str;
  };

  UTF16RD rd = UTF16RD(rt);
  String str = String::createFromUtf8(rd, "placeholder");

  rd.utf8Str = "foobar";
  EXPECT_EQ(str.utf16(rd), u"foobar");

  // 你 in UTF-8 encoding is 0xe4 0xbd 0xa0 and 好 is 0xe5 0xa5 0xbd
  // 你 in UTF-16 encoding is 0x4f60 and 好 is 0x597d
  rd.utf8Str = "\xe4\xbd\xa0\xe5\xa5\xbd";
  EXPECT_EQ(str.utf16(rd), u"\x4f60\x597d");

  // 👍 in UTF-8 encoding is 0xf0 0x9f 0x91 0x8d
  // 👍 in UTF-16 encoding is 0xd83d 0xdc4d
  rd.utf8Str = "\xf0\x9f\x91\x8d";
  EXPECT_EQ(str.utf16(rd), u"\xd83d\xdc4d");

  // String is foobar👍你好
  rd.utf8Str = "foobar\xf0\x9f\x91\x8d\xe4\xbd\xa0\xe5\xa5\xbd";
  EXPECT_EQ(str.utf16(rd), u"foobar\xd83d\xdc4d\x4f60\x597d");

  // String ended before second byte of the encoding
  rd.utf8Str = "\xcf";
  EXPECT_EQ(str.utf16(rd), u"\uFFFD");

  // Third byte should follow the pattern of 0b10xxxxxx
  rd.utf8Str = "\xef\x8f\x29";
  EXPECT_EQ(str.utf16(rd), u"\uFFFD\u0029");

  // U+2200 should be encoded in 3 bytes as 0xE2 0x88 0x80, not 4 bytes
  rd.utf8Str = "\xf0\x82\x88\x80";
  EXPECT_EQ(str.utf16(rd), u"\uFFFD");

  // Unicode Max Value is U+10FFFF, U+11FFFF is invalid
  rd.utf8Str = "\xf4\x9f\xbf\xbf";
  EXPECT_EQ(str.utf16(rd), u"\uFFFD");

  // Missing the third byte of the 3-byte encoding, followed by 'z'
  rd.utf8Str = "\xe1\xa0\x7a";
  EXPECT_EQ(str.utf16(rd), u"\uFFFD\u007A");

  // First byte is neither ASCII nor a valid continuation byte
  rd.utf8Str = "\xea\x7a";
  EXPECT_EQ(str.utf16(rd), u"\uFFFD\u007A");
}

TEST_P(JSITest, CreateFromUtf16Test) {
  // This Runtime Decorator is used to test the default createStringFromUtf16
  // and createPropNameIDFromUtf16 implementation for VMs that do not provide
  // their own implementation
  class RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    RD(Runtime& rt) : RuntimeDecorator(rt) {}

    String createStringFromUtf16(const char16_t* utf16, size_t length)
        override {
      return Runtime::createStringFromUtf16(utf16, length);
    }

    PropNameID createPropNameIDFromUtf16(const char16_t* utf16, size_t length)
        override {
      return Runtime::createPropNameIDFromUtf16(utf16, length);
    }
  };

  RD rd = RD(rt);
  std::u16string utf16 = u"foobar";

  auto jsString = String::createFromUtf16(rd, utf16);
  EXPECT_EQ(jsString.utf16(rd), utf16);
  auto prop = PropNameID::forUtf16(rd, utf16);
  EXPECT_EQ(prop.utf16(rd), utf16);

  // 👋 in UTF-16 encoding is 0xd83d 0xdc4b
  utf16 = u"hello!\xd83d\xdc4b";
  jsString = String::createFromUtf16(rd, utf16.data(), utf16.length());
  EXPECT_EQ(jsString.utf16(rd), utf16);
  prop = PropNameID::forUtf16(rd, utf16);
  EXPECT_EQ(prop.utf16(rd), utf16);

  utf16 = u"\xd83d";
  jsString = String::createFromUtf16(rd, utf16.data(), utf16.length());
  /// We need to use charCodeAt instead of UTF16 because the default
  /// implementation of UTF16 converts to UTF8, then to UTF16, so we will lose
  /// the lone surrogate value.
  rd.global().setProperty(rd, "loneSurrogate", jsString);
  auto cp = eval("loneSurrogate.charCodeAt(0)").getNumber();
  EXPECT_EQ(cp, 55357); // 0xD83D in decimal
}

TEST_P(JSITest, GetStringDataTest) {
  // This Runtime Decorator is used to test the default getStringData
  // implementation for VMs that do not provide their own implementation
  class RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    RD(Runtime& rt) : RuntimeDecorator(rt) {}

    void getStringData(
        const String& str,
        void* ctx,
        void (*cb)(void* ctx, bool ascii, const void* data, size_t num))
        override {
      Runtime::getStringData(str, ctx, cb);
    }
  };

  RD rd = RD(rt);
  // 👋 in UTF8 encoding is 0xf0 0x9f 0x91 0x8b
  String str = String::createFromUtf8(rd, "hello\xf0\x9f\x91\x8b");

  std::u16string buf;
  auto cb = [&buf](bool ascii, const void* data, size_t num) {
    assert(!ascii && "Default implementation is always utf16");
    buf.append((const char16_t*)data, num);
  };

  str.getStringData(rd, cb);
  EXPECT_EQ(buf, str.utf16(rd));
}

TEST_P(JSITest, ObjectSetPrototype) {
  // This Runtime Decorator is used to test the default implementation of
  // Object.setPrototypeOf
  class RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    explicit RD(Runtime& rt) : RuntimeDecorator(rt) {}

    void setPrototypeOf(const Object& object, const Value& prototype) override {
      return Runtime::setPrototypeOf(object, prototype);
    }

    Value getPrototypeOf(const Object& object) override {
      return Runtime::getPrototypeOf(object);
    }
  };

  RD rd = RD(rt);
  Object child(rd);

  // Tests null value as prototype
  child.setPrototype(rd, Value::null());
  EXPECT_TRUE(child.getPrototype(rd).isNull());

  Object prototypeObj(rd);
  prototypeObj.setProperty(rd, "someProperty", 123);
  Value prototype(rd, prototypeObj);

  child.setPrototype(rd, prototype);
  EXPECT_EQ(child.getProperty(rd, "someProperty").getNumber(), 123);

  auto getPrototypeRes = child.getPrototype(rd).asObject(rd);
  EXPECT_EQ(getPrototypeRes.getProperty(rd, "someProperty").getNumber(), 123);
}

TEST_P(JSITest, ObjectCreateWithPrototype) {
  // This Runtime Decorator is used to test the default implementation of
  // Object.create(prototype)
  class RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    RD(Runtime& rt) : RuntimeDecorator(rt) {}

    Object createObjectWithPrototype(const Value& prototype) override {
      return Runtime::createObjectWithPrototype(prototype);
    }
  };

  RD rd = RD(rt);
  Object prototypeObj(rd);
  prototypeObj.setProperty(rd, "someProperty", 123);
  Value prototype(rd, prototypeObj);

  Object child = Object::create(rd, prototype);
  EXPECT_EQ(child.getProperty(rd, "someProperty").getNumber(), 123);

  // Tests null value as prototype
  child = Object::create(rd, Value::null());
  EXPECT_TRUE(child.getPrototype(rd).isNull());
}

TEST_P(JSITest, SetRuntimeData) {
  class RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    explicit RD(Runtime& rt) : RuntimeDecorator(rt) {}

    void setRuntimeDataImpl(
        const UUID& uuid,
        const void* data,
        void (*deleter)(const void* data)) override {
      Runtime::setRuntimeDataImpl(uuid, data, deleter);
    }

    const void* getRuntimeDataImpl(const UUID& uuid) override {
      return Runtime::getRuntimeDataImpl(uuid);
    }
  };

  RD rd1 = RD(rt);
  UUID uuid1{0xe67ab3d6, 0x09a0, 0x11f0, 0xa641, 0x325096b39f47};
  auto str = std::make_shared<std::string>("hello world");
  rd1.setRuntimeData(uuid1, str);

  UUID uuid2{0xa12f99fc, 0x09a2, 0x11f0, 0x84de, 0x325096b39f47};
  auto obj1 = std::make_shared<Object>(rd1);
  rd1.setRuntimeData(uuid2, obj1);

  auto storedStr =
      std::static_pointer_cast<std::string>(rd1.getRuntimeData(uuid1));
  auto storedObj = std::static_pointer_cast<Object>(rd1.getRuntimeData(uuid2));
  EXPECT_EQ(storedStr, str);
  EXPECT_EQ(storedObj, obj1);

  // Override the existing value at uuid1
  auto weakOldStr = std::weak_ptr<std::string>(str);
  str = std::make_shared<std::string>("goodbye world");
  rd1.setRuntimeData(uuid1, str);
  storedStr = std::static_pointer_cast<std::string>(rd1.getRuntimeData(uuid1));
  EXPECT_EQ(str, storedStr);
  // Verify that the old data was not held on after it was overwritten.
  EXPECT_EQ(weakOldStr.use_count(), 0);

  auto rt2 = factory();
  RD* rd2 = new RD(*rt2);
  UUID uuid3{0x16f55892, 0x1034, 0x11f0, 0x8f65, 0x325096b39f47};
  auto obj2 = std::make_shared<Object>(*rd2);
  rd2->setRuntimeData(uuid3, obj2);

  auto storedObj2 =
      std::static_pointer_cast<Object>(rd2->getRuntimeData(uuid3));
  EXPECT_EQ(storedObj2, obj2);

  // UUID1 is for some data in runtime rd1, not rd2
  EXPECT_FALSE(rd2->getRuntimeData(uuid1));

  // Verify that when runtime is deleted, its runtime data map gets removed from
  // the global map. So nothing should be holding on to the stored data.
  auto weakObj2 = std::weak_ptr<Object>(obj2);
  obj2.reset();
  storedObj2.reset();
  delete rd2;
  rt2.reset();
  EXPECT_EQ(weakObj2.use_count(), 0);

  // Only the second runtime was destroyed, so custom data from the first
  // runtime should remain unaffected.
  storedStr = std::static_pointer_cast<std::string>(rd1.getRuntimeData(uuid1));
  EXPECT_EQ(storedStr, str);

  // Overwrite Object.defineProperty, which is called in the default
  // implementation of setRuntimeDataImpl, to test that even if the JSI
  // operations on this secret property fail, we are still able to properly
  // clean up the custom data.
  auto rt3 = factory();
  RD* rd3 = new RD(*rt3);
  UUID uuid4{0xa5682986, 0x1edc, 0x11f0, 0xa4fa, 0x325096b39f47};
  rd3->global()
      .getPropertyAsObject(*rd3, "Object")
      .setProperty(*rd3, "defineProperty", Value(false));

  auto obj3 = std::make_shared<Object>(*rd3);
  auto weakObj3 = std::weak_ptr<Object>(obj3);
  EXPECT_THROW(rd3->setRuntimeData(uuid4, obj3), JSIException);
  obj3.reset();
  delete rd3;
  rt3.reset();
  EXPECT_EQ(weakObj3.use_count(), 0);
}

TEST_P(JSITest, CastInterface) {
  // This Runtime Decorator is used to test the default implementation of
  // jsi::Runtime::castInterface
  class RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    explicit RD(Runtime& rt) : RuntimeDecorator(rt) {}

    ICast* castInterface(const UUID& interfaceUuid) override {
      return Runtime::castInterface(interfaceUuid);
    }
  };

  RD rd = RD(rt);
  auto randomUuid = UUID{0xf2cd96cf, 0x455e, 0x42d9, 0x850a, 0x13e2cde59b8b};
  auto ptr = rd.castInterface(randomUuid);

  // Use == instead of EXPECT_EQ to avoid ambiguous operator usage due to the
  // type of 'ptr'.
  EXPECT_TRUE(ptr == nullptr);
}

TEST_P(JSITest, DeleteProperty) {
  // This Runtime Decorator is used to test the default implementation of
  // Runtime::deleteProperty
  class RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    explicit RD(Runtime& rt) : RuntimeDecorator(rt) {}

    void deleteProperty(const Object& object, const PropNameID& name) override {
      Runtime::deleteProperty(object, name);
    }
    void deleteProperty(const Object& object, const String& name) override {
      Runtime::deleteProperty(object, name);
    }
    void deleteProperty(const Object& object, const Value& name) override {
      Runtime::deleteProperty(object, name);
    }
  };
  RD rd = RD(rt);
  auto obj = eval("obj = {1:2, foo: 'bar', 3: 4, salt:'pepper'}").getObject(rd);

  auto prop = PropNameID::forAscii(rd, "1");
  auto hasRes = obj.hasProperty(rd, prop);
  EXPECT_TRUE(hasRes);
  obj.deleteProperty(rd, prop);
  hasRes = obj.hasProperty(rd, prop);
  EXPECT_FALSE(hasRes);

  auto str = String::createFromAscii(rd, "foo");
  hasRes = obj.hasProperty(rd, str);
  EXPECT_TRUE(hasRes);
  obj.deleteProperty(rd, str);
  hasRes = obj.hasProperty(rd, str);
  EXPECT_FALSE(hasRes);

  auto valProp = Value(3);
  hasRes = obj.hasProperty(rd, "3");
  EXPECT_TRUE(hasRes);
  obj.deleteProperty(rd, valProp);
  auto getRes = obj.getProperty(rd, "3");
  EXPECT_TRUE(getRes.isUndefined());

  hasRes = obj.hasProperty(rd, "salt");
  EXPECT_TRUE(hasRes);
  obj.deleteProperty(rd, "salt");
  hasRes = obj.hasProperty(rd, "salt");
  EXPECT_FALSE(hasRes);

  obj = eval(
            "const obj = {};"
            "Object.defineProperty(obj, 'prop', {"
            "  value: 10,"
            "  configurable: false,});"
            "obj;")
            .getObject(rd);
  EXPECT_THROW(obj.deleteProperty(rd, "prop"), JSError);
  hasRes = obj.hasProperty(rd, "prop");
  EXPECT_TRUE(hasRes);
}

TEST_P(JSITest, ArrayPush) {
  // This Runtime Decorator is used to test the default implementation of
  // Runtime::push
  class RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    explicit RD(Runtime& rt) : RuntimeDecorator(rt) {}

    size_t push(const Array& arr, const Value* elements, size_t count)
        override {
      return Runtime::push(arr, elements, count);
    }
  };
  RD rd = RD(rt);

  // Push to an empty array
  Array arr(rd, 0);
  size_t newLength = arr.push(rd, 1, 2, 3);
  EXPECT_EQ(newLength, 3);
  EXPECT_EQ(arr.length(rd), 3);

  EXPECT_EQ(arr.getValueAtIndex(rd, 0).getNumber(), 1);
  EXPECT_EQ(arr.getValueAtIndex(rd, 1).getNumber(), 2);
  EXPECT_EQ(arr.getValueAtIndex(rd, 2).getNumber(), 3);

  // Push to an array already containing elements
  arr = Array::createWithElements(rd, 1, true);
  Object obj(rd);
  newLength = arr.push(rd, "foobar", obj);
  EXPECT_EQ(newLength, 4);
  EXPECT_EQ(arr.length(rd), 4);

  EXPECT_EQ(arr.getValueAtIndex(rd, 0).getNumber(), 1);
  EXPECT_TRUE(arr.getValueAtIndex(rd, 1).getBool());
  EXPECT_EQ(arr.getValueAtIndex(rd, 2).getString(rd).utf8(rd), "foobar");
  EXPECT_TRUE(
      Object::strictEquals(rd, arr.getValueAtIndex(rd, 3).getObject(rd), obj));

  // Push to a Proxy of a JS Array
  arr = eval("new Proxy([1], {})").getObject(rd).getArray(rd);
  EXPECT_EQ(arr.length(rd), 1);

  newLength = arr.push(rd, true, "foobar");
  EXPECT_EQ(newLength, 3);
  EXPECT_EQ(arr.length(rd), 3);

  EXPECT_EQ(arr.getValueAtIndex(rd, 0).getNumber(), 1);
  EXPECT_TRUE(arr.getValueAtIndex(rd, 1).getBool());
  EXPECT_EQ(arr.getValueAtIndex(rd, 2).getString(rd).utf8(rd), "foobar");

  // Push to a Proxy of a JS Array, where getting the length returns a custom
  // value
  arr = eval(
            "var arr = [1];"
            "var handler = {"
            "    get(target, property) {"
            "        if (property == 'length') {"
            "            return target.length + 1;"
            "        }"
            "        return Reflect.get(target, property);"
            "    }"
            "};"
            "var proxy = new Proxy(arr, handler);"
            "proxy;")
            .getObject(rd)
            .getArray(rd);
  // The handler returns the underlying array's length plus 1
  EXPECT_EQ(arr.length(rd), 2);

  // The elements will be adding starting at element 2
  newLength = arr.push(rd, 3, 4);
  EXPECT_EQ(newLength, 4);

  EXPECT_EQ(arr.length(rd), 5);
  EXPECT_EQ(arr.getValueAtIndex(rd, 0).getNumber(), 1);
  EXPECT_TRUE(arr.getValueAtIndex(rd, 1).isUndefined());
  EXPECT_EQ(arr.getValueAtIndex(rd, 2).getNumber(), 3);
  EXPECT_EQ(arr.getValueAtIndex(rd, 3).getNumber(), 4);

  // Push to a Proxy of a JS Array, where setting the 'length' property is
  // customized
  arr = eval(
            "var arr = [1];"
            "var handler = {"
            "    set(target, property, value) {"
            "        if (property == 'length') {"
            "            return Reflect.set(target, property, value + 1);"
            "        }"
            "        return Reflect.set(target, property, value);"
            "    }"
            "};"
            "var proxy = new Proxy(arr, handler);"
            "proxy;")
            .getObject(rd)
            .getArray(rd);

  EXPECT_EQ(arr.length(rd), 1);
  EXPECT_EQ(arr.getValueAtIndex(rd, 0).getNumber(), 1);

  newLength = arr.push(rd, 2, 3);
  EXPECT_EQ(newLength, 3);

  // When setting the 'length' property, the handler will actually set it to 3 +
  // 1
  EXPECT_EQ(arr.length(rd), 4);
  EXPECT_EQ(arr.getValueAtIndex(rd, 0).getNumber(), 1);
  EXPECT_EQ(arr.getValueAtIndex(rd, 1).getNumber(), 2);
  EXPECT_EQ(arr.getValueAtIndex(rd, 2).getNumber(), 3);
  EXPECT_TRUE(arr.getValueAtIndex(rd, 3).isUndefined());
}

TEST_P(JSITest, UInt8ArrayTest) {
  // This Runtime Decorator is used to test the default implementation of
  // Runtime::createUint8Array and TypedArray APIs
  class RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    explicit RD(Runtime& rt) : RuntimeDecorator(rt) {}

    Uint8Array createUint8Array(size_t length) override {
      return Runtime::createUint8Array(length);
    }

    Uint8Array createUint8Array(
        const ArrayBuffer& buffer,
        size_t offset,
        size_t length) override {
      return Runtime::createUint8Array(buffer, offset, length);
    }

    ArrayBuffer buffer(const TypedArray& typedArray) override {
      return Runtime::buffer(typedArray);
    }

    size_t byteOffset(const TypedArray& typedArray) override {
      return Runtime::byteOffset(typedArray);
    }

    size_t byteLength(const TypedArray& typedArray) override {
      return Runtime::byteLength(typedArray);
    }

    size_t length(const TypedArray& typedArray) override {
      return Runtime::length(typedArray);
    }
  };
  RD rd = RD(rt);

  // Test creating a UInt8Array with a specific length
  {
    auto uint8Array = rd.createUint8Array(10);

    EXPECT_EQ(rd.length(uint8Array), 10);
    EXPECT_EQ(rd.byteLength(uint8Array), 10);
    EXPECT_EQ(rd.byteOffset(uint8Array), 0);
  }

  // Test creating a UInt8Array from an ArrayBuffer with offset
  {
    auto ab = eval("var buf = new ArrayBuffer(20); buf")
                  .getObject(rd)
                  .getArrayBuffer(rd);

    // Create a Uint8Array starting at offset 5 with length 10
    auto uint8Array = rd.createUint8Array(ab, 5, 10);

    EXPECT_EQ(rd.length(uint8Array), 10);
    EXPECT_EQ(rd.byteLength(uint8Array), 10);
    EXPECT_EQ(rd.byteOffset(uint8Array), 5);

    // Test buffer returns the correct underlying ArrayBuffer
    auto buffer = rd.buffer(uint8Array);
    EXPECT_EQ(buffer.size(rd), 20);
  }
}

TEST_P(JSITest, IsTypedArrayTest) {
  // Test that isTypedArray returns false for a regular object
  {
    auto obj = Object(rt);
    EXPECT_FALSE(rt.isTypedArray(obj));
    EXPECT_THROW(obj.asTypedArray(rt), JSIException);
  }

  // Test that isTypedArray returns true for a Uint8Array
  {
    Uint8Array uint8Array(rt, 10);
    EXPECT_TRUE(rt.isTypedArray(uint8Array));

    auto typedArray = uint8Array.getTypedArray(rt);
    EXPECT_EQ(typedArray.length(rt), 10);
  }

  // Test that isTypedArray returns true for other TypedArray types
  {
    auto int32ArrayObj = eval("new Int32Array(5)").getObject(rt);
    EXPECT_TRUE(rt.isTypedArray(int32ArrayObj));
    EXPECT_FALSE(rt.isUint8Array(int32ArrayObj));

    auto typedArray = int32ArrayObj.getTypedArray(rt);
    EXPECT_EQ(typedArray.length(rt), 5);
  }

  // Test that isTypedArray returns true for Float64Array
  {
    auto float64ArrayObj = eval("new Float64Array(3)").getObject(rt);
    EXPECT_TRUE(rt.isTypedArray(float64ArrayObj));

    auto typedArray = float64ArrayObj.asTypedArray(rt);
    EXPECT_EQ(typedArray.length(rt), 3);
  }

  // Test that isTypedArray returns false for ArrayBuffer
  {
    auto arrayBufferObj = eval("new ArrayBuffer(10)").getObject(rt);
    EXPECT_FALSE(rt.isTypedArray(arrayBufferObj));
  }

  // Test that isTypedArray returns false for a regular array
  {
    auto arrayObj = eval("[1, 2, 3]").getObject(rt);
    EXPECT_FALSE(rt.isTypedArray(arrayObj));
  }
}

TEST_P(JSITest, IsUint8ArrayTest) {
  // Test that isUint8Array returns false for a regular object
  {
    auto obj = Object(rt);
    EXPECT_FALSE(rt.isUint8Array(obj));
    EXPECT_THROW(obj.asUint8Array(rt), JSIException);
  }

  // Test that isUint8Array returns true for a Uint8Array created via JS
  {
    auto uint8ArrayObj = eval("new Uint8Array(10)").getObject(rt);
    EXPECT_TRUE(rt.isUint8Array(uint8ArrayObj));

    // Get uInt8Array should succeed.
    auto uint8Array = uint8ArrayObj.getUint8Array(rt);
    EXPECT_EQ(uint8Array.length(rt), 10);
  }
}

TEST_P(JSITest, ArrayBufferDetachedTest) {
  // This Runtime Decorator is used to test the default implementation of
  // Runtime::detached
  class RD : public RuntimeDecorator<Runtime, Runtime> {
   public:
    explicit RD(Runtime& rt) : RuntimeDecorator(rt) {}

    bool detached(const ArrayBuffer& ab) override {
      return Runtime::detached(ab);
    }
  };
  RD rd = RD(rt);

  // Test that a normal ArrayBuffer is not detached.
  auto ab = eval("var buf = new ArrayBuffer(10); buf")
                .getObject(rd)
                .getArrayBuffer(rd);

  // The default Runtime::detached reads the JS "detached" property. If the
  // runtime doesn't support ArrayBuffer.prototype.detached, it will throw
  // JSINativeException.
  try {
    EXPECT_FALSE(ab.detached(rd));
  } catch (const JSINativeException&) {
    // Runtime doesn't support ArrayBuffer.prototype.detached, skip the rest.
    return;
  }

  // Detach the ArrayBuffer. Use transfer() if available, otherwise fall back
  // to HermesInternal.detach for Hermes runtime.
  eval(
      "if (typeof buf.transfer === 'function') {"
      "  buf.transfer();"
      "} else if (typeof HermesInternal !== 'undefined' && "
      "           typeof HermesInternal.detachArrayBuffer === 'function') {"
      "  HermesInternal.detachArrayBuffer(buf);"
      "}");
  EXPECT_TRUE(ab.detached(rd));
}

INSTANTIATE_TEST_CASE_P(
    Runtimes,
    JSITest,
    ::testing::ValuesIn(runtimeGenerators()));
