/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.app.Dialog
import android.content.Context
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import androidx.core.util.Supplier
import com.facebook.react.R
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager

internal class PausedInDebuggerOverlayDialogManager(
    private val contextSupplier: Supplier<Context?>,
) : PausedInDebuggerOverlayManager {
  private var pausedInDebuggerDialog: Dialog? = null

  override fun showPausedInDebuggerOverlay(
      message: String,
      listener: DevSupportManager.PausedInDebuggerOverlayCommandListener,
  ) {
    UiThreadUtil.runOnUiThread {
      pausedInDebuggerDialog?.dismiss()
      val context = contextSupplier.get() ?: return@runOnUiThread

      val dialogView: View =
          LayoutInflater.from(context).inflate(R.layout.paused_in_debugger_view, null)
      dialogView.findViewById<View>(R.id.button).setOnClickListener { listener.onResume() }
      dialogView.findViewById<TextView>(R.id.button_text).text = message

      pausedInDebuggerDialog =
          Dialog(context, R.style.NoAnimationDialog).apply {
            setContentView(dialogView)
            setCancelable(false)
          }

      pausedInDebuggerDialog?.window?.let { dialogWindow ->
        val layoutParams: WindowManager.LayoutParams = dialogWindow.attributes
        layoutParams.dimAmount = 0.2f

        dialogWindow.attributes = layoutParams
        dialogWindow.addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND)
        dialogWindow.setGravity(Gravity.TOP)
        dialogWindow.setElevation(0f)
        dialogWindow.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        dialogWindow.setBackgroundDrawableResource(R.drawable.paused_in_debugger_background)
      }
      pausedInDebuggerDialog?.show()
    }
  }

  override fun hidePausedInDebuggerOverlay() {
    UiThreadUtil.runOnUiThread {
      pausedInDebuggerDialog?.dismiss()
      pausedInDebuggerDialog = null
    }
  }
}
