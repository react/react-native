/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import com.facebook.react.common.annotations.UnstableReactNativeAPI

/**
 * Marker interface for spans that hold per-view mutable state (e.g. animation particles, dismiss
 * flags). When a [PreparedLayout] contains stateful spans, [PreparedLayoutTextView] clones the
 * spannable so that each view gets independent state even when layouts are shared from a cache.
 */
@UnstableReactNativeAPI
public interface StatefulSpan : TextEffectSpan {
  /** Returns a fresh instance with the same configuration but independent mutable state. */
  public fun clone(): StatefulSpan
}
