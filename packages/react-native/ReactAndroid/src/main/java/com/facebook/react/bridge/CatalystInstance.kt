/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.queue.ReactQueueConfiguration
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.internal.turbomodule.core.interfaces.TurboModuleRegistry
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder
import com.facebook.react.turbomodule.core.interfaces.NativeMethodCallInvokerHolder

/**
 * A higher level API on top of the asynchronous JSC bridge. This provides an environment allowing
 * the invocation of JavaScript methods and lets a set of Java APIs be invocable from JavaScript as
 * well.
 */
@Deprecated(
    message =
        "This class is deprecated, please to migrate to new architecture using [com.facebook.react.defaults.DefaultReactHost] instead.",
)
@DoNotStrip
@LegacyArchitecture
public interface CatalystInstance : MemoryPressureListener, JSInstance, JSBundleLoaderDelegate {
  public fun runJSBundle()

  // Returns the status of running the JS bundle; waits for an answer if runJSBundle is running
  public fun hasRunJSBundle(): Boolean

  /**
   * Return the source URL of the JS Bundle that was run, or `null` if no JS bundle has been run
   * yet.
   */
  public val sourceURL: String?

  // This is called from java code, so it won't be stripped anyway, but proguard will rename it,
  // which this prevents.
  @DoNotStrip public override fun invokeCallback(callbackID: Int, arguments: NativeArrayInterface)

  @DoNotStrip public fun callFunction(module: String, method: String, arguments: NativeArray?)

  /**
   * Destroys this catalyst instance, waiting for any other threads in ReactQueueConfiguration
   * (besides the UI thread) to finish running. Must be called from the UI thread so that we can
   * fully shut down other threads.
   */
  public fun destroy()

  public val isDestroyed: Boolean

  /** Initialize all the native modules */
  public fun initialize()

  public val reactQueueConfiguration: ReactQueueConfiguration

  public fun <T : JavaScriptModule> getJSModule(jsInterface: Class<T>): T?

  public fun <T : NativeModule> hasNativeModule(nativeModuleInterface: Class<T>): Boolean

  public fun <T : NativeModule> getNativeModule(nativeModuleInterface: Class<T>): T?

  public fun getNativeModule(moduleName: String): NativeModule?

  public val nativeModules: Collection<NativeModule>

  /**
   * This method permits a CatalystInstance to extend the known Native modules. This provided
   * registry contains only the new modules to load.
   */
  public fun extendNativeModules(modules: NativeModuleRegistry)

  /** This method registers the file path of an additional JS segment by its ID. */
  public fun registerSegment(segmentId: Int, path: String)

  public fun setGlobalVariable(propName: String, jsonValue: String)

  /**
   * Do not use this anymore. Use [runtimeExecutor] instead. Get the C pointer (as a long) to the
   * JavaScriptCore context associated with this instance.
   *
   * <p>Use the following pattern to ensure that the JS context is not cleared while you are using
   * it: JavaScriptContextHolder jsContext = reactContext.getJavaScriptContextHolder()
   * synchronized(jsContext) { nativeThingNeedingJsContext(jsContext.get()); }
   */
  @get:Deprecated("Use runtimeExecutor instead.")
  public val javaScriptContextHolder: JavaScriptContextHolder

  public val runtimeExecutor: RuntimeExecutor?
  public val runtimeScheduler: RuntimeScheduler?

  /**
   * Returns a hybrid object that contains a pointer to a JS CallInvoker, which is used to schedule
   * work on the JS Thread. Required for TurboModuleManager initialization.
   */
  @get:Deprecated("Use ReactContext.getJSCallInvokerHolder instead")
  @Suppress("INAPPLICABLE_JVM_NAME")
  @get:JvmName("getJSCallInvokerHolder") // This is needed to keep backward compatibility
  public val jsCallInvokerHolder: CallInvokerHolder

  /**
   * Returns a hybrid object that contains a pointer to a NativeMethodCallInvoker, which is used to
   * schedule work on the NativeModules thread. Required for TurboModuleManager initialization.
   */
  public val nativeMethodCallInvokerHolder: NativeMethodCallInvokerHolder

  @Deprecated(
      message =
          "This method is deprecated, please to migrate to new architecture using [com.facebook.react.defaults.DefaultReactHost] instead.",
  )
  public fun setTurboModuleRegistry(turboModuleRegistry: TurboModuleRegistry)

  @Deprecated(
      message =
          "This method is deprecated, please to migrate to new architecture using [com.facebook.react.defaults.DefaultReactHost] instead.",
  )
  public fun setFabricUIManager(fabricUIManager: UIManager)

  @Deprecated(
      message =
          "This method is deprecated, please to migrate to new architecture using [com.facebook.react.defaults.DefaultReactHost] instead.",
  )
  public fun getFabricUIManager(): UIManager?
}
