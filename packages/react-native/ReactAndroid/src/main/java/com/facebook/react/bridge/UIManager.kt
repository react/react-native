/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.view.View
import androidx.annotation.AnyThread
import androidx.annotation.UiThread
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.events.EventDispatcher

@OptIn(UnstableReactNativeAPI::class)
public interface UIManager : PerformanceCounter {
  /**
   * Registers a new root view.
   *
   * @deprecated Use `ReactHost.createSurface(...)` and `ReactSurface.start()` instead.
   */
  @UiThread
  @ThreadConfined(ThreadConfined.UI)
  @Deprecated(
      "This legacy surface API will be removed in a future release. " +
          "Use ReactHost.createSurface(...) and ReactSurface.start() instead."
  )
  public fun <T : View> addRootView(rootView: T, initialProps: WritableMap?): Int

  /**
   * Registers a new root view with width and height.
   *
   * @deprecated Use `ReactHost.createSurface(...)` and `ReactSurface.start()` instead.
   */
  @AnyThread
  @Deprecated(
      "This legacy surface API will be removed in a future release. " +
          "Use ReactHost.createSurface(...) and ReactSurface.start() instead."
  )
  public fun <T : View?> startSurface(
      rootView: T,
      moduleName: String,
      initialProps: WritableMap?,
      widthMeasureSpec: Int,
      heightMeasureSpec: Int,
  ): Int

  /**
   * Stop a surface from running in JS and clears up native memory usage. Assumes that the native
   * View hierarchy has already been cleaned up. Fabric-only.
   *
   * @deprecated Use `ReactSurface.stop()` instead.
   */
  @AnyThread
  @Deprecated(
      "This legacy surface API will be removed in a future release. Use ReactSurface.stop() instead."
  )
  public fun stopSurface(surfaceId: Int)

  /**
   * Updates the layout specs of the RootShadowNode based on the Measure specs received by
   * parameters. offsetX and offsetY are the position of the RootView within the screen.
   */
  @UiThread
  @ThreadConfined(ThreadConfined.UI)
  public fun updateRootLayoutSpecs(
      rootTag: Int,
      widthMeasureSpec: Int,
      heightMeasureSpec: Int,
      offsetX: Int,
      offsetY: Int,
  )

  /**
   * Dispatches the commandId received by parameter to the view associated with the reactTag. The
   * command will be processed in the UIThread.
   *
   * Receiving commands as ints is deprecated and will be removed in a future release.
   *
   * Pre-Fabric, this is only called on the Native Module Thread.
   *
   * @param reactTag that identifies the view that will receive this command
   * @param commandId command id
   * @param commandArgs [ReadableArray] parameters associated with the command
   */
  public fun dispatchCommand(reactTag: Int, commandId: Int, commandArgs: ReadableArray?)

  /**
   * Dispatches the commandId received by parameter to the view associated with the reactTag. The
   * command will be processed in the UIThread.
   *
   * Pre-Fabric, this is only called on the Native Module Thread.
   *
   * @param reactTag that identifies the view that will receive this command
   * @param commandId command id
   * @param commandArgs [ReadableArray] parameters associated with the command
   */
  public fun dispatchCommand(reactTag: Int, commandId: String, commandArgs: ReadableArray?)

  /** @return the [EventDispatcher] object that is used by this class. */
  public val eventDispatcher: EventDispatcher

  /**
   * Used by native animated module to bypass the process of updating the values through the shadow
   * view hierarchy. This method will directly update native views, which means that updates for
   * layout-related propertied won't be handled properly. Make sure you know what you're doing
   * before calling this method :)
   *
   * @param reactTag that identifies the view that will be updated
   * @param props [ReadableMap] props that should be immediately updated in view
   */
  @UiThread
  @ThreadConfined(ThreadConfined.UI)
  public fun synchronouslyUpdateViewOnUIThread(reactTag: Int, props: ReadableMap)

  /**
   * Dispatch an accessibility event to a view asynchronously.
   *
   * Pre-Fabric, this is only called on the Native Module Thread.
   *
   * @param reactTag
   * @param eventType
   */
  public fun sendAccessibilityEvent(reactTag: Int, eventType: Int)

  /**
   * Register a [UIManagerListener] with this UIManager to receive lifecycle callbacks.
   *
   * @param listener
   */
  public fun addUIManagerEventListener(listener: UIManagerListener)

  /**
   * Unregister a [UIManagerListener] from this UIManager to stop receiving lifecycle callbacks.
   *
   * @param listener
   */
  public fun removeUIManagerEventListener(listener: UIManagerListener)

  /**
   * Resolves a view based on its reactTag. Do not mutate properties on this view that are already
   * managed by React, as there are no guarantees this changes will be preserved.
   *
   * @param reactTag tag
   * @return view if found
   * @throws [com.facebook.react.uimanager.IllegalViewOperationException] if tag could not be
   *   resolved.
   */
  public fun resolveView(reactTag: Int): View?

  /**
   * This method dispatches events from RN Android code to JS. The delivery of this event will not
   * be queued in EventDispatcher class.
   *
   * @param reactTag tag
   * @param eventName name of the event
   * @param event parameters
   */
  @Deprecated("", ReplaceWith("receiveEvent(surfaceId, reactTag, eventName, event)"))
  public fun receiveEvent(reactTag: Int, eventName: String, event: WritableMap?)

  /**
   * This method dispatches events from RN Android code to JS. The delivery of this event will not
   * be queued in EventDispatcher class.
   *
   * @param surfaceId
   * @param reactTag tag
   * @param eventName name of the event
   * @param event parameters
   */
  public fun receiveEvent(surfaceId: Int, reactTag: Int, eventName: String, event: WritableMap?)

  /** Resolves Direct Event name exposed to JS from the one known to the Native side. */
  @Deprecated("") public fun resolveCustomDirectEventName(eventName: String): String?

  /** This method is called after [ReactApplicationContext] has been created. */
  public fun initialize()

  /** Called before React Native instance is destroyed. */
  public fun invalidate()

  /**
   * Mark a view as currently active for a touch event. This information could be used by the
   * [UIManager] to decide if a view could be safely destroyed or not.
   *
   * @param surfaceId The surface ID where the view is rendered.
   * @param reactTag The react tag for the specific view
   */
  public fun markActiveTouchForTag(surfaceId: Int, reactTag: Int)

  /**
   * Sweep a view as currently not active for a touch event. This tells the [UIManager] that the
   * view is not being interacted by the user and can safely be destroyed.
   *
   * @param surfaceId The surface ID where the view is rendered.
   * @param reactTag The react tag for the specific view
   */
  public fun sweepActiveTouchForTag(surfaceId: Int, reactTag: Int)
}
