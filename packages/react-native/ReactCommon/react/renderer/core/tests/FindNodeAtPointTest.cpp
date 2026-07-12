/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

#include "TestComponent.h"

using namespace facebook;
using namespace facebook::react;

TEST(FindNodeAtPointTest, withoutTransform) {
  auto builder = simpleComponentBuilder();

  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .tag(1)
      .finalize([](ViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {.width=1000, .height=1000};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .children({
        Element<ViewShadowNode>()
        .tag(2)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=100, .y=100};
          layoutMetrics.frame.size = {.width=100, .height=100};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
        .children({
          Element<ViewShadowNode>()
          .tag(3)
          .finalize([](ViewShadowNode &shadowNode){
            auto layoutMetrics = EmptyLayoutMetrics;
            layoutMetrics.frame.origin = {.x=10, .y=10};
            layoutMetrics.frame.size = {.width=10, .height=10};
            shadowNode.setLayoutMetrics(layoutMetrics);
          })
        })
    });

  auto parentShadowNode = builder.build(element);

  EXPECT_EQ(
            LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {115, 115})->getTag(), 3);
  EXPECT_EQ(LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {105, 105})->getTag(), 2);
  EXPECT_EQ(LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {900, 900})->getTag(), 1);
  EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {1001, 1001}), nullptr);
}

TEST(FindNodeAtPointTest, viewIsTranslated) {
  auto builder = simpleComponentBuilder();

  // clang-format off
  auto element =
    Element<ScrollViewShadowNode>()
      .tag(1)
      .finalize([](ScrollViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {.width=1000, .height=1000};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .stateData([](ScrollViewState &data) {
        data.contentOffset = {.x=100, .y=100};
      })
      .children({
        Element<ViewShadowNode>()
        .tag(2)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=100, .y=100};
          layoutMetrics.frame.size = {.width=100, .height=100};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
        .children({
          Element<ViewShadowNode>()
          .tag(3)
          .finalize([](ViewShadowNode &shadowNode){
            auto layoutMetrics = EmptyLayoutMetrics;
            layoutMetrics.frame.origin = {.x=10, .y=10};
            layoutMetrics.frame.size = {.width=10, .height=10};
            shadowNode.setLayoutMetrics(layoutMetrics);
          })
        })
    });

  auto parentShadowNode = builder.build(element);

  EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {15, 15})->getTag(),
      3);
  EXPECT_EQ(LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {5, 5})->getTag(), 2);
}

TEST(FindNodeAtPointTest, viewIsScaled) {
  auto builder = simpleComponentBuilder();

  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .tag(1)
      .finalize([](ViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {.width=1000, .height=1000};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .children({
        Element<ViewShadowNode>()
        .tag(2)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=100, .y=100};
          layoutMetrics.frame.size = {.width=100, .height=100};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
        .children({
          Element<ViewShadowNode>()
          .tag(3)
          .props([] {
            auto sharedProps = std::make_shared<ViewProps>();
            sharedProps->transform = Transform::Scale(0.5, 0.5, 0);
            return sharedProps;
          })
          .finalize([](ViewShadowNode &shadowNode){
            auto layoutMetrics = EmptyLayoutMetrics;
            layoutMetrics.frame.origin = {.x=10, .y=10};
            layoutMetrics.frame.size = {.width=10, .height=10};
            shadowNode.setLayoutMetrics(layoutMetrics);
          })
        })
    });

  auto parentShadowNode = builder.build(element);

  EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {119, 119})->getTag(),
      2);
}

TEST(FindNodeAtPointTest, overlappingViews) {
  auto builder = simpleComponentBuilder();

  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .tag(1)
      .finalize([](ViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {.width=100, .height=100};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .children({
        Element<ViewShadowNode>()
        .tag(2)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=25, .y=25};
          layoutMetrics.frame.size = {.width=50, .height=50};
          shadowNode.setLayoutMetrics(layoutMetrics);
        }),
        Element<ViewShadowNode>()
        .tag(3)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=50, .y=50};
          layoutMetrics.frame.size = {.width=50, .height=50};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
    });

  auto parentShadowNode = builder.build(element);

  EXPECT_EQ(
            LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {50, 50})->getTag(), 3);
}

TEST(FindNodeAtPointTest, overlappingViewsWithZIndex) {
  auto builder = simpleComponentBuilder();

  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .tag(1)
      .finalize([](ViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {.width=100, .height=100};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .children({
        Element<ViewShadowNode>()
        .tag(2)
        .props([] {
          auto sharedProps = std::make_shared<ViewProps>();
          sharedProps->zIndex = 1;
          auto &yogaStyle = sharedProps->yogaStyle;
          yogaStyle.setPositionType(yoga::PositionType::Absolute);
          return sharedProps;
        })
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=25, .y=25};
          layoutMetrics.frame.size = {.width=50, .height=50};
          shadowNode.setLayoutMetrics(layoutMetrics);
        }),
        Element<ViewShadowNode>()
        .tag(3)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=50, .y=50};
          layoutMetrics.frame.size = {.width=50, .height=50};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
    });

  auto parentShadowNode = builder.build(element);

  EXPECT_EQ(
            LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {50, 50})->getTag(), 2);
}

TEST(FindNodeAtPointTest, overlappingViewsWithParentPointerEventsBoxOnly) {
  auto builder = simpleComponentBuilder();

  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .tag(1)
      .props([] {
        auto sharedProps = std::make_shared<ViewProps>();
        sharedProps->pointerEvents = PointerEventsMode::BoxOnly;
        return sharedProps;
      })
      .finalize([](ViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {.width=100, .height=100};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .children({
        Element<ViewShadowNode>()
        .tag(2)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=50, .y=50};
          layoutMetrics.frame.size = {.width=50, .height=50};
          shadowNode.setLayoutMetrics(layoutMetrics);
        }),
        Element<ViewShadowNode>()
        .tag(3)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=50, .y=50};
          layoutMetrics.frame.size = {.width=50, .height=50};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
    });

  auto parentShadowNode = builder.build(element);

  EXPECT_EQ(
            LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {60, 60})->getTag(), 1);
}

TEST(FindNodeAtPointTest, overlappingViewsWithParentPointerEventsBoxNone) {
  auto builder = simpleComponentBuilder();

  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .tag(1)
      .props([] {
        auto sharedProps = std::make_shared<ViewProps>();
        sharedProps->pointerEvents = PointerEventsMode::BoxNone;
        return sharedProps;
      })
      .finalize([](ViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {.width=100, .height=100};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .children({
        Element<ViewShadowNode>()
        .tag(2)
        .props([] {
          auto sharedProps = std::make_shared<ViewProps>();
          sharedProps->zIndex = 1;
          auto &yogaStyle = sharedProps->yogaStyle;
          yogaStyle.setPositionType(yoga::PositionType::Absolute);
          return sharedProps;
        })
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=25, .y=25};
          layoutMetrics.frame.size = {.width=50, .height=50};
          shadowNode.setLayoutMetrics(layoutMetrics);
        }),
        Element<ViewShadowNode>()
        .tag(3)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=50, .y=50};
          layoutMetrics.frame.size = {.width=50, .height=50};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
    });

  auto parentShadowNode = builder.build(element);

  EXPECT_EQ(
            LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {50, 50})->getTag(), 2);
}

TEST(FindNodeAtPointTest, overlappingViewsWithParentPointerEventsNone) {
  auto builder = simpleComponentBuilder();

  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .tag(1)
      .props([] {
        auto sharedProps = std::make_shared<ViewProps>();
        sharedProps->pointerEvents = PointerEventsMode::None;
        return sharedProps;
      })
      .finalize([](ViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {.width=100, .height=100};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .children({
        Element<ViewShadowNode>()
        .tag(2)
        .props([] {
          auto sharedProps = std::make_shared<ViewProps>();
          sharedProps->zIndex = 1;
          auto &yogaStyle = sharedProps->yogaStyle;
          yogaStyle.setPositionType(yoga::PositionType::Absolute);
          return sharedProps;
        })
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=25, .y=25};
          layoutMetrics.frame.size = {.width=50, .height=50};
          shadowNode.setLayoutMetrics(layoutMetrics);
        }),
        Element<ViewShadowNode>()
        .tag(3)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=50, .y=50};
          layoutMetrics.frame.size = {.width=50, .height=50};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
    });

  auto parentShadowNode = builder.build(element);

  EXPECT_EQ(
            LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {50, 50}), nullptr);
}

TEST(FindNodeAtPointTest, invertedList) {
  auto builder = simpleComponentBuilder();
  
  // clang-format off
  auto element =
    Element<ScrollViewShadowNode>()
      .props([] {
        auto sharedProps = std::make_shared<ScrollViewProps>();
        sharedProps->transform = Transform::VerticalInversion();
        return sharedProps;
      })
      .tag(1)
      .finalize([](ScrollViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {.width=100, .height=200};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .children({
        Element<ViewShadowNode>()
        .tag(2)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=0, .y=0};
          layoutMetrics.frame.size = {.width=100, .height=100};
          shadowNode.setLayoutMetrics(layoutMetrics);
        }),
        Element<ViewShadowNode>()
        .tag(3)
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {.x=0, .y=100};
          layoutMetrics.frame.size = {.width=100, .height=100};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
    });
  // clang-format on

  auto parentShadowNode = builder.build(element);

  EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {10, 10})
          ->getTag(),
      3);
  EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {10, 105})
          ->getTag(),
      2);
}

TEST(FindNodeAtPointTest, considersOverflowAreaOfTheParent) {
  auto builder = simpleComponentBuilder();

  auto element =
      Element<ViewShadowNode>()
          .tag(1)
          .finalize([](ViewShadowNode& shadowNode) {
            auto layoutMetrics = EmptyLayoutMetrics;
            layoutMetrics.frame.size = {.width = 100, .height = 100};
            shadowNode.setLayoutMetrics(layoutMetrics);
          })
          .children({Element<ViewShadowNode>()
                         .tag(2)
                         .finalize([](ViewShadowNode& shadowNode) {
                           auto layoutMetrics = EmptyLayoutMetrics;
                           layoutMetrics.frame.size = {
                               .width = 100, .height = 0};
                           layoutMetrics.overflowInset = {
                               .left = 0, .top = 0, .right = 0, .bottom = -100};

                           shadowNode.setLayoutMetrics(layoutMetrics);
                         })
                         .children({Element<ViewShadowNode>().tag(3).finalize(
                             [](ViewShadowNode& shadowNode) {
                               auto layoutMetrics = EmptyLayoutMetrics;
                               layoutMetrics.frame.size = {
                                   .width = 100, .height = 100};
                               shadowNode.setLayoutMetrics(layoutMetrics);
                             })})});

  auto parentShadowNode = builder.build(element);
  EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(parentShadowNode, {1, 99})
          ->getTag(),
      3);
}
