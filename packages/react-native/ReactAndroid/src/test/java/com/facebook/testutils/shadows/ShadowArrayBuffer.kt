/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.bridge.ArrayBuffer
import java.nio.ByteBuffer
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements
import org.robolectric.shadow.api.Shadow

/**
 * Stands in for the C++ peer of [ArrayBuffer], which Robolectric cannot load. Tracks the
 * borrow-validity flag the peer owns so the Kotlin-side ownership contract can be tested.
 */
@Implements(ArrayBuffer::class)
open class ShadowArrayBuffer {

  private var bytesValid = true

  // The parameters are unused but must stay: Robolectric matches a shadow method to the native one
  // by signature.
  @Suppress("UNUSED_PARAMETER")
  @Implementation
  fun initHybrid(buffer: ByteBuffer, isOwningBytes: Boolean) = Unit

  @Implementation fun isBytesValid(): Boolean = bytesValid

  companion object {
    /** Simulates the native peer revoking a borrow when the call frame that lent the bytes ends. */
    @JvmStatic
    fun invalidate(arrayBuffer: ArrayBuffer) {
      (Shadow.extract(arrayBuffer) as ShadowArrayBuffer).bytesValid = false
    }
  }
}
