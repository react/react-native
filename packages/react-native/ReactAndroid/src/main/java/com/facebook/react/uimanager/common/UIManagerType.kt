/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.common

import androidx.annotation.IntDef

/**
 * Annotation class that defines the type of UIManager being used in React Native.
 *
 * This annotation is used to distinguish between the legacy UIManager implementation and the newer
 * Fabric renderer. It helps ensure type safety when working with UIManager-related code by
 * restricting values to the defined constants.
 *
 * @see UIManagerType.LEGACY for legacy (Paper) UIManager
 * @see UIManagerType.FABRIC for Fabric renderer
 */
@Retention(AnnotationRetention.SOURCE)
@Suppress("DEPRECATION")
@IntDef(UIManagerType.DEFAULT, UIManagerType.LEGACY, UIManagerType.FABRIC)
public annotation class UIManagerType {
  public companion object {
    /**
     * Default UIManager type. Equivalent to [LEGACY].
     *
     * @deprecated Use [LEGACY] instead.
     */
    @Deprecated(
        "UIManagerType.DEFAULT will be deleted in the next release of React Native. Use [LEGACY] instead."
    )
    public const val DEFAULT: Int = 1

    /** Represents the legacy (Paper) UIManager implementation. */
    public const val LEGACY: Int = 1

    /**
     * Represents the Fabric renderer, React Native's new rendering system that provides improved
     * performance and better integration with the host platform.
     */
    public const val FABRIC: Int = 2
  }
}
