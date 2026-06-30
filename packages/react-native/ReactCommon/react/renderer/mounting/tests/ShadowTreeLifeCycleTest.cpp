/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <vector>

#include <glog/logging.h>
#include <gtest/gtest.h>

#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/mounting/Differentiator.h>
#include <react/renderer/mounting/ShadowViewMutation.h>

#include <react/renderer/mounting/stubs/stubs.h>
#include <react/test_utils/Entropy.h>
#include <react/test_utils/shadowTreeGeneration.h>

// Uncomment when random test blocks are uncommented below.
// #include <algorithm>
// #include <random>

namespace facebook::react {

static void testShadowNodeTreeLifeCycle(
    uint_fast32_t seed,
    int treeSize,
    int repeats,
    int stages) {
  auto entropy = seed == 0 ? Entropy() : Entropy(seed);

  auto eventDispatcher = EventDispatcher::Shared{};
  auto contextContainer = std::make_shared<ContextContainer>();
  auto componentDescriptorParameters = ComponentDescriptorParameters{
      .eventDispatcher = eventDispatcher,
      .contextContainer = contextContainer,
      .flavor = nullptr};
  auto viewComponentDescriptor =
      ViewComponentDescriptor(componentDescriptorParameters);
  auto rootComponentDescriptor =
      RootComponentDescriptor(componentDescriptorParameters);

  PropsParserContext parserContext{-1, *contextContainer};

  auto allNodes = std::vector<std::shared_ptr<const ShadowNode>>{};

  for (int i = 0; i < repeats; i++) {
    allNodes.clear();

    auto family = rootComponentDescriptor.createFamily(
        {.tag = Tag(1), .surfaceId = SurfaceId(1), .instanceHandle = nullptr});

    // Creating an initial root shadow node.
    auto emptyRootNode = std::const_pointer_cast<RootShadowNode>(
        std::static_pointer_cast<const RootShadowNode>(
            rootComponentDescriptor.createShadowNode(
                ShadowNodeFragment{
                    .props = RootShadowNode::defaultSharedProps()},
                family)));

    // Applying size constraints.
    emptyRootNode = emptyRootNode->clone(
        parserContext,
        LayoutConstraints{
            .minimumSize = Size{.width = 512, .height = 0},
            .maximumSize =
                Size{
                    .width = 512,
                    .height = std::numeric_limits<Float>::infinity()}},
        LayoutContext{});

    // Generation of a random tree.
    auto singleRootChildNode =
        generateShadowNodeTree(entropy, viewComponentDescriptor, treeSize);

    // Injecting a tree into the root node.
    auto currentRootNode = std::static_pointer_cast<const RootShadowNode>(
        emptyRootNode->ShadowNode::clone(
            ShadowNodeFragment{
                .props = ShadowNodeFragment::propsPlaceholder(),
                .children = std::make_shared<
                    std::vector<std::shared_ptr<const ShadowNode>>>(
                    std::vector<std::shared_ptr<const ShadowNode>>{
                        singleRootChildNode})}));

    // Building an initial view hierarchy.
    auto viewTree = StubViewTree(ShadowView(*emptyRootNode));
    viewTree.mutate(
        calculateShadowViewMutations(*emptyRootNode, *currentRootNode));

    for (int j = 0; j < stages; j++) {
      auto nextRootNode = currentRootNode;

      // Mutating the tree.
      alterShadowTree(
          entropy,
          nextRootNode,
          {
              &messWithChildren,
              &messWithYogaStyles,
              &messWithLayoutableOnlyFlag,
          });

      std::vector<const LayoutableShadowNode*> affectedLayoutableNodes{};
      affectedLayoutableNodes.reserve(1024);

      // Laying out the tree.
      std::const_pointer_cast<RootShadowNode>(nextRootNode)
          ->layoutIfNeeded(&affectedLayoutableNodes);

      nextRootNode->sealRecursive();
      allNodes.push_back(nextRootNode);

      // Calculating mutations.
      auto mutations =
          calculateShadowViewMutations(*currentRootNode, *nextRootNode);

      // Make sure that in a single frame, a DELETE for a
      // view is not followed by a CREATE for the same view.
      {
        std::vector<int> deletedTags{};
        for (const auto& mutation : mutations) {
          if (mutation.type == ShadowViewMutation::Type::Delete) {
            deletedTags.push_back(mutation.oldChildShadowView.tag);
          }
        }
        for (const auto& mutation : mutations) {
          if (mutation.type == ShadowViewMutation::Type::Create) {
            if (std::find(
                    deletedTags.begin(),
                    deletedTags.end(),
                    mutation.newChildShadowView.tag) != deletedTags.end()) {
              LOG(ERROR) << "Deleted tag was recreated in mutations list: ["
                         << mutation.newChildShadowView.tag << "]";
              react_native_assert(false);
            }
          }
        }
      }

      // Mutating the view tree.
      viewTree.mutate(mutations);

      // Building a view tree to compare with.
      auto rebuiltViewTree =
          buildStubViewTreeWithoutUsingDifferentiator(*nextRootNode);

      // Comparing the newly built tree with the updated one.
      if (rebuiltViewTree != viewTree) {
        // Something went wrong.

        LOG(ERROR) << "Entropy seed: " << entropy.getSeed() << "\n";

        // There are some issues getting `getDebugDescription` to compile
        // under test on Android for now.
#if RN_DEBUG_STRING_CONVERTIBLE
        LOG(ERROR) << "Shadow Tree before: \n"
                   << currentRootNode->getDebugDescription();
        LOG(ERROR) << "Shadow Tree after: \n"
                   << nextRootNode->getDebugDescription();

        LOG(ERROR) << "View Tree before: \n"
                   << getDebugDescription(viewTree.getRootStubView(), {});
        LOG(ERROR) << "View Tree after: \n"
                   << getDebugDescription(
                          rebuiltViewTree.getRootStubView(), {});

        LOG(ERROR) << "Mutations:" << "\n"
                   << getDebugDescription(mutations, {});
#endif

        react_native_assert(false);
      }

      currentRootNode = nextRootNode;
    }
  }

  SUCCEED();
}

static void testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
    uint_fast32_t seed,
    int treeSize,
    int repeats,
    int stages) {
  auto entropy = seed == 0 ? Entropy() : Entropy(seed);

  auto eventDispatcher = EventDispatcher::Shared{};
  auto contextContainer = std::make_shared<ContextContainer>();

  auto componentDescriptorParameters = ComponentDescriptorParameters{
      .eventDispatcher = eventDispatcher,
      .contextContainer = contextContainer,
      .flavor = nullptr};
  auto viewComponentDescriptor =
      ViewComponentDescriptor(componentDescriptorParameters);
  auto rootComponentDescriptor =
      RootComponentDescriptor(componentDescriptorParameters);

  PropsParserContext parserContext{-1, *contextContainer};

  auto allNodes = std::vector<std::shared_ptr<const ShadowNode>>{};

  for (int i = 0; i < repeats; i++) {
    allNodes.clear();

    auto family = rootComponentDescriptor.createFamily(
        {.tag = Tag(1), .surfaceId = SurfaceId(1), .instanceHandle = nullptr});

    // Creating an initial root shadow node.
    auto emptyRootNode = std::const_pointer_cast<RootShadowNode>(
        std::static_pointer_cast<const RootShadowNode>(
            rootComponentDescriptor.createShadowNode(
                ShadowNodeFragment{
                    .props = RootShadowNode::defaultSharedProps()},
                family)));

    // Applying size constraints.
    emptyRootNode = emptyRootNode->clone(
        parserContext,
        LayoutConstraints{
            .minimumSize = Size{.width = 512, .height = 0},
            .maximumSize =
                Size{
                    .width = 512,
                    .height = std::numeric_limits<Float>::infinity()}},
        LayoutContext{});

    // Generation of a random tree.
    auto singleRootChildNode =
        generateShadowNodeTree(entropy, viewComponentDescriptor, treeSize);

    // Injecting a tree into the root node.
    auto currentRootNode = std::static_pointer_cast<const RootShadowNode>(
        emptyRootNode->ShadowNode::clone(
            ShadowNodeFragment{
                .props = ShadowNodeFragment::propsPlaceholder(),
                .children = std::make_shared<
                    std::vector<std::shared_ptr<const ShadowNode>>>(
                    std::vector<std::shared_ptr<const ShadowNode>>{
                        singleRootChildNode})}));

    // Building an initial view hierarchy.
    auto viewTree = buildStubViewTreeWithoutUsingDifferentiator(*emptyRootNode);
    viewTree.mutate(
        calculateShadowViewMutations(*emptyRootNode, *currentRootNode));

    for (int j = 0; j < stages; j++) {
      auto nextRootNode = currentRootNode;

      // Mutating the tree.
      alterShadowTree(
          entropy,
          nextRootNode,
          {
              &messWithYogaStyles,
              &messWithLayoutableOnlyFlag,
          });
      alterShadowTree(entropy, nextRootNode, &messWithNodeFlattenednessFlags);
      alterShadowTree(entropy, nextRootNode, &messWithChildren);

      std::vector<const LayoutableShadowNode*> affectedLayoutableNodes{};
      affectedLayoutableNodes.reserve(1024);

      // Laying out the tree.
      std::const_pointer_cast<RootShadowNode>(nextRootNode)
          ->layoutIfNeeded(&affectedLayoutableNodes);

      nextRootNode->sealRecursive();
      allNodes.push_back(nextRootNode);

      // Calculating mutations.
      auto mutations =
          calculateShadowViewMutations(*currentRootNode, *nextRootNode);

      // Make sure that in a single frame, a DELETE for a
      // view is not followed by a CREATE for the same view.
      {
        std::vector<int> deletedTags{};
        for (const auto& mutation : mutations) {
          if (mutation.type == ShadowViewMutation::Type::Delete) {
            deletedTags.push_back(mutation.oldChildShadowView.tag);
          }
        }
        for (const auto& mutation : mutations) {
          if (mutation.type == ShadowViewMutation::Type::Create) {
            if (std::find(
                    deletedTags.begin(),
                    deletedTags.end(),
                    mutation.newChildShadowView.tag) != deletedTags.end()) {
              LOG(ERROR) << "Deleted tag was recreated in mutations list: ["
                         << mutation.newChildShadowView.tag << "]";
              react_native_assert(false);
            }
          }
        }
      }

      // Mutating the view tree.
      viewTree.mutate(mutations);

      // Building a view tree to compare with.
      auto rebuiltViewTree =
          buildStubViewTreeWithoutUsingDifferentiator(*nextRootNode);

      // Comparing the newly built tree with the updated one.
      if (rebuiltViewTree != viewTree) {
        // Something went wrong.

        LOG(ERROR) << "Entropy seed: " << entropy.getSeed() << "\n";

        // There are some issues getting `getDebugDescription` to compile
        // under test on Android for now.
#if RN_DEBUG_STRING_CONVERTIBLE
        LOG(ERROR) << "Shadow Tree before: \n"
                   << currentRootNode->getDebugDescription();
        LOG(ERROR) << "Shadow Tree after: \n"
                   << nextRootNode->getDebugDescription();

        LOG(ERROR) << "View Tree before: \n"
                   << getDebugDescription(viewTree.getRootStubView(), {});
        LOG(ERROR) << "View Tree after: \n"
                   << getDebugDescription(
                          rebuiltViewTree.getRootStubView(), {});

        LOG(ERROR) << "Mutations:" << "\n"
                   << getDebugDescription(mutations, {});
#endif

        react_native_assert(false);
      }

      currentRootNode = nextRootNode;
    }
  }

  SUCCEED();
}

} // namespace facebook::react

using namespace facebook::react;

class ShadowTreeLifecycleTest : public ::testing::Test {};

TEST_F(
    ShadowTreeLifecycleTest,
    stableBiggerTreeFewerIterationsOptimizedMovesFlattener) {
  testShadowNodeTreeLifeCycle(
      /* seed */ 0,
      /* size */ 512,
      /* repeats */ 32,
      /* stages */ 32);
}

TEST_F(
    ShadowTreeLifecycleTest,
    stableBiggerTreeFewerIterationsOptimizedMovesFlattener2) {
  testShadowNodeTreeLifeCycle(
      /* seed */ 1,
      /* size */ 512,
      /* repeats */ 32,
      /* stages */ 32);
}

TEST_F(
    ShadowTreeLifecycleTest,
    stableSmallerTreeMoreIterationsOptimizedMovesFlattener) {
  testShadowNodeTreeLifeCycle(
      /* seed */ 0,
      /* size */ 16,
      /* repeats */ 512,
      /* stages */ 32);
}

TEST_F(
    ShadowTreeLifecycleTest,
    unstableSmallerTreeFewerIterationsExtensiveFlatteningUnflattening) {
  testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
      /* seed */ 1337,
      /* size */ 32,
      /* repeats */ 32,
      /* stages */ 32);
}

TEST_F(
    ShadowTreeLifecycleTest,
    unstableBiggerTreeFewerIterationsExtensiveFlatteningUnflattening) {
  testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
      /* seed */ 1337,
      /* size */ 256,
      /* repeats */ 32,
      /* stages */ 32);
}

TEST_F(
    ShadowTreeLifecycleTest,
    unstableSmallerTreeMoreIterationsExtensiveFlatteningUnflattening) {
  testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
      /* seed */ 1337,
      /* size */ 32,
      /* repeats */ 512,
      /* stages */ 32);
}

// failing test case found 4-25-2021
TEST_F(
    ShadowTreeLifecycleTest,
    unstableSmallerTreeMoreIterationsExtensiveFlatteningUnflattening_1167342011) {
  testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
      /* seed */ 1167342011,
      /* size */ 32,
      /* repeats */ 512,
      /* stages */ 32);
}

// You may uncomment this - locally only! - to generate failing seeds.
// TEST_F(
//     ShadowTreeLifecycleTest,
//     unstableSmallerTreeMoreIterationsExtensiveFlatteningUnflatteningManyRandom)
//     {
//   std::random_device device;
//   for (int i = 0; i < 10; i++) {
//     uint_fast32_t seed = device();
//     LOG(ERROR) << "Seed: " << seed;
//     testShadowNodeTreeLifeCycleExtensiveFlatteningUnflattening(
//         /* seed */ seed,
//         /* size */ 32,
//         /* repeats */ 512,
//         /* stages */ 32);
//   }
// }

// Tests greedy algorithm behavior for a simple child reorder:
// [A,B,C,D,E] → [B,C,D,E,A].
TEST_F(ShadowTreeLifecycleTest, moveFirstChildToLast) {
  auto builder = simpleComponentBuilder();

  auto makeProps = [](const std::string& id) {
    auto props = std::make_shared<ViewProps>();
    props->nativeId = id;
    return props;
  };

  // clang-format off
  auto rootElement =
      Element<RootShadowNode>()
        .tag(1)
        .children({
          Element<ViewShadowNode>().tag(2).props(makeProps("A")),
          Element<ViewShadowNode>().tag(3).props(makeProps("B")),
          Element<ViewShadowNode>().tag(4).props(makeProps("C")),
          Element<ViewShadowNode>().tag(5).props(makeProps("D")),
          Element<ViewShadowNode>().tag(6).props(makeProps("E")),
        });
  // clang-format on

  auto rootNode = builder.build(rootElement);

  // Clone root with children reordered to [B, C, D, E, A].
  auto children = rootNode->getChildren();
  auto reorderedChildren =
      std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
  for (size_t i = 1; i < children.size(); i++) {
    reorderedChildren->push_back(children[i]);
  }
  reorderedChildren->push_back(children[0]);

  auto reorderedRootNode = std::static_pointer_cast<const RootShadowNode>(
      rootNode->ShadowNode::clone(
          ShadowNodeFragment{
              .props = ShadowNodeFragment::propsPlaceholder(),
              .children = reorderedChildren}));

  auto expected =
      buildStubViewTreeWithoutUsingDifferentiator(*reorderedRootNode);
  auto mutations = calculateShadowViewMutations(*rootNode, *reorderedRootNode);

  auto isMoveOp = [](const ShadowViewMutation& m) {
    return m.type == ShadowViewMutation::Remove ||
        m.type == ShadowViewMutation::Insert;
  };

  // Greedy: 4 REMOVE + 4 INSERT = 8 move ops.
  EXPECT_EQ(std::count_if(mutations.begin(), mutations.end(), isMoveOp), 8);

  auto viewTree = buildStubViewTreeWithoutUsingDifferentiator(*rootNode);
  viewTree.mutate(mutations);
  EXPECT_EQ(viewTree, expected);
}
