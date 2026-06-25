/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.inspector

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.soloader.SoLoader
import com.facebook.soloader.annotation.SoLoaderLibrary

/**
 * JNI wrapper for `jsinspectormodern::NetworkRequestListener`. Handles the `ScopedExecutor`
 * callback use on the C++ side.
 */
@SoLoaderLibrary("reactnativejni")
@DoNotStripAny
internal class InspectorNetworkRequestListener(
    @field:DoNotStrip private val mHybridData: HybridData
) {
  external fun onHeaders(httpStatusCode: Int, headers: Map<String?, String?>?)

  external fun onData(data: String?)

  external fun onError(message: String?)

  external fun onCompletion()

  companion object {
    init {
      SoLoader.loadLibrary("reactnativejni")
    }
  }
}
