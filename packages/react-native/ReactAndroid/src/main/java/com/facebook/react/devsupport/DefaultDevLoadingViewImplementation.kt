/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.graphics.Color
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import java.util.Locale

/**
 * Default implementation of Dev Loading View Manager to display loading messages in a capsule at
 * the top of the screen. All methods are thread safe.
 */
public class DefaultDevLoadingViewImplementation(
    reactInstanceDevHelper: ReactInstanceDevHelper,
) : DevLoadingViewManager {
  private val banner = DevBanner(reactInstanceDevHelper)

  override fun showMessage(message: String) {
    showMessage(message, color = null, backgroundColor = null, dismissButton = false)
  }

  override fun showMessage(
      message: String,
      color: Double?,
      backgroundColor: Double?,
      dismissButton: Boolean?,
  ) {
    if (!isEnabled) {
      return
    }
    UiThreadUtil.runOnUiThread {
      banner.show(
          message,
          color?.toInt() ?: Color.WHITE,
          backgroundColor?.toInt() ?: Color.rgb(64, 64, 64), // Default grey
          dismissButton ?: false,
      )
    }
  }

  override fun updateProgress(status: String?, done: Int?, total: Int?, percent: Int?) {
    if (!isEnabled) {
      return
    }
    UiThreadUtil.runOnUiThread {
      val percentage =
          if (percent != null) String.format(Locale.getDefault(), " %d%%", percent)
          else if (done != null && total != null && total > 0)
              String.format(Locale.getDefault(), " %.1f%%", done.toFloat() / total * 100)
          else ""
      banner.updateMessage("${status ?: "Loading"}${percentage}…") // `...` character at the end
    }
  }

  public override fun hide() {
    if (isEnabled) {
      UiThreadUtil.runOnUiThread { banner.hide() }
    }
  }

  public companion object {
    private var isEnabled = true

    public fun setDevLoadingEnabled(enabled: Boolean) {
      isEnabled = enabled
    }
  }
}
