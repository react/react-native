/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.interfaces.exceptionmanager

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import java.util.ArrayList

@DoNotStripAny
@UnstableReactNativeAPI
internal fun interface ReactJsExceptionHandler {
  @DoNotStripAny
  interface ProcessedError {
    @DoNotStripAny
    interface StackFrame {
      val file: String?
      val methodName: String
      val lineNumber: Int?
      val column: Int?
    }

    val message: String
    val originalMessage: String?
    val name: String?
    val componentStack: String?
    val stack: List<StackFrame>
    val id: Int
    val isFatal: Boolean
    // Nullable: native marshalling may fail or the error may carry none (see
    // JReactExceptionManager.cpp).
    val extraData: ReadableMap?
  }

  @DoNotStripAny
  private data class ProcessedErrorStackFrameImpl(
      override val file: String?,
      override val methodName: String,
      override val lineNumber: Int?,
      override val column: Int?,
  ) : ProcessedError.StackFrame

  @DoNotStripAny
  private data class ProcessedErrorImpl(
      override val message: String,
      override val originalMessage: String?,
      override val name: String?,
      override val componentStack: String?,
      override val stack: ArrayList<ProcessedErrorStackFrameImpl>,
      override val id: Int,
      override val isFatal: Boolean,
      override val extraData: ReadableNativeMap?,
  ) : ProcessedError

  fun reportJsException(errorMap: ProcessedError)
}
