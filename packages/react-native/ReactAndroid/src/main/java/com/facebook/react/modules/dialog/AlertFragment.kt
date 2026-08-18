/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.dialog

import android.annotation.SuppressLint
import android.app.Dialog
import android.content.Context
import android.content.DialogInterface
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.fragment.app.DialogFragment
import com.facebook.infer.annotation.Assertions
import com.facebook.react.R
import com.facebook.react.modules.dialog.DialogModule.AlertFragmentListener

/** A fragment used to display the dialog. */
@SuppressLint("fragment_subclass_nonempty_constructor")
public class AlertFragment : DialogFragment, DialogInterface.OnClickListener {

  private val listener: AlertFragmentListener?

  public constructor() {
    listener = null
  }

  @SuppressLint("ValidFragment")
  internal constructor(listener: AlertFragmentListener?, arguments: Bundle?) {
    this.listener = listener
    setArguments(arguments)
  }

  override fun onCreateDialog(savedInstanceState: Bundle?): Dialog =
      createDialog(requireActivity(), requireArguments(), this)

  override fun onClick(dialog: DialogInterface, which: Int) {
    listener?.onClick(dialog, which)
  }

  override fun onDismiss(dialog: DialogInterface) {
    super.onDismiss(dialog)
    listener?.onDismiss(dialog)
  }

  public companion object {
    internal const val ARG_TITLE: String = "title"
    internal const val ARG_MESSAGE: String = "message"
    internal const val ARG_BUTTON_POSITIVE: String = "button_positive"
    internal const val ARG_BUTTON_NEGATIVE: String = "button_negative"
    internal const val ARG_BUTTON_NEUTRAL: String = "button_neutral"
    internal const val ARG_ITEMS: String = "items"

    @JvmStatic
    @Suppress("DEPRECATION")
    public fun createDialog(
        activityContext: Context,
        arguments: Bundle,
        fragment: DialogInterface.OnClickListener,
    ): Dialog =
        if (isAppCompatTheme(activityContext)) {
          createAppCompatDialog(activityContext, arguments, fragment)
        } else {
          createAppDialog(activityContext, arguments, fragment)
        }

    /**
     * Checks if the current activity is a descendant of an AppCompat theme. This check is required
     * to safely display an AppCompat dialog. If the current activity is not a descendant of an
     * AppCompat theme and we attempt to render an AppCompat dialog, this will cause a crash.
     *
     * @returns true if the current activity is a descendant of an AppCompat theme.
     */
    private fun isAppCompatTheme(activityContext: Context): Boolean {
      val attributes =
          activityContext.obtainStyledAttributes(androidx.appcompat.R.styleable.AppCompatTheme)
      val isAppCompat =
          attributes.hasValue(androidx.appcompat.R.styleable.AppCompatTheme_windowActionBar)
      attributes.recycle()
      return isAppCompat
    }

    /**
     * Creates a custom dialog title View that has the role of "Heading" and focusable for
     * accessibility purposes.
     *
     * @returns accessible TextView title
     */
    private fun getAccessibleTitle(activityContext: Context, titleText: String): View {
      val inflater = LayoutInflater.from(activityContext)

      // This layout matches the sizing and styling of AlertDialog's title_template (minus the icon)
      // since the whole thing gets tossed out when setting a custom title
      val titleContainer: View = inflater.inflate(R.layout.alert_title_layout, null)

      val accessibleTitle: TextView =
          Assertions.assertNotNull<TextView>(
              titleContainer.findViewById<TextView>(R.id.alert_title),
          )
      accessibleTitle.text = titleText
      accessibleTitle.isFocusable = true

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        accessibleTitle.isAccessibilityHeading = true
      } else {
        ViewCompat.setAccessibilityDelegate(
            accessibleTitle,
            object : AccessibilityDelegateCompat() {
              override fun onInitializeAccessibilityNodeInfo(
                  view: View,
                  info: AccessibilityNodeInfoCompat,
              ) {
                super.onInitializeAccessibilityNodeInfo(accessibleTitle, info)
                info.isHeading = true
              }
            },
        )
      }

      return titleContainer
    }

    /**
     * Creates a dialog compatible only with AppCompat activities. This function should be kept in
     * sync with [createAppDialog].
     */
    private fun createAppCompatDialog(
        activityContext: Context,
        arguments: Bundle,
        fragment: DialogInterface.OnClickListener,
    ): Dialog {
      val builder = AlertDialog.Builder(activityContext)

      if (arguments.containsKey(ARG_TITLE)) {
        val title = Assertions.assertNotNull<String>(arguments.getString(ARG_TITLE))
        val accessibleTitle = getAccessibleTitle(activityContext, title)
        builder.setCustomTitle(accessibleTitle)
      }
      if (arguments.containsKey(ARG_BUTTON_POSITIVE)) {
        builder.setPositiveButton(arguments.getString(ARG_BUTTON_POSITIVE), fragment)
      }
      if (arguments.containsKey(ARG_BUTTON_NEGATIVE)) {
        builder.setNegativeButton(arguments.getString(ARG_BUTTON_NEGATIVE), fragment)
      }
      if (arguments.containsKey(ARG_BUTTON_NEUTRAL)) {
        builder.setNeutralButton(arguments.getString(ARG_BUTTON_NEUTRAL), fragment)
      }
      // if both message and items are set, Android will only show the message
      // and ignore the items argument entirely
      if (arguments.containsKey(ARG_MESSAGE)) {
        builder.setMessage(arguments.getString(ARG_MESSAGE))
      }
      if (arguments.containsKey(ARG_ITEMS)) {
        builder.setItems(arguments.getCharSequenceArray(ARG_ITEMS), fragment)
      }

      return builder.create()
    }

    /**
     * Creates a dialog compatible with non-AppCompat activities. This function should be kept in
     * sync with [createAppCompatDialog].
     */
    @Deprecated(
        "non-AppCompat dialogs are deprecated and will be removed in a future version.",
        replaceWith = ReplaceWith("createAppCompatDialog(activityContext, arguments, fragment)"),
    )
    private fun createAppDialog(
        activityContext: Context,
        arguments: Bundle,
        fragment: DialogInterface.OnClickListener,
    ): Dialog {
      val builder = android.app.AlertDialog.Builder(activityContext)

      if (arguments.containsKey(ARG_TITLE)) {
        val title = Assertions.assertNotNull<String>(arguments.getString(ARG_TITLE))
        val accessibleTitle = getAccessibleTitle(activityContext, title)
        builder.setCustomTitle(accessibleTitle)
      }
      if (arguments.containsKey(ARG_BUTTON_POSITIVE)) {
        builder.setPositiveButton(arguments.getString(ARG_BUTTON_POSITIVE), fragment)
      }
      if (arguments.containsKey(ARG_BUTTON_NEGATIVE)) {
        builder.setNegativeButton(arguments.getString(ARG_BUTTON_NEGATIVE), fragment)
      }
      if (arguments.containsKey(ARG_BUTTON_NEUTRAL)) {
        builder.setNeutralButton(arguments.getString(ARG_BUTTON_NEUTRAL), fragment)
      }
      // if both message and items are set, Android will only show the message
      // and ignore the items argument entirely
      if (arguments.containsKey(ARG_MESSAGE)) {
        builder.setMessage(arguments.getString(ARG_MESSAGE))
      }
      if (arguments.containsKey(ARG_ITEMS)) {
        builder.setItems(arguments.getCharSequenceArray(ARG_ITEMS), fragment)
      }

      return builder.create()
    }
  }
}
