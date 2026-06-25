/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// Definitions by: Eloy Durán <https://github.com/alloy>
//                 HuHuanming <https://github.com/huhuanming>
//                 Kyle Roach <https://github.com/iRoachie>
//                 Tim Wang <https://github.com/timwangdev>
//                 Kamal Mahyuddin <https://github.com/kamal>
//                 Alex Dunne <https://github.com/alexdunne>
//                 Manuel Alabor <https://github.com/swissmanu>
//                 Michele Bombardi <https://github.com/bm-software>
//                 Martin van Dam <https://github.com/mvdam>
//                 Kacper Wiszczuk <https://github.com/esemesek>
//                 Ryan Nickel <https://github.com/mrnickel>
//                 Souvik Ghosh <https://github.com/souvik-ghosh>
//                 Cheng Gibson <https://github.com/nossbigg>
//                 Saransh Kataria <https://github.com/saranshkataria>
//                 Wojciech Tyczynski <https://github.com/tykus160>
//                 Jake Bloom <https://github.com/jakebloom>
//                 Ceyhun Ozugur <https://github.com/ceyhun>
//                 Mike Martin <https://github.com/mcmar>
//                 Theo Henry de Villeneuve <https://github.com/theohdv>
//                 Romain Faust <https://github.com/romain-faust>
//                 Be Birchall <https://github.com/bebebebebe>
//                 Jesse Katsumata <https://github.com/Naturalclar>
//                 Xianming Zhong <https://github.com/chinesedfan>
//                 Valentyn Tolochko <https://github.com/vtolochk>
//                 Sergey Sychev <https://github.com/SychevSP>
//                 Kelvin Chu <https://github.com/RageBill>
//                 Daiki Ihara <https://github.com/sasurau4>
//                 Abe Dolinger <https://github.com/256hz>
//                 Dominique Richard <https://github.com/doumart>
//                 Mohamed Shaban <https://github.com/drmas>
//                 Jérémy Barbet <https://github.com/jeremybarbet>
//                 David Sheldrick <https://github.com/ds300>
//                 Natsathorn Yuthakovit <https://github.com/natsathorn>
//                 ConnectDotz <https://github.com/connectdotz>
//                 Alexey Molchan <https://github.com/alexeymolchan>
//                 Alex Brazier <https://github.com/alexbrazier>
//                 Arafat Zahan <https://github.com/kuasha420>
//                 Pedro Hernández <https://github.com/phvillegas>
//                 Sebastian Silbermann <https://github.com/eps1lon>
//                 Zihan Chen <https://github.com/ZihanChen-MSFT>
//                 Lorenzo Sciandra <https://github.com/kelset>
//                 Mateusz Wit <https://github.com/MateWW>
//                 Saad Najmi <https://github.com/saadnajmi>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// Minimum TypeScript Version: 4.9

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// USING: these definitions are meant to be used with the TSC compiler target set to at least ES2015.
//
// USAGE EXAMPLES: check the RNTSExplorer project at https://github.com/bgrieder/RNTSExplorer
//
// CONTRIBUTING: please open pull requests
//
// CREDITS: This work is based on an original work made by Bernd Paradies: https://github.com/bparadie
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/// <reference path="modules/BatchedBridge.d.ts" />
/// <reference path="modules/Codegen.d.ts" />
/// <reference path="modules/Devtools.d.ts" />
/// <reference path="../src/types/globals.d.ts" />

export * from '../Libraries/ActionSheetIOS/ActionSheetIOS';
export * from '../Libraries/Alert/Alert';
export * from '../Libraries/Animated/Animated';
export * from '../Libraries/Animated/Easing';
export * from '../Libraries/Animated/useAnimatedValue';
export * from '../Libraries/Animated/useAnimatedValueXY';
export * from '../Libraries/Animated/useAnimatedColor';
export * from '../Libraries/AppState/AppState';
export * from '../Libraries/BatchedBridge/NativeModules';
export * from '../Libraries/Components/AccessibilityInfo/AccessibilityInfo';
export * from '../Libraries/Components/ActivityIndicator/ActivityIndicator';
export * from '../Libraries/Components/Clipboard/Clipboard';
export * from '../Libraries/Components/DrawerAndroid/DrawerLayoutAndroid';
export * from '../Libraries/Components/Keyboard/Keyboard';
export * from '../Libraries/Components/Keyboard/KeyboardAvoidingView';
export * from '../Libraries/Components/LayoutConformance/LayoutConformance';
export * from '../Libraries/Components/Pressable/Pressable';
export * from '../Libraries/Components/ProgressBarAndroid/ProgressBarAndroid';
export * from '../Libraries/Components/RefreshControl/RefreshControl';
export * from '../Libraries/Components/SafeAreaView/SafeAreaView';
export * from '../Libraries/Components/ScrollView/ScrollView';
export * from '../Libraries/Components/StatusBar/StatusBar';
export * from '../Libraries/Components/Switch/Switch';
export * from '../Libraries/Components/TextInput/InputAccessoryView';
export * from '../Libraries/Components/TextInput/TextInput';
export * from '../Libraries/Components/ToastAndroid/ToastAndroid';
export * from '../Libraries/Components/Touchable/Touchable';
export * from '../Libraries/Components/Touchable/TouchableHighlight';
export * from '../Libraries/Components/Touchable/TouchableNativeFeedback';
export * from '../Libraries/Components/Touchable/TouchableOpacity';
export * from '../Libraries/Components/Touchable/TouchableWithoutFeedback';
export * from '../Libraries/Components/View/View';
export * from '../Libraries/Components/View/ViewAccessibility';
export * from '../Libraries/Components/View/ViewPropTypes';
export * from '../Libraries/Components/Button';
export * from '../Libraries/Core/registerCallableModule';
export * as NativeComponentRegistry from '../Libraries/NativeComponent/NativeComponentRegistry';
export * from '../Libraries/EventEmitter/NativeEventEmitter';
export * from '../Libraries/EventEmitter/RCTDeviceEventEmitter';
export * from '../Libraries/EventEmitter/RCTNativeAppEventEmitter';
export * from '../Libraries/Image/Image';
export * from '../Libraries/Image/ImageResizeMode';
export * from '../Libraries/Image/ImageSource';
export * from '../Libraries/Interaction/PanResponder';
export * from '../Libraries/LayoutAnimation/LayoutAnimation';
export * from '../Libraries/Linking/Linking';
export * from '../Libraries/Lists/FlatList';
export * from '../Libraries/Lists/SectionList';
export * from '@react-native/virtualized-lists';
export * from '../Libraries/LogBox/LogBox';
export * from '../Libraries/Modal/Modal';
export * as Systrace from '../Libraries/Performance/Systrace';
export * from '../Libraries/PermissionsAndroid/PermissionsAndroid';
export * from '../Libraries/PushNotificationIOS/PushNotificationIOS';
export * from '../Libraries/ReactNative/AppRegistry';
export * from '../Libraries/ReactNative/I18nManager';
export * from '../Libraries/ReactNative/RendererProxy';
export * from '../Libraries/ReactNative/RootTag';
export * from '../Libraries/ReactNative/UIManager';
export * from '../Libraries/ReactNative/requireNativeComponent';
export * from '../Libraries/Settings/Settings';
export * from '../Libraries/Share/Share';
export * from '../Libraries/StyleSheet/PlatformColorValueTypesIOS';
export * from '../Libraries/StyleSheet/PlatformColorValueTypes';
export * from '../Libraries/StyleSheet/StyleSheet';
export * from '../Libraries/StyleSheet/StyleSheetTypes';
export * from '../Libraries/StyleSheet/processColor';
export * from '../Libraries/Text/Text';
export * from '../Libraries/TurboModule/RCTExport';
export * as TurboModuleRegistry from '../Libraries/TurboModule/TurboModuleRegistry';
export * as CodegenTypes from '../Libraries/Types/CodegenTypesNamespace';
export * from '../Libraries/Types/CoreEventTypes';
export * from '../Libraries/Utilities/Appearance';
export * from '../Libraries/Utilities/BackHandler';
export * from '../src/private/devsupport/devmenu/DevMenu';
export * from '../Libraries/Utilities/DevSettings';
export * from '../Libraries/Utilities/Dimensions';
export * from '../Libraries/Utilities/PixelRatio';
export * from '../Libraries/Utilities/Platform';
export * from '../Libraries/Vibration/Vibration';
export * from '../Libraries/vendor/core/ErrorUtils';
export {
  EmitterSubscription,
  EventSubscription,
} from '../Libraries/vendor/emitter/EventEmitter';

export * from './public/DeprecatedPropertiesAlias';
export * from './public/Insets';
export * from './public/ReactNativeRenderer';
export * from './public/ReactNativeTypes';

export {default as codegenNativeCommands} from '../Libraries/Utilities/codegenNativeCommands';
export {default as codegenNativeComponent} from '../Libraries/Utilities/codegenNativeComponent';
