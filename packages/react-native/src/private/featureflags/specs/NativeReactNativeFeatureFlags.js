/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<4f1cda704a4ec31a005ded7ee8df3cbf>>
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

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly commonTestFlag?: () => boolean;
  readonly commonTestFlagWithoutNativeImplementation?: () => boolean;
  readonly cdpInteractionMetricsEnabled?: () => boolean;
  readonly cxxNativeAnimatedEnabled?: () => boolean;
  readonly defaultTextToOverflowHidden?: () => boolean;
  readonly disableEarlyViewCommandExecution?: () => boolean;
  readonly disableImageViewPreallocationAndroid?: () => boolean;
  readonly disableMountItemReorderingAndroid?: () => boolean;
  readonly disableSubviewClippingAndroid?: () => boolean;
  readonly disableTextLayoutManagerCacheAndroid?: () => boolean;
  readonly disableViewPreallocationAndroid?: () => boolean;
  readonly enableAccessibilityOrder?: () => boolean;
  readonly enableAccumulatedUpdatesInRawPropsAndroid?: () => boolean;
  readonly enableAndroidTextMeasurementOptimizations?: () => boolean;
  readonly enableBridgelessArchitecture?: () => boolean;
  readonly enableCppPropsIteratorSetter?: () => boolean;
  readonly enableCustomFocusSearchOnClippedElementsAndroid?: () => boolean;
  readonly enableDestroyShadowTreeRevisionAsync?: () => boolean;
  readonly enableDoubleMeasurementFixAndroid?: () => boolean;
  readonly enableEagerRootViewAttachment?: () => boolean;
  readonly enableExclusivePropsUpdateAndroid?: () => boolean;
  readonly enableFabricCommitBranching?: () => boolean;
  readonly enableFabricLogs?: () => boolean;
  readonly enableFlexboxAutoMinSizeInStrictMode?: () => boolean;
  readonly enableFontScaleChangesUpdatingLayout?: () => boolean;
  readonly enableIOSTextBaselineOffsetPerLine?: () => boolean;
  readonly enableIOSViewClipToPaddingBox?: () => boolean;
  readonly enableImagePrefetchingAndroid?: () => boolean;
  readonly enableImageRequestDowngradingForNonVisibleImages?: () => boolean;
  readonly enableImmediateUpdateModeForContentOffsetChanges?: () => boolean;
  readonly enableImperativeFocus?: () => boolean;
  readonly enableInteropViewManagerClassLookUpOptimizationIOS?: () => boolean;
  readonly enableIntersectionObserverByDefault?: () => boolean;
  readonly enableKeyEvents?: () => boolean;
  readonly enableLayoutAnimationsOnAndroid?: () => boolean;
  readonly enableLayoutAnimationsOnIOS?: () => boolean;
  readonly enableModuleArgumentNSNullConversionIOS?: () => boolean;
  readonly enableMutationObserverByDefault?: () => boolean;
  readonly enableNativeCSSParsing?: () => boolean;
  readonly enableNetworkEventReporting?: () => boolean;
  readonly enablePreparedTextLayout?: () => boolean;
  readonly enablePropsUpdateReconciliationAndroid?: () => boolean;
  readonly enableRuntimeSchedulerQueueClearingOnError?: () => boolean;
  readonly enableSchedulerDelegateInvalidation?: () => boolean;
  readonly enableSwiftUIBasedFilters?: () => boolean;
  readonly enableViewCulling?: () => boolean;
  readonly enableViewRecycling?: () => boolean;
  readonly enableViewRecyclingForImage?: () => boolean;
  readonly enableViewRecyclingForScrollView?: () => boolean;
  readonly enableViewRecyclingForText?: () => boolean;
  readonly enableViewRecyclingForView?: () => boolean;
  readonly enableVirtualViewContainerStateExperimental?: () => boolean;
  readonly fixDifferentiatorParentTagForUnflattenCase?: () => boolean;
  readonly fixMappingOfEventPrioritiesBetweenFabricAndReact?: () => boolean;
  readonly fixYogaFlexBasisFitContentInMainAxis?: () => boolean;
  readonly fuseboxAssertSingleHostState?: () => boolean;
  readonly fuseboxEnabledRelease?: () => boolean;
  readonly fuseboxFrameRecordingEnabled?: () => boolean;
  readonly fuseboxNetworkInspectionEnabled?: () => boolean;
  readonly fuseboxScreenshotCaptureEnabled?: () => boolean;
  readonly optimizedAnimatedPropUpdates?: () => boolean;
  readonly overrideBySynchronousMountPropsAtMountingAndroid?: () => boolean;
  readonly perfIssuesEnabled?: () => boolean;
  readonly perfMonitorV2Enabled?: () => boolean;
  readonly preparedTextCacheSize?: () => number;
  readonly preventShadowTreeCommitExhaustion?: () => boolean;
  readonly redBoxV2Android?: () => boolean;
  readonly redBoxV2IOS?: () => boolean;
  readonly shouldPressibilityUseW3CPointerEventsForHover?: () => boolean;
  readonly shouldTriggerResponderTransferOnScrollAndroid?: () => boolean;
  readonly skipActivityIdentityAssertionOnHostPause?: () => boolean;
  readonly syncAndroidClipBoundsWithOverflow?: () => boolean;
  readonly traceTurboModulePromiseRejectionsOnAndroid?: () => boolean;
  readonly updateRuntimeShadowNodeReferencesOnCommit?: () => boolean;
  readonly updateRuntimeShadowNodeReferencesOnCommitThread?: () => boolean;
  readonly useAlwaysAvailableJSErrorHandling?: () => boolean;
  readonly useFabricInterop?: () => boolean;
  readonly useNativeViewConfigsInBridgelessMode?: () => boolean;
  readonly useNestedScrollViewAndroid?: () => boolean;
  readonly useOptimizedViewRegistryOnAndroid?: () => boolean;
  readonly useSharedAnimatedBackend?: () => boolean;
  readonly useTraitHiddenOnAndroid?: () => boolean;
  readonly useTurboModuleInterop?: () => boolean;
  readonly viewCullingOutsetRatio?: () => number;
  readonly viewTransitionEnabled?: () => boolean;
  readonly viewTransitionUseHardwareBitmapAndroid?: () => boolean;
  readonly virtualViewPrerenderRatio?: () => number;
}

const NativeReactNativeFeatureFlags: ?Spec = TurboModuleRegistry.get<Spec>(
  'NativeReactNativeFeatureFlagsCxx',
);

export default NativeReactNativeFeatureFlags;
