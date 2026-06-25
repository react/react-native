/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/graphics/Point.h>
#include <react/renderer/mounting/ShadowView.h>

namespace facebook::react {

/*
 * Describes pair of a `ShadowView` and a `ShadowNode`.
 * This is not exposed to the mounting layer.
 */
struct ShadowViewNodePair final {
  ShadowView shadowView{};
  const ShadowNode *shadowNode;

  /**
   * The ShadowNode does not form a stacking context, and the native views
   * corresponding to its children may be parented to an ancestor.
   */
  bool flattened{false};

  /**
   * Whether this ShadowNode should create a corresponding native view.
   */
  bool isConcreteView{true};
  Point contextOrigin{0, 0};

  size_t mountIndex{0};

  /**
   * This is nullptr unless `inOtherTree` is set to true.
   * We rely on this only for marginal cases. TODO: could we
   * rely on this more heavily to simplify the diffing algorithm
   * overall?
   */
  mutable const ShadowViewNodePair *otherTreePair{nullptr};

  /*
   * The stored pointer to `ShadowNode` represents an identity of the pair.
   */
  bool operator==(const ShadowViewNodePair &rhs) const
  {
    return this->shadowNode == rhs.shadowNode;
  }

  bool inOtherTree() const
  {
    return this->otherTreePair != nullptr;
  }
};

} // namespace facebook::react
