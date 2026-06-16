/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<8ba7f19e8afe329937b1b36d3b83dbc5>>
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

internal class ReactNativeFeatureFlagsLocalAccessor : ReactNativeFeatureFlagsAccessor {
  private var currentProvider: ReactNativeFeatureFlagsProvider = ReactNativeFeatureFlagsDefaults()

  private val accessedFeatureFlags = mutableSetOf<String>()

  private var commonTestFlagCache: Boolean? = null
  private var cdpInteractionMetricsEnabledCache: Boolean? = null
  private var cxxNativeAnimatedEnabledCache: Boolean? = null
  private var defaultTextToOverflowHiddenCache: Boolean? = null
  private var disableEarlyViewCommandExecutionCache: Boolean? = null
  private var disableImageViewPreallocationAndroidCache: Boolean? = null
  private var disableMountItemReorderingAndroidCache: Boolean? = null
  private var disableSubviewClippingAndroidCache: Boolean? = null
  private var disableTextLayoutManagerCacheAndroidCache: Boolean? = null
  private var disableViewPreallocationAndroidCache: Boolean? = null
  private var enableAccessibilityOrderCache: Boolean? = null
  private var enableAccumulatedUpdatesInRawPropsAndroidCache: Boolean? = null
  private var enableAndroidTextMeasurementOptimizationsCache: Boolean? = null
  private var enableBridgelessArchitectureCache: Boolean? = null
  private var enableCppPropsIteratorSetterCache: Boolean? = null
  private var enableCustomFocusSearchOnClippedElementsAndroidCache: Boolean? = null
  private var enableDestroyShadowTreeRevisionAsyncCache: Boolean? = null
  private var enableDoubleMeasurementFixAndroidCache: Boolean? = null
  private var enableEagerRootViewAttachmentCache: Boolean? = null
  private var enableExclusivePropsUpdateAndroidCache: Boolean? = null
  private var enableFabricCommitBranchingCache: Boolean? = null
  private var enableFabricLogsCache: Boolean? = null
  private var enableFlexboxAutoMinSizeInStrictModeCache: Boolean? = null
  private var enableFontScaleChangesUpdatingLayoutCache: Boolean? = null
  private var enableIOSTextBaselineOffsetPerLineCache: Boolean? = null
  private var enableIOSViewClipToPaddingBoxCache: Boolean? = null
  private var enableImagePrefetchingAndroidCache: Boolean? = null
  private var enableImageRequestDowngradingForNonVisibleImagesCache: Boolean? = null
  private var enableImmediateUpdateModeForContentOffsetChangesCache: Boolean? = null
  private var enableImperativeFocusCache: Boolean? = null
  private var enableInteropViewManagerClassLookUpOptimizationIOSCache: Boolean? = null
  private var enableIntersectionObserverByDefaultCache: Boolean? = null
  private var enableKeyEventsCache: Boolean? = null
  private var enableLayoutAnimationsOnAndroidCache: Boolean? = null
  private var enableLayoutAnimationsOnIOSCache: Boolean? = null
  private var enableModuleArgumentNSNullConversionIOSCache: Boolean? = null
  private var enableMutationObserverByDefaultCache: Boolean? = null
  private var enableNativeCSSParsingCache: Boolean? = null
  private var enableNetworkEventReportingCache: Boolean? = null
  private var enablePreparedTextLayoutCache: Boolean? = null
  private var enablePropsUpdateReconciliationAndroidCache: Boolean? = null
  private var enableRuntimeSchedulerQueueClearingOnErrorCache: Boolean? = null
  private var enableSchedulerDelegateInvalidationCache: Boolean? = null
  private var enableSwiftUIBasedFiltersCache: Boolean? = null
  private var enableViewCullingCache: Boolean? = null
  private var enableViewRecyclingCache: Boolean? = null
  private var enableViewRecyclingForImageCache: Boolean? = null
  private var enableViewRecyclingForScrollViewCache: Boolean? = null
  private var enableViewRecyclingForTextCache: Boolean? = null
  private var enableViewRecyclingForViewCache: Boolean? = null
  private var enableVirtualViewContainerStateExperimentalCache: Boolean? = null
  private var fixDifferentiatorParentTagForUnflattenCaseCache: Boolean? = null
  private var fixMappingOfEventPrioritiesBetweenFabricAndReactCache: Boolean? = null
  private var fixYogaFlexBasisFitContentInMainAxisCache: Boolean? = null
  private var fuseboxAssertSingleHostStateCache: Boolean? = null
  private var fuseboxEnabledReleaseCache: Boolean? = null
  private var fuseboxFrameRecordingEnabledCache: Boolean? = null
  private var fuseboxNetworkInspectionEnabledCache: Boolean? = null
  private var fuseboxScreenshotCaptureEnabledCache: Boolean? = null
  private var hideOffscreenVirtualViewsOnIOSCache: Boolean? = null
  private var optimizedAnimatedPropUpdatesCache: Boolean? = null
  private var overrideBySynchronousMountPropsAtMountingAndroidCache: Boolean? = null
  private var perfIssuesEnabledCache: Boolean? = null
  private var perfMonitorV2EnabledCache: Boolean? = null
  private var preparedTextCacheSizeCache: Double? = null
  private var preventShadowTreeCommitExhaustionCache: Boolean? = null
  private var redBoxV2AndroidCache: Boolean? = null
  private var redBoxV2IOSCache: Boolean? = null
  private var shouldPressibilityUseW3CPointerEventsForHoverCache: Boolean? = null
  private var shouldTriggerResponderTransferOnScrollAndroidCache: Boolean? = null
  private var skipActivityIdentityAssertionOnHostPauseCache: Boolean? = null
  private var syncAndroidClipBoundsWithOverflowCache: Boolean? = null
  private var traceTurboModulePromiseRejectionsOnAndroidCache: Boolean? = null
  private var updateRuntimeShadowNodeReferencesOnCommitCache: Boolean? = null
  private var updateRuntimeShadowNodeReferencesOnCommitThreadCache: Boolean? = null
  private var useAlwaysAvailableJSErrorHandlingCache: Boolean? = null
  private var useFabricInteropCache: Boolean? = null
  private var useNativeViewConfigsInBridgelessModeCache: Boolean? = null
  private var useNestedScrollViewAndroidCache: Boolean? = null
  private var useOptimizedViewRegistryOnAndroidCache: Boolean? = null
  private var useSharedAnimatedBackendCache: Boolean? = null
  private var useTraitHiddenOnAndroidCache: Boolean? = null
  private var useTurboModuleInteropCache: Boolean? = null
  private var viewCullingOutsetRatioCache: Double? = null
  private var viewTransitionEnabledCache: Boolean? = null
  private var viewTransitionUseHardwareBitmapAndroidCache: Boolean? = null
  private var virtualViewPrerenderRatioCache: Double? = null

  override fun commonTestFlag(): Boolean {
    var cached = commonTestFlagCache
    if (cached == null) {
      cached = currentProvider.commonTestFlag()
      accessedFeatureFlags.add("commonTestFlag")
      commonTestFlagCache = cached
    }
    return cached
  }

  override fun cdpInteractionMetricsEnabled(): Boolean {
    var cached = cdpInteractionMetricsEnabledCache
    if (cached == null) {
      cached = currentProvider.cdpInteractionMetricsEnabled()
      accessedFeatureFlags.add("cdpInteractionMetricsEnabled")
      cdpInteractionMetricsEnabledCache = cached
    }
    return cached
  }

  override fun cxxNativeAnimatedEnabled(): Boolean {
    var cached = cxxNativeAnimatedEnabledCache
    if (cached == null) {
      cached = currentProvider.cxxNativeAnimatedEnabled()
      accessedFeatureFlags.add("cxxNativeAnimatedEnabled")
      cxxNativeAnimatedEnabledCache = cached
    }
    return cached
  }

  override fun defaultTextToOverflowHidden(): Boolean {
    var cached = defaultTextToOverflowHiddenCache
    if (cached == null) {
      cached = currentProvider.defaultTextToOverflowHidden()
      accessedFeatureFlags.add("defaultTextToOverflowHidden")
      defaultTextToOverflowHiddenCache = cached
    }
    return cached
  }

  override fun disableEarlyViewCommandExecution(): Boolean {
    var cached = disableEarlyViewCommandExecutionCache
    if (cached == null) {
      cached = currentProvider.disableEarlyViewCommandExecution()
      accessedFeatureFlags.add("disableEarlyViewCommandExecution")
      disableEarlyViewCommandExecutionCache = cached
    }
    return cached
  }

  override fun disableImageViewPreallocationAndroid(): Boolean {
    var cached = disableImageViewPreallocationAndroidCache
    if (cached == null) {
      cached = currentProvider.disableImageViewPreallocationAndroid()
      accessedFeatureFlags.add("disableImageViewPreallocationAndroid")
      disableImageViewPreallocationAndroidCache = cached
    }
    return cached
  }

  override fun disableMountItemReorderingAndroid(): Boolean {
    var cached = disableMountItemReorderingAndroidCache
    if (cached == null) {
      cached = currentProvider.disableMountItemReorderingAndroid()
      accessedFeatureFlags.add("disableMountItemReorderingAndroid")
      disableMountItemReorderingAndroidCache = cached
    }
    return cached
  }

  override fun disableSubviewClippingAndroid(): Boolean {
    var cached = disableSubviewClippingAndroidCache
    if (cached == null) {
      cached = currentProvider.disableSubviewClippingAndroid()
      accessedFeatureFlags.add("disableSubviewClippingAndroid")
      disableSubviewClippingAndroidCache = cached
    }
    return cached
  }

  override fun disableTextLayoutManagerCacheAndroid(): Boolean {
    var cached = disableTextLayoutManagerCacheAndroidCache
    if (cached == null) {
      cached = currentProvider.disableTextLayoutManagerCacheAndroid()
      accessedFeatureFlags.add("disableTextLayoutManagerCacheAndroid")
      disableTextLayoutManagerCacheAndroidCache = cached
    }
    return cached
  }

  override fun disableViewPreallocationAndroid(): Boolean {
    var cached = disableViewPreallocationAndroidCache
    if (cached == null) {
      cached = currentProvider.disableViewPreallocationAndroid()
      accessedFeatureFlags.add("disableViewPreallocationAndroid")
      disableViewPreallocationAndroidCache = cached
    }
    return cached
  }

  override fun enableAccessibilityOrder(): Boolean {
    var cached = enableAccessibilityOrderCache
    if (cached == null) {
      cached = currentProvider.enableAccessibilityOrder()
      accessedFeatureFlags.add("enableAccessibilityOrder")
      enableAccessibilityOrderCache = cached
    }
    return cached
  }

  override fun enableAccumulatedUpdatesInRawPropsAndroid(): Boolean {
    var cached = enableAccumulatedUpdatesInRawPropsAndroidCache
    if (cached == null) {
      cached = currentProvider.enableAccumulatedUpdatesInRawPropsAndroid()
      accessedFeatureFlags.add("enableAccumulatedUpdatesInRawPropsAndroid")
      enableAccumulatedUpdatesInRawPropsAndroidCache = cached
    }
    return cached
  }

  override fun enableAndroidTextMeasurementOptimizations(): Boolean {
    var cached = enableAndroidTextMeasurementOptimizationsCache
    if (cached == null) {
      cached = currentProvider.enableAndroidTextMeasurementOptimizations()
      accessedFeatureFlags.add("enableAndroidTextMeasurementOptimizations")
      enableAndroidTextMeasurementOptimizationsCache = cached
    }
    return cached
  }

  override fun enableBridgelessArchitecture(): Boolean {
    var cached = enableBridgelessArchitectureCache
    if (cached == null) {
      cached = currentProvider.enableBridgelessArchitecture()
      accessedFeatureFlags.add("enableBridgelessArchitecture")
      enableBridgelessArchitectureCache = cached
    }
    return cached
  }

  override fun enableCppPropsIteratorSetter(): Boolean {
    var cached = enableCppPropsIteratorSetterCache
    if (cached == null) {
      cached = currentProvider.enableCppPropsIteratorSetter()
      accessedFeatureFlags.add("enableCppPropsIteratorSetter")
      enableCppPropsIteratorSetterCache = cached
    }
    return cached
  }

  override fun enableCustomFocusSearchOnClippedElementsAndroid(): Boolean {
    var cached = enableCustomFocusSearchOnClippedElementsAndroidCache
    if (cached == null) {
      cached = currentProvider.enableCustomFocusSearchOnClippedElementsAndroid()
      accessedFeatureFlags.add("enableCustomFocusSearchOnClippedElementsAndroid")
      enableCustomFocusSearchOnClippedElementsAndroidCache = cached
    }
    return cached
  }

  override fun enableDestroyShadowTreeRevisionAsync(): Boolean {
    var cached = enableDestroyShadowTreeRevisionAsyncCache
    if (cached == null) {
      cached = currentProvider.enableDestroyShadowTreeRevisionAsync()
      accessedFeatureFlags.add("enableDestroyShadowTreeRevisionAsync")
      enableDestroyShadowTreeRevisionAsyncCache = cached
    }
    return cached
  }

  override fun enableDoubleMeasurementFixAndroid(): Boolean {
    var cached = enableDoubleMeasurementFixAndroidCache
    if (cached == null) {
      cached = currentProvider.enableDoubleMeasurementFixAndroid()
      accessedFeatureFlags.add("enableDoubleMeasurementFixAndroid")
      enableDoubleMeasurementFixAndroidCache = cached
    }
    return cached
  }

  override fun enableEagerRootViewAttachment(): Boolean {
    var cached = enableEagerRootViewAttachmentCache
    if (cached == null) {
      cached = currentProvider.enableEagerRootViewAttachment()
      accessedFeatureFlags.add("enableEagerRootViewAttachment")
      enableEagerRootViewAttachmentCache = cached
    }
    return cached
  }

  override fun enableExclusivePropsUpdateAndroid(): Boolean {
    var cached = enableExclusivePropsUpdateAndroidCache
    if (cached == null) {
      cached = currentProvider.enableExclusivePropsUpdateAndroid()
      accessedFeatureFlags.add("enableExclusivePropsUpdateAndroid")
      enableExclusivePropsUpdateAndroidCache = cached
    }
    return cached
  }

  override fun enableFabricCommitBranching(): Boolean {
    var cached = enableFabricCommitBranchingCache
    if (cached == null) {
      cached = currentProvider.enableFabricCommitBranching()
      accessedFeatureFlags.add("enableFabricCommitBranching")
      enableFabricCommitBranchingCache = cached
    }
    return cached
  }

  override fun enableFabricLogs(): Boolean {
    var cached = enableFabricLogsCache
    if (cached == null) {
      cached = currentProvider.enableFabricLogs()
      accessedFeatureFlags.add("enableFabricLogs")
      enableFabricLogsCache = cached
    }
    return cached
  }

  override fun enableFlexboxAutoMinSizeInStrictMode(): Boolean {
    var cached = enableFlexboxAutoMinSizeInStrictModeCache
    if (cached == null) {
      cached = currentProvider.enableFlexboxAutoMinSizeInStrictMode()
      accessedFeatureFlags.add("enableFlexboxAutoMinSizeInStrictMode")
      enableFlexboxAutoMinSizeInStrictModeCache = cached
    }
    return cached
  }

  override fun enableFontScaleChangesUpdatingLayout(): Boolean {
    var cached = enableFontScaleChangesUpdatingLayoutCache
    if (cached == null) {
      cached = currentProvider.enableFontScaleChangesUpdatingLayout()
      accessedFeatureFlags.add("enableFontScaleChangesUpdatingLayout")
      enableFontScaleChangesUpdatingLayoutCache = cached
    }
    return cached
  }

  override fun enableIOSTextBaselineOffsetPerLine(): Boolean {
    var cached = enableIOSTextBaselineOffsetPerLineCache
    if (cached == null) {
      cached = currentProvider.enableIOSTextBaselineOffsetPerLine()
      accessedFeatureFlags.add("enableIOSTextBaselineOffsetPerLine")
      enableIOSTextBaselineOffsetPerLineCache = cached
    }
    return cached
  }

  override fun enableIOSViewClipToPaddingBox(): Boolean {
    var cached = enableIOSViewClipToPaddingBoxCache
    if (cached == null) {
      cached = currentProvider.enableIOSViewClipToPaddingBox()
      accessedFeatureFlags.add("enableIOSViewClipToPaddingBox")
      enableIOSViewClipToPaddingBoxCache = cached
    }
    return cached
  }

  override fun enableImagePrefetchingAndroid(): Boolean {
    var cached = enableImagePrefetchingAndroidCache
    if (cached == null) {
      cached = currentProvider.enableImagePrefetchingAndroid()
      accessedFeatureFlags.add("enableImagePrefetchingAndroid")
      enableImagePrefetchingAndroidCache = cached
    }
    return cached
  }

  override fun enableImageRequestDowngradingForNonVisibleImages(): Boolean {
    var cached = enableImageRequestDowngradingForNonVisibleImagesCache
    if (cached == null) {
      cached = currentProvider.enableImageRequestDowngradingForNonVisibleImages()
      accessedFeatureFlags.add("enableImageRequestDowngradingForNonVisibleImages")
      enableImageRequestDowngradingForNonVisibleImagesCache = cached
    }
    return cached
  }

  override fun enableImmediateUpdateModeForContentOffsetChanges(): Boolean {
    var cached = enableImmediateUpdateModeForContentOffsetChangesCache
    if (cached == null) {
      cached = currentProvider.enableImmediateUpdateModeForContentOffsetChanges()
      accessedFeatureFlags.add("enableImmediateUpdateModeForContentOffsetChanges")
      enableImmediateUpdateModeForContentOffsetChangesCache = cached
    }
    return cached
  }

  override fun enableImperativeFocus(): Boolean {
    var cached = enableImperativeFocusCache
    if (cached == null) {
      cached = currentProvider.enableImperativeFocus()
      accessedFeatureFlags.add("enableImperativeFocus")
      enableImperativeFocusCache = cached
    }
    return cached
  }

  override fun enableInteropViewManagerClassLookUpOptimizationIOS(): Boolean {
    var cached = enableInteropViewManagerClassLookUpOptimizationIOSCache
    if (cached == null) {
      cached = currentProvider.enableInteropViewManagerClassLookUpOptimizationIOS()
      accessedFeatureFlags.add("enableInteropViewManagerClassLookUpOptimizationIOS")
      enableInteropViewManagerClassLookUpOptimizationIOSCache = cached
    }
    return cached
  }

  override fun enableIntersectionObserverByDefault(): Boolean {
    var cached = enableIntersectionObserverByDefaultCache
    if (cached == null) {
      cached = currentProvider.enableIntersectionObserverByDefault()
      accessedFeatureFlags.add("enableIntersectionObserverByDefault")
      enableIntersectionObserverByDefaultCache = cached
    }
    return cached
  }

  override fun enableKeyEvents(): Boolean {
    var cached = enableKeyEventsCache
    if (cached == null) {
      cached = currentProvider.enableKeyEvents()
      accessedFeatureFlags.add("enableKeyEvents")
      enableKeyEventsCache = cached
    }
    return cached
  }

  override fun enableLayoutAnimationsOnAndroid(): Boolean {
    var cached = enableLayoutAnimationsOnAndroidCache
    if (cached == null) {
      cached = currentProvider.enableLayoutAnimationsOnAndroid()
      accessedFeatureFlags.add("enableLayoutAnimationsOnAndroid")
      enableLayoutAnimationsOnAndroidCache = cached
    }
    return cached
  }

  override fun enableLayoutAnimationsOnIOS(): Boolean {
    var cached = enableLayoutAnimationsOnIOSCache
    if (cached == null) {
      cached = currentProvider.enableLayoutAnimationsOnIOS()
      accessedFeatureFlags.add("enableLayoutAnimationsOnIOS")
      enableLayoutAnimationsOnIOSCache = cached
    }
    return cached
  }

  override fun enableModuleArgumentNSNullConversionIOS(): Boolean {
    var cached = enableModuleArgumentNSNullConversionIOSCache
    if (cached == null) {
      cached = currentProvider.enableModuleArgumentNSNullConversionIOS()
      accessedFeatureFlags.add("enableModuleArgumentNSNullConversionIOS")
      enableModuleArgumentNSNullConversionIOSCache = cached
    }
    return cached
  }

  override fun enableMutationObserverByDefault(): Boolean {
    var cached = enableMutationObserverByDefaultCache
    if (cached == null) {
      cached = currentProvider.enableMutationObserverByDefault()
      accessedFeatureFlags.add("enableMutationObserverByDefault")
      enableMutationObserverByDefaultCache = cached
    }
    return cached
  }

  override fun enableNativeCSSParsing(): Boolean {
    var cached = enableNativeCSSParsingCache
    if (cached == null) {
      cached = currentProvider.enableNativeCSSParsing()
      accessedFeatureFlags.add("enableNativeCSSParsing")
      enableNativeCSSParsingCache = cached
    }
    return cached
  }

  override fun enableNetworkEventReporting(): Boolean {
    var cached = enableNetworkEventReportingCache
    if (cached == null) {
      cached = currentProvider.enableNetworkEventReporting()
      accessedFeatureFlags.add("enableNetworkEventReporting")
      enableNetworkEventReportingCache = cached
    }
    return cached
  }

  override fun enablePreparedTextLayout(): Boolean {
    var cached = enablePreparedTextLayoutCache
    if (cached == null) {
      cached = currentProvider.enablePreparedTextLayout()
      accessedFeatureFlags.add("enablePreparedTextLayout")
      enablePreparedTextLayoutCache = cached
    }
    return cached
  }

  override fun enablePropsUpdateReconciliationAndroid(): Boolean {
    var cached = enablePropsUpdateReconciliationAndroidCache
    if (cached == null) {
      cached = currentProvider.enablePropsUpdateReconciliationAndroid()
      accessedFeatureFlags.add("enablePropsUpdateReconciliationAndroid")
      enablePropsUpdateReconciliationAndroidCache = cached
    }
    return cached
  }

  override fun enableRuntimeSchedulerQueueClearingOnError(): Boolean {
    var cached = enableRuntimeSchedulerQueueClearingOnErrorCache
    if (cached == null) {
      cached = currentProvider.enableRuntimeSchedulerQueueClearingOnError()
      accessedFeatureFlags.add("enableRuntimeSchedulerQueueClearingOnError")
      enableRuntimeSchedulerQueueClearingOnErrorCache = cached
    }
    return cached
  }

  override fun enableSchedulerDelegateInvalidation(): Boolean {
    var cached = enableSchedulerDelegateInvalidationCache
    if (cached == null) {
      cached = currentProvider.enableSchedulerDelegateInvalidation()
      accessedFeatureFlags.add("enableSchedulerDelegateInvalidation")
      enableSchedulerDelegateInvalidationCache = cached
    }
    return cached
  }

  override fun enableSwiftUIBasedFilters(): Boolean {
    var cached = enableSwiftUIBasedFiltersCache
    if (cached == null) {
      cached = currentProvider.enableSwiftUIBasedFilters()
      accessedFeatureFlags.add("enableSwiftUIBasedFilters")
      enableSwiftUIBasedFiltersCache = cached
    }
    return cached
  }

  override fun enableViewCulling(): Boolean {
    var cached = enableViewCullingCache
    if (cached == null) {
      cached = currentProvider.enableViewCulling()
      accessedFeatureFlags.add("enableViewCulling")
      enableViewCullingCache = cached
    }
    return cached
  }

  override fun enableViewRecycling(): Boolean {
    var cached = enableViewRecyclingCache
    if (cached == null) {
      cached = currentProvider.enableViewRecycling()
      accessedFeatureFlags.add("enableViewRecycling")
      enableViewRecyclingCache = cached
    }
    return cached
  }

  override fun enableViewRecyclingForImage(): Boolean {
    var cached = enableViewRecyclingForImageCache
    if (cached == null) {
      cached = currentProvider.enableViewRecyclingForImage()
      accessedFeatureFlags.add("enableViewRecyclingForImage")
      enableViewRecyclingForImageCache = cached
    }
    return cached
  }

  override fun enableViewRecyclingForScrollView(): Boolean {
    var cached = enableViewRecyclingForScrollViewCache
    if (cached == null) {
      cached = currentProvider.enableViewRecyclingForScrollView()
      accessedFeatureFlags.add("enableViewRecyclingForScrollView")
      enableViewRecyclingForScrollViewCache = cached
    }
    return cached
  }

  override fun enableViewRecyclingForText(): Boolean {
    var cached = enableViewRecyclingForTextCache
    if (cached == null) {
      cached = currentProvider.enableViewRecyclingForText()
      accessedFeatureFlags.add("enableViewRecyclingForText")
      enableViewRecyclingForTextCache = cached
    }
    return cached
  }

  override fun enableViewRecyclingForView(): Boolean {
    var cached = enableViewRecyclingForViewCache
    if (cached == null) {
      cached = currentProvider.enableViewRecyclingForView()
      accessedFeatureFlags.add("enableViewRecyclingForView")
      enableViewRecyclingForViewCache = cached
    }
    return cached
  }

  override fun enableVirtualViewContainerStateExperimental(): Boolean {
    var cached = enableVirtualViewContainerStateExperimentalCache
    if (cached == null) {
      cached = currentProvider.enableVirtualViewContainerStateExperimental()
      accessedFeatureFlags.add("enableVirtualViewContainerStateExperimental")
      enableVirtualViewContainerStateExperimentalCache = cached
    }
    return cached
  }

  override fun fixDifferentiatorParentTagForUnflattenCase(): Boolean {
    var cached = fixDifferentiatorParentTagForUnflattenCaseCache
    if (cached == null) {
      cached = currentProvider.fixDifferentiatorParentTagForUnflattenCase()
      accessedFeatureFlags.add("fixDifferentiatorParentTagForUnflattenCase")
      fixDifferentiatorParentTagForUnflattenCaseCache = cached
    }
    return cached
  }

  override fun fixMappingOfEventPrioritiesBetweenFabricAndReact(): Boolean {
    var cached = fixMappingOfEventPrioritiesBetweenFabricAndReactCache
    if (cached == null) {
      cached = currentProvider.fixMappingOfEventPrioritiesBetweenFabricAndReact()
      accessedFeatureFlags.add("fixMappingOfEventPrioritiesBetweenFabricAndReact")
      fixMappingOfEventPrioritiesBetweenFabricAndReactCache = cached
    }
    return cached
  }

  override fun fixYogaFlexBasisFitContentInMainAxis(): Boolean {
    var cached = fixYogaFlexBasisFitContentInMainAxisCache
    if (cached == null) {
      cached = currentProvider.fixYogaFlexBasisFitContentInMainAxis()
      accessedFeatureFlags.add("fixYogaFlexBasisFitContentInMainAxis")
      fixYogaFlexBasisFitContentInMainAxisCache = cached
    }
    return cached
  }

  override fun fuseboxAssertSingleHostState(): Boolean {
    var cached = fuseboxAssertSingleHostStateCache
    if (cached == null) {
      cached = currentProvider.fuseboxAssertSingleHostState()
      accessedFeatureFlags.add("fuseboxAssertSingleHostState")
      fuseboxAssertSingleHostStateCache = cached
    }
    return cached
  }

  override fun fuseboxEnabledRelease(): Boolean {
    var cached = fuseboxEnabledReleaseCache
    if (cached == null) {
      cached = currentProvider.fuseboxEnabledRelease()
      accessedFeatureFlags.add("fuseboxEnabledRelease")
      fuseboxEnabledReleaseCache = cached
    }
    return cached
  }

  override fun fuseboxFrameRecordingEnabled(): Boolean {
    var cached = fuseboxFrameRecordingEnabledCache
    if (cached == null) {
      cached = currentProvider.fuseboxFrameRecordingEnabled()
      accessedFeatureFlags.add("fuseboxFrameRecordingEnabled")
      fuseboxFrameRecordingEnabledCache = cached
    }
    return cached
  }

  override fun fuseboxNetworkInspectionEnabled(): Boolean {
    var cached = fuseboxNetworkInspectionEnabledCache
    if (cached == null) {
      cached = currentProvider.fuseboxNetworkInspectionEnabled()
      accessedFeatureFlags.add("fuseboxNetworkInspectionEnabled")
      fuseboxNetworkInspectionEnabledCache = cached
    }
    return cached
  }

  override fun fuseboxScreenshotCaptureEnabled(): Boolean {
    var cached = fuseboxScreenshotCaptureEnabledCache
    if (cached == null) {
      cached = currentProvider.fuseboxScreenshotCaptureEnabled()
      accessedFeatureFlags.add("fuseboxScreenshotCaptureEnabled")
      fuseboxScreenshotCaptureEnabledCache = cached
    }
    return cached
  }

  override fun hideOffscreenVirtualViewsOnIOS(): Boolean {
    var cached = hideOffscreenVirtualViewsOnIOSCache
    if (cached == null) {
      cached = currentProvider.hideOffscreenVirtualViewsOnIOS()
      accessedFeatureFlags.add("hideOffscreenVirtualViewsOnIOS")
      hideOffscreenVirtualViewsOnIOSCache = cached
    }
    return cached
  }

  override fun optimizedAnimatedPropUpdates(): Boolean {
    var cached = optimizedAnimatedPropUpdatesCache
    if (cached == null) {
      cached = currentProvider.optimizedAnimatedPropUpdates()
      accessedFeatureFlags.add("optimizedAnimatedPropUpdates")
      optimizedAnimatedPropUpdatesCache = cached
    }
    return cached
  }

  override fun overrideBySynchronousMountPropsAtMountingAndroid(): Boolean {
    var cached = overrideBySynchronousMountPropsAtMountingAndroidCache
    if (cached == null) {
      cached = currentProvider.overrideBySynchronousMountPropsAtMountingAndroid()
      accessedFeatureFlags.add("overrideBySynchronousMountPropsAtMountingAndroid")
      overrideBySynchronousMountPropsAtMountingAndroidCache = cached
    }
    return cached
  }

  override fun perfIssuesEnabled(): Boolean {
    var cached = perfIssuesEnabledCache
    if (cached == null) {
      cached = currentProvider.perfIssuesEnabled()
      accessedFeatureFlags.add("perfIssuesEnabled")
      perfIssuesEnabledCache = cached
    }
    return cached
  }

  override fun perfMonitorV2Enabled(): Boolean {
    var cached = perfMonitorV2EnabledCache
    if (cached == null) {
      cached = currentProvider.perfMonitorV2Enabled()
      accessedFeatureFlags.add("perfMonitorV2Enabled")
      perfMonitorV2EnabledCache = cached
    }
    return cached
  }

  override fun preparedTextCacheSize(): Double {
    var cached = preparedTextCacheSizeCache
    if (cached == null) {
      cached = currentProvider.preparedTextCacheSize()
      accessedFeatureFlags.add("preparedTextCacheSize")
      preparedTextCacheSizeCache = cached
    }
    return cached
  }

  override fun preventShadowTreeCommitExhaustion(): Boolean {
    var cached = preventShadowTreeCommitExhaustionCache
    if (cached == null) {
      cached = currentProvider.preventShadowTreeCommitExhaustion()
      accessedFeatureFlags.add("preventShadowTreeCommitExhaustion")
      preventShadowTreeCommitExhaustionCache = cached
    }
    return cached
  }

  override fun redBoxV2Android(): Boolean {
    var cached = redBoxV2AndroidCache
    if (cached == null) {
      cached = currentProvider.redBoxV2Android()
      accessedFeatureFlags.add("redBoxV2Android")
      redBoxV2AndroidCache = cached
    }
    return cached
  }

  override fun redBoxV2IOS(): Boolean {
    var cached = redBoxV2IOSCache
    if (cached == null) {
      cached = currentProvider.redBoxV2IOS()
      accessedFeatureFlags.add("redBoxV2IOS")
      redBoxV2IOSCache = cached
    }
    return cached
  }

  override fun shouldPressibilityUseW3CPointerEventsForHover(): Boolean {
    var cached = shouldPressibilityUseW3CPointerEventsForHoverCache
    if (cached == null) {
      cached = currentProvider.shouldPressibilityUseW3CPointerEventsForHover()
      accessedFeatureFlags.add("shouldPressibilityUseW3CPointerEventsForHover")
      shouldPressibilityUseW3CPointerEventsForHoverCache = cached
    }
    return cached
  }

  override fun shouldTriggerResponderTransferOnScrollAndroid(): Boolean {
    var cached = shouldTriggerResponderTransferOnScrollAndroidCache
    if (cached == null) {
      cached = currentProvider.shouldTriggerResponderTransferOnScrollAndroid()
      accessedFeatureFlags.add("shouldTriggerResponderTransferOnScrollAndroid")
      shouldTriggerResponderTransferOnScrollAndroidCache = cached
    }
    return cached
  }

  override fun skipActivityIdentityAssertionOnHostPause(): Boolean {
    var cached = skipActivityIdentityAssertionOnHostPauseCache
    if (cached == null) {
      cached = currentProvider.skipActivityIdentityAssertionOnHostPause()
      accessedFeatureFlags.add("skipActivityIdentityAssertionOnHostPause")
      skipActivityIdentityAssertionOnHostPauseCache = cached
    }
    return cached
  }

  override fun syncAndroidClipBoundsWithOverflow(): Boolean {
    var cached = syncAndroidClipBoundsWithOverflowCache
    if (cached == null) {
      cached = currentProvider.syncAndroidClipBoundsWithOverflow()
      accessedFeatureFlags.add("syncAndroidClipBoundsWithOverflow")
      syncAndroidClipBoundsWithOverflowCache = cached
    }
    return cached
  }

  override fun traceTurboModulePromiseRejectionsOnAndroid(): Boolean {
    var cached = traceTurboModulePromiseRejectionsOnAndroidCache
    if (cached == null) {
      cached = currentProvider.traceTurboModulePromiseRejectionsOnAndroid()
      accessedFeatureFlags.add("traceTurboModulePromiseRejectionsOnAndroid")
      traceTurboModulePromiseRejectionsOnAndroidCache = cached
    }
    return cached
  }

  override fun updateRuntimeShadowNodeReferencesOnCommit(): Boolean {
    var cached = updateRuntimeShadowNodeReferencesOnCommitCache
    if (cached == null) {
      cached = currentProvider.updateRuntimeShadowNodeReferencesOnCommit()
      accessedFeatureFlags.add("updateRuntimeShadowNodeReferencesOnCommit")
      updateRuntimeShadowNodeReferencesOnCommitCache = cached
    }
    return cached
  }

  override fun updateRuntimeShadowNodeReferencesOnCommitThread(): Boolean {
    var cached = updateRuntimeShadowNodeReferencesOnCommitThreadCache
    if (cached == null) {
      cached = currentProvider.updateRuntimeShadowNodeReferencesOnCommitThread()
      accessedFeatureFlags.add("updateRuntimeShadowNodeReferencesOnCommitThread")
      updateRuntimeShadowNodeReferencesOnCommitThreadCache = cached
    }
    return cached
  }

  override fun useAlwaysAvailableJSErrorHandling(): Boolean {
    var cached = useAlwaysAvailableJSErrorHandlingCache
    if (cached == null) {
      cached = currentProvider.useAlwaysAvailableJSErrorHandling()
      accessedFeatureFlags.add("useAlwaysAvailableJSErrorHandling")
      useAlwaysAvailableJSErrorHandlingCache = cached
    }
    return cached
  }

  override fun useFabricInterop(): Boolean {
    var cached = useFabricInteropCache
    if (cached == null) {
      cached = currentProvider.useFabricInterop()
      accessedFeatureFlags.add("useFabricInterop")
      useFabricInteropCache = cached
    }
    return cached
  }

  override fun useNativeViewConfigsInBridgelessMode(): Boolean {
    var cached = useNativeViewConfigsInBridgelessModeCache
    if (cached == null) {
      cached = currentProvider.useNativeViewConfigsInBridgelessMode()
      accessedFeatureFlags.add("useNativeViewConfigsInBridgelessMode")
      useNativeViewConfigsInBridgelessModeCache = cached
    }
    return cached
  }

  override fun useNestedScrollViewAndroid(): Boolean {
    var cached = useNestedScrollViewAndroidCache
    if (cached == null) {
      cached = currentProvider.useNestedScrollViewAndroid()
      accessedFeatureFlags.add("useNestedScrollViewAndroid")
      useNestedScrollViewAndroidCache = cached
    }
    return cached
  }

  override fun useOptimizedViewRegistryOnAndroid(): Boolean {
    var cached = useOptimizedViewRegistryOnAndroidCache
    if (cached == null) {
      cached = currentProvider.useOptimizedViewRegistryOnAndroid()
      accessedFeatureFlags.add("useOptimizedViewRegistryOnAndroid")
      useOptimizedViewRegistryOnAndroidCache = cached
    }
    return cached
  }

  override fun useSharedAnimatedBackend(): Boolean {
    var cached = useSharedAnimatedBackendCache
    if (cached == null) {
      cached = currentProvider.useSharedAnimatedBackend()
      accessedFeatureFlags.add("useSharedAnimatedBackend")
      useSharedAnimatedBackendCache = cached
    }
    return cached
  }

  override fun useTraitHiddenOnAndroid(): Boolean {
    var cached = useTraitHiddenOnAndroidCache
    if (cached == null) {
      cached = currentProvider.useTraitHiddenOnAndroid()
      accessedFeatureFlags.add("useTraitHiddenOnAndroid")
      useTraitHiddenOnAndroidCache = cached
    }
    return cached
  }

  override fun useTurboModuleInterop(): Boolean {
    var cached = useTurboModuleInteropCache
    if (cached == null) {
      cached = currentProvider.useTurboModuleInterop()
      accessedFeatureFlags.add("useTurboModuleInterop")
      useTurboModuleInteropCache = cached
    }
    return cached
  }

  override fun viewCullingOutsetRatio(): Double {
    var cached = viewCullingOutsetRatioCache
    if (cached == null) {
      cached = currentProvider.viewCullingOutsetRatio()
      accessedFeatureFlags.add("viewCullingOutsetRatio")
      viewCullingOutsetRatioCache = cached
    }
    return cached
  }

  override fun viewTransitionEnabled(): Boolean {
    var cached = viewTransitionEnabledCache
    if (cached == null) {
      cached = currentProvider.viewTransitionEnabled()
      accessedFeatureFlags.add("viewTransitionEnabled")
      viewTransitionEnabledCache = cached
    }
    return cached
  }

  override fun viewTransitionUseHardwareBitmapAndroid(): Boolean {
    var cached = viewTransitionUseHardwareBitmapAndroidCache
    if (cached == null) {
      cached = currentProvider.viewTransitionUseHardwareBitmapAndroid()
      accessedFeatureFlags.add("viewTransitionUseHardwareBitmapAndroid")
      viewTransitionUseHardwareBitmapAndroidCache = cached
    }
    return cached
  }

  override fun virtualViewPrerenderRatio(): Double {
    var cached = virtualViewPrerenderRatioCache
    if (cached == null) {
      cached = currentProvider.virtualViewPrerenderRatio()
      accessedFeatureFlags.add("virtualViewPrerenderRatio")
      virtualViewPrerenderRatioCache = cached
    }
    return cached
  }

  override fun override(provider: ReactNativeFeatureFlagsProvider) {
    if (accessedFeatureFlags.isNotEmpty()) {
      val accessedFeatureFlagsStr = accessedFeatureFlags.joinToString(separator = ", ") { it }
      throw IllegalStateException(
          "Feature flags were accessed before being overridden: $accessedFeatureFlagsStr")
    }
    currentProvider = provider
  }

  override fun dangerouslyReset() {
    // We don't need to do anything else here because `ReactNativeFeatureFlags` will just create a
    // new instance of this class.
  }

  override fun dangerouslyForceOverride(provider: ReactNativeFeatureFlagsProvider): String? {
    val accessedFeatureFlags = getAccessedFeatureFlags()
    currentProvider = provider
    return accessedFeatureFlags
  }

  internal fun getAccessedFeatureFlags(): String? {
    if (accessedFeatureFlags.isEmpty()) {
      return null
    }

    return accessedFeatureFlags.joinToString(separator = ", ") { it }
  }
}
