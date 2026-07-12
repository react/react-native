/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

namespace facebook::react {

void handleJSError(jsi::Runtime &runtime, const jsi::JSError &error, bool isFatal);

} // namespace facebook::react
