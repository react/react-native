/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <React/RendererCore.h>
#include <react/renderer/components/text/TextShadowNode.h>

namespace facebook::react {

using TextComponentDescriptor = ConcreteComponentDescriptor<TextShadowNode>;

} // namespace facebook::react
