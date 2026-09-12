/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <MobileCoreServices/UTCoreTypes.h>
#import <XCTest/XCTest.h>

#import <React/RCTParagraphComponentView.h>

#import <react/renderer/components/text/ParagraphComponentDescriptor.h>
#import <react/renderer/components/text/ParagraphProps.h>
#import <react/renderer/components/text/ParagraphShadowNode.h>
#import <react/renderer/components/text/ParagraphState.h>
#import <react/renderer/graphics/Color.h>
#import <react/renderer/textlayoutmanager/TextLayoutManager.h>
#import <react/utils/ContextContainer.h>

using namespace facebook::react;

/*
 * Covers `<Text selectable>` on iOS. Selection is provided by a `UITextView`
 * that lays the paragraph out but never paints it, while
 * `RCTParagraphComponentView` keeps drawing the glyphs. These tests hold that
 * split in place, and hold the paragraph unchanged when it is not selectable.
 */
@interface RCTParagraphSelectionTests : XCTestCase
@end

@implementation RCTParagraphSelectionTests {
  std::shared_ptr<const TextLayoutManager> _textLayoutManager;
}

- (void)setUp
{
  [super setUp];
  _textLayoutManager = std::make_shared<const TextLayoutManager>(std::make_shared<const ContextContainer>());
}

#pragma mark - Fixtures

/*
 * A paragraph that paints everything UIKit cannot: a colour, a wavy underline,
 * a strikethrough and a shadow.
 */
- (AttributedString)decoratedAttributedString
{
  auto textAttributes = TextAttributes{};
  textAttributes.foregroundColor = colorFromRGBA(255, 0, 0, 255);
  textAttributes.fontSize = 20;
  textAttributes.textDecorationLineType = TextDecorationLineType::UnderlineStrikethrough;
  textAttributes.textDecorationStyle = TextDecorationStyle::Wavy;

  auto fragment = AttributedString::Fragment{};
  fragment.string = "Selectable wavy decoration";
  fragment.textAttributes = textAttributes;

  auto attributedString = AttributedString{};
  attributedString.appendFragment(std::move(fragment));
  return attributedString;
}

- (ParagraphShadowNode::ConcreteState::Shared)stateWithAttributedString:(AttributedString)attributedString
{
  auto stateData = ParagraphState{};
  stateData.attributedString = std::move(attributedString);
  stateData.paragraphAttributes = ParagraphAttributes{};
  stateData.layoutManager = _textLayoutManager;

  return std::make_shared<const ParagraphShadowNode::ConcreteState>(
      std::make_shared<const ParagraphState>(std::move(stateData)), ShadowNodeFamily::Weak{});
}

- (Props::Shared)propsWithSelectable:(BOOL)selectable
{
  auto props = std::make_shared<ParagraphProps>();
  props->isSelectable = selectable;
  return props;
}

/*
 * Builds a laid-out paragraph view. `layoutIfNeeded` is what creates or removes
 * the selection text view, so every test needs it.
 */
- (RCTParagraphComponentView *)paragraphViewSelectable:(BOOL)selectable
{
  RCTParagraphComponentView *view = [RCTParagraphComponentView new];
  view.frame = CGRectMake(0, 0, 320, 100);

  [view updateProps:[self propsWithSelectable:selectable] oldProps:nullptr];
  [view updateState:[self stateWithAttributedString:[self decoratedAttributedString]] oldState:nil];

  auto layoutMetrics = LayoutMetrics{};
  layoutMetrics.frame = facebook::react::Rect{facebook::react::Point{0, 0}, facebook::react::Size{320, 100}};
  [view updateLayoutMetrics:layoutMetrics oldLayoutMetrics:{}];

  [view layoutIfNeeded];
  return view;
}

- (UITextView *)selectionTextViewIn:(UIView *)view
{
  for (UIView *subview in view.subviews) {
    if ([subview isKindOfClass:[UITextView class]]) {
      return (UITextView *)subview;
    }
  }
  return nil;
}

#pragma mark - The paragraph keeps drawing itself

/*
 * The first version of selection hid the drawn paragraph and let the text view
 * paint instead. That lost wavy decorations, compressed line heights and the
 * pressed highlight of a nested pressable <Text>.
 */
- (void)testDrawnParagraphStaysVisibleWhileSelectable
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];

  XCTAssertNotNil(view.contentView, @"The paragraph must keep its drawing view.");
  XCTAssertFalse(view.contentView.hidden, @"The drawn paragraph must stay visible, or its effects are lost.");
}

- (void)testSelectionTextViewSitsBelowTheDrawnParagraph
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  UITextView *selectionTextView = [self selectionTextViewIn:view];

  XCTAssertNotNil(selectionTextView, @"A selectable paragraph must have a selection text view.");

  NSUInteger selectionIndex = [view.subviews indexOfObject:selectionTextView];
  NSUInteger drawnIndex = [view.subviews indexOfObject:view.contentView];

  XCTAssertNotEqual(selectionIndex, NSNotFound);
  XCTAssertNotEqual(drawnIndex, NSNotFound);
  XCTAssertLessThan(selectionIndex, drawnIndex, @"UIKit paints the selection, and the glyphs must go on top of it.");
}

/*
 * The text view must lay the glyphs out, because that is what places the
 * selection rects, and must paint none of them.
 */
- (void)testSelectionTextViewLaysOutButDoesNotPaint
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  UITextView *selectionTextView = [self selectionTextViewIn:view];
  XCTAssertNotNil(selectionTextView);

  NSAttributedString *laidOut = selectionTextView.textStorage;
  XCTAssertGreaterThan(laidOut.length, 0u);

  NSRange range = NSMakeRange(0, laidOut.length);
  [laidOut enumerateAttributesInRange:range
                              options:0
                           usingBlock:^(NSDictionary<NSAttributedStringKey, id> *attributes, NSRange r, BOOL *stop) {
                             // Painting attributes are gone.
                             UIColor *foreground = attributes[NSForegroundColorAttributeName];
                             XCTAssertEqualObjects(foreground, UIColor.clearColor, @"Text must not be painted twice.");
                             XCTAssertNil(attributes[NSUnderlineStyleAttributeName]);
                             XCTAssertNil(attributes[NSStrikethroughStyleAttributeName]);
                             XCTAssertNil(attributes[NSShadowAttributeName]);

                             // Layout attributes stay, or the selection rects move.
                             XCTAssertNotNil(attributes[NSFontAttributeName], @"The font places the glyphs.");
                           }];
}

/*
 * `copy:` maps the selected range onto the painted string. That only works if
 * stripping the paint leaves the characters alone.
 */
- (void)testStrippedTextKeepsTheSameCharacters
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  UITextView *selectionTextView = [self selectionTextViewIn:view];
  XCTAssertNotNil(selectionTextView);

  XCTAssertEqualObjects(
      selectionTextView.textStorage.string,
      view.attributedText.string,
      @"Stripping the paint must not change a single character.");
}

#pragma mark - Copying

/*
 * Before selection existed, `copy:` wrote the whole paragraph as rich text and
 * as plain text. It must still write rich text, and the rich text must carry
 * the colour the user sees rather than the clear colour used for layout.
 */
- (void)testCopyWritesPaintedRichTextForTheSelectedRange
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  UITextView *selectionTextView = [self selectionTextViewIn:view];
  XCTAssertNotNil(selectionTextView);

  UIPasteboard *pasteboard = UIPasteboard.generalPasteboard;
  pasteboard.items = @[];

  NSRange selectedRange = NSMakeRange(0, 10); // "Selectable"
  selectionTextView.selectedRange = selectedRange;
  [selectionTextView copy:nil];

  NSString *expected = [view.attributedText.string substringWithRange:selectedRange];
  XCTAssertEqualObjects(pasteboard.string, expected, @"Copy must copy the selected range, not the whole paragraph.");

  NSData *rtf = [pasteboard dataForPasteboardType:(id)kUTTypeFlatRTFD];
  XCTAssertNotNil(rtf, @"Copy must still put rich text on the pasteboard.");

  NSAttributedString *pasted = [[NSAttributedString alloc] initWithData:rtf
                                                                options:@{}
                                                     documentAttributes:nil
                                                                  error:nil];
  XCTAssertEqualObjects(pasted.string, expected);

  // The decisive check. The text view lays out a copy with the foreground set to
  // the clear colour, so a paste that came from the text view's own storage
  // would be invisible. The pasted colour must be the painted one.
  NSAttributedString *paintedSelection = [view.attributedText attributedSubstringFromRange:selectedRange];
  UIColor *paintedColor = [paintedSelection attribute:NSForegroundColorAttributeName atIndex:0 effectiveRange:NULL];
  UIColor *pastedColor = [pasted attribute:NSForegroundColorAttributeName atIndex:0 effectiveRange:NULL];
  XCTAssertNotNil(paintedColor);
  XCTAssertNotNil(pastedColor);

  CGFloat paintedRed = 0, paintedAlpha = 0, pastedRed = 0, pastedAlpha = 0;
  [paintedColor getRed:&paintedRed green:NULL blue:NULL alpha:&paintedAlpha];
  [pastedColor getRed:&pastedRed green:NULL blue:NULL alpha:&pastedAlpha];

  XCTAssertEqualWithAccuracy(pastedRed, paintedRed, 0.01, @"Copied text must carry the colour the reader sees.");
  XCTAssertEqualWithAccuracy(pastedAlpha, paintedAlpha, 0.01, @"Copied text must not be the clear layout copy.");
  XCTAssertGreaterThan(pastedAlpha, 0.0, @"Copied text must be visible when pasted.");
}

#pragma mark - Paragraphs that are not selectable

/*
 * Everything in this change sits behind `isSelectable`. A paragraph without it
 * must be exactly what it was.
 */
- (void)testNonSelectableParagraphHasNoSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:NO];

  XCTAssertNil([self selectionTextViewIn:view], @"A paragraph that is not selectable must gain no extra view.");
  XCTAssertFalse(view.contentView.hidden);
}

- (void)testTurningSelectableOffRemovesTheSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  XCTAssertNotNil([self selectionTextViewIn:view]);

  [view updateProps:[self propsWithSelectable:NO] oldProps:[self propsWithSelectable:YES]];
  [view layoutIfNeeded];

  XCTAssertNil([self selectionTextViewIn:view], @"Turning selection off must remove the text view.");
  XCTAssertFalse(view.contentView.hidden, @"The paragraph must still draw itself.");
}

- (void)testTurningSelectableBackOnRestoresTheSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];

  [view updateProps:[self propsWithSelectable:NO] oldProps:[self propsWithSelectable:YES]];
  [view layoutIfNeeded];
  XCTAssertNil([self selectionTextViewIn:view]);

  [view updateProps:[self propsWithSelectable:YES] oldProps:[self propsWithSelectable:NO]];
  [view layoutIfNeeded];

  XCTAssertNotNil([self selectionTextViewIn:view], @"Turning selection on again must rebuild the text view.");
}

#pragma mark - Recycling

/*
 * Views are pooled and reused. A recycled paragraph must not carry the previous
 * paragraph's selection into its next life.
 */
- (void)testRecyclingRemovesTheSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  XCTAssertNotNil([self selectionTextViewIn:view]);

  [view prepareForRecycle];

  XCTAssertNil([self selectionTextViewIn:view], @"A recycled paragraph must not keep a selection text view.");
}

#pragma mark - Accessibility

/*
 * <Paragraph> publishes one accessibility element per link through
 * `RCTParagraphComponentAccessibilityProvider`. The selection text view must
 * stay out of that tree, or VoiceOver reads the paragraph twice.
 */
- (void)testSelectionTextViewIsHiddenFromAccessibility
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  UITextView *selectionTextView = [self selectionTextViewIn:view];

  XCTAssertNotNil(selectionTextView);
  XCTAssertTrue(selectionTextView.accessibilityElementsHidden, @"The text view must not be read by VoiceOver.");
}

@end
