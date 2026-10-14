/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/fabric/FocusOrderingHelper.h>

#include <gtest/gtest.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

#include <memory>
#include <optional>
#include <vector>

namespace facebook::react {

namespace {

enum class ViewKind {
  // Forms no view, so the mounting layer hoists its children into its parent
  Flattened,
  // Hosts its children, as `collapsable={false}` does
  Native,
  // Takes keyboard focus and hosts its children, as a Pressable does
  Focusable,
};

Element<ViewShadowNode> view(
    Tag tag,
    ViewKind kind,
    Rect frame,
    LayoutDirection layoutDirection = LayoutDirection::LeftToRight) {
  return Element<ViewShadowNode>()
      .tag(tag)
      .props([kind] {
        auto props = std::make_shared<ViewProps>();
        props->collapsable = kind == ViewKind::Flattened;
        props->accessible = kind == ViewKind::Focusable;
        return props;
      })
      .finalize([frame, layoutDirection](ViewShadowNode& shadowNode) {
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame = frame;
        layoutMetrics.layoutDirection = layoutDirection;
        shadowNode.setLayoutMetrics(layoutMetrics);
      });
}

Rect frame(Float x, Float y, Float width, Float height) {
  return Rect{
      .origin = {.x = x, .y = y}, .size = {.width = width, .height = height}};
}

std::vector<Tag> tabOrderTags(const ShadowNode& rootShadowNode) {
  std::vector<Tag> tags;
  for (const auto& focusable :
       FocusOrderingHelper::collectFocusablesInTabOrder(rootShadowNode)) {
    tags.push_back(focusable->getTag());
  }
  return tags;
}

std::optional<Tag> nextTagInTabOrder(
    const ShadowNode& rootShadowNode,
    Tag focusedTag,
    FocusDirection focusDirection) {
  auto next = FocusOrderingHelper::findNextInTabOrder(
      rootShadowNode, focusedTag, focusDirection);
  return next == nullptr ? std::nullopt : std::optional<Tag>(next->getTag());
}

} // namespace

TEST(FocusOrderingHelperTabOrderTest, testRowsGoTopToBottomThenByLeftEdge) {
  auto builder = simpleComponentBuilder();
  // clang-format off
  auto root = builder.build(
      view(1, ViewKind::Native, frame(0, 0, 300, 300)).children({
          view(2, ViewKind::Focusable, frame(200, 0, 80, 40)),
          view(3, ViewKind::Focusable, frame(0, 100, 80, 40)),
          view(4, ViewKind::Focusable, frame(0, 0, 80, 40)),
      }));
  // clang-format on

  EXPECT_EQ(std::vector<Tag>({4, 2, 3}), tabOrderTags(*root));
}

TEST(FocusOrderingHelperTabOrderTest, testRightToLeftRowStartsAtTheRightEdge) {
  auto builder = simpleComponentBuilder();
  // clang-format off
  auto root = builder.build(
      view(1, ViewKind::Native, frame(0, 0, 300, 300), LayoutDirection::RightToLeft).children({
          view(2, ViewKind::Focusable, frame(200, 0, 80, 40)),
          view(3, ViewKind::Focusable, frame(0, 100, 80, 40)),
          view(4, ViewKind::Focusable, frame(0, 0, 80, 40)),
      }));
  // clang-format on

  EXPECT_EQ(std::vector<Tag>({2, 4, 3}), tabOrderTags(*root));
}

TEST(FocusOrderingHelperTabOrderTest, testRowGrowsWhileViewsOverlapIt) {
  auto builder = simpleComponentBuilder();
  // clang-format off
  auto root = builder.build(
      view(1, ViewKind::Native, frame(0, 0, 300, 300)).children({
          view(2, ViewKind::Focusable, frame(0, 0, 50, 100)),
          view(3, ViewKind::Focusable, frame(100, 60, 50, 20)),
          view(4, ViewKind::Focusable, frame(60, 90, 30, 30)),
      }));
  // clang-format on

  EXPECT_EQ(std::vector<Tag>({2, 4, 3}), tabOrderTags(*root));
}

TEST(
    FocusOrderingHelperTabOrderTest,
    testViewThatHostsItsChildrenIsOrderedAsOneBlock) {
  auto builder = simpleComponentBuilder();
  // clang-format off
  auto root = builder.build(
      view(1, ViewKind::Native, frame(0, 0, 300, 300)).children({
          view(2, ViewKind::Native, frame(0, 0, 100, 100)).children({
              view(3, ViewKind::Focusable, frame(0, 0, 100, 40)),
              view(4, ViewKind::Focusable, frame(0, 50, 100, 40)),
          }),
          view(5, ViewKind::Native, frame(120, 0, 100, 100)).children({
              view(6, ViewKind::Focusable, frame(0, 0, 100, 40)),
              view(7, ViewKind::Focusable, frame(0, 50, 100, 40)),
          }),
      }));
  // clang-format on

  EXPECT_EQ(std::vector<Tag>({3, 4, 6, 7}), tabOrderTags(*root));
}

TEST(
    FocusOrderingHelperTabOrderTest,
    testFlattenedViewLeavesItsChildrenToItsParentsRows) {
  auto builder = simpleComponentBuilder();
  // clang-format off
  auto root = builder.build(
      view(1, ViewKind::Native, frame(0, 0, 300, 300)).children({
          view(2, ViewKind::Flattened, frame(0, 0, 100, 100)).children({
              view(3, ViewKind::Focusable, frame(0, 0, 100, 40)),
              view(4, ViewKind::Focusable, frame(0, 50, 100, 40)),
          }),
          view(5, ViewKind::Flattened, frame(120, 0, 100, 100)).children({
              view(6, ViewKind::Focusable, frame(0, 0, 100, 40)),
              view(7, ViewKind::Focusable, frame(0, 50, 100, 40)),
          }),
      }));
  // clang-format on

  EXPECT_EQ(std::vector<Tag>({3, 6, 4, 7}), tabOrderTags(*root));
}

TEST(
    FocusOrderingHelperTabOrderTest,
    testFocusableViewComesBeforeTheViewsItHosts) {
  auto builder = simpleComponentBuilder();
  // clang-format off
  auto root = builder.build(
      view(1, ViewKind::Native, frame(0, 0, 300, 300)).children({
          view(2, ViewKind::Focusable, frame(0, 100, 300, 100)).children({
              view(3, ViewKind::Focusable, frame(10, 10, 50, 30)),
          }),
          view(4, ViewKind::Focusable, frame(0, 0, 300, 50)),
      }));
  // clang-format on

  EXPECT_EQ(std::vector<Tag>({4, 2, 3}), tabOrderTags(*root));
}

/*
 * A card whose content column holds an action below its title, with a dismiss
 * button at the top end: Android puts the action first, so Tab from the
 * dismiss button leaves the card instead of returning to the action below it.
 */
TEST(
    FocusOrderingHelperTabOrderTest,
    testTabFromTheLastFocusableLeavesInsteadOfReturningToOneBelowIt) {
  auto builder = simpleComponentBuilder();
  // clang-format off
  auto root = builder.build(
      view(1, ViewKind::Native, frame(0, 0, 300, 300)).children({
          view(2, ViewKind::Native, frame(0, 0, 300, 100)).children({
              view(3, ViewKind::Native, frame(0, 0, 240, 100)).children({
                  view(4, ViewKind::Focusable, frame(10, 60, 100, 30)),
              }),
              view(5, ViewKind::Focusable, frame(260, 10, 30, 30)),
          }),
      }));
  // clang-format on

  EXPECT_EQ(std::vector<Tag>({4, 5}), tabOrderTags(*root));
  EXPECT_EQ(
      std::optional<Tag>(5),
      nextTagInTabOrder(*root, 4, FocusDirection::FocusForward));
  EXPECT_EQ(
      std::optional<Tag>(4),
      nextTagInTabOrder(*root, 5, FocusDirection::FocusBackward));
  EXPECT_EQ(
      std::optional<Tag>(),
      nextTagInTabOrder(*root, 5, FocusDirection::FocusForward));
}

TEST(FocusOrderingHelperTabOrderTest, testNextInTabOrderStopsAtEitherEnd) {
  auto builder = simpleComponentBuilder();
  // clang-format off
  auto root = builder.build(
      view(1, ViewKind::Native, frame(0, 0, 300, 300)).children({
          view(2, ViewKind::Focusable, frame(0, 0, 80, 40)),
          view(3, ViewKind::Focusable, frame(0, 100, 80, 40)),
      }));
  // clang-format on

  EXPECT_EQ(
      std::optional<Tag>(),
      nextTagInTabOrder(*root, 2, FocusDirection::FocusBackward));
  EXPECT_EQ(
      std::optional<Tag>(),
      nextTagInTabOrder(*root, 3, FocusDirection::FocusForward));
  EXPECT_EQ(
      std::optional<Tag>(),
      nextTagInTabOrder(*root, 9, FocusDirection::FocusForward));
}

} // namespace facebook::react
