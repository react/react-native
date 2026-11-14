/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Context
import android.text.InputType
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.facebook.react.R
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers.getAdbReverseTcpCommand
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers.getDevServerNetworkIpAndPort

internal object ChangeBundleLocationDialog {
  internal fun interface ChangeBundleLocationDialogListener {
    fun onClick(newHostAndPort: String)
  }

  @SuppressLint("SetTextI18n")
  fun show(
      context: Context,
      devSettings: DeveloperSettings,
      onClickListener: ChangeBundleLocationDialogListener,
  ) {
    val settings = devSettings.packagerConnectionSettings
    val currentHost = settings.debugServerHost

    val layout = LinearLayout(context)
    layout.orientation = LinearLayout.VERTICAL
    val paddingSmall = (4 * context.resources.displayMetrics.density).toInt()
    val paddingLarge = (16 * context.resources.displayMetrics.density).toInt()
    layout.setPadding(paddingLarge, paddingLarge, paddingLarge, paddingLarge)

    val label = TextView(context)
    label.text = context.getString(R.string.catalyst_change_bundle_location_input_label)
    label.layoutParams =
        LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        )

    val input = EditText(context)
    // This makes it impossible to enter a newline in the input field
    input.inputType = InputType.TYPE_CLASS_TEXT
    input.hint = context.getString(R.string.catalyst_change_bundle_location_input_hint)
    input.setBackgroundResource(android.R.drawable.edit_text)
    input.setHintTextColor(-0x333334)
    input.setTextColor(-0x1000000)
    input.setText(currentHost)

    val currentHostSuggestion = Button(context)
    currentHostSuggestion.text = currentHost
    currentHostSuggestion.textSize = 12f
    currentHostSuggestion.isAllCaps = false
    currentHostSuggestion.setOnClickListener { input.setText(currentHost) }

    val networkHost = getDevServerNetworkIpAndPort(context)
    val networkHostSuggestion = Button(context)
    networkHostSuggestion.text = networkHost
    networkHostSuggestion.textSize = 12f
    networkHostSuggestion.isAllCaps = false
    networkHostSuggestion.setOnClickListener { input.setText(networkHost) }

    val suggestionRow = LinearLayout(context)
    suggestionRow.orientation = LinearLayout.HORIZONTAL
    suggestionRow.layoutParams =
        LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        )
    suggestionRow.addView(currentHostSuggestion)

    if (currentHost != networkHost) {
      // We don't want to display two buttons with the same host suggestion.
      suggestionRow.addView(networkHostSuggestion)
    }

    val instructions = TextView(context)
    instructions.text =
        context.getString(
            R.string.catalyst_change_bundle_location_instructions,
            getAdbReverseTcpCommand(context),
        )
    val instructionsParams =
        LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        )
    instructionsParams.setMargins(0, paddingSmall, 0, paddingLarge)
    instructions.layoutParams = instructionsParams

    val applyChangesButton = Button(context)
    applyChangesButton.text = context.getString(R.string.catalyst_change_bundle_location_apply)

    val cancelButton = Button(context)
    cancelButton.text = context.getString(R.string.catalyst_change_bundle_location_cancel)

    layout.addView(label)
    layout.addView(input)
    layout.addView(suggestionRow)
    layout.addView(instructions)
    layout.addView(applyChangesButton)
    layout.addView(cancelButton)

    val scrollView = ScrollView(context)
    scrollView.addView(layout)

    val dialog =
        AlertDialog.Builder(context)
            .setTitle(context.getString(R.string.catalyst_change_bundle_location))
            .setView(scrollView)
            .create()

    applyChangesButton.setOnClickListener {
      onClickListener.onClick(input.text.toString())
      dialog.dismiss()
    }
    cancelButton.setOnClickListener { dialog.dismiss() }
    dialog.show()
  }
}
