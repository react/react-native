/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

import com.facebook.yoga.YogaNative.jni_YGConfigGetErrataJNI
import com.facebook.yoga.YogaNative.jni_YGConfigNewJNI
import com.facebook.yoga.YogaNative.jni_YGConfigSetErrataJNI
import com.facebook.yoga.YogaNative.jni_YGConfigSetExperimentalFeatureEnabledJNI
import com.facebook.yoga.YogaNative.jni_YGConfigSetLoggerJNI
import com.facebook.yoga.YogaNative.jni_YGConfigSetPointScaleFactorJNI
import com.facebook.yoga.YogaNative.jni_YGConfigSetUseWebDefaultsJNI

public abstract class YogaConfigJNIBase
private constructor(@JvmField protected var nativePointer: Long) : YogaConfig() {
  private var _logger: YogaLogger? = null

  init {
    check(nativePointer != 0L) { "Failed to allocate native memory" }
  }

  internal constructor() : this(jni_YGConfigNewJNI())

  internal constructor(useVanillaJNI: Boolean) : this(jni_YGConfigNewJNI())

  public override fun setExperimentalFeatureEnabled(
      feature: YogaExperimentalFeature,
      enabled: Boolean,
  ) {
    YogaNative.jni_YGConfigSetExperimentalFeatureEnabledJNI(
        nativePointer,
        feature.intValue(),
        enabled,
    )
  }

  public override fun setUseWebDefaults(useWebDefaults: Boolean) {
    YogaNative.jni_YGConfigSetUseWebDefaultsJNI(nativePointer, useWebDefaults)
  }

  public override fun setPointScaleFactor(pixelsInPoint: Float) {
    YogaNative.jni_YGConfigSetPointScaleFactorJNI(nativePointer, pixelsInPoint)
  }

  public override fun setErrata(errata: YogaErrata) {
    YogaNative.jni_YGConfigSetErrataJNI(nativePointer, errata.intValue())
  }

  public override fun setErrata(errata: Int) {
    YogaNative.jni_YGConfigSetErrataJNI(nativePointer, errata)
  }

  public override fun getErrata(): YogaErrata =
      YogaErrata.fromInt(YogaNative.jni_YGConfigGetErrataJNI(nativePointer))

  public override fun getErrataInt(): Int = YogaNative.jni_YGConfigGetErrataJNI(nativePointer)

  public override fun setLogger(logger: YogaLogger?) {
    _logger = logger
    YogaNative.jni_YGConfigSetLoggerJNI(nativePointer, logger)
  }

  public override fun getLogger(): YogaLogger? = _logger

  public override fun getNativePointer(): Long = nativePointer
}
