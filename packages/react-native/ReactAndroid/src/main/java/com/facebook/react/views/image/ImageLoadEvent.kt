/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import androidx.annotation.IntDef
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.common.ViewUtil
import com.facebook.react.uimanager.events.Event

public class ImageLoadEvent
private constructor(
    surfaceId: Int,
    viewId: Int,
    @param:ImageEventType private val eventType: Int,
    private val errorMessage: String? = null,
    private val sourceUri: String? = null,
    private val width: Int = 0,
    private val height: Int = 0,
    private val loaded: Int = 0,
    private val total: Int = 0,
) : Event<ImageLoadEvent>(surfaceId, viewId) {
  @IntDef(ON_ERROR, ON_LOAD, ON_LOAD_END, ON_LOAD_START, ON_PROGRESS)
  @Retention(AnnotationRetention.SOURCE)
  internal annotation class ImageEventType

  override fun getEventName(): String = eventNameForType(eventType)

  // Intentionally casting eventType because it is guaranteed to be a short
  // enough to fit into short.
  override fun getCoalescingKey(): Short = eventType.toShort()

  protected override fun getEventData(): WritableMap =
      Arguments.createMap().apply {
        when (eventType) {
          ON_PROGRESS -> {
            putInt("loaded", loaded)
            putInt("total", total)
            putDouble("progress", loaded / total.toDouble())
          }
          ON_LOAD -> putMap("source", createEventDataSource())
          ON_ERROR -> putString("error", errorMessage)
        }
      }

  private fun createEventDataSource(): WritableMap =
      Arguments.createMap().apply {
        putString("uri", sourceUri)
        putDouble("width", width.toDouble())
        putDouble("height", height.toDouble())
      }

  public companion object {
    public const val ON_ERROR: Int = 1
    public const val ON_LOAD: Int = 2
    public const val ON_LOAD_END: Int = 3
    public const val ON_LOAD_START: Int = 4
    public const val ON_PROGRESS: Int = 5

    @Deprecated(
        "Use the createLoadStartEvent version that explicitly takes surfaceId as an argument",
        ReplaceWith("createLoadStartEvent(surfaceId, viewId)"),
    )
    @JvmStatic
    public fun createLoadStartEvent(viewId: Int): ImageLoadEvent =
        createLoadStartEvent(ViewUtil.NO_SURFACE_ID, viewId)

    @Deprecated(
        "Use the createProgressEvent version that explicitly takes surfaceId as an argument",
        ReplaceWith("createProgressEvent(surfaceId, viewId, imageUri, loaded, total)"),
    )
    @JvmStatic
    public fun createProgressEvent(
        viewId: Int,
        imageUri: String?,
        loaded: Int,
        total: Int,
    ): ImageLoadEvent = createProgressEvent(ViewUtil.NO_SURFACE_ID, viewId, imageUri, loaded, total)

    @Deprecated(
        "Use the createLoadEvent version that explicitly takes surfaceId as an argument",
        ReplaceWith("createLoadEvent(surfaceId, viewId, imageUri, width, height)"),
    )
    @JvmStatic
    public fun createLoadEvent(
        viewId: Int,
        imageUri: String?,
        width: Int,
        height: Int,
    ): ImageLoadEvent = createLoadEvent(ViewUtil.NO_SURFACE_ID, viewId, imageUri, width, height)

    @Deprecated(
        "Use the createErrorEvent version that explicitly takes surfaceId as an argument",
        ReplaceWith("createErrorEvent(surfaceId, viewId, throwable)"),
    )
    @JvmStatic
    public fun createErrorEvent(viewId: Int, throwable: Throwable): ImageLoadEvent =
        createErrorEvent(ViewUtil.NO_SURFACE_ID, viewId, throwable)

    @Deprecated(
        "Use the createLoadEndEvent version that explicitly takes surfaceId as an argument",
        ReplaceWith("createLoadEndEvent(surfaceId, viewId)"),
    )
    @JvmStatic
    public fun createLoadEndEvent(viewId: Int): ImageLoadEvent =
        createLoadEndEvent(ViewUtil.NO_SURFACE_ID, viewId)

    @JvmStatic
    public fun createLoadStartEvent(surfaceId: Int, viewId: Int): ImageLoadEvent =
        ImageLoadEvent(surfaceId, viewId, ON_LOAD_START)

    /**
     * @param loaded Amount of the image that has been loaded. It should be number of bytes, but
     *   Fresco does not currently provides that information.
     * @param total Amount that `loaded` will be when the image is fully loaded.
     */
    @JvmStatic
    public fun createProgressEvent(
        surfaceId: Int,
        viewId: Int,
        imageUri: String?,
        loaded: Int,
        total: Int,
    ): ImageLoadEvent =
        ImageLoadEvent(surfaceId, viewId, ON_PROGRESS, null, imageUri, 0, 0, loaded, total)

    @JvmStatic
    public fun createLoadEvent(
        surfaceId: Int,
        viewId: Int,
        imageUri: String?,
        width: Int,
        height: Int,
    ): ImageLoadEvent =
        ImageLoadEvent(surfaceId, viewId, ON_LOAD, null, imageUri, width, height, 0, 0)

    @JvmStatic
    public fun createErrorEvent(surfaceId: Int, viewId: Int, throwable: Throwable): ImageLoadEvent =
        ImageLoadEvent(surfaceId, viewId, ON_ERROR, throwable.message, null, 0, 0, 0, 0)

    @JvmStatic
    public fun createLoadEndEvent(surfaceId: Int, viewId: Int): ImageLoadEvent =
        ImageLoadEvent(surfaceId, viewId, ON_LOAD_END)

    @JvmStatic
    public fun eventNameForType(@ImageEventType eventType: Int): String =
        when (eventType) {
          ON_ERROR -> "topError"
          ON_LOAD -> "topLoad"
          ON_LOAD_END -> "topLoadEnd"
          ON_LOAD_START -> "topLoadStart"
          ON_PROGRESS -> "topProgress"
          else -> error("Invalid image event: $eventType")
        }
  }
}
