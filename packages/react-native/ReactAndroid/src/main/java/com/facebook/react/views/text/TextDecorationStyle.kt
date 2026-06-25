/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.Paint
import android.graphics.Path
import android.os.Build
import android.text.Layout
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Styles supported by the CSS `text-decoration-style` property, surfaced end-to-end by Fabric (see
 * `TextAttributes::textDecorationStyle`).
 */
internal enum class TextDecorationStyle {
  SOLID,
  DOUBLE,
  DOTTED,
  DASHED,
  WAVY;

  internal companion object {
    @JvmStatic
    fun fromString(value: String?): TextDecorationStyle =
        when (value) {
          "double" -> DOUBLE
          "dotted" -> DOTTED
          "dashed" -> DASHED
          "wavy" -> WAVY
          else -> SOLID
        }
  }
}

// Reusable objects to avoid allocations in the draw path (UI thread only).
private val scratchPath = Path()
private val decorationPaint = Paint()
private val dottedEffects =
    object : LinkedHashMap<Float, DashPathEffect>(4, 0.75f, true) {
      override fun removeEldestEntry(eldest: MutableMap.MutableEntry<Float, DashPathEffect>?) =
          size > 4
    }
private val dashedEffects =
    object : LinkedHashMap<Float, DashPathEffect>(4, 0.75f, true) {
      override fun removeEldestEntry(eldest: MutableMap.MutableEntry<Float, DashPathEffect>?) =
          size > 4
    }

/**
 * Draws a horizontal decoration line between [x1] and [x2] at [y], applying the requested CSS
 * `text-decoration-style`. [paint] must already be configured (color, strokeWidth, style,
 * antiAlias). [reusablePath] is reset and reused for styles that need a path, avoiding per-frame
 * allocations.
 *
 * WAVY wavelength and control-point distance follow Chromium/Blink's `decoration_line_painter.cc`.
 * DOUBLE uses a density-scaled gap (`thickness + 2dp`) to keep both strokes visually distinct with
 * antialiasing on mobile displays.
 */
private fun drawDecorationLine(
    canvas: Canvas,
    paint: Paint,
    x1: Float,
    x2: Float,
    y: Float,
    thickness: Float,
    density: Float,
    style: TextDecorationStyle,
    reusablePath: Path,
) {
  when (style) {
    TextDecorationStyle.SOLID -> canvas.drawLine(x1, y, x2, y, paint)
    TextDecorationStyle.DOUBLE -> {
      val gap = thickness + 2f * density
      canvas.drawLine(x1, y, x2, y, paint)
      canvas.drawLine(x1, y + gap, x2, y + gap, paint)
    }
    TextDecorationStyle.DOTTED,
    TextDecorationStyle.DASHED -> {
      reusablePath.reset()
      reusablePath.moveTo(x1, y)
      reusablePath.lineTo(x2, y)
      canvas.drawPath(reusablePath, paint)
    }
    TextDecorationStyle.WAVY -> {
      val clamped = max(1f, thickness)
      val wavelength = 1f + 2f * (2f * clamped + 0.5f).roundToInt()
      val cpDistance = 0.5f + (3f * clamped + 0.5f).roundToInt()
      reusablePath.reset()
      reusablePath.moveTo(x1, y)
      var x = x1
      while (x < x2) {
        val midX = x + wavelength / 2f
        val endX = x + wavelength
        reusablePath.cubicTo(midX, y + cpDistance, midX, y - cpDistance, endX, y)
        x = endX
      }
      canvas.drawPath(reusablePath, paint)
    }
  }
}

/**
 * Shared decoration drawing entry point used by [ReactUnderlineSpan] and [ReactStrikethroughSpan].
 * Computes a density-aware stroke thickness, sets up a dedicated paint (to avoid mutating the
 * shared [Layout.getPaint]), iterates the visible lines of the run, and delegates each line to
 * [drawDecorationLine]. The caller-supplied [yOffsetForLine] computes the vertical position of the
 * decoration line on each visible line of text (underline vs strikethrough being the only
 * difference).
 */
internal fun drawSpannedDecoration(
    start: Int,
    end: Int,
    canvas: Canvas,
    layout: Layout,
    color: Int,
    style: TextDecorationStyle,
    yOffsetForLine: (paint: Paint, baseline: Float, thickness: Float) -> Float,
) {
  val textPaint = layout.paint
  val effectiveColor =
      if (color != Color.TRANSPARENT) {
        color
      } else {
        // Look up the actual foreground color at the span position. layout.paint
        // is the base paint whose color may differ from per-span foreground colors
        // applied via ForegroundColorSpan (e.g., link text, colored text).
        val spanned = layout.text as? Spanned
        val fgSpans = spanned?.getSpans(start, start + 1, ForegroundColorSpan::class.java)
        if (fgSpans != null && fgSpans.isNotEmpty()) fgSpans.last().foregroundColor
        else textPaint.color
      }
  val thickness =
      if (style == TextDecorationStyle.SOLID || style == TextDecorationStyle.DOUBLE) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          textPaint.underlineThickness
        } else {
          textPaint.fontMetrics.descent * 0.1f
        }
      } else {
        val minThickness = 1.5f * textPaint.density
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          max(textPaint.underlineThickness, minThickness)
        } else {
          max(textPaint.fontMetrics.descent * 0.1f, minThickness)
        }
      }

  decorationPaint.set(textPaint)
  decorationPaint.color = effectiveColor
  decorationPaint.strokeWidth = thickness
  decorationPaint.style = Paint.Style.STROKE
  decorationPaint.isAntiAlias = true

  if (style == TextDecorationStyle.DOTTED || style == TextDecorationStyle.DASHED) {
    val cache = if (style == TextDecorationStyle.DOTTED) dottedEffects else dashedEffects
    decorationPaint.pathEffect =
        cache.getOrPut(thickness) {
          val intervals =
              if (style == TextDecorationStyle.DOTTED) floatArrayOf(thickness, thickness * 2f)
              else floatArrayOf(thickness * 4f, thickness * 2f)
          DashPathEffect(intervals, 0f)
        }
  }

  val startLine = layout.getLineForOffset(start)
  val endLine = layout.getLineForOffset(end)
  for (line in startLine..endLine) {
    val baseline = layout.getLineBaseline(line).toFloat()
    val rawX1 =
        if (line == startLine) layout.getPrimaryHorizontal(start) else layout.getLineLeft(line)
    val rawX2 = if (line == endLine) layout.getPrimaryHorizontal(end) else layout.getLineRight(line)
    // Normalize for RTL text where start may be to the right of end.
    val x1 = min(rawX1, rawX2)
    val x2 = max(rawX1, rawX2)
    val y = yOffsetForLine(decorationPaint, baseline, thickness)
    drawDecorationLine(
        canvas,
        decorationPaint,
        x1,
        x2,
        y,
        thickness,
        textPaint.density,
        style,
        scratchPath,
    )
  }
}
