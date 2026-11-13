/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.reactexecutor

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStrip
import com.facebook.react.bridge.JavaScriptExecutor

public class HermesExecutor internal constructor(enableDebugger: Boolean, debuggerName: String) :
    JavaScriptExecutor(initHybridDefaultConfig(enableDebugger, debuggerName)) {

  override fun getName(): String = "HermesExecutor"

  public companion object {
    /** Retained for compatibility; this method no longer loads native libraries. */
    @JvmStatic public fun loadLibrary() {}

    @DoNotStrip
    @JvmStatic
    private external fun initHybridDefaultConfig(
        enableDebugger: Boolean,
        debuggerName: String,
    ): HybridData

    @DoNotStrip
    @JvmStatic
    private external fun initHybrid(
        enableDebugger: Boolean,
        debuggerName: String,
        heapSizeMB: Long,
    ): HybridData
  }
}
