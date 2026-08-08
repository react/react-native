/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.dialog

import android.content.DialogInterface
import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.FragmentManager
import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeDialogManagerAndroidSpec
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.SoftAssertions
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeDialogManagerAndroidSpec.NAME)
public class DialogModule(reactContext: ReactApplicationContext?) :
    NativeDialogManagerAndroidSpec(reactContext), LifecycleEventListener {

  private var isInForeground = false

  private inner class FragmentManagerHelper(private val fragmentManager: FragmentManager) {
    private var fragmentToShow: AlertFragment? = null

    fun showPendingAlert() {
      UiThreadUtil.assertOnUiThread()
      SoftAssertions.assertCondition(isInForeground, "showPendingAlert() called in background")
      val fragmentToShow = fragmentToShow ?: return
      dismissExisting()
      fragmentToShow.show(fragmentManager, FRAGMENT_TAG)
      this.fragmentToShow = null
    }

    fun dismissExisting() {
      if (!isInForeground) {
        return
      }
      val oldFragment = fragmentManager.findFragmentByTag(FRAGMENT_TAG) as AlertFragment?
      if (oldFragment?.isResumed == true) {
        oldFragment.dismiss()
      }
    }

    fun showNewAlert(arguments: Bundle, actionCallback: Callback?) {
      UiThreadUtil.assertOnUiThread()

      dismissExisting()

      val actionListener =
          if (actionCallback != null) AlertFragmentListener(actionCallback) else null

      val alertFragment = AlertFragment(actionListener, arguments)
      if (isInForeground && !fragmentManager.isStateSaved) {
        if (arguments.containsKey(KEY_CANCELABLE)) {
          alertFragment.isCancelable = arguments.getBoolean(KEY_CANCELABLE)
        }
        alertFragment.show(fragmentManager, FRAGMENT_TAG)
      } else {
        fragmentToShow = alertFragment
      }
    }
  }

  internal inner class AlertFragmentListener(private val callback: Callback) :
      DialogInterface.OnClickListener, DialogInterface.OnDismissListener {
    private var callbackConsumed = false

    override fun onClick(dialog: DialogInterface, which: Int) {
      if (!callbackConsumed) {
        if (reactApplicationContext.hasActiveReactInstance()) {
          callback.invoke(ACTION_BUTTON_CLICKED, which)
          callbackConsumed = true
        }
      }
    }

    override fun onDismiss(dialog: DialogInterface?) {
      if (!callbackConsumed) {
        if (reactApplicationContext.hasActiveReactInstance()) {
          callback.invoke(ACTION_DISMISSED)
          callbackConsumed = true
        }
      }
    }
  }

  public override fun getTypedExportedConstants(): Map<String, Any> = CONSTANTS

  override fun initialize() {
    reactApplicationContext.addLifecycleEventListener(this)
  }

  override fun onHostPause() {
    // Don't show the dialog if the host is paused.
    isInForeground = false
  }

  override fun onHostDestroy(): Unit = Unit

  override fun onHostResume() {
    isInForeground = true
    // Check if a dialog has been created while the host was paused, so that we can show it now.
    val fragmentManagerHelper = this.fragmentManagerHelper
    if (fragmentManagerHelper != null) {
      fragmentManagerHelper.showPendingAlert()
    } else {
      FLog.w(DialogModule::class.java, "onHostResume called but no FragmentManager found")
    }
  }

  override fun showAlert(options: ReadableMap, errorCallback: Callback, actionCallback: Callback) {
    val fragmentManagerHelper = this.fragmentManagerHelper
    if (fragmentManagerHelper == null) {
      errorCallback.invoke("Tried to show an alert while not attached to an Activity")
      return
    }

    val args = Bundle()
    if (options.hasKey(KEY_TITLE)) {
      args.putString(AlertFragment.ARG_TITLE, options.getString(KEY_TITLE))
    }
    if (options.hasKey(KEY_MESSAGE)) {
      args.putString(AlertFragment.ARG_MESSAGE, options.getString(KEY_MESSAGE))
    }
    if (options.hasKey(KEY_BUTTON_POSITIVE)) {
      args.putString(AlertFragment.ARG_BUTTON_POSITIVE, options.getString(KEY_BUTTON_POSITIVE))
    }
    if (options.hasKey(KEY_BUTTON_NEGATIVE)) {
      args.putString(AlertFragment.ARG_BUTTON_NEGATIVE, options.getString(KEY_BUTTON_NEGATIVE))
    }
    if (options.hasKey(KEY_BUTTON_NEUTRAL)) {
      args.putString(AlertFragment.ARG_BUTTON_NEUTRAL, options.getString(KEY_BUTTON_NEUTRAL))
    }
    if (options.hasKey(KEY_ITEMS)) {
      val items = checkNotNull(options.getArray(KEY_ITEMS))
      val itemsArray = arrayOfNulls<CharSequence>(items.size())
      for (i in 0..<items.size()) {
        itemsArray[i] = items.getString(i)
      }
      args.putCharSequenceArray(AlertFragment.ARG_ITEMS, itemsArray)
    }
    if (options.hasKey(KEY_CANCELABLE)) {
      args.putBoolean(KEY_CANCELABLE, options.getBoolean(KEY_CANCELABLE))
    }

    UiThreadUtil.runOnUiThread { fragmentManagerHelper.showNewAlert(args, actionCallback) }
  }

  private val fragmentManagerHelper: FragmentManagerHelper?
    /**
     * Creates a new helper to work with FragmentManager. Returns null if we're not attached to an
     * Activity.
     *
     * DO NOT HOLD LONG-LIVED REFERENCES TO THE OBJECT RETURNED BY THIS METHOD, AS THIS WILL CAUSE
     * MEMORY LEAKS.
     */
    get() {
      val activity = reactApplicationContext.currentActivity
      if (activity !is FragmentActivity) {
        return null
      }
      return FragmentManagerHelper(activity.supportFragmentManager)
    }

  override fun invalidate() {
    reactApplicationContext.removeLifecycleEventListener(this)
    super.invalidate()
  }

  public companion object {
    public const val NAME: String = NativeDialogManagerAndroidSpec.NAME

    @VisibleForTesting
    internal const val FRAGMENT_TAG: String = "com.facebook.catalyst.react.dialog.DialogModule"
    @VisibleForTesting internal const val ACTION_BUTTON_CLICKED: String = "buttonClicked"
    @VisibleForTesting internal const val ACTION_DISMISSED: String = "dismissed"
    private const val KEY_TITLE: String = "title"
    private const val KEY_MESSAGE: String = "message"
    private const val KEY_BUTTON_POSITIVE: String = "buttonPositive"
    private const val KEY_BUTTON_NEGATIVE: String = "buttonNegative"
    private const val KEY_BUTTON_NEUTRAL: String = "buttonNeutral"
    private const val KEY_ITEMS: String = "items"
    private const val KEY_CANCELABLE: String = "cancelable"

    private val CONSTANTS: Map<String, Any> =
        mapOf(
            ACTION_BUTTON_CLICKED to ACTION_BUTTON_CLICKED,
            ACTION_DISMISSED to ACTION_DISMISSED,
            KEY_BUTTON_POSITIVE to DialogInterface.BUTTON_POSITIVE,
            KEY_BUTTON_NEGATIVE to DialogInterface.BUTTON_NEGATIVE,
            KEY_BUTTON_NEUTRAL to DialogInterface.BUTTON_NEUTRAL,
        )
  }
}
