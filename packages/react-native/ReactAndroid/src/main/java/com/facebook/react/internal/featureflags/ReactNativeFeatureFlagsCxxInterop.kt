/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<6dc403c11108a657d48ec9573bee842f>>
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

package com.facebook.react.internal.featureflags

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader

@DoNotStrip
public object ReactNativeFeatureFlagsCxxInterop {
  init {
    SoLoader.loadLibrary("react_featureflagsjni")
  }

  @DoNotStrip @JvmStatic public external fun commonTestFlag(): Boolean

  @DoNotStrip @JvmStatic public external fun cdpInteractionMetricsEnabled(): Boolean

  @DoNotStrip @JvmStatic public external fun cxxNativeAnimatedEnabled(): Boolean

  @DoNotStrip @JvmStatic public external fun defaultTextToOverflowHidden(): Boolean

  @DoNotStrip @JvmStatic public external fun disableEarlyViewCommandExecution(): Boolean

  @DoNotStrip @JvmStatic public external fun disableImageViewPreallocationAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun disableMountItemReorderingAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun disableSubviewClippingAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun disableTextLayoutManagerCacheAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun disableViewPreallocationAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableAccessibilityOrder(): Boolean

  @DoNotStrip @JvmStatic public external fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableAndroidTextMeasurementOptimizations(): Boolean

  @DoNotStrip @JvmStatic public external fun enableBridgelessArchitecture(): Boolean

  @DoNotStrip @JvmStatic public external fun enableCppPropsIteratorSetter(): Boolean

  @DoNotStrip @JvmStatic public external fun enableCustomFocusSearchOnClippedElementsAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableDestroyShadowTreeRevisionAsync(): Boolean

  @DoNotStrip @JvmStatic public external fun enableDoubleMeasurementFixAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableEagerRootViewAttachment(): Boolean

  @DoNotStrip @JvmStatic public external fun enableExclusivePropsUpdateAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFabricCommitBranching(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFabricLogs(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFlexboxAutoMinSizeInStrictMode(): Boolean

  @DoNotStrip @JvmStatic public external fun enableFontScaleChangesUpdatingLayout(): Boolean

  @DoNotStrip @JvmStatic public external fun enableIOSTextBaselineOffsetPerLine(): Boolean

  @DoNotStrip @JvmStatic public external fun enableIOSViewClipToPaddingBox(): Boolean

  @DoNotStrip @JvmStatic public external fun enableImagePrefetchingAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableImageRequestDowngradingForNonVisibleImages(): Boolean

  @DoNotStrip @JvmStatic public external fun enableImmediateUpdateModeForContentOffsetChanges(): Boolean

  @DoNotStrip @JvmStatic public external fun enableImperativeFocus(): Boolean

  @DoNotStrip @JvmStatic public external fun enableInteropViewManagerClassLookUpOptimizationIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableIntersectionObserverByDefault(): Boolean

  @DoNotStrip @JvmStatic public external fun enableKeyEvents(): Boolean

  @DoNotStrip @JvmStatic public external fun enableLayoutAnimationsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableLayoutAnimationsOnIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableModuleArgumentNSNullConversionIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun enableMutationObserverByDefault(): Boolean

  @DoNotStrip @JvmStatic public external fun enableNativeCSSParsing(): Boolean

  @DoNotStrip @JvmStatic public external fun enableNetworkEventReporting(): Boolean

  @DoNotStrip @JvmStatic public external fun enablePreparedTextLayout(): Boolean

  @DoNotStrip @JvmStatic public external fun enablePropsUpdateReconciliationAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun enableRuntimeSchedulerQueueClearingOnError(): Boolean

  @DoNotStrip @JvmStatic public external fun enableSchedulerDelegateInvalidation(): Boolean

  @DoNotStrip @JvmStatic public external fun enableSwiftUIBasedFilters(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewCulling(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecycling(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecyclingForImage(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecyclingForScrollView(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecyclingForText(): Boolean

  @DoNotStrip @JvmStatic public external fun enableViewRecyclingForView(): Boolean

  @DoNotStrip @JvmStatic public external fun enableVirtualViewContainerStateExperimental(): Boolean

  @DoNotStrip @JvmStatic public external fun fixDifferentiatorParentTagForUnflattenCase(): Boolean

  @DoNotStrip @JvmStatic public external fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean

  @DoNotStrip @JvmStatic public external fun fixYogaFlexBasisFitContentInMainAxis(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxAssertSingleHostState(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxEnabledRelease(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxFrameRecordingEnabled(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxNetworkInspectionEnabled(): Boolean

  @DoNotStrip @JvmStatic public external fun fuseboxScreenshotCaptureEnabled(): Boolean

  @DoNotStrip @JvmStatic public external fun hideOffscreenVirtualViewsOnIOS(): Boolean

  @DoNotStrip @JvmStatic public external fun optimizedAnimatedPropUpdates(): Boolean

  @DoNotStrip @JvmStatic public external fun overrideBySynchronousMountPropsAtMountingAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun perfIssuesEnabled(): Boolean

  @DoNotStrip @JvmStatic public external fun perfMonitorV2Enabled(): Boolean

  @DoNotStrip @JvmStatic public external fun preparedTextCacheSize(): Double

  @DoNotStrip @JvmStatic public external fun preventShadowTreeCommitExhaustion(): Boolean

  @DoNotStrip @JvmStatic public external fun redBoxV2Android(): Boolean

  @DoNotStrip @JvmStatic public external fun redBoxV2IOS(): Boolean

  @DoNotStrip @JvmStatic public external fun shouldPressibilityUseW3CPointerEventsForHover(): Boolean

  @DoNotStrip @JvmStatic public external fun shouldTriggerResponderTransferOnScrollAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun skipActivityIdentityAssertionOnHostPause(): Boolean

  @DoNotStrip @JvmStatic public external fun syncAndroidClipBoundsWithOverflow(): Boolean

  @DoNotStrip @JvmStatic public external fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean

  @DoNotStrip @JvmStatic public external fun updateRuntimeShadowNodeReferencesOnCommitThread(): Boolean

  @DoNotStrip @JvmStatic public external fun useAlwaysAvailableJSErrorHandling(): Boolean

  @DoNotStrip @JvmStatic public external fun useFabricInterop(): Boolean

  @DoNotStrip @JvmStatic public external fun useNativeViewConfigsInBridgelessMode(): Boolean

  @DoNotStrip @JvmStatic public external fun useNestedScrollViewAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun useOptimizedViewRegistryOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun useSharedAnimatedBackend(): Boolean

  @DoNotStrip @JvmStatic public external fun useTraitHiddenOnAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun useTurboModuleInterop(): Boolean

  @DoNotStrip @JvmStatic public external fun viewCullingOutsetRatio(): Double

  @DoNotStrip @JvmStatic public external fun viewTransitionEnabled(): Boolean

  @DoNotStrip @JvmStatic public external fun viewTransitionUseHardwareBitmapAndroid(): Boolean

  @DoNotStrip @JvmStatic public external fun virtualViewPrerenderRatio(): Double

  @DoNotStrip @JvmStatic public external fun override(provider: Any)

  @DoNotStrip @JvmStatic public external fun dangerouslyReset()

  @DoNotStrip @JvmStatic public external fun dangerouslyForceOverride(provider: Any): String?
}
