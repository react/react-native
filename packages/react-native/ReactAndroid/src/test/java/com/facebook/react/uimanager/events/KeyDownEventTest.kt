/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import android.view.KeyEvent as AndroidKeyEvent
import com.facebook.react.bridge.WritableMap
import com.facebook.testutils.shadows.ShadowArguments
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowArguments::class])
class KeyDownEventTest {

  @Suppress("DEPRECATION")
  private fun keyOf(keyCode: Int): String? {
    val event = KeyDownEvent(1, 2, AndroidKeyEvent(0, 0, AndroidKeyEvent.ACTION_DOWN, keyCode, 0))
    val emitter = mock<RCTModernEventEmitter>()
    val payload = argumentCaptor<WritableMap>()
    event.dispatchModern(emitter)
    verify(emitter).receiveEvent(any(), any(), any(), any(), any(), payload.capture(), any())
    return payload.firstValue.getString("key")
  }

  @Test
  fun keyThatTypesNoCharacterIsNamedByItsKeyValue() {
    assertThat(
            listOf(
                    AndroidKeyEvent.KEYCODE_MOVE_HOME,
                    AndroidKeyEvent.KEYCODE_PAGE_DOWN,
                    AndroidKeyEvent.KEYCODE_FORWARD_DEL,
                    AndroidKeyEvent.KEYCODE_F1,
                )
                .map(::keyOf)
        )
        .containsExactly("Home", "PageDown", "Delete", "F1")
  }
}
