/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <string>

namespace facebook::react {

using Logger =
    std::function<void(const std::string& message, unsigned int logLevel)>;
void bindNativeLogger(jsi::Runtime& runtime, Logger logger);

void bindNativePerformanceNow(jsi::Runtime& runtime);

} // namespace facebook::react
