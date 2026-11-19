/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jni.h> // @manual=fbsource//xplat/yoga/lib/jni:jni
#include <cstddef>
#include <type_traits>
#include "corefunctions.h"

namespace facebook::yoga::vanillajni {

/**
 * ScopedGlobalRef is a sort of smart reference that allows us to control the
 * lifespan of a JNI global reference.
 *
 * This class is designed so that when a ScopedGlobalRef goes out of scoped, its
 * destructor will delete -JNIEnv->DeleteGlobalRef()- the underlying JNI
 * reference.
 *
 * This class should be used to wrap all the global references we create during
 * normal JNI operations if we want reference to eventually go away (in JNI it
 * is a common operation to cache some global references throughout the lifespan
 * of a process, in which case using this class does not really make sense). The
 * idea behind this is that in JNI we should be very explicit about the lifespan
 * of global references. Global references can quickly get out of control if not
 * freed properly, and the developer should always be very aware of the lifespan
 * of each global reference that is created in JNI so that leaks are prevented.
 *
 * This class is very explicit in its behavior, and it does not allow to perform
 * unexpected conversions or unexpected ownership transfer. In practice, this
 * class acts as a unique pointer where the underlying JNI reference can have
 * one and just one owner. Transferring ownership is allowed but it is an
 * explicit operation (implemented via move semantics and also via explicitly
 * API calls).
 *
 * Note that this class doesn't receive an explicit JNIEnv at construction time.
 * At destruction time it uses vanillajni::getCurrentEnv() to retrieve the
 * JNIEnv.
 *
 * It is OK to cache a ScopedGlobalRef between different JNI native
 * method calls.
 */
template <typename T>
class ScopedGlobalRef {
  static_assert(
      std::is_same<T, jclass>() || std::is_same<T, jobject>() ||
          std::is_same<T, jstring>() || std::is_same<T, jthrowable>() ||
          std::is_same<T, jbyteArray>() || std::is_same<T, jintArray>() ||
          std::is_same<T, jshortArray>() || std::is_same<T, jcharArray>() ||
          std::is_same<T, jlongArray>() || std::is_same<T, jfloatArray>() ||
          std::is_same<T, jdoubleArray>() || std::is_same<T, jobjectArray>() ||
          std::is_same<T, jbooleanArray>(),
      "ScopedGlobalRef instantiated for invalid type");

 public:
  /**
   * Constructs a ScopedGlobalRef with a JNI global reference.
   *
   * @param globalRef the global reference to wrap. Can be NULL.
   */
  explicit ScopedGlobalRef(T globalRef) : mGlobalRef(globalRef) {}

  /**
   * Equivalent to ScopedGlobalRef(NULL)
   */
  explicit ScopedGlobalRef() : mGlobalRef(NULL) {}

  /**
   * Move construction is allowed.
   */
  ScopedGlobalRef(ScopedGlobalRef&& s) noexcept : mGlobalRef(s.release()) {}

  /**
   * Move assignment is allowed.
   */
  ScopedGlobalRef& operator=(ScopedGlobalRef&& s) noexcept {
    reset(s.release());
    return *this;
  }

  ~ScopedGlobalRef() {
    reset();
  }

  /**
   * Deletes the currently held reference and reassigns a new one to the
   * ScopedGlobalRef.
   */
  void reset(T ptr = NULL) {
    if (ptr != mGlobalRef) {
      if (mGlobalRef != NULL) {
        vanillajni::getCurrentEnv()->DeleteGlobalRef(mGlobalRef);
      }
      mGlobalRef = ptr;
    }
  }

  /**
   * Makes this ScopedGlobalRef not own the underlying JNI global reference.
   * After calling this method, the ScopedGlobalRef will not delete the JNI
   * global reference when the ScopedGlobalRef goes out of scope.
   */
  T release() {
    T globalRef = mGlobalRef;
    mGlobalRef = NULL;
    return globalRef;
  }

  /**
   * Returns the underlying JNI global reference.
   */
  T get() const {
    return mGlobalRef;
  }

  /**
   * Returns true if the underlying JNI reference is not NULL.
   */
  operator bool() const {
    return mGlobalRef != NULL;
  }

  ScopedGlobalRef(const ScopedGlobalRef& ref) = delete;
  ScopedGlobalRef& operator=(const ScopedGlobalRef& other) = delete;

 private:
  T mGlobalRef;
};

template <typename T>
ScopedGlobalRef<T> make_global_ref(T globalRef) {
  return ScopedGlobalRef<T>(globalRef);
}

} // namespace facebook::yoga::vanillajni
