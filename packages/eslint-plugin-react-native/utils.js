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
 */
const publicAPIMapping = {
  'Libraries/Components/AccessibilityInfo/AccessibilityInfo': {
    default: 'AccessibilityInfo',
    types: null,
  },
  'Libraries/Components/ActivityIndicator/ActivityIndicator': {
    default: 'ActivityIndicator',
    types: ['ActivityIndicatorProps'],
  },
  'Libraries/Components/Button': {
    default: 'Button',
    types: ['ButtonProps'],
  },
  'Libraries/Components/DrawerAndroid/DrawerLayoutAndroid': {
    default: 'DrawerLayoutAndroid',
    types: ['DrawerLayoutAndroidProps', 'DrawerSlideEvent'],
  },
  'Libraries/Components/LayoutConformance/LayoutConformance': {
    default: 'experimental_LayoutConformance',
    types: ['LayoutConformanceProps'],
  },
  'Libraries/Lists/FlatList': {
    default: 'FlatList',
    types: ['FlatListProps'],
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
  'Libraries/Image/ImageSource': {
    default: null,
    types: ['ImageRequireSource', 'ImageSource', 'ImageURISource'],
  },
  'Libraries/Image/ImageBackground': {
    default: 'ImageBackground',
    types: null,
  },
  'Libraries/Components/TextInput/InputAccessoryView': {
    default: 'InputAccessoryView',
    types: ['InputAccessoryViewProps'],
  },
  'Libraries/Components/Keyboard/KeyboardAvoidingView': {
    default: 'KeyboardAvoidingView',
    types: ['KeyboardAvoidingViewProps'],
  },
  'Libraries/Modal/Modal': {
    default: 'Modal',
    types: [
      'ModalBaseProps',
      'ModalProps',
      'ModalPropsAndroid',
      'ModalPropsIOS',
    ],
  },
  'Libraries/Components/Pressable/Pressable': {
    default: 'Pressable',
    types: [
      'PressableAndroidRippleConfig',
      'PressableProps',
      'PressableStateCallbackType',
    ],
  },
  'Libraries/Components/ProgressBarAndroid/ProgressBarAndroid': {
    default: 'ProgressBarAndroid',
    types: ['ProgressBarAndroidProps'],
  },
  'Libraries/Components/RefreshControl/RefreshControl': {
    default: 'RefreshControl',
    types: [
      'RefreshControlProps',
      'RefreshControlPropsAndroid',
      'RefreshControlPropsIOS',
    ],
  },
  'Libraries/Components/SafeAreaView/SafeAreaView': {
    default: 'SafeAreaView',
    types: null,
  },
  'Libraries/Components/ScrollView/ScrollView': {
    default: 'ScrollView',
    types: [
      'ScrollResponderType',
      'ScrollViewProps',
      'ScrollViewPropsAndroid',
      'ScrollViewPropsIOS',
      'ScrollViewImperativeMethods',
      'ScrollViewScrollToOptions',
    ],
  },
  'Libraries/Lists/SectionList': {
    default: 'SectionList',
    types: [
      'SectionListProps',
      'SectionListRenderItem',
      'SectionListRenderItemInfo',
      'SectionListData',
    ],
  },
  'Libraries/Components/StatusBar/StatusBar': {
    default: 'StatusBar',
    types: ['StatusBarAnimation', 'StatusBarProps', 'StatusBarStyle'],
  },
  'Libraries/Components/Switch/Switch': {
    default: 'Switch',
    types: ['SwitchChangeEvent', 'SwitchProps'],
  },
  'Libraries/Text/Text': {
    default: 'Text',
    types: ['TextProps'],
  },
  'Libraries/Components/TextInput/TextInput': {
    default: 'TextInput',
    types: [
      'AutoCapitalize',
      'EnterKeyHintTypeOptions',
      'KeyboardTypeOptions',
      'InputModeOptions',
      'TextContentType',
      'TextInputAndroidProps',
      'TextInputIOSProps',
      'TextInputProps',
      'TextInputChangeEvent',
      'TextInputContentSizeChangeEvent',
      'TextInputEndEditingEvent',
      'TextInputFocusEvent',
      'TextInputKeyPressEvent',
      'TextInputSelectionChangeEvent',
      'TextInputSubmitEditingEvent',
      'ReturnKeyTypeOptions',
      'SubmitBehavior',
    ],
  },
  'Libraries/Components/Touchable/Touchable': {
    default: 'Touchable',
    types: null,
  },
  'Libraries/Components/Touchable/TouchableHighlight': {
    default: 'TouchableHighlight',
    types: ['TouchableHighlightProps'],
  },
  'Libraries/Components/Touchable/TouchableNativeFeedback': {
    default: 'TouchableNativeFeedback',
    types: ['TouchableNativeFeedbackProps'],
  },
  'Libraries/Components/Touchable/TouchableOpacity': {
    default: 'TouchableOpacity',
    types: ['TouchableOpacityProps'],
  },
  'Libraries/Components/Touchable/TouchableWithoutFeedback': {
    default: 'TouchableWithoutFeedback',
    types: ['TouchableWithoutFeedbackProps'],
  },
  'Libraries/Components/View/View': {
    default: 'View',
    types: null,
  },
  'Libraries/Components/View/ViewAccessibility': {
    default: null,
    types: [
      'AccessibilityActionEvent',
      'AccessibilityProps',
      'AccessibilityRole',
      'AccessibilityState',
      'AccessibilityValue',
      'Role',
    ],
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
  'Libraries/Lists/VirtualizedList': {
    default: 'VirtualizedList',
    types: [
      'ListRenderItemInfo',
      'ListRenderItem',
      'Separators',
      'VirtualizedListProps',
    ],
  },
  'Libraries/Lists/VirtualizedSectionList': {
    default: 'VirtualizedSectionList',
    types: [
      'ScrollToLocationParamsType',
      'SectionBase',
      'VirtualizedSectionListProps',
    ],
  },
  'Libraries/ActionSheetIOS/ActionSheetIOS': {
    default: 'ActionSheetIOS',
    types: [
      'ActionSheetIOSOptions',
      'ShareActionSheetIOSOptions',
      'ShareActionSheetError',
    ],
  },
  'Libraries/Alert/Alert': {
    default: 'Alert',
    types: ['AlertType', 'AlertButtonStyle', 'AlertButton', 'AlertOptions'],
  },
  'Libraries/Animated/Animated': {
    default: 'Animated',
    types: null,
  },
  'Libraries/Utilities/Appearance': {
    default: 'Appearance',
    types: null,
  },
  'Libraries/ReactNative/AppRegistry': {
    default: 'AppRegistry',
    types: [
      'TaskProvider',
      'ComponentProvider',
      'ComponentProviderInstrumentationHook',
      'AppConfig',
      'Runnable',
      'Runnables',
      'Registry',
      'WrapperComponentProvider',
      'RootViewStyleProvider',
    ],
  },
  'Libraries/AppState/AppState': {
    default: 'AppState',
    types: ['AppStateStatus', 'AppStateEvent'],
  },
  'Libraries/Utilities/BackHandler': {
    default: 'BackHandler',
    types: ['BackPressEventName'],
  },
  'Libraries/Components/Clipboard/Clipboard': {
    default: 'Clipboard',
    types: null,
  },
  'Libraries/Utilities/DeviceInfo': {
    default: 'DeviceInfo',
    types: ['DeviceInfoConstants'],
  },
  'src/private/devsupport/devmenu/DevMenu': {
    default: 'DevMenu',
    types: null,
  },
  'Libraries/Utilities/DevSettings': {
    default: 'DevSettings',
    types: null,
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
  'Libraries/Animated/Easing': {
    default: 'Easing',
    types: ['EasingFunction'],
  },
  'Libraries/ReactNative/I18nManager': {
    default: 'I18nManager',
    types: null,
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
  'Libraries/LogBox/LogBox': {
    default: 'LogBox',
    types: ['ExtendedExceptionData', 'IgnorePattern', 'LogData'],
  },
  'Libraries/EventEmitter/NativeEventEmitter': {
    default: 'NativeEventEmitter',
    types: [
      'EventSubscription',
      'EmitterSubscription',
      'NativeEventSubscription',
    ],
  },
  'Libraries/Network/RCTNetworking': {
    default: 'Networking',
    types: null,
  },
  'Libraries/Interaction/PanResponder': {
    default: 'PanResponder',
    types: [
      'PanResponderCallbacks',
      'PanResponderGestureState',
      'PanResponderInstance',
    ],
  },
  'Libraries/PermissionsAndroid/PermissionsAndroid': {
    default: 'PermissionsAndroid',
    types: ['Permission', 'PermissionStatus', 'Rationale'],
  },
  'Libraries/Utilities/PixelRatio': {
    default: 'PixelRatio',
    types: null,
  },
  'Libraries/PushNotificationIOS/PushNotificationIOS': {
    default: 'PushNotificationIOS',
    types: ['PushNotificationEventName', 'PushNotificationPermissions'],
  },
  'Libraries/Settings/Settings': {
    default: 'Settings',
    types: null,
  },
  'Libraries/Share/Share': {
    default: 'Share',
    types: ['ShareAction', 'ShareContent', 'ShareOptions'],
  },
  'Libraries/StyleSheet/StyleSheet': {
    default: 'StyleSheet',
    types: [
      'ColorValue',
      'ImageStyle',
      'FilterFunction',
      'FontVariant',
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
      'PointValue',
    ],
  },
  'Libraries/StyleSheet/Rect': {
    default: null,
    types: ['Insets'],
  },
  'Libraries/Performance/Systrace': {
    default: 'Systrace',
    types: null,
  },
  'Libraries/Components/ToastAndroid/ToastAndroid': {
    default: 'ToastAndroid',
    types: null,
  },
  'Libraries/TurboModule/TurboModuleRegistry': {
    default: 'TurboModuleRegistry',
    types: null,
  },
  'Libraries/TurboModule/RCTExport': {
    default: null,
    types: ['TurboModule'],
  },
  'Libraries/ReactNative/UIManager': {
    default: 'UIManager',
    types: null,
  },
  'Libraries/Animated/useAnimatedValue': {
    default: 'useAnimatedValue',
    types: null,
  },
  'Libraries/Utilities/useColorScheme': {
    default: 'useColorScheme',
    types: null,
  },
  'src/private/specs_DEPRECATED/modules/NativeAppearance': {
    default: null,
    types: ['ColorSchemeName'],
  },
  'Libraries/Utilities/useWindowDimensions': {
    default: 'useWindowDimensions',
    types: null,
  },
  'Libraries/UTFSequence': {
    default: 'UTFSequence',
    types: null,
  },
  'Libraries/Vibration/Vibration': {
    default: 'Vibration',
    types: null,
  },
  'Libraries/Utilities/codegenNativeComponent': {
    default: 'codegenNativeComponent',
    types: null,
  },
  'Libraries/Utilities/codegenNativeCommands': {
    default: 'codegenNativeCommands',
    types: null,
  },
  'Libraries/EventEmitter/RCTDeviceEventEmitter': {
    default: 'DeviceEventEmitter',
    types: null,
  },
  'Libraries/StyleSheet/PlatformColorValueTypesIOS': {
    default: 'DynamicColorIOS',
    types: ['DynamicColorIOSTuple'],
  },
  'Libraries/EventEmitter/RCTNativeAppEventEmitter': {
    default: 'NativeAppEventEmitter',
    types: null,
  },
  'Libraries/BatchedBridge/NativeModules': {
    default: 'NativeModules',
    types: null,
  },
  'Libraries/Utilities/Platform': {
    default: 'Platform',
    types: null,
  },
  './Libraries/Utilities/PlatformTypes': {
    default: null,
    types: ['PlatformOSType', 'PlatformSelectSpec'],
  },
  'Libraries/StyleSheet/PlatformColorValueTypes': {
    default: 'PlatformColor',
    types: null,
  },
  'Libraries/StyleSheet/processColor': {
    default: 'processColor',
    types: ['ProcessedColorValue'],
  },
  'Libraries/ReactNative/requireNativeComponent': {
    default: 'requireNativeComponent',
    types: null,
  },
  'Libraries/ReactNative/RootTag': {
    default: 'RootTagContext',
    types: ['RootTag'],
  },
  'Libraries/Types/RootTagTypes': {
    default: null,
    types: ['RootTag'],
  },
  'src/private/types/HostInstance': {
    default: null,
    types: [
      'HostInstance',
      'NativeMethods',
      'NativeMethodsMixin',
      'MeasureInWindowOnSuccessCallback',
      'MeasureLayoutOnSuccessCallback',
      'MeasureOnSuccessCallback',
    ],
  },
  'src/private/types/HostComponent': {
    default: null,
    types: ['HostComponent'],
  },
  'Libraries/vendor/core/ErrorUtils': {
    default: null,
    types: ['ErrorUtils'],
  },
  'Libraries/ReactPrivate/ReactNativePrivateInterface': {
    default: null,
    types: ['PublicRootInstance', 'PublicTextInstance'],
  },
};

module.exports = {
  publicAPIMapping,
};
