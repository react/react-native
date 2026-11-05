/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#include <react/renderer/components/view/ViewProps.h>

#ifdef RN_SERIALIZABLE_STATE

namespace facebook::react {

namespace {

class PropsDiffingFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  PropsDiffingFlags(bool allComponents, bool coreComponents)
      : allComponents_(allComponents), coreComponents_(coreComponents) {}

  bool enablePropsUpdateReconciliationAndroid() override {
    return allComponents_;
  }

  bool enableCoreComponentsPropsUpdateReconciliationAndroid() override {
    return coreComponents_;
  }

 private:
  bool allComponents_;
  bool coreComponents_;
};

// Stands in for codegen props, which return their own component name.
class CodegenLikeProps final : public ViewProps {
 public:
  ComponentName getDiffPropsImplementationTarget() const override {
    return "Switch";
  }
};

} // namespace

class PropsDiffingGateTest : public ::testing::Test {
 protected:
  void TearDown() override {
    ReactNativeFeatureFlags::dangerouslyReset();
  }

  static void setFlags(bool allComponents, bool coreComponents) {
    ReactNativeFeatureFlags::dangerouslyReset();
    ReactNativeFeatureFlags::override(
        std::make_unique<PropsDiffingFlags>(allComponents, coreComponents));
  }

  const ViewProps viewProps_{};
  const CodegenLikeProps codegenProps_{};
};

TEST_F(PropsDiffingGateTest, disabledWhenNoFlagIsOn) {
  setFlags(/*allComponents*/ false, /*coreComponents*/ false);
  EXPECT_FALSE(isPropsDiffingEnabled("View", viewProps_));
  EXPECT_FALSE(isPropsDiffingEnabled("Switch", codegenProps_));
}

TEST_F(PropsDiffingGateTest, allComponentsFlagEnablesCoreAndCodegen) {
  setFlags(/*allComponents*/ true, /*coreComponents*/ false);
  EXPECT_TRUE(isPropsDiffingEnabled("View", viewProps_));
  EXPECT_TRUE(isPropsDiffingEnabled("Switch", codegenProps_));
}

TEST_F(PropsDiffingGateTest, coreComponentsFlagEnablesOnlyCoreComponents) {
  setFlags(/*allComponents*/ false, /*coreComponents*/ true);
  EXPECT_TRUE(isPropsDiffingEnabled("View", viewProps_));
  EXPECT_FALSE(isPropsDiffingEnabled("Switch", codegenProps_));
}

TEST_F(PropsDiffingGateTest, disabledWhenComponentDoesNotImplementDiffing) {
  // A component whose props inherit the View implementation without
  // overriding the target falls back to raw props.
  setFlags(/*allComponents*/ true, /*coreComponents*/ true);
  EXPECT_FALSE(isPropsDiffingEnabled("SafeAreaView", viewProps_));
}

TEST_F(PropsDiffingGateTest, viewPropsTargetIsACoreComponent) {
  setFlags(/*allComponents*/ false, /*coreComponents*/ true);
  EXPECT_TRUE(isPropsDiffingEnabled(
      viewProps_.getDiffPropsImplementationTarget(), viewProps_));
}

} // namespace facebook::react

#endif
