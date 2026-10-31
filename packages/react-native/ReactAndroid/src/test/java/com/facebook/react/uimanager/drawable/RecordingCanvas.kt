/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Rect
import android.graphics.RectF

/**
 * Records each call a drawable makes as text, with the paint it draws with, and every geometry
 * object it hands the canvas.
 */
internal class RecordingCanvas : Canvas() {
  val calls = mutableListOf<String>()
  val geometry = mutableListOf<Any>()
  val drawnPaths = mutableListOf<Path>()

  override fun clipPath(path: Path): Boolean {
    record("clipPath ${describe(path)}", path)
    return true
  }

  override fun clipOutPath(path: Path): Boolean {
    record("clipOutPath ${describe(path)}", path)
    return true
  }

  override fun clipRect(rect: RectF): Boolean {
    record("clipRect $rect", rect)
    return true
  }

  override fun clipOutRect(rect: Rect): Boolean {
    record("clipOutRect $rect", rect)
    return true
  }

  override fun drawPath(path: Path, paint: Paint) {
    drawnPaths.add(path)
    record("drawPath ${path.fillType} ${describe(path)} ${describe(paint)}", path)
  }

  override fun drawRect(rect: RectF, paint: Paint) {
    record("drawRect $rect ${describe(paint)}", rect)
  }

  override fun drawDoubleRoundRect(
      outer: RectF,
      outerRadii: FloatArray,
      inner: RectF,
      innerRadii: FloatArray,
      paint: Paint,
  ) {
    record(
        "drawDoubleRoundRect $outer ${outerRadii.toList()} $inner ${innerRadii.toList()} " +
            describe(paint),
        outer,
        outerRadii,
        inner,
        innerRadii,
    )
  }

  private fun record(call: String, vararg drawnGeometry: Any) {
    calls.add(call)
    geometry.addAll(drawnGeometry)
  }

  private fun describe(path: Path): String = path.approximate(0.5f).toList().toString()

  private fun describe(paint: Paint): String =
      "color=${Integer.toHexString(paint.color)} alpha=${paint.alpha} " +
          "blurred=${paint.maskFilter != null}"
}
