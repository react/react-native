/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.reactexecutor

import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Test

class HermesExecutorFactoryTest {
  @Test
  fun loadLibraryIsNoOp() {
    HermesExecutor.loadLibrary()
    HermesExecutor.loadLibrary()
  }

  @Test
  fun createIsUnsupported() {
    val factory = HermesExecutorFactory()
    factory.setEnableDebugger(false)
    factory.setDebuggerName("test")

    repeat(2) {
      assertThatThrownBy { factory.create() }
          .isInstanceOf(UnsupportedOperationException::class.java)
          .hasMessage(
              "HermesExecutorFactory is no longer supported. Use the New Architecture runtime instead.",
          )
    }
  }
}
