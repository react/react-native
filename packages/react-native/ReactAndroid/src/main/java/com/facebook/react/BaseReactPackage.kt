/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.bridge.ModuleHolder
import com.facebook.react.bridge.ModuleSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import java.util.ArrayList
import java.util.NoSuchElementException
import javax.inject.Provider

/** Abstract class that supports lazy loading of NativeModules by default. */
public abstract class BaseReactPackage : ReactPackage {

  @Deprecated("Migrate to [BaseReactPackage] and implement [getModule] instead.")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    throw UnsupportedOperationException(
        "createNativeModules method is not supported. Use getModule() method instead."
    )
  }

  /**
   * The API needed for TurboModules. Given a module name, it returns an instance of [NativeModule]
   * for the name
   *
   * @param name name of the Native Module
   * @param reactContext [ReactApplicationContext] context for this
   */
  abstract override fun getModule(
      name: String,
      reactContext: ReactApplicationContext,
  ): NativeModule?

  /**
   * This is a temporary method till we implement TurboModules. Once we implement TurboModules, we
   * will be able to directly call [BaseReactPackage#getModule(String, ReactApplicationContext)]
   * This method will be removed when TurboModule implementation is complete
   *
   * @param reactContext [ReactApplicationContext]
   * @return
   */
  internal fun getNativeModuleIterator(
      reactContext: ReactApplicationContext
  ): Iterable<ModuleHolder> {
    val entrySet = getReactModuleInfoProvider().getReactModuleInfos().entries
    val entrySetIterator = entrySet.iterator()
    // This should ideally be an IteratorConvertor, but we don't have any internal library for it
    return Iterable {
      object : Iterator<ModuleHolder> {
        var nextEntry: Map.Entry<String, ReactModuleInfo>? = null

        private fun findNext() {
          while (entrySetIterator.hasNext()) {
            val entry = entrySetIterator.next()
            val reactModuleInfo = entry.value

            // This Iterator is used to create the NativeModule registry. The NativeModule
            // registry must not have TurboModules. Therefore, if the current NativeModule is
            // a TurboModule, we need to skip iterating over it.
            if (reactModuleInfo.isTurboModule) {
              continue
            }

            nextEntry = entry
            return
          }
          nextEntry = null
        }

        override fun hasNext(): Boolean {
          if (nextEntry == null) {
            findNext()
          }
          return nextEntry != null
        }

        override fun next(): ModuleHolder {
          if (nextEntry == null) {
            findNext()
          }

          val entry = nextEntry ?: throw NoSuchElementException("ModuleHolder not found")

          // Advance iterator
          findNext()

          return ModuleHolder(entry.value, ModuleHolderProvider(entry.key, reactContext))
        }
      }
    }
  }

  /**
   * @param reactContext react application context that can be used to create View Managers.
   * @return list of module specs that can create the View Managers.
   */
  protected open fun getViewManagers(reactContext: ReactApplicationContext): List<ModuleSpec> =
      emptyList()

  override fun createViewManagers(
      reactContext: ReactApplicationContext
  ): List<ViewManager<in Nothing, in Nothing>> {
    val viewManagerModuleSpecs = getViewManagers(reactContext)
    if (viewManagerModuleSpecs.isNullOrEmpty()) {
      return emptyList()
    }

    val viewManagers: MutableList<ViewManager<*, *>> = ArrayList()
    for (moduleSpec in viewManagerModuleSpecs) {
      viewManagers.add((moduleSpec.provider.get() as ViewManager<*, *>))
    }
    return viewManagers
  }

  public abstract fun getReactModuleInfoProvider(): ReactModuleInfoProvider

  private inner class ModuleHolderProvider(
      private val name: String,
      private val reactContext: ReactApplicationContext,
  ) : Provider<NativeModule?> {
    override fun get(): NativeModule? = getModule(name, reactContext)
  }
}
