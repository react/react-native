/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<3f5bd11c861fc2e02627ba0f9941f4b7>>
 * @flow strict
 * @noformat
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

import {
  type Getter,
  type OverridesFor,
  createJavaScriptFlagGetter,
  createNativeFlagGetter,
  setOverrides,
} from './ReactNativeFeatureFlagsBase';

export type ReactNativeFeatureFlagsJsOnly = $ReadOnly<{
  jsOnlyTestFlag: Getter<boolean>,
  animatedShouldDebounceQueueFlush: Getter<boolean>,
  animatedShouldUseSingleOp: Getter<boolean>,
  deferFlatListFocusChangeRenderUpdate: Getter<boolean>,
  disableMaintainVisibleContentPosition: Getter<boolean>,
  externalElementInspectionEnabled: Getter<boolean>,
  fixVirtualizeListCollapseWindowSize: Getter<boolean>,
  isLayoutAnimationEnabled: Getter<boolean>,
  shouldUseAnimatedObjectForTransform: Getter<boolean>,
  shouldUseRemoveClippedSubviewsAsDefaultOnIOS: Getter<boolean>,
  shouldUseSetNativePropsInFabric: Getter<boolean>,
}>;

export type ReactNativeFeatureFlagsJsOnlyOverrides = OverridesFor<ReactNativeFeatureFlagsJsOnly>;

export type ReactNativeFeatureFlags = $ReadOnly<{
  ...ReactNativeFeatureFlagsJsOnly,
  commonTestFlag: Getter<boolean>,
  commonTestFlagWithoutNativeImplementation: Getter<boolean>,
  cdpInteractionMetricsEnabled: Getter<boolean>,
  cxxNativeAnimatedEnabled: Getter<boolean>,
  defaultTextToOverflowHidden: Getter<boolean>,
  disableEarlyViewCommandExecution: Getter<boolean>,
  disableImageViewPreallocationAndroid: Getter<boolean>,
  disableMountItemReorderingAndroid: Getter<boolean>,
  disableSubviewClippingAndroid: Getter<boolean>,
  disableTextLayoutManagerCacheAndroid: Getter<boolean>,
  disableViewPreallocationAndroid: Getter<boolean>,
  enableAccessibilityOrder: Getter<boolean>,
  enableAccumulatedUpdatesInRawPropsAndroid: Getter<boolean>,
  enableAndroidAntialiasedBorderRadiusClipping: Getter<boolean>,
  enableAndroidLinearText: Getter<boolean>,
  enableAndroidTextMeasurementOptimizations: Getter<boolean>,
  enableBridgelessArchitecture: Getter<boolean>,
  enableCppPropsIteratorSetter: Getter<boolean>,
  enableCustomFocusSearchOnClippedElementsAndroid: Getter<boolean>,
  enableDestroyShadowTreeRevisionAsync: Getter<boolean>,
  enableDifferentiatorMutationVectorPreallocation: Getter<boolean>,
  enableDoubleMeasurementFixAndroid: Getter<boolean>,
  enableEagerMainQueueModulesOnIOS: Getter<boolean>,
  enableEagerRootViewAttachment: Getter<boolean>,
  enableExclusivePropsUpdateAndroid: Getter<boolean>,
  enableFabricCommitBranching: Getter<boolean>,
  enableFabricLogs: Getter<boolean>,
  enableFabricRenderer: Getter<boolean>,
  enableFontScaleChangesUpdatingLayout: Getter<boolean>,
  enableIOSTextBaselineOffsetPerLine: Getter<boolean>,
  enableIOSViewClipToPaddingBox: Getter<boolean>,
  enableImagePrefetchingAndroid: Getter<boolean>,
  enableImagePrefetchingJNIBatchingAndroid: Getter<boolean>,
  enableImagePrefetchingOnUiThreadAndroid: Getter<boolean>,
  enableImmediateUpdateModeForContentOffsetChanges: Getter<boolean>,
  enableImperativeFocus: Getter<boolean>,
  enableInteropViewManagerClassLookUpOptimizationIOS: Getter<boolean>,
  enableIntersectionObserverByDefault: Getter<boolean>,
  enableKeyEvents: Getter<boolean>,
  enableLayoutAnimationsOnAndroid: Getter<boolean>,
  enableLayoutAnimationsOnIOS: Getter<boolean>,
  enableMainQueueCoordinatorOnIOS: Getter<boolean>,
  enableModuleArgumentNSNullConversionIOS: Getter<boolean>,
  enableMutationObserverByDefault: Getter<boolean>,
  enableNativeCSSParsing: Getter<boolean>,
  enableNativeViewPropTransformations: Getter<boolean>,
  enableNetworkEventReporting: Getter<boolean>,
  enablePreparedTextLayout: Getter<boolean>,
  enablePropsUpdateReconciliationAndroid: Getter<boolean>,
  enableSwiftUIBasedFilters: Getter<boolean>,
  enableViewCulling: Getter<boolean>,
  enableViewRecycling: Getter<boolean>,
  enableViewRecyclingForImage: Getter<boolean>,
  enableViewRecyclingForScrollView: Getter<boolean>,
  enableViewRecyclingForText: Getter<boolean>,
  enableViewRecyclingForView: Getter<boolean>,
  enableVirtualViewContainerStateExperimental: Getter<boolean>,
  enableVirtualViewDebugFeatures: Getter<boolean>,
  fixFindShadowNodeByTagRaceCondition: Getter<boolean>,
  fixMappingOfEventPrioritiesBetweenFabricAndReact: Getter<boolean>,
  fixTextClippingAndroid15useBoundsForWidth: Getter<boolean>,
  fixYogaFlexBasisFitContentInMainAxis: Getter<boolean>,
  fuseboxAssertSingleHostState: Getter<boolean>,
  fuseboxEnabledRelease: Getter<boolean>,
  fuseboxFrameRecordingEnabled: Getter<boolean>,
  fuseboxNetworkInspectionEnabled: Getter<boolean>,
  hideOffscreenVirtualViewsOnIOS: Getter<boolean>,
  overrideBySynchronousMountPropsAtMountingAndroid: Getter<boolean>,
  perfIssuesEnabled: Getter<boolean>,
  perfMonitorV2Enabled: Getter<boolean>,
  preparedTextCacheSize: Getter<number>,
  preventShadowTreeCommitExhaustion: Getter<boolean>,
  shouldPressibilityUseW3CPointerEventsForHover: Getter<boolean>,
  shouldTriggerResponderTransferOnScrollAndroid: Getter<boolean>,
  skipActivityIdentityAssertionOnHostPause: Getter<boolean>,
  syncAndroidClipToPaddingWithOverflow: Getter<boolean>,
  traceTurboModulePromiseRejectionsOnAndroid: Getter<boolean>,
  updateRuntimeShadowNodeReferencesOnCommit: Getter<boolean>,
  updateRuntimeShadowNodeReferencesOnCommitThread: Getter<boolean>,
  useAlwaysAvailableJSErrorHandling: Getter<boolean>,
  useFabricInterop: Getter<boolean>,
  useLISAlgorithmInDifferentiator: Getter<boolean>,
  useNativeViewConfigsInBridgelessMode: Getter<boolean>,
  useNestedScrollViewAndroid: Getter<boolean>,
  useSharedAnimatedBackend: Getter<boolean>,
  useTraitHiddenOnAndroid: Getter<boolean>,
  useTurboModuleInterop: Getter<boolean>,
  useTurboModules: Getter<boolean>,
  useUnorderedMapInDifferentiator: Getter<boolean>,
  viewCullingOutsetRatio: Getter<number>,
  viewTransitionEnabled: Getter<boolean>,
  virtualViewPrerenderRatio: Getter<number>,
}>;

/**
 * JS-only flag for testing. Do NOT modify.
 */
export const jsOnlyTestFlag: Getter<boolean> = createJavaScriptFlagGetter('jsOnlyTestFlag', false);

/**
 * Enables an experimental flush-queue debouncing in Animated.js.
 */
export const animatedShouldDebounceQueueFlush: Getter<boolean> = createJavaScriptFlagGetter('animatedShouldDebounceQueueFlush', false);

/**
 * Enables an experimental mega-operation for Animated.js that replaces many calls to native with a single call into native, to reduce JSI/JNI traffic.
 */
export const animatedShouldUseSingleOp: Getter<boolean> = createJavaScriptFlagGetter('animatedShouldUseSingleOp', false);

/**
 * Use the deferred cell render update mechanism for focus change in FlatList.
 */
export const deferFlatListFocusChangeRenderUpdate: Getter<boolean> = createJavaScriptFlagGetter('deferFlatListFocusChangeRenderUpdate', false);

/**
 * Disable prop maintainVisibleContentPosition in ScrollView
 */
export const disableMaintainVisibleContentPosition: Getter<boolean> = createJavaScriptFlagGetter('disableMaintainVisibleContentPosition', false);

/**
 * Enable the external inspection API for DevTools to communicate with the Inspector overlay.
 */
export const externalElementInspectionEnabled: Getter<boolean> = createJavaScriptFlagGetter('externalElementInspectionEnabled', true);

/**
 * Fixing an edge case where the current window size is not properly calculated with fast scrolling. Window size collapsed to 1 element even if windowSize more than the current amount of elements
 */
export const fixVirtualizeListCollapseWindowSize: Getter<boolean> = createJavaScriptFlagGetter('fixVirtualizeListCollapseWindowSize', false);

/**
 * Function used to enable / disabled Layout Animations in React Native.
 */
export const isLayoutAnimationEnabled: Getter<boolean> = createJavaScriptFlagGetter('isLayoutAnimationEnabled', true);

/**
 * Enables use of AnimatedObject for animating transform values.
 */
export const shouldUseAnimatedObjectForTransform: Getter<boolean> = createJavaScriptFlagGetter('shouldUseAnimatedObjectForTransform', false);

/**
 * removeClippedSubviews prop will be used as the default in FlatList on iOS to match Android
 */
export const shouldUseRemoveClippedSubviewsAsDefaultOnIOS: Getter<boolean> = createJavaScriptFlagGetter('shouldUseRemoveClippedSubviewsAsDefaultOnIOS', false);

/**
 * Enables use of setNativeProps in JS driven animations.
 */
export const shouldUseSetNativePropsInFabric: Getter<boolean> = createJavaScriptFlagGetter('shouldUseSetNativePropsInFabric', true);

/**
 * Common flag for testing. Do NOT modify.
 */
export const commonTestFlag: Getter<boolean> = createNativeFlagGetter('commonTestFlag', false);
/**
 * Common flag for testing (without native implementation). Do NOT modify.
 */
export const commonTestFlagWithoutNativeImplementation: Getter<boolean> = createNativeFlagGetter('commonTestFlagWithoutNativeImplementation', false);
/**
 * Enable emitting of InteractionEntry live metrics to the debugger. Requires `enableBridgelessArchitecture`.
 */
export const cdpInteractionMetricsEnabled: Getter<boolean> = createNativeFlagGetter('cdpInteractionMetricsEnabled', false);
/**
 * Use a C++ implementation of Native Animated instead of the platform implementation.
 */
export const cxxNativeAnimatedEnabled: Getter<boolean> = createNativeFlagGetter('cxxNativeAnimatedEnabled', false);
/**
 * When enabled, sets the default overflow style for Text components to hidden instead of visible.
 */
export const defaultTextToOverflowHidden: Getter<boolean> = createNativeFlagGetter('defaultTextToOverflowHidden', true);
/**
 * Dispatch view commands in mount item order.
 */
export const disableEarlyViewCommandExecution: Getter<boolean> = createNativeFlagGetter('disableEarlyViewCommandExecution', false);
/**
 * Force disable view preallocation for images triggered from createNode off the main thread on Android
 */
export const disableImageViewPreallocationAndroid: Getter<boolean> = createNativeFlagGetter('disableImageViewPreallocationAndroid', false);
/**
 * Prevent FabricMountingManager from reordering mountItems, which may lead to invalid state on the UI thread
 */
export const disableMountItemReorderingAndroid: Getter<boolean> = createNativeFlagGetter('disableMountItemReorderingAndroid', false);
/**
 * Force disable subview clipping for ReactViewGroup on Android
 */
export const disableSubviewClippingAndroid: Getter<boolean> = createNativeFlagGetter('disableSubviewClippingAndroid', false);
/**
 * Turns off the global measurement cache used by TextLayoutManager on Android.
 */
export const disableTextLayoutManagerCacheAndroid: Getter<boolean> = createNativeFlagGetter('disableTextLayoutManagerCacheAndroid', false);
/**
 * Force disable view preallocation triggered from createNode off the main thread on Android
 */
export const disableViewPreallocationAndroid: Getter<boolean> = createNativeFlagGetter('disableViewPreallocationAndroid', false);
/**
 * When enabled, the accessibilityOrder prop will propagate to native platforms and define the accessibility order.
 */
export const enableAccessibilityOrder: Getter<boolean> = createNativeFlagGetter('enableAccessibilityOrder', false);
/**
 * When enabled, Android will accumulate updates in rawProps to reduce the number of mounting instructions for cascading re-renders.
 */
export const enableAccumulatedUpdatesInRawPropsAndroid: Getter<boolean> = createNativeFlagGetter('enableAccumulatedUpdatesInRawPropsAndroid', false);
/**
 * Enable antialiased border radius clipping for Android API 28 and below using manual masking with Porter-Duff compositing
 */
export const enableAndroidAntialiasedBorderRadiusClipping: Getter<boolean> = createNativeFlagGetter('enableAndroidAntialiasedBorderRadiusClipping', false);
/**
 * Enables linear text rendering on Android wherever subpixel text rendering is enabled
 */
export const enableAndroidLinearText: Getter<boolean> = createNativeFlagGetter('enableAndroidLinearText', true);
/**
 * Enables various optimizations throughout the path of measuring text on Android.
 */
export const enableAndroidTextMeasurementOptimizations: Getter<boolean> = createNativeFlagGetter('enableAndroidTextMeasurementOptimizations', false);
/**
 * Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable the following flags: `useTurboModules` & `enableFabricRenderer`.
 */
export const enableBridgelessArchitecture: Getter<boolean> = createNativeFlagGetter('enableBridgelessArchitecture', false);
/**
 * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
 */
export const enableCppPropsIteratorSetter: Getter<boolean> = createNativeFlagGetter('enableCppPropsIteratorSetter', false);
/**
 * This enables the fabric implementation of focus search so that we can focus clipped elements
 */
export const enableCustomFocusSearchOnClippedElementsAndroid: Getter<boolean> = createNativeFlagGetter('enableCustomFocusSearchOnClippedElementsAndroid', true);
/**
 * Enables destructor calls for ShadowTreeRevision in the background to reduce UI thread work.
 */
export const enableDestroyShadowTreeRevisionAsync: Getter<boolean> = createNativeFlagGetter('enableDestroyShadowTreeRevisionAsync', false);
/**
 * Pre-allocate mutation vectors in the Differentiator to reduce reallocation overhead during shadow view diffing.
 */
export const enableDifferentiatorMutationVectorPreallocation: Getter<boolean> = createNativeFlagGetter('enableDifferentiatorMutationVectorPreallocation', false);
/**
 * When enabled a subset of components will avoid double measurement on Android.
 */
export const enableDoubleMeasurementFixAndroid: Getter<boolean> = createNativeFlagGetter('enableDoubleMeasurementFixAndroid', false);
/**
 * This infra allows native modules to initialize on the main thread, during React Native init.
 */
export const enableEagerMainQueueModulesOnIOS: Getter<boolean> = createNativeFlagGetter('enableEagerMainQueueModulesOnIOS', false);
/**
 * Feature flag to configure eager attachment of the root view/initialisation of the JS code.
 */
export const enableEagerRootViewAttachment: Getter<boolean> = createNativeFlagGetter('enableEagerRootViewAttachment', false);
/**
 * When enabled, Android will disable Props 1.5 raw value merging when Props 2.0 is available.
 */
export const enableExclusivePropsUpdateAndroid: Getter<boolean> = createNativeFlagGetter('enableExclusivePropsUpdateAndroid', false);
/**
 * Enables Fabric commit branching to fix starvation problems and atomic JS updates.
 */
export const enableFabricCommitBranching: Getter<boolean> = createNativeFlagGetter('enableFabricCommitBranching', false);
/**
 * This feature flag enables logs for Fabric.
 */
export const enableFabricLogs: Getter<boolean> = createNativeFlagGetter('enableFabricLogs', false);
/**
 * Enables the use of the Fabric renderer in the whole app.
 */
export const enableFabricRenderer: Getter<boolean> = createNativeFlagGetter('enableFabricRenderer', false);
/**
 * Enables font scale changes updating layout for measurable nodes.
 */
export const enableFontScaleChangesUpdatingLayout: Getter<boolean> = createNativeFlagGetter('enableFontScaleChangesUpdatingLayout', true);
/**
 * Applies base offset for each line of text separately on iOS.
 */
export const enableIOSTextBaselineOffsetPerLine: Getter<boolean> = createNativeFlagGetter('enableIOSTextBaselineOffsetPerLine', false);
/**
 * iOS Views will clip to their padding box vs border box
 */
export const enableIOSViewClipToPaddingBox: Getter<boolean> = createNativeFlagGetter('enableIOSViewClipToPaddingBox', false);
/**
 * When enabled, Android will build and initiate image prefetch requests on ImageShadowNode::layout
 */
export const enableImagePrefetchingAndroid: Getter<boolean> = createNativeFlagGetter('enableImagePrefetchingAndroid', false);
/**
 * When enabled, Android will build and initiate image prefetch requests on ImageShadowNode::layout and batch them together in a single JNI call
 */
export const enableImagePrefetchingJNIBatchingAndroid: Getter<boolean> = createNativeFlagGetter('enableImagePrefetchingJNIBatchingAndroid', false);
/**
 * When enabled, Android will initiate image prefetch requested on ImageShadowNode::layout on the UI thread
 */
export const enableImagePrefetchingOnUiThreadAndroid: Getter<boolean> = createNativeFlagGetter('enableImagePrefetchingOnUiThreadAndroid', false);
/**
 * Dispatches state updates for content offset changes synchronously on the main thread.
 */
export const enableImmediateUpdateModeForContentOffsetChanges: Getter<boolean> = createNativeFlagGetter('enableImmediateUpdateModeForContentOffsetChanges', false);
/**
 * Enable ref.focus() and ref.blur() for all views, not just TextInput.
 */
export const enableImperativeFocus: Getter<boolean> = createNativeFlagGetter('enableImperativeFocus', false);
/**
 * This is to fix the issue with interop view manager where component descriptor lookup is causing ViewManager to preload.
 */
export const enableInteropViewManagerClassLookUpOptimizationIOS: Getter<boolean> = createNativeFlagGetter('enableInteropViewManagerClassLookUpOptimizationIOS', false);
/**
 * Enables the IntersectionObserver Web API in React Native.
 */
export const enableIntersectionObserverByDefault: Getter<boolean> = createNativeFlagGetter('enableIntersectionObserverByDefault', false);
/**
 * Enables key up/down/press events to be sent to JS from components
 */
export const enableKeyEvents: Getter<boolean> = createNativeFlagGetter('enableKeyEvents', false);
/**
 * When enabled, LayoutAnimations API will animate state changes on Android.
 */
export const enableLayoutAnimationsOnAndroid: Getter<boolean> = createNativeFlagGetter('enableLayoutAnimationsOnAndroid', false);
/**
 * When enabled, LayoutAnimations API will animate state changes on iOS.
 */
export const enableLayoutAnimationsOnIOS: Getter<boolean> = createNativeFlagGetter('enableLayoutAnimationsOnIOS', true);
/**
 * Make RCTUnsafeExecuteOnMainQueueSync less likely to deadlock, when used in conjuction with sync rendering/events.
 */
export const enableMainQueueCoordinatorOnIOS: Getter<boolean> = createNativeFlagGetter('enableMainQueueCoordinatorOnIOS', false);
/**
 * Enable NSNull conversion when handling module arguments on iOS
 */
export const enableModuleArgumentNSNullConversionIOS: Getter<boolean> = createNativeFlagGetter('enableModuleArgumentNSNullConversionIOS', false);
/**
 * Enables the MutationObserver Web API in React Native.
 */
export const enableMutationObserverByDefault: Getter<boolean> = createNativeFlagGetter('enableMutationObserverByDefault', false);
/**
 * Parse CSS strings using the Fabric CSS parser instead of ViewConfig processing
 */
export const enableNativeCSSParsing: Getter<boolean> = createNativeFlagGetter('enableNativeCSSParsing', false);
/**
 * When enabled, View.js passes aria-*, id, and tabIndex props directly to native, relying on C++ prop parsing instead of JS-side transformations.
 */
export const enableNativeViewPropTransformations: Getter<boolean> = createNativeFlagGetter('enableNativeViewPropTransformations', false);
/**
 * Enable network event reporting hooks in each native platform through `NetworkReporter` (Web Perf APIs + CDP). This flag should be combined with `fuseboxNetworkInspectionEnabled` to enable Network CDP debugging.
 */
export const enableNetworkEventReporting: Getter<boolean> = createNativeFlagGetter('enableNetworkEventReporting', true);
/**
 * Enables caching text layout artifacts for later reuse
 */
export const enablePreparedTextLayout: Getter<boolean> = createNativeFlagGetter('enablePreparedTextLayout', false);
/**
 * When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.
 */
export const enablePropsUpdateReconciliationAndroid: Getter<boolean> = createNativeFlagGetter('enablePropsUpdateReconciliationAndroid', false);
/**
 * When enabled, it will use SwiftUI for filter effects like blur on iOS.
 */
export const enableSwiftUIBasedFilters: Getter<boolean> = createNativeFlagGetter('enableSwiftUIBasedFilters', false);
/**
 * Enables View Culling: as soon as a view goes off screen, it can be reused anywhere in the UI and pieced together with other items to create new UI elements.
 */
export const enableViewCulling: Getter<boolean> = createNativeFlagGetter('enableViewCulling', false);
/**
 * Enables View Recycling. When enabled, individual ViewManagers must still opt-in.
 */
export const enableViewRecycling: Getter<boolean> = createNativeFlagGetter('enableViewRecycling', false);
/**
 * Enables View Recycling for <Image> via ReactViewGroup/ReactViewManager.
 */
export const enableViewRecyclingForImage: Getter<boolean> = createNativeFlagGetter('enableViewRecyclingForImage', true);
/**
 * Enables View Recycling for <ScrollView> via ReactViewGroup/ReactViewManager.
 */
export const enableViewRecyclingForScrollView: Getter<boolean> = createNativeFlagGetter('enableViewRecyclingForScrollView', false);
/**
 * Enables View Recycling for <Text> via ReactTextView/ReactTextViewManager.
 */
export const enableViewRecyclingForText: Getter<boolean> = createNativeFlagGetter('enableViewRecyclingForText', true);
/**
 * Enables View Recycling for <View> via ReactViewGroup/ReactViewManager.
 */
export const enableViewRecyclingForView: Getter<boolean> = createNativeFlagGetter('enableViewRecyclingForView', true);
/**
 * Enables the experimental version of `VirtualViewContainerState`.
 */
export const enableVirtualViewContainerStateExperimental: Getter<boolean> = createNativeFlagGetter('enableVirtualViewContainerStateExperimental', false);
/**
 * Enables VirtualView debug features such as logging and overlays.
 */
export const enableVirtualViewDebugFeatures: Getter<boolean> = createNativeFlagGetter('enableVirtualViewDebugFeatures', false);
/**
 * Fix a use-after-free race condition in findShadowNodeByTag_DEPRECATED by using getCurrentRevision() instead of tryCommit() with a raw pointer.
 */
export const fixFindShadowNodeByTagRaceCondition: Getter<boolean> = createNativeFlagGetter('fixFindShadowNodeByTagRaceCondition', false);
/**
 * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
 */
export const fixMappingOfEventPrioritiesBetweenFabricAndReact: Getter<boolean> = createNativeFlagGetter('fixMappingOfEventPrioritiesBetweenFabricAndReact', false);
/**
 * Fix text clipping starting in Android 15 due to usage of useBoundsForWidth
 */
export const fixTextClippingAndroid15useBoundsForWidth: Getter<boolean> = createNativeFlagGetter('fixTextClippingAndroid15useBoundsForWidth', false);
/**
 * Fix flex basis computation to not apply FitContent constraint in the main axis for non-measure container nodes, preventing unnecessary re-measurement in scroll containers.
 */
export const fixYogaFlexBasisFitContentInMainAxis: Getter<boolean> = createNativeFlagGetter('fixYogaFlexBasisFitContentInMainAxis', false);
/**
 * Enable system assertion validating that Fusebox is configured with a single host. When set, the CDP backend will dynamically disable features (Perf and Network) in the event that multiple hosts are registered (undefined behaviour), and broadcast this over `ReactNativeApplication.systemStateChanged`.
 */
export const fuseboxAssertSingleHostState: Getter<boolean> = createNativeFlagGetter('fuseboxAssertSingleHostState', true);
/**
 * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxEnabledRelease: Getter<boolean> = createNativeFlagGetter('fuseboxEnabledRelease', false);
/**
 * Enable frame timings and screenshots support in the React Native DevTools CDP backend. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxFrameRecordingEnabled: Getter<boolean> = createNativeFlagGetter('fuseboxFrameRecordingEnabled', false);
/**
 * Enable network inspection support in the React Native DevTools CDP backend. Requires `enableBridgelessArchitecture`. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxNetworkInspectionEnabled: Getter<boolean> = createNativeFlagGetter('fuseboxNetworkInspectionEnabled', true);
/**
 * Hides offscreen VirtualViews on iOS by setting hidden = YES to avoid extra cost of views
 */
export const hideOffscreenVirtualViewsOnIOS: Getter<boolean> = createNativeFlagGetter('hideOffscreenVirtualViewsOnIOS', false);
/**
 * Override props at mounting with synchronously mounted (i.e. direct manipulation) props from Native Animated.
 */
export const overrideBySynchronousMountPropsAtMountingAndroid: Getter<boolean> = createNativeFlagGetter('overrideBySynchronousMountPropsAtMountingAndroid', false);
/**
 * Enable reporting Performance Issues (`detail.devtools.performanceIssue`). Displayed in the V2 Performance Monitor and the "Performance Issues" sub-panel in DevTools.
 */
export const perfIssuesEnabled: Getter<boolean> = createNativeFlagGetter('perfIssuesEnabled', false);
/**
 * Enable the V2 in-app Performance Monitor. This flag is global and should not be changed across React Host lifetimes.
 */
export const perfMonitorV2Enabled: Getter<boolean> = createNativeFlagGetter('perfMonitorV2Enabled', false);
/**
 * Number cached PreparedLayouts in TextLayoutManager cache
 */
export const preparedTextCacheSize: Getter<number> = createNativeFlagGetter('preparedTextCacheSize', 200);
/**
 * Enables a new mechanism in ShadowTree to prevent problems caused by multiple threads trying to commit concurrently. If a thread tries to commit a few times unsuccessfully, it will acquire a lock and try again.
 */
export const preventShadowTreeCommitExhaustion: Getter<boolean> = createNativeFlagGetter('preventShadowTreeCommitExhaustion', false);
/**
 * Function used to enable / disable Pressibility from using W3C Pointer Events for its hover callbacks
 */
export const shouldPressibilityUseW3CPointerEventsForHover: Getter<boolean> = createNativeFlagGetter('shouldPressibilityUseW3CPointerEventsForHover', false);
/**
 * Do not emit touchcancel from Android ScrollView, instead native topScroll event will trigger responder transfer and terminate in RN renderer.
 */
export const shouldTriggerResponderTransferOnScrollAndroid: Getter<boolean> = createNativeFlagGetter('shouldTriggerResponderTransferOnScrollAndroid', false);
/**
 * Skip activity identity assertion in ReactHostImpl::onHostPause()
 */
export const skipActivityIdentityAssertionOnHostPause: Getter<boolean> = createNativeFlagGetter('skipActivityIdentityAssertionOnHostPause', false);
/**
 * Sync clipToPadding on Android views with the overflow property
 */
export const syncAndroidClipToPaddingWithOverflow: Getter<boolean> = createNativeFlagGetter('syncAndroidClipToPaddingWithOverflow', false);
/**
 * Enables storing js caller stack when creating promise in native module. This is useful in case of Promise rejection and tracing the cause.
 */
export const traceTurboModulePromiseRejectionsOnAndroid: Getter<boolean> = createNativeFlagGetter('traceTurboModulePromiseRejectionsOnAndroid', false);
/**
 * When enabled, runtime shadow node references will be updated during the commit. This allows running RSNRU from any thread without corrupting the renderer state.
 */
export const updateRuntimeShadowNodeReferencesOnCommit: Getter<boolean> = createNativeFlagGetter('updateRuntimeShadowNodeReferencesOnCommit', false);
/**
 * When enabled, runtime shadow node references will be updated during the commit only on the allowed thread.
 */
export const updateRuntimeShadowNodeReferencesOnCommitThread: Getter<boolean> = createNativeFlagGetter('updateRuntimeShadowNodeReferencesOnCommitThread', false);
/**
 * In Bridgeless mode, use the always available javascript error reporting pipeline.
 */
export const useAlwaysAvailableJSErrorHandling: Getter<boolean> = createNativeFlagGetter('useAlwaysAvailableJSErrorHandling', false);
/**
 * Should this application enable the Fabric Interop Layer for Android? If yes, the application will behave so that it can accept non-Fabric components and render them on Fabric. This toggle is controlling extra logic such as custom event dispatching that are needed for the Fabric Interop Layer to work correctly.
 */
export const useFabricInterop: Getter<boolean> = createNativeFlagGetter('useFabricInterop', true);
/**
 * Use Longest Increasing Subsequence algorithm in the Differentiator to minimize REMOVE/INSERT mutations during child list reconciliation.
 */
export const useLISAlgorithmInDifferentiator: Getter<boolean> = createNativeFlagGetter('useLISAlgorithmInDifferentiator', false);
/**
 * When enabled, the native view configs are used in bridgeless mode.
 */
export const useNativeViewConfigsInBridgelessMode: Getter<boolean> = createNativeFlagGetter('useNativeViewConfigsInBridgelessMode', false);
/**
 * When enabled, ReactScrollView will extend NestedScrollView instead of ScrollView on Android for improved nested scrolling support.
 */
export const useNestedScrollViewAndroid: Getter<boolean> = createNativeFlagGetter('useNestedScrollViewAndroid', false);
/**
 * Use shared animation backend in C++ Animated
 */
export const useSharedAnimatedBackend: Getter<boolean> = createNativeFlagGetter('useSharedAnimatedBackend', false);
/**
 * Use Trait::hidden on Android
 */
export const useTraitHiddenOnAndroid: Getter<boolean> = createNativeFlagGetter('useTraitHiddenOnAndroid', false);
/**
 * In Bridgeless mode, should legacy NativeModules use the TurboModule system?
 */
export const useTurboModuleInterop: Getter<boolean> = createNativeFlagGetter('useTurboModuleInterop', false);
/**
 * When enabled, NativeModules will be executed by using the TurboModule system
 */
export const useTurboModules: Getter<boolean> = createNativeFlagGetter('useTurboModules', false);
/**
 * Use std::unordered_map instead of TinyMap in the Differentiator for improved lookup performance.
 */
export const useUnorderedMapInDifferentiator: Getter<boolean> = createNativeFlagGetter('useUnorderedMapInDifferentiator', false);
/**
 * Outset the culling context frame with the provided ratio. The culling context frame size will be outset by width * ratio on the left and right, and height * ratio on the top and bottom.
 */
export const viewCullingOutsetRatio: Getter<number> = createNativeFlagGetter('viewCullingOutsetRatio', 0);
/**
 * Enable the View Transition API for animating transitions between views.
 */
export const viewTransitionEnabled: Getter<boolean> = createNativeFlagGetter('viewTransitionEnabled', false);
/**
 * Initial prerender ratio for VirtualView.
 */
export const virtualViewPrerenderRatio: Getter<number> = createNativeFlagGetter('virtualViewPrerenderRatio', 5);

/**
 * Overrides the feature flags with the provided methods.
 * NOTE: Only JS-only flags can be overridden from JavaScript using this API.
 */
export const override = setOverrides;
