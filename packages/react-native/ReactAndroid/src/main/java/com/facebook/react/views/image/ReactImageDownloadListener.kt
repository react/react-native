/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import android.graphics.Color
import android.graphics.drawable.Animatable
import android.graphics.drawable.ColorDrawable
import com.facebook.drawee.controller.ControllerListener
import com.facebook.drawee.drawable.ForwardingDrawable

// The wrapped drawable has to be one that Fresco knows how to round (a ColorDrawable here), because
// the hierarchy applies the rounding params to the leaf of the progress bar drawable.
internal open class ReactImageDownloadListener<INFO> :
    ForwardingDrawable(ColorDrawable(Color.TRANSPARENT)), ControllerListener<INFO> {
  open fun onProgressChange(loaded: Int, total: Int) = Unit

  override fun onLevelChange(level: Int): Boolean {
    onProgressChange(level, MAX_LEVEL)
    return super.onLevelChange(level)
  }

  override fun onSubmit(id: String, callerContext: Any?) = Unit

  override fun onFinalImageSet(id: String, imageInfo: INFO?, animatable: Animatable?) = Unit

  override fun onIntermediateImageSet(id: String, imageInfo: INFO?) = Unit

  override fun onIntermediateImageFailed(id: String, throwable: Throwable) = Unit

  override fun onFailure(id: String, throwable: Throwable) = Unit

  override fun onRelease(id: String) = Unit

  companion object {
    private const val MAX_LEVEL = 10000
  }
}
