/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.runtime

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.JavaScriptModuleRegistry
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactSoftExceptionLogger.logSoftException
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.bridge.UIManager
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.EventDispatcherProvider
import com.facebook.react.uimanager.events.RCTEventEmitter
import java.lang.IllegalArgumentException
import java.lang.reflect.InvocationHandler
import java.lang.reflect.Method
import java.lang.reflect.Proxy
import java.util.concurrent.atomic.AtomicReference

/**
 * This class is used instead of [ReactApplicationContext] when React Native is operating in
 * bridgeless mode. The purpose of this class is to override some methods on
 * [com.facebook.react.bridge.ReactContext] that use the [CatalystInstance], which doesn't exist in
 * bridgeless mode.
 */
internal class BridgelessReactContext(context: Context, private val reactHost: ReactHostImpl) :
    ReactApplicationContext(context), EventDispatcherProvider {
  private val sourceURLRef = AtomicReference<String>()
  private val TAG: String = this.javaClass.simpleName

  val devSupportManager: DevSupportManager
    get() = reactHost.devSupportManager

  val defaultHardwareBackBtnHandler: DefaultHardwareBackBtnHandler
    get() = reactHost.defaultBackButtonHandler

  init {
    if (
        !ReactBuildConfig.UNSTABLE_REMOVE_LEGACY_COMPONENT_INTEROP &&
            ReactNativeNewArchitectureFeatureFlags.useFabricInterop()
    ) {
      initializeInteropModules()
    }
  }

  override fun getEventDispatcher(): EventDispatcher = reactHost.eventDispatcher

  override fun getSourceURL(): String? = sourceURLRef.get()

  fun setSourceURL(sourceURL: String?) {
    sourceURLRef.set(sourceURL)
  }

  @Deprecated("This method is deprecated, please use UIManagerHelper.getUIManager() instead.")
  override fun getFabricUIManager(): UIManager? = reactHost.uiManager

  @OptIn(FrameworkAPI::class)
  @Deprecated(
      "This method is deprecated in the New Architecture. You should not be invoking directly as we're going to remove it in the future."
  )
  override fun getCatalystInstance(): CatalystInstance {
    if (ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      throw UnsupportedOperationException(
          "CatalystInstance is not supported when Bridgeless mode is enabled."
      )
    }
    Log.w(
        TAG,
        "[WARNING] Bridgeless doesn't support CatalystInstance. Accessing an API that's not part of" +
            " the new architecture is not encouraged usage.",
    )
    return BridgelessCatalystInstance(reactHost)
  }

  @Deprecated(
      "This API has been deprecated due to naming consideration, please use hasActiveReactInstance() instead"
  )
  override fun hasActiveCatalystInstance(): Boolean = hasActiveReactInstance()

  @Deprecated("DO NOT USE, this method will be removed in the near future.")
  override fun isBridgeless(): Boolean = true

  @Deprecated(
      "This API has been deprecated due to naming consideration, please use hasReactInstance() instead"
  )
  override fun hasCatalystInstance(): Boolean = false

  override fun hasActiveReactInstance(): Boolean = reactHost.isInstanceInitialized

  override fun hasReactInstance(): Boolean = reactHost.isInstanceInitialized

  override fun destroy() = Unit

  override fun registerSegment(segmentId: Int, path: String, callback: Callback) {
    reactHost.registerSegment(segmentId, path, callback)
  }

  private class BridgelessJSModuleInvocationHandler(
      private val reactHost: ReactHostImpl,
      private val jsModuleInterface: Class<out JavaScriptModule>,
  ) : InvocationHandler {
    override fun invoke(proxy: Any, method: Method, args: Array<Any?>?): Any? {
      val jsArgs = if (args != null) Arguments.fromJavaArgs(args) else null
      reactHost.callFunctionOnModule(
          JavaScriptModuleRegistry.getJSModuleName(jsModuleInterface),
          method.name,
          jsArgs,
      )
      return null
    }
  }

  override fun <T : JavaScriptModule> getJSModule(jsInterface: Class<T>): T? {
    mInteropModuleRegistry?.getInteropModule(jsInterface)?.let { interopModule ->
      if (jsInterface == RCTEventEmitter::class.java) {
        logSoftException(
            TAG,
            IllegalArgumentException(
                "getJSModule(RCTEventEmitter) is not recommended in the new architecture and will stop working with interop disabled. Please use UIManagerHelper.getEventDispatcher instead"
            ),
        )
      }
      return interopModule
    }

    // TODO T189052462: ReactContext caches JavaScriptModule instances
    val interfaceProxy: JavaScriptModule =
        Proxy.newProxyInstance(
            jsInterface.classLoader,
            arrayOf<Class<*>>(jsInterface),
            BridgelessJSModuleInvocationHandler(reactHost, jsInterface),
        ) as JavaScriptModule
    @Suppress("UNCHECKED_CAST", "KotlinGenericsCast")
    return interfaceProxy as? T
  }

  /** Shortcut RCTDeviceEventEmitter.emit since it's frequently used */
  override fun emitDeviceEvent(eventName: String, args: Any?) {
    reactHost.callFunctionOnModule(
        "RCTDeviceEventEmitter",
        "emit",
        Arguments.fromJavaArgs(arrayOf(eventName, args)),
    )
  }

  override fun <T : NativeModule> hasNativeModule(nativeModuleInterface: Class<T>): Boolean =
      reactHost.hasNativeModule(nativeModuleInterface)

  override fun getNativeModules(): Collection<NativeModule> = reactHost.nativeModules

  override fun <T : NativeModule> getNativeModule(nativeModuleInterface: Class<T>): T? =
      reactHost.getNativeModule(nativeModuleInterface)

  override fun getNativeModule(name: String): NativeModule? = reactHost.getNativeModule(name)

  @UnstableReactNativeAPI
  @FrameworkAPI
  override fun getJavaScriptContextHolder(): JavaScriptContextHolder? =
      reactHost.javaScriptContextHolder

  override fun handleException(e: Exception) {
    reactHost.handleHostException(e)
  }

  override fun getJSCallInvokerHolder(): CallInvokerHolder? = reactHost.jsCallInvokerHolder

  override fun getRuntimeExecutor(): RuntimeExecutor? = reactHost.runtimeExecutor
}
