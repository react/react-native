/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponentViewFactory.h>
#import <React/RCTParagraphComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/root/RootShadowNode.h>
#import <react/renderer/components/text/ParagraphShadowNode.h>
#import <react/renderer/components/text/RawTextShadowNode.h>
#import <react/renderer/components/text/SelectableParagraphShadowNode.h>
#import <react/renderer/components/text/TextShadowNode.h>
#import <react/renderer/element/ComponentBuilder.h>
#import <react/renderer/element/Element.h>

using facebook::react::AccessibilityRole;
using facebook::react::ComponentBuilder;
using facebook::react::Element;
using facebook::react::ParagraphProps;
using facebook::react::ParagraphShadowNode;
using facebook::react::RawTextProps;
using facebook::react::RawTextShadowNode;
using facebook::react::RootProps;
using facebook::react::RootShadowNode;
using facebook::react::SelectableParagraphShadowNode;
using facebook::react::TextProps;
using facebook::react::TextShadowNode;

@interface RCTSelectableParagraphComponentViewTests : XCTestCase
@end

@implementation RCTSelectableParagraphComponentViewTests

- (void)checkParagraphWithName:(const std::string &)name selectable:(BOOL)selectable
{
  auto factory = [RCTComponentViewFactory currentComponentViewFactory];
  auto registry = [factory createComponentDescriptorRegistryWithParameters:{.eventDispatcher = {},
                                                                            .contextContainer = nullptr,
                                                                            .flavor = nullptr}];
  const auto &descriptor = registry->at(name);
  auto view = [factory createComponentViewWithComponentHandle:descriptor.getComponentHandle()].view;
  XCTAssertTrue([view isKindOfClass:RCTParagraphComponentView.class]);
  if (![view isKindOfClass:RCTParagraphComponentView.class]) {
    return;
  }

  auto paragraphProps = std::make_shared<ParagraphProps>();
  paragraphProps->accessible = true;
  paragraphProps->isSelectable = selectable;
  paragraphProps->yogaStyle.setDimension(
      facebook::yoga::Dimension::Width, facebook::yoga::StyleSizeLength::points(200));
  auto textProps = std::make_shared<TextProps>();
  textProps->textAttributes.accessibilityRole = AccessibilityRole::Link;
  auto rawTextProps = std::make_shared<RawTextProps>();
  rawTextProps->text = "Selectable paragraph link";
  auto text = Element<TextShadowNode>().props(textProps).children({Element<RawTextShadowNode>().props(rawTextProps)});
  auto rootProps = std::make_shared<RootProps>();
  rootProps->layoutConstraints = {
      .minimumSize = {.width = 0, .height = 0}, .maximumSize = {.width = 200, .height = 200}};
  ComponentBuilder builder{registry};
  std::shared_ptr<ParagraphShadowNode> paragraph;
  std::shared_ptr<RootShadowNode> root;
  if (selectable) {
    std::shared_ptr<SelectableParagraphShadowNode> selectableParagraph;
    builder.build(
        Element<RootShadowNode>().reference(root).props(rootProps).children({Element<SelectableParagraphShadowNode>()
                                                                                 .reference(selectableParagraph)
                                                                                 .props(paragraphProps)
                                                                                 .children({text})}));
    paragraph = selectableParagraph;
  } else {
    builder.build(
        Element<RootShadowNode>().reference(root).props(rootProps).children(
            {Element<ParagraphShadowNode>().reference(paragraph).props(paragraphProps).children({text})}));
  }
  root->layoutIfNeeded();
  [view updateProps:paragraph->getProps() oldProps:nullptr];
  [view updateEventEmitter:paragraph->getEventEmitter()];
  [view updateState:paragraph->getState() oldState:nullptr];
  [view updateLayoutMetrics:paragraph->getLayoutMetrics() oldLayoutMetrics:{}];
  [view finalizeUpdates:RNComponentViewUpdateMaskAll];
  auto paragraphView = (RCTParagraphComponentView *)view;

  XCTAssertEqualObjects(paragraphView.attributedText.string, @"Selectable paragraph link");
  XCTAssertGreaterThan(paragraphView.bounds.size.height, 0);
  XCTAssertEqualObjects(paragraphView.accessibilityLabel, @"Selectable paragraph link");
  NSArray<UIAccessibilityElement *> *elements = paragraphView.accessibilityElements;
  XCTAssertEqual(elements.count, 1);
  XCTAssertTrue(elements.firstObject.accessibilityTraits & UIAccessibilityTraitLink);
  XCTAssertEqual([paragraphView canBecomeFirstResponder], selectable);
  XCTAssertEqual([paragraphView canPerformAction:@selector(copy:) withSender:nil], selectable);
  XCTAssertEqual(
      [paragraphView touchEventEmitterAtPoint:CGPointMake(1000, 1000)].get(), paragraph->getEventEmitter().get());

  auto nonSelectableProps = std::make_shared<ParagraphProps>(*paragraphProps);
  nonSelectableProps->isSelectable = false;
  [view updateProps:nonSelectableProps oldProps:paragraphProps];
  XCTAssertFalse([paragraphView canBecomeFirstResponder]);
  [view prepareForRecycle];
  XCTAssertNil(paragraphView.attributedText);
  XCTAssertEqual(paragraphView.accessibilityElements.count, 0);
}

- (void)testOrdinaryParagraphPreservesText
{
  [self checkParagraphWithName:"RCTText" selectable:NO];
}

- (void)testSelectableParagraphPreservesTextAndSelection
{
  [self checkParagraphWithName:"RCTSelectableText" selectable:YES];
}

@end
