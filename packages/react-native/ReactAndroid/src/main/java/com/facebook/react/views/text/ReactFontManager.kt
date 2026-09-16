/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.Context
import android.content.res.AssetManager
import android.graphics.Typeface
import com.facebook.react.common.assets.ReactFontManager as ReactFontAssetManager

/** Responsible for loading and caching Typeface objects. */
@Deprecated(
    message =
        "This class is deprecated and will be deleted in the near future. Please use [com.facebook.react.common.assets.ReactFontManager] instead.",
)
@Suppress("DEPRECATION")
public class ReactFontManager private constructor(private val delegate: ReactFontAssetManager) {

  public fun getTypeface(fontFamilyName: String, style: Int, assetManager: AssetManager): Typeface =
      delegate.getTypeface(fontFamilyName, style, assetManager)

  public fun getTypeface(
      fontFamilyName: String,
      weight: Int,
      italic: Boolean,
      assetManager: AssetManager,
  ): Typeface = delegate.getTypeface(fontFamilyName, weight, italic, assetManager)

  public fun getTypeface(
      fontFamilyName: String,
      style: Int,
      weight: Int,
      assetManager: AssetManager,
  ): Typeface = delegate.getTypeface(fontFamilyName, style, weight, assetManager)

  public fun addCustomFont(context: Context, fontFamily: String, fontId: Int) {
    delegate.addCustomFont(context, fontFamily, fontId)
  }

  public fun addCustomFont(fontFamily: String, font: Typeface?) {
    delegate.addCustomFont(fontFamily, font)
  }

  public fun setTypeface(fontFamilyName: String, style: Int, typeface: Typeface) {
    delegate.setTypeface(fontFamilyName, style, typeface)
  }

  public companion object {
    private var instance: ReactFontManager? = null

    @JvmStatic
    public fun getInstance(): ReactFontManager {
      return instance
          ?: ReactFontManager(ReactFontAssetManager.getInstance()).also { instance = it }
    }
  }
}
