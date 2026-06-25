/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.style

import android.graphics.Shader

/**
 * Interface representing a CSS gradient that can be rendered as an Android Shader.
 *
 * Implementations of this interface (such as [LinearGradient] and [RadialGradient]) convert CSS
 * gradient definitions into Android Shader objects for rendering backgrounds.
 *
 * @see LinearGradient
 * @see RadialGradient
 */
internal interface Gradient {
  /**
   * Creates an Android Shader for rendering this gradient.
   *
   * @param width The width of the area to fill
   * @param height The height of the area to fill
   * @return A Shader instance configured for this gradient
   */
  fun getShader(width: Float, height: Float): Shader
}
