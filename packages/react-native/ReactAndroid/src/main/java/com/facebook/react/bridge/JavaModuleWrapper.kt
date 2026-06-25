/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.annotations.internal.InteropLegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger.assertLegacyArchitecture
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.facebook.systrace.Systrace
import com.facebook.systrace.Systrace.TRACE_TAG_REACT
import com.facebook.systrace.SystraceMessage
import java.lang.reflect.Method

/**
 * This is part of the glue which wraps a java BaseJavaModule in a C++ NativeModule. This could all
 * be in C++, but it's android-specific initialization code, and writing it this way is easier to
 * read and means fewer JNI calls.
 */
@DoNotStrip
@InteropLegacyArchitecture
internal class JavaModuleWrapper(
    @Suppress("DEPRECATION", "unused") private val jsInstance: JSInstance,
    private val moduleHolder: ModuleHolder,
) {
  @DoNotStrip
  class MethodDescriptor {
    @DoNotStrip var method: Method? = null

    @DoNotStrip var signature: String? = null

    @DoNotStrip var name: String? = null

    @DoNotStrip var type: String? = null
  }

  private val descs = ArrayList<MethodDescriptor>()

  @get:DoNotStrip
  val module: BaseJavaModule
    get() = moduleHolder.module as BaseJavaModule

  @get:DoNotStrip
  val name: String
    get() = moduleHolder.name

  @DoNotStrip
  private fun findMethods() {
    Systrace.beginSection(TRACE_TAG_REACT, "findMethods")

    var classForMethods: Class<*> = moduleHolder.module.javaClass
    val superClass = classForMethods.superclass
    if (superClass != null && TurboModule::class.java.isAssignableFrom(superClass)) {
      classForMethods = superClass
    }

    val targetMethods = classForMethods.declaredMethods
    for (targetMethod in targetMethods) {
      targetMethod.getAnnotation(ReactMethod::class.java)?.let { annotation ->
        val md = MethodDescriptor()
        md.name = targetMethod.name
        md.type =
            when {
              annotation.isBlockingSynchronousMethod -> BaseJavaModule.METHOD_TYPE_SYNC
              targetMethod.parameterTypes.let { params ->
                params.isNotEmpty() && params.last() == Promise::class.java
              } -> BaseJavaModule.METHOD_TYPE_PROMISE
              else -> BaseJavaModule.METHOD_TYPE_ASYNC
            }
        if (BaseJavaModule.METHOD_TYPE_SYNC == md.type) {
          md.signature = ""
          md.method = targetMethod
        }
        descs.add(md)
      }
    }
    Systrace.endSection(TRACE_TAG_REACT)
  }

  @get:DoNotStrip
  val methodDescriptors: List<MethodDescriptor>
    get() {
      if (descs.isEmpty()) {
        findMethods()
      }
      return descs
    }

  @get:DoNotStrip
  val constants: NativeMap
    get() {
      val moduleName = name
      SystraceMessage.beginSection(TRACE_TAG_REACT, "JavaModuleWrapper.getConstants")
          .arg("moduleName", moduleName)
          .flush()
      ReactMarker.logMarker(ReactMarkerConstants.GET_CONSTANTS_START, moduleName)

      val baseJavaModule = module

      Systrace.beginSection(TRACE_TAG_REACT, "module.getConstants")
      val map = baseJavaModule.constants
      Systrace.endSection(TRACE_TAG_REACT)

      Systrace.beginSection(TRACE_TAG_REACT, "create WritableNativeMap")
      ReactMarker.logMarker(ReactMarkerConstants.CONVERT_CONSTANTS_START, moduleName)
      try {
        return Arguments.makeNativeMap(map)
      } finally {
        ReactMarker.logMarker(ReactMarkerConstants.CONVERT_CONSTANTS_END, moduleName)
        Systrace.endSection(TRACE_TAG_REACT)

        ReactMarker.logMarker(ReactMarkerConstants.GET_CONSTANTS_END, moduleName)
        SystraceMessage.endSection(TRACE_TAG_REACT).flush()
      }
    }

  @DoNotStrip
  fun invoke(methodId: Int, parameters: ReadableNativeArray) {
    throw UnsupportedOperationException(
        "JavaModuleWrapper.invoke() is no longer supported. " +
            "Use TurboModule interop instead (ReactNativeFeatureFlags.useTurboModuleInterop)."
    )
  }

  private companion object {
    init {
      assertLegacyArchitecture("JavaModuleWrapper", LegacyArchitectureLogLevel.WARNING)
    }
  }
}
