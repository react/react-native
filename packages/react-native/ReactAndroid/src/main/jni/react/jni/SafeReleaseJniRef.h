/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>

#include <type_traits>
#include <utility>

namespace facebook::react {

/**
 * Ensures that the current thread has an attached JNI environment, setting one
 * up to be detached at the end of the thread's lifetime if not.
 */
void ensureThreadDurationJNIEnvAttached();

/**
 * A wrapper around a JNI reference (e.g. jni::global_ref<>) that makes it safe
 * to destroy (decrement refcount) from any thread. This wrapping is necessary
 * when we don't have control over the thread where a given JNI reference's
 * destructor will run.
 *
 * In particular, this is needed when a JNI reference is owned by a JSI
 * HostObject or HostFunction, since those may be destroyed on an arbitrary
 * thread (e.g. ther Hermes GC thread) which may not be attached to the JVM.
 * (This is explicitly documented for HostObject, and is the observed behavior
 * in Hermes for HostFunctions.)
 */
template <typename RefT>
class SafeReleaseJniRef {
  using T = std::remove_reference<decltype(*std::declval<RefT>())>::type;

 public:
  SafeReleaseJniRef() = default;
  /* explicit */ SafeReleaseJniRef(RefT ref) : ref_(std::move(ref)) {}
  SafeReleaseJniRef(const SafeReleaseJniRef& other) = default;
  SafeReleaseJniRef(SafeReleaseJniRef&& other) = default;
  SafeReleaseJniRef& operator=(const SafeReleaseJniRef& other) = default;
  SafeReleaseJniRef& operator=(SafeReleaseJniRef&& other) = default;

  ~SafeReleaseJniRef() {
    if (ref_) {
      ensureThreadDurationJNIEnvAttached();
      ref_.reset();
    }
  }

  operator bool() const noexcept {
    return (bool)ref_;
  }

  T& operator*() noexcept {
    return *ref_;
  }

  T* operator->() noexcept {
    return &*ref_;
  }

  const T& operator*() const noexcept {
    return *ref_;
  }

  const T* operator->() const noexcept {
    return &*ref_;
  }

  operator RefT() const {
    return ref_;
  }

  RefT::javaobject get() const {
    return ref_.get();
  }

 private:
  RefT ref_;
};

} // namespace facebook::react
