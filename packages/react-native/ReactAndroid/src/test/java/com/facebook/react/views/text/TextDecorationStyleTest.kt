/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class TextDecorationStyleTest {
  @Test
  fun fromStringSolid() {
    assertThat(TextDecorationStyle.fromString("solid")).isEqualTo(TextDecorationStyle.SOLID)
  }

  @Test
  fun fromStringDouble() {
    assertThat(TextDecorationStyle.fromString("double")).isEqualTo(TextDecorationStyle.DOUBLE)
  }

  @Test
  fun fromStringDotted() {
    assertThat(TextDecorationStyle.fromString("dotted")).isEqualTo(TextDecorationStyle.DOTTED)
  }

  @Test
  fun fromStringDashed() {
    assertThat(TextDecorationStyle.fromString("dashed")).isEqualTo(TextDecorationStyle.DASHED)
  }

  @Test
  fun fromStringWavy() {
    assertThat(TextDecorationStyle.fromString("wavy")).isEqualTo(TextDecorationStyle.WAVY)
  }

  @Test
  fun fromStringNullDefaultsToSolid() {
    assertThat(TextDecorationStyle.fromString(null)).isEqualTo(TextDecorationStyle.SOLID)
  }

  @Test
  fun fromStringUnknownDefaultsToSolid() {
    assertThat(TextDecorationStyle.fromString("unknown")).isEqualTo(TextDecorationStyle.SOLID)
  }

  @Test
  fun fromStringEmptyDefaultsToSolid() {
    assertThat(TextDecorationStyle.fromString("")).isEqualTo(TextDecorationStyle.SOLID)
  }
}
