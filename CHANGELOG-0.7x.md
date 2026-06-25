# Changelog (pre 0.80)

## v0.79.7

### Fixed

#### Android specific

- **Layout:** Make missing parent view state in updateLayout a soft error ([56ad8d9bfd](https://github.com/facebook/react-native/commit/56ad8d9bfd08ea70bc6f5726a2b4a6afb6d2d7c2) by [@javache](https://github.com/javache))
- **Layout:** Make missing parent view state in updateLayout a soft error ([f2e47d8dab](https://github.com/facebook/react-native/commit/f2e47d8dabcd61621ea81c86cd1e2488948c4229) by [@cipolleschi](https://github.com/cipolleschi))

## v0.79.6

### Added

#### Android specific

- **RNGP** Add support for `exclusiveEnterpriseRepository`  ([df5ac988ce](https://github.com/facebook/react-native/commit/df5ac988cec936c430d41b0fcc15181dc06e46a1) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- **Cocoapods:** Add the ENTERPRISE_REPOSITORY env var to let user consume artifacts from their personal maven mirror ([a74d930c93](https://github.com/facebook/react-native/commit/a74d930c93ffae8c02142e8cc016a4c390a5f784) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- **Codegen:** Add missing Babel dependencies ([bf2c3af93b](https://github.com/facebook/react-native/commit/bf2c3af93b146943cb35866fa9badcd188e63f5b) by [@tido64](https://github.com/tido64))

#### Android specific

- **Legacy Arch:** Fix Legacy arch crashing or freezing upon reload ([db600b2e9e](https://github.com/facebook/react-native/commit/db600b2e9e87863cad6dd5ce262dc1f793bcaeb0) by [@robhogan](https://github.com/robhogan))
- **Modal:** Fix Modal first frame being rendered on top-left corner ([5a315f8d6b](https://github.com/facebook/react-native/commit/5a315f8d6b0ea54442c7ef94b7346b0c73fd0b4c) by [@cortinico](https://github.com/cortinico))
- **TurboModule:** Fix emitting event from turbo module crashes on 32bit android ([43bc43e5e8](https://github.com/facebook/react-native/commit/43bc43e5e85519d2924c4fc80765e66d0c48b1a9) by [@vladimirivanoviliev](https://github.com/vladimirivanoviliev))

## v0.79.5

### Fixed

- **Flow:** Publish top-level Flow types for `react-native` ([fbbd20dd63](https://github.com/facebook/react-native/commit/fbbd20dd632acd72d2abe861dd4a0e6e98437cf2) by [@buschco](https://github.com/buschco))

## v0.79.4

### Fixed

- **Codegen:** Backports fix: exclusion of selectively disabled libraries from codegen generation ([3acfe01382](https://github.com/facebook/react-native/commit/3acfe01382e67b16386bb04f7730abc479fec1cc) by [@cipolleschi](https://github.com/cipolleschi))
- **Flow:** Publish top-level Flow types for `react-native` ([50667eceb1](https://github.com/facebook/react-native/commit/50667eceb1be4771375d6a3cc2f4e42d4d8aad3a) by [@aswinandro](https://github.com/aswinandro))
- **Runtime:** Disabling `updateRuntimeShadowNodeReferencesOnCommit` by default. ([2cd074d77a](https://github.com/facebook/react-native/commit/2cd074d77a706f4fe4396ffdf87408f781e935a4) by [@lenaic](https://github.com/lenaic))

#### Android specific

- **TextInput:** Fix broken focus behavior for TextInput in older Android versions (< 9) ([0ebaaed281](https://github.com/facebook/react-native/commit/0ebaaed281fcfa01b20a17a461c1d0b489a7f0a2) by [@joevilches](https://github.com/joevilches))

#### iOS specific

- **Dimensions:** Fix Dimensions not changing when orientation changes ([235ac2cca0](https://github.com/facebook/react-native/commit/235ac2cca0b173934d329f3a797f136a219d315f) by [@riteshshukla04](https://github.com/riteshshukla04))

## v0.79.3

### Fixed

- **Runtime:** Align timer IDs and timer function argument error handling with web standards. ([480a4642e5](https://github.com/facebook/react-native/commit/480a4642e5a644becf1c477d3d239f9b57efff3a) by [@kitten](https://github.com/kitten))
- **Typescript:** Reference `global.d.ts` using path not types so they can be resolved by TSC ([af21f260a1](https://github.com/facebook/react-native/commit/af21f260a1cee460d11fc9c292aaa9f602cbd5a4) by [@krystofwoldrich](https://github.com/krystofwoldrich))

#### Android specific

- **Runtime:** Fixes issue with z-indexed sibling removal ([34ae9facd5](https://github.com/facebook/react-native/commit/34ae9facd52b5da28b5ced22110532bbcdad2cec) by [@rozele](https://github.com/rozele))
- **Style:** Wrong borderBottomEndRadius on RTL ([68d6ada448](https://github.com/facebook/react-native/commit/68d6ada44893701b6006a6b1753131c7e880a30a) by [@riteshshukla04](https://github.com/riteshshukla04))

#### iOS specific

- **Cocoapods:** enable DEFINES_MODULE in React-jsc ([c8fcac2765](https://github.com/facebook/react-native/commit/c8fcac2765e0f79f0e7bb3a422a65698aec62536) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Allow the .pnpm folder to be discovered during code generation ([ed7b4d86ab2b77b4cba6c2105e35047ac68c93e1](https://github.com/facebook/react-native/commit/ed7b4d86ab2b77b4cba6c2105e35047ac68c93e1) by [@kirill3333](https://github.com/kirill3333))
- **Codegen:** Exclude selectively disabled libraries from codegen generation ([e5c089669a](https://github.com/facebook/react-native/commit/e5c089669a82bd2075c1657d0291aa32a6b61966) by [@cipolleschi](https://github.com/cipolleschi))
- **Interop Layer:** Fixed adding child views to a native view using the interop layer ([d53a60dd23](https://github.com/facebook/react-native/commit/d53a60dd23c5df8afca058a867c50df8b61f62e2) by [@chrfalch](https://github.com/chrfalch))
- **RedBox:** Fix disappearing redbox on initial load of an invalid bundle. ([4cc9db1cd5](https://github.com/facebook/react-native/commit/4cc9db1cd501b019e90bb540ce836e2a2c2bf2ff) by [@aleqsio](https://github.com/aleqsio))
- **Switch:** Fixes Switch component incorrectly renders as toggled on even though value prop is hardcoded to false ([8d42fc40bc](https://github.com/facebook/react-native/commit/8d42fc40bc1b31efa7913198e23f39ac46532dc7) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.79.2

### Added

- **Runtime:** Add useShadowNodeStateOnClone and updateRuntimeShadowNodeReferencesOnCommit ([22a4e060d5](https://github.com/facebook/react-native/commit/22a4e060d5cf6b31d940f39f6e4776c14192d240) by [@lenaic](https://github.com/lenaic))

### Fixed

- **Blob:** Make sure that URLs are parsed following the node specs ([6d8a02a666](https://github.com/facebook/react-native/commit/6d8a02a66606bd0a3931626aff0e76f7c3b31caa) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Fix codegen ImageSource require ([4d7c4bd6e8](https://github.com/facebook/react-native/commit/4d7c4bd6e8bf79f069970ca4f54ae3f4c92b80e0) by [@jakex7](https://github.com/jakex7))

## v0.79.1

### Changed

#### Android specific

- **DevSupport:** Change `defaultJSExceptionHandler`'s type to  `JSExceptionHandler` on the `ReleaseDevSupportManager` ([9eb75d4bd5](https://github.com/facebook/react-native/commit/9eb75d4bd553bdc166118110d095b98bef811d4e) by [@alanjhughes](https://github.com/alanjhughes))

#### iOS specific

- **TextInput:** Typing into TextInput now will not cause the caret position to update to the beginning when a zero-length selection is set. ([7771317e5c](https://github.com/facebook/react-native/commit/7771317e5cf49bda65275ea1149160a45c607803) by [@ouchuan](https://github.com/ouchuan))

### Fixed

#### Android specific

- **Codegen:** Do not generate Apple specific file for Android ([b2bacc4a9f](https://github.com/facebook/react-native/commit/b2bacc4a9f3b97a4f59126a229477d3c952b3f44) by [@cipolleschi](https://github.com/cipolleschi))

#### iOS specific

- **Codegen:** Do not generate ReactCodegen.podspec for libraries ([f3c280442d](https://github.com/facebook/react-native/commit/f3c280442dc49e13b24baa2348f6b8c802045178) by [@cipolleschi](https://github.com/cipolleschi))

## v0.79.0

### Added

- **Codegen:** Allow UnsafeMixed as Array value in codegen ([abd7259de4](https://github.com/facebook/react-native/commit/abd7259de4c11f2615788e8bb258b0459c57eeed) by [@javache](https://github.com/javache))
- **DevX:** Add inspector proxy events for debugger heartbeat (sampled) and abandoned connections ([84f3cf95ea](https://github.com/facebook/react-native/commit/84f3cf95ea9ad17ba5c0014ea35d0b8e98af56fe) by [@vzaidman](https://github.com/vzaidman))
- **DevX:** Add inspector proxy info logs in regards to CDP connection to device and DevTools ([29419ce8f0](https://github.com/facebook/react-native/commit/29419ce8f095e3d763adb5073140b115fecb66e2) by [@vzaidman](https://github.com/vzaidman))
- **Flow:** Added explicit type for _lastNativeRefreshing and changed React import syntax in RefreshControl ([a24f9ef825](https://github.com/facebook/react-native/commit/a24f9ef825a0291b7fec20d9ab190c67c94f3260) by [@coado](https://github.com/coado))
- **Flow:** Added explicit type for _memoizedRenderer and changed React and View import in FlatList ([b634fa1edb](https://github.com/facebook/react-native/commit/b634fa1edb56bd01724d24dee4b0243c68ddc4d2) by [@coado](https://github.com/coado))
- **Flow:** Added explicit type for argument in _captureRef in SectionList ([e31ff4212b](https://github.com/facebook/react-native/commit/e31ff4212b62e4b7dc3ed746d790645e893fbd11) by [@coado](https://github.com/coado))
- **Flow:** Added explicit type for Symbol.iterator in URLSearchParams ([89af3e804f](https://github.com/facebook/react-native/commit/89af3e804f2da3874bc1c20ff1e3ba892efe3ea3) by [@coado](https://github.com/coado))
- **Flow:** Added explicit type to supported commands in TextInputNativeCommands ([1126bbb149](https://github.com/facebook/react-native/commit/1126bbb1493dbea04addfdcc809ace01aecab604) by [@coado](https://github.com/coado))
- **Flow:** Added type for exported object in AssetRegistry ([44d84f2af6](https://github.com/facebook/react-native/commit/44d84f2af60392684d0ff4b4e65ae797fad5b456) by [@coado](https://github.com/coado))
- **Flow:** Added types in TouchHistoryMath ([b9df812b67](https://github.com/facebook/react-native/commit/b9df812b67a22d459e85511962ac507a80f67f29) by [@coado](https://github.com/coado))
- **Infra:** Open Sourcing React Native's Compatibility Check ([60e3921f9c](https://github.com/facebook/react-native/commit/60e3921f9cf0a91edd54c269f3157d81d0d4467a) by [@elicwhite](https://github.com/elicwhite))
- **Layout:** Linear gradient color transition hint syntax and `px` unit support. ([cc89ddd50b](https://github.com/facebook/react-native/commit/cc89ddd50bed869013082ad98eb0555a386cf7c9) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **Layout:** Support stylistic sets for fontVariant ([c09b71b990](https://github.com/facebook/react-native/commit/c09b71b99038bacfbc2a1dca521a9220afa3dcb4) by [@LeviWilliams](https://github.com/LeviWilliams))
- **LogBox:** Add full owner stack support to React Native ([967ef32154](https://github.com/facebook/react-native/commit/967ef321548321c184432221e38c2f0394d4e264) by [@rickhanlonii](https://github.com/rickhanlonii))
- **LogBox:** Add owner stack code frames to LogBox ([0affa544c3](https://github.com/facebook/react-native/commit/0affa544c334aa6804cc787324decac45ba82cce) by [@rickhanlonii](https://github.com/rickhanlonii))
- **Metro:** Add opt in for legacy Metro log streaming via `--client-logs` flag ([0d66c524cf](https://github.com/facebook/react-native/commit/0d66c524cfdf4f3abd742b3b8bc6b39f24f7c214) by [@huntie](https://github.com/huntie))
- **TextInput:** Adds the escape key to the key press event handler payload. ([e566c1ec06](https://github.com/facebook/react-native/commit/e566c1ec067188f36f36d7ffd087e7ac06c69617) by [@sbuggay](https://github.com/sbuggay))

#### Android specific

- **Docs:** Improve ToastAndroid jsdocs ([299a7a959d](https://github.com/facebook/react-native/commit/299a7a959d34cda9900acb7318aabf7262acc23e) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Gradle:** Add support for Gradle Configuration caching ([e41887e62f](https://github.com/facebook/react-native/commit/e41887e62fcaf5a8d6bfc2817f88298b49d1b7a5) by [@cortinico](https://github.com/cortinico))
- **Initialization:** On `DefaultNewArchitectureEntryPoint` class add property to specify the desired release level for an application ([19c18eb995](https://github.com/facebook/react-native/commit/19c18eb9957f711ab63a9e3a334972389162bde8) by [@jorge-cab](https://github.com/jorge-cab))
- **Initialization:** Set ReactSurface and ReactRootView to ReactDelegate when created via ReactNavigationActivityDelegate ([a302fbcaaf](https://github.com/facebook/react-native/commit/a302fbcaaf69c8f019a212f7b9b839fa1ddd6b2f) by Maddie Lord)

#### iOS specific

- **Initialization:** Encapsulate device info listeners ([7dc85d0e97](https://github.com/facebook/react-native/commit/7dc85d0e9765e7f633285843506b8832ff13db9f) by [@okwasniewski](https://github.com/okwasniewski))
- **JSC:** Inform users about JSC being moved to a different repo ([13177b3025](https://github.com/facebook/react-native/commit/13177b3025d06c93fb2634a19e0033b8ac4f67a7) by [@okwasniewski](https://github.com/okwasniewski))
- **JSC:** Js runtime C API for Swift ([a6607c07cd](https://github.com/facebook/react-native/commit/a6607c07cda6bb24c12b41761598b84ce8e028cd) by [@okwasniewski](https://github.com/okwasniewski))
- **Runtime:** Added custom load js block in bridge mode ([1e9ac296a5](https://github.com/facebook/react-native/commit/1e9ac296a59f3698ca656ef0161e93ba9dc941c8) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Runtime:** Missing nonnull annotations for RCTArchConfiguratorProtocol, RCTUIConfiguratorProtocol.h ([0141a44026](https://github.com/facebook/react-native/commit/0141a44026a62074d1288963d243a55216c2e4d7) by [@okwasniewski](https://github.com/okwasniewski))
- **TextInput:** Add support for `numberOfLines` prop on `TextInput` ([dcaa33e6d9](https://github.com/facebook/react-native/commit/dcaa33e6d9d59b7d32bbdc14a91b297b6d68cee1) by [@j-piasecki](https://github.com/j-piasecki))

### Breaking

- **APIs:** Deep imports to modules inside React Native libraries with `require` syntax will now require to append an explicit `.default`. Here the list of affected modules:
  - `Libraries/Alert` and `Libraries/ActionSheetIOS` ([c89c5d7e3d](https://github.com/facebook/react-native/commit/c89c5d7e3d981e5e11ae926bdd83567cbe61201a) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/BatchedBridge` and `Libraries/AppState` ([135277ace1](https://github.com/facebook/react-native/commit/135277ace118b1fbc11e222624f871221d1a3b72) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Blob` ([9a70bc0418](https://github.com/facebook/react-native/commit/9a70bc041889d961c2c5ee3f58d6a135111bc0a4) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/BugReporting`, `Libraries/vendor`, `Libraries/Vibration` and `Libraries/YellowBox` ([09700327f7](https://github.com/facebook/react-native/commit/09700327f7294ed5242fb6af7804e124183ebc64) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Components` ([9eeef22a67](https://github.com/facebook/react-native/commit/9eeef22a67ff74ccc2d20647624bee26211a3ab5) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Components` ([aac312da8e](https://github.com/facebook/react-native/commit/aac312da8e23b865027e89a93ecb9cc89bfb9860) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Components` ([ce412746b1](https://github.com/facebook/react-native/commit/ce412746b1635dce3162eb798f59f604dd1bbb03) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Components` ([da695f3a20](https://github.com/facebook/react-native/commit/da695f3a2084f9742d2c75e1b6c5dfa0dba23580) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/DevMenu` ([ce84922236](https://github.com/facebook/react-native/commit/ce849222365a5990b0127fe62739cb2794b31568) by [@j-piasecki](https://github.com/j-piasecki))
  - `Libraries/EventEmitter` and `Libraries/Image/*.js` ([8783196ee5](https://github.com/facebook/react-native/commit/8783196ee540f8f78ce60ad20800338cc7645194) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Interaction` ([bdc23fa2b4](https://github.com/facebook/react-native/commit/bdc23fa2b44401c0c6e66d8cf9a0df542ee2c871) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/LayoutAnimation` and `Libraries/Linking` ([4d6785bdb5](https://github.com/facebook/react-native/commit/4d6785bdb53a94d650364ef7b5821fab16c39ae3) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Lists` ([e767dc3458](https://github.com/facebook/react-native/commit/e767dc3458c6665e9f63cf0723f12c9beab6724a) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Modal` and `Libraries/Network` ([28945c68da](https://github.com/facebook/react-native/commit/28945c68da056ab2ac01de7e542a845b2bca6096) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/PermissionsAndroid` and `Libraries/PushNotificationIOS` ([e74246bd66](https://github.com/facebook/react-native/commit/e74246bd66fd434cefc8a5a0cc2b3ae7ea725816) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/ReactNative` ([c93bd436a5](https://github.com/facebook/react-native/commit/c93bd436a57c760461a269aced681854e5dd3f13) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/StyleSheet` ([4f20362b07](https://github.com/facebook/react-native/commit/4f20362b07c0b3daa14094a4b5d0dc41e2c956ca) by [@j-piasecki](https://github.com/j-piasecki))
  - `Libraries/Text`, `Libraries/Share` and `Libraries/Settings` ([156ee5bee7](https://github.com/facebook/react-native/commit/156ee5bee7d2588399f2b8c19fa01ce40b8335d8) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Text`, `Libraries/Share` and `Libraries/Settings` ([1be7e1a95f](https://github.com/facebook/react-native/commit/1be7e1a95fed16c46767a7907ac864d5170ba540) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Utilities/BackHandler`, `Utilities/DevLoadingView.js` and `Utilities/HMRClient*.js` ([827a847791](https://github.com/facebook/react-native/commit/827a8477912f56e3d0d2b50007a4c06a6468a0bc) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Utilities/differ/...` ([2b30aa5cc8](https://github.com/facebook/react-native/commit/2b30aa5cc8fef42cf8bc110b8d48a201a3dc855a) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Utilities/Platform` ([d98116aa44](https://github.com/facebook/react-native/commit/d98116aa44e4b90ccb19fd895433918396b0b932) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/Utilities` ([52ffda7e55](https://github.com/facebook/react-native/commit/52ffda7e55cf8330905d57869c0bb3b5793c0e58) by [@iwoplaza](https://github.com/iwoplaza))
  - `Libraries/WebSocket` ([7df73eebdc](https://github.com/facebook/react-native/commit/7df73eebdc9716819d59a27e4bc783cb853c9775) by [@iwoplaza](https://github.com/iwoplaza))
  - `react-native/virtualized-lists` ([1cf4c84ba0](https://github.com/facebook/react-native/commit/1cf4c84ba0f6f630d55ba0bebde122d742c419e8) by [@j-piasecki](https://github.com/j-piasecki))
  - `StyleSheet/` ([e4d969a4ab](https://github.com/facebook/react-native/commit/e4d969a4ab71693f38837271356361a3d9df8c5d) by [@iwoplaza](https://github.com/iwoplaza))
  - `Utilities/binaryToBase64`, `Utilities/DevSettings`, `Utilities/PolyfillFunctions` and `Utilities/RCTLog` ([152587cda0](https://github.com/facebook/react-native/commit/152587cda06ec3bb2274ec0182114c85c41507d3) by [@iwoplaza](https://github.com/iwoplaza))
  - `Utilities/deepFreezeAndThrowOnMutationInDev`, `Utilities/defineLazyObjectProperty`, `Utilities/DeviceInfo` and `Utilities/FeatureDetection` ([028c0b36f6](https://github.com/facebook/react-native/commit/028c0b36f637b31d013bab88e0c834ea8174b4e1) by [@iwoplaza](https://github.com/iwoplaza))
  - `Utilities/dismissKeyboard.js`, `Utilities/GlobalPerformanceLogger.js` and `Utilities/SceneTracker.js` ([fc6ca26d3f](https://github.com/facebook/react-native/commit/fc6ca26d3f97e5a839313803635b38eb468b10b9) by [@iwoplaza](https://github.com/iwoplaza))
  - `Utilities/infoLog`, `Utilities/logError`, `Utilities/mapWithSeparator` and `Utilities/warnOnce` ([7aef81b984](https://github.com/facebook/react-native/commit/7aef81b9840074e85ef3a2e81d808009868cbbbf) by [@iwoplaza](https://github.com/iwoplaza))
  ([48d900b703](https://github.com/facebook/react-native/commit/48d900b703aa125f2bc6e7ab5a24de45572bc66b) by [@iwoplaza](https://github.com/iwoplaza))
- **APIs:** `Libraries/Core/ExceptionsManager` now exports a default `ExceptionsManager` object, and `SyntheticError` as a secondary export. ([e5818d92a8](https://github.com/facebook/react-native/commit/e5818d92a867dbfa5f60d176b847b1f2131cb6da) by [@iwoplaza](https://github.com/iwoplaza))
- **APIs:** Move `Libraries/Inspector/` modules to `src/private/` ([0bde08fe67](https://github.com/facebook/react-native/commit/0bde08fe67c57740118b2bda49fb1f6b427a118b) by [@huntie](https://github.com/huntie))
- **APIs:** Move `XHRInterceptor` API to `src/private/` ([389779c348](https://github.com/facebook/react-native/commit/389779c3482fac98f6ab9ad50ac194cabfe38a98) by [@huntie](https://github.com/huntie))
- **APIs:** Removed `Libraries/Animated/AnimatedWeb.js` file. ([ecae8a2908](https://github.com/facebook/react-native/commit/ecae8a29089130e0d30ef91c69077a17e9d2b67d) by [@iwoplaza](https://github.com/iwoplaza))
- **DevX:** Remove deprecated `unstable_enableLogBox` function. LogBox is enabled by default. ([7368265107](https://github.com/facebook/react-native/commit/7368265107ba31fbfc35bb481ab7fb5626bfe072) by [@huntie](https://github.com/huntie))
- **DevX:** Remove deprecated `YellowBox` and `console.ignoredYellowBox` APIs. Use `LogBox`. ([45a2d9c5a8](https://github.com/facebook/react-native/commit/45a2d9c5a80f93de907a73ee2d61518c4b528d9a) by [@huntie](https://github.com/huntie))
- **DevX:** Remove legacy Libraries/JSInspector modules ([9ba4dd81db](https://github.com/facebook/react-native/commit/9ba4dd81db08c401ef04fa60800585bf39c6dab3) by [@huntie](https://github.com/huntie))
- **DevX:** Remove some web debugging remnants ([9aae84a688](https://github.com/facebook/react-native/commit/9aae84a688b5af87faf4b68676b6357de26f797f) by [@NickGerleman](https://github.com/NickGerleman))
- **Libs:** Remove incorrect hwb() syntax support from normalize-color ([676359efd9](https://github.com/facebook/react-native/commit/676359efd9e478d69ad430cff213acc87b273580) by [@NickGerleman](https://github.com/NickGerleman))
- **StyleSheet:** Disallow invalid unitless lengths in box shadows ([8e2de303e3](https://github.com/facebook/react-native/commit/8e2de303e329e29728843dce4ff81177efca0a7a) by [@NickGerleman](https://github.com/NickGerleman))
- **StyleSheet:** Disallow invalid unitless lengths in filters ([b34e63539d](https://github.com/facebook/react-native/commit/b34e63539dc49b0b6586441f4df4d7d28fd47237) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- **APIs:** Make `ResponseUtil` internal ([360cbf7433](https://github.com/facebook/react-native/commit/360cbf7433f885522e2393802af5caf2b96d4595) by [@mateoguzmana](https://github.com/mateoguzmana))
- **APIs:** Removed `RuntimeConfig` class for Hermes which was unused. ([08ddc11269](https://github.com/facebook/react-native/commit/08ddc11269808da0adabb4139718d73310f2f2b7) by [@cortinico](https://github.com/cortinico))
- **APIs:** Reduce visibility of `FabricUIManager.setBinding()` method, unused outside of react native ([2a9a13d567](https://github.com/facebook/react-native/commit/2a9a13d567bb63dabcd698a2ad737ef3b5513a1f) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Remove `TLSSocketFactory` class ([e065411c91](https://github.com/facebook/react-native/commit/e065411c91f2592e172b1fa5e3c1348c04d513e6) by [@mateoguzmana](https://github.com/mateoguzmana))
- **API:** `RuntimeExecutor` and `RuntimeScheduler` constructors are now private, `MapBufferSoLoader` was removed as no longer required. ([6c8ace9b05](https://github.com/facebook/react-native/commit/6c8ace9b05898fd3bfd3673af1f99680d0c1ebb1) by [@javache](https://github.com/javache))
- **API:** Remove `DevSupportManagerFactory.launchJSDevtools` API ([514ec4192f](https://github.com/facebook/react-native/commit/514ec4192fbaa6922dac20a72c8902b921c5a97e) by [@huntie](https://github.com/huntie))
- **API:** Stable API - Make `AnimatedNodeWithUpdateableConfig` internal as it was not used in OSS ([54e0b69e7e](https://github.com/facebook/react-native/commit/54e0b69e7e325b667ef4b69eab0bfa123ce8e428) by [@cortinico](https://github.com/cortinico))

### Changed

- **Animated:** Introduced a feature flag to test an optimization in `Animated` to reduce memory usage. ([fb8a6a5bb0](https://github.com/facebook/react-native/commit/fb8a6a5bb08892d9d74c607ec99f4afc9c967b04) by [@yungsters](https://github.com/yungsters))
- **Animated:** The `AnimatedNode` graph will not occur during the insertion effect phase, which means animations can now be reliably started during layout effects. ([e0c0476553](https://github.com/facebook/react-native/commit/e0c0476553912a864b1bf19a98678432afa57659) by [@yungsters](https://github.com/yungsters))
- **Animated:** When an Animated component is updated or unmounted, `AnimatedNode` instances will now detach in a microtask instead of synchronously in the commit phase of React. This will cause the completion callback of finished animations to execute after the commit phase instead of during it. ([50b75a74d1](https://github.com/facebook/react-native/commit/50b75a74d1d8f8f0237d044f6bf72d49ca9e5cf4) by [@yungsters](https://github.com/yungsters))
- **Codegen:** Replace jscodeshift with @babel/core ([8f19201](https://github.com/facebook/react-native/commit/8f19201c5edd7fd18ab1ada8d4df2a8c31be8d4d) by [@kitten](https://github.com/kitten))
- **Deps:** Bump Node 18 -> 20 to build React Native in OSS ([1fd3806ee9](https://github.com/facebook/react-native/commit/1fd3806ee9a8d463da9a2c29c6a8597da53a61e8) by [@cortinico](https://github.com/cortinico))
- **Deps:** Upgrade React DevTools to 6.1.0. ([07860545f5](https://github.com/facebook/react-native/commit/07860545f5994b1e1f395bec60012433d9abf2fe) by [@hoxyq](https://github.com/hoxyq))
- **Deps:** Upgrade React DevTools to 6.1.1. ([5c88633035](https://github.com/facebook/react-native/commit/5c886330359c04b953521a08e31eacd5aa399a9b) by [@hoxyq](https://github.com/hoxyq))
- **DevX:** `Debugger.scriptParsed` now includes the field `sourceMapURL` as a (rewritten) remote url as opposed to base64 data url ([ff2e40371e](https://github.com/facebook/react-native/commit/ff2e40371ec13d2fef54098c5391ca20292c572f) by [@vzaidman](https://github.com/vzaidman))
- **DevX:** Removed a long-running loop causing the app to lag while attempting a connection to Metro ([9b977def6c](https://github.com/facebook/react-native/commit/9b977def6c228b3fdadc870ac0c34a422933560b) by [@EdmondChuiHW](https://github.com/Edmond
ChuiHW))
- **FeatureFlags:** Re-enable `enableFixForViewCommandRace` feature flag ([ae59702f8e](https://github.com/facebook/react-native/commit/ae59702f8ee89e7bddec971e0a041744cb91e65c) by [@okwasniewski](https://github.com/okwasniewski))
- **Flow:** Improved eventInitDict type in WebSocketEvent class ([fa2fac1372](https://github.com/facebook/react-native/commit/fa2fac137287781d5b582507251af0352e654cec) by [@coado](https://github.com/coado))
- **Flow:** Improved Props type in UnimplementedView ([b200c7cb2f](https://github.com/facebook/react-native/commit/b200c7cb2f714e162cfc1d45b59fca4a9253233a) by [@coado](https://github.com/coado))
- **Flow:** Improved types for exported Types and Properties in LayoutAnimation ([3c02738ec4](https://github.com/facebook/react-native/commit/3c02738ec4c36d8414493ef8f0016a809d849d33) by [@coado](https://github.com/coado))
- **Flow:** Improved types in AnimatedWeb ([647ca90a30](https://github.com/facebook/react-native/commit/647ca90a3007f4c8d1f93ee9c262022e04e76ff8) by [@coado](https://github.com/coado))
- **Flow:** Improved types in ScrollView ([1be2ba4597](https://github.com/facebook/react-native/commit/1be2ba4597fbe835ec461caa9dd838e4186b49eb) by [@coado](https://github.com/coado))
- **Flow:** Improved types in StatusBar by adding StackProps ([48cafc0b69](https://github.com/facebook/react-native/commit/48cafc0b6971f7e1ddf3b6b37a66fdf0b3f08a88) by [@coado](https://github.com/coado))
- **Flow:** Improved types in TextAncestor ([df9d43f02b](https://github.com/facebook/react-native/commit/df9d43f02b3605e40f068bf5ba424e978af17a8f) by [@coado](https://github.com/coado))
- **Flow:** Improved types in WebSockertInterceptor callbacks ([d2adb976ab](https://github.com/facebook/react-native/commit/d2adb976abebcb0f38750903d98fbb5a3f50924b) by [@coado](https://github.com/coado))
- **Flow:** Refactored `Libraries/Components/StaticRenderer` syntax ([0e6cb590ec](https://github.com/facebook/react-native/commit/0e6cb590eca4f31c466f82c278f1f38f6273ed62) by [@coado](https://github.com/coado))
- **Flow:** Replaced $FlowFixMe in CodegenTypes with Object type ([812c3b33cd](https://github.com/facebook/react-native/commit/812c3b33cde53b47bcc43f2dd70cc780da5a4ae0) by [@coado](https://github.com/coado))
- **Flow:** Replaced $FlowFixMe in InteractionManager to Function type ([cd7a30ce48](https://github.com/facebook/react-native/commit/cd7a30ce4842ed58775512d244b6a9ed18956d4d) by [@coado](https://github.com/coado))
- **Flow:** Replaced $FlowFixMe in NativeModules with any type ([286a360d9b](https://github.com/facebook/react-native/commit/286a360d9b13d37f43fde74b66318aa73a7bc1f7) by [@coado](https://github.com/coado))
- **Flow:** Replaced $FlowFixMe in RCTDeviceEventEmitter with any ([8df6cfa56b](https://github.com/facebook/react-native/commit/8df6cfa56be1a9b38fba30cc074f8147ebc05928) by [@coado](https://github.com/coado))
- **Flow:** Replaced $FlowFixMe with PressEvent in ScrollViewNativeComponentType ([8befab1760](https://github.com/facebook/react-native/commit/8befab17604c7758358bc834beb5f9c02026e9ac) by [@coado](https://github.com/coado))
- **Metro:** Update Metro to ^0.82.0 ([8421b8a872](https://github.com/facebook/react-native/commit/8421b8a8723633da9806e2db37a43add5de8761c) by [@robhogan](https://github.com/robhogan))
- **TypeScript:** Improve TypeScript types for `global` objects ([094c5be42e](https://github.com/facebook/react-native/commit/094c5be42eace6eb83fabc1f46336745c6879401) by [@coado](https://github.com/coado))
- **TypeScript:** Increase minimum typescript version in index.d.ts ([721f85adf7](https://github.com/facebook/react-native/commit/721f85adf7336cb07dafbfd98f9612f2e2b43268) by [@coado](https://github.com/coado))
- **TypeScript:** Move view flattening props to cross platform type interface ([ecad90ad8b](https://github.com/facebook/react-native/commit/ecad90ad8b68c623d028938cf84d1dbccc45e45f) by [@okwasniewski](https://github.com/okwasniewski))

#### Android specific

- **Deps:** Bump AGP to 8.8.2 ([2062defb2d](https://github.com/facebook/react-native/commit/2062defb2d9ce218056f072fb7f1b00375336bcf) by [@cortinico](https://github.com/cortinico))
- **Deps:** Gradle to 8.13 ([b95424d159](https://github.com/facebook/react-native/commit/b95424d1596a5b562b4fc5a0da38b7d9efab2f19) by [@cortinico](https://github.com/cortinico))
- **Deps:** Update androidx app compat to 1.7.0 ([b0fd9c1556](https://github.com/facebook/react-native/commit/b0fd9c155697ebc105cee99ce79b84ca43e491a5) by [@janicduplessis](https://github.com/janicduplessis))
- **Gradle:** Better compatibility with Kotlin 2.1.x ([a0528d834c](https://github.com/facebook/react-native/commit/a0528d834c644766a78cff8b092ca1c5447e20b5) by [@cortinico](https://github.com/cortinico))
- **Gradle:** Add option to disable bundle compression to improve startup time ([778382ad3d](https://github.com/facebook/react-native/commit/778382ad3d8f5ecc4535ed44b2cd508475a97beb) by [@mrousavy](https://github.com/mrousavy))
- **Initialization:** Allow passing custom JSRuntimeFactory to DefaultReactHost ([cdc166709d](https://github.com/facebook/react-native/commit/cdc166709d247dbcff6b390d1f51840c9f330a69) by [@Kudo](https://github.com/Kudo))
- **JSC:** Add a build time JSC lean core warning ([90e27c2b4f](https://github.com/facebook/react-native/commit/90e27c2b4f6c831922e61b370342ced328cb705d) by [@Kudo](https://github.com/Kudo))
- **JSC:** Exclude `jsctooling` when `useThirdPartyJSC` gradle property is true ([66032f22b8](https://github.com/facebook/react-native/commit/66032f22b8cab9fb7ad4c26d508e2d9bba3ae308) by [@Kudo](https://github.com/Kudo))
- **Runtime:** Feature flags for recycling View, Text components separately ([ca5ce205f7](https://github.com/facebook/react-native/commit/ca5ce205f71f1af9cd42d4677c2b5a8dee684abb) by Thomas Nardone)
- **Runtime:** Introduces BuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE to determine if the new architecture is fully enabled into an Android app ([b45a3e5cd8](https://github.com/facebook/react-native/commit/b45a3e5cd81997e11b763073daf0a7f5b78188f8) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- **CocoaPods:** Fix Gemfile versions ([2527d29a96](https://github.com/facebook/react-native/commit/2527d29a96216fbaafd4f98fd7a931b9330e0570) by [@cipolleschi](https://github.com/cipolleschi))
- **CocoaPods:** Generate the ReactCodegen.podspec as part of codegen instead of as part of pod install. ([dab9b3b440](https://github.com/facebook/react-native/commit/dab9b3b44015acd1d2e462d3d0dc2597a99b16a9) by [@cipolleschi](https://github.com/cipolleschi))
- **Cocoapods:** Ignore deprecation warning when calling pod install through core-cli-utils ([4141560afc](https://github.com/facebook/react-native/commit/4141560afc06a38bc23cdcaa6a31e6f41e6e5408) by [@cipolleschi](https://github.com/cipolleschi))
- **CocoaPods:** Invoke Codegen as part of the Core-cli-utils package ([cc1e8d1523](https://github.com/facebook/react-native/commit/cc1e8d1523bee3880f0a038c550b8e2131d5a535) by [@cipolleschi](https://github.com/cipolleschi))
- **CocoaPods:** Stop running codegen when running pod install ([f15094ef88](https://github.com/facebook/react-native/commit/f15094ef880218a0517863e6cf7d11247be66bfb) by [@cipolleschi](https://github.com/cipolleschi))
- **JSC:** Decouple JSC when `USE_THIRD_PARTY_JSC=1` ([176bed79b4](https://github.com/facebook/react-native/commit/176bed79b4c69455f16527512feb87c67e6f89de) by [@Kudo](https://github.com/Kudo))
- **NativeModules:** Properly handle `null` values coming from NativeModules. ([d4236791e2](https://github.com/facebook/react-native/commit/d4236791e238a614d2fadf5c5659874d983ab029) by [@cipolleschi](https://github.com/cipolleschi))
- **Text:** Moved workaround for multiline text measurement with `maximumNumberOfLines` earlier in the pipeline ([167a1a30da](https://github.com/facebook/react-native/commit/167a1a30daab588982638dc878b434688653df47) by [@j-piasecki](https://github.com/j-piasecki))

### Deprecated

- **DevX:** Deprecated usage of `HERMES_ENABLE_DEBUGGER` build-time flag for enabling React Native debugger in favour of `REACT_NATIVE_DEBUGGER_ENABLED` and `REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY`. ([5fcb69e8b7](https://github.com/facebook/react-native/commit/5fcb69e8b7756434ee4bcd9e3d19cc3c719920c7) by [@hoxyq](https://github.com/hoxyq))

#### iOS specific

- **CocoaPods:** Deprecate calling `pod install` directly ([e3def00d7a](https://github.com/facebook/react-native/commit/e3def00d7a9567f5879a6cd0dfed161bc1aaa176) by [@cipolleschi](https://github.com/cipolleschi))
- **Initialization:** Deprecate RCTAppDelegate ([74de9526ab](https://github.com/facebook/react-native/commit/74de9526ab6c1fb1f627f340653cb78d898ca698) by [@okwasniewski](https://github.com/okwasniewski))

#### Android specific

- **Layout:** `ViewManagerPropertyUpdater.updateProps` is deprecated, use the related ViewManager APIs instead ([a18bc58645](https://github.com/facebook/react-native/commit/a18bc5864508e9073fa3190d786a68761fb45073) by [@javache](https://github.com/javache))
- **Layout:** Deprecated ViewManagerDelegate#setProperty and ViewManagerDelegate#receiveCommand ([5a290c4cab](https://github.com/facebook/react-native/commit/5a290c4cab6f58744a9252687feefd8b6a8d3305) by [@javache](https://github.com/javache))

### Fixed

- **C++:** Add default case to `displayModeToInt()` function ([8c06f57860](https://github.com/facebook/react-native/commit/8c06f57860278cd4ff4a03bf182d22a27fcd0779) by [@Yajur-Grover](https://github.com/Yajur-Grover))
- **C++:** Add explicit casts for pointerIds for PointerEvents in NativeDOM ([94ea10c693](https://github.com/facebook/react-native/commit/94ea10c6939f915251520b49aeb131917364c078) by [@jonthysell](https://github.com/jonthysell))
- **Codegen:** Fix codegen to avoid the creation of `<appName>,` folders ([9498b71438](https://github.com/facebook/react-native/commit/9498b714381d060109fa6a9673db264bc6659f64) by [@cipolleschi](https://github.com/cipolleschi))
- **DevX:** Always patch React DevTools first so StrictMode dim chars are excluded from logs/logbox. ([e015d1b19a](https://github.com/facebook/react-native/commit/e015d1b19a2d6894badbe5525c7e53f2c2e21742) by [@rickhanlonii](https://github.com/rickhanlonii))
- **DevX:** Disconnections of DevTools when the network is under significant strain. ([b0974135bf](https://github.com/facebook/react-native/commit/b0974135bf1c0946d4a85bdc1fd423ff7dc612c5) by [@vzaidman](https://github.com/vzaidman))
- **DevX:** FindNodeAtPoint now considers overflow area of the parent node ([d8bc7c68c0](https://github.com/facebook/react-native/commit/d8bc7c68c0a6ea2dee73edc3270dbdcb3b132af9) by [@hoxyq](https://github.com/hoxyq))
- **JS:** Fix `react-native-community/cli-platform-*` packages not being found in monorepos ([7926d656b3](https://github.com/facebook/react-native/commit/7926d656b30667a026a5bc85da61696e915893bf) by [@tido64](https://github.com/tido64))
- **JS:** Fix `react-native-community/cli` not being found in pnpm setups ([a672a4d007](https://github.com/facebook/react-native/commit/a672a4d0073a282ba9de1ca24a563833530f0d60) by [@tido64](https://github.com/tido64))
- **JS:** Fix registering of `start` and `bundle` commands with community CLI and isolated node_modules. ([cdaa1aa9aa](https://github.com/facebook/react-native/commit/cdaa1aa9aa330bc6c58d902a89f515d30288698f) by [@robhogan](https://github.com/robhogan))

#### Android specific

- **Codegen:** Improve input files for codegen gradle task ([e9e0d8c2f7](https://github.com/facebook/react-native/commit/e9e0d8c2f79e4077445c28e459ba0e5981da478b) by [@janicduplessis](https://github.com/janicduplessis))
- **Image:** Fix Image defaultSource runtime error ([1c51b77868](https://github.com/facebook/react-native/commit/1c51b7786860fe364a115f7a4ed29228157f0f5c) by [@mateoguzmana](https://github.com/mateoguzmana))
- **JS:** GetAndroidResourceFolderName() should return raw folder for svg file ([3a4798cc30](https://github.com/facebook/react-native/commit/3a4798cc30a53ba5ca428845d56fbeca43ef4524) by [@sunnylqm](https://github.com/sunnylqm))
- **Layout:** Elevation prop on android has incorrect border-radius ([f7d78f81cc](https://github.com/facebook/react-native/commit/f7d78f81cc971be2dcf5476c790556df4220b2bc) by [@jorge-cab](https://github.com/jorge-cab))
- **Layout:** Fix inset boxShadow when blur < spread ([a3b29e1441](https://github.com/facebook/react-native/commit/a3b29e1441f86fab624f21d977681f39f9acf549) by [@joevilches](https://github.com/joevilches))
- **Layout:** Fix issue where boxShadow crashes with small blur radius ([103f8b3885](https://github.com/facebook/react-native/commit/103f8b38856cad04e93d5b404024c28adbf52cee) by [@joevilches](https://github.com/joevilches))
- **Layout:** Fixed anti-aliasing not showing on older Android versions ([6c6e0a9085](https://github.com/facebook/react-native/commit/6c6e0a90855ac070742ce1923204115cbf2528f8) by [@jorge-cab](https://github.com/jorge-cab))
- **Layout:** Make `setLayoutAnimationEnabledExperimental` a no-op in Bridgeless ([44da5d2ee0](https://github.com/facebook/react-native/commit/44da5d2ee07d06a0e11b626e2641e255f0ffde9f) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **Libs:** Fix react-native/popup-menu-android not building for 3rd party developers ([e96396bd18](https://github.com/facebook/react-native/commit/e96396bd184471ff8d7a69b4775d851076231b47) by [@cortinico](https://github.com/cortinico))
- **Modal:** Fixed crash with Modal when trying to call syncSystemBarsVisibility() ([141fb23bba](https://github.com/facebook/react-native/commit/141fb23bba7120e515902f7bdebd87297d7aca92) by [@alanleedev](https://github.com/alanleedev))
- **Modal:** Sync Modal system bars visibility with current activity ([7016225062](https://github.com/facebook/react-native/commit/701622506248022c3a2fcea1c0066bba6e80232a) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Runtime:** Marked acquireWakeLockNow as static ([2a58201322](https://github.com/facebook/react-native/commit/2a582013228d7b729141c781ac98034f8a70578b) by [@mstrokin](https://github.com/mstrokin))
- **Runtime:** Make DefaultReactNativeHost.clear() also invalidate DefaultReactHost ([07769d4d7e](https://github.com/facebook/react-native/commit/07769d4d7eb1d3000210c7a8dafd9a5411694444) by [@WoLewicki](https://github.com/WoLewicki))
- **Runtime:** Pass the bundle URL protocol when setting up HMR client on Android ([ba894c908a](https://github.com/facebook/react-native/commit/ba894c908a02a84596525872b6232accc1acfaea) by [@byCedric](https://github.com/byCedric))
- **ScrollView:** Scroll view throttle no longer impacts events other than `onScroll` ([bc810e5115](https://github.com/facebook/react-native/commit/bc810e5115256e4fb5330b21c3a5d9ee3dd9a00c) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Text:** Allow text links to be navigable via keyboard by default ([98b0991128](https://github.com/facebook/react-native/commit/98b0991128c902bbe273f519ac79ac0676cef1c0) by [@joevilches](https://github.com/joevilches))
- **Text:** Fix text link accessibility on state update removal ([c9e6567881](https://github.com/facebook/react-native/commit/c9e6567881b2a596677b1b14d1c1d2537fec507d) by [@joevilches](https://github.com/joevilches))
- **TextInput:** Avoid `ConcurrentModificationException` when iterating over `mListeners` `TextWatcher` array ([243aecc095](https://github.com/facebook/react-native/commit/243aecc095c20f8295fdefa8fc3e3ac8a7691043) by [@kirillzyusko](https://github.com/kirillzyusko))
- **TextInput:** TextInputs can now receive focus via external keyboard ([3420eb87b0](https://github.com/facebook/react-native/commit/3420eb87b01f42092c1691a1f6544f20d244cc60) by [@joevilches](https://github.com/joevilches))

#### iOS specific

- **C++:** Update deprecated enums in RCTTextPrimitivesConversions.h ([4121d24454](https://github.com/facebook/react-native/commit/4121d24454433ab007b664076ee00a951494fb4d) by [@joannaquu](https://github.com/joannaquu))
- **CocoaPods:** `JSRuntimeFactoryCAPI.h` build error for  `use_frameworks` build ([7786805337](https://github.com/facebook/react-native/commit/7786805337526fa6e8ed758407b78884a37b89ef) by [@Kudo](https://github.com/Kudo))
- **CocoaPods:** Make sure 3p libraries depends on React-renderercss to work with use_frameworks ([cc12caa0a9](https://github.com/facebook/react-native/commit/cc12caa0a9dcb08d11fe18c9b34290352ca1909e) by [@cipolleschi](https://github.com/cipolleschi))
- **CocoaPods:** Compatibility with Ruby 3.4.0 ([b1735bc593](https://github.com/facebook/react-native/commit/b1735bc5936ebe352b4ab27604a3ae85980121f1) by [@okwasniewski](https://github.com/okwasniewski))
- **CocoaPods:** Fix wrong cocoapods script on new_architecture.rb ([541e655832](https://github.com/facebook/react-native/commit/541e655832acaed7836c23326cfc62fd0ba5521f) by [@CHOIMINSEOK](https://github.com/CHOIMINSEOK))
- **Codegen:** Enable use of multiple `RCTAppDependencyProvider` instances ([0cc1ac18cf](https://github.com/facebook/react-native/commit/0cc1ac18cf7f2a99500ef6f315c4dccda7736ea0) by [@vonovak](https://github.com/vonovak))
- **DeviceInfo:** Data race related to read/write of RCTDeviceInfo._invalidated. ([2a18d83521](https://github.com/facebook/react-native/commit/2a18d83521b30642a7e403fd55a5afd4ef2d8cb4) by [@hakonk](https://github.com/hakonk))
- **DevX:** Issue where performance monitor would be hidden under newly presented views. ([e7556e921c](https://github.com/facebook/react-native/commit/e7556e921c07692012a4295dd7d84fe23f5838a5) by [@chrsmys](https://github.com/chrsmys))
- **DevX:** Remove private symbols for non-simulator and non-catalyst builds. ([9350d6f2f5](https://github.com/facebook/react-native/commit/9350d6f2f5473cddc6ea4c13602c9f80c9c40916) by [@EvanBacon](https://github.com/EvanBacon))
- **Infra:** Workaround for a iOS build app running on Apple Silicon Mac(in Xcode Destination: "Mac(Designed for iPad)") TextInput crash due to serialization attempt of WeakEventEmitter ([0511e2e49a](https://github.com/facebook/react-native/commit/0511e2e49a51ab32aa6f40df7c6b3dde92b09031) by [@iwater](https://github.com/iwater))
- **Initialization** Make React Native work without AppDelegate window property ([ae7bbe06c9](https://github.com/facebook/react-native/commit/ae7bbe06c9a4e47e1aa6cfa5cca7f6aa5a8ff83b) by [@okwasniewski](https://github.com/okwasniewski))
- **JSC:** Return nullptr when USE_THIRD_PARTY_JSC is set to true ([515ff1e626](https://github.com/facebook/react-native/commit/515ff1e626110116f272428d1d182eedcff2deab) by [@okwasniewski](https://github.com/okwasniewski))
- **Layout:** Fix cases where background color, filter, and background image were sized incorrectly if there was a scaling transform ([acaf94dc21](https://github.com/facebook/react-native/commit/acaf94dc214867633a50b113d9925335a0d59099) by [@joevilches](https://github.com/joevilches))
- **Layout:** Fix cases where background color, filter, and background image were sized incorrectly if there was a scaling transform ([f835b824f4](https://github.com/facebook/react-native/commit/f835b824f43ae54ee6d4e4b72101638bbd5f365d) by [@joevilches](https://github.com/joevilches))
- **Layout:** Improve detached keyboard detection, support Stage Manager on iOS ([c499ae1192](https://github.com/facebook/react-native/commit/c499ae1192ec178e4d20f8ed4ae03ff3e077bf65) by [@mhoran](https://github.com/mhoran))
- **Layout:** Layout direction changes are now honored on bundle reload. ([36f29beac4](https://github.com/facebook/react-native/commit/36f29beac47259768612bf56e5d9acfa4b94ab1a) by [@chrsmys](https://github.com/chrsmys))
- **Layout:** Suppressed iOS 13 deprecation warnings in RCTStatusBarManager ([fffd6d75b4](https://github.com/facebook/react-native/commit/fffd6d75b48ae1f6c78dbc0f7e9b6fe509df3394) by Ingrid Wang)
- **Native Module:** Add guard for custom module provider lookup in TMManager ([d0a101fbea](https://github.com/facebook/react-native/commit/d0a101fbeaec0bdace3a680078e0acc8635b5c3e) by [@shwanton](https://github.com/shwanton))
- **PullToRefresh:** Fix new arch recycled RefreshControl was missing its title ([e3d607fc2e](https://github.com/facebook/react-native/commit/e3d607fc2ea18c7ad9474d72cf18b1328d6647f7) by [@High5Apps](https://github.com/High5Apps))
- **Runtime:** Convert to JSException only NSException from sync methods ([9805a4f](https://github.com/facebook/react-native/commit/9805a4f89a8b23b5aa7201ed1013e5da5932e084) by [@cipolleschi](https://github.com/cipolleschi))
- **Runtime:** Handle null params in the Interop TM layer ([6314925](https://github.com/facebook/react-native/commit/63149256c0e19ecbd008d1bf8f0ff1e79bb63cf2) by [@cipolleschi](https://github.com/cipolleschi))
- **Runtime:** Call RCTInitializeUIKitProxies before bridge create ([a51fa6c002](https://github.com/facebook/react-native/commit/a51fa6c0028a5bc9afb89656f1aeb41847b7fe8e) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Runtime:** Fixed: extraModulesForBridge callback not called when New Architecture enabled ([c0a5c2c3cb](https://github.com/facebook/react-native/commit/c0a5c2c3cb883dc68e98d2720b194df17d0b9ee7) by Bruno Aybar)
- **Runtime:** Enable back the opt-out from the New Architecture ([9abdd619da](https://github.com/facebook/react-native/commit/9abdd619da110dbe227c387179a449623395c7b2) by [@cipolleschi](https://github.com/cipolleschi))
- **Runtime:** Add missing loadFromSource method in the DefaultRNFactoryDelegate ([7739615e0d](https://github.com/facebook/react-native/commit/7739615e0d614a93f297b70ef0947dddf3d1ba6e) by [@cipolleschi](https://github.com/cipolleschi))
- **Runtime:** App crash caused by the `[RCTFileRequestHanlder invalidate]` method ([789ed7d5ad](https://github.com/facebook/react-native/commit/789ed7d5ad75ad4c20ecd1eb19d1fc18275fc500) by [@zhouzh1](https://github.com/zhouzh1))
- **Runtime:** Bridge: Fixes HostTarget use after free when deallocated bridge ([3e2e8ec757](https://github.com/facebook/react-native/commit/3e2e8ec7579fa72af09f016753c167952dffaf43) by [@zhongwuzw](https://github.com/zhongwuzw))
- **TextInput:** Fixes TextInput crashes when any text is entered while running as iOS app on apple silicon mac ([8d7aca30e7](https://github.com/facebook/react-native/commit/8d7aca30e7fb50c9c069931a7ed67d8d4a745a2a) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Text:** Fixed onPress for Text with nested View. ([6b2c40c64f](https://github.com/facebook/react-native/commit/6b2c40c64f8278785d7e37f908918e0344ba278f) by [@coado](https://github.com/coado))
- **TextInput:** Fix selection makes TextInput clear its content when using children ([e3b176a598](https://github.com/facebook/react-native/commit/e3b176a598bd47338b52522f05893f781e3a7744) by Olivier Bouillet)
- **TextInput:** Fixed TextInput's `onContentSizeChange` event being dispatched multiple times with the same size ([2bb65717b7](https://github.com/facebook/react-native/commit/2bb65717b7b86d19e4d35707003df7d5be31c2fb) by [@j-piasecki](https://github.com/j-piasecki))
- **TextInput:** Implement `dataDetectorTypes` in the same way as the old architecture ([2ae45ec3ce](https://github.com/facebook/react-native/commit/2ae45ec3ce50cb9d95782173f6dfca74e8110848) by [@VidocqH](https://github.com/VidocqH))

### Removed

- **C++:** Removed `RawProps::operator=` ([e4d1cf8ce9](https://github.com/facebook/react-native/commit/e4d1cf8ce994d39ed67a660888cbeef2fba83b36) by [@javache](https://github.com/javache))
- **JS**: Removed context from addEventListener arguments in Linking ([1536a7f196](https://github.com/facebook/react-native/commit/1536a7f1960f21e56d2e4730a5ca8524b49530df) by [@coado](https://github.com/coado))

#### iOS specific

- **JSC:** Clean up RCTBridgeDelegate to remove shouldBridgeUseCustomJSC method ([c8f1506f13](https://github.com/facebook/react-native/commit/c8f1506f13310ffafe370273805684e696d72d50) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Layout:** Remove no longer needed UISceneDelegate ([a033cf9d5e](https://github.com/facebook/react-native/commit/a033cf9d5e8ffbda8b6f86cf3ce152b4ccb73187) by [@okwasniewski](https://github.com/okwasniewski))

## v0.78.3

### Added

#### Android specific

- **Gradle:** RNGP - Add support for `exclusiveEnterpriseRepository` to specify an internal Maven mirror. ([6cb8dc37c7](https://github.com/facebook/react-native/commit/6cb8dc37c74995cba3f9f0a845919f305de53c3d) by [@cortinico](https://github.com/cortinico))

### Fixed

- **DevTools**: Temporarily disable eager evaluation and live expressions in the console tab ([07717b5275](https://github.com/facebook/react-native/commit/07717b5275d80cde7b2b4edbe032ab629127fbf0) by [@huntie](https://github.com/huntie))
- **InteropLayer:** Fixed adding child views to a native view using the interop layer ([d53a60dd23](https://github.com/facebook/react-native/commit/d53a60dd23c5df8afca058a867c50df8b61f62e2) by [@chrfalch](https://github.com/chrfalch))
- **Runtime:** Align timer IDs and timer function argument error handling with web standards. ([480a4642e5](https://github.com/facebook/react-native/commit/480a4642e5a644becf1c477d3d239f9b57efff3a) by [@kitten](https://github.com/kitten))

#### Android specific

- **StyleSheet:** Wrong `borderBottomEndRadius` on RTL ([68d6ada448](https://github.com/facebook/react-native/commit/68d6ada44893701b6006a6b1753131c7e880a30a) by [@riteshshukla04](https://github.com/riteshshukla04))

#### iOS specific

- **Codegen:** Skip codegen for selectively disabled libraries in react-native.config.js ([be8595b18a](https://github.com/facebook/react-native/commit/be8595b18a46635bf679d8e7473f2960c33530fa) by [@ismarbesic](https://github.com/ismarbesic))
- **Layout:** Layout direction changes are now honored on bundle reload ([36f29beac4](https://github.com/facebook/react-native/commit/36f29beac47259768612bf56e5d9acfa4b94ab1a) by [@chrsmys](https://github.com/chrsmys))
- **Runtime:** Re-enable enableFixForViewCommandRace feature flag ([ae59702f8e](https://github.com/facebook/react-native/commit/ae59702f8ee89e7bddec971e0a041744cb91e65c) by [@okwasniewski](https://github.com/okwasniewski))
- **Switch:** Fixed switches correctly reverting to controlled state ([aa8c072870](https://github.com/facebook/react-native/commit/aa8c072870f6f9740e567a0f455c0e500ff1400c) by [@javache](https://github.com/javache))

## v0.78.2

### Changed
- **Deps:** Metro minimum to 0.81.3, fix "_interopRequireDefault is not a function" ([23c9dbc563](https://github.com/facebook/react-native/commit/23c9dbc563637a6b8c22c1b9d86fa03b65bde520) by [@robhogan](https://github.com/robhogan))

### Fixed

#### Android specific

- **Runtime:** Fixes issue with z-indexed sibling removal ([34ae9facd5](https://github.com/facebook/react-native/commit/34ae9facd52b5da28b5ced22110532bbcdad2cec) by [@rozele](https://github.com/rozele))

#### iOS specific

- **RCTNetworking:** app crash caused by the `[RCTFileRequestHanlder invalidate]` method ([5861f7eea7](https://github.com/facebook/react-native/commit/5861f7eea79767f14a06719937cbdabed39be9c9) by [@zhouzh1](https://github.com/zhouzh1))
- **Runtime:** Implement the `loadSourceForBridge:onProgress:onComplete` in the `RCTDefaultReactNativeFactoryDelegate`. ([8b33668c43](https://github.com/facebook/react-native/commit/8b33668c4338d31c27e6bd90b2a0e6fc0a077588) by [@cipolleschi](https://github.com/cipolleschi))
- **Text:** Fix selection makes TextInput clear its content when using children ([301532b51fe33cd08152c7dde2b15d57105332dd](https://github.com/facebook/react-native/commit/301532b51fe33cd08152c7dde2b15d57105332dd) by [freeboub](https://github.com/freeboub))
- **TurboModules:** Make sure the TM infra does not crash on NSException when triggered by async method ([ae1841ac964](https://github.com/facebook/react-native/commit/ae1841ac9645c10d66aeef784579b94fa0169e03) by [@cipolleschi](https://github.com/cipolleschi))

## v0.78.1

### Fixed

- **Deps:** community-cli-plugin: resolve cli-server-api via peer dependency on cli ([9ffbeadf8a](https://github.com/facebook/react-native/commit/9ffbeadf8a1ecfef1c0ac08bc39157ac6e17796e) by [@robhogan](https://github.com/robhogan))
- **DevTools:** Fix disconnections of DevTools when the network is under significant strain ([9e47ed9a20](https://github.com/facebook/react-native/commit/9e47ed9a205184abf1d7eb422fb22ef27f18cae5) by [@vzaidman](https://github.com/vzaidman))

#### Android specific

- **Image:** Fix Android Image defaultSource runtime error ([665212e22c](https://github.com/facebook/react-native/commit/665212e22c310b1f0f9d1f1795d88622c711219a) by [@mateoguzmana](https://github.com/mateoguzmana))
- **style:** Fix elevation with border-radius set (#48982) ([68dc582305](https://github.com/facebook/react-native/commit/68dc582305e2568245380ddca2ceaee3b5ec752f) by [@polovi](https://github.com/polovi))

#### iOS specific

- **Initialization:** Call `extraModulesForBridge` callback in the New Architecture. ([97adbd897f](https://github.com/facebook/react-native/commit/97adbd897f88d108f0be21a5895dadc74189b6fc) by [@Bruno125](https://github.com/Bruno125))
- **Initialization:** Added custom load js block in bridge mode ([bdc83cb129](https://github.com/facebook/react-native/commit/bdc83cb129757d6adc373c11535d78055727e3fa) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Interop Layer:** Properly pass `nil` for nullable parameters instead of `NSNull` for legacy modules ([619d5dfbb2](https://github.com/facebook/react-native/commit/619d5dfbb280892fcc2a9f78d630eb88fb32960f) by [@cipolleschi](https://github.com/cipolleschi))
- **TextInput:** Fixes TextInput crashes when any text is entered while running as iOS app on apple silicon mac ([282cdc9fb4](https://github.com/facebook/react-native/commit/282cdc9fb4a1ceac17b63584f9988d3192235885) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.78.0

### Breaking

- **Codegen:** Separate component array types and command array types ([825492b199](https://github.com/facebook/react-native/commit/825492b1999b62de708e6f40d5d5de8d3d7cb8a9) by [@elicwhite](https://github.com/elicwhite))
- **DevTools:** The `FuseboxClient.setClientMetadata` CDP method is removed. Instead, use `ReactNativeApplication.enable`. ([1a9780f0e3](https://github.com/facebook/react-native/commit/1a9780f0e3714ac18ffae34cb67376c711b0e031) by [@huntie](https://github.com/huntie))

#### Android specific

- **APIs:** Changed visibility of `FrescoBasedReactTextInlineImageViewManager` to internal ([d5f33c19cb](https://github.com/facebook/react-native/commit/d5f33c19cb33e2f2c7d2470cc90872c1f065f20d) by [@alanleedev](https://github.com/alanleedev))
- **APIs:** Migrating pointerEvents API breaks compatibility for kotlin usages of this api as a val ([45e4a3afce](https://github.com/facebook/react-native/commit/45e4a3afceb4be3047cd01a60ec2c9f806ed30fe) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Convert `RootView` to Kotlin ([21c9491926](https://github.com/facebook/react-native/commit/21c94919260a68409f82081740169d0409e78933) by [@fabriziocucci](https://github.com/fabriziocucci))
- **APIs:** Delete unused abstract class `GuardedResultAsyncTask` ([67bff8734f](https://github.com/facebook/react-native/commit/67bff8734f4b92fe399910eecad5b67511a749c1) by [@mdvacca](https://github.com/mdvacca))
- **APIs**: Delete deprecated class `FabricViewStateManager` ([b25b65ba19](https://github.com/facebook/react-native/commit/b25b65ba19f3c674fd2efe5c01123ccc0ae55cbf) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Removed `ComponentNameResolver` from public API ([a4849cb3d6](https://github.com/facebook/react-native/commit/a4849cb3d6f4245d15eb3812e417a9f4248bb3a1) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- **Image:** Change Image load event size info from logical size to pixel ([09995fc874](https://github.com/facebook/react-native/commit/09995fc8741cfdc6095d09627262b4f6fbbaafc2) by [@zhongwuzw](https://github.com/zhongwuzw))

### Added

- **C++:** Added `RawValue(Runtime*, jsi::Value&)` constructor to make a `RawValue` from a `jsi::Value`. ([03d2186ace](https://github.com/facebook/react-native/commit/03d2186ace2cb17c676b7763d5a545759a658b77) by [@hannojg](https://github.com/hannojg))
- **Codegen:** Include cxx modules in codegen schema ([cf5ab03d43](https://github.com/facebook/react-native/commit/cf5ab03d4324b7e3fce38f9eacc96da82b11b68a) by [@elicwhite](https://github.com/elicwhite))
- **Deps:** Add `jest-diff v29.7.0` to devDependencies ([b27bd00a38](https://github.com/facebook/react-native/commit/b27bd00a389295250ec003357df713ebf306374b) by [@andrewdacenko](https://github.com/andrewdacenko))
- **Logging:** Add support for the second parameter of `console.table` to specify a list of columns to print in the table. ([fd0894b1c7](https://github.com/facebook/react-native/commit/fd0894b1c7fcb20dd213ec1e93aafef25935d709) by [@rubennorte](https://github.com/rubennorte))
- **Logging:** Add "jsEngine: hermes" to JS runtime Error prototype ([85bdd75828](https://github.com/facebook/react-native/commit/85bdd75828f85230aaa90ed510666457c46f996c) by Maddie Lord)
- **Metro:** Add opt in for legacy Metro log streaming via `--client-logs` flag ([86db4fa90b](https://github.com/facebook/react-native/commit/86db4fa90b90919867a9b66f6caa28f77fba3a37) by [@huntie](https://github.com/huntie))
- **Text:** Added `pointerEvents` to `TextProps` type. ([3efbe33ce0](https://github.com/facebook/react-native/commit/3efbe33ce03f846932406742528652eb695b957d) by [@hyochan](https://github.com/hyochan))

#### Android specific

- **ActivityIndicator:** setting `resource-id` from the `testID` prop ([87b1bad45e](https://github.com/facebook/react-native/commit/87b1bad45e4eb730ea07686a2b2558253c60d3b7) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Codegen:** Fixing schema types for component command params of Arrays ([25c673e357](https://github.com/facebook/react-native/commit/25c673e35784d8d8c49555af104b9b4d8d37973d) by [@elicwhite](https://github.com/elicwhite))
- **Gradle:** Make the addition of JitPack repository configurable ([a98528e609](https://github.com/facebook/react-native/commit/a98528e609ff0ace4b7bc82f3aa273b7e3fa6443) by [@cortinico](https://github.com/cortinico))
- **Logging:** SoftException categories ([c832f94cf7](https://github.com/facebook/react-native/commit/c832f94cf713d0cb7616ef095f38583979e1cf43) by Thomas Nardone)
- **Logging:** Add logging in ReactInstanceManager.onHostPause when activity is incorrectly null ([c2fd35a442](https://github.com/facebook/react-native/commit/c2fd35a4429c752dc2d10a789e4c5f48d22b1eeb) by Maddie Lord)
- **Runtime:** Added `getState` method for `StateWrapperImpl` ([ed36e896ac](https://github.com/facebook/react-native/commit/ed36e896ac34fcbefece87456dbdfdff30d22ad5) by [@hannojg](https://github.com/hannojg))

#### iOS specific

- **Codegen:** Add the `source` parameter to generate-codegen-artifacts to avoid generating files not needed by libraries. ([98b8f17811](https://github.com/facebook/react-native/commit/98b8f178110472e5fed97de80766c03b0b5e988c) by [@cipolleschi](https://github.com/cipolleschi))
- **Initialization:** Implement ReactNativeFactory ([081be01a5d](https://github.com/facebook/react-native/commit/081be01a5dd24d0a398c6aa8297575502a17d5ec) by [@okwasniewski](https://github.com/okwasniewski))
- **Text:** Support system font families (system-ui, ui-sans-serif, ui-serif, ui-monospace, and ui-rounded) on iOS ([1763321c89](https://github.com/facebook/react-native/commit/1763321c8960d30ddc4d3464a0fffdecdd44617a) by [@cxa](https://github.com/cxa))
- **TextInput:** Integrate a new property - `disableKeyboardShortcuts`. It can disable the keyboard shortcuts on iPads. ([0154372b93](https://github.com/facebook/react-native/commit/0154372b93eb1b02f0c62f2a75c95f4fc6a9f3e8) by [@rezkiy37](https://github.com/rezkiy37))

### Changed

- **Deps:** Bump Hermes ([0c8e15e8bb](https://github.com/facebook/react-native/commit/0c8e15e8bb16ec279290d2390caf75e83d52f518) by [@cipolleschi](https://github.com/cipolleschi))
- **Flow:** Improved types in `BoxInspector` and refactored a code ([f832c450a5](https://github.com/facebook/react-native/commit/f832c450a52c4c9d61c1d6b609fcad1332613556) by [@coado](https://github.com/coado))
- **Flow:** Improved types in StyleInspector and refactored a code ([49e5c58c59](https://github.com/facebook/react-native/commit/49e5c58c595265c9fffc84741aab6363d291f1f5) by [@coado](https://github.com/coado))
- **Flow:** Improved types in ElementBox and refactored a code ([2959d49e8d](https://github.com/facebook/react-native/commit/2959d49e8d09663f9ac437ffcb66d1c99162c6d0) by [@coado](https://github.com/coado))
- **Flow:** Improve types on BorderBox ([48a7840919](https://github.com/facebook/react-native/commit/48a784091989c695e3432cb8ba657139eb9f5e99) by [@coado](https://github.com/coado))
- **Flow:** Improve types on DrawerLayoutAndroid ([b5155fba89](https://github.com/facebook/react-native/commit/b5155fba895411e290faeeea06180fce24079f78) by [@huntie](https://github.com/huntie))
- **Logging:** Improved formatting of values logged via `console.table` (including Markdown format). ([7154c62afb](https://github.com/facebook/react-native/commit/7154c62afb5371f3f861663826792e41229c344a) by [@rubennorte](https://github.com/rubennorte))
- **Runtime:** Mark `intersectionRect` required in `NativeIntersectionObserverEntry` to reflect native logic. ([8681fc2ab2](https://github.com/facebook/react-native/commit/8681fc2ab20aa1e5937a0bf3fc58ed03c3e0ee23) by [@lunaleaps](https://github.com/lunaleaps))
- **Runtime:** ([9aa21b5e87](https://github.com/facebook/react-native/commit/9aa21b5e8765f14a9806eac435636b87f62178cc) by [@lunaleaps](https://github.com/lunaleaps))
- **TypeScript:** Upgrading `typescript-config` module version to `esnext` ([5370347f54](https://github.com/facebook/react-native/commit/5370347f54719f318a4e032aba6cbf2269e7c3d7) by [@mateoguzmana](https://github.com/mateoguzmana))
- **VirtualizedList:** Fix item disappearing with scroll in VirtualizedList ([df7b6ae092](https://github.com/facebook/react-native/commit/df7b6ae092d03385ebd05efd0f068c59e727f723) by [@Tom910](https://github.com/Tom910))
- **Yoga:** Update YGNodeStyleGetGap to return YGValue ([331d99a941](https://github.com/facebook/react-native/commit/331d99a94154678848628122e8fe3373ee67fb9b) by [@heoblitz](https://github.com/heoblitz))

#### Android specific

- **APIs:** Introduce new public API `ViewManagerInterface` ([40a0cdbc99](https://github.com/facebook/react-native/commit/40a0cdbc99746f18ca15c48f3d8f03cdad1635af) by [@mdvacca](https://github.com/mdvacca))
- **Deps:** Bumped Android Gradle Plugin (AGP) to 8.8.0 ([4c7c836ebf](https://github.com/facebook/react-native/commit/4c7c836ebf956c13fa327170adaec43a076226e7) by [@cortinico](https://github.com/cortinico))
- **Deps:** Bump Gradle to 8.12 ([5e6478954c](https://github.com/facebook/react-native/commit/5e6478954c77f64a9086757ed4a879e83a1ab404) by [@cortinico](https://github.com/cortinico))
- **Deps:** Update Fresco to 3.6.0 ([819b5c2c8d](https://github.com/facebook/react-native/commit/819b5c2c8dfad620152b159838575b6c03e18ffe) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Deps:** Migrate jsc-android to mavenCentral ([e42a3a6b84](https://github.com/facebook/react-native/commit/e42a3a6b842d71fc25419c02f6015863fa019f05) by [@Kudo](https://github.com/Kudo))
- **Image:** Replaced custom XML decoder with Fresco's built-in decoder ([6feb90bb29](https://github.com/facebook/react-native/commit/6feb90bb290ab460df8df2f6f01531a77aac9008) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Kotlin:** Migrate `ComponentNameResolver` to kotlin ([385b9f4265](https://github.com/facebook/react-native/commit/385b9f4265316a1e1cf8627ea7ed3bed790cc8c5) by [@mdvacca](https://github.com/mdvacca))
- **Kotlin:** Migrate `ReactSwitchManager` to Kotlin ([b886bc4db9](https://github.com/facebook/react-native/commit/b886bc4db970d8c70de1596dc3f88bdc398de482) by [@krozniata](https://github.com/krozniata))

#### iOS specific

- **Accessibility:** Reduce memory allocations when computing `accessibilityLabel` ([74bdab8bd8](https://github.com/facebook/react-native/commit/74bdab8bd8be2413734004145507c0688232053e) by [@sparga](https://github.com/sparga))
- **CocoaPods:** Properly inherit OTHER_CPLUSPLUSLAGS ([fa03840e68](https://github.com/facebook/react-native/commit/fa03840e688067bf16a7fb60c00efdc9a1813f92) by [@WoLewicki](https://github.com/WoLewicki))
- **CocoaPods:** Pin 'concurrent-ruby' to a working version ([198adb47af](https://github.com/facebook/react-native/commit/198adb47af3676c85b35adb308c110c1d87120c8) by [@cipolleschi](https://github.com/cipolleschi))

### Removed

#### Android specific

- **APIs:** Made `ReactCookieJarContainer` internal. ([18ebea533d](https://github.com/facebook/react-native/commit/18ebea533d348329926bd7782bb55469aa228a4a) by [@javache](https://github.com/javache))
- **Config:** Remove as_const option (on by default) in fbsource ([e5a526ff44](https://github.com/facebook/react-native/commit/e5a526ff44c25afd935d117d6d4d342f210553a6) by [@panagosg7](https://github.com/panagosg7))
- **Flow:** Remove comment syntax from ReactNativeTypes ([a80baac58e](https://github.com/facebook/react-native/commit/a80baac58e9f2fc62829ab76b929f5c8b21c05a5) by [@hoxyq](https://github.com/hoxyq))
- **Metro:** Removed `JSCHeapCapture` module, deprecated PackagerCommandListener#onCaptureHeapCommand ([e06fa5d102](https://github.com/facebook/react-native/commit/e06fa5d1026843ec4a2ba3dd209652dc5290c0ba) by [@javache](https://github.com/javache))


### Fixed

- **Animations:** Removed unnecessary state updates in React to reflect the current state of looping animations. ([6059660c60](https://github.com/facebook/react-native/commit/6059660c607f5b6edba08a12906f0f9d6cb15d34) by [@rubennorte](https://github.com/rubennorte))
- **Animations:** Animation.stop() executes when `animatedShouldUseSingleOp` is enabled. ([746d584a23](https://github.com/facebook/react-native/commit/746d584a23f303493faa4f9d857ec542257a92ae) by [@javache](https://github.com/javache))
- **Animations:** Fix buttons becoming unresponsive when transform is animated ([2204ec94d4](https://github.com/facebook/react-native/commit/2204ec94d4b67a9ba559db3f54a5a1ef91e0f233) by [@sammy-SC](https://github.com/sammy-SC))
- **C++:** `JSBigFileString` fails for non-zero offset arguments ([7d0338cb0b](https://github.com/facebook/react-native/commit/7d0338cb0b24926aff648a4c8ba5d77b052010cc) by [@jwajgelt](https://github.com/jwajgelt))
- **Config:** Disable `react-in-jsx-scope` rule in eslint config ([ea56c432b7](https://github.com/facebook/react-native/commit/ea56c432b7a577d3805d1a7b4b46596799dd892e) by [@matinzd](https://github.com/matinzd))
- **Deps:** Fix peer dependencies on React types to React 19 ([4368368ef5](https://github.com/facebook/react-native/commit/4368368ef5c3f3d08a66ee6c13222f6d81a2d2df) by [@cipolleschi](https://github.com/cipolleschi))
- **Deps:** Add missing `invariant` dependency ([ee8088b615](https://github.com/facebook/react-native/commit/ee8088b6157837c239db47ac5bd3a8603ceefc3c) by [@tido64](https://github.com/tido64))
- **Fantom:** Fix a bug when fantom tests could not be run in parallel, e.g. in a stress-test. ([8696b79f73](https://github.com/facebook/react-native/commit/8696b79f73fec18a9e3785b9a2c150afc9965d76) by [@mijay](https://github.com/mijay))
- **Logging:** Modified `console.table` to avoid mutating the received argument. ([caa77fbe2b](https://github.com/facebook/react-native/commit/caa77fbe2b03e6969ae9b542d011f926a0ede3c7) by [@rubennorte](https://github.com/rubennorte))
- **Text:** Fixed `adjustsFontSizeToFit` not working for text with a single character ([47822e9048](https://github.com/facebook/react-native/commit/47822e90480d61e197a3f223e088ee88a0f38ad7) by [@j-piasecki](https://github.com/j-piasecki))
- **Text:** Fix `maxFontSizeMultiplier` prop on `Text` and `TextInput` components in Fabric / New Architecture ([ea49d4d1b01107a5ecbbbd4904f1d935e51d6b32](https://github.com/facebook/react-native/commit/ea49d4d1b01107a5ecbbbd4904f1d935e51d6b32) by [@RickardZrinski](https://github.com/RickardZrinski))

#### Android specific

- **APIs** Re-introduce the deprecated constructor on ReactModuleInfo ([734730df75](https://github.com/facebook/react-native/commit/734730df75b3bdddeb5dbe65f4151cc92b988303) by [@cortinico](https://github.com/cortinico))
- **Dialog:** `FLAG_SECURE` not respected in Modal dialog ([7e029b0dcf](https://github.com/facebook/react-native/commit/7e029b0dcf6d1a6455a8a6343457b70e353d0ff6) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Events:** Fix crash for `setEventEmitterCallback` NoSuchMethodError on API lvl 26 ([7dcbc799eb](https://github.com/facebook/react-native/commit/7dcbc799eb2fb5792512b71320eafed08deec9ea) by [@cortinico](https://github.com/cortinico))
- **Gradle:** Fixed build issue when including mapbuffer jni headers in library code ([ecf17666ad](https://github.com/facebook/react-native/commit/ecf17666ad84e15d31944962e2d0e846a5670977) by [@hannojg](https://github.com/hannojg))
- **InteropLayer:** Fix execution of early InteropEvents ([4ed2b35bf6](https://github.com/facebook/react-native/commit/4ed2b35bf61426c81c9f8b30a142d77b44988fdb) by [@mdvacca](https://github.com/mdvacca))
- **JSC:** Fix JSC Debug instacrashing ([b10491a3c4](https://github.com/facebook/react-native/commit/b10491a3c457c802608758ca1fe659a72c18576b) by [@cortinico](https://github.com/cortinico))
- **JSC:**Fix JSC by avoiding use of unavailable `str.replaceAll()` ([b5b9e032c2](https://github.com/facebook/react-native/commit/b5b9e032c2b57aa44afb7141a879d83c8b889feb) by [@robhogan](https://github.com/robhogan))
- **Modal:** Setting `resource-id` from `testID` prop ([52b6592559](https://github.com/facebook/react-native/commit/52b65925595882d9b6c7f354a5ce3bfe3823738e) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Networking:** ReactOkHttpNetworkFetcher – cache control headers getting overwritten by the rest of the headers ([81cb166d10](https://github.com/facebook/react-native/commit/81cb166d103f7caaa5135b5a1c66d4e978f3619f) by [@mateoguzmana](https://github.com/mateoguzmana))
- **DevTools:** Pass the bundle URL protocol when setting up HMR client on Android ([32fe244744](https://github.com/facebook/react-native/commit/32fe24474495f09f985a2c92e11103dd386f5fe3) by [@byCedric](https://github.com/byCedric))
- **Runtime:** Fix BackHandle callback undefined cause crash issue ([44705fe11b](https://github.com/facebook/react-native/commit/44705fe11bd9bb12c8f71d1e50a7b48e0af6a38d) by [@BleemIs42](https://github.com/BleemIs42))
- **Runtime:** Support Long values in WritableMap and WritableArray ([e7f943de2f](https://github.com/facebook/react-native/commit/e7f943de2fd71d2259ab53e7817d2dcf96559f7e) by [@WoLewicki](https://github.com/WoLewicki))
- **Runtime:** `SetColorScheme` should be called on the UI thread ([2aa79979d3](https://github.com/facebook/react-native/commit/2aa79979d3e4a54008f24c81b6c04553c98ff6b6) by lihaitao)
- **Style:** Fix background getting clipped when border-radius is set ([6d235853fb](https://github.com/facebook/react-native/commit/6d235853fb9e9ad4050ba5611d74921fa1b9c72d) by [@jorge-cab](https://github.com/jorge-cab))
- **Testing:** Handling `testID` correctly for horizontal scroll view ([81c74cd35f](https://github.com/facebook/react-native/commit/81c74cd35f9e40c8ad4663fc932d0dddeaa4bc19) by [@mateoguzmana](https://github.com/mateoguzmana))
- **TextInput:** Fix incorrect height of single line TextInputs without definite size ([9b646c8b7b](https://github.com/facebook/react-native/commit/9b646c8b7b9a23645b1563883768a9274897a1cd) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- **C++:** Exclude Android HorizontalScrollContentView cxx component code ([4adaacb4f7](https://github.com/facebook/react-native/commit/4adaacb4f7cd136d5534c81fb9b8f5f2a0312d7f) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Ccache:** Fix ccache not found error exporting ccache binary path as Xcode user-defined setting to be used by ccache scripts ([d31ac832c5](https://github.com/facebook/react-native/commit/d31ac832c5b866653f7179fd517427f7be11ad45) by [@ste7en](https://github.com/ste7en))
- **CocoaPods:** Resolve "Your project does not explicitly specify the CocoaPods master specs repo" `pod install` warning ([2f2281718a](https://github.com/facebook/react-native/commit/2f2281718a2ef905ffd15adf3b47a1b6b6fb8d95) by [@noway](https://github.com/noway))
- **Image:** Load images even when the extension is implicit ([b9f418e9bc](https://github.com/facebook/react-native/commit/b9f418e9bc35372438a34934254db985b7ad1840) by [@cipolleschi](https://github.com/cipolleschi))
- **Initialization:** Allow multiple RN instances to run at the same time ([444c7d4eff](https://github.com/facebook/react-native/commit/444c7d4eff3d4fbe25452c94cba7ffacb3c366cc) by [@cipolleschi](https://github.com/cipolleschi))
- **InteropLayer:** Avoid crashing the app when the InteropLayer can't find some methods in the native implementation ([3bd3f101b9](https://github.com/facebook/react-native/commit/3bd3f101b9dcff8551a2f8259ddeed9843fd69b8) by [@cipolleschi](https://github.com/cipolleschi))
- **InteropLayer:** Properly handle `null` value in TurboModule Interop layer ([ebfd7057af](https://github.com/facebook/react-native/commit/ebfd7057af049ebfbc593448918c70db37e39d48) by [@cipolleschi](https://github.com/cipolleschi))
- **JSC:** Fix Direct Debugging with JSC ([b04d17afca](https://github.com/facebook/react-native/commit/b04d17afcac82af1a47fd462a04fe4088d19b468) by [@Saadnajmi](https://github.com/Saadnajmi))
- **Keyboard:** Enable/disable keyboard shortcuts only on iOS ([8b0af4542e](https://github.com/facebook/react-native/commit/8b0af4542e6fd5628fefdc8e1699326c2225c3f0) by [@okwasniewski](https://github.com/okwasniewski))
- **RefreshControl:** Fix app becoming unresponsive when `RefreshControl` is used inside of <Modal /> ([6cb2684b43](https://github.com/facebook/react-native/commit/6cb2684b4343bd8698b9770c0f6ef8812683c783) by [@sammy-SC](https://github.com/sammy-SC))
- **DevTools:** Restore "Paused in debugger" overlay icon ([f30c46efbd](https://github.com/facebook/react-native/commit/f30c46efbd964d367f678181589865a3faa931cd) by [@robhogan](https://github.com/robhogan))
- **Runtime:** Emit `didUpdateDimensions` correctly ([920867d949](https://github.com/facebook/react-native/commit/920867d9494cbfcc9cb0e23607cb339ec1b89ca9) by TobiasH)
- **Runtime:** Fix `applicationDidEnterBackground` not being called ([adaceba546](https://github.com/facebook/react-native/commit/adaceba5462b4ad8676745f34e0be2bf5bb25166) by [@alextoudic](https://github.com/alextoudic))
- **Runtime:** Fixed problem with accessory view & 3rd party libs ([5fc582783d](https://github.com/facebook/react-native/commit/5fc582783d7f70ca9521e317c93624a8845bfff2) by [@kirillzyusko](https://github.com/kirillzyusko))
- **Style:** Dashed & dotted borders now work with overflow: hidden ([1b88c5b429](https://github.com/facebook/react-native/commit/1b88c5b429888e109b7acae4808b4b6f8b3f920f) by [@joevilches](https://github.com/joevilches))
- **Style:** Fixed `centerContent` losing taps and causing jitter ([fe7e97a2fd](https://github.com/facebook/react-native/commit/fe7e97a2fd272db0d9d9aa7d0561337a7c8e2c30) by [@gaearon](https://github.com/gaearon))
- **Xcode:** Properly escape paths in Xcode build script used when bundling an app. ([2fee13094b](https://github.com/facebook/react-native/commit/2fee13094b3d384c071978776fd8b7cff0b6530f) by [@kraenhansen](https://github.com/kraenhansen))

# Changelog
## v0.77.3

### Added

#### Android specific

- **Gradle**: RNGP - Add support for `exclusiveEnterpriseRepository` to specify an internal Maven mirror. ([6cb8dc37c7](https://github.com/facebook/react-native/commit/6cb8dc37c74995cba3f9f0a845919f305de53c3d) by [@cortinico](https://github.com/cortinico))

### Changed

- **Metro**: Bump Metro minimum version from `^0.81.3` to `^0.81.5`. ([dfa81638dd](https://github.com/facebook/react-native/commit/dfa81638dd17e46f70f10b25c4f4fd9f370a4b0e) by [@robhogan](https://github.com/robhogan))

### Fixed

- **Timers**: Align timer IDs and timer function argument error handling with web standards. ([480a4642e5](https://github.com/facebook/react-native/commit/480a4642e5a644becf1c477d3d239f9b57efff3a) by [@kitten](https://github.com/kitten))

#### Android specific

- **Modal**: Fix Modal first frame being rendered on top-left corner. ([b950fa2afb](https://github.com/facebook/react-native/commit/b950fa2afb20e2213ff6c733cb1c2465b90406ef) by [@cortinico](https://github.com/cortinico))
- **layout**: Fix wrong `borderBottomEndRadius` on RTL. ([68d6ada448](https://github.com/facebook/react-native/commit/68d6ada44893701b6006a6b1753131c7e880a30a) by [@riteshshukla04](https://github.com/riteshshukla04))
- **Modal**: Fix `FLAG_SECURE` not respected in Modal dialog. ([7e029b0dcf](https://github.com/facebook/react-native/commit/7e029b0dcf6d1a6455a8a6343457b70e353d0ff6) by [@mateoguzmana](https://github.com/mateoguzmana))
- **lifecylcle**: Legacy arch: fix #50274, Fast Refresh sometimes breaks after full refresh. ([c43952ac22](https://github.com/facebook/react-native/commit/c43952ac22b2356be3130c906329f61e246082cb) by [@robhogan](https://github.com/robhogan))

#### iOS specific

- **Interop Layer**: Fixed adding child views to a native view using the interop layer. ([d53a60dd23](https://github.com/facebook/react-native/commit/d53a60dd23c5df8afca058a867c50df8b61f62e2) by [@chrfalch](https://github.com/chrfalch))
- **Debugger**: Restore "Paused in debugger" overlay icon. ([f30c46efbd](https://github.com/facebook/react-native/commit/f30c46efbd964d367f678181589865a3faa931cd) by [@robhogan](https://github.com/robhogan))
- **layout**: Layout direction changes are now honored on bundle reload. ([36f29beac4](https://github.com/facebook/react-native/commit/36f29beac47259768612bf56e5d9acfa4b94ab1a) by [@chrsmys](https://github.com/chrsmys))
- **file reads**: Fix crash caused by `[RCTFileRequestHanlder invalidate]`. ([789ed7d5ad](https://github.com/facebook/react-native/commit/789ed7d5ad75ad4c20ecd1eb19d1fc18275fc500) by [@zhouzh1](https://github.com/zhouzh1))

## v0.77.2

### Added

#### iOS specific

- **Codegen:** Add the `source` parameter to generate-codegen-artifacts to avoid generating files not needed by libraries. ([98b8f17811](https://github.com/facebook/react-native/commit/98b8f178110472e5fed97de80766c03b0b5e988c) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- **DevTools:** Fix disconnections of DevTools when the network is under significant strain. ([b0974135bf](https://github.com/facebook/react-native/commit/b0974135bf1c0946d4a85bdc1fd423ff7dc612c5) by [@vzaidman](https://github.com/vzaidman))
- **CLI:** Fix registering of `start` and `bundle` commands with community CLI and isolated node_modules. ([1f002f9999](https://github.com/facebook/react-native/commit/1f002f9999fb2a225f8e2cb3844badc97313b45f) by [@robhogan](https://github.com/robhogan))
- **Metro:** Bump minimum Metro to 0.81.3, fix "_interopRequireDefault is not a function" with enablePackageExports ([b335436113](https://github.com/facebook/react-native/commit/b335436113aa11cc4f17eb696368e05708374c33) by [@robhogan](https://github.com/robhogan))

#### Android specific

- **Fabric:** Avoid NPE when touch event is triggered before SurfaceManager is initiated ([b8095f4692](https://github.com/facebook/react-native/commit/b8095f4692610c7f4631b851dc7d8dc9b149a277) by [@CHOIMINSEOK](https://github.com/CHOIMINSEOK))
- **Image:** Fix defaultSource runtime error ([1c51b77868](https://github.com/facebook/react-native/commit/1c51b7786860fe364a115f7a4ed29228157f0f5c) by [@fbp93](https://github.com/fbp93))

#### iOS specific

- **Interop Layer:** Properly pass `nil` for nullable parameters instead of `NSNull` for legacy modules ([619d5dfbb2](https://github.com/facebook/react-native/commit/619d5dfbb280892fcc2a9f78d630eb88fb32960f) by [@cipolleschi](https://github.com/cipolleschi))
- **TextInput:** Fix crashes when any text is entered while running as iOS app on apple silicon mac ([8d7aca30e7](https://github.com/facebook/react-native/commit/8d7aca30e7fb50c9c069931a7ed67d8d4a745a2a) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.77.1

### Fixed

 - **Dev-Middleware:** Add missing `invariant` dependency ([877e82c1a9](https://github.com/facebook/react-native/commit/877e82c1a97d6c667024a437d993e84af3b820a6) by [@tido64](https://github.com/tido64))
 - **style:** Respect `maxFontSizeMultiplier` prop on `Text` and `TextInput` components in New Architecture ([8baa858412](https://github.com/facebook/react-native/commit/8baa85841209679936938e7759c5be149304843c) by [RickardZrinski](https://github.com/RickardZrinski))

#### Android specific

 - **layout:** Fix elevation prop on android has incorrect border-radius ([55d5c44976](https://github.com/facebook/react-native/commit/55d5c4497621a8dfd6545899754451fcf68dce70) by [@NickGerleman](https://github.com/NickGerleman))
 - **Fabric:** Fix execution of early InteropEvents ([d8af0ae3f2](https://github.com/facebook/react-native/commit/d8af0ae3f22c906a9584e1f5d1aaf2dba3cc3fea) by [mdvacca](https://github.com/mdvacca))

#### iOS specific

 - **Image:** Load images even when the extension is implicit ([bc35afefd5](https://github.com/facebook/react-native/commit/bc35afefd57a7d0516796dee209881120b82c0b1) by [@cipolleschi](https://github.com/cipolleschi))
 - **Interop Layer:** Avoid crashing the app when the InteropLayer can't find some methods in the native implementation. ([83b986d370](https://github.com/facebook/react-native/commit/83b986d370139266bbbad3e2c356b871c56ae17c) by [@cipolleschi](https://github.com/cipolleschi))
 - **Interop Layer:** Properly handle `null` values coming from NativeModules. ([475f797a51](https://github.com/facebook/react-native/commit/475f797a51237e63e4d2bb4e5718e6aa73157767) by [sammy-SC](https://github.com/sammy-SC))

### Added
 - **DevX:** Add opt in for legacy Metro log streaming via `--client-logs` flag ([969eb3f007](https://github.com/facebook/react-native/commit/969eb3f0070dc9df2e89ea52a6eb2c68b05aa2d7) by [huntie](https://github.com/huntie))

## v0.77.0

### Breaking

- **Animation:** Native looping animation will not send React state update every time it finishes. ([4b035d820d](https://github.com/facebook/react-native/commit/4b035d820d3f1c3c9a98ce4f55bcc95a7ab064bf) by [@dmytrorykun](https://github.com/dmytrorykun))
- **Dev-Middleware:** Frameworks should specify `serverBaseUrl` relative to the middleware host. ([acf384a72e](https://github.com/facebook/react-native/commit/acf384a72e599691e4c9d53043f1801da01c58fd) by [@robhogan](https://github.com/robhogan))
- **JS:** Remove ReactFabricInternals module ([0c21db360c](https://github.com/facebook/react-native/commit/0c21db360cecc6a3265eea50d628106c58b67af8) by [@huntie](https://github.com/huntie))
- **layout:** `position` of sticky headers on `ScrollView` will now be taken into account ([cbab004eb9](https://github.com/facebook/react-native/commit/cbab004eb94f8312e9b10dae1502d3ca8632a006) by [@joevilches](https://github.com/joevilches))
- **layout:** More spec compliant absolute positioning ([0a2dec175e](https://github.com/facebook/react-native/commit/0a2dec175e92185943907f3e1f6073bae6cd663d) by [@NickGerleman](https://github.com/NickGerleman))
- **Native Modules:** Bridgeless: Make NativeModules.foo load turbomodules (unset turboModuleProxy in bridgeless). ([cc5f17d5a2](https://github.com/facebook/react-native/commit/cc5f17d5a2b185de1e7dec2a56a97b088e4c7a81) by [@RSNara](https://github.com/RSNara))

#### Android specific

- **APIs:** Removed ReactViewGroup.getBackgroundColor() ([6a472c5cf2](https://github.com/facebook/react-native/commit/6a472c5cf25d72f72ec7e261282d611a5ab0a662) by Thomas Nardone)
- **APIs:** ReadableArray non-primitive getters are now correctly typed as optional ([145c72f816](https://github.com/facebook/react-native/commit/145c72f8163048f0eee30d5ce850911f5dad865c) by [@javache](https://github.com/javache))
- **APIs:** Remove jsBundleLoader from DefaultReactHost.getDefaultReactHost() ([fbe4c0ed34](https://github.com/facebook/react-native/commit/fbe4c0ed347156a7ea24da29e09083a499c80cf5) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Reduce visibility of TaskCompletionSource class ([4f55161132](https://github.com/facebook/react-native/commit/4f551611326d63b6fb5cd53e63d536c2c6f04647) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Stable API - Make ImageStoreManager internal ([846c4b1ea2](https://github.com/facebook/react-native/commit/846c4b1ea2d139e3f3cbafa2f8ddbf159e3322e4) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **APIs:** Stable API - Make SwipeRefreshLayoutManager internal ([d02da992a4](https://github.com/facebook/react-native/commit/d02da992a4c0893313b9f059a8be228f43fffa7a) by Thomas Nardone)
- **APIs:** Stable API - Make classes inside `com.facebook.react.views.progressbar` internal ([46526fc2fe](https://github.com/facebook/react-native/commit/46526fc2fe1dd0ce937fad35469b64b9fb05eaa2) by [@cortinico](https://github.com/cortinico))
- **APIs:** Stable API - Make OkHttpCallUtil internal ([abd118a719](https://github.com/facebook/react-native/commit/abd118a719fe0aeb13f980729ff9ce5fb8358b83) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **APIs:** Stable API - Make SimpleSettableFuture internal ([3dec672398](https://github.com/facebook/react-native/commit/3dec672398729cd668aff92249f1fdde231fb928) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **APIs:** Stable API - Make `ClipboardModule` internal ([10f6d5adb5](https://github.com/facebook/react-native/commit/10f6d5adb538a9b20043312fc09b192759100d63) by [@cortinico](https://github.com/cortinico))
- **APIs:** Reduce visibility of ReactVirtualTextShadowNode to internal ([496b0a8729](https://github.com/facebook/react-native/commit/496b0a8729b41266683fdd84de5618b23d06ce3d) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Reduce visibility of ReactVirtualTextViewManager to internal ([4a119c4c3a](https://github.com/facebook/react-native/commit/4a119c4c3ac9bf4b234e2942a27a6efd68a801cc) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Stable API - Make classes in `com.facebook.react.views.safeareaview` internal ([39dfbadd5d](https://github.com/facebook/react-native/commit/39dfbadd5d3468d079bf3b039401237c6e7f363c) by [@cortinico](https://github.com/cortinico))
- **APIs:** Stable API - Make ClipboardModule internal ([a72c35f98c](https://github.com/facebook/react-native/commit/a72c35f98ccd1a49d367678b46a29c814ad5de43) by [@cortinico](https://github.com/cortinico))
- **APIs:** Stable API - Make NativeModulePerfLogger internal ([d7d5de9f96](https://github.com/facebook/react-native/commit/d7d5de9f9630e7dcd0194830d7ccb32f167b619c) by [@cortinico](https://github.com/cortinico))
- **APIs:** Make ReactDebugOverlayTags, DebugOverlayTags, Printer, PrinterHolder, NoopPrinter internal ([623d481991](https://github.com/facebook/react-native/commit/623d4819915e7e6fafb8006c8e3b3b796e394974) by [@cortinico](https://github.com/cortinico))
- **APIs:** Make `DevLoadingModule` internal ([8c50bf0beb](https://github.com/facebook/react-native/commit/8c50bf0beb17ced7fdafeae7a734edfc03e6e0b2) by [@cortinico](https://github.com/cortinico))
- **APIs:** Stable API - Convert to Kotlin and make internal `NotThreadSafeViewHierarchyUpdateDebugListener` ([287e200332](https://github.com/facebook/react-native/commit/287e20033207df5e59d199a347b7ae2b4cd7a59e) by [@cortinico](https://github.com/cortinico))
- **APIs:** Rename DevSupportManagerBase.getCurrentContext() -> getCurrentReactContext() ([0e7ba9094e](https://github.com/facebook/react-native/commit/0e7ba9094ea573d1512b2dc71e46f55b24201b7a) by [@RSNara](https://github.com/RSNara))
- **APIs:** Make DevSupportManagerBase.getCurrentReactContext() public ([5a6a42c7d0](https://github.com/facebook/react-native/commit/5a6a42c7d029d44799cb907c0ca3c8aa38fa1770) by [@RSNara](https://github.com/RSNara))
- **APIs:** Reduce visibility of ReactUnimplementedViewManager to internal ([fe656be26e](https://github.com/facebook/react-native/commit/fe656be26e0d71bf2505032578dbea54af36b2c5) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Stable API - Make InteropModuleRegistry internal ([cba1d4bae7](https://github.com/facebook/react-native/commit/cba1d4bae7285ba160b05f31ca18cfa0b91e9ef5) by [@cortinico](https://github.com/cortinico))
- **APIs:** Stable API - Make ReactDevToolsSettingsManagerModule and ReactDevToolsRuntimeSettingsModule internal ([d7550293a2](https://github.com/facebook/react-native/commit/d7550293a2530f02f75b4249b7e6003edaf28ac9) by [@cortinico](https://github.com/cortinico))
- **APIs:** Added JSBundleLoader as parameter of DefaultReactHost ([143b9d172c](https://github.com/facebook/react-native/commit/143b9d172ca755e2457e8dfc6009eeef2475a4a1) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Deleting deprecated CompositeReactPackage ([2cb5198f1b](https://github.com/facebook/react-native/commit/2cb5198f1b589a57a4cfd3cc40a9ed6224fc5d75) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Make ReactHost.createSurface() method non nullable ([70c7616535](https://github.com/facebook/react-native/commit/70c761653564653bdfcb77a8c5ef3608dafcf5d7) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Stable API - Make AppStateModule internal ([dbf09fbe58](https://github.com/facebook/react-native/commit/dbf09fbe5823d77556b451317c14f833735067d9) by [@cortinico](https://github.com/cortinico))
- **APIs:** Make `AccessibilityInfoModule` internal ([7168a9d1a2](https://github.com/facebook/react-native/commit/7168a9d1a2ed7459ebb056ebe45d86de791013e3) by [@cortinico](https://github.com/cortinico))
- **APIs:** Add 3 methods to ReactInstanceDevHelper ([c867aba2f3](https://github.com/facebook/react-native/commit/c867aba2f3dd7773be9d2ee0827bcd69481a394e) by [@cortinico](https://github.com/cortinico))
- **APIs:** Remove Deprecated DefaultDevSupportManagerFactory.create() ([f25abe51ce](https://github.com/facebook/react-native/commit/f25abe51ce93b97ef1fe97af5fc76f13a5a6ff03) by [@cortinico](https://github.com/cortinico))
- **APIs:** Remove BaseViewManagerInterface ([7fb3d830be](https://github.com/facebook/react-native/commit/7fb3d830beae3daf431ac90e9326b744ff8300a1) by [@NickGerleman](https://github.com/NickGerleman))
- **APIs:** Remove ReactNativeFlipper object, deprecated in 0.75 ([d1a256f51a](https://github.com/facebook/react-native/commit/d1a256f51a43f465823bdfb8a70fae5f92473d7c) by [@cortinico](https://github.com/cortinico))
- **APIs:** Use BackgroundStyleApplicator when setting background color in BaseViewManager ([309cdea337](https://github.com/facebook/react-native/commit/309cdea337101cfe2212cfb6abebf1e783e43282) by [@NickGerleman](https://github.com/NickGerleman))
- **APIs:** Delete useTurboModules, enableFabricRenderer and enableBridgelessArchitecture fields from ReactFeatureFlags class ([10a33e0479](https://github.com/facebook/react-native/commit/10a33e04793befbeab6ae82d4068b1ebd7fdffd0) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Remove ReactViewBackgroundManager and ReactViewBackgroundDrawable ([51673e41ae](https://github.com/facebook/react-native/commit/51673e41ae12f06b2b378e048094ad39ca30c317) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- **APIs:** Use the RCTDependencyProvider in the RCTAppDelegate, breaking the dependency with Codegen ([b91626af26](https://github.com/facebook/react-native/commit/b91626af2626bf611958b1e7d0dd0b7338ccc29e) by [@cipolleschi](https://github.com/cipolleschi))
- **APIs:** Delete experimental API RCTConstants.RCTGetMemoryPressureUnloadLevel ([d79dc48abd](https://github.com/facebook/react-native/commit/d79dc48abd2e65e4d203e488f99eb554c473a1fc) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Move `UseNativeViewConfigsInBridgelessMode` to a proper feature flag ([6fc500ee99](https://github.com/facebook/react-native/commit/6fc500ee9942e51519545c1ba1026bacad03dc61) by [@philIip](https://github.com/philIip))
- **APIs:** Delete partialBatchDidFlush ([a777a8937e](https://github.com/facebook/react-native/commit/a777a8937ee165993d7d9b35c7c981fe6698f9dc) by [@philIip](https://github.com/philIip))
- **APIs:** Remove the deprecated RCTRuntimeExecutor. ([cf8d09b279](https://github.com/facebook/react-native/commit/cf8d09b279c4bd667d96f9445c1c0b9acb0a0dfc) by [@philIip](https://github.com/philIip))
- **colors:** Replace uses of `CGColorRef` with UIColor to avoid manual memory management ([b70709dbc2](https://github.com/facebook/react-native/commit/b70709dbc27c75c69e9fd2b082ffa27e7e8db7fd) by [@Saadnajmi](https://github.com/Saadnajmi))
- **infra:** Cocoapods decide the C++ version for iOS pods ([bd50c4a460](https://github.com/facebook/react-native/commit/bd50c4a460a01dad3cd7cade8191273563675d24) by [@cipolleschi](https://github.com/cipolleschi))
- **Interop Layer:** Remove opt-out mechanism for Native Modules interop layer  ([538bff710f](https://github.com/facebook/react-native/commit/538bff710f7afb4afa7ce91f20074668ad5c739d) by [@philIip](https://github.com/philIip))

### Added

- **Codegen:** Support negative values in enums ([177bf4d043](https://github.com/facebook/react-native/commit/177bf4d043ce862911e477e0f0039214d8541cfd) by [@okwasniewski](https://github.com/okwasniewski))
- **Codegen:** Add NumberLiteralTypeAnnotation support ([dd472101b7](https://github.com/facebook/react-native/commit/dd472101b76a964b7a64f0bb84d967f702500cad) by [@elicwhite](https://github.com/elicwhite))
- **Codegen:** Add cli --help details to combine-js-toschema-cli.js ([e4814b0d6d](https://github.com/facebook/react-native/commit/e4814b0d6d981cf96eef2803e8f20548263ea0e4) by [@blakef](https://github.com/blakef))
- **Codegen:** Codegen for Native Modules now supports string literals ([d2f3f06826](https://github.com/facebook/react-native/commit/d2f3f06826e2287ad5f5dc4e27201fc5dc9fcd5c) by [@elicwhite](https://github.com/elicwhite))
- **Codegen:** Codegen now supports Union Types in NativeModules ([3af126b562](https://github.com/facebook/react-native/commit/3af126b562cf7e0828906a4fe0ac79a886b557e6) by [@elicwhite](https://github.com/elicwhite))
- **DevMenu:** Export `DevMenu` from `react-native` ([e12c0d9551](https://github.com/facebook/react-native/commit/e12c0d95516924b5e6ca4f0d5ebcadb42bb19f30) by [@frankcalise](https://github.com/frankcalise))
- **FlatList:** Updated FlatList setNativeProps type ([b0ac99b477](https://github.com/facebook/react-native/commit/b0ac99b47781e3b68bee2ff737b109f58eeeba78) by [@JDMathew](https://github.com/JDMathew))
- **Flow:** Upgrade Flow to 0.245.2 ([1f65bf9545](https://github.com/facebook/react-native/commit/1f65bf9545cd84bbf1be7a7a91cb0b4f8b4b47ba) by [@SamChou19815](https://github.com/SamChou19815))
- **Image:** Image `resizeMode` and `objectFit` support for `'none'`. ([d8cfd98070](https://github.com/facebook/react-native/commit/d8cfd98070cbccc5e8a49446d76bdc2cb0c6939f) by [@mateoguzmana](https://github.com/mateoguzmana))
- **JS:** Eliminate usage of more than 1-arg `React.AbstractComponent` in React codebase ([6205aad81e](https://github.com/facebook/react-native/commit/6205aad81ef8154a106fa253a1f4b00aee568650) by [@SamChou19815](https://github.com/SamChou19815))
- **layout:** Added support for `display: contents` ([e7a3f479fe](https://github.com/facebook/react-native/commit/e7a3f479fe37a5d503770bafc03c80b1c2dcb8f7) by [@j-piasecki](https://github.com/j-piasecki))
- **Modal:** Added overlayColor prop to modal component for customisable background overlay ([4e1d7015c1](https://github.com/facebook/react-native/commit/4e1d7015c1d4e2703133b1347ed97a0cc93b1318) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **Perfetto:** Add FuseboxPerfettoDataSource to emit Fusebox traces using Perfetto ([ef0ea4d834](https://github.com/facebook/react-native/commit/ef0ea4d834ec61c5deede487b46a787a363f6a64) by Benoit Girard)
- **ReactNativeDevTools:** Add support for reload-to-profile in Fusebox (Part 2 of 2: JS) ([4df224ca6d](https://github.com/facebook/react-native/commit/4df224ca6df9dc593ab7090520578f27c520f361) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- **ReactNativeDevTools:** Add support for reload-to-profile in Fusebox. (Part 1 of 2: native) ([91a40a28de](https://github.com/facebook/react-native/commit/91a40a28de3f74a389c6e6ad05fb917d58fc072d) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- **runtime:** Add support for `rn_rootThreshold` in Intersection Observer ([a77d8d9d50](https://github.com/facebook/react-native/commit/a77d8d9d50e69a6a4563737c2ce68d26204eda7f) by [@lunaleaps](https://github.com/lunaleaps))
- **runtime:** Added `HostInstance` type to represent the instance of a `HostComponent<T>`. ([e24f9917c2](https://github.com/facebook/react-native/commit/e24f9917c25ed8c32c6e01d50a5fa49fe66a6ee1) by [@yungsters](https://github.com/yungsters))
- **style:** Removed `experimental` prefix and fully released `mixBlendMode` prop ([d2c48f3b1a](https://github.com/facebook/react-native/commit/d2c48f3b1a2a15e9832ea3240c19aea5186ceb24) by [@jorge-cab](https://github.com/jorge-cab))
- **Text:** Add JS layer for new text content type cellular EID and cellular IMEI ([118c1f7035](https://github.com/facebook/react-native/commit/118c1f7035cfcadb567b1ccd40d85c751dd65162) by [@cipolleschi](https://github.com/cipolleschi))
- **Text:** Expose missing text content type to JS ([d3d48cb357](https://github.com/facebook/react-native/commit/d3d48cb357e55b1f2ae0042a5960451fbe5ff5c7) by [@cipolleschi](https://github.com/cipolleschi))
- **TypeScript** Use the TypeScript key in syntax to restrict permissions and types of results ([0244710c4b](https://github.com/facebook/react-native/commit/0244710c4b1e5016069ec9f7b8e7116ff51f59f1) by [@qnnp-me](https://github.com/qnnp-me))

#### Android specific

- **Accessibility:** Added `isHighTextContrastEnabled()` to `AccessibilityInfo` to read `ACCESSIBILITY_HIGH_TEXT_CONTRAST_ENABLED` setting value ([d4ea147b41](https://github.com/facebook/react-native/commit/d4ea147b41e4d22253f80be8b74731dcf0439302) by Ariel Lin)
- **APIs:** Marked ReactPackage#getModule as stable. ([8fba7ebb5e](https://github.com/facebook/react-native/commit/8fba7ebb5e874d001dc5c16eb4229054a2ef4812) by [@javache](https://github.com/javache))
- **C++:** Add cmake arguments to support 16KB page size for native libraries ([65cdd5b82c](https://github.com/facebook/react-native/commit/65cdd5b82ce7652630b1920fa3a48c8f256c7983) by [@alanleedev](https://github.com/alanleedev))
- **Error Hadling:** Add exceptionHandler as a parameter of DefaultReactHost.getDefaultReactHost() method ([7a5a10c95c](https://github.com/facebook/react-native/commit/7a5a10c95ce6af1964ce5bd273c0c6513fb78a1e) by [@mdvacca](https://github.com/mdvacca))
- **graphics** Added PixelUtil extensions for Int and Long ([9406a09f87](https://github.com/facebook/react-native/commit/9406a09f871d3efa66e3d10237a6d1fd08ddee0b) by Thomas Nardone)
- **Image:** Image `force-cache` caching control option ([a0be88fd72](https://github.com/facebook/react-native/commit/a0be88fd727898d4626ca51876d0bfb4e50dcb77) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Image:** Enabling basic `Image` cache control for Android ([e5dd7d68bf](https://github.com/facebook/react-native/commit/e5dd7d68bf264669fc5c4ce5e69b24249d28558b) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Image:** Adds a new `resizeMethod`, `none`, which disables downsampling for an image ([6202319ed5](https://github.com/facebook/react-native/commit/6202319ed544e4d23f1f327ff5334c480af3819d) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Image:** Adds support for importing XML assets as images ([2e80f5acf1](https://github.com/facebook/react-native/commit/2e80f5acf11cd9726921a00a58700cab9e0bb0a7) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Modal:** Add navigationBarTranslucent prop to Modal component ([7a6c7a462a](https://github.com/facebook/react-native/commit/7a6c7a462a7898e13327438a6603d83a39147abb) by [@zoontek](https://github.com/zoontek))
- **resources:** Add a new Fresco decoder for XML resource types ([118b7c18a6](https://github.com/facebook/react-native/commit/118b7c18a6f827dabb00522bbd6a2416e1bf99da) by [@Abbondanzo](https://github.com/Abbondanzo))
- **runtime:** ReactDelegate and ReactActivityDelegate#getCurrentReactContext can be used to access the current context ([fe8cc62824](https://github.com/facebook/react-native/commit/fe8cc62824372229d90445b2769fed9c08604a7e) by [@javache](https://github.com/javache))
- **runtime:** Trigger Java GC on app reload ([de3c1ee097](https://github.com/facebook/react-native/commit/de3c1ee097f7041d6f9754a55a45cea80fd25813) by [@mrousavy](https://github.com/mrousavy))
- **runtime:** React Activity exposes ReactHost ([d78cb78b15](https://github.com/facebook/react-native/commit/d78cb78b15a520f3bebcdf00b82b26bf120f4180) by [@shwanton](https://github.com/shwanton))
- **runtime:** ReactDelegate `unloadApp` methods for unmounting surfaces without destroying ReactHost ([38593c440e](https://github.com/facebook/react-native/commit/38593c440e949a9b52df0a6821b80ac47b19a693) by [@rozele](https://github.com/rozele))
- **ScrollView:** Add OnLayoutChange API for scroll views ([d825a4d712](https://github.com/facebook/react-native/commit/d825a4d712a1ba53c0f4209c9da5d51578209a6d) by Thomas Nardone)
- **style:** Add overlapping radii resolution logic preventing incorrect rendering ([451ff70da4](https://github.com/facebook/react-native/commit/451ff70da422beefccfff5b87024145003bb49ff) by [@jorge-cab](https://github.com/jorge-cab))
- **style:** Logic to check for grayscale mode on android ([e70202e606](https://github.com/facebook/react-native/commit/e70202e606be3101da33d28f5403443c3e84749e) by [@oddlyspaced](https://github.com/oddlyspaced))
- **style:** Add boxShadow support to BaseViewManager ([b69a92e2c9](https://github.com/facebook/react-native/commit/b69a92e2c95990fcfa95a6ab7b7260ac492f942c) by [@NickGerleman](https://github.com/NickGerleman))
- **style:** Outline properties `outline-width`, `outline-color`, `outline-style` & `outline-offset` ([17faac4170](https://github.com/facebook/react-native/commit/17faac417035f2cc5f12ec60a46270991be0989a) by [@jorge-cab](https://github.com/jorge-cab))
- **Text:** TextTransform ktx ([7794d7af43](https://github.com/facebook/react-native/commit/7794d7af43b90b581574361af102f67ad7961a5e) by Thomas Nardone)

#### iOS specific

- **Accessibility** Added `isDarkerSystemColorsEnabled()` to `AccessibilityInfo` to read "Increase Contrast" setting value ([af3bee6511](https://github.com/facebook/react-native/commit/af3bee6511fe72fda7415bf974f937012b3eefec) by Ariel Lin)
- **ActionSheetIOS:** Added `disabledButtonTintColor` prop to ActionSheetIOS ([089c87e22e](https://github.com/facebook/react-native/commit/089c87e22e9f431d0e7f35292dce2e36fa86d09a) by [@henninghall](https://github.com/henninghall))
- **Cocoapods:** Extract RCTAppDependencyProvider in the ReactAppDependencyProvider pod ([102062fbc7](https://github.com/facebook/react-native/commit/102062fbc7d6a5c81192562c3ccb87bc4222a0cf) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Add RCTDependencyProvider protocol ([f2b3716426](https://github.com/facebook/react-native/commit/f2b371642684682916522dc82adee93464ba31fe) by [@cipolleschi](https://github.com/cipolleschi))
- **graphics:** Add `systemCyan` and `systemMint` colors on iOS ([4caf548a9f](https://github.com/facebook/react-native/commit/4caf548a9f2e485aef9cbaeeb0a666cf9b9d3e59) by [@EvanBacon](https://github.com/EvanBacon))
- **Hermes:** TvOS support for Hermes artifacts ([f673759c83](https://github.com/facebook/react-native/commit/f673759c83fed130964ea7dfe677c04608b8e64d) by [@douglowder](https://github.com/douglowder))
- **Image:** Image `only-if-cached` cache control option ([dc9db01665](https://github.com/facebook/react-native/commit/dc9db01665308ac931967326abfc86deb9ae7e2a) by [@mateoguzmana](https://github.com/mateoguzmana))
- **infra:** Declare supportedInterfaceOrientations only on iOS ([40c5e6b64a](https://github.com/facebook/react-native/commit/40c5e6b64a1d82b5b481717b9086340eca2aaef9) by [@okwasniewski](https://github.com/okwasniewski))
- **infra:** User-configurable BUNDLE_NAME when building bundles ([f8287e25e1](https://github.com/facebook/react-native/commit/f8287e25e11d56beb66ace414ca5f8a6a32405a9) by [@fivecar](https://github.com/fivecar))
- **infra:** User-configurable BUNDLE_NAME when building bundles ([f8287e25e1](https://github.com/facebook/react-native/commit/f8287e25e11d56beb66ace414ca5f8a6a32405a9) by [@fivecar](https://github.com/fivecar))
- **Layout:** Fix: Correct Layout Behavior for Combined align-content and align-items ([73a2be1243](https://github.com/facebook/react-native/commit/73a2be12437c93bbd138e0d63cd45d834529a3c4) by [@phuccvx12](https://github.com/phuccvx12))
- **runtime:** Pass the `RCTAppDependencyProvider` to the `RCTAppDelegate` ([95fc906930](https://github.com/facebook/react-native/commit/95fc906930ece9b30482eb1f0924d7e8614af7c6) by [@cipolleschi](https://github.com/cipolleschi))
- **runtime:** Introduce the RCTAppDependencyProvider to minimize the changes required y the users ([41c2502b36](https://github.com/facebook/react-native/commit/41c2502b3650e238b0a5d86b5044abcb538b76e3) by [@cipolleschi](https://github.com/cipolleschi))
- **runtime:** Introduce RCTArchConfiguratorProtocol ([ec0dbb729d](https://github.com/facebook/react-native/commit/ec0dbb729d3774184dee83efbff5f9beebce72ce) by [@okwasniewski](https://github.com/okwasniewski))
- **runtime:** Introduce RCTUIConfiguratorProtocol ([8850736188](https://github.com/facebook/react-native/commit/8850736188321f13c7bdeadedeed15c759ad72c1) by [@okwasniewski](https://github.com/okwasniewski))
- **runtime:** Add `CallInvoker` to `BindingsInstaller` ([87bae7f734](https://github.com/facebook/react-native/commit/87bae7f7349976cfc269b25584330c4d3d897d79) by [@mrousavy](https://github.com/mrousavy))
- **ScrollView:** Scroll the cursor into view when text input is focused ([e021e50d53](https://github.com/facebook/react-native/commit/e021e50d537884a55a9f5bea931adb19e9069dd6) by [@dominictb](https://github.com/dominictb))
- **style:** Outline properties `outline-width`, `outline-color`, `outline-style` & `outline-offset` ([1288e38423](https://github.com/facebook/react-native/commit/1288e38423f93ed57737dd9b40ad55696494d6f4) by [@jorge-cab](https://github.com/jorge-cab))
- **Swift:** Expose RCT_NEW_ARCH_ENABLED to Swift ([d24507611d](https://github.com/facebook/react-native/commit/d24507611de7fefc71286fd54b2c909d98a4bf27) by [@okwasniewski](https://github.com/okwasniewski))
- **Text:** New text content type cellular EID and cellular IMEI ([14e0d0dffb](https://github.com/facebook/react-native/commit/14e0d0dffb9ee8b1d41d60ccbcfd63d53bfe4d48) by [@pasc0al](https://github.com/pasc0al))
- **TextInput:** TextInput `inputAccessoryViewButtonLabel` prop ([32931466ed](https://github.com/facebook/react-native/commit/32931466ed7e3d8d9eeeb65f12ce146e123870ba) by [@mateoguzmana](https://github.com/mateoguzmana))
- **TextInput:** Line break mode for TextInput components. **This includes JS APIs for the new mode.** ([ce2d34f194](https://github.com/facebook/react-native/commit/ce2d34f19451c91a90f0bd820064208912c86092) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))

### Changed

- **Animated:** The `AnimatedNode` graph will not occur during the insertion effect phase, which means animations can now be reliably started during layout effects. ([316170ce8d](https://github.com/facebook/react-native/commit/
- **Animated:** Optimized the performance of updating `Animated` components. ([f0ffcd4f5d](https://github.com/facebook/react-native/commit/f0ffcd4f5dfeab794fbfa3257bb9a8fd793ff2bc) by [@yungsters](https://github.com/yungsters))
- **Animated:** Animations started with incompatible `useNativeDriver` and `AnimatedValue` configurations will now synchronously fail. Previously, spring and timing animations with non-zero delays would throw the error asynchronously. ([fd8cf19625](https://github.com/facebook/react-native/commit/fd8cf1962585aa49e8921475d89c1a5c2423c51c) by [@yungsters](https://github.com/yungsters))
- **Animated:** The `Animation` superclass no longer exposes `__onEnd` as a property. Subclasses must instead invoke `super.start(…)` in their `start()` implementation. ([b3fe06b268](https://github.com/facebook/react-native/commit/b3fe06b2685e526fe2bc420a902a3ccd4e1381df) by [@yungsters](https://github.com/yungsters))
- **Animated:** Bring back shouldSkipStateUpdatesForLoopingAnimations feature flag ([6e0e712c2a](https://github.com/facebook/react-native/commit/6e0e712c2a680cf4b4de1ee5fb25cc5282b242c5) by [@dmytrorykun](https://github.com/dmytrorykun))
- **Animated:** AnimatedNode (and its subclasses) once again implement `toJSON()`. ([7bd4a54968](https://github.com/facebook/react-native/commit/7bd4a5496815943b031b68ca46792560d8d798d8) by [@yungsters](https://github.com/yungsters))
- **Animated:** Improved the performance of unmounting (and updating, when an enclosing Activity becomes hidden) Animated components ([46abda55b9](https://github.com/facebook/react-native/commit/46abda55b9749dc171e0fec551ba83c027818eb7) by Royi Hagigi)
- **Animated:** AnimatedNode (and its subclasses) no longer implement `toJSON()`. ([fe6228512e](https://github.com/facebook/react-native/commit/fe6228512e076820c9c11869cfe24b19d1abfb58) by [@yungsters](https://github.com/yungsters))
- **Animated:** Animated now resolves `style` to the original prop value if it contains no `AnimatedNode` instances. Previously, it would resolve to a flattened style object. ([ca234ba10e](https://github.com/facebook/react-native/commit/ca234ba10e8d06630da7ea00aac515b222137645) by [@yungsters](https://github.com/yungsters))
- **AttributedString:** AttributedString `appendFragment` and `prependFragment` take an rval instead of a const ref; append/prependAttributedString have been removed ([2c31fe99e1](https://github.com/facebook/react-native/commit/2c31fe99e1cc5bfdb393d4f5c70231a042ea67ef) by [@javache](https://github.com/javache))
- **AttributedString:** Improved AttributedText generation for raw text nodes. ([2f7957f2fd](https://github.com/facebook/react-native/commit/2f7957f2fd424fdaa980d99a4ff05eb3237d662e) by [@javache](https://github.com/javache))
- **Flow:** Simplified Flow types to use `HostInstance` (which changing nominal types). ([177697f539](https://github.com/facebook/react-native/commit/177697f539ec68a47cbb8f57260cebe701589ef1) by [@yungsters](https://github.com/yungsters))
- **JS:** `useMergeRefs` and components using it (e.g. `Pressable`) now support ref cleanup functions. ([01e210fd28](https://github.com/facebook/react-native/commit/01e210fd28bc961e8c1b5fa454b3c947adda296c) by [@yungsters](https://github.com/yungsters))
- **JS:** Fix: use public instance in Fiber renderer and expose it from getInspectorDataForViewAtPoint (#31068) ([633ad4933e](https://github.com/facebook/react-native/commit/633ad4933e9514d4168d6dcdb7e56c9a1859482a) by [@hoxyq](https://github.com/hoxyq))
- **deps:** Bump serve-static to 1.16.2 to fix CVE-2024-43800 ([50e38cc9f1](https://github.com/facebook/react-native/commit/50e38cc9f1e6713228a91ad50f426c4f65e65e1a) by [@cortinico](https://github.com/cortinico))
- **deps:** Bump Folly to 2024.10.14.00 ([37375d8aba](https://github.com/facebook/react-native/commit/37375d8aba0869531567426466478b0de9a1aea3) by [@alanleedev](https://github.com/alanleedev))
- **deps:** Update Metro to 0.81.0 ([0902b0af75](https://github.com/facebook/react-native/commit/0902b0af75ba30ec9d4abeda71769d0685637afa) by [@robhogan](https://github.com/robhogan))
- **deps:** Upgrade React DevTools to 6.0.0. ([ed4f6d6891](https://github.com/facebook/react-native/commit/ed4f6d68910677ab050e3fef5aaa87e42d582fe0) by [@hoxyq](https://github.com/hoxyq))
- **infra:** Do not print Bridgeless Mode is enabled on console anymore ([f3a969f38d](https://github.com/facebook/react-native/commit/f3a969f38d7a2c74bf63ee05c4c819c0873059a9) by [@cortinico](https://github.com/cortinico))
- **VirtualizedList:** Fix unnececary rerenders of VirtualizedListCells with strictMode={true} ([aafe696453](https://github.com/facebook/react-native/commit/aafe696453186d0e87ae96d0bca4c6650234d222) by [@Tom910](https://github.com/Tom910))
316170ce8d0aac1df3261c792b9f768665d134c5) by [@yungsters](https://github.com/yungsters))

#### Android specific

- **deps:** Updating targetSdk to 35 (apps can still choose their own targetSdk regardless of RN version) ([48ea6867a9](https://github.com/facebook/react-native/commit/48ea6867a96bd16dc7aed9af5a8e9ce12a487c22) by [@alanleedev](https://github.com/alanleedev))
9fa4845136969ec95ce5615b7ea78feaf0f7f109) by [@javache](https://github.com/javache))
- **deps:** AGP to 8.7.2 ([e1a1cead43](https://github.com/facebook/react-native/commit/e1a1cead434a6856b2b018274876b9ba8eab706a) by [@cortinico](https://github.com/cortinico))
- **deps:** Android NDK to 27.1 ([ba061a5d18](https://github.com/facebook/react-native/commit/ba061a5d18176fd455c3aa6350127506dac05211) by [@alanleedev](https://github.com/alanleedev))
- **deps:** Bump fbjni to 0.7.0 ([1c002c7b4e](https://github.com/facebook/react-native/commit/1c002c7b4ea4f22729920e54a9032402247ea350) by [@alanleedev](https://github.com/alanleedev))
- **deps:** Fresco to 3.4.0 ([091025e18b](https://github.com/facebook/react-native/commit/091025e18b1dc5212031e3ed06bfb6c450e788e2) by [@cortinico](https://github.com/cortinico))
- **deps:** Bump Kotlin 1.9.x to 2.0.x ([972c2c864c](https://github.com/facebook/react-native/commit/972c2c864c0b563163a36080a13908d1c0a3fb87) by [@cortinico](https://github.com/cortinico))
- **deps:** Bump Android Gradle Plugin (AGP) to 8.7.0 ([cbc0978bb6](https://github.com/facebook/react-native/commit/cbc0978bb65dcfd2a18a54201c845785a626b1b3) by [@cortinico](https://github.com/cortinico))
- **deps:** Gradle to 8.10.1 ([90f89a830a](https://github.com/facebook/react-native/commit/90f89a830acced9e6b8e80ef58aefd7e2c9666a8) by [@cortinico](https://github.com/cortinico))
- **deps:** Gradle to 8.11.1 ([490db92562](https://github.com/facebook/react-native/commit/490db92562df3baf6dc38737778179065f378715) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Migrated systeminfo module code from Java to Kotlin ([8dc2c90ce5](https://github.com/facebook/react-native/commit/8dc2c90ce5f4b30f4729560aed2412e6d29f39fa) by [@oddlyspaced](https://github.com/oddlyspaced))
- **Kotlin:** Migrate ReactFeatureFlags to Kotlin ([4076dbfc86](https://github.com/facebook/react-native/commit/4076dbfc8651fcd193b886bf63b23728fad466d7) by [@mdvacca](https://github.com/mdvacca))
- **Kotlin:** Migrate MainReactPackage to Kotlin (and make it final) ([7bbac8ee27](https://github.com/facebook/react-native/commit/7bbac8ee27daf092b580b57c2c7ee46d2723cd09) by [@cortinico](https://github.com/cortinico))
- **Native Modules:** TurboModules marked as requiring eager init will now be constructed on the mqt_native thread to increase concurrency in React Native init. ([663b5f9d19](https://github.com/facebook/react-native/commit/663b5f9d19a905520bd0aef62cda890f76ef9b6e) by [@javache](https://github.com/javache))
- **ReactViewGroup:** Consolidated ReactViewGroup add/remove overrides ([0b22b955f1](https://github.com/facebook/react-native/commit/0b22b955f1494f0e7441a01dd19b3fdf5e20c3dc) by Thomas Nardone)
- **runtime:** Invocations to JS will now invoke their callbacks immediately if the instance is ready. Surface starts will not wait for the main thread to become available to dispatch the work in JS. ([9fa4845136](https://github.com/facebook/react-native/commit/
- **runtime:** Update documentation for ReactHost.destroy() APIs ([443bc32dc4](https://github.com/facebook/react-native/commit/443bc32dc49a86534fce1d6ec0e31c97b8f33053) by [@mdvacca](https://github.com/mdvacca))
- **style:** Disabling `outline` props on Android to stay consistent with iOS ([7ab0002799](https://github.com/facebook/react-native/commit/7ab0002799d52a876a8cdd32f25ebef6d431650e) by [@jorge-cab](https://github.com/jorge-cab))
- **tracing:** Improve FpsDebugFrameCallback.getTotalTimeMS() accuracy ([d54c25fdae](https://github.com/facebook/react-native/commit/d54c25fdaee4d2642cdbca812b61c6973d3f203d) by [@aamagda](https://github.com/aamagda))

#### iOS specific

- **Codegen:** Change how components automatically register ([8becc2514d](https://github.com/facebook/react-native/commit/8becc2514d484c99b51ea76f479f06a8fcdd8265) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Stop generating the RCTThirdPartyLibraryComponentProvider ([60b9d3d89e](https://github.com/facebook/react-native/commit/60b9d3d89eba90a945070646c6220b3c03b3aeba) by [@cipolleschi](https://github.com/cipolleschi))
- **runtime:** `RCTSurfaceHostingProxyRootView` no longer has different behavior (whether it calls `start` on the provided *surface*) depending on which initializer is used.  Call `start` yourself on the *surface* instead. ([13b93cfdda](https://github.com/facebook/react-native/commit/13b93cfddaa559697968ac1c19e55f7aaa053070) by Nolan O'Brien)
- **runtime:** Use `newArchEnabled` flag in RCTAppDelegate and RCTRootViewFactory ([7e1674fc59](https://github.com/facebook/react-native/commit/7e1674fc59abeeb70d946ee082a829fae4c671b7) by [@okwasniewski](https://github.com/okwasniewski))
- **runtime:** Do not move to the main queue synchronously when starting a new surface ([ab2c47be28](https://github.com/facebook/react-native/commit/ab2c47be285fde99a77d189fd04220ef8ad0933a) by [@cipolleschi](https://github.com/cipolleschi))
- **APIs**: Rename `RCTUIGraphicsImageRenderer` to `RCTMakeUIGraphicsImageRenderer` ([6a09fc09af](https://github.com/facebook/react-native/commit/6a09fc09af8eedbf409ab870d5714e44892b2a16) by [@Saadnajmi](https://github.com/Saadnajmi))

### Deprecated

#### Android specific

- **Codegen:** Deprecated shadows for ReadableNative[Map|Array].[Readable|Writable] ([d424bb9d7c](https://github.com/facebook/react-native/commit/d424bb9d7cf101dc5609e8f787ba8af2a33d0262) by [@javache](https://github.com/javache))
- **Fabric:** ReactContext.getFabricUIManager() method ([fb737ca7d3](https://github.com/facebook/react-native/commit/fb737ca7d34b636a3aa337a0935bf9a5a10c641d) by [@mdvacca](https://github.com/mdvacca))
- **runtime:** Deprecate CatalystInstance in old architecture ([3e27ef1f6e](https://github.com/facebook/react-native/commit/3e27ef1f6e024bba8725a3bd64e2648ffd6af496) by [@mdvacca](https://github.com/mdvacca))
- **runtime:** Deprecate BridgelessCatalystInstance class ([72bd840dd3](https://github.com/facebook/react-native/commit/72bd840dd3dc7b6e3e88a74ac9ddb000a0cb3a60) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- **runtime:** Deprecating RCTBridgeModule batchDidComplete and adding configuration to disable it ([731bd95c43](https://github.com/facebook/react-native/commit/731bd95c430c752126aaaa34e4911ba2b87b382f) by [@philIip](https://github.com/philIip))

### Removed

- **DevX:** Remove "run on iOS" and "run on Android" from the dev server key commands ([19b971ff94](https://github.com/facebook/react-native/commit/19b971ff94a0fe353f82363e788c13f86815663b) by [@huntie](https://github.com/huntie))
- **JS:** Removed type for useConcurrentRoot from AppRegistry, as it was already ignored ([2ec547ad28](https://github.com/facebook/react-native/commit/2ec547ad28ca914c17e276abb91174dfa0dc87b2) by [@javache](https://github.com/javache))
- **TypeScript:** Removed `refs` property from `NativeMethods` TypeScript definition. ([223e98cc4b](https://github.com/facebook/react-native/commit/223e98cc4b656b94b48c88940114bfdc025f8ddf) by [@yungsters](https://github.com/yungsters))

#### Android specific

- **APIs:** Remove `BackHandler.removeEventListener` ([44d619414c](https://github.com/facebook/react-native/commit/44d619414c1de3dbf17a421afa8dbcec7cdab025) by [@retyui](https://github.com/retyui))
- **APIs:** DevToolsReactPerfLogger stats gathering now uses an internal API ([f503fe3f10](https://github.com/facebook/react-native/commit/f503fe3f100d96a31fc56451d7846d80ce5c342f) by [@javache](https://github.com/javache))
- **APIs:** BindingImpl is no longer part of the public interface ([18faf68b48](https://github.com/facebook/react-native/commit/18faf68b4825118253cf247572084c4da8f6366e) by [@javache](https://github.com/javache))
- **APIs:** FabricComponents is removed from public API ([300db67b27](https://github.com/facebook/react-native/commit/300db67b270a5d6fc85d27188d0d1089675f89c0) by [@javache](https://github.com/javache))

### Fixed

- **Animated:** Correctly pass down isLooping in parallel animation ([4014aa4528](https://github.com/facebook/react-native/commit/4014aa4528d43e905246850c83007a635938d7cb) by [@zeyap](https://github.com/zeyap))
- **Animated:** Improved types for AnimatedProps ([390925ea39](https://github.com/facebook/react-native/commit/390925ea39eb469768f21cf7069b8f75ccdec09d) by [@javache](https://github.com/javache))
- **Animated:** Order of operations related to platformConfig propagation in NativeAnimated ([a64183b0c6](https://github.com/facebook/react-native/commit/a64183b0c6a56e9d482c7b8b0f80965493ed87af) by [@rozele](https://github.com/rozele))
- **Animated:** Replace Object.hasOwn usages to fix Animated on JSC ([e996b3f346](https://github.com/facebook/react-native/commit/e996b3f346462a394012a722ce19990cdf9c3d9a) by [@robhogan](https://github.com/robhogan))
- **Animated:** Fix buttons becoming unresponsive when transform is animated (Revert #48669) ([c799aa07e2](https://github.com/facebook/react-native/commit/c799aa07e2148a2ca38939cb72468c949ed0c95f) by [@sammy-SC](https://github.com/sammy-SC))
- **Appearance:** Fixed jest error from Appearance.js ([ce838a4bcf](https://github.com/facebook/react-native/commit/ce838a4bcfb1c08728b637a9addd24cc6e3477e0) by [@Kudo](https://github.com/Kudo))
- **Appearance:** Fix `Appearance.setColorScheme(null)` not resetting color scheme value ([7d63235086](https://github.com/facebook/react-native/commit/7d63235086352d8c424d634c7039551f0a5025dc) by [@sangonz193](https://github.com/sangonz193))
- **C++:** Fix C++ bridging template compatibility with MSVC ([e6848ba5ba](https://github.com/facebook/react-native/commit/e6848ba5ba997d102cbaf6181c7c8c73e25a0827) by [@acoates-ms](https://github.com/acoates-ms))
- **C++** Fix cast and control paths errors on windows ([0794fa909b](https://github.com/facebook/react-native/commit/0794fa909b2e06fad5c40dce402c5f14a24bb946) by [@TatianaKapos](https://github.com/TatianaKapos))
- **C++** Fix type conversion error in react native windows build. ([13db1cb88b](https://github.com/facebook/react-native/commit/13db1cb88bdd454cf19be358d6f0cd62f5a6d0cc) by [@marlenecota](https://github.com/marlenecota))
- **Codegen:** Support nested objects in arrays ([13780126d3](https://github.com/facebook/react-native/commit/13780126d3cb17ad00c2954f9830a3623812dc3e) by [@tvanlaerhoven](https://github.com/tvanlaerhoven))
- **Codegen:** Make Codegen work with local modules ([7b6e8e7765](https://github.com/facebook/react-native/commit/7b6e8e776574e683821133f0c814969d74c4de61) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Upgrade Codegen dependency `jscodeshift@17.0.0` to resolve outdated dependencies ([39c98fb8f8](https://github.com/facebook/react-native/commit/39c98fb8f8af98aa40dc89a1580d6c1901fa86cf) by [@byCedric](https://github.com/byCedric))
- **Codegen:** Fix source mapping for codegenNativeCommands ([8fba154b66](https://github.com/facebook/react-native/commit/8fba154b6655b5d87609d7c9f136997141ea5e99) by [@vzaidman](https://github.com/vzaidman))
- **Codegen:** Skip hidden folders when looking for third party components. ([8ab524312a](https://github.com/facebook/react-native/commit/8ab524312ab3bf1192b94ae6e30d296a85baa944) by [@cipolleschi](https://github.com/cipolleschi))
- **Dev-Middleware:** Rewrite URLs in the inspector proxy to cover all configurations, not just Android emulators. ([74995bc90a](https://github.com/facebook/react-native/commit/74995bc90aa039b880e4875ad356d3bce324d902) by [@robhogan](https://github.com/robhogan))
- **Dev-Middleware:** Fix URL rewriting where device and debugger reach the server on different ports/protocols. ([5da7ebf99a](https://github.com/facebook/react-native/commit/5da7ebf99ae317c104d8e4bfbf36d3d89f66b5c9) by [@robhogan](https://github.com/robhogan))
- **Dev-Middleware:** Regex-escape IP addresses in urlRegex replacements ([aae3e03e57](https://github.com/facebook/react-native/commit/aae3e03e57096c3dc51589a3de240d49a8b9fadf) by [@robhogan](https://github.com/robhogan))
- **Dev-middleware:** Remove URL.canParse, restore compat with Node < 18.17 ([99767d43b0](https://github.com/facebook/react-native/commit/99767d43b04e41c83e3bcbfebe267d6fdc284549) by [@robhogan](https://github.com/robhogan))
- **Error Handling:** Improved error message when no view config is found. ([bca232ad90](https://github.com/facebook/react-native/commit/bca232ad90692da7a87be5e37ee2680380f94bef) by [@javache](https://github.com/javache))
- **FlatList:** Fixed accuracy of FlatList estimations to determine what elements are visible in the rendering window. ([40aaeb7181](https://github.com/facebook/react-native/commit/40aaeb71814a1987482d97fd3170af0add55bc6a) by [@rubennorte](https://github.com/rubennorte))
- **FormData:** Remove non compliant `filename*` attribute in a FormData `content-disposition` header ([f791fb9e66](https://github.com/facebook/react-native/commit/f791fb9e660fe15bccf55029045c48f4bbcbc5cb) by [@foyarash](https://github.com/foyarash))
- **graphics:** Linear gradient start and end point algorithm. ([221d1eceda](https://github.com/facebook/react-native/commit/221d1eceda0e5ab870e96dcdd26e22ab17a3870c) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **Hermes:** Hermes: revert Intl removal ([4cffff35e0](https://github.com/facebook/react-native/commit/4cffff35e030f256c32bf69c5971dfee4e60723f) by [@robhogan](https://github.com/robhogan))
- **Image:** Passed height and width as native props to support cases where source is an array. ([45b177f50d](https://github.com/facebook/react-native/commit/45b177f50de624eefcb66bb2d8bc1ffb00855863) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **infra:** When using Babel with plain JavaScript files, support for additional user syntax plugins should be fixed (now uses Babel's parser instead of hermes-parser). There is no change for JS files annotated with `flow`, where extended JS syntax remains - unsupported. ([3de9892353](https://github.com/facebook/react-native/commit/3de989235365504468d2b6c0bb194e944bf1ce8e) by [@huntie](https://github.com/huntie))
- **infra:** Fix npm react-native start when cli-server-api isn't installed ([e0be2efe4e](https://github.com/facebook/react-native/commit/e0be2efe4e80edf99f96a2ae6a25856f6df5e0ca) by [@blakef](https://github.com/blakef))
- **infra:** Fix "punycode is deprecated" warning by replacing `node-fetch` with native `fetch` ([881d8a720f](https://github.com/facebook/react-native/commit/881d8a720fb24241d7b2127273ca6116833bf176) by [@jbroma](https://github.com/jbroma))
- **JS:** Do not discard props in the patch when they are not null while using `useNativeProps` ([4c3112c8d8](https://github.com/facebook/react-native/commit/4c3112c8d8685d6c34be9acf07b18871b3cee5b2) by [@cipolleschi](https://github.com/cipolleschi))
- **KeyboardAvoidingView:** Accessing KeyboardAvoidingEvent event in onLayout handler ([68db74205a](https://github.com/facebook/react-native/commit/68db74205afdd190304eb73ef71710781fa580b9) by [@mhoran](https://github.com/mhoran))
- **KeyboardAvoidingview:**  Fix KeyboardAvoidingView not aware of the keyboard closing it is unmounted ([08bd8ac47d](https://github.com/facebook/react-native/commit/08bd8ac47da60121225e7b281bbf566e2c5a291e) by [@QichenZhu](https://github.com/QichenZhu))
- **layout:** Plumbing to get boxSizing prop to Yoga round 2 ([3ca796edc3](https://github.com/facebook/react-native/commit/3ca796edc327c5287533dcc8f4394033d5398c2d) by [@joevilches](https://github.com/joevilches))
- **layout:** Fix TextMeasureCacheKey Throwing Out Some LayoutConstraints ([e7db7a7266](https://github.com/facebook/react-native/commit/e7db7a72661bd49948c13eb46d0f72fbe9e00bf3) by [@NickGerleman
](https://github.com/NickGerleman))
- **Modal:** Rename overlayColor prop in Modal to backdropColor ([7aeff18970](https://github.com/facebook/react-native/commit/7aeff18970a2b47cbb3fffc1408e4bb21eec6fed) by [@alanleedev](https://github.com/alanleedev))
- **Native Modules:** TurboModule::get is now a final method, override `create` to customize property lookup ([5b5e150eaf](https://github.com/facebook/react-native/commit/5b5e150eaff015540720225b9e61acb306e1d107) by [@javache](https://github.com/javache))
- **PointerEvents:** Fixed issues with W3C PointerEvents testsx ([1dcaf823f5](https://github.com/facebook/react-native/commit/1dcaf823f5e7d9b114dd803ce3181aa0b8f827ad) by [@rozele](https://github.com/rozele))
- **PointerEvents:** Fixed issue with W3C PointerEvents tests ([68a6b69b27](https://github.com/facebook/react-native/commit/68a6b69b27275998b4083797942f3e26a92d3adb) by [@rozele](https://github.com/rozele))
- **ReactNativeDevTools:** Don't assume 10.0.2.2 is an alias for localhost unless it's used to establish a connection to the server ([69400be4fc](https://github.com/facebook/react-native/commit/69400be4fc0abd38072f6586f3e7d5b6c33e54be) by [@robhogan](https://
- **ReactNativeDevTools:** Fix fetching sources and source maps when the dev-server is remote and not tunnelled via the same port+protocol. ([d1b0e9a30b](https://github.com/facebook/react-native/commit/d1b0e9a30b3afc56b9355453cf7f6e690bdd8aff) by [@robhogan](https://github.com/robhogan))
- **runtime:** Fixes typo in ReactHostImpl ([e3f03269c5](https://github.com/facebook/react-native/commit/e3f03269c5cea28977e44ddf5c5125968336b0e6) by [@rozele](https://github.com/rozele))
- **runtime:** Microtasks are now correctly executed after the code evaluation in Console panel of DevTools. ([3dfe22bd27](https://github.com/facebook/react-native/commit/3dfe22bd27429a43b4648c597b71f7965f31ca65) by [@hoxyq](https://github.com/hoxyq))
- **runtime:** Fix setImmediate/clearTimeout mismatch in NativeAnimatedHelper that could clear an unrelated setTimeout. ([a5dd1be889](https://github.com/facebook/react-native/commit/a5dd1be889be21f8daefbc609702989ec7c156cf) by Benoit Girard)
- **style:** Fix the nodes' owners not being updated when `display: contents` is used ([aa53bde21b](https://github.com/facebook/react-native/commit/aa53bde21b8952533cf17ffee234b273766f2133) by [@j-piasecki](https://github.com/j-piasecki))
- **style:** Fix for nodes with `display: contents` not being cleaned in some cases ([a88ddcecc9](https://github.com/facebook/react-native/commit/a88ddcecc93a9fa2d231907439d02b11bac8a944) by [@j-piasecki](https://github.com/j-piasecki))
- **Text:** Fix text not taking full width ([550b0c0ed1](https://github.com/facebook/react-native/commit/550b0c0ed16a64ce58102f15d4657abe92aac71c) by [@s77rt](https://github.com/s77rt))
github.com/robhogan))
- **Text:** AnsiHighlight style in RTL layout ([9a3958a619](https://github.com/facebook/react-native/commit/9a3958a619fddb75ed3c6eddebd94f11c0d00e9f) by [@hexboy](https://github.com/hexboy))
- **Text:** TextTransform: capitalize better reflects the web behaviour ([dc2000c875](https://github.com/facebook/react-native/commit/dc2000c8750f42b2f01bdad75455750814d567c6) by [@javache](https://github.com/javache))
- **tracing:** `PerformanceEntryReporter::reportMark` and `PerformanceEntryReporter::reportMeasaure` now return created performance entries. ([32f7b3b4e0](https://github.com/facebook/react-native/commit/32f7b3b4e0b8be1d1138f43c46b3c86d9a64c29a) by [@robik](https://github.com/robik))
- **TypeScript** The definition of ts of resizeMethod attribute is none. ([758892a7d8](https://github.com/facebook/react-native/commit/758892a7d89cc1e316984f8f522738021410f530) by [@nianxiongdi](https://github.com/nianxiongdi))
- **VirtualizedList:** Fix onEndReached not being called when getItemLayout is present and we scroll past render window ([3485e9ed87](https://github.com/facebook/react-native/commit/3485e9ed871886b3e7408f90d623da5c018da493) by YunPeng Chong)
- **VirtualizedList** Fix onEndReached not being called when getItemLayout is present and we scroll past render window ([62b7396bf4](https://github.com/facebook/react-native/commit/62b7396bf45c04bd47e74fe4c1e5b5e59918244d) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- **C++:** Fixes C++ TurboModules: Prioritise OnLoad.cpp, falling back to default-app-setup ([5a64bde701](https://github.com/facebook/react-native/commit/5a64bde701e28615a79ad52d0631de62ce6cab92) by [@timbocole](https://github.com/timbocole))
- **Codegen:** Fix IOException in `BuildCodegenCLITask` ([9147b0753a](https://github.com/facebook/react-native/commit/9147b0753a6c3afb2480b079f91614cd7189a28a) by [@vonovak](https://github.com/vonovak))
- **Dialog:** Fixed styling on alert dialog titles to wrap two lines and retain bold appearance ([c54b23ff9e](https://github.com/facebook/react-native/commit/c54b23ff9ed7a6bfbb52c081c5afe4b3911d0dd2) by [@Abbondanzo](https://github.com/Abbondanzo))
- **graphics:** Missing isInvertColorsEnabled implementation for Android ([cc1d2853fb](https://github.com/facebook/react-native/commit/cc1d2853fb2b64adfb884cb30c8d22ce0260be15) by [@oddlyspaced](https://github.com/oddlyspaced))
- **Headless Tasks:** Fix crash on HeadlessJsTaskService on old architecture ([4560fc0497](https://github.com/facebook/react-native/commit/4560fc049748a345d5945bc08d43f4b61ca51ff3) by [@cortinico](https://github.com/cortinico))
- **Image:** Apps will no longer fatally crash when trying to draw large images ([483b928224](https://github.com/facebook/react-native/commit/483b92822496fa2e6339f75049a33be1e9567f52) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Image:** Avoid blocking the main thread when decompressing drawable resources ([420229d669](https://github.com/facebook/react-native/commit/420229d66946320f06485c5a3d3c167eae1a407e) by [@Abbondanzo](https://github.com/Abbondanzo))
- **JSC:** Fixes RNTester JSC Debug instacrashing ([17a5d2be5a](https://github.com/facebook/react-native/commit/17a5d2be5a96703ed1c76d89990a8f1e37abd4d4) by [@cortinico](https://github.com/cortinico))
- **layout:** Reenable `setAndroidLayoutDirection` by default ([6cf0cfb5a4](https://github.com/facebook/react-native/commit/6cf0cfb5a47a437b8a17b50b4c70460be15ee1cd) by [@NickGerleman](https://github.com/NickGerleman))
- **Layout:** Restore layout/invalidate during ReactViewClippingManager.removeViewAt() ([e3970a4bb3](https://github.com/facebook/react-native/commit/e3970a4bb3f39ec5652277d78d8c58c89e87dc30) by [@tdn20](https://github.com/tdn20))
- **Layoutanimations:** LayoutAnimations work on full new architecture ([43af902693](https://github.com/facebook/react-native/commit/43af902693f0befde802a7f684e26b19ec7126c8) by [@javache](https://github.com/javache))
- **Modal:** Fix issues with Modals and lifecycle events in multi-surface apps ([1ffef5669c](https://github.com/facebook/react-native/commit/1ffef5669c21f4b2c5fec6bc58a85f95518cf10e) by [@rozele](https://github.com/rozele))
- **Modal:** Fix crash for Modal not attached to window manager ([eaa780de1c](https://github.com/facebook/react-native/commit/eaa780de1c799bf35fded2914d27b1953b093340) by [@cipolleschi](https://github.com/cipolleschi))
- **Permissions:** Prevent ArrayIndexOutOfBoundsException in permission check ([6aeca53b3e](https://github.com/facebook/react-native/commit/6aeca53b3ed4530e57a31d7a5593ae16b550b985) by [@antFrancon](https://github.com/antFrancon))
- **ReactNativeDevTools:** Fix source loading when using an Android emulator connecting to a dev server on the host. ([ca9c56329f](https://github.com/facebook/react-native/commit/ca9c56329fe548b6631934afee0c9be63e1752a1) by [@robhogan](https://github.com/robhogan))
- **RNGP** Do not attempt to substring to 1024 while logging ([e64513bf4e](https://github.com/facebook/react-native/commit/e64513bf4ecce60aff5c04e3bed91b203429d12f) by [@cortinico](https://github.com/cortinico))
- **runtime:** Fixes some deadlocks when doing commits and state updates synchronously from the UI thread (e.g.: from reanimated). ([3986eefed1](https://github.com/facebook/react-native/commit/3986eefed1733f305db5410737a96b635f0159e7) by [@rubennorte](https://github.com/rubennorte))
- **runtime:** Addressed race condition in surface start. ([6ba7cb3102](https://github.com/facebook/react-native/commit/6ba7cb310273a0ecce6a168bf3aae45fb85bf955) by [@javache](https://github.com/javache))
- **runtime:** Avoid null reference exception in bridgeless ReactDelegate ([0d664100bb](https://github.com/facebook/react-native/commit/0d664100bbf608550a5c42a4e9b02c6c5bd0f5b8) by [@rozele](https://github.com/rozele))
- **runtime:** Fix Frame Callback not being called after Host Resume ([e8f8ee3c0f](https://github.com/facebook/react-native/commit/e8f8ee3c0f28b8c5751ffaef495adea0b8daf1eb) by [@s77rt](https://github.com/s77rt))
- **runtime:**  Merge Android ViewNativeComponent ViewConfig into BaseViewConfig ([0ba00fc998](https://github.com/facebook/react-native/commit/0ba00fc99891a333d3625db15d9dd832ca7eac88) by [@NickGerleman](https://github.com/NickGerleman))
- **runtime:** Add missing BaseViewManager props to BaseViewManagerDelegate ([6741fd94ad](https://github.com/facebook/react-native/commit/6741fd94ad26012938caa65a5129f0eca6f2246e) by [@NickGerleman](https://github.com/NickGerleman))
- **runtime:** Fix issue where `onDropViewInstance` cleanup was not being handled after `ReactRootView.unmountReactApplication` ([0449630612](https://github.com/facebook/react-native/commit/04496306123c46730b46accb2cd6239531e51fef) by [@rozele](https://github.com/rozele))
- **runtime:** Fix some cases where we override setBackgroundColor on View-level instead of VM level ([0b0ac81fbe](https://github.com/facebook/react-native/commit/0b0ac81fbeebf819e744b6ecc19d549aaab8406d) by [@NickGerleman](https://github.com/NickGerleman))
- **runtime:** Fix interactions between removeClippedSubviews and RTL ([513e9669e7](https://github.com/facebook/react-native/commit/513e9669e78a4bfd9b0380335c61f581343c4009) by [@NickGerleman](https://github.com/NickGerleman))
- **runtime:** Fix: ReactDelegate/ReactFragment crashing on New Architecture apps ([12dda31bc1](https://github.com/facebook/react-native/commit/12dda31bc12f4a04ec9df70d30328b1001bb2cec) by [@cortinico](https://github.com/cortinico))
- **runtime:** ReactFragment should properly instantiate ReactDelegate on Bridgeless ([7176d11ce4](https://github.com/facebook/react-native/commit/7176d11ce468ca37e9cbe8afcc1f6344c250dd0c) by [@cortinico](https://github.com/cortinico))
- **runtime:** ARG_DISABLE_HOST_LIFECYCLE_EVENTS in ReactFragment to allow unmounting a surface without destroying ReactHost. ([40c875deca](https://github.com/facebook/react-native/commit/40c875decabaa56d6dd45ce03b22e8b3931781ac) by [@vincenzovitale](https://github.com/vincenzovitale))
- **runtime:** Use appropriate Nullable attribute for ReactRootView field in ReactDelegate ([cbddcfc691](https://github.com/facebook/react-native/commit/cbddcfc6911101608df36f2a8d047768296c63b2) by [@rozele](https://github.com/rozele))
- **runtime:** Hover events were dispatched incorrectly when multiple ReactRoots were layered. ([533ef2ca37](https://github.com/facebook/react-native/commit/533ef2ca37d3b19fc909315f183e3f30dbf4b93d) by [@javache](https://github.com/javache))
- **runtime:** Handle removal of in-transition views. ([f402ed17fa](https://github.com/facebook/react-native/commit/f402ed17fa6d75aea24e2ad99a8b8d8ad20840e3) by [@kkafar](https://github.com/kkafar))
- **ScrollView** Dispatch onMomentumScrollEnd after programmatic scrolling ([c69e330324](https://github.com/facebook/react-native/commit/c69e330324724a1e363f4786b2b03ee7ff4b35c5) by [@Biki-das](https://github.com/Biki-das))
- **ScrollView:** Fix legacy arch RTL horizontal ScrollView regression ([bfca7cfe7a](https://github.com/facebook/react-native/commit/bfca7cfe7a8e0da10fdb776100fbc706233c0d8d) by [@NickGerleman](https://github.com/NickGerleman))
- **ScrollView:** Fix RTL ScrollView position when content smaller than container ([0df59d4f03](https://github.com/facebook/react-native/commit/0df59d4f03f79c0fcb9ede2d21bf4d49c97c21ef) by [@NickGerleman](https://github.com/NickGerleman))
- **ScrollView:** Fixed incorrect scroll event/position for scroll views when doing a smooth scroll animation. ([b4c41ec768](https://github.com/facebook/react-native/commit/b4c41ec7685da6e8ef35c41c30aa402639bc42c1) by [@rubennorte](https://github.com/rubennorte))
- **Suspense** Fix crash in getViewState when using suspense fallbacks. ([bd133b5dd5](https://github.com/facebook/react-native/commit/bd133b5dd57b18140eae51c6d7aaab02874455c1) by [@javache](https://github.com/javache))
- **style:** Enable mix-blend-mode on ReactRootView so blending works with app background ([24b0ded3cf](https://github.com/facebook/react-native/commit/24b0ded3cf715bb0e849d9f7ca8cd2d4d42cbf90) by [@jorge-cab](https://github.com/jorge-cab))
- **style:** BoxShadow now supports platformColor. ([4ede9205a0](https://github.com/facebook/react-native/commit/4ede9205a0559fcaf7ac58a3d70bc902eb23fcb6) by [@javache](https://github.com/javache))
- **style:** MixBlendMode now properly does state updates ([fae572d815](https://github.com/facebook/react-native/commit/fae572d815c7fb9684fc6c3b7f001de35ea8fb69) by [@jorge-cab](https://github.com/jorge-cab))
- **style:** Linear gradient with platform colors ([6866968a79](https://github.com/facebook/react-native/commit/6866968a79d44518884965959760983acdadc17c) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **Text:** Ensure setSelection in onAttachedToWindow is within text range ([08759121cd](https://github.com/facebook/react-native/commit/08759121cda3785e4d7ee1f1c82011a3e3a955a9) by [@zeyap](https://github.com/zeyap))
- **Text:** Fixed crash in legacy ReactFontManager ([3da23f7093](https://github.com/facebook/react-native/commit/3da23f7093730e10aeda6b58f4934a381e226dd2) by [@javache](https://github.com/javache))
- **Text:** Reimplement Android lineHeight positioning/determination ([41265bac6b](https://github.com/facebook/react-native/commit/41265bac6b83ee0bb92d645ace81e314065bf5e0) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Text without explicit font styles was potentially cut-off. ([95a5d1c628](https://github.com/facebook/react-native/commit/95a5d1c6287c7301265207d1962ba8b50d178b20) by [@javache](https://github.com/javache))
- **Text:** Fix mising `ANTI_ALIAS_FLAG` when resetting Text Paint ([276e3a7df7](https://github.com/facebook/react-native/commit/276e3a7df7de1b04dec0891fa7ed72917568ee7b) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Properly fix measurement of trailing newlines ([060c594457](https://github.com/facebook/react-native/commit/060c59445740f9b92188d2193623b36c3d859ba7) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Fixed text being measured incorrectly when ending with an empty line on the new architecture ([bd323929dc](https://github.com/facebook/react-native/commit/bd323929dc5be5666ee36043babec7d981a095dc) by [@j-piasecki](https://github.com/j-piasecki))
- **Text:** Improve text line height calculation ([65d8f66b50](https://github.com/facebook/react-native/commit/65d8f66b50471d2fb4ddd5e63e17fcc808623110) by [@mellyeliu](https://github.com/mellyeliu))
- **Text:** Fix generating empty line at the end of multiline text view when `textAlign` is set to `justify` ([08e8f6adfd](https://github.com/facebook/react-native/commit/08e8f6adfdcdfec59002f34bb7acf35bb842b331) by [@coado](https://github.com/coado))
- **TextInput:** Fix TextInput caret moving to the beginning when attached to window ([ca0abd1b9e](https://github.com/facebook/react-native/commit/ca0abd1b9ea164a566b39cb9090eaa75647aad5a) by [@QichenZhu](https://github.com/QichenZhu))
- **TextInput:** Fix NPE on ReactTextInputManager.setTextDecorationLine ([41c6ad5597](https://github.com/facebook/react-native/commit/41c6ad55978184cad1a32ec63c2d1f07e8282d5e) by [@cortinico](https://github.com/cortinico))
- **VirtualizedList:** Account for items dynamically scaling with the container when using `maintainVisibleContentPosition` in virtualized lists ([6c19996e10](https://github.com/facebook/react-native/commit/6c19996e10eda97a3501f53a68da246d1f122d01) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Yoga:** Fix YogaConfig getting garbage collected #1678 ([7dcb10b6e7](https://github.com/facebook/react-native/commit/7dcb10b6e7e226034a496eaed5351601ae0a1ae2) by [@michaeltroger](https://github.com/michaeltroger))

#### iOS specific

- **Accessibility:** Make sure that the Increment and Decrement accessibility actions works on iOS ([303e0ed764](https://github.com/facebook/react-native/commit/303e0ed7641409acf2d852c077f6be426afd7a0c) by [@cipolleschi](https://github.com/cipolleschi))
- **ActionSheetIOS:** Fix ActionSheetIOS crash `attempt to insert nil object from objects` ([bebd6531b5](https://github.com/facebook/react-native/commit/bebd6531b5f4ef0300aa5a4b6f9d23e60b57a25e) by [@RodolfoGS](https://github.com/RodolfoGS))
- **AppClips:** Fix launching App Clips with nullish URLs. ([043e2fe14a](https://github.com/facebook/react-native/commit/043e2fe14a6f13885a552211f17d61292001fa76) by [@EvanBacon](https://github.com/EvanBacon))
- **Cocoapods:** Typo in spm.rb ([5e18f7f788](https://github.com/facebook/react-native/commit/5e18f7f788ccbea60e96b8e7deab29d423ccf1a6) by [@okwasniewski](https://github.com/okwasniewski))
- **infra:** Fallback to old resolve mechanism when node require fails to resolve react native path ([3cbaddbc16](https://github.com/facebook/react-native/commit/3cbaddbc164b9dc326b2a7ddc0b35ce885bc7d9d) by [@okwasniewski](https://github.com/okwasniewski))
- **infra:** Enable hermes debugger by configuration type instead of configuration name ([eda4f185b3](https://github.com/facebook/react-native/commit/eda4f185b381f7569a1029b7697f9a1c8bc6d108) by [@benhandanyan](https://github.com/benhandanyan))
- **ObjC:** Fix numerous class interfaces having incorrect designated initializer patterns ([b98846c2e3](https://github.com/facebook/react-native/commit/b98846c2e37c3ec895536ab942978d7701f51a5e) by Nolan O'Brien)
- **PrivacyInfo:** Don't reference PrivacyInfo.xcprivacy twice for new projects ([cadd41b1a2](https://github.com/facebook/react-native/commit/cadd41b1a2e16b1c77a8d3022f4ccbdbd5ea295f) by [@okwasniewski](https://github.com/okwasniewski))
- **ReactNativeDevTools:** "Reconnect DevTools" button not working sometimes ([8507204b53](https://github.com/facebook/react-native/commit/8507204b533cf87d1e4345a9c062cd10cf0022c1) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- **ReactNativeDevTools:** Fix `r` & `d` not working from Metro sometimes ([9a60038a40](https://github.com/facebook/react-native/commit/9a60038a40e16925ea1adeb3e3c937c22a615485) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- **ScrollView:** Fixed `onMomentumScrollBegin` event not firing on command-driven scroll events ([5b609cca09](https://github.com/facebook/react-native/commit/5b609cca099b3b0d4fc66d4cf50f69d3c5b7fc8e) by [@Abbondanzo](https://github.com/Abbondanzo))
- **ScrollView:** AutomaticallyAdjustKeyboardInsets not shifting scrollview content ([2d9933e616](https://github.com/facebook/react-native/commit/2d9933e616c3efe57ed0ca141277638182a69d9c) by [@zhongwuzw](https://github.com/zhongwuzw))
- **ScrollView:** Fixes scrollIndicatorInsets not work in old arch ([c1178ac208](https://github.com/facebook/react-native/commit/c1178ac2085e073afb07453eefc9095a1f5d530f) by [@zhongwuzw](https://github.com/zhongwuzw))
- **ScrollView:** fix: vertical scroll views are detected as horizontals ([ab8f3ff3e9](https://github.com/facebook/react-native/commit/ab8f3ff3e9e6445fa9961467e965792908d4c2bd) by [@coado](https://github.com/coado))
- **style:** Fixes CornerRadiiAreEqualAndSymmetrical error when check topLeftHorizontal == topLeftVertical ([af384a914a](https://github.com/facebook/react-native/commit/af384a914a4e9ef6a5d25b00bc14b0483e5af879) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Text:**  Fixes missing char mode of linebreakmode ([77889afa1c](https://github.com/facebook/react-native/commit/77889afa1c9d0bdb966102860a5d1d1d91187ae8) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Text:** Fix possible NSRangeException when updating typing attributes in response to new text content ([6e06a810f0](https://github.com/facebook/react-native/commit/6e06a810f0ab1002f1d10351bc878babde36b1f1) by [@NickGerleman](https://github.com/NickGerleman))
- **runtime:** Fixed use of view commands from layout effects ([6f1c2a512e](https://github.com/facebook/react-native/commit/6f1c2a512e44d25edefea53e864f688018745c07) by [@sammy-SC](https://github.com/sammy-SC))
- **runtime:** Fixed crash on promise rejection handler in iOS 18. ([26d8d490e4](https://github.com/facebook/react-native/commit/26d8d490e47bd3fa46dc4a3b8e66e9ec35c15cf7) by David Rickard)
- **runtime:** Cast the UIScene to UIWindowScene only if the scene respond to the selector ([fdee0ebbcb](https://github.com/facebook/react-native/commit/fdee0ebbcb88f40c23b92b07792fbb9d1041c546) by [@cipolleschi](https://github.com/cipolleschi))
- **runtime:** Fixes the exported synchronous method not being called on the method queue when it's the main queue ([8bfd7e1039](https://github.com/facebook/react-native/commit/8bfd7e10393e649554c7246df430019c4f78d5e0) by [@zhongwuzw](https://github.com/zhongwuzw))
- **TextInput:** Fixes numeric TextInput not triggering `onSubmitEditing` ([0bcb0c2b2f](https://github.com/facebook/react-native/commit/0bcb0c2b2f460ed1a9d525d1a5b343f4b71f9347) by [@zhongwuzw](https://github.com/zhongwuzw))
- **TextInput:** Fixed problem with third party libraries overwriting `inputAccessoryView` ([d34032b6c0](https://github.com/facebook/react-native/commit/d34032b6c0bb3564a7b77ef270cc3289d99365f2) by [@kirillzyusko](https://github.com/kirillzyusko))
- **TextInput:** Workaround for Mac Catalyst TextInput crash due to serialization attempt of WeakEventEmitter ([e04738b7ec](https://github.com/facebook/react-native/commit/e04738b7ecec9e7da3aab49bb24a6336b9496b94) by [@rozele](https://github.com/rozele))
- **TextInput:** Fix `maxLength` not working in old arch ([4b3ef3b00c](https://github.com/facebook/react-native/commit/4b3ef3b00ce0026c0d1e1f2a5546fcec249255d8) by [@mateoguzmana](https://github.com/mateoguzmana))

## v0.76.9

### Changed

- **Deps:** Bump folly to 2024.10.18. This allow to use Xcode 16.3 with React Native ([73b41b5808](https://github.com/facebook/react-native/commit/73b41b5808e37d8d40d9c504ce5299ba2c315efd) by [@cipolleschi](https://github.com/cipolleschi))
- **Deps:** Bump fmt to 11.0.2. This allow to use Xcode 16.3 with React Native ([73b41b5808](https://github.com/facebook/react-native/commit/73b41b5808e37d8d40d9c504ce5299ba2c315efd) by [@cipolleschi](https://github.com/cipolleschi))
- **Deps:** Add dependency to fast_float v6.1.4, as it is required by folly. This allow to use Xcode 16.3 with React Native ([73b41b5808](https://github.com/facebook/react-native/commit/73b41b5808e37d8d40d9c504ce5299ba2c315efd) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

#### Android specific

- **Deps:** Move CMakeLists for fast_float to third-party folder ([71abbab169](https://github.com/facebook/react-native/commit/71abbab169960e7bd48f18ad72eafe042836ec7f) by [@cipolleschi](https://github.com/cipolleschi))
- **Deps:** Fix Folly CMakeLists ([21919be5ee](https://github.com/facebook/react-native/commit/21919be5ee646c0c6b6235298b66371d44cf153e) by [@cipolleschi](https://github.com/cipolleschi))

#### iOS specific

- **Runtime:** Fixed crash caused by the request operation canceling ([2bddb0012e](https://github.com/facebook/react-native/commit/2bddb0012e2e6b87d2c4ddb8ff788fc16f211f12) by [@zhouzh1](https://github.com/zhouzh1))

## v0.76.8

### Fixed

- **FormData:** Remove non compliant `filename*` attribute in a FormData `content-disposition` header ([9e846b4d11](https://github.com/facebook/react-native/commit/9e846b4d11a287977c05a77169d8775ab14474ca) by [@foyarash](https://github.com/foyarash))
- **DevX:** Disconnections of DevTools when the network is under significant strain. ([08c04147ba](https://github.com/facebook/react-native/commit/08c04147ba7664ad82dcb59184293bec8c0e728f) by [@vzaidman](https://github.com/vzaidman))
- **JS:** Fix `react-native-community/cli` not being found in pnpm setups ([9ba96ad79d6](https://github.com/facebook/react-native/commit/9ba96ad79d62a77dbf12b0012eaa4f61e4749ec0) by [@tido64](https://github.com/tido64))
- **JS:** Fix `react-native-community/cli-platform-*` packages not being found in monorepos ([ffe7bd1471](https://github.com/facebook/react-native/commit/ffe7bd147179d976b165f869cd8ae28d5de87286) by [@tido64](https://github.com/tido64))

#### Android specific

- **popup-menu-android:** Fix react-native/popup-menu-android not building for 3rd party developers ([ac637ff44](https://github.com/facebook/react-native/commit/ac637ff448e7d4f9bb4c16297fbd27ed94ab9803) by [@cortinico](https://github.com/cortinico))
- **DevTools:** Pass the bundle URL protocol when setting up HMR client on Android ([68055f2d8a](https://github.com/facebook/react-native/commit/68055f2d8a1f475a79651cdae81e6af1a32ddf6f) by [@byCedric](https://github.com/byCedric))
- **CLI:** Fix registering of `start` and `bundle` commands with community CLI and isolated node_modules. ([b9c4095e40](https://github.com/facebook/react-native/commit/b9c4095e40faed0f3ea06f1981b9a53c54a08291) by [@robhogan](https://github.com/robhogan))

#### iOS specific

- **layout:** Layout direction changes are now honored on bundle reload. ([23b888ff2d](https://github.com/facebook/react-native/commit/23b888ff2d5b877a88e3432e4a4af2836f0b8dca) by [@chrsmys](https://github.com/chrsmys))
- **TextInput:** Fixes TextInput crashes when any text is entered while running as iOS app on apple silicon mac ([e2b081e66f](https://github.com/facebook/react-native/commit/e2b081e66f277948fcb8bc546c8184c8eaff4d17) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Runtime:** Convert to JSException only NSException from sync methods ([8eec35f134](https://github.com/facebook/react-native/commit/8eec35f134f353e99fa27935110cd33d4bd9c213) by [@cipolleschi](https://github.com/cipolleschi))

## v0.76.7

### Changed

#### iOS specific

- **Deps:** Pin 'concurrent-ruby' to a working version ([198adb47af](https://github.com/facebook/react-native/commit/198adb47af3676c85b35adb308c110c1d87120c8) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- **Text** Fix `maxFontSizeMultiplier` prop on `Text` and `TextInput` components in Fabric / New Architecture ([ea49d4d1b01107a5ecbbbd4904f1d935e51d6b32](https://github.com/facebook/react-native/commit/ea49d4d1b01107a5ecbbbd4904f1d935e51d6b32) by [@RickardZrinski](https://github.com/RickardZrinski))
- **Appearance:** Fix `Appearance.setColorScheme(null)` not resetting color scheme value ([7d63235086](https://github.com/facebook/react-native/commit/7d63235086352d8c424d634c7039551f0a5025dc) by [@sangonz193](https://github.com/sangonz193))

#### Android specific

- **Deps:** Add missing `invariant` dependency ([ee8088b615](https://github.com/facebook/react-native/commit/ee8088b6157837c239db47ac5bd3a8603ceefc3c) by [@tido64](https://github.com/tido64))
- **Turbomodule** Fix execution of early InteropEvents ([4ed2b35bf6](https://github.com/facebook/react-native/commit/4ed2b35bf61426c81c9f8b30a142d77b44988fdb) by [@mdvacca](https://github.com/mdvacca))
- **Deps:** Bump Kotlin to 1.9.25 to mitigate #49115 ([f8857ba3b5](https://github.com/facebook/react-native/commit/f8857ba3b51f26871d0a0b82b9581a0c35b6273d) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- **runtime:** `RCTSurfaceHostingProxyRootView` no longer has different behavior (whether it calls `start` on the provided *surface*) depending on which initializer is used.  Call `start` yourself on the *surface* instead. ([13b93cfdda](https://github.com/facebook/react-native/commit/13b93cfddaa559697968ac1c19e55f7aaa053070) by Nolan O'Brien)
- Be less strict with method parsing of TurboModule Interop Layer
- **Turbomodule:** Avoid crashing the app when the InteropLayer can't find some methods in the native implementation. ([3bd3f101b9](https://github.com/facebook/react-native/commit/3bd3f101b9dcff8551a2f8259ddeed9843fd69b8) by [@cipolleschi](https://github.com/cipolleschi))
- **Runtime:** Fix applicationDidEnterBackground not being called ([adaceba546](https://github.com/facebook/react-native/commit/adaceba5462b4ad8676745f34e0be2bf5bb25166) by [@alextoudic](https://github.com/alextoudic))

## v0.76.6

### Fixed

- **layout:** Fix TextMeasureCacheKey Throwing Out Some LayoutConstraints ([f7a5db3c06](https://github.com/facebook/react-native/commit/f7a5db3c063b952321826ea431d3d238ef0de65d) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- **layout:** Restore layout/invalidate during ReactViewClippingManager.removeViewAt() ([0683206927](https://github.com/facebook/react-native/commit/068320692748f0c46867625786a780366fdbb1d6) by Thomas Nardone)
- **Native Modules:** Prioritise local OnLoad.cpp, falling back to default-app-setup ([8b1f049879](https://github.com/facebook/react-native/commit/8b1f04987936ab2bc7dcf62adc92bf394d35f77b) by [@timbocole](https://github.com/timbocole))
- **runtime:** Remove feature flag for allowRecursiveCommitsWithSynchronousMountOnAndroid ([fb7f87ecb2](https://github.com/facebook/react-native/commit/fb7f87ecb27f9006e2018b9622d329feb1ba23a4) by [@cipolleschi](https://github.com/cipolleschi))

#### iOS specific

- **TextInput:** Fixing TextInput `maxLength` not working in old arch ([9ecf290d27](https://github.com/facebook/react-native/commit/9ecf290d270598e45832a75f657d73cf20088a37) by [@mateoguzmana](https://github.com/mateoguzmana))

## v0.76.5

### Fixed

- Better support filtering out non linked platforms ([fcbcf80d1c](https://github.com/facebook/react-native/commit/fcbcf80d1c080af42b5277fc8a153059194efb95) by [@cipolleschi](https://github.com/cipolleschi))

#### Android specific

- Fix crash on HeadlessJsTaskService on old architecture ([4560fc0497](https://github.com/facebook/react-native/commit/4560fc049748a345d5945bc08d43f4b61ca51ff3) by [@cortinico](https://github.com/cortinico))

## v0.76.4

### Added

- Sync debugger-frontend to latest 0.76-stable (fix Expo node_modules entry points in Sources panel) ([43fe69c315](https://github.com/facebook/react-native/commit/43fe69c315e68aab96c303c7a6c9b3821a6e25e5) by [@huntie](https://github.com/huntie))
- Exclude unlinked libs from codegen ([3cedb09a65](https://github.com/facebook/react-native/commit/3cedb09a650adda0b3f24e931c25f27730af19b1) by [@cipolleschi](https://github.com/cipolleschi))

#### Android specific

- Avoid NPE when touch event is triggered before SurfaceManager is initiated ([b8095f4692](https://github.com/facebook/react-native/commit/b8095f4692610c7f4631b851dc7d8dc9b149a277) by [@CHOIMINSEOK](https://github.com/CHOIMINSEOK))

## v0.76.3

### Fixed

#### Android specific

- Look for sdkmanager.bat ([6460d2b3e7](https://github.com/facebook/react-native/commit/6460d2b3e74c3a6e4075e9f12304c16427c3b1b2) by [@blakef](https://github.com/blakef))
- CMake Windows path normalization ([9946838bedd](https://github.com/facebook/react-native/commit/9946838beddac549053a3ba3eb3b1b49c22a3fd9) by [@blakef](https://github.com/blakef))
- Fix build failure on windows in android ([08b83005481](https://github.com/facebook/react-native/commit/08b830054812f4011becbbacdf1525701225df39) by [@FouadMagdy01](https://github.com/FouadMagdy01))

## v0.76.2

### Added

- **TypeScript** Add CodegenTypes for TS ([20b141508b](https://github.com/facebook/react-native/commit/20b141508b30324d52080c255dd3fb318718d746) by [@cipolleschi](https://github.com/cipolleschi))

### Changed

- **infra** Bump CLI to 15.0.1 ([51b98c24bd](https://github.com/facebook/react-native/commit/51b98c24bdc6369ce6fabcacaf8df2d2a706eada) by [@szymonrybczak](https://github.com/szymonrybczak))

#### iOS specific

- **TextInput** Include existing attributes in newly typed text ([557e3447f5](https://github.com/facebook/react-native/commit/557e3447f520e40a1ec0ae344126b4f2836d2e83) by [@NickGerleman](https://github.com/NickGerleman))

### Fixed

- **Hermes** Update Hermes to support Intl ([94d4bfd7c8](https://github.com/facebook/react-native/commit/94d4bfd7c80ba0d55adbff656441b55d59055bcc) by [@blakef](https://github.com/blakef))
- **infra** Skip hermes-parser under Babel for non-Flow JS code ([ff1261e7dc](https://github.com/facebook/react-native/commit/ff1261e7dc0ab7e241e1f14aa0d6fd17f2ba9328) by [@huntie](https://github.com/huntie))
- **infra** fix `semver` not being found in pnpm setups ([0def73d1a6](https://github.com/facebook/react-native/commit/0def73d1a6e398d451585032ea1213f96d84fe9c) by [@tido64](https://github.com/tido64))
- **Error Handling** Fix `setUpErrorHandling` to show early JS errors ([dac6d508af](https://github.com/facebook/react-native/commit/dac6d508afd0f919943d8053330d6314201319c3) by [@cipolleschi](https://github.com/cipolleschi))

#### Android specific

- **infra** Use absolute path when compiling appmodules.so sources ([3956955eaa](https://github.com/facebook/react-native/commit/3956955eaa3cd8c50dfe35a68a6cb8fdcac43155) by [@cortinico](https://github.com/cortinico))
- **infra** Properly handle paths with spaces in autolinking ([1f62529dc4](https://github.com/facebook/react-native/commit/1f62529dc4583af88ef06bee04c89ce6c2ef737f) by [@cortinico](https://github.com/cortinico))
- **Modal** Fix Regression - Modal content rendering below system bar on < API 30 when activity is edge-to-edge ([2cd48ef351](https://github.com/facebook/react-native/commit/2cd48ef351d10333a14091188bbe8e3bcd6a7a01) by [@alanleedev](https://github.com/alanleedev))
- **runtime** Fix timers in headless tasks on bridgeless mode ([ee7b4e2763](https://github.com/facebook/react-native/commit/ee7b4e276355146be53958b402bfb2d5af2dd1bc) by [@j-piasecki](https://github.com/j-piasecki))

#### iOS specific

- **Codegen** Properly stop generating component registration for components defined in app. ([97a4234b6e](https://github.com/facebook/react-native/commit/97a4234b6e51b3c35c82095029ef00270ad02e29) by [@cipolleschi](https://github.com/cipolleschi))
- **infra** Give apps access to Yoga headers ([e851e73c18](https://github.com/facebook/react-native/commit/e851e73c1806a7b7b898a67716be87f42ced491a) by [@cipolleschi](https://github.com/cipolleschi))
- **TextInput** Fix missing emitter attributes on iOS TextInput when controlled component value specified using `value` instead of `children` ([52cdedb40e](https://github.com/facebook/react-native/commit/52cdedb40e242c9ed280b821f8493a3872ef2b54) by [@NickGerleman](https://github.com/NickGerleman))
- **TextInput** Fix cursor moving in iOS controlled single line TextInput on Autocorrection (New Arch) ([36fd5533f6](https://github.com/facebook/react-native/commit/36fd5533f68b0f907a949db87884b58820015ba8) by [@NickGerleman](https://github.com/NickGerleman))

## v0.76.1

### Fixed

#### Android specific

- **runtime** Made AppRegistry callable from Native code in Bridgeless (fixes headless tasks) ([f3fee67c54](https://github.com/facebook/react-native/commit/f3fee67c547ace5e08bc9e119bcb80e0f3454d30) by [@robik](https://github.com/robik))
- **runtime** Add jsBundleFile to DefaultReactNativeHost.kt ([e56bd89ef](https://github.com/facebook/react-native/commit/e56bd89eff72f1d38d2940b9dbd8f7b97037dc22))

#### iOS specific

- **codegen** Do not generate the ComponentCls function in the RCTThirdPartyFabricComponentsProvider for components deined in the app. ([dc7e9e2d83](https://github.com/facebook/react-native/commit/dc7e9e2d83f5af3d2a970521af4fcc7f86d2168d) by [@cipolleschi](https://github.com/cipolleschi))
- **infra** Generated NODE_BINARY in .xcode.env.local now supports paths with a space ([eeaa3ff458](https://github.com/facebook/react-native/commit/eeaa3ff458a3e5c902075bb45161d6ccde31fe53) by [@blakef](https://github.com/blakef))
- **infra** Pin Xcodeproj to < 1.26.0 ([e8776240b41](https://github.com/facebook/react-native/commit/e8776240b41a3147e95713299b69c813be60b8e8))
- **runtime** Fixed bug where background colors would sometimes animate when changing on Views ([1d6ac09530](https://github.com/facebook/react-native/commit/1d6ac09530145e6d2bf1e4dd9d40f51542d9e7f6) by [@joevilches](https://github.com/joevilches))
- **runtime** Fixes regression of RCTWindowFrameDidChangeNotification not fired ([e271b23fad](https://github.com/facebook/react-native/commit/e271b23fad89e1e7da2e91a8f1e5cbb295406c74) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.76.0

### Breaking

- **Animation** Stop sending state updates to React in looping animation ([8af5e893c8](https://github.com/facebook/react-native/commit/8af5e893c89b24dca972afe36ef442fd509d5804) by [@dmytrorykun](https://github.com/dmytrorykun))
- **devtools:** Remove Inspector Panel perf + network tabs under New Arch (see https://github.com/react-native-community/discussions-and-proposals/pull/777) ([f220bde4d7](https://github.com/facebook/react-native/commit/f220bde4d7d556b3be83cccff0eec5da22921aba) by [@huntie](https://github.com/huntie))
- **flow:** Eliminate a few React.Element type that will be synced to react-native ([39c338ff8d](https://github.com/facebook/react-native/commit/39c338ff8d3a65ec3f7a45f0b8319f70115e2fc1) by [@SamChou19815](https://github.com/SamChou19815))
- **infra** Projects that intend to use the community CLI will now have to declare that dependency instead of transitively having the react-native package include it. ([bd3a3e3de0](https://github.com/facebook/react-native/commit/bd3a3e3de08e334db6f1f248241df8ea4680724c) by [@blakef](https://github.com/blakef))
- **infra** Remove react-native-community dependencies from react-native ([9269429bb9](https://github.com/facebook/react-native/commit/9269429bb955d47088793a2e32454fddb712152b) by [@blakef](https://github.com/blakef))
- **infra:** TurboModules will be looked up as TurboModules first, and fallback to legacy modules after. ([5a62606ab3](https://github.com/facebook/react-native/commit/5a62606ab36edaffb0a5c760d2b0ed0c8e3808a8) by [@javache](https://github.com/javache))
- **text engine** Always use AttributedStringBox instead of AttributedString in TextLayoutManager ([ee597bfe2bf](https://github.com/facebook/react-native/commit/ee597bfe2bf7f11ac60dab87f47dbcb6e840749c)) by  [@NickGerleman](https://github.com/NickGerleman))


#### Android specific

- **bridging:** Deleted LongArray ([471445eb17](https://github.com/facebook/react-native/commit/471445eb1770dcb773eb463af99c9556cb070abc) by Thomas Nardone)
- **Flipper:** Update ReactNativeFlipper deprecation to ERROR ([531657b394](https://github.com/facebook/react-native/commit/531657b394aa0fac70f26d9facdb32d23a1b05d6) by [@cortinico](https://github.com/cortinico))
- **infra** Remove several libs from default App CMake setup ([52de8c70f2](https://github.com/facebook/react-native/commit/52de8c70f2d8826789e4118b0c81aa4397e833fc) by [@cortinico](https://github.com/cortinico))
- **infra:** Merge all the remaining .so libraries into libreactnative.so ([db80d78d7a](https://github.com/facebook/react-native/commit/db80d78d7a3d61d5bd6871258513f778851059f5) by [@cortinico](https://github.com/cortinico))
- **infra:** Remove several unnecessary android prefab targets. Use ReactAndroid::reactnative instead ([6e5227bd83](https://github.com/facebook/react-native/commit/6e5227bd8357dcbe12038b21066cf414e3f97e03) by [@cortinico](https://github.com/cortinico))
- **infra:** Do not depend on OSS SoLoader anymore and do not expose Fresco `api` dependency. ([6dc01dad09](https://github.com/facebook/react-native/commit/6dc01dad09c6ee2ac6793db1b11cb98faada9c3b) by [@cortinico](https://github.com/cortinico))
- **infra:** Updating `minSdkVersion` to API 24 (Android 7) ([270951a212](https://github.com/facebook/react-native/commit/270951a2123b5c51567b72a8f1a8a1608cba43d7) by [@alanleedev](https://github.com/alanleedev))
- **initialization:** `ReactNativeHost` invalidates the instance manager on `clear()`, rather than merely destroying the instance. ([986cf18dd2](https://github.com/facebook/react-native/commit/986cf18dd2f0d6ea491d521549c0bf9a323e189b) by [@motiz88](https://github.com/motiz88))
- **layout engine:** Do not implicitly convert parsed LengthPercentage to pixels ([9e48976bc2](https://github.com/facebook/react-native/commit/9e48976bc2864c6ef6995179a7dc8d1c453dcf39) by [@NickGerleman](https://github.com/NickGerleman))
- **rendering:** Set "enableBackgroundStyleApplicator" by default ([5f14963da0](https://github.com/facebook/react-native/commit/5f14963da081deeac2fb540d58c8667c2d2c5d08) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- **initialization:** Add ability to control bundle loading on the new architecture similar to `loadSourceForBridge`. Removed some properties from the `RCTRootViewFactory`. ([7487a2c277](https://github.com/facebook/react-native/commit/7487a2c27713a0129ef2db70efc2fa543a8c185e) by [@alanjhughes](https://github.com/alanjhughes))
- **turbomodule** [iOS] Remove Macro for autolinking pure Cxx module([184646e491](https://github.com/facebook/react-native/commit/184646e49169110842bafa6c02e52f6eec1e0ffa) by [@philIip](https://github.com/philIip))


### Added

- **style** Add official `filter` CSSProperty. ([6b369a40d9](https://github.com/facebook/react-native/commit/6b369a40d98c2bb7f933415f62b1e2b8f4da86ed) by [@jorge-cab](https://github.com/jorge-cab))
- **style** Add official `boxShadow` CSSProperty. ([2241c3146f](https://github.com/facebook/react-native/commit/2241c3146ffbfb8b77f54599b7cebb717537c15a) by [@jorge-cab](https://github.com/jorge-cab))
- **codegen:** Add EventEmitter Code-gen support for Java and ObjC Turbo Modules ([ad3df84668](https://github.com/facebook/react-native/commit/ad3df84668f1624e830396364c331783c6f99948) by [@christophpurrer](https://github.com/christophpurrer))
- **devtools:** support for rendering Error object previews in Chrome DevTools console ([cae9ae5b48](https://github.com/facebook/react-native/commit/cae9ae5b486d04b889af9d1685bcbbb33557c791) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- **devtools:** support for rendering Error objects in Chrome DevTools console ([1740a56a46](https://github.com/facebook/react-native/commit/1740a56a46ef4a364c88cebe373b4b3a5679248a) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- **devtools** Add upper case keys to the debug key handler ([6390cf67d0](https://github.com/facebook/react-native/commit/6390cf67d065727c810fcf4ef32b0cac7efac8e2) by [@wh201906](https://github.com/wh201906))
- **devtools:** Debugger: Support text responses to CDP `IO.read` requests ([c085180264](https://github.com/facebook/react-native/commit/c085180264ea68f71b050cbb6b9a8274e36c3fbf) by [@robhogan](https://github.com/robhogan))
- **devtools:** Debugging: implement common C++ layer of CDP `Network.loadNetworkResource` ([193cdc36f7](https://github.com/facebook/react-native/commit/193cdc36f7de5524b509e38da8feb209d214634c) by [@robhogan](https://github.com/robhogan))
- **devtools:**: Inspector: Support `/open-debugger` specifying `target` param ([88ba9a6042](https://github.com/facebook/react-native/commit/88ba9a60428697f5957f269e85fbef3d0afc5046) by [@robhogan](https://github.com/robhogan))
- **infra:** Use PackagerAsset resolver instead of Platform.OS when its provided. ([baa366654e](https://github.com/facebook/react-native/commit/baa366654e9ee98e0400b493e7fc9578851d60d1) by [@andrewdacenko](https://github.com/andrewdacenko))
- **infra:** Add optional `PackagerAsset.resolver` prop so AssetSourceResolver can use it instead of `Platform.OS` to identify where asset is stored on device. ([3f3a85b3c5](https://github.com/facebook/react-native/commit/3f3a85b3c5be3f9fdbd63a3acfe8456b6adeb100) by [@andrewdacenko](https://github.com/andrewdacenko))
- **initialization** Add experimental api to JSRuntimeFactory to initialize runtime on js thread ([c9fbc05bbc](https://github.com/facebook/react-native/commit/c9fbc05bbca803032914be4b38ac4c9608852963) by Benoit Girard)
- **metro:** Expose `MetroConfig` type directly from `react-native/metro-config`. ([cc6d1eb844](https://github.com/facebook/react-native/commit/cc6d1eb8449c25fe3c76aaf4da5cd38b3ac0783d) by [@tjzel](https://github.com/tjzel))
- **rsc** Added support for importing `react-native` in a `react-server` environment for React Server Components support. ([8989c9b71d](https://github.com/facebook/react-native/commit/8989c9b71dcca3f39b37a32945364025732eb2c3) by [@EvanBacon](https://github.com/EvanBacon))
- **style:** Add support for `texAlignment: 'start'` ([a2cb34371e](https://github.com/facebook/react-native/commit/a2cb34371e6e52305ee58f23d3b2fefc1e8c7157) by [@javache](https://github.com/javache))
- **style:** Unhide new arch layout props ([2d6c59e1d4](https://github.com/facebook/react-native/commit/2d6c59e1d4f6ddb46373ed10c915aed4ce0c030c) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- **devtools:** Enable React Native DevTools in OSS debug builds ([143f1ad298](https://github.com/facebook/react-native/commit/143f1ad29874c1e8e9561abae263cb08f4859407) by [@robhogan](https://github.com/robhogan))
- **codegen** Add support for handling `com.facebook.react.bridge.Dynamic` as parameter type in TurboModules ([d01f1b3214](https://github.com/facebook/react-native/commit/d01f1b3214b435d436fd6cf145d8e450a188301c) by [@cortinico](https://github.com/cortinico))
- **error handling:** Provide default implementation for ReactHostDelegate.handleInstanceException() ([34e3a6cc88](https://github.com/facebook/react-native/commit/34e3a6cc885a68148b1d2209adc70c8109a56a66) by [@alanleedev](https://github.com/alanleedev))
- **Image** Added support for rendering XML assets provided to `Image` ([aad9240fd4](https://github.com/facebook/react-native/commit/aad9240fd435d549812b5075767c5ea39a8fbb4f) by Peter Abbondanzo)
- **Runtime** Allow DefaultReactHost to load the js bundle via regular file urls ([7522336412](https://github.com/facebook/react-native/commit/752233641210a0b2e6bc1438f82d0aa193c2ef0d) by [@RSNara](https://github.com/RSNara))
- **runtime** Make ReactInstanceEventListener available on ReactHost ([80e1dd70b0](https://github.com/facebook/react-native/commit/80e1dd70b0b27195b9b71ea531728eef9799caa9) by [@RSNara](https://github.com/RSNara))
- **runtime** Add `invalidate()` method to ReactHost and ReactInstanceManager that destroys the `ReactHost`, including the `ReactInstance`. ([a3db352e25](https://github.com/facebook/react-native/commit/a3db352e25c01614ade3e42637e3d5726e582308) by [@motiz88](https://github.com/motiz88))
- **runtime:** Added `onUserLeaveHint` support into `ReactActivityDelegate` ([27ba369f23](https://github.com/facebook/react-native/commit/27ba369f2325db5678aaf6a18927c127921840e0) by [@behenate](https://github.com/behenate))
- **runtime:** Added a conditional check in the `resolveThemeAttribute` function to reattempt resource resolution with the "android" package name if the resource ID is 0. ([6365df54db](https://github.com/facebook/react-native/commit/6365df54dbd0a7e185cfe113a9cf0026b2bb12ef) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **style** Add BackgroundStyleApplicator for managing view backgrounds ([1a78477ce5](https://github.com/facebook/react-native/commit/1a78477ce528b36a97602d0210bd4ea8446804dc) by [@NickGerleman](https://github.com/NickGerleman))
- **style:** Linear gradient ([bd0aedc8c3](https://github.com/facebook/react-native/commit/bd0aedc8c3dbebf96e123fd1bd33f515d09e2579) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **style:** Support simple opacity in nested text ([a2d53d5ea0](https://github.com/facebook/react-native/commit/a2d53d5ea08959da0bbce3c494e06634e3d52d2a) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- **accessibility:** Support LargeContentViewer on iOS for better accessibility ([6cc44d765a](https://github.com/facebook/react-native/commit/6cc44d765a1127aa4998a490e3ff90b741ef9441) by [@bacarybruno](https://github.com/bacarybruno))
- **Animated:** Declare the `onUserDrivenAnimationEnded` in the old Architecture ([f8c13f601d](https://github.com/facebook/react-native/commit/f8c13f601d5f7f159dd7a0e42b9fcc877d48d69b) by [@cipolleschi](https://github.com/cipolleschi))
- **Animated:** Retrieve the tags of the nodes connected by the animation and send them to JS ([fd748ae84c](https://github.com/facebook/react-native/commit/fd748ae84cf18c1c204a936af45bb4883d476cd7) by [@cipolleschi](https://github.com/cipolleschi))
- **brownfield:** Improve RCTAppDelegate usage for brownfield, add `automaticallyLoadReactNativeWindow` flag ([391680fe84](https://github.com/facebook/react-native/commit/391680fe844aad887e497912378c699aed13464b) by [@okwasniewski](https://github.com/okwasniewski))
- **codegen** Code-generate an optional base class to use for every NativeModule ([ed5f558a6c](https://github.com/facebook/react-native/commit/ed5f558a6cb5ff597870e7013150113b9460c0dc) by [@christophpurrer](https://github.com/christophpurrer))
- **devtools** Debugger: Implement CDP methods for loading network resources through the debug target. ([c720583f6c](https://github.com/facebook/react-native/commit/c720583f6c071959e7898befb62cd36f84c581dc) by [@robhogan](https://github.com/robhogan))
- **infra** Enable third-party podspec sources to be fetched from mirrored git repositories ([53969cb8d0](https://github.com/facebook/react-native/commit/53969cb8d0460ccb2e899ec290135f447ed5dc65) by [@RailByteOEBB](https://github.com/RailByteOEBB))
- **runtime** Added RCTUIInterfaceOrientation helper method ([cf015f93ef](https://github.com/facebook/react-native/commit/cf015f93efa888be61150915b18ae8cd12d11232) by [@Biki-das](https://github.com/Biki-das))
- **ScrollView** Send onScrollEnded event to NativeTurboAnimatedModule ([7af743236f](https://github.com/facebook/react-native/commit/7af743236f25ee03b674baf46f6506dbbc2e4fc0) by [@cipolleschi](https://github.com/cipolleschi))
- **ScrollView:** Fire onMomentumScrollEnd when UIScrollView is removed from window ([b98b9f1fa7](https://github.com/facebook/react-native/commit/b98b9f1fa7717283f368eb182a51d971b8776c80) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **style** Linear gradient ([b99675d78a](https://github.com/facebook/react-native/commit/b99675d78a8269403b68d7eae8dc67ec85aea3e6) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **TextInput** Add line break mode for TextInput components. ([fe941a8f4c](https://github.com/facebook/react-native/commit/fe941a8f4c92fa9b1f07d2dd94050c81d63c77e8) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **TextInput** Line break mode for TextInput components. ([6cab6c2a13](https://github.com/facebook/react-native/commit/6cab6c2a13b89cbee1a2c1957ea561f82cb6700a) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **TextInput** Add support for missing text content types ([d7a3e48032](https://github.com/facebook/react-native/commit/d7a3e48032fe76d118c2b5c14032d7a73319adf8) by [@krozniata](https://github.com/krozniata))
- **TextInput** Added handling of `showSoftInputOnFocus` props for new arch. ([ead50d6b11](https://github.com/facebook/react-native/commit/ead50d6b1180dbe9f8b49d646cc34f83aae41c74) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))

### Changed


- **Animated:** Improved runtime performance of `Animated` ([d1ebe02c19](https://github.com/facebook/react-native/commit/d1ebe02c19a4ae78f54e2647d5b18e6bf93079c1) by [@yungsters](https://github.com/yungsters))
- **Animated:** Changed `Animated` props validation to soft errors instead of thrown errors ([0a1ba02273](https://github.com/facebook/react-native/commit/0a1ba02273693ffd605ca2aebce90746c1745a9c) by [@yungsters](https://github.com/yungsters))
- **Appearance:** Improved `Appearance.getColorScheme` performance ([8f0f50f7a1](https://github.com/facebook/react-native/commit/8f0f50f7a1729019b1b0957076edfee58a146c56) by [@yungsters](https://github.com/yungsters))
- **c++:** Removed using namespace std::placeholders ([194b642633](https://github.com/facebook/react-native/commit/194b642633d944b9e73e55b947284eabd42d55a2) by [@r-barnes](https://github.com/r-barnes))
- **devtools:** Remove `--experimental-debugger` option from start command ([94e7a87f23](https://github.com/facebook/react-native/commit/94e7a87f2344c2024817ea7e928ab81e7f57aa76) by [@huntie](https://github.com/huntie))
- **devtools:** Inspector: Enforce device and appId filters if both are given to /open-debugger ([c7970379a1](https://github.com/facebook/react-native/commit/c7970379a1e9be87be22ddcdec38752257059450) by [@robhogan](https://github.com/robhogan))
- **devtools:** Debugger: `j` opens most recent (not first) target. ([2a6a895b17](https://github.com/facebook/react-native/commit/2a6a895b17fdd4112349853e08a50c4c90886cb8) by [@robhogan](https://github.com/robhogan))
- **devtools:** Debugger: Make `/json/list` return connection-addition-ordered targets. ([53951d7fec](https://github.com/facebook/react-native/commit/53951d7fec2997487d1ee948304ab904c21338aa) by @robhogan)
- **devtools** Add Fusebox support for saving traces to disk ([1bd4a11736](https://github.com/facebook/react-native/commit/1bd4a11736c2916c9114df55395d474a801ee63b) by Benoit Girard)
- **devtools:** Simplify key handling in start command ([5a0df6d0bf](https://github.com/facebook/react-native/commit/5a0df6d0bf5e84d3f7d2a6f000e617e00b8bef02) by [@huntie](https://github.com/huntie))
- **error handling:** Improved error message for invalid filter values ([4094ce0718](https://github.com/facebook/react-native/commit/4094ce0718c54a2c9a326cc2962ea00e30b7bdf6) by [@yungsters](https://github.com/yungsters))
- **error handling:** Improve LogBox safe area insets styling ([18302831c4](https://github.com/facebook/react-native/commit/18302831c49299d326935f875655c439cc4fbe0d) by [@yungsters](https://github.com/yungsters))
- **infra:** Update all babel packages and fix tests accordingly ([b37101486b](https://github.com/facebook/react-native/commit/b37101486bd4dc26f6ec4e646e12d1484ec9479f) by [@vzaidman](https://github.com/vzaidman))
- **infra:** Upgrade pretty-format to 29.7.0 ([7bc9244d0c](https://github.com/facebook/react-native/commit/7bc9244d0cbebc310116b6b2a2baf0781073d0f5) by [@dprevost-LMI](https://github.com/dprevost-LMI))
- **infra:** Move init deprecation notice 30 Sept → 31 Dec, to give users more time to update their infrastructure ([014370d825](https://github.com/facebook/react-native/commit/014370d825b273bc96464e84ba2d57ae5cf37eda) by [@blakef](https://github.com/blakef))
- **infra:** Drop `node-fetch` in favor of Node's built-in fetch from `undici` in `react-native/dev-middleware` ([30a3e6e8df](https://github.com/facebook/react-native/commit/30a3e6e8dfcfc9597873578b8332ec027ccf1b84) by [@byCedric](https://github.com/byCedric))
- **infra:** Allow use without @react-native-community/cli-server-api ([24997dc5ae](https://github.com/facebook/react-native/commit/24997dc5ae4ed85d3965cbc6796423f5012e4eb1) by @blakef)
- **infra:** Add CLI selection of multiple debug targets ([6a24df7eaa](https://github.com/facebook/react-native/commit/6a24df7eaab2420e91b9a4fc9202c175c0802441) by [@huntie](https://github.com/huntie))
- **infra** Update Metro to "^0.81.0" ([3f8d1fa286](https://github.com/facebook/react-native/commit/3f8d1fa2862814cc8e2b091786e80231670bb876) by [@robhogan](https://github.com/robhogan))
- **initialization:** Improve `Appearance` performance overhead by lazily initializing the NativeModule ([b86e8ef95f](https://github.com/facebook/react-native/commit/b86e8ef95fc6d7e35b2e20529a52bb74780dcf1a) by [@yungsters](https://github.com/yungsters))
- **metro:** Changed Metro default config to use Hermes parser, enabling the use of advanced Flow syntax in React Native. ([320963c7cb](https://github.com/facebook/react-native/commit/320963c7cb394ccd8768003ad40c9767fdb7f4e3) by [@yungsters](https://github.com/yungsters))
- **metro:** Use Metro terminal reporter for dev-middleware logs ([2f04dfe795](https://github.com/facebook/react-native/commit/2f04dfe7951e5f4c63f94c74d7ad10cd53969da0) by [@huntie](https://github.com/huntie))
- **metro:** Fix server.end() usage following Metro bump ([02b879b1e2](https://github.com/facebook/react-native/commit/02b879b1e22dd03f52ff77d82cac3fe167aaea84) by [@huntie](https://github.com/huntie))
- **runtime:** Timer functions `timeout` argument is now coerced to a number ([af04eb773c](https://github.com/facebook/react-native/commit/af04eb773cf7531323c6a34a276098e84c6041a9) by [@robik](https://github.com/robik))
- **turbomodules:** Replace TurboReactPackage with BaseReactPackage ([e881a1184c](https://github.com/facebook/react-native/commit/e881a1184cadd45321b781d07c6154a14332c5f6) by [@philIip](https://github.com/philIip))
- **yoga** Replace YogaConstants.UNDEFINED with Float.NaN ([8bd9952eaf](https://github.com/facebook/react-native/commit/8bd9952eaf28fe8feca7490293656caeefe7897e) by Jingbo Yang)


#### Android specific

- **DevTools** Make PackagerConnectionSettings class open again ([4dd47eeb9e](https://github.com/facebook/react-native/commit/4dd47eeb9ea91455efcd0db23a02162ab338a53f) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- **infra:** Update compileSdk to 35 ([1333e0ee6a](https://github.com/facebook/react-native/commit/1333e0ee6ac78ad856b7f86234ec2606fcc48a7e) by [@alanleedev](https://github.com/alanleedev))
- **infra:** Expose jsc tooling via prefab ([e91690d929](https://github.com/facebook/react-native/commit/e91690d929d7c8b251964cae282ad8e1d95aa39a) by [@tomekzaw](https://github.com/tomekzaw))
- **infra:**Expose hermes tooling via prefab ([f41af55958](https://github.com/facebook/react-native/commit/f41af55958dfbc39c536d433c3a27db329dd05f1) by [@cortinico](https://github.com/cortinico))
- **infra:** Bump AGP to 8.6.0 ([aca31eb610](https://github.com/facebook/react-native/commit/aca31eb610c2c4d433311b1cdaf20af94fd54622) by [@cortinico](https://github.com/cortinico))
- **infra:** Gradle to 8.10.2 ([60a2706e97](https://github.com/facebook/react-native/commit/60a2706e9716d955fc0d7e15b02ad0d6efe58fc2) by [@cortinico](https://github.com/cortinico))
- **LogBox:** Modify LogBox to be usable on Android 15 ([5fe7660439](https://github.com/facebook/react-native/commit/5fe76604393a7e931559a3ef82564619885dbe43) by [@alanleedev](https://github.com/alanleedev))
- **Modal** Fix crash for Modal not attached to window manager ([73ce1984e8](https://github.com/facebook/react-native/commit/73ce1984e8411a6b4aec440a5e7aa9d2b7474984) by [@alanleedev](https://github.com/alanleedev))
- **style:** Move `experimental_boxShadow` and `experimental_backgroundImage` to BaseViewConfig ([03801f275e](https://github.com/facebook/react-native/commit/03801f275e81c27a09f717bf48322f9ab1a54fc1) by [@NickGerleman](https://github.com/NickGerleman))
- **style:** Revamp InsetBoxShadowDrawable ([d9f684b1cf](https://github.com/facebook/react-native/commit/d9f684b1cf7fb6824e25e1e948bfb30dec450464) by [@NickGerleman](https://github.com/NickGerleman))
- **style:** Support OutsetBoxShadowDrawable on Android 9+ ([f905f90468](https://github.com/facebook/react-native/commit/f905f904685cc67a948349e0d58dce8b7f524069) by [@NickGerleman](https://github.com/NickGerleman))
- **infra:** Merge libuimanagerjni.so inside libreactnative.so ([7916f7e120](https://github.com/facebook/react-native/commit/7916f7e12014c42b2bc9bfcfe053e37358fc39a4) by [@cortinico](https://github.com/cortinico))
- **infra:** Move libyoga.so and libturbomodulejsijni.so inside libreactnative.so ([80c3aea48d](https://github.com/facebook/react-native/commit/80c3aea48d584b49fab8df3a417558cf5c5c3b12) by [@cortinico](https://github.com/cortinico))
- **infra:** Move more libraries to so-merging: rninstance, react_featureflagsjni, hermesinstancejni, fabricjni ([e864910a4d](https://github.com/facebook/react-native/commit/e864910a4d805a23244365b96e1f5e207a45a4a9) by [@cortinico](https://github.com/cortinico))
- **infra:** Move libmapbufferjni.so inside libreactnative.so ([5b761ff15c](https://github.com/facebook/react-native/commit/5b761ff15cdb2501862f07650912cbd26eaafdef) by [@cortinico](https://github.com/cortinico))
- **infra:** Move libreact_newarchdefaults.so inside libreactnative.so ([0caf3e824d](https://github.com/facebook/react-native/commit/0caf3e824d81689034ddf96d86d2362c9911d389) by [@cortinico](https://github.com/cortinico))
- **runtime:** Make `setPointerEvents` public ([010e0010a3](https://github.com/facebook/react-native/commit/010e0010a38e111df110584ebacaabe210c3f137) by [@jakex7](https://github.com/jakex7))
- **runtime:** Avoid image off-screen render ([620b1221fa](https://github.com/facebook/react-native/commit/620b1221fa7d4e0e8e070031f65fdf786e3342d0) by [@NickGerleman](https://github.com/NickGerleman))
- **kotlin:** Migrated ReactSwitch to Kotlin ([03c0e5e2af](https://github.com/facebook/react-native/commit/03c0e5e2af288e96f39fa044cbbe8ebef91bdb1e) by [@blakef](https://github.com/blakef))
- **kotlin** Migrated AdditionalAnimatedNode.java to Kotlin ([8689aa48bb](https://github.com/facebook/react-native/commit/8689aa48bb5fac6b96144c08d49b15359ef141a1) by [@blakef](https://github.com/blakef))
- **turbomodule:** Modules marked with needsEagerInit = true will now be
created on the mqt_native thread. ([c4a6bbc8fd](https://github.com/facebook/react-native/commit/c4a6bbc8fd8992059abdcfae2bc483bd29f31e79) by [@javache](https://github.com/javache))
- **error handling** Log a SoftException on SurfaceMountingManager.addRootView ([3429dc1ccf](https://github.com/facebook/react-native/commit/3429dc1ccf32b6b23f4f0ad3cfdf0d5697af665f) by [@psionic12](https://github.com/psionic12))
- **layout:** Extracted common parts related to calculating text layout to a helper ([2eaf0b0848](https://github.com/facebook/react-native/commit/2eaf0b0848d660eb19fde2921570f9e8bd2bd1de) by @j-piasecki)
- **kotlin:** Migrate StyleAnimatedNode.java to Kotlin ([ef9149b4fc](https://github.com/facebook/react-native/commit/ef9149b4fc989827ad4b781fa89f556a1fd20db4) by [@rshest](https://github.com/rshest))

#### iOS specific

- **infra** Don't include C++ bridging header in RCTTurboModule.h ([3fc7ebb311](https://github.com/facebook/react-native/commit/3fc7ebb311e86cf2e3e78efacb1860deadd54216) by [@christophpurrer](https://github.com/christophpurrer))
- **infra** Bump iOS min version for CI ([b93c2b2412](https://github.com/facebook/react-native/commit/b93c2b241247d0a7d9b79eda76af0a7bca0ac745) by [@realsoelynn](https://github.com/realsoelynn))
- **infra** Update RNTester and HelloWorld template app to `min iOS 15.1` ([e1a1cdacf2](https://github.com/facebook/react-native/commit/e1a1cdacf2d210353c06e7ab65f971f6592e8c00) by [@realsoelynn](https://github.com/realsoelynn))
- **infra** Enforce we use the correct C++ version for all, even if dependency tries to set it ([d7a8aae9ac](https://github.com/facebook/react-native/commit/d7a8aae9acc441d9b6c52484e35ba158e90b4b60) by [@Titozzz](https://github.com/Titozzz))
- **renderer** Changed border display ([94407f56d1](https://github.com/facebook/react-native/commit/94407f56d133b2ba46dc5b31679e9500470e1770) by [@coado](https://github.com/coado))
- **runtime** Refactor supportedInterfaceOrientations method to use RCTKeyWindow() ([815c415fb9](https://github.com/facebook/react-native/commit/815c415fb90944db89552a503eb53059e9f0d20b) by [@okwasniewski](https://github.com/okwasniewski))

### Deprecated


#### Android specific

- **bridging:** Deprecate MapBuilder ([a696d2ed6b](https://github.com/facebook/react-native/commit/a696d2ed6b95c07229bc0fd00aca344951689bbd) by Thomas Nardone)

#### iOS specific

-  **initialization:** Deprecate turboModuleEnabled, fabricEnabled and bridgelessEnabled for the new newArchEnabled property. ([3621606c44](https://github.com/facebook/react-native/commit/3621606c4486051de8b443c443cd87f6b822d1a0) by [@okwasniewski](https://github.com/okwasniewski))
- **runtime** Deprecated StatusBar.setNetworkActivityIndicatorVisible ([8a390ba9b8](https://github.com/facebook/react-native/commit/8a390ba9b8c1b8889dd0933fe1477083a24ff71d) by Ingrid Wang)

### Removed

- **devtools** Remove sampling profiler from dev menu ([f57740c0fb](https://github.com/facebook/react-native/commit/f57740c0fbd431991bf90f83dac5770fa74d13cf) by [@blakef](https://github.com/blakef))

#### Android specific

- **components** CoreComponentsRegistry is now fully replaced by DefaultComponentRegistry. ([de7976c69d](https://github.com/facebook/react-native/commit/de7976c69d9f837729e8822f2b89e6d08ea6883a) by [@javache](https://github.com/javache))
- **error handling** Removed HasJavascriptExceptionMetadata as a marker interface. Use JavascriptExecption directly ([cb00ca954d](https://github.com/facebook/react-native/commit/cb00ca954d1a7647900c8ff6b5792eb342735140) by [@javache](https://github.com/javache))
- **initialization** Unused jsEngineResolutionAlgorithm from ReactHost ([f1b6218608](https://github.com/facebook/react-native/commit/f1b6218608ea968f032f8344d4648651617482cf) by [@javache](https://github.com/javache))
- **infra** React_newarchdefaults is no longer a prefab, instead use fabricjni ([c68f35d444](https://github.com/facebook/react-native/commit/c68f35d4441c8a03541da17e3adc03f355e8c45e) by [@javache](https://github.com/javache))

#### iOS specific

- **runtime:** Remove `[RCTConvert UIBarStyle:]` ([a557a81f96](https://github.com/facebook/react-native/commit/a557a81f963041351e02f3b79489c6ee394ebe48) by [@Saadnajmi](https://github.com/Saadnajmi))

### Fixed

- **Animated:** Fixed undefined behavior in certain scenarios when `ReactElement` objects are supplied to Animated components ([56937d646c](https://github.com/facebook/react-native/commit/56937d646c741b32826a92a76193eadc8dc59031) by [@yungsters](https://github.com/yungsters))
- **Animated:** Realign the shadow tree and the native tree when the user finishes interacting with the app. ([a8786fc1df](https://github.com/facebook/react-native/commit/a8786fc1df60426000013bdcfb3a61bd201b6dac) by [@cipolleschi](https://github.com/cipolleschi))
- **codegen:** Fix codegen failing in a pnpm monorepo because of missing `yargs` ([3e084bc159](https://github.com/facebook/react-native/commit/3e084bc15994cf5b549d1104e906e5dbb2df4417) by [@tido64](https://github.com/tido64))
- **c++:** Upstream fixes for build errors in React Native Windows ([c722ec7c37](https://github.com/facebook/react-native/commit/c722ec7c372c44ade8439f4765b1b6470c27f470) by [@chiaramooney](https://github.com/chiaramooney))
- **c++:** Undefined behavior fix in MethodInvoker ([09e88448ce](https://github.com/facebook/react-native/commit/09e88448ce3a3047112b6f71218305d5bfe2e8bc) by Riley Berton)
- **c++:** Fix "C4715 not all control paths return a value" warning in MSVC when building ReactCommon ([c30e35fb44](https://github.com/facebook/react-native/commit/c30e35fb44affb179c9a208cf0a3e4575347e76f) by [@jonthysell](https://github.com/jonthysell))
- **c++:** Updated comments for `~ShadowNodeWrapper()` and `~ShadowNodeListWrapper()` ([778fcecf35](https://github.com/facebook/react-native/commit/778fcecf357b92f8dd5bab07914aa8563796d0f7) by [@tomekzaw](https://github.com/tomekzaw))
- **c++:** Change RawPropsParser logs from ERROR level to WARNING ([68c0720e34](https://github.com/facebook/react-native/commit/68c0720e3438f9230f6dc28956c93b58ce1f2482) by Bowen Xie)
- **devtools:** Reconnecting to an unknown inspector page no longer results in a zombie connection ([a7adfef0bb](https://github.com/facebook/react-native/commit/a7adfef0bb3df03517935e446ea0c6b506f7ed90) by [@motiz88](https://github.com/motiz88))
- **devtools:** Avoid a zombie state when opening a second debugger frontend concurrently. ([e55ea2daf1](https://github.com/facebook/react-native/commit/e55ea2daf11bb527f500323e3f1bb71f10cbe1c5) by [@motiz88](https://github.com/motiz88))
- **devtools:** Inspector-proxy no longer accidentally detaches connected devices. ([4c6bff01b3](https://github.com/facebook/react-native/commit/4c6bff01b384d7d899dd9d3beef12b878918704e) by @motiz88)
- **devtools:** Throttle reload command ([42bad68220](https://github.com/facebook/react-native/commit/42bad68220d288ef2436609ee50ad993c239b362) by [@coado](https://github.com/coado))
- **devtools** Respond with status code `200` when successfully launching RNDT ([eeb6122f39](https://github.com/facebook/react-native/commit/eeb6122f390d355191182eaee6cf126468e7b4d4) by [@byCedric](https://github.com/byCedric))
- **error reporting:** Fix logbox reporting React errors as Warnings ([cbb313253f](https://github.com/facebook/react-native/commit/cbb313253fdf96c4fca06a24ed4cbd3f3df9db80) by [@rickhanlonii](https://github.com/rickhanlonii))
- **error reporting** Restore Metro log forwarding, change notice to signal future removal ([6047f9cc09](https://github.com/facebook/react-native/commit/6047f9cc09a7a86b79084a3ff1b4303c4583d2ce) by [@huntie](https://github.com/huntie))
- **flow:** Fix parsing of modern Flow syntax when `transformer.hermesParser = false` is configured in Metro config ([1387f521fd](https://github.com/facebook/react-native/commit/1387f521fdd8f187eab7a4a6a05d4d75a96b4f88) by [@huntie](https://github.com/huntie))
- **infra:** Removed noisy ENOENT error message upon launching the debugger ([5bbf5a4878](https://github.com/facebook/react-native/commit/5bbf5a4878fd3bab7b70f91e049bb6b986fd183b) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- **infra:** Ensure `--build-output` destination exists ([396bdd87d8](https://github.com/facebook/react-native/commit/396bdd87d8021902ad78b817314fdc5b6207c2ea) by [@szymonrybczak](https://github.com/szymonrybczak))
- **infra:** Fix Platform.constants.reactNativeVersion type ([95d9cdf228](https://github.com/facebook/react-native/commit/95d9cdf228e33d5651f41ebf5e14e80962fae118) by [@NickGerleman](https://github.com/NickGerleman))
- **js:** Fixes findNodeAtPoint when views were inverted ([1d1646afd1](https://github.com/facebook/react-native/commit/1d1646afd1ff4f068fc41d8b142b08d53e6cd91a) by [@zhongwuzw](https://github.com/zhongwuzw))
- **layout:** Fix handling 'auto' checks in absolute layout ([3596019489](https://github.com/facebook/react-native/commit/359601948923baf7304d223260be3926c5b81db0) by [@coado](https://github.com/coado))
- **runtime** Add missing methods to the WithRuntimeDecorator class. ([993f9fd8db](https://github.com/facebook/react-native/commit/993f9fd8db5fe4df495b3a3454273b0e11fef489) by [@neildhar](https://github.com/neildhar))
- **runtime:** Undo breaking change on ViewManagerDelegate.kt String params (ce1620616c by @cortinico)
- **runtime:** Undo breaking change on UIManager eventDispatcher accessor (55671c00e5 by @cortinico)
- **Scrollview:** Properly make ScrollView compatible with React 19 ([b395208303](https://github.com/facebook/react-native/commit/b39520830341cae8c3785250cbaf2ec99958ba69) by [@cipolleschi](https://github.com/cipolleschi))
- **Scrollview:** Make ScrollView compatible with React 19 ([8041e410e3](https://github.com/facebook/react-native/commit/8041e410e3b8ea135dc5f08daddd5ceface24439) by [@cipolleschi](https://github.com/cipolleschi))
- **SectionList:** Loosen SectionList `renderItem` required return type ([12b64b7824](https://github.com/facebook/react-native/commit/12b64b78247f2db929c6d421262bdec1f6402e0b) by [@NickGerleman](https://github.com/NickGerleman))
- **style:** Fixed `alignItems: 'baseline'` not working correctly on the new architecture ([2932c0f71f](https://github.com/facebook/react-native/commit/2932c0f71f1882607d9e579e5c09db28e131a4c9) by [@j-piasecki](https://github.com/j-piasecki))
- **style:** Linear gradient color stop spec. ([1a49892d57](https://github.com/facebook/react-native/commit/1a49892d574e3b77a75df8cfc77307a7d5daab35) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **TextInput:** Fixed fontWeight number value error for text optimized ([2a230694c4](https://github.com/facebook/react-native/commit/2a230694c421bf338699506a0044c26fd4c1eb55) by [@meetdhanani17](https://github.com/meetdhanani17))
- **typescript:** Allow read only array type for transform property ([c16defaff2](https://github.com/facebook/react-native/commit/c16defaff2964a2b30656def35eb3450cff9cd71) by [@tjzel](https://github.com/tjzel))
- **typescript:** Add missing `submitBehavior` prop and mark `blurOnSubmit` prop as deprecated in Typescript declaration file of `TextInput` ([1dcbf41725](https://github.com/facebook/react-native/commit/1dcbf41725a7296c0a0f33c4e0cc3a11e8780889) by [@thisisgit](https://github.com/thisisgit))

#### Android specific

- **Animated:** Fix scheduled animated operations not being executed in some cases ([dc8c8ebc5b](https://github.com/facebook/react-native/commit/dc8c8ebc5b7b6315b3c8e79028a80611a796ea7e) by [@j-piasecki](https://github.com/j-piasecki))
- **Animated** Sync the Shadow Tree and the Native Tree with Native animation when scroll is driving the animation ([394aae1c1c](https://github.com/facebook/react-native/commit/394aae1c1cc354eaefb762455e2bbeeec0503038) by [@cipolleschi](https://github.com/cipolleschi))
- **Appearance:** Ensure Appearance change listener does not skip events ([7041ed28f0](https://github.com/facebook/react-native/commit/7041ed28f092e7c6c1dac35f0ce6af095cd9a072) by [@vonovak](https://github.com/vonovak))
- **DevMenu:** Add missing Android implementation for DevMenu Module ([1bdae07d89](https://github.com/facebook/react-native/commit/1bdae07d89fdda486d3f9dbcc4aa5cbb026fc8b6) by [@cortinico](https://github.com/cortinico))
- **devtools** Fix issue with `NativeDevSettings.setIsDebuggingRemotely` where the app would keep on restarting if remote debugging was invoked from an action / component that was called on app start. ([beebf4a0a3](https://github.com/facebook/react-native/commit/beebf4a0a36c4ee9dc52631afdf2b25745a1b0f2) by [@Sushant-Sardeshpande](https://github.com/Sushant-Sardeshpande))
- **Image** Make Imagesource `open` for inheritance ([0e805a953d](https://github.com/facebook/react-native/commit/0e805a953d8c2e91790a2f9fa2da7850478231b7) by [@cortinico](https://github.com/cortinico))
- **Image** Fix ReactImageView.hasOverlappingRendering() ([2bed2ab1a6](https://github.com/facebook/react-native/commit/2bed2ab1a658230cb6fa23fdcb4e5a962f496e18) by [@NickGerleman](https://github.com/NickGerleman))
- **infra:** Expose `react_timing` headers in `reactnative` prefab ([b1d42c8ef2](https://github.com/facebook/react-native/commit/b1d42c8ef2eb54af48ad27d3dc121e15c07d3dba) by [@tomekzaw](https://github.com/tomekzaw))
- **infra:** RNGP - Sanitize the output of the config command ([d7884a6bb8](https://github.com/facebook/react-native/commit/d7884a6bb8f2d8fd08dfd7d2817a4fc25f61a57c) by [@cortinico](https://github.com/cortinico))
- **infra** Fix NPE in FileReaderModule ([fd4531fe23](https://github.com/facebook/react-native/commit/fd4531fe234149f4f078a1e73ec68145f9da20b3) by [@cortinico](https://github.com/cortinico))
- **infra** Properly set `REACTNATIVE_MERGED_SO` for autolinked libraries ([c005609b01](https://github.com/facebook/react-native/commit/c005609b0155223f3ae778c5cd96bc78c4dfe399) by [@cortinico](https://github.com/cortinico))
- **logging** Fix LogModule to create view when show is called ([0847384a45](https://github.com/facebook/react-native/commit/0847384a4598d9bbc8987788047bc58d7596881d) by [@fannnzhang](https://github.com/fannnzhang))
- **Modal**: Deprecating ModalHostShadowNode and ModalHostHelper classes ([77b3a8bdd6](https://github.com/facebook/react-native/commit/77b3a8bdd6164b4c2407e53cb0e27075c3ea7213) by [@alanleedev](https://github.com/alanleedev))
- **Modal** PointerEvents from Modal would not be dispatched correctly in new architecture. ([75114e3672](https://github.com/facebook/react-native/commit/75114e36726979625674b2c75a77ac330fccc4d6) by [@javache](https://github.com/javache))
- **networking** Fix uploading GIF URI ([48669af562](https://github.com/facebook/react-native/commit/48669af562d6d3ed7835816d60a2fb400a22a19b) by [@s77rt](https://github.com/s77rt))
- **RedBox:** RedBox content overlapping with system bars on Android 15 forced edge-to-edge ([97b661c3f0](https://github.com/facebook/react-native/commit/97b661c3f07ab0269b707b209139d5c1648d1e03) by [@alanleedev](https://github.com/alanleedev))
- **renderer** Fixed black strip coming when hiding status bar ([f6b6d001a0](https://github.com/facebook/react-native/commit/f6b6d001a0e0241a9d637cd5e532f0d8610d9ee1) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **renderer** Fix Android removeClippedSubviews in RTL ([ea6928fcb9](https://github.com/facebook/react-native/commit/ea6928fcb95c19e84f8f2851f28d0cd4343c6a26) by [@NickGerleman](https://github.com/NickGerleman))
- **runtime:** Fix Headless Crash `Tried to finish non-existent task with id` ([b4532adad4](https://github.com/facebook/react-native/commit/b4532adad4e38e1237631778f7b8c917a9ccf746) by [@RodolfoGS](https://github.com/RodolfoGS))
- **runtime** Optimize BaseViewManager#setTransform to ignore duplicate values ([3df0f3b9ff](https://github.com/facebook/react-native/commit/3df0f3b9ff4cc9cd6846ef02101baf8e9605d6a0) by [@javache](https://github.com/javache))
- **runtime** Make getUri and isResource open ([8c81ffa60a](https://github.com/facebook/react-native/commit/8c81ffa60a211e4ae7db50cd04de0e4a4c29df04) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **runtime** Do not destroy views when there is a touch going on for New Architecture ([6b7f68240e](https://github.com/facebook/react-native/commit/6b7f68240e08c64ced29ed3d7a1f95db96a6eef4) by [@cortinico](https://github.com/cortinico))
- **runtime** Annotate ReactRootView.createRootView with nullable ([6a1ecbb2bb](https://github.com/facebook/react-native/commit/6a1ecbb2bb3942e7487532262f2a4fc55f94fcad) by [@shwanton](https://github.com/shwanton))
- **runtime** Made several methods in ReactNativeHost.java thread-safe to avoid race conditions ([f9ac5b737a](https://github.com/facebook/react-native/commit/f9ac5b737a0e14c76f35840efcf348f1c7704363) by Jack Su)
- **runtime** Fixed Headless JS tasks in New Architecture ([9a1ae97c22](https://github.com/facebook/react-native/commit/9a1ae97c22868a312000f3ac50dacf9a8125d273) by [@robik](https://github.com/robik))
- **runtime** Fix default for `showsHorizontalScrollIndicator` and `showsVerticalScrollIndicator` ([3af01a8a44](https://github.com/facebook/react-native/commit/3af01a8a44853246d3deb957c4a1c65e43848bb5) by [@NickGerleman](https://github.com/NickGerleman))
- **runtime:** Adds a null check in react context getter ([aeb020dfa3](https://github.com/facebook/react-native/commit/aeb020dfa34d06b63fa0151be302287d0a3fb84f) by Peter Abbondanzo)
- **runtime** Fix ReactFragment on New Architecture ([52322fbd0e](https://github.com/facebook/react-native/commit/52322fbd0e641726b224b2b9b89d99d93dbc6e33) by [@cortinico](https://github.com/cortinico))
- **style** Don't use mGapBetweenPaths if not drawing a border ([8501b6396b](https://github.com/facebook/react-native/commit/8501b6396b0a4fd7a9bd2add2b3c8b9c755c27ae) by [@knappam](https://github.com/knappam))
- **style** Linear gradient border styles ([20e3f4518f](https://github.com/facebook/react-native/commit/20e3f4518feac70e8ac9b1cc4fc1cbb029df96e4) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **style** Gracefully handle unexpected overflow values ([82094dd9e3](https://github.com/facebook/react-native/commit/82094dd9e33d94f65fd2548f5b04a19fb89bad0f) by [@NickGerleman](https://github.com/NickGerleman))
- **style** Fix "setTranslucentBackgroundDrawable()" deprecation version ([35d9a18b81](https://github.com/facebook/react-native/commit/35d9a18b81ff9448459c9fb033f4fea1fa17dab3) by [@NickGerleman](https://github.com/NickGerleman))
- **style:** Add missing invalidate() to setOverflow() ([087193c98e](https://github.com/facebook/react-native/commit/087193c98ead8f12ec4f839dd077d5bd63075d6f) by [@NickGerleman](https://github.com/NickGerleman))
- **style:** Add borderStartWidth and borderEndWidth support ([92dca53702](https://github.com/facebook/react-native/commit/92dca5370239f2c9881455b683ff384e2187430f) by [@NickGerleman](https://github.com/NickGerleman))
- **style** Fixed text shadow rendering with artifacts when `backgroundColor` was set on the `TextInput` ([83716298f8](https://github.com/facebook/react-native/commit/83716298f8dd6a1f3128965225858b4c6d3b2477) by [@j-piasecki](https://github.com/j-piasecki))
- **Text** Fix measuring text with incorrect hyphenationFrequency ([fc8224036b](https://github.com/facebook/react-native/commit/fc8224036b4b5880c881f471e432ee5b47113b0b) by [@NickGerleman](https://github.com/NickGerleman))
- **TextInput:** fixed select text on auto focus for TextInput ([18d6028ff9](https://github.com/facebook/react-native/commit/18d6028ff908eef99aae363d8ee9a6789d264284) by [@kunalchavhan](https://github.com/kunalchavhan))
- **TextInput** TextInput's `contextMenuHidden` prop bug fix ([8a3ffb6d23](https://github.com/facebook/react-native/commit/8a3ffb6d23f169752891eddc7dad9e34cb2d861c) by [@alanleedev](https://github.com/alanleedev))

#### iOS specific

- **devtools** Fix position of RCTPerfMonitor in landscape mode & expanded mode ([258f41a30f](https://github.com/facebook/react-native/commit/258f41a30f5a797c0cfdb256a6824b7284dcc8e2) by [@krozniata](https://github.com/krozniata))
- **Appearance** Fixes Appearance user interface style when app run from background ([efa9711e35](https://github.com/facebook/react-native/commit/efa9711e35f528245cdfb6c7028129c97ae10192) by [@zhongwuzw](https://github.com/zhongwuzw))
- **c++** Fixes NSDataBigString length calculation ([bb3c51dc84](https://github.com/facebook/react-native/commit/bb3c51dc84e9514f55ca8a1e3abb1af140563c7b) by Tzvetan Mikov)
- **codegen** Codegen will start looking for codegen-enabled dependencies from the project root. ([46d17efa62](https://github.com/facebook/react-native/commit/46d17efa626cd546e839648e1a95f43a3802051c) by [@dmytrorykun](https://github.com/dmytrorykun))
- **Hermes**: Exclude dSYM from the archive ([7e14ec5177f](https://github.com/facebook/react-native/commit/7e14ec5177fd17ca9f1db384026b26ae90ab0b00) by [@cipolleschi](https://github.com/cipolleschi))
- **Image** Fixes race condition when setup image loader ([6b104bbe01](https://github.com/facebook/react-native/commit/6b104bbe015c93a40a73232fdb92a99e3799b7ac) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Image** Fixed crash in RCTImageUtils ([3572ef3f1b](https://github.com/facebook/react-native/commit/3572ef3f1b5b11c1ecfa21f0246cbba5941bbe0f) by [@pavelgurkovskiy](https://github.com/pavelgurkovskiy))
- **Image** Data race in `RCTImageLoader` related to assignment of cancellation block. ([0f051f6034](https://github.com/facebook/react-native/commit/0f051f603492f97a85e051f112d96180352bba77) by [@hakonk](https://github.com/hakonk))
- **Image** Fixes Image load event in new arch ([7698cd0953](https://github.com/facebook/react-native/commit/7698cd09536ebf99c3b56696a7bb75d714abfb18) by [@zhongwuzw](https://github.com/zhongwuzw))
- **infra** Add back the BUNDLE_COMMAND ([cf42288181](https://github.com/facebook/react-native/commit/cf422881819decccdd2b486fbb73f2192b9ec522) by [@Vin-Xi](https://github.com/Vin-Xi))
- **infra** Resolve Hermes prebuilt version based on react-native package ([b10ed0e19d](https://github.com/facebook/react-native/commit/b10ed0e19d8eec388305962667561e0cb95a3f25) by [@okwasniewski](https://github.com/okwasniewski))
- **infra** Support bundle install from outside the ios folder using --project-directory ([b22970e3cf](https://github.com/facebook/react-native/commit/b22970e3cfbe603bffea5b1c3bbf150887e3d7b8) by [@blakef](https://github.com/blakef))
- **infra** Use CONFIG_CMD if set ([774fe0cf6f](https://github.com/facebook/react-native/commit/774fe0cf6f22f832b756c166599973d9db6a93de) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- **infra** Fixes FORCE_BUNDLING error when bundle js ([089e8289ba](https://github.com/facebook/react-native/commit/089e8289ba6cba0821b76207a2dce316b1621c3d) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Modal** App crash happening when navigate to a new app screen with a displaying modal ([52888c0c1e](https://github.com/facebook/react-native/commit/52888c0c1e722a799f233c2f502e01b9dd4a7174) by Zhi Zhou)
- **Networking:** Fix: on iOS not getting 304 from `If-None-Match` request ([b8ab0fe703](https://github.com/facebook/react-native/commit/b8ab0fe703f1a0aca796bc15641d029a2036105f) by [@huzhanbo1996](https://github.com/huzhanbo1996))
- **Networking** Fix data race related to access on `RCTNetworkTask.status`. ([b1ec698dc4](https://github.com/facebook/react-native/commit/b1ec698dc4baf34ba2e31b7ad43dff97c229bf99) by [@hakonk](https://github.com/hakonk))
- **RedBox** Mac Catalyst crash in RCTRedBox ([84fe531952](https://github.com/facebook/react-native/commit/84fe531952d4b97c3cb0d84322abdf8953382ad6) by [@sbuggay](https://github.com/sbuggay))
- **RedBox** Fix rendering `RCTRedBoxExtraData` ([c9d589dab5](https://github.com/facebook/react-native/commit/c9d589dab5148cbd192078967f743d38b8048c6e) by [@krozniata](https://github.com/krozniata))
- **rendering:** Properly retain/release backgroundColor in RCTBorderDrawing ([47748c7935](https://github.com/facebook/react-native/commit/47748c7935540014abed03b4d2ff809b471c4fe3) by [@Saadnajmi](https://github.com/Saadnajmi))
- **RefreshControl:** Fixed an issue where the refresh control would not behave correctly if it was offscreen. ([a8be335a37](https://github.com/facebook/react-native/commit/a8be335a37eb792a7c6ccb7f577459020a2fc43c) by [@deepanshushuklad11](https://github.com/deepanshushuklad11))
- **RefreshControl:** Fix applying of tintColor and progressViewOffset props for RefreshControl component with New Architecture enabled ([19d468fed9](https://github.com/facebook/react-native/commit/19d468fed966f2adb973ad3f19a97a5ec0372e3a) by [@TuTejsy](https://github.com/TuTejsy))
- **RefreshControl:** Passed correct title and titleColor prop to updateTitle function ([5c7a166dca](https://github.com/facebook/react-native/commit/5c7a166dcaf5400fbc4c12d4c8b451228157c036) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **runtime** Fixed a crash when navigating away from a screen that contains a scrollView ([c6f32828b9](https://github.com/facebook/react-native/commit/c6f32828b9487381dab27f645aedcdbae9dcbc7e) by [@cipolleschi](https://github.com/cipolleschi))
- **runtime** Data race related to read/write on `ReactMarker::logTaggedMarkerImpl` ([7e41ea4c9d](https://github.com/facebook/react-native/commit/7e41ea4c9de943a5c73ca9821bf552d39aa49dcd) by [@hakonk](https://github.com/hakonk))
- **runtime** Fixes typo of  function callFunctionOnBufferedRumtimeExecutor ([4e12c2e37c](https://github.com/facebook/react-native/commit/4e12c2e37cb168f09f8768941cb915e4024a1c34) by [@zhongwuzw](https://github.com/zhongwuzw))
- **runtime** Fixes main thread stuck when reload in bridgeless mode ([a778979ed6](https://github.com/facebook/react-native/commit/a778979ed604d1dc7707faf4a3836e3deba136c6) by [@zhongwuzw](https://github.com/zhongwuzw))
- **runtime** Fixing maxLength check which was firing onChange multiple times ([d88dd14507](https://github.com/facebook/react-native/commit/d88dd145074ee84de0cc4207de02a3cd79c9ceff) by [@deepanshushuklad11](https://github.com/deepanshushuklad11))
- **runtime** Use std::atomic for eliminating races in RCTCxxBridge. ([8204134024](https://github.com/facebook/react-native/commit/8204134024e81947969bd8c2ba337dc931e54bd9) by [@hakonk](https://github.com/hakonk))
- **runtime** Fix legacy view interop apis not available in view method ([19cffab383](https://github.com/facebook/react-native/commit/19cffab3837c24f2e8470a31bbd8e8338d1c1b6c) by [@janicduplessis](https://github.com/janicduplessis))
- **ScrollView** Implement automicallyAdjustsKeyboardInsets for new arch ([e4e461c9cf](https://github.com/facebook/react-native/commit/e4e461c9cf969e1a1dfca6448ca6084b7f45ef7d) by [@okwasniewski](https://github.com/okwasniewski))
- **ScrollView** Implement automicallyAdjustsKeyboardInsets for new arch ([21bdce7286](https://github.com/facebook/react-native/commit/21bdce7286fc493b9601add3bf67d549b792d29b) by [@okwasniewski](https://github.com/okwasniewski))
- **StatusBarManager** Retrieve status bar size using RCTUIStatusBarManager ([34cd195d9f](https://github.com/facebook/react-native/commit/34cd195d9fbd075a161afbfac842f896355991e1) by [@okwasniewski](https://github.com/okwasniewski))
-  **style** fix: background color fix when border is dotted and dashed  ([b243d343fa](https://github.com/facebook/react-native/commit/b243d343fa741de94537d8535f76714ff2985101) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **style** Fixes ellipsis carries background from trimmed text ([9e2f8859c4](https://github.com/facebook/react-native/commit/9e2f8859c4d237ae2bee4679da45038405b7074e) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Text** Fixed baseline attachment position in multiline text ([9bfbf948df](https://github.com/facebook/react-native/commit/9bfbf948dfd23c891233e747cbaeeb6480f5fa41) by [@j-piasecki](https://github.com/j-piasecki))
- **Text** Clean up RCTParagraphComponentView & RCTParagraphTextView ([9239ad1c6b](https://github.com/facebook/react-native/commit/9239ad1c6bac2c2400f940708d823d7b2c2457c4) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Text** Fixes Italic text not work ([9cfd9dd1c7](https://github.com/facebook/react-native/commit/9cfd9dd1c7f8c37c156f1a9ff812183f80d67926) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Text** Fixes ellipsis carries background from trimmed text ([fcb6cdc710](https://github.com/facebook/react-native/commit/fcb6cdc7108103527268aef42a77e530f9482668) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Text** Fixed text baseline being moved upwards in certain cases ([01f7ab814f](https://github.com/facebook/react-native/commit/01f7ab814f847eb3038efa7120d81e92e3ff4187) by [@j-piasecki](https://github.com/j-piasecki))
- **TextInput** Fixes TextInput crash when undo if text longer than maxLength ([9b9c780cc8](https://github.com/facebook/react-native/commit/9b9c780cc8b54e2c1cd61f9fac0554488f68dea8) by [@zhongwuzw](https://github.com/zhongwuzw))

### Security

- **infra:** Upgrade grpc/grpc-js from 1.7.0 to 1.10.9 (CVE-2024-37168) ([295626bc35](https://github.com/facebook/react-native/commit/295626bc35326cc68c127ff515dcbb8e9d7d44e3) by [@GijsWeterings](https://github.com/GijsWeterings))
- **infra:** Upgrade braces from 3.0.2 to 3.0.3 (CVE-2024-4068) ([d538879e08](https://github.com/facebook/react-native/commit/d538879e08360b8230410fc893a50489bad5cf60) by [@GijsWeterings](https://github.com/GijsWeterings))
- **infra:** Update ws from 7.5.1 to 7.5.10 (CVE-2024-37890) ([13f1b9e10f](https://github.com/facebook/react-native/commit/13f1b9e10f6045421808714f7e62aa17bfb3e891) by [@GijsWeterings](https://github.com/GijsWeterings))
- **infra:** Update ws from 6.2.2 to 6.2.3 (CVE-2024-37890) ([80cfacef78](https://github.com/facebook/react-native/commit/80cfacef78f34d3786d955084a8bf4d42ea37f1b) by [@GijsWeterings](https://github.com/GijsWeterings))

## v0.75.5

### Added

- **Hermes:** Implement more missing methods on WithRuntimeDecorator ([80f67ca03c](https://github.com/facebook/react-native/commit/80f67ca03c99c688e2a3127e9b3dddd02625848e) by [@neildhar](https://github.com/neildhar))


### Changed

#### Android specific

- **Deps:** Bump Kotlin to 1.9.25 to mitigate [#49115](https://github.com/facebook/react-native/issues/49115) ([25e76a2717](https://github.com/facebook/react-native/commit/25e76a271781b3ffe8002108d8b12aa3d47442b5) by [@riteshshukla04](https://github.com/riteshshukla04))

#### iOS specific

- **Deps:** Pin Xcodeproj to < 1.26.0 ([2922af2e7e](https://github.com/facebook/react-native/commit/2922af2e7e8527a93c7956b10ddb314f25c334fa) by [@cipolleschi](https://github.com/cipolleschi))
- **Deps:** Pin concurrent-ruby to <= 1.3.4 ([794bf34e60](https://github.com/facebook/react-native/commit/794bf34e60cea8146aebad1fefe051d4140fc28b) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- **FormData:** fix: FormData filename in content-disposition ([78ef1e2bc2](https://github.com/facebook/react-native/commit/78ef1e2bc2ed30321745e2505713915b9015d920) by [@foyarash](https://github.com/@foyarash))


#### Android specific

- **TextInput:** Set TextInput selection correctly when attached to window in Android ([1656394bae](https://github.com/facebook/react-native/commit/1656394bae16cc54fb38687d38bcbf85138c98a2) by [@QichenZhu](https://github.com/QichenZhu))

#### iOS specific

- **Animation:** Fabric: Fixes animations strict weak ordering sorted check failed ([ea0bc54115](https://github.com/facebook/react-native/commit/ea0bc541155700e0973d960c94d01918d6b28c6b) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Hermes** Exclude dSYM from the archive ([fdb2631b5e](https://github.com/facebook/react-native/commit/fdb2631b5ea27765663046b94f84956d30ebaaeb) by [@cipolleschi](https://github.com/cipolleschi))
- **Image** Fix images not displayed when extension is implicit ([b6ed0d351e](https://github.com/facebook/react-native/commit/b6ed0d351e246c431bdc88a6c3d154ba35220c25) by [@cipolleschi](https://github.com/cipolleschi))
- **Xcode:** Fix the generation of .xcode.env.local ([dbffbf72d7](https://github.com/facebook/react-native/commit/dbffbf72d7287e021e965b6639e455e8555bbf2e) by [@cipolleschi](https://github.com/cipolleschi))

## v0.75.4

### Fixed

#### Android specific

- Fix Headless Crash `Tried to finish non-existent task with id` ([56a282c44d](https://github.com/facebook/react-native/commit/56a282c44d1a3ee5114c2cba36b902bc9ae123b9) by [@RodolfoGS](https://github.com/RodolfoGS))
- TextInput's `contextMenuHidden` prop bug fix ([366f1d0df3](https://github.com/facebook/react-native/commit/366f1d0df302af860b1fa9ea5f0bd757f2dec7b3) by [@alanleedev](https://github.com/alanleedev))
- RNGP - Sanitize the output of the config command ([0265ea0577](https://github.com/facebook/react-native/commit/0265ea0577963cca582682c3fc8ee97f3ebef65e) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Convert `NSNull` to `nil` before checking `type` in `readAsDataURL` ([99ab845a5c](https://github.com/facebook/react-native/commit/99ab845a5cf0fe3463ff39b03373b95d4f5c0fac) by [@haileyok](https://github.com/haileyok))
- Add back the BUNDLE_COMMAND ([afd74ad89d](https://github.com/facebook/react-native/commit/afd74ad89de6e632eea776e6d2689e7381c4f78c) by [@Vin-Xi](https://github.com/Vin-Xi))
- Use CONFIG_CMD if set ([a4ec49cbe6](https://github.com/facebook/react-native/commit/a4ec49cbe6d0157417276731ba1608e482f3f10e) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- App crash happening when navigate to a new app screen with a displaying modal ([8ec672204d](https://github.com/facebook/react-native/commit/8ec672204d5dee2b967cac08adf03c082e36ad79) by [@zhouzh1](https://github.com/zhouzh1))

## v0.75.3

### Changed

- **Infra:** Remove resolution and add commander as devDependency for the monorepo ([cf7b9b9486](https://github.com/facebook/react-native/commit/cf7b9b9486069a8a3cf4443353603fcb2174d012) by [@cipolleschi](https://github.com/cipolleschi))
- **CLI:** Bump CLI to 14.1.0 ([6a08c38263](https://github.com/facebook/react-native/commit/6a08c38263a544d88157cc3a6b1ee44ed28f7db0) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- **TypeScript:** Allow readonly array type for transform property ([c16defaff2](https://github.com/facebook/react-native/commit/c16defaff2964a2b30656def35eb3450cff9cd71) by [@tjzel](https://github.com/tjzel))

#### Android specific

- **Autolinking:** Fix autolinking issues for Pure C++ TurboModules ([833c3a2cf5](https://github.com/facebook/react-native/commit/833c3a2cf5df6b65c6fe75577da2df7c5a085e8d) by [@hsjoberg](https://github.com/hsjoberg))
- **Renderer:** Don't use mGapBetweenPaths if not drawing a border ([8501b6396b](https://github.com/facebook/react-native/commit/8501b6396b0a4fd7a9bd2add2b3c8b9c755c27ae) by [@knappam](https://github.com/knappam))
- **Image:** Make getUri and isResource open ([8c81ffa60a](https://github.com/facebook/react-native/commit/8c81ffa60a211e4ae7db50cd04de0e4a4c29df04) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **RGNP:** Remove unnecessary dependency on `gradle-tooling-api-builders` - serviceOf failure ([1067798a7e](https://github.com/facebook/react-native/commit/1067798a7e9ad06f8a22c1749e582c42348a554d) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- **Infra:** Include x86_64 slice when building for visionOS simulator
 ([05dec917f2](https://github.com/facebook/react-native/commit/05dec917f2e5f8288c0d9f31bc50c10bd0c0eab3) by [@okwasniewski](https://github.com/okwasniewski))
- **Infra:** Support bundle install from outside the ios folder using --project-directory ([b22970e3cf](https://github.com/facebook/react-native/commit/b22970e3cfbe603bffea5b1c3bbf150887e3d7b8) by [@blakef](https://github.com/blakef))
- **Codegen:** Codegen will start looking for codegen-enabled dependencies from the project root. ([46d17efa62](https://github.com/facebook/react-native/commit/46d17efa626cd546e839648e1a95f43a3802051c) by [@dmytrorykun](https://github.com/dmytrorykun))

## v0.75.2

### Added

#### Android specific

- **runtime:** Add support for handling `com.facebook.react.bridge.Dynamic` as parameter for TurboModules ([45cd81706d](https://github.com/facebook/react-native/commit/45cd81706d2c9ef7b792a716298cefa92ca2773a) by [@cortinico](https://github.com/cortinico))

### Changed

#### Android specific

- **ReactRootView:** Replaced `mLastHeight` with `mVisibleViewArea.height()` since mLastHeight value is not getting updated. For `width` we are already using `mVisibleViewArea.width()` ([603eb94dd9](https://github.com/facebook/react-native/commit/603eb94dd934f11ff568a3bd814e310bcbf152e1) by [@shubhamguptadream11](https://github.com/shubhamguptadream11))
- **ImageSource:** `open` for inheritance ([02d9979c32](https://github.com/facebook/react-native/commit/02d9979c3298ff9c5c4490847f94242d7ef9ea3a) by [@cortinico](https://github.com/cortinico))

### Removed

#### iOS specific

- **RCTBaseTextInputView:** UIReturnKeyDefault ([26aff664c0](https://github.com/facebook/react-native/commit/26aff664c07f129e64e60b42aa0c7eeaa79a93c3) by [@elencho](https://github.com/elencho))

### Fixed

- **codegen:** scripts require `yargs` ([0979921850](https://github.com/facebook/react-native/commit/0979921850b33a8c1abdf9d256138b78a403133a) by [@tido64](https://github.com/tido64))

## v0.75.1

### Changed

- **hermes:** Bump Hermes version ([f202e80177](https://github.com/facebook/react-native/commit/f202e801776794ec30b2dc25fe87e52ec77c18ab) by [@cortinico](https://github.com/cortinico))

### Removed

#### Android specific

- **renderer:** Gate off % border radii on Android Paper ([bbd5b5e157](https://github.com/facebook/react-native/commit/bbd5b5e1574499478ab0bf3fe9d2a21b02b7fedd) by [@NickGerleman](https://github.com/NickGerleman))
- **renderer:** Gate off % translate on Android Paper ([0273123dde](https://github.com/facebook/react-native/commit/0273123dde04de72da4ebfeff26b0830eea00745) by [@NickGerleman](https://github.com/NickGerleman))

## v0.75.0

### Breaking

- **codegen:** Use hasteModuleName for C++ Turbo Module enums ([b7fc5867f2](https://github.com/facebook/react-native/commit/b7fc5867f2f8248db8230ce3602077547ca971a1) by [@christophpurrer](https://github.com/christophpurrer))
- **codegen:** Use hasteModuleName for C++ Turbo Module structs ([07261d0408](https://github.com/facebook/react-native/commit/07261d0408e0250738504914ed931e71b838450e) by [@christophpurrer](https://github.com/christophpurrer))
- **codegen:** Don't support 'float' enums in Turbo Modules ([536edf3726](https://github.com/facebook/react-native/commit/536edf3726c7de161bca5075110eaad0bd58c08e) by @christophpurrer)
- **codegen:** Native modules using the codegen now throw an error when called with `null` for optional but not nullable arguments. ([67b9628af5](https://github.com/facebook/react-native/commit/67b9628af588e8fc778d732fc387dbd48acf705e) by [@rubennorte](https://github.com/rubennorte))
- **typescript:** Transform TouchableHighlight from JS `class` to `ForwardRef` component ([401f2fbb14](https://github.com/facebook/react-native/commit/401f2fbb14b1cfea93220810cce79b47720ecc72) by [@retyui](https://github.com/retyui))
- **typescript:** Transform `TouchableOpacity` from JS `class` to `ForwardRef` component ([3d00549399](https://github.com/facebook/react-native/commit/3d0054939929608d317dc1e75a21dd20b9930eda) by [@retyui](https://github.com/retyui))
- **eslint:** RN ESLint config no longer runs Prettier during ESLint ([727f30bd0b](https://github.com/facebook/react-native/commit/727f30bd0b27ff168e6a6556a9ffbc7e42dbb8f0) by [@gaearon](https://github.com/gaearon))
- **c++:** ScrollViewShadowNode.h - Make getContentOriginOffset to know info about if call-site want transform or not ([ce588db63f](https://github.com/facebook/react-native/commit/ce588db63fb6510b8c06b85a82008a72c778792d) by [@realsoelynn](https://github.com/realsoelynn))
- **c++:** RuntimeExecutor.h - Remove executeAsynchronously and executeSynchronously_CAN_DEADLOCK ([8b1a01610c](https://github.com/facebook/react-native/commit/8b1a01610c256beab43b093ced4f22eafbb943d9) by [@philIip](https://github.com/philIip))
- **c++:** JsErrorHandler.h - Rename JsErrorHandlingFunc to OnJsError ([2e3f2268dc](https://github.com/facebook/react-native/commit/2e3f2268dccff379cbf0c2767465c8d20c38fdc5) by [@RSNara](https://github.com/RSNara))
- **c++:** JsErrorHandler.h - Rename handleJsError to handleFatalError ([c041b9f40f](https://github.com/facebook/react-native/commit/c041b9f40f092d981fdfa01cd5dc3cbe6e874b5e) by [@RSNara](https://github.com/RSNara))
- **c++:** ReactPrimitives.h - Remove unused imports (folly/dynamic.h) ([4fd95b6e02](https://github.com/facebook/react-native/commit/4fd95b6e02c82386ad85cea51f118f8055e4eb50) by [@christophpurrer](https://github.com/christophpurrer))
- **c++:** LongLivedObjectCollection.h - Make `LongLivedObjectCollection::get` accept a Runtime reference as parameter. ([86a52cc2dc](https://github.com/facebook/react-native/commit/86a52cc2dc294131e138b1f6ee14b3e56e8c8572) by [@fabriziocucci](https://github.com/fabriziocucci))
- **c++:** LongLivedObject.h - Make `LongLivedObject` constructor accept a `Runtime` reference. ([3706bf077e](https://github.com/facebook/react-native/commit/3706bf077e62b82a8c15874ac1ee6f0a7497468d) by [@fabriziocucci](https://github.com/fabriziocucci))
- **c++:** Rename utils/jsi files ([d0cac87c6e](https://github.com/facebook/react-native/commit/d0cac87c6ea6caf528f0c164d4b43e3cfbb0b0b8) by [@TatianaKapos](https://github.com/TatianaKapos))
- **TextInput:** Remove deprecated onTextInput callback ([34a50ae8ef](https://github.com/facebook/react-native/commit/34a50ae8ef559f309117d5b6abe0b68b2b349fa4) by [@javache](https://github.com/javache))
- **Pressability:** Removed deprecated methods from Pressability. ([e4f3338069](https://github.com/facebook/react-native/commit/e4f3338069bfe70217a46239c468e4f12fa179fc) by [@javache](https://github.com/javache))
- **cli:** Remove the ram-bundle command. ([58b45e86a6](https://github.com/facebook/react-native/commit/58b45e86a6fd78409dc358e27ae736c95fee9f39) by [@blakef](https://github.com/blakef))

#### Android specific

- **ReactViewBackgroundDrawable:** Deprecate `ReactViewBackgroundDrawable` in favor of `CSSBackgroundDrawable` ([d7766fa927](https://github.com/facebook/react-native/commit/d7766fa9273ac47dc28935973b0402345b707885) by [@NickGerleman](https://github.com/NickGerleman))
- **ReactContext:** Make ReactApplicationContext and ReactContext abstract. Please instantiate BridgeReactContext instead (bridge mode). Or BridgelessReactContext instead (bridgeless mode). ([e69f6755c8](https://github.com/facebook/react-native/commit/e69f6755c8d73e412acc444fbb1d36cad472e1bc) by [@RSNara](https://github.com/RSNara))
- **layout:** Enable flex gap percentage value for RN. ([41a14962fc](https://github.com/facebook/react-native/commit/41a14962fc7adaf434f1634b17f3d66261e30a9f) by [@realsoelynn](https://github.com/realsoelynn))
- **layout:**: Set and require `android:supportsRtl="true"` for RTL layout ([82c6f8a580](https://github.com/facebook/react-native/commit/82c6f8a58056cfa163a61a4e6668a54625b15d06) by [@NickGerleman](https://github.com/NickGerleman))
- **turbomodule:** JSIModule - Deleting this class as you should be using `TurboModule` instead  ([73b4d67a78](https://github.com/facebook/react-native/commit/73b4d67a78e003d62c660cf3c710e01b29512c4a) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **runtime:** ReactHostImpl - Removing `ReactJsExceptionHandler` param from constructor and providing a default private implementation ([fe7e7a015f](https://github.com/facebook/react-native/commit/fe7e7a015f30697c4ccffb2ba6474611efb4c08a) by [@alanleedev](https://github.com/alanleedev))
- **DevSupport:** DevSupportManagerFactory - Method `.create()` changed to take an additional parameter of type `PausedInDebuggerOverlayManager` (nullable) ([1d26907ca4](https://github.com/facebook/react-native/commit/1d26907ca4d00cfa52f6395624b3121a7e96aca1) by [@motiz88](https://github.com/motiz88))
- **runtime:** OnLoad.cpp - Make the app responsible for returning core turbomodule if not using default app setup/template ([7facb32f30](https://github.com/facebook/react-native/commit/7facb32f30d17eb27f870dd531d3dc7ebe4532f6) by [@RSNara](https://github.com/RSNara))
- **measurement:** Delete UIManagerModule.measureLayoutRelativeToParent() ([958f8e2bb5](https://github.com/facebook/react-native/commit/958f8e2bb55ba3a2ace9507a48a582f546dd3ec2) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **PopUpMenu** UIManager.showPopupMenu() and UIManager.dismissPopupMenu() have been removed ([c631e93341](https://github.com/facebook/react-native/commit/c631e93341a33031f44087bc20c7e35e053d7d93) by [@alanleedev](https://github.com/alanleedev))
- **ReactContext:** Delete ReactContext.initializeWithInstance(). ReactContext now no longer contains legacy react instance methods. Please use BridgeReactInstance instead. ([fb23470483](https://github.com/facebook/react-native/commit/fb234704832513d655a2890458eec66f873a5674) by [@RSNara](https://github.com/RSNara)), ([05ef779c0b](https://github.com/facebook/react-native/commit/05ef779c0b1722ad3827f382f7d3de5d0391afb0) by [@fabriziocucci](https://github.com/fabriziocucci)), ([14fb1cc335](https://github.com/facebook/react-native/commit/14fb1cc335b900666ef4fe6cec6a23a7a95bcf76) by [@RSNara](https://github.com/RSNara)), and ([f99dc486cd](https://github.com/facebook/react-native/commit/f99dc486cdd742988320a8235c180ccecdcdd0d6) by [@RSNara](https://github.com/RSNara))
- **ReactContext** Remove getJavaScriptContextHolder() from BridgelessReactContext since now it can be accessed through BridgelessCatalystInstance in Bridgeless mode ([4595351310](https://github.com/facebook/react-native/commit/4595351310f353aad5a5f7af0fe2989650675cdc) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **ReactContext** Remove getRuntimeExecutor() from ReactContext since now it can be accessed through BridgelessCatalystInstance in Bridgeless mode ([f7b9aafd10](https://github.com/facebook/react-native/commit/f7b9aafd10a2f76c9bbdfdd1d925b4edf7a9dac3) by [@arushikesarwani94](https://github.com/arushikesarwani94))

#### iOS specific

- **runtime:** RCTHost.h - Remove `getSurfacePresenter` and `getModuleRegistry` ([f19371f28d](https://github.com/facebook/react-native/commit/f19371f28ddbb660ed08a3e38aef85f27f0876a7) by [@cipolleschi](https://github.com/cipolleschi))
- **Image:** Remove unused RCTImageLoadingPerfInstrumentationEnabled ([f6b9a42985](https://github.com/facebook/react-native/commit/f6b9a429853aa5fcb7895a144c77b538e9017c1e) by [@realsoelynn](https://github.com/realsoelynn))
- **Error Handling:** Remove `RCTRedBox` access through `RCTBridge` ([b5db214d2a](https://github.com/facebook/react-native/commit/b5db214d2a6cc6e2336edd423ceeaec06dd7b4fc) by [@realsoelynn](https://github.com/realsoelynn))
- **runtime** EventPriority - Remove EventPriority class and always use the default EventPriority::AsynchronousBatched. This is potentially a breaking change if something in OSS sets a different priority. If a build fails because of this, simply remove the use of EventPriority. ([55ed1c26ab](https://github.com/facebook/react-native/commit/55ed1c26ab7eda2a6ed1a7c41f3018b63fdd6a99) by [@sammy-SC](https://github.com/sammy-SC))
- **PushNotificationIOS:** RCTPushNotificationManager - Deleting deprecated didReceiveLocalNotification & didReceiveRemoteNotification callbacks ([7fffe692e7](https://github.com/facebook/react-native/commit/7fffe692e715004ac4fee6418dfe8a462e180b4b))
- **PushNotificationIOS:** PushNotificationIOS - Deleting deprecated alertAction and repeatInterval ([410e3b5ebd](https://github.com/facebook/react-native/commit/410e3b5ebd70fee7243c9c1d9d217cd912c01018))
- **PushNotificationIOS:** PushNotificationIOS - Deleting old push notification implementation ([916dde4c60](https://github.com/facebook/react-native/commit/916dde4c604b4bba0e510ee1ab5c0cf5bd19ecbe) by [@philIip](https://github.com/philIip))
- **cocoapods:** Rename BUILD_FROM_SOURCE to RCT_BUILD_HERMES_FROM_SOURCE ([6a1509f318](https://github.com/facebook/react-native/commit/6a1509f31858fad5aa1bdae4d6b0d10c5aebfaa4) by [@cipolleschi](https://github.com/cipolleschi))
- **cocoapods:** Rename React-Codegen to ReactCodegen ([6549216b76](https://github.com/facebook/react-native/commit/6549216b765b850a5751075ce270fcb78e76b778) by [@dmytrorykun](https://github.com/dmytrorykun))
- **TextInput:** Remove deprecated onTextInput callback ([24aece35b4](https://github.com/facebook/react-native/commit/24aece35b4a2bf196ad48900cdb8a3ca6ea53288) by [@Saadnajmi](https://github.com/Saadnajmi))

### Added

- **Image:** `Image.getSize/getSizeWithHeaders` method returns a promise if you don't pass a `success` callback ([2c1bcbac81](https://github.com/facebook/react-native/commit/2c1bcbac81dc4506196c000d72d52b7e9c1c1ec1) by [@retyui](https://github.com/retyui))
- **SectionList:** Fixes SectionList Unmounting issue with separatorComponent on data addition and removal. ([6204ea36d3](https://github.com/facebook/react-native/commit/6204ea36d321c9e27757d5f36ff7e74fa68c54d5) by [@Biki-das](https://github.com/Biki-das))
- **cli:** Move cli Android build into core ([62acc29896](https://github.com/facebook/react-native/commit/62acc29896b635c9e2d62d96c3d9533bb912b3a3) by [@blakef](https://github.com/blakef))
- **cli:** Move cli iOS build into core ([98f0893f39](https://github.com/facebook/react-native/commit/98f0893f392f33af3a6b4d20d8fcb25a4aac4a92) by [@blakef](https://github.com/blakef))
- **cli:** core-cli-utils now builds for Android ([89f16da89e](https://github.com/facebook/react-native/commit/89f16da89e5670f2c7fc21100c84607daa680336) by [@blakef](https://github.com/blakef))
- **codegen:** Add EventEmitter code-gen support for C++ Turbo Modules ([fd618819c7](https://github.com/facebook/react-native/commit/fd618819c7fd61422019ee1899980cb5ec4b5440) by [@christophpurrer](https://github.com/christophpurrer))
- **codegen:** Add function to only generate RNCore components ([9a27c08fb9](https://github.com/facebook/react-native/commit/9a27c08fb9c80eb4b65a8dc7bd96db09e301bf72) by [@cipolleschi](https://github.com/cipolleschi))
- **codegen:** Skip generation of RNCore if the files have been already generated ([03ba46f7e6](https://github.com/facebook/react-native/commit/03ba46f7e69d802530d43b5516da5f77def23fbd) by [@cipolleschi](https://github.com/cipolleschi))
- **debugger:** Add `ReactNativeApplication.[enable,metadataUpdated]` CDP messages for reading host metadata ([aced4072cf](https://github.com/facebook/react-native/commit/aced4072cfebb1c41a06a2a25179c4c0bd173fe0) by [@huntie](https://github.com/huntie))
- **debugger:** Inspector proxy: Add ping/pong keepalive to debugger connections. ([704756352c](https://github.com/facebook/react-native/commit/704756352c3228037063991385bdac2544322225) by [@robhogan](https://github.com/robhogan))
- **debugger:** Support opening React DevTools from both Chrome DevTools frontend (React Native DevTools) and `react-devtools` standalone app ([430dd0be26](https://github.com/facebook/react-native/commit/430dd0be26c44821b2bdc2e818a81ac8a0b4b970) by [@hoxyq](https://github.com/hoxyq))
- **runtime:** Add ReactRootViewTagGenerator ([7dec625eca](https://github.com/facebook/react-native/commit/7dec625ecabdc23cbae37e0034d29bb7bff17755) by [@christophpurrer](https://github.com/christophpurrer))
- **runtime:** Added missing `remove` methods for `Linking.addEventListener` and `AccessibilityInfo.addEventListener` Jest mocks ([2483c63017](https://github.com/facebook/react-native/commit/2483c63017b0d47c377bf67cb7c597e2d7e57897) by [@levibuzolic](https://github.com/levibuzolic))
- **runtime:** Implement `requestIdleCallback` and `cancelIdleCallback` in the new architecture ([abfadc6083](https://github.com/facebook/react-native/commit/abfadc60832b791892f81ae3f25dd8ac10ff7a99) by [@robik](https://github.com/robik))
- **style:** Added `AppRegistry.setRootViewStyleProvider` ([dbdd4da14f](https://github.com/facebook/react-native/commit/dbdd4da14f9baf5f533e1e0ae9b98fa0c644ec14) by [@acoates-ms](https://github.com/acoates-ms))
- **turbomodule:** Add EventEmitter C++ bridging type ([2a0a11256a](https://github.com/facebook/react-native/commit/2a0a11256a9919c70989aef00631da3a0f4afb25) by [@christophpurrer](https://github.com/christophpurrer))
- **turbomodule:** Turbo Module EventEmitters as functions ([42f136d00d](https://github.com/facebook/react-native/commit/42f136d00d0917bad8928839dea01e99bb0a1c98) by [@christophpurrer](https://github.com/christophpurrer))
- **typescript:** Add missing `Header` methods ([028615180b](https://github.com/facebook/react-native/commit/028615180b1fee8a4ab38a77163aa1fbfd68c6db) by [@retyui](https://github.com/retyui))
- **typescript:** Allow to pass empty string as style ([1ea269f42c](https://github.com/facebook/react-native/commit/1ea269f42c2ef10e95fcf4751e71fba8bb5fe80d) by [@retyui](https://github.com/retyui))

#### Android specific

- **Image:** Adds a new `Image` prop `resizeMultiplier` to help increase quality of small images on low DPI devices ([b6c3433537](https://github.com/facebook/react-native/commit/b6c343353765d8b13344841613250214fe8783db))
- **PopUpMenu:** Add (optional) onPopupDismiss() callback for PopupMenuAndroid ([bc3e3360d1](https://github.com/facebook/react-native/commit/bc3e3360d1bd3fde9ab4d28c49757e3db0dad7f9) by [@alanleedev](https://github.com/alanleedev))
- **StatusBar:** Added null checks, marked null safety in StatusBarModule ([7349dabae2](https://github.com/facebook/react-native/commit/7349dabae2eae35c8c24d544d7abf0d710ca26f8))
- **StatusBar:** Added suppression for deprecated getter/setter usage in StatusBarModule ([ac51deeaf4](https://github.com/facebook/react-native/commit/ac51deeaf43723927d5000bee30d7f0b7a16575e))
- **c++:** Allow bridgeless apps to register cxx modules via cxxreactpackages ([b9e52f0807](https://github.com/facebook/react-native/commit/b9e52f08073150f702b12dc5e38929e9651b806e) by [@RSNara](https://github.com/RSNara))
- **c++:** Introduce CallInvokerHolder stable API ([69bb4fca44](https://github.com/facebook/react-native/commit/69bb4fca44c4a6c094b6c4c5c03a7e9aefa7ed1f) by [@philIip](https://github.com/philIip))
- **colors** Update ColorPropConverter to support color function values ([4fb5573796](https://github.com/facebook/react-native/commit/4fb5573796e33868aefe4ebdcb8250e171af4989) by [@ryanlntn](https://github.com/ryanlntn))
- **colors:** Add isWideColorGamutEnabled to ReactActivityDelegate ([0a9891a2f2](https://github.com/facebook/react-native/commit/0a9891a2f2bf8c18e00d7a9c0f299a4161417466) by [@ryanlntn](https://github.com/ryanlntn))
- **colors:** Extend Property Processor to support long props ([0a80270187](https://github.com/facebook/react-native/commit/0a80270187c05fe2da1f25fb8a8426fd4f03f8f2) by [@cipolleschi](https://github.com/cipolleschi))
- **colors:** Update ColorPropConverter to support color function values ([fa7dbd578d](https://github.com/facebook/react-native/commit/fa7dbd578d6e0bd394591b30671aa0ff9bddf40c) by [@ryanlntn](https://github.com/ryanlntn))
- **colors:** Update bridge to handle long values ([0dc5c5f1f4](https://github.com/facebook/react-native/commit/0dc5c5f1f43701f396d2eb49bbabd2bfd2338cf4) by [@ryanlntn](https://github.com/ryanlntn))
- **error handling**: Option to set a custom JSExceptionHandler instance ([098454d425](https://github.com/facebook/react-native/commit/098454d4250127a8b6dea8d8b36b2754953ed118))
- **gradle:** Expose prefabs for newly added targets ([c16761da83](https://github.com/facebook/react-native/commit/c16761da833f7081e9378349e7f29cefbfe36d4f) by [@WoLewicki](https://github.com/WoLewicki))
- **layout** Percentage support in translate ([c13790ff1d](https://github.com/facebook/react-native/commit/c13790ff1d11ef95ad04f7d7dc87f09a9cbf7025) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **layout:** Added support for using percentages when defining border radius related properties. ([181ed33ab0](https://github.com/facebook/react-native/commit/181ed33ab0ae3a67c5bcb73de315fb6d5e697388) by [@jorge-cab](https://github.com/jorge-cab))
- **runtime:** Add 64 bit integer (long) value support to MapBuffer ([57ed0fb309](https://github.com/facebook/react-native/commit/57ed0fb30931979742634a1faa9a4d3b5261e50d) by [@ryanlntn](https://github.com/ryanlntn))
- **runtime:** Add the `ReactMarkerConstants.CONTENT_APPEARED` support on Android in bridgeless mode. ([5da9fdf8f1](https://github.com/facebook/react-native/commit/5da9fdf8f1780d8e491f46ce721861dd4e41992b) by [@Kudo](https://github.com/Kudo))
- **runtime:** Added `onUserLeaveHint` support into `ReactActivityDelegate` ([3cf6c64a80](https://github.com/facebook/react-native/commit/3cf6c64a800f96e398ad928d32de21d9e0dfe915) by [@behenate](https://github.com/behenate))
- **runtime:** Added `onUserLeaveHint` support into `ReactActivityDelegate` ([6450d08187](https://github.com/facebook/react-native/commit/6450d08187952c157b5998e7bdc08f4b17f73281) by [@behenate](https://github.com/behenate))
- **runtime:** Added featureflag to avoid additional background threads during execution ([4324f08749](https://github.com/facebook/react-native/commit/4324f08749433cc175f85246791bf8946b6ef04a) by [@javache](https://github.com/javache))
- **runtime:** Added getNativeModule(name) to ReactContext ([fdb2427a86](https://github.com/facebook/react-native/commit/fdb2427a863809b3637678f94105fed7eceef4f6) by [@javache](https://github.com/javache))
- **runtime:** GetJavaScriptContextHolder() supported in BridgelessReactContext since it's supported in ReactContext[Bridge] ([dfa6519749](https://github.com/facebook/react-native/commit/dfa65197491cb3ddfaaeca68d6c47a5bfb93eb83) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **runtime:** Introduce BridgeReactContext ([6386988de1](https://github.com/facebook/react-native/commit/6386988de1a55d082ffc8162571398ca8e3bafd5) by [@RSNara](https://github.com/RSNara))
- **runtime:** Introduced ReactContext.hasReactInstance() to replace .hasCatalystInstance() ([3a3f3e6232](https://github.com/facebook/react-native/commit/3a3f3e6232d6eec7d8863a910e1f76a1c6003ccb) by [@RSNara](https://github.com/RSNara))
- **turbomodule:** Add BindingsInstaller for TurboModules ([d999e9bf1e](https://github.com/facebook/react-native/commit/d999e9bf1ee6cad513be38c4f2c795ab58f59aa4) by [@Kudo](https://github.com/Kudo))

#### iOS specific

- **Modal:** RCTConvert to support UIModalPresentationStyle ([2d547a3252](https://github.com/facebook/react-native/commit/2d547a3252b328251e49dabfeec85f8d46c85411) by [@vonovak](https://github.com/vonovak))
- **TextInput:** Add all supported ReturnKeyTypes ([ed9978b8de](https://github.com/facebook/react-native/commit/ed9978b8de307d11def9190a461fc18b881800e0) by [@elencho](https://github.com/elencho))
- **bridgeless** Expose host delegate methods ([f500b47a95](https://github.com/facebook/react-native/commit/f500b47a957dea5e1ca2687965fb7a6a3fa64001) by [@zhongwuzw](https://github.com/zhongwuzw))
- **c++:** Introduce CallInvoker support in bridgeless native modules ([8f9ff89093](https://github.com/facebook/react-native/commit/8f9ff8909353b0e6782278c24bd0519c5506e51d) by [@philIip](https://github.com/philIip))
- **cocoapods:** Libraries can now declare Swift Package Manager dependencies in their .podspec with `ReactNativePodsUtils.spm_dependency` ([f903f34837](https://github.com/facebook/react-native/commit/f903f3483794f0e0e0b05ac24ab761344c319d6b) by [@mfazekas](https://github.com/mfazekas))
- **color:** Add basic DisplayP3 color support ([a40bd8e34a](https://github.com/facebook/react-native/commit/a40bd8e34a4de61e9f7690f808fe978fab1df11c) by [@ryanlntn](https://github.com/ryanlntn))
- **fonts:** Update font to handle system condensed variant ([86dffb3f15](https://github.com/facebook/react-native/commit/86dffb3f155dc9652f3abc32383643498b3a21b2) by [@shidoro](https://github.com/shidoro))
- **layout:** Added support for using percentages when defining border radius related properties. ([9c4ee6df08](https://github.com/facebook/react-native/commit/9c4ee6df087f9bc3024d893f1d87d54646661512) by [@jorge-cab](https://github.com/jorge-cab))
- **layout:** Percentage support in translate in new arch. ([f997b81288](https://github.com/facebook/react-native/commit/f997b81288148b4eee30b65375059feac2a14cd8) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **runtime:** Add Instruments signposts API for SystraceSection ([840c31c3a4](https://github.com/facebook/react-native/commit/840c31c3a42c006527561cb003670845f7c921d7) by [@lyahdav](https://github.com/lyahdav))
- **runtime::** Optimize RCTKeyWindow() for iOS 15+ ([b2fba371df](https://github.com/facebook/react-native/commit/b2fba371df0edafbb3323188004fc1f6d9ab1e8a) by [@okwasniewski](https://github.com/okwasniewski))
- **swift** Set SWIFT_ACTIVE_COMPILATION_CONDITIONS to DEBUG ([756f89aa59](https://github.com/facebook/react-native/commit/756f89aa59cba78cba39b22a338a3a48bcb38f1b) by [@okwasniewski](https://github.com/okwasniewski))
- **turbomodules** Add BindingsInstaller for TurboModules ([bed487e24b](https://github.com/facebook/react-native/commit/bed487e24b90a03b282b81cee5f7d2a203963d36) by [@Kudo](https://github.com/Kudo))
- **xros:** Prebuilt version of Hermes for visionOS ([924fb3de9b](https://github.com/facebook/react-native/commit/924fb3de9bc9328c3315316fbb796b933be5bcbe) by [@okwasniewski](https://github.com/okwasniewski))

### Changed

- **Animated:** Improved  performance of `Animated` components ([452373b5bf](https://github.com/facebook/react-native/commit/452373b5bf4469d42af722851035e5e9bc3acdb9) by [@yungsters](https://github.com/yungsters))
- **BlobModule:** Add info to invalid blob response error ([489df722b3](https://github.com/facebook/react-native/commit/489df722b3b9b4106d53d853d9ff6d0a3f177254))
- **BlobModule:** Trim invalid blob response error message ([30463fb007](https://github.com/facebook/react-native/commit/30463fb007966fbd8803508cda025bc62c490265))
- **Pressable:** Improve performance of `Pressable` component. ([cfa784c5ce](https://github.com/facebook/react-native/commit/cfa784c5cec060506d3d76e7819b50934f2c69be) by [@Zahoq](https://github.com/Zahoq))
- **ScrollView:** MaintainVisibleContentPosition property on ScrollView now selects the first partially visible view as the anchor, rather than the first fully visible view. ([252ef19c8d](https://github.com/facebook/react-native/commit/252ef19c8d5bc5392d900af21136b351723f3b3c))
- **StyleSheet** Optimized performance of `StyleSheet.compose` ([34331af9ce](https://github.com/facebook/react-native/commit/34331af9cea59595c903f2f95896037ab1b22b16) by [@yungsters](https://github.com/yungsters))
- **c++:** Allow invoking the AsyncCallback synchronously to allow for tight performance optimization. ([765e542c8d](https://github.com/facebook/react-native/commit/765e542c8d25401e1b8818ff3caec2796efb51b1) by [@nlutsenko](https://github.com/nlutsenko))
- **debugger:** Inspector proxy: Rewrite 127.0.0.1 to localhost in source map URLs for better IPv4->IPv6 tunnelling support. ([a52bd7dd08](https://github.com/facebook/react-native/commit/a52bd7dd080e1f0ad03209eecb69bda903470205) by [@robhogan](https://github.com/robhogan))
- **debugger:** Update Chrome launch flags for `--experimental-debugger` launch flow ([b1bb0bee41](https://github.com/facebook/react-native/commit/b1bb0bee411436587e02942d187c08938f68d114) by [@motiz88](https://github.com/motiz88))
- **deps:** Bumped @react-native-community/cli to 14.0.0
- **hermes**: Enable regenerator transform for hermes-canary ([a0237e96f1](https://github.com/facebook/react-native/commit/a0237e96f1f0b5908008c0435a4efea120e77ac4) by [@avp](https://github.com/avp))
- **hermes:** Disable Babel plugin for arrow functions for Hermes ([cdc3b9cdfc](https://github.com/facebook/react-native/commit/cdc3b9cdfc02eae3e76275b87b715c7669cc493f) by [@yungsters](https://github.com/yungsters))
- **jest**: Enables React global flag that causes Jest testing environment to require `act()` ([5a8327857b](https://github.com/facebook/react-native/commit/5a8327857bdd6c2c96e0455258cba12512ea5dc8) by [@yungsters](https://github.com/yungsters))
- **js:** Console polyfill now copies all properties from the existing `console` object ([949296571b](https://github.com/facebook/react-native/commit/949296571b36080d4ebe0bc8fac9ef3907367475) by [@motiz88](https://github.com/motiz88))
- **linter:** `no-string-refs` is now a lint error ([387250112e](https://github.com/facebook/react-native/commit/387250112e9ff5d98e4d4172a2f3696042aba857) by [@yungsters](https://github.com/yungsters))
- **react-dev-tools**: Upgrade[react-devtools-core]: ^5.3.1 ([2617ec5570](https://github.com/facebook/react-native/commit/2617ec55704d6aaa057fc20dc7e82235e1b3a799) by [@hoxyq](https://github.com/hoxyq))
- **react:** Upgrade to `react@18.3.1` ([abb7070a51](https://github.com/facebook/react-native/commit/abb7070a512133e225646be3a1392667c3f1c966) by [@yungsters](https://github.com/yungsters))
- **share** Update `Share.share()`'s argument types to be more explicit. ([8b53d41a88](https://github.com/facebook/react-native/commit/8b53d41a88c3c7c83183baa46be307102aa90d54))
- **template:** Moved the template from react-native into react-native-community/template ([07abfceae1](https://github.com/facebook/react-native/commit/07abfceae117edc8ed205fe1ebaef89ce3041386) by [@blakef](https://github.com/blakef))
- **testing**: `mockComponent` now also mocks `name` ([5062c5256e](https://github.com/facebook/react-native/commit/5062c5256e64c4db53ea7c7bfeae127715fef972) by [@yungsters](https://github.com/yungsters))
- **testing:** Allow moving SyncCallback for advanced use-cases ([43c55e98d4](https://github.com/facebook/react-native/commit/43c55e98d493d60f9a05fb4f96efd54d1ea3bce8) by [@javache](https://github.com/javache))
- **yoga**: Reduce warning level of distributed Yoga builds ([b696a7dc5e](https://github.com/facebook/react-native/commit/b696a7dc5e78dd42eb712e7c4b7d6f389526d933) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- **Alert:** Migrated `AlertFragment` dialog builder to use `androidx.appcompat` (1/2) ([297ded90aa](https://github.com/facebook/react-native/commit/297ded90aa1e905a37dba316e7b19b6779c8c804))
- **Alert:** Migrated `AlertFragment` dialog builder to use `androidx.appcompat` (2/2) ([600d3f6ff1](https://github.com/facebook/react-native/commit/600d3f6ff180de87fbe950c0e7558f11915e5966))
- **deps:** Bump Fresco to 3.2.0 to fix CVE-2018-14498 ([744024be7f](https://github.com/facebook/react-native/commit/744024be7f95970bdd786931bdf10dd50c515124) by [@cortinico](https://github.com/cortinico))
- **deps:** AGP to 8.5.0 ([19f6aec4a1](https://github.com/facebook/react-native/commit/19f6aec4a104f9b0dcfe3033e3c5cb6799338982) by [@cortinico](https://github.com/cortinico))
- **deps:** Kotlin to 1.9.24 ([3f3abf5b40](https://github.com/facebook/react-native/commit/3f3abf5b40e60b7b9c02ec4942fec1be3684acc6) by [@cortinico](https://github.com/cortinico))
- **DevSupport** Expose `openDebugger()` method on `DevSupportManager` ([b309af79e8](https://github.com/facebook/react-native/commit/b309af79e8bf2eb741db83b00359a73fe1b458a5) by [@motiz88](https://github.com/motiz88))
- **DevSupport** In bridgeless, `useDevSupport` now is configurable by ReactNativeHost. ([d195fd0c06](https://github.com/facebook/react-native/commit/d195fd0c0622e9d833dacf879c7da9f5b3c5fccd) by [@javache](https://github.com/javache))
- **DevSupport:** Decouple `DevInternalSettings` from `DevSupportManagerBase` ([52cec1e798](https://github.com/facebook/react-native/commit/52cec1e798c98ee948c34fad24a7b61d29e6ce2d) by [@Kudo](https://github.com/Kudo))
- **DevSupport:** Update constructor signature of `DevServerHelper` ([a1e8118541](https://github.com/facebook/react-native/commit/a1e81185416a53c7c7d0cfc67e40079fd0073e7c) by [@huntie](https://github.com/huntie))
- **gradle:** Expose `mapbufferjni` via prefab. ([c73e22142e](https://github.com/facebook/react-native/commit/c73e22142e9958fb406d5ca7d86228f938e5c8d5) by [@tomekzaw](https://github.com/tomekzaw))
- **runtime:** Changed the `handleRemoveView` function in `ReactViewGroup.java` to ignore calls for `Views` that are not children of this `ViewGroup` ([0d7a92b551](https://github.com/facebook/react-native/commit/0d7a92b551bb8bd91aeba73316cbaf7315362094) by [@bartlomiejbloniarz](https://github.com/bartlomiejbloniarz))
- **runtime:** Enforce Activities using ReactDelegate implement DefaultHardwareBackBtnHandler. ([a2d277f740](https://github.com/facebook/react-native/commit/a2d277f740d8ee95137d42679a1ffd872962a108) by [@javache](https://github.com/javache))
- **runtime:** Simplified ReactActivityDelegate to expose a single createRootView method. ([3283202248](https://github.com/facebook/react-native/commit/3283202248a36dbda553745afc46a3e3e2ab41a6) by [@javache](https://github.com/javache))
- **runtime:** Throwing IllegalArgumentException from ReactPackage is no longer suppressed ([2584bcb6c8](https://github.com/facebook/react-native/commit/2584bcb6c842b6a4fb7148dedc66f77c0f8210bb) by [@javache](https://github.com/javache))

#### iOS specific

- **Modal:** Move the snapshotting code before the dismissal. ([30d6251b78](https://github.com/facebook/react-native/commit/30d6251b7890118290c1f7f7a9df69423e15a406) by [@cipolleschi](https://github.com/cipolleschi))
- **Networking:** Fire `onprogress` event for `XMLHttpRequest` even when the `Content-Length` header is missing in the response headers ([457d14bd1b](https://github.com/facebook/react-native/commit/457d14bd1b85b0748b0824253753c6fee7ccc8bd))
- **RCTAppDelegate:** Improve reusability for RCTRootViewFactory ([23709f7c61](https://github.com/facebook/react-native/commit/23709f7c61caebebafa9b01264176cb95204ec42) by [@Kudo](https://github.com/Kudo))
- **RCTAppDelegate:** Support `customizeRootView` from `RCTRootViewFactory` ([8956869792](https://github.com/facebook/react-native/commit/89568697920230015f6146ac67a8fff87736d7dd) by [@Kudo](https://github.com/Kudo))
- **cocoapods:** Add `DEFINES_MODULE` for React-jsinspector.podspec ([4e6186555e](https://github.com/facebook/react-native/commit/4e6186555eac8e98724e5027a882c92ee195652d) by [@Kudo](https://github.com/Kudo))
- **ruby:** Update Gemfile in template ([06eea61c19](https://github.com/facebook/react-native/commit/06eea61c19cd730cf0c14a436f042d30791c3f4a) by [@matinzd](https://github.com/matinzd))
- **runtime:** Fallback to the first `foregroundInactive` window when there are no `foregroundActive` windows in RCTKeyWindow ([42ceacd281](https://github.com/facebook/react-native/commit/42ceacd281011ba8a6833d13a083208574bd85f2) by [@cipolleschi](https://github.com/cipolleschi))
- **runtime:** Move `notifyObservers` straight to `RCTEventDispatcher.mm`. ([f5c888c2d7](https://github.com/facebook/react-native/commit/f5c888c2d7c6dfe009de5df2cc795aff26286c19) by [@WoLewicki](https://github.com/WoLewicki))

### Deprecated

- **cli:** npx react-native init is deprecated and will log a warning until 0.76 ([47a3f52007](https://github.com/facebook/react-native/commit/47a3f5200708fc0247d8b403dbe447af636b79cb) by [@blakef](https://github.com/blakef))
- **runtime:** Deprecate RCTRuntimeExecutorModule ([7ea84bd3eb](https://github.com/facebook/react-native/commit/7ea84bd3eb228529e341f9fab5abf6ddda961db8) by [@philIip](https://github.com/philIip))

### Removed

- **Image:** Remove non-existent methods from `<ImageBackground/>` component ([09c903c439](https://github.com/facebook/react-native/commit/09c903c43922d83ddae1602751804c34b5aeff86) by [@retyui](https://github.com/retyui))
- **TextInput:** Remove viewconfigs for onTextInput callbacks ([910cde6134](https://github.com/facebook/react-native/commit/910cde6134d5c1f6886764ab27c1102584532795) by [@javache](https://github.com/javache))
- **debugger:** `launchId` query param for `/debugger-frontend` is no longer generated automatically for each `/open-debugger` call. Caller of `/open-debugger` is now responsible for generating the `launchId`, which will be passed along to `/debugger-frontend`. ([b7de916664](https://github.com/facebook/react-native/commit/b7de91666453b832b889d9577226097aeeace1a8) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- **dev-middleware:** `react-native/dev-middleware`: Remove non-standard `faviconUrl` field from CDP `/json` response ([df19e597e3](https://github.com/facebook/react-native/commit/df19e597e3e8be9c76f6dba885fd978095710f49) by [@huntie](https://github.com/huntie))
- **typescript:** Remove `tvParallaxProperties` prop from `TouchableOpacity` & add missing `focusable`, `rejectResponderTermination` props ([0a0cd6517f](https://github.com/facebook/react-native/commit/0a0cd6517fdd6fbcc751b4d9ae19106740b23703) by [@retyui](https://github.com/retyui))
- **android - Animated:** Removed `NativeAnimationsDebugModule` (already not Public API) ([95f7a5c597](https://github.com/facebook/react-native/commit/95f7a5c597eeb8db3a19777cac1ea14e58682cf0) by [@yungsters](https://github.com/yungsters))
- **ios - cocoapods: ** Delete deprecated Xcode version check ([2b85a236a1](https://github.com/facebook/react-native/commit/2b85a236a1121d86b3a99f0d9c6da0ae35817a8c) by [@naxey](https://github.com/naxey))

### Fixed

- **Animated:** Fix broken native animation in Paper ([92540a618d](https://github.com/facebook/react-native/commit/92540a618d336c747c0ebdfffdd1a2a0a82e636d) by [@sammy-SC](https://github.com/sammy-SC))
- **Animated:** Fix sequence restart failure ([a93a15aca3](https://github.com/facebook/react-native/commit/a93a15aca3e380f2f8158465b1b315ac3fab8307) by [@asyler](https://github.com/asyler))
- **Animated:** Fixed memoization for components wrapped with createAnimatedComponent ([be06fd4e22](https://github.com/facebook/react-native/commit/be06fd4e22a500128d202436600381b8bc17b3f5))
- **Button:** Adds forwardRef call to new functional component implementation of Button control. ([8e7263a415](https://github.com/facebook/react-native/commit/8e7263a415676d1fb08da027c9dc6ca9fc2b6573) by [@chiaramooney](https://github.com/chiaramooney))
- **FlatList:** Fix clicking items on the inverted FlatList on the new architecture ([3753b7a0e7](https://github.com/facebook/react-native/commit/3753b7a0e78f8820e5f5150dd9bdf1b53145a7bd) by [@kosmydel](https://github.com/kosmydel))
- **Networking** Fix fetch memory leak ([c647950e5e](https://github.com/facebook/react-native/commit/c647950e5e78f1bcd110111067b21daa44e4d464) by [@huzhanbo1996](https://github.com/huzhanbo1996))
- **TextInput** Handle `fontWeight` normalization for TextInput component ([15f27bc299](https://github.com/facebook/react-native/commit/15f27bc299a0d1e6a5dec81efb594f54039120a7) by [@NickGerleman](https://github.com/NickGerleman))
- **Touchable:** Fixed inconsistency in TouchableX component disabled / focusable behavior ([775713cef7](https://github.com/facebook/react-native/commit/775713cef7ff7b45a60c34e4f1629dc6cde1aa05) by [@rozele](https://github.com/rozele))
- **c++:** Avoid ShadowTreeRegistry::mutex_ read lock reentrancy ([1a164fae6a](https://github.com/facebook/react-native/commit/1a164fae6a27051d0a3fd9f7aa094c384c58d4c4) by [@rozele](https://github.com/rozele))
- **cli:** Allow proxying commands from react-native to react-native-community/cli with explicit warning ([9aed45a9d9](https://github.com/facebook/react-native/commit/9aed45a9d99218e7468ce2779dcbaa40cce50c83) by [@blakef](https://github.com/blakef))
- **cli:** Fix version checker not considering nightlies ([489d9f6c62](https://github.com/facebook/react-native/commit/489d9f6c624aa0b3e2607cd70e46adbb2ea7162d) by [@tido64](https://github.com/tido64))
- **codegen:** Align CodegenSchema.d.ts with CodegenSchema.js ([ea3a7143b9](https://github.com/facebook/react-native/commit/ea3a7143b9c8e886a6cf5ffd04386c3b19ef6b4a) by [@christophpurrer](https://github.com/christophpurrer))
- **codegen:** Don't break script phase and codegen when coreutils installed on macOS ([e0799536ef](https://github.com/facebook/react-native/commit/e0799536ef1b68b98fb772e256d1d72424349008) by [@blakef](https://github.com/blakef))
- **codegen:** Fixed `Props.h` created from codegen missing default initializers in C++ `struct` ([639d890dff](https://github.com/facebook/react-native/commit/639d890dff49af788fbe27c60b33f6025ec33cca) by [@alanleedev](https://github.com/alanleedev))
- **codegen:** Make sure that we can't include Codegen symbols multiple times ([46b6453eb6](https://github.com/facebook/react-native/commit/46b6453eb6fe5435a792aa4a0f9183446f4fa41f) by [@cipolleschi](https://github.com/cipolleschi))
- **codegen:** Fixed crash when passing fewer arguments than expected in native modules using codegen ([179b684e76](https://github.com/facebook/react-native/commit/179b684e7636361f7acd782cdf028c7c30b7b9fd) by [@rubennorte](https://github.com/rubennorte))
- **codegen:** Fixed crash when passing non-numeric values where RootTag is expected to methods in native modules using codegen ([abbc6eb022](https://github.com/facebook/react-native/commit/abbc6eb02251d8c510b3fb5415796a8f05388c98) by [@rubennorte](https://github.com/rubennorte))
- **codegen:** Fixes enum codegen value cases ([1a1795a537](https://github.com/facebook/react-native/commit/1a1795a537f3fdb8417149565c7bd4221af2b72e) by [@zhongwuzw](https://github.com/zhongwuzw))
- **debugger:** LogBox and Chrome DevTools stack frame collapsing patterns are now compatible with Windows file paths. ([8d0046a5e1](https://github.com/facebook/react-native/commit/8d0046a5e10ca27a073e5509ca70ffab15d2d3e9) by [@motiz88](https://github.com/motiz88))
- **debugger:** Debugger frontend socket-termination countdown now begins after the ping message is actually sent ([20462ca984](https://github.com/facebook/react-native/commit/20462ca984ae306d6ea829c381d91d4df1cb1cde) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- **debugger:** Fix breakpoints opening to incorrect location or disappearing from debugger frontend UI. ([ac714b1c33](https://github.com/facebook/react-native/commit/ac714b1c3300d3a169bdcfec05d556e18a7b83ff) by [@robhogan](https://github.com/robhogan))
- **debugger:** Inspector proxy: prevent errors proxying a device message from blocking the handler queue or spamming logs. ([e05319cc87](https://github.com/facebook/react-native/commit/e05319cc872c7d99c5ba33641a7791a3db2b3415) by [@robhogan](https://github.com/robhogan))
- **error handling:** Fixed LogBox not showing correctly on the New Architecture ([db1043dfbf](https://github.com/facebook/react-native/commit/db1043dfbf15b8d2e39eeb50b315384aa39e4606) by [@rubennorte](https://github.com/rubennorte))
- **error handling:** Remove accidental duplication in React warnings in Logbox ([32c3cd3e8a](https://github.com/facebook/react-native/commit/32c3cd3e8addb924f904de19c6e311a0ddb4e963) by [@gaearon](https://github.com/gaearon))
- **error handling:** Fix logbox reporting for React errors ([64e6721b23](https://github.com/facebook/react-native/commit/64e6721b23e9f3c35d42d5b1f1b68220e46a34ed) by [@yungsters](https://github.com/yungsters))
- **error handling:** Support component stacks without source info. ([1b53051b8c](https://github.com/facebook/react-native/commit/1b53051b8c0661095dbcb7546432eeda3a129fd4) by [@rickhanlonii](https://github.com/rickhanlonii))
- **error handling:** Support component stacks without source info. ([e9e668f0ec](https://github.com/facebook/react-native/commit/e9e668f0eca625248a95c53a506d33a4ec389f70) by [@rickhanlonii](https://github.com/rickhanlonii))
- **error handling:** Support hermes component stacks with missing source info. ([82db330360](https://github.com/facebook/react-native/commit/82db33036029c232cbaec7e58f2d84c873504732) by [@rickhanlonii](https://github.com/rickhanlonii))
- **infra:** Replace deprecated babel-plugin libraries to fix deprecation warnings on installation ([6213b2a62a](https://github.com/facebook/react-native/commit/6213b2a62a2366b150e0ac60aa8693baac2bb1d1) by [@kaganece](https://github.com/kaganece))
- **jest:** Fix jest setup for Image methods (resolveAssetSource, getSize, prefetch, queryCache) ([d53cc2b46d](https://github.com/facebook/react-native/commit/d53cc2b46dee5ed4d93ee76dea4aea9da42d0158))
- **layout:** Fix duplicate rotation operations ([54f582f651](https://github.com/facebook/react-native/commit/54f582f651c68e9fa6bedb5d1546f4e5a4a64704) by [@NickGerleman](https://github.com/NickGerleman))
- **layout:** Fixed padding not being applied to inline views in text ([12aef32b82](https://github.com/facebook/react-native/commit/12aef32b82325ab143b6ed421f3cbf0f8be66f60) by [@j-piasecki](https://github.com/j-piasecki))
- **layout:** Fixup margin: auto and justification behavior for overflowed containers ([f21d9afe0b](https://github.com/facebook/react-native/commit/f21d9afe0b0ddd97d89e89886d0d8e58739174ac) by [@NickGerleman](https://github.com/NickGerleman))
- **runtime:** Add `collapsableChildren` prop ([7b44c8d1d0](https://github.com/facebook/react-native/commit/7b44c8d1d0a089a766c7eab1b5435b2dbf61454c) by [@NickGerleman](https://github.com/NickGerleman))
- **runtime:** Add missing `NativeState` methods to the `WithRuntimeDecorator` class. ([218ea5d44c](https://github.com/facebook/react-native/commit/218ea5d44cae5774b1445cbc9e07d1ea3ef773d1) by [@bartlomiejbloniarz](https://github.com/bartlomiejbloniarz))
- **runtime:** Add option for multiple `mountingOverrideDelegates` ([358fe46969](https://github.com/facebook/react-native/commit/358fe46969654932e73af94127c05e6ce5ed7049) by [@WoLewicki](https://github.com/WoLewicki))
- **runtime:** Fixed prioritization of idle priority tasks, which were incorrectly scheduled as immediate priority ([0ca3ed87f3](https://github.com/facebook/react-native/commit/0ca3ed87f3424a333c815c9d57b17f133dd19eab) by [@rubennorte](https://github.com/rubennorte))
- **runtime:** New architecture timer methods now return integers instead of an opaque object. ([a16f7dc547](https://github.com/facebook/react-native/commit/a16f7dc547e85daed7e3732142f36cce5699faa0) by [@javache](https://github.com/javache))

#### Android specific

- **Animated:** Reduce maximum log spam from FrameBasedAnimationDriver ([42299499d8](https://github.com/facebook/react-native/commit/42299499d8cac0b3e6ae7814ca375005ecfa05f0))
- **DevMenu:** ShouldShowDevMenuOrReload() in RELEASE mode ([63043b79be](https://github.com/facebook/react-native/commit/63043b79be50b2589de96c63922b7909ca1f381f) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **DevSupport:** OnKeyLongPress() in RELEASE mode ([bdcc979bab](https://github.com/facebook/react-native/commit/bdcc979bab2cb300e540c031a7c54e05b2328410) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **Modal:** Fix a crash in Modal component ([d116837da2](https://github.com/facebook/react-native/commit/d116837da2734709f5f85dac1515d118b172bdcf) by [@sammy-SC](https://github.com/sammy-SC))
- **PointerEvents:** PointerEvents were not dispatching after a scroll event ([766ece7b9b](https://github.com/facebook/react-native/commit/766ece7b9b1a578d5b7acd99bc8b0055e862fa86) by [@javache](https://github.com/javache))
- **PointerEvents:** Views would still receive hover events when nested in a view with pointer-events: "none" ([38cbc082db](https://github.com/facebook/react-native/commit/38cbc082db92abdc00a73be0485999f406a05fe6) by [@javache](https://github.com/javache))
- **ReactDelegate:** Fixing exposing ReactDelegate through ReactActivity for reload() ([e25860f07c](https://github.com/facebook/react-native/commit/e25860f07c6af8d529d618da3ded556485ca0a73) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **ScrollView:** Add support for scrollEventThrottle for ScrollView on the New Architecture. ([4d2262b8d2](https://github.com/facebook/react-native/commit/4d2262b8d2b38eddbdfb2264a33f87c28aa7712f) by [@dmytrorykun](https://github.com/dmytrorykun))
- **ScrollView:** Fix maintainVisibleContentPosition during momentum scroll ([a9e6759bb5](https://github.com/facebook/react-native/commit/a9e6759bb5d8f08c444b7a324c4488b9e5f2ed1b) by [@janicduplessis](https://github.com/janicduplessis))
- **StatusBar:** Fixed StatusBar.currentHeight calculations to honor all cutout sizes ([0b8222a854](https://github.com/facebook/react-native/commit/0b8222a854a0f0e7808d596a57596f4dd98135f2))
- **StatusBar:** Fixed StatusBar.currentHeight calculations to honor all cutout sizes ([cc485ccf7d](https://github.com/facebook/react-native/commit/cc485ccf7dddbcbdcfb03457fd2a48569fab5820))
- **Text:** Fixed `adjustFontSizeToFit` when used without `numberOfLines` ([b236e154a1](https://github.com/facebook/react-native/commit/b236e154a1e29885258d325241fb94afb80a7f57) by [@j-piasecki](https://github.com/j-piasecki))
- **Text:** Fixed `adjustsFontSizeToFit`  not working on Android when using the new architecture ([747a96b7b3](https://github.com/facebook/react-native/commit/747a96b7b39fa53db353ef739560e27c6679d7fc) by [@j-piasecki](https://github.com/j-piasecki))
- **autolinking:** Fix autolink plugin for libraries that are platform-specific ([20521cc908](https://github.com/facebook/react-native/commit/20521cc908a347e3a2b3ac0fd6710946f18b1510) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- **autolinking:** Fix core autolinking not working on Windows ([c8cb3d4a59](https://github.com/facebook/react-native/commit/c8cb3d4a5904a5aab7fd41bedb032a919ef0758e) by [@cortinico](https://github.com/cortinico))
- **autolinking:** If `npx react-native-community/cli config` fails or timeouts proper error is shown and built is aborted, instead of leaving and empty autolinking.json ([3782511350](https://github.com/facebook/react-native/commit/3782511350c069425ad11cdefb8c6d3f10526fc2) by [@mfazekas](https://github.com/mfazekas))
- **error handling:** Android exceptions without a message would lead to unexpected crashes ([48f48f8e67](https://github.com/facebook/react-native/commit/48f48f8e6726103d1537193d52144cbce2402168) by [@javache](https://github.com/javache))
- **error handling:** Fixed android native rejections should be instanceof Error ([62cbdbbcc6](https://github.com/facebook/react-native/commit/62cbdbbcc60f9074e47416007aef81e0792d7c95) by [@huzhanbo1996](https://github.com/huzhanbo1996))
- **error handling:** Show RedBox after reloads fail (bridgeless) ([2f8d4f0c25](https://github.com/facebook/react-native/commit/2f8d4f0c253853ec4f56cf01b41a1f73a393f804) by [@RSNara](https://github.com/RSNara))
- **gradle:** Fixed build from source failing due to a missing file ([b2898540c9](https://github.com/facebook/react-native/commit/b2898540c9ba3616f7bb8f9d3d621be1fbba0d85) by [@j-piasecki](https://github.com/j-piasecki))
- **gradle:** Make `rrc_textinput` on Android a shared library ([ea8ad6457c](https://github.com/facebook/react-native/commit/ea8ad6457c0bb55d2a1150e7af6d0d20f3237006) by [@j-piasecki](https://github.com/j-piasecki))
- **kotlin:** Fix crash due to missing JvmStatic to `convertToCase` ([cef17ba14f](https://github.com/facebook/react-native/commit/cef17ba14f435b966d2ffd9b3660ccf28fe03b6c) by [@cortinico](https://github.com/cortinico))
- **kotlin:** Use `JvmStatic` annotations for all methods from `AndroidUnicodeUtils.kt` ([54dadd7bda](https://github.com/facebook/react-native/commit/54dadd7bda0431548760aab0fade57f083d716a8) by [@WoLewicki](https://github.com/WoLewicki))
- **layout** Propagate layout direction to Android Views and Drawables ([e16faca18c](https://github.com/facebook/react-native/commit/e16faca18c052a1c3b7ce6fb3b8236347b222e8a) by [@NickGerleman](https://github.com/NickGerleman))
- **layout:** Better overflow support for ScrollView, Text, TextInput ([bfb3b7008d](https://github.com/facebook/react-native/commit/bfb3b7008d3e83400154b0348e7ab680ee06aa8c) by [@NickGerleman](https://github.com/NickGerleman))
- **layout:** Fix cached spannable measurement path ([002396beae](https://github.com/facebook/react-native/commit/002396beae3c5d107b44968c1b1906040054e3da) by [@NickGerleman](https://github.com/NickGerleman))
- **layout:** Fixed `textAlign` not being taken into account when positioning views inlined in text ([1f08799560](https://github.com/facebook/react-native/commit/1f087995608fd016a8a3dd84c0ca88a9239d96b9) by [@j-piasecki](https://github.com/j-piasecki))
- **layout:** Resolved error "No virtual method setLeftTopRightBottom" ([08ecdee71c](https://github.com/facebook/react-native/commit/08ecdee71c9d5a4e385a585941ca93ae1002b01f) by [@mmmoussa](https://github.com/mmmoussa))
- **renderer:** Cascading renders were not mounting correctly when `batchRenderingUpdatesInEventLoop` is enabled. ([849da2146c](https://github.com/facebook/react-native/commit/849da2146ca27b7512f2f3ea0f8af8aa001e807a) by [@javache](https://github.com/javache))
- **runtime:** Fix ClassCastException in `ReactModalHostView` ([15ff82f811](https://github.com/facebook/react-native/commit/15ff82f811287f9a686d993af9ee80f891a7774f) by [@cortinico](https://github.com/cortinico))
- **runtime:** Fix a case when view preallocation or props forwarding on Android lead to dropped props update ([cf926a1329](https://github.com/facebook/react-native/commit/cf926a1329a8cd6921e9799877883ac1fbc26fbb) by [@sammy-SC](https://github.com/sammy-SC))
- **runtime:** Fix crash in `getChildAtWithSubviewClippingEnabled` ([d6a44e632a](https://github.com/facebook/react-native/commit/d6a44e632a7ffbd60b90dac410294947cd82f2d8) by [@javache](https://github.com/javache))
- **runtime:** Fix dynamic_cast (RTTI) for ShadowNodeWrapper when accessed by third-party libraries again ([ea958c69f6](https://github.com/facebook/react-native/commit/ea958c69f624be67c770384c203f86255c1eebec) by [@tomekzaw](https://github.com/tomekzaw))
- **runtime:** Fixed app reloading for `ReactActivity.getReactDelegate().reload()`. ([539922339b](https://github.com/facebook/react-native/commit/539922339b5ca1937ce3207038199a27566914fe) by [@Kudo](https://github.com/Kudo))
- **runtime:** Fixed error thrown during ReactInstance teardown ([e67d5560cf](https://github.com/facebook/react-native/commit/e67d5560cfd35f07ce74cfcc12555346a6f0e865) by [@javache](https://github.com/javache))
- **runtime:** Improved resiliency of reloads when bundle loading fails ([524e3eec3e](https://github.com/facebook/react-native/commit/524e3eec3e73f56746ace8bef569f36802a7a62e) by [@javache](https://github.com/javache))
- **runtime:** Local scheduler for thread-safe ([7dd91d3437](https://github.com/facebook/react-native/commit/7dd91d3437952cf19569efce30c823d14bdf6c9d) by [@Sunbreak](https://github.com/Sunbreak))
- **runtime:** Surfaces no longer leak activity once stopped ([af721084af](https://github.com/facebook/react-native/commit/af721084afd5ba530e47fb353e8e5b1c4d9f56b7))
- **runtime:** Tentative fix for NPE `JavaTimerManager$IdleCallbackRunnable.cancel` ([e686b4330d](https://github.com/facebook/react-native/commit/e686b4330d0a69fe78008b7eac86c54c9f96ee79) by [@cortinico](https://github.com/cortinico))
- **runtime:**: ViewManagers can pass context to their base class. ([90663081de](https://github.com/facebook/react-native/commit/90663081de872243203da99116d2cab0fbec95ff) by [@javache](https://github.com/javache))
- **runtime:** Unmount React root when activity is destroyed on Bridgeless ([33aa83a0e6](https://github.com/facebook/react-native/commit/33aa83a0e6f63d3d50d4803074ad9e2243439100) by [@fabriziocucci](https://github.com/fabriziocucci))
- **style:** Border-Radius percentages are now correctly resolved. ([082e29ed4e](https://github.com/facebook/react-native/commit/082e29ed4ecc40ed9dfeae6b1b94d5a33efddef0) by [@jorge-cab](https://github.com/jorge-cab))
- **style:** Fix borderRadius incorrect overrides ([8d5bbca1eb](https://github.com/facebook/react-native/commit/8d5bbca1eb8b91d0f678b557996a78c091976a53) by [@jorge-cab](https://github.com/jorge-cab))
- **turbomodule:** Cover SingletonMap when parsing events exported by module ([8a15e0d97a](https://github.com/facebook/react-native/commit/8a15e0d97ad7556b9f1b4068662791a32e1ae3d2) by [@WoLewicki](https://github.com/WoLewicki))

#### iOS specific


- **Animated:** Fixes animated frame timing ([690df7a556](https://github.com/facebook/react-native/commit/690df7a5561d93da27f69ff803bed453652ad51c) by [@zhongwuzw](https://github.com/zhongwuzw))
- **ContextMenu:** Hide AutoFill from context menu when using `contextMenuHidden` ([493dbb2190](https://github.com/facebook/react-native/commit/493dbb21907c71e2a220876eddd08a5ea075e1e8) by [@jakex7](https://github.com/jakex7))
- **DevMenu:** Fix RCTPerfMonitor not showing up in scene based app ([16775215d5](https://github.com/facebook/react-native/commit/16775215d5a734288da7147db348824395198407) by [@ouabing](https://github.com/ouabing))
- **InteropLayers:** Make sure to pass the RCTBridgeProxy to  ViewManagers ([d6c90cf7ed](https://github.com/facebook/react-native/commit/d6c90cf7ed80caf0fc4eb2541f3dcadc3833dd37) by [@cipolleschi](https://github.com/cipolleschi))
- **Networking:** Fixed headers content type check for iOS bundle download ([d9b0f15c84](https://github.com/facebook/react-native/commit/d9b0f15c844abce5e97edfd401656d84d0c84133) by [@jayshah123](https://github.com/jayshah123))
- **PullToRefresh:** Properly recycle the RCTPullToRefreshViewComponentView ([18f0a90358](https://github.com/facebook/react-native/commit/18f0a90358b4e7eb59871cc11a88ef9bef575246) by [@cipolleschi](https://github.com/cipolleschi))
- **RCTAppDelegate:** Added space to $(inherited) string to avoid creation of wrong cpp flags in RCTAppDelegate podspec ([be93092c1b](https://github.com/facebook/react-native/commit/be93092c1b8a079f74dcdc129afc3767f03b8a2e) by [@nikhiltekwani09](https://github.com/nikhiltekwani09))
- **RCTAppDelegate:** Add missing forward blocks to RCTRootViewFactory ([9d79f05e68](https://github.com/facebook/react-native/commit/9d79f05e68cd64bf8b213ff89a25726184ef387c) by [@okwasniewski](https://github.com/okwasniewski))
- **RCTAppDelegate:** Allow importing RCTAppDelegate in Swift ([7c953698b4](https://github.com/facebook/react-native/commit/7c953698b41af7187504fa56a9a7c943ae724cd0) by [@okwasniewski](https://github.com/okwasniewski))
- **RCTAppDelegate:** Allow usage of `RCTRootViewFactory` from Swift ([5aea518d88](https://github.com/facebook/react-native/commit/5aea518d880ff73c91b8e462b9aa40ac0d218538) by [@okwasniewski](https://github.com/okwasniewski))
- **RCTAppDelegate:** Fixed Method name in hint from customiseView to customizeRootView ([46d4b837a5](https://github.com/facebook/react-native/commit/46d4b837a581168507b569744cae459bd1f4a70c) by [@svengiebel](https://github.com/svengiebel))
- **RCTAppDelegate:** Fixes customizeRootView migration comment ([fbf9c4343a](https://github.com/facebook/react-native/commit/fbf9c4343ae922013b008a7d855c5927b7113e60) by [@zhongwuzw](https://github.com/zhongwuzw))
- **RCTAppDelegate:** Remove loadSourceForBridge in RCTRootViewFactory ([0c02b26c1e](https://github.com/facebook/react-native/commit/0c02b26c1e00ca27d7a3ba4244a0957d4cb473aa) by [@okwasniewski](https://github.com/okwasniewski))
- **SCrollView:** Preserve content offset in ScrollView when the component is suspended ([510d2906b2](https://github.com/facebook/react-native/commit/510d2906b21b8c4c063369d2c2cb391aad268fea) by [@sammy-SC](https://github.com/sammy-SC))
- **ScrollCiew:** Remove usage of deprecated scrollIndicatorInsets in RCTScrollView ([ce10ce4d98](https://github.com/facebook/react-native/commit/ce10ce4d98bc22351b9694ef0bb15ad696f3ba5f))
- **ScrollView:** Fixing scroll view breakage caused by #44789 ([f4b921c1d5](https://github.com/facebook/react-native/commit/f4b921c1d5a40c96ecce949db2fe0755c5b90f35))
- **Text:** Fixed font size enlarging when `adjustFontSizeToFit` is set ([ed7766cee9](https://github.com/facebook/react-native/commit/ed7766cee941e36af05b19a315b442edf738ef80) by [@j-piasecki](https://github.com/j-piasecki))
- **Text:** Fixed text highlighting in the New Architecture ([eadcebbb3e](https://github.com/facebook/react-native/commit/eadcebbb3efe1af70f3f7321617df9bc7fde0371))
- **TextInput:** Fix Multiline TextInput with a fixed height scrolls to the bottom when changing AttributedText ([f6badca2f9](https://github.com/facebook/react-native/commit/f6badca2f9a5f1e986dd76444bebde0d6049513d) by [@fabOnReact](https://github.com/fabOnReact))
- **Touchable:** Fixed stale state on TouchableOpacity and TouchableBounce ([00055f89a0](https://github.com/facebook/react-native/commit/00055f89a0ad636c2f15b4dc94047ce6cb4a7e0f) by [@sammy-SC](https://github.com/sammy-SC))
- **UIActivityIndicatorViewStyles:** Removed references to deprecated UIActivityIndicatorViewStyles ([a23ae9c7f2](https://github.com/facebook/react-native/commit/a23ae9c7f2031b25c431b1b9791beab6b5527def))
- **accessibility:** Fix the accessibility label not being applied to text components on the new architecture ([9922628032](https://github.com/facebook/react-native/commit/9922628032ace4d87257c1b3d70c2dc6c38a60a6) by [@j-piasecki](https://github.com/j-piasecki))
- **autolinking:** Auto linking script of script phase ([e320ab47cf](https://github.com/facebook/react-native/commit/e320ab47cf855f2e5de74ea448ec292cf0bbb29a))
- **cocoapods:** Exposes react_native_pods methods through autolinking.rb ([6b56fb0d0b](https://github.com/facebook/react-native/commit/6b56fb0d0b40728d0baef8566d754d7081363584) by [@blakef](https://github.com/blakef))
- **dark mode:** Fix dark mode on initial load. ([b957513cc6](https://github.com/facebook/react-native/commit/b957513cc65b66ab0288db3fba5ccf9232f7c1fc))
- **error handling:** Add missing call to `[super viewDidLoad]` in `RCTRedBox.mm`. ([d93788301c](https://github.com/facebook/react-native/commit/d93788301c1fafceba4c3e2ceb40cd4e49c6ae8d) by [@hakonk](https://github.com/hakonk))
- **layout:** Fix `InputAccessoryView` width on device orientation change ([8597727c28](https://github.com/facebook/react-native/commit/8597727c28d9cb77012f3f4ebb032c335246d589) by [@mauriciomeirelles](https://github.com/mauriciomeirelles))
- **objc:** Fixed missing header imports ([46f53e97f0](https://github.com/facebook/react-native/commit/46f53e97f0c193d1a92ac56d23b3bef40639dd09))
- **privacy manifest:** Fix error on handling privacy manifest ([c24929c5f4](https://github.com/facebook/react-native/commit/c24929c5f4c6f88878691b5f778922864bbd5683) by [@cxa](https://github.com/cxa))
- **privacy manifest:** Fix privacy aggregation ([00b366159d](https://github.com/facebook/react-native/commit/00b366159d760b705e86ea5f7fe5dbe53a1c5e72) by [@aleqsio](https://github.com/aleqsio))
- **privacy manifest:** Privacy Manifest aggregation failing due to missing nil check ([47b42dc845](https://github.com/facebook/react-native/commit/47b42dc84560aa66af4b7dcfa5886af66d175c3c) by [@swrobel](https://github.com/swrobel))
- **runtime:** Avoid calling abstract methods in RCTComposedViewRegistry ([9bdd777fd7](https://github.com/facebook/react-native/commit/9bdd777fd766ff9a0c59e7a2136279cd91a3916b) by [@cipolleschi](https://github.com/cipolleschi))
- **runtime:** Extract the constants from ViewManagers in the UI Thread if needed. ([94537c7beb](https://github.com/facebook/react-native/commit/94537c7bebe23f1c9a79c7a94383ed960ebf30f7) by [@cipolleschi](https://github.com/cipolleschi))
- **runtime:** Fixed `HermesExecutorFactory.h` build error when importing its private header ([2d46dbe6ce](https://github.com/facebook/react-native/commit/2d46dbe6ce962bbdcae5d91afe557b46b6b7cfe4) by [@Kudo](https://github.com/Kudo))
- **runtime:** Fixes NSDataBigString length calculation ([9d637e4622](https://github.com/facebook/react-native/commit/9d637e4622781568b143b8585909b73211a0f8ba) by [@zhongwuzw](https://github.com/zhongwuzw))
- **runtime:** Fixes race condition of m_batchHadNativeModuleOrTurboModuleCalls ([3f74f69cf0](https://github.com/facebook/react-native/commit/3f74f69cf00858cd18774837bf5afc3fccdfca86) by [@zhongwuzw](https://github.com/zhongwuzw))
- **runtime:** Implement shared atomic counters and replace static integers in `RCTImageLoader` and `RCTNetworkTask` that were accessed concurrently, which in some cases lead to data races. ([ffc16fc18b](https://github.com/facebook/react-native/commit/ffc16fc18bcc44d1e98d66dbbe56fb726962fb72) by [@hakonk](https://github.com/hakonk))
- **runtime:** Let RCTHost be initialized with a function to provide the `bundleURL` so that it can connect to metro on Reload when the url changes. ([8b8b85bb1f](https://github.com/facebook/react-native/commit/8b8b85bb1f55a8090360fec84ec4f56f372ede6b) by [@cipolleschi](https://github.com/cipolleschi))
- **runtime:** Missing `progress`  in `onProgress` native event arguments ([78ab5f4b83](https://github.com/facebook/react-native/commit/78ab5f4b836d64b71760754c7cce1315630640c7) by [@netmaxt3r](https://github.com/netmaxt3r))
- **style:** Fixed border being drawn over children when no color was set ([91c5a6d936](https://github.com/facebook/react-native/commit/91c5a6d9368b01172000763ba48e91eb1434e7d7) by [@j-piasecki](https://github.com/j-piasecki))
- **style:** Removed Legacy iOS 10 code messing with border radius ([9204e44ef5](https://github.com/facebook/react-native/commit/9204e44ef5038ed9190a7e5362a7ea3c0793b361) by [@jorge-cab](https://github.com/jorge-cab))
- **turbomodule:** Fixed race condition in native module invalidation. ([b7812a8b6c](https://github.com/facebook/react-native/commit/b7812a8b6c3afbeacaad94779cd010bcc5440785) by [@dmytrorykun](https://github.com/dmytrorykun))
- **xcode:** Do not use temporary node when creating the .xcode.env.local ([8408b8bc96](https://github.com/facebook/react-native/commit/8408b8bc96db15e265ca65fce7875ee65dcfdcec) by [@cipolleschi](https://github.com/cipolleschi))

## v0.74.7

### Fixed

#### Android specific

- Fix #41226 by suppressing path adjustment when not actually drawing a border ([8501b6396b](https://github.com/facebook/react-native/commit/8501b6396b0a4fd7a9bd2add2b3c8b9c755c27ae) by [@knappam](https://github.com/knappam))
- RGNP - Remove unnecessary dependency on `gradle-tooling-api-builders` - serviceOf failure ([b6bdecd309](https://github.com/facebook/react-native/commit/b6bdecd309bf74cfa80b71204d5266667cb3f843) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Fix iOS crash occurring when navigating to a new app screen with a displaying modal ([52888c0c1e](https://github.com/facebook/react-native/commit/52888c0c1e722a799f233c2f502e01b9dd4a7174) by Zhi Zhou)
- Fix ruby for CI ([1c80702e95](https://github.com/facebook/react-native/commit/1c80702e95a6bcf422f5448b4578d71e8e78071b) by [@cipolleschi](https://github.com/cipolleschi))
- Fixes animations strict weak ordering sorted check failed ([60889e170c](https://github.com/facebook/react-native/commit/60889e170ca3f6187e15719a3d85da0bc7e974ff) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.74.6

### Added

#### Android specific
- [0.74] Add support for handling `com.facebook.react.bridge.Dynamic` as parameter for TurboModules ([a9588f3718](https://github.com/facebook/react-native/commit/a9588f3718d682cf5b10db708b429885c2a06ee9) by [@cortinico](https://github.com/cortinico))

### Changed

- Bump hermes version ([4e737b0b16](https://github.com/facebook/react-native/commit/4e737b0b1649fcfed68529370f371bc2ae9319e3) by [@blakef](https://github.com/blakef))

### Fixed

- Fix(react-native): fix codegen failing in a pnpm monorepo setup ([a90a17a8b3](https://github.com/facebook/react-native/commit/a90a17a8b3f56c5f2aa84e06c48ccc19339b70eb) by [@tido64](https://github.com/tido64))

## v0.74.5

### Fixed

#### iOS specific

- Pass the right Apple system versions to Hermes ([10e9669ad1](https://github.com/facebook/react-native/commit/10e9669ad11141b155caa606638b4c6081fcf01c) by [@cipolleschi](https://github.com/cipolleschi))

#### Android specific

- Remove deprecated onTextInput callback ([5da40cbb1c](https://github.com/facebook/react-native/commit/5da40cbb1cab9637db477156c4501ecfcf1c3315) by [@javache](https://github.com/javache))


## v0.74.4

### Added

#### Android specific

- Stub com.facebook.react.settings on 0.74 ([13ea273850](https://github.com/facebook/react-native/commit/13ea2738508332785e6b0dd129a8cc6e66d7b3da) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Prebuilt version of Hermes for visionOS ([924fb3de9b](https://github.com/facebook/react-native/commit/924fb3de9bc9328c3315316fbb796b933be5bcbe) by [@okwasniewski](https://github.com/okwasniewski))

### Fixed

- Don't break script phase and codegen when coreutils installed on macOS ([e0799536ef](https://github.com/facebook/react-native/commit/e0799536ef1b68b98fb772e256d1d72424349008) by [@blakef](https://github.com/blakef))
- Remove setting of process.exitCode that breaks Jest tests ([e42932cfc6](https://github.com/facebook/react-native/commit/e42932cfc6dae7fb90fa29d123be4caed89deac0) by [@@douglowder](https://github.com/douglowder))

#### iOS specific

- Make sure to pass the RCTBridgeProxy to  ViewManagers ([d6c90cf7ed](https://github.com/facebook/react-native/commit/d6c90cf7ed80caf0fc4eb2541f3dcadc3833dd37) by [@cipolleschi](https://github.com/cipolleschi))
- Implement shared atomic counters and replace static integers in `RCTImageLoader` and `RCTNetworkTask` that were accessed concurrently, which in some cases lead to data races. ([ffc16fc18b](https://github.com/facebook/react-native/commit/ffc16fc18bcc44d1e98d66dbbe56fb726962fb72) by [@hakonk](https://github.com/hakonk))
- Do not use temporary node when creating the .xcode.env.local ([8408b8bc96](https://github.com/facebook/react-native/commit/8408b8bc96db15e265ca65fce7875ee65dcfdcec) by [@cipolleschi](https://github.com/cipolleschi))
- Building of iOS project when RCTAppDelegate is used in the project ([be93092c1b](https://github.com/facebook/react-native/commit/be93092c1b8a079f74dcdc129afc3767f03b8a2e) by [@nikhiltekwani09](https://github.com/nikhiltekwani09))
- Fix error on handling privacy manifest ([e39e9c4a60](https://github.com/facebook/react-native/commit/e39e9c4a60a54d3280d8516d5891cec05d5ab793) by [@cxa](https://github.com/cxa))

## v0.74.3

### Added

- Add the ReactMarkerConstants.CONTENT_APPEARED support on Android in bridgeless mode. ([3c4d7618f0](https://github.com/facebook/react-native/commit/3c4d7618f00751b08f73ffcec9ef1f69d44136da) by [@Kudo](https://github.com/Kudo))

### Changed

- Feat: update CLI to 13.6.9 ([d1e2a35061](https://github.com/facebook/react-native/commit/d1e2a3506152abde9b870b1a63f16d00ec277ea6) by [@szymonrybczak](https://github.com/szymonrybczak))


#### iOS specific

- Support `customizeRootView` from `RCTRootViewFactory` ([3c4d761](https://github.com/facebook/react-native/commit/3c4d7618f00751b08f73ffcec9ef1f69d44136da) by [@Kudo](https://github.com/Kudo))

### Fixed

- Codegen computes output path relative to project root instead of current working directory. ([d3e0430dea](https://github.com/facebook/react-native/commit/d3e0430deac573fd44792e6005d5de20e9ad2797) by [@dmytrorykun](https://github.com/dmytrorykun))


### Android specific

- Android native rejections should be instanceof Error ([f4b0fcb9](https://github.com/facebook/react-native/commit/f4b0fcb92263667754348f82030f85cc941846ba) by [huzhanbo1996](https://github.com/huzhanbo1996))
- Tentative fix for NPE `JavaTimerManager$IdleCallbackRunnable.cancel` ([988bf162a0](https://github.com/facebook/react-native/commit/988bf162a0f36d9919cebbebc1fca27b58be4ae5) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Fixed Multiline TextInput with a fixed height scrolls to the bottom when changing AttributedText ([e210c7c5](https://github.com/facebook/react-native/commit/e210c7c5741202a6e1b372731b50fdb59a7232bb) by [@fabOnReact](https://github.com/fabOnReact))
- Fixed border being drawn over children when no color was set ([a2b52af3](https://github.com/facebook/react-native/commit/a2b52af3bcc273cf85f01510c24d4e8da1b45656) by [@j-piasecki](https://github.com/j-piasecki))

## v0.74.2

### Changed

- Updated `typescript-eslint` monorepo to `v7`
 ([91d725136e](https://github.com/facebook/react-native/commit/91d725136e8fe0fd55fdfca5a4f5bd8ab527f94e) by [@huntie](https://github.com/huntie))
- Upgrade CLI to `13.6.8` ([335f6ed833](https://github.com/facebook/react-native/commit/335f6ed83306bfa150c818d26dce4b279de4869f) by [@szymonrybczak](https://github.com/szymonrybczak))

### Fixed

- Warn only in `init` command when CLI uses cached `npx` version ([b98c5b960c](https://github.com/facebook/react-native/commit/b98c5b960ccc4fe9d2792c35994c414c709a3d7a) by [@szymonrybczak](https://github.com/szymonrybczak))
- `selection` prop in `TextInput` was not being applied at component creation ([be09d12667](https://github.com/facebook/react-native/commit/be09d12667044f237f08af410b2838062eb8e657) by [@alanleedev](https://github.com/alanleedev))

#### Android specific

- Fixed dangling `mAttachedSurfaces` after `ReactHost.destroy()` ([c70d791036](https://github.com/facebook/react-native/commit/c70d7910361f56bc361ad825fe13fb2178edfeba) by [@Kudo](https://github.com/Kudo))
- ReactSoftExceptions in ReactHostImpl only when Context is null ([ac3261ff60](https://github.com/facebook/react-native/commit/ac3261ff608768ff43736b413c5a5ad67668af61) by [@arushikesarwani94](https://github.com/arushikesarwani94))

#### iOS specific

- Privacy Manifest aggregation failing due to no `NSPrivacyAccessedAPITypes` key ([fc4e099920](https://github.com/facebook/react-native/commit/fc4e0999206ec7c1f465bb2b1fea987e43485a82) by [@renchap](https://github.com/renchap))
- In privacy manifest post install script, handle the case where the file reference doesn't have a path ([4ad65ac59a](https://github.com/facebook/react-native/commit/4ad65ac59a2491db598abb7b32fb793e9693d5ac) by [@robertying](https://github.com/robertying))
- Fixed an issue where the `selectionColor` prop was not being applied on the `TextInput` component. ([2bde626a9f](https://github.com/facebook/react-native/commit/2bde626a9fa2f782864937a5258ac494afe27f9f) by [@robinshin](https://github.com/robinshin))

## 0.74.1

### Added

#### iOS Specific

- Implement privacy manifest aggregation  ([4be1fafec8](https://github.com/facebook/react-native/commit/4be1fafec8edca5da5ebe515ad359d4178db7d23) by [@aleqsio](https://github.com/@aleqsio))

### Changed

- Align debugger Chrome launch flags with Meta-internal version ([93956e267c](https://github.com/facebook/react-native/commit/93956e267cd4f1a77adaa842a55ca6f2d0d1b9c5) by [@motiz88](https://github.com/@motiz88))
- Update "Open Debugger" to print extended Flipper guidance ([261a58761c](https://github.com/facebook/react-native/commit/261a58761c2e7e10cc5cf0a63ed9785e1cdf097c) by [@huntie](https://github.com/@huntie))
- Enable event loop by default when bridgeless is enabled ([b440672468](https://github.com/facebook/react-native/commit/b440672468b6d1d99cd322a4348dd90150703f24) by [@rubennorte](https://github.com/@rubennorte))
- Upgrade `@react-native-community/cli` to 13.6.6 ([58b1f9b2d4](https://github.com/facebook/react-native/commit/58b1f9b2d4f617290a3a535153ff1e93a4672038) by [@szymonrybczak](https://github.com/@szymonrybczak))

#### Android specific

- Support more stubbed methods in `BridgelessCatalystInstance` ([cc1c69799e](https://github.com/facebook/react-native/commit/cc1c69799e284b368e3eaaac0ccd8e238384857f) by [@javache](https://github.com/@javache))


### Fixed

- Reset animation state in TouchableOpacity and TouchableBounce ([165cabb21f](https://github.com/facebook/react-native/commit/165cabb21f2419bde63acb4b52be2f4fb7a2ec2e) by [@sammy-SChttps://github.com/@sammy-]())
- Add missing struct member initialization in Props.h ([13739510fb](https://github.com/facebook/react-native/commit/13739510fb1c2400fbae1df1635fb93dae55abaa) by [@alanleedev](https://github.com/@alanleedev))


#### Android Specific

- Split scheduler commit and flush delegate methods ([ff4b20e823](https://github.com/facebook/react-native/commit/ff4b20e823d2838b3f72e550e7a89daa08551a72) by [@javache](https://github.com/@javache))
- Fixing exposing ReactDelegate through ReactActivity for reload ([7a841dbcd1](https://github.com/facebook/react-native/commit/7a841dbcd1b4eead77827eda2bd307f11babec1f) by [@arushikesarwani94](https://github.com/@arushikesarwani94))
- Fix ReactActivity.getReactDelegate().reload() ([56631cd471](https://github.com/facebook/react-native/commit/56631cd471008c39fe6f771052c3f1af7085bd63) by [@kudo](https://github.com/@kudo))

#### iOS Specific

- Fix Symbol not found: (_JSGlobalContextSetInspectable) which crashed iOS <16.4 with JSC ([0a4d97362f](https://github.com/facebook/react-native/commit/0a4d97362f5a40cff62edce5200c3e7e8622d912) by [@cipolleschi](https://github.com/@cipolleschi))
- Fallback to the first foregroundInactive window when there are no `foregroundActive` windows in RCTKeyWindow ([eaaf865449](https://github.com/facebook/react-native/commit/eaaf865449e6b89cc2794b68f314d01aa775748e) by [@cipolleschi](https://github.com/@cipolleschi))
- Fix enable hermes debugger in Bridgeless mode ([3467f2f3a3](https://github.com/facebook/react-native/commit/3467f2f3a3319cc695bd729a8789c46d15ac8314) by [@Cipolleschi](https://github.com/@Cipolleschi))
- Maintain correct content offset when scroll view is suspended ([305249f964](https://github.com/facebook/react-native/commit/305249f9642da50bf680b1401644eaba9d5dce50) by [@sammy-SChttps://github.com/@sammy-]())
- Avoid calling abstract methods in RCTComposedViewRegistry ([59e7ed5038](https://github.com/facebook/react-native/commit/59e7ed50386cdae8f4a10d9ebc70566b9b36d01c) by [@cipolleschi](https://github.com/@cipolleschi))
- Honor requiresMainQueueSetup in bridgeless mode for ViewManagers ([8813061286](https://github.com/facebook/react-native/commit/88130612864b40adf9001efed9fae2d1ab80b30c) by [@cipolleschi](https://github.com/@cipolleschi))



## 0.74.0

### Breaking

- OnLayout event batching changes ([57e49b584d](https://github.com/facebook/react-native/commit/57e49b584d60a7238b113b255898250a7d03a70d) by [@sammy-SC](https://github.com/sammy-SC))
- Delete traitCast and identifier traits ([1170a68755](https://github.com/facebook/react-native/commit/1170a68755f953c16c85ce784aef476e6970fa7c) by [@NickGerleman](https://github.com/NickGerleman))
- Remove static-behaves-like-relative errata ([56b9b990de](https://github.com/facebook/react-native/commit/56b9b990de1fbe6ee78a5116e404259e849a07a7) by [@joevilches](https://github.com/joevilches))
- Make `start/end` in styles always refer to writing direction ([e859f6c773](https://github.com/facebook/react-native/commit/e859f6c773b85be8945f33e0a64ce042e3b2ab7a) by [@NickGerleman](https://github.com/NickGerleman))
- Remove APIs for reporting bundle download status to inspector-proxy, which does not use this information. ([cfa02eec50](https://github.com/facebook/react-native/commit/cfa02eec50469059542ccbacbc51643b525ad461) by [@motiz88](https://github.com/motiz88))
- Delete `configFilename` and `configKey` arguments from iOS codegen CLI. Now we always expect them to be `package.json` and `codegenConfig` respectively. ([33a44e68fc](https://github.com/facebook/react-native/commit/33a44e68fc4c53d48a4cf6c62337ffd13a0197ab) by [@dmytrorykun](https://github.com/dmytrorykun))
- Add errata for fix to marginStart/End for row-reverse flex direction ([2dad663c28](https://github.com/facebook/react-native/commit/2dad663c2870e0c098649854c8c9333e07be1793) by [@joevilches](https://github.com/joevilches))
- Remove web performance logging from GlobalPerformanceLogger ([53a2742e13](https://github.com/facebook/react-native/commit/53a2742e13f55c3e412bde2ac7b56f6950e44b17) by [@rshest](https://github.com/rshest))
- Rename AbsolutePositioning errata ([08eb985c33](https://github.com/facebook/react-native/commit/08eb985c333bca4fc47c854b51ad84f1353d344c) by [@joevilches](https://github.com/joevilches))
- Refactor React to get rid of JSIModule and its dependencies ([6555205539](https://github.com/facebook/react-native/commit/65552055392a5996bf50548018953875dde4560b) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- Get rid of old APIs in FabricUIManagerProvider ([c2c346ccaf](https://github.com/facebook/react-native/commit/c2c346ccaf9912f129b945944575c818eac99a6d) by [@arushikesarwani94](https://github.com/arushikesarwani94))

#### Android specific

- Make bridgeless the default when the New Arch is enabled ([fe337f25be](https://github.com/facebook/react-native/commit/fe337f25be65b67dc3d8d99d26a61ffd26985dd8) by [@cipolleschi](https://github.com/cipolleschi))
- Codegen: mapping for numeric types is changed for Android native modules. `Float` -> `float`; `Int32` -> `int`. ([ccd3b04770](https://github.com/facebook/react-native/commit/ccd3b047709fda00123e8aec4294dce024b80244) by [@dmytrorykun](https://github.com/dmytrorykun))
- Delete ReactInstancePackage ([7141c475bf](https://github.com/facebook/react-native/commit/7141c475bf29652d02d915ff70ebe9af439826f4) by [@mdvacca](https://github.com/mdvacca))
- Delete deprecated method LazyReactPackage.getReactModuleInfoProviderViaReflection ([118e651bc2](https://github.com/facebook/react-native/commit/118e651bc28d089f72e2ea3696ca711f21d7ada6) by [@mdvacca](https://github.com/mdvacca))
- Reduce visibility of CoreModulesPackage class ([30b9b01e68](https://github.com/facebook/react-native/commit/30b9b01e68929b4d0d839c98e91fefe99319ec50) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of DebugCorePackage ([5ad4bdbad8](https://github.com/facebook/react-native/commit/5ad4bdbad8e3cfc33fbec14535c15985d579b7e2) by [@mdvacca](https://github.com/mdvacca))
- Mark NativeModule.onCatalystInstanceDestroy() method as deprecated in new architecture ([b13ea1786f](https://github.com/facebook/react-native/commit/b13ea1786f9e0076654a04daaf9a626559f59194) by [@mdvacca](https://github.com/mdvacca))
- Deprecate CompositeReactPackage from RN Android ([294c0fa208](https://github.com/facebook/react-native/commit/294c0fa208a5eac201c9b9b79dee73a852b62aa8) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in ReactViewManager ([cb46f4cff8](https://github.com/facebook/react-native/commit/cb46f4cff8964a440aedb9ffe9c4ba7fc4a1d930) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in ReactDrawableHelper ([120aab2e99](https://github.com/facebook/react-native/commit/120aab2e995d341e5f620475c7f2beaf61e47f5e) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in ReactTextInputShadowNode ([dc3fc16ce5](https://github.com/facebook/react-native/commit/dc3fc16ce597dd6c24dc5dd26cf1ae9556c76848) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in ReactTextInputLocalData ([b968cb6f97](https://github.com/facebook/react-native/commit/b968cb6f97f6779c9acd037738240b95013fe7ce) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in TextLayoutManagerMapBuffer ([c35dcb3c04](https://github.com/facebook/react-native/commit/c35dcb3c0412eb90121a9f294a049574e80c67c5) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in TextLayoutManager ([4a563f30d2](https://github.com/facebook/react-native/commit/4a563f30d2de89eee1459d8ee79c9ac042a86a96) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in TextAttributeProps ([9454587316](https://github.com/facebook/react-native/commit/94545873169314f04c00fe6e09ad0c1d504635d2) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in ReactTextView ([31e16ee90c](https://github.com/facebook/react-native/commit/31e16ee90c42006b755aa53f0fdf8949f6b16896) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in ReactTextShadowNode ([07e885232b](https://github.com/facebook/react-native/commit/07e885232b409d4a6e2ec48251e4cfba16d2b689) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in ReactTextAnchorViewManager ([b138a4f72d](https://github.com/facebook/react-native/commit/b138a4f72d8d2d58b00437c93fcc8cdd325228b2) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in ReactBaseTextShadowNode ([0505f5c28c](https://github.com/facebook/react-native/commit/0505f5c28c39d746ee19d7ce84bcee49c906f74b) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in StatusBarModule ([6eb4f1e997](https://github.com/facebook/react-native/commit/6eb4f1e997f8412b3dc9238b0068e0db874a6fd2) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in PermissionsModule ([0384e3cf1f](https://github.com/facebook/react-native/commit/0384e3cf1faec1e1cd3782a32cbb3728ac92e06e) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in RequestBodyUtil ([52ec1d87e9](https://github.com/facebook/react-native/commit/52ec1d87e927efb933fade3de2411d3884d00c1b) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in WindowOverlayCompat ([c359a44676](https://github.com/facebook/react-native/commit/c359a44676db917d7fe62b8205ee76653fe529b0) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in DebugOverlayController ([2286c123b7](https://github.com/facebook/react-native/commit/2286c123b7c405a280648ea119c881fd2f97377e) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in ReactFragment ([414b25b125](https://github.com/facebook/react-native/commit/414b25b1257804ae7f1d1ae02679bb50d3213140) by [@mdvacca](https://github.com/mdvacca))
- Remove support for Android API < 23 in ([3664b8aa22](https://github.com/facebook/react-native/commit/3664b8aa221bfc232b0f737ea97b2672a5509e35) by [@mdvacca](https://github.com/mdvacca))
- Increase min sdk version of RN Android to 23 ([70fcb1ebf6](https://github.com/facebook/react-native/commit/70fcb1ebf664203ca9934fa12376cfa8a32d373b) by [@mdvacca](https://github.com/mdvacca))
- Rename onCatalystInstanceDestroy -> invalidate ([5f215cdde2](https://github.com/facebook/react-native/commit/5f215cdde2485110b08940f685a8ea31a6327528) by [@mdvacca](https://github.com/mdvacca))
- Implement `getJSCallInvokerHolder()` for Bridgeless Catalyst Instance ([c6076bca97](https://github.com/facebook/react-native/commit/c6076bca974b74b8456806cd06e0c1c63c58aaf9) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- Implement `onKeyLongPress` in Bridgeless ([f345fcf3e8](https://github.com/facebook/react-native/commit/f345fcf3e8331b76a72989645bd60b82ba9aa19a) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- Implement `onKeyDown` in Bridgeless ([b14f7d58e3](https://github.com/facebook/react-native/commit/b14f7d58e3537b9bfa2638d1d71ec3dc908f4b8d) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- Implement `onConfigurationChanged` in Bridgeless ([b2e1db0fbf](https://github.com/facebook/react-native/commit/b2e1db0fbf845c48878c4a0ea9cb5755a85a6f0e) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- Implement `onNewIntent` in Bridgeless ([5d711f83b5](https://github.com/facebook/react-native/commit/5d711f83b5f1e8053b5b19d0a864a1d8fc27a235) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- Implement `onWindowFocusChange` in Bridgeless ([7b40c8ee5f](https://github.com/facebook/react-native/commit/7b40c8ee5fc4073cdf83060cf81e16fa282899ee) by [@arushikesarwani94](https://github.com/arushikesarwani94))

#### iOS specific

- Removing unused `handler` param on  PushNotificationIOS.removeEventListener ([fdf4ec3297](https://github.com/facebook/react-native/commit/fdf4ec32975eeec41e0b4b8145c4e45798c82607))
- Make bridgeless the default when the New Arch is enabled ([c91af773fa](https://github.com/facebook/react-native/commit/c91af773fa2fafdc0fb8e19ccf503ee203efe0c5) by [@cipolleschi](https://github.com/cipolleschi))
- CocoaPods: remove the `ios_folder` argument from the `use_react_native` function. ([be0c353e18](https://github.com/facebook/react-native/commit/be0c353e18da3a0996f6e2fd3fecbe3852d3d240) by [@dmytrorykun](https://github.com/dmytrorykun))
- Codegen: mapping for numeric types is changed for Objective-C native modules. `Float` -> `float`; `Int32` -> `NSInteger`. ([5aa425c086](https://github.com/facebook/react-native/commit/5aa425c0867e1e737cce9b7de9752cd9518b95ac) by [@dmytrorykun](https://github.com/dmytrorykun))
- Defining external codegen targets in `react-native.config.js` is not supported anymore. Define them as normal dependencies in `package.json`. ([ca39a11b27](https://github.com/facebook/react-native/commit/ca39a11b27bf9f90c3a792974910bb9060b2990f) by [@dmytrorykun](https://github.com/dmytrorykun))
- Delete configFileDir CLI argument. ([8a62d6135f](https://github.com/facebook/react-native/commit/8a62d6135f5ac8c01aa8103ddd91f94973dd6cd3) by [@dmytrorykun](https://github.com/dmytrorykun))
-  ([072a2006e0](https://github.com/facebook/react-native/commit/072a2006e0bd8bd8cc9a75385cc03759bcf63c61) by [@philIip](https://github.com/philIip))
- Remove some usages of RCT_NEW_ARCH_ENABLED. The change should be transparent BUT some **Swift** libraries might get broken by this change. ([951efc8ce2](https://github.com/facebook/react-native/commit/951efc8ce2a6d34aa6df6d1ad205db2661143855) by [@cipolleschi](https://github.com/cipolleschi))
- You cannot call methodQueue on RCTHTTPRequestHandler ([7503dbd784](https://github.com/facebook/react-native/commit/7503dbd7849dddbc235b42eb75be0f446bd9cf62) by [@philIip](https://github.com/philIip))
- RepeatInterval is deprecated in PushNotificationIOS. Use fireDate and the new fireIntervalSeconds. ([a1299938a9](https://github.com/facebook/react-native/commit/a1299938a9fae9cc5b7a2dd49ab6dcb82001d5ef))
- AlertAction is deprecated in PushNotificationIOS. getScheduledLocalNotifications now uses new iOS APIs which do not expose this property. ([9f4d66d283](https://github.com/facebook/react-native/commit/9f4d66d283905fe04900b012c58e43f5f0f2955d))
- Make TextInput.onContentSizeChange a direct event ([744fb4a0d2](https://github.com/facebook/react-native/commit/744fb4a0d23d15a40cd591e31f6c0f6cb3a7f06b) by [@sammy-SC](https://github.com/sammy-SC))
- Remove the Flipper integration ([899e7cdb55](https://github.com/facebook/react-native/commit/899e7cdb55197fc17a96a93af4f8bcc7519553c2) by [@cipolleschi](https://github.com/cipolleschi))
- Deleted the no-op didRegisterUserNotificationSettings: callback in RCTPushNotificationManager ([3bea8e1bd4](https://github.com/facebook/react-native/commit/3bea8e1bd41cf019bcd01acaef8256e2b3dbd742))

### Added

- Experimental macro to autolink C++ turbomodules ([01d704dd45](https://github.com/facebook/react-native/commit/01d704dd459a05208153d41e512f8be6af924ca3) by [@philIip](https://github.com/philIip))
- Added a folder inside the `exclude` array inside `tsconfig` ([40bb425f48](https://github.com/facebook/react-native/commit/40bb425f48a65641b4882c08cf84be123b333bd6) by [@bartlomein](https://github.com/bartlomein))
- Gradle plugin for resolving node_modules packages. ([8456ccad78](https://github.com/facebook/react-native/commit/8456ccad78dab2b0982439f8f45ea1242eb90908) by [@robhogan](https://github.com/robhogan))
- Added missing typings for fontVariant style prop. ([8fca1c5854](https://github.com/facebook/react-native/commit/8fca1c58542a560d99adaf1408733ef95cc17797) by [@ankit-tailor](https://github.com/ankit-tailor))
- Added missing typings for fontWeight style prop. ([fb5f79ceb5](https://github.com/facebook/react-native/commit/fb5f79ceb5ececc0ae7f22fa933eca0ac64f3e70) by [@ankit-tailor](https://github.com/ankit-tailor))
- Enable setNativeProps in animations in the New Architecture ([a5aed1294f](https://github.com/facebook/react-native/commit/a5aed1294f91cfc58e20439ce8eee5a183f899d6) by [@sammy-SC](https://github.com/sammy-SC))
- Fix flooring of border ([e27452a670](https://github.com/facebook/react-native/commit/e27452a670c45f4c919c9d46e08145723a2235a0) by [@NickGerleman](https://github.com/NickGerleman))
- Add Yarn files to `.gitignore` in template ([965f2eb1fb](https://github.com/facebook/react-native/commit/965f2eb1fb4d8e9a6bf730925658f3a6baf50654) by [@szymonrybczak](https://github.com/szymonrybczak))
- Fix missing assignment in Node move constructor ([90df90efca](https://github.com/facebook/react-native/commit/90df90efca35612be27049f7dba9650a289c12e3) by [@NickGerleman](https://github.com/NickGerleman))
- Introduce "npx react-native codegen" command. ([a612053510](https://github.com/facebook/react-native/commit/a612053510847b7c41135a88db2dcd11d44fa77f) by [@dmytrorykun](https://github.com/dmytrorykun))
- Introduce the "platform" option to generate-codegen-artifacts.js ([7b10609276](https://github.com/facebook/react-native/commit/7b1060927690d48302dfdcb99bf8c651fd137871) by [@dmytrorykun](https://github.com/dmytrorykun))
- Introduce "headerPrefix" codegen option. ([dae4a11e90](https://github.com/facebook/react-native/commit/dae4a11e901696f7c205e19df6f0b306319be43a) by [@dmytrorykun](https://github.com/dmytrorykun))
- Introduce "codegenConfig.includesGeneratedCode" property. ([21784e2ce5](https://github.com/facebook/react-native/commit/21784e2ce5dbf361511a77e9546c8839321e5b74) by [@dmytrorykun](https://github.com/dmytrorykun))
- Introduce "outputDir" property of "codegenConfig" ([d45a01d6d1](https://github.com/facebook/react-native/commit/d45a01d6d15530e356065704adb869b1cbbb2576) by [@dmytrorykun](https://github.com/dmytrorykun))
- Fix issues with aligning absolute nodes ([31005b7fd9](https://github.com/facebook/react-native/commit/31005b7fd9a9579920b55f921c477a90fb3f6d10) by [@joevilches](https://github.com/joevilches))
- Fix bug with align start not taking into account parent padding ([ea3dd6b4f2](https://github.com/facebook/react-native/commit/ea3dd6b4f2ecaac79476796ed2a11fe198299506) by [@joevilches](https://github.com/joevilches))
- Fix issue where percentages were off of the border box, not padding box ([e826d1c336](https://github.com/facebook/react-native/commit/e826d1c33695c9901e1070d7dd7231de4e79a8d4) by [@joevilches](https://github.com/joevilches))
- New file for layout methods related to absolute children ([0cc09f207f](https://github.com/facebook/react-native/commit/0cc09f207fc93b18e25cce3fed568647e8ad896f) by [@joevilches](https://github.com/joevilches))
- Fix issue where start/end would not be respected in flex edge getters ([aa31c6cd75](https://github.com/facebook/react-native/commit/aa31c6cd754ca798c879bd04f955d72051906f95) by [@joevilches](https://github.com/joevilches))
- Added JSI method for reporting native memory to the GC. ([cfe129c832](https://github.com/facebook/react-native/commit/cfe129c8329ef62c7fcd3ed25c17656b0e218d95) by [@neildhar](https://github.com/neildhar))
- Allowing `cursorColor` and `selectionHandleColor` to override `selectionColor` on Android ([1e68e48534](https://github.com/facebook/react-native/commit/1e68e48534aedf1533327bf65f26e5cf5b80127b) by [@jakex7](https://github.com/jakex7))
- Introduce APIs for FabricUIManager ([16fb64a9ef](https://github.com/facebook/react-native/commit/16fb64a9ef97e7ff0b8fe718d310705fa5fe6066))
- Missing typings for the props `tabIndex` for **View** and `userSelect` in the **Text** props were added. ([b36505bf06](https://github.com/facebook/react-native/commit/b36505bf06d023472f5bee5b3b0a6db4e1ca428f) by [@wootsbot](https://github.com/wootsbot))
- Turbo Modules Promise-returning functions reject with JS and platform stack traces information ([7612e6601a](https://github.com/facebook/react-native/commit/7612e6601a1c402c548dfe2fe548b1c481659993) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- Bindings for `alignContent: "space-evenly"` ([c9d0a006fd](https://github.com/facebook/react-native/commit/c9d0a006fd14b428b844a68e73a57986a4abb3b1) by [@NickGerleman](https://github.com/NickGerleman))
- Support "align-content: space-evenly" ([d66ab59570](https://github.com/facebook/react-native/commit/d66ab59570a4d7542aea595e2dad4a0b5d0654d3) by [@nicoburns](https://github.com/nicoburns))
- Rename ambiguous leading/trailingEdge functions ([594b586c7d](https://github.com/facebook/react-native/commit/594b586c7d6e90658cc72423d4cf77c4c9d68b9a) by [@joevilches](https://github.com/joevilches))
- JSC support for the NativeState API in JSI ([7b7f128968](https://github.com/facebook/react-native/commit/7b7f128968310c466ce0a929e9964b08fe098503) by [@javache](https://github.com/javache))
- Fixed issue with first line element gap handling. ([c7c7831ec6](https://github.com/facebook/react-native/commit/c7c7831ec64da0a5e31d90c3fa1730e4bee87265) by [@jlmip](https://github.com/jlmip))
- Add onPress prop to TextInput ([8e36cc0293](https://github.com/facebook/react-native/commit/8e36cc02931d121832ed89efb02092125a728315))
- Cxx TurboModules > Add example to return a JS function from Cxx to JS ([9320174df4](https://github.com/facebook/react-native/commit/9320174df4239058125b8876a0623230f6e03b02) by [@christophpurrer](https://github.com/christophpurrer))
- Adding getFabricUIManager() APIs to ReactContext ([f941f939bf](https://github.com/facebook/react-native/commit/f941f939bfea5a5619ecabe6a0d401037e8df6f1))
- Warn with future command when using `npx react-native init` ([a6397afb7f](https://github.com/facebook/react-native/commit/a6397afb7f4279e70afa025fe6f9fa0b8e3de3fd) by [@byCedric](https://github.com/byCedric))
- Add inspector proxy `nativeNetworkInspection` target capability flag ([f3ce7cd76e](https://github.com/facebook/react-native/commit/f3ce7cd76ee4f1772e2623c87b21bbbcb1edbc27) by [@byCedric](https://github.com/byCedric))
- Add inspector proxy device message middleware API ([3f41fb5d5b](https://github.com/facebook/react-native/commit/3f41fb5d5b5dfd6d69b00e104f9eb05b98671fa6) by [@byCedric](https://github.com/byCedric))
- Fallback to query parameter based `user-agent` when header is unset ([c62be78d99](https://github.com/facebook/react-native/commit/c62be78d99939e33b5b2bc3cee5be2a030f0640b) by [@byCedric](https://github.com/byCedric))
- Added @types/react as an optional peerDependency ([dbf8e3f5ba](https://github.com/facebook/react-native/commit/dbf8e3f5ba8636560898803f5c5973432bf61d1e) by [@acoates-ms](https://github.com/acoates-ms))
- Implement `getJavaScriptContextHolder()` for Bridgeless Catalyst Instance ([b72f5e9982](https://github.com/facebook/react-native/commit/b72f5e9982525712f0fd845979ce7142c5de3098) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- Implement `getRuntimeExecutor()` for Bridgeless Catalyst Instance ([6a5aaad9e0](https://github.com/facebook/react-native/commit/6a5aaad9e0a7dfe001e75054f0d1b1731aa9e19e) by [@arushikesarwani94](https://github.com/arushikesarwani94))

#### Android specific

-  ([315be8290d](https://github.com/facebook/react-native/commit/315be8290d6c6524289abc9cf201f32a56e72c13) by [@philIip](https://github.com/philIip))
- Introduce native api to access RuntimeExecutor ([d7dce975f9](https://github.com/facebook/react-native/commit/d7dce975f91255c6383f9cc6d3b8f818f6e0420b) by [@philIip](https://github.com/philIip))
- Added `onUserLeaveHint` support into `ReactActivityDelegate` ([3b6c522942](https://github.com/facebook/react-native/commit/3b6c522942ca1b3d3f5e2115e0a4e781063747d0) by [@behenate](https://github.com/behenate))
- Introduce PopupMenuAndroid to replace UIManager.showPopupMenu() ([35308a73a5](https://github.com/facebook/react-native/commit/35308a73a5e0f69bf32d687be52a8f739fbf2e50) by [@RSNara](https://github.com/RSNara))
- Added `removeAllViews` to IViewGroupManager. ([3cd85dc933](https://github.com/facebook/react-native/commit/3cd85dc9331fee18ecbe1d0eb4f0f217fc803070) by [@javache](https://github.com/javache))
- The public API of Modal has changed. We don't have anymore a NativeModalManger turbomodule; RCTModalHostViewNtiveComponent's Prop does not require to pass an identifier anymore. ([314cfa8c91](https://github.com/facebook/react-native/commit/314cfa8c9108581e027b71139c005ab3385acf1e) by [@bernhardoj](https://github.com/bernhardoj))
- Fix static view config not to filter out "onClick" events on Android ([342041e9ee](https://github.com/facebook/react-native/commit/342041e9ee0f4c72b70a19f290a79040c200f859) by [@rshest](https://github.com/rshest))
- ReactChoreographer can now use an implementation substitution instead of relying on android.view.Choreographer directly. ([37e509f2b6](https://github.com/facebook/react-native/commit/37e509f2b695818d19358fcd3eaf8fa0452adce3) by [@nlutsenko](https://github.com/nlutsenko))
- ReactChoreographer can now use an implementation substitution instead of relying on android.view.Choreographer directly. ([751f7e97ba](https://github.com/facebook/react-native/commit/751f7e97ba299eb8f06231126df0a7ecbc41d607) by [@nlutsenko](https://github.com/nlutsenko))
- Expose ReactDelegate in ReactActivity ([62ebe557b8](https://github.com/facebook/react-native/commit/62ebe557b8efbfb025f6187ef08a9c2223f4f3c3) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- Support reload() in ReactDelegate ([d97741af60](https://github.com/facebook/react-native/commit/d97741af60e3af598d71894800d928b61c5782b4) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- Implement multiple view manager lookup for the interop layer ([15a5638c62](https://github.com/facebook/react-native/commit/15a5638c621cbec4a9fcb5ae94938120cdc32fae) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Copy boost headers needed by `rrc_text` and `rrc_textinput` ([ad9f0b0ab8](https://github.com/facebook/react-native/commit/ad9f0b0ab88218beb214859e0d85d50f9caa7bb5) by [@j-piasecki](https://github.com/j-piasecki))

#### iOS specific

- Add error message if codegen has not run properly ([10edb9f545](https://github.com/facebook/react-native/commit/10edb9f545e3b043ed0316933f8e96509934e3a4) by [@cipolleschi](https://github.com/cipolleschi))
-  ([16276ce0f6](https://github.com/facebook/react-native/commit/16276ce0f6115fd4decaccaf33cf3364bbd2d469) by [@philIip](https://github.com/philIip))
- Allow libraries to provide module which conforms to protocols meant to be extension points. ([46d7f8a669](https://github.com/facebook/react-native/commit/46d7f8a66925ebfad9c8474028fcb69e9735def4) by [@cipolleschi](https://github.com/cipolleschi))
- Add nullable annotations to RCTBundleURLProvider ([12e4a5745d](https://github.com/facebook/react-native/commit/12e4a5745d54a7be86c005e4ed954c42171541b2) by [@okwasniewski](https://github.com/okwasniewski))
- Remove unused getHeight method from StatusBar ([3dfedbc1ae](https://github.com/facebook/react-native/commit/3dfedbc1aec18a4255e126fde96d5dc7b1271ea7) by [@okwasniewski](https://github.com/okwasniewski))
- Introduce native api to access RuntimeExecutor ([343a0d3cd8](https://github.com/facebook/react-native/commit/343a0d3cd82770bcb00bad30fdf353acf148057a) by [@philIip](https://github.com/philIip))
- Make codegen take OOT Apple platforms into account ([ebb2b9c3fc](https://github.com/facebook/react-native/commit/ebb2b9c3fce227135f437bd86db71125eebcf21f) by [@okwasniewski](https://github.com/okwasniewski))
- Introduce `vision` interfaceIdiom ([258d8e51b4](https://github.com/facebook/react-native/commit/258d8e51b451b221e557dad4647cbd210fe37392) by [@okwasniewski](https://github.com/okwasniewski))
- Provide better Swift types for RCTAppDelegate and RCTBridgeDelegate ([a7c5c2821c](https://github.com/facebook/react-native/commit/a7c5c2821c39a7bf653919353897d27d29a64068) by [@okwasniewski](https://github.com/okwasniewski))
- Add `shouldBeRecycled` method on `iOS`. ([613a5a7597](https://github.com/facebook/react-native/commit/613a5a75977d84333df7cbd5701e01a7ab5a3385) by [@WoLewicki](https://github.com/WoLewicki))
- Added the `RCTIsNewArchEnabled()` to check whether the New Arch is enabled at runtime. ([f1a7f08feb](https://github.com/facebook/react-native/commit/f1a7f08feb2a63926e91d37b5d85130c7b74ee31) by [@cipolleschi](https://github.com/cipolleschi))
- Added the customiseRootView method which is called in both bridge and bridgeless. Added also a warning for 0.74 with instructions on how to migrate. ([db9c9eacac](https://github.com/facebook/react-native/commit/db9c9eacac301c4a684130413423eab50bbb1d72) by [@cipolleschi](https://github.com/cipolleschi))
- Added better support for `ccache`, to speed up subsequent builds of native code. After installing `ccache` and running `pod install`, the Xcode project is injected with compiler and linker build settings pointing scripts that loads a default  Ccache configuration and invokes the `ccache` executable. ([e85d51c6f1](https://github.com/facebook/react-native/commit/e85d51c6f161c709706044c5955ac5397e746fa1) by [@kraenhansen](https://github.com/kraenhansen))
- Add use of the `REACT_NATIVE_PATH` in the "Bundle React Native code and images" shell script build phase. This will help apps initialized into a mono-repo which hoists the `react-native` package. ([289e78388a](https://github.com/facebook/react-native/commit/289e78388a87408e215a25108cb02511a05f5c80) by [@kraenhansen](https://github.com/kraenhansen))
- Support "highlighting updates when components render" feature from React DevTools ([758e59f1d9](https://github.com/facebook/react-native/commit/758e59f1d9752cf051b2dee900c5182ee52c4189) by [@hoxyq](https://github.com/hoxyq))
-  ([e9ecc65652](https://github.com/facebook/react-native/commit/e9ecc656528ec54e93a9bcd43e39e0b6888a6ed5) by [@philIip](https://github.com/philIip))
- Make build-hermes-xcode.sh more extensible for out-of-tree platforms ([7bcfd02a60](https://github.com/facebook/react-native/commit/7bcfd02a60667e74041c8172e5499cfc75759da1) by [@okwasniewski](https://github.com/okwasniewski))
- Add console.log notification in DevTools if app transitions between back/foreground. ([05967e471e](https://github.com/facebook/react-native/commit/05967e471e52512bb52108bd821edad824c98705) by [@blakef](https://github.com/blakef))
- Add TypeScript typings for the `dismissActionSheet` function in `ActionSheetIOS`. ([89c7be890b](https://github.com/facebook/react-native/commit/89c7be890b0dcef72e465b70314ac47ca5ca0280) by [@LRNZ09](https://github.com/LRNZ09))
- Add support for `Platform.isMacCatalyst` ([027d520d65](https://github.com/facebook/react-native/commit/027d520d657ab0c3dd30913c589692a496ad36da) by [@jacobp100](https://github.com/jacobp100))
- Warn users during "pod install" if XCode is too old ([1021448d7c](https://github.com/facebook/react-native/commit/1021448d7cf462d5280ce82f484f029fd29e40a6) by [@NickGerleman](https://github.com/NickGerleman))
- Allow the activityIndicator to be controlled from JS in bridgeless mode ([9aeb9f2f94](https://github.com/facebook/react-native/commit/9aeb9f2f94536155c2f1e1c815e0b5fa18a2b9f3) by [@cipolleschi](https://github.com/cipolleschi))
- Implement cursor style prop ([73664f576a](https://github.com/facebook/react-native/commit/73664f576aaa472d5c8fb2a02e0ddd017bbb2ea4) by [@Saadnajmi](https://github.com/Saadnajmi))
- Add privacy manifest to pod install ([d39712f54a](https://github.com/facebook/react-native/commit/d39712f54a95e6dcdf1d2f80d9581211ab03c157) by [@philIip](https://github.com/philIip))
-  Add privacy manifest to hello world template ([520d120375](https://github.com/facebook/react-native/commit/520d120375c6b24bc161adea4f48d76537a34abc) by [@philIip](https://github.com/philIip))

### Changed

- Upgrade `@react-native-community/cli` to 13.6.4 ([4f50089da2](https://github.com/facebook/react-native/commit/4f50089da2e9d96c8b986c3b359a542537d34d3a) by [@szymonrybczak](https://github.com/szymonrybczak))


#### iOS specific

- Bump CLI to 13.6.0 ([c99d96b7a1](https://github.com/facebook/react-native/commit/c99d96b7a1a4dc905ce642966633b4d3c78bd3c9) by [@szymonrybczak](https://github.com/szymonrybczak))
- CodegenNativeComponent show warning and not error if not code generated at build time. ([de5619ed8c](https://github.com/facebook/react-native/commit/de5619ed8cf4a07d9a23a7714e25611e970ed46e) by [@dmytrorykun](https://github.com/dmytrorykun))
- Make template's .gitignore file universal for OOT platforms ([c5f48ac612](https://github.com/facebook/react-native/commit/c5f48ac61279d9af12d7aea0b0a6177ce5f54397) by [@okwasniewski](https://github.com/okwasniewski))
- Sync React renderers to 18.3.0-canary-03d6f7cf0-20240209 ([3272b05c3d](https://github.com/facebook/react-native/commit/3272b05c3d148a814e8639e2b9784d5190f4feea) by [@sammy-SC](https://github.com/sammy-SC))
- React@18.3.0-canary-b2d637128-20240123 ([29df29f5e2](https://github.com/facebook/react-native/commit/29df29f5e297ea46543303c28f2487dba53e243f) by [@sammy-SC](https://github.com/sammy-SC))
- Changed community cli plugin homepage url. ([6f7e8e17e2](https://github.com/facebook/react-native/commit/6f7e8e17e28c73ba5511332bcdd8abf4122de7f6) by [@hoonjoo-park](https://github.com/hoonjoo-park))
- Bump CLI to 13.5.1 ([78967b33c0](https://github.com/facebook/react-native/commit/78967b33c0562a07ff7b38c48056532cbf9321b4) by [@szymonrybczak](https://github.com/szymonrybczak))
- Update API docs for scrollEventThrottle ([3ea0598341](https://github.com/facebook/react-native/commit/3ea059834145c48d2f9d4a8ecdf73adfaf0c684e) by [@NickGerleman](https://github.com/NickGerleman))
- Updated Pressability/usePressability Docblocks ([0fd7bd3a7f](https://github.com/facebook/react-native/commit/0fd7bd3a7f62b72f70da42608ff933a9fb1a63d9) by [@yungsters](https://github.com/yungsters))
- Bump folly version to 2024.01.01.00 ([cfeb43eaa2](https://github.com/facebook/react-native/commit/cfeb43eaa2fa99454de67c88a3a461de6ebdfe88) by [@Kudo](https://github.com/Kudo))
- Update monorepo dependency versions to remove ^ ([6e5bc33b3c](https://github.com/facebook/react-native/commit/6e5bc33b3c9cd0ce2c30c7689982c6fb16ef4e3b) by [@lunaleaps](https://github.com/lunaleaps))
- Be explicit about what monorepo versions we are using ([b5e08e80d9](https://github.com/facebook/react-native/commit/b5e08e80d90b6d03d1f49f0674c01f03ee300c46) by [@lunaleaps](https://github.com/lunaleaps))
- Bump CLI to v13.0.0 ([6e88d67b8c](https://github.com/facebook/react-native/commit/6e88d67b8c4631431bd04c1a23ae7cb520b9c0bd) by [@thymikee](https://github.com/thymikee))
- Fix issue where we were not applying flex end correctly when justifying ([579ef2b3fb](https://github.com/facebook/react-native/commit/579ef2b3fbeb2b475ea9c6d426b1e84a964c25f1) by [@joevilches](https://github.com/joevilches))
- Use `hermes-parser` instead of `flow-parser` to parse Flow Codegen specs. ([5abaf388cd](https://github.com/facebook/react-native/commit/5abaf388cde499747e81ecb73aa01fa819dbbd47) by [@motiz88](https://github.com/motiz88))
- Fix issue where absolute children of row-reverse containers would inset on the wrong side ([9847bcab51](https://github.com/facebook/react-native/commit/9847bcab514142d9132dca36544fc7628ddbf437) by [@joevilches](https://github.com/joevilches))
- Upgrade CLI to v12.0.0 ([d077239fff](https://github.com/facebook/react-native/commit/d077239fff600d41d093dfeca87f6744bd7f1cd3) by [@szymonrybczak](https://github.com/szymonrybczak))
- Apply Babel arrow transform only on non-Hermes ([9a3b75c782](https://github.com/facebook/react-native/commit/9a3b75c7824e1b8896ffc4f05c3386587513f2be) by [@gaearon](https://github.com/gaearon))
- Update Metro to ^v0.80.0, stop pinning to an exact version ([7853b06929](https://github.com/facebook/react-native/commit/7853b06929ea6186dbc5923393b5521c2d6ae09d) by [@robhogan](https://github.com/robhogan))
- Use ImageRequireSource instead of number for the defaultSource prop typing of the Image component ([2be1c71cb7](https://github.com/facebook/react-native/commit/2be1c71cb7be18906c89ab8706551ce260f77f51) by [@ellouzeskandercs](https://github.com/ellouzeskandercs))
- Gate new debugger frontend behind `--experimental-debugger` flag, restore Flipper as base launch flow ([9e068ac163](https://github.com/facebook/react-native/commit/9e068ac163db057cc76bac2caba76136d19bcf49) by [@huntie](https://github.com/huntie))
- Make layout events top-down on Android classic renderer ([25478321f9](https://github.com/facebook/react-native/commit/25478321f9d88730d006221a90f5d84f32d3ffcd) by [@NickGerleman](https://github.com/NickGerleman))
- UIManagerModule: Make reactTags required ([fafd00ab1a](https://github.com/facebook/react-native/commit/fafd00ab1ad8e78fb0b992f5ce1b35211d4089ee) by [@RSNara](https://github.com/RSNara))
- Make ImageManager implementation overridable ([ac1cdaa716](https://github.com/facebook/react-native/commit/ac1cdaa71620d5bb4860237cafb108f6aeae9aef) by [@rshest](https://github.com/rshest))
- Share ImageRequest implementation across the platforms ([7625a50296](https://github.com/facebook/react-native/commit/7625a502960e6b107e77542ff0d6f40fbf957322) by [@rshest](https://github.com/rshest))
- Support for (de)serializing config values ([e1afa023aa](https://github.com/facebook/react-native/commit/e1afa023aa434cf8df5af70e85d6352e1abe7ca0) by [@joevilches](https://github.com/joevilches))
- Fix mismatched cases of inlineStart/End and flexStart/End ([64d81905ac](https://github.com/facebook/react-native/commit/64d81905acbdbef01f9bc5818a20367917372be4) by [@joevilches](https://github.com/joevilches))
- Replace CompactValue with StyleValueHandle and StyleValuePool ([92b889b89e](https://github.com/facebook/react-native/commit/92b889b89e92bb52ba2d6868bf6de4d7c3972368) by [@NickGerleman](https://github.com/NickGerleman))
- Simplify Edge Resolution ([40c4552d02](https://github.com/facebook/react-native/commit/40c4552d0227ba5d213139c3c4e0b88743b7b4e1) by [@NickGerleman](https://github.com/NickGerleman))
- Make position static behave like position static ([475036d2cd](https://github.com/facebook/react-native/commit/475036d2cd9852335da5c22a67700e9243b35024) by [@joevilches](https://github.com/joevilches))
- Make positionAbsoluteChild the sole place that matters when determining absolute node's position ([6025d50925](https://github.com/facebook/react-native/commit/6025d50925b4e35b3bdfb2165e6466862544865c) by [@joevilches](https://github.com/joevilches))
- Introduce positionAbsoluteChild ([7459529ee4](https://github.com/facebook/react-native/commit/7459529ee46cf4a9aaa3251887bf67dbc1fa3f7f) by [@joevilches](https://github.com/joevilches))
- Use containing block to adjust absolute child position ([a48e0d590e](https://github.com/facebook/react-native/commit/a48e0d590e9e62caf14cc833d3abf41e5882b571) by [@joevilches](https://github.com/joevilches))
- Allow the containing block to set trailing position of absolute descendants ([43ab5fe38c](https://github.com/facebook/react-native/commit/43ab5fe38ccc8a5eaa6d885b216cc45d0a9c833d) by [@joevilches](https://github.com/joevilches))
- Let containing blocks layout their absolute descendants, not parents ([33d6a59bea](https://github.com/facebook/react-native/commit/33d6a59bea4cdc2eea116786267b4768277731c8) by [@joevilches](https://github.com/joevilches))
- Insets no longer apply to statically positioned nodes ([e48da2aff3](https://github.com/facebook/react-native/commit/e48da2aff33b5d7831e0946b6e492b849de43344) by [@joevilches](https://github.com/joevilches))
- Change default back to `position: "relative"` ([88a55baeaa](https://github.com/facebook/react-native/commit/88a55baeaaa68619d815f53a51e32edb937e291f) by [@NickGerleman](https://github.com/NickGerleman))
- Remove NumericBitfield ([9078db77a9](https://github.com/facebook/react-native/commit/9078db77a900aa417c3cdf6e8e5b4217061cc442) by [@NickGerleman](https://github.com/NickGerleman))
- Introduce isDefined() and remove cases of !isUndefined() ([3b13d3c7d0](https://github.com/facebook/react-native/commit/3b13d3c7d0ff128f766e37b630687eb52a2cce5a) by [@joevilches](https://github.com/joevilches))
- Simplify getting padding + border for cross axis in algorithm ([1984bcc0c1](https://github.com/facebook/react-native/commit/1984bcc0c100fe24ad4d44e4bb61d8f288c1d40c) by [@joevilches](https://github.com/joevilches))
- Add errata supporting changes to position: static ([60297d50dc](https://github.com/facebook/react-native/commit/60297d50dcb4a97d4d4d68f46047288014df5b79) by [@joevilches](https://github.com/joevilches))
- Fix issue where position insets were not working with row reverse ([25575e57cb](https://github.com/facebook/react-native/commit/25575e57cb430bfb1e237bbe1700c2f67846f374) by [@joevilches](https://github.com/joevilches))
- Build with MSVC /W4 ([8eb0617d95](https://github.com/facebook/react-native/commit/8eb0617d95e709ed88e36a2b0eb52d8fbea331b8) by [@NickGerleman](https://github.com/NickGerleman))
- Rename ambiguous getLeading/Trailing... functions in Node.cpp ([ef32905172](https://github.com/facebook/react-native/commit/ef32905172aa7b559d9a677751260fd5898e5b97) by [@joevilches](https://github.com/joevilches))
- FloatOptional GCC build fix and more constexpr ([5e5019c723](https://github.com/facebook/react-native/commit/5e5019c723db9eba5271845361e0cd46f088deab) by [@NickGerleman](https://github.com/NickGerleman))
- Make all annotation processors derive from ProcessorBase ([fea445ee2d](https://github.com/facebook/react-native/commit/fea445ee2dfa1bf64b99f7bc1e12be0a8bcd7e71) by [@ianlevesque](https://github.com/ianlevesque))
- Remove usage of Gutters arrays and YGGutter as index ([4da0d44e55](https://github.com/facebook/react-native/commit/4da0d44e55485bf622aae85a6b7a92e342f3eaf2) by [@NickGerleman](https://github.com/NickGerleman))
- Rename BUILD_FROM_SOURCE to RCT_BUILD_HERMES_FROM_SOURCE ([f7644be6d4](https://github.com/facebook/react-native/commit/f7644be6d4d79b72c26f740cf5ac021dfd5fedc0) by [@cipolleschi](https://github.com/cipolleschi))

#### Android specific

- Kotlin to 1.9.22 ([3c2b2b181c](https://github.com/facebook/react-native/commit/3c2b2b181c593f48a870d6d2211875590aa3da29) by [@cortinico](https://github.com/cortinico))
- Android NDK to 26.1 ([5f75e9b90d](https://github.com/facebook/react-native/commit/5f75e9b90d4f998403101ae92924778df31d36fb) by [@cortinico](https://github.com/cortinico))
- Fix "Show Perf Monitor" crash in Catalyst ([6f115110c4](https://github.com/facebook/react-native/commit/6f115110c4bc7c44f84446304cc5b658a5d9449a))
- Fix dev menu not open for Bridgeless ([e4887a587a](https://github.com/facebook/react-native/commit/e4887a587a51478dc0302701f48675e8f7175b72))
- NetworkingModuleTest.java -> NetworkingModuleTest.kt ([852f2b1758](https://github.com/facebook/react-native/commit/852f2b17587c0998ba2c5b1bfa44a2ce59239cff) by [@KrzysztofMoch](https://github.com/KrzysztofMoch))
- Integrate binary-compatibility-validator into RN Android build system ([e9b80971c7](https://github.com/facebook/react-native/commit/e9b80971c7f510d7101998a7985e871481dc1bc6) by [@mdvacca](https://github.com/mdvacca))
- Use null to signal a missing TurboModule instead of IllegalArgumentException. ([228193dad5](https://github.com/facebook/react-native/commit/228193dad5369cdb5e13ba8a926e0ab9d12429e7) by [@javache](https://github.com/javache))
- Fix backward compatibility breakage ([1891d9e647](https://github.com/facebook/react-native/commit/1891d9e6470ef90dcfcf27ce05944737c235310e) by [@mdvacca](https://github.com/mdvacca))
- Continuation of PR: 36263 ([a337f6eda7](https://github.com/facebook/react-native/commit/a337f6eda71424e2eaa765aabef2a932bfac221f) by [@ricku44](https://github.com/ricku44))
- Bridgeless: Add support for legacy UIManager in UIManagerHelper ([10c3292694](https://github.com/facebook/react-native/commit/10c32926949aa5c6432be2d949d8412af5c3a1f2))
- Fall back to eager view manage loading for Bridgeless ([6b3289bc73](https://github.com/facebook/react-native/commit/6b3289bc731eb5c4855dbd349d926fa2e4e3595b))
- Ensure namespace is specified for all the 3rd party libraries ([13ae11152a](https://github.com/facebook/react-native/commit/13ae11152a51444c0d8494faa1fcd221d0d89f2f) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Fix RNTester not showing Redbox when Metro is not connected ([b67bc3ffd3](https://github.com/facebook/react-native/commit/b67bc3ffd3fe6db3d2fd9e5796bf02815cb29408))
- Deprecate CompositeReactPackageTurboModuleManagerDelegate ([6f11334c42](https://github.com/facebook/react-native/commit/6f11334c42169b64964bb48c2839c9d563045259) by [@mdvacca](https://github.com/mdvacca))
- Enable fast refresh banner for Bridgeless ([66fbab2586](https://github.com/facebook/react-native/commit/66fbab258638f189734da3533ff83388be57e84e))
- Add DoNotStripAny to JSTimerExecutor ([56683b0c77](https://github.com/facebook/react-native/commit/56683b0c777413e6d76fdb6494295922ae3d4a13))
- Enabling Explicit API warning, this will be changed as Strict in a future version ([490b51c7c3](https://github.com/facebook/react-native/commit/490b51c7c38884f13c4b5d15ab0b7cad473a48d8) by [@mdvacca](https://github.com/mdvacca))
- Add Add ExceptionsManagerModule to CoreReactPackage ([4d70337fb5](https://github.com/facebook/react-native/commit/4d70337fb52bb66b0f749ac9958a3da1b24f6b54))
- Reducing visibility of FrescoBasedReactTextInlineImageSpan ([be1c3cb3ca](https://github.com/facebook/react-native/commit/be1c3cb3caf427cdf2b7a7517370af70852c0465) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of FrescoBasedReactTextInlineImageShadowNode ([f158939efa](https://github.com/facebook/react-native/commit/f158939efa544567ce37226f3b78714978b02286) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of RefreshEvent ([e96cbcc4dc](https://github.com/facebook/react-native/commit/e96cbcc4dc709ec5b7687018c06a0dc38bf967e0) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of VelocityHelper ([05064dc660](https://github.com/facebook/react-native/commit/05064dc66093974f6cd7a126bc23b72b337a4cf1) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ReactScrollViewAccessibilityDelegate ([a81481cb0c](https://github.com/facebook/react-native/commit/a81481cb0c02b40229af0ac83531bdbcbae2ae60) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of MaintainVisibleScrollPositionHelper ([88a4be378f](https://github.com/facebook/react-native/commit/88a4be378f47fc45e3e4f625a9be2d9662f93897) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ScaleTypeStartInside ([0d0e0e1b53](https://github.com/facebook/react-native/commit/0d0e0e1b53e17cd9844e4267ff96c9903369e226) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ReactImageDownloadListener ([9582f98099](https://github.com/facebook/react-native/commit/9582f98099709f1097544515e30f938b56dbf9f6) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ReactEventEmitter ([fa1a29bdc0](https://github.com/facebook/react-native/commit/fa1a29bdc0f29980424eaf7f788c5d85aa01fae5) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of YogaNodePool ([aa4490df11](https://github.com/facebook/react-native/commit/aa4490df11213c31749785789b39a24d13b7ec64) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ViewHierarchyDumper ([0316f8d117](https://github.com/facebook/react-native/commit/0316f8d117623167e38127d5adc9c6a647b1abd9) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ShadowNodeRegistry ([e2aae65dd4](https://github.com/facebook/react-native/commit/e2aae65dd4d6cbe57c1f1dee6c8cc6738a8cddc3) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of NoSuchNativeViewException ([4f6a74438d](https://github.com/facebook/react-native/commit/4f6a74438d38f2a82dc674b3d3c3bfac2a1e845c) by [@mdvacca](https://github.com/mdvacca))
- Bump Gradle to 8.4 ([81213f6524](https://github.com/facebook/react-native/commit/81213f652427d35219bf491bb84418d8c9faa2cb) by [@cortinico](https://github.com/cortinico))
- Bump AGP to 8.1.2 ([22388fe938](https://github.com/facebook/react-native/commit/22388fe938a38e0b50dbe42da688cb2e7521e637) by [@cortinico](https://github.com/cortinico))
- Reducing visibility of UnobservedTaskException ([f4023129be](https://github.com/facebook/react-native/commit/f4023129beae7835d92ef2d968f06b180538f391) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ExecutorException ([9d3fa2715d](https://github.com/facebook/react-native/commit/9d3fa2715d6966842a17af66e5b15dbaba9bbe8f) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of Capture ([456335a7eb](https://github.com/facebook/react-native/commit/456335a7eb9b2ffd809b5f5af6a2963ac7683cf4) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of CancellationTokenRegistration ([22a3aeafcf](https://github.com/facebook/react-native/commit/22a3aeafcf80e5d29de49811cd6c93d04157d01d) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of AggregateException ([2c5d976000](https://github.com/facebook/react-native/commit/2c5d9760002d1a2d66e2afcbf3bd9f7f00e15bd2) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ProgressiveStringDecoder ([8c862f6cc4](https://github.com/facebook/react-native/commit/8c862f6cc4a01fb7f90bfdf8f0a7aaf90da824ba) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ProgressRequestBody ([4240eb06ab](https://github.com/facebook/react-native/commit/4240eb06abec070cc2cbc0ca67bdf0a79de386fb) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of HeaderUtil ([fd57f669ff](https://github.com/facebook/react-native/commit/fd57f669ff60e691e1d94460a4b30cde19613652) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of CountingOutputStream ([c5c6954596](https://github.com/facebook/react-native/commit/c5c6954596f0914fcb2057c8e5624c6e4ebf4c39) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of DidJSUpdateUiDuringFrameDetector ([366bcef631](https://github.com/facebook/react-native/commit/366bcef631e4b73fdb2489cb0683f2a4e97f72d2) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of AnimationsDebugModule ([9c8ba251a1](https://github.com/facebook/react-native/commit/9c8ba251a1a278a24556e64aac736e0240100d92) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of NoRetryPolicy ([26c5cba6a9](https://github.com/facebook/react-native/commit/26c5cba6a918327c711e5686ac692673c83e1c4a) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of SendAccessibilityEvent ([90436bb3f8](https://github.com/facebook/react-native/commit/90436bb3f868be7cb5e2f9dd0c65d110cd9d2b9d) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ViewHierarchyUtil ([6464acab36](https://github.com/facebook/react-native/commit/6464acab360565d4693a8ead44c14af6583cda47) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of RedBoxDialogSurfaceDelegate ([3e594ea3dc](https://github.com/facebook/react-native/commit/3e594ea3dc7d9d55e5afe3346b411f9b34f2ce73) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of MultipartStreamReader ([b8cded3df6](https://github.com/facebook/react-native/commit/b8cded3df63818c06df7a0e7a7a0ae79a4ac475a) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of LogBoxDialogSurfaceDelegate ([f46bc717cd](https://github.com/facebook/react-native/commit/f46bc717cd4a37140f5b96b8753f0a40c5559742) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of LogBoxDialog ([c9417ff5f4](https://github.com/facebook/react-native/commit/c9417ff5f42946ddda08df401625b9088285efce) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of FpsView ([55d0ac6ab3](https://github.com/facebook/react-native/commit/55d0ac6ab3ed8ac3440c5891fdd9ef92eca1635f) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of UIManagerProvider ([0939908f67](https://github.com/facebook/react-native/commit/0939908f670b2da68a13448f07099d32a274d6e7) by [@mdvacca](https://github.com/mdvacca))
- Use NDK 26 ([9ce7b56413](https://github.com/facebook/react-native/commit/9ce7b564131c5b2075489c09ff05325ddc28014a) by [@NickGerleman](https://github.com/NickGerleman))
- Rewrite RNTesterApplication to Kotlin, add AnnotationTarget property. ([c4110d0475](https://github.com/facebook/react-native/commit/c4110d0475c27da9fac4161ed8ee376757b47429) by [@Mod3rnx](https://github.com/Mod3rnx))
- Rewrite ReactPropAnnotationSetterTest to Kotlin, ([ea88338d75](https://github.com/facebook/react-native/commit/ea88338d75d38e6639636eca58e824ed7e796403))
- Reducing visibility of PerformanceCounter ([614afb5983](https://github.com/facebook/react-native/commit/614afb598335de388d15f9d9f2ec67d1b6db2790) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of NativeArrayInterface ([e46372ffa4](https://github.com/facebook/react-native/commit/e46372ffa4e614e903717c3c5e57a30d444ec4a4) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of NativeArgumentsParseException ([970ea5e476](https://github.com/facebook/react-native/commit/970ea5e476738399e06221fe729044e2137e0f8b) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of JSInstance ([d224816ed1](https://github.com/facebook/react-native/commit/d224816ed1095f5daf844f689d683c61c6f1a3a8) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of JSIModuleRegistry. ([e3e9b1388f](https://github.com/facebook/react-native/commit/e3e9b1388f9805636afc354032d3f7bf3ad4eb1f) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of JSIModuleHolder ([9ba05493b8](https://github.com/facebook/react-native/commit/9ba05493b82896250547499bb02529b4082b7836) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of JSCJavaScriptExecutorFactory ([11d51fe395](https://github.com/facebook/react-native/commit/11d51fe39596ad6fde37e5e3feca06dcef137fa5) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of DynamicFromMap ([7a5824b416](https://github.com/facebook/react-native/commit/7a5824b4167c8f56620e5efc89b8c1f1a4cbd96d) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of DynamicFromArray ([d6cd496c44](https://github.com/facebook/react-native/commit/d6cd496c440e038053e8b5ef84092f558d242ca1) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of DecayAnimation ([5d386b795e](https://github.com/facebook/react-native/commit/5d386b795e9962217cd1571b33550bf5cac392df) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of AnimatedNodeWithUpdateableConfig ([5bbc89e4be](https://github.com/facebook/react-native/commit/5bbc89e4be6b0ccf9fda2ce1510f52839182c73d) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of AnimatedNodeValueListener ([f202d1b44b](https://github.com/facebook/react-native/commit/f202d1b44b0253e5680f72150e10fc7cbf7ba0da) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ReactPackageHelper ([7e00f536b3](https://github.com/facebook/react-native/commit/7e00f536b37890bc2503750468c7db7b4a9f502e) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ReactTextInputKeyPressEvent ([c7564c76f3](https://github.com/facebook/react-native/commit/c7564c76f3c77769629b8ae720a9d3a8417c117f) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of ReactAndroidHWInputDeviceHelper ([93b1dc9633](https://github.com/facebook/react-native/commit/93b1dc9633e9e28c24c6f20dc82e8699b430bf6b) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of EagerModuleProvider ([78097648d3](https://github.com/facebook/react-native/commit/78097648d305b35b17cbc11626a5b25a2ea77292) by [@mdvacca](https://github.com/mdvacca))
- Reducing visibility of CanvasUtil ([aad82f5032](https://github.com/facebook/react-native/commit/aad82f50325869eeb906273e554a242ea85f715f) by [@mdvacca](https://github.com/mdvacca))
- Fully rollout FabricSharedEventPipeline ([91fe3b484b](https://github.com/facebook/react-native/commit/91fe3b484b8e0807e4edaaa6ed4bb5c2f540e9fd) by [@mdvacca](https://github.com/mdvacca))
- Support grouped focus for switch ([06c295c58f](https://github.com/facebook/react-native/commit/06c295c58fe5449ecbf69bfb52bb8e52cd64308b) by [@carmenvkrol](https://github.com/carmenvkrol))
- Expose `react_render_textlayoutmanager` via prefab. ([642b4e5c2c](https://github.com/facebook/react-native/commit/642b4e5c2c80b6f46429b41f36489eb81ac8a06e) by [@tomekzaw](https://github.com/tomekzaw))
- Expose `rrc_text` via prefab. ([1c69100a2b](https://github.com/facebook/react-native/commit/1c69100a2b822309c210733a33a57ebb560a1c71) by [@tomekzaw](https://github.com/tomekzaw))
- Expose `rrc_textinput` via prefab. ([adc9e5b0fa](https://github.com/facebook/react-native/commit/adc9e5b0faaf8c997fe0d09aecd56747026f8b01) by [@tomekzaw](https://github.com/tomekzaw))
- Rename `PopupMenuAndroidNativeComponent.js` to `PopupMenuAndroidNativeComponent.android.js` ([fcabb2ad21](https://github.com/facebook/react-native/commit/fcabb2ad21b2c17f4e0d40b0637c22ba84568038) by [@cipolleschi](https://github.com/cipolleschi))

#### iOS specific

- Make RCTConvert an Objective-C++ (`.mm`) file in prep for DisplayP3 changes ([267ea2661a](https://github.com/facebook/react-native/commit/267ea2661aa1fb434422c39094c98713d9853be7) by [@cipolleschi](https://github.com/cipolleschi))
- Migrated RNTester/AppDelegate to the new notification callback ([ccff2bb8d1](https://github.com/facebook/react-native/commit/ccff2bb8d19b2db244f30293b4e8d68a524c2059))
- Add the for the dismissal snapshot only when we need it. ([7c4afa1006](https://github.com/facebook/react-native/commit/7c4afa1006ac07e07345682d91fd36ac0025b8a9) by [@cipolleschi](https://github.com/cipolleschi))
- Use less verbose Auto Layout API for RCTRedBox constraints ([b311c3e0a0](https://github.com/facebook/react-native/commit/b311c3e0a00bf8051194bbb5072a9341cf3f6e10) by [@okwasniewski](https://github.com/okwasniewski))
- Refactor `RCTKeyWindow` to be more resilient and work in multi-window apps ([782e9eace9](https://github.com/facebook/react-native/commit/782e9eace974baefba7d8978739f11fe1ea70dc9) by [@okwasniewski](https://github.com/okwasniewski))
- Add `NDEBUG` flag for Release builds for both architectures ([1a0e1741c0](https://github.com/facebook/react-native/commit/1a0e1741c0ab4f22b57a6a7ee86ff4287fa09103) by [@tjzel](https://github.com/tjzel))
- ScrollEventThrottle no longer needs to be set for continuous scroll events ([10b3e0e868](https://github.com/facebook/react-native/commit/10b3e0e8688a7a140578fe25e799d4b379595e69) by [@NickGerleman](https://github.com/NickGerleman))
- `scrollEventThrottle` no longer needs to be set for continuous scroll events when using the new architecture. ([56b57e2db4](https://github.com/facebook/react-native/commit/56b57e2db4d75b32706ebbaa5bee02d48beab945) by [@NickGerleman](https://github.com/NickGerleman))
- Update 'cannot calculate shadow efficiently' log message to explicitly say solid background ([94c7661206](https://github.com/facebook/react-native/commit/94c76612062c548782cb9b033398467cb8a079e4) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Retrieve screen scale from trait collection instead of UIScreen mainScreen ([ace81ff7d8](https://github.com/facebook/react-native/commit/ace81ff7d81b2eb547ad93b8000c5906dfefd9d3) by [@okwasniewski](https://github.com/okwasniewski))
- Migrate RCTTextView to UIEditMenuInteraction ([e08a1973f6](https://github.com/facebook/react-native/commit/e08a1973f67d85acc157111c749c43572469e4c2) by [@okwasniewski](https://github.com/okwasniewski))
- Update SocketRocket to 0.7.0 ([bab9c839ea](https://github.com/facebook/react-native/commit/bab9c839eaad1ffc358fa5c87440a6de7cbe981b) by [@Saadnajmi](https://github.com/Saadnajmi))
- Align all pods to 13.4 ([c852955e4b](https://github.com/facebook/react-native/commit/c852955e4bb8454e44507c34653c5f76f4f1f130) by [@cipolleschi](https://github.com/cipolleschi))
- Rename `RCTRootViewFrameDidChangeNotification` as it's not tracking root view frame changes ([625d0ece6d](https://github.com/facebook/react-native/commit/625d0ece6da80df6e3e3ee7daa1f7f59ddbbf387) by [@Saadnajmi](https://github.com/Saadnajmi))
- Matched behaviour for allowsEdgeAntialiasing to old architecture. ([6fb0fbadc0](https://github.com/facebook/react-native/commit/6fb0fbadc0a39ab95f22fdb5101dc55596aa2114) by [@javache](https://github.com/javache))
- Bump SocketRocket to 0.6.1 ([8b88883071](https://github.com/facebook/react-native/commit/8b88883071693cf67db41fec79d4068392e77f2a) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Deterministic onLayout event ordering for iOS Paper ([56ddace9c8](https://github.com/facebook/react-native/commit/56ddace9c8ffdde5485f1dbe4c5004070cf78262) by [@NickGerleman](https://github.com/NickGerleman))
- Rearrange RNComponentViewUpdateMask value ([476a323e0d](https://github.com/facebook/react-native/commit/476a323e0d5c7c0876899e9de6460c069720655e) by [@zhongwuzw](https://github.com/zhongwuzw))
- Move `[RCTConvert  RCTTransformOrigin:]` out of UIAccessibilityTraits category ([c7aa3954e3](https://github.com/facebook/react-native/commit/c7aa3954e347352b9e800cb9ec3b4e9800366250) by [@Saadnajmi](https://github.com/Saadnajmi))
- Remove `<Webkit/Webkit.h>` import in `RCTConvert.h` ([452bf0ff06](https://github.com/facebook/react-native/commit/452bf0ff069b77fc880c57fcb86dbe44ac7285fc) by [@Saadnajmi](https://github.com/Saadnajmi))

### Deprecated

- Deprecate BatchedBridge.registerCallableModule. Please use registerCallableModule instead ([7f549ec7be](https://github.com/facebook/react-native/commit/7f549ec7bebecddcb13087ab132f38c4eb68ef97) by [@RSNara](https://github.com/RSNara))
- Warn when fabric is used without concurrent root ([c06807154b](https://github.com/facebook/react-native/commit/c06807154b309bd85626a5e9ca2f23ac7a7750b6) by [@javache](https://github.com/javache))
- Replace RAIICallbackWrapperDestroyer with AsyncCallback (re-land) ([fbd8504cc0](https://github.com/facebook/react-native/commit/fbd8504cc0df8d65fd1782eafcab7b9d464d539b) by [@javache](https://github.com/javache))
- Deprecated RAIICallbackWrapperDestroyer. Use AsyncCallback instead for safe jsi::Function memory ownership. ([8dd89cee1b](https://github.com/facebook/react-native/commit/8dd89cee1b69c953fa01818c588b86fd96f1ce4d) by [@javache](https://github.com/javache))
- Refactor BaseJavaModule and ReactContextBaseJavaModule ([5af7b7038c](https://github.com/facebook/react-native/commit/5af7b7038c730289cd8420060c039197f45e7397) by [@mdvacca](https://github.com/mdvacca))

#### Android specific

- Deprecate UIManager.showPopupMenu, and UIManager.dismissPopupMenu ([8a8f74b7b2](https://github.com/facebook/react-native/commit/8a8f74b7b2355b78bcdc7d8a23bf5ef5f0b93926) by [@RSNara](https://github.com/RSNara))
- Deprecate FabricViewStateManager ([4fdc5945b1](https://github.com/facebook/react-native/commit/4fdc5945b1e00d23b6b149070b9403b436fd48ff) by [@sammy-SC](https://github.com/sammy-SC))

#### iOS specific

- **Un-deprecates** `RCTAppSetupPrepareApp` (reverts #41976) ([ce3ce1194b](https://github.com/facebook/react-native/commit/ce3ce1194baacb62dbac50f59444618921d03316) by [@huntie](https://github.com/huntie))
- Retrieving initial notification requires UNUserNotificationCenterDelegate setup instead of reading UIApplicationLaunchOptionsLocalNotificationKey ([c8ab44cf0b](https://github.com/facebook/react-native/commit/c8ab44cf0b1e63ac7224147f3df1f414a29b65a0) by [@philIip](https://github.com/philIip))
- Deprecating RCTPushNotificationManager's didReceiveLocalNotification: and didReceiveRemoteNotification: ([1b85ed94a1](https://github.com/facebook/react-native/commit/1b85ed94a1a8b9d4c53d2129b8d5f5329fef35c5))
- Deprecate `[RCTConvert UIBarStyle:]` ([157cb0e02b](https://github.com/facebook/react-native/commit/157cb0e02b6328e8b640f2b302a11c298a240493) by [@Saadnajmi](https://github.com/Saadnajmi))
- Deprecate `RCTAppSetupPrepareApp`, replaced with C++ overload ([7a4950b366](https://github.com/facebook/react-native/commit/7a4950b366ab20c1064c849a3739a3d455400d16) by [@huntie](https://github.com/huntie))
-  ([a0efa26065](https://github.com/facebook/react-native/commit/a0efa26065a4833d3f950f6ad8fd7a7deee432a3) by [@philIip](https://github.com/philIip))
-  ([9b1f8a81e9](https://github.com/facebook/react-native/commit/9b1f8a81e9af971af6ddc1dc4ef96302bf4a08d7) by [@philIip](https://github.com/philIip))
- Deprecate RCTGetMultiplierForContentSizeCategory ([f174f028cf](https://github.com/facebook/react-native/commit/f174f028cfae29735e3f04ad5f42079b67658642) by [@Saadnajmi](https://github.com/Saadnajmi))
- Deprecate `getSurfacePresenter` and `getModuleRegistry` for `surfacePresenter` and moduleRegistry` props. ([c3b0a8f162](https://github.com/facebook/react-native/commit/c3b0a8f1626939cf5c7b3864a5acf9d3dad26fb3) by [@cipolleschi](https://github.com/cipolleschi))

### Removed

### Fixed

- Fix JSExecutor build error on Windows ([1c4ed12370](https://github.com/facebook/react-native/commit/1c4ed12370101c12e9c5390733ec42469ca9cfd7))
- Declare missing peer dependency `react` ([62c15bacaa](https://github.com/facebook/react-native/commit/62c15bacaac160d0858a76946217a2bfffb08b6d) by [@jbroma](https://github.com/jbroma))
- Log Codegen supported platforms if any are available ([2ca7bec0c2](https://github.com/facebook/react-native/commit/2ca7bec0c2a7d821ceaaf39840a6cdc5eceb8678) by [@okwasniewski](https://github.com/okwasniewski))
- Call onStartReached initially when list is small and `onEndReached` is called ([4dcc1d3efb](https://github.com/facebook/react-native/commit/4dcc1d3efbd86a4ac42c801af3303e4dae4c0418) by [@janicduplessis](https://github.com/janicduplessis))
- Fix order of Metro hotkey console messages ([635732aa8f](https://github.com/facebook/react-native/commit/635732aa8fedc241d94eb1610dd58635f597b07d) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- Fix `react-native config` failing in pnpm setups ([8f4f09bf70](https://github.com/facebook/react-native/commit/8f4f09bf704fbe5851d72bc5152ada0ab8c733b2) by [@tido64](https://github.com/tido64))
- Fix `react-native/community-cli-plugin` is unable to resolve out-of-tree platforms in monorepos ([e350859d72](https://github.com/facebook/react-native/commit/e350859d72b08ec1367dd98f89a313786171c8b9) by [@tido64](https://github.com/tido64))
- Add type information for items of FlatList in `onViewableItemsChanged` signature ([35f5c3a204](https://github.com/facebook/react-native/commit/35f5c3a204375c2e716cdaa624f6c931ad62520e) by [@miallo](https://github.com/miallo))
- Update typescript definition of `translateX` & `translateX` to be able to use percentage values ([b133bf6024](https://github.com/facebook/react-native/commit/b133bf60245f2b497fecf464c8a8f491294a750f) by [@retyui](https://github.com/retyui))
- Fix UIManagerBinding's findNodeAtPoint ([62e5980954](https://github.com/facebook/react-native/commit/62e59809548034611fdce387e5b72d6bc6b9e6ea) by [@RSNara](https://github.com/RSNara))
- Fix issue with debugger not working when device name contain two-byte UTF characters ([d16531e8a4](https://github.com/facebook/react-native/commit/d16531e8a4c20b848fd71dcca53d11aa8e1a6ac3) by [@kmagiera](https://github.com/kmagiera))
- Inspected elements from React DevTools are now correctly highlighted on a relevant surfaces ([9d846f47c2](https://github.com/facebook/react-native/commit/9d846f47c28089b357e52e428173978df7ee34f1) by [@hoxyq](https://github.com/hoxyq))
- Fix `compose-source-maps.js` failing if `-o` is not specified when it should output the composed source map ([ab192ced69](https://github.com/facebook/react-native/commit/ab192ced6938e647819eaaed983158a1feb3ff81) by [@tido64](https://github.com/tido64))
- Fix remount of header and footer in `SectionList` while transiting between empty and filled state ([0c37f8c85c](https://github.com/facebook/react-native/commit/0c37f8c85cd0db1726fe8269aa0781d27c72c42b) by [@MateWW](https://github.com/MateWW))
- Updated docs to match Android 6.0 (API 23) minimum requirement. ([192a88d522](https://github.com/facebook/react-native/commit/192a88d522befa3b5cc073d441210f8148e8ac69) by [@dcangulo](https://github.com/dcangulo))
- Fix align-content of cross-stretched container ([b7eb0c85a2](https://github.com/facebook/react-native/commit/b7eb0c85a20ff01ae400df786fa238f362854cb6) by [@NickGerleman](https://github.com/NickGerleman))
- Fix Yoga sizing and alignment issues with multi-line containers ([b221265f41](https://github.com/facebook/react-native/commit/b221265f4156992fea932ca74f09ac04662a4a37) by [@NickGerleman](https://github.com/NickGerleman))
- Allow source map fetching in the inspector proxy from 127.0.0.1 ([46d304a101](https://github.com/facebook/react-native/commit/46d304a101f19f214607ac8fb93aacec4bfdbc6b))
- Message ([da3ba74240](https://github.com/facebook/react-native/commit/da3ba742404cc71c46cf32d15c92bbd3dd62e89b) by [@Spice-Z](https://github.com/Spice-Z))
- Lint source files, sort imports, remove unused ones ([7d1a98c43b](https://github.com/facebook/react-native/commit/7d1a98c43bc06af602f798c813cb56991447a26e) by [@okwasniewski](https://github.com/okwasniewski))
- Allow Out Of Tree platforms to pass custom resolvers ([4ccd6e1242](https://github.com/facebook/react-native/commit/4ccd6e124278abf3c63765195715ee3ae39a769e) by [@okwasniewski](https://github.com/okwasniewski))
- Update AcitvityIndicator spec default value ([03a840e0a9](https://github.com/facebook/react-native/commit/03a840e0a9ff6c0591557e1bac8e44dcdc72d3a9) by [@zhongwuzw](https://github.com/zhongwuzw))
- Update pkg/repo names in deprecation messages ([fd35c1db28](https://github.com/facebook/react-native/commit/fd35c1db2810c7c147c28ad067194744bf378069) by [@friederbluemle](https://github.com/friederbluemle))
- "yogalayout.com" to "yogalayout.dev" ([99ebcfd3a9](https://github.com/facebook/react-native/commit/99ebcfd3a9c0907e51e8a22b8ff3169a3700747c) by [@NickGerleman](https://github.com/NickGerleman))
- Fix `react-native/codegen` not being able to resolve dependencies in pnpm setups ([c58e19e89a](https://github.com/facebook/react-native/commit/c58e19e89aadcc01c2ac8ead876831ed8a2f6c5d) by [@tido64](https://github.com/tido64))
- Flow syntax errors in Codegen specs are no longer ignored. ([a74765eb0a](https://github.com/facebook/react-native/commit/a74765eb0aaeba7154359ef77f31cc34ecc4b709) by [@motiz88](https://github.com/motiz88))
- Add missing `ping()` method into `WebSocket` interface ([016b62c549](https://github.com/facebook/react-native/commit/016b62c54985e92ce43a97a07b7830b546688221) by [@alexzel](https://github.com/alexzel))
- Add detection of logical assignment operators to `react-native-babel-preset` ([c90485eb10](https://github.com/facebook/react-native/commit/c90485eb10520f969c956b1381eba89e5cc9e072) by [@jonthysell](https://github.com/jonthysell))
- Eslint config global vars redefine there is no message tip ([a2a219c27e](https://github.com/facebook/react-native/commit/a2a219c27ec607190b1c390190026d5166a51f1a) by [@rick-ast](https://github.com/rick-ast))
- Fix windows 4018 and 4244 compiler warnings ([695a30d6b4](https://github.com/facebook/react-native/commit/695a30d6b4d03da02d02a5784f5f30ae6adb6e35) by [@TatianaKapos](https://github.com/TatianaKapos))
- Rollout enableCloseVisibleGapBetweenPaths ([285629922c](https://github.com/facebook/react-native/commit/285629922cafd86914af9ed95ff1fbbd2c5a7c79) by [@javache](https://github.com/javache))
- Move iOS/Android specific prop types appropriate types ([755a7dbf56](https://github.com/facebook/react-native/commit/755a7dbf5644d4f8ee08cba18bfa73a115c8d849) by [@Saadnajmi](https://github.com/Saadnajmi))
- Add `number | null` to `ViewProps['hitSlop']` TypeScript type ([bc16bc5b01](https://github.com/facebook/react-native/commit/bc16bc5b01c50fcfedbc3d32eed5591d9dd7cfce) by [@DimitarNestorov](https://github.com/DimitarNestorov))
- JS Debugging: Fix inspector-proxy to allow for DevTools requests with query strings ([ab81c16b65](https://github.com/facebook/react-native/commit/ab81c16b6507000139d1af52c622e320629750ec))
- Normalize-colors should not impose node >= 18 ([6f1b8edc7a](https://github.com/facebook/react-native/commit/6f1b8edc7a586a3e4c5408d14da1e13c1d88288a) by [@cortinico](https://github.com/cortinico))
- Fixes type casting warnings that are treated as errors downstream in React Native Windows. ([570655d80f](https://github.com/facebook/react-native/commit/570655d80fcb1f213de07af05798897e5dbe42b9) by [@chiaramooney](https://github.com/chiaramooney))
- - [GENERAL] [FIXED] Updated ESLint version to fix `originalKeywordKind` deprecation error ([5de0ddae30](https://github.com/facebook/react-native/commit/5de0ddae302ae1768d5ba40d09afc4ffce9ab5c1) by [@mrousavy](https://github.com/mrousavy))
- JS debugging: prevent dev server crash when a large CDP payload is returned from the device ([d0f750e15d](https://github.com/facebook/react-native/commit/d0f750e15d1fb2e75e1263c66ac5f5be31aa0dc5) by [@motiz88](https://github.com/motiz88))
- Fix new arch example not render in RNTester ([48dcfa1718](https://github.com/facebook/react-native/commit/48dcfa1718d088c44f925814de59ca6ad35d44f2))
- JS debugging: prevent dev server crash when a large CDP payload is returned from the device ([2000acc6c6](https://github.com/facebook/react-native/commit/2000acc6c6cbfd3942062b33c8285e155d404d4a) by [@motiz88](https://github.com/motiz88))
- Update stale ReactAndroid.api values after CI breakage ([a5fbe28c29](https://github.com/facebook/react-native/commit/a5fbe28c2902f0a312175ce366ee204e185efc52) by [@GijsWeterings](https://github.com/GijsWeterings))
- Fix issue where we were not centering absolute nodes correctly when justifying ([983e784a3e](https://github.com/facebook/react-native/commit/983e784a3e7f8c2529a17dcd5850e79e17d00da3) by [@joevilches](https://github.com/joevilches))
- Fix bug where we used border box for size of containing block in a certain case ([5b05c79d8c](https://github.com/facebook/react-native/commit/5b05c79d8cd32c25c53b195999b3866dac5a5600) by [@joevilches](https://github.com/joevilches))
- Make runtime reference thread safe on tickleJs call ([067c989b48](https://github.com/facebook/react-native/commit/067c989b4841d55c521d7b21534e9609d9d2a0a7) by [@blakef](https://github.com/blakef))
- Fix issue where paddingStart and paddingEnd were swapped with row reverse ([2bf1a8f4e0](https://github.com/facebook/react-native/commit/2bf1a8f4e05313287e1d81a460138f4875282e9f) by [@joevilches](https://github.com/joevilches))
- Fix issue where borderStart and borderEnd were swapped with row reverse ([24169e28cf](https://github.com/facebook/react-native/commit/24169e28cf0477bb55be92740bb2c402d8c3eff5) by [@joevilches](https://github.com/joevilches))
- Fix issue where marginStart and marginEnd were not working with rowReverse flex direction ([53279ba426](https://github.com/facebook/react-native/commit/53279ba4267c573d0c471380265a8e4e8fbd6f86) by [@joevilches](https://github.com/joevilches))
- Fix style resolution functions returning FloatOptional ([72d0fed272](https://github.com/facebook/react-native/commit/72d0fed272a84f34294f59d86c79223cea880e6d) by [@NickGerleman](https://github.com/NickGerleman))
- Fix handling of negative flex gap ([aa65e92121](https://github.com/facebook/react-native/commit/aa65e92121e86fbe978e10db80e04fb4999479ef) by [@NickGerleman](https://github.com/NickGerleman))
- Fix ReactInstanceManager to initialize the UIManager ([0f239d3301](https://github.com/facebook/react-native/commit/0f239d3301cce409476370294f782e76cc59a1ec))
- Fix ReactInstanceManager to add getJSIModule() as an alternate path ([e8323781fa](https://github.com/facebook/react-native/commit/e8323781fac8b19bb8a4faa53461c33ff201817b))
- Fixing Bridgeless Exception caused by the UIManager changes ([5e406ccea0](https://github.com/facebook/react-native/commit/5e406ccea023e87a35d939b0f865aec760703035))
- Fix warm start logging for ReactMarker ([44109dc2c0](https://github.com/facebook/react-native/commit/44109dc2c01a76baf37b836a378e6a28d96ea66c))
- Create custom message handler for synthetic page ([652c74104a](https://github.com/facebook/react-native/commit/652c74104af9844bf88dff8eb96d02b4e172720c) by [@byCedric](https://github.com/byCedric))
- Fix undefined props crash in FlatList ([e33767a36d](https://github.com/facebook/react-native/commit/e33767a36daf7901cb46854b6612dd52b0dbdeec) by [@dieguezz](https://github.com/dieguezz))
- Correctly keep ES6Proxy for bridgeless mode ([c35630998b](https://github.com/facebook/react-native/commit/c35630998b73ef7573bd04caf7b9b75d26223283) by [@fkgozali](https://github.com/fkgozali))
- Add missing `registerCallableModule` TypeScript definitions ([6bc95b2074](https://github.com/facebook/react-native/commit/6bc95b2074a794607a34eae201f07dae110c2832) by [@Kudo](https://github.com/Kudo))
- Allow Inspector proxy to inline source maps on LAN connections ([3dee6d31b9](https://github.com/facebook/react-native/commit/3dee6d31b9059e319bf4849797e3ed21c298be70) by [@byCedric](https://github.com/byCedric))
- Fix Bridgeless React Context test in OSS ([bdca260679](https://github.com/facebook/react-native/commit/bdca2606797f50f9ccb064bc7b25cd849ffe5e6c) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- Fix bug where absolute nodes were not insetted correctly in certain cases ([3341ab7cc0](https://github.com/facebook/react-native/commit/3341ab7cc0ba7a8460069cd39ff3060154d96e1a) by [@joevilches](https://github.com/joevilches))

#### Android specific

- Disable the "Open Debugger" item from dev menu if the bundler is disconnected ([7afc8b8623](https://github.com/facebook/react-native/commit/7afc8b8623cc499c3054b9fb5b08cc2b65edb19c) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- Fix linking of local app modules turbomodules ([eb619468c1](https://github.com/facebook/react-native/commit/eb619468c1b61b7261846e62e33f94d89e121455) by [@cortinico](https://github.com/cortinico))
- Fix Reload behavior being different on Bridgeless ([85257a993f](https://github.com/facebook/react-native/commit/85257a993fce5e37e19f03c563bd134982302f51) by [@cortinico](https://github.com/cortinico))
- Fixes Android compile failed. ([aefca27c67](https://github.com/facebook/react-native/commit/aefca27c67df4ab19733e33e26f5457e297e0b5f) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix delivery of events during initial rendering in new architecture ([7b36233ae1](https://github.com/facebook/react-native/commit/7b36233ae19ba7c1fbedc42c15103ea1cfa55ee3) by [@mdvacca](https://github.com/mdvacca))
- Restore missing call to `convertRawPropAliases` ([5e37c1f219](https://github.com/facebook/react-native/commit/5e37c1f2191f1c4886f55a63e931979847cf49a4) by [@NickGerleman](https://github.com/NickGerleman))
-     [Android][Fixed] - Fix incorrect measurement of TextInput when new architecture is enabled ([dc2ce9e66e](https://github.com/facebook/react-native/commit/dc2ce9e66e337ef90a179853467dbb8b09b9d24c) by [@mdvacca](https://github.com/mdvacca))
- Make Android respect metro location from shared preferences for the debugger workflow ([0ea16fd3f7](https://github.com/facebook/react-native/commit/0ea16fd3f748dd239cac6f19f80b007cb2b008f9) by [@kmagiera](https://github.com/kmagiera))
- Assert `DefaultComponentsRegistry::registerComponentDescriptorsFromEntryPoint` is set ([8474e239df](https://github.com/facebook/react-native/commit/8474e239df9de41da2b7a12b15d38871bebdd97f) by [@tido64](https://github.com/tido64))
- Fixed unexpected resizing of ReactRootView for dev bundles in brownfield apps ([5d68c908f1](https://github.com/facebook/react-native/commit/5d68c908f1de52cfe5d6f8b50774ba44c3dcc9be) by [@hoxyq](https://github.com/hoxyq))
- Fix: prevent scroll event in nested scroll when scrollEnabled={false} ([c7873b77b8](https://github.com/facebook/react-native/commit/c7873b77b8149966e9171783e42cfde6971fbd41) by [@Icehunter](https://github.com/Icehunter))
- Update getDefaultJSExecutorFactory to load Hermes first and fallback to JSC ([70a757fc1e](https://github.com/facebook/react-native/commit/70a757fc1ede08fcb9d5014f3b05c94e5badaea7) by [@cortinico](https://github.com/cortinico))
- Update profiler button to use "Toggle" string. ([8bcaed90c1](https://github.com/facebook/react-native/commit/8bcaed90c11e292da199545f701fd44ecb07ec95) by [@szymonrybczak](https://github.com/szymonrybczak))
- Typos in `ReactCompoundViewGroup` comments ([385473522c](https://github.com/facebook/react-native/commit/385473522cbc525aad08500f5a752dea734c14c3) by [@kkafar](https://github.com/kkafar))
- Fix AndroidTextInputProps Detection of Padding ([4016bfbc37](https://github.com/facebook/react-native/commit/4016bfbc377215d2929de732f682bc9d1c823f39) by [@NickGerleman](https://github.com/NickGerleman))
- Fix type in BlobCollector.h/cpp ([c267a0679d](https://github.com/facebook/react-native/commit/c267a0679d21908e6e8026ca5ee542a9b571fb8b) by [@Sunbreak](https://github.com/Sunbreak))
- Fixed an issue where the status bar colors would not match when opening modals ([e8d622e9d1](https://github.com/facebook/react-native/commit/e8d622e9d118a7fcf71a14d665b2d2bf33dd0b1f))
- Bump Fresco to 3.1.3 ([dca81e6172](https://github.com/facebook/react-native/commit/dca81e6172aadd62a8cb7c2fdb9d08d853119215) by [@cortinico](https://github.com/cortinico))
- Fix crash with `java.lang.NoSuchMethodError` for Bridgeless ([b22f566104](https://github.com/facebook/react-native/commit/b22f566104d2d5d12867478a96ff5a0aa4911336) by [@cortinico](https://github.com/cortinico))
- B1fccb05ccb306005dc7616a4eaaa182b0b1deaf bumped fresco version to 3.1.0. ([fbc28fa73d](https://github.com/facebook/react-native/commit/fbc28fa73d075b49e263f1dd12f9a858bc8f97ef) by [@lafest](https://github.com/lafest))
- Ensure that `configureJavaToolChains` is only executed once during configuration ([c7d969f31b](https://github.com/facebook/react-native/commit/c7d969f31b1d584f593dfcbf119765b5efa4bc95) by [@UNIDY2002](https://github.com/UNIDY2002))
- Fix the crash in ReactViewGroup of https://github.com/facebook/react-native/issues/30785 ([b9418315e2](https://github.com/facebook/react-native/commit/b9418315e274f8693d1f7cd3f41529ba6c0436c9))
- Handle Crash for onRequestPermissionsResult ([925209932a](https://github.com/facebook/react-native/commit/925209932aa20f6c70e9642c5ab8dec8ac83a1cd) by [@chakrihacker](https://github.com/chakrihacker))
- Fix instacrash on bridgeless due to calling showMessage on null instance ([2f1ecea1cb](https://github.com/facebook/react-native/commit/2f1ecea1cb70edb878bb6c984da236aec49d0ba1) by [@cortinico](https://github.com/cortinico))
- Allow non-ascii header values on Android and add utf-8 filename fallback in FormData ([7c7e9e6571](https://github.com/facebook/react-native/commit/7c7e9e6571c1f702213e9ffbb40921cd5a1a786b) by [@robertying](https://github.com/robertying))
- Fix InteropUIBlockListener to support react-native-view-shot on Bridgeless ([24a3dade29](https://github.com/facebook/react-native/commit/24a3dade2993df8e4cc3ee7d5f8bea412f73c202) by [@cortinico](https://github.com/cortinico))
- Fix Android HorizontalScrollView fling when content length less than ScrollView length ([7d180d7127](https://github.com/facebook/react-native/commit/7d180d7127e30cfdf2213e088b79e11b55866816) by [@NickGerleman](https://github.com/NickGerleman))
- Fixed prefab header paths for `rrc_text` and `rrc_textinput` ([623bbe6bd6](https://github.com/facebook/react-native/commit/623bbe6bd628bd8b9305f6b7e4469fdd382fb700) by [@j-piasecki](https://github.com/j-piasecki))
- Fix build from source for hermes-engine
 ([a1171f79f8](https://github.com/facebook/react-native/commit/a1171f79f81cd924237570a456974b17c67c3ade) by [@cortinico](https://github.com/cortinico))
- Fix bridgeless configuration to include DebuggingOverlay in react packages ([ad9368068a](https://github.com/facebook/react-native/commit/ad9368068a447b7a135cb0cb6ded0dec27ceef5c) by [@hoxyq](https://github.com/hoxyq))
- React-Native-Restart in release ([b282e87729](https://github.com/facebook/react-native/commit/b282e877297854a5ac57c7c26b7e6635fa89d425) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- Do not crash on onJSBundleLoadedFromServer when fast-refreshing on bridgeless mode ([44e5bc9e2c](https://github.com/facebook/react-native/commit/44e5bc9e2c73235ba5d8bf0f5323181948e74197) by [@cortinico](https://github.com/cortinico))
- Re-enable listing Hermes debugger targets in chrome://inspect, broken in 0.74 RC ([4cfac8eea6](https://github.com/facebook/react-native/commit/4cfac8eea63129059559f0a65c038dfe95e12d7c) by [@motiz88](https://github.com/motiz88))
- Fix registration of ViewManagers in new renderer when not using lazyViewManagers. ([fb9872d4fe](https://github.com/facebook/react-native/commit/fb9872d4fe07ac7028ce536200632b3543d5e8a9) by [@javache](https://github.com/javache))
- NullPointerException is no longer ignored in MessageQueueThreadHandler ([5f45700bd0](https://github.com/facebook/react-native/commit/5f45700bd06fb253650c8653b511b084b99eeb7f) by [@javache](https://github.com/javache))
- Properly handle RR and CMD+M in Bridgeless Mode ([e9f66d9c0c](https://github.com/facebook/react-native/commit/e9f66d9c0c5308a75a3c7a0c34d748cdb2cd833f) by [@cortinico](https://github.com/cortinico))
- Bring back the UNSET constant to TextAttributeProps. ([9700540bec](https://github.com/facebook/react-native/commit/9700540bec67d221f72fd1d17e918538ffca7a8a) by [@dmytrorykun](https://github.com/dmytrorykun))
- Fix bridge mode by constructing ReactDelegate correctly ([a25004c86c](https://github.com/facebook/react-native/commit/a25004c86c9fe5b74a54ba913c2ce94f9b1b9b31) by [@cortinico](https://github.com/cortinico))
- Fixed possible deadlock in dispatchViewUpdates ([b2ca41eef5](https://github.com/facebook/react-native/commit/b2ca41eef59b17d212b35baa4a28c4b27a465b5c) by [@EvertEt](https://github.com/EvertEt))

#### iOS specific

- Resolving case sensitivity issue in header file import ([d655fee28b](https://github.com/facebook/react-native/commit/d655fee28be56ba42ae151daba4db84617683f27) by [@zhongwuzw](https://github.com/zhongwuzw))
- Pass the right flags to libraries ([5164e83c3b](https://github.com/facebook/react-native/commit/5164e83c3b24126c4cfcf916e88e737d26f8b76e) by [@cipolleschi](https://github.com/cipolleschi))
- Make sure that `addUIBlock` provides a Dictionary-look-alike object that returns the right views when queried. ([f61f87c5ef](https://github.com/facebook/react-native/commit/f61f87c5ef33cc8098f937aef4a9bd0634b16159) by [@cipolleschi](https://github.com/cipolleschi))
- Perf Monitor option not showing in Bridgeless ([209140046b](https://github.com/facebook/react-native/commit/209140046b451170315f9f30a19644a04ab80207) by [@okwasniewski](https://github.com/okwasniewski))
- Make sure to forward touches to the wrapped component in the InteropLayer. ([ab5e2e8099](https://github.com/facebook/react-native/commit/ab5e2e8099870a313ab2d24344f336604273f573) by [@cipolleschi](https://github.com/cipolleschi))
- Generate the RCTModulesConformingToProtocolsProvider only once in user space ([a3998f8d15](https://github.com/facebook/react-native/commit/a3998f8d15c6b0724039675ba4ead177ae9d7319) by [@cipolleschi](https://github.com/cipolleschi))
- Make sure that Modal is dismissed correctly in Paper ([4236538cbd](https://github.com/facebook/react-native/commit/4236538cbd36d5bc607b3108df45fc51fc8335db) by [@cipolleschi](https://github.com/cipolleschi))
- Fixed support for event name override in component specs. ([6974697b04](https://github.com/facebook/react-native/commit/6974697b049eff0038a17e3ebf962ec7451a5aa4) by [@dmytrorykun](https://github.com/dmytrorykun))
- Make [RCTBridge currentBridge] work in bridgeless mode ([f6f461593b](https://github.com/facebook/react-native/commit/f6f461593bf929aa5d3798fa277f8324ece36f0e) by [@cipolleschi](https://github.com/cipolleschi))
- Initialize the A11yManager in the main queue and when we need it. ([dc38988bcc](https://github.com/facebook/react-native/commit/dc38988bcc160e387fe1d821f80eb42de47d11c5) by [@cipolleschi](https://github.com/cipolleschi))
- Make font resolution work when using specific font name on the new architecture ([61774088d7](https://github.com/facebook/react-native/commit/61774088d79ac3ab730fa55d175d681b10ae50f3) by [@j-piasecki](https://github.com/j-piasecki))
- Disable the "Open Debugger" item from dev menu if packager is disconnected ([bc3fe0d76d](https://github.com/facebook/react-native/commit/bc3fe0d76d9ca7613115d5f10b85ba7608561c02) by [@EdmondChuiHW](https://github.com/EdmondChuiHW))
- Don't add compiler conditionals when no platforms are specified ([1ce7bfd8c9](https://github.com/facebook/react-native/commit/1ce7bfd8c97998be678884986cf774178bef1185) by [@okwasniewski](https://github.com/okwasniewski))
- Fix TextInput vertical alignment issue when using lineHeight prop on iOS without changing Text baseline (Paper - old arch) ([349d5502d0](https://github.com/facebook/react-native/commit/349d5502d0f0a7e8f66bedb3b8416dca37a41b76) by [@fabOnReact](https://github.com/fabOnReact))
- Align the the bundleURL API from `RCTAppDelegate` to template's `AppDelegate` ([ebb55a780a](https://github.com/facebook/react-native/commit/ebb55a780a31ee985f48536b3eb7794cdff03304) by [@cipolleschi](https://github.com/cipolleschi))
- Bring back support for defining external libraries in react-native.config.js ([c6c23042a4](https://github.com/facebook/react-native/commit/c6c23042a4cdad0a44eb970dd40d9536e725767a) by [@dmytrorykun](https://github.com/dmytrorykun))
- Immediately set props of Components that goes through the interop layer ([68ae8cd5e9](https://github.com/facebook/react-native/commit/68ae8cd5e982db7778a8f9b3aa68494912d75d91) by [@cipolleschi](https://github.com/cipolleschi))
- [iOS] Fixes the root view's background color in bridgeless mode ([0bbc311c8a](https://github.com/facebook/react-native/commit/0bbc311c8ac45577c5ba5a58443380621e807faf) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix retrieving current appearance in multi-window apps ([d00d35e872](https://github.com/facebook/react-native/commit/d00d35e8723293b0c1e098fa2e02756884a0f7f9) by [@okwasniewski](https://github.com/okwasniewski))
- Refactored RCT_handleKeyCommand to avoid concurrency issues ([8d710bfaca](https://github.com/facebook/react-native/commit/8d710bfaca6b57291bf953bda848f3cf64ae2818) by [@cipolleschi](https://github.com/cipolleschi))
- Fixed potential threading issues accessing UIKit from background in RCTAlertManager ([8c4979e7a1](https://github.com/facebook/react-native/commit/8c4979e7a1ecb140b0b068d686b1ec6aab452121) by [@fkgozali](https://github.com/fkgozali))
- Fixed `DoubleConversion` build error from Swift integration ([631b6a12c5](https://github.com/facebook/react-native/commit/631b6a12c5968510b435080c87f06d03069615cb) by [@Kudo](https://github.com/Kudo))
- IOS Add React-debug to ReactCommon.podspec ([ea0e826c28](https://github.com/facebook/react-native/commit/ea0e826c2804f0c775030e76776fb3ac22978fda) by [@christophpurrer](https://github.com/christophpurrer))
- Remove an early return to suppress a deprecated API warning for `UIMenuController` ([6801fc3f9b](https://github.com/facebook/react-native/commit/6801fc3f9bf172f5ca929127576558be04e3f99c) by [@Saadnajmi](https://github.com/Saadnajmi))
- Bring the old RCT_NEW_ARCH_ENABLED semantic back for compatibility ([3690e4413b](https://github.com/facebook/react-native/commit/3690e4413be0459b2e5fc42ca266c1a03f3c04fa) by [@cipolleschi](https://github.com/cipolleschi))
- Fixed archiving for macos catalyst on react-native 0.73.1 in xcode ([aa2d613cfa](https://github.com/facebook/react-native/commit/aa2d613cfa760b4570ae659c5efa4620308807ce) by [@kesha-antonov](https://github.com/kesha-antonov))
- Fix RCTAppSetupPrepareApp.h import error from Objective-C *.m files ([de0c43ead4](https://github.com/facebook/react-native/commit/de0c43ead4d1503e708d2dafa3f5b7fc550fc01a) by [@Kudo](https://github.com/Kudo))
- Fixes `with-environment.sh` script for the case when Node can't be found prior to loading `.xcode.env` ([c684f9fc62](https://github.com/facebook/react-native/commit/c684f9fc62e865a5ecbd8ade0f5628f016eebcb2) by [@birdofpreyru](https://github.com/birdofpreyru))
- Further cleaned up RCT_USE_HERMES ([d50c9068a9](https://github.com/facebook/react-native/commit/d50c9068a927ec1fa0c574a4483dc7c03dca75f5) by [@fkgozali](https://github.com/fkgozali))
- Fix support for --sourcemap-output path containing spaces ([e25a9b4c5d](https://github.com/facebook/react-native/commit/e25a9b4c5d0e4c32dbc1eca071911e34faa177ce) by [@JorenVos](https://github.com/JorenVos))
- Move old props and prop diffing to the interop layer adapter ([3b80531f32](https://github.com/facebook/react-native/commit/3b80531f3247bee83a2e63a1ee31ca56ab15d024) by [@cipolleschi](https://github.com/cipolleschi))
- Optimise RCTKeyWindow() calls in RCTForceTouchAvailable method ([90fb73e83c](https://github.com/facebook/react-native/commit/90fb73e83caf087659b6b3173edd457b4f1d1987) by [@okwasniewski](https://github.com/okwasniewski))
- Fixed strict prototype warning when using the RCT_EXTERN_REMAP_MODULE macro. ([746ad378c7](https://github.com/facebook/react-native/commit/746ad378c7efe3ee2f4926ab30e5401407f8b3ba) by [@dehlen](https://github.com/dehlen))
- Add safe guard when receive network response data too long ([3c4517ffb6](https://github.com/facebook/react-native/commit/3c4517ffb63d6adfdac5f9f7d51d834a22ac2cd9) by [@zhongwuzw](https://github.com/zhongwuzw))
- The wrong height result of onContentSizeChange callback ([5217cc972a](https://github.com/facebook/react-native/commit/5217cc972ae8b95c12f99b93619bd4399382e7e6) by [@zyestin](https://github.com/zyestin))
- Fix cleanAssetCatalog error ([d5114a4b9f](https://github.com/facebook/react-native/commit/d5114a4b9f079bc0d643f3d6f303310bd78074eb) by [@janicduplessis](https://github.com/janicduplessis))
- Fixes ScrollView contentInsetAdjustmentBehavior assignment ([86df742e73](https://github.com/facebook/react-native/commit/86df742e73ecacbf29921ab6f74333c36a7dca26) by [@zhongwuzw](https://github.com/zhongwuzw))
- Network invalidate handlers  to cleanup in turbo module mode ([44d6e4310c](https://github.com/facebook/react-native/commit/44d6e4310cc9ad0d711d05e8dd5ee5220738e5b5) by [@zhongwuzw](https://github.com/zhongwuzw))
- Move ActionSheet UI operation to main thread ([aa9e824a75](https://github.com/facebook/react-native/commit/aa9e824a756a86f61873c270b17603468a2166ec) by [@zhongwuzw](https://github.com/zhongwuzw))
- Move UIRequiredDeviceCapabilities for RNTester to arm64 ([c7bd397dac](https://github.com/facebook/react-native/commit/c7bd397dacc1a809572142bb7f80adf76d6002fe) by [@fkgozali](https://github.com/fkgozali))
- Remove duplicated category NSTextStorage+FontScaling ([6eef3661bf](https://github.com/facebook/react-native/commit/6eef3661bf22a2b0f9b4e293a501fb095004a7d2) by [@zhongwuzw](https://github.com/zhongwuzw))
- `setState` is not working for nested inline views in text ([9b33e752c7](https://github.com/facebook/react-native/commit/9b33e752c7c414c9c04b20888a2e1e9d9f8aa8a3) by [@ehsemloh](https://github.com/ehsemloh))
- Unbreak Cocoapods build ([05d92bf2a5](https://github.com/facebook/react-native/commit/05d92bf2a5ed54c3e7a52b78a3edd699471c710f) by [@hieu9102002](https://github.com/hieu9102002))
- `setState` is not working properly for text inline image ([36ef6460f0](https://github.com/facebook/react-native/commit/36ef6460f04db323d8bbfc8be5e5dc26691a35ae) by [@ehsemloh](https://github.com/ehsemloh))
- Fix running timers when the proximity sensor detects close ([79eac9666d](https://github.com/facebook/react-native/commit/79eac9666d9f0e3a3b076f64be0e6c45f035cb84) by [@saghul](https://github.com/saghul))
- Fixes Dev menu pop up multiple times when Tap command `D` continuously ([a257e9f5f0](https://github.com/facebook/react-native/commit/a257e9f5f0cb871ead636e4dee0ce1271bb90df8) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix module create dead-lock when start-up ([a4a8695cec](https://github.com/facebook/react-native/commit/a4a8695cec640e5cf12be36a0c871115fbce9c87) by [@zhongwuzw](https://github.com/zhongwuzw))
- Adjust RCTRedBox to work for iPad and support orientation changes ([e2eb26c951](https://github.com/facebook/react-native/commit/e2eb26c951c3d2a0a4721428d00ffc02b501ecfa) by [@okwasniewski](https://github.com/okwasniewski))
- Fix autoscrollToTopThreshold on iOS old arch ([9666814750](https://github.com/facebook/react-native/commit/9666814750198574170a26e21a47b028f8060ffe) by [@janicduplessis](https://github.com/janicduplessis))
- Fix iOS Paper Scroll Event RTL check ([c40fc313ca](https://github.com/facebook/react-native/commit/c40fc313ca9dd66f9949c44f494d50951d96fe9d) by [@NickGerleman](https://github.com/NickGerleman))
- View flips horizontally in paper arch on RTL ([1d74b38634](https://github.com/facebook/react-native/commit/1d74b38634a27bce65eb6ea11111dac6653bd905) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Fixed narrowing conversion compilation error. ([ed9931f456](https://github.com/facebook/react-native/commit/ed9931f456ea9b7b006d2741223c882186afe368))
- Fix grammar in Xcode 15 helper method name ([fa87eaaebf](https://github.com/facebook/react-native/commit/fa87eaaebf4103d365adf44d1d14ed6117cb37cb) by [@mikehardy](https://github.com/mikehardy))
- Prevent unwanted border animation ([5fbdc994f9](https://github.com/facebook/react-native/commit/5fbdc994f945ee8d834632649e3b82451660e8fe) by [@sammy-SC](https://github.com/sammy-SC))
- Adding ccache_clang wrapper scripts to package.json for distribution ([1c8751a16a](https://github.com/facebook/react-native/commit/1c8751a16a4de82f71831de338a726de800a227b) by [@CatStudioApp](https://github.com/CatStudioApp))
- Decouple RCTBridge+Private from jsinspector-modern ([49bb2f37f1](https://github.com/facebook/react-native/commit/49bb2f37f1bb83d8b370fd09d528975084873b5f) by [@philIip](https://github.com/philIip))
- Properly warn about `createRootViewWithBridge` being deprecated ([a1197695fc](https://github.com/facebook/react-native/commit/a1197695fc7dd7750001dc60853fd19f162dc69e) by [@okwasniewski](https://github.com/okwasniewski))
- Codegen correctly handles react-native.config.js. ([f5d5d9d284](https://github.com/facebook/react-native/commit/f5d5d9d284fae2bce42c9202bbfcf948e6a9ed37) by [@dmytrorykun](https://github.com/dmytrorykun))
- Support .tsx, .ts, and .jsx in component stacks ([adaf5eba3e](https://github.com/facebook/react-native/commit/adaf5eba3e8381d0b499257ab04d30d6f3fb4c93) by [@rickhanlonii](https://github.com/rickhanlonii))
- RCTRedBox not appearing in Bridgeless when metro is not running ([4adef35e97](https://github.com/facebook/react-native/commit/4adef35e97f31db466e536aa21d5eeec6ee34fc6) by [@okwasniewski](https://github.com/okwasniewski))
- Make sure that the New Architecture listens to orientation change events. ([49b0d26d45](https://github.com/facebook/react-native/commit/49b0d26d45096227767bca90a528d5bb031d80e7) by [@cipolleschi](https://github.com/cipolleschi))
- Avoid to show Metro Loading banner twice. ([64ed8200f7](https://github.com/facebook/react-native/commit/64ed8200f739b0e8289ec7336557fa3d5d381b97) by [@cipolleschi](https://github.com/cipolleschi))
- Support launchOptions in bridgeless mode. ([cb2d93ea50](https://github.com/facebook/react-native/commit/cb2d93ea50e62024d5238cccfc7242f7fd75d3b2) by [@cipolleschi](https://github.com/cipolleschi))
- Let RCTHost be initialized with a function to provide the `bundleURL` so that it can connect to metro on Reload when the url changes.
 ([90296be1d4](https://github.com/facebook/react-native/commit/90296be1d4fab09a52e02dd09f34f819136d0a07) by [@cipolleschi](https://github.com/cipolleschi))
- Fix: build settings for custom build configuration ([bcac3c4d9c](https://github.com/facebook/react-native/commit/bcac3c4d9c2b7c712018c9686dfa620479674082) by [@jblarriviere](https://github.com/jblarriviere))
- Remove invalidate observer instead of re-adding observer in DeviceInfo module ([91279a822b](https://github.com/facebook/react-native/commit/91279a822be949051866a694148e509c1308035b) by [@zhongwuzw](https://github.com/zhongwuzw))
- Add missing fields to native errors in new arch ([98b1331609](https://github.com/facebook/react-native/commit/98b1331609142979ba13659c103d7c3fd31c8198) by [@vonovak](https://github.com/vonovak))
- [0.74] Fix archive for MacOS Catalyst ([0e5dc51bba](https://github.com/facebook/react-native/commit/0e5dc51bbac105fb225ecc7966c1cde954b90330) by [@cipolleschi](https://github.com/cipolleschi))
- Fix RNTester project and remove CCACHE from project when disabled ([2b18fdf806](https://github.com/facebook/react-native/commit/2b18fdf8063b423a0fb5762f2c6044244b4c35e6) by [@cipolleschi](https://github.com/cipolleschi))
- Make sure that the Open Debugger appears in bridgeless mode ([18916f391a](https://github.com/facebook/react-native/commit/18916f391a63f8eb454d007f97be4dcdd8ae5ef4) by [@cipolleschi](https://github.com/cipolleschi))
- Change bridgeless check in dev menu ([776f90024f](https://github.com/facebook/react-native/commit/776f90024f9879b804b9de781acef7ac24d2e4f0) by [@zhongwuzw](https://github.com/zhongwuzw))

### Security

#### iOS specific

- Bump activesupport to minimum 6.1.7.5 CVE-2023-38037. ([07a159f279](https://github.com/facebook/react-native/commit/07a159f279cdcbed29c9c437dec1c0b8ac2d852f) by [@lunaleaps](https://github.com/lunaleaps))

## v0.73.11

### Fixed



#### Android specific

- Suppress path adjustment when not actually drawing a border ([c9cf6d4b60](https://github.com/facebook/react-native/commit/c9cf6d4b60b6c5f717b3e5c9f3e3720e8d588707) by [@tjzel](https://github.com/tjzel))

#### iOS specific

- Stop generating dSYM path in Hermes for the framework ([e992405e87](https://github.com/facebook/react-native/commit/e992405e87) by [@cipolleschi](https://github.com/cipolleschi))
- Pin Xcodeproj to < 1.26.0 ([dfcad7c678](https://github.com/facebook/react-native/commit/dfcad7c678) by [@cipolleschi](https://github.com/cipolleschi))

## v0.73.10

### Removed

#### Android specific

- Stop emitting deprecated onTextInput events ([e6ad652c6a](https://github.com/facebook/react-native/commit/e6ad652c6ae2222e95b3dc351f28c0fa3a91d622) by [@javache](https://github.com/javache))
- RGNP - Remove unnecessary dependency on gradle-tooling-api-builders - serviceOf failure ([069d8fc249](https://github.com/facebook/react-native/commit/069d8fc2495b63a233cb30712e888f29a185098c) by [@cortinico](https://github.com/cortinico))

### Fixed

- fix(TypeScript): Allow readonly arrays in transform ([b4015c1eaa](https://github.com/facebook/react-native/commit/b4015c1eaaed5fe7281314a9c5988a4c1cade3a6) by [@tjzel](https://github.com/tjzel))

#### Android specific

- Fix TextInput 'contextMenuHidden' prop ([08eed9f093](https://github.com/facebook/react-native/commit/08eed9f093d759fadbaef86dcf54c801917b4602) by [@alanleedev](https://github.com/alanleedev))

#### iOS specific

- Fix `<KeyboardAvoidingView>` with floating keyboard on iPadOS ([3c54e1ee45](https://github.com/facebook/react-native/commit/3c54e1ee4522b26698bb3f99262a2a621b26fb64) by [@renchap](https://github.com/renchap))
- Fix the generation of .xcode.env.local ([88fb3daa7e](https://github.com/facebook/react-native/commit/88fb3daa7ef112a9e7500c32168a897d0d409456) by [@cipolleschi](https://github.com/cipolleschi))
- Fix iOS crash occurring when navigating to a new app screen with a displaying modal ([33ca0204f5](https://github.com/facebook/react-native/commit/33ca0204f5491f27f00686e4eb966eb9fee3f7f9) by [@zhouzh1](https://github.com/zhouzh1))
- Fabric: Fixes animations strict weak ordering sorted check failed ([f18ed7b6c7](https://github.com/facebook/react-native/commit/f18ed7b6c72d9b9443282b4c169bae56336dad8d) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.73.9

### Added

#### iOS specific

- Add privacy manifest aggregation. ([f4b9d09](https://github.com/facebook/react-native/commit/f4b9d098c863fa36f261e5961ad13dd4cd2706f8) by [@aleqsio](https://github.com/aleqsio))

### Changed

- Feat: update CLI to 12.3.7 ([c7a1f2428f](https://github.com/facebook/react-native/commit/c7a1f2428fd6772e34b547ea23fa1d265c5d8a62) by [@szymonrybczak](https://github.com/szymonrybczak))

### Fixed

#### iOS specific

- Remove invalidate observer instead of re-adding observer in DeviceInfo module ([9db3eb6](https://github.com/facebook/react-native/commit/9db3eb686201f6ad4fddf5300f348f0caf69cfad) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix privacy aggregation ([6983a8b](https://github.com/facebook/react-native/commit/6983a8b1b9c33ea4e580a4e94e1e9535b6cb5d81) by [@aleqsio](https://github.com/aleqsio))
- Privacy Manifest aggregation failing due to missing nil check ([115331b](https://github.com/facebook/react-native/commit/115331b213152df623ad1c7988c9295802af6850) by [@swrobel](https://github.com/swrobel))
- In privacy manifest post install script, handle the case where the file reference doesn't have a path ([86cb45e](https://github.com/facebook/react-native/commit/86cb45e57786b0a62d9c523f9d5db4f8e5dc52df) by [@robertying](https://github.com/robertying))
- Privacy Manifest aggregation failing due to no `NSPrivacyAccessedAPITypes` key ([4bb94fe](https://github.com/facebook/react-native/commit/4bb94fe1e6c6174af5c9148bfc00f4bc7a87cf19) by [@renchap](https://github.com/renchap))

## v0.73.8

### Added

#### iOS specific

- Added privacy manifest to template ([520d120375](https://github.com/facebook/react-native/commit/520d120375c6b24bc161adea4f48d76537a34abc) by [@philIip](https://github.com/philIip)) (_fixed to include the file in the build_)

### Changed

- Update Hermes version ([1d0cbfd01b](https://github.com/facebook/react-native/commit/1d0cbfd01b1f47bcf5279d86a9ad9e0d28804346) by [@Titozzz](https://github.com/Titozzz))

### Fixed

#### iOS specific

- Add `HERMES_ENABLE_DEBUGGER=1` flag to React-RuntimeApple ([794aaa52d3](https://github.com/facebook/react-native/commit/794aaa52d39f2c419fcd49126c69dff3030e7bb9) by [@cipolleschi](https://github.com/cipolleschi))
- Fix Symbol not found: (_JSGlobalContextSetInspectable) ([224ac21568](https://github.com/facebook/react-native/commit/224ac21568278617c192bf00b6254d30c0957e11) by [@cipolleschi](https://github.com/cipolleschi))
- Add missing dependency to React-RuntimeHermes podspec ([fd48b94319](https://github.com/facebook/react-native/commit/fd48b9431954be8a79d5c094173f064944ba86e6) by [@cipolleschi](https://github.com/cipolleschi))

## v0.73.7

### Fixed

#### Android specific
- Fix possible deadlock in dispatchViewUpdates ([b741899f99](https://github.com/facebook/react-native/commit/b741899f9994d270803e38bd98ce81adc8ba93fc))
- Fix crash in getChildDrawingOrder ([342ce6115b](https://github.com/facebook/react-native/commit/342ce6115b744cd2fcfd80effb609b37dc9d5b37))
- Fix Android HorizontalScrollView fling when content length less than ScrollView length ([bd19d0ec6a](https://github.com/facebook/react-native/commit/bd19d0ec6af45b1327190cb3d2496a13f637fba4))

#### iOS specific
- fix: build settings for custom build configuration  ([2bcf18812a](https://github.com/facebook/react-native/commit/2bcf18812a67627490d589290c2ee0054c28b0b2))
- Fix archiving for Mac Catalyst ([a8a2f1a578](https://github.com/facebook/react-native/commit/a8a2f1a578624333a113f285327987fb4f3b6c15) by [@cipolleschi](https://github.com/cipolleschi))
- add privacy manifest to pod install ([3ccbd9cd8c](https://github.com/facebook/react-native/commit/3ccbd9cd8c5fdcbbdb2e56cd447001ee89c109fa))

## v0.73.6

### Breaking

#### iOS specific

- Rename `BUILD_FROM_SOURCE` to `RCT_BUILD_HERMES_FROM_SOURCE` ([51b80477c7](https://github.com/facebook/react-native/commit/51b80477c7836058fb29ef92c1a1908e3c8dba58) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- Fix component stacks for tsx, ts, and jsx files ([28f604a97d](https://github.com/facebook/react-native/commit/28f604a97dc57afa631a24052ae6660c13c2c761) by [@lunaleaps](https://github.com/lunaleaps))

#### iOS specific

- Prevent unwanted border animation([d979491](https://github.com/facebook/react-native/commit/d9794916b0549330513fe530abf090fa48b8a776) by [@sammy-SC](https://github.com/sammy-SC))
- Fix flipper for Xcode 15.3 ([9d22a7fd0e](https://github.com/facebook/react-native/commit/9d22a7fd0e82d6c2660217c1fb3c004ab30d6844) by [@cipolleschi](https://github.com/cipolleschi))

## v0.73.5

### Security

- Update CLI to 12.3.6 ([ffcd8f5249](https://github.com/facebook/react-native/commit/ffcd8f524903d5d6e92e864472aaefd52dea77cf) by [@szymonrybczak](https://github.com/szymonrybczak))

### Changed

- Hermes bump ([3bdd54a51c](https://github.com/facebook/react-native/commit/3bdd54a51ceea30cbbd0d1c45e9c391a80371dd2) by [@lunaleaps](https://github.com/lunaleaps))

### Fixed

- Fix: fix codegen not finding all third-party libraries ([67e2bb455f](https://github.com/facebook/react-native/commit/67e2bb455fd39f00fbf2b4d4f2f019327929efa6) by [@tido64](https://github.com/tido64))
- Fix compiler flags passed to libraries ([929df582c8](https://github.com/facebook/react-native/commit/929df582c885ad60bd34e52ced481f8e9d5666d9) by [@cipolleschi](https://github.com/cipolleschi))

## v0.73.4

### Fixed

- Fix: cannot find module `react-native-*/Libraries/Core/InitializeCore` ([562447be47](https://github.com/facebook/react-native/commit/562447be4705c3e3338633ca108e7e67b9b01640) by [@tido64](https://github.com/tido64))

#### Android

- Ignore the one-time NullPointerException and print error log ([ca9b6b5038](https://github.com/facebook/react-native/commit/ca9b6b5038c419405a440fc8add7090be633654c))

#### iOS

- Fix warning when loading RCTUIManager and A11yManager ([f56bf1fa0a](https://github.com/facebook/react-native/commit/f56bf1fa0a0d0ca547cf7c3ff2e631efac1007ea) by [@cipolleschi](https://github.com/cipolleschi))

## v0.73.3

### Added

#### iOS specific

- Handle TSAsExpression when looking for the codegen declaration ([02957718d7](https://github.com/facebook/react-native/commit/02957718d7ca1af815493d145697c1e848b16c17) by [@dmytrorykun](https://github.com/dmytrorykun))

### Changed

- Bump CLI to 12.3.2 ([bcb229e8f8](https://github.com/facebook/react-native/commit/bcb229e8f8b70b59d3cb603d7bb912784ad25a02) by [@szymonrybczak](https://github.com/szymonrybczak))

#### Android specific

- Call super.onRequestPermissionsResult in ReactActivity's onRequestPermissionsResult() ([96ed1190c6](https://github.com/facebook/react-native/commit/96ed1190c624869af96e464b009e0c0234076893) by [@LimAlbert](https://github.com/LimAlbert))

#### iOS specific

- Remove ATS config patch from react_native_post_install ([41c601e478](https://github.com/facebook/react-native/commit/41c601e4786b544fdd1fca138b0e0c61dbb8eba2) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### Fixed

- Declare missing dependency `chalk` ([9155e2d182](https://github.com/facebook/react-native/commit/9155e2d1828e04d6144de80bb543d50936500377) by [@tido64](https://github.com/tido64))
- TouchableBounce, TouchableHighlight and TouchableNativeFeedback dropping touches with React 18. ([e4708d661b](https://github.com/facebook/react-native/commit/e4708d661bf3d01ec857635f04a4aabf9d954a5e) by [@sammy-SC](https://github.com/sammy-SC))
- TouchableWithoutFeedback and TouchableOpacity dropping touches with React 18. ([54166342f0](https://github.com/facebook/react-native/commit/54166342f01fc74236ba6146a4c0f604189017e4) by [@sammy-SC](https://github.com/sammy-SC))

#### iOS specific

- Restrict Cocoapods versions < 1.15. ([3869ae4d80](https://github.com/facebook/react-native/commit/3869ae4d80d1da8c4e3fe7449f2926c5e1575beb) by [@blakef](https://github.com/blakef))
- Make `RCTDeviceInfo` listen to invalidate events and unregister observers while invalidating the bridge ([d46d80d2ef](https://github.com/facebook/react-native/commit/d46d80d2ef6cdc05c5a1b2429ed1df93410ae36f) by [@cipolleschi](https://github.com/cipolleschi))
- Fix support for SOURCEMAP_FILE path containing spaces ([63e893d23d](https://github.com/facebook/react-native/commit/63e893d23d84c9bf65bad64fc359b9686eb19b4d) by [@paulschreiber](https://github.com/paulschreiber))
- Fix release build error due to a casing issue in hermes tarball path after download prebuilt tarball ([2e2f8a6689](https://github.com/facebook/react-native/commit/2e2f8a668907552070a2a53a47137b1449b66bbd) by [@wfern](https://github.com/wfern))
- Fix race condition between A11yManager and UIManager ([f39f34ed82](https://github.com/facebook/react-native/commit/f39f34ed82997d0595522a285c3cb8693594e718) by [@cipolleschi](https://github.com/cipolleschi))
- Fix symbol not found _jump_fcontext with use_frameworks ([a2771ce58a](https://github.com/facebook/react-native/commit/a2771ce58ac221d1ac0de265c1ce571212fbcf83) by [@cipolleschi](https://github.com/cipolleschi))

## v0.72.17

### Fixed

#### iOS specific

- Fix Privacy Manifest file path by providing targets ([da0f8ac060](https://github.com/facebook/react-native/commit/da0f8ac060d853d8229423559c9338646dd11455) by [@siddharthkul](https://github.com/siddharthkul))
- Handle the case where the file reference doesn't have a path ([b5b3f3c43d](https://github.com/facebook/react-native/commit/b5b3f3c43d02dc552c0884f9cee416c68b6eaea2) by [@robertying](https://github.com/robertying))

## v0.72.15

### Added

#### iOS specific

- Add privacy manifest aggregation. ([61f584c3af](https://github.com/facebook/react-native/commit/61f584c3afb79ba705be8b6372ff9b6c5599680e) by [@aleqsio](https://github.com/aleqsio))

### Fixed

#### iOS specific

- Privacy Manifest aggregation failing due to no `NSPrivacyAccessedAPITypes` key. ([fc4e099920](https://github.com/facebook/react-native/commit/fc4e0999206ec7c1f465bb2b1fea987e43485a82) by [@renchap](https://github.com/renchap))

## v0.72.14

### Added

#### iOS specific

- add privacy manifest to hello world template ([d357a61ead](https://github.com/facebook/react-native/commit/d357a61ead033f30221f82f16aed771649c6d981) by [@phillip](https://github.com/phillip))

### Changed

#### iOS specific

- Bumped hermes to remove Apple's RR API that were unused. Hermes does not requires a PrivacyManifest now ([ee14572](https://github.com/facebook/react-native/commit/ee14572e2438dabc1076c434fa99350ab2e1c4b9) by [@hurali97](https://github.com/hurali97))

### Fixed

#### iOS specific

- fix Symbol not found: (_JSGlobalContextSetInspectable) ([ae4c62a](https://github.com/facebook/react-native/commit/ae4c62a933f7ffcfe4be8a3499fb6e1cbe7f1c43) by [@cipolleschi](https://github.com/cipolleschi))

## v0.72.13

### Added

#### iOS specific

- Add privacy manifest to pod install ([d39712f54a](https://github.com/facebook/react-native/commit/d39712f54a95e6dcdf1d2f80d9581211ab03c157) by [@philIip](https://github.com/philIip))

### Fixed

#### Android specific

- Fixed possible deadlock in dispatchViewUpdates ([b2ca41eef5](https://github.com/facebook/react-native/commit/b2ca41eef59b17d212b35baa4a28c4b27a465b5c) by [@EvertEt](https://github.com/EvertEt))

## v0.72.12

### Changed

- Rename BUILD_FROM_SOURCE to RCT_BUILD_HERMES_FROM_SOURCE ([a215805eb7](https://github.com/facebook/react-native/commit/a215805eb73f687116af4aa74461ff4e17b05f42) by [@cipolleschi](https://github.com/cipolleschi))

#### iOS specific

- [0.72] Fix flipper for Xcode 15.3 ([a316e0154e](https://github.com/facebook/react-native/commit/a316e0154ee8d1dd809be47694abb62d245bff0b) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- Fix component stacks for tsx, ts, and jsx files ([dd311c9782](https://github.com/facebook/react-native/commit/dd311c9782c9f4d0f9d98423de2ae71227a24a7d) by [@rickhanlonii](https://github.com/rickhanlonii))

- Fix flags for new arch ([0724c2769a](https://github.com/facebook/react-native/commit/0724c2769a3dea8f7886c8c541ffb49ae5c045dc) by [@cipolleschi](https://github.com/cipolleschi))

## v0.72.11

### Changed

- Upgrade CLI to 11.4.1 ([c57a29a08c](https://github.com/facebook/react-native/commit/c57a29a08c086728ea3bbb6b077c92fae6792d11) by [@szymonrybczak](https://github.com/szymonrybczak))
- Update Metro to ^0.76.9, CLI to ^11.4.0 ([ddff36f770](https://github.com/facebook/react-native/commit/ddff36f7705f1b5b2e27bfb2ee62f6726dfdd7bd) by [@robhogan](https://github.com/robhogan))

#### iOS specific

- Improve Swift support for 3rd party libs ([6939021518](https://github.com/facebook/react-native/commit/693902151899c85ff00418d75df4377a1096efee) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- Fix overriding EXCLUDED_ARCHS when installing Hermes on RN v0.72 ([a4282a91c3](https://github.com/facebook/react-native/commit/a4282a91c32f947adfb4f210e296e8dfeefdae34) by [@ken0nek](https://github.com/ken0nek))

#### iOS specific

- Don't allow cocoapods 1.15. ([08fd9170fc](https://github.com/facebook/react-native/commit/08fd9170fcdc7042fdcfe5f54eec71ed245d9795) by [@blakef](https://github.com/blakef))

## v0.72.10

### Added

- Unhandled promise rejection - attach non-standard Error object stack info if possible ([655b12dbfa](https://github.com/facebook/react-native/commit/655b12dbfaa2c48f9fd38bbe8311e6f935045b30) by [@ospfranco](https://github.com/ospfranco))

### Fixed

- Revert the regression of iOS min version and updates Podfile.lock for Releases ([1f70f58aa4](https://github.com/facebook/react-native/commit/1f70f58aa4225d017ebad4f66641cbd0d1db114f) by [@cipolleschi](https://github.com/cipolleschi))
- Fix flags ([565281105e](https://github.com/facebook/react-native/commit/565281105e4a0c4d51d2134114bdadb33f03d61a) by [@cipolleschi](https://github.com/cipolleschi))

## v0.72.9

### Fixed

- Fix boost link ([d62d714ada](https://github.com/facebook/react-native/commit/d62d714adab891028004063136a7e906478618c4) by [@cipolleschi](https://github.com/cipolleschi))
- Fix New Arch build failing with -std=c++20 ([b7c1a40db4](https://github.com/facebook/react-native/commit/b7c1a40db4d5a6d992b926307842fe671ae80436) by [@tido64](https://github.com/tido64))
- Fix ruby tests ([7c7baad7bd](https://github.com/facebook/react-native/commit/7c7baad7bd62cf59b46a426eeb31aefc1e85bca7) by [@cipolleschi](https://github.com/cipolleschi))
- Bump Podfile.lock and try to fix Hermes update ([34da08755d](https://github.com/facebook/react-native/commit/34da08755d88a726e0a68d7a2ef544fe4af0dc6e) by [@cipolleschi](https://github.com/cipolleschi))

## v0.73.2

### Added

- Unhandled promise rejection - attach non-standard Error object stack info if possible ([655b12dbfa](https://github.com/facebook/react-native/commit/655b12dbfaa2c48f9fd38bbe8311e6f935045b30) by [@ospfranco](https://github.com/ospfranco))

### Changed

- Bump Metro to ^v0.80.3 ([16dff523b0](https://github.com/facebook/react-native/commit/16dff523b0a16d7fa9b651062c386885c2f48a6b) by [@huntie](https://github.com/huntie))
- Automatically reconnect to an existing debugger session on relaunching the app ([0806ad7854](https://github.com/facebook/react-native/commit/0806ad785458009887ff4c67b995ec992a010702) by [@motiz88](https://github.com/motiz88))

#### iOS specific

- Update ios pod post_install logic for detecting if hermes is enabled ([d6163d7f43](https://github.com/facebook/react-native/commit/d6163d7f43a753f24148450033491dfc9c5d0c36) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### Fixed

- Fix comment about adding packages in android template ([ac9b87cd57](https://github.com/facebook/react-native/commit/ac9b87cd57029a0f0876aaec8d259d9befba9838) by [@janicduplessis](https://github.com/janicduplessis))
- Fix boost download url ([7e721f09ad](https://github.com/facebook/react-native/commit/7e721f09ad3dafed9f490f433b2ac613786c27b2) by [@cipolleschi](https://github.com/cipolleschi))

#### iOS specific

- Fix horizontal scrollview scrollTo coordinate space in RTL on oldarch ([e809e0aca7](https://github.com/facebook/react-native/commit/e809e0aca713ad12f91778b09f5297f1da866b26) by [@NickGerleman](https://github.com/NickGerleman))
- [enhance IP address retrieval for iOS devices in Metro bundler setup](https://github.com/facebook/react-native/pull/41839/commits/6a351db158dadf944933173aa0150435c742001f) ([9f28616650](https://github.com/facebook/react-native/commit/9f28616650a61ca298c2fc710b588445b8ceb94c) by [@Morritz](https://github.com/Morritz))

This file contains all changelogs for latest releases, from 0.70.0 onward. Please check out the other `CHANGELOG-*.md` files for previous versions.

## v0.73.1

### Added

- Add `enableNetworkInspector` experiment to enable Network panel and CDP handlers in inspector proxy ([8ef807bfb2](https://github.com/facebook/react-native/commit/8ef807bfb2e596bd70f0c8b17f1b6f698d98ae2a) by [@byCedric](https://github.com/byCedric))

### Changed

- Chore: bump CLI to 12.3.0 ([dff11ab993](https://github.com/facebook/react-native/commit/dff11ab993e57a097988537791afe8ef086e4ce4) by [@szymonrybczak](https://github.com/szymonrybczak))

### Fixed

- Fix last spacer constrain logic in VirtualizedList ([3ed4bf9046](https://github.com/facebook/react-native/commit/3ed4bf9046ae125d244283c3556892345bfd77e1) by [@janicduplessis](https://github.com/janicduplessis))

#### Android specific

- Fix type for unrecognisable field mBinding ([31d8a93bf3](https://github.com/facebook/react-native/commit/31d8a93bf3199432bcd2b577738fbf49e84c207d) by [@piaskowyk](https://github.com/piaskowyk))

#### iOS specific

- Fix NSAppTransportSecurity being overwritten during pod install ([a0b76d90b7](https://github.com/facebook/react-native/commit/a0b76d90b73ec0d3d9e0174004bfb96a5b6f3a3e) by [@robertying](https://github.com/robertying))

## v0.73.0

### Breaking

- Bump minimum Node JS version to 18 ([2eb25cbdbe](https://github.com/facebook/react-native/commit/2eb25cbdbe8d1ce720ffdf5f5d855e1cbf14142b))
- Require C++ 20 when including renderer headers ([3b5bea01d0](https://github.com/facebook/react-native/commit/3b5bea01d02ac93efeed237e474a8fe905272b24) by [@NickGerleman](https://github.com/NickGerleman))
- Remove included `flow-typed/` directory from the `react-native` package ([4540668c15](https://github.com/facebook/react-native/commit/4540668c1598075f7ae46449bcbcbb70f69fcd8a) by [@huntie](https://github.com/huntie))
- per-node `pointScaleFactor` ([dce7242ab6](https://github.com/facebook/react-native/commit/dce7242ab6855e7a546e6d25482311d995a4a63b) by [@NickGerleman](https://github.com/NickGerleman))
- Remove "UseLegacyStretchBehaviour" functions ([c35ff13a58](https://github.com/facebook/react-native/commit/c35ff13a58431dee4198bc55575312558cc39bf1) by [@NickGerleman](https://github.com/NickGerleman))
- Remove `YGConfigGetInstanceCount` ([858173280f](https://github.com/facebook/react-native/commit/858173280f515c81e2d9e76d0e0b81212ea61233) by [@NickGerleman](https://github.com/NickGerleman))
- Remove `interpolateProps` functionality from `ComponentDescriptor` to fix circular dependency between `react/renderer/core` and `react/renderer/components/view` ([bae63d492f](https://github.com/facebook/react-native/commit/bae63d492fa8254547453229f28332f08e8b881c))
- Migrate from native `CallInvoker` to `NativeMethodCallInvoker` ([b70f186b53](https://github.com/facebook/react-native/commit/b70f186b53c1d43ce5af681ba0be47dd9e61bcb5) by [@RSNara](https://github.com/RSNara))
- Change how we set cmake policy ([2b932c3820](https://github.com/facebook/react-native/commit/2b932c3820cfabef1590f6fcf8b95f65d9c21eb8) by [@NickGerleman](https://github.com/NickGerleman))
- Add `YGErrata` integration within C ABI ([0fd0f56f20](https://github.com/facebook/react-native/commit/0fd0f56f205dafed9a1960392a446f43255f29dc) by [@NickGerleman](https://github.com/NickGerleman))
- Set `runtimeConfig` provider for the `Template` ([2de964cfd2](https://github.com/facebook/react-native/commit/2de964cfd229e56eeae8b6e0a7a516ff3a1498ac) by [@dmytrorykun](https://github.com/dmytrorykun))

#### Android specific

- Fix: `role="searchbox"` should assign `"SearchField"` trait on iOS ([2749fbca9a](https://github.com/facebook/react-native/commit/2749fbca9a18fdff6c3e3dd3b3c5b8086cef9cc5) by [@mdjastrzebski](https://github.com/mdjastrzebski))
- Renamed FabricMountItem.* files to MountItem.* to better match the name of the struct. ([49f1237526](https://github.com/facebook/react-native/commit/49f1237526f80e3aa09833cc13c6bb9f8ea9187c))
- Deleting `warnOnLegacyNativeModuleSystemUse` ([9859fbc2ec](https://github.com/facebook/react-native/commit/9859fbc2ec9f50eba3672322a85ba7fd9fc11145) by [@philIip](https://github.com/philIip))
- Do not enable `excludeYogaFromRawProps` feature flag, if you need to pass layout props to Java view managers when using new architecture ([88e19c0ce6](https://github.com/facebook/react-native/commit/88e19c0ce68e933d274c45f9c3f79afc11ad5b0a) by [@zeyap](https://github.com/zeyap))
- Default to ignoring cached Metro bundle when offline ([2d6106055b](https://github.com/facebook/react-native/commit/2d6106055b629b18296d076c4f1287d8a5ba6ab8) by [@motiz88](https://github.com/motiz88))
- W3CPointerEvents: change click event from direct to bubbling ([61eb9b4453](https://github.com/facebook/react-native/commit/61eb9b4453c96d3dc662319c9c9f322bf04d1d44))
- Fix `ReactTextView` `setPadding` applying logic error ([d8ced6f895](https://github.com/facebook/react-native/commit/d8ced6f8953cd896471983714e722caf50783960) by [@jcdhlzq](https://github.com/jcdhlzq))
- Add `view` getter on `RCTRootView` / `RCTFabricSurfaceHostingProxyRootView ([33e0521788](https://github.com/facebook/react-native/commit/33e0521788484eaba20beeeaabba2496854583a7) by [@zoontek](https://github.com/zoontek))
- Remove support for Android API < 23 in ReactEditText ([1904e8036a](https://github.com/facebook/react-native/commit/1904e8036a777e463c5517010a254f0d081ae58c) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- Metro will no longer be started when running builds via Xcode ([dc6845739e](https://github.com/facebook/react-native/commit/dc6845739e29ea8cf63583d530f67c2498286a3e) by [@huntie](https://github.com/huntie))
- `RCTTurboModuleRegistry` is unavailable in `RCTRootView` and `RCTSurfaceHostingProxyRootView` ([268d9edad6](https://github.com/facebook/react-native/commit/268d9edad69a22710711be055100680817b28791) by [@philIip](https://github.com/philIip))
- `HasBridge` is removed from `RCTRootView` and `RCTSurfaceHostingProxyRootView` ([57b86f7a87](https://github.com/facebook/react-native/commit/57b86f7a87b7bed09124cc513d5069b4c0069a4f) by [@philIip](https://github.com/philIip))
- Remove `sizeMeasureMode` argument from `RCTSurfaceHostingProxyRootView` constructor ([0d83c1a668](https://github.com/facebook/react-native/commit/0d83c1a6685222f97cd0c715270ca67192f89361) by [@philIip](https://github.com/philIip))
- Deleting `RCTFabricSurfaceHostingProxyRootView` ([676676c954](https://github.com/facebook/react-native/commit/676676c95428ca92007160bf420eccc62ba41ea4) by [@philIip](https://github.com/philIip))
- Delete RCT_EXPORT_PRE_REGISTERED_MODULE ([8cd5b2a57d](https://github.com/facebook/react-native/commit/8cd5b2a57d5b6af2ef1c6b1d673e328353ea776b) by [@philIip](https://github.com/philIip))
- Replace `RCTLocalAssetImageLoader` with `RCTBundleAssetImageLoader` ([b675667a47](https://github.com/facebook/react-native/commit/b675667a47f651e85d66e12daaeeec00371d1b23) by [@hellohublot](https://github.com/hellohublot))
- Add `React-FabricImage` pod. ([44af6ca03c](https://github.com/facebook/react-native/commit/44af6ca03cdb9e8c4c2cd67a2e097025bc21e17f) by [@cipolleschi](https://github.com/cipolleschi))
- Make `getModuleInstanceFromClass` required ([5a7799eead](https://github.com/facebook/react-native/commit/5a7799eead0eb26f1f42d097d89af757eb6539d1) by [@philIip](https://github.com/philIip))
- Make `getModuleClassFromName` required ([fbf196dd05](https://github.com/facebook/react-native/commit/fbf196dd05f367c841fa53b1c0ae7fcee9ca1721) by [@philIip](https://github.com/philIip))
- Remove `openURL` method from `RCTInspectorDevServerHelper` ([3ef7de848d](https://github.com/facebook/react-native/commit/3ef7de848d6d4d95fe1ce4e4cf80bbfceeabb746) by [@huntie](https://github.com/huntie))

### Added

- Enable animating skew in transforms with native driver ([645b643f68](https://github.com/facebook/react-native/commit/645b643f681f5260ae0505cf91cfb8f6ecdb33c0), [4934cdb403](https://github.com/facebook/react-native/commit/4934cdb40385c6417e87cf9d3ee985c06d207136) by [@genkikondo](https://github.com/genkikondo))
- Support customization of underlying Touch event representation in out-of-tree platforms ([4884322781](https://github.com/facebook/react-native/commit/4884322781d92e019e78d89e5693b9ec029aaa7a))
- Support customization of underlying Color representation in out-of-tree platforms ([2b688f6031](https://github.com/facebook/react-native/commit/2b688f603159c2cc9ba821f3efe8a07504400285))
- Support lazy bundling in development ([799b0f4be8](https://github.com/facebook/react-native/commit/799b0f4be80a6c4b6bfc1d8bb3b887af4b1b7081) by [@motiz88](https://github.com/motiz88))
- Fixup hack for flex line size calculation ([598b7ed690](https://github.com/facebook/react-native/commit/598b7ed690d908c408adea970d26382c834f5ead) by [@NickGerleman](https://github.com/NickGerleman))
- Added a third parameter "contentType" to method `slice` of class `Blob`. ([e35ca71bca](https://github.com/facebook/react-native/commit/e35ca71bca6231138eadbc281177a8ff7948c071) by [@trashcoder](https://github.com/trashcoder))
- Added plugins for private methods and properties to `@react-native/babel-preset`. ([db4a253c1e](https://github.com/facebook/react-native/commit/db4a253c1e8bad29df83cb649cef4132701930f0) by [@yungsters](https://github.com/yungsters))
- Add `react-native/typescript-config` ([cae52f6cf8](https://github.com/facebook/react-native/commit/cae52f6cf878ef7ea2fc31a6197154873059a496) by [@NickGerleman](https://github.com/NickGerleman))
- Better TypeScript support for `package.json` exports field ([1b0e8b1de4](https://github.com/facebook/react-native/commit/1b0e8b1de470bd5501d78defce6ad6fe4b2ade4b) by [@NickGerleman](https://github.com/NickGerleman))
- Add the new media permission to typescript ([630cf3b21c](https://github.com/facebook/react-native/commit/630cf3b21cbd26154e4bed64871408439ddb8d97))
- Added `contentType` parameter to Blob declaration ([ff40138c76](https://github.com/facebook/react-native/commit/ff40138c76a9a6028a8c063c95f9c6762bb47e9a) by [@trashcoder](https://github.com/trashcoder))
- Remove `testID` from `TextStyle` types ([3273d38d3b](https://github.com/facebook/react-native/commit/3273d38d3bbcb0aa0a01cd6c5b959785db2a79dc) by [@tobua](https://github.com/tobua))
- Log a warning if `npx react-native` uses old cached version ([bfca23a25d](https://github.com/facebook/react-native/commit/bfca23a25d098d1b5c599c1611fafa1d17edebec) by [@blakef](https://github.com/blakef))
- Recognize dictionary type in codegen ([4fd8f405be](https://github.com/facebook/react-native/commit/4fd8f405beaefdf897ee8e511542fca3d6d71728) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Generate events with arrays ([b422375782](https://github.com/facebook/react-native/commit/b422375782441c5836390579d0030be94a395f0c) by [@cipolleschi](https://github.com/cipolleschi))
- Add generic support for Arrays in Events parsing ([6168701887](https://github.com/facebook/react-native/commit/6168701887ca48ae790bc2fc4058f7e65d32fc89) by [@cipolleschi](https://github.com/cipolleschi))
- Remove config variant copy ctor from `YGNode` ([72fb75d4d4](https://github.com/facebook/react-native/commit/72fb75d4d48d3dbe4a339b2503b796716af6e5b5) by [@NickGerleman](https://github.com/NickGerleman))
- Define Flag operators for `YGPrintOptions` ([fe6f70b913](https://github.com/facebook/react-native/commit/fe6f70b9139d97cff24dac6a60b724848e65a5d1) by [@NickGerleman](https://github.com/NickGerleman))
- Add YGErrata Enum ([c7dcb42b8a](https://github.com/facebook/react-native/commit/c7dcb42b8acbf02bd95090bf17fe45437c52a5ab) by [@NickGerleman](https://github.com/NickGerleman))
- Cleanup YGNode for explicit per-node config ([0e5d54a8ee](https://github.com/facebook/react-native/commit/0e5d54a8ee8f43cf39c3ee9b47acdcb933a762ab) by [@NickGerleman](https://github.com/NickGerleman))
- Added customizeStack hook to Metro's `/symbolicate` endpoint to allow custom frame skipping logic on a stack level. ([03e78010ae](https://github.com/facebook/react-native/commit/03e78010aef3984287c34902df46268bbe9723e9) by [@GijsWeterings](https://github.com/GijsWeterings))
- Enable TurboModule interop in Bridgeless mode ([aa1ad5496c](https://github.com/facebook/react-native/commit/aa1ad5496cdc0323de6e2b083a7e3e1826ef8289) by [@RSNara](https://github.com/RSNara))
- Native view config interop layer enabled in bridgeless mode. ([4fbe05577b](https://github.com/facebook/react-native/commit/4fbe05577b7fd0dd1633fa422c33548ba97d4e8c) by [@dmytrorykun](https://github.com/dmytrorykun))

#### Android specific

- Add `performance.reactNativeStartupTiming.initializeRuntimeStart` and `performance.reactNativeStartupTiming.initializeRuntimeEnd` API ([50638714f5](https://github.com/facebook/react-native/commit/50638714f5cbf110300aa2a3ecd63a3a25a9ac00), [10e8b3538f](https://github.com/facebook/react-native/commit/10e8b3538f65d54ebe28afea4b0f1cfd4a8233a0))
- Transform origin ([9e68599daf](https://github.com/facebook/react-native/commit/9e68599daf844b06bd010c43cbabf3dc593bb114) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Websocket Module setCustomClientBuilder ([0cdb9e6a52](https://github.com/facebook/react-native/commit/0cdb9e6a52f69ebee635d5bfaa34a52f6059dd47) by [@MO-Lewis](https://github.com/MO-Lewis))
- Remove JNI Binding usage of layoutContext ([733c9289a1](https://github.com/facebook/react-native/commit/733c9289a15afe2c39a6bde56a472fe879a855f8) by [@NickGerleman](https://github.com/NickGerleman))
- Added testing shadow helpers for robolectric ([4890d50edd](https://github.com/facebook/react-native/commit/4890d50eddbd9035e567134ac9b7d8570bae60f1) by [@philIip](https://github.com/philIip))
- Android Events - setting default to true to use C++ event pipeline ([b816fa7a65](https://github.com/facebook/react-native/commit/b816fa7a65abe7535c4664d64827646d0ebacf03) by Jesse Watts-Russell)

#### iOS specific

- Added support for iOS 17+ text content types ([216865cdb7](https://github.com/facebook/react-native/commit/216865cdb7cfbb9280a40cb1f3065a8961869cba) by [@robwalkerco](https://github.com/robwalkerco))
- Add support for building with Xcode 15 ([10d55888cc](https://github.com/facebook/react-native/commit/10d55888cce0b625c4b05a19ed609154893d17d0) by [@AlexanderEggers](https://github.com/AlexanderEggers))
- Fixed cursor height on multiline text input ([987c6fd298](https://github.com/facebook/react-native/commit/987c6fd29868e18d9c881837a795d5d12588ca4e), [e1885853ac](https://github.com/facebook/react-native/commit/e1885853ac46f4e84af9e4a50203d50b773f1a27) by [@soumyajit4419](https://github.com/soumyajit4419))
- Added support for `transform-origin` on old arch ([5f40f0800e](https://github.com/facebook/react-native/commit/5f40f0800e64b4380d7897b2e8b9ff561d84b97c) by [@jacobp100](https://github.com/jacobp100))
- Now it is possible to build Hermes from local source directory. Just set REACT_NATIVE_OVERRIDE_HERMES_DIR to the path to that directory. ([45f7e117ad](https://github.com/facebook/react-native/commit/45f7e117ad0df4f6be1344588ac932a21cd192e2) by [@dmytrorykun](https://github.com/dmytrorykun))
- Add all fontVariant values for font-variant-ligatures ([f0893cf72f](https://github.com/facebook/react-native/commit/f0893cf72ff0dfbd61b1fc28526420c6c20557d3) by [@finnp](https://github.com/finnp))
- Support bridgeless with JSC and frameworks ([3965158a2d](https://github.com/facebook/react-native/commit/3965158a2d37c96c82f5c03e8beaeb7356c1d0f7))
- Add pods for bridgeless ([b06c2d7050](https://github.com/facebook/react-native/commit/b06c2d7050e91491b653444d749cef3da6e86a75))
- Added override method with default implementation ([abc6e1cbf4](https://github.com/facebook/react-native/commit/abc6e1cbf4cf9775205b0246404b0059a5838fba) by [@Gregoirevda](https://github.com/Gregoirevda))
- Add `smartInsertDelete` prop to `TextInput` component ([6b62f12ce9](https://github.com/facebook/react-native/commit/6b62f12ce957a6eea47f4abc1ead23f64d883ce8) by [@fabioh8010](https://github.com/fabioh8010))
- Add explicit dependencies for 3rd parties libraries ([c027f0a41f](https://github.com/facebook/react-native/commit/c027f0a41fd53a457a425d84e2c1e0ab6b862173) by [@cipolleschi](https://github.com/cipolleschi))
- Added conversion helper for UIInterfaceOrientationMask to RCTConvert ([2ab750f7bb](https://github.com/facebook/react-native/commit/2ab750f7bbcfcc81714054cabb574442f33298bf))

### Changed

- Use new Hermes CDP handler implementation for debugging ([3e7a873f2d](https://github.com/facebook/react-native/commit/3e7a873f2d1c5170a7f4c88064897e74a149c5d5) by [@huntie](https://github.com/huntie))
- Add 'j' to debug key trigger from CLI ([321f7dbcad](https://github.com/facebook/react-native/commit/321f7dbcadb78dede9048500ab8abe86af863061) by [@huntie](https://github.com/huntie))
- Relax FlatList.onViewableItemsChanged validation ([5cfa125b97](https://github.com/facebook/react-native/commit/5cfa125b979c7ce76884a81dd3baaddcf4a560fd))
- Don't use setState for disabled KeyboardAvoidingView to avoid re-renders ([783150f37b](https://github.com/facebook/react-native/commit/783150f37be790f44e5a368982a200c7c08a866f) by [@adamgrzybowski](https://github.com/adamgrzybowski))
- Add mock removeEventListener and currentState method for `AppState` ([1bda78f2fa](https://github.com/facebook/react-native/commit/1bda78f2fa64210cdfb1d84f0ce0d56be446e3e8) by [@w3cay](https://github.com/w3cay))
- Default condition set for experimental Package Exports is now ['require', 'import', 'react-native'] ([808b3c9716](https://github.com/facebook/react-native/commit/808b3c9716e6d96b9e7308e46802de48ddc626d0) by [@huntie](https://github.com/huntie))
- Remove default 50ms Scroll Event Throttling in VirtualizedList ([3eccc53629](https://github.com/facebook/react-native/commit/3eccc536292aa344f8d796e9325ab2aaeacfa24e) by [@NickGerleman](https://github.com/NickGerleman))
- Sync AnimatedValue JS node value when animation completes ([51cea49be7](https://github.com/facebook/react-native/commit/51cea49be73250f5b346db9882a2da522cd508d8) by [@genkikondo](https://github.com/genkikondo))
- Return animated values to JS for natively driven animations ([4b54c0b1fa](https://github.com/facebook/react-native/commit/4b54c0b1faf8233986bf9232e1a18a1c5067ad3a) by [@genkikondo](https://github.com/genkikondo))
- Fixed `source` in `Image` type ([83885f1d69](https://github.com/facebook/react-native/commit/83885f1d693fdb7d3ce369cc67bcd39a9755f987) by [@BrodaNoel](https://github.com/BrodaNoel))
- Address errors in viewability thresholds on Virtualized list by Math.floor the top and bottom dimensions of a cell item when determining viewability. ([824c1c6d07](https://github.com/facebook/react-native/commit/824c1c6d073ba53aab350bc617169ba04e568b19) by [@lunaleaps](https://github.com/lunaleaps))
- Change `_onLayout` to update bottom height when frame height is changed ([5059ddc5ce](https://github.com/facebook/react-native/commit/5059ddc5ce623234820f231e5f4d75ea9ddf5a5b) by [@lyqandy](https://github.com/lyqandy))
- Renaming bridgeless to runtime ([1547b81ec1](https://github.com/facebook/react-native/commit/1547b81ec18f4d66991831d06ce456472456bed5))
- Update Metro to ^0.80.0, don't pin to exact version ([aed4aed9d5](https://github.com/facebook/react-native/commit/aed4aed9d5b02043291642c9177ceea9df9c7a4a) by [@robhogan](https://github.com/robhogan))
- Bump Jest version in the new project template from `^29.2.1` to `^29.6.3` ([3c323382fe](https://github.com/facebook/react-native/commit/3c323382fe9ef05832fc44c6e87642de55965a4b) by [@robhogan](https://github.com/robhogan))
- ReactImagePropertyList.java => ReactImagePropertyList.kt ([cb60e5c67b](https://github.com/facebook/react-native/commit/cb60e5c67b409da1b22e856446183bc7c82d828b) by [@bufgix](https://github.com/bufgix))
- `BaseViewManagerTest.java` => `BaseViewManagerTest.kt` ([3660b7cf73](https://github.com/facebook/react-native/commit/3660b7cf73a322750fb9cc9aa124da0f5e739c80) by [@retyui](https://github.com/retyui))
- React-native/babel-plugin-codegen to react-native/babel-preset ([1c3b3a09b6](https://github.com/facebook/react-native/commit/1c3b3a09b60efc55456ecfe4b79b8cc73d30f739) by [@dmytrorykun](https://github.com/dmytrorykun))
- Replace `JSX.Element` with `React.JSX.Element` in `App.tsx` template ([1383a59ed2](https://github.com/facebook/react-native/commit/1383a59ed265531092de68ceb50dbf449070d7c0) by [@retyui](https://github.com/retyui))
- Move react-native-babel-transformer and react-native-babel-preset from Metro to React Native repo. ([d380bb8473](https://github.com/facebook/react-native/commit/d380bb8473f1c03ca277074e952f03649d767766) by [@dmytrorykun](https://github.com/dmytrorykun))
- Stricter TS check for transform style ([e414713e4c](https://github.com/facebook/react-native/commit/e414713e4c6d19a4f4aaa0193f540636dd936eb0) by [@vonovak](https://github.com/vonovak))
- Bump Flipper to 0.204.0 ([d9c8cd3b40](https://github.com/facebook/react-native/commit/d9c8cd3b4051ecb9230a44289f9cf026b954ecdb) by [@szymonrybczak](https://github.com/szymonrybczak))
- Remove YGExperimentalFeatureFixAbsoluteTrailingColumnMargin ([3f6412b934](https://github.com/facebook/react-native/commit/3f6412b934250ef2c0fe2d573ea10f77b0e5eaa3) by [@NickGerleman](https://github.com/NickGerleman))
- Pressable: prevent click bubbling in Pressable ([a449291323](https://github.com/facebook/react-native/commit/a44929132397181a11ec02e77e60b2bb0bb6add6))
- Dirty nodes when dynamically setting config ([bde38d543e](https://github.com/facebook/react-native/commit/bde38d543e82d75b155ad60421674fb3549ef175) by [@NickGerleman](https://github.com/NickGerleman))
- Jest globals are now defined using `Object.defineProperties` instead of object property assignment ([cf631ad59f](https://github.com/facebook/react-native/commit/cf631ad59f39bbace1a7c2311a4f66f9494ed0da) by [@yungsters](https://github.com/yungsters))
- Support mixed props for events in codegen ([b68f53d44f](https://github.com/facebook/react-native/commit/b68f53d44f78c5627905246d8737fe46229f85aa) by [@genkikondo](https://github.com/genkikondo))
- React-native-codegen: Buck-only: renamed src_prefix kwarg ([9193c4f50c](https://github.com/facebook/react-native/commit/9193c4f50c471193979bab589996d97bab489db4) by [@fkgozali](https://github.com/fkgozali))
- Update CLI to v12.1.1 ([3da0959291](https://github.com/facebook/react-native/commit/3da0959291d34eca45da386a660bff184b7adb9e) by [@szymonrybczak](https://github.com/szymonrybczak))

#### Android specific

- Convert the app template to Kotlin ([c1c22ebacc](https://github.com/facebook/react-native/commit/c1c22ebacc4097ce56f19385161ebb23ee1624b3) by [@cortinico](https://github.com/cortinico))
- Upgrade target sdk version to 34 ([a6b0984893](https://github.com/facebook/react-native/commit/a6b0984893a6d1d9da5c4f69edcb3aed6407730e))
- Bump NDK to 25 ([28deaa3a71](https://github.com/facebook/react-native/commit/28deaa3a71085dc877da7f68dcec78c63bd9192a) by [@szymonrybczak](https://github.com/szymonrybczak))
- Remove Flipper actions in Dev Menu, add new Open Debugger action ([3bc402f612](https://github.com/facebook/react-native/commit/3bc402f612571fbfb70c309dcb2faaf67a524cfc) by [@huntie](https://github.com/huntie))
- Add `scrollEventThrottle` prop support for android ([777934ec3a](https://github.com/facebook/react-native/commit/777934ec3ad05486602e73169cd4f2e7523cc93f))
- Don't display the PopupWindow when current activity is in a bad state ([cee5dceac7](https://github.com/facebook/react-native/commit/cee5dceac7285fbae76139ebd58784009e2da2fb))
- React trees will be unmounted when the application is reloaded ([e133100721](https://github.com/facebook/react-native/commit/e133100721939108b0f28dfa9f60ac627c804018) by [@javache](https://github.com/javache))
- Fix crash "lateinit property initialProps has not been initialized" ([188eceec98](https://github.com/facebook/react-native/commit/188eceec98a6e6892c66fb81214ee5f646ce97a9))
- Deprecating createNativeModules method from ReactPackage interface recommending using getModule instead in the new architecture of React Native ([33181ef8af](https://github.com/facebook/react-native/commit/33181ef8afd621252c7cbf181b15fc162fc294a2) by [@mdvacca](https://github.com/mdvacca))
- Introducing getModule method into ReactPackage interface, defaulting to null. This method will be used in the Stable API of React Native ([da8616ec69](https://github.com/facebook/react-native/commit/da8616ec69a12a90b973fea1d8345c7517408a73) by [@mdvacca](https://github.com/mdvacca))
- Update Java tests to Kotlin for the referenced file ([3dbb759506](https://github.com/facebook/react-native/commit/3dbb7595060b1454fbd8ec80cb851fe6af8f41da) by [@stewartsum](https://github.com/stewartsum))
- Deprecate JSCJavaScriptExecutorFactory and JSCJavaScriptExecutor, use com.facebook.react.jscexecutor instead ([0cac88fa65](https://github.com/facebook/react-native/commit/0cac88fa65fd33dd6164ed2d6c4fbcdfa47f9e82) by [@mdvacca](https://github.com/mdvacca))
- Throw ReactNoCrashSoftException when handle memory pressure to avoid crash ([fa9ea8326e](https://github.com/facebook/react-native/commit/fa9ea8326e693b258e303aee6f59b049dcecea31))
- Throw Error in dispatchViewManagerCommand when non-numeric tag is passed for easier debugging ([0519c11acd](https://github.com/facebook/react-native/commit/0519c11acd0c347db378bbc9238c7dabfd38f6fa) by [@hsource](https://github.com/hsource))
- Moved ReactFontManager to a common package ([7341f9abdc](https://github.com/facebook/react-native/commit/7341f9abdcfbf5cf4dd5f8cda49151b28ae246bf) by [@fkgozali](https://github.com/fkgozali))
- Throw Error in dispatchViewManagerCommand when non-numeric tag is passed for easier debugging ([ff1972daba](https://github.com/facebook/react-native/commit/ff1972dabafbbfc18203464b452e0d5b796cdcf6) by [@hsource](https://github.com/hsource))
- Fresco to 3.0.0 ([823839bcc1](https://github.com/facebook/react-native/commit/823839bcc13526a5a37a0d316f90a39f6bf283bd) by [@cortinico](https://github.com/cortinico))
- Avoid duplicate destroy on same thread ([43f7781c87](https://github.com/facebook/react-native/commit/43f7781c87c3540f2ad09147ea3fb63765b72f01))
- Use new `getCanonicalName` and `getMessage` methods exposed by `fbjni` ([6c729acd12](https://github.com/facebook/react-native/commit/6c729acd12933d79aae3ef05dbdecfa0feb96bf4) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- Changed the scope of `setJSEngineResolutionAlgorithm` to public from private. Brownfield apps should be able to setup the JSResolutionAlgorithm before hand. ([cb376dd0d8](https://github.com/facebook/react-native/commit/cb376dd0d80fce9284c96fc5c03503a5c159fe86) by [@SparshaSaha](https://github.com/SparshaSaha))
- Java to 17 and AGP to 8.0.2 ([9f7dddf1ac](https://github.com/facebook/react-native/commit/9f7dddf1ac34a54f27c97d2e451e7cb724cd0094) by [@cortinico](https://github.com/cortinico))
- Use reference Yoga CMake Build ([6764adafe4](https://github.com/facebook/react-native/commit/6764adafe4c702b3d514179e4e6cfa0534f44de2) by [@NickGerleman](https://github.com/NickGerleman))
- Enable Template with Bridgeless ([8b2f324a9b](https://github.com/facebook/react-native/commit/8b2f324a9b915f504b237cad1281735b22684444))
- Kotlin to 1.8.0 and JDK Toolchain to 11 ([74987b6fca](https://github.com/facebook/react-native/commit/74987b6fca4aa31e15f83d871138f4edf258c082) by [@cortinico](https://github.com/cortinico))
- Deprecate APIs that are deprecate only on JavaDoc ([1be65baf29](https://github.com/facebook/react-native/commit/1be65baf29967ec062f049d57d579694af816c1c) by [@cortinico](https://github.com/cortinico))
- Gradle to 8.1 ([74f256b6f0](https://github.com/facebook/react-native/commit/74f256b6f019877c2854541845e11e024c16dd44) by [@cortinico](https://github.com/cortinico))
- "Open Debugger" is no longer available for remote JS debugging from the Dev Menu (non-Hermes). Please use `NativeDevSettings.setIsDebuggingRemotely()`. ([361a944348](https://github.com/facebook/react-native/commit/361a944348e4da5d17f910965d0b89c9e65b18c7) by [@huntie](https://github.com/huntie))

#### iOS specific

- Remove Flipper actions in Dev Menu, add new Open Debugger action ([5bfc507655](https://github.com/facebook/react-native/commit/5bfc5076557c92211bb58f8ac8fc008e87b14228) by [@huntie](https://github.com/huntie))
- Moved the min iOS version to 13.4 ([610b14e4f3](https://github.com/facebook/react-native/commit/610b14e4f3f606cd4c49518b9a42e3290fd52aeb) by [@cipolleschi](https://github.com/cipolleschi))
- TurboModules are now exposed to JS as the prototype of a plain JS object, so methods can be cached ([20dba39dab](https://github.com/facebook/react-native/commit/20dba39dab4ef85eb28659a89b19750cec3193a4) by [@javache](https://github.com/javache))
- Restored `cancelable` option in `Pressability` configuration to not block native responder, and instead introduced a new optional `blockNativeResponder` boolean option to accomplish the same thing. ([30e2345b26](https://github.com/facebook/react-native/commit/30e2345b263233a4ebac6a4839885c8bc337bdfd) by [@yungsters](https://github.com/yungsters))
- Scroll `ScrollView` text fields into view with `automaticallyAdjustsScrollIndicatorInsets` ([9ca16605e0](https://github.com/facebook/react-native/commit/9ca16605e0eb7b30996f10109aa9080088078995) by [@adamaveray](https://github.com/adamaveray))
- Remove Xcode 15 `_LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION` workaround for boost ([b9f0bdd12d](https://github.com/facebook/react-native/commit/b9f0bdd12d9d7eeb5a6cc13a4e9793fc6031a94b) by [@Kudo](https://github.com/Kudo))
- Updated comment in RCTBundleURLProvider.h to instance correct jsBundleURLForBundleRoot:fallbackExtension method. ([d208dc422c](https://github.com/facebook/react-native/commit/d208dc422c9239d126e0da674451c5898d57319d) by [@JulioCVaz](https://github.com/JulioCVaz))
- Set the new arch flag based on the React Native version. ([a8d268593a](https://github.com/facebook/react-native/commit/a8d268593ae811fcc0ef10749aab84abfb8ec89e) by [@cipolleschi](https://github.com/cipolleschi))
- Add RCTPlatformName to RCTConstants.h ([046ae12a6d](https://github.com/facebook/react-native/commit/046ae12a6db9e7404131b28f44e2cf842551e3f3) by [@Saadnajmi](https://github.com/Saadnajmi))
- Use the runtime scheduler in the old Architecture ([2692f206a6](https://github.com/facebook/react-native/commit/2692f206a6ff16f65d47f70774908db816cee989) by [@cipolleschi](https://github.com/cipolleschi))
- Set DEFINES_MODULE xcconfig in React-RCTAppDelegate to generate a module map for this pod ([7c79e3107f](https://github.com/facebook/react-native/commit/7c79e3107fe735d4afa41c29ab9a3453cab38d11) by [@tsapeta](https://github.com/tsapeta))
- Move .m to .mm to make obj-c and C++ headers compatible ([42d67452eb](https://github.com/facebook/react-native/commit/42d67452eb9a507651078882d00df44dd6720049))
- Remove deprecated uses of UIActivityIndicatorViewStyle ([62e9faefd5](https://github.com/facebook/react-native/commit/62e9faefd5f12f5fe6dc88a076ddf7cafda75ee5) by [@Saadnajmi](https://github.com/Saadnajmi))
- Fix setRuntimeConfigProvider called multiple times error ([637ffb175d](https://github.com/facebook/react-native/commit/637ffb175db17af0582d503e9f510c4fe35c115b))
- Set initial AppState status to "inactive" instead of "unknown" ([54a5ff9745](https://github.com/facebook/react-native/commit/54a5ff9745ca8713b8d3a83dc37792ea71597b53) by [@louiszawadzki](https://github.com/louiszawadzki))
- Return animated values to JS for natively driven animations ([b0485bed09](https://github.com/facebook/react-native/commit/b0485bed0945061becace5af924fa60b17ab295f) by [@genkikondo](https://github.com/genkikondo))
- Disabled bitcode for Hermes prebuilts ([de6bfec82a](https://github.com/facebook/react-native/commit/de6bfec82a1cb4b387bfe8a87b1f597f39572764) by [@cipolleschi](https://github.com/cipolleschi))
- Make RNTester use RCTAppDelegate ([680cbe757b](https://github.com/facebook/react-native/commit/680cbe757b250fd9a05862040c080f063b2197a7) by [@cipolleschi](https://github.com/cipolleschi))
- Changed AppDelegate template to avoid retaining TurboModuleManager. ([ec1ab73674](https://github.com/facebook/react-native/commit/ec1ab736744bb3a511ce38cace8891b01436ae75) by [@javache](https://github.com/javache))
- Migrate RNTester to Bridgeless ([d3c28d28a9](https://github.com/facebook/react-native/commit/d3c28d28a9b5324310f0d86c284d3d8ffd63615b))
- Re-organise BridgelessApple files to keep proper header file include structure ([736dd5a3c0](https://github.com/facebook/react-native/commit/736dd5a3c0c074db25551db080e8f0a925f37bd8))

### Deprecated

- Deprecate YGConfigSetUseLegacyStretchBehaviour ([7f300cd755](https://github.com/facebook/react-native/commit/7f300cd75539ba153ce3ee4758a9b1ea1f00a247) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- Deprecate hasConstants from ReactModule annotation ([ccfd4c080c](https://github.com/facebook/react-native/commit/ccfd4c080ccaf9b030dbd6f3f5a3242b457db8be) by [@philIip](https://github.com/philIip))
- ReactModuleInfo constructor with getConstants arg is deprecated ([9f52378cc1](https://github.com/facebook/react-native/commit/9f52378cc1061c7c9dae6aee5147bb54f0aa24aa) by [@philIip](https://github.com/philIip))
- HasConstants in ReactModuleInfo is marked as deprecated ([196d9f9520](https://github.com/facebook/react-native/commit/196d9f9520be90190618c0f459719ffa08ab9673) by [@philIip](https://github.com/philIip))
- Deprecating EventBeatManager constructor that receives a Context as a parameter. ([363224ea62](https://github.com/facebook/react-native/commit/363224ea626a3ddc51500a16d337da1df2d09633) by [@mdvacca](https://github.com/mdvacca))
- Deprecate and mark for removal com.facebook.react.common.StandardCharsets, please use java.nio.charset.StandardCharsets instead ([c0b4883058](https://github.com/facebook/react-native/commit/c0b488305860fabd3d737674d614e4f466ace0ed) by [@mdvacca](https://github.com/mdvacca))
-  ([a4fe9b2b6d](https://github.com/facebook/react-native/commit/a4fe9b2b6da84ebfa5b90883dc4787e95e98405f) by [@philIip](https://github.com/philIip))
- Deprecate TurboModuleManager.getLegacyCxxModule ([7a08fbb088](https://github.com/facebook/react-native/commit/7a08fbb0882779330b2135962842ddc92166be5c) by [@RSNara](https://github.com/RSNara))
- Deprecate TurboModuleRegistry.getModule(), getModules(), hasModule(), ([3af66bf7fb](https://github.com/facebook/react-native/commit/3af66bf7fbd88d77fe27770bcb829768bf949b9c) by [@RSNara](https://github.com/RSNara))

#### iOS specific

- Deprecate `get_default_flags` in Ruby scripts ([f60b9f695e](https://github.com/facebook/react-native/commit/f60b9f695e1c08714735b78366267127b29ab705) by [@cipolleschi](https://github.com/cipolleschi))
- Use -[RCTTurboModuleManager installJSBindings:] instead of -[RCTTurboModuleManager installJSBindingWithRuntimeExecutor:] ([7fb9e4f46c](https://github.com/facebook/react-native/commit/7fb9e4f46c3131f74a9672afc6cc426a61adde0c) by [@javache](https://github.com/javache))

### Removed

- Remove remote debugging from the dev menu ([28e1ca9873](https://github.com/facebook/react-native/commit/28e1ca98737014a9a1735789b3fb817255ffdfdf) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Remove experimental support for loading bytecode from Metro ([6abc097bf3](https://github.com/facebook/react-native/commit/6abc097bf32ade1438fcf6c33bf6cc8c192249f8) by [@motiz88](https://github.com/motiz88))
- Remove internal DevSplitBundleLoader native module ([6dcdb93ec0](https://github.com/facebook/react-native/commit/6dcdb93ec0c581f08b4f4a4ea1816571f15cc2ca) by [@motiz88](https://github.com/motiz88))

#### Android specific

- Remove unused `canLoadFile` function from HermesExecutor.java ([1b7e26cccb](https://github.com/facebook/react-native/commit/1b7e26cccb3460b3525ab5066313f5dd2254ac30) by [@cortinico](https://github.com/cortinico))
- Polish DevServerHelper (remove unused Interfaces) ([7dcaf00835](https://github.com/facebook/react-native/commit/7dcaf008352d53feeb9ced493adb10d72f9e04c1) by [@cortinico](https://github.com/cortinico))
- DevServerHelper should not depend on internal ctor parameter ([da358d0ec7](https://github.com/facebook/react-native/commit/da358d0ec7a492edb804b9cdce70e7516ee518ae) by [@cortinico](https://github.com/cortinico))
- Deprecate Java YogaConfig.setUseLegacyStretchBehaviour() ([f635341461](https://github.com/facebook/react-native/commit/f6353414613f89ce309547c43fab6c3ca5315266) by [@NickGerleman](https://github.com/NickGerleman))
- Remove TurboModuleManagerDelegate.getLegacyCxxModule ([6f10110555](https://github.com/facebook/react-native/commit/6f10110555694ec659a87f41b65ca12ee044d908) by [@RSNara](https://github.com/RSNara))
- Remove TurboModuleManager.getNativeModule,getNativeModules,hasNativeModule ([ac2a4d8e6c](https://github.com/facebook/react-native/commit/ac2a4d8e6cee233686e497e29518f0f11a89a4d7) by [@RSNara](https://github.com/RSNara))
- Delete hasConstants() method from BaseJavaModule ([bbc3657ff4](https://github.com/facebook/react-native/commit/bbc3657ff4efd0218e02ad9a3c73725a7f8a366c) by [@mdvacca](https://github.com/mdvacca))
- Deleted obsolete native methods DevServerHelper.symbolicateStackTrace and DevServerHelper.openStackFrameCall ([ad46bc6d77](https://github.com/facebook/react-native/commit/ad46bc6d775330ed55c5b945c8b3cf7145ad5a61) by [@GijsWeterings](https://github.com/GijsWeterings))
- Reduce visibility of DevInternalSettings class ([1a9e444b61](https://github.com/facebook/react-native/commit/1a9e444b61630066604a974d3c0527a4ad7707e5) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Remove redundant ifdefs for ArrayBuffer backwards compatibility ([fb30fcaa2f](https://github.com/facebook/react-native/commit/fb30fcaa2f526cc1f7c2d4189ec9c57f9cf9b3c5) by [@Saadnajmi](https://github.com/Saadnajmi))
- Remove RCTSurfaceHostingComponent and RCTSurfaceBackedComponent, needed only for ComponentKit integration. ([b8d60a834f](https://github.com/facebook/react-native/commit/b8d60a834f25cfde8a8580a32afc752b52d10a8d) by [@constantine-fry](https://github.com/constantine-fry))
- Remove PRODUCTION flag from iOS build logic ([daa99fe5e7](https://github.com/facebook/react-native/commit/daa99fe5e7d3b4fc634513ae8b3d954c7b40eaa4) by [@cipolleschi](https://github.com/cipolleschi))
- Delete bridge.loadAndExecuteSplitBundleURL ([e2d512a1ee](https://github.com/facebook/react-native/commit/e2d512a1eef9950d3475c95dee8d2474a5723d74) by [@RSNara](https://github.com/RSNara))
- delete RCTJSScriptLoaderModule ([438f6cf591](https://github.com/facebook/react-native/commit/438f6cf5915786e611ebea3bfc9b96c3106c2aa9) by [@philIip](https://github.com/philIip))
- Remove Xcode 12.5 post install workaround ([0ab8b40fd6](https://github.com/facebook/react-native/commit/0ab8b40fd64ad86b4598293faa0b77e71fc9d349) by [@Saadnajmi](https://github.com/Saadnajmi))

### Fixed

- Fix virtualization logic with horizontal RTL lists ([8b39bfadbb](https://github.com/facebook/react-native/commit/8b39bfadbb6206168db9601b86734a583ac11461) by [@NickGerleman](https://github.com/NickGerleman))
- Fix a potential bug in `EventEmitter` when used with certain Babel configurations that incorrectly polyfill the spread operator for iterables. ([8b768f144a](https://github.com/facebook/react-native/commit/8b768f144a3cad25d84a4e70b880e5aa1d5ff872) by [@yungsters](https://github.com/yungsters))
- Remove need for platform overrides in SafeAreaView.js ([80f531f9f4](https://github.com/facebook/react-native/commit/80f531f9f4c5eb43af6b4e7979cf6b7b3af12992) by [@christophpurrer](https://github.com/christophpurrer))
- Hide Babel helpers and other core files from LogBox stack traces by default ([af73a75c21](https://github.com/facebook/react-native/commit/af73a75c215577847666dac49a3360a967f0dc46) by [@motiz88](https://github.com/motiz88))
- Mitigate flickering on color animations ([5f8bbf2bd2](https://github.com/facebook/react-native/commit/5f8bbf2bd27ccff2c83be8d9dedc7005854fecaa) by [@genkikondo](https://github.com/genkikondo))
- Resolves Animated.Value.interpolate results in NaN when output is in radians ([ae0d714bbd](https://github.com/facebook/react-native/commit/ae0d714bbdd2eb9d114c17c3945b2f678f60b65a) by [@javache](https://github.com/javache))
- Fix invariant violation when using viewability callbacks with horizontal RTL FlatList on Paper ([a2fb46ec0d](https://github.com/facebook/react-native/commit/a2fb46ec0d157a4f9d5e4eb0f4c885aaf60c4325) by [@NickGerleman](https://github.com/NickGerleman))
- Fix invariant violation when `maintainVisibleContentPosition` adjustment moves window before list start ([c168a4f88b](https://github.com/facebook/react-native/commit/c168a4f88bc51e441e704694eed498ce67c9c353) by [@NickGerleman](https://github.com/NickGerleman))
- Fix backfaceVisibility after transform changes ([242c835c42](https://github.com/facebook/react-native/commit/242c835c422287aa91723cf2ad902ea232f17d15) by [@javache](https://github.com/javache))
- Add missing type for TextInput.readOnly in Typescript ([deb81853f5](https://github.com/facebook/react-native/commit/deb81853f5618df2ee5fda7096777ac629babb7a) by [@antliann](https://github.com/antliann))
- Do not render mocked <Modal /> when `visible=false` ([468a13635a](https://github.com/facebook/react-native/commit/468a13635a592621562b10b395ec73f0f4d28093) by [@mdjastrzebski](https://github.com/mdjastrzebski))
- Fix a type issue of NativeEventEmitter ([d4d323cbc2](https://github.com/facebook/react-native/commit/d4d323cbc2469d54bbd684c478953df5bc815421))
- Add support to archive Schemes names with backspaces ([a384e076e0](https://github.com/facebook/react-native/commit/a384e076e0f446610ab5c0ad2300fd94c27489f3) by [@yardenPhy](https://github.com/yardenPhy))
- Updated TypeScript definitions to include userSelect style support. Refer to commit [2e4d8b6c145](https://github.com/facebook/react-native/commit/2e4d8b6c145ed36b600a0481d7f65157a78abbeb) for the specific changes. ([30ab7a45ec](https://github.com/facebook/react-native/commit/30ab7a45eceaa851e8af239f9b64bf7eec424952) by [@MjMoshiri](https://github.com/MjMoshiri))
- Use right edge of ScrollView viewport for `scrollMetrics.offset` in RTL ([0e69050612](https://github.com/facebook/react-native/commit/0e690506124de44ea6e98012aad817aac9de7f9b) by [@NickGerleman](https://github.com/NickGerleman))
- AnimatedColor flickering on Android ([ec97646fe4](https://github.com/facebook/react-native/commit/ec97646fe4a6d8cf002c3670e0444371e67edf9f))
- Fixup contentLength invalidation logic ([ace0a80dea](https://github.com/facebook/react-native/commit/ace0a80dead59d552ed16872de05cd9e977fc6b2) by [@NickGerleman](https://github.com/NickGerleman))
- Right align scrollToIndex in RTL ([5596f1c25b](https://github.com/facebook/react-native/commit/5596f1c25b31cbe38357264c3e31e5a60fa22380) by [@NickGerleman](https://github.com/NickGerleman))
- Cache ScrollView content length before calling `scrollToIndex` ([33d6da01ea](https://github.com/facebook/react-native/commit/33d6da01ea15022485d8e65beae49a779130921a) by [@NickGerleman](https://github.com/NickGerleman))
- Update `event-target-shim` import to support Metro resolving `mjs` modules before `js`. ([e37e53086a](https://github.com/facebook/react-native/commit/e37e53086af5c0569830efa607fc42c2b9593be1) by [@EvanBacon](https://github.com/EvanBacon))
- Avoids re-renders during text selection on desktop platforms by limiting native-only `isHighlighted` prop to iOS ([3d2fd4bf22](https://github.com/facebook/react-native/commit/3d2fd4bf228c64b1f46dc4737cf5c8eb50392eb0))
- Fixed missing property `signal` for the `Request` interface ([823b1f467b](https://github.com/facebook/react-native/commit/823b1f467b42b6d8b68a2f4af292c2663f192cd2) by [@ljbc1994](https://github.com/ljbc1994))
- Remove need for platform overrides to Settings ([3c15b68d56](https://github.com/facebook/react-native/commit/3c15b68d565ac6f5bae782dac3a3fa5ca66f821d) by [@christophpurrer](https://github.com/christophpurrer))
- Remove need for each platform to implement ToastAndroid as UnimplementedView ([800ea60393](https://github.com/facebook/react-native/commit/800ea60393cc810ef4b36ed102694deda04162c9) by [@christophpurrer](https://github.com/christophpurrer))
- Remove need for each platform to implement DrawerLayoutAndroid as UnimplementedView ([151f3900de](https://github.com/facebook/react-native/commit/151f3900de092199fd18cf89aea470a41827bb06) by [@christophpurrer](https://github.com/christophpurrer))
- Remove need for each platform to implement ProgressBarAndroid as UnimplementedView ([c02fcca187](https://github.com/facebook/react-native/commit/c02fcca187e8136dd320ba7c6bbab7268f1267ca) by [@christophpurrer](https://github.com/christophpurrer))
- Correct the NativeSyntheticEvent type ([fedad15a69](https://github.com/facebook/react-native/commit/fedad15a693c9715fe258f0a0a41e131374700bb) by [@mmmulani](https://github.com/mmmulani))
-  ([4aa53d241d](https://github.com/facebook/react-native/commit/4aa53d241d79f0e0c6e82c4c8ea8c73d48934a14) by [@IslamRustamov](https://github.com/IslamRustamov))
- Fixed missing File declaration in Typescript global.d.ts ([9c0441b8a1](https://github.com/facebook/react-native/commit/9c0441b8a100bbc4e47c8ba725b30ea979bb61e8) by [@trashcoder](https://github.com/trashcoder))
- Android does't crash when using remote debugger ([0fe5ffd568](https://github.com/facebook/react-native/commit/0fe5ffd568b46104625479e1f9afa1b18cdf71b6) by [@javache](https://github.com/javache))
- Fix timestamps and grouped display of console messages within in a `console.group` ([48791bcd98](https://github.com/facebook/react-native/commit/48791bcd9873b4db10435077c0560907fdb263b2))
- When animating using native driver, trigger rerender on animation completion in order to update Pressability responder regions ([c870a529fe](https://github.com/facebook/react-native/commit/c870a529fe78ea1cc780f6b7c6f1b0940f4eb8df) by [@genkikondo](https://github.com/genkikondo))
- Specify float value in ParagraphLayoutManager ([efc5f73f27](https://github.com/facebook/react-native/commit/efc5f73f27de1cc63c7182811293a87de4436359) by [@TatianaKapos](https://github.com/TatianaKapos))
- When animating using native driver, trigger rerender on animation completion in order to update Pressability responder regions ([03f70bf995](https://github.com/facebook/react-native/commit/03f70bf995379f08a77abcf96bb0e31ff75ca8c3) by [@genkikondo](https://github.com/genkikondo))
- Fixed computation of layout via `ref.measureRelative` and `ref.measureInWindow` for nodes with scale/rotate transforms in their parents. ([64416d9503](https://github.com/facebook/react-native/commit/64416d9503f9c17ab5ceec2a1506a97a2049f879) by [@rubennorte](https://github.com/rubennorte))
- Remove duplicated code that resulted after a merge conflict. ([8dcaa4cc3b](https://github.com/facebook/react-native/commit/8dcaa4cc3b8d2f72337a0652b5058769b68d1eb8) by [@cipolleschi](https://github.com/cipolleschi))
- Fix[devtools]: fixed duplicated backend activation with multiple renderers ([ada6c51943](https://github.com/facebook/react-native/commit/ada6c51943925ca161bf3f4f2dd1f453d5fdc543) by [@hoxyq](https://github.com/hoxyq))
- Change FlatList `viewabilityConfig` prop type `any` to `ViewabilityConfig` ([5dfa38a20e](https://github.com/facebook/react-native/commit/5dfa38a20e72f6fe560577ec499ff2fee5943b73) by [@jeongshin](https://github.com/jeongshin))
- Refactor: `substr()` is deprecated, using `slice()` instead across RN codebase ([8a49754cda](https://github.com/facebook/react-native/commit/8a49754cdaf259a9300eb254e0e5da0c7ce3b125) by [@Pranav-yadav](https://github.com/Pranav-yadav))
- Fix VirtualizedList with `maintainVisibleContentPosition` ([69b22c9799](https://github.com/facebook/react-native/commit/69b22c9799108c05ddc9875d162060826c6e46e2) by [@janicduplessis](https://github.com/janicduplessis))
- Make sure initialScrollToIndex is bigger than 0 when adjusting cells ([eb30a80c81](https://github.com/facebook/react-native/commit/eb30a80c81bd385f9902548b14df2a3c17e2dd5c) by [@okwasniewski](https://github.com/okwasniewski))
- Comment out unreferenced formal parameter ([3c0ad81fef](https://github.com/facebook/react-native/commit/3c0ad81fef96d23a7240b708346c7f015f37aea9) by [@TatianaKapos](https://github.com/TatianaKapos))
- Resolved property name conflicts in event-emitter codegen ([3759a26214](https://github.com/facebook/react-native/commit/3759a262146390798a4aa0cd97b96f47a33d8c08) by [@javache](https://github.com/javache))
- Issue with TurboModule C++ codegen with optional return types ([dd6d57eea1](https://github.com/facebook/react-native/commit/dd6d57eea107f1b89ff89cc439dcbe73093e5d17) by [@javache](https://github.com/javache))
- Issue with TurboModule C++ codegen with optional args ([0a8164d993](https://github.com/facebook/react-native/commit/0a8164d99352bb95462edb63283ce4a342cf2f07) by [@javache](https://github.com/javache))
- Fix podspecs building with C++ 14 ([5ea0b449e2](https://github.com/facebook/react-native/commit/5ea0b449e246257feddcd7ca6cf6c551e9c5ab76) by [@NickGerleman](https://github.com/NickGerleman))
- URLs parsed by RCTConvert should be encoded respecting RFC 3986, 1738/1808 ([9841bd8185](https://github.com/facebook/react-native/commit/9841bd81852d59608fe3566b17831d6d42eb7dcf) by [@philIip](https://github.com/philIip))
- Enhance/fix error reporting in reload and destroy ([f437224042](https://github.com/facebook/react-native/commit/f4372240429658b4050090b1f3a384cb6d440fe4) by [@RSNara](https://github.com/RSNara))
- Create FeatureFlag to gate Stable API for Turbo Module ([49197411d8](https://github.com/facebook/react-native/commit/49197411d886eb7673ca4cb5918a9ea2d7bb95d6) by [@mdvacca](https://github.com/mdvacca))
- Do not render React DevTools overlays unless they are connected ([39016889d0](https://github.com/facebook/react-native/commit/39016889d09f1766e218e52d2e141e960a35b38a) by [@hoxyq](https://github.com/hoxyq))
- Fix nullable-to-nonnull-conversion warnings ([2856bef721](https://github.com/facebook/react-native/commit/2856bef72119af4d46535facae61d9efed24e5ee) by [@caodoan](https://github.com/caodoan))
- Clear bundler banner messages after a certain delay during development. ([6eeb81a86e](https://github.com/facebook/react-native/commit/6eeb81a86e0cf4f050bb6bae5b09dedf8b251a15) by [@jacdebug](https://github.com/jacdebug))
- Correctly invalidate NSTextStorage when non layout related props change ([247da6ef7f](https://github.com/facebook/react-native/commit/247da6ef7fd0ae335ffc208218532becd596f855) by [@sammy-SC](https://github.com/sammy-SC))
- Ensure systrace events are always stopped ([97b6829b83](https://github.com/facebook/react-native/commit/97b6829b830d26da62ca014ae83b22b40b7c5379) by [@javache](https://github.com/javache))
- SafeAreaView shouldn't dirty layout on clone by default ([ecf1b84795](https://github.com/facebook/react-native/commit/ecf1b8479515759284e72a6f8680201795273fdf) by [@javache](https://github.com/javache))
- Terminate instead of throwing if TurboModule callback double-called ([dfd445cbc6](https://github.com/facebook/react-native/commit/dfd445cbc69c8bc6c5d1d3d7948472a0a3ae4927) by [@NickGerleman](https://github.com/NickGerleman))
- Reduce dynamic SchedulerFeatureFlags ([2a58b06863](https://github.com/facebook/react-native/commit/2a58b06863b320403cbbbeb9909e25db9c2aaa4e) by [@kassens](https://github.com/kassens))
- Enable -Wextra in C++ builds ([99674b360a](https://github.com/facebook/react-native/commit/99674b360a8b1a24545af9c56c9f55b2ec121ff6) by [@NickGerleman](https://github.com/NickGerleman))
- Update `deprecated-react-native-prop-types` to remove fragile transitive `*` dependencies. ([f00594b262](https://github.com/facebook/react-native/commit/f00594b26203ad2793b40c31d4f882d29daec46e) by [@robhogan](https://github.com/robhogan))
- Fix `createAnimatedStyle` when providing an undefined transform style ([7e26e0270b](https://github.com/facebook/react-native/commit/7e26e0270b5d9f8490320af563a4943d24d269ea) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Bail on hiPri render on missing layout data before checking priority ([817fedb0e7](https://github.com/facebook/react-native/commit/817fedb0e7a5276d86431c65cc886062ed8fe220) by [@NickGerleman](https://github.com/NickGerleman))
- `react-native/codegen` shouldn't be built unless it's in the repo — fixes `pod install` failures in pnpm setups ([3dd6a83c0e](https://github.com/facebook/react-native/commit/3dd6a83c0e39c54b4ff050589e4e13f1ccc66a5d) by [@tido64](https://github.com/tido64))
- Correctly declare runtime dependencies ([c32064c510](https://github.com/facebook/react-native/commit/c32064c5102cfd9b48abd25697cef9ceb05d18a3) by [@tido64](https://github.com/tido64))

#### Android specific

- Fix Text cut off issues when adjusting text size and font weight in system settings. ([babbc3e43c](https://github.com/facebook/react-native/commit/babbc3e43cf0a855186a91d3c6b615a1cd940d94))
- Set the accessibility role to `NONE` when a `null` string is passed to `fromValue` ([0f48e86fed](https://github.com/facebook/react-native/commit/0f48e86fedc5269f6fa5112d40282b747eacc0de) by [@cipolleschi](https://github.com/cipolleschi))
- Fix default shadow radius in TextAttributeProps ([05fd10d12f](https://github.com/facebook/react-native/commit/05fd10d12f1822d38ea6aafc3e0435d9640ca307) by [@NickGerleman](https://github.com/NickGerleman))
- UI freezing when using minimumFontScale ([79e8474b14](https://github.com/facebook/react-native/commit/79e8474b14e118daa0f6e525d6546892a09a09a3) by [@g4rb4g3](https://github.com/g4rb4g3))
- Fixed ScrollView momentum not stopping when calling scrollToEnd programmatically ([2f86aafdfd](https://github.com/facebook/react-native/commit/2f86aafdfd42764b25d2e9bd68a05644965b89d7) by [@Almouro](https://github.com/Almouro))
- Fixed an issue where calling `Accessibility.setAccessibilityFocus` on an unmounted component would crash ([5323221d14](https://github.com/facebook/react-native/commit/5323221d1442d1573bc65daff618478cb6f056f0) by [@Abbondanzo](https://github.com/Abbondanzo))
- Localize Talkback strings ([a7e5c96a3d](https://github.com/facebook/react-native/commit/a7e5c96a3d11671ed45b5d4f02334e8cc988ce9e) by [@NickGerleman](https://github.com/NickGerleman))
- Fix border clip check ([7d1f7f3f5f](https://github.com/facebook/react-native/commit/7d1f7f3f5fbc9e659757f17fae98fa8778ffdbb6) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Improve threading in enableFabricPendingEventQueue experiment ([318b4c0d4b](https://github.com/facebook/react-native/commit/318b4c0d4b63e0d85b0c6648d4118880524157fc) by [@javache](https://github.com/javache))
- Change `connectTimeout` to `callTimeout` in OKHttp client ([e00f2445d2](https://github.com/facebook/react-native/commit/e00f2445d223f512aa3a19b82d6eef207f6b14b3) by [@troZee](https://github.com/troZee))
- Fix a race with FpsView on using FpsDebugFrameCallback. ([a63b443e62](https://github.com/facebook/react-native/commit/a63b443e62aac6ad0c6745fb01a38cc49b88778d))
- Fix crash in CompositeTurboModuleManagerDelegate ([e716459d66](https://github.com/facebook/react-native/commit/e716459d66dade54e96f1dba11e4d3d179cf678c) by [@christophpurrer](https://github.com/christophpurrer))
- Fix race condition with ReactMarker calls to its native module ([6ab062dfec](https://github.com/facebook/react-native/commit/6ab062dfec990ec4915b2ca4514fbddff9bbd9a3))
- Generalize RTL Scroll Correction Logic ([30c7e9dfa4](https://github.com/facebook/react-native/commit/30c7e9dfa41348e96e946384c76f038ccd859896) by [@NickGerleman](https://github.com/NickGerleman))
- Fix letters duplication when using autoCapitalize ([ab3c00de2c](https://github.com/facebook/react-native/commit/ab3c00de2ca1cff959c724c09f7f61c3706b2904) by [@fknives](https://github.com/fknives))
- Fix ScrollView's onMomentumScrollEnd being called multiple times on Android ([06668fcbac](https://github.com/facebook/react-native/commit/06668fcbacd750771f1d53cce829dc55e86f3f3c) by [@AntoineDoubovetzky](https://github.com/AntoineDoubovetzky))
- ANR when having an inverted `FlatList` on android API 33+ ([90186cd9b7](https://github.com/facebook/react-native/commit/90186cd9b71bc6ffb593448c9bb5a3df66b3a0c6) by [@hannojg](https://github.com/hannojg))
- Surfaces in the new architecture no longer leak views once stopped ([c16e993bb8](https://github.com/facebook/react-native/commit/c16e993bb8417da9a4ff9e082a77a21688d75bac) by [@javache](https://github.com/javache))
- Support Android Transitions during Fragment navigation ([187f16ddc6](https://github.com/facebook/react-native/commit/187f16ddc66493c3046ceffed69e21c646dfa7b1) by [@grahammendick](https://github.com/grahammendick))
- Foreground ripple crashed on api < 23 ([ca65d97d60](https://github.com/facebook/react-native/commit/ca65d97d603f0308c18bbee835b7cf6d5f76e232) by [@vonovak](https://github.com/vonovak))
- Exclude trailing whitespace from newline character on measuring text line width ([2674d9bf7c](https://github.com/facebook/react-native/commit/2674d9bf7c8b9d668d1a4fe072346b0534bb0f1d) by [@bernhardoj](https://github.com/bernhardoj))
- W3CPointerEvents: include screen coordinates in pointer events ([3460ff5d04](https://github.com/facebook/react-native/commit/3460ff5d0492bb70806afec9c3c0b5edc00a7908))
- W3CPointerEvents: include modifier key properties in Android pointer events ([2bd4429365](https://github.com/facebook/react-native/commit/2bd4429365c37e9ce70b12ff3f8d9a3c10af2a4b))
- W3CPointerEvents: fix NPE due to null targetView ([96fd107d61](https://github.com/facebook/react-native/commit/96fd107d61da9b195928a2a6cfdc39fc095767b4))
- W3CPointerEvents: fix a case where cancel can cause NPE ([79ae710cc5](https://github.com/facebook/react-native/commit/79ae710cc54b5872ad4a41e67e3cd9b73b20ff5b))
- W3CPointerEvents: properly update hit path during native gestures ([396cdac629](https://github.com/facebook/react-native/commit/396cdac629594955ad37806464e41607fb59db48))
- Fixing line truncation issue in Text containing /n when numberOfLines = {1} ([0af806e96c](https://github.com/facebook/react-native/commit/0af806e96c20c826f5a4bd55a3f73f512d6bb5af))
- Fix ellipsis being cut on certain font sizes ([6d24ee13a4](https://github.com/facebook/react-native/commit/6d24ee13a47a58ff1b19c5a51f39f52c9a4a8a28) by [@BeeMargarida](https://github.com/BeeMargarida))
- Fix links hidden via ellipsis crashing screen readers ([d54f486fe6](https://github.com/facebook/react-native/commit/d54f486fe66d01450d3c7a04fb0a025319a3014c) by [@dhleong](https://github.com/dhleong))
- Fixed inconsistent styling for text nodes with many children ([dcb4eb050a](https://github.com/facebook/react-native/commit/dcb4eb050a900b21737b649dad3037b25d51fe5f) by [@cubuspl42](https://github.com/cubuspl42))
- Fix copy / paste menu and simplify controlled text selection on Android ([d4f6cf1d80](https://github.com/facebook/react-native/commit/d4f6cf1d80b6ee725b81d9fdccc263d193178249) by [@janicduplessis](https://github.com/janicduplessis))
- When applications reload, the previous react root will be correctly closed ([3a7555fb18](https://github.com/facebook/react-native/commit/3a7555fb18b47f64986e411e43a3cd48154a50e3) by [@javache](https://github.com/javache))
- ViewManagers now receive an invalidate callback ([c5e7cd4ad9](https://github.com/facebook/react-native/commit/c5e7cd4ad96f468e9c5e2966e5fa5d599daa3e00) by [@javache](https://github.com/javache))
- Fixed nightly builds of Android no longer building due to a recent version format change ([cceef57be1](https://github.com/facebook/react-native/commit/cceef57be1fca661c10955ecec088ce1ef7aab91) by [@tido64](https://github.com/tido64))
- Fix unreadable dev menu header on dark theme apps ([88e3130218](https://github.com/facebook/react-native/commit/88e313021808b50f378ea6ddf2a9909d82ed5f57) by [@cortinico](https://github.com/cortinico))
- Modify ViewManager.receiveCommand to call into delegate ([585057d746](https://github.com/facebook/react-native/commit/585057d7468b5ae8844fa8210df7ad1f8e0ae1e8) by [@genkikondo](https://github.com/genkikondo))
- Fix crash when Android requests permission with activity that does not implement `PermissionAwareActivity` ([cff4bc8eea](https://github.com/facebook/react-native/commit/cff4bc8eead129738a7040f579a18e3819d28bfd) by [@yungsters](https://github.com/yungsters))
- Fix issue downloading request body via remote URL ([4b39f44a61](https://github.com/facebook/react-native/commit/4b39f44a612e8f358b7f51cdb97b4d602207a754) by [@daisy1754](https://github.com/daisy1754))
- Fix textTransform not working in New Architecture ([a2f3fa65bc](https://github.com/facebook/react-native/commit/a2f3fa65bcabf8bb711813292002270481840579) by [@tarunrajput](https://github.com/tarunrajput))
- Fix projects being broken on dependencies starting with `a..` ([5ec2c01697](https://github.com/facebook/react-native/commit/5ec2c016972400cf6e26d987acec6feee46ba6e6) by [@cortinico](https://github.com/cortinico))
- Fix android root view group removal during instance re-creation ([bb075d785d](https://github.com/facebook/react-native/commit/bb075d785deb3732689bf6aacdc5247187e81391) by [@wschurman](https://github.com/wschurman))

#### iOS specific

- Fix TextInput vertical alignment issue when using lineHeight prop on iOS (Paper - old arch) ([35a1648d0c](https://github.com/facebook/react-native/commit/35a1648d0c93ef2db1de6b8dbe7fc1d997c24039) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Announce checkbox and radio button roles on VoiceOver ([12f4a19306](https://github.com/facebook/react-native/commit/12f4a19306b9d4f77c1b5493159de99f897b1862) by [@carmenvkrol](https://github.com/carmenvkrol))
- Localize Voiceover strings in Paper ([0e99b19257](https://github.com/facebook/react-native/commit/0e99b192577d1ac5c73fdc55902fea1d79d247b7) by [@NickGerleman](https://github.com/NickGerleman))
- Re-enable direct debugging with JSC on iOS 16.4+ ([5cf8f43ab1](https://github.com/facebook/react-native/commit/5cf8f43ab182781ea82e88077df425c3efbfc21f) by [@Saadnajmi](https://github.com/Saadnajmi))
- Fixed window.requestIdleCallback not firing on iOS ([72abed2c96](https://github.com/facebook/react-native/commit/72abed2c96d65769567e2b7e492764c1a58e6e81) by [@matt-oakes](https://github.com/matt-oakes))
- Adapt iOS16+ dictation judge condition ([e8b4bb0684](https://github.com/facebook/react-native/commit/e8b4bb0684eed2acdb4648205893ee372f7ac1c7) by [@hellohublot](https://github.com/hellohublot))
- Dimensions could be reported incorrectly when resizing iPad or macOS apps ([61861d21ff](https://github.com/facebook/react-native/commit/61861d21ff71a9451019e0f98e0c0414cf12c153) by [@jpdriver](https://github.com/jpdriver))
- Include `accessibilityValue` prop values in `accessibilityValue` ([0c25f19d39](https://github.com/facebook/react-native/commit/0c25f19d3944e866fcbb6a09da6a55878f739742) by [@carmenvkrol](https://github.com/carmenvkrol))
- Don't send the `RCTUserInterfaceStyleDidChangeNotification` when the app is in the background. ([6118aff69d](https://github.com/facebook/react-native/commit/6118aff69d69dce557b1c9d217c538f5670afed1) by [@alanjhughes](https://github.com/alanjhughes))
- Rotation transforms are no longer clipped when zIndex is applied ([850349b1d2](https://github.com/facebook/react-native/commit/850349b1d274f0cc2595eee2f6bb361a958bb2e2) by [@javache](https://github.com/javache))
- Fix the default trait collection to always return the value of the window ([94fea182d6](https://github.com/facebook/react-native/commit/94fea182d6cf19e96a8a87760017bd69ad0a9e0c) by [@alanjhughes](https://github.com/alanjhughes))
- Fix Alert userInterfaceStyle having no effect ([0e150d071e](https://github.com/facebook/react-native/commit/0e150d071e66368e134566697f0f9d99c64d35c4) by [@zhongwuzw](https://github.com/zhongwuzw))
- Properly escape URLs ([5e983d51d8](https://github.com/facebook/react-native/commit/5e983d51d8bc2abded5659a77808542c6dc1377a) by [@cipolleschi](https://github.com/cipolleschi))
- Handle double `#` and partially escaped urls ([2b4e1f5ece](https://github.com/facebook/react-native/commit/2b4e1f5ece7d160935b19d4862af8706a44cee59) by [@cipolleschi](https://github.com/cipolleschi))
- RNTester's PROJECT_ROOT points to `packages/rn-tester` ([cd30bc3888](https://github.com/facebook/react-native/commit/cd30bc3888bac500e9ecc7e9be051d0bc3659c2f) by [@dmytrorykun](https://github.com/dmytrorykun))
- Fix inverted `contentOffset` in scroll events in RTL ([4f8a8ce316](https://github.com/facebook/react-native/commit/4f8a8ce316494db99b19f6c8db6b0c1e7b6500d9) by [@NickGerleman](https://github.com/NickGerleman))
- Fix bad comparison in RCTScrollViewComponentView RTL ([65b7680720](https://github.com/facebook/react-native/commit/65b7680720435c0d864df9c121c151b60bee08ad) by [@NickGerleman](https://github.com/NickGerleman))
- Use `addEntriesFromDictionary` properly in RCTBaseTextInputView. ([e6dd22c628](https://github.com/facebook/react-native/commit/e6dd22c628c3bf1b16bb319694a0dddcedb0dd7a) by [@cipolleschi](https://github.com/cipolleschi))
- Change the top of perf monitor component. ([5ba8de05b5](https://github.com/facebook/react-native/commit/5ba8de05b5e6c170b84b44979e7bbc576442eafb) by [@zerosrat](https://github.com/zerosrat))
- Only modify EXCLUDED_ARCHS when needed for Hermes ([ee1cd13db6](https://github.com/facebook/react-native/commit/ee1cd13db6ba7d0eae315c296bac5ba2a58cdde3) by [@jpdriver](https://github.com/jpdriver))
- Fix `use_react_native` to support custom react native absolute paths ([835f62c189](https://github.com/facebook/react-native/commit/835f62c189a76cf05a444f35d0215f51e1e155d8) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- UIApplicationDidReceiveMemoryWarningNotification has not been obeyed on iOS since RN 0.69 ([8f072b438a](https://github.com/facebook/react-native/commit/8f072b438a81293da026f0284dac8ddc7be35382) by [@liamjones](https://github.com/liamjones))
- Debug builds from cli disable idle to stop application going into background ([41d5f4bce2](https://github.com/facebook/react-native/commit/41d5f4bce2850d3a81c0c02961c0768026dd353e) by [@blakef](https://github.com/blakef))
- Fix RCTImageBlurUtils.m Greyscale Crash ([d6c4f2786c](https://github.com/facebook/react-native/commit/d6c4f2786c1dd8285dbabb7fe872a7d1bddcbe14) by [@OskarEichler](https://github.com/OskarEichler))
- Logbox footer buttons respect safe area ([6d6b1fdc75](https://github.com/facebook/react-native/commit/6d6b1fdc75d870fa73abc6ee9bf0099f3f15e658) by [@philipheinser](https://github.com/philipheinser))
- Add support for Components with custom names in the interop layer. ([daedbe6e3e](https://github.com/facebook/react-native/commit/daedbe6e3e4cb4b5fde533bf8205edd89a18c480) by [@cipolleschi](https://github.com/cipolleschi))
- FP Tolerance in iOS Paper SafeAreaView debouncing ([c9c5651108](https://github.com/facebook/react-native/commit/c9c56511087d6e33bd4d2e86cbc1a76fc99ec8df) by [@NickGerleman](https://github.com/NickGerleman))
- RNTester-ios / RCTAppDelegate > correctly check for USE_HERMES Flag ([e364553492](https://github.com/facebook/react-native/commit/e3645534920e509f1344e6f83916fcd61723403b) by [@christophpurrer](https://github.com/christophpurrer))
- Exclude JSI headers when using hermes-engine prebuilt. ([5029cef0a9](https://github.com/facebook/react-native/commit/5029cef0a99469e37bc2f4d72ca2e1f3d6791511) by [@dmytrorykun](https://github.com/dmytrorykun))
- Purge children from view registry on `RCTUIManager` invalidation. ([bc63e44b23](https://github.com/facebook/react-native/commit/bc63e44b23baddf579d8e42b70af0473314f8e48) by [@kkafar](https://github.com/kkafar))
- Fix React-ImageManager dependencies ([830c2e7c57](https://github.com/facebook/react-native/commit/830c2e7c571650f49b645e7f9f9445a021e8a0a2) by [@cipolleschi](https://github.com/cipolleschi))

## v0.72.8

### Fixed

- Fix `build_codegen!` not finding `@react-native/codegen` in pnpm setups ([e70166a3a8](https://github.com/facebook/react-native/commit/e70166a3a8b9ddf1a7e322db602c548aaa60102d) by [@tido64](https://github.com/tido64))
- Correctly declare runtime dependencies ([df2bbba50b](https://github.com/facebook/react-native/commit/df2bbba50bf1484edf88079b965b8841fc7849a8) by [@tido64](https://github.com/tido64))
- Prevent LogBox from crashing on very long messages ([c3c6cf4](https://github.com/facebook/react-native/commit/c3c6cf4646999e9bf971d2c0e63c41e550069f25) by [@motiz88](https://github.com/motiz88))

## v0.72.7

### Changed

- Bump CLI to v11.3.10 ([e844a62ce9](https://github.com/facebook/react-native/commit/e844a62ce9e6ae70bbeba895dcf902287570f462) by [@szymonrybczak](https://github.com/szymonrybczak))

### Deprecated

- Bump deprecated-react-native-prop-types to ^4.2.3 ([e031c05cdc](https://github.com/facebook/react-native/commit/e031c05cdc5650f17231caf7f60820e1df744788) by [@huntie](https://github.com/huntie))

### Fixed

- Show correct stack frame on unhandled promise rejections on development mode.
 ([18c9797ecc](https://github.com/facebook/react-native/commit/18c9797ecc8dab220ec68aae011ddb73db17a99d) by [@fortmarek](https://github.com/fortmarek))

#### Android specific

- Fix android crash when apply PlatformColor to borders ([265af222aa](https://github.com/facebook/react-native/commit/265af222aa8acb3b514e22a7db191d66755f553b) by [@axinvd](https://github.com/axinvd))
- Fix broken Loading/Refreshing indicator on Android ([5dedf277cb](https://github.com/facebook/react-native/commit/5dedf277cb903528659f0d8a71412274d9d32a65) by [@cortinico](https://github.com/cortinico))

## v0.72.6

### Fixed

- Fix a potential bug in `EventEmitter` when used with certain Babel configurations that incorrectly polyfill the spread operator for iterables ([9b3bd63723](https://github.com/facebook/react-native/commit/9b3bd637231e5e9e7d8b729c71842f3b7a2da373) by [@yungsters](https://github.com/yungsters))

#### iOS specific

- Set the max version of Active support to 7.0.8 ([785f91b67a](https://github.com/facebook/react-native/commit/785f91b67a5d97e4e54d341279c878483a3d9a11) by [@cipolleschi](https://github.com/cipolleschi))

## v0.72.5

### Changed
- Bump CLI to 11.3.7 ([6f02d55deb](https://github.com/facebook/react-native/commit/6f02d55debe818dcb1db753f2ca4cc0b804d0df5) by [@huntie](https://github.com/huntie))
- Bump @react-native/codegen to 0.72.7 ([4da991407d](https://github.com/facebook/react-native/commit/4da991407da2791f22ded368ad04457b03be5ee3) by [@Titozzz](https://github.com/Titozzz))

### Fixed
#### Android specific

- Fix building Android on Windows. ([054ab62be0](https://github.com/facebook/react-native/commit/054ab62be0db5d14f02f5aeb4c696f037ea68794) by [@alespergl](https://github.com/alespergl))
- A bug fix for Android builds with new arch on Windows host. ([a323249e0a](https://github.com/facebook/react-native/commit/a323249e0a0f9c2fb75ee05d7da62a34f3c56be0) by [@birdofpreyru](https://github.com/birdofpreyru))
- Fix null crash when using maintainVisibleContentPosition on Android ([1a1a79871b](https://github.com/facebook/react-native/commit/1a1a79871b2d040764537433b431bc3b416904e3) by [@janicduplessis](https://github.com/janicduplessis))

#### iOS specific

- XCode 15 fixes ([21763e85e3](https://github.com/facebook/react-native/commit/21763e85e39e17a19a1cf7a9026ef74517464749), [0dbd621c59](https://github.com/facebook/react-native/commit/0dbd621c598e3ba7a203ec41bb70ce395ad1d62c) & [8a5b2d6735](https://github.com/facebook/react-native/commit/8a5b2d673502037731ee6bc40fc64cdd22139011))
- Fix timer background state when App is launched from background ([a4ea737ae1](https://github.com/facebook/react-native/commit/a4ea737ae1773e7fd49969ae20b962bdd7481b37) by [@zhongwuzw](https://github.com/zhongwuzw))
- Guard `JSGlobalContextSetInspectable` behind a compile time check for Xcode 14.3+ ([3eeee11d7a](https://github.com/facebook/react-native/commit/3eeee11d7ac4075d0917233d3be4a9469f802d35) by [@Saadnajmi](https://github.com/Saadnajmi))
- Re-enable direct debugging with JSC on iOS 16.4+ ([8b1bf058c4](https://github.com/facebook/react-native/commit/8b1bf058c4bcbf4e5ca45b0056217266a1ed870c) by [@huntie](https://github.com/huntie))

## v0.72.4

### Added

#### Android specific

- Native part of fixing ANR when having an inverted FlatList on android API 33+ ([6d206a3f54](https://github.com/facebook/react-native/commit/6d206a3f54725f7f53692222293a9d1e58b11ca4) by [@hannojg](https://github.com/hannojg))
- For targeting SDK 34 - Added RECEIVER_EXPORTED/RECEIVER_NOT_EXPORTED flag support in DevSupportManagerBase ([177d97d8ea](https://github.com/facebook/react-native/commit/177d97d8ea962bdd4dad8fcf0efb04a307f25000) by [@apuruni](https://github.com/apuruni))

### Changed

- Bump cli and metro ([40ea8ffcc7](https://github.com/facebook/react-native/commit/40ea8ffcc7ba3ed0969405e9a48b75d188487d92) by [@lunaleaps](https://github.com/lunaleaps))
- Hermes bump for hermes-2023-08-07-RNv0.72.4-813b2def12bc9df026 ([e9ea926ba3](https://github.com/facebook/react-native/commit/e9ea926ba3462a8d771cfcc5663c0d6fb50e2172) by Luna Wei)
- Bump CLI to 11.3.6 ([a3cfdf0a08](https://github.com/facebook/react-native/commit/a3cfdf0a08237a63736b9d576641a4ab3cf720ba) by [@szymonrybczak](https://github.com/szymonrybczak))

### Fixed

- Allow string `transform` style in TypeScript ([2558c3d4f5](https://github.com/facebook/react-native/commit/2558c3d4f56776699602b116aff8c22b8bfa176a) by [@NickGerleman](https://github.com/NickGerleman))
- Fix missing Platform in VirtualizedList ([7aa8cd55be](https://github.com/facebook/react-native/commit/7aa8cd55be97a0f26fe01aa9f50d774ac52114aa) by Luna Wei)
- Mount react devtools overlay only when devtools are attached ([03187b68e5](https://github.com/facebook/react-native/commit/03187b68e589c94dc10ed4f763b54923b7487f23) by [@hoxyq](https://github.com/hoxyq))

#### Android specific

- Remove option to paste rich text from Android EditText context menu ([b1ceea456d](https://github.com/facebook/react-native/commit/b1ceea456d1cdc00c723582d00e5ae585f066b55) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fixed ScrollView not responding to Keyboard events when nested inside a KeyboardAvoidingView ([c616148a05](https://github.com/facebook/react-native/commit/c616148a05c00728b80d2fd9dcbd6f15d08a2dfa) by [@andreacassani](https://github.com/andreacassani))
- ANR when having an inverted FlatList on android API 33+ ([3dd816c6b7](https://github.com/facebook/react-native/commit/3dd816c6b7bcd9cc4c21199f0b645755fb97f50f) by [@hannojg](https://github.com/hannojg))

## v0.72.3

### Fixed

#### iOS specific

- Revert "Fix pod install for swift libs using new arch (#38121)" to fix [build error with Xcode lower than Xcode 14.3](https://github.com/facebook/react-native/issues/38294) ([8f41f25](https://github.com/facebook/react-native/commit/8f41f25c214f995073e90b786c805eb45ff7dee5) by [@kelset](https://github.com/kelset))

## v0.72.2

### Changed

- Remove deprecated stub types `@types/metro-config` from template ([63f78ea8de](https://github.com/facebook/react-native/commit/63f78ea8de68688005e7f48c6849bdf9f95e26ff) by [@kelset](https://github.com/kelset))
- Bump CLI to 11.3.5 and Metro do 0.76.7 ([ba5fa9c394](https://github.com/facebook/react-native/commit/ba5fa9c394e7cd127e3ee543e0716c37912b0b40) by [@kelset](https://github.com/kelset))
- Bump `@react-native/metro-config` to `0.72.9` ([21daa6e790](https://github.com/facebook/react-native/commit/21daa6e79030574ce41665ea13c39316eac8c305), [f37386176](https://github.com/facebook/react-native/commit/f37386176cb081e7b38fad8b5442099598bf1968)  by [@kelset](https://github.com/kelset))

#### Android specific

- Remove okhttp3 internal util usage ([3e3032636d](https://github.com/facebook/react-native/commit/3e3032636dc90a21a499492dcb88f819bcf4f003) by [@adrianha](https://github.com/adrianha))

#### iOS specific

- Update logic to add and remove views in the view registry for the interop layer. ([8d2eec367d](https://github.com/facebook/react-native/commit/8d2eec367dd6fbd60792ca1bde12b875a8261fa6) by [@cipolleschi](https://github.com/cipolleschi))
- Disable NSTextStorage caching in OSS ([5bda54c1f1](https://github.com/facebook/react-native/commit/5bda54c1f183fbc51dc7264b0ab94d5bbcc3f172) by [@sammy-SC](https://github.com/sammy-SC))

### Fixed

- `global.performance` in undefined when starting metro from Expo CLI ([0ccbd65581](https://github.com/facebook/react-native/commit/0ccbd65581304faa286b452f75058b6292a6240f) by [@Kudo](https://github.com/Kudo))
- Re-enabled debugging for debug builds ([41477c898c](https://github.com/facebook/react-native/commit/41477c898cf5726eae9edbb1596366a6eea2b01e) by Matt Blagden)
- Add global hook to assert that base Metro config is called ([29f2602ff9](https://github.com/facebook/react-native/commit/29f2602ff9c3c9a9999c54a6004c99d6fd15ebc3) by [@huntie](https://github.com/huntie))

#### Android specific

- Do not create RuntimeExecutor on non-JSI executors (#38125) ([d73b61c7c7](https://github.com/facebook/react-native/commit/d73b61c7c7dae23630b51b00048eafe5fcb47bd3) by [@lunaleaps](https://github.com/lunaleaps))
- Prevent crash on OnePlus/Oppo devices in runAnimationStep ([a46a7cd1](https://github.com/facebook/react-native/commit/a46a7cd1f613d6eaea1d1cd07751f17cdc07c21b) by [@hsource](https://github.com/hsource))

#### iOS specific

- Fix build error when there are multiple EXTRA_COMPILER_ARGS ([28f4ebab8a](https://github.com/facebook/react-native/commit/28f4ebab8ab4b0f337699e6a135e2aa983866f42) by [@fergusean](https://github.com/fergusean))
- Build failure with pnpm and use_frameworks! due to incorrect header paths ([58adc5e4b9](https://github.com/facebook/react-native/commit/58adc5e4b9ab74b67b4af04d1e72c387af848ea7) by evelant)
- Fix onChangeText not firing when clearing the value of TextInput with multiline=true on iOS ([0c9c57a9f7](https://github.com/facebook/react-native/commit/0c9c57a9f73294414d92428c5d2472dc1e1e5e96) by [@kkoudev](https://github.com/kkoudev))
- Fix pod install for libraries using Swift code when the new architecture is enabled ([a4a0655496](https://github.com/facebook/react-native/commit/a4a065549677c61eb91bf587032976ed48c75821) by [@louiszawadzki](https://github.com/louiszawadzki))

## v0.72.1

### Added

#### iOS specific

- Add warning to help users migrate away from the interop layer. ([a702d0515f](https://github.com/facebook/react-native/commit/a702d0515f9005714da52cda7f6851e06b4103da) by [@cipolleschi](https://github.com/cipolleschi))
- Allow to lookup for ViewManager without the RCT prefix in the Interop Layer ([a28881a3d7](https://github.com/facebook/react-native/commit/a28881a3d79e732670157638aa5207c88c79718c) by [@cipolleschi](https://github.com/cipolleschi))

### Changed

- `react-native/metro-config` now includes all base config values from `metro-config` ([bbcedd385b](https://github.com/facebook/react-native/commit/bbcedd385bf7fe374955378d2c2a065318f740cb) by [@huntie](https://github.com/huntie))
- Bump CLI to 11.3.3 ([da84901f78](https://github.com/facebook/react-native/commit/da84901f78bdfc8c84ed71996c01f585d8b96367) by [@kelset](https://github.com/kelset))
- Bumped `@react-native/metro-config` to `0.72.7`, `@react-native/gradle-plugin` to `0.72.11`, `@react-native/virtualized-lists` to `0.72.6` ([95db9f98f2](https://github.com/facebook/react-native/commit/95db9f98f2673d9015f6786db2df4e5f16dc74fc) by [@kelset](https://github.com/kelset))

### Fixed

- `react-native/virtualized-lists` does not need `react-test-renderer` at runtime ([7a2a3278d0](https://github.com/facebook/react-native/commit/7a2a3278d08b13dbde7a6e967474c20d6a5c76a5) by [@tido64](https://github.com/tido64))

#### Android specific

- Exclude trailing whitespace from newline character on measuring text line width ([83d7a48a46](https://github.com/facebook/react-native/commit/83d7a48a46c00b99c52a8ac5897c013924e10152) by [@bernhardoj](https://github.com/bernhardoj))
- Set kotlin.jvm.target.validation.mode=warning on user projects ([10beefbbfa](https://github.com/facebook/react-native/commit/10beefbbfadcbe6e40314564e409bf592a16e571) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Bump SocketRocket to 6.1.0 ([8ce471e2fa](https://github.com/facebook/react-native/commit/8ce471e2fa802cc50ff2d6ab346627cb5f6d79b4) by [@cipolleschi](https://github.com/cipolleschi))
- fix `pod install --project-directory=ios` failing ([0b96bdcf32](https://github.com/facebook/react-native/commit/0b96bdcf326944b13e447f71739dee3c25c7b59a) by [@tido64](https://github.com/tido64))

## v0.72.0

### Breaking

- Bump version of Node used to 18 ([f75b92a](https://github.com/facebook/react-native/commit/f75b92a12b829d74f202aded7d4c8f4e1d23e402) by [@leotm](https://github.com/leotm)), and minimum Node JS version to 16 ([afc91de79a](https://github.com/facebook/react-native/commit/afc91de79a8804696f05219214e0e67235d34d77) by [@robhogan](https://github.com/robhogan))
- Constrain data type in `getItemLayout` callback ([febf6b7f33](https://github.com/facebook/react-native/commit/febf6b7f33fdb4904669f99d795eba4c0f95d7bf) by [@NickGerleman](https://github.com/NickGerleman))
- Fix react-native/eslint-config linting of jsx files ([59ee573527](https://github.com/facebook/react-native/commit/59ee57352738f030b41589a450209e51e44bbb06) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- Generates RNCore components inside the ReactCommon folder and create a new pod for platform-specific ImageManager classes ([5d175c6775](https://github.com/facebook/react-native/commit/5d175c6775d0c630fb53b41df4e2a08f15bd94a4) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the RCTAppSetupUtils to the AppDelegate library to break a dependency cycle ([36a64dc2bd](https://github.com/facebook/react-native/commit/36a64dc2bd9de52841a52c549f35b944020bdb53) by [@cipolleschi](https://github.com/cipolleschi))
- Split the `ReactCommon/react/nativemodule/core/platform/ios` and `ReactCommon/react/nativemodule/samples` in two separate pods to break circular dependencies. ([21d530208f](https://github.com/facebook/react-native/commit/21d530208f57feda87dce9f93f471bbf57635477) by [@cipolleschi](https://github.com/cipolleschi))

### Added

- Improve handling of invalid DimensionValue usage ([02e29abead](https://github.com/facebook/react-native/commit/02e29abeada3d78dd7d90d1d89049cd1517afb55) by [@NickGerleman](https://github.com/NickGerleman))
- Add new JS performance API to support getting RN app startup timings ([c1023c73b0](https://github.com/facebook/react-native/commit/c1023c73b010245f2e8182b75cc3bccd112d5e2e))
- Add performance memory API with native memory Info ([70fb2dce45](https://github.com/facebook/react-native/commit/70fb2dce4557da1195289a24638b1e4d2c2edbf7))
- Added Web-compatible `DOMRect` and `DOMRectReadOnly` classes to the global scope. ([673c7617bc](https://github.com/facebook/react-native/commit/673c7617bcf90a892a0afc2c0d9cf9c0493fdf27) by [@rubennorte](https://github.com/rubennorte))
- Add onStartReached and onStartReachedThreshold to VirtualizedList ([7683713264](https://github.com/facebook/react-native/commit/76837132649d740e1ec2c3c78f0085b444a4367c) by [@janicduplessis](https://github.com/janicduplessis))
- Added `setColorScheme` to `Appearance` module ([c18566ffdb](https://github.com/facebook/react-native/commit/c18566ffdb44103a3e24cd8017d0ae6a69c68e40), ([0a4dcb0309](https://github.com/facebook/react-native/commit/0a4dcb0309fdc8f4529ed7599c4170341b42c9b1) by [@birkir](https://github.com/birkir))
- Add logical border block color properties ([597a1ff60b](https://github.com/facebook/react-native/commit/597a1ff60b3e1844b4794fb4acd40fa073f2e93b) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add logical border-radius implementation ([4ae4984094](https://github.com/facebook/react-native/commit/4ae4984094e4846bc2bc0e3374ab5d934ee6bc5f) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added CSS logical properties. ([3681df2878](https://github.com/facebook/react-native/commit/3681df287835f5467a2ad5afe950eae16b95fd8b) by [@necolas](https://github.com/necolas))
- Concurrent rendering safe implementation of Animated ([5cdf3cf726](https://github.com/facebook/react-native/commit/5cdf3cf72613a2068884151efb08fd4c17fec5fd), ([5e863fc42c](https://github.com/facebook/react-native/commit/5e863fc42c8a2b27f4a785766eb643de9a243b2d) by [@sammy-SC](https://github.com/sammy-SC))
- Create explicit error message for TypeScript functions used as props in Codegen components, redirecting devs to the supported function types `BubblingEventHandler` and `DirectEventHandler`. ([dc2cbed07c](https://github.com/facebook/react-native/commit/dc2cbed07c82b5b80e66f5c6a1bd6244f4972ede) by [@gtomitsuka](https://github.com/gtomitsuka))
- Generate enum types that would be allowed to be used as well as string/number in c++ turbo modules generators ([ceb1d0dea6](https://github.com/facebook/react-native/commit/ceb1d0dea694739f357d86296b94f5834e5ee7f7) by [@vzaidman](https://github.com/vzaidman))
- Add enum example to Android/iOS rn-tester TurboModule ([7c82a3fa11](https://github.com/facebook/react-native/commit/7c82a3fa110a618c7bd59555a3ae94304ab25b1f) by [@christophpurrer](https://github.com/christophpurrer))
- Allow the use of "Partial<T>" in Turbo Module specs. ([97e707d897](https://github.com/facebook/react-native/commit/97e707d897e63715023dc68bb059f4aa5332fc78) by [@vzaidman](https://github.com/vzaidman))
- Added newline to UTFSequence ([9cf35bfcc4](https://github.com/facebook/react-native/commit/9cf35bfcc47c928392ac524cd9e3fd30a1130fbb))
- Added "coverage" folder generated from `jest --coverage` to .gitignore ([7324c22ff9](https://github.com/facebook/react-native/commit/7324c22ff91c572b4022a1d22c6c7751a73ad76a) by [@Adnan-Bacic](https://github.com/Adnan-Bacic))
- Add support for getting/setting reload-and-profile-related settings in iOS + Android ([96d6680e00](https://github.com/facebook/react-native/commit/96d6680e00c28575d6ebf95d5f55487d69fda51f))
- For supporting Dev Loading View across platforms, adding the DevLoadingViewController without an activity/context. ([662b51fad2](https://github.com/facebook/react-native/commit/662b51fad2fb4c267da519c9122ab4d12dcfdaae))
- Pass DevTools Settings Manager to connectToDevTools ([a9bed8e75d](https://github.com/facebook/react-native/commit/a9bed8e75d9b9613c5fcb69436a2d3af763f456d))
- React-native-code-gen Add Union Type support for Java/ObjC TurboModules ([2eccd59d7c](https://github.com/facebook/react-native/commit/2eccd59d7c735df3c29fc7ca342555890eb7055b) by [@christophpurrer](https://github.com/christophpurrer))
- Making Dev Loading View cross platform by abstracting out the activity/context logic from the controller in a polymorph class. ([1a4fa92b25](https://github.com/facebook/react-native/commit/1a4fa92b253aeb70162322e9d4135fb34901dcf1))
- Added CSS logical properties by mapping layout props. ([cf3747957a](https://github.com/facebook/react-native/commit/cf3747957ab210e31504109bb6b3e34e773a5b9a) by [@mayank-96](https://github.com/mayank-96))
- Add, but don't use, DevTools Settings Manager. ([6152763398](https://github.com/facebook/react-native/commit/6152763398efe60521fc86fcf992b6a84361df12))

#### Android specific

- Adding pager, scrollview, viewgroup, webview, drawer accessibility roles ([55c0df43b9](https://github.com/facebook/react-native/commit/55c0df43b9859853e41b6e2ef271b78b783538f0) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Add TYPE_VIEW_HOVER_ENTER to AccessibilityNodeInfo sendAccessibilityEvent ([a0adf57e50](https://github.com/facebook/react-native/commit/a0adf57e509dbb9074b2fa14339c5add140f5332) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Add maintainVisibleContentPosition support on Android ([c19548728c](https://github.com/facebook/react-native/commit/c19548728c9be3ecc91e6fefb35bc14929109d60) by [@janicduplessis](https://github.com/janicduplessis))
- For supporting Dev Loading View across multiple platforms, changing the Loading View of Android to rely on the native implementation instead of Toast while keeping backwards comptability. ([9f6b532bdb](https://github.com/facebook/react-native/commit/9f6b532bdb7e60eddec62b7a0b89141e4c8df127))
- For supporting Dev Loading View across multiple platforms, adding native implementation for showMessage() & hide() of Dev Loading Module ([4923a0997b](https://github.com/facebook/react-native/commit/4923a0997b1a8c827b11ec15e45e6ce00f398d99))
- For supporting Dev Loading View across multiple platforms, altering the javascript implementation of Loading view of android to also rely on native implementation as iOS instead of Toast, thereby unifying both platforms ([068a20842d](https://github.com/facebook/react-native/commit/068a20842d349318db2236676415e96be2a663f9))
- Added possibility to mark Fresco image pipeline as already initialized ([605a52fe3e](https://github.com/facebook/react-native/commit/605a52fe3ec099b652fc222947d1ddffa41cfd7f) by [@oprisnik](https://github.com/oprisnik))
- Support generating `getName` in react-native-codegen for Java TurboModules ([90538909f9](https://github.com/facebook/react-native/commit/90538909f988a8be9475cf12471269b70dbc179e) by [@javache](https://github.com/javache))
- Override default Talkback automatic content grouping and generate a custom contentDescription ([759056b499](https://github.com/facebook/react-native/commit/759056b49975c30cd561826e1499ebdf7aa8674d) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Enable AnimatedInterpolation to interpolate arbitrary color types. ([e7dbfb2dbd](https://github.com/facebook/react-native/commit/e7dbfb2dbd98059ddd6e982e2e43c1e7df91a4cc) by [@javache](https://github.com/javache))
- Added getter for line height in CustomLineHeightSpan ([2d2f9da80b](https://github.com/facebook/react-native/commit/2d2f9da80b86505dace0ee8ffbadde151067cb8f))
- Add POST_NOTIFICATIONS permission to AndroidManifest of RNTester ([c84cc4b46c](https://github.com/facebook/react-native/commit/c84cc4b46c8dfbb62c3b95fc26aa59f0105f0438) by [@makovkastar](https://github.com/makovkastar))

#### iOS specific

- Added examples of direct manipulation ([a44d8a0f8a](https://github.com/facebook/react-native/commit/a44d8a0f8a9b6533b50ac6318fa5993bd41d444b) by [@cipolleschi](https://github.com/cipolleschi))
- Support workspace and isolated setups with `pod install` ([0eff8d66c9](https://github.com/facebook/react-native/commit/0eff8d66c9acfad91c9e6a37b321034358ee4719) by [@robhogan](https://github.com/robhogan))
- Add example in the Interop Layer to use constants ([a5866ca3aa](https://github.com/facebook/react-native/commit/a5866ca3aad53802e8010295a205e956e8e26120) by [@cipolleschi](https://github.com/cipolleschi))
- Add example in the Interop Layer to use events ([c005830958](https://github.com/facebook/react-native/commit/c005830958921a030fd46b6968b778509d3bcb45) by [@cipolleschi](https://github.com/cipolleschi))
- Add invoking dev menu on iOS by pressing `d` in terminal. ([f72f8daeaf](https://github.com/facebook/react-native/commit/f72f8daeaf20ae53e778143aecbb96303852aeb0) by [@szymonrybczak](https://github.com/szymonrybczak))
- Add comments for specifying the path to React Native ([3876368f0c](https://github.com/facebook/react-native/commit/3876368f0c5e5dcbafee9a71da80a4a7226096a0) by [@sottar](https://github.com/sottar))
- Add explicit support for M2 iPad Apple Pencil hovering in the Pointer Events implementation ([0c150b2289](https://github.com/facebook/react-native/commit/0c150b2289818267c940b6e726ec2f7725659817) by [@vincentriemer](https://github.com/vincentriemer))
- Add message with instructions about what to do if the cleanup of the build folder fails. ([1b7127bb05](https://github.com/facebook/react-native/commit/1b7127bb052096509de60ee5eb098d669c616f32))
- Enable AnimatedInterpolation to interpolate arbitrary color types. ([56b10a8351](https://github.com/facebook/react-native/commit/56b10a83511ee509c36eb91f53da58d5eda643d5) by [@javache](https://github.com/javache))
- Allow for custom project dir in react-native-xcode script ([436da18fce](https://github.com/facebook/react-native/commit/436da18fce99af6361bae5719cfce0ed4539a3f7) by [@itxch](https://github.com/itxch))
- Enable AnimatedInterpolation to interpolate arbitrary color types. ([6003e70e84](https://github.com/facebook/react-native/commit/6003e70e84c369d7dc2c6bea50ea41f0bac79595) by [@javache](https://github.com/javache))

### Changed

- Default condition set for experimental Package Exports is now `['require', 'react-native']` ([308838c0ff](https://github.com/facebook/react-native/commit/308838c0ff3cdc4c7817afe349eddfab80c0c76c) by [@huntie](https://github.com/huntie))
- Run commit hooks before layout calculation ([8d0b5af1fc](https://github.com/facebook/react-native/commit/8d0b5af1fc13928c024663f10b0257e816bd6696) by [@tomekzaw](https://github.com/tomekzaw))
- Support mixed props for components in codegen ([0ae5e50e37](https://github.com/facebook/react-native/commit/0ae5e50e3753f03712e796dc28a36083bde87dc1) by [@genkikondo](https://github.com/genkikondo))
- Switch from `types/jest` to `jest/globals` for new react-native projects ([9af3c9654a](https://github.com/facebook/react-native/commit/9af3c9654ae8e2cb10d49770dd3438aec038fcef) by [@UNIDY2002](https://github.com/UNIDY2002))
- Move virtualized lists to react-native/virtualized-lists package ([2e3dbe9c2f](https://github.com/facebook/react-native/commit/2e3dbe9c2fbff52448e2d5a7c1e4c96b1016cf25) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add minimum necessary .d.ts files to react-native-codegen ([ac5aec3f5c](https://github.com/facebook/react-native/commit/ac5aec3f5caa732f4565328447ffa9da7ede8dec), ([be3845adec](https://github.com/facebook/react-native/commit/be3845adec324e4b3ae6efd8f85d3569f1cb60b8) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Change PerformanceApiExample to use ModulePathing ([6a395cb2d7](https://github.com/facebook/react-native/commit/6a395cb2d722761825c9f24468b6d036e3e0f52c) by [@TatianaKapos](https://github.com/TatianaKapos))
- Re-organize the parameters of TurboModuleBinding::install() ([cbdbb47467](https://github.com/facebook/react-native/commit/cbdbb474675bb6fbd5857873234d825c52ca16b3))
- `EventEmitter#addListener` now throws if the 2nd argument is not a function. ([2780ba38ff](https://github.com/facebook/react-native/commit/2780ba38ff23f4c5e717b8fd8a733b649701f00c) by [@yungsters](https://github.com/yungsters))
- When a ScrollView's `ref` or `innnerViewRef` changes, the old ref will now be invoked with `null` and the new ref with the active instance. (Previously, changing `ref` or `innerViewRef` on a `ScrollView` would be treated as though the ref had not changed at all.) ([7cf4cf3afb](https://github.com/facebook/react-native/commit/7cf4cf3afbea4463427944fbed30768a796db724) by [@yungsters](https://github.com/yungsters))
- Turbo Module supports intersection type for TypeScript ([bbed15d4ae](https://github.com/facebook/react-native/commit/bbed15d4ae6df23bab2f0730562396ef61f0bc59) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Find node binary when using asdf as the node version manager with custom `$ASDF_DIR` ([f6a4e4f20f](https://github.com/facebook/react-native/commit/f6a4e4f20f0d3b5fe2aad171cded9aba06d3c8f8) by [@MuhmdRaouf](https://github.com/MuhmdRaouf))
- Turbo module codegen support interface with inheritance in module ([bf34810c5c](https://github.com/facebook/react-native/commit/bf34810c5c188cd1c42e2ac0c52d08790209bc1e) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Use number literals in TypeScript types for `FileReader` and `XMLHttpRequest` states ([8568b93733](https://github.com/facebook/react-native/commit/8568b937335b152c2836e7790c1db75e93365787) by [@eps1lon](https://github.com/eps1lon))
- Moved jest config from package.json to dedicated jest.config.js file ([473eb1dd87](https://github.com/facebook/react-native/commit/473eb1dd870a4f62c4ebcba27e12bde1e99e3d07) by [@Adnan-Bacic](https://github.com/Adnan-Bacic))
- Removed iOS flag from `scrollEventThrottle` docs ([8ea1cba06a](https://github.com/facebook/react-native/commit/8ea1cba06a78fba023e5a441ad5c4755d0d504ac) by [@robwalkerco](https://github.com/robwalkerco))
- Renamed App-test.tsx to App.test.tsx to unify naming convention with create-react-app ([3c03aef151](https://github.com/facebook/react-native/commit/3c03aef1511844262f38149ad261e26703f55ead) by [@Adnan-Bacic](https://github.com/Adnan-Bacic))
- Turbo module codegen support interface like alias in module ([8befb740d6](https://github.com/facebook/react-native/commit/8befb740d6cd3de6ead067ac01b70c37d4b5b1bc) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Append RCTRedBoxGetEnabled() in RCTExceptionsManager.mm ([2217ea4136](https://github.com/facebook/react-native/commit/2217ea4136e96185c46947b5afe0a24574b3f23a) by [@nxdm](https://github.com/nxdm))
- ActivityIndicator and remove .flow ([9c57a7f209](https://github.com/facebook/react-native/commit/9c57a7f20925765da69590256ca8755b71735cdb) by [@lunaleaps](https://github.com/lunaleaps))
- Mark methods on JSI references as const. ([03b17d9af7](https://github.com/facebook/react-native/commit/03b17d9af7e4e3ad3f9ec078b76d0ffa33a3290e) by [@neildhar](https://github.com/neildhar))
- Fix codegen output for object with indexer ([f07490b1f1](https://github.com/facebook/react-native/commit/f07490b1f1b492b75cfa06df00f6e89b404a1ee8) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Fix codegen to add `T` of `Promise<T>` in CodegenSchema.js ([8a38e03e0f](https://github.com/facebook/react-native/commit/8a38e03e0f25528063d24a429c1d650363a0eee7) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Renamed react-native/polyfills -> react-native/js-polyfills and align with other packages versions (0.72.0) as a part of migration to monorepo ([71399d0891](https://github.com/facebook/react-native/commit/71399d089187c3e2e58b3cbf31977368d0f216fa) by [@hoxyq](https://github.com/hoxyq))
- Rename normalize-color to normalize-colors as part of https://github.com/react-native-community/discussions-and-proposals/pull/480 ([dc3355920d](https://github.com/facebook/react-native/commit/dc3355920d7f6f4ef887e0ff01153e23e660b5ea) by [@Titozzz](https://github.com/Titozzz))
- Renamed react-native-codegen package to react-native/codegen and updated references ([b7a85b59b5](https://github.com/facebook/react-native/commit/b7a85b59b5798add4e9dbfb5f5f2fc62756e30b5) by [@shivenmian](https://github.com/shivenmian))
- Rename assets to assets-registry ([3c5a8290ae](https://github.com/facebook/react-native/commit/3c5a8290ae1645672ee585feaf6ff38df1e30b34) by [@fortmarek](https://github.com/fortmarek))
- Rename polyfills to js-polyfills as part of https://github.com/react-native-community/discussions-and-proposals/pull/480 ([ca1ae5c44f](https://github.com/facebook/react-native/commit/ca1ae5c44ffa0b1a149e69e47b7f51cb6a914734) by [@Titozzz](https://github.com/Titozzz))
- Rename react-native-gradle-plugin to react-native/gradle-plugin ([6f11b10a88](https://github.com/facebook/react-native/commit/6f11b10a88235ad7de1a5777e5cdf7a582a231b7) by [@hoxyq](https://github.com/hoxyq))
- Renamed `react-native-community/eslint-plugin` to `react-native/eslint-plugin` v0.72.0 to align with other packages ([5aead70e80](https://github.com/facebook/react-native/commit/5aead70e8026e6567cb79e585ab2c6cf6e396892) by [@afoxman](https://github.com/afoxman))
- Untrack Test Reports generated by test libraries (reporters E.g. `jest-junit`) ([0ba1127c15](https://github.com/facebook/react-native/commit/0ba1127c15182564ac25b41b55433ed8f9512a9c) by [@Pranav-yadav](https://github.com/Pranav-yadav))
- Add `TSMethodSignature` to react-native-codegen ([ae1d54bc5a](https://github.com/facebook/react-native/commit/ae1d54bc5ac5ecdf5f7e17b709c53872c606277e) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Any `ref` set on `TextInput` will now be updated less frequently (when the underlying `ref` has not changed). ([666f56bff3](https://github.com/facebook/react-native/commit/666f56bff318549b62ae5f68f0a046ef8d81c545) by [@yungsters](https://github.com/yungsters))
- Add intersection types in react-native-codegen for TypeScript ([813fd04118](https://github.com/facebook/react-native/commit/813fd04118c30054cc7c30e231cd9d4002423d32) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Update TextInput inputMode to map "none" to showSoftInputOnFocus ([b6869be1ac](https://github.com/facebook/react-native/commit/b6869be1ac0bedcb846722160f29fb4591ae5013) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- LogBox now makes URL links tappable. ([d9ade19b71](https://github.com/facebook/react-native/commit/d9ade19b711fae03838581ff2564185d5b7a24cb) by [@sammy-SC](https://github.com/sammy-SC))
- Upgrade to deprecated-react-native-prop-types@4.1.0 ([f84256a924](https://github.com/facebook/react-native/commit/f84256a924ef8aee8ac5773dbf569ee627472101) by [@yungsters](https://github.com/yungsters))
- Flipper to 0.182.0 ([8fae37eaea](https://github.com/facebook/react-native/commit/8fae37eaeab0c75c0be2885ce9198131e4d74c92) by [@cortinico](https://github.com/cortinico))
- Bump metro to 0.76.5 and CLI to 11.3.1 ([7c5dc1d9bc](https://github.com/facebook/react-native/commit/7c5dc1d9bc57c9b07ecabaff53b5ed79c9dd586f))
- Bump tsconfig/react-native to 3.0.0 ([5c4649af27](https://github.com/facebook/react-native/commit/5c4649af279d40c83b181f2a35b7cf58a50eac2a) by [@NickGerleman](https://github.com/NickGerleman))
- Brew overwrites system Python 3. ([ed8a3e08e2](https://github.com/facebook/react-native/commit/ed8a3e08e2f227a37730b697b0e4e2c7d63e27ff) by [@blakef](https://github.com/blakef))
- Change the way types for New Architecture/experimental APIs are exposed. ([f9bf14d09d](https://github.com/facebook/react-native/commit/f9bf14d09d70fb89f7425c6c7f99aec96cbb2bf8) by [@lunaleaps](https://github.com/lunaleaps))
- Backporting babel bumps to 0.72 ([97986561f6](https://github.com/facebook/react-native/commit/97986561f60d7cf17eed3e264743198429b54a8b) by [@hoxyq](https://github.com/hoxyq))

#### Android specific

- Migrate packages to not eager initialize view managers ([d7eb3bfcb3](https://github.com/facebook/react-native/commit/d7eb3bfcb3df43d787af34cbd16730b2a12b6714))
- Do not explicitely depend on androidx.swiperefreshlayout:swiperefreshlayout ([179d5ab8ee](https://github.com/facebook/react-native/commit/179d5ab8eeb4393737049655876f5853b07f2560) by [@cortinico](https://github.com/cortinico))
- Remove the enableSeparateBuildPerCPUArchitecture from the template entirely ([dadf74fb68](https://github.com/facebook/react-native/commit/dadf74fb68980f4cba3d23e3802ee431a0713cca) by [@cortinico](https://github.com/cortinico))
- Convert Bridge-only calls to overridable functions ([1058bb8096](https://github.com/facebook/react-native/commit/1058bb809602a5223fa0adba74e7cab4df766685))
- Use ThemedReactContext explicitly to reduce confusion ([9f78517d64](https://github.com/facebook/react-native/commit/9f78517d6401f3a7ece453825a059a13b73f6140))
- Add notes to `aria-labelledby` from Text props ([72d3da19ce](https://github.com/facebook/react-native/commit/72d3da19cecca6a1bc8119f963311e1126e4c04b) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add POST_NOTIFICATION runtime permission to RNTester ([63a4539e4d](https://github.com/facebook/react-native/commit/63a4539e4d36ac90137eea6cdde0154ca06878c0) by [@makovkastar](https://github.com/makovkastar))
- Removing code for Android API level < 21 ([22ba1e45c5](https://github.com/facebook/react-native/commit/22ba1e45c52edcc345552339c238c1f5ef6dfc65) by [@mdvacca](https://github.com/mdvacca))
- Align creation of FabricUIManager with bridge ([6d45e49dc7](https://github.com/facebook/react-native/commit/6d45e49dc783d0af3a39be2df5e8495541d65e5f))
- For supporting Dev Loading View across multiple platforms, changed the Loading View of Android to rely on the native implementation instead of Toast. Getting rid of the JS changes relying on Toast for Dev Loading View now that the native module is released. ([208f559505](https://github.com/facebook/react-native/commit/208f5595055426305a9f23e92546b2ad09a8a52c))
- Remove unnecessary repositories{} block from top level build.gradle ([51a48d2e2c](https://github.com/facebook/react-native/commit/51a48d2e2c64a18012692b063368e369cd8ff797) by [@cortinico](https://github.com/cortinico))
- Include the inspector in all build modes, and only turn it off/on at runtime. ([8284303ec8](https://github.com/facebook/react-native/commit/8284303ec8d670a421745b3f580f184afa892592))
- Bump Soloader to 0.10.5 ([92a705b0e0](https://github.com/facebook/react-native/commit/92a705b0e0654429068d9de130f2216373124bbb) by [@simpleton](https://github.com/simpleton))
- Bump AGP to 7.4.x ([4c5eb8dd2a](https://github.com/facebook/react-native/commit/4c5eb8dd2a8cfb78783ab9cc3ac5a1c3f7937b63), ([5647d79dc9](https://github.com/facebook/react-native/commit/5647d79dc97ab2787a9575cb1621725d865b9814) by [@cortinico](https://github.com/cortinico))
- Bump Gradle to 8.x ([81dd3afe0b](https://github.com/facebook/react-native/commit/81dd3afe0bb88fbfa5b11d6f4c95f8684c9e1b47), ([10a8f186eb](https://github.com/facebook/react-native/commit/10a8f186eb41441ebad0c91be4f88deb4f9c6366) by [@cortinico](https://github.com/cortinico))
- Kotlin to 1.7.22 for Gradle ([270584ac79](https://github.com/facebook/react-native/commit/270584ac79ebb5b8e256bf7422615a5311e0c080) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Fixed URL to New Arch info ([6714b99289](https://github.com/facebook/react-native/commit/6714b99289d68b2f1efdb38d9977da725778e949) by [@frankcalise](https://github.com/frankcalise))
- Prefer `Content-Location` header in bundle response as JS source URL ([671ea383fe](https://github.com/facebook/react-native/commit/671ea383fe45dd9834a0c0481360de050df7f0c9) by [@robhogan](https://github.com/robhogan))
- Add support to enable the Hermes Sampling Profiler ([dce9d8d5de](https://github.com/facebook/react-native/commit/dce9d8d5de381fe53760ddda0d6cbbdfb5be00e4) by [@cipolleschi](https://github.com/cipolleschi))
- Enable layout animations on iOS in OSS ([0a30aa3612](https://github.com/facebook/react-native/commit/0a30aa361224639dbec0bbf33351673b67d31e75) by [@sammy-SC](https://github.com/sammy-SC))
- Update how the `react-native.config.js` is consumed to add elements in the interop layer. ([a055e07c3e](https://github.com/facebook/react-native/commit/a055e07c3ecd82dad6b2f9d9cc0088bce689d07e) by [@cipolleschi](https://github.com/cipolleschi))
- Use contents of sdks/.hermesversion to let cocoapods recognize Hermes updates. ([9f496e2be5](https://github.com/facebook/react-native/commit/9f496e2be5cfa55cd993c94f3a9210955bea085c) by [@dmytrorykun](https://github.com/dmytrorykun))
- Rename "Debug Menu" title to "Dev Menu" ([6971540c90](https://github.com/facebook/react-native/commit/6971540c90ae9e56bcc65e0c33c1ffb3db0a1e06) by [@huntie](https://github.com/huntie))
- Give precedence to `textContentType` property for backwards compat as mentioned in https://github.com/facebook/react-native/issues/36229#issuecomment-1470468374 ([c0abff11b6](https://github.com/facebook/react-native/commit/c0abff11b66d9ec3a8e1d09333a3fb6c05678bed) by [@lunaleaps](https://github.com/lunaleaps))
- Use SocketRocket for web socket library ([9ee0e1c78e](https://github.com/facebook/react-native/commit/9ee0e1c78e422a83de01d045657c10454f66980a))
- Pull out CGContext early in UIImage+Diff ([7f2dd1d49c](https://github.com/facebook/react-native/commit/7f2dd1d49cc3c0bf5e24fdb37f6457151c1f06c4) by [@Saadnajmi](https://github.com/Saadnajmi))
- Remove assumptions on super's description ([a5bc6f0574](https://github.com/facebook/react-native/commit/a5bc6f0574b6eff52b65d5324749d89de01b63a5) by [@Saadnajmi](https://github.com/Saadnajmi))
- Automatically update Search Path on pods ([ad686b0ce1](https://github.com/facebook/react-native/commit/ad686b0ce1ce69e8414e0c385ce0c7b4277f7a2f) by [@cipolleschi](https://github.com/cipolleschi))
- Install the -DNDEBUG flag on Release configurations, without requiring PRODUCTION=1 flag ([93fdcbaed0](https://github.com/facebook/react-native/commit/93fdcbaed0f69b268e1ae708a52df9463aae2d53) by [@cipolleschi](https://github.com/cipolleschi))
- Create a new compile time flag to enable remote sample profiling. ([de28f9b8ea](https://github.com/facebook/react-native/commit/de28f9b8ea2c4c2e3584da76145b9d6ce0e68b02))
- Bumbed version of Cocoapods to support Ruby 3.2.0 ([0f56cee8e1](https://github.com/facebook/react-native/commit/0f56cee8e1fca9575e83f439274b83e01bdd98e2) by [@cipolleschi](https://github.com/cipolleschi))
- Automatically install the RuntimeScheduler ([3e88fd01ce](https://github.com/facebook/react-native/commit/3e88fd01cecfa9c627506c8ab0081d1e4865862a) by [@cipolleschi](https://github.com/cipolleschi))
- Generate RCTFabric framework's headers in the React folder ([e7becb06c1](https://github.com/facebook/react-native/commit/e7becb06c16718a38570ba3a06d5059276be4b23) by [@cipolleschi](https://github.com/cipolleschi))
- Properly install dependencies with `use_frameworks!` ([6d34952420](https://github.com/facebook/react-native/commit/6d349524201e150029202134910de445328072e8) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the files from `.../textlayoutmanager/platform/ios` to `.../textlayoutmanager/platform/ios/react/renderer/textlayoutmanager` ([0e09d6f8a6](https://github.com/facebook/react-native/commit/0e09d6f8a665357f0dc642067eceb8f51ae24b76) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the files from `.../imagemanager/platform/ios` to `.../imagemanager/platform/ios/react/renderer/imagemanager` ([931a4c5e23](https://github.com/facebook/react-native/commit/931a4c5e239a006ecc81becf3252d23d44c969ef) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the files from `.../textinput/iostextinput` to `.../textinput/iostextinput/react/renderer/components/iostextinput` ([5588e0fe0b](https://github.com/facebook/react-native/commit/5588e0fe0b78bfcbc32b6880e9c985853aea5653) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the files from `.../nativemodule/xxx/platform/ios` to `.../nativemodule/xxx/platform/ios/ReactCommon` ([d1e500c3b1](https://github.com/facebook/react-native/commit/d1e500c3b19182897ccfb8abfe87e3f32dcacd3e) by [@cipolleschi](https://github.com/cipolleschi))
- Moved the files from `.../platform/ios` to `.../platform/ios/react/renderer/graphics` ([b5e4fea86e](https://github.com/facebook/react-native/commit/b5e4fea86ef9df1ed0edb438f918dfc8330f649c) by [@cipolleschi](https://github.com/cipolleschi))
- Build hermesc in Xcode run script phase. ([a5c77115ae](https://github.com/facebook/react-native/commit/a5c77115ae94b46823dc788add516493ee8e82cb) by [@dmytrorykun](https://github.com/dmytrorykun))
- Do not add "Copy Hermes Framework" script phase to hermes-engine target. ([af6c9e2183](https://github.com/facebook/react-native/commit/af6c9e218305c70e479c75e5ce1a8d633b1e2947) by [@dmytrorykun](https://github.com/dmytrorykun))
- Refactor RCTEventEmitter initialization ([25a00520d8](https://github.com/facebook/react-native/commit/25a00520d80b8b456b1eccfb106b75929f2f3bc2) by [@cipolleschi](https://github.com/cipolleschi))

### Deprecated

#### iOS specific

- Deprecate the `ReactCommon/react/renderer/graphics/conversions.h` in favor of `ReactCommon/react/core/graphicsConversions.h` ([d72697ca95](https://github.com/facebook/react-native/commit/d72697ca95820ebc7594b11bb5a6effeb84f2d90) by [@cipolleschi](https://github.com/cipolleschi))

### Removed

- Remove inline props from experimental ([8c4694f708](https://github.com/facebook/react-native/commit/8c4694f708fec310fc13193cc7fda40d971ed847))
- Refactor(react-native-github): internalized Slider JS files ([05968d16e1](https://github.com/facebook/react-native/commit/05968d16e1c4714a7ebfb08fff60ec7d5c914de1) by [@hoxyq](https://github.com/hoxyq))
- Remove `.node_version` from app template. ([a80578afc4](https://github.com/facebook/react-native/commit/a80578afc456c352edb52fc9b7e19899553a359a) by [@robhogan](https://github.com/robhogan))
- Clean up unnecessary lambda function for preallocate after D40403682 ([0569f6500e](https://github.com/facebook/react-native/commit/0569f6500e1ba9dbf021c8d693d5ac31af5dd586))
- Remove unused type imports 1/1 ([58a6cf840a](https://github.com/facebook/react-native/commit/58a6cf840afc9522b6cd9f3b15d119ddba7dab31) by [@alunyov](https://github.com/alunyov))
- Remove force_static from ReactCommon/react/renderer/core ([e088f81375](https://github.com/facebook/react-native/commit/e088f81375aa0216625bc38c964f50af6c4107b7) by [@javache](https://github.com/javache))

#### Android specific

- Deprecate LazyReactPackage.getReactModuleInfoProviderViaReflection() ([11570e71a2](https://github.com/facebook/react-native/commit/11570e71a2747602ff485552094b413375b19a96))
- UIManager.preInitializeViewManagers ([848ac0c3be](https://github.com/facebook/react-native/commit/848ac0c3bea5f38c002d316dbfb54c2d740bedfe) by [@javache](https://github.com/javache))
- Removed android sources of Slider module ([4c40014d43](https://github.com/facebook/react-native/commit/4c40014d43abe88b17db75aca9de9cca349ecbcc) by [@hoxyq](https://github.com/hoxyq))
- Remove the react.gradle file as it's unused ([d4a9bdc40e](https://github.com/facebook/react-native/commit/d4a9bdc40e06bdda9565cc43ea5af5a13ff6f1cf) by [@cortinico](https://github.com/cortinico))
- Remove .mk prebuilt file and .mk file generation from codegen ([7933dd78da](https://github.com/facebook/react-native/commit/7933dd78daed84581f3013c0a8e0130b6fdf81f9) by [@cortinico](https://github.com/cortinico))
- Remove deprecated POST_NOTIFICATION from `PermissionsAndroid` ([deb6b380b2](https://github.com/facebook/react-native/commit/deb6b380b251564163939fbf04cf62e07c9820bb) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Removed unused RCTWeakProxy helper ([2fbefff178](https://github.com/facebook/react-native/commit/2fbefff178b11a61089bd41296c918fa1b8857b9) by [@javache](https://github.com/javache))
- Removed Slider module ([465e937533](https://github.com/facebook/react-native/commit/465e9375338c8a3baab963c1f699c1c67af01029) by [@hoxyq](https://github.com/hoxyq))
- Removed DatePickerIOS module ([0ff7b7fac2](https://github.com/facebook/react-native/commit/0ff7b7fac2750f149592e41bb8825dcc65dea71d) by [@hoxyq](https://github.com/hoxyq))
- Removed iOS sources of Slider module ([fee9510b2d](https://github.com/facebook/react-native/commit/fee9510b2d8ff73be632dbe6f07003f001104836) by [@hoxyq](https://github.com/hoxyq))
- Removed native iOS sources of ProgressViewIOS ([1453ef1a88](https://github.com/facebook/react-native/commit/1453ef1a8836ead03f66792bd36bfcde333434c0) by [@hoxyq](https://github.com/hoxyq))
- Remove conformance to RCTComponentViewFactoryComponentProvider which does not exists in 0.72 ([ee177cab75](https://github.com/facebook/react-native/commit/ee177cab7583fa305d43c66342fb9b3693a4769a))

### Fixed

- Improved support for AnimatedInterpolation of color props. ([b589123a3d](https://github.com/facebook/react-native/commit/b589123a3dc0c6190137fbd2e6c18f24b98642f1) by [@javache](https://github.com/javache))
- Improved handling of native colors in Animated.Colors ([dccb57fb50](https://github.com/facebook/react-native/commit/dccb57fb50874e31dd0d3f6e39666e4a5b9a079d) by [@javache](https://github.com/javache))
- Patch AnimatedStyle to avoid discarding the initial style info ([c06323f463](https://github.com/facebook/react-native/commit/c06323f46334ee720cc46d48405ce584de16163d) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Gracefully handle out-of-bounds initialScrollIndex ([aab9df3710](https://github.com/facebook/react-native/commit/aab9df37102b6b8661a9e22ee8ae63166c8c632e) by [@NickGerleman](https://github.com/NickGerleman))
- Fix VirtualizedList onViewableItemsChanged won't trigger if first item in data is null ([011ea3306f](https://github.com/facebook/react-native/commit/011ea3306f02479b8003f519f7fc568a743b2019) by [@gauravroy1995](https://github.com/gauravroy1995))
- Fix VirtualizedList `onViewableItemsChanged` won't trigger if first item in data evaluate to false ([1f0c2c2895](https://github.com/facebook/react-native/commit/1f0c2c289506aa0a5e1fc0e77e1fe48351e2050d) by [@samchan0221](https://github.com/samchan0221))
- Calculate VirtualizedList render mask for focused cell during batched state updates ([cab865be79](https://github.com/facebook/react-native/commit/cab865be797b724d2fda5441e0ef23559180f722) by [@NickGerleman](https://github.com/NickGerleman))
- Bail on realizing region around last focused cell if we don't know where it is ([776fe7a292](https://github.com/facebook/react-native/commit/776fe7a29271d1b4678a0913315487724d201449) by [@NickGerleman](https://github.com/NickGerleman))
- Avoid VirtualizedList viewability updates during state updates ([62a0640e4a](https://github.com/facebook/react-native/commit/62a0640e4a8297177e857530e46010e83315e70a) by [@NickGerleman](https://github.com/NickGerleman))
- Add `lineBreakStrategyIOS` prop type for Text and TextInput ([0c5c07fc9b](https://github.com/facebook/react-native/commit/0c5c07fc9bf2ca13aece3dd9fa35d6c822f1fd84) by [@jeongshin](https://github.com/jeongshin))
- Fix negative value rounding issue for nodes across an axis ([37171ec78f](https://github.com/facebook/react-native/commit/37171ec78f377fbae89ce43010f9cf69c1e60fbc))
- Reduce use of assertions when parsing accessibility props passed from JS ([a064de151f](https://github.com/facebook/react-native/commit/a064de151f8314abacbd0f17127597266644fd78) by [@motiz88](https://github.com/motiz88))
- Fixes crash when using togglebutton accessibilityRole with Text ([dcc5dbe562](https://github.com/facebook/react-native/commit/dcc5dbe562cedd3bb9e954736c18780830e5f719) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fixes an issue with the EventEmitter type definition file ([4acef8e4a4](https://github.com/facebook/react-native/commit/4acef8e4a4d1ec51eeea751c7ee6aa36d8b7f457) by [@helenaford](https://github.com/helenaford))
- Fix animated components ref type inferred `any` ([419b41f06d](https://github.com/facebook/react-native/commit/419b41f06dfd7c75d9734ce2d61b511f11097c63) by [@jeongshin](https://github.com/jeongshin))
- Allow out-of-range initialScrollIndex after first scroll ([d595fbcc5a](https://github.com/facebook/react-native/commit/d595fbcc5a1a6c4a9fd9f20b6cabe1093ea346a6) by [@NickGerleman](https://github.com/NickGerleman))
- Delete refs to unmounted CellRenderers ([c376e78224](https://github.com/facebook/react-native/commit/c376e782247766d2c1f92cadf3ce1ab368933d25) by [@NickGerleman](https://github.com/NickGerleman))
- Enforce compatibility with `exactOptionalPropertyTypes` ([7858a2147f](https://github.com/facebook/react-native/commit/7858a2147fde9f754034577932cb5b22983f658f) by [@NickGerleman](https://github.com/NickGerleman))
- Fix touch handling so that hitSlop can extend beyond parent view bounds. ([96659f8e83](https://github.com/facebook/react-native/commit/96659f8e83e68f6330aaa59e3d5fb0953c67f1d1) by [@genkikondo](https://github.com/genkikondo))
- Export EmitterSubscription TypeScript Type ([eb83356cee](https://github.com/facebook/react-native/commit/eb83356ceee1ff3bca3073d7c4050981f2c01a4c) by [@NickGerleman](https://github.com/NickGerleman))
- Fix: remove gap if its last element in line (fix flex gap extra spacing when children determine parents main axis size) ([d867ec0abb](https://github.com/facebook/react-native/commit/d867ec0abb6cf6da6e2be44d28bbf9fc38319298) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Fixes JSDoc in Clipboard setString ([0ecb4e64f0](https://github.com/facebook/react-native/commit/0ecb4e64f0006a0dd2fb64cb64f97ed01c638781) by [@mikemikhaylov](https://github.com/mikemikhaylov))
- Fix typing for TS AnimatableStringValue ([eb2f86a46a](https://github.com/facebook/react-native/commit/eb2f86a46a89765de3bd32541d3e7043fe236108) by [@rshest](https://github.com/rshest))
- Fix types + documentation for CellRendererComponent ([2d41e6642e](https://github.com/facebook/react-native/commit/2d41e6642eaee636f90d5737ecdcddf2d89cfa2a) by [@NickGerleman](https://github.com/NickGerleman))
- Fixed error during native DAG creation when there are multiple AnimatedValue props ([c72c592ecd](https://github.com/facebook/react-native/commit/c72c592ecd9d31ec1661958d4e5f77f8dfb37cac) by [@genkikondo](https://github.com/genkikondo))
- Fix YogaLayoutableShadowNode handling of non-layoutable children ([024a8dc8ff](https://github.com/facebook/react-native/commit/024a8dc8ffd694426912c6abb0852e5d5f6c90c8) by [@NickGerleman](https://github.com/NickGerleman))
- Fix type definition for `unstable_batchedUpdates` ([71157f6ba6](https://github.com/facebook/react-native/commit/71157f6ba604a57b9fa79bc0401b89dc0b01145b) by [@k-yle](https://github.com/k-yle))
- Add missing SectionList types for Animated SectionList ([ed39d639ea](https://github.com/facebook/react-native/commit/ed39d639ea196181732186df735f5e58543ace32) by [@jeongshin](https://github.com/jeongshin))
- Add objectFit to the ImageStyle interface located in the StyleSheetTypes.d.ts file ([32d03c250c](https://github.com/facebook/react-native/commit/32d03c250c52e1d6e87c6eb0e2b87add4b56f031) by [@alvessteve](https://github.com/alvessteve))
- Add src, srcSet, referrerPolicy, tintColor to Image.d.ts declaration file ([74cb6073f3](https://github.com/facebook/react-native/commit/74cb6073f3ae926de712d883d08eb19ed2339788) by [@alvessteve](https://github.com/alvessteve))
- Fix missing `height`, `width`, `crossOrigin` props on Typescript Image.d.ts file ([bcf493f346](https://github.com/facebook/react-native/commit/bcf493f346e320d683ced471750bb8d8e3b1a5ae) by [@alvessteve](https://github.com/alvessteve))
- Fixed typo in the initialNumToRenderOrDefault description's comment ([ba7f9b40a6](https://github.com/facebook/react-native/commit/ba7f9b40a65c0dbf59341ba61adc8ef736d0239e) by [@ellouzeskandercs](https://github.com/ellouzeskandercs))
- Fixed string key calculation in constexpr from Performance C++ native module. ([6faddc3870](https://github.com/facebook/react-native/commit/6faddc3870b9dad0ed6d178492e92b03e8c00a8c))
- Fix computation of relative layout to return empty layout for nodes with display: none and children. ([6018c19991](https://github.com/facebook/react-native/commit/6018c199917403c5f9f5159697dbc61903b9642d) by [@rubennorte](https://github.com/rubennorte))
- Fix edge case when layout animation caused delete and create mutations in the same batch ([d9f2491a71](https://github.com/facebook/react-native/commit/d9f2491a713d872f2f3c8447dbf789fb17b94524))
- Fix edge case when delete is queued with conflict layout animation ([cf9c7d51ef](https://github.com/facebook/react-native/commit/cf9c7d51efd99b65527f9b9d2fef0334b972a461))
- VirtualizedList scrollToEnd with no data ([98009ad94b](https://github.com/facebook/react-native/commit/98009ad94b92320307f2721ee39dbeb9152c0a58) by [@Andarius](https://github.com/Andarius))
- Fixed a typo in interface.js ([7fedd7577a](https://github.com/facebook/react-native/commit/7fedd7577a249b1dd4f51b5b4a03858fd09cb7ef) by [@rj1](https://github.com/rj1))
- Add `borderCurve` and `pointerEvents` to `ViewStyle` ([a0800ffc7a](https://github.com/facebook/react-native/commit/a0800ffc7a676555aa9e769fc8fd6d3162de0ea6) by [@eps1lon](https://github.com/eps1lon))
- Fix whitespace and newline at EOF in template ([efe5f62f91](https://github.com/facebook/react-native/commit/efe5f62f91754ce8101fde24d6a984a5b56186c6) by [@friederbluemle](https://github.com/friederbluemle))
- Jest mocked requestAnimationFrame callbacks now receive a timestamp parameter ([b44fe4deee](https://github.com/facebook/react-native/commit/b44fe4deee505382698a98d2573691303b0159c3) by [@kmagiera](https://github.com/kmagiera))
- Removes duplicate DoubleTypeAnnotation label ([1bab3e24b8](https://github.com/facebook/react-native/commit/1bab3e24b887259e29626835e6bb944d105dff59) by [@mikemikhaylov](https://github.com/mikemikhaylov))
- Filter out Hermes internal bytecode frames (Promise implementation) from error stack traces ([4c911a2dec](https://github.com/facebook/react-native/commit/4c911a2deceb59fc07735205ae3a4622b4334f88) by [@motiz88](https://github.com/motiz88))
- Add missing AccessibilityInfo Types to TS Typings ([76a14454d7](https://github.com/facebook/react-native/commit/76a14454d7f1f2b2ba8f5a79c2f640fafb42de6d) by [@NickGerleman](https://github.com/NickGerleman))
- Fix Errors with TypeScript Tests ([c4862a2322](https://github.com/facebook/react-native/commit/c4862a2322e3401eece360bc6b2ed97c26764121) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing VirtualizedList Imperative Types ([621969b8d8](https://github.com/facebook/react-native/commit/621969b8d85d10f4f9b66be7d5deae58651dc6aa) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing types for AppRegistry ([8d6e2f86f5](https://github.com/facebook/react-native/commit/8d6e2f86f5685264ee5fe7a1f7c24d6d9e40bbaa) by [@NickGerleman](https://github.com/NickGerleman))
- Add type for RootTagContext ([4e5421fd9a](https://github.com/facebook/react-native/commit/4e5421fd9a5eb110e27e40b3ab283f973d38408b) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing types to PushNotificationIOS ([079312895b](https://github.com/facebook/react-native/commit/079312895b3bdc6b934ca51a377cf44419306e8d) by [@NickGerleman](https://github.com/NickGerleman))
- Fix types for deprecated scrollTo fields ([0d091318ed](https://github.com/facebook/react-native/commit/0d091318ed047c9f6cfe32d70b47fd5c4092c923) by [@NickGerleman](https://github.com/NickGerleman))
- Fix Vibration.vibrate() allowing null params ([2c2cb09c00](https://github.com/facebook/react-native/commit/2c2cb09c00b4eac98f59a4fcb874b6fbfdc839ff) by [@NickGerleman](https://github.com/NickGerleman))
- Mark scrollToEnd animated as optional ([e1af6302fc](https://github.com/facebook/react-native/commit/e1af6302fc189948ed0e123a39e0b08cd253fc27) by [@NickGerleman](https://github.com/NickGerleman))
- Fix type for `StyleSheet.compose()` ([1752fdc0f5](https://github.com/facebook/react-native/commit/1752fdc0f573be4348e4e6e7e31bc53b00aa00c6) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing type for AnimatedValue.resetAnimation() and AnimatedValue.animate() ([25a25ea234](https://github.com/facebook/react-native/commit/25a25ea234fc60c7a0b99e9c70253f77a69edc60) by [@NickGerleman](https://github.com/NickGerleman))
- Fixed a backwards compatibility issue with AnimatedInterpolation ([9b280ad1c5](https://github.com/facebook/react-native/commit/9b280ad1c5995f4d5bd5220dee778df3cd65db3f) by [@motiz88](https://github.com/motiz88))
- Explicitly set parser for jsx in ESLint config ([cdb88a2427](https://github.com/facebook/react-native/commit/cdb88a24273262a64f0706169557dc02d8592568) by [@NickGerleman](https://github.com/NickGerleman))
- Move flex gap props to the correct type ([ff984ac9b5](https://github.com/facebook/react-native/commit/ff984ac9b55c9c1af50d5785863f5f36f92b62d2) by [@NickGerleman](https://github.com/NickGerleman))
- Remove constexpr from RectangleEdges.h ([879d303fc7](https://github.com/facebook/react-native/commit/879d303fc7084972d9a04c2aff27ea518b6449c6) by [@TatianaKapos](https://github.com/TatianaKapos))
- Move certain list prop TS types from SectionList, FlatList to VirtualizedList([6c33fd1c48](https://github.com/facebook/react-native/commit/6c33fd1c4889a5d3dfb7f914c2518c3daa8a5337) by [@aliakbarazizi](https://github.com/aliakbarazizi))
- Limit diagnostics width output by `hermesc` ([260bcf7f1b](https://github.com/facebook/react-native/commit/260bcf7f1bf78022872eb2f40f33fb552a414809) by [@tido64](https://github.com/tido64))
- Fix autoComplete type for TextInput ([94356e14ec](https://github.com/facebook/react-native/commit/94356e14ec0562a1fd5a208d93021f102ba9565e) by [@iRoachie](https://github.com/iRoachie))
- Fix performance issues in Hermes when Debug ([60a452b485](https://github.com/facebook/react-native/commit/60a452b4853dc5651c465867344904dd6fc86703))
- Fix hermesc for linux ([32327cc177](https://github.com/facebook/react-native/commit/32327cc17779659bc441580d44784a60a74ede32) by [@cipolleschi](https://github.com/cipolleschi))

#### Android specific

- Read GROUP name in gradle-plugin dependency code ([615d9aefc4](https://github.com/facebook/react-native/commit/615d9aefc4274ed7a193c0410ed7f86e90ad1bff) by [@douglowder](https://github.com/douglowder))
- Fix letters duplication when using autoCapitalize https://github.com/facebook/react-native/issues/29070" ([cbe934bcff](https://github.com/facebook/react-native/commit/cbe934bcff0bdbd26f669fd9ace4fc818ca39e98) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Reset accessibility value when it gets a null value ([aacf28778e](https://github.com/facebook/react-native/commit/aacf28778eadfcae2ca33f66697620f7222d804c))
- Fix check of "reduce motion" setting on android ([790df10fa9](https://github.com/facebook/react-native/commit/790df10fa9bac18a60bd52178cc222f5e368a44b) by [@baranga](https://github.com/baranga))
- Fixed text measurement issue related to hyphenation frequency ([01e7ff5513](https://github.com/facebook/react-native/commit/01e7ff5513e2f5ca6f03bb8ac1b9a1a31612cc9a) by [@javache](https://github.com/javache))
- Fix layout width calculation in onTextLayout ([ccbbcaab9c](https://github.com/facebook/react-native/commit/ccbbcaab9cf3e6148e72f94fe63f77ce5f92416c) by [@reepush](https://github.com/reepush))
- Fix a bug that returns a random number from callback argument `timeRemaining` of `idleCallbacks` registered by `requestIdleCallbacks`. ([d9ab5e81cf](https://github.com/facebook/react-native/commit/d9ab5e81cf6a030438b36e0c27d45f20317c316e) by [@mir597](https://github.com/mir597))
- Fix android emulator detection for packager host ([64ff077a66](https://github.com/facebook/react-native/commit/64ff077a6640f9eaed695287469735cb03478927) by [@deecewan](https://github.com/deecewan))
- Invalid prop values no longer trigger Java exceptions in the legacy renderer ([e328fc2e24](https://github.com/facebook/react-native/commit/e328fc2e2429c7917e33125feafd26ad4699ee00) by [@motiz88](https://github.com/motiz88))
- Fixed crash occurring in certain native views when handling keyboard events. ([f7e35d4ef7](https://github.com/facebook/react-native/commit/f7e35d4ef7d68d06fba1439c0aa6d9ed05b58a7f) by [@aleqsio](https://github.com/aleqsio))
- Fixed ScrollView momentum not stopping when calling scrollTo programmatically ([681b35daab](https://github.com/facebook/react-native/commit/681b35daab2d0443278fe18c364b0e72c8c85673) by [@tomekzaw](https://github.com/tomekzaw))
- Fix memory leak in Android ([bc766ec7f8](https://github.com/facebook/react-native/commit/bc766ec7f8b18ddc0ff72a2fff5783eeeff24857))
- Address New Architecture performance regressions by properly setting NDEBUG ([8486e191a1](https://github.com/facebook/react-native/commit/8486e191a170d9eae4d1d628a7539dc9e3d13ea4) by [@cortinico](https://github.com/cortinico))
- LoadingView of Android to use the Toast till the native implementation is functional ([8ccb861231](https://github.com/facebook/react-native/commit/8ccb861231a7cd620ad3cab8fc52088360082f22))
- Linking.getInitialUrl should not wait for InteractionManager ([3921f05f59](https://github.com/facebook/react-native/commit/3921f05f594691285e79a379897ed698e081a705) by [@javache](https://github.com/javache))
- Using AccessibilityNodeInfo#addAction to announce Expandable/Collapsible State ([082a033fbb](https://github.com/facebook/react-native/commit/082a033fbbe7d7094af78bafc3b2048194a02bd5) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Corrected Nullable annotations for parameters and return values in TurboModules codegen ([6db3995175](https://github.com/facebook/react-native/commit/6db39951755cef82f06e23a5464cf1caf53c7966) by [@javache](https://github.com/javache))
- Fix measurement of uncontrolled TextInput after edit ([8a0fe30591](https://github.com/facebook/react-native/commit/8a0fe30591e21b90a3481c1ef3eeadd4b592f3ed) by [@NickGerleman](https://github.com/NickGerleman))
- Mimimize EditText Spans 9/9: Remove `addSpansForMeasurement()` ([92b8981499](https://github.com/facebook/react-native/commit/92b898149956a301a44f99019f5c7500335c5553) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 8/N: CustomStyleSpan ([b384bb613b](https://github.com/facebook/react-native/commit/b384bb613bf533aebf3271ba335c61946fcd3303) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 6/N: letterSpacing ([5791cf1f7b](https://github.com/facebook/react-native/commit/5791cf1f7b43aed1d98cad7bcc272d97ab659111) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 5/N: Strikethrough and Underline ([0869ea29db](https://github.com/facebook/react-native/commit/0869ea29db6a4ca20b9043d592a2233ae1a0e7a2) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 4/N: ReactForegroundColorSpan ([8c9c8ba5ad](https://github.com/facebook/react-native/commit/8c9c8ba5adb59f7f891a5307a0bce7200dd3ac7d) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 3/N: ReactBackgroundColorSpan ([cc0ba57ea4](https://github.com/facebook/react-native/commit/cc0ba57ea42d876155b2fd7d9ee78604ff8aa57a) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 1/N: Fix precedence ([1743dd7ab4](https://github.com/facebook/react-native/commit/1743dd7ab40998c4d3491e3b2c56c531daf5dc47) by [@NickGerleman](https://github.com/NickGerleman))
- Fix the setup to allow the build-from-source on host projects ([fec5658a32](https://github.com/facebook/react-native/commit/fec5658a321a3c0d5da34efaa59fe8d05575f674) by [@cortinico](https://github.com/cortinico))
- Fix a crash new app template when `createRootView` is invoked with null bundle ([990971186f](https://github.com/facebook/react-native/commit/990971186fccf1e14c8715cb35ab82ad8e43f99c) by [@cortinico](https://github.com/cortinico))
- Resolved bug with Text components in New Architecture losing text alignment state. ([31a8e92cad](https://github.com/facebook/react-native/commit/31a8e92caddcdbef9fe74de53e7f412a7e998591) by [@javache](https://github.com/javache))
- Fix border rendering issue when bottom borders has no width ([1d51032278](https://github.com/facebook/react-native/commit/1d5103227851ab92de889d5e7e910393b5d8743a) by [@BeeMargarida](https://github.com/BeeMargarida))
- Fix possible `ConcurrentModificationException` in `UIManagerModuleConstantsHelper::createConstants` ([805b88c7a4](https://github.com/facebook/react-native/commit/805b88c7a41084ec7b82d18807b585e267b69352) by [@j-piasecki](https://github.com/j-piasecki))
- Fixed incorrect logging of `isCatalystInstanceAlive` in exception handler ([daeee2a661](https://github.com/facebook/react-native/commit/daeee2a6619db59391de3b7c6e08db0dbe2331aa) by [@jonnycaley](https://github.com/jonnycaley))
- Make sure the Native RuntimeScheduler is initialized on Old Arch ([133ccdcc67](https://github.com/facebook/react-native/commit/133ccdcc67a7d19ffa5130949893c2792e3ad9fb) by [@cortinico](https://github.com/cortinico))
- RNGP dependency substitutions for fork with different Maven group ([012e4bd654](https://github.com/facebook/react-native/commit/012e4bd654f1eee2b00a066ba50a7f9c44cc305b) by [@douglowder](https://github.com/douglowder))
- Make sure the -DANDROID compilation flag is always included ([3a321ae2bb](https://github.com/facebook/react-native/commit/3a321ae2bb623a8f5c7f064d82ca8ca9df3ebff4) by [@cortinico](https://github.com/cortinico))
- Remove license header from android/app/build.gradle ([5e847c4309](https://github.com/facebook/react-native/commit/5e847c43097dc93ad2c6a5cdf542041b10f00634) by [@cortinico](https://github.com/cortinico))
- Make sure Java Toolchain and source/target level is applied to all projects ([52d2065910](https://github.com/facebook/react-native/commit/52d20659105abe2b065148b33c441941104f4d30) by [@cortinico](https://github.com/cortinico))
- Fix copy / paste menu and simplify controlled text selection on Android ([dfc64d5bcc](https://github.com/facebook/react-native/commit/dfc64d5bcc50c25bab40ba853af9f7b0c1c46d7a) by [@janicduplessis](https://github.com/janicduplessis))
- Fixed random styling for text nodes with many children  ([73f4a788f1](https://github.com/facebook/react-native/commit/73f4a788f18aed2277f6711f689b75ab8ce13b1b) by [@cubuspl42](https://github.com/cubuspl42))
- Fix Android border clip check ([2d15f50912](https://github.com/facebook/react-native/commit/2d15f50912927b5214473b53cce7043fa128d6b3) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Revert "fix: border width top/bottom not matching the border radius" ([0817eaa301](https://github.com/facebook/react-native/commit/0817eaa3012abc0104ffa0d41b844e1c2db1dcc2) by [@gabrieldonadel](https://github.com/gabrieldonadel))

#### iOS specific

- Fix Flipper by moving podfile modification of preprocessor def `FB_SONARKIT_ENABLED` from React-Core to React-RCTAppDelegate where it is now used. ([34d5212f5c](https://github.com/facebook/react-native/commit/34d5212f5ca468ec28a2a82097c0f7cf8722739d))
- Invalid prop values no longer trigger redbox in the legacy renderer ([cb28a2c46e](https://github.com/facebook/react-native/commit/cb28a2c46e1c65fbe71a69ee0b0e0bb4b2e20a35) by [@motiz88](https://github.com/motiz88))
- Fix issue where keyboard does not open when `TextInput` `showSoftInputOnFocus` changes from `false` to `true` ([7425c24cbe](https://github.com/facebook/react-native/commit/7425c24cbe66ec743794b6ffc4cc1a653e821dde) by [@christianwen](https://github.com/christianwen))
- Fix ScrollView `automaticallyAdjustKeyboardInsets` not resetting when Prefer Cross-Fade Transitions is enabled and keyboard hides ([b8f1bb50f7](https://github.com/facebook/react-native/commit/b8f1bb50f7734cbccb19808aae6f86a92fa8eea5) by [@grgmo](https://github.com/grgmo))
- Unrecognized fontFamily values no longer trigger a redbox ([d6e9891577](https://github.com/facebook/react-native/commit/d6e9891577c81503407adaa85db8f5bf97557db0) by [@motiz88](https://github.com/motiz88))
- Do not send extra onChangeText even wnen instantianting multiline TextView ([a804c0f22b](https://github.com/facebook/react-native/commit/a804c0f22b4b11b3d9632dc59a6da14f6c4325e3) by [@dmytrorykun](https://github.com/dmytrorykun))
- Support 120 FPS or more in `RCTFPSGraph` ([987dd6a358](https://github.com/facebook/react-native/commit/987dd6a35842acde9d540fc42dfe4a2f34fd2ddf) by [@mrousavy](https://github.com/mrousavy))
- Fix duplicate [RCTConvert UIUserInterfaceStyle:] ([d8b4737ca6](https://github.com/facebook/react-native/commit/d8b4737ca67591737e277cc43b7e352bd113dc7f) by [@NickGerleman](https://github.com/NickGerleman))
- Blob data is no longer prematurely deallocated when using blob.slice ([36cc71ab36](https://github.com/facebook/react-native/commit/36cc71ab36aac5e5a78f2fbae44583d1df9c3cef) by [@awinograd](https://github.com/awinograd))
- Unbreak cocoapods build ([419025df22](https://github.com/facebook/react-native/commit/419025df226dfad6a2be57c8d5515f103b96917b) by [@javache](https://github.com/javache))
- Don't download hermes nightly tarball if it exists ([d2dd79f3c5](https://github.com/facebook/react-native/commit/d2dd79f3c5bd5684a10d40670e2351e4252020b3) by [@janicduplessis](https://github.com/janicduplessis))
- Fix nullability warnings ([346b028227](https://github.com/facebook/react-native/commit/346b02822710152292eca25a711e9eeca68ab941) by [@tido64](https://github.com/tido64))
- Use NSCAssert() in react_native_assert instead of C assert() ([c5bc3f1373](https://github.com/facebook/react-native/commit/c5bc3f1373d223d4068f762c597bdc45261fb6c5) by [@NickGerleman](https://github.com/NickGerleman))
- Honour background color customisation in RCTAppDelegate ([5d6f21d744](https://github.com/facebook/react-native/commit/5d6f21d744d3a910eb82489404f0fe5dd1020d98) by [@cipolleschi](https://github.com/cipolleschi))
- Turn on NDEBUG when pods are installed for production. ([421df9ffd5](https://github.com/facebook/react-native/commit/421df9ffd58092b1a2dec455a048edb6db1739de) by [@cipolleschi](https://github.com/cipolleschi))
- Fix a crash when reloading JS bundle ([60f381a8b9](https://github.com/facebook/react-native/commit/60f381a8b9094e7dfaf01bea1b745d576cc458f6) by [@sammy-SC](https://github.com/sammy-SC))
- Fix missing node error message not printed correctly when deprecated `find-node-for-xcode.sh` is used. ([0d82b402aa](https://github.com/facebook/react-native/commit/0d82b402aa546aa773e91921989fb8389aee81dc) by [@uloco](https://github.com/uloco))
- Build codegen package while using old architecture ([90327d9fba](https://github.com/facebook/react-native/commit/90327d9fba9417577a14f293103ec84dbba5300a) by [@Saadnajmi](https://github.com/Saadnajmi))
- Fix cocoapods warning about merging user_target_xcconfig ([2bfb53c2fb](https://github.com/facebook/react-native/commit/2bfb53c2fba366d3476892f2384265aac212fbeb) by [@yhkaplan](https://github.com/yhkaplan))
- `-[RCTUITextField textView:shouldChangeTextInRange:replacementString:]` no longer crashes when we pass in a `nil` replacement string ([d5e6d9cecd](https://github.com/facebook/react-native/commit/d5e6d9cecd1a8b02d47c4dfaffc550167b093b32) by [@Saadnajmi](https://github.com/Saadnajmi))
- Remove UIKit import from RCTDevLoadingView.h ([e7dcad2ba1](https://github.com/facebook/react-native/commit/e7dcad2ba14d8188cce0ff976187fe045ee7f9a4) by [@christophpurrer](https://github.com/christophpurrer))
- Pod install with --project-directory ([efd39eea6f](https://github.com/facebook/react-native/commit/efd39eea6f553638b2430cbf0c3eed519995a940) by [@dcangulo](https://github.com/dcangulo))
- Fixed Mac Catalyst availability checks ([70d9b56d71](https://github.com/facebook/react-native/commit/70d9b56d717a13450d3e18ccb62bcfcb71cf4008) by [@Saadnajmi](https://github.com/Saadnajmi))
- Fix path issue to properly run the codegen cleanup step ([e71b094b24](https://github.com/facebook/react-native/commit/e71b094b24ea5f135308b1e66c86216d9d693403) by [@cipolleschi](https://github.com/cipolleschi))
- Make sure to add the New Arch flag to libraries ([ef11e15ca3](https://github.com/facebook/react-native/commit/ef11e15ca357be56afcf36969979442a235f7aa9) by [@cipolleschi](https://github.com/cipolleschi))
- Fix dataContentType may be [NSNull null] issue ([c0834b884b](https://github.com/facebook/react-native/commit/c0834b884bcaf2fd97a47bcb0320369b0b4469d2) by [@malacca](https://github.com/malacca))
- Properly support static libraries and static frameworks ([be895c870c](https://github.com/facebook/react-native/commit/be895c870c897705e65513574c459e85c38d5f7d))
- Use the right logic to decide when we have to build from source ([67d02640ba](https://github.com/facebook/react-native/commit/67d02640ba2465e4533ac050cb5baa9b34f58f0b))
- Fix application of _progressViewOffset in RCTRefreshControl to not occur by default (when value is unset) ([0062b10b56](https://github.com/facebook/react-native/commit/0062b10b56985c4556011fbbb8d43f0a038d359e) by [@objectivecosta](https://github.com/objectivecosta))
- Unexpected useEffects flushing semantics ([7211ef1962](https://github.com/facebook/react-native/commit/7211ef19624304b6a4d5219a8e0a2c67651b8b33) by [@sammy-SC](https://github.com/sammy-SC))
- Add support for building with Xcode 15 ([8ed2cfded5](https://github.com/facebook/react-native/commit/8ed2cfded51d47731686c1060915bee7dd63647e) by [@AlexanderEggers](https://github.com/AlexanderEggers))

### Security

- Update and Fixed Prototype Pollution in JSON5 via Parse Method ([4ac4a5c27d](https://github.com/facebook/react-native/commit/4ac4a5c27dc5705a42ed7f607e2333d363c0a6c5) by [@imhunterand](https://github.com/imhunterand))

#### iOS specific

- Enable Address and Undefined Behavior Sanitizers on RNTester ([65e61f3c88](https://github.com/facebook/react-native/commit/65e61f3c88388d4a2ed88bcc9a2cb5ba63fd8afa) by [@Saadnajmi](https://github.com/Saadnajmi))

## v0.71.19

### Added

#### iOS Specific

- Add privacy manifest to pod install and hello world ([d669ff7df8](https://github.com/facebook/react-native/commit/d669ff7df8727decb18143065273077db93267b6) by [@philIip](https://github.com/philIip))

### Changed

#### iOS Specific

- Bumped hermes to remove Apple's RR API that were unused. Hermes does not requires a PrivacyManifest now. ([d8d096d995](https://github.com/facebook/react-native/commit/d8d096d995eacf63bc76b6a7f2ec4265c9fc1f37) by [@cipolleschi](https://github.com/cipolleschi))

## v0.71.18

### Fixed

- Fix component stacks for tsx, ts, and jsx files ([631c013126](https://github.com/facebook/react-native/commit/631c01312632c5483013afef171c8cd85cb007c8) by [@hurali97](https://github.com/hurali97))

#### iOS specific

- Fix flipper for Xcode 15.3 ([2944ca6554](https://github.com/facebook/react-native/commit/2944ca65544661ea22cdad5d6230cd9ea2ade5ca) by [@cipolleschi](https://github.com/cipolleschi))

## v0.71.17

### Security

- Update CLI to 10.2.7 ([28998075d9](https://github.com/facebook/react-native/commit/28998075d98754bc72a65887346f027a9657b6a3) by [@szymonrybczak](https://github.com/szymonrybczak))

## v0.71.16

### Changed

#### Android specific

- Cherry-picking 'Call super.onRequestPermissionsResult in ReactActivity (#42478)' onto 0.71 ([8593306b34](https://github.com/facebook/react-native/commit/8593306b348da498f18984985bc70e3e32156655) by [@LimAlbert](https://github.com/LimAlbert))

### Fixed

- Symbolication stack fix (0.71.x) ([022a9f7835](https://github.com/facebook/react-native/commit/022a9f783561750be0f5c0e685d2ace8dd84d910) by [@joe-sam](https://github.com/joe-sam))

#### iOS specific

- Fix path to build-apple-framework ([9d6a740bf7](https://github.com/facebook/react-native/commit/9d6a740bf7620a3c66f241351b4885f09b4e7524) by [@hurali97](https://github.com/hurali97))
- Disable bitcode for Hermes ([d6fe029858](https://github.com/facebook/react-native/commit/d6fe02985849ba4712968b5811eeaf460640f85d) by [@hurali97](https://github.com/hurali97))
- Fix symbol not found _jump_fcontext with use_frameworks! ([bb592ef0dd](https://github.com/facebook/react-native/commit/bb592ef0dda30c7652b23b45843f636c6439278d) by [@hurali97](https://github.com/hurali97))
- Fix flags ([c38cdb60ca](https://github.com/facebook/react-native/commit/c38cdb60cad8fb6b0015e5d57afa4dd346fd71d2) by [@cipolleschi](https://github.com/cipolleschi))

## v0.71.15

### Fixed

#### Android specific
- Fix Android crash when apply PlatformColor to borders ([265af222aa](https://github.com/facebook/react-native/commit/265af222aa8acb3b514e22a7db191d66755f553b) by [@axinvd](https://github.com/axinvd))
- Fixed crash occurring in certain native views when keyboard events are fired. ([9497203957](https://github.com/facebook/react-native/commit/94972039571e1f3b387e0f63227a6ad13740eaf3) by [@kot331107](https://github.com/kot331107))

#### iOS specific

- Migrate away from JFrog to download boost ([ab19fd6aef](https://github.com/facebook/react-native/commit/ab19fd6aef43a739f78cf62155fec59d95f577d3) by [@cipolleschi](https://github.com/cipolleschi))
- Fix overriding `EXCLUDED_ARCHS` when installing Hermes on RN v0.71 ([16a605b6a3](https://github.com/facebook/react-native/commit/16a605b6a3c320f93b6cda9198d738672086e851) by [@ken0nek](https://github.com/ken0nek))

### Changed

- Update node installation on debian (0.71) ([bdc0ef3466](https://github.com/facebook/react-native/commit/bdc0ef34664b7f1a2b8598ad6092a2ec6cf089ce) by [@cipolleschi](https://github.com/cipolleschi))
- Bump cli to 10.2.6 ([0bc2dd03c1](https://github.com/facebook/react-native/commit/0bc2dd03c1ccb4ab6ecf55add249f222c5757f06) by [@hurali97](https://github.com/hurali97))
- Fix version of react-native-codegen ([c74602fe47](https://github.com/facebook/react-native/commit/c74602fe47ca12a151eb173203fb6fce7f3cc964) by [@lunaleaps](https://github.com/lunaleaps))

## v0.71.14

### Fixed

#### iOS specific

- Set the max version of Active support to 7.0.8 ([ce39931bc2](https://github.com/facebook/react-native/commit/ce39931bc2b02f13cbc5751ba4d4a6dbc07bc91a) by [@cipolleschi](https://github.com/cipolleschi))
- Xcode 15 patch ([287482e57f](https://github.com/facebook/react-native/commit/287482e57ffd221227e6fffb6852113d330260a1) by [@fortmarek](https://github.com/fortmarek))

## v0.71.13

### Added

#### Android specific

- For targeting SDK 34 - Added RECEIVER_EXPORTED/RECEIVER_NOT_EXPORTED flag support in DevSupportManagerBase ([177d97d8ea](https://github.com/facebook/react-native/commit/177d97d8ea962bdd4dad8fcf0efb04a307f25000) by [@apuruni](https://github.com/apuruni))

#### iOS specific

- Added support to inline the source map via RCTBundleURLProvider
 ([f7219ec02d](https://github.com/facebook/react-native/commit/f7219ec02d71d2f0f6c71af4d5c3d4850a898fd8) by [@Saadnajmi](https://github.com/Saadnajmi))

### Fixed

- Fix: mount devtools overlay only if react devtools are connected ([b3c7a5d4cc](https://github.com/facebook/react-native/commit/b3c7a5d4cc12be0fd9ec561daca35edabb896201) by [@hoxyq](https://github.com/hoxyq))

#### iOS specific

- Fix onChangeText not firing when clearing the value of TextInput with multiline=true on iOS ([0c9c57a9f7](https://github.com/facebook/react-native/commit/0c9c57a9f73294414d92428c5d2472dc1e1e5e96) by [@kkoudev](https://github.com/kkoudev))

## v0.71.12

### Fixed

- Prevent LogBox from crashing on very long messages ([cd56347dca](https://github.com/facebook/react-native/commit/cd56347dca4e948f5038643bcd804c41f037727a) by [@motiz88](https://github.com/motiz88))

#### Android specific

- Added CSS logical properties by mapping layout props ([2b06a75631](https://github.com/facebook/react-native/commit/2b06a75631c6d9f1fdc13bc8a5567f264d2c9b9a) by [@NickGerleman](https://github.com/NickGerleman) and [@AlexanderEggers](https://github.com/AlexanderEggers)) to fix view flattening on Android.

#### iOS specific

- fix `pod install --project-directory=ios` failing ([fc1abe1d69](https://github.com/facebook/react-native/commit/fc1abe1d69530e95bc39b439d7d883f620b86fb9) by [@tido64](https://github.com/tido64))

## v0.71.11

### Changed

- Bump CLI to 10.2.4 and Metro to 0.73.10 ([69804c70cb](https://github.com/facebook/react-native/commit/69804c70cb5c1afba934e55d7c4d694450c918f0) by [@kelset](https://github.com/kelset))

#### iOS specific

- Prefer `Content-Location` header in bundle response as JS source URL ([671ea383fe](https://github.com/facebook/react-native/commit/671ea383fe45dd9834a0c0481360de050df7f0c9) by [@robhogan](https://github.com/robhogan))

### Fixed

#### Android specific

- Fixed crash occurring in certain native views when handling keyboard events. ([f7e35d4ef7](https://github.com/facebook/react-native/commit/f7e35d4ef7d68d06fba1439c0aa6d9ed05b58a7f) by [@aleqsio](https://github.com/aleqsio))
- Prevent crash on OnePlus/Oppo devices in runAnimationStep ([f2c05142](https://github.com/facebook/react-native/commit/f2c05142259563b892e593b5a018bdbb6a0cf177) by [@hsource](https://github.com/hsource))
- Revert "fix: border width top/bottom not matching the border radius" to fix border styling issues ([fd8a19d](https://github.com/facebook/react-native/commit/fd8a19d5e2bc00f29b3cd992d24790084cc34cbd) by [@kelset](https://github.com/kelset))

#### iOS specific

- Make 0.71 compatible with Xcode 15 (thanks to @AlexanderEggers for the commit in main) ([5bd1a4256e](https://github.com/facebook/react-native/commit/5bd1a4256e0f55bada2b3c277e1dc8aba67a57ce) by [@kelset](https://github.com/kelset))

## v0.71.10

### Fixed

#### Android specific

- Bump RNGP to 0.71.19 ([3be3a7d1a2](https://github.com/facebook/react-native/commit/3be3a7d1a2840a045892ddd8e5f2263028e15127) by [@kelset](https://github.com/kelset))
  - contains: RNGP dependency substitutions for fork with different Maven group ([012e4bd654](https://github.com/facebook/react-native/commit/012e4bd654f1eee2b00a066ba50a7f9c44cc305b) by [@douglowder](https://github.com/douglowder))

## v0.71.9

### Fixed

- VirtualizedList scrollToEnd with no data ([98009ad94b](https://github.com/facebook/react-native/commit/98009ad94b92320307f2721ee39dbeb9152c0a58) by [@Andarius](https://github.com/Andarius))
- Allow string `transform` style in TypeScript ([2558c3d4f5](https://github.com/facebook/react-native/commit/2558c3d4f56776699602b116aff8c22b8bfa176a) by [@NickGerleman](https://github.com/NickGerleman))
- Fix autoComplete type for TextInput ([94356e14ec](https://github.com/facebook/react-native/commit/94356e14ec0562a1fd5a208d93021f102ba9565e) by [@iRoachie](https://github.com/iRoachie))

## v0.71.8

### Fixed

#### Android specific

- Read GROUP name in gradle-plugin dependency code ([615d9aefc4](https://github.com/facebook/react-native/commit/615d9aefc4274ed7a193c0410ed7f86e90ad1bff) by [@douglowder](https://github.com/douglowder))
- Bump RNGP to 0.71.18 ([4bf4c470fe](https://github.com/facebook/react-native/commit/4bf4c470fe4996af02f45c9a9d77c6a790a95362) by [@kelset](https://github.com/kelset))

#### iOS specific

- Do not send extra onChangeText even wnen instantianting multiline TextView ([a804c0f22b](https://github.com/facebook/react-native/commit/a804c0f22b4b11b3d9632dc59a6da14f6c4325e3) by [@dmytrorykun](https://github.com/dmytrorykun))

## v0.71.7

### Fixed

#### iOS specific

- Address Hermes performance regression ([9be2959](https://github.com/facebook/react-native/commit/9be29593c8bac64178d441e46c6f7b31e591360e) by [@dmytrorykun](https://github.com/dmytrorykun))

#### Android specific

- Resolved bug with Text components in new arch losing text alignment state. ([31a8e92cad](https://github.com/facebook/react-native/commit/31a8e92caddcdbef9fe74de53e7f412a7e998591) by [@javache](https://github.com/javache))
- Mimimize EditText Spans 9/9: Remove `addSpansForMeasurement()` ([92b8981499](https://github.com/facebook/react-native/commit/92b898149956a301a44f99019f5c7500335c5553) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 8/N: CustomStyleSpan ([b384bb613b](https://github.com/facebook/react-native/commit/b384bb613bf533aebf3271ba335c61946fcd3303) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 6/N: letterSpacing ([5791cf1f7b](https://github.com/facebook/react-native/commit/5791cf1f7b43aed1d98cad7bcc272d97ab659111) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 5/N: Strikethrough and Underline ([0869ea29db](https://github.com/facebook/react-native/commit/0869ea29db6a4ca20b9043d592a2233ae1a0e7a2) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 4/N: ReactForegroundColorSpan ([8c9c8ba5ad](https://github.com/facebook/react-native/commit/8c9c8ba5adb59f7f891a5307a0bce7200dd3ac7d) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 3/N: ReactBackgroundColorSpan ([cc0ba57ea4](https://github.com/facebook/react-native/commit/cc0ba57ea42d876155b2fd7d9ee78604ff8aa57a) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 1/N: Fix precedence ([1743dd7ab4](https://github.com/facebook/react-native/commit/1743dd7ab40998c4d3491e3b2c56c531daf5dc47) by [@NickGerleman](https://github.com/NickGerleman))
- Fix measurement of uncontrolled TextInput after edit ([8a0fe30591](https://github.com/facebook/react-native/commit/8a0fe30591e21b90a3481c1ef3eeadd4b592f3ed) by [@NickGerleman](https://github.com/NickGerleman))

## v0.71.6

### Fixed

#### iOS specific

- Fix React Codegen podspec to build on Xcode 14.3 ([0010c3807d](https://github.com/facebook/react-native/commit/0010c3807d7e47d7d518667dbfac62f7c0da1ac1) by [@kelset](https://github.com/kelset))

## v0.71.5

### Changed

- Bump CLI to 10.2.2 and Metro to 0.73.9 ([4c3bc24893](https://github.com/facebook/react-native/commit/4c3bc24893b2dc7495a2e65ee8f1c6408cc31ad5) by [@kelset](https://github.com/kelset)), contains:
  - CLI fix: correctly list ios devices and simulators ([relevant PR](https://github.com/react-native-community/cli/pull/1863))
  - Metro fix: fix watching contents of new directories in NodeWatcher ([ab86982](https://github.com/facebook/metro/commit/ab86982fad83da457d949f01a301c589fabcb12e) by [@robhogan](https://github.com/robhogan))

#### Android specific

- Bump RNGP to 0.71.17 ([bf490d379f](https://github.com/facebook/react-native/commit/bf490d379f8727aa18ded97f0f86465a00e3bef0) by [@kelset](https://github.com/kelset)), contains:
  - Fix patch for codegen for 0.71 ([ec3681143e](https://github.com/facebook/react-native/commit/ec3681143e041a19cdee36d9f1ce63d7d0663091) by [@kelset](https://github.com/kelset))

#### iOS specific

- Remove ruby-version from 0.71 ([1d22e29146](https://github.com/facebook/react-native/commit/1d22e291462ac452f2bb6b1b6af11986944ec54a) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

#### Android specific

- Fix race condition in ReadableNativeMap ([9aac13d](https://github.com/facebook/react-native/commit/9aac13d4dc95925b57f03e7964fc7add6834e518) by [@rshest](https://github.com/rshest))

#### iOS specific

- Give precedence to `textContentType` property for backwards compat as mentioned in https://github.com/facebook/react-native/issues/36229#issuecomment-1470468374 ([c0abff11b6](https://github.com/facebook/react-native/commit/c0abff11b66d9ec3a8e1d09333a3fb6c05678bed) by [@lunaleaps](https://github.com/lunaleaps))
- Blob data is no longer prematurely deallocated when using blob.slice ([36cc71ab36](https://github.com/facebook/react-native/commit/36cc71ab36aac5e5a78f2fbae44583d1df9c3cef) by [@awinograd](https://github.com/awinograd))

## v0.71.4

### Changed

- Make FlatList permissive of ArrayLike data ([c03de97fb4](https://github.com/facebook/react-native/commit/c03de97fb44f0aecbec8f930bd99fe26f37f9648) by [@NickGerleman](https://github.com/NickGerleman))
- Bumping RNGP to `^0.71.16` ([3df4a79c3d](https://github.com/facebook/react-native/commit/3df4a79c3d8e788ffb113fde801836251eed4c03) by [@kelset](https://github.com/kelset))
- Update CLI to 10.2.0, Metro to 0.73.8 ([20a6fbd373](https://github.com/facebook/react-native/commit/20a6fbd37312ff4e6bb11f6f43b9abc2f559e1fb) by [@robhogan](https://github.com/robhogan)) - contains:
  - fix: Source maps may have invalid entries when using Terser minification. ((`metro/#928`)[https://github.com/facebook/metro/pull/928])
  - fix: Mitigate potential source map mismatches with concurrent transformations due to terser#1341. ((`metro/#929`)[https://github.com/facebook/metro/pull/929])
- Bump Hermes Version ([291cc0af10](https://github.com/facebook/react-native/commit/291cc0af100fe2aa6201f04ebd6c8c889a018d45)) - contains:
  - use ConsecutiveStringStorage to dedup serialized literals ([62d58e](https://github.com/facebook/hermes/commit/62d58e5d6747da8b8ee9e18eb8d0f57469acf201))
  - Remove register stack size override in hermes.cpp ([6146eb](https://github.com/facebook/hermes/commit/6146eb39e9eb8e712169697eac75001c2aeab40d))
  - fix: specify currency in locale identifier when formatting currency plural ([21f15c](https://github.com/facebook/hermes/commit/21f15c537a49a39bdf1b5440cde0b7312497431d))
  - Increase default max stack size ([ee2588](https://github.com/facebook/hermes/commit/ee25883ea34374f687883a641c8101ac0d292fc6))
  - Refactor HBC test helper ([31fdcf](https://github.com/facebook/hermes/commit/31fdcf738940875c9bacf251e149006cf515d763))

#### Android specific

- Expose `rrc_root` via prefab. ([3418f65d88](https://github.com/facebook/react-native/commit/3418f65d88fa8be3473f757e932ecba1bbfce783) by [@tomekzaw](https://github.com/tomekzaw))

### Fixed

- Fix touchable hitSlop type ([23607aea68](https://github.com/facebook/react-native/commit/23607aea688c950fe0cf424b280a2339636130fe) by [@bigcupcoffee](https://github.com/bigcupcoffee))
- Fix TouchableOpacity componentDidUpdate causing an excessive number of pending callbacks ([8b1f6e09c1](https://github.com/facebook/react-native/commit/8b1f6e09c1b11e07096156d8d01aaff649745fbc) by [@gabrieldonadel](https://github.com/gabrieldonadel))

#### Android specific

- ENTRY_FILE should resolve relative paths from root ([6dde1dc7cb](https://github.com/facebook/react-native/commit/6dde1dc7cb487271567aaa9c7e093bb76c0689ad) by [@cortinico](https://github.com/cortinico))
- Better Monorepo support for New Architecture ([0487108461](https://github.com/facebook/react-native/commit/0487108461010154cf959bb0bf6ba9e82fdcc4d1) by [@cortinico](https://github.com/cortinico))

## v0.71.3

### Changed

- Bump package versions ([4b84888a90](https://github.com/facebook/react-native/commit/4b84888a90c9436a8a62cc8507176f1b946b9b93) by [@cipolleschi](https://github.com/cipolleschi)), ([60f0a71060](https://github.com/facebook/react-native/commit/60f0a71060078759b526f65926763274811977f9) by [@cipolleschi](https://github.com/cipolleschi)), ([a3f205a27b](https://github.com/facebook/react-native/commit/a3f205a27b75d4e76354dbcb3203653e1f93f3ee) by [@cipolleschi](https://github.com/cipolleschi)):
  - `react-native-codegen` to `0.71.5`
  - `react-native-gradle-plugin` to `0.71.15`

### Fixed

- (codegen) Add missing C++ include for prop conversion of complex array type ([92fc32aa](https://github.com/facebook/react-native/commit/92fc32aa053ac8401ad8c9f55dcfa1e48ae8fc1d) by [@rshest](https://github.com/rshest))

#### Android specific

- Fixed jscexecutor crash on Android which is caused from NDK incompatibility ([a232decbb1](https://github.com/facebook/react-native/commit/a232decbb1252ade0247a352f887ca4d97ee273c) by [@Kudo](https://github.com/Kudo))
- Used relative paths for gradle commands ([bb02ccf13f](https://github.com/facebook/react-native/commit/bb02ccf13f76f46b8572e2a85d578fd8d4fd9467) by [@shivenmian](https://github.com/shivenmian))

#### iOS specific

- fix `pod install --project-directory=...` ([ad1ddc241a](https://github.com/facebook/react-native/commit/ad1ddc241af723a3f5da2058709f9684e51fb5ce) by [@tido64](https://github.com/tido64))

## v0.71.2

### Added

- Added AlertOptions argument to the type definition for Alert.prompt to bring it into parity with the js code. ([305ca337c0](https://github.com/facebook/react-native/commit/305ca337c0471c61cb74216bd93ae3f1a232a89f) by [@paulmand3l](https://github.com/paulmand3l))
- Added missing `accessibilityLabelledBy` TypeScript type ([e162b07982](https://github.com/facebook/react-native/commit/e162b07982cf9481038de71f5dd7bd9b45387f0a) by [@DimitarNestorov](https://github.com/DimitarNestorov))
- Added missing `accessibilityLanguage` TypeScript type ([71c4f57baf](https://github.com/facebook/react-native/commit/71c4f57baf6683ea4304e15c040d6b6c3b3d2b73) by [@DimitarNestorov](https://github.com/DimitarNestorov))

### Changed

- Bump `react-native-gradle-plugin` to `^0.71.14` in core, `@react-native-community/eslint-config` to `^3.2.0` in starting template ([785bc8d97b](https://github.com/facebook/react-native/commit/785bc8d97b824a2af86ffe46f321471f4952764c) by [@kelset](https://github.com/kelset))

### Fixed

- Add `TextInput`'s `inputMode` TypeScript types ([fac7859863](https://github.com/facebook/react-native/commit/fac7859863c7130740aacc95d0e62417bd8f789e) by [@eps1lon](https://github.com/eps1lon))
- Fix crash by conditional value of aspectRatio style value ([a8166bd75b](https://github.com/facebook/react-native/commit/a8166bd75b221f967a859d5cc25b3394c4d35301) by [@mym0404](https://github.com/mym0404))
- Fix TurboModuleRegistry TS type ([c289442848](https://github.com/facebook/react-native/commit/c28944284894a3188b97e3d8bb5b489755852160) by [@janicduplessis](https://github.com/janicduplessis))
- Fix invariant violation when nesting VirtualizedList inside ListEmptyComponent ([1fef376812](https://github.com/facebook/react-native/commit/1fef37681298c828a07febcd0d975a32f6bc4403) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- [RNGP] Properly set the `jsRootDir` default value ([c0004092f9](https://github.com/facebook/react-native/commit/c0004092f935ad892d4a1acf38fb184f1140bfd2) by [@cortinico](https://github.com/cortinico))
- Do not use WindowInsetsCompat for Keyboard Events ([32f54877ff](https://github.com/facebook/react-native/commit/32f54877ff788240d24528d208c704ee78e4e761) by [@NickGerleman](https://github.com/NickGerleman))
- Mitigation for Samsung TextInput Hangs ([4650ef3](https://github.com/facebook/react-native/commit/4650ef36e3d63df6e6a31f00fcf323c53daff2d6) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- Add Back dynamic framework support for the Old Architecture with Hermes ([b3040ec624](https://github.com/facebook/react-native/commit/b3040ec6244da6ea274654abfd84516de4f5bf52) by [@cipolleschi](https://github.com/cipolleschi))
- Add Back dynamic framework support for the old architecture ([da270d038c](https://github.com/facebook/react-native/commit/da270d038c271d6b82de568621b49e38739372c6) by [@cipolleschi](https://github.com/cipolleschi))

## v0.71.1

### Added

#### Android specific

- Add `jsinspector` to the prefab target ([a80cf96fc8](https://github.com/facebook/react-native/commit/a80cf96fc8821dcc07987c9b91dff0c839c8769c) by [@Kudo](https://github.com/Kudo))

#### iOS specific

- Add `initialProps` property to `RCTAppDelegate` ([b314e6f147](https://github.com/facebook/react-native/commit/b314e6f147fdfcd71e7ba3b17338bb44356df98e) by [@jblarriviere](https://github.com/jblarriviere))

### Changed

- Bump CLI to 10.1.3 ([b868970037](https://github.com/facebook/react-native/commit/b868970037f7fb510b23ac65d378ff1ba28e9af6) by [@kelset](https://github.com/kelset))
- Bump RNGP to 0.71.13 ([416463c406](https://github.com/facebook/react-native/commit/416463c4068a3cdb5ed1e01f7e17f22d68c1b9ed) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- Fix(cli,metro,babel): bump cli and metro and babel to fix Windows+Metro issue ([df7c92ff4c](https://github.com/facebook/react-native/commit/df7c92ff4c095f5f6b3424de7287f5cb124d91d3) by [@kelset](https://github.com/kelset))

#### Android specific

- Fix ReactRootView crash when root view window insets are null ([4cdc2c48e8](https://github.com/facebook/react-native/commit/4cdc2c48e826f5bb762085fc38954ed09df6ef12) by [@enahum](https://github.com/enahum))
- Fix for resources not correctly bundlded on release appbundles ([60b9d8c2b9](https://github.com/facebook/react-native/commit/60b9d8c2b9800135fdace5f58d94bebde2849510) by [@cortinico](https://github.com/cortinico))
- RNGP - Honor the --active-arch-only when configuring the NDK ([470f79b617](https://github.com/facebook/react-native/commit/470f79b61734e085978b03507eda6ed026936b7b) by [@cortinico](https://github.com/cortinico))
- Fixed typo in template build.gradle ([38e35df47c](https://github.com/facebook/react-native/commit/38e35df47c59e425fdac34d1f91540b8b8ca2908) by [@Titozzz](https://github.com/Titozzz))


#### iOS specific

- Exclude `react-native-flipper` when `NO_FLIPPER=1` to prevent iOS build fail ([f47b5b8b5d](https://github.com/facebook/react-native/commit/f47b5b8b5def41aeb6d5b672928cc57e20fba49d) by [@retyui](https://github.com/retyui))
- Fix RCTAlertController not showing when using SceneDelegate on iOS 13.0+. ([0c53420a7a](https://github.com/facebook/react-native/commit/0c53420a7af306d629350e1244e8e2ccae08a312))
- Handle Null Exception to Validate input in RCTAlertController and in RCTDevLoadingView ([79e603c5ab](https://github.com/facebook/react-native/commit/79e603c5ab5972859153a6ece80cd91ff0a04fc5) by [@admirsaheta](https://github.com/admirsaheta))
- Fixed the potential race condition when dismissing and presentating modal ([e948c79bda](https://github.com/facebook/react-native/commit/e948c79bda7f000427d56dac6fe5c70555db5701) by [@wood1986](https://github.com/wood1986))
- Fix build errors when inheriting RCTAppDelegate in Swift modules ([5eb25d2186](https://github.com/facebook/react-native/commit/5eb25d2186fd94128ec2ae74fec02429da969e63) by [@Kudo](https://github.com/Kudo))
- OnSelectionChange() is fired before onChange() on multiline TextInput ([64475aeb3b](https://github.com/facebook/react-native/commit/64475aeb3b1b0e37bdad2c2d5abb2116b2141c06) by [@s77rt](https://github.com/s77rt))
- Build: remove deprecated File.exists() method from Hermes podspec. ([38e5fa6a96](https://github.com/facebook/react-native/commit/38e5fa6a9604ab42fef442e7a51ebfe185df90bb) by [@kelset](https://github.com/kelset))

## v0.71.0

Read the [announcement blogpost here](https://reactnative.dev/blog/2023/01/12/version-071).

⚠️ *Git Bash users on Windows might experience "Unable to resolve" red boxes, because of an issue with Metro (silently fails without discovering any files). It will be fixed in 0.71.1 next week, in the meantime you can set `resolver.useWatchman: false` in `metro.config.js`.*

### Breaking Changes

- **Changes to Console Logging:** `LogBox.ignoreLog` no longer filters console logs. This means you will start seeing logs in the console that you have silenced in LogBox. See [this comment](https://github.com/facebook/react-native/pull/34476#issuecomment-1240667794) for more details.
- **Removed AsyncStorage and MaskedViewIOS**: These components have been deprecated since version [0.59](https://github.com/facebook/react-native/blob/main/CHANGELOG.md#deprecated-8), so it’s time we remove them entirely. For alternatives, please check [React Native Directory](https://reactnative.directory/) for community packages that cover those use cases.
- **JSCRuntime moved to react-jsc:** react-jsi is now split into react-jsc and react-jsi. If you use JSCRuntime, you will need to add react-jsc as a dependency ([facebook/react-native@6b129d8](https://github.com/facebook/react-native/commit/6b129d81ed8cab301775d2a04971e255df9290de)).

### Added

- Add flex yoga bindings of `gap`, `column-gap` and `row-gap` ([9f3a3e13cc](https://github.com/facebook/react-native/commit/9f3a3e13cc7e083dc0151b6037fc483dbfeaeabc) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Add back deprecated PropTypes ([b966d29724](https://github.com/facebook/react-native/commit/b966d297245a4c1e2c744cfe571396cfa7e5ffd3) by [@rickhanlonii](https://github.com/rickhanlonii))
- Make the `prepare_package_for_release` fail if there is already a git tag with that version ([850f855eb6](https://github.com/facebook/react-native/commit/850f855eb67edfbf777b4bf89f8b6e8e884b853e) by [@cipolleschi](https://github.com/cipolleschi))
- Add a C++ only TurboModule example (for Android/iOS/macOS/Windows) ([d07575b1c6](https://github.com/facebook/react-native/commit/d07575b1c63c214f74fd72b329892c7cfde5df69) by [@christophpurrer](https://github.com/christophpurrer))
- Enable platform-specific Codegen Specs ([ab7b4d4cd8](https://github.com/facebook/react-native/commit/ab7b4d4cd89cf6a7cb76d2b6a60163919cc3c689) by [@cipolleschi](https://github.com/cipolleschi))
- Add "option" to available role values ([e3e635ef84](https://github.com/facebook/react-native/commit/e3e635ef84156a5283d378858f7c8deb44464fea) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added support `Promise.any` ([475310dbba](https://github.com/facebook/react-native/commit/475310dbbaec8048411edefc6cdddab330df7966) by [@retyui](https://github.com/retyui))
- Log Abnormal Closes to Metro Websocket ([3982a2c6bd](https://github.com/facebook/react-native/commit/3982a2c6bd116a6dcc6ee6889e4a246b710b70a7) by [@NickGerleman](https://github.com/NickGerleman))
- `BlobModule` to `RCTCoreModulesClassProvider` ([279cfec55f](https://github.com/facebook/react-native/commit/279cfec55fdf404fdb9198edbb37d3adfdfb3bf1) by [@andrestone](https://github.com/andrestone))
- Added `mixed` value for `aria-checked`. ([7a19af7fb6](https://github.com/facebook/react-native/commit/7a19af7fb6b3b62fbbd632c6569a4270c604fb86) by [@ankit-tailor](https://github.com/ankit-tailor))
- Concurrent rendering safe implementation of ScrollViewStickyHeader ([925e81ab86](https://github.com/facebook/react-native/commit/925e81ab86c9807b66d405d914e857b978b194fd) by [@sammy-SC](https://github.com/sammy-SC))
- Add DevToolsSettingsManager ([0fac9817df](https://github.com/facebook/react-native/commit/0fac9817df403e31d8256befe52409c948614706) by [@rbalicki2](https://github.com/rbalicki2))
- Add enum example to Android/iOS rn-tester TurboModule ([02e4fcd825](https://github.com/facebook/react-native/commit/02e4fcd825fecc78ce2c93a1e3a9ba2b232c573b) by [@christophpurrer](https://github.com/christophpurrer))
- React-native-codegen: add Enum Type support for iOS/Android TurboModules ([745f3ee8c5](https://github.com/facebook/react-native/commit/745f3ee8c571560406629bc7af3cf4914ef1b211) by [@christophpurrer](https://github.com/christophpurrer))
- Parser interface to divide parser logic. ([5940d25cc1](https://github.com/facebook/react-native/commit/5940d25cc184241ed77aca85c62f4ee071210d9b) by [@cipolleschi](https://github.com/cipolleschi))
- Add role prop to Text component ([20718e6b8c](https://github.com/facebook/react-native/commit/20718e6b8ce4f5c3a8393067d5e8eb0da910751c) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Introduce `useAnimatedValue` hook to make it easier working with `Animated.Value`s in function components. ([e22217fe8b](https://github.com/facebook/react-native/commit/e22217fe8b9455e32695f88ca835e11442b0a937) by [@fabriziocucci](https://github.com/fabriziocucci))
- Highlight elements on hover while mouse down for React DevTools element inspection. ([94429fb037](https://github.com/facebook/react-native/commit/94429fb037322652b6796ac2c40cef451795205e))
- Implement method bindings for gap/row-gap/column-gap ([803a2978e5](https://github.com/facebook/react-native/commit/803a2978e5c0a33c6bb57b402a67218571382fbb) by [@NickGerleman](https://github.com/NickGerleman))
- Implement gap/row-gap/column-gap (within the C ABI) ([1373a7057b](https://github.com/facebook/react-native/commit/1373a7057b9d66830868832a9684ad80ae5d9d45) by [@NickGerleman](https://github.com/NickGerleman) and [@jacobp100](https://github.com/jacobp100))
- Add destructuredArrayIgnorePattern to eslint config ([0c5ef573fe](https://github.com/facebook/react-native/commit/0c5ef573fed31698ff8906675ddfc12a35829723) by [@fwcd](https://github.com/fwcd))
- Add aria-modal prop to basic component ([f353119113](https://github.com/facebook/react-native/commit/f353119113d6fc85491765ba1e90ac83cb00fd61) by [@dakshbhardwaj](https://github.com/dakshbhardwaj))
- Add support for ImageSource and ImageRequest in the State. ([d7c41361dd](https://github.com/facebook/react-native/commit/d7c41361dd87930044473434aba6e63b63811bdb) by [@cipolleschi](https://github.com/cipolleschi))
- Generate custom Native State ([7490ad4a21](https://github.com/facebook/react-native/commit/7490ad4a213aa75bfff205b57733cc71c79ca62c) by [@cipolleschi](https://github.com/cipolleschi))
- Add support for platform-specific specs ([7680bdeb4f](https://github.com/facebook/react-native/commit/7680bdeb4f96a8092393372a59c77a9d7b729cae) by [@cipolleschi](https://github.com/cipolleschi))
- Added suppression for warnings about unused parameters in 'publish<Type E>()' func ([c1363984f1](https://github.com/facebook/react-native/commit/c1363984f1a418cb1be59d927895a69be7b9ed1e) by [@inobelar](https://github.com/inobelar))
- Export YGInteropSetLogger method ([d9a5c66baa](https://github.com/facebook/react-native/commit/d9a5c66baac824923f373d52017067738654277a) by [@KimDaeWook](https://github.com/KimDaeWook))
- Add instructions about how to add tests in the OSS ([75b688fba8](https://github.com/facebook/react-native/commit/75b688fba8335598c19b9333459b6939dcf0a32c) by [@cipolleschi](https://github.com/cipolleschi))
- Add YGGutter Enum ([87e7912b95](https://github.com/facebook/react-native/commit/87e7912b9580ea8c9229cd77c36cb1d653972722) by [@NickGerleman](https://github.com/NickGerleman))
- Add string support for aspectRatio ([14c91cdf59](https://github.com/facebook/react-native/commit/14c91cdf59949959dd2e39af4fed5bee01c3cba1) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add alt prop to Image component ([71fda5e0c2](https://github.com/facebook/react-native/commit/71fda5e0c2093380d08761c945f1e3029af6697f) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Include `this.state.bottom` when calculating new keyboard height to fix android keyboard switching ([f85e2ecc40](https://github.com/facebook/react-native/commit/f85e2ecc4079a99b59f706254c5671f186b9c6f6) by [@pfulop](https://github.com/pfulop))
- Implement custom Native State parsing in TypeScript ([bbb2fb212d](https://github.com/facebook/react-native/commit/bbb2fb212d112b9b96b9b47df5bc22074f24f7da) by [@cipolleschi](https://github.com/cipolleschi))
- Implement custom Native State parsing in Flow ([925b15351f](https://github.com/facebook/react-native/commit/925b15351f4a1c8a4e305b36fe7ab56e68a657bb) by [@cipolleschi](https://github.com/cipolleschi))
- Add string support to the transform property ([34db2d4e93](https://github.com/facebook/react-native/commit/34db2d4e939cab4c37e5a8e6ec95800cce227c98) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add `types` folder to house TypeScript types. ([6b2a511cbb](https://github.com/facebook/react-native/commit/6b2a511cbb1f244133624e37e7b3215d8fed33af))
- Add additional Systrace support ([9cb716ff76](https://github.com/facebook/react-native/commit/9cb716ff76e45583999b040be8a99b00f0e022e1) by [@christophpurrer](https://github.com/christophpurrer))
- Add space-separated string support for fontVariant ([09d420707f](https://github.com/facebook/react-native/commit/09d420707f586710bb0f00981aca989b00f8761a) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add aria-modal  prop to basic component ([095f19a681](https://github.com/facebook/react-native/commit/095f19a681e22bd5f9438758112cc9628499b631) by [@dakshbhardwaj](https://github.com/dakshbhardwaj))
- Added support for number values in fontWeight. ([f1c1f8116b](https://github.com/facebook/react-native/commit/f1c1f8116ba1cfa9d10c5b8c30b98b796047b9c2) by [@ankit-tailor](https://github.com/ankit-tailor))
- Add `aria-label` prop to `Button`, `View`, `Pressable` component ([720cdbc658](https://github.com/facebook/react-native/commit/720cdbc658aa0b513d106526eb81d749fa957c99) by [@Viraj-10](https://github.com/Viraj-10))
- Add `aria-valuemax`, `aria-valuemin`, `aria-valuenow`, `aria-valuetext` as alias prop to `TouchableOpacity`, `View`, `Pressable` `TouchableHighlight` `TouchableBounce` `TouchableWithoutFeedback` `TouchableOpacity` components ([e8739e962d](https://github.com/facebook/react-native/commit/e8739e962de3398bc7e42675b1d87ab35993f705) by [@dakshbhardwaj](https://github.com/dakshbhardwaj))
- Add support for objectFit style of Image. ([b2452ab216](https://github.com/facebook/react-native/commit/b2452ab216e28e004dc625dd8e1ad32351a79be9) by [@gedeagas](https://github.com/gedeagas))
- Added aria-live alias for accessibilityLiveRegion. ([7ea54a4087](https://github.com/facebook/react-native/commit/7ea54a408734ccde9ee01a12942bf5722e9cf7c1) by [@mayank-96](https://github.com/mayank-96))
- Add aria-disabled, aria-busy, aria-checked, aria-expanded and aria-selected prop to core components ([98d84e571d](https://github.com/facebook/react-native/commit/98d84e571df64b00e1ed3484923a1d8169dcfda1) by [@ankit-tailor](https://github.com/ankit-tailor))
- Add support for `userSelect` style ([fc42d5bbb9](https://github.com/facebook/react-native/commit/fc42d5bbb9906c37c2f62d26c46f6e3191cccd01) by [@dakshbhardwaj](https://github.com/dakshbhardwaj))
- Added a check to if `scrollEnabled` is not false, if so then fire the `VirtualizedList` error ([62f83a9fad](https://github.com/facebook/react-native/commit/62f83a9fad027ef0ed808f7e34973bb01cdf10e9))
- Add proper support for fractional scrollIndex in VirtualizedList ([f44dfef923](https://github.com/facebook/react-native/commit/f44dfef923b887308300cee9ae5a55269414c45a) by [@NickGerleman](https://github.com/NickGerleman))
- Add expanded support for CSS Colors ([ac1fe3b7eb](https://github.com/facebook/react-native/commit/ac1fe3b7eb8e16f5feddeeac846ff70080dc119e) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add aria-hidden prop to Pressable, View and Touchables components ([ebdb23c6e0](https://github.com/facebook/react-native/commit/ebdb23c6e060897112b060c25172135d50c78cd3) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added role alias for accessibilityRole. ([a50e6fb341](https://github.com/facebook/react-native/commit/a50e6fb341eacd955071e4a7c6d734e7d3c94cd7) by [@madhav23bansal](https://github.com/madhav23bansal))
- Added pointerEvents style equivalent to pointerEvents prop ([5c109b37a4](https://github.com/facebook/react-native/commit/5c109b37a42d16b35d8ddf2371d42d47f4d49fb2) by [@cyrus25](https://github.com/cyrus25))
- Added an overlay similar to Inspector.js that allows directly selecting elements on RN from React DevTools ([c52df02f84](https://github.com/facebook/react-native/commit/c52df02f84f123a524259eac554f4d2407f1904c) by [@tyao1](https://github.com/tyao1))
- Add tintColor prop to Image component ([7a6f0e44b2](https://github.com/facebook/react-native/commit/7a6f0e44b26b7a6eddb25d5e05948a1992a1629e) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Make babel-plugin-codegen work for TypeScript Spec files ([df0b6900ec](https://github.com/facebook/react-native/commit/df0b6900eca873417c867483b719e8e892a4b75d) by [@RSNara](https://github.com/RSNara))
- Add inputMode prop to TextInput component ([9fac88574e](https://github.com/facebook/react-native/commit/9fac88574e2f8c2f46b7f081273845f833fe1b75) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- React-native-codegen: Add Enum Type support for C++ TurboModules ([b444f0e44e](https://github.com/facebook/react-native/commit/b444f0e44e0d8670139acea5f14c2de32c5e2ddc) by [@christophpurrer](https://github.com/christophpurrer))
- Add enterKeyHint prop to TextInput component ([8c882b4f3d](https://github.com/facebook/react-native/commit/8c882b4f3d361be715c8ec2793c545c687711b5e) by [@dakshbhardwaj](https://github.com/dakshbhardwaj))
- React-native-codegen: Add Union Type support for C++ TurboModules ([355feafff6](https://github.com/facebook/react-native/commit/355feafff6129129533c939e707fadb5fc747c08) by [@christophpurrer](https://github.com/christophpurrer))
- Add readOnly prop to TextInput component ([de75a7a22e](https://github.com/facebook/react-native/commit/de75a7a22eebbe6b7106377bdd697a2d779b91b0) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added ability to construct ArrayBuffers from existing memory buffers. ([3bae268782](https://github.com/facebook/react-native/commit/3bae268782c318b7f8bd6442682d3d683696eedf) by [@neildhar](https://github.com/neildhar))
- Add ability to store and retrieve a list of MapBuffer ([fc065151ce](https://github.com/facebook/react-native/commit/fc065151ce3b2aa53d9f9b78a950d1c3dbce3c75) by [@sshic](https://github.com/sshic))
- SyncCallback/AsyncCallback/AsyncPromise bridging types in C++ now allow wrapping JSI types. ([610bb7f688](https://github.com/facebook/react-native/commit/610bb7f68844df150503623297304dbb67984bfe) by [@nlutsenko](https://github.com/nlutsenko))
- Add types for onFocusCapture/onBlurCapture ([aabb5df7ec](https://github.com/facebook/react-native/commit/aabb5df7ec884b7e08b8b8bef658727653406fd9) by [@NickGerleman](https://github.com/NickGerleman))
- Add `returnKeyAction` prop to `TextInput` component and remove usages of `blurOnSubmit` in native code and convert `blurOnSubmit` to `returnKeyAction` in the JavaScript conversion layer ([1e3cb91707](https://github.com/facebook/react-native/commit/1e3cb9170794afa03a3b4b15f75b711dace7a774))
- Re-add support for using Yoga without exceptions ([793ebf6812](https://github.com/facebook/react-native/commit/793ebf6812f41ad9b07fe04d43a8509a55ebe45e) by [@Yannic](https://github.com/Yannic))

#### Android specific

- Added Flavor Support to React Native Gradle Plugin (RNGP) ([8ad86c70b6](https://github.com/facebook/react-native/commit/8ad86c70b6341f2e8bd40f5ba86f1a0d451008b0) by [@cortinico](https://github.com/cortinico))
- Add ComponentWithState in Android ([b24f60f729](https://github.com/facebook/react-native/commit/b24f60f729bb3d4804f123eb38ed512f2bfc8cf9) by [@cipolleschi](https://github.com/cipolleschi))
- Add support for verticalAlign style ([32b6f319ba](https://github.com/facebook/react-native/commit/32b6f319bafbd6bc2fdab458d38f2d83b0514ad2) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add tabIndex prop to View component ([621f4cf3b1](https://github.com/facebook/react-native/commit/621f4cf3b12979b62d2e1d49d63eaf85e0707026) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Add rows prop to TextInput component ([49c9ccd3f8](https://github.com/facebook/react-native/commit/49c9ccd3f8150c5478b502cd5ee158f44750a549) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Stop special-casing Android 11+ from large form-factor `keyboardShouldPersistTaps` behavior ([ef77a4218d](https://github.com/facebook/react-native/commit/ef77a4218db5bafd45ac844cd06e33e229ea534a) by [@NickGerleman](https://github.com/NickGerleman))
- Provide defaults for TurboModuleManagerDelegate and JSIModulePackage ([9a2eb9089f](https://github.com/facebook/react-native/commit/9a2eb9089f0854502b4b03cf4f74426c23b3f4e8) by [@cortinico](https://github.com/cortinico))
- Expose UI_MODE_TYPE_VR_HEADSET in PlatformConstants ([77c256ca91](https://github.com/facebook/react-native/commit/77c256ca9115b8fd23a0e3fa43e12033cac3d634) by [@NickGerleman](https://github.com/NickGerleman))
- Expose `globalEvalWithSourceUrl` in production builds. ([333583bfbe](https://github.com/facebook/react-native/commit/333583bfbe7e3fbf6a6ebd0645019313ade86bea) by [@EvanBacon](https://github.com/EvanBacon))
- Accessibility announcement for list and grid in FlatList ([463af23753](https://github.com/facebook/react-native/commit/463af237539b98289c88e5b491c85cbf53bcaf0c) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Improve OSS systrace ([ccbfdd7167](https://github.com/facebook/react-native/commit/ccbfdd71670a958916c15e8e8e3c5fb94becbe22) by [@janicduplessis](https://github.com/janicduplessis))
- Un-deprecate DisplayMetrics.getWindowDisplayMetrics() method ([4cbd263173](https://github.com/facebook/react-native/commit/4cbd263173b992c0a0dc7c640e39794f39ce1b34) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- Bring back JSIDynamic and JSI ([3d7b53d456](https://github.com/facebook/react-native/commit/3d7b53d456f909029d4d470342419c191565b3e1) by [@cipolleschi](https://github.com/cipolleschi))
- Add Dynamic Type support for iOS (Paper and Fabric) ([11c8bf3137](https://github.com/facebook/react-native/commit/11c8bf313717a8c46165d48caba5e70b9f160d05))
- Add support for parsing files w/ `:` in filename ([714b22bb43](https://github.com/facebook/react-native/commit/714b22bb431a7384a6e06141d5b3f367de2f75cd) by [@shwanton](https://github.com/shwanton))
- Download Hermes from Maven while for -stables ([44e8462a03](https://github.com/facebook/react-native/commit/44e8462a036b8217344f56310719b13d4a551973) by [@cipolleschi](https://github.com/cipolleschi))
- `anchor` option support for `Share` ([aeab38357f](https://github.com/facebook/react-native/commit/aeab38357ffdb0ca266da00748ae2651ca812a1a) by [@zhumingcheng697](https://github.com/zhumingcheng697))
- Line break strategy for Text and TextInput components ([048194849b](https://github.com/facebook/react-native/commit/048194849bda980eecf7bb006ca4e71e2d60ff4c) by [@bang9](https://github.com/bang9))
- Add more extension points for RCTAppDelegate ([dd607a8f2d](https://github.com/facebook/react-native/commit/dd607a8f2d337c01ebe0ff114263fe95b4498364) by [@cipolleschi](https://github.com/cipolleschi))
- Introduce sample component which work with the native state. ([1a9cceb20b](https://github.com/facebook/react-native/commit/1a9cceb20b25416eeb90b68c85daa6608cf5deef) by [@cipolleschi](https://github.com/cipolleschi))
- Add new APIs to `react_native_pods.rb` to simplify app migration ([34fafb2b88](https://github.com/facebook/react-native/commit/34fafb2b881751cdd998d7d5ef486d536607c9ce) by [@cipolleschi](https://github.com/cipolleschi))
- Test iOS template with both architectures and configurations ([4352459781](https://github.com/facebook/react-native/commit/435245978122d34a78014600562517c3bf96f92e) by [@cipolleschi](https://github.com/cipolleschi))
- Add new fontVariant values: stylistic-one(ss01) -> stylistic-twenty(ss20) ([163636db75](https://github.com/facebook/react-native/commit/163636db752b9a5544de54b256e264d3877bb6f7))
- Added the RCTAppDelegate library ([7cc2d1a249](https://github.com/facebook/react-native/commit/7cc2d1a24983d00282fcc694986faad88991845e) by [@cipolleschi](https://github.com/cipolleschi))
- Support setting an Alert button as "preferred", to emphasize it without needing to set it as a "cancel" button. ([000bbe8013](https://github.com/facebook/react-native/commit/000bbe8013ec72d20f969c5c3a1f655b3f20c6ba) by [@robbie-c](https://github.com/robbie-c))
- Added `borderCurve` style prop for smooth border radius (squircle effect) ([8993ffc82e](https://github.com/facebook/react-native/commit/8993ffc82e8d4010d82dcb1d69c33a609bb2771a) by [@eric-edouard](https://github.com/eric-edouard))
- Automatically detect when use frameworks is used ([f7b35c0d43](https://github.com/facebook/react-native/commit/f7b35c0d434a5e98228311722926819ffe80c4b6) by [@cipolleschi](https://github.com/cipolleschi))
- Add compiler flag for the new Arch when enabled. ([5b32348add](https://github.com/facebook/react-native/commit/5b32348add5dbb8e348c4e37d12e7ce01496d87e) by [@cipolleschi](https://github.com/cipolleschi))
- Improve Codegen Cleanup ([aaa795b](https://github.com/facebook/react-native/commit/aaa795bcaec5265a9b0404333934d1115d148db8) by [@cipolleschi](https://github.com/cipolleschi))

### Changed

- Bump CLI to 10.0.0 and Metro to 0.73.5 ([e1bca8f98c](https://github.com/facebook/react-native/commit/e1bca8f98c9d2f86cbd0de61e45728c59d548ba3) by [@thymikee](https://github.com/thymikee))
- Upgrade to `deprecated-react-native-prop-types` 3.0.1: [changelog](https://github.com/facebook/react-native-deprecated-modules/blob/main/deprecated-react-native-prop-types/CHANGELOG.md) ([3e91415696](https://github.com/facebook/react-native/commit/3e91415696a77e5106cc9cd58077632fdf534b37) by [@yungsters](https://github.com/yungsters))
- Upgrade Jest in React Native to ^29.2.1 ([45db65be7e](https://github.com/facebook/react-native/commit/45db65be7e8745a731093f43030965afa7581751) by [@robhogan](https://github.com/robhogan)), ([8f337538ae](https://github.com/facebook/react-native/commit/8f337538ae86b43f524044db3a7363c12e93d7d9) by [@kelset](https://github.com/kelset))
- Bump `@react-native/normalize-color` to 2.1.0, `@react-native-community/eslint-plugin` to 1.3.0, `@react-native/babel-plugin-codegen` to 0.71.1, `@react-native-community/eslint-config` to 3.2.0 and `@react-native-community/eslint-plugin-specs` to 1.3.0, ([8183aac0b1](https://github.com/facebook/react-native/commit/8183aac0b1f55db8fd5d45d4fc6a8e596e3db32b))
- Upgraded react-devtools-core dependency to 4.26.1 ([48263b8daf](https://github.com/facebook/react-native/commit/48263b8daf02fdea6eafa95e7fa80f161474fa54))
- Bump `react-native-codegen` to `^0.71.3` and `react-native-gradle-plugin` to `0.71.12"` ([a7792da695](https://github.com/facebook/react-native/commit/a7792da695f77be8d46b5e84ab697631b884db91) by [@cipolleschi](https://github.com/cipolleschi))
- Bump Hermes for 0.71 version ([4e5fc68672](https://github.com/facebook/react-native/commit/4e5fc68672b469f7a3548822d6fca0b7b3f2d51e) by [@kelset](https://github.com/kelset))
- Simplify Template ESLint Configuration ([68d6214a18](https://github.com/facebook/react-native/commit/68d6214a18b4d8272abddc2303b6b407b0defd7b) by [@NickGerleman](https://github.com/NickGerleman))
- Use `'react-native'` export conditions in Jest environment ([0376aa4856](https://github.com/facebook/react-native/commit/0376aa4856fb5141e89994873e4d80a1f597e0cb) by [@SimenB](https://github.com/SimenB))
- Move JSCRuntime into a separate pod/prefab ([f3bf4d02ab](https://github.com/facebook/react-native/commit/f3bf4d02abf8d22bada8bfcee7ccfbd3bb524750) by [@cipolleschi](https://github.com/cipolleschi))
- Improve version checks ([f12b12c999](https://github.com/facebook/react-native/commit/f12b12c999fb36e66bcef242f7cf1f0751afedcd) by [@cipolleschi](https://github.com/cipolleschi))
- Read `.ruby-version` file in `Gemfile` ([cb7f1b1f0b](https://github.com/facebook/react-native/commit/cb7f1b1f0b9d50ae8a923043d0ed77b2171bf59f) by [@dcangulo](https://github.com/dcangulo))
- Remove React Native version from Hermes tarball name ([e36c492ace](https://github.com/facebook/react-native/commit/e36c492ace5d3171dd64186b5f2024fbae37df36) by [@cipolleschi](https://github.com/cipolleschi))
- RNTester: Migrate Dimensions to hooks ([745e26288c](https://github.com/facebook/react-native/commit/745e26288c656237b0f86f6cfc55643eeb0817ca) by [@Marcoo09](https://github.com/Marcoo09))
- Do not filter errors/warnings from console ([fa2842d113](https://github.com/facebook/react-native/commit/fa2842d113f04c8d33d2f71f43d4232e470b77ac) by [@rickhanlonii](https://github.com/rickhanlonii))
- RNTester: Migrate ActivityIndicator to hooks ([c868d5b26c](https://github.com/facebook/react-native/commit/c868d5b26c5d680603d3f653de9277124c1b539b) by [@Marcoo09](https://github.com/Marcoo09))
- Refactor codegen: Dispatch props and events from a central place. ([affcfa7bde](https://github.com/facebook/react-native/commit/affcfa7bde9740c34cc025741d1e63423183e500) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Add "EarlyJsError: " as prefix of early js error's message ([be6f65660f](https://github.com/facebook/react-native/commit/be6f65660f9c5b56795079b00f6d7eecade5a22f))
- Move Jest config to use a custom react-native Jest env ([cb2dcd327c](https://github.com/facebook/react-native/commit/cb2dcd327c62edae58bb8571273add4c286fd2a8) by [@kelset](https://github.com/kelset))
- Add Metro health check files to the template's `.gitignore` ([19715cf4fb](https://github.com/facebook/react-native/commit/19715cf4fb11640d07b973a3eb0e918ee27691ac) by [@motiz88](https://github.com/motiz88))
- Ship VirtualizedList_EXPERIMENTAL ([971599317b](https://github.com/facebook/react-native/commit/971599317b7bdf1152157206f9503a23ac8c4162) by [@NickGerleman](https://github.com/NickGerleman))
- Typescript: update incorrect `SwitchChangeEvent` type ([5dd2f2e4b7](https://github.com/facebook/react-native/commit/5dd2f2e4b7669397f8bfa9b3845afee7e4e47626) by [@retyui](https://github.com/retyui))
- Make `yarn` and `yarn jest react-native-codegen` works on Windows with git ([c4f9556f7e](https://github.com/facebook/react-native/commit/c4f9556f7e98454e2061ca7e121099ebbbddd4c9) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Refactor in turbo module TypeScript codegen: process `(T)`, `T|U`, `T|undefined` and related stuff in a central place ([00b795642a](https://github.com/facebook/react-native/commit/00b795642a6562fb52d6df12e367b84674994623) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Move and rename `hermes-inspector-msggen` to `react-native/hermes-inspector-msggen` ([530dae8a45](https://github.com/facebook/react-native/commit/530dae8a45a600ef67d01e76edd68824c4e610dd) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Fix interface support in turbo module TypeScript codegen (component only) ([8dc6bec719](https://github.com/facebook/react-native/commit/8dc6bec719eefcb289bb0306c8686afd34835938) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Place TS Declarations Alongside Source Files ([8cdc9e7f04](https://github.com/facebook/react-native/commit/8cdc9e7f04e2dd3026d15dcd5765952bfb2c5c08) by [@NickGerleman](https://github.com/NickGerleman))
- Handle (T) and undefined properly in turbo module component codegen ([205cc9bc3b](https://github.com/facebook/react-native/commit/205cc9bc3b56d21a6ee21a97c1d171d22b6c79c3) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Update `Clipboard` mock path ([2aba3522ab](https://github.com/facebook/react-native/commit/2aba3522ab7dfe113ec26131b747f7f6f0486194) by [@adrianha](https://github.com/adrianha))
- Fix ImageLoader.getSize jest mock ([7be829f2c9](https://github.com/facebook/react-native/commit/7be829f2c9756f8973401644579dd2910b5d3209) by [@elliottkember](https://github.com/elliottkember))
- Correct execution context ID in Debugger.scriptParsed event. ([545366aea3](https://github.com/facebook/react-native/commit/545366aea30c3db6cb28c77ce85208e9973cc1fb) by [@aeulitz](https://github.com/aeulitz))
- Don't polyfill Promise in Jest setup ([f1fdc8b9b6](https://github.com/facebook/react-native/commit/f1fdc8b9b636e010ae5d5e737fc81a8da8f536d4) by [@robhogan](https://github.com/robhogan))
- Codegen: support TypeScript type `(T)` for turbo module codegen (module only) ([624bdc7ec6](https://github.com/facebook/react-native/commit/624bdc7ec63fc10915236653185bb1a705c8460f) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Unify TextInput autoComplete and textContentType props ([73abcba40f](https://github.com/facebook/react-native/commit/73abcba40f305634efaafea8969cdfeb4982df0e) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Added `crossOrigin`, `referrerPolicy`, `width`, `height` and `srcSet` props to Image Component. ([47a05bc26a](https://github.com/facebook/react-native/commit/47a05bc26ab76add640183c1d9d8cbba39d7d0d2) by [@dhruvtailor7](https://github.com/dhruvtailor7))
- Copied and refactored the current devtools highlighting code from Inspector into its own module and add to the top level `AppContainer`. The effect is that the highlight stills shows without Inspector opened. ([a63204800a](https://github.com/facebook/react-native/commit/a63204800a1aa23eb050b8f276be70f75057d1da) by [@tyao1](https://github.com/tyao1))
- Minor change to PropTypes error message. ([7783f88d71](https://github.com/facebook/react-native/commit/7783f88d7160e9474164545309590c7f95f7f17f) by [@yungsters](https://github.com/yungsters))
- Set back the `DANGER_GITHUB_API_TOKEN`. ([9344c7aa5a](https://github.com/facebook/react-native/commit/9344c7aa5a7845b250834c4c6a7d8d733be2d143) by [@cipolleschi](https://github.com/cipolleschi))
- Run ESLint in CI ([1bba59023d](https://github.com/facebook/react-native/commit/1bba59023d4976cb349bb58e66ae5b5b5a5288ed) by [@cipolleschi](https://github.com/cipolleschi))
- `eslint-plugin-specs` package has prepack hook that changes `PACKAGE_USAGE` variable of `react-native-modules.js` to `true`. ([ee9c1a5260](https://github.com/facebook/react-native/commit/ee9c1a5260b6a50c952c415c39c9af45ba49f01e) by [@dmytrorykun](https://github.com/dmytrorykun))
- Attach the `.hermes-cache-key-file` to the workspace to avoid race conditions for new PR landing on Hermes and changing the head commit between the time Hermes is built and the time it has to be consumed. ([ccdf9ac985](https://github.com/facebook/react-native/commit/ccdf9ac9853601a81ff21f8f42f5bd866dd4de75) by [@cipolleschi](https://github.com/cipolleschi))
- Build hermes when in CI and not when there is a tarball ([4b51207735](https://github.com/facebook/react-native/commit/4b512077354eb4702ce144e9958d7513c1607275) by [@cipolleschi](https://github.com/cipolleschi))
- Make sure we can build Hermes from source when PR are opened agains -stable ([361d939afd](https://github.com/facebook/react-native/commit/361d939afd0b43b2e9e6ea0d4c619482e91e82e3) by [@cipolleschi](https://github.com/cipolleschi))
- Update ktfmt component on FBS:master ([47548c1149](https://github.com/facebook/react-native/commit/47548c114993433ba03f32398876c1e11aeac0d3) by [@cgrushko](https://github.com/cgrushko))
- Add explicit React useState annotations in xplat/js ([ff14ff3d92](https://github.com/facebook/react-native/commit/ff14ff3d92b2c32f851ee8d25d8e8ea6dfe2ec9e) by [@pieterv](https://github.com/pieterv))
- Improve sample app ([03cb5aca3f](https://github.com/facebook/react-native/commit/03cb5aca3f5b8594287608265d4bde7104f07b87) by [@pieterv](https://github.com/pieterv))
- Mirror fbcode directory structure for container targets ([10ea6fb9a3](https://github.com/facebook/react-native/commit/10ea6fb9a3f408bc23881235427427c3b9e97149))
- Update ktfmt component on FBS:master ([0538f45e45](https://github.com/facebook/react-native/commit/0538f45e45acf494fdafda0757c090a60e730746) by [@cgrushko](https://github.com/cgrushko))
- Rewrite CompactValue to avoid undefined behavior from the use of a union for type-punning ([e7a8d21df5](https://github.com/facebook/react-native/commit/e7a8d21df563e48e1812caace7fbe1f7cbc1c015) by [@htpiv](https://github.com/htpiv))

#### Android specific

- Bump AGP to 7.3.1 ([1f42ff0815](https://github.com/facebook/react-native/commit/1f42ff0815dbf9436904c4a5b1e6975854654172) by [@cortinico](https://github.com/cortinico))
- Bump Android compile and target SDK to 33 ([394486eec5](https://github.com/facebook/react-native/commit/394486eec584a37920dad447a6c1d0ae24d225fc) by [@makovkastar](https://github.com/makovkastar))
- Bump Soloader to 0.10.4 ([1237952d07](https://github.com/facebook/react-native/commit/1237952d070bfe28ff2c94cd9bf8ea19e6cdd395) by [@simpleton](https://github.com/simpleton))
- Rename `POST_NOTIFICATION` to `POST_NOTIFICATIONS` ([910a750fbc](https://github.com/facebook/react-native/commit/910a750fbce42808350312dee1f5671e5d3e05b1) by [@dcangulo](https://github.com/dcangulo))
- Void the Maven coordinates for react-native and hermes-engine ([55b1670aa6](https://github.com/facebook/react-native/commit/55b1670aa6c34f31491ffeba05997f131aae31e7) by [@cortinico](https://github.com/cortinico))
- Provide easy registration of C++ TurboModules in rn-tester Android ([9cb02613e6](https://github.com/facebook/react-native/commit/9cb02613e6c2dfa7847b2f6356d91efe9a4a02f1) by [@christophpurrer](https://github.com/christophpurrer))
- Add feature flag enableAtomicRegisterSegment ([f207cfddf3](https://github.com/facebook/react-native/commit/f207cfddf37c01b5ff2c2f53b4d44a4cc7ad2484))
- Update the template to load the correct JS engine at runtime ([2097278d2a](https://github.com/facebook/react-native/commit/2097278d2a91218274cb661ebf37cc8dbb78bf25) by [@cortinico](https://github.com/cortinico))
- Do not import/use the deprecated ReactFlipperPlugin ([07252b81f6](https://github.com/facebook/react-native/commit/07252b81f6d13729dc08ac1444bad6581d852ddd) by [@cortinico](https://github.com/cortinico))
- Update the template to use RNGP ([c96c76eb91](https://github.com/facebook/react-native/commit/c96c76eb9107ea92ff6dc2dcec114f3bd57102bd) by [@cortinico](https://github.com/cortinico))
- Let RNGP set buildConfigFields for New Architecture and Hermes ([7d2f48c97d](https://github.com/facebook/react-native/commit/7d2f48c97d0dce602fc7fa06546060f4aa3aef17) by [@cortinico](https://github.com/cortinico))
- Hide the C++/Cmake configuration from user space inside the framework ([c9e6a6056d](https://github.com/facebook/react-native/commit/c9e6a6056d9ee24c70826e598ba7219da25ae10d) by [@cortinico](https://github.com/cortinico))
- Encapsulate the prefab configuration for consumers ([b39e77b3d7](https://github.com/facebook/react-native/commit/b39e77b3d725d7fa88abfb0a50780677d7ef7050) by [@cortinico](https://github.com/cortinico))
- Cleanup the Android template after prefab support ([0b4417b43f](https://github.com/facebook/react-native/commit/0b4417b43f66e3de91e9d54099440be14d97434b) by [@cortinico](https://github.com/cortinico))
- Simplify Accessibility Heading role implementation. ([353b1b0f8b](https://github.com/facebook/react-native/commit/353b1b0f8b1ca67efb553738f601552bd9ed897f) by [@blavalla](https://github.com/blavalla))
- Update the OnLoad.cpp to use the facebook::react namespace ([aba82a503d](https://github.com/facebook/react-native/commit/aba82a503d39e7a341630aabdcf02762e392dbea) by [@cortinico](https://github.com/cortinico))
- Remove internal buck rule arg for robolectric tests ([59dc7f1b20](https://github.com/facebook/react-native/commit/59dc7f1b2094063debd4d14957b48fd6ed0e9511))
- Further simplify the New App Template by don't requiring the dynamic library name ([59ae0487ce](https://github.com/facebook/react-native/commit/59ae0487ce05333ba5df6d2244f7eca7ecf82625) by [@cortinico](https://github.com/cortinico))
- Update the template to Reduce the amount of C++ code in user space for New Architecture ([b0aba1b6fa](https://github.com/facebook/react-native/commit/b0aba1b6fa7c3b0d43548371d8b9707d6a7da3b6) by [@cortinico](https://github.com/cortinico))
- Reduce the amount of C++ code in user space for New Architecture ([e89bd4a375](https://github.com/facebook/react-native/commit/e89bd4a3751f71e9d2ede49ae91d3bb9221a7c60) by [@cortinico](https://github.com/cortinico))
- Move setRootViewTag to earlier when RootView is created ([4d642a2250](https://github.com/facebook/react-native/commit/4d642a2250251d90d4afec8e81bf19848217c3f6) by [@sshic](https://github.com/sshic))
- Replace Folly with MapBuffer for passing js error data ([e874e5facb](https://github.com/facebook/react-native/commit/e874e5facb60ff7057c0c95ca53948540ddb7137) by [@sshic](https://github.com/sshic))
- Simplify the template for New Architecture using the .defaults package ([33bd2f6eae](https://github.com/facebook/react-native/commit/33bd2f6eaed3c583f5df852535a8789f8caadbaa) by [@cortinico](https://github.com/cortinico))
- Enable -Wpedantic in OSS Android Targets ([06b55a3d04](https://github.com/facebook/react-native/commit/06b55a3d044a9fbbcd97df6e6531cad98dd34ca1) by [@NickGerleman](https://github.com/NickGerleman))
- Do not load Flipper via reflection ([9214da1238](https://github.com/facebook/react-native/commit/9214da12385fd88264ca5de3e5fdc78559ec3080) by [@cortinico](https://github.com/cortinico))
- Collapse catch blocks in template ([a379879adf](https://github.com/facebook/react-native/commit/a379879adf99800d22da8bc10c3a22f06cb02e20) by [@danilobuerger](https://github.com/danilobuerger))
- Bump git checkout cache key (fourth time) ([41a80f2ee2](https://github.com/facebook/react-native/commit/41a80f2ee20f6e2e7d754d6cd3d47d4cd558c49a) by [@kelset](https://github.com/kelset))
- Replace Toast with Log.w on ReactImageView when null URL specified ([30411ae1a4](https://github.com/facebook/react-native/commit/30411ae1a42e46d0e5a2da494a39ed2767ba8808))
- Views with overflow: hidden and borderRadius: >0 now render anti-aliased borders. ([7708cdccef](https://github.com/facebook/react-native/commit/7708cdcceff9a268ae19c196c2b8baeadf4d9d83))
- Expose react_render_animations via prefab. ([98ad3996c8](https://github.com/facebook/react-native/commit/98ad3996c8b144bf80e1d3f9e6a79ee11e5a2142) by [@cortinico](https://github.com/cortinico))
- Remove unnecessary repositories{} block from top level build.gradle ([f65dfa86ab](https://github.com/facebook/react-native/commit/f65dfa86abcba829c0d65c11ef5c98f1033e2905) by [@cortinico](https://github.com/cortinico))
- Fix prefab prefix for fabricjni ([621d901e10](https://github.com/facebook/react-native/commit/621d901e105d6160a297f8e371889ba2fb631ce2) by [@cortinico](https://github.com/cortinico))
- De-bump AGP to 7.3.1 and do not use addGeneratedSourceDirectory ([caa79b7c01](https://github.com/facebook/react-native/commit/caa79b7c017accd91c0e852bd701ef3f21ac0e6d) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Fix imports in React Bridging for Old Arch and frameworks ([c5de1eb1ba](https://github.com/facebook/react-native/commit/c5de1eb1bac0a4e653688d86654be131984d0e2f) by [@cipolleschi](https://github.com/cipolleschi))
- Abort pod install if bad HERMES_ENGINE_TARBALL_PATH is set. ([27e7295ca7](https://github.com/facebook/react-native/commit/27e7295ca76111c00bcf83327b0a151f21c23743))
- Hermes is integrated into Xcode build. ([6b8e13f53c](https://github.com/facebook/react-native/commit/6b8e13f53c5fc9c5e794bb7491648e4b25ad5811))
- Display a RedBox with the JS stack (instead of native stack) when an unhandled JS exceptions occurs ([ff398e4e26](https://github.com/facebook/react-native/commit/ff398e4e2632ece8a6f22d744e96e489ca3b9d92) by [@p-sun](https://github.com/p-sun))
- Resolve JSI ODR violation, make hermes-engine the JSI provider when Hermes is enabled ([a68c418082](https://github.com/facebook/react-native/commit/a68c4180822e13ae6eecf86601864d1e9f2825a9) by [@hramos](https://github.com/hramos))
- The JSC Runtime is now provided by the React-jsc Pod instead of React-jsi. Libraries that declared a dependency on React-jsi in order to specifically create a JSC runtime (`makeJSCRuntime()`) will need to add React-jsc to their dependencies. ([6b129d81ed](https://github.com/facebook/react-native/commit/6b129d81ed8cab301775d2a04971e255df9290de) by [@hramos](https://github.com/hramos))
- Moved JSIDynamic out of React-jsi and into React-jsidynamic ([0db5178688](https://github.com/facebook/react-native/commit/0db5178688d838689ece5cc246e4ec1ec7f2e607) by [@hramos](https://github.com/hramos))
- Do not load Hermes inspector in release builds ([2a21d5a28e](https://github.com/facebook/react-native/commit/2a21d5a28ea0ee0a1a332ce26b50b7fd61ac89a7) by [@hramos](https://github.com/hramos))
- Remove debugger from Hermes when building for release ([2fc44ac8e1](https://github.com/facebook/react-native/commit/2fc44ac8e144b7d93e1ccc95163dd33c94d2a197) by [@hramos](https://github.com/hramos))
- Use debug Hermes builds by default ([ce4aa93173](https://github.com/facebook/react-native/commit/ce4aa9317370cbbf4e8c80c0a8db3db5a80ef70b) by [@hramos](https://github.com/hramos))
- Add function to simplify podspecs ([82e9c6ad61](https://github.com/facebook/react-native/commit/82e9c6ad611f1fb816de056ff031716f8cb24b4e) by [@cipolleschi](https://github.com/cipolleschi))
- Enable pedantic warnings in C++ podspecs ([545c82b490](https://github.com/facebook/react-native/commit/545c82b490f1389056cf2f945a547a22b1274f60) by [@NickGerleman](https://github.com/NickGerleman))
- Cleanup codegen build folder before installing the pods ([0e316ec671](https://github.com/facebook/react-native/commit/0e316ec671617f5e7c1985b4b05cd0d45bcea403) by [@cipolleschi](https://github.com/cipolleschi))
- Properly support both libraries and use_frameworks ([c6fa633597](https://github.com/facebook/react-native/commit/c6fa6335971459158efc8bf094822547a4333235) by [@cipolleschi](https://github.com/cipolleschi))
- Add link group label to talkios deps ([b33961d7a0](https://github.com/facebook/react-native/commit/b33961d7a0fbf5783513a81b217ec1a90700d817))
- Add link group label to fbios deps ([065db683a2](https://github.com/facebook/react-native/commit/065db683a20b273ea3656dead29845327637669a))
- Use an SDKRoot based Foundation framework ([ee4ce2df2f](https://github.com/facebook/react-native/commit/ee4ce2df2f57b07e523bfb4d4728543d73b5a009) by [@chatura-atapattu](https://github.com/chatura-atapattu))

### Removed

- remove AsyncStorage from JS ([20eeb1bfe3](https://github.com/facebook/react-native/commit/20eeb1bfe30eacf26abd185b6fa062b708deaf8a) by [@hoxyq](https://github.com/hoxyq))
- Remove VirtualizedList `listKey` prop ([010da67bef](https://github.com/facebook/react-native/commit/010da67bef0c22418d0d41b7c2eae664672a4a27) by [@NickGerleman](https://github.com/NickGerleman))
- Remove MaskedViewIOS ([a67360b0f3](https://github.com/facebook/react-native/commit/a67360b0f3aec0e679be32715b02467429002c31) by [@sokolnickim](https://github.com/sokolnickim))
- Back out parsing and generation of Custom Native State from Codegen ([62da9b8ce2](https://github.com/facebook/react-native/commit/62da9b8ce2097c9037ee2c766c9d4cb64eae2930) by [@cipolleschi](https://github.com/cipolleschi))
- Back out components with native state in RNTester ([aace6626c1](https://github.com/facebook/react-native/commit/aace6626c10916c022c9960ac61d54b780edd230) by [@cipolleschi](https://github.com/cipolleschi))
- `react-native/eslint-plugin` no longer provides the `error-subclass-name` rule. ([4f83498462](https://github.com/facebook/react-native/commit/4f83498462133b4c5b9e89836c52482ef7098427) by [@yungsters](https://github.com/yungsters))
- `react-native/eslint-plugin` no longer provides the `no-haste-imports` rule. ([1ec69b1823](https://github.com/facebook/react-native/commit/1ec69b1823c3fd0cc2a9209032e4e3e8e8166030) by [@yungsters](https://github.com/yungsters))
- Remove listKey from TS typings ([773615bc9d](https://github.com/facebook/react-native/commit/773615bc9d8e43b569513a3233259caa965a4c0b) by [@NickGerleman](https://github.com/NickGerleman))
- Remove usages of listKey ([bc5cb7cd79](https://github.com/facebook/react-native/commit/bc5cb7cd7933da707c02ff0dd993c607ba7d40b3) by [@NickGerleman](https://github.com/NickGerleman))
- Remove unneed/obsolete job ([8e3b62019e](https://github.com/facebook/react-native/commit/8e3b62019ee412399ece0fbda91e58bb395f7e98) by [@kelset](https://github.com/kelset))
- Remove flexlayout from react-native ([bf05df1723](https://github.com/facebook/react-native/commit/bf05df17230e1063ff29d5ae5d86feac85e122b3) by [@NickGerleman](https://github.com/NickGerleman))
- Remove remaining TV_OS fragments ([089684ee56](https://github.com/facebook/react-native/commit/089684ee5604a6a2a15a4fc03fe63c73a5de9fd0) by [@christophpurrer](https://github.com/christophpurrer))

#### Android specific

- Removed `AsyncStorage` module ([5738fe6426](https://github.com/facebook/react-native/commit/5738fe642601237e16417105d6727f777e73aae3) by [@hoxyq](https://github.com/hoxyq))
- Deprecate react.gradle ([af6aafff90](https://github.com/facebook/react-native/commit/af6aafff90c4d40abfe160c4cfc8e1ae8fa0d956) by [@cortinico](https://github.com/cortinico))
- Removed deprecated UIImplementationProvider ([e7d7563195](https://github.com/facebook/react-native/commit/e7d75631959f1ce3f50a44f13056eacaf82378ff) by [@javache](https://github.com/javache))
- Cleanup Buck usages from New App Template ([32fc551c55](https://github.com/facebook/react-native/commit/32fc551c55a203bc4a511c12ae362632acb3b286) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Removed `AsyncStorage` module ([4de2aaba50](https://github.com/facebook/react-native/commit/4de2aaba502b49f8360ee5622d6ee8a6d9a93a32) by [@hoxyq](https://github.com/hoxyq))
- Remove `HERMES_BUILD_FROM_SOURCE` flag ([138af74e3f](https://github.com/facebook/react-native/commit/138af74e3f2aa429eedc8881c8feb6d4a7b5c253) by [@cipolleschi](https://github.com/cipolleschi))
- Removed `ImagePickerIOS` module native sources ([d03a29ce5f](https://github.com/facebook/react-native/commit/d03a29ce5f7a40b4b0d172b7f2eb957143684818) by [@hoxyq](https://github.com/hoxyq))

### Fixed

- Fix TS Type for measureLayout optional parameter ([5928144302](https://github.com/facebook/react-native/commit/59281443021e271c9112d60a2c2276fe10a67e37) by [@NickGerleman](https://github.com/NickGerleman))
- Allow GNU coreutils to be used to build projects ([f5e5274e6a](https://github.com/facebook/react-native/commit/f5e5274e6ad1330ad8d005f08d6f1ec678ea9ffe) by [@shreeve](https://github.com/shreeve))
- Reference App.tsx vs App.js in text of new typescript template ([81e441ae8a](https://github.com/facebook/react-native/commit/81e441ae8a7daed79d8804c72e1991b29f670411) by [@mikehardy](https://github.com/mikehardy))
- Fix incorrect height when gap causes main axis to overflow and cross-axis is stretched ([1aa157b196](https://github.com/facebook/react-native/commit/1aa157b196b85d81e2e2115815c073fe8c0730c4) by [@NickGerleman](https://github.com/NickGerleman))
- Codegen for C++ TurboModules of optional method arguments was incorrect ([e81c98c842](https://github.com/facebook/react-native/commit/e81c98c842380d8b72c1dc8d4a6e64f760e2a58c) by [@javache](https://github.com/javache))
- Fix incorrect height when gap causes main axis to overflow and cross-axis is stretched ([1aa157b196](https://github.com/facebook/react-native/commit/1aa157b196b85d81e2e2115815c073fe8c0730c4) by [@NickGerleman](https://github.com/NickGerleman))
- Fixup TS Organization ([5d26ceaa23](https://github.com/facebook/react-native/commit/5d26ceaa236684c7bd6d0d9001ff2c8908d88c29) by [@NickGerleman](https://github.com/NickGerleman))
- Fixed typo syncronization -> synchronization ([ad5e3f6b9a](https://github.com/facebook/react-native/commit/ad5e3f6b9ae870cbfcef2874511915c5dc309ce8) by [@pruthvip](https://github.com/pruthvip))
- react-native-codegen : Add Map / indexed object support for TypeScript parser ([87c356d56c](https://github.com/facebook/react-native/commit/87c356d56c73c3289da3d5911288909720b11994) by [@christophpurrer](https://github.com/christophpurrer))
- Add wanted dependencies to remove yarn warnings ([cd25fb3240](https://github.com/facebook/react-native/commit/cd25fb324018ed97a42e1d7ec8d923c09eef4f63) by [@kelset](https://github.com/kelset))
- Fixed crash when converting JS symbol to folly::dynamic ([428feb2f76](https://github.com/facebook/react-native/commit/428feb2f76c55d6ae5914b019095cd835aa514b0) by [@kassens](https://github.com/kassens))
- Error reporting for module errors ([af0e6cdae5](https://github.com/facebook/react-native/commit/af0e6cdae5762346a013a60e9b3f095204292550) by [@rickhanlonii](https://github.com/rickhanlonii))
- Support properly sending BigInts and Symbols over the Chrome DevTools Protocol. ([7208d15dce](https://github.com/facebook/react-native/commit/7208d15dce552289e530ed470d66c05a65a7239a))
- Fixed React DevTools element highlighting throwing redbox errors ([c64f25ac85](https://github.com/facebook/react-native/commit/c64f25ac85d32186c0400b8aa27785280cdf2799))
- Fix require cycle warning in VirtualizedList ([49cb7f28c8](https://github.com/facebook/react-native/commit/49cb7f28c8dee19c2f3f20aaf21bbf91e85fa5e6) by [@motiz88](https://github.com/motiz88))
- Pressability for text with only `onPressIn` / `onPressOut` props ([f1f7824203](https://github.com/facebook/react-native/commit/f1f78242039438241a905eb43b37c57b73e03335))
- Load react-native.config.js from correct path during codegen ([74fda10702](https://github.com/facebook/react-native/commit/74fda1070266df13e1b58680a670dde3acf9d205) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- Remove usage of the codegen spec filtering until we publish a new version of the codegen. ([ae3dd54fae](https://github.com/facebook/react-native/commit/ae3dd54faee02746b65eeafe36f40f1653b9049b) by [@cipolleschi](https://github.com/cipolleschi))
- Fix nightly build issues ([93c3effc72](https://github.com/facebook/react-native/commit/93c3effc7284cfd5e64a9280e1a56ee7e86127d1) by [@Kudo](https://github.com/Kudo))
- Properly parse negative values ([f3c98c5fa2](https://github.com/facebook/react-native/commit/f3c98c5fa273dbdb17c32cd1193a3f078ef942b4) by [@cipolleschi](https://github.com/cipolleschi))
- Fixup Yoga Enum Generator ([5f9689a0d0](https://github.com/facebook/react-native/commit/5f9689a0d041d2ca81cd2e8e407d97db330b2c95) by [@NickGerleman](https://github.com/NickGerleman))
- Fix remaining NDK comment for new architecture ([fb1f53f7dc](https://github.com/facebook/react-native/commit/fb1f53f7dc09428d2133de8060e63d8194853608) by [@ken0nek](https://github.com/ken0nek))
- Fixed missing Pressable hover props in typescript definition ([6ba5fa946d](https://github.com/facebook/react-native/commit/6ba5fa946d5076995f28f3f5060aa5cabd62619b) by [@Saadnajmi](https://github.com/Saadnajmi))
- Remove Android.mk from internal Gradle task ([d0df6afe76](https://github.com/facebook/react-native/commit/d0df6afe7646032c77643ebd25fa69c507c9ef92) by [@Sunbreak](https://github.com/Sunbreak))
- In RN devtools, call that method, and then set component state to not inspecting. ([bfb36c2163](https://github.com/facebook/react-native/commit/bfb36c21633526fc46f637783b1ff26f2ade1c56) by [@tyao1](https://github.com/tyao1))
- Enable the `react-native-codegen` tests in the OSS. ([00458c9410](https://github.com/facebook/react-native/commit/00458c94109776251678efbec10052702a41c335) by [@cipolleschi](https://github.com/cipolleschi))
- Make style pointerEvents take priority over pointerEvents prop. FIxes requested changes in https://github.com/facebook/react-native/issues/34586 ([a789ead545](https://github.com/facebook/react-native/commit/a789ead5459b772a1ae9b17fce6565d4717554f8) by [@cyrus25](https://github.com/cyrus25))
- Change Wrapper of `InspectorPanel` from `View` to `SafeAreaView` ([afad68f1a8](https://github.com/facebook/react-native/commit/afad68f1a83995eaa42a8f1c7c636ccef8914797) by [@raykle](https://github.com/raykle))
- Typo in AssetSourceResolver ([a45eeea17a](https://github.com/facebook/react-native/commit/a45eeea17a330ccac391b5f0fc1a6f74b6b9e8ee) by [@dhruvtailor7](https://github.com/dhruvtailor7))
- Run ExceptionsManager unit tests in both __DEV__ and prod mode ([a154207371](https://github.com/facebook/react-native/commit/a154207371e0498c93476d98f830ca8b15be8276) by [@GijsWeterings](https://github.com/GijsWeterings))
- Avoid keypress event when text is pasted on macOS ([477663cba8](https://github.com/facebook/react-native/commit/477663cba8c353d950a9a928844929903d55933a) by [@christophpurrer](https://github.com/christophpurrer))
- Flipper now supports custom Xcode build configuration names ([1bc9ddbce3](https://github.com/facebook/react-native/commit/1bc9ddbce393be9466cb87124d3e34a19abb8e5d) by [@scarlac](https://github.com/scarlac))
- Make clang-format work in M1 (Apple Silicon) ([377aa7a30f](https://github.com/facebook/react-native/commit/377aa7a30f5ca1f128fd9222b317ff543e9b0e4a) by [@christophpurrer](https://github.com/christophpurrer))
- Using SOURCEMAP_FILE during xcode build phase with Hermes enabled ([a98da32229](https://github.com/facebook/react-native/commit/a98da322293e2db777bcc599b5abb10f750a7816) by [@kidroca](https://github.com/kidroca))
- Remove compiler-specific syntax. ([33dbb6c40c](https://github.com/facebook/react-native/commit/33dbb6c40ccf44e4b4c879270b6286e2829d057b) by [@chiaramooney](https://github.com/chiaramooney))
- Fix reload hang after debugger break and continue ([60e7eb4d53](https://github.com/facebook/react-native/commit/60e7eb4d534298cb9888d5ab0c8b6a6b041dc299) by [@aeulitz](https://github.com/aeulitz))
- Fix FlatList not calling render items for nullish values when numColumns > 1 ([cc19cdcdbe](https://github.com/facebook/react-native/commit/cc19cdcdbe927368ae1cf4c62a52edd838413252) by [@AntoineDoubovetzky](https://github.com/AntoineDoubovetzky))
- Fix macro errors for Windows. ([fc26dbfce0](https://github.com/facebook/react-native/commit/fc26dbfce0ed16edf1efcfebc01dd4ca584eb902) by [@chiaramooney](https://github.com/chiaramooney))
- Adding grid role to ViewAccessibility to fix flow errors. ([5ddb9977e6](https://github.com/facebook/react-native/commit/5ddb9977e662a1b41dd7203605ca8480432fc06a) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fix: use REACT_NATIVE_CI instead of CI envvar ([ed16fdbbb8](https://github.com/facebook/react-native/commit/ed16fdbbb8f9f5943d4bb9d9a0f40caf89904d33) by [@dmytrorykun](https://github.com/dmytrorykun))
- Bypass tag check in dry run ([ba1a9defbb](https://github.com/facebook/react-native/commit/ba1a9defbbc3261dca43ba20bde41dc6613aa4cf) by [@cipolleschi](https://github.com/cipolleschi))
- Fix removal of version from Hermes tarball, part 2 ([6107793fda](https://github.com/facebook/react-native/commit/6107793fda11a85297b3a3e2b8f259930d6c0f41) by [@kelset](https://github.com/kelset))
- Fix removal of version from Hermes tarball ([e809e4b1ec](https://github.com/facebook/react-native/commit/e809e4b1ecafc942463becfd6a5d62e5132f8f94) by [@kelset](https://github.com/kelset))
- Better fix for param ([32931b19b1](https://github.com/facebook/react-native/commit/32931b19b1f83081dd9e1085ff0add922630f81b) by [@kelset](https://github.com/kelset))
- Fix publish npm post strict ([0f72abfc03](https://github.com/facebook/react-native/commit/0f72abfc03532ca3919554cbbecc8a31d76c231b) by [@kelset](https://github.com/kelset))
- Fix some issues exposed when making function statics sealed ([662115077a](https://github.com/facebook/react-native/commit/662115077a9d7dab260ec93d89c7ca02145a47f8) by [@gkz](https://github.com/gkz))
- Fix measure inner dimensions ([11f47432ff](https://github.com/facebook/react-native/commit/11f47432ff10d0cfe81883f942256c469ac34140) by [@kinarobin](https://github.com/kinarobin))
- Annotate empty objects in xplat ([abb21dd908](https://github.com/facebook/react-native/commit/abb21dd908729fa69daf2fa63366e488009b63bd) by [@SamChou19815](https://github.com/SamChou19815))
- Fix comment typo 'layed out' to 'laid out' ([108c876206](https://github.com/facebook/react-native/commit/108c8762060c9d52e295a1e0f9cdeb6c6a44b53e) by [@lwyj123](https://github.com/lwyj123))
- Fix missing dll exports ([619d115822](https://github.com/facebook/react-native/commit/619d115822bce7b0f6fa194c133d895dc77e717e) by [@justjavac](https://github.com/justjavac))
- Fix FillRateHelper Accessing -1 Frame ([052617611d](https://github.com/facebook/react-native/commit/052617611d68042b0c228955ed5de10a07da203a) by [@NickGerleman](https://github.com/NickGerleman))
- Attempt fix #2 for `cellsAroundViewport` reaching out of bounds ([0ef770587f](https://github.com/facebook/react-native/commit/0ef770587f78389ea4c56f5ace4389d07281947c) by [@NickGerleman](https://github.com/NickGerleman))
- Attempt fix for `cellsAroundViewport` reaching out of bounds ([7aa203beda](https://github.com/facebook/react-native/commit/7aa203beda3cd358703c2fa535ed045771761612) by [@NickGerleman](https://github.com/NickGerleman))
- Reland D38460202 and fix tests ([c4ddaa8fdb](https://github.com/facebook/react-native/commit/c4ddaa8fdba54dd0a7e8587859a7c30ef0d6ce6c) by [@sshic](https://github.com/sshic))
- Add missing class annotations and lock xplat/js ([0ccbe5f704](https://github.com/facebook/react-native/commit/0ccbe5f70463b5259ae1adcb65deeb89204b1948) by [@pieterv](https://github.com/pieterv))
- Add missing class annotations xplat/js [suppressions] ([2e649006f1](https://github.com/facebook/react-native/commit/2e649006f1a78539f5504bce79cbd51816679e13) by [@pieterv](https://github.com/pieterv))
- Add missing class annotations xplat/js ([ee3d3c248d](https://github.com/facebook/react-native/commit/ee3d3c248df4e8be3a331ead5f6eea75c1cf237a) by [@pieterv](https://github.com/pieterv))
- Apply lint updates from buildifier in xplat ([a70354df12](https://github.com/facebook/react-native/commit/a70354df12ef71aec08583cca4f1fed5fb77d874) by [@chatura-atapattu](https://github.com/chatura-atapattu))
- fix: remove gap if its last element in line (fix flex gap extra spacing when children determine parents main axis size)([](https://github.com/facebook/react-native/commit/a0ee98dfeec1a75e649a935b733c70ae2cc1628d) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Add missing AccessibilityInfo Types to TS Typings ([dc1b20d495](https://github.com/facebook/react-native/commit/dc1b20d49514ec5962a6c165a99d9406a66ba67d) by [@NickGerleman](https://github.com/NickGerleman))
- Fix Errors with TypeScript Tests ([ed08edd966](https://github.com/facebook/react-native/commit/ed08edd966aa17764436042b8202704144d61861) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing VirtualizedList Imperative Types ([de1136359c](https://github.com/facebook/react-native/commit/de1136359cf78fa3f2593388924893c36c526650) by [@NickGerleman](https://github.com/NickGerleman))
- Fix virtual list type ([1bd3831cc5](https://github.com/facebook/react-native/commit/1bd3831cc56bb77ada47c4a71fd6cd69fd731938) by [@aliakbarazizi](https://github.com/aliakbarazizi))
- Add missing types for AppRegistry ([213c26c23d](https://github.com/facebook/react-native/commit/213c26c23d91ee994d86f0f9e0e886f4e8a1837e) by [@NickGerleman](https://github.com/NickGerleman))
- Add type for RootTagContext ([fd28032be6](https://github.com/facebook/react-native/commit/fd28032be621ce50e9c8785b35f853b51c44df9d) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing types to PushNotificationIOS ([f04f067aae](https://github.com/facebook/react-native/commit/f04f067aae8c07faa8dce19500eeb7f2dcca99ad) by [@NickGerleman](https://github.com/NickGerleman))
- Fix missing animation type (CircleCI Break) ([696f4b5c39](https://github.com/facebook/react-native/commit/696f4b5c39d67bf62d4eae6cfd497293f2c1bd08) by [@NickGerleman](https://github.com/NickGerleman))
- Fix types for deprecated scrollTo fields ([f9ab91c3ab](https://github.com/facebook/react-native/commit/f9ab91c3abe9baef520255e580005b24be282991) by [@NickGerleman](https://github.com/NickGerleman))
- Fix Vibration.vibrate() allowing null params ([9b7618856f](https://github.com/facebook/react-native/commit/9b7618856f6e1fd423f302cdfab7121f913caf7f) by [@NickGerleman](https://github.com/NickGerleman))
- Mark scrollToEnd animated as optional ([8770b2724a](https://github.com/facebook/react-native/commit/8770b2724ae9783b649824249fa252ec7900471d) by [@NickGerleman](https://github.com/NickGerleman))
- Fix type for StyleSheet.compose() ([754524ea9d](https://github.com/facebook/react-native/commit/754524ea9d2f4b5f8c3eb9e05b2fd25a3e0c3418) by [@NickGerleman](https://github.com/NickGerleman))
- Remove testID from TS ViewStyle ([172f23a2ee](https://github.com/facebook/react-native/commit/172f23a2ee167c322bd84e9d43d3f39fed51116b) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing type for AnimatedValue.resetAnimation() and AnimatedValue.animate() ([1b5066c21d](https://github.com/facebook/react-native/commit/1b5066c21dde90f31753d6d84bce3d8817071451) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- `findPackageJsonFile` should return `null` if `package.json` does not exist ([913ebd207c](https://github.com/facebook/react-native/commit/913ebd207c2e7bc1182eab0bd8d82e7d9d7ee567) by [@tido64](https://github.com/tido64))
- Fix crash on initialize modal ([15656342a8](https://github.com/facebook/react-native/commit/15656342a8401eb599090da7962928dd48d7d890) by [@alpha0010](https://github.com/alpha0010))
- Fix Android autolinking failing because of not expanded variable ([4c1d5ad9c6](https://github.com/facebook/react-native/commit/4c1d5ad9c67b8d0184d27e4e7f6e1cd5b7f8e8b9) by [@kkafar](https://github.com/kkafar))
- On instance destroy, websockets are correctly closed ([b5ea5a2c4d](https://github.com/facebook/react-native/commit/b5ea5a2c4d053cc0962305a7b4f834c28f6d8ddf) by [@javache](https://github.com/javache))
- Sets the namespace via Gradle and not via AndroidManifest ([cec9a34f6c](https://github.com/facebook/react-native/commit/cec9a34f6cd2a82bba76e15761da6b588bc3f574) by [@cortinico](https://github.com/cortinico))
- RNGP - Do the .so cleanup using pickFirst and exclude ([2ff08e8bd8](https://github.com/facebook/react-native/commit/2ff08e8bd8b1303f1ef6f3052031c3a216565053) by [@cortinico](https://github.com/cortinico))
- Fixed an issue on Android API 31+ where modals would turn status bar icons white by default ([5c5220a46d](https://github.com/facebook/react-native/commit/5c5220a46d05fa070e9f5f990bd741efa2b09309) by [@Abbondanzo](https://github.com/Abbondanzo))
- TextInputs may not get focused when switching inputs in a ScrollView ([370bbd705b](https://github.com/facebook/react-native/commit/370bbd705b21947f1c334e158816c812825546d4) by [@javache](https://github.com/javache))
- Fix react.gradle's detectCliPath's for finding the path from Node ([121184bb8f](https://github.com/facebook/react-native/commit/121184bb8f02e884f378a6712950162a8eb15695) by [@liamjones](https://github.com/liamjones))
- Fix crash on release versions after AGP 7.3 bump ([6125f1f866](https://github.com/facebook/react-native/commit/6125f1f866da129dbdc01f5b9e4fac27fa77ed8a) by [@cortinico](https://github.com/cortinico))
- Gracefully handle crash if no WebView provider is found on the device ([3f3394a566](https://github.com/facebook/react-native/commit/3f3394a5668d515e3476933aec67f07794c6e765) by [@rachitmishra](https://github.com/rachitmishra))
- Text with onPress or onLongPress handler is not accessible with TalkBack ([f3847eeec2](https://github.com/facebook/react-native/commit/f3847eeec2679450fcb4fe52e351b9a9c3b0d2a6) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Align android image style / source logic with ios ([6bdcb49966](https://github.com/facebook/react-native/commit/6bdcb49966882bcf696d42066e289783c003dcfc) by [@danilobuerger](https://github.com/danilobuerger))
- Emit the right bubbling event for ReactSliderEvent ([b7e7e7ff1e](https://github.com/facebook/react-native/commit/b7e7e7ff1e74b45709def1f6753fb6421c57a448))
- Typo in build.gradle ([ed21a3e20f](https://github.com/facebook/react-native/commit/ed21a3e20fcbba131792f469fe004f8cf97a4018) by [@jeremybarbet](https://github.com/jeremybarbet))
- Border width top/bottom not matching the border radius ([cd6a91343e](https://github.com/facebook/react-native/commit/cd6a91343ee24af83c7437b3f2449b41e97760e9) by [@hurali97](https://github.com/hurali97))
- Re-implement accessibilityHint on Android to use AccessibililltyNodeInfo#setToolTipText instead of contentDescription ([0b70b38547](https://github.com/facebook/react-native/commit/0b70b38547685b6b978cacedf3ff36723d79a594) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Removed unused variable `NODE_MODULES_DIR` from `build.gradle` in app template ([50b1270298](https://github.com/facebook/react-native/commit/50b12702987c7f6550d4272ce7c94262ec47b6c3) by [@tomekzaw](https://github.com/tomekzaw))
- AccessibilityLabelledBy use DynamicFromObject to parse String to Dynamic ([9f4358142e](https://github.com/facebook/react-native/commit/9f4358142ea7d8f110bbb09dbe3896f5859d56b3) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Bug with view transforms when view recycling is enabled ([e0be14a310](https://github.com/facebook/react-native/commit/e0be14a310009f085e6f5abb52528a528bc923f3) by [@javache](https://github.com/javache))
- Use WindowInsetsCompat for Keyboard Events ([1e48274223](https://github.com/facebook/react-native/commit/1e48274223ee647ac4fc2c21822b5240f3c47e4c) by [@NickGerleman](https://github.com/NickGerleman))
- Adding importantForAccessibility for Text, Button, ImageBackground ([62021eb8d1](https://github.com/facebook/react-native/commit/62021eb8d1721af3a44da1b83c8a6cb59d9d6244) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fix regression when setting shadow node properties. ([a142a78473](https://github.com/facebook/react-native/commit/a142a784733bc7e37042a7e4d3cdbeff99aa1fa7) by [@rshest](https://github.com/rshest))
- Fix occasionally incorrect ScrollView fling behavior ([c7c263dda8](https://github.com/facebook/react-native/commit/c7c263dda8324ec8192ef6389f491a243a100a58) by [@dhleong](https://github.com/dhleong))
- Migrate `needsCustomLayoutForChildren` check to the new architecture ([e24ce708ab](https://github.com/facebook/react-native/commit/e24ce708abffee8ec4521ba8162ea8964eb4429f) by [@grahammendick](https://github.com/grahammendick))
- Remove extra indexOf call in BackHandler.removeEventListener ([14c207d9e1](https://github.com/facebook/react-native/commit/14c207d9e1ffbfa8eeb3b2c6d2a6e334168a4d73) by [@vitalii-tb](https://github.com/vitalii-tb))
- Fix such that when the scrollviews call `onChildStartedNativeGesture`, they appropriately call `onChildEndedNativeGesture` to unlock the native gesture such that `JSTouchDispatcher` or `JSPointerDispatcher` will continue to emit events. ([143a0f74b8](https://github.com/facebook/react-native/commit/143a0f74b86bf2593dd29ce3c85d73d703d7a9f5))
- Fix `AttributedString` comparison logic for TextInput state updates ([089c9a5c9c](https://github.com/facebook/react-native/commit/089c9a5c9c9a60b6bbff6dda0c9eefa9d501a092) by [@NickGerleman](https://github.com/NickGerleman))
- Invoke closeAndReleaseSonatypeStagingRepository in the publish gradle invocation ([e4f23f4783](https://github.com/facebook/react-native/commit/e4f23f4783968e40924ab0f3500018dc79c2d366) by [@cortinico](https://github.com/cortinico))
- Do not eat taps/clicks in ScrollView when soft-keyboard is detached from viewport ([fd1e82a10f](https://github.com/facebook/react-native/commit/fd1e82a10f80c76bd37e7eef65c0dc2220c6bb8d) by [@NickGerleman](https://github.com/NickGerleman))
- Add missing class annotations xplat/js ([c687dd3a77](https://github.com/facebook/react-native/commit/c687dd3a77e28b7318514e5ab318be302f0e7643) by [@pieterv](https://github.com/pieterv))

#### iOS specific

- Don't use the internal `native_modules.rb` script yet, as it hides a hard-coded path ([4df793f75b](https://github.com/facebook/react-native/commit/4df793f75bb178ffd0217ff745de1e1c10b14098) by [@tido64](https://github.com/tido64))
- Exclude redirector to `LongLivedObject.h` from ReactCommon podspec ([dd0bf83481](https://github.com/facebook/react-native/commit/dd0bf834818bcd330b0837b6ada9b848a595e4fe) by [@cipolleschi](https://github.com/cipolleschi))
- Fix incorrect codegen CLI paths in monorepo projects ([4a4cceef25](https://github.com/facebook/react-native/commit/4a4cceef2570c2a68ae91db0648aaaf08cf6c426) by [@byCedric](https://github.com/byCedric))
- Remove hermesc build dir for non-Hermes build. ([c05e6c47df](https://github.com/facebook/react-native/commit/c05e6c47df95f36f0afa94a7aa6725a34bee4095))
- Remove `Copy Hermes Framework` script phase for non-Hermes build. ([7f60bcceac](https://github.com/facebook/react-native/commit/7f60bcceac736aee99e4a8deaadcad30e94f43bc))
- Make sure that the React-Codegen.podspec does not enforce specific versions of its dependencies. ([bc074a300d](https://github.com/facebook/react-native/commit/bc074a300dc8a1d26a11965520dafd8f3e190e01) by [@cipolleschi](https://github.com/cipolleschi))
- Various fixes for Hermes build-from-source behaviour. ([5dd0f7327b](https://github.com/facebook/react-native/commit/5dd0f7327bf6ef1e2d559e6f65769dab3c84fb19))
- Correctly set -DCMAKE_BUILD_TYPE for Hermes on iOS ([c63133202b](https://github.com/facebook/react-native/commit/c63133202b015adc6cd94e77069586a619aca4a8) by [@cortinico](https://github.com/cortinico))
- Https://github.com/facebook/react-native/pull/35047 reverted. ([bbd432e999](https://github.com/facebook/react-native/commit/bbd432e9994eb3b3114d429913bb8ce1a4f6e877))
- Make sure that libraries created with `install_modules_dependencies` has the right C++ version. ([40ad31eacf](https://github.com/facebook/react-native/commit/40ad31eacf29e83ba91031b714c4de1f4d22e469) by [@cipolleschi](https://github.com/cipolleschi))
- Make ManagedObjectWrapper compile on macOS ([76c7ccaa60](https://github.com/facebook/react-native/commit/76c7ccaa60c4e820757c5d8cd8ccc80a2cb5f4a0) by [@christophpurrer](https://github.com/christophpurrer))
- Map `accessibilityRole: grid` to `UIAccessibilityTraitNone` ([f3d9f2ea23](https://github.com/facebook/react-native/commit/f3d9f2ea233304870bd4ab67d9682af6eb0ae16f) by [@NickGerleman](https://github.com/NickGerleman))
- Remove unused #import <UIKit/UIGestureRecognizerSubclass.h> import which breaks macOS ([84737e0069](https://github.com/facebook/react-native/commit/84737e0069f820bdb4b210e979d5faa2ec85ed3e) by [@christophpurrer](https://github.com/christophpurrer))
- Fix Text.allowFontScaling prop in the new architecture ([e9b89b5ff2](https://github.com/facebook/react-native/commit/e9b89b5ff2b0085128bec2879d761352747d6714) by [@sammy-SC](https://github.com/sammy-SC))
- Make the nightly work with the  proper Hermes tarball ([1546666a6d](https://github.com/facebook/react-native/commit/1546666a6d713ef756b2f11de9581e3b2bbe08dc) by [@cipolleschi](https://github.com/cipolleschi))
- Add MARKETING_VERSION to template project ([33e140fd05](https://github.com/facebook/react-native/commit/33e140fd059c1eca3d07ebb76a9be36cf9189b74) by [@kelset](https://github.com/kelset))
- Automatically following version on xcode. ([dcd21143bc](https://github.com/facebook/react-native/commit/dcd21143bc735ff15add4d4b4ba26e3c30ff0dc9) by [@erfinbadrian](https://github.com/erfinbadrian))
- Fix race condition in RCTLoggingTests integration tests ([540ae39487](https://github.com/facebook/react-native/commit/540ae394871148f803bea0697a41763478262bb9))
- Add missing react/renderer/mapbuffer module to podspec ([00458637da](https://github.com/facebook/react-native/commit/00458637da8473bd58e10c7e5a06be1d7ca8559d))
- RedBox title font by using a monospace font on iOS +13. ([5933b6a3ba](https://github.com/facebook/react-native/commit/5933b6a3baaaf7071eafc7c1bde13106407759fd) by [@EvanBacon](https://github.com/EvanBacon))
- Update usage of UIApplication.sharedApplication in RCTKeyCommands ([5e79fa8441](https://github.com/facebook/react-native/commit/5e79fa84412111cf8b8ea4828d82f83672c9dc9f) by [@evoactivity](https://github.com/evoactivity))
- Change hermes logic in build scripts for Apple to use the correct files ([cc13b0273f](https://github.com/facebook/react-native/commit/cc13b0273fc533a38c06fddd5e6b74f77319afa6) by [@kelset](https://github.com/kelset))
- Fix error in the Codegen template for ThirdPartyFabricComponentsProvider ([2f6b2127d9](https://github.com/facebook/react-native/commit/2f6b2127d933094f864523749d13cfbb140b5b63) by [@gispada](https://github.com/gispada))
- `HERMES_ENABLED` check fixed in react-native-xcode.sh ([8745a148b6](https://github.com/facebook/react-native/commit/8745a148b6d8358702b5300d73f4686c3aedb413) by [@nvojnovic](https://github.com/nvojnovic))
- Make sure to turn on the `RCT_NEW_ACRH_ENABLED` flag ([f31134af7d](https://github.com/facebook/react-native/commit/f31134af7d7fbd39a09e120907bffcb8bd40108f) by [@cipolleschi](https://github.com/cipolleschi))
- Fix `Alert` not showing in an app using `UIScene` ([153aedce41](https://github.com/facebook/react-native/commit/153aedce413ef73f5e026abdfcf1346a37cec219) by [@tido64](https://github.com/tido64))
- Image Component will not update correctly when passing in new url ([5c211f2bce](https://github.com/facebook/react-native/commit/5c211f2bce6665468628bc0aa3a8174a474450af) by [@matpaul](https://github.com/matpaul))
- Fixed Time.h:52:17: error when a folder in the file path has a space ([9e169da3ae](https://github.com/facebook/react-native/commit/9e169da3ae44854e0cbfe6d95739a669290105c8) by [@gaberogan](https://github.com/gaberogan))
- Fix: RCTAlertController's UserInterfaceStyle to follow root window ([18542b6ef5](https://github.com/facebook/react-native/commit/18542b6ef5ae12f6b4b8e1ebb66ab85a2db0bd5c) by [@vonovak](https://github.com/vonovak))
- CI broken due to Hermes Commit ([ff7f5a332f](https://github.com/facebook/react-native/commit/ff7f5a332f62e7b13a52d71fabc573224f812816) by [@cipolleschi](https://github.com/cipolleschi))
- Typo in AppDelegate.mm ([0a59c284a9](https://github.com/facebook/react-native/commit/0a59c284a91acb04053bcf2f2e6c47f7f53ddbfe) by [@jeremybarbet](https://github.com/jeremybarbet))
- When source maps are enabled, clean up temporary files from the build directory. Reduces bundle size by at least 1MB. ([e0a71fc7b5](https://github.com/facebook/react-native/commit/e0a71fc7b5cb8c264000147099be5b2575931193) by [@dmytrorykun](https://github.com/dmytrorykun))
- USE_HERMES envvar check fixed in react-native-xcode.sh. Now source maps are generated by default. ([03de19745e](https://github.com/facebook/react-native/commit/03de19745eec9a0d4d1075bac48639ecf1d41352) by [@dmytrorykun](https://github.com/dmytrorykun))
- Fix keyboard accessory button not triggering onSubmitEditing ([98d74d6eb9](https://github.com/facebook/react-native/commit/98d74d6eb98c602a3c76adf54cc45767fb58b555))
- Possible fix for convertIdToFollyDynamic crash in RCTBaseTextInputView and RCTEventDispatcher ([8b174a57c8](https://github.com/facebook/react-native/commit/8b174a57c8e732bbfe7c69e7a5f66f48cb300539) by [@christophpurrer](https://github.com/christophpurrer))
- Fix exception thrown by [RCTTextView description] on macOS ([7db6c080f5](https://github.com/facebook/react-native/commit/7db6c080f5992df76b10930908c2373634cd1911) by [@christophpurrer](https://github.com/christophpurrer))
- Allow preferred Alert button regardless of the style ([653a19a8cd](https://github.com/facebook/react-native/commit/653a19a8cde60e7ab337559492c17d3aa0a860f6) by [@danilobuerger](https://github.com/danilobuerger))
- Fix `contentInsetAdjustmentBehavior` set to `automatic` on `ScrollView` in the new architecture ([27fe6f1079](https://github.com/facebook/react-native/commit/27fe6f10796ecd47314279b1ae7cdfe29c16d1f0) by [@grahammendick](https://github.com/grahammendick))
- Use readlink instead of realpath in packager.sh ([698b14789c](https://github.com/facebook/react-native/commit/698b14789cb0777961fe5f1d4363387f9f185b1b) by [@dminkovsky](https://github.com/dminkovsky))
- Fix cocoapods cli native_modules require for pnpm node_modules ([af3dfbaa47](https://github.com/facebook/react-native/commit/af3dfbaa47f4d58f3f3f892a5debd8d54113c2c3) by [@danilobuerger](https://github.com/danilobuerger))
- Use the right logic for build from source ([49c0267b66](https://github.com/facebook/react-native/commit/49c0267b6695199651e5eb3cc3bb10647fb5e37e) by [@cipolleschi](https://github.com/cipolleschi))
- Remove the hermes engine cache in the clean script ([9979e38c70](https://github.com/facebook/react-native/commit/9979e38c7093ba78db5d5b4b11456c78592ea8c5) by [@kelset](https://github.com/kelset))
- Make sure to export a single version for hermes artifacts and wipe Podfile.lock while in release ([41bf725ada](https://github.com/facebook/react-native/commit/41bf725ada85ed4752006e2c2dcf43037e5c53e4) by [@cipolleschi](https://github.com/cipolleschi))
- Let React Native decide the Hermes version to use in the Codegen ([becb47ccb6](https://github.com/facebook/react-native/commit/becb47ccb6a6ed77e81b5488561ef6d683933ffe) by [@cipolleschi](https://github.com/cipolleschi))
- Fix copy-hermes-xcode.sh ([fc1dbb8f0b](https://github.com/facebook/react-native/commit/fc1dbb8f0be19d83653566e9b4340785350c7aba) by [@dmytrorykun](https://github.com/dmytrorykun))
- Merge pull request #35188 from dmytrorykun/export-D40979350 ([151498a122](https://github.com/facebook/react-native/commit/151498a1224dde415c839833cbce36c94ed3410b) by [@cipolleschi](https://github.com/cipolleschi))
- Center text if line height isn't 0 ([70cc27c901](https://github.com/facebook/react-native/commit/70cc27c901aeb447910e30ac3ceac85990d3c16d) by [@sammy-SC](https://github.com/sammy-SC))
- Fix cleanup not working on template app ([ce3eefe12c](https://github.com/facebook/react-native/commit/ce3eefe12c89378773c83cb3311e8997fd35e2b8) by [@cipolleschi](https://github.com/cipolleschi))

### Security

- Bump terser minor version to mitigate CVE-2022-25858 ([743f9ff63b](https://github.com/facebook/react-native/commit/743f9ff63bf1e3825a1788978a9f6bad8ebddc0d) by [@GijsWeterings](https://github.com/GijsWeterings))

## v0.70.15

### Changed

- BUMP CLI to v9.3.5 ([cb170efdd3](https://github.com/facebook/react-native/commit/cb170efdd346776aa6941512e1c23eb11c3f0a3a) by [@hurali97](https://github.com/hurali97))
- Bump react-devtools-core to 4.27.7 ([abb4a2bddd](https://github.com/facebook/react-native/commit/abb4a2bdddbc904b4b3ff185e41c2dddb5ba684b) by [@lunaleaps](https://github.com/lunaleaps))
- Bump hermes-engine ([5b95254359](https://github.com/facebook/react-native/commit/5b95254359da9813ce8eba5571b9abf6a5fcb21c) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

#### iOS specific

- Migrate boost download url away from JFrog ([e8e059a977](https://github.com/facebook/react-native/commit/e8e059a977ef2feec1b4b9dfd2866daede2b8ff8) by [@cipolleschi](https://github.com/cipolleschi))

## v0.70.14

### Changed
- Update JSCodeshift to 0.14 ([5a695dd](https://github.com/facebook/react-native/commit/5a695dd17c5681883018ba8d3c3608032aba14d9) by [@stianjensen](https://github.com/stianjensen))

### Fixed

#### iOS specific

- Fix Gemfile to set the max version of Active support to 7.0.8 ([a1a220b](https://github.com/facebook/react-native/commit/a1a220b6ace4e35b2cda45b869dc0ff4fb8fbdc1) by [@cipolleschi](https://github.com/cipolleschi))
- Update Xcode 15 patches to be more robust ([735d06c01f](https://github.com/facebook/react-native/commit/735d06c01fe743fad58213e80bca64a0c70ea8ca) by [@cipolleschi](https://github.com/cipolleschi))
- Make Hermes build properly with Xcode 15 ([5f4a091](https://github.com/facebook/react-native/commit/5f4a091a2ff86bcbcfa6f8fe438d260cca029cd3) by [@cipolleschi](https://github.com/cipolleschi))

## v0.70.13

### Fixed

- Fix: bumped CLI to address broken backward compatibility ([549ff6380a](https://github.com/facebook/react-native/commit/549ff6380aa1cf85b86545a22fcb4a850995c8e3) by [@Titozzz](https://github.com/Titozzz))

## v0.70.12

### Fixed

#### iOS specific

- Prefer `Content-Location` header in bundle response as JS source URL ([671ea383fe](https://github.com/facebook/react-native/commit/671ea383fe45dd9834a0c0481360de050df7f0c9) by [@robhogan](https://github.com/robhogan))

## v0.70.11

### Changed

- Bump CLI to 9.3.3 and Metro do 0.72.4 ([2a9d71dc34](https://github.com/facebook/react-native/commit/2a9d71dc341992dce40038dcccefc3abfc745fe8) by [@kelset](https://github.com/kelset)) to address https://github.com/facebook/react-native/issues/36794

## v0.70.10

### Fixed

#### Android specific

- Prevent crash on OnePlus/Oppo devices in runAnimationStep ([c05d822f7d](https://github.com/facebook/react-native/commit/c05d822f7daa92e8af2ec2cd97a9897425624cc2) by [@hsource](https://github.com/hsource))

#### iOS specific

- USE_HERMES envvar check fixed in react-native-xcode.sh. ([61106ac680](https://github.com/facebook/react-native/commit/61106ac6805cddef97e16e473b155abdad701797)) by [@kidroca](https://github.com/kidroca))
- USE_HERMES envvar check fixed in react-native-xcode.sh. Now source maps are generated by default. ([8ad63714](https://github.com/facebook/react-native/commit/8ad63714ed3070aa9fdf95b702d89ef8fb423d9d)) by [@dmytrorykun](https://github.com/dmytrorykun))
- USE_HERMES envvar check fixed in react-native-xcode.sh. ([4108b3](https://github.com/facebook/react-native/commit/4108b374385f1ede69e82ca0f8ca6d6585aee8c4)) by [@dmytrorykun](https://github.com/dmytrorykun))
- When source maps are enabled, clean up temporary files from the build directory. Reduces bundle size by at least 1MB. ([bad3949](https://github.com/facebook/react-native/commit/bad39493b976b425fdf72cd8cf1543a375d612ab)) by [@dmytrorykun](https://github.com/dmytrorykun))
- Make 0.70 compatible with Xcode 15 (thanks to @AlexanderEggers for the commit in main) ([c5e549e694](https://github.com/facebook/react-native/commit/c5e549e694607cd576be8fcb5ed909fec2ed6dce))

## v0.70.9

### Changed

- Update Hermes to `hermes-2023-04-13-RNv0.70.8-c9b539bf3d7bfa4143ff1a5751886c7b2dd728a2` ([7b1441730b](https://github.com/facebook/react-native/commit/7b1441730b5b1c9d9c548dec80d597bed7d71759)), contains:
  - Remove register stack size override in hermes.cpp ([03f2df](https://github.com/facebook/hermes/commit/03f2dffc1d0ef8b2360a6790ad425ce4013e4de3))
  - Increase default max stack size ([1b759f4](https://github.com/facebook/hermes/commit/1b759f40bd2f6bb72b2a353f0d9856fcbdbb981c))

### Fixed

#### Android specific

- Resolved bug with Text components in new arch losing text alignment state. ([31a8e92cad](https://github.com/facebook/react-native/commit/31a8e92caddcdbef9fe74de53e7f412a7e998591) by [@javache](https://github.com/javache))
- Mimimize EditText Spans 9/9: Remove `addSpansForMeasurement()` ([92b8981499](https://github.com/facebook/react-native/commit/92b898149956a301a44f99019f5c7500335c5553) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 8/N: CustomStyleSpan ([b384bb613b](https://github.com/facebook/react-native/commit/b384bb613bf533aebf3271ba335c61946fcd3303) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 6/N: letterSpacing ([5791cf1f7b](https://github.com/facebook/react-native/commit/5791cf1f7b43aed1d98cad7bcc272d97ab659111) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 5/N: Strikethrough and Underline ([0869ea29db](https://github.com/facebook/react-native/commit/0869ea29db6a4ca20b9043d592a2233ae1a0e7a2) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 4/N: ReactForegroundColorSpan ([8c9c8ba5ad](https://github.com/facebook/react-native/commit/8c9c8ba5adb59f7f891a5307a0bce7200dd3ac7d) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 3/N: ReactBackgroundColorSpan ([cc0ba57ea4](https://github.com/facebook/react-native/commit/cc0ba57ea42d876155b2fd7d9ee78604ff8aa57a) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 1/N: Fix precedence ([1743dd7ab4](https://github.com/facebook/react-native/commit/1743dd7ab40998c4d3491e3b2c56c531daf5dc47) by [@NickGerleman](https://github.com/NickGerleman))
- Fix measurement of uncontrolled TextInput after edit ([8a0fe30591](https://github.com/facebook/react-native/commit/8a0fe30591e21b90a3481c1ef3eeadd4b592f3ed) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- Address Hermes performance regression ([1df92c6](https://github.com/facebook/react-native/commit/1df92c6948e08d42367843597fdd94dfae8b42a8) by [@kelset](https://github.com/kelset))

## v0.70.8

### Changed

#### iOS specific

- Relax Ruby requirements ([e3a5fbe72f](https://github.com/facebook/react-native/commit/e3a5fbe72f966b27b967192317d7072db52d1c8c) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

#### iOS specific

- Fix React Codegen podspec to build on Xcode 14.3 ([34f3794f18](https://github.com/facebook/react-native/commit/34f3794f18c3b6462f3fce4b8e272c65801a35f6) by [@cipolleschi](https://github.com/cipolleschi))
- Blob data is no longer prematurely deallocated when using blob.slice ([36cc71ab36](https://github.com/facebook/react-native/commit/36cc71ab36aac5e5a78f2fbae44583d1df9c3cef) by [@awinograd](https://github.com/awinograd))

## v0.70.7

### Fixed

#### Android specific

- Mitigation for Samsung TextInput Hangs ([be69c8b5a7](https://github.com/facebook/react-native/commit/be69c8b5a77ae60cced1b2af64e48b90d9955be5) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS Specific

- Fix the potential race condition when dismissing and presenting modal ([279fb52e03](https://github.com/facebook/react-native/commit/279fb52e033daba60393e400e1ee585e7d067090) by [@wood1986](https://github.com/wood1986))

### Added

#### Android Specific

- Add `POST_NOTIFICATIONS` and deprecate `POST_NOTIFICATION` ([b5280bbc93](https://github.com/facebook/react-native/commit/b5280bbc93218bd15e2166b8689c1689200bb92c) by [@dcangulo](https://github.com/dcangulo))

## v0.70.6

### Fixed

- Fixed regression: @jest/create-cache-key-function dependency was inadvertedly bumped to 29.x. We are bringing it back to 27.0.1. ([fb0e88beb9](https://github.com/facebook/react-native/commit/fb0e88beb9dc443abed3886e459e7a7715738adc) by [@kelset](https://github.com/kelset))

### Changed

- Bump version of Promise from 8.0.3 to 8.3.0, enabling `Promise.allSettled` and `Promise.any` ([475310dbba](https://github.com/facebook/react-native/commit/475310dbbaec8048411edefc6cdddab330df7966) by [@retyui](https://github.com/retyui))
- Bump CLI to 9.3.2 ([9bcc5e0373](https://github.com/facebook/react-native/commit/9bcc5e037391b45315dac3cb5f566e290cbf48cb) by [@kelset](https://github.com/kelset))

#### iOS specific

- Cleanup codegen build folder before installing the pods ([0e316ec671](https://github.com/facebook/react-native/commit/0e316ec671617f5e7c1985b4b05cd0d45bcea403) by [@cipolleschi](https://github.com/cipolleschi))

## v0.70.5

### Fixed

- Force dependencies resolution to minor series for 0.70 ([59407a4d34](https://github.com/facebook/react-native/commit/59407a4d3442dddb7f4c29049bf56bbc345f950f) by [@cortinico](https://github.com/cortinico))

## v0.70.4

### Changed

- Bump CLI to 9.2.1 ([a24c8946e0](https://github.com/facebook/react-native/commit/a24c8946e065ca89048e574abd7c2dc0434a350b) by [@kelset](https://github.com/kelset))
- Bump react-native-codegen to 0.70.6 ([866021b58c](https://github.com/facebook/react-native/commit/866021b58c28a1f1c394294ddc4ed69d4ecef10a) by [@dmytrorykun](https://github.com/dmytrorykun))

### Fixed

- Load react-native.config.js from correct path during codegen ([74fda10702](https://github.com/facebook/react-native/commit/74fda1070266df13e1b58680a670dde3acf9d205) by [@krystofwoldrich](https://github.com/krystofwoldrich))

#### iOS specific

- Fix error in the Codegen template for ThirdPartyFabricComponentsProvider ([2f6b2127d9](https://github.com/facebook/react-native/commit/2f6b2127d933094f864523749d13cfbb140b5b63) by [@gispada](https://github.com/gispada))
- Center text if line height isn't 0 ([70cc27c901](https://github.com/facebook/react-native/commit/70cc27c901aeb447910e30ac3ceac85990d3c16d) by [@sammy-SC](https://github.com/sammy-SC))

## v0.70.3

### Fixed

- Stop styles from being reset when detaching Animated.Values in old renderer ([2f58e52006](https://github.com/facebook/react-native/commit/2f58e520061a31ab90f7bbeef59e2bf723605106) by [@javache](https://github.com/javache))
- Revert "Fix TextInput dropping text when used as uncontrolled component with `defaultValue`" to fix TextInputs not being settable to undefined programmatically ([e2645a5](https://github.com/facebook/react-native/commit/e2645a59f6211116d2069967443502910c167d6f)) by Garrett Forbes Monroe

#### Android specific

- Use NMake generator for Hermes build on Windows ([9d08d55bbe](https://github.com/facebook/react-native/commit/9d08d55bbef4e79a8843deef90bef828f7b9a6ef) by [@mganandraj](https://github.com/mganandraj))
- Fixing failure building RN codegen CLI on Windows ([85c0c0f21f](https://github.com/facebook/react-native/commit/85c0c0f21fdb52543e603687a3c42dc40dff572b) by [@mganandraj](https://github.com/mganandraj))

#### iOS specific

- Add xcode 14 workaround (turn off signing resource bundles) for `React-Core` ([967de03f30](https://github.com/facebook/react-native/commit/967de03f304404ac8817936da37ca39514a09e33) by [@kelset](https://github.com/kelset))

## v0.70.2

### Added

#### iOS specific

- Add support for "Prefer Cross-Fade Transitions" into AccessibilityInfo ([be7c50fefd](https://github.com/facebook/react-native/commit/be7c50fefd7f13201fb538ded93d91b374341173) by [@gabrieldonadel](https://github.com/gabrieldonadel))

### Changed

- Bump CLI to 9.1.3 and Metro to 0.72.3 ([f164556037](https://github.com/facebook/react-native/commit/f1645560376b734a87f0eba1fef69f6cba312cc1) by [@kelset](https://github.com/kelset))

### Fixed

- Inform ScrollView of Keyboard Events Before Mount ([26d148029c](https://github.com/facebook/react-native/commit/26d148029c7fde117f33b0d6c8b34286c45a0ef2) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- Fix port as -1 if dev server without specifying port on Android ([3d7e1380b4](https://github.com/facebook/react-native/commit/3d7e1380b4e609f5340ee80c19d566b17e620427) by [@Kudo](https://github.com/Kudo))

## v0.70.1

### Added

- Add more debugging settings for *HermesExecutorFactory* ([32d12e89f8](https://github.com/facebook/react-native/commit/32d12e89f864a106433c8e54c10691d7876333ee) by [@Kudo](https://github.com/Kudo))
- Support TypeScript array types for turbo module (component only) ([33d1291e1a](https://github.com/facebook/react-native/commit/33d1291e1a96497a4f994e9d622248a745ee1ea6) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))

### Changed

- Accept TypeScript type `T | null | undefined` as a maybe type of T in turbo module. ([9ecd203eec](https://github.com/facebook/react-native/commit/9ecd203eec97e7d21d10311d950c9f8f30c7a4b1) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Bump react-native-gradle-plugin to 0.70.3 ([e33633644c](https://github.com/facebook/react-native/commit/e33633644c70ea39af6e450fcf31d9458051fd5f) by [@dmytrorykun](https://github.com/dmytrorykun))
- Bump react-native-codegen to 0.70.5 ([6a8c38eef2](https://github.com/facebook/react-native/commit/6a8c38eef272e79e52a35941afa9c3fe9e8fc191) by [@dmytrorykun](https://github.com/dmytrorykun))
- Hermes version bump for 0.70.1 ([5132211228](https://github.com/facebook/react-native/commit/5132211228a5b9e36d58c1f7e2c99ccaabe1ba3d) by [@dmytrorykun](https://github.com/dmytrorykun))

### Fixed

- Fix hermes profiler ([81564c1a3d](https://github.com/facebook/react-native/commit/81564c1a3dae4222858de2a9a34089097f665e82) by [@janicduplessis](https://github.com/janicduplessis))

#### Android specific

- Support PlatformColor in borderColor ([2d5db284b0](https://github.com/facebook/react-native/commit/2d5db284b061aec33af671b25065632e20217f62) by [@danilobuerger](https://github.com/danilobuerger))
- Avoid crash in ForwardingCookieHandler if webview is disabled ([5451cd48bd](https://github.com/facebook/react-native/commit/5451cd48bd0166ba70d516e3a11c6786bc22171a) by [@Pajn](https://github.com/Pajn))
- Correctly resolve classes with FindClass(..) ([361b310bcc](https://github.com/facebook/react-native/commit/361b310bcc8dddbff42cf63495649291c894d661) by [@evancharlton](https://github.com/evancharlton))

#### iOS specific

- Fix KeyboardAvoidingView height when "Prefer Cross-Fade Transitions" is enabled ([4b9382c250](https://github.com/facebook/react-native/commit/4b9382c250261aab89b271618f8b68083ba01785) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Fix React module build error with swift integration on new architecture mode ([3afef3c167](https://github.com/facebook/react-native/commit/3afef3c16702cefa5115b059a08741fba255b2db) by [@Kudo](https://github.com/Kudo))
- Fix ios pod install error ([0cae4959b7](https://github.com/facebook/react-native/commit/0cae4959b750ea051dcd04e4c9374e02b1de6e7a) by [@Romick2005](https://github.com/Romick2005))

## 0.70.0

### Breaking

- Remove jest/preprocessor from the react-native package ([0301cb285b](https://github.com/facebook/react-native/commit/0301cb285b2e85b48a397fe58d565196654d9754) by [@motiz88](https://github.com/motiz88))
- Remove nonstandard Promise.prototype.done ([018d5cf985](https://github.com/facebook/react-native/commit/018d5cf985497273dd700b56168cf1cf64f498d5) by [@motiz88](https://github.com/motiz88))

### Added

- Support TypeScript array types for turbo module (module only) ([f0c4c291e1](https://github.com/facebook/react-native/commit/f0c4c291e12a8e76f91d3841d65291f0f1f16714) by [@ZihanChen-MSFT](https://github.com/ZihanChen-MSFT))
- Added files for `avn`, `nodenv`, and other managers that set the node.js version in reactive native project including testing ([933fbb1b2b](https://github.com/facebook/react-native/commit/933fbb1b2b4d2b7c802bf1f2be4c47e5b442a850) by [@ramonmedel](https://github.com/ramonmedel))
- Support BigInt in Hermes ([11bae63bb1](https://github.com/facebook/react-native/commit/11bae63bb1f833802ec6ce01342ebdd1d61e9252) by [@jpporto](https://github.com/jpporto))
- The old Hermes instrumented stats migrated to the new one ([c37f719567](https://github.com/facebook/react-native/commit/c37f7195675df67d23c3c008ec5ab5fd7b8d0394) by [@jpporto](https://github.com/jpporto))
- Modified **getDefaultJSExecutorFactory** method ([87cfd386cb](https://github.com/facebook/react-native/commit/87cfd386cb2e02bfa440c94706d9d0274f83070c) by [@KunalFarmah98](https://github.com/KunalFarmah98))
- `EventEmitter#emit` now freezes the set of listeners before iterating over them, meaning listeners that are added or removed will not affect that iteration. ([e5c5dcd9e2](https://github.com/facebook/react-native/commit/e5c5dcd9e26e9443f59864d9763b049e0bda98e7) by [@yungsters](https://github.com/yungsters))
- Added File and Blob globals to eslint community config ([d881c87231](https://github.com/facebook/react-native/commit/d881c872314e55e17b198a41c86528d79092d222) by [@shamilovtim](https://github.com/shamilovtim))
- C++ TurboModule methods can now use mixed types ([3c569f546c](https://github.com/facebook/react-native/commit/3c569f546ca78b23fbcb9773a1273dd9710f8c60) by [@appden](https://github.com/appden))
- Add useNativeDriver as a param for setValue for Animated ([73191edb72](https://github.com/facebook/react-native/commit/73191edb7255b1ba5e9a0955a25c14250186a676) by [@genkikondo](https://github.com/genkikondo))
- Add `Animated.Numeric` Flow type ([9eb7629ac6](https://github.com/facebook/react-native/commit/9eb7629ac66abc23b91b81d420891d68bbd4f578) by [@motiz88](https://github.com/motiz88))
- Add LTI annotations to function params ([c940eb0c49](https://github.com/facebook/react-native/commit/c940eb0c49518b82a3999dcac3027aa70018c763), [e7a4dbcefc](https://github.com/facebook/react-native/commit/e7a4dbcefc9e393c41f4a796d522211bc1e60b6f), [d96744e277](https://github.com/facebook/react-native/commit/d96744e27711c4fa4dfad1b5a796283a232e60af) by [@pieterv](https://github.com/pieterv))

#### Android specific

- Accessibility announcement for list and grid in FlatList ([2d5882132f](https://github.com/facebook/react-native/commit/2d5882132fb2c533fe9bbba83576b8fac4aca727), [105a2397b6](https://github.com/facebook/react-native/commit/105a2397b6b187a9669ba1c028508a7bb9664009) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Add READ_VOICEMAIL and WRITE_VOICEMAIL permissions to PermisionsAndroid library. ([8a2be3e143](https://github.com/facebook/react-native/commit/8a2be3e1438dd145ccb5374d6ef60811047d23aa) by [@zolbooo](https://github.com/zolbooo))
- Add POST_NOTIFICATIONS, NEARBY_WIFI_DEVICES permission ([0a854c7c8b](https://github.com/facebook/react-native/commit/0a854c7c8b7ffc382c43fa460651a4b4de34c3c7) by [@vincent-paing](https://github.com/vincent-paing))
- Extend the React Native Gradle plugin to accept a config from package.json ([5f3c5aa529](https://github.com/facebook/react-native/commit/5f3c5aa529ed75414eb339c3d8fd2c9628534621) by [@cortinico](https://github.com/cortinico))
- Ability to pass a Typeface object to ReactFontManager in addition to a font resource ID ([e2dd2e2a6e](https://github.com/facebook/react-native/commit/e2dd2e2a6ed17b366a3e2ec0942ea1d82a404c5d) by [@thurn](https://github.com/thurn))
- Option to enable lazyViewManager support with `ViewManagerOnDemandReactPackage` ([d4b59cd9d0](https://github.com/facebook/react-native/commit/d4b59cd9d02a8c4eda3ac4bf89cfe8161847adf0) by [@javache](https://github.com/javache))
- Support for dataUri in form data ([c663c0ec9d](https://github.com/facebook/react-native/commit/c663c0ec9deee7281f819f222bb29ad79e99f3b8) by [@hetanthakkar1](https://github.com/hetanthakkar1))
- Add android-only prop documentation at the TextInput js level. ([f2e23215ca](https://github.com/facebook/react-native/commit/f2e23215ca14c3c630aa931cdd114187589ac0fb))
- Update template to gitignore `android/app/.cxx` ([542d43df9d](https://github.com/facebook/react-native/commit/542d43df9d84a88f742c273391f2596546b4c804) by [@leotm](https://github.com/leotm))

#### iOS specific

- Add Mac Catalyst compatibility (can be enabled in Podfile) ([2fb6a3393d](https://github.com/facebook/react-native/commit/2fb6a3393d545a93518d1b2906bd9453458660a0) by [@Arkkeeper](https://github.com/Arkkeeper))
- Enabled Hermes Intl ([3fa3aeba93](https://github.com/facebook/react-native/commit/3fa3aeba93f226b97e324f3643b98382947e5985) by [@neildhar](https://github.com/neildhar))
- HTTP Response headers added to the error object passed to JS code. ([9eb2826f9b](https://github.com/facebook/react-native/commit/9eb2826f9beac5b7476f33e68803ca5a024867db))
- Add userInterfaceStyle to Alert to override user interface style for iOS 13+ ([47bd78f64f](https://github.com/facebook/react-native/commit/47bd78f64f334b770edc7fabd4b9cceb07a7a503) by [@luoxuhai](https://github.com/luoxuhai))
- Add function to cleanup codegen folders ([71692889b0](https://github.com/facebook/react-native/commit/71692889b0d89b033c07ef87ee3dbf6d62d79235) by [@cipolleschi](https://github.com/cipolleschi))
- Cocoapods function to add the `CLANG_CXX_LANGUAGE_STANDARD` to all the targets if needed ([ca8174e15f](https://github.com/facebook/react-native/commit/ca8174e15f77cbeecb7ff7a5a583abb668817777) by [@f-meloni](https://github.com/f-meloni))
- Support codegen from a single folder ([05aaba9514](https://github.com/facebook/react-native/commit/05aaba95145df0b7f541e391a9f64ba3402cac35) by [@cipolleschi](https://github.com/cipolleschi))
- Run script phases tests in CI ([c171a6e157](https://github.com/facebook/react-native/commit/c171a6e1572f64b2ab9b26d431c07581d4ae832b) by [@cipolleschi](https://github.com/cipolleschi))

### Changed

- Bump React Native Codegen to 0.70.0 ([a22ceecc84](https://github.com/facebook/react-native/commit/a22ceecc849fc62c926643f4d121cf1e4575c693) by [@dmytrorykun](https://github.com/dmytrorykun), [2a274c1a08](https://github.com/facebook/react-native/commit/2a274c1a082c3291d2df1a4b960bf654e217a4dd) by [@cortinico](https://github.com/cortinico), [ce4246a05c](https://github.com/facebook/react-native/commit/ce4246a05c96cd6fe805499960b105267ac044bb) by [@dmytrorykun](https://github.com/dmytrorykun))
- Upgrade RN CLI to v9.0.0, Metro to 0.72.1 ([0c2fe96998](https://github.com/facebook/react-native/commit/0c2fe969984fff0676f99fe034b3e49d38ed7db6) by [@thymikee](https://github.com/thymikee), [7e580b97bf](https://github.com/facebook/react-native/commit/7e580b97bf63436978d053926e04adeb9ae6f75f) by [@kelset](https://github.com/kelset), [c504d038c4](https://github.com/facebook/react-native/commit/c504d038c470f7a13fb345f57261172c7c85248c) by [@thymikee](https://github.com/thymikee), [f1d624823f](https://github.com/facebook/react-native/commit/f1d624823fe23eb3d30de00cf78beb71dc1b8413) by [@kelset](https://github.com/kelset), [2b49ac6f8b](https://github.com/facebook/react-native/commit/2b49ac6f8b04953be4cd5bf0b1325986b117763c) by [@thymikee](https://github.com/thymikee))
- Doc: fix minimum iOS version in requirements section ([ec3c8f4380](https://github.com/facebook/react-native/commit/ec3c8f43800a027a0a717367360421089e7293fd) by [@Simon-TechForm](https://github.com/Simon-TechForm))
- Remove "Early" in Js error reporting pipeline ([0646551d76](https://github.com/facebook/react-native/commit/0646551d7690cd54847eb468f8e43d71ebebdda9) by [@sshic](https://github.com/sshic))
- Update @react-native/eslint-plugin-specs to 0.70.0 ([d07fae9b23](https://github.com/facebook/react-native/commit/d07fae9b23c258a60045b666167efd5259b962ce), [afd76f69c7](https://github.com/facebook/react-native/commit/afd76f69c7d2408654ba67ac2ed4d612abfbe0ce) by [@dmytrorykun](https://github.com/dmytrorykun), [ea8d8e2f49](https://github.com/facebook/react-native/commit/ea8d8e2f49ea3ce15faeab500b661a1cacacf8a8) by [@cortinico](https://github.com/cortinico))
- Do not depend on hermes-engine NPM package anymore ([78cd689f9a](https://github.com/facebook/react-native/commit/78cd689f9a634b152ea09ed6cb4fa858ee26e653) by [@cortinico](https://github.com/cortinico))
- Add ability to pass `ItemSeparatorComponent` as React Element ([5854b11bf9](https://github.com/facebook/react-native/commit/5854b11bf9d42bab9dbe62b9152a3d3a94e42c13) by [@retyui](https://github.com/retyui))
- Hermes version bump. ([0b4b7774e2](https://github.com/facebook/react-native/commit/0b4b7774e2d71259962ed36b7acb5c3989c3be9c) by [@dmytrorykun](https://github.com/dmytrorykun), [8c682ddd59](https://github.com/facebook/react-native/commit/8c682ddd599b75a547975104cb6f90eec8753daf) by [@dmytrorykun](https://github.com/dmytrorykun), [eb6767813a](https://github.com/facebook/react-native/commit/eb6767813a0efe04a9e79955b8f6ee909a4a76bf) by [@cortinico](https://github.com/cortinico))
- Codemod `{...null}` to `{}` in xplat/js ([f392ba6725](https://github.com/facebook/react-native/commit/f392ba67254e95126974fafabf3e4ef0300e24e8) by [@gkz](https://github.com/gkz))
- Fix TextInput dropping text when used as uncontrolled component with `defaultValue` ([51f49ca998](https://github.com/facebook/react-native/commit/51f49ca9982f24de08f5a5654a5210e547bb5b86))
- Suppress errors ahead of launch ([67e12a19cb](https://github.com/facebook/react-native/commit/67e12a19cb236fbe0809fbbc9e516b37a5848a6a) by [@gkz](https://github.com/gkz))
- Suppress missing 'this' annotations ([6c563a507f](https://github.com/facebook/react-native/commit/6c563a507fd8c41e04a1e62e2ba87993c6eb1e2f) by [@pieterv](https://github.com/pieterv))
- Suppress missing annotations ([66c6a75650](https://github.com/facebook/react-native/commit/66c6a75650f91d61e7e87a8e661d87101e26cf9c) by [@pieterv](https://github.com/pieterv))
- Use RuntimeConfig instead of VM Experiment Flag to set up the micro task queue. ([753038cf34](https://github.com/facebook/react-native/commit/753038cf345a45d95ab9b9343447f524e1b36840) by [@fbmal7](https://github.com/fbmal7))
- Update direct Metro dependencies to 0.72.0 ([05dcebc211](https://github.com/facebook/react-native/commit/05dcebc21175a78c6533a8856aed644c45276169) by [@kelset](https://github.com/kelset), [64788cc9fe](https://github.com/facebook/react-native/commit/64788cc9fe42fbedc3e3b1c9c516a079cfa71cd1) by [@huntie](https://github.com/huntie), [bdeb4e0655](https://github.com/facebook/react-native/commit/bdeb4e065532dfb1bb4c9c1e87e8a869a737e48a) by [@jacdebug](https://github.com/jacdebug), [894f652639](https://github.com/facebook/react-native/commit/894f6526399098d825ef32c02eb201cd8ba41873) by [@robhogan](https://github.com/robhogan), [08ebc1cfd8](https://github.com/facebook/react-native/commit/08ebc1cfd88a629389c43abf23b40a2bdf1b1579) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- ECOSYSTEM.md: update Partner entries ([5471afeebf](https://github.com/facebook/react-native/commit/5471afeebf59853ce31df1ade6a4591414b6aa2f) by [@Simek](https://github.com/Simek))
- Move ScrollView's contentOffset to common props ([7c581f3d30](https://github.com/facebook/react-native/commit/7c581f3d3007954413d68daf2e868ce93e120615) by [@genkikondo](https://github.com/genkikondo))
- Upgrade react-native-gradle-plugin to 0.70.2 ([1518f838b7](https://github.com/facebook/react-native/commit/1518f838b70951882f7b414c90407d3eb584cab4), [2176173dcc](https://github.com/facebook/react-native/commit/2176173dcc029ab21bfcdfe5c9e150581db47409) by [@dmytrorykun](https://github.com/dmytrorykun))
- Update a few metro deps as follow up from the commit from main ([7c7ba1babd](https://github.com/facebook/react-native/commit/7c7ba1babd41b6b60f0dc9f48c34d00235d2fef5) by [@kelset](https://github.com/kelset))

#### Android specific

- Bump Android Gradle Plugin to 7.2.1 ([53c8fc9488](https://github.com/facebook/react-native/commit/53c8fc94882893dd8c337fd29543ae11fd467267) by [@leotm](https://github.com/leotm), [c274456e5b](https://github.com/facebook/react-native/commit/c274456e5b635825560852baa5787e96640800d8) by [@dulmandakh](https://github.com/dulmandakh))
- Rename NativeModuleCallExceptionHandler to JSExceptionHandler for broader usage ([b6f7689d70](https://github.com/facebook/react-native/commit/b6f7689d701d0409c23ab364356aeb95710c20fa) by [@sshic](https://github.com/sshic))
- Simplify the Android.mk file in the App Template ([7fb0bb40d2](https://github.com/facebook/react-native/commit/7fb0bb40d2206c734a1feb6b555c22d6d5f2436e) by [@cortinico](https://github.com/cortinico))
- Make Hermes the default engine on Android ([a7db8df207](https://github.com/facebook/react-native/commit/a7db8df2076f68ae9451ce1c77d7eb09d8cfeb14) by [@cortinico](https://github.com/cortinico))
- Revamp touch event dispatching methods ([089ff4555a](https://github.com/facebook/react-native/commit/089ff4555af27eec4561b1627298702b4ecee482) by [@sshic](https://github.com/sshic))
- Demonstrating Dark Mode correctly in the `StatusBar` for the starter template App. ([763dc52387](https://github.com/facebook/react-native/commit/763dc5238721a21847b6d6670b5fa268e3bf2ed4) by [@mrbrentkelly](https://github.com/mrbrentkelly))
- Bump Gradle to 7.5.0 ([5c8186623a](https://github.com/facebook/react-native/commit/5c8186623ae15388949cfc4143edae86863a447b) by [@leotm](https://github.com/leotm), [99e7373dd2](https://github.com/facebook/react-native/commit/99e7373dd2f20184153377109e0e8e48b5bf46f7) by [@dulmandakh](https://github.com/dulmandakh))
- Generalized the return type of ViewManagerOnDemandReactPackage.getViewManagerNames ([51e029ec3c](https://github.com/facebook/react-native/commit/51e029ec3ce42ae8df3d367d8f553ec2148eeafc) by [@javache](https://github.com/javache))
- Don't assert on current activity when call startActivityForResult ([bf6884dc90](https://github.com/facebook/react-native/commit/bf6884dc903154ae32daa50ce7983a9f014be781) by [@sshic](https://github.com/sshic))
- Adapt template to new architecture autolinking on Android ([9ad7cbc3eb](https://github.com/facebook/react-native/commit/9ad7cbc3eb365190e0bfe290e1025553a807b298) by [@thymikee](https://github.com/thymikee))
- Replaced reactnativeutilsjni with reactnativejni in the build process to reduce size ([54a4fcbfdc](https://github.com/facebook/react-native/commit/54a4fcbfdcc8111b3010b2c31ed3c1d48632ce4c) by [@SparshaSaha](https://github.com/SparshaSaha))
- Bump Soloader to 0.10.4 ([b9adf2db20](https://github.com/facebook/react-native/commit/b9adf2db20bf9e1436fa58182d886fd9461df9af) by [@mikehardy](https://github.com/mikehardy))
- Update the new app template to use CMake instead of Android.mk ([dfd7f70eff](https://github.com/facebook/react-native/commit/dfd7f70effeacfeb06d9c2d4762a279a079ee004) by [@cortinico](https://github.com/cortinico))
- Refactored usage of kotlin plugin ([be35c6dafb](https://github.com/facebook/react-native/commit/be35c6dafbdb46d2ec165460d4bb12f34de6e878) by [@hurali97](https://github.com/hurali97))
- Bump Gradle to 7.5.1 ([7a911e0730](https://github.com/facebook/react-native/commit/7a911e073094b533cb5a7ce76932c02f83f4fe5d) by [@AlexanderEggers](https://github.com/AlexanderEggers))
- Fix error of release builds with Hermes enabled for Windows users ([7fcdb9d9d8](https://github.com/facebook/react-native/commit/7fcdb9d9d8f964d24a5ec3d423c67f49b7650ed8) by [@JoseLion](https://github.com/JoseLion))

#### iOS specific

- Move and test Hermes setup from react_native_pods script into a dedicated file ([468b86bd37](https://github.com/facebook/react-native/commit/468b86bd3710b1d43a492c94fb314cc472f03b86) by [@cipolleschi](https://github.com/cipolleschi))
- Use the correct operator to decide whether Hermes is enabled or not. ([61488449b9](https://github.com/facebook/react-native/commit/61488449b996da5881e4711e0813e9c90b6e57a1) by [@cipolleschi](https://github.com/cipolleschi))
- Hermes is now the default engine on iOS. This setting is controlled via `flags[:hermes_enabled]` in the Podfile. ([1115bc77db](https://github.com/facebook/react-native/commit/1115bc77db1090042effc021837f70b28694fa09) by [@hramos](https://github.com/hramos))
- Move LocalPodspecPatch to dedicated file ([8fe2b591c7](https://github.com/facebook/react-native/commit/8fe2b591c7e073d629e95cd7b67aa1dfa96ece38) by [@cipolleschi](https://github.com/cipolleschi))
- Move the `modify_flags_for_new_architecture` method to separate ruby file ([71da21243c](https://github.com/facebook/react-native/commit/71da21243c85283445c6cefa64d1ace13823ab69) by [@cipolleschi](https://github.com/cipolleschi))
- Refactoring part of the react_native_pods.rb script ([4f732ba9ee](https://github.com/facebook/react-native/commit/4f732ba9ee2a1e162729c97d5c12ea771b3a424a), [7a2704455f](https://github.com/facebook/react-native/commit/7a2704455f3edf203d2ecc8135fabf2667f718d8) by [@cipolleschi](https://github.com/cipolleschi))
- When Hermes is enabled, it will use the same copy of JSI as React Native ([340612a200](https://github.com/facebook/react-native/commit/340612a200505ca829bae1f9bce800d3673dac04) by [@hramos](https://github.com/hramos))
- Move `use_flipper` logic inside `use_react_native` and simplify the Flipper dependencies logic ([0bd5239553](https://github.com/facebook/react-native/commit/0bd523955385a3b1e622077b7ee4ea0df3c5c158) by [@f-meloni](https://github.com/f-meloni))
- Export `flipper.rb` script file ([e07a7eb16b](https://github.com/facebook/react-native/commit/e07a7eb16b97e1222e23f935a3d4bb3dac848ef2) by [@cipolleschi](https://github.com/cipolleschi))
- Use `outputDir` as base directory for the codegen and remove the possibility to customize the intermediate path. The generated code requires specific paths in the `#include` directive. ([e4d0153a67](https://github.com/facebook/react-native/commit/e4d0153a675fbdd8718f433b2e9f8bfdccec4b2f) by [@cipolleschi](https://github.com/cipolleschi))
- Refactor part of the codegen scripts and add tests. ([0465c3fd10](https://github.com/facebook/react-native/commit/0465c3fd102525b005826f3c68923d7e9851d6b8), [305a054865](https://github.com/facebook/react-native/commit/305a0548652a405d9f638fb2c054781951dfc996) by [@cipolleschi](https://github.com/cipolleschi))
- CodeGen now supports the `"all"` library type. ([6718500eaa](https://github.com/facebook/react-native/commit/6718500eaaeb92b8a74320dcee961ac96f6f12fa) by [@cipolleschi](https://github.com/cipolleschi))
- Fix the test_ios_unit test ([fdbe4719e2](https://github.com/facebook/react-native/commit/fdbe4719e2e2b599e86d42c49d42c4da97ef431a) by [@cipolleschi](https://github.com/cipolleschi))
- Update Podfile to allow `PRODUCTION=1 pod install` ([77752fc403](https://github.com/facebook/react-native/commit/77752fc4037e66d5b0a5851bae79c4d3285ed334) by [@leotm](https://github.com/leotm))
- Destruct use_reactnative parameters and ad ddocumentation ([79a37e5a88](https://github.com/facebook/react-native/commit/79a37e5a88e179090ade7145a453a46719c87b3f) by [@cipolleschi](https://github.com/cipolleschi))
- Move codegen in separate files ([7d069b2583](https://github.com/facebook/react-native/commit/7d069b25835ad20654a46ebb1e09631d826598e0) by [@cipolleschi](https://github.com/cipolleschi))
- Silence warning due to react-native internal details. ([a4599225f5](https://github.com/facebook/react-native/commit/a4599225f5a6a2d6801dd80b7728c1bbe5b2ec3a) by [@cipolleschi](https://github.com/cipolleschi))

### Removed

- Remove previously deprecated Transform style-attribute props ([7cfd77debd](https://github.com/facebook/react-native/commit/7cfd77debd36f867f5ddfdb9cc44fbe6137aaeba) by [@Zachinquarantine](https://github.com/Zachinquarantine))
- Remove deprecated `isTVOS` constant. ([6075d64acf](https://github.com/facebook/react-native/commit/6075d64acf6f8d74e18ef6568c9438f73fe56d44) by [@Zachinquarantine](https://github.com/Zachinquarantine))
- The diffs renames the required variable which was causing conflicts in names with Apple core SDK's ([086c13dd5f](https://github.com/facebook/react-native/commit/086c13dd5fba3f77acbc70c9bdedc9299118b526) by [@arinjay](https://github.com/arinjay))
- Removed `EventEmitter.prototype.removeSubscription` method. ([870755fa7e](https://github.com/facebook/react-native/commit/870755fa7e7011ac46d269d5fb66d2a1d1543442) by [@yungsters](https://github.com/yungsters))
- Remove deprecated removeListener methods ([2596b2f695](https://github.com/facebook/react-native/commit/2596b2f6954362d2cd34a1be870810ab90cbb916) by [@matinzd](https://github.com/matinzd))
- Remove APPLETVOS variants from BUCk targets. ([cf2e27c388](https://github.com/facebook/react-native/commit/cf2e27c3888ded6f851ba267597ef13f1d0cfd8c) by [@d16r](https://github.com/d16r))

#### iOS specific

- Remove `emulateUnlessSupported` ([c73e021a4b](https://github.com/facebook/react-native/commit/c73e021a4b11bbae3a7868670d140fe3d5dac6ae) by [@ken0nek](https://github.com/ken0nek))
- Remove USE_CODEGEN_DISCOVERY flag ([2e720c3610](https://github.com/facebook/react-native/commit/2e720c361001d996ed35d8bfbf4dc67c31fb895d) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- Throw JSINativeException from asHostObject ([ef6ab3f5ca](https://github.com/facebook/react-native/commit/ef6ab3f5cad968d7b2c9127d834429b0f4e1b2cf) by [@neildhar](https://github.com/neildhar))
- Use new Babel parser instead of deprecated one ([97291bfa31](https://github.com/facebook/react-native/commit/97291bfa3157ac171a2754e19a52d006040961fb) by [@Kerumen](https://github.com/Kerumen))
- Fixed a crash on deserialization of props when using 'px'/'em' units. ([70788313fe](https://github.com/facebook/react-native/commit/70788313fedd40fe2e6d1cf15980ce3cca5adaac) by [@nlutsenko](https://github.com/nlutsenko))
- Fix nullability lost on readonly types in TurboModule specs ([c006722e6c](https://github.com/facebook/react-native/commit/c006722e6cdbe02711cb50ea7a739e0d4d81c7e7) by [@appden](https://github.com/appden))
- Make tests pass for windows ([9596bf045d](https://github.com/facebook/react-native/commit/9596bf045d527e27608ac4b7b2990a4e6846fdeb) by [@cipolleschi](https://github.com/cipolleschi))
- Handle possible null exception on ReactEditText with AppCompat 1.4.0 ([24a1f5c66c](https://github.com/facebook/react-native/commit/24a1f5c66c8633f9b41eef45df3297ffc1d2b606) by [@mikemasam](https://github.com/mikemasam))
- Fixed the disappearance of items when scrolling after zooming VirtualizedList. ([13a72e0ccc](https://github.com/facebook/react-native/commit/13a72e0ccceb2db6aeacd03b4f429d200392c17b) by [@islandryu](https://github.com/islandryu))
- Improved Flow type inference in Animated `.interpolate()` ([7b86fa2b79](https://github.com/facebook/react-native/commit/7b86fa2b795647f5c89e04e4c3ee4b83bc27ef77) by [@motiz88](https://github.com/motiz88))
- Add Jest mock for Vibration module ([79529a1c77](https://github.com/facebook/react-native/commit/79529a1c77e7e1b174fdbe8103a2199c9ac924ff) by [@hduprat](https://github.com/hduprat))
- Allow ReactInstrumentationTest to use custom JSIModules ([eb2a83b0be](https://github.com/facebook/react-native/commit/eb2a83b0be4658654fc6ca6f4671e45f1898798d) by [@christophpurrer](https://github.com/christophpurrer))
- Working around Long paths limitation on Windows ([883a93871c](https://github.com/facebook/react-native/commit/883a93871cb1fbca4434600a322f63afbba333da) by [@mganandraj](https://github.com/mganandraj))
- Fix eslint-plugin-specs prepack npm lifecycle hook now that we use npm 8 ([8441c4a6f7](https://github.com/facebook/react-native/commit/8441c4a6f7bfeda73f89f076fe7d8d1132e4b9be) by [@kelset](https://github.com/kelset))
- Codegen should ignore `.d.ts` files ([0f0d52067c](https://github.com/facebook/react-native/commit/0f0d52067cb89fdb39a99021f0745282ce087fc2) by [@tido64](https://github.com/tido64))
- Avoid full copy of large folly::dynamic objects in JSIExecutor#defaultTimeoutInvoker ([521011d4cc](https://github.com/facebook/react-native/commit/521011d4cc713dfce97dc8872fd0f5171e587b5d) by [@christophpurrer](https://github.com/christophpurrer))

#### Android specific

- Fixed HorizontalScrollView API scrollToEnd causing NPE in side-effects. ([e5ba6ab7b4](https://github.com/facebook/react-native/commit/e5ba6ab7b482c380e35765b898e522e9d4e1d3b0) by [@ryancat](https://github.com/ryancat))
- Fix InputAccessoryView crash on Android ([afa5df1764](https://github.com/facebook/react-native/commit/afa5df1764324f2574d102abeae7199d4b02d183) by [@hduprat](https://github.com/hduprat))
- Bring back non-rootview touch handling based on reactTag ([8b837268b4](https://github.com/facebook/react-native/commit/8b837268b49fd4e72a05f955c20702c457a68fab) by [@fkgozali](https://github.com/fkgozali))
- Make Text not focusable by default ([8ced165e53](https://github.com/facebook/react-native/commit/8ced165e53135d9d33cfdc55a9d4660f8eb5b3c5) by [@kacieb](https://github.com/kacieb))
- Revert [PR 33924](https://github.com/facebook/react-native/pull/33924) because of issues with TextInputs with numeric keyboard types not respecting the secureTextEntry prop ([edb27e3aa1](https://github.com/facebook/react-native/commit/edb27e3aa1210ef33d55c1840065457c31b19cb0) by [@charlesbdudley](https://github.com/charlesbdudley))
- Fix edge case when we enqueue a pending event to views on stopped surface ([ea7c9f2ad9](https://github.com/facebook/react-native/commit/ea7c9f2ad9a78b16234306932edc1d78b783ac27) by [@ryancat](https://github.com/ryancat))
- Fix a bug where the keyboard, once set as email, won't change back to default. ([ec307e0167](https://github.com/facebook/react-native/commit/ec307e0167deca7f17640cd3c5a60f6be5f47b62) by [@larkox](https://github.com/larkox))
- NPE in `ReactEditText.setInputType` when React Native is used with some versions of a AppCompat 1.4.x. (and possibly others) ([92ebb298e2](https://github.com/facebook/react-native/commit/92ebb298e2e5ad640754e09ce3a37d3de1d28f58))
- Fix NPE on `ReactEditText` due to null mFabricViewStateManager ([ba6bf5a3ce](https://github.com/facebook/react-native/commit/ba6bf5a3ce7039a7e407a6632ee41aa3d504f833) by [@cortinico](https://github.com/cortinico))
- Scroll views would still receive scroll events when nested in a view with `pointer-events: "none"` ([fced96bf52](https://github.com/facebook/react-native/commit/fced96bf5202e8b89b804ccc1004abacc9f91660) by [@javache](https://github.com/javache))
- Fixed an edge case that event dispatching is failed after pre-allocation of a view and before the view is mounted. ([a093fe5f2f](https://github.com/facebook/react-native/commit/a093fe5f2fae4e9996b0cbffdfccdce8e58e8cf1) by [@ryancat](https://github.com/ryancat))
- Avoid crash by handling missing views in dispatchViewManagerCommand ([ee1a191cb1](https://github.com/facebook/react-native/commit/ee1a191cb1c10085722d57fc276734f83e86a4f3) by [@hsource](https://github.com/hsource))
- Pass react build dir to cmake ([6ab7a99518](https://github.com/facebook/react-native/commit/6ab7a99518f8ba0d53e62e35d230ebec78e50217) by [@janicduplessis](https://github.com/janicduplessis))
- Fix missing space in ReactPropertyException message ([24560b6718](https://github.com/facebook/react-native/commit/24560b67184da00e05491af38289865c4b934ee8) by [@markv](https://github.com/markv))
- Fix import path breakage ([2e1e62f2bf](https://github.com/facebook/react-native/commit/2e1e62f2bf043ea0bf9926e1f5786ca54a22005e) by [@aniketmathur](https://github.com/aniketmathur))
- When `onEndReachedThreshold` is set to 0 `onEndReached` function on `VirtualizedList` properly fires once the user scrolls to the bottom of the list. ([b869680c11](https://github.com/facebook/react-native/commit/b869680c1196a6549154a4b9cb7ffa10eab1989c))
- Fix rendering of transparent borders in RN Android ([a9659ce86d](https://github.com/facebook/react-native/commit/a9659ce86d94dd34768b067763740a5c41917e42) by [@mdvacca](https://github.com/mdvacca))
- Exception with `Cannot load WebView` message will initialising WebView (along with existing checks) ([9e0d8696cc](https://github.com/facebook/react-native/commit/9e0d8696cc68436a0d309cafde252c55fc337be4) by [@rachitmishra](https://github.com/rachitmishra))
- Fix accessibilityState overwriting view's disabled state on Android ([f35d18caa3](https://github.com/facebook/react-native/commit/f35d18caa302351319840ec85337182f4f148e5e) by [@okwasniewski](https://github.com/okwasniewski))
- Make sure *.ts files are considered for task avoidance in the Gradle Plugin ([1a9fb6cb68](https://github.com/facebook/react-native/commit/1a9fb6cb682aa5ff83462e1e2869eb99f3b873fd) by [@cortinico](https://github.com/cortinico))
- Fix missing import on New Architecture build script in template ([a22f30d2ce](https://github.com/facebook/react-native/commit/a22f30d2ce866cb1488b26bb18eee0620a0ac259) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Use `NODE_BINARY` from `.xcode.env` when running packager from Xcode ([ff785dbcf5](https://github.com/facebook/react-native/commit/ff785dbcf5c464a4d850fa738e977702efd8abd3) by [@elsurudo](https://github.com/elsurudo))
- Bug with error message formatting when bundle is missing ([f501979f3d](https://github.com/facebook/react-native/commit/f501979f3d1e5c053eed16967a3d3385eab8e15f) by [@BenLorantfy](https://github.com/BenLorantfy))
- Fix the race condition when calling readAsDataURL after new Blob(blobs) ([bd12e41188](https://github.com/facebook/react-native/commit/bd12e41188c8d85c0acbd713f10f0bd34ea0edca) by [@wood1986](https://github.com/wood1986))
- Fix the way the orientation events are published, to avoid false publish on orientation change when app changes state to inactive ([7d42106d4c](https://github.com/facebook/react-native/commit/7d42106d4ce20c644bda4d928fb0abc163580cee) by [@lbaldy](https://github.com/lbaldy))
- Fix sed error when installing `glog` ([4a7e4b9ca6](https://github.com/facebook/react-native/commit/4a7e4b9ca6ef4fb52611b6c3cb788f624d1f81a4) by [@alphashuro](https://github.com/alphashuro))
- Don't validate ENTRY_FILE in react-native-xcode.sh ([780fe80fca](https://github.com/facebook/react-native/commit/780fe80fcaf213d84d9d087132af933bd02d1349) by [@janicduplessis](https://github.com/janicduplessis))
- `_scrollViewComponentView` is set to `RCTPullToRefreshViewComponentView's` superview ([4e4b9e2111](https://github.com/facebook/react-native/commit/4e4b9e2111faaf5652ae1f5b885730b378f3de98) by [@dmytrorykun](https://github.com/dmytrorykun))
- Use `GCC_PREPROCESSOR_DEFINITIONS` to set `FB_SONARKIT_ENABLED` ([77e6bff629](https://github.com/facebook/react-native/commit/77e6bff629312f20cdacb1e798cd2464ac50db9e) by [@janicduplessis](https://github.com/janicduplessis))
- Fix Hermes not being properly downloaded during pod install ([d5e0659fcc](https://github.com/facebook/react-native/commit/d5e0659fccf2767beb7aae55461e9690ba335c81) by [@cortinico](https://github.com/cortinico))
- Typo in the documation for the `automaticallyAdjustKeyboardInsets` prop ([927b43d47c](https://github.com/facebook/react-native/commit/927b43d47c2cd42538265cb06154b12cb0be6816) by [@jeremybarbet](https://github.com/jeremybarbet))
- Deprecate iOS/tvOS SDK 11.0 support now that 12.4+ is required ([f56d701e56](https://github.com/facebook/react-native/commit/f56d701e567af0c252a2e297bf81cd4add59378a) by [@leotm](https://github.com/leotm))
- Fix blank spaces that don't recover as you scroll when in an RTL locale and e.nativeEvent.zoomScale is -1. ([bc7b5c3011](https://github.com/facebook/react-native/commit/bc7b5c3011460935614a47a03cd077cd1059de72), [2f491bfa9f](https://github.com/facebook/react-native/commit/2f491bfa9f86c3db2e459e331f39bc3cf12e7239))
- Fixed paddingTop not being applied when using padding and paddingVertical in multiline textinput ([2fb107c9a6](https://github.com/facebook/react-native/commit/2fb107c9a63aacd2c880ad6abedaad67ffb6022b) by [@hetanthakkar1](https://github.com/hetanthakkar1))
- Fixed the ability to pass the port to use for Metro when running `react-native run-ios --port <port>`. ([7dc0b5153e](https://github.com/facebook/react-native/commit/7dc0b5153e4eb91c333238a58fe8c75a47cb5f81) by [@lindboe](https://github.com/lindboe))
- Fix missing imports ([c78babac39](https://github.com/facebook/react-native/commit/c78babac39b7c64e03e137d8fddd91e783303426))
- Fix React-bridging headers import not found ([c4b51e8d76](https://github.com/facebook/react-native/commit/c4b51e8d7679c3c20b843072581acd23a931fc83) by [@Kudo](https://github.com/Kudo))
- Fix Hermes executor not available when `use_frameworks` is enabled ([88b7b640a7](https://github.com/facebook/react-native/commit/88b7b640a74bafd918b8b1cd5d58e1f5ddfb730a) by [@Kudo](https://github.com/Kudo))

### Security

- Add GitHub token permissions for workflows ([3da3d82320](https://github.com/facebook/react-native/commit/3da3d82320bd035c6bd361a82ea12a70dba4e851) by [@varunsh-coder](https://github.com/varunsh-coder))
- Bump RCT-Folly to 2021-07-22 ([68f3a42fc7](https://github.com/facebook/react-native/commit/68f3a42fc7380051714253f43b42175de361f8bd) by [@luissantana](https://github.com/luissantana))
