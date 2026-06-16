/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<9180537aa2031cfcbab5ffbdf1dc32d1>>
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

#include <react/featureflags/ReactNativeFeatureFlagsAccessor.h>
#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <memory>
#include <optional>
#include <string>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook::react {

/**
 * This class provides access to internal React Native feature flags.
 *
 * All the methods are thread-safe (as long as the methods in the overridden
 * provider are).
 */
class ReactNativeFeatureFlags {
 public:
  /**
   * Common flag for testing. Do NOT modify.
   */
  RN_EXPORT static bool commonTestFlag();

  /**
   * Enable emitting of InteractionEntry live metrics to the debugger. Requires `enableBridgelessArchitecture`.
   */
  RN_EXPORT static bool cdpInteractionMetricsEnabled();

  /**
   * Use a C++ implementation of Native Animated instead of the platform implementation.
   */
  RN_EXPORT static bool cxxNativeAnimatedEnabled();

  /**
   * When enabled, sets the default overflow style for Text components to hidden instead of visible.
   */
  RN_EXPORT static bool defaultTextToOverflowHidden();

  /**
   * Dispatch view commands in mount item order.
   */
  RN_EXPORT static bool disableEarlyViewCommandExecution();

  /**
   * Force disable view preallocation for images triggered from createNode off the main thread on Android
   */
  RN_EXPORT static bool disableImageViewPreallocationAndroid();

  /**
   * Prevent FabricMountingManager from reordering mountItems, which may lead to invalid state on the UI thread
   */
  RN_EXPORT static bool disableMountItemReorderingAndroid();

  /**
   * Force disable subview clipping for ReactViewGroup on Android
   */
  RN_EXPORT static bool disableSubviewClippingAndroid();

  /**
   * Turns off the global measurement cache used by TextLayoutManager on Android.
   */
  RN_EXPORT static bool disableTextLayoutManagerCacheAndroid();

  /**
   * Force disable view preallocation triggered from createNode off the main thread on Android
   */
  RN_EXPORT static bool disableViewPreallocationAndroid();

  /**
   * When enabled, the accessibilityOrder prop will propagate to native platforms and define the accessibility order.
   */
  RN_EXPORT static bool enableAccessibilityOrder();

  /**
   * When enabled, Android will accumulate updates in rawProps to reduce the number of mounting instructions for cascading re-renders.
   */
  RN_EXPORT static bool enableAccumulatedUpdatesInRawPropsAndroid();

  /**
   * Enables various optimizations throughout the path of measuring text on Android.
   */
  RN_EXPORT static bool enableAndroidTextMeasurementOptimizations();

  /**
   * Feature flag to enable the new bridgeless architecture.
   */
  RN_EXPORT static bool enableBridgelessArchitecture();

  /**
   * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
   */
  RN_EXPORT static bool enableCppPropsIteratorSetter();

  /**
   * This enables the fabric implementation of focus search so that we can focus clipped elements
   */
  RN_EXPORT static bool enableCustomFocusSearchOnClippedElementsAndroid();

  /**
   * Enables destructor calls for ShadowTreeRevision in the background to reduce UI thread work.
   */
  RN_EXPORT static bool enableDestroyShadowTreeRevisionAsync();

  /**
   * When enabled a subset of components will avoid double measurement on Android.
   */
  RN_EXPORT static bool enableDoubleMeasurementFixAndroid();

  /**
   * Feature flag to configure eager attachment of the root view/initialisation of the JS code.
   */
  RN_EXPORT static bool enableEagerRootViewAttachment();

  /**
   * When enabled, Android will disable Props 1.5 raw value merging when Props 2.0 is available.
   */
  RN_EXPORT static bool enableExclusivePropsUpdateAndroid();

  /**
   * Enables Fabric commit branching to fix starvation problems and atomic JS updates.
   */
  RN_EXPORT static bool enableFabricCommitBranching();

  /**
   * This feature flag enables logs for Fabric.
   */
  RN_EXPORT static bool enableFabricLogs();

  /**
   * Enables CSS Flexbox §4.5 automatic minimum sizing under strict layout conformance. When enabled, a flex item with an undefined main-axis `min-width`/`min-height` under strict conformance receives a content-derived minimum size (per spec) instead of an undefined (0) minimum. Defaults off so the behaviour can be ramped independently of strict conformance.
   */
  RN_EXPORT static bool enableFlexboxAutoMinSizeInStrictMode();

  /**
   * Enables font scale changes updating layout for measurable nodes.
   */
  RN_EXPORT static bool enableFontScaleChangesUpdatingLayout();

  /**
   * Applies base offset for each line of text separately on iOS.
   */
  RN_EXPORT static bool enableIOSTextBaselineOffsetPerLine();

  /**
   * iOS Views will clip to their padding box vs border box
   */
  RN_EXPORT static bool enableIOSViewClipToPaddingBox();

  /**
   * When enabled, Android will build and initiate image prefetch requests on ImageShadowNode::layout
   */
  RN_EXPORT static bool enableImagePrefetchingAndroid();

  /**
   * When enabled, ImageShadowNode downgrades image requests to prefetch priority when layout determines that the image does not intersect the viewport.
   */
  RN_EXPORT static bool enableImageRequestDowngradingForNonVisibleImages();

  /**
   * Dispatches state updates for content offset changes synchronously on the main thread.
   */
  RN_EXPORT static bool enableImmediateUpdateModeForContentOffsetChanges();

  /**
   * Enable ref.focus() and ref.blur() for all views, not just TextInput.
   */
  RN_EXPORT static bool enableImperativeFocus();

  /**
   * This is to fix the issue with interop view manager where component descriptor lookup is causing ViewManager to preload.
   */
  RN_EXPORT static bool enableInteropViewManagerClassLookUpOptimizationIOS();

  /**
   * Enables the IntersectionObserver Web API in React Native.
   */
  RN_EXPORT static bool enableIntersectionObserverByDefault();

  /**
   * Enables key up/down/press events to be sent to JS from components
   */
  RN_EXPORT static bool enableKeyEvents();

  /**
   * When enabled, LayoutAnimations API will animate state changes on Android.
   */
  RN_EXPORT static bool enableLayoutAnimationsOnAndroid();

  /**
   * When enabled, LayoutAnimations API will animate state changes on iOS.
   */
  RN_EXPORT static bool enableLayoutAnimationsOnIOS();

  /**
   * Enable NSNull conversion when handling module arguments on iOS
   */
  RN_EXPORT static bool enableModuleArgumentNSNullConversionIOS();

  /**
   * Enables the MutationObserver Web API in React Native.
   */
  RN_EXPORT static bool enableMutationObserverByDefault();

  /**
   * Parse CSS strings using the Fabric CSS parser instead of ViewConfig processing
   */
  RN_EXPORT static bool enableNativeCSSParsing();

  /**
   * Enable network event reporting hooks in each native platform through `NetworkReporter` (Web Perf APIs + CDP). This flag should be combined with `fuseboxNetworkInspectionEnabled` to enable Network CDP debugging.
   */
  RN_EXPORT static bool enableNetworkEventReporting();

  /**
   * Enables caching text layout artifacts for later reuse
   */
  RN_EXPORT static bool enablePreparedTextLayout();

  /**
   * When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.
   */
  RN_EXPORT static bool enablePropsUpdateReconciliationAndroid();

  /**
   * When enabled, RuntimeScheduler_Modern clears pending tasks and rendering updates before handling an error.
   */
  RN_EXPORT static bool enableRuntimeSchedulerQueueClearingOnError();

  /**
   * Gates a defensive guard around Scheduler::uiManagerDidDispatchCommand and uiManagerDidFinishTransaction that prevents queued rendering-update lambdas from dereferencing the SchedulerDelegate after it has been destroyed (use-after-free).
   */
  RN_EXPORT static bool enableSchedulerDelegateInvalidation();

  /**
   * When enabled, it will use SwiftUI for filter effects like blur on iOS.
   */
  RN_EXPORT static bool enableSwiftUIBasedFilters();

  /**
   * Enables View Culling: as soon as a view goes off screen, it can be reused anywhere in the UI and pieced together with other items to create new UI elements.
   */
  RN_EXPORT static bool enableViewCulling();

  /**
   * Enables View Recycling. When enabled, individual ViewManagers must still opt-in.
   */
  RN_EXPORT static bool enableViewRecycling();

  /**
   * Enables View Recycling for <Image> via ReactViewGroup/ReactViewManager.
   */
  RN_EXPORT static bool enableViewRecyclingForImage();

  /**
   * Enables View Recycling for <ScrollView> via ReactViewGroup/ReactViewManager.
   */
  RN_EXPORT static bool enableViewRecyclingForScrollView();

  /**
   * Enables View Recycling for <Text> via ReactTextView/ReactTextViewManager.
   */
  RN_EXPORT static bool enableViewRecyclingForText();

  /**
   * Enables View Recycling for <View> via ReactViewGroup/ReactViewManager.
   */
  RN_EXPORT static bool enableViewRecyclingForView();

  /**
   * Enables the experimental version of `VirtualViewContainerState`.
   */
  RN_EXPORT static bool enableVirtualViewContainerStateExperimental();

  /**
   * Fix incorrect parentTag passed as parentTagForUpdate in the unflatten-unflatten branch of calculateShadowViewMutationsFlattener, which causes UPDATE mutations to reference a parent being created in the same batch.
   */
  RN_EXPORT static bool fixDifferentiatorParentTagForUnflattenCase();

  /**
   * Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.
   */
  RN_EXPORT static bool fixMappingOfEventPrioritiesBetweenFabricAndReact();

  /**
   * Fix flex basis computation to not apply FitContent constraint in the main axis for non-measure container nodes, preventing unnecessary re-measurement in scroll containers.
   */
  RN_EXPORT static bool fixYogaFlexBasisFitContentInMainAxis();

  /**
   * Enable system assertion validating that Fusebox is configured with a single host. When set, the CDP backend will dynamically disable features (Perf and Network) in the event that multiple hosts are registered (undefined behaviour), and broadcast this over `ReactNativeApplication.systemStateChanged`.
   */
  RN_EXPORT static bool fuseboxAssertSingleHostState();

  /**
   * Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool fuseboxEnabledRelease();

  /**
   * Enable frame timings and screenshots support in the React Native DevTools CDP backend. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool fuseboxFrameRecordingEnabled();

  /**
   * Enable network inspection support in the React Native DevTools CDP backend. Requires `enableBridgelessArchitecture`. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool fuseboxNetworkInspectionEnabled();

  /**
   * Enable Page.captureScreenshot CDP method support in the React Native DevTools CDP backend. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool fuseboxScreenshotCaptureEnabled();

  /**
   * Hides offscreen VirtualViews on iOS by setting hidden = YES to avoid extra cost of views
   */
  RN_EXPORT static bool hideOffscreenVirtualViewsOnIOS();

  /**
   * When enabled, uses optimized platform-specific paths to apply animated props synchronously. On Android, this uses a batched int/double buffer protocol with a single JNI call. On iOS, this passes AnimatedProps directly through the delegate chain and applies them via cloneProps, avoiding the folly::dynamic round-trip.
   */
  RN_EXPORT static bool optimizedAnimatedPropUpdates();

  /**
   * Override props at mounting with synchronously mounted (i.e. direct manipulation) props from Native Animated.
   */
  RN_EXPORT static bool overrideBySynchronousMountPropsAtMountingAndroid();

  /**
   * Enable reporting Performance Issues (`detail.devtools.performanceIssue`). Displayed in the V2 Performance Monitor and the "Performance Issues" sub-panel in DevTools.
   */
  RN_EXPORT static bool perfIssuesEnabled();

  /**
   * Enable the V2 in-app Performance Monitor. This flag is global and should not be changed across React Host lifetimes.
   */
  RN_EXPORT static bool perfMonitorV2Enabled();

  /**
   * Number cached PreparedLayouts in TextLayoutManager cache
   */
  RN_EXPORT static double preparedTextCacheSize();

  /**
   * Enables a new mechanism in ShadowTree to prevent problems caused by multiple threads trying to commit concurrently. If a thread tries to commit a few times unsuccessfully, it will acquire a lock and try again.
   */
  RN_EXPORT static bool preventShadowTreeCommitExhaustion();

  /**
   * Use the redesigned RedBox error overlay on Android, styled to match the LogBox visual language.
   */
  RN_EXPORT static bool redBoxV2Android();

  /**
   * Use the redesigned RedBox error overlay on iOS, styled to match the LogBox visual language.
   */
  RN_EXPORT static bool redBoxV2IOS();

  /**
   * Function used to enable / disable Pressibility from using W3C Pointer Events for its hover callbacks
   */
  RN_EXPORT static bool shouldPressibilityUseW3CPointerEventsForHover();

  /**
   * Do not emit touchcancel from Android ScrollView, instead native topScroll event will trigger responder transfer and terminate in RN renderer.
   */
  RN_EXPORT static bool shouldTriggerResponderTransferOnScrollAndroid();

  /**
   * Skip activity identity assertion in ReactHostImpl::onHostPause()
   */
  RN_EXPORT static bool skipActivityIdentityAssertionOnHostPause();

  /**
   * Override getClipBounds on Android views to return the padding box when overflow is hidden
   */
  RN_EXPORT static bool syncAndroidClipBoundsWithOverflow();

  /**
   * Enables storing js caller stack when creating promise in native module. This is useful in case of Promise rejection and tracing the cause.
   */
  RN_EXPORT static bool traceTurboModulePromiseRejectionsOnAndroid();

  /**
   * When enabled, runtime shadow node references will be updated during the commit. This allows running RSNRU from any thread without corrupting the renderer state.
   */
  RN_EXPORT static bool updateRuntimeShadowNodeReferencesOnCommit();

  /**
   * When enabled, runtime shadow node references will be updated during the commit only on the allowed thread.
   */
  RN_EXPORT static bool updateRuntimeShadowNodeReferencesOnCommitThread();

  /**
   * In Bridgeless mode, use the always available javascript error reporting pipeline.
   */
  RN_EXPORT static bool useAlwaysAvailableJSErrorHandling();

  /**
   * Should this application enable the Fabric Interop Layer for Android? If yes, the application will behave so that it can accept non-Fabric components and render them on Fabric. This toggle is controlling extra logic such as custom event dispatching that are needed for the Fabric Interop Layer to work correctly.
   */
  RN_EXPORT static bool useFabricInterop();

  /**
   * When enabled, the native view configs are used in bridgeless mode.
   */
  RN_EXPORT static bool useNativeViewConfigsInBridgelessMode();

  /**
   * When enabled, ReactScrollView will extend NestedScrollView instead of ScrollView on Android for improved nested scrolling support.
   */
  RN_EXPORT static bool useNestedScrollViewAndroid();

  /**
   * Use MutableIntObjectMap with ReadWriteLock instead of ConcurrentHashMap for the view registry in SurfaceMountingManager to reduce memory overhead and GC pressure.
   */
  RN_EXPORT static bool useOptimizedViewRegistryOnAndroid();

  /**
   * Use shared animation backend in C++ Animated
   */
  RN_EXPORT static bool useSharedAnimatedBackend();

  /**
   * Use Trait::hidden on Android
   */
  RN_EXPORT static bool useTraitHiddenOnAndroid();

  /**
   * In Bridgeless mode, should legacy NativeModules use the TurboModule system?
   */
  RN_EXPORT static bool useTurboModuleInterop();

  /**
   * Outset the culling context frame with the provided ratio. The culling context frame size will be outset by width * ratio on the left and right, and height * ratio on the top and bottom.
   */
  RN_EXPORT static double viewCullingOutsetRatio();

  /**
   * Enable the View Transition API for animating transitions between views.
   */
  RN_EXPORT static bool viewTransitionEnabled();

  /**
   * Use hardware bitmaps for view transition snapshots on Android.
   */
  RN_EXPORT static bool viewTransitionUseHardwareBitmapAndroid();

  /**
   * Initial prerender ratio for VirtualView.
   */
  RN_EXPORT static double virtualViewPrerenderRatio();

  /**
   * Overrides the feature flags with the ones provided by the given provider
   * (generally one that extends `ReactNativeFeatureFlagsDefaults`).
   *
   * This method must be called before you initialize the React Native runtime.
   *
   * @example
   *
   * ```
   * class MyReactNativeFeatureFlags : public ReactNativeFeatureFlagsDefaults {
   *  public:
   *   bool someFlag() override;
   * };
   *
   * ReactNativeFeatureFlags.override(
   *     std::make_unique<MyReactNativeFeatureFlags>());
   * ```
   */
  RN_EXPORT static void override(
      std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);

  /**
   * Removes the overridden feature flags and makes the API return default
   * values again.
   *
   * This is **dangerous**. Use it only if you really understand the
   * implications of this method.
   *
   * This should only be called if you destroy the React Native runtime and
   * need to create a new one with different overrides. In that case,
   * call `dangerouslyReset` after destroying the runtime and `override` again
   * before initializing the new one.
   */
  RN_EXPORT static void dangerouslyReset();

  /**
   * This is a combination of `dangerouslyReset` and `override` that reduces
   * the likeliness of a race condition between the two calls.
   *
   * This is **dangerous** because it can introduce consistency issues that will
   * be much harder to debug. For example, it could hide the fact that feature
   * flags are read before you set the values you want to use everywhere. It
   * could also cause a workflow to suddenly have different feature flags for
   * behaviors that were configured with different values before.
   *
   * Please see the documentation of `dangerouslyReset` for additional details.
   */
  RN_EXPORT static std::optional<std::string> dangerouslyForceOverride(
      std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);

 private:
  ReactNativeFeatureFlags() = delete;
  static ReactNativeFeatureFlagsAccessor& getAccessor();
};

} // namespace facebook::react
