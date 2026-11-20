/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBackedTextInputDelegate.h>
#import <React/RCTUITextField.h>
#import <React/RCTUITextView.h>
#import <XCTest/XCTest.h>

#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/featureflags/ReactNativeFeatureFlagsDefaults.h>

namespace {

class DeferredTextInputFeatureFlags : public facebook::react::ReactNativeFeatureFlagsDefaults {
 public:
  bool deferTextInputTruncationIOS() override
  {
    return true;
  }
};

} // namespace

@interface RCTTextInputDelegateStub : NSObject <RCTBackedTextInputDelegate>

@property (nonatomic, copy) NSString *replacementText;
@property (nonatomic, assign) NSInteger shouldChangeCount;
@property (nonatomic, assign) NSInteger changeCount;
@property (nonatomic, assign) NSInteger selectionChangeCount;

@end

@implementation RCTTextInputDelegateStub

- (BOOL)textInputShouldBeginEditing
{
  return YES;
}

- (void)textInputDidBeginEditing
{
}

- (BOOL)textInputShouldEndEditing
{
  return YES;
}

- (void)textInputDidEndEditing
{
}

- (BOOL)textInputShouldReturn
{
  return NO;
}

- (void)textInputDidReturn
{
}

- (BOOL)textInputShouldSubmitOnReturn
{
  return NO;
}

- (NSString *)textInputShouldChangeText:(NSString *)text inRange:(NSRange)range
{
  self.shouldChangeCount++;
  return self.replacementText;
}

- (void)textInputDidChange
{
  self.changeCount++;
}

- (void)textInputDidChangeSelection
{
  self.selectionChangeCount++;
}

@end

@interface RCTUITextField (PendingTextInputEdit)
- (void)rct_invalidatePendingTextInputEdit;
@end

@interface RCTBackedTextInputDelegateAdapterTests : XCTestCase
@end

@implementation RCTBackedTextInputDelegateAdapterTests

- (void)setUp
{
  [super setUp];
  facebook::react::ReactNativeFeatureFlags::dangerouslyReset();
  facebook::react::ReactNativeFeatureFlags::override(std::make_unique<DeferredTextInputFeatureFlags>());
}

- (void)tearDown
{
  facebook::react::ReactNativeFeatureFlags::dangerouslyReset();
  [super tearDown];
}

- (void)waitForPendingEdit
{
  XCTestExpectation *expectation = [self expectationWithDescription:@"pending edit drained"];
  dispatch_async(dispatch_get_main_queue(), ^{
    [expectation fulfill];
  });
  [self waitForExpectations:@[ expectation ] timeout:1];
}

- (void)testTextFieldDefersTransformedEdit
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.attributedText = [[NSAttributedString alloc] initWithString:@"abc"];

  RCTTextInputDelegateStub *delegate = [RCTTextInputDelegateStub new];
  delegate.replacementText = @"x";
  textField.textInputDelegate = delegate;

  BOOL accepted = [textField.delegate textField:textField
                  shouldChangeCharactersInRange:NSMakeRange(3, 0)
                              replacementString:@"wxyz"];

  XCTAssertFalse(accepted);
  XCTAssertEqualObjects(textField.attributedText.string, @"abc");
  XCTAssertEqual(delegate.changeCount, 0);

  [self waitForPendingEdit];

  XCTAssertEqualObjects(textField.attributedText.string, @"abcx");
  UITextRange *selectedTextRange = textField.selectedTextRange;
  XCTAssertNotNil(selectedTextRange);
  if (selectedTextRange != nil) {
    XCTAssertEqual([textField offsetFromPosition:textField.beginningOfDocument toPosition:selectedTextRange.start], 4);
  }
  XCTAssertEqual(delegate.shouldChangeCount, 1);
  XCTAssertEqual(delegate.changeCount, 1);
  XCTAssertEqual(delegate.selectionChangeCount, 1);
}

- (void)testTextViewDefersTransformedEdit
{
  RCTUITextView *textView = [RCTUITextView new];
  textView.attributedText = [[NSAttributedString alloc] initWithString:@"abc"];

  RCTTextInputDelegateStub *delegate = [RCTTextInputDelegateStub new];
  delegate.replacementText = @"x";
  textView.textInputDelegate = delegate;

  BOOL accepted = [textView.delegate textView:textView
                      shouldChangeTextInRange:NSMakeRange(3, 0)
                              replacementText:@"wxyz"];

  XCTAssertFalse(accepted);
  XCTAssertEqualObjects(textView.attributedText.string, @"abc");
  XCTAssertEqual(delegate.changeCount, 0);

  [self waitForPendingEdit];

  XCTAssertEqualObjects(textView.attributedText.string, @"abcx");
  UITextRange *selectedTextRange = textView.selectedTextRange;
  XCTAssertNotNil(selectedTextRange);
  if (selectedTextRange != nil) {
    XCTAssertEqual([textView offsetFromPosition:textView.beginningOfDocument toPosition:selectedTextRange.start], 4);
  }
  XCTAssertEqual(delegate.shouldChangeCount, 1);
  XCTAssertEqual(delegate.changeCount, 1);
  XCTAssertEqual(delegate.selectionChangeCount, 1);
}

- (void)testInvalidationCancelsPendingEdit
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.attributedText = [[NSAttributedString alloc] initWithString:@"abc"];

  RCTTextInputDelegateStub *delegate = [RCTTextInputDelegateStub new];
  delegate.replacementText = @"x";
  textField.textInputDelegate = delegate;

  BOOL accepted = [textField.delegate textField:textField
                  shouldChangeCharactersInRange:NSMakeRange(3, 0)
                              replacementString:@"wxyz"];
  [textField rct_invalidatePendingTextInputEdit];
  [self waitForPendingEdit];

  XCTAssertFalse(accepted);
  XCTAssertEqualObjects(textField.attributedText.string, @"abc");
  XCTAssertEqual(delegate.changeCount, 0);
  XCTAssertEqual(delegate.selectionChangeCount, 0);
}

- (void)testTextChangeCancelsPendingEdit
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.attributedText = [[NSAttributedString alloc] initWithString:@"abc"];

  RCTTextInputDelegateStub *delegate = [RCTTextInputDelegateStub new];
  delegate.replacementText = @"x";
  textField.textInputDelegate = delegate;

  [textField.delegate textField:textField shouldChangeCharactersInRange:NSMakeRange(3, 0) replacementString:@"wxyz"];
  textField.attributedText = [[NSAttributedString alloc] initWithString:@"updated"];
  [self waitForPendingEdit];

  XCTAssertEqualObjects(textField.attributedText.string, @"updated");
  XCTAssertEqual(delegate.changeCount, 0);
}

- (void)testLatestTransformedEditWinsWithinRunLoopTurn
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.attributedText = [[NSAttributedString alloc] initWithString:@"abc"];

  RCTTextInputDelegateStub *delegate = [RCTTextInputDelegateStub new];
  delegate.replacementText = @"x";
  textField.textInputDelegate = delegate;

  [textField.delegate textField:textField shouldChangeCharactersInRange:NSMakeRange(3, 0) replacementString:@"wxyz"];
  delegate.replacementText = @"y";
  [textField.delegate textField:textField shouldChangeCharactersInRange:NSMakeRange(3, 0) replacementString:@"wxyz"];
  [self waitForPendingEdit];

  XCTAssertEqualObjects(textField.attributedText.string, @"abcy");
  XCTAssertEqual(delegate.shouldChangeCount, 2);
  XCTAssertEqual(delegate.changeCount, 1);
}

- (void)testBlurCancelsPendingEdit
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.attributedText = [[NSAttributedString alloc] initWithString:@"abc"];

  RCTTextInputDelegateStub *delegate = [RCTTextInputDelegateStub new];
  delegate.replacementText = @"x";
  textField.textInputDelegate = delegate;

  [textField.delegate textField:textField shouldChangeCharactersInRange:NSMakeRange(3, 0) replacementString:@"wxyz"];
  [textField.delegate textFieldDidEndEditing:textField];
  [self waitForPendingEdit];

  XCTAssertEqualObjects(textField.attributedText.string, @"abc");
  XCTAssertEqual(delegate.changeCount, 0);
}

- (void)testUnchangedEditRemainsUIKitOwned
{
  RCTUITextField *textField = [RCTUITextField new];
  textField.attributedText = [[NSAttributedString alloc] initWithString:@"abc"];

  RCTTextInputDelegateStub *delegate = [RCTTextInputDelegateStub new];
  delegate.replacementText = @"x";
  textField.textInputDelegate = delegate;

  BOOL accepted = [textField.delegate textField:textField
                  shouldChangeCharactersInRange:NSMakeRange(3, 0)
                              replacementString:@"x"];
  [self waitForPendingEdit];

  XCTAssertTrue(accepted);
  XCTAssertEqualObjects(textField.attributedText.string, @"abc");
  XCTAssertEqual(delegate.changeCount, 0);
}

@end
