/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.virtual

import android.graphics.Rect

internal fun interface VirtualViewModeChangeEmitter {
  fun emitModeChange(
      mode: VirtualViewMode,
      targetRect: Rect,
      thresholdRect: Rect,
      synchronous: Boolean,
  )
}
