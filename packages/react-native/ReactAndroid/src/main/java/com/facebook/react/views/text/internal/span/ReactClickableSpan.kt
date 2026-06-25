/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Color
import android.text.TextPaint
import android.text.style.ClickableSpan
import android.view.View
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.UIManagerHelper
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
 *
 * then only one [ReactTextView] will be created, for the parent. The child Text component does not
 * exist as a native view, and therefore has no accessibility properties. Instead, we have to use
 * spans on the parent's [ReactTextView] to properly style the child, and to make it accessible
 * (TalkBack announces that the text has links available, and the links are exposed in the context
 * menu).
 */
internal class ReactClickableSpan(val reactTag: Int) : ClickableSpan(), ReactSpan {
  var isKeyboardFocused: Boolean = false
  var focusBgColor: Int = Color.TRANSPARENT

  override fun onClick(view: View) {
    val context = view.context as ReactContext
    val eventDispatcher = UIManagerHelper.getEventDispatcher(context)
    eventDispatcher?.dispatchEvent(
        ViewGroupClickEvent(UIManagerHelper.getSurfaceId(context), reactTag)
    )
  }

  override fun updateDrawState(ds: TextPaint) {
    // no super call so we don't change the link color or add an underline by default, as the
    // superclass does.
    if (isKeyboardFocused) {
      ds.bgColor = focusBgColor
    }
  }
}
