/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.defaults

import android.content.Context
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.BindingsInstaller
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.cxxreactpackage.CxxReactPackage
import com.facebook.react.runtime.hermes.HermesInstance
import java.lang.Exception

/**
 * A utility class that allows you to simplify the setup of a [ReactHost] for new apps in Open
 * Source.
 *
 * [ReactHost] is an interface responsible of handling the lifecycle of a React Native app when
 * running in bridgeless mode.
 */
public object DefaultReactHost {
  private var reactHost: ReactHost? = null

  /**
   * Util function to create a default [ReactHost] to be used in your application. This method is
   * used by the New App template.
   *
   * @param context the Android [Context] to use for creating the [ReactHost]
   * @param packageList the list of [ReactPackage]s to use for creating the [ReactHost]
   * @param jsMainModulePath the path to your app's main module on Metro. Usually `index` or
   *   `index.<platform>`
   * @param jsBundleAssetPath the path to the JS bundle relative to the assets directory. Will be
   *   composed in a `asset://...` URL. Usually `index.android.bundle`.
   * @param jsBundleFilePath the path to the JS bundle on the filesystem. Will be composed in a
   *   `file://...` URL
   * @param jsRuntimeFactory the JS engine to use for executing [ReactHost], default to Hermes.
   * @param useDevSupport whether to enable dev support, default to ReactBuildConfig.DEBUG.
   * @param cxxReactPackageProviders a list of cxxreactpackage providers (to register c++ turbo
   *   modules)
   * @param exceptionHandler Callback that can be used by React Native host applications to react to
   *   exceptions thrown by the internals of React Native.
   * @param bindingsInstaller that can be used for installing bindings.
   *
   * TODO(T186951312): Should this be @UnstableReactNativeAPI?
   */
  @OptIn(UnstableReactNativeAPI::class)
  @JvmStatic
  public fun getDefaultReactHost(
      context: Context,
      packageList: List<ReactPackage>,
      jsMainModulePath: String = "index",
      jsBundleAssetPath: String = "index.android.bundle",
      jsBundleFilePath: String? = null,
      jsRuntimeFactory: JSRuntimeFactory? = null,
      useDevSupport: Boolean = ReactBuildConfig.DEBUG,
      cxxReactPackageProviders: List<(ReactContext) -> CxxReactPackage> = emptyList(),
      exceptionHandler: (Exception) -> Unit = { throw it },
      bindingsInstaller: BindingsInstaller? = null,
  ): ReactHost {
    reactHost?.let {
      return it
    }

    val bundleLoader =
        if (jsBundleFilePath != null) {
          if (jsBundleFilePath.startsWith("assets://")) {
            JSBundleLoader.createAssetLoader(context, jsBundleFilePath, true)
          } else {
            JSBundleLoader.createFileLoader(jsBundleFilePath)
          }
        } else {
          JSBundleLoader.createAssetLoader(context, "assets://$jsBundleAssetPath", true)
        }
    val defaultTmmDelegateBuilder = DefaultTurboModuleManagerDelegate.Builder()
    cxxReactPackageProviders.forEach { defaultTmmDelegateBuilder.addCxxReactPackage(it) }
    val defaultReactHostDelegate =
        DefaultReactHostDelegate(
            jsMainModulePath = jsMainModulePath,
            jsBundleLoader = bundleLoader,
            reactPackages = packageList,
            jsRuntimeFactory = jsRuntimeFactory ?: HermesInstance(),
            bindingsInstaller = bindingsInstaller,
            turboModuleManagerDelegateBuilder = defaultTmmDelegateBuilder,
            exceptionHandler = exceptionHandler,
        )
    val componentFactory = ComponentFactory()
    DefaultComponentsRegistry.register(componentFactory)
    // TODO: T164788699 find alternative of accessing ReactHostImpl for initialising reactHost
    val newReactHost =
        ReactHostImpl(
            context,
            defaultReactHostDelegate,
            componentFactory,
            true /* allowPackagerServerAccess */,
            useDevSupport,
        )
    reactHost = newReactHost
    return newReactHost
  }

  /**
   * Util function to create a default [ReactHost] to be used in your application. This method is
   * used by the New App template.
   *
   * This method takes in input a [ReactNativeHost] (bridge-mode) and uses its configuration to
   * create an equivalent [ReactHost] (bridgeless-mode).
   *
   * @param context the Android [Context] to use for creating the [ReactHost]
   * @param reactNativeHost the [ReactNativeHost] to use for creating the [ReactHost]
   *
   * TODO(T186951312): Should this be @UnstableReactNativeAPI? It's not, to maintain consistency
   *   with above getDefaultReactHost.
   */
  @OptIn(UnstableReactNativeAPI::class)
  @JvmStatic
  public fun getDefaultReactHost(
      context: Context,
      reactNativeHost: ReactNativeHost,
      jsRuntimeFactory: JSRuntimeFactory? = null,
  ): ReactHost {
    require(reactNativeHost is DefaultReactNativeHost) {
      "You can call getDefaultReactHost only with instances of DefaultReactNativeHost"
    }
    return reactNativeHost.toReactHost(context, jsRuntimeFactory)
  }

  /**
   * Cleanup function for brownfield scenarios where you want to remove the references kept by
   * reactHost after destroying the RN instance.
   */
  internal fun invalidate() {
    reactHost = null
  }
}
