/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import android.view.KeyCharacterMap
import android.view.KeyEvent as AndroidKeyEvent
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class KeyValueTest {

  @Test
  fun keyThatTypesACharacterIsThatCharacter() {
    assertThat(KeyValue.of(AndroidKeyEvent.KEYCODE_E, 'é'.code)).isEqualTo("é")
    assertThat(KeyValue.of(AndroidKeyEvent.KEYCODE_SPACE, ' '.code)).isEqualTo(" ")
  }

  @Test
  fun keyThatTypesAControlCharacterIsNamed() {
    assertThat(KeyValue.of(AndroidKeyEvent.KEYCODE_ENTER, '\n'.code)).isEqualTo("Enter")
    assertThat(KeyValue.of(AndroidKeyEvent.KEYCODE_TAB, '\t'.code)).isEqualTo("Tab")
  }

  @Test
  fun keyThatTypesNoCharacterIsNamed() {
    assertThat(KeyValue.of(AndroidKeyEvent.KEYCODE_MOVE_END, 0)).isEqualTo("End")
  }

  @Test
  fun deadKeyIsDead() {
    assertThat(
            KeyValue.of(AndroidKeyEvent.KEYCODE_GRAVE, KeyCharacterMap.COMBINING_ACCENT or '`'.code)
        )
        .isEqualTo("Dead")
  }

  @Test
  fun keyWithNoNameThatTypesNoCharacterIsUnidentified() {
    assertThat(KeyValue.of(AndroidKeyEvent.KEYCODE_BUTTON_A, 0)).isEqualTo("Unidentified")
  }
}
