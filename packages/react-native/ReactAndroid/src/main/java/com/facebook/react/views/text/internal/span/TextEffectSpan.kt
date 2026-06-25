/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

/**
 * Marker interface implemented by every span that may be returned from a
 * [com.facebook.react.views.text.TextEffectSpanFactory]. Constraining the factory's return type to
 * this interface means a `List` (or any other non-span value) is rejected at compile time, which
 * was previously possible because the contract was typed as `Any`.
 *
 * Built-in span families ([CanvasEffectSpan], [StatefulSpan], including [AnimatedEffectSpan])
 * implement this directly so that user spans extending them satisfy the contract automatically.
 */
public interface TextEffectSpan
