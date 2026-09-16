/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UIManager
import com.facebook.react.common.annotations.StableReactNativeAPI
import com.facebook.react.uimanager.ViewManager

/**
 * Main interface for providing additional capabilities to the catalyst framework by couple of
 * different means:
 * 1. Registering new native modules
 * 1. Registering new JS modules that may be accessed from native modules or from other parts of the
 *    native code (requiring JS modules from the package doesn't mean it will automatically be
 *    included as a part of the JS bundle, so there should be a corresponding piece of code on JS
 *    side that will require implementation of that JS module so that it gets bundled)
 * 1. Registering custom native views (view managers) and custom event types
 * 1. Registering natively packaged assets/resources (e.g. images) exposed to JS
 *
 * TODO(6788500, 6788507): Implement support for adding custom views, events and resources
 */
public interface ReactPackage {

  /**
   * @param reactContext react application context that can be used to create modules
   * @return list of native modules to register with the newly created catalyst instance This method
   *   is deprecated in the new Architecture of React Native.
   */
  @Deprecated(message = "Migrate to [BaseReactPackage] and implement [getModule] instead.")
  public fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
      emptyList()

  /** @return a list of view managers that should be registered with [UIManager] */
  public fun createViewManagers(
      reactContext: ReactApplicationContext,
  ): List<ViewManager<in Nothing, in Nothing>>

  /**
   * Given a module name, it returns an instance of [NativeModule] for the name
   *
   * @param name name of the Native Module
   * @param reactContext [ReactApplicationContext] context for this
   */
  @StableReactNativeAPI
  public fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? = null
}
