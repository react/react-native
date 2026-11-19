/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.reactexecutor

import com.facebook.hermes.instrumentation.HermesSamplingProfiler.disable
import com.facebook.hermes.instrumentation.HermesSamplingProfiler.dumpSampledTraceToFile
import com.facebook.hermes.instrumentation.HermesSamplingProfiler.enable
import com.facebook.react.bridge.JavaScriptExecutor
import com.facebook.react.bridge.JavaScriptExecutorFactory

public class HermesExecutorFactory : JavaScriptExecutorFactory {
  private var enableDebugger = true
  private var debuggerName = ""

  public fun setEnableDebugger(enableDebugger: Boolean) {
    this.enableDebugger = enableDebugger
  }

  public fun setDebuggerName(debuggerName: String) {
    this.debuggerName = debuggerName
  }

  /**
   * Compatibility factory for the unsupported legacy Hermes executor.
   *
   * @throws UnsupportedOperationException when creating an executor; use the New Architecture
   *   runtime instead.
   */
  override fun create(): JavaScriptExecutor {
    throw UnsupportedOperationException(
        "HermesExecutorFactory is no longer supported. Use the New Architecture runtime instead.",
    )
  }

  override fun startSamplingProfiler() {
    enable()
  }

  override fun stopSamplingProfiler(filename: String) {
    dumpSampledTraceToFile(filename)
    disable()
  }

  override fun toString(): String = "JSIExecutor+HermesRuntime"
}
