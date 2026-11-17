/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <folly/json.h>
#include <hermes/hermes.h>
#include <jsi/JSIDynamic.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/ConditionalValues.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/RawPropsParser.h>

#include "TestComponent.h"

namespace facebook::react {

namespace {

const MediaFeatures kLight{.colorScheme = ColorScheme::Light};
const MediaFeatures kDark{.colorScheme = ColorScheme::Dark};

folly::dynamic resolve(const char* json, const MediaFeatures& features) {
  return resolveConditionalValue(folly::parseJson(json), features);
}

} // namespace

TEST(ConditionalValuesTest, resolvesTheMatchingCondition) {
  auto entry = R"({
    "default": 1,
    "conditions": [{"query": {"colorScheme": "dark"}, "value": 2}]
  })";
  EXPECT_EQ(resolve(entry, kLight), 1);
  EXPECT_EQ(resolve(entry, kDark), 2);
}

TEST(ConditionalValuesTest, theLastMatchingConditionWins) {
  auto entry = R"({
    "default": 1,
    "conditions": [
      {"query": {"colorScheme": "dark"}, "value": 2},
      {"query": {"colorScheme": "light"}, "value": 3},
      {"query": {"colorScheme": "dark"}, "value": 4}
    ]
  })";
  EXPECT_EQ(resolve(entry, kLight), 3);
  EXPECT_EQ(resolve(entry, kDark), 4);
}

TEST(ConditionalValuesTest, keepsNullAndObjectValues) {
  auto entry = R"({
    "default": null,
    "conditions": [
      {"query": {"colorScheme": "dark"}, "value": {"width": 2, "height": 2}}
    ]
  })";
  EXPECT_EQ(resolve(entry, kLight), nullptr);
  EXPECT_EQ(
      resolve(entry, kDark), folly::parseJson(R"({"width": 2, "height": 2})"));

  auto nullCondition = R"({
    "default": 1,
    "conditions": [{"query": {"colorScheme": "dark"}, "value": null}]
  })";
  EXPECT_EQ(resolve(nullCondition, kDark), nullptr);
}

TEST(ConditionalValuesTest, resolvesTheDefaultWithoutConditions) {
  EXPECT_EQ(resolve(R"({"default": 1})", kDark), 1);
  EXPECT_EQ(resolve(R"({"default": 1, "conditions": []})", kDark), 1);
  EXPECT_EQ(resolve(R"({"default": 1, "conditions": null})", kDark), 1);
}

TEST(ConditionalValuesTest, aQueryWithAnUnknownFeatureNeverMatches) {
  auto entry = R"({
    "default": 1,
    "conditions": [
      {"query": {"colorScheme": "dark", "orientation": "landscape"}, "value": 2},
      {"query": {"orientation": "landscape"}, "value": 3},
      {"query": {}, "value": 4}
    ]
  })";
  EXPECT_EQ(resolve(entry, kLight), 1);
  EXPECT_EQ(resolve(entry, kDark), 1);
}

TEST(ConditionalValuesTest, skipsInvalidConditions) {
  auto entry = R"({
    "default": 1,
    "conditions": [
      null,
      "dark",
      {"query": {"colorScheme": "dark"}},
      {"value": 2},
      {"query": "dark", "value": 3},
      {"query": {"colorScheme": "DARK"}, "value": 4},
      {"query": {"colorScheme": 1}, "value": 5},
      {"query": {"colorScheme": "dark"}, "value": 6}
    ]
  })";
  EXPECT_EQ(resolve(entry, kDark), 6);
  EXPECT_EQ(resolve(entry, kLight), 1);
}

TEST(ConditionalValuesTest, returnsNullForAnInvalidEntry) {
  EXPECT_EQ(resolve("null", kDark), nullptr);
  EXPECT_EQ(resolve("1", kDark), nullptr);
  EXPECT_EQ(resolve("[]", kDark), nullptr);
  EXPECT_EQ(resolve("{}", kDark), nullptr);
}

TEST(ConditionalValuesTest, aMatchWorksWithoutADefault) {
  auto entry = R"({
    "conditions": [{"query": {"colorScheme": "dark"}, "value": 2}]
  })";
  EXPECT_EQ(resolve(entry, kDark), 2);
  EXPECT_EQ(resolve(entry, kLight), nullptr);
}

TEST(ConditionalValuesTest, propsKeepTheConditionalValuesOfTheSource) {
  Props source;
  source.conditionalValues = std::make_shared<const ConditionalValues>(
      ConditionalValues{.values = folly::dynamic::object("opacity", 1)});

  // The iterator-setter path copies the source.
  EXPECT_EQ(Props(source).conditionalValues, source.conditionalValues);

  // The classic path constructs from the source and the raw props.
  RawPropsParser parser;
  parser.prepare<Props>();
  RawProps rawProps(folly::dynamic::object("nativeID", "a"));
  rawProps.parse(parser);
  ContextContainer contextContainer;
  PropsParserContext context{-1, contextContainer};
  Props props(context, source, rawProps);
  EXPECT_EQ(props.conditionalValues, source.conditionalValues);
  EXPECT_EQ(props.nativeId, "a");
}

namespace {

// Resolves to 1 in light mode and 2 in dark mode.
folly::dynamic oneOrTwo() {
  return folly::parseJson(R"({
    "default": 1,
    "conditions": [{"query": {"colorScheme": "dark"}, "value": 2}]
  })");
}

// Resolves to 0.5 in light mode and 0.25 in dark mode.
folly::dynamic halfOrQuarter() {
  return folly::parseJson(R"({
    "default": 0.5,
    "conditions": [{"query": {"colorScheme": "dark"}, "value": 0.25}]
  })");
}

// A conditional value, as JavaScript sends it.
folly::dynamic sent(folly::dynamic conditionalValue) {
  return folly::dynamic::object(
      kConditionalValueKey, std::move(conditionalValue));
}

// A payload with a conditional value, as JavaScript sends it.
folly::dynamic withFlag(folly::dynamic values) {
  values[kHasConditionalValuesPropName] = true;
  return values;
}

// By default, resolved for the same features as `resolveValues`.
Props propsWith(folly::dynamic values, const MediaFeatures& features = kDark) {
  ConditionalValues conditionalValues{.mediaFeatures = features};
  for (const auto& item : values.items()) {
    conditionalValues.dependencies |= getMediaFeatureDependencies(item.second);
  }
  conditionalValues.values = std::move(values);
  Props props;
  props.conditionalValues =
      std::make_shared<const ConditionalValues>(std::move(conditionalValues));
  return props;
}

std::shared_ptr<const ContextContainer> containerWith(
    const MediaFeatures& features) {
  auto store = std::make_shared<MediaFeaturesStore>();
  store->set(features);
  auto contextContainer = std::make_shared<const ContextContainer>();
  contextContainer->insert(kMediaFeaturesStoreKey, store);
  return contextContainer;
}

std::optional<ConditionalValuesResolution> resolveValues(
    const Props* sourceProps,
    folly::dynamic values,
    const MediaFeatures& features = kDark) {
  return resolveConditionalValues(
      sourceProps, RawProps(std::move(values)), containerWith(features).get());
}

} // namespace

TEST(ConditionalValuesTest, changesNothingWithoutConditionalValues) {
  EXPECT_FALSE(resolveValues(nullptr, folly::dynamic::object("opacity", 1)));
}

TEST(ConditionalValuesTest, resolvesNewConditionalValues) {
  auto values = withFlag(
      folly::dynamic::object("opacity", sent(oneOrTwo()))("nativeID", "a"));

  auto dark = resolveValues(nullptr, values, kDark);
  ASSERT_TRUE(dark);
  EXPECT_EQ(
      dark->rawProps.toDynamic(),
      folly::dynamic(folly::dynamic::object("opacity", 2)("nativeID", "a")));
  ASSERT_NE(dark->conditionalValues, nullptr);
  EXPECT_EQ(
      dark->conditionalValues->values,
      folly::dynamic(folly::dynamic::object("opacity", oneOrTwo())));

  auto light = resolveValues(nullptr, values, kLight);
  ASSERT_TRUE(light);
  EXPECT_EQ(light->rawProps.toDynamic()["opacity"], 1);
}

TEST(ConditionalValuesTest, resolvesTheDefaultWithoutAStore) {
  auto result = resolveConditionalValues(
      nullptr,
      RawProps(withFlag(folly::dynamic::object("opacity", sent(oneOrTwo())))),
      nullptr);
  ASSERT_TRUE(result);
  EXPECT_EQ(result->rawProps.toDynamic()["opacity"], 1);
}

TEST(ConditionalValuesTest, keepsStoredValuesOfOtherProps) {
  auto source = propsWith(folly::dynamic::object("opacity", oneOrTwo()));
  EXPECT_FALSE(resolveValues(&source, folly::dynamic::object("nativeID", "a")));
}

TEST(ConditionalValuesTest, aPlainValueRemovesTheStoredValue) {
  auto source = propsWith(
      folly::dynamic::object("opacity", oneOrTwo())(
          "borderWidth", halfOrQuarter()));
  auto result = resolveValues(&source, folly::dynamic::object("opacity", 3));
  ASSERT_TRUE(result);
  EXPECT_EQ(
      result->rawProps.toDynamic(),
      folly::dynamic(folly::dynamic::object("opacity", 3)));
  EXPECT_EQ(
      result->conditionalValues->values,
      folly::dynamic(folly::dynamic::object("borderWidth", halfOrQuarter())));
}

TEST(ConditionalValuesTest, aNullValueRemovesTheStoredValue) {
  auto source = propsWith(folly::dynamic::object("opacity", oneOrTwo()));
  auto result =
      resolveValues(&source, folly::dynamic::object("opacity", nullptr));
  ASSERT_TRUE(result);
  EXPECT_EQ(result->conditionalValues, nullptr);
}

TEST(ConditionalValuesTest, findsTheMediaFeaturesThatQueriesRead) {
  auto colorScheme = static_cast<MediaFeatureSet>(MediaFeature::ColorScheme);
  EXPECT_EQ(getMediaFeatureDependencies(oneOrTwo()), colorScheme);
  EXPECT_EQ(
      getMediaFeatureDependencies(folly::parseJson(R"({
        "default": 1,
        "conditions": [{"query": {"unknown": 1}, "value": 2}]
      })")),
      0);
  EXPECT_EQ(
      getMediaFeatureDependencies(folly::parseJson(R"({"default": 1})")), 0);
}

TEST(ConditionalValuesTest, isOutdatedOnlyForTheMediaFeaturesItReads) {
  auto readsColorScheme =
      propsWith(folly::dynamic::object("opacity", oneOrTwo()), kLight);
  EXPECT_FALSE(readsColorScheme.conditionalValues->isOutdatedFor(kLight));
  EXPECT_TRUE(readsColorScheme.conditionalValues->isOutdatedFor(kDark));

  auto readsNothing = propsWith(
      folly::dynamic::object("opacity", folly::parseJson(R"({"default": 1})")),
      kLight);
  EXPECT_FALSE(readsNothing.conditionalValues->isOutdatedFor(kDark));
}

TEST(ConditionalValuesTest, storesTheMediaFeaturesOfTheResolution) {
  auto result = resolveValues(
      nullptr, withFlag(folly::dynamic::object("opacity", sent(oneOrTwo()))));
  ASSERT_TRUE(result);
  EXPECT_EQ(
      result->conditionalValues->dependencies,
      static_cast<MediaFeatureSet>(MediaFeature::ColorScheme));
  EXPECT_EQ(result->conditionalValues->mediaFeatures, kDark);
}

TEST(ConditionalValuesTest, resolvesOutdatedStoredValuesAgain) {
  auto source =
      propsWith(folly::dynamic::object("opacity", oneOrTwo()), kLight);
  auto result = resolveValues(
      &source,
      withFlag(folly::dynamic::object("borderWidth", sent(halfOrQuarter()))));
  ASSERT_TRUE(result);
  EXPECT_EQ(
      result->rawProps.toDynamic(),
      folly::dynamic(
          folly::dynamic::object("borderWidth", 0.25)("opacity", 2)));
  EXPECT_EQ(result->conditionalValues->mediaFeatures, kDark);
}

TEST(ConditionalValuesTest, mergesNewValuesWithStoredValues) {
  auto source = propsWith(folly::dynamic::object("opacity", oneOrTwo()));
  auto result = resolveValues(
      &source,
      withFlag(folly::dynamic::object("borderWidth", sent(halfOrQuarter()))));
  ASSERT_TRUE(result);
  EXPECT_EQ(
      result->rawProps.toDynamic(),
      folly::dynamic(folly::dynamic::object("borderWidth", 0.25)));
  EXPECT_EQ(
      result->conditionalValues->values,
      folly::dynamic(
          folly::dynamic::object("opacity", oneOrTwo())(
              "borderWidth", halfOrQuarter())));
}

TEST(ConditionalValuesTest, anEmptyUpdateChangesNothing) {
  auto source = propsWith(folly::dynamic::object("opacity", oneOrTwo()));
  EXPECT_FALSE(resolveConditionalValues(
      &source, RawProps(), containerWith(kLight).get()));
}

TEST(ConditionalValuesTest, aNewValueReplacesTheStoredValue) {
  auto source = propsWith(folly::dynamic::object("opacity", oneOrTwo()));
  auto result = resolveValues(
      &source,
      withFlag(folly::dynamic::object("opacity", sent(halfOrQuarter()))));
  ASSERT_TRUE(result);
  EXPECT_EQ(
      result->rawProps.toDynamic(),
      folly::dynamic(folly::dynamic::object("opacity", 0.25)));
  EXPECT_EQ(
      result->conditionalValues->values,
      folly::dynamic(folly::dynamic::object("opacity", halfOrQuarter())));
}

// A payload of a prop with a stored value is searched even without the flag.
TEST(ConditionalValuesTest, resolvesAReplacingValueWithoutTheFlag) {
  auto source = propsWith(folly::dynamic::object("opacity", oneOrTwo()));
  auto result = resolveValues(
      &source, folly::dynamic::object("opacity", sent(halfOrQuarter())));
  ASSERT_TRUE(result);
  EXPECT_EQ(
      result->rawProps.toDynamic(),
      folly::dynamic(folly::dynamic::object("opacity", 0.25)));
}

// For example, the `setNativeProps` props that `UIManager` merges.
TEST(ConditionalValuesTest, searchesAPayloadFromCppWithoutTheFlag) {
  auto result = resolveValues(
      nullptr, folly::dynamic::object("opacity", sent(oneOrTwo())));
  ASSERT_TRUE(result);
  EXPECT_EQ(
      result->rawProps.toDynamic(),
      folly::dynamic(folly::dynamic::object("opacity", 2)));
}

// JavaScript always adds the flag, so other payloads are not searched.
TEST(ConditionalValuesTest, doesNotSearchAPayloadFromJavaScriptWithoutTheFlag) {
  auto runtime = facebook::hermes::makeHermesRuntime();
  auto value = jsi::valueFromDynamic(
      *runtime, folly::dynamic::object("opacity", sent(oneOrTwo())));
  EXPECT_FALSE(resolveConditionalValues(
      nullptr, RawProps(*runtime, value), containerWith(kDark).get()));
}

TEST(ConditionalValuesTest, removesTheFlag) {
  auto result =
      resolveValues(nullptr, withFlag(folly::dynamic::object("opacity", 1)));
  ASSERT_TRUE(result);
  EXPECT_EQ(
      result->rawProps.toDynamic(),
      folly::dynamic(folly::dynamic::object("opacity", 1)));
  EXPECT_EQ(result->conditionalValues, nullptr);
}

namespace {

// Clones props 3 times with `descriptor`, like React updates do.
template <typename DescriptorT, typename PropsT>
void expectClonePropsResolvesConditionalValues() {
  auto store = std::make_shared<MediaFeaturesStore>();
  store->set(kDark);
  auto descriptorContainer = std::make_shared<const ContextContainer>();
  descriptorContainer->insert(kMediaFeaturesStoreKey, store);
  auto descriptor = std::make_shared<DescriptorT>(ComponentDescriptorParameters{
      .eventDispatcher = {},
      .contextContainer = descriptorContainer,
      .flavor = nullptr});
  // An empty container, like `ShadowNode::clone` passes for `setNativeProps`.
  ContextContainer contextContainer;
  PropsParserContext context{-1, contextContainer};
  auto opacity = [](const Props::Shared& props) {
    return std::static_pointer_cast<const PropsT>(props)->opacity;
  };

  auto created = descriptor->cloneProps(
      context,
      nullptr,
      RawProps(
          withFlag(folly::dynamic::object("opacity", sent(halfOrQuarter())))));
  EXPECT_EQ(opacity(created), 0.25);
  ASSERT_NE(created->conditionalValues, nullptr);

  auto updated = descriptor->cloneProps(
      context, created, RawProps(folly::dynamic::object("nativeID", "a")));
  EXPECT_EQ(opacity(updated), 0.25);
  EXPECT_EQ(updated->nativeId, "a");
  EXPECT_EQ(updated->conditionalValues, created->conditionalValues);

  // After a media features change, the walk sends the stored values again.
  store->set(kLight);
  auto refreshed = descriptor->cloneProps(
      context,
      updated,
      RawProps(
          withFlag(folly::dynamic::object("opacity", sent(halfOrQuarter())))));
  EXPECT_EQ(opacity(refreshed), 0.5);
  EXPECT_EQ(refreshed->nativeId, "a");
  EXPECT_EQ(
      refreshed->conditionalValues->values, updated->conditionalValues->values);

  auto replaced = descriptor->cloneProps(
      context, refreshed, RawProps(folly::dynamic::object("opacity", 0.75)));
  EXPECT_EQ(opacity(replaced), 0.75);
  EXPECT_EQ(replaced->conditionalValues, nullptr);
}

class EnableCppPropsIteratorSetter : public ReactNativeFeatureFlagsDefaults {
 public:
  bool enableCppPropsIteratorSetter() override {
    return true;
  }
};

} // namespace

TEST(ConditionalValuesTest, clonePropsResolvesOnTheClassicPath) {
  // `TestProps` does not declare its own `setProp`, so it always uses the
  // classic path.
  static_assert(!HasIteratorSetterCtor<TestProps>);
  expectClonePropsResolvesConditionalValues<
      TestComponentDescriptor,
      TestProps>();
}

TEST(ConditionalValuesTest, clonePropsResolvesOnTheIteratorSetterPath) {
  static_assert(HasIteratorSetterCtor<ViewProps>);
  ReactNativeFeatureFlags::dangerouslyReset();
  ReactNativeFeatureFlags::override(
      std::make_unique<EnableCppPropsIteratorSetter>());
  expectClonePropsResolvesConditionalValues<
      ViewComponentDescriptor,
      ViewProps>();
  ReactNativeFeatureFlags::dangerouslyReset();
}

TEST(ConditionalValuesTest, anInvalidConditionalValueResolvesToNull) {
  auto result = resolveValues(
      nullptr, withFlag(folly::dynamic::object("opacity", sent(1))));
  ASSERT_TRUE(result);
  EXPECT_EQ(result->rawProps.toDynamic()["opacity"], nullptr);
}

} // namespace facebook::react
