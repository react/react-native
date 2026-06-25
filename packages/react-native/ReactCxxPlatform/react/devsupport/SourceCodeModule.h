/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <memory>
#include <string>

namespace facebook::react {

using SourceCodeConstants = NativeSourceCodeSourceCodeConstants<std::string>;

template <>
struct Bridging<SourceCodeConstants> : NativeSourceCodeSourceCodeConstantsBridging<SourceCodeConstants> {};

class SourceCodeModule : public NativeSourceCodeCxxSpec<SourceCodeModule> {
 public:
  explicit SourceCodeModule(std::shared_ptr<CallInvoker> jsInvoker, std::string sourceURL = "")
      : NativeSourceCodeCxxSpec(jsInvoker), sourceURL_(std::move(sourceURL))
  {
  }

  SourceCodeConstants getConstants(jsi::Runtime &rt);

 private:
  std::string sourceURL_;
};

} // namespace facebook::react
