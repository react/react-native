/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<70e4f4b4bb3aa28a644ede80ceeb4fc3>>
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

#include "JReactNativeFeatureFlagsCxxInterop.h"
#include <react/featureflags/ReactNativeFeatureFlags.h>

namespace facebook::react {

static jni::alias_ref<jni::JClass> getReactNativeFeatureFlagsProviderJavaClass() {
  static const auto jClass = facebook::jni::findClassStatic(
      "com/facebook/react/internal/featureflags/ReactNativeFeatureFlagsProvider");
  return jClass;
}

/**
 * Implementation of ReactNativeFeatureFlagsProvider that wraps a
 * ReactNativeFeatureFlagsProvider Java object.
 */
class ReactNativeFeatureFlagsJavaProvider
    : public ReactNativeFeatureFlagsProvider {
 public:
  explicit ReactNativeFeatureFlagsJavaProvider(
      jni::alias_ref<jobject> javaProvider)
      : javaProvider_(make_global(javaProvider)){};

  bool commonTestFlag() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("commonTestFlag");
    return method(javaProvider_);
  }

  bool cdpInteractionMetricsEnabled() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("cdpInteractionMetricsEnabled");
    return method(javaProvider_);
  }

  bool cxxNativeAnimatedEnabled() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("cxxNativeAnimatedEnabled");
    return method(javaProvider_);
  }

  bool defaultTextToOverflowHidden() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("defaultTextToOverflowHidden");
    return method(javaProvider_);
  }

  bool disableEarlyViewCommandExecution() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("disableEarlyViewCommandExecution");
    return method(javaProvider_);
  }

  bool disableImageViewPreallocationAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("disableImageViewPreallocationAndroid");
    return method(javaProvider_);
  }

  bool disableMountItemReorderingAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("disableMountItemReorderingAndroid");
    return method(javaProvider_);
  }

  bool disableSubviewClippingAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("disableSubviewClippingAndroid");
    return method(javaProvider_);
  }

  bool disableTextLayoutManagerCacheAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("disableTextLayoutManagerCacheAndroid");
    return method(javaProvider_);
  }

  bool disableViewPreallocationAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("disableViewPreallocationAndroid");
    return method(javaProvider_);
  }

  bool enableAccessibilityOrder() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableAccessibilityOrder");
    return method(javaProvider_);
  }

  bool enableAccumulatedUpdatesInRawPropsAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableAccumulatedUpdatesInRawPropsAndroid");
    return method(javaProvider_);
  }

  bool enableAndroidTextMeasurementOptimizations() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableAndroidTextMeasurementOptimizations");
    return method(javaProvider_);
  }

  bool enableBridgelessArchitecture() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableBridgelessArchitecture");
    return method(javaProvider_);
  }

  bool enableCppPropsIteratorSetter() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableCppPropsIteratorSetter");
    return method(javaProvider_);
  }

  bool enableCustomFocusSearchOnClippedElementsAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableCustomFocusSearchOnClippedElementsAndroid");
    return method(javaProvider_);
  }

  bool enableDestroyShadowTreeRevisionAsync() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableDestroyShadowTreeRevisionAsync");
    return method(javaProvider_);
  }

  bool enableDoubleMeasurementFixAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableDoubleMeasurementFixAndroid");
    return method(javaProvider_);
  }

  bool enableEagerRootViewAttachment() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableEagerRootViewAttachment");
    return method(javaProvider_);
  }

  bool enableExclusivePropsUpdateAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableExclusivePropsUpdateAndroid");
    return method(javaProvider_);
  }

  bool enableFabricCommitBranching() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableFabricCommitBranching");
    return method(javaProvider_);
  }

  bool enableFabricLogs() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableFabricLogs");
    return method(javaProvider_);
  }

  bool enableFlexboxAutoMinSizeInStrictMode() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableFlexboxAutoMinSizeInStrictMode");
    return method(javaProvider_);
  }

  bool enableFontScaleChangesUpdatingLayout() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableFontScaleChangesUpdatingLayout");
    return method(javaProvider_);
  }

  bool enableIOSTextBaselineOffsetPerLine() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableIOSTextBaselineOffsetPerLine");
    return method(javaProvider_);
  }

  bool enableIOSViewClipToPaddingBox() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableIOSViewClipToPaddingBox");
    return method(javaProvider_);
  }

  bool enableImagePrefetchingAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableImagePrefetchingAndroid");
    return method(javaProvider_);
  }

  bool enableImageRequestDowngradingForNonVisibleImages() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableImageRequestDowngradingForNonVisibleImages");
    return method(javaProvider_);
  }

  bool enableImmediateUpdateModeForContentOffsetChanges() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableImmediateUpdateModeForContentOffsetChanges");
    return method(javaProvider_);
  }

  bool enableImperativeFocus() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableImperativeFocus");
    return method(javaProvider_);
  }

  bool enableInteropViewManagerClassLookUpOptimizationIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableInteropViewManagerClassLookUpOptimizationIOS");
    return method(javaProvider_);
  }

  bool enableIntersectionObserverByDefault() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableIntersectionObserverByDefault");
    return method(javaProvider_);
  }

  bool enableKeyEvents() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableKeyEvents");
    return method(javaProvider_);
  }

  bool enableLayoutAnimationsOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableLayoutAnimationsOnAndroid");
    return method(javaProvider_);
  }

  bool enableLayoutAnimationsOnIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableLayoutAnimationsOnIOS");
    return method(javaProvider_);
  }

  bool enableModuleArgumentNSNullConversionIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableModuleArgumentNSNullConversionIOS");
    return method(javaProvider_);
  }

  bool enableMutationObserverByDefault() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableMutationObserverByDefault");
    return method(javaProvider_);
  }

  bool enableNativeCSSParsing() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableNativeCSSParsing");
    return method(javaProvider_);
  }

  bool enableNetworkEventReporting() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableNetworkEventReporting");
    return method(javaProvider_);
  }

  bool enablePreparedTextLayout() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enablePreparedTextLayout");
    return method(javaProvider_);
  }

  bool enablePropsUpdateReconciliationAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enablePropsUpdateReconciliationAndroid");
    return method(javaProvider_);
  }

  bool enableRuntimeSchedulerQueueClearingOnError() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableRuntimeSchedulerQueueClearingOnError");
    return method(javaProvider_);
  }

  bool enableSchedulerDelegateInvalidation() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableSchedulerDelegateInvalidation");
    return method(javaProvider_);
  }

  bool enableSwiftUIBasedFilters() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableSwiftUIBasedFilters");
    return method(javaProvider_);
  }

  bool enableViewCulling() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableViewCulling");
    return method(javaProvider_);
  }

  bool enableViewRecycling() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableViewRecycling");
    return method(javaProvider_);
  }

  bool enableViewRecyclingForImage() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableViewRecyclingForImage");
    return method(javaProvider_);
  }

  bool enableViewRecyclingForScrollView() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableViewRecyclingForScrollView");
    return method(javaProvider_);
  }

  bool enableViewRecyclingForText() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableViewRecyclingForText");
    return method(javaProvider_);
  }

  bool enableViewRecyclingForView() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableViewRecyclingForView");
    return method(javaProvider_);
  }

  bool enableVirtualViewContainerStateExperimental() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("enableVirtualViewContainerStateExperimental");
    return method(javaProvider_);
  }

  bool fixDifferentiatorParentTagForUnflattenCase() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fixDifferentiatorParentTagForUnflattenCase");
    return method(javaProvider_);
  }

  bool fixMappingOfEventPrioritiesBetweenFabricAndReact() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fixMappingOfEventPrioritiesBetweenFabricAndReact");
    return method(javaProvider_);
  }

  bool fixYogaFlexBasisFitContentInMainAxis() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fixYogaFlexBasisFitContentInMainAxis");
    return method(javaProvider_);
  }

  bool fuseboxAssertSingleHostState() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fuseboxAssertSingleHostState");
    return method(javaProvider_);
  }

  bool fuseboxEnabledRelease() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fuseboxEnabledRelease");
    return method(javaProvider_);
  }

  bool fuseboxFrameRecordingEnabled() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fuseboxFrameRecordingEnabled");
    return method(javaProvider_);
  }

  bool fuseboxNetworkInspectionEnabled() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fuseboxNetworkInspectionEnabled");
    return method(javaProvider_);
  }

  bool fuseboxScreenshotCaptureEnabled() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("fuseboxScreenshotCaptureEnabled");
    return method(javaProvider_);
  }

  bool hideOffscreenVirtualViewsOnIOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("hideOffscreenVirtualViewsOnIOS");
    return method(javaProvider_);
  }

  bool optimizedAnimatedPropUpdates() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("optimizedAnimatedPropUpdates");
    return method(javaProvider_);
  }

  bool overrideBySynchronousMountPropsAtMountingAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("overrideBySynchronousMountPropsAtMountingAndroid");
    return method(javaProvider_);
  }

  bool perfIssuesEnabled() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("perfIssuesEnabled");
    return method(javaProvider_);
  }

  bool perfMonitorV2Enabled() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("perfMonitorV2Enabled");
    return method(javaProvider_);
  }

  double preparedTextCacheSize() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jdouble()>("preparedTextCacheSize");
    return method(javaProvider_);
  }

  bool preventShadowTreeCommitExhaustion() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("preventShadowTreeCommitExhaustion");
    return method(javaProvider_);
  }

  bool redBoxV2Android() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("redBoxV2Android");
    return method(javaProvider_);
  }

  bool redBoxV2IOS() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("redBoxV2IOS");
    return method(javaProvider_);
  }

  bool shouldPressibilityUseW3CPointerEventsForHover() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("shouldPressibilityUseW3CPointerEventsForHover");
    return method(javaProvider_);
  }

  bool shouldTriggerResponderTransferOnScrollAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("shouldTriggerResponderTransferOnScrollAndroid");
    return method(javaProvider_);
  }

  bool skipActivityIdentityAssertionOnHostPause() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("skipActivityIdentityAssertionOnHostPause");
    return method(javaProvider_);
  }

  bool syncAndroidClipBoundsWithOverflow() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("syncAndroidClipBoundsWithOverflow");
    return method(javaProvider_);
  }

  bool traceTurboModulePromiseRejectionsOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("traceTurboModulePromiseRejectionsOnAndroid");
    return method(javaProvider_);
  }

  bool updateRuntimeShadowNodeReferencesOnCommit() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("updateRuntimeShadowNodeReferencesOnCommit");
    return method(javaProvider_);
  }

  bool updateRuntimeShadowNodeReferencesOnCommitThread() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("updateRuntimeShadowNodeReferencesOnCommitThread");
    return method(javaProvider_);
  }

  bool useAlwaysAvailableJSErrorHandling() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useAlwaysAvailableJSErrorHandling");
    return method(javaProvider_);
  }

  bool useFabricInterop() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useFabricInterop");
    return method(javaProvider_);
  }

  bool useNativeViewConfigsInBridgelessMode() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useNativeViewConfigsInBridgelessMode");
    return method(javaProvider_);
  }

  bool useNestedScrollViewAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useNestedScrollViewAndroid");
    return method(javaProvider_);
  }

  bool useOptimizedViewRegistryOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useOptimizedViewRegistryOnAndroid");
    return method(javaProvider_);
  }

  bool useSharedAnimatedBackend() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useSharedAnimatedBackend");
    return method(javaProvider_);
  }

  bool useTraitHiddenOnAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useTraitHiddenOnAndroid");
    return method(javaProvider_);
  }

  bool useTurboModuleInterop() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("useTurboModuleInterop");
    return method(javaProvider_);
  }

  double viewCullingOutsetRatio() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jdouble()>("viewCullingOutsetRatio");
    return method(javaProvider_);
  }

  bool viewTransitionEnabled() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("viewTransitionEnabled");
    return method(javaProvider_);
  }

  bool viewTransitionUseHardwareBitmapAndroid() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jboolean()>("viewTransitionUseHardwareBitmapAndroid");
    return method(javaProvider_);
  }

  double virtualViewPrerenderRatio() override {
    static const auto method =
        getReactNativeFeatureFlagsProviderJavaClass()->getMethod<jdouble()>("virtualViewPrerenderRatio");
    return method(javaProvider_);
  }

 private:
  jni::global_ref<jobject> javaProvider_;
};

bool JReactNativeFeatureFlagsCxxInterop::commonTestFlag(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::commonTestFlag();
}

bool JReactNativeFeatureFlagsCxxInterop::cdpInteractionMetricsEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::cdpInteractionMetricsEnabled();
}

bool JReactNativeFeatureFlagsCxxInterop::cxxNativeAnimatedEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::cxxNativeAnimatedEnabled();
}

bool JReactNativeFeatureFlagsCxxInterop::defaultTextToOverflowHidden(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::defaultTextToOverflowHidden();
}

bool JReactNativeFeatureFlagsCxxInterop::disableEarlyViewCommandExecution(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::disableEarlyViewCommandExecution();
}

bool JReactNativeFeatureFlagsCxxInterop::disableImageViewPreallocationAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::disableImageViewPreallocationAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::disableMountItemReorderingAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::disableMountItemReorderingAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::disableSubviewClippingAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::disableSubviewClippingAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::disableTextLayoutManagerCacheAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::disableTextLayoutManagerCacheAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::disableViewPreallocationAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::disableViewPreallocationAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableAccessibilityOrder(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableAccessibilityOrder();
}

bool JReactNativeFeatureFlagsCxxInterop::enableAccumulatedUpdatesInRawPropsAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableAccumulatedUpdatesInRawPropsAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableAndroidTextMeasurementOptimizations(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableAndroidTextMeasurementOptimizations();
}

bool JReactNativeFeatureFlagsCxxInterop::enableBridgelessArchitecture(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableBridgelessArchitecture();
}

bool JReactNativeFeatureFlagsCxxInterop::enableCppPropsIteratorSetter(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableCppPropsIteratorSetter();
}

bool JReactNativeFeatureFlagsCxxInterop::enableCustomFocusSearchOnClippedElementsAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableCustomFocusSearchOnClippedElementsAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableDestroyShadowTreeRevisionAsync(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableDestroyShadowTreeRevisionAsync();
}

bool JReactNativeFeatureFlagsCxxInterop::enableDoubleMeasurementFixAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableDoubleMeasurementFixAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableEagerRootViewAttachment(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableEagerRootViewAttachment();
}

bool JReactNativeFeatureFlagsCxxInterop::enableExclusivePropsUpdateAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableExclusivePropsUpdateAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFabricCommitBranching(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFabricCommitBranching();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFabricLogs(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFabricLogs();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFlexboxAutoMinSizeInStrictMode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFlexboxAutoMinSizeInStrictMode();
}

bool JReactNativeFeatureFlagsCxxInterop::enableFontScaleChangesUpdatingLayout(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableFontScaleChangesUpdatingLayout();
}

bool JReactNativeFeatureFlagsCxxInterop::enableIOSTextBaselineOffsetPerLine(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableIOSTextBaselineOffsetPerLine();
}

bool JReactNativeFeatureFlagsCxxInterop::enableIOSViewClipToPaddingBox(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableIOSViewClipToPaddingBox();
}

bool JReactNativeFeatureFlagsCxxInterop::enableImagePrefetchingAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableImagePrefetchingAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableImageRequestDowngradingForNonVisibleImages(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableImageRequestDowngradingForNonVisibleImages();
}

bool JReactNativeFeatureFlagsCxxInterop::enableImmediateUpdateModeForContentOffsetChanges(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableImmediateUpdateModeForContentOffsetChanges();
}

bool JReactNativeFeatureFlagsCxxInterop::enableImperativeFocus(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableImperativeFocus();
}

bool JReactNativeFeatureFlagsCxxInterop::enableInteropViewManagerClassLookUpOptimizationIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableInteropViewManagerClassLookUpOptimizationIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableIntersectionObserverByDefault(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableIntersectionObserverByDefault();
}

bool JReactNativeFeatureFlagsCxxInterop::enableKeyEvents(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableKeyEvents();
}

bool JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableLayoutAnimationsOnIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableModuleArgumentNSNullConversionIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableModuleArgumentNSNullConversionIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::enableMutationObserverByDefault(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableMutationObserverByDefault();
}

bool JReactNativeFeatureFlagsCxxInterop::enableNativeCSSParsing(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableNativeCSSParsing();
}

bool JReactNativeFeatureFlagsCxxInterop::enableNetworkEventReporting(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableNetworkEventReporting();
}

bool JReactNativeFeatureFlagsCxxInterop::enablePreparedTextLayout(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enablePreparedTextLayout();
}

bool JReactNativeFeatureFlagsCxxInterop::enablePropsUpdateReconciliationAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enablePropsUpdateReconciliationAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::enableRuntimeSchedulerQueueClearingOnError(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableRuntimeSchedulerQueueClearingOnError();
}

bool JReactNativeFeatureFlagsCxxInterop::enableSchedulerDelegateInvalidation(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableSchedulerDelegateInvalidation();
}

bool JReactNativeFeatureFlagsCxxInterop::enableSwiftUIBasedFilters(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableSwiftUIBasedFilters();
}

bool JReactNativeFeatureFlagsCxxInterop::enableViewCulling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableViewCulling();
}

bool JReactNativeFeatureFlagsCxxInterop::enableViewRecycling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableViewRecycling();
}

bool JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForImage(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForImage();
}

bool JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForScrollView(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForScrollView();
}

bool JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForText(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForText();
}

bool JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForView(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableViewRecyclingForView();
}

bool JReactNativeFeatureFlagsCxxInterop::enableVirtualViewContainerStateExperimental(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::enableVirtualViewContainerStateExperimental();
}

bool JReactNativeFeatureFlagsCxxInterop::fixDifferentiatorParentTagForUnflattenCase(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fixDifferentiatorParentTagForUnflattenCase();
}

bool JReactNativeFeatureFlagsCxxInterop::fixMappingOfEventPrioritiesBetweenFabricAndReact(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fixMappingOfEventPrioritiesBetweenFabricAndReact();
}

bool JReactNativeFeatureFlagsCxxInterop::fixYogaFlexBasisFitContentInMainAxis(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fixYogaFlexBasisFitContentInMainAxis();
}

bool JReactNativeFeatureFlagsCxxInterop::fuseboxAssertSingleHostState(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fuseboxAssertSingleHostState();
}

bool JReactNativeFeatureFlagsCxxInterop::fuseboxEnabledRelease(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fuseboxEnabledRelease();
}

bool JReactNativeFeatureFlagsCxxInterop::fuseboxFrameRecordingEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fuseboxFrameRecordingEnabled();
}

bool JReactNativeFeatureFlagsCxxInterop::fuseboxNetworkInspectionEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fuseboxNetworkInspectionEnabled();
}

bool JReactNativeFeatureFlagsCxxInterop::fuseboxScreenshotCaptureEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::fuseboxScreenshotCaptureEnabled();
}

bool JReactNativeFeatureFlagsCxxInterop::hideOffscreenVirtualViewsOnIOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::hideOffscreenVirtualViewsOnIOS();
}

bool JReactNativeFeatureFlagsCxxInterop::optimizedAnimatedPropUpdates(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::optimizedAnimatedPropUpdates();
}

bool JReactNativeFeatureFlagsCxxInterop::overrideBySynchronousMountPropsAtMountingAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::overrideBySynchronousMountPropsAtMountingAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::perfIssuesEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::perfIssuesEnabled();
}

bool JReactNativeFeatureFlagsCxxInterop::perfMonitorV2Enabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::perfMonitorV2Enabled();
}

double JReactNativeFeatureFlagsCxxInterop::preparedTextCacheSize(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::preparedTextCacheSize();
}

bool JReactNativeFeatureFlagsCxxInterop::preventShadowTreeCommitExhaustion(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::preventShadowTreeCommitExhaustion();
}

bool JReactNativeFeatureFlagsCxxInterop::redBoxV2Android(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::redBoxV2Android();
}

bool JReactNativeFeatureFlagsCxxInterop::redBoxV2IOS(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::redBoxV2IOS();
}

bool JReactNativeFeatureFlagsCxxInterop::shouldPressibilityUseW3CPointerEventsForHover(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::shouldPressibilityUseW3CPointerEventsForHover();
}

bool JReactNativeFeatureFlagsCxxInterop::shouldTriggerResponderTransferOnScrollAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::shouldTriggerResponderTransferOnScrollAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::skipActivityIdentityAssertionOnHostPause(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::skipActivityIdentityAssertionOnHostPause();
}

bool JReactNativeFeatureFlagsCxxInterop::syncAndroidClipBoundsWithOverflow(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::syncAndroidClipBoundsWithOverflow();
}

bool JReactNativeFeatureFlagsCxxInterop::traceTurboModulePromiseRejectionsOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::traceTurboModulePromiseRejectionsOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::updateRuntimeShadowNodeReferencesOnCommit(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommit();
}

bool JReactNativeFeatureFlagsCxxInterop::updateRuntimeShadowNodeReferencesOnCommitThread(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::updateRuntimeShadowNodeReferencesOnCommitThread();
}

bool JReactNativeFeatureFlagsCxxInterop::useAlwaysAvailableJSErrorHandling(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling();
}

bool JReactNativeFeatureFlagsCxxInterop::useFabricInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useFabricInterop();
}

bool JReactNativeFeatureFlagsCxxInterop::useNativeViewConfigsInBridgelessMode(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode();
}

bool JReactNativeFeatureFlagsCxxInterop::useNestedScrollViewAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useNestedScrollViewAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::useOptimizedViewRegistryOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useOptimizedViewRegistryOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::useSharedAnimatedBackend(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useSharedAnimatedBackend();
}

bool JReactNativeFeatureFlagsCxxInterop::useTraitHiddenOnAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useTraitHiddenOnAndroid();
}

bool JReactNativeFeatureFlagsCxxInterop::useTurboModuleInterop(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::useTurboModuleInterop();
}

double JReactNativeFeatureFlagsCxxInterop::viewCullingOutsetRatio(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::viewCullingOutsetRatio();
}

bool JReactNativeFeatureFlagsCxxInterop::viewTransitionEnabled(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::viewTransitionEnabled();
}

bool JReactNativeFeatureFlagsCxxInterop::viewTransitionUseHardwareBitmapAndroid(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::viewTransitionUseHardwareBitmapAndroid();
}

double JReactNativeFeatureFlagsCxxInterop::virtualViewPrerenderRatio(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  return ReactNativeFeatureFlags::virtualViewPrerenderRatio();
}

void JReactNativeFeatureFlagsCxxInterop::override(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/,
    jni::alias_ref<jobject> provider) {
  ReactNativeFeatureFlags::override(
      std::make_unique<ReactNativeFeatureFlagsJavaProvider>(provider));
}

void JReactNativeFeatureFlagsCxxInterop::dangerouslyReset(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/) {
  ReactNativeFeatureFlags::dangerouslyReset();
}

jni::local_ref<jstring> JReactNativeFeatureFlagsCxxInterop::dangerouslyForceOverride(
    facebook::jni::alias_ref<JReactNativeFeatureFlagsCxxInterop> /*unused*/,
    jni::alias_ref<jobject> provider) {
  auto accessedFlags = ReactNativeFeatureFlags::dangerouslyForceOverride(
             std::make_unique<ReactNativeFeatureFlagsJavaProvider>(provider));
  if (accessedFlags.has_value()) {
    return jni::make_jstring(accessedFlags.value());
  }
  return nullptr;
}

void JReactNativeFeatureFlagsCxxInterop::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "override", JReactNativeFeatureFlagsCxxInterop::override),
      makeNativeMethod("dangerouslyReset", JReactNativeFeatureFlagsCxxInterop::dangerouslyReset),
      makeNativeMethod(
          "dangerouslyForceOverride",
          JReactNativeFeatureFlagsCxxInterop::dangerouslyForceOverride),
      makeNativeMethod(
        "commonTestFlag",
        JReactNativeFeatureFlagsCxxInterop::commonTestFlag),
      makeNativeMethod(
        "cdpInteractionMetricsEnabled",
        JReactNativeFeatureFlagsCxxInterop::cdpInteractionMetricsEnabled),
      makeNativeMethod(
        "cxxNativeAnimatedEnabled",
        JReactNativeFeatureFlagsCxxInterop::cxxNativeAnimatedEnabled),
      makeNativeMethod(
        "defaultTextToOverflowHidden",
        JReactNativeFeatureFlagsCxxInterop::defaultTextToOverflowHidden),
      makeNativeMethod(
        "disableEarlyViewCommandExecution",
        JReactNativeFeatureFlagsCxxInterop::disableEarlyViewCommandExecution),
      makeNativeMethod(
        "disableImageViewPreallocationAndroid",
        JReactNativeFeatureFlagsCxxInterop::disableImageViewPreallocationAndroid),
      makeNativeMethod(
        "disableMountItemReorderingAndroid",
        JReactNativeFeatureFlagsCxxInterop::disableMountItemReorderingAndroid),
      makeNativeMethod(
        "disableSubviewClippingAndroid",
        JReactNativeFeatureFlagsCxxInterop::disableSubviewClippingAndroid),
      makeNativeMethod(
        "disableTextLayoutManagerCacheAndroid",
        JReactNativeFeatureFlagsCxxInterop::disableTextLayoutManagerCacheAndroid),
      makeNativeMethod(
        "disableViewPreallocationAndroid",
        JReactNativeFeatureFlagsCxxInterop::disableViewPreallocationAndroid),
      makeNativeMethod(
        "enableAccessibilityOrder",
        JReactNativeFeatureFlagsCxxInterop::enableAccessibilityOrder),
      makeNativeMethod(
        "enableAccumulatedUpdatesInRawPropsAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableAccumulatedUpdatesInRawPropsAndroid),
      makeNativeMethod(
        "enableAndroidTextMeasurementOptimizations",
        JReactNativeFeatureFlagsCxxInterop::enableAndroidTextMeasurementOptimizations),
      makeNativeMethod(
        "enableBridgelessArchitecture",
        JReactNativeFeatureFlagsCxxInterop::enableBridgelessArchitecture),
      makeNativeMethod(
        "enableCppPropsIteratorSetter",
        JReactNativeFeatureFlagsCxxInterop::enableCppPropsIteratorSetter),
      makeNativeMethod(
        "enableCustomFocusSearchOnClippedElementsAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableCustomFocusSearchOnClippedElementsAndroid),
      makeNativeMethod(
        "enableDestroyShadowTreeRevisionAsync",
        JReactNativeFeatureFlagsCxxInterop::enableDestroyShadowTreeRevisionAsync),
      makeNativeMethod(
        "enableDoubleMeasurementFixAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableDoubleMeasurementFixAndroid),
      makeNativeMethod(
        "enableEagerRootViewAttachment",
        JReactNativeFeatureFlagsCxxInterop::enableEagerRootViewAttachment),
      makeNativeMethod(
        "enableExclusivePropsUpdateAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableExclusivePropsUpdateAndroid),
      makeNativeMethod(
        "enableFabricCommitBranching",
        JReactNativeFeatureFlagsCxxInterop::enableFabricCommitBranching),
      makeNativeMethod(
        "enableFabricLogs",
        JReactNativeFeatureFlagsCxxInterop::enableFabricLogs),
      makeNativeMethod(
        "enableFlexboxAutoMinSizeInStrictMode",
        JReactNativeFeatureFlagsCxxInterop::enableFlexboxAutoMinSizeInStrictMode),
      makeNativeMethod(
        "enableFontScaleChangesUpdatingLayout",
        JReactNativeFeatureFlagsCxxInterop::enableFontScaleChangesUpdatingLayout),
      makeNativeMethod(
        "enableIOSTextBaselineOffsetPerLine",
        JReactNativeFeatureFlagsCxxInterop::enableIOSTextBaselineOffsetPerLine),
      makeNativeMethod(
        "enableIOSViewClipToPaddingBox",
        JReactNativeFeatureFlagsCxxInterop::enableIOSViewClipToPaddingBox),
      makeNativeMethod(
        "enableImagePrefetchingAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableImagePrefetchingAndroid),
      makeNativeMethod(
        "enableImageRequestDowngradingForNonVisibleImages",
        JReactNativeFeatureFlagsCxxInterop::enableImageRequestDowngradingForNonVisibleImages),
      makeNativeMethod(
        "enableImmediateUpdateModeForContentOffsetChanges",
        JReactNativeFeatureFlagsCxxInterop::enableImmediateUpdateModeForContentOffsetChanges),
      makeNativeMethod(
        "enableImperativeFocus",
        JReactNativeFeatureFlagsCxxInterop::enableImperativeFocus),
      makeNativeMethod(
        "enableInteropViewManagerClassLookUpOptimizationIOS",
        JReactNativeFeatureFlagsCxxInterop::enableInteropViewManagerClassLookUpOptimizationIOS),
      makeNativeMethod(
        "enableIntersectionObserverByDefault",
        JReactNativeFeatureFlagsCxxInterop::enableIntersectionObserverByDefault),
      makeNativeMethod(
        "enableKeyEvents",
        JReactNativeFeatureFlagsCxxInterop::enableKeyEvents),
      makeNativeMethod(
        "enableLayoutAnimationsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnAndroid),
      makeNativeMethod(
        "enableLayoutAnimationsOnIOS",
        JReactNativeFeatureFlagsCxxInterop::enableLayoutAnimationsOnIOS),
      makeNativeMethod(
        "enableModuleArgumentNSNullConversionIOS",
        JReactNativeFeatureFlagsCxxInterop::enableModuleArgumentNSNullConversionIOS),
      makeNativeMethod(
        "enableMutationObserverByDefault",
        JReactNativeFeatureFlagsCxxInterop::enableMutationObserverByDefault),
      makeNativeMethod(
        "enableNativeCSSParsing",
        JReactNativeFeatureFlagsCxxInterop::enableNativeCSSParsing),
      makeNativeMethod(
        "enableNetworkEventReporting",
        JReactNativeFeatureFlagsCxxInterop::enableNetworkEventReporting),
      makeNativeMethod(
        "enablePreparedTextLayout",
        JReactNativeFeatureFlagsCxxInterop::enablePreparedTextLayout),
      makeNativeMethod(
        "enablePropsUpdateReconciliationAndroid",
        JReactNativeFeatureFlagsCxxInterop::enablePropsUpdateReconciliationAndroid),
      makeNativeMethod(
        "enableRuntimeSchedulerQueueClearingOnError",
        JReactNativeFeatureFlagsCxxInterop::enableRuntimeSchedulerQueueClearingOnError),
      makeNativeMethod(
        "enableSchedulerDelegateInvalidation",
        JReactNativeFeatureFlagsCxxInterop::enableSchedulerDelegateInvalidation),
      makeNativeMethod(
        "enableSwiftUIBasedFilters",
        JReactNativeFeatureFlagsCxxInterop::enableSwiftUIBasedFilters),
      makeNativeMethod(
        "enableViewCulling",
        JReactNativeFeatureFlagsCxxInterop::enableViewCulling),
      makeNativeMethod(
        "enableViewRecycling",
        JReactNativeFeatureFlagsCxxInterop::enableViewRecycling),
      makeNativeMethod(
        "enableViewRecyclingForImage",
        JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForImage),
      makeNativeMethod(
        "enableViewRecyclingForScrollView",
        JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForScrollView),
      makeNativeMethod(
        "enableViewRecyclingForText",
        JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForText),
      makeNativeMethod(
        "enableViewRecyclingForView",
        JReactNativeFeatureFlagsCxxInterop::enableViewRecyclingForView),
      makeNativeMethod(
        "enableVirtualViewContainerStateExperimental",
        JReactNativeFeatureFlagsCxxInterop::enableVirtualViewContainerStateExperimental),
      makeNativeMethod(
        "fixDifferentiatorParentTagForUnflattenCase",
        JReactNativeFeatureFlagsCxxInterop::fixDifferentiatorParentTagForUnflattenCase),
      makeNativeMethod(
        "fixMappingOfEventPrioritiesBetweenFabricAndReact",
        JReactNativeFeatureFlagsCxxInterop::fixMappingOfEventPrioritiesBetweenFabricAndReact),
      makeNativeMethod(
        "fixYogaFlexBasisFitContentInMainAxis",
        JReactNativeFeatureFlagsCxxInterop::fixYogaFlexBasisFitContentInMainAxis),
      makeNativeMethod(
        "fuseboxAssertSingleHostState",
        JReactNativeFeatureFlagsCxxInterop::fuseboxAssertSingleHostState),
      makeNativeMethod(
        "fuseboxEnabledRelease",
        JReactNativeFeatureFlagsCxxInterop::fuseboxEnabledRelease),
      makeNativeMethod(
        "fuseboxFrameRecordingEnabled",
        JReactNativeFeatureFlagsCxxInterop::fuseboxFrameRecordingEnabled),
      makeNativeMethod(
        "fuseboxNetworkInspectionEnabled",
        JReactNativeFeatureFlagsCxxInterop::fuseboxNetworkInspectionEnabled),
      makeNativeMethod(
        "fuseboxScreenshotCaptureEnabled",
        JReactNativeFeatureFlagsCxxInterop::fuseboxScreenshotCaptureEnabled),
      makeNativeMethod(
        "hideOffscreenVirtualViewsOnIOS",
        JReactNativeFeatureFlagsCxxInterop::hideOffscreenVirtualViewsOnIOS),
      makeNativeMethod(
        "optimizedAnimatedPropUpdates",
        JReactNativeFeatureFlagsCxxInterop::optimizedAnimatedPropUpdates),
      makeNativeMethod(
        "overrideBySynchronousMountPropsAtMountingAndroid",
        JReactNativeFeatureFlagsCxxInterop::overrideBySynchronousMountPropsAtMountingAndroid),
      makeNativeMethod(
        "perfIssuesEnabled",
        JReactNativeFeatureFlagsCxxInterop::perfIssuesEnabled),
      makeNativeMethod(
        "perfMonitorV2Enabled",
        JReactNativeFeatureFlagsCxxInterop::perfMonitorV2Enabled),
      makeNativeMethod(
        "preparedTextCacheSize",
        JReactNativeFeatureFlagsCxxInterop::preparedTextCacheSize),
      makeNativeMethod(
        "preventShadowTreeCommitExhaustion",
        JReactNativeFeatureFlagsCxxInterop::preventShadowTreeCommitExhaustion),
      makeNativeMethod(
        "redBoxV2Android",
        JReactNativeFeatureFlagsCxxInterop::redBoxV2Android),
      makeNativeMethod(
        "redBoxV2IOS",
        JReactNativeFeatureFlagsCxxInterop::redBoxV2IOS),
      makeNativeMethod(
        "shouldPressibilityUseW3CPointerEventsForHover",
        JReactNativeFeatureFlagsCxxInterop::shouldPressibilityUseW3CPointerEventsForHover),
      makeNativeMethod(
        "shouldTriggerResponderTransferOnScrollAndroid",
        JReactNativeFeatureFlagsCxxInterop::shouldTriggerResponderTransferOnScrollAndroid),
      makeNativeMethod(
        "skipActivityIdentityAssertionOnHostPause",
        JReactNativeFeatureFlagsCxxInterop::skipActivityIdentityAssertionOnHostPause),
      makeNativeMethod(
        "syncAndroidClipBoundsWithOverflow",
        JReactNativeFeatureFlagsCxxInterop::syncAndroidClipBoundsWithOverflow),
      makeNativeMethod(
        "traceTurboModulePromiseRejectionsOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::traceTurboModulePromiseRejectionsOnAndroid),
      makeNativeMethod(
        "updateRuntimeShadowNodeReferencesOnCommit",
        JReactNativeFeatureFlagsCxxInterop::updateRuntimeShadowNodeReferencesOnCommit),
      makeNativeMethod(
        "updateRuntimeShadowNodeReferencesOnCommitThread",
        JReactNativeFeatureFlagsCxxInterop::updateRuntimeShadowNodeReferencesOnCommitThread),
      makeNativeMethod(
        "useAlwaysAvailableJSErrorHandling",
        JReactNativeFeatureFlagsCxxInterop::useAlwaysAvailableJSErrorHandling),
      makeNativeMethod(
        "useFabricInterop",
        JReactNativeFeatureFlagsCxxInterop::useFabricInterop),
      makeNativeMethod(
        "useNativeViewConfigsInBridgelessMode",
        JReactNativeFeatureFlagsCxxInterop::useNativeViewConfigsInBridgelessMode),
      makeNativeMethod(
        "useNestedScrollViewAndroid",
        JReactNativeFeatureFlagsCxxInterop::useNestedScrollViewAndroid),
      makeNativeMethod(
        "useOptimizedViewRegistryOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::useOptimizedViewRegistryOnAndroid),
      makeNativeMethod(
        "useSharedAnimatedBackend",
        JReactNativeFeatureFlagsCxxInterop::useSharedAnimatedBackend),
      makeNativeMethod(
        "useTraitHiddenOnAndroid",
        JReactNativeFeatureFlagsCxxInterop::useTraitHiddenOnAndroid),
      makeNativeMethod(
        "useTurboModuleInterop",
        JReactNativeFeatureFlagsCxxInterop::useTurboModuleInterop),
      makeNativeMethod(
        "viewCullingOutsetRatio",
        JReactNativeFeatureFlagsCxxInterop::viewCullingOutsetRatio),
      makeNativeMethod(
        "viewTransitionEnabled",
        JReactNativeFeatureFlagsCxxInterop::viewTransitionEnabled),
      makeNativeMethod(
        "viewTransitionUseHardwareBitmapAndroid",
        JReactNativeFeatureFlagsCxxInterop::viewTransitionUseHardwareBitmapAndroid),
      makeNativeMethod(
        "virtualViewPrerenderRatio",
        JReactNativeFeatureFlagsCxxInterop::virtualViewPrerenderRatio),
  });
}

} // namespace facebook::react
