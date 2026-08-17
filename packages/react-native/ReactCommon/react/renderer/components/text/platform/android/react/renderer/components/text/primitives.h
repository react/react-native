/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

namespace facebook::react {

enum class DataDetectorType {
  All,
  Email,
  Link,
  None,
  PhoneNumber,
};

} // namespace facebook::react
