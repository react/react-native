/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.imagehelper

import android.content.Context
import android.graphics.drawable.Drawable
import android.net.Uri
import androidx.core.content.res.ResourcesCompat
import javax.annotation.concurrent.ThreadSafe

/** Helper class for obtaining information about local images. */
@ThreadSafe
public object ResourceDrawableIdHelper {
  private val resourceDrawableIdMap: MutableMap<String, Int> = HashMap()

  @Synchronized
  @JvmStatic
  public fun clear() {
    resourceDrawableIdMap.clear()
  }

  @JvmStatic
  public fun getResourceDrawableId(context: Context, name: String?): Int {
    if (name.isNullOrEmpty()) {
      return 0
    }
    val normalizedName = name.lowercase().replace("-", "_")

    // name could be a resource id.
    try {
      return normalizedName.toInt()
    } catch (e: NumberFormatException) {
      // Do nothing.
    }

    synchronized(this) {
      return resourceDrawableIdMap.get(normalizedName) ?: addDrawableId(context, normalizedName)
    }
  }

  private fun addDrawableId(context: Context, normalizedName: String): Int {
    val newId = context.resources.getIdentifier(normalizedName, "drawable", context.packageName)
    resourceDrawableIdMap[normalizedName] = newId
    return newId
  }

  @JvmStatic
  public fun getResourceDrawable(context: Context, name: String?): Drawable? {
    val resId = getResourceDrawableId(context, name)
    return if (resId > 0) ResourcesCompat.getDrawable(context.resources, resId, null) else null
  }

  @JvmStatic
  public fun getResourceDrawableUri(context: Context, name: String?): Uri {
    val resId = getResourceDrawableId(context, name)
    return if (resId > 0) {
      Uri.Builder().scheme(LOCAL_RESOURCE_SCHEME).path(resId.toString()).build()
    } else {
      Uri.EMPTY
    }
  }

  @JvmStatic
  @Deprecated("Use object methods instead, this API is for backward compat")
  public val instance: ResourceDrawableIdHelper
    get() = this

  private const val LOCAL_RESOURCE_SCHEME = "res"

  /**
   * We're just re-adding this to reduce a breaking change for libraries in React Native 0.75.
   *
   * @deprecated Use instance instead
   */
  @Deprecated("Use .instance instead, this API is for backward compat", ReplaceWith("instance"))
  @JvmName(
      "DEPRECATED\$getInstance",
  ) // We intentionally don't want to expose this accessor to Java.
  public fun getInstance(): ResourceDrawableIdHelper = this
}
