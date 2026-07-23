/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

/** Tests for [Overflow.fromString] */
class OverflowTest {
  @Test
  fun recognizedValuesAreParsedCaseInsensitively() {
    assertThat(Overflow.fromString("visible")).isEqualTo(Overflow.VISIBLE)
    assertThat(Overflow.fromString("hidden")).isEqualTo(Overflow.HIDDEN)
    assertThat(Overflow.fromString("scroll")).isEqualTo(Overflow.SCROLL)
    assertThat(Overflow.fromString("HiDdEn")).isEqualTo(Overflow.HIDDEN)
  }

  @Test
  fun nullDefaultsToVisible() {
    assertThat(Overflow.fromString(null)).isEqualTo(Overflow.VISIBLE)
  }

  @Test
  fun unrecognizedDefaultsToVisible() {
    assertThat(Overflow.fromString("bogus")).isEqualTo(Overflow.VISIBLE)
  }

  @Test
  fun customDefaultHonoredForNullAndUnrecognized() {
    assertThat(Overflow.fromString(null, Overflow.SCROLL)).isEqualTo(Overflow.SCROLL)
    assertThat(Overflow.fromString("bogus", Overflow.SCROLL)).isEqualTo(Overflow.SCROLL)
  }

  @Test
  fun customDefaultDoesNotOverrideRecognizedValues() {
    assertThat(Overflow.fromString("hidden", Overflow.SCROLL)).isEqualTo(Overflow.HIDDEN)
  }
}
