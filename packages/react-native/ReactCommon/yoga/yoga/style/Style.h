/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <cstdint>
#include <type_traits>

#include <yoga/Yoga.h>

#include <yoga/algorithm/FlexDirection.h>
#include <yoga/enums/Align.h>
#include <yoga/enums/BoxSizing.h>
#include <yoga/enums/Dimension.h>
#include <yoga/enums/Direction.h>
#include <yoga/enums/Display.h>
#include <yoga/enums/Edge.h>
#include <yoga/enums/FlexDirection.h>
#include <yoga/enums/Gutter.h>
#include <yoga/enums/Justify.h>
#include <yoga/enums/Overflow.h>
#include <yoga/enums/PhysicalEdge.h>
#include <yoga/enums/PositionType.h>
#include <yoga/enums/Unit.h>
#include <yoga/enums/Wrap.h>
#include <yoga/numeric/FloatOptional.h>
#include <yoga/style/GridLine.h>
#include <yoga/style/GridTrack.h>
#include <yoga/style/StyleLength.h>
#include <yoga/style/StyleSizeLength.h>
#include <yoga/style/StyleValuePool.h>

namespace facebook::yoga {

class YG_EXPORT Style {
 public:
  using Length = StyleLength;
  using SizeLength = StyleSizeLength;

  static constexpr float DefaultFlexGrow = 0.0f;
  static constexpr float DefaultFlexShrink = 0.0f;
  static constexpr float WebDefaultFlexShrink = 1.0f;

  Direction direction() const {
    return direction_;
  }
  void setDirection(Direction value) {
    direction_ = value;
  }

  FlexDirection flexDirection() const {
    return flexDirection_;
  }
  void setFlexDirection(FlexDirection value) {
    flexDirection_ = value;
  }

  Justify justifyContent() const {
    return justifyContent_;
  }
  void setJustifyContent(Justify value) {
    justifyContent_ = value;
  }

  Justify justifyItems() const {
    return justifyItems_;
  }
  void setJustifyItems(Justify value) {
    justifyItems_ = value;
  }

  Justify justifySelf() const {
    return justifySelf_;
  }
  void setJustifySelf(Justify value) {
    justifySelf_ = value;
  }

  Align alignContent() const {
    return alignContent_;
  }
  void setAlignContent(Align value) {
    alignContent_ = value;
  }

  Align alignItems() const {
    return alignItems_;
  }
  void setAlignItems(Align value) {
    alignItems_ = value;
  }

  Align alignSelf() const {
    return alignSelf_;
  }
  void setAlignSelf(Align value) {
    alignSelf_ = value;
  }

  PositionType positionType() const {
    return positionType_;
  }
  void setPositionType(PositionType value) {
    positionType_ = value;
  }

  Wrap flexWrap() const {
    return flexWrap_;
  }
  void setFlexWrap(Wrap value) {
    flexWrap_ = value;
  }

  Overflow overflow() const {
    return overflow_;
  }
  void setOverflow(Overflow value) {
    overflow_ = value;
  }

  Display display() const {
    return display_;
  }
  void setDisplay(Display value) {
    display_ = value;
  }

  FloatOptional flex() const {
    return pool_.getNumber(flex_);
  }
  void setFlex(FloatOptional value) {
    pool_.store(flex_, value);
  }

  FloatOptional flexGrow() const {
    return pool_.getNumber(flexGrow_);
  }
  void setFlexGrow(FloatOptional value) {
    pool_.store(flexGrow_, value);
  }

  FloatOptional flexShrink() const {
    return pool_.getNumber(flexShrink_);
  }
  void setFlexShrink(FloatOptional value) {
    pool_.store(flexShrink_, value);
  }

  Style::SizeLength flexBasis() const {
    return pool_.getSize(flexBasis_);
  }
  void setFlexBasis(Style::SizeLength value) {
    pool_.store(flexBasis_, value);
  }

  Style::Length margin(Edge edge) const {
    return pool_.getLength(margin_[yoga::to_underlying(edge)]);
  }
  void setMargin(Edge edge, Style::Length value) {
    pool_.store(margin_[yoga::to_underlying(edge)], value);
  }

  Style::Length position(Edge edge) const {
    return pool_.getLength(position_[yoga::to_underlying(edge)]);
  }
  void setPosition(Edge edge, Style::Length value) {
    pool_.store(position_[yoga::to_underlying(edge)], value);
  }

  Style::Length padding(Edge edge) const {
    return pool_.getLength(padding_[yoga::to_underlying(edge)]);
  }
  void setPadding(Edge edge, Style::Length value) {
    pool_.store(padding_[yoga::to_underlying(edge)], value);
  }

  Style::Length border(Edge edge) const {
    return pool_.getLength(border_[yoga::to_underlying(edge)]);
  }
  void setBorder(Edge edge, Style::Length value) {
    pool_.store(border_[yoga::to_underlying(edge)], value);
  }

  Style::Length gap(Gutter gutter) const {
    return pool_.getLength(gap_[yoga::to_underlying(gutter)]);
  }
  void setGap(Gutter gutter, Style::Length value) {
    pool_.store(gap_[yoga::to_underlying(gutter)], value);
  }

  Style::SizeLength dimension(Dimension axis) const {
    return pool_.getSize(dimensions_[yoga::to_underlying(axis)]);
  }
  void setDimension(Dimension axis, Style::SizeLength value) {
    pool_.store(dimensions_[yoga::to_underlying(axis)], value);
  }

  Style::SizeLength minDimension(Dimension axis) const {
    return pool_.getSize(minDimensions_[yoga::to_underlying(axis)]);
  }
  void setMinDimension(Dimension axis, Style::SizeLength value) {
    pool_.store(minDimensions_[yoga::to_underlying(axis)], value);
  }

  // Grid Container Properties
  const GridTrackList& gridTemplateColumns() const {
    return gridTemplateColumns_;
  }
  void setGridTemplateColumns(GridTrackList value) {
    gridTemplateColumns_ = std::move(value);
  }
  void resizeGridTemplateColumns(size_t count) {
    gridTemplateColumns_.resize(count);
  }
  void setGridTemplateColumnAt(size_t index, GridTrackSize value) {
    gridTemplateColumns_[index] = value;
  }

  const GridTrackList& gridTemplateRows() const {
    return gridTemplateRows_;
  }
  void setGridTemplateRows(GridTrackList value) {
    gridTemplateRows_ = std::move(value);
  }
  void resizeGridTemplateRows(size_t count) {
    gridTemplateRows_.resize(count);
  }
  void setGridTemplateRowAt(size_t index, GridTrackSize value) {
    gridTemplateRows_[index] = value;
  }

  const GridTrackList& gridAutoColumns() const {
    return gridAutoColumns_;
  }
  void setGridAutoColumns(GridTrackList value) {
    gridAutoColumns_ = std::move(value);
  }
  void resizeGridAutoColumns(size_t count) {
    gridAutoColumns_.resize(count);
  }
  void setGridAutoColumnAt(size_t index, GridTrackSize value) {
    gridAutoColumns_[index] = value;
  }

  const GridTrackList& gridAutoRows() const {
    return gridAutoRows_;
  }
  void setGridAutoRows(GridTrackList value) {
    gridAutoRows_ = std::move(value);
  }
  void resizeGridAutoRows(size_t count) {
    gridAutoRows_.resize(count);
  }
  void setGridAutoRowAt(size_t index, GridTrackSize value) {
    gridAutoRows_[index] = value;
  }

  // Grid Item Properties
  const GridLine& gridColumnStart() const {
    return gridColumnStart_;
  }
  void setGridColumnStart(GridLine value) {
    gridColumnStart_ = value;
  }

  const GridLine& gridColumnEnd() const {
    return gridColumnEnd_;
  }
  void setGridColumnEnd(GridLine value) {
    gridColumnEnd_ = value;
  }

  const GridLine& gridRowStart() const {
    return gridRowStart_;
  }
  void setGridRowStart(GridLine value) {
    gridRowStart_ = value;
  }

  const GridLine& gridRowEnd() const {
    return gridRowEnd_;
  }
  void setGridRowEnd(GridLine value) {
    gridRowEnd_ = value;
  }

  FloatOptional resolvedMinDimension(
      Direction direction,
      Dimension axis,
      float referenceLength,
      float ownerWidth,
      YGNodeConstRef node) const {
    const auto handle = minDimensions_[yoga::to_underlying(axis)];
    if (handle.isUndefined()) {
      return FloatOptional{};
    }
    FloatOptional value = resolve(handle, referenceLength, node);
    if (boxSizing() == BoxSizing::BorderBox || !value.isDefined()) {
      return value;
    }

    FloatOptional dimensionPaddingAndBorder = FloatOptional{
        computePaddingAndBorderForDimension(direction, axis, ownerWidth, node)};

    return value +
        (dimensionPaddingAndBorder.isDefined() ? dimensionPaddingAndBorder
                                               : FloatOptional{0.0});
  }

  Style::SizeLength maxDimension(Dimension axis) const {
    return pool_.getSize(maxDimensions_[yoga::to_underlying(axis)]);
  }
  void setMaxDimension(Dimension axis, Style::SizeLength value) {
    pool_.store(maxDimensions_[yoga::to_underlying(axis)], value);
  }

  FloatOptional resolvedMaxDimension(
      Direction direction,
      Dimension axis,
      float referenceLength,
      float ownerWidth,
      YGNodeConstRef node) const {
    const auto handle = maxDimensions_[yoga::to_underlying(axis)];
    if (handle.isUndefined()) {
      return FloatOptional{};
    }
    FloatOptional value = resolve(handle, referenceLength, node);
    if (boxSizing() == BoxSizing::BorderBox || !value.isDefined()) {
      return value;
    }

    FloatOptional dimensionPaddingAndBorder = FloatOptional{
        computePaddingAndBorderForDimension(direction, axis, ownerWidth, node)};

    return value +
        (dimensionPaddingAndBorder.isDefined() ? dimensionPaddingAndBorder
                                               : FloatOptional{0.0});
  }

  FloatOptional aspectRatio() const {
    return pool_.getNumber(aspectRatio_);
  }
  void setAspectRatio(FloatOptional value) {
    // degenerate aspect ratios act as auto.
    // see https://drafts.csswg.org/css-sizing-4/#valdef-aspect-ratio-ratio
    pool_.store(
        aspectRatio_,
        value == 0.0f || std::isinf(value.unwrap()) ? FloatOptional{} : value);
  }

  BoxSizing boxSizing() const {
    return boxSizing_;
  }
  void setBoxSizing(BoxSizing value) {
    boxSizing_ = value;
  }

  bool horizontalInsetsDefined() const {
    return position_[yoga::to_underlying(Edge::Left)].isDefined() ||
        position_[yoga::to_underlying(Edge::Right)].isDefined() ||
        position_[yoga::to_underlying(Edge::All)].isDefined() ||
        position_[yoga::to_underlying(Edge::Horizontal)].isDefined() ||
        position_[yoga::to_underlying(Edge::Start)].isDefined() ||
        position_[yoga::to_underlying(Edge::End)].isDefined();
  }

  bool verticalInsetsDefined() const {
    return position_[yoga::to_underlying(Edge::Top)].isDefined() ||
        position_[yoga::to_underlying(Edge::Bottom)].isDefined() ||
        position_[yoga::to_underlying(Edge::All)].isDefined() ||
        position_[yoga::to_underlying(Edge::Vertical)].isDefined();
  }

  bool isFlexStartPositionDefined(FlexDirection axis, Direction direction)
      const {
    return computePosition(flexStartEdge(axis), direction).isDefined();
  }

  bool isFlexStartPositionAuto(FlexDirection axis, Direction direction) const {
    return computePosition(flexStartEdge(axis), direction).isAuto();
  }

  bool isInlineStartPositionDefined(FlexDirection axis, Direction direction)
      const {
    return computePosition(inlineStartEdge(axis, direction), direction)
        .isDefined();
  }

  bool isInlineStartPositionAuto(FlexDirection axis, Direction direction)
      const {
    return computePosition(inlineStartEdge(axis, direction), direction)
        .isAuto();
  }

  bool isFlexEndPositionDefined(FlexDirection axis, Direction direction) const {
    return computePosition(flexEndEdge(axis), direction).isDefined();
  }

  bool isFlexEndPositionAuto(FlexDirection axis, Direction direction) const {
    return computePosition(flexEndEdge(axis), direction).isAuto();
  }

  bool isInlineEndPositionDefined(FlexDirection axis, Direction direction)
      const {
    return computePosition(inlineEndEdge(axis, direction), direction)
        .isDefined();
  }

  bool isInlineEndPositionAuto(FlexDirection axis, Direction direction) const {
    return computePosition(inlineEndEdge(axis, direction), direction).isAuto();
  }

  float computeFlexStartPosition(
      FlexDirection axis,
      Direction direction,
      float axisSize,
      YGNodeConstRef node) const {
    return resolve(
               computePosition(flexStartEdge(axis), direction), axisSize, node)
        .unwrapOrDefault(0.0f);
  }

  float computeInlineStartPosition(
      FlexDirection axis,
      Direction direction,
      float axisSize,
      YGNodeConstRef node) const {
    return resolve(
               computePosition(inlineStartEdge(axis, direction), direction),
               axisSize,
               node)
        .unwrapOrDefault(0.0f);
  }

  float computeFlexEndPosition(
      FlexDirection axis,
      Direction direction,
      float axisSize,
      YGNodeConstRef node) const {
    return resolve(
               computePosition(flexEndEdge(axis), direction), axisSize, node)
        .unwrapOrDefault(0.0f);
  }

  float computeInlineEndPosition(
      FlexDirection axis,
      Direction direction,
      float axisSize,
      YGNodeConstRef node) const {
    return resolve(
               computePosition(inlineEndEdge(axis, direction), direction),
               axisSize,
               node)
        .unwrapOrDefault(0.0f);
  }

  float computeFlexStartMargin(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return resolve(
               computeMargin(flexStartEdge(axis), direction), widthSize, node)
        .unwrapOrDefault(0.0f);
  }

  float computeInlineStartMargin(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return resolve(
               computeMargin(inlineStartEdge(axis, direction), direction),
               widthSize,
               node)
        .unwrapOrDefault(0.0f);
  }

  float computeFlexEndMargin(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return resolve(computeMargin(flexEndEdge(axis), direction), widthSize, node)
        .unwrapOrDefault(0.0f);
  }

  float computeInlineEndMargin(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return resolve(
               computeMargin(inlineEndEdge(axis, direction), direction),
               widthSize,
               node)
        .unwrapOrDefault(0.0f);
  }

  float computeFlexStartBorder(
      FlexDirection axis,
      Direction direction,
      YGNodeConstRef node) const {
    return maxOrDefined(
        resolve(computeBorder(flexStartEdge(axis), direction), 0.0f, node)
            .unwrap(),
        0.0f);
  }

  float computeInlineStartBorder(
      FlexDirection axis,
      Direction direction,
      YGNodeConstRef node) const {
    return maxOrDefined(
        resolve(
            computeBorder(inlineStartEdge(axis, direction), direction),
            0.0f,
            node)
            .unwrap(),
        0.0f);
  }

  float computeFlexEndBorder(
      FlexDirection axis,
      Direction direction,
      YGNodeConstRef node) const {
    return maxOrDefined(
        resolve(computeBorder(flexEndEdge(axis), direction), 0.0f, node)
            .unwrap(),
        0.0f);
  }

  float computeInlineEndBorder(
      FlexDirection axis,
      Direction direction,
      YGNodeConstRef node) const {
    return maxOrDefined(
        resolve(
            computeBorder(inlineEndEdge(axis, direction), direction),
            0.0f,
            node)
            .unwrap(),
        0.0f);
  }

  float computeFlexStartPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return maxOrDefined(
        resolve(computePadding(flexStartEdge(axis), direction), widthSize, node)
            .unwrap(),
        0.0f);
  }

  float computeInlineStartPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return maxOrDefined(
        resolve(
            computePadding(inlineStartEdge(axis, direction), direction),
            widthSize,
            node)
            .unwrap(),
        0.0f);
  }

  float computeFlexEndPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return maxOrDefined(
        resolve(computePadding(flexEndEdge(axis), direction), widthSize, node)
            .unwrap(),
        0.0f);
  }

  float computeInlineEndPadding(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return maxOrDefined(
        resolve(
            computePadding(inlineEndEdge(axis, direction), direction),
            widthSize,
            node)
            .unwrap(),
        0.0f);
  }

  float computeInlineStartPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return computeInlineStartPadding(axis, direction, widthSize, node) +
        computeInlineStartBorder(axis, direction, node);
  }

  float computeFlexStartPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return computeFlexStartPadding(axis, direction, widthSize, node) +
        computeFlexStartBorder(axis, direction, node);
  }

  float computeInlineEndPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return computeInlineEndPadding(axis, direction, widthSize, node) +
        computeInlineEndBorder(axis, direction, node);
  }

  float computeFlexEndPaddingAndBorder(
      FlexDirection axis,
      Direction direction,
      float widthSize,
      YGNodeConstRef node) const {
    return computeFlexEndPadding(axis, direction, widthSize, node) +
        computeFlexEndBorder(axis, direction, node);
  }

  float computePaddingAndBorderForDimension(
      Direction direction,
      Dimension dimension,
      float widthSize,
      YGNodeConstRef node) const {
    FlexDirection flexDirectionForDimension = dimension == Dimension::Width
        ? FlexDirection::Row
        : FlexDirection::Column;

    return computeFlexStartPaddingAndBorder(
               flexDirectionForDimension, direction, widthSize, node) +
        computeFlexEndPaddingAndBorder(
               flexDirectionForDimension, direction, widthSize, node);
  }

  float computeBorderForAxis(FlexDirection axis, YGNodeConstRef node) const {
    return computeInlineStartBorder(axis, Direction::LTR, node) +
        computeInlineEndBorder(axis, Direction::LTR, node);
  }

  float computeMarginForAxis(
      FlexDirection axis,
      float widthSize,
      YGNodeConstRef node) const {
    // The total margin for a given axis does not depend on the direction
    // so hardcoding LTR here to avoid piping direction to this function
    return computeInlineStartMargin(axis, Direction::LTR, widthSize, node) +
        computeInlineEndMargin(axis, Direction::LTR, widthSize, node);
  }

  float computeGapForAxis(
      FlexDirection axis,
      float ownerSize,
      YGNodeConstRef node) const {
    auto gap = isRow(axis) ? computeColumnGap() : computeRowGap();
    return maxOrDefined(resolve(gap, ownerSize, node).unwrap(), 0.0f);
  }

  float computeGapForDimension(
      Dimension dimension,
      float ownerSize,
      YGNodeConstRef node) const {
    auto gap =
        dimension == Dimension::Width ? computeColumnGap() : computeRowGap();
    return maxOrDefined(resolve(gap, ownerSize, node).unwrap(), 0.0f);
  }

  bool flexStartMarginIsAuto(FlexDirection axis, Direction direction) const {
    return computeMargin(flexStartEdge(axis), direction).isAuto();
  }

  bool flexEndMarginIsAuto(FlexDirection axis, Direction direction) const {
    return computeMargin(flexEndEdge(axis), direction).isAuto();
  }

  bool inlineStartMarginIsAuto(FlexDirection axis, Direction direction) const {
    return computeMargin(inlineStartEdge(axis, direction), direction).isAuto();
  }

  bool inlineEndMarginIsAuto(FlexDirection axis, Direction direction) const {
    return computeMargin(inlineEndEdge(axis, direction), direction).isAuto();
  }

  bool operator==(const Style& other) const {
    return direction_ == other.direction_ &&
        flexDirection_ == other.flexDirection_ &&
        justifyContent_ == other.justifyContent_ &&
        justifyItems_ == other.justifyItems_ &&
        justifySelf_ == other.justifySelf_ &&
        alignContent_ == other.alignContent_ &&
        alignItems_ == other.alignItems_ && alignSelf_ == other.alignSelf_ &&
        positionType_ == other.positionType_ && flexWrap_ == other.flexWrap_ &&
        overflow_ == other.overflow_ && display_ == other.display_ &&
        numbersEqual(flex_, pool_, other.flex_, other.pool_) &&
        numbersEqual(flexGrow_, pool_, other.flexGrow_, other.pool_) &&
        numbersEqual(flexShrink_, pool_, other.flexShrink_, other.pool_) &&
        lengthsEqual(flexBasis_, pool_, other.flexBasis_, other.pool_) &&
        lengthsEqual(margin_, pool_, other.margin_, other.pool_) &&
        lengthsEqual(position_, pool_, other.position_, other.pool_) &&
        lengthsEqual(padding_, pool_, other.padding_, other.pool_) &&
        lengthsEqual(border_, pool_, other.border_, other.pool_) &&
        lengthsEqual(gap_, pool_, other.gap_, other.pool_) &&
        sizeLengthsEqual(dimensions_, pool_, other.dimensions_, other.pool_) &&
        sizeLengthsEqual(
               minDimensions_, pool_, other.minDimensions_, other.pool_) &&
        sizeLengthsEqual(
               maxDimensions_, pool_, other.maxDimensions_, other.pool_) &&
        numbersEqual(aspectRatio_, pool_, other.aspectRatio_, other.pool_) &&
        gridTemplateColumns_ == other.gridTemplateColumns_ &&
        gridTemplateRows_ == other.gridTemplateRows_ &&
        gridAutoColumns_ == other.gridAutoColumns_ &&
        gridAutoRows_ == other.gridAutoRows_ &&
        gridColumnStart_ == other.gridColumnStart_ &&
        gridColumnEnd_ == other.gridColumnEnd_ &&
        gridRowStart_ == other.gridRowStart_ &&
        gridRowEnd_ == other.gridRowEnd_;
  }

 private:
  using Dimensions = std::array<StyleValueHandle, ordinalCount<Dimension>()>;
  using Edges = std::array<StyleValueHandle, ordinalCount<Edge>()>;
  using Gutters = std::array<StyleValueHandle, ordinalCount<Gutter>()>;

  static inline bool numbersEqual(
      const StyleValueHandle& lhsHandle,
      const StyleValuePool& lhsPool,
      const StyleValueHandle& rhsHandle,
      const StyleValuePool& rhsPool) {
    return (lhsHandle.isUndefined() && rhsHandle.isUndefined()) ||
        (lhsPool.getNumber(lhsHandle) == rhsPool.getNumber(rhsHandle));
  }

  static inline bool lengthsEqual(
      const StyleValueHandle& lhsHandle,
      const StyleValuePool& lhsPool,
      const StyleValueHandle& rhsHandle,
      const StyleValuePool& rhsPool) {
    return (lhsHandle.isUndefined() && rhsHandle.isUndefined()) ||
        (lhsPool.getLength(lhsHandle) == rhsPool.getLength(rhsHandle));
  }

  template <size_t N>
  static inline bool lengthsEqual(
      const std::array<StyleValueHandle, N>& lhs,
      const StyleValuePool& lhsPool,
      const std::array<StyleValueHandle, N>& rhs,
      const StyleValuePool& rhsPool) {
    return std::equal(
        lhs.begin(),
        lhs.end(),
        rhs.begin(),
        rhs.end(),
        [&](const auto& lhs, const auto& rhs) {
          return lengthsEqual(lhs, lhsPool, rhs, rhsPool);
        });
  }

  static inline bool sizeLengthsEqual(
      const StyleValueHandle& lhsHandle,
      const StyleValuePool& lhsPool,
      const StyleValueHandle& rhsHandle,
      const StyleValuePool& rhsPool) {
    return (lhsHandle.isUndefined() && rhsHandle.isUndefined()) ||
        (lhsPool.getSize(lhsHandle) == rhsPool.getSize(rhsHandle));
  }

  template <size_t N>
  static inline bool sizeLengthsEqual(
      const std::array<StyleValueHandle, N>& lhs,
      const StyleValuePool& lhsPool,
      const std::array<StyleValueHandle, N>& rhs,
      const StyleValuePool& rhsPool) {
    return std::equal(
        lhs.begin(),
        lhs.end(),
        rhs.begin(),
        rhs.end(),
        [&](const auto& lhs, const auto& rhs) {
          return sizeLengthsEqual(lhs, lhsPool, rhs, rhsPool);
        });
  }

  StyleValueHandle computeColumnGap() const {
    if (gap_[yoga::to_underlying(Gutter::Column)].isDefined()) {
      return gap_[yoga::to_underlying(Gutter::Column)];
    } else {
      return gap_[yoga::to_underlying(Gutter::All)];
    }
  }

  StyleValueHandle computeRowGap() const {
    if (gap_[yoga::to_underlying(Gutter::Row)].isDefined()) {
      return gap_[yoga::to_underlying(Gutter::Row)];
    } else {
      return gap_[yoga::to_underlying(Gutter::All)];
    }
  }

  StyleValueHandle computeLeftEdge(
      const Edges& edges,
      Direction layoutDirection) const {
    if (layoutDirection == Direction::LTR &&
        edges[yoga::to_underlying(Edge::Start)].isDefined()) {
      return edges[yoga::to_underlying(Edge::Start)];
    } else if (
        layoutDirection == Direction::RTL &&
        edges[yoga::to_underlying(Edge::End)].isDefined()) {
      return edges[yoga::to_underlying(Edge::End)];
    } else if (edges[yoga::to_underlying(Edge::Left)].isDefined()) {
      return edges[yoga::to_underlying(Edge::Left)];
    } else if (edges[yoga::to_underlying(Edge::Horizontal)].isDefined()) {
      return edges[yoga::to_underlying(Edge::Horizontal)];
    } else {
      return edges[yoga::to_underlying(Edge::All)];
    }
  }

  StyleValueHandle computeTopEdge(const Edges& edges) const {
    if (edges[yoga::to_underlying(Edge::Top)].isDefined()) {
      return edges[yoga::to_underlying(Edge::Top)];
    } else if (edges[yoga::to_underlying(Edge::Vertical)].isDefined()) {
      return edges[yoga::to_underlying(Edge::Vertical)];
    } else {
      return edges[yoga::to_underlying(Edge::All)];
    }
  }

  StyleValueHandle computeRightEdge(
      const Edges& edges,
      Direction layoutDirection) const {
    if (layoutDirection == Direction::LTR &&
        edges[yoga::to_underlying(Edge::End)].isDefined()) {
      return edges[yoga::to_underlying(Edge::End)];
    } else if (
        layoutDirection == Direction::RTL &&
        edges[yoga::to_underlying(Edge::Start)].isDefined()) {
      return edges[yoga::to_underlying(Edge::Start)];
    } else if (edges[yoga::to_underlying(Edge::Right)].isDefined()) {
      return edges[yoga::to_underlying(Edge::Right)];
    } else if (edges[yoga::to_underlying(Edge::Horizontal)].isDefined()) {
      return edges[yoga::to_underlying(Edge::Horizontal)];
    } else {
      return edges[yoga::to_underlying(Edge::All)];
    }
  }

  StyleValueHandle computeBottomEdge(const Edges& edges) const {
    if (edges[yoga::to_underlying(Edge::Bottom)].isDefined()) {
      return edges[yoga::to_underlying(Edge::Bottom)];
    } else if (edges[yoga::to_underlying(Edge::Vertical)].isDefined()) {
      return edges[yoga::to_underlying(Edge::Vertical)];
    } else {
      return edges[yoga::to_underlying(Edge::All)];
    }
  }

  StyleValueHandle computePosition(PhysicalEdge edge, Direction direction)
      const {
    switch (edge) {
      case PhysicalEdge::Left:
        return computeLeftEdge(position_, direction);
      case PhysicalEdge::Top:
        return computeTopEdge(position_);
      case PhysicalEdge::Right:
        return computeRightEdge(position_, direction);
      case PhysicalEdge::Bottom:
        return computeBottomEdge(position_);
      default:
        fatalWithMessage("Invalid physical edge");
    }
  }

  StyleValueHandle computeMargin(PhysicalEdge edge, Direction direction) const {
    switch (edge) {
      case PhysicalEdge::Left:
        return computeLeftEdge(margin_, direction);
      case PhysicalEdge::Top:
        return computeTopEdge(margin_);
      case PhysicalEdge::Right:
        return computeRightEdge(margin_, direction);
      case PhysicalEdge::Bottom:
        return computeBottomEdge(margin_);
      default:
        fatalWithMessage("Invalid physical edge");
    }
  }

  StyleValueHandle computePadding(PhysicalEdge edge, Direction direction)
      const {
    switch (edge) {
      case PhysicalEdge::Left:
        return computeLeftEdge(padding_, direction);
      case PhysicalEdge::Top:
        return computeTopEdge(padding_);
      case PhysicalEdge::Right:
        return computeRightEdge(padding_, direction);
      case PhysicalEdge::Bottom:
        return computeBottomEdge(padding_);
      default:
        fatalWithMessage("Invalid physical edge");
    }
  }

  StyleValueHandle computeBorder(PhysicalEdge edge, Direction direction) const {
    switch (edge) {
      case PhysicalEdge::Left:
        return computeLeftEdge(border_, direction);
      case PhysicalEdge::Top:
        return computeTopEdge(border_);
      case PhysicalEdge::Right:
        return computeRightEdge(border_, direction);
      case PhysicalEdge::Bottom:
        return computeBottomEdge(border_);
      default:
        fatalWithMessage("Invalid physical edge");
    }
  }

  /**
   * Internal resolution of a StyleValueHandle.
   *
   * Part of the handle-based optimization, this function allows the layout
   * engine to resolve stored values (Points, Percents) directly from the pool
   * via handles. This avoids the overhead of materializing an intermediate
   * StyleLength/StyleSizeLength object on the stack during hot-path overhead
   * calculations.
   */
  FloatOptional resolve(
      StyleValueHandle handle,
      float referenceLength,
      YGNodeConstRef node) const {
    if (handle.isPoint()) {
      return FloatOptional{pool_.getStoredValue(handle)};
    }
    if (handle.isPercent()) {
      return FloatOptional{
          pool_.getStoredValue(handle) * referenceLength * 0.01f};
    }
    if (handle.isDynamic()) {
      auto callback = pool_.getDynamicCallback(handle);
      if (callback) {
        return FloatOptional{callback(
                                 node,
                                 pool_.getDynamicCallbackID(handle),
                                 YGValueDynamicContext{referenceLength})
                                 .value};
      }
    }

    return FloatOptional{};
  }

  Direction direction_ : bitCount<Direction>() = Direction::Inherit;
  FlexDirection flexDirection_
      : bitCount<FlexDirection>() = FlexDirection::Column;
  Justify justifyContent_ : bitCount<Justify>() = Justify::FlexStart;
  Justify justifyItems_ : bitCount<Justify>() = Justify::Stretch;
  Justify justifySelf_ : bitCount<Justify>() = Justify::Auto;
  Align alignContent_ : bitCount<Align>() = Align::FlexStart;
  Align alignItems_ : bitCount<Align>() = Align::Stretch;
  Align alignSelf_ : bitCount<Align>() = Align::Auto;
  PositionType positionType_
      : bitCount<PositionType>() = PositionType::Relative;
  Wrap flexWrap_ : bitCount<Wrap>() = Wrap::NoWrap;
  Overflow overflow_ : bitCount<Overflow>() = Overflow::Visible;
  Display display_ : bitCount<Display>() = Display::Flex;
  BoxSizing boxSizing_ : bitCount<BoxSizing>() = BoxSizing::BorderBox;

  StyleValueHandle flex_{};
  StyleValueHandle flexGrow_{};
  StyleValueHandle flexShrink_{};
  StyleValueHandle flexBasis_{StyleValueHandle::ofAuto()};
  Edges margin_{};
  Edges position_{};
  Edges padding_{};
  Edges border_{};
  Gutters gap_{};
  Dimensions dimensions_{
      StyleValueHandle::ofAuto(),
      StyleValueHandle::ofAuto()};
  Dimensions minDimensions_{};
  Dimensions maxDimensions_{};
  StyleValueHandle aspectRatio_{};

  // Grid properties
  GridTrackList gridTemplateColumns_{};
  GridTrackList gridTemplateRows_{};
  GridTrackList gridAutoColumns_{};
  GridTrackList gridAutoRows_{};
  GridLine gridColumnStart_{};
  GridLine gridColumnEnd_{};
  GridLine gridRowStart_{};
  GridLine gridRowEnd_{};

  StyleValuePool pool_;
};

} // namespace facebook::yoga
