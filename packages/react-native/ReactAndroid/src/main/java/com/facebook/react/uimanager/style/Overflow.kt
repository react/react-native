/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

/**
 * Enum representing the overflow behavior of a view's content.
 *
 * These values correspond to CSS overflow property values, controlling how content that exceeds the
 * view's bounds is handled.
 */
internal enum class Overflow {
  /** Content is not clipped and may be visible outside the view's bounds. */
  VISIBLE,
  /** Content is clipped to the view's bounds without scrolling. */
  HIDDEN,
  /** Content is clipped to the view's bounds but can be scrolled to reveal hidden content. */
  SCROLL;

  companion object {
    /**
     * Parses a string into an Overflow value.
     *
     * @param overflow The string value (case-insensitive)
     * @return The corresponding Overflow, or null if not recognized
     */
    @JvmStatic
    fun fromString(overflow: String): Overflow? {
      return when (overflow.lowercase()) {
        "visible" -> VISIBLE
        "hidden" -> HIDDEN
        "scroll" -> SCROLL
        else -> null
      }
    }
  }
}
