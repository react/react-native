/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.jni.annotations.DoNotStrip
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.runtime.BindingsInstaller
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.react.runtime.ReactHostDelegate
import com.facebook.react.runtime.RuntimeGlobalsBindingsInstaller
import com.facebook.react.runtime.hermes.HermesInstance

/**
 * A utility class that allows you to simplify the initialization of React Native by setting up a
 * [ReactHostDelegate] that uses recommended dependencies.
 *
 * @param jsMainModulePath Path to your app's main module on Metro. This is used when reloading JS
 *   during development. All paths are relative to the root folder the packager is serving files
 *   from. Examples: `index.android` or `subdirectory/index.android`
 * @param jsBundleLoader Bundle loader to use when setting up JS environment. <p>Example:
 *   [JSBundleLoader.createFileLoader(application, bundleFile)]
 * @param reactPackages list of reactPackages to expose Native Modules and View Components to JS
 * @param jsRuntimeFactory Object that holds a native reference to the JS Runtime factory
 * @param bindingsInstaller Object that holds a native C++ references that allow host applications
 *   to install C++ objects into jsi::Runtime during the initialization of React Native
 * @param exceptionHandler Callback that can be used by React Native host applications to react to
 *   exceptions thrown by the internals of React Native.
 * @param runtimeGlobals Native values to install as properties of `globalThis` before the main
 *   bundle executes and before [bindingsInstaller] runs. Values are copied during construction and
 *   installed for each new runtime, including reloads. Supports strings, booleans, numbers, null,
 *   and nested maps and lists. Names must not match non-writable globals defined by React Native or
 *   the JavaScript engine. When empty, [bindingsInstaller] is used unchanged.
 */
@DoNotStrip
@UnstableReactNativeAPI
public class DefaultReactHostDelegate(
    override val jsMainModulePath: String,
    override val jsBundleLoader: JSBundleLoader,
    override val reactPackages: List<ReactPackage> = emptyList(),
    override val jsRuntimeFactory: JSRuntimeFactory = HermesInstance(),
    bindingsInstaller: BindingsInstaller? = null,
    private val exceptionHandler: (Exception) -> Unit = { throw it },
    override val turboModuleManagerDelegateBuilder: ReactPackageTurboModuleManagerDelegate.Builder,
    runtimeGlobals: Map<String, Any?> = emptyMap(),
) : ReactHostDelegate {
  override val bindingsInstaller: BindingsInstaller? =
      if (runtimeGlobals.isEmpty()) bindingsInstaller
      else RuntimeGlobalsBindingsInstaller.create(runtimeGlobals, bindingsInstaller)

  override fun handleInstanceException(error: Exception): Unit = exceptionHandler(error)
}
