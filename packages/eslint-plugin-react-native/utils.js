/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

/**
 * The correctness of paths is checked in the test file.
 * The assumption is that renaming/removing components shouldn't happen too often.
 * If a new component is added, it should be imported from the root.
 * If the path is not matched, the auto-fix won't be suggested.
 *
 * Mirrors the public API surface declared in `index.js.flow`, plus the re-export
 * aliases below.
 *
 * `index.js.flow` names exactly one source module per export, but several modules
 * re-export the same symbol and call sites import from whichever is closest to hand
 * (e.g. `EventSubscription` is published from `vendor/emitter/EventEmitter` yet also
 * re-exported by `EventEmitter/NativeEventEmitter`). Those aliases are listed
 * explicitly so the rule keeps offering a fix for them.
 *
 * Two groups of exports are left out on purpose, so the deep import is still
 * reported but no auto-fix is offered:
 *  - renamed re-exports (`NativeText as unstable_NativeText`) and namespace
 *    re-exports (`export * as Systrace`), which the fixer cannot express;
 *  - names published under an `unstable_` or `experimental_` prefix, since
 *    auto-fixing a call site onto an experimental API is not a decision a lint
 *    fixer should make on the author's behalf.
 */
const publicAPIMapping = {
  'Libraries/ActionSheetIOS/ActionSheetIOS': {
    default: 'ActionSheetIOS',
    types: [
      'ActionSheetIOSOptions',
      'ShareActionSheetError',
      'ShareActionSheetIOSOptions',
    ],
  },
  'Libraries/Alert/Alert': {
    default: 'Alert',
    types: ['AlertButton', 'AlertButtonStyle', 'AlertOptions', 'AlertType'],
  },
  'Libraries/Animated/Animated': {
    default: 'Animated',
    types: null,
  },
  'Libraries/Animated/Easing': {
    default: 'Easing',
    types: ['EasingFunction'],
  },
  'Libraries/Animated/useAnimatedColor': {
    default: 'useAnimatedColor',
    types: null,
  },
  'Libraries/Animated/useAnimatedValue': {
    default: 'useAnimatedValue',
    types: null,
  },
  'Libraries/Animated/useAnimatedValueXY': {
    default: 'useAnimatedValueXY',
    types: null,
  },
  'Libraries/AppState/AppState': {
    default: 'AppState',
    types: ['AppStateEvent', 'AppStateStatus'],
  },
  'Libraries/BatchedBridge/NativeModules': {
    default: 'NativeModules',
    types: null,
  },
  'Libraries/Components/AccessibilityInfo/AccessibilityInfo': {
    default: 'AccessibilityInfo',
    types: null,
  },
  'Libraries/Components/ActivityIndicator/ActivityIndicator': {
    default: 'ActivityIndicator',
    types: ['ActivityIndicatorInstance', 'ActivityIndicatorProps'],
  },
  'Libraries/Components/Button': {
    default: 'Button',
    types: ['ButtonInstance', 'ButtonProps'],
  },
  'Libraries/Components/Clipboard/Clipboard': {
    default: 'Clipboard',
    types: null,
  },
  'Libraries/Components/DrawerAndroid/DrawerLayoutAndroid': {
    default: 'DrawerLayoutAndroid',
    types: null,
  },
  'Libraries/Components/DrawerAndroid/DrawerLayoutAndroidTypes': {
    default: null,
    types: [
      'DrawerLayoutAndroidInstance',
      'DrawerLayoutAndroidProps',
      'DrawerSlideEvent',
    ],
  },
  'Libraries/Components/Keyboard/Keyboard': {
    default: 'Keyboard',
    types: [
      'AndroidKeyboardEvent',
      'IOSKeyboardEvent',
      'KeyboardEvent',
      'KeyboardEventEasing',
      'KeyboardEventName',
      'KeyboardMetrics',
    ],
  },
  'Libraries/Components/Keyboard/KeyboardAvoidingView': {
    default: 'KeyboardAvoidingView',
    types: ['KeyboardAvoidingViewInstance', 'KeyboardAvoidingViewProps'],
  },
  'Libraries/Components/LayoutConformance/LayoutConformance': {
    default: null,
    types: ['LayoutConformanceProps'],
  },
  'Libraries/Components/Pressable/Pressable': {
    default: 'Pressable',
    types: [
      'PressableAndroidRippleConfig',
      'PressableInstance',
      'PressableProps',
      'PressableStateCallbackType',
    ],
  },
  'Libraries/Components/ProgressBarAndroid/ProgressBarAndroid': {
    default: 'ProgressBarAndroid',
    types: ['ProgressBarAndroidInstance', 'ProgressBarAndroidProps'],
  },
  'Libraries/Components/RefreshControl/RefreshControl': {
    default: 'RefreshControl',
    types: [
      'RefreshControlInstance',
      'RefreshControlProps',
      'RefreshControlPropsAndroid',
      'RefreshControlPropsIOS',
    ],
  },
  'Libraries/Components/ScrollView/ScrollView': {
    default: 'ScrollView',
    types: [
      'ScrollResponderType',
      'ScrollViewImperativeMethods',
      'ScrollViewInstance',
      'ScrollViewProps',
      'ScrollViewPropsAndroid',
      'ScrollViewPropsIOS',
      'ScrollViewScrollToOptions',
    ],
  },
  'Libraries/Components/StatusBar/StatusBar': {
    default: 'StatusBar',
    types: [
      'StatusBarAnimation',
      'StatusBarInstance',
      'StatusBarProps',
      'StatusBarStyle',
    ],
  },
  'Libraries/Components/Switch/Switch': {
    default: 'Switch',
    types: ['SwitchChangeEvent', 'SwitchInstance', 'SwitchProps'],
  },
  'Libraries/Components/TextInput/InputAccessoryView': {
    default: 'InputAccessoryView',
    types: ['InputAccessoryViewProps'],
  },
  'Libraries/Components/TextInput/TextInput': {
    default: 'TextInput',
    types: [
      'AutoCapitalize',
      'BlurEvent',
      'EnterKeyHintTypeOptions',
      'FocusEvent',
      'InputModeOptions',
      'KeyboardTypeOptions',
      'ReturnKeyTypeOptions',
      'SubmitBehavior',
      'TextContentType',
      'TextInputAndroidProps',
      'TextInputBlurEvent',
      'TextInputChangeEvent',
      'TextInputContentSizeChangeEvent',
      'TextInputEndEditingEvent',
      'TextInputFocusEvent',
      'TextInputIOSProps',
      'TextInputInstance',
      'TextInputKeyPressEvent',
      'TextInputProps',
      'TextInputSelectionChangeEvent',
      'TextInputSubmitEditingEvent',
    ],
  },
  'Libraries/Components/ToastAndroid/ToastAndroid': {
    default: 'ToastAndroid',
    types: null,
  },
  'Libraries/Components/Touchable/TouchableHighlight': {
    default: 'TouchableHighlight',
    types: ['TouchableHighlightInstance', 'TouchableHighlightProps'],
  },
  'Libraries/Components/Touchable/TouchableNativeFeedback': {
    default: 'TouchableNativeFeedback',
    types: ['TouchableNativeFeedbackInstance', 'TouchableNativeFeedbackProps'],
  },
  'Libraries/Components/Touchable/TouchableOpacity': {
    default: 'TouchableOpacity',
    types: ['TouchableOpacityInstance', 'TouchableOpacityProps'],
  },
  'Libraries/Components/Touchable/TouchableWithoutFeedback': {
    default: 'TouchableWithoutFeedback',
    types: ['TouchableWithoutFeedbackProps'],
  },
  'Libraries/Components/View/View': {
    default: 'View',
    types: ['ViewInstance'],
  },
  'Libraries/Components/View/ViewAccessibility': {
    default: null,
    types: [
      'AccessibilityActionEvent',
      'AccessibilityActionInfo',
      'AccessibilityProps',
      'AccessibilityRole',
      'AccessibilityState',
      'AccessibilityValue',
      'Role',
    ],
  },
  'Libraries/Components/View/ViewNativeComponent': {
    default: null,
    types: null,
  },
  'Libraries/Components/View/ViewPropTypes': {
    default: null,
    types: [
      'GestureResponderHandlers',
      'TVViewPropsIOS',
      'ViewProps',
      'ViewPropsAndroid',
      'ViewPropsIOS',
    ],
  },
  'Libraries/Core/InitializeCore': {
    // `InitializeCore` has no public named export; the deep import must be
    // swapped for the `react-native/setup-env` entry point entirely.
    default: null,
    types: null,
    replacementSource: 'react-native/setup-env',
  },
  'Libraries/Core/ReactNativeVersion': {
    default: 'ReactNativeVersion',
    types: null,
  },
  'Libraries/Core/registerCallableModule': {
    default: 'registerCallableModule',
    types: null,
  },
  'Libraries/EventEmitter/NativeEventEmitter': {
    default: 'NativeEventEmitter',
    types: [
      'EmitterSubscription',
      'EventSubscription',
      'NativeEventSubscription',
    ],
  },
  'Libraries/EventEmitter/RCTDeviceEventEmitter': {
    default: 'DeviceEventEmitter',
    types: null,
  },
  'Libraries/EventEmitter/RCTNativeAppEventEmitter': {
    default: 'NativeAppEventEmitter',
    types: null,
  },
  'Libraries/Image/Image': {
    default: 'Image',
    types: [
      'ImageBackgroundProps',
      'ImageErrorEvent',
      'ImageLoadEvent',
      'ImageProgressEventIOS',
      'ImageProps',
      'ImagePropsAndroid',
      'ImagePropsBase',
      'ImagePropsIOS',
      'ImageResolvedAssetSource',
      'ImageSize',
      'ImageSourcePropType',
    ],
  },
  'Libraries/Image/ImageBackground': {
    default: 'ImageBackground',
    types: ['ImageBackgroundInstance', 'ImageBackgroundProps'],
  },
  'Libraries/Image/ImageResizeMode': {
    default: null,
    types: ['ImageResizeMode'],
  },
  'Libraries/Image/ImageSource': {
    default: null,
    types: ['ImageRequireSource', 'ImageSource', 'ImageURISource'],
  },
  'Libraries/Image/ImageTypes.flow': {
    default: null,
    types: ['ImageInstance', 'ImageProps'],
  },
  'Libraries/Interaction/PanResponder': {
    default: 'PanResponder',
    types: [
      'PanResponderCallbacks',
      'PanResponderGestureState',
      'PanResponderInstance',
    ],
  },
  'Libraries/LayoutAnimation/LayoutAnimation': {
    default: 'LayoutAnimation',
    types: [
      'LayoutAnimationAnim',
      'LayoutAnimationConfig',
      'LayoutAnimationProperties',
      'LayoutAnimationProperty',
      'LayoutAnimationType',
      'LayoutAnimationTypes',
    ],
  },
  'Libraries/Linking/Linking': {
    default: 'Linking',
    types: null,
  },
  'Libraries/Lists/FlatList': {
    default: 'FlatList',
    types: ['FlatListInstance', 'FlatListProps'],
  },
  'Libraries/Lists/SectionList': {
    default: 'SectionList',
    types: [
      'SectionBase',
      'SectionListData',
      'SectionListInstance',
      'SectionListProps',
      'SectionListRenderItem',
      'SectionListRenderItemInfo',
    ],
  },
  'Libraries/Lists/VirtualizedList': {
    default: 'VirtualizedList',
    types: [
      'ListRenderItem',
      'ListRenderItemInfo',
      'ListViewToken',
      'Separators',
      'VirtualizedListInstance',
      'VirtualizedListProps',
    ],
  },
  'Libraries/Lists/VirtualizedSectionList': {
    default: 'VirtualizedSectionList',
    types: [
      'ScrollToLocationParamsType',
      'SectionBase',
      'VirtualizedSectionListInstance',
      'VirtualizedSectionListProps',
    ],
  },
  'Libraries/LogBox/LogBox': {
    default: 'LogBox',
    types: ['ExtendedExceptionData', 'IgnorePattern', 'LogData'],
  },
  'Libraries/Modal/Modal': {
    default: 'Modal',
    types: [
      'ModalBaseProps',
      'ModalInstance',
      'ModalProps',
      'ModalPropsAndroid',
      'ModalPropsIOS',
    ],
  },
  'Libraries/Network/RCTNetworking': {
    default: 'Networking',
    types: null,
  },
  'Libraries/PermissionsAndroid/PermissionsAndroid': {
    default: 'PermissionsAndroid',
    types: ['Permission', 'PermissionStatus', 'Rationale'],
  },
  'Libraries/Pressability/Pressability': {
    default: null,
    types: ['PressabilityConfig'],
  },
  'Libraries/Pressability/usePressability': {
    default: 'usePressability',
    types: null,
  },
  'Libraries/PushNotificationIOS/PushNotificationIOS': {
    default: 'PushNotificationIOS',
    types: ['PushNotificationEventName', 'PushNotificationPermissions'],
  },
  'Libraries/ReactNative/AppRegistry': {
    default: null,
    types: [
      'AppConfig',
      'AppRegistry',
      'ComponentProvider',
      'ComponentProviderInstrumentationHook',
      'Registry',
      'RootViewStyleProvider',
      'Runnable',
      'Runnables',
      'TaskProvider',
      'WrapperComponentProvider',
    ],
  },
  'Libraries/ReactNative/I18nManager': {
    default: 'I18nManager',
    types: null,
  },
  'Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance': {
    default: null,
    types: ['PublicRootInstance', 'PublicTextInstance'],
  },
  'Libraries/ReactNative/RendererProxy': {
    default: null,
    types: ['findNodeHandle'],
  },
  'Libraries/ReactNative/RootTag': {
    default: null,
    types: ['RootTag', 'RootTagContext'],
  },
  'Libraries/ReactNative/UIManager': {
    default: 'UIManager',
    types: null,
  },
  'Libraries/ReactNative/requireNativeComponent': {
    default: 'requireNativeComponent',
    types: null,
  },
  'Libraries/Settings/Settings': {
    default: 'Settings',
    types: null,
  },
  'Libraries/Share/Share': {
    default: 'Share',
    types: ['ShareAction', 'ShareContent', 'ShareOptions'],
  },
  'Libraries/StyleSheet/EdgeInsetsPropType': {
    default: null,
    types: ['EdgeInsetsProp'],
  },
  'Libraries/StyleSheet/PlatformColorValueTypes': {
    default: null,
    types: ['PlatformColor'],
  },
  'Libraries/StyleSheet/PlatformColorValueTypesIOS': {
    default: null,
    types: ['DynamicColorIOS', 'DynamicColorIOSTuple'],
  },
  'Libraries/StyleSheet/Rect': {
    default: null,
    types: ['Insets'],
  },
  'Libraries/StyleSheet/StyleSheet': {
    default: 'StyleSheet',
    types: [
      'BoxShadowValue',
      'ColorValue',
      'FilterFunction',
      'FontVariant',
      'ImageStyle',
      'NativeColorValue',
      'OpaqueColorValue',
      'StyleProp',
      'TextStyle',
      'TransformsStyle',
      'ViewStyle',
    ],
  },
  'Libraries/StyleSheet/StyleSheetTypes': {
    default: null,
    types: [
      'BoxShadowValue',
      'CursorValue',
      'DimensionValue',
      'DropShadowValue',
      'EdgeInsetsValue',
      'FilterFunction',
      'NativeColorValue',
      'PointValue',
    ],
  },
  'Libraries/StyleSheet/processColor': {
    default: 'processColor',
    types: ['ProcessedColorValue'],
  },
  'Libraries/Text/Text': {
    default: 'Text',
    types: ['TextInstance', 'TextProps'],
  },
  'Libraries/Text/TextAncestorContext': {
    default: null,
    types: null,
  },
  'Libraries/Text/TextNativeComponent': {
    default: null,
    types: null,
  },
  'Libraries/Text/TextProps': {
    default: null,
    types: ['TextProps'],
  },
  'Libraries/TurboModule/RCTExport': {
    default: null,
    types: ['RootTag', 'TurboModule'],
  },
  'Libraries/Types/CoreEventTypes': {
    default: null,
    types: [
      'BlurEvent',
      'FocusEvent',
      'GestureResponderEvent',
      'KeyDownEvent',
      'KeyEvent',
      'KeyUpEvent',
      'LayoutChangeEvent',
      'LayoutRectangle',
      'MouseEvent',
      'NativeMouseEvent',
      'NativePointerEvent',
      'NativeScrollEvent',
      'NativeSyntheticEvent',
      'NativeTouchEvent',
      'NativeUIEvent',
      'PointerEvent',
      'ResponderSyntheticEvent',
      'ScrollEvent',
      'TargetedEvent',
      'TextLayoutEvent',
    ],
  },
  'Libraries/Types/RootTagTypes': {
    default: null,
    types: ['RootTag'],
  },
  'Libraries/UTFSequence': {
    default: 'UTFSequence',
    types: null,
  },
  'Libraries/Utilities/BackHandler': {
    default: 'BackHandler',
    types: ['BackPressEventName'],
  },
  'Libraries/Utilities/DevSettings': {
    default: 'DevSettings',
    types: null,
  },
  'Libraries/Utilities/DeviceInfo': {
    default: 'DeviceInfo',
    types: ['DeviceInfoConstants'],
  },
  'Libraries/Utilities/Dimensions': {
    default: 'Dimensions',
    types: [
      'DimensionsPayload',
      'DisplayMetrics',
      'DisplayMetricsAndroid',
      'ScaledSize',
    ],
  },
  'Libraries/Utilities/PixelRatio': {
    default: 'PixelRatio',
    types: null,
  },
  'Libraries/Utilities/Platform': {
    default: 'Platform',
    types: null,
  },
  'Libraries/Utilities/PlatformTypes': {
    default: null,
    types: ['PlatformOSType', 'PlatformSelectSpec'],
  },
  'Libraries/Utilities/codegenNativeCommands': {
    default: 'codegenNativeCommands',
    types: null,
  },
  'Libraries/Utilities/codegenNativeComponent': {
    default: 'codegenNativeComponent',
    types: null,
  },
  'Libraries/Utilities/useColorScheme': {
    default: 'useColorScheme',
    types: null,
  },
  'Libraries/Utilities/useWindowDimensions': {
    default: 'useWindowDimensions',
    types: null,
  },
  'Libraries/Vibration/Vibration': {
    default: 'Vibration',
    types: null,
  },
  'Libraries/vendor/core/ErrorUtils': {
    default: null,
    types: ['ErrorUtils'],
  },
  'Libraries/vendor/emitter/EventEmitter': {
    default: 'EventEmitter',
    types: ['EventSubscription', 'IEventEmitter'],
  },
  'src/private/assets/AssetRegistry': {
    default: null,
    types: ['AssetDestPathResolver', 'AssetRegistry', 'PackagerAsset'],
  },
  'src/private/components/virtualcollection/FlingConstants': {
    default: null,
    types: null,
  },
  'src/private/components/virtualcollection/Virtual': {
    default: null,
    types: null,
  },
  'src/private/components/virtualcollection/VirtualCollectionView': {
    default: null,
    types: null,
  },
  'src/private/components/virtualcollection/column/VirtualColumn': {
    default: null,
    types: null,
  },
  'src/private/components/virtualcollection/column/VirtualColumnGenerator': {
    default: null,
    types: null,
  },
  'src/private/components/virtualcollection/dom/getScrollParent': {
    default: null,
    types: null,
  },
  'src/private/components/virtualcollection/row/VirtualRow': {
    default: null,
    types: null,
  },
  'src/private/components/virtualview/VirtualView': {
    default: null,
    types: ['ModeChangeEvent', 'VirtualViewMode'],
  },
  'src/private/devsupport/devmenu/DevMenu': {
    default: 'DevMenu',
    types: null,
  },
  'src/private/specs_DEPRECATED/modules/NativeAppearance': {
    default: null,
    types: ['ColorSchemeName'],
  },
  'src/private/types/HostComponent': {
    default: null,
    types: ['HostComponent'],
  },
  'src/private/types/HostInstance': {
    default: null,
    types: [
      'HostInstance',
      'MeasureInWindowOnSuccessCallback',
      'MeasureLayoutOnSuccessCallback',
      'MeasureOnSuccessCallback',
    ],
  },
};

module.exports = {
  publicAPIMapping,
};
