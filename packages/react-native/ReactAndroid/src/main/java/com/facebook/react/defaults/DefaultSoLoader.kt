/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.defaults

import com.facebook.soloader.SoLoader
import com.facebook.soloader.annotation.SoLoaderLibrary

@SoLoaderLibrary("react_newarchdefaults")
internal object DefaultSoLoader {
  @Synchronized
  @JvmStatic
  fun maybeLoadSoLibrary() {
    SoLoader.loadLibrary("react_newarchdefaults")
    try {
      SoLoader.loadLibrary("appmodules")
    } catch (e: UnsatisfiedLinkError) {
      // ignore: DefaultTurboModuleManagerDelegate is still used in apps that don't have
      // appmodules.so
    }
  }
}
