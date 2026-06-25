/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.turbomodule.core

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.NativeModule
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.facebook.soloader.SoLoader

public abstract class TurboModuleManagerDelegate {

  // NOTE: This *must* be called "mHybridData"
  @DoNotStrip @Suppress("unused", "NoHungarianNotation") private val mHybridData: HybridData

  protected abstract fun initHybrid(): HybridData

  protected constructor() {
    maybeLoadOtherSoLibraries()
    mHybridData = initHybrid()
  }

  protected constructor(hybridData: HybridData) {
    maybeLoadOtherSoLibraries()
    this.mHybridData = hybridData
  }

  /**
   * Create and return a TurboModule Java object with name `moduleName`. If `moduleName` isn't a
   * TurboModule, return null.
   */
  public abstract fun getModule(moduleName: String): TurboModule?

  public abstract fun unstable_isModuleRegistered(moduleName: String): Boolean

  /**
   * Create an return a legacy NativeModule with name `moduleName`. If `moduleName` is a
   * TurboModule, return null.
   */
  public open fun getLegacyModule(moduleName: String): NativeModule? = null

  public open fun unstable_isLegacyModuleRegistered(moduleName: String): Boolean = false

  public open fun getEagerInitModuleNames(): List<String> = emptyList()

  // TODO(T171231381): Consider removing this method: could we just use the static initializer
  // of derived classes instead?
  @Synchronized protected fun maybeLoadOtherSoLibraries(): Unit = Unit

  private companion object {
    init {
      SoLoader.loadLibrary("turbomodulejsijni")
    }
  }
}
