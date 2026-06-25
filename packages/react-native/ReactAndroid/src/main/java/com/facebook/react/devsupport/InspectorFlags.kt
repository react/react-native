/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader
import com.facebook.soloader.annotation.SoLoaderLibrary

/** JNI wrapper for `jsinspector_modern::InspectorFlags`. */
@SoLoaderLibrary("react_devsupportjni")
@DoNotStrip
internal object InspectorFlags {
  init {
    SoLoader.loadLibrary("react_devsupportjni")
  }

  @DoNotStrip @JvmStatic external fun getScreenshotCaptureEnabled(): Boolean

  @DoNotStrip @JvmStatic external fun getFuseboxEnabled(): Boolean

  @DoNotStrip @JvmStatic external fun getIsProfilingBuild(): Boolean

  @DoNotStrip @JvmStatic external fun getFrameRecordingEnabled(): Boolean
}
