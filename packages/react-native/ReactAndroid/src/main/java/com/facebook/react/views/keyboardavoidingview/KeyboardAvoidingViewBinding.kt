/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.keyboardavoidingview

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.fabric.FabricSoLoader
import com.facebook.react.fabric.StateWrapperImpl

/**
 * Sends keyboard avoidance values to the shared animation backend, through the C++ state of a
 * `KeyboardAvoidingView` shadow node. Must be called on the UI thread.
 */
@DoNotStripAny
internal object KeyboardAvoidingViewBinding {
  init {
    FabricSoLoader.staticInit()
  }

  @JvmStatic
  external fun update(
      stateWrapper: StateWrapperImpl,
      keyboardInset: Float,
      keyboardRestingHeight: Float,
  )
}
