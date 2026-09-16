/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStripAny

@DoNotStripAny
public abstract class JavaScriptExecutor
protected constructor(
    // fbjni looks for the exact name "mHybridData":
    // https://github.com/facebookincubator/fbjni/blob/7b7efda0d49b956acf1d3307510e3c73fc55b404/cxx/fbjni/detail/Hybrid.h#L310
    @Suppress("NoHungarianNotation") private val mHybridData: HybridData,
) {
  /**
   * Close this executor and cleanup any resources that it was using. No further calls are expected
   * after this. TODO mhorowitz: This may no longer be used; check and delete if possible.
   */
  public open fun close() {
    mHybridData.resetNative()
  }

  /** Returns the name of the executor, identifying the underlying runtime. */
  public abstract fun getName(): String
}
