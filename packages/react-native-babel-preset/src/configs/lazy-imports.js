/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

// This is the set of modules that React Native publicly exports and that we
// want to require lazily. Keep this list in sync with
// react-native/index.js (though having extra entries here is fairly harmless).

'use strict';

module.exports = new Set([
  'AccessibilityInfo',
  'ActivityIndicator',
  'Button',
  'DatePickerIOS',
  'DrawerLayoutAndroid',
  'FlatList',
  'Image',
  'ImageBackground',
  'InputAccessoryView',
  'KeyboardAvoidingView',
  'Modal',
  'Pressable',
  'ProgressBarAndroid',
  'ProgressViewIOS',
  'ScrollView',
  'SectionList',
  'Slider',
  'Switch',
  'RefreshControl',
  'StatusBar',
  'Text',
  'TextInput',
  'Touchable',
  'TouchableHighlight',
  'TouchableNativeFeedback',
  'TouchableOpacity',
  'TouchableWithoutFeedback',
  'View',
  'VirtualizedList',
  'VirtualizedSectionList',

  // APIs
  'ActionSheetIOS',
  'Alert',
  'Animated',
  'Appearance',
  'AppRegistry',
  'AppState',
  'AsyncStorage',
  'BackHandler',
  'Clipboard',
  'DeviceInfo',
  'Dimensions',
  'Easing',
  'ReactNative',
  'I18nManager',
  'InteractionManager',
  'Keyboard',
  'LayoutAnimation',
  'Linking',
  'LogBox',
  'NativeEventEmitter',
  'PanResponder',
  'PermissionsAndroid',
  'PixelRatio',
  'PushNotificationIOS',
  'Settings',
  'Share',
  'StyleSheet',
  'Systrace',
  'ToastAndroid',
  'TVEventHandler',
  'UIManager',
  'ReactNative',
  'UTFSequence',
  'Vibration',

  // Plugins
  'RCTDeviceEventEmitter',
  'RCTNativeAppEventEmitter',
  'NativeModules',
  'Platform',
  'processColor',
  'requireNativeComponent',
]);
