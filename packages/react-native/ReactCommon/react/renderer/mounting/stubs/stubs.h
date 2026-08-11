/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/mounting/stubs/StubView.h>
#include <react/renderer/mounting/stubs/StubViewTree.h>

namespace facebook::react {

/*
 * Builds a ShadowView tree from given root ShadowNode using custom built-in
 * implementation (*without* using Differentiator).
 */
StubViewTree buildStubViewTreeWithoutUsingDifferentiator(
    const ShadowNode& rootShadowNode);

/*
 * Builds a ShadowView tree from given root ShadowNode using Differentiator by
 * generating mutation instructions between empty and final trees.
 */
StubViewTree buildStubViewTreeUsingDifferentiator(
    const ShadowNode& rootShadowNode);

} // namespace facebook::react
