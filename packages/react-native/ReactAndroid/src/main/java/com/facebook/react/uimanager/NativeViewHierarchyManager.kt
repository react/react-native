/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/**
 * This class is part of Legacy Architecture and has been stubbed out. It will be removed in a
 * future release.
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated("This class is part of Legacy Architecture and will be removed in a future release")
@Suppress("DEPRECATION")
public open class NativeViewHierarchyManager {

  @Deprecated("Use new architecture instead.") public constructor(viewManagers: ViewManagerRegistry)

  @Deprecated("Use new architecture instead.")
  internal constructor(viewManagers: ViewManagerRegistry, manager: RootViewManager)

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public fun resolveView(tag: Int): View? = null

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public fun resolveViewManager(tag: Int): ViewManager<*, *>? = null

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  public open fun setLayoutAnimationEnabled(enabled: Boolean): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun updateInstanceHandle(tag: Int, instanceHandle: Long): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun updateProperties(tag: Int, props: ReactStylesDiffMap?): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun updateViewExtraData(tag: Int, extraData: Any?): Unit = Unit

  /** @deprecated Please use [updateLayout] with YogaDirection parameter instead. */
  @Deprecated("Please use updateLayout with YogaDirection parameter instead.")
  public open fun updateLayout(tag: Int, x: Int, y: Int, width: Int, height: Int): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun updateLayout(
      parentTag: Int,
      tag: Int,
      x: Int,
      y: Int,
      width: Int,
      height: Int,
      layoutDirection: com.facebook.yoga.YogaDirection,
  ): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun getInstanceHandle(reactTag: Int): Long = 0

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun createView(
      themedContext: ThemedReactContext,
      tag: Int,
      className: String,
      initialProps: ReactStylesDiffMap?,
  ): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  internal open fun manageChildren(
      tag: Int,
      indicesToRemove: IntArray?,
      viewsToAdd: Array<ViewAtIndex>?,
      tagsToDelete: IntArray?,
  ): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun setChildren(tag: Int, childrenTags: ReadableArray?): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun addRootView(tag: Int, view: View): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  protected fun addRootViewGroup(tag: Int, view: View): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  protected open fun dropView(view: View): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun removeRootView(rootViewTag: Int): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun getRootViewNum(): Int = 0

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun measure(tag: Int, outputBuffer: IntArray): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun measureInWindow(tag: Int, outputBuffer: IntArray): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun findTargetTagForTouch(reactTag: Int, touchX: Float, touchY: Float): Int = 0

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun setJSResponder(
      reactTag: Int,
      initialReactTag: Int,
      blockNativeResponder: Boolean,
  ): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun clearJSResponder(): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun dispatchCommand(reactTag: Int, commandId: Int, args: ReadableArray?): Unit = Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun dispatchCommand(reactTag: Int, commandId: String, args: ReadableArray?): Unit =
      Unit

  /** @deprecated Use new architecture instead. */
  @Deprecated("Use new architecture instead.")
  @Synchronized
  public open fun sendAccessibilityEvent(tag: Int, eventType: Int): Unit = Unit

  public companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "NativeViewHierarchyManager",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }
}
