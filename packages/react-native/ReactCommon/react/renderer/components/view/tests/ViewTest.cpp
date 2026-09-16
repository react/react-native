/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <algorithm>
#include <memory>

#include <gtest/gtest.h>

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/element/ComponentBuilder.h>

#include <react/renderer/components/view/YogaLayoutableShadowNode.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <yoga/node/Node.h>
#include <yoga/numeric/FloatOptional.h>

namespace facebook::react {

class YogaDirtyFlagTest : public ::testing::Test {
 protected:
  ComponentBuilder builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> innerShadowNode_;
  std::shared_ptr<ScrollViewShadowNode> scrollViewShadowNode_;

  YogaDirtyFlagTest() : builder_(simpleComponentBuilder()) {
    // clang-format off
    auto element =
        Element<RootShadowNode>()
          .reference(rootShadowNode_)
          .tag(1)
          .children({
            Element<ViewShadowNode>()
              .tag(2),
            Element<ViewShadowNode>()
              .tag(3)
              .reference(innerShadowNode_)
              .children({
                Element<ViewShadowNode>()
                  .tag(4)
                  .props([] {
                    /*
                     * Some non-default props.
                     */
                    auto mutableViewProps = std::make_shared<ViewProps>();
                    auto &props = *mutableViewProps;
                    props.nativeId = "native Id";
                    props.opacity = 0.5;
                    props.yogaStyle.setAlignContent(yoga::Align::Baseline);
                    props.yogaStyle.setFlexDirection(yoga::FlexDirection::RowReverse);
                    return mutableViewProps;
                  }),
                Element<ViewShadowNode>()
                  .tag(5),
                Element<ViewShadowNode>()
                  .tag(6),
                Element<ScrollViewShadowNode>()
                  .reference(scrollViewShadowNode_)
                  .tag(7)
                  .children({
                    Element<ViewShadowNode>()
                      .tag(8)
                  })
              })
          });
    // clang-format on

    builder_.build(element);

    /*
     * Yoga nodes are dirty right after creation.
     */
    EXPECT_TRUE(rootShadowNode_->layoutIfNeeded());

    /*
     * Yoga nodes are clean (not dirty) right after layout pass.
     */
    EXPECT_FALSE(rootShadowNode_->layoutIfNeeded());
  }
};

TEST_F(YogaDirtyFlagTest, cloningPropsWithoutChangingThem) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  /*
   * Cloning props without changing them must *not* dirty a Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [&](const ShadowNode& oldShadowNode) {
        auto& componentDescriptor = oldShadowNode.getComponentDescriptor();
        auto props = componentDescriptor.cloneProps(
            parserContext, oldShadowNode.getProps(), RawProps());
        return oldShadowNode.clone(ShadowNodeFragment{.props = props});
      });

  EXPECT_FALSE(
      static_cast<RootShadowNode&>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, changingNonLayoutSubPropsMustNotDirtyYogaNode) {
  /*
   * Changing *non-layout* sub-props must *not* dirty a Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [](const ShadowNode& oldShadowNode) {
        auto viewProps = std::make_shared<ViewProps>();
        auto& props = *viewProps;

        props.nativeId = "some new native Id";
        props.backgroundColor = blackColor();
        props.opacity = props.opacity + 0.042;
        props.zIndex = props.zIndex.value_or(0) + 42;
        props.shouldRasterize = !props.shouldRasterize;
        props.collapsable = !props.collapsable;

        return oldShadowNode.clone(ShadowNodeFragment{.props = viewProps});
      });

  EXPECT_FALSE(
      static_cast<RootShadowNode&>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, changingLayoutSubPropsMustDirtyYogaNode) {
  /*
   * Changing *layout* sub-props *must* dirty a Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [](const ShadowNode& oldShadowNode) {
        auto viewProps = std::make_shared<ViewProps>();
        auto& props = *viewProps;

        props.yogaStyle.setAlignContent(yoga::Align::Baseline);
        props.yogaStyle.setDisplay(yoga::Display::None);

        return oldShadowNode.clone(ShadowNodeFragment{.props = viewProps});
      });

  EXPECT_TRUE(
      static_cast<RootShadowNode&>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, removingAllChildrenMustDirtyYogaNode) {
  /*
   * Removing all children *must* dirty a Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone(
            {.props = ShadowNodeFragment::propsPlaceholder(),
             .children = ShadowNode::emptySharedShadowNodeSharedList()});
      });

  EXPECT_TRUE(
      static_cast<RootShadowNode&>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, removingLastChildMustDirtyYogaNode) {
  /*
   * Removing the last child *must* dirty the Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [](const ShadowNode& oldShadowNode) {
        auto children = oldShadowNode.getChildren();
        children.pop_back();

        std::reverse(children.begin(), children.end());

        return oldShadowNode.clone(
            {.props = ShadowNodeFragment::propsPlaceholder(),
             .children = std::make_shared<
                 const std::vector<std::shared_ptr<const ShadowNode>>>(
                 children)});
      });

  EXPECT_TRUE(
      static_cast<RootShadowNode&>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, reversingListOfChildrenMustDirtyYogaNode) {
  /*
   * Reversing a list of children *must* dirty a Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [](const ShadowNode& oldShadowNode) {
        auto children = oldShadowNode.getChildren();

        std::reverse(children.begin(), children.end());

        return oldShadowNode.clone(
            {.props = ShadowNodeFragment::propsPlaceholder(),
             .children = std::make_shared<
                 const std::vector<std::shared_ptr<const ShadowNode>>>(
                 children)});
      });

  EXPECT_TRUE(
      static_cast<RootShadowNode&>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, updatingStateForScrollViewMistNotDirtyYogaNode) {
  /*
   * Updating a state for *some* (not all!) components must *not* dirty Yoga
   * nodes.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      scrollViewShadowNode_->getFamily(), [](const ShadowNode& oldShadowNode) {
        auto state = ScrollViewState{};
        state.contentOffset = Point{.x = 42, .y = 9000};

        auto& componentDescriptor = oldShadowNode.getComponentDescriptor();
        auto newState = componentDescriptor.createState(
            oldShadowNode.getFamily(),
            std::make_shared<ScrollViewState>(state));

        return oldShadowNode.clone(
            {.props = ShadowNodeFragment::propsPlaceholder(),
             .children = ShadowNodeFragment::childrenPlaceholder(),
             .state = newState});
      });

  EXPECT_FALSE(
      static_cast<RootShadowNode&>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, clonedPropsPreserveAspectRatio) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  /*
   * Cloning props with empty RawProps must preserve aspectRatio set on the
   * source props.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [&](const ShadowNode& oldShadowNode) {
        // First clone: set aspectRatio to 1.5
        auto viewProps = std::make_shared<ViewProps>();
        viewProps->yogaStyle.setAspectRatio(yoga::FloatOptional(1.5f));
        auto nodeWithAspectRatio =
            oldShadowNode.clone(ShadowNodeFragment{.props = viewProps});

        // Second clone: clone props with empty RawProps (simulating a prop
        // update that does not touch aspectRatio)
        auto& componentDescriptor =
            nodeWithAspectRatio->getComponentDescriptor();
        auto clonedProps = componentDescriptor.cloneProps(
            parserContext, nodeWithAspectRatio->getProps(), RawProps());

        auto& clonedViewProps = static_cast<const ViewProps&>(*clonedProps);
        EXPECT_TRUE(clonedViewProps.yogaStyle.aspectRatio().isDefined());
        EXPECT_EQ(clonedViewProps.yogaStyle.aspectRatio().unwrap(), 1.5f);

        return nodeWithAspectRatio->clone(
            ShadowNodeFragment{.props = clonedProps});
      });
}

// Exercises the two branches of YogaLayoutableShadowNode's clone constructor:
// `!fragment.children` (children inherited from source) and
// `fragment.children` set (children list replaced). The cloned subtree must
// lay out identically to a freshly built equivalent tree.
class YogaCloneTest : public ::testing::Test {
 protected:
  ComponentBuilder builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> parentShadowNode_;
  std::shared_ptr<ViewShadowNode> childAShadowNode_;
  std::shared_ptr<ViewShadowNode> childBShadowNode_;
  std::shared_ptr<ViewShadowNode> childCShadowNode_;

  YogaCloneTest() : builder_(simpleComponentBuilder()) {
    // clang-format off
    auto element =
        Element<RootShadowNode>()
          .reference(rootShadowNode_)
          .tag(1)
          .props([] {
            auto sharedProps = std::make_shared<RootProps>();
            auto &props = *sharedProps;
            props.layoutConstraints = LayoutConstraints{
                .minimumSize = {.width = 0, .height = 0},
                .maximumSize = {.width = 300, .height = 300}};
            auto &yogaStyle = props.yogaStyle;
            yogaStyle.setDimension(
                yoga::Dimension::Width, yoga::StyleSizeLength::points(300));
            yogaStyle.setDimension(
                yoga::Dimension::Height, yoga::StyleSizeLength::points(300));
            yogaStyle.setFlexDirection(yoga::FlexDirection::Row);
            return sharedProps;
          })
          .children({
            Element<ViewShadowNode>()
              .reference(parentShadowNode_)
              .tag(2)
              .props([] {
                auto sharedProps = std::make_shared<ViewProps>();
                auto &props = *sharedProps;
                auto &yogaStyle = props.yogaStyle;
                yogaStyle.setFlexDirection(yoga::FlexDirection::Row);
                yogaStyle.setDimension(
                    yoga::Dimension::Width,
                    yoga::StyleSizeLength::points(300));
                yogaStyle.setDimension(
                    yoga::Dimension::Height,
                    yoga::StyleSizeLength::points(100));
                return sharedProps;
              })
              .children({
                Element<ViewShadowNode>()
                  .reference(childAShadowNode_)
                  .tag(3)
                  .props([] {
                    auto sharedProps = std::make_shared<ViewProps>();
                    sharedProps->yogaStyle.setDimension(
                        yoga::Dimension::Width,
                        yoga::StyleSizeLength::points(100));
                    sharedProps->yogaStyle.setDimension(
                        yoga::Dimension::Height,
                        yoga::StyleSizeLength::points(100));
                    return sharedProps;
                  }),
                Element<ViewShadowNode>()
                  .reference(childBShadowNode_)
                  .tag(4)
                  .props([] {
                    auto sharedProps = std::make_shared<ViewProps>();
                    sharedProps->yogaStyle.setDimension(
                        yoga::Dimension::Width,
                        yoga::StyleSizeLength::points(100));
                    sharedProps->yogaStyle.setDimension(
                        yoga::Dimension::Height,
                        yoga::StyleSizeLength::points(100));
                    return sharedProps;
                  }),
                Element<ViewShadowNode>()
                  .reference(childCShadowNode_)
                  .tag(5)
                  .props([] {
                    auto sharedProps = std::make_shared<ViewProps>();
                    sharedProps->yogaStyle.setDimension(
                        yoga::Dimension::Width,
                        yoga::StyleSizeLength::points(100));
                    sharedProps->yogaStyle.setDimension(
                        yoga::Dimension::Height,
                        yoga::StyleSizeLength::points(100));
                    return sharedProps;
                  })
              })
          });
    // clang-format on

    builder_.build(element);
    rootShadowNode_->layoutIfNeeded();
  }

  // Bridges friend access to `YogaLayoutableShadowNode::yogaNode_` for the
  // `TEST_F`-generated subclasses (which inherit from this fixture and would
  // otherwise have to be friended individually).
  static yoga::Node& yogaNodeOf(const ShadowNode& shadowNode) {
    return static_cast<const YogaLayoutableShadowNode&>(shadowNode).yogaNode_;
  }
};

// Cloning a non-leaf node WITHOUT touching the children list must produce a
// subtree whose layout is byte-identical to the original (covers the
// `!fragment.children` fast path that copies `yogaLayoutableChildren_` from
// the source via `static_cast`).
TEST_F(YogaCloneTest, unchangedChildrenClonePreservesLayout) {
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      parentShadowNode_->getFamily(), [](const ShadowNode& oldShadowNode) {
        // Empty fragment — neither props nor children set — exercises the
        // `!fragment.children` fast path on the parent's clone.
        return oldShadowNode.clone(ShadowNodeFragment{});
      });

  static_cast<RootShadowNode&>(*newRootShadowNode).layoutIfNeeded();

  // The cloned parent must still have three layoutable children at the
  // expected positions — proving the copied `yogaLayoutableChildren_` is
  // consistent with the source.
  auto clonedParent = newRootShadowNode->getChildren()[0]->getChildren();
  ASSERT_EQ(clonedParent.size(), 3u);
  EXPECT_EQ(
      std::static_pointer_cast<const ViewShadowNode>(clonedParent[0])
          ->getLayoutMetrics()
          .frame.origin.x,
      0);
  EXPECT_EQ(
      std::static_pointer_cast<const ViewShadowNode>(clonedParent[1])
          ->getLayoutMetrics()
          .frame.origin.x,
      100);
  EXPECT_EQ(
      std::static_pointer_cast<const ViewShadowNode>(clonedParent[2])
          ->getLayoutMetrics()
          .frame.origin.x,
      200);
}

// Cloning a non-leaf node WITH a new children list must produce a subtree
// whose layout reflects the new list (covers the `fragment.children` branch
// where `updateYogaChildren()` rebuilds `yogaLayoutableChildren_`).
TEST_F(YogaCloneTest, newChildrenCloneReflectsNewList) {
  // Drop the middle child.
  auto newChildren =
      std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(
          std::vector<std::shared_ptr<const ShadowNode>>{
              parentShadowNode_->getChildren()[0],
              parentShadowNode_->getChildren()[2]});

  auto newRootShadowNode = rootShadowNode_->cloneTree(
      parentShadowNode_->getFamily(), [&](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone(
            {.props = ShadowNodeFragment::propsPlaceholder(),
             .children = newChildren});
      });

  static_cast<RootShadowNode&>(*newRootShadowNode).layoutIfNeeded();

  auto clonedParent = newRootShadowNode->getChildren()[0]->getChildren();
  ASSERT_EQ(clonedParent.size(), 2u);
  // After removing the middle child, the third original child should now sit
  // where the second used to be.
  EXPECT_EQ(
      std::static_pointer_cast<const ViewShadowNode>(clonedParent[0])
          ->getLayoutMetrics()
          .frame.origin.x,
      0);
  EXPECT_EQ(
      std::static_pointer_cast<const ViewShadowNode>(clonedParent[1])
          ->getLayoutMetrics()
          .frame.origin.x,
      100);
}

// Successive prop-only clones (the animation commit pattern) must each
// produce a self-consistent layout. Validates that the fast path's vector
// copy yields a vector the next clone can again copy from.
TEST_F(YogaCloneTest, repeatedUnchangedChildrenClonesYieldStableLayout) {
  std::shared_ptr<const RootShadowNode> current = rootShadowNode_;
  for (int i = 0; i < 5; i++) {
    auto next = current->cloneTree(
        parentShadowNode_->getFamily(), [](const ShadowNode& oldShadowNode) {
          return oldShadowNode.clone(ShadowNodeFragment{});
        });
    auto& mutableNext = static_cast<RootShadowNode&>(*next);
    mutableNext.layoutIfNeeded();
    current = std::static_pointer_cast<const RootShadowNode>(next);

    auto parentChildren = current->getChildren()[0]->getChildren();
    ASSERT_EQ(parentChildren.size(), 3u);
    EXPECT_EQ(
        std::static_pointer_cast<const ViewShadowNode>(parentChildren[2])
            ->getLayoutMetrics()
            .frame.origin.x,
        200);
  }
}

// The fast path copies the source's `yogaLayoutableChildren_` vector; that
// copy must be independent — mutating the clone via `appendChild` must not
// disturb the source's vector. Indirect signal: source still lays out with
// three children, clone with four.
TEST_F(YogaCloneTest, appendChildOnCloneDoesNotAffectSource) {
  auto clonedParent = std::static_pointer_cast<ViewShadowNode>(
      parentShadowNode_->clone(ShadowNodeFragment{}));

  auto extraChild = std::static_pointer_cast<ViewShadowNode>(
      childCShadowNode_->clone(ShadowNodeFragment{}));
  clonedParent->appendChild(extraChild);

  EXPECT_EQ(parentShadowNode_->getChildren().size(), 3u);
  EXPECT_EQ(clonedParent->getChildren().size(), 4u);

  // Source's layout (already computed in the fixture) is still valid because
  // its yoga subtree was untouched.
  EXPECT_EQ(childCShadowNode_->getLayoutMetrics().frame.origin.x, 200);
}

// After cloning a non-leaf node with `!fragment.children`, the cloned
// parent's `yogaNode_` is copy-constructed from the source's and therefore
// shares the same child yoga-node pointers (no synchronous re-parenting,
// no yoga-side reallocation). Yoga's clone callback handles ownership
// transfer lazily on the cloned subtree's first layout, so the source must
// remain undisturbed — both its child count AND its ownership of each
// child yoga node are preserved.
TEST_F(YogaCloneTest, cloneInheritsSourceYogaChildrenWithoutDisturbance) {
  const size_t sourceChildCount =
      yogaNodeOf(*parentShadowNode_).getChildCount();
  // Snapshot each child's owner before the clone.
  std::vector<yoga::Node*> ownersBefore;
  for (const auto& child : parentShadowNode_->getChildren()) {
    ownersBefore.push_back(yogaNodeOf(*child).getOwner());
    EXPECT_EQ(ownersBefore.back(), &yogaNodeOf(*parentShadowNode_))
        << "Sanity: source owns its children before clone";
  }

  auto clonedParent = std::static_pointer_cast<ViewShadowNode>(
      parentShadowNode_->clone(ShadowNodeFragment{}));

  // Cloned parent inherits source's child yoga-node references — same count,
  // same pointers — without running `updateYogaChildren()`.
  ASSERT_EQ(yogaNodeOf(*clonedParent).getChildCount(), sourceChildCount);
  for (size_t i = 0; i < sourceChildCount; i++) {
    EXPECT_EQ(
        yogaNodeOf(*clonedParent).getChild(i),
        yogaNodeOf(*parentShadowNode_).getChild(i))
        << "Cloned parent's yoga child at index " << i
        << " must alias the source's";
  }

  // Source's ownership of every child yoga node is unchanged by the clone.
  for (size_t i = 0; i < parentShadowNode_->getChildren().size(); i++) {
    const auto& child = *parentShadowNode_->getChildren()[i];
    EXPECT_EQ(yogaNodeOf(child).getOwner(), ownersBefore[i])
        << "Source's yoga ownership must be preserved across clone";
  }
}

// `cloneTree` clones every node on the path from root to the target, AND
// every sibling on that path — because Fabric forces ownership transfer via
// `adoptYogaChild`, which clones any child whose yoga node is still owned by
// the previous parent. Grandchildren below an unchanged sibling are NOT
// touched (structural sharing kicks in there).
//
// This is the actual "number of clones" invariant for Fabric's cloneTree.
TEST_F(YogaCloneTest, cloneTreeClonesPathPlusSiblings) {
  // Build a four-level tree so we have a grandchild we can pointer-compare
  // against under an unchanged sibling.
  std::shared_ptr<ViewShadowNode> grandchildOfA;
  std::shared_ptr<RootShadowNode> deepRoot;
  std::shared_ptr<ViewShadowNode> deepParent;
  std::shared_ptr<ViewShadowNode> deepChildA;
  std::shared_ptr<ViewShadowNode> deepChildB;
  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .reference(deepRoot)
        .tag(101)
        .props([] {
          auto sharedProps = std::make_shared<RootProps>();
          sharedProps->layoutConstraints = LayoutConstraints{
              .minimumSize = {.width = 0, .height = 0},
              .maximumSize = {.width = 300, .height = 300}};
          return sharedProps;
        })
        .children({
          Element<ViewShadowNode>()
            .reference(deepParent)
            .tag(102)
            .children({
              Element<ViewShadowNode>()
                .reference(deepChildA)
                .tag(103)
                .children({
                  Element<ViewShadowNode>()
                    .reference(grandchildOfA)
                    .tag(104)
                }),
              Element<ViewShadowNode>()
                .reference(deepChildB)
                .tag(105)
            })
        });
  // clang-format on
  builder_.build(element);
  deepRoot->layoutIfNeeded();

  const ShadowNode* origRoot = deepRoot.get();
  const ShadowNode* origParent = deepParent.get();
  const ShadowNode* origChildA = deepChildA.get();
  const ShadowNode* origChildB = deepChildB.get();
  const ShadowNode* origGrandchildA = grandchildOfA.get();

  // Target childB. Path: root → parent → childB.
  auto newRoot = deepRoot->cloneTree(
      deepChildB->getFamily(), [](const ShadowNode& oldShadowNode) {
        return oldShadowNode.clone(ShadowNodeFragment{});
      });

  const ShadowNode* newRootPtr = newRoot.get();
  const ShadowNode* newParent = newRoot->getChildren()[0].get();
  const ShadowNode* newChildA = newParent->getChildren()[0].get();
  const ShadowNode* newChildB = newParent->getChildren()[1].get();
  const ShadowNode* newGrandchildA = newChildA->getChildren()[0].get();

  // Path from root to target: every node is a fresh allocation.
  EXPECT_NE(newRootPtr, origRoot) << "Root cloned (on path)";
  EXPECT_NE(newParent, origParent) << "Parent cloned (on path)";
  EXPECT_NE(newChildB, origChildB) << "Target cloned";

  // Siblings of the target ARE cloned in Fabric, because parent's
  // updateYogaChildren() → adoptYogaChild() clones any child whose yoga
  // node is still owned by the previous parent.
  EXPECT_NE(newChildA, origChildA)
      << "Sibling cloned to take new yoga ownership";

  // But the sibling's children are NOT cloned — structural sharing kicks in
  // one level below the disturbance.
  EXPECT_EQ(newGrandchildA, origGrandchildA)
      << "Grandchild under unchanged sibling must be shared";
}

} // namespace facebook::react
