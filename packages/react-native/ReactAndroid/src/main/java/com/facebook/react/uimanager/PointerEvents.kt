/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants
import java.util.Locale

/**
 * Possible values for pointer events that a view and its descendants should receive. See
 * https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events for more info.
 */
public enum class PointerEvents {
  /** Neither the container nor its children receive events. */
  NONE,

  /** Container doesn't get events but all of its children do. */
  BOX_NONE,

  /** Container gets events but none of its children do. */
  BOX_ONLY,

  /** Container and all of its children receive touch events (like pointerEvents is unspecified). */
  AUTO;

  public companion object {

    /**
     * Parses pointer events case-insensitively, treating hyphens as underscores. Null and invalid
     * values return [AUTO]; invalid values also log a warning.
     */
    @JvmStatic
    public fun parsePointerEvents(pointerEventsStr: String?): PointerEvents =
        if (pointerEventsStr == null) {
          AUTO
        } else {
          try {
            PointerEvents.valueOf(pointerEventsStr.uppercase(Locale.US).replace("-", "_"))
          } catch (e: IllegalArgumentException) {
            FLog.w(ReactConstants.TAG, "Invalid pointerEvents value: $pointerEventsStr")
            AUTO
          }
        }

    @JvmStatic
    public fun canBeTouchTarget(pointerEvents: PointerEvents): Boolean {
      return pointerEvents == AUTO || pointerEvents == BOX_ONLY
    }

    @JvmStatic
    public fun canChildrenBeTouchTarget(pointerEvents: PointerEvents): Boolean {
      return pointerEvents == AUTO || pointerEvents == BOX_NONE
    }
  }
}
