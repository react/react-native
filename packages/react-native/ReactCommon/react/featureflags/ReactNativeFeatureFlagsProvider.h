/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<b7eb9be59de2e2a8622aa55f543c5862>>
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

namespace facebook::react {

class ReactNativeFeatureFlagsProvider {
 public:
  virtual ~ReactNativeFeatureFlagsProvider() = default;

  virtual bool commonTestFlag() = 0;
  virtual bool cdpInteractionMetricsEnabled() = 0;
  virtual bool cxxNativeAnimatedEnabled() = 0;
  virtual bool defaultTextToOverflowHidden() = 0;
  virtual bool disableEarlyViewCommandExecution() = 0;
  virtual bool disableImageViewPreallocationAndroid() = 0;
  virtual bool disableMountItemReorderingAndroid() = 0;
  virtual bool disableSubviewClippingAndroid() = 0;
  virtual bool disableTextLayoutManagerCacheAndroid() = 0;
  virtual bool disableViewPreallocationAndroid() = 0;
  virtual bool enableAccessibilityOrder() = 0;
  virtual bool enableAccumulatedUpdatesInRawPropsAndroid() = 0;
  virtual bool enableAndroidTextMeasurementOptimizations() = 0;
  virtual bool enableBridgelessArchitecture() = 0;
  virtual bool enableCppPropsIteratorSetter() = 0;
  virtual bool enableCustomFocusSearchOnClippedElementsAndroid() = 0;
  virtual bool enableDestroyShadowTreeRevisionAsync() = 0;
  virtual bool enableDoubleMeasurementFixAndroid() = 0;
  virtual bool enableEagerRootViewAttachment() = 0;
  virtual bool enableExclusivePropsUpdateAndroid() = 0;
  virtual bool enableFabricCommitBranching() = 0;
  virtual bool enableFabricLogs() = 0;
  virtual bool enableFlexboxAutoMinSizeInStrictMode() = 0;
  virtual bool enableFontScaleChangesUpdatingLayout() = 0;
  virtual bool enableIOSTextBaselineOffsetPerLine() = 0;
  virtual bool enableIOSViewClipToPaddingBox() = 0;
  virtual bool enableImagePrefetchingAndroid() = 0;
  virtual bool enableImageRequestDowngradingForNonVisibleImages() = 0;
  virtual bool enableImmediateUpdateModeForContentOffsetChanges() = 0;
  virtual bool enableImperativeFocus() = 0;
  virtual bool enableInteropViewManagerClassLookUpOptimizationIOS() = 0;
  virtual bool enableIntersectionObserverByDefault() = 0;
  virtual bool enableKeyEvents() = 0;
  virtual bool enableLayoutAnimationsOnAndroid() = 0;
  virtual bool enableLayoutAnimationsOnIOS() = 0;
  virtual bool enableModuleArgumentNSNullConversionIOS() = 0;
  virtual bool enableMutationObserverByDefault() = 0;
  virtual bool enableNativeCSSParsing() = 0;
  virtual bool enableNetworkEventReporting() = 0;
  virtual bool enablePreparedTextLayout() = 0;
  virtual bool enablePropsUpdateReconciliationAndroid() = 0;
  virtual bool enableRuntimeSchedulerQueueClearingOnError() = 0;
  virtual bool enableSchedulerDelegateInvalidation() = 0;
  virtual bool enableSwiftUIBasedFilters() = 0;
  virtual bool enableViewCulling() = 0;
  virtual bool enableViewRecycling() = 0;
  virtual bool enableViewRecyclingForImage() = 0;
  virtual bool enableViewRecyclingForScrollView() = 0;
  virtual bool enableViewRecyclingForText() = 0;
  virtual bool enableViewRecyclingForView() = 0;
  virtual bool enableVirtualViewContainerStateExperimental() = 0;
  virtual bool fixDifferentiatorParentTagForUnflattenCase() = 0;
  virtual bool fixMappingOfEventPrioritiesBetweenFabricAndReact() = 0;
  virtual bool fixYogaFlexBasisFitContentInMainAxis() = 0;
  virtual bool fuseboxAssertSingleHostState() = 0;
  virtual bool fuseboxEnabledRelease() = 0;
  virtual bool fuseboxFrameRecordingEnabled() = 0;
  virtual bool fuseboxNetworkInspectionEnabled() = 0;
  virtual bool fuseboxScreenshotCaptureEnabled() = 0;
  virtual bool optimizedAnimatedPropUpdates() = 0;
  virtual bool overrideBySynchronousMountPropsAtMountingAndroid() = 0;
  virtual bool perfIssuesEnabled() = 0;
  virtual bool perfMonitorV2Enabled() = 0;
  virtual double preparedTextCacheSize() = 0;
  virtual bool preventShadowTreeCommitExhaustion() = 0;
  virtual bool redBoxV2Android() = 0;
  virtual bool redBoxV2IOS() = 0;
  virtual bool shouldPressibilityUseW3CPointerEventsForHover() = 0;
  virtual bool shouldTriggerResponderTransferOnScrollAndroid() = 0;
  virtual bool skipActivityIdentityAssertionOnHostPause() = 0;
  virtual bool syncAndroidClipBoundsWithOverflow() = 0;
  virtual bool traceTurboModulePromiseRejectionsOnAndroid() = 0;
  virtual bool updateRuntimeShadowNodeReferencesOnCommit() = 0;
  virtual bool updateRuntimeShadowNodeReferencesOnCommitThread() = 0;
  virtual bool useAlwaysAvailableJSErrorHandling() = 0;
  virtual bool useFabricInterop() = 0;
  virtual bool useNativeViewConfigsInBridgelessMode() = 0;
  virtual bool useNestedScrollViewAndroid() = 0;
  virtual bool useOptimizedViewRegistryOnAndroid() = 0;
  virtual bool useSharedAnimatedBackend() = 0;
  virtual bool useTraitHiddenOnAndroid() = 0;
  virtual bool useTurboModuleInterop() = 0;
  virtual double viewCullingOutsetRatio() = 0;
  virtual bool viewTransitionEnabled() = 0;
  virtual bool viewTransitionUseHardwareBitmapAndroid() = 0;
  virtual double virtualViewPrerenderRatio() = 0;
};

} // namespace facebook::react
