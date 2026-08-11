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

/**
 * Defines a property on the global object that is neither enumerable, nor
 * configurable, nor writable. This ensures that the private globals exposed by
 * ReactInstance cannot overwritten by third-party JavaScript code. It also
 * ensures that third-party JavaScript code unaware of these globals isn't able
 * to accidentally access them. In JavaScript, equivalent to:
 *
 * Object.defineProperty(global, propName, {
 *   value: value
 * })
 */
void defineReadOnlyGlobal(
    jsi::Runtime& runtime,
    const std::string& propName,
    jsi::Value&& value);

} // namespace facebook::react
