/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.text.TextPaint
import android.text.style.ClickableSpan
import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.views.text.PreparedLayoutTextView
import com.facebook.react.views.text.ReactTextView
import com.facebook.react.views.text.TextLayoutManager
import com.facebook.react.views.view.ViewGroupClickEvent

/**
 * This class is used in [TextLayoutManager] to linkify and style a span of text with
 * accessibilityRole="link". This is needed to make nested Text components accessible.
 *
 * For example, if your React component looks like this:
 * ```js
 * <Text>
 * Some text with
 * <Text onPress={onPress} accessible={true} accessibilityRole="link">a link</Text>
 * in the middle.
 * </Text>
 * ```
 */
@OptIn(UnstableReactNativeAPI::class)
internal class ReactLinkSpan(val fragmentIndex: Int) : ClickableSpan(), ReactSpan {
  override fun onClick(view: View) {
    val context = view.context as ReactContext
    val preparedLayout =
        when (view) {
          is PreparedLayoutTextView -> view.preparedLayout
          is ReactTextView -> view.preparedLayout
          else -> null
        } ?: return
    val reactTag = preparedLayout.reactTags[fragmentIndex]
    val eventDispatcher = UIManagerHelper.getEventDispatcher(context)
    eventDispatcher?.dispatchEvent(
        ViewGroupClickEvent(UIManagerHelper.getSurfaceId(context), reactTag)
    )
  }

  override fun updateDrawState(ds: TextPaint) {
    // no super call so we don't change the link color or add an underline by default, as the
    // superclass does.
  }
}
