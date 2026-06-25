/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <react/renderer/components/view/BaseViewProps.h>

#include <utility>

namespace facebook::react {

enum PropName {
  OPACITY,
  WIDTH,
  HEIGHT,
  BORDER_RADII,
  BORDER_WIDTH,
  BORDER_COLOR,
  MARGIN,
  PADDING,
  POSITION,
  FLEX,
  TRANSFORM,
  TRANSFORM_ORIGIN,
  BACKGROUND_COLOR,
  SHADOW_COLOR,
  SHADOW_OFFSET,
  SHADOW_OPACITY,
  SHADOW_RADIUS,
  FILTER,
  OUTLINE_COLOR,
  OUTLINE_OFFSET,
  OUTLINE_STYLE,
  OUTLINE_WIDTH,
  ALIGN_CONTENT,
  ALIGN_ITEMS,
  ALIGN_SELF,
  ASPECT_RATIO,
  BOX_SIZING,
  DISPLAY,
  FLEX_BASIS,
  FLEX_DIRECTION,
  ROW_GAP,
  COLUMN_GAP,
  FLEX_GROW,
  FLEX_SHRINK,
  FLEX_WRAP,
  JUSTIFY_CONTENT,
  MAX_HEIGHT,
  MAX_WIDTH,
  MIN_HEIGHT,
  MIN_WIDTH,
  STYLE_OVERFLOW,
  POSITION_TYPE,
  Z_INDEX,
  DIRECTION,
  BORDER_CURVES,
  BORDER_STYLES,
  POINTER_EVENTS,
  ISOLATION,
  CURSOR,
  BOX_SHADOW,
  MIX_BLEND_MODE,
  BACKFACE_VISIBILITY
};

struct AnimatedPropBase {
  PropName propName;
  explicit AnimatedPropBase(PropName propName) : propName(propName) {}
  virtual ~AnimatedPropBase() = default;
};

template <typename T>
struct AnimatedProp : AnimatedPropBase {
  T value;
  AnimatedProp() = default;
  AnimatedProp(PropName propName, const T &value) : AnimatedPropBase{propName}, value(std::move(value)) {}
};

template <typename T>
T get(const std::unique_ptr<AnimatedPropBase> &animatedProp)
{
  return static_cast<AnimatedProp<T> *>(animatedProp.get())->value;
}

template <typename T>
T get(const AnimatedPropBase &animatedProp)
{
  return static_cast<const AnimatedProp<T> &>(animatedProp).value;
}

struct AnimatedProps {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  std::unique_ptr<RawProps> rawProps;
};

inline void cloneProp(BaseViewProps &viewProps, const AnimatedPropBase &animatedProp)
{
  switch (animatedProp.propName) {
    case OPACITY:
      viewProps.opacity = get<Float>(animatedProp);
      break;

    case WIDTH:
      viewProps.yogaStyle.setDimension(yoga::Dimension::Width, get<yoga::Style::SizeLength>(animatedProp));
      break;

    case HEIGHT:
      viewProps.yogaStyle.setDimension(yoga::Dimension::Height, get<yoga::Style::SizeLength>(animatedProp));
      break;

    case BORDER_RADII:
      viewProps.borderRadii = get<CascadedBorderRadii>(animatedProp);
      break;

    case BORDER_WIDTH: {
      const auto &borderWidths = get<CascadedRectangleEdges<yoga::StyleLength>>(animatedProp);
      if (borderWidths.left.has_value()) {
        viewProps.yogaStyle.setBorder(yoga::Edge::Left, borderWidths.left.value());
      }
      if (borderWidths.top.has_value()) {
        viewProps.yogaStyle.setBorder(yoga::Edge::Top, borderWidths.top.value());
      }
      if (borderWidths.right.has_value()) {
        viewProps.yogaStyle.setBorder(yoga::Edge::Right, borderWidths.right.value());
      }
      if (borderWidths.bottom.has_value()) {
        viewProps.yogaStyle.setBorder(yoga::Edge::Bottom, borderWidths.bottom.value());
      }
      if (borderWidths.start.has_value()) {
        viewProps.yogaStyle.setBorder(yoga::Edge::Start, borderWidths.start.value());
      }
      if (borderWidths.end.has_value()) {
        viewProps.yogaStyle.setBorder(yoga::Edge::End, borderWidths.end.value());
      }
      if (borderWidths.horizontal.has_value()) {
        viewProps.yogaStyle.setBorder(yoga::Edge::Horizontal, borderWidths.horizontal.value());
      }
      if (borderWidths.vertical.has_value()) {
        viewProps.yogaStyle.setBorder(yoga::Edge::Vertical, borderWidths.vertical.value());
      }
      if (borderWidths.all.has_value()) {
        viewProps.yogaStyle.setBorder(yoga::Edge::All, borderWidths.all.value());
      }
      break;
    }

    case BORDER_COLOR:
      viewProps.borderColors = get<CascadedBorderColors>(animatedProp);
      break;

    case MARGIN: {
      const auto &margins = get<CascadedRectangleEdges<yoga::StyleLength>>(animatedProp);
      if (margins.left.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Left, margins.left.value());
      }
      if (margins.top.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Top, margins.top.value());
      }
      if (margins.right.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Right, margins.right.value());
      }
      if (margins.bottom.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Bottom, margins.bottom.value());
      }
      if (margins.start.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Start, margins.start.value());
      }
      if (margins.end.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::End, margins.end.value());
      }
      if (margins.horizontal.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Horizontal, margins.horizontal.value());
      }
      if (margins.vertical.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::Vertical, margins.vertical.value());
      }
      if (margins.all.has_value()) {
        viewProps.yogaStyle.setMargin(yoga::Edge::All, margins.all.value());
      }
      break;
    }

    case PADDING: {
      const auto &paddings = get<CascadedRectangleEdges<yoga::StyleLength>>(animatedProp);
      if (paddings.left.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Left, paddings.left.value());
      }
      if (paddings.top.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Top, paddings.top.value());
      }
      if (paddings.right.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Right, paddings.right.value());
      }
      if (paddings.bottom.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Bottom, paddings.bottom.value());
      }
      if (paddings.start.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Start, paddings.start.value());
      }
      if (paddings.end.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::End, paddings.end.value());
      }
      if (paddings.horizontal.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Horizontal, paddings.horizontal.value());
      }
      if (paddings.vertical.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::Vertical, paddings.vertical.value());
      }
      if (paddings.all.has_value()) {
        viewProps.yogaStyle.setPadding(yoga::Edge::All, paddings.all.value());
      }
      break;
    }

    case POSITION: {
      const auto &positions = get<CascadedRectangleEdges<yoga::StyleLength>>(animatedProp);
      if (positions.left.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Left, positions.left.value());
      }
      if (positions.top.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Top, positions.top.value());
      }
      if (positions.right.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Right, positions.right.value());
      }
      if (positions.bottom.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Bottom, positions.bottom.value());
      }
      if (positions.start.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Start, positions.start.value());
      }
      if (positions.end.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::End, positions.end.value());
      }
      if (positions.horizontal.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Horizontal, positions.horizontal.value());
      }
      if (positions.vertical.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::Vertical, positions.vertical.value());
      }
      if (positions.all.has_value()) {
        viewProps.yogaStyle.setPosition(yoga::Edge::All, positions.all.value());
      }
      break;
    }

    case FLEX:
      viewProps.yogaStyle.setFlex(get<yoga::FloatOptional>(animatedProp));
      break;

    case TRANSFORM:
      viewProps.transform = get<Transform>(animatedProp);
      break;

    case TRANSFORM_ORIGIN:
      viewProps.transformOrigin = get<TransformOrigin>(animatedProp);
      break;

    case BACKGROUND_COLOR:
      viewProps.backgroundColor = get<SharedColor>(animatedProp);
      break;

    case SHADOW_COLOR:
      viewProps.shadowColor = get<SharedColor>(animatedProp);
      break;

    case SHADOW_OFFSET:
      viewProps.shadowOffset = get<Size>(animatedProp);
      break;

    case SHADOW_OPACITY:
      viewProps.shadowOpacity = get<Float>(animatedProp);
      break;

    case SHADOW_RADIUS:
      viewProps.shadowRadius = get<Float>(animatedProp);
      break;

    case FILTER:
      viewProps.filter = get<std::vector<FilterFunction>>(animatedProp);
      break;

    case OUTLINE_COLOR:
      viewProps.outlineColor = get<SharedColor>(animatedProp);
      break;

    case OUTLINE_OFFSET:
      viewProps.outlineOffset = get<Float>(animatedProp);
      break;

    case OUTLINE_STYLE:
      viewProps.outlineStyle = get<OutlineStyle>(animatedProp);
      break;

    case OUTLINE_WIDTH:
      viewProps.outlineWidth = get<Float>(animatedProp);
      break;

    case ALIGN_CONTENT:
      viewProps.yogaStyle.setAlignContent(get<yoga::Align>(animatedProp));
      break;

    case ALIGN_ITEMS:
      viewProps.yogaStyle.setAlignItems(get<yoga::Align>(animatedProp));
      break;

    case ALIGN_SELF:
      viewProps.yogaStyle.setAlignSelf(get<yoga::Align>(animatedProp));
      break;

    case ASPECT_RATIO:
      viewProps.yogaStyle.setAspectRatio(get<yoga::FloatOptional>(animatedProp));
      break;

    case BOX_SIZING:
      viewProps.yogaStyle.setBoxSizing(get<yoga::BoxSizing>(animatedProp));
      break;

    case DISPLAY:
      viewProps.yogaStyle.setDisplay(get<yoga::Display>(animatedProp));
      break;

    case FLEX_BASIS:
      viewProps.yogaStyle.setFlexBasis(get<yoga::Style::SizeLength>(animatedProp));
      break;

    case FLEX_DIRECTION:
      viewProps.yogaStyle.setFlexDirection(get<yoga::FlexDirection>(animatedProp));
      break;

    case ROW_GAP:
      viewProps.yogaStyle.setGap(yoga::Gutter::Row, get<yoga::Style::Length>(animatedProp));
      break;

    case COLUMN_GAP:
      viewProps.yogaStyle.setGap(yoga::Gutter::Column, get<yoga::Style::Length>(animatedProp));
      break;

    case FLEX_GROW:
      viewProps.yogaStyle.setFlexGrow(get<yoga::FloatOptional>(animatedProp));
      break;

    case FLEX_SHRINK:
      viewProps.yogaStyle.setFlexShrink(get<yoga::FloatOptional>(animatedProp));
      break;

    case FLEX_WRAP:
      viewProps.yogaStyle.setFlexWrap(get<yoga::Wrap>(animatedProp));
      break;

    case JUSTIFY_CONTENT:
      viewProps.yogaStyle.setJustifyContent(get<yoga::Justify>(animatedProp));
      break;

    case MAX_HEIGHT:
      viewProps.yogaStyle.setMaxDimension(yoga::Dimension::Height, get<yoga::Style::SizeLength>(animatedProp));
      break;

    case MAX_WIDTH:
      viewProps.yogaStyle.setMaxDimension(yoga::Dimension::Width, get<yoga::Style::SizeLength>(animatedProp));
      break;

    case MIN_HEIGHT:
      viewProps.yogaStyle.setMinDimension(yoga::Dimension::Height, get<yoga::Style::SizeLength>(animatedProp));
      break;

    case MIN_WIDTH:
      viewProps.yogaStyle.setMinDimension(yoga::Dimension::Width, get<yoga::Style::SizeLength>(animatedProp));
      break;

    case STYLE_OVERFLOW:
      viewProps.yogaStyle.setOverflow(get<yoga::Overflow>(animatedProp));
      break;

    case POSITION_TYPE:
      viewProps.yogaStyle.setPositionType(get<yoga::PositionType>(animatedProp));
      break;

    case Z_INDEX:
      viewProps.zIndex = get<std::optional<int>>(animatedProp);
      break;

    case DIRECTION:
      viewProps.yogaStyle.setDirection(get<yoga::Direction>(animatedProp));
      break;

    case BORDER_CURVES:
      viewProps.borderCurves = get<CascadedBorderCurves>(animatedProp);
      break;

    case BORDER_STYLES:
      viewProps.borderStyles = get<CascadedBorderStyles>(animatedProp);
      break;

    case POINTER_EVENTS:
      viewProps.pointerEvents = get<PointerEventsMode>(animatedProp);
      break;

    case ISOLATION:
      viewProps.isolation = get<Isolation>(animatedProp);
      break;

    case CURSOR:
      viewProps.cursor = get<Cursor>(animatedProp);
      break;

    case BOX_SHADOW:
      viewProps.boxShadow = get<std::vector<BoxShadow>>(animatedProp);
      break;

    case MIX_BLEND_MODE:
      viewProps.mixBlendMode = get<BlendMode>(animatedProp);
      break;

    case BACKFACE_VISIBILITY:
      viewProps.backfaceVisibility = get<BackfaceVisibility>(animatedProp);
      break;

    default:
      break;
  }
}
} // namespace facebook::react
