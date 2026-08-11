/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <cxxreact/JSExecutor.h>
#include <fbjni/fbjni.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

namespace facebook::react {

class [[deprecated(
    "This API will be removed along with the legacy architecture.")]] JavaScriptExecutorHolder
    : public jni::HybridClass<JavaScriptExecutorHolder> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/JavaScriptExecutor;";

  std::shared_ptr<JSExecutorFactory> getExecutorFactory() {
    return mExecutorFactory;
  }

 protected:
  JavaScriptExecutorHolder(std::shared_ptr<JSExecutorFactory> factory)
      : mExecutorFactory(factory) {}

 private:
  std::shared_ptr<JSExecutorFactory> mExecutorFactory;
};

} // namespace facebook::react

#endif
