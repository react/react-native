/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/StyleConditionPrimitives.h>

#include <memory>

namespace facebook::react {

/*
 * Re-resolves media-query-conditional styles in the subtree rooted at `node`
 * against the given environment snapshot. Returns `node` itself 
 * when nothing in the subtree changed, or a clone with updated props otherwise.
 */
std::shared_ptr<const ShadowNode> resolveStyleConditionsInSubtree(
    const std::shared_ptr<const ShadowNode>& node,
    ColorScheme colorScheme,
    Orientation orientation,
    const PropsParserContext& propsParserContext);

} // namespace facebook::react
