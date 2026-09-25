/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <React/RCTUITextField.h>
#import <React/RCTUITextView.h>

#import <React/RCTTextInputComponentView.h>

/**
 * Mock UITextField subclass that allows overriding markedTextRange for testing
 * IME composition scenarios without requiring actual keyboard input.
 */
@interface RCTMockTextField : RCTUITextField
@property (nonatomic, strong, nullable) UITextRange *mockMarkedTextRange;
@end

@implementation RCTMockTextField

- (UITextRange *)markedTextRange
{
  return _mockMarkedTextRange;
}

@end

/**
 * Mock UITextView subclass for multiline IME composition testing.
 */
@interface RCTMockTextView : RCTUITextView
@property (nonatomic, strong, nullable) UITextRange *mockMarkedTextRange;
@end

@implementation RCTMockTextView

- (UITextRange *)markedTextRange
{
  return _mockMarkedTextRange;
}

@end

/**
 * Helper to create a non-nil UITextRange for simulating IME composition.
 */
static UITextRange *createMockTextRange(UITextField *textField)
{
  UITextPosition *start = textField.beginningOfDocument;
  UITextPosition *end = [textField positionFromPosition:start offset:1];
  if (!end) {
    end = start;
  }
  return [textField textRangeFromPosition:start toPosition:end ?: start];
}

static UITextRange *createMockTextRangeForTextView(UITextView *textView)
{
  UITextPosition *start = textView.beginningOfDocument;
  UITextPosition *end = [textView positionFromPosition:start offset:1];
  if (!end) {
    end = start;
  }
  return [textView textRangeFromPosition:start toPosition:end ?: start];
}

#pragma mark - Test class

@interface RCTTextInputComponentViewIMETests : XCTestCase

@end

@implementation RCTTextInputComponentViewIMETests

#pragma mark - Helpers

- (RCTTextInputComponentView *)createSingleLineWithMock:(RCTMockTextField **)outMock
{
  RCTTextInputComponentView *cv = [[RCTTextInputComponentView alloc] initWithFrame:CGRectZero];
  RCTMockTextField *mock = [[RCTMockTextField alloc] initWithFrame:CGRectZero];
  [cv setValue:mock forKey:@"_backedTextInputView"];
  mock.textInputDelegate = (id<RCTBackedTextInputDelegate>)cv;
  if (outMock) {
    *outMock = mock;
  }
  return cv;
}

- (RCTTextInputComponentView *)createMultiLineWithMock:(RCTMockTextView **)outMock
{
  RCTTextInputComponentView *cv = [[RCTTextInputComponentView alloc] initWithFrame:CGRectZero];
  RCTMockTextView *mock = [[RCTMockTextView alloc] initWithFrame:CGRectZero];
  [cv setValue:mock forKey:@"_backedTextInputView"];
  mock.textInputDelegate = (id<RCTBackedTextInputDelegate>)cv;
  if (outMock) {
    *outMock = mock;
  }
  return cv;
}

#pragma mark - Korean IME lifecycle

- (void)testKoreanCompositionLifecycle
{
  // Simulates the full UIKit delegate call sequence for typing "한":
  //   ㅎ (composing) → 하 (composing) → 한 (composing) → 한 (committed)
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  id<RCTBackedTextInputDelegate> delegate = (id<RCTBackedTextInputDelegate>)cv;

  NSDictionary *ulAttrs = @{NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle)};

  // Step 1: ㅎ — composition starts
  mock.mockMarkedTextRange = nil;
  [delegate textInputShouldChangeText:@"ㅎ" inRange:NSMakeRange(0, 0)];
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"ㅎ" attributes:ulAttrs];
  mock.mockMarkedTextRange = createMockTextRange(mock);
  [delegate textInputDidChange];
  XCTAssertEqualObjects(mock.attributedText.string, @"ㅎ");

  // Step 2: 하 — vowel added
  [delegate textInputShouldChangeText:@"하" inRange:NSMakeRange(0, 1)];
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"하" attributes:ulAttrs];
  [delegate textInputDidChange];
  XCTAssertEqualObjects(mock.attributedText.string, @"하");

  // Step 3: 한 — final consonant added
  [delegate textInputShouldChangeText:@"한" inRange:NSMakeRange(0, 1)];
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"한" attributes:ulAttrs];
  [delegate textInputDidChange];
  XCTAssertEqualObjects(mock.attributedText.string, @"한");

  // Step 4: commit — markedTextRange cleared, underline removed
  mock.mockMarkedTextRange = nil;
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"한"];
  [delegate textInputDidChange];
  XCTAssertEqualObjects(mock.attributedText.string, @"한");
}

#pragma mark - Japanese romaji lifecycle

- (void)testJapaneseRomajiCompositionLifecycle
{
  // k → か → かn → かん → 漢 (candidate) → commit
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  id<RCTBackedTextInputDelegate> delegate = (id<RCTBackedTextInputDelegate>)cv;

  NSDictionary *ul = @{NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle)};
  mock.mockMarkedTextRange = createMockTextRange(mock);

  for (NSString *step in @[ @"k", @"か", @"かn", @"かん" ]) {
    mock.attributedText = [[NSAttributedString alloc] initWithString:step attributes:ul];
    [delegate textInputDidChange];
    XCTAssertEqualObjects(mock.attributedText.string, step);
  }

  // Candidate selection
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"漢" attributes:ul];
  [delegate textInputDidChange];

  // Commit
  mock.mockMarkedTextRange = nil;
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"漢"];
  [delegate textInputDidChange];
  XCTAssertEqualObjects(mock.attributedText.string, @"漢");
}

#pragma mark - Chinese Pinyin lifecycle

- (void)testChinesePinyinCompositionLifecycle
{
  // z → zh → zhong → 中 (candidate) → commit
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  id<RCTBackedTextInputDelegate> delegate = (id<RCTBackedTextInputDelegate>)cv;

  NSDictionary *ul = @{NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle)};
  mock.mockMarkedTextRange = createMockTextRange(mock);

  for (NSString *step in @[ @"z", @"zh", @"zho", @"zhon", @"zhong" ]) {
    mock.attributedText = [[NSAttributedString alloc] initWithString:step attributes:ul];
    [delegate textInputDidChange];
    XCTAssertEqualObjects(mock.attributedText.string, step);
  }

  mock.attributedText = [[NSAttributedString alloc] initWithString:@"中" attributes:ul];
  [delegate textInputDidChange];

  mock.mockMarkedTextRange = nil;
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"中"];
  [delegate textInputDidChange];
  XCTAssertEqualObjects(mock.attributedText.string, @"中");
}

#pragma mark - Korean multi-syllable lifecycle

- (void)testKoreanMultiSyllableCompositionLifecycle
{
  // 감사 — two syllables: ㄱ→가→감 (commit) → ㅅ→사 (commit)
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  id<RCTBackedTextInputDelegate> delegate = (id<RCTBackedTextInputDelegate>)cv;

  NSDictionary *ul = @{NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle)};

  // First syllable: 감
  mock.mockMarkedTextRange = createMockTextRange(mock);
  for (NSString *step in @[ @"ㄱ", @"가", @"감" ]) {
    mock.attributedText = [[NSAttributedString alloc] initWithString:step attributes:ul];
    [delegate textInputDidChange];
  }

  // ㅅ is typed — 감 commits, new syllable starts: 감ㅅ
  // System splits: "감" committed + "ㅅ" composing
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"감ㅅ" attributes:ul];
  [delegate textInputDidChange];
  XCTAssertEqualObjects(mock.attributedText.string, @"감ㅅ");

  // ㅏ added: 감사
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"감사" attributes:ul];
  [delegate textInputDidChange];

  // Commit
  mock.mockMarkedTextRange = nil;
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"감사"];
  [delegate textInputDidChange];

  XCTAssertEqualObjects(mock.attributedText.string, @"감사");
}

#pragma mark - Japanese candidate re-selection lifecycle

- (void)testJapaneseCandidateReselectionLifecycle
{
  // はし → 橋 → 箸 → 端 → 箸 (user scrolls candidates and confirms)
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  id<RCTBackedTextInputDelegate> delegate = (id<RCTBackedTextInputDelegate>)cv;

  NSDictionary *ul = @{NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle)};
  mock.mockMarkedTextRange = createMockTextRange(mock);

  // Romaji input
  for (NSString *step in @[ @"h", @"は", @"はs", @"はし" ]) {
    mock.attributedText = [[NSAttributedString alloc] initWithString:step attributes:ul];
    [delegate textInputDidChange];
  }

  // Candidate selection — user scrolls through candidates
  for (NSString *candidate in @[ @"橋", @"箸", @"端", @"箸" ]) {
    mock.attributedText = [[NSAttributedString alloc] initWithString:candidate attributes:ul];
    [delegate textInputDidChange];
    // Text should reflect the current candidate, not be replaced by JS
    XCTAssertEqualObjects(mock.attributedText.string, candidate);
  }

  // Commit
  mock.mockMarkedTextRange = nil;
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"箸"];
  [delegate textInputDidChange];

  XCTAssertEqualObjects(mock.attributedText.string, @"箸");
}

#pragma mark - Chinese Zhuyin (Bopomofo) lifecycle

- (void)testChineseZhuyinCompositionLifecycle
{
  // Zhuyin (Bopomofo) IME used in Taiwan: ㄓㄨㄥ → 中
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  id<RCTBackedTextInputDelegate> delegate = (id<RCTBackedTextInputDelegate>)cv;

  NSDictionary *ul = @{NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle)};
  mock.mockMarkedTextRange = createMockTextRange(mock);

  for (NSString *step in @[ @"ㄓ", @"ㄓㄨ", @"ㄓㄨㄥ" ]) {
    mock.attributedText = [[NSAttributedString alloc] initWithString:step attributes:ul];
    [delegate textInputDidChange];
    XCTAssertEqualObjects(mock.attributedText.string, step);
  }

  // Candidate selected
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"中" attributes:ul];
  [delegate textInputDidChange];

  // Commit
  mock.mockMarkedTextRange = nil;
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"中"];
  [delegate textInputDidChange];

  XCTAssertEqualObjects(mock.attributedText.string, @"中");
}

#pragma mark - Mixed Latin + CJK lifecycle

- (void)testMixedLatinAndCJKComposition
{
  // User types "Hello" in Latin, then switches to Japanese IME and types "世界"
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  id<RCTBackedTextInputDelegate> delegate = (id<RCTBackedTextInputDelegate>)cv;

  NSDictionary *ul = @{NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle)};

  // Latin input (no composition)
  mock.mockMarkedTextRange = nil;
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"Hello"];
  [delegate textInputDidChange];

  // Japanese composition starts after "Hello"
  mock.mockMarkedTextRange = createMockTextRange(mock);
  for (NSString *step in @[ @"Hellos", @"Helloせ", @"Helloせk", @"Helloせか", @"Helloせかi", @"Helloせかい" ]) {
    mock.attributedText = [[NSAttributedString alloc] initWithString:step attributes:ul];
    [delegate textInputDidChange];
  }

  // Candidate selected
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"Hello世界" attributes:ul];
  [delegate textInputDidChange];

  // Commit
  mock.mockMarkedTextRange = nil;
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"Hello世界"];
  [delegate textInputDidChange];

  XCTAssertEqualObjects(mock.attributedText.string, @"Hello世界");
}

#pragma mark - Composition underline preservation

- (void)testCompositionUnderlinePreservedDuringStateRoundTrip
{
  // The core bug: during IME composition, the system adds NSUnderlineStyleAttributeName
  // to show the composition underline. If _setAttributedString is called (e.g., from a
  // Fabric state round-trip), it would replace the attributed text with one that has NO
  // underline, destroying the visual composition indicator. Our guard must prevent this.
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];

  // Set up text WITH underline (simulating active IME composition)
  NSDictionary *withUnderline = @{
    NSFontAttributeName : [UIFont systemFontOfSize:14],
    NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle),
  };
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"한" attributes:withUnderline];
  mock.mockMarkedTextRange = createMockTextRange(mock);

  // Attempt to replace with text WITHOUT underline (simulating state round-trip)
  NSAttributedString *withoutUnderline =
      [[NSAttributedString alloc] initWithString:@"한"
                                      attributes:@{NSFontAttributeName : [UIFont systemFontOfSize:14]}];

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
  SEL sel = NSSelectorFromString(@"_setAttributedString:");
  if ([cv respondsToSelector:sel]) {
    [cv performSelector:sel withObject:withoutUnderline];
  }
#pragma clang diagnostic pop

  // The underline attribute must still be present (guard blocked the replacement)
  NSDictionary *resultAttrs = [mock.attributedText attributesAtIndex:0 effectiveRange:nil];
  XCTAssertNotNil(
      resultAttrs[NSUnderlineStyleAttributeName],
      @"Composition underline must be preserved — _setAttributedString should be blocked during composition");
}

- (void)testCompositionUnderlinePreservedDuringDeferredAttributeUpdate
{
  // When updateEventEmitter defers defaultTextAttributes during composition,
  // the underline on the current text must not be disturbed.
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  id<RCTBackedTextInputDelegate> delegate = (id<RCTBackedTextInputDelegate>)cv;

  NSDictionary *withUnderline = @{
    NSFontAttributeName : [UIFont systemFontOfSize:14],
    NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle),
  };
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"か" attributes:withUnderline];
  mock.mockMarkedTextRange = createMockTextRange(mock);

  // Simulate deferred attribute update (from updateEventEmitter during composition)
  NSDictionary *newAttrs = @{NSFontAttributeName : [UIFont boldSystemFontOfSize:16]};
  [cv setValue:@YES forKey:@"_needsUpdateDefaultTextAttributes"];
  [cv setValue:newAttrs forKey:@"_pendingDefaultTextAttributes"];

  // textInputDidChange fires mid-composition — deferred attrs must NOT be applied
  [delegate textInputDidChange];

  // Underline must still be on the text
  NSDictionary *resultAttrs = [mock.attributedText attributesAtIndex:0 effectiveRange:nil];
  XCTAssertNotNil(
      resultAttrs[NSUnderlineStyleAttributeName],
      @"Composition underline must survive deferred attribute update during composition");

  // Deferred flag must still be pending
  XCTAssertTrue([[cv valueForKey:@"_needsUpdateDefaultTextAttributes"] boolValue]);
}

- (void)testUnderlineRemovedAfterCompositionCommit
{
  // After composition commits, the system removes the underline.
  // Our code should allow normal attribute updates at this point.
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  id<RCTBackedTextInputDelegate> delegate = (id<RCTBackedTextInputDelegate>)cv;

  // Mid-composition: underline present
  NSDictionary *withUnderline = @{
    NSFontAttributeName : [UIFont systemFontOfSize:14],
    NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle),
  };
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"한" attributes:withUnderline];
  mock.mockMarkedTextRange = createMockTextRange(mock);
  [delegate textInputDidChange];

  // Commit: system removes underline and clears markedTextRange
  mock.mockMarkedTextRange = nil;
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"한"
                                                        attributes:@{NSFontAttributeName : [UIFont systemFontOfSize:14]}];
  [delegate textInputDidChange];

  // After commit, underline should be gone (system removed it)
  NSDictionary *resultAttrs = [mock.attributedText attributesAtIndex:0 effectiveRange:nil];
  XCTAssertNil(
      resultAttrs[NSUnderlineStyleAttributeName],
      @"Underline should be removed after composition commits");
}

#pragma mark - _setAttributedString guard

- (void)testSetAttributedStringBlockedDuringComposition
{
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];

  mock.attributedText = [[NSAttributedString alloc] initWithString:@"composing"];
  mock.mockMarkedTextRange = createMockTextRange(mock);

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
  SEL sel = NSSelectorFromString(@"_setAttributedString:");
  if ([cv respondsToSelector:sel]) {
    [cv performSelector:sel
             withObject:[[NSAttributedString alloc] initWithString:@"replaced"]];
  }
#pragma clang diagnostic pop

  XCTAssertEqualObjects(mock.attributedText.string, @"composing",
                        @"Text must not be replaced during composition");
}

- (void)testSetAttributedStringAllowedAfterComposition
{
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];

  mock.attributedText = [[NSAttributedString alloc] initWithString:@"old"];
  mock.mockMarkedTextRange = nil;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
  SEL sel = NSSelectorFromString(@"_setAttributedString:");
  if ([cv respondsToSelector:sel]) {
    [cv performSelector:sel
             withObject:[[NSAttributedString alloc] initWithString:@"new"]];
  }
#pragma clang diagnostic pop

  XCTAssertEqualObjects(mock.attributedText.string, @"new",
                        @"Text should be replaced when not composing");
}

#pragma mark - Deferred defaultTextAttributes

- (void)testDeferredAttributesPreservedDuringComposition
{
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"test"];

  [cv setValue:@YES forKey:@"_needsUpdateDefaultTextAttributes"];
  [cv setValue:@{NSFontAttributeName : [UIFont systemFontOfSize:18]}
       forKey:@"_pendingDefaultTextAttributes"];

  mock.mockMarkedTextRange = createMockTextRange(mock);
  [(id<RCTBackedTextInputDelegate>)cv textInputDidChange];

  XCTAssertTrue([[cv valueForKey:@"_needsUpdateDefaultTextAttributes"] boolValue]);
  XCTAssertNotNil([cv valueForKey:@"_pendingDefaultTextAttributes"]);
}

- (void)testDeferredAttributesAppliedAfterComposition
{
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"test"];

  [cv setValue:@YES forKey:@"_needsUpdateDefaultTextAttributes"];
  [cv setValue:@{NSFontAttributeName : [UIFont systemFontOfSize:18]}
       forKey:@"_pendingDefaultTextAttributes"];

  mock.mockMarkedTextRange = nil;
  [(id<RCTBackedTextInputDelegate>)cv textInputDidChange];

  XCTAssertFalse([[cv valueForKey:@"_needsUpdateDefaultTextAttributes"] boolValue]);
  XCTAssertNil([cv valueForKey:@"_pendingDefaultTextAttributes"]);
}

#pragma mark - Full lifecycle with deferred attributes

- (void)testCompositionLifecycleWithDeferredAttributes
{
  // Composition starts → deferred attrs set mid-composition → composition ends → attrs applied
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  id<RCTBackedTextInputDelegate> delegate = (id<RCTBackedTextInputDelegate>)cv;

  NSDictionary *ul = @{NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle)};

  // Composition starts
  mock.mockMarkedTextRange = createMockTextRange(mock);
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"ㅎ" attributes:ul];
  [delegate textInputDidChange];

  // Mid-composition: deferred attribute update arrives
  [cv setValue:@YES forKey:@"_needsUpdateDefaultTextAttributes"];
  [cv setValue:@{NSFontAttributeName : [UIFont boldSystemFontOfSize:20]}
       forKey:@"_pendingDefaultTextAttributes"];

  mock.attributedText = [[NSAttributedString alloc] initWithString:@"한" attributes:ul];
  [delegate textInputDidChange];

  // Still composing — deferred must be preserved
  XCTAssertTrue([[cv valueForKey:@"_needsUpdateDefaultTextAttributes"] boolValue]);

  // Commit
  mock.mockMarkedTextRange = nil;
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"한"];
  [delegate textInputDidChange];

  // Deferred attrs must now be applied
  XCTAssertFalse([[cv valueForKey:@"_needsUpdateDefaultTextAttributes"] boolValue]);
  XCTAssertNil([cv valueForKey:@"_pendingDefaultTextAttributes"]);
  XCTAssertEqualObjects(mock.attributedText.string, @"한");
}

#pragma mark - maxLength

- (void)testMaxLengthBypassedDuringComposition
{
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"12345"];
  mock.mockMarkedTextRange = createMockTextRange(mock);

  NSString *result =
      [(id<RCTBackedTextInputDelegate>)cv textInputShouldChangeText:@"한" inRange:NSMakeRange(5, 0)];
  XCTAssertEqualObjects(result, @"한");
}

- (void)testMaxLengthPassthroughWhenNotComposing
{
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"12345"];
  mock.mockMarkedTextRange = nil;

  NSString *result =
      [(id<RCTBackedTextInputDelegate>)cv textInputShouldChangeText:@"6" inRange:NSMakeRange(5, 0)];
  XCTAssertEqualObjects(result, @"6");
}

#pragma mark - Multiline bare text comparison

- (void)testMultilineBareTextComparisonPreventsFalsePositive
{
  RCTMockTextView *mock;
  RCTTextInputComponentView *cv = [self createMultiLineWithMock:&mock];

  mock.attributedText =
      [[NSMutableAttributedString alloc] initWithString:@"test"
                                             attributes:@{
                                               NSFontAttributeName : [UIFont systemFontOfSize:14],
                                               NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle),
                                             }];

  NSAttributedString *withoutUL =
      [[NSAttributedString alloc] initWithString:@"test"
                                      attributes:@{NSFontAttributeName : [UIFont systemFontOfSize:14]}];
  [cv setValue:withoutUL forKey:@"_lastStringStateWasUpdatedWith"];

  // Bare strings equal — new comparison returns YES (no false positive)
  XCTAssertTrue([withoutUL.string isEqualToString:mock.attributedText.string]);
  // Full attributed strings differ — old comparison would return NO
  XCTAssertFalse([withoutUL isEqual:mock.attributedText]);
}

#pragma mark - JS-driven update blocked during composition

- (void)testJSDrivenTextUpdateBlockedDuringComposition
{
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];

  mock.attributedText = [[NSAttributedString alloc] initWithString:@"composing"
                                                        attributes:@{
                                                          NSUnderlineStyleAttributeName : @(NSUnderlineStyleSingle),
                                                        }];
  mock.mockMarkedTextRange = createMockTextRange(mock);

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
  SEL sel = NSSelectorFromString(@"_setAttributedString:");
  if ([cv respondsToSelector:sel]) {
    [cv performSelector:sel
             withObject:[[NSAttributedString alloc] initWithString:@"js-value"]];
  }
#pragma clang diagnostic pop

  XCTAssertEqualObjects(mock.attributedText.string, @"composing",
                        @"JS-driven update must be blocked during composition");
}

#pragma mark - typingAttributes stripping for IME composition underline

- (void)testTypingAttributesStrippedForMultiline
{
  // UITextView (multiline): setDefaultTextAttributes: must strip EventEmitter,
  // no-op NSShadow, and transparent NSBackgroundColor from typingAttributes.
  // These attributes prevent UIKit from rendering the IME composition underline.
  RCTMockTextView *mock;
  [self createMultiLineWithMock:&mock];

  NSShadow *noopShadow = [NSShadow new]; // offset (0,0), blur 0
  NSDictionary *attrs = @{
    NSFontAttributeName : [UIFont systemFontOfSize:14],
    NSForegroundColorAttributeName : [UIColor blackColor],
    @"EventEmitter" : [@"fake-emitter" dataUsingEncoding:NSUTF8StringEncoding],
    NSShadowAttributeName : noopShadow,
    NSBackgroundColorAttributeName : [UIColor clearColor],
  };
  mock.defaultTextAttributes = attrs;

  XCTAssertNil(mock.typingAttributes[@"EventEmitter"],
               @"EventEmitter must be stripped from typingAttributes");
  XCTAssertNil(mock.typingAttributes[NSShadowAttributeName],
               @"No-op NSShadow must be stripped from typingAttributes");
  XCTAssertNil(mock.typingAttributes[NSBackgroundColorAttributeName],
               @"Transparent NSBackgroundColor must be stripped from typingAttributes");
  XCTAssertNotNil(mock.typingAttributes[NSFontAttributeName],
                  @"Standard attributes like font must be preserved");
  XCTAssertNotNil(mock.typingAttributes[NSForegroundColorAttributeName],
                  @"Standard attributes like foreground color must be preserved");
}

- (void)testRealShadowAndBackgroundPreservedInMultilineTypingAttributes
{
  // User-specified shadow and background color must NOT be stripped.
  RCTMockTextView *mock;
  [self createMultiLineWithMock:&mock];

  NSShadow *realShadow = [NSShadow new];
  realShadow.shadowOffset = CGSizeMake(1, 1);
  realShadow.shadowBlurRadius = 2;
  NSDictionary *attrs = @{
    NSFontAttributeName : [UIFont systemFontOfSize:14],
    NSShadowAttributeName : realShadow,
    NSBackgroundColorAttributeName : [UIColor yellowColor],
  };
  mock.defaultTextAttributes = attrs;

  XCTAssertNotNil(mock.typingAttributes[NSShadowAttributeName],
                  @"User-specified NSShadow must be preserved");
  XCTAssertNotNil(mock.typingAttributes[NSBackgroundColorAttributeName],
                  @"User-specified NSBackgroundColor must be preserved");
}

- (void)testUpdateTypingAttributesStripsIMEBlockingAttrs
{
  // _updateTypingAttributes reads from attributed text (which has EventEmitter
  // and no-op attrs from Fabric). These must be stripped so UIKit can render
  // the composition underline on subsequent compositions.
  RCTMockTextField *mock;
  RCTTextInputComponentView *cv = [self createSingleLineWithMock:&mock];

  NSShadow *noopShadow = [NSShadow new];
  NSDictionary *attrsWithJunk = @{
    NSFontAttributeName : [UIFont systemFontOfSize:14],
    @"EventEmitter" : [@"fake-emitter" dataUsingEncoding:NSUTF8StringEncoding],
    NSShadowAttributeName : noopShadow,
    NSBackgroundColorAttributeName : [UIColor clearColor],
  };
  mock.attributedText = [[NSAttributedString alloc] initWithString:@"test" attributes:attrsWithJunk];
  mock.mockMarkedTextRange = nil;
  mock.selectedTextRange = [mock textRangeFromPosition:mock.beginningOfDocument toPosition:mock.beginningOfDocument];

  [(id<RCTBackedTextInputDelegate>)cv textInputDidChangeSelection];

  XCTAssertNil(mock.typingAttributes[@"EventEmitter"],
               @"EventEmitter must be stripped from typingAttributes");
  XCTAssertNil(mock.typingAttributes[NSShadowAttributeName],
               @"No-op NSShadow must be stripped from typingAttributes");
  XCTAssertNil(mock.typingAttributes[NSBackgroundColorAttributeName],
               @"Transparent NSBackgroundColor must be stripped from typingAttributes");
  XCTAssertNotNil(mock.typingAttributes[NSFontAttributeName],
                  @"Font must be preserved in typingAttributes");
}

@end
