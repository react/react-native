/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.debug.tags

import android.graphics.Color
import com.facebook.debug.debugoverlay.model.DebugOverlayTag

/** Category for debug overlays. */
internal object ReactDebugOverlayTags {
  @JvmField
  val PERFORMANCE: DebugOverlayTag =
      DebugOverlayTag("Performance", "Markers for Performance", Color.GREEN)
  @JvmField
  val NAVIGATION: DebugOverlayTag =
      DebugOverlayTag("Navigation", "Tag for navigation", Color.rgb(0x9C, 0x27, 0xB0))
  @JvmField
  val RN_CORE: DebugOverlayTag =
      DebugOverlayTag("RN Core", "Tag for React Native Core", Color.BLACK)
  @JvmField
  val BRIDGE_CALLS: DebugOverlayTag =
      DebugOverlayTag("Bridge Calls", "JS to Java calls (warning: this is spammy)", Color.MAGENTA)
  @JvmField
  val NATIVE_MODULE: DebugOverlayTag =
      DebugOverlayTag("Native Module", "Native Module init", Color.rgb(0x80, 0x00, 0x80))
  @JvmField
  val UI_MANAGER: DebugOverlayTag =
      DebugOverlayTag(
          "UI Manager",
          "UI Manager View Operations (requires restart\nwarning: this is spammy)",
          Color.CYAN,
      )
}
