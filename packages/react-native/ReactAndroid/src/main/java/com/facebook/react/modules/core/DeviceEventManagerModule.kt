/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import android.net.Uri
import com.facebook.fbreact.specs.NativeDeviceEventManagerSpec
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.buildReadableMap
import com.facebook.react.module.annotations.ReactModule

/** Native module that handles device hardware events like hardware back presses. */
@ReactModule(name = NativeDeviceEventManagerSpec.NAME)
public open class DeviceEventManagerModule(
  reactContext: ReactApplicationContext?,
  backBtnHandler: DefaultHardwareBackBtnHandler?,
) : NativeDeviceEventManagerSpec(reactContext), LifecycleEventListener {
  @Volatile private var ownershipInvalidated = false
  private val ownershipToken = Any()
  private var coordinator: com.facebook.react.BackNavigationCoordinator? = null
  private var nativeNavigationEnabled = false
  private var hasJavaScriptHandlers = false

  init {
    reactContext?.addLifecycleEventListener(this)
  }

  private fun updateBackOwnership() {
    if (ownershipInvalidated) return
    val next =
      (reactApplicationContext.currentActivity as? ReactActivity)?.backNavigationCoordinator
    if (coordinator !== next) coordinator?.release(ownershipToken)
    coordinator = next
    next?.update(ownershipToken, nativeNavigationEnabled, hasJavaScriptHandlers)
  }

  override fun setNativeNavigationEnabled(enabled: Boolean, hasHandlers: Boolean) {
    reactApplicationContext.runOnUiQueueThread {
      if (ownershipInvalidated) return@runOnUiQueueThread
      nativeNavigationEnabled = enabled
      hasJavaScriptHandlers = hasHandlers
      updateBackOwnership()
    }
  }

  override fun onHostResume() {
    updateBackOwnership()
  }

  override fun onHostPause(): Unit = Unit

  override fun onHostDestroy() {
    coordinator?.release(ownershipToken)
    coordinator = null
  }

  override fun invalidate() {
    ownershipInvalidated = true
    reactApplicationContext.removeLifecycleEventListener(this)
    reactApplicationContext.runOnUiQueueThread {
      coordinator?.release(ownershipToken)
      coordinator = null
    }
    super.invalidate()
  }

  @DoNotStripAny
  public fun interface RCTDeviceEventEmitter : JavaScriptModule {
    public fun emit(eventName: String, data: Any?)
  }

  private val invokeDefaultBackPressRunnable: Runnable = Runnable {
    UiThreadUtil.assertOnUiThread()
    backBtnHandler?.invokeDefaultOnBackPressed()
  }

  /** Sends an event to the JS instance that the hardware back has been pressed. */
  public open fun emitHardwareBackPressed() {
    val reactApplicationContext: ReactApplicationContext? =
      getReactApplicationContextIfActiveOrWarn()
    val map = buildReadableMap { put("timeStamp", System.nanoTime() / 1_000_000.0) }
    reactApplicationContext?.emitDeviceEvent("hardwareBackPress", map)
  }

  /** Sends an event to the JS instance that a new intent was received. */
  public open fun emitNewIntentReceived(uri: Uri) {
    val reactApplicationContext: ReactApplicationContext? =
      getReactApplicationContextIfActiveOrWarn()
    val map = buildReadableMap { put("url", uri.toString()) }
    reactApplicationContext?.emitDeviceEvent("url", map)
  }

  /**
   * Invokes the default back handler for the host of this catalyst instance. This should be invoked
   * if JS does not want to handle the back press itself.
   */
  override fun invokeDefaultBackPressHandler() {
    // There should be no need to check if the catalyst instance is alive. After initialization
    // the thread instances cannot be null, and scheduling on a thread after ReactApplicationContext
    // teardown is a noop.
    reactApplicationContext.runOnUiQueueThread(invokeDefaultBackPressRunnable)
  }

  public companion object {
    public const val NAME: String = NativeDeviceEventManagerSpec.NAME
  }
}
