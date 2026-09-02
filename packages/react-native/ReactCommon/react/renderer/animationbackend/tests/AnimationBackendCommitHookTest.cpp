/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/animationbackend/AnimatedPropsRegistry.h>
#include <react/renderer/animationbackend/AnimationBackendCommitHook.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/mounting/ShadowTree.h>
#include <react/renderer/uimanager/UIManager.h>

using namespace facebook::react;

class AnimationBackendCommitHookTest : public ::testing::Test {
 protected:
  void SetUp() override {
    // Tests run in JS thread context where commit hook executes
    // RSNRU is enabled on JS thread in production
    ShadowNode::setUseRuntimeShadowNodeReferenceUpdateOnThread(true);

    /*
     * The tree has the following structure:
     * <A>
     *  <AA/>
     *  <AB/>
     *  <AC>
     *    <ACA/>
     *    <ACB/>
     *  </AC>
     * </A>
     */

    contextContainer_ = std::make_shared<const ContextContainer>();

    ComponentDescriptorProviderRegistry componentDescriptorProviderRegistry{};
    eventDispatcher_ = std::shared_ptr<const EventDispatcher>();

    componentDescriptorRegistry_ =
        componentDescriptorProviderRegistry.createComponentDescriptorRegistry(
            ComponentDescriptorParameters{
                .eventDispatcher = eventDispatcher_,
                .contextContainer = contextContainer_,
                .flavor = nullptr});

    componentDescriptorProviderRegistry.add(
        concreteComponentDescriptorProvider<RootComponentDescriptor>());
    componentDescriptorProviderRegistry.add(
        concreteComponentDescriptorProvider<ViewComponentDescriptor>());

    builder_ = std::make_unique<ComponentBuilder>(componentDescriptorRegistry_);

    RuntimeExecutor runtimeExecutor =
        [](std::function<void(facebook::jsi::Runtime & runtime)>&&
           /*callback*/) {};
    uiManager_ =
        std::make_unique<UIManager>(runtimeExecutor, contextContainer_);
    uiManager_->setComponentDescriptorRegistry(componentDescriptorRegistry_);

    registry_ = std::make_shared<AnimatedPropsRegistry>();

    auto layoutConstraints = LayoutConstraints{};
    auto layoutContext = LayoutContext{};

    initialRootNode_ = std::static_pointer_cast<RootShadowNode>(builder_->build(
        Element<RootShadowNode>().children(
            {Element<ViewShadowNode>().tag(nodeAATag_),
             Element<ViewShadowNode>().tag(nodeABTag_),
             Element<ViewShadowNode>()
                 .tag(nodeACTag_)
                 .children(
                     {Element<ViewShadowNode>().tag(nodeACATag_),
                      Element<ViewShadowNode>().tag(nodeACBTag_)})})));

    shadowTree_ = std::make_unique<ShadowTree>(
        surfaceId_,
        layoutConstraints,
        layoutContext,
        *uiManager_,
        *contextContainer_);

    shadowTree_->commit(
        [this](const RootShadowNode& /*oldRootShadowNode*/) {
          return initialRootNode_;
        },
        {true});

    uiManager_->startSurface(
        std::move(shadowTree_),
        "test",
        folly::dynamic::object,
        DisplayMode::Visible);

    commitHook_ =
        std::make_unique<AnimationBackendCommitHook>(*uiManager_, registry_);

    nodeAA_ = std::static_pointer_cast<const ViewShadowNode>(
        initialRootNode_->getChildren()[0]);
    nodeAB_ = std::static_pointer_cast<const ViewShadowNode>(
        initialRootNode_->getChildren()[1]);
    nodeAC_ = std::static_pointer_cast<const ViewShadowNode>(
        initialRootNode_->getChildren()[2]);
    nodeACA_ = std::static_pointer_cast<const ViewShadowNode>(
        nodeAC_->getChildren()[0]);
    nodeACB_ = std::static_pointer_cast<const ViewShadowNode>(
        nodeAC_->getChildren()[1]);
  }

  void TearDown() override {
    ShadowNode::setUseRuntimeShadowNodeReferenceUpdateOnThread(false);
    ReactNativeFeatureFlags::dangerouslyReset();

    if (commitHook_) {
      commitHook_.reset();
      uiManager_->stopSurface(surfaceId_);
    }
  }

  void setupAnimationProps(
      Tag tag,
      const ShadowNode& node,
      std::vector<std::unique_ptr<AnimatedPropBase>> props,
      std::unique_ptr<RawProps> rawProps = nullptr) {
    std::unordered_map<SurfaceId, SurfaceUpdates> surfaceUpdates;
    SurfaceUpdates updates;
    updates.families.insert(node.getFamilyShared());
    AnimatedProps animatedProps;
    animatedProps.props = std::move(props);
    animatedProps.rawProps = std::move(rawProps);
    updates.propsMap[tag] = std::move(animatedProps);
    surfaceUpdates[surfaceId_] = std::move(updates);
    registry_->update(surfaceUpdates);
  }

  std::shared_ptr<const RootShadowNode> commitReactUpdate() {
    uiManager_->getShadowTreeRegistry().visit(
        surfaceId_, [&](const ShadowTree& shadowTree) {
          shadowTree.commit(
              [&](const RootShadowNode& oldRootShadowNode) {
                return std::static_pointer_cast<RootShadowNode>(
                    oldRootShadowNode.ShadowNode::clone({}));
              },
              {.source = ShadowTreeCommitSource::React});
        });

    std::shared_ptr<const RootShadowNode> newRootNode;
    uiManager_->getShadowTreeRegistry().visit(
        surfaceId_, [&](const ShadowTree& shadowTree) {
          newRootNode = shadowTree.getCurrentRevision().rootShadowNode;
        });

    return newRootNode;
  }

  std::shared_ptr<const RootShadowNode> commitReactUpdateOverridingProps(
      const ShadowNode& targetNode,
      folly::dynamic reactProps) {
    uiManager_->getShadowTreeRegistry().visit(
        surfaceId_, [&](const ShadowTree& shadowTree) {
          shadowTree.commit(
              [&](const RootShadowNode& oldRootShadowNode) {
                return std::static_pointer_cast<RootShadowNode>(
                    oldRootShadowNode.cloneTree(
                        targetNode.getFamily(),
                        [&](const ShadowNode& oldShadowNode) {
                          auto& componentDescriptor =
                              oldShadowNode.getComponentDescriptor();
                          PropsParserContext propsParserContext{
                              surfaceId_, *contextContainer_};
                          auto props = componentDescriptor.cloneProps(
                              propsParserContext,
                              oldShadowNode.getProps(),
                              RawProps(reactProps));
                          return oldShadowNode.clone(
                              ShadowNodeFragment{.props = props});
                        }));
              },
              {.source = ShadowTreeCommitSource::React});
        });

    std::shared_ptr<const RootShadowNode> newRootNode;
    uiManager_->getShadowTreeRegistry().visit(
        surfaceId_, [&](const ShadowTree& shadowTree) {
          newRootNode = shadowTree.getCurrentRevision().rootShadowNode;
        });

    return newRootNode;
  }

  std::shared_ptr<const ViewProps> getNodeABProps(
      const std::shared_ptr<const RootShadowNode>& rootNode) {
    auto nodeAB = std::static_pointer_cast<const ViewShadowNode>(
        rootNode->getChildren()[1]);
    return std::static_pointer_cast<const ViewProps>(nodeAB->getProps());
  }

  std::shared_ptr<const ViewProps> getNodeACAProps(
      const std::shared_ptr<const RootShadowNode>& rootNode) {
    auto nodeAC = std::static_pointer_cast<const ViewShadowNode>(
        rootNode->getChildren()[2]);
    auto nodeACA = std::static_pointer_cast<const ViewShadowNode>(
        nodeAC->getChildren()[0]);
    return std::static_pointer_cast<const ViewProps>(nodeACA->getProps());
  }

  SurfaceId surfaceId_{11};
  std::shared_ptr<const ContextContainer> contextContainer_;
  std::shared_ptr<const EventDispatcher> eventDispatcher_;
  ComponentDescriptorRegistry::Shared componentDescriptorRegistry_;
  std::unique_ptr<ComponentBuilder> builder_;
  std::unique_ptr<UIManager> uiManager_;
  std::shared_ptr<AnimatedPropsRegistry> registry_;
  std::shared_ptr<RootShadowNode> initialRootNode_;
  std::unique_ptr<ShadowTree> shadowTree_;
  std::unique_ptr<AnimationBackendCommitHook> commitHook_;
  Tag nodeAATag_{101};
  Tag nodeABTag_{102};
  Tag nodeACTag_{103};
  Tag nodeACATag_{104};
  Tag nodeACBTag_{105};
  std::shared_ptr<const ViewShadowNode> nodeAA_;
  std::shared_ptr<const ViewShadowNode> nodeAB_;
  std::shared_ptr<const ViewShadowNode> nodeAC_;
  std::shared_ptr<const ViewShadowNode> nodeACA_;
  std::shared_ptr<const ViewShadowNode> nodeACB_;
};

// ============================================================================
// Basic Animation State Preservation
// ============================================================================

TEST_F(
    AnimationBackendCommitHookTest,
    commitHookOnlyClonesAffectedNodesInComplexTree) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  auto newRootNode = commitReactUpdate();

  ASSERT_NE(newRootNode, nullptr);

  auto newNodeAA = std::static_pointer_cast<const ViewShadowNode>(
      newRootNode->getChildren()[0]);
  auto newNodeAB = std::static_pointer_cast<const ViewShadowNode>(
      newRootNode->getChildren()[1]);
  auto newNodeAC = std::static_pointer_cast<const ViewShadowNode>(
      newRootNode->getChildren()[2]);
  auto newNodeACA = std::static_pointer_cast<const ViewShadowNode>(
      newNodeAC->getChildren()[0]);
  auto newNodeACB = std::static_pointer_cast<const ViewShadowNode>(
      newNodeAC->getChildren()[1]);

  EXPECT_NE(newRootNode.get(), initialRootNode_.get())
      << "Root node SHOULD be cloned";

  // Yoga's ownership model forces sibling cloning: when the new root adopts
  // children whose yoga nodes are still owned by the old root, adoptYogaChild()
  // clones them to maintain the single-owner invariant.
  EXPECT_NE(nodeAA_.get(), newNodeAA.get())
      << "nodeAA SHOULD be cloned (Yoga ownership)";

  EXPECT_NE(nodeAB_.get(), newNodeAB.get())
      << "nodeAB SHOULD be cloned (animated)";

  EXPECT_NE(nodeAC_.get(), newNodeAC.get())
      << "nodeAC SHOULD be cloned (Yoga ownership)";

  EXPECT_EQ(nodeACA_.get(), newNodeACA.get()) << "nodeACA should not be cloned";

  EXPECT_EQ(nodeACB_.get(), newNodeACB.get()) << "nodeACB should NOT be cloned";

  auto newNodeABProps =
      std::static_pointer_cast<const ViewProps>(newNodeAB->getProps());
  EXPECT_FLOAT_EQ(newNodeABProps->opacity, 0.5f)
      << "nodeAB opacity should be updated";
}

TEST_F(
    AnimationBackendCommitHookTest,
    preservesAnimationStateAfterReactCommit) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.3f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  auto rootAfterFirstCommit = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("opacity", 1.0));
  ASSERT_NE(rootAfterFirstCommit, nullptr);

  auto propsAfterFirst = getNodeABProps(rootAfterFirstCommit);
  EXPECT_FLOAT_EQ(propsAfterFirst->opacity, 0.3f)
      << "Opacity should be 0.3 after first commit";

  auto rootAfterSecondCommit = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("opacity", 1.0));
  ASSERT_NE(rootAfterSecondCommit, nullptr);

  auto propsAfterSecond = getNodeABProps(rootAfterSecondCommit);
  EXPECT_FLOAT_EQ(propsAfterSecond->opacity, 0.3f)
      << "Animation state (opacity 0.3) should be preserved after second React commit";

  auto rootAfterThirdCommit = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("width", 100.0));
  ASSERT_NE(rootAfterThirdCommit, nullptr);

  auto propsAfterThird = getNodeABProps(rootAfterThirdCommit);
  EXPECT_FLOAT_EQ(propsAfterThird->opacity, 0.3f)
      << "Animation state (opacity 0.3) should be preserved after third React commit";
}

// ============================================================================
// Multiple Animated Nodes
// ============================================================================

TEST_F(AnimationBackendCommitHookTest, preservesMultipleAnimatedNodes) {
  std::vector<std::unique_ptr<AnimatedPropBase>> propsAB;
  propsAB.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(propsAB));

  std::vector<std::unique_ptr<AnimatedPropBase>> propsACA;
  propsACA.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.8f));
  setupAnimationProps(nodeACATag_, *nodeACA_, std::move(propsACA));

  auto newRootNode = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("opacity", 1.0));
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->opacity, 0.5f) << "nodeAB opacity should be 0.5";

  auto nodeACAProps = getNodeACAProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeACAProps->opacity, 0.8f)
      << "nodeACA opacity should be 0.8";
}

TEST_F(
    AnimationBackendCommitHookTest,
    multipleNodesWithDifferentPropsAreAnimated) {
  std::vector<std::unique_ptr<AnimatedPropBase>> propsAB;
  propsAB.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.5f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(propsAB));

  std::vector<std::unique_ptr<AnimatedPropBase>> propsACA;
  propsACA.push_back(
      std::make_unique<AnimatedProp<std::optional<int>>>(Z_INDEX, 10));
  setupAnimationProps(nodeACATag_, *nodeACA_, std::move(propsACA));

  auto newRootNode = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("opacity", 1.0));
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->opacity, 0.5f);

  auto nodeACAProps = getNodeACAProps(newRootNode);
  EXPECT_TRUE(nodeACAProps->zIndex.has_value());
  EXPECT_EQ(nodeACAProps->zIndex.value(), 10);
}

// ============================================================================
// Layout vs Non-Layout Props
// ============================================================================

TEST_F(AnimationBackendCommitHookTest, appliesLayoutPropsCorrectly) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(SHADOW_RADIUS, 5.0f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  auto newRootNode = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("shadowRadius", 0.0));
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->shadowRadius, 5.0f);
}

TEST_F(AnimationBackendCommitHookTest, appliesNonLayoutPropsCorrectly) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.75f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  auto newRootNode = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("opacity", 1.0));
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->opacity, 0.75f);
}

TEST_F(AnimationBackendCommitHookTest, appliesTransformPropCorrectly) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  Transform transform = Transform::Identity();
  transform = transform * Transform::Translate(10.0f, 20.0f, 0.0f);
  props.push_back(
      std::make_unique<AnimatedProp<Transform>>(TRANSFORM, transform));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  auto newRootNode = commitReactUpdate();
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_EQ(nodeABProps->transform, transform);
}

// ============================================================================
// RawProps Path Testing
// ============================================================================

TEST_F(AnimationBackendCommitHookTest, appliesRawPropsCorrectly) {
  folly::dynamic rawDynamic =
      folly::dynamic::object("opacity", 0.42)("nativeID", "animated-node");
  auto rawProps = std::make_unique<RawProps>(rawDynamic);

  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  setupAnimationProps(
      nodeABTag_, *nodeAB_, std::move(props), std::move(rawProps));

  auto newRootNode = commitReactUpdate();
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->opacity, 0.42f);
  EXPECT_EQ(nodeABProps->nativeId, "animated-node");
}

TEST_F(AnimationBackendCommitHookTest, mergesRawPropsWithTypedProps) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.6f));

  folly::dynamic rawDynamic = folly::dynamic::object("nativeID", "test-node");
  auto rawProps = std::make_unique<RawProps>(rawDynamic);

  setupAnimationProps(
      nodeABTag_, *nodeAB_, std::move(props), std::move(rawProps));

  auto newRootNode = commitReactUpdate();
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->opacity, 0.6f);
  EXPECT_EQ(nodeABProps->nativeId, "test-node");
}

// ============================================================================
// Commit Source Filtering
// ============================================================================

TEST_F(AnimationBackendCommitHookTest, ignoresNonReactCommitSources) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.4f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  // Unknown source should NOT apply animation props;
  // we only assume that React will override the props
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId_, [&](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& oldRootShadowNode) {
              return std::static_pointer_cast<RootShadowNode>(
                  oldRootShadowNode.ShadowNode::clone({}));
            },
            {.source = ShadowTreeCommitSource::Unknown});
      });

  std::shared_ptr<const RootShadowNode> newRootNode;
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId_, [&](const ShadowTree& shadowTree) {
        newRootNode = shadowTree.getCurrentRevision().rootShadowNode;
      });

  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->opacity, 1.0f)
      << "Opacity should remain default for non-React commit source";
}

TEST_F(AnimationBackendCommitHookTest, processesAnimationEndSyncCommits) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.4f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  // AnimationEndSync source SHOULD apply animation props
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId_, [&](const ShadowTree& shadowTree) {
        shadowTree.commit(
            [&](const RootShadowNode& oldRootShadowNode) {
              return std::static_pointer_cast<RootShadowNode>(
                  oldRootShadowNode.ShadowNode::clone({}));
            },
            {.source = ShadowTreeCommitSource::AnimationEndSync});
      });

  std::shared_ptr<const RootShadowNode> newRootNode;
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId_, [&](const ShadowTree& shadowTree) {
        newRootNode = shadowTree.getCurrentRevision().rootShadowNode;
      });

  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->opacity, 0.4f)
      << "Animation props SHOULD be applied for AnimationEndSync commit source";
}

// ============================================================================
// Empty Registry Handling
// ============================================================================

TEST_F(AnimationBackendCommitHookTest, returnsOriginalTreeWhenNoAnimations) {
  auto newRootNode = commitReactUpdate();
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->opacity, 1.0f)
      << "Default opacity should be preserved when no animations";

  newRootNode = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("opacity", 0.5));

  nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->opacity, 0.5f)
      << "Opacity should be applied properly when no animations";
}

// ============================================================================
// Additional Prop Type Tests
// ============================================================================

TEST_F(AnimationBackendCommitHookTest, appliesShadowOpacityCorrectly) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(SHADOW_OPACITY, 0.8f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  auto newRootNode = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("shadowOpacity", 0.0));
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->shadowOpacity, 0.8f);
}

TEST_F(AnimationBackendCommitHookTest, appliesZIndexCorrectly) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(
      std::make_unique<AnimatedProp<std::optional<int>>>(Z_INDEX, 5));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  auto newRootNode = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("zIndex", 0));
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_TRUE(nodeABProps->zIndex.has_value());
  EXPECT_EQ(nodeABProps->zIndex.value(), 5);
}

TEST_F(AnimationBackendCommitHookTest, appliesOutlineWidthCorrectly) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OUTLINE_WIDTH, 2.0f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  auto newRootNode = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("outlineWidth", 0.0));
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->outlineWidth, 2.0f);
}

TEST_F(AnimationBackendCommitHookTest, appliesOutlineOffsetCorrectly) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OUTLINE_OFFSET, 3.0f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  auto newRootNode = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("outlineOffset", 0.0));
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->outlineOffset, 3.0f);
}

// ============================================================================
// Multiple Props on Same Node
// ============================================================================

TEST_F(AnimationBackendCommitHookTest, appliesMultiplePropsToSameNode) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props;
  props.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.7f));
  props.push_back(
      std::make_unique<AnimatedProp<std::optional<int>>>(Z_INDEX, 99));
  props.push_back(std::make_unique<AnimatedProp<Float>>(SHADOW_OPACITY, 0.5f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props));

  auto newRootNode = commitReactUpdateOverridingProps(
      *nodeAB_,
      folly::dynamic::object("opacity", 1.0)("zIndex", 0)(
          "shadowOpacity", 0.0));
  ASSERT_NE(newRootNode, nullptr);

  auto nodeABProps = getNodeABProps(newRootNode);
  EXPECT_FLOAT_EQ(nodeABProps->opacity, 0.7f);
  EXPECT_TRUE(nodeABProps->zIndex.has_value());
  EXPECT_EQ(nodeABProps->zIndex.value(), 99);
  EXPECT_FLOAT_EQ(nodeABProps->shadowOpacity, 0.5f);
}

// ============================================================================
// Animation Update During Commit Cycle
// ============================================================================

TEST_F(
    AnimationBackendCommitHookTest,
    animationUpdatesBetweenCommitsAreApplied) {
  std::vector<std::unique_ptr<AnimatedPropBase>> props1;
  props1.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.3f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props1));

  auto rootAfterFirst = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("opacity", 1.0));
  auto propsAfterFirst = getNodeABProps(rootAfterFirst);
  EXPECT_FLOAT_EQ(propsAfterFirst->opacity, 0.3f);

  std::vector<std::unique_ptr<AnimatedPropBase>> props2;
  props2.push_back(std::make_unique<AnimatedProp<Float>>(OPACITY, 0.9f));
  setupAnimationProps(nodeABTag_, *nodeAB_, std::move(props2));

  auto rootAfterSecond = commitReactUpdateOverridingProps(
      *nodeAB_, folly::dynamic::object("opacity", 1.0));
  auto propsAfterSecond = getNodeABProps(rootAfterSecond);
  EXPECT_FLOAT_EQ(propsAfterSecond->opacity, 0.9f)
      << "Second animation update should be applied";
}
