/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.soloader.SoLoader
import com.facebook.soloader.annotation.SoLoaderLibrary
import kotlin.jvm.JvmStatic

@SoLoaderLibrary("uimanagerjni")
@DoNotStripAny
internal object UIConstantsProviderBinding {
  init {
    SoLoader.loadLibrary("uimanagerjni")
  }

  @JvmStatic
  external fun install(
      runtimeExecutor: RuntimeExecutor,
      defaultEventTypesProvider: DefaultEventTypesProvider,
      viewManagerConstantsProvider: ConstantsForViewManagerProvider,
      constantsProvider: ConstantsProvider,
  )

  @DoNotStripAny
  fun interface DefaultEventTypesProvider {
    /* Returns UIManager's constants. */
    fun getDefaultEventTypes(): NativeMap
  }

  @DoNotStripAny
  fun interface ConstantsForViewManagerProvider {
    /* Returns UIManager's constants. */
    fun getConstantsForViewManager(viewManagerName: String): NativeMap?
  }

  @DoNotStripAny
  fun interface ConstantsProvider {
    /* Returns UIManager's constants. */
    fun getConstants(): NativeMap
  }
}
