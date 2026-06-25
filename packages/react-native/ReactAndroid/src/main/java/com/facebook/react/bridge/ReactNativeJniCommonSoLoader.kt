/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.soloader.SoLoader
import com.facebook.soloader.annotation.SoLoaderLibrary

@SoLoaderLibrary("reactnativejni_common")
internal object ReactNativeJniCommonSoLoader {

  @JvmStatic
  @Synchronized
  fun staticInit() {
    if (initialized) {
      return
    }
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_START)
    SoLoader.loadLibrary("reactnativejni_common")
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_END)
    initialized = true
  }

  @get:JvmStatic
  @get:JvmName("isInitialized")
  @Volatile
  var initialized: Boolean = false
    private set
}
