/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>
#include <yoga/algorithm/FlexDirection.h>
#include <yoga/event/event.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

void calculateLayout(
    yoga::Node* node,
    float ownerWidth,
    float ownerHeight,
    Direction ownerDirection);

bool calculateLayoutInternal(
    yoga::Node* node,
    float availableWidth,
    float availableHeight,
    Direction ownerDirection,
    SizingMode widthSizingMode,
    SizingMode heightSizingMode,
    float ownerWidth,
    float ownerHeight,
    bool performLayout,
    LayoutPassReason reason,
    LayoutData& layoutMarkerData,
    uint32_t depth,
    uint32_t generationCount);

void constrainMaxSizeForMode(
    const yoga::Node* node,
    Direction direction,
    FlexDirection axis,
    float ownerAxisSize,
    float ownerWidth,
    /*in_out*/ SizingMode* mode,
    /*in_out*/ float* size);

float calculateAvailableInnerDimension(
    const yoga::Node* const node,
    const Direction direction,
    const Dimension dimension,
    const float availableDim,
    float paddingAndBorder,
    const float ownerDim,
    const float ownerWidth);

void zeroOutLayoutRecursively(yoga::Node* const node);

void cleanupContentsNodesRecursively(yoga::Node* node, bool didPerformLayout);

} // namespace facebook::yoga
