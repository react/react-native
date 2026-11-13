/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/AppSpecs/Props.h>
#include <react/renderer/components/FBReactNativeSpec/Props.h>

#include <gtest/gtest.h>

namespace facebook::react {

TEST(GeneratedPropsStrictApiTest, generatedHeaderCompiles) {}

TEST(GeneratedPropsStrictApiTest, unknownPointerEventsUsesDeclaredDefault) {
  ContextContainer contextContainer;
  PropsParserContext context{-1, contextContainer};
  auto pointerEvents = SafeAreaViewPointerEvents::BoxNone;

  fromRawValue(context, RawValue{folly::dynamic("invalid")}, pointerEvents);

  EXPECT_EQ(pointerEvents, SafeAreaViewPointerEvents::Auto);
}

TEST(GeneratedPropsStrictApiTest, knownPointerEventsPreservesRequestedValue) {
  ContextContainer contextContainer;
  PropsParserContext context{-1, contextContainer};
  auto pointerEvents = SafeAreaViewPointerEvents::Auto;

  fromRawValue(context, RawValue{folly::dynamic("box-none")}, pointerEvents);

  EXPECT_EQ(pointerEvents, SafeAreaViewPointerEvents::BoxNone);
}

} // namespace facebook::react
