/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <react/renderer/attributedstring/AttributedString.h>
#import <react/renderer/attributedstring/ParagraphAttributes.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>
#import <react/renderer/textlayoutmanager/RCTTextLayoutManager.h>

using namespace facebook::react;

static const RCTTextDataDetectorTypes kAllTypes =
    RCTTextDataDetectorTypePhoneNumber | RCTTextDataDetectorTypeLink | RCTTextDataDetectorTypeEmail;

static AttributedString RCTAttributedStringWithText(const std::string &text)
{
  auto fragment = AttributedString::Fragment{};
  fragment.string = text;
  fragment.textAttributes.fontSize = 14;
  auto attributedString = AttributedString{};
  attributedString.appendFragment(std::move(fragment));
  return attributedString;
}

@interface RCTTextDataDetectorTests : XCTestCase
@end

@implementation RCTTextDataDetectorTests {
  RCTTextLayoutManager *_layoutManager;
}

- (void)setUp
{
  [super setUp];
  _layoutManager = [RCTTextLayoutManager new];
}

// Returns the URL that each detected link opens when tapped in the middle.
- (NSArray<NSString *> *)_URLsInText:(const std::string &)text
                               types:(RCTTextDataDetectorTypes)types
                               frame:(CGRect)frame
                 paragraphAttributes:(ParagraphAttributes)paragraphAttributes
{
  auto attributedString = RCTAttributedStringWithText(text);
  NSMutableArray<NSString *> *urls = [NSMutableArray new];
  [_layoutManager getRectWithAttributedString:attributedString
                          paragraphAttributes:paragraphAttributes
                            dataDetectorTypes:types
                           enumerateAttribute:RCTTextAttributesAccessibilityRoleAttributeName
                                        frame:frame
                                   usingBlock:^(CGRect fragmentRect, NSString *fragmentText, NSString *value) {
                                     CGPoint point = CGPointMake(
                                         frame.origin.x + CGRectGetMidX(fragmentRect),
                                         frame.origin.y + CGRectGetMidY(fragmentRect));
                                     NSURL *url =
                                         [self->_layoutManager detectedURLWithAttributedString:attributedString
                                                                           paragraphAttributes:paragraphAttributes
                                                                             dataDetectorTypes:types
                                                                                         frame:frame
                                                                                       atPoint:point];
                                     [urls addObject:url.absoluteString ?: @"nil"];
                                   }];
  return urls;
}

- (NSArray<NSString *> *)_URLsInText:(const std::string &)text types:(RCTTextDataDetectorTypes)types
{
  return [self _URLsInText:text types:types frame:CGRectMake(0, 0, 1000, 200) paragraphAttributes:{}];
}

- (void)testDetectsOnlyTheRequestedTypes
{
  std::string text = "Call 123-123-1234 or see https://example.com or mail a@example.com";
  XCTAssertEqualObjects([self _URLsInText:text types:RCTTextDataDetectorTypeNone], @[]);
  XCTAssertEqualObjects([self _URLsInText:text types:RCTTextDataDetectorTypePhoneNumber], @[ @"tel:1231231234" ]);
  XCTAssertEqualObjects([self _URLsInText:text types:RCTTextDataDetectorTypeLink], @[ @"https://example.com" ]);
  XCTAssertEqualObjects([self _URLsInText:text types:RCTTextDataDetectorTypeEmail], @[ @"mailto:a@example.com" ]);
  NSArray<NSString *> *expected = @[ @"tel:1231231234", @"https://example.com", @"mailto:a@example.com" ];
  XCTAssertEqualObjects([self _URLsInText:text types:kAllTypes], expected);
}

- (void)testPhoneExtensionIsNotDialedAsPartOfTheNumber
{
  XCTAssertEqualObjects(
      [self _URLsInText:"Call 123-123-1234 ext. 55 today" types:RCTTextDataDetectorTypePhoneNumber],
      @[ @"tel:1231231234" ]);
}

- (void)testOtherSchemesAreNotLinks
{
  std::string text = "myapp://path file:///etc/hosts ssh://user@example.com";
  XCTAssertEqualObjects([self _URLsInText:text types:RCTTextDataDetectorTypeLink], @[]);
  XCTAssertEqualObjects([self _URLsInText:text types:kAllTypes], @[]);
}

- (void)testPointsAreRelativeToTheFrame
{
  auto attributedString = RCTAttributedStringWithText("https://example.com");
  ParagraphAttributes paragraphAttributes;
  CGRect frame = CGRectMake(40, 40, 300, 100);
  XCTAssertNotNil([_layoutManager detectedURLWithAttributedString:attributedString
                                              paragraphAttributes:paragraphAttributes
                                                dataDetectorTypes:RCTTextDataDetectorTypeLink
                                                            frame:frame
                                                          atPoint:CGPointMake(50, 45)]);
  // Inside the text if the frame were at the origin, but in the padding here.
  XCTAssertNil([_layoutManager detectedURLWithAttributedString:attributedString
                                           paragraphAttributes:paragraphAttributes
                                             dataDetectorTypes:RCTTextDataDetectorTypeLink
                                                         frame:frame
                                                       atPoint:CGPointMake(10, 5)]);
  // Past the end of the text.
  XCTAssertNil([_layoutManager detectedURLWithAttributedString:attributedString
                                           paragraphAttributes:paragraphAttributes
                                             dataDetectorTypes:RCTTextDataDetectorTypeLink
                                                         frame:frame
                                                       atPoint:CGPointMake(330, 45)]);
}

- (void)testLinksHiddenByTruncationAreNotReported
{
  ParagraphAttributes paragraphAttributes;
  paragraphAttributes.maximumNumberOfLines = 1;
  paragraphAttributes.ellipsizeMode = EllipsizeMode::Tail;
  std::string text = "https://first.example.com and a long run of words that will not fit https://hidden.example.com";
  NSArray<NSString *> *urls = [self _URLsInText:text
                                          types:RCTTextDataDetectorTypeLink
                                          frame:CGRectMake(0, 0, 300, 20)
                            paragraphAttributes:paragraphAttributes];
  XCTAssertEqualObjects(urls, @[ @"https://first.example.com" ]);
}

@end
