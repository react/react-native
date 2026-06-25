/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.JSApplicationCausedNativeException
import com.facebook.react.bridge.ReadableMap

/**
 * Base class for different types of animation drivers. Can be used to implement simple time-based
 * animations as well as spring based animations.
 */
internal abstract class AnimationDriver {
  @JvmField internal var hasFinished = false
  @JvmField internal var animatedValue: ValueAnimatedNode? = null
  @JvmField internal var endCallback: Callback? = null
  @JvmField internal var id = 0

  /**
   * This method gets called in the main animation loop with a frame time passed down from the
   * android choreographer callback.
   */
  abstract fun runAnimationStep(frameTimeNanos: Long)

  /**
   * This method will get called when some of the configuration gets updated while the animation is
   * running. In that case animation should restart keeping its internal state to provide a smooth
   * transition. E.g. in case of a spring animation we want to keep the current value and speed and
   * start animating with the new properties (different destination or spring settings)
   */
  open fun resetConfig(config: ReadableMap) {
    throw JSApplicationCausedNativeException("Animation config for AnimationDriver cannot be reset")
  }
}
