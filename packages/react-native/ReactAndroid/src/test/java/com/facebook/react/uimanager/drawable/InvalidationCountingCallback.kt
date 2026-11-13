/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.graphics.drawable.Drawable

internal class InvalidationCountingCallback : Drawable.Callback {
  var invalidations = 0
    private set

  override fun invalidateDrawable(who: Drawable) {
    invalidations++
  }

  override fun scheduleDrawable(who: Drawable, what: Runnable, `when`: Long) = Unit

  override fun unscheduleDrawable(who: Drawable, what: Runnable) = Unit
}
