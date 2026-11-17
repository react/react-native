/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTTextInputComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/attributedstring/AttributedString.h>
#import <react/renderer/attributedstring/AttributedStringBox.h>
#import <react/renderer/attributedstring/ParagraphAttributes.h>
#import <react/renderer/attributedstring/TextAttributes.h>
#import <react/renderer/components/iostextinput/TextInputShadowNode.h>
#import <react/renderer/components/textinput/TextInputState.h>

using namespace facebook::react;

#if TARGET_OS_IOS

static State::Shared RCTMakeTextInputState(NSString *wordFontFamily, const char *endText = " end")
{
  auto baseAttributes = TextAttributes::defaultTextAttributes();
  baseAttributes.fontSize = 18;
  auto wordAttributes = baseAttributes;
  wordAttributes.fontFamily = wordFontFamily.UTF8String;

  AttributedString attributedString;
  attributedString.appendFragment({.string = "plain ", .textAttributes = baseAttributes, .parentShadowView = {}});
  attributedString.appendFragment({.string = "word", .textAttributes = wordAttributes, .parentShadowView = {}});
  attributedString.appendFragment({.string = endText, .textAttributes = baseAttributes, .parentShadowView = {}});
  attributedString.setBaseTextAttributes(baseAttributes);

  auto data = std::make_shared<const TextInputState>(
      AttributedStringBox{attributedString}, attributedString, ParagraphAttributes{}, 0);
  return std::make_shared<const TextInputShadowNode::ConcreteState>(data, ShadowNodeFamily::Weak{});
}

static UITraitCollection *RCTOtherContentSizeTraitCollection(void)
{
  UIContentSizeCategory current = UITraitCollection.currentTraitCollection.preferredContentSizeCategory;
  UIContentSizeCategory other = [current isEqualToString:UIContentSizeCategoryExtraSmall]
      ? UIContentSizeCategoryAccessibilityExtraExtraExtraLarge
      : UIContentSizeCategoryExtraSmall;
  return [UITraitCollection traitCollectionWithPreferredContentSizeCategory:other];
}

static NSString *RCTFontFamilyAtIndex(UITextField *textField, NSUInteger index)
{
  UIFont *font = [textField.attributedText attribute:NSFontAttributeName atIndex:index effectiveRange:NULL];
  return font.familyName;
}

static BOOL RCTHasOriginalFont(UITextField *textField)
{
  __block BOOL hasOriginalFont = NO;
  [textField.attributedText enumerateAttribute:@"NSOriginalFont"
                                       inRange:NSMakeRange(0, textField.attributedText.length)
                                       options:0
                                    usingBlock:^(id value, NSRange range, BOOL *stop) {
                                      if (value) {
                                        hasOriginalFont = YES;
                                        *stop = YES;
                                      }
                                    }];
  return hasOriginalFont;
}

@interface RCTTextInputComponentViewTests : XCTestCase
@end

@implementation RCTTextInputComponentViewTests

- (void)testContentSizeChangeKeepsNestedTextAttributesInSingleLineInput
{
  RCTTextInputComponentView *view = [[RCTTextInputComponentView alloc] initWithFrame:CGRectMake(0, 0, 200, 40)];
  UITextField *textField = (UITextField *)view.subviews.firstObject;
  XCTAssertTrue([textField isKindOfClass:[UITextField class]]);
  [view updateState:RCTMakeTextInputState(@"Courier") oldState:nullptr];
  XCTAssertEqualObjects(RCTFontFamilyAtIndex(textField, 6), @"Courier");

  [view traitCollectionDidChange:RCTOtherContentSizeTraitCollection()];

  XCTAssertEqualObjects(textField.attributedText.string, @"plain word end");
  XCTAssertEqualObjects(RCTFontFamilyAtIndex(textField, 6), @"Courier");
  XCTAssertNotEqualObjects(RCTFontFamilyAtIndex(textField, 0), @"Courier");
}

- (void)testContentSizeChangeKeepsNestedTextAttributesWithEmoji
{
  RCTTextInputComponentView *view = [[RCTTextInputComponentView alloc] initWithFrame:CGRectMake(0, 0, 200, 40)];
  UITextField *textField = (UITextField *)view.subviews.firstObject;
  [view updateState:RCTMakeTextInputState(@"Courier", " end \xF0\x9F\x98\x80") oldState:nullptr];
  XCTAssertEqualObjects(RCTFontFamilyAtIndex(textField, 6), @"Courier");
  // UIKit draws the emoji with a fallback font and keeps the font it replaced in NSOriginalFont.
  XCTAssertTrue(RCTHasOriginalFont(textField));

  [view traitCollectionDidChange:RCTOtherContentSizeTraitCollection()];

  XCTAssertEqualObjects(textField.attributedText.string, @"plain word end \U0001F600");
  XCTAssertEqualObjects(RCTFontFamilyAtIndex(textField, 6), @"Courier");
  XCTAssertNotEqualObjects(RCTFontFamilyAtIndex(textField, 0), @"Courier");
}

- (void)testContentSizeChangeDoesNotReplaceTextThatDiffersFromState
{
  RCTTextInputComponentView *view = [[RCTTextInputComponentView alloc] initWithFrame:CGRectMake(0, 0, 200, 40)];
  UITextField *textField = (UITextField *)view.subviews.firstObject;
  [view updateState:RCTMakeTextInputState(@"Courier") oldState:nullptr];
  textField.text = @"typed";

  [view traitCollectionDidChange:RCTOtherContentSizeTraitCollection()];

  XCTAssertEqualObjects(textField.attributedText.string, @"typed");
}

@end

#endif
