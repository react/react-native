/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SourceCodeModule.h"

namespace facebook::react {

SourceCodeConstants SourceCodeModule::getConstants(jsi::Runtime& /*rt*/) {
  return SourceCodeConstants{.scriptURL = sourceURL_};
}

} // namespace facebook::react
