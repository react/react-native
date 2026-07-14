# Changelog

## v0.87.0-rc.0

### Breaking

- Remove deprecated `StatusBar` `backgroundColor` / `translucent` / `networkActivityIndicatorVisible` props and `setBackgroundColor` / `setTranslucent` / `setNetworkActivityIndicatorVisible` methods ([6b45e579d6](https://github.com/react/react-native/commit/6b45e579d6c17e2ff43709812810b4a32ec81a40) by [@zoontek](https://github.com/zoontek))
- Remove deprecated boolean values support for `ScrollView` `keyboardShouldPersistTaps` ([5bf3e38db2](https://github.com/react/react-native/commit/5bf3e38db24cadfcd994c3da1a051c0bea4e7f02) by [@zoontek](https://github.com/zoontek))
- Set max font scaling in `LogBox` to avoid layout breaking ([4aef2b0126](https://github.com/react/react-native/commit/4aef2b0126c22ab386c970a84d61a9ef2c4b3ddd) by [@pchalupa](https://github.com/pchalupa))
- Remove RawPropsKey prefix and suffix ([67381e157f](https://github.com/react/react-native/commit/67381e157faadd9f18db1ff8710d8d46c3c1dae5) by [@javache](https://github.com/javache))
- Deep imports to `'react-native/src/private/...'` have been restricted, and are no longer visible to TypeScript. These subpaths still exist, but do not have type coverage. ([142b6172a9](https://github.com/react/react-native/commit/142b6172a94ea178ed8d0fd9ffb03a64c4dd9676) by [@huntie](https://github.com/huntie))
- Compile out RuntimeScheduler_Legacy under RCT_REMOVE_LEGACY_ARCH ([d205267a5f](https://github.com/react/react-native/commit/d205267a5fa96b343ef9860e9b2d209e5bc8832c) by [@christophpurrer](https://github.com/christophpurrer))
- **Strict TypeScript API**: Remove legacy `NativeMethods` and `NativeMethodsMixin` types ([b724611aec](https://github.com/react/react-native/commit/b724611aec382742ee52b8b2619eadc47bc14bc4) by [@huntie](https://github.com/huntie))
- The `NativeDialogManagerAndroid` export is removed. ([a793d21a7e](https://github.com/react/react-native/commit/a793d21a7ebdea0e5a065190497a67619bdefa89) by [@huntie](https://github.com/huntie))
- The `react-native/core-cli-utils` package is no longer published. It remains available in the React Native repo as a reference implementation. ([9c3fddf9cd](https://github.com/react/react-native/commit/9c3fddf9cd03788a57ffca0f195bb92b84fab281) by [@huntie](https://github.com/huntie))
- Remove support for connecting to the standalone `react-devtools` package via WebSocket. Use React Native DevTools instead. ([f1971caa44](https://github.com/react/react-native/commit/f1971caa447a9d8f2f6185e99ceb45d512940e86) by [@huntie](https://github.com/huntie))
- Require Node.js >= 22.13.0 ([a0d39e7a9c](https://github.com/react/react-native/commit/a0d39e7a9c26446b6fe4af4ab7be00aa1c68ddca) by [@huntie](https://github.com/huntie))
- Remove Legacy Hermes from C++ code ([f9476256bd](https://github.com/react/react-native/commit/f9476256bd1b5d56f46f79bb31a32e77e8e23fe6) by [@cipolleschi](https://github.com/cipolleschi))
- Fix return type of `useColorScheme()` hook (now  `ColorSchemeName | null`) ([ef6463c25d](https://github.com/react/react-native/commit/ef6463c25d78990386a15bb26319d1d4d224df14) by [@huntie](https://github.com/huntie))
- `useColorScheme()` no longer returns `'unspecified'` (this was always the case, but is a breaking type change) ([8ac88f481a](https://github.com/react/react-native/commit/8ac88f481a51cec28adfe985382ac7b3648921e5) by [@huntie](https://github.com/huntie))

#### Android specific

- Adopt AGP v9 ([abb071b135](https://github.com/react/react-native/commit/abb071b135200823b6794210b2696418190b2892) by [@hurali97](https://github.com/hurali97))

#### iOS specific

- Remove depracted legacy architecture protocol APIs ([ad9936faf6](https://github.com/react/react-native/commit/ad9936faf666264bb03db8c6e7499c529fff3391) by [@christophpurrer](https://github.com/christophpurrer))
- Remove unused legacy architecture RCTAppSetupUtils methods ([40b16dca9f](https://github.com/react/react-native/commit/40b16dca9fa2b553350993f2a687cd6fc7365ec5) by [@christophpurrer](https://github.com/christophpurrer))
- Remove RCTBridge Functions from RCTReactNativeFactory Header ([75eaff4c03](https://github.com/react/react-native/commit/75eaff4c033c93819164808635f2cdca77cf8a3c) by [@christophpurrer](https://github.com/christophpurrer))
- Remove unused bridge-based RCTTurboModuleManager initializer ([cb74b82309](https://github.com/react/react-native/commit/cb74b82309dd9f8e232b8e8f7ef94326e2de8e35) by [@christophpurrer](https://github.com/christophpurrer))
- RNTester / RCTReactNativeFactory remove unused new architecture flags and RCTArchConfiguratorProtocol ([2148f15db5](https://github.com/react/react-native/commit/2148f15db5a64658647748403bca319a599e7a5d) by [@christophpurrer](https://github.com/christophpurrer))
- Remove 6 empty Objective-C stub headers ([23ce90bd3b](https://github.com/react/react-native/commit/23ce90bd3bdfb3b8268466c40bab31bf7a54a8d7) by [@christophpurrer](https://github.com/christophpurrer))
- Remove legacy architecture code guarded by RCT_REMOVE_LEGACY_ARCH from RN iOS ([86350ab988](https://github.com/react/react-native/commit/86350ab988472025d60e192c54e115caf6756295) by [@christophpurrer](https://github.com/christophpurrer))
- Removing further legacy arch symbols such as RCTCxxBridge ([c65281581d](https://github.com/react/react-native/commit/c65281581dd5add76a10cc20945aa4790fb5db8c) by [@javache](https://github.com/javache))

### Added

- Introduce `react-native/asset-utils` package (relocates Android path utils for libraries/frameworks) ([41d52189e2](https://github.com/react/react-native/commit/41d52189e2167c7edc12a719150c2796b33c0ba0) by [@huntie](https://github.com/huntie))
- Add `IntBuffer` and `DoubleBuffer` entry types to MapBuffer for compact homogeneous int/double arrays ([e7cadaf9f3](https://github.com/react/react-native/commit/e7cadaf9f315d8984bdea1c7fb6da4e302952819) by [@javache](https://github.com/javache))
- Add support for `textAlign: 'start'` and `textAlign: 'end'`. ([ca29d38537](https://github.com/react/react-native/commit/ca29d385372e4b4832f45d708579029c64d50c62) by [@SJvaca30](https://github.com/SJvaca30))
- Strict TypeScript API: Component and API doc comment coverage has been significantly improved ([701de4ec3d](https://github.com/react/react-native/commit/701de4ec3d2f893c77db67e3df39ea17f6ff1c52) by [@huntie](https://github.com/huntie))
- Add `selection` to `TextInputChangeEventData` in TypeScript types ([e745c41a6b](https://github.com/react/react-native/commit/e745c41a6b173f51bb4d2fb6df2c48742a05f310) by [@nsbarsukov](https://github.com/nsbarsukov))
- **Strict TypeScript API**: Export `Animated.Numeric` ([6206b0b01f](https://github.com/react/react-native/commit/6206b0b01f358eb7fd723e6e99b75c0b1f6d6ea1) by [@huntie](https://github.com/huntie))
- Export `AccessibilityActionInfo`, `ImageResizeMode`, `EdgeInsetsProp`, and `TextInputBlurEvent` types ([ee36c67a27](https://github.com/react/react-native/commit/ee36c67a277598efa50cf208c04c53bca46c41c1) by [@huntie](https://github.com/huntie))
- Support native driven AnimatedValue interpolation easing ([57ce6bc585](https://github.com/react/react-native/commit/57ce6bc5857d3ad72de755eb612f8cfd197c22ca) by [@zeyap](https://github.com/zeyap))
- Remove `useNativeDriver` under featureflag animatedForceNativeDriver ([9cf30b6e4b](https://github.com/react/react-native/commit/9cf30b6e4bcab167e7a3de254ba3ada88ed66374) by [@zeyap](https://github.com/zeyap))
- Implement the `Page.addScriptToEvaluateOnNewDocument` and `Page.removeScriptToEvaluateOnNewDocument` CDP methods in the modern inspector ([bc20ec88eb](https://github.com/react/react-native/commit/bc20ec88ebb901f31d8f554238e97612aa04181b) by [@GijsWeterings](https://github.com/GijsWeterings))
- Remove `useNativeDriver` under featureflag animatedForceNativeDriver ([cffe14ff57](https://github.com/react/react-native/commit/cffe14ff57ce0e76601e9efde833700d6ba609af) by [@zeyap](https://github.com/zeyap))
- Add `Promise.try` + `Promise.withResolvers` typescript types ([b99ddaf606](https://github.com/react/react-native/commit/b99ddaf60661a9b308e9028412fee682e4211d8f) by [@retyui](https://github.com/retyui))
- Gate shared C++ and Android Java/Kotlin legacy view manager interop behind `RCT_REMOVE_LEGACY_COMPONENT_INTEROP` ([9885fe95ef](https://github.com/react/react-native/commit/9885fe95ef1e7fa08008434620a8c97c3c2b61da) by [@christophpurrer](https://github.com/christophpurrer))
- Text decorations honor `textDecorationStyle` (`solid`, `double`, `dotted`, `dashed`, `wavy`) ([87184c8fba](https://github.com/react/react-native/commit/87184c8fbac1b869a6dd021f1a9c7cf26dfa462c) by [@quantizor](https://github.com/quantizor))
- Gate legacy view manager interop behind `RCT_REMOVE_LEGACY_COMPONENT_INTEROP` ([8b959b46ea](https://github.com/react/react-native/commit/8b959b46ea6195ef2d0a77433d7915fc02797b11) by [@christophpurrer](https://github.com/christophpurrer))
- Add CSS Flexbox §4.5 automatic minimum sizing. Opt in by clearing the new `YGErrataMinSizeUndefinedInsteadOfAuto` errata bit on `YGConfig`. ([b766986387](https://github.com/react/react-native/commit/b766986387b0b08c8bddd5dbad4a458eb9404c61) by [@adityasharat](https://github.com/adityasharat))
- **Strict TypeScript API**: Add `*Instance` ref types for all built-in components ([a3827f32f4](https://github.com/react/react-native/commit/a3827f32f497057c6d23bd184dd8c8fd5b35a523) by [@huntie](https://github.com/huntie))
- ## Changelog: [GENERAL][ADDED] Gate legacy TurboModule interop behind `RCT_REMOVE_LEGACY_MODULE_INTEROP` ([3278f309e2](https://github.com/react/react-native/commit/3278f309e29fd957dad5f3fa029893013aa4db1c) by [@christophpurrer](https://github.com/christophpurrer))
- Add CSS Flexbox §4.5 automatic minimum sizing. Opt in by clearing the new `YGErrataMinSizeUndefinedInsteadOfAuto` errata bit on `YGConfig`. Adds `YGNodeSetMinContentWidth/Height` for static contributions and `YGMinContentMeasureFunc` for dynamic ones.' ([7f396d1116](https://github.com/react/react-native/commit/7f396d1116b4d372376439317d8f8d01452bc343) by [@adityasharat](https://github.com/adityasharat))
- StatusBar: support `barStyle="auto"` to follow the current color scheme ([61c8b040bf](https://github.com/react/react-native/commit/61c8b040bf76bd909965dfb98b2c0bd2aa8e7475) by [@zoontek](https://github.com/zoontek))
- Add TypeScript support for Error `cause` property ([abcb7821b1](https://github.com/react/react-native/commit/abcb7821b1e43ba5ff0ec92c746e6fbc4b2a10f3) by [@gimi-anders](https://github.com/gimi-anders))
- Add `Systrace.trace` helper that wraps a function with begin/end events using try/finally ([e6c7a269d2](https://github.com/react/react-native/commit/e6c7a269d2b31aea770470078ae5ae1887326c7c) by [@rubennorte](https://github.com/rubennorte))
- Add `ArrayBuffer` support to C++ TurboModules ([226ef2e7c5](https://github.com/react/react-native/commit/226ef2e7c5d1928d5696dc23efc1b8950ba00e37) by [@paradowstack](https://github.com/paradowstack))
- Add All Animated Props example to the rn-tester Animation Backend section ([e2e655385c](https://github.com/react/react-native/commit/e2e655385cfbdb08577e388f47e6f38818dc1f53) by Bartlomiej Bloniarz)
- Add Performance Test example to the rn-tester Animation Backend section ([09e55cb7c6](https://github.com/react/react-native/commit/09e55cb7c631bfa9a346c6e97047e0b5e8e13bb1) by Bartlomiej Bloniarz)
- Add `optimizedAnimatedPropUpdates` feature flag ([ed96b22af2](https://github.com/react/react-native/commit/ed96b22af2baea90b8ed418c2f30c1b0990c1845) by Bartlomiej Bloniarz)

#### Android specific

- Added an entry point that allows changing whether the scrollable React Native containers should delay pressed state in children views ([91b2537f8a](https://github.com/react/react-native/commit/91b2537f8ac5b29d022743ab7246d860343c3e81) by [@j-piasecki](https://github.com/j-piasecki))
- Add a dedicated `MapBufferList` type to `MapBuffer` for ordered lists of nested `MapBuffer`s ([6a957746f6](https://github.com/react/react-native/commit/6a957746f6a2fc280bd6b30724d4fe10b4841841) by [@javache](https://github.com/javache))
- Request `ACCESS_LOCAL_NETWORK` so the dev server stays reachable on Android 17 (SDK 37)[Android] [Added] - Add `ACCESS_LOCAL_NETWORK` to `PermissionsAndroid` ([2bc2c8d7e6](https://github.com/react/react-native/commit/2bc2c8d7e6cf2ebfd338268cd6b999974fb727e4) by [@alanjhughes](https://github.com/alanjhughes))
- Update `compileSdk` and `buildTools` to 37 ([3e8dfb1e64](https://github.com/react/react-native/commit/3e8dfb1e64e7c044e3078b6c7ab147a652abe162) by [@alanjhughes](https://github.com/alanjhughes))
- Add `ReactContext.getRuntimeExecutor()` ([dc9043e940](https://github.com/react/react-native/commit/dc9043e940c0c31a3f906e1d539d02bef54667f7) by [@javache](https://github.com/javache))
- Use software snapshot capture unless featureflag ([ba204faa75](https://github.com/react/react-native/commit/ba204faa75ab89150396f7ad69e755187ec47a58) by [@zeyap](https://github.com/zeyap))

#### iOS specific

- Add `enableIOSCompressedTextFrameAdjustment` feature flag for `Text` rendering adjustments. ([b933d45276](https://github.com/react/react-native/commit/b933d45276ed82a8c504b6c856b7dd046f95aeb6) by [@sbuggay](https://github.com/sbuggay))
- Add ArrayBuffer support to ObjC TurboModules ([54b88d9dea](https://github.com/react/react-native/commit/54b88d9dea5ddc9740327ae426dc3ab8e66f7e75) by [@paradowstack](https://github.com/paradowstack))
- Export `RCTDidInitializeModuleNotificationModuleKey` constant for `RCTDidInitializeModuleNotification` userInfo ([217ee52d4f](https://github.com/react/react-native/commit/217ee52d4f7a13af64a55ab4ff21fc7d70c23dd8) by Eapen George)
- Added comment to clarify why i18nManager.isRTL may not return the expected value ([e4a5ed3c6d](https://github.com/react/react-native/commit/e4a5ed3c6d6ad4f00652ab8202dda65f6fe40b92) by [@scarlac](https://github.com/scarlac))
- `textDecorationStyle: 'dotted'` and `'dashed'` for `<Text>` render with custom CoreGraphics paths instead of UIKit pattern bits, matching browser geometry more closely ([9d037509bf](https://github.com/react/react-native/commit/9d037509bf90acf14bcfb6accd35ed184d91ea84) by [@quantizor](https://github.com/quantizor))

### Changed

- Make the `window` global non-writable and non-configurable, and the `navigator` global non-writable ([347f8d081e](https://github.com/react/react-native/commit/347f8d081eee8792ae23d87ae04be1cfc7b3fdcb) by [@rubennorte](https://github.com/rubennorte))
- Metro to 0.86.0 ([2b0107e0aa](https://github.com/react/react-native/commit/2b0107e0aaee7d035dbad2cece6134cb2454bb37) by [@robhogan](https://github.com/robhogan))
- Change default transform profile to 'hermes-stable' ([a2cd37f828](https://github.com/react/react-native/commit/a2cd37f828ad9338eeacd69a64d90c5c512035be) by [@retyui](https://github.com/retyui))
- **React Native DevTools**: Expose new options in the app menu ([24e370096e](https://github.com/react/react-native/commit/24e370096e4ee402d4b25dd8a7c7a6778bab4a93) by [@huntie](https://github.com/huntie))
- Replace `abort-controller` with fork version from react-native ([6f3375a140](https://github.com/react/react-native/commit/6f3375a140b10cffe9bed3dd72a017ece97bbbba) by [@retyui](https://github.com/retyui))
- Fix missing VERSION_NATIVE_FB in commit artifacts ([c6f29a2173](https://github.com/react/react-native/commit/c6f29a21733377799cf8f39ec5351de941a9e58b) by [@javache](https://github.com/javache))
- **React Native DevTools**: Add macOS 26/27 app icon ([fa371d156d](https://github.com/react/react-native/commit/fa371d156db2d796a18c44624d28c397ef5837a7) by [@huntie](https://github.com/huntie))
- Enable Animated flush-queue debouncing (`animatedShouldDebounceQueueFlush`) by default ([5c197fb303](https://github.com/react/react-native/commit/5c197fb303ed0d975482757fefb7ed38349601b6) by [@zeyap](https://github.com/zeyap))
- Make `EventTarget` methods enumerable by spec ([25c25b3c7c](https://github.com/react/react-native/commit/25c25b3c7cc81c33c1c36fb371d3f94d00ff412e) by [@retyui](https://github.com/retyui))
- Speed up VirtualizedList render-mask creation for large lists by avoiding the old backward sticky-header scan when sticky headers are missing or sparse. ([fe53279889](https://github.com/react/react-native/commit/fe53279889ba1e89c99d5b888d36a4294a8abb8c) by [@tarikfp](https://github.com/tarikfp))
- Flip cxxNativeAnimatedEnabled featureflag default to true ([fc7dc741d2](https://github.com/react/react-native/commit/fc7dc741d2b9dcdc36660d100a1b4ba420f8b725) by [@zeyap](https://github.com/zeyap))
- Make `flattenStyle` avoid extra intermediate objects when flattening nested style arrays. ([d26f7b338d](https://github.com/react/react-native/commit/d26f7b338d340042a15706e5bb4febfe11cdd81f) by [@tarikfp](https://github.com/tarikfp))
- Remove `experimental_` prefix from `backgroundImage` ([58688bf176](https://github.com/react/react-native/commit/58688bf17623fa54e8c62397ecb0abd285c01a94) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- Mark parent dirty when child is freed ([4adca58f4c](https://github.com/react/react-native/commit/4adca58f4c52fabe28b6ee899d34b1aa05bd2ea3) by [@harsha-cpp](https://github.com/harsha-cpp))
- Expose `IntersectionObserverEntry` as a global ([4deb32a507](https://github.com/react/react-native/commit/4deb32a507f15b447f264b27fb1d45dd3d3dfc44) by [@rubennorte](https://github.com/rubennorte))
- The default value of the `useTurboModules` ReactNativeFeatureFlags flag is now `true` ([db4c6ee3b6](https://github.com/react/react-native/commit/db4c6ee3b6898605794aedcd33e6015e2058e997) by [@mdvacca](https://github.com/mdvacca))
- **Strict TypeScript API**: Additional component props types are now `interface` declarations, enabling module augmentation by libraries like Uniwind (preserve compatibility) ([2574863642](https://github.com/react/react-native/commit/2574863642862d507f74355fad40966a1370bf03) by [@huntie](https://github.com/huntie))
- **Strict TypeScript API**: Select component props types are now `interface` declarations, enabling module augmentation by libraries like NativeWind and Expo (preserve compatibility) ([db89600b56](https://github.com/react/react-native/commit/db89600b562dda28e9d41028b8b6e63ca94b86a0) by [@huntie](https://github.com/huntie))
- Clarify Android AppState background API documentation. ([b09fce6db5](https://github.com/react/react-native/commit/b09fce6db5ce7d025546d84b91ecf201a86a494f) by [@federicobartoli](https://github.com/federicobartoli))
- Simplified build JS Hermes infrastructure for the Release ([d49aac6b65](https://github.com/react/react-native/commit/d49aac6b652d5b19bcd044c77905cac0c917fd85) by [@cipolleschi](https://github.com/cipolleschi))
- Bump Hermes V1 to 250829098.0.13 ([0175449606](https://github.com/react/react-native/commit/01754496066fb501a450fcb599a9d2929ac37c16) by [@robhogan](https://github.com/robhogan))

#### Android specific

- Set minCompileSdk to 34, libraries will have to specify a compileSdk of >= 34 in order to work with React Native ([29e5f954c7](https://github.com/react/react-native/commit/29e5f954c70a57d2d0feaa052b698fb95915a0a0) by [@cortinico](https://github.com/cortinico))
- Gradle to 9.4.1 ([c0ee408c16](https://github.com/react/react-native/commit/c0ee408c163cd4e2e27dad7cbcdd59d97cf3d5a5) by [@leotm](https://github.com/leotm))
- Convert `ReactHorizontalScrollView` from Java to Kotlin ([5c680995bd](https://github.com/react/react-native/commit/5c680995bd416e2bb0f3ef892bd580f5c4527b18) by [@cortinico](https://github.com/cortinico))
- Convert `ReactScrollView` and `ReactNestedScrollView` from Java to Kotlin ([9d65e6c497](https://github.com/react/react-native/commit/9d65e6c497686ab518618dcfb33758110ed41d6e) by [@cortinico](https://github.com/cortinico))
- Corrected nullability of `ViewManager#measure` ([63683f091c](https://github.com/react/react-native/commit/63683f091c7a2f01311ce05e73f7d7d9185113ee) by [@javache](https://github.com/javache))
- Migrate `ReactShadowNode` interface from Java to Kotlin ([f07c7cceee](https://github.com/react/react-native/commit/f07c7cceeed4148b9d1cfca6b1fb35d236ac4e87) by [@cortinico](https://github.com/cortinico))
- Migrate `UIManagerModule` from Java to Kotlin ([21dfc2a855](https://github.com/react/react-native/commit/21dfc2a85578e32c08dc9ea4a0cd87e7cfc0835e) by [@cortinico](https://github.com/cortinico))
- Migrate `UIViewOperationQueue` from Java to Kotlin ([7a8344c037](https://github.com/react/react-native/commit/7a8344c037d361aafb3e180086ab96d44ede63c1) by [@cortinico](https://github.com/cortinico))
- Migrate `BridgeReactContext` from Java to Kotlin ([6720760faf](https://github.com/react/react-native/commit/6720760fafc59cfd5d312fd58d2ee2389a168019) by [@cortinico](https://github.com/cortinico))
- Migrate `ReactNativeHost` from Java to Kotlin (no behavioral changes) ([7eb11331b6](https://github.com/react/react-native/commit/7eb11331b670b83fa7b7a7ae194313848d72d0e6) by [@cortinico](https://github.com/cortinico))
- Bumped min Kotlin version to 2.0+ ([ec1e1ae054](https://github.com/react/react-native/commit/ec1e1ae054f598df73b8795040fae920719a4643) by [@cortinico](https://github.com/cortinico))
- Bump Kotlin to 2.2.0 ([cb04956cde](https://github.com/react/react-native/commit/cb04956cdef16792e38cde443e03ba420c8efb5d) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- `RCTUnsafeExecuteOnMainQueueSync` and bridgeless sync runtime-thread calls now always use the coordinator implementation that pumps UI tasks while waiting for JS, eliminating a class of deadlocks. The previous opt-in flag has been removed. ([eaf770433a](https://github.com/react/react-native/commit/eaf770433a5e6d88e150d5da701460551f0f5603) by [@javache](https://github.com/javache))
- Native modules listed in `unstableModulesRequiringMainQueueSetup` are now always initialized eagerly on the main queue during React Native init; the previous `enableEagerMainQueueModulesOnIOS` opt-in flag has been removed. ([36bec56b0b](https://github.com/react/react-native/commit/36bec56b0b6b2c385c1add41abcde347b0b34fb0) by [@javache](https://github.com/javache))
- Drain React-revision merges from a `BeforeWaiting` main run loop observer instead of dispatching each merge as a separate main-queue block ([d80377cd60](https://github.com/react/react-native/commit/d80377cd60df90ed8ebabdf15df67edd0dd1fc8f) by [@j-piasecki](https://github.com/j-piasecki))

### Deprecated

- Deprecate `react-native/assets-registry`. Use `AssetRegistry` from `react-native` and `react-native/asset-utils` instead. ([715eeaad69](https://github.com/react/react-native/commit/715eeaad69ad4b69dc5694fb5fba6dbde922ca06) by [@huntie](https://github.com/huntie))
- Deprecate `ImageBackground`, use a `View` with an absolutely positioned `Image` instead ([2361189716](https://github.com/react/react-native/commit/2361189716afbcced6ee2cdb0fd860cf23460850) by [@zoontek](https://github.com/zoontek))
- Fix CQS signal modernize-deprecated-headers in xplat/yoga/yoga [B] [A] ([61db78db0b](https://github.com/react/react-native/commit/61db78db0b938052c0c4d15d3e145739258b2282) by generatedunixname1587093422349604)
- Mark undocumented `UTFSequence` module as deprecated ([549e4e2d8d](https://github.com/react/react-native/commit/549e4e2d8d678cde73caa1ee0fb893c168e06294) by [@retyui](https://github.com/retyui))
- Mark undocumented `UTFSequence` module as deprecated ([fd49bf2e2c](https://github.com/react/react-native/commit/fd49bf2e2cfa555de36edeb7fe34e4fad9eca946) by [@retyui](https://github.com/retyui))
- The `NativeMethods` interface is deprecated. Use `HostInstance` instead. ([19f5691e39](https://github.com/react/react-native/commit/19f5691e39bd6d5a8775e77697db9a88418f6a70) by [@huntie](https://github.com/huntie))
- `Appearance.setColorScheme('unspecified')` is deprecated, use `'auto'` instead. ([91702e50fe](https://github.com/react/react-native/commit/91702e50fe077ae73ab152da18719d6df98cb71f) by [@huntie](https://github.com/huntie))

#### Android specific

- Deprecate `DrawerLayoutAndroid`, use `react-native-drawer-layout` instead ([5c5e6cd8ce](https://github.com/react/react-native/commit/5c5e6cd8ce0bfb9c69ac39a1823872fc8eb8c40e) by [@zoontek](https://github.com/zoontek))
- DefaultReactActivityDelegate's constructor taking new arch flags are deprecated ([935f8e5b7d](https://github.com/react/react-native/commit/935f8e5b7db7c197ad31d60dee008db22b43df5a) by [@javache](https://github.com/javache))
- Deprecate `UIBlock` interface and `UIManagerModule.addUIBlock`/`prependUIBlock` methods. Use `UIManagerListener` or View Commands instead. ([29a76918a9](https://github.com/react/react-native/commit/29a76918a988d4120dda5597575bf5be477a7635) by [@cortinico](https://github.com/cortinico))

#### iOS specific



### Removed

- Remove deprecated `Modal` `animated` prop ([fd10410d51](https://github.com/react/react-native/commit/fd10410d512423933ff12f4264e975226aa4b351) by [@zoontek](https://github.com/zoontek))
- **Strict TypeScript API**: Remove deprecated `PublicScrollViewInstance` and `PublicModalInstance` types. Use `ScrollViewInstance` and `ModalInstance` instead. ([74fdfd1eab](https://github.com/react/react-native/commit/74fdfd1eab0812171fc60800b87ca22b3069e721) by [@huntie](https://github.com/huntie))
- Removed RCTDefaultCxxLogFunction ([2b6f605b3c](https://github.com/react/react-native/commit/2b6f605b3c237361d030748b39074bde2beed59a) by [@javache](https://github.com/javache))
- Remove deprecated `InteractionManager` (use `requestIdleCallback` instead) ([ed893f7d98](https://github.com/react/react-native/commit/ed893f7d98053eb47f6ea757b5a917de6c37a58f) by [@rubennorte](https://github.com/rubennorte))
- Remove unused `enableVirtualViewDebugFeatures` feature flag and the associated `FlingItemOverlay` / `FlingDebugItemOverlay` debug surfaces. ([083fd99ba4](https://github.com/react/react-native/commit/083fd99ba4f603b1cb70231136614a96a3f00c59) by [@javache](https://github.com/javache))
- Remove the `useTurboModules` feature flag. TurboModules are now always enabled. ([b4a715ca1f](https://github.com/react/react-native/commit/b4a715ca1fe054c835918c971fd5cc930f7e5846) by [@mdvacca](https://github.com/mdvacca))
- Remove the experimental native View prop transformation feature flag. ([2c2cd9ef54](https://github.com/react/react-native/commit/2c2cd9ef54e119bf6527c584b47e1b789080851f) by [@sammy-SC](https://github.com/sammy-SC))
- Removed the unused `disableMaintainVisibleContentPosition` feature flag from ReactNativeFeatureFlags ([661ce06e02](https://github.com/react/react-native/commit/661ce06e02c80f48d3dca9a4992afc9ea9c3e063) by generatedunixname1608173377072046)
- Remove unused `useLISAlgorithmInDifferentiator` feature flag and LIS algorithm code from the Differentiator ([9f4513c751](https://github.com/react/react-native/commit/9f4513c751621b01dbb0a4379ce7c1d2d4884eeb) by [@javache](https://github.com/javache))

#### Android specific

- Deprecate `logMarkerBridgeless` and `logTaggedMarkerBridgeless` in favor of `logMarker` and `logTaggedMarker` ([319610d328](https://github.com/react/react-native/commit/319610d3286f4d003e23e51edf2f109e817f41b9) by [@javache](https://github.com/javache))
- Remove legacy architecture stub `UIImplementation`. This class was already non-functional (all methods were empty stubs). ([cf28e6b73c](https://github.com/react/react-native/commit/cf28e6b73cb8bd4a5b5d03be85a1f9aa24d2623b) by [@cortinico](https://github.com/cortinico))
- Remove `DisplayMetricsHolder.getWindowDisplayMetrics`, `setWindowDisplayMetrics`, and `getDisplayMetricsWritableMap` ([82536f230f](https://github.com/react/react-native/commit/82536f230fc14d9433fc006224e3b3da24d5838f) by [@zoontek](https://github.com/zoontek))
- Remove legacy architecture stub `UIImplementation`. This class was already non-functional (all methods were empty stubs). ([0825f21171](https://github.com/react/react-native/commit/0825f2117163364e31c61becb974c7ecb2e789d4) by [@cortinico](https://github.com/cortinico))
- Remove hermesV1Enabled and simplify the code ([0a5c8c6b4b](https://github.com/react/react-native/commit/0a5c8c6b4bbf90dc9d727f6fe5d0f3d9dd7668f8) by [@cipolleschi](https://github.com/cipolleschi))
- Remove unused `DevServerHelper.websocketProxyURL` property (legacy remote JS debugger) ([9cb2e63c87](https://github.com/react/react-native/commit/9cb2e63c87f06aa88ffc1c8c070361ccea54905f) by [@huntie](https://github.com/huntie))

#### iOS specific

- Deprecate `TimingModule`; will be removed in a future React Native release ([b0a6386995](https://github.com/react/react-native/commit/b0a63869955d5949ada7289a20b5b6cd29195721) by [@christophpurrer](https://github.com/christophpurrer))
- Legacy arch removal: RCTCxxMethod and DispatchMessageQueueThread ([3b764745c4](https://github.com/react/react-native/commit/3b764745c43024316915d3b19a2be884ad33b026) by [@javache](https://github.com/javache))
- Remove the RCT_HERMES_V1_ENABLED from Cocoapods ([940ee8ae0d](https://github.com/react/react-native/commit/940ee8ae0d2a87b01e8e67b11115a1b314806163) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- - [General][Breaking] - `react-native/Libraries/Image/AssetRegistry` is removed. Please use the `AssetRegistry` API (apps/library code) and/or the `react-native/asset-registry` entrypoint (Metro/build configs). ([6cfde8f296](https://github.com/react/react-native/commit/6cfde8f2961389e68e29fd64321a9185cdc93fe6) by [@huntie](https://github.com/huntie))
- **Strict TypeScript API**: Add missing `textAlignVertical` prop on `<TextInput>` ([e04ff69ab3](https://github.com/react/react-native/commit/e04ff69ab37add0661b3e0a66f0c05917e0f2b8b) by [@huntie](https://github.com/huntie))
- Fixed potential revision drop during merge ([c65845cde2](https://github.com/react/react-native/commit/c65845cde259807eb4892d0e37b80ca65be8c191) by [@j-piasecki](https://github.com/j-piasecki))
- Preserve doc comments on root API symbols in the generated TypeScript types ([642273788b](https://github.com/react/react-native/commit/642273788b9f6493666240768a582e0ca88c340f) by [@huntie](https://github.com/huntie))
- Avoid `memcpy(_, nullptr, 0)` UB in `MapBufferBuilder::build` for empty / scalar-only MapBuffers ([34ccf4f331](https://github.com/react/react-native/commit/34ccf4f331343ed21259808cb20c4b210912aff3) by [@javache](https://github.com/javache))
- Fix a surface-stop race in the C++ Animated shared backend that could permanently leak per-surface animated state ([d9d2502b61](https://github.com/react/react-native/commit/d9d2502b612cba72279b036757bf02e0c7dfa67a) by Bartlomiej Bloniarz)
- Make `AbortSignal.any()` process its input signals in multiple passes to match the DOM specification ([1136e41bd8](https://github.com/react/react-native/commit/1136e41bd8911f0018d410f332b1253367290406) by [@rubennorte](https://github.com/rubennorte))
- Fix `Blob.slice()` for negative start offsets and inverted ranges ([b29dc966a4](https://github.com/react/react-native/commit/b29dc966a42fe3482afcadd28fa09db3310546d7) by [@durvesh1992](https://github.com/durvesh1992))
- Set `FileReader` `readyState` to `LOADING` during a read so `abort()` correctly emits `abort`/`loadend` ([c00813c6ee](https://github.com/react/react-native/commit/c00813c6eeee93ee98645747beed2605928f2330) by [@durvesh1992](https://github.com/durvesh1992))
- Fix a race in the C++ Animated render-callback lifecycle that could leave stale callbacks running on every frame ([e442c496b7](https://github.com/react/react-native/commit/e442c496b7dc6109167c3a365174aa70db4b243e) by Bartlomiej Bloniarz)
- Several view, text, scrollview, and accessibility props that the iterator-setter path silently dropped now propagate correctly through `setProp`: `automaticallyAdjustKeyboardInsets`, `dynamicTypeRamp`, `writingDirection`, `experimental_accessibilityOrder`, `transformOrigin`, and the full `borderCurves` cascaded set. ([15b1f5529a](https://github.com/react/react-native/commit/15b1f5529a45be6a1957de0f85b51c0f43ab91c6) by [@javache](https://github.com/javache))
- Add eventCount to TextInputKeyPressEventData type ([886faee2d1](https://github.com/react/react-native/commit/886faee2d140338dba1c3788ec3ac5b4f231157b) by [@pchalupa](https://github.com/pchalupa))
- Include a node's padding and border in its automatic minimum size when it has a measure function ([91886f7c88](https://github.com/react/react-native/commit/91886f7c8847dd91fe5fd1390bdfa462f0e465c7) by [@adityasharat](https://github.com/adityasharat))
- Removed wrong changelog entry in 0.83.2 ([ef38ba4050](https://github.com/react/react-native/commit/ef38ba40507aca1c50778a3f94a51c4ee6ea191f) by [@chrfalch](https://github.com/chrfalch))
- Crash: YogaLayoutableShadowNode.cpp: function layout: assertion failed (YGNodeGetOwner(childYogaNode) == &yogaNode_) https://github.com/react/react-native/issues/52349 ([6fa330693f](https://github.com/react/react-native/commit/6fa330693fba313a2fe1121545c1efd558b60983) by [@5ZYSZ3K](https://github.com/5ZYSZ3K))
- Base64-encode binary (arraybuffer/blob) response bodies in the C++ NetworkingModule so they are not corrupted when delivered to JS ([1127e54d53](https://github.com/react/react-native/commit/1127e54d539a0bc998ecc43104c7573190a87de1) by [@sathoshik](https://github.com/sathoshik))
- Fix asyncArrayBufferBorrowNativeBackedTest unconditional skip on Hermes ([9d54391814](https://github.com/react/react-native/commit/9d54391814a27032f4bc1a5e90bee147514be846) by [@christophpurrer](https://github.com/christophpurrer))
- Add missing pointer event handler types (`onPointerOver`, `onPointerOut`, `onGotPointerCapture`, `onLostPointerCapture`, and their `*Capture` variants) to the TypeScript types ([20931fe975](https://github.com/react/react-native/commit/20931fe9755b62f6487d18325e78468e234ea80f) by [@ahmdshrif](https://github.com/ahmdshrif))
- Fix text measurements being incorrectly reused across pixel density changes ([d53c7b52a6](https://github.com/react/react-native/commit/d53c7b52a6d21d78b822af91e817cd8b7d6ee3c8) by [@jehartzog](https://github.com/jehartzog))
- Update ImageSource.d.ts see reference URL to reflect current repository structure ([6eb07a813d](https://github.com/react/react-native/commit/6eb07a813d2e37daf690dbef1fa0f0a3ae3b884a) by [@ergenekonyigit](https://github.com/ergenekonyigit))
- **Strict TypeScript API**: Add missing `pointerEvents` prop to `Text` component ([a2e042f76a](https://github.com/react/react-native/commit/a2e042f76a9aac30359deb0b06ae7f7db9f2be47) by [@huntie](https://github.com/huntie))
- Sync JS-side `Animated.Value` with the post-animation value before invoking `Animated.timing(...).start({finished})` callbacks so reads from inside the callback (or from React re-renders it triggers) observe the post-animation value rather than the pre-animation value. Gated behind a new JS-only feature flag, `animatedShouldSyncValueBeforeStartCallback`, defaulting to `true` (set to `false` to opt out). ([ee6958a9f4](https://github.com/react/react-native/commit/ee6958a9f44234ab08bc06aad599cdc34fa5b368) by [@fabriziocucci](https://github.com/fabriziocucci))
- Expose Modal native ref prop in TypeScript declarations ([7cc8c76e83](https://github.com/react/react-native/commit/7cc8c76e838ca3fb9a036ca5af873c48b0762f99) by [@ya-nsh](https://github.com/ya-nsh))
- Fixed a regression that causes crashes on reload for `ReactCxxPlatform`'s `ReactHost` ([ac81869f05](https://github.com/react/react-native/commit/ac81869f05d74bccc79d78e738619cfc403db767) by [@etodanik](https://github.com/etodanik))
- Suppress `React.Fragment` style warning when used as a child of `TouchableHighlight` ([d7b5314bd8](https://github.com/react/react-native/commit/d7b5314bd853679f753379d2233035922bbc8977) by [@qflen](https://github.com/qflen))
- React Native DevTools will no longer briefly flash in the system dock/taskbar when starting Metro ([6aa7e35ec3](https://github.com/react/react-native/commit/6aa7e35ec35b1b08a5354a89a7e9cee2ee9b6ece) by [@huntie](https://github.com/huntie))
- Parse Image srcSet density descriptors consistently ([e4cf0a1cc3](https://github.com/react/react-native/commit/e4cf0a1cc3d629916ff1331a48fd7eff65474f1b) by [@ya-nsh](https://github.com/ya-nsh))
- Align TypeScript accessibility role definitions with supported React Native accessibility roles ([75e1f06b66](https://github.com/react/react-native/commit/75e1f06b66d3fb5addaaff1be8c7fba0a6552a8b) by [@ya-nsh](https://github.com/ya-nsh))
- Fix hover out timeout stored in wrong variable in Pressability ([74b1a4d026](https://github.com/react/react-native/commit/74b1a4d026482e09103d44c5da81fb802202f0f9) by [@w3di](https://github.com/w3di))
- Fix missing format specifier in renderApplication invariant ([bc1a31fb16](https://github.com/react/react-native/commit/bc1a31fb16f0cf1ca92331499c6f2fa4e347dfbf) by [@w3di](https://github.com/w3di))
- **Strict TypeScript API**: Update `getNativeScrollRef` return type across ScrollView, FlatList, and SectionList ([535b844680](https://github.com/react/react-native/commit/535b844680fdd05add3262f73c40c5f50f7bf329) by [@huntie](https://github.com/huntie))
- ## Changelog:[GENERAL] [FIXED] - Change FlatList.getNativeScrollRef return type definition to allow accessing the underlying HostInstance. ([5162816e03](https://github.com/react/react-native/commit/5162816e035f29ee1743cd00a3f93522b5c1abfe) by [@janpe](https://github.com/janpe))
- Re-enabled VirtualizedList "retains batch render region when an item is appended" tes ([c0bf1549c2](https://github.com/react/react-native/commit/c0bf1549c2bb5dc3a90ee7da293c7cf964ced119) by [@chicio](https://github.com/chicio))
- Fix missing and incorrect types in `AccessibilityInfo` TypeScript definitions ([4255f9bd89](https://github.com/react/react-native/commit/4255f9bd899a4730298d7ec808def1e062bd81f2) by [@huntie](https://github.com/huntie))
- Add null check on JNI return value in `JCxxInspectorPackagerConnectionDelegateImpl::connectWebSocket` to prevent null dereference ([fa05b8c88b](https://github.com/react/react-native/commit/fa05b8c88b86f953d1f9b812699e24ea593d8587) by [@shubhamksavita](https://github.com/shubhamksavita))

#### Android specific

- Prevent descenders from being clipped when Android text lineHeight matches fontSize ([bb3c121073](https://github.com/react/react-native/commit/bb3c121073a84cd14553bbee036f325eeb294478) by [@TorinAsakura](https://github.com/TorinAsakura))
- Fix ClassCastException crash on Android 9 and below when an IME submit action races the unmount of a TextInput ([97aa7ad272](https://github.com/react/react-native/commit/97aa7ad2723fb8267f1737d4f7389dbbb9820517) by [@shahidrogers](https://github.com/shahidrogers))
- Fix Dev Menu Settings crash in debugOptimized builds ([2fb4f13fbf](https://github.com/react/react-native/commit/2fb4f13fbff992c5bd53ad4571be046d2f30f10e) by [@Phecda](https://github.com/Phecda))
- Use explicit `ReactInstanceManager.mHasStartedDestroyingLock` instead of using `ReactInstanceManager.mHasStartedDestroying` ([f500f4239c](https://github.com/react/react-native/commit/f500f4239c8d029242223f73179f46e2d3c81abd) by [@Yqwed](https://github.com/Yqwed))
- Account for Android Bold text font weight adjustment when measuring Text. ([d833014948](https://github.com/react/react-native/commit/d8330149481c9227a6acf05ff8c1a1bea3a5af54) by [@TorinAsakura](https://github.com/TorinAsakura))
- Fix incorrect color stop positions in gradients when a positioned stop is immediately followed by an unpositioned stop ([cb63782554](https://github.com/react/react-native/commit/cb637825540a14f2bdde13fa753f4935105f4713) by [@nduaarte](https://github.com/nduaarte))
- Avoid crash in SurfaceMountingManager when sendAccessibilityEvent or setJSResponder is called for a missing or deleted view state. ([8eb4240d36](https://github.com/react/react-native/commit/8eb4240d3661e00920af513ff0e864593c1978a0) by [@ManasGuptaSprinklr](https://github.com/ManasGuptaSprinklr))
- Prevent `IllegalArgumentException` crash in `statusBarShow`/`statusBarHide` when the window decorView is detached ([a54b04e94b](https://github.com/react/react-native/commit/a54b04e94b174fd4b91256bddd3944ef8dfdc8c5) by [@alanleedev](https://github.com/alanleedev))
- Fix crash in Scheduler::animationTick when uiManager_ is null. ([e73592ba51](https://github.com/react/react-native/commit/e73592ba51e00b5789dfb3d445c8d19834f9f66e) by [@shubhamksavita](https://github.com/shubhamksavita))
- Prevent "Mapped property node does not exist" crash in `PropsAnimatedNode.updateView` when a mapped node is removed during an in-flight native animation ([53369ed321](https://github.com/react/react-native/commit/53369ed3216d973b52fd825001a53434137da4a6) by [@shashank-bhatotia](https://github.com/shashank-bhatotia))
- Correct logical border radius mapping for `borderEndStartRadius` and `borderStartEndRadius`. ([ad2cf4d1d7](https://github.com/react/react-native/commit/ad2cf4d1d795f0bfeac836156b51828c5c97cb4a) by [@nikhilpakhloo](https://github.com/nikhilpakhloo))
- Fix `TextInput` placeholder staying on multiple lines after `multiline` is toggled from `true` back to `false` ([df6de4f758](https://github.com/react/react-native/commit/df6de4f758308e30a0df8e08ad41fec78219ca6d) by [@Abbondanzo](https://github.com/Abbondanzo))
- Register pointer capture event handlers in the Android base view config ([74382cacd8](https://github.com/react/react-native/commit/74382cacd870115fd7549dff1cf0ef2e54075769) by [@yaminyassin](https://github.com/yaminyassin))
- Prevent React Native containers from delaying native touches ([d8f71837f8](https://github.com/react/react-native/commit/d8f71837f8db1b9bdd3be7c7df0d5b5c476e4bac) by [@j-piasecki](https://github.com/j-piasecki))
- Fix crash in SkewMatrixHelper ([9e3a0df61e](https://github.com/react/react-native/commit/9e3a0df61e22a17b09d1e0865436d5f0da569a7e) by [@javache](https://github.com/javache))
- Fix text decoration line thickness regression on Android ([9f20cde724](https://github.com/react/react-native/commit/9f20cde7241184447a84c52150dd27a2406b1048) by [@cortinico](https://github.com/cortinico))
- Fix text decoration color not matching foreground color when `textDecorationColor` is not set ([2da0244c16](https://github.com/react/react-native/commit/2da0244c16310aeff253219f7e9d5001e5e5d00b) by [@cortinico](https://github.com/cortinico))
- SkewX / skewY transforms now render correctly on Android Q+. ([62903bc3e2](https://github.com/react/react-native/commit/62903bc3e2da9028105c5f0e6090889a700a4fef) by [@qflen](https://github.com/qflen))
- Fix deadlock between the UI and JS threads when native animations start while a synchronous VirtualView mode-change event is dispatched ([b96b626297](https://github.com/react/react-native/commit/b96b626297f951187ab2146ee0ef80292b6ba5c3) by [@coado](https://github.com/coado))
- Prevent `IllegalArgumentException` crash in `StatusBarModule` when activity is destroyed before the UI thread runnable executes ([732b848a8e](https://github.com/react/react-native/commit/732b848a8e94480fb448da0c93b21eb49413e186) by [@alanleedev](https://github.com/alanleedev))
- Fix `Image.getSize()` failing for local drawable resource URIs including VectorDrawables ([aea8785d66](https://github.com/react/react-native/commit/aea8785d661b6269aedb75f472319dc48519563d) by [@Abbondanzo](https://github.com/Abbondanzo))
- Fix NullPointerException in `ReactProgressBarViewManager.measure()` when invoked with null `localData` or `state` (for example, from the upcoming CSS Flexbox §4.5 auto-min-size probe in Yoga). ([ef683f7010](https://github.com/react/react-native/commit/ef683f7010beaad08b5c3130f8ca5ec497072b9c) by [@adityasharat](https://github.com/adityasharat))
- Reduced memory usage during JS bundle downloads by eliminating intermediate buffer copies ([57eb56fbf5](https://github.com/react/react-native/commit/57eb56fbf5658170026b82bba04358e58237eb70) by [@DorianMazur](https://github.com/DorianMazur))
- Preserve secure TextInput password character reveal timing when JS state echoes the same text. ([08731165f5](https://github.com/react/react-native/commit/08731165f583e6dae344ea80ae4f9051aac0ff48) by [@sorinc03](https://github.com/sorinc03))
- Issue when clearing accessibilityLabelledBy ([63dec777d9](https://github.com/react/react-native/commit/63dec777d9cf0f2a32acbadf4c6ed5aca0b736a4) by [@rozele](https://github.com/rozele))
- Fix pure C++ turbo modules not working without `includesGeneratedCode: true` ([c789880517](https://github.com/react/react-native/commit/c7898805178dd7881c745185a5915ce2c4cf3c1d) by [@satya164](https://github.com/satya164))
- Fix commit branching dropping updates when `enableAccumulatedUpdatesInRawPropsAndroid` is not enabled. ([bcadedaba4](https://github.com/react/react-native/commit/bcadedaba45ad71405d7dfd6696534dc62655c3e) by [@j-piasecki](https://github.com/j-piasecki))
- Show request body preview for FormData and file uploads in DevTools Network tab ([48fe6df3d2](https://github.com/react/react-native/commit/48fe6df3d2b2d72138bda212354443c22c60302f) by [@HarshitMadhav](https://github.com/HarshitMadhav))
- Catch IllegalArgumentException in ScrollView.onTouchEvent to prevent crashes from a known Android framework multi-touch bug ([d672c96445](https://github.com/react/react-native/commit/d672c96445eff16da06baa95b63c44fd13be47ab) by [@tomekzaw](https://github.com/tomekzaw))
- Source props in image headers in Android ([eeb17badf6](https://github.com/react/react-native/commit/eeb17badf6d87166000d50de76dea5b19ea73968) by [@humaidk2](https://github.com/humaidk2))
- Guard missing autolinked JNI directories in generated CMake during native clean/model configuration. ([948835d944](https://github.com/react/react-native/commit/948835d9448ce7e06ef8d3cfbfaf177b396e1ab3) by [@Phecda](https://github.com/Phecda))
- JSModule method without args are correctly dispatched ([949b8049df](https://github.com/react/react-native/commit/949b8049dfeb4f5cf449284f9d37093641757a1a) by [@javache](https://github.com/javache))
- Screen reader behavior for accessibilityState expanded ([fafcfcd5f6](https://github.com/react/react-native/commit/fafcfcd5f6eedf96c7fedc9ba6f04f680f2ae01d) by [@rozele](https://github.com/rozele))

#### iOS specific

- Prevent Alert and Modal from rendering in the top-left corner ([859bdb89e5](https://github.com/react/react-native/commit/859bdb89e592f6879c1140eb900ae5baeb352bb9) by [@zoontek](https://github.com/zoontek))
- Fix a data race in `RCTImageLoader` loader and decoder lazy initialization that could crash with `EXC_BAD_ACCESS` ([7ed17c9d09](https://github.com/react/react-native/commit/7ed17c9d09e7d45bcaca8c0c7c4a495b58dcc69d) by Miklós Fazekas)
- Fix React-RCTAnimatedModuleProvider build by adding the missing Yoga dependency and a missing space between compiler flags ([08ef7b18d2](https://github.com/react/react-native/commit/08ef7b18d270914c59561873532b5d6d06c4d97b) by [@zoontek](https://github.com/zoontek))
- Add an explicit wake up call to the main loop hen scheduling a React revision merge ([0cdb59f1b4](https://github.com/react/react-native/commit/0cdb59f1b45b6c15ed9e96cc59927a143bcf5d4c) by [@j-piasecki](https://github.com/j-piasecki))
- Add missing `RCT_REMOVE_LEGACY_COMPONENT_INTEROP` guard to `LegacyViewManagerInteropComponentDescriptor` ([510cc0c5ec](https://github.com/react/react-native/commit/510cc0c5eccc0d921d9fcdeeb4d21ce9d57b6400) by [@christophpurrer](https://github.com/christophpurrer))
- Always return true in RCTTurboModuleEnabled ([aee4a2586e](https://github.com/react/react-native/commit/aee4a2586ede308a85d2a0c5abe2e941defb86fd) by [@christophpurrer](https://github.com/christophpurrer))
- Deprecate RCTTurboModuleEnabled() and RCTEnableTurboModule() ([feede1422b](https://github.com/react/react-native/commit/feede1422b3acce4c2de095113466e34d84b3486) by [@christophpurrer](https://github.com/christophpurrer))
- Allow iOS apps with the dev menu enabled (`RCT_DEV_MENU`) to connect to Metro via "Change Bundle Location" ([94380cb4ad](https://github.com/react/react-native/commit/94380cb4ad18eba4164f44bd9a2c9afcef82db43) by [@fmacinator](https://github.com/fmacinator))
- Expose the bridgeless performance logger via `RCTBridgeProxy` and post `RCTJavaScriptDidLoadNotification`, so native startup-perf consumers work in bridgeless ([9568de5a2d](https://github.com/react/react-native/commit/9568de5a2dd1277f7cb3051d394475e5cd1130e3) by [@fkgozali](https://github.com/fkgozali))
- Fix codegen script phase error logging in `script_phases.sh` ([f14207f9bd](https://github.com/react/react-native/commit/f14207f9bd83c42b0841d6157676a0477bc0b3b3) by [@fallintoplace](https://github.com/fallintoplace))
- Fixed percentage-based border radius ([b4966128af](https://github.com/react/react-native/commit/b4966128af2ecb7370373e7639b36e0b345cbfb1) by [@j-piasecki](https://github.com/j-piasecki))
- Remove unsafe window manipulation in [RCTLogBoxView](vscode-file://vscode-app/c:/Users/agloryvimalabai/AppData/Local/Programs/Microsoft%20VS%20Code/0958016b2a/resources/app/out/vs/code/electron-browser/workbench/workbench.html) dealloc to prevent crash with SceneDelegate ([4f825d3469](https://github.com/react/react-native/commit/4f825d346924f71d80c98f4b7ba260f55ac06f52) by [@aswinandro](https://github.com/aswinandro))
- Fix TypeError crash in ResponderTouchHistoryStore when changedTouches is undefined ([2c6cb27f88](https://github.com/react/react-native/commit/2c6cb27f88f418b4fdecaf592484ac14b67dcca2) by generatedunixname1608173377072046)

### Security

- Fix security vulnerabilities in `xmldom/xmldom`, `fast-xml-parser`, `yaml`, `fast-uri`, and `addressable` transitive dependencies ([284035b21d](https://github.com/react/react-native/commit/284035b21d94a0b2096b3aa3f39470747d191a57) by [@cortinico](https://github.com/cortinico))

#### Android specific



#### iOS specific



### Unknown

- Release 0.87.0-rc.0 ([2d913c7292](https://github.com/react/react-native/commit/2d913c7292088a7bc4482a6febb2ee4903d6f32f) by [@react-native-bot](https://github.com/react-native-bot))
- Release 0.87.0-rc.0 ([d67f27978c](https://github.com/react/react-native/commit/d67f27978c2a1b80afc2447449e4ca8375ea6885) by [@react-native-bot](https://github.com/react-native-bot))
- Release 0.87.0-rc.0 ([f21a3bef02](https://github.com/react/react-native/commit/f21a3bef0241da0b741d2186e8416a3f4eae6efc) by [@react-native-bot](https://github.com/react-native-bot))
- Xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/attributedstring/ParagraphAttributes.cpp ([ce057d6554](https://github.com/react/react-native/commit/ce057d6554b5ed44070336fa2353d7d6624eab92) by generatedunixname1563563004708334)
- Daily `arc lint --take KTFMT` ([f9ba09d60e](https://github.com/react/react-native/commit/f9ba09d60ecb6362b695bb30d387a72a447dc790) by generatedunixname1430061942044674)
- Turn on `experimental.instance_t_objkit_fix` across fbsource roots ([71fee907fb](https://github.com/react/react-native/commit/71fee907fb9f75ecba210a9041cde7393c98697b) by [@SamChou19815](https://github.com/SamChou19815))
- Xplat/js/react-native-github/packages/react-native/ReactCommon/react/renderer/animated/drivers/DecayAnimationDriver.cpp ([69b58f308e](https://github.com/react/react-native/commit/69b58f308e4399c8b56feb9e283be2da8676890a) by generatedunixname1563563004708334)
- Transform readonly in xplatjs ([5fce2de800](https://github.com/react/react-native/commit/5fce2de80028e972951b2544be2082c951febb64) by [@marcoww6](https://github.com/marcoww6))
- Fix a few readonly 10/n ([09fc0432d1](https://github.com/react/react-native/commit/09fc0432d1eb799c3c1c2ae2ef0dc3acb2944e35) by [@marcoww6](https://github.com/marcoww6))
- Codemod `in/out` ([9f558a4d6a](https://github.com/react/react-native/commit/9f558a4d6a546f73babacb4de991116e19727a86) by [@marcoww6](https://github.com/marcoww6))
- Add license header to ProGuard files ([b3c0f3ce30](https://github.com/react/react-native/commit/b3c0f3ce301369c7e7f9ea8f7442940229946d61) by [@helfper](https://github.com/helfper))
- Fix use-after-free data race in EventEmitter.cpp (T259167206) ([5dea3b5e6c](https://github.com/react/react-native/commit/5dea3b5e6c01743a331105a031ab33e016e64b3a) by generatedunixname1383054420177565)

#### Android Unknown

- Translation auto-update for batch 3/64 on master ([9299204523](https://github.com/react/react-native/commit/9299204523bc5c4151c2d8972dd4669f81ecc751) by Intl Scheduler)
- Translation auto-update for batch 3/64 on master ([10ec4ad01a](https://github.com/react/react-native/commit/10ec4ad01a10e2e5bd156eee18b5b56082d975de) by Intl Scheduler)
- Translation auto-update for batch 2/64 on master ([a902d7402c](https://github.com/react/react-native/commit/a902d7402c241b0260121c0e8be72c691387cc1c) by Intl Scheduler)
- Make CustomEventNamesResolver a fun interface for SAM conversion ([df4cadc126](https://github.com/react/react-native/commit/df4cadc126690ff09ea653b2d02874b892e897f2) by [@cortinico](https://github.com/cortinico))
- Migrate YogaWrap enum to Kotlin ([6e262624fc](https://github.com/react/react-native/commit/6e262624fcb3ccea694f47b9b3474aabdeaed29f) by [@cortinico](https://github.com/cortinico))
- Migrate YogaUnit enum to Kotlin ([97cf21dd41](https://github.com/react/react-native/commit/97cf21dd41c7c2c111b9839e71d2cfc54239fd39) by [@cortinico](https://github.com/cortinico))
- Migrate YogaPositionType enum to Kotlin ([d181829b9c](https://github.com/react/react-native/commit/d181829b9ce9fbed9655dbded41e54baae5ef3d7) by [@cortinico](https://github.com/cortinico))
- Migrate YogaOverflow enum to Kotlin ([14c1d164d5](https://github.com/react/react-native/commit/14c1d164d53de189a97868e0fa3ff8e8e9e66f14) by [@cortinico](https://github.com/cortinico))
- Migrate YogaNodeType enum to Kotlin ([bb137aa028](https://github.com/react/react-native/commit/bb137aa028990e7f6f8f4b1f82541ba758df8fac) by [@cortinico](https://github.com/cortinico))
- Migrate YogaMeasureMode enum to Kotlin ([b7801f29c5](https://github.com/react/react-native/commit/b7801f29c50b5c71ab0e516e23d652b30f82c656) by [@cortinico](https://github.com/cortinico))
- Migrate YogaLogLevel enum to Kotlin ([5d5350b1e4](https://github.com/react/react-native/commit/5d5350b1e48336bc669aa972ebf316df7f9809df) by [@cortinico](https://github.com/cortinico))
- Migrate YogaJustify enum to Kotlin ([084a77631f](https://github.com/react/react-native/commit/084a77631f432eab1d007c59b91a07aef1cf75c8) by [@cortinico](https://github.com/cortinico))
- Migrate YogaGutter enum to Kotlin ([26862a0251](https://github.com/react/react-native/commit/26862a0251b2acdfbade84da46753318a62c700d) by [@cortinico](https://github.com/cortinico))
- Migrate YogaGridTrackType enum to Kotlin ([f1b488f5da](https://github.com/react/react-native/commit/f1b488f5dae2727472bedc9b65d901dbf20f20d5) by [@cortinico](https://github.com/cortinico))
- Migrate YogaFlexDirection enum to Kotlin ([984621b212](https://github.com/react/react-native/commit/984621b212f803bc1db8abec877f2be6c1c45f54) by [@cortinico](https://github.com/cortinico))
- Migrate YogaExperimentalFeature enum to Kotlin ([70ebd43a1a](https://github.com/react/react-native/commit/70ebd43a1a6c03e0fdaa7fea4e4d9bd1cc34eb41) by [@cortinico](https://github.com/cortinico))
- Migrate YogaErrata enum to Kotlin ([d695a5cff4](https://github.com/react/react-native/commit/d695a5cff4a76674d60d835ce518c0e31709cdb1) by [@cortinico](https://github.com/cortinico))
- Migrate YogaEdge enum to Kotlin ([2be96e8d92](https://github.com/react/react-native/commit/2be96e8d920ba09570931a09909dd18c6714ea83) by [@cortinico](https://github.com/cortinico))
- Migrate YogaDisplay enum to Kotlin ([9580a54273](https://github.com/react/react-native/commit/9580a54273c8a4f726f88368a7adb34eaf535cae) by [@cortinico](https://github.com/cortinico))
- Migrate YogaDimension enum to Kotlin ([2d2b9924e3](https://github.com/react/react-native/commit/2d2b9924e3a415f5aae311b71db323bf762a2bb3) by [@cortinico](https://github.com/cortinico))
- Migrate YogaBoxSizing enum to Kotlin ([fe154568e5](https://github.com/react/react-native/commit/fe154568e55b21e87f4efe999d57cd403dd1b6b4) by [@cortinico](https://github.com/cortinico))

#### iOS Unknown



#### Failed to parse




## v0.86.0

### Added

- **Accessibility**: AccessibilityInfo: added missing tests for Promise based methods, align null checks and error message code style ([8fc503d780](https://github.com/facebook/react-native/commit/8fc503d7806ff83c6001cc4e0fe7b8b85a804245) by [@chicio](https://github.com/chicio))
- **Animated**: Suspense tests for the Animation Backend ([8101fc776d](https://github.com/facebook/react-native/commit/8101fc776d842b8b92a516f74831e2056bc34aa6) by Bartlomiej Bloniarz)
- **Animated**: Use weak_ptr when calling pullAnimationMutations in a callback scheduled with the Animation Backend ([42d98b5830](https://github.com/facebook/react-native/commit/42d98b58302dafb484a494ab4fc199f88f215c1d) by Bartlomiej Bloniarz)
- **Dev Server**: Call methods on `global.__BUNDLE_LOADER_REPORTER__`, if given, during dev-mode bundler loads from Metro ([1e0c1f886b](https://github.com/facebook/react-native/commit/1e0c1f886ba9de7541eeb753091715011c515c00) by [@robhogan](https://github.com/robhogan))
- **React Native DevTools**: Add new custom track for React Native Renderer operations in React Native DevTools performance traces ([0b1def9ce5](https://github.com/facebook/react-native/commit/0b1def9ce5f6f3ea66d193fd254cfcb4c16d6e5a), [29bc8f1acb](https://github.com/facebook/react-native/commit/29bc8f1acb2cc9a4016c4bdf032f5b53474558bf), [9130df6773](https://github.com/facebook/react-native/commit/9130df67735f01c385296e155300dd8afebae6be), [c26a4875ea](https://github.com/facebook/react-native/commit/c26a4875eaaf3dcf9a6f28ac87df0a07a1cf4b37) by [@rubennorte](https://github.com/rubennorte))
- **React Native DevTools**: Add support for light/dark mode emulation via `Emulation.setEmulatedMedia` ([11a5432cb2](https://github.com/facebook/react-native/commit/11a5432cb283b6e7b59bf785602fff9082af5bff) by [@huntie](https://github.com/huntie))
- **Runtime**: Add `unstable_getViewTransitionInstance` to UIManagerBinding ([d8820a403b](https://github.com/facebook/react-native/commit/d8820a403bb7241f4d2dd4b1006079af049d68e3) by [@zeyap](https://github.com/zeyap))
- **Runtime**: Add UIManagerViewTransitionDelegate interface and View Transition APIs ([cdad57d8f1](https://github.com/facebook/react-native/commit/cdad57d8f1a326f2ce164161e1d28ff082fd68b4) by [@zeyap](https://github.com/zeyap))
- **Runtime**: Add viewport size to `LayoutContext` ([d38c756529](https://github.com/facebook/react-native/commit/d38c756529d4c1076d0646dc75643b78ba2bcaaa) by [@paradowstack](https://github.com/paradowstack))
- **Runtime**: ViewTransitionModule for React Native View Transitions ([f81f73e5a0](https://github.com/facebook/react-native/commit/f81f73e5a02e792cfaf2c010dea2ddfb20cb3e7f) by [@zeyap](https://github.com/zeyap))
- **Text**: Add E2E tests for Text `boxShadow` and textWithLinkRole ([b172f46f0d](https://github.com/facebook/react-native/commit/b172f46f0d0413dcaedc8c901d79e3932cb26589) by [@NickGerleman](https://github.com/NickGerleman))
- **View**: Add E2E tests for Filter blur-with-overflow, drop-shadow, and animated-blur ([66975aa3d5](https://github.com/facebook/react-native/commit/66975aa3d52a05189b07f8f22eec86dbbfab0240) by [@NickGerleman](https://github.com/NickGerleman))
- **View**: Add `mixBlendMode` plus-lighter ([aaa0684045](https://github.com/facebook/react-native/commit/aaa068404504076155ec4d4f11a1d246aef763f5) by [@bigcupcoffee](https://github.com/bigcupcoffee))

#### Android specific

- **Events**: Channel play/pause hardware events. ([5087aa0dba](https://github.com/facebook/react-native/commit/5087aa0dba4e06986b98007bc33ee16af11f9358) by Nishil Shah)
- **Events**: Pass event object to `BackHandler` `hardwareBackPress` events to access timeStamp from native event. ([bf277cb6d4](https://github.com/facebook/react-native/commit/bf277cb6d4b6f53227717e8888a4d9701d8a3449) by [@rubennorte](https://github.com/rubennorte))
- **LogBox**: Allow LogBox notification toasts and inspector overlay to be dismissed via Android back button ([6530092162](https://github.com/facebook/react-native/commit/6530092162b9996b2c53cd5fd76b9c9a6520e57f) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Pressable**: `android_ripple` now accepts `PlatformColor` ([60d8b282ea](https://github.com/facebook/react-native/commit/60d8b282eaf5bd2803fdaa838520f6ff41cc6737) by [@adrcotfas](https://github.com/adrcotfas))
- **Runtime**: Add `ExtraWindowEventListener` interface to allow native modules to react to window creation / destruction (e.g. Modal dialogs) ([58fec1fa8d](https://github.com/facebook/react-native/commit/58fec1fa8d351c40a68cb0da807c49c7c2c96a80) by [@zoontek](https://github.com/zoontek))
- **Runtime**: Add test for synchronous mount props override behavior ([a25e0fdddf](https://github.com/facebook/react-native/commit/a25e0fdddf0ab77c798dd00f8c88e842ee72c955) by [@zeyap](https://github.com/zeyap))
- **Text**: Add E2E tests for Text visual examples (batch 1) ([b53b228673](https://github.com/facebook/react-native/commit/b53b228673e0b833cae7718bbb778b2ecaec5d76) by [@NickGerleman](https://github.com/NickGerleman))
- **Text**: Add E2E tests for Text visual examples (batch 2) ([d5a271dd05](https://github.com/facebook/react-native/commit/d5a271dd0599caff85652ce0581e3026da470065) by [@NickGerleman](https://github.com/NickGerleman))
- **TextInput**: Add extended Android `TextInput` `autoComplete` autofill hint support and bump `androidx.autofill` to `1.3.0`. ([ac598aff2b](https://github.com/facebook/react-native/commit/ac598aff2b388d4fac9f42a2e2cef73542d2531d) by [@radko93](https://github.com/radko93))
- **View**: Add E2E tests for Filter static visual examples ([d18d9a4046](https://github.com/facebook/react-native/commit/d18d9a4046e25b60a2054462d242663a8daa2589) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- **Build**: Add privacy manifest to declare the use of `mach_absolute_time()` API in the React-timing module ([2ae6c8940d](https://github.com/facebook/react-native/commit/2ae6c8940dda8e7523d5f7f6ffb6c1a3b361a19e) by [@rubennorte](https://github.com/rubennorte))
- **Dev Server**: Introduce `isPackagerRunningAsync` that does not block the UI thread waiting on the request to DevServer ("Packager") validating that it is running ([dd056d9b4c](https://github.com/facebook/react-native/commit/dd056d9b4c007f7e67f5ac3ad2c537e635d4a509) by [@vzaidman](https://github.com/vzaidman))
- **Image**: Add E2E tests for Image visual examples ([48b6f2dcc9](https://github.com/facebook/react-native/commit/48b6f2dcc93f28801338fc79dff8b527b15d5f92) by [@NickGerleman](https://github.com/NickGerleman))
- **Networking**: Add `RCTSetCustomMultipartDataTaskRequestInterceptor` API to allow custom modification of multipart data task requests before they are sent ([59b8886bb8](https://github.com/facebook/react-native/commit/59b8886bb85f3c4c4b4ef55536d8ffeb4e5b3102) by [@cipolleschi](https://github.com/cipolleschi))

### Changed

- **Build**: Update Metro to ^0.84.2 ([57d4b6b350](https://github.com/facebook/react-native/commit/57d4b6b350dc0e8f2a89e4f5f570ed3452551d85) by [@robhogan](https://github.com/robhogan))
- **Dev Server**: LoadBundleFromServer test: remove legacy Jest timers, increased coverage and improved assertions ([a19d98e542](https://github.com/facebook/react-native/commit/a19d98e5428f710716486b064c3b0589355c5641) by [@chicio](https://github.com/chicio))
- **Hermes**: Bump hermes-compiler dependency ([031168013e](https://github.com/facebook/react-native/commit/031168013e8faab6f08b822a69f39d2df3fc78ff) by [@robhogan](https://github.com/robhogan))
- **Hermes**: Bump hermes version ([89a2a20739](https://github.com/facebook/react-native/commit/89a2a20739ceda065cdc605397bfe9c178403b4a) by [@robhogan](https://github.com/robhogan))
- **LogBox**: Migrated `LogBoxData` tests to Jest modern timers ([dea2136a49](https://github.com/facebook/react-native/commit/dea2136a493453bcdc5e8c4b6950e9d6338f1445) by [@chicio](https://github.com/chicio))
- **React**: Make React Native consume 250829098.0.11 ([26953d8343](https://github.com/facebook/react-native/commit/26953d8343abb2ea05fe86857c2016a4fadb48b7) by [@alanleedev](https://github.com/alanleedev))
- **React Native DevTools**: Derive WebSocket scheme and port from dev server URL for React DevTools connections, supporting HTTPS dev servers ([ca4173701d](https://github.com/facebook/react-native/commit/ca4173701d4b398a3b43650d019ffc75fb1d21a7) by [@cipolleschi](https://github.com/cipolleschi))
- **Runtime**: Measure node instance during `applyViewTransitionName` ([d17ecca3c9](https://github.com/facebook/react-native/commit/d17ecca3c90c4ddd3922e3661ece03ac2433fcff) by [@zeyap](https://github.com/zeyap))
- **Runtime**: Move ViewTransition APIs not for react reconciler to its own TurboModule ([0e65df9152](https://github.com/facebook/react-native/commit/0e65df9152d940a52d6dc4704cb60b644e18fb23) by [@zeyap](https://github.com/zeyap))
- **Runtime**: Setting `reportErrorsAsExceptions` to anything other than `false` no longer does anything. (Previously, setting it to a falsey value would be similar to setting it to `false`.) ([f0748a6387](https://github.com/facebook/react-native/commit/f0748a6387c9bb04eed38d03f00f36d2985b2031) by [@yungsters](https://github.com/yungsters))
- **Runtime**: Use `getNullableViewState` in `SurfaceMountingManager::updateProps` and log a soft exception instead ([bbf7004935](https://github.com/facebook/react-native/commit/bbf7004935ec3ed25e0270c60889f118ba170495) by Bartlomiej Bloniarz)
- **TurboModules**: Move `DefaultTurboModules::get` to end of `TurboModuleManager` ([6b32971f46](https://github.com/facebook/react-native/commit/6b32971f46201b08004736dad9689d71eba0712f) by [@zeyap](https://github.com/zeyap))

#### Android specific

- **Animated**: `AnimationBackendChoreographer` doesn't guard the `ReactChoreographer` post/remove with `synchronized(paused)` ([22d327595d](https://github.com/facebook/react-native/commit/22d327595dafe1913092a911c8f0ff78e7ee5b08) by Bartlomiej Bloniarz)
- **Build**: Changed foojay-resolver-convention version to 1.0.0 ([664acaf441](https://github.com/facebook/react-native/commit/664acaf44188eaac8dbcadf7686dba397ffc035e) by [@TheNerdGuyLulu](https://github.com/TheNerdGuyLulu))
- **NavigationBar**: Respect theme `enforceNavigationBarContrast` attribute ([dfddcc9796](https://github.com/facebook/react-native/commit/dfddcc97969fb4ea5728c2bcc965a8a6126d03ba) by [@zoontek](https://github.com/zoontek))

#### iOS specific

- **Build**: Cache prebuilt iOS binaries ([9a0b05b8d0](https://github.com/facebook/react-native/commit/9a0b05b8d07f3468a08077119189406d56a230ba) by [@cipolleschi](https://github.com/cipolleschi))
- **Networking**: Add `RCTHTTPRequestInterceptor` for selective HTTP request modification ([0c7d780aa0](https://github.com/facebook/react-native/commit/0c7d780aa03e7a3fccd24553fdb59ce3219139b2) by [@cipolleschi](https://github.com/cipolleschi))
- **Networking**: Add `SRWebSocketProvider` for selective WebSocket header injection ([f3aa8c21d1](https://github.com/facebook/react-native/commit/f3aa8c21d1349b3c968c601ef89850427dfdcf64) by [@cipolleschi](https://github.com/cipolleschi))
- **React Native DevTools**: Derive inspector and debugger URL scheme from bundle URL to support HTTPS dev servers ([36dfcef023](https://github.com/facebook/react-native/commit/36dfcef023549ac2795fbd42467594f056f2630a) by [@cipolleschi](https://github.com/cipolleschi))

### Deprecated

- **JavaScript API**: Deprecated second argument for hook function passed to `AppRegistry.setComponentProviderInstrumentationHook` as it's not usable by apps. Passed stub that warns when used. ([64116117c0](https://github.com/facebook/react-native/commit/64116117c02d3b3d8026ee2ac85d03fc8370fbcd) by [@rubennorte](https://github.com/rubennorte))

### Fixed

- **Accessibility**: Fix `AccessibilityInfo.isDarkerSystemColorsEnabled` unresolved (never ending) promise ([8fbf2fab47](https://github.com/facebook/react-native/commit/8fbf2fab47b9675f99fed7ee881636da5333bf55) by [@chicio](https://github.com/chicio))
- **Accessibility**: Fix `AccessibilityInfo.isHighTextContrastEnabled` unresolved (never ending) promise ([5c9a5717c1](https://github.com/facebook/react-native/commit/5c9a5717c1a4d035a5059c3b6d53beb2a2b95ad6) by [@chicio](https://github.com/chicio))
- **Accessibility**: Fix `AccessibilityInfo.prefersCrossFadeTransitions` unresolved (never ending) promise ([57c073f0d7](https://github.com/facebook/react-native/commit/57c073f0d728575a43039e413ac5f0d6958e7e2f) by [@chicio](https://github.com/chicio))
- **Animated**: Fix 1-frame latency in C++ `NativeAnimatedNodesManager` for event-driven animations by processing the animation graph synchronously on every scroll event, matching the Java implementation behavior ([0517fb552d](https://github.com/facebook/react-native/commit/0517fb552d58d1e652724798be4a963fb9918206) by Mark Verlingieri)
- **Animated**: Fix typo "interpolation" to "interpolate" and add missing space in `AnimatedInterpolation` error messages ([a8b39a237c](https://github.com/facebook/react-native/commit/a8b39a237c2459a774e4ad9f4a514d0941b03169) by [@Nedunchezhiyan-M](https://github.com/Nedunchezhiyan-M))
- **Babel**: Prevent errors by handling contexts where the Babel API object is not provided ([63796a9160](https://github.com/facebook/react-native/commit/63796a9160f2da0cda438c52c6206c158adfc12a) by On Saint Tiong)
- **Build**: Fix incorrect package name and output filename in `scripts/js-api/README.md` ([d823f5b1cc](https://github.com/facebook/react-native/commit/d823f5b1cc4b26d1844058a7db01f3d7227f1afd) by [@Nedunchezhiyan-M](https://github.com/Nedunchezhiyan-M))
- **Codegen**: Respect enum values for TurboModule c++ codegen ([56129fedcb](https://github.com/facebook/react-native/commit/56129fedcb88d3b9e9a0e987a0562142bedfcd91) by [@akawrykow](https://github.com/akawrykow))
- **Documentation**: Correct the v0.85.0 changelog entry for the removal of `StyleSheet.absoluteFillObject`. ([fdbe0d0b63](https://github.com/facebook/react-native/commit/fdbe0d0b63e9c69b6375aafca6361107500a6311) by [@jingjing2222](https://github.com/jingjing2222))
- **Modal**: Forward `style` prop to Modal's inner container View with correct precedence so consumer styles are applied without overriding `transparent` or `backdropColor` ([f8fa76f94c](https://github.com/facebook/react-native/commit/f8fa76f94c37a97e0479f55e9945e1dd111a5567) by [@AnuMessi10](https://github.com/AnuMessi10))
- **React Native DevTools**: Add exponential backoff and exception handling to `InspectorPackagerConnection` reconnect loop to prevent heap fragmentation crashes ([32d3eafdc4](https://github.com/facebook/react-native/commit/32d3eafdc438eab517e84845ea9efe5165023c56) by [@shubhamksavita](https://github.com/shubhamksavita))
- **React Native DevTools**: Bump Hermes V1 to 250829098.0.14 to fix missing JavaScript samples in the Performance panel timeline on Apple platforms ([cd5b3b5fa5](https://github.com/facebook/react-native/commit/cd5b3b5fa576366723c4f73b98736c033856ac03) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Runtime**: Add missing `VIEW_EVENT_CASE` entries in `BaseViewProps::setProp` for Click, PointerDown, PointerUp, GotPointerCapture, LostPointerCapture and their Capture variants (offsets 30-37) ([8d5482dd94](https://github.com/facebook/react-native/commit/8d5482dd9452ee149b65c0ca5cffb1c96af29fc9) by Harini Malothu)
- **Runtime**: Fix crash in Performance API when sorting entries ([81c99682a4](https://github.com/facebook/react-native/commit/81c99682a49b57b90aa36db801ff578f53930a95) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Runtime**: Fix event timestamp injection overriding native timestamps with lowercase property name ([68debb27ff](https://github.com/facebook/react-native/commit/68debb27ff17ca3ca17404c5326afce888c444a2) by [@fkgozali](https://github.com/fkgozali))
- **Runtime**: Fix event timestamp propagation from host platforms to JS ([aa51746b87](https://github.com/facebook/react-native/commit/aa51746b87e5e04924e3fcfaf459f9bb1c9ca38e) by [@rubennorte](https://github.com/rubennorte))
- **Runtime**: Link VirtualView component ([de78906391](https://github.com/facebook/react-native/commit/de78906391935f46e84a198f5f5d64fc40826c44) by [@j-piasecki](https://github.com/j-piasecki))
- **Runtime**: `PerformanceObserver`: `observe({type: 'event'})` now correctly defaults `durationThreshold` to 104ms per the W3C Event Timing spec instead of reporting all events. ([65c561e195](https://github.com/facebook/react-native/commit/65c561e195285e1f1ea59bec72899dabf08502a6) by [@rubennorte](https://github.com/rubennorte))
- **Runtime**: Prevent Scheduler use-after-free crash when surfaces tear down with pending rendering updates ([aadbe96579](https://github.com/facebook/react-native/commit/aadbe965792bd900ca70412d6704b76e339d1aca) by [@fkgozali](https://github.com/fkgozali))
- **Runtime**: Prevent updates to mounted flag on the React revision ([7ee893d3be](https://github.com/facebook/react-native/commit/7ee893d3beb45b507712744f46f29b4ebba237e7) by [@j-piasecki](https://github.com/j-piasecki))
- **Runtime**: Support multiple old pseudo elements for same name but different source node ([370606dc5b](https://github.com/facebook/react-native/commit/370606dc5b6ea0fcfb119ac99c36008204154802) by [@zeyap](https://github.com/zeyap))
- **Runtime**: Use relevant revision as base for mounted flag updates ([4b954e14c8](https://github.com/facebook/react-native/commit/4b954e14c85ec5e1a8bf74ccdf17a959d82496ac) by [@j-piasecki](https://github.com/j-piasecki))
- **Runtime**: Views with a non-invertible transform (e.g. `scaleX: 0` or `scaleY: 0`) no longer receive touches on Android or iOS. ([1e8e182410](https://github.com/facebook/react-native/commit/1e8e1824106857864bf21cff422b691e763cb00e) by [@qflen](https://github.com/qflen))
- **TurboModules**: Bring back C++ Turbo Module example in RN Tester ([1c2cddad1a](https://github.com/facebook/react-native/commit/1c2cddad1a1c8c85d525740c0586c023c714122c) by [@christophpurrer](https://github.com/christophpurrer))
- **VirtualizedList**: Improve render area change with initialScrollIndex non zero test in VirtualizedList to avoid magic numbers timers ([9b966d1d8f](https://github.com/facebook/react-native/commit/9b966d1d8f705024dad39268c5f36ffd4042a227) by [@chicio](https://github.com/chicio))
- **Yoga**: Fixed Yoga node ownership when `display: contents` is used in absolutely positioned subtrees ([f2f92098dd](https://github.com/facebook/react-native/commit/f2f92098ddf996d3f75cfbaa143d7151c29776f7) by [@j-piasecki](https://github.com/j-piasecki))

#### Android specific

- **Accessibility**: Guard `ReactViewGroup.addChildrenForAccessibility` against transient non-descendant accessibility traversal crashes. ([e681736e18](https://github.com/facebook/react-native/commit/e681736e1838904155409e236c3c2fa630b71c9a) by [@erickreutz](https://github.com/erickreutz))
- **Build**: Fix build regression by using `rootProject.file` ([8a8f1b801c](https://github.com/facebook/react-native/commit/8a8f1b801c253a2e582e0d7615b67efe88328ca3) by [@etodanik](https://github.com/etodanik))
- **Hermes**: Fix `HermesSamplingProfiler.disable()` JNI registration calling `enable()` instead of `disable()` ([7f2a58e46c](https://github.com/facebook/react-native/commit/7f2a58e46cdf0fd797aa58c6b0c8035913d34402) by [@elirangoshen](https://github.com/elirangoshen))
- **Hermes**: Use Hermes V1 stable release instead of legacy nightly to fix startup crash caused by JSI ABI mismatch ([45ceacc08f](https://github.com/facebook/react-native/commit/45ceacc08f5c1e69f8f517afc7cd4f527283ea15) by [@cipolleschi](https://github.com/cipolleschi))
- **Image**: Fix image content disappearing on API 24 (Nougat) when antialiased border radius clipping is applied ([fdd6ca5bb1](https://github.com/facebook/react-native/commit/fdd6ca5bb11b105284c7ad977ff2208c2f2e66f2) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Image**: `Image.getSize` and `Image.getSizeWithHeaders` now return the true source dimensions instead of Fresco's downsampled values ([8823a8009b](https://github.com/facebook/react-native/commit/8823a8009b18950d5be2682a86cfcf0c7014a068) by [@zoontek](https://github.com/zoontek))
- **Image**: Make sure view width and height are non 0 before calling `createBitmap()` ([c20a58ab6b](https://github.com/facebook/react-native/commit/c20a58ab6b7fd21b0c61fc355b6cb629541c39e5) by [@zeyap](https://github.com/zeyap))
- **Legacy Architecture**: Fix `onHostPause` crash in `ReactInstanceManager` without feature flag ([3aa8a043de](https://github.com/facebook/react-native/commit/3aa8a043de283f539cc907c7a5368e61cecb35b9) by [@shubhamksavita](https://github.com/shubhamksavita))
- **LogBox**: Fixed activity context memory leak in `LogBoxDialogSurfaceDelegate` when using bridgeless mode ([f10cded1f8](https://github.com/facebook/react-native/commit/f10cded1f833bf0a143e736dfd364f5b405c648c) by Ilya Kovalyov)
- **Networking**: Blob content provider did not work in new arch ([05ea94c441](https://github.com/facebook/react-native/commit/05ea94c44106c8d4314edf2dcd5874f9eab6155d) by [@javache](https://github.com/javache))
- **Networking**: Catch `OutOfMemoryError` in `NetworkingModule` response processing to prevent app crashes ([0c153e2971](https://github.com/facebook/react-native/commit/0c153e2971db6edc9cdf363c93072488131a4340) by [@shubhamksavita](https://github.com/shubhamksavita))
- **Networking**: WebSocketModule no longer strips a `Cookie` header passed via the WebSocket constructor's `headers` option ([24b51db75b](https://github.com/facebook/react-native/commit/24b51db75b7f8eee666c9a3b6d13c6a29a7a759a) by [@psjostrom](https://github.com/psjostrom))
- **Runtime**: Fix `Dimensions` `window` values on Android < 15 when edge-to-edge is enabled ([44a4b1ba5d](https://github.com/facebook/react-native/commit/44a4b1ba5d0af29d4ed7e73807677eb4e8525e9f) by [@zoontek](https://github.com/zoontek))
- **Runtime**: Fix `KeyboardAvoidingView` on Android 15+ / with `edgeToEdgeEnabled` ([4a6c933cce](https://github.com/facebook/react-native/commit/4a6c933ccedd7efc8c21b71a101980a15c8525ce) by [@zoontek](https://github.com/zoontek))
- **Runtime**: Fix `measureInWindow` returning incorrect coordinates when edge-to-edge is enabled ([9d183675e9](https://github.com/facebook/react-native/commit/9d183675e9552043dd2d768d4fbac1760cdc9a59) by [@zoontek](https://github.com/zoontek))
- **Runtime**: Fix crash from stale preallocated view registry after concurrent render cancellation ([97cf2202ee](https://github.com/facebook/react-native/commit/97cf2202ee4b0f8c36716073509b50414e0f2c94) by [@javache](https://github.com/javache))
- **Runtime**: Gate diagnostic `printMountItem` calls in `MountItemDispatcher` error handlers behind `enableFabricLogs()` to prevent OOM crash ([7a546f98a7](https://github.com/facebook/react-native/commit/7a546f98a794ece46e12cd2c2a38454b79b08e9e) by [@JakobFelixJulius](https://github.com/JakobFelixJulius))
- **Runtime**: Handle edge-to-edge when it's not enabled by the `edgeToEdgeEnabled` gradle property but enforced by the OS (Android 15+) ([c2280e3201](https://github.com/facebook/react-native/commit/c2280e3201fdd468ae358cb577430b87949f05e5) by [@zoontek](https://github.com/zoontek))
- **Runtime**: Register `HeadlessJsTaskSupportModule` in `CoreReactPackage` ([2d78a39b3e](https://github.com/facebook/react-native/commit/2d78a39b3e1199c301696fa22ae54c2b868cc3f1) by 贾太滨)
- **Runtime**: Schedule React revision merge to happen on `DISPATCH_UI` choreographer queue, before dispatching events ([b63efbfc6b](https://github.com/facebook/react-native/commit/b63efbfc6b61b120d69b55cd37a9a92664af6928) by [@j-piasecki](https://github.com/j-piasecki))
- **ScrollView**: Dispatch FPS performance events for mouse wheel and trackpad scroll interactions in ScrollView ([e0a453c603](https://github.com/facebook/react-native/commit/e0a453c6037ceda3c739613a4a1609256db5e4e7) by [@Abbondanzo](https://github.com/Abbondanzo))
- **ScrollView**: Fix FPS performance listener being cleared on ScrollView recycle ([59ac1db76e](https://github.com/facebook/react-native/commit/59ac1db76e02ad1d4d7da918e71eb7a8452afe72) by [@Abbondanzo](https://github.com/Abbondanzo))
- **StatusBar**: StatusBar configuration now applies to Modal windows, fixing visual inconsistencies ([6614fe7f2b](https://github.com/facebook/react-native/commit/6614fe7f2b754a876bfce388895d9a538ce86135) by [@zoontek](https://github.com/zoontek))
- **Text**: Fix 1px text wrapping in absolutely positioned elements caused by fractional Yoga widths ([90c2c595da](https://github.com/facebook/react-native/commit/90c2c595dacb0dccddf075f5c52224a6a298d995) by [@clocksarestupid](https://github.com/clocksarestupid))
- **Text**: Fix BoringLayout crash when `isBoring()` returns negative width ([d527f2d663](https://github.com/facebook/react-native/commit/d527f2d663a514d5fe778022390c954e0b3e2588) by [@NickGerleman](https://github.com/NickGerleman))
- **Text**: Fix crash when measuring text in a stopped surface ([f71ec1a24e](https://github.com/facebook/react-native/commit/f71ec1a24eff3a63fd223c24b01ce25eac1631e9) by [@NickGerleman](https://github.com/NickGerleman))
- **TextInput**: Fix `setAutoCapitalize` stripping numeric `TextInput` flags (`TYPE_NUMBER_FLAG_SIGNED`/`DECIMAL`), affecting minus sign input on Samsung keyboards ([863f76bd49](https://github.com/facebook/react-native/commit/863f76bd490b2e7a9621f9a7c03d0b4295e32e60) by [@lukeharvey](https://github.com/lukeharvey))
- **TextInput**: KeyboardAvoidingView and TextInput auto-scroll not responding to IME height changes (e.g., when toggling emoji panel or predictive bar) ([ee1d067692](https://github.com/facebook/react-native/commit/ee1d0676920d75bfaa68e78602b10477b8b2187e) by [@alanleedev](https://github.com/alanleedev))
- **View**: Fixed a crash when clearing `zIndex` with props 2.0 enabled ([93b37350af](https://github.com/facebook/react-native/commit/93b37350afe8db7b4835ba59f40ea1e55e4a3045) by [@hannojg](https://github.com/hannojg))
- **View**: Fixed crash when enabling props 2.0 and setting `borderStyle` to `undefined` ([9e058db4c8](https://github.com/facebook/react-native/commit/9e058db4c8f1d2aa7ab632606b565f43e6664adc) by [@hannojg](https://github.com/hannojg))
- **View**: Unsupported background size value leading to crash ([fe046dc782](https://github.com/facebook/react-native/commit/fe046dc7822761322a2eea1bf0ba8a000a4ae8cc) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

#### iOS specific

- **Build**: Addressed -Wunreachable-code-return violations ([9172bfe647](https://github.com/facebook/react-native/commit/9172bfe647d7489bc9e0067f85752e3e30e557e0) by [@ingridwang](https://github.com/ingridwang))
- **Build**: Addressing -Wunreachable-code-return issues. ([722623aaeb](https://github.com/facebook/react-native/commit/722623aaebb10acb68b3de24449815c619722028) by [@ingridwang](https://github.com/ingridwang))
- **Build**: Fixed escaping local file URIs for unicode paths in ruby scripts ([9563cb5b5a](https://github.com/facebook/react-native/commit/9563cb5b5a546d6daf09abc9d5594850129a4ae3) by [@chrfalch](https://github.com/chrfalch))
- **Build**: Fixing unreachable-code-break ([795d902270](https://github.com/facebook/react-native/commit/795d9022707d543540217c72bf05d4e5893ecfe2) by [@ingridwang](https://github.com/ingridwang))
- **Build**: Made `ReactInternal` compatible with Swift ([fc5cc2821f](https://github.com/facebook/react-native/commit/fc5cc2821f6e0117c0ea1bb4e6c5c45f58a2a167) by [@rmaz](https://github.com/rmaz))
- **Build**: Persist `PODFILE_DIR` as `$(SRCROOT)`-relative so `project.pbxproj` is portable across machines ([44bb83bd84](https://github.com/facebook/react-native/commit/44bb83bd843a3b34779f1e7b1e09dbb3f4f38c6a) by [@zoontek](https://github.com/zoontek))
- **Build**: Removing unused ivars ([3d2d14df16](https://github.com/facebook/react-native/commit/3d2d14df1686590f701559319d4b46ad82fcab89) by [@ingridwang](https://github.com/ingridwang))
- **CocoaPods**: Fix Pod install checksum drifting ([814ebb12b6](https://github.com/facebook/react-native/commit/814ebb12b64cee51b91ada9fa0d90970feac9a9f) by [@chrfalch](https://github.com/chrfalch))
- **CocoaPods**: Fix `REACT_NATIVE_PATH` resolution when `Pods/` is a symlink ([ea383822b7](https://github.com/facebook/react-native/commit/ea383822b73c3c4e154336f087205ee53db99115) by [@huntie](https://github.com/huntie))
- **CocoaPods**: Fix React-CoreModules failing to compile with `use_frameworks!` due to missing React-featureflags header path ([fb0d28c6fd](https://github.com/facebook/react-native/commit/fb0d28c6fd7dd3ed961f7d96c7072cf37b2d228d) by [@radko93](https://github.com/radko93))
- **CocoaPods**: Load `RCTDefines.h` first in the prebuilt React umbrella and drop the `module *` submodule wildcard so RCT_* macros propagate to consumer pods under `use_frameworks!`. ([90c303fafb](https://github.com/facebook/react-native/commit/90c303fafb941155dbe379e6b3e74390a139872a) by [@wneel](https://github.com/wneel))
- **CocoaPods**: Preserve Expo-generated `React-use-frameworks.modulemap` across `replace-rncore-version.js` runs ([ada39220a0](https://github.com/facebook/react-native/commit/ada39220a0b67179f729a59a862cc8c18fdc5631) by [@Insik-Han](https://github.com/Insik-Han))
- **Dev Server**: Fix iOS dev-support IPv6 handling for packager and inspector connections. ([4a59f90c22](https://github.com/facebook/react-native/commit/4a59f90c22ea850946aba0326214e036a7a2019c) by [@hannojg](https://github.com/hannojg))
- **Hermes**: Fix compilation error in `createJSRuntimeFactory` and skip Hermes pods when `USE_THIRD_PARTY_JSC` is enabled ([2d8143794d](https://github.com/facebook/react-native/commit/2d8143794d3896f2217dc42dbe92b7fb091d2b81) by [@tux2nicolae](https://github.com/tux2nicolae))
- **Networking**: Fix crash in `RCTWebSocketModule` when delegate callbacks fire after module invalidation ([587ef059a2](https://github.com/facebook/react-native/commit/587ef059a2c26391cdd31d33fb610328906aea8c) by [@lukeharvey](https://github.com/lukeharvey))
- **React Native DevTools**: Fix inspector server host resolution for HTTPS bundle URLs by omitting default port ([3582a8b2b5](https://github.com/facebook/react-native/commit/3582a8b2b5bf220013e5965bcbfa81bd0ade1b83) by [@cipolleschi](https://github.com/cipolleschi))
- **TextInput**: Fix `NSRangeException` crash in `RCTBackedTextInputDelegateAdapter` when text range is out of bounds ([19350b1c8c](https://github.com/facebook/react-native/commit/19350b1c8c5c8390368f90dbc1f3ab78743bfe2e) by [@lukeharvey](https://github.com/lukeharvey))
- **View**: Fixes crash when changing the value of `removeClippedSubviews` ([91e3f773b7](https://github.com/facebook/react-native/commit/91e3f773b7e571a503b57e09a1cb8a44ff26cd1e) by [@javache](https://github.com/javache))

### Security

- **Dependencies**: Bumped `fast-xml-parser` from 4.5.0 to 4.5.4 to fix CVE-2026-25896 ([56908a74c7](https://github.com/facebook/react-native/commit/56908a74c7f79a45dae9c2f651e437399e7465fe) by [@balajacatherin](https://github.com/balajacatherin))
- **Dependencies**: Bumped `minimatch` to fix CVE-2026-27903, CVE-2026-27904 ([c019a50a4c](https://github.com/facebook/react-native/commit/c019a50a4ce3c7331921fc849a0719a216bb30b8) by [@balajacatherin](https://github.com/balajacatherin))

## v0.85.3

### Changed

- **React Native DevTools**: Update debugger-frontend from 8edd9be...194d3f8 ([9966cbdf4d](https://github.com/facebook/react-native/commit/9966cbdf4da99ee036a75bec4da9bb2e1ee7a9c4) by [@motiz88](https://github.com/motiz88))

### Fixed

- **Build**: Use pinned Hermes version when version.properties is not 1000.0.0 ([5e3a3ba995](https://github.com/facebook/react-native/commit/5e3a3ba995026b42c2ea0ad7ee4758fcf73005e6) by [@cipolleschi](https://github.com/cipolleschi))

#### iOS specific

- **Build**: Fix silent tar extraction failure on EdenFS in replace-rncore-version.js by extracting to a temp directory first ([9bc7d38be0](https://github.com/facebook/react-native/commit/9bc7d38be0771ae4006206fcb174956f53adf508) by [@motiz88](https://github.com/motiz88))
- **Build**: Skip prebuilds for DynamicFrameworks CI jobs ([753c19bea4](https://github.com/facebook/react-native/commit/753c19bea4ab854eb8000b2b5bab814261a46596) by [@motiz88](https://github.com/motiz88))

## v0.85.2

### Added

- **Animated**: Add pushAnimationMutations to AnimationBackend for targeted event-driven animation updates ([e4f0509973](https://github.com/facebook/react-native/commit/e4f0509973241d43f969401f81e85f0cd25ccc94) by Bartlomiej Bloniarz)

### Fixed

- **Animated**: Fix potential data corruption in animation backend when ShadowTree commits are retried by copying RawProps instead of moving them ([77d3df8cab](https://github.com/facebook/react-native/commit/77d3df8cab3dccfd4fefad6a80603fadcfc45106) by Bartlomiej Bloniarz)

#### iOS specific

- **Dev Server**: Fix "Loading from Metro..." banner getting stuck after reloads in quick succession ([e122c24c27](https://github.com/facebook/react-native/commit/e122c24c273f5fb6e0a2d6b1c961d75ac9bc90b7) by [@alanjhughes](https://github.com/alanjhughes))

## v0.85.1

### Fixed

- **Animated**: Share animation backend enabled as experimental([401b1620dc](https://github.com/facebook/react-native/commit/401b1620dc674b3f7b9e88a783baca68a2f94ebc) by [@cortinico](https://github.com/cortinico))

#### Android specific

- **Networking**: FormData uploads broken in debug builds ([0d1b70ee22](https://github.com/facebook/react-native/commit/0d1b70ee225a2e9970364ddda323071aa0a7e485) by [@riteshshukla04](https://github.com/riteshshukla04))

## v0.85.0

### Breaking

- **Animated**: Fix unsafe rawPointer access in cloneMultiple. ([1d47693230](https://github.com/facebook/react-native/commit/1d476932305f2563d773eb04f0f78a9bdd2525e1) by [@coado](https://github.com/coado))
- **Build**: Drop support for EOL Node.js lines and old minors. ([c9c601d61a](https://github.com/facebook/react-native/commit/c9c601d61af836d26ab628c2c8a30bae713ef010) by [@robhogan](https://github.com/robhogan))
- **Jest**: Move Jest preset to new `react-native/jest-preset` package ([c4ae05534a](https://github.com/facebook/react-native/commit/c4ae05534ad5b6e6def35e736764f64b1f145a2b) by [@kitten](https://github.com/kitten))
- **StyleSheet**: Remove deprecated `StyleSheet.absoluteFillObject` API ([5681db09b8](https://github.com/facebook/react-native/commit/5681db09b875e8c2b59b14df2300bad2b68d8a17) by [@huntie](https://github.com/huntie))
- **TypeScript**: Removing deprecated type aliases. Use the type directly. ([1813df743d](https://github.com/facebook/react-native/commit/1813df743db3852f3b667e36c31d564867c257fc) by [@sammy-SC](https://github.com/sammy-SC))
- **TypeScript**: Removing deprecated type aliases. Use the type directly. ([796a9a8922](https://github.com/facebook/react-native/commit/796a9a892283feeb01e9ded21c40dc91409c1499) by [@sammy-SC](https://github.com/sammy-SC))

#### Android specific

- **Events**: Re-added `receiveTouches` to `RCTEventEmitter` with a default no-op implementation to avoid breaking ecosystem libraries ([67db89d08a](https://github.com/facebook/react-native/commit/67db89d08aa2aaaed6ff270032024fee1dcad531) by [@javache](https://github.com/javache))
- **Legacy Architecture**: Deprecated UIManagerHelper.getEventDispatcherForReactTag and UIManagerHelper.getEventDispatcher(ReactContext, UIManagerType Int), use getEventDispatcher ([4e5d45f4db](https://github.com/facebook/react-native/commit/4e5d45f4dbea143b72925078c65ab2ad4846dfd3) by [@javache](https://github.com/javache))
- **Legacy Architecture**: Stub UIImplementation class, this class is unused in the new architecture ([fbe15f6605](https://github.com/facebook/react-native/commit/fbe15f6605bb99c451d1105bcac72af7692182fe) by [@mdvacca](https://github.com/mdvacca))
- **Text**: Make ReactTextUpdate internal ([faebee4338](https://github.com/facebook/react-native/commit/faebee4338e5842b2dd915eede0ee049d4fd7368) by [@NickGerleman](https://github.com/NickGerleman))

### Added

- **Animated**: `RCTAnimationChoreographer` to `RCTScheduler` ([019c9a7d8f](https://github.com/facebook/react-native/commit/019c9a7d8f56fe895253de8487b4c6d0d76f85be) by Bartlomiej Bloniarz)
- **Animated**: `std::mutex` to `AnimationBackend` to protect `start`, `stop` and `callbacks`. ([4064b89867](https://github.com/facebook/react-native/commit/4064b89867cb7424fd02433c6d597e534bfc8cbc) by Bartlomiej Bloniarz)
- **Animated**: Add c++ AnimatedModule to DefaultTurboModules ([15e52e3f71](https://github.com/facebook/react-native/commit/15e52e3f71e7199808686e2b86ea54dcb2495b71) by [@zeyap](https://github.com/zeyap))
- **Animated**: Added support for transform operations. ([58b7b052c0](https://github.com/facebook/react-native/commit/58b7b052c092e79277ab026ea6dd4f78021ed6c5) by [@coado](https://github.com/coado))
- **Animated**: Animated calls `AnimationBackend::trigger` to push updates from. events to the mounting layer ([ac06f3bdc7](https://github.com/facebook/react-native/commit/ac06f3bdc76a9fd7c65ab899e82bff5cad9b94b6) by Bartlomiej Bloniarz)
- **Animated**: Animated can now prompt the backend to push changes to the shadowTree on the JS thread, making RSNRU update the ShadowNode references held by the react renderer. ([f9e94c0502](https://github.com/facebook/react-native/commit/f9e94c050251c67bf0d2c806738b8c6e59bb59d5) by Bartlomiej Bloniarz)
- **Animated**: Animation Backend examples in RNTester ([149a4b8dcd](https://github.com/facebook/react-native/commit/149a4b8dcde07df9c2f4d8456463ad242a2cb842) by Bartlomiej Bloniarz)
- **Animated**: AnimationBackend docs ([f3678f51d9](https://github.com/facebook/react-native/commit/f3678f51d9873cb19602d7e36a4d8ed71562b9d0) by Bartlomiej Bloniarz)
- **Animated**: AnimationBackend now cleans-up the AnimatedPropsRegistry after the js sync when `updateRuntimeShadowNodeReferencesOnCommitThread` is enabled ([b38428c9bc](https://github.com/facebook/react-native/commit/b38428c9bc9ad2e62a4cedf2240d44eb7a5b52df) by Bartlomiej Bloniarz)
- **Animated**: Moved `shadowNodeFamily_` from a map in `NativeAnimatedNodesManager` to `PropsAnimatedNode` ([af96497b54](https://github.com/facebook/react-native/commit/af96497b543a44c5ce93464346d853b50159432a) by Bartlomiej Bloniarz)
- **Animated**: Updated `AnimationBackend` usages to use `AnimationTimestamp` ([2a4a54ae6c](https://github.com/facebook/react-native/commit/2a4a54ae6c92c9fbf8601601aae50fd1f1115871) by Bartlomiej Bloniarz)
- **Animated**: Upstream useAnimatedColor and useAnimatedValueXY ([b92d37879e](https://github.com/facebook/react-native/commit/b92d37879e8e6ca5dbb3c0047a50b20ae6286bc5) by [@zeyap](https://github.com/zeyap))
- **Dev Server**: Make metro accept tls server config ([8915d81a5b](https://github.com/facebook/react-native/commit/8915d81a5bae5b37247ab56bf9f1b4aace189b9c) by [@vzaidman](https://github.com/vzaidman))
- **Feature Flags**: Create featureflag viewTransitionEnabled ([d7a1d080c2](https://github.com/facebook/react-native/commit/d7a1d080c242300986935f64ac7906924a5f7189) by [@zeyap](https://github.com/zeyap))
- **JavaScript API**: Added `EventEmitter` to `react-native` exports. ([f7cd8c4c1c](https://github.com/facebook/react-native/commit/f7cd8c4c1ccc7738fcfea193019f190d4a6effb2) by [@yungsters](https://github.com/yungsters))
- **Pressable**: Added tests for `Pressability` `onHoverOut` property ([de5994817d](https://github.com/facebook/react-native/commit/de5994817d8214cae217fca583f89a71c08d7b40) by [@chicio](https://github.com/chicio))
- **React Native DevTools**: Added missing tests for Standalone fusebox shell ([e5d720d98d](https://github.com/facebook/react-native/commit/e5d720d98d55b1f23e49d3820df6957063a1d1a7) by [@chicio](https://github.com/chicio))
- **React Native DevTools**: Support multiple CDP connections to one React Native Host (diff 1 of 2) ([534c06f3c8](https://github.com/facebook/react-native/commit/534c06f3c85394c8294f080e57ffb76dc655fb74) by [@motiz88](https://github.com/motiz88))
- **React Native DevTools**: Support multiple CDP connections to one React Native Host (diff 2 of 2) ([f04659972c](https://github.com/facebook/react-native/commit/f04659972c0996ada70ded2cf1456865cf3a7f32) by [@motiz88](https://github.com/motiz88))
- **Runtime**: Added a synchronization mechanism for the layout information between the React branch and the main branch of the ShadowTree ([c8d498d62d](https://github.com/facebook/react-native/commit/c8d498d62d73ea8d58a6017bd0283e43d78d2c8a) by [@j-piasecki](https://github.com/j-piasecki))
- **TextInput**: TextInput onChange event now includes selection data (cursor location) on iOS and Android ([162627af7c](https://github.com/facebook/react-native/commit/162627af7c53e27433f39f82c4630baff0695bf1) by [@alanleedev](https://github.com/alanleedev))
- **TextInput**: TextInput onChange event types now include optional selection data ([c1f5445f4a](https://github.com/facebook/react-native/commit/c1f5445f4a59d0035389725e47da58eb3d2c267c) by [@alanleedev](https://github.com/alanleedev))
- **TypeScript**: Add missing `onPressMove` prop to `<Pressable />` ([d07318226d](https://github.com/facebook/react-native/commit/d07318226d4b8d66e1bd55c9b683d1715c39b84e) by [@retyui](https://github.com/retyui))

#### Android specific

- **Animated**: Decouple ReactScrollViewHelper from kt NativeAnimated ([0cde8ed0bb](https://github.com/facebook/react-native/commit/0cde8ed0bb6bbd8159f5b07405ed8e5a685ed3eb) by [@zeyap](https://github.com/zeyap))
- **Build**: Allow specifying dev server ip via gradle property ([6f54846a08](https://github.com/facebook/react-native/commit/6f54846a08025c05ab7c7bf514f189085cde7b18) by [@amartinz](https://github.com/amartinz))
- **Build**: Re-added prefabPublishing=true to make Android build from source work again ([e8eb37414e](https://github.com/facebook/react-native/commit/e8eb37414ed34c360eef6bf988d8cee445e6e72b) by [@chrfalch](https://github.com/chrfalch))
- **Dev Server**: Make DevSupportHttpClient public for custom dev-support HTTP header registration ([58d94863f8](https://github.com/facebook/react-native/commit/58d94863f896a64e3ab176008d4141a0a68da71f) by [@cortinico](https://github.com/cortinico))
- **Dev Server**: Public DevSupportRequestHeaders API for registering custom dev-support HTTP headers ([e0d34b254a](https://github.com/facebook/react-native/commit/e0d34b254aca4b695c2eda24f1fb086ee3a037f6) by [@cortinico](https://github.com/cortinico))
- **React Native DevTools**: Restore request payload previews on Android ([cc44e96e0b](https://github.com/facebook/react-native/commit/cc44e96e0bc7f82a1729301dce7c4ca5a5e11f65) by [@huntie](https://github.com/huntie))
- **Runtime**: Add `StateWrapper` to C++ fbjni types ([99b328bffa](https://github.com/facebook/react-native/commit/99b328bffae134430e864af999237c3c39170c5a) by [@mrousavy](https://github.com/mrousavy))
- **ScrollView**: Add `scrollsChildToFocus` prop to ScrollView to control automatic scrolling when a child receives focus ([d9ee4bb0aa](https://github.com/facebook/react-native/commit/d9ee4bb0aa55a71fd2328a8b9dfdca56a4a1e75a) by [@johankasperi](https://github.com/johankasperi))
- **Text**: `ReactFontManager.customFontFamilies` property to query registered custom font family names ([c3acbc424d](https://github.com/facebook/react-native/commit/c3acbc424da9b044957d5a35c4a2d4a1254a3729) by [@vonovak](https://github.com/vonovak))
- **Text**: Add Unstable DrawCommandSpan Usable with PreparedLayoutTextView ([ad8ac5e176](https://github.com/facebook/react-native/commit/ad8ac5e17602919ac3a6c287d176cd07d8fd18f9) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- **Build**: Added support for clang virtual file system in React.XCFramework ([f0422abd23](https://github.com/facebook/react-native/commit/f0422abd23b87d086d02a5afd6b8b9f300528137) by [@chrfalch](https://github.com/chrfalch))

### Changed

- **Animated**: `AnimationChoreographer` interface with an implementation for fantom tests ([f8564b47fd](https://github.com/facebook/react-native/commit/f8564b47fd742bce3dc68b129ea0d4ae04e61bc3) by Bartlomiej Bloniarz)
- **Animated**: Enable -DRN_USE_ANIMATION_BACKEND by default ([4cfb2ee468](https://github.com/facebook/react-native/commit/4cfb2ee46831b57987873b1d7ce6306778463afd) by [@zeyap](https://github.com/zeyap))
- **Build**: Metro bump to ^0.84.0 ([58ed78fec1](https://github.com/facebook/react-native/commit/58ed78fec1714003c25311def5e95d4d212337d7) by [@robhogan](https://github.com/robhogan))
- **Dev Server**: `createDevMiddleware` now accepts `string | URL` for `serverBaseUrl` ([10709f427d](https://github.com/facebook/react-native/commit/10709f427d164ed07fbd9e462334c9a0cb9bceb5) by [@emily8rown](https://github.com/emily8rown))
- **Dev Server**: Remove "JavaScript logs have moved!" notice from dev server CLI ([4bd62a1d41](https://github.com/facebook/react-native/commit/4bd62a1d41417b9feaeef2a5e03532ef66587f9d) by [@huntie](https://github.com/huntie))
- **Hermes**: Bump hermes version ([4379f21bd7](https://github.com/facebook/react-native/commit/4379f21bd7f04f977f0dc7bfe1efa55400cf52e0) by [@alanleedev](https://github.com/alanleedev))
- **Hermes**: Do not use hermesNightly on the release branch ([c35a22db2b](https://github.com/facebook/react-native/commit/c35a22db2b1427e7e4fe404dfc10cc711a7558f8) by [@cortinico](https://github.com/cortinico))
- **Hermes**: Introduce 'Determine Hermes build flag' step ([111bd59db5](https://github.com/facebook/react-native/commit/111bd59db5ddeb2201de7f88fce14d2f4223432e) by [@fabriziocucci](https://github.com/fabriziocucci))
- **JavaScript API**: Changed Flow type for `URL` constructor to accept `URL` as first argument, matching the second argument type ([678f7a9cfb](https://github.com/facebook/react-native/commit/678f7a9cfb01efc97c66ba2c178dbaa7b2837be5) by [@emily8rown](https://github.com/emily8rown))
- **Pressable**: `Pressable` no longer unmounts event listeners in a hidden `Activity`. ([c295ec2261](https://github.com/facebook/react-native/commit/c295ec22617985b757775bfcca75a4ea9471a689) by [@yungsters](https://github.com/yungsters))
- **Pressable**: Migrated `Pressability` tests to Jest modern timers ([7dd2d255de](https://github.com/facebook/react-native/commit/7dd2d255deaecf20101675cb4a616226e48a80d7) by [@chicio](https://github.com/chicio))
- **React Native DevTools**: Changed debugger proxy to only permit connections from localhost. ([f34b8702db](https://github.com/facebook/react-native/commit/f34b8702dbb3843429a76779ca0800e99d5cfa10) by [@yungsters](https://github.com/yungsters))
- **React Native DevTools**: Enable native macOS window merging ([34b3c108bc](https://github.com/facebook/react-native/commit/34b3c108bcd57c9466e8fd74e5588832d1bd864b) by [@huntie](https://github.com/huntie))
- **React Native DevTools**: Extracting shared logic for fuseboxSessionObserver into reusable components ([b0013ea22a](https://github.com/facebook/react-native/commit/b0013ea22a70f28efe02425f0faa58ac404b9f6e) by [@emily8rown](https://github.com/emily8rown))
- **React Native DevTools**: Page targets returned from `/json/list` will no longer set `prefersFuseboxFrontend` ([421de23470](https://github.com/facebook/react-native/commit/421de234700805cec1277940187020e6baa5c8eb) by [@huntie](https://github.com/huntie))
- **React Native DevTools**: Suppress LogBox warnings and errors during CDP performance tracing ([a308014d87](https://github.com/facebook/react-native/commit/a308014d879dffc142335aff344ace2bfd77eb26) by [@emily8rown](https://github.com/emily8rown))
- **React**: Make React Native consume 250829098.0.6 ([4fb33022bc](https://github.com/facebook/react-native/commit/4fb33022bc57dd719ce46a1a074b029cdfd8ff24) by [@cipolleschi](https://github.com/cipolleschi))
- **Runtime**: `cancelAnimationFrame`, `clearImmediate`, `clearTimeout` and  `clearInterval` do nothing If there is no callback associated the given handle ([9d3cc383ba](https://github.com/facebook/react-native/commit/9d3cc383ba9b45ef28721a1ae81b2d0429363bf5) by [@retyui](https://github.com/retyui))
- **Runtime**: Changed how React changes are commited to the Shadow Tree (behind a feature flag) ([45b4817414](https://github.com/facebook/react-native/commit/45b4817414928c9bfa0b055bb09533ac177cada6) by [@j-piasecki](https://github.com/j-piasecki))
- **Runtime**: Importing `hairlineWidth` no longer eagerly initializes the `PixelRatio` TurboModule. ([e11a2f07e8](https://github.com/facebook/react-native/commit/e11a2f07e8fd962adb76ff55a9b159e8ca3ae51f) by [@yungsters](https://github.com/yungsters))
- **Runtime**: Logs created by `console.error` that begin with "Warning: " will no longer be treated as warnings. These call sites should migrate to using `console.warn` instead. ([5ab418460b](https://github.com/facebook/react-native/commit/5ab418460b573a02feb5e394392ac87a8b79848b) by [@yungsters](https://github.com/yungsters))
- **Runtime**: Refactor how shadow tree revisions are promoted as latest for JS consistency ([4a7bc4c0e7](https://github.com/facebook/react-native/commit/4a7bc4c0e7424bf0dcea9ae2a3c1ce3e4cbb1333) by [@j-piasecki](https://github.com/j-piasecki))
- **Runtime**: The JS revision merge now is scheduled on the main thread ([47e5e6c394](https://github.com/facebook/react-native/commit/47e5e6c3945b97fd64b9dd0465a30b42259d6157) by [@j-piasecki](https://github.com/j-piasecki))
- **Text**: Text Can Conditionally Use "RCTSelectableText" Native Component ([a175bff10a](https://github.com/facebook/react-native/commit/a175bff10a459005504ba037ab6eede0d2724e29) by [@NickGerleman](https://github.com/NickGerleman))
- **Text**: Text outside the bounds of a borderRadius is now hidden by default ([2111bec8d5](https://github.com/facebook/react-native/commit/2111bec8d5044486f5f123949b32dc58657a21ab) by [@NickGerleman](https://github.com/NickGerleman))
- **TypeScript**: Transform `$Values` to `Values` ([94383613d8](https://github.com/facebook/react-native/commit/94383613d8a836682a4789ce7528b05b4a2b1c3d) by [@marcoww6](https://github.com/marcoww6))
- **TypeScript**: Transform `mixed` to `unknown` in xplat/js ([625d702fec](https://github.com/facebook/react-native/commit/625d702fec0d0aa29953a8152219f9651f490dcd) by [@marcoww6](https://github.com/marcoww6))
- **TypeScript**: Transform $ReadOnly to Readonly 38/n ([41efc3b588](https://github.com/facebook/react-native/commit/41efc3b5886e285b9b660fa4504f759eeac796c4) by [@marcoww6](https://github.com/marcoww6))
- **TypeScript**: Transform $ReadOnlyArray to ReadonlyArray 17/n ([7051a07c63](https://github.com/facebook/react-native/commit/7051a07c637bc221889eba5017d62600cca7701d) by [@marcoww6](https://github.com/marcoww6))
- **TypeScript**: Transform $ReadOnlyArray to ReadonlyArray 18/n ([92c32780f1](https://github.com/facebook/react-native/commit/92c32780f1842be4d0bb82ca06f66cf3d2ea4011) by [@marcoww6](https://github.com/marcoww6))
- **TypeScript**: Transform all remaining utility types ([cd3a9c55c1](https://github.com/facebook/react-native/commit/cd3a9c55c109e7312152653f8a4ccacc58ddf0f8) by [@marcoww6](https://github.com/marcoww6))
- **TypeScript**: Transform mixed to unknown ([60f9bfd546](https://github.com/facebook/react-native/commit/60f9bfd5469c9de61559cb4d5941748394fd5a19) by [@marcoww6](https://github.com/marcoww6))
- **Yoga**: Migrate `YogaNode` to Kotlin ([cd27b7e1a8](https://github.com/facebook/react-native/commit/cd27b7e1a85c89423f88b9ab0e53f620a146b9a0) by [@mateoguzmana](https://github.com/mateoguzmana))

#### Android specific

- **Animated**: Log error when unsupported type is passed to interpolation outputRange ([30fd0c4ac8](https://github.com/facebook/react-native/commit/30fd0c4ac82edb8716c8b05239ae55909bc83b12) by [@zeyap](https://github.com/zeyap))
- **Build**: Add Sonatype Central repository for users of nightly builds only ([47c3ebe23f](https://github.com/facebook/react-native/commit/47c3ebe23f201f012dc077293065090d5a16de61) by [@sergeich](https://github.com/sergeich))
- **Build**: Gradle to 9.3.1 ([319e589d3d](https://github.com/facebook/react-native/commit/319e589d3d15f226f29bced5bb66d4aa3c63ef10) by [@cortinico](https://github.com/cortinico))
- **i18n**: Translation auto-update for batch 0/61 on master ([26da0fa509](https://github.com/facebook/react-native/commit/26da0fa50995d6ba33fbfafeb74d31e5115869c5) by Intl Scheduler)
- **React Native DevTools**: CDP: The`deviceName` field in app metadata is now prefixed with the manufacturer ([9b906753d9](https://github.com/facebook/react-native/commit/9b906753d9ac44e84bdd46ba6868f9a16604a5e7) by [@huntie](https://github.com/huntie))
- **Runtime**: Updated documentation for GuardedFrameCallback class ([dfcb56dfea](https://github.com/facebook/react-native/commit/dfcb56dfea3b71a091e2b84bd27b1ca7bde7724f) by [@mdvacca](https://github.com/mdvacca))
- **ScrollView**: Updated the `nestedScrollEnabled` prop to default to true if the ScrollView defines a `refreshControl` ([95bac85b5a](https://github.com/facebook/react-native/commit/95bac85b5a8bba67289a503544a00615b3506047) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Text**: Merge ReactTextAnchorViewManager into ReactTextViewManager ([f67f6a2448](https://github.com/facebook/react-native/commit/f67f6a244852b22bf8dcd79a3269073143aeba58) by [@NickGerleman](https://github.com/NickGerleman))
- **Yoga**: Migrate `YogaConfigJNIBase` to Kotlin ([9db85e7503](https://github.com/facebook/react-native/commit/9db85e75037656616cc396ea34a6cf5f087c4da4) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Yoga**: Migrate `YogaProps` to Kotlin ([2e12cbdfb3](https://github.com/facebook/react-native/commit/2e12cbdfb396ca865d3088caf9aba3acf153a0b9) by [@mateoguzmana](https://github.com/mateoguzmana))

#### iOS specific

- **Build**: Bump fmt to 12.1.0 to fix Xcode 26.4 ([faeef2b90a](https://github.com/facebook/react-native/commit/faeef2b90a56633ad44289b994d31e7ce590b145) by [@leotm](https://github.com/leotm))
- **Build**: Changed umbrella header template to use angled import syntax ([2b66a9a622](https://github.com/facebook/react-native/commit/2b66a9a622ada3b540e1466d1dea61f2404d34ab) by [@chrfalch](https://github.com/chrfalch))

### Deprecated

- **Accessibility**: Deprecated `AccessibilityInfo.setAccessibilityFocus` in favor of `AccessibilityInfo.sendAccessibilityEvent` ([36a0d9ef63](https://github.com/facebook/react-native/commit/36a0d9ef63b5ecb1cdf62d6d56b420f484bfa037) by [@Abbondanzo](https://github.com/Abbondanzo))

#### Android specific

- **Legacy Architecture**: Deprecate NativeViewHierarchyOptimizer as part of Legacy Architecture cleanup ([352d73bef0](https://github.com/facebook/react-native/commit/352d73bef0663643a976e947aa3dd40d20542498) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- **Runtime**: Deprecate `RCTHostRuntimeDelegate` and merge into `RCTHostDelegate` ([4626732f5b](https://github.com/facebook/react-native/commit/4626732f5b0558ee9bc661deba09e531b96b9b87) by [@tsapeta](https://github.com/tsapeta))

### Removed

- **Animated**: `AnimationBackendChoreographer`, `AndroidAnimationChoregrapher` ([bb7c0f7c5f](https://github.com/facebook/react-native/commit/bb7c0f7c5f5d8648a1feddf42a6927d7eb0e6299) by Bartlomiej Bloniarz)
- **Legacy Architecture**: Stub UIViewOperationQueue and remove its usages ([7de3dbe1c8](https://github.com/facebook/react-native/commit/7de3dbe1c864c7159034287960befd8756aac69e) by [@mdvacca](https://github.com/mdvacca))

#### Android specific

- **Legacy Architecture**: Remove deprecated CatalystInstanceImpl ([0889f7d774](https://github.com/facebook/react-native/commit/0889f7d774138596b8a6c510424fe151fea09a50) by [@mdvacca](https://github.com/mdvacca))
- **Legacy Architecture**: Removed Paper-specific event dispatching methods. ([05d64d9316](https://github.com/facebook/react-native/commit/05d64d9316fa43838438673a8041e557e33d030a) by [@javache](https://github.com/javache))
- **Legacy Architecture**: Stub out NativeViewHierarchyManager (Legacy Architecture) ([c2156a835f](https://github.com/facebook/react-native/commit/c2156a835ffc2d1d6f15d7b28cbc59bd8a9720ec) by [@mdvacca](https://github.com/mdvacca))
- **Text**: Remove Deprecated ReactTextInputShadowNode ([d5399dd40d](https://github.com/facebook/react-native/commit/d5399dd40d8f939f3009288a4b69f7ab5282e89d) by [@NickGerleman](https://github.com/NickGerleman))
- **View**: Removed support for ReactZIndexedViewGroup ([81acf78f81](https://github.com/facebook/react-native/commit/81acf78f81ebde3bc6aa06c817e490e858a33e67) by [@javache](https://github.com/javache))

### Fixed

- **Animated**: (animationbackend) add default in switch statements ([66f6146f6f](https://github.com/facebook/react-native/commit/66f6146f6f0689c54034aa2615f4cdc5c89cbd5d) by [@zeyap](https://github.com/zeyap))
- **Animated**: Fixed TypeError when serializing arbitrary transform operation ([8067f7b353](https://github.com/facebook/react-native/commit/8067f7b3533de890f80afad86ece12f0d83d1d8c) by [@coado](https://github.com/coado))
- **Babel**: Babel-preset: Don't override explicitly-passed `dev` config if obsolete `withDevTools` is missing ([c5a38ab285](https://github.com/facebook/react-native/commit/c5a38ab2859ba64f424655948fd2cd76159b272a) by [@robhogan](https://github.com/robhogan))
- **Babel**: Fix Babel transformer changing `BABEL_ENV` as a side effect ([88d40dcda3](https://github.com/facebook/react-native/commit/88d40dcda3f44f64a295bce6560f86fab39962f4) by [@robhogan](https://github.com/robhogan))
- **Build**: Fix test build breaks after GoogleTest update ([2a776b1f65](https://github.com/facebook/react-native/commit/2a776b1f657235246843ec3f4ff24fc0a583e6c1) by Tal Benesh)
- **CI**: Typo on maestro ios gh action for jdk step ([0344c0c9cb](https://github.com/facebook/react-native/commit/0344c0c9cb67643c54a6e110e5b9bdd9c3da5e77) by [@gkartalis](https://github.com/gkartalis))
- **Image**: When using Image with a `uri`, `width` and `height` the default dimensions were being lost ([dd3c20057b](https://github.com/facebook/react-native/commit/dd3c20057b3b550797750d9f9aefe3468a736aa9) by [@javache](https://github.com/javache))
- **LogBox**: Fix TypeError in LogBoxInspectorReactFrames on Windows/macOS ([995879ca9b](https://github.com/facebook/react-native/commit/995879ca9b30f160e0d7b0e7143227130a2fd9a3) by [@jisoo-hisoo](https://github.com/jisoo-hisoo))
- **React Native DevTools**: Reaching Metro from Debugger on urls other than localhost:8081 and 127.0.0.1:8081. ([3c7b4881dd](https://github.com/facebook/react-native/commit/3c7b4881dde4cb417bedea7f3c28aa98c3500c13) by [@vzaidman](https://github.com/vzaidman))
- **React Native DevTools**: Send network events to all CDP clients with the Network domain enabled ([93a43c90ce](https://github.com/facebook/react-native/commit/93a43c90ce35ca346319b9877dbfbe0c971b5b41) by [@motiz88](https://github.com/motiz88))
- **Runtime**: Fixed crash in `cloneMultiple` when families have no path to root ([54b4cb5e89](https://github.com/facebook/react-native/commit/54b4cb5e8926770935f2c482b5f2fbdac66d2d83) by [@coado](https://github.com/coado))
- **TextInput**: Fix memory leak in TextInput ([5229e507e1](https://github.com/facebook/react-native/commit/5229e507e1a1cb0cff00ab49fb21f9d47438582d) by [@mobinni](https://github.com/mobinni))
- **TextInput**: Fixed isFocused false positive ([42cd0f0414](https://github.com/facebook/react-native/commit/42cd0f04148ad7760e5c2099954b6912d02b35c4) by [@chicio](https://github.com/chicio))
- **Yoga**: Fix CQS signal modernize-use-designated-initializers in xplat/yoga/yoga/algorithm ([4ef7ac3136](https://github.com/facebook/react-native/commit/4ef7ac3136e500fdd400e05d283d2e6abfcbeec5) by generatedunixname1587093422349604)

#### Android specific

- **Accessibility**: Properly set view.setEnabled() based on accessibilityState.disabled ([fc66884d73](https://github.com/facebook/react-native/commit/fc66884d7350230f0b682b6d0394a922d5409196) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Accessibility**: Reset isClickable to false when recycling views to avoid accessibility tools finding views with incorrect state ([07c0539cb8](https://github.com/facebook/react-native/commit/07c0539cb81d02d69e20d3733e479228e7bc8469) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Accessibility**: Reset OnClickListener to null when recycling views to avoid accessibility tools finding views with incorrect state ([04bdebc585](https://github.com/facebook/react-native/commit/04bdebc585840c6a4b72be435a7f399082319da9) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Accessibility**: Set accessibilityRole to "link" for pressable Text components by default ([68e5b4ee9f](https://github.com/facebook/react-native/commit/68e5b4ee9f9c5bc4b1b1d38595320054e5b54fd5) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Animated**: Fix null pointer crash in FabricUIManagerBinding::driveCxxAnimations by adding null check for scheduler ([349cf1595b](https://github.com/facebook/react-native/commit/349cf1595bd0135e07862d4f51b2eb2eda610db4) by Dileep Siva Sai Nallabothu)
- **Animated**: Prevent Native Animated tracking spring crash when tracked `toValue` node is detached. ([45de7109fe](https://github.com/facebook/react-native/commit/45de7109fe93db8052e9ba06e53807f89cbd7fd9) by [@kmsbernard](https://github.com/kmsbernard))
- **Build**: Fix included-build `gradle.properties` resolution for monorepos by reading from parent Gradle start parameters (`projectDir`/`currentDir`) before falling back to `../../android/gradle.properties`, so `hermesV1Enabled` can be inherited correctly. ([c5ae0c820a](https://github.com/facebook/react-native/commit/c5ae0c820a571141a43de980cb011d232fc2268f) by [@Titozzz](https://github.com/Titozzz))
- **Codegen**: Validate module names in codegen ([a748a405b6](https://github.com/facebook/react-native/commit/a748a405b66546367f0160425d135be88812763d) by [@RSNara](https://github.com/RSNara))
- **Dev Server**: Sync bundling progress between Metro cli and app hints ([56e1710b73](https://github.com/facebook/react-native/commit/56e1710b73f0011516872bc6a62e52626588839c) by [@vzaidman](https://github.com/vzaidman))
- **Hermes**: Fixed so that all build types get the HERMES_V1_ENABLED flag ([8d68b11005](https://github.com/facebook/react-native/commit/8d68b110059fbd0b6e5da24e7ead66554262af60) by [@chrfalch](https://github.com/chrfalch))
- **Hermes**: Provide symbol fallbacks for `inspector-modern/chrome/Registration.h` when HermesV1 is disabled. ([5ee695ad8f](https://github.com/facebook/react-native/commit/5ee695ad8f41d7c9a92a83fa1f0acd227cdab7b8) by [@tjzel](https://github.com/tjzel))
- **Hermes**: ReactPlugin.kt always setting `hermesV1Enabled` to `true` ([45896674d1](https://github.com/facebook/react-native/commit/45896674d14d4b0104cb166e83c5b403f90981c0) by [@tjzel](https://github.com/tjzel))
- **Image**: Image fadeDuration=0 not working with props 2.0 enabled ([3fb5c0bc02](https://github.com/facebook/react-native/commit/3fb5c0bc0224a33afb275d73e963d85111b561b2) by [@hannojg](https://github.com/hannojg))
- **Legacy Architecture**: Restore getUIImplementation() stub for backwards compatibility with third-party libraries ([e5d2d951de](https://github.com/facebook/react-native/commit/e5d2d951de3e2081d512d363120c0d38eb21d3c9) by [@sammy-SC](https://github.com/sammy-SC))
- **Networking**: File:// URIs passed to fetch() or XMLHttpRequest no longer fail (https://github.com/facebook/react-native/issues/54626) ([e76a6e2ef4](https://github.com/facebook/react-native/commit/e76a6e2ef4bfd2cf9e10a4a2ffe21bd1b2c981a9) by [@bhamiltoncx](https://github.com/bhamiltoncx))
- **Runtime**: Capture idle callback before running it ([90e48d6031](https://github.com/facebook/react-native/commit/90e48d6031de3188a71157fe22d80b138a8d7605) by [@mozzius](https://github.com/mozzius))
- **Runtime**: Fix thread-safety crash in `DynamicFromArray` by using `ThreadLocal<SimplePool>` instead of a shared `SimplePool`, matching the existing fix in `DynamicFromMap` ([21fae86546](https://github.com/facebook/react-native/commit/21fae865468fa0ec178078ca834e77964abf7d0a) by [@edwii-zhu](https://github.com/edwii-zhu))
- **ScrollView**: Fixed bug where joystick could still scroll when scrollEnabled is false ([c51b9698c7](https://github.com/facebook/react-native/commit/c51b9698c7e5f571146264c5ba0281dd7b28e408) by William Khoe)
- **Text**: Fix crash with setting certain `<Text>` props back to `undefined` when using `enablePropsUpdateReconciliationAndroid` feature flag ([50289e3add](https://github.com/facebook/react-native/commit/50289e3addcfc4162b72d46e03c1750523418c39) by [@hannojg](https://github.com/hannojg))
- **Text**: FontVariants `stylistic-{num}` not being propagated correctly ([9353eb55b8](https://github.com/facebook/react-native/commit/9353eb55b877e6e51c35c6041eebd72971c6b9a5) by [@dragoncodes](https://github.com/dragoncodes))
- **View**: Fix image content disappearing on API 24 (Nougat) when antialiased border radius clipping is applied ([51ec52e806](https://github.com/facebook/react-native/commit/51ec52e8068bd90cca20d9e5bfe369565fb0454f) by [@Abbondanzo](https://github.com/Abbondanzo))

#### iOS specific

- **Accessibility**: Ensure accessibilityElementsHidden prop is respected in recursive accessibility label aggregation ([b60f533acc](https://github.com/facebook/react-native/commit/b60f533accc589ddff7fde8fbdaa65606b2cad85) by Max Polevy)
- **Animated**: Fixed edge-case with animating non-layout props through the `commitUpdates` path. ([31f215a421](https://github.com/facebook/react-native/commit/31f215a42183fa815204c8d730cc41437b077534) by [@coado](https://github.com/coado))
- **Animated**: Revert RCTAnimatedModuleProvider change from [# 55729](https://github.com/facebook/react-native/pull/55729) ([85696fe](https://github.com/facebook/react-native/commit/85696fe1169d737c42cc9b4f85472dda23e99ed7) by [@zeyap](https://github.com/zeyap))
- **Build**: Fix unused exception parameter compile error in RCTUIManager catch block in certain build mode ([58bc6c3e38](https://github.com/facebook/react-native/commit/58bc6c3e38d45398ebec01a5399eac8d72f83adc) by Yannick Loriot)
- **Build**: Fixed duplicate symbol error when using React.XCFramework ([d21ffc9e32](https://github.com/facebook/react-native/commit/d21ffc9e322060c354b78da84d590cfc337c1de8) by [@chrfalch](https://github.com/chrfalch))
- **Build**: Fixed replace script deleting the react-vfs.yaml file on iOS ([11e257cec0](https://github.com/facebook/react-native/commit/11e257cec09d1e69e7261fd769ad0f0e4007e09e) by [@chrfalch](https://github.com/chrfalch))
- **CocoaPods**: Add `nkf` and `base64` as ruby dependencies ([51c965883f](https://github.com/facebook/react-native/commit/51c965883f609b93b47c99b18ab260633a57346a) by [@kimchi-developer](https://github.com/kimchi-developer))
- **CocoaPods**: Allow absolute react-native paths to be passed to `use_react_native!` in project podfiles ([33641f09fa](https://github.com/facebook/react-native/commit/33641f09fa91e93bc5780c2d6999515f9761a17f) by [@kitten](https://github.com/kitten))
- **CocoaPods**: Regression from https://github.com/facebook/react-native/issues/54948 preventing `pod install --project-directory` from working properly ([9f686f2014](https://github.com/facebook/react-native/commit/9f686f2014aefd2ad6ee3b5843718d5d7d72d13a) by [@kitten](https://github.com/kitten))
- **Dev Server**: Not crashing on network issues with connecting to DevServer ([ec29c292e0](https://github.com/facebook/react-native/commit/ec29c292e0417ef2c02fefe08f904117c3d5972e) by [@vzaidman](https://github.com/vzaidman))
- **Dev Server**: Sync bundling progress between Metro cli and app hints ([e112934f2e](https://github.com/facebook/react-native/commit/e112934f2e1c74732e2fcf828299d8afab648d8e) by [@vzaidman](https://github.com/vzaidman))
- **Hermes**: Fix Hermes crash when async void TurboModule method throws NSException by re-throwing instead of converting to JSError on wrong thread ([4083a6ff92](https://github.com/facebook/react-native/commit/4083a6ff92b0ffd4f71166848f3d7ce36172fac8) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Image**: Fix expo-image-manipulator cropped image orientation ([978d5a2d4f](https://github.com/facebook/react-native/commit/978d5a2d4f4eede9cd6ba4786cae2dcc99ce3a37) by [@mlazari](https://github.com/mlazari))
- **Image**: Resolves a rare race-condition that can trigger in RCTImageComponentView. ([3b46755b3b](https://github.com/facebook/react-native/commit/3b46755b3b2f4a53b79d0828ef4c0cfe319a34ac) by Ryan Frawley)
- **Prebuild**: Refactored header files generator for prebuilt React framework ([3fad7dc13d](https://github.com/facebook/react-native/commit/3fad7dc13dc6a7e4a2e9f5e877561526f990e90d) by [@chrfalch](https://github.com/chrfalch))
- **ScrollView**: Reset contentInset in scroll view prepareForRecycle ([984dbe83d8](https://github.com/facebook/react-native/commit/984dbe83d8de76fd94c191173dc23897d31edcd8) by [@sandeee1928](https://github.com/sandeee1928))
- **View**: Fixed `transformOrigin` using stale layout dimensions from recycled views, causing incorrect transform positioning ([0eb5e652a2](https://github.com/facebook/react-native/commit/0eb5e652a2957720500f1689c7d41528f8b13738) by Mazin Zakaria)

### Security

- **Dependencies**: Bump to `chromium-edge-launcher@^0.3.0` to drop `rimraf` ([1f2312687b](https://github.com/facebook/react-native/commit/1f2312687bae96d8a1f7bbd5d44ec628859656eb) by [@kitten](https://github.com/kitten))


## v0.84.0

### Breaking

- **Build**: Bump minimum Node.js version to v22.11 ([8f10b339d4](https://github.com/facebook/react-native/commit/8f10b339d48ab3ee6a121e435b380cbe5f5fe36e) by [@robhogan](https://github.com/robhogan))
- **Hermes**: Make Hermes V1 the default engine ([f140c4906b](https://github.com/facebook/react-native/commit/f140c4906b286a85772d0b7d97eecd0798805fcd) by [@cipolleschi](https://github.com/cipolleschi))
- **Runtime**: Removed microtask API from JSTimerManager ([60471cb268](https://github.com/facebook/react-native/commit/60471cb268a70546d6ea555d25c90ca47ad3d839) by [@javache](https://github.com/javache))
- **TurboModules**: Make the TurboModuleBinding constructor private. ([53944eaa6c](https://github.com/facebook/react-native/commit/53944eaa6c99e6c916d7147b1ef7061fc1ce0e58) by [@RSNara](https://github.com/RSNara))
- **TurboModules**: Remove TurboCxxModule ([2d6a3236ed](https://github.com/facebook/react-native/commit/2d6a3236ed2b82d8dc1868439ba958c9f888e48a) by [@christophpurrer](https://github.com/christophpurrer))
- **TurboModules**: Remove CxxModule 2/2 C++ part ([a945cd99fa](https://github.com/facebook/react-native/commit/a945cd99fa106bcf327cb90c3349fb5511703663) by [@christophpurrer](https://github.com/christophpurrer))
- **TurboModules**: Remove CxxModule 1/2 Java/Kotlin part ([75a11703a0](https://github.com/facebook/react-native/commit/75a11703a0baa0f3b48f977d5ca861eb177c5ab5) by [@christophpurrer](https://github.com/christophpurrer))
- **TurboModules**: Remove CxxModule support from CatalystInstance ([c726c27537](https://github.com/facebook/react-native/commit/c726c27537d5fe81f3eeeef9a181888fcf1bb2c1) by [@christophpurrer](https://github.com/christophpurrer))
- **TurboModules**: Remove RCTCxxModule ([2c8a376c47](https://github.com/facebook/react-native/commit/2c8a376c47cd112b765ef5b4003751875ba9a4b0) by [@christophpurrer](https://github.com/christophpurrer))

#### Android specific

- **Legacy Architecture**: Delete deprecated NativeKind class from React Native Android ([284d841b3d](https://github.com/facebook/react-native/commit/284d841b3d82ff102ff0d839216212e7d6acccea) by [@mdvacca](https://github.com/mdvacca))
- **Legacy Architecture**: Remove unnecessary classes inside `com.facebook.react.uimanager.layoutanimation` used in legacy architecture ([0b09e6f696](https://github.com/facebook/react-native/commit/0b09e6f6968240f43db5fec8f2ff7dc1e8d8d7db) by [@cortinico](https://github.com/cortinico))
- **Legacy Architecture**: Remove unnecessary `LazyReactPackage` used in legacy architecture ([2b09ae8992](https://github.com/facebook/react-native/commit/2b09ae8992bde33e32e8241792b125449bd4365b) by [@cortinico](https://github.com/cortinico))
- **Legacy Architecture**: Remove unused internal `NotThreadSafeBridgeIdleDebugListener` ([0ee4a2d01a](https://github.com/facebook/react-native/commit/0ee4a2d01a7abac197851d648260a7a34648c59d) by [@cortinico](https://github.com/cortinico))
- **Legacy Architecture**: Remove unused internal `NotThreadSafeViewHierarchyUpdateDebugListener` ([991dff2322](https://github.com/facebook/react-native/commit/991dff2322eb5d36af4c493e0ad8531d8015c2dc) by [@cortinico](https://github.com/cortinico))
- **TurboModules**: Remove unstable_shouldEnableLegacyModuleInterop() ([e4eb64d6cc](https://github.com/facebook/react-native/commit/e4eb64d6cc4ca8834f94d5262f52ac0f099d75a3) by [@RSNara](https://github.com/RSNara))

#### iOS specific

- **Dev Server**: Make `RCTPackagerConnection` instance of the `RCTDevSettings` and use bundle config. ([cf92cade49](https://github.com/facebook/react-native/commit/cf92cade4938518169aa52a12960d2d04501b78e) by [@coado](https://github.com/coado))
- **Legacy Architecture**: Remove legacy arch by default ([c7f433a413](https://github.com/facebook/react-native/commit/c7f433a4130a04ff1fd765565f3b1bd030031767) by [@cipolleschi](https://github.com/cipolleschi))

### Added

- **Animated**: A new test for the AnimationBackend ([8bc6214284](https://github.com/facebook/react-native/commit/8bc62142845960d53145bd350e632c7b28e32746) by Bartlomiej Bloniarz)
- **Animated**: Added `transformOrigin` prop support to the `AnimationBackend`. ([20779edd3b](https://github.com/facebook/react-native/commit/20779edd3bc9f1c205a063e15b324466ee509c24) by [@coado](https://github.com/coado))
- **Animated**: Added support for `backfaceVisibility` prop and added missing `flex` style to the `AnimatedPropsBuilder`. ([d379cde036](https://github.com/facebook/react-native/commit/d379cde03682923180f2cf2594a039fa3b32b326) by [@coado](https://github.com/coado))
- **Animated**: Added support for `borderCurves`, `borderStyles`, `pointerEvents`, `isolation`, `cursor`, `boxShadow`, and `mixBlendMode` props to the AnimationBackend. ([6d5b524f87](https://github.com/facebook/react-native/commit/6d5b524f876a33b883128714e016052c620e1b41) by [@coado](https://github.com/coado))
- **Animated**: Added support for `maxWidth`, `maxHeight`, `minWidth`, and `minHeight` props to the AnimationBackend. ([3650ae3d08](https://github.com/facebook/react-native/commit/3650ae3d08755975287b7feffb10a85d0f8192fe) by [@coado](https://github.com/coado))
- **Animated**: Added support for `overflow`, `position`, `zIndex`, and `direction` props to the AnimationBackend. ([bed1a9a20f](https://github.com/facebook/react-native/commit/bed1a9a20f8a239ad1c096b255b6dea716229074) by [@coado](https://github.com/coado))
- **Animated**: Added support for `shadowColor`, `shadowOffset`, `shadowOpacity`, and `shadowRadius` props to the animation backend. ([c31a5a8896](https://github.com/facebook/react-native/commit/c31a5a8896e31007ee76b7732564806af63a2ff1) by [@coado](https://github.com/coado))
- **Animated**: Added support for border width props to the animation backend. ([782dc0e038](https://github.com/facebook/react-native/commit/782dc0e0381150ee8c7114944d210baf96ba7a6b) by [@coado](https://github.com/coado))
- **Animated**: Added support for filter props to Animation Backend ([e744329c3d](https://github.com/facebook/react-native/commit/e744329c3dc002ecd689e925974f62b0c00b61e0) by [@coado](https://github.com/coado))
- **Animated**: Added support for flex props to the AnimationBackend. ([33b2d6d367](https://github.com/facebook/react-native/commit/33b2d6d367f9236fa32a349203e0a6a003757437) by [@coado](https://github.com/coado))
- **Animated**: Added support for margin and padding props to AnimationBackend. ([cd4744cb98](https://github.com/facebook/react-native/commit/cd4744cb985bb7f08ce94db7d41788cbf9ba2bd8) by [@coado](https://github.com/coado))
- **Animated**: Added support for outline props to the AnimationBackend. ([4de9242e80](https://github.com/facebook/react-native/commit/4de9242e809a5ddef26c1c96f85f046309d4a9ba) by [@coado](https://github.com/coado))
- **Animated**: Added support for positional `left`, `top`, `right`, `bottom` props to the animation backend. ([9931aeb830](https://github.com/facebook/react-native/commit/9931aeb8302686ce97b3590f1e2e1a2442c77859) by [@coado](https://github.com/coado))
- **Animated**: Added support for transform, border radius, and background color props to Animation Backend. ([e167faa449](https://github.com/facebook/react-native/commit/e167faa4494e03073dc9fc53581fad532cc3f1ee) by [@coado](https://github.com/coado))
- **Animated**: Add `connectAnimatedNodeToShadowNodeFamily` method to `NativeAnimatedModule` and `NativeAnimatedTurboModule` ([d7ef651c5c](https://github.com/facebook/react-native/commit/d7ef651c5cbfdd8a7289746d1afbe2c63bb61a83) by Bartlomiej Bloniarz)
- **Animated**: Jest tests for PlatformColor support ([cbbba7b9a5](https://github.com/facebook/react-native/commit/cbbba7b9a5cf81d5454f13dbf399a4c35d7d6667) by [@zeyap](https://github.com/zeyap))
- **Animated**: (js part) Support PlatformColor type of toValue and interpolation outputRange ([8b6b47bd57](https://github.com/facebook/react-native/commit/8b6b47bd57f5b3d47d729c335c304b4c744576d7) by [@zeyap](https://github.com/zeyap))
- **Animated**: Thread down rootTag/surfaceId to AnimatedInterpolation node ([b46427a673](https://github.com/facebook/react-native/commit/b46427a67399874bd827658191898eeffcc9e56e) by [@zeyap](https://github.com/zeyap))
- **Animated**: UIManagerNativeAnimatedDelegateBackendImpl for running animation frame updates on android ([219c2b84c2](https://github.com/facebook/react-native/commit/219c2b84c284f162f2f261a09b5a94d197408357) by Bartlomiej Bloniarz)
- **Animated**: Use the commit hook to reconcile the UI updates with react ([d04e1528da](https://github.com/facebook/react-native/commit/d04e1528da262968a5e6e5fe0194dcd277552938) by Bartlomiej Bloniarz)
- **Assets**: Bundle support for heic and heif files ([f472ef980a](https://github.com/facebook/react-native/commit/f472ef980a19fc710baf6203a67c72d73b378fed) by [@anthonybajoua](https://github.com/anthonybajoua))
- **Codegen**: Support parsing `Readonly` for the new Flow utility types ([a6b76c0c51](https://github.com/facebook/react-native/commit/a6b76c0c51bf37a864b88d48775afbc1143eebde) by [@marcoww6](https://github.com/marcoww6))
- **Codegen**: Support parsing `ReadonlyArray` for the new Flow utility types ([3bf7a09ecb](https://github.com/facebook/react-native/commit/3bf7a09ecba3fe9ed62631e29c192d7a64d43f1e) by [@marcoww6](https://github.com/marcoww6))
- **Dev Server**: Expose methods for registering packager connection handlers. ([d9842fdbe3](https://github.com/facebook/react-native/commit/d9842fdbe32a4c6eeae7cbca92f0f1706d9004ce) by [@coado](https://github.com/coado))
- **ESLint**: Add support for Flat Config (eslint v9) ([18592451de](https://github.com/facebook/react-native/commit/18592451de8106071473a898cbc4b6d4efc7814b) by [@pipopotamasu](https://github.com/pipopotamasu))
- **Fast Refresh**: DevServer fast refresh banners now have a dismiss button but still tap anywhere to dismiss. ([fcd63032d0](https://github.com/facebook/react-native/commit/fcd63032d029cf9ec31605e9be4bb63d5e44ce1e) by [@emily8rown](https://github.com/emily8rown))
- **JavaScript API**: Added missing standard properties to `URL` (hash, host, pathname, etc.) and methods to `URLSearchParams` (get, set, delete, etc.). ([f97b9a521d](https://github.com/facebook/react-native/commit/f97b9a521d6a1cd6141c39253267d26f4d0b359f) by Manish Balayan)
- **JavaScript API**: Export `usePressability` hook and `PressabilityConfig`/`PressabilityEventHandlers` types from the public API ([d0e9b9c078](https://github.com/facebook/react-native/commit/d0e9b9c07858f140d9da97c080d47c833a82acae) by [@natew](https://github.com/natew))
- **Performance**: Add ResourceReceivedData trace events for network data chunks in Performance timeline ([c400b88ebf](https://github.com/facebook/react-native/commit/c400b88ebf749b00741a6abcce39007bff5ee4cb) by [@emily8rown](https://github.com/emily8rown))
- **TypeScript**: Added missing `experimental_backgroundSize`, `experimental_backgroundPosition`, `experimental_backgroundRepeat` to manually written types. ([37bf285836](https://github.com/facebook/react-native/commit/37bf285836f5cb0addd2acb0dbe6b85a706f9ab5) by [@tjzel](https://github.com/tjzel))

#### Android specific

- **Animated**: Add c++ animated support for PlatformColor type of toValue and interpolation outputRange ([7941a621f9](https://github.com/facebook/react-native/commit/7941a621f955d6b62e7a359de67cd3b375c45d9b) by [@zeyap](https://github.com/zeyap))
- **Appearance**: Add `{add|remove}SchemeChangeListener()` function to `OverrideColorScheme` interface to support dynamic appearance updates via override ([80e384a801](https://github.com/facebook/react-native/commit/80e384a8011762f571ff6f47b6674de00aab0485) by [@alanleedev](https://github.com/alanleedev))
- **Events**: Add onKeyDown/onKeyUp support to Android ([79b09ce9c4](https://github.com/facebook/react-native/commit/79b09ce9c416ed2b9ac5e168579150dd26823673) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Events**: Include activeHitPath in payload when it's PointerUp/Down ([1d6d8fc058](https://github.com/facebook/react-native/commit/1d6d8fc058bbfbc529ddfa65a0d7658eeca75332) by [@zeyap](https://github.com/zeyap))

#### iOS specific

- **Accessibility**: Add support for UIAccessibilityPriority in announcements ([4851fb2fc3](https://github.com/facebook/react-native/commit/4851fb2fc30c45da496bb982d13568767ddbad02) by [@maxencehenneron](https://github.com/maxencehenneron))
- **Animated**: Allow invalidateDisplayLink on RCTAnimatedModuleProvider ([7c603ee261](https://github.com/facebook/react-native/commit/7c603ee261c3eb2d9bf160505427ba06607d3465) by [@zeyap](https://github.com/zeyap))
- **Prebuild**: Added documentation for the prebuild scripts for precompiling React Native Core and React Native Dependencies. ([7a66582f60](https://github.com/facebook/react-native/commit/7a66582f60a743834a96101476dc6b54786b68a2) by [@chrfalch](https://github.com/chrfalch))
- **ReactHost**: Add new `RCTBundleConfiguration` for modifying bundle URL on `RCTReactNativeFactory`. ([6fa75cce48](https://github.com/facebook/react-native/commit/6fa75cce48f4f3dc631c181a25a9401a2bf88eeb) by [@coado](https://github.com/coado))

### Changed

- **Accessibility**: Text components with onPress or onLongPress now automatically get accessibilityRole='link' for proper accessibility support ([4c732b4ccf](https://github.com/facebook/react-native/commit/4c732b4ccf2f5c458640f8024759f5f57877749e) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Animated**: AnimatedPropsRegistry now also receive the updates from the synchronous updates that bypass the ShadowTree, so that these updates are not overwritten by React commits ([c52d30e79b](https://github.com/facebook/react-native/commit/c52d30e79b680db15bd2d39b74e4e1f38bb00649) by Bartlomiej Bloniarz)
- **Animated**: C++ animated now passes the calculated `folly::dynamic` directly to the backend, without repacking it into `AnimatedProp` ([84e408cf89](https://github.com/facebook/react-native/commit/84e408cf89eb537439dc99db95d33df3c2a9394a) by Bartlomiej Bloniarz)
- **Animated**: CloneMultiple now invokes the callback for every cloned node, instead of doing that only for the nodes in `familiesToUpdate` ([976c849057](https://github.com/facebook/react-native/commit/976c849057ec6056727ffa71cac0d0c0a513a97e) by Bartlomiej Bloniarz)
- **Animated**: Extracted `cloneProp` from `AnimationBackend.cpp` to `AnimatedProps.h` ([33f783ae23](https://github.com/facebook/react-native/commit/33f783ae23dca139900767108b2ad4390ea865ca) by Bartlomiej Bloniarz)
- **Animated**: Move the animation backend callback scheduling, behind the `isRenderCallbackStarted` check. ([8b95fce84e](https://github.com/facebook/react-native/commit/8b95fce84ea0a7fef79e78582a8717e403fa7349) by Bartlomiej Bloniarz)
- **Animated**: Split the families by `SurfaceId` in `onAnimationFrame` ([5c078bd490](https://github.com/facebook/react-native/commit/5c078bd4905615b0fb3a640e81e53d594f195ca6) by Bartlomiej Bloniarz)
- **React**: Sync React 19.2.3 into React Native ([e6923dd1e1](https://github.com/facebook/react-native/commit/e6923dd1e1dbcab0cb9f7441331b99071663c55a) by [@cipolleschi](https://github.com/cipolleschi))
- **Runtime**: JSBigString mutable data accessor has been renamed to mutableData ([3012aac2ad](https://github.com/facebook/react-native/commit/3012aac2adc04659d6b882e910b1ecf14c8e5225) by [@javache](https://github.com/javache))

#### Android specific

- **Accessibility**: Enabled shouldUseLinkRoleForPressableText and shouldSetEnabledBasedOnAccessibilityState feature flags by default to improve accessibility behavior. ([38e3075310](https://github.com/facebook/react-native/commit/38e3075310e2e0bc062406a06bfcdc232fe6100f) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Accessibility**: Set isClickable=true by default or based on the pointerEvents value for all views to improve accessibility tool detection while maintaining the configured focusable state ([427995858d](https://github.com/facebook/react-native/commit/427995858d604ab749d4b550a91be19c60cbf840) by [@fabriziocucci](https://github.com/fabriziocucci))
- **View**: `VirtualView` not clips subviews even if its parent `ScrollView` does not have `removeClippedSubviews` enabled. ([b0e754bc7f](https://github.com/facebook/react-native/commit/b0e754bc7f7b55c13b7632d354aaf3ee48f7296d) by [@yungsters](https://github.com/yungsters))

#### iOS specific

- **CocoaPods**: Allow linking local SPM packages in CocoaPods ([d31fc32882](https://github.com/facebook/react-native/commit/d31fc328826a584a2351acf831ee987846ca7e21) by [@sbuggay](https://github.com/sbuggay))
- **Prebuild**: Use prebuild by default ([df9d31b243](https://github.com/facebook/react-native/commit/df9d31b2435255f799aa024ffb0f87bcdb665645) by [@cipolleschi](https://github.com/cipolleschi))
- **ReactHost**: Add `RCTBundleConfiguration` property on `RCTReactNativeFactory` and pass it down to `RCTHost`. ([5465a511f4](https://github.com/facebook/react-native/commit/5465a511f4c23692371ebe5756d260281386520a) by [@coado](https://github.com/coado))

### Deprecated

- **React Native DevTools**: Deprecate `XHRInterceptor` and `WebSocketInterceptor` APIs. Developer tools should use the CDP `Network` domain instead. ([41380f39ab](https://github.com/facebook/react-native/commit/41380f39aba22913a2aa45a951a36cacc95fb57a) by [@huntie](https://github.com/huntie))
- **TurboModules**: Deprecate TurboModuleProviderFunctionType ([7a6a6ae2e6](https://github.com/facebook/react-native/commit/7a6a6ae2e63f907f95764e52bf958897462a5c8b) by [@RSNara](https://github.com/RSNara))

### Removed

- **Babel**: Remove Babel preset transforms for already-unsupported non-Hermes engines ([07bd24ed0d](https://github.com/facebook/react-native/commit/07bd24ed0dbd11e77743086a970b9e7507e15c8f) by [@robhogan](https://github.com/robhogan))
- **Legacy Architecture**: Legacy Arch: Remove Perf and Network tabs from in-app Element Inspector. See [RFC0777](https://github.com/react-native-community/discussions-and-proposals/blob/main/proposals/0777-remove-legacy-element-inspector-features.md) ([b7ca04844d](https://github.com/facebook/react-native/commit/b7ca04844d689116692c16fce251f3270250854e) by [@huntie](https://github.com/huntie))

#### Android specific

- **Legacy Architecture**: Remove unnecessary `OnBatchCompleteListener` used in Legacy Architecture ([1bdd2a0aba](https://github.com/facebook/react-native/commit/1bdd2a0abac4ab2c420cadbf8796e44471201f06) by [@cortinico](https://github.com/cortinico))
- **Legacy Architecture**: Remove unnecessary and unused BridgeDevSupportManager ([13da82a337](https://github.com/facebook/react-native/commit/13da82a337826ac30fd2d4b581d963f5b872381b) by [@cortinico](https://github.com/cortinico))

### Fixed

- **Animated**: Added handling of missing props to `AnimatedPropsRegistry` ([31a9eeeba4](https://github.com/facebook/react-native/commit/31a9eeeba4d7c4790133f41df48b16aff6920601) by [@j-piasecki](https://github.com/j-piasecki))
- **Animated**: Check nodesManager_ in AnimatedModule::executeOperation ([199b8982de](https://github.com/facebook/react-native/commit/199b8982de55a470a05efb27b63e55365e5e9997) by [@zeyap](https://github.com/zeyap))
- **Animated**: Handle `Object.create(null)` correctly in AnimatedObject.js' `isPlainObject` function ([4e0b9233c0](https://github.com/facebook/react-native/commit/4e0b9233c0242f46239f0f8b21f82b4cbd5ba781) by [@maman](https://github.com/maman))
- **Animated**: Nullcheck result of getAnimatedNode in NativeAnimatedNodesManager::updateNodes ([3e9083b423](https://github.com/facebook/react-native/commit/3e9083b4234eabfd4f3444c6b6804c66389739a5) by [@zeyap](https://github.com/zeyap))
- **Build**: Fixed `hermes-compiler` not being resolved correctly when your repo is set up as a monorepo using pnpm. ([e23e9add80](https://github.com/facebook/react-native/commit/e23e9add8080a0204221edd4d8cc5e2f1a2f621b) by [@tido64](https://github.com/tido64))
- **Build**: Fixed an `ENOENT` exception when a dependency does not export `package.json`, and your repo is set up as a monorepo using pnpm ([20550c45d2](https://github.com/facebook/react-native/commit/20550c45d276a9cb348116a24cddc20415449e0e) by [@tido64](https://github.com/tido64))
- **CLI**: Fixed missing dependency breaking `react-native config` in pnpm setups ([5c43ed2348](https://github.com/facebook/react-native/commit/5c43ed2348d1a0123164f5246aa4a85f909c5560) by [@tido64](https://github.com/tido64))
- **Codegen**: Ensure codegen CLI supports unspecified `--outputPath` argument and respects `codegenConfig.outputDir` configurations ([716303362a](https://github.com/facebook/react-native/commit/716303362aead08310e2101f15a319b64a602026) by [@kitten](https://github.com/kitten))
- **Codegen**: Hash generation includes `declare const` types in API snapshot ([c36665f7c6](https://github.com/facebook/react-native/commit/c36665f7c658c641cf1b6cca890415bdb149a623) by [@emily8rown](https://github.com/emily8rown))
- **JavaScript API**: Fixed URLSearchParams duplicate issue. ([1e06c92404](https://github.com/facebook/react-native/commit/1e06c9240407611558f4905117335e792446125f) by [@riteshshukla04](https://github.com/riteshshukla04))
- **React Native DevTools**: Fix a bug where we would incorrectly flag apps using additonal Hermes runtimes (e.g. Reanimated) as being multi-host ([c800503214](https://github.com/facebook/react-native/commit/c8005032140f1aff16027b5ed53caea6c9d299f5) by [@huntie](https://github.com/huntie))
- **React Native DevTools**: Fix empty screen for RNDT Network and Performance panels ([c1ff074436](https://github.com/facebook/react-native/commit/c1ff074436ed0c9f66f7e23677b11f145bc282d7) by [@huntie](https://github.com/huntie))
- **StyleSheet**: `color` and `blurRadius` of BoxShadowValue mistakenly swapped ([8fa8fb7a52](https://github.com/facebook/react-native/commit/8fa8fb7a5265dc879106dbec6ec0232268910c56) by [@Phecda](https://github.com/Phecda))

#### Android specific

- **Accessibility**: A11y: Mark virtual views for links as [`clickable`](https://developer.android.com/reference/android/view/accessibility/AccessibilityNodeInfo#setClickable(boolean%29) ([a9a0268953](https://github.com/facebook/react-native/commit/a9a02689533f9cf30fc20cfc7be1ade4f4a624da) by Tom Scallon)
- **Accessibility**: A11y: prevent redundant double screen reader focus steps on `<Text role="link">` ([06786a8afa](https://github.com/facebook/react-native/commit/06786a8afa037296c3f779eab7779a2af42fe294) by [@mdjastrzebski](https://github.com/mdjastrzebski))
- **Accessibility**: Enabled shouldResetClickableWhenRecyclingView by default to reset isClickable to false when recycling views and prevent accessibility tools from detecting incorrect clickable states. ([a2e8bac60f](https://github.com/facebook/react-native/commit/a2e8bac60f343f4e28abd50fad0f89ecd18afc61) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Accessibility**: Enabled shouldResetOnClickListenerWhenRecyclingView by default to reset OnClickListener to null when recycling views and prevent accessibility tools from detecting incorrect states. ([21b93d82df](https://github.com/facebook/react-native/commit/21b93d82df560f31fde9405184399630cbfa437b) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Accessibility**: Fix NPE on ReactAccessibilityDelegate.performAccessibilityAction ([cf6de77408](https://github.com/facebook/react-native/commit/cf6de774088f87304080755a8110999ed88b9556) by [@cortinico](https://github.com/cortinico))
- **Accessibility**: Fix isClickable state for TextViews after recycling ([cf3af8bf4a](https://github.com/facebook/react-native/commit/cf3af8bf4ac99f8671036addeb60df101197d5b7) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Accessibility**: Fix isClickable state for TextViews based on onClickListener ([9ec41774b9](https://github.com/facebook/react-native/commit/9ec41774b942014e3c06c3a1f30bb3b6c0fc2de8) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Accessibility**: Fixed recycled TextViews incorrectly appearing as clickable to accessibility systems ([b34e9c542d](https://github.com/facebook/react-native/commit/b34e9c542d494e704f45b6b950c6f23d86bb326f) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Accessibility**: Reset OnClickListener when recycling views to prevent accessibility tools from detecting incorrect state ([52a4f4b83d](https://github.com/facebook/react-native/commit/52a4f4b83dec615d2d6d67854aed42930682f708) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Accessibility**: Reset isClickable when recycling views to prevent accessibility tools from detecting incorrect state ([d553c31160](https://github.com/facebook/react-native/commit/d553c31160294e6094b96f706f07d06a589da79b) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Accessibility**: View.setEnabled() now properly reflects accessibilityState.disabled ([6fbe284082](https://github.com/facebook/react-native/commit/6fbe284082aa603c44df5edba9d86f8519b7dbf0) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Assets**: Handle `unstable_path` query param in asset URLs ([42986f27a0](https://github.com/facebook/react-native/commit/42986f27a0285e501f71cf5cedacedefdc44c74e) by [@tido64](https://github.com/tido64))
- **BackHandler**: Fix BackHandler callbacks not working after app resume on API 36+ ([fef5b84996](https://github.com/facebook/react-native/commit/fef5b8499667f980c7ad7fe7400c3316722b90ba) by [@anferrat](https://github.com/anferrat))
- **BackHandler**: Make ReactDelegate.onBackPressed() return correct status ([17b3c1c698](https://github.com/facebook/react-native/commit/17b3c1c69877b674b61904ebec5b3a46d6075233) by [@RSNara](https://github.com/RSNara))
- **Build**: RNGP using node invocation non-compatible with Gradle Compilation Cache ([dc73ec438a](https://github.com/facebook/react-native/commit/dc73ec438a00c17d3fe338db45919cf371828a3b) by [@tjzel](https://github.com/tjzel))
- **Build**: RNGP using node invocation non-compatible with Gradle Compilation Cache ([dd1f83e616](https://github.com/facebook/react-native/commit/dd1f83e61656f21769bd66b28a4c389d6ec31a72) by [@tjzel](https://github.com/tjzel))
- **Build**: Use FQCN to avoid collisions ([5bb3a6d68d](https://github.com/facebook/react-native/commit/5bb3a6d68db113d49528848df8704c5adeb1eba8) by [@riteshshukla04](https://github.com/riteshshukla04))
- **Dev Menu**: DevSupport - fix small bugs with Host change dialog ([c4c587e5c3](https://github.com/facebook/react-native/commit/c4c587e5c3ce4c9d4bdcb9dd95b28cf222bdadee) by [@cortinico](https://github.com/cortinico))
- **Modal**: Fix `ReactModalHostView` hover interception to call `super.onInterceptHoverEvent` instead of `super.onHoverEvent`. ([0fe23d7066](https://github.com/facebook/react-native/commit/0fe23d70660db0f97cec0a68a545ace8ee780666) by [@MegaManSec](https://github.com/MegaManSec))
- **Networking**: Fix incorrect `fetch()` response URL after redirect (https://github.com/facebook/react-native/issues/55248) ([fbe6a686e6](https://github.com/facebook/react-native/commit/fbe6a686e65e70dd61700413084ddc54c0b86765) by [@MarkCSmith](https://github.com/MarkCSmith))
- **Pressable**: Fix android_ripple not working with foreground: false in Pressable components ([ca077c6bf8](https://github.com/facebook/react-native/commit/ca077c6bf8e1c842857878deb153b1fdbc71b1a2) by [@ish1416](https://github.com/ish1416))
- **ScrollView**: Emit scroll event once on overscrolled ([f60789abac](https://github.com/facebook/react-native/commit/f60789abac75ad4d1feaadff3fed0b8796a4f8ef) by [@zeyap](https://github.com/zeyap))
- **ScrollView**: Fix keyboard navigation through items in horizontal ScrollView with snapToInterval enabled ([a460df2165](https://github.com/facebook/react-native/commit/a460df216527b1a4435bd72f027565c5fd5e05a3) by [@jgryko5](https://github.com/jgryko5))
- **Text**: Fix text clipping on Android 15+ due to useBoundsForWidth change ([8347cc4b50](https://github.com/facebook/react-native/commit/8347cc4b50ca9229b638d0823d3148fed50b9a61) by [@chrfalch](https://github.com/chrfalch))
- **Text**: Fixed `adjustsFontSizeToFit` scaling the font size too much down ([253fdf4753](https://github.com/facebook/react-native/commit/253fdf475365f6ad7c7c7ba17098589cf18a5c3e) by [@j-piasecki](https://github.com/j-piasecki))
- **TurboModules**: Allow nullable `code` in `Promise.reject` to prevent NPEs from Java modules ([47c45688c7](https://github.com/facebook/react-native/commit/47c45688c7db5aa8da512928b1d5b216b46fc8c6) by [@ramanverse](https://github.com/ramanverse))
- **TurboModules**: Fix jni aborts when turbomodule constructors throw ([d67fc70497](https://github.com/facebook/react-native/commit/d67fc704978ec258b732d61f197d4faa6a784a9c) by [@RSNara](https://github.com/RSNara))
- **View**: Fixed antialiasing issues from border radius usage in API <= 28 ([e08abbcb99](https://github.com/facebook/react-native/commit/e08abbcb99270381c94145a33476f51684dffd93) by [@Abbondanzo](https://github.com/Abbondanzo))

#### iOS specific

- **Accessibility**: Accessibility actions labels are not read by VoiceOver ([602a2d213a](https://github.com/facebook/react-native/commit/602a2d213a735e43c92edff3e2357085fa0d3af7) by [@maxencehenneron](https://github.com/maxencehenneron))
- **Animated**: Make sure to only call onRender when NativeAnimatedNodesManagerProvider is not destroyed ([d8f9b3f1f5](https://github.com/facebook/react-native/commit/d8f9b3f1f59ebfea17105ea849469cf42325db1a) by [@zeyap](https://github.com/zeyap))
- **Build**: Address `-Wswitch-default` warnings for projects that use that compiler flag ([4c560b118c](https://github.com/facebook/react-native/commit/4c560b118c683c72e9eeebdca473b8ec3cdd7e41) by [@NSProgrammer](https://github.com/NSProgrammer))
- **Build**: Fix glog namespace issue to allow using interop mode of objcxx ([68aab492e1](https://github.com/facebook/react-native/commit/68aab492e116a60daf33bc3992196b510a497100) by [@riteshshukla04](https://github.com/riteshshukla04))
- **Build**: Fix missing default statements for projects that have `-Wswitch-default` enabled (along with `-Wswitch-enum`). ([a210409e03](https://github.com/facebook/react-native/commit/a210409e03c1951ab7c88100c763eff055b88e8a) by [@NSProgrammer](https://github.com/NSProgrammer))
- **Build**: Fixed build with dynamic frameworks ([1033dbd1da](https://github.com/facebook/react-native/commit/1033dbd1da013a07ee5d2a13fadeba9f38fa8426) by [@cipolleschi](https://github.com/cipolleschi))
- **Build**: Improve -Wswitch-default support ([8f91076397](https://github.com/facebook/react-native/commit/8f910763973a5b59b515951d7ec4c4f88d0c3b4d) by [@NSProgrammer](https://github.com/NSProgrammer))
- **Build**: Improve -Wswitch-default support ([fedd1cfbda](https://github.com/facebook/react-native/commit/fedd1cfbda093dd9c96ab63ed9c2b8d81b6af1c5) by [@NSProgrammer](https://github.com/NSProgrammer))
- **Build**: Improve support for projects with `-Wswitch-enum` compiler error ([f687292aad](https://github.com/facebook/react-native/commit/f687292aad20a79d9d8d8a706aa2fec64fe92f4b) by [@NSProgrammer](https://github.com/NSProgrammer))
- **Build**: Set the `CURRENT_ARCH=arm64` on M4 ([b78099b821](https://github.com/facebook/react-native/commit/b78099b821357a5449592c48bd4156e3b7c315dc) by [@ISeekTruth](https://github.com/ISeekTruth))
- **CocoaPods**: Moved setting xcconfig to after `add_rn_core` pod function is called. ([73d3429a44](https://github.com/facebook/react-native/commit/73d3429a44e67745a5c5df5d0a0560a40dbbb430) by [@chrfalch](https://github.com/chrfalch))
- **Codegen**: Fix codegen failing when project is inside a hidden folder ([a12b442d26](https://github.com/facebook/react-native/commit/a12b442d26d0b3a47b4a3d2c1ccccfeb890b9bdc) by [@dinisnunes1](https://github.com/dinisnunes1))
- **Codegen**: Fix undefined behavior for values outside of enum range in generated `switch` methods in Objective-C. ([4bf8204391](https://github.com/facebook/react-native/commit/4bf8204391c6dc4014944bc21c997bdb8a7ef584) by [@NSProgrammer](https://github.com/NSProgrammer))
- **Dev Server**: Avoid reallocating views on RCTDevLoadingView progress updates ([55a5b6b015](https://github.com/facebook/react-native/commit/55a5b6b0156bfe81143caad6b0e69924939045e6) by [@shirakaba](https://github.com/shirakaba))
- **Dev Server**: Fixed crash from dismiss button in DevLoadingView ([6793f5cc51](https://github.com/facebook/react-native/commit/6793f5cc516170d1c28e3e762f0b7dd065330b8b) by [@emily8rown](https://github.com/emily8rown))
- **Dev Server**: Fixed dismiss button not appearing consistently in dev loading view ([336042ccb3](https://github.com/facebook/react-native/commit/336042ccb30903ee3e16ffbf9e100bb5ad3cf7e3) by [@emily8rown](https://github.com/emily8rown))
- **Dev Server**: Make rest of app responsive whilst dev loading banner present ([f97354368c](https://github.com/facebook/react-native/commit/f97354368ccdb5e72e5c233e90cd2a9755ffcf7f) by [@emily8rown](https://github.com/emily8rown))
- **Events**: Fix listenerCount not resetting for RCTEventEmitter ([ac8fa25147](https://github.com/facebook/react-native/commit/ac8fa25147c3ee2cd3fefde79d09e3a8f87b95c1) by [@brainbicycle](https://github.com/brainbicycle))
- **Legacy Architecture**: Fix legacy module interop not handling hitTest correctly ([700d320a5f](https://github.com/facebook/react-native/commit/700d320a5f1615a2ae6ea69bcc68b645a2cd4618) by [@kruczy](https://github.com/kruczy))
- **Prebuild**: Fix incorrect source path resolution in dSYM remapping in precompiled framework scripts ([f383241b19](https://github.com/facebook/react-native/commit/f383241b197f4b98a8fca6bbd948de9ce1a756c9) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild**: Fixed copying symbol bundles into correct slice folder ([ac31e96e49](https://github.com/facebook/react-native/commit/ac31e96e4925b3238ab548c91584a7e608a2e17c) by [@chrfalch](https://github.com/chrfalch))
- **Runtime**: A Crash when some error information are nil ([efd2f679f2](https://github.com/facebook/react-native/commit/efd2f679f2cf054bd1301a1e6e851de5cdc38cc7) by [@cipolleschi](https://github.com/cipolleschi))
- **ScrollView**: Fix crash in RCTEnhancedScrollView when scrollViewDidScroll is called ([5f14001e92](https://github.com/facebook/react-native/commit/5f14001e929426144d1eaa5e5e52fb23a4d4f296) by Gabriel Cadden)
- **Text**: Fix rounding error occurring randomly in iOS text line height calculation ([581d643a9e](https://github.com/facebook/react-native/commit/581d643a9e59fd88f93757f80194e1efd11bd0e5) by [@soutua](https://github.com/soutua))
- **Touch Handling**: Remove redundant gesture to tap button when the layer beneath is already tappable ([8b8cceac89](https://github.com/facebook/react-native/commit/8b8cceac89a5962fb2bc52025702f2c023d41055) by [@emily8rown](https://github.com/emily8rown))
- **Touch Handling**: Respect `cancelsTouchesInView` when canceling touches in `RCTSurfaceTouchHandler` ([5634e8a601](https://github.com/facebook/react-native/commit/5634e8a601caf0faa174bac3511929de767609ac) by [@intmain](https://github.com/intmain))
- **View**: Fix duplicate shadow bug during component recycling by cleaning up visual layers in prepareForRecycle ([7dcedf1def](https://github.com/facebook/react-native/commit/7dcedf1def880163ab7ca07b2575a8153029a925) by Atharv Soni)

## v0.83.10

### Added

#### iOS specific

- **Prebuild**: Cache prebuilt iOS binaries in `~/Library/Caches/ReactNative` so Hermes, ReactNativeDependencies and ReactNativeCore tarballs are reused across clean installs and projects instead of being re-downloaded from Maven ([9a0b05b8d0](https://github.com/react/react-native/commit/9a0b05b8d07f3468a08077119189406d56a230ba) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- **React Native DevTools**: Fix a bug where we would incorrectly flag apps using additional Hermes runtimes (e.g. Reanimated) as being multi-host ([c800503214](https://github.com/react/react-native/commit/c8005032140f1aff16027b5ed53caea6c9d299f5) by [@huntie](https://github.com/huntie))
- **Yoga**: Fixed Yoga node ownership when `display: contents` is used in absolutely positioned subtrees ([f2f92098dd](https://github.com/react/react-native/commit/f2f92098ddf996d3f75cfbaa143d7151c29776f7) by [@j-piasecki](https://github.com/j-piasecki))
- **Yoga**: Fixed `display: contents` nodes having `hasNewLayout` set incorrectly ([2546ce4d82](https://github.com/react/react-native/commit/2546ce4d8219050fcd1bf432c7c830c9fd70c9af) by [@j-piasecki](https://github.com/j-piasecki))

#### Android specific

- **Networking**: `fetch()` response URL is now correct after a redirect ([fbe6a686e6](https://github.com/react/react-native/commit/fbe6a686e65e70dd61700413084ddc54c0b86765) by [@MarkCSmith](https://github.com/MarkCSmith))
- **React Native DevTools**: Limit WebSocket queue size for the packager connection to prevent the Android inspector from being force-disconnected on large payloads ([7164f96d58](https://github.com/react/react-native/commit/7164f96d581115e6a7a5646a50ded8e5fdff7742) by [@huntie](https://github.com/huntie))

#### iOS specific

- **CocoaPods**: Make Podfile.lock SPEC CHECKSUMS deterministic across machines by sorting Dir.glob results in Yoga.podspec and using a dynamically computed Pods-relative path in hermes-engine.podspec ([64c9663152](https://github.com/react/react-native/commit/64c9663152879a87d061a3f01b9e9c4e98cc73bc) by [@IsaacIsrael](https://github.com/IsaacIsrael))
- **View**: Fixes crash when changing the value of `removeClippedSubviews` ([91e3f773b7](https://github.com/react/react-native/commit/91e3f773b7e571a503b57e09a1cb8a44ff26cd1e) by [@javache](https://github.com/javache))

## v0.83.8

### Fixed

- Fix missing header search path for React-featureflags in React-CoreModules ([2ff85bcba2](https://github.com/facebook/react-native/commit/2ff85bcba292dcd0d395a7fc218cbff79e5f2116) by [@radko93](https://github.com/radko93))

## v0.83.7

- Changes to experimental features only.

## v0.83.6

### Fixed

- Provide symbol fallbacks for `inspector-modern/chrome/Registration.h` when `HERMES_V1_ENABLED` is set ([efc4cf4ea9](https://github.com/facebook/react-native/commit/efc4cf4ea963894ef6c5ed57bab16e46c4d6e5ca) by [@huntie](https://github.com/huntie))

#### iOS specific

- Fix "Loading from Metro..." banner getting stuck after reloads in quick succession. ([e122c24c27](https://github.com/facebook/react-native/commit/e122c24c273f5fb6e0a2d6b1c961d75ac9bc90b7) by [@alanjhughes](https://github.com/alanjhughes))

## v0.83.5

### Fixed

- **Appearance**: Fix color scheme in appearance state after setting it to unspecified ([c338d19](https://github.com/facebook/react-native/commit/c338d19a1d4dfeb06ca796176a23f6b07457ac50) by [@ismarbesic](https://github.com/ismarbesic))

#### Android specific

- **Networking**: File:// URIs passed to fetch() or XMLHttpRequest no longer fail (https://github.com/facebook/react-native/issues/54626) ([3cf6bff](https://github.com/facebook/react-native/commit/3cf6bff25d106c2f25b6c7cfce6295bd812013bf) by [@bhamiltoncx](https://github.com/bhamiltoncx))

#### iOS specific

- **Build**: Bump fmt to 12.1.0 to fix Xcode 26.4 ([faeef2b90a](https://github.com/facebook/react-native/commit/faeef2b90a56633ad44289b994d31e7ce590b145) by [@leotm](https://github.com/leotm))
- **Hermes**: Fix Hermes crash when async void TurboModule method throws NSException by re-throwing instead of converting to JSError on wrong thread ([a9a976a](https://github.com/facebook/react-native/commit/a9a976af89c3cd52e7f742109e24dbc6ebf09aa9) by [@fabriziocucci](https://github.com/fabriziocucci))

## v0.83.4

### Fixed

#### iOS specific

- **Precompiled Binaries:** Add RCTDevSupportHeaders in React Umbrella ([cfb5328833](https://github.com/facebook/react-native/commit/cfb53288331885ce5d221783affe2f1fb9e18782) by [@cipolleschi](https://github.com/cipolleschi))

## v0.83.3

### Added

#### Android specific

- **Dev Support**: [0.83] Add support for custom header in devsupport ([c8ab750148](https://github.com/facebook/react-native/commit/c8ab750148f318062a75f5294020e854d91969dc) by [@cortinico](https://github.com/cortinico))

### Changed

- **CI**: Skip set-rn-artifacts-version for PRs targeting stable branches ([81223f27b7](https://github.com/facebook/react-native/commit/81223f27b7cba74a9c560614b3b9655e54b12b31) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

- **Build**: [0.83] Fix rncore tarball extraction for EdenFS compatibility ([becef72f12](https://github.com/facebook/react-native/commit/becef72f1216430f9ac0c3e9c90c87a2167651d3) by [@cipolleschi](https://github.com/cipolleschi))

#### Android specific

- **Gradle**: Fix included-build `gradle.properties` resolution for monorepos by reading from parent Gradle start parameters (`projectDir`/`currentDir`) before falling back to `../../android/gradle.properties`, so `hermesV1Enabled` can be inherited correctly. ([c5ae0c820a](https://github.com/facebook/react-native/commit/c5ae0c820a571141a43de980cb011d232fc2268f) by [@Titozzz](https://github.com/Titozzz))

## v0.83.2

### Added

#### Android specific
- **Gradle:** Expose `oscompat` headers via prefab ([b4da323c8e](https://github.com/facebook/react-native/commit/b4da323c8ec5ab7fe0171196dbe8ea50db49b96e) by [@war-in](https://github.com/war-in))

### Fixed

- **Appearance**: Fix color scheme in appearance state after setting it to unspecified ([08d1764530](https://github.com/facebook/react-native/commit/08d176453095db99300aa77632603ab42c57e152) by [@ismarbesic](https://github.com/ismarbesic))
- **Assets**: Handle `unstable_path` query param in asset URLs ([42986f27a0](https://github.com/facebook/react-native/commit/42986f27a0285e501f71cf5cedacedefdc44c74e) by [@tido64](https://github.com/tido64))

#### Android specific

- **Text**: Fix text clipping on Android 15+ due to useBoundsForWidth change ([8347cc4b50](https://github.com/facebook/react-native/commit/8347cc4b50ca9229b638d0823d3148fed50b9a61) by [@chrfalch](https://github.com/chrfalch))

## v0.83.1

### Fixed

#### Android specific

- **Networking**: Fix Network error that could occur for `FormData` uploads with binary data ([471ef7212e](https://github.com/facebook/react-native/commit/471ef7212e8f7778bb7692a372a58c6fba9d081d) by [@huntie](https://github.com/huntie))

## v0.83.0

### Breaking

None

### Deprecated

#### Android specific

- **Animated**: Mark `startOperationBatch` and `finishOperationBatch` as deprecated, replace with no-op ([c9dcd64ed5](https://github.com/facebook/react-native/commit/c9dcd64ed557d477828549e54afa71a12e5294ec) by [@zeyap](https://github.com/zeyap))
- **Networking**: Mark `NetworkingModule.sendRequestInternal` as deprecated ([30999b868c](https://github.com/facebook/react-native/commit/30999b868cf1655b6799edfa65dba2cc9fa8161a) by [@motiz88](https://github.com/motiz88))

### Added

- **Accessibility**: Add meaningful error reporting when `AccessibilityInfo`'s methods are not available ([9cadfe6607](https://github.com/facebook/react-native/commit/9cadfe6607159f78bdd45929e0eb9b3292240cb9) by [@vzaidman](https://github.com/vzaidman))
- **Animated**: `AnimationBackend` initialisation and style updates ([e091759947](https://github.com/facebook/react-native/commit/e09175994759a8868148b4a5d31768e18057d5a4) by [@bartlomiejbloniarz](https://github.com/bartlomiejbloniarz))
- **Animated**: Make `AnimatedNodesManager` use the backend behind the flag ([325c681cb1](https://github.com/facebook/react-native/commit/325c681cb17996c15b246ad0012cbde3d4631f08) by Bartlomiej Bloniarz)
- **Animated**: Add `unstable_setAnimationBackend`, `unstable_getAnimationBackend` in UIManager ([7ec470d49a](https://github.com/facebook/react-native/commit/7ec470d49abded215fef260d577b8424207f7fb9) by Bartlomiej Bloniarz)
- **Dev Server**: Dev server banners can now be closed on tap. On iOS, don't close them after 15s anymore ([6936bd9f6b](https://github.com/facebook/react-native/commit/6936bd9f6bcb4fce5af33442e72992e7aa3767d6) by [@vzaidman](https://github.com/vzaidman))
- **Fast Refresh**: New banner Add to indicate that Fast Refresh has lost connection, and that the app needs to be restarted to reconnect ([4148746941](https://github.com/facebook/react-native/commit/4148746941f957031dd65fe94481bb3ea6367a47) by [@vzaidman](https://github.com/vzaidman))
- **IntersectionObserver**: Gate `IntersectionObserver` in the Canary release level ([5119db44ce](https://github.com/facebook/react-native/commit/5119db44ce5b600edc79dd9fe752d6e0a53375f4) by [@lunaleaps](https://github.com/lunaleaps))
- **JavaScript API**: `ListViewToken` is now exposed when using `"react-native-strict-api"` ([0a0b48b5ff](https://github.com/facebook/react-native/commit/0a0b48b5fff508a1976604bedc931a1b5110a4f2) by [@huntie](https://github.com/huntie))
- **JavaScript API**: `unstable_NativeText` and `unstable_NativeView` are now exported from the `react-native` package ([90ac3ac7bd](https://github.com/facebook/react-native/commit/90ac3ac7bd2c7f8761d02e503224828f8af97fec) by [@huntie](https://github.com/huntie))
- **JavaScript API**: Expose `NativeComponentRegistry` API to index.d.ts ([3f7f9d8fb8](https://github.com/facebook/react-native/commit/3f7f9d8fb8beb41408d092870a7c7cac58029a4d) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- **Performance**: Enable Web Performance APIs ([beccee2164](https://github.com/facebook/react-native/commit/beccee21649eb0353e2828c65f0045053f04c6db) by [@rubennorte](https://github.com/rubennorte))
- **React Native DevTools**: Enable Network inspection features [66469b58d8](https://github.com/facebook/react-native/commit/66469b58d85e820e401b82028b3fda57c53f08c1) by [@cipolleschi](https://github.com/cipolleschi)
- **React Native DevTools**: Enable standalone app shell by default (https://github.com/facebook/react-native/commit/3341bb57b188d0e20ac6e9ebb1e8b1fbb6b26514 by [@huntie](https://github.com/huntie))
- **StyleSheet**: Background image native parser ([a9780f9102](https://github.com/facebook/react-native/commit/a9780f9102800a53e381271bcf27542eaea4a46e) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **StyleSheet**: Merge the [iOS](https://github.com/facebook/react-native/pull/52283) and [android](https://github.com/facebook/react-native/pull/52282) PR into this, this PR includes `BackgroundImageExample`. I have also Add testcases for parsing syntax in JS ([3d08683d0f](https://github.com/facebook/react-native/commit/3d08683d0fcb66cd657e3f72388a53605c7c3974) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **TypeScript**: Add `@react-native/typescript-config/strict` export enabling the `react-native-strict-api` custom condition ([0198c92c71](https://github.com/facebook/react-native/commit/0198c92c714cdfe48bb8d84771e5ef25c17fb47f) by [@kraenhansen](https://github.com/kraenhansen))

#### Android specific

- **Dev Menu**: Add new configuration for `RCTDevMenu` ([4ddf2ce64f](https://github.com/facebook/react-native/commit/4ddf2ce64f8c6886a575c69872273005fd4d90cd) by [@coado](https://github.com/coado))
- **ReactHost**: Add new `setBundleSource` method to `ReactHost` for changing bundle URL at runtime ([005d705aff](https://github.com/facebook/react-native/commit/005d705aff70e560ac937740798b69582a5b6954) by [@coado](https://github.com/coado))
- **StyleSheet**: Background size, position and repeat styles ([e859293674](https://github.com/facebook/react-native/commit/e859293674243d94895f710d1cb197e9e6f2e9e8) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

#### iOS specific

- **Build options**: Add way to set the `RCT_REMOVE_LEGACY_ARCH` flag from Cocoapods to compile ou the legacy arch ([5abda9c7da](https://github.com/facebook/react-native/commit/5abda9c7dacc5533fac35675c09100c7120dd634) by [@cipolleschi](https://github.com/cipolleschi))
- **Build options**: Add support for symbolication of precompiled `React.xcframework` ([07f40ec6b4](https://github.com/facebook/react-native/commit/07f40ec6b48bf4b6507bda5819b873f3a7334dea) by [@chrfalch](https://github.com/chrfalch))
- **Codegen**: Update Codegen to generate `Package.swift` file for Codegen targets ([a7cd3cc08f](https://github.com/facebook/react-native/commit/a7cd3cc08fd2679bb00666162d91ee2fb7107d06) by [@cipolleschi](https://github.com/cipolleschi))
- **Dev Menu**: Add new configuration for `RCTDevMenu` ([29d5aa582f](https://github.com/facebook/react-native/commit/29d5aa582ffd6c395e34a1d03d2fdd742df647af) by [@coado](https://github.com/coado))
- **Font**: Add support for condensed system font when using the New Architecture ([07da2ff3e1](https://github.com/facebook/react-native/commit/07da2ff3e18bbb71f428985f185d5f971843ec26) by [@ismarbesic](https://github.com/ismarbesic))
- **StyleSheet**: Add contrast and hue-rotate CSS filters ([20ba98e00d](https://github.com/facebook/react-native/commit/20ba98e00da84b629cf2c1b11fa24c28c7046093) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **StyleSheet**: Add grayscale, drop-shadow and saturate CSS filters ([1198a55d50](https://github.com/facebook/react-native/commit/1198a55d50809b9086771fa0b40415dd487afe0f) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **StyleSheet**: Background size, position and repeat styles ([d8c2f1c883](https://github.com/facebook/react-native/commit/d8c2f1c883180828ce2784c4b30565e2bec194cf) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **StyleSheet**: Filter blur ([b365e26593](https://github.com/facebook/react-native/commit/b365e26593112fee8824c53a2787679a29cbe9ab) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

### Changed

- **Animated**: Initialize the backend in `NativeAnimatedNodesManagerProvider` ([3f396616d2](https://github.com/facebook/react-native/commit/3f396616d20beaebeb1fa7ab35deebc195bbcd2b) by Bartlomiej Bloniarz)
- **Animated**: Move using declarations into `AnimationBackend` class ([9e98c72ad3](https://github.com/facebook/react-native/commit/9e98c72ad34e0124df4ae846381fbc862d87206c) by [@zeyap](https://github.com/zeyap))
- **Codegen**: Improve Codegen error when iOS native project not found ([bc3503452f](https://github.com/facebook/react-native/commit/bc3503452f70e1f6917070f3a1b00d75bcd46b3f) by [@vonovak](https://github.com/vonovak))
- **ESLint**: Bump `eslint-plugin-react-hooks` to 7.0.1 ([28101284a9](https://github.com/facebook/react-native/commit/28101284a92ac0c93f646636423e6edf5e830006) by [@cipolleschi](https://github.com/cipolleschi))
- **Hermes**: Use Hermes artifacts published independently from React Native ([27bb34c006](https://github.com/facebook/react-native/commit/27bb34c006bb5daaac639d065aaa4c963528814e) by [@j-piasecki](https://github.com/j-piasecki))
- **Metro**: Metro bump to ^0.83.3 ([89f0a37800](https://github.com/facebook/react-native/commit/89f0a3780066e1d74b0cf45ff65a79534638f157) by [@robhogan](https://github.com/robhogan))
- **React**: Bump React version to 19.2 ([6f482708b5](https://github.com/facebook/react-native/commit/6f482708b5abd31ec12c18afc874420f06eb22e3) by [@cipolleschi](https://github.com/cipolleschi))
- **React Native DevTools**: Remove network experiment and experimental icon, Add conditional disabling of features incompatible with multiple hosts ([19359ed095](https://github.com/facebook/react-native/commit/19359ed095059c5d6befcc7e2ff3472447680add) by [@huntie](https://github.com/huntie))
- **Yoga**: Update copyright header in Yoga CMake file from Facebook to Meta ([118a6621f5](https://github.com/facebook/react-native/commit/118a6621f5c4b15d89505b4dc12f05870c042194) by [@aialok](https://github.com/aialok))

#### Android specific

- **Animated**: [c++ animated] Course correct props at `SurfaceMountingManager.updateProps()` ([dae2f606c7](https://github.com/facebook/react-native/commit/dae2f606c76905de74e76db7b0a20052a5caea46) by [@zeyap](https://github.com/zeyap))
- **Fast Refresh**: Hot reload banner is now displayed in blue background like on iOS ([4d45e5987c](https://github.com/facebook/react-native/commit/4d45e5987c1d85e5f56ae9501ba74eed48939307) by [@vzaidman](https://github.com/vzaidman))
- **Font**: Request layout on configuration change only when the font scale has changed ([e02e7b1a29](https://github.com/facebook/react-native/commit/e02e7b1a2943b3ec6e1eb15723c86a8255b100a6) by [@j-piasecki](https://github.com/j-piasecki))
- **Hermes**: Changed value of `HERMESVM_HEAP_HV_MODE` to `HEAP_HV_PREFER32` for Hermes V1 ([fcb51b1392](https://github.com/facebook/react-native/commit/fcb51b13921dea7ed7d478d6944b52df470e2bef) by [@j-piasecki](https://github.com/j-piasecki))
- **Kotlin**: Migrated `ReactRoot` to Kotlin ([0b14a19ea6](https://github.com/facebook/react-native/commit/0b14a19ea6f0bfd97fc8d3e3663615feab875d66) by [@sbuggay](https://github.com/sbuggay))
- **New Architecture**: Runtime check that `NewArchitecture` is enabled in `DefaultNewArchitectureEntryPoint` ([d0d08e4554](https://github.com/facebook/react-native/commit/d0d08e4554c2b3a7676793fe2a43cedcf54b523f) by [@cortinico](https://github.com/cortinico))
- **React Native DevTools**: Add Log error to discourage usages of `getJSModule(RCTEventEmitter)` API ([aab0d3397c](https://github.com/facebook/react-native/commit/aab0d3397c67bb3e27c3607ff2ed240859b5b039) by [@mdvacca](https://github.com/mdvacca))
- **Touch Handling**: Defer to responder system to terminate on scroll ([1e1af623b1](https://github.com/facebook/react-native/commit/1e1af623b14f7952c2f39a601098533f899bb464) by [@zeyap](https://github.com/zeyap))
- **UI**: Split `VirtualViewContainerState` into classic, experimental versions [Android] ([793f99d949](https://github.com/facebook/react-native/commit/793f99d949049c7ab9a7991af0a19010d5444b9f) by [@CalixTang](https://github.com/CalixTang))

#### iOS specific

- **Image**: Use `CGImageSourceCreateImageAtIndex` instead of `CGImageSourceCreateThumbnailAtIndex` to decode full-sized images ([be4fcdafb1](https://github.com/facebook/react-native/commit/be4fcdafb13c2cee702bb120b0feb9b5966ca50e) by [@tsapeta](https://github.com/tsapeta))
- **Prebuild**: Update logging functions for prebuilds ([f0f8b95719](https://github.com/facebook/react-native/commit/f0f8b957190f2f9bf162528210c41f1437346af9) by [@chrfalch](https://github.com/chrfalch))

### Fixed

- **Animated**: Fix array type parsing in `DynamicEventPayload::extractValue` ([cf5040b4f8](https://github.com/facebook/react-native/commit/cf5040b4f82934c075a72b35d5f2d1d0dfa7aac1) by [@zeyap](https://github.com/zeyap))
- **Babel**: Invalidate transform cache when `react-native/babel-preset` is Update ([2d2011c7ae](https://github.com/facebook/react-native/commit/2d2011c7ae0145369ad226417e9ecc3bf6df7890) by [@robhogan](https://github.com/robhogan))
- **Build**: Fixed `hermes-compiler` not being resolved correctly when your repo is set up as a monorepo using pnpm (https://github.com/facebook/react-native/commit/45281ba48fc17508539c0b881327ef8b4bf8e530 by [@tido64](https://github.com/tido64))
- **Codegen**: Fixed an `ENOENT` exception when a dependency does not export `package.json`, and your repo is set up as a monorepo using pnpm (https://github.com/facebook/react-native/commit/ad5e2680c8e491d89d7544ffb2fff45190cd5ef6 by [@tido64](https://github.com/tido64))
- **Codegen**: Ensure codegen CLI supports unspecified `--outputPath` argument and respects `codegenConfig.outputDir` configurations (https://github.com/facebook/react-native/commit/f8207d6c757552ddac472aa278d7dd56ad04fb7e by [@kitten](https://github.com/kitten))
- **Events**: Allow `EventEmitter`s to be optional (for push safety) ([4308185b64](https://github.com/facebook/react-native/commit/4308185b64145f315132865cc69f219bc3299eb3) by Tom Scallon)
- **Fast Refresh**: Only remove the Fast Refresh "Refreshing..." toast when all bundles being loaded finished loading ([92cae27cb2](https://github.com/facebook/react-native/commit/92cae27cb24590e96b01a1dc9547687bafea877b) by [@vzaidman](https://github.com/vzaidman))
- **FlatList**: The `ItemSeparatorComponent` prop on list components now accepts a React element as well as a component function ([35f6ed1146](https://github.com/facebook/react-native/commit/35f6ed1146fae2c36113f5705230188790a0d70c) by [@huntie](https://github.com/huntie))
- **Image**: `ResizeMethod` was not propagated correctly on Android with Props 2.0 ([7c543db181](https://github.com/facebook/react-native/commit/7c543db181a0c2dfce46cb26428e7bbc0341945c) by [@Abbondanzo](https://github.com/Abbondanzo))
- **LogBox**: Fixing an issue with the error LogBox formatting on windows causing text to wrap ([e2b62bc435](https://github.com/facebook/react-native/commit/e2b62bc43549545dfb29e7efad7aaf115cadc1f2) by Gianni Moschini)
- **Renderer**: Avoid data loss during CSS property conversion ([c629019080](https://github.com/facebook/react-native/commit/c62901908088b9c03baffb8903e9b19ba1bc919d) by [@vineethkuttan](https://github.com/vineethkuttan))
- **Renderer**: Use `size_t` instead of `int` for vector iteration in `cloneMultipleRecursive` ([f9754d3459](https://github.com/facebook/react-native/commit/f9754d34590fe4d988065a92de5d512883de3b33) by Harini Malothu)
- **Renderer**: Fix 9-element (2D) transform matrix conversions ([ce243df972](https://github.com/facebook/react-native/commit/ce243df9725baff265fcd275b420ee78971e75cb) by [@cortinico](https://github.com/cortinico))
- **Runtime**: [ReactCxxPlatform] Don't crash on reload ([5d65794ee4](https://github.com/facebook/react-native/commit/5d65794ee4fadc135d1c47ccd3bcce36e594ab8d) by [@christophpurrer](https://github.com/christophpurrer))
- **TypeScript**: Fixed missing type definitions for new DOM APIs in legacy TypeScript types ([05ec7e0ad1](https://github.com/facebook/react-native/commit/05ec7e0ad13cce59e7e3161aa1005392584d6c59) by [@rubennorte](https://github.com/rubennorte))
- **TypeScript**: Fixed Types in Refresh control ([ed24a4d05b](https://github.com/facebook/react-native/commit/ed24a4d05bb2e1e4a7e32a955777e59e827ebce5) by [@riteshshukla04](https://github.com/riteshshukla04))
- **TypeScript**: TypeScript types of `positions` in `GradientValue` ([f7ea40bc28](https://github.com/facebook/react-native/commit/f7ea40bc28605fb712910e20d150af0bb9942611) by [@SimpleCreations](https://github.com/SimpleCreations))
- **Yoga**: Update copyright headers ([0b68dcfac8](https://github.com/facebook/react-native/commit/0b68dcfac80e37423c886cc481a616506351bd81) by [@willspag](https://github.com/willspag))

#### Android specific

- **API**: Correct deprecation message for `ReactContextBaseJavaModule#getCurrentActivity()` ([81bbbe3c45](https://github.com/facebook/react-native/commit/81bbbe3c458628187c078fe2c0ef2b5d13867fe5) by [@vladd-g](https://github.com/vladd-g))
- **Build**: Fix build failures with `RNGP` due to `AGP` 9.0.0-alpha05 ([69dc655005](https://github.com/facebook/react-native/commit/69dc655005bc20feb119ddeca7f663d2d64a6275) by [@cortinico](https://github.com/cortinico))
- **Dev Menu**: Fix displaying dev menu items in light mode ([269b0bd877](https://github.com/facebook/react-native/commit/269b0bd877b018e9d54e7b08ab9b4d265daaaef3) by [@coado](https://github.com/coado))
- **React Native DevTools**: Fix `SoLoader` race condition in `InspectorNetworkRequestListener` ([6c874f25e2](https://github.com/facebook/react-native/commit/6c874f25e20499f6f5a2ccac38b157018e3ccb33) by [@vzaidman](https://github.com/vzaidman))
- **Hermes**: Read the Hermes V1 opt-in flag from the apps properties when building from source ([813b9441ca](https://github.com/facebook/react-native/commit/813b9441cad3c5bd45ef25f438217281e66dcf65) by [@j-piasecki](https://github.com/j-piasecki))
- **Permissions**: Fix request permission not always resolving in Android 16 ([39ede95921](https://github.com/facebook/react-native/commit/39ede959211e10032f147d2b0b7af783cba049c8) by [@lukmccall](https://github.com/lukmccall))
- **Fabric**: Do not crash inside `getEncodedScreenSizeWithoutVerticalInsets` if `SurfaceMountingManager` is null ([f59a6f9508](https://github.com/facebook/react-native/commit/f59a6f9508f92391b26d44854f3da238ccbc5e62) by [@cortinico](https://github.com/cortinico))
- **Runtime**: Request layout on attached surfaces when font scale changes ([417e068220](https://github.com/facebook/react-native/commit/417e0682203d70bd5ca510f7999a7f6c6990566f) by [@j-piasecki](https://github.com/j-piasecki))
- **ScrollView**: Controller-driven scroll events now honor paging/snap alignment ([ed75963c0d](https://github.com/facebook/react-native/commit/ed75963c0d14ba0b7c85b0aaed8fe635d60d1b99) by [@Abbondanzo](https://github.com/Abbondanzo))
- **ScrollView**: Focused scroll into view behaviors for nested vertical scroll views ([26502c6319](https://github.com/facebook/react-native/commit/26502c63193c3f4814af82ca6f8ff4c45abbb76b) by [@rozele](https://github.com/rozele))
- **ScrollView**: Issue with restarting scroll in `maintainVisibleContentPosition` ([a034841fd6](https://github.com/facebook/react-native/commit/a034841fd68a93778d4999f8bc540cf6a5fef8d4) by [@rozele](https://github.com/rozele))
- **Text**: Fix text not scaling down when system `fontScale` < 1.0 ([642f086b8c](https://github.com/facebook/react-native/commit/642f086b8ce4088d7f0b3c6453e2bb8c5f75e41b) by [@kdwkr](https://github.com/kdwkr))
- **View**: Defers focus until View is attached ([9d498f676d](https://github.com/facebook/react-native/commit/9d498f676d96b1c8d3d6c58dc188ea51e88e3474) by [@rozele](https://github.com/rozele))
- **View**: Resolves an int overflow in `findNextFocusableElement` ([363d297260](https://github.com/facebook/react-native/commit/363d2972608e90abb423f9e0592270978a73fb9f) by [@rozele](https://github.com/rozele))

#### iOS specific

- **ActionSheet**: Apply tint color to Actions sheets buttons ([535efc1403](https://github.com/facebook/react-native/commit/535efc1403e53bde190ce5ddb7ecf97918c5e5fd) by [@cipolleschi](https://github.com/cipolleschi))
- **ActionSheet**: Revert action sheet behavior not to break apps on iOS 26 ([82d2352b19](https://github.com/facebook/react-native/commit/82d2352b19b5255c74d17efea467bdad2ba93f29) by [@cipolleschi](https://github.com/cipolleschi))
- **Build**: Fix loading bundle using `debug_http_host` preferences (https://github.com/facebook/react-native/commit/2ac54881f3967346faafa4e5a6bc3b9a68c29e46 by [@coado](https://github.com/coado))
- **Build**: Fixed copying symbol bundles into correct slice folder (https://github.com/facebook/react-native/commit/2bc6b0083237839b224d5427407d33cab3e2de6b by [@chrfalch](https://github.com/chrfalch))
- **Codegen**: Fix autolinking-generated `react-native-config` output not being used in `ReactCodegen` script phase due to temp output directory ([c0290329cd](https://github.com/facebook/react-native/commit/c0290329cdb1771ec087c8552049a287c67259c6) by [@kitten](https://github.com/kitten))
- **DeviceInfo**: Fix `RCTDeviceInfo` crash when `application.delegate.window` is nil in modern iOS app architectures ([968909488a](https://github.com/facebook/react-native/commit/968909488a844c695a92ce000497840e577190dd) by [@25harsh](https://github.com/25harsh))
- **Events**: Add missing `break;` to `-[RCTViewManager pointerEvents]` ([916e53f845](https://github.com/facebook/react-native/commit/916e53f845cdb438c1bb38590d7743f113eed8f7) by [@NSProgrammer](https://github.com/NSProgrammer))
- **Events**: Raised the maximum number of pointers tracked at the same time to 17 ([58bd51e7e2](https://github.com/facebook/react-native/commit/58bd51e7e23cbd1f5f0f360587610c9fc70c0d76) by [@j-piasecki](https://github.com/j-piasecki))
- **Fabric**: Address unexpected warning about "Unbalanced calls start/end for tag 20/19" ([796d182d89](https://github.com/facebook/react-native/commit/796d182d8989ff826eaa3a57458bdfc79750f820) by [@lokshunhung](https://github.com/lokshunhung))
- **Font**: Make `RCTSetDefaultFontHandler` compatible with the new arch, and add a more powerful version as `RCTSetDefaultFontResolver` ([64b30a9376](https://github.com/facebook/react-native/commit/64b30a937607e436b7979e245c456e7ca45bfd11) by [@javache](https://github.com/javache))
- **Image**: Images are removed from memory more aggressively to prevent OOMs ([3895831c2b](https://github.com/facebook/react-native/commit/3895831c2bc83faf68223bb2a491e796d2799b24) by [@sammy-SC](https://github.com/sammy-SC))
- **Image**: Update the `source`property to avoid multiple downloads ([0a71b43fbc](https://github.com/facebook/react-native/commit/0a71b43fbc9d759bb8effd0197031a955687d07a) by [@chrfalch](https://github.com/chrfalch))
- **Modal**: Modal swipe dismissal works only for the first time ([3a0c402d26](https://github.com/facebook/react-native/commit/3a0c402d26c366126fe7b36b2d504be4f658d68d) by [@okwasniewski](https://github.com/okwasniewski))
- **Prebuild**: Fix iOS version mismatch when using nightly prebuilds ([790860782e](https://github.com/facebook/react-native/commit/790860782e07c02b3d89742006d9e73fea62bcfc) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- **Prebuild**: Fix using iOS nightly prebuilds in release mode ([19d87c874e](https://github.com/facebook/react-native/commit/19d87c874edb534d3acf5cb6576c6335983b661e) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- **StyleSheet**: `BoxShadow` + overflow hidden combination interfering with pointerEvents and transform scale ([c8e5f9766b](https://github.com/facebook/react-native/commit/c8e5f9766b8caaf66aa61ef48eeab740a10a725a) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

## v0.82.1

### Fixed

#### Android specific

- Fixed representation of transforms when view is originally zero-sized ([a81e94a40c](https://github.com/facebook/react-native/commit/a81e94a40ca8dca9e57b562db21f8f235c5b25a0) by [@javache](https://github.com/javache))

#### iOS specific

- Fixed issue when using gnu coreutils cp command when using precompiled binaries causing compilation error ([068ec39aea](https://github.com/facebook/react-native/commit/068ec39aea543617e5159fe22274b294bfb29026) by [@chrfalch](https://github.com/chrfalch))

## v0.82.0

### Breaking

- **Appearance.setColorScheme:** `Appearance.setColorScheme` no longer accepts a nullable value ([a4581ecd8b](https://github.com/facebook/react-native/commit/a4581ecd8b6df5efa44dfe6d43708320209c900b) by [@huntie](https://github.com/huntie))
- **`CxxSharedModuleWrapper`:** Removed CxxSharedModuleWrapper ([fafbee2402](https://github.com/facebook/react-native/commit/fafbee240235ea0e63eb01abd31ce32d6a576429) by [@javache](https://github.com/javache))
- **DOM API:** Enable DOM APIs in host component refs ([2ad845ccb2](https://github.com/facebook/react-native/commit/2ad845ccb2fea277e05513dcf41407026a8224f0) by [@rubennorte](https://github.com/rubennorte))
- **Error Handling:** Unhandled promises are now handled by ExceptionsManager.handleException, instead of being swallowed as Logbox Warnings. ([c4082c9ce2](https://github.com/facebook/react-native/commit/c4082c9ce208a324c2d011823ca2ba432411aafc) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- **InteractionManager:** InteractionManager has been deprecated and no longer respects interaction handles. Instead, it is now recommended to avoid executing long-running JavaScript tasks by breaking them up into smaller tasks and scheduling them using `requestIdleCallback()`. ([03d9f34a82](https://github.com/facebook/react-native/commit/03d9f34a8252456d389d9f9a3bd04b99a2828c16) by [@yungsters](https://github.com/yungsters))
- **`shouldEmitW3CPointerEvents`:** Migrate `shouldPressibilityUseW3CPointerEventsForHover` to common private feature flags and remove `shouldEmitW3CPointerEvents` flag. ([fb4587780e](https://github.com/facebook/react-native/commit/fb4587780e8d6111139d73598a9a26ff392dee28) by [@coado](https://github.com/coado))
- **TurboModuleUtils:** Remove unused ReactCommon/TurboModuleUtils functions #deepCopyJSIObject and #deepCopyJSIArray ([ead669ade3](https://github.com/facebook/react-native/commit/ead669ade31ee703c407f96c0ce98d8f2991bdc8) by [@christophpurrer](https://github.com/christophpurrer))
- **TurboModules:** Delete old location of CallbackWrapper.h / LongLivedObject.h by ([cb94e71](https://github.com/facebook/react-native/commit/cb94e71845259ae7fa823eb4d21cde74fccd7435) [@christophpurrer](https://github.com/christophpurrer))

#### Android specific

- **Deps:** Gradle to 9.0 ([7f93b664b4](https://github.com/facebook/react-native/commit/7f93b664b41ba11226aae7cca0e7c9b7f38a7d18) by [@cortinico](https://github.com/cortinico))
- **Image Prefetching:** Android: Image Prefetching send ImageResizeMode as enum value ([e30f34eda6](https://github.com/facebook/react-native/commit/e30f34eda689994cab8cd62aa38175238da8638b) by [@christophpurrer](https://github.com/christophpurrer))
- **New Architecture:** Remove possibility to newArchEnabled=false in 0.82 ([d5d21d0614](https://github.com/facebook/react-native/commit/d5d21d061493ee973c789a7c6ab8cceebc1f04f9) by [@cortinico](https://github.com/cortinico))
- **`reactNativeHost`:** Throw Exception if ReactApplication.reactNativeHost is not overriden ([0d3791ca0a](https://github.com/facebook/react-native/commit/0d3791ca0ab30d5a12881c9901f31291b3e998c6) by [@mdvacca](https://github.com/mdvacca))
- **ViewManagerInterfaces:** Migrate ViewManagerInterfaces to kotlin. Some types in code generated ViewManagerInterfaces might differ. e.g. this will start enforcing nullability in parameters of viewManagerInterface methods (e.g. String commands parameters are not nullable, view params are not nullable in any method, etc) ([79ca9036d3](https://github.com/facebook/react-native/commit/79ca9036d39c16cd115dc0427cb7092f358ac47e) by [@mdvacca](https://github.com/mdvacca))

#### iOS Specific
- **New Architecture:** Removed the opt-out from the New Architecture. ([83e6eaf693](https://github.com/facebook/react-native/commit/83e6eaf693f967b7870a5d4896cbb799206a14f0) by [@cipolleschi](https://github.com/cipolleschi))

### Added

- **Animated:** `Animated.CompositeAnimation` is now exposed when using `"react-native-strict-api"` ([024d25794a](https://github.com/facebook/react-native/commit/024d25794a51c94c877c1dfa115a82ebbf559614) by [@huntie](https://github.com/huntie))
- **Animated:** Allow calling createAnimatedNode without batching ([d9d9a49e18](https://github.com/facebook/react-native/commit/d9d9a49e18f3c51caa18cf7da0a1fcd62f1ecf18) by [@zeyap](https://github.com/zeyap))
- **Animated:** Allow filter usage with native animated driver. ([138d0eb01d](https://github.com/facebook/react-native/commit/138d0eb01dbe597261459a37d364d1780c3ef228) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **API:** Expose NativeComponentRegistry API as JavaScript root export ([f936780cd5](https://github.com/facebook/react-native/commit/f936780cd5c0c17797f9d2bbc8f5cee81c2eefce) by [@zhongwuzw](https://github.com/zhongwuzw))
- **API:** Expose `ReactNativeVersion` API as JavaScript root export ([ec5638abd0](https://github.com/facebook/react-native/commit/ec5638abd0e872be62b6ea5d8df9bed6335c2191) by [@huntie](https://github.com/huntie))
- **Codegen:** Added getDebugProps to codegen ([e547f466ee](https://github.com/facebook/react-native/commit/e547f466ee41415a75ec6b6f910171285ee7bfc3) by [@cipolleschi](https://github.com/cipolleschi))
- **Hermes V1:** Added a dependency on hermes-compiler ([0caf8e70d5](https://github.com/facebook/react-native/commit/0caf8e70d53f611a73ad9b55879dfe0a5f036371) by [@j-piasecki](https://github.com/j-piasecki))
- **Pressable:** Allow setting `blockNativeResponder` on Pressable ([6e4d23ded2](https://github.com/facebook/react-native/commit/6e4d23ded2da4a717bafcc032e3d7a0a5fbe3731) by [@zeyap](https://github.com/zeyap))
- **Yoga/API:** Make yoga/Yoga.h an umbrell header ([8ed2cee80e](https://github.com/facebook/react-native/commit/8ed2cee80e0aaac2f2a6a897ba450888f274a5a4) by [@rudybear](https://github.com/rudybear))

#### Android specific

- **Build Type:** Create a `debugOptimized` `buildType` for Android ([eb2461c7c9](https://github.com/facebook/react-native/commit/eb2461c7c902ebed272bd2d22d6cff4d3c586da6) by [@cortinico](https://github.com/cortinico))
- **DevMenu:** Add long-press back as an option to open the DevMenu for devices that lack menu & fast-forward. ([32d37f03ad](https://github.com/facebook/react-native/commit/32d37f03ad05290205a4f04d756f6e1880c4ff89) by [@sbuggay](https://github.com/sbuggay))
- **DevTools:** `DevSupportManager::openDebugger` now supports an optional `panel` param determining the starting panel ([7eb3536728](https://github.com/facebook/react-native/commit/7eb3536728c4a20f7e51245f4f7b64aa505bd799) by [@huntie](https://github.com/huntie))
- **DevTools:** Adds a landing view parameter to opening RNDT, enabling arbitrary view focus on launch. ([635c707eec](https://github.com/facebook/react-native/commit/635c707eec18f6d2ceceac2dcee9f458f17f8aab) by [@sbuggay](https://github.com/sbuggay))
- **Hermes V1:** Added opt-in to use the new Hermes ([3e9990f860](https://github.com/facebook/react-native/commit/3e9990f860eb9380837ef431ca02def32c4261ad) by [@j-piasecki](https://github.com/j-piasecki))
- **HWInput:** Channel up/down hardware events. ([c2a3e4420e](https://github.com/facebook/react-native/commit/c2a3e4420e07147f9a040a665da98dbe22b87a2a) by [@sbuggay](https://github.com/sbuggay))
- **Manifest:** Add support to specify a single Manifest rather than 2 (main/debug) by using the `usesCleartextTraffic` manifest placeholder which is autoconfigured by RNGP. ([d89acc1596](https://github.com/facebook/react-native/commit/d89acc1596345534882938d2bbf40275a6cb89bd) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- **API:** Add deprecation message for RCTAppdelegate APIs ([d503ea4efc](https://github.com/facebook/react-native/commit/d503ea4efc84b6511cef2a46421a16e044862e88) by [@cipolleschi](https://github.com/cipolleschi))
- **Fabric:** Add invalidation callback for non-recycled component instances ([dc4a6d2c7e](https://github.com/facebook/react-native/commit/dc4a6d2c7e2ed421b61929896f60b1a864a60d97) by [@kkafar](https://github.com/kkafar))
- **Hermes V1:** Added opt-in to use the new Hermes ([e9cdc308b4](https://github.com/facebook/react-native/commit/e9cdc308b4c04753d85757e8877ac00c3c687b95) by [@j-piasecki](https://github.com/j-piasecki))
- **New Architecture:** Add warning if RCT_NEW_ARCH_ENABLED is set to 0 ([7d0bef2f25](https://github.com/facebook/react-native/commit/7d0bef2f25a206d917e7f5cc2b9a6c088f13a832) by [@cipolleschi](https://github.com/cipolleschi))
- **New Architecture:** Crash the app if they force the legacy architecture. ([dc132a4fd4](https://github.com/facebook/react-native/commit/dc132a4fd4ca8dc28dc7dbb2406ac67dac1a0ee7) by [@cipolleschi](https://github.com/cipolleschi))

### Changed

- **Font:** Enabled `enableFontScaleChangesUpdatingLayout` feature flag by default ([686d14f1d1](https://github.com/facebook/react-native/commit/686d14f1d16c2f02720104ddd395f7d27c908350) by [@j-piasecki](https://github.com/j-piasecki))
- **Hermes:** Changed names of hermes binaries ([776fca1e7c](https://github.com/facebook/react-native/commit/776fca1e7c978a2d8f817d042836073e4dcb4e0e) by [@j-piasecki](https://github.com/j-piasecki))
- **Hermes V1:** Changed the source of hermesc binary to be an npm package ([2e0bd13a25](https://github.com/facebook/react-native/commit/2e0bd13a2533fe7ab64125a95b9215b806018c6e) by [@j-piasecki](https://github.com/j-piasecki))
- **Metro:** Bump Metro to ^0.83.1 ([840fd6c83f](https://github.com/facebook/react-native/commit/840fd6c83f45326a796bf2823f8c2fa942aed06c) by [@robhogan](https://github.com/robhogan))
- **React:** Bumped React to 19.1.1 ([ec5a98b1f5](https://github.com/facebook/react-native/commit/ec5a98b1f5c2137f5f6ff5f5f6706f20384c44df) by [@cipolleschi](https://github.com/cipolleschi))
- **Runtime:** CDP backend now accepts `addBinding` and `removeBinding` methods earlier, before a Runtime exists. ([3271e57c75](https://github.com/facebook/react-native/commit/3271e57c751e7d1193c1e9f7b53e545231511b9d) by [@motiz88](https://github.com/motiz88))
- **Typing:** Update types for Platform.version ([f6ba2dbf3b](https://github.com/facebook/react-native/commit/f6ba2dbf3b4c85da1a7f9079fd366a41b160fa69) by [@riteshshukla04](https://github.com/riteshshukla04))
- **UIManager:** Avoid unnecessary copy of view props map in UIManager::updateShadowTree ([5b38bb4745](https://github.com/facebook/react-native/commit/5b38bb47457f853c2c3d5f275facbb9fbc150683) by [@zeyap](https://github.com/zeyap))

#### Android specific

- **AGP:** AGP to 8.12.0 ([742ef3d661](https://github.com/facebook/react-native/commit/742ef3d6615c8c1202e9f683e6127ac97d7a9e23) by [@cortinico](https://github.com/cortinico))
- **DevSupportManager:** DevSupport `openDebugger()` methods now accept a `panel: String?` param. Frameworks directly implementing `DevSupportManager` will need to adjust call signatures. ([9dba7112cf](https://github.com/facebook/react-native/commit/9dba7112cfd09b02300869a77dba3dca16f49a28) by [@huntie](https://github.com/huntie))
- **Kotlin:** Migrated TextAttributeProps to Kotlin. You might need to update your property access to use camelCase instead of Hungarian notation. ([fa921b3c7b](https://github.com/facebook/react-native/commit/fa921b3c7b289800a79196468f993a0eb0bf693f) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrated ReactBaseTextShadowNode to Kotlin. You might need to update your property access to use camelCase instead of Hungarian notation. ([8ccfff9a46](https://github.com/facebook/react-native/commit/8ccfff9a46f317fd78f478c8b3f180441535d1ca) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrated com.facebook.react.bridge.Arguments to Kotlin. ([2534aeaddb](https://github.com/facebook/react-native/commit/2534aeaddb0490b69dfaba6b8d316616c7e10a9c) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `YogaConfig` to Kotlin ([4d5caef76b](https://github.com/facebook/react-native/commit/4d5caef76b83eb7e983364ecc81abb6027e5f98e) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `YogaValue` to Kotlin ([4340dcbae8](https://github.com/facebook/react-native/commit/4340dcbae8fc41cde844e805a1ebfc23d23d164f) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `YogaNative` to Kotlin ([bc54a06fcb](https://github.com/facebook/react-native/commit/bc54a06fcb5b5d1efd8996d8568733b657fc1b06) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `YogaConfigFactory` to Kotlin ([33ca53d9db](https://github.com/facebook/react-native/commit/33ca53d9dbe53b92d65f82dbd53a2e9f23efd4f3) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `DoNotStrip` to Kotlin ([35d8086881](https://github.com/facebook/react-native/commit/35d8086881fac643b0ebc0d53aaf7e79b7ccd830) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `YogaLayoutType` to Kotlin ([7e461003c6](https://github.com/facebook/react-native/commit/7e461003c6592c8c539960bd5e8169c48dd27f50) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `LayoutPassReason` to Kotlin ([db2a9c089c](https://github.com/facebook/react-native/commit/db2a9c089cd5802d99e0fc86e4dc0dbf7c888307) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `YogaNodeFactory` to Kotlin ([40afa75a7c](https://github.com/facebook/react-native/commit/40afa75a7c816a5581223c7bcd1b65b8713edf47) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `YogaMeasureOutput` to Kotlin ([453508ada8](https://github.com/facebook/react-native/commit/453508ada837554455733e3ca94440a7143f51b1) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `YogaMeasureFunction` to Kotlin ([05eddd354e](https://github.com/facebook/react-native/commit/05eddd354e2e80ad3c95ed5a2199a59a77317891) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `YogaStyleInputs` to Kotlin ([001736000f](https://github.com/facebook/react-native/commit/001736000f69ce98db86c17707408bbf3f0ae9a5) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `YogaBaselineFunction` to Kotlin ([a2eb3b299d](https://github.com/facebook/react-native/commit/a2eb3b299dddea60c510821b662dfed55b334df7) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Migrate `YogaLogger` to Kotlin ([9c9a39b58e](https://github.com/facebook/react-native/commit/9c9a39b58e12bc734c27a5d9306e792b0dcaf927) by [@mateoguzmana](https://github.com/mateoguzmana))
- **OnBatchCompleteListener:** Make OnBatchCompleteListener interface internal ([046ff8e58b](https://github.com/facebook/react-native/commit/046ff8e58bed5da0f19adc860b327c7248b19f48) by [@cortinico](https://github.com/cortinico))
- **ReactSurface:** Changed return type of ReactSurfaceImpl.view to ReactSurfaceView to align with parameter recived by ReactSurfaceImpl.attachView() ([41029d8e91](https://github.com/facebook/react-native/commit/41029d8e91492c34c377374b442b31755874618c) by [@mdvacca](https://github.com/mdvacca))
- **TextAttributeProps:** Deprecate the field `TextAttributeProps.effectiveLineHeight`. This field was public but never used in OSS. ([ede037ade7](https://github.com/facebook/react-native/commit/ede037ade795bd44725f9bd82cace193a74aa68d) by [@cortinico](https://github.com/cortinico))
- **ViewManagers:** Changed method arguments names for Core ViewManagers to match the names of ViewManagerInterfaces ([e7d9e0d197](https://github.com/facebook/react-native/commit/e7d9e0d1977c136a85b9a78ef36a258631d1e9ba) by [@mdvacca](https://github.com/mdvacca))

### Deprecated

- **APIs:** Deprecate legacy javascript react native apis ([e7aeea26bd](https://github.com/facebook/react-native/commit/e7aeea26bde6e9cda0a3a0a55fc2a0421fb0c0e5) by [@RSNara](https://github.com/RSNara))
- **StyleSheet:** `StyleSheet.absoluteFillObject` is deprecated in favor of `StyleSheet.absoluteFill` (equivalent). ([83e19813ff](https://github.com/facebook/react-native/commit/83e19813ff5498ab3497d97fe38dba63a5554425) by [@huntie](https://github.com/huntie))
- Deprecate all the c++ classes not used by interop, or the new architecture. ([9539cd2626](https://github.com/facebook/react-native/commit/9539cd26261aef646379104833c7f719e3d83d02) by [@RSNara](https://github.com/RSNara))

#### Android specific

- **DevMenu:** Remove bridge mode string from React Native Dev Menu title ([1c838f32a9](https://github.com/facebook/react-native/commit/1c838f32a9bcee3867ec0502b344889308302f26) by [@sbuggay](https://github.com/sbuggay))
- **New Architecture:** DefaultDevSupportManagerFactory.create() method used for Old Arch ([026e22bb8d](https://github.com/facebook/react-native/commit/026e22bb8d7b38b3bd66ffcc7d4ee446adfee943) by [@cortinico](https://github.com/cortinico))
- **New Architecture:** Deprecate `BridgelessReactContext.getCatalystInstance()` method ([4583fbe052](https://github.com/facebook/react-native/commit/4583fbe052924df1ad030e51ad80e8d754a4c5a4) by [@cortinico](https://github.com/cortinico))
- **New Architecture:** Deprecate legacy architecture classes ReactInstanceManager and ReactInstanceManagerBuilder, these classes will be deleted in a future release ([fb84932e48](https://github.com/facebook/react-native/commit/fb84932e4894a45c0a2725e1d665acdf7bcea435) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Depreacate `CoreModulesPackage` and `NativeModuleRegistryBuilder` legacy architecture classes, these classes unused in the new architecture and will be deleted in the future ([d3bbbd893a](https://github.com/facebook/react-native/commit/d3bbbd893acd500237ab4e1778c6a2e0fe1948a9) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate Legacy Architecture ViewManagers, these classes are not used as part of the new architecture and will be deleted in the future ([da74d5da2c](https://github.com/facebook/react-native/commit/da74d5da2cac5306e37368c65490c434e7ff9f4f) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate LegacyArchitecture ShadowNode classes included in React Native ([07091a9ae8](https://github.com/facebook/react-native/commit/07091a9ae8d70a601d969d9def4952563d3b7bcf) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Depreacte all LegacyArchitecture classes from the bridge package ([c1f7c5e321](https://github.com/facebook/react-native/commit/c1f7c5e3217a7e8a77a859652aadff2a41e3ea58) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate LegacyArchitecture class UIManagerProvider ([b29b86f275](https://github.com/facebook/react-native/commit/b29b86f27553eac50daa18ffb6bca07be3f24f25) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate BridgeDevSupportManager and JSInstance ([25c011eb4d](https://github.com/facebook/react-native/commit/25c011eb4d403040b57e338bec704769de20793c) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate NativeModuleRegistry Legacy Architecture class ([22e4c25211](https://github.com/facebook/react-native/commit/22e4c252116da1a6658b15a84720e0ee314dddd6) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate subset of LegacyArchitecture classes in com/facebook/react/bridge ([78a3ff81eb](https://github.com/facebook/react-native/commit/78a3ff81eb38ae26fb15106580de841477897101) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate LegacyArchitecture class FrescoBasedReactTextInlineImageShadowNode ([25f466cc4d](https://github.com/facebook/react-native/commit/25f466cc4dd28c962b967475c04c284d26efb722) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate Legacy Architecture class CallbackImpl ([718126fcf0](https://github.com/facebook/react-native/commit/718126fcf0296969ee659c31fae51b4317c896d3) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate LegacyArchitecture class JavaMethodWrapper ([19a99dd088](https://github.com/facebook/react-native/commit/19a99dd0882d786daea3db486fd3aed3c10419b5) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate Legacy Architecture ShadowNode classes ([c4715886a9](https://github.com/facebook/react-native/commit/c4715886a917eb3eb63aab366de5225090dff5a1) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate LegacyArchitecture UIManagerModules class ([85610c8b43](https://github.com/facebook/react-native/commit/85610c8b43ea132154cddcfed973ee6ceb3e55b3) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate LegacyArchitecture classes from com/facebook/react/uimanager ([7f5b2b8f84](https://github.com/facebook/react-native/commit/7f5b2b8f84d7941891a447978c6adc17929ef87f) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate LegacyArchitecture classes from package com.facebook.react.uimanager ([39d24bade3](https://github.com/facebook/react-native/commit/39d24bade317920544a3715e3a1f131663d8cded) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** Deprecate LegacyArchitecture classes from LayoutAnimation package ([f67078df07](https://github.com/facebook/react-native/commit/f67078df07b6c9ad995eb43ff47fc4a43bb2eaee) by [@mdvacca](https://github.com/mdvacca))
- **New Architecture:** ReactPackageLogger is not supported in the new architecture and being deprecated ([65671108f6](https://github.com/facebook/react-native/commit/65671108f69d9b23a011841102e4141293581d9c) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- **DevMenu:** Remove bridge mode title and description from React Native Dev Menu title ([775daf5972](https://github.com/facebook/react-native/commit/775daf597280db94354ed484f2ce81690f1eb7b0) by [@sbuggay](https://github.com/sbuggay))
- **New Architecture:** Deprecate all the objc classes not used by interop, or the new architecture. ([70f53ac4ea](https://github.com/facebook/react-native/commit/70f53ac4ea144020560906f5931e480ed4dee87c) by [@RSNara](https://github.com/RSNara))

### Removed

- **New Architecture:** Core: Remove legacy components ([9c8a4c2297](https://github.com/facebook/react-native/commit/9c8a4c22973c7ce6fcf6b5d22c6d5fd4c6dc0d92) by [@RSNara](https://github.com/RSNara))

#### Android specific

- **DefaultReactHost:** Delete unused `DefaultReactHost.getDefaultReactHost()` overload ([d35ddb5e59](https://github.com/facebook/react-native/commit/d35ddb5e59a8cb990dd61a154a8e15e9542f8b15) by [@cortinico](https://github.com/cortinico))
- **DefaultReactHost:** Remove deprecated DefaultReactHost.getDefaultReactHost() overload - part 2 ([bda6acf3b0](https://github.com/facebook/react-native/commit/bda6acf3b08779c0dae7bdadbc9913eea79acd0d) by [@cortinico](https://github.com/cortinico))
- **DefaultReactHost:** Remove deprecated DefaultReactHost.getDefaultReactHost() overload - part 1 ([474f455a75](https://github.com/facebook/react-native/commit/474f455a7591049382da0d0308ddd21589f0cc7e) by [@cortinico](https://github.com/cortinico))
- **Inspector:** Removed unused `Inspector` public class from React Android ([cf528526cc](https://github.com/facebook/react-native/commit/cf528526cc375f1003125cf63f66fbd88790ceae) by [@cortinico](https://github.com/cortinico))
- **JSONArguments:** Remove the `com.facebook.react.bridge.JSONArguments` class ([04ae15d99b](https://github.com/facebook/react-native/commit/04ae15d99bb2ee6f7987bbe8c3d7acfdd46a482f) by [@cortinico](https://github.com/cortinico))
- **MessageQueueThreadPerfStats:** Deprecated MessageQueueThreadPerfStats API and replaced with stub. ([3bf5cb3d0e](https://github.com/facebook/react-native/commit/3bf5cb3d0e7d9d1749ef19a8392b9bbd3ec7ab7d) by [@javache](https://github.com/javache))

### Fixed

- **Accessibility:** Fix for setting the default value for accessibility props ([586f5ba89c](https://github.com/facebook/react-native/commit/586f5ba89cc20a81a9e2d5d0f2708e9cd1b440c0) by Vineeth K)
- **Accessibility:** `aria-hidden` support for `Text`, non-editable `TextInput` and `Image` ([0f39fc3000](https://github.com/facebook/react-native/commit/0f39fc3000411a43711814e0ab9cca1f7093b625) by [@mdjastrzebski](https://github.com/mdjastrzebski))
- **Build:** Fixed babel plugin validation error when coverage instrumentation is enabled ([191ddc1ec7](https://github.com/facebook/react-native/commit/191ddc1ec72be6641ebb8b9cb729cf0e142fff55) by Umar Mohammad)
- **Casting:** Casting rawValue to int was incorrectly truncating ([31b9f10364](https://github.com/facebook/react-native/commit/31b9f103645e67586bdfc5c2f590c28c04ca3871) by [@javache](https://github.com/javache))
- **Codegen:** Help Codegen find library's package.json if some libraries using `exports` field in their package.json file and the `./package.json` subpath is not explicitly defined ([739dfd2141](https://github.com/facebook/react-native/commit/739dfd2141015a8126448bda64a559f5bf22672e) by [@RakaDoank](https://github.com/RakaDoank))
- **Hermes:** Change leftover references to `hermes.framework` to `hermesvm.framework` ([7f051c5470](https://github.com/facebook/react-native/commit/7f051c54701b3585f76f63846abbf7e68e2688d2) by [@j-piasecki](https://github.com/j-piasecki))
- **Hermes V1:** Fixed coordinates for Hermes V1 artifacts ([674fb77d93](https://github.com/facebook/react-native/commit/674fb77d93dfe67a5fe90449dc71b195b1851e13) by [@j-piasecki](https://github.com/j-piasecki))
- **Performance Panel:** Fix typo in Performance.js type checking condition ([6caf2dfa38](https://github.com/facebook/react-native/commit/6caf2dfa382fd4f1184b8d21b030c36687a256e4) by [@YangJonghun](https://github.com/YangJonghun))
- **Performance Panel:** Add default cases to switch statements in headers ([323fe3a5d4](https://github.com/facebook/react-native/commit/323fe3a5d471ae5a2f94d5c2bd13cc97feffe0a5) by [@NSProgrammer](https://github.com/NSProgrammer))
- **ReactCommon:** Bring back ContextContainer::Shared = std::shared_ptr<const ContextContainer> alias ([daeb6e99ab](https://github.com/facebook/react-native/commit/daeb6e99abbca2b6395a9a703d2b0bb9e5091fb7) by [@christophpurrer](https://github.com/christophpurrer))
- **ReactCommon:** Bring back SharedImageManager = std::shared_ptr<ImageManager> alias ([4718b35259](https://github.com/facebook/react-native/commit/4718b35259135b3503033a0061ae84e15d4eb450) by [@christophpurrer](https://github.com/christophpurrer))
- **ReactCommon:** Fixed Type Conversion Error in DynamicEventPayload ([ff38d59cff](https://github.com/facebook/react-native/commit/ff38d59cff92e0a50f0dd70384fbc4dd11d969c4) by Harini Malothu)
- **ReactCommon:** Fixed Type Conversion Error in CSSHexColor ([2ca88a0069](https://github.com/facebook/react-native/commit/2ca88a0069969bf115da6f0ea9f2fbbae9c9226c) by [@anupriya13](https://github.com/anupriya13))
- **TestCallInvoker:** Fix memory leak in TestCallInvoker ([9f2fbc23e4](https://github.com/facebook/react-native/commit/9f2fbc23e48af9be56b3729d514fbb3fff4ba376) by [@christophpurrer](https://github.com/christophpurrer))

#### Android specific

- **Accessability:** Stabilize custom accessibility action IDs to prevent "incompatible action" errors in TalkBack. ([626568f9a3](https://github.com/facebook/react-native/commit/626568f9a3f956a52f6c55df1dc3bc5cd017e353) by [@leg234-png](https://github.com/leg234-png))
- **Build From Source:** Fix build from source due to missing folder error on Gradle 9.0 ([9fbce3eff1](https://github.com/facebook/react-native/commit/9fbce3eff18060f16e796badc415ba733ede19af) by [@cortinico](https://github.com/cortinico))
- **Determinism:** Turned off build IDs for native libraries, fixing issues with reproducibility ([4b8dbe7642](https://github.com/facebook/react-native/commit/4b8dbe7642be53d0ccfc68ca8c9b3f5e750a68c0) by [@Rexogamer](https://github.com/Rexogamer))
- **DevTools:** Fix stack trace linkifying failing when using Android emulator and other situations where the device and debugger have different bundle urls ([794df48ad6](https://github.com/facebook/react-native/commit/794df48ad6a259022e66de1a38ff54b5ec67c3e4) by [@vzaidman](https://github.com/vzaidman))
- **Edge to Edge:** Fix `Dimensions` `window` values on Android < 15 when edge-to-edge is enabled ([3b185e4bce](https://github.com/facebook/react-native/commit/3b185e4bcef24e0689cccd4cf250d469b114d4da) by [@zoontek](https://github.com/zoontek))
- **Fonts:** Update font scale when recreating `RootView` ([5cda3065ce](https://github.com/facebook/react-native/commit/5cda3065ce635460a7458cbab5c10e24bea3bfe2) by [@j-piasecki](https://github.com/j-piasecki))
- **Fonts:** Fix incorrect positioning of inline view at the end of string when RTL text in LTR container ([7f224941bb](https://github.com/facebook/react-native/commit/7f224941bb807919b487d8e1634dd2124f9258b8) by [@NickGerleman](https://github.com/NickGerleman))
- **Hermes V1:** Changed the coordinates of hermes artifacts when using Hermes V1 ([d0fb33822d](https://github.com/facebook/react-native/commit/d0fb33822de38183895c8b3421f46966909beaf3) by [@j-piasecki](https://github.com/j-piasecki))
- **Locale:** Use the first available locale instead of the default one to decide `isDevicePreferredLanguageRTL` ([a03780d279](https://github.com/facebook/react-native/commit/a03780d279d0944e0dcbbf5a93680775006598b0) by Kaining Zhong)
- **New Architecture:** Correctly account for insets on first render of Modals on New Arch ([2e76fc8e8e](https://github.com/facebook/react-native/commit/2e76fc8e8ea01fbce5bd131f675364e688f49088) by [@cortinico](https://github.com/cortinico))
- **Performance:** Fix mounting is very slow on Android by shipping native transform optimizations ([c557311ed8](https://github.com/facebook/react-native/commit/c557311ed836cded8548c5bca32f3eded0abc7ff) by [@cortinico](https://github.com/cortinico))
- **Scroll:** Fixed an issue where shadow tree and native tree layouts mismatch at the end of a scroll event ([1828c53f85](https://github.com/facebook/react-native/commit/1828c53f85faf599a485b3859f8b62586696265f) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Start up:** Fix wrong default for `jsBundleAssetPath` on `DefaultReactHost` ([2246e2b82c](https://github.com/facebook/react-native/commit/2246e2b82cf0c433f9a9b385ea98e532c6f322c6) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- **Build:** Fixed using USE_FRAMEWORKS (static/dynamic) with precompiled binaries ([e723ca4d6b](https://github.com/facebook/react-native/commit/e723ca4d6b86d5a98449498395c700513ceba555) by [@chrfalch](https://github.com/chrfalch))
- **Build:** Non-UTF8 crashes Info.plist local frameworks ([91e69b5d4c](https://github.com/facebook/react-native/commit/91e69b5d4c768278680a8d9ae979bc267624ce98) by [@philipheinser](https://github.com/philipheinser))
- **Build:** Fixed variable naming error in `set_fast_float_config` method in `react_native_pods.rb` ([327057fad5](https://github.com/facebook/react-native/commit/327057fad5c78a95e6c039bfe380d78672e83a43) by [@eliotfallon213](https://github.com/eliotfallon213))
- **Build:** Fix pure cocoapods dynamic framework build ([aa4555eaf1](https://github.com/facebook/react-native/commit/aa4555eaf1b6aab83660c600e867fa6c2da4128e) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Fix regression that skips artifacts code generation ([f6f5ea0b2e](https://github.com/facebook/react-native/commit/f6f5ea0b2eed894725d8f6e8bd045c99c3182026) by [@kitten](https://github.com/kitten))
- **Native Modules:** Fix concurrent calls into resolve/reject inside native modules ([dc879950d1](https://github.com/facebook/react-native/commit/dc879950d196dfd429229f1c4c8e743ef1799d11) by [@RSNara](https://github.com/RSNara))
- **New Architecture:** Fix overriding (xc)framework Info.plist files with RCTNewArchEnabled field ([f84514a88b](https://github.com/facebook/react-native/commit/f84514a88be00f8dcae7972f84aa89d829392a58) by [@msynowski](https://github.com/msynowski))
- **Prebuild:** Fix Node scripts related to prebuilt tarball extraction for paths containing whitespaces ([9731e8ebc5](https://github.com/facebook/react-native/commit/9731e8ebc5ea87526a91b9903172639e062cd920) by [@kitten](https://github.com/kitten))
- **Prebuild:** Use autolinking-generated react-native-config output in second step of cocoapods linking that generates artifacts and generated source ([f170db412b](https://github.com/facebook/react-native/commit/f170db412b3ab46fd0894d5d66431d9c230cd3a8) by [@kitten](https://github.com/kitten))
- **RCTAlertController:** Simplify RCTAlertController, don't create additional UIWindow ([05c4321b19](https://github.com/facebook/react-native/commit/05c4321b194c3d0e146b6085bcaccc75acd3fd67) by [@okwasniewski](https://github.com/okwasniewski))
- **RCTPullToRefreshViewComponentView:** Properly initialize the `RCTPullToRefreshViewComponentView` ([27217e8bd6](https://github.com/facebook/react-native/commit/27217e8bd601757b5db6efc022db428b552a2aa4) by [@cipolleschi](https://github.com/cipolleschi))
- **RCTReactNativeFactory:** Ask the delegate for `getModuleForClass` and `getModuleInstanceFromClass` ([85b47afb48](https://github.com/facebook/react-native/commit/85b47afb48e50b036d2c2c79a008f571d3bfcb43) by [@cipolleschi](https://github.com/cipolleschi))
- **ScrollView:** Correctly propagate `ScrollView` props to `RefreshControl` ([09daad27ea](https://github.com/facebook/react-native/commit/09daad27ea22b83fab65176ea3c7f5f1488ba408) by [@cipolleschi](https://github.com/cipolleschi))
- **ScrollView:** Make sure that `ScrollView` recycled refresh control have the right props setup. ([21b93d8d7d](https://github.com/facebook/react-native/commit/21b93d8d7d46a26f728df19764f85a8aebf318bb) by [@cipolleschi](https://github.com/cipolleschi))
- **Switch:** Fixed a crash when rendering the `Switch` component ([28275a0f7b](https://github.com/facebook/react-native/commit/28275a0f7b182a215010d47fb841d9c2c36bb24c) by [@cipolleschi](https://github.com/cipolleschi))
- **Switch:** Fix Switch layout to work with iOS26 ([91d427fe52](https://github.com/facebook/react-native/commit/91d427fe52a307f9aa8579912ef956d61808dad2) by [@cipolleschi](https://github.com/cipolleschi))
- **Text:** Fix selectable prop not working correctly ([f004cd39bc](https://github.com/facebook/react-native/commit/f004cd39bc4b632006085cbcf61df52bc5d25242) by [@iamAbhi-916](https://github.com/iamAbhi-916))
- **TextInput:** Update TextInput recycling logic to clean up the `inputAccessoryView` dependency. ([eb08f54594](https://github.com/facebook/react-native/commit/eb08f545948de9e2eca91ab3cb7569670c553b15) by [@ArturKalach](https://github.com/ArturKalach))
- **TextInput:** Fixed TextInput behavior when `maxLength={null}` is passed ([56ad53cb14](https://github.com/facebook/react-native/commit/56ad53cb14b5c842714fcf976b6ba81f68c140f2) by [@cipolleschi](https://github.com/cipolleschi))
- **View:** Inline `View` alignment with `lineHeight` in Text ([6da351a5ed](https://github.com/facebook/react-native/commit/6da351a5ed80a10138a5558afcb380410c8a93c9) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))

### Security

- **Network:** Fixed vulnerability on undici and on-headers ([dd00c9055a](https://github.com/facebook/react-native/commit/dd00c9055a8f0c9ceac1716385a8a9874f7a4c2e) by [@cipolleschi](https://github.com/cipolleschi))

## v0.81.6

### Fixed

- **Assets**: Handle `unstable_path` query param in asset URLs ([42986f27a0](https://github.com/facebook/react-native/commit/42986f27a0285e501f71cf5cedacedefdc44c74e) by [@tido64](https://github.com/tido64))
- **Codegen**: Update `generate-artifacts-executor` script to account for optional output path ([716303362a](https://github.com/facebook/react-native/commit/716303362aead08310e2101f15a319b64a602026) by [@kitten](https://github.com/kitten))

#### Android specific

- **Legacy Architecture**: Fix legacy architecture Android freeze on metro refresh ([e7ed0b1347](https://github.com/facebook/react-native/commit/e7ed0b13475cc6b80ee421d679740feba4f71a9a) by [@robhogan](https://github.com/robhogan))

#### iOS specific

- **Codegen**: Fix outputs when iOS artifacts generator is run from Xcode script phase ([c0290329cd](https://github.com/facebook/react-native/commit/c0290329cdb1771ec087c8552049a287c67259c6) by [@kitten](https://github.com/kitten))
- **Events**: Raised the maximum number of pointers tracked at the same time to 17 ([58bd51e7e2](https://github.com/facebook/react-native/commit/58bd51e7e23cbd1f5f0f360587610c9fc70c0d76) by [@j-piasecki](https://github.com/j-piasecki))


## v0.81.5

### Fixed

- Fixed switch ([4106d54a6d](https://github.com/facebook/react-native/commit/4106d54a6ddacbb784fc8335e9a82054f51a2d02) by [@cipolleschi](https://github.com/cipolleschi))

#### Android specific

- Fix request permission not always resolving in Android 16 ([39ede95921](https://github.com/facebook/react-native/commit/39ede959211e10032f147d2b0b7af783cba049c8) by [@lukmccall](https://github.com/lukmccall))

#### iOS specific

- Fix RCTDeviceInfo crash when application.delegate.window is nil in modern iOS app architectures ([968909488a](https://github.com/facebook/react-native/commit/968909488a844c695a92ce000497840e577190dd) by [@25harsh](https://github.com/25harsh))

## v0.81.4

### Fixed

#### iOS specific

- Fix regression that skips artifacts code generation ([f6f5ea0b2e](https://github.com/facebook/react-native/commit/f6f5ea0b2eed894725d8f6e8bd045c99c3182026) by [@kitten](https://github.com/kitten))
- Reapplied "Use autolinking-generated react-native-config output in second step of cocoapods linking that generates artifacts and generated source" ([bb73315a3f](https://github.com/facebook/react-native/commit/bb73315a3fd8cd203c4ddb3ffa10bfec307c7e92) by [@kitten](https://github.com/kitten))

## v0.81.3

### Fixed

#### iOS specific

- Reverted "Use autolinking-generated react-native-config output in second step of cocoapods linking that generates artifacts and generated source" ([537e3ad930](https://github.com/facebook/react-native/commit/537e3ad93041c0cef959f0d20586fe97818900a6) by [@gabrieldonadel](https://github.com/gabrieldonadel))

## v0.81.2

### Added

#### Android specific

- Create a debugOptimized buildType for Android ([5e3edafec6](https://github.com/facebook/react-native/commit/5e3edafec6c69558521061dced7a6bcd046576b0) by [@cortinico](https://github.com/cortinico))
- Add `useNativeEqualsInNativeReadableArrayAndroid` and `useNativeTransformHelperAndroid` feature flag to the experimental channel. This should alleviate some of the perf issue users are seeing on Android + Reanimated + NewArch on 0.81([a346096da8](https://github.com/facebook/react-native/commit/a346096da81fccf5fbc82d83bfc128695e6ec3a5) by [@cortinico](https://github.com/cortinico))

### Fixed

#### iOS specific

- Fix Node scripts related to prebuilt tarball extraction for paths containing whitespaces ([366f2ad505](https://github.com/facebook/react-native/commit/366f2ad5057ffecc1f5b211f6aae29567ae6b7e5) by [@kitten](https://github.com/kitten))
- Use autolinking-generated react-native-config output in second step of cocoapods linking that generates artifacts and generated source ([a2eb29e5e7](https://github.com/facebook/react-native/commit/a2eb29e5e7aef8bbdf4c647c8467b5292b013b20) by [@kitten](https://github.com/kitten))

## v0.81.1

### Added


#### iOS specific

- **Prebuild:** Added setting SWIFT_ENABLE_EXPLICIT_MODULES=NO when using precompiled to support Xcode 26 ([939a75b5ce](https://github.com/facebook/react-native/commit/939a75b5ce2a580ece4a62689582ea81480c3e97) by [@chrfalch](https://github.com/chrfalch))

### Fixed

- **Infra:** Add missing Babel dependencies ([bf2c3af93b](https://github.com/facebook/react-native/commit/bf2c3af93b146943cb35866fa9badcd188e63f5b) by [@tido64](https://github.com/tido64))
- **Accessibility:** fix `aria-label` on `TextInput` ([6965d57e75](https://github.com/facebook/react-native/commit/6965d57e75ed0cf9f265c6020d478ddb9af4bf10) by [@mdjastrzebski](https://github.com/mdjastrzebski))

#### iOS specific

- **TextInput:** Setting maxLength to 0 in TextInput now correctly blocks typing ([c5956da8c0](https://github.com/facebook/react-native/commit/c5956da8c0b735d47761af51019ed25b49001c00) by [@riteshshukla04](https://github.com/riteshshukla04))
- **Switch:** Fix Switch layout to work with iOS 26 ([ba51aeaa90](https://github.com/facebook/react-native/commit/ba51aeaa9040014e1d77c93158c96e9bf09940cf) by [@cipolleschi](https://github.com/cipolleschi))
- **C++:** Fix import RuntimeExecutor.h with USE_FRAMEWORKS ([dacd8f26fd](https://github.com/facebook/react-native/commit/dacd8f26fda61b16b52a4953267f2108181c3282) by [@sharifhh](https://github.com/sharifhh))
- **Infra:** Fix scripts for paths containing whitespaces ([94623ca8ec](https://github.com/facebook/react-native/commit/94623ca8ec969f09d8ec430e7633c3bf49a3d71e) by [@kitten](https://github.com/kitten))
- **Prebuild:** Fixed how we copy and build the Symbols folder when precompiling ReactNativeDependencies ([a843119ff1](https://github.com/facebook/react-native/commit/a843119ff1f0e2dfb1d3884ccf255784e3cea1a7) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Fixed wrong jsi symbols in use when using React.xcframework ([8a2e7efe01](https://github.com/facebook/react-native/commit/8a2e7efe010c49a293c146654094b1cb5d6e6acd) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Fixed copying bundles correctly to xcframeworks when precompiling ReactNativeDependencies.xcframework ([e3adf47214](https://github.com/facebook/react-native/commit/e3adf4721467557f19e6cd7a65c4e2314796bc17) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Aligned Symbols folder in React.xcframework symbols with ReactNativeDependencies.xcframework symbols. ([8c444f773a](https://github.com/facebook/react-native/commit/8c444f773a44e8554745c9cfc1451083c12b00e3) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Fix "file exists" error in `ReactNativeDependencies.podspec` ([4c570b5d31](https://github.com/facebook/react-native/commit/4c570b5d31ef46e04e5fa26fa92d7f7090bf15e2) by [@vonovak](https://github.com/vonovak))
- **Prebuild:** added explicit handling of ReactCodegen ([6526a98d68](https://github.com/facebook/react-native/commit/6526a98d68dbc8578ea15cbf117c0a216c6e9af0) by [@cipolleschi](https://github.com/cipolleschi))

## v0.81.0

### Breaking

- **APIs:** All `react-native/Libraries/BugReporting` APIs have been removed ([9d4d8dcb02](https://github.com/facebook/react-native/commit/9d4d8dcb0264273cc1522ed6e9de47cdb05606f4) by [@huntie](https://github.com/huntie))
- **APIs:** Add public JS API breaking change detection under `yarn diff-api-snapshot` script. ([6b40f35032](https://github.com/facebook/react-native/commit/6b40f35032462de8a9bad0e9f186916562475a40) by [@coado](https://github.com/coado))
- **APIs:** Community CLI users: user-defined `resolver.resolveRequest` and `serializer.getModulesRunBeforeMainModule` Metro config now takes precedence over CLI defaults ([fe2bcbf4ba](https://github.com/facebook/react-native/commit/fe2bcbf4ba7ce983fac0cd09727c165517b6337f) by [@robhogan](https://github.com/robhogan))
- **Error Handling:** Improve messaging and add error stack trace for uncaught throws. ([5ba0e1f97a](https://github.com/facebook/react-native/commit/5ba0e1f97ad40f84d83efaa9cfdbaf9ad22a18e8) by [@vzaidman](https://github.com/vzaidman))
- **Flow:** The `react-native` package no longer ships with the `flow` directory ([38acb4c074](https://github.com/facebook/react-native/commit/38acb4c0746e48ebb10729360788e26454736d1b) by [@huntie](https://github.com/huntie))
- **Node:** Minimum Node version is now bumped to Node.js 22.14.0 ([df39eadc03](https://github.com/facebook/react-native/commit/df39eadc03edcd23fab47712d24818d2d0c75d16) by [@huntie](https://github.com/huntie))
- **View:** `View` no longer sets any default accessibility props, which should not result in visible changes in behaviour but may affect snapshot tests. ([039a333df5](https://github.com/facebook/react-native/commit/039a333df57e20133af3ec77e995ec8fe4dc7f5c) by [@javache](https://github.com/javache))
- **View:** Upgrade `View` component to React 19. ([eedd60b9e6](https://github.com/facebook/react-native/commit/eedd60b9e6b595801d05c2fa223124fb8a895c3c) by [@EvanBacon](https://github.com/EvanBacon))

#### Android specific

- **APIs:** Cleanup and internalize `FpsDebugFrameCallback` ([cf6569bc18](https://github.com/facebook/react-native/commit/cf6569bc18082253fa84feecdfaa7a28413bc993) by [@cortinico](https://github.com/cortinico))
- **CMake:** Correctly propagate `RN_SERIALIZABLE_STATE` to 3rd party `CMake` targets. Users with custom `CMake` and C++ code should update to use `target_compile_reactnative_options` inside their `CMakeLists.txt` files.([c059ae1b77](https://github.com/facebook/react-native/commit/c059ae1b77b073e6990dc2a5d81979de679c2b01) by [@cortinico](https://github.com/cortinico))
- **FabricUIManager:** Remove `FabricUIManager.measure` overload which accepts attachment positions ([2ba86caf18](https://github.com/facebook/react-native/commit/2ba86caf18d86f6902f987ec9a0aa94bf67c1b4e) by [@NickGerleman](https://github.com/NickGerleman))
- **Kotlin:** Migrate `ViewManagerInterfaces` to kotlin. Some types in code generated ViewManagerInterfaces might differ. e.g. this will start enforcing nullability in parameters of viewManagerInterface methods (e.g. String commands parameters are not nullable, view params are not nullable in any method, etc) ([76ff1aa5c6](https://github.com/facebook/react-native/commit/76ff1aa5c6d30935ec33708d3a13ac7e5a82f551) by [@mdvacca](https://github.com/mdvacca))
- **Kotlin:** Migrate `com.facebook.react.ReactDelegate` to Kotlin. Some users implementing this class in Kotlin could have breakages. ([50ea5b4380](https://github.com/facebook/react-native/commit/50ea5b43806a9047bace81267c97d5dd73e0e74d) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Kotlin:** Convert to Kotlin and internalize `MountingManager` ([f33fdca876](https://github.com/facebook/react-native/commit/f33fdca87679d5cc628a2e9dccada728cbb0335b) by [@cortinico](https://github.com/cortinico))
- **textAlignVertical:** Move `textAlignVertical` to paragraph attributes instead of text attributes ([55fd8b26f8](https://github.com/facebook/react-native/commit/55fd8b26f8791848dd886bd7fb5110b401038234) by [@joevilches](https://github.com/joevilches))
- **TextLayoutManager:** Make Java Side `TextLayoutManager` Internal ([e82a677c79](https://github.com/facebook/react-native/commit/e82a677c7966209b05fe55209fcb26c067427393) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- **RCTDisplayLink:** Migrate `RCTDisplayLink`'s API from `RCTModuleData` ([70eeb9f541](https://github.com/facebook/react-native/commit/70eeb9f54194cc807017bec8c71080972c5c4e65) by [@RSNara](https://github.com/RSNara))
- **SynchronouslyUpdateViewOnUIThread:** `SynchronouslyUpdateViewOnUIThread` now accepts `folly::dynamic` instead of `NSDictionary`. Use https://github.com/facebook/react-native/blob/main/packages/react-native/ReactCommon/react/utils/platform/ios/react/utils/FollyConvert.h#L14 for conversion. ([82279bd981](https://github.com/facebook/react-native/commit/82279bd9811c406d21496d03a1572b98946c50b6) by [@sammy-SC](https://github.com/sammy-SC))
- **Xcode:** Bump min Xcode to 16.1 ([c27a8804a6](https://github.com/facebook/react-native/commit/c27a8804a6fdaea2d4bef4a4c689bfe2c343daaa) by [@NickGerleman](https://github.com/NickGerleman))

### Added

- **APIs:** Expose `unstable_TextAncestorContext` API ([962a7dda44](https://github.com/facebook/react-native/commit/962a7dda440863e7888fd2cc01c065c8762857e6) by [@huntie](https://github.com/huntie))
- **APIs:** Expose additional `*AnimationConfig` types on the `Animated` namespace ([11a1ad7a98](https://github.com/facebook/react-native/commit/11a1ad7a98a71cd1189550a8ae5666e5a2ed8d57) by [@huntie](https://github.com/huntie))
- **APIs:** `InterpolationConfig` is now exposed on the `Animated` namespace ([b01a5f91fe](https://github.com/facebook/react-native/commit/b01a5f91fedc19495e8a9d6ce079feb5898e7b87) by [@huntie](https://github.com/huntie))
- **APIs:** Expose `ScrollViewImperativeMethods` and `ScrollViewScrollToOptions` types to public API ([f184b591cf](https://github.com/facebook/react-native/commit/f184b591cfb49ed372efb0bdd55a145230112f45) by Antonio Pires)
- **APIs:** Add `--validate` flag to `build-types` script for JS API snapshot validation. ([f529fd6ba5](https://github.com/facebook/react-native/commit/f529fd6ba590101a3dfa710a92befb81994ed2dd) by [@coado](https://github.com/coado))
- **Bridging:** Added support for bridging `Class` methods return types ([e403b510d0](https://github.com/facebook/react-native/commit/e403b510d0de74ac7e62defeb1e80eff84b956e2) by [@hoxyq](https://github.com/hoxyq))
- **Error Handling:** Improve error messages when enum members are missing ([12ced22f70](https://github.com/facebook/react-native/commit/12ced22f70438064bf815c2413cbd12a80dbf0a7) by Yannick Loriot)
- **Fantom:** Add `Fantom.getFabricUpdateProps` for reading fabric update props scheduled via `UIManager::updateShadowTree` ([cc442eb8c8](https://github.com/facebook/react-native/commit/cc442eb8c85d516701f840046d73683a7cd51424) by [@zeyap](https://github.com/zeyap))
- **Flow:** Add support for Flow opaque types in codegen for native modules ([a15fc102e6](https://github.com/facebook/react-native/commit/a15fc102e63eb3b37852ca45fe4c65e894ecef7d) by [@rubennorte](https://github.com/rubennorte))
- **HMR:** Process HMR `registerBundle` calls from the same origin only ([a9007ea586](https://github.com/facebook/react-native/commit/a9007ea586f6e87db47c6305be3232d760abfd57) by [@jbroma](https://github.com/jbroma))
- **IntersectionObserver:** `IntersectionObserver` support for `root` with fixes for viewport offsets ([c5b6716311](https://github.com/facebook/react-native/commit/c5b67163117e13c99a9c57816f0ff36efc80ccf5) by [@lunaleaps](https://github.com/lunaleaps))
- **ReactNativeFeatureFlags:** Allow Custom ReactNativeFeatureFlags for Shell 2.0 ([bbc1e121c7](https://github.com/facebook/react-native/commit/bbc1e121c71d14803d29a931f642bf8ea6ee2023) by Maddie Lord)
- **ScrollView:** Added more Pending Decleration for `ScrollView` ([a6908ad1a5](https://github.com/facebook/react-native/commit/a6908ad1a5d998505b2bb6ba3e39910fee17329a) by [@riteshshukla04](https://github.com/riteshshukla04))
- **ShadowNode:** Added `cloneMultiple` to `ShadowNode` class. ([1161fb4fcd](https://github.com/facebook/react-native/commit/1161fb4fcd6a0cac3a691de1f37cc7f9d6a861a5) by [@bartlomiejbloniarz](https://github.com/bartlomiejbloniarz))
- **Typescript:** Add `pressRetentionOffset` prop to be recognised by typescript in `Text.d.ts` ([d94f4d8c9d](https://github.com/facebook/react-native/commit/d94f4d8c9deef78c0345a7fd3de74424f864c080) by [@iamAbhi-916](https://github.com/iamAbhi-916))
- **URLSearchParams:** Added size property to `URLSearchParams` implementation ([9b1a8ffac4](https://github.com/facebook/react-native/commit/9b1a8ffac4368b9304939359917c7cfd0a9501bf) by [@louix](https://github.com/louix))

#### Android specific

- **BaseViewManager:** Adds support for `onFocus` / `onBlur` event dispatching logic to all native views that implement `BaseViewManager` ([e960a28af7](https://github.com/facebook/react-native/commit/e960a28af7f4541dcf67d3c7148b2d32a39e1b04) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Edge To Edge:** Add Android edge-to-edge opt-in support ([09ef774ff6](https://github.com/facebook/react-native/commit/09ef774ff6dac10a00a8b35670f9b3941d810dfb) by [@zoontek](https://github.com/zoontek))
- **RNGP:** `RNGP`- Add support for `exclusiveEnterpriseRepository` to specify an internal Maven mirror. ([6cb8dc37c7](https://github.com/facebook/react-native/commit/6cb8dc37c74995cba3f9f0a845919f305de53c3d) by [@cortinico](https://github.com/cortinico))
- **RNTester:** Added explicit build tool version to `RNTester` `build.gradle` to avoid automatic installation of Android SDK Build Tools. ([35dba09724](https://github.com/facebook/react-native/commit/35dba097243ff2d21466f860ec9831e1ff2a97ac) by [@mojavad](https://github.com/mojavad))
- **ScrollView:** Allow `fadingEdgeLength` to be set independently on the start and end of the `ScrollView` ([a21a4b87c3](https://github.com/facebook/react-native/commit/a21a4b87c337f3f2d998a30841430f587c066580) by Mark Verlingieri)
- **View:** Support for `onFocus` and `onBlur` function calls in `View` components ([af0a76cf5f](https://github.com/facebook/react-native/commit/af0a76cf5fdb8107294dff2c9aa0dbc36c7d5443) by [@Abbondanzo](https://github.com/Abbondanzo))

#### iOS specific

- **borderWidth:** Add support for different `borderWidth`s ([70962ef3ed](https://github.com/facebook/react-native/commit/70962ef3ed06a76a96cb2e72c374dc028628c829) by [@a-klotz-p8](https://github.com/a-klotz-p8))
- **CocoaPods:** Add the `ENTERPRISE_REPOSITORY` env variable to cocoapods infra ([23f3bf9239](https://github.com/facebook/react-native/commit/23f3bf9239a849590f1c72b25732d0090780128c) by [@cipolleschi](https://github.com/cipolleschi))
- **Modal:** Allow to interactively swipe down `Modal`s. ([28986a7599](https://github.com/facebook/react-native/commit/28986a7599952a77b8b8e433f72ca837afde310e) by [@okwasniewski](https://github.com/okwasniewski))
- **Package.swift:** Added missing search path to `Package.swift` ([592b09781b](https://github.com/facebook/react-native/commit/592b09781bb94fe6dc00ba49c7a86649980fed5d) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Add more logging around `computeNightlyTarballURL` in ios pre-build ([1a6887bd70](https://github.com/facebook/react-native/commit/1a6887bd70cdefb8fbc421467de841ece74d5c6b) by [@cortinico](https://github.com/cortinico))
- **Prebuild:** Added backwards compatible use of prebuild through cocoapods ([d8e00f0bb1](https://github.com/facebook/react-native/commit/d8e00f0bb1940fc9cc7e5cbb68b26c2d05824486) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Ship the `React-Core-prebuilt.podspec` in `package.json` ([46b562b9b3](https://github.com/facebook/react-native/commit/46b562b9b3bf4c0b8c5af25ab84a43509979c4a7) by [@cipolleschi](https://github.com/cipolleschi))
- **Prebuild:** Added support for using prebuilt `RNCore` with Cocoapods ([90654e4ba2](https://github.com/facebook/react-native/commit/90654e4ba2f3cc2f6b0d8f08769ce58b4e5d1b51) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Add `React-Core-prebuild.podspec` to integrate React native core prebuilds using Cocoapods ([1a86ee17fb](https://github.com/facebook/react-native/commit/1a86ee17fb80cfa1b8bcff30f4f3d5cdb193900d) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Added building `XCFframework` from the prebuild script ([55534f518a](https://github.com/facebook/react-native/commit/55534f518aab53bcdc3fe12d987ab7ef6e620c77) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Added building swift package from the prebuild script ([3c01b1b6f0](https://github.com/facebook/react-native/commit/3c01b1b6f04d285c97bb182131135903b0c1cdd5) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Added downloading of hermes artifacts when pre-building for iOS. ([41d2b5de0a](https://github.com/facebook/react-native/commit/41d2b5de0af21c72227ef030dcddf208e2eb221a) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Add release/debug switch script for React-Core-prebuilt ([42d1a7934c](https://github.com/facebook/react-native/commit/42d1a7934cad4b2c92653e3fa7781c2af8f44df4) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Added support for using USE_FRAMEWORKS with prebuilt React Native Core ([40e45f5366](https://github.com/facebook/react-native/commit/40e45f53661ce80c3a6fbbf07f52dc900afcad52) by [@chrfalch](https://github.com/chrfalch))
- **runtime:** Added `HERMES_ENABLE_DEBUGGER` to debug configuration for the `reactRuntime` target. ([560ac23001](https://github.com/facebook/react-native/commit/560ac23001b02f19d4c6ca4ea493c17060cfaf5f) by [@chrfalch](https://github.com/chrfalch))

### Changed

- **API:** `NewAppScreen` no longer internally handles device safe area, use optional `safeAreaInsets` prop (aligned in 0.81 template) ([732bd12dc2](https://github.com/facebook/react-native/commit/732bd12dc21460641ef01b23f2eb722f26b060d5) by [@huntie](https://github.com/huntie))
- **Animated:** Animated now always flattens `props.style`, which fixes an error that results from `props.style` objects in which `AnimatedNode` instances are shadowed (i.e. flattened to not exist in the resulting `props.style` object). ([da520848c9](https://github.com/facebook/react-native/commit/da520848c931f356d013623c412af11dce7ff114) by [@yungsters](https://github.com/yungsters))
- **Animated:** Creates a feature flag that changes `Animated` to no longer produce invalid `props.style` if every `AnimatedNode` instance is shadowed via style flattening. ([5c8c5388fc](https://github.com/facebook/react-native/commit/5c8c5388fc53ef2430b0bb6bbbc628479819e23d) by [@yungsters](https://github.com/yungsters))
- **Animated:** Enabled a feature flag that optimizes `Animated` to reduce memory usage. ([2a13d20085](https://github.com/facebook/react-native/commit/2a13d200850e4f161a29b252a0ccedc158e53937) by [@yungsters](https://github.com/yungsters))
- **Babel:** Added support to `react-native/babel-preset` for a `hermesParserOptions` option, that expects an object that enables overriding `hermes-parser` options. ([0508eddfe6](https://github.com/facebook/react-native/commit/0508eddfe60df60cb3bfa4074ae199bd0e492d5f) by [@yungsters](https://github.com/yungsters))
- **Error handling:** Errors will no longer have the "js engine" suffix. ([a293925280](https://github.com/facebook/react-native/commit/a2939252803d5cd4b68340da08820174c30a53e6) by [@yungsters](https://github.com/yungsters))
- **Fibers:** Reduces memory usage, by improving memory management of parent alternate fibers. (Previously, a parent fiber might retain memory associated with shadow nodes from a previous commit.) ([0411c43b3a](https://github.com/facebook/react-native/commit/0411c43b3a239384c778baad22c7b4c501008449) by [@yungsters](https://github.com/yungsters))
- **infoLog:** Removed `infoLog` from `react-native` package ([8a0cfec815](https://github.com/facebook/react-native/commit/8a0cfec81584e966c9e6ea0f5e438022e0129bcd) by [@coado](https://github.com/coado))
- **IntersectionObserver:** Fixed `IntersectionObserver#observe` to avoid retaining memory for unmounted child nodes of observed views. ([d945c5863a](https://github.com/facebook/react-native/commit/d945c5863a5ed7b755e577bc25d681bfcc1c401b) by [@yungsters](https://github.com/yungsters))
- **Jest:** Improved default mocking for Jest unit tests. ([1fd9508ecc](https://github.com/facebook/react-native/commit/1fd9508ecc499df89b086e0c46035f43f6f78ad9) by [@yungsters](https://github.com/yungsters))
- **LegacyArchitecture:** Raise loglevel for assertion of `LegacyArchitecture` classes ([38a4b62211](https://github.com/facebook/react-native/commit/38a4b6221164d36eb4ac95c9f3bc7f7e7235e383) by [@mdvacca](https://github.com/mdvacca))
- **LegacyArchitecture:** Raise logLevel of `LegacyArchitecture` classes when minimizing of legacy architecture is enabled ([0d1cde7f36](https://github.com/facebook/react-native/commit/0d1cde7f36e9de72c997fc812bba023694c2a369) by [@mdvacca](https://github.com/mdvacca))
- **Metro:** Metro to ^0.83.1 ([e247be793c](https://github.com/facebook/react-native/commit/e247be793c70a374955d798d8cbbc6eba58080ec) by [@motiz88](https://github.com/motiz88))
- **React DevTools:** Bumped React DevTools to `6.1.5` ([c302902b1d](https://github.com/facebook/react-native/commit/c302902b1db7e8f8ac5b61472c095dc0755d6d1c) by [@hoxyq](https://github.com/hoxyq))
- **RuntimeExecutor:** `RuntimeExecutor`:  Remove noexcept from sync ui thread utils ([7ef278af50](https://github.com/facebook/react-native/commit/7ef278af505deba6b8a47876c6824f9a7fefa427) by [@RSNara](https://github.com/RSNara))
- **Typescript:** Bump `types/react` to `19.1` ([3ae9328571](https://github.com/facebook/react-native/commit/3ae932857174e9c39cd5d9c53922f849aa1401b1) by [@gabrieldonadel](https://github.com/gabrieldonadel))

#### Android specific

- **Android SDK:** Updated targetSdk to 36 in Android. ([477d8df312](https://github.com/facebook/react-native/commit/477d8df3126b325b8cc9b410f1eaeb56b727d4d9) by [@kikoso](https://github.com/kikoso))
- **APIs:** Deprecate `DefaultNewArchitectureEntryPoint.load(Boolean, Boolean, Boolean)` ([efdf73983c](https://github.com/facebook/react-native/commit/efdf73983cef1f371511b6e1efa5e01835ebcabb) by [@cortinico](https://github.com/cortinico))
- **APIs:** Make `com.facebook.react.views.common.ContextUtils` internal ([d1ef8f1fa3](https://github.com/facebook/react-native/commit/d1ef8f1fa36cbfc34d05c409abf693e4e1cac3de) by [@cortinico](https://github.com/cortinico))
- **deps:** Bump `AGP` to `8.11.0` ([04858ecbab](https://github.com/facebook/react-native/commit/04858ecbab808ddca80e20e76f1359619bb5e865) by [@cortinico](https://github.com/cortinico))
- **deps:** Bump `Gradle` to 8.14.3 ([6892dde363](https://github.com/facebook/react-native/commit/6892dde36373bbef2d0afe535ae818b1a7164f08) by [@cortinico](https://github.com/cortinico))
- **Gradle:** Expose `react_renderer_bridging` headers via prefab ([d1730ff960](https://github.com/facebook/react-native/commit/d1730ff960fcb9a01ee94b9e46e5a9fbb7d73f4a) by [@tomekzaw](https://github.com/tomekzaw))
- **JS FPS:** Hide JS FPS on performance overlay as not accurate ([feec8d0148](https://github.com/facebook/react-native/commit/feec8d014877b2177f1c7dded7eb9664f53ee471) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Convert `UIManagerModuleConstantsHelper` to Kotlin ([45fd7feb9f](https://github.com/facebook/react-native/commit/45fd7feb9f083e5c8afc916732aed9795d344e09) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Migrate `ThemedReactContext` to Kotlin ([78c9671c24](https://github.com/facebook/react-native/commit/78c9671c241a86bedb17862e549842b7e36d77ea) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Convert `ReactViewGroup` to Kotlin ([48395d346b](https://github.com/facebook/react-native/commit/48395d346bc89f63d38889e58508304df0088e4f) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Migrate `com.facebook.react.LazyReactPackage` to Kotlin. ([b4ae5c1de1](https://github.com/facebook/react-native/commit/b4ae5c1de1003c343d43c3be1b59ee2b800b9258) by [@Xintre](https://github.com/Xintre))
- **Kotlin:** Apply Collections Kotlin DSL helpers in `ReactAndroid` package ([b2ffd34a39](https://github.com/facebook/react-native/commit/b2ffd34a392de2bddba5ee13248796ccc2db6039) by [@l2hyunwoo](https://github.com/l2hyunwoo))
- **Legacy Arch:** Introduce more deprecation warnings for Legacy Arch classes ([625f69f284](https://github.com/facebook/react-native/commit/625f69f284ddfd9c6beecaa4052a871d092053ef) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- **Accessibility:** Only generate recursive accessibility label for accessible elements ([7e2f17ffe2](https://github.com/facebook/react-native/commit/7e2f17ffe229e09288deba9061221835300ec153) by [@janicduplessis](https://github.com/janicduplessis))
- **GC:** Hermes GC is now triggered in response to iOS memory pressure warning. ([12b2b56102](https://github.com/facebook/react-native/commit/12b2b5610263cb145d1ade8eaf06d8a6e015b10e) by [@yungsters](https://github.com/yungsters))
- **Gradients:** Optimised Radial Gradients. ([f238b74658](https://github.com/facebook/react-native/commit/f238b74658fd155366d4909872ab06781403f31d) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **Gradients:** Optimised Linear Gradients. ([2f3b104224](https://github.com/facebook/react-native/commit/2f3b1042249411e84f9a1d5bb1191461cd2dc5ee) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **Prebuild:** Simplified logging in prebuild scripts ([1477cc0dbd](https://github.com/facebook/react-native/commit/1477cc0dbdee4b50fee4b1b98346812868148aa5) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Fail fast when pod install if using prebuild and frameworks are not present in the disk. ([60c01b4715](https://github.com/facebook/react-native/commit/60c01b4715053bccbeca2673ff1be1fca60bce9b) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Update `ReactCodegen` to support Core prebuilds ([152cb538f6](https://github.com/facebook/react-native/commit/152cb538f69cd07422526802defe3f3617302098) by [@chrfalch](https://github.com/chrfalch))

### Deprecated

- **hasTVPreferredFocus:** Deprecate `hasTVPreferredFocus` ([cfb6c968dd](https://github.com/facebook/react-native/commit/cfb6c968ddce56138553a9d2e0cc8dfc666eb943) by [@Abbondanzo](https://github.com/Abbondanzo))
- **SafeAreaView:** Deprecate `SafeAreaView` due to its iOS-only support and incompatibility with Android 15 edge-to-edge behavior; recommend using `react-native-safe-area-context` instead. ([73133a31d5](https://github.com/facebook/react-native/commit/73133a31d5a47e71edd4e6b798184df8045e2234) by [@kikoso](https://github.com/kikoso))
- **ShadowNode:** `ShadowNode::Shared` is now deprecated. Use `std::shared_ptr<const ShadowNode>` instead. ([0e175ce5b6](https://github.com/facebook/react-native/commit/0e175ce5b6c80a21237f5cd0f20c9876fa975935) by [@sammy-SC](https://github.com/sammy-SC))
- **ShadowNode:** Deprecate type aliases `ShadowNode::Unshared` and `ShadowNode::Weak` in favour of `std::shared_ptr<ShadowNode>` and `std::weak_ptr<ShadowNode>` ([12fb101e30](https://github.com/facebook/react-native/commit/12fb101e306778b6e5399b23f822cc0874a5c386) by [@sammy-SC](https://github.com/sammy-SC))

#### iOS specific

- **RCTFollyConvert:** `RCTFollyConvert.h` is deprecated please use `/ReactCommon/react/utils/platform/ios/react/utils/FollyConvert.h` instead ([685a60e6b4](https://github.com/facebook/react-native/commit/685a60e6b44018531abf47f98fd38d9c75f6aca6) by [@sammy-SC](https://github.com/sammy-SC))

### Removed

- **Yoga:** Remove `YogaLayoutableShadowNode::cleanLayout()` and Fix `ParagraphShadowNode` Font Size Invalidation Logic ([7979c7ce06](https://github.com/facebook/react-native/commit/7979c7ce0664bf019e17781e95a74baf95ec89f1) by [@NickGerleman](https://github.com/NickGerleman))

#### Android specific

- **APIs:** Internalize `NetworkingModule`'s `UriHandler`, `RequestBodyHandler`, and `ResponseHandler` APIs ([987e3f8c00](https://github.com/facebook/react-native/commit/987e3f8c0031affe89218675061eca3a4620e0cd) by [@huntie](https://github.com/huntie))
- **DeveloperSettings:** Remove deprecated `isStartSamplingProfilerOnInit` from `DeveloperSettings` ([ccb9edc717](https://github.com/facebook/react-native/commit/ccb9edc7179ec1b568038408118971c2ee4c1b27) by [@cortinico](https://github.com/cortinico))
- **JSC:** Remove 1st party JSC support ([8174d02811](https://github.com/facebook/react-native/commit/8174d028116f00b6e89968d368b719ec8b7f6ff6) by [@cortinico](https://github.com/cortinico))
- **JSEngineResolutionAlgorithm:** Remove and cleanup `JSEngineResolutionAlgorithm` ([0954c1db45](https://github.com/facebook/react-native/commit/0954c1db45511d1a640deb8d921d26457bb3777c) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- **JSC:** Remove code from jsc folder from React Native ([331fab0683](https://github.com/facebook/react-native/commit/331fab068355a3ba78776fbdf7e75ff4af3b740f) by [@cipolleschi](https://github.com/cipolleschi))
- **JSC:** Remove the option to use JSC from core ([a6ea626255](https://github.com/facebook/react-native/commit/a6ea6262555e7a25e27934f33099e95cb45c8077) by [@cipolleschi](https://github.com/cipolleschi))
- **Turbo Modules** Disable Turbo Modules fix for #51103 (dictionary stripped out when value is null) until more testing can be done. ([ca5f4d1721](https://github.com/facebook/react-native/commit/ca5f4d1721878ccd81ddcb9267f30160c6d17dd4) by [@javache](https://github.com/javache))

### Fixed

- **APIs:** Renamed argument names in the `onContentSizeChange` callback's type definition ([0386b9bd51](https://github.com/facebook/react-native/commit/0386b9bd5144b785af51c96ea6bada5c55127e98) by [@pchalupa](https://github.com/pchalupa))
- **BindingsInstallerHolder:** Fixed deprecation message for `BindingsInstallerHolder` ([4a8fda83e3](https://github.com/facebook/react-native/commit/4a8fda83e3d0f8aa0e5ac0c427c30fd9170ad375) by [@tomekzaw](https://github.com/tomekzaw))
- **C++:** Add `default:` case to avoid warnings/errors for targets that compile with `-Wswitch-enum` and `-Wswitch-default` enabled ([22b8b53c77](https://github.com/facebook/react-native/commit/22b8b53c77cb2fe87aa54be92d1758a603b7dd35) by [@NSProgrammer](https://github.com/NSProgrammer))
- **C++:** Add `default:` case to avoid warnings/errors for targets that compile with `-Wswitch-enum` and `-Wswitch-default` enabled ([9079b53c6f](https://github.com/facebook/react-native/commit/9079b53c6fa4ec9494f22390a89d1d42b77108a8) by [@NSProgrammer](https://github.com/NSProgrammer))
- **C++:** Fix clang tidy for react-native ([3e49d17f58](https://github.com/facebook/react-native/commit/3e49d17f58b9b7cc051925f43b709b020745312c) by [@RSNara](https://github.com/RSNara))
- **Color APIs:** Fix the serialization of the alpha channel in the `rgba()` color string format. ([1cc12ce7fd](https://github.com/facebook/react-native/commit/1cc12ce7fd5c8c766872906b4175122558d369a0) by [@piaskowyk](https://github.com/piaskowyk))
- **Color APIs:** Fix incorrect flattening / non-rendering of views with `backgroundColor` set to `rgba(255, 255, 255, 127/256)` ([b1e8729f4d](https://github.com/facebook/react-native/commit/b1e8729f4dfcb065978887b94a9e0ca65cdcfa77) by [@rubennorte](https://github.com/rubennorte))
- **Fantom:** Support viewport offsets for Fantom root and fix `getBoundingClientRect` to respect viewport offsets ([b5c62f52d1](https://github.com/facebook/react-native/commit/b5c62f52d185d6427425e25e6f18d0d86acaebf0) by [@lunaleaps](https://github.com/lunaleaps))
- **IntersectionObserver:** Fix potential leak inside `IntersectionObserver` ([a55f430daa](https://github.com/facebook/react-native/commit/a55f430daa4c9168272482125998da849840f9dd) by [@RSNara](https://github.com/RSNara))
- **LogBox:** Remove LogBox patch, de-duplicating errors ([e0797d0e03](https://github.com/facebook/react-native/commit/e0797d0e03bde6cd3321ff76556c5e2f0454ec63) by [@rickhanlonii](https://github.com/rickhanlonii))
- **ScrollView:** Expose `ScrollView.getNativeScrollRef` on the type definition to allow accessing the underlying `HostInstance`. ([4b91b63094](https://github.com/facebook/react-native/commit/4b91b630945b3d0f82656791d089451066aad538) by [@zbauman3](https://github.com/zbauman3))
- **Typescript:** Add `ImageSource` type to TypeScript ([42ca46b95c](https://github.com/facebook/react-native/commit/42ca46b95cf9938de00b76dc61948a4ae7116e2b) by [@okwasniewski](https://github.com/okwasniewski))
- **Typescript:** Devtools TS Types ([8f189fce03](https://github.com/facebook/react-native/commit/8f189fce03db367abdceca6ad57ae28b613fdd7d) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- **Yoga:** Fix possible invalid measurements with width or height is zero pixels ([5cc4d0a086](https://github.com/facebook/react-native/commit/5cc4d0a086d450e0f9d8ab6194013348f9de1f58) by [@NickGerleman](https://github.com/NickGerleman))
- **Yoga:** Fixed nodes with `display: contents` set being cloned with the wrong owner ([d4b36b0300](https://github.com/facebook/react-native/commit/d4b36b03003eb2de9eaf5b57bb639bae8cc12f20) by [@j-piasecki](https://github.com/j-piasecki))

#### Android specific
- **API:** Make accessors inside HeadlessJsTaskService open again ([7ef57163cb](https://github.com/facebook/react-native/commit/7ef57163cb016317e43e563da7ea181989f6abca) by [@cortinico](https://github.com/cortinico))
- **BaseViewManager:** Remove focus change listener when dropping/recycling view instances ([94cbf206d6](https://github.com/facebook/react-native/commit/94cbf206d607477257c65039d97565a79e94c7dd) by [@Abbondanzo](https://github.com/Abbondanzo))
- **BoringLayout:** Include fallback line spacing in `BoringLayout` ([2fe6c1a947](https://github.com/facebook/react-native/commit/2fe6c1a94758223a5342fdfa90163971eb588e6a) by [@NickGerleman](https://github.com/NickGerleman))
- **Bridgeless:** Adding `shouldForwardToReactInstance` check in `ReactDelegate` for Bridgeless ([0f7bf66bba](https://github.com/facebook/react-native/commit/0f7bf66bba8498c89384e96ad9219cdad0107b0c) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **Codegen:** Fix combining schema in Codegen process to exclude platforms correctly ([6104ccdc6e](https://github.com/facebook/react-native/commit/6104ccdc6ef89c2d4da25e60dcc55d73038e023f) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **FBReactNativeSpec:** Extract out `FBReactNativeSpec`'s core components including Unimplemented from auto-generated registry ([b417b0c2d5](https://github.com/facebook/react-native/commit/b417b0c2d56dc37f824c0e77e98d1014d21cd8f8) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **Gradle:** Fix Gradle v8.0 builds by using .set() for Property ([777397667c](https://github.com/facebook/react-native/commit/777397667c2625aab3fc907b9ef4bd564963d8bb) by [@meghancampbel9](https://github.com/meghancampbel9))
- **ImageFetcher:** Change `free` to `delete` to call destructor of `ImageFetcher` and release `contextContainer`. ([90da666691](https://github.com/facebook/react-native/commit/90da666691745ab9bf3930dc3347d8e51683099f) by [@WoLewicki](https://github.com/WoLewicki))
- **Modal:** Fix `Modal` first frame being rendered on top-left corner ([b950fa2afb](https://github.com/facebook/react-native/commit/b950fa2afb20e2213ff6c733cb1c2465b90406ef) by [@cortinico](https://github.com/cortinico))
- **onTextLayout:** Fix `onTextLayout` metrics not incorporating `ReactTextViewManagerCallback` ([a6a2884d63](https://github.com/facebook/react-native/commit/a6a2884d63717a42ac2bafd2054991ce8b32a2e9) by [@NickGerleman](https://github.com/NickGerleman))
- **RNGP:** Fix a race condition with codegen libraries missing sources ([9013a9e666](https://github.com/facebook/react-native/commit/9013a9e66629677c47e1b69703f9fc8f4cbc1c2c) by [@cortinico](https://github.com/cortinico))
- **Runtime:** Fixed `ReactHostImpl.nativeModules` always returning an empty list ([2f46a49](https://github.com/facebook/react-native/commit/2f46a49b8d8a11d5cf4342eee83c469b545c6779) by [@lukmccall](https://github.com/lukmccall))
- **Text:** Fix more text rounding bugs ([1fe3ff86c3](https://github.com/facebook/react-native/commit/1fe3ff86c364fad023ad1e426f26608699314339) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Fix `TextLayoutManager` `MeasureMode` Regression ([99119a2104](https://github.com/facebook/react-native/commit/99119a210487af18983145fd374ff7ebc88931f3) by [@NickGerleman](https://github.com/NickGerleman))
- **TextInput:** Fix bug where focus would jump to top text input upon clearing a separate text input. ([79c47987b7](https://github.com/facebook/react-native/commit/79c47987b74ab044574fc542fd4b13a9f11aa491) by [@joevilches](https://github.com/joevilches))

#### iOS specific

- **Gradient**: Gradient interpolation for transparent colors ([097d482446](https://github.com/facebook/react-native/commit/097d482446b7a03ca0f8c7e0254f4d770e05c79c) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **Package.swift:** Add missing `React-RCTSettings` to `Package.swift` ([e40c1d265a](https://github.com/facebook/react-native/commit/e40c1d265a2045730dcf751eed4ebf32e099f0c7) by [@chrfalch](https://github.com/chrfalch))
- **Package.swift:** Fixed defines in `Package.swift` ([e2f6ce4ddf](https://github.com/facebook/react-native/commit/e2f6ce4ddfbea5814fc5d8632df14daeae3636d1) by [@chrfalch](https://github.com/chrfalch))
- **Podspec:** Fixed premature return in header file generation from podspec globs ([f2b064c2d4](https://github.com/facebook/react-native/commit/f2b064c2d40c39017ac2a31bf3caf8acef23038c) by [@chrfalch](https://github.com/chrfalch))
- **Podspec:** Fixed issue with RNDeps release/debug switch failing ([4ee2b60a1e](https://github.com/facebook/react-native/commit/4ee2b60a1eacca744d58a7ad336ca9d3714289f6) by [@chrfalch](https://github.com/chrfalch))
- **Podspec:** Fixed missing script for resolving prebuilt xcframework when switching between release/debug ([2e55241a90](https://github.com/facebook/react-native/commit/2e55241a901b4cd95917de68ce9078928820a208) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Fixed wrong path in prebuild hermes check ([be11f2ee77](https://github.com/facebook/react-native/commit/be11f2ee77fd793efe0a1aa225897a1924163925) by [@chrfalch](https://github.com/chrfalch))
- **Prebuild:** Fixed resolving build type when downloading hermes artifacts ([9371e20192](https://github.com/facebook/react-native/commit/9371e201927fd105e797bf06e43943dd21e04381) by [@chrfalch](https://github.com/chrfalch))
- **RCTImage:** Allow for consuming `RCTImage` in Swift codebase by enabling "Defines Module" option ([1d80586730](https://github.com/facebook/react-native/commit/1d8058673085580f402ec3a320fce810db7ad2ef) by [@kkafar](https://github.com/kkafar))
- **RCTImageComponentView:** Fix `RCTImageComponentView` image loading after source props change with no layout invalidation ([cd5d74518b](https://github.com/facebook/react-native/commit/cd5d74518becb3355519373211d2f54ff7dbd208) by Nick Lefever)
- **RCTScreenSize:** Make `RCTScreenSize` take horizontal orientation into account ([50ce8c77a7](https://github.com/facebook/react-native/commit/50ce8c77a74f2f2574030db04dc88c6092e68ba8) by [@okwasniewski](https://github.com/okwasniewski))
- **TextInput:** Fixed blank space at the bottom of multiline `TextInput` on iOS ([2da4a6059a](https://github.com/facebook/react-native/commit/2da4a6059a82430fa7c1c078f0dcd38f0d3fe3cb) by [@tomekzaw](https://github.com/tomekzaw))
- **Turbo Modules:** Turbo Modules- Fixes dictionary stripped out when value is `null` ([4a4fd1cb8b](https://github.com/facebook/react-native/commit/4a4fd1cb8bb06eee185a3b2463caec4d2b7e9235) by [@zhongwuzw](https://github.com/zhongwuzw))

## v0.80.3

### Fixed

- **Codegen**: Fix missing dependencies ([24c5eec1a7](https://github.com/facebook/react-native/commit/24c5eec1a75e673475f325c780f7912fd2e88e85) by [@tido64](https://github.com/tido64))

#### Android specific

- **Accessibility**: Stabilize custom accessibility action IDs for TalkBack ([ec91661395](https://github.com/facebook/react-native/commit/ec9166139563f88e59300b830de0537340880669) by [@leg234-png](https://github.com/leg234-png))
- **Build**: Fix a race condition with codegen libraries missing sources ([75562ca9e5](https://github.com/facebook/react-native/commit/75562ca9e5ec1a08f16da38e7dd919c6afccb4ac) by [@cortinico](https://github.com/cortinico))
- **HeadlessJsTaskService**: Make accessors inside HeadlessJsTaskService open again ([1eef1fda6e](https://github.com/facebook/react-native/commit/1eef1fda6ef3a0e76243a4425308e8d662f971e3) by [@cortinico](https://github.com/cortinico))
- **Legacy Architecture**: Fix legacy architecture Android freeze on metro refresh ([e7ed0b1347](https://github.com/facebook/react-native/commit/e7ed0b13475cc6b80ee421d679740feba4f71a9a) by [@robhogan](https://github.com/robhogan))
- **Permissions**: Fix request permission is not always resolving in Android 16 ([9c8cc347ee](https://github.com/facebook/react-native/commit/9c8cc347ee93dafb38b5654e2723bb27095c8156) by [@lukmccall](https://github.com/lukmccall))
- **View**: Update font scale on Android when recreating RootView ([98f5c818f5](https://github.com/facebook/react-native/commit/98f5c818f542442245a0ee38a0ea8b6ce1652dd2) by [@j-piasecki](https://github.com/j-piasecki))

#### iOS specific

- **Prebuild**: Fixed cp command to work with gnu coreutils ([ea68e829bb](https://github.com/facebook/react-native/commit/ea68e829bbb936e41aea8e2c7fbaa56b45885124) by [@chrfalch](https://github.com/chrfalch))
- **RefreshControl**: Fix RefreshControl recycling ([8f8a5bee6b](https://github.com/facebook/react-native/commit/8f8a5bee6bbd118f6cef69cb0c9d9dfb4c30b372) by [@cipolleschi](https://github.com/cipolleschi))
- **RefreshControl**: Fix RefreshControl not refreshing on initial mount ([be7353881](https://github.com/facebook/react-native/commit/be7353881290cdc5abc8978e53a2387a8b586fc4) by [@cipolleschi](https://github.com/cipolleschi))
- **RCTDeviceInfo**: Fix RCTDeviceInfo crash when application.delegate.window is nil ([f153e7e05f](https://github.com/facebook/react-native/commit/f153e7e05f9d6afecdbca98c68381efa9d520830) by [@25harsh](https://github.com/25harsh))
- **TextInput**: Fix setting maxLength to 0 in TextInput still allows typing ([a209403ce3](https://github.com/facebook/react-native/commit/a209403ce34611bb96fd4d64205a71df2525d6dd) by [@riteshshukla04](https://github.com/riteshshukla04))

## v0.80.2

### Added

- **Hermes:** Added method to reset the timezone cache ([5c7dbc0a78](https://github.com/facebook/hermes/commit/5c7dbc0a78cb2d2a8bc81c41c617c3abecf209ff) by [@troZee](https://github.com/troZee))

#### Android specific

- **RNGP:** Add support for `exclusiveEnterpriseRepository` ([8e47e5486f](https://github.com/facebook/react-native/commit/8e47e5486f1b3dd8aa8e4965e8b8beeed215acd9) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- **Cocoapods:** Add the `ENTERPRISE_REPOSITORY` env var to let user consume artifacts from their personal maven mirror ([183be8e12c](https://github.com/facebook/react-native/commit/183be8e12c0de2efc5faf89ac250db8b646972b4) by [@cipolleschi](https://github.com/cipolleschi))

### Fixed

#### Android specific

- **InteropLayer:** Fix `ConcurrentModificationException` in `InteropUIBlockListener` ([d8b5a5570e](https://github.com/facebook/react-native/commit/d8b5a5570ee1f70483706a69acbacf8796679ade) by [@jkoutavas](https://github.com/jkoutavas))

## v0.80.1

### Added

- **Flow:** Publish top-level Flow types for `react-native` ([fbbd20dd63](https://github.com/facebook/react-native/commit/fbbd20dd632acd72d2abe861dd4a0e6e98437cf2) by [@buschco](https://github.com/buschco))
- **Flow:** Fix typo when publishing Flow types for `react-native` ([50667eceb1](https://github.com/facebook/react-native/commit/50667eceb1be4771375d6a3cc2f4e42d4d8aad3a) by [@aswinandro](https://github.com/aswinandro))

### Fixed

- **jest:** Fix missing RefreshControlMock source in Jest preset ([6044e01460](https://github.com/facebook/react-native/commit/6044e01460a065845d4178f0fdc54a601ce4c07e) by [@huntie](https://github.com/huntie))

#### Android specific

- **runtime:** Fix crash on ReactInstance due to null returned for getViewManagerNames ([f6b7bd93d8](https://github.com/facebook/react-native/commit/f6b7bd93d8d0d2095669144c8de438cf64d8e73f) by [@cortinico](https://github.com/cortinico))
- **TurboModules:** Emitting event from turbo module crashes on 32bit android ([36ddf853c3](https://github.com/facebook/react-native/commit/36ddf853c381966645789bc814fc2f6bb4d74cd2) by [@vladimirivanoviliev](https://github.com/vladimirivanoviliev))

## v0.80.0

### Breaking

- **APIs:** Subpath imports to the internal react-native/virtualized-lists package are not allowed. ([be8393c41b](https://github.com/facebook/react-native/commit/be8393c41b3d613385a2ee4632438030e80d6b2d) by [@iwoplaza](https://github.com/iwoplaza))
- **APIs:** The `react-native` package now defines package.json `"exports"`. ([319ba0afd2](https://github.com/facebook/react-native/commit/319ba0afd2f694bc70a20250f0b8c79a06a36dc6) by [@huntie](https://github.com/huntie))
- **C++:** Dispatch `folly::dynamic` events with r-value instead of l-value ([12e5df844b](https://github.com/facebook/react-native/commit/12e5df844bf60c19a825e5c5738d765a8562945c) by [@rozele](https://github.com/rozele))
- **C++:** Introduce beforeload callback arg into `ReactInstance::loadScript` ([061174c150](https://github.com/facebook/react-native/commit/061174c150ad05e0ea3fad3cdddb44df9710c337) by [@RSNara](https://github.com/RSNara))
- **deps:** Updated `eslint-config-react-native` to depend on `eslint-plugin-react-hooks` v5.2.0 from v4.6.0. This includes a breaking change in which ESLint will no longer recognize component names that start with 1 or more underscores followed by a capital letter. (https://github.com/facebook/react/pull/25162) ([4de592756b](https://github.com/facebook/react-native/commit/4de592756bb39d4fc99698c96d2f69dea46d82e1) by [@yungsters](https://github.com/yungsters))
- **NewAppScreen:** The `NewAppScreen` component is redesigned and moved to the `react-native/new-app-screen` package ([3cf0102007](https://github.com/facebook/react-native/commit/3cf01020071c76f40499878674cc7aaf5dbe168a) by [@huntie](https://github.com/huntie))

#### Android specific

- **APIs:** Deleting `ChoreographerCompat`, Use `Choreographer.FrameCallback` instead ([f8b2956437](https://github.com/facebook/react-native/commit/f8b2956437c23dd63463becc704b569bd8fcb19e) by [@mdvacca](https://github.com/mdvacca))
- **APIs:** Deleting deprecated `StandardCharsets` ([40b38d0a44](https://github.com/facebook/react-native/commit/40b38d0a44c7c83d36e34c9689ec3a2ac5d85b6b) by [@mdvacca](https://github.com/mdvacca))
- **APIs:**: Make `DeviceInfoModule` internal ([f02607badb](https://github.com/facebook/react-native/commit/f02607badb5641ab235f41be8005ce62d2bd63d4) by [@mateoguzmana](https://github.com/mateoguzmana))
- **APIs:**: Make `ModuleDataCleaner` internal ([6fa1864d52](https://github.com/facebook/react-native/commit/6fa1864d52fc47c37aeb5e0f99d972dee92f6ede) by [@mateoguzmana](https://github.com/mateoguzmana))
- **DevX:** Removed `loadSplitBundleFromServer` from `DevSupportManager` interface ([86cd31eb6b](https://github.com/facebook/react-native/commit/86cd31eb6bb72de0791a62b39b64a155c791f034) by [@javache](https://github.com/javache))
- **Kotlin:** Convert `ColorPropConverter` to Kotlin ([57768bfbcd](https://github.com/facebook/react-native/commit/57768bfbcd84100e244bff4910d46643559c015d) by [@fabriziocucci](https://github.com/fabriziocucci))
- **Kotlin:** Convert `DevSupportManagerBase` to Kotlin. If you're subclassing this class, you will have to adjust some of the parameters as types have changed during the migration. ([9da485b54c](https://github.com/facebook/react-native/commit/9da485b54c2deec324775f59cb36080baee9d4c9) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Convert `NetworkModule` to Kotlin, mark methods as final ([8726e26348](https://github.com/facebook/react-native/commit/8726e263486d07d71e0cd80eba5a4c52705fdb14) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Kotlin:** Convert `ReactEditText` to Kotlin. If you're subclassing this type you'll need to adjust your signatures. ([cac27d15be](https://github.com/facebook/react-native/commit/cac27d15bef39e1a4bf7e3279e85a7bae4ee3a9c) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Convert `ReactInstanceDevHelper` to Kotlin. Some users implementing this class in Kotlin could have breakages. As this is a devtools/frameworks API we're not marking this as breaking. ([09492075e8](https://github.com/facebook/react-native/commit/09492075e827f96d9ce9a5d689ac7d0a44380a33) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Convert `ReactTextInputManager` to Kotlin ([ab47834eb1](https://github.com/facebook/react-native/commit/ab47834eb1910b4da1c594843cf1ab5dc02d23c1) by [@cortinico](https://github.com/cortinico))

#### iOS specific

- **APIs:** Delete `BridgeModuleBatchDidComplete` config helpers ([cbad8aafa5](https://github.com/facebook/react-native/commit/cbad8aafa541546c82e8079f6ef1a54ce8df83b3) by [@philIip](https://github.com/philIip))
- **NativeModules:** Cleanup queue configs for some native modules ([5b5cf0e199](https://github.com/facebook/react-native/commit/5b5cf0e1995b11336ed029a7afc8eba1f02ac9d1) by [@philIip](https://github.com/philIip))

### Added

- **Accessibility:** Add accessibilityOrder to iOS and Android ([8cf4d5b531](https://github.com/facebook/react-native/commit/8cf4d5b531647375b202130bd2d3b8b2f6dce8e3) by [@jorge-cab](https://github.com/jorge-cab))
- **Codegen:** Codegen utility functions and types are now exported from the root package ([c7aa3f3fe7](https://github.com/facebook/react-native/commit/c7aa3f3fe722731fa7383385bce541eac860feca) by [@j-piasecki](https://github.com/j-piasecki))
- **Events:** Add `UIManager::add/RemoveEventListener` ([b0f2083d9d](https://github.com/facebook/react-native/commit/b0f2083d9d881c8b0629fa455f6eb0c963e7e531) by [@zeyap](https://github.com/zeyap))
- **Events:** EventEmitter `addListener` and `removeListener` APIs ([ff4537c15e](https://github.com/facebook/react-native/commit/ff4537c15ecef319ff3dfc87613e4696d280c643) by [@rozele](https://github.com/rozele))
- **Image:** Support headers [crossOrigin and referralPolicy] in Image without src and srcSet and only remote source.uri ([49ea9d80b8](https://github.com/facebook/react-native/commit/49ea9d80b883b50d242908bb47881b2680302291) by [@anupriya13](https://github.com/anupriya13))
- **JS:** Add `compact` option to `react-native/babel-preset` to allow disabling whitespace removal ([86911003dc](https://github.com/facebook/react-native/commit/86911003dc396afd3e2016b7435d56c2269c33ff) by [@jnields](https://github.com/jnields))
- **JS:** Added `no-deep-imports` rule to `eslint-plugin-react-native`. ([87809d9326](https://github.com/facebook/react-native/commit/87809d9326f7463e30bbf78edca0ef2a2fa139d9) by [@coado](https://github.com/coado))
- **Networking:** Implementation for `URLSearchParams` ([af1f1e4fe5](https://github.com/facebook/react-native/commit/af1f1e4fe5cb6514d2e806fe0ad5b505e86c0f4b) by Ritesh Shukla)
- **Networking:** URL accessors for unimplemented Methods ([3dac90006f](https://github.com/facebook/react-native/commit/3dac90006fe046fd7b1fcedd93955cc88eaaed6f) by [@riteshshukla04](https://github.com/riteshshukla04))
- **NewArch:** Add warning when the app runs with the legacy architecture ([706b6e878d](https://github.com/facebook/react-native/commit/706b6e878d7d503ed870d6635ae1f963a34e8ccd) by [@cipolleschi](https://github.com/cipolleschi))
- **Pressable:** Expose `onPressMove` as base prop for `Pressable` ([6df938c72e](https://github.com/facebook/react-native/commit/6df938c72eb9b71ad626462127164fbb6cd4947c) by Regina Tuk)
- **ScrollView:** Add `showsVerticalScrollIndicator` in ScrollViewProps.cpp `SetProp` ([bc90c839aa](https://github.com/facebook/react-native/commit/bc90c839aa8efb6f721a9b72a7b8248a0da3a219) by [@anupriya13](https://github.com/anupriya13))
- **StyleSheet:** Added slash of alpha support using rgb() ([7441127040](https://github.com/facebook/react-native/commit/7441127040f6da52f04b3bccc37894e51d09c6b2) by [@zhongwuzw](https://github.com/zhongwuzw))
- **StyleSheet:** Adds JS changes for radial gradient ([1b45dc8033](https://github.com/facebook/react-native/commit/1b45dc8033e1064b2485c8b855a05634e2c1163f) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **StyleSheet:** CSS Added hwb(H W B / A) notation ([692b05e77d](https://github.com/facebook/react-native/commit/692b05e77d42c9b3ef6dfcbb31f6a11ba0f1e5a3) by [@zhongwuzw](https://github.com/zhongwuzw))
- **Testing:** Added a custom Jest resolver to opt out from handling `"exports"` in tests ([ee9bd851ac](https://github.com/facebook/react-native/commit/ee9bd851acfc38150f434d676602865ba8cec591) by [@j-piasecki](https://github.com/j-piasecki))
- **Text:** Support `minimumFontScale` in `paragraphAttributes` ([f53d066d26](https://github.com/facebook/react-native/commit/f53d066d26352e6abfdf2f727ea06425ea163039) by [@anupriya13](https://github.com/anupriya13))
- **TurboModules:** Create `TurboModuleWithJSIBindings` interface ([1acd45950b](https://github.com/facebook/react-native/commit/1acd45950bb85560e2578fa6feaa9e5666c1b65e) by [@zeyap](https://github.com/zeyap))
- **TypeScript:** Added type definitions for Colors object in LaunchScreen module to enhance code readability and type safety. ([c2864c160d](https://github.com/facebook/react-native/commit/c2864c160dac3253dc20c598865884f8b4c67163) by [@qnnp-me](https://github.com/qnnp-me))
- **TypeScript:** Configure the "react-native-strict-api" opt in for our next-gen TypeScript API ([6ea24f7bb9](https://github.com/facebook/react-native/commit/6ea24f7bb90829f0806210252dfce50ecee5666d) by [@huntie](https://github.com/huntie))
- **runtime:** Allow setting `SurfaceStartedCallback` on `UIManager` ([c5e9ef53ae](https://github.com/facebook/react-native/commit/c5e9ef53ae9bfe6ea06ddee54228ada0305e4df7) by [@zeyap](https://github.com/zeyap))
- **runtime:** Move rncxx scheduler to oss ([744a0f8385](https://github.com/facebook/react-native/commit/744a0f8385c0dacfbd25446d08cb6e1640a5a2f9) by [@zeyap](https://github.com/zeyap))

#### Android specific

- **Accessibility:** Expose Android's `screenReaderFocusable` prop ([4ce093154d](https://github.com/facebook/react-native/commit/4ce093154d8fe130fca1f8da57067a666171db7f) by [@jorge-cab](https://github.com/jorge-cab))
- **Animated:** Create `UIManagerNativeAnimatedDelegate` to potentially drive per frame NativeAnimated update ([8d6098a645](https://github.com/facebook/react-native/commit/8d6098a645745fa964bac475ff14598d0cdfd11a) by [@zeyap](https://github.com/zeyap))
- **APIs:** Collections DSL functions for Kotlin(`buildReadableMap`, `buildReadableArray`) ([78dbbaafdd](https://github.com/facebook/react-native/commit/78dbbaafdd4a732f6cbb1525816b38a51adcf1cf) by [@l2hyunwoo](https://github.com/l2hyunwoo))
- **C++:** Allow invoking `synchronouslyUpdateViewOnUIThread` from c++ via `UIManager` ([4912958812](https://github.com/facebook/react-native/commit/49129588123fe05c828fae036b9521f4ba6fe84c) by [@zeyap](https://github.com/zeyap))
- **infra:** Generate `keep.xml` to prevent resource shrinking ([864833fca9](https://github.com/facebook/react-native/commit/864833fca9334ba0b986243fce790e89ff64d932) by [@jakex7](https://github.com/jakex7))
- **NewArch:** Add a `legacyWarningsEnabled` property to enable Legacy Warnings on NewArch ([7ca2811750](https://github.com/facebook/react-native/commit/7ca28117507688864af0561a0350d46666410291) by [@cortinico](https://github.com/cortinico))
- **NewArch:** Warn Legacy Arch users if they use a Component with a ShadowNode with `YogaMeasureFunction.measure()` function. That Component will stop working on NewArch. ([9345c88a61](https://github.com/facebook/react-native/commit/9345c88a619f36537e25cf28b79d2c01cd40f780) by [@cortinico](https://github.com/cortinico))
- **StyleSheet:** Adds android changes for radial gradient ([a2409941c2](https://github.com/facebook/react-native/commit/a2409941c20f63d0339e2f2b1c9a2e942d29ca2e) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **TextInput:** Add new prop for filtering drag and drop targeting to text inputs ([d10dd7130c](https://github.com/facebook/react-native/commit/d10dd7130ccc61c3f183f96edb8fec1279ec8a9a) by [@Abbondanzo](https://github.com/Abbondanzo))

#### iOS specific

- **Accessibility:** Expose iOS's `accessibilityRespondsToUserInteraction` as a prop ([fd8a3456ca](https://github.com/facebook/react-native/commit/fd8a3456cac72634cc149904e157e07257dbf364) by [@jorge-cab](https://github.com/jorge-cab))
- **AppDelegate:** Allow eager initialization of `RCTRootViewFactory` ([ddbb5fda09](https://github.com/facebook/react-native/commit/ddbb5fda09ff3daaa69e195d2d872bc88480e707) by [@mdjastrzebski](https://github.com/mdjastrzebski))
- **AppDelegate:** On `RCTReactNativeFactory` add `initWithDelegate` overload with argument to specify release level for an application ([df282a0538](https://github.com/facebook/react-native/commit/df282a0538224258a48ef77ebf9b9d2ed77ed5d5) by [@jorge-cab](https://github.com/jorge-cab))
- **AppDelegate:** Useful error message about setting dependency provider ([e1464c0975](https://github.com/facebook/react-native/commit/e1464c097550bb9251513ba64547f4c5afdc838d) by [@okwasniewski](https://github.com/okwasniewski))
- **Codegen:** Introduce module/component annotations inside package.json ([76436d35c7](https://github.com/facebook/react-native/commit/76436d35c73772f161071066b98b640bf68094ea) by [@RSNara](https://github.com/RSNara))
- **InteropLayer:** Enabled `useFabricInterop` by default in OSS ([21c858ce3e](https://github.com/facebook/react-native/commit/21c858ce3ef55a9812c8e53d3a1b40836564dd6c) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **NewArch:** Add flag to enable or disable legacy warning. ([ce7a602edf](https://github.com/facebook/react-native/commit/ce7a602edfe1e7121b4e7b05b80e338304dcf579) by [@cipolleschi](https://github.com/cipolleschi))
- **NewArch:** Add warnings when a legacy module is used in the Interop Layer. ([7b500b8522](https://github.com/facebook/react-native/commit/7b500b8522792b26b0afe8c33dedd460c6d99227) by [@cipolleschi](https://github.com/cipolleschi))
- **NewArch:** Add warnings when components are loaded using the interop layer. ([8acc53da57](https://github.com/facebook/react-native/commit/8acc53da57d3295cf76ae61e183e7c42973928f4) by [@cipolleschi](https://github.com/cipolleschi))
- **NewArch:** Automate setting the RCTNewArchEnabled flag ([3b3d502ccf](https://github.com/facebook/react-native/commit/3b3d502ccfc163ecb8531fb465032e831980b8af) by [@cipolleschi](https://github.com/cipolleschi))
- **NewArch:** Show warnings in the New Architecture when modules are loaded using RCT_EXPORT_MODULE ([4d40882172](https://github.com/facebook/react-native/commit/4d40882172a303cdb0f8ff96e0884749f4ebc840) by [@cipolleschi](https://github.com/cipolleschi))
- **StyleSheet:** Radial gradient ([d7533dce1c](https://github.com/facebook/react-native/commit/d7533dce1cdb4c0bc70deeab68f53752d13becf2) by [@intergalacticspacehighway](https://github.com/intergalacticspacehighway))
- **TextInput:** Add new prop for filtering drag and drop targeting to text inputs ([93f12eb71d](https://github.com/facebook/react-native/commit/93f12eb71d20feb0d7b96758df6c53b0277032f5) by [@Abbondanzo](https://github.com/Abbondanzo))
- **TurboModules:** Introduce unstableRequiresMainQueueSetup api to modules ([636665c1c2](https://github.com/facebook/react-native/commit/636665c1c20d1ba51f16eea18664e3cd35308518) by [@RSNara](https://github.com/RSNara))

### Changed

- **Animated:** Animated components' `ref` will now only reattach when receiving new props if the new props contain different `AnimatedValue` or `AnimatedEvent` instances. (Previously, Animated components' `ref` would always reattach when receiving new props.) ([eeab47e61a](https://github.com/facebook/react-native/commit/eeab47e61a32b5fe33352a58ad7b8ac0a652ba6b) by [@yungsters](https://github.com/yungsters))
- **Animated:** When an `Animated` component is unmounted, any completion callbacks will now be called in a microtask instead of during the commit phase. ([da1bf8d1d1](https://github.com/facebook/react-native/commit/da1bf8d1d1b83b8cee76e94987d94d9ffba6db51) by [@yungsters](https://github.com/yungsters))
- **APIs:** InteractionManager is deprecated and will be removed in a future release. Its behavior has been changed to be the same as `setImmediate`, and callers should migrate away from it. ([a8a4ab10d0](https://github.com/facebook/react-native/commit/a8a4ab10d0ee6004524f0e694e9d5a41836ad5c4) by [@yungsters](https://github.com/yungsters))
- **Codegen:** Changed `react-native-codegen` to support types under `CodegenTypes` namespace ([5349b7c7b5](https://github.com/facebook/react-native/commit/5349b7c7b586a86adcfa6f123aa138efac5811ce) by [@j-piasecki](https://github.com/j-piasecki))
- **deps:** Bump minimum Metro from 0.81.0 to ^0.81.3 || ^0.82.0 ([6606a1da84](https://github.com/facebook/react-native/commit/6606a1da8434a8d59d898a56e277f4130442d2ad) by [@robhogan](https://github.com/robhogan))
- **deps:** Bump React to 19.1 ([0e11e6a28b](https://github.com/facebook/react-native/commit/0e11e6a28bf3a12e30b5c6a7e93f3a5653888375) by [@cipolleschi](https://github.com/cipolleschi))
- **deps:** Replace hsr_core dependency for react profiling with hz_tracing dependency ([0f55ef7754](https://github.com/facebook/react-native/commit/0f55ef7754109c68a0bd10d958d8c81ead5e42e2) by [@metaadrianstone](https://github.com/metaadrianstone))
- **deps:** Update debugger-frontend from bc635fa...343405b ([647af1c4ca](https://github.com/facebook/react-native/commit/647af1c4ca219515ab00b442370b61346ba1edb1) by [@huntie](https://github.com/huntie))
- **deps:** Update Metro to ^0.82.0 ([0ad192003e](https://github.com/facebook/react-native/commit/0ad192003ef786c7dd1322762690d63730f17582) by [@robhogan](https://github.com/robhogan))
- **Flow:** Changed Flow for the React Native monorepo, so that `React` no longer has to be in scope when using JSX. ([1bb7446993](https://github.com/facebook/react-native/commit/1bb7446993e5151b92367f33f5bed3f5783f471a) by [@yungsters](https://github.com/yungsters))
- **Hermes:** Configured Hermes Parser for Metro to target React 19, resulting in Component Syntax no longer producing `forwardRef` calls. ([f2518d4374](https://github.com/facebook/react-native/commit/f2518d43746fbf712b8cb0ca920f134005c1faec) by [@yungsters](https://github.com/yungsters))
- **Hermes:** Configured Hermes Parser for ReactNative to target React 19, resulting in Component Syntax no longer producing `forwardRef` calls. ([68cad5d2d3](https://github.com/facebook/react-native/commit/68cad5d2d3c3b364a86767b0dfe4f92086223a7c) by [@yungsters](https://github.com/yungsters))
- **JS:** `eslint-config-react-native` now respects rules disabled by `eslint-config-prettier`. ([6346689c3d](https://github.com/facebook/react-native/commit/6346689c3d0420c1d6b85ca8db1e4f3fa115c5e9) by [@yungsters](https://github.com/yungsters))
- **JS:** Replaced `let` with `const` where applicable for better code standards and micro-optimization. ([38fefb2771](https://github.com/facebook/react-native/commit/38fefb2771d7ff65568fa989f2ca4a5bf44e58ec) by [@sanjaiyan-dev](https://github.com/sanjaiyan-dev))
- **TypeScript:** Re-expose `src/*` subpaths when not using the Strict TypeScript API ([1a46b203b8](https://github.com/facebook/react-native/commit/1a46b203b83d7cbe44185cd7e437e77b850e1af5) by [@huntie](https://github.com/huntie))
- **TypeScript:** Replace deprecated `React.ElementRef` usages to `React.ComponentRef` ([12147e3bee](https://github.com/facebook/react-native/commit/12147e3bee782a73c1560593912ad706d2262b0c) by [@mateoguzmana](https://github.com/mateoguzmana))

#### Android specific

- **API:** Make mHybridData in `CxxReactPackage` protected ([0c58ccf501](https://github.com/facebook/react-native/commit/0c58ccf501c1478242c28122bdc87bcd7389e56b) by [@zeyap](https://github.com/zeyap))
- **APIs:** Make ReactRawTextManager internal. We verified no popular libraries are impacted by this change ([788213f91a](https://github.com/facebook/react-native/commit/788213f91accd38be90b53bca218cd6cd050daeb) by [@cortinico](https://github.com/cortinico))
- **Blob:** Creating of Blobs from large files now works. File size can now be upto available (free) heap size. ([81e47af764](https://github.com/facebook/react-native/commit/81e47af7648c489e29982221552086db4a807b8d) by [@giantslogik](https://github.com/giantslogik))
- **C++:** Enable `INTERPROCEDURAL_OPTIMIZATION` for `libappmodules.so` in OSS ([2da062f9d1](https://github.com/facebook/react-native/commit/2da062f9d19196c338191cbc85c2e893a82f4107) by [@cortinico](https://github.com/cortinico))
- **C++:** Enable `INTERPROCEDURAL_OPTIMIZATION` for React Native ([f107c28d2f](https://github.com/facebook/react-native/commit/f107c28d2fe03bd10eada503aecf23fa966be9c5) by [@cortinico](https://github.com/cortinico))
- **deps:** AGP to 8.9.2 ([e4bf88a076](https://github.com/facebook/react-native/commit/e4bf88a0765c765e27236199d8138233c4590047) by [@cortinico](https://github.com/cortinico))
- **deps:** Gradle to 8.14 ([0e963aaa54](https://github.com/facebook/react-native/commit/0e963aaa54a0324b20795069bdf112e801ca2f62) by [@cortinico](https://github.com/cortinico))
- **deps:** Gradle to 8.14.1 ([827a6851d0](https://github.com/facebook/react-native/commit/827a6851d0a61c048fec7a73ca3b293ef90ad2ae) by [@cortinico](https://github.com/cortinico))
- **deps:** Kotlin to 2.1.20 ([a3d38d5722](https://github.com/facebook/react-native/commit/a3d38d57223dafac0c23c044bd78af020538591c) by [@cortinico](https://github.com/cortinico))
- **DevX:** Automatically use Metro bundler IP address when installing apps on Android ([d816ba0a70](https://github.com/facebook/react-native/commit/d816ba0a7005f413bc45510d34223f632e752c27) by [@hrastnik](https://github.com/hrastnik))
- **DevX:** Leading slash supplied to `DevServerHelper.downloadBundleResourceFromUrlSync` will now be trimmed and emit a warning. ([cf67427406](https://github.com/facebook/react-native/commit/cf67427406426efc9e03b279577056e8692a764b) by [@yungsters](https://github.com/yungsters))
- **Kotlin:** `ReactActivity` has been migrated to Kotlin. ([403feb9bc2](https://github.com/facebook/react-native/commit/403feb9bc25226120daf1daa1ec401b263b7e833) by [@rshest](https://github.com/rshest))
- **Kotlin:** Migrate `BlobProvider` to Kotlin ([5d1febf7de](https://github.com/facebook/react-native/commit/5d1febf7def124ef84e2224923d2b26fcdb81236) by [@JatinDream11](https://github.com/JatinDream11))
- **Kotlin:** Migrate `DevSupportManagerFactory` to Kotlin - We couldn't find any implementation of this class in OSS. Some Kotlin implementers might have to change the method signatures. However this interface is not supposed to be extended in OSS. ([0bd0635be6](https://github.com/facebook/react-native/commit/0bd0635be6b9102a02e62d2be430b1dba218cd36) by [@cortinico](https://github.com/cortinico))
- **Kotlin:** Migrate `DynamicFromArray` to Kotlin ([74e8c78268](https://github.com/facebook/react-native/commit/74e8c7826864c166efc735b6d419f9005452942d) by [@BogiKay](https://github.com/BogiKay))
- **Kotlin:** Migrate `DynamicFromMap.java` to Kotlin ([86a7388355](https://github.com/facebook/react-native/commit/86a738835555e3377f27ddee0e0083cae8c4804f) by [@artus9033](https://github.com/artus9033))
- **Kotlin:** Migrate `DynamicFromObject` to Kotlin ([867858df65](https://github.com/facebook/react-native/commit/867858df655445efca1bbfe3ddca55a30a11c7e5) by [@yasir6jan](https://github.com/yasir6jan))
- **Kotlin:** Migrate `FileReaderModule` to Kotlin ([07a1fb8e6b](https://github.com/facebook/react-native/commit/07a1fb8e6b3ef8f5ab2b53bd2c5ffff15467f7ea) by [@devanshsaini11](https://github.com/devanshsaini11))
- **Kotlin:** Migrate `FrescoBasedReactTextInlineImageShadowNode` to Kotlin ([30030c5a76](https://github.com/facebook/react-native/commit/30030c5a763280681782e27f26df1d451ff7f93c) by [@nitinshukla413](https://github.com/nitinshukla413))
- **Kotlin:** Migrate `Inspector` to Kotlin ([93efaeb241](https://github.com/facebook/react-native/commit/93efaeb241fcf037b22a92b127d5ffd9fe8bde0c) by [@Vin-Xi](https://github.com/Vin-Xi))
- **Kotlin:** Migrate `JavaModuleWrapper` to Kotlin ([79d3eea0b7](https://github.com/facebook/react-native/commit/79d3eea0b72fc50dab44135d502be2fb39128520) by drrefactor)
- **Kotlin:** Migrate `JSBundleLoader` to Kotlin ([de165a2cfd](https://github.com/facebook/react-native/commit/de165a2cfdb9967ae99237d8c9519cc2dd232855) by [@yogeshpaliyal](https://github.com/yogeshpaliyal))
- **Kotlin:** Migrate `NativeAnimatedModule` to kotlin ([de9b4f3642](https://github.com/facebook/react-native/commit/de9b4f36425cb4df6642e29528da33880623844b) by [@zeyap](https://github.com/zeyap))
- **Kotlin:** Migrate `NativeAnimatedNodesManager` to kotlin ([bfb274c244](https://github.com/facebook/react-native/commit/bfb274c244a9744b6f8cfc9c6b95cc7edca83ef1) by [@zeyap](https://github.com/zeyap))
- **Kotlin:** Migrate `ReactClippingViewGroupHelper` to Kotlin ([2834825b8b](https://github.com/facebook/react-native/commit/2834825b8ba01119b4ae3a01ec641defaea1a1f2) by priyanka.raghuvanshi)
- **Kotlin:** Migrate `ReactEditTextInputConnectionWrapper` to Kotlin ([5c9883b018](https://github.com/facebook/react-native/commit/5c9883b01865f4cb880bf525de69f4ab5aaed008) by [@Q1w1N](https://github.com/Q1w1N))
- **Kotlin:** Migrate `ReactLifecycleStateManager` to Kotlin ([800b12406f](https://github.com/facebook/react-native/commit/800b12406f8ea777bef93e98685aacfda0560d5b) by [@rohitverma-d11](https://github.com/rohitverma-d11))
- **Kotlin:** Migrate `ReactStylesDiffMap` to Kotlin ([a0f016ecad](https://github.com/facebook/react-native/commit/a0f016ecad4d577300e95de41be4e297b9c02c4f) by [@poonamjain96](https://github.com/poonamjain96))
- **Kotlin:** Migrate `UiThreadUtil` to Kotlin ([1033584c20](https://github.com/facebook/react-native/commit/1033584c203f41821d5802f56d66cae005ea9b77) by [@riteshshukla04](https://github.com/riteshshukla04))
- **Kotlin:** Migrate `ViewGroupManager` to kotlin ([761b15888d](https://github.com/facebook/react-native/commit/761b15888df3b0f47b84a2e29a330165bc7a9492) by [@riteshshukla04](https://github.com/riteshshukla04))
- **Kotlin:** Refactor class `FrescoBasedTextInlineImageSpan` from Java to Kotlin. ([cb51d25ba8](https://github.com/facebook/react-native/commit/cb51d25ba8bd6c4675efd58311891a40d83b4108) by [@gouravkhunger](https://github.com/gouravkhunger))
- **Layout:** Prevent currently focused child from getting clipped when `removeClippedSubviews` is enabled ([81405b450c](https://github.com/facebook/react-native/commit/81405b450c77ec66687db9ab62dcba9d6b869d4a) by [@jorge-cab](https://github.com/jorge-cab))
- **runtime:** Do not crash when parent view state can't be found ([ade41c851b](https://github.com/facebook/react-native/commit/ade41c851b2081278d37fd74bd4b9701ccdfbf15) by [@javache](https://github.com/javache))
- **StyleSheet:** Change to use new Background and new Border drawables by default ([132a871b46](https://github.com/facebook/react-native/commit/132a871b465eb6509be0e3d9ae61d032b415f535) by [@jorge-cab](https://github.com/jorge-cab))
- **Text:** Incorporate maxLines and ellipsization into text layout ([b1367eeb81](https://github.com/facebook/react-native/commit/b1367eeb81078605a39959c49568b00fae7ea8e1) by [@NickGerleman](https://github.com/NickGerleman))

#### iOS specific

- **CocoaPods:** Enable `DEFINES_MODULE` in `React-jsc.podspec` ([473e42bbc3](https://github.com/facebook/react-native/commit/473e42bbc383fb01981bdfc7085ab923f0c786c0) by [@krozniata](https://github.com/krozniata))
- **Image:** Update `RCTImageLoader.mm` to cast `loadHandler` to `RCTImageLoaderLoggable` before calling `shouldEnablePerfLogging` ([2562440385](https://github.com/facebook/react-native/commit/2562440385a4e2747df8f3bfb734a5c86976f514) by Aaron Coplan)
- **ScrollView:** Overwrite betterHitTest in `RCTScrollViewComponentView` instead of changing layout metrics of the container view ([850760ab61](https://github.com/facebook/react-native/commit/850760ab6112d1f38a5a9014282ae5186ab814d6) by [@j-piasecki](https://github.com/j-piasecki))
- **Text:** Replace a workaround for measuring multiline text with `maximumNumberOfLines` on iOS with a proper solution ([77cdaa8733](https://github.com/facebook/react-native/commit/77cdaa8733db7a7de25b8b0aef87a11f91be9efd) by [@j-piasecki](https://github.com/j-piasecki))

### Deprecated

- **Events:** Deprecate `*EventData` types on `Image`, `Switch`, `TextInput` components. These can be substituted for `*Event`, e.g. `NativeSyntheticEvent<ImageLoadEventData>` becomes `ImageLoadEvent`. ([701859b397](https://github.com/facebook/react-native/commit/701859b397eddc0686fcdfe43e0244888168dc12) by [@huntie](https://github.com/huntie))

#### Android specific

- **APIs:** Correctly deprecate `ReactContextBaseJavaModule.getCurrentActivity()` method ([1408c69fd8](https://github.com/facebook/react-native/commit/1408c69fd8c5327bd3390fce8ed41e20299a5bfa) by [@cortinico](https://github.com/cortinico))
- **APIs:** Deprecate `UIManagerType.DEFAULT`, replaced by `UIManagerType.LEGACY` ([a8668319ad](https://github.com/facebook/react-native/commit/a8668319ad203cb3dc78f725f5544da6048d5b4e) by [@mdvacca](https://github.com/mdvacca))

#### iOS specific

- **Image:** Deprecate `loadImageForURL` in favor of new signature which uses completionHandlerWithMetadata ([43c9a609de](https://github.com/facebook/react-native/commit/43c9a609deb1b769c51751d61904a5d80f0bd05a) by Aaron Coplan)
- **NewArch:** Deprecate the `RCT_NEW_ARCH_ENABLED` and the `RCTSetNewArchEnabled` ([6dd721b258](https://github.com/facebook/react-native/commit/6dd721b258ba775de945d9df25f8a9eca4c509b1) by [@cipolleschi](https://github.com/cipolleschi))

### Removed

#### Android specific

- **APIs:** `TouchesHelper` is no longer part of the public API ([2196597e2b](https://github.com/facebook/react-native/commit/2196597e2b602acdaecdfe04a6fb9046cb042f85) by [@javache](https://github.com/javache))
- **APIs:** Deprecated `ResourceDrawableIdHelper.instance` ([8de401c625](https://github.com/facebook/react-native/commit/8de401c62520fc0ef83e820b62e15714dc793b45) by [@javache](https://github.com/javache))
- **APIs:** Remove `FabricSoLoader` from public API ([902f82656e](https://github.com/facebook/react-native/commit/902f82656edc6c092e074759a47dc46aad53a63e) by [@javache](https://github.com/javache))
- **APIs:**: Make `StateWrapperImpl` Internal ([9f941c50c9](https://github.com/facebook/react-native/commit/9f941c50c970e35ac6fcfa11848d1f7f5a0a9323) by [@NickGerleman](https://github.com/NickGerleman))
- **Events:** Removed `(un)registerEventEmitter` from `EventDispatcher` interface ([d1c0f57073](https://github.com/facebook/react-native/commit/d1c0f57073a083b787af6c78d662506c760acf4e) by [@javache](https://github.com/javache))
- **Events:** Removed deprecated `EventBeatManager(ReactApplicationContext)` constructor ([c97af95a7f](https://github.com/facebook/react-native/commit/c97af95a7ffe2267f6d13f68c607fefac12d639b) by [@javache](https://github.com/javache))

#### iOS specific

- **APIs:** Delete `RCTComputeScreenScale` ([094876367f](https://github.com/facebook/react-native/commit/094876367f2821edce16331f5a30f9edb303dbe9) by [@RSNara](https://github.com/RSNara))
- **APIs:** Remove `RCTFloorPixelValue` ([dc97df10a2](https://github.com/facebook/react-native/commit/dc97df10a2f243855b3c5c9135d01cbc0c543d87) by [@RSNara](https://github.com/RSNara))

### Fixed

- **Alert:** Add missing type variation `{login: string, password: string}` to **AlertType** type definition to properly support `login-password` prompt callbacks ([c6a075bcc7](https://github.com/facebook/react-native/commit/c6a075bcc72b984da787a94d30d38426a68cef80) by [@assynu](https://github.com/assynu))
- **C++:** Add explicit `folly/dynamic.h` include where it is actually used ([0b1d0e84ee](https://github.com/facebook/react-native/commit/0b1d0e84eed1714e4d5dbf67a01f8c25fd5445d8) by [@mzlee](https://github.com/mzlee))
- **Codegen:** Do not generate Apple specific files for Android ([e83ece0d17](https://github.com/facebook/react-native/commit/e83ece0d17217c18a9b3dea53f261b9e0a45621a) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Fixed codegen breaking when a subset of `modulesConformingToProtocol` fields was specified or when the value was string ([e4ef685dd7](https://github.com/facebook/react-native/commit/e4ef685dd75f09f22b0122e83fc94bc9d2df8a97) by [@j-piasecki](https://github.com/j-piasecki))
- **CompatCheck:** Allow union changes when the new element is in the middle of the union ([69ccbc3943](https://github.com/facebook/react-native/commit/69ccbc39438d599308b8d98c0dcf72d3bae1bf41) by [@elicwhite](https://github.com/elicwhite))
- **DevSupport:** Made `DevServerHelper` and its method open so that they can be overridden. ([2a0c1e6a9e](https://github.com/facebook/react-native/commit/2a0c1e6a9e98c19101dc89b9adba4a990cd6902c) by [@chrfalch](https://github.com/chrfalch))
- **Kotlin:** Made function `removeView` open in Kotlin class ([9d11dcd3b0](https://github.com/facebook/react-native/commit/9d11dcd3b06641dc8780043067d6d4fbfcac71d1) by [@chrfalch](https://github.com/chrfalch))
- **NewAppScreen:** Fix Networking URL in New app screen ([89e6c72fd4](https://github.com/facebook/react-native/commit/89e6c72fd4ba6c0610e892069ee5b96092dfc192) by [@riteshshukla04](https://github.com/riteshshukla04))
- **PullToRefresh:** Fixed crash in RCTPullToRefreshViewComponentView#updateProps ([fab7fa88e3](https://github.com/facebook/react-native/commit/fab7fa88e3bd3c84a0ffe0c027e14185b037120d) by [@javache](https://github.com/javache))
- **Runtime:** Align timer IDs and timer function argument error handling with web standards. ([480a4642e5](https://github.com/facebook/react-native/commit/480a4642e5a644becf1c477d3d239f9b57efff3a) by [@kitten](https://github.com/kitten))
- **StyleSheet:** Outline now takes into account outline-offset to calculate its border-radius, same as web. ([b47bfcef5f](https://github.com/facebook/react-native/commit/b47bfcef5f85ed1b4d713bec9be76efd1b485d3d) by [@jorge-cab](https://github.com/jorge-cab))
- **StyleSheet:** Wrong `borderBottomEndRadius` on RTL ([68d6ada448](https://github.com/facebook/react-native/commit/68d6ada44893701b6006a6b1753131c7e880a30a) by [@riteshshukla04](https://github.com/riteshshukla04))
- **Switch:** Fixed switches correctly reverting to controlled state ([aa8c072870](https://github.com/facebook/react-native/commit/aa8c072870f6f9740e567a0f455c0e500ff1400c) by [@javache](https://github.com/javache))
- **Text:** Fix New Arch handling of inline views when text truncated ([99f962627f](https://github.com/facebook/react-native/commit/99f962627f1b88b8a48c2b64b1887652f784b624) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Fixed text not updating correctly after changing font scale in settings ([c008604e0a](https://github.com/facebook/react-native/commit/c008604e0a05460b440fcfaded70498594465916) by [@j-piasecki](https://github.com/j-piasecki))
- **TurboModules:** Throw ParsingException when ReactModule doesn't conform to TurboModule invariants ([c5132f485f](https://github.com/facebook/react-native/commit/c5132f485f6c5af51c6e8133eb5f029a389762dc) by [@GijsWeterings](https://github.com/GijsWeterings))
- **TypeScript:** Fix TS docs for `contentInsetAdjustmentBehavior` ([24ba7dfe6f](https://github.com/facebook/react-native/commit/24ba7dfe6feaacef76718491b8cb260d05afab9b) by [@steinalex](https://github.com/steinalex))
- **TypeScript:** Fix generated types in react-native/virtualized-lists being used without opt-in ([c9f2055097](https://github.com/facebook/react-native/commit/c9f20550972db2f94c5970948239312046a66a4e) by [@j-piasecki](https://github.com/j-piasecki))
- **TypeScript:** Fixed the generated type definitions for `Animated.FlatList` and `Animated.SectionList` to correctly infer item types. ([9be5ac1010](https://github.com/facebook/react-native/commit/9be5ac101051dd8121a48af1a29a60b7ba0b753e) by [@j-piasecki](https://github.com/j-piasecki))
- **TypeScript:** Reference `global.d.ts` using `path` so they can be resolved by TSC ([6399caef63](https://github.com/facebook/react-native/commit/6399caef635b6aadc4c98ec37c9f007f81fa1f79) by [@krystofwoldrich](https://github.com/krystofwoldrich))
- **VirtualizeSectionList:** Fix VirtualizeSectionList generic arguments ([44b0f5560b](https://github.com/facebook/react-native/commit/44b0f5560b285dfd8e28e6056e9434d76734f3fd)) by [@coado](https://github.com/coado)
- **VirtualizedList:** Skip cloning `Fragments` in `ListEmptyComponent` to avoid onLayout warning ([2b0189b964](https://github.com/facebook/react-native/commit/2b0189b9649b58dc93ac79ad2bf709fd7bc8f117) by [@mateoguzmana](https://github.com/mateoguzmana))

#### Android specific

- **Accessibility:** `Settings.Global.TRANSITION_ANIMATION_SCALE` accepts comma as decimal separator ([8b11970adb](https://github.com/facebook/react-native/commit/8b11970adb7d09bc9a4be78cfaee04cb7e084177) by [@vzaidman](https://github.com/vzaidman))
- **Animated:** Ensure latest offset value is synced to native ([3e3094c3dd](https://github.com/facebook/react-native/commit/3e3094c3dd57a83e167ffd163093c41f4cf6d8c5) by Martin Booth)
- **Animated:** Fix `BatchExecutionOpCodes.OP_CODE_SET_ANIMATED_NODE_OFFSET` mapping to call setAnimatedNodeOffset (rather than setAnimatedNodeValue) ([9efcdc091c](https://github.com/facebook/react-native/commit/9efcdc091c81c6ae6118ed78791096ca07fe0140) by Martin Booth)
- **Animated:** Fixes memory leak - Close a view leak due to lossy onAnimationEnd callback ([313d7d79d4](https://github.com/facebook/react-native/commit/313d7d79d4257efcce5f3a555e335a74ce56df53) by [@knappam](https://github.com/knappam))
- **Animated:** Sync offset and value from native -> js in separate fields ([2efe8094c0](https://github.com/facebook/react-native/commit/2efe8094c0d4251213b5305ddaba11aaf76bfd56) by Martin Booth)
- **Codegen:** Fix `RNCodegen.js` for generating ComponentDescriptors.cpp ([d8b0e050c4](https://github.com/facebook/react-native/commit/d8b0e050c47ee7078ccc26bbabb4cf37d3ac9a37) by [@arushikesarwani94](https://github.com/arushikesarwani94))
- **Events:** Fixed crash when event is emitted after instance is shutdown ([6dd5a838c3](https://github.com/facebook/react-native/commit/6dd5a838c340aabc1ad385ccfc5cc3b478d5fda3) by [@javache](https://github.com/javache))
- **Events:** Removed deprecated EventDispatcher#receiveTouches ([7056d20984](https://github.com/facebook/react-native/commit/7056d20984dab1d0c965684acc2d7a2b13c66fac) by [@javache](https://github.com/javache))
- **FlatList:** Fix crash with nested FlatLists and fix edge case with nested views ([9526406fc2](https://github.com/facebook/react-native/commit/9526406fc24ed0df10c63c54869814a26d69ece0) by [@jorge-cab](https://github.com/jorge-cab))
- **FlatList:** Fix keyboard navigation on lists with `removeClippedSubviews` enabled ([c068c599c6](https://github.com/facebook/react-native/commit/c068c599c641491e735caf79e4e60a0fb3c04f83) by [@jorge-cab](https://github.com/jorge-cab))
- **FlatList:** Fix keyboard navigation on lists with `removeClippedSubviews` enabled ([fc9f2fe0ea](https://github.com/facebook/react-native/commit/fc9f2fe0ea20d6e73be8fdf4eb47affaddea6427) by [@jorge-cab](https://github.com/jorge-cab))
- **infra:** Fix crash when passing null initialProps ([ee85957fd6](https://github.com/facebook/react-native/commit/ee85957fd68669d8887d0e03b96f91b807bc99ac) by [@javache](https://github.com/javache))
- **Kotlin:** Made `Arguments.java` nullsafe ([c8f01ffc3e](https://github.com/facebook/react-native/commit/c8f01ffc3ea2271e166ea6b8fecf53aa950b4c42) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `BaseJavaModule.java` nullsafe ([77ea9fd1f8](https://github.com/facebook/react-native/commit/77ea9fd1f844f6b6fe6eba2ed1ac61dd8317b3e4) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `BlobModule.java` nullsafe ([c80ac8fcf2](https://github.com/facebook/react-native/commit/c80ac8fcf224d3f815b5182d2fb7164865cd6913) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `BlobProvider.java` nullsafe ([020db409a2](https://github.com/facebook/react-native/commit/020db409a2c05a99748523db2f3df08051bcc3af) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `BundleDownloader.java` nullsafe ([61d4b04159](https://github.com/facebook/react-native/commit/61d4b041593bd94a318fc71f8691711ff9d15af5) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `CxxInspectorPackagerConnection.java` nullsafe ([fd23a08a3a](https://github.com/facebook/react-native/commit/fd23a08a3a34cbfb4ff8d7215acde323cb4c943a) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DebugOverlayController.java` nullsafe ([e9e4c2adaf](https://github.com/facebook/react-native/commit/e9e4c2adaf0cf9e20734bfc54685b228d45b5d66) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DevServerHelper.java` nullsafe ([311cef3c0d](https://github.com/facebook/react-native/commit/311cef3c0df8f112e4bfae4663ba9dd04e465d5e) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DevSupportManagerBase.java` nullsafe ([adbcaef1e1](https://github.com/facebook/react-native/commit/adbcaef1e1632eff29570cce878b65594096a694) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DialogModule.java` nullsafe ([4e7d09ceff](https://github.com/facebook/react-native/commit/4e7d09ceff35757ffe29368701806d91c7c75fd1) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DynamicFromArray.java` nullsafe ([3665046c14](https://github.com/facebook/react-native/commit/3665046c140ecebb12f4f136fe3ca5386f20bffb) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DynamicFromMap.java` nullsafe ([dcb2dbb2c3](https://github.com/facebook/react-native/commit/dcb2dbb2c383c27f3e5ba83adcd40f2e77e0009c) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `DynamicFromObject.java` nullsafe ([a0e3490ff5](https://github.com/facebook/react-native/commit/a0e3490ff5ca9f1db6fadff1e4e1bfa666fc3a50) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `FabricUIManager.java` nullsafe ([97ddd17e5e](https://github.com/facebook/react-native/commit/97ddd17e5eaf38ac4138d96520cbdeeb9da98555) by [@javache](https://github.com/javache))
- **Kotlin:** Made `FabricUIManager.java` nullsafe ([ea2fbd453f](https://github.com/facebook/react-native/commit/ea2fbd453f319279d91f6770c14d11165223b68d) by [@javache](https://github.com/javache))
- **Kotlin:** Made `FileReaderModule.java` nullsafe ([8f5aaf13b2](https://github.com/facebook/react-native/commit/8f5aaf13b2f67f84d8e189b175d9a830a5ab446c) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `Inspector.java` as nullsafe ([8d72e5eeb9](https://github.com/facebook/react-native/commit/8d72e5eeb91911551b8fd7764e2b0d37d1d920aa) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JavaScriptModuleRegistry.java` as nullsafe ([bf911e1f92](https://github.com/facebook/react-native/commit/bf911e1f92438d27e20a0fe2bb4bec1a0d3c2838) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JSBundleLoader.java` as nullsafe ([9d21f97ebe](https://github.com/facebook/react-native/commit/9d21f97ebeabe1f89e105280cb95fd5a5c6b2a56) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JSDebuggerWebsocketClient.java` nullsafe ([3289569747](https://github.com/facebook/react-native/commit/3289569747f59aa3bf997758ccd2cd4d3451c8fa) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JSONArguments.java` as nullsafe ([12b22dc57c](https://github.com/facebook/react-native/commit/12b22dc57cffe4669ea04ef751704aa56fe63d36) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JsonWriterHelper.java` nullsafe ([30da6ca84a](https://github.com/facebook/react-native/commit/30da6ca84a704d38c03a62da43597ce769a8bf3a) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `JSPointerDispatcher.java` nullsafe ([c025bf6c72](https://github.com/facebook/react-native/commit/c025bf6c72c4d17247e11acc121f04710411b303) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ModuleHolder.java` nullsafe ([d97aba5cd7](https://github.com/facebook/react-native/commit/d97aba5cd72a7b42a279a1ef4e8eb450d9f68cd5) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ModuleSpec.java` as nullsafe ([1e4d016950](https://github.com/facebook/react-native/commit/1e4d01695000fba0605c7e4be04d825a570820f3) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `MountingManager.java` nullsafe ([7aaf0cb3f1](https://github.com/facebook/react-native/commit/7aaf0cb3f1428bfd78b4a399b2ef235eee40f3c0) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `MountItemDispatcher.java` nullsafe ([e957bdb8fa](https://github.com/facebook/react-native/commit/e957bdb8fa8940ab405405098df1878037dd1314) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `MultipartStreamReader.java` nullsafe ([b40b1e679e](https://github.com/facebook/react-native/commit/b40b1e679e3a2622b5aeff940106888c41ffbdd9) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `NativeModule.java` as nullsafe ([005c11ea0a](https://github.com/facebook/react-native/commit/005c11ea0a1fafb62c3fbdea6c84a73789ea10b6) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `NativeModuleRegistry.java` nullsafe ([8aaccef2ee](https://github.com/facebook/react-native/commit/8aaccef2ee2d67756ce54f5819f0c3d8eab1fbf6) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `NetworkingModule.java` nullsafe ([9b30cdd008](https://github.com/facebook/react-native/commit/9b30cdd00881f52c6437d00048670041f5758b5d) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `PromiseImpl.java` nullsafe ([4c8ea858a5](https://github.com/facebook/react-native/commit/4c8ea858a53a68af688c5a5755f4104c674fee0e) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactApplicationContext.java` as nullsafe ([f86de9724b](https://github.com/facebook/react-native/commit/f86de9724b71b2e1fef6bd2d3447eccbbe7c1f1f) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactBAseTeextShadowNode.java` nullsafe ([dbb5a23cad](https://github.com/facebook/react-native/commit/dbb5a23cadd5cfa0c0ad4dafaa17ee4992662b05) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactContextBaseJavaModule.java` as nullsafe ([27179a7cf2](https://github.com/facebook/react-native/commit/27179a7cf27463a87111454ba17e117f5898aae7) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactHostImpl.java` nullsafe ([568ba647cf](https://github.com/facebook/react-native/commit/568ba647cfbeaa676a84366a981a1cad65297893) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactMarker.java` as nullsafe ([911c11f129](https://github.com/facebook/react-native/commit/911c11f1298c03cecf5777b052aa0139bf66adfc) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactTextAnchorViewManager.java` nullsafe ([e04b5b3ecf](https://github.com/facebook/react-native/commit/e04b5b3ecf2d692d9a0f95db298ecb2a67a61eef) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactTextShadowNode.java` nullsafe ([3857aa8baf](https://github.com/facebook/react-native/commit/3857aa8bafb0e440a7a6590641b6c71284fa44d4) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactTextView.java` nullsafe ([021491bf51](https://github.com/facebook/react-native/commit/021491bf51c7cc086aa5800e5548863bb14ad723) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReactTextViewManager.java` nullsafe ([1929ebd00e](https://github.com/facebook/react-native/commit/1929ebd00ee6a0429ea30c4ee940e57dd443f43b) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ReconnectingWebSocket.java` nullsafe ([ff6601bfb7](https://github.com/facebook/react-native/commit/ff6601bfb78600e3ded170d4ee214a43175d0fc5) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `StackTraceHelper.java` nullsafe ([14de1c1cba](https://github.com/facebook/react-native/commit/14de1c1cba7f49ff66c15eb80e422cbddf2c476d) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `Task.java` nullsafe ([eba9ebe0a9](https://github.com/facebook/react-native/commit/eba9ebe0a9145adb718b0ef522ad490b67593bac) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `TextAttributeProps.java` nullsafe ([623dcc3902](https://github.com/facebook/react-native/commit/623dcc39025bf4d3e82d590637831e380f412397) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ThemedReactContext.java` nullsafe ([552338ce9f](https://github.com/facebook/react-native/commit/552338ce9ffb32500fb30c227953d5e426fc3f7f) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `TouchTargetHelper.java` nullsafe ([02fc3bd58c](https://github.com/facebook/react-native/commit/02fc3bd58c3da3e09150180fd9f8b04192b45bfd) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `TurboModuleInteropUtils.java` nullsafe ([90184d20e1](https://github.com/facebook/react-native/commit/90184d20e1e5c128c532bd4a1f15bb3074bcd83a) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `TurboModuleManager.java` nullsafe ([419b68f38a](https://github.com/facebook/react-native/commit/419b68f38aa31d1d7d2de939a47516143adaafdf) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Kotlin:** Made `ViewManagerRegistry.java` nullsafe ([af516266db](https://github.com/facebook/react-native/commit/af516266dbfbf72fb9954864931951bac702f4c8) by [@GijsWeterings](https://github.com/GijsWeterings))
- **Layout:** Restored the possibility to extend `LayoutAnimationController` ([bca7c5a553](https://github.com/facebook/react-native/commit/bca7c5a55301398beaa6ca35c96ae7ad5426c297) by [@tomekzaw](https://github.com/tomekzaw))
- **Linking:** Ensure Linking.sendIntent promises resolve or reject ([6609ba98e5](https://github.com/facebook/react-native/commit/6609ba98e5f738cb8746c7ccfda1072cfa05f986) by [@Abbondanzo](https://github.com/Abbondanzo))
- **Networking:** Fix fetch of content scheme uris failing on Android. ([87c54a7eba](https://github.com/facebook/react-native/commit/87c54a7ebab5530de4cec359440d2c5945244e07) by [@giantslogik](https://github.com/giantslogik))
- **PointerEvents:** Prevent onPointerLeave from dispatching during button presses ([833ab6fe1b](https://github.com/facebook/react-native/commit/833ab6fe1b252244bf7d8a2f158fa13470c27e76) by [@Abbondanzo](https://github.com/Abbondanzo))
- **ScrollView:** Fix occasional syncronization issue in ScrollView when rendering dynamic content with content offset ([8f209acb3f](https://github.com/facebook/react-native/commit/8f209acb3f7338448b0b7a26224fc4b2cfb722db) by [@fabriziocucci](https://github.com/fabriziocucci))
- **StyleSheet:** Fix incorrect clip to padding box on new Background and Border drawables ([989b3f61a0](https://github.com/facebook/react-native/commit/989b3f61a070c68f30d36036925f54cb081da49e) by [@jorge-cab](https://github.com/jorge-cab))
- **StyleSheet:** Fix inset shadow edge cases ([0929697a6d](https://github.com/facebook/react-native/commit/0929697a6df9ab5a3654c0077bb95427eae77b4c) by [@joevilches](https://github.com/joevilches))
- **StyleSheet:** Fix translucent borders on Android overlapping bug ([57779cebf0](https://github.com/facebook/react-native/commit/57779cebf066ee420fa861df8269e875ab1d21f4) by [@jorge-cab](https://github.com/jorge-cab))
- **Text:** Assume full container width when ellipsizing line ([e565c662d7](https://github.com/facebook/react-native/commit/e565c662d7550b143930bf2e646a749bcaea026a) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Correctly Pass `SurfaceID` to `TextLayoutManager` ([6f0a0a5c2c](https://github.com/facebook/react-native/commit/6f0a0a5c2c7d678646be5af9a3c4ccf1ba9c9804) by [@NickGerleman](https://github.com/NickGerleman))
- **Text:** Double selection with dataDetectorType and links ([70aced5eb1](https://github.com/facebook/react-native/commit/70aced5eb17c48e6b7201377e6068cf6558c7460) by [@joevilches](https://github.com/joevilches))
- **Text:** Fix `selectable` prop not working correctly on initial render (old-arch) ([5ed486cc8f](https://github.com/facebook/react-native/commit/5ed486cc8fb4aeef12c92a04619cc668427eee75) by [@mateoguzmana](https://github.com/mateoguzmana))
- **Text:** Fix keyboard navigation on lists with `removeClippedSubviews` enabled ([bbff754db3](https://github.com/facebook/react-native/commit/bbff754db370a2d69926048e384ccaa6ff97c230) by [@jorge-cab](https://github.com/jorge-cab))
- **TextInput:** Can now focus `TextInput` with keyboard ([e00028f6bb](https://github.com/facebook/react-native/commit/e00028f6bb6c19de861f9a25f377295755f3671b) by [@joevilches](https://github.com/joevilches))
- **TextInput:** Fix broken focus behavior for TextInput in older Android versions (< 9) ([fb62355555](https://github.com/facebook/react-native/commit/fb623555552075793086acdd1ddd0c1e3fba72c4)) by [@joevilches](https://github.com/joevilches)
- **TextInput:** Fix Non-uniform border colors on TextInput ([42251ec0ed](https://github.com/facebook/react-native/commit/42251ec0eddaf42d0a89caeb75a92ef34c517a95) by [@NickGerleman](https://github.com/NickGerleman))
- **TurboModules:** Fix crash when TurboModule event emitters are used on arm32 ([6e701ce080](https://github.com/facebook/react-native/commit/6e701ce080122f5b60633e3475651a0d2d9fe54a) by [@javache](https://github.com/javache))

#### iOS specific

- **Accessibility:** RCTDeviceInfo: fix crash due to failure to get AccessibilityManager ([ac23323da1](https://github.com/facebook/react-native/commit/ac23323da1bda2ce271797aa58dd74ffb0a5992f) by Adam Ernst)
- **Animated:** Fix Recycling of Animated Images ([1a9adfba16](https://github.com/facebook/react-native/commit/1a9adfba162151a3e8c2e7a5248e6b17e2eef195) by [@NickGerleman](https://github.com/NickGerleman))
- **API:** Remove deprecated ATOMIC_VAR_INIT macro in RCTProfile.m ([21bf7cf6cf](https://github.com/facebook/react-native/commit/21bf7cf6cf043de323c40edc001add4cd21256ce) by [@rmaz](https://github.com/rmaz))
- **C++:** Avoid build failure on Catalyst (`x86_64`) ([0f534293af](https://github.com/facebook/react-native/commit/0f534293afe9981e463dae97f7ccb4c7abf0589c) by [@cipolleschi](https://github.com/cipolleschi))
- **CocoaPods:** Corrected the path from `"$(PODS_ROOT)/fas_float/include"` to `"$(PODS_ROOT)/fast_float/include"` in the `HEADER_SEARCH_PATHS` configuration. ([01881017d3](https://github.com/facebook/react-native/commit/01881017d3d446355945779547215408309e6a36) by [@DorianMazur](https://github.com/DorianMazur))
- **CocoaPods:** Put back the `folly_compiler_flag` function to make libraries install pods ([3b17cdb643](https://github.com/facebook/react-native/commit/3b17cdb6435dcb975685672be0d29d2f73bf368f) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Fix codegen crawling all library code with `componentProvider` defined in config ([65aa819811](https://github.com/facebook/react-native/commit/65aa8198116e1d23175358f75c9b23774d3522b4) by [@kkafar](https://github.com/kkafar))
- **Codegen:** Fix codegen extracting `.class` from complex component classes ([f2b19608cc](https://github.com/facebook/react-native/commit/f2b19608cca36c118786b4e3d22bf2468fced86d) by [@gabrieldonadel](https://github.com/gabrieldonadel))
- **Codegen:** Generate `ReactCodegen.podspec` only for apps. ([18a7c8d57c](https://github.com/facebook/react-native/commit/18a7c8d57c5843267756fd9d2137964370dc5780) by [@cipolleschi](https://github.com/cipolleschi))
- **Codegen:** Skip codegen for selectively disabled libraries in react-native.config.js ([7681036537](https://github.com/facebook/react-native/commit/7681036537d8759673881843a9a8f6f5a1ae93e0) by [@aattola](https://github.com/aattola))
- **Codegen:** Skip codegen for selectively disabled libraries in react-native.config.js ([be8595b18a](https://github.com/facebook/react-native/commit/be8595b18a46635bf679d8e7473f2960c33530fa) by [@ismarbesic](https://github.com/ismarbesic))
- **Image:** Fix animated images missing from offscreen render ([d1a090b0af](https://github.com/facebook/react-native/commit/d1a090b0afe94ed5d5f55cf0b6f0ecc044ac332e) by [@NickGerleman](https://github.com/NickGerleman))
- **Image:** Fixed accessible prop no-opts on Image components ([e3f7c8f456](https://github.com/facebook/react-native/commit/e3f7c8f45617d682c5934d4eeee8a7ada4689ce5) by [@jorge-cab](https://github.com/jorge-cab))
- **infra:** Avoid race condition crash in `RCTDataRequestHandler` invalidate ([44810f7498](https://github.com/facebook/react-native/commit/44810f749841b8340cc06fecbf861c6390751c29) by [@zhongwuzw](https://github.com/zhongwuzw))
- **infra:** Check .pnpm folder when looking for third-party components. ([91d034533e](https://github.com/facebook/react-native/commit/91d034533e9f52232b351bb88b2ae7b48704e68f) by [@kirill3333](https://github.com/kirill3333))
- **infra:** Fix bug: unstable_hasComponent(*) = true for unregistered components for n > 1th call. ([f4d99d6a23](https://github.com/facebook/react-native/commit/f4d99d6a23a08c2ef2c2fff78dc966961608683b) by [@RSNara](https://github.com/RSNara))
- **infra:** Fix bug: unstable_hasComponent(*) = true for unregistered components for n > 1th call. ([fa9d082747](https://github.com/facebook/react-native/commit/fa9d082747cf286a112b869e763afff6df6ec9d4) by [@RSNara](https://github.com/RSNara))
- **infra:** Ignore `build/` and `DerivedData/` directories when reading `.plist` files. ([c783128f6e](https://github.com/facebook/react-native/commit/c783128f6e8541bb0b13c4f5c634e790ca854c23) by [@tjzel](https://github.com/tjzel))
- **infra:** Properly check for debug schemes when building hermes from source ([bef5cc1007](https://github.com/facebook/react-native/commit/bef5cc100771c3b8bc5dffa565b7c24fef3eb34d) by [@WoLewicki](https://github.com/WoLewicki))
- **InteropLayer:** Fixed adding child views to a native view using the interop layer ([d53a60dd23](https://github.com/facebook/react-native/commit/d53a60dd23c5df8afca058a867c50df8b61f62e2) by [@chrfalch](https://github.com/chrfalch))
- **LogBox:** Fix disappearing redbox on initial load of an invalid bundle. ([4cc9db1cd5](https://github.com/facebook/react-native/commit/4cc9db1cd501b019e90bb540ce836e2a2c2bf2ff) by [@aleqsio](https://github.com/aleqsio))
- **ScrollView:** Fixed touch events not being dispatched to ScrollView's children when they overflow the content container ([6ecd9a43f1](https://github.com/facebook/react-native/commit/6ecd9a43f16e76771e2f970972bcd067aa570cf7) by [@j-piasecki](https://github.com/j-piasecki))
- **StyleSheet:** Box shadows on iOS are faster ([52173ab701](https://github.com/facebook/react-native/commit/52173ab701094dcc84399cdf8a8769f5242de27d) by [@joevilches](https://github.com/joevilches))
- **Swift:** Make fmt and SocketRocket Swift friendly ([3f41fe2948](https://github.com/facebook/react-native/commit/3f41fe29488bbcf4fba620b18cace90de737c197) by [@cipolleschi](https://github.com/cipolleschi))
- **Switch:** Fix "on" and "off" announcements on `Switch` ([db6e000023](https://github.com/facebook/react-native/commit/db6e0000234530979594abf81c6bd0521b561068) by [@joevilches](https://github.com/joevilches))
- **Text:** `ParagraphState` is correctly deallocated when recycling Text ([a5a71f115f](https://github.com/facebook/react-native/commit/a5a71f115ff9fb8156968451f11874a3c3096a4f) by [@javache](https://github.com/javache))
- **Text:** Allow links that encorporate entire <Text> to be keyboard accessible ([83fae860df](https://github.com/facebook/react-native/commit/83fae860df8d1ac2d89b3cddf8c595b2cc88a74f) by [@joevilches](https://github.com/joevilches))
- **Text:** Correctly announce "link" on nested text if its the entire text element ([bffb414291](https://github.com/facebook/react-native/commit/bffb414291cfbd3d6e3e51448dd68b7bddddf658) by [@joevilches](https://github.com/joevilches))
- **Text:** Selection range not respected when changing text or selection when selection is forced ([d32ea66e6a](https://github.com/facebook/react-native/commit/d32ea66e6a945dd84092532401b265b12d482668) by Olivier Bouillet)
- **TextInput:** Fix TextInput `onContentSizeChange` event being dispatched only once on iOS on the new architecture ([5fd5188172](https://github.com/facebook/react-native/commit/5fd51881727b2d86f87abf04db032940ac0ec8c4) by [@j-piasecki](https://github.com/j-piasecki))

## v0.79.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0797)

## v0.79.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0796)

## v0.79.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0795)

## v0.79.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0794)

## v0.79.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0793)

## v0.79.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0792)

## v0.79.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0791)

## v0.79.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0790)

## v0.78.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0783)

## v0.78.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0782)

## v0.78.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0781)

## v0.78.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0780)

## v0.77.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0773)

## v0.77.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0772)

## v0.77.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0771)

## v0.77.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0770)

## v0.76.9

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0769)

## v0.76.8

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0768)

## v0.76.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0767)

## v0.76.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0766)

## v0.76.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0765)

## v0.76.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0764)

## v0.76.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0763)

## v0.76.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0762)

## v0.76.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0761)

## v0.76.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0760)

## v0.75.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0755)

## v0.75.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0754)

## v0.75.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0753)

## v0.75.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0752)

## v0.75.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0751)

## v0.75.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0750)

## v0.74.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0747)

## v0.74.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0746)

## v0.74.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0745)

## v0.74.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0744)

## v0.74.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0743)

## v0.74.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0742)

## v0.74.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0741)

## v0.74.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0740)

## v0.73.11

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07311)

## v0.73.10

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07310)

## v0.73.9

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0739)

## v0.73.8

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0738)

## v0.73.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0737)

## v0.73.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0736)

## v0.73.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0735)

## v0.73.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0734)

## v0.73.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0733)

## v0.73.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0732)

## v0.73.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0731)

## v0.73.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0730)

## v0.72.17

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07217)

## v0.72.16

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07216)

## v0.72.15

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07215)

## v0.72.14

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07214)

## v0.72.13

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07213)

## v0.72.12

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07212)

## v0.72.11

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07211)

## v0.72.10

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07210)

## v0.72.9

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0729)

## v0.72.8

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0728)

## v0.72.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0727)

## v0.72.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0726)

## v0.72.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0725)

## v0.72.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0724)

## v0.72.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0723)

## v0.72.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0722)

## v0.72.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0721)

## v0.72.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0720)

## v0.71.19

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07119)

## v0.71.18

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07118)

## v0.71.17

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07117)

## v0.71.16

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07116)

## v0.71.15

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07115)

## v0.71.14

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07114)

## v0.71.13

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07113)

## v0.71.12

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07112)

## v0.71.11

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07111)

## v0.71.10

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07110)

## v0.71.9

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0719)

## v0.71.8

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0718)

## v0.71.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0717)

## v0.71.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0716)

## v0.71.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0715)

## v0.71.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0714)

## v0.71.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0713)

## v0.71.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0712)

## v0.71.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0711)

## v0.71.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0710)

## v0.70.15

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07015)

## v0.70.14

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07014)

## v0.70.13

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07013)

## v0.70.12

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07012)

## v0.70.11

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07011)

## v0.70.10

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v07010)

## v0.70.9

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0709)

## v0.70.8

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0708)

## v0.70.7

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0707)

## v0.70.6

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0706)

## v0.70.5

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0705)

## v0.70.4

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0704)

## v0.70.3

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0703)

## v0.70.2

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0702)

## v0.70.1

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0701)

## v0.70.0

See [CHANGELOG-0.7x](./CHANGELOG-0.7x.md#v0700)

## v0.69.12

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v06912)

## v0.69.11

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v06911)

## v0.69.10

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v06910)

## v0.69.9

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0699)

## v0.69.8

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0698)

## v0.69.7

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0697)

## v0.69.6

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0696)

## v0.69.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0695)

## v0.69.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0694)

## v0.69.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0693)

## v0.69.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0692)

## v0.69.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0691)

## v0.69.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0690)

## v0.68.7

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0687)

## v0.68.6

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0686)

## v0.68.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0685)

## v0.68.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0684)

## v0.68.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0683)

## v0.68.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0682)

## v0.68.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0681)

## v0.68.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0680)

## v0.67.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0675)

## v0.67.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0674)

## v0.67.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0673)

## v0.67.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0672)

## v0.67.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0671)

## v0.67.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0670)

## v0.66.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0665)

## v0.66.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0664)

## v0.66.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0663)

## v0.66.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0662)

## v0.66.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0661)

## v0.66.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0660)

## v0.65.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0653)

## v0.65.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0652)

## v0.65.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0651)

## v0.65.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0650)

## v0.64.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0644)

## v0.64.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0643)

## v0.64.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0642)

## v0.64.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0641)

## v0.64.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0640)

## v0.63.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0635)

## v0.63.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0634)

## v0.63.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0633)

## v0.63.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0632)

## v0.63.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0631)

## v0.63.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0630)

## v0.62.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0623)

## v0.62.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0622)

## v0.62.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0621)

## v0.62.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0620)

## v0.61.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0615)

## v0.61.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0614)

## v0.61.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0613)

## v0.61.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0612)

## v0.61.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0611)

## v0.61.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0610)

## v0.60.6

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0606)

## v0.60.5

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0605)

## v0.60.4

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0604)

## v0.60.3

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0603)

## v0.60.2

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0602)

## v0.60.1

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0601)

## v0.60.0

See [CHANGELOG-0.6x](./CHANGELOG-0.6x.md#v0600)

## v0.59.10

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v05910)

## v0.59.9

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0599)

## v0.59.8

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0598)

## v0.59.5

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0595)

## v0.59.4

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0594)

## v0.59.3

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0593)

## v0.59.2

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0592)

## v0.59.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0591)

## v0.59.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0590)

## v0.58.6

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0586)

## v0.58.5

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0585)

## v0.58.4

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0584)

## v0.58.3

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0583)

## v0.58.2

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0582)

## v0.58.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0581)

## v0.58.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0580)

## v0.57.8

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0578)

## v0.57.7

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0577)

## v0.57.6

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0576)

## v0.57.5

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0575)

## v0.57.4

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0574)

## v0.57.3

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0573)

## v0.57.2

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0572)

## v0.57.1

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0571)

## v0.57.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0570)


## v0.56.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0560)


## v0.55.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0550)


## v0.54.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0540)


## v0.53.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0530)


## v0.52.0

See [CHANGELOG-0.5x](./CHANGELOG-0.5x.md#v0520)
