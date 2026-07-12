/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<e010ea1a3e640d4640676263c68a9921>>
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

#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <array>
#include <atomic>
#include <memory>
#include <optional>
#include <string>

namespace facebook::react {

class ReactNativeFeatureFlagsAccessor {
 public:
  ReactNativeFeatureFlagsAccessor();

  bool commonTestFlag();
  bool cdpInteractionMetricsEnabled();
  bool cxxNativeAnimatedEnabled();
  bool defaultTextToOverflowHidden();
  bool disableEarlyViewCommandExecution();
  bool disableImageViewPreallocationAndroid();
  bool disableMountItemReorderingAndroid();
  bool disableSubviewClippingAndroid();
  bool disableTextLayoutManagerCacheAndroid();
  bool disableViewPreallocationAndroid();
  bool enableAccessibilityOrder();
  bool enableAccumulatedUpdatesInRawPropsAndroid();
  bool enableAndroidFontWeightAdjustment();
  bool enableAndroidTextMeasurementOptimizations();
  bool enableBridgelessArchitecture();
  bool enableCppPropsIteratorSetter();
  bool enableCustomFocusSearchOnClippedElementsAndroid();
  bool enableDestroyShadowTreeRevisionAsync();
  bool enableDoubleMeasurementFixAndroid();
  bool enableEagerRootViewAttachment();
  bool enableExclusivePropsUpdateAndroid();
  bool enableFabricCommitBranching();
  bool enableFabricLogs();
  bool enableFlexboxAutoMinSizeInStrictMode();
  bool enableFontScaleChangesUpdatingLayout();
  bool enableIOSCompressedTextFrameAdjustment();
  bool enableIOSTextBaselineOffsetPerLine();
  bool enableIOSViewClipToPaddingBox();
  bool enableImagePrefetchingAndroid();
  bool enableImmediateUpdateModeForContentOffsetChanges();
  bool enableImperativeFocus();
  bool enableInteropViewManagerClassLookUpOptimizationIOS();
  bool enableIntersectionObserverByDefault();
  bool enableKeyEvents();
  bool enableLayoutAnimationsOnAndroid();
  bool enableLayoutAnimationsOnIOS();
  bool enableModuleArgumentNSNullConversionIOS();
  bool enableMutationObserverByDefault();
  bool enableNativeCSSParsing();
  bool enableNetworkEventReporting();
  bool enablePreparedTextLayout();
  bool enablePropsUpdateReconciliationAndroid();
  bool enableRuntimeSchedulerQueueClearingOnError();
  bool enableSchedulerDelegateInvalidation();
  bool enableSwiftUIBasedFilters();
  bool enableViewCulling();
  bool enableViewRecycling();
  bool enableViewRecyclingForImage();
  bool enableViewRecyclingForScrollView();
  bool enableViewRecyclingForText();
  bool enableViewRecyclingForView();
  bool enableVirtualViewContainerStateExperimental();
  bool fixDifferentiatorParentTagForUnflattenCase();
  bool fixMappingOfEventPrioritiesBetweenFabricAndReact();
  bool fixYogaFlexBasisFitContentInMainAxis();
  bool fuseboxAssertSingleHostState();
  bool fuseboxEnabledRelease();
  bool fuseboxFrameRecordingEnabled();
  bool fuseboxNetworkInspectionEnabled();
  bool fuseboxScreenshotCaptureEnabled();
  bool optimizedAnimatedPropUpdates();
  bool overrideBySynchronousMountPropsAtMountingAndroid();
  bool perfIssuesEnabled();
  bool perfMonitorV2Enabled();
  double preparedTextCacheSize();
  bool preventShadowTreeCommitExhaustion();
  bool redBoxV2Android();
  bool redBoxV2IOS();
  bool shouldPressibilityUseW3CPointerEventsForHover();
  bool shouldTriggerResponderTransferOnScrollAndroid();
  bool skipActivityIdentityAssertionOnHostPause();
  bool syncAndroidClipBoundsWithOverflow();
  bool traceTurboModulePromiseRejectionsOnAndroid();
  bool updateRuntimeShadowNodeReferencesOnCommit();
  bool updateRuntimeShadowNodeReferencesOnCommitThread();
  bool useAlwaysAvailableJSErrorHandling();
  bool useFabricInterop();
  bool useNativeViewConfigsInBridgelessMode();
  bool useNestedScrollViewAndroid();
  bool useSharedAnimatedBackend();
  bool useTraitHiddenOnAndroid();
  bool useTurboModuleInterop();
  double viewCullingOutsetRatio();
  bool viewTransitionEnabled();
  bool viewTransitionUseHardwareBitmapAndroid();
  double virtualViewPrerenderRatio();

  void override(std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);
  std::optional<std::string> getAccessedFeatureFlagNames() const;

 private:
  void markFlagAsAccessed(int position, const char* flagName);
  void ensureFlagsNotAccessed();

  std::unique_ptr<ReactNativeFeatureFlagsProvider> currentProvider_;
  bool wasOverridden_;

  std::array<std::atomic<const char*>, 86> accessedFeatureFlags_;

  std::atomic<std::optional<bool>> commonTestFlag_;
  std::atomic<std::optional<bool>> cdpInteractionMetricsEnabled_;
  std::atomic<std::optional<bool>> cxxNativeAnimatedEnabled_;
  std::atomic<std::optional<bool>> defaultTextToOverflowHidden_;
  std::atomic<std::optional<bool>> disableEarlyViewCommandExecution_;
  std::atomic<std::optional<bool>> disableImageViewPreallocationAndroid_;
  std::atomic<std::optional<bool>> disableMountItemReorderingAndroid_;
  std::atomic<std::optional<bool>> disableSubviewClippingAndroid_;
  std::atomic<std::optional<bool>> disableTextLayoutManagerCacheAndroid_;
  std::atomic<std::optional<bool>> disableViewPreallocationAndroid_;
  std::atomic<std::optional<bool>> enableAccessibilityOrder_;
  std::atomic<std::optional<bool>> enableAccumulatedUpdatesInRawPropsAndroid_;
  std::atomic<std::optional<bool>> enableAndroidFontWeightAdjustment_;
  std::atomic<std::optional<bool>> enableAndroidTextMeasurementOptimizations_;
  std::atomic<std::optional<bool>> enableBridgelessArchitecture_;
  std::atomic<std::optional<bool>> enableCppPropsIteratorSetter_;
  std::atomic<std::optional<bool>> enableCustomFocusSearchOnClippedElementsAndroid_;
  std::atomic<std::optional<bool>> enableDestroyShadowTreeRevisionAsync_;
  std::atomic<std::optional<bool>> enableDoubleMeasurementFixAndroid_;
  std::atomic<std::optional<bool>> enableEagerRootViewAttachment_;
  std::atomic<std::optional<bool>> enableExclusivePropsUpdateAndroid_;
  std::atomic<std::optional<bool>> enableFabricCommitBranching_;
  std::atomic<std::optional<bool>> enableFabricLogs_;
  std::atomic<std::optional<bool>> enableFlexboxAutoMinSizeInStrictMode_;
  std::atomic<std::optional<bool>> enableFontScaleChangesUpdatingLayout_;
  std::atomic<std::optional<bool>> enableIOSCompressedTextFrameAdjustment_;
  std::atomic<std::optional<bool>> enableIOSTextBaselineOffsetPerLine_;
  std::atomic<std::optional<bool>> enableIOSViewClipToPaddingBox_;
  std::atomic<std::optional<bool>> enableImagePrefetchingAndroid_;
  std::atomic<std::optional<bool>> enableImmediateUpdateModeForContentOffsetChanges_;
  std::atomic<std::optional<bool>> enableImperativeFocus_;
  std::atomic<std::optional<bool>> enableInteropViewManagerClassLookUpOptimizationIOS_;
  std::atomic<std::optional<bool>> enableIntersectionObserverByDefault_;
  std::atomic<std::optional<bool>> enableKeyEvents_;
  std::atomic<std::optional<bool>> enableLayoutAnimationsOnAndroid_;
  std::atomic<std::optional<bool>> enableLayoutAnimationsOnIOS_;
  std::atomic<std::optional<bool>> enableModuleArgumentNSNullConversionIOS_;
  std::atomic<std::optional<bool>> enableMutationObserverByDefault_;
  std::atomic<std::optional<bool>> enableNativeCSSParsing_;
  std::atomic<std::optional<bool>> enableNetworkEventReporting_;
  std::atomic<std::optional<bool>> enablePreparedTextLayout_;
  std::atomic<std::optional<bool>> enablePropsUpdateReconciliationAndroid_;
  std::atomic<std::optional<bool>> enableRuntimeSchedulerQueueClearingOnError_;
  std::atomic<std::optional<bool>> enableSchedulerDelegateInvalidation_;
  std::atomic<std::optional<bool>> enableSwiftUIBasedFilters_;
  std::atomic<std::optional<bool>> enableViewCulling_;
  std::atomic<std::optional<bool>> enableViewRecycling_;
  std::atomic<std::optional<bool>> enableViewRecyclingForImage_;
  std::atomic<std::optional<bool>> enableViewRecyclingForScrollView_;
  std::atomic<std::optional<bool>> enableViewRecyclingForText_;
  std::atomic<std::optional<bool>> enableViewRecyclingForView_;
  std::atomic<std::optional<bool>> enableVirtualViewContainerStateExperimental_;
  std::atomic<std::optional<bool>> fixDifferentiatorParentTagForUnflattenCase_;
  std::atomic<std::optional<bool>> fixMappingOfEventPrioritiesBetweenFabricAndReact_;
  std::atomic<std::optional<bool>> fixYogaFlexBasisFitContentInMainAxis_;
  std::atomic<std::optional<bool>> fuseboxAssertSingleHostState_;
  std::atomic<std::optional<bool>> fuseboxEnabledRelease_;
  std::atomic<std::optional<bool>> fuseboxFrameRecordingEnabled_;
  std::atomic<std::optional<bool>> fuseboxNetworkInspectionEnabled_;
  std::atomic<std::optional<bool>> fuseboxScreenshotCaptureEnabled_;
  std::atomic<std::optional<bool>> optimizedAnimatedPropUpdates_;
  std::atomic<std::optional<bool>> overrideBySynchronousMountPropsAtMountingAndroid_;
  std::atomic<std::optional<bool>> perfIssuesEnabled_;
  std::atomic<std::optional<bool>> perfMonitorV2Enabled_;
  std::atomic<std::optional<double>> preparedTextCacheSize_;
  std::atomic<std::optional<bool>> preventShadowTreeCommitExhaustion_;
  std::atomic<std::optional<bool>> redBoxV2Android_;
  std::atomic<std::optional<bool>> redBoxV2IOS_;
  std::atomic<std::optional<bool>> shouldPressibilityUseW3CPointerEventsForHover_;
  std::atomic<std::optional<bool>> shouldTriggerResponderTransferOnScrollAndroid_;
  std::atomic<std::optional<bool>> skipActivityIdentityAssertionOnHostPause_;
  std::atomic<std::optional<bool>> syncAndroidClipBoundsWithOverflow_;
  std::atomic<std::optional<bool>> traceTurboModulePromiseRejectionsOnAndroid_;
  std::atomic<std::optional<bool>> updateRuntimeShadowNodeReferencesOnCommit_;
  std::atomic<std::optional<bool>> updateRuntimeShadowNodeReferencesOnCommitThread_;
  std::atomic<std::optional<bool>> useAlwaysAvailableJSErrorHandling_;
  std::atomic<std::optional<bool>> useFabricInterop_;
  std::atomic<std::optional<bool>> useNativeViewConfigsInBridgelessMode_;
  std::atomic<std::optional<bool>> useNestedScrollViewAndroid_;
  std::atomic<std::optional<bool>> useSharedAnimatedBackend_;
  std::atomic<std::optional<bool>> useTraitHiddenOnAndroid_;
  std::atomic<std::optional<bool>> useTurboModuleInterop_;
  std::atomic<std::optional<double>> viewCullingOutsetRatio_;
  std::atomic<std::optional<bool>> viewTransitionEnabled_;
  std::atomic<std::optional<bool>> viewTransitionUseHardwareBitmapAndroid_;
  std::atomic<std::optional<double>> virtualViewPrerenderRatio_;
};

} // namespace facebook::react
