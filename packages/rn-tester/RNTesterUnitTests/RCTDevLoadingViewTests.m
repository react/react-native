/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDevLoadingView.h>
#import <React/RCTDevLoadingViewSetEnabled.h>
#import <React/RCTJavaScriptLoader.h>
#import <React/RCTUtils.h>
#import <XCTest/XCTest.h>

#if RCT_DEV_MENU

@interface RCTDevLoadingView (Tests)
- (void)invalidate;
- (BOOL)isRunningInTestEnvironment;
@end

@interface RCTDevLoadingViewForTests : RCTDevLoadingView
@end

@implementation RCTDevLoadingViewForTests
- (BOOL)isRunningInTestEnvironment
{
  // Exercise the real display path instead of the XCTest early return.
  return NO;
}
@end

@interface RCTDevLoadingViewTests : XCTestCase
@end

@implementation RCTDevLoadingViewTests {
  BOOL _wasEnabled;
  NSMutableArray<RCTDevLoadingView *> *_loadingViews;
}

- (void)setUp
{
  [super setUp];
  XCTAssertTrue(RCTIsMainQueue());
  _wasEnabled = RCTDevLoadingViewGetEnabled();
  RCTDevLoadingViewSetEnabled(YES);
  _loadingViews = [NSMutableArray new];
}

- (void)tearDown
{
  for (RCTDevLoadingView *loadingView in _loadingViews) {
    [loadingView invalidate];
  }
  [self drainMainQueue];
  _loadingViews = nil;
  RCTDevLoadingViewSetEnabled(_wasEnabled);
  [super tearDown];
}

- (RCTDevLoadingView *)newLoadingView
{
  RCTDevLoadingView *loadingView = [RCTDevLoadingViewForTests new];
  [_loadingViews addObject:loadingView];
  return loadingView;
}

- (void)drainMainQueue
{
  XCTestExpectation *drained = [self expectationWithDescription:@"Queued loading messages finished"];
  dispatch_async(dispatch_get_main_queue(), ^{
    // updateProgress enqueues another display block from its main-queue callback.
    dispatch_async(dispatch_get_main_queue(), ^{
      [drained fulfill];
    });
  });
  [self waitForExpectations:@[ drained ] timeout:2];
}

- (void)showMessage:(RCTDevLoadingView *)loadingView
{
  [loadingView showMessage:@"Loading from Metro…"
                     color:UIColor.whiteColor
           backgroundColor:UIColor.blackColor
             dismissButton:YES];
}

- (void)testInvalidateClearsVisibleWindow
{
  RCTDevLoadingView *loadingView = [self newLoadingView];
  [self showMessage:loadingView];
  [self drainMainQueue];

  UIWindow *window = [loadingView valueForKey:@"window"];
  XCTAssertNotNil(window);
  XCTAssertFalse(window.hidden);
  XCTAssertNotNil([loadingView valueForKey:@"dismissButton"]);

  [loadingView invalidate];
  [self drainMainQueue];

  XCTAssertTrue(window.hidden);
  for (NSString *key in @[ @"window", @"container", @"label", @"dismissButton" ]) {
    XCTAssertNil([loadingView valueForKey:key], @"%@ should be released during invalidation", key);
  }
}

- (void)testInvalidateCancelsPendingInitialMessage
{
  RCTDevLoadingView *loadingView = [self newLoadingView];
  [loadingView showWithURL:[NSURL URLWithString:@"http://localhost:8081/index.bundle"]];
  dispatch_block_t pendingMessage = [loadingView valueForKey:@"initialMessageBlock"];
  XCTAssertNotNil(pendingMessage);
  XCTAssertEqual(dispatch_block_testcancel(pendingMessage), 0L);

  [loadingView invalidate];
  [self drainMainQueue];

  XCTAssertNil([loadingView valueForKey:@"initialMessageBlock"]);
  XCTAssertNotEqual(dispatch_block_testcancel(pendingMessage), 0L);
}

- (void)testInvalidatePreventsQueuedMessagesFromRecreatingWindow
{
  RCTDevLoadingView *messageView = [self newLoadingView];
  RCTDevLoadingView *progressView = [self newLoadingView];
  RCTLoadingProgress *progress = [RCTLoadingProgress new];
  progress.status = @"Downloading";

  [self showMessage:messageView];
  [progressView updateProgress:progress];
  [messageView invalidate];
  [progressView invalidate];
  [self drainMainQueue];

  XCTAssertNil([messageView valueForKey:@"window"]);
  XCTAssertNil([progressView valueForKey:@"window"]);
}

@end

#endif
