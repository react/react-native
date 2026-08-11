/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string_view>
#include <unordered_map>

namespace facebook::react {

using InteractionTypesMap =
    std::unordered_map<std::string_view, std::string_view>;

const InteractionTypesMap& getInteractionTypes();

std::string_view getInteractionTypeForEvent(std::string_view eventName);

} // namespace facebook::react
