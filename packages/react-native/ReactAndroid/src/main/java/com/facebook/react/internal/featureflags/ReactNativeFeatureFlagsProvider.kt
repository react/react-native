/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<b9cfc6790e36d7f7ff0ce9b87edca1e8>>
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

@DoNotStrip
public interface ReactNativeFeatureFlagsProvider {
  @DoNotStrip public fun commonTestFlag(): Boolean

  @DoNotStrip public fun cdpInteractionMetricsEnabled(): Boolean

  @DoNotStrip public fun cxxNativeAnimatedEnabled(): Boolean

  @DoNotStrip public fun defaultTextToOverflowHidden(): Boolean

  @DoNotStrip public fun disableEarlyViewCommandExecution(): Boolean

  @DoNotStrip public fun disableImageViewPreallocationAndroid(): Boolean

  @DoNotStrip public fun disableMountItemReorderingAndroid(): Boolean

  @DoNotStrip public fun disableSubviewClippingAndroid(): Boolean

  @DoNotStrip public fun disableTextLayoutManagerCacheAndroid(): Boolean

  @DoNotStrip public fun disableViewPreallocationAndroid(): Boolean

  @DoNotStrip public fun enableAccessibilityOrder(): Boolean

  @DoNotStrip public fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean

  @DoNotStrip public fun enableAndroidTextMeasurementOptimizations(): Boolean

  @DoNotStrip public fun enableBridgelessArchitecture(): Boolean

  @DoNotStrip public fun enableCppPropsIteratorSetter(): Boolean

  @DoNotStrip public fun enableCustomFocusSearchOnClippedElementsAndroid(): Boolean

  @DoNotStrip public fun enableDestroyShadowTreeRevisionAsync(): Boolean

  @DoNotStrip public fun enableDoubleMeasurementFixAndroid(): Boolean

  @DoNotStrip public fun enableEagerRootViewAttachment(): Boolean

  @DoNotStrip public fun enableExclusivePropsUpdateAndroid(): Boolean

  @DoNotStrip public fun enableFabricCommitBranching(): Boolean

  @DoNotStrip public fun enableFabricLogs(): Boolean

  @DoNotStrip public fun enableFlexboxAutoMinSizeInStrictMode(): Boolean

  @DoNotStrip public fun enableFontScaleChangesUpdatingLayout(): Boolean

  @DoNotStrip public fun enableIOSTextBaselineOffsetPerLine(): Boolean

  @DoNotStrip public fun enableIOSViewClipToPaddingBox(): Boolean

  @DoNotStrip public fun enableImagePrefetchingAndroid(): Boolean

  @DoNotStrip public fun enableImageRequestDowngradingForNonVisibleImages(): Boolean

  @DoNotStrip public fun enableImmediateUpdateModeForContentOffsetChanges(): Boolean

  @DoNotStrip public fun enableImperativeFocus(): Boolean

  @DoNotStrip public fun enableInteropViewManagerClassLookUpOptimizationIOS(): Boolean

  @DoNotStrip public fun enableIntersectionObserverByDefault(): Boolean

  @DoNotStrip public fun enableKeyEvents(): Boolean

  @DoNotStrip public fun enableLayoutAnimationsOnAndroid(): Boolean

  @DoNotStrip public fun enableLayoutAnimationsOnIOS(): Boolean

  @DoNotStrip public fun enableModuleArgumentNSNullConversionIOS(): Boolean

  @DoNotStrip public fun enableMutationObserverByDefault(): Boolean

  @DoNotStrip public fun enableNativeCSSParsing(): Boolean

  @DoNotStrip public fun enableNetworkEventReporting(): Boolean

  @DoNotStrip public fun enablePreparedTextLayout(): Boolean

  @DoNotStrip public fun enablePropsUpdateReconciliationAndroid(): Boolean

  @DoNotStrip public fun enableRuntimeSchedulerQueueClearingOnError(): Boolean

  @DoNotStrip public fun enableSchedulerDelegateInvalidation(): Boolean

  @DoNotStrip public fun enableSwiftUIBasedFilters(): Boolean

  @DoNotStrip public fun enableViewCulling(): Boolean

  @DoNotStrip public fun enableViewRecycling(): Boolean

  @DoNotStrip public fun enableViewRecyclingForImage(): Boolean

  @DoNotStrip public fun enableViewRecyclingForScrollView(): Boolean

  @DoNotStrip public fun enableViewRecyclingForText(): Boolean

  @DoNotStrip public fun enableViewRecyclingForView(): Boolean

  @DoNotStrip public fun enableVirtualViewContainerStateExperimental(): Boolean

  @DoNotStrip public fun fixDifferentiatorParentTagForUnflattenCase(): Boolean

  @DoNotStrip public fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean

  @DoNotStrip public fun fixYogaFlexBasisFitContentInMainAxis(): Boolean

  @DoNotStrip public fun fuseboxAssertSingleHostState(): Boolean

  @DoNotStrip public fun fuseboxEnabledRelease(): Boolean

  @DoNotStrip public fun fuseboxFrameRecordingEnabled(): Boolean

  @DoNotStrip public fun fuseboxNetworkInspectionEnabled(): Boolean

  @DoNotStrip public fun fuseboxScreenshotCaptureEnabled(): Boolean

  @DoNotStrip public fun optimizedAnimatedPropUpdates(): Boolean

  @DoNotStrip public fun overrideBySynchronousMountPropsAtMountingAndroid(): Boolean

  @DoNotStrip public fun perfIssuesEnabled(): Boolean

  @DoNotStrip public fun perfMonitorV2Enabled(): Boolean

  @DoNotStrip public fun preparedTextCacheSize(): Double

  @DoNotStrip public fun preventShadowTreeCommitExhaustion(): Boolean

  @DoNotStrip public fun redBoxV2Android(): Boolean

  @DoNotStrip public fun redBoxV2IOS(): Boolean

  @DoNotStrip public fun shouldPressibilityUseW3CPointerEventsForHover(): Boolean

  @DoNotStrip public fun shouldTriggerResponderTransferOnScrollAndroid(): Boolean

  @DoNotStrip public fun skipActivityIdentityAssertionOnHostPause(): Boolean

  @DoNotStrip public fun syncAndroidClipBoundsWithOverflow(): Boolean

  @DoNotStrip public fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean

  @DoNotStrip public fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean

  @DoNotStrip public fun updateRuntimeShadowNodeReferencesOnCommitThread(): Boolean

  @DoNotStrip public fun useAlwaysAvailableJSErrorHandling(): Boolean

  @DoNotStrip public fun useFabricInterop(): Boolean

  @DoNotStrip public fun useNativeViewConfigsInBridgelessMode(): Boolean

  @DoNotStrip public fun useNestedScrollViewAndroid(): Boolean

  @DoNotStrip public fun useOptimizedViewRegistryOnAndroid(): Boolean

  @DoNotStrip public fun useSharedAnimatedBackend(): Boolean

  @DoNotStrip public fun useTraitHiddenOnAndroid(): Boolean

  @DoNotStrip public fun useTurboModuleInterop(): Boolean

  @DoNotStrip public fun viewCullingOutsetRatio(): Double

  @DoNotStrip public fun viewTransitionEnabled(): Boolean

  @DoNotStrip public fun viewTransitionUseHardwareBitmapAndroid(): Boolean

  @DoNotStrip public fun virtualViewPrerenderRatio(): Double
}
