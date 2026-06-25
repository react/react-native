/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

/**
 * Enum representing the possible border rendering styles.
 *
 * These values correspond to CSS border-style property values supported by React Native.
 */
public enum class BorderStyle {
  /** A solid continuous line. */
  SOLID,
  /** A series of dashes. */
  DASHED,
  /** A series of dots. */
  DOTTED;

  public companion object {
    /**
     * Parses a string into a BorderStyle.
     *
     * @param borderStyle The string value (case-insensitive)
     * @return The corresponding BorderStyle, or null if not recognized
     */
    @JvmStatic
    public fun fromString(borderStyle: String): BorderStyle? {
      return when (borderStyle.lowercase()) {
        "solid" -> SOLID
        "dashed" -> DASHED
        "dotted" -> DOTTED
        else -> null
      }
    }
  }
}
