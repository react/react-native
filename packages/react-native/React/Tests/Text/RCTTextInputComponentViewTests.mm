/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBackedTextInputDelegate.h>
#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTTextInputComponentView.h>
#import <React/RCTTextInputUtils.h>
#import <React/RCTUITextField.h>
#import <React/RCTUITextView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/iostextinput/TextInputShadowNode.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>

#if TARGET_OS_IOS

using namespace facebook::react;

// Types `text` at the selection one key (composed character sequence) at a time, as UIKit does: asks the delegate
// (-textInputShouldChangeText:inRange:, which sends onKeyPress and applies maxLength), puts the text it allows in
// place of the selection with the typing attributes, moves the caret after it and reports the change.
static void
RCTTestTypeKeys(UIView<RCTBackedTextInputViewProtocol> *input, NSString *text, void (^setText)(NSAttributedString *))
{
  [text enumerateSubstringsInRange:NSMakeRange(0, text.length)
                           options:NSStringEnumerationByComposedCharacterSequences
                        usingBlock:^(NSString *key, NSRange, NSRange, BOOL *) {
                          UITextRange *selection = input.selectedTextRange;
                          NSInteger start = [input offsetFromPosition:input.beginningOfDocument
                                                           toPosition:selection.start];
                          NSInteger end = [input offsetFromPosition:input.beginningOfDocument toPosition:selection.end];
                          NSRange range = NSMakeRange(start, end - start);
                          NSString *allowed = [input.textInputDelegate textInputShouldChangeText:key inRange:range];
                          if (allowed == nil) {
                            return;
                          }
                          NSMutableAttributedString *typed = [input.attributedText mutableCopy];
                          [typed replaceCharactersInRange:range
                                     withAttributedString:[[NSAttributedString alloc]
                                                              initWithString:allowed
                                                                  attributes:input.typingAttributes]];
                          setText(typed);
                          UITextPosition *caret = [input positionFromPosition:input.beginningOfDocument
                                                                       offset:start + allowed.length];
                          [input setSelectedTextRange:[input textRangeFromPosition:caret toPosition:caret]
                                       notifyDelegate:NO];
                          [input.textInputDelegate textInputDidChange];
                        }];
}

// Like UIKit, delivers the keys queued behind -setAttributedText: inside it: before the new text is assigned (a text
// field), or after (a text view can).
static void RCTTestSetAttributedText(
    UIView<RCTBackedTextInputViewProtocol> *input,
    NSAttributedString *attributedText,
    NSString *keys,
    BOOL keysArriveAfterAssignment,
    void (^setText)(NSAttributedString *))
{
  if (keys != nil && !keysArriveAfterAssignment) {
    RCTTestTypeKeys(input, keys, setText);
  }
  setText(attributedText);
  if (keys != nil && keysArriveAfterAssignment) {
    RCTTestTypeKeys(input, keys, setText);
  }
}

@protocol RCTTestKeysDuringWrite <RCTBackedTextInputViewProtocol>
@property (nonatomic, copy, nullable) NSString *keysDuringNextWrite;
@property (nonatomic, assign) BOOL keysArriveAfterAssignment;
@property (nonatomic, assign) NSUInteger writeCount;
@end

@interface RCTKeysDuringWriteTextField : RCTUITextField <RCTTestKeysDuringWrite>
@end

@implementation RCTKeysDuringWriteTextField

@synthesize keysDuringNextWrite = _keysDuringNextWrite;
@synthesize keysArriveAfterAssignment = _keysArriveAfterAssignment;
@synthesize writeCount = _writeCount;

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  NSString *keys = self.keysDuringNextWrite;
  self.keysDuringNextWrite = nil;
  self.writeCount++;
  RCTTestSetAttributedText(self, attributedText, keys, self.keysArriveAfterAssignment, ^(NSAttributedString *text) {
    [super setAttributedText:text];
  });
}

@end

@interface RCTKeysDuringWriteTextView : RCTUITextView <RCTTestKeysDuringWrite>
@end

@implementation RCTKeysDuringWriteTextView

@synthesize keysDuringNextWrite = _keysDuringNextWrite;
@synthesize keysArriveAfterAssignment = _keysArriveAfterAssignment;
@synthesize writeCount = _writeCount;

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  NSString *keys = self.keysDuringNextWrite;
  self.keysDuringNextWrite = nil;
  self.writeCount++;
  RCTTestSetAttributedText(self, attributedText, keys, self.keysArriveAfterAssignment, ^(NSAttributedString *text) {
    [super setAttributedText:text];
  });
}

@end

// The paragraph style UIKit gives text typed into a text field whose text attributes set none.
static NSParagraphStyle *RCTTestUIKitParagraphStyle(void)
{
  NSMutableParagraphStyle *style = [NSParagraphStyle.defaultParagraphStyle mutableCopy];
  style.lineBreakMode = NSLineBreakByTruncatingTail;
  style.baseWritingDirection = NSWritingDirectionLeftToRight;
  return style;
}

static NSAttributedString *RCTTestStyled(NSString *text, UIColor *color)
{
  return [[NSAttributedString alloc] initWithString:text
                                         attributes:@{
                                           NSFontAttributeName : [UIFont boldSystemFontOfSize:16],
                                           NSForegroundColorAttributeName : color,
                                         }];
}

@interface RCTTextInputComponentViewTests : XCTestCase
@end

@implementation RCTTextInputComponentViewTests {
  UIWindow *_window;
  RCTTextInputComponentView *_view;
  UIView<RCTTestKeysDuringWrite> *_input;
  State::Shared _state;
}

- (void)tearDown
{
  [_input resignFirstResponder];
  _window.hidden = YES;
  _window = nil;
  _view = nil;
  _input = nil;
  _state = nullptr;
  [super tearDown];
}

// A focused TextInput whose backed text input delivers keys during writes, with an empty state from JS.
- (void)makeInputMultiline:(BOOL)multiline maxLength:(int)maxLength
{
  _window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 320, 480)];
  _view = [[RCTTextInputComponentView alloc] initWithFrame:CGRectMake(0, 0, 300, 80)];
  auto props = std::make_shared<TextInputProps>();
  props->multiline = multiline;
  if (maxLength > 0) {
    props->maxLength = maxLength;
  }
  [_view updateProps:props oldProps:nullptr];

  UIView<RCTBackedTextInputViewProtocol> *original = [_view valueForKey:@"_backedTextInputView"];
  _input = multiline ? [[RCTKeysDuringWriteTextView alloc] initWithFrame:original.frame]
                     : [[RCTKeysDuringWriteTextField alloc] initWithFrame:original.frame];
  RCTCopyBackedTextInput(original, _input);
  _input.textInputDelegate = (id<RCTBackedTextInputDelegate>)_view;
  [original removeFromSuperview];
  [_view setValue:_input forKey:@"_backedTextInputView"];
  [_view addSubview:_input];

  [_window addSubview:_view];
  [_window makeKeyAndVisible];
  [self sendStateFromJS:[NSAttributedString new]];
  [_input becomeFirstResponder];
  _input.writeCount = 0;
}

- (void)typeKeys:(NSString *)keys
{
  UIView<RCTTestKeysDuringWrite> *input = _input;
  NSUInteger writes = input.writeCount;
  RCTTestTypeKeys(input, keys, ^(NSAttributedString *text) {
    input.attributedText = text;
  });
  input.writeCount = writes;
}

// Sets the input's text without telling anyone, as UIKit adjusts the attributes of the text it shows.
- (void)setTextQuietly:(NSAttributedString *)text
{
  NSUInteger writes = _input.writeCount;
  _input.attributedText = text;
  _input.writeCount = writes;
}

// Commits a state as Fabric does: the text JS holds, with the view's current event count.
- (void)sendStateFromJS:(NSAttributedString *)text
{
  NSNumber *eventCount = [_view valueForKey:@"_mostRecentEventCount"];
  auto data = TextInputState{};
  data.attributedStringBox = RCTAttributedStringBoxFromNSAttributedString(text);
  data.mostRecentEventCount = eventCount.longLongValue;
  State::Shared state = std::make_shared<const TextInputShadowNode::ConcreteState>(
      std::make_shared<const TextInputState>(std::move(data)), ShadowNodeFamily::Weak{});
  [_view updateState:state oldState:_state];
  _state = state;
}

// Keys queued while a state is committed arrive inside the write if there is one, or after it.
- (void)sendStateFromJS:(NSAttributedString *)text whileTyping:(NSString *)keys
{
  _input.keysDuringNextWrite = keys;
  [self sendStateFromJS:text];
  if (_input.keysDuringNextWrite != nil) {
    _input.keysDuringNextWrite = nil;
    [self typeKeys:keys];
  }
}

- (NSAttributedString *)textWithDefaultAttributes:(NSString *)text
{
  NSMutableDictionary<NSAttributedStringKey, id> *attributes = [_input.defaultTextAttributes mutableCopy];
  [attributes removeObjectForKey:RCTAttributedStringEventEmitterKey];
  return [[NSAttributedString alloc] initWithString:text attributes:attributes];
}

- (NSAttributedString *)textWithDefaultAttributes:(NSString *)text paragraphStyle:(NSParagraphStyle *)paragraphStyle
{
  NSMutableAttributedString *styled = [[self textWithDefaultAttributes:text] mutableCopy];
  [styled addAttribute:NSParagraphStyleAttributeName value:paragraphStyle range:NSMakeRange(0, styled.length)];
  return styled;
}

#pragma mark - States that change nothing the field shows

- (void)testControlledValueEqualToTheTypedTextIsNotWrittenWhileKeysArrive
{
  // A controlled `value` equal to what was typed: the state is built from props, without the paragraph style and the
  // event emitter UIKit gave the typed text.
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"p"];
  NSMutableAttributedString *shown = [_input.attributedText mutableCopy];
  [shown addAttribute:NSParagraphStyleAttributeName value:RCTTestUIKitParagraphStyle() range:NSMakeRange(0, 1)];
  [self setTextQuietly:shown];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"p"] whileTyping:@"ri"];

  XCTAssertEqualObjects(_input.attributedText.string, @"pri");
  XCTAssertEqual(_input.writeCount, 0u);
}

- (void)testFirstCharacterWithTheInputsDefaultAttributesIsNotWrittenWhileKeysArrive
{
  // UIKit gives the first character typed into an empty field the field's default attributes (here a background
  // color) after it reached JS; the state, built from props, does not have them.
  [self makeInputMultiline:NO maxLength:0];
  NSMutableDictionary<NSAttributedStringKey, id> *defaults = [_input.defaultTextAttributes mutableCopy];
  defaults[NSFontAttributeName] = [UIFont systemFontOfSize:20];
  NSAttributedString *state = [[NSAttributedString alloc] initWithString:@"/" attributes:defaults];
  defaults[NSBackgroundColorAttributeName] = UIColor.clearColor;
  _input.defaultTextAttributes = defaults;
  [self typeKeys:@"/"];
  NSMutableDictionary<NSAttributedStringKey, id> *shown = [defaults mutableCopy];
  shown[NSParagraphStyleAttributeName] = RCTTestUIKitParagraphStyle();
  [self setTextQuietly:[[NSAttributedString alloc] initWithString:@"/" attributes:shown]];

  [self sendStateFromJS:state whileTyping:@"pr"];

  XCTAssertEqualObjects(_input.attributedText.string, @"/pr");
  XCTAssertEqual(_input.writeCount, 0u);
}

- (void)testSingleLineStateWithALineHeightIsNotWrittenWhileKeysArrive
{
  // `lineHeight` on a single-line input: a text field shows the text without the line height, with its own writing
  // direction and line break mode.
  [self makeInputMultiline:NO maxLength:0];
  NSMutableParagraphStyle *stateStyle = [NSMutableParagraphStyle new];
  stateStyle.minimumLineHeight = 26;
  stateStyle.maximumLineHeight = 26;
  NSMutableParagraphStyle *shownStyle = [RCTTestUIKitParagraphStyle() mutableCopy];
  [self typeKeys:@"p"];
  [self setTextQuietly:[self textWithDefaultAttributes:@"p" paragraphStyle:shownStyle]];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"p" paragraphStyle:stateStyle] whileTyping:@"ri"];

  XCTAssertEqualObjects(_input.attributedText.string, @"pri");
  XCTAssertEqual(_input.writeCount, 0u);
}

- (void)testStateWithoutAParagraphStyleIsNotWrittenOverUIKitsInitialTypingParagraphStyle
{
  // After a write (a nested <Text> restyle), UIKit can show typed text with the paragraph style of its initial typing
  // attributes (another line break strategy than the default one). A state without a paragraph style is the same text.
  [self makeInputMultiline:NO maxLength:0];
  NSParagraphStyle *typingStyle =
      [[_view valueForKey:@"_originalTypingAttributes"] objectForKey:NSParagraphStyleAttributeName];
  XCTAssertNotNil(typingStyle);
  [self typeKeys:@"p"];
  NSMutableAttributedString *shown = [RCTTestStyled(@"p", UIColor.blueColor) mutableCopy];
  [shown addAttribute:NSParagraphStyleAttributeName value:typingStyle range:NSMakeRange(0, 1)];
  [self setTextQuietly:shown];

  [self sendStateFromJS:RCTTestStyled(@"p", UIColor.blueColor) whileTyping:@"ri"];

  XCTAssertEqualObjects(_input.attributedText.string, @"pri");
  XCTAssertEqual(_input.writeCount, 0u);
}

#pragma mark - States that change what the field shows

- (void)testMultilineStateWithAnotherLineHeightIsWritten
{
  [self makeInputMultiline:YES maxLength:0];
  NSMutableParagraphStyle *style = [NSMutableParagraphStyle new];
  style.minimumLineHeight = 26;
  style.maximumLineHeight = 26;
  [self setTextQuietly:[self textWithDefaultAttributes:@"abc" paragraphStyle:style]];
  NSMutableParagraphStyle *taller = [style mutableCopy];
  taller.minimumLineHeight = 30;
  taller.maximumLineHeight = 30;

  [self sendStateFromJS:[self textWithDefaultAttributes:@"abc" paragraphStyle:taller]];

  NSParagraphStyle *shown = [_input.attributedText attribute:NSParagraphStyleAttributeName
                                                     atIndex:0
                                              effectiveRange:NULL];
  XCTAssertEqual(shown.minimumLineHeight, 30);
}

- (void)testMultilineStateWithAnotherLineBreakModeIsWritten
{
  // `lineBreakModeIOS` changed by JS: a text view's -setDefaultTextAttributes: only sets the typing attributes, so the
  // text it shows gets the new mode from the state.
  [self makeInputMultiline:YES maxLength:0];
  NSMutableParagraphStyle *wordWrapping = [NSMutableParagraphStyle new];
  wordWrapping.lineBreakMode = NSLineBreakByWordWrapping;
  NSMutableParagraphStyle *charWrapping = [NSMutableParagraphStyle new];
  charWrapping.lineBreakMode = NSLineBreakByCharWrapping;
  [self setTextQuietly:[self textWithDefaultAttributes:@"abc def" paragraphStyle:wordWrapping]];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"abc def" paragraphStyle:charWrapping]];

  NSParagraphStyle *shown = [_input.attributedText attribute:NSParagraphStyleAttributeName
                                                     atIndex:0
                                              effectiveRange:NULL];
  XCTAssertEqual(shown.lineBreakMode, NSLineBreakByCharWrapping);
}

- (void)testStateThatRestylesTheTextIsWritten
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];
  NSMutableAttributedString *restyled = [[self textWithDefaultAttributes:@"abc"] mutableCopy];
  [restyled addAttribute:NSForegroundColorAttributeName value:UIColor.redColor range:NSMakeRange(0, 3)];

  [self sendStateFromJS:restyled];

  XCTAssertEqualObjects(
      [_input.attributedText attribute:NSForegroundColorAttributeName atIndex:0 effectiveRange:NULL], UIColor.redColor);
}

- (void)testStateWithOtherTextIsWritten
{
  [self makeInputMultiline:NO maxLength:0];
  [self typeKeys:@"abc"];

  [self sendStateFromJS:[self textWithDefaultAttributes:@"ABC"]];

  XCTAssertEqualObjects(_input.attributedText.string, @"ABC");
}

@end

#endif
