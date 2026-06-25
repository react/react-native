/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.Spanned

/** Class that contains the data needed for a text update. Used by both <Text/> and <TextInput/>. */
internal class ReactTextUpdate(
    public val text: Spanned,
    public val jsEventCounter: Int,
    public val textAlign: Int,
    public val textBreakStrategy: Int,
    public val justificationMode: Int,
) {
  public companion object {
    @JvmStatic
    public fun buildReactTextUpdateFromState(
        text: Spanned,
        jsEventCounter: Int,
        textAlign: Int,
        textBreakStrategy: Int,
        justificationMode: Int,
    ): ReactTextUpdate =
        ReactTextUpdate(
            text,
            jsEventCounter,
            textAlign,
            textBreakStrategy,
            justificationMode,
        )
  }
}
