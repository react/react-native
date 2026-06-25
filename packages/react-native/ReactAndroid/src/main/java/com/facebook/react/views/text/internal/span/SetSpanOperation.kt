/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.text.Spannable
import android.text.SpannableStringBuilder
import android.text.Spanned
import com.facebook.common.logging.FLog
import kotlin.math.max

internal class SetSpanOperation(
    private val start: Int,
    private val end: Int,
    @JvmField val what: Any,
) {
  /**
   * @param builder Spannable string builder
   * @param priorityIndex index of this operation in the topological sorting which puts operations
   *   with higher priority before operations with lower priority.
   */
  fun execute(builder: SpannableStringBuilder, priorityIndex: Int) {
    check(priorityIndex >= 0)
    // All spans will automatically extend to the right of the text, but not the left - except
    // for spans that start at the beginning of the text.
    var spanFlags = Spannable.SPAN_EXCLUSIVE_INCLUSIVE
    if (start == 0) {
      spanFlags = Spannable.SPAN_INCLUSIVE_INCLUSIVE
    }

    // Calculate priority, assigning the highest values to operations with the highest priority
    val priority = SPAN_MAX_PRIORITY - priorityIndex

    if (priority < 0) {
      FLog.w(TAG, "Text tree size exceeded the limit, styling may become unpredictable")
    }

    // If the computed priority doesn't fit in the flags, clamp it. The effect might not be correct
    // in 100% of cases, but doing nothing (as we did in the past) leads to totally random results.
    val effectivePriority = max(priority, 0)

    spanFlags = spanFlags and Spannable.SPAN_PRIORITY.inv()
    spanFlags =
        spanFlags or
            ((effectivePriority shl Spannable.SPAN_PRIORITY_SHIFT) and Spannable.SPAN_PRIORITY)

    builder.setSpan(what, start, end, spanFlags)
  }

  companion object {
    private const val TAG = "SetSpanOperation"
    const val SPAN_MAX_PRIORITY: Int = Spanned.SPAN_PRIORITY shr Spanned.SPAN_PRIORITY_SHIFT
  }
}
