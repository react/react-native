/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public abstract class YogaConfig {
  public abstract fun setExperimentalFeatureEnabled(
      feature: YogaExperimentalFeature,
      enabled: Boolean,
  )

  public abstract fun setUseWebDefaults(useWebDefaults: Boolean)

  public abstract fun setPointScaleFactor(pixelsInPoint: Float)

  public abstract fun setErrata(errata: YogaErrata)

  /**
   * Sets the errata bitmask directly from an [Int]. Use this when combining multiple [YogaErrata]
   * values (e.g., `YogaErrata.CLASSIC.intValue() and
   * YogaErrata.STRETCH_FLEX_BASIS.intValue().inv()`) — the [YogaErrata] enum cannot represent
   * arbitrary bitmask combinations.
   */
  public abstract fun setErrata(errata: Int)

  public abstract fun getErrata(): YogaErrata

  /**
   * Returns the errata bitmask as a raw [Int]. Use this companion to [setErrata] (Int) when the
   * stored bitmask combines bits in a way the [YogaErrata] enum cannot represent — calling
   * [getErrata] in that case throws [IllegalArgumentException] from `YogaErrata.fromInt`.
   */
  public abstract fun getErrataInt(): Int

  public abstract fun setLogger(logger: YogaLogger?)

  public abstract fun getLogger(): YogaLogger?

  protected abstract fun getNativePointer(): Long

  public companion object {
    public var SPACING_TYPE: Int = 1
  }
}
