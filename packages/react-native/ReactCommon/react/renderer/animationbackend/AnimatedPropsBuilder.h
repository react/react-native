/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/graphics/Filter.h>
#include "AnimatedProps.h"

namespace facebook::react {

struct AnimatedPropsBuilder {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  std::unique_ptr<RawProps> rawProps;

  void setOpacity(Float value)
  {
    props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, value));
  }
  void setWidth(yoga::Style::SizeLength value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Style::SizeLength>>(WIDTH, value));
  }
  void setHeight(yoga::Style::SizeLength value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Style::SizeLength>>(HEIGHT, value));
  }
  void setBorderRadii(CascadedBorderRadii &value)
  {
    props.push_back(std::make_unique<AnimatedProp<CascadedBorderRadii>>(BORDER_RADII, value));
  }
  void setBorderWidth(CascadedRectangleEdges<yoga::StyleLength> &value)
  {
    props.push_back(std::make_unique<AnimatedProp<CascadedRectangleEdges<yoga::StyleLength>>>(BORDER_WIDTH, value));
  }
  void setBorderColor(CascadedBorderColors &value)
  {
    props.push_back(std::make_unique<AnimatedProp<CascadedBorderColors>>(BORDER_COLOR, value));
  }
  void setMargin(CascadedRectangleEdges<yoga::StyleLength> &value)
  {
    props.push_back(std::make_unique<AnimatedProp<CascadedRectangleEdges<yoga::StyleLength>>>(MARGIN, value));
  }
  void setPadding(CascadedRectangleEdges<yoga::StyleLength> &value)
  {
    props.push_back(std::make_unique<AnimatedProp<CascadedRectangleEdges<yoga::StyleLength>>>(PADDING, value));
  }
  void setPosition(CascadedRectangleEdges<yoga::StyleLength> &value)
  {
    props.push_back(std::make_unique<AnimatedProp<CascadedRectangleEdges<yoga::StyleLength>>>(POSITION, value));
  }
  void setFlex(yoga::FloatOptional value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::FloatOptional>>(FLEX, value));
  }
  void setTransform(const Transform &t)
  {
    props.push_back(std::make_unique<AnimatedProp<Transform>>(TRANSFORM, t));
  }
  void setTransformOrigin(const TransformOrigin &value)
  {
    props.push_back(std::make_unique<AnimatedProp<TransformOrigin>>(TRANSFORM_ORIGIN, value));
  }
  void setBackgroundColor(SharedColor value)
  {
    props.push_back(std::make_unique<AnimatedProp<SharedColor>>(BACKGROUND_COLOR, value));
  }
  void setShadowColor(SharedColor value)
  {
    props.push_back(std::make_unique<AnimatedProp<SharedColor>>(SHADOW_COLOR, value));
  }
  void setShadowOpacity(Float value)
  {
    props.push_back(std::make_unique<AnimatedProp<Float>>(SHADOW_OPACITY, value));
  }
  void setShadowRadius(Float value)
  {
    props.push_back(std::make_unique<AnimatedProp<Float>>(SHADOW_RADIUS, value));
  }
  void setShadowOffset(Size value)
  {
    props.push_back(std::make_unique<AnimatedProp<Size>>(SHADOW_OFFSET, value));
  }
  void setFilter(const std::vector<FilterFunction> &value)
  {
    props.push_back(std::make_unique<AnimatedProp<std::vector<FilterFunction>>>(FILTER, std::move(value)));
  }
  void setOutlineColor(SharedColor value)
  {
    props.push_back(std::make_unique<AnimatedProp<SharedColor>>(OUTLINE_COLOR, value));
  }
  void setOutlineOffset(Float value)
  {
    props.push_back(std::make_unique<AnimatedProp<Float>>(OUTLINE_OFFSET, value));
  }
  void setOutlineStyle(OutlineStyle value)
  {
    props.push_back(std::make_unique<AnimatedProp<OutlineStyle>>(OUTLINE_STYLE, value));
  }
  void setOutlineWidth(Float value)
  {
    props.push_back(std::make_unique<AnimatedProp<Float>>(OUTLINE_WIDTH, value));
  }
  void setAlignContent(yoga::Align value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Align>>(ALIGN_CONTENT, value));
  }
  void setAlignItems(yoga::Align value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Align>>(ALIGN_ITEMS, value));
  }
  void setAlignSelf(yoga::Align value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Align>>(ALIGN_SELF, value));
  }
  void setAspectRatio(yoga::FloatOptional value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::FloatOptional>>(ASPECT_RATIO, value));
  }
  void setBoxSizing(yoga::BoxSizing value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::BoxSizing>>(BOX_SIZING, value));
  }
  void setDisplay(yoga::Display value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Display>>(DISPLAY, value));
  }
  void setFlexBasis(yoga::Style::SizeLength value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Style::SizeLength>>(FLEX_BASIS, value));
  }
  void setFlexDirection(yoga::FlexDirection value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::FlexDirection>>(FLEX_DIRECTION, value));
  }
  void setRowGap(yoga::Style::Length value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Style::Length>>(ROW_GAP, value));
  }
  void setColumnGap(yoga::Style::Length value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Style::Length>>(COLUMN_GAP, value));
  }
  void setFlexGrow(yoga::FloatOptional value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::FloatOptional>>(FLEX_GROW, value));
  }
  void setFlexShrink(yoga::FloatOptional value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::FloatOptional>>(FLEX_SHRINK, value));
  }
  void setFlexWrap(yoga::Wrap value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Wrap>>(FLEX_WRAP, value));
  }
  void setJustifyContent(yoga::Justify value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Justify>>(JUSTIFY_CONTENT, value));
  }
  void setMaxHeight(yoga::Style::SizeLength value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Style::SizeLength>>(MAX_HEIGHT, value));
  }
  void setMaxWidth(yoga::Style::SizeLength value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Style::SizeLength>>(MAX_WIDTH, value));
  }
  void setMinHeight(yoga::Style::SizeLength value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Style::SizeLength>>(MIN_HEIGHT, value));
  }
  void setMinWidth(yoga::Style::SizeLength value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Style::SizeLength>>(MIN_WIDTH, value));
  }
  void setOverflow(yoga::Overflow value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Overflow>>(STYLE_OVERFLOW, value));
  }
  void setPositionType(yoga::PositionType value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::PositionType>>(POSITION_TYPE, value));
  }
  void setZIndex(std::optional<int> value)
  {
    props.push_back(std::make_unique<AnimatedProp<std::optional<int>>>(Z_INDEX, value));
  }
  void setDirection(yoga::Direction value)
  {
    props.push_back(std::make_unique<AnimatedProp<yoga::Direction>>(DIRECTION, value));
  }
  void setBorderCurves(CascadedBorderCurves &value)
  {
    props.push_back(std::make_unique<AnimatedProp<CascadedBorderCurves>>(BORDER_CURVES, value));
  }
  void setBorderStyles(CascadedBorderStyles &value)
  {
    props.push_back(std::make_unique<AnimatedProp<CascadedBorderStyles>>(BORDER_STYLES, value));
  }
  void setPointerEvents(PointerEventsMode value)
  {
    props.push_back(std::make_unique<AnimatedProp<PointerEventsMode>>(POINTER_EVENTS, value));
  }
  void setIsolation(Isolation value)
  {
    props.push_back(std::make_unique<AnimatedProp<Isolation>>(ISOLATION, value));
  }
  void setCursor(Cursor value)
  {
    props.push_back(std::make_unique<AnimatedProp<Cursor>>(CURSOR, value));
  }
  void setBoxShadow(const std::vector<BoxShadow> &value)
  {
    props.push_back(std::make_unique<AnimatedProp<std::vector<BoxShadow>>>(BOX_SHADOW, value));
  }
  void setMixBlendMode(BlendMode value)
  {
    props.push_back(std::make_unique<AnimatedProp<BlendMode>>(MIX_BLEND_MODE, value));
  }
  void setBackfaceVisibility(BackfaceVisibility value)
  {
    props.push_back(std::make_unique<AnimatedProp<BackfaceVisibility>>(BACKFACE_VISIBILITY, value));
  }
  void storeDynamic(folly::dynamic &d)
  {
    rawProps = std::make_unique<RawProps>(std::move(d));
  }
  void storeJSI(jsi::Runtime &runtime, jsi::Value &value)
  {
    rawProps = std::make_unique<RawProps>(runtime, value);
  }
  AnimatedProps get()
  {
    return AnimatedProps{std::move(props), std::move(rawProps)};
  }
};

} // namespace facebook::react
