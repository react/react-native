/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // We want to test against UIBlockViewResolver

package com.facebook.testutils.fakes

import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.interop.UIBlockViewResolver
import com.facebook.react.uimanager.events.EventDispatcher

@OptIn(UnstableReactNativeAPI::class)
class FakeUIManager : UIManager, UIBlockViewResolver {

  // The number of times resolveView was called
  var resolvedViewCount = 0

  override fun profileNextBatch() {
    error("Not yet implemented")
  }

  @Deprecated("")
  override fun <T : View> addRootView(rootView: T, initialProps: WritableMap?): Int {
    error("Not yet implemented")
  }

  @Deprecated("")
  override fun <T : View?> startSurface(
      rootView: T,
      moduleName: String,
      initialProps: WritableMap?,
      widthMeasureSpec: Int,
      heightMeasureSpec: Int,
  ): Int {
    error("Not yet implemented")
  }

  @Deprecated("")
  override fun stopSurface(surfaceId: Int) {
    error("Not yet implemented")
  }

  override fun updateRootLayoutSpecs(
      rootTag: Int,
      widthMeasureSpec: Int,
      heightMeasureSpec: Int,
      offsetX: Int,
      offsetY: Int,
  ) {
    error("Not yet implemented")
  }

  override fun dispatchCommand(reactTag: Int, commandId: Int, commandArgs: ReadableArray?) {
    error("Not yet implemented")
  }

  override fun dispatchCommand(reactTag: Int, commandId: String, commandArgs: ReadableArray?) {
    error("Not yet implemented")
  }

  override val eventDispatcher: EventDispatcher
    get() = TODO("Not yet implemented")

  override fun synchronouslyUpdateViewOnUIThread(reactTag: Int, props: ReadableMap) {
    error("Not yet implemented")
  }

  override fun sendAccessibilityEvent(reactTag: Int, eventType: Int) {
    error("Not yet implemented")
  }

  override fun addUIManagerEventListener(listener: UIManagerListener) {
    error("Not yet implemented")
  }

  override fun removeUIManagerEventListener(listener: UIManagerListener) {
    error("Not yet implemented")
  }

  override fun resolveView(reactTag: Int): View? {
    resolvedViewCount += 1
    return null
  }

  @Deprecated("")
  override fun receiveEvent(reactTag: Int, eventName: String, event: WritableMap?) {
    error("Not yet implemented")
  }

  override fun receiveEvent(surfaceId: Int, reactTag: Int, eventName: String, event: WritableMap?) {
    error("Not yet implemented")
  }

  @Deprecated("")
  override fun resolveCustomDirectEventName(eventName: String): String? {
    error("Not yet implemented")
  }

  override fun initialize() {
    error("Not yet implemented")
  }

  override fun invalidate() {
    error("Not yet implemented")
  }

  override fun markActiveTouchForTag(surfaceId: Int, reactTag: Int) {
    error("Not yet implemented")
  }

  override fun sweepActiveTouchForTag(surfaceId: Int, reactTag: Int) {
    error("Not yet implemented")
  }

  override val performanceCounters: Map<String, Long>?
    get() = null
}
