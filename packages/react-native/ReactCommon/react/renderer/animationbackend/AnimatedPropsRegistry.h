/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerCommitHook.h>
#include "AnimatedProps.h"

namespace facebook::react {

struct PropsSnapshot {
  BaseViewProps props;
  std::unordered_set<PropName> propNames;
  std::unique_ptr<folly::dynamic> rawProps;
};

struct SurfaceContext {
  std::unordered_map<Tag, std::unique_ptr<PropsSnapshot>> pendingMap, map;
  std::unordered_set<std::shared_ptr<const ShadowNodeFamily>> pendingFamilies, families;
};

struct SurfaceUpdates {
  std::unordered_set<std::shared_ptr<const ShadowNodeFamily>> families;
  std::unordered_map<Tag, AnimatedProps> propsMap;
  bool hasLayoutUpdates{false};
};

using SnapshotMap = std::unordered_map<Tag, std::unique_ptr<PropsSnapshot>>;

class AnimatedPropsRegistry {
 public:
  void update(const std::unordered_map<SurfaceId, SurfaceUpdates> &surfaceUpdates);
  void clear(SurfaceId surfaceId);
  void clearOnSurfaceStop(SurfaceId surfaceId);
  std::pair<std::unordered_set<std::shared_ptr<const ShadowNodeFamily>> &, SnapshotMap &> getMap(SurfaceId surfaceId);

 private:
  std::unordered_map<SurfaceId, SurfaceContext> surfaceContexts_;
  std::mutex mutex_;
};

inline void updateProp(const PropName propName, BaseViewProps &viewProps, const PropsSnapshot &snapshot)
{
  switch (propName) {
    case OPACITY:
      viewProps.opacity = snapshot.props.opacity;
      break;

    case WIDTH:
      viewProps.yogaStyle.setDimension(
          yoga::Dimension::Width, snapshot.props.yogaStyle.dimension(yoga::Dimension::Width));
      break;

    case HEIGHT: {
      auto d = snapshot.props.yogaStyle.dimension(yoga::Dimension::Height);
      viewProps.yogaStyle.setDimension(yoga::Dimension::Height, d);
      break;
    }

    case TRANSFORM:
      viewProps.transform = snapshot.props.transform;
      break;

    case TRANSFORM_ORIGIN:
      viewProps.transformOrigin = snapshot.props.transformOrigin;
      break;

    case BORDER_RADII:
      viewProps.borderRadii = snapshot.props.borderRadii;
      break;

    case FLEX:
      viewProps.yogaStyle.setFlex(snapshot.props.yogaStyle.flex());
      break;

    case BACKGROUND_COLOR:
      viewProps.backgroundColor = snapshot.props.backgroundColor;
      break;

    case SHADOW_COLOR:
      viewProps.shadowColor = snapshot.props.shadowColor;
      break;

    case SHADOW_OFFSET:
      viewProps.shadowOffset = snapshot.props.shadowOffset;
      break;

    case SHADOW_OPACITY:
      viewProps.shadowOpacity = snapshot.props.shadowOpacity;
      break;

    case SHADOW_RADIUS:
      viewProps.shadowRadius = snapshot.props.shadowRadius;
      break;

    case MARGIN:
      viewProps.yogaStyle.setMargin(yoga::Edge::Left, snapshot.props.yogaStyle.margin(yoga::Edge::Left));
      viewProps.yogaStyle.setMargin(yoga::Edge::Right, snapshot.props.yogaStyle.margin(yoga::Edge::Right));
      viewProps.yogaStyle.setMargin(yoga::Edge::Top, snapshot.props.yogaStyle.margin(yoga::Edge::Top));
      viewProps.yogaStyle.setMargin(yoga::Edge::Bottom, snapshot.props.yogaStyle.margin(yoga::Edge::Bottom));
      viewProps.yogaStyle.setMargin(yoga::Edge::Start, snapshot.props.yogaStyle.margin(yoga::Edge::Start));
      viewProps.yogaStyle.setMargin(yoga::Edge::End, snapshot.props.yogaStyle.margin(yoga::Edge::End));
      viewProps.yogaStyle.setMargin(yoga::Edge::Horizontal, snapshot.props.yogaStyle.margin(yoga::Edge::Horizontal));
      viewProps.yogaStyle.setMargin(yoga::Edge::Vertical, snapshot.props.yogaStyle.margin(yoga::Edge::Vertical));
      break;

    case PADDING:
      viewProps.yogaStyle.setPadding(yoga::Edge::Left, snapshot.props.yogaStyle.padding(yoga::Edge::Left));
      viewProps.yogaStyle.setPadding(yoga::Edge::Right, snapshot.props.yogaStyle.padding(yoga::Edge::Right));
      viewProps.yogaStyle.setPadding(yoga::Edge::Top, snapshot.props.yogaStyle.padding(yoga::Edge::Top));
      viewProps.yogaStyle.setPadding(yoga::Edge::Bottom, snapshot.props.yogaStyle.padding(yoga::Edge::Bottom));
      viewProps.yogaStyle.setPadding(yoga::Edge::Start, snapshot.props.yogaStyle.padding(yoga::Edge::Start));
      viewProps.yogaStyle.setPadding(yoga::Edge::End, snapshot.props.yogaStyle.padding(yoga::Edge::End));
      viewProps.yogaStyle.setPadding(yoga::Edge::Horizontal, snapshot.props.yogaStyle.padding(yoga::Edge::Horizontal));
      viewProps.yogaStyle.setPadding(yoga::Edge::Vertical, snapshot.props.yogaStyle.padding(yoga::Edge::Vertical));
      break;

    case POSITION:
      viewProps.yogaStyle.setPosition(yoga::Edge::Left, snapshot.props.yogaStyle.position(yoga::Edge::Left));
      viewProps.yogaStyle.setPosition(yoga::Edge::Right, snapshot.props.yogaStyle.position(yoga::Edge::Right));
      viewProps.yogaStyle.setPosition(yoga::Edge::Top, snapshot.props.yogaStyle.position(yoga::Edge::Top));
      viewProps.yogaStyle.setPosition(yoga::Edge::Bottom, snapshot.props.yogaStyle.position(yoga::Edge::Bottom));
      viewProps.yogaStyle.setPosition(yoga::Edge::Start, snapshot.props.yogaStyle.position(yoga::Edge::Start));
      viewProps.yogaStyle.setPosition(yoga::Edge::End, snapshot.props.yogaStyle.position(yoga::Edge::End));
      viewProps.yogaStyle.setPosition(
          yoga::Edge::Horizontal, snapshot.props.yogaStyle.position(yoga::Edge::Horizontal));
      viewProps.yogaStyle.setPosition(yoga::Edge::Vertical, snapshot.props.yogaStyle.position(yoga::Edge::Vertical));
      break;

    case BORDER_WIDTH:
      viewProps.yogaStyle.setBorder(yoga::Edge::Left, snapshot.props.yogaStyle.border(yoga::Edge::Left));
      viewProps.yogaStyle.setBorder(yoga::Edge::Right, snapshot.props.yogaStyle.border(yoga::Edge::Right));
      viewProps.yogaStyle.setBorder(yoga::Edge::Top, snapshot.props.yogaStyle.border(yoga::Edge::Top));
      viewProps.yogaStyle.setBorder(yoga::Edge::Bottom, snapshot.props.yogaStyle.border(yoga::Edge::Bottom));
      viewProps.yogaStyle.setBorder(yoga::Edge::Start, snapshot.props.yogaStyle.border(yoga::Edge::Start));
      viewProps.yogaStyle.setBorder(yoga::Edge::End, snapshot.props.yogaStyle.border(yoga::Edge::End));
      viewProps.yogaStyle.setBorder(yoga::Edge::Horizontal, snapshot.props.yogaStyle.border(yoga::Edge::Horizontal));
      viewProps.yogaStyle.setBorder(yoga::Edge::Vertical, snapshot.props.yogaStyle.border(yoga::Edge::Vertical));
      break;

    case BORDER_COLOR:
      viewProps.borderColors = snapshot.props.borderColors;
      break;

    case FILTER:
      viewProps.filter = snapshot.props.filter;
      break;

    case OUTLINE_COLOR:
      viewProps.outlineColor = snapshot.props.outlineColor;
      break;

    case OUTLINE_OFFSET:
      viewProps.outlineOffset = snapshot.props.outlineOffset;
      break;

    case OUTLINE_STYLE:
      viewProps.outlineStyle = snapshot.props.outlineStyle;
      break;

    case OUTLINE_WIDTH:
      viewProps.outlineWidth = snapshot.props.outlineWidth;
      break;

    case ALIGN_CONTENT:
      viewProps.yogaStyle.setAlignContent(snapshot.props.yogaStyle.alignContent());
      break;

    case ALIGN_ITEMS:
      viewProps.yogaStyle.setAlignItems(snapshot.props.yogaStyle.alignItems());
      break;

    case ALIGN_SELF:
      viewProps.yogaStyle.setAlignSelf(snapshot.props.yogaStyle.alignSelf());
      break;

    case ASPECT_RATIO:
      viewProps.yogaStyle.setAspectRatio(snapshot.props.yogaStyle.aspectRatio());
      break;

    case BOX_SIZING:
      viewProps.yogaStyle.setBoxSizing(snapshot.props.yogaStyle.boxSizing());
      break;

    case DISPLAY:
      viewProps.yogaStyle.setDisplay(snapshot.props.yogaStyle.display());
      break;

    case FLEX_BASIS:
      viewProps.yogaStyle.setFlexBasis(snapshot.props.yogaStyle.flexBasis());
      break;

    case FLEX_DIRECTION:
      viewProps.yogaStyle.setFlexDirection(snapshot.props.yogaStyle.flexDirection());
      break;

    case ROW_GAP:
      viewProps.yogaStyle.setGap(yoga::Gutter::Row, snapshot.props.yogaStyle.gap(yoga::Gutter::Row));
      break;

    case COLUMN_GAP:
      viewProps.yogaStyle.setGap(yoga::Gutter::Column, snapshot.props.yogaStyle.gap(yoga::Gutter::Column));
      break;

    case FLEX_GROW:
      viewProps.yogaStyle.setFlexGrow(snapshot.props.yogaStyle.flexGrow());
      break;

    case FLEX_SHRINK:
      viewProps.yogaStyle.setFlexShrink(snapshot.props.yogaStyle.flexShrink());
      break;

    case FLEX_WRAP:
      viewProps.yogaStyle.setFlexWrap(snapshot.props.yogaStyle.flexWrap());
      break;

    case JUSTIFY_CONTENT:
      viewProps.yogaStyle.setJustifyContent(snapshot.props.yogaStyle.justifyContent());
      break;

    case MAX_HEIGHT:
      viewProps.yogaStyle.setMaxDimension(
          yoga::Dimension::Height, snapshot.props.yogaStyle.maxDimension(yoga::Dimension::Height));
      break;

    case MAX_WIDTH:
      viewProps.yogaStyle.setMaxDimension(
          yoga::Dimension::Width, snapshot.props.yogaStyle.maxDimension(yoga::Dimension::Width));
      break;

    case MIN_HEIGHT:
      viewProps.yogaStyle.setMinDimension(
          yoga::Dimension::Height, snapshot.props.yogaStyle.minDimension(yoga::Dimension::Height));
      break;

    case MIN_WIDTH:
      viewProps.yogaStyle.setMinDimension(
          yoga::Dimension::Width, snapshot.props.yogaStyle.minDimension(yoga::Dimension::Width));
      break;

    case STYLE_OVERFLOW:
      viewProps.yogaStyle.setOverflow(snapshot.props.yogaStyle.overflow());
      break;

    case POSITION_TYPE:
      viewProps.yogaStyle.setPositionType(snapshot.props.yogaStyle.positionType());
      break;

    case Z_INDEX:
      viewProps.zIndex = snapshot.props.zIndex;
      break;

    case DIRECTION:
      viewProps.yogaStyle.setDirection(snapshot.props.yogaStyle.direction());
      break;

    case BORDER_CURVES:
      viewProps.borderCurves = snapshot.props.borderCurves;
      break;

    case BORDER_STYLES:
      viewProps.borderStyles = snapshot.props.borderStyles;
      break;

    case POINTER_EVENTS:
      viewProps.pointerEvents = snapshot.props.pointerEvents;
      break;

    case ISOLATION:
      viewProps.isolation = snapshot.props.isolation;
      break;

    case CURSOR:
      viewProps.cursor = snapshot.props.cursor;
      break;

    case BOX_SHADOW:
      viewProps.boxShadow = snapshot.props.boxShadow;
      break;

    case MIX_BLEND_MODE:
      viewProps.mixBlendMode = snapshot.props.mixBlendMode;
      break;

    case BACKFACE_VISIBILITY:
      viewProps.backfaceVisibility = snapshot.props.backfaceVisibility;
      break;

    default:
      throw std::runtime_error("Unknown property name");
  }
}

} // namespace facebook::react
