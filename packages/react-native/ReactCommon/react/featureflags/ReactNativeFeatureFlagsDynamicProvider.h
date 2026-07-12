/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<e8be340d97ada771fba14742a1c6a154>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags --update
 */

#pragma once

#include <folly/dynamic.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

namespace facebook::react {

/**
 * This class is a ReactNativeFeatureFlags provider that takes the values for
 * feature flags from a folly::dynamic object (e.g. from a JSON object), if
 * they are defined. For the flags not defined in the object, it falls back to
 * the default values defined in ReactNativeFeatureFlagsDefaults.
 *
 * The API is strict about typing. It ignores null values from the
 * folly::dynamic object, but if the key is defined, the value must have the
 * correct type or otherwise throws an exception.
 */
class ReactNativeFeatureFlagsDynamicProvider : public ReactNativeFeatureFlagsDefaults {
 private:
  folly::dynamic values_;

 public:
  ReactNativeFeatureFlagsDynamicProvider(folly::dynamic values): values_(std::move(values)) {
    if (!values_.isObject()) {
      throw std::invalid_argument("ReactNativeFeatureFlagsDynamicProvider: values must be an object");
    }
  }

  bool commonTestFlag() override {
    auto value = values_["commonTestFlag"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::commonTestFlag();
  }

  bool cdpInteractionMetricsEnabled() override {
    auto value = values_["cdpInteractionMetricsEnabled"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::cdpInteractionMetricsEnabled();
  }

  bool cxxNativeAnimatedEnabled() override {
    auto value = values_["cxxNativeAnimatedEnabled"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::cxxNativeAnimatedEnabled();
  }

  bool defaultTextToOverflowHidden() override {
    auto value = values_["defaultTextToOverflowHidden"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::defaultTextToOverflowHidden();
  }

  bool disableEarlyViewCommandExecution() override {
    auto value = values_["disableEarlyViewCommandExecution"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::disableEarlyViewCommandExecution();
  }

  bool disableImageViewPreallocationAndroid() override {
    auto value = values_["disableImageViewPreallocationAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::disableImageViewPreallocationAndroid();
  }

  bool disableMountItemReorderingAndroid() override {
    auto value = values_["disableMountItemReorderingAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::disableMountItemReorderingAndroid();
  }

  bool disableSubviewClippingAndroid() override {
    auto value = values_["disableSubviewClippingAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::disableSubviewClippingAndroid();
  }

  bool disableTextLayoutManagerCacheAndroid() override {
    auto value = values_["disableTextLayoutManagerCacheAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::disableTextLayoutManagerCacheAndroid();
  }

  bool disableViewPreallocationAndroid() override {
    auto value = values_["disableViewPreallocationAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::disableViewPreallocationAndroid();
  }

  bool enableAccessibilityOrder() override {
    auto value = values_["enableAccessibilityOrder"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableAccessibilityOrder();
  }

  bool enableAccumulatedUpdatesInRawPropsAndroid() override {
    auto value = values_["enableAccumulatedUpdatesInRawPropsAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableAccumulatedUpdatesInRawPropsAndroid();
  }

  bool enableAndroidFontWeightAdjustment() override {
    auto value = values_["enableAndroidFontWeightAdjustment"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableAndroidFontWeightAdjustment();
  }

  bool enableAndroidTextMeasurementOptimizations() override {
    auto value = values_["enableAndroidTextMeasurementOptimizations"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableAndroidTextMeasurementOptimizations();
  }

  bool enableBridgelessArchitecture() override {
    auto value = values_["enableBridgelessArchitecture"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableBridgelessArchitecture();
  }

  bool enableCppPropsIteratorSetter() override {
    auto value = values_["enableCppPropsIteratorSetter"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableCppPropsIteratorSetter();
  }

  bool enableCustomFocusSearchOnClippedElementsAndroid() override {
    auto value = values_["enableCustomFocusSearchOnClippedElementsAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableCustomFocusSearchOnClippedElementsAndroid();
  }

  bool enableDestroyShadowTreeRevisionAsync() override {
    auto value = values_["enableDestroyShadowTreeRevisionAsync"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableDestroyShadowTreeRevisionAsync();
  }

  bool enableDoubleMeasurementFixAndroid() override {
    auto value = values_["enableDoubleMeasurementFixAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableDoubleMeasurementFixAndroid();
  }

  bool enableEagerRootViewAttachment() override {
    auto value = values_["enableEagerRootViewAttachment"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableEagerRootViewAttachment();
  }

  bool enableExclusivePropsUpdateAndroid() override {
    auto value = values_["enableExclusivePropsUpdateAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableExclusivePropsUpdateAndroid();
  }

  bool enableFabricCommitBranching() override {
    auto value = values_["enableFabricCommitBranching"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableFabricCommitBranching();
  }

  bool enableFabricLogs() override {
    auto value = values_["enableFabricLogs"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableFabricLogs();
  }

  bool enableFlexboxAutoMinSizeInStrictMode() override {
    auto value = values_["enableFlexboxAutoMinSizeInStrictMode"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableFlexboxAutoMinSizeInStrictMode();
  }

  bool enableFontScaleChangesUpdatingLayout() override {
    auto value = values_["enableFontScaleChangesUpdatingLayout"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableFontScaleChangesUpdatingLayout();
  }

  bool enableIOSCompressedTextFrameAdjustment() override {
    auto value = values_["enableIOSCompressedTextFrameAdjustment"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableIOSCompressedTextFrameAdjustment();
  }

  bool enableIOSTextBaselineOffsetPerLine() override {
    auto value = values_["enableIOSTextBaselineOffsetPerLine"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableIOSTextBaselineOffsetPerLine();
  }

  bool enableIOSViewClipToPaddingBox() override {
    auto value = values_["enableIOSViewClipToPaddingBox"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableIOSViewClipToPaddingBox();
  }

  bool enableImagePrefetchingAndroid() override {
    auto value = values_["enableImagePrefetchingAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableImagePrefetchingAndroid();
  }

  bool enableImmediateUpdateModeForContentOffsetChanges() override {
    auto value = values_["enableImmediateUpdateModeForContentOffsetChanges"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableImmediateUpdateModeForContentOffsetChanges();
  }

  bool enableImperativeFocus() override {
    auto value = values_["enableImperativeFocus"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableImperativeFocus();
  }

  bool enableInteropViewManagerClassLookUpOptimizationIOS() override {
    auto value = values_["enableInteropViewManagerClassLookUpOptimizationIOS"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableInteropViewManagerClassLookUpOptimizationIOS();
  }

  bool enableIntersectionObserverByDefault() override {
    auto value = values_["enableIntersectionObserverByDefault"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableIntersectionObserverByDefault();
  }

  bool enableKeyEvents() override {
    auto value = values_["enableKeyEvents"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableKeyEvents();
  }

  bool enableLayoutAnimationsOnAndroid() override {
    auto value = values_["enableLayoutAnimationsOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableLayoutAnimationsOnAndroid();
  }

  bool enableLayoutAnimationsOnIOS() override {
    auto value = values_["enableLayoutAnimationsOnIOS"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableLayoutAnimationsOnIOS();
  }

  bool enableModuleArgumentNSNullConversionIOS() override {
    auto value = values_["enableModuleArgumentNSNullConversionIOS"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableModuleArgumentNSNullConversionIOS();
  }

  bool enableMutationObserverByDefault() override {
    auto value = values_["enableMutationObserverByDefault"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableMutationObserverByDefault();
  }

  bool enableNativeCSSParsing() override {
    auto value = values_["enableNativeCSSParsing"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableNativeCSSParsing();
  }

  bool enableNetworkEventReporting() override {
    auto value = values_["enableNetworkEventReporting"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableNetworkEventReporting();
  }

  bool enablePreparedTextLayout() override {
    auto value = values_["enablePreparedTextLayout"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enablePreparedTextLayout();
  }

  bool enablePropsUpdateReconciliationAndroid() override {
    auto value = values_["enablePropsUpdateReconciliationAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enablePropsUpdateReconciliationAndroid();
  }

  bool enableRuntimeSchedulerQueueClearingOnError() override {
    auto value = values_["enableRuntimeSchedulerQueueClearingOnError"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableRuntimeSchedulerQueueClearingOnError();
  }

  bool enableSchedulerDelegateInvalidation() override {
    auto value = values_["enableSchedulerDelegateInvalidation"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableSchedulerDelegateInvalidation();
  }

  bool enableSwiftUIBasedFilters() override {
    auto value = values_["enableSwiftUIBasedFilters"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableSwiftUIBasedFilters();
  }

  bool enableViewCulling() override {
    auto value = values_["enableViewCulling"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableViewCulling();
  }

  bool enableViewRecycling() override {
    auto value = values_["enableViewRecycling"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableViewRecycling();
  }

  bool enableViewRecyclingForImage() override {
    auto value = values_["enableViewRecyclingForImage"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableViewRecyclingForImage();
  }

  bool enableViewRecyclingForScrollView() override {
    auto value = values_["enableViewRecyclingForScrollView"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableViewRecyclingForScrollView();
  }

  bool enableViewRecyclingForText() override {
    auto value = values_["enableViewRecyclingForText"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableViewRecyclingForText();
  }

  bool enableViewRecyclingForView() override {
    auto value = values_["enableViewRecyclingForView"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableViewRecyclingForView();
  }

  bool enableVirtualViewContainerStateExperimental() override {
    auto value = values_["enableVirtualViewContainerStateExperimental"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::enableVirtualViewContainerStateExperimental();
  }

  bool fixDifferentiatorParentTagForUnflattenCase() override {
    auto value = values_["fixDifferentiatorParentTagForUnflattenCase"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fixDifferentiatorParentTagForUnflattenCase();
  }

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact() override {
    auto value = values_["fixMappingOfEventPrioritiesBetweenFabricAndReact"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fixMappingOfEventPrioritiesBetweenFabricAndReact();
  }

  bool fixYogaFlexBasisFitContentInMainAxis() override {
    auto value = values_["fixYogaFlexBasisFitContentInMainAxis"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fixYogaFlexBasisFitContentInMainAxis();
  }

  bool fuseboxAssertSingleHostState() override {
    auto value = values_["fuseboxAssertSingleHostState"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fuseboxAssertSingleHostState();
  }

  bool fuseboxEnabledRelease() override {
    auto value = values_["fuseboxEnabledRelease"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fuseboxEnabledRelease();
  }

  bool fuseboxFrameRecordingEnabled() override {
    auto value = values_["fuseboxFrameRecordingEnabled"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fuseboxFrameRecordingEnabled();
  }

  bool fuseboxNetworkInspectionEnabled() override {
    auto value = values_["fuseboxNetworkInspectionEnabled"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fuseboxNetworkInspectionEnabled();
  }

  bool fuseboxScreenshotCaptureEnabled() override {
    auto value = values_["fuseboxScreenshotCaptureEnabled"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::fuseboxScreenshotCaptureEnabled();
  }

  bool optimizedAnimatedPropUpdates() override {
    auto value = values_["optimizedAnimatedPropUpdates"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::optimizedAnimatedPropUpdates();
  }

  bool overrideBySynchronousMountPropsAtMountingAndroid() override {
    auto value = values_["overrideBySynchronousMountPropsAtMountingAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::overrideBySynchronousMountPropsAtMountingAndroid();
  }

  bool perfIssuesEnabled() override {
    auto value = values_["perfIssuesEnabled"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::perfIssuesEnabled();
  }

  bool perfMonitorV2Enabled() override {
    auto value = values_["perfMonitorV2Enabled"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::perfMonitorV2Enabled();
  }

  double preparedTextCacheSize() override {
    auto value = values_["preparedTextCacheSize"];
    if (!value.isNull()) {
      return value.getDouble();
    }

    return ReactNativeFeatureFlagsDefaults::preparedTextCacheSize();
  }

  bool preventShadowTreeCommitExhaustion() override {
    auto value = values_["preventShadowTreeCommitExhaustion"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::preventShadowTreeCommitExhaustion();
  }

  bool redBoxV2Android() override {
    auto value = values_["redBoxV2Android"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::redBoxV2Android();
  }

  bool redBoxV2IOS() override {
    auto value = values_["redBoxV2IOS"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::redBoxV2IOS();
  }

  bool shouldPressibilityUseW3CPointerEventsForHover() override {
    auto value = values_["shouldPressibilityUseW3CPointerEventsForHover"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::shouldPressibilityUseW3CPointerEventsForHover();
  }

  bool shouldTriggerResponderTransferOnScrollAndroid() override {
    auto value = values_["shouldTriggerResponderTransferOnScrollAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::shouldTriggerResponderTransferOnScrollAndroid();
  }

  bool skipActivityIdentityAssertionOnHostPause() override {
    auto value = values_["skipActivityIdentityAssertionOnHostPause"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::skipActivityIdentityAssertionOnHostPause();
  }

  bool syncAndroidClipBoundsWithOverflow() override {
    auto value = values_["syncAndroidClipBoundsWithOverflow"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::syncAndroidClipBoundsWithOverflow();
  }

  bool traceTurboModulePromiseRejectionsOnAndroid() override {
    auto value = values_["traceTurboModulePromiseRejectionsOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::traceTurboModulePromiseRejectionsOnAndroid();
  }

  bool updateRuntimeShadowNodeReferencesOnCommit() override {
    auto value = values_["updateRuntimeShadowNodeReferencesOnCommit"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::updateRuntimeShadowNodeReferencesOnCommit();
  }

  bool updateRuntimeShadowNodeReferencesOnCommitThread() override {
    auto value = values_["updateRuntimeShadowNodeReferencesOnCommitThread"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::updateRuntimeShadowNodeReferencesOnCommitThread();
  }

  bool useAlwaysAvailableJSErrorHandling() override {
    auto value = values_["useAlwaysAvailableJSErrorHandling"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useAlwaysAvailableJSErrorHandling();
  }

  bool useFabricInterop() override {
    auto value = values_["useFabricInterop"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useFabricInterop();
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    auto value = values_["useNativeViewConfigsInBridgelessMode"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useNativeViewConfigsInBridgelessMode();
  }

  bool useNestedScrollViewAndroid() override {
    auto value = values_["useNestedScrollViewAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useNestedScrollViewAndroid();
  }

  bool useSharedAnimatedBackend() override {
    auto value = values_["useSharedAnimatedBackend"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useSharedAnimatedBackend();
  }

  bool useTraitHiddenOnAndroid() override {
    auto value = values_["useTraitHiddenOnAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useTraitHiddenOnAndroid();
  }

  bool useTurboModuleInterop() override {
    auto value = values_["useTurboModuleInterop"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::useTurboModuleInterop();
  }

  double viewCullingOutsetRatio() override {
    auto value = values_["viewCullingOutsetRatio"];
    if (!value.isNull()) {
      return value.getDouble();
    }

    return ReactNativeFeatureFlagsDefaults::viewCullingOutsetRatio();
  }

  bool viewTransitionEnabled() override {
    auto value = values_["viewTransitionEnabled"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::viewTransitionEnabled();
  }

  bool viewTransitionUseHardwareBitmapAndroid() override {
    auto value = values_["viewTransitionUseHardwareBitmapAndroid"];
    if (!value.isNull()) {
      return value.getBool();
    }

    return ReactNativeFeatureFlagsDefaults::viewTransitionUseHardwareBitmapAndroid();
  }

  double virtualViewPrerenderRatio() override {
    auto value = values_["virtualViewPrerenderRatio"];
    if (!value.isNull()) {
      return value.getDouble();
    }

    return ReactNativeFeatureFlagsDefaults::virtualViewPrerenderRatio();
  }
};

} // namespace facebook::react
