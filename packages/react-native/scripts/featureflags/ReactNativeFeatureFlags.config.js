/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/* eslint sort-keys: 'error' */

import type {FeatureFlagDefinitions} from './types';

/**
 * This is the source of truth for React Native feature flags.
 *
 * If you modify this file, you need to update all the generated files
 * running the following script from the repo root:
 *   yarn featureflags --update
 */

// These flags are only used in tests for the feature flags system
const testDefinitions: FeatureFlagDefinitions = {
  common: {
    commonTestFlag: {
      defaultValue: false,
      metadata: {
        description: 'Common flag for testing. Do NOT modify.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
    commonTestFlagWithoutNativeImplementation: {
      defaultValue: false,
      metadata: {
        description:
          'Common flag for testing (without native implementation). Do NOT modify.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
      skipNativeAPI: true,
    },
  },
  jsOnly: {
    jsOnlyTestFlag: {
      defaultValue: false,
      metadata: {
        description: 'JS-only flag for testing. Do NOT modify.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
  },
};

const definitions: FeatureFlagDefinitions = {
  common: {
    ...testDefinitions.common,
    cdpInteractionMetricsEnabled: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-07-16',
        description:
          'Enable emitting of InteractionEntry live metrics to the debugger. Requires `enableBridgelessArchitecture`.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    cxxNativeAnimatedEnabled: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-03-14',
        description:
          'Use a C++ implementation of Native Animated instead of the platform implementation.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    defaultTextToOverflowHidden: {
      defaultValue: true,
      metadata: {
        dateAdded: '2026-02-13',
        description:
          'When enabled, sets the default overflow style for Text components to hidden instead of visible.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    disableEarlyViewCommandExecution: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-10-07',
        description: 'Dispatch view commands in mount item order.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    disableImageViewPreallocationAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-11-07',
        description:
          'Force disable view preallocation for images triggered from createNode off the main thread on Android',
        expectedReleaseValue: false,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    disableMountItemReorderingAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-10-26',
        description:
          'Prevent FabricMountingManager from reordering mountItems, which may lead to invalid state on the UI thread',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    disableSubviewClippingAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-11-05',
        description:
          'Force disable subview clipping for ReactViewGroup on Android',
        expectedReleaseValue: false,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    disableTextLayoutManagerCacheAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-05-28',
        description:
          'Turns off the global measurement cache used by TextLayoutManager on Android.',
        expectedReleaseValue: false,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    disableViewPreallocationAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-11-07',
        description:
          'Force disable view preallocation triggered from createNode off the main thread on Android',
        expectedReleaseValue: false,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableAccessibilityOrder: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-4-3',
        description:
          'When enabled, the accessibilityOrder prop will propagate to native platforms and define the accessibility order.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'experimental',
    },
    enableAccumulatedUpdatesInRawPropsAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-12-10',
        description:
          'When enabled, Android will accumulate updates in rawProps to reduce the number of mounting instructions for cascading re-renders.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableAndroidAntialiasedBorderRadiusClipping: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-11-14',
        description:
          'Enable antialiased border radius clipping for Android API 28 and below using manual masking with Porter-Duff compositing',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableAndroidLinearText: {
      defaultValue: true,
      metadata: {
        dateAdded: '2025-09-09',
        description:
          'Enables linear text rendering on Android wherever subpixel text rendering is enabled',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableAndroidTextMeasurementOptimizations: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-07-01',
        description:
          'Enables various optimizations throughout the path of measuring text on Android.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableBridgelessArchitecture: {
      defaultValue: false,
      metadata: {
        description:
          'Feature flag to enable the new bridgeless architecture. Note: Enabling this will force enable the following flags: `useTurboModules` & `enableFabricRenderer`.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'canary',
    },
    enableCppPropsIteratorSetter: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-09-13',
        description:
          'Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableCustomFocusSearchOnClippedElementsAndroid: {
      defaultValue: true,
      metadata: {
        description:
          'This enables the fabric implementation of focus search so that we can focus clipped elements',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
    enableDestroyShadowTreeRevisionAsync: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-04-29',
        description:
          'Enables destructor calls for ShadowTreeRevision in the background to reduce UI thread work.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableDifferentiatorMutationVectorPreallocation: {
      defaultValue: false,
      metadata: {
        dateAdded: '2026-02-28',
        description:
          'Pre-allocate mutation vectors in the Differentiator to reduce reallocation overhead during shadow view diffing.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableDoubleMeasurementFixAndroid: {
      defaultValue: false,
      metadata: {
        description:
          'When enabled a subset of components will avoid double measurement on Android.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
    enableEagerMainQueueModulesOnIOS: {
      defaultValue: false,
      metadata: {
        description:
          'This infra allows native modules to initialize on the main thread, during React Native init.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableEagerRootViewAttachment: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-28',
        description:
          'Feature flag to configure eager attachment of the root view/initialisation of the JS code.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableExclusivePropsUpdateAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-11-11',
        description:
          'When enabled, Android will disable Props 1.5 raw value merging when Props 2.0 is available.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableFabricCommitBranching: {
      defaultValue: false,
      metadata: {
        description:
          'Enables Fabric commit branching to fix starvation problems and atomic JS updates.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableFabricLogs: {
      defaultValue: false,
      metadata: {
        description: 'This feature flag enables logs for Fabric.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
    enableFabricRenderer: {
      defaultValue: false,
      metadata: {
        description: 'Enables the use of the Fabric renderer in the whole app.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'canary',
    },
    enableFontScaleChangesUpdatingLayout: {
      defaultValue: true,
      metadata: {
        dateAdded: '2025-04-07',
        description:
          'Enables font scale changes updating layout for measurable nodes.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableIOSTextBaselineOffsetPerLine: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-05-21',
        description:
          'Applies base offset for each line of text separately on iOS.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableIOSViewClipToPaddingBox: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-08-30',
        description: 'iOS Views will clip to their padding box vs border box',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableImagePrefetchingAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-06-21',
        description:
          'When enabled, Android will build and initiate image prefetch requests on ImageShadowNode::layout',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableImagePrefetchingJNIBatchingAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-11-10',
        description:
          'When enabled, Android will build and initiate image prefetch requests on ImageShadowNode::layout and batch them together in a single JNI call',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableImagePrefetchingOnUiThreadAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-09-02',
        description:
          'When enabled, Android will initiate image prefetch requested on ImageShadowNode::layout on the UI thread',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableImmediateUpdateModeForContentOffsetChanges: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-07-15',
        description:
          'Dispatches state updates for content offset changes synchronously on the main thread.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableImperativeFocus: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-09-13',
        description:
          'Enable ref.focus() and ref.blur() for all views, not just TextInput.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableInteropViewManagerClassLookUpOptimizationIOS: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-06-17',
        description:
          'This is to fix the issue with interop view manager where component descriptor lookup is causing ViewManager to preload.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableIntersectionObserverByDefault: {
      defaultValue: false,
      metadata: {
        description:
          'Enables the IntersectionObserver Web API in React Native.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'canary',
    },
    enableKeyEvents: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-10-17',
        description:
          'Enables key up/down/press events to be sent to JS from components',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableLayoutAnimationsOnAndroid: {
      defaultValue: false,
      metadata: {
        description:
          'When enabled, LayoutAnimations API will animate state changes on Android.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableLayoutAnimationsOnIOS: {
      defaultValue: true,
      metadata: {
        description:
          'When enabled, LayoutAnimations API will animate state changes on iOS.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableMainQueueCoordinatorOnIOS: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-05-17',
        description:
          'Make RCTUnsafeExecuteOnMainQueueSync less likely to deadlock, when used in conjuction with sync rendering/events.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableModuleArgumentNSNullConversionIOS: {
      defaultValue: false,
      metadata: {
        description:
          'Enable NSNull conversion when handling module arguments on iOS',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableMutationObserverByDefault: {
      defaultValue: false,
      metadata: {
        description: 'Enables the MutationObserver Web API in React Native.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enableNativeCSSParsing: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-02-07',
        description:
          'Parse CSS strings using the Fabric CSS parser instead of ViewConfig processing',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableNativeViewPropTransformations: {
      defaultValue: false,
      metadata: {
        dateAdded: '2026-02-26',
        description:
          'When enabled, View.js passes aria-*, id, and tabIndex props directly to native, relying on C++ prop parsing instead of JS-side transformations.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableNetworkEventReporting: {
      defaultValue: true,
      metadata: {
        description:
          'Enable network event reporting hooks in each native platform through `NetworkReporter` (Web Perf APIs + CDP). This flag should be combined with `fuseboxNetworkInspectionEnabled` to enable Network CDP debugging.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    enablePreparedTextLayout: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-05-01',
        description: 'Enables caching text layout artifacts for later reuse',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enablePropsUpdateReconciliationAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-12',
        description:
          'When enabled, Android will receive prop updates based on the differences between the last rendered shadow node and the last committed shadow node.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableSwiftUIBasedFilters: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-07-30',
        description:
          'When enabled, it will use SwiftUI for filter effects like blur on iOS.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'experimental',
    },
    enableViewCulling: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-01-27',
        description:
          'Enables View Culling: as soon as a view goes off screen, it can be reused anywhere in the UI and pieced together with other items to create new UI elements.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableViewRecycling: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-31',
        description:
          'Enables View Recycling. When enabled, individual ViewManagers must still opt-in.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableViewRecyclingForImage: {
      defaultValue: true,
      metadata: {
        dateAdded: '2025-09-04',
        description:
          'Enables View Recycling for <Image> via ReactViewGroup/ReactViewManager.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableViewRecyclingForScrollView: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-08-20',
        description:
          'Enables View Recycling for <ScrollView> via ReactViewGroup/ReactViewManager.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableViewRecyclingForText: {
      defaultValue: true,
      metadata: {
        dateAdded: '2025-02-05',
        description:
          'Enables View Recycling for <Text> via ReactTextView/ReactTextViewManager.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableViewRecyclingForView: {
      defaultValue: true,
      metadata: {
        dateAdded: '2025-02-05',
        description:
          'Enables View Recycling for <View> via ReactViewGroup/ReactViewManager.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableVirtualViewContainerStateExperimental: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-10-09',
        description:
          'Enables the experimental version of `VirtualViewContainerState`.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    enableVirtualViewDebugFeatures: {
      defaultValue: false,
      metadata: {
        description:
          'Enables VirtualView debug features such as logging and overlays.',
        expectedReleaseValue: false,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
    fixFindShadowNodeByTagRaceCondition: {
      defaultValue: false,
      metadata: {
        dateAdded: '2026-02-25',
        description:
          'Fix a use-after-free race condition in findShadowNodeByTag_DEPRECATED by using getCurrentRevision() instead of tryCommit() with a raw pointer.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    fixMappingOfEventPrioritiesBetweenFabricAndReact: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-06-18',
        description:
          'Uses the default event priority instead of the discreet event priority by default when dispatching events from Fabric to React.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    fixTextClippingAndroid15useBoundsForWidth: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-12-03',
        description:
          'Fix text clipping starting in Android 15 due to usage of useBoundsForWidth',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'experimental',
    },
    fixYogaFlexBasisFitContentInMainAxis: {
      defaultValue: false,
      metadata: {
        dateAdded: '2026-03-09',
        description:
          'Fix flex basis computation to not apply FitContent constraint in the main axis for non-measure container nodes, preventing unnecessary re-measurement in scroll containers.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    fuseboxAssertSingleHostState: {
      defaultValue: true,
      metadata: {
        description:
          'Enable system assertion validating that Fusebox is configured with a single host. When set, the CDP backend will dynamically disable features (Perf and Network) in the event that multiple hosts are registered (undefined behaviour), and broadcast this over `ReactNativeApplication.systemStateChanged`.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'stable',
    },
    fuseboxEnabledRelease: {
      defaultValue: false,
      metadata: {
        description:
          'Flag determining if the React Native DevTools (Fusebox) CDP backend should be enabled in release builds. This flag is global and should not be changed across React Host lifetimes.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    fuseboxFrameRecordingEnabled: {
      defaultValue: false,
      metadata: {
        dateAdded: '2026-03-05',
        description:
          'Enable frame timings and screenshots support in the React Native DevTools CDP backend. This flag is global and should not be changed across React Host lifetimes.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    fuseboxNetworkInspectionEnabled: {
      defaultValue: true,
      metadata: {
        dateAdded: '2024-01-31',
        description:
          'Enable network inspection support in the React Native DevTools CDP backend. Requires `enableBridgelessArchitecture`. This flag is global and should not be changed across React Host lifetimes.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    hideOffscreenVirtualViewsOnIOS: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-06-30',
        description:
          'Hides offscreen VirtualViews on iOS by setting hidden = YES to avoid extra cost of views',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    overrideBySynchronousMountPropsAtMountingAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-09-04',
        description:
          'Override props at mounting with synchronously mounted (i.e. direct manipulation) props from Native Animated.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    perfIssuesEnabled: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-10-24',
        description:
          'Enable reporting Performance Issues (`detail.devtools.performanceIssue`). Displayed in the V2 Performance Monitor and the "Performance Issues" sub-panel in DevTools.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    perfMonitorV2Enabled: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-07-16',
        description:
          'Enable the V2 in-app Performance Monitor. This flag is global and should not be changed across React Host lifetimes.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    preparedTextCacheSize: {
      defaultValue: 200,
      metadata: {
        dateAdded: '2025-06-25',
        description: 'Number cached PreparedLayouts in TextLayoutManager cache',
        expectedReleaseValue: 200,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    preventShadowTreeCommitExhaustion: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-07-23',
        description:
          'Enables a new mechanism in ShadowTree to prevent problems caused by multiple threads trying to commit concurrently. If a thread tries to commit a few times unsuccessfully, it will acquire a lock and try again.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'experimental',
    },
    shouldPressibilityUseW3CPointerEventsForHover: {
      defaultValue: false,
      metadata: {
        description:
          'Function used to enable / disable Pressibility from using W3C Pointer Events for its hover callbacks',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    shouldTriggerResponderTransferOnScrollAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-09-30',
        description:
          'Do not emit touchcancel from Android ScrollView, instead native topScroll event will trigger responder transfer and terminate in RN renderer.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    skipActivityIdentityAssertionOnHostPause: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-07-15',
        description:
          'Skip activity identity assertion in ReactHostImpl::onHostPause()',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    syncAndroidClipToPaddingWithOverflow: {
      defaultValue: false,
      metadata: {
        description:
          'Sync clipToPadding on Android views with the overflow property',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    traceTurboModulePromiseRejectionsOnAndroid: {
      defaultValue: false,
      metadata: {
        description:
          'Enables storing js caller stack when creating promise in native module. This is useful in case of Promise rejection and tracing the cause.',
        expectedReleaseValue: true,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
    updateRuntimeShadowNodeReferencesOnCommit: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-04-15',
        description:
          'When enabled, runtime shadow node references will be updated during the commit. This allows running RSNRU from any thread without corrupting the renderer state.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    updateRuntimeShadowNodeReferencesOnCommitThread: {
      defaultValue: false,
      metadata: {
        dateAdded: '2026-02-11',
        description:
          'When enabled, runtime shadow node references will be updated during the commit only on the allowed thread.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    useAlwaysAvailableJSErrorHandling: {
      defaultValue: false,
      metadata: {
        description:
          'In Bridgeless mode, use the always available javascript error reporting pipeline.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    useFabricInterop: {
      defaultValue: true,
      metadata: {
        description:
          'Should this application enable the Fabric Interop Layer for Android? If yes, the application will behave so that it can accept non-Fabric components and render them on Fabric. This toggle is controlling extra logic such as custom event dispatching that are needed for the Fabric Interop Layer to work correctly.',
        expectedReleaseValue: false,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    useLISAlgorithmInDifferentiator: {
      defaultValue: false,
      metadata: {
        dateAdded: '2026-03-12',
        description:
          'Use Longest Increasing Subsequence algorithm in the Differentiator to minimize REMOVE/INSERT mutations during child list reconciliation.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    useNativeViewConfigsInBridgelessMode: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-04-03',
        description:
          'When enabled, the native view configs are used in bridgeless mode.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'canary',
    },
    useNestedScrollViewAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2026-01-16',
        description:
          'When enabled, ReactScrollView will extend NestedScrollView instead of ScrollView on Android for improved nested scrolling support.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    useSharedAnimatedBackend: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-08-2',
        description: 'Use shared animation backend in C++ Animated',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    useTraitHiddenOnAndroid: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-10-9',
        description: 'Use Trait::hidden on Android',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    useTurboModuleInterop: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-07-28',
        description:
          'In Bridgeless mode, should legacy NativeModules use the TurboModule system?',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'canary',
    },
    useTurboModules: {
      defaultValue: false,
      metadata: {
        description:
          'When enabled, NativeModules will be executed by using the TurboModule system',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'canary',
    },
    useUnorderedMapInDifferentiator: {
      defaultValue: false,
      metadata: {
        dateAdded: '2026-02-26',
        description:
          'Use std::unordered_map instead of TinyMap in the Differentiator for improved lookup performance.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    viewCullingOutsetRatio: {
      defaultValue: 0,
      metadata: {
        dateAdded: '2025-09-18',
        description:
          'Outset the culling context frame with the provided ratio. The culling context frame size will be outset by width * ratio on the left and right, and height * ratio on the top and bottom.',
        expectedReleaseValue: 0,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    viewTransitionEnabled: {
      defaultValue: false,
      metadata: {
        dateAdded: '2026-02-09',
        description:
          'Enable the View Transition API for animating transitions between views.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    virtualViewPrerenderRatio: {
      defaultValue: 5,
      metadata: {
        description: 'Initial prerender ratio for VirtualView.',
        expectedReleaseValue: 5,
        purpose: 'operational',
      },
      ossReleaseStage: 'none',
    },
  },

  jsOnly: {
    ...testDefinitions.jsOnly,
    animatedShouldDebounceQueueFlush: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-02-05',
        description:
          'Enables an experimental flush-queue debouncing in Animated.js.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    animatedShouldUseSingleOp: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-02-05',
        description:
          'Enables an experimental mega-operation for Animated.js that replaces many calls to native with a single call into native, to reduce JSI/JNI traffic.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    deferFlatListFocusChangeRenderUpdate: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-07-02',
        description:
          'Use the deferred cell render update mechanism for focus change in FlatList.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    disableMaintainVisibleContentPosition: {
      defaultValue: false,
      metadata: {
        dateAdded: '2025-08-26',
        description:
          'Disable prop maintainVisibleContentPosition in ScrollView',
        expectedReleaseValue: false,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    externalElementInspectionEnabled: {
      defaultValue: true,
      metadata: {
        dateAdded: '2026-02-04',
        description:
          'Enable the external inspection API for DevTools to communicate with the Inspector overlay.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    fixVirtualizeListCollapseWindowSize: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-11-22',
        description:
          'Fixing an edge case where the current window size is not properly calculated with fast scrolling. Window size collapsed to 1 element even if windowSize more than the current amount of elements',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    isLayoutAnimationEnabled: {
      defaultValue: true,
      metadata: {
        description:
          'Function used to enable / disabled Layout Animations in React Native.',
        expectedReleaseValue: true,
        purpose: 'release',
      },
      ossReleaseStage: 'none',
    },
    shouldUseAnimatedObjectForTransform: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-02-05',
        description:
          'Enables use of AnimatedObject for animating transform values.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    shouldUseRemoveClippedSubviewsAsDefaultOnIOS: {
      defaultValue: false,
      metadata: {
        dateAdded: '2024-02-05',
        description:
          'removeClippedSubviews prop will be used as the default in FlatList on iOS to match Android',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
    shouldUseSetNativePropsInFabric: {
      defaultValue: true,
      metadata: {
        dateAdded: '2024-03-05',
        description: 'Enables use of setNativeProps in JS driven animations.',
        expectedReleaseValue: true,
        purpose: 'experimentation',
      },
      ossReleaseStage: 'none',
    },
  },
};

// Keep it as a CommonJS module so we can easily import it from Node.js
module.exports = definitions;
