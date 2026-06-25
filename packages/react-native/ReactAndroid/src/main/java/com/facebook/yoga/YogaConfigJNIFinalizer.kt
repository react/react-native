/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.yoga

public class YogaConfigJNIFinalizer public constructor() : YogaConfigJNIBase() {

  /*
   * This is a valid use of finalize. No other mechanism is appropriate.
   * YogaConfigJNIFinalizer exists specifically to release JNI-allocated native
   * memory (via jni_YGConfigFreeJNI) when the Java object is garbage collected.
   * This is the established pattern for JNI prevented leak classes in Yoga.
   */
  @Throws(Throwable::class)
  protected fun finalize() {
    freeNatives()
  }

  public fun freeNatives() {
    if (nativePointer != 0L) {
      val pointer = nativePointer
      nativePointer = 0
      YogaNative.jni_YGConfigFreeJNI(pointer)
    }
  }
}
