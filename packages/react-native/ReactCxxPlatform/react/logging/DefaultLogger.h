/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <string>

namespace facebook::react {

using Logger =
    std::function<void(const std::string& message, unsigned int logLevel)>;

Logger getDefaultLogger();

} // namespace facebook::react
