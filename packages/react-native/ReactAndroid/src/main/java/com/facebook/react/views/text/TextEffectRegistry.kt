/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.views.text.internal.span.TextEffectSpan
import java.util.concurrent.ConcurrentHashMap

@UnstableReactNativeAPI
public class TextEffectRegistry {
  private val factories = ConcurrentHashMap<String, TextEffectSpanFactory>()

  public fun register(name: String, factory: TextEffectSpanFactory) {
    factories[name] = factory
    current = this
  }

  public fun unregister(name: String) {
    factories.remove(name)
  }

  internal fun createSpan(name: String, props: ReadableMap?): TextEffectSpan? {
    val factory = factories[name] ?: return null
    return try {
      factory.createSpan(props)
    } catch (t: Throwable) {
      // A throwing factory (e.g. invalid color prop) must not break the entire text render path
      // for an unrelated paragraph or for subsequent renders. Skip this span and keep going.
      FLog.e(TAG, "TextEffectSpanFactory '$name' threw — skipping span", t)
      null
    }
  }

  public companion object {
    private const val TAG = "TextEffectRegistry"
    @JvmField @Volatile public var current: TextEffectRegistry? = null
  }
}
