/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTKeyboardObserver.h>
#import <XCTest/XCTest.h>

#if !TARGET_OS_TV

@interface RCTKeyboardObserver (Tests)
- (void)keyboardWillShow:(NSNotification *)notification;
- (void)keyboardDidShow:(NSNotification *)notification;
- (void)keyboardWillHide:(NSNotification *)notification;
- (void)keyboardDidHide:(NSNotification *)notification;
- (void)keyboardWillChangeFrame:(NSNotification *)notification;
- (void)keyboardDidChangeFrame:(NSNotification *)notification;
@end

@interface RCTRecordingKeyboardObserver : RCTKeyboardObserver
@property (nonatomic, readonly) NSMutableArray<NSString *> *sentEventNames;
@end

@implementation RCTRecordingKeyboardObserver

- (instancetype)init
{
  if (self = [super init]) {
    _sentEventNames = [NSMutableArray new];
  }
  return self;
}

- (void)sendEventWithName:(NSString *)name body:(id)body
{
  [_sentEventNames addObject:name];
}

@end

static NSNotification *keyboardNotification(NSNotificationName name, CGRect endFrame)
{
  return [NSNotification notificationWithName:name
                                       object:nil
                                     userInfo:@{
                                       UIKeyboardFrameBeginUserInfoKey : [NSValue valueWithCGRect:CGRectZero],
                                       UIKeyboardFrameEndUserInfoKey : [NSValue valueWithCGRect:endFrame],
                                     }];
}

@interface RCTKeyboardObserverTests : XCTestCase
@end

@implementation RCTKeyboardObserverTests {
  RCTCallableJSModules *_callableJSModules;
  RCTRecordingKeyboardObserver *_observer;
}

- (void)setUp
{
  [super setUp];
  _callableJSModules = [RCTCallableJSModules new];
  _observer = [RCTRecordingKeyboardObserver new];
  _observer.callableJSModules = _callableJSModules;
}

- (void)testShowWithKeyboardFrameIsSentAsShow
{
  CGRect keyboardFrame = CGRectMake(0, 389, 466, 289);
  [_observer keyboardWillShow:keyboardNotification(UIKeyboardWillShowNotification, keyboardFrame)];
  [_observer keyboardDidShow:keyboardNotification(UIKeyboardDidShowNotification, keyboardFrame)];

  XCTAssertEqualObjects(_observer.sentEventNames, (@[ @"keyboardWillShow", @"keyboardDidShow" ]));
}

- (void)testShowWithKeyboardFrameAtTopIsSentAsShow
{
  CGRect keyboardFrameAtTop = CGRectMake(0, 0, 466, 289);
  [_observer keyboardWillShow:keyboardNotification(UIKeyboardWillShowNotification, keyboardFrameAtTop)];
  [_observer keyboardDidShow:keyboardNotification(UIKeyboardDidShowNotification, keyboardFrameAtTop)];

  XCTAssertEqualObjects(_observer.sentEventNames, (@[ @"keyboardWillShow", @"keyboardDidShow" ]));
}

- (void)testShowWithEmptyFrameIsSentAsHide
{
  CGRect zeroHeightFrame = CGRectMake(0, 951, 669, 0);
  [_observer keyboardWillShow:keyboardNotification(UIKeyboardWillShowNotification, zeroHeightFrame)];
  [_observer keyboardDidShow:keyboardNotification(UIKeyboardDidShowNotification, zeroHeightFrame)];

  CGRect zeroWidthFrame = CGRectMake(273, 0, 0, 264);
  [_observer keyboardWillShow:keyboardNotification(UIKeyboardWillShowNotification, zeroWidthFrame)];
  [_observer keyboardDidShow:keyboardNotification(UIKeyboardDidShowNotification, zeroWidthFrame)];

  XCTAssertEqualObjects(
      _observer.sentEventNames,
      (@[ @"keyboardWillHide", @"keyboardDidHide", @"keyboardWillHide", @"keyboardDidHide" ]));
}

- (void)testShowWithEmptyFrameAndFirstResponderIsSentAsShow
{
  UIWindowScene *windowScene = (UIWindowScene *)UIApplication.sharedApplication.connectedScenes.anyObject;
  if (windowScene == nil) {
    XCTFail(@"The test host has no window scene");
    return;
  }
  UIWindow *window = [[UIWindow alloc] initWithWindowScene:windowScene];
  UITextField *textField = [[UITextField alloc] initWithFrame:CGRectMake(0, 0, 200, 40)];
  [window addSubview:textField];
  [window makeKeyAndVisible];
  XCTAssertTrue([textField becomeFirstResponder]);

  CGRect emptyFrame = CGRectMake(0, 1180, 0, 0);
  [_observer keyboardWillShow:keyboardNotification(UIKeyboardWillShowNotification, emptyFrame)];
  [_observer keyboardDidShow:keyboardNotification(UIKeyboardDidShowNotification, emptyFrame)];

  [textField resignFirstResponder];
  window.hidden = YES;
  XCTAssertEqualObjects(_observer.sentEventNames, (@[ @"keyboardWillShow", @"keyboardDidShow" ]));
}

- (void)testHideAndFrameChangeAreUnchanged
{
  CGRect emptyFrame = CGRectMake(0, 678, 466, 0);
  [_observer keyboardWillHide:keyboardNotification(UIKeyboardWillHideNotification, emptyFrame)];
  [_observer keyboardDidHide:keyboardNotification(UIKeyboardDidHideNotification, emptyFrame)];
  [_observer keyboardWillChangeFrame:keyboardNotification(UIKeyboardWillChangeFrameNotification, emptyFrame)];
  [_observer keyboardDidChangeFrame:keyboardNotification(UIKeyboardDidChangeFrameNotification, emptyFrame)];

  XCTAssertEqualObjects(
      _observer.sentEventNames,
      (@[ @"keyboardWillHide", @"keyboardDidHide", @"keyboardWillChangeFrame", @"keyboardDidChangeFrame" ]));
}

- (void)testNothingIsSentWithoutJSModules
{
  _observer.callableJSModules = nil;
  [_observer keyboardWillShow:keyboardNotification(UIKeyboardWillShowNotification, CGRectMake(0, 951, 669, 0))];
  [_observer keyboardWillShow:keyboardNotification(UIKeyboardWillShowNotification, CGRectMake(0, 389, 466, 289))];

  XCTAssertEqual(_observer.sentEventNames.count, 0u);
}

@end

#endif
