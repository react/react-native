/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shared.smoke

import kotlin.test.Test
import kotlin.test.assertEquals

class KmpSmokeTest {
  @Test
  fun positiveIntegers() {
    assertEquals(42, KmpSmoke.add(19, 23))
  }

  @Test
  fun signedIntegers() {
    assertEquals(-3, KmpSmoke.add(-7, 4))
  }

  @Test
  fun zero() {
    assertEquals(0, KmpSmoke.add(0, 0))
  }

  @Test
  fun integerBoundaries() {
    assertEquals(Int.MAX_VALUE, KmpSmoke.add(Int.MAX_VALUE, 0))
    assertEquals(Int.MIN_VALUE, KmpSmoke.add(Int.MIN_VALUE, 0))
  }
}
