/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <hermes/hermes.h>
#include <react/debug/flags.h>
#include <react/renderer/core/ConcreteShadowNode.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/RawPropsParser.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/propsConversions.h>

using namespace facebook;
using namespace facebook::react;

class PropsSingleFloat : public Props {
 public:
  PropsSingleFloat() = default;
  PropsSingleFloat(
      const PropsParserContext& context,
      const PropsSingleFloat& sourceProps,
      const RawProps& rawProps)
      : floatValue(convertRawProp(
            context,
            rawProps,
            "floatValue",
            sourceProps.floatValue,
            17.5)) {}

 private:
  const float floatValue{17.5};
};

class PropsSingleDouble : public Props {
 public:
  PropsSingleDouble() = default;
  PropsSingleDouble(
      const PropsParserContext& context,
      const PropsSingleDouble& sourceProps,
      const RawProps& rawProps)
      : doubleValue(convertRawProp(
            context,
            rawProps,
            "doubleValue",
            sourceProps.doubleValue,
            17.5)) {}

 private:
  const float doubleValue{17.5};
};

class PropsSingleInt : public Props {
 public:
  PropsSingleInt() = default;
  PropsSingleInt(
      const PropsParserContext& context,
      const PropsSingleInt& sourceProps,
      const RawProps& rawProps)
      : intValue(convertRawProp(
            context,
            rawProps,
            "intValue",
            sourceProps.intValue,
            17)) {}

 private:
  const int intValue{17};
};

class PropsPrimitiveTypes : public Props {
 public:
  PropsPrimitiveTypes() = default;
  PropsPrimitiveTypes(
      const PropsParserContext& context,
      const PropsPrimitiveTypes& sourceProps,
      const RawProps& rawProps)
      : intValue(convertRawProp(
            context,
            rawProps,
            "intValue",
            sourceProps.intValue,
            17)),
        doubleValue(convertRawProp(
            context,
            rawProps,
            "doubleValue",
            sourceProps.doubleValue,
            17.56)),
        floatValue(convertRawProp(
            context,
            rawProps,
            "floatValue",
            sourceProps.floatValue,
            56.75)),
        stringValue(convertRawProp(
            context,
            rawProps,
            "stringValue",
            sourceProps.stringValue,
            "")),
        boolValue(convertRawProp(
            context,
            rawProps,
            "boolValue",
            sourceProps.boolValue,
            false)) {}

 private:
  const int intValue{17};
  const double doubleValue{17.56};
  const float floatValue{56.75};
  const std::string stringValue{};
  const bool boolValue{false};
};

class PropsMultiLookup : public Props {
 public:
  PropsMultiLookup() = default;
  PropsMultiLookup(
      const PropsParserContext& context,
      const PropsMultiLookup& sourceProps,
      const RawProps& rawProps)
      : floatValue(convertRawProp(
            context,
            rawProps,
            "floatValue",
            sourceProps.floatValue,
            17.5)),
        // While this specific pattern is uncommon, it's a simplification of a
        // pattern that does occur a lot: nested structs that access props we
        // have already accessed populating Props
        derivedFloatValue(
            convertRawProp(
                context,
                rawProps,
                "floatValue",
                sourceProps.floatValue,
                40) *
            2) {}

  const float floatValue{17.5};
  const float derivedFloatValue{40};
};

TEST(RawPropsTest, handleProps) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(folly::dynamic::object("nativeID", "abc"));
  auto parser = RawPropsParser();
  parser.prepare<Props>();
  raw.parse(parser);

  auto props = std::make_shared<Props>(parserContext, Props(), raw);

  // Props are not sealed after applying raw props.
  EXPECT_FALSE(props->getSealed());

  EXPECT_STREQ(props->nativeId.c_str(), "abc");
}

TEST(RawPropsTest, handleRawPropsSingleString) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(folly::dynamic::object("nativeID", "abc"));
  auto parser = RawPropsParser();
  parser.prepare<Props>();
  raw.parse(parser);

  std::string value = (std::string)*raw.at("nativeID");

  EXPECT_STREQ(value.c_str(), "abc");
}

TEST(RawPropsTest, handleRawPropsSingleFloat) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(folly::dynamic::object("floatValue", (float)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleFloat>();
  raw.parse(parser);

  auto value = (float)*raw.at("floatValue");

  EXPECT_NEAR(value, 42.42, 0.00001);
}

TEST(RawPropsTest, handleRawPropsSingleDouble) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(folly::dynamic::object("doubleValue", (double)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleDouble>();
  raw.parse(parser);

  auto value = (double)*raw.at("doubleValue");

  EXPECT_NEAR(value, 42.42, 0.00001);
}

TEST(RawPropsTest, handleRawPropsSingleInt) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(folly::dynamic::object("intValue", (int)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleInt>();
  raw.parse(parser);

  int value = (int)*raw.at("intValue");

  EXPECT_EQ(value, 42);
}

TEST(RawPropsTest, handleRawPropsSingleIntGetManyTimes) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(folly::dynamic::object("intValue", (int)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleInt>();
  raw.parse(parser);

  EXPECT_EQ((int)*raw.at("intValue"), 42);
  EXPECT_EQ((int)*raw.at("intValue"), 42);
  EXPECT_EQ((int)*raw.at("intValue"), 42);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypes) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(
      folly::dynamic::object("intValue", (int)42)("doubleValue", (double)17.42)(
          "floatValue", (float)66.67)("stringValue", "helloworld")(
          "boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  EXPECT_EQ((int)*raw.at("intValue"), 42);
  EXPECT_NEAR((double)*raw.at("doubleValue"), 17.42, 0.0001);
  EXPECT_NEAR((float)*raw.at("floatValue"), 66.67, 0.00001);
  EXPECT_STREQ(((std::string)*raw.at("stringValue")).c_str(), "helloworld");
  EXPECT_EQ((bool)*raw.at("boolValue"), true);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypesGetTwice) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(
      folly::dynamic::object("intValue", (int)42)("doubleValue", (double)17.42)(
          "floatValue", (float)66.67)("stringValue", "helloworld")(
          "boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  EXPECT_EQ((int)*raw.at("intValue"), 42);
  EXPECT_NEAR((double)*raw.at("doubleValue"), 17.42, 0.0001);
  EXPECT_NEAR((float)*raw.at("floatValue"), 66.67, 0.00001);
  EXPECT_STREQ(((std::string)*raw.at("stringValue")).c_str(), "helloworld");
  EXPECT_EQ((bool)*raw.at("boolValue"), true);

  EXPECT_EQ((int)*raw.at("intValue"), 42);
  EXPECT_NEAR((double)*raw.at("doubleValue"), 17.42, 0.0001);
  EXPECT_NEAR((float)*raw.at("floatValue"), 66.67, 0.00001);
  EXPECT_STREQ(((std::string)*raw.at("stringValue")).c_str(), "helloworld");
  EXPECT_EQ((bool)*raw.at("boolValue"), true);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypesGetOutOfOrder) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(
      folly::dynamic::object("intValue", (int)42)("doubleValue", (double)17.42)(
          "floatValue", (float)66.67)("stringValue", "helloworld")(
          "boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  EXPECT_EQ((int)*raw.at("intValue"), 42);
  EXPECT_NEAR((double)*raw.at("doubleValue"), 17.42, 0.0001);
  EXPECT_NEAR((float)*raw.at("floatValue"), 66.67, 0.00001);
  EXPECT_STREQ(((std::string)*raw.at("stringValue")).c_str(), "helloworld");
  EXPECT_EQ((bool)*raw.at("boolValue"), true);

  EXPECT_NEAR((double)*raw.at("doubleValue"), 17.42, 0.0001);
  EXPECT_EQ((int)*raw.at("intValue"), 42);
  EXPECT_NEAR((float)*raw.at("floatValue"), 66.67, 0.00001);
  EXPECT_STREQ(((std::string)*raw.at("stringValue")).c_str(), "helloworld");
  EXPECT_EQ((bool)*raw.at("boolValue"), true);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypesIncomplete) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(folly::dynamic::object("intValue", (int)42));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  EXPECT_EQ((int)*raw.at("intValue"), 42);
  EXPECT_EQ(raw.at("doubleValue"), nullptr);
  EXPECT_EQ(raw.at("floatValue"), nullptr);
  EXPECT_EQ((int)*raw.at("intValue"), 42);
  EXPECT_EQ(raw.at("stringValue"), nullptr);
  EXPECT_EQ(raw.at("boolValue"), nullptr);
  EXPECT_EQ((int)*raw.at("intValue"), 42);
}

#ifdef REACT_NATIVE_DEBUG
TEST(RawPropsTest, handleRawPropsPrimitiveTypesIncorrectLookup) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(folly::dynamic::object("intValue", (int)42));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  // Before D18662135, looking up an invalid key would trigger
  // an infinite loop. This is out of contract, so we should only
  // test this in debug.
  EXPECT_EQ(raw.at("flurb"), nullptr);
  EXPECT_EQ((int)*raw.at("intValue"), 42);
}
#endif

TEST(RawPropsTest, handlePropsMultiLookup) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto raw = RawProps(folly::dynamic::object("floatValue", (float)10.0));
  auto parser = RawPropsParser();
  parser.prepare<PropsMultiLookup>();
  raw.parse(parser);

  auto props = std::make_shared<PropsMultiLookup>(
      parserContext, PropsMultiLookup(), raw);

  // Props are not sealed after applying raw props.
  EXPECT_FALSE(props->getSealed());

  EXPECT_NEAR(props->floatValue, 10.0, 0.00001);
  EXPECT_NEAR(props->derivedFloatValue, 20.0, 0.00001);
}

TEST(RawPropsTest, copyDynamicRawProps) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto rawProps = RawProps(folly::dynamic::object("floatValue", (float)10.0));

  auto copy = RawProps(rawProps);

  EXPECT_FALSE(copy.isEmpty());

  auto parser = RawPropsParser();
  parser.prepare<PropsMultiLookup>();

  rawProps.parse(parser);
  copy.parse(parser);

  auto originalProps = std::make_shared<PropsMultiLookup>(
      parserContext, PropsMultiLookup(), rawProps);
  auto copyProps = std::make_shared<PropsMultiLookup>(
      parserContext, PropsMultiLookup(), copy);

  // Props are not sealed after applying raw props.
  EXPECT_FALSE(copyProps->getSealed());

  EXPECT_NEAR(copyProps->floatValue, originalProps->floatValue, 0.00001);
  EXPECT_NEAR(
      copyProps->derivedFloatValue, originalProps->derivedFloatValue, 0.00001);
}

TEST(RawPropsTest, copyEmptyRawProps) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto rawProps = RawProps();

  auto copy = RawProps(rawProps);

  EXPECT_TRUE(rawProps.isEmpty());
  EXPECT_TRUE(copy.isEmpty());

  EXPECT_TRUE(((folly::dynamic)copy).empty());
}

TEST(RawPropsTest, copyNullJSIRawProps) {
  auto runtime = facebook::hermes::makeHermesRuntime();

  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto rawProps = RawProps(*runtime, jsi::Value::null());

  auto copy = RawProps(rawProps);

  EXPECT_TRUE(rawProps.isEmpty());
  EXPECT_TRUE(copy.isEmpty());

  EXPECT_TRUE(((folly::dynamic)copy).empty());
}

TEST(RawPropsTest, copyJSIRawProps) {
  auto runtime = facebook::hermes::makeHermesRuntime();

  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto object = jsi::Object(*runtime);
  object.setProperty(*runtime, "floatValue", 10.0);

  auto rawProps = RawProps(*runtime, jsi::Value(*runtime, object));
  auto copy = RawProps(rawProps);

  EXPECT_FALSE(rawProps.isEmpty());
  EXPECT_FALSE(copy.isEmpty());

  auto parser = RawPropsParser();
  parser.prepare<PropsMultiLookup>();

  rawProps.parse(parser);
  copy.parse(parser);

  auto originalProps = std::make_shared<PropsMultiLookup>(
      parserContext, PropsMultiLookup(), rawProps);
  auto copyProps = std::make_shared<PropsMultiLookup>(
      parserContext, PropsMultiLookup(), copy);

  // Props are not sealed after applying raw props.
  EXPECT_FALSE(copyProps->getSealed());

  EXPECT_NEAR(copyProps->floatValue, originalProps->floatValue, 0.00001);
  EXPECT_NEAR(
      copyProps->derivedFloatValue, originalProps->derivedFloatValue, 0.00001);
}
