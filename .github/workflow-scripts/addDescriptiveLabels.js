/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = async (github, context) => {
  const issue = context.payload.issue;
  const title = issue?.title?.toLowerCase();
  if (!title) return;

  const addLabels = async labelsToAdd => {
    await github.rest.issues.addLabels({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      labels: labelsToAdd,
    });
  };

  const labelsToAdd = [];
  for (const component of components) {
    if (title.includes(component.toLowerCase())) {
      labelsToAdd.push(`Component: ${component}`);
    }
  }
  for (const api of apis) {
    if (title.includes(api.toLowerCase())) {
      labelsToAdd.push(`API: ${api}`);
    }
  }
  for (const topic of Object.keys(topics)) {
    if (title.includes(topic.toLowerCase())) {
      labelsToAdd.push(topics[topic]);
    }
  }
  if (labelsToAdd.length > 0) {
    await addLabels(labelsToAdd);
  }
};

const labelAndroid = 'Platform: Android';
const labelIos = 'Platform: iOS';
const labelTvos = 'Platform: tvOS';
const labelNetworking = '🌐Networking';
const labelBundler = '📦Bundler';
const labelCli = '💻CLI';
const labelRegression = 'Impact: Regression';

const components = [
  'ActivityIndicator',
  'Button',
  'DatePickerIOS',
  'DrawerLayoutAndroid',
  'FlatList',
  'Image',
  'ImageBackground',
  'InputAccessoryView',
  'KeyboardAvoidingView',
  'ListView',
  'MaskedViewIOS',
  'Modal',
  'NavigatorIOS',
  'Picker',
  'PickerIOS',
  'ProgressBarAndroid',
  'ProgressViewIOS',
  'RefreshControl',
  'ScrollView',
  'SectionList',
  'SegmentedControlIOS',
  'Slider',
  'SnapshotViewIOS',
  'StatusBar',
  'Switch',
  'TabBarIOS',
  'TextInput',
  'ToolbarAndroid',
  'TouchableHighlight',
  'TouchableNativeFeedback',
  'TouchableOpacity',
  'TouchableWithoutFeedback',
  'ViewPagerAndroid',
  'VirtualizedList',
  'WebView',
];

const apis = [
  'AccessibilityInfo',
  'ActionSheetIOS',
  'Alert',
  'AlertIOS',
  'Animated',
  'AppRegistry',
  'AppState',
  'AsyncStorage',
  'BackAndroid',
  'BackHandler',
  'CameraRoll',
  'Clipboard',
  'DatePickerAndroid',
  'Dimensions',
  'Easing',
  'Geolocation',
  'ImageEditor',
  'ImagePickerIOS',
  'ImageStore',
  'InteractionManager',
  'Keyboard',
  'LayoutAnimation',
  'Linking',
  'ListViewDataSource',
  'NetInfo',
  'PanResponder',
  'PermissionsAndroid',
  'PixelRatio',
  'PushNotificationIOS',
  'Settings',
  'Share',
  'StatusBarIOS',
  'StyleSheet',
  'Systrace',
  'TimePickerAndroid',
  'ToastAndroid',
  'Transforms',
  'Vibration',
  'VibrationIOS',
];

const topics = {
  Flow: 'Flow',
  'Flow-Strict': 'Flow',
  xhr: labelNetworking,
  netinfo: labelNetworking,
  fetch: labelNetworking,
  okhttp: labelNetworking,
  http: labelNetworking,
  bundle: labelBundler,
  bundling: labelBundler,
  packager: labelBundler,
  'unable to resolve module': labelBundler,
  android: labelAndroid,
  ios: labelIos,
  tvos: labelTvos,
  'react-native-cli': labelCli,
  'react-native upgrade': labelCli,
  'react-native link': labelCli,
  regression: labelRegression,
};
