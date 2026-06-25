/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp.component

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.RNTNativeTouchReceiverManagerDelegate
import com.facebook.react.viewmanagers.RNTNativeTouchReceiverManagerInterface

@ReactModule(name = RNTNativeTouchReceiverManager.REACT_CLASS)
internal class RNTNativeTouchReceiverManager :
    ViewGroupManager<RNTNativeTouchReceiverView>(),
    RNTNativeTouchReceiverManagerInterface<RNTNativeTouchReceiverView> {

  companion object {
    const val REACT_CLASS = "RNTNativeTouchReceiver"
  }

  private val delegate: ViewManagerDelegate<RNTNativeTouchReceiverView> =
      RNTNativeTouchReceiverManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<RNTNativeTouchReceiverView> = delegate

  override fun getName(): String = REACT_CLASS

  override fun createViewInstance(reactContext: ThemedReactContext): RNTNativeTouchReceiverView =
      RNTNativeTouchReceiverView(reactContext)
}
