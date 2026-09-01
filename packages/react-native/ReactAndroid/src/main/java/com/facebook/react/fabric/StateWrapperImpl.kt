/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import android.annotation.SuppressLint
import com.facebook.common.logging.FLog
import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.mapbuffer.ReadableMapBuffer
import com.facebook.react.uimanager.ReferenceStateWrapper
import com.facebook.react.uimanager.StateWrapper

/**
 * This class holds reference to the C++ EventEmitter object. Instances of this class are created on
 * the Bindings.cpp, where the pointer to the C++ event emitter is set.
 */
@SuppressLint("MissingNativeLoadLibrary")
@DoNotStripAny
internal class StateWrapperImpl private constructor() : HybridClassBase(), ReferenceStateWrapper {

  private external fun initHybrid()

  private external fun getStateDataImpl(): ReadableNativeMap?

  private external fun getStateMapBufferDataImpl(): ReadableMapBuffer?

  private external fun getStateDataReferenceImpl(): Any?

  public external fun updateStateImpl(map: NativeMap, updateMode: Int)

  public override val stateDataMapBuffer: ReadableMapBuffer?
    get() {
      if (!isValid) {
        FLog.e(TAG, "Race between StateWrapperImpl destruction and getState")
        return null
      }
      return getStateMapBufferDataImpl()
    }

  public override val stateData: ReadableNativeMap?
    get() {
      if (!isValid) {
        FLog.e(TAG, "Race between StateWrapperImpl destruction and getState")
        return null
      }
      return getStateDataImpl()
    }

  public override val stateDataReference: Any?
    get() {
      if (!isValid) {
        FLog.e(TAG, "Race between StateWrapperImpl destruction and getState")
        return null
      }
      return getStateDataReferenceImpl()
    }

  init {
    initHybrid()
  }

  override fun updateState(map: WritableMap, updateMode: StateWrapper.UpdateMode) {
    if (!isValid) {
      FLog.e(TAG, "Race between StateWrapperImpl destruction and updateState")
      return
    }
    updateStateImpl(map as NativeMap, updateMode.value)
  }

  override fun destroyState() {
    if (isValid) {
      resetNative()
    }
  }

  override fun toString(): String {
    if (!isValid) {
      return "<destroyed>"
    }

    val mapBuffer = getStateMapBufferDataImpl()
    if (mapBuffer != null) {
      return mapBuffer.toString()
    }

    return getStateDataImpl()?.toString() ?: "<unexpected null: stateDataImpl>"
  }

  private companion object {
    init {
      FabricSoLoader.staticInit()
    }

    private const val TAG = "StateWrapperImpl"
  }
}
