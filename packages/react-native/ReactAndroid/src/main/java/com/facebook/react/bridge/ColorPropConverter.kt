/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.content.Context
import android.content.res.Resources
import android.graphics.Color
import android.graphics.ColorSpace
import android.os.Build
import android.util.TypedValue
import androidx.annotation.ColorLong
import androidx.core.content.res.ResourcesCompat
import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants

public object ColorPropConverter {

  private fun supportWideGamut(): Boolean = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O

  private const val JSON_KEY = "resource_paths"
  private const val PREFIX_RESOURCE = "@"
  private const val PREFIX_ATTR = "?"
  private const val PACKAGE_DELIMITER = ":"
  private const val PATH_DELIMITER = "/"
  private const val ATTR = "attr"
  private const val ATTR_SEGMENT = "attr/"

  @Throws(JSApplicationCausedNativeException::class)
  private fun getColorInteger(value: Any?, context: Context): Int? {
    if (value == null) {
      return null
    }

    if (value is Double) {
      return value.toInt()
    }

    checkNotNull(context)

    if (value is ReadableMap) {
      if (value.hasKey("space")) {
        val r = (value.getDouble("r").toFloat() * 255).toInt()
        val g = (value.getDouble("g").toFloat() * 255).toInt()
        val b = (value.getDouble("b").toFloat() * 255).toInt()
        val a = (value.getDouble("a").toFloat() * 255).toInt()

        return Color.argb(a, r, g, b)
      }

      val resourcePaths =
          value.getArray(JSON_KEY)
              ?: throw JSApplicationCausedNativeException(
                  "ColorValue: The `$JSON_KEY` must be an array of color resource path strings."
              )

      for (i in 0 until resourcePaths.size()) {
        val result = resolveResourcePath(context, resourcePaths.getString(i))
        if (result != null) {
          return result
        }
      }

      val attemptedPaths = (0 until resourcePaths.size()).map { resourcePaths.getString(it) }
      FLog.w(
          ReactConstants.TAG,
          "ColorValue: Failed to resolve resource paths: ${attemptedPaths.joinToString(", ")}",
      )

      throw JSApplicationCausedNativeException(
          "ColorValue: None of the paths in the `$JSON_KEY` array resolved to a color resource."
      )
    }

    throw JSApplicationCausedNativeException("ColorValue: the value must be a number or Object.")
  }

  @JvmStatic
  @Throws(JSApplicationCausedNativeException::class)
  public fun getColorInstance(value: Any?, context: Context): Color? {
    if (value == null) {
      return null
    }

    if (supportWideGamut() && value is Double) {
      return Color.valueOf(value.toInt())
    }

    checkNotNull(context)

    if (value is ReadableMap) {
      if (supportWideGamut() && value.hasKey("space")) {
        val rawColorSpace = value.getString("space")
        val isDisplayP3 = rawColorSpace == "display-p3"
        val space =
            ColorSpace.get(if (isDisplayP3) ColorSpace.Named.DISPLAY_P3 else ColorSpace.Named.SRGB)

        val r = value.getDouble("r").toFloat()
        val g = value.getDouble("g").toFloat()
        val b = value.getDouble("b").toFloat()
        val a = value.getDouble("a").toFloat()

        @ColorLong val color = Color.pack(r, g, b, a, space)
        return Color.valueOf(color)
      }

      val resourcePaths =
          value.getArray(JSON_KEY)
              ?: throw JSApplicationCausedNativeException(
                  "ColorValue: The `$JSON_KEY` must be an array of color resource path strings."
              )

      for (i in 0 until resourcePaths.size()) {
        val result = resolveResourcePath(context, resourcePaths.getString(i))
        if (supportWideGamut() && result != null) {
          return Color.valueOf(result)
        }
      }

      val attemptedPaths = (0 until resourcePaths.size()).map { resourcePaths.getString(it) }
      FLog.w(
          ReactConstants.TAG,
          "ColorValue: Failed to resolve resource paths: ${attemptedPaths.joinToString(", ")}",
      )

      throw JSApplicationCausedNativeException(
          "ColorValue: None of the paths in the `$JSON_KEY` array resolved to a color resource."
      )
    }

    throw JSApplicationCausedNativeException("ColorValue: the value must be a number or Object.")
  }

  @JvmStatic
  @Throws(JSApplicationCausedNativeException::class)
  public fun getColor(value: Any?, context: Context): Int? {
    try {
      if (supportWideGamut()) {
        val color = getColorInstance(value, context)
        if (color != null) {
          return color.toArgb()
        }
      }
    } catch (ex: JSApplicationCausedNativeException) {
      FLog.w(ReactConstants.TAG, ex, "Error extracting color from WideGamut")
    }

    return getColorInteger(value, context)
  }

  @JvmStatic
  public fun getColor(value: Any?, context: Context, defaultInt: Int): Int {
    return try {
      getColor(value, context) ?: defaultInt
    } catch (e: JSApplicationCausedNativeException) {
      FLog.w(ReactConstants.TAG, e, "Error converting ColorValue")
      defaultInt
    }
  }

  @JvmStatic
  public fun resolveResourcePath(context: Context, resourcePath: String?): Int? {
    if (resourcePath.isNullOrEmpty()) {
      return null
    }

    val isResource = resourcePath.startsWith(PREFIX_RESOURCE)
    val isThemeAttribute = resourcePath.startsWith(PREFIX_ATTR)

    val path = resourcePath.substring(1)

    return try {
      when {
        isResource -> resolveResource(context, path)
        isThemeAttribute -> resolveThemeAttribute(context, path)
        else -> null
      }
    } catch (e: Resources.NotFoundException) {
      null
    }
  }

  private fun resolveResource(context: Context, resourcePath: String): Int {
    val pathTokens = resourcePath.split(PACKAGE_DELIMITER)
    var packageName = context.packageName
    var resource = resourcePath

    if (pathTokens.size > 1) {
      packageName = pathTokens[0]
      resource = pathTokens[1]
    }

    val resourceTokens = resource.split(PATH_DELIMITER)
    val resourceType = resourceTokens[0]
    val resourceName = resourceTokens[1]

    val resourceId = context.resources.getIdentifier(resourceName, resourceType, packageName)

    return ResourcesCompat.getColor(context.resources, resourceId, context.theme)
  }

  @Throws(Resources.NotFoundException::class)
  private fun resolveThemeAttribute(context: Context, resourcePath: String): Int {
    val path = resourcePath.replace(ATTR_SEGMENT, "")
    val pathTokens = path.split(PACKAGE_DELIMITER)

    var packageName = context.packageName
    var resourceName = path

    if (pathTokens.size > 1) {
      packageName = pathTokens[0]
      resourceName = pathTokens[1]
    }

    var resourceId = context.resources.getIdentifier(resourceName, ATTR, packageName)

    if (resourceId == 0) {
      resourceId = context.resources.getIdentifier(resourceName, ATTR, "android")
    }

    val outValue = TypedValue()
    val theme = context.theme

    if (theme.resolveAttribute(resourceId, outValue, true)) {
      return outValue.data
    }

    throw Resources.NotFoundException()
  }
}
