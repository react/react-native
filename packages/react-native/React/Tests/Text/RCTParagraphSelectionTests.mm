/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <MobileCoreServices/UTCoreTypes.h>
#import <XCTest/XCTest.h>

#import <React/RCTParagraphComponentView.h>

#import <React/RCTTouchableComponentViewProtocol.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>
#import <react/renderer/components/text/ParagraphComponentDescriptor.h>
#import <react/renderer/components/text/ParagraphProps.h>
#import <react/renderer/components/text/ParagraphShadowNode.h>
#import <react/renderer/components/text/ParagraphState.h>
#import <react/renderer/components/text/TextShadowNode.h>
#import <react/renderer/components/view/TouchEventEmitter.h>
#import <react/renderer/core/EventDispatcher.h>
#import <react/renderer/graphics/Color.h>
#import <react/renderer/textlayoutmanager/TextLayoutManager.h>
#import <react/utils/ContextContainer.h>

using namespace facebook::react;

class RCTParagraphSelectionFeatureFlags : public ReactNativeFeatureFlagsDefaults {
 public:
  explicit RCTParagraphSelectionFeatureFlags(bool partialTextSelection) : partialTextSelection_(partialTextSelection) {}

  bool enableIOSPartialTextSelection() override
  {
    return partialTextSelection_;
  }

 private:
  bool partialTextSelection_;
};

@interface RCTParagraphComponentView (RCTParagraphSelectionTests)

- (void)updateSelectableTextViewWithDrawingFrame:(CGRect)drawingFrame;

@end

/*
 * A paragraph view that counts the updates of its selection text view.
 */
@interface RCTParagraphSelectionCountingView : RCTParagraphComponentView

@property (nonatomic) NSUInteger selectionTextViewUpdateCount;

@end

@implementation RCTParagraphSelectionCountingView

- (void)updateSelectableTextViewWithDrawingFrame:(CGRect)drawingFrame
{
  self.selectionTextViewUpdateCount++;
  [super updateSelectableTextViewWithDrawingFrame:drawingFrame];
}

@end

/*
 * A native parent with an edit-menu action of its own.
 */
@interface RCTParagraphSelectionMenuParent : UIView

- (void)customMenuAction:(id)sender;

@end

@implementation RCTParagraphSelectionMenuParent

- (void)customMenuAction:(id)sender
{
}

@end

/*
 * Covers `<Text selectable>` on iOS. Selection is provided by a `UITextView`
 * that lays the paragraph out but never paints it, while
 * `RCTParagraphComponentView` keeps drawing the glyphs. These tests hold that
 * split in place, and hold the paragraph unchanged when it is not selectable.
 *
 * Partial selection is behind `enableIOSPartialTextSelection`. `setUp` turns
 * the flag on. The tests under "With the flag off" turn it off, and hold the
 * paragraph to the long-press menu that copies the whole text.
 */
@interface RCTParagraphSelectionTests : XCTestCase
@end

@implementation RCTParagraphSelectionTests {
  std::shared_ptr<const TextLayoutManager> _textLayoutManager;
}

- (void)setUp
{
  [super setUp];
  [self setPartialTextSelectionEnabled:YES];
  _textLayoutManager = std::make_shared<const TextLayoutManager>(std::make_shared<const ContextContainer>());
}

- (void)tearDown
{
  ReactNativeFeatureFlags::dangerouslyReset();
  [super tearDown];
}

/*
 * Call this before the test creates a paragraph view. The view reads the flag
 * on every change of `selectable`, on recycling and on every frame update, so
 * a view that sees both values is half in each mode.
 */
- (void)setPartialTextSelectionEnabled:(BOOL)enabled
{
  ReactNativeFeatureFlags::dangerouslyForceOverride(std::make_unique<RCTParagraphSelectionFeatureFlags>(enabled));
}

#pragma mark - Fixtures

/*
 * A paragraph that paints everything UIKit cannot: a colour, a wavy underline,
 * a strikethrough and a shadow.
 */
- (AttributedString)decoratedAttributedString
{
  return [self decoratedAttributedStringHighlighted:NO];
}

- (AttributedString)decoratedAttributedStringHighlighted:(BOOL)highlighted
{
  auto textAttributes = TextAttributes{};
  textAttributes.foregroundColor = colorFromRGBA(255, 0, 0, 255);
  textAttributes.fontSize = 20;
  textAttributes.textDecorationLineType = TextDecorationLineType::UnderlineStrikethrough;
  textAttributes.textDecorationStyle = TextDecorationStyle::Wavy;
  if (highlighted) {
    textAttributes.isHighlighted = true;
  }

  auto fragment = AttributedString::Fragment{};
  fragment.string = "Selectable wavy decoration";
  fragment.textAttributes = textAttributes;

  auto attributedString = AttributedString{};
  attributedString.appendFragment(std::move(fragment));
  return attributedString;
}

/*
 * A paragraph that paints with the attributes UIKit itself knows: a solid
 * underline and strikethrough, a shadow and a background. `RCTAttributedTextUtils`
 * maps these to the native attribute names, which the wavy fixture above never
 * sets.
 */
- (AttributedString)nativelyPaintedAttributedString
{
  auto textAttributes = TextAttributes{};
  textAttributes.foregroundColor = colorFromRGBA(255, 0, 0, 255);
  textAttributes.backgroundColor = colorFromRGBA(255, 255, 0, 255);
  textAttributes.fontSize = 20;
  textAttributes.textDecorationLineType = TextDecorationLineType::UnderlineStrikethrough;
  textAttributes.textDecorationStyle = TextDecorationStyle::Solid;
  textAttributes.textShadowOffset = facebook::react::Size{2, 2};
  textAttributes.textShadowRadius = 3;
  textAttributes.textShadowColor = colorFromRGBA(0, 0, 255, 255);

  auto fragment = AttributedString::Fragment{};
  fragment.string = "Selectable solid decoration";
  fragment.textAttributes = textAttributes;

  auto attributedString = AttributedString{};
  attributedString.appendFragment(std::move(fragment));
  return attributedString;
}

/*
 * A paragraph whose single fragment carries a touch emitter, which is how a
 * nested pressable <Text> reaches `touchEventEmitterAtPoint:`.
 */
- (AttributedString)attributedStringWithEventEmitter:(std::shared_ptr<TouchEventEmitter>)eventEmitter
{
  auto textAttributes = TextAttributes{};
  textAttributes.fontSize = 20;

  auto fragment = AttributedString::Fragment{};
  fragment.string = "Selectable wavy decoration";
  fragment.textAttributes = textAttributes;
  fragment.parentShadowView.eventEmitter = eventEmitter;
  // The emitter only reaches the attributed string when the fragment names a
  // component, which is what marks it as a nested <Text> rather than raw text.
  fragment.parentShadowView.componentHandle = TextShadowNode::Handle();

  auto attributedString = AttributedString{};
  attributedString.appendFragment(std::move(fragment));
  return attributedString;
}

- (RCTParagraphComponentView *)paragraphViewWithEventEmitter:(std::shared_ptr<TouchEventEmitter>)eventEmitter
{
  RCTParagraphComponentView *view = [RCTParagraphComponentView new];
  view.frame = CGRectMake(0, 0, 320, 100);

  [view updateProps:[self propsWithSelectable:YES] oldProps:nullptr];
  [view updateState:[self stateWithAttributedString:[self attributedStringWithEventEmitter:eventEmitter]] oldState:nil];

  auto layoutMetrics = LayoutMetrics{};
  layoutMetrics.frame = facebook::react::Rect{facebook::react::Point{0, 0}, facebook::react::Size{320, 100}};
  [view updateLayoutMetrics:layoutMetrics oldLayoutMetrics:{}];

  [view finalizeUpdates:RNComponentViewUpdateMaskAll];
  return view;
}

- (AttributedString)attributedStringWithText:(std::string)text
{
  auto fragment = AttributedString::Fragment{};
  fragment.string = std::move(text);
  fragment.textAttributes = TextAttributes{};

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
  // The paragraph view lays out the text in this size, not in its frame. The
  // shadow node stores the content frame size here, and every test lays the
  // paragraph out at 320 x 100 with no padding.
  stateData.layoutSize = facebook::react::Size{320, 100};

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
 * A selectable paragraph that truncates to one line. Changing the ellipsize
 * mode changes only the props, and so computes no new frame.
 */
- (Props::Shared)selectablePropsWithEllipsizeMode:(EllipsizeMode)ellipsizeMode
{
  auto props = std::make_shared<ParagraphProps>();
  props->isSelectable = true;
  props->paragraphAttributes.maximumNumberOfLines = 1;
  props->paragraphAttributes.ellipsizeMode = ellipsizeMode;
  return props;
}

- (Props::Shared)selectablePropsWithPointerEvents:(PointerEventsMode)pointerEvents
{
  auto props = std::make_shared<ParagraphProps>();
  props->isSelectable = true;
  props->pointerEvents = pointerEvents;
  return props;
}

/*
 * Builds a paragraph view with the update calls that `RCTMountingManager` makes
 * for an insert. The view gets no event emitter and no parent. The selection
 * text view waits for the first touch; see `selectionTextViewAfterTouchIn:`.
 */
- (RCTParagraphComponentView *)paragraphViewSelectable:(BOOL)selectable
{
  return [self paragraphViewSelectable:selectable attributedString:[self decoratedAttributedString]];
}

- (RCTParagraphComponentView *)paragraphViewSelectable:(BOOL)selectable
                                      attributedString:(AttributedString)attributedString
{
  return [self paragraphViewWithProps:[self propsWithSelectable:selectable]
                     attributedString:std::move(attributedString)];
}

- (RCTParagraphComponentView *)paragraphViewWithProps:(Props::Shared)props
                                     attributedString:(AttributedString)attributedString
{
  RCTParagraphComponentView *view = [RCTParagraphComponentView new];
  view.frame = CGRectMake(0, 0, 320, 100);

  [view updateProps:props oldProps:nullptr];
  [view updateState:[self stateWithAttributedString:std::move(attributedString)] oldState:nil];

  auto layoutMetrics = LayoutMetrics{};
  layoutMetrics.frame = facebook::react::Rect{facebook::react::Point{0, 0}, facebook::react::Size{320, 100}};
  [view updateLayoutMetrics:layoutMetrics oldLayoutMetrics:{}];

  [view finalizeUpdates:RNComponentViewUpdateMaskAll];
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

/*
 * UIKit hit-tests the views under a finger before it delivers the touch, and
 * the paragraph builds its selection text view in that hit test.
 */
- (UITextView *)selectionTextViewAfterTouchIn:(RCTParagraphComponentView *)view
{
  [view hitTest:CGPointMake(20, 10) withEvent:nil];
  return [self selectionTextViewIn:view];
}

/*
 * An inline view, such as a <View> nested in a <Text>, inside the text frame.
 * The paragraph mounts it below the drawn glyphs, as it mounts every child.
 */
- (UIView *)mountInlineViewIn:(RCTParagraphComponentView *)view
{
  RCTViewComponentView *inlineView = [RCTViewComponentView new];
  inlineView.frame = CGRectMake(200, 40, 50, 30);
  [view mountChildComponentView:inlineView index:0];
  return inlineView;
}

- (UILongPressGestureRecognizer *)longPressRecognizerIn:(UIView *)view
{
  for (UIGestureRecognizer *recognizer in view.gestureRecognizers) {
    if ([recognizer isKindOfClass:[UILongPressGestureRecognizer class]]) {
      return (UILongPressGestureRecognizer *)recognizer;
    }
  }
  return nil;
}

- (UIEditMenuInteraction *)editMenuInteractionIn:(UIView *)view API_AVAILABLE(ios(16.0))
{
  for (id<UIInteraction> interaction in view.interactions) {
    if ([interaction isKindOfClass:[UIEditMenuInteraction class]]) {
      return (UIEditMenuInteraction *)interaction;
    }
  }
  return nil;
}

/*
 * Mounts a recycled view again with the update calls of an insert. The view
 * keeps its `_props`, and `prepareForRecycle` empties its layout metrics.
 */
- (void)mountRecycledView:(RCTParagraphComponentView *)view selectable:(BOOL)selectable text:(std::string)text
{
  [view updateProps:[self propsWithSelectable:selectable] oldProps:nullptr];
  [view updateState:[self stateWithAttributedString:[self attributedStringWithText:std::move(text)]] oldState:nil];

  auto layoutMetrics = LayoutMetrics{};
  layoutMetrics.frame = facebook::react::Rect{facebook::react::Point{0, 0}, facebook::react::Size{320, 100}};
  [view updateLayoutMetrics:layoutMetrics oldLayoutMetrics:EmptyLayoutMetrics];
  [view finalizeUpdates:RNComponentViewUpdateMaskAll];
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
  UITextView *selectionTextView = [self selectionTextViewAfterTouchIn:view];

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
  UITextView *selectionTextView = [self selectionTextViewAfterTouchIn:view];
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
 * The wavy fixture never sets the native underline, strikethrough and shadow
 * attributes, so a nil assertion on them proves nothing. This fixture sets all
 * of them, and the test first checks that the painted string holds them.
 */
- (void)testSelectionTextViewStripsTheNativePaintingAttributes
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES
                                                 attributedString:[self nativelyPaintedAttributedString]];
  UITextView *selectionTextView = [self selectionTextViewAfterTouchIn:view];
  XCTAssertNotNil(selectionTextView);

  NSAttributedString *painted = view.attributedText;
  NSAttributedString *laidOut = selectionTextView.textStorage;
  XCTAssertGreaterThan(painted.length, 0u);
  XCTAssertEqual(laidOut.length, painted.length);

  NSRange range = NSMakeRange(0, painted.length);
  [painted
      enumerateAttributesInRange:range
                         options:0
                      usingBlock:^(NSDictionary<NSAttributedStringKey, id> *attributes, NSRange r, BOOL *stop) {
                        XCTAssertNotEqualObjects(attributes[NSForegroundColorAttributeName], UIColor.clearColor);
                        XCTAssertNotEqualObjects(attributes[NSBackgroundColorAttributeName], UIColor.clearColor);
                        XCTAssertNotNil(attributes[NSBackgroundColorAttributeName]);
                        XCTAssertEqualObjects(attributes[NSUnderlineStyleAttributeName], @(NSUnderlineStyleSingle));
                        XCTAssertEqualObjects(attributes[NSStrikethroughStyleAttributeName], @(NSUnderlineStyleSingle));
                        NSShadow *shadow = attributes[NSShadowAttributeName];
                        XCTAssertNotNil(shadow, @"The fixture must paint a shadow, or the strip is not tested.");
                        XCTAssertEqual(shadow.shadowBlurRadius, 3);
                      }];

  UIFont *paintedFont = [painted attribute:NSFontAttributeName atIndex:0 effectiveRange:nil];
  [laidOut enumerateAttributesInRange:range
                              options:0
                           usingBlock:^(NSDictionary<NSAttributedStringKey, id> *attributes, NSRange r, BOOL *stop) {
                             XCTAssertEqualObjects(attributes[NSForegroundColorAttributeName], UIColor.clearColor);
                             XCTAssertEqualObjects(attributes[NSBackgroundColorAttributeName], UIColor.clearColor);
                             XCTAssertNil(attributes[NSUnderlineStyleAttributeName]);
                             XCTAssertNil(attributes[NSStrikethroughStyleAttributeName]);
                             XCTAssertNil(attributes[NSShadowAttributeName]);
                             XCTAssertEqualObjects(
                                 attributes[NSFontAttributeName], paintedFont, @"The font must survive the strip.");
                           }];
}

/*
 * `copy:` maps the selected range onto the painted string. That only works if
 * stripping the paint leaves the characters alone.
 */
- (void)testStrippedTextKeepsTheSameCharacters
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  UITextView *selectionTextView = [self selectionTextViewAfterTouchIn:view];
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
  UITextView *selectionTextView = [self selectionTextViewAfterTouchIn:view];
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

  XCTAssertNil(
      [self selectionTextViewAfterTouchIn:view], @"A paragraph that is not selectable must gain no extra view.");
  XCTAssertFalse(view.contentView.hidden);
}

- (void)testTurningSelectableOffRemovesTheSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  XCTAssertNotNil([self selectionTextViewAfterTouchIn:view]);

  [view updateProps:[self propsWithSelectable:NO] oldProps:[self propsWithSelectable:YES]];
  [view finalizeUpdates:RNComponentViewUpdateMaskProps];

  XCTAssertNil([self selectionTextViewAfterTouchIn:view], @"Turning selection off must remove the text view.");
  XCTAssertFalse(view.contentView.hidden, @"The paragraph must still draw itself.");
}

/*
 * A change of `selectable` alone is a props update, and `finalizeUpdates:`
 * computes no frames for it. The text view must still come back on the next
 * touch without a later change of the text or the layout.
 */
- (void)testTurningSelectableBackOnRestoresTheSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  XCTAssertNotNil([self selectionTextViewAfterTouchIn:view]);

  [view updateProps:[self propsWithSelectable:NO] oldProps:[self propsWithSelectable:YES]];
  [view finalizeUpdates:RNComponentViewUpdateMaskProps];
  XCTAssertNil([self selectionTextViewIn:view]);

  [view updateProps:[self propsWithSelectable:YES] oldProps:[self propsWithSelectable:NO]];
  [view finalizeUpdates:RNComponentViewUpdateMaskProps];

  XCTAssertNotNil(
      [self selectionTextViewAfterTouchIn:view], @"Turning selection on again must build the text view on a touch.");
}

/*
 * One mutation can turn `selectable` on and change the text. `updateProps:`
 * runs before `updateState:`, so a text view built there would hold the old
 * text.
 */
- (void)testTurningSelectableOnWithNewTextBuildsFromTheNewText
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:NO];

  [view updateProps:[self propsWithSelectable:YES] oldProps:[self propsWithSelectable:NO]];
  [view updateState:[self stateWithAttributedString:[self attributedStringWithText:"The new paragraph"]] oldState:nil];
  [view finalizeUpdates:RNComponentViewUpdateMaskProps | RNComponentViewUpdateMaskState];

  UITextView *selectionTextView = [self selectionTextViewAfterTouchIn:view];
  XCTAssertNotNil(selectionTextView);
  XCTAssertEqual(
      selectionTextView.textStorage.length,
      [@"The new paragraph" length],
      @"The text view must hold the text of the same mutation.");
}

/*
 * The text container is configured from the paragraph attributes: the line
 * limit, the ellipsize mode and the font scaling. A change of them alone is a
 * props-only update, which computes no new frame, so the rebuild check must
 * look at the attributes and `updateProps:` must schedule the update.
 */
- (void)testChangingEllipsizeModeRebuildsTheSelectionTextView
{
  RCTParagraphComponentView *view =
      [self paragraphViewWithProps:[self selectablePropsWithEllipsizeMode:EllipsizeMode::Head]
                  attributedString:[self decoratedAttributedString]];
  UITextView *before = [self selectionTextViewAfterTouchIn:view];
  XCTAssertNotNil(before);
  XCTAssertEqual(before.textContainer.lineBreakMode, NSLineBreakByTruncatingHead);

  [view updateProps:[self selectablePropsWithEllipsizeMode:EllipsizeMode::Tail]
           oldProps:[self selectablePropsWithEllipsizeMode:EllipsizeMode::Head]];
  [view finalizeUpdates:RNComponentViewUpdateMaskProps];

  UITextView *after = [self selectionTextViewIn:view];
  XCTAssertNotNil(after);
  XCTAssertNotEqual(after, before, @"A new ellipsize mode needs a new text container.");
  XCTAssertEqual(after.textContainer.lineBreakMode, NSLineBreakByTruncatingTail);
}

- (void)testPropsUpdateWithTheSameAttributesKeepsTheSelectionTextView
{
  RCTParagraphComponentView *view =
      [self paragraphViewWithProps:[self selectablePropsWithEllipsizeMode:EllipsizeMode::Tail]
                  attributedString:[self decoratedAttributedString]];
  UITextView *before = [self selectionTextViewAfterTouchIn:view];
  XCTAssertNotNil(before);

  [view updateProps:[self selectablePropsWithEllipsizeMode:EllipsizeMode::Tail]
           oldProps:[self selectablePropsWithEllipsizeMode:EllipsizeMode::Tail]];
  [view finalizeUpdates:RNComponentViewUpdateMaskProps];

  XCTAssertEqual([self selectionTextViewIn:view], before, @"Unchanged attributes must not rebuild the text view.");
}

#pragma mark - The text view waits for a touch

/*
 * Most selectable paragraphs are never selected. The text view and its TextKit
 * stack must cost nothing until a finger lands on the paragraph.
 */
- (void)testSelectableParagraphBuildsNoSelectionTextViewBeforeATouch
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  XCTAssertNil([self selectionTextViewIn:view], @"Mounting must not build the selection text view.");

  [view updateState:[self stateWithAttributedString:[self attributedStringWithText:"A different paragraph"]]
           oldState:nil];
  [view finalizeUpdates:RNComponentViewUpdateMaskState];
  XCTAssertNil([self selectionTextViewIn:view], @"An update before the first touch must not build it either.");

  UIView *hitView = [view hitTest:CGPointMake(20, 10) withEvent:nil];
  UITextView *selectionTextView = [self selectionTextViewIn:view];
  XCTAssertNotNil(selectionTextView, @"The first touch must build the selection text view.");
  XCTAssertTrue([hitView isDescendantOfView:selectionTextView], @"The touch that builds the text view must go to it.");
  XCTAssertEqual(selectionTextView.textStorage.length, [@"A different paragraph" length]);
}

/*
 * One mutation can change the props, the state and the layout of a paragraph
 * together. The text view must be updated once for the whole mutation, and not
 * once for each part of it.
 */
- (void)testOneMutationUpdatesTheSelectionTextViewOnce
{
  RCTParagraphSelectionCountingView *view = [RCTParagraphSelectionCountingView new];
  view.frame = CGRectMake(0, 0, 320, 100);
  [view updateProps:[self propsWithSelectable:YES] oldProps:nullptr];
  [view updateState:[self stateWithAttributedString:[self decoratedAttributedString]] oldState:nil];
  auto layoutMetrics = LayoutMetrics{};
  layoutMetrics.frame = facebook::react::Rect{facebook::react::Point{0, 0}, facebook::react::Size{320, 100}};
  [view updateLayoutMetrics:layoutMetrics oldLayoutMetrics:{}];
  [view finalizeUpdates:RNComponentViewUpdateMaskAll];
  XCTAssertEqual(view.selectionTextViewUpdateCount, 0u, @"Mounting must not update a text view that does not exist.");

  XCTAssertNotNil([self selectionTextViewAfterTouchIn:view]);
  [view hitTest:CGPointMake(20, 10) withEvent:nil];
  XCTAssertEqual(view.selectionTextViewUpdateCount, 1u, @"A second touch must not update the text view again.");

  [view updateProps:[self selectablePropsWithEllipsizeMode:EllipsizeMode::Tail]
           oldProps:[self propsWithSelectable:YES]];
  [view updateState:[self stateWithAttributedString:[self attributedStringWithText:"A different paragraph"]]
           oldState:nil];
  auto movedLayoutMetrics = layoutMetrics;
  movedLayoutMetrics.frame.origin = facebook::react::Point{0, 20};
  [view updateLayoutMetrics:movedLayoutMetrics oldLayoutMetrics:layoutMetrics];
  [view finalizeUpdates:RNComponentViewUpdateMaskAll];

  XCTAssertEqual(view.selectionTextViewUpdateCount, 2u, @"One mutation must update the text view once.");
}

/*
 * A relayout of unchanged text is the most frequent update of a paragraph. It
 * must keep the text view and must not convert the text again.
 */
- (void)testRelayoutOfUnchangedTextConvertsNoText
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  UITextView *before = [self selectionTextViewAfterTouchIn:view];
  XCTAssertNotNil(before);
  id convertedText = [before valueForKey:@"sourceAttributedText"];
  XCTAssertNotNil(convertedText);

  [view updateState:[self stateWithAttributedString:[self decoratedAttributedString]] oldState:nil];
  [view finalizeUpdates:RNComponentViewUpdateMaskState];

  XCTAssertEqual([self selectionTextViewIn:view], before);
  XCTAssertEqual(
      [before valueForKey:@"sourceAttributedText"], convertedText, @"Unchanged text must not be converted again.");
}

#pragma mark - Recycling

/*
 * Views are pooled and reused. A recycled paragraph must not carry the previous
 * paragraph's selection into its next life.
 */
- (void)testRecyclingRemovesTheSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  XCTAssertNotNil([self selectionTextViewAfterTouchIn:view]);

  [view prepareForRecycle];

  XCTAssertNil([self selectionTextViewIn:view], @"A recycled paragraph must not keep a selection text view.");
}

/*
 * A recycled view keeps the props of its last paragraph. When the next
 * paragraph is selectable too, `updateProps:` sees no change and re-enables
 * nothing, so the selection text view must be able to build itself from
 * scratch after `prepareForRecycle`.
 */
- (void)testRecycledParagraphBuildsAWorkingSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  [view prepareForRecycle];
  [self mountRecycledView:view selectable:YES text:"The next paragraph"];

  UITextView *selectionTextView = [self selectionTextViewAfterTouchIn:view];
  XCTAssertNotNil(selectionTextView, @"A recycled selectable paragraph must get a selection text view again.");
  XCTAssertEqual(
      selectionTextView.textStorage.length,
      [@"The next paragraph" length],
      @"The selection text view of a recycled paragraph must hold the new text.");
}

#pragma mark - A press must not rebuild the selection

/*
 * Pressing a nested pressable <Text> paints a highlight, which changes the
 * painted string but not the layout. Rebuilding the text view in the middle of
 * that touch destroys the long press that UIKit has already started, and the
 * paragraph never selects. Only a layout change may rebuild it.
 */
- (void)testHighlightOnlyUpdateKeepsTheSameSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  UITextView *before = [self selectionTextViewAfterTouchIn:view];
  XCTAssertNotNil(before);

  [view updateState:[self stateWithAttributedString:[self decoratedAttributedStringHighlighted:YES]] oldState:nil];
  [view finalizeUpdates:RNComponentViewUpdateMaskState];

  XCTAssertEqual(
      [self selectionTextViewIn:view], before, @"A pressed highlight must not rebuild the selection text view.");
}

/*
 * The cache must not go too far the other way: different text lays out
 * differently, so it has to produce a new text view.
 */
- (void)testTextChangeRebuildsTheSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  UITextView *before = [self selectionTextViewAfterTouchIn:view];
  XCTAssertNotNil(before);

  [view updateState:[self stateWithAttributedString:[self attributedStringWithText:"A different paragraph"]]
           oldState:nil];
  [view finalizeUpdates:RNComponentViewUpdateMaskState];

  UITextView *after = [self selectionTextViewIn:view];
  XCTAssertNotNil(after, @"A text view that exists must follow the text without a new touch.");
  XCTAssertNotEqual(after, before, @"New text must rebuild the selection text view.");
}

#pragma mark - A showing selection owns the touch

/*
 * A drag of a selection handle starts on the glyphs the handle sits on, which
 * is often a pressable <Text>. Delivering that touch presses the link, so
 * adjusting a selection follows it. While a selection shows, the paragraph
 * must hand out no event emitter at all.
 */
- (void)testShowingSelectionGivesNoEventEmitter
{
  auto eventEmitter = std::make_shared<TouchEventEmitter>(nullptr, EventDispatcher::Weak{});
  RCTParagraphComponentView *view = [self paragraphViewWithEventEmitter:eventEmitter];
  UITextView *selectionTextView = [self selectionTextViewAfterTouchIn:view];
  XCTAssertNotNil(selectionTextView);

  selectionTextView.selectedRange = NSMakeRange(0, 5);

  XCTAssertTrue(
      [(id<RCTTouchableComponentViewProtocol>)view touchEventEmitterAtPoint:CGPointMake(100, 10)] == nullptr,
      @"A touch that lands while a selection shows must not press the text under it.");
}

/*
 * The guard must not reach an ordinary tap. With nothing selected the pressable
 * fragment still gets its press.
 */
- (void)testWithoutASelectionThePressStillGoesThrough
{
  auto eventEmitter = std::make_shared<TouchEventEmitter>(nullptr, EventDispatcher::Weak{});
  RCTParagraphComponentView *view = [self paragraphViewWithEventEmitter:eventEmitter];
  UITextView *selectionTextView = [self selectionTextViewAfterTouchIn:view];
  XCTAssertNotNil(selectionTextView);

  selectionTextView.selectedRange = NSMakeRange(0, 0);

  XCTAssertEqual(
      (const void *)[(id<RCTTouchableComponentViewProtocol>)view touchEventEmitterAtPoint:CGPointMake(100, 10)].get(),
      (const void *)eventEmitter.get(),
      @"With nothing selected, a press must still reach the pressable text.");
}

#pragma mark - Inline views and pointerEvents

/*
 * The selection text view sits right below the glyphs, and so above the inline
 * views. A touch on an inline view must still reach it: before the text view
 * exists, after it exists, and after it is built again.
 */
- (void)testATouchOnAnInlineViewGoesToTheInlineView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  UIView *inlineView = [self mountInlineViewIn:view];
  CGPoint onInlineView = CGPointMake(225, 55);

  XCTAssertEqual([view hitTest:onInlineView withEvent:nil], inlineView);

  UITextView *selectionTextView = [self selectionTextViewAfterTouchIn:view];
  XCTAssertNotNil(selectionTextView);
  XCTAssertTrue(
      CGRectContainsPoint(selectionTextView.frame, onInlineView),
      @"The text view must cover the inline view, or this test proves nothing.");
  XCTAssertGreaterThan([view.subviews indexOfObject:selectionTextView], [view.subviews indexOfObject:inlineView]);
  XCTAssertEqual([view hitTest:onInlineView withEvent:nil], inlineView, @"The text view must not take the touch.");

  [view updateState:[self stateWithAttributedString:[self attributedStringWithText:"A different paragraph"]]
           oldState:nil];
  [view finalizeUpdates:RNComponentViewUpdateMaskState];
  XCTAssertNotEqual([self selectionTextViewIn:view], selectionTextView);
  XCTAssertEqual(
      [view hitTest:onInlineView withEvent:nil], inlineView, @"A rebuilt text view must not take the touch either.");
}

/*
 * With `pointerEvents="box-none"` the paragraph takes no touches, and only its
 * inline views do. The selection text view is a part of the paragraph.
 */
- (void)testBoxNoneParagraphTakesNoTouchOnTheText
{
  RCTParagraphComponentView *view =
      [self paragraphViewWithProps:[self selectablePropsWithPointerEvents:PointerEventsMode::BoxNone]
                  attributedString:[self decoratedAttributedString]];
  UIView *inlineView = [self mountInlineViewIn:view];

  XCTAssertNil([view hitTest:CGPointMake(20, 10) withEvent:nil]);
  XCTAssertNil([self selectionTextViewIn:view], @"A paragraph that takes no touch must not build the text view.");
  XCTAssertEqual([view hitTest:CGPointMake(225, 55) withEvent:nil], inlineView);
}

- (void)testSwitchingToBoxNoneTakesTheTouchesFromTheSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  UIView *inlineView = [self mountInlineViewIn:view];
  XCTAssertNotNil([self selectionTextViewAfterTouchIn:view]);

  [view updateProps:[self selectablePropsWithPointerEvents:PointerEventsMode::BoxNone]
           oldProps:[self propsWithSelectable:YES]];
  [view finalizeUpdates:RNComponentViewUpdateMaskProps];

  XCTAssertNil([view hitTest:CGPointMake(20, 10) withEvent:nil], @"The existing text view must not take the touch.");
  XCTAssertEqual([view hitTest:CGPointMake(225, 55) withEvent:nil], inlineView);
}

/*
 * With `pointerEvents="box-only"` the paragraph takes every touch, and its
 * inline views take none. Without the flag, the long press sits on the
 * paragraph itself, so the text can be selected in this mode. It still can.
 */
- (void)testBoxOnlyParagraphStillSelects
{
  RCTParagraphComponentView *view =
      [self paragraphViewWithProps:[self selectablePropsWithPointerEvents:PointerEventsMode::BoxOnly]
                  attributedString:[self decoratedAttributedString]];
  UIView *inlineView = [self mountInlineViewIn:view];

  UIView *hitView = [view hitTest:CGPointMake(20, 10) withEvent:nil];
  UITextView *selectionTextView = [self selectionTextViewIn:view];
  XCTAssertNotNil(selectionTextView);
  XCTAssertTrue([hitView isDescendantOfView:selectionTextView], @"The text must still be selectable.");

  UIView *inlineHitView = [view hitTest:CGPointMake(225, 55) withEvent:nil];
  XCTAssertNotNil(inlineHitView);
  XCTAssertFalse([inlineHitView isDescendantOfView:inlineView], @"An inline view must take no touch.");
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
  UITextView *selectionTextView = [self selectionTextViewAfterTouchIn:view];

  XCTAssertNotNil(selectionTextView);
  XCTAssertTrue(selectionTextView.accessibilityElementsHidden, @"The text view must not be read by VoiceOver.");
}

#pragma mark - The selection text view owns the edit menu

/*
 * The paragraph implements `copy:` for the long-press menu of the flag-off
 * path. With the flag on it must refuse `copy:`, or a copy that reaches it
 * copies the whole text instead of the selected range.
 */
- (void)testSelectableParagraphLeavesCopyToTheSelectionTextView
{
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];

  XCTAssertFalse(view.canBecomeFirstResponder, @"The selection text view owns the selection.");
  XCTAssertFalse([view canPerformAction:@selector(copy:) withSender:nil], @"Only the selection text view may copy.");
  XCTAssertNil([self longPressRecognizerIn:view], @"The long-press menu of the flag-off path must not exist.");
}

/*
 * UIKit looks for the target of an edit-menu action up the responder chain,
 * from the selection text view. A paragraph that answers for its parent stops
 * that walk and then gets an action that it cannot perform.
 */
- (void)testSelectableParagraphLeavesOtherActionsToItsParent
{
  RCTParagraphSelectionMenuParent *parent = [RCTParagraphSelectionMenuParent new];
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  [parent addSubview:view];

  XCTAssertTrue([parent canPerformAction:@selector(customMenuAction:) withSender:nil]);
  XCTAssertFalse(
      [view canPerformAction:@selector(customMenuAction:) withSender:nil],
      @"The paragraph must not answer for an action that only its parent performs.");
}

#pragma mark - With the flag off

/*
 * Without the flag, a selectable paragraph is what it was before partial
 * selection: no selection text view, and a long press that shows a menu to
 * copy the whole text.
 */
- (void)testFlagOffSelectableParagraphKeepsTheLongPressMenu
{
  [self setPartialTextSelectionEnabled:NO];
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];

  XCTAssertNil(
      [self selectionTextViewAfterTouchIn:view], @"Without the flag, a paragraph must gain no selection text view.");
  XCTAssertNotNil([self longPressRecognizerIn:view], @"Without the flag, a long press must show the menu.");
  if (@available(iOS 16.0, *)) {
    XCTAssertNotNil([self editMenuInteractionIn:view]);
  }
  XCTAssertTrue(view.canBecomeFirstResponder);
  XCTAssertTrue([view canPerformAction:@selector(copy:) withSender:nil], @"The menu copies the whole text.");
}

- (void)testFlagOffTurningSelectableOffRemovesTheLongPressMenu
{
  [self setPartialTextSelectionEnabled:NO];
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];

  [view updateProps:[self propsWithSelectable:NO] oldProps:[self propsWithSelectable:YES]];
  [view finalizeUpdates:RNComponentViewUpdateMaskProps];

  XCTAssertNil([self longPressRecognizerIn:view]);
  if (@available(iOS 16.0, *)) {
    XCTAssertNil([self editMenuInteractionIn:view]);
  }
  XCTAssertFalse(view.canBecomeFirstResponder);
}

/*
 * A recycled view keeps its props. When the next paragraph is selectable too,
 * `updateProps:` sees no change and does not add the long press again, so
 * recycling must not remove it.
 */
- (void)testFlagOffRecycledParagraphKeepsTheLongPressMenu
{
  [self setPartialTextSelectionEnabled:NO];
  RCTParagraphComponentView *view = [self paragraphViewSelectable:YES];
  [view prepareForRecycle];
  [self mountRecycledView:view selectable:YES text:"The next paragraph"];

  XCTAssertNotNil([self longPressRecognizerIn:view], @"A recycled selectable paragraph must keep its long press.");
  XCTAssertNil([self selectionTextViewAfterTouchIn:view]);
}

@end
