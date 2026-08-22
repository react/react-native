/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.os.Build
import android.text.StaticLayout
import android.widget.TextView
import androidx.annotation.VisibleForTesting
import com.facebook.react.util.AndroidVersion
import java.lang.reflect.Method

/**
 * Android 15 (API 35) added StaticLayout / TextView APIs that keep start-side glyph ink from being
 * clipped when it extends past the advance box (common for Arabic alef-madda / alef-wasla at an RTL
 * line start).
 *
 * Reflection is required because some internal targets compile against an SDK older than 35, so we
 * cannot call [StaticLayout.Builder.setUseBoundsForWidth] or
 * [StaticLayout.Builder.setShiftDrawingOffsetForStartOverhang] directly.
 *
 * These setters change how StaticLayout uses visual bounds for wrapping and drawing. They do not
 * implement the two-pass AT_MOST/UNDEFINED width expansion that was previously tried and reverted.
 */
internal object AndroidTextStartOverhangCompat {

  // Looked up only on API 35+, so a missing method does not throw on older devices.
  private val builderSetters: Pair<Method?, Method?> by lazy {
    Pair(
        optionalBooleanSetter(StaticLayout.Builder::class.java, "setUseBoundsForWidth"),
        optionalBooleanSetter(
            StaticLayout.Builder::class.java,
            "setShiftDrawingOffsetForStartOverhang",
        ),
    )
  }

  private val textViewSetters: Pair<Method?, Method?> by lazy {
    Pair(
        optionalBooleanSetter(TextView::class.java, "setUseBoundsForWidth"),
        optionalBooleanSetter(TextView::class.java, "setShiftDrawingOffsetForStartOverhang"),
    )
  }

  @JvmStatic
  fun applyToBuilder(builder: StaticLayout.Builder) {
    if (Build.VERSION.SDK_INT < AndroidVersion.VERSION_CODE_VANILLA_ICE_CREAM) {
      return
    }
    val (useBoundsForWidth, shiftDrawingOffset) = builderSetters
    invokeBooleanSetter(useBoundsForWidth, builder, true)
    invokeBooleanSetter(shiftDrawingOffset, builder, true)
  }

  @JvmStatic
  fun applyToTextView(textView: TextView) {
    if (Build.VERSION.SDK_INT < AndroidVersion.VERSION_CODE_VANILLA_ICE_CREAM) {
      return
    }
    val (useBoundsForWidth, shiftDrawingOffset) = textViewSetters
    invokeBooleanSetter(useBoundsForWidth, textView, true)
    invokeBooleanSetter(shiftDrawingOffset, textView, true)
  }

  @VisibleForTesting
  internal fun builderStartOverhangApisAvailable(): Boolean {
    val (useBoundsForWidth, shiftDrawingOffset) = builderSetters
    return useBoundsForWidth != null && shiftDrawingOffset != null
  }

  private fun optionalBooleanSetter(clazz: Class<*>, name: String): Method? =
      try {
        clazz.getMethod(name, Boolean::class.javaPrimitiveType)
      } catch (_: ReflectiveOperationException) {
        null
      }

  private fun invokeBooleanSetter(method: Method?, target: Any, value: Boolean) {
    if (method == null) {
      return
    }
    try {
      method.invoke(target, value)
    } catch (_: ReflectiveOperationException) {
      // Runtime image may not match the looked-up API (for example, a preview stub).
    }
  }
}
