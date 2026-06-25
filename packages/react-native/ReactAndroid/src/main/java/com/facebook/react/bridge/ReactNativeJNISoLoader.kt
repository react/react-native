/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.annotations.internal.InteropLegacyArchitecture
import com.facebook.soloader.SoLoader
import com.facebook.soloader.annotation.SoLoaderLibrary

@SoLoaderLibrary("reactnativejni")
@InteropLegacyArchitecture
internal object ReactNativeJNISoLoader {

  @JvmStatic
  @Synchronized
  fun staticInit() {
    if (initialized) {
      return
    }
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_START)
    SoLoader.loadLibrary("reactnativejni")
    ReactMarker.logMarker(ReactMarkerConstants.LOAD_REACT_NATIVE_SO_FILE_END)
    initialized = true
  }

  @get:JvmStatic
  @get:JvmName("isInitialized")
  var initialized: Boolean = false
    private set
}
