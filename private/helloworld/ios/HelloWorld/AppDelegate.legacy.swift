/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Legacy AppDelegate-only integration reference.
//
// To use this pattern instead of the default SceneDelegate path:
// 1. Add `HELLOWORLD_USE_APPDELEGATE=1` to the HelloWorld target's Active Compilation Conditions
//    (or GCC_PREPROCESSOR_DEFINITIONS for Objective-C interoperability).
// 2. Remove `UIApplicationSceneManifest` from HelloWorld/Info.plist.
// 3. Use the AppDelegate implementation in AppDelegate.swift under `#if HELLOWORLD_USE_APPDELEGATE`
//    (the bootstrap code is kept there; this file documents the legacy approach).
//
// The default path uses `SceneDelegate` subclassing `RCTSceneDelegate` with `UIApplicationSceneManifest`
// declared in Info.plist.

import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UIKit

// Full legacy AppDelegate bootstrap (mirrors pre-SceneDelegate HelloWorld).
// Not compiled — reference only.

class LegacyAppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "HelloWorld",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func bundleURL() -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
