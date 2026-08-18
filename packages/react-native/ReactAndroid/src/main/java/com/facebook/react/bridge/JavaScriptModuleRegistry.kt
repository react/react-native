/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.react.common.build.ReactBuildConfig
import java.lang.reflect.InvocationHandler
import java.lang.reflect.Method
import java.lang.reflect.Proxy

/**
 * Class responsible for holding all the [JavaScriptModule]s. Uses Java proxy objects to dispatch
 * method calls on JavaScriptModules to the bridge using the corresponding module and method ids so
 * the proper function is executed in JavaScript.
 */
public class JavaScriptModuleRegistry {

  private val moduleInstances: MutableMap<Class<out JavaScriptModule>, JavaScriptModule> = HashMap()

  @Synchronized
  public fun <T : JavaScriptModule> getJavaScriptModule(
      @Suppress("DEPRECATION") instance: CatalystInstance,
      moduleInterface: Class<T>,
  ): T {
    val module = moduleInstances[moduleInterface]
    if (module != null) {
      @Suppress("UNCHECKED_CAST")
      return module as T
    }

    val proxy =
        Proxy.newProxyInstance(
            moduleInterface.classLoader,
            arrayOf<Class<*>>(moduleInterface),
            JavaScriptModuleInvocationHandler(instance, moduleInterface),
        ) as JavaScriptModule

    moduleInstances[moduleInterface] = proxy
    @Suppress("UNCHECKED_CAST")
    return proxy as T
  }

  private class JavaScriptModuleInvocationHandler(
      @Suppress("DEPRECATION") private val catalystInstance: CatalystInstance,
      private val moduleInterface: Class<out JavaScriptModule>,
  ) : InvocationHandler {

    private var name: String? = null

    init {
      if (ReactBuildConfig.DEBUG) {
        val methodNames = mutableSetOf<String>()
        for (method in moduleInterface.declaredMethods) {
          if (!methodNames.add(method.name)) {
            throw AssertionError(
                "Method overloading is unsupported: ${moduleInterface.name}#${method.name}",
            )
          }
        }
      }
    }

    private fun getJSModuleName(): String {
      // Getting the class name every call is expensive, so cache it
      return name ?: getJSModuleName(moduleInterface).also { name = it }
    }

    override fun invoke(proxy: Any, method: Method, args: Array<Any?>?): Any? {
      val jsArgs = if (args != null) Arguments.fromJavaArgs(args) else WritableNativeArray()
      catalystInstance.callFunction(getJSModuleName(), method.name, jsArgs)
      return null
    }
  }

  public companion object {
    /**
     * With proguard obfuscation turned on, proguard apparently (poorly) emulates inner classes or
     * something because Class#getSimpleName() no longer strips the outer class name. We manually
     * strip it here if necessary.
     */
    @JvmStatic
    public fun getJSModuleName(jsModuleInterface: Class<out JavaScriptModule>): String {
      var name = jsModuleInterface.simpleName
      val dollarSignIndex = name.lastIndexOf('$')
      if (dollarSignIndex != -1) {
        name = name.substring(dollarSignIndex + 1)
      }
      return name
    }
  }
}
