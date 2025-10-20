package com.facebook.react.fabric.mounting

import android.graphics.RectF
import android.view.View
import android.view.ViewParent

public object MeasureAsyncUtil {
  private val mBoundingBox = RectF()

  /**
   * Output buffer will be {x, y, width, height}.
   */
  public fun measure(rootView: View, viewToMeasure: View, outputBuffer: IntArray) {
    computeBoundingBox(rootView, outputBuffer)
    val rootX = outputBuffer[0]
    val rootY = outputBuffer[1]
    computeBoundingBox(viewToMeasure, outputBuffer)
    outputBuffer[0] -= rootX
    outputBuffer[1] -= rootY
  }

  private fun computeBoundingBox(view: View, outputBuffer: IntArray) {
    mBoundingBox.set(0f, 0f, view.width.toFloat(), view.height.toFloat())
    mapRectFromViewToWindowCoords(view, mBoundingBox)

    outputBuffer[0] = Math.round(mBoundingBox.left)
    outputBuffer[1] = Math.round(mBoundingBox.top)
    outputBuffer[2] = Math.round(mBoundingBox.right - mBoundingBox.left)
    outputBuffer[3] = Math.round(mBoundingBox.bottom - mBoundingBox.top)
  }

  private fun mapRectFromViewToWindowCoords(view: View, rect: RectF) {
    var matrix = view.getMatrix()
    if (!matrix.isIdentity) {
      matrix.mapRect(rect)
    }

    rect.offset(view.left.toFloat(), view.top.toFloat())

    var parent: ViewParent? = view.parent
    while (parent is View) {
      val parentView = parent as View

      rect.offset(-parentView.scrollX.toFloat(), -parentView.scrollY.toFloat())

      matrix = parentView.getMatrix()
      if (!matrix.isIdentity) {
        matrix.mapRect(rect)
      }

      rect.offset(parentView.left.toFloat(), parentView.top.toFloat())

      parent = parentView.parent
    }
  }
}
