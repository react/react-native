/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.views.text.internal.span.TextEffectSpan

@UnstableReactNativeAPI
public fun interface TextEffectSpanFactory {
  public fun createSpan(props: ReadableMap?): TextEffectSpan
}
