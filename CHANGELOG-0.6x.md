# Changelog (pre 0.70)

This file contains all changelogs for releases in the 0.60-0.69 range. Please check out the other `CHANGELOG-*.md` files for newer and older versions.

## v0.69.12

### Changed

- [0.69] Bump CLI to ^8.0.7, Metro to 0.70.4 ([56807fadfa](https://github.com/facebook/react-native/commit/56807fadfacf3c5cc62a8d1948b3d72ca51a5e6b) by [@robhogan](https://github.com/robhogan))

#### iOS specific
- [0.69] Use `Content-Location` header in bundle response as JS source URL (#37501) ([367fc7ad52](https://github.com/facebook/react-native/commit/367fc7ad5254c5dd2c8ef38248766173525cc77c) by [@robhogan](https://github.com/robhogan))

### Fixed

#### Android specific
- Prevent crash in runAnimationStep on OnePlus and Oppo devices (#37487) ([4db7a10e25](https://github.com/facebook/react-native/commit/4db7a10e257c664aced8cd8a1737d7ed9ced14fe) by [@hsource](https://github.com/hsource))

## v0.69.11

### Fixed

#### iOS specific

- Make 0.69 compatible with Xcode 15 (thanks to @AlexanderEggers for the commit in main) ([37e8df1cdc](https://github.com/facebook/react-native/commit/37e8df1cdce4a66763c720b1b0768d049def9518))

## v0.69.10

### Fixed

#### Android specific

- Minimize EditText Spans 8/N: CustomStyleSpan ([b384bb613b](https://github.com/facebook/react-native/commit/b384bb613bf533aebf3271ba335c61946fcd3303) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 6/N: letterSpacing ([5791cf1f7b](https://github.com/facebook/react-native/commit/5791cf1f7b43aed1d98cad7bcc272d97ab659111) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 5/N: Strikethrough and Underline ([0869ea29db](https://github.com/facebook/react-native/commit/0869ea29db6a4ca20b9043d592a2233ae1a0e7a2) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 4/N: ReactForegroundColorSpan ([8c9c8ba5ad](https://github.com/facebook/react-native/commit/8c9c8ba5adb59f7f891a5307a0bce7200dd3ac7d) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 3/N: ReactBackgroundColorSpan ([cc0ba57ea4](https://github.com/facebook/react-native/commit/cc0ba57ea42d876155b2fd7d9ee78604ff8aa57a) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 1/N: Fix precedence ([1743dd7ab4](https://github.com/facebook/react-native/commit/1743dd7ab40998c4d3491e3b2c56c531daf5dc47) by [@NickGerleman](https://github.com/NickGerleman))
- Fix measurement of uncontrolled TextInput after edit ([8a0fe30591](https://github.com/facebook/react-native/commit/8a0fe30591e21b90a3481c1ef3eeadd4b592f3ed) by [@NickGerleman](https://github.com/NickGerleman))

## v0.69.9

### Changed

#### iOS specific

- Relax Ruby requirements ([4e015c69d6](https://github.com/facebook/react-native/commit/4e015c69d646b320d58888f70af566c1d753eaed) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

#### iOS specific

- Fix React Codegen podspec to build on Xcode 14.3 ([74ba411b55](https://github.com/facebook/react-native/commit/74ba411b55535cee1b98062875b7b4b1428c931a) by [@cipolleschi](https://github.com/cipolleschi))
- Blob data is no longer prematurely deallocated when using blob.slice ([36cc71ab36](https://github.com/facebook/react-native/commit/36cc71ab36aac5e5a78f2fbae44583d1df9c3cef) by [@awinograd](https://github.com/awinograd))

## v0.69.8

### Fixed

#### Android specific

- Mitigation for Samsung TextInput Hangs ([be69c8b5a7](https://github.com/facebook/react-native/commit/be69c8b5a77ae60cced1b2af64e48b90d9955be5) by [@NickGerleman](https://github.com/NickGerleman))

## v0.69.7

### Fixed

- Force dependencies resolution to minor series for 0.69 ([c4da74c463](https://github.com/facebook/react-native/commit/c4da74c4636cbbd6bbf681d39a8a8cca49f11f56) by [@Titozzz](https://github.com/Titozzz))

## v0.69.6

### Changed

- Bump version of `promise` from 8.0.3 to 8.2.0, enabling `Promise.allSettled` ([951538c080](https://github.com/facebook/react-native/commit/951538c080ef745da304fb308fa91d597e0dd98a) by [@retyui](https://github.com/retyui))

### Fixed

- Fix hermes profiler ([81564c1a3d](https://github.com/facebook/react-native/commit/81564c1a3dae4222858de2a9a34089097f665e82) by [@janicduplessis](https://github.com/janicduplessis))

#### Android specific

- Correctly resolve classes with FindClass(..) ([361b310bcc](https://github.com/facebook/react-native/commit/361b310bcc8dddbff42cf63495649291c894d661) by [@evancharlton](https://github.com/evancharlton))

#### iOS specific

- Fix the way the orientation events are published, to avoid false publish on orientation change when app changes state to inactive ([7d42106d4c](https://github.com/facebook/react-native/commit/7d42106d4ce20c644bda4d928fb0abc163580cee) by [@lbaldy](https://github.com/lbaldy))
- Fix React module build error with swift integration on new architecture mode ([3afef3c167](https://github.com/facebook/react-native/commit/3afef3c16702cefa5115b059a08741fba255b2db) by [@Kudo](https://github.com/Kudo))

## v0.69.5

### Changed

- Bump react-native-codegen to 0.69.2 ([df3d52bfbf](https://github.com/facebook/react-native/commit/df3d52bfbf4254cd16e1dc0ca0af2743cd7e11c1) by [@dmytrorykun](https://github.com/dmytrorykun))

#### Android specific

- Replaced reactnativeutilsjni with reactnativejni in the build process to reduce size ([54a4fcbfdc](https://github.com/facebook/react-native/commit/54a4fcbfdcc8111b3010b2c31ed3c1d48632ce4c) by [@SparshaSaha](https://github.com/SparshaSaha))

### Fixed

- Codegen should ignore `.d.ts` files ([0f0d52067c](https://github.com/facebook/react-native/commit/0f0d52067cb89fdb39a99021f0745282ce087fc2) by [@tido64](https://github.com/tido64))

## v0.69.4

### Changed

- Upgrade RN CLI to v8.0.4 ([66c68c37ce](https://github.com/facebook/react-native/commit/66c68c37ce94f6c1160e7f260c0d1887539c6605) by [@thymikee](https://github.com/thymikee))

#### Android specific

- Modified **getDefaultJSExecutorFactory** method ([87cfd386cb](https://github.com/facebook/react-native/commit/87cfd386cb2e02bfa440c94706d9d0274f83070c) by [@KunalFarmah98](https://github.com/KunalFarmah98))

## v0.69.3

### Fixed

#### iOS specific

- Fix React-bridging header not found for third party modules ([fa2acc32d1](https://github.com/facebook/react-native/commit/fa2acc32d1490f6e418689dec321f8bd4ef7bb28) by [@Kudo](https://github.com/Kudo))

## v0.69.2

### Changed

- Set react-shallow-renderer v16.15.0 for react v18 compat ([a39a7c453d](https://github.com/facebook/react-native/commit/a39a7c453d87086935ff07d549ba8220cbcf30bd) by [@mikehardy](https://github.com/mikehardy))
- Upgrade RN CLI to v8.0.3 ([28cbd21d21](https://github.com/facebook/react-native/commit/28cbd21d21f2ffb3f38b2449a4983f013947ce0a) by [@thymikee](https://github.com/thymikee))

#### iOS specific

- Hermes pod: change logic to use the hermes tag to set the pod source correctly ([46a9edc854](https://github.com/facebook/react-native/commit/46a9edc8544ae070149a97ea3d919b88dd6e2942) by [@kelset](https://github.com/kelset))
- Fix the race condition when calling readAsDataURL after new Blob(blobs) ([bd12e41188](https://github.com/facebook/react-native/commit/bd12e41188c8d85c0acbd713f10f0bd34ea0edca) by [@wood1986](https://github.com/wood1986))
- Make sure that Flipper pods are not installed when creating a release build ([23accbf58d](https://github.com/facebook/react-native/commit/23accbf58d2fa03ad020e07f00012a32609c7218) by [@cipolleschi](https://github.com/cipolleschi))

## v0.69.1

### Changed

#### iOS specific

- Make all Yoga headers public and add #ifdef __cplusplus ([43f831b23c](https://github.com/facebook/react-native/commit/43f831b23caf22e59af5c6d3fdd62fed3d20d4ec) by [@janicduplessis](https://github.com/janicduplessis))

### Fixed

- Use monotonic clock for performance.now() ([114d31feee](https://github.com/facebook/react-native/commit/114d31feeeb47f5a57419e5088c3cbe9340f757a))

#### iOS specific

- Fix build for React-RCTText ([4ea38e16bf](https://github.com/facebook/react-native/commit/4ea38e16bf533955557057656cba5346d2372acd) by [@ph4r05](https://github.com/ph4r05))
- Fix RCT-Folly build error when use_frameworks! and hermes are both enabled ([79baca678a](https://github.com/facebook/react-native/commit/79baca678a743560fa16fdd551f1d0d018d34304) by [@Kudo](https://github.com/Kudo))
- Fix use_frameworks! for 0.69 ([f97c6a5b49](https://github.com/facebook/react-native/commit/f97c6a5b498eec95e99a02c7842cb2ae160cd6cd) by [@Kudo](https://github.com/Kudo))

## v0.69.0

### Breaking

- Support for `console.disableYellowBox` [has been dropped](https://github.com/facebook/react-native/commit/b633cc130533f0731b2577123282c4530e4f0abe)
- Already deprecated prop types have been removed ([cdfddb4dad](https://github.com/facebook/react-native/commit/cdfddb4dad7c69904850d7e5f089a32a1d3445d1), [3e229f27bc](https://github.com/facebook/react-native/commit/3e229f27bc9c7556876ff776abf70147289d544b), [10199b1581](https://github.com/facebook/react-native/commit/10199b158138b8645550b5579df87e654213fe42))
- `removeListener`, deprecated since RN0.65, [was removed](https://github.com/facebook/react-native/commit/8dfbed786b40082a7a222e00dc0a621c0695697d) from Appearance
- If you were using `SegmentedComponentIOS`, you will now need to move to the [segmented-control](https://github.com/react-native-segmented-control/segmented-control) library ([235f168574](https://github.com/facebook/react-native/commit/235f1685748442553e53f8ec6d904bc0314a8ae6))

### Added

- Add Hermes scripts to package ([004b8609d9](https://github.com/facebook/react-native/commit/004b8609d97b14a6d5cb8c9e63afdbe343c500da) by [@hramos](https://github.com/hramos))
- Expose scheduler through FabricUIManager ([1730949e94](https://github.com/facebook/react-native/commit/1730949e94aa23927a90d2a64d91977b7e2904d6) by [@cortinico](https://github.com/cortinico))
- Add event listeners to Scheduler ([e51e19ecc1](https://github.com/facebook/react-native/commit/e51e19ecc1d1b8ac5c860eac55338ef13471844f) by [@cortinico](https://github.com/cortinico))
- C++ TurboModule methods can return functions ([c7380ba113](https://github.com/facebook/react-native/commit/c7380ba1131b26b487ecae87239a4cf82afefd15) by [@appden](https://github.com/appden))
- Add support for devtools' profiler ([fefa7b6ac8](https://github.com/facebook/react-native/commit/fefa7b6ac8a1e0e33fa7a1070936c5c83c873c0a) by [@jpporto](https://github.com/jpporto))
- Add getAll function to FormData class for getting all parts containing that key. This is also available in web API. ([d05a5d1551](https://github.com/facebook/react-native/commit/d05a5d15512ab794ef80b31ef91090d5d88b3fcd) by [@matinzd](https://github.com/matinzd))
- Automatic type conversions for C++ TurboModules ([31f0796237](https://github.com/facebook/react-native/commit/31f079623732fb017b1fa38d56abe855d7738ece) by [@appden](https://github.com/appden))
- New bridging API for JSI <-> C++ ([30cb78e709](https://github.com/facebook/react-native/commit/30cb78e709bccb4f7bf7aab3f6b0f1ba4261f577) by [@appden](https://github.com/appden))
- Add asBool() method to JSI ([603620b739](https://github.com/facebook/react-native/commit/603620b7394da5855e2255790bfea9ad7d80ddf9) by [@appden](https://github.com/appden))
- CustomEvent and Event polyfills for React Native ([6abbef1200](https://github.com/facebook/react-native/commit/6abbef1200af9adab1848de17955d77fbe0ad5da) by [@JoshuaGross](https://github.com/JoshuaGross))
- Implement Runtime.getHeapUsage for hermes chrome inspector ([cff9590864](https://github.com/facebook/react-native/commit/cff9590864c4be153a4eb49757b7cac8b3f23f66) by [@janicduplessis](https://github.com/janicduplessis))
- Introduce ReactNativeFeatureFlags file to control FeatureFlags in React Native ([33aba77456](https://github.com/facebook/react-native/commit/33aba774564acdec216e02e28f17ad08ad7bc26b) by [@mdvacca](https://github.com/mdvacca))
- Added fail-safe check to catch MissingWebViewPackage Exception ([8c573d9336](https://github.com/facebook/react-native/commit/8c573d933652ae4da1008502c53fce93057101c0) by [@Kunal-Airtel2022](https://github.com/Kunal-Airtel2022))
- Add ability to access properties with symbol keys through JSI ([9010bfe457](https://github.com/facebook/react-native/commit/9010bfe457b77862024214ce6210504ff1786ef5) by [@neildhar](https://github.com/neildhar))
- Allow color styles to be animated using native driver ([201f355479](https://github.com/facebook/react-native/commit/201f355479cafbcece3d9eb40a52bae003da3e5c) by [@genkikondo](https://github.com/genkikondo))
- Make react-native depend on react-native-gradle-plugin ([3346efb7d4](https://github.com/facebook/react-native/commit/3346efb7d422bd8eb7f48650b454071f9981fa0b) by [@cortinico](https://github.com/cortinico))
- Add RawEventTelemetryEventEmitter interface to ReactNativePrivateInterface ([1f15a64028](https://github.com/facebook/react-native/commit/1f15a6402869b001cae049facc17126924b97197) by [@JoshuaGross](https://github.com/JoshuaGross))
- Implement Runtime.getHeapUsage for hermes chrome inspector ([3568a72987](https://github.com/facebook/react-native/commit/3568a7298738a651d76c70763362c297ab601ee8) by [@janicduplessis](https://github.com/janicduplessis))
- Add support for C++17 in OSS ([c2e4ae39b8](https://github.com/facebook/react-native/commit/c2e4ae39b8a5c6534a3fa4dae4130166eda15169) by [@sammy-SC](https://github.com/sammy-SC))

#### Android specific

- Generate `Nullable` for optional objects and arrays in module codegen. ([ffaa5d69bc](https://github.com/facebook/react-native/commit/ffaa5d69bc268918891121e2d60e7ca08ee82530))
- Expose an API to enable Concurrent Root on Android ([d7b64b8d4b](https://github.com/facebook/react-native/commit/d7b64b8d4b2f403ce00b27c5df89ffb3a64dc6de) by [@cortinico](https://github.com/cortinico))
- Add scrollEventThrottle prop support in Android ([cf55fd587e](https://github.com/facebook/react-native/commit/cf55fd587e6cc82a73079be6076d244ab72fa359) by [@ryancat](https://github.com/ryancat))
- Accessibility announcement for list and grid in FlatList ([dd6325bafe](https://github.com/facebook/react-native/commit/dd6325bafe1a539d348f3710e717a6344576b859) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Introduce ModuleDataCleaner.cleanDataFromModules(ReactContext) ([184dfb8f8b](https://github.com/facebook/react-native/commit/184dfb8f8bd4dfbb8d1575e9554e3f3361793015) by [@RSNara](https://github.com/RSNara))
- Introduce ReactContext.getNativeModules() ([b978308519](https://github.com/facebook/react-native/commit/b978308519f71c6c7fda4b38a842aa219a349275) by [@RSNara](https://github.com/RSNara))
- MapBuffer implementation for JVM -> C++ communication ([cf6f3b680b](https://github.com/facebook/react-native/commit/cf6f3b680b43fae31e97b14af681293503025a0c))
- Make links independently focusable by Talkback ([7b5b114d57](https://github.com/facebook/react-native/commit/7b5b114d578142d18bf4a7a5279b179a9ac8d958) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Support animating text color with native driver ([87cdb607e4](https://github.com/facebook/react-native/commit/87cdb607e4792156d433c44b89932e7dae3371da) by [@genkikondo](https://github.com/genkikondo))
- Added an experimental prop serialization path based on MapBuffer ([cbcdaae2b5](https://github.com/facebook/react-native/commit/cbcdaae2b5dda2a44c95d83dcb5b5aa0f43bc6f9))
- Allow to setup a Gradle Enterprise instance via an external script ([f11dcfaea1](https://github.com/facebook/react-native/commit/f11dcfaea14249b059aea2474ce36a0665140d4f) by [@cortinico](https://github.com/cortinico))
- Support platform color with AnimatedColor ([cb42049e0a](https://github.com/facebook/react-native/commit/cb42049e0ae262afe907ace1099414836ab0018d) by [@genkikondo](https://github.com/genkikondo))
- Support running animations with AnimatedColor with native driver ([3f49e6763e](https://github.com/facebook/react-native/commit/3f49e6763e66447f6ae17dc2f032e27330b7b74a) by [@genkikondo](https://github.com/genkikondo))
- Add public API to ReactRootView to control if JS touch events are dispatched ([0a517ae438](https://github.com/facebook/react-native/commit/0a517ae43892fb764d829f8bae56c1ac58356b1b) by [@ryancat](https://github.com/ryancat))

#### iOS specific

- Prepare a method in the AppDelegate to control the concurrentRoot. ([8ac8439e0d](https://github.com/facebook/react-native/commit/8ac8439e0dcc0cc4a9c0cc99f614a5e19bae56eb) by [@cipolleschi](https://github.com/cipolleschi))
- `hotkeysEnabled` property is added to `RCTDevMenu` which allows enabling/disabling hotkeys that triggers developer menu popup ([1a1a304ed2](https://github.com/facebook/react-native/commit/1a1a304ed2023d60547aef65b1a7bf56467edf08))
- Allow modifying iOS image cache limits ([61b013e7ad](https://github.com/facebook/react-native/commit/61b013e7ad8a1cc28ee39434d2fd96b74b96cf5f) by [@danilobuerger](https://github.com/danilobuerger))
- Add dismissActionSheet method to ActionSheetIOS ([64ebe5bbdd](https://github.com/facebook/react-native/commit/64ebe5bbdd32fc3b3a243a8a81a6f724d8f81267) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Integrated the `accessibilityLanguage` prop to all the available components. The prop is available for any platform but it will work only on iOS. ([7b05b091fd](https://github.com/facebook/react-native/commit/7b05b091fd97f95b778369277ac2147730abc7b8) by [@dgopsq](https://github.com/dgopsq))
- Support running animations with AnimatedColor with native driver ([49f3f47b1e](https://github.com/facebook/react-native/commit/49f3f47b1e9b840e4374d46b105604f4d2c22dd5) by [@genkikondo](https://github.com/genkikondo))

### Changed

- Update direct Metro dependencies to 0.70.1 ([b74e964e70](https://github.com/facebook/react-native/commit/b74e964e705c40834acad7020562e870cdad9db1), ([c92b64b16a](https://github.com/facebook/react-native/commit/c92b64b16a5710c1dfaea9af4c271931e4669636) by [@arushikesarwani94](https://github.com/arushikesarwani94)), ([f89a0b765c](https://github.com/facebook/react-native/commit/f89a0b765c09c9aba573f03777cc76673989628f) by [@robhogan](https://github.com/robhogan))
- Upgrade RN CLI to v8.0.0 ([0605880c9e](https://github.com/facebook/react-native/commit/0605880c9ed0aec812f3198eb5075db64fba969a), [1e0226f933](https://github.com/facebook/react-native/commit/1e0226f933814bf9ada87eaa14348bfff863ead1), [24bb7f7380](https://github.com/facebook/react-native/commit/24bb7f7380662925f078d78a03fbc954af2da3d6), [7dceb9b63c](https://github.com/facebook/react-native/commit/7dceb9b63c0bfd5b13bf6d26f9530729506e9097) by [@thymikee](https://github.com/thymikee))
- Replace use-subscripton with use-sync-external-store ([93b50be8c2](https://github.com/facebook/react-native/commit/93b50be8c2341a0daf41f6fdc656896c4907c4dc) by [@rickhanlonii](https://github.com/rickhanlonii))
- Expose UIManager from Scheduler ([54db5f2012](https://github.com/facebook/react-native/commit/54db5f201292ebf267800d92b7dd5bfa22431963) by [@cortinico](https://github.com/cortinico))
- Optimized VirtualizedList context when used with nested lists ([ceb0a54608](https://github.com/facebook/react-native/commit/ceb0a546083509192c059cdd93d6aa379e38ef4e) by [@javache](https://github.com/javache))
- Remove usage of std::string in EarlyJsErrorHandler. ([30051b2c41](https://github.com/facebook/react-native/commit/30051b2c4185bff015c72069488b5f6ba3391ad7) by [@sshic](https://github.com/sshic))
- `eslint-config`: add support for ESLint 8 ([864a8c11b2](https://github.com/facebook/react-native/commit/864a8c11b2a7540f607ebc0e084edd7393169359) by [@wcandillon](https://github.com/wcandillon))
- `eslint-config`: add support for TypeScript 4.5+ ([199ac680c7](https://github.com/facebook/react-native/commit/199ac680c7867a982e25620219bffa18f85f5404) by [@rnike](https://github.com/rnike))
- Upgraded react-devtools-core dependency to 4.24.0 ([a7a781ff4a](https://github.com/facebook/react-native/commit/a7a781ff4a13e744f4eb3007ef0657740b277a72))
- Avoid flattening nodes with event props ([980c52de41](https://github.com/facebook/react-native/commit/980c52de41258f6cf2d2360144ea7ca16a19c9f8))
- Type the argument of Animated.interpolate as read-only ([6584304c10](https://github.com/facebook/react-native/commit/6584304c100ce4d51a5c4d606170a6ad0dc00875) by [@motiz88](https://github.com/motiz88))
- Update gradle-download-task to 5.0.1 to support concurrent downloads ([a86cae7aac](https://github.com/facebook/react-native/commit/a86cae7aacc9837536e7d679870a57dcd0f45475) by [@michel-kraemer](https://github.com/michel-kraemer))
- Logging a soft error when ReactRootView has an id other than -1 instead of crashing the app in hybrid apps ([1ca2c24930](https://github.com/facebook/react-native/commit/1ca2c2493027c1b027146cd41e17dd8a4fc33a41) by [@Kunal-Airtel2022](https://github.com/Kunal-Airtel2022))
- Upgrade to React 18 ([41cbccd98d](https://github.com/facebook/react-native/commit/41cbccd98dd6c98d1f662674164cf455105a1359) by [@rickhanlonii](https://github.com/rickhanlonii))

#### Android specific

- Gradle: extend the algoritm to find hermesc paths ([aeac6ab677](https://github.com/facebook/react-native/commit/aeac6ab6773cd2c0ca7abe9e5aa3f22fa81683e5) by [@cortinico](https://github.com/cortinico))
- Bump boost for Android to 1.76 to align with iOS ([5cd6367f0b](https://github.com/facebook/react-native/commit/5cd6367f0b86543274a15bb6d0e53a8545fed845) by [@kelset](https://github.com/kelset))
- Adopt `MapBuffer` interface for `ReadableMapBuffer` ([81e4249315](https://github.com/facebook/react-native/commit/81e42493158edd5e7b88f98c19c87e9d61ba4aba))
- Mark intent as nullable ([5ffa0b0aa6](https://github.com/facebook/react-native/commit/5ffa0b0aa6c523234c634167be1f94b0d9edb0f7) by [@sshic](https://github.com/sshic))
- Use CMake to build ReactAndroid module ([e3830ddffd](https://github.com/facebook/react-native/commit/e3830ddffd9260fe071e0c9f9df40b379d54cf26))
- Update template/android and RN Tester to use `hermes-engine` from the `react-native` NPM package. ([4d91f40fbd](https://github.com/facebook/react-native/commit/4d91f40fbdf0012689b04084113299676342c0dc) by [@cortinico](https://github.com/cortinico))
- Build Hermes from Source ([a3d9892ed9](https://github.com/facebook/react-native/commit/a3d9892ed9c993d16fa36fa6b713e2ead43fcc77) by [@cortinico](https://github.com/cortinico))
- Rename field with default values for ReactConfig to DEFAULT_CONFIG ([964e816752](https://github.com/facebook/react-native/commit/964e81675286c80a8e322127aa7c052f62621098))
- Moved `com/react/facebook/uimanager/interfaces` files into `com/react/facebook/uimanager` to enable Kotlin build ([b1a779392d](https://github.com/facebook/react-native/commit/b1a779392d483c649d428debfe4a6405247b8c0e))
- Bump AGP to 7.1.0 and fix bundle inclusion in release mode ([200488e87c](https://github.com/facebook/react-native/commit/200488e87cf4bc355e03c78cd814b97b23452117) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Release react-native-gradle-plugin 0.0.5 ([42272211e4](https://github.com/facebook/react-native/commit/42272211e4a1b7cff7770b59cf1bcf649cbdd6fc) by [@cortinico](https://github.com/cortinico))
- ViewPagerAndroid recommendation link. ([7e8cce3d2d](https://github.com/facebook/react-native/commit/7e8cce3d2ddffbe36bcb3c9ec2f006f7e1b42a79) by [@maaxg](https://github.com/maaxg))
- Bump android Appcompat to 1.4.1 ([6b61995647](https://github.com/facebook/react-native/commit/6b61995647c789a567845521fed7b0cc1e0cddb7) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Remove `react-native-gradle-plugin` as a dependency from template's package.json ([cd79317672](https://github.com/facebook/react-native/commit/cd79317672e5c99636346f2abb641a688a4ceb82) by [@cortinico](https://github.com/cortinico))
- Use 2g as a default heap size for gradle builds ([09e418ef8e](https://github.com/facebook/react-native/commit/09e418ef8e98fd026cf828696ff2475993b76ac2))
- Use new StatusBar API on Android 11 (API 30)+ ([50c8e973f0](https://github.com/facebook/react-native/commit/50c8e973f067d4ef1fc3c2eddd360a0709828968) by [@ieatfood](https://github.com/ieatfood))
- Change static string to public ([ab45138394](https://github.com/facebook/react-native/commit/ab45138394f41aeb13370882837968636de04c24) by [@sshic](https://github.com/sshic))

#### iOS specific

- Use pre-built HermesC if available in current React Native release ([644fe430fd](https://github.com/facebook/react-native/commit/644fe430fdecc0bf1fa098d1c2d52178da6c987c) by [@hramos](https://github.com/hramos))
- When building Hermes from source, the filesystem will now be prepared using the new hermes-utils.js scripts, outside of CocoaPods ([aaa01f7710](https://github.com/facebook/react-native/commit/aaa01f77106f891696d9ec508e2ee71111a6af2a) by [@hramos](https://github.com/hramos))
- Expose scheduler through RCTSurfacePresenter ([614aa86916](https://github.com/facebook/react-native/commit/614aa86916394d8ee2ecb236f38de6bb7e161ca2) by [@cortinico](https://github.com/cortinico))
- Adopt UIGraphicsImageRenderer API ([d70d7fd0b3](https://github.com/facebook/react-native/commit/d70d7fd0b3984ee54622afc4692a6c945618c345) by [@matrush](https://github.com/matrush))
- Build Hermes from source when Hermes is used ([bb01b75637](https://github.com/facebook/react-native/commit/bb01b75637edc1159a3bdb3af86936e1c92f39c1) by [@hramos](https://github.com/hramos))
- Update CodeGen scripts to accept custom node executable ([323db75c36](https://github.com/facebook/react-native/commit/323db75c36d26d771f6b231c8eabc5afc0da74d3) by [@cipolleschi](https://github.com/cipolleschi))
- Fixed the fallback behavior when the `.xcode.env` file is missing, actually using the old `find-node-for-xcode.sh` script ([705c6f57d6](https://github.com/facebook/react-native/commit/705c6f57d66b4499f43489292183a58413402a74) by [@cipolleschi](https://github.com/cipolleschi))
- Adding a link in a message for the users. ([2c52131f5e](https://github.com/facebook/react-native/commit/2c52131f5e0eb4668681242fcdd8150afe3c5827) by [@cipolleschi](https://github.com/cipolleschi))
- Bump ruby to 2.7.5 ([2c87b7466e](https://github.com/facebook/react-native/commit/2c87b7466e098c5cd230e02b279fc7bc7a357615) by [@danilobuerger](https://github.com/danilobuerger))
- This PR removes the `find-node.sh` scripts and replaces it with an `.xcode.env` file that is sourced by the script phases that needs it. The `.xcode.env` file is versioned: to customize a local environment, an unversioned `.xcode.local.env` can be used. ([0480f56c5b](https://github.com/facebook/react-native/commit/0480f56c5b5478b6ebe5ad88e347cad2810bfb17) by [@cipolleschi](https://github.com/cipolleschi))
- Update `PushNotificationIOS.checkPermissions` to include iOS 10+ notification settings. ([17ecd2fb5b](https://github.com/facebook/react-native/commit/17ecd2fb5b3cfb8aa0282ed406b16dc3b9777018))
- Enable SonarKit in React-Core when the configuration is `'Debug'` ([b5343a6b0d](https://github.com/facebook/react-native/commit/b5343a6b0dd07c1b4ef9dac549df67a4d68ebd1e) by [@cipolleschi](https://github.com/cipolleschi))
- When Hermes is enabled, the Hermes Engine will be built from source instead of using the pre-built `hermes-engine` CocoaPod. ([12ad1fffe8](https://github.com/facebook/react-native/commit/12ad1fffe87c0c5ab2e001f318ff4f8d3eda7479) by [@hramos](https://github.com/hramos))
- Replaced folly::Optional with std::optional from C++17 in Objc module generator. ([45e2941367](https://github.com/facebook/react-native/commit/45e2941367fbf13584193bbda598173802289167) by [@philIip](https://github.com/philIip))
- Removed methodName parameter that was used only for a warning message and moved the warning parameter to be calculated inline. ([cfb11ca2f6](https://github.com/facebook/react-native/commit/cfb11ca2f67c59c090b8a58b2b7bdaacef0e19df))
- Fix the crash caused by nil partialLoadHandler ([46bc521513](https://github.com/facebook/react-native/commit/46bc521513c9c78e5ffc49cf3e571757e1a91cef))
- Synchronously render cached images ([189c2c8958](https://github.com/facebook/react-native/commit/189c2c8958442541c6b4f42860b2943ece612da2))
- Updated Flipper-Glog to 0.5.0.4 ([cd60ffdb62](https://github.com/facebook/react-native/commit/cd60ffdb62b2183cd24baef3075d56f758cea24a))
- Add function to report early js errors ([1804951595](https://github.com/facebook/react-native/commit/180495159517dc0bfa103621e5ff62fc04cb3c8b) by [@sshic](https://github.com/sshic))

### Deprecated

- Deprecate the use of `react-native/jest/preprocessor.js` by external projects ([c1e9aa9a27](https://github.com/facebook/react-native/commit/c1e9aa9a272aed3cba60c4aeff783eeb8bffce68) by [@motiz88](https://github.com/motiz88))
- Deprecate the Promise.prototype.done method and log a warning when it's called in development. ([35800962c1](https://github.com/facebook/react-native/commit/35800962c16a33eb8e9ff1adfd428cf00bb670d3) by [@motiz88](https://github.com/motiz88))

#### iOS specific

- Deprecating support for iOS/tvOS SDK 11.0, 12.4+ is now required ([5f2835b14d](https://github.com/facebook/react-native/commit/5f2835b14d35681c268dd64d6ec284ea5f053be3), ([c71e6efbcd](https://github.com/facebook/react-native/commit/c71e6efbcd2b95faee327d9763d321488120bc5e), ([982ca30de0](https://github.com/facebook/react-native/commit/982ca30de079d7e80bd0b50365d58b9048fb628f) by [@philIip](https://github.com/philIip))

#### iOS specific

- Removed lint restricting `DynamicColorIOS` to only two properties ([13b0b06522](https://github.com/facebook/react-native/commit/13b0b0652259ada468cc044b0b604edb666b2eb9))

### Fixed

- Remove unactionable warning about `codegenNativeComponent` when on 'Paper' ([494b73cb33](https://github.com/facebook/react-native/commit/494b73cb33197fa865e9ead8fdca11bce6822917) by [@tido64](https://github.com/tido64))
-  Fix typo in Value's constructor with a Symbol ([a7a0f86a73](https://github.com/facebook/react-native/commit/a7a0f86a73ab51be31fb2c3205612d7ff1fb5384) by [@jpporto](https://github.com/jpporto))
- Avoid full copy of large folly::dynamic objects by switching to std::move semantics ([3f98c8e4c2](https://github.com/facebook/react-native/commit/3f98c8e4c2c8f40b81c1a90aa65c1bdc9327faed) by [@NikoAri](https://github.com/NikoAri))
- Fix performance issue on Animated.interpolate with big input range ([f503b21203](https://github.com/facebook/react-native/commit/f503b212039f79f00ea56b65ecf3cd150b82f087) by [@Almouro](https://github.com/Almouro))
- Update function spacing linting rules ([8650220cf9](https://github.com/facebook/react-native/commit/8650220cf99739c4b904a37ce4f19ce7dfd3bdbb) by [@joeframbach](https://github.com/joeframbach))
- Add supportsFromJs and supportsToJs template variables ([087624ccaf](https://github.com/facebook/react-native/commit/087624ccaf2e484c0b6425e57edf9afd62a06e9a) by [@appden](https://github.com/appden))
- The Array appended to FormData is transmitted as a string ([d2e8e7d58e](https://github.com/facebook/react-native/commit/d2e8e7d58e680e0bb3b4da1f820dd4dd840639f5) by [@bang9](https://github.com/bang9))
- AppState.removeEventListener correctly removes listener for blur and focus events ([9aab25ec53](https://github.com/facebook/react-native/commit/9aab25ec536473ffe6d22c5efeae8fea6bd769be) by [@AntoineDoubovetzky](https://github.com/AntoineDoubovetzky))
- `focus()` on TextInput to respect its `editable` state ([8a5460ce80](https://github.com/facebook/react-native/commit/8a5460ce80e69c11a007121d4278d55642f6b10e) by [@vonovak](https://github.com/vonovak))
- Restore Windows build with RawPropsParser.cpp ([2d64d1d693](https://github.com/facebook/react-native/commit/2d64d1d69360161c047c86a026403d8074ba28bb) by [@TatianaKapos](https://github.com/TatianaKapos))
- Fix babel-plugin-codegen crash when export init is null ([ae756647c9](https://github.com/facebook/react-native/commit/ae756647c9b8a88ba615fd30185f621825a33427) by [@janicduplessis](https://github.com/janicduplessis))
- Fixed compilation warning due to `using namespace` being used as part of header ([009d80bf5a](https://github.com/facebook/react-native/commit/009d80bf5a55dd74be448960b1344ac7599c6bae) by [@arhelmus](https://github.com/arhelmus))
- Allow including TurboModule.h in mixed rtti/no-rtti environment, even if TurboModule.h/cpp is compiled without RTTI. ([1f87729697](https://github.com/facebook/react-native/commit/1f87729697370a4ab31e2bb9ab1780438d9e146f) by [@nlutsenko](https://github.com/nlutsenko))
- Remove prettier from dependencies in eslint-config ([2db1bca952](https://github.com/facebook/react-native/commit/2db1bca95224ce39484c3f27508aec9a21ce126a) by [@Kerumen](https://github.com/Kerumen))
- Switch Component doesn't disable click functionality when disabled ([b2e625a517](https://github.com/facebook/react-native/commit/b2e625a51723becea4cef0433448fbec679669ee) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Support numeric color values in StyleSheet's Flow types ([83b1975b90](https://github.com/facebook/react-native/commit/83b1975b90569a36020da33156615a13fcc7ba92) by [@motiz88](https://github.com/motiz88))
- Fix build break on Windows with ReactCommon ([42b391775f](https://github.com/facebook/react-native/commit/42b391775f663df335f6f2553104fc2fa35b1bee) by [@chiaramooney](https://github.com/chiaramooney))
- Fixed opacity value in TouchableOpacity ([3eddc9abb7](https://github.com/facebook/react-native/commit/3eddc9abb70eb54209c68aab7dbd69e363cc7b29) by [@hetanthakkar1](https://github.com/hetanthakkar1))
- Remove illegal private property access in VirtualizedSectionList.scrollToLocation ([b2f871a6fa](https://github.com/facebook/react-native/commit/b2f871a6fa9c92dd0712055384b9eca6d828e37d) by [@motiz88](https://github.com/motiz88))
- JS animated node value updates properly when listener is attached ([1f778014a7](https://github.com/facebook/react-native/commit/1f778014a7e95c5c473898c38d5b1e0725cd373c) by [@genkikondo](https://github.com/genkikondo))
- Working around Long paths limitation on Windows ([7b76abc0d3](https://github.com/facebook/react-native/commit/7b76abc0d3a0a5bec37f314c80954e412fc5f5ec) by [@mganandraj](https://github.com/mganandraj))
- Fix VirtualizedList with initialScrollIndex not rendering all elements when data is updated ([c5c17985da](https://github.com/facebook/react-native/commit/c5c17985dae402725abb8a3a94ccedc515428711) by [@AntoineDoubovetzky](https://github.com/AntoineDoubovetzky))

#### Android specific

- Add back hermes inspector support ([6b6adcc111](https://github.com/facebook/react-native/commit/6b6adcc111123bec2c4c110070b2506385e74664) by [@Kudo](https://github.com/Kudo))
- Fixed issue where any node with an AccessibilityDelegate set (which was any node with any accessibility propoerty), was using ExploreByTouchHelper's built in AccessibilityNodeProvider, and not properly populating their AccessibilityNodeInfo's, leading to focus issues and issues with automated test services like UIAutomator. ([70fcab76a4](https://github.com/facebook/react-native/commit/70fcab76a4dcf65e628ac897620fe050758574e3) by [@blavalla](https://github.com/blavalla))
- Fix Extras usage in Android implementation of Linking.sendIntent() ([86f8d0bb52](https://github.com/facebook/react-native/commit/86f8d0bb528a75777c357ae214643ed58c326ca9))
- Fix typo in gradle plugin deprecation message ([41cfd2f976](https://github.com/facebook/react-native/commit/41cfd2f9768e4742eedd299ab467d316d016705e) by [@mikehardy](https://github.com/mikehardy))
- Fixed `TimingModule` related functions for headless JS tasks, eg. `setTimeout` ([dac56ce077](https://github.com/facebook/react-native/commit/dac56ce0776e0e4d23ed4f8b324f2e2432aefa6a) by [@marcesengel](https://github.com/marcesengel))
- Improve support for Android users on M1 machine ([c5babd993a](https://github.com/facebook/react-native/commit/c5babd993a2bed2994ecc4710fa9e424b3e6cfc2) by [@cortinico](https://github.com/cortinico))
- Do not use `rootProject` directly in Gradle scripts ([b2bc5aa5c9](https://github.com/facebook/react-native/commit/b2bc5aa5c903ad057a53d4caa82b0fe74e01c07c) by [@cortinico](https://github.com/cortinico))
- Adding null check for context in redbox surface delegate ([9527ab1584](https://github.com/facebook/react-native/commit/9527ab1584869d7966c562e8aa7cbf48788156a3) by [@ryancat](https://github.com/ryancat))
- Fix crash on empty snapToOffsets array ([145fd041c7](https://github.com/facebook/react-native/commit/145fd041c7afe9a18f08f461487bb515ab2f516a) by [@ryancat](https://github.com/ryancat))
- Fix StatusBar not updating to use translucent values when set to the same value across different activities ([d34a75e9e5](https://github.com/facebook/react-native/commit/d34a75e9e5932adcac4a16f5b815bb909c3aa0dd))
- Fix underlineColorAndroid transparent not working on API 21 ([52aee50a70](https://github.com/facebook/react-native/commit/52aee50a704bbeab91f5fa05fe3220dee304422f) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fixed regression on content in scroll view not responding to touch when fling got interrupted ([bb8ff9260f](https://github.com/facebook/react-native/commit/bb8ff9260fe6a783171f35ce1a459927d8179d08) by [@ryancat](https://github.com/ryancat))
- Fixes android build error when compiling as library ([c34ef5841c](https://github.com/facebook/react-native/commit/c34ef5841cf3a63a9cc96add577d6bf6d52e4397) by [@nickfujita](https://github.com/nickfujita))
- Cancel post touch process when new touch is received ([0368081858](https://github.com/facebook/react-native/commit/0368081858193d7c2537acd9080d11bb701ee98b) by [@ryancat](https://github.com/ryancat))
- Improve rendering of images when resampled and corner radius applied ([f743bed657](https://github.com/facebook/react-native/commit/f743bed657591b078300a6519e3d68db542fd757) by [@javache](https://github.com/javache))
- Fix transform when calculate overflowInset ([0975e96d53](https://github.com/facebook/react-native/commit/0975e96d53546ac05b2154352fe56e5d82e2a1f8) by [@ryancat](https://github.com/ryancat))
- Fix ReactHorizontalScrollView contentOffset ([9f6f97151c](https://github.com/facebook/react-native/commit/9f6f97151c44a0f727c9dd938222be1860ecf3f9) by [@genkikondo](https://github.com/genkikondo))
- Text Component does not announce disabled and disables click functionality when disabled ([7b2d8178b1](https://github.com/facebook/react-native/commit/7b2d8178b155f5f1b247614c46e5e20f31bbd438) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fix StatusBar on Android API 30 ([9ed2df628d](https://github.com/facebook/react-native/commit/9ed2df628ddd410cc3383e68b0386471432445c0) by [@ieatfood](https://github.com/ieatfood))
- Use root locale when converting string case. ([5341ad8962](https://github.com/facebook/react-native/commit/5341ad896245c40a00b6faead1b90d01aac58f8c) by [@halaei](https://github.com/halaei))
- Fix DarkMode on Calendar DateTimePicker ([97064ae1fb](https://github.com/facebook/react-native/commit/97064ae1fbf84a8a6b653c02c5872191b7d2d622) by [@mdvacca](https://github.com/mdvacca))
- Fix ScrollView contentOffset ([be260b9f47](https://github.com/facebook/react-native/commit/be260b9f479a3b55ee43d2959d2c49fd3c1eb4ac) by [@genkikondo](https://github.com/genkikondo))
- Do not bundle libhermes.so or libjsc.so inside the React Native Android AAR ([fa85417179](https://github.com/facebook/react-native/commit/fa854171798e67b8a10820f77d7198315e1784ed) by [@cortinico](https://github.com/cortinico))
- Enable hitSlop to be set using a single number. ([d682753244](https://github.com/facebook/react-native/commit/d682753244feba28c6a15c31966a3da075a090e6) by [@javache](https://github.com/javache))
- Fix crash caused by Image.queryCache parsing null ([ae3d4f7008](https://github.com/facebook/react-native/commit/ae3d4f700843ae4cbb6927ee620095136d1abc3f) by [@skychx](https://github.com/skychx))
- Fix NullPointerException when disaptching events ([fbeb51ef51](https://github.com/facebook/react-native/commit/fbeb51ef5133303a5cb71569507d44403ded3447) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- ScrollView's contentInsetAdjustmentBehavior is reset to Never at every reuse to avoid layout artifacts. ([28a65f4387](https://github.com/facebook/react-native/commit/28a65f438789c29309d6e7c58063a73ca721ef43))
- Prevent Nullptr segfault in TurboModule init path ([7f3cc256b5](https://github.com/facebook/react-native/commit/7f3cc256b5bcbf2e64540ca69401f62ec6869f0e) by [@RSNara](https://github.com/RSNara))
- Expose the extraData dict attached to JavaScript errors to the native ExceptionManager on iOS, similar to Android ([a65ae8eff6](https://github.com/facebook/react-native/commit/a65ae8eff6ec6f9ad283ac8e96f00802421a14da) by [@GijsWeterings](https://github.com/GijsWeterings))
- `RCTLocalizationProvider` Fall back to input when no localization is available ([18196512db](https://github.com/facebook/react-native/commit/18196512db6b8b4469a5e1b098d8892ae72d743a) by [@robhogan](https://github.com/robhogan))
- Update iOS LogBox to render its UIWindow with the key window's UIWindowScene ([d31d83f410](https://github.com/facebook/react-native/commit/d31d83f4109c167ec612058c805fd65f69b82476) by [@vincentriemer](https://github.com/vincentriemer))
- Remove Gemfile.lock from template ([1907bd31f0](https://github.com/facebook/react-native/commit/1907bd31f066865aa1c5fe4ec88e98ee46448771) by [@danilobuerger](https://github.com/danilobuerger))
- Fix `pod install` when `RCT-Folly` version has been updated. ([b2517c3bdc](https://github.com/facebook/react-native/commit/b2517c3bdccc3f9d935f4ee06f959d6ce8f27bbe) by [@fortmarek](https://github.com/fortmarek))
- Fix usage of cocoapods with --project-directory flag and new arch ([2f813f873a](https://github.com/facebook/react-native/commit/2f813f873a1692044ea3461e59ca732a4d952300) by [@danilobuerger](https://github.com/danilobuerger))
- Ensure LogBoxView is sized relative to the key window instead of the full screen ([84f8c9ad55](https://github.com/facebook/react-native/commit/84f8c9ad550f98295d2e718b4b1d6b1ac724b898) by [@vincentriemer](https://github.com/vincentriemer))
- Improved template fastlane gitignore ([f43f05d292](https://github.com/facebook/react-native/commit/f43f05d292fd2fbdf3d5fdfd194ed81b0e346657) by [@danilobuerger](https://github.com/danilobuerger))
- Set RCTView borderColor to UIColor ([267d36d0af](https://github.com/facebook/react-native/commit/267d36d0afb4b3713df9b679c2019c44ac6bcc3f) by [@danilobuerger](https://github.com/danilobuerger))
- Fix action sheet callback invoked more than once on iPad ([8935d6e697](https://github.com/facebook/react-native/commit/8935d6e697dffb0971f5a8ee1dfbc580080de3e0) by [@janicduplessis](https://github.com/janicduplessis))
- Resolve border platform color based on current trait collection ([9a35818797](https://github.com/facebook/react-native/commit/9a3581879764f3f1b2743905e3e54611e96bb618) by [@danilobuerger](https://github.com/danilobuerger))
- Enable custom sound for local push notifications. ([eb19499484](https://github.com/facebook/react-native/commit/eb1949948406195c4c02c6041d07cba074ae820c))
- Invoke registerForRemoteNotifications on main UI thread. ([3633a05299](https://github.com/facebook/react-native/commit/3633a05299d99b12acc5c3c056b977463df1924e))
- Bump flipper pods to get arm64 catalyst slice ([f811da7cc2](https://github.com/facebook/react-native/commit/f811da7cc20cc49ca5c8d4e023d6c61e36e15dd1) by [@fortmarek](https://github.com/fortmarek))
- Fix `pod install --project-directory=ios` failing when Hermes is enabled ([1b22e8a039](https://github.com/facebook/react-native/commit/1b22e8a039081887ffd450596d822bff975d6900), ([eb7cc85a91](https://github.com/facebook/react-native/commit/eb7cc85a9146d058694247178f03d57cc125c97a) by [@tido64](https://github.com/tido64))
- Fix compilation warning in yoga ([52d8a797e7](https://github.com/facebook/react-native/commit/52d8a797e7a6be3fa472f323ceca4814a28ef596) by [@cuva](https://github.com/cuva))
- Prevent deadlock when dispatching events from observers on the same thread. ([68fd1e5508](https://github.com/facebook/react-native/commit/68fd1e55085e871a854563721ee29ca698239607) by [@Pickleboyonline](https://github.com/Pickleboyonline))
- In RCTSurfaceHostingComponent, access ckComponent from main queue to pass assertion ([1874c81003](https://github.com/facebook/react-native/commit/1874c81003b468554c227541fec5e29c4adfb82f) by [@p-sun](https://github.com/p-sun))
- Fix modal redbox for onDismiss ([46f68aceb2](https://github.com/facebook/react-native/commit/46f68aceb20a10c95c92b5ffeb90f289b015a559) by [@HeyImChris](https://github.com/HeyImChris))
- Attempt to fix crash during app termination ([9cd43340a7](https://github.com/facebook/react-native/commit/9cd43340a7e2443564c2ff5e8e85d37f6e1e47ef) by [@sammy-SC](https://github.com/sammy-SC))

### Security

- Encode URL params in URLSearchParams.toString() ([1042a8012f](https://github.com/facebook/react-native/commit/1042a8012fb472bd5c882b469fe507dd6279d562) by [@sshic](https://github.com/sshic))

## v0.68.7

### Fixed

- Use logical operator instead of bit operation in Yoga ([c3ad8](https://github.com/facebook/react-native/commit/c3ad8ec7eb01b7236e0081ac7c7f888630caac21) by [@cuva](https://github.com/cuva))

#### Android specific

- Minimize EditText Spans 8/N: CustomStyleSpan ([b384bb613b](https://github.com/facebook/react-native/commit/b384bb613bf533aebf3271ba335c61946fcd3303) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize EditText Spans 6/N: letterSpacing ([5791cf1f7b](https://github.com/facebook/react-native/commit/5791cf1f7b43aed1d98cad7bcc272d97ab659111) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 5/N: Strikethrough and Underline ([0869ea29db](https://github.com/facebook/react-native/commit/0869ea29db6a4ca20b9043d592a2233ae1a0e7a2) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 4/N: ReactForegroundColorSpan ([8c9c8ba5ad](https://github.com/facebook/react-native/commit/8c9c8ba5adb59f7f891a5307a0bce7200dd3ac7d) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 3/N: ReactBackgroundColorSpan ([cc0ba57ea4](https://github.com/facebook/react-native/commit/cc0ba57ea42d876155b2fd7d9ee78604ff8aa57a) by [@NickGerleman](https://github.com/NickGerleman))
- Minimize Spans 1/N: Fix precedence ([1743dd7ab4](https://github.com/facebook/react-native/commit/1743dd7ab40998c4d3491e3b2c56c531daf5dc47) by [@NickGerleman](https://github.com/NickGerleman))
- Fix measurement of uncontrolled TextInput after edit ([8a0fe30591](https://github.com/facebook/react-native/commit/8a0fe30591e21b90a3481c1ef3eeadd4b592f3ed) by [@NickGerleman](https://github.com/NickGerleman))

## v0.68.6

### Fixed

#### Android specific

- Mitigation for Samsung TextInput Hangs ([be69c8b5a7](https://github.com/facebook/react-native/commit/be69c8b5a77ae60cced1b2af64e48b90d9955be5) by [@NickGerleman](https://github.com/NickGerleman))

## v0.68.5

### Fixed

- Force dependencies resolution to minor series for 0.68 ([edcb3ca996](https://github.com/facebook/react-native/commit/edcb3ca996fb3296762af300a36c1d46356f1b24) by [@Titozzz](https://github.com/Titozzz))

## v0.68.4

### Changed

- Bump version of `promise` from 8.0.3 to 8.2.0, enabling `Promise.allSettled` ([951538c080](https://github.com/facebook/react-native/commit/951538c080ef745da304fb308fa91d597e0dd98a) by [@retyui](https://github.com/retyui))
- Bump react-native-codegen to 0.0.18 ([40a3ae3613](https://github.com/facebook/react-native/commit/40a3ae3613394fe5f0d728bada538d2d5b78a8a4) by [@dmytrorykun](https://github.com/dmytrorykun))

#### Android specific

- Correctly resolve classes with FindClass(..) ([361b310bcc](https://github.com/facebook/react-native/commit/361b310bcc8dddbff42cf63495649291c894d661) by [@evancharlton](https://github.com/evancharlton))

### Fixed

- Codegen should ignore `.d.ts` files ([0f0d52067c](https://github.com/facebook/react-native/commit/0f0d52067cb89fdb39a99021f0745282ce087fc2) by [@tido64](https://github.com/tido64))

#### iOS specific

- Fix the way the orientation events are published ([7d42106d4c](https://github.com/facebook/react-native/commit/7d42106d4ce20c644bda4d928fb0abc163580cee) by [lbaldy](https://github.com/lbaldy))

## v0.68.3

### Changed

#### Android specific

- Let's not build reactnativeutilsjni shared library ([af9225ec5f](https://github.com/facebook/react-native/commit/af9225ec5fd22da802e3da4d786fa7f6ec956b0f) by [@SparshaSaha](https://github.com/SparshaSaha))
- Modified **getDefaultJSExecutorFactory** method ([87cfd386cb](https://github.com/facebook/react-native/commit/87cfd386cb2e02bfa440c94706d9d0274f83070c) by [@KunalFarmah98](https://github.com/KunalFarmah98))

### Fixed

- Use monotonic clock for performance.now() ([114d31feee](https://github.com/facebook/react-native/commit/114d31feeeb47f5a57419e5088c3cbe9340f757a))

#### Android specific

- Logging a soft error when ReactRootView has an id other than -1 instead of crashing the app in hybrid apps ([1ca2c24930](https://github.com/facebook/react-native/commit/1ca2c2493027c1b027146cd41e17dd8a4fc33a41) by [@Kunal-Airtel2022](https://github.com/Kunal-Airtel2022))

## v0.68.2

### Changed

- Bump used version of react-native-codegen to 0.0.17 ([dfda480a98](https://github.com/facebook/react-native/commit/dfda480a9888d95c542cea40f25e8e783565c1db) by [@cortinico](https://github.com/cortinico))
- Bump react-native-codegen to 0.0.17 ([a5ddc2e165](https://github.com/facebook/react-native/commit/a5ddc2e16523ea336ffbecf7acfd4820469a29e7) by [@cortinico](https://github.com/cortinico))

### Fixed

#### Android specific

- Working around Long paths limitation on Windows ([62ef6f5fa1](https://github.com/facebook/react-native/commit/62ef6f5fa1ecb918bde130a6024b65afcd34c7e3) by [@mganandraj](https://github.com/mganandraj))

## v0.68.1

### Changed

#### Android specific

- Bump React Native Gradle plugin to 0.0.6 ([9573d7b84d](https://github.com/facebook/react-native/commit/9573d7b84d35233fbb39a4067cfef65490aa34a7) by [@cortinico](https://github.com/cortinico))
- Don't require yarn for codegen tasks ([d5da70e17e](https://github.com/facebook/react-native/commit/d5da70e17e8c8210cd79a4d7b09c6a5ded4b5607) by [@danilobuerger](https://github.com/danilobuerger))

### Fixed

- Fix dynamic_cast (RTTI) by adding key function to ShadowNodeWrapper and related classes ([58a2eb7f37](https://github.com/facebook/react-native/commit/58a2eb7f37c2dc27ad3575618778ad5b23599b27) by [@kmagiera](https://github.com/kmagiera))
- Pin use-subscription to < 1.6.0 ([5534634892](https://github.com/facebook/react-native/commit/5534634892f47a3890e58b661faa2260373acb25) by [@danilobuerger](https://github.com/danilobuerger))

#### Android specific

- Use NDK 23 only for Windows users. ([e48a580080](https://github.com/facebook/react-native/commit/e48a580080bdae58b375f30fbcf8a83cc1915b2f) by [@cortinico](https://github.com/cortinico))
- Improve support for Android users on M1 machine ([4befd2a29c](https://github.com/facebook/react-native/commit/4befd2a29cb94b026d9c048a041aa9f1817295b5) by [@cortinico](https://github.com/cortinico))
- Template: Specify abiFilters if enableSeparateBuildPerCPUArchitecture is not set. ([5dff920177](https://github.com/facebook/react-native/commit/5dff920177220ae5f4e37c662c63c27ebf696c83) by [@cortinico](https://github.com/cortinico))
- Fix for building new architecture sources on Windows ([5a8033df98](https://github.com/facebook/react-native/commit/5a8033df98296c941b0a57e49f2349e252339bf9) by [@mganandraj](https://github.com/mganandraj))

## v0.68.0

### Breaking Changes

- CI moved to Node 16. ([f1488db109](https://github.com/facebook/react-native/commit/f1488db109d13e748b071c02b40e90cdca1cc79d) by [@kelset](https://github.com/kelset)).
  This change enforces Node >= 14 for React Native builds.
- Bump Android Gradle Plugin to 7.0.1. ([272cfe5d13](https://github.com/facebook/react-native/commit/272cfe5d1371c38a281cf3883ff0254a8d3505a3) by [@dulmandakh](https://github.com/dulmandakh))
  This version of Android Gradle plugin enforces JDK 11 for Android builds. Do not upgrade to AGP 7.1 as it is not supported by this version of react-native.
- Removed `fallbackResource` from `RCTBundleURLProvider` API ([0912ee179c](https://github.com/facebook/react-native/commit/0912ee179c210fb6b2ed9afbb3f2fbc5fb8a2bb3)) by [@philIip](https://github.com/philIip)

### New Architecture

*If you are interested in enabling the new architecture, please refer to [the dedicated documentation](https://reactnative.dev/docs/next/new-architecture-intro).*

- Do not include Facebook license on users codegen'd code ([450967938a](https://github.com/facebook/react-native/commit/450967938ab25c4dabb9d5ecd9f7b57afb1c78dd) by [@cortinico](https://github.com/cortinico))

#### Android specific

- Setup a `newArchEnabled` property to Opt-in the New Architecture in the template ([8d652fba4c](https://github.com/facebook/react-native/commit/8d652fba4ce07256784a1b7e86713c810336856d) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Add fabric option to the default app template. ([2e9a376c84](https://github.com/facebook/react-native/commit/2e9a376c8488d1fb11c0b5d604137712321fd90d) by [@sota000](https://github.com/sota000))
- Add turbo module support in the default app template. ([8ec0e6919c](https://github.com/facebook/react-native/commit/8ec0e6919c5fab118c8b54538860ee36009bfaa7) by [@sota000](https://github.com/sota000))
- Rename the new architecture flag to RCT_NEW_ARCH_ENABLED. ([c0c5439959e](https://github.com/facebook/react-native/commit/c0c5439959e21d7806178bb9139c2cd19b857506) by [@sota000](https://github.com/sota000))

### Added

- Create @fb-tools-support/yarn package ([7db294d6d5](https://github.com/facebook/react-native/commit/7db294d6d5b00a38f305dd52be3e0961f35695c8) by [@motiz88](https://github.com/motiz88))
- Support string color values in Animated.Color ([d3a0c4129d](https://github.com/facebook/react-native/commit/d3a0c4129d6a5a7beced4e9aa62b2da4e3f4fed4))
- New Animated.Color node ([ea90a76efe](https://github.com/facebook/react-native/commit/ea90a76efef60df0f46d29228289f8fc1d26f350))
- Added linter warning config for unstable nested components ([988fefc44d](https://github.com/facebook/react-native/commit/988fefc44d39957e8c5e1eecb02dfd1ce119f34c) by [@javache](https://github.com/javache))
- Option to supply `platformConfig` to NativeAnimated ([4a227ce2ab](https://github.com/facebook/react-native/commit/4a227ce2ab3f8c181150461ab28b831979093db0) by [@rozele](https://github.com/rozele))
- Animated.event can be used to extract values with numeric keys from native events ([b2105711a0](https://github.com/facebook/react-native/commit/b2105711a0b90859f8e3fc1aaec4998e252c2d14) by [@javache](https://github.com/javache))
- Adds a setSelection imperative method to TextInput ([771ca921b5](https://github.com/facebook/react-native/commit/771ca921b59cc3b3fd12c8fe3b08ed150bcf7a04) by [@lyahdav](https://github.com/lyahdav))
- Native-only prop to optimize text hit testing on some RN platforms ([f3bf2e4f51](https://github.com/facebook/react-native/commit/f3bf2e4f51897f1bb71e37002c288ebf3b23cf78) by [@rozele](https://github.com/rozele))

#### Android specific

- Added DoNotStripAny proguard rules ([48318b1542](https://github.com/facebook/react-native/commit/48318b1542910b939ab977c0bc82e98f098abe50) by [@ShikaSD](https://github.com/ShikaSD))
- Add new API in ScrollView and HorizontalScrollView to process pointerEvents prop. ([48f6967ae8](https://github.com/facebook/react-native/commit/48f6967ae88100110160e1faf03e6c0d37e404bd) by [@ryancat](https://github.com/ryancat))
- Add `accessibilityLabelledBy` props ([36037fa81b](https://github.com/facebook/react-native/commit/36037fa81bbdcc460057e7e7cf608cd364ca48a6) by [@grgr-dkrk](https://github.com/grgr-dkrk))
- Added missing constructor to WritableNativeArray ([c68c47d2ba](https://github.com/facebook/react-native/commit/c68c47d2bafa8e8e25b534d6cdd1a63bc77a1cf4) by [@piaskowyk](https://github.com/piaskowyk))
- Add new API for custom fling animator to provide predicted travel distance for its fling animation. ([fe6277a30d](https://github.com/facebook/react-native/commit/fe6277a30d3ec19e4772991e30ae20c3a9cfe565) by [@ryancat](https://github.com/ryancat))
- Adding new API `onChildEndedNativeGesture` to the RootView interface to let its implementations notify the JS side that a child gesture is ended. ([9b33c31ee0](https://github.com/facebook/react-native/commit/9b33c31ee024bae30e441107f838e1b5044525ba) by [@ryancat](https://github.com/ryancat))
- Make the `reactNativeArchitectures` property more discoverable ([0f39a1076d](https://github.com/facebook/react-native/commit/0f39a1076dc154995a2db79352adc36452f46210) by [@cortinico](https://github.com/cortinico))
- Added `isAccessibilityServiceEnabled` to get if accessibility services are enabled ([c8b83d4e0b](https://github.com/facebook/react-native/commit/c8b83d4e0b33c2af45093f7b2262ee578ece2faf) by [@grgr-dkrk](https://github.com/grgr-dkrk))
- Add bundleForVariant option ([d2c10da5d5](https://github.com/facebook/react-native/commit/d2c10da5d5687833545691f281473381e4466c2e) by [@grit96](https://github.com/grit96))
- Add ACCEPT_HANDOVER, ACTIVITY_RECOGNITION, ANSWER_PHONE_CALLS, READ_PHONE_NUMBERS & UWB_RANGING to PermissionsAndroid ([4b25a0aaa0](https://github.com/facebook/react-native/commit/4b25a0aaa077caf9c437bcfeef8a226eda5a102e) by [@iBotPeaches](https://github.com/iBotPeaches))

#### iOS specific

- Add new argument to announceForAccessibility to allow queueing on iOS ([4d1357918a](https://github.com/facebook/react-native/commit/4d1357918a4dcb331ccea2140699f487ca45ea30) by [@peterc1731](https://github.com/peterc1731))
- Add volta support to find-node.sh ([765844055b](https://github.com/facebook/react-native/commit/765844055ba0d02262a11114bad5da67e935d8df) by [@liamjones](https://github.com/liamjones))
- Support fnm when detecting node binary ([c9e4d34885](https://github.com/facebook/react-native/commit/c9e4d3488578d65e55198ad597252a2ac8cc5f73) by [@MoOx](https://github.com/MoOx))
- Find-node.sh now respects .nvmrc ([35bcf934b1](https://github.com/facebook/react-native/commit/35bcf934b186e581d100d43e563044300759557f) by [@igrayson](https://github.com/igrayson))
- Add macros to be able to stub C functions in tests ([749a9207b6](https://github.com/facebook/react-native/commit/749a9207b6f0545c03ca83efbda7971ffd4d2d57) by [@philIip](https://github.com/philIip))


### Changed

- Bump RN CLI to v7.0.3, and Metro to 67 ([848ba6fb1d](https://github.com/facebook/react-native/commit/848ba6fb1db81bbb44efd373af9e81f31f227aef) by [@kelset](https://github.com/kelset)) and ([df2e934a69](https://github.com/facebook/react-native/commit/df2e934a697b5b207053db3bbcf71492932a6062) by [@kelset](https://github.com/kelset))
- Upgraded react-devtools-core dependency to 4.23.0 ([1cc217d5ef](https://github.com/facebook/react-native/commit/1cc217d5effdbee4cf2f64063a443ecb331673d4) by [@bvaughn](https://github.com/bvaughn))
- Bump Flipper to 0.125.0 ([50057158ca](https://github.com/facebook/react-native/commit/50057158ca32842d70160541e3cb5d4bd512f8f5) by [@cortinico](https://github.com/cortinico))
- Export Flow type for deceleration rate for use in other files to keep deceleration rate prop values consistently typed ([9b0ed920ef](https://github.com/facebook/react-native/commit/9b0ed920ef087c4c18504adacf9d4f557812cf1b))
- Upgrade deprecated-react-native-prop-types dependency ([badd30885f](https://github.com/facebook/react-native/commit/badd30885fb999124b6b54b3fb016edbd988c16b) by [@chiaramooney](https://github.com/chiaramooney))
- Improved error message in react.gradle ([7366a866b3](https://github.com/facebook/react-native/commit/7366a866b381db6fc5615153e7788aa4828cfd96) by [@vonovak](https://github.com/vonovak))
- Upgraded packages to the latest versions for ESLint v7. ([cf763cdf81](https://github.com/facebook/react-native/commit/cf763cdf816e1cad20caf2347c54bc96c7f6dd47) by [@yungsters](https://github.com/yungsters))
- Updated the links for the discussions and changelog ([daf37a1fce](https://github.com/facebook/react-native/commit/daf37a1fce43403e6320e1e3023e86fd1b970bdf) by [@MikeyAlmighty](https://github.com/MikeyAlmighty))
- XMLHttpRequest.getAllResponseHeaders() now returns headers with names lowercased and sorted in ascending order, as per specification ([b2415c4866](https://github.com/facebook/react-native/commit/b2415c48669391ee1ab7c6450748c4d91097a666) by [@ascherkus](https://github.com/ascherkus))
- Bump react-native-codegen to 0.0.9 ([e3a71b019f](https://github.com/facebook/react-native/commit/e3a71b019fa78e2b4b3454ccc59ea9c8cc543b29) by [@cortinico](https://github.com/cortinico))
- Accessing `Image.propTypes`, `Text.propTypes`, `TextInput.propTypes`, `ColorPropType`, `EdgeInsetsPropType`, `PointPropType`, or `ViewPropTypes` now emits a deprecation warning. ([3f629049ba](https://github.com/facebook/react-native/commit/3f629049ba9773793978cf9093c7a71af15e3e8d) by [@yungsters](https://github.com/yungsters))
- Bump `core-workflow-apply-version-label` version ([e973b3afc2](https://github.com/facebook/react-native/commit/e973b3afc274f892a0e5a6fdea9004dc5d84eb2b) by [@lucasbento](https://github.com/lucasbento))
- Add `vendor/bundle` into .gitignore template ([2f67f5d68b](https://github.com/facebook/react-native/commit/2f67f5d68b17010c49f2996a788fe68c1fe2e9f6) by [@MoOx](https://github.com/MoOx))

#### Android specific

- Add allowsEdgeAntialiasing on views with rotations or skew transforms ([e6a3410afe](https://github.com/facebook/react-native/commit/e6a3410afe7d9a4cecf3db0a95503d2ff05bb862))
- Bump Kotlin version to 1.6.10 ([d0f0234656](https://github.com/facebook/react-native/commit/d0f0234656dc981b422d1e9aa0885afd5fd29879) by [@AKB48](https://github.com/AKB48))
- Bump Soloader to 0.10.3 ([f45889ef95](https://github.com/facebook/react-native/commit/f45889ef95ec694520e91b0032e591a087e088e5) by [@osartun](https://github.com/osartun))
- Bump Gradle to 7.3 ([c180627ac7](https://github.com/facebook/react-native/commit/c180627ac7e5e155707b3c9433c4582839e1820e) by [@dulmandakh](https://github.com/dulmandakh))
- Bump Android compile and target SDK to 31 ([00ac034353](https://github.com/facebook/react-native/commit/00ac034353cbc867991bf79cb1dd103353f47126) by [@ShikaSD](https://github.com/ShikaSD))
- Use side-by-side NDK for Android ([bd7caa64f5](https://github.com/facebook/react-native/commit/bd7caa64f5d6ee5ea9484e92c3629c9ce711f73c) by [@cortinico](https://github.com/cortinico))
- Leverage Gradle implicit dependency substitution for Gradle Plugin ([0fccbd53af](https://github.com/facebook/react-native/commit/0fccbd53af86083a8742a33282dc183d07eb27a2) by [@cortinico](https://github.com/cortinico))
- Remove unused import of JMessageQueueThread.h ([705236e363](https://github.com/facebook/react-native/commit/705236e3637e4f80e5fa4bd7234df9f1e14a5d3d) by [@sshic](https://github.com/sshic))
- Made `MessageQueueThread#runOnQueue` return a boolean. Made `MessageQueueThreadImpl#runOnQueue` return false when the runnable is not submitted. ([89faf0c9a8](https://github.com/facebook/react-native/commit/89faf0c9a87f6de68ca416d10566dbcbe80d9450))
- Assume *.ktx assets are packaged as Android drawables ([cb610ddca7](https://github.com/facebook/react-native/commit/cb610ddca79fe29b88568545ab011671fc392c9a) by [@motiz88](https://github.com/motiz88))
- Add ViewConfigs to support onEnter/onExit/onMove events ([44143b50fd](https://github.com/facebook/react-native/commit/44143b50fdcafe22caa43d76ec3210132ce3af21) by [@mdvacca](https://github.com/mdvacca))
- Let react_native_assert really abort the app ([2ae06df58f](https://github.com/facebook/react-native/commit/2ae06df58f5f5eaf4386c14d28af25b643401bf3) by [@cortinico](https://github.com/cortinico))
- Bugfix for multiple shadow threads rendered at the same time, small probability crash. ([9d71b166a6](https://github.com/facebook/react-native/commit/9d71b166a6c9d9afec7186c6a33aedc6975aa43c) by [@chenmo187](https://github.com/chenmo187))
- RootView's onChildStartedNativeGesture now takes the child view as its first argument ([03e513de41](https://github.com/facebook/react-native/commit/03e513de41bf60f071eacbbb9604c83605abf625) by [@javache](https://github.com/javache))
- Add ReactInstanceEventListenerV2 for migration ([ce74aa4ed3](https://github.com/facebook/react-native/commit/ce74aa4ed335d4c36ce722d47937b582045e05c4) by [@sshic](https://github.com/sshic))
- Improved logic of findTargetPathAndCoordinatesForTouch ([dfe42d6b75](https://github.com/facebook/react-native/commit/dfe42d6b75005f519c0e2c87c75e7886dce3345c) by [@javache](https://github.com/javache))
- Set a resolution strategy for com.facebook.react:react-native when on New Architecture ([e695bc0bb5](https://github.com/facebook/react-native/commit/e695bc0bb50fc1c712e9862ed8fe4e7cc6619fae) by [@cortinico](https://github.com/cortinico))
- Make hermes-executor-common a static lib ([b2cf24f41c](https://github.com/facebook/react-native/commit/b2cf24f41cb5f15653b34d396ef2a1c90defdf43) by [@janicduplessis](https://github.com/janicduplessis))
- Static link for hermes-inspector ([20b0eba581](https://github.com/facebook/react-native/commit/20b0eba581a00e5e7e300f6377379b836617c147) by [@janicduplessis](https://github.com/janicduplessis))

#### iOS specific

- Don't capitalize the first letter of a word that is starting by a number ([8b5a5d4645](https://github.com/facebook/react-native/commit/8b5a5d4645136ef3d6ee043348e583cbbac87ee3) by [@MaeIg](https://github.com/MaeIg))
- updated `jsBundleURLForBundleRoot:fallbackResource` to `jsBundleURLForBundleRoot:` ([aef843bfe6](https://github.com/facebook/react-native/commit/aef843bfe60bda6bcc98d3fb4a6c295c9f4b66e3) by [@philIip](https://github.com/philIip))
- Remove iOS 11 availability check ([9b059b6709](https://github.com/facebook/react-native/commit/9b059b67092f4e7d568867a2b3a51dfd7c6f1db6) by [@ken0nek](https://github.com/ken0nek))
- Refactor: Assign string label to each case in RCTPLTag enum for startup performance logging ([60e60a9b3d](https://github.com/facebook/react-native/commit/60e60a9b3d42d342eaf5ddee4841b121f6474a6c) by [@p-sun](https://github.com/p-sun))
- IOS Ruby Updates ([1e6add1a43](https://github.com/facebook/react-native/commit/1e6add1a43355bb88c57400a7420a656966bef97) by [@barbieri](https://github.com/barbieri))
- Update Flipper pods to support re-enable macCatalyst ([2a5265dff7](https://github.com/facebook/react-native/commit/2a5265dff7e654f57b43335804840692313f2a56) by [@mikehardy](https://github.com/mikehardy))
- Apple Silicon builds of glog & Flipper-Glog ([274c617f5b](https://github.com/facebook/react-native/commit/274c617f5bda263ff29115b3dcc013e47085a78d) by [@rayzr522](https://github.com/rayzr522))

### Fixed

- Fix error "mockModal is not a function" ([507b05f4c0](https://github.com/facebook/react-native/commit/507b05f4c02b46109f483a2b79c924a775fd7bd3) by [@AntoineDoubovetzky](https://github.com/AntoineDoubovetzky))
- Fixes execution of animation when a toValue of AnimatedValue is used. ([8858c21124](https://github.com/facebook/react-native/commit/8858c2112421be5212c024f9e404e66437a41389))
- Fix RN version syntax to match new nightly build structure. ([3d1d4ee457](https://github.com/facebook/react-native/commit/3d1d4ee4572600425b8eb5d0d6512bb0d2a6ea44) by [@chiaramooney](https://github.com/chiaramooney))
- Fix typo in _updateBottomIfNecessary function on KeyboardAvoidingView component ([0cc80b4d0c](https://github.com/facebook/react-native/commit/0cc80b4d0cb78a835977dbe5100262a16882bbea) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- Fix: Removes interface only check from third party components GenerateThirdPartyFabricComponentsProvider ([3e6902244a](https://github.com/facebook/react-native/commit/3e6902244a0d189261dbbe327296db1349e37410) by [@Ubax](https://github.com/Ubax))
- Set CxxModules' Instance before retrieving their Method vector. ([1d45b20b6c](https://github.com/facebook/react-native/commit/1d45b20b6c6ba66df0485cdb9be36463d96cf182) by [@JunielKatarn](https://github.com/JunielKatarn))
- AnimatedValue.__detach should store getValue result with offset deducted ([fe53cae954](https://github.com/facebook/react-native/commit/fe53cae954b37528eeaa1258ac0060c4298473bb) by [@rozele](https://github.com/rozele))
- AnimatedValue.stopAnimation callback with correct value for NativeAnimated ([8ba771c3dd](https://github.com/facebook/react-native/commit/8ba771c3ddc00b1499e95a2812b4cd5ac904c8df) by [@rozele](https://github.com/rozele))
- ESLint no-undef rule clashing with TypeScript compiler for TS files ([ae67c5ac45](https://github.com/facebook/react-native/commit/ae67c5ac45a8044fc1db66aee8eae6e881d660e4) by [@fiznool](https://github.com/fiznool))
- ESLint `no-shadow` rule returning false positive for TypeScript enums ([722a0ff6f8](https://github.com/facebook/react-native/commit/722a0ff6f88bed4d54579a2b8bc574e87948187f) by [@fiznool](https://github.com/fiznool))
- Fix support for custom port ([b399c2e3d1](https://github.com/facebook/react-native/commit/b399c2e3d10fa521dbec87243d3e96f6bca7df1e) by [@enniel](https://github.com/enniel))
- `onLayout` prop is handled correctly in `<KeyboardAvoidingView>` ([9c5e177a79](https://github.com/facebook/react-native/commit/9c5e177a79c64c77f281ce727538973e8222e975))
- Modal accepts a testID but didn't forward it to RCTModalHostView, therefore not making it show up for e2e tests depending on viewhierarchy. ([5050e7eaa1](https://github.com/facebook/react-native/commit/5050e7eaa17cb417baf7c20eb5c4406cce6790a5) by [@GijsWeterings](https://github.com/GijsWeterings))
- Remove unused and incorrect type declarations in WebSocketInterceptor ([91728e2266](https://github.com/facebook/react-native/commit/91728e2266375b954302ba0cd4b5daf641aefc23) by [@mischnic](https://github.com/mischnic))
- Complete missing Flow declarations in URL ([98abf1b02f](https://github.com/facebook/react-native/commit/98abf1b02f64ad40d523335e677a2ede15b3650d) by [@mischnic](https://github.com/mischnic))
- Pressable not passing hover props and event handlers to PressabilityConfig ([1b30dd074b](https://github.com/facebook/react-native/commit/1b30dd074b579c2ae138a1111d07ddb56761315d) by [@Saadnajmi](https://github.com/Saadnajmi))
- Composite animations will now be ran immediately when the app is in testing mode ([b03e824c52](https://github.com/facebook/react-native/commit/b03e824c52123219a5c8fbd89473391bf0bc31c8) by [@javache](https://github.com/javache))
- Remove duplicate class members ([c0e489b729](https://github.com/facebook/react-native/commit/c0e489b7293f15858cb706f1b8587600e429af28) by [@bradzacher](https://github.com/bradzacher))
- Fix: Use same implementation for `performance.now()` on iOS and Android ([1721efb54f](https://github.com/facebook/react-native/commit/1721efb54ff9cc4f577b5ae27f13fcf56801a92c) by [@mrousavy](https://github.com/mrousavy))

#### Android specific

- Enable cliPath to have an absolute path value ([5d560ca99f](https://github.com/facebook/react-native/commit/5d560ca99ff7220de11d2d76dbe77d73990894a8) by [@Krisztiaan](https://github.com/Krisztiaan))
- Make sure configureNdkBuild* tasks are depending on preBuild ([2fdbf6a10f](https://github.com/facebook/react-native/commit/2fdbf6a10fe67fa3209a51a1105a97c16991f561) by [@cortinico](https://github.com/cortinico))
- Added a null check to native.value in Switch to fix https://github.com/facebook/react-native/issues/32594 ([8d50bf1133](https://github.com/facebook/react-native/commit/8d50bf113352a6ccdf74c979e1022c6c2ccf6e56) by [@jonathanmos](https://github.com/jonathanmos))
- Fix overflowInset calculation by using transform values ([8aa87814f6](https://github.com/facebook/react-native/commit/8aa87814f62e42741ebb01994796625473c1310f) by [@ryancat](https://github.com/ryancat))
- Add missing sources jar into published android artifacts ([384e1a0c7b](https://github.com/facebook/react-native/commit/384e1a0c7bc50d2aab5b59bcedcea5a3e98f1659) by [@Kudo](https://github.com/Kudo))
- Fix math for detecting if children views are in parent's overflowInset area. ([45244ebce2](https://github.com/facebook/react-native/commit/45244ebce228dfbc3412670e64c11491ba8d8c47) by [@ryancat](https://github.com/ryancat))
- Fixed empty screen after retrying a BundleDownloader failure in dev mode ([c8d823b9bd](https://github.com/facebook/react-native/commit/c8d823b9bd9619dfa1f5851af003cc24ba2e8830) by [@samkline](https://github.com/samkline))
- Fix crash from ScrollView that occurs while reporting an error from JS ([2151d11527](https://github.com/facebook/react-native/commit/2151d1152719a230565165f1a8dcfab172689eb3) by [@JoshuaGross](https://github.com/JoshuaGross))
- Enable hitSlop to be set using a single number. ([589b129581](https://github.com/facebook/react-native/commit/589b129581903a737a64e14eab3f2e29620831d5) by [@javache](https://github.com/javache))
- Fix fling and snap with recycler viewgroup where fling to the end of scrollable distance when it goes over current rendered children views. ([ead7b97944](https://github.com/facebook/react-native/commit/ead7b97944522e3066ceb2bd50c63c268c961277) by [@ryancat](https://github.com/ryancat))
- Fixed edge case for quick small scrolls causing unexpected scrolling behaviors. ([f70018b375](https://github.com/facebook/react-native/commit/f70018b37532622f08f20b2c51cdbfca55d730ea) by [@ryancat](https://github.com/ryancat))
- Fix crash on ReactEditText with AppCompat 1.4.0 ([e21f8ec349](https://github.com/facebook/react-native/commit/e21f8ec34984551f87a306672160cc88e67e4793) by [@cortinico](https://github.com/cortinico))
- Do not .lowerCase the library name when codegenerating TurboModule Specs ([28aeb7b865](https://github.com/facebook/react-native/commit/28aeb7b8659b38ee3a27fae213c4d0800f4d7e31) by [@cortinico](https://github.com/cortinico))
- Enable hitSlop to be set using a single number. ([a96bdb7154](https://github.com/facebook/react-native/commit/a96bdb7154b0d8c7f43977d8a583e8d2cbdcb795) by [@javache](https://github.com/javache))
- Updated TextInput prop types to accommodate for new autoComplete values ([9eb0881c8f](https://github.com/facebook/react-native/commit/9eb0881c8fecd0e974b1cb9f479bad3075854340) by [@TheWirv](https://github.com/TheWirv))
- Don't reconstruct app components https://github.com/facebook/react-native/issues/25040 ([fc962c9b6c](https://github.com/facebook/react-native/commit/fc962c9b6c4bf9f88decbe014ab9a9d5c1cf51bc) by [@Somena1](https://github.com/Somena1))
- Do NOT skip the first child view in the scroll view group when measuring the lower and upper bounds for snapping. ([61e1b6f86c](https://github.com/facebook/react-native/commit/61e1b6f86cf98d8a74eeb9353143fe0c624fe6e6) by [@ryancat](https://github.com/ryancat))
- Fix crash when a Switch is initialised with both backgroundColor and thumbColor. ([456cf3db14](https://github.com/facebook/react-native/commit/456cf3db14c443c483d63aa97c88b45ffd25799b) by [@smarki](https://github.com/smarki))
- Fix devDisabledIn not working with multiple productFlavors ([055ea9c7b7](https://github.com/facebook/react-native/commit/055ea9c7b7dea030ef16da72d1f6ecb5d95ac468) by [@grit96](https://github.com/grit96))
- Revert `ReactScrollView` to use `Context` instead of `ReactContext` in the constructor to be less restrictive. ([7b77cc637e](https://github.com/facebook/react-native/commit/7b77cc637e1faf4a2b134853f8415f277d0decdc) by [@ryancat](https://github.com/ryancat))
- Fix onPress event for nested Text in RN Android ([e494e4beb6](https://github.com/facebook/react-native/commit/e494e4beb6a124008fd116178cbc38335bd87809) by [@mdvacca](https://github.com/mdvacca))
- Fix enableVmCleanup not working for apps with product flavors ([a2b5e4cd82](https://github.com/facebook/react-native/commit/a2b5e4cd825a358419cef1e3823b72215b689686) by [@cortinico](https://github.com/cortinico))
- Prevent NPE on ThemedReactContext ([f1b5fe1d3e](https://github.com/facebook/react-native/commit/f1b5fe1d3ea49294d8c89accfa27d76a1a97ccea) by [@sshic](https://github.com/sshic))
- fix: jvm 11 error message from ReactPlugin.kt and react.gradle ([4e947ecb2d](https://github.com/facebook/react-native/commit/4e947ecb2dabfa0226af7f859c828847b4d891c0) by [@nomi9995](https://github.com/nomi9995))

#### iOS specific

- ScrollView: Respect `contentInset` when animating new items with `autoscrollToTopThreshold`, make `automaticallyAdjustKeyboardInsets` work with `autoscrollToTopThreshold` (includes vertical, vertical-inverted, horizontal and horizontal-inverted ScrollViews) ([49a1460a37](https://github.com/facebook/react-native/commit/49a1460a379e3a71358fb38888477ce6ea17e81a) by [@mrousavy](https://github.com/mrousavy))
- Prevent RCTConvert error for allowed null blob types ([e1b698c5f2](https://github.com/facebook/react-native/commit/e1b698c5f2b1d689fb3940f8c6a3e298d381ea3a) by [@habovh](https://github.com/habovh))
- Migrate ScreenshotManager from NativeModule to TurboModule ([b13e41d98e](https://github.com/facebook/react-native/commit/b13e41d98e818279d1941f3425707d3c0ce407fc) by [@p-sun](https://github.com/p-sun))
- Fix usage of cocoapods with --project-directory flag and new arch ([9e7d91f2fc](https://github.com/facebook/react-native/commit/9e7d91f2fc4d576b8fba81304a24e50134da93d6) by [@danilobuerger](https://github.com/danilobuerger))
- Post RCTContentDidAppearNotification with new arch ([75105e692c](https://github.com/facebook/react-native/commit/75105e692c2be9bd192089a6a6ffde7572ee1ce1) by [@danilobuerger](https://github.com/danilobuerger))
- Remove absolute paths from pods project ([42b01a32a1](https://github.com/facebook/react-native/commit/42b01a32a137f18ae9fd2f00914f2edb0e107421) by [@danilobuerger](https://github.com/danilobuerger))
- Respect RCTSetDefaultFontHandler chosen font ([89efa1a0c1](https://github.com/facebook/react-native/commit/89efa1a0c1b633bf9edee66583800ad3fc54ce63) by [@danilobuerger](https://github.com/danilobuerger))
- Fixed duplicated UUIDs problem during pod install phase. ([f595a4e681](https://github.com/facebook/react-native/commit/f595a4e681e75aaf737b6582f69855d76a1f33dd))
- Fix `Time.h` patch not being applied when running `pod install --project-directory=ios` ([60cef850bd](https://github.com/facebook/react-native/commit/60cef850bd3fd12c32ee1196bd19a559592d1465) by [@tido64](https://github.com/tido64))
- Fix WebSocket control frames having payloads longer than 125 bytes ([86db62b7a8](https://github.com/facebook/react-native/commit/86db62b7a8b28ac82dd0a0627a8b6c351875f682) by [@asmeikal](https://github.com/asmeikal))
- Stop RedBox from appearing for LogBox handled errors ([9d2df5b8ae](https://github.com/facebook/react-native/commit/9d2df5b8ae95b3cfeae26f64bd1d50bd2b0bbae9) by [@liamjones](https://github.com/liamjones))
- Enable hitSlop to be set using a single number. ([3addafa525](https://github.com/facebook/react-native/commit/3addafa5257ade685216900bebbad8c35e24e124) by [@javache](https://github.com/javache))
- Fix `__apply_Xcode_12_5_M1_post_install_workaround` failing when one of the Pods has no IPHONEOS_DEPLOYMENT_TARGET set ([9cd4092336](https://github.com/facebook/react-native/commit/9cd40923362ff717a722f8f36c8250a29a5142b7) by [@Yonom](https://github.com/Yonom))
- This is a quick speculative fix since we know `CFRunLoopPerformBlock` does not push/pop an autorelease pool. ([3fff164dfa](https://github.com/facebook/react-native/commit/3fff164dfa1c97f69b1701e974effc92a94152d6) by [@christophpurrer](https://github.com/christophpurrer))
- Fixed RCTImageLoaderTests ([1542f83527](https://github.com/facebook/react-native/commit/1542f835273c08776b960929b5aa7cefbd225971) by [@philIip](https://github.com/philIip))
- Fix Rosetta2 CocoaPods warning on Apple Silicon ([e918362be3](https://github.com/facebook/react-native/commit/e918362be3cb03ae9dee3b8d50a240c599f6723f) by [@oblador](https://github.com/oblador))
- Fix `pod install --project-directory=ios` failing due to wrong path to `React-Codegen` ([ebb26cf2e4](https://github.com/facebook/react-native/commit/ebb26cf2e420616c8bf01a5148ca4f8419b238d3) by [@tido64](https://github.com/tido64))

### Deprecated

#### Android specific

- Gradle: Deprecate `reactRoot` in favor of `root` and `reactNativeDir` ([8bc324fd34](https://github.com/facebook/react-native/commit/8bc324fd34337ab159e2e21e213a6c5b06c548da) by [@cortinico](https://github.com/cortinico))


### Removed

- DeprecatedPropTypes (deep-link) modules removed from React Native. ([23717c6381](https://github.com/facebook/react-native/commit/23717c6381a41b1c5f189376bfa5bc73c7a4da87) by [@yungsters](https://github.com/yungsters))
- `accessibilityStates` no longer passed through to RCTView. ([1121ed94ab](https://github.com/facebook/react-native/commit/1121ed94ab470be27207b0c8dbae5d19860c08da) by [@luism3861](https://github.com/luism3861))

#### iOS specific

- Remove RCTUIManagerObserver from RCTNativeAnimatedTurboModule ([e9ed115bab](https://github.com/facebook/react-native/commit/e9ed115babbc82968380dae22fa928d4ce3cd6da) by [@p-sun](https://github.com/p-sun))

## v0.67.5

🚨 **IMPORTANT:** This is an exceptional release on an unsupported version. We recommend you upgrade to one of [the supported versions, listed here](https://github.com/reactwg/react-native-releases#which-versions-are-currently-supported).

### Fixed

- Force dependencies resolution to minor series for 0.67 ([9f2acda1b8](https://github.com/facebook/react-native/commit/9f2acda1b807e790b3e7562ce3436b93bcc2ad09) by [@cortinico](https://github.com/cortinico))

## v0.67.4

### Fixed

#### Android specific

- Added a null check to native.value in Switch to fix https://github.com/facebook/react-native/issues/32594 ([8d50bf1133](https://github.com/facebook/react-native/commit/8d50bf113352a6ccdf74c979e1022c6c2ccf6e56) by [@jonathanmos](https://github.com/jonathanmos))

## v0.67.3

### Fixed

#### Android specific

- Text with adjustsFontSizeToFit changes the text layout infinitely ([c1db41f060](https://github.com/facebook/react-native/commit/c1db41f060908e6ab001aaace7c20c610056f59a))

#### iOS specific

- Fix a broken input for the Korean alphabet in TextInput ([1a83dc36ce](https://github.com/facebook/react-native/commit/1a83dc36ce0af33ac7a3c311354fce4bfa5ba1a3) by [@bernard-kms](https://github.com/bernard-kms))

## v0.67.2

### Fixed

- Fix error "mockModal is not a function" ([507b05f4c0](https://github.com/facebook/react-native/commit/507b05f4c02b46109f483a2b79c924a775fd7bd3) by [@AntoineDoubovetzky](https://github.com/AntoineDoubovetzky))

#### Android specific

- Fix potential crash if ReactRootView does not have insets attached. ([6239e2f5ce](https://github.com/facebook/react-native/commit/6239e2f5ce82f7c2e683eb4699b9ce3ff1b58ac5) by [@enahum](https://github.com/enahum))
- Upgrading OkHttp from 4.9.1 to 4.9.2 to fix CVE-2021-0341. ([e896d21](https://github.com/facebook/react-native/commit/e896d21ced3c0c917c2fc0044d2b93b44df9a081) by [@owjsub](https://github.com/owjsub))

#### iOS specific

- Fix `Time.h` patch not being applied when running `pod install --project-directory=ios` ([60cef850bd](https://github.com/facebook/react-native/commit/60cef850bd3fd12c32ee1196bd19a559592d1465) by [@tido64](https://github.com/tido64))
- Find-node.sh now respects .nvmrc ([35bcf934b1](https://github.com/facebook/react-native/commit/35bcf934b186e581d100d43e563044300759557f) by [@igrayson](https://github.com/igrayson))

## v0.67.1

### Fixed

#### Android specific

- Do not remove libjscexecutor.so from release builds ([574a773f8f](https://github.com/facebook/react-native/commit/574a773f8f55fe7808fbb672066be8174c64d76d) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- Remove alert's window when call to `hide`. ([a46a99e120](https://github.com/facebook/react-native/commit/a46a99e12039c2b92651af1996489d660e237f1b) by [@asafkorem](https://github.com/asafkorem))

## v0.67.0

### Added

#### Android specific
- Add `ACCESS_MEDIA_LOCATION` permission to PermisionsAndroid library. ([79db483568](https://github.com/facebook/react-native/commit/79db4835681f5d0149620ec8e0990411cb882241) by [@Skrilltrax](https://github.com/Skrilltrax))
- Implement `SnapToAlignment` in `ReactScrollView` ([e774c037bc](https://github.com/facebook/react-native/commit/e774c037bce40a4b48e78d2d0a1085a1e4f5a328)), `ReactScrollViewManager` ([c6e5640e87](https://github.com/facebook/react-native/commit/c6e5640e87e7cb5b514ded2c8d4cbb039bd02c5f)), `ReactHorizontalScrollView` ([b12256394e](https://github.com/facebook/react-native/commit/b12256394e34c375942ca508ef79a8c816317976)), `ReactHorizontalScrollViewManager` ([deec1db9fd](https://github.com/facebook/react-native/commit/deec1db9fdf2848941326ba5bebc11f3592a301e)) and update `ScrollView.js` ([a54cfb9e57](https://github.com/facebook/react-native/commit/a54cfb9e5794f196d3834e19762f3aacf47a177d)) and reach parity with iOS ([04184ef851](https://github.com/facebook/react-native/commit/04184ef851c71141009c523ba59838ae6af19ba5)) by [@mdvacca](https://github.com/mdvacca)
- Show Redbox for C++ errors. ([d6c879edba](https://github.com/facebook/react-native/commit/d6c879edbad068d0f461381875b7fae6db99d18d) by [@sota000](https://github.com/sota000))
- Added an experimental touch dispatch path ([a2feaeb5f1](https://github.com/facebook/react-native/commit/a2feaeb5f1121a860a9416b5d4e0e96debd45b09) by [@ShikaSD](https://github.com/ShikaSD))

#### iOS specific
- Added `cancelButtonTintColor` prop for `ActionSheetIOS` to change only the text color of the cancel button ([01856633a1](https://github.com/facebook/react-native/commit/01856633a1d42ed3b26e7cc93a007d7948e1f76e) by [@nomi9995](https://github.com/nomi9995))
- Added [`LSApplicationQueriesSchemes`](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/LaunchServicesKeys.html#//apple_ref/doc/uid/TP40009250-SW14) in info.plist with entries tel, telprompt, http, fb, geo ([b26f277262](https://github.com/facebook/react-native/commit/b26f2772624c863c91fa1ff627b481c92d7562fb) by [@utkarsh-dixit](https://github.com/utkarsh-dixit))
- Add `UIAccessibilityTraitUpdatesFrequently` to progressBar role ([1a42bd6e97](https://github.com/facebook/react-native/commit/1a42bd6e97ae44a3b38ca552865bac63a6f35da5) by [@jimmy623](https://github.com/jimmy623))
- Add `asdf-vm` support in `find-node.sh` ([3e7c310b1d](https://github.com/facebook/react-native/commit/3e7c310b1dcf5643920535eea70afa451888792a) by [@pastleo](https://github.com/pastleo))


### Changed
- `ImageBackground` now respects `imageStyle` width and height ([dbd5c3d8e5](https://github.com/facebook/react-native/commit/dbd5c3d8e5e35685be89156194a96cead553a330) by [@Naturalclar](https://github.com/Naturalclar))
- Rename deprecated `Keyboard.removeEventListener` to `Keyboard.removeListener`. ([8880c09076](https://github.com/facebook/react-native/commit/8880c09076e4727768ace26a74766cbe6f64021c) by [@yungsters](https://github.com/yungsters))
- Update `Modal`'s mock to not render its children when it is not visible ([ec614c16b3](https://github.com/facebook/react-native/commit/ec614c16b331bf3f793fda5780fa273d181a8492) by [@AntoineDoubovetzky](https://github.com/AntoineDoubovetzky))
- Upgraded `react-devtools-core` dependency to 4.19.1 ([356236471a](https://github.com/facebook/react-native/commit/356236471abc6b5b8c139223e15388fd1eecd2d1) by [@jstejada](https://github.com/jstejada))
- React-native/normalize-color now supports Node.js ([65e58f26e1](https://github.com/facebook/react-native/commit/65e58f26e1fbd06b1ae32e2ab3a2616c8eef08e0) by [@yungsters](https://github.com/yungsters))
- Updated to Contributor Covenant v2.1 ([19f8d2f7da](https://github.com/facebook/react-native/commit/19f8d2f7da13f4524f31acf7aa10cc0aa91b5da4))


#### Android specific
- Hermes initialization will no longer need an explicit configuration. ([a40f973f58](https://github.com/facebook/react-native/commit/a40f973f58609ca717fac63bc501d5cf93b748ad) by [@Ashoat](https://github.com/Ashoat))
- Setting `overflow: scroll` in View component style will clip the children in the View container ([93beb83abe](https://github.com/facebook/react-native/commit/93beb83abef42b92db43ee3bb8b156f486a6c00f) by [@ryancat](https://github.com/ryancat))
- Native views backing `Animated.View` (w/ JavaScript-driven animations) will no longer be flattened; this should be a transparent change. ([4fdbc44ab5](https://github.com/facebook/react-native/commit/4fdbc44ab5945399338e4ed94ea5611098bd2142) by [@yungsters](https://github.com/yungsters))
- Use new Locale API on Android 11 (API 30)+ ([b7c023a8c1](https://github.com/facebook/react-native/commit/b7c023a8c1122500c6ceb7de2547569b3b9251ba))
- Changed `react.gradle` `detectCliPath` function logic for `cliPath` case ([ce51b62494](https://github.com/facebook/react-native/commit/ce51b6249449361ee50b8c99a427c28af7ab3531) by [@vitalyiegorov](https://github.com/vitalyiegorov))
- Remove `"high"` and `"balanced"` as values for `android_hyphenationFrequency` on `Text` ([a0d30b848a](https://github.com/facebook/react-native/commit/a0d30b848a07480d0fccec608a62a505c71f8cac))
- Bump Gradle version to 7.2, Bump Kotlin version to 1.5.31 ([9ae3367431](https://github.com/facebook/react-native/commit/9ae3367431428748f5486c782199beb4f9c6b477) by [@svbutko](https://github.com/svbutko))
- Move mavenCentral repo below local paths ([046b02628d](https://github.com/facebook/react-native/commit/046b02628d32eadd6d44160ab79932f6c26b188d) by [@friederbluemle](https://github.com/friederbluemle))

#### iOS specific
- Optimized font handling for iOS ([4ac42d88ef](https://github.com/facebook/react-native/commit/4ac42d88ef60ae3fed7319851d47b93e98ac9afa) by [@Adlai-Holler](https://github.com/Adlai-Holler))
- Remove iOS 11 version check as minimum deployment is iOS 11 ([398595e074](https://github.com/facebook/react-native/commit/398595e07483fa8f45579de4ca1aee9585e20620) by [@ken0nek](https://github.com/ken0nek))
- Don't hang app for 60s if packager can't be reached, changed to 10s ([c0e04460f5](https://github.com/facebook/react-native/commit/c0e04460f546dfef2623bff367eb8db8fd75fa34) by [@radex](https://github.com/radex))

### Removed

- Removed unnecessary global variable `GLOBAL`. ([a101fc768c](https://github.com/facebook/react-native/commit/a101fc768cedc7ac9754006e5b7292bb7084ab54) by [@rubennorte](https://github.com/rubennorte))
- Removed unused files: `StaticContainer.react.js`, `ensurePositiveDelayProps.js`, `InteractionMixin.js`, `queryLayoutByID.js` ([64aa1e5ffe](https://github.com/facebook/react-native/commit/64aa1e5ffe5d577c04cabb3692246b956f65597b) by [@ecreeth](https://github.com/ecreeth))

#### Android specific

- Remove `DatePickerAndroid` from react-native. ([7a770526c6](https://github.com/facebook/react-native/commit/7a770526c626e6659a12939f8c61057a688aa623) by [@andresantonioriveros](https://github.com/andresantonioriveros))

#### iOS specific

### Fixed

- Update metro config language to `blockList` ([7923804c28](https://github.com/facebook/react-native/commit/7923804c28aac731396f0db112cb6c3a9d30c08f) by [@rh389](https://github.com/rh389))
- Ignores global npm prefix ([6334ac35ac](https://github.com/facebook/react-native/commit/6334ac35ac3cbc2c84b2d46d46ec118bf9bf714d) by [@redreceipt](https://github.com/redreceipt))
- Support `Animated.ValueXY` when validating `Animated.event`. ([27dd2ecb70](https://github.com/facebook/react-native/commit/27dd2ecb70f1d08787c93a2e18250ffaff328e5f) by [@javache](https://github.com/javache))
- Add a function `getIgnorePatterns` in `LogBoxData.js` for tests or other usecases. ([a950634424](https://github.com/facebook/react-native/commit/a950634424cddf31c0adb6c9799adf1cc5f83bf0))

#### Android specific

- TextInput Drawable to avoid Null Pointer Exception RuntimeError https://github.com/facebook/react-native/issues/17530 ([254493e1fb](https://github.com/facebook/react-native/commit/254493e1fb0c3a1e279e2c957e83edac6252d041) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Nested Text Android `onPress` does not work with last character ([132d1d00f8](https://github.com/facebook/react-native/commit/132d1d00f885fe5a45d712fd7698db285c22bc4b) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fix non selectable Text in FlatList ([c360b1d92b](https://github.com/facebook/react-native/commit/c360b1d92b69e1d298b390ec88c4d29c1023945a) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Set `textBreakStrategy` default to be `'highQuality'` ([3b2d541989](https://github.com/facebook/react-native/commit/3b2d5419899363d84aea4f5cc3a4c75253dd6406))
- Fix error handling when loading JSC or Hermes ([d839b24b06](https://github.com/facebook/react-native/commit/d839b24b06d31b4ce91fb459742831b942972f56) by [@iqqmuT](https://github.com/iqqmuT))
- Fix encoding for gradlew.bat files ([ab2bdee735](https://github.com/facebook/react-native/commit/ab2bdee735cd0d53d3dbfbac5cd31f96eefb7e61) by [@yungsters](https://github.com/yungsters))
- Fix `hermesFlags` not working with multiple variants ([91adb761cf](https://github.com/facebook/react-native/commit/91adb761cf1583598d4d63ce879fd7e0f4ae793c) by [@grit96](https://github.com/grit96))
- `ScrollTo` API in ScrollView will check the actual scroll position before setting the scroll state ([1a9e2d5d55](https://github.com/facebook/react-native/commit/1a9e2d5d5589ce5cee92868ea5bccceb6e161eff) by [@ryancat](https://github.com/ryancat))
- Compute Android Notch in `keyboardDidShow` height calculation API 28+ ([8bef3b1f11](https://github.com/facebook/react-native/commit/8bef3b1f1136ab5c2f2309a3101a7d9626ced1f5) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fix `currentActivity` being null when launching Redbox ([f4fdf4b55e](https://github.com/facebook/react-native/commit/f4fdf4b55e4489c21f4552b4ac01ef253c038b2d))
- When sending OS intents, always set `"FLAG_ACTIVITY_NEW_TASK"` flag (required by OS). ([04fe3ed80d](https://github.com/facebook/react-native/commit/04fe3ed80d9c201a483a2b477aeebd3d4169fd6d) by [@Krizzu](https://github.com/Krizzu))
- Fix missing WebView provider crash in ForwardingCookieHandler ([d40cb0e1b0](https://github.com/facebook/react-native/commit/d40cb0e1b0fb233a27b9d476167814d2853acf2a) by [@RodolfoGS](https://github.com/RodolfoGS))
- Fix `keyboardDismissMode="on-drag"` on Android ([7edf9274cf](https://github.com/facebook/react-native/commit/7edf9274cf6d3398075c19cd1cb020a5d6a346a2) by [@janicduplessis](https://github.com/janicduplessis))
- Fixed `alignItems: baseline` for <Text> elements on Android ([1acf334614](https://github.com/facebook/react-native/commit/1acf33461451834097463f43e70d90bae0f67198))
- `OnKeyPress` event not fired with numeric keys ([ee3e71f536](https://github.com/facebook/react-native/commit/ee3e71f536127295ba4ea377e618499409a2e9ba) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Exclude unused .so files for reduce android .apk and .aab ([6f126740fa](https://github.com/facebook/react-native/commit/6f126740fa560d7a831979b9f3747baacfb28dba) by [@enniel](https://github.com/enniel))

#### iOS specific

- Fixed an edge case when scroll to item/index is called without animation, the offset position is not updated. This caused the measurement of the position to be wrong. ([55392f65a6](https://github.com/facebook/react-native/commit/55392f65a6addbdd8214b61d4ae286f26d63a94f) by [@ryancat](https://github.com/ryancat))
- Fixed the issue when moving cursor in multi-line TextInput. ([22801870f0](https://github.com/facebook/react-native/commit/22801870f0613c2544ade1ebc5363e6e2f015c79) by [@xiankuncheng](https://github.com/xiankuncheng))
- Fix NSInvalidArgumentException for invalid font family names. ([5683932862](https://github.com/facebook/react-native/commit/5683932862ab870e735342342c68e03fb5ca9e09) by [@yungsters](https://github.com/yungsters))
- Fix Image `defaultSource` not showing on iOS ([900210cacc](https://github.com/facebook/react-native/commit/900210cacc4abca0079e3903781bc223c80c8ac7) by [@cristianoccazinsp](https://github.com/cristianoccazinsp))
- Warn if Rosetta2 is being used (x86_64 on arm64) ([51bf557948](https://github.com/facebook/react-native/commit/51bf55794899284e1c465d346a3f6ebd8a485da2) by [@barbieri](https://github.com/barbieri))
- Source map path for schemes containing whitespaces ([f3fe7a0fb5](https://github.com/facebook/react-native/commit/f3fe7a0fb5fc0325fbe062c6df4cbf8b58779189) by [@andersonvom](https://github.com/andersonvom))
- Fix build error after running `pod install` with `--project-directory=ios` ([ef5ff3e055](https://github.com/facebook/react-native/commit/ef5ff3e055482771cbe866d4961ee2d0a9e00e45) by [@sonicdoe](https://github.com/sonicdoe))
- Fixed inability to build apps when gflags is installed ([ab8dbdf663](https://github.com/facebook/react-native/commit/ab8dbdf66363f3d65f0dfbcc4ec7c71b1cd69b2a) by [@KDederichs](https://github.com/KDederichs))

### Security

- Avoiding logging root view params outside of dev / debug mode builds ([e612d3a116](https://github.com/facebook/react-native/commit/e612d3a116f39ab354169643bab0d4bb9cfc1a85) by [@sterlingwes](https://github.com/sterlingwes))

## v0.66.5

🚨 **IMPORTANT:** This is an exceptional release on an unsupported version. We recommend you upgrade to one of [the supported versions, listed here](https://github.com/reactwg/react-native-releases#which-versions-are-currently-supported).

### Fixed

- Force dependencies resolution to minor series for 0.66 ([201824c89e](https://github.com/facebook/react-native/commit/201824c89ecebd749ba7e603415edbe6a5b9b73d) by [@cortinico](https://github.com/cortinico))

## v0.66.4

### Fixed

#### iOS specific

- Revert "Fix Deadlock in RCTi18nUtil (iOS)" ([70ddf46](https://github.com/facebook/react-native/commit/70ddf46c8afcd720e188b6d82568eac6ac8125e6) by [@Saadnajmi](https://github.com/Saadnajmi))
- `apply_Xcode_12_5_M1_post_install_workaround` causing pods targetting iOS 12 and above to fail ([a4a3e67554](https://github.com/facebook/react-native/commit/a4a3e675542827bb281a7ceccc7b8f5533eae29f) by [@Yonom](https://github.com/Yonom))

## v0.66.3

### Changed

- Rename deprecated `Keyboard.removeEventListener` to `Keyboard.removeListener`. ([8880c09076](https://github.com/facebook/react-native/commit/8880c09076e4727768ace26a74766cbe6f64021c) by [@yungsters](https://github.com/yungsters))

### Fixed

- Revert changes in Jest preprocessor to fix tests in external projects ([142090a5f3fa7](https://github.com/facebook/react-native/commit/142090a5f3fa7c3ab2ed4c536792e3f26582bd3b) by [@rubennorte](https://github.com/rubennorte))

## v0.66.2

### Fixed

- Add a function `getIgnorePatterns` in `LogBoxData.js` for tests or other usecases. ([a950634424](https://github.com/facebook/react-native/commit/a950634424cddf31c0adb6c9799adf1cc5f83bf0))
- Reintroduce generated codegen files ([7382f556d3](https://github.com/facebook/react-native/commit/7382f556d327d51bd09456efda83edec7e05ecd2) by [@kelset](https://github.com/kelset))

#### iOS specific

- Hide the logbox window explicitly. New behavior in iOS SDK appears to retain UIWindow while visible. ([72ea0e111f](https://github.com/facebook/react-native/commit/72ea0e111fccd99456abf3f974439432145585e3) by [@paddlefish](https://github.com/paddlefish))

## v0.66.1

### Fixed

- For Android, general fixes to Appearance API and also fixes AppCompatDelegate.setDefaultNightMode(). For iOS, now works correctly when setting window.overrideUserInterfaceStyle ([25a2c608f7](https://github.com/facebook/react-native/commit/25a2c608f790f42cbc4bb0a90fc06cc7bbbc9b95) by [@mrbrentkelly](https://github.com/mrbrentkelly))

#### Android specific

- Fix Android border positioning regression ([d1a33cd139](https://github.com/facebook/react-native/commit/d1a33cd139fab4565b1fc691f5751c4af99d5849) by [@oblador](https://github.com/oblador))

#### iOS specific

- Fix for unable to find `find-node.sh` in `react-native-xcode.sh` script ([cc59a7cbde](https://github.com/facebook/react-native/commit/cc59a7cbde1c0fc6d6ef059321d23bf287f08218) by [@garethknowles](https://github.com/garethknowles))

## v0.66.0

### Highlights

- Hermes 0.9.0
  - This Hermes release is primarily about closing gap between Hermes cut and this React Native release. Among ~400 commits, contains memory and size wins, bugfixes and other progress behind the scenes. See [issue for more details](https://github.com/facebook/hermes/issues/586).
- Allow taps on views outside the bounds of a parent with `overflow: visible` ([e35a963bfb](https://github.com/facebook/react-native/commit/e35a963bfb93bbbdd92f4dd74d14e2ad6df5e14a) by [@hsource](https://github.com/hsource))
- Fixes for building on Apple Silicon and Xcode 13 ([ac4ddec542](https://github.com/facebook/react-native/commit/ac4ddec542febda744de218dae3a3d34edc7da84) thanks to [@mikehardy](https://github.com/mikehardy))
- New bluetooth permissions for Android ([2bcc6fac38](https://github.com/facebook/react-native/commit/2bcc6fac3844f0752bc7067517c92a643679575e), [eeb8e58](https://github.com/facebook/react-native/commit/eeb8e5829e183f6b5cd5fd327cf6da03a7db0541) by [@iBotPeaches](https://github.com/iBotPeaches))

### Breaking

- Remove Picker and PickerIOS components
  [cddb97ad18](https://github.com/facebook/react-native/commit/cddb97ad18cfdb663dcf015af3c9426d5414e396), [77366cd869](https://github.com/facebook/react-native/commit/77366cd8696cb8ada3f84d7fb4d36a27f7007b06), [ad0ccac0d6](https://github.com/facebook/react-native/commit/ad0ccac0d6471fa5428bf137c3aa0646883e8446)
- Remove StatusBarIOS component ([7ce0f40f5c](https://github.com/facebook/react-native/commit/7ce0f40f5cd8c0928ce720d6d121bcc5963958a2) by [@ecreeth](https://github.com/ecreeth))

#### Android specific

- Updated `autoCompleteType` prop of `TextInput` to `autoComplete` ([27fec9569e](https://github.com/facebook/react-native/commit/27fec9569e08a04e0dbdbd5de063a599ad0416fa) by [@jeswinsimon](https://github.com/jeswinsimon))

### Added

- Add `global.queueMicrotask` ([be189cd819](https://github.com/facebook/react-native/commit/be189cd81905a735f08a8519c62a707658c7fb27) by [@Huxpro](https://github.com/Huxpro))
- Added data field to `markerPoint` to allow callers to add additional arbitrary string data to logged points ([aa98978302](https://github.com/facebook/react-native/commit/aa9897830293955b7cc77fd818a50e8d736e715d))
- Adds accessibility actions to Button ([44717152ca](https://github.com/facebook/react-native/commit/44717152cadb18c7aff74e9465fdb70efdb1bf81) by [@dennisurtubia](https://github.com/dennisurtubia))
- Add accessibilityState prop to Slider component ([35dd86180b](https://github.com/facebook/react-native/commit/35dd86180ba730425b97592ef6e5c4d449caee06) by [@sladyn98](https://github.com/sladyn98))
- Add support for "togglebutton" `accessibilityRole` ([da899c0cc4](https://github.com/facebook/react-native/commit/da899c0cc4372830e5ca053a096b74fff2a19cb8) by [@kacieb](https://github.com/kacieb))

#### Android specific

- Add INFO, and MENU key event support ([bb33c1050b](https://github.com/facebook/react-native/commit/bb33c1050ba6098a68d70055e33186d9438c4374) by [@havlasme](https://github.com/havlasme))
- Added all autofill types to TextEdit ([d9e0ea77f0](https://github.com/facebook/react-native/commit/d9e0ea77f0111fd8400c65d68e45d54e2f84287b) by [@safaiyeh](https://github.com/safaiyeh))
- Add support to URI keyboard type in Android ([1465c8f387](https://github.com/facebook/react-native/commit/1465c8f3874cdee8c325ab4a4916fda0b3e43bdb))
- Add `MEDIA_STOP`, `MEDIA_NEXT`, and `MEDIA_PREVIOUS` event support to Android TV ([3e2bb331fc](https://github.com/facebook/react-native/commit/3e2bb331fc0974bc870b2e7bd3171e585183ed1b) by [@havlasme](https://github.com/havlasme))
- Allow configuring ndk build architectures ([d6ed1ff58b](https://github.com/facebook/react-native/commit/d6ed1ff58b2ca4d1c8b45416e56fa1da75633c07) by [@janicduplessis](https://github.com/janicduplessis))
- Added support for accessibility role of "list" for flatlist and sectioned list ([25a16123a6](https://github.com/facebook/react-native/commit/25a16123a610ae377ced23ef81ed4c03ad7d06d9) by [@anaskhraza](https://github.com/anaskhraza))
- Support for foreground ripple in Pressable ([0823f299e5](https://github.com/facebook/react-native/commit/0823f299e560efda5c0f344fcec86cf68801f4ab) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Support for ScrollAway native nav bars added to `ReactScrollView` ([0ef5beee85](https://github.com/facebook/react-native/commit/0ef5beee855afa592cc647383ba6a3ceae9cc40a) by [@JoshuaGross](https://github.com/JoshuaGross))

#### iOS specific

- Added new prop "selection" to `TextInputProps` ([8434177722](https://github.com/facebook/react-native/commit/8434177722f70a9325f9a6adf46b5315b1f4ffa4))
- Support for onRequestClose for iOS Modal component. ([c29ec46b0e](https://github.com/facebook/react-native/commit/c29ec46b0eee99670ce7762898fe3a4810db968b) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Allow `PlatformColor` to return user-defined named asset color ([36c0a7dec1](https://github.com/facebook/react-native/commit/36c0a7dec121bd3a4b92d02c03a24771d3c4cf84) by [@oblador](https://github.com/oblador))
- Add support for the `UIAccessibilityTraitsTabBar` ([11f8d9c7cd](https://github.com/facebook/react-native/commit/11f8d9c7cd4bae0b1a5e880ea9b2da7447ad76c2) by [@jimmy623](https://github.com/jimmy623))
- Added "altitudeAngle" property to touch events from Apple Pencil/Stylus devices. ([f1b1ba8963](https://github.com/facebook/react-native/commit/f1b1ba8963ff152d995c3cd132bc0755413bc44f) by [@swittk](https://github.com/swittk))
- Introduce `RCTInitializing` to allow NativeModules to initialize themselves ([9b45df1fce](https://github.com/facebook/react-native/commit/9b45df1fced066f40034b0a58be6f4caafd5f785) by [@RSNara](https://github.com/RSNara))
- Introduce `RCTCallableJSModules` API for NativeModules ([ece373d244](https://github.com/facebook/react-native/commit/ece373d24421d96e62dafa9a064b38acd6b71e46) by [@RSNara](https://github.com/RSNara))
- Attach `RCTBundleManager` to NativeModules ([329f58ee46](https://github.com/facebook/react-native/commit/329f58ee461e7afade36d8c249d3f4930c485312) by [@RSNara](https://github.com/RSNara))
- Introduce RCTBundleManager for bundleURL access ([4a1bafe591](https://github.com/facebook/react-native/commit/4a1bafe591917482d78be998d45552e2568e3e23) by [@RSNara](https://github.com/RSNara))

### Changed

- Initialized LogBox earlier and centralized access in LogBox module ([8abe737068](https://github.com/facebook/react-native/commit/8abe737068a54a874571c8b5560b2118b1df31ad) by [@rubennorte](https://github.com/rubennorte))
- ExceptionsManager will no longer report exceptions with `type === 'warn'`. ([883e0d5752](https://github.com/facebook/react-native/commit/883e0d5752b952c829c8d45504d3532f52bb272f) by [@yungsters](https://github.com/yungsters))
- Disable TouchableOpacity when `accessibilityState.disabled` is set ([ea609defe8](https://github.com/facebook/react-native/commit/ea609defe8462a6beeac4da3aa7a43397ee9a77f) by [@chakrihacker](https://github.com/chakrihacker))
- Upgrade Babel from 7.12.3 to 7.14.1 ([58a0f9b4e2](https://github.com/facebook/react-native/commit/58a0f9b4e202a921ab0820c79d6a3dd54204da46) by [@MichaReiser](https://github.com/MichaReiser))
- Upgrade `react-devtools-core` from ~4.6.0 to ^4.13.0 ([9e020ef476](https://github.com/facebook/react-native/commit/9e020ef476e24bb5703fc421225f1a94ae14512b) by [@bvaughn](https://github.com/bvaughn))
- Update Flipper to 0.99.0 ([41f45a77ad](https://github.com/facebook/react-native/commit/41f45a77ad09b46de328fb2a72775a052dac1e93) by [@swrobel](https://github.com/swrobel))
- Bump CLI to ^6.0.0 ([c677e196a9](https://github.com/facebook/react-native/commit/c677e196a9c4d6cfdf84d97e4746922bb4ed4823) by [@thymikee](https://github.com/thymikee))
- Upgrade ESLint TS parser and plugin ([3b751d396b](https://github.com/facebook/react-native/commit/3b751d396ba0acaa1b4c8e1115c79eb45dab403d) by [@wcandillon](https://github.com/wcandillon))
- Upgrade folly to 2021.06.28.00 and boost to 1.76.0 ([b77948e33b](https://github.com/facebook/react-native/commit/b77948e33bc5e0df422fffca3b4c9253f611d298) by [@Kudo](https://github.com/Kudo))

#### Android specific

- Add BLUETOOTH_ADVERTISE to `PermissionsAndroid` ([2bcc6fac38](https://github.com/facebook/react-native/commit/2bcc6fac3844f0752bc7067517c92a643679575e) by [@iBotPeaches](https://github.com/iBotPeaches))
- Native ScrollView listeners list maintains weak references to listeners to avoid memory leaks ([b673e352fb](https://github.com/facebook/react-native/commit/b673e352fb0ea44b545edf5a7e8c1b422180838a) by [@dalves](https://github.com/dalves))
- Rename the "Toggle Inspector" DevMenu item to "Hide/Show Element Inspector" ([e91fb05db7](https://github.com/facebook/react-native/commit/e91fb05db7f576e07114755b9db1eee91c672f25) by [@RSNara](https://github.com/RSNara))
- Localize "search", "button", and "togglebutton" accessibility roles by using the platform roles ([399285f91c](https://github.com/facebook/react-native/commit/399285f91c2f675dea16fe61a86049ef7fecf35b) by [@kacieb](https://github.com/kacieb))
- Refactor `AndroidTextInput.AndroidTextInput.color` prop to use SharedColor instead of int ([bc57056cc3](https://github.com/facebook/react-native/commit/bc57056cc3263431d54982426d890ba60b4cadb7) by [@mdvacca](https://github.com/mdvacca))
- Upgraded `infer-annotation` to 0.18.0. ([b5c94e316c](https://github.com/facebook/react-native/commit/b5c94e316cc9b4ff090d8daa8970bf1becf77959) by [@yungsters](https://github.com/yungsters))
- Bumped AGP to 4.2.2 ([ae494e7ce1](https://github.com/facebook/react-native/commit/ae494e7ce199cc5d524f791d45ddce51535cdadb) by [@cortinico](https://github.com/cortinico))
- Upgrade folly to 2021.06.28.00 ([ebe939b18a](https://github.com/facebook/react-native/commit/ebe939b18aa859eb0f7f265222874c292ed771a4) by [@Kudo](https://github.com/Kudo))
- Bump NDK to 21.4.7075529 ([aa43aab77c](https://github.com/facebook/react-native/commit/aa43aab77c8571632a2b0913c80fbf822dac01bc) by [@dulmandakh](https://github.com/dulmandakh))

#### iOS specific

- ScrollView scrollIndicatorInsets to not automatically add safe area on iOS13+ ([bc1e602e0c](https://github.com/facebook/react-native/commit/bc1e602e0c7922da6bf238675b7bf8b4c3faa493) by [@justinwh](https://github.com/justinwh))

### Removed

- `StyleSheet.create` will no longer do DEV-time validation. ([2e8c0bd7ea](https://github.com/facebook/react-native/commit/2e8c0bd7ea7db1aac183eb7f656772d3cffcb132) by [@yungsters](https://github.com/yungsters))

### Fixed

- Fix `window` not existing in jest setup ([bc1c533833](https://github.com/facebook/react-native/commit/bc1c533833bfe25a22f1abd105b8bcb1babce3b5) by [@timomeh](https://github.com/timomeh))
- Clamp negative values for `numberOfLines` in <Text> component ([3bc883c6c6](https://github.com/facebook/react-native/commit/3bc883c6c60632f6a41df3867368f16f684b3865) by [@ShikaSD](https://github.com/ShikaSD))
- Add missing `jest/create-cache-key-function` dep root package.json ([9a43eac7a3](https://github.com/facebook/react-native/commit/9a43eac7a32a6ba3164a048960101022a92fcd5a) by [@janicduplessis](https://github.com/janicduplessis))
- Fix Switch ref forwarding ([1538fa4455](https://github.com/facebook/react-native/commit/1538fa4455fa7095879aceba7f74a519c1337a8b) by [@janicduplessis](https://github.com/janicduplessis))
- Report fatal errors even if its `type` is "warn". ([e4a4c4d6d7](https://github.com/facebook/react-native/commit/e4a4c4d6d71ab1a747d768e4b518e64e100ddfde) by [@yungsters](https://github.com/yungsters))
- Parse `accessibilityAction` props into object instead of string ([faaeb778df](https://github.com/facebook/react-native/commit/faaeb778dfe25df67fc00b599d023819c10406e8) by [@ShikaSD](https://github.com/ShikaSD))
- Avoid downgrading `console.error` when passed warning-like objects. ([0dba0aff18](https://github.com/facebook/react-native/commit/0dba0aff185f4fd46e1146362235e68e52c59556) by [@yungsters](https://github.com/yungsters))
- Fix natively driven animations not getting reset properly ([129180c77b](https://github.com/facebook/react-native/commit/129180c77b0b99a3acedbeb04ce6ec4667f74cac) by [@tienphaw](https://github.com/tienphaw))
- Fix compilation errors on Windows. ([6d04a46f74](https://github.com/facebook/react-native/commit/6d04a46f7427b9e107608f8f620fe2a1a84ff42d))
- Fixed bug parsing hermes call stacks when the file name is empty ([e539e7d0be](https://github.com/facebook/react-native/commit/e539e7d0bed4fef42f458f28d06100ae23f52cb7) by [@MartinSherburn](https://github.com/MartinSherburn))
- Upgrade dependencies / version of eslint package ([463ec22bb9](https://github.com/facebook/react-native/commit/463ec22bb9f2938164fef6133dfd94d2e428e5b0) by [@mikehardy](https://github.com/mikehardy))

#### Android specific

- Allow taps on views outside the bounds of a parent with `overflow: visible` ([e35a963bfb](https://github.com/facebook/react-native/commit/e35a963bfb93bbbdd92f4dd74d14e2ad6df5e14a) by [@hsource](https://github.com/hsource))
- Fixed to use correct Android theme color for dark theme ([b3a715f6ea](https://github.com/facebook/react-native/commit/b3a715f6ea3d0faaf6d09e2a49267f2a5fb3fad2) by [@sidverma32](https://github.com/sidverma32))
- Fixed dynamic behavior of `<Text adjustsFontSizeToFit={true}>` on Android ([59021521e7](https://github.com/facebook/react-native/commit/59021521e7aba0f70b91b5c7778ccdd1b30eaae4))
- Fix Dimensions not updating ([c18a492858](https://github.com/facebook/react-native/commit/c18a492858e94b31e632560ad17499012e688158) by [@jonnyandrew](https://github.com/jonnyandrew))
- Fix dashed/dotted border-drawing when `borderRadius` is 0 ([3e5998e651](https://github.com/facebook/react-native/commit/3e5998e651eba840603dcb1a9c0be564fc3f868d) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix selectionColor doesn't style Android TextInput selection handles ([5819538a08](https://github.com/facebook/react-native/commit/5819538a087f1f48d564e7b4e273fe43dfb026cc) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fix Modal being dismissed incorrectly when pressing escape on a hardware keyboard ([f51773ecde](https://github.com/facebook/react-native/commit/f51773ecdedbac19d25eb20894e532edef2cb304) by [@levibuzolic](https://github.com/levibuzolic))
- Avoid calling setHint with a null parameter causing cursor to jump to the right ([3560753559](https://github.com/facebook/react-native/commit/356075355908f4901b87ad6ce33c157f01c8e748) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Create slider accessibility delegate in createViewInstance ([91cac20289](https://github.com/facebook/react-native/commit/91cac2028900cd18d17e70f9050cc125ed1eb12e) by [@janicduplessis](https://github.com/janicduplessis))
- Quickfix individual border style dotted or dashed rendering as solid ([cb0e1d603a](https://github.com/facebook/react-native/commit/cb0e1d603aa4439a4d4804ad2987e4cb1f9bbf90) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Make `mHybridData` thread safe ([7929551623](https://github.com/facebook/react-native/commit/7929551623d4e3fbd849500d795755d0c41fdbbd))
- Exit early from layout in textview if text layout is null ([8dfc3bcda1](https://github.com/facebook/react-native/commit/8dfc3bcda1e77fc982bc98da20dc129c23d8cc77) by [@ShikaSD](https://github.com/ShikaSD))
- Fix `NullPointerException` caused by race condition in `ReactInstanceManager.getViewManagerNames` method ([fb386fccdd](https://github.com/facebook/react-native/commit/fb386fccddfe381fd6af5656c13fac802bffd316) by [@mdvacca](https://github.com/mdvacca))
- Pressable ripple subsequent press coordinates. ([961b00d8c0](https://github.com/facebook/react-native/commit/961b00d8c0117750ce147c0b27c59af93f64b65c) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- TouchableNativeFeedback ripple starts on previous touch location. ([d85d72d0d9](https://github.com/facebook/react-native/commit/d85d72d0d9143693f73cef24c8e5bbb4d539a620) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Fix Crash in `ViewProps.isLayoutOnly` ([e6b9508f12](https://github.com/facebook/react-native/commit/e6b9508f12ffd732d773ddcf9c2f633b0eca4232) by [@javache](https://github.com/javache))
- Fixed a crash when updating `snapToOffsets` to a null value ([ba387b91d3](https://github.com/facebook/react-native/commit/ba387b91d3c7c9c1acd4b08f07fcd45629f3edfb) by [@maxoumime](https://github.com/maxoumime))
- Adding `setAccessible` to `ReactImageManager` to allow screenreader announce Image accessibilityState of "disabled" ([333b46c4b0](https://github.com/facebook/react-native/commit/333b46c4b0ddee286e6d1d4b971fe8554a5c14cb) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fixed Android library builds with react.gradle file ([88f0676ae4](https://github.com/facebook/react-native/commit/88f0676ae49fd629331495101248c8e13423aed2) by [@Legion2](https://github.com/Legion2))

#### iOS specific

- Fix deadlock on `RCTi18nUtil` ([fcead14b0e](https://github.com/facebook/react-native/commit/fcead14b0effe2176a5d08ad50ee71e48528ddbd) by [@Saadnajmi](https://github.com/Saadnajmi))
- Avoid re-encoding images when uploading local files ([f78526ce3d](https://github.com/facebook/react-native/commit/f78526ce3d4004eb4bf8ca5178ca7e2c1c9abc1a) by [@arthuralee](https://github.com/arthuralee))
- <TextInput> content is reset when emoji is entered at the max length ([f3b8d4976f](https://github.com/facebook/react-native/commit/f3b8d4976f8608c2cda1f071923f14b6d4538967))
- Use `actionName` in accessibility event callback ([fed6ad5bad](https://github.com/facebook/react-native/commit/fed6ad5badb4196a1895370fc81c522572cb34b4) by [@ShikaSD](https://github.com/ShikaSD))

## v0.65.3

🚨 **IMPORTANT:** This is an exceptional release on an unsupported version. We recommend you upgrade to one of [the supported versions, listed here](https://github.com/reactwg/react-native-releases#which-versions-are-currently-supported).

### Fixed

- Force dependencies resolution to minor series for 0.65 ([9548eaea74](https://github.com/facebook/react-native/commit/9548eaea74c6ad242c015d1984503c4b7eb19b6f) by [@kelset](https://github.com/kelset))

## v0.65.2

### Fixed

- For Android, general fixes to Appearance API and also fixes AppCompatDelegate.setDefaultNightMode(). For iOS, now works correctly when setting window.overrideUserInterfaceStyle ([25a2c608f7](https://github.com/facebook/react-native/commit/25a2c608f790f42cbc4bb0a90fc06cc7bbbc9b95) by [@mrbrentkelly](https://github.com/mrbrentkelly))

## v0.65.1

### Changed

- Set `react-test-renderer` to `17.0.2` in the template ([d272880](https://github.com/facebook/react-native/commit/d27288044e94a248982f596e9885d55d066bc72e) by [@@rickhanlonii](https://github.com/@rickhanlonii))

### Fixed

- Resolve `NODE_BINARY` after finding the right path to node ([d75683](https://github.com/facebook/react-native/commit/d75683ac943205d64dd4142cca713ab2356094b8) by [@santiagofm](https://github.com/santiagofm))

#### Android specific

- `ColorProps` with value null should be defaultColor instead of transparent ([842bcb902e](https://github.com/facebook/react-native/commit/842bcb902ed27928255b60cb20524e9318d9bf70) by [@hank121314](https://github.com/hank121314))
- Android Gradle Plugin 7 compatibility ([06e31c748f](https://github.com/facebook/react-native/commit/06e31c748fe87a866dbaf4d0c2019e76ec00e309) by [@dulmandakh](https://github.com/dulmandakh))

## v0.65.0

### Highlights

- Hermes 0.8.1. Please see the highlighted changes from its [0.8.0](https://github.com/facebook/hermes/releases/tag/v0.8.0) and [0.8.1](https://github.com/facebook/hermes/releases/tag/v0.8.1) release notes.
- `react-native-codegen` version `0.0.7` is now needed as a `devDependency` in the `package.json`.

### Breaking Changes

#### iOS specific

- Replace `flipper_post_install` with `react_native_post_install` hook. Will automatically detect if Flipper is enabled. ([42dde12aac](https://github.com/facebook/react-native/commit/42dde12aac81208c4e69da991f4e08b9e62d18f6) by [@grabbou](https://github.com/grabbou))

### Added

- Add `onPressIn` & `onPressOut` props to Text ([1d924549ca](https://github.com/facebook/react-native/commit/1d924549cad75912191005c8f68dd73e15b07183) by [@adrienharnay](https://github.com/adrienharnay))
- Stabilize `RootTagContext`. And temporarily export both `unstable_RootTagContext` and `RootTagContext` ([9d489354ae](https://github.com/facebook/react-native/commit/9d489354ae373614b20cd91f588eb25743686ee0) by [@nadiia](https://github.com/nadiia))
- Implement `sendAccessibilityEvent` in the React(Fabric/non-Fabric) renderer ([99b7052248](https://github.com/facebook/react-native/commit/99b7052248202cee172e0b80e7ee3dfb41316746) by [@JoshuaGross](https://github.com/JoshuaGross))
- Re-added `localeIdentifier` to `I18nManager` constants ([6b91ae73cd](https://github.com/facebook/react-native/commit/6b91ae73cdf096e15a3235ae76276f9d7fb12f7b) by [@acoates-ms](https://github.com/acoates-ms))
- Add PressabilityPerformanceEventEmitter ([c4c0065b00](https://github.com/facebook/react-native/commit/c4c0065b0009ced0049c5abc4dddd327ac638928) by [@JoshuaGross](https://github.com/JoshuaGross))
- Added `displayName` to some RN contexts to make them more easy to differentiate when debugging. ([68a476103a](https://github.com/facebook/react-native/commit/68a476103a95be77f4fc7c582e52cc94946de1b4) by [@bvaughn](https://github.com/bvaughn))
- Add `displayName` to `TouchableHighlight` and `TouchableOpacity` ([c4e40b81c0](https://github.com/facebook/react-native/commit/c4e40b81c01d061c189a7d28a4f56a588c3d1aea) by [@brunohkbx](https://github.com/brunohkbx))
- Added context to URL's error messages when the feature is not implemented ([452240bafa](https://github.com/facebook/react-native/commit/452240bafa970578144aedaea0223e17863d2d26) by [@Crash--](https://github.com/Crash--))
- Add a `stickyHeaderHiddenOnScroll` option to keep the sticky header hidden during scrolling down, and only slide in when scrolling up ([ffba25c648](https://github.com/facebook/react-native/commit/ffba25c648152021dd3fb9e79afd8cade7008d05))
- Added `debugName` parameter to `renderApplication` to use as the display name for the React root tree ([eeb36f4709](https://github.com/facebook/react-native/commit/eeb36f470929c2fdd8e1ed69898a5ba9144b8715) by [@rubennorte](https://github.com/rubennorte))
- Adding support for `cancelOnBackground` for UserFlow ([0d4985900b](https://github.com/facebook/react-native/commit/0d4985900b52d5def22fce4371c2259ee65368ee) by [@dmitry-voronkevich](https://github.com/dmitry-voronkevich))
- Introducing RuntimeScheduler module ([eb13baf2a6](https://github.com/facebook/react-native/commit/eb13baf2a687b53dde04b9a336f18629d94f4b79) by [@sammy-SC](https://github.com/sammy-SC))
- Roll out TurboModule Promise Async Dispatch ([5c4f145e33](https://github.com/facebook/react-native/commit/5c4f145e33d92969f8a86284360a5a2f09308500) by [@RSNara](https://github.com/RSNara))

#### Android specific

- Add `getRecommendedTimeoutMillis` to AccessibilityInfo ([d29a7e7a89](https://github.com/facebook/react-native/commit/d29a7e7a89f4e5e3489e9723979426bb1b6f0674) by [@grgr-dkrk](https://github.com/grgr-dkrk))
- TalkBack now announces "unselected" when changing `accessibilityState.selected` to false. ([73bc96ecf9](https://github.com/facebook/react-native/commit/73bc96ecf9a16d420533c12e9e1812ffe21c10a2) by [@yungsters](https://github.com/yungsters))
- Fbjni version bump to 0.0.3 ([24f9f75bf6](https://github.com/facebook/react-native/commit/24f9f75bf66b8f32a117ba9f9dea3c65b35b1e00) by [@IvanKobzarev](https://github.com/IvanKobzarev))
- Add `onFocus` and `onBlur` for Pressable on Android. ([cab4da7288](https://github.com/facebook/react-native/commit/cab4da728814bf9d3c0cc7c9921e982bfc090730))
- Introduce API to allow applications to register `TurboModuleManagerDelegates` with `ReactInstanceManager` ([eb7e89e286](https://github.com/facebook/react-native/commit/eb7e89e2864e941b4a21d55a7403a6028e9a26a2) by [@RSNara](https://github.com/RSNara))
- Added convenience methods to simplify native Event classes and ease migrations ([72d0ddc16f](https://github.com/facebook/react-native/commit/72d0ddc16f2f631003c3486e0a59e50c145ec613) by [@JoshuaGross](https://github.com/JoshuaGross))

#### iOS specific

- High contrast dynamic color options for dark and light mode. ([4b9d9dda27](https://github.com/facebook/react-native/commit/4b9d9dda270acd4e0314f40490c699ffd0f6e30e) by [@birkir](https://github.com/birkir))
- Adds an ability to retrieve the notifications authorization status from JavaScript side. ([b86e52a9ec](https://github.com/facebook/react-native/commit/b86e52a9ec9ec828388eb4a717a3782a54c7b3d9))
- Added reset method to `RCTFabricSurface` to help with reloads ([53858ceaa3](https://github.com/facebook/react-native/commit/53858ceaa3beab02726b1bd6e125e506477d445e) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Allow `RCTRootView` to be initialized with a frame ([00bc09c8f7](https://github.com/facebook/react-native/commit/00bc09c8f76879eb1f9a92a6a643191da9355de8) by [@appden](https://github.com/appden))
- Allow for configuring the `NSURLSessionConfiguration` ([58444c74f5](https://github.com/facebook/react-native/commit/58444c74f5c18b74e88a6c1cd0f059fe434c1a21) by [@hakonk](https://github.com/hakonk))
- Use react-native-codegen in iOS app template ([e99b8bbb40](https://github.com/facebook/react-native/commit/e99b8bbb404f8cd1f11b6c7998083be530d7b8a4) by [@hramos](https://github.com/hramos))

### Changed

- Bump Flipper + Bump hermes (#31872 by [@Titozzz](https://github.com/Titozzz))
- Show warning when native module without `addListener` or `removeListeners` is passed to `NativeEventEmitter` ([114be1d217](https://github.com/facebook/react-native/commit/114be1d2170bae2d29da749c07b45acf931e51e2) by [@rubennorte](https://github.com/rubennorte))
- Disable `accessibilityState` when the `TouchableWithoutFeedback` is `disabled`. ([697164077c](https://github.com/facebook/react-native/commit/697164077c362cfa9a384b0f4e246d6bd9c470ba) by [@carloscuesta](https://github.com/carloscuesta))
- Upgraded `react-devtools-core dependency` to 4.12.0 ([5a2693d78f](https://github.com/facebook/react-native/commit/5a2693d78f1a886f0aa5b7f86830d3ddb54a57e9) by [@bvaughn](https://github.com/bvaughn))
- Set disabled `accessibilityState` when `TouchableHighlight` is disabled ([f69e096bb4](https://github.com/facebook/react-native/commit/f69e096bb4df67474351786f674b1bb1e42d3363) by [@Naturalclar](https://github.com/Naturalclar))
- Add checks and logs to for better error handling ([ea1f9531f0](https://github.com/facebook/react-native/commit/ea1f9531f00b5cd834e03f58cdfa117a93634624))
- CreateAnimatedComponent: removed deprecated lifecycles usage ([ba61267015](https://github.com/facebook/react-native/commit/ba61267015567bf180dd3272a295dc262b3e2c97) by [@nadiia](https://github.com/nadiia))
- Hide caret in the `TextInput` during test runs. ([397bfa6ad7](https://github.com/facebook/react-native/commit/397bfa6ad7dff71f4b6d27ac17acc76fe8a6bbb5) by [@nadiia](https://github.com/nadiia))
- Use `usePressability` hook in TextInput ([c4aa411ee3](https://github.com/facebook/react-native/commit/c4aa411ee374f2320343b900f1f8b24a47b633c9) by [@nadiia](https://github.com/nadiia))
- `Keyboard` no longer inherits from `NativeEventEmitter`, so it no longer implements `removeAllListeners`, and `removeSubscription`. ([1049835b50](https://github.com/facebook/react-native/commit/1049835b504cece42ee43ac5b554687891da1349) by [@yungsters](https://github.com/yungsters))
- `AppState` no longer inherits from `NativeEventEmitter`, so it no longer implements `addListener`, `removeAllListeners`, and `removeSubscription`. ([6f22989e92](https://github.com/facebook/react-native/commit/6f22989e920246a2cd611b93e170024d89903027) by [@yungsters](https://github.com/yungsters))
- `DevSettings` no longer inherits from `NativeEventEmitter` ([70cd569e7e](https://github.com/facebook/react-native/commit/70cd569e7e4cceac81023eae4ea5089cff2f9b59) by [@yungsters](https://github.com/yungsters))
- LogBox will not initially collapse stack frames if every frame would be collapsed. ([88a41f180c](https://github.com/facebook/react-native/commit/88a41f180c315bc55e05d77ddc3fc671ad8630e6) by [@yungsters](https://github.com/yungsters))
- Update package name warning of deprecated modules ([34e1b0ef98](https://github.com/facebook/react-native/commit/34e1b0ef981559adc09cd9f994bef9584f1c82b7) by [@Naturalclar](https://github.com/Naturalclar))
- Update react-native-codegen to 0.0.7 ([cd6c9f3273](https://github.com/facebook/react-native/commit/cd6c9f3273fbe41052c4ec8512d3b1129daf149b) by [@Naturalclar](https://github.com/Naturalclar))
- Update template devDependencies ([652e3953f4](https://github.com/facebook/react-native/commit/652e3953f48938580e1bf8ea1ba70105997e59d2) by [@Bardiamist](https://github.com/Bardiamist))
- Don't minify JS bundle by default when using hermes ([1a67dda668](https://github.com/facebook/react-native/commit/1a67dda668c71d961a4bb3b0cdf6aa22c0e5c138) by [@janicduplessis](https://github.com/janicduplessis))
- Migrate warnings in index.js to point to new lean core repos ([4421a64ac1](https://github.com/facebook/react-native/commit/4421a64ac1ea9df3827fb99194c8576a0750beab) by [@Naturalclar](https://github.com/Naturalclar))
- Update Flipper to 0.93.0 ([06c33e9abe](https://github.com/facebook/react-native/commit/06c33e9abe6ed51b1c8bba03982ebce2b6da3860) by [@mweststrate](https://github.com/mweststrate))
- Update Flipper to 0.91.1, fixed iOS build support for i386, `use_flipper!()` will no longer need custom overrides to build with XCode 12.5 ([4246c75d0d](https://github.com/facebook/react-native/commit/4246c75d0d5b9dccbe0fd5ecec66b4cc0331f815) by [@mweststrate](https://github.com/mweststrate))
- Find node on m1 via homebrew node managers ([4d40b53c12](https://github.com/facebook/react-native/commit/4d40b53c12c8ad52760c63cacde417ee876bdfb1) by [@danilobuerger](https://github.com/danilobuerger))
- Clean up EventObjectPropertyType ([0e46080847](https://github.com/facebook/react-native/commit/0e46080847595fb7577b18042c932db958bc0959) by [@RSNara](https://github.com/RSNara))
- `Appearance.addChangeListener` now returns an `EventSubscription`. ([305b4253c2](https://github.com/facebook/react-native/commit/305b4253c2a9ed4d71be33e02cb12b6d570e2fb1) by [@yungsters](https://github.com/yungsters))
- `Dimensions.addEventListener` now returns an `EventSubscription`. ([c47a03563d](https://github.com/facebook/react-native/commit/c47a03563db72d1580bf87b7729bd22ce6ca63dd) by [@yungsters](https://github.com/yungsters))
- Updated react-native-community/cli to v6 (hence updating metro to 0.66) ([0d32aef3aa](https://github.com/facebook/react-native/commit/0d32aef3aa9a75b00d99503b8e4f502c52380dea) by [@Titozzz](https://github.com/Titozzz))
- Reflect Hermes release version from HermesBadge ([c54aeccf1a](https://github.com/facebook/react-native/commit/c54aeccf1a8e16240e400d783dda5ec07fcf3808) by [@Huxpro](https://github.com/Huxpro))

#### Android specific

- Modified `NativeEventEmitter` to also use the passed native module to report subscriptions on Android ([f5502fbda9](https://github.com/facebook/react-native/commit/f5502fbda9fe271ff6e1d0da773a3a8ee206a453) by [@rubennorte](https://github.com/rubennorte))
- RefreshControl.size prop changed its type to string, the valid values are: 'default' and 'large' ([dd60414578](https://github.com/facebook/react-native/commit/dd604145781ac07c8db8d9100043bd76f6d6e913), [65975dd28d](https://github.com/facebook/react-native/commit/65975dd28de0a7b8b8c4eef6479bf7eee5fcfb93) by [@mdvacca](https://github.com/mdvacca))
- TouchableNativeFeedback: sync disabled prop with accessibilityState ([88f2356eed](https://github.com/facebook/react-native/commit/88f2356eedf71183d02cde0826c8a0c6910f83dd) by [@kyamashiro](https://github.com/kyamashiro))
- Rename `hasActiveCatalystInstance` to `hasActiveReactInstance` ([dfa8eb0558](https://github.com/facebook/react-native/commit/dfa8eb0558338f18ea01f294a64d355f6deeff06))
- Record latest error type in dev support ([423453e105](https://github.com/facebook/react-native/commit/423453e1050c9aedda2df050a5ee6d40e7c82031))
- Passing accessibility state in button so it can announce disabled in talkback ([5889cbebe3](https://github.com/facebook/react-native/commit/5889cbebe392dd19c6ce0cfd5fa1f725ece1060a) by [@huzaifaaak](https://github.com/huzaifaaak))
- Fixed issue that causes HorizontalScrollView to shift to the right when a TextInput is selected and keyboard pops up ([b9b23e1ab1](https://github.com/facebook/react-native/commit/b9b23e1ab138189d2a4c22b13ba6ad8f8957579e) by [@JoshuaGross](https://github.com/JoshuaGross))
- Fixed jumpy RTL horizontal ScrollViews. If you have Android-specific JS hacks for handling RTL in ScrollViews, you probably can/probably want to remove them, because they should be reliable now and require fewer hacks. ([fc032cd8d8](https://github.com/facebook/react-native/commit/fc032cd8d889d828edad3ea4b735205092cf0d40) by [@JoshuaGross](https://github.com/JoshuaGross))
- Add a new check to avoid calling this method ([2b708560fc](https://github.com/facebook/react-native/commit/2b708560fc002c26f0b09f09cfa451827a3425ac))
- Clipping subviews has been temporarily disabled in HorizontalScrollView in RTL mode. Minor/negligible perf impact. ([da8ed6b625](https://github.com/facebook/react-native/commit/da8ed6b6252fd53a83f14ab6da7e9b467f12ffe1) by [@JoshuaGross](https://github.com/JoshuaGross))
- Change StatusBar style handling strategy ([7324b92dc4](https://github.com/facebook/react-native/commit/7324b92dc45679d3b38526378b7d3e78ad082641))
- Clean listeners during destroy of `ReactContext` ([d79212120b](https://github.com/facebook/react-native/commit/d79212120b7168015d3d0225ef372ed851a230fa) by [@mdvacca](https://github.com/mdvacca))
- Bump buildToolsVersion to 30.0.2, ([5d01110b53](https://github.com/facebook/react-native/commit/5d01110b5370f884907b6dbdc56773f03518a54d) by [@dulmandakh](https://github.com/dulmandakh))
- Initial replacement of jcenter with mavenCentral. ([704dd2812f](https://github.com/facebook/react-native/commit/704dd2812f7b8c79971274cc9e4c717e56847ac0) by [@ShikaSD](https://github.com/ShikaSD))
- Remove developer tool guard for android ([c7d28bca30](https://github.com/facebook/react-native/commit/c7d28bca308c1654c576df9a0328a3116ed65d54))
- Bump Android compileSdkVersion and targetSdkVersion from 29 to 30 ([55c8833817](https://github.com/facebook/react-native/commit/55c8833817c3e9cf9882a712c8b9946a262df231), [c7efd5b369](https://github.com/facebook/react-native/commit/c7efd5b369aa7605a1017791440735ab72bc9fa8) by [@mdvacca](https://github.com/mdvacca))
- Upgrade jsc-android to 250230.2.1 ([341f061ce3](https://github.com/facebook/react-native/commit/341f061ce3ae057f3a958654e0ec3a9c4c8211ad) by [@Kudo](https://github.com/Kudo))
- Bump Gradle to 6.9, Android Gradle Plugin to 4.2.1 ([547b4c92e4](https://github.com/facebook/react-native/commit/547b4c92e4743f5b5816297f48a608ace9de6bb5) by [@dulmandakh](https://github.com/dulmandakh))
- Bump gradle wrapper to 6.8.3 ([7258afeea3](https://github.com/facebook/react-native/commit/7258afeea38949dc408c0af79924f6f36f7ade84) by [@dulmandakh](https://github.com/dulmandakh))
- Bumping OkHttp from 4.9.0 to 4.9.1. ([6caec9d91f](https://github.com/facebook/react-native/commit/6caec9d91fe71bcd80d670218d752c4f251bde81) by [@gedeagas](https://github.com/gedeagas))
- Bumping OkHttp from v3 to v4. ([8207e97f91](https://github.com/facebook/react-native/commit/8207e97f9174a04e319431193c0f63d47a093c44) by [@arazabishov](https://github.com/arazabishov))
- Update Okhttp to version 3.14.19 ([6bfd89d277](https://github.com/facebook/react-native/commit/6bfd89d27724f2aac602fa2acbf4753950f4152e) by [@LukasFPV](https://github.com/LukasFPV))
- Bump Fresco to 2.5.0 ([8fa8934011](https://github.com/facebook/react-native/commit/8fa8934011e4d9f1f7a49c8519fcc97f30a5c74b) by [@dulmandakh](https://github.com/dulmandakh))
- Bump Fresco to 2.3.0 ([280f524b49](https://github.com/facebook/react-native/commit/280f524b491e7a36bb9f9a26e354bb8e125375ed) by [@dulmandakh](https://github.com/dulmandakh))

#### iOS specific

- Give RCTNetworking handler provider block RCTModuleRegistry ([4c5182c1cc](https://github.com/facebook/react-native/commit/4c5182c1cc8bafb15490adf602c87cb5bf289ffd) by [@RSNara](https://github.com/RSNara))
- Give RCTImageURLLoader's loader/decoder provider blocks RCTModuleRegistry ([af6bcfa3ab](https://github.com/facebook/react-native/commit/af6bcfa3ab0ef6e1b0f669dda6cd7d6a5e8975ba) by [@RSNara](https://github.com/RSNara))
- Make RCTTurboModule `getTurboModule`: required ([e0b8f5080f](https://github.com/facebook/react-native/commit/e0b8f5080f814ba2a75807ed6d7f2944aab98d7e) by [@RSNara](https://github.com/RSNara))
- Update React.podspec to require cocoapods >= 1.10.1 ([b50b7e3a19](https://github.com/facebook/react-native/commit/b50b7e3a191dfa95aa122c259e0df8699cbaccae) by [@sunnylqm](https://github.com/sunnylqm))
- Fix glog pod install with Xcode 12 ([8a5fd8ea95](https://github.com/facebook/react-native/commit/8a5fd8ea95678a0b4423db2cbcbefc1a33595813) by [@dulmandakh](https://github.com/dulmandakh))
- Only show Dev Menu on shake if RN view is visible ([7186c4de4f](https://github.com/facebook/react-native/commit/7186c4de4fc76e87fa1386f2839f178dd220a02b) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- `progressViewOffset` prop of `RefreshControl` and `VirtualizedList` now works on iOS ([310a6bcf4b](https://github.com/facebook/react-native/commit/310a6bcf4ba7ca162d3ba1c03e0ab07ff41f9ead) by [@davidbiedenbach](https://github.com/davidbiedenbach))
- Roll out TurboModule block copy ([5275895af5](https://github.com/facebook/react-native/commit/5275895af5136bc278c0c5eb07ae93e395c5b29b) by [@RSNara](https://github.com/RSNara))
- Add instructions to template/ios/Podfile for enabling hermes ([a326a30e32](https://github.com/facebook/react-native/commit/a326a30e322f6cdff880734aafe965b299febb8d) by [@SConaway](https://github.com/SConaway))

### Deprecated

- `EventEmitter#removeSubscription` is now deprecated. ([cb6cbd12f8](https://github.com/facebook/react-native/commit/cb6cbd12f80152b4ce742f37e2e6eefadf89d927) by [@yungsters](https://github.com/yungsters))
- It is now deprecated to pass a constructor argument to `EventEmitter(...)`. ([14f7a2b707](https://github.com/facebook/react-native/commit/14f7a2b70754c92804d746959d1ff091bf49af69) by [@yungsters](https://github.com/yungsters))
- Deprecate `AccessibilityInfo.removeEventListener`. ([003d63d6e5](https://github.com/facebook/react-native/commit/003d63d6e501411f870ff5dbef819ad2aca20974) by [@yungsters](https://github.com/yungsters))
- Deprecate `Linking.removeEventListener`. Instead, call `remove()` on the subscription returned by `Linking.addEventListener`. ([6d1aca806c](https://github.com/facebook/react-native/commit/6d1aca806cee86ad76de771ed3a1cc62982ebcd7), [035718ba97](https://github.com/facebook/react-native/commit/035718ba97bb44c68f2a4ccdd95e537e3d28690c) by [@yungsters](https://github.com/yungsters))
- Old Native method to create ScrollEvent has been deprecated and will be removed at some point in the (distant) future ([62f0dee235](https://github.com/facebook/react-native/commit/62f0dee2353b14ce1524dc62de5e1d2f1883a089) by [@JoshuaGross](https://github.com/JoshuaGross))

#### Android specific

- Deprecate `NativeModule.onCatalystInstanceDestroy()` for `NativeModule.invalidate()` ([18c8417290](https://github.com/facebook/react-native/commit/18c8417290823e67e211bde241ae9dde27b72f17) by [@RSNara](https://github.com/RSNara))
- Mark `hasActiveCatalystInstance()` as Deprecated ([1b50722a7e](https://github.com/facebook/react-native/commit/1b50722a7e84cd8acffd3f0f84d77057e1e0d955))

### Removed

- Stabilize `RootTagContext` ([9b98edcd01](https://github.com/facebook/react-native/commit/9b98edcd0155a4a8a1f71d19e565c485910a6137) by [@nadiia](https://github.com/nadiia))
- Removed `getNode()` from animated component refs. ([b914153286](https://github.com/facebook/react-native/commit/b914153286ea537d4a57ff934e63e07172c576a0) by [@yungsters](https://github.com/yungsters))
- Remove legacy context API usage in AppContainer ([17be3a0032](https://github.com/facebook/react-native/commit/17be3a0032c181a100efc7af17b7366a3d636c52) by [@nadiia](https://github.com/nadiia))
- Removed `AccessibilityInfo.fetch`, use `isScreenReaderEnabled` instead. ([d831134d51](https://github.com/facebook/react-native/commit/d831134d514c5db6be1ee35cc7e9994b777179c1) by [@yungsters](https://github.com/yungsters))
- Remove unused VR-only props ([95f7c791c5](https://github.com/facebook/react-native/commit/95f7c791c56b527dadbe0b4ec7a1be5af12d7afe) by [@Simek](https://github.com/Simek))
- Removed `RCTDeviceEventEmitter.sharedSubscribers`. ([3af0c84aa5](https://github.com/facebook/react-native/commit/3af0c84aa5d1633f058ea3e7aef0d125fe33e01d) by [@yungsters](https://github.com/yungsters))
- Moved `ScrollResponder.Mixin` methods into ScrollView to Remove ScrollResponder.js ([099f67cf8a](https://github.com/facebook/react-native/commit/099f67cf8aa290592092cfa0cb4e938d0543b696) by [@kacieb](https://github.com/kacieb))
- `NativeEventEmitter` no longer inherits from `EventEmitter`, so it no longer implements `removeListener` and `removeSubscription`. Instead, use the `remove()` method on the subscription object returned by `addListener`. ([d39643b9de](https://github.com/facebook/react-native/commit/d39643b9de11c6b44984166ede34a7f44de76fe5) by [@yungsters](https://github.com/yungsters))
- `RCTDeviceEventEmitter` no longer throws for `StatusBar`, `Keyboard`, and `AppState` events. However, you are still recommended to use the more appropriate modules for listening to these events. ([c8c975f0d7](https://github.com/facebook/react-native/commit/c8c975f0d7b8a57e9e90373a2be4d630ed9dd65e) by [@yungsters](https://github.com/yungsters))
- Removed second optional argument of `NativeEventEmitter` constructor ([f5f47879b8](https://github.com/facebook/react-native/commit/f5f47879b8320a9934914cb8ce7a72269840a83a) by [@yungsters](https://github.com/yungsters))
- Removed warning on Android for `setTimeout` with delays greater than 1 minute. ([480dabd665](https://github.com/facebook/react-native/commit/480dabd66547a60522249eda203a3eb1934b02e5) by [@yungsters](https://github.com/yungsters))
- Removed `Touchable.TOUCH_TARGET_DEBUG` property. ([ef765d423c](https://github.com/facebook/react-native/commit/ef765d423cb188957a9fb2fd92c62b0efe8a36a6) by [@yungsters](https://github.com/yungsters))

#### Android specific

- Remove okhttp3 proguard rules ([b4c9f13fe7](https://github.com/facebook/react-native/commit/b4c9f13fe794283d76766c1baef87888d174cb1c) by [@doniwinata0309](https://github.com/doniwinata0309))
- Remove filter pills ([5cf4ab8dd2](https://github.com/facebook/react-native/commit/5cf4ab8dd28b5a336d7af29d295ede51f0d19587) by [@suminkimm](https://github.com/suminkimm))
- Remove `ReactFragmentActivity` class. ([2798e7172b](https://github.com/facebook/react-native/commit/2798e7172b01b9e2dbe2937d0163f98ab29230cf) by [@dulmandakh](https://github.com/dulmandakh))
- Remove jcenter ([70da640946](https://github.com/facebook/react-native/commit/70da64094608f5f2e3c554ed719e9aad624e3459) by [@dulmandakh](https://github.com/dulmandakh))

#### iOS specific

- Removed event methods except `addListener` from `Networking` ([a81b7d18fa](https://github.com/facebook/react-native/commit/a81b7d18fa65a727539c6c7ea17f787673d3c889) by [@yungsters](https://github.com/yungsters))
- Delete deprecated "live reloading" setting ([b512beb0c4](https://github.com/facebook/react-native/commit/b512beb0c497158f9c861fcc16af960655b1feb5) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Remove iOS10/tvOS10 support ([f2c6279ca4](https://github.com/facebook/react-native/commit/f2c6279ca497b34d5a2bfbb6f2d33dc7a7bea02a), [a1d626739d](https://github.com/facebook/react-native/commit/a1d626739d95d6cbbb1be169b93952cdd1465486) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Remove iOS10/tvOS10 support from remaining podfiles ([f0faa7843c](https://github.com/facebook/react-native/commit/f0faa7843c5a0e9041edb6e77fd6631335ab2b12) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Delete RCTTurboModuleManagerDelegate `getTurboModule:initParams` ([c4c34a1237](https://github.com/facebook/react-native/commit/c4c34a1237ec584c667c62358dc577174bf11033) by [@RSNara](https://github.com/RSNara))

### Fixed

- Don't disconnect DevTools WebSocket connection on Cmd+D ([60a18c138c](https://github.com/facebook/react-native/commit/60a18c138c51d3adcfeba7785315fc222cdfeb35) by [@bvaughn](https://github.com/bvaughn))
- For native components that accept color arrays, invalid elements will now fallback to transparent with a console error. ([bb6cd56fae](https://github.com/facebook/react-native/commit/bb6cd56fae4118f44ae47fd6978710a22f9e1510) by [@yungsters](https://github.com/yungsters))
- Fixes usage of std::thread in runtime executor ([75d9ba733f](https://github.com/facebook/react-native/commit/75d9ba733f4a041e4320098b52903f69747df02b) by [@asklar](https://github.com/asklar))
- Fix sticky header not sticking on first render in ScrollView ([921c9ff165](https://github.com/facebook/react-native/commit/921c9ff165d47a73e9978df918b1761b95f9979d) by [@kacieb](https://github.com/kacieb))
- Fix ScrollView `getInnerViewNode` and `getInnerViewRef` ref methods ([6e36d046a3](https://github.com/facebook/react-native/commit/6e36d046a313c7961cc2f91e0422f4bf29005eb6) by [@vshab](https://github.com/vshab))
- Fix stalling UI due to a bug in KeyboardAvoidingView ([67309277fe](https://github.com/facebook/react-native/commit/67309277fe588c4dd64fe0c680d1d00d2f3fb2b6) by [@sammy-SC](https://github.com/sammy-SC))
- Avoid eating clicks/taps into ScrollView when using physical keyboard ([6d2a527984](https://github.com/facebook/react-native/commit/6d2a5279841886a9a14f82057202bf8950c3f917) by [@NickGerleman](https://github.com/NickGerleman))
- Fix nested FlatList not firing `onScrollDragEnd` and `onMomentum` methods ([46be292f67](https://github.com/facebook/react-native/commit/46be292f671c70aac4ecc178c96e3a2a6a3d16da) by [@kacieb](https://github.com/kacieb))
- Fix race condition in Debug Inspector shutdown ([d021000b9e](https://github.com/facebook/react-native/commit/d021000b9e358a9379ca5d6208f24757c0c8ce97) by [@MartinSherburn](https://github.com/MartinSherburn))
- Fixes layout of nodes with `YGDisplayNone` and `YGPositionTypeAbsolute` ([b15f8a30e7](https://github.com/facebook/react-native/commit/b15f8a30e75b54a8de5cc9456aaa07ebe8d8a176) by [@rozele](https://github.com/rozele))
- Fix changes of View visibilities ([4076293aa1](https://github.com/facebook/react-native/commit/4076293aa1059005704576530d8fe948b85e6a6d) by [@mdvacca](https://github.com/mdvacca))
- Fix: save connection url as class variable ([8facc865ab](https://github.com/facebook/react-native/commit/8facc865ab2ec032da34f6f755ee8870ee4741aa) by [@sirpy](https://github.com/sirpy))
- Fix Hermes build on folly version 2021.04.26.00 ([8eceee744e](https://github.com/facebook/react-native/commit/8eceee744ed9fee1eb2402f6b13bb606f6046f62) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Fix disabled handling for Text ([33ff4445dc](https://github.com/facebook/react-native/commit/33ff4445dcf858cd5e6ba899163fd2a76774b641) by [@lunaleaps](https://github.com/lunaleaps))
- Fix disabled prop not disabling onPress for voice assistant ([1c7d9c8046](https://github.com/facebook/react-native/commit/1c7d9c8046099eab8db4a460bedc0b2c07ed06df) by [@kacieb](https://github.com/kacieb))
- Fix unsafe cast and detect overflow in MapBuffer. ([e69f1c9f50](https://github.com/facebook/react-native/commit/e69f1c9f50c64bfcaeb684d763f02b9ccadec960))
- Fix(deps): bump metro to 0.66.2 + dedup ([e40f58272d](https://github.com/facebook/react-native/commit/e40f58272d51a40e7b5fa77c14767ddaf9ecc006) by [@Titozzz](https://github.com/Titozzz))

#### Android specific

- Fixed crash when using style `borderRadius: any` with `backgroundColor: null` ([42b6e6682c](https://github.com/facebook/react-native/commit/42b6e6682ce0fa9ac6eb5c1bf8ef0c224d2d80c0))
- Fix font weight numeric values ([3827ca6171](https://github.com/facebook/react-native/commit/3827ca61714b699c866e17d58b4697dde86e3d00) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fix wrong ripple color on Switch component ([1b0683533a](https://github.com/facebook/react-native/commit/1b0683533a07aa8875b4d494d8c2a3d18ef69438) by [@rnike](https://github.com/rnike))
- Fix Selected State does not announce when TextInput Component selected on Android ([7ee2acc6c8](https://github.com/facebook/react-native/commit/7ee2acc6c84c9ea6a51908495a6f14a26f346b29) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fix layout bug in ReactTextView. ([dec1b6ba15](https://github.com/facebook/react-native/commit/dec1b6ba15df8f255d30b696a7c08ef543d1d19c))
- Fix source build on Windows machines vol. 2 ([c37d49492b](https://github.com/facebook/react-native/commit/c37d49492b20c3815ca10133f971755f659b1b6a))
- Make NativeModules immediately initializable ([2bf866e401](https://github.com/facebook/react-native/commit/2bf866e4018ea72c1f1c92c806db85378c801fb7) by [@RSNara](https://github.com/RSNara))
- Restore `android_hyphenationFrequency` on `Text`. ([1433ed6333](https://github.com/facebook/react-native/commit/1433ed6333162189730d6f92cf80f3077ac69120) by [@yungsters](https://github.com/yungsters))
- Display the `testID` as the `resource-id` for black-box testing frameworks ([381fb395ad](https://github.com/facebook/react-native/commit/381fb395ad9d2d48717a5d082aaedbecdd804554) by [@jdeff](https://github.com/jdeff))
- Fix support for blobs larger than 64 KB ([f00e348ca7](https://github.com/facebook/react-native/commit/f00e348ca7f031c3577b1335a3163bc3e4eb4b41) by [@tomekzaw](https://github.com/tomekzaw))
- Fix building React Android on Windows. ([5dc15222b2](https://github.com/facebook/react-native/commit/5dc15222b256e32517df553c5fe7f6f5b7d0d31f))
- Fix race-condition on the initialization of ReactRootViews ([74a756846f](https://github.com/facebook/react-native/commit/74a756846fdab1ef7d183c4df3069a23fcd0d49e) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- Animated images without loop no longer animate twice ([17aa1e320e](https://github.com/facebook/react-native/commit/17aa1e320e75393d46a54ec0fee8b068eeef142f) by [@comvenger-brandon](https://github.com/comvenger-brandon))
- Allow PlatformColor to work with border colors ([c974cbff04](https://github.com/facebook/react-native/commit/c974cbff04a8d90ac0f856dbada3fc5a75c75b49) by [@danilobuerger](https://github.com/danilobuerger))
- RCTSurfaceHostingView default background color is now consistent with RCTRootView ([f31497354b](https://github.com/facebook/react-native/commit/f31497354b72ad51b452a4b8bd3b70de16830025) by [@fkgozali](https://github.com/fkgozali))
- Invalidate TurboModules with infra-generated method queues on their method queues ([497eb578ab](https://github.com/facebook/react-native/commit/497eb578ab32614744a4ef61d7a6bca0d4251885) by [@RSNara](https://github.com/RSNara))
- Fix RefreshControl layout when removed from window ([e67811e7a6](https://github.com/facebook/react-native/commit/e67811e7a6df0937ed61d3367ab10fab95b31bfa) by [@janicduplessis](https://github.com/janicduplessis))
- Tab Accessibility Role had incorrect localization string ([80a10953f9](https://github.com/facebook/react-native/commit/80a10953f9de8cc251e9b8c1e59a173af87febb9) by [@adkenyon](https://github.com/adkenyon))
- Incorrect ScrollView offset on update ([a4526bcc3f](https://github.com/facebook/react-native/commit/a4526bcc3f89f5b9d3f86c814ade8f55c86e819e) by [@rnike](https://github.com/rnike))
- Modal's `onDismiss` prop will now be called successfully. ([d85d5d2e19](https://github.com/facebook/react-native/commit/d85d5d2e1974b463318e4c86da29a5ccdd60a977) by [@kkoudev](https://github.com/kkoudev))
- Fix DatePicker sizing issue ([84d55868e8](https://github.com/facebook/react-native/commit/84d55868e8b4e5a555d324c6162b8e38571524d8) by [@sammy-SC](https://github.com/sammy-SC))
- First press not working after pull to refresh ([c4950610e4](https://github.com/facebook/react-native/commit/c4950610e40f2019c828bc99e29769cd4089c217) by [@rnike](https://github.com/rnike))
- Fix Codegen silently failing when Yarn is not installed, or when Yarn v2 is active. ([07e4953514](https://github.com/facebook/react-native/commit/07e4953514636aaadc5915944cc64c12028516f2) by [@ivanmoskalev](https://github.com/ivanmoskalev))
- Make codegen more reliable on iOS ([12fccdeea3](https://github.com/facebook/react-native/commit/12fccdeea33324b8ddaa3ac0e2dbf81a44ca1eb2) by [@janicduplessis](https://github.com/janicduplessis))
- Fix crash in RCTCoreModulesClassProvider during quit ([2f62c2892d](https://github.com/facebook/react-native/commit/2f62c2892d9979f80752350d1b949f2770511956) by [@appden](https://github.com/appden))
- Fix an issue calling stopSurface in bridgeless mode before surface is started ([81096901a8](https://github.com/facebook/react-native/commit/81096901a8a6da75744cef7b663ccea2ff9c4c09))
- Move hermes to a separate podspec ([0959ff36d1](https://github.com/facebook/react-native/commit/0959ff36d1f3264e117021eb1999d0bdb71377c3) by [@janicduplessis](https://github.com/janicduplessis))
- Fix cli bundle platform for Mac Catalyst in `react-native-xcode.sh` ([b496a531e0](https://github.com/facebook/react-native/commit/b496a531e0b4b5d828077b0e7dff43dd28fed5eb) by [@robertying](https://github.com/robertying))
- Fix `prefetchImageWithMetadata` redbox([f27e305056](https://github.com/facebook/react-native/commit/f27e305056152ff9ad7aeb9018bf289d51719eb9) by [@p-sun](https://github.com/p-sun))
- Roll out RCTNetworking extraneous NativeModule call removal ([0e0d2e84f5](https://github.com/facebook/react-native/commit/0e0d2e84f56ea233e72d980ff6bd9797df250553) by [@RSNara](https://github.com/RSNara))
- Fix Hermes + no Flipper build on Xcode 12.5 ([b9243e00e3](https://github.com/facebook/react-native/commit/b9243e00e30be057a45af6ed1916af4328c458e4) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Fix(hermes): fixed hermes build on iOS ([59abb5f378](https://github.com/facebook/react-native/commit/59abb5f378e116288cdea2f619de0c128bb0b0eb) by [@Titozzz](https://github.com/Titozzz))
- Fix builds on Xcode 12.5 ([36b58a824e](https://github.com/facebook/react-native/commit/36b58a824ea20daa22fe7c528a3bf0ff4e6a4cb5) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Fix running React Native project with Xcode 12 in Release on iPhone Simulator ([fdcacd7f76](https://github.com/facebook/react-native/commit/fdcacd7f76ea8ca6dafda32ac431c8adc7bdad00) by [@grabbou](https://github.com/grabbou))

## v0.64.4

🚨 **IMPORTANT:** This is an exceptional release on an unsupported version. We recommend you upgrade to one of [the supported versions, listed here](https://github.com/reactwg/react-native-releases#which-versions-are-currently-supported).

### Fixed

- Add an afterEvaluate to solve AGP 4.1.x configuration resolution ([667f1bd21a](https://github.com/facebook/react-native/commit/667f1bd21abfdda19e56f8bbf0520fddba3102ed) by [@cortinico](https://github.com/cortinico))
- Force dependencies resolution to minor series for 0.64 ([a6a183ad81](https://github.com/facebook/react-native/commit/a6a183ad8106d67e3befce842138e82fb1e136fd) by [@kelset](https://github.com/kelset))

## v0.64.3

### Fixed

- For Android, general fixes to Appearance API and also fixes AppCompatDelegate.setDefaultNightMode(). For iOS, now works correctly when setting window.overrideUserInterfaceStyle ([25a2c608f7](https://github.com/facebook/react-native/commit/25a2c608f790f42cbc4bb0a90fc06cc7bbbc9b95) by [@mrbrentkelly](https://github.com/mrbrentkelly))

## v0.64.2

### Changed

- Find-node.sh supports Homebrew on M1 ([502b819049](https://github.com/facebook/react-native/commit/502b81904998b800f2d960bb4a8e244988c72958) by [@dulmandakh](https://github.com/dulmandakh))
- Refactor UIManagerHelper.getUIManager to return null when there's no UIManager registered ([b0e8c1eac0](https://github.com/facebook/react-native/commit/b0e8c1eac0a9edda12ecfa264209a8b3222afe27) by [@mdvacca](https://github.com/mdvacca))

### Fixed

- Fix ScrollViewStickyHeader to push up header above it ([d754bdefc6](https://github.com/facebook/react-native/commit/d754bdefc68ff757ac2b5a2ffa38d5aad234d484) by [@kacieb](https://github.com/kacieb))

#### Android specific

- Font family is not apply when secureTextEntry is true ([cda77c77dd83cba07e6c2e56e938c3e4f7faf8fc](https://github.com/facebook/react-native/commit/cda77c77dd83cba07e6c2e56e938c3e4f7faf8fc) by [@hank121314](https://github.com/hank121314))
- Dimension update events are now properly sent following orientation change ([a6a4d3365f17332e367c34357a07a73f97d6ec83](https://github.com/facebook/react-native/commit/a6a4d3365f17332e367c34357a07a73f97d6ec83) by [@ajpaulingalls](https://github.com/ajpaulingalls))

## v0.64.1

### Fixed

#### iOS specific

- Fixes to ensure Xcode 12.5 builds ([cf8a364767](https://github.com/facebook/react-native/commit/cf8a364767df830d7255339741350bb53ab1a68a), [1c4ac48a55](https://github.com/facebook/react-native/commit/1c4ac48a55cf0703f0c8a32cbb07474a2d126f3e) and [76f45d35e7](https://github.com/facebook/react-native/commit/76f45d35e710f84a1cc44c90bc128494bc4280ce) by [@kelset](https://github.com/kelset))

### Security

- Update validateBaseUrl to use latest regex ([33ef82ce6d](https://github.com/facebook/react-native/commit/33ef82ce6dfd31e1f990d438c925a0e52723e16b) by [@FBNeal](https://github.com/FBNeal))

## v0.64.0

### Breaking

- Enable `inlineRequires` by default in new projects' `metro.config.js`. Gives a performance benefit but slightly different JS execution order ([959365a902](https://github.com/facebook/react-native/commit/959365a90216ee14d0f8b5d2f4653a1ab4c10d7e) by [@GantMan](https://github.com/GantMan))
- Minimum supported Node version changed to 12 ([4b92e2e53d](https://github.com/facebook/react-native/commit/4b92e2e53d9c79f5b5858b3eb0d1654da79a4a68) by [@safaiyeh](https://github.com/safaiyeh))
- Remove deprecated `CameraRoll` API (deprecated in 0.61) ([824d3a9770](https://github.com/facebook/react-native/commit/824d3a977057b336d81237ec3cec3a49a9d5e34d) by [@seanyusa](https://github.com/seanyusa))
- Remove deprecated `CheckBox` component (deprecated in 0.60) ([dff17effe5](https://github.com/facebook/react-native/commit/dff17effe54dc58dda19fcc81ebacbd8f46e9005) by [@poteto](https://github.com/poteto))
- Removed `DEPRECATED_sendUpdatedChildFrames` prop from `ScrollView` component (deprecated in 0.47) ([345d0c1abb](https://github.com/facebook/react-native/commit/345d0c1abb1afe937a06982c4328caee57820832) by [@ZHUANGPP](https://github.com/ZHUANGPP))
- On `Image`, `onLoad` event objects' `source.url` is now renamed to `source.uri`. ([74ab8f6e5a](https://github.com/facebook/react-native/commit/74ab8f6e5a61999f1132351ff52df43c91360a09) by [@yungsters](https://github.com/yungsters))

#### Android specific

- Remove support of Android API levels 16 through 20. The new minSDK version will be 21+ moving forward. ([973198667d](https://github.com/facebook/react-native/commit/973198667d7bbbf3b5d8890fc0a53dc99d0bce18), [25a40cbc61](https://github.com/facebook/react-native/commit/25a40cbc61e6c718d8cdea6d67fd82c6309963b1), [f829722b54](https://github.com/facebook/react-native/commit/f829722b54b34f145c41a95edfa5b522c837f9fc), [b133427778](https://github.com/facebook/react-native/commit/b13342777856bc4024d8489de790e7f90cd6b33b), [9b34aa261c](https://github.com/facebook/react-native/commit/9b34aa261c272d96829c9a7d5b166594b3162f9d), and [79d0a7d711](https://github.com/facebook/react-native/commit/79d0a7d71119122d2a2b9954e6038bbee119b8fa) by [@mdvacca](https://github.com/mdvacca); [49f10fd2e5](https://github.com/facebook/react-native/commit/49f10fd2e526b64294777357ab2fef8880739f26) and [a17ff44adc](https://github.com/facebook/react-native/commit/a17ff44adcf003dd4e4ef2301e1f80b77913f712) by [@JoshuaGross](https://github.com/JoshuaGross); [dd4298a377](https://github.com/facebook/react-native/commit/dd4298a3770eee7f66846ef0cc4c41a628b7bf01) by [@safaiyeh](https://github.com/safaiyeh))
- Fix ReadableArray null annotations. Possibly breaking change for Kotlin apps. ([d76556543f](https://github.com/facebook/react-native/commit/d76556543f96f4d739be3a708b8f6314bb32cc87) by [@dulmandakh](https://github.com/dulmandakh))
- On `Image`, `onLoad` and `onError` event objects will no longer have an extra `uri` property. ([74ab8f6e5a](https://github.com/facebook/react-native/commit/74ab8f6e5a61999f1132351ff52df43c91360a09) by [@yungsters](https://github.com/yungsters))
- Deletes the method PlayTouchSound method from UIManagerModule, this method was moved to the SoundManagerModule class. ([d0c4c5eaf9](https://github.com/facebook/react-native/commit/d0c4c5eaf90430c7004621d1596c5f2a55ad03e0) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- Remove `calculateChildFrames` from `RCTScrollView` ([62aa84a325](https://github.com/facebook/react-native/commit/62aa84a3257bd3c513df3fcb4b4eaa350ecf77bb) by [@PeteTheHeat](https://github.com/PeteTheHeat))

### Deprecated

#### Android specific

- Deprecated method `UIManagerModule.getUIImplementation`. This method will not be part of the new architecture of React Native. ([fe79abb32c](https://github.com/facebook/react-native/commit/fe79abb32ca3425ff689b7641d9200461ea8166d) by [@mdvacca](https://github.com/mdvacca))

### Added

- Adds the Hermes runtime bytecode version number to the JS bundle requestURL. This allows Metro with Bytecode to work with prebuilt binaries. ([34c405462f](https://github.com/facebook/react-native/commit/34c405462f890afbccdfeaa7804791f7e9bcaa83))
- TextInput now supports `onPressIn` and `onPressOut`. ([b7b0e23202](https://github.com/facebook/react-native/commit/b7b0e232028723794af4c79fc6366c483ae2350b) by [@yungsters](https://github.com/yungsters))
- Allow setting a custom performance logger in XMLHttpRequest ([57b10f759e](https://github.com/facebook/react-native/commit/57b10f759efed786b46cfe082367f929aa2925d3) by [@rubennorte](https://github.com/rubennorte))
- Add mock for `DevSettings` to jest preset ([a50f736bb6](https://github.com/facebook/react-native/commit/a50f736bb6ade9ea9caae45e41ca4b92f6707b17) by [@MarcoScabbiolo](https://github.com/MarcoScabbiolo))
- Added Inspector overlay support for Pressable ([8ac467c51b](https://github.com/facebook/react-native/commit/8ac467c51b94c82d81930b4802b2978c85539925) by [@yungsters](https://github.com/yungsters))
- Introduce NativeModulePerfLogger ([0486640571](https://github.com/facebook/react-native/commit/0486640571c89a0ce067c0437655a6b375308bcd) by [@RSNara](https://github.com/RSNara))
- Add default `titlePlaceholder` in template configuration. ([8ffa180d80](https://github.com/facebook/react-native/commit/8ffa180d80b9c9acb76a0631b5a709d2c0adcd86) by [@Esemesek](https://github.com/Esemesek))
- Modified `renderApplication` to forward `initialProps` to `WrapperComponent` ([4f5a092bf6](https://github.com/facebook/react-native/commit/4f5a092bf68a0cd825328ce4a1e6bb41a8fad2e3) by [@rubennorte](https://github.com/rubennorte))
- Add warning to `VirtualizedList` when incorrectly using nested Lists or custom scroll components ([7f2515ece8](https://github.com/facebook/react-native/commit/7f2515ece8833f7a8adba025ef544013f89ae26f) by [@kacieb](https://github.com/kacieb))
- Add native module for loading split JS bundles in development ([fca3a39da5](https://github.com/facebook/react-native/commit/fca3a39da5f1c31514e8969738e7b2c2d22bc230) by [@makovkastar](https://github.com/makovkastar))
- Added `listenerCount()` to `DeviceEventEmitter` and `NativeEventEmitter`. ([b11d6ecbb8](https://github.com/facebook/react-native/commit/b11d6ecbb8bb2f0d6f423be6775e587f4e9b1c4d) by [@yungsters](https://github.com/yungsters))

#### Android specific

- Upgrade Hermes to version 0.7 and turn on ES6 Proxy support ([776a415d98](https://github.com/facebook/react-native/commit/776a415d98dffd04b11200812a32204aa1c5e157) and [bb003816a3](https://github.com/facebook/react-native/commit/bb003816a389b8655c53fa34444417c14516459c) by [@Huxpro](https://github.com/Huxpro), [a28dd38909](https://github.com/facebook/react-native/commit/a28dd3890974d699070f08ab43781324411e6f5c) by [@janicduplessis](https://github.com/janicduplessis))
- Add support for `shadowColor` on API level >= 28 ([cfa4260598](https://github.com/facebook/react-native/commit/cfa42605989eee5a9de42bdb1259fb7f4d9451fb) by [@IjzerenHein](https://github.com/IjzerenHein))
- Add `android_hyphenationFrequency` prop to Text component ([0fda91ffff](https://github.com/facebook/react-native/commit/0fda91ffffa4972ebe58e3d0b610692a1286eaa1) and [7d8aeb4955](https://github.com/facebook/react-native/commit/7d8aeb4955a4101ca7e8e486f935309c21ab76ff) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Add `accessibilityHint` to TouchableNativeFeedback ([72285d808d](https://github.com/facebook/react-native/commit/72285d808dfce748287a19e2620d58517a5f76e7) by [@CMDadabo](https://github.com/CMDadabo))
- Adds support for the `onProgress` event on `Image` ([fa0e6f8051](https://github.com/facebook/react-native/commit/fa0e6f8051d2208af467b789a2a9306ec7ddad76) by [@yungsters](https://github.com/yungsters))
- ScrollView now supports `contentOffset` ([ed29ba13f9](https://github.com/facebook/react-native/commit/ed29ba13f97f240c91fdf6c0ef3fb601046697b9) by [@JoshuaGross](https://github.com/JoshuaGross))
- Add an explicit NDK version to Android template ([18ffe12203](https://github.com/facebook/react-native/commit/18ffe12203d03b4e960d61d7bb50cd02bba94663) by [@safaiyeh](https://github.com/safaiyeh))
- Exposed `getFlex` method as part of ReactShadowNode API ([6570f7887b](https://github.com/facebook/react-native/commit/6570f7887b8824705ae09b5653d631428e17bc5f) by [@mdvacca](https://github.com/mdvacca))
- Add `\*.hprof` files to gitignore ([69ce9c21d4](https://github.com/facebook/react-native/commit/69ce9c21d433a23ffb9934062b46fa64277ee255) by [@enesozturk](https://github.com/enesozturk))
- Move `DevSettingsActivity` from main to debug ([d8e6c45782](https://github.com/facebook/react-native/commit/d8e6c45782a5c9132bb7ec315fe0b9ba3999e830) by [@invalid-email-address](https://github.com/invalid-email-address))

#### iOS specific

- `PlatformColor`: add missing `clearColor` ([b7167c23fc](https://github.com/facebook/react-native/commit/b7167c23fc052f8d9f8c27a7f4ad9c5cdf51281e) by [@Simek](https://github.com/Simek))
- Update template to Xcode 12 ([6685aba462](https://github.com/facebook/react-native/commit/6685aba462699c696cb6ac95626b9592deb292fc) by [@janicduplessis](https://github.com/janicduplessis))
- Add `importantForAccessibility` to `AccessibilityProps` ([fd660fd0c5](https://github.com/facebook/react-native/commit/fd660fd0c50a0acca730bd1ecd427e574bbe81c7) by [@ZHUANGPP](https://github.com/ZHUANGPP))
- Allow hotkeys to be used without command key ([f2b9ec7981](https://github.com/facebook/react-native/commit/f2b9ec798172db76dfb55f390e1fcea90dd341da) by [@rickhanlonii](https://github.com/rickhanlonii))
- Add `disableButtonsIndices` option to `ActionSheetIOS` component ([a7c1c5aff2](https://github.com/facebook/react-native/commit/a7c1c5aff24671bba609caeb82092a8de3d3b232) by [@lukewalczak](https://github.com/lukewalczak))
- Add `showSoftInputOnFocus` to `TextInput` ([d54113d8c4](https://github.com/facebook/react-native/commit/d54113d8c4bcd0e0c7a09acca60819724eb69926) by [@gurs1kh](https://github.com/gurs1kh))
- Added hostname to loading banner. ([96999339b6](https://github.com/facebook/react-native/commit/96999339b6a7aeabd0cd706ef7736fd91d9ecf80) by [@rickhanlonii](https://github.com/rickhanlonii))
- Allow iOS `PlatformColor` strings to be ObjC or Swift UIColor selectors ([25793eab56](https://github.com/facebook/react-native/commit/25793eab56217a9961620761ea65ec2fcb97dcb0) by [@tom-un](https://github.com/tom-un))
- Add Dark Mode support to loading banner ([94c45af136](https://github.com/facebook/react-native/commit/94c45af136f44245b5f2e56bded60c8ebd9b1235) by [@rickhanlonii](https://github.com/rickhanlonii))
- Allow image loaders to enable/disable image telemetry ([e37708dfb6](https://github.com/facebook/react-native/commit/e37708dfb605dd9ee9f4b2dac5d841d98b7d376c) by [@p-sun](https://github.com/p-sun))
- Add `RCTDevSplitBundleLoader` native module ([ad879e50bc](https://github.com/facebook/react-native/commit/ad879e50bcd51caca76b1073720f2b63df485ff1) by [@cpojer](https://github.com/cpojer))

### Changed

- Update flipper to 0.75.1 ([3399896ae7](https://github.com/facebook/react-native/commit/3399896ae756719b238e837001077a46508849be) by [@janicduplessis](https://github.com/janicduplessis))
- Refined Flow type for `Text` component. ([a911efaecd](https://github.com/facebook/react-native/commit/a911efaecd005237816ddb480218eb5388460d16) by [@yungsters](https://github.com/yungsters))
- Changed type definition of IPerformanceLogger from object to interface ([b90f4d978f](https://github.com/facebook/react-native/commit/b90f4d978fa27e37926d9f4a1d13c9168243798c) by [@rubennorte](https://github.com/rubennorte))
- Removed `fbjs` dependency from `react-native`. ([54e19a6b7f](https://github.com/facebook/react-native/commit/54e19a6b7f217ffc0611e660f2a6b1a8ad14775b) by [@yungsters](https://github.com/yungsters))
- Refined `ImageSource` Flow type for array-variant and headers. ([a0dc252dc8](https://github.com/facebook/react-native/commit/a0dc252dc89699f7bd0d733642b98762d0db423a) by [@yungsters](https://github.com/yungsters))
- Some warnings changed to use `console.warn` without the "Warning:" prefix. ([982272932c](https://github.com/facebook/react-native/commit/982272932cee3be599076bd18b290bc812285533) by [@yungsters](https://github.com/yungsters))
- Core/Differ: detect and optimize reparenting ([1e4d8d902d](https://github.com/facebook/react-native/commit/1e4d8d902daca8e524ba67fc3c1f4b77698c4d08) by [@JoshuaGross](https://github.com/JoshuaGross))
- Improve "not a registered callable module" error message ([e27d656ef3](https://github.com/facebook/react-native/commit/e27d656ef370958c864b052123ec05579ac9fc01) by [@vonovak](https://github.com/vonovak))
- Use `VirtualizedList`'s `onEndReachedThreshold` default value when null is provided ([10b4b9505a](https://github.com/facebook/react-native/commit/10b4b9505a51f8bf3fbc12d296a087b784a9201a) by [@fatalsun](https://github.com/fatalsun))
- Migrate large amount of modules to flow strict and strict-local ([4409642811](https://github.com/facebook/react-native/commit/4409642811c787052e0baeb92e2679a96002c1e3) by [@rubennorte](https://github.com/rubennorte))
- Enable exact objects by default in the project template Flow config ([050a7dd019](https://github.com/facebook/react-native/commit/050a7dd019be435b848de0a86030599d83f8791d) by [@rubennorte](https://github.com/rubennorte))
- Minor fix in Hermes Inspector cli tool help message ([6ffb983f83](https://github.com/facebook/react-native/commit/6ffb983f83afdee5d9290c683c5060d2a959818d))
- Updated the React Hooks ESLint Plugin in the community ESLint config ([ac87e90fa5](https://github.com/facebook/react-native/commit/ac87e90fa517676440c1adf9575cb48f90de8069) by [@gaearon](https://github.com/gaearon))
- Don't scroll to `initialScrollIndex` if `contentOffset` is provided to the same `VirtualizedList` ([3346ac7f96](https://github.com/facebook/react-native/commit/3346ac7f96d2fd3f77dca5acb283b28e02ad21fa) by [@markv](https://github.com/markv))
- Migrated `VirtualizedList` legacy context implementation to `React.Context`. ([7bd694fc6f](https://github.com/facebook/react-native/commit/7bd694fc6f4bb027b6d7ee04034cad41a43e5695) by [@yungsters](https://github.com/yungsters))
- Changed Flow type of `BackHandler` to be more specific. ([a903d1b86a](https://github.com/facebook/react-native/commit/a903d1b86ab56163abcdcb584f335949ba0c85fc) by [@Naturalclar](https://github.com/Naturalclar))
- Updated transitive dependency `kind-of` to 6.0.3 to resolve vulnerability ([abde0154ba](https://github.com/facebook/react-native/commit/abde0154ba4247d2c9f1451b5de8b3cba1abd316) by [@TheSavior](https://github.com/TheSavior))
- Upgrade eslint-config dependencies. ([93019dc190](https://github.com/facebook/react-native/commit/93019dc19072776053a88f9ab595e435b83fead0) by [@wcandillon](https://github.com/wcandillon))
- Upgrade to Jest 25 ([f248ba1c8b](https://github.com/facebook/react-native/commit/f248ba1c8b15a12a0c590ce8211855cde31defe8) by [@cpojer](https://github.com/cpojer))
- Use `React.Children.count` for counting children of `TextInput` ([92160f3144](https://github.com/facebook/react-native/commit/92160f3144dcfa510ff14b5f2eb231643f107af9) by [@vonovak](https://github.com/vonovak))
- Annotate <Image> components in QPL logging using ImageAnalyticsTagContext ([60b7a3085c](https://github.com/facebook/react-native/commit/60b7a3085c0d83c126023b98e666ecda6f769454) by [@p-sun](https://github.com/p-sun))
- Upgrade to React 17 ([24bca492c3](https://github.com/facebook/react-native/commit/24bca492c349ab90d40f9444df0f477145a4c311) by [@rickhanlonii](https://github.com/rickhanlonii))
- Made promise polyfill conditionalized on Hermes ([0a28b34dac](https://github.com/facebook/react-native/commit/0a28b34dacb91a7e74cd5feec59cf8f8fb0487c9) by [@Huxpro](https://github.com/Huxpro))
- Flow: Remove type union in PickeriOS/PickerNativeComponent ([3113e47b9b](https://github.com/facebook/react-native/commit/3113e47b9bc92e3b0efb96db776f650848093dfc) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Flow: export ColorValue from StyleSheet instead of StyleSheetTypes ([0a67133124](https://github.com/facebook/react-native/commit/0a6713312467d3f5b5dc993e91db9e7b1aa4fc8c))
- Forward URL parameters from main bundle to hot reloaded bundles ([b4785e5144](https://github.com/facebook/react-native/commit/b4785e514430dc3ba45ed6d136ec63574be88e26) by [@motiz88](https://github.com/motiz88))
- Add package name / bundle ID to bundle URL in development ([9b5359133b](https://github.com/facebook/react-native/commit/9b5359133b46b16be200e37dba0b03d82b73b4a0) by [@motiz88](https://github.com/motiz88))

#### Android specific

- Bump Gradle Wrapper to 6.7 ([8988a073b4](https://github.com/facebook/react-native/commit/8988a073b48df0f0cd4a7126edf1a421f4537d58), [5bc67b658e](https://github.com/facebook/react-native/commit/5bc67b658e581e0176deb7ed95b51a5c1cbe65c2), and [3a8559b86c](https://github.com/facebook/react-native/commit/3a8559b86c3c0b0ab6d6c6904c6efd97ab2c7b38) by [@friederbluemle](https://github.com/friederbluemle); [e559aee642](https://github.com/facebook/react-native/commit/e559aee64275126eaa135486e6bf09138be70f4d) and [e9fd93f53f](https://github.com/facebook/react-native/commit/e9fd93f53f8b14f921578cd401b3a6529e4e0c9f) by [@dulmandakh](https://github.com/dulmandakh))
- Bump Android Gradle Plugin to 4.1.0 ([cf8368f204](https://github.com/facebook/react-native/commit/cf8368f2046ae1ff0f6b02bb6857eeeff8f57d7d) and [553fb8b28d](https://github.com/facebook/react-native/commit/553fb8b28d0ad332d75a944d244832be3390b6ba) by [@friederbluemle](https://github.com/friederbluemle), [dfa9db49e3](https://github.com/facebook/react-native/commit/dfa9db49e34c6f54c04148b877de938bf103a059) by [@dulmandakh](https://github.com/dulmandakh))
- Bump Okio to 1.17.5 ([1e78e0655d](https://github.com/facebook/react-native/commit/1e78e0655d53ac947f523bcadf9c5339ab07bbb8) by [@dulmandakh](https://github.com/dulmandakh))
- Make Android versionCodeOverride for new apps using the template human-readable ([e1bf515ae8](https://github.com/facebook/react-native/commit/e1bf515ae8e77fb24f76037d9f22e903799fb637) by [@gedeagas](https://github.com/gedeagas))
- Bump SoLoader to 0.9.0 ([7465239230](https://github.com/facebook/react-native/commit/7465239230881f453d64364d51272f28614c8653) by [@dulmandakh](https://github.com/dulmandakh))
- Update Okhttp to version 3.12.12 ([0f6fcb2c27](https://github.com/facebook/react-native/commit/0f6fcb2c2788dc7150f6c3673a8f4f9d8f929441) by [@halaei](https://github.com/halaei))
- Update Android build tools to 29.0.3 ([e629e94b46](https://github.com/facebook/react-native/commit/e629e94b466ebbd5924b1d4493c026004dad707d) by [@friederbluemle](https://github.com/friederbluemle))
- ViewCommands on Android now execute earlier, as a perf optimization. ([c6b9cc36da](https://github.com/facebook/react-native/commit/c6b9cc36da4f7d190d05122048aa4ada9c152b73) by [@JoshuaGross](https://github.com/JoshuaGross))
- Effect of `blurRadius` now more closely matches other platforms. ([64860972be](https://github.com/facebook/react-native/commit/64860972be828fb601acbef11b4c2dbc672dee8a) by [@yungsters](https://github.com/yungsters))
- Migrate Android tests to Robolectric v4 ([6a78b32878](https://github.com/facebook/react-native/commit/6a78b32878aea1b0dac98ff36378fb9392d4aeb1) by [@jselbo](https://github.com/jselbo), [d373a8d88c](https://github.com/facebook/react-native/commit/d373a8d88c30af910133d97ae973d256c4479929) and [18f7abae07](https://github.com/facebook/react-native/commit/18f7abae07b8ea60c7530a5d9f34541c50f5edd9) by [@fkgozali](https://github.com/fkgozali))
- Get ripple drawables by id instead of by name ([c8ed2dbbb2](https://github.com/facebook/react-native/commit/c8ed2dbbb287deed05a8782fb8665c1edf45bbac) by [@vonovak](https://github.com/vonovak))
- `TextInput`: Set `caretHidden` default value to `true` on Xiaomi devices to fix the crash ([b5b4a70410](https://github.com/facebook/react-native/commit/b5b4a7041027fd767850a564b5d80fa4a98ba2a2))
- Update loading banner text and colors ([6afc984e81](https://github.com/facebook/react-native/commit/6afc984e8187ac91f780f125dad4421576131c83) by [@makovkastar](https://github.com/makovkastar))
- Declare all attrs used in res targets ([05abbd245c](https://github.com/facebook/react-native/commit/05abbd245c2326b12d24698bb13007a7ce11e586) by [@IanChilds](https://github.com/IanChilds))

#### iOS specific

- Upgraded JSI with a new HERMES_ENABLE_BITCODE flag ([311d4e9ef0](https://github.com/facebook/react-native/commit/311d4e9ef080aa429f840236cc23c013c0ae644c) by [@grabbou](https://github.com/grabbou))
- Remove main queue execution of constantsToExport in NativeModules ([d7ac21cec5](https://github.com/facebook/react-native/commit/d7ac21cec5492e180fbf3817af7be64ab121cb75) by [@RSNara](https://github.com/RSNara))
- Updated loading banner messages and color ([3729fe8de0](https://github.com/facebook/react-native/commit/3729fe8de0109c80014f6c20fae8b949b3628de2) by [@rickhanlonii](https://github.com/rickhanlonii))
- Speed up loading banner animations ([3fb37b4326](https://github.com/facebook/react-native/commit/3fb37b4326090def3aea43bd8189a0df648ccb34) by [@rickhanlonii](https://github.com/rickhanlonii))
- Shrink loading bar down to not cover safe area. ([f0dfd35108](https://github.com/facebook/react-native/commit/f0dfd35108dd3f092d46b65e77560c35477bf6ba) by [@rickhanlonii](https://github.com/rickhanlonii))
- Build macOS framework and add CocoaPods podspec ([ffa3d7f638](https://github.com/facebook/react-native/commit/ffa3d7f638c820dc208320193e6ba65667d751eb) by [@alloy](https://github.com/alloy))
- Set `NSAllowsArbitraryLoads` to `false` by default in template ([7b61a968fd](https://github.com/facebook/react-native/commit/7b61a968fd774a6ca2196a731b6cec4282ab25cc) by [@wddwycc](https://github.com/wddwycc))

### Removed

- `Text.viewConfig` is no longer exported. ([06ce643565](https://github.com/facebook/react-native/commit/06ce64356594a921cd9ae4f71c15dd56dd0e53a3) by [@yungsters](https://github.com/yungsters))
- Removed `once()` and `removeCurrentListener()` from `DeviceEventEmitter` and `NativeEventEmitter`. ([87a2e29f59](https://github.com/facebook/react-native/commit/87a2e29f5928c2e09ac9a98c54732d5f697d8e61) by [@yungsters](https://github.com/yungsters))
- Removed tvOS related files from the template ([df03228a61](https://github.com/facebook/react-native/commit/df03228a61881cdfa520fa6d8a9d9cfb6e77fdde) by [@Naturalclar](https://github.com/Naturalclar))

#### Android specific

- Remove undocumented ColorAndroid function ([411c344794](https://github.com/facebook/react-native/commit/411c3447946c18743476e7d613358233464d6f58) by [@tom-un](https://github.com/tom-un))

### Fixed

- Fix handling of very deeply nested data across the bridge ([a8c90e6af4](https://github.com/facebook/react-native/commit/a8c90e6af4a4e5ac115016a3e8977ecff90e99a0) by [@mhorowitz](https://github.com/mhorowitz))
- Prevent TypeError in TaskQueue when cancelling a started but not resolved promise. ([14042fb76f](https://github.com/facebook/react-native/commit/14042fb76fee3573529d590ec6f8ad216aa0b820) by [@robwalkerco](https://github.com/robwalkerco))
- Fix typo in `ActionSheetManager` invariant message ([9c353b5ab0](https://github.com/facebook/react-native/commit/9c353b5ab060be9392a7aaf437bba4ffc56d78ca) by [@sweatherall](https://github.com/sweatherall))
- `TouchableHighlight` now correctly fires `onPress` when pressed for >500ms, when `onLongPress` is not supplied. ([bdf3c79110](https://github.com/facebook/react-native/commit/bdf3c7911007f547101d753903da11ea4ee095f9) by [@yungsters](https://github.com/yungsters))
- `Pressability` now consistently fires `onPressIn` and `onPressOut`, even without an `onPress`. ([0c392bc405](https://github.com/facebook/react-native/commit/0c392bc4052784de7497bf7b5eaf207b02409877) by [@yungsters](https://github.com/yungsters))
- Remove extraneous argument for `onResponderGrant` Flow type on `Text`. ([49015b0f5b](https://github.com/facebook/react-native/commit/49015b0f5bda83794b88b17dd3cbd834fa235b72) by [@yungsters](https://github.com/yungsters))
- Prevent `ScrollView` From Stealing Responder Capture When Using Physical Keyboard ([93e7a7a70d](https://github.com/facebook/react-native/commit/93e7a7a70dc2f41fccd3c1e4cce80d92913c4243) by [@NickGerleman](https://github.com/NickGerleman))
- Fix failure when debugging code in a browser; was caused by `performanceNow()` function. ([db474a47b7](https://github.com/facebook/react-native/commit/db474a47b70e4fa50f594f4dea8a2f531ca9fc07) by [@zerkella](https://github.com/zerkella))
- Fix test renderer mocks to use the `displayName` more often. ([4b935ae95f](https://github.com/facebook/react-native/commit/4b935ae95f09e4a1eb1e5ac8089eb258222a0f8b) by [@rickhanlonii](https://github.com/rickhanlonii))
- Make sure `LogBox` is not included in production bundles ([d3b937f990](https://github.com/facebook/react-native/commit/d3b937f990012a31b8d917e220f4ed2f0a4fd2d3) by [@janicduplessis](https://github.com/janicduplessis))
- Mark `force` as an optional property of the PressEvent object ([ad2f98df8f](https://github.com/facebook/react-native/commit/ad2f98df8f2ad8aff1dcdc11b187f35b372e3f0e) by [@Simek](https://github.com/Simek))
- Fix invalid `event` objects from `onPressOut` in certain cases ([2c600b7c5a](https://github.com/facebook/react-native/commit/2c600b7c5a0e79bfc632b39b471e6ba774d7b0b3) by [@yungsters](https://github.com/yungsters))
- When Hermes debugger is enabled continue to send log messages to the console ([77ef8f881f](https://github.com/facebook/react-native/commit/77ef8f881f2e4067894b412f308e2a80042c946f) by [@MartinSherburn](https://github.com/MartinSherburn))
- Handle nullish `initialProps` correctly in `renderApplication` ([26c120c632](https://github.com/facebook/react-native/commit/26c120c6329d45e27318d82aaf5a50338bd6fa7d) by [@rubennorte](https://github.com/rubennorte))
- Fix Flow type of Touchable{Opacity,Bounce,Highlight} being exported as `any` ([de7f69a58e](https://github.com/facebook/react-native/commit/de7f69a58ed4e18887f4b9d4d853293fb136afb7) by [@draperunner](https://github.com/draperunner))
- Clarified the boundaries in error message of `scrollToIndex` ([78d2b3c813](https://github.com/facebook/react-native/commit/78d2b3c8138f54c2433958b0ad6b9f52ca59115a) by [@sasurau4](https://github.com/sasurau4))
- Fix jsi cmake include dirs ([f5d00e5a29](https://github.com/facebook/react-native/commit/f5d00e5a2922d35a0b44935592da5700518c422b) by [@ryantrem](https://github.com/ryantrem))
- Fix race condition in `KeyboardAvoidingView` ([b08fff6f86](https://github.com/facebook/react-native/commit/b08fff6f869e00c20c0dcdf7aca71284c2f276f0) by [@sammy-SC](https://github.com/sammy-SC))
- Fix clone issue in YogaNodeJNIBase ([2707c17b07](https://github.com/facebook/react-native/commit/2707c17b0727f241d404f4a21090021c27c66f2c) by [@pasqualeanatriello](https://github.com/pasqualeanatriello))
- Fix "Cannot read property 'getNativeScrollRef' of undefined" in createAnimatedComponent ([629e10e91b](https://github.com/facebook/react-native/commit/629e10e91b728c4251f1ed78a50df62820ce0dc4) by [@sammy-SC](https://github.com/sammy-SC))

#### Android specific

- Fix App Bundle/Release build missing index.android.bundle with gradle plugin 4.1.0/gradle 6.5 ([53f55001af](https://github.com/facebook/react-native/commit/53f55001afbf07494de0df064a92dfdd42f37c98) by [@tomoima525](https://github.com/tomoima525))
- Do not crash when `ScrollView` `snapToOffsets` array is empty ([d238da71aa](https://github.com/facebook/react-native/commit/d238da71aa8cdd7ce519de617a9a200406da794c) by [@makovkastar](https://github.com/makovkastar))
- Fixed `TextInput` not being selectable in `removeClippedSubviews` FlatLists ([12a50c0a44](https://github.com/facebook/react-native/commit/12a50c0a442b78d9095398d955bec307cfcb0f69) by [@hsource](https://github.com/hsource))
- Make nested `Text` components accessible as links ([b352e2da81](https://github.com/facebook/react-native/commit/b352e2da8137452f66717cf1cecb2e72abd727d7) by [@ejanzer](https://github.com/ejanzer))
- Move selection to the end of the text input on accessibility click ([f0e80ae229](https://github.com/facebook/react-native/commit/f0e80ae2292ebf7ce32666900007845724844fb5) by [@ejanzer](https://github.com/ejanzer))
- Fix secure text entry setting to always hide text ([f19372361f](https://github.com/facebook/react-native/commit/f19372361f22201a453ff38eb69c5fa052b57474) by [@smeenai](https://github.com/smeenai))
- Make promise NativeModule methods dispatch to NativeModules thread ([9c35b5b8c4](https://github.com/facebook/react-native/commit/9c35b5b8c4710dfe6a4b689a5565aa78ae5b37d3) by [@RSNara](https://github.com/RSNara))
- Fix `NoSuchMethodException` when calling `DisplayMetricsHolder.initDisplayMetrics` in Android API level <= 16 (though those Android versions are no longer supported) ([35128f45d1](https://github.com/facebook/react-native/commit/35128f45d1ba97010e437423d14fa5ea0faf5fa3) by [@mdvacca](https://github.com/mdvacca))
- Fixed error message in `DebugCorePackage.getModule` ([a71f37b951](https://github.com/facebook/react-native/commit/a71f37b951ca49c180b037ea8955851654b09afa) by [@TheWirv](https://github.com/TheWirv))
- ScrollView, HorizontalScrollView: do not ignore `null` `contentOffset` prop ([9e85b7ad88](https://github.com/facebook/react-native/commit/9e85b7ad889900cd57cd2f82286aa8e034b0a32b) by [@vonovak](https://github.com/vonovak))
- Picker - fix usage of setNativeSelectedPosition in onSelect ([078e386024](https://github.com/facebook/react-native/commit/078e386024474edc9b464f6c0fd8a1429e922289))
- Fix intermittent crash of ReactSlider on Android ([32888a8b4a](https://github.com/facebook/react-native/commit/32888a8b4a9d75b9d3f6cc4578ce6a6ccd932407) by [@mdvacca](https://github.com/mdvacca))
- Use actual constructor when throwing GradleScriptException ([8ef0f1d90b](https://github.com/facebook/react-native/commit/8ef0f1d90bbb2fa98e48ce89281718e5ac79365a))
- Fix `skewX` transform decomposition ([797367c089](https://github.com/facebook/react-native/commit/797367c0890a38ec51cfaf7bd90b9cc7db0e97c7) by [@wcandillon](https://github.com/wcandillon))
- Allow passing partial contentOffset to ScrollView on Android ([0348953914](https://github.com/facebook/react-native/commit/03489539146556ec5ba6ba07ac338ce200f5b0f4) by [@janicduplessis](https://github.com/janicduplessis))
- Check if NativeModules returned from CatalystInstanceImpl.getNativeModule are null before using them. ([9263eb5d38](https://github.com/facebook/react-native/commit/9263eb5d3864a42925b699343db2c09cc8934ed0) by [@RSNara](https://github.com/RSNara))
- Fix calculating view position within the window in split-screen mode ([b020e7c440](https://github.com/facebook/react-native/commit/b020e7c440f58dabd4cc64b72869f3ae9680ef30) by [@jakubkinst](https://github.com/jakubkinst))
- Text layout no longer ignores parent bounds ([025be8148a](https://github.com/facebook/react-native/commit/025be8148a9abc533a8ae108e49cfd3f4512c581) by [@yungsters](https://github.com/yungsters))
- Fixed excessive space in Text view with word-wrapping ([dda7f82261](https://github.com/facebook/react-native/commit/dda7f82261cc5684564e2c67071c13e379985308) by [@yungsters](https://github.com/yungsters))
- `Pressable`: ripple should be applied even when borderless == false ([44ec762e41](https://github.com/facebook/react-native/commit/44ec762e41029bf43530b1ff9b36ca3512c526e2) by [@vonovak](https://github.com/vonovak))
- Fix `ReadableNativeMap.getNullableValue` to match signature and return null instead of throwing ([1015194ba1](https://github.com/facebook/react-native/commit/1015194ba1a81eab99000d589914100e4b9ea037) by [@dulmandakh](https://github.com/dulmandakh))
- `Picker`: set color filter so that the arrow matches the text color ([bb8d0f5732](https://github.com/facebook/react-native/commit/bb8d0f57328a20c942991f2d19d86639a7791924) by [@ejanzer](https://github.com/ejanzer))
- `Modal`: fix crash when updating props after the activity disappeared ([7abcaafd66](https://github.com/facebook/react-native/commit/7abcaafd6600535825aa8330af7290ba8acea245) by [@mdvacca](https://github.com/mdvacca))
- Fix crash while measuring ReactSlider in Android API < 21 ([75e6f7961f](https://github.com/facebook/react-native/commit/75e6f7961fb3f6de6afbe79d49c42ad55fba1673) by [@mdvacca](https://github.com/mdvacca))
- Fix measureLayout function for VirtualTexts ([5c48c94f8c](https://github.com/facebook/react-native/commit/5c48c94f8c0441bc78a007f0ea0c5b2763ff6875) by [@mdvacca](https://github.com/mdvacca))
- Smoother scrolling in ScrollView, HorizontalScrollView ([10314fe621](https://github.com/facebook/react-native/commit/10314fe621e1649654e83df197adf657e0ca8363) by [@JoshuaGross](https://github.com/JoshuaGross))

#### iOS specific

- Synchronize RCTImageLoader loaders initialization ([edb6fa7979](https://github.com/facebook/react-native/commit/edb6fa79791beb804e450ca4a562a248abf730e5) by [@p-sun](https://github.com/p-sun))
- Make sure js bundle still exists at bundle-output path ([3a41f69f9c](https://github.com/facebook/react-native/commit/3a41f69f9ce1ab778112c0727a69a753fe36c77a) by [@janicduplessis](https://github.com/janicduplessis))
- Fix crash in WebSocket module ([748aa13747](https://github.com/facebook/react-native/commit/748aa137472d6080427f74bb686c795b925c7d43) by [@marksinkovics](https://github.com/marksinkovics))
- Align multi-line `TextInput` `onSubmitEditing` behavior: don't call onSubmitEditing when blurOnSubmit=false ([521b16730d](https://github.com/facebook/react-native/commit/521b16730dd07d80261086c2f33eed2a766d404e) by [@tido64](https://github.com/tido64))
- Fix passing react native path in Podfile template ([e599d6c5d3](https://github.com/facebook/react-native/commit/e599d6c5d338c1b4d1a0d988e0d9ff83c179fb54) by [@janicduplessis](https://github.com/janicduplessis))
- Call [RCTEventEmitter stopObserving] on correct method queue ([23717e48af](https://github.com/facebook/react-native/commit/23717e48aff3d7fdaea30c9b8dcdd6cfbb7802d5) by [@appden](https://github.com/appden))
- Persist Enable Fast Refresh across app launches ([845e9eaafb](https://github.com/facebook/react-native/commit/845e9eaafb08b4ca87a9987e840798e0ba011676) by [@stigi](https://github.com/stigi))
- Fix xcodebuild warnings in React-Core ([cb719a16cc](https://github.com/facebook/react-native/commit/cb719a16cc496b0cdb09d8d971b5e95cc8863b77))
- Fix that RCTModalHostView can't be dismissed while being presented ([8933724d7d](https://github.com/facebook/react-native/commit/8933724d7d0f9ec012b2708d8e737f02f03e4a6f) by [@Mi-ZAZ](https://github.com/Mi-ZAZ))
- Fix "'RCTBlobPlugins.h' file not found" when building iOS ([aaeffdb49a](https://github.com/facebook/react-native/commit/aaeffdb49a8412a98bb52477933fd208d1dcc096) by [@tido64](https://github.com/tido64))
- Improved text rendering on macOS Catalyst ([694e22de84](https://github.com/facebook/react-native/commit/694e22de847e5f789b7d5ffe472b63aabbd7a5b0) by [@andymatuschak](https://github.com/andymatuschak))
- Fixed showing Alert while closing a Modal ([f319ff321c](https://github.com/facebook/react-native/commit/f319ff321c4b7c0929b99e3ebe7e1ce1fa50b34c) by [@devon94](https://github.com/devon94))
- Fix `refreshControl` messes up navigationBar largeTitles ([1b0fb9bead](https://github.com/facebook/react-native/commit/1b0fb9bead4d158d14df5a994423d06716b5e377) by [@yogevbd](https://github.com/yogevbd))
- When Sec-WebSocket-Protocol header is empty vaulue, IIS server will return error 502. ([fd85b84a86](https://github.com/facebook/react-native/commit/fd85b84a863cea9f33e5b39230b27af53c1307e7) by [@bill2004158](https://github.com/bill2004158))
- Fix multiline `TextInput` crash when inserting/removing lots of text ([15dda0ab5a](https://github.com/facebook/react-native/commit/15dda0ab5a491dcc83539f9ef32c9896be41074a) by [@tido64](https://github.com/tido64))
- Group accessible views using the view hierarchy ([e2fd9d4f22](https://github.com/facebook/react-native/commit/e2fd9d4f22cda85c995c38875fc3a2a20a198c4a) by [@p-sun](https://github.com/p-sun))
- Fix Flow types for StatusBar showHideTransition ([e5a8f4270e](https://github.com/facebook/react-native/commit/e5a8f4270ea71749a5ce6bd7ae198f695edb4307) by [@Simek](https://github.com/Simek))
- Better error message when missing entry file ([e73208e2ca](https://github.com/facebook/react-native/commit/e73208e2ca59a2cf6a8a9c5e4e5b33afb5131f09) by [@petrbela](https://github.com/petrbela))
- Fix imports in `RCTUtilsUIOverride.h` ([b7e8f66795](https://github.com/facebook/react-native/commit/b7e8f667953c2bc65c25b00968051c063a684d01) by [@Fanghao](https://github.com/Fanghao))
- Fix skewX/skewY/perspective/matrix transforms. ([4b956fe5a6](https://github.com/facebook/react-native/commit/4b956fe5a6b3a05b1c2883efc82a95c2524aeb56) by [@wcandillon](https://github.com/wcandillon))
- Fix module lookup race condition on bridge invalidation. ([8ad810717e](https://github.com/facebook/react-native/commit/8ad810717ee1769aa5ff6c73e0c9bfa8c43a3bac) by [@fkgozali](https://github.com/fkgozali))
- Fix duration calculation for `RCTUIImageViewAnimated` ([12f8b2598f](https://github.com/facebook/react-native/commit/12f8b2598fa46533ea59834a0225cc9e36b20111))
- Cap loading banner percentage at 100% ([e27542bb13](https://github.com/facebook/react-native/commit/e27542bb13d1f8f422cd307c4d43148c8bd82bc0) by [@rickhanlonii](https://github.com/rickhanlonii))
- Delay loading banner message to prevent flashing messages ([2b771b0129](https://github.com/facebook/react-native/commit/2b771b0129f2ef921c7cdb9c952e004f931927c3) by [@rickhanlonii](https://github.com/rickhanlonii))
- Do not update loading banner message while hiding the banner ([131c497aa2](https://github.com/facebook/react-native/commit/131c497aa2c081f9dfd03e45b25fb7ae388b98bd) by [@rickhanlonii](https://github.com/rickhanlonii))
- Search en0 through en8 for the Metro Bundler's IP address when generating iOS debug builds ([b2b23a2017](https://github.com/facebook/react-native/commit/b2b23a20170d12f6d8bf2733b93d7f9ab9c6cb15))
- Migrate `frameInterval` to `preferredFramesPerSecond`, fixing Xcode warnings ([335f3aabe2](https://github.com/facebook/react-native/commit/335f3aabe28ec8f9b96fd695edabf0d5ab0b402a) by [@safaiyeh](https://github.com/safaiyeh))
- Animated image should animate at the same speed regardless of framerate ([b0d0e51a77](https://github.com/facebook/react-native/commit/b0d0e51a7724dcefe3ce1c2dfb334a731b2a385c) by [@p-sun](https://github.com/p-sun))
- Fix logging lifecycle when image is scrolled out and immediately back in ([1f95c9b62e](https://github.com/facebook/react-native/commit/1f95c9b62e306fdaf0ef351b02fb79713941259c) by [@p-sun](https://github.com/p-sun))
- Fix image instrumentation lifecycle on image cancel ([6cba4d2006](https://github.com/facebook/react-native/commit/6cba4d20068ef4ca9b9832e4c5cf71a7e361ddbe) by [@p-sun](https://github.com/p-sun))
- Break retain cycle in RCTLegacyViewManagerInteropCoordinator ([8f90ce26a5](https://github.com/facebook/react-native/commit/8f90ce26a55f2b1aab42d7c44b0d527321fa8c21) by [@sammy-SC](https://github.com/sammy-SC))
- Respect port information if available from RCTBundleURLProvider ([7d44959940](https://github.com/facebook/react-native/commit/7d44959940b7f7b03feefde0e9a15382f04dad6d) by [@jimmy623](https://github.com/jimmy623))
- Remove port from JSLocation when returning packager host ([12543d557f](https://github.com/facebook/react-native/commit/12543d557f00545a719b4dfd76cc0d0adfa37a01) by [@jimmy623](https://github.com/jimmy623))
- Remove requestToken being nil check from [RCTNetworkTask validateRequestToken] ([ffc90c7f92](https://github.com/facebook/react-native/commit/ffc90c7f92e63e1a53ed107833e3deed492ab435) by [@sammy-SC](https://github.com/sammy-SC))
- Remove unnecessary packager running check when saved JSLocation is empty ([bbb7bef539](https://github.com/facebook/react-native/commit/bbb7bef539f418bdb452e40987d399c9369df5a2) by [@jimmy623](https://github.com/jimmy623))
- Check whether packager is running in RCTBundleURLProvider for saved JSLocation ([3d882495d5](https://github.com/facebook/react-native/commit/3d882495d5e4415c2ebb8f4280e18e16025e0736) by [@jimmy623](https://github.com/jimmy623))
- Fix crash inside RCTRedBox when trying to present same UIViewController twice ([46c77dc296](https://github.com/facebook/react-native/commit/46c77dc296dfab754356cd9346a01dae8d4869f4) by [@sammy-SC](https://github.com/sammy-SC))
- Fix outdated CocoaPods version requirement in a React.podspec ([8a6ac1fef3](https://github.com/facebook/react-native/commit/8a6ac1fef369071405a3bf14a89924c66f28d192) by [@sunnylqm](https://github.com/sunnylqm))

## v0.63.5

🚨 **IMPORTANT:** This is an exceptional release on an unsupported version. We recommend you upgrade to one of [the supported versions, listed here](https://github.com/reactwg/react-native-releases#which-versions-are-currently-supported).

### Fixed

- Add an afterEvaluate to solve AGP 3.x configuration resolution ([473a36099c](https://github.com/facebook/react-native/commit/473a36099c80de08591e3cb51687f7d531145ee3) by [@cortinico](https://github.com/cortinico))
- Force dependencies resolution to minor series for 0.63 ([28cc286cc4](https://github.com/facebook/react-native/commit/28cc286cc4d43b9fe5153d779ea3eecf4d72c51e) by [@cortinico](https://github.com/cortinico))

## v0.63.4

### Changed

- [Maintenance] Bump detox to xcode 12 compatible version ([ccd4efac90](https://github.com/facebook/react-native/commit/ccd4efac90191e57b1dd6e7fff0da13e5764bcc4) by [@kelset](https://github.com/kelset))

#### Android specific

- Bump SoLoader to 0.9.0 ([7465239230](https://github.com/facebook/react-native/commit/7465239230881f453d64364d51272f28614c8653) by [@dulmandakh](https://github.com/dulmandakh))
- Update Okhttp to version 3.12.12 ([0f6fcb2c27](https://github.com/facebook/react-native/commit/0f6fcb2c2788dc7150f6c3673a8f4f9d8f929441) by [@halaei](https://github.com/halaei))
- ScrollView now supports `contentOffset` ([ed29ba13f9](https://github.com/facebook/react-native/commit/ed29ba13f97f240c91fdf6c0ef3fb601046697b9) by [@JoshuaGross](https://github.com/JoshuaGross))

### Fixed

#### Android specific

- Fix ReadableNativeMap.getNullableValue to match signature ([1015194ba1](https://github.com/facebook/react-native/commit/1015194ba1a81eab99000d589914100e4b9ea037) by [@dulmandakh](https://github.com/dulmandakh))
- Dimension update events are now properly sent following orientation change ([0e9296b95d](https://github.com/facebook/react-native/commit/0e9296b95da06789121f052e6cd6d7cac808464c) by [@ajpaulingalls](https://github.com/ajpaulingalls))
- Font family is not apply when secureTextEntry is true. ([00d9deaf6b](https://github.com/facebook/react-native/commit/00d9deaf6ba26c605694d303bb0cb072fceae5a1) by [@hank121314](https://github.com/hank121314))
- Fix App Bundle/Release build missing index.android.bundle with gradle plugin 4.1.0/gradle 6.5 ([53f55001af](https://github.com/facebook/react-native/commit/53f55001afbf07494de0df064a92dfdd42f37c98) by [@tomoima525](https://github.com/tomoima525))
- ScrollView, HorizontalScrollView: do not ignore `null` `contentOffset` prop ([9e85b7ad88](https://github.com/facebook/react-native/commit/9e85b7ad889900cd57cd2f82286aa8e034b0a32b) by [@vonovak](https://github.com/vonovak))
- SkewX transforms ([797367c089](https://github.com/facebook/react-native/commit/797367c0890a38ec51cfaf7bd90b9cc7db0e97c7) by [@wcandillon](https://github.com/wcandillon))
- Allow passing partial contentOffset to ScrollView on Android ([0348953914](https://github.com/facebook/react-native/commit/03489539146556ec5ba6ba07ac338ce200f5b0f4) by [@janicduplessis](https://github.com/janicduplessis))
- Set color filter so that the arrow matches the text color ([bb8d0f5732](https://github.com/facebook/react-native/commit/bb8d0f57328a20c942991f2d19d86639a7791924) by [@ejanzer](https://github.com/ejanzer))

#### iOS specific

- A crash in WebSocket module ([748aa13747](https://github.com/facebook/react-native/commit/748aa137472d6080427f74bb686c795b925c7d43) by [@marksinkovics](https://github.com/marksinkovics))
- Fixed showing Alert while closing a Modal ([f319ff321c](https://github.com/facebook/react-native/commit/f319ff321c4b7c0929b99e3ebe7e1ce1fa50b34c) by [@devon94](https://github.com/devon94))
- Bug with skewX/skewY/perspective/matrix transforms. ([4b956fe5a6](https://github.com/facebook/react-native/commit/4b956fe5a6b3a05b1c2883efc82a95c2524aeb56) by [@wcandillon](https://github.com/wcandillon))

## v0.63.3

### Added

#### iOS specific

- Ability to set which configuration to enable flipper for when using use_flipper! ([dc2df75426](https://github.com/facebook/react-native/commit/dc2df754267df3909631d81c22b9fcab58dfa241) by [@nicoburns](https://github.com/nicoburns))

### Changed

- Update Flipper to 0.54 ([d8b70b19b3](https://github.com/facebook/react-native/commit/d8b70b19b39ead4dd41895d666d116a43c56474e) by [@mweststrate](https://github.com/mweststrate))
- Removed default 130ms delay from Pressability and Pressable. ([86ffb9c41e](https://github.com/facebook/react-native/commit/86ffb9c41e033f59599e01b7ad016706b5f62fc8) by [@yungsters](https://github.com/yungsters))

### Fixed

#### Android specific

- `KeyboardDidHide` wrong `screenY` coordinates with `windowTranslucentStatus=true` ([45954ac5dc](https://github.com/facebook/react-native/commit/45954ac5dccdfe05de7553a0f08c4f0e66e3d62e) by [@fabriziobertoglio1987](https://github.com/fabriziobertoglio1987))
- Fix Xiaomi TextInput crash in native ([07a597ad18](https://github.com/facebook/react-native/commit/07a597ad185c8c31ac38bdd4d022b0b880d02859))

#### iOS specific

- Prefetch images using a lower download priority ([058eeb43b4](https://github.com/facebook/react-native/commit/058eeb43b489f52183f081fb7232be683002a242) by [@p-sun](https://github.com/p-sun))
- Fix `RCTImageLoader` not using decoders provided. ([663b5a878b](https://github.com/facebook/react-native/commit/663b5a878be9faafd13b41c222a1bc2ac7bb3a65) by [@sjchmiela](https://github.com/sjchmiela))
- Support Swift based libraries using Xcode 12’s build system. ([6e08f84719](https://github.com/facebook/react-native/commit/6e08f84719c47985e80123c72686d7a1c89b72ed) by [@alloy](https://github.com/alloy))
- Fix "main.jsbundle does not exist" issue ([83777cb4fb](https://github.com/facebook/react-native/commit/83777cb4fb5dda89c430b7eff9cd1f28d2577831))
- Fixed headers in `Image.getSizeWithHeaders`. ([0bcc686c1c](https://github.com/facebook/react-native/commit/0bcc686c1cc90fd44de7a28e2f56ea20fe2f5123) by [@PaitoAnderson](https://github.com/PaitoAnderson))

### Security

- Fix security issues with `@react-native-community/cli` by bumping version ([001eb7cbd6](https://github.com/facebook/react-native/commit/001eb7cbd66c7dc1a302ee2a638c1cfc164538f4) by [@alexbrazier](https://github.com/alexbrazier))

## v0.63.2

### Fixed

- Restore Previous Behavior for StyleSheet Validation of Null/Undefined Styles ([e75557b48f](https://github.com/facebook/react-native/commit/e75557b48fbee1d136b8b7d1a78ea8f9b9467479) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- Set LogBox windowTranslucentNavigation to false ([23036b38bc](https://github.com/facebook/react-native/commit/23036b38bc4443c8db4865e5c2b21aca7ab4f92f) by [@Ashoat](https://github.com/Ashoat))
- Fix unable to run in debug mode on Android API < 21 ([7694b32a88](https://github.com/facebook/react-native/commit/7694b32a88078278457dd8721eb61da9c4ac0f5a) by [@Shywim](https://github.com/Shywim))

#### iOS specific

- Fix image cannot show in iOS 14 ([123423c2a9](https://github.com/facebook/react-native/commit/123423c2a9258c9af25ca9bffe1f10c42a176bf3))

## v0.63.1

### Added

- Added `minPressDuration` to `Pressable`. ([4aaf629982](https://github.com/facebook/react-native/commit/4aaf62998247bcfd8ebf369d73290096fde08012) by [@yungsters](https://github.com/yungsters))
- Support for array buffers in the JavaScriptCore implementation of JSI ([9c32140068](https://github.com/facebook/react-native/commit/9c32140068463739b91874689f741ea9630d8c3b) by [@ryantrem](https://github.com/ryantrem))

#### Android specific

- ProGuard rule for hermes ([449dc37720](https://github.com/facebook/react-native/commit/449dc37720b24d9d88661314424c9f982e70ec3a) by [@radko93](https://github.com/radko93))

### Fixed

- LogBox.ignoreAllLogs() should ignore logs ([f28c7505fa](https://github.com/facebook/react-native/commit/f28c7505fa5b4a7ddf1e9311d38dfcd15e8953a2) by [@rickhanlonii](https://github.com/rickhanlonii))

#### Android specific

- Fix font variant crash on Android < 4.4 ([f23feced42](https://github.com/facebook/react-native/commit/f23feced42abd1d18a12e413bf79a51bead61379) by [@Almouro](https://github.com/Almouro))
- Fix border-drawing when changing border-radius back to 0` ([7757ad0576](https://github.com/facebook/react-native/commit/7757ad05762284c059807d7d75fd03559e86f2b2) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix rounded border-drawing when border-radius is smaller than border-width` ([28dce3665d](https://github.com/facebook/react-native/commit/28dce3665d8a63e902c165c060400486fe6234f4) by [@IjzerenHein](https://github.com/IjzerenHein))

#### iOS specific

- TextInput color has the same default (#000) on iOS whether in light or dark mode ([a2f8b9c36e](https://github.com/facebook/react-native/commit/a2f8b9c36e5eba6bc354a2f53bf8d3ca11297d00) by [@JonnyBurger](https://github.com/JonnyBurger))
- Fixes TextInput shaking when typing Chinese ([9cdc19a936](https://github.com/facebook/react-native/commit/9cdc19a93669b37c0518bd32263e156ffc9193c7) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.63.0

### Breaking

- The `target` field of events is now a native component, not a react tag ([3b813cade1](https://github.com/facebook/react-native/commit/3b813cade1f5d6f248a39f6bbd983f68c5794fe6) by [@TheSavior](https://github.com/TheSavior))
- Modal: Remove support for `animated` prop (deprecated in 0.26) ([1e9db7bd6d](https://github.com/facebook/react-native/commit/1e9db7bd6df3055b9b81d23f15a54bb250621a41) by [@TheSavior](https://github.com/TheSavior))
- Alert: Remove deprecated support for passing callback as fourth argument to `Alert.prompt` (deprecated in 0.59) ([a26d622d04](https://github.com/facebook/react-native/commit/a26d622d04451d6872eed2491e5d3f7d4689824d) by [@TheSavior](https://github.com/TheSavior))
- Switch: Remove support for `thumbTintColor`, `tintColor`, `onTintColor` props (deprecated in 0.57) ([26912bd979](https://github.com/facebook/react-native/commit/26912bd9798aeb38931466b8ddcd3a48973b0528) by [@TheSavior](https://github.com/TheSavior))
- Multiple deprecations and breaking changes to `TextInputState`. Use native component refs instead of react tags ([6286270e4c](https://github.com/facebook/react-native/commit/6286270e4cb10b40cfd7c8193e31d965f6815150) by [@TheSavior](https://github.com/TheSavior))
- Bump supported Node engines to >= 10 ([f0c7178a3a](https://github.com/facebook/react-native/commit/f0c7178a3a24e7694b765946f0d884104c8cfa4c) by [@safaiyeh](https://github.com/safaiyeh))

### Deprecated

- Add deprecation warnings for `Clipboard`, `SegmentedControlIOS`, `ProgressViewIOS`, `ProgressBarAndroid`. These modules have been moved to [react-native-community](https://github.com/react-native-community) libraries. ([f295d7f608](https://github.com/facebook/react-native/commit/f295d7f60843a45bb09fc366e497f512c2bc0046) by [@Naturalclar](https://github.com/Naturalclar))
- Deprecated `console.disableYellowBox` in favor of `LogBox.ignoreAllLogs`. ([87f1e22434](https://github.com/facebook/react-native/commit/87f1e22434210ad22f526422bbda0413f59786ce) by [@rickhanlonii](https://github.com/rickhanlonii))

#### Android specific

- We are deprecating the method `UIManagerModule.resolveRootTagFromReactTag`, this will not be supported in the next version of RN ([acbf9e18ea](https://github.com/facebook/react-native/commit/acbf9e18ea666b07c1224a324602a41d0a66985e) by [@mdvacca](https://github.com/mdvacca))
- Add warning message for trying to use `ToolbarAndroid` which has been removed from the core since 0.61. ([6249d14a61](https://github.com/facebook/react-native/commit/6249d14a61723b22deb1336457b4295978471885) by [@Naturalclar](https://github.com/Naturalclar))

#### iOS specific

- Deprecate iOS 9.x support ([58a6a40eac](https://github.com/facebook/react-native/commit/58a6a40eac9afb5c4de78a63418cc48ea97da1a4), [829a2237d2](https://github.com/facebook/react-native/commit/829a2237d270c03c80467eb6c2b5b18c87135a45), [674b591809](https://github.com/facebook/react-native/commit/674b591809cd1275b5f1c4d203c2f0ec52303396) by [@fkgozali](https://github.com/fkgozali), [d1265077d6](https://github.com/facebook/react-native/commit/d1265077d6638bb9219180628caf6ff83f8d6019) by [@sunnylqm](https://github.com/sunnylqm))

### Added

- Implement `nativePerformanceNow` and `performance.now()` ([232517a574](https://github.com/facebook/react-native/commit/232517a5740f5b82cfe8779b3832e9a7a47a8d3d) by [@emilisb](https://github.com/emilisb))
- Support `PerformanceLogger` stopTimespan updates ([08c338eebf](https://github.com/facebook/react-native/commit/08c338eebf67ef6c8c8fb7e3a91bbf89bbc2bb4c) by [@sahrens](https://github.com/sahrens))
- Added `PlatformColor` implementations for iOS and Android ([f4de45800f](https://github.com/facebook/react-native/commit/f4de45800f25930a1c70f757d12269d859066d3d) by [@tom-un](https://github.com/tom-un))
- Stamp React Native Version Into C++ Code ([427ba359e0](https://github.com/facebook/react-native/commit/427ba359e0c9411438286dd137bbca67f9829fde) by [@NickGerleman](https://github.com/NickGerleman))
- New `<Pressable>` Component to make it easier to create touchable elements ([3212f7dfe8](https://github.com/facebook/react-native/commit/3212f7dfe82d187e27f1410c8c3cb1d9fb9f5094) by [@TheSavior](https://github.com/TheSavior), [bd3868643d](https://github.com/facebook/react-native/commit/bd3868643d29e93610e19312571a9736df2cbdf8) by [@vonovak](https://github.com/vonovak))
- Export `LogBox` module ([799bf56f6f](https://github.com/facebook/react-native/commit/799bf56f6f6a46b6bd42ac5a824f44bd1412f3b6) by [@rickhanlonii](https://github.com/rickhanlonii))
- Export `LayoutAnimationConfig` flow type ([f0dafd34fe](https://github.com/facebook/react-native/commit/f0dafd34fedb0d63eb2499b978a52da9e6b71ea1) by [@sahrens](https://github.com/sahrens))
- Added `react-native-community/eslint-plugin` as a dependency for `react-native-community/eslint-config` ([2c2e35c634](https://github.com/facebook/react-native/commit/2c2e35c634cd936bd7ea7a7fe444058268308224) by [@Naturalclar](https://github.com/Naturalclar))
- `DEBUG_NETWORK_SEND_DELAY` can be used to simulate slow network. ([4aac019176](https://github.com/facebook/react-native/commit/4aac019176e3359068ac671ed4157a6e3ada481f) by [@sahrens](https://github.com/sahrens))
- Support for `accessibilityLabel` prop to the `Picker` component ([0a525b6d9d](https://github.com/facebook/react-native/commit/0a525b6d9d2a88dddf24b85a2485b928fca23b16) by [@KevinGVargas](https://github.com/KevinGVargas))
- Allow `zIndex` to `useNativeDriver` ([6a4e06faa8](https://github.com/facebook/react-native/commit/6a4e06faa8afbcb607fc2696c45c4f3257b6665d) by [@mackenziemance](https://github.com/mackenziemance))

#### Android specific

- Support item background color in Dialog `Picker` ([22eb711c84](https://github.com/facebook/react-native/commit/22eb711c84587ac92da97e486fecaa79424fa925))
- Add OverrideColorScheme interface and setOverrideColorScheme method to AppearanceModule([45d7df6cf7](https://github.com/facebook/react-native/commit/45d7df6cf7482b9790c97db613055ff5d3e59a87))
- Allow setting custom ripple radius on `TouchableNativeFeedback` ([7f2a79f40b](https://github.com/facebook/react-native/commit/7f2a79f40b4a4c41344ca90cefe318af607675e0) by [@vonovak](https://github.com/vonovak))
- Add `resizeMode` prop support on `TextInlineView` ([6871416328](https://github.com/facebook/react-native/commit/68714163280695c3148544b95b05a2c1464dbbba) by [@mdvacca](https://github.com/mdvacca))
- Added an API for checking if there are busy timers to `TimingModule` ([22764e6cdc](https://github.com/facebook/react-native/commit/22764e6cdcf45ca5930676f6e95f9ab2f82bc78d) by [@ejanzer](https://github.com/ejanzer))
- Make packager location customizable in dev mode ([3714f3648a](https://github.com/facebook/react-native/commit/3714f3648a8ac51f2bb7f2791e2381551d0209b4))

#### iOS specific

- `UIScene` support for `RCTImageView` ([f332fac163](https://github.com/facebook/react-native/commit/f332fac16346d2f03d056575cc988a0b2bbb48c6) by [@tido64](https://github.com/tido64))
- Status bar style is now correctly changed in multi-window iPadOS 13 apps if you use `RCTRootViewController` and set `UIViewControllerBasedStatusBarAppearance=YES` ([80e6d672f3](https://github.com/facebook/react-native/commit/80e6d672f32fdc860c73eabcc63763dcab3c6269) by [@radex](https://github.com/radex))
- Added `userInterfaceStyle` for `ActionSheetIOS` and `Share` to override user interface style on IOS 13 ([0a9cc34dd8](https://github.com/facebook/react-native/commit/0a9cc34dd82a3a7dba576997ebd424b12876dbaa) by [@Arjan-Zuidema](https://github.com/Arjan-Zuidema))
- Add localized accessibility strings to `ReactCore` pod ([aebf54aee4](https://github.com/facebook/react-native/commit/aebf54aee41cc892198b055a7a546743297412bd) by [@xuelgong](https://github.com/xuelgong))
- Resolve and reject promise for `PushNotificationIOS.requestPermissions` ([edfdafc7a1](https://github.com/facebook/react-native/commit/edfdafc7a14e88a2660b95cb220c62f29b1b28c0) by [@p-sun](https://github.com/p-sun))
- Use autolink script in template on iOS ([a35efb9400](https://github.com/facebook/react-native/commit/a35efb94006bfa3f541bf3fc3ab5262740f00525) by [@janicduplessis](https://github.com/janicduplessis))
- Added `Flipper` to template app ([52cd9cd6fe](https://github.com/facebook/react-native/commit/52cd9cd6fec0866177aa02f7129a8b3d8b2bdbea) by [@safaiyeh](https://github.com/safaiyeh))
- Add `textColor` and `backgroundColor` props to `SegmentedControl` for iOS >=13 ([e8f577e541](https://github.com/facebook/react-native/commit/e8f577e541815bfd8adebdf14f70c9e4205f8e4e) by [@Naturalclar](https://github.com/Naturalclar))
- Adds `RCTOverrideAppearancePreference` to the iOS `Appearance` module ([fa65b156d4](https://github.com/facebook/react-native/commit/fa65b156d4109e6a3121484b601358b11cf0d541))
- Changed iOS LaunchScreen from `xib` to `storyboard` ([33b3a1a145](https://github.com/facebook/react-native/commit/33b3a1a1453ca51690e59b758eeb61a4fa8f35bc) by [@jeswinsimon](https://github.com/jeswinsimon))

### Changed

- Update `react-native-community/eslint-config` to 1.1.0, adding the new color rule ([780f06cd47](https://github.com/facebook/react-native/commit/780f06cd477f34da48646a949bd25dd3f883a9a2) by [@TheSavior](https://github.com/TheSavior))
- Update community eslint plugin in the eslint config ([b2d10bc602](https://github.com/facebook/react-native/commit/b2d10bc60272fc2318835ff38655a9eb4a2bbed0) by [@Naturalclar](https://github.com/Naturalclar))
- Upgrade `eslint-config` and `metro-preset` in project template ([ad86a18305](https://github.com/facebook/react-native/commit/ad86a183052e8b25d599eb395aef55412c02ff7b) by [@Naturalclar](https://github.com/Naturalclar))
- Add ES Lint rules for `DynamicColorIOS()`and `ColorAndroid()` ([602070f44b](https://github.com/facebook/react-native/commit/602070f44b02220aeb036a7b3c26dad5c611b636) by [@tom-un](https://github.com/tom-un))
- Make `ScrollView` use `forwardRef` ([d2f314af75](https://github.com/facebook/react-native/commit/d2f314af75b63443db23e131aaf93c2d064e4f44) by [@kacieb](https://github.com/kacieb))
- Upgrade embedded React DevTools backend from v4.0.6 to v4.6.0 ([93ee5b2cc8](https://github.com/facebook/react-native/commit/93ee5b2cc8391bc5cb12ca7cf08ed0e44c74d29a) by [@bvaughn](https://github.com/bvaughn))
- Updated the React Hooks ESLint Plugin ([6ce3f0a4f7](https://github.com/facebook/react-native/commit/6ce3f0a4f7495adb82e655d037dc4e5af462f955) by [@gaearon](https://github.com/gaearon))
- Update to React 16.13.1 ([9637d6214a](https://github.com/facebook/react-native/commit/9637d6214a47e58d7fa8252a3de8c057e5cfb101) by [@gaearon](https://github.com/gaearon))
- Relax `RefreshControl`'s `onRefresh` flow typing ([884c86ae02](https://github.com/facebook/react-native/commit/884c86ae02b0be7ea1e4b258dab39f4c5aee0b9d) by [@vonovak](https://github.com/vonovak))
- Improved flowtype support for `Animated` ([bdafc55f50](https://github.com/facebook/react-native/commit/bdafc55f50c7d580ee2e643a02cb95d0196f721c) by [@javache](https://github.com/javache))
- Upgrade `eslint-plugin-relay` to 1.6.0 ([0483404d82](https://github.com/facebook/react-native/commit/0483404d827416b7270e8a42b84e424035127892) by [@kassens](https://github.com/kassens))
- Upgrade to latest dependencies in package.json template ([82e8239337](https://github.com/facebook/react-native/commit/82e82393377ddcedba01c401a5d79d5bbcdc4dc9) by [@codler](https://github.com/codler))
- Make JSStringToSTLString 23x faster ([733532e5e9](https://github.com/facebook/react-native/commit/733532e5e95c85b8295b6c66009ca9efd2a77622) by [@radex](https://github.com/radex))
- Changed property `disableIntervalMomentum` to work with both horizontal and vertical ScrollViews ([6237cfb325](https://github.com/facebook/react-native/commit/6237cfb325e39571ede0054a67d60f2c978d6d58) by [@Shaninnik](https://github.com/Shaninnik))
- Upgraded to Flow v0.114.0 ([aa78457343](https://github.com/facebook/react-native/commit/aa7845734352eab2bd32f7d6e683d6674fd6680d) by [@mroch](https://github.com/mroch))
- Updated CLI to the latest version ([ddc33007ad](https://github.com/facebook/react-native/commit/ddc33007ad0b4a0a24966b833e797227b9c56cca) by [@grabbou](https://github.com/grabbou))
- Upgrade Prettier from 1.17 to 2.0.2. ([cf44650b3f](https://github.com/facebook/react-native/commit/cf44650b3f4f13df8208ceded60ec5c48bd6baf3) by [@bolinfest](https://github.com/bolinfest))
- Only set dimensions if the window attributes change ([35c6bb9ac0](https://github.com/facebook/react-native/commit/35c6bb9ac0fc452428e85fee72affb4fc29f500c) by [@cpojer](https://github.com/cpojer))
- Upgrade internal packages to support ESLint >= 6 ([89d04b5e4a](https://github.com/facebook/react-native/commit/89d04b5e4a3fd0b0f77b5a390c0aa62a3804e2bc) by [@Barbiero](https://github.com/Barbiero))
- Make `JSCRuntime::createValue` faster ([24e0bad8be](https://github.com/facebook/react-native/commit/24e0bad8bea95ef7ddf72e2f00a93ffd47872d5b) by [@radex](https://github.com/radex))
- Add perf markers in `XMLHttpRequest` ([71b8ececf9](https://github.com/facebook/react-native/commit/71b8ececf9b298fbf99aa27d0e363b533411e93d) by [@sahrens](https://github.com/sahrens))
- Update SoLoader to 0.8.2 ([0a6f058b6b](https://github.com/facebook/react-native/commit/0a6f058b6bd0493f7eece972b1f73be3606ca8d5) by [@passy](https://github.com/passy))
- `console.error` calls, and uncaught exceptions are now displayed in the Metro logs as well ([ffb82cb2f0](https://github.com/facebook/react-native/commit/ffb82cb2f052f276a94a004d5acea0ab44f8098c) by [@mweststrate](https://github.com/mweststrate))
- Upgrade Flipper to 0.37.0 ([17f025bc26](https://github.com/facebook/react-native/commit/17f025bc26da13da795845a3f7daee65563420c0) by [@sunnylqm](https://github.com/sunnylqm))

#### Android specific

- Upgraded to Hermes 0.5.0 ([4305a291a9](https://github.com/facebook/react-native/commit/4305a291a9408ca65847994bbec42f1fbc97071d) by [@willholen](https://github.com/willholen))
- Internal storage now will be preferred for caching images from `ImageEditor`. ([79efa43428](https://github.com/facebook/react-native/commit/79efa4342852a3e9271a56e3a0fb7c15be664e9a) by [@kitttn](https://github.com/kitttn))
- Update Gradle Wrapper to 6.2 ([d4d8887b50](https://github.com/facebook/react-native/commit/d4d8887b5018782eeb3f26efa85125e6bbff73e4) by [@friederbluemle](https://github.com/friederbluemle))
- Upgrade Folly to v2020.01.13.00 ([6e2131b8fa](https://github.com/facebook/react-native/commit/6e2131b8fa85da8b3fb0391803e7fbecba890ffb) by [@Kudo](https://github.com/Kudo))
- Only update dimensions in `ReactRootView` if they've changed ([cc3e27d484](https://github.com/facebook/react-native/commit/cc3e27d484d3a412f632454b7f1c637b2c271af2) by [@ejanzer](https://github.com/ejanzer))
- `ReactEditText` extends `AppCompatEditText` ([aaa2765a92](https://github.com/facebook/react-native/commit/aaa2765a920de8234f0def4cae05ca5d6c8c8ac8) by [@dulmandakh](https://github.com/dulmandakh))
- Make `ReactApplicationContext` nullable as the constructor argument of `ReactContextBaseJavaModule` ([f8d5c5bfd7](https://github.com/facebook/react-native/commit/f8d5c5bfd79be0e20a205a1856bd9946143eeacf) by [@RSNara](https://github.com/RSNara))
- Update Android Gradle plugin to 3.5.3 ([e1e081b00e](https://github.com/facebook/react-native/commit/e1e081b00e5efb32bce74211c850212eca8a9412) by [@SaeedZhiany](https://github.com/SaeedZhiany))
- Don't emit dimensions update event on initial load ([383934a06e](https://github.com/facebook/react-native/commit/383934a06e22e8e1a5ee50d121722240259f95d0) by [@ejanzer](https://github.com/ejanzer))
- Bump Android build-tools to 29.0.2, compileSdk to 29 ([edcbfb9821](https://github.com/facebook/react-native/commit/edcbfb98210d9aaa6bb1d7c64281ae9cfb41cac2) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- Disambiguate autolinking-ios.rb script from CLI’s “autolinking” feature and bring RNTester & template in line. ([4118d79826](https://github.com/facebook/react-native/commit/4118d798265341061105f3a53550db83c66a71cb) by [@alloy](https://github.com/alloy))
- Updated Flipper iOS integration to be included by default in the `Debug` configuration ([619d5d60df](https://github.com/facebook/react-native/commit/619d5d60dfa94966e7104febec08166c1b5eca49) by [@alloy](https://github.com/alloy))
- Use Apple unified logging API (os_log) ([f501ed682a](https://github.com/facebook/react-native/commit/f501ed682ae68136d966aee2b0d3cc0f1e8b90cd) by [@LeoNatan](https://github.com/LeoNatan))
- Upgrade Folly to v2020.01.13.00 ([a27e31c059](https://github.com/facebook/react-native/commit/a27e31c059971b1d554ad6c7c81706f08eafac87) by [@Kudo](https://github.com/Kudo))
- Remove the `xcshareddata` from .gitignore ([7980615d37](https://github.com/facebook/react-native/commit/7980615d371a7bf607a3787bca91cfde229c41dc) by [@pvinis](https://github.com/pvinis))
- Add `complete_nullability = True` to compatible libraries ([796a4ea7e3](https://github.com/facebook/react-native/commit/796a4ea7e31ae05b76e59e02ab05f9c955f7c149))
- Remove the Flipper pod post install step ([44beb2a685](https://github.com/facebook/react-native/commit/44beb2a685b7ceb0311bde7d0d33cb70bb891d30) by [@priteshrnandgaonkar](https://github.com/priteshrnandgaonkar))
- Enable Flipper with CocoaPods `:configuration` ([7bb1c4e1b8](https://github.com/facebook/react-native/commit/7bb1c4e1b8715a5c9cb6f9e4e77a6df783481d3d) by [@alloy](https://github.com/alloy))

### Removed

- Remove unused`ImageProp` ([fbd09b1797](https://github.com/facebook/react-native/commit/fbd09b179759cd90f2be5c24caa11bdb483ad8cd) by [@Naturalclar](https://github.com/Naturalclar))
- Remove leftover `Incremental` component ([e99800267b](https://github.com/facebook/react-native/commit/e99800267b78aa581aff956d47b8be91858628b9) by [@venits](https://github.com/venits))
- Remove "Debug with Nuclide" option ([011eb4cea5](https://github.com/facebook/react-native/commit/011eb4cea5d482cef54d7659e7436a04e539ff19) by [@rickhanlonii](https://github.com/rickhanlonii))

#### Android specific

- Remove unused Feature Flag: `lazilyLoadViewManagers` ([3963f34980](https://github.com/facebook/react-native/commit/3963f34980f501ef89a945a1d0e76716af84527d) by [@JoshuaGross](https://github.com/JoshuaGross))
- `PickFirst` options for RNTester and template ([4bb0b4f205](https://github.com/facebook/react-native/commit/4bb0b4f205b1bc9a91150fe1f609f7d7313eb806) by [@passy](https://github.com/passy))
- Remove Kotlin version from the default template ([ced959bb3d](https://github.com/facebook/react-native/commit/ced959bb3d6abdab30c5e64af9bff6059b111cdd) by [@grabbou](https://github.com/grabbou))

#### iOS specific

- Remove core `RCTConvert` CoreLocation Libraries ([bcf2a716fb](https://github.com/facebook/react-native/commit/bcf2a716fb8b8954d6f7b801a1699eeea9418e73) by [@maschad](https://github.com/maschad))
- Remove copyright notices from iOS application template ([9c3fa57337](https://github.com/facebook/react-native/commit/9c3fa573379bb4824bbe02b5b5aa1ae3502772d8) by [@alloy](https://github.com/alloy))
- Remove three properties: `textColor`, `font` and `textAlignment` from `RCTBackedTextInputViewProtocol`, unifying the usage into `defaultTextAttributes`. ([aff6bad27c](https://github.com/facebook/react-native/commit/aff6bad27c6c2232ba8bde17823d0a0db4ac589b) by [@jimmy623](https://github.com/jimmy623))

### Fixed

- Add support to render `<View>` with no fixed size nested within a `<Text>` ([dbb7eacb42](https://github.com/facebook/react-native/commit/dbb7eacb429adb4160e740017c212bfd6df0f03a) by [@mdvacca](https://github.com/mdvacca))
- Fixes bug where `<Text><View><Image>` would crash. ([66601e755f](https://github.com/facebook/react-native/commit/66601e755fcad10698e61d20878d52194ad0e90c) by [@TheSavior](https://github.com/TheSavior))
- Use new `setTextCursorDrawable` API for Android 10 ([e7a14b803f](https://github.com/facebook/react-native/commit/e7a14b803fdc8840bbcde51d4bfa9cf9a85a8472) by [@sturmen](https://github.com/sturmen))
- Fix `Animated.Value` initialized with undefined in `ScrollView` ([cf02bd9b76](https://github.com/facebook/react-native/commit/cf02bd9b765e29ed8aa2bbf62661e89c84bb80e5) by [@janicduplessis](https://github.com/janicduplessis))
- Do not explicitly include `.js` in Library imports ([161b910494](https://github.com/facebook/react-native/commit/161b9104941663dcc0b08a73789c0ff3410fc661) by [@NickGerleman](https://github.com/NickGerleman))
- Fixed `Pressability` to properly fire `onLongPress`. ([5ca1d8f260](https://github.com/facebook/react-native/commit/5ca1d8f260bfb64111a6ba39f76a0a935829c0f2) by [@yungsters](https://github.com/yungsters))
- Fixed typo from `inly` to `only` inside `Modal.js` library code. ([686d8a57f8](https://github.com/facebook/react-native/commit/686d8a57f889fe74dc1c66566c80f0ed6d677729) by [@Darking360](https://github.com/Darking360))
- Fix viewability calculations for nested `VirtualizedLists` inside of a parent list's `FooterComponent` ([074a2fab74](https://github.com/facebook/react-native/commit/074a2fab74754c28cba0ccc51552a246a3046501) by [@logandaniels](https://github.com/logandaniels))
- Fix android `TextInput` transitions ([0a17a4fe56](https://github.com/facebook/react-native/commit/0a17a4fe56ff2cabc3c7d1cc5b34bd3fdd032e59))
- Remove JS autoFocus implementation ([0569d4c431](https://github.com/facebook/react-native/commit/0569d4c4315d61d2d8f4ab628a54eb1e1db45dc2) by [@janicduplessis](https://github.com/janicduplessis))
- Check null values in `shouldAnimate` ([3498b3b96b](https://github.com/facebook/react-native/commit/3498b3b96b2e27c7c7f6407b3673b44540871a31) by [@axe-fb](https://github.com/axe-fb))
- Fix `AccessibilityInfo.isScreenReaderEnabled` mock in Jest setup ([ec3327b61a](https://github.com/facebook/react-native/commit/ec3327b61ab1be3fd1565c8a35fe56747bd9069f) by [@rubennorte](https://github.com/rubennorte))
- Fix crash when passing invalid UTF-16 data from JSC into native code ([011cf3f884](https://github.com/facebook/react-native/commit/011cf3f88428ca83552d0b51c7c3a0c47b9728e5) by [@motiz88](https://github.com/motiz88))
- Make `YGValue.h` compile with Clang on Windows ([014bc95135](https://github.com/facebook/react-native/commit/014bc95135a38d65b991509492c0979cfd153e71) by [@christophpurrer](https://github.com/christophpurrer))
- Fix documentation comments for HermesJS's `Function::callWithThis` method to accurately reflect how `this` is handled. ([399bda5284](https://github.com/facebook/react-native/commit/399bda52840161bf7d30c09eca061b4378b8f6e4) by [@Kronopath](https://github.com/Kronopath))
- Fix resolving assets outside of the project root ([7deeec7396](https://github.com/facebook/react-native/commit/7deeec73966d84140492c2a767819977318c4d2d) by [@janicduplessis](https://github.com/janicduplessis))
- Transform empty responses into empty `Blob`s ([9a8c06b502](https://github.com/facebook/react-native/commit/9a8c06b502c774f7a0bff1bdc064fbfe16ca75be) by [@RSNara](https://github.com/RSNara))
- Fix validation of event mappings for `AnimatedEvent` ([19362f6116](https://github.com/facebook/react-native/commit/19362f6116bad441c5e23f2bab420af78664b3d3) by [@javache](https://github.com/javache))
- Fix `NativeJSCHeapCapture` ([7e3a43c23d](https://github.com/facebook/react-native/commit/7e3a43c23d028a4481bc455dd28c391a81ff1a94) by [@RSNara](https://github.com/RSNara))
- Add `AnimationInterpolation` as possible type for toValue ([26e8870fbf](https://github.com/facebook/react-native/commit/26e8870fbf310f0fb438a86cb2fe260f0bc419b9) by [@nabati](https://github.com/nabati))
- Fix return type of `StyleSheet.create` ([4e71a30969](https://github.com/facebook/react-native/commit/4e71a30969d74073309d0350be55cadb84ae43ff) by [@jbrown215](https://github.com/jbrown215))
- Adjust HelloWorld-tvOSTests/Info.plist `CFBundleIdentifier` to use `PRODUCT_BUNDLE_IDENTIFIER` ([98ebc1ea25](https://github.com/facebook/react-native/commit/98ebc1ea25102049ec53288a458ff16ed5b4ada0) by [@MoOx](https://github.com/MoOx))
- Fix bug where if `Error` global is not callable when building an error, jsi will throw a JS exception back to JS code. #158 ([a195447539](https://github.com/facebook/react-native/commit/a1954475394dc03704a2e093e6fc4b48188640fa) by [@mhorowitz](https://github.com/mhorowitz))
- Fix stylesheet validation for functions with custom prototype methods. ([f464dad5d4](https://github.com/facebook/react-native/commit/f464dad5d4f0fbf1cb23e21d22907ffddeaf97e4))
- Fix sporadic issue with `onEndReached` called on load when not needed ([8ddf231306](https://github.com/facebook/react-native/commit/8ddf231306e3bd85be718940d04f11d23b570a62) by [@sahrens](https://github.com/sahrens))
- Correct argument types of `NativeJSDevSupport.onSuccess` ([b42371da5a](https://github.com/facebook/react-native/commit/b42371da5a41916522b569a66c0a126333cf9cac) by [@RSNara](https://github.com/RSNara))
- Add `URLSearchParams` and `Headers` to eslint globals ([7a13a1a88f](https://github.com/facebook/react-native/commit/7a13a1a88fdf26dca817b76399f1c86a8a05eccb) by [@sonnyp](https://github.com/sonnyp))
- Export exception classes with default visibility ([84adc85523](https://github.com/facebook/react-native/commit/84adc85523770ebfee749a020920e0b216cf69f8) by [@appden](https://github.com/appden))
- Add `URL` to eslint globals. ([ff9def41ff](https://github.com/facebook/react-native/commit/ff9def41ff3e7760d076bf1b899583d4b36cba0d) by [@sonnyp](https://github.com/sonnyp))
- Plumb through memory allocation profiler feature to Chrome Inspector ([ed3054927c](https://github.com/facebook/react-native/commit/ed3054927c30c8823f78026b9c4cb42fbe4f8b00) by [@jbower-fb](https://github.com/jbower-fb))
- Better monorepo support when building release apk ([a8e85026cf](https://github.com/facebook/react-native/commit/a8e85026cfa60056b1bcbcd39cde789e4d65f9cb) by [@grabbou](https://github.com/grabbou))
- `LogBox` - Fix dependency cycle ([6ba2aeefa8](https://github.com/facebook/react-native/commit/6ba2aeefa8dfe031bf1dc46dbea29235aec31d61) by [@rickhanlonii](https://github.com/rickhanlonii))
- Always update background color and bar style on Android status bar ([9457efa84c](https://github.com/facebook/react-native/commit/9457efa84c872f029027cdcfc3bae4f403715e48))
- Disable accessibility state changes of the focused view for Android API < 21 ([f2d58483c2](https://github.com/facebook/react-native/commit/f2d58483c2aec689d7065eb68766a5aec7c96e97) by [@mdvacca](https://github.com/mdvacca))

#### Android specific

- Gradle release config ([0d1fb458ab](https://github.com/facebook/react-native/commit/0d1fb458ab8027dcfac5f2fa11e8c16d6853c59c) by [@vdmtrv](https://github.com/vdmtrv))
- Change how `TextInput` responds to `requestFocus` to fix a11y focus issue ([d4a498aba2](https://github.com/facebook/react-native/commit/d4a498aba2d2843e7a741a31b0c91c6a79a7386c) by [@ejanzer](https://github.com/ejanzer))
- Fixed style in `TextInputTestCase` ([8c493804f3](https://github.com/facebook/react-native/commit/8c493804f3f7b3ae3761679a978971ab9d71baa0) by [@ejanzer](https://github.com/ejanzer))
- Fix template instacrash from missing androidx dependency ([a1b14deb3e](https://github.com/facebook/react-native/commit/a1b14deb3e32df797aae99a75743a4d283e5337b) by [@alloy](https://github.com/alloy))
- Implement native `TextInput` `autoFocus` on Android ([055a41b081](https://github.com/facebook/react-native/commit/055a41b081c5bc9535b071d9b4b7488b92e71803) by [@janicduplessis](https://github.com/janicduplessis))
- Support for case insensitive `Origin` headers for `Websockets` ([aeaf286c77](https://github.com/facebook/react-native/commit/aeaf286c77b50a95c4961de0d2355caad8ffa396) by [@brunobar79](https://github.com/brunobar79))
- RNTester Buck Build ([a3cb377645](https://github.com/facebook/react-native/commit/a3cb377645f2ccb7632ded73c230a41025d38f6f) by [@passy](https://github.com/passy))
- Fix bug in updating dimensions in JS ([bef845ffd5](https://github.com/facebook/react-native/commit/bef845ffd521aa83d779de584ec370f9f88f27f3) by [@ejanzer](https://github.com/ejanzer))
- Applied missing changes from bumping Gradle wrapper to 6.0.1 ([aa0ef15335](https://github.com/facebook/react-native/commit/aa0ef15335fe27c0c193e3e968789886d82e82ed) by [@SaeedZhiany](https://github.com/SaeedZhiany))
- Unregister `JSDevSupport` from `DebugCorePackage` ([c20963e11c](https://github.com/facebook/react-native/commit/c20963e11cc1c10f20a2a0a3c209f5b403c9e899) by [@RSNara](https://github.com/RSNara))
- Make sure `ServerHost` is optional in `NativePlatformConstants.js` ([048f88a33a](https://github.com/facebook/react-native/commit/048f88a33a53ebd4e45865b319c42291f1d6c7f2) by [@RSNara](https://github.com/RSNara))
- Removed code that would cause accessibility header role to be spoken twice ([7428271995](https://github.com/facebook/react-native/commit/7428271995adf21b2b31b188ed83b785ce1e9189) by [@KevinGVargas](https://github.com/KevinGVargas))
- Fail silently in `AppStateModule.sendEvent` if `CatalystInstance` is not available ([c4806fada6](https://github.com/facebook/react-native/commit/c4806fada6532894e2242cf31f7145d2992e3a2b) by [@JoshuaGross](https://github.com/JoshuaGross))
- RN `Picker` - fix types in `AndroidDialogPickerManagerInterface` ([56b0f5cb6b](https://github.com/facebook/react-native/commit/56b0f5cb6ba48ecefc2890152ebe88e3df61a0ea))
- Fix Hermes debugger being disabled by default ([b8621f5d30](https://github.com/facebook/react-native/commit/b8621f5d303442ab78dc5d745cfc86a941d4737c) by [@willholen](https://github.com/willholen))

#### iOS specific

- Fixed connection of metro reload command to iOS device ([f9df93385e](https://github.com/facebook/react-native/commit/f9df93385eee0e1cd1144a65e05410dfb48b119c) by [@reyalpsirc](https://github.com/reyalpsirc))
- Remove `RCTDevLoadingView` jank ([faff19a7c6](https://github.com/facebook/react-native/commit/faff19a7c651c740d8d649b86727b63b63562b20) by [@RSNara](https://github.com/RSNara))
- Fix crash when passing null value in object parameter of bridged method ([15434c7c43](https://github.com/facebook/react-native/commit/15434c7c435928a40b9cd66fe9f5d1bcdea8d954))
- Get ready for Clang 10 ([8721ee0a6b](https://github.com/facebook/react-native/commit/8721ee0a6b10e5bc8a5a95809aaa7b25dd5a6043) by [@maxovtsin](https://github.com/maxovtsin))
- Fix `RCTBlobManager` cleanup crash ([91c5ff4a12](https://github.com/facebook/react-native/commit/91c5ff4a12982ccead56c9c038761e9316d01409) by [@RSNara](https://github.com/RSNara))
- Make Lambda function called in `NativeModule` mutable ([5290047d09](https://github.com/facebook/react-native/commit/5290047d09c0a41c85a1d47a638877c226d9c191) by [@maschad](https://github.com/maschad))
- Fix crash in `RCTCxxBridge.executeApplicationScript` ([0c2db3256f](https://github.com/facebook/react-native/commit/0c2db3256f6cbb3ec564e0f183a52a439ed33f52) by [@ahimberg](https://github.com/ahimberg))
- Fix `RCTDevLoadingView` `RedBox` on reload ([fe5ac2c3f9](https://github.com/facebook/react-native/commit/fe5ac2c3f9e47cfb7c5820a755a5d74d47624953) by [@RSNara](https://github.com/RSNara))
- Fix `Image` component crashing when `uri` is `null` ([06b8b15b0a](https://github.com/facebook/react-native/commit/06b8b15b0af84b6f8b44d200dc25f29eac51181c) by [@mlazari](https://github.com/mlazari))
- Fix `RCTDevLoadingView` not showing up with `UIScene` ([74b667dbc2](https://github.com/facebook/react-native/commit/74b667dbc2a48183dec0b9c3b5401bc3f9e54e7b) by [@tido64](https://github.com/tido64))
- Prevent interactive dismissal for non-fullscreen modals ([1e7ed81d16](https://github.com/facebook/react-native/commit/1e7ed81d16dda4188352e0ccdc0f0bd3ad4741f3))
- Resolve localization warnings in template ([0e4bcaa296](https://github.com/facebook/react-native/commit/0e4bcaa2960a2b1aa42dbe716fc6a35652aa7207) by [@safaiyeh](https://github.com/safaiyeh))
- Implement `requiresMainQueueSetup` in `RCTDevSettings.mm` ([adf87dd7ed](https://github.com/facebook/react-native/commit/adf87dd7eddcf65a3300e6ac9092838d9c8a3279) by [@logandaniels](https://github.com/logandaniels))
- Resolve `React-RCTText` Xcode warning ([04fed6508b](https://github.com/facebook/react-native/commit/04fed6508b74b23c954183af3f6121fb344d2138) by [@safaiyeh](https://github.com/safaiyeh))
- Resolve Xcode warnings from `React-cxxreact`. ([dc6c57ce0d](https://github.com/facebook/react-native/commit/dc6c57ce0d4f5424bfb047c51fee18eac381a98b) by [@safaiyeh](https://github.com/safaiyeh))
- `RCTReconnectingWebSocket` is reconnecting infinitely when stopped before getting connected ([0d4b0e9417](https://github.com/facebook/react-native/commit/0d4b0e941725657d8e63940428888aaceff505ad))
- Fix prop name of `passwordRules` in `TextInput` ([3f5c42f357](https://github.com/facebook/react-native/commit/3f5c42f357d58268d0a0fd1bfc639f41feab937c) by [@Naturalclar](https://github.com/Naturalclar))
- Remove need for Swift file in the user’s project in order to use Flipper ([8f93dedc6a](https://github.com/facebook/react-native/commit/8f93dedc6a5653edd2220c65ccb4ff8736ee060c) by [@alloy](https://github.com/alloy))
- Clear all held `jsi::Functions` when `jsi::Runtime` is deleted ([9ae95582e7](https://github.com/facebook/react-native/commit/9ae95582e792a3dca4487bdce9080c6d874c7dd7) by [@RSNara](https://github.com/RSNara))
- Make framework builds work again by making `RCTImageLoader` C++ requirement opt-in ([25571ec452](https://github.com/facebook/react-native/commit/25571ec4522931193b41723d3f80b3bced1fca3b) by [@alloy](https://github.com/alloy))
- Enable dev keyboard shortcuts on Mac Catalyst ([56dfc86d64](https://github.com/facebook/react-native/commit/56dfc86d64a2a1f2ad05239b6d11aacac73cbac9) by [@charpeni](https://github.com/charpeni))
- Fix `RCTTextView` layout issue that happens on some font with `leading` attribute not equal to zero, which causes wrong base-alignment layout ([5d08aab526](https://github.com/facebook/react-native/commit/5d08aab526b2702b46ff75ea7e943a33aa6df288))
- Fix LAN instead of Wi-Fi device bundle configuration ([d1e6f8d3c4](https://github.com/facebook/react-native/commit/d1e6f8d3c4de1fbb4bddd5205cd3b35c572b495b) by [@Oleg-E-Bakharev](https://github.com/Oleg-E-Bakharev))
- Add autorelease pool for each run loop for JS Thread ([948cbfdacc](https://github.com/facebook/react-native/commit/948cbfdacc42f8d2640e69f61df55f6adb823fcf) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fixed bug in implementation of `<TextInput>`'s `selectOnFocus` prop ([e020576b34](https://github.com/facebook/react-native/commit/e020576b34fb6ca6d3f9fe38916844b78a45c0e3) by [@shergin](https://github.com/shergin))
- `RCTRedBox` doesn't appear in apps implementing `UISceneDelegate` ([d0a32c2011](https://github.com/facebook/react-native/commit/d0a32c2011ca00991be45ac3fa320f4fc663b2e8) by [@tido64](https://github.com/tido64))
- Fixes the `InputAccessoryView.backgroundColor` prop’s typing to use `ColorValue`. ([a43fd60e18](https://github.com/facebook/react-native/commit/a43fd60e18aff9ee6bcaf8ec576adb8678d5bcf4) by [@alloy](https://github.com/alloy))
- Fix `Animated` image crash when `CADisplayLink` target in `RCTWeakProxy` is `nil` ([e5a6655e71](https://github.com/facebook/react-native/commit/e5a6655e71d41a58ce0e51d37aa9fb8792e37dd5) by [@p-sun](https://github.com/p-sun))

## v0.62.3

### Security

- Update validateBaseUrl to use latest regex ([33ef82ce6d](https://github.com/facebook/react-native/commit/33ef82ce6dfd31e1f990d438c925a0e52723e16b) by [@FBNeal](https://github.com/FBNeal))

### Fixed

#### iOS specific

- Change autolink to match requirements for FlipperFolly working with Xcode 12.5 ([c6f4611dcb](https://github.com/facebook/react-native/commit/c6f4611dcbfbb64d5b54e242570e2a1acffcabef) by [@kelset](https://github.com/kelset))
- Change podfile to rely on the autolink-ios rb file ([c4ea556d64](https://github.com/facebook/react-native/commit/c4ea556d64c7fc146d1412548788c48bbcc0f6bb) by [@kelset](https://github.com/kelset))
- Update detox to work on Xcode 12 ([158b558e50](https://github.com/facebook/react-native/commit/158b558e500576f434dec09417bb02cc0bc53f7a) by [@kelset](https://github.com/kelset))

## v0.62.2

### Fixed

- Fix Appearance module when using Chrome Debugger ([f7b90336be](https://github.com/facebook/react-native/commit/f7b90336be25b78935549aa140131d4d6d133f7b) by [@TheSavior](https://github.com/TheSavior))
- Fix mock for TextInput ([5a3c6faee9](https://github.com/facebook/react-native/commit/5a3c6faee9c44a2d99b13d113c91dbf98990f8af) by [@SergioEstevao](https://github.com/SergioEstevao))
- Flow errors from YellowBox and BubblingEventHandler ([a049130f34](https://github.com/facebook/react-native/commit/a049130f34be951c9c67d2a472c7eb7f3d08f070) by [@thymikee](https://github.com/thymikee))

#### iOS specific

- Make Vibration library compatible with TurboModules. ([3904228704](https://github.com/facebook/react-native/commit/390422870466beba571dda04f669380e14055056) by [@brunobar79](https://github.com/brunobar79))
- Exclude Flipper from iOS Release builds ([e5497ca8f6](https://github.com/facebook/react-native/commit/e5497ca8f6e3b240948fdbeef0ac2a710f25bb56) by [@javiercr](https://github.com/javiercr))
- Fix crash when enabling Performance Monitor on iOS 13.4 ([e2c417f7cf](https://github.com/facebook/react-native/commit/e2c417f7cf5ae7efa5ea1f9644a51c4c706a983f) by [@IjzerenHein](https://github.com/IjzerenHein))

## v0.62.1

### Fixed

- Bump CLI to 4.5.1 to improve DX ([eac56b9749](https://github.com/facebook/react-native/commit/eac56b9749ed624275d4190b5e48b775583acb3f) by [@alloy](https://github.com/alloy))
- Fix a YellowBox regression in v0.62.0 where the Flipper network inspector causes YellowBox to crash the app due to using base64 images. ([227aa96bb2](https://github.com/facebook/react-native/commit/227aa96bb23b6ff20eebbd8a9335fd172ed6005b) by [@rickhanlonii](https://github.com/rickhanlonii))

#### Android specific

- Add new DoNotStrip class to proguard config ([cfcf5eba43](https://github.com/facebook/react-native/commit/cfcf5eba4317f80ef8902463b7c0b2e1e7b534a7) by [@janicduplessis](https://github.com/janicduplessis))

#### iOS specific

- Fix Performance Monitor in dark appearance ([576ddfb3a8](https://github.com/facebook/react-native/commit/576ddfb3a84a5461679959f0d3f229a000dcea8d) by [@gorhom](https://github.com/gorhom))
- Inverted ScrollViews scroll to their bottom when the status bar is pressed ([7a4753d76a](https://github.com/facebook/react-native/commit/7a4753d76aab1c52a09f26ec6f7fd43a68da8a97) by [@emilioicai](https://github.com/emilioicai))
- Revert [previous incomplete fix](https://github.com/facebook/react-native/commit/bd2b7d6c0366b5f19de56b71cb706a0af4b0be43) for [an issue](https://github.com/facebook/react-native/issues/26473) with `Modal`’s `onDismiss` prop. ([27a3248a3b](https://github.com/facebook/react-native/commit/27a3248a3b37410b5ee6dda421ae00fa485b525c) by [@grabbou](https://github.com/grabbou))
- Fix double call to onEndReached in VirtualizedList ([d3658bc2b6](https://github.com/facebook/react-native/commit/d3658bc2b6437e858d3b3f5688277dedbca779b8) by [@MartinSherburn](https://github.com/MartinSherburn))

### Changed

- Update warning message of deprecated imports ([405200e9a9](https://github.com/facebook/react-native/commit/405200e9a930cded47954f374f2a779ec769cd4c) by [@Naturalclar](https://github.com/Naturalclar))

## v0.62.0

This major release includes Flipper support by default, improved dark mode support, moving Apple TV to [react-native-tvos](https://github.com/react-native-community/react-native-tvos), and more. See the [blog post](https://reactnative.dev/blog/2020/03/26/version-0.62) for all of the highlights.

This release comes in the midst of a global pandemic. We’re releasing this version today to respect the work of hundreds of contributors who made this release possible and to prevent the release from falling too far behind master. Please be mindful of the reduced capacity of contributors to help with issues and prepare to delay upgrading if necessary.

If you're upgrading, manual intervention may be required for your app. Please see the [upgrade-helper](https://react-native-community.github.io/upgrade-helper/) for a detailed breakdown of the changes required and see [this issue](https://github.com/react-native-community/releases/issues/179) for known issues.

One known issue with workaround is regarding Android builds and [APK size increases](https://github.com/facebook/react-native/issues/28330).

### Breaking

- React DevTools v4 integration ([92a3c9da0a](https://github.com/facebook/react-native/commit/92a3c9da0a38870a8bad7c91bdc3ddb494f6e5f2) by [@bvaughn](https://github.com/bvaughn))
- Remove `TextInput`'s `onTextInput` prop ([3f7e0a2c96](https://github.com/facebook/react-native/commit/3f7e0a2c9601fc186f25bfd794cd0008ac3983ab) by [@shergin](https://github.com/shergin))
- Remove `TextInput`'s `inputView` prop ([1804e7cbea](https://github.com/facebook/react-native/commit/1804e7cbea707a35046118090966a54031edfae8) by [@TheSavior](https://github.com/TheSavior))
- Animated: Remove `defaultProps` Parameter ([a70987cee2](https://github.com/facebook/react-native/commit/a70987cee24bcd027b9c4a5aa85dfd6a1aab74b3) by [@yungsters](https://github.com/yungsters))
- Remove `TextInput`'s `selectionState` prop ([2becdfd404](https://github.com/facebook/react-native/commit/2becdfd4041f7f28138ba3a61c03e17c06dc2e50) by [@yungsters](https://github.com/yungsters))
- Remove support for `framesToPop` ([8bc02fdd52](https://github.com/facebook/react-native/commit/8bc02fdd52124d0a24d96e4a61d7688328ef1660) [cf4d45ec2b](https://github.com/facebook/react-native/commit/cf4d45ec2bcd301be7793d5840de21ec7d02275b) [a483f802fd](https://github.com/facebook/react-native/commit/a483f802fddfd927f2baa0d95e2b4094d452cddd) by [@motiz88](https://github.com/motiz88))
- Remove `TimePickerAndroid` ([dbf070c51e](https://github.com/facebook/react-native/commit/dbf070c51ecd14127a8317faa75cb661697b5a6b) by [@cpojer](https://github.com/cpojer))
- Remove `scrollWithoutAnimationTo` from ScrollView ([c7e89909da](https://github.com/facebook/react-native/commit/c7e89909da70ac5290f9971080eb897567db3e43) by [@TheSavior](https://github.com/TheSavior))
- Bump CLI to ^4.2.x ([be5088401f](https://github.com/facebook/react-native/commit/be5088401fd8e19d57adda42d275cab437448064) by [@alloy](https://github.com/alloy)) - for details on what v4 of the CLI improves on (like monorepo support), please refer to the [dedicated blog post](https://callstack.com/blog/react-native-cli-3-1-0-and-4-0-0-whats-new/) and the [release notes](https://github.com/react-native-community/cli/releases)
- Remove `accessibilityStates` property ([7b35f427fd](https://github.com/facebook/react-native/commit/7b35f427fd66cb0f36921b992095fe5b3c14d8b9) by [@marcmulcahy](https://github.com/marcmulcahy))
- Upgraded to Hermes 0.4.0. If you're using ProGuard you will need to add the following rule to `proguard-rules.pro`: `-keep class com.facebook.jni.** { *; }` ([ab3c184555](https://github.com/facebook/react-native/commit/ab3c184555e382b8693cbfcdfe01ba89583ee726) by [@willholen](https://github.com/willholen))

#### Android specific

- Fix setting keyboardType from breaking autoCapitalize ([233fdfc014](https://github.com/facebook/react-native/commit/233fdfc014bb4b919c7624c90e5dac614479076f) by [@safaiyeh](https://github.com/safaiyeh))
- Limit size of video uploaded from camera roll in android (< 100 MB) ([d21f695edf](https://github.com/facebook/react-native/commit/d21f695edf367166a03af4c6e9376cd498b38665))
- Remove "Reload on JS change" from RN Android ([478df155e7](https://github.com/facebook/react-native/commit/478df155e70a4ce30219adcac6f0801c4e4d10ec) by [@cpojer](https://github.com/cpojer))

### Added

- Add support for Flipper by default ([multiple commits](https://github.com/facebook/react-native/pulls?q=is%3Apr+Flipper+is%3Aclosed))
- Add `getNativeScrollRef` method to FlatList component ([bde1d63c85](https://github.com/facebook/react-native/commit/bde1d63c853630609b22c87121c125775dd1f5cb) by [@kacieb](https://github.com/kacieb))
- Add missing accessibility props on Touchables ([8c0c860e38](https://github.com/facebook/react-native/commit/8c0c860e38f57e18296f689e47dfb4a54088c260) by [@xuelgong](https://github.com/xuelgong))
- Added missing `console` polyfills in release builds. ([b7ab922bb3](https://github.com/facebook/react-native/commit/b7ab922bb3fd4f9f103e583bed9e9295a9521578) by [@yungsters](https://github.com/yungsters))
- Platform.select now supports native as an option. ([a6fc0898de](https://github.com/facebook/react-native/commit/a6fc0898de990959d201b9665501deda215e41a4) by [@koke](https://github.com/koke))
- Export the DevSettings module, add `addMenuItem` method ([cc068b0551](https://github.com/facebook/react-native/commit/cc068b055185e6fb7341bf945f69a74ed3ef4814) by [@janicduplessis](https://github.com/janicduplessis))
- Expose RCTNetworking as a public 'Networking' API ([42ee5ec934](https://github.com/facebook/react-native/commit/42ee5ec93425c95dee6125a6ff6864ec647636aa) by [@adamchel](https://github.com/adamchel))
- Add `useColorScheme` hook ([51681e80ab](https://github.com/facebook/react-native/commit/51681e80ab0d1efdaba684b626994b694d53d2a5) by [@hramos](https://github.com/hramos))
- Add `unstable_enableLogBox` ([dd8e5f468a](https://github.com/facebook/react-native/commit/dd8e5f468a29e299647ffbd0887f53afd24936e3) by [@rickhanlonii](https://github.com/rickhanlonii))
- Expose Hermes Sampling Profiler ([15ecb60d6d](https://github.com/facebook/react-native/commit/15ecb60d6deb96fcb7b0ef70faccd10594ededa3) by [@axe-fb](https://github.com/axe-fb))
- Add `error-subclass-name` lint rule ([6611c4b8f4](https://github.com/facebook/react-native/commit/6611c4b8f42520add983cc48fe4e14f7a02cc7cf) by [@motiz88](https://github.com/motiz88))
- Add `HostComponent` to the public API of React Native ([a446a38aaa](https://github.com/facebook/react-native/commit/a446a38aaab5bea2e279f1958cfd90090bfd7e09) by [@TheSavior](https://github.com/TheSavior))
- Add `RCTExceptionsManager.reportException` ([9a57145f52](https://github.com/facebook/react-native/commit/9a57145f52a03678da02d5d00cbe11eed3f5a0fc) by [@motiz88](https://github.com/motiz88))
- Add `accessibilityValue` property ([7df3eea1a7](https://github.com/facebook/react-native/commit/7df3eea1a79f12c2dfff1976d0cef605a83232ec) by [@marcmulcahy](https://github.com/marcmulcahy))
- Add `Appearance` module to expose the user's current Night theme preference ([17862a78db](https://github.com/facebook/react-native/commit/17862a78db59d60fe316961f9111efc330ba2abd) [63fa3f21c5](https://github.com/facebook/react-native/commit/63fa3f21c5ab308def450bffb22054241a8842ef) by [@hramos](https://github.com/hramos))
- Add `onSlidingComplete` callbacks when sliders adjusted via a11y. ([c7aa6dc827](https://github.com/facebook/react-native/commit/c7aa6dc8270c0eabc913fe6c617c8131e3f4b3c5) by [@marcmulcahy](https://github.com/marcmulcahy))

#### Android specific

- Implement `adjustsFontSizeToFit` on Android ([2c1913f0b3](https://github.com/facebook/react-native/commit/2c1913f0b3d12147654501f7ee43af1d313655d8) by [@janicduplessis](https://github.com/janicduplessis))
- Allow overriding `EditText` construction in `ReactTextInputShadowNode` ([a5b5d1a805](https://github.com/facebook/react-native/commit/a5b5d1a805a9c54d325763b432be1cf2c8811dc9) by [@mchowning](https://github.com/mchowning))
- Add Android support for `fontVariant` prop ([c2c4b43dfe](https://github.com/facebook/react-native/commit/c2c4b43dfe098342a6958a20f6a1d841f7526e48) by [@mcuelenaere](https://github.com/mcuelenaere))
- Custom entry file on android using `ENTRY_FILE` environment variable ([a0d8740878](https://github.com/facebook/react-native/commit/a0d87408782fcf191988612198493d9130736c72))
- Added `statusBarTranslucent` prop to Modal component ([c35a419e5d](https://github.com/facebook/react-native/commit/c35a419e5d2eca4fe9cd0939df085088fa88423b) by [@pfulop](https://github.com/pfulop))
- Add `fadingEdgeLength` prop to FlatList and ScrollView ([51aacd5241](https://github.com/facebook/react-native/commit/51aacd5241c4b4c0b9b1e1b8f9dabac45e5b5291))
- Support `removeClippedSubviews` for horizontal ScrollViews ([42152a3fa3](https://github.com/facebook/react-native/commit/42152a3fa3f949f5112461753eb44a436355dfb1))
- Introducing `ReactCallerContextFactory` interface ([9713b63d9a](https://github.com/facebook/react-native/commit/9713b63d9ac1e1ae85accd86b78b351ac6295d01) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- Added web socket support for macOS ([f21fa4ecb7](https://github.com/facebook/react-native/commit/f21fa4ecb73551bdc4c3d70db9fc13e93b19b3a6) by [@andymatuschak](https://github.com/andymatuschak))
- Added Warning message Linking API with Phones in iOS Simulator ([e1d89fbd9d](https://github.com/facebook/react-native/commit/e1d89fbd9df91679ec36e955a3d0f699c2d5e777) by [@espipj](https://github.com/espipj))
- Added missing deps for React-CoreModules ([15b2353382](https://github.com/facebook/react-native/commit/15b2353382c46dc5f0130ff44b9deb6a2361e3e5) by [@fkgozali](https://github.com/fkgozali))
- Expose the `isPackagerRunning` methods on RCTBundleURLProvider ([fe9cba74fa](https://github.com/facebook/react-native/commit/fe9cba74fa6241b4c38a3df9481d3634ebd51bf9) by [@afoxman](https://github.com/afoxman))
- Add `autoFocus` to TextInput ([6adba409e6](https://github.com/facebook/react-native/commit/6adba409e6256fd2dcc27a4272edcedae89927af) by [@janicduplessis](https://github.com/janicduplessis))

### Changed

- Upgrade metro version to 0.56.3 ([4b487ba500](https://github.com/facebook/react-native/commit/4b487ba50025becb6a83c805b99d45651db6b8c1) by [@EssamEmad](https://github.com/EssamEmad))
- Upgrade `eslint-plugin-relay` to 1.3.12 ([f0bcfbe9be](https://github.com/facebook/react-native/commit/f0bcfbe9be0eb6a06d096a682717a23e43c39d52) by [@jstejada](https://github.com/jstejada))
- Upgrade to Flow v0.108.0 ([d34bc5fa64](https://github.com/facebook/react-native/commit/d34bc5fa64a54dfc2e780461ee2997a4b17f8c65) by [@mvitousek](https://github.com/mvitousek))
- Upgrade metro babel preset ([cef001713f](https://github.com/facebook/react-native/commit/cef001713fc6384353bbcb4d45645ceee44ed1a9) by [@alloy](https://github.com/alloy))
- TextInput now properly sends native the end selection location on change ([dff490d140](https://github.com/facebook/react-native/commit/dff490d140010913d3209a2f3e987914b9c4eee4) by [@TheSavior](https://github.com/TheSavior))
- TextInput now uses `forwardRef` allowing it to be used directly by new APIs requiring a host component. ([bbc5c35a61](https://github.com/facebook/react-native/commit/bbc5c35a61cd3af47ccb2dc62430e4b6a4d4e08f) by [@TheSavior](https://github.com/TheSavior))
- TextInput no longer does an extra round trip to native on focus/blur ([e9b4928311](https://github.com/facebook/react-native/commit/e9b4928311513d3cbbd9d875827694eab6cfa932) by [@TheSavior](https://github.com/TheSavior))
- Render collapsed JavaScript frames in RedBox ([468d1a2d2e](https://github.com/facebook/react-native/commit/468d1a2d2e6c72d7c6d435ecaad8499997584de6) by [@motiz88](https://github.com/motiz88))
- Enable `no-useless-escape` lint rule ([90977b0e00](https://github.com/facebook/react-native/commit/90977b0e00acc6b3263502017c27094392e89478) by [@motiz88](https://github.com/motiz88))
- Update `DevSettings.reload` to accept a reason ([549cac63cb](https://github.com/facebook/react-native/commit/549cac63cb252037f73453c5d4e7ae5f15586607) by [@rickhanlonii](https://github.com/rickhanlonii))
- Move `react-native-implementation.js` to `index.js` ([e54ecf907e](https://github.com/facebook/react-native/commit/e54ecf907e9f0660d05dc807ec0e67127143ebed) by [@cpojer](https://github.com/cpojer))
- Delete Long Press Error in Touchable ([9a3d722ccb](https://github.com/facebook/react-native/commit/9a3d722ccb523f227ffd7770a809996e6cfe75d9) by [@yungsters](https://github.com/yungsters))
- Add Intl to eslint globals. ([f6a62f9ae2](https://github.com/facebook/react-native/commit/f6a62f9ae2278c0f3a1e5c1a6ec3b7cca3421a41))
- Add WebSocket to eslint globals ([af8ea06bb4](https://github.com/facebook/react-native/commit/af8ea06bb44e84ce51d4ca4e76f0d66bf34323bd) by [@dr2009](https://github.com/dr2009))
- Change default `accessibilityRole` of Switch component from `button` to `switch` ([36672c3851](https://github.com/facebook/react-native/commit/36672c3851a044a1ab0edcfaa2790c02f7909695) by [@alvinmatias69](https://github.com/alvinmatias69))

#### Android specific

- Bump gradle-download-task to 4.0.2 ([088be260b6](https://github.com/facebook/react-native/commit/088be260b6727ba82167fe58cb1ee4410a6920b2) by [@dulmandakh](https://github.com/dulmandakh))
- Bump Gradle to 6.0.1 ([701e66bde4](https://github.com/facebook/react-native/commit/701e66bde4ea0e404626c7805e2bcdfa0c129c05) by [@dulmandakh](https://github.com/dulmandakh))
- Bump Gradle wrapper 5.6.4 ([928f4434b9](https://github.com/facebook/react-native/commit/928f4434b9829c90098b1626b03938d932a9c1f6) by [@friederbluemle](https://github.com/friederbluemle))
- Bump Soloader to 0.8.0 ([614039834b](https://github.com/facebook/react-native/commit/614039834bf255de096f8b1d168832f81b0cf3fa))
- Update Android Gradle plugin to 3.5.2 ([b41b5ce8ae](https://github.com/facebook/react-native/commit/b41b5ce8ae2902169ae58860da2c70a9233bea53) by [@friederbluemle](https://github.com/friederbluemle))
- Improve exception message when JSC loading fails ([65d3167a80](https://github.com/facebook/react-native/commit/65d3167a802b2ca04d4f05ff972c2d51765f1e0d) by [@mhorowitz](https://github.com/mhorowitz))
- Expose `addCookies` method ([cc845ccfb4](https://github.com/facebook/react-native/commit/cc845ccfb4c0f841b876bca55c5f70efd72be538) by [@safaiyeh](https://github.com/safaiyeh))
- Migrated from libfb to libfbjni for JNI calls ([9ad5e72b77](https://github.com/facebook/react-native/commit/9ad5e72b77013083f925108870ea6b17f4711a1d) by [@passy](https://github.com/passy))
- Formatted cpp/h code with clang-format ([d5ba113bb2](https://github.com/facebook/react-native/commit/d5ba113bb2cd839ea38768785e527fbbc9636e41) by [@passy](https://github.com/passy))
- Switch MainActivity launchMode to singleTask ([7a42596438](https://github.com/facebook/react-native/commit/7a42596438018129d52ff04899ab4ddabd27cdcb) by [@dulmandakh](https://github.com/dulmandakh))
- Changing method signatures for ImageLoaderModule to accept double for requestId ([641e9657dd](https://github.com/facebook/react-native/commit/641e9657ddab5d1b2676e98d86fd369372281d2c) by [@ejanzer](https://github.com/ejanzer))
- Use Node's module resolution algorithm to find JSC & Hermes ([fc25f288fe](https://github.com/facebook/react-native/commit/fc25f288fe553cb7e8f04b8ce4b56297b7fa40d5) by [@ide](https://github.com/ide))
- Add `ACCESS_BACKGROUND_LOCATION` to PermissionsAndroid ([8c099b5f53](https://github.com/facebook/react-native/commit/8c099b5f53405fe0806113ca7ccf0bbe1af92a21) by [@dulmandakh](https://github.com/dulmandakh))

#### iOS specific

- Add `xcscheme` files for iOS template back in. ([a715decd2d](https://github.com/facebook/react-native/commit/a715decd2d3bcdab9537f3246c8398ad9869e94e) by [@pvinis](https://github.com/pvinis))

### Deprecated

- Add deprecation warning to `AccessibilityInfo.fetch` ([523ab83338](https://github.com/facebook/react-native/commit/523ab8333800afbfb169c6fd70ab6611fe07cc2a) by [@TheSavior](https://github.com/TheSavior))
- Make setting `useNativeDriver` required. Add runtime warning if not specified ([5876052615](https://github.com/facebook/react-native/commit/5876052615f4858ed5fc32fa3da9b64695974238) by [@TheSavior](https://github.com/TheSavior))
- Refs on an Animated component are now the internal component. The `getNode` call has been deprecated. ([66e72bb4e0](https://github.com/facebook/react-native/commit/66e72bb4e00aafbcb9f450ed5db261d98f99f82a) by [@yungsters](https://github.com/yungsters))

#### iOS specific

- Deprecate `[bridge reload]`, prefer `RCTReloadCommand` ([ffe2306164](https://github.com/facebook/react-native/commit/ffe2306164ed7edfe5ab9d75b5122791037a852a) by [@PeteTheHeat](https://github.com/PeteTheHeat))

#### Android specific

- Deprecate `CallerContext` from `ReactImageManager` ([8accd77c45](https://github.com/facebook/react-native/commit/8accd77c45a4b051bf02904c3485d6a0dcd27631) by [@mdvacca](https://github.com/mdvacca))

### Removed

- Removing experimental `IncrementalPresenter` component ([0ef0d3167e](https://github.com/facebook/react-native/commit/0ef0d3167e291f31ce01ceb729df77cc679d2330) by [@TheSavior](https://github.com/TheSavior))
- TouchableWithoutFeedback no longer exports Props. Use React.ElementConfig, instead. ([7bcae81299](https://github.com/facebook/react-native/commit/7bcae812997f669de5803cc781dcf3ea65baf0e9) by [@yungsters](https://github.com/yungsters))
- Remove `Sample` and `CrashyCrash` Modules ([8ec7e0966c](https://github.com/facebook/react-native/commit/8ec7e0966cf83ed29a39aab47c686bc60a124983) by [@RSNara](https://github.com/RSNara))
- Remove `propTypes` from Animated components. ([86d90c03eb](https://github.com/facebook/react-native/commit/86d90c03ebe39ebc4b2c6dcc0747b4f3a34f5f2f) by [@yungsters](https://github.com/yungsters))
- Remove `propTypes` from TouchableHighlight. ([7c01172bef](https://github.com/facebook/react-native/commit/7c01172befd07f1d082b18993b87fc880e4b718f) by [@yungsters](https://github.com/yungsters))
- Remove `propTypes` from TouchableNativeFeedback. ([2185dd298a](https://github.com/facebook/react-native/commit/2185dd298a788c2b713ea17878fd36e06205b4da) by [@yungsters](https://github.com/yungsters))
- Remove `propTypes` from TouchableOpacity. ([88ae24f719](https://github.com/facebook/react-native/commit/88ae24f719d365b004696aff6461535188ca9f41) by [@yungsters](https://github.com/yungsters))
- Remove `propTypes` from TouchableWithoutFeedback. ([ebf7d75816](https://github.com/facebook/react-native/commit/ebf7d758164873169937321a4dccc3782359a0d3) by [@yungsters](https://github.com/yungsters))
- Remove `__skipSetNativeProps_FOR_TESTS_ONLY` from Animated components. ([dcd63078bd](https://github.com/facebook/react-native/commit/dcd63078bdab864830168005b940f638f1e08b23) by [@yungsters](https://github.com/yungsters))
- Remove Apple TV Props ([548aad4ff1](https://github.com/facebook/react-native/commit/548aad4ff1dfef0d71bdd39aa83ad71e522a2546) by [@yungsters](https://github.com/yungsters))

#### Android specific

- Remove `NativeRunnableDeprecated` ([973253af8a](https://github.com/facebook/react-native/commit/973253af8a47d9ebd137f554054e7a95f8ef2e45) by [@passy](https://github.com/passy))
- Remove `com.facebook.react.modules.debug.NativeSourceCodeSpec` ([4d9e5f8481](https://github.com/facebook/react-native/commit/4d9e5f8481531000380cf4d3d485fcde1321a37b) by [@RSNara](https://github.com/RSNara))

### Fixed

- Fix `require` cycle warning in ScrollResponder. ([674ac69cee](https://github.com/facebook/react-native/commit/674ac69cee7c1ce6096bee258880e79966322ee0) by [@Naturalclar](https://github.com/Naturalclar))
- Restore behavior for `underlayColor={null}` in `TouchableHighlight`. ([37d8440a8e](https://github.com/facebook/react-native/commit/37d8440a8e35a53b81914e429502db527790b3cd) by [@yungsters](https://github.com/yungsters))
- Fix stack traces showing the wrong function name in some cases ([60b4ba16c0](https://github.com/facebook/react-native/commit/60b4ba16c008c23959ebd27ea7215f83878d1343) by [@motiz88](https://github.com/motiz88))
- Fix `requestAnimationFrame` when focusing input on mount ([5798cf2aa9](https://github.com/facebook/react-native/commit/5798cf2aa9b86bbcb40016aae14eca88fca19fde) by [@janicduplessis](https://github.com/janicduplessis))
- Reduce overhead of setting up timers in DEV ([75a154b449](https://github.com/facebook/react-native/commit/75a154b4499e44b4ab31ccf28f9eb1dbf21578ac) by [@motiz88](https://github.com/motiz88))
- Fixed an issue where margin and padding were resolved incorrectly. ([1d683faf1d](https://github.com/facebook/react-native/commit/1d683faf1dc89e4950e7e1f5c5a67f9a7ca1ee24) by [@SidharthGuglani](https://github.com/SidharthGuglani))
- Fix using width for calculating margin top percent ([0599af2282](https://github.com/facebook/react-native/commit/0599af2282ffbf636604bce1cb4c049201fed393) by [@SidharthGuglani](https://github.com/SidharthGuglani))
- Don't restore default values in NativeAnimated when components unmount ([686ab49107](https://github.com/facebook/react-native/commit/686ab49107df8ed20d4e810f1366715cd70b4a31) by [@janicduplessis](https://github.com/janicduplessis))
- Fix eslint-config peer dependency warnings ([1353da5a53](https://github.com/facebook/react-native/commit/1353da5a538d4a6f76fc9530711394cf981034a0) by [@friederbluemle](https://github.com/friederbluemle))
- Remove style rules from eslint config for prettier options ([e4b62bb139](https://github.com/facebook/react-native/commit/e4b62bb139c258b65a9ebf2a8ee692ea52c3afab) by [@iRoachie](https://github.com/iRoachie))
- Fix separators displays in wrong places with the inverted list ([dfb4f4af68](https://github.com/facebook/react-native/commit/dfb4f4af68726d2e05f63689a9c74c9bb9a0611b) by [@dy93](https://github.com/dy93))
- Fix issue where we attempt to connect to React devtools every 2 seconds ([e7f6210d5d](https://github.com/facebook/react-native/commit/e7f6210d5d417c5b6d4ba7f5cf96b40dbf70b9cd) by [@ejanzer](https://github.com/ejanzer))
- Fix so that early logs don't get dropped by Metro ([4ed05ca241](https://github.com/facebook/react-native/commit/4ed05ca241b791ad629fd154429a4a53c7731556) by [@gaearon](https://github.com/gaearon))
- Fix to announce accessibility state changes happening in the background ([baa66f63d8](https://github.com/facebook/react-native/commit/baa66f63d8af2b772dea8ff8eda50eba264c3faf) by [@xuelgong](https://github.com/xuelgong))
- Fix `JSBigString` not compiling on Windows due to Unix-specific headers ([80857f295c](https://github.com/facebook/react-native/commit/80857f295c17e5f8966b3d1c1207d3c4570a1b26) by [@empyrical](https://github.com/empyrical))
- Fix exception in `scrollResponderScrollNativeHandleToKeyboard` when ref is null ([da8ae011bb](https://github.com/facebook/react-native/commit/da8ae011bbabc8acb7ef7f6903f68dd60aaa1f9d) by [@TheSavior](https://github.com/TheSavior))
- Fix excessive toggles on the Switch component ([b782934f3f](https://github.com/facebook/react-native/commit/b782934f3f2a80ae7e3872cc7d7a610aa6680ec4) by [@rurikoaraki](https://github.com/rurikoaraki))
- Fix bare hosts in `URL`. Add missing / between url ([20ab946f34](https://github.com/facebook/react-native/commit/20ab946f34b1d9727ff08c733b2006e84fd79349) by [@jeswinsimon](https://github.com/jeswinsimon))
- Fix the non-standard usage of `ATOMIC_VAR_INIT` macro from code with systrace enabled ([75a7a52db4](https://github.com/facebook/react-native/commit/75a7a52db496bd3892a367372eea25bf50840fc3))
- Fix `useWindowDimensions` hook firing continuously after dimensions change ([3b3c95b017](https://github.com/facebook/react-native/commit/3b3c95b0170e60983eb6e89b910d100d08eee141) by [@dulmandakh](https://github.com/dulmandakh))
- Fix throttling in ScrollView ([4159e20146](https://github.com/facebook/react-native/commit/4159e201462c346c456de1fa869d88a9cce7b6d4) by [@sammy-SC](https://github.com/sammy-SC))
- Fix `TimingAnimation` rounding error issue ([77b6e26538](https://github.com/facebook/react-native/commit/77b6e2653835af61b186903eae45d67f35351ade) by [@MartinSherburn](https://github.com/MartinSherburn))
- Fix recycling of Switch ([a261e6dfb2](https://github.com/facebook/react-native/commit/a261e6dfb2680a955943db53c4b0a7bb887bfe22) by [@sammy-SC](https://github.com/sammy-SC))

#### Android specific

- Fix to reset sMatrixDecompositionContext before applying transformations ([bf01dfbc97](https://github.com/facebook/react-native/commit/bf01dfbc97ea8be9d88214ab31809f2f42d6c064) by [@makovkastar](https://github.com/makovkastar))
- Fix animations in OSS debug builds by modifying `Platform.isTesting()` behavior ([1fbc6a7c17](https://github.com/facebook/react-native/commit/1fbc6a7c178d13421b0b84d6ea01f9174105325f) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Fix Modal not disappearing when reloading ([5ddf00ee1a](https://github.com/facebook/react-native/commit/5ddf00ee1acbf66c7204227c398a58c13e4545cf) by [@sunnylqm](https://github.com/sunnylqm))
- Fix to support nullable returns NativeModule methods returning Boxed Primitives ([f57b0caaa4](https://github.com/facebook/react-native/commit/f57b0caaa4452c64006c159cd28a1a562b332c21) by [@RSNara](https://github.com/RSNara))
- Fix crash in TextInput ([6ebd3b046e](https://github.com/facebook/react-native/commit/6ebd3b046e5b71130281f1a7dbe7220eff95d74a) by [@MarcoPolo](https://github.com/MarcoPolo))
- Fix View.getGlobalVisibleRect() to clip result rect properly when overflow is 'hidden' ([df9abf7983](https://github.com/facebook/react-native/commit/df9abf798351c43253c449fe2c83c2cca0479d80) by [@davidbiedenbach](https://github.com/davidbiedenbach))
- Fix throwing "Unknown array type" exception ([4b9350061f](https://github.com/facebook/react-native/commit/4b9350061fa3d186fdd3a973e1b46f60a7ac03b9) by [@petterh](https://github.com/petterh))
- Fix issue with refresh control not working properly on an inverted ScrollView ([0a282c42b4](https://github.com/facebook/react-native/commit/0a282c42b4d1c2316513cd5588a0a92b54db2991) by [@migbot](https://github.com/migbot))
- Fix to listen to NFC actions for linking url events ([8d8c3d4e1e](https://github.com/facebook/react-native/commit/8d8c3d4e1eb88366074e87385c4d96a46dfdd544) by [@cimitan](https://github.com/cimitan))
- Fix onPress prop for Touchable Components being called twice on AndroidTV. ([21890e964d](https://github.com/facebook/react-native/commit/21890e964df7674fcf13cefc8cb939441f6eddef) by [@dbarr33](https://github.com/dbarr33))
- Fix `includeFontPadding` for `TextInput` placeholder ([211ea485cd](https://github.com/facebook/react-native/commit/211ea485cd993ca25d6640be41e54f327ca1629c) by [@janicduplessis](https://github.com/janicduplessis))
- Fix medium font weights for TextInput on Android ([8b9f790069](https://github.com/facebook/react-native/commit/8b9f7900697b2e4bb72b37ed2e6c3d113185d327) by [@janicduplessis](https://github.com/janicduplessis))
- Fix close button issue in KeyboardAvoidingView ([f1c6029e48](https://github.com/facebook/react-native/commit/f1c6029e4868084e5a10d81c15ee3cc5e301599a) by [@saxenanickk](https://github.com/saxenanickk))
- Fix activity recreation on theme change ([83a16b16c9](https://github.com/facebook/react-native/commit/83a16b16c9afa0fe0328ab818470d4fce098876b) by [@Esemesek](https://github.com/Esemesek))
- Fix ForwardingCookieHandler missing WebView exceptions. ([314eba98b2](https://github.com/facebook/react-native/commit/314eba98b2f2755cb26ed7a268d3fe83a7626efa) by [@siddhantsoni](https://github.com/siddhantsoni))
- Fix ReactInstanceManagerBuilder.build crashing if SoLoader has not been explicitly initialized ([60e00d9d96](https://github.com/facebook/react-native/commit/60e00d9d96d7b186c1d4c1542caddc1b74eeb3da) by [@petterh](https://github.com/petterh))
- Fix default accessibility hint not being read. ([f8dff0bcb3](https://github.com/facebook/react-native/commit/f8dff0bcb3147b7a1aa8ac7159952d848e198e29))
- Fix JS bundle loading progress bar ([7b9d6d19e2](https://github.com/facebook/react-native/commit/7b9d6d19e2c0854aa53587ef68ce715fb7803e2a) by [@makovkastar](https://github.com/makovkastar))
- Fix Android Q related NaN error - don't try to do math with NaN values ([db5994980d](https://github.com/facebook/react-native/commit/db5994980df136c5cce6cd90348b4bf18180562f))
- Fix throwing exceptions when the host activity is not FragmentActivity ([7cfabf42b8](https://github.com/facebook/react-native/commit/7cfabf42b816de758d8e52896bbab0c50e3a802a) by [@mganandraj](https://github.com/mganandraj))
- Fix crash when using `TextInput.FontVariant` prop in Android API level < 26 ([e885ddedb9](https://github.com/facebook/react-native/commit/e885ddedb9b0a025cb8031414dcc4bd22744a0eb) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- Fix support for `onRequestClose` in Modal on iOS 13+ ([8e5fac89bb](https://github.com/facebook/react-native/commit/8e5fac89bbdcc3028bb5d81a358969a235abf991) by [@koke](https://github.com/koke))
- Fix `Dimensions` module to update on initial split screen ([7a72c35a20](https://github.com/facebook/react-native/commit/7a72c35a20a18c19bf6ab883cb2c53a85bd4c5c0) by [@sahrens](https://github.com/sahrens))
- Fix spinner visibility on `beginRefreshingProgrammatically` ([e341489521](https://github.com/facebook/react-native/commit/e341489521ad495e68e8aba01ff4dd25a5e4ff3e) by [@nnabinh](https://github.com/nnabinh))
- Reconnect to debugger websocket after Metro is restarted. ([13992f90e4](https://github.com/facebook/react-native/commit/13992f90e48fc11e0b7217ee6d9413f97c32268a) by [@rickhanlonii](https://github.com/rickhanlonii))
- Fix Slider not disabling properly if the disabled prop is set. ([fa9ff07017](https://github.com/facebook/react-native/commit/fa9ff07017edbc76595fe2f2d964ee13c5f4088a))
- Fix apps crashing on iOS 13.x when running timer in the background ([e1d03b4cc0](https://github.com/facebook/react-native/commit/e1d03b4cc00c361e10687eb4a9f902563cd1cbe1) by [@radko93](https://github.com/radko93))
- Fix TextInput blur when tabbing in iOS simulator. ([a7437710d2](https://github.com/facebook/react-native/commit/a7437710d25adfc9150fc079e4525ed59d5404e2) by [@fat](https://github.com/fat))
- Fix promised returned by `Share.share(content, options)` not resolving if share dialog dismissed ([7468a6c903](https://github.com/facebook/react-native/commit/7468a6c9033ffe8cc2315a3de3a759b8745fe43d) by [@v-fernandez](https://github.com/v-fernandez))
- Fix maximum searching depth while measuring layout by removing it. ([2f8328dbb0](https://github.com/facebook/react-native/commit/2f8328dbb0d9813c904c0b888b2b7500cf4a4bce) by [@draws](https://github.com/dratwas))
- Fix SafeAreaInsets call to not crash on older versions of iOS ([03acf57b76](https://github.com/facebook/react-native/commit/03acf57b767553acbee4ff589055fbd239ffffbb) by [@mmmulani](https://github.com/mmmulani))
- Fix to retain `cropData` struct arg in ImageEditingManager.cropImage call ([002d3c179d](https://github.com/facebook/react-native/commit/002d3c179dd2515f0a4d894d9b7f70c4e538f728) by [@RSNara](https://github.com/RSNara)))
- Fix bug rendering nested text on iOS13 ([06599b3e59](https://github.com/facebook/react-native/commit/06599b3e594355a1d5062ede049ff3e333285516) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Fix longstanding bug where RCTNullIfNil() can return nil ([79b573511b](https://github.com/facebook/react-native/commit/79b573511bd55e6c82c0044e1930549ccfa8a923) by [@PeteTheHeat](https://github.com/PeteTheHeat))
- Fix crash in RCTScrollViewComponentView ([e7ef9921d3](https://github.com/facebook/react-native/commit/e7ef9921d3f91b02cfec4bbfd88b4968434e201c) by [@shergin](https://github.com/shergin))
- Fix how the amount of free memory is calculated to mimic the logic Apple uses. ([b53d3d80f9](https://github.com/facebook/react-native/commit/b53d3d80f991937915a87ba8515f403551de139e))
- Fix animated gifs incorrectly looping ([6f2e6f170e](https://github.com/facebook/react-native/commit/6f2e6f170e3ee785d1ba844971447ea24f91185e) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix `tintColor` in SegmentedControlIOS component ([be89e4d928](https://github.com/facebook/react-native/commit/be89e4d928a504de304f5afb19bd3cc15ae3eb7d) by [@sammy-SC](https://github.com/sammy-SC))

## v0.61.5

This is a patch release that consist of a few commits requested in the [dedicated conversation](https://github.com/react-native-community/releases/issues/151) to improve the quality of the 0.61 release. Thanks to everyone who contributed!

### Fixes

#### Android specific

- Fix bundling assets in monorepo ([a3b0804867](https://github.com/facebook/react-native/commit/a3b08048674e324dbe1f0ca816f35607e9e06a2f) by [@Esemesek](https://github.com/Esemesek))
- Fix multiple `set-cookie` not aggregated correctly in response headers ([1df8bd4932](https://github.com/facebook/react-native/commit/1df8bd4932f42958c01dccf44cee92b75a6988ed) by **Vincent Cheung**)

## v0.61.4

This is a patch release that consist of a few commits requested in the [dedicated conversation](https://github.com/react-native-community/releases/issues/150) to improve the quality of the 0.61 release. Thanks to everyone who contributed!

### Fixed

- Fix build with Hermes on Windows ([81a6b6ed3c](https://github.com/facebook/react-native/commit/81a6b6ed3c54498f6f2148c106846352405949bf) by [@B27](https://github.com/B27))
- Fix Chrome debugger showing console.logs at incorrect locations ([42ac240bce](https://github.com/facebook/react-native/commit/42ac240bceb104474494c6007df0089baec00f7a) by [@rickhanlonii](https://github.com/rickhanlonii))

#### iOS specific

- Fix bug in iOS 13 when application would be terminated immediately when in background ([d7c9173b07](https://github.com/facebook/react-native/commit/d7c9173b07171164bcadf73855454e90e07b31be) by [@radko93](https://github.com/radko93))

## v0.61.3

This is a patch release that consist of a few commits requested in the [dedicated conversation](https://github.com/react-native-community/releases/issues/148) to improve the quality of the 0.61 release. Thanks to everyone who contributed!

### Fixed

- Fix bug where ScrollView contentInset top set to undefined wouldn't default to 0 ([d576a5bcc0](https://github.com/facebook/react-native/commit/d576a5bcc0e03dd9c4ccd982f723d6e376e5b680) by [TheSavior](https://github.com/TheSavior))
- Fix TimingAnimation rounding error issue ([bfd01552af](https://github.com/facebook/react-native/commit/bfd01552af6c074a425da2e7cc1a5908faba2644) by [MartinSherburn](https://github.com/MartinSherburn))

#### iOS specific

- Fix selecting videos from library in iOS 13 ([63769518e0](https://github.com/facebook/react-native/commit/63769518e0c7db60eb39bb5f47fe24f4bc664862) by [fatalsun](https://github.com/fatalsun))
- Fix bug in iOS13 nested text rendering ([7cf43afa8d](https://github.com/facebook/react-native/commit/7cf43afa8d6a03ccb4cfdc09f81891eabe8b8b70) by [PeteTheHeat](https://github.com/PeteTheHeat))

#### Android specific

- Release underlying resources when JS instance is GC'ed on Android try ([9b2374b542](https://github.com/facebook/react-native/commit/9b2374b542f87b7baefcfb4a3eb4f57029069b57) by [janicduplessis](https://github.com/janicduplessis))

## v0.61.2

This is a patch release that consist of a few commits requested in the [dedicated conversation](https://github.com/react-native-community/releases/issues/146) to improve the quality of the 0.61 release. Thanks to everyone who contributed!

### Fixed

#### Android specific

- Fix elevation issues on Android ([8fd9ab2f54](https://github.com/facebook/react-native/pull/26682) by [@grabbou](https://github.com/grabbou))

### Added

- Use `warnOnce` for excessive number of callbacks error ([0cafa0f5d1](https://github.com/facebook/react-native/commit/0cafa0f5d1e7fa5369b765f4b97f38bf1608230a) by [@janicduplessis](https://github.com/anicduplessis))
- Include transform in OUTER_PROPS ([b94438](https://github.com/facebook/react-native/commit/b94438) by [@migbot](https://github.com/migbot))

#### iOS specific

- Better iOS13 support in `StatusBar` API ([796b3a1f88](https://github.com/facebook/react-native/commit/796b3a1f8823c87c9a066ea9c51244710dc0b9b5) by [@gaodeng](https://github.com/gaodeng))

#### Android specific

- Improve error message in NativeModuleRegistryBuilder ([113c4e229c](https://github.com/facebook/react-native/commit/113c4e229c374232c46a89afd74df7117a3447c1) by [@vonovak](https://github.com/vonovak))

## v0.61.1

This is a patch release that consist of a few commits requested in the [dedicated conversation](https://github.com/react-native-community/releases/issues/144) to improve the quality of the 0.60 release. Thanks to everyone who contributed!

### Fixed

#### iOS specific

- Fix ShareSheet crash on iOS 13 ([a4fbb8e75b](https://github.com/facebook/react-native/commit/a4fbb8e75bd9f521037926a68a8b75eaca2eca74) by [@tomtargosz](https://github.com/tomtargosz))

#### Android specific

- Allow again for injecting custom root view via ReactActivityDelegate ([9f0dede1c9](https://github.com/facebook/react-native/commit/9f0dede1c913612e1241432f4cbccdc74d23a1e4) by [@kmagiera](https://github.com/kmagiera))

## v0.61.0

This is a major release that includes the new reloading experience Fast Refresh. It also removes the React `.xcodeproj`, fixes `use_frameworks!` for CocoaPods support, adds a `useWindowDimensions` hook, and upgrades to React 16.9.

### Added

- Add Fast Refresh by default ([17f8e5810f](https://github.com/facebook/react-native/commit/17f8e5810f3260ce1b24c61665883bab8847aabe) by [@gaearon](https://github.com/gaearon))
- Add `useWindowDimensions` hook to replace most `Dimensions` usage ([103ec2f770](https://github.com/facebook/react-native/commit/103ec2f770dbb785ef4bc26f8662c74edded796a) by [@sahrens](https://github.com/sahrens))

#### Android specific

- Add exception in .gitignore for `debug.keystore` to the android template. ([d55025694b](https://github.com/facebook/react-native/commit/d55025694be8b4ee5d09c8fdc910d42a5f144883) by [@bondehagen](https://github.com/bondehagen))
- Add jitpack repository to template ([1a92cf9b2a](https://github.com/facebook/react-native/commit/1a92cf9b2afa718a81299b4be5ab6bdff16f4863) by [@iyegoroff](https://github.com/iyegoroff))

#### iOS specific

- Add RCTWeakProxy to properly deallocate RCTUIImageViewAnimated ([947e71a922](https://github.com/facebook/react-native/commit/947e71a922c0db5d3d3780d249d1a8d183534c22) by [@mmmulani](https://github.com/mmmulani))

### Changed

- Use prettyFormat for Metro logging ([abd7faf354](https://github.com/facebook/react-native/commit/abd7faf3547e165abfc52383d3709b9d4d2e9006) by [@cpojer](https://github.com/cpojer))
- Tweak messages and fix the warning condition ([2a3ac0429b](https://github.com/facebook/react-native/commit/2a3ac0429b0e4c443d185807a39b41fc5a2ab1d2) by [@gaearon](https://github.com/gaearon))
- Allow jest globals in **mocks** directories ([e78c01375a](https://github.com/facebook/react-native/commit/e78c01375aef88e0bb4029479acac9e85ecaf080) by [@artdent](https://github.com/artdent))
- Make Animation EndCallback type allow any return value ([306c8d64d9](https://github.com/facebook/react-native/commit/306c8d64d91f87b248f627333de7f24355248088) by [@draperunner](https://github.com/draperunner))
- create two layout pass reason flexLayout and flexMeasure instead of flex ([6ce985463b](https://github.com/facebook/react-native/commit/6ce985463b2724451baed8b0486b298f969e36e7) by [@SidharthGuglani](https://github.com/SidharthGuglani))
- Use shorthand for Fragment in App.js ([7cac6a4b6c](https://github.com/facebook/react-native/commit/7cac6a4b6cfa8c1b54db62f2b1510f7c52f4574d) by [@ferdicus](https://github.com/ferdicus))
- Use eslint-plugin-prettier recommended config ([d2b92fffb1](https://github.com/facebook/react-native/commit/d2b92fffb1d14dd0ec628e9dcdfd76e39f2067ff) by [@Justkant](https://github.com/Justkant))
- Support string command arguments ([0314305e12](https://github.com/facebook/react-native/commit/0314305e1202e48c74091e15da8574f1b92ce441) by [@TheSavior](https://github.com/TheSavior))
- chore: Link to CLA wiki and CLA form. ([e2d55d5c5e](https://github.com/facebook/react-native/commit/e2d55d5c5ef40ccae3220dc0e1fca7cf3592c676) by [@JustinTRoss](https://github.com/JustinTRoss))
- CLI is now ^3.0.0-alpha.1 ([5edd1c674c](https://github.com/facebook/react-native/commit/5edd1c674c911a6c59aaad8ed36ce12fa98787ff) by [@thymikee](https://github.com/thymikee))
- Flow is now v0.104.0 ([59db059dbd](https://github.com/facebook/react-native/commit/59db059dbddb8101212f3739eecf0db494cfab41) by [@mroch](https://github.com/mroch))
- React is now at 16.9 ([40e8a5f685](https://github.com/facebook/react-native/commit/40e8a5f685376300aa5365de4557cd395996b9a2), [0ccedf3964](https://github.com/facebook/react-native/commit/0ccedf3964b1ebff43e4631d1e60b3e733096e56) by [@TheSavior](https://github.com/TheSavior))
- Use Metro for auto-collapsing internal stack frames ([77125a1ac3](https://github.com/facebook/react-native/commit/77125a1ac364a6b7e2382fdc86cc19a3e2eba089) by [@motiz88](https://github.com/motiz88))
- Move React error message formatting into ExceptionsManager ([2dadb9e2b0](https://github.com/facebook/react-native/commit/2dadb9e2b0ba26223ed83a30af620ce3e62e245f) by [@motiz88](https://github.com/motiz88))
- Improve VirtualizedList error message ([bef87b648c](https://github.com/facebook/react-native/commit/bef87b648c4bed228f1c5889abe0181a271edf76) by [@vonovak](https://github.com/vonovak))

#### Android specific

- Bump Hermes to v0.2.1 ([811401bcac](https://github.com/facebook/react-native/commit/811401bcac02f3e6e154c7e0f76f9f82eeaa6959) by [@sunnylqm](https://github.com/sunnylqm))
- Use centralized package for DoNotStrip annotation ([35fc0add2d](https://github.com/facebook/react-native/commit/35fc0add2d3a278bf90257284fe23e03898008de) by [@passy](https://github.com/passy))

#### iOS specific

- Do not override ActivityIndicator color when setting its size ([14b0ed4c5d](https://github.com/facebook/react-native/commit/14b0ed4c5d872cd992f6e1ca072a2c44c8ece25f) by [@cabelitos](https://github.com/cabelitos))
- fix display problems when image fails to load ([71d7d6883c](https://github.com/facebook/react-native/commit/71d7d6883cb9a3d18666f04a444de7b4a611b304))
- Renamed yoga podspec to Yoga ([82a8080f07](https://github.com/facebook/react-native/commit/82a8080f0704e83079d0429e4e367f5131052e64) by [@axe-fb](https://github.com/axe-fb))
- Update loading pre-bundled message ([eb92f8181f](https://github.com/facebook/react-native/commit/eb92f8181f3119bbc69ff7cb5aff2e03d993b8b3) by [@rickhanlonii](https://github.com/rickhanlonii))

### Deprecated

- Deprecate method UIManagerModule.playTouchSound() ([e3ec8dbe15](https://github.com/facebook/react-native/commit/e3ec8dbe15a07e86530e1fd801c27ad8c1023b5c) by [@mdvacca](https://github.com/mdvacca))
- Deprecate UIManager.measureLayoutRelativeToParent ([e42009b784](https://github.com/facebook/react-native/commit/e42009b7849f1cfd6d6d34e28c564ec5e39680bb) by [@mdvacca](https://github.com/mdvacca))

#### Android specific

- DrawerLayoutAndroid drawerPosition now expects a string, number is deprecated ([305b0a2814](https://github.com/facebook/react-native/commit/305b0a28142414d559d2d08795a5963716dc4b0f) by [@TheSavior](https://github.com/TheSavior))

### Removed

#### Android specific

- Remove supportLibVersion variable in build.gradle ([fee7f0617e](https://github.com/facebook/react-native/commit/fee7f0617ee6e4f10edf6b8e36da6c5fb00d22ac) by [@ferdicus](https://github.com/ferdicus))

#### iOS Specific

- Remove 's.static_framework = true' requirement for podspec ([ca9e108110](https://github.com/facebook/react-native/commit/ca9e108110e4a3cc39044805f879d9a9cb637c41) by [@jtreanor](https://github.com/jtreanor))

### Fixed

- Add ErrorUtils to eslint globals ([76af5f9163](https://github.com/facebook/react-native/commit/76af5f916303d7906ea522076c965292145a1370) by [@rodineijf](https://github.com/rodineijf))
- URL: Do not prepend baseUrl if the URL is not a relative URL ([e104204ae0](https://github.com/facebook/react-native/commit/e104204ae083d31e0b9967373ce79f2f1ca8fbb6) by [@jeswinsimon](https://github.com/jeswinsimon))
- Memory Leak due to JSStringRelease not called ([b8d6ef3726](https://github.com/facebook/react-native/commit/b8d6ef372663fe6d467144abfc5d2c9352dc28d6) by [@sachinservicemax](https://github.com/sachinservicemax))
- Fixed rotateZ native animation ([f4f08d3c54](https://github.com/facebook/react-native/commit/f4f08d3c549f2af7cd04ef78fe800d3bc12af1f0) by [@Titozzz](https://github.com/Titozzz))
- Fix indentation in Gradle files ([9b0adb5ad1](https://github.com/facebook/react-native/commit/9b0adb5ad132b8ff37e707a4943411d92b4e58dc) by [@sonicdoe](https://github.com/sonicdoe))
- Fix handling of failed image downloads ([71d7d6883c](https://github.com/facebook/react-native/commit/71d7d6883cb9a3d18666f04a444de7b4a611b304) by [@sammy-SC](https://github.com/sammy-SC))
- Fix SectionList scrollToLocation and prevent regressions ([8a82503b54](https://github.com/facebook/react-native/commit/8a82503b54e3c63230a07de99ec082b2dcb54bc7) by [@vonovak](https://github.com/vonovak))
- [General][internal] Fix incorrect `module.name_mapper` in template .flowconfig ([e6b2cf0418](https://github.com/facebook/react-native/commit/e6b2cf04188fc9647bae4bef4cca5d4dde22a657) by [@MoOx](https://github.com/MoOx))
- Fall back to `JSON.stringify` in `console.log` if Symbol is unavailable ([179889704b](https://github.com/facebook/react-native/commit/179889704b6f9d56cb990d5b9bba6ee5ea2cd13f) by [@cpojer](https://github.com/cpojer))
- Pop frames correctly in console.error handler ([3eaf245540](https://github.com/facebook/react-native/commit/3eaf2455402b5ad73c8a059311f0cb213df9dd28) by [@motiz88](https://github.com/motiz88))
- Add documentation to TextInput's Flow types ([d00f0882fb](https://github.com/facebook/react-native/commit/d00f0882fbdd532f8698d2569bd771ca5843d0f5) by [@empyrical](https://github.com/empyrical))

#### Android specific

- Add missing Hermes include ([1db96a3c46](https://github.com/facebook/react-native/commit/1db96a3c469b872e851553207e5420d54afc731a) by [@janicduplessis](https://github.com/janicduplessis))
- Fix UIManager.measure to consider scale and rotation transforms ([28d50189f3](https://github.com/facebook/react-native/commit/28d50189f3350e7550bf03ea5bd1363839ee2911) by [@floriancargoet](https://github.com/floriancargoet))

#### iOS specific

- Fixed iOS packager connection ([4ab9da134c](https://github.com/facebook/react-native/commit/4ab9da134c988db832b1a2daa90ce38bf8c419eb) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fixed compatibility with CocoaPods frameworks. ([8131b7bb7b](https://github.com/facebook/react-native/commit/8131b7bb7b4794e0e7003a6e3d34e1ebe4b8b9bc) by [@jtreanor](https://github.com/jtreanor))
- Don't call sharedApplication in App Extension ([c5ea18f738](https://github.com/facebook/react-native/commit/c5ea18f7389fe821e7a9882e4b1b30b0a1b266f4) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.60.6

This is a small patch release with a commit to fix the build break in MSVC to help the users of react-native-windows. ([9833ee7bc1](https://github.com/facebook/react-native/commit/9833ee7bc19982acd6ccaf6ac222bc24a97667a8) by [@acoates-ms](https://github.com/acoates-ms))

## v0.60.5

This is a patch release that consist of a few commits requested in the [dedicated conversation](https://github.com/react-native-community/releases/issues/130) to improve the quality of the 0.60 release. Thanks to everyone who contributed!

### Added

- Added a default Prettier config for new projects ([7254bab0b3](https://github.com/facebook/react-native/commit/7254bab0b3fa129cd238783ab993fbae1102d60a) by [@jpdriver](https://github.com/jpdriver))

#### Android specific

- Add showSoftInputOnFocus to TextInput ([d88e4701fc](https://github.com/facebook/react-native/commit/d88e4701fc46b028861ddcfa3e6ffb141b3ede3d))

### Changed

- Bump CLI to ^2.6.0 ([fafe5ee072](https://github.com/facebook/react-native/commit/fafe5ee0726061e3590b91d3b5cff04e33781f87) by [@thymikee](https://github.com/thymikee))

### Fixed

- Ensure right version of Metro bundler is used ([1bb197afb1](https://github.com/facebook/react-native/commit/1bb197afb191eab134354386700053914f1ac181) by [@kelset](https://github.com/kelset))

#### Android specific

- Fix `ClassNotFound` exception in Android during Release builds ([ffdf3f22c6](https://github.com/facebook/react-native/commit/ffdf3f22c68583fe77517f78dd97bd2e97ff1b9e) by [@thecodrr](https://github.com/thecodrr))
- Remove unnecessary flag when running JS server ([a162554f5d](https://github.com/facebook/react-native/commit/a162554f5dc36fa0647b5bf52119a62bd20046e3) by [@thecodrr](https://github.com/thecodrr))
- Correctly set the border radius on android ([b432b8f13b](https://github.com/facebook/react-native/commit/b432b8f13b4871dcafd690e57d37298662712b50) by [@cabelitos](https://github.com/cabelitos))
- Fix addition of comma at the end of accessibility labels on Android. ([812abfdbba](https://github.com/facebook/react-native/commit/812abfdbba7c27978a5c2b7041fc4a900f3203ae) by [@marcmulcahy](https://github.com/marcmulcahy))

#### iOS specific

- Don't call sharedApplication in App Extension ([c5ea18f738](https://github.com/facebook/react-native/commit/c5ea18f7389fe821e7a9882e4b1b30b0a1b266f4) by [@zhongwuzw](https://github.com/zhongwuzw))
- Delete fishhook ([46bdb4161c](https://github.com/facebook/react-native/commit/46bdb4161c84b33f1d0612e9c7cdd824462a31fd) by [@mmmulani](https://github.com/mmmulani))

You can participate to the conversation for the next patch release in the dedicated [issue](https://github.com/react-native-community/react-native-releases/issues/130).

## v0.60.4

This is a patch release that contains two more Hermes related fixes, thanks to the contributors for helping improving the support!

### Fixed

#### Android specific

- Generate correct source map if hermes not enabled ([b1f81be4bc](https://github.com/facebook/react-native/commit/b1f81be4bc21eb9baa39dd7ef97709d9927ad407) by [@HazAT](https://github.com/HazAT))
- Generate source maps outside of assets/ ([60e75dc1ab](https://github.com/facebook/react-native/commit/60e75dc1ab73b2893ec2e25c0320f32b3cf12b80) by [@motiz88](https://github.com/motiz88))

You can participate to the conversation for the next patch release in the dedicated [issue](https://github.com/react-native-community/react-native-releases/issues/130).

## v0.60.3

This is a patch release that fixes the binary path to Hermes package, thanks to [@zoontek](https://github.com/zoontek)) for creating the PR!

You can participate to the conversation for the next patch release in the dedicated [issue](https://github.com/react-native-community/react-native-releases/issues/130).

## v0.60.2

This is a patch release that fixes the path to Hermes package.

You can participate to the conversation for the next patch release in the dedicated [issue](https://github.com/react-native-community/react-native-releases/issues/130).

## v0.60.1

This is a patch release that includes the Hermes JavaScript Engine announced at Chain React Conf 2019.

Check out the documentation to opt-in and give [Hermes a try](https://reactnative.dev/docs/hermes).

You can participate to the conversation for the next patch release in the dedicated [issue](https://github.com/react-native-community/react-native-releases/issues/130).

## v0.60.0

This feature release of React Native includes many milestone changes for the platform. Please refer to the [blog post](https://reactnative.dev/blog/2019/07/03/version-60) for selected details. For upgrading users, some of the progress comes with breaking changes; manual intervention may be required for your app. We're also aware that existing CocoaPods integrations using `use_frameworks` are not out-of-the-box compatible with this version, but please consider [various workarounds](https://github.com/facebook/react-native/issues/25349) while we prepare a long-term solution for a future release. If you're interested in helping evaluate our next release (0.61), subscribe to the dedicated issue [here](https://github.com/react-native-community/react-native-releases/issues/130).

Have you ever considered contributing to React Native itself? Be sure to check out [Contributing to React Native](https://github.com/facebook/react-native/blob/master/CONTRIBUTING.md).

### Added

- CLI autolinking support ([5954880875](https://github.com/facebook/react-native/commit/5954880875d8dfb9b7868aa316647f8fe2b3d8c3), [da7d3dfc7d](https://github.com/facebook/react-native/commit/da7d3dfc7d3bd83e7522175a720b30fee4c9b3d3) by [@zhongwuzw](https://github.com/zhongwuzw) and [@hramos](https://github.com/hramos))
- New Intro screen ([6b393b27e1](https://github.com/facebook/react-native/commit/6b393b27e18e663d39b66fd121ee302bce29d77d), [233fddbe01](https://github.com/facebook/react-native/commit/233fddbe012098dce3719ba066d3dc653e05e6c9), [fe88e9e48c](https://github.com/facebook/react-native/commit/fe88e9e48ce99cb8b9da913051cc36575310018b), [aa926e349b](https://github.com/facebook/react-native/commit/aa926e349b1656b02b8c1a2048cc56b25f9567c1), [a9e8a71e53](https://github.com/facebook/react-native/commit/a9e8a71e531510baf126780cecdcbc64c934f4dd), [ad4a5d9a3e](https://github.com/facebook/react-native/commit/ad4a5d9a3eac9794038e93158d45e7f1ceb9e495), and [0245fd713e](https://github.com/facebook/react-native/commit/0245fd713ea9ff6fe334980f537e2254a9e3126c) by [@cpojer](https://github.com/cpojer), [@eliperkins](https://github.com/eliperkins), [@lucasbento](https://github.com/lucasbento), [@orta](https://github.com/orta), [@adamshurson](https://github.com/adamshurson), [@karanpratapsingh](https://github.com/karanpratapsingh) and [@glauberfc](https://github.com/glauberfc))
- Add enhanced accessibility actions support ([7fb02bd908](https://github.com/facebook/react-native/commit/7fb02bd90884f0a717e8151d4d30767fe38392c1) by [@xuelgong](https://github.com/xuelgong))
- Add additional accessibility roles and states ([1aeac1c625](https://github.com/facebook/react-native/commit/1aeac1c62528004d994200664368dc85fba1795d))
- Add `isReduceMotionEnabled()` plus `reduceMotionChanged` to `AccessibilityInfo` ([0090ab32c2](https://github.com/facebook/react-native/commit/0090ab32c2aeffed76ff58931930fe40a45e6ebc) by [@estevaolucas](https://github.com/estevaolucas)])
- Add support for cancelling fetch requests with `AbortController` ([h5e36b0c](https://github.com/facebook/react-native/commit/5e36b0c6eb2494cefd11907673aa018831526750) by [@janicduplessis](https://github.com/janicduplessis))

#### Android specific

- Enable views to be nested within **Text**; this brings feature parity to Android, but be aware that it [has some limitations](https://github.com/facebook/react-native/commit/a2a03bc68ba062a96a6971d3791d291f49794dfd) ([5c399a9f74](https://github.com/facebook/react-native/commit/5c399a9f74f22c58c11f75abde32ac7dc269ccc0) by [@rigdern](https://github.com/rigdern))
- Add a `touchSoundDisabled` prop to **Button**, **Touchable**, and **TouchableWithoutFeedback** ([45e77c8324](https://github.com/facebook/react-native/commit/45e77c8324f7dc2d53109e45a4e0b18cbab6a877) by [@yurykorzun](https://github.com/yurykorzun))

#### iOS specific

- Add `announceForAccessibility` and `announcementFinished` APIs for making screen reader announcements ([cfe003238a](https://github.com/facebook/react-native/commit/cfe003238ab8c5686d185f6ce9e0776eeb4bb729) by [@rigdern](https://github.com/rigdern))
- Ability to force network requests to use WiFi using the `allowsCellularAccess` property. This can ensure that network requests are sent over WiFi if communicating with a local hardware device and is accomplished by setting a flag. Default behavior of allowing network connections over cellular networks when available is unchanged. ([01c70f2fb9](https://github.com/facebook/react-native/commit/01c70f2fb9e8ac78a4d0cbd016d4de47316fe4d1) and [916186a7e6](https://github.com/facebook/react-native/commit/916186a7e6c43b1a1c68652ab82862bcd8fb1e01) by [@bondparkerbond](https://github.com/bondparkerbond)and [@zhongwuzw](https://github.com/zhongwuzw))
- `$RN_CACHE_DIR` can now be used to manually specify the iOS build cache directory ([845eee403e](https://github.com/facebook/react-native/commit/845eee403e1cd3cb36935ef142f411f2b5075346) by [@hramos](https://github.com/hramos))

### Changed

- _BREAKING_ Migrated to AndroidX; please see [this thread](https://github.com/react-native-community/discussions-and-proposals/issues/129#issuecomment-503829184) for more details on this change
- Cleanup **RedBox** message and stack output; it's now far easier to understand ([49d26eb0c4](https://github.com/facebook/react-native/commit/49d26eb0c4aeb611c6cb37a568708afa67b48c18) by [@thymikee](https://github.com/thymikee))
- Add default `scrollEventThrottle` value to **Animated.FlatList** and **Animated.SectionList**; this now behaves consistently with **Animated.ScrollView** ([933e65e245](https://github.com/facebook/react-native/commit/933e65e245b30f7dc5a26aa51881153fb7c3628e) by [@janicduplessis](https://github.com/janicduplessis))
- Remove invariant on nested sibling **VirtualizedLists** without unique listKey props; they now trigger a **RedBox** ([af5633bcba](https://github.com/facebook/react-native/commit/af5633bcba224f71f035ba4214a93b69723c9b93))
- **FlatList** and **VirtualizedList**'s default `keyExtractor` now checks `item.id` and `item.key` ([de0d7cfb79](https://github.com/facebook/react-native/commit/de0d7cfb79c7f4011d4b6748b1afc656d33fd5ac) by [@sahrens](https://github.com/sahrens))
- **SectionList**'s `scrollToLocation` on iOS now counts `itemIndex` like Android; both platforms are now consistent, and the `itemIndex` value 0 now represents scrolling to the first heading ([248a108abf](https://github.com/facebook/react-native/commit/248a108abf206b7ae32208537f0b73a8192a4829) by [@vonovak](https://github.com/vonovak))
- Slightly speedup core initialization by moving native version check to DEV only ([5bb2277245](https://github.com/facebook/react-native/commit/5bb22772452e49dbcfbf183f6ebeee4576e67947) by [@mmmulani](https://github.com/mmmulani))
- `react` is now at v16.8.6 ([53cec2dc1f](https://github.com/facebook/react-native/commit/53cec2dc1f1f5d143d0bb9752629b72350ebd112), [ee681b72ce](https://github.com/facebook/react-native/commit/ee681b72ce89539e5764ed59e5dfea4fab04d48c), and [6001acb319](https://github.com/facebook/react-native/commit/6001acb319958242f8d8e2dd40cb91a55b5eab2e) by [@kelset](https://github.com/kelset), [@mdvacca](https://github.com/mdvacca), [@gaearon](https://github.com/gaearon))
- `react-native-community/cli` is now at v2.0.0 (by [@thymikee](https://github.com/thymikee))
- `flow` is now at v0.98 ([0e1dfd4369](https://github.com/facebook/react-native/commit/0e1dfd436917a78a09da7b57a0b50397e6a0b6e1) by [@nmote](https://github.com/nmote))
- `prettier` is now at v1.17.0 ([ff9f8f347d](https://github.com/facebook/react-native/commit/ff9f8f347d71630664dc3da1e8be0425799c0ce0))
- `metro` packages are now at v0.54.1 ([7ff3874ec0](https://github.com/facebook/react-native/commit/7ff3874ec060bce568537a2238aea2c888e6e13f), [343f0a1d50](https://github.com/facebook/react-native/commit/343f0a1d50662aa37ef0b26d5436b2a0b40fbabb) by [@motiz88](https://github.com/motiz88))
- Replace patched fetch polyfill with `whatwg-fetch@3.0` ([bccc92dfdd](https://github.com/facebook/react-native/commit/bccc92dfdd2d85933f2a9cb5c8d1773affb7acba) by [@janicduplessis](https://github.com/janicduplessis))

#### Android specific

- Use class canonical name for `PARTIAL_WAKE_LOCK` tag ([88dbb4558c](https://github.com/facebook/react-native/commit/88dbb4558cd10f129f2c31e3b0b872924aba5416) by [@timwangdev](https://github.com/timwangdev))

#### iOS specific

- _BREAKING_: Split React.podspec into separate podspecs for each Xcode project; your libraries will need to update for this change as well to avoid CocoaPods build errors ([2321b3fd7f](https://github.com/facebook/react-native/commit/2321b3fd7f666ce30f5dad4cd2673ddf22972056) by [@fson](https://github.com/fson))
- Improve handling of native module exceptions; they are now propagated to crash reporting tools with the context and callstack ([629708beda](https://github.com/facebook/react-native/commit/629708bedae65a30e39d234da6b04d6fa101a779) by [@pvinis](https://github.com/pvinis))
- Switch **Slider** `onSlidingComplete` event to a non-bubbling event on iOS to match Android ([7927437a6d](https://github.com/facebook/react-native/commit/7927437a6d5d63de2424d43d58085291c1067091) by [@rickhanlonii](https://github.com/rickhanlonii))

### Deprecated

- **StatusBar** is no longer deprecated; thank you for the feedback ([a203ebe206](https://github.com/facebook/react-native/commit/a203ebe2062b3c12f85783f46030971f3aa5db1d) by [@cpojer](https://github.com/cpojer))

### Removed

- **NetInfo** has been removed; its replacement is now available via the [react-native-community/netinfo](https://github.com/react-native-community/react-native-netinfo) package ([5a30c2a205](https://github.com/facebook/react-native/commit/5a30c2a2052ba76e88dbf71b5b5c92966591bf26) by [@cpojer](https://github.com/cpojer))
- **WebView** has been removed; its replacement is now available via the [react-native-community/webview](https://github.com/react-native-community/react-native-webview) package ([](https://github.com/facebook/react-native/commit/6ca438a7f4bd7e6b317f0461aebbd5a7186151ed), [1ca9a95537](https://github.com/facebook/react-native/commit/1ca9a9553763a89c977f756b45486f8b9cedab80), and [954f715b25](https://github.com/facebook/react-native/commit/954f715b25d3c47c35b5a23ae23770a93bc58cee) by [@cpojer](https://github.com/cpojer) and [@thorbenprimke](https://github.com/thorbenprimke))
- **Geolocation** has been removed; its replacement is now available via the [react-native-community/geolocation](https://github.com/react-native-community/react-native-geolocation) package ([17dbf98884](https://github.com/facebook/react-native/commit/17dbf988845bb7815dbb6182218c8c28d027fb91) and [9834c580af](https://github.com/facebook/react-native/commit/9834c580af654366bf0d38b78cd2694b0a0c477f) by [@cpojer](https://github.com/cpojer) and [@mmmulani](https://github.com/mmmulani))

### Fixed

- Fix `Animated.Value` value after animation if component was re-mounted ([b3f7d53b87](https://github.com/facebook/react-native/commit/b3f7d53b87413abdf302c521114e4d77aa92e07f) by [@michalchudziak](https://github.com/michalchudziak))
- Consistent reporting native module name on crash on native side ([fdd8fadea8](https://github.com/facebook/react-native/commit/fdd8fadea84f475714a16b6f0ec433f898d09558) and [b79d7db9db](https://github.com/facebook/react-native/commit/b79d7db9dbf588085b29274e507d34438e2e2595) by [@DimitryDushkin](https://github.com/DimitryDushkin))
- Handle null filenames in symbolicated stack trace gracefully in **ExceptionsManager** ([2e8d39bed7](https://github.com/facebook/react-native/commit/2e8d39bed70e2e5eeddeb2dc98155bf70f9abebd) by [@motiz88](https://github.com/motiz88))
- Fix HasteImpl platform name regex ([28e0de070d](https://github.com/facebook/react-native/commit/28e0de070d2dae9a486ab5915b6fd76723bd84ef) by [@CaptainNic](https://github.com/CaptainNic))
- Fix a JS memory leak in Blob handling; this resolves multiple leaks around `fetch` ([05baf62721](https://github.com/facebook/react-native/commit/05baf6272143667694585a14fb59657fdc93c3b1) and [9ef5107d04](https://github.com/facebook/react-native/commit/9ef5107d04da374fc566d8b296572ddd992419f0) by [@janicduplessis](https://github.com/janicduplessis))
- **SectionList**'s `scrollToLocation` now scrolls to the top of the sticky header as expected ([d376a444e3](https://github.com/facebook/react-native/commit/d376a444e318beabd8ebe9ccb41ffc300e12ea76) by [@danilobuerger](https://github.com/danilobuerger))

#### Android specific

- Fix duplicate resource error in Android build ([962437fafd](https://github.com/facebook/react-native/commit/962437fafd02c936754d1e992479056577cafd05) and [eb534bca58](https://github.com/facebook/react-native/commit/eb534bca58a89ae306010626a8bdae92c23b8784) by [@mikehardy](https://github.com/mikehardy) and [@Dbroqua](https://github.com/Dbroqua))
- Reorder operations of native view hierarchy ([5f027ec64d](https://github.com/facebook/react-native/commit/5f027ec64d6764fbbb9813fabb373194dec79db7) by [@lunaleaps](https://github.com/lunaleaps))
- Fix performance regression from new custom fonts implementation ([fd6386a07e](https://github.com/facebook/react-native/commit/fd6386a07eb75a8ec16b1384a3e5827dea520b64) by [@dulmandakh](https://github.com/dulmandakh))
- Fix internal test case around disabled state of buttons ([70e2ab2ec9](https://github.com/facebook/react-native/commit/70e2ab2ec9a1df60b39987946af18cac8621b3b0))
- Fix extra call of **PickerAndroid**'s `onValueChange` on initialization; now it is only called when `selectedValue` changes ([82148da667](https://github.com/facebook/react-native/commit/82148da6672e613f34ffb48133cdefc235418dea) by [@a-c-sreedhar-reddy](https://github.com/a-c-sreedhar-reddy))
- Fix **PickerAndroid** will reset selected value during items update ([310cc38a5a](https://github.com/facebook/react-native/commit/310cc38a5acb79ba0f1cda22913bd1d0cb296034) by [@Kudo](https://github.com/Kudo))
- Fix unexpected PARTIAL_WAKE_LOCK when no headless tasks registered. ([bdb1d4377e](https://github.com/facebook/react-native/commit/bdb1d4377e47c6cd49ff619134d4860519a3cb0c) by [@timwangdev](https://github.com/timwangdev))
- Fix calling **TextInput**'s `onKeyPress` method when the user types an emoji ([a5c57b4ed4](https://github.com/facebook/react-native/commit/a5c57b4ed4965ac4bb231399fd145da8095cece3))
- Fix value of **TextInput**'s `onSelectionChange` start and end arguments by normalizing them ([2ad3bb2e2d](https://github.com/facebook/react-native/commit/2ad3bb2e2d62ffb780bab020f645626a16dd3b4a) by [@uqmessias](https://github.com/uqmessias))
- In `Linking.getInitialURL` method, use the `InteractionManager` to wait for the current activity to finish initializing ([c802d0b757](https://github.com/facebook/react-native/commit/c802d0b757912358d703d4d8a114073377a905b9) by [@mu29](https://github.com/mu29))
- Disable delta bundles on the first app run ([e4aff423ac](https://github.com/facebook/react-native/commit/e4aff423ac0421f4af7b9a111e5ad954f489da19) by [@wojteg1337](https://github.com/wojteg1337))
- In **DatePickerAndroid**, work around Android Nougat bug displaying the wrong the spinner mode ([bb060d6cf8](https://github.com/facebook/react-native/commit/bb060d6cf89500778bba27d1da5925e2623c7a99) by [@luancurti](https://github.com/luancurti))
- Fix crash in Animated Interpolation when inputMin === inputMax ([7abfd23b90](https://github.com/facebook/react-native/commit/7abfd23b90db08b426c3c91b0cb6d01d161a9b9e) by [@olegbl](https://github.com/olegbl))
- Fix symbolication for **RedBox** and **YellowBox** when using delta bundling ([a05e9f8e09](https://github.com/facebook/react-native/commit/a05e9f8e094b25cc86ee297477cccafc3be5ef52) by [@motiz88](https://github.com/motiz88))
- Fix **CameraRoll** crash on mime type guessing ([ebeb893b50](https://github.com/facebook/react-native/commit/ebeb893b50b4aa1ad77bdb203e4f8faed75db43a) by [@Sroka](https://github.com/Sroka))

#### iOS specific

- Call designated initializer for SurfaceHostingProxyRootView ([3c125e867f](https://github.com/facebook/react-native/commit/3c125e867f52efd7f18b2bd8c9a21b246afcd788) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix **RedBox** JS symbolication when adding JS engine tag to the message ([920632cadb](https://github.com/facebook/react-native/commit/920632cadb108ceeacad93e9316e706608df2942) by [@motiz88](https://github.com/motiz88))
- Fix **TextInput**'s `onSelectionChange` behavior in single line text inputs ([0c11d8d9b4](https://github.com/facebook/react-native/commit/0c11d8d9b4edf7830255f5b016d0ba7ef72ae827) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix accessibility problem with **TextInput** Clear Button ([4e37d37cbf](https://github.com/facebook/react-native/commit/4e37d37cbff27e61659440094a662e00eafd8fc4) by [@shergin](https://github.com/shergin))
- Fix `renderingMode` not applied to GIF **Image**s ([75380aa329](https://github.com/facebook/react-native/commit/75380aa3296210777dc0be70a722701767276117) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix **ScrollView** `centerContent` not work in some cases ([2cdf9694b5](https://github.com/facebook/react-native/commit/2cdf9694b56e76477dde572eb3dc38be31361eab) by [@zhongwuzw](https://github.com/zhongwuzw))
- Fix crash on performance logger ([5d3d3987d8](https://github.com/facebook/react-native/commit/5d3d3987d8a81b84d43dc88808d7f50c7bf11d19) by [@zhigang1992](https://github.com/zhigang1992))
- Do not run packager in Release mode ([4ea6204111](https://github.com/facebook/react-native/commit/4ea62041118fb031d7540726df2d29185c6b130d) by [@lucasbento](https://github.com/lucasbento))
- Fix `code` and `reason` arguments being ignored when calling `WebSocket.close` ([0ac2171c54](https://github.com/facebook/react-native/commit/0ac2171c549b389228c4a37ae645eb0d9813b82d) by [@jeanregisser](https://github.com/jeanregisser))
- Fix return value of `Linking.openURL()` ([4a5d0bdbd7](https://github.com/facebook/react-native/commit/4a5d0bdbd75c433d2f51f160657a0ad91e440272) by [@thib92](https://github.com/thib92))
- When an accessibilityLabel can't be discerned, return `nil` instead of `@""` ([d4ff5ed258](https://github.com/facebook/react-native/commit/d4ff5ed258b75fe77c5d801af7b097b04fcd3690) by [@sammy-SC](https://github.com/sammy-SC))
- Fix Xcode build when the project's path contains whitespace ([f0770b6b37](https://github.com/facebook/react-native/commit/f0770b6b370f483fdd729bdba04069cc783353dc))
- Move accessibility props to UIView+React ([9261035c2b](https://github.com/facebook/react-native/commit/9261035c2bf2fe9522806fb1c535a1835e7acfa2) by [@janicduplessis](https://github.com/janicduplessis))
