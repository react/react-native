/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

namespace facebook::react {

/**
 * Helper for constructing a JWeakReference. \see JWeakReference.h in fbjni.
 */
template <typename T>
inline jni::local_ref<jni::JWeakReference<T>> makeJWeakReference(
    jni::alias_ref<T> ref) {
  return jni::JWeakReference<T>::newInstance(ref);
}

} // namespace facebook::react
