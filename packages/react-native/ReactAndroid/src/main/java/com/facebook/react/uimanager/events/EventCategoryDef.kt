/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import androidx.annotation.IntDef

/**
 * Kotlin/Java specific declaration of the `RawEvent::Category` enum. Keep in sync with
 * `renderer/core/RawEvent.h`.
 */
@IntDef(
    value =
        [
            EventCategoryDef.CONTINUOUS_START,
            EventCategoryDef.CONTINUOUS_END,
            EventCategoryDef.UNSPECIFIED,
            EventCategoryDef.DISCRETE,
            EventCategoryDef.CONTINUOUS,
        ],
)
@Retention(AnnotationRetention.SOURCE)
internal annotation class EventCategoryDef {
  companion object {
    /** Start of a continuous event. To be used with touchStart. */
    const val CONTINUOUS_START: Int = 0

    /** End of a continuous event. To be used with touchEnd. */
    const val CONTINUOUS_END: Int = 1

    /**
     * Priority for this event will be determined from other events in the queue. If it is triggered
     * by continuous event, its priority will be default. If it is not triggered by continuous
     * event, its priority will be discrete.
     */
    const val UNSPECIFIED: Int = 2

    /** Forces discrete type for the event. Regardless if continuous event is ongoing. */
    const val DISCRETE: Int = 3

    /** Forces continuous type for the event. Regardless if continuous event isn't ongoing. */
    const val CONTINUOUS: Int = 4
  }
}
