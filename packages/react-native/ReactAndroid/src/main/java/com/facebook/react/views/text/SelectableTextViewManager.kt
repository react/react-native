/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import com.facebook.react.common.annotations.UnstableReactNativeAPI

/**
 * A [ReactTextViewManager] registered under the name "RCTSelectableText". Used to route selectable
 * text through [ReactTextView] (a real [android.widget.TextView]) instead of
 * [PreparedLayoutTextView] when enablePreparedTextLayout is on, since [PreparedLayoutTextView] does
 * not support native text selection.
 */
@UnstableReactNativeAPI
public class SelectableTextViewManager
@JvmOverloads
public constructor(reactTextViewManagerCallback: ReactTextViewManagerCallback? = null) :
    ReactTextViewManager(reactTextViewManagerCallback) {

  override fun getName(): String = REACT_CLASS

  public companion object {
    public const val REACT_CLASS: String = "RCTSelectableText"
  }
}
