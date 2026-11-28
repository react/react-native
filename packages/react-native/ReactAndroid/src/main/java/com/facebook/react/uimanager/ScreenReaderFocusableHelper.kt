/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.os.Build
import android.view.View
import android.view.accessibility.AccessibilityNodeInfo
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import com.facebook.react.R

// Below API 28 View has no screenReaderFocusable, so a tag holds it and node extras carry it.
internal object ScreenReaderFocusableHelper {
  fun isScreenReaderFocusable(view: View): Boolean =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        view.isScreenReaderFocusable
      } else {
        view.getTag(R.id.screen_reader_focusable) == true
      }

  fun setScreenReaderFocusable(view: View, screenReaderFocusable: Boolean) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      view.isScreenReaderFocusable = screenReaderFocusable
    } else {
      view.setTag(R.id.screen_reader_focusable, screenReaderFocusable)
    }
  }

  fun initializeAccessibilityNodeInfo(view: View, info: AccessibilityNodeInfo) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P && isScreenReaderFocusable(view)) {
      AccessibilityNodeInfoCompat.wrap(info).isScreenReaderFocusable = true
    }
  }
}
