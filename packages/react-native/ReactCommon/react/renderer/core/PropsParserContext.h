/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/core/ReactPrimitives.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

// For props requiring some context to parse, this toolbox can be used.
// It should be used as infrequently as possible - most props can and should
// be parsed without any context.
struct PropsParserContext {
  PropsParserContext(
      const SurfaceId surfaceId,
      const ContextContainer& contextContainer)
      : surfaceId(surfaceId), contextContainer(contextContainer) {}

  // Non-copyable
  PropsParserContext(const PropsParserContext&) = delete;
  PropsParserContext& operator=(const PropsParserContext&) = delete;

  const SurfaceId surfaceId;
  const ContextContainer& contextContainer;
};

} // namespace facebook::react
