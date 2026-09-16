/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

namespace facebook::react::jsinspector_modern::tracing {

enum class Mode {
  CDP, // Initiated by the user via Chrome DevTools Frontend.
  Background, // Initiated by the host, doesn't require active CDP session.
};

}
