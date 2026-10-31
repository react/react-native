/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/components/root/RootComponentDescriptor.h>
#include <react/renderer/components/safeareaview/SafeAreaViewComponentDescriptor.h>
#include <react/renderer/components/safeareaview/SafeAreaViewShadowNode.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/element/ComponentBuilder.h>
#include <react/renderer/element/Element.h>

namespace facebook::react {

namespace {

ComponentBuilder safeAreaComponentBuilder() {
  ComponentDescriptorProviderRegistry registry{};
  auto eventDispatcher = EventDispatcher::Shared{};
  auto componentDescriptorRegistry = registry.createComponentDescriptorRegistry(
      ComponentDescriptorParameters{
          .eventDispatcher = eventDispatcher,
          .contextContainer = nullptr,
          .flavor = nullptr});

  registry.add(concreteComponentDescriptorProvider<RootComponentDescriptor>());
  registry.add(concreteComponentDescriptorProvider<ViewComponentDescriptor>());
  registry.add(
      concreteComponentDescriptorProvider<SafeAreaViewComponentDescriptor>());

  return ComponentBuilder{componentDescriptorRegistry};
}

// Builds a 200x200 root containing a single 200x200 <SafeAreaView> with the
// given edges/mode props and the given insets seeded into its state, lays it
// out, and returns the SafeAreaView's resolved content insets (== padding when
// there is no border).
EdgeInsets layoutSafeAreaView(
    const std::function<void(SafeAreaViewProps&)>& configureProps,
    EdgeInsets insets) {
  auto builder = safeAreaComponentBuilder();
  std::shared_ptr<RootShadowNode> rootShadowNode;
  std::shared_ptr<SafeAreaViewShadowNode> safeAreaViewShadowNode;

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .reference(rootShadowNode)
        .tag(1)
        .props([] {
          auto sharedProps = std::make_shared<RootProps>();
          auto& props = *sharedProps;
          props.layoutConstraints = LayoutConstraints{
              .minimumSize = {.width = 0, .height = 0},
              .maximumSize = {.width = 200, .height = 200}};
          auto& yogaStyle = props.yogaStyle;
          yogaStyle.setDimension(
              yoga::Dimension::Width, yoga::StyleSizeLength::points(200));
          yogaStyle.setDimension(
              yoga::Dimension::Height, yoga::StyleSizeLength::points(200));
          return sharedProps;
        })
        .children({
          Element<SafeAreaViewShadowNode>()
            .reference(safeAreaViewShadowNode)
            .tag(2)
            .props([&configureProps] {
              auto sharedProps = std::make_shared<SafeAreaViewProps>();
              auto& props = *sharedProps;
              props.edges.top = "additive";
              props.edges.right = "additive";
              props.edges.bottom = "additive";
              props.edges.left = "additive";
              props.mode = SafeAreaViewMode::Padding;
              auto& yogaStyle = props.yogaStyle;
              yogaStyle.setDimension(
                  yoga::Dimension::Width, yoga::StyleSizeLength::points(200));
              yogaStyle.setDimension(
                  yoga::Dimension::Height, yoga::StyleSizeLength::points(200));
              configureProps(props);
              return sharedProps;
            })
            .stateData([insets](SafeAreaViewState& data) {
              data.padding = insets;
            })
        });
  // clang-format on

  builder.build(element);

  rootShadowNode->layoutIfNeeded();
  rootShadowNode->sealRecursive();

  return safeAreaViewShadowNode->getLayoutMetrics().contentInsets;
}

} // namespace

TEST(SafeAreaViewTest, additiveEdgesApplyInsetsAsPadding) {
  auto contentInsets = layoutSafeAreaView(
      [](SafeAreaViewProps&) {},
      EdgeInsets{.left = 1, .top = 44, .right = 2, .bottom = 34});

  EXPECT_EQ(contentInsets.top, 44);
  EXPECT_EQ(contentInsets.right, 2);
  EXPECT_EQ(contentInsets.bottom, 34);
  EXPECT_EQ(contentInsets.left, 1);
}

TEST(SafeAreaViewTest, offEdgeIsNotInset) {
  auto contentInsets = layoutSafeAreaView(
      [](SafeAreaViewProps& props) { props.edges.top = "off"; },
      EdgeInsets{.left = 1, .top = 44, .right = 2, .bottom = 34});

  // `top` is off, so it keeps the (zero) base padding; the rest are additive.
  EXPECT_EQ(contentInsets.top, 0);
  EXPECT_EQ(contentInsets.right, 2);
  EXPECT_EQ(contentInsets.bottom, 34);
  EXPECT_EQ(contentInsets.left, 1);
}

TEST(SafeAreaViewTest, maximumEdgeUsesLargerOfInsetAndBasePadding) {
  auto contentInsets = layoutSafeAreaView(
      [](SafeAreaViewProps& props) {
        props.edges.top = "maximum";
        props.edges.bottom = "maximum";
        // Base padding larger than the inset on top, smaller on bottom.
        props.yogaStyle.setPadding(
            yoga::Edge::Top, yoga::StyleLength::points(100));
        props.yogaStyle.setPadding(
            yoga::Edge::Bottom, yoga::StyleLength::points(0));
      },
      EdgeInsets{.left = 0, .top = 44, .right = 0, .bottom = 34});

  EXPECT_EQ(contentInsets.top, 100); // max(44, 100)
  EXPECT_EQ(contentInsets.bottom, 34); // max(34, 0)
}

} // namespace facebook::react
