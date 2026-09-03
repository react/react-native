/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/runtime/jni/JReactHostInspectorTarget.h>

#include <gtest/gtest.h>

#include <stdexcept>

namespace facebook::react {
namespace {

TEST(
    JReactHostInspectorTargetTest,
    testTracingStartedRejectsUnsupportedTracingMode) {
  TracingDelegate tracingDelegate;
  constexpr auto kUnsupportedTracingMode =
      static_cast<jsinspector_modern::tracing::Mode>(-1);

  EXPECT_THROW(
      tracingDelegate.onTracingStarted(
          kUnsupportedTracingMode, /*screenshotsCategoryEnabled=*/true),
      std::logic_error);
}

} // namespace
} // namespace facebook::react
