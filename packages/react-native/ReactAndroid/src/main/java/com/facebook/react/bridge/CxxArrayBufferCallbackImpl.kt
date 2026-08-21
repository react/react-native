/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStrip

/**
 * Resolve callback for a Promise that may be fulfilled with an [ArrayBuffer] or null. Created from
 * C++ only where the JavaScript spec permits `Promise<ArrayBuffer>` or `Promise<?ArrayBuffer>`.
 *
 * Unlike [CxxCallbackImpl], this does not serialize through folly::dynamic: an owning [ArrayBuffer]
 * reaches JavaScript aliasing the same bytes, and null is forwarded explicitly.
 *
 * The buffer must own its bytes. A non-owning one borrows from the JS `ArrayBuffer` passed to some
 * earlier synchronous call, and that borrow is revoked once the call returns - long before a
 * Promise resolved here reaches JavaScript.
 *
 * A module that resolves with anything else is misusing its spec. Rather than throwing on whichever
 * thread called `Promise.resolve`, the problem is described to C++, which rejects the Promise with
 * it.
 */
@DoNotStrip
internal class CxxArrayBufferCallbackImpl @DoNotStrip private constructor() :
    HybridClassBase(), Callback {

  override fun invoke(vararg args: Any?) {
    if (args.size > 1) {
      nativeInvoke(null, "expected at most one argument, got ${args.size}")
      return
    }
    when (val arg = args.firstOrNull()) {
      null -> nativeInvoke(null, null)
      is ArrayBuffer -> {
        if (arg.isOwningBytes) {
          val buf = arg.bytes
          if (buf.position() != 0 || buf.limit() != buf.capacity()) {
            nativeInvoke(
                null,
                "the ArrayBuffer's position must be 0 and its limit must equal its capacity; " +
                    "position and limit are not preserved when the buffer is handed to " +
                    "JavaScript.")
            return
          }
          nativeInvoke(arg, null)
        } else {
          nativeInvoke(
              null,
              "expected an ArrayBuffer that owns its bytes; the bytes of a non-owning one are " +
                  "no longer valid by the time the Promise resolves. Copy them with " +
                  "ArrayBuffer.arrayBufferWithCopiedBytes().")
        }
      }
      else -> nativeInvoke(null, "expected an ArrayBuffer or null, got ${arg.javaClass.name}")
    }
  }

  /**
   * At most one of [arrayBuffer] and [error] is non-null. Both null resolves with JavaScript null.
   */
  private external fun nativeInvoke(arrayBuffer: ArrayBuffer?, error: String?)
}
