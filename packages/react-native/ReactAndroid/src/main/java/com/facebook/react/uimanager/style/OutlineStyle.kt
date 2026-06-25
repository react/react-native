/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

/**
 * Enum representing the possible outline rendering styles.
 *
 * These values correspond to CSS outline-style property values supported by React Native. Outlines
 * are drawn outside the border edge and do not affect layout.
 *
 * @see BorderStyle
 */
public enum class OutlineStyle {
  /** A solid continuous line. */
  SOLID,
  /** A series of dashes. */
  DASHED,
  /** A series of dots. */
  DOTTED;

  public companion object {
    /**
     * Parses a string into an OutlineStyle.
     *
     * @param outlineStyle The string value (case-insensitive)
     * @return The corresponding OutlineStyle, or null if not recognized
     */
    @JvmStatic
    public fun fromString(outlineStyle: String): OutlineStyle? {
      return when (outlineStyle.lowercase()) {
        "solid" -> SOLID
        "dashed" -> DASHED
        "dotted" -> DOTTED
        else -> null
      }
    }
  }
}
