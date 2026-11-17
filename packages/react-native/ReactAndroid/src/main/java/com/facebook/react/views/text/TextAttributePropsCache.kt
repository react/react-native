/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import androidx.annotation.VisibleForTesting
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.common.mapbuffer.ReadableMapBuffer
import com.facebook.react.uimanager.DisplayMetricsHolder

/**
 * Reuses the [TextAttributeProps] parsed for text attributes that arrive serialized exactly as
 * before. Fragments across paragraphs share a handful of styles, so most text attributes that
 * [TextLayoutManager] parses were parsed already.
 *
 * Parsing depends only on the serialized attributes and on the display metrics (font sizes are
 * converted to pixels while parsing), so the cache is dropped when density or font scale change.
 * [TextAttributeProps] has no public setters, which makes sharing an instance safe.
 *
 * Owned by the FabricUIManager, and used from the threads it measures text on.
 */
internal class TextAttributePropsCache(private val maxSize: Int = DEFAULT_MAX_SIZE) {

  private class SerializedAttributes(val bytes: ByteArray) {
    private val hash = bytes.contentHashCode()

    override fun hashCode(): Int = hash

    override fun equals(other: Any?): Boolean =
        other is SerializedAttributes && hash == other.hash && bytes.contentEquals(other.bytes)
  }

  private val entries =
      object : LinkedHashMap<SerializedAttributes, TextAttributeProps>(16, 0.75f, true) {
        override fun removeEldestEntry(
            eldest: MutableMap.MutableEntry<SerializedAttributes, TextAttributeProps>?
        ): Boolean = size > maxSize
      }
  private var density = 0f
  private var scaledDensity = 0f

  /** Same as `TextAttributeProps.fromMapBuffer(parent.getMapBuffer(key))`. */
  fun get(parent: MapBuffer, key: Int): TextAttributeProps =
      if (parent is ReadableMapBuffer) {
        getOrParse(parent.getMapBufferBytes(key)) {
          TextAttributeProps.fromMapBuffer(parent.getMapBuffer(key))
        }
      } else {
        TextAttributeProps.fromMapBuffer(parent.getMapBuffer(key))
      }

  @VisibleForTesting
  internal fun getOrParse(bytes: ByteArray, parse: () -> TextAttributeProps): TextAttributeProps {
    val serialized = SerializedAttributes(bytes)
    val metrics = DisplayMetricsHolder.getScreenDisplayMetrics()
    val currentDensity = metrics.density
    @Suppress("DEPRECATION") val currentScaledDensity = metrics.scaledDensity
    synchronized(entries) {
      if (currentDensity != density || currentScaledDensity != scaledDensity) {
        entries.clear()
        density = currentDensity
        scaledDensity = currentScaledDensity
      }
      entries[serialized]?.let {
        return it
      }
    }
    val result = parse()
    // Only keep the result if the metrics it may have been parsed with are still the current ones.
    val metricsAfter = DisplayMetricsHolder.getScreenDisplayMetrics()
    @Suppress("DEPRECATION")
    val unchanged =
        metricsAfter.density == currentDensity && metricsAfter.scaledDensity == currentScaledDensity
    if (unchanged) {
      synchronized(entries) {
        if (currentDensity == density && currentScaledDensity == scaledDensity) {
          entries[serialized] = result
        }
      }
    }
    return result
  }

  private companion object {
    // Enough for the distinct text styles on a screen. An entry holds the serialized attributes
    // (usually 100-250 bytes) and the parsed TextAttributeProps, so about 0.5 KB.
    const val DEFAULT_MAX_SIZE = 64
  }
}
