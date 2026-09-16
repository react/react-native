/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.appstate

import com.facebook.fbreact.specs.NativeAppStateSpec
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WindowFocusChangeListener
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.LifecycleState
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = NativeAppStateSpec.NAME)
internal class AppStateModule(reactContext: ReactApplicationContext) :
    NativeAppStateSpec(reactContext), LifecycleEventListener, WindowFocusChangeListener {

  private var appState: String

  init {
    reactContext.addLifecycleEventListener(this)
    reactContext.addWindowFocusChangeListener(this)
    appState =
        if (reactContext.lifecycleState === LifecycleState.RESUMED) APP_STATE_ACTIVE
        else APP_STATE_BACKGROUND
  }

  @Suppress("REDUNDANT_VISIBILITY_MODIFIER")
  public override fun getTypedExportedConstants(): Map<String, Any> =
      mapOf(INITIAL_STATE to appState)

  override fun getCurrentAppState(success: Callback, error: Callback?) {
    success.invoke(createAppStateEventMap())
  }

  override fun onHostResume() {
    appState = APP_STATE_ACTIVE
    sendAppStateChangeEvent()
  }

  override fun onHostPause() {
    appState = APP_STATE_BACKGROUND
    sendAppStateChangeEvent()
  }

  override fun onHostDestroy() {
    // do not set state to destroyed, do not send an event. By the current implementation, the
    // catalyst instance is going to be immediately dropped, and all JS calls with it.
  }

  override fun onWindowFocusChange(hasFocus: Boolean) {
    sendEvent("appStateFocusChange", hasFocus)
  }

  private fun createAppStateEventMap(): WritableMap =
      Arguments.createMap().apply { putString("app_state", appState) }

  private fun sendEvent(eventName: String, data: Any?) {
    val reactApplicationContext = reactApplicationContext ?: return
    // We don't gain anything interesting from logging here, and it's an extremely common
    // race condition for an AppState event to be triggered as the Catalyst instance is being
    // set up or torn down. So, just fail silently here.
    if (!reactApplicationContext.hasActiveReactInstance()) {
      return
    }
    reactApplicationContext.emitDeviceEvent(eventName, data)
  }

  private fun sendAppStateChangeEvent() {
    sendEvent("appStateDidChange", createAppStateEventMap())
  }

  override fun addListener(eventName: String?) {
    // iOS only
  }

  override fun removeListeners(count: Double) {
    // iOS only
  }

  override fun invalidate() {
    super.invalidate()
    reactApplicationContext.removeLifecycleEventListener(this)
  }

  companion object {
    const val NAME: String = NativeAppStateSpec.NAME
    const val APP_STATE_ACTIVE: String = "active"
    const val APP_STATE_BACKGROUND: String = "background"
    private const val INITIAL_STATE: String = "initialAppState"
  }
}
