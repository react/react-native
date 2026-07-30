/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.intent

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.nfc.NfcAdapter
import android.provider.Settings
import com.facebook.fbreact.specs.NativeIntentAndroidSpec
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.module.annotations.ReactModule
import java.util.ArrayList

/** Intent module. Launch other activities or open URLs. */
@ReactModule(name = NativeIntentAndroidSpec.NAME)
public open class IntentModule(reactContext: ReactApplicationContext) :
    NativeIntentAndroidSpec(reactContext) {

  private var initialURLListener: LifecycleEventListener? = null
  private val pendingOpenURLPromises: MutableList<Promise> = ArrayList<Promise>()

  override fun invalidate() {
    synchronized(this) {
      pendingOpenURLPromises.clear()
      initialURLListener
          ?.let { listener -> reactApplicationContext.removeLifecycleEventListener(listener) }
          .also { initialURLListener = null }
    }
    super.invalidate()
  }

  /**
   * Return the URL the activity was started with
   *
   * @param promise a promise which is resolved with the initial URL
   */
  override fun getInitialURL(promise: Promise) {
    try {
      val currentActivity = reactApplicationContext.getCurrentActivity()
      if (currentActivity == null) {
        waitForActivityAndGetInitialURL(promise)
        return
      }

      val intent = currentActivity.intent
      val action = intent.action
      val uri = intent.data

      val initialURL =
          if (
              uri != null &&
                  (Intent.ACTION_VIEW == action || NfcAdapter.ACTION_NDEF_DISCOVERED == action)
          ) {
            uri.toString()
          } else {
            null
          }

      promise.resolve(initialURL)
    } catch (e: Exception) {
      promise.reject(
          JSApplicationIllegalArgumentException("Could not get the initial URL : ${e.message}")
      )
    }
  }

  @Synchronized
  private fun waitForActivityAndGetInitialURL(promise: Promise) {
    pendingOpenURLPromises.add(promise)
    if (initialURLListener != null) {
      return
    }

    initialURLListener =
        object : LifecycleEventListener {
          override fun onHostResume() {
            reactApplicationContext.removeLifecycleEventListener(this)
            synchronized(this@IntentModule) {
              // getInitialURL can re-enter and re-add to pendingOpenURLPromises when the activity
              // is still null at resume, so drain a snapshot (after clearing the list and listener)
              // to avoid mutating the list being iterated (ConcurrentModificationException).
              val pendingPromises = ArrayList(pendingOpenURLPromises)
              pendingOpenURLPromises.clear()
              initialURLListener = null
              for (pendingPromise in pendingPromises) {
                getInitialURL(pendingPromise)
              }
            }
          }

          override fun onHostPause() = Unit

          override fun onHostDestroy() = Unit
        }
    reactApplicationContext.addLifecycleEventListener(initialURLListener)
  }

  /**
   * Starts a corresponding external activity for the given URL.
   *
   * For example, if the URL is "https://www.facebook.com", the system browser will be opened, or
   * the "choose application" dialog will be shown.
   *
   * @param url the URL to open
   */
  override fun openURL(url: String?, promise: Promise) {
    if (url.isNullOrEmpty()) {
      promise.reject(JSApplicationIllegalArgumentException("Invalid URL: $url"))
      return
    }

    try {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url).normalizeScheme())
      sendOSIntent(intent, false)

      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject(
          JSApplicationIllegalArgumentException("Could not open URL '${url}': ${e.message}")
      )
    }
  }

  /**
   * Determine whether or not an installed app can handle a given URL.
   *
   * @param url the URL to open
   * @param promise a promise that is always resolved with a boolean argument
   */
  override fun canOpenURL(url: String?, promise: Promise) {
    if (url.isNullOrEmpty()) {
      promise.reject(JSApplicationIllegalArgumentException("Invalid URL: $url"))
      return
    }

    try {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
      // We need Intent.FLAG_ACTIVITY_NEW_TASK since getReactApplicationContext() returns
      // the ApplicationContext instead of the Activity context.
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      val packageManager = reactApplicationContext.packageManager
      val canOpen = packageManager != null && intent.resolveActivity(packageManager) != null
      promise.resolve(canOpen)
    } catch (e: Exception) {
      promise.reject(
          JSApplicationIllegalArgumentException(
              "Could not check if URL '${url}' can be opened: ${e.message}"
          )
      )
    }
  }

  /**
   * Starts an external activity to open app's settings into Android Settings
   *
   * @param promise a promise which is resolved when the Settings is opened
   */
  override fun openSettings(promise: Promise) {
    try {
      val intent = Intent()
      val currentActivity: Activity = checkNotNull(reactApplicationContext.getCurrentActivity())
      val selfPackageName = reactApplicationContext.packageName

      intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
      intent.addCategory(Intent.CATEGORY_DEFAULT)
      intent.setData(Uri.parse("package:$selfPackageName"))
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY)
      intent.addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS)
      currentActivity.startActivity(intent)

      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject(
          JSApplicationIllegalArgumentException("Could not open the Settings: ${e.message}")
      )
    }
  }

  /**
   * Allows to send intents on Android
   *
   * For example, you can open the Notification Category screen for a specific application passing
   * action = 'android.settings.CHANNEL_NOTIFICATION_SETTINGS' and extras =
   * [ { 'android.provider.extra.APP_PACKAGE': 'your.package.name.here' }, { 'android.provider.extra.CHANNEL_ID': 'your.channel.id.here } ]
   *
   * @param action The general action to be performed
   * @param extras An array of extras [{ String, String | Number | Boolean }]
   */
  override fun sendIntent(action: String?, extras: ReadableArray?, promise: Promise) {
    if (action.isNullOrEmpty()) {
      promise.reject(JSApplicationIllegalArgumentException("Invalid Action: $action."))
      return
    }

    val intent = Intent(action)

    val packageManager = reactApplicationContext.packageManager
    if (packageManager == null || intent.resolveActivity(packageManager) == null) {
      promise.reject(
          JSApplicationIllegalArgumentException("Could not launch Intent with action $action.")
      )
      return
    }

    try {
      if (extras != null) {
        for (i in 0..<extras.size()) {
          val map = extras.getMap(i) ?: continue
          val name = map.getString("key")
          val type = map.getType(EXTRA_MAP_KEY_FOR_VALUE)

          when (type) {
            ReadableType.String -> {
              intent.putExtra(name, map.getString(EXTRA_MAP_KEY_FOR_VALUE))
            }
            ReadableType.Number -> {
              // We cannot know from JS if is an Integer or Double
              // See: https://github.com/facebook/react-native/issues/4141
              // We might need to find a workaround if this is really an issue
              val number = map.getDouble(EXTRA_MAP_KEY_FOR_VALUE)
              intent.putExtra(name, number)
            }
            ReadableType.Boolean -> {
              intent.putExtra(name, map.getBoolean(EXTRA_MAP_KEY_FOR_VALUE))
            }
            else -> {
              promise.reject(
                  JSApplicationIllegalArgumentException("Extra type for $name not supported.")
              )
              return
            }
          }
        }
      }

      sendOSIntent(intent, true)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  private fun sendOSIntent(intent: Intent, useNewTaskFlag: Boolean) {
    val currentActivity = reactApplicationContext.getCurrentActivity()

    val selfPackageName = reactApplicationContext.packageName
    val packageManager = reactApplicationContext.packageManager
    val componentName =
        if (packageManager == null) {
          intent.component
        } else {
          intent.resolveActivity(packageManager)
        }
    val otherPackageName = componentName?.packageName ?: ""

    // If there is no currentActivity or we are launching to a different package we need to set
    // the FLAG_ACTIVITY_NEW_TASK flag
    if (useNewTaskFlag || currentActivity == null || (selfPackageName != otherPackageName)) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    if (currentActivity != null) {
      currentActivity.startActivity(intent)
    } else {
      reactApplicationContext.startActivity(intent)
    }
  }

  public companion object {
    private const val EXTRA_MAP_KEY_FOR_VALUE = "value"
    public const val NAME: String = NativeIntentAndroidSpec.NAME
  }
}
