/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTTextInputComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/iostextinput/TextInputProps.h>
#import <react/renderer/components/iostextinput/TextInputShadowNode.h>
#import <react/renderer/core/RawProps.h>
#import <react/renderer/core/RawPropsParser.h>

#if TARGET_OS_IOS

using namespace facebook::react;

static Props::Shared makeNumberPadProps(folly::dynamic rawPropsValue = folly::dynamic::object())
{
  rawPropsValue["keyboardType"] = "number-pad";

  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto rawProps = RawProps(rawPropsValue);
  auto parser = RawPropsParser();
  parser.prepare<TextInputProps>();
  rawProps.parse(parser);

  return std::make_shared<const TextInputProps>(parserContext, TextInputProps{}, rawProps);
}

static Props::Shared makeLabelledNumberPadProps()
{
  return makeNumberPadProps(folly::dynamic::object("inputAccessoryViewButtonLabel", "Next"));
}

static UIView<RCTBackedTextInputViewProtocol> *backedTextInputView(RCTTextInputComponentView *view)
{
  return [view valueForKey:@"_backedTextInputView"];
}

static NSString *accessoryButtonTitle(RCTTextInputComponentView *view)
{
  UIToolbar *toolbar = (UIToolbar *)backedTextInputView(view).inputAccessoryView;
  return toolbar.items.lastObject.title;
}

@interface RCTTextInputComponentViewTests : XCTestCase
@end

@implementation RCTTextInputComponentViewTests

- (void)testUnsetButtonLabelAddsNoAccessoryViewOnRecycledView
{
  RCTTextInputComponentView *view = [RCTTextInputComponentView new];
  [view updateProps:makeLabelledNumberPadProps() oldProps:TextInputShadowNode::defaultSharedProps()];
  XCTAssertEqualObjects(accessoryButtonTitle(view), @"Next");

  [view prepareForRecycle];
  [view updateProps:makeNumberPadProps() oldProps:nullptr];

  XCTAssertNil(backedTextInputView(view).inputAccessoryViewButtonLabel);
  XCTAssertNil(backedTextInputView(view).inputAccessoryView);
}

- (void)testUnsetButtonLabelFallsBackToReturnKeyOnRecycledView
{
  RCTTextInputComponentView *view = [RCTTextInputComponentView new];
  [view updateProps:makeLabelledNumberPadProps() oldProps:TextInputShadowNode::defaultSharedProps()];
  [view prepareForRecycle];

  [view updateProps:makeNumberPadProps(folly::dynamic::object("returnKeyType", "done")) oldProps:nullptr];

  XCTAssertEqualObjects(accessoryButtonTitle(view), @"Done");
}

- (void)testButtonLabelIsKeptOnRecycledView
{
  RCTTextInputComponentView *view = [RCTTextInputComponentView new];
  [view updateProps:makeLabelledNumberPadProps() oldProps:TextInputShadowNode::defaultSharedProps()];
  [view prepareForRecycle];

  [view updateProps:makeLabelledNumberPadProps() oldProps:nullptr];

  XCTAssertEqualObjects(accessoryButtonTitle(view), @"Next");
}

- (void)testRemovingButtonLabelRemovesAccessoryView
{
  RCTTextInputComponentView *view = [RCTTextInputComponentView new];
  auto labelledProps = makeLabelledNumberPadProps();
  [view updateProps:labelledProps oldProps:TextInputShadowNode::defaultSharedProps()];
  XCTAssertNotNil(backedTextInputView(view).inputAccessoryView);

  [view updateProps:makeNumberPadProps() oldProps:labelledProps];

  XCTAssertNil(backedTextInputView(view).inputAccessoryView);
}

@end

#endif
