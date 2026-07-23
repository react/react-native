/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.runtime.cxxreactpackage.CxxReactPackage

/**
 * A utility class that allows you to simplify the setup of a
 * [ReactPackageTurboModuleManagerDelegate] for new apps in Open Source.
 *
 * This class works together with the [DefaultNewArchitectureEntryPoint] and it's C++ implementation
 * is hosted inside the React Native framework
 *
 * TODO(T186951312): Should this be @UnstableReactNativeAPI?
 */
@OptIn(UnstableReactNativeAPI::class)
@DoNotStripAny
public class DefaultTurboModuleManagerDelegate
private constructor(
    context: ReactApplicationContext,
    packages: List<ReactPackage>,
    cxxReactPackages: List<CxxReactPackage>,
) : ReactPackageTurboModuleManagerDelegate(context, packages, initHybrid(cxxReactPackages)) {

  override fun initHybrid(): HybridData {
    throw UnsupportedOperationException(
        "DefaultTurboModuleManagerDelegate.initHybrid() must never be called!"
    )
  }

  public class Builder : ReactPackageTurboModuleManagerDelegate.Builder() {
    private val cxxReactPackageProviders =
        mutableListOf<(context: ReactApplicationContext) -> List<CxxReactPackage>>()

    public fun addCxxReactPackage(provider: () -> CxxReactPackage): Builder = apply {
      cxxReactPackageProviders.add { _ -> listOf(provider()) }
    }

    public fun addCxxReactPackage(
        provider: (context: ReactApplicationContext) -> CxxReactPackage
    ): Builder = apply { cxxReactPackageProviders.add { context -> listOf(provider(context)) } }

    public fun addCxxReactPackages(
        provider: (context: ReactApplicationContext) -> List<CxxReactPackage>
    ): Builder = apply { cxxReactPackageProviders.add(provider) }

    override fun build(
        context: ReactApplicationContext,
        packages: List<ReactPackage>,
    ): DefaultTurboModuleManagerDelegate = DefaultTurboModuleManagerDelegate(
        context,
        packages,
        cxxReactPackageProviders.flatMap { provider -> provider(context) },
    )
  }

  private companion object {
    init {
      DefaultSoLoader.maybeLoadSoLibrary()
    }

    @DoNotStrip
    @JvmStatic
    external fun initHybrid(cxxReactPackages: List<CxxReactPackage>): HybridData
  }
}
