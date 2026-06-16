/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<84ae8c7745f319878c329e07551bcc11>>
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

#include "NativeReactNativeFeatureFlags.h"
#include <react/featureflags/ReactNativeFeatureFlags.h>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule>
NativeReactNativeFeatureFlagsModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeReactNativeFeatureFlags>(
      std::move(jsInvoker));
}

namespace facebook::react {

NativeReactNativeFeatureFlags::NativeReactNativeFeatureFlags(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeReactNativeFeatureFlagsCxxSpec(std::move(jsInvoker)) {}

bool NativeReactNativeFeatureFlags::commonTestFlag(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::commonTestFlag();
}

bool NativeReactNativeFeatureFlags::commonTestFlagWithoutNativeImplementation(
    jsi::Runtime& /*runtime*/) {
  // This flag is configured with `skipNativeAPI: true`.
  // TODO(T204838867): Implement support for optional methods in C++ TM codegen and remove the method definition altogether.
  return false;
}

bool NativeReactNativeFeatureFlags::cdpInteractionMetricsEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::cdpInteractionMetricsEnabled();
}

bool NativeReactNativeFeatureFlags::cxxNativeAnimatedEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::cxxNativeAnimatedEnabled();
}

bool NativeReactNativeFeatureFlags::defaultTextToOverflowHidden(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::defaultTextToOverflowHidden();
}

bool NativeReactNativeFeatureFlags::disableEarlyViewCommandExecution(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableEarlyViewCommandExecution();
}

bool NativeReactNativeFeatureFlags::disableImageViewPreallocationAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableImageViewPreallocationAndroid();
}

bool NativeReactNativeFeatureFlags::disableMountItemReorderingAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableMountItemReorderingAndroid();
}

bool NativeReactNativeFeatureFlags::disableSubviewClippingAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableSubviewClippingAndroid();
}

bool NativeReactNativeFeatureFlags::disableTextLayoutManagerCacheAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableTextLayoutManagerCacheAndroid();
}

bool NativeReactNativeFeatureFlags::disableViewPreallocationAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::disableViewPreallocationAndroid();
}

bool NativeReactNativeFeatureFlags::enableAccessibilityOrder(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableAccessibilityOrder();
}

bool NativeReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid();
}

bool NativeReactNativeFeatureFlags::enableAndroidTextMeasurementOptimizations(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableAndroidTextMeasurementOptimizations();
}

bool NativeReactNativeFeatureFlags::enableBridgelessArchitecture(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableBridgelessArchitecture();
}

bool NativeReactNativeFeatureFlags::enableCppPropsIteratorSetter(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableCppPropsIteratorSetter();
}

bool NativeReactNativeFeatureFlags::enableCustomFocusSearchOnClippedElementsAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableCustomFocusSearchOnClippedElementsAndroid();
}

bool NativeReactNativeFeatureFlags::enableDestroyShadowTreeRevisionAsync(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableDestroyShadowTreeRevisionAsync();
}

bool NativeReactNativeFeatureFlags::enableDoubleMeasurementFixAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableDoubleMeasurementFixAndroid();
}

bool NativeReactNativeFeatureFlags::enableEagerRootViewAttachment(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableEagerRootViewAttachment();
}

bool NativeReactNativeFeatureFlags::enableExclusivePropsUpdateAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableExclusivePropsUpdateAndroid();
}

bool NativeReactNativeFeatureFlags::enableFabricCommitBranching(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFabricCommitBranching();
}

bool NativeReactNativeFeatureFlags::enableFabricLogs(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFabricLogs();
}

bool NativeReactNativeFeatureFlags::enableFlexboxAutoMinSizeInStrictMode(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFlexboxAutoMinSizeInStrictMode();
}

bool NativeReactNativeFeatureFlags::enableFontScaleChangesUpdatingLayout(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableFontScaleChangesUpdatingLayout();
}

bool NativeReactNativeFeatureFlags::enableIOSTextBaselineOffsetPerLine(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableIOSTextBaselineOffsetPerLine();
}

bool NativeReactNativeFeatureFlags::enableIOSViewClipToPaddingBox(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox();
}

bool NativeReactNativeFeatureFlags::enableImagePrefetchingAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableImagePrefetchingAndroid();
}

bool NativeReactNativeFeatureFlags::enableImmediateUpdateModeForContentOffsetChanges(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableImmediateUpdateModeForContentOffsetChanges();
}

bool NativeReactNativeFeatureFlags::enableImperativeFocus(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableImperativeFocus();
}

bool NativeReactNativeFeatureFlags::enableInteropViewManagerClassLookUpOptimizationIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableInteropViewManagerClassLookUpOptimizationIOS();
}

bool NativeReactNativeFeatureFlags::enableIntersectionObserverByDefault(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableIntersectionObserverByDefault();
}

bool NativeReactNativeFeatureFlags::enableKeyEvents(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableKeyEvents();
}

bool NativeReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid();
}

bool NativeReactNativeFeatureFlags::enableLayoutAnimationsOnIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS();
}

bool NativeReactNativeFeatureFlags::enableModuleArgumentNSNullConversionIOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableModuleArgumentNSNullConversionIOS();
}

bool NativeReactNativeFeatureFlags::enableMutationObserverByDefault(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableMutationObserverByDefault();
}

bool NativeReactNativeFeatureFlags::enableNativeCSSParsing(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableNativeCSSParsing();
}

bool NativeReactNativeFeatureFlags::enableNetworkEventReporting(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableNetworkEventReporting();
}

bool NativeReactNativeFeatureFlags::enablePreparedTextLayout(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enablePreparedTextLayout();
}

bool NativeReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid();
}

bool NativeReactNativeFeatureFlags::enableRuntimeSchedulerQueueClearingOnError(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableRuntimeSchedulerQueueClearingOnError();
}

bool NativeReactNativeFeatureFlags::enableSchedulerDelegateInvalidation(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableSchedulerDelegateInvalidation();
}

bool NativeReactNativeFeatureFlags::enableSwiftUIBasedFilters(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableSwiftUIBasedFilters();
}

bool NativeReactNativeFeatureFlags::enableViewCulling(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewCulling();
}

bool NativeReactNativeFeatureFlags::enableViewRecycling(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecycling();
}

bool NativeReactNativeFeatureFlags::enableViewRecyclingForImage(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForImage();
}

bool NativeReactNativeFeatureFlags::enableViewRecyclingForScrollView(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForScrollView();
}

bool NativeReactNativeFeatureFlags::enableViewRecyclingForText(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForText();
}

bool NativeReactNativeFeatureFlags::enableViewRecyclingForView(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForView();
}

bool NativeReactNativeFeatureFlags::enableVirtualViewContainerStateExperimental(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::enableVirtualViewContainerStateExperimental();
}

bool NativeReactNativeFeatureFlags::fixDifferentiatorParentTagForUnflattenCase(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fixDifferentiatorParentTagForUnflattenCase();
}

bool NativeReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool NativeReactNativeFeatureFlags::fixYogaFlexBasisFitContentInMainAxis(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fixYogaFlexBasisFitContentInMainAxis();
}

bool NativeReactNativeFeatureFlags::fuseboxAssertSingleHostState(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fuseboxAssertSingleHostState();
}

bool NativeReactNativeFeatureFlags::fuseboxEnabledRelease(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fuseboxEnabledRelease();
}

bool NativeReactNativeFeatureFlags::fuseboxFrameRecordingEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fuseboxFrameRecordingEnabled();
}

bool NativeReactNativeFeatureFlags::fuseboxNetworkInspectionEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fuseboxNetworkInspectionEnabled();
}

bool NativeReactNativeFeatureFlags::fuseboxScreenshotCaptureEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::fuseboxScreenshotCaptureEnabled();
}

bool NativeReactNativeFeatureFlags::optimizedAnimatedPropUpdates(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::optimizedAnimatedPropUpdates();
}

bool NativeReactNativeFeatureFlags::overrideBySynchronousMountPropsAtMountingAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::overrideBySynchronousMountPropsAtMountingAndroid();
}

bool NativeReactNativeFeatureFlags::perfIssuesEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::perfIssuesEnabled();
}

bool NativeReactNativeFeatureFlags::perfMonitorV2Enabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::perfMonitorV2Enabled();
}

double NativeReactNativeFeatureFlags::preparedTextCacheSize(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::preparedTextCacheSize();
}

bool NativeReactNativeFeatureFlags::preventShadowTreeCommitExhaustion(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::preventShadowTreeCommitExhaustion();
}

bool NativeReactNativeFeatureFlags::redBoxV2Android(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::redBoxV2Android();
}

bool NativeReactNativeFeatureFlags::redBoxV2IOS(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::redBoxV2IOS();
}

bool NativeReactNativeFeatureFlags::shouldPressibilityUseW3CPointerEventsForHover(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::shouldPressibilityUseW3CPointerEventsForHover();
}

bool NativeReactNativeFeatureFlags::shouldTriggerResponderTransferOnScrollAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::shouldTriggerResponderTransferOnScrollAndroid();
}

bool NativeReactNativeFeatureFlags::skipActivityIdentityAssertionOnHostPause(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::skipActivityIdentityAssertionOnHostPause();
}

bool NativeReactNativeFeatureFlags::syncAndroidClipBoundsWithOverflow(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::syncAndroidClipBoundsWithOverflow();
}

bool NativeReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid();
}

bool NativeReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit();
}

bool NativeReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommitThread(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommitThread();
}

bool NativeReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling();
}

bool NativeReactNativeFeatureFlags::useFabricInterop(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useFabricInterop();
}

bool NativeReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode();
}

bool NativeReactNativeFeatureFlags::useNestedScrollViewAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useNestedScrollViewAndroid();
}

bool NativeReactNativeFeatureFlags::useSharedAnimatedBackend(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useSharedAnimatedBackend();
}

bool NativeReactNativeFeatureFlags::useTraitHiddenOnAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useTraitHiddenOnAndroid();
}

bool NativeReactNativeFeatureFlags::useTurboModuleInterop(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::useTurboModuleInterop();
}

double NativeReactNativeFeatureFlags::viewCullingOutsetRatio(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::viewCullingOutsetRatio();
}

bool NativeReactNativeFeatureFlags::viewTransitionEnabled(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::viewTransitionEnabled();
}

bool NativeReactNativeFeatureFlags::viewTransitionUseHardwareBitmapAndroid(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::viewTransitionUseHardwareBitmapAndroid();
}

double NativeReactNativeFeatureFlags::virtualViewPrerenderRatio(
    jsi::Runtime& /*runtime*/) {
  return ReactNativeFeatureFlags::virtualViewPrerenderRatio();
}

} // namespace facebook::react
