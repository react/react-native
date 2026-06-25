/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PartialViewConfigWithoutName} from './PlatformBaseViewConfig';

import ReactNativeStyleAttributes from '../Components/View/ReactNativeStyleAttributes';
import {
  backgroundImageAttribute,
  backgroundPositionAttribute,
  backgroundRepeatAttribute,
  backgroundSizeAttribute,
  boxShadowAttribute,
  colorAttribute,
  filterAttribute,
} from '../Components/View/ReactNativeStyleAttributes';
import {DynamicallyInjectedByGestureHandler} from './ViewConfigIgnore';

const bubblingEventTypes = {
  // Bubbling events from UIManagerModuleConstants.java
  topChange: {
    phasedRegistrationNames: {
      captured: 'onChangeCapture',
      bubbled: 'onChange',
    },
  },
  topSelect: {
    phasedRegistrationNames: {
      captured: 'onSelectCapture',
      bubbled: 'onSelect',
    },
  },
  topTouchEnd: {
    phasedRegistrationNames: {
      captured: 'onTouchEndCapture',
      bubbled: 'onTouchEnd',
    },
  },
  topTouchCancel: {
    phasedRegistrationNames: {
      captured: 'onTouchCancelCapture',
      bubbled: 'onTouchCancel',
    },
  },
  topTouchStart: {
    phasedRegistrationNames: {
      captured: 'onTouchStartCapture',
      bubbled: 'onTouchStart',
    },
  },
  topTouchMove: {
    phasedRegistrationNames: {
      captured: 'onTouchMoveCapture',
      bubbled: 'onTouchMove',
    },
  },

  // Experimental/Work in Progress Pointer Events (not yet ready for use)
  topPointerCancel: {
    phasedRegistrationNames: {
      captured: 'onPointerCancelCapture',
      bubbled: 'onPointerCancel',
    },
  },
  topPointerDown: {
    phasedRegistrationNames: {
      captured: 'onPointerDownCapture',
      bubbled: 'onPointerDown',
    },
  },
  topPointerEnter: {
    phasedRegistrationNames: {
      captured: 'onPointerEnterCapture',
      bubbled: 'onPointerEnter',
      skipBubbling: true,
    },
  },
  topPointerLeave: {
    phasedRegistrationNames: {
      captured: 'onPointerLeaveCapture',
      bubbled: 'onPointerLeave',
      skipBubbling: true,
    },
  },
  topPointerMove: {
    phasedRegistrationNames: {
      captured: 'onPointerMoveCapture',
      bubbled: 'onPointerMove',
    },
  },
  topPointerUp: {
    phasedRegistrationNames: {
      captured: 'onPointerUpCapture',
      bubbled: 'onPointerUp',
    },
  },
  topPointerOut: {
    phasedRegistrationNames: {
      captured: 'onPointerOutCapture',
      bubbled: 'onPointerOut',
    },
  },
  topPointerOver: {
    phasedRegistrationNames: {
      captured: 'onPointerOverCapture',
      bubbled: 'onPointerOver',
    },
  },
  topGotPointerCapture: {
    phasedRegistrationNames: {
      captured: 'onGotPointerCaptureCapture',
      bubbled: 'onGotPointerCapture',
    },
  },
  topLostPointerCapture: {
    phasedRegistrationNames: {
      captured: 'onLostPointerCaptureCapture',
      bubbled: 'onLostPointerCapture',
    },
  },
  topClick: {
    phasedRegistrationNames: {
      captured: 'onClickCapture',
      bubbled: 'onClick',
    },
  },
  topBlur: {
    phasedRegistrationNames: {
      captured: 'onBlurCapture',
      bubbled: 'onBlur',
    },
  },
  topFocus: {
    phasedRegistrationNames: {
      captured: 'onFocusCapture',
      bubbled: 'onFocus',
    },
  },
  topKeyDown: {
    phasedRegistrationNames: {
      captured: 'onKeyDownCapture',
      bubbled: 'onKeyDown',
    },
  },
  topKeyUp: {
    phasedRegistrationNames: {
      captured: 'onKeyUpCapture',
      bubbled: 'onKeyUp',
    },
  },
};

const directEventTypes = {
  topAccessibilityAction: {
    registrationName: 'onAccessibilityAction',
  },
  onGestureHandlerEvent: DynamicallyInjectedByGestureHandler({
    registrationName: 'onGestureHandlerEvent',
  }),
  onGestureHandlerStateChange: DynamicallyInjectedByGestureHandler({
    registrationName: 'onGestureHandlerStateChange',
  }),

  // Direct events from UIManagerModuleConstants.java
  topContentSizeChange: {
    registrationName: 'onContentSizeChange',
  },
  topScrollBeginDrag: {
    registrationName: 'onScrollBeginDrag',
  },
  topMessage: {
    registrationName: 'onMessage',
  },
  topSelectionChange: {
    registrationName: 'onSelectionChange',
  },
  topLoadingFinish: {
    registrationName: 'onLoadingFinish',
  },
  topMomentumScrollEnd: {
    registrationName: 'onMomentumScrollEnd',
  },
  topLoadingStart: {
    registrationName: 'onLoadingStart',
  },
  topLoadingError: {
    registrationName: 'onLoadingError',
  },
  topMomentumScrollBegin: {
    registrationName: 'onMomentumScrollBegin',
  },
  topScrollEndDrag: {
    registrationName: 'onScrollEndDrag',
  },
  topScroll: {
    registrationName: 'onScroll',
  },
  topLayout: {
    registrationName: 'onLayout',
  },
};

const validAttributesForNonEventProps = {
  // @ReactProps from BaseViewManager
  backgroundColor: colorAttribute,
  transform: true,
  transformOrigin: true,
  backgroundImage: backgroundImageAttribute,
  experimental_backgroundImage: backgroundImageAttribute,
  experimental_backgroundSize: backgroundSizeAttribute,
  experimental_backgroundPosition: backgroundPositionAttribute,
  experimental_backgroundRepeat: backgroundRepeatAttribute,
  boxShadow: boxShadowAttribute,
  filter: filterAttribute,
  mixBlendMode: true,
  isolation: true,
  opacity: true,
  elevation: true,
  shadowColor: colorAttribute,
  zIndex: true,
  renderToHardwareTextureAndroid: true,
  testID: true,
  nativeID: true,
  id: true,
  accessibilityLabelledBy: true,
  accessibilityLabel: true,
  accessibilityHint: true,
  accessibilityRole: true,
  accessibilityCollection: true,
  accessibilityCollectionItem: true,
  accessibilityState: true,
  accessibilityActions: true,
  accessibilityValue: true,
  experimental_accessibilityOrder: true,
  importantForAccessibility: true,
  screenReaderFocusable: true,
  'aria-busy': true,
  'aria-checked': true,
  'aria-disabled': true,
  'aria-expanded': true,
  'aria-hidden': true,
  'aria-label': true,
  'aria-labelledby': true,
  'aria-live': true,
  'aria-selected': true,
  'aria-valuemax': true,
  'aria-valuemin': true,
  'aria-valuenow': true,
  'aria-valuetext': true,
  role: true,
  rotation: true,
  scaleX: true,
  scaleY: true,
  translateX: true,
  translateY: true,
  accessibilityLiveRegion: true,

  // @ReactProps from LayoutShadowNode
  width: true,
  minWidth: true,
  collapsable: true,
  collapsableChildren: true,
  maxWidth: true,
  height: true,
  minHeight: true,
  maxHeight: true,
  flex: true,
  flexGrow: true,
  rowGap: true,
  columnGap: true,
  gap: true,
  flexShrink: true,
  flexBasis: true,
  aspectRatio: true,
  flexDirection: true,
  flexWrap: true,
  alignSelf: true,
  alignItems: true,
  alignContent: true,
  justifyContent: true,
  overflow: true,
  display: true,
  boxSizing: true,

  margin: true,
  marginBlock: true,
  marginBlockEnd: true,
  marginBlockStart: true,
  marginBottom: true,
  marginEnd: true,
  marginHorizontal: true,
  marginInline: true,
  marginInlineEnd: true,
  marginInlineStart: true,
  marginLeft: true,
  marginRight: true,
  marginStart: true,
  marginTop: true,
  marginVertical: true,

  padding: true,
  paddingBlock: true,
  paddingBlockEnd: true,
  paddingBlockStart: true,
  paddingBottom: true,
  paddingEnd: true,
  paddingHorizontal: true,
  paddingInline: true,
  paddingInlineEnd: true,
  paddingInlineStart: true,
  paddingLeft: true,
  paddingRight: true,
  paddingStart: true,
  paddingTop: true,
  paddingVertical: true,

  borderWidth: true,
  borderStartWidth: true,
  borderEndWidth: true,
  borderTopWidth: true,
  borderBottomWidth: true,
  borderLeftWidth: true,
  borderRightWidth: true,

  outlineColor: colorAttribute,
  outlineOffset: true,
  outlineStyle: true,
  outlineWidth: true,

  start: true,
  end: true,
  left: true,
  right: true,
  top: true,
  bottom: true,

  inset: true,
  insetBlock: true,
  insetBlockEnd: true,
  insetBlockStart: true,
  insetInline: true,
  insetInlineEnd: true,
  insetInlineStart: true,

  position: true,

  style: ReactNativeStyleAttributes,

  // ReactClippingViewManager @ReactProps
  removeClippedSubviews: true,

  // ReactViewManager @ReactProps
  accessible: true,
  hasTVPreferredFocus: true,
  nextFocusDown: true,
  nextFocusForward: true,
  nextFocusLeft: true,
  nextFocusRight: true,
  nextFocusUp: true,

  borderRadius: true,
  borderTopLeftRadius: true,
  borderTopRightRadius: true,
  borderBottomRightRadius: true,
  borderBottomLeftRadius: true,
  borderTopStartRadius: true,
  borderTopEndRadius: true,
  borderBottomStartRadius: true,
  borderBottomEndRadius: true,
  borderEndEndRadius: true,
  borderEndStartRadius: true,
  borderStartEndRadius: true,
  borderStartStartRadius: true,
  borderStyle: true,
  hitSlop: true,
  pointerEvents: true,
  nativeBackgroundAndroid: true,
  nativeForegroundAndroid: true,
  needsOffscreenAlphaCompositing: true,

  borderColor: colorAttribute,
  borderLeftColor: colorAttribute,
  borderRightColor: colorAttribute,
  borderTopColor: colorAttribute,
  borderBottomColor: colorAttribute,
  borderStartColor: colorAttribute,
  borderEndColor: colorAttribute,
  borderBlockColor: colorAttribute,
  borderBlockEndColor: colorAttribute,
  borderBlockStartColor: colorAttribute,
  focusable: true,
  tabIndex: true,
  backfaceVisibility: true,
} as const;

// Props for bubbling and direct events
const validAttributesForEventProps = {
  onLayout: true,

  // PanResponder handlers
  onMoveShouldSetResponder: true,
  onMoveShouldSetResponderCapture: true,
  onStartShouldSetResponder: true,
  onStartShouldSetResponderCapture: true,
  onResponderGrant: true,
  onResponderReject: true,
  onResponderStart: true,
  onResponderEnd: true,
  onResponderRelease: true,
  onResponderMove: true,
  onResponderTerminate: true,
  onResponderTerminationRequest: true,
  onShouldBlockNativeResponder: true,

  // Touch events
  onTouchStart: true,
  onTouchMove: true,
  onTouchEnd: true,
  onTouchCancel: true,

  // Pointer events
  onClick: true,
  onClickCapture: true,
  onPointerEnter: true,
  onPointerEnterCapture: true,
  onPointerLeave: true,
  onPointerLeaveCapture: true,
  onPointerMove: true,
  onPointerMoveCapture: true,
  onPointerOut: true,
  onPointerOutCapture: true,
  onPointerOver: true,
  onPointerOverCapture: true,
  onGotPointerCapture: true,
  onGotPointerCaptureCapture: true,
  onLostPointerCapture: true,
  onLostPointerCaptureCapture: true,
} as const;

/**
 * On Android, Props are derived from a ViewManager and its ShadowNode.
 *
 * Where did we find these base platform props from?
 * - Nearly all component ViewManagers descend from BaseViewManager,
 * - and BaseViewManagers' ShadowNodes descend from LayoutShadowNode.
 * - Also, all components inherit ViewConfigs from UIManagerModuleConstants.java.
 *
 * So, these ViewConfigs are generated from LayoutShadowNode and BaseViewManager.
 */
const PlatformBaseViewConfigAndroid: PartialViewConfigWithoutName = {
  directEventTypes,
  bubblingEventTypes,
  validAttributes: {
    ...validAttributesForNonEventProps,
    ...validAttributesForEventProps,
  },
};

export default PlatformBaseViewConfigAndroid;
