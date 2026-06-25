/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.assets

import android.content.Context
import android.content.res.AssetManager
import android.graphics.Typeface
import android.os.Build
import android.util.SparseArray
import androidx.core.content.res.ResourcesCompat
import com.facebook.react.common.ReactConstants

/**
 * Responsible for loading and caching Typeface objects.
 *
 * This will first try to load a typeface from the assets/fonts folder. If one is not found in that
 * folder, this will fallback to the best matching system typeface.
 *
 * Custom fonts support the extensions `.ttf` and `.otf` and the variants `bold`, `italic`, and
 * `bold_italic`. For example, given a font named "ExampleFontFamily", the following are supported:
 * * ExampleFontFamily.ttf (or .otf)
 * * ExampleFontFamily_bold.ttf (or .otf)
 * * ExampleFontFamily_italic.ttf (or .otf)
 * * ExampleFontFamily_bold_italic.ttf (or .otf)
 */
public class ReactFontManager {

  private val fontCache: MutableMap<String, AssetFontFamily> = mutableMapOf()
  private val customTypefaceCache: MutableMap<String, Typeface> = mutableMapOf()

  /** The set of font family names that have been registered via [addCustomFont]. */
  public val customFontFamilies: Set<String>
    get() = customTypefaceCache.keys.toSet()

  public fun getTypeface(
      fontFamilyName: String,
      style: Int,
      assetManager: AssetManager?,
  ): Typeface = getTypeface(fontFamilyName, TypefaceStyle(style), assetManager)

  public fun getTypeface(
      fontFamilyName: String,
      weight: Int,
      italic: Boolean,
      assetManager: AssetManager?,
  ): Typeface = getTypeface(fontFamilyName, TypefaceStyle(weight, italic), assetManager)

  public fun getTypeface(
      fontFamilyName: String,
      style: Int,
      weight: Int,
      assetManager: AssetManager?,
  ): Typeface = getTypeface(fontFamilyName, TypefaceStyle(style, weight), assetManager)

  public fun getTypeface(
      fontFamilyName: String,
      typefaceStyle: TypefaceStyle,
      assetManager: AssetManager?,
  ): Typeface {
    if (customTypefaceCache.containsKey(fontFamilyName)) {
      // Apply `typefaceStyle` because custom fonts configure variants using `app:fontStyle` and
      // `app:fontWeight` in their resource XML configuration file.
      return typefaceStyle.apply(customTypefaceCache[fontFamilyName])
    }

    val assetFontFamily = fontCache.getOrPut(fontFamilyName) { AssetFontFamily() }
    val style = typefaceStyle.nearestStyle
    return assetFontFamily.getTypefaceForStyle(style)
        ?: createAssetTypeface(fontFamilyName, style, assetManager).also {
          assetFontFamily.setTypefaceForStyle(style, it)
        }
  }

  /*
   * This method allows you to load custom fonts from res/font folder as provided font family name.
   * Fonts may be one of .ttf, .otf or XML (https://developer.android.com/guide/topics/ui/look-and-feel/fonts-in-xml).
   * To support multiple font styles or weights, you must provide a font in XML format.
   *
   * ReactFontManager.getInstance().addCustomFont(this, "Srisakdi", R.font.srisakdi);
   */
  public fun addCustomFont(context: Context, fontFamily: String, fontId: Int): Unit {
    addCustomFont(fontFamily, ResourcesCompat.getFont(context, fontId))
  }

  /**
   * Equivalent method to {@see addCustomFont(Context, String, int)} which accepts a Typeface
   * object.
   */
  public fun addCustomFont(fontFamily: String, font: Typeface?): Unit {
    if (font != null) {
      customTypefaceCache[fontFamily] = font
    }
  }

  /**
   * Add additional font family, or replace the exist one in the font memory cache.
   *
   * @see [Typeface.DEFAULT]
   * @see [Typeface.BOLD]
   * @see [Typeface.ITALIC]
   * @see [Typeface.BOLD_ITALIC]
   */
  public fun setTypeface(fontFamilyName: String, style: Int, typeface: Typeface?): Unit {
    if (typeface != null) {
      fontCache.getOrPut(fontFamilyName) { AssetFontFamily() }.setTypefaceForStyle(style, typeface)
    }
  }

  /** Responsible for normalizing style and numeric weight for backward compatibility. */
  public class TypefaceStyle {
    private val italic: Boolean
    private val weight: Int

    public constructor(weight: Int, italic: Boolean) {
      this.italic = italic
      this.weight = if (weight == ReactConstants.UNSET) NORMAL else weight
    }

    /**
     * If `weight` is supplied, it will be combined with the italic bit from `style`. Otherwise, any
     * existing weight bit in `style` will be used.
     */
    @JvmOverloads
    public constructor(style: Int, weight: Int = ReactConstants.UNSET) {
      val fixedStyle = if (style == ReactConstants.UNSET) Typeface.NORMAL else style
      italic = (fixedStyle and Typeface.ITALIC) != 0
      this.weight =
          if (weight == ReactConstants.UNSET)
              (if ((fixedStyle and Typeface.BOLD) != 0) BOLD else NORMAL)
          else weight
    }

    public val nearestStyle: Int
      get() =
          if (weight < BOLD) {
            if (italic) Typeface.ITALIC else Typeface.NORMAL
          } else {
            if (italic) Typeface.BOLD_ITALIC else Typeface.BOLD
          }

    public fun apply(typeface: Typeface?): Typeface =
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
          Typeface.create(typeface, nearestStyle)
        } else {
          Typeface.create(typeface, weight, italic)
        }

    public companion object {
      public const val BOLD: Int = 700
      public const val NORMAL: Int = 400
    }
  }

  public companion object {

    // NOTE: Indices in `EXTENSIONS` correspond to the `TypeFace` style constants.
    private val EXTENSIONS = arrayOf("", "_bold", "_italic", "_bold_italic")
    private val FILE_EXTENSIONS = arrayOf(".ttf", ".otf")
    private const val FONTS_ASSET_PATH = "fonts/"

    private val _instance = ReactFontManager()

    @JvmStatic public fun getInstance(): ReactFontManager = _instance

    private fun createAssetTypeface(
        fontFamilyName: String,
        style: Int,
        assetManager: AssetManager?,
    ): Typeface {
      if (assetManager != null) {
        val extension = EXTENSIONS[style]
        for (fileExtension in FILE_EXTENSIONS) {
          val fileName = "$FONTS_ASSET_PATH$fontFamilyName$extension$fileExtension"
          try {
            return Typeface.createFromAsset(assetManager, fileName)
          } catch (e: RuntimeException) {
            // If the typeface asset does not exist, try another extension.
            continue
          }
        }
      }
      return Typeface.create(fontFamilyName, style)
    }
  }

  /** Responsible for caching typefaces for each custom font family. */
  private class AssetFontFamily {
    private val typefaceSparseArray: SparseArray<Typeface?> = SparseArray(4)

    fun getTypefaceForStyle(style: Int): Typeface? = typefaceSparseArray[style]

    fun setTypefaceForStyle(style: Int, typeface: Typeface?) {
      typefaceSparseArray.put(style, typeface)
    }
  }
}
