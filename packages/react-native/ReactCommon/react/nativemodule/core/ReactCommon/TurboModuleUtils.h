/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <react/bridging/LongLivedObject.h>
#include <cassert>
#include <functional>
#include <string>

namespace facebook::react {

struct Promise : public LongLivedObject {
  Promise(jsi::Runtime& rt, jsi::Function resolve, jsi::Function reject);

  void resolve(const jsi::Value& result);
  void reject(const std::string& message);

  jsi::Function resolve_;
  jsi::Function reject_;
};

using PromiseSetupFunctionType =
    std::function<void(jsi::Runtime& rt, std::shared_ptr<Promise>)>;
jsi::Value createPromiseAsJSIValue(
    jsi::Runtime& rt,
    PromiseSetupFunctionType&& func);

} // namespace facebook::react
