/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.mockito.Mockito.mockStatic

class PointerEventsTest {

  @Test
  fun parsePointerEvents_acceptsAllValuesAndNormalisationVariants() {
    val values =
        listOf(
            "auto" to PointerEvents.AUTO,
            "AUTO" to PointerEvents.AUTO,
            "AuTo" to PointerEvents.AUTO,
            "none" to PointerEvents.NONE,
            "NONE" to PointerEvents.NONE,
            "NoNe" to PointerEvents.NONE,
            "box-none" to PointerEvents.BOX_NONE,
            "BOX-NONE" to PointerEvents.BOX_NONE,
            "BoX-NoNe" to PointerEvents.BOX_NONE,
            "box_none" to PointerEvents.BOX_NONE,
            "BOX_NONE" to PointerEvents.BOX_NONE,
            "box-only" to PointerEvents.BOX_ONLY,
            "BOX-ONLY" to PointerEvents.BOX_ONLY,
            "BoX-OnLy" to PointerEvents.BOX_ONLY,
            "box_only" to PointerEvents.BOX_ONLY,
            "BOX_ONLY" to PointerEvents.BOX_ONLY,
        )
    for ((value, expected) in values) {
      assertThat(PointerEvents.parsePointerEvents(value)).describedAs(value).isEqualTo(expected)
    }
  }

  @Test
  fun parsePointerEvents_nullDefaultsToAutoWithoutWarning() {
    mockStatic(FLog::class.java).use { flog ->
      assertThat(PointerEvents.parsePointerEvents(null)).isEqualTo(PointerEvents.AUTO)
      flog.verifyNoInteractions()
    }
  }

  @Test
  fun parsePointerEvents_invalidValuesDefaultToAutoAndWarnWithOriginalValue() {
    mockStatic(FLog::class.java).use { flog ->
      for (value in listOf("", "BoX-InVaLiD", " auto ")) {
        assertThat(PointerEvents.parsePointerEvents(value)).isEqualTo(PointerEvents.AUTO)
        flog.verify { FLog.w(ReactConstants.TAG, "Invalid pointerEvents value: $value") }
      }
      flog.verifyNoMoreInteractions()
    }
  }
}
