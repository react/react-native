/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events

import android.annotation.SuppressLint
import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.fabric.FabricSoLoader
import com.facebook.react.uimanager.events.BatchEventDispatchedListener

/**
 * Class that acts as a proxy between the list of EventBeats registered in C++ and the Android side.
 */
@DoNotStripAny
@SuppressLint("MissingNativeLoadLibrary")
internal class EventBeatManager : HybridClassBase(), BatchEventDispatchedListener {
  init {
    initHybrid()
  }

  private external fun initHybrid()

  private external fun tick()

  override fun onBatchEventDispatched() {
    tick()
  }

  private companion object {
    init {
      FabricSoLoader.staticInit()
    }
  }
}
