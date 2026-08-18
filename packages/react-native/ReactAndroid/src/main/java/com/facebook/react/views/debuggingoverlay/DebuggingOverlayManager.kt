/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.debuggingoverlay

import android.graphics.RectF
import com.facebook.react.bridge.NoSuchKeyException
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.UnexpectedNativeTypeException
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.PixelUtil.dpToPx
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.DebuggingOverlayManagerDelegate
import com.facebook.react.viewmanagers.DebuggingOverlayManagerInterface

@ReactModule(name = DebuggingOverlayManager.REACT_CLASS)
internal class DebuggingOverlayManager :
    SimpleViewManager<DebuggingOverlay>(), DebuggingOverlayManagerInterface<DebuggingOverlay> {

  private val delegate: ViewManagerDelegate<DebuggingOverlay> =
      DebuggingOverlayManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<DebuggingOverlay> = delegate

  override fun highlightTraceUpdates(view: DebuggingOverlay, updates: ReadableArray): Unit {
    val formattedTraceUpdates = mutableListOf<TraceUpdate>()

    var successfullyParsedPayload = true
    for (i in 0 until updates.size()) {
      val traceUpdate = updates.getMap(i) ?: continue
      val serializedRectangle = traceUpdate.getMap("rectangle")
      if (serializedRectangle == null) {
        ReactSoftExceptionLogger.logSoftException(
            REACT_CLASS,
            ReactNoCrashSoftException(
                "Unexpected payload for highlighting trace updates: rectangle field is null",
            ),
        )
        successfullyParsedPayload = false
        break
      }

      val id = traceUpdate.getInt("id")
      val color = traceUpdate.getInt("color")

      try {
        val left = serializedRectangle.getDouble("x").toFloat()
        val top = serializedRectangle.getDouble("y").toFloat()
        val right = (left + serializedRectangle.getDouble("width")).toFloat()
        val bottom = (top + serializedRectangle.getDouble("height")).toFloat()

        val rectangle = RectF(left.dpToPx(), top.dpToPx(), right.dpToPx(), bottom.dpToPx())

        formattedTraceUpdates.add(TraceUpdate(id, rectangle, color))
      } catch (ex: Exception) {
        when (ex) {
          is NoSuchKeyException,
          is UnexpectedNativeTypeException -> {
            ReactSoftExceptionLogger.logSoftException(
                REACT_CLASS,
                ReactNoCrashSoftException(
                    "Unexpected payload for highlighting trace updates: rectangle field should" +
                        " have x, y, width, height fields",
                ),
            )
            successfullyParsedPayload = false
          }
          else -> throw ex
        }
      }
    }

    if (successfullyParsedPayload) {
      view.setTraceUpdates(formattedTraceUpdates)
    }
  }

  override fun highlightElements(view: DebuggingOverlay, elements: ReadableArray): Unit {
    val elementsRectangles = mutableListOf<RectF>()

    var successfullyParsedPayload = true
    for (i in 0 until elements.size()) {
      val element = elements.getMap(i) ?: continue
      try {
        val left = element.getDouble("x").toFloat()
        val top = element.getDouble("y").toFloat()
        val right = (left + element.getDouble("width")).toFloat()
        val bottom = (top + element.getDouble("height")).toFloat()
        val rect = RectF(left.dpToPx(), top.dpToPx(), right.dpToPx(), bottom.dpToPx())

        elementsRectangles.add(rect)
      } catch (ex: Exception) {
        when (ex) {
          is NoSuchKeyException,
          is UnexpectedNativeTypeException -> {
            ReactSoftExceptionLogger.logSoftException(
                REACT_CLASS,
                ReactNoCrashSoftException(
                    "Unexpected payload for highlighting elements: every element should have x," +
                        " y, width, height fields",
                ),
            )
            successfullyParsedPayload = false
          }
          else -> throw ex
        }
      }
    }

    if (successfullyParsedPayload) {
      view.setHighlightedElementsRectangles(elementsRectangles)
    }
  }

  override fun clearElementsHighlights(view: DebuggingOverlay): Unit {
    view.clearElementsHighlights()
  }

  override fun createViewInstance(context: ThemedReactContext): DebuggingOverlay {
    return DebuggingOverlay(context)
  }

  override fun getName(): String {
    return REACT_CLASS
  }

  companion object {
    const val REACT_CLASS: String = "DebuggingOverlay"
  }
}
