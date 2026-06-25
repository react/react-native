/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

namespace facebook::react {

// Note: the (x, y) origin is always relative to the parent node. You may use
// P482342650 to re-create this test case in playground.

//  *******************************************************┌─ABCD:────┐****
//  *******************************************************│ {70,-50} │****
//  *******************************************************│ {30,60}  │****
//  *******************************************************│          │****
//  *******************************************************│          │****
//  *******************┌─A: {0,0}{50,50}──┐****************│          │****
//  *******************│                  │****************│          │****
//  *******************│   ┌─AB:──────┐   │****************│          │****
//  *******************│   │ {10,10}{30,90}****************│          │****
//  *******************│   │   ┌─ABC: {10,10}{110,20}──────┤          ├───┐
//  *******************│   │   │                           │          │   │
//  *******************│   │   │                           └──────────┘   │
//  *******************│   │   └──────┬───┬───────────────────────────────┘
//  *******************│   │          │   │********************************
//  *******************└───┤          ├───┘********************************
//  ***********************│          │************************************
//  ***********************│          │************************************
//  ┌─ABE: {-60,50}{70,20}─┴───┐      │************************************
//  │                          │      │************************************
//  │                          │      │************************************
//  │                          │      │************************************
//  │                          │      │************************************
//  └──────────────────────┬───┘      │************************************
//  ***********************│          │************************************
//  ***********************└──────────┘************************************

enum TestCase {
  AS_IS,
  CLIPPING,
  HIT_SLOP,
  HIT_SLOP_TRANSFORM_TRANSLATE,
  TRANSFORM_SCALE,
  TRANSFORM_TRANSLATE,
};

class LayoutTest : public ::testing::Test {
 protected:
  ComponentBuilder builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeA_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeAB_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeABC_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeABCD_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeABE_;

  LayoutTest() : builder_(simpleComponentBuilder()) {}

  void initialize(TestCase testCase) {
    // clang-format off
    auto element =
        Element<RootShadowNode>()
          .reference(rootShadowNode_)
          .tag(1)
          .props([] {
            auto sharedProps = std::make_shared<RootProps>();
            auto &props = *sharedProps;
            props.layoutConstraints = LayoutConstraints{.minimumSize={.width=0,.height=0}, .maximumSize={.width=500, .height=500}};
            auto &yogaStyle = props.yogaStyle;
            yogaStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(200));
            yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(200));
            return sharedProps;
          })
          .children({
            Element<ViewShadowNode>()
              .reference(viewShadowNodeA_)
              .tag(2)
              .props([] {
                auto sharedProps = std::make_shared<ViewShadowNodeProps>();
                auto &props = *sharedProps;
                auto &yogaStyle = props.yogaStyle;
                yogaStyle.setPositionType(yoga::PositionType::Absolute);
                yogaStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(50));
                yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(50));
                return sharedProps;
              })
              .children({
                Element<ViewShadowNode>()
                  .reference(viewShadowNodeAB_)
                  .tag(3)
                  .props([=] {
                    auto sharedProps = std::make_shared<ViewShadowNodeProps>();
                    auto &props = *sharedProps;
                    auto &yogaStyle = props.yogaStyle;
                    yogaStyle.setPositionType(yoga::PositionType::Absolute);
                    yogaStyle.setPosition(yoga::Edge::Left, yoga::StyleLength::points(10));
                    yogaStyle.setPosition(yoga::Edge::Top, yoga::StyleLength::points(10));
                    yogaStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(30));
                    yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(90));

                    if (testCase == TRANSFORM_SCALE) {
                      props.transform = props.transform * Transform::Scale(2, 2, 1);
                    }

                    if (testCase == TRANSFORM_TRANSLATE || testCase == HIT_SLOP_TRANSFORM_TRANSLATE) {
                      props.transform = props.transform * Transform::Translate(10, 10, 0);
                    }

                    if (testCase == HIT_SLOP || testCase == HIT_SLOP_TRANSFORM_TRANSLATE) {
                      props.hitSlop = EdgeInsets{50, 50, 50, 50};
                    }

                    return sharedProps;
                  })
                  .children({
                    Element<ViewShadowNode>()
                      .reference(viewShadowNodeABC_)
                      .tag(4)
                      .props([=] {
                        auto sharedProps = std::make_shared<ViewShadowNodeProps>();
                        auto &props = *sharedProps;
                        auto &yogaStyle = props.yogaStyle;

                        if (testCase == CLIPPING) {
                          yogaStyle.setOverflow(yoga::Overflow::Hidden);
                        }

                        yogaStyle.setPositionType(yoga::PositionType::Absolute);
                        yogaStyle.setPosition(yoga::Edge::Left, yoga::StyleLength::points(10));
                        yogaStyle.setPosition(yoga::Edge::Top, yoga::StyleLength::points(10));
                        yogaStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(110));
                        yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(20));
                        return sharedProps;
                      })
                      .children({
                        Element<ViewShadowNode>()
                          .reference(viewShadowNodeABCD_)
                          .tag(5)
                          .props([] {
                            auto sharedProps = std::make_shared<ViewShadowNodeProps>();
                            auto &props = *sharedProps;
                            auto &yogaStyle = props.yogaStyle;
                            yogaStyle.setPositionType(yoga::PositionType::Absolute);
                            yogaStyle.setPosition(yoga::Edge::Left, yoga::StyleLength::points(70));
                            yogaStyle.setPosition(yoga::Edge::Top, yoga::StyleLength::points(-50));
                            yogaStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(30));
                            yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(60));
                            return sharedProps;
                          })
                      }),
                    Element<ViewShadowNode>()
                      .reference(viewShadowNodeABE_)
                      .tag(6)
                      .props([] {
                        auto sharedProps = std::make_shared<ViewShadowNodeProps>();
                        auto &props = *sharedProps;
                        auto &yogaStyle = props.yogaStyle;
                        yogaStyle.setPositionType(yoga::PositionType::Absolute);
                        yogaStyle.setPosition(yoga::Edge::Left, yoga::StyleLength::points(-60));
                        yogaStyle.setPosition(yoga::Edge::Top, yoga::StyleLength::points(50));
                        yogaStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(70));
                        yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(20));
                        return sharedProps;
                      })
                  })
              })
          });
    // clang-format on

    builder_.build(element);

    rootShadowNode_->layoutIfNeeded();
  }
};

// Test the layout as described above with no extra changes
TEST_F(LayoutTest, overflowInsetTest) {
  initialize(AS_IS);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  EXPECT_EQ(layoutMetricsA.overflowInset.left, -50);
  EXPECT_EQ(layoutMetricsA.overflowInset.top, -30);
  EXPECT_EQ(layoutMetricsA.overflowInset.right, -80);
  EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -50);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.top, -50);
  EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

// Test when box ABC has clipping (aka overflow hidden)
TEST_F(LayoutTest, overflowInsetWithClippingTest) {
  initialize(CLIPPING);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  EXPECT_EQ(layoutMetricsA.overflowInset.left, -50);
  EXPECT_EQ(layoutMetricsA.overflowInset.top, 0);
  EXPECT_EQ(layoutMetricsA.overflowInset.right, -80);
  EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -50);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.top, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

// Test when box AB translate (10, 10, 0) in transform. The parent node's
// overflowInset will be affected, but the transformed node and its child nodes
// are not affected. Here is an example:
//
//      ┌────────────────┐                  ┌────────────────┐
//      │Original Layout │                  │  Translate AB  │
//      └────────────────┘                  └────────────────┘
//                                                          ─────▶
// ┌ ─ ─ ─ ┬──────────┐─ ─ ─ ─ ┐      ┌ ─ ─ ─ ┬──────────┐─ ─ ─ ─ ─ ┐
//         │ A        │                       │ A        │
// │       │          │        │      │       │          │          │
//  ─ ─ ─ ─│─ ─ ─┌───┐┼ ─ ─ ─ ─               │          │
// │       │     │AB ││        │      │ ┌ ─ ─ ┼ ─ ─ ─ ┬──┴┬ ─ ─ ─ ─ ┤
//         └─────┤   ├┘                       └───────┤AB │
// │             │┌──┴─────────┤      │ │             │   │         │
//               ││ABC         │                      │┌──┴─────────┐
// │             │└──┬─────────┤    │ │ │             ││ABC         │
// ┌───ABD───────┴─┐ │              │                 │└──┬─────────┘
// ├─────────────┬─┘ │         │    │ │ ├───ABD───────┴─┐ │         │
//  ─ ─ ─ ─ ─ ─ ─└───┘─ ─ ─ ─ ─     ▼   └─────────────┬─┘ │
//                                    └ ┴ ─ ─ ─ ─ ─ ─ ┴───┴ ─ ─ ─ ─ ┘

TEST_F(LayoutTest, overflowInsetTransformTranslateTest) {
  initialize(TRANSFORM_TRANSLATE);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  // Change on parent node
  // The top/left values are NOT changing as overflowInset is union of before
  // and after transform layout. In this case, we move to the right and bottom,
  // so the left and top is not changing, while right and bottom values are
  // increased.
  EXPECT_EQ(layoutMetricsA.overflowInset.left, -50);
  EXPECT_EQ(layoutMetricsA.overflowInset.top, -30);
  EXPECT_EQ(layoutMetricsA.overflowInset.right, -90);
  EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -60);

  auto layoutMetricsAB = viewShadowNodeAB_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsAB.frame.size.width, 30);
  EXPECT_EQ(layoutMetricsAB.frame.size.height, 90);

  // No change on self node with translate transform
  EXPECT_EQ(layoutMetricsAB.overflowInset.left, -60);
  EXPECT_EQ(layoutMetricsAB.overflowInset.top, -40);
  EXPECT_EQ(layoutMetricsAB.overflowInset.right, -90);
  EXPECT_EQ(layoutMetricsAB.overflowInset.bottom, 0);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  // No change on child node
  EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.top, -50);
  EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

// Test when box AB scaled 2X in transform. The parent node's overflowInset will
// be affected. However, the transformed node and its child nodes only appears
// to be affected (dashed arrow). Since all transform is cosmetic only, the
// actual values are NOT changed. It will be converted later when mapping the
// values to pixels during rendering. Here is an example:
//
//      ┌────────────────┐                    ┌────────────────┐
//      │Original Layout │                    │    Scale AB    │
//      └────────────────┘                    └────────────────┘
//                                                             ─────▶
// ┌ ─ ─ ─ ┬──────────┐─ ─ ─ ─ ┐     ┌ ─ ─ ─ ─ ─ ┬──────────┐─ ─ ─ ─ ─ ┐
//         │ A        │                          │ A        │
// │       │          │        │     ├ ─ ─ ─ ─ ─ ┼ ─ ─┌─────┤─ ─ ─ ─ ─ ┤
//  ─ ─ ─ ─│─ ─ ─┌───┐┼ ─ ─ ─ ─                  │    │AB   │  ─ ─ ─▶
// │       │     │AB ││        │     │           │    │     │          │
//         └─────┤   ├┘                          └────┤     │
// │             │┌──┴─────────┤     │                │ ┌───┴──────────┤
//               ││ABC         │                      │ │ABC           │
// │             │└──┬─────────┤   │ │                │ │              │
// ┌───ABD───────┴─┐ │             │                  │ └───┬──────────┘
// ├─────────────┬─┘ │         │   │ ├────────────────┴──┐  │          │
//  ─ ─ ─ ─ ─ ─ ─└───┘─ ─ ─ ─ ─    ▼ │      ABD          │  │
//                                   ├────────────────┬──┘  │          │
//                                    ─ ─ ─ ─ ─ ─ ─ ─ ┴─────┴ ─ ─ ─ ─ ─

TEST_F(LayoutTest, overflowInsetTransformScaleTest) {
  initialize(TRANSFORM_SCALE);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  // Change on parent node when a child view scale up
  // Note that AB scale up from its center point. The numbers are calculated
  // assuming AB's center point is not moving.
  EXPECT_EQ(layoutMetricsA.overflowInset.left, -125);
  EXPECT_EQ(layoutMetricsA.overflowInset.top, -115);
  EXPECT_EQ(layoutMetricsA.overflowInset.right, -185);
  EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -95);

  auto layoutMetricsAB = viewShadowNodeAB_->getLayoutMetrics();

  // The frame of box AB won't actually scale up. The transform matrix is
  // purely cosmetic and should apply later in mounting phase.
  EXPECT_EQ(layoutMetricsAB.frame.size.width, 30);
  EXPECT_EQ(layoutMetricsAB.frame.size.height, 90);

  // No change on self node with scale transform. This may sound a bit
  // surprising, but the overflowInset values will be scaled up via pixel
  // density ratio along with width/height of the view. When we do hit-testing,
  // the overflowInset value will appears to be doubled as expected.
  EXPECT_EQ(layoutMetricsAB.overflowInset.left, -60);
  EXPECT_EQ(layoutMetricsAB.overflowInset.top, -40);
  EXPECT_EQ(layoutMetricsAB.overflowInset.right, -90);
  EXPECT_EQ(layoutMetricsAB.overflowInset.bottom, 0);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  // The frame of box ABC won't actually scale up. The transform matrix is
  // purely cosmetic and should apply later in mounting phase.
  EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  // The overflowInset of ABC won't change either. This may sound a bit
  // surprising, but the overflowInset values will be scaled up via pixel
  // density ratio along with width/height of the view. When we do hit-testing,
  // the overflowInset value will appears to be doubled as expected.
  EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.top, -50);
  EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

TEST_F(LayoutTest, overflowInsetHitSlopTest) {
  initialize(HIT_SLOP);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  // Change on parent node
  EXPECT_EQ(layoutMetricsA.overflowInset.left, -50);
  EXPECT_EQ(layoutMetricsA.overflowInset.top, -40);
  EXPECT_EQ(layoutMetricsA.overflowInset.right, -80);
  EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -100);

  auto layoutMetricsAB = viewShadowNodeAB_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsAB.frame.size.width, 30);
  EXPECT_EQ(layoutMetricsAB.frame.size.height, 90);

  // No change on self node
  EXPECT_EQ(layoutMetricsAB.overflowInset.left, -60);
  EXPECT_EQ(layoutMetricsAB.overflowInset.top, -40);
  EXPECT_EQ(layoutMetricsAB.overflowInset.right, -90);
  EXPECT_EQ(layoutMetricsAB.overflowInset.bottom, 0);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  // No change on child node
  EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.top, -50);
  EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

TEST_F(LayoutTest, overflowInsetHitSlopTransformTranslateTest) {
  initialize(HIT_SLOP_TRANSFORM_TRANSLATE);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  // Change on parent node
  EXPECT_EQ(layoutMetricsA.overflowInset.left, -50);
  EXPECT_EQ(layoutMetricsA.overflowInset.top, -40);
  EXPECT_EQ(layoutMetricsA.overflowInset.right, -90);
  EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -110);

  auto layoutMetricsAB = viewShadowNodeAB_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsAB.frame.size.width, 30);
  EXPECT_EQ(layoutMetricsAB.frame.size.height, 90);

  // No change on self node
  EXPECT_EQ(layoutMetricsAB.overflowInset.left, -60);
  EXPECT_EQ(layoutMetricsAB.overflowInset.top, -40);
  EXPECT_EQ(layoutMetricsAB.overflowInset.right, -90);
  EXPECT_EQ(layoutMetricsAB.overflowInset.bottom, 0);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  // No change on child node
  EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.top, -50);
  EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

} // namespace facebook::react
