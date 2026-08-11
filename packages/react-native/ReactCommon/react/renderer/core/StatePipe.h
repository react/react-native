/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <react/renderer/core/StateUpdate.h>

namespace facebook::react {

using StatePipe = std::function<void(const StateUpdate& stateUpdate)>;

} // namespace facebook::react
