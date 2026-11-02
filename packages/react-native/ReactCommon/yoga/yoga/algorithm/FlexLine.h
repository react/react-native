/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <yoga/Yoga.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

struct FlexLineRunningLayout {
  // Total flex grow factors of flex items which are to be laid in the current
  // line. This is decremented as free space is distributed.
  float totalFlexGrowFactors{0.0f};

  // Total flex shrink factors of flex items which are to be laid in the current
  // line. This is decremented as free space is distributed.
  float totalFlexShrinkScaledFactors{0.0f};

  // The amount of available space within inner dimensions of the line which may
  // still be distributed.
  float remainingFreeSpace{0.0f};

  // The size of the mainDim for the row after considering size, padding, margin
  // and border of flex items. This is used to calculate maxLineDim after going
  // through all the rows to decide on the main axis size of owner.
  float mainDim{0.0f};

  // The size of the crossDim for the row after considering size, padding,
  // margin and border of flex items. Used for calculating containers crossSize.
  float crossDim{0.0f};
};

struct FlexLine {
  // List of children which are part of the line flow. This means they are not
  // positioned absolutely, or with `display: "none"`, and do not overflow the
  // available dimensions.
  const std::vector<yoga::Node*> itemsInFlow{};

  // Accumulation of the dimensions and margin of all the children on the
  // current line. This will be used in order to either set the dimensions of
  // the node if none already exist or to compute the remaining space left for
  // the flexible children.
  const float sizeConsumed{0.0f};

  // Number of edges along the line flow with an auto margin.
  const size_t numberOfAutoMargins{0};

  // Layout information about the line computed in steps after line-breaking
  FlexLineRunningLayout layout{};
};

// Calculates where a line starting at a given index should break, returning
// information about the collective children on the line.
//
// This function assumes that all the children of node have their
// computedFlexBasis properly computed (to do this, use the
// computeFlexBasisForChildren function).
FlexLine calculateFlexLine(
    yoga::Node* node,
    Direction ownerDirection,
    float ownerWidth,
    float mainAxisOwnerSize,
    float availableInnerWidth,
    float availableInnerMainDim,
    Node::LayoutableChildren::Iterator& iterator,
    size_t lineCount);

} // namespace facebook::yoga
