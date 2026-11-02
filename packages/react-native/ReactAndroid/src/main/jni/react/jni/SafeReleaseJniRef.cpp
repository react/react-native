/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/jni/SafeReleaseJniRef.h>

namespace facebook::react {

void ensureThreadDurationJNIEnvAttached() {
  // Attaching and detaching the thread to the JNI environment may take
  // hundreds of microseconds, and we attach to a very limited number of
  // threads (in practice, just the Hermes GC), so we only perform
  // registration once, detaching before the thread is destroyed.
  //
  // > In Android 2.0 (Eclair) and higher you can use pthread_key_create() to
  // > define a destructor function that will be called before the thread
  // > exits, and call DetachCurrentThread() from there.
  // https://github.com/facebookincubator/fbjni/blob/7b7efda0d49b956acf1d3307510e3c73fc55b404/cxx/fbjni/detail/Environment.h#L101
  // https://developer.android.com/training/articles/perf-jni#threads
  static constinit thread_local std::optional<jni::ThreadScope> threadScope;

  if (jni::detail::currentOrNull() == nullptr) {
    threadScope.emplace();
  }
}

} // namespace facebook::react
