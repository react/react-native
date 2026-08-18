/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.content.Context
import android.util.DisplayMetrics
import android.util.TypedValue
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import kotlin.math.min

/** Android dp to pixel manipulation */
public object PixelUtil {
  /**
   * Convert from DIP to PX, using [metrics] instead of the process-wide
   * [DisplayMetricsHolder].
   *
   * The holder always tracks the device's primary display, so on a surface attached to a display
   * with a different density (Samsung DeX, desktop mode, an external monitor, a freeform window)
   * only metrics derived from that display produce conversions that agree with the surface's
   * `pointScaleFactor`.
   */
  @JvmStatic
  public fun toPixelFromDIP(value: Float, metrics: DisplayMetrics): Float {
    if (value.isNaN()) {
      return Float.NaN
    }

    return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, metrics)
  }

  /** Convert from DIP to PX */
  @JvmStatic
  public fun toPixelFromDIP(value: Float): Float =
      toPixelFromDIP(value, DisplayMetricsHolder.getScreenDisplayMetrics())

  /** Convert from DIP to PX */
  @JvmStatic
  public fun toPixelFromDIP(value: Double): Float {
    return toPixelFromDIP(value.toFloat())
  }

  /** Convert from SP to PX, using [metrics] instead of the process-wide [DisplayMetricsHolder]. */
  @JvmStatic
  public fun toPixelFromSP(value: Float, maxFontScale: Float, metrics: DisplayMetrics): Float {
    if (value.isNaN()) {
      return Float.NaN
    }

    val scaledValue = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, value, metrics)

    if (maxFontScale >= 1) {
      return min(scaledValue, value * metrics.density * maxFontScale)
    }

    return scaledValue
  }

  /** Convert from SP to PX */
  @JvmOverloads
  @JvmStatic
  public fun toPixelFromSP(value: Float, maxFontScale: Float = Float.NaN): Float =
      toPixelFromSP(value, maxFontScale, DisplayMetricsHolder.getScreenDisplayMetrics())

  /** Convert from SP to PX */
  @JvmStatic
  public fun toPixelFromSP(value: Double): Float {
    return toPixelFromSP(value.toFloat())
  }

  /** Convert from PX to DP, using [metrics] instead of the process-wide [DisplayMetricsHolder]. */
  @JvmStatic
  public fun toDIPFromPixel(value: Float, metrics: DisplayMetrics): Float {
    if (value.isNaN()) {
      return Float.NaN
    }

    return value / metrics.density
  }

  /** Convert from PX to DP */
  @JvmStatic
  public fun toDIPFromPixel(value: Float): Float =
      toDIPFromPixel(value, DisplayMetricsHolder.getScreenDisplayMetrics())

  /** @return [Float] that represents the density of the display metrics for device screen. */
  @JvmStatic
  public fun getDisplayMetricDensity(): Float =
      DisplayMetricsHolder.getScreenDisplayMetrics().density

  /**
   * Builds a [DisplayMetrics] describing a display with the given [density] and system font scale.
   *
   * Only the fields consumed by [TypedValue.applyDimension] and by the conversions above are
   * meaningful; this is a scale descriptor, not a description of a physical display.
   */
  @JvmStatic
  @Suppress("DEPRECATION") // DisplayMetrics.scaledDensity
  public fun displayMetricsFor(density: Float, fontScale: Float): DisplayMetrics {
    return DisplayMetrics().apply {
      this.density = density
      this.scaledDensity = density * fontScale
      this.densityDpi = (density * DisplayMetrics.DENSITY_DEFAULT).toInt()
      this.xdpi = density * DisplayMetrics.DENSITY_DEFAULT
      this.ydpi = density * DisplayMetrics.DENSITY_DEFAULT
    }
  }

  /**
   * The [DisplayMetrics] conversions on the mounting side should use for a view living in
   * [context].
   *
   * A themed React context wraps the Activity, so its resources describe the display the surface is
   * actually on — the same display [com.facebook.react.runtime.ReactSurfaceImpl] took the surface's
   * `pointScaleFactor` from. [DisplayMetricsHolder] instead always describes the primary display,
   * so the two disagree whenever the surface is on a secondary one.
   *
   * Returns the holder's metrics while `enablePerSurfaceTextScaleAndroid` is off, preserving the
   * previous behaviour exactly.
   */
  @JvmStatic
  public fun displayMetricsOf(context: Context): DisplayMetrics =
      if (ReactNativeFeatureFlags.enablePerSurfaceTextScaleAndroid()) {
        context.resources.displayMetrics
      } else {
        DisplayMetricsHolder.getScreenDisplayMetrics()
      }

  /* Kotlin extensions */
  @Deprecated("Use the dpToPx(DisplayMetrics) overload, so conversions match the view's display.")
  public fun Int.dpToPx(): Float = toPixelFromDIP(this.toFloat())

  @Deprecated("Use the dpToPx(DisplayMetrics) overload, so conversions match the view's display.")
  public fun Long.dpToPx(): Float = toPixelFromDIP(this.toFloat())

  @Deprecated("Use the dpToPx(DisplayMetrics) overload, so conversions match the view's display.")
  public fun Float.dpToPx(): Float = toPixelFromDIP(this)

  @Deprecated("Use the dpToPx(DisplayMetrics) overload, so conversions match the view's display.")
  public fun Double.dpToPx(): Float = toPixelFromDIP(this.toFloat())

  @Deprecated("Use the pxToDp(DisplayMetrics) overload, so conversions match the view's display.")
  public fun Int.pxToDp(): Float = toDIPFromPixel(this.toFloat())

  @Deprecated("Use the pxToDp(DisplayMetrics) overload, so conversions match the view's display.")
  public fun Long.pxToDp(): Float = toDIPFromPixel(this.toFloat())

  @Deprecated("Use the pxToDp(DisplayMetrics) overload, so conversions match the view's display.")
  public fun Float.pxToDp(): Float = toDIPFromPixel(this)

  @Deprecated("Use the pxToDp(DisplayMetrics) overload, so conversions match the view's display.")
  public fun Double.pxToDp(): Float = toDIPFromPixel(this.toFloat())

  public fun Int.dpToPx(metrics: DisplayMetrics): Float = toPixelFromDIP(this.toFloat(), metrics)

  public fun Long.dpToPx(metrics: DisplayMetrics): Float = toPixelFromDIP(this.toFloat(), metrics)

  public fun Float.dpToPx(metrics: DisplayMetrics): Float = toPixelFromDIP(this, metrics)

  public fun Double.dpToPx(metrics: DisplayMetrics): Float = toPixelFromDIP(this.toFloat(), metrics)

  public fun Int.pxToDp(metrics: DisplayMetrics): Float = toDIPFromPixel(this.toFloat(), metrics)

  public fun Long.pxToDp(metrics: DisplayMetrics): Float = toDIPFromPixel(this.toFloat(), metrics)

  public fun Float.pxToDp(metrics: DisplayMetrics): Float = toDIPFromPixel(this, metrics)

  public fun Double.pxToDp(metrics: DisplayMetrics): Float = toDIPFromPixel(this.toFloat(), metrics)
}
