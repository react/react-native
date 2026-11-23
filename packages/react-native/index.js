/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';
'use client';

// ----------------------------------------------------------------------------
// Runtime entry point for react-native.
//
// This module is separate from index.js.flow as it provides a more lenient
// `module.exports` API at runtime, for lazy module loading and backwards
// compatibility.
//
// IMPORTANT: Keep this file in sync with index.js.flow. Test your changes
// whenever updating React Native's public API.
// ----------------------------------------------------------------------------

import typeof * as ReactNativePublicAPI from './index.js.flow';

const warnOnce = require('./Libraries/Utilities/warnOnce').default;
const invariant = require('invariant');

module.exports = {
  // #region Components
  // $FlowFixMe[unsafe-getters-setters]
  get ActivityIndicator() {
    return require('./Libraries/Components/ActivityIndicator/ActivityIndicator')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Button() {
    return require('./Libraries/Components/Button').default;
  },
  /**
   * @deprecated DrawerLayoutAndroid is deprecated and will be removed in a future release.
   * Use 'react-native-drawer-layout' instead.
   * See https://reactnavigation.org/docs/drawer-layout/
   */
  // $FlowFixMe[unsafe-getters-setters]
  get DrawerLayoutAndroid() {
    warnOnce(
      'drawer-layout-android-deprecated',
      'DrawerLayoutAndroid is deprecated and will be removed in a future release. ' +
        "Use 'react-native-drawer-layout' instead. " +
        'See https://reactnavigation.org/docs/drawer-layout/',
    );
    return require('./Libraries/Components/DrawerAndroid/DrawerLayoutAndroid')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get EventEmitter() {
    return require('./Libraries/vendor/emitter/EventEmitter').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get FlatList() {
    return require('./Libraries/Lists/FlatList').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Image() {
    return require('./Libraries/Image/Image').default;
  },
  /**
   * @deprecated ImageBackground is deprecated and will be removed in a future release.
   * Use a View with an absolutely positioned Image instead.
   * See https://reactnative.dev/docs/imagebackground
   */
  // $FlowFixMe[unsafe-getters-setters]
  get ImageBackground() {
    warnOnce(
      'image-background-deprecated',
      'ImageBackground is deprecated and will be removed in a future release. ' +
        'Use a View with an absolutely positioned Image instead. ' +
        'See https://reactnative.dev/docs/imagebackground',
    );
    return require('./Libraries/Image/ImageBackground').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get InputAccessoryView() {
    warnOnce(
      'input-accessory-view-deprecated',
      'InputAccessoryView is deprecated and will be removed in a future release.',
    );
    return require('./Libraries/Components/TextInput/InputAccessoryView')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get KeyboardAvoidingView() {
    return require('./Libraries/Components/Keyboard/KeyboardAvoidingView')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get experimental_LayoutConformance() {
    return require('./Libraries/Components/LayoutConformance/LayoutConformance')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Modal() {
    return require('./Libraries/Modal/Modal').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get unstable_NativeText() {
    return require('./Libraries/Text/TextNativeComponent').NativeText;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get unstable_NativeView() {
    return require('./Libraries/Components/View/ViewNativeComponent').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Pressable() {
    return require('./Libraries/Components/Pressable/Pressable').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get ProgressBarAndroid() {
    warnOnce(
      'progress-bar-android-moved',
      'ProgressBarAndroid has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/progress-bar-android' instead of 'react-native'. " +
        'See https://github.com/react-native-progress-view/progress-bar-android',
    );
    return require('./Libraries/Components/ProgressBarAndroid/ProgressBarAndroid')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get RefreshControl() {
    return require('./Libraries/Components/RefreshControl/RefreshControl')
      .default;
  },
  /**
   * @deprecated SafeAreaView has been deprecated and will be removed in a future release.
   * Please use 'react-native-safe-area-context' instead.
   * See https://github.com/AppAndFlow/react-native-safe-area-context
   */
  // $FlowFixMe[unsafe-getters-setters]
  get SafeAreaView() {
    warnOnce(
      'safe-area-view-deprecated',
      'SafeAreaView has been deprecated and will be removed in a future release. ' +
        "Please use 'react-native-safe-area-context' instead. " +
        'See https://github.com/AppAndFlow/react-native-safe-area-context',
    );
    return require('./Libraries/Components/SafeAreaView/SafeAreaView').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get ScrollView() {
    return require('./Libraries/Components/ScrollView/ScrollView').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get SectionList() {
    return require('./Libraries/Lists/SectionList').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get StatusBar() {
    return require('./Libraries/Components/StatusBar/StatusBar').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Switch() {
    return require('./Libraries/Components/Switch/Switch').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Text() {
    return require('./Libraries/Text/Text').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get unstable_TextAncestorContext() {
    return require('./Libraries/Text/TextAncestorContext').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get TextInput() {
    return require('./Libraries/Components/TextInput/TextInput').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get TouchableHighlight() {
    return require('./Libraries/Components/Touchable/TouchableHighlight')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get TouchableNativeFeedback() {
    return require('./Libraries/Components/Touchable/TouchableNativeFeedback')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get TouchableOpacity() {
    return require('./Libraries/Components/Touchable/TouchableOpacity').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get TouchableWithoutFeedback() {
    return require('./Libraries/Components/Touchable/TouchableWithoutFeedback')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get View() {
    return require('./Libraries/Components/View/View').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get VirtualizedList() {
    return require('./Libraries/Lists/VirtualizedList').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get VirtualizedSectionList() {
    return require('./Libraries/Lists/VirtualizedSectionList').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get unstable_VirtualView() {
    return require('./src/private/components/virtualview/VirtualView').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get unstable_VirtualArray() {
    return require('./src/private/components/virtualcollection/Virtual')
      .VirtualArray;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get unstable_createVirtualCollectionView() {
    return require('./src/private/components/virtualcollection/VirtualCollectionView')
      .createVirtualCollectionView;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get unstable_VirtualColumn() {
    return require('./src/private/components/virtualcollection/column/VirtualColumn')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get unstable_VirtualColumnGenerator() {
    return require('./src/private/components/virtualcollection/column/VirtualColumnGenerator')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get unstable_VirtualRow() {
    return require('./src/private/components/virtualcollection/row/VirtualRow')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get unstable_DEFAULT_INITIAL_NUM_TO_RENDER() {
    return require('./src/private/components/virtualcollection/FlingConstants')
      .DEFAULT_INITIAL_NUM_TO_RENDER;
  },
  // #endregion
  // #region APIs
  // $FlowFixMe[unsafe-getters-setters]
  get AccessibilityInfo() {
    return require('./Libraries/Components/AccessibilityInfo/AccessibilityInfo')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get ActionSheetIOS() {
    return require('./Libraries/ActionSheetIOS/ActionSheetIOS').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Alert() {
    return require('./Libraries/Alert/Alert').default;
  },
  // Include any types exported in the Animated module together with its default export, so
  // you can references types such as Animated.Numeric
  // $FlowFixMe[unsafe-getters-setters]
  get Animated() {
    return require('./Libraries/Animated/Animated').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get AnimatedFlatList() {
    return require('./Libraries/Animated/components/AnimatedFlatList').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get AnimatedImage() {
    return require('./Libraries/Animated/components/AnimatedImage').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get AnimatedScrollView() {
    return require('./Libraries/Animated/components/AnimatedScrollView')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get AnimatedSectionList() {
    return require('./Libraries/Animated/components/AnimatedSectionList')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get AnimatedText() {
    return require('./Libraries/Animated/components/AnimatedText').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get AnimatedView() {
    return require('./Libraries/Animated/components/AnimatedView').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Appearance() {
    return require('./Libraries/Utilities/Appearance');
  },
  // $FlowFixMe[unsafe-getters-setters]
  get AppRegistry() {
    return require('./Libraries/ReactNative/AppRegistry').AppRegistry;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get AppState() {
    return require('./Libraries/AppState/AppState').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get AssetRegistry() {
    return require('./src/private/assets/AssetRegistry').AssetRegistry;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get BackHandler() {
    return require('./Libraries/Utilities/BackHandler').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get codegenNativeCommands() {
    return require('./Libraries/Utilities/codegenNativeCommands').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get codegenNativeComponent() {
    return require('./Libraries/Utilities/codegenNativeComponent').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get DeviceEventEmitter() {
    return require('./Libraries/EventEmitter/RCTDeviceEventEmitter').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get DeviceInfo() {
    return require('./Libraries/Utilities/DeviceInfo').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get DevMenu() {
    return require('./src/private/devsupport/devmenu/DevMenu').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get DevSettings() {
    return require('./Libraries/Utilities/DevSettings').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Dimensions() {
    return require('./Libraries/Utilities/Dimensions').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get DynamicColorIOS() {
    return require('./Libraries/StyleSheet/PlatformColorValueTypesIOS')
      .DynamicColorIOS;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Easing() {
    return require('./Libraries/Animated/Easing').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get findNodeHandle() {
    return require('./Libraries/ReactNative/RendererProxy').findNodeHandle;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get I18nManager() {
    return require('./Libraries/ReactNative/I18nManager').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Keyboard() {
    return require('./Libraries/Components/Keyboard/Keyboard').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get LayoutAnimation() {
    return require('./Libraries/LayoutAnimation/LayoutAnimation').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Linking() {
    return require('./Libraries/Linking/Linking').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get LogBox() {
    return require('./Libraries/LogBox/LogBox').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get NativeAppEventEmitter() {
    return require('./Libraries/EventEmitter/RCTNativeAppEventEmitter').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get NativeComponentRegistry() {
    return require('./Libraries/NativeComponent/NativeComponentRegistry');
  },
  // $FlowFixMe[unsafe-getters-setters]
  get NativeEventEmitter() {
    return require('./Libraries/EventEmitter/NativeEventEmitter').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get NativeModules() {
    return require('./Libraries/BatchedBridge/NativeModules').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Networking() {
    return require('./Libraries/Network/RCTNetworking').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get PanResponder() {
    return require('./Libraries/Interaction/PanResponder').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get PermissionsAndroid() {
    return require('./Libraries/PermissionsAndroid/PermissionsAndroid').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get PixelRatio() {
    return require('./Libraries/Utilities/PixelRatio').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Platform() {
    return require('./Libraries/Utilities/Platform').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get PlatformColor() {
    return require('./Libraries/StyleSheet/PlatformColorValueTypes')
      .PlatformColor;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get PushNotificationIOS() {
    warnOnce(
      'pushNotificationIOS-moved',
      'PushNotificationIOS has been extracted from react-native core and will be removed in a future release. ' +
        "It can now be installed and imported from '@react-native-community/push-notification-ios' instead of 'react-native'. " +
        'See https://github.com/react-native-push-notification/ios',
    );
    return require('./Libraries/PushNotificationIOS/PushNotificationIOS')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get processColor() {
    return require('./Libraries/StyleSheet/processColor').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get registerCallableModule() {
    return require('./Libraries/Core/registerCallableModule').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get requireNativeComponent() {
    return require('./Libraries/ReactNative/requireNativeComponent').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get ReactNativeVersion() {
    return require('./Libraries/Core/ReactNativeVersion').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get RootTagContext() {
    return require('./Libraries/ReactNative/RootTag').RootTagContext;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Settings() {
    return require('./Libraries/Settings/Settings').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Share() {
    return require('./Libraries/Share/Share').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get StyleSheet() {
    return require('./Libraries/StyleSheet/StyleSheet').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Systrace() {
    return require('./Libraries/Performance/Systrace');
  },
  // $FlowFixMe[unsafe-getters-setters]
  get ToastAndroid() {
    return require('./Libraries/Components/ToastAndroid/ToastAndroid').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get TurboModuleRegistry() {
    return require('./Libraries/TurboModule/TurboModuleRegistry');
  },
  // $FlowFixMe[unsafe-getters-setters]
  get UIManager() {
    return require('./Libraries/ReactNative/UIManager').default;
  },
  /**
   * @deprecated Since 0.86, `unstable_batchedUpdates` is a no-op that synchronously invokes the callback. React batches updates automatically, so call the callback directly instead.
   */
  unstable_batchedUpdates<T>(fn: (bookkeeping: T) => void, bookkeeping: T) {
    fn(bookkeeping);
  },
  // $FlowFixMe[unsafe-getters-setters]
  get useAnimatedValue() {
    return require('./Libraries/Animated/useAnimatedValue').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get useAnimatedValueXY() {
    return require('./Libraries/Animated/useAnimatedValueXY').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get useAnimatedColor() {
    return require('./Libraries/Animated/useAnimatedColor').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get useAppState() {
    return require('./Libraries/AppState/useAppState').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get useColorScheme() {
    return require('./Libraries/Utilities/useColorScheme').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get usePressability() {
    return require('./Libraries/Pressability/usePressability').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get useVerticalBarEdgeIOS() {
    return require('./Libraries/Components/StatusBar/useVerticalBarEdgeIOS')
      .default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get useWindowDimensions() {
    return require('./Libraries/Utilities/useWindowDimensions').default;
  },
  /**
   * @deprecated UTFSequence will be removed in a future release. Please insert Unicode escape sequences directly
   */
  // $FlowFixMe[unsafe-getters-setters]
  get UTFSequence() {
    warnOnce(
      'utfsequence-deprecated',
      "UTFSequence has been deprecated and will be removed in a future release. Please insert Unicode escape sequences directly, e.g. `'\\ufeff'` (BOM)",
    );
    return require('./Libraries/UTFSequence').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get Vibration() {
    return require('./Libraries/Vibration/Vibration').default;
  },
  // $FlowFixMe[unsafe-getters-setters]
  get VirtualViewMode() {
    return require('./src/private/components/virtualview/VirtualView')
      .VirtualViewMode;
  },
  // #endregion
} as ReactNativePublicAPI;

// `Touchable` has been removed from the public API types, but remains
// re-exported at runtime here because of a hanging `react-native-svg` call
// site (fbsource).
// TODO(huntie): Remove this re-export once `react-native-svg` is updated.
/* $FlowFixMe[prop-missing] This is intentional: `Touchable` is a value-only
 * re-export that is absent from the public API types. */
/* $FlowFixMe[invalid-export] This is intentional: `Touchable` is a value-only
 * re-export that is absent from the public API types. */
Object.defineProperty(module.exports, 'Touchable', {
  configurable: true,
  get() {
    return require('./Libraries/Components/Touchable/Touchable').default;
  },
});

if (__DEV__) {
  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access InteractionManager. */
  Object.defineProperty(module.exports, 'InteractionManager', {
    configurable: true,
    get() {
      invariant(
        false,
        'InteractionManager has been removed from react-native core. ' +
          'Please refactor long tasks into smaller ones, and use ' +
          "'requestIdleCallback' instead.",
      );
    },
  });

  /* $FlowFixMe[invalid-export] This is intentional: Flow will error when
   * attempting to access Clipboard. */
  Object.defineProperty(module.exports, 'Clipboard', {
    configurable: true,
    get() {
      invariant(
        false,
        'Clipboard has been removed from react-native core. ' +
          "It can now be installed and imported from '@react-native-clipboard/clipboard' instead of 'react-native'. " +
          'See https://github.com/react-native-clipboard/clipboard',
      );
    },
  });
}
