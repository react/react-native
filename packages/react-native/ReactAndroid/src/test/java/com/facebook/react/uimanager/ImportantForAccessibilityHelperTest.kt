/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class ImportantForAccessibilityHelperTest {

  @Test
  fun parseImportantForAccessibility_mapsEachValueToItsViewMode() {
    val values =
        listOf(
            null to View.IMPORTANT_FOR_ACCESSIBILITY_AUTO,
            "auto" to View.IMPORTANT_FOR_ACCESSIBILITY_AUTO,
            "yes" to View.IMPORTANT_FOR_ACCESSIBILITY_YES,
            "no" to View.IMPORTANT_FOR_ACCESSIBILITY_NO,
            "no-hide-descendants" to View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS,
        )
    for ((value, expected) in values) {
      assertThat(ImportantForAccessibilityHelper.parseImportantForAccessibility(value))
          .describedAs("$value")
          .isEqualTo(expected)
    }
  }

  @Test
  fun parseImportantForAccessibility_valuesOutsideThePropsValuesMapToNoMode() {
    for (value in listOf("", "sometimes", "YES", " auto ")) {
      assertThat(ImportantForAccessibilityHelper.parseImportantForAccessibility(value))
          .describedAs(value)
          .isNull()
    }
  }
}
