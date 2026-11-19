/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View

internal object ImportantForAccessibilityHelper {
  @JvmStatic
  fun parseImportantForAccessibility(importantForAccessibility: String?): Int? =
      when (importantForAccessibility) {
        null,
        "auto" -> View.IMPORTANT_FOR_ACCESSIBILITY_AUTO
        "yes" -> View.IMPORTANT_FOR_ACCESSIBILITY_YES
        "no" -> View.IMPORTANT_FOR_ACCESSIBILITY_NO
        "no-hide-descendants" -> View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
        else -> null
      }
}
