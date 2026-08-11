/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <jsi/jsi.h>

namespace facebook::react {

using ValueFactory = std::function<jsi::Value(jsi::Runtime& runtime)>;

} // namespace facebook::react
