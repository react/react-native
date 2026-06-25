/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public class YogaNodeJNIFinalizer : YogaNodeJNIBase {
  public constructor() : super()

  public constructor(config: YogaConfig) : super(config)

  /*
   * This is a valid use of finalize. No other mechanism is appropriate.
   * YogaNodeJNIFinalizer exists specifically to release JNI-allocated native
   * memory (via jni_YGNodeFinalizeJNI) when the Java object is garbage collected.
   * This is the established pattern for JNI prevented leak classes in Yoga.
   */
  @Throws(Throwable::class)
  protected fun finalize() {
    freeNatives()
  }

  public fun freeNatives() {
    if (nativePointer != 0L) {
      val nativePtr = nativePointer
      nativePointer = 0
      YogaNative.jni_YGNodeFinalizeJNI(nativePtr)
    }
  }
}
