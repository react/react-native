/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.uimanager

import android.app.Activity
import android.content.Context
import android.view.Window
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.bridge.ScrollEndedListeners
import com.facebook.react.bridge.UIManager
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.interfaces.ExtraWindowEventListener
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder

/**
 * Wraps [ReactContext] with the base [Context] passed into the constructor. It provides also a way
 * to start activities using the viewContext to which RN native views belong. It delegates lifecycle
 * listener registration to the original instance of [ReactContext] which is supposed to receive the
 * lifecycle events. At the same time we disallow receiving lifecycle events for this wrapper
 * instances. TODO: T7538544 Rename ThemedReactContext to be in alignment with name of
 * ReactApplicationContext
 *
 * @property moduleName A [String] that represents the module name of the js application that is
 *   being rendered with this [ThemedReactContext]
 */
public class ThemedReactContext(
    public val reactApplicationContext: ReactApplicationContext,
    base: Context,
    public val moduleName: String?,
    public val surfaceId: Int,
) : ReactContext(base) {

  @Deprecated("This constructor is deprecated and you should not be using it.")
  public constructor(
      reactApplicationContext: ReactApplicationContext,
      base: Context,
      moduleName: String? = null,
  ) : this(reactApplicationContext, base, moduleName, -1)

  @Deprecated("This constructor is deprecated and you should not be using it.")
  public constructor(
      reactApplicationContext: ReactApplicationContext,
      base: Context,
  ) : this(reactApplicationContext, base, null, -1)

  init {
    initializeFromOther(reactApplicationContext)
  }

  override fun addLifecycleEventListener(listener: LifecycleEventListener) {
    reactApplicationContext.addLifecycleEventListener(listener)
  }

  override fun removeLifecycleEventListener(listener: LifecycleEventListener) {
    reactApplicationContext.removeLifecycleEventListener(listener)
  }

  override fun addExtraWindowEventListener(listener: ExtraWindowEventListener) {
    reactApplicationContext.addExtraWindowEventListener(listener)
  }

  override fun removeExtraWindowEventListener(listener: ExtraWindowEventListener) {
    reactApplicationContext.removeExtraWindowEventListener(listener)
  }

  override fun onExtraWindowCreate(window: Window) {
    reactApplicationContext.onExtraWindowCreate(window)
  }

  override fun onExtraWindowDestroy(window: Window) {
    reactApplicationContext.onExtraWindowDestroy(window)
  }

  override fun hasCurrentActivity(): Boolean = reactApplicationContext.hasCurrentActivity()

  override fun getCurrentActivity(): Activity? = reactApplicationContext.getCurrentActivity()

  override fun <T : JavaScriptModule> getJSModule(jsInterface: Class<T>): T =
      reactApplicationContext.getJSModule<T>(jsInterface)

  override fun <T : NativeModule> hasNativeModule(nativeModuleInterface: Class<T>): Boolean =
      reactApplicationContext.hasNativeModule<T>(nativeModuleInterface)

  override fun getNativeModules(): MutableCollection<NativeModule?>? =
      reactApplicationContext.getNativeModules()

  override fun <T : NativeModule> getNativeModule(nativeModuleInterface: Class<T>): T? =
      reactApplicationContext.getNativeModule<T>(nativeModuleInterface)

  override fun getNativeModule(moduleName: String): NativeModule? =
      reactApplicationContext.getNativeModule(moduleName)

  @Deprecated(
      "This method is deprecated and will be removed once the Legacy Architecture is removed"
  )
  @LegacyArchitecture
  override fun getCatalystInstance(): CatalystInstance? =
      reactApplicationContext.getCatalystInstance()

  @Deprecated(
      "This API has been deprecated due to naming consideration, please use hasActiveReactInstance() instead",
      ReplaceWith("hasActiveReactInstance()"),
  )
  @LegacyArchitecture
  override fun hasActiveCatalystInstance(): Boolean =
      reactApplicationContext.hasActiveCatalystInstance()

  override fun hasActiveReactInstance(): Boolean =
      reactApplicationContext.hasActiveCatalystInstance()

  @Deprecated(
      "This API has been deprecated due to naming consideration, please use hasReactInstance() instead",
      ReplaceWith("hasReactInstance()"),
  )
  @LegacyArchitecture
  override fun hasCatalystInstance(): Boolean = reactApplicationContext.hasCatalystInstance()

  override fun hasReactInstance(): Boolean = reactApplicationContext.hasReactInstance()

  override fun destroy() {
    reactApplicationContext.destroy()
  }

  /**
   * This is misnamed but has some uses out in the wild. It will be deleted in a future release of
   * RN.
   *
   * @return a [String] that represents the module name of the js application that is being rendered
   *   with this [ThemedReactContext]
   */
  @Deprecated(
      "Do not depend on this method. It will be removed in a future release of React Native."
  )
  public fun getSurfaceID(): String? = moduleName

  override fun handleException(e: Exception?) {
    reactApplicationContext.handleException(e)
  }

  @Deprecated(
      "You should not invoke isBridgeless and let your code depend on this check. This function will be removed in the future."
  )
  override fun isBridgeless(): Boolean = reactApplicationContext.isBridgeless()

  override fun getJavaScriptContextHolder(): JavaScriptContextHolder? =
      reactApplicationContext.getJavaScriptContextHolder()

  override fun getJSCallInvokerHolder(): CallInvokerHolder? =
      reactApplicationContext.getJSCallInvokerHolder()

  override fun getRuntimeExecutor(): RuntimeExecutor? = reactApplicationContext.runtimeExecutor

  @Deprecated(
      "This method is deprecated, please use UIManagerHelper.getUIManager() instead.",
      ReplaceWith("UIManagerHelper.getUIManager()"),
  )
  override fun getFabricUIManager(): UIManager? = reactApplicationContext.getFabricUIManager()

  override fun getSourceURL(): String? = reactApplicationContext.getSourceURL()

  override fun registerSegment(segmentId: Int, path: String?, callback: Callback?) {
    reactApplicationContext.registerSegment(segmentId, path, callback)
  }

  override fun getScrollEndedListeners(): ScrollEndedListeners =
      reactApplicationContext.scrollEndedListeners
}
