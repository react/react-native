/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>

namespace facebook::react {

/*
 * Defines visibility of the shadow node and particular layout
 * engine which should be used for laying out the node.
 */
enum class DisplayType {
  None = 0,
  Flex = 1,
  Contents = 2,
  Grid = 3,
};

enum class PositionType {
  Static = 0,
  Relative = 1,
  Absolute = 2,
};

/*
 * User interface layout direction.
 */
enum class LayoutDirection {
  Undefined = 0,
  LeftToRight = 1,
  RightToLeft = 2,
};

} // namespace facebook::react
