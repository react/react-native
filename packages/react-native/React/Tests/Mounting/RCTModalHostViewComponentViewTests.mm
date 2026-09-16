/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTModalHostViewComponentView.h>
#import <XCTest/XCTest.h>

#if TARGET_OS_IOS

// Simulates a modal that is itself presenting a child, without a window or presentation animation.
@interface RCTFakeModalViewController : UIViewController
@property (nonatomic, strong) UIViewController *fakePresentedViewController;
@property (nonatomic, weak) UIViewController *fakePresentingViewController;
@property (nonatomic, assign) NSInteger dismissCallCount;
@end

@implementation RCTFakeModalViewController

- (UIViewController *)presentedViewController
{
  return _fakePresentedViewController;
}

- (UIViewController *)presentingViewController
{
  return _fakePresentingViewController;
}

- (void)dismissViewControllerAnimated:(BOOL)animated completion:(void (^)(void))completion
{
  self.dismissCallCount++;
  if (completion) {
    completion();
  }
}

@end

@interface RCTModalHostViewComponentViewTests : XCTestCase
@end

@implementation RCTModalHostViewComponentViewTests

// Dismissing a modal that is itself presenting a child (e.g. the "Undo Typing" alert) must
// dismiss the whole stack through the presenting view controller, otherwise the modal is left
// stuck onscreen (#58326).
- (void)testDismissViewControllerDismissesWholeStackWhenChildIsPresented
{
  RCTModalHostViewComponentView *view = [[RCTModalHostViewComponentView alloc] initWithFrame:CGRectZero];

  RCTFakeModalViewController *presentingViewController = [RCTFakeModalViewController new];
  RCTFakeModalViewController *modalViewController = [RCTFakeModalViewController new];
  RCTFakeModalViewController *presentedChildViewController = [RCTFakeModalViewController new];

  modalViewController.fakePresentedViewController = presentedChildViewController;
  modalViewController.fakePresentingViewController = presentingViewController;

  __block BOOL completionCalled = NO;
  [view dismissViewController:modalViewController
                     animated:NO
                   completion:^{
                     completionCalled = YES;
                   }];

  XCTAssertEqual(presentingViewController.dismissCallCount, 1);
  XCTAssertEqual(modalViewController.dismissCallCount, 0);
  XCTAssertTrue(completionCalled);
}

- (void)testDismissViewControllerFallsBackToModalWhenPresentingViewControllerIsNil
{
  RCTModalHostViewComponentView *view = [[RCTModalHostViewComponentView alloc] initWithFrame:CGRectZero];

  RCTFakeModalViewController *modalViewController = [RCTFakeModalViewController new];
  modalViewController.fakePresentedViewController = [RCTFakeModalViewController new];
  modalViewController.fakePresentingViewController = nil;

  __block BOOL completionCalled = NO;
  [view dismissViewController:modalViewController
                     animated:NO
                   completion:^{
                     completionCalled = YES;
                   }];

  XCTAssertEqual(modalViewController.dismissCallCount, 1);
  XCTAssertTrue(completionCalled);
}

- (void)testDismissViewControllerWithNoPresentedChildDismissesDirectly
{
  RCTModalHostViewComponentView *view = [[RCTModalHostViewComponentView alloc] initWithFrame:CGRectZero];

  RCTFakeModalViewController *modalViewController = [RCTFakeModalViewController new];

  __block BOOL completionCalled = NO;
  [view dismissViewController:modalViewController
                     animated:NO
                   completion:^{
                     completionCalled = YES;
                   }];

  XCTAssertEqual(modalViewController.dismissCallCount, 1);
  XCTAssertTrue(completionCalled);
}

@end

#endif
