/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
internal object RawColorParser {
  init {
    ReactNativeJNISoLoader.staticInit()
  }

  @DoNotStrip @JvmStatic external fun nativeParse(value: String): Int?
}
