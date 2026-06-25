/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.view.View
import com.facebook.react.R
import com.facebook.react.uimanager.PointerEvents

/**
 * Helper class for managing the important_for_interaction view tag. This tag determines how a view
 * participates in interaction handling.
 */
internal object ImportantForInteractionHelper {
  /** The view is important for interaction. */
  const val IMPORTANT_FOR_INTERACTION_YES: Int = 0x1

  /** The view is not important for interaction. */
  const val IMPORTANT_FOR_INTERACTION_NO: Int = 0x2

  /** Descendants of this view should be excluded from interaction handling. */
  const val IMPORTANT_FOR_INTERACTION_EXCLUDE_DESCENDANTS: Int = 0x4

  /** CSS pointer-events: auto heuristics. */
  const val IMPORTANT_FOR_INTERACTION_AUTO_CSSPOINTEREVENTSAUTO: Int = 0x8

  /**
   * Sets the important_for_interaction tag on a view based on the given [PointerEvents] value.
   *
   * Note: The pointer events value alone does not determine if a view is important for interaction.
   * A view with pointerEvents=auto or pointerEvents=box-only can be important for interaction if
   * none of its ancestors is blocking pointer events with pointerEvents=none or box-none.
   *
   * @param view The view to set the tag on
   * @param pointerEvents The pointer events value to convert and set
   */
  @JvmStatic
  fun setImportantForInteraction(view: View, pointerEvents: PointerEvents) {
    val value =
        when (pointerEvents) {
          PointerEvents.AUTO -> IMPORTANT_FOR_INTERACTION_AUTO_CSSPOINTEREVENTSAUTO
          PointerEvents.NONE ->
              IMPORTANT_FOR_INTERACTION_NO or IMPORTANT_FOR_INTERACTION_EXCLUDE_DESCENDANTS
          PointerEvents.BOX_ONLY ->
              IMPORTANT_FOR_INTERACTION_AUTO_CSSPOINTEREVENTSAUTO or
                  IMPORTANT_FOR_INTERACTION_EXCLUDE_DESCENDANTS
          PointerEvents.BOX_NONE -> IMPORTANT_FOR_INTERACTION_NO
        }
    view.setTag(R.id.important_for_interaction, value)
  }
}
