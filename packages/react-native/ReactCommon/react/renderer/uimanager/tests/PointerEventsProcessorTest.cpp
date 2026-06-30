/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <jsi/jsi.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>
#include <react/renderer/uimanager/PointerEventsProcessor.h>
#include <react/renderer/uimanager/PointerHoverTracker.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

struct PointerEventTestLogEntry {
  Tag tag;
  std::string eventName;
  PointerEvent payload;
};

using EventLog = std::vector<PointerEventTestLogEntry>;

static inline void listenToAllPointerEvents(ViewProps& props) {
  props.events[ViewEvents::Offset::PointerDown] = true;
  props.events[ViewEvents::Offset::PointerMove] = true;
  props.events[ViewEvents::Offset::PointerUp] = true;
  props.events[ViewEvents::Offset::PointerEnter] = true;
  props.events[ViewEvents::Offset::PointerLeave] = true;
  props.events[ViewEvents::Offset::PointerOver] = true;
  props.events[ViewEvents::Offset::PointerOut] = true;
}

class PointerEventsProcessorTest : public ::testing::Test {
 public:
  PointerEventsProcessorTest() {
    auto contextContainer = std::make_shared<ContextContainer>();

    ComponentDescriptorProviderRegistry componentDescriptorProviderRegistry{};
    auto eventDispatcher = EventDispatcher::Shared{};
    auto componentDescriptorRegistry =
        componentDescriptorProviderRegistry.createComponentDescriptorRegistry(
            ComponentDescriptorParameters{
                .eventDispatcher = eventDispatcher,
                .contextContainer = std::move(contextContainer),
                .flavor = nullptr});

    componentDescriptorProviderRegistry.add(
        concreteComponentDescriptorProvider<RootComponentDescriptor>());
    componentDescriptorProviderRegistry.add(
        concreteComponentDescriptorProvider<ViewComponentDescriptor>());

    auto builder = ComponentBuilder{componentDescriptorRegistry};

    // Set up UIManager (with no-op executors since we don't need them for
    // tests)
    RuntimeExecutor runtimeExecutor =
        [](std::function<void(facebook::jsi::Runtime & runtime)>&& callback) {};
    uiManager_ = std::make_unique<UIManager>(runtimeExecutor, contextContainer);
    uiManager_->setComponentDescriptorRegistry(componentDescriptorRegistry);

    // Create a hierarchy of nodes
    /*
     * Test Hierarchy:
     *  ┌────────────────────┐
     *  │ROOT                │
     *  │  ┌───────┬──────┐  │
     *  │  │A      │B     │  │
     *  │  │  ┌────┼────┐ │  │
     *  │  │  │AA  │BB  │ │  │
     *  │  │  │    │    │ │  │
     *  │  │  └────┼────┘ │  │
     *  │  └───────┴──────┘  │
     *  └────────────────────┘
     */
    // clang-format off
    auto elementRoot =
        Element<RootShadowNode>()
          .tag(1)
          .surfaceId(surfaceId_)
          .reference(rootNode_)
          .props([] {
            auto sharedProps = std::make_shared<RootProps>();
            auto &props = *sharedProps;
            listenToAllPointerEvents(props);
            props.layoutConstraints = LayoutConstraints{.minimumSize={.width=0,.height=0}, .maximumSize={.width=500, .height=500}};
            auto &yogaStyle = props.yogaStyle;
            yogaStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(400));
            yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(400));
            yogaStyle.setDisplay(yoga::Display::Flex);
            yogaStyle.setFlexDirection(yoga::FlexDirection::Row);
            yogaStyle.setAlignItems(yoga::Align::Center);
            yogaStyle.setJustifyContent(yoga::Justify::Center);
            return sharedProps;
          })
          .children({
            Element<ViewShadowNode>()
              .tag(2)
              .surfaceId(surfaceId_)
              .reference(nodeA_)
              .props([] {
                auto sharedProps = std::make_shared<ViewProps>();
                auto &props = *sharedProps;
                listenToAllPointerEvents(props);
                auto &yogaStyle = props.yogaStyle;
                yogaStyle.setDisplay(yoga::Display::Flex);
                yogaStyle.setFlexDirection(yoga::FlexDirection::Column);
                yogaStyle.setAlignItems(yoga::Align::FlexEnd);
                yogaStyle.setJustifyContent(yoga::Justify::Center);
                yogaStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(150));
                yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(300));
                return sharedProps;
              })
              .children({
                Element<ViewShadowNode>()
                  .tag(3)
                  .surfaceId(surfaceId_)
                  .reference(nodeAA_)
                  .props([] {
                    auto sharedProps = std::make_shared<ViewProps>();
                    auto &props = *sharedProps;
                    listenToAllPointerEvents(props);
                    auto &yogaStyle = props.yogaStyle;
                    yogaStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(100));
                    yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(200));
                    return sharedProps;
                  })
              }),
            Element<ViewShadowNode>()
              .tag(4)
              .surfaceId(surfaceId_)
              .reference(nodeB_)
              .props([] {
                auto sharedProps = std::make_shared<ViewProps>();
                auto &props = *sharedProps;
                listenToAllPointerEvents(props);
                auto &yogaStyle = props.yogaStyle;
                yogaStyle.setDisplay(yoga::Display::Flex);
                yogaStyle.setFlexDirection(yoga::FlexDirection::Column);
                yogaStyle.setAlignItems(yoga::Align::FlexStart);
                yogaStyle.setJustifyContent(yoga::Justify::Center);
                yogaStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(150));
                yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(300));
                return sharedProps;
              })
              .children({
                Element<ViewShadowNode>()
                  .tag(5)
                  .surfaceId(surfaceId_)
                  .reference(nodeBB_)
                  .props([] {
                    auto sharedProps = std::make_shared<ViewProps>();
                    auto &props = *sharedProps;
                    listenToAllPointerEvents(props);
                    auto &yogaStyle = props.yogaStyle;
                    yogaStyle.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(100));
                    yogaStyle.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(200));
                    return sharedProps;
                  })
              })
          })
          .finalize([](RootShadowNode &shadowNode) {
            shadowNode.layoutIfNeeded();
            shadowNode.sealRecursive();
          });
    // clang-format on

    // Build the node heirarchy
    builder.build(elementRoot);

    // Initialize shadow tree
    auto layoutConstraints = LayoutConstraints{};
    auto layoutContext = LayoutContext{};
    auto shadowTree = std::make_unique<ShadowTree>(
        surfaceId_,
        layoutConstraints,
        layoutContext,
        *uiManager_,
        *contextContainer);
    shadowTree->commit(
        [this](const RootShadowNode& /*oldRootShadowNode*/) {
          return std::static_pointer_cast<RootShadowNode>(this->rootNode_);
        },
        {true});

    // Start the surface in UIManager
    uiManager_->startSurface(
        std::move(shadowTree),
        "test",
        folly::dynamic::object,
        DisplayMode::Visible);
  }

  void TearDown() override {
    uiManager_->stopSurface(surfaceId_);
  }

  EventLog dispatchPointerEvent(
      const std::shared_ptr<const ShadowNode>& target,
      const std::string& eventName,
      const PointerEvent& eventPayload) {
    EventLog eventLog;
    auto dispatchCallback = [&eventLog](
                                const ShadowNode& targetNode,
                                const std::string& type,
                                ReactEventPriority /*priority*/,
                                const EventPayload& eventPayload) {
      eventLog.push_back({
          .tag = targetNode.getTag(),
          .eventName = type,
          .payload = static_cast<const PointerEvent&>(eventPayload),
      });
    };
    processor_.interceptPointerEvent(
        target,
        eventName,
        ReactEventPriority::Default,
        eventPayload,
        dispatchCallback,
        *uiManager_);
    return eventLog;
  }

  SurfaceId surfaceId_{0};

  std::shared_ptr<RootShadowNode> rootNode_;
  std::shared_ptr<ViewShadowNode> nodeA_;
  std::shared_ptr<ViewShadowNode> nodeAA_;
  std::shared_ptr<ViewShadowNode> nodeB_;
  std::shared_ptr<ViewShadowNode> nodeBB_;

  PointerEventsProcessor processor_;
  std::unique_ptr<UIManager> uiManager_;
  std::unique_ptr<jsi::Runtime> runtime_;
};

TEST_F(PointerEventsProcessorTest, moveAcross) {
  auto eventPayload = PointerEvent{};
  eventPayload.pointerId = 1;

  // First move event inside nodeAA
  auto firstMoveLog =
      dispatchPointerEvent(nodeAA_, "topPointerMove", eventPayload);

  EXPECT_EQ(firstMoveLog.size(), 5);

  EXPECT_EQ(firstMoveLog[0].tag, nodeAA_->getTag());
  EXPECT_EQ(firstMoveLog[0].eventName, "topPointerOver");

  EXPECT_EQ(firstMoveLog[1].tag, rootNode_->getTag());
  EXPECT_EQ(firstMoveLog[1].eventName, "topPointerEnter");

  EXPECT_EQ(firstMoveLog[2].tag, nodeA_->getTag());
  EXPECT_EQ(firstMoveLog[2].eventName, "topPointerEnter");

  EXPECT_EQ(firstMoveLog[3].tag, nodeAA_->getTag());
  EXPECT_EQ(firstMoveLog[3].eventName, "topPointerEnter");

  EXPECT_EQ(firstMoveLog[4].tag, nodeAA_->getTag());
  EXPECT_EQ(firstMoveLog[4].eventName, "topPointerMove");

  // Second move event inside nodeBB
  auto secondMoveLog =
      dispatchPointerEvent(nodeBB_, "topPointerMove", eventPayload);

  EXPECT_EQ(secondMoveLog.size(), 7);

  EXPECT_EQ(secondMoveLog[0].tag, nodeAA_->getTag());
  EXPECT_EQ(secondMoveLog[0].eventName, "topPointerOut");

  EXPECT_EQ(secondMoveLog[1].tag, nodeAA_->getTag());
  EXPECT_EQ(secondMoveLog[1].eventName, "topPointerLeave");

  EXPECT_EQ(secondMoveLog[2].tag, nodeA_->getTag());
  EXPECT_EQ(secondMoveLog[2].eventName, "topPointerLeave");

  EXPECT_EQ(secondMoveLog[3].tag, nodeBB_->getTag());
  EXPECT_EQ(secondMoveLog[3].eventName, "topPointerOver");

  EXPECT_EQ(secondMoveLog[4].tag, nodeB_->getTag());
  EXPECT_EQ(secondMoveLog[4].eventName, "topPointerEnter");

  EXPECT_EQ(secondMoveLog[5].tag, nodeBB_->getTag());
  EXPECT_EQ(secondMoveLog[5].eventName, "topPointerEnter");

  EXPECT_EQ(secondMoveLog[6].tag, nodeBB_->getTag());
  EXPECT_EQ(secondMoveLog[6].eventName, "topPointerMove");

  // Third move event also inside nodeBB (should be no derivative events
  // emitted)
  auto thirdMoveLog =
      dispatchPointerEvent(nodeBB_, "topPointerMove", eventPayload);

  EXPECT_EQ(thirdMoveLog.size(), 1);

  EXPECT_EQ(thirdMoveLog[0].tag, nodeBB_->getTag());
  EXPECT_EQ(thirdMoveLog[0].eventName, "topPointerMove");

  // Last event emulates an event reporting that the pointer has left the root
  // view
  auto leavingMoveLog =
      dispatchPointerEvent(rootNode_, "topPointerLeave", eventPayload);

  EXPECT_EQ(leavingMoveLog.size(), 4);

  EXPECT_EQ(leavingMoveLog[0].tag, nodeBB_->getTag());
  EXPECT_EQ(leavingMoveLog[0].eventName, "topPointerOut");

  EXPECT_EQ(leavingMoveLog[1].tag, nodeBB_->getTag());
  EXPECT_EQ(leavingMoveLog[1].eventName, "topPointerLeave");

  EXPECT_EQ(leavingMoveLog[2].tag, nodeB_->getTag());
  EXPECT_EQ(leavingMoveLog[2].eventName, "topPointerLeave");

  EXPECT_EQ(leavingMoveLog[3].tag, rootNode_->getTag());
  EXPECT_EQ(leavingMoveLog[3].eventName, "topPointerLeave");
}

TEST_F(PointerEventsProcessorTest, directPress) {
  auto eventPayload = PointerEvent{};
  eventPayload.pointerId = 1;

  // Emulate down event from the platform onto nodeA
  auto downLog = dispatchPointerEvent(nodeA_, "topPointerDown", eventPayload);

  EXPECT_EQ(downLog.size(), 4);

  EXPECT_EQ(downLog[0].tag, nodeA_->getTag());
  EXPECT_EQ(downLog[0].eventName, "topPointerOver");

  EXPECT_EQ(downLog[1].tag, rootNode_->getTag());
  EXPECT_EQ(downLog[1].eventName, "topPointerEnter");

  EXPECT_EQ(downLog[2].tag, nodeA_->getTag());
  EXPECT_EQ(downLog[2].eventName, "topPointerEnter");

  EXPECT_EQ(downLog[3].tag, nodeA_->getTag());
  EXPECT_EQ(downLog[3].eventName, "topPointerDown");

  // Emulate an up event on nodeA
  auto upLog = dispatchPointerEvent(nodeA_, "topPointerUp", eventPayload);

  EXPECT_EQ(upLog.size(), 4);

  EXPECT_EQ(upLog[0].tag, nodeA_->getTag());
  EXPECT_EQ(upLog[0].eventName, "topPointerUp");

  EXPECT_EQ(upLog[1].tag, nodeA_->getTag());
  EXPECT_EQ(upLog[1].eventName, "topPointerOut");

  EXPECT_EQ(upLog[2].tag, nodeA_->getTag());
  EXPECT_EQ(upLog[2].eventName, "topPointerLeave");

  EXPECT_EQ(upLog[3].tag, rootNode_->getTag());
  EXPECT_EQ(upLog[3].eventName, "topPointerLeave");
}

TEST_F(PointerEventsProcessorTest, indirectPress) {
  auto eventPayload = PointerEvent{};
  eventPayload.pointerId = 1;

  // Emulate a move event before the press event sequence
  auto moveLog = dispatchPointerEvent(nodeA_, "topPointerMove", eventPayload);

  EXPECT_EQ(moveLog.size(), 4);

  EXPECT_EQ(moveLog[0].tag, nodeA_->getTag());
  EXPECT_EQ(moveLog[0].eventName, "topPointerOver");

  EXPECT_EQ(moveLog[1].tag, rootNode_->getTag());
  EXPECT_EQ(moveLog[1].eventName, "topPointerEnter");

  EXPECT_EQ(moveLog[2].tag, nodeA_->getTag());
  EXPECT_EQ(moveLog[2].eventName, "topPointerEnter");

  EXPECT_EQ(moveLog[3].tag, nodeA_->getTag());
  EXPECT_EQ(moveLog[3].eventName, "topPointerMove");

  // Emulate a down event from the platform onto nodeA
  auto downLog = dispatchPointerEvent(nodeA_, "topPointerDown", eventPayload);

  EXPECT_EQ(downLog.size(), 1);

  EXPECT_EQ(downLog[0].tag, nodeA_->getTag());
  EXPECT_EQ(downLog[0].eventName, "topPointerDown");

  // Emulate an up event on nodeA
  auto upLog = dispatchPointerEvent(nodeA_, "topPointerUp", eventPayload);

  EXPECT_EQ(upLog.size(), 1);

  EXPECT_EQ(upLog[0].tag, nodeA_->getTag());
  EXPECT_EQ(upLog[0].eventName, "topPointerUp");
}

} // namespace facebook::react
