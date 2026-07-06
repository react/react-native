/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <stddef.h>
#include <yoga/YGEnums.h>
#include <yoga/YGNode.h>
#include <yoga/YGValue.h>

YG_EXTERN_C_BEGIN

YG_EXPORT void YGNodeCopyStyle(YGNodeRef dstNode, YGNodeConstRef srcNode);

YG_EXPORT void YGNodeStyleSetDirection(YGNodeRef node, YGDirection direction);
YG_EXPORT YGDirection YGNodeStyleGetDirection(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlexDirection(
    YGNodeRef node,
    YGFlexDirection flexDirection);
YG_EXPORT YGFlexDirection YGNodeStyleGetFlexDirection(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetJustifyContent(
    YGNodeRef node,
    YGJustify justifyContent);
YG_EXPORT YGJustify YGNodeStyleGetJustifyContent(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetJustifyItems(
    YGNodeRef node,
    YGJustify justifyItems);
YG_EXPORT YGJustify YGNodeStyleGetJustifyItems(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetJustifySelf(YGNodeRef node, YGJustify justifySelf);
YG_EXPORT YGJustify YGNodeStyleGetJustifySelf(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetAlignContent(YGNodeRef node, YGAlign alignContent);
YG_EXPORT YGAlign YGNodeStyleGetAlignContent(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetAlignItems(YGNodeRef node, YGAlign alignItems);
YG_EXPORT YGAlign YGNodeStyleGetAlignItems(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetAlignSelf(YGNodeRef node, YGAlign alignSelf);
YG_EXPORT YGAlign YGNodeStyleGetAlignSelf(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetPositionType(
    YGNodeRef node,
    YGPositionType positionType);
YG_EXPORT YGPositionType YGNodeStyleGetPositionType(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlexWrap(YGNodeRef node, YGWrap flexWrap);
YG_EXPORT YGWrap YGNodeStyleGetFlexWrap(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetOverflow(YGNodeRef node, YGOverflow overflow);
YG_EXPORT YGOverflow YGNodeStyleGetOverflow(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetDisplay(YGNodeRef node, YGDisplay display);
YG_EXPORT YGDisplay YGNodeStyleGetDisplay(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlex(YGNodeRef node, float flex);
YG_EXPORT float YGNodeStyleGetFlex(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlexGrow(YGNodeRef node, float flexGrow);
YG_EXPORT float YGNodeStyleGetFlexGrow(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlexShrink(YGNodeRef node, float flexShrink);
YG_EXPORT float YGNodeStyleGetFlexShrink(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetFlexBasis(YGNodeRef node, float flexBasis);
YG_EXPORT void YGNodeStyleSetFlexBasisPercent(YGNodeRef node, float flexBasis);
YG_EXPORT void YGNodeStyleSetFlexBasisAuto(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetFlexBasisMaxContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetFlexBasisFitContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetFlexBasisStretch(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetFlexBasisDynamic(
    YGNodeRef node,
    YGValueDynamic callback,
    YGValueDynamicID id);
YG_EXPORT YGValue YGNodeStyleGetFlexBasis(YGNodeConstRef node);

YG_EXPORT void
YGNodeStyleSetPosition(YGNodeRef node, YGEdge edge, float position);
YG_EXPORT void
YGNodeStyleSetPositionPercent(YGNodeRef node, YGEdge edge, float position);
YG_EXPORT YGValue YGNodeStyleGetPosition(YGNodeConstRef node, YGEdge edge);
YG_EXPORT void YGNodeStyleSetPositionAuto(YGNodeRef node, YGEdge edge);
YG_EXPORT void YGNodeStyleSetPositionDynamic(
    YGNodeRef node,
    YGEdge edge,
    YGValueDynamic callback,
    YGValueDynamicID id);

YG_EXPORT
void YGNodeStyleSetMargin(YGNodeRef node, YGEdge edge, float margin);
YG_EXPORT void
YGNodeStyleSetMarginPercent(YGNodeRef node, YGEdge edge, float margin);
YG_EXPORT void YGNodeStyleSetMarginAuto(YGNodeRef node, YGEdge edge);
YG_EXPORT void YGNodeStyleSetMarginDynamic(
    YGNodeRef node,
    YGEdge edge,
    YGValueDynamic callback,
    YGValueDynamicID id);
YG_EXPORT YGValue YGNodeStyleGetMargin(YGNodeConstRef node, YGEdge edge);

YG_EXPORT void
YGNodeStyleSetPadding(YGNodeRef node, YGEdge edge, float padding);
YG_EXPORT void
YGNodeStyleSetPaddingPercent(YGNodeRef node, YGEdge edge, float padding);
YG_EXPORT void YGNodeStyleSetPaddingDynamic(
    YGNodeRef node,
    YGEdge edge,
    YGValueDynamic callback,
    YGValueDynamicID id);
YG_EXPORT YGValue YGNodeStyleGetPadding(YGNodeConstRef node, YGEdge edge);

YG_EXPORT void YGNodeStyleSetBorder(YGNodeRef node, YGEdge edge, float border);
YG_EXPORT void YGNodeStyleSetBorderDynamic(
    YGNodeRef node,
    YGEdge edge,
    YGValueDynamic callback,
    YGValueDynamicID id);
YG_EXPORT float YGNodeStyleGetBorder(YGNodeConstRef node, YGEdge edge);

YG_EXPORT void
YGNodeStyleSetGap(YGNodeRef node, YGGutter gutter, float gapLength);
YG_EXPORT void
YGNodeStyleSetGapPercent(YGNodeRef node, YGGutter gutter, float gapLength);
YG_EXPORT void YGNodeStyleSetGapDynamic(
    YGNodeRef node,
    YGGutter gutter,
    YGValueDynamic callback,
    YGValueDynamicID id);

YG_EXPORT YGValue YGNodeStyleGetGap(YGNodeConstRef node, YGGutter gutter);

YG_EXPORT void YGNodeStyleSetBoxSizing(YGNodeRef node, YGBoxSizing boxSizing);
YG_EXPORT YGBoxSizing YGNodeStyleGetBoxSizing(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetWidth(YGNodeRef node, float width);
YG_EXPORT void YGNodeStyleSetWidthPercent(YGNodeRef node, float width);
YG_EXPORT void YGNodeStyleSetWidthAuto(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetWidthMaxContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetWidthFitContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetWidthStretch(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetWidthDynamic(
    YGNodeRef node,
    YGValueDynamic callback,
    YGValueDynamicID id);
YG_EXPORT YGValue YGNodeStyleGetWidth(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetHeight(YGNodeRef node, float height);
YG_EXPORT void YGNodeStyleSetHeightPercent(YGNodeRef node, float height);
YG_EXPORT void YGNodeStyleSetHeightAuto(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetHeightMaxContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetHeightFitContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetHeightStretch(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetHeightDynamic(
    YGNodeRef node,
    YGValueDynamic callback,
    YGValueDynamicID id);
YG_EXPORT YGValue YGNodeStyleGetHeight(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetMinWidth(YGNodeRef node, float minWidth);
YG_EXPORT void YGNodeStyleSetMinWidthPercent(YGNodeRef node, float minWidth);
YG_EXPORT void YGNodeStyleSetMinWidthMaxContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMinWidthFitContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMinWidthStretch(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMinWidthDynamic(
    YGNodeRef node,
    YGValueDynamic callback,
    YGValueDynamicID id);
YG_EXPORT YGValue YGNodeStyleGetMinWidth(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetMinHeight(YGNodeRef node, float minHeight);
YG_EXPORT void YGNodeStyleSetMinHeightPercent(YGNodeRef node, float minHeight);
YG_EXPORT void YGNodeStyleSetMinHeightMaxContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMinHeightFitContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMinHeightStretch(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMinHeightDynamic(
    YGNodeRef node,
    YGValueDynamic callback,
    YGValueDynamicID id);
YG_EXPORT YGValue YGNodeStyleGetMinHeight(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetMaxWidth(YGNodeRef node, float maxWidth);
YG_EXPORT void YGNodeStyleSetMaxWidthPercent(YGNodeRef node, float maxWidth);
YG_EXPORT void YGNodeStyleSetMaxWidthMaxContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMaxWidthFitContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMaxWidthStretch(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMaxWidthDynamic(
    YGNodeRef node,
    YGValueDynamic callback,
    YGValueDynamicID id);
YG_EXPORT YGValue YGNodeStyleGetMaxWidth(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetMaxHeight(YGNodeRef node, float maxHeight);
YG_EXPORT void YGNodeStyleSetMaxHeightPercent(YGNodeRef node, float maxHeight);
YG_EXPORT void YGNodeStyleSetMaxHeightMaxContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMaxHeightFitContent(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMaxHeightStretch(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetMaxHeightDynamic(
    YGNodeRef node,
    YGValueDynamic callback,
    YGValueDynamicID id);
YG_EXPORT YGValue YGNodeStyleGetMaxHeight(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetAspectRatio(YGNodeRef node, float aspectRatio);
YG_EXPORT float YGNodeStyleGetAspectRatio(YGNodeConstRef node);

// Grid Item Properties
YG_EXPORT void YGNodeStyleSetGridColumnStart(
    YGNodeRef node,
    int gridColumnStart);
YG_EXPORT void YGNodeStyleSetGridColumnStartAuto(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetGridColumnStartSpan(YGNodeRef node, int span);
YG_EXPORT int YGNodeStyleGetGridColumnStart(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetGridColumnEnd(YGNodeRef node, int gridColumnEnd);
YG_EXPORT void YGNodeStyleSetGridColumnEndAuto(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetGridColumnEndSpan(YGNodeRef node, int span);
YG_EXPORT int YGNodeStyleGetGridColumnEnd(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetGridRowStart(YGNodeRef node, int gridRowStart);
YG_EXPORT void YGNodeStyleSetGridRowStartAuto(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetGridRowStartSpan(YGNodeRef node, int span);
YG_EXPORT int YGNodeStyleGetGridRowStart(YGNodeConstRef node);

YG_EXPORT void YGNodeStyleSetGridRowEnd(YGNodeRef node, int gridRowEnd);
YG_EXPORT void YGNodeStyleSetGridRowEndAuto(YGNodeRef node);
YG_EXPORT void YGNodeStyleSetGridRowEndSpan(YGNodeRef node, int span);
YG_EXPORT int YGNodeStyleGetGridRowEnd(YGNodeConstRef node);

// Grid Container Properties
YG_EXPORT void YGNodeStyleSetGridTemplateColumnsCount(
    YGNodeRef node,
    size_t count);
YG_EXPORT void YGNodeStyleSetGridTemplateColumn(
    YGNodeRef node,
    size_t index,
    YGGridTrackType type,
    float value);
YG_EXPORT void YGNodeStyleSetGridTemplateColumnMinMax(
    YGNodeRef node,
    size_t index,
    YGGridTrackType minType,
    float minValue,
    YGGridTrackType maxType,
    float maxValue);

YG_EXPORT void YGNodeStyleSetGridTemplateRowsCount(
    YGNodeRef node,
    size_t count);
YG_EXPORT void YGNodeStyleSetGridTemplateRow(
    YGNodeRef node,
    size_t index,
    YGGridTrackType type,
    float value);
YG_EXPORT void YGNodeStyleSetGridTemplateRowMinMax(
    YGNodeRef node,
    size_t index,
    YGGridTrackType minType,
    float minValue,
    YGGridTrackType maxType,
    float maxValue);

YG_EXPORT void YGNodeStyleSetGridAutoColumnsCount(YGNodeRef node, size_t count);
YG_EXPORT void YGNodeStyleSetGridAutoColumn(
    YGNodeRef node,
    size_t index,
    YGGridTrackType type,
    float value);
YG_EXPORT void YGNodeStyleSetGridAutoColumnMinMax(
    YGNodeRef node,
    size_t index,
    YGGridTrackType minType,
    float minValue,
    YGGridTrackType maxType,
    float maxValue);

YG_EXPORT void YGNodeStyleSetGridAutoRowsCount(YGNodeRef node, size_t count);
YG_EXPORT void YGNodeStyleSetGridAutoRow(
    YGNodeRef node,
    size_t index,
    YGGridTrackType type,
    float value);
YG_EXPORT void YGNodeStyleSetGridAutoRowMinMax(
    YGNodeRef node,
    size_t index,
    YGGridTrackType minType,
    float minValue,
    YGGridTrackType maxType,
    float maxValue);

YG_EXTERN_C_END
