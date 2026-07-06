// swift-tools-version: 6.0
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Foundation
import PackageDescription

let BUILD_FROM_SOURCE = false

/**
 This is the `Package.swift` file that allows to build React Native core using Swift PM.
 To build React Native, you need to follow these steps:
 1. inside the `react-native` root folder, run `yarn install`
 2. `cd packages/react-native`
 3. `RN_DEP_VERSION=nightly HERMES_VERSION=nightly node scripts/ios-prebuild`
 4. `open Package.swift`
 5. Build in Xcode.

 The Package.swift is structured as it follow:
 - Constants declaration
 - Prebuilt dependencies: we define the prebuilt React Native depends upon - Hermes and ReactNativeDependencies
 - Target definition: we define all the sub targets that compose React Native
     - For each target, we added the equivalent podspec they represents. This should help you porting changes from podspec to SwiftPM
 - The list of all the target: so we can iterate over them.
 - The package definition: this is the actual definition of React
 - A set of utility classes that help us to abstract common details.
 */

// MARK: Constants declaration
let react = "React"
let RuntimeExecutorPath = "ReactCommon/runtimeexecutor" // header only target
let CallInvokerPath = "ReactCommon/callinvoker" // header only target
let ReactFBReactNativeSpecPath = "React/FBReactNativeSpec" // generated
let FBLazyVectorPath = "Libraries/FBLazyVector" // header only
let virtualViewPath = "ReactCommon/react/renderer/components/virtualview" // header only

// MARK: Prebuilt Dependencies declaration
let reactNativeDependencies = BinaryTarget(
  name: .reactNativeDependencies,
  path: "third-party/ReactNativeDependencies.xcframework",
  searchPaths: ["third-party/ReactNativeDependencies.xcframework/Headers"]
)

let hermesPrebuilt = BinaryTarget(
  name: .hermesPrebuilt,
  path: ".build/artifacts/hermes/destroot/Library/Frameworks/universal/hermesvm.xcframework",
  searchPaths: [".build/artifacts/hermes/destroot/include"]
)

// MARK: React Native targets declaration
/// RCTDeprecation.podspec
let rctDeprecation = RNTarget(
  name: .rctDeprecation,
  path: "ReactApple/Libraries/RCTFoundation/RCTDeprecation"
)

// To avoid having to delete the cmake folder at the same level we provide a "wrong" public header path and instead include it using header search paths.
/// Yoga.podspec
let yoga = RNTarget(
  name: .yoga,
  path: "ReactCommon/yoga",
  publicHeadersPath: "yoga"
)

// React-oscompat.podspec
let reactOSCompat = RNTarget(
  name: .reactOSCompat,
  path: "ReactCommon/oscompat"
)

let rctSwiftUI = RNTarget(
  name: .rctSwiftUI,
  path: "ReactApple/RCTSwiftUI"
)

let rctSwiftUIWrapper = RNTarget(
  name: .rctSwiftUIWrapper,
  path: "ReactApple/RCTSwiftUIWrapper",
  dependencies: [.rctSwiftUI]
)

// React-rendererconsistency.podspec
let reactRendererConsistency = RNTarget(
  name: .reactRendererConsistency,
  path: "ReactCommon/react/renderer/consistency"
)

// React-debug.podspec
let reactDebug = RNTarget(
  name: .reactDebug,
  path: "ReactCommon/react/debug",
  excludedPaths: ["tests", "redbox/tests"],
  dependencies: [.reactNativeDependencies]
)
/// React-jsi.podspec
let jsi = RNTarget(
  name: .jsi,
  path: "ReactCommon/jsi",
  // JSI is a part of hermes-engine. Including them also in react-native will violate the One Definition Rule.
  // Precompiled binaries are only supported with hermes - so we can safely exclude the jsi.cpp file.
  // https://github.com/facebook/react-native/issues/53257
  excludedPaths: ["jsi/test", "jsi/jsi.cpp", "CMakeLists.txt", "jsi/CMakeLists.txt"],
  dependencies: [.reactNativeDependencies]
)

/// React-utils.podspec
let reactUtils = RNTarget(
  name: .reactUtils,
  path: "ReactCommon/react/utils",
  searchPaths: ["ReactCommon/react/utils/platform/ios"],
  linkedFrameworks: ["CoreFoundation"],
  excludedPaths: ["tests", "platform/android", "platform/cxx", "platform/windows"],
  dependencies: [.reactDebug, .jsi, .reactNativeDependencies]
)

/// React-featureflags.podspec
let reactFeatureFlags = RNTarget(
  name: .reactFeatureFlags,
  path: "ReactCommon/react/featureflags",
  excludedPaths: ["tests"]
)

/// React-perflogger.podspec
let reactPerfLogger = RNTarget(
  name: .reactPerfLogger,
  path: "ReactCommon/reactperflogger",
  excludedPaths: ["fusebox"]
)

/// React-logger.podspec
let logger = RNTarget(
  name: .logger,
  path: "ReactCommon/logger",
  dependencies: [.jsi, .reactNativeDependencies]
)

/// React-Mapbuffer.podspec
let mapbuffer = RNTarget(
  name: .mapbuffer,
  path: "ReactCommon/react/renderer/mapbuffer",
  excludedPaths: ["tests"],
  dependencies: [.reactDebug, .reactNativeDependencies]
)

/// React-rendererdebug.podspec
let reactRendererDebug = RNTarget(
  name: .reactRendererDebug,
  path: "ReactCommon/react/renderer/debug",
  excludedPaths: ["tests"],
  dependencies: [.reactDebug, .reactNativeDependencies]
)

let reactRuntimeExecutor = RNTarget(
  name: .reactRuntimeExecutor,
  path: "ReactCommon/runtimeexecutor/platform/ios",
  searchPaths: [RuntimeExecutorPath],
  dependencies: [.jsi]
)

/// React-jsinspectortracing.podspec
let reactJsInspectorTracing = RNTarget(
  name: .reactJsInspectorTracing,
  path: "ReactCommon/jsinspector-modern/tracing",
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .reactFeatureFlags, .reactJsInspectorNetwork, .jsi, .reactOSCompat]
)

/// React-jsinspectornetwork.podspec
let reactJsInspectorNetwork = RNTarget(
  name: .reactJsInspectorNetwork,
  path: "ReactCommon/jsinspector-modern/network",
  dependencies: [.reactNativeDependencies],
  defines: [
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED", to: "1", .when(configuration: BuildConfiguration.debug)),
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY", to: "1", .when(configuration: BuildConfiguration.debug)),
  ]
)

/// React-jsinspector.podspec
let reactJsInspector = RNTarget(
  name: .reactJsInspector,
  path: "ReactCommon/jsinspector-modern",
  excludedPaths: ["tracing", "network", "tests"],
  dependencies: [.reactNativeDependencies, .reactFeatureFlags, .jsi, .reactJsInspectorTracing, .reactJsInspectorNetwork, .reactRuntimeExecutor, .reactPerfLogger],
  defines: [
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED", to: "1", .when(configuration: BuildConfiguration.debug)),
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY", to: "1", .when(configuration: BuildConfiguration.debug)),
  ]
)

/// React-cxxreact.podspec
let reactCxxReact = RNTarget(
  name: .reactCxxReact,
  path: "ReactCommon/cxxreact",
  searchPaths: [CallInvokerPath],
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .jsi, .reactPerfLogger, .logger, .reactDebug, .reactJsErrorHandler, .reactJsInspector]
)

/// React-jsitooling.podspec
let reactJsiTooling = RNTarget(
  name: .reactJsiTooling,
  path: "ReactCommon/jsitooling",
  dependencies: [.reactNativeDependencies, .jsi, .reactJsInspector, .reactJsInspectorTracing, .reactCxxReact]
)

/// React-jsiexecutor.podspec
let reactJsiExecutor = RNTarget(
  name: .reactJsiExecutor,
  path: "ReactCommon/jsiexecutor",
  dependencies: [.reactNativeDependencies, .jsi, .reactCxxReact, .reactJsErrorHandler, .reactJsiTooling]
)

/// React-hermes.podspec
let reactHermes = RNTarget(
  name: .reactHermes,
  path: "ReactCommon/hermes",
  excludedPaths: ["inspector-modern/chrome/tests"],
  dependencies: [.reactNativeDependencies, .reactCxxReact, .reactJsiExecutor, .reactJsInspector, .reactJsInspectorTracing, .reactPerfLogger, .hermesPrebuilt, .jsi],
  defines: [
    CXXSetting.define("HERMES_ENABLE_DEBUGGER", to: "1", .when(configuration: BuildConfiguration.debug))
  ]
)

/// React-networking.podspec
let reactNetworking = RNTarget(
  name: .reactNetworking,
  path: "ReactCommon/react/networking",
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .reactJsInspectorNetwork, .reactPerformanceTimeline],
  defines: [
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED", to: "1", .when(configuration: BuildConfiguration.debug)),
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY", to: "1", .when(configuration: BuildConfiguration.debug)),
  ]
)

/// React-performancecdpmetrics.podspec
let reactPerformanceCdpMetrics = RNTarget(
  name: .reactPerformanceCdpMetrics,
  path: "ReactCommon/react/performance/cdpmetrics",
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .reactCxxReact, .jsi, .reactPerformanceTimeline, .reactRuntimeExecutor]
)

/// React-performancetimeline.podspec
let reactPerformanceTimeline = RNTarget(
  name: .reactPerformanceTimeline,
  path: "ReactCommon/react/performance/timeline",
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .reactFeatureFlags, .reactJsInspectorTracing, .reactCxxReact, .reactPerfLogger]
)

/// React-runtimescheduler.podspec
let reactRuntimeScheduler = RNTarget(
  name: .reactRuntimeScheduler,
  path: "ReactCommon/react/renderer/runtimescheduler",
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .reactFeatureFlags, .reactCxxReact, .reactJsErrorHandler, .reactPerfLogger, .reactPerformanceTimeline, .reactRendererConsistency, .reactUtils, .reactRuntimeExecutor]
)

/// React-bridging.podspec
let reactTurboModuleBridging = RNTarget(
  name: .reactTurboModuleBridging,
  path: "ReactCommon/react/bridging",
  searchPaths: [CallInvokerPath],
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .jsi]
)

/// React-jserrorhandler.podspec
let reactJsErrorHandler = RNTarget(
  name: .reactJsErrorHandler,
  path: "ReactCommon/jserrorhandler",
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .jsi, .reactFeatureFlags, .reactDebug, .reactTurboModuleBridging]
)

/// React-graphicsApple
/// This represents the React-graphicsApple BUCK module
let reactGraphicsApple = RNTarget(
  name: .reactGraphicsApple,
  path: "ReactCommon/react/renderer/graphics/platform/ios",
  linkedFrameworks: ["UIKit", "CoreGraphics"],
  dependencies: [.reactDebug, .jsi, .reactUtils, .reactNativeDependencies]
)

/// React-graphics.podspec
let reactGraphics = RNTarget(
  name: .reactGraphics,
  path: "ReactCommon/react/renderer/graphics",
  excludedPaths: ["platform", "tests"],
  dependencies: [.reactNativeDependencies, .jsi, .reactJsiExecutor, .reactRendererDebug, .reactUtils, .reactGraphicsApple]
)

/// ReactCommon.podspec
/// This target represent the ReactCommon/turbomodule/core subspec
let reactTurboModuleCore = RNTarget(
  name: .reactTurboModuleCore,
  path: "ReactCommon/react/nativemodule/core",
  searchPaths: [
    ReactFBReactNativeSpecPath,
    FBLazyVectorPath,
    "ReactCommon/react/nativemodule/core/platform/ios",
  ],
  excludedPaths: ["platform/android", "iostests"],
  dependencies: [.reactNativeDependencies, .reactDebug, .reactJsErrorHandler, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleBridging, .yoga, .reactRuntimeExecutor]
)

/// React-defaultsnativemodule.podspec
let reactTurboModuleCoreDefaults = RNTarget(
  name: .reactTurboModuleCoreDefaults,
  path: "ReactCommon/react/nativemodule/defaults",
  dependencies: [.reactNativeDependencies, .jsi, .reactJsiExecutor, .reactTurboModuleCore, .reactFabric]
)

/// React-microtasknativemodule.podspec
let reactTurboModuleCoreMicrotasks = RNTarget(
  name: .reactTurboModuleCoreMicrotasks,
  path: "ReactCommon/react/nativemodule/microtasks",
  dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleCore]
)

/// React-idlecallback.podspec
let reactIdleCallbacksNativeModule = RNTarget(
  name: .reactIdleCallbacksNativeModule,
  path: "ReactCommon/react/nativemodule/idlecallbacks",
  dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleCore]
)

/// React-webperformance.podspec
let reactWebPerformanceNativeModule = RNTarget(
  name: .reactWebPerformanceNativeModule,
  path: "ReactCommon/react/nativemodule/webperformance",
  dependencies: [.reactNativeDependencies, .reactCxxReact, .reactTurboModuleCore, .reactPerformanceTimeline]
)

/// React-intersectionobservernativemodule.podspec
let reactIntersectionObserverNativeModule = RNTarget(
  name: .reactIntersectionObserverNativeModule,
  path: "ReactCommon/react/nativemodule/intersectionobserver",
  dependencies: [.reactNativeDependencies, .reactCxxReact, .reactFabric, .reactTurboModuleBridging, .reactTurboModuleCore, .reactGraphics, .reactGraphicsApple, .reactRuntimeScheduler, .yoga]
)

/// React-mutationobservernativemodule.podspec
let reactMutationObserverNativeModule = RNTarget(
  name: .reactMutationObserverNativeModule,
  path: "ReactCommon/react/nativemodule/mutationobserver",
  dependencies: [.reactNativeDependencies, .reactCxxReact, .reactFabric, .reactTurboModuleBridging, .reactTurboModuleCore, .yoga]
)

/// React-viewtransitionnativemodule.podspec
let reactViewTransitionNativeModule = RNTarget(
  name: .reactViewTransitionNativeModule,
  path: "ReactCommon/react/nativemodule/viewtransition",
  dependencies: [.reactNativeDependencies, .reactCxxReact, .reactFabric, .reactTurboModuleBridging, .reactTurboModuleCore, .yoga]
)

/// React-featureflagnativemodule.podspec
let reactFeatureflagsNativemodule = RNTarget(
  name: .reactFeatureflagsNativemodule,
  path: "ReactCommon/react/nativemodule/featureflags",
  dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleCore]
)

/// React-domnativemodule.podspec
let reactNativeModuleDom = RNTarget(
  name: .reactNativeModuleDom,
  path: "ReactCommon/react/nativemodule/dom",
  dependencies: [.reactNativeDependencies, .reactDebug, .reactFeatureFlags, .reactUtils, .reactPerfLogger, .reactCxxReact, .reactTurboModuleCore, .yoga, .reactGraphicsApple, .reactFabric]
)

/// RCTTypeSafety.podspec
let rctTypesafety = RNTarget(
  name: .rctTypesafety,
  path: "Libraries/Typesafety",
  searchPaths: [FBLazyVectorPath],
  dependencies: [.reactNativeDependencies, .yoga]
)

/// New target to map Libraries/WebSocket
let reactCoreRCTWebsocket = RNTarget(
  name: .reactCoreRCTWebsocket,
  path: "Libraries/WebSocket",
  dependencies: [.yoga, .reactNativeDependencies]
)

/// React-CoreModules.podspec
let reactCoreModules = RNTarget(
  name: .reactCoreModules,
  path: "React/CoreModules",
  excludedPaths: ["PlatformStubs/RCTStatusBarManager.mm"],
  dependencies: [.reactNativeDependencies, .jsi, .yoga, .reactTurboModuleCore, .reactFeatureFlags]
)

/// React-runtimeCore.podspec
/// React-runtimeHermes.podspec
let reactRuntime = RNTarget(
  name: .reactRuntime,
  path: "ReactCommon/react/runtime",
  excludedPaths: ["tests", "iostests", "platform"],
  dependencies: [.reactNativeDependencies, .jsi, .reactJsiExecutor, .reactCxxReact, .reactJsErrorHandler, .reactPerformanceTimeline, .reactUtils, .reactFeatureFlags, .reactJsInspector, .reactJsiTooling, .reactHermes, .reactRuntimeScheduler, .hermesPrebuilt],
  defines: [
    CXXSetting.define("HERMES_ENABLE_DEBUGGER", to: "1", .when(configuration: BuildConfiguration.debug))
  ]
)

/// React-runtimeApple.podspec
let reactRuntimeApple = RNTarget(
  name: .reactRuntimeApple,
  path: "ReactCommon/react/runtime/platform/ios",
  excludedPaths: ["ReactCommon/RCTJscInstance.mm", "ReactCommon/metainternal"],
  dependencies: [.reactNativeDependencies, .jsi, .reactPerfLogger, .reactCxxReact, .rctDeprecation, .yoga, .reactRuntime, .reactRCTFabric, .reactCoreModules, .reactTurboModuleCore, .hermesPrebuilt, .reactUtils],
  defines: [
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED", to: "1", .when(configuration: BuildConfiguration.debug))
  ]
)

let publicHeadersPathForReactCore: String = BUILD_FROM_SOURCE ? "includes" : "."

/// React-Core.podspec
let reactCore = RNTarget(
  name: .reactCore,
  path: "React",
  searchPaths: [
    "React/I18n",
    "React/Profiler",
    "ReactCommon/react/runtime/platform/ios", // explicit header search path to break circular dependency. RCTHost imports `RCTDefines.h` in ReactCore, ReacCore needs to import RCTHost
  ],
  linkedFrameworks: ["CoreServices"],
  excludedPaths: ["Fabric", "Tests", "Resources", "Runtime/RCTJscInstanceFactory.mm", "I18n/strings", "CxxBridge/JSCExecutorFactory.mm", "CoreModules"],
  dependencies: [.reactNativeDependencies, .reactCxxReact, .reactPerfLogger, .jsi, .reactJsiExecutor, .reactUtils, .reactFeatureFlags, .reactRuntimeScheduler, .yoga, .reactJsInspector, .reactJsiTooling, .rctDeprecation, .reactCoreRCTWebsocket, .reactRCTImage, .reactTurboModuleCore, .reactRCTText, .reactRCTBlob, .reactRCTAnimation, .reactRCTNetwork, .reactFabric, .hermesPrebuilt],
  sources: [".", "Runtime/RCTHermesInstanceFactory.mm"],
  publicHeadersPath: publicHeadersPathForReactCore
)

/// React-Fabric.podspec
let reactFabric = RNTarget(
  name: .reactFabric,
  path: "ReactCommon/react/renderer",
  excludedPaths: [
    "animated/tests",
    "animations/tests",
    "attributedstring/tests",
    "core/tests",
    "components/view/tests",
    "components/view/platform/android",
    "components/view/platform/windows",
    "components/view/platform/macos",
    "components/scrollview/tests",
    "components/scrollview/platform/android",
    "mounting/tests",
    "uimanager/tests",
    "telemetry/tests",
    "css",
    "debug",
    "graphics",
    "imagemanager",
    "mapbuffer",
    "consistency",
    "uimanager/consistency/tests",
    "components/inputaccessory",
    "components/modal",
    "components/rncore",
    "components/safeareaview",
    "components/switch",
    "components/text",
    "components/textinput",
    "components/textinput/platform/ios/",
    "components/unimplementedview",
    "components/virtualview",
    "components/root/tests",
    "scheduler/tests",
  ],
  dependencies: [.reactNativeDependencies, .reactJsiExecutor, .rctTypesafety, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .reactRendererDebug, .reactGraphics, .yoga, .reactJsInspectorTracing],
  sources: ["animated", "animationbackend", "animations", "attributedstring", "core", "componentregistry", "componentregistry/native", "components/root", "components/view", "components/view/platform/cxx", "components/scrollview", "components/scrollview/platform/cxx", "components/scrollview/platform/ios", "components/legacyviewmanagerinterop", "components/legacyviewmanagerinterop/platform/ios", "dom", "scheduler", "mounting", "observers/events", "observers/intersection", "observers/mutation", "telemetry", "consistency", "leakchecker", "uimanager", "uimanager/consistency", "viewtransition"]
)

let reactFabricInputAccessory = RNTarget(
  name: .reactFabricInputAccessory,
  path: "ReactCommon/react/renderer/components/inputaccessory",
  dependencies: [.reactNativeDependencies, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactFabric, .reactTurboModuleBridging]
)

let reactFabricModal = RNTarget(
  name: .reactFabricModal,
  path: "ReactCommon/react/renderer/components/modal",
  excludedPaths: [
    "platform/android",
    "platform/cxx",
  ],
  dependencies: [.reactNativeDependencies, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactFabric, .reactTurboModuleBridging]
)

let reactFabricSwitch = RNTarget(
  name: .reactFabricSwitch,
  path: "ReactCommon/react/renderer/components/switch/iosswitch",
  excludedPaths: ["react/renderer/components/switch/MacOSSwitchShadowNode.mm"],
  dependencies: [.reactNativeDependencies, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactFabric, .reactTurboModuleBridging]
)

let reactFabricSafeAreaView = RNTarget(
  name: .reactFabricSafeAreaView,
  path: "ReactCommon/react/renderer/components/safeareaview",
  dependencies: [.reactNativeDependencies, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactFabric, .reactTurboModuleBridging]
)

let reactFabricTextLayoutManager = RNTarget(
  name: .reactFabricTextLayoutManager,
  path: "ReactCommon/react/renderer/textlayoutmanager",
  excludedPaths: [
    "platform/android",
    "platform/cxx",
    "platform/windows",
    "platform/macos",
    "tests",
  ],
  dependencies: [.reactNativeDependencies, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactFabric, .reactTurboModuleBridging],
  sources: [".", "platform/ios"]
)

let reactFabricText = RNTarget(
  name: .reactFabricText,
  path: "ReactCommon/react/renderer/components/text",
  excludedPaths: [
    "platform/android",
    "tests",
  ],
  dependencies: [.reactNativeDependencies, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactFabric, .reactTurboModuleBridging, .reactFabricTextLayoutManager],
  sources: [".", "platform/cxx"]
)

let reactFabricTextInput = RNTarget(
  name: .reactFabricTextInput,
  path: "ReactCommon/react/renderer/components/textinput",
  excludedPaths: ["platform/android", "platform/macos"],
  dependencies: [.reactNativeDependencies, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactFabric, .reactTurboModuleBridging, .reactFabricTextLayoutManager],
  sources: [".", "platform/ios"]
)

/// React-FabricImage.podspec
let reactFabricImage = RNTarget(
  name: .reactFabricImage,
  path: "ReactCommon/react/renderer/components/image",
  excludedPaths: ["tests"],
  dependencies: [.reactNativeDependencies, .reactFabric, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactTurboModuleBridging, .reactImageManagerApple]
)

let reactFabricUnimplementedView = RNTarget(
  name: .reactFabricUnimplementedView,
  path: "ReactCommon/react/renderer/components/unimplementedview",
  dependencies: [.reactNativeDependencies, .reactCore, .reactJsiExecutor, .reactTurboModuleCore, .jsi, .logger, .reactDebug, .reactFeatureFlags, .reactUtils, .reactRuntimeScheduler, .reactCxxReact, .yoga, .reactRendererDebug, .reactGraphics, .reactFabric, .reactTurboModuleBridging]
)

/// React-RCTFabric.podspec
let reactRCTFabric = RNTarget(
  name: .reactRCTFabric,
  path: "React/Fabric",
  searchPaths: [virtualViewPath],
  dependencies: [.reactNativeDependencies, .reactCore, .reactRCTImage, .yoga, .reactRCTText, .jsi, .reactFabricInputAccessory, .reactFabricModal, .reactFabricSafeAreaView, .reactFabricSwitch, .reactFabricText, .reactFabricTextInput, .reactFabricUnimplementedView, .reactFabricTextLayoutManager, .reactGraphics, .reactImageManager, .reactDebug, .reactUtils, .reactPerformanceTimeline, .reactRendererDebug, .reactRendererConsistency, .reactRuntimeScheduler, .reactRCTAnimation, .reactJsInspector, .reactJsInspectorNetwork, .reactJsInspectorTracing, .reactFabric, .reactFabricImage, .rctSwiftUIWrapper]
)

/// React-ImageManagerApple.podspec
let reactImageManagerApple = RNTarget(
  name: .reactImageManagerApple,
  path: "ReactCommon/react/renderer/imagemanager/platform/ios",
  dependencies: [.reactNativeDependencies, .reactGraphics, .reactDebug, .reactUtils, .reactRendererDebug, .reactImageManager, .reactRCTImage, .reactCore, .yoga]
)

/// React-ImageManager.podspec
let reactImageManager = RNTarget(
  name: .reactImageManager,
  path: "ReactCommon/react/renderer/imagemanager",
  excludedPaths: ["platform", "tests"],
  dependencies: [.reactNativeDependencies, .reactGraphics, .reactDebug, .reactUtils, .reactRendererDebug, .yoga]
)

/// React-RCTAnimation.podspec
let reactRCTAnimation = RNTarget(
  name: .reactRCTAnimation,
  path: "Libraries/NativeAnimation",
  dependencies: [.reactNativeDependencies, .rctTypesafety, .jsi, .reactFeatureFlags, .yoga, .reactTurboModuleCore, .reactUtils]
)

/// React-RCTImage.podspec
let reactRCTImage = RNTarget(
  name: .reactRCTImage,
  path: "Libraries/Image",
  linkedFrameworks: ["Accelerate"],
  dependencies: [.rctTypesafety, .jsi, .yoga, .reactTurboModuleBridging, .reactTurboModuleCore]
)

/// React-RCTText.podspec
let reactRCTText = RNTarget(
  name: .reactRCTText,
  path: "Libraries/Text",
  dependencies: [.yoga, .reactTurboModuleCore]
)

/// React-RCTBlocl.podspec
let reactRCTBlob = RNTarget(
  name: .reactRCTBlob,
  path: "Libraries/Blob",
  dependencies: [.yoga, .jsi, .reactTurboModuleCore]
)

/// React-RCTNetwork.podspec
let reactRCTNetwork = RNTarget(
  name: .reactRCTNetwork,
  path: "Libraries/Network",
  dependencies: [.yoga, .jsi, .reactTurboModuleCore],
  defines: [
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED", to: "1", .when(configuration: BuildConfiguration.debug)),
    CXXSetting.define("REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY", to: "1", .when(configuration: BuildConfiguration.debug)),
  ]
)

/// React-RCTVibration.podspec
let reactRCTVibration = RNTarget(
  name: .reactRCTVibration,
  path: "Libraries/Vibration",
  linkedFrameworks: ["AudioToolbox"],
  dependencies: [.yoga, .jsi, .reactTurboModuleCore]
)

/// React-RCTAnimatedModuleProvider.podspec
let reactRCTAnimatedModuleProvider = RNTarget(
  name: .reactRCTAnimatedModuleProvider,
  path: "ReactApple/RCTAnimatedModuleProvider",
  dependencies: [.reactNativeDependencies, .jsi, .reactCore, .reactFeatureFlags, .reactFabric, .reactTurboModuleCore, .yoga, .hermesPrebuilt]
)

/// React-RCTAppDelegate.podspec
let reactAppDelegate = RNTarget(
  name: .reactAppDelegate,
  path: "Libraries/AppDelegate",
  dependencies: [.reactNativeDependencies, .jsi, .reactJsiExecutor, .reactRuntime, .reactRCTImage, .reactHermes, .reactCore, .reactFabric, .reactTurboModuleCore, .reactRCTAnimatedModuleProvider, .hermesPrebuilt, .yoga]
)

/// React-RCTLinking.podspec
let reactRCTLinking = RNTarget(
  name: .reactRCTLinking,
  path: "Libraries/LinkingIOS",
  dependencies: [.jsi, .reactTurboModuleCore]
)

/// React-RCTSettings.podspec
let reactSettings = RNTarget(
  name: .reactSettings,
  path: "Libraries/Settings",
  dependencies: [.reactTurboModuleCore, .yoga]
)

// MARK: Target list
let targets = [
  reactDebug,
  jsi,
  logger,
  mapbuffer,
  rctDeprecation,
  yoga,
  reactUtils,
  reactFeatureFlags,
  reactPerfLogger,
  reactJsInspectorNetwork,
  reactOSCompat,
  reactRendererDebug,
  reactRendererConsistency,
  reactHermes,
  reactJsiExecutor,
  reactJsInspector,
  reactJsInspectorTracing,
  reactCxxReact,
  reactCore,
  reactCoreRCTWebsocket,
  reactFabric,
  rctSwiftUI,
  rctSwiftUIWrapper,
  reactRCTFabric,
  reactFabricImage,
  reactFabricInputAccessory,
  reactFabricModal,
  reactFabricSafeAreaView,
  reactFabricSwitch,
  reactFabricTextLayoutManager,
  reactFabricText,
  reactFabricTextInput,
  reactFabricUnimplementedView,
  reactNativeDependencies,
  hermesPrebuilt,
  reactJsiTooling,
  reactNetworking,
  reactPerformanceCdpMetrics,
  reactPerformanceTimeline,
  reactRuntimeScheduler,
  rctTypesafety,
  reactGraphics,
  reactGraphicsApple,
  reactImageManager,
  reactImageManagerApple,
  reactJsErrorHandler,
  reactRuntime,
  reactRuntimeApple,
  reactRCTAnimation,
  reactRCTImage,
  reactRCTText,
  reactRCTBlob,
  reactRCTNetwork,
  reactRCTVibration,
  reactRCTLinking,
  reactCoreModules,
  reactTurboModuleBridging,
  reactTurboModuleCore,
  reactTurboModuleCoreDefaults,
  reactTurboModuleCoreMicrotasks,
  reactIdleCallbacksNativeModule,
  reactWebPerformanceNativeModule,
  reactIntersectionObserverNativeModule,
  reactMutationObserverNativeModule,
  reactViewTransitionNativeModule,
  reactFeatureflagsNativemodule,
  reactNativeModuleDom,
  reactRCTAnimatedModuleProvider,
  reactAppDelegate,
  reactSettings,
  reactRuntimeExecutor,
]

// MARK: Package object

let package = Package(
  name: react,
  platforms: [.iOS(.v15), .macCatalyst(SupportedPlatform.MacCatalystVersion.v13)],
  products: [
    .library(
      name: react,
      type: .dynamic,
      targets: targets.map { $0.name }
    )
  ],
  targets: targets.map { $0.target(targets: targets) }
)

// MARK: Support & Utility Classes

class BaseTarget {
  let name: String
  let path: String
  let searchPaths: [String]

  init(name: String, path: String, searchPaths: [String] = []) {
    self.name = name
    self.path = path
    self.searchPaths = searchPaths
  }

  func headerSearchPaths(targets: [BaseTarget]) -> [String] {
    return [path] + searchPaths
  }

  func target(targets: [BaseTarget]) -> Target {
    fatalError("Must override in subclass")
  }
}

class BinaryTarget: BaseTarget {
  override func target(targets: [BaseTarget]) -> Target {
    return .binaryTarget(name: self.name, path: self.path)
  }
}

class RNTarget: BaseTarget {
  let linkedFrameworks: [String]
  let excludedPaths: [String]
  let dependencies: [String]
  let sources: [String]?
  let publicHeadersPath: String?
  let defines: [CXXSetting]

  init(name: String, path: String, searchPaths: [String] = [], linkedFrameworks: [String] = [], excludedPaths: [String] = [], dependencies: [String] = [], sources: [String]? = nil, publicHeadersPath: String? = ".", defines: [CXXSetting] = []) {
    self.linkedFrameworks = linkedFrameworks
    self.excludedPaths = excludedPaths
    self.dependencies = dependencies
    self.sources = sources
    self.publicHeadersPath = publicHeadersPath
    self.defines = defines

    super.init(name: name, path: path, searchPaths: searchPaths)
  }

  override func headerSearchPaths(targets: [BaseTarget]) -> [String] {
    let dependencies = self.dependencies.compactMap { depName in
      targets.first(where: { $0.name == depName })
    }

    let dependenciesSearchPath: [String] =
      dependencies
      .compactMap { $0.headerSearchPaths(targets: targets) }
      .flatMap { $0 }
    let multipleSourcesSearchPath: [String] =
      self.sources?
      .compactMap { self.path + "/" + $0 } ?? []
    let pathSearchPath: [String] =
      [self.path] // the source path should be part of the header search path
      + [String(self.path.split(separator: "/").first ?? "")] // ReactCommon and ReactApple requires the first segment of the path to be in the search path

    let searchPaths: [String] =
      self.searchPaths + dependenciesSearchPath // transitively, add the dependencies search path
      + pathSearchPath + multipleSourcesSearchPath // complex target such as reactFabric

    return Array(Set(searchPaths))
  }

  override func target(targets: [BaseTarget]) -> Target {
    let searchPaths: [String] = self.headerSearchPaths(targets: targets)

    let linkerSettings = self.linkedFrameworks.reduce([]) { $0 + [LinkerSetting.linkedFramework($1)] }

    return Target.reactNativeTarget(
      name: self.name,
      path: self.path,
      searchPaths: searchPaths,
      excludedPaths: self.excludedPaths,
      dependencies: self.dependencies,
      sources: self.sources,
      publicHeadersPath: self.publicHeadersPath,
      linkerSettings: linkerSettings,
      defines: self.defines
    )
  }
}

extension String {
  static let reactDebug = "React-debug"
  static let jsi = "React-jsi"
  static let logger = "React-logger"
  static let mapbuffer = "React-Mapbuffer"

  static let rctSwiftUI = "RCTSwiftUI"
  static let rctSwiftUIWrapper = "RCTSwiftUIWrapper"

  static let rctDeprecation = "RCT-Deprecation"
  static let yoga = "Yoga"
  static let reactUtils = "React-utils"
  static let reactFeatureFlags = "React-featureflags"
  static let reactPerfLogger = "React-perflogger"
  static let reactJsInspectorNetwork = "React-jsinspectornetwork"
  static let reactRuntimeExecutor = "React-runtimeexecutor"
  static let reactOSCompat = "React-oscompat"
  static let reactCallInvoker = "React-callinvoker"
  static let reactRendererDebug = "React-rendererdebug"
  static let reactRendererConsistency = "React-rendererconsistency"

  static let reactHermes = "React-hermes"
  static let reactJsiTracing = "React-jsitracing"
  static let reactJsiExecutor = "React-jsiexecutor"
  static let reactJsInspector = "React-jsinspector"
  static let reactJsInspectorTracing = "React-jsinspectortracing"
  static let reactCxxReact = "React-cxxreact"
  static let reactCore = "React"
  static let reactCoreRCTWebsocket = "React/RCTWebSocket"
  static let reactFabric = "React-Fabric"
  static let reactRCTFabric = "React-RCTFabric"

  static let reactFabricImage = "React-FabricImage"
  static let reactFabricInputAccessory = "React-FabricInputAccessory"
  static let reactFabricModal = "React-FabricModal"
  static let reactFabricSafeAreaView = "React-FabricSafeAreaView"
  static let reactFabricSwitch = "React-FabricSwitch"
  static let reactFabricTextLayoutManager = "React-FabricTextLayoutManager"
  static let reactFabricText = "React-FabricText"
  static let reactFabricTextInput = "React-FabricTextInput"
  static let reactFabricUnimplementedView = "React-FabricUnimplementedView"

  static let reactNativeDependencies = "ReactNativeDependencies"

  static let hermesPrebuilt = "hermes-prebuilt"

  static let reactJsiTooling = "React-jsitooling"
  static let reactNetworking = "React-networking"
  static let reactPerformanceCdpMetrics = "React-performancecdpmetrics"
  static let reactPerformanceTimeline = "React-performancetimeline"
  static let reactRuntimeScheduler = "React-runtimescheduler"
  static let rctTypesafety = "RCTTypesafety"
  static let reactGraphics = "React-graphics"
  static let reactGraphicsApple = "React-graphics-Apple"
  static let reactRendererCss = "React-renderercss"
  static let reactImageManager = "React-ImageManager"
  static let reactImageManagerApple = "React-ImageManagerApple"
  static let reactJsErrorHandler = "React-jserrorhandler"

  static let reactRuntime = "React-Runtime"
  static let reactRuntimeApple = "React-RuntimeApple"
  static let reactRCTAnimation = "React-RCTAnimation"
  static let reactRCTImage = "React-RCTImage"
  static let reactRCTText = "React-RCTText"
  static let reactRCTBlob = "React-RCTBlob"
  static let reactRCTNetwork = "React-RCTNetwork"
  static let reactRCTVibration = "React-RCTVibration"
  static let reactRCTActionSheet = "React-RCTActionSheet" // Empty target
  static let reactRCTLinking = "React-RCTLinking"
  static let reactCoreModules = "React-CoreModules"
  static let reactRCTAnimatedModuleProvider = "RCTAnimatedModuleProvider"
  static let reactTurboModuleBridging = "React-bridging"
  static let reactTurboModuleCore = "ReactCommon/turbomodule/core"
  static let reactTurboModuleCoreDefaults = "ReactCommon/turbomodule/core/defaults"
  static let reactTurboModuleCoreMicrotasks = "ReactCommon/turbomodule/core/microtasks"
  static let reactIdleCallbacksNativeModule = "React-idlecallbacksnativemodule"
  static let reactWebPerformanceNativeModule = "React-webperformancenativemodule"
  static let reactIntersectionObserverNativeModule = "React-intersectionobservernativemodule"
  static let reactMutationObserverNativeModule = "React-mutationobservernativemodule"
  static let reactViewTransitionNativeModule = "React-viewtransitionnativemodule"
  static let reactFeatureflagsNativemodule = "React-featureflagsnativemodule"
  static let reactNativeModuleDom = "React-domnativemodule"
  static let reactAppDelegate = "React-RCTAppDelegate"
  static let reactSettings = "React-RCTSettings"
}

func relativeSearchPath(_ depth: Int, _ path: String) -> String {
  let slashes = (0..<depth).map { _ in "../" }.joined(separator: "")
  return "\(slashes)\(path)"
}

extension Target {
  static func reactNativeTarget(
    name: String,
    path: String,
    searchPaths: [String] = [],
    excludedPaths: [String] = [],
    dependencies: [String] = [],
    sources: [String]? = nil,
    publicHeadersPath: String? = ".",
    linkerSettings: [LinkerSetting] = [],
    defines: [CXXSetting] = []
  ) -> Target {
    let dependencies = dependencies.map { Dependency.byNameItem(name: $0, condition: nil) }
    let excludes = excludedPaths
    let numOfSlash = path.count { $0 == "/" }

    let cxxCommonHeaderPaths: [CXXSetting] =
      Set(searchPaths).map {
        CXXSetting.headerSearchPath(relativeSearchPath(numOfSlash + 1, $0))
      } + [
        CXXSetting.headerSearchPath(relativeSearchPath(numOfSlash + 1, ".build/headers")),
        CXXSetting.headerSearchPath(relativeSearchPath(numOfSlash + 1, ".build/headers/React")),
      ]

    let cxxSettings =
      [
        .unsafeFlags(["-std=c++20"]),
        .define("DEBUG", .when(configuration: .debug)),
        .define("NDEBUG", .when(configuration: .release)),
        .define("USE_HERMES", to: "1"),
        .define("RCT_REMOVE_LEGACY_ARCH", to: "1"),
        .define("HERMES_V1_ENABLED", to: "1"),
      ] + defines + cxxCommonHeaderPaths

    return .target(
      name: name,
      dependencies: dependencies,
      path: path,
      exclude: excludes,
      sources: sources,
      publicHeadersPath: publicHeadersPath,
      cxxSettings: cxxSettings,
      linkerSettings: linkerSettings
    )
  }
}
