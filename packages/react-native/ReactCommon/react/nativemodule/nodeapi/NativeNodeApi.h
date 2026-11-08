/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/nativemodule/nodeapi/NodeApiEngine.h>
#include <react/nativemodule/nodeapi/NodeApiHost.h>

#if __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif

namespace facebook::react {

class NativeNodeApi : public NativeNodeApiCxxSpec<NativeNodeApi> {
 public:
  NativeNodeApi(std::shared_ptr<NodeApiEngine> engine, std::shared_ptr<CallInvoker> jsInvoker);

  void dlopen(jsi::Runtime &runtime, jsi::Object module, jsi::String filename);

 private:
  std::shared_ptr<NodeApiEngine> engine_;
  std::shared_ptr<NodeApiHost> host_;
};

} // namespace facebook::react
