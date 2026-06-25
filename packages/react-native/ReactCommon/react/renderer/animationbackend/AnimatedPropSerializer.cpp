/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/graphics/Transform.h>
#include <react/renderer/graphics/TransformUtils.h>
#include <stdexcept>
#include "AnimatedPropsSerializer.h"

namespace facebook::react {

namespace {

void packBorderRadiusCorner(
    folly::dynamic& dyn,
    const std::string& propName,
    const std::optional<ValueUnit>& cornerValue) {
  if (cornerValue.has_value()) {
    dyn.insert(propName, cornerValue.value().value);
  }
}

void packBorderRadii(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& borderRadii = get<CascadedBorderRadii>(animatedProp);

  packBorderRadiusCorner(dyn, "borderTopRightRadius", borderRadii.topRight);
  packBorderRadiusCorner(dyn, "borderTopLeftRadius", borderRadii.topLeft);
  packBorderRadiusCorner(
      dyn, "borderBottomRightRadius", borderRadii.bottomRight);
  packBorderRadiusCorner(dyn, "borderBottomLeftRadius", borderRadii.bottomLeft);
  packBorderRadiusCorner(dyn, "borderTopStartRadius", borderRadii.topStart);
  packBorderRadiusCorner(dyn, "borderTopEndRadius", borderRadii.topEnd);
  packBorderRadiusCorner(
      dyn, "borderBottomStartRadius", borderRadii.bottomStart);
  packBorderRadiusCorner(dyn, "borderBottomEndRadius", borderRadii.bottomEnd);
  packBorderRadiusCorner(dyn, "borderStartStartRadius", borderRadii.startStart);
  packBorderRadiusCorner(dyn, "borderStartEndRadius", borderRadii.startEnd);
  packBorderRadiusCorner(dyn, "borderEndStartRadius", borderRadii.endStart);
  packBorderRadiusCorner(dyn, "borderEndEndRadius", borderRadii.endEnd);

  if (borderRadii.all.has_value()) {
    dyn.insert("borderRadius", borderRadii.all.value().value);
  }
}

void packOpacity(folly::dynamic& dyn, const AnimatedPropBase& animatedProp) {
  dyn.insert("opacity", get<Float>(animatedProp));
}

void packTransform(folly::dynamic& dyn, const AnimatedPropBase& animatedProp) {
  const auto& transform = get<Transform>(animatedProp);
  auto transformArray = folly::dynamic::array();

  for (const auto& operation : transform.operations) {
    updateTransformProps(transform, operation, transformArray);
  }

  dyn.insert("transform", transformArray);
}

std::string unitTypeToString(UnitType unit) {
  switch (unit) {
    case UnitType::Undefined:
      return "undefined";
    case UnitType::Point:
      return "point";
    case UnitType::Percent:
      return "percent";
    default:
      throw std::runtime_error("Unknown unit type");
  }
}

void packTransformOrigin(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& transformOrigin = get<TransformOrigin>(animatedProp);
  auto originArray = folly::dynamic::array();
  for (const auto& xyValue : transformOrigin.xy) {
    folly::dynamic valueObj = folly::dynamic::object();
    valueObj["value"] = xyValue.value;
    valueObj["unit"] = unitTypeToString(xyValue.unit);
    originArray.push_back(valueObj);
  }
  originArray.push_back(transformOrigin.z);
  dyn.insert("transformOrigin", originArray);
}

void packBackgroundColor(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& backgroundColor = get<SharedColor>(animatedProp);
  dyn.insert("backgroundColor", static_cast<int32_t>(*backgroundColor));
}

void packShadowColor(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& shadowColor = get<SharedColor>(animatedProp);
  dyn.insert("shadowColor", static_cast<int32_t>(*shadowColor));
}

void packShadowOffset(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& shadowOffset = get<Size>(animatedProp);
  dyn.insert(
      "shadowOffset",
      folly::dynamic::object("width", shadowOffset.width)(
          "height", shadowOffset.height));
}

void packShadowOpacity(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  dyn.insert("shadowOpacity", get<Float>(animatedProp));
}

void packShadowRadius(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  dyn.insert("shadowRadius", get<Float>(animatedProp));
}

void packBorderColorEdge(
    folly::dynamic& dyn,
    const std::string& propName,
    const std::optional<SharedColor>& colorValue) {
  if (colorValue.has_value() && colorValue.value()) {
    dyn.insert(propName, static_cast<int32_t>(*colorValue.value()));
  }
}

void packBorderColor(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& borderColors = get<CascadedBorderColors>(animatedProp);

  packBorderColorEdge(dyn, "borderLeftColor", borderColors.left);
  packBorderColorEdge(dyn, "borderTopColor", borderColors.top);
  packBorderColorEdge(dyn, "borderRightColor", borderColors.right);
  packBorderColorEdge(dyn, "borderBottomColor", borderColors.bottom);
  packBorderColorEdge(dyn, "borderStartColor", borderColors.start);
  packBorderColorEdge(dyn, "borderEndColor", borderColors.end);

  if (borderColors.all.has_value() && borderColors.all.value()) {
    dyn.insert("borderColor", static_cast<int32_t>(*borderColors.all.value()));
  }
}

void packFilter(folly::dynamic& dyn, const AnimatedPropBase& animatedProp) {
  const auto& filters = get<std::vector<FilterFunction>>(animatedProp);
  auto filterArray = folly::dynamic::array();
  for (const auto& f : filters) {
    folly::dynamic filterObj = folly::dynamic::object();
    std::string typeKey = toString(f.type);
    if (std::holds_alternative<Float>(f.parameters)) {
      filterObj[typeKey] = std::get<Float>(f.parameters);
    } else if (std::holds_alternative<DropShadowParams>(f.parameters)) {
      const auto& dropShadowParams = std::get<DropShadowParams>(f.parameters);
      folly::dynamic shadowObj = folly::dynamic::object();
      shadowObj["offsetX"] = dropShadowParams.offsetX;
      shadowObj["offsetY"] = dropShadowParams.offsetY;
      shadowObj["standardDeviation"] = dropShadowParams.standardDeviation;
      shadowObj["color"] = static_cast<int32_t>(*dropShadowParams.color);
      filterObj[typeKey] = shadowObj;
    }
    filterArray.push_back(filterObj);
  }
  dyn.insert("filter", filterArray);
}

void packOutlineColor(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& outlineColor = get<SharedColor>(animatedProp);
  dyn.insert("outlineColor", static_cast<int32_t>(*outlineColor));
}

void packOutlineOffset(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  dyn.insert("outlineOffset", get<Float>(animatedProp));
}

void packOutlineStyle(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& outlineStyle = get<OutlineStyle>(animatedProp);
  std::string styleStr;
  switch (outlineStyle) {
    case OutlineStyle::Solid:
      styleStr = "solid";
      break;
    case OutlineStyle::Dotted:
      styleStr = "dotted";
      break;
    case OutlineStyle::Dashed:
      styleStr = "dashed";
      break;
    default:
      throw std::runtime_error("Unknown outline style");
  }
  dyn.insert("outlineStyle", styleStr);
}

void packOutlineWidth(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  dyn.insert("outlineWidth", get<Float>(animatedProp));
}

void packBorderCurveEdge(
    folly::dynamic& dyn,
    const std::string& propName,
    const std::optional<BorderCurve>& curveValue) {
  if (curveValue.has_value()) {
    std::string curveStr;
    switch (curveValue.value()) {
      case BorderCurve::Circular:
        curveStr = "circular";
        break;
      case BorderCurve::Continuous:
        curveStr = "continuous";
        break;
      default:
        throw std::runtime_error("Unknown border curve");
    }
    dyn.insert(propName, curveStr);
  }
}

void packBorderCurves(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& borderCurves = get<CascadedBorderCurves>(animatedProp);

  packBorderCurveEdge(dyn, "borderTopLeftCurve", borderCurves.topLeft);
  packBorderCurveEdge(dyn, "borderTopRightCurve", borderCurves.topRight);
  packBorderCurveEdge(dyn, "borderBottomLeftCurve", borderCurves.bottomLeft);
  packBorderCurveEdge(dyn, "borderBottomRightCurve", borderCurves.bottomRight);

  if (borderCurves.all.has_value()) {
    std::string curveStr;
    switch (borderCurves.all.value()) {
      case BorderCurve::Circular:
        curveStr = "circular";
        break;
      case BorderCurve::Continuous:
        curveStr = "continuous";
        break;
      default:
        throw std::runtime_error("Unknown border curve");
    }
    dyn.insert("borderCurve", curveStr);
  }
}

std::string borderStyleToString(BorderStyle style) {
  switch (style) {
    case BorderStyle::Solid:
      return "solid";
    case BorderStyle::Dotted:
      return "dotted";
    case BorderStyle::Dashed:
      return "dashed";
    default:
      throw std::runtime_error("Unknown border style");
  }
}

void packBorderStyleEdge(
    folly::dynamic& dyn,
    const std::string& propName,
    const std::optional<BorderStyle>& styleValue) {
  if (styleValue.has_value()) {
    dyn.insert(propName, borderStyleToString(styleValue.value()));
  }
}

void packBorderStyles(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& borderStyles = get<CascadedBorderStyles>(animatedProp);

  packBorderStyleEdge(dyn, "borderLeftStyle", borderStyles.left);
  packBorderStyleEdge(dyn, "borderTopStyle", borderStyles.top);
  packBorderStyleEdge(dyn, "borderRightStyle", borderStyles.right);
  packBorderStyleEdge(dyn, "borderBottomStyle", borderStyles.bottom);
  packBorderStyleEdge(dyn, "borderStartStyle", borderStyles.start);
  packBorderStyleEdge(dyn, "borderEndStyle", borderStyles.end);

  if (borderStyles.all.has_value()) {
    dyn.insert("borderStyle", borderStyleToString(borderStyles.all.value()));
  }
}

void packPointerEvents(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& pointerEvents = get<PointerEventsMode>(animatedProp);
  std::string pointerEventsStr;
  switch (pointerEvents) {
    case PointerEventsMode::Auto:
      pointerEventsStr = "auto";
      break;
    case PointerEventsMode::None:
      pointerEventsStr = "none";
      break;
    case PointerEventsMode::BoxNone:
      pointerEventsStr = "box-none";
      break;
    case PointerEventsMode::BoxOnly:
      pointerEventsStr = "box-only";
      break;
    default:
      throw std::runtime_error("Unknown pointer events mode");
  }
  dyn.insert("pointerEvents", pointerEventsStr);
}

void packIsolation(folly::dynamic& dyn, const AnimatedPropBase& animatedProp) {
  const auto& isolation = get<Isolation>(animatedProp);
  std::string isolationStr;
  switch (isolation) {
    case Isolation::Auto:
      isolationStr = "auto";
      break;
    case Isolation::Isolate:
      isolationStr = "isolate";
      break;
    default:
      throw std::runtime_error("Unknown isolation mode");
  }
  dyn.insert("isolation", isolationStr);
}

void packCursor(folly::dynamic& dyn, const AnimatedPropBase& animatedProp) {
  const auto& cursor = get<Cursor>(animatedProp);
  std::string cursorStr;
  switch (cursor) {
    case Cursor::Auto:
      cursorStr = "auto";
      break;
    case Cursor::Alias:
      cursorStr = "alias";
      break;
    case Cursor::AllScroll:
      cursorStr = "all-scroll";
      break;
    case Cursor::Cell:
      cursorStr = "cell";
      break;
    case Cursor::ColResize:
      cursorStr = "col-resize";
      break;
    case Cursor::ContextMenu:
      cursorStr = "context-menu";
      break;
    case Cursor::Copy:
      cursorStr = "copy";
      break;
    case Cursor::Crosshair:
      cursorStr = "crosshair";
      break;
    case Cursor::Default:
      cursorStr = "default";
      break;
    case Cursor::EResize:
      cursorStr = "e-resize";
      break;
    case Cursor::EWResize:
      cursorStr = "ew-resize";
      break;
    case Cursor::Grab:
      cursorStr = "grab";
      break;
    case Cursor::Grabbing:
      cursorStr = "grabbing";
      break;
    case Cursor::Help:
      cursorStr = "help";
      break;
    case Cursor::Move:
      cursorStr = "move";
      break;
    case Cursor::NResize:
      cursorStr = "n-resize";
      break;
    case Cursor::NEResize:
      cursorStr = "ne-resize";
      break;
    case Cursor::NESWResize:
      cursorStr = "nesw-resize";
      break;
    case Cursor::NSResize:
      cursorStr = "ns-resize";
      break;
    case Cursor::NWResize:
      cursorStr = "nw-resize";
      break;
    case Cursor::NWSEResize:
      cursorStr = "nwse-resize";
      break;
    case Cursor::NoDrop:
      cursorStr = "no-drop";
      break;
    case Cursor::None:
      cursorStr = "none";
      break;
    case Cursor::NotAllowed:
      cursorStr = "not-allowed";
      break;
    case Cursor::Pointer:
      cursorStr = "pointer";
      break;
    case Cursor::Progress:
      cursorStr = "progress";
      break;
    case Cursor::RowResize:
      cursorStr = "row-resize";
      break;
    case Cursor::SResize:
      cursorStr = "s-resize";
      break;
    case Cursor::SEResize:
      cursorStr = "se-resize";
      break;
    case Cursor::SWResize:
      cursorStr = "sw-resize";
      break;
    case Cursor::Text:
      cursorStr = "text";
      break;
    case Cursor::Url:
      cursorStr = "url";
      break;
    case Cursor::WResize:
      cursorStr = "w-resize";
      break;
    case Cursor::Wait:
      cursorStr = "wait";
      break;
    case Cursor::ZoomIn:
      cursorStr = "zoom-in";
      break;
    case Cursor::ZoomOut:
      cursorStr = "zoom-out";
      break;
    default:
      throw std::runtime_error("Unknown cursor type");
  }
  dyn.insert("cursor", cursorStr);
}

void packBoxShadow(folly::dynamic& dyn, const AnimatedPropBase& animatedProp) {
  const auto& boxShadows = get<std::vector<BoxShadow>>(animatedProp);
  auto shadowArray = folly::dynamic::array();
  for (const auto& shadow : boxShadows) {
    folly::dynamic shadowObj = folly::dynamic::object();
    shadowObj["offsetX"] = shadow.offsetX;
    shadowObj["offsetY"] = shadow.offsetY;
    shadowObj["blurRadius"] = shadow.blurRadius;
    shadowObj["spreadDistance"] = shadow.spreadDistance;
    shadowObj["inset"] = shadow.inset;
    if (shadow.color) {
      shadowObj["color"] = static_cast<int32_t>(*shadow.color);
    }
    shadowArray.push_back(shadowObj);
  }
  dyn.insert("boxShadow", shadowArray);
}

void packMixBlendMode(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& mixBlendMode = get<BlendMode>(animatedProp);
  std::string blendModeStr;
  switch (mixBlendMode) {
    case BlendMode::Normal:
      blendModeStr = "normal";
      break;
    case BlendMode::Multiply:
      blendModeStr = "multiply";
      break;
    case BlendMode::Screen:
      blendModeStr = "screen";
      break;
    case BlendMode::Overlay:
      blendModeStr = "overlay";
      break;
    case BlendMode::Darken:
      blendModeStr = "darken";
      break;
    case BlendMode::Lighten:
      blendModeStr = "lighten";
      break;
    case BlendMode::ColorDodge:
      blendModeStr = "color-dodge";
      break;
    case BlendMode::ColorBurn:
      blendModeStr = "color-burn";
      break;
    case BlendMode::HardLight:
      blendModeStr = "hard-light";
      break;
    case BlendMode::SoftLight:
      blendModeStr = "soft-light";
      break;
    case BlendMode::Difference:
      blendModeStr = "difference";
      break;
    case BlendMode::Exclusion:
      blendModeStr = "exclusion";
      break;
    case BlendMode::Hue:
      blendModeStr = "hue";
      break;
    case BlendMode::Saturation:
      blendModeStr = "saturation";
      break;
    case BlendMode::Color:
      blendModeStr = "color";
      break;
    case BlendMode::Luminosity:
      blendModeStr = "luminosity";
      break;
    case BlendMode::PlusLighter:
      blendModeStr = "plus-lighter";
      break;
    default:
      throw std::runtime_error("Unknown blend mode");
  }
  dyn.insert("mixBlendMode", blendModeStr);
}

void packBackfaceVisibility(
    folly::dynamic& dyn,
    const AnimatedPropBase& animatedProp) {
  const auto& backfaceVisibility = get<BackfaceVisibility>(animatedProp);
  std::string visibilityStr;
  switch (backfaceVisibility) {
    case BackfaceVisibility::Auto:
      visibilityStr = "auto";
      break;
    case BackfaceVisibility::Visible:
      visibilityStr = "visible";
      break;
    case BackfaceVisibility::Hidden:
      visibilityStr = "hidden";
      break;
    default:
      throw std::runtime_error("Unknown backface visibility");
  }
  dyn.insert("backfaceVisibility", visibilityStr);
}

void packAnimatedProp(
    folly::dynamic& dyn,
    const std::unique_ptr<AnimatedPropBase>& animatedProp) {
  switch (animatedProp->propName) {
    case OPACITY:
      packOpacity(dyn, *animatedProp);
      break;

    case TRANSFORM:
      packTransform(dyn, *animatedProp);
      break;

    case TRANSFORM_ORIGIN:
      packTransformOrigin(dyn, *animatedProp);
      break;

    case BACKGROUND_COLOR:
      packBackgroundColor(dyn, *animatedProp);
      break;

    case BORDER_RADII:
      packBorderRadii(dyn, *animatedProp);
      break;

    case SHADOW_COLOR:
      packShadowColor(dyn, *animatedProp);
      break;

    case SHADOW_OFFSET:
      packShadowOffset(dyn, *animatedProp);
      break;

    case SHADOW_OPACITY:
      packShadowOpacity(dyn, *animatedProp);
      break;

    case SHADOW_RADIUS:
      packShadowRadius(dyn, *animatedProp);
      break;

    case BORDER_COLOR:
      packBorderColor(dyn, *animatedProp);
      break;

    case FILTER:
      packFilter(dyn, *animatedProp);
      break;

    case OUTLINE_COLOR:
      packOutlineColor(dyn, *animatedProp);
      break;

    case OUTLINE_OFFSET:
      packOutlineOffset(dyn, *animatedProp);
      break;

    case OUTLINE_STYLE:
      packOutlineStyle(dyn, *animatedProp);
      break;

    case OUTLINE_WIDTH:
      packOutlineWidth(dyn, *animatedProp);
      break;

    case BORDER_CURVES:
      packBorderCurves(dyn, *animatedProp);
      break;

    case BORDER_STYLES:
      packBorderStyles(dyn, *animatedProp);
      break;

    case POINTER_EVENTS:
      packPointerEvents(dyn, *animatedProp);
      break;

    case ISOLATION:
      packIsolation(dyn, *animatedProp);
      break;

    case CURSOR:
      packCursor(dyn, *animatedProp);
      break;

    case BOX_SHADOW:
      packBoxShadow(dyn, *animatedProp);
      break;

    case MIX_BLEND_MODE:
      packMixBlendMode(dyn, *animatedProp);
      break;

    case BACKFACE_VISIBILITY:
      packBackfaceVisibility(dyn, *animatedProp);
      break;

    case WIDTH:
    case HEIGHT:
    case FLEX:
    case PADDING:
    case MARGIN:
    case POSITION:
    case BORDER_WIDTH:
    case ALIGN_CONTENT:
    case ALIGN_ITEMS:
    case ALIGN_SELF:
    case ASPECT_RATIO:
    case BOX_SIZING:
    case DISPLAY:
    case FLEX_BASIS:
    case FLEX_DIRECTION:
    case ROW_GAP:
    case COLUMN_GAP:
    case FLEX_GROW:
    case FLEX_SHRINK:
    case FLEX_WRAP:
    case JUSTIFY_CONTENT:
    case MAX_HEIGHT:
    case MAX_WIDTH:
    case MIN_HEIGHT:
    case MIN_WIDTH:
    case STYLE_OVERFLOW:
    case POSITION_TYPE:
    case Z_INDEX:
    case DIRECTION:
      throw std::runtime_error("Tried to synchronously update layout props");
    default:
      throw std::runtime_error("Unknown animated prop");
  }
}

} // namespace

namespace animationbackend {

folly::dynamic packAnimatedProps(const AnimatedProps& animatedProps) {
  auto dyn = animatedProps.rawProps ? animatedProps.rawProps->toDynamic()
                                    : folly::dynamic::object();

  for (auto& animatedProp : animatedProps.props) {
    packAnimatedProp(dyn, animatedProp);
  }

  return dyn;
}

} // namespace animationbackend

} // namespace facebook::react
