/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/YGConfig.h>
#include <yoga/YGEnums.h>
#include <yoga/YGMacros.h>

YG_EXTERN_C_BEGIN

YG_EXPORT float YGNodeLayoutGetLeft(YGNodeConstRef node);
YG_EXPORT float YGNodeLayoutGetTop(YGNodeConstRef node);
YG_EXPORT float YGNodeLayoutGetRight(YGNodeConstRef node);
YG_EXPORT float YGNodeLayoutGetBottom(YGNodeConstRef node);
YG_EXPORT float YGNodeLayoutGetWidth(YGNodeConstRef node);
YG_EXPORT float YGNodeLayoutGetHeight(YGNodeConstRef node);
YG_EXPORT YGDirection YGNodeLayoutGetDirection(YGNodeConstRef node);
YG_EXPORT bool YGNodeLayoutGetHadOverflow(YGNodeConstRef node);

// Get the computed values for these nodes after performing layout. If they were
// set using point values then the returned value will be the same as
// YGNodeStyleGetXXX. However if they were set using a percentage value then the
// returned value is the computed value used during layout.
YG_EXPORT float YGNodeLayoutGetMargin(YGNodeConstRef node, YGEdge edge);
YG_EXPORT float YGNodeLayoutGetBorder(YGNodeConstRef node, YGEdge edge);
YG_EXPORT float YGNodeLayoutGetPadding(YGNodeConstRef node, YGEdge edge);

/**
 * Return the measured height of the node, before layout rounding
 */
YG_EXPORT float YGNodeLayoutGetRawHeight(YGNodeConstRef node);

/**
 * Return the measured width of the node, before layout rounding
 */
YG_EXPORT float YGNodeLayoutGetRawWidth(YGNodeConstRef node);

YG_EXTERN_C_END
