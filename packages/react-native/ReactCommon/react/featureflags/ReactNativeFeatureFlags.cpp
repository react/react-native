/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<57f84b7025cf1fc77f5f99dfc4653fb4>>
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

#include "ReactNativeFeatureFlags.h"

namespace facebook::react {

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wglobal-constructors"
std::unique_ptr<ReactNativeFeatureFlagsAccessor> accessor_;
#pragma GCC diagnostic pop

bool ReactNativeFeatureFlags::commonTestFlag() {
  return getAccessor().commonTestFlag();
}

bool ReactNativeFeatureFlags::cdpInteractionMetricsEnabled() {
  return getAccessor().cdpInteractionMetricsEnabled();
}

bool ReactNativeFeatureFlags::cxxNativeAnimatedEnabled() {
  return getAccessor().cxxNativeAnimatedEnabled();
}

bool ReactNativeFeatureFlags::defaultTextToOverflowHidden() {
  return getAccessor().defaultTextToOverflowHidden();
}

bool ReactNativeFeatureFlags::disableEarlyViewCommandExecution() {
  return getAccessor().disableEarlyViewCommandExecution();
}

bool ReactNativeFeatureFlags::disableImageViewPreallocationAndroid() {
  return getAccessor().disableImageViewPreallocationAndroid();
}

bool ReactNativeFeatureFlags::disableMountItemReorderingAndroid() {
  return getAccessor().disableMountItemReorderingAndroid();
}

bool ReactNativeFeatureFlags::disableSubviewClippingAndroid() {
  return getAccessor().disableSubviewClippingAndroid();
}

bool ReactNativeFeatureFlags::disableTextLayoutManagerCacheAndroid() {
  return getAccessor().disableTextLayoutManagerCacheAndroid();
}

bool ReactNativeFeatureFlags::disableViewPreallocationAndroid() {
  return getAccessor().disableViewPreallocationAndroid();
}

bool ReactNativeFeatureFlags::enableAccessibilityOrder() {
  return getAccessor().enableAccessibilityOrder();
}

bool ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid() {
  return getAccessor().enableAccumulatedUpdatesInRawPropsAndroid();
}

bool ReactNativeFeatureFlags::enableAndroidTextMeasurementOptimizations() {
  return getAccessor().enableAndroidTextMeasurementOptimizations();
}

bool ReactNativeFeatureFlags::enableBridgelessArchitecture() {
  return getAccessor().enableBridgelessArchitecture();
}

bool ReactNativeFeatureFlags::enableCppPropsIteratorSetter() {
  return getAccessor().enableCppPropsIteratorSetter();
}

bool ReactNativeFeatureFlags::enableCustomFocusSearchOnClippedElementsAndroid() {
  return getAccessor().enableCustomFocusSearchOnClippedElementsAndroid();
}

bool ReactNativeFeatureFlags::enableDestroyShadowTreeRevisionAsync() {
  return getAccessor().enableDestroyShadowTreeRevisionAsync();
}

bool ReactNativeFeatureFlags::enableDoubleMeasurementFixAndroid() {
  return getAccessor().enableDoubleMeasurementFixAndroid();
}

bool ReactNativeFeatureFlags::enableEagerRootViewAttachment() {
  return getAccessor().enableEagerRootViewAttachment();
}

bool ReactNativeFeatureFlags::enableExclusivePropsUpdateAndroid() {
  return getAccessor().enableExclusivePropsUpdateAndroid();
}

bool ReactNativeFeatureFlags::enableFabricCommitBranching() {
  return getAccessor().enableFabricCommitBranching();
}

bool ReactNativeFeatureFlags::enableFabricLogs() {
  return getAccessor().enableFabricLogs();
}

bool ReactNativeFeatureFlags::enableFlexboxAutoMinSizeInStrictMode() {
  return getAccessor().enableFlexboxAutoMinSizeInStrictMode();
}

bool ReactNativeFeatureFlags::enableFontScaleChangesUpdatingLayout() {
  return getAccessor().enableFontScaleChangesUpdatingLayout();
}

bool ReactNativeFeatureFlags::enableIOSTextBaselineOffsetPerLine() {
  return getAccessor().enableIOSTextBaselineOffsetPerLine();
}

bool ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox() {
  return getAccessor().enableIOSViewClipToPaddingBox();
}

bool ReactNativeFeatureFlags::enableImagePrefetchingAndroid() {
  return getAccessor().enableImagePrefetchingAndroid();
}

bool ReactNativeFeatureFlags::enableImmediateUpdateModeForContentOffsetChanges() {
  return getAccessor().enableImmediateUpdateModeForContentOffsetChanges();
}

bool ReactNativeFeatureFlags::enableImperativeFocus() {
  return getAccessor().enableImperativeFocus();
}

bool ReactNativeFeatureFlags::enableInteropViewManagerClassLookUpOptimizationIOS() {
  return getAccessor().enableInteropViewManagerClassLookUpOptimizationIOS();
}

bool ReactNativeFeatureFlags::enableIntersectionObserverByDefault() {
  return getAccessor().enableIntersectionObserverByDefault();
}

bool ReactNativeFeatureFlags::enableKeyEvents() {
  return getAccessor().enableKeyEvents();
}

bool ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid() {
  return getAccessor().enableLayoutAnimationsOnAndroid();
}

bool ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS() {
  return getAccessor().enableLayoutAnimationsOnIOS();
}

bool ReactNativeFeatureFlags::enableModuleArgumentNSNullConversionIOS() {
  return getAccessor().enableModuleArgumentNSNullConversionIOS();
}

bool ReactNativeFeatureFlags::enableMutationObserverByDefault() {
  return getAccessor().enableMutationObserverByDefault();
}

bool ReactNativeFeatureFlags::enableNativeCSSParsing() {
  return getAccessor().enableNativeCSSParsing();
}

bool ReactNativeFeatureFlags::enableNetworkEventReporting() {
  return getAccessor().enableNetworkEventReporting();
}

bool ReactNativeFeatureFlags::enablePreparedTextLayout() {
  return getAccessor().enablePreparedTextLayout();
}

bool ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid() {
  return getAccessor().enablePropsUpdateReconciliationAndroid();
}

bool ReactNativeFeatureFlags::enableRuntimeSchedulerQueueClearingOnError() {
  return getAccessor().enableRuntimeSchedulerQueueClearingOnError();
}

bool ReactNativeFeatureFlags::enableSchedulerDelegateInvalidation() {
  return getAccessor().enableSchedulerDelegateInvalidation();
}

bool ReactNativeFeatureFlags::enableSwiftUIBasedFilters() {
  return getAccessor().enableSwiftUIBasedFilters();
}

bool ReactNativeFeatureFlags::enableViewCulling() {
  return getAccessor().enableViewCulling();
}

bool ReactNativeFeatureFlags::enableViewRecycling() {
  return getAccessor().enableViewRecycling();
}

bool ReactNativeFeatureFlags::enableViewRecyclingForImage() {
  return getAccessor().enableViewRecyclingForImage();
}

bool ReactNativeFeatureFlags::enableViewRecyclingForScrollView() {
  return getAccessor().enableViewRecyclingForScrollView();
}

bool ReactNativeFeatureFlags::enableViewRecyclingForText() {
  return getAccessor().enableViewRecyclingForText();
}

bool ReactNativeFeatureFlags::enableViewRecyclingForView() {
  return getAccessor().enableViewRecyclingForView();
}

bool ReactNativeFeatureFlags::enableVirtualViewContainerStateExperimental() {
  return getAccessor().enableVirtualViewContainerStateExperimental();
}

bool ReactNativeFeatureFlags::fixDifferentiatorParentTagForUnflattenCase() {
  return getAccessor().fixDifferentiatorParentTagForUnflattenCase();
}

bool ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact() {
  return getAccessor().fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool ReactNativeFeatureFlags::fixYogaFlexBasisFitContentInMainAxis() {
  return getAccessor().fixYogaFlexBasisFitContentInMainAxis();
}

bool ReactNativeFeatureFlags::fuseboxAssertSingleHostState() {
  return getAccessor().fuseboxAssertSingleHostState();
}

bool ReactNativeFeatureFlags::fuseboxEnabledRelease() {
  return getAccessor().fuseboxEnabledRelease();
}

bool ReactNativeFeatureFlags::fuseboxFrameRecordingEnabled() {
  return getAccessor().fuseboxFrameRecordingEnabled();
}

bool ReactNativeFeatureFlags::fuseboxNetworkInspectionEnabled() {
  return getAccessor().fuseboxNetworkInspectionEnabled();
}

bool ReactNativeFeatureFlags::fuseboxScreenshotCaptureEnabled() {
  return getAccessor().fuseboxScreenshotCaptureEnabled();
}

bool ReactNativeFeatureFlags::optimizedAnimatedPropUpdates() {
  return getAccessor().optimizedAnimatedPropUpdates();
}

bool ReactNativeFeatureFlags::overrideBySynchronousMountPropsAtMountingAndroid() {
  return getAccessor().overrideBySynchronousMountPropsAtMountingAndroid();
}

bool ReactNativeFeatureFlags::perfIssuesEnabled() {
  return getAccessor().perfIssuesEnabled();
}

bool ReactNativeFeatureFlags::perfMonitorV2Enabled() {
  return getAccessor().perfMonitorV2Enabled();
}

double ReactNativeFeatureFlags::preparedTextCacheSize() {
  return getAccessor().preparedTextCacheSize();
}

bool ReactNativeFeatureFlags::preventShadowTreeCommitExhaustion() {
  return getAccessor().preventShadowTreeCommitExhaustion();
}

bool ReactNativeFeatureFlags::redBoxV2Android() {
  return getAccessor().redBoxV2Android();
}

bool ReactNativeFeatureFlags::redBoxV2IOS() {
  return getAccessor().redBoxV2IOS();
}

bool ReactNativeFeatureFlags::shouldPressibilityUseW3CPointerEventsForHover() {
  return getAccessor().shouldPressibilityUseW3CPointerEventsForHover();
}

bool ReactNativeFeatureFlags::shouldTriggerResponderTransferOnScrollAndroid() {
  return getAccessor().shouldTriggerResponderTransferOnScrollAndroid();
}

bool ReactNativeFeatureFlags::skipActivityIdentityAssertionOnHostPause() {
  return getAccessor().skipActivityIdentityAssertionOnHostPause();
}

bool ReactNativeFeatureFlags::syncAndroidClipBoundsWithOverflow() {
  return getAccessor().syncAndroidClipBoundsWithOverflow();
}

bool ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid() {
  return getAccessor().traceTurboModulePromiseRejectionsOnAndroid();
}

bool ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit() {
  return getAccessor().updateRuntimeShadowNodeReferencesOnCommit();
}

bool ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommitThread() {
  return getAccessor().updateRuntimeShadowNodeReferencesOnCommitThread();
}

bool ReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling() {
  return getAccessor().useAlwaysAvailableJSErrorHandling();
}

bool ReactNativeFeatureFlags::useFabricInterop() {
  return getAccessor().useFabricInterop();
}

bool ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode() {
  return getAccessor().useNativeViewConfigsInBridgelessMode();
}

bool ReactNativeFeatureFlags::useNestedScrollViewAndroid() {
  return getAccessor().useNestedScrollViewAndroid();
}

bool ReactNativeFeatureFlags::useSharedAnimatedBackend() {
  return getAccessor().useSharedAnimatedBackend();
}

bool ReactNativeFeatureFlags::useTraitHiddenOnAndroid() {
  return getAccessor().useTraitHiddenOnAndroid();
}

bool ReactNativeFeatureFlags::useTurboModuleInterop() {
  return getAccessor().useTurboModuleInterop();
}

double ReactNativeFeatureFlags::viewCullingOutsetRatio() {
  return getAccessor().viewCullingOutsetRatio();
}

bool ReactNativeFeatureFlags::viewTransitionEnabled() {
  return getAccessor().viewTransitionEnabled();
}

bool ReactNativeFeatureFlags::viewTransitionUseHardwareBitmapAndroid() {
  return getAccessor().viewTransitionUseHardwareBitmapAndroid();
}

double ReactNativeFeatureFlags::virtualViewPrerenderRatio() {
  return getAccessor().virtualViewPrerenderRatio();
}

void ReactNativeFeatureFlags::override(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  getAccessor().override(std::move(provider));
}

void ReactNativeFeatureFlags::dangerouslyReset() {
  accessor_ = std::make_unique<ReactNativeFeatureFlagsAccessor>();
}

std::optional<std::string> ReactNativeFeatureFlags::dangerouslyForceOverride(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  auto accessor = std::make_unique<ReactNativeFeatureFlagsAccessor>();
  accessor->override(std::move(provider));

  std::swap(accessor_, accessor);

  // Now accessor is the old accessor
  return accessor == nullptr ? std::nullopt
                             : accessor->getAccessedFeatureFlagNames();
}

ReactNativeFeatureFlagsAccessor& ReactNativeFeatureFlags::getAccessor() {
  if (accessor_ == nullptr) {
    accessor_ = std::make_unique<ReactNativeFeatureFlagsAccessor>();
  }
  return *accessor_;
}

} // namespace facebook::react
