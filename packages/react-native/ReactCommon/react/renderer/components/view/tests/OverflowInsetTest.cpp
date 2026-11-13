/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

#include <functional>
#include <vector>

namespace facebook::react {

namespace {

// The props of the tree below that the tests change.
struct TreeParams {
  float containerWidth{50};
  float overflowingChildLeft{70};
  bool clipOverflowingChildParent{false};
  bool translateChild{false};
  EdgeInsets siblingHitSlop{};
  float movingSiblingTop{0};
  float otherContainerTop{100};
};

constexpr Tag kRootTag = 1;
constexpr Tag kContainerTag = 2;
constexpr Tag kChildTag = 3;
constexpr Tag kOverflowingChildParentTag = 4;
constexpr Tag kOverflowingChildTag = 5;
constexpr Tag kSiblingTag = 6;
// Moving this container lays out the root again while the layout of the other
// container comes from Yoga's cache, so its children don't get a new layout.
constexpr Tag kOtherContainerTag = 7;
constexpr Tag kFirstRowTag = 10;
constexpr int kRowCount = 10;
constexpr Tag kMovingRowTag = kFirstRowTag + 5;

std::shared_ptr<ViewProps>
absoluteViewProps(float left, float top, float width, float height) {
  auto props = std::make_shared<ViewProps>();
  auto& yogaStyle = props->yogaStyle;
  yogaStyle.setPositionType(yoga::PositionType::Absolute);
  yogaStyle.setPosition(yoga::Edge::Left, yoga::StyleLength::points(left));
  yogaStyle.setPosition(yoga::Edge::Top, yoga::StyleLength::points(top));
  yogaStyle.setDimension(
      yoga::Dimension::Width, yoga::StyleSizeLength::points(width));
  yogaStyle.setDimension(
      yoga::Dimension::Height, yoga::StyleSizeLength::points(height));
  return props;
}

std::shared_ptr<ViewProps> sizedViewProps(float width, float height) {
  auto props = std::make_shared<ViewProps>();
  props->yogaStyle.setDimension(
      yoga::Dimension::Width, yoga::StyleSizeLength::points(width));
  props->yogaStyle.setDimension(
      yoga::Dimension::Height, yoga::StyleSizeLength::points(height));
  return props;
}

std::shared_ptr<ViewProps> propsForTag(Tag tag, const TreeParams& params) {
  switch (tag) {
    case kContainerTag:
      return absoluteViewProps(0, 0, params.containerWidth, 50);
    case kOtherContainerTag:
      return absoluteViewProps(0, params.otherContainerTop, 40, 40);
    case kChildTag: {
      auto props = absoluteViewProps(10, 10, 30, 90);
      if (params.translateChild) {
        props->transform = Transform::Translate(10, 10, 0);
      }
      return props;
    }
    case kOverflowingChildParentTag: {
      auto props = absoluteViewProps(10, 10, 110, 20);
      if (params.clipOverflowingChildParent) {
        props->yogaStyle.setOverflow(yoga::Overflow::Hidden);
      }
      return props;
    }
    case kOverflowingChildTag:
      return absoluteViewProps(params.overflowingChildLeft, -50, 30, 60);
    case kSiblingTag: {
      auto props = absoluteViewProps(-60, 50, 70, 20);
      props->hitSlop = params.siblingHitSlop;
      return props;
    }
    default:
      break;
  }
  if (tag >= kFirstRowTag && tag < kFirstRowTag + kRowCount) {
    // Rows of the container, each with a child that overflows it.
    auto top = tag == kMovingRowTag ? params.movingSiblingTop
                                    : static_cast<float>(tag - kFirstRowTag);
    return absoluteViewProps(0, top * 5, 20, 5);
  }
  // The children of the rows.
  return absoluteViewProps(15, 0, 20, 5);
}

std::shared_ptr<RootShadowNode> buildTree(
    ComponentBuilder& builder,
    const TreeParams& params) {
  std::shared_ptr<RootShadowNode> rootShadowNode;

  std::vector<ElementFragment> containerChildren;
  containerChildren.push_back(
      Element<ViewShadowNode>()
          .tag(kChildTag)
          .props(propsForTag(kChildTag, params))
          .children({Element<ViewShadowNode>()
                         .tag(kOverflowingChildParentTag)
                         .props(propsForTag(kOverflowingChildParentTag, params))
                         .children({Element<ViewShadowNode>()
                                        .tag(kOverflowingChildTag)
                                        .props(propsForTag(
                                            kOverflowingChildTag, params))})}));
  containerChildren.push_back(
      Element<ViewShadowNode>()
          .tag(kSiblingTag)
          .props(propsForTag(kSiblingTag, params)));
  for (Tag rowTag = kFirstRowTag; rowTag < kFirstRowTag + kRowCount; rowTag++) {
    auto rowChildTag = rowTag + 100;
    containerChildren.push_back(
        Element<ViewShadowNode>()
            .tag(rowTag)
            .props(propsForTag(rowTag, params))
            .children({Element<ViewShadowNode>()
                           .tag(rowChildTag)
                           .props(propsForTag(rowChildTag, params))}));
  }

  auto element =
      Element<RootShadowNode>()
          .reference(rootShadowNode)
          .tag(kRootTag)
          .props([] {
            auto props = std::make_shared<RootProps>();
            props->layoutConstraints = LayoutConstraints{
                .minimumSize = {.width = 0, .height = 0},
                .maximumSize = {.width = 500, .height = 500}};
            props->yogaStyle.setDimension(
                yoga::Dimension::Width, yoga::StyleSizeLength::points(200));
            props->yogaStyle.setDimension(
                yoga::Dimension::Height, yoga::StyleSizeLength::points(200));
            return props;
          })
          .children(
              {Element<ViewShadowNode>()
                   .tag(kContainerTag)
                   .props(propsForTag(kContainerTag, params))
                   .children(std::move(containerChildren)),
               Element<ViewShadowNode>()
                   .tag(kOtherContainerTag)
                   .props(propsForTag(kOtherContainerTag, params))});

  builder.build(element);
  rootShadowNode->layoutIfNeeded();
  return rootShadowNode;
}

const ShadowNode* findByTag(const ShadowNode& node, Tag tag) {
  if (node.getTag() == tag) {
    return &node;
  }
  for (const auto& child : node.getChildren()) {
    if (auto found = findByTag(*child, tag)) {
      return found;
    }
  }
  return nullptr;
}

// Expects every node of `actual` to have the frame and overflowInset of the
// node with the same tag in `expected`.
void expectSameLayout(const ShadowNode& actual, const ShadowNode& expected) {
  const auto& actualMetrics =
      dynamic_cast<const LayoutableShadowNode&>(actual).getLayoutMetrics();
  const auto& expectedMetrics =
      dynamic_cast<const LayoutableShadowNode&>(expected).getLayoutMetrics();
  EXPECT_EQ(actualMetrics.frame, expectedMetrics.frame)
      << "frame of tag " << actual.getTag();
  EXPECT_EQ(actualMetrics.overflowInset, expectedMetrics.overflowInset)
      << "overflowInset of tag " << actual.getTag();
  ASSERT_EQ(actual.getChildren().size(), expected.getChildren().size());
  for (size_t i = 0; i < actual.getChildren().size(); i++) {
    expectSameLayout(*actual.getChildren()[i], *expected.getChildren()[i]);
  }
}

// Expects the overflowInset of every node with `overflow: visible` to be the
// one its children give now.
void expectOverflowInsetFromChildren(const ShadowNode& node) {
  const auto* viewProps = dynamic_cast<const ViewProps*>(node.getProps().get());
  const auto* layoutableNode =
      dynamic_cast<const YogaLayoutableShadowNode*>(&node);
  if (viewProps != nullptr && layoutableNode != nullptr &&
      viewProps->yogaStyle.overflow() == yoga::Overflow::Visible) {
    auto metrics = layoutableNode->getLayoutMetrics();
    auto bounds = layoutableNode->getContentBounds();
    auto expected = EdgeInsets{
        .left = std::min(bounds.getMinX(), Float{0}),
        .top = std::min(bounds.getMinY(), Float{0}),
        .right =
            -std::max(bounds.getMaxX() - metrics.frame.size.width, Float{0}),
        .bottom =
            -std::max(bounds.getMaxY() - metrics.frame.size.height, Float{0})};
    EXPECT_EQ(metrics.overflowInset, expected)
        << "overflowInset of tag " << node.getTag();
  }
  for (const auto& child : node.getChildren()) {
    expectOverflowInsetFromChildren(*child);
  }
}

class SkipUnchangedOverflowInsetFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  bool skipUnchangedOverflowInsetInLayout() override {
    return true;
  }
};

// Runs each test with `skipUnchangedOverflowInsetInLayout` off and on.
class OverflowInsetTest : public ::testing::TestWithParam<bool> {
 protected:
  void SetUp() override {
    ReactNativeFeatureFlags::dangerouslyReset();
    if (GetParam()) {
      ReactNativeFeatureFlags::override(
          std::make_unique<SkipUnchangedOverflowInsetFlags>());
    }
  }

  void TearDown() override {
    ReactNativeFeatureFlags::dangerouslyReset();
  }
};

} // namespace

// Each change is committed on top of the previous revision, which carries the
// overflowInset of nodes over from the previous layout. The result has to be
// the same as laying out a tree built with the final props from scratch.
TEST_P(OverflowInsetTest, overflowInsetMatchesFreshLayoutAfterEachRevision) {
  auto builder = simpleComponentBuilder();

  struct Change {
    const char* name;
    std::vector<Tag> tags;
    std::function<void(TreeParams&)> apply;
  };
  std::vector<Change> changes = {
      {"move the overflowing child",
       {kOverflowingChildTag},
       [](TreeParams& p) { p.overflowingChildLeft = 20; }},
      {"add hitSlop to a sibling while something else moves",
       {kSiblingTag, kOtherContainerTag},
       [](TreeParams& p) {
         p.siblingHitSlop = EdgeInsets{50, 50, 50, 50};
         p.otherContainerTop = 110;
       }},
      {"translate a child while something else moves",
       {kChildTag, kOtherContainerTag},
       [](TreeParams& p) {
         p.translateChild = true;
         p.otherContainerTop = 120;
       }},
      {"resize the container",
       {kContainerTag},
       [](TreeParams& p) { p.containerWidth = 120; }},
      {"clip the overflowing child",
       {kOverflowingChildParentTag},
       [](TreeParams& p) { p.clipOverflowingChildParent = true; }},
      {"unclip, translate a child and move the overflowing child",
       {kChildTag, kOverflowingChildParentTag, kOverflowingChildTag},
       [](TreeParams& p) {
         p.clipOverflowingChildParent = false;
         p.translateChild = true;
         p.overflowingChildLeft = 90;
       }},
      {"add hitSlop to a sibling and move a row",
       {kSiblingTag, kMovingRowTag},
       [](TreeParams& p) {
         p.siblingHitSlop = EdgeInsets{50, 50, 50, 50};
         p.movingSiblingTop = 30;
       }},
      {"move a row back", {kMovingRowTag}, [](TreeParams& p) {
         p.movingSiblingTop = 5;
       }}};

  auto params = TreeParams{};
  auto rootShadowNode = buildTree(builder, params);
  expectSameLayout(*rootShadowNode, *buildTree(builder, params));

  for (const auto& change : changes) {
    SCOPED_TRACE(change.name);
    change.apply(params);
    for (auto tag : change.tags) {
      const auto* node = findByTag(*rootShadowNode, tag);
      ASSERT_NE(node, nullptr);
      rootShadowNode =
          std::static_pointer_cast<RootShadowNode>(rootShadowNode->cloneTree(
              node->getFamily(), [&](const ShadowNode& oldShadowNode) {
                return oldShadowNode.clone(
                    ShadowNodeFragment{.props = propsForTag(tag, params)});
              }));
    }
    rootShadowNode->layoutIfNeeded();
    expectSameLayout(*rootShadowNode, *buildTree(builder, params));
    expectOverflowInsetFromChildren(*rootShadowNode);
  }
}

// In a right-to-left layout, a ScrollView moves its content to x = 0 after
// its own layout. A later layout in which the ScrollView's layout comes from
// Yoga's cache has to compute its overflowInset with the moved content.
TEST_P(OverflowInsetTest, overflowInsetFollowsRightToLeftScrollViewContent) {
  auto builder = simpleComponentBuilder();

  auto buildRoot = [&](float siblingTop) {
    std::shared_ptr<RootShadowNode> rootShadowNode;
    auto element =
        Element<RootShadowNode>()
            .reference(rootShadowNode)
            .tag(kRootTag)
            .props([] {
              auto props = std::make_shared<RootProps>();
              props->layoutConstraints = LayoutConstraints{
                  .minimumSize = {.width = 0, .height = 0},
                  .maximumSize = {.width = 500, .height = 500},
                  .layoutDirection = LayoutDirection::RightToLeft};
              props->yogaStyle.setDimension(
                  yoga::Dimension::Width, yoga::StyleSizeLength::points(200));
              props->yogaStyle.setDimension(
                  yoga::Dimension::Height, yoga::StyleSizeLength::points(200));
              return props;
            })
            .children(
                {Element<ScrollViewShadowNode>()
                     .tag(kContainerTag)
                     .props([] {
                       auto props = std::make_shared<ScrollViewProps>();
                       props->yogaStyle.setDimension(
                           yoga::Dimension::Width,
                           yoga::StyleSizeLength::points(100));
                       props->yogaStyle.setDimension(
                           yoga::Dimension::Height,
                           yoga::StyleSizeLength::points(50));
                       return props;
                     })
                     // Not positioned, so Yoga puts it at the right edge.
                     .children({Element<ViewShadowNode>().tag(kChildTag).props(
                         sizedViewProps(300, 50))}),
                 Element<ViewShadowNode>()
                     .tag(kSiblingTag)
                     .props(absoluteViewProps(0, siblingTop, 20, 20))});
    builder.build(element);
    rootShadowNode->layoutIfNeeded();
    return rootShadowNode;
  };

  auto rootShadowNode = buildRoot(100);
  const auto* sibling = findByTag(*rootShadowNode, kSiblingTag);
  ASSERT_NE(sibling, nullptr);
  rootShadowNode =
      std::static_pointer_cast<RootShadowNode>(rootShadowNode->cloneTree(
          sibling->getFamily(), [&](const ShadowNode& oldShadowNode) {
            return oldShadowNode.clone(
                ShadowNodeFragment{.props = absoluteViewProps(0, 120, 20, 20)});
          }));
  rootShadowNode->layoutIfNeeded();

  expectOverflowInsetFromChildren(*rootShadowNode);
}

INSTANTIATE_TEST_SUITE_P(
    SkipUnchangedOverflowInset,
    OverflowInsetTest,
    ::testing::Bool(),
    [](const ::testing::TestParamInfo<bool>& info) {
      return info.param ? "FlagOn" : "FlagOff";
    });

} // namespace facebook::react
