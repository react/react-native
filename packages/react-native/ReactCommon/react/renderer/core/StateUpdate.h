/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <react/renderer/core/StateData.h>

namespace facebook::react {

class ShadowNodeFamily;
using SharedShadowNodeFamily = std::shared_ptr<const ShadowNodeFamily>;

class StateUpdate {
 public:
  using Callback =
      std::function<StateData::Shared(const StateData::Shared& data)>;
  using FailureCallback = std::function<void()>;

  SharedShadowNodeFamily family;
  Callback callback;
};

} // namespace facebook::react
