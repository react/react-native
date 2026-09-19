/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ClipPath.h"

#include <folly/dynamic.h>
#include <sstream>
#include <string>
#include <vector>

namespace facebook::react {

namespace {
std::string geometryBoxToString(facebook::react::GeometryBox box) {
  switch (box) {
    case facebook::react::GeometryBox::MarginBox:
      return "margin-box";
    case facebook::react::GeometryBox::BorderBox:
      return "border-box";
    case facebook::react::GeometryBox::ContentBox:
      return "content-box";
    case facebook::react::GeometryBox::PaddingBox:
      return "padding-box";
    case facebook::react::GeometryBox::FillBox:
      return "fill-box";
    case facebook::react::GeometryBox::StrokeBox:
      return "stroke-box";
    case facebook::react::GeometryBox::ViewBox:
      return "view-box";
  }
}
} // namespace

bool CircleShape::operator==(const CircleShape& other) const {
  return cx == other.cx && cy == other.cy && r == other.r;
}

#if RN_DEBUG_STRING_CONVERTIBLE
void CircleShape::toString(std::stringstream& ss) const {
  ss << "circle(";
  if (r) {
    ss << r->toString();
  }
  if (cx || cy) {
    ss << " at ";
    if (cx) {
      ss << cx->toString();
    }
    if (cy) {
      ss << " " << cy->toString();
    }
  }
  ss << ")";
}
#endif

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic CircleShape::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  if (r) {
    result["r"] = r->toDynamic();
  }
  if (cx) {
    result["cx"] = cx->toDynamic();
  }
  if (cy) {
    result["cy"] = cy->toDynamic();
  }
  return result;
}
#endif

bool EllipseShape::operator==(const EllipseShape& other) const {
  return cx == other.cx && cy == other.cy && rx == other.rx && ry == other.ry;
}

#if RN_DEBUG_STRING_CONVERTIBLE
void EllipseShape::toString(std::stringstream& ss) const {
  ss << "ellipse(";
  if (rx) {
    ss << rx->toString();
  }
  if (ry) {
    ss << " " << ry->toString();
  }
  if (cx || cy) {
    ss << " at ";
    if (cx) {
      ss << cx->toString();
    }
    if (cy) {
      ss << " " << cy->toString();
    }
  }
  ss << ")";
}
#endif

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic EllipseShape::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  if (rx) {
    result["rx"] = rx->toDynamic();
  }
  if (ry) {
    result["ry"] = ry->toDynamic();
  }
  if (cx) {
    result["cx"] = cx->toDynamic();
  }
  if (cy) {
    result["cy"] = cy->toDynamic();
  }
  return result;
}
#endif

bool InsetShape::operator==(const InsetShape& other) const {
  return top == other.top && right == other.right && bottom == other.bottom &&
      left == other.left && borderRadius == other.borderRadius;
}

#if RN_DEBUG_STRING_CONVERTIBLE
void InsetShape::toString(std::stringstream& ss) const {
  ss << "inset(" << top.toString() << " " << right.toString() << " "
     << bottom.toString() << " " << left.toString();
  if (borderRadius) {
    ss << " round " << borderRadius->toString();
  }
  ss << ")";
}
#endif

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic InsetShape::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  result["top"] = top.toDynamic();
  result["right"] = right.toDynamic();
  result["bottom"] = bottom.toDynamic();
  result["left"] = left.toDynamic();
  if (borderRadius) {
    result["borderRadius"] = borderRadius->toDynamic();
  }
  return result;
}
#endif

bool PolygonShape::operator==(const PolygonShape& other) const {
  return points == other.points && fillRule == other.fillRule;
}

#if RN_DEBUG_STRING_CONVERTIBLE
void PolygonShape::toString(std::stringstream& ss) const {
  ss << "polygon(";
  for (size_t i = 0; i < points.size(); i++) {
    if (i > 0) {
      ss << ", ";
    }
    ss << points[i].first.toString() << " " << points[i].second.toString();
  }
  ss << ")";
}
#endif

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic PolygonShape::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  folly::dynamic pointsArray = folly::dynamic::array();
  for (const auto& point : points) {
    folly::dynamic pointObj = folly::dynamic::object();
    pointObj["x"] = point.first.toDynamic();
    pointObj["y"] = point.second.toDynamic();
    pointsArray.push_back(pointObj);
  }
  result["points"] = pointsArray;
  if (fillRule) {
    result["fillRule"] = fillRule == FillRule::EvenOdd ? "evenodd" : "nonzero";
  }
  return result;
}
#endif

bool RectShape::operator==(const RectShape& other) const {
  return top == other.top && right == other.right && bottom == other.bottom &&
      left == other.left && borderRadius == other.borderRadius;
}

#if RN_DEBUG_STRING_CONVERTIBLE
void RectShape::toString(std::stringstream& ss) const {
  ss << "rect(" << top.toString() << " " << right.toString() << " "
     << bottom.toString() << " " << left.toString() << " ";
  if (borderRadius) {
    ss << "round " << borderRadius->toString();
  }
  ss << ")";
}
#endif

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic RectShape::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  result["top"] = top.toDynamic();
  result["right"] = right.toDynamic();
  result["bottom"] = bottom.toDynamic();
  result["left"] = left.toDynamic();
  if (borderRadius) {
    result["borderRadius"] = borderRadius->toDynamic();
  }
  return result;
}
#endif

bool XywhShape::operator==(const XywhShape& other) const {
  return x == other.x && y == other.y && width == other.width &&
      height == other.height && borderRadius == other.borderRadius;
}

#if RN_DEBUG_STRING_CONVERTIBLE
void XywhShape::toString(std::stringstream& ss) const {
  ss << "xywh(" << x.toString() << " " << y.toString() << " "
     << width.toString() << " " << height.toString();
  if (borderRadius) {
    ss << " round " << borderRadius->toString();
  }
  ss << ")";
}
#endif

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic XywhShape::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  result["x"] = x.toDynamic();
  result["y"] = y.toDynamic();
  result["width"] = width.toDynamic();
  result["height"] = height.toDynamic();
  if (borderRadius) {
    result["borderRadius"] = borderRadius->toDynamic();
  }
  return result;
}
#endif

bool ClipPath::operator==(const ClipPath& other) const {
  return shape == other.shape && geometryBox == other.geometryBox;
}

#if RN_DEBUG_STRING_CONVERTIBLE
std::string ClipPath::toString() const {
  std::stringstream ss;

  if (shape) {
    std::visit([&](const auto& s) { s.toString(ss); }, *shape);
  }

  if (geometryBox) {
    if (shape) {
      ss << " ";
    }
    ss << geometryBoxToString(*geometryBox);
  }

  return ss.str();
}
#endif

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic ClipPath::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();

  if (shape) {
    result["shape"] =
        std::visit([](const auto& s) { return s.toDynamic(); }, *shape);
  }

  if (geometryBox) {
    result["geometryBox"] = geometryBoxToString(*geometryBox);
  }

  return result;
}
#endif

} // namespace facebook::react
