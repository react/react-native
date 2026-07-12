/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<5c36c0a5e9e67b43016ab02eab0ecd8f>>
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

public open class ReactNativeFeatureFlagsDefaults : ReactNativeFeatureFlagsProvider {
  // We could use JNI to get the defaults from C++,
  // but that is more expensive than just duplicating the defaults here.

  override fun commonTestFlag(): Boolean = false

  override fun cdpInteractionMetricsEnabled(): Boolean = false

  override fun cxxNativeAnimatedEnabled(): Boolean = false

  override fun defaultTextToOverflowHidden(): Boolean = true

  override fun disableEarlyViewCommandExecution(): Boolean = false

  override fun disableImageViewPreallocationAndroid(): Boolean = false

  override fun disableMountItemReorderingAndroid(): Boolean = false

  override fun disableSubviewClippingAndroid(): Boolean = false

  override fun disableTextLayoutManagerCacheAndroid(): Boolean = false

  override fun disableViewPreallocationAndroid(): Boolean = false

  override fun enableAccessibilityOrder(): Boolean = false

  override fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean = false

  override fun enableAndroidFontWeightAdjustment(): Boolean = true

  override fun enableAndroidTextMeasurementOptimizations(): Boolean = false

  override fun enableBridgelessArchitecture(): Boolean = false

  override fun enableCppPropsIteratorSetter(): Boolean = false

  override fun enableCustomFocusSearchOnClippedElementsAndroid(): Boolean = true

  override fun enableDestroyShadowTreeRevisionAsync(): Boolean = false

  override fun enableDoubleMeasurementFixAndroid(): Boolean = false

  override fun enableEagerRootViewAttachment(): Boolean = false

  override fun enableExclusivePropsUpdateAndroid(): Boolean = false

  override fun enableFabricCommitBranching(): Boolean = false

  override fun enableFabricLogs(): Boolean = false

  override fun enableFlexboxAutoMinSizeInStrictMode(): Boolean = false

  override fun enableFontScaleChangesUpdatingLayout(): Boolean = true

  override fun enableIOSCompressedTextFrameAdjustment(): Boolean = false

  override fun enableIOSTextBaselineOffsetPerLine(): Boolean = false

  override fun enableIOSViewClipToPaddingBox(): Boolean = false

  override fun enableImagePrefetchingAndroid(): Boolean = false

  override fun enableImmediateUpdateModeForContentOffsetChanges(): Boolean = false

  override fun enableImperativeFocus(): Boolean = false

  override fun enableInteropViewManagerClassLookUpOptimizationIOS(): Boolean = false

  override fun enableIntersectionObserverByDefault(): Boolean = false

  override fun enableKeyEvents(): Boolean = false

  override fun enableLayoutAnimationsOnAndroid(): Boolean = false

  override fun enableLayoutAnimationsOnIOS(): Boolean = true

  override fun enableModuleArgumentNSNullConversionIOS(): Boolean = false

  override fun enableMutationObserverByDefault(): Boolean = false

  override fun enableNativeCSSParsing(): Boolean = false

  override fun enableNetworkEventReporting(): Boolean = true

  override fun enablePreparedTextLayout(): Boolean = false

  override fun enablePropsUpdateReconciliationAndroid(): Boolean = false

  override fun enableRuntimeSchedulerQueueClearingOnError(): Boolean = false

  override fun enableSchedulerDelegateInvalidation(): Boolean = false

  override fun enableSwiftUIBasedFilters(): Boolean = false

  override fun enableViewCulling(): Boolean = false

  override fun enableViewRecycling(): Boolean = false

  override fun enableViewRecyclingForImage(): Boolean = true

  override fun enableViewRecyclingForScrollView(): Boolean = false

  override fun enableViewRecyclingForText(): Boolean = true

  override fun enableViewRecyclingForView(): Boolean = true

  override fun enableVirtualViewContainerStateExperimental(): Boolean = false

  override fun fixDifferentiatorParentTagForUnflattenCase(): Boolean = true

  override fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean = false

  override fun fixYogaFlexBasisFitContentInMainAxis(): Boolean = false

  override fun fuseboxAssertSingleHostState(): Boolean = true

  override fun fuseboxEnabledRelease(): Boolean = false

  override fun fuseboxFrameRecordingEnabled(): Boolean = false

  override fun fuseboxNetworkInspectionEnabled(): Boolean = true

  override fun fuseboxScreenshotCaptureEnabled(): Boolean = false

  override fun optimizedAnimatedPropUpdates(): Boolean = false

  override fun overrideBySynchronousMountPropsAtMountingAndroid(): Boolean = true

  override fun perfIssuesEnabled(): Boolean = false

  override fun perfMonitorV2Enabled(): Boolean = false

  override fun preparedTextCacheSize(): Double = 200.0

  override fun preventShadowTreeCommitExhaustion(): Boolean = false

  override fun redBoxV2Android(): Boolean = false

  override fun redBoxV2IOS(): Boolean = false

  override fun shouldPressibilityUseW3CPointerEventsForHover(): Boolean = false

  override fun shouldTriggerResponderTransferOnScrollAndroid(): Boolean = false

  override fun skipActivityIdentityAssertionOnHostPause(): Boolean = false

  override fun syncAndroidClipBoundsWithOverflow(): Boolean = false

  override fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean = false

  override fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean = false

  override fun updateRuntimeShadowNodeReferencesOnCommitThread(): Boolean = false

  override fun useAlwaysAvailableJSErrorHandling(): Boolean = false

  override fun useFabricInterop(): Boolean = true

  override fun useNativeViewConfigsInBridgelessMode(): Boolean = false

  override fun useNestedScrollViewAndroid(): Boolean = false

  override fun useSharedAnimatedBackend(): Boolean = false

  override fun useTraitHiddenOnAndroid(): Boolean = false

  override fun useTurboModuleInterop(): Boolean = false

  override fun viewCullingOutsetRatio(): Double = 0.0

  override fun viewTransitionEnabled(): Boolean = false

  override fun viewTransitionUseHardwareBitmapAndroid(): Boolean = false

  override fun virtualViewPrerenderRatio(): Double = 5.0
}
