/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.common

import android.view.View
import com.facebook.react.common.annotations.internal.LegacyArchitecture

/**
 * Utility object providing helper methods for working with React Native views.
 *
 * This object contains utilities for determining which UIManager (Legacy/Paper or Fabric) a view
 * belongs to, based on view tags and surface IDs. These utilities are essential for routing events
 * and operations to the correct UIManager implementation.
 *
 * @see UIManagerType
 */
public object ViewUtil {

  /**
   * Constant representing the absence of a surface ID.
   *
   * This value (-1) is used as a placeholder when no surface ID is available, typically indicating
   * that the view or event originated from the legacy (Paper) UIManager rather than Fabric.
   */
  public const val NO_SURFACE_ID: Int = -1

  /**
   * Counter for uniquely identifying views. - % 2 === 0 means it is a Fabric tag. See
   * https://github.com/facebook/react/pull/12587
   *
   * @param viewTag tag of the view this is event is dispatched to
   * @deprecated Fabric is now the only supported UIManager. This method always returns
   *   [UIManagerType.FABRIC].
   */
  @Deprecated(
      "Fabric is now the only supported UIManager. This method always returns UIManagerType.FABRIC.",
      ReplaceWith("UIManagerType.FABRIC"),
  )
  @LegacyArchitecture
  @JvmStatic
  @UIManagerType
  public fun getUIManagerType(viewTag: Int): Int = UIManagerType.FABRIC

  /**
   * Overload for [getUIManagerType] that uses the view's id to determine if it originated from
   * Fabric
   *
   * @deprecated Fabric is now the only supported UIManager. This method always returns
   *   [UIManagerType.FABRIC].
   */
  @Deprecated(
      "Fabric is now the only supported UIManager. This method always returns UIManagerType.FABRIC.",
      ReplaceWith("UIManagerType.FABRIC"),
  )
  @LegacyArchitecture
  @JvmStatic
  @UIManagerType
  public fun getUIManagerType(view: View): Int = UIManagerType.FABRIC

  /**
   * Version of getUIManagerType that uses both surfaceId and viewTag heuristics
   *
   * @param viewTag tag of the view this is event is dispatched to
   * @param surfaceId ID of the corresponding surface
   * @deprecated Fabric is now the only supported UIManager. This method always returns
   *   [UIManagerType.FABRIC].
   */
  @Deprecated(
      "Fabric is now the only supported UIManager. This method always returns UIManagerType.FABRIC.",
      ReplaceWith("UIManagerType.FABRIC"),
  )
  @LegacyArchitecture
  @Suppress("UNUSED_PARAMETER")
  @JvmStatic
  @UIManagerType
  public fun getUIManagerType(viewTag: Int, surfaceId: Int): Int = UIManagerType.FABRIC

  /**
   * @param viewTag react tag
   * @return if the react tag received by parameter is a RootTag or not.
   */
  @Deprecated(
      "You should not check the tag of the view to inspect if it's the rootTag. " +
          "Relying on this logic could make your app/library break in the future.",
      ReplaceWith(""),
  )
  @JvmStatic
  public fun isRootTag(viewTag: Int): Boolean = viewTag % 10 == 1
}
