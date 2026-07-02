/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<2be1f76084eb85288987229421d7585f>>
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

export type ReactNativeFeatureFlagsJsOnly = Readonly<{
  jsOnlyTestFlag: Getter<boolean>,
  animatedDeferStartOfTimingAnimations: Getter<boolean>,
  animatedForceNativeDriver: Getter<boolean>,
  animatedShouldSyncValueBeforeStartCallback: Getter<boolean>,
  deferFlatListFocusChangeRenderUpdate: Getter<boolean>,
  enableImperativeEvents: Getter<boolean>,
  enableNativeEventTargetEventDispatching: Getter<boolean>,
  externalElementInspectionEnabled: Getter<boolean>,
  fixVirtualizeListCollapseWindowSize: Getter<boolean>,
  isLayoutAnimationEnabled: Getter<boolean>,
  shouldUseAnimatedObjectForTransform: Getter<boolean>,
  shouldUseRemoveClippedSubviewsAsDefaultOnIOS: Getter<boolean>,
  shouldUseSetNativePropsInFabric: Getter<boolean>,
}>;

export type ReactNativeFeatureFlagsJsOnlyOverrides = OverridesFor<ReactNativeFeatureFlagsJsOnly>;

export type ReactNativeFeatureFlags = Readonly<{
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
  enableAndroidFontWeightAdjustment: Getter<boolean>,
  enableAndroidTextMeasurementOptimizations: Getter<boolean>,
  enableBridgelessArchitecture: Getter<boolean>,
  enableCppPropsIteratorSetter: Getter<boolean>,
  enableCustomFocusSearchOnClippedElementsAndroid: Getter<boolean>,
  enableDestroyShadowTreeRevisionAsync: Getter<boolean>,
  enableDoubleMeasurementFixAndroid: Getter<boolean>,
  enableEagerRootViewAttachment: Getter<boolean>,
  enableExclusivePropsUpdateAndroid: Getter<boolean>,
  enableFabricCommitBranching: Getter<boolean>,
  enableFabricLogs: Getter<boolean>,
  enableFlexboxAutoMinSizeInStrictMode: Getter<boolean>,
  enableFontScaleChangesUpdatingLayout: Getter<boolean>,
  enableIOSCompressedTextFrameAdjustment: Getter<boolean>,
  enableIOSTextBaselineOffsetPerLine: Getter<boolean>,
  enableIOSViewClipToPaddingBox: Getter<boolean>,
  enableImagePrefetchingAndroid: Getter<boolean>,
  enableImmediateUpdateModeForContentOffsetChanges: Getter<boolean>,
  enableImperativeFocus: Getter<boolean>,
  enableInteropViewManagerClassLookUpOptimizationIOS: Getter<boolean>,
  enableIntersectionObserverByDefault: Getter<boolean>,
  enableKeyEvents: Getter<boolean>,
  enableLayoutAnimationsOnAndroid: Getter<boolean>,
  enableLayoutAnimationsOnIOS: Getter<boolean>,
  enableModuleArgumentNSNullConversionIOS: Getter<boolean>,
  enableMutationObserverByDefault: Getter<boolean>,
  enableNativeCSSParsing: Getter<boolean>,
  enableNetworkEventReporting: Getter<boolean>,
  enablePreparedTextLayout: Getter<boolean>,
  enablePropsUpdateReconciliationAndroid: Getter<boolean>,
  enableRuntimeSchedulerQueueClearingOnError: Getter<boolean>,
  enableSchedulerDelegateInvalidation: Getter<boolean>,
  enableSwiftUIBasedFilters: Getter<boolean>,
  enableViewCulling: Getter<boolean>,
  enableViewRecycling: Getter<boolean>,
  enableViewRecyclingForImage: Getter<boolean>,
  enableViewRecyclingForScrollView: Getter<boolean>,
  enableViewRecyclingForText: Getter<boolean>,
  enableViewRecyclingForView: Getter<boolean>,
  enableVirtualViewContainerStateExperimental: Getter<boolean>,
  fixDifferentiatorParentTagForUnflattenCase: Getter<boolean>,
  fixMappingOfEventPrioritiesBetweenFabricAndReact: Getter<boolean>,
  fixYogaFlexBasisFitContentInMainAxis: Getter<boolean>,
  fuseboxAssertSingleHostState: Getter<boolean>,
  fuseboxEnabledRelease: Getter<boolean>,
  fuseboxFrameRecordingEnabled: Getter<boolean>,
  fuseboxNetworkInspectionEnabled: Getter<boolean>,
  fuseboxScreenshotCaptureEnabled: Getter<boolean>,
  optimizedAnimatedPropUpdates: Getter<boolean>,
  overrideBySynchronousMountPropsAtMountingAndroid: Getter<boolean>,
  perfIssuesEnabled: Getter<boolean>,
  perfMonitorV2Enabled: Getter<boolean>,
  preparedTextCacheSize: Getter<number>,
  preventShadowTreeCommitExhaustion: Getter<boolean>,
  redBoxV2Android: Getter<boolean>,
  redBoxV2IOS: Getter<boolean>,
  shouldPressibilityUseW3CPointerEventsForHover: Getter<boolean>,
  shouldTriggerResponderTransferOnScrollAndroid: Getter<boolean>,
  skipActivityIdentityAssertionOnHostPause: Getter<boolean>,
  syncAndroidClipBoundsWithOverflow: Getter<boolean>,
  traceTurboModulePromiseRejectionsOnAndroid: Getter<boolean>,
  updateRuntimeShadowNodeReferencesOnCommit: Getter<boolean>,
  updateRuntimeShadowNodeReferencesOnCommitThread: Getter<boolean>,
  useAlwaysAvailableJSErrorHandling: Getter<boolean>,
  useFabricInterop: Getter<boolean>,
  useNativeViewConfigsInBridgelessMode: Getter<boolean>,
  useNestedScrollViewAndroid: Getter<boolean>,
  useSharedAnimatedBackend: Getter<boolean>,
  useTraitHiddenOnAndroid: Getter<boolean>,
  useTurboModuleInterop: Getter<boolean>,
  viewCullingOutsetRatio: Getter<number>,
  viewTransitionEnabled: Getter<boolean>,
  viewTransitionUseHardwareBitmapAndroid: Getter<boolean>,
  virtualViewPrerenderRatio: Getter<number>,
}>;

/**
 * JS-only flag for testing. Do NOT modify.
 */
export const jsOnlyTestFlag: Getter<boolean> = createJavaScriptFlagGetter('jsOnlyTestFlag', false);

/**
 * When enabled, the JS Animated layer defers the start of native-driven timing animations to the first rendered frame and re-anchors timing to prevent skipping initial frames when the UI thread is busy with layout work.
 */
export const animatedDeferStartOfTimingAnimations: Getter<boolean> = createJavaScriptFlagGetter('animatedDeferStartOfTimingAnimations', false);

/**
 * When enabled, forces `useNativeDriver` to `true` for all Animated animations and events, overriding the config (including an explicit `false`). Has no effect unless the shared animated backend is enabled, which is required to support native driver for all props.
 */
export const animatedForceNativeDriver: Getter<boolean> = createJavaScriptFlagGetter('animatedForceNativeDriver', false);

/**
 * When a useNativeDriver animation completes, syncs the JS-side AnimatedValue with the post-animation value BEFORE invoking the user-supplied start({finished}) callback. Without the flag, the callback observes the pre-animation value, which can cause downstream re-renders to read stale interpolation outputs.
 */
export const animatedShouldSyncValueBeforeStartCallback: Getter<boolean> = createJavaScriptFlagGetter('animatedShouldSyncValueBeforeStartCallback', true);

/**
 * Use the deferred cell render update mechanism for focus change in FlatList.
 */
export const deferFlatListFocusChangeRenderUpdate: Getter<boolean> = createJavaScriptFlagGetter('deferFlatListFocusChangeRenderUpdate', false);

/**
 * When enabled, ReactNativeElement and ReadOnlyText expose the public EventTarget API (addEventListener, removeEventListener, dispatchEvent). When disabled, those methods are removed from those final classes.
 */
export const enableImperativeEvents: Getter<boolean> = createJavaScriptFlagGetter('enableImperativeEvents', false);

/**
 * When enabled, the React Native renderer dispatches events through the W3C EventTarget API (addEventListener/dispatchEvent) instead of the legacy plugin-based system.
 */
export const enableNativeEventTargetEventDispatching: Getter<boolean> = createJavaScriptFlagGetter('enableNativeEventTargetEventDispatching', false);

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
 * When enabled, Android Text measurement and rendering respects the system Bold text accessibility setting via `Configuration.fontWeightAdjustment`.
 */
export const enableAndroidFontWeightAdjustment: Getter<boolean> = createNativeFlagGetter('enableAndroidFontWeightAdjustment', true);
/**
 * Enables various optimizations throughout the path of measuring text on Android.
 */
export const enableAndroidTextMeasurementOptimizations: Getter<boolean> = createNativeFlagGetter('enableAndroidTextMeasurementOptimizations', false);
/**
 * Feature flag to enable the new bridgeless architecture.
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
 * When enabled a subset of components will avoid double measurement on Android.
 */
export const enableDoubleMeasurementFixAndroid: Getter<boolean> = createNativeFlagGetter('enableDoubleMeasurementFixAndroid', false);
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
 * Enables CSS Flexbox §4.5 automatic minimum sizing under strict layout conformance. When enabled, a flex item with an undefined main-axis `min-width`/`min-height` under strict conformance receives a content-derived minimum size (per spec) instead of an undefined (0) minimum. Defaults off so the behaviour can be ramped independently of strict conformance.
 */
export const enableFlexboxAutoMinSizeInStrictMode: Getter<boolean> = createNativeFlagGetter('enableFlexboxAutoMinSizeInStrictMode', false);
/**
 * Enables font scale changes updating layout for measurable nodes.
 */
export const enableFontScaleChangesUpdatingLayout: Getter<boolean> = createNativeFlagGetter('enableFontScaleChangesUpdatingLayout', true);
/**
 * Adjusts iOS Text drawing frames for compressed explicit line heights.
 */
export const enableIOSCompressedTextFrameAdjustment: Getter<boolean> = createNativeFlagGetter('enableIOSCompressedTextFrameAdjustment', false);
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
 * When enabled, RuntimeScheduler_Modern clears pending tasks and rendering updates before handling an error.
 */
export const enableRuntimeSchedulerQueueClearingOnError: Getter<boolean> = createNativeFlagGetter('enableRuntimeSchedulerQueueClearingOnError', false);
/**
 * Gates a defensive guard around Scheduler::uiManagerDidDispatchCommand and uiManagerDidFinishTransaction that prevents queued rendering-update lambdas from dereferencing the SchedulerDelegate after it has been destroyed (use-after-free).
 */
export const enableSchedulerDelegateInvalidation: Getter<boolean> = createNativeFlagGetter('enableSchedulerDelegateInvalidation', false);
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
 * Fix incorrect parentTag passed as parentTagForUpdate in the unflatten-unflatten branch of calculateShadowViewMutationsFlattener, which causes UPDATE mutations to reference a parent being created in the same batch.
 */
export const fixDifferentiatorParentTagForUnflattenCase: Getter<boolean> = createNativeFlagGetter('fixDifferentiatorParentTagForUnflattenCase', true);
/**
 * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
 */
export const fixMappingOfEventPrioritiesBetweenFabricAndReact: Getter<boolean> = createNativeFlagGetter('fixMappingOfEventPrioritiesBetweenFabricAndReact', false);
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
 * Enable Page.captureScreenshot CDP method support in the React Native DevTools CDP backend. This flag is global and should not be changed across React Host lifetimes.
 */
export const fuseboxScreenshotCaptureEnabled: Getter<boolean> = createNativeFlagGetter('fuseboxScreenshotCaptureEnabled', false);
/**
 * When enabled, uses optimized platform-specific paths to apply animated props synchronously. On Android, this uses a batched int/double buffer protocol with a single JNI call. On iOS, this passes AnimatedProps directly through the delegate chain and applies them via cloneProps, avoiding the folly::dynamic round-trip.
 */
export const optimizedAnimatedPropUpdates: Getter<boolean> = createNativeFlagGetter('optimizedAnimatedPropUpdates', false);
/**
 * Override props at mounting with synchronously mounted (i.e. direct manipulation) props from Native Animated.
 */
export const overrideBySynchronousMountPropsAtMountingAndroid: Getter<boolean> = createNativeFlagGetter('overrideBySynchronousMountPropsAtMountingAndroid', true);
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
 * Use the redesigned RedBox error overlay on Android, styled to match the LogBox visual language.
 */
export const redBoxV2Android: Getter<boolean> = createNativeFlagGetter('redBoxV2Android', false);
/**
 * Use the redesigned RedBox error overlay on iOS, styled to match the LogBox visual language.
 */
export const redBoxV2IOS: Getter<boolean> = createNativeFlagGetter('redBoxV2IOS', false);
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
 * Override getClipBounds on Android views to return the padding box when overflow is hidden
 */
export const syncAndroidClipBoundsWithOverflow: Getter<boolean> = createNativeFlagGetter('syncAndroidClipBoundsWithOverflow', false);
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
 * Outset the culling context frame with the provided ratio. The culling context frame size will be outset by width * ratio on the left and right, and height * ratio on the top and bottom.
 */
export const viewCullingOutsetRatio: Getter<number> = createNativeFlagGetter('viewCullingOutsetRatio', 0);
/**
 * Enable the View Transition API for animating transitions between views.
 */
export const viewTransitionEnabled: Getter<boolean> = createNativeFlagGetter('viewTransitionEnabled', false);
/**
 * Use hardware bitmaps for view transition snapshots on Android.
 */
export const viewTransitionUseHardwareBitmapAndroid: Getter<boolean> = createNativeFlagGetter('viewTransitionUseHardwareBitmapAndroid', false);
/**
 * Initial prerender ratio for VirtualView.
 */
export const virtualViewPrerenderRatio: Getter<number> = createNativeFlagGetter('virtualViewPrerenderRatio', 5);

/**
 * Overrides the feature flags with the provided methods.
 * NOTE: Only JS-only flags can be overridden from JavaScript using this API.
 */
export const override = setOverrides;
