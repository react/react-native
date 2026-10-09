/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.content.res.Configuration
import android.graphics.Color
import android.text.Layout
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.AbsoluteSizeSpan
import android.text.style.AlignmentSpan
import android.text.style.ForegroundColorSpan
import android.text.style.StyleSpan
import android.view.View
import android.view.WindowManager
import com.facebook.react.R
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager

internal class DefaultPausedInDebuggerOverlayManager(
    reactInstanceDevHelper: ReactInstanceDevHelper,
) : PausedInDebuggerOverlayManager {
  // A dedicated banner, so the paused state neither replaces nor is replaced by the loading
  // messages.
  private val banner = PausedDevBanner(reactInstanceDevHelper)

  override fun showPausedInDebuggerOverlay(
      message: String,
      listener: DevSupportManager.PausedInDebuggerOverlayCommandListener,
  ) {
    UiThreadUtil.runOnUiThread {
      banner.onResume = { listener.onResume() }
      banner.show()
    }
  }

  override fun hidePausedInDebuggerOverlay() {
    UiThreadUtil.runOnUiThread { banner.hide() }
  }
}

/**
 * The paused-in-debugger state of the dev banner: a yellow capsule with a leading pause icon and a
 * "Tap to resume" line, over a dimmed app that takes no touches. It stays on top of any loading
 * banner, and a tap on it resumes.
 */
internal class PausedDevBanner(
    private val reactInstanceDevHelper: ReactInstanceDevHelper,
) : DevBanner(reactInstanceDevHelper) {
  var onResume: (() -> Unit)? = null

  fun show() {
    // The debugger frontend sends a generic message with each pause; the banner shows React
    // Native's own wording, which also tells someone who is not debugging what happened to the app.
    val nightMode =
        reactInstanceDevHelper.currentActivity
            ?.resources
            ?.configuration
            ?.uiMode
            ?.and(Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
    show(
        PAUSED_MESSAGE,
        Color.BLACK,
        if (nightMode) BACKGROUND_COLOR else BACKGROUND_COLOR_LIGHT,
        dismissButton = false,
    )
  }

  // Below the loading banners' windows, so they stay readable and tappable above the dimming while
  // the app is paused.
  override val windowLayoutType: Int = WindowManager.LayoutParams.TYPE_APPLICATION_PANEL

  override val dimsBackground: Boolean = true

  override val stackLevel: Int = 0

  override val minHeightDp: Float = MIN_HEIGHT_DP

  override val labelPaddingDp: LabelPadding =
      LabelPadding(top = 7f, start = (MIN_HEIGHT_DP - ICON_SIZE_DP) / 2, bottom = 7f, end = 19f)

  override val leadingIconRes: Int = R.drawable.ic_dev_loading_pause

  override val leadingIconSizeDp: Float = ICON_SIZE_DP

  override val messageGravity: Int = android.view.Gravity.START

  override fun formatMessage(pill: View, message: String, textColor: Int): CharSequence {
    val subtitle = pill.resources.getString(R.string.catalyst_paused_tap_to_resume)
    return SpannableStringBuilder(message).apply {
      val start = length + 1
      append("\n").append(subtitle)
      val flags = Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
      setSpan(AbsoluteSizeSpan(SUBTITLE_TEXT_SIZE_SP, true), start, length, flags)
      setSpan(StyleSpan(android.graphics.Typeface.NORMAL), start, length, flags)
      setSpan(ForegroundColorSpan(withAlpha(textColor, 0.6f)), start, length, flags)
      setSpan(AlignmentSpan.Standard(Layout.Alignment.ALIGN_CENTER), start, length, flags)
    }
  }

  override fun contentDescription(pill: View, message: String): CharSequence =
      "$message. ${pill.resources.getString(R.string.catalyst_paused_tap_to_resume)}."

  override fun onTap() {
    onResume?.invoke()
  }

  private companion object {
    private const val PAUSED_MESSAGE = "App paused in debugger"
    private const val MIN_HEIGHT_DP = 46f
    private const val ICON_SIZE_DP = 24f
    private const val SUBTITLE_TEXT_SIZE_SP = 10
    private val BACKGROUND_COLOR = Color.rgb(255, 236, 152)
    private val BACKGROUND_COLOR_LIGHT = Color.rgb(255, 240, 173)

    private fun withAlpha(color: Int, alpha: Float): Int =
        Color.argb((alpha * 255).toInt(), Color.red(color), Color.green(color), Color.blue(color))
  }
}
