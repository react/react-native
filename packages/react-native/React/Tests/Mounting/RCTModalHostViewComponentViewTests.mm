/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTModalHostViewComponentView.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/FBReactNativeSpec/Props.h>

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

// Completes UIKit transitions explicitly, so the tests exercise overlapping
// visibility requests without depending on animation timing.
@interface RCTControlledModalHostView : RCTModalHostViewComponentView
@property (nonatomic, assign) BOOL completeSynchronously;
@property (nonatomic, strong) NSMutableArray *presentations;
@property (nonatomic, strong) NSMutableArray *dismissals;
@property (nonatomic, strong) NSMutableArray<UIViewController *> *presentedControllers;
@property (nonatomic, strong) NSMutableArray<UIViewController *> *dismissedControllers;
- (void)setVisible:(BOOL)visible;
- (void)completePresentation;
- (void)completeDismissal;
@end

@implementation RCTControlledModalHostView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _presentations = [NSMutableArray new];
    _dismissals = [NSMutableArray new];
    _presentedControllers = [NSMutableArray new];
    _dismissedControllers = [NSMutableArray new];
  }
  return self;
}

- (void)setVisible:(BOOL)visible
{
  auto props = std::make_shared<facebook::react::ModalHostViewProps>();
  props->visible = visible;
  [self updateProps:props oldProps:nullptr];
}

- (void)presentViewController:(UIViewController *)controller
                     animated:(BOOL)animated
                   completion:(void (^)(void))completion
{
  [_presentedControllers addObject:controller];
  if (completion) {
    if (self.completeSynchronously) {
      completion();
    } else {
      [_presentations addObject:[completion copy]];
    }
  }
}

- (void)dismissViewController:(UIViewController *)controller
                     animated:(BOOL)animated
                   completion:(void (^)(void))completion
{
  [_dismissedControllers addObject:controller];
  if (completion) {
    if (self.completeSynchronously) {
      completion();
    } else {
      [_dismissals addObject:[completion copy]];
    }
  }
}

- (void)completePresentation
{
  void (^completion)(void) = _presentations.firstObject;
  [_presentations removeObjectAtIndex:0];
  completion();
}

- (void)completeDismissal
{
  void (^completion)(void) = _dismissals.firstObject;
  [_dismissals removeObjectAtIndex:0];
  completion();
}

@end

@interface RCTModalHostViewTransitionTests : XCTestCase
@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) RCTControlledModalHostView *view;
@end

@implementation RCTModalHostViewTransitionTests

- (void)setUp
{
  [super setUp];
  self.window = [[UIWindow alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
  self.view = [[RCTControlledModalHostView alloc] initWithFrame:self.window.bounds];
  [self.view setVisible:NO];
  [self.window addSubview:self.view];
}

- (void)tearDown
{
  [self.view removeFromSuperview];
  [self.view prepareForRecycle];
  [self.view.presentations removeAllObjects];
  [self.view.dismissals removeAllObjects];
  self.view = nil;
  self.window = nil;
  [super tearDown];
}

- (void)testSynchronousTransitionsCanBeRepeated
{
  self.view.completeSynchronously = YES;
  [self.view setVisible:YES];
  [self.view setVisible:NO];
  [self.view setVisible:YES];
  [self.view setVisible:NO];
  XCTAssertEqual(self.view.presentedControllers.count, 2u);
  XCTAssertEqual(self.view.dismissedControllers.count, 2u);
  XCTAssertEqual(self.view.presentations.count, 0u);
  XCTAssertEqual(self.view.dismissals.count, 0u);
}

- (void)testHideWaitsForPresentationToComplete
{
  [self.view setVisible:YES];
  [self.view setVisible:NO];
  XCTAssertEqual(self.view.presentedControllers.count, 1u);
  XCTAssertEqual(self.view.dismissedControllers.count, 0u);
  [self.view completePresentation];
  XCTAssertEqual(self.view.dismissedControllers.count, 1u);
  [self.view completeDismissal];
}

- (void)testReopenWaitsForDismissalToComplete
{
  [self.view setVisible:YES];
  [self.view completePresentation];
  [self.view setVisible:NO];
  [self.view setVisible:YES];
  XCTAssertEqual(self.view.presentedControllers.count, 1u);
  [self.view completeDismissal];
  XCTAssertEqual(self.view.presentedControllers.count, 2u);
  [self.view completePresentation];
}

- (void)testFinalHiddenRequestCancelsPendingReopen
{
  [self.view setVisible:YES];
  [self.view completePresentation];
  [self.view setVisible:NO];
  [self.view setVisible:YES];
  [self.view setVisible:NO];
  XCTAssertEqual(self.view.dismissedControllers.count, 1u);
  [self.view completeDismissal];
  XCTAssertEqual(self.view.presentedControllers.count, 1u);
}

- (void)testFinalVisibleRequestCancelsPendingHide
{
  [self.view setVisible:YES];
  [self.view setVisible:NO];
  [self.view setVisible:YES];
  [self.view completePresentation];
  XCTAssertEqual(self.view.presentedControllers.count, 1u);
  XCTAssertEqual(self.view.dismissedControllers.count, 0u);
}

- (void)testDetachingDuringPresentationDismissesAfterCompletion
{
  [self.view setVisible:YES];
  [self.view removeFromSuperview];
  XCTAssertEqual(self.view.dismissedControllers.count, 0u);
  [self.view completePresentation];
  XCTAssertEqual(self.view.dismissedControllers.count, 1u);
  [self.view completeDismissal];
}

- (void)testRecyclingPresentedHostDismissesItsController
{
  [self.view setVisible:YES];
  [self.view completePresentation];
  [self.view prepareForRecycle];
  XCTAssertEqual(self.view.dismissedControllers.count, 1u);
  XCTAssertEqual(self.view.dismissedControllers.firstObject, self.view.presentedControllers.firstObject);
}

- (void)testOldPresentationCompletionCleansUpOnlyItsControllerAfterReuse
{
  [self.view setVisible:YES];
  UIViewController *oldController = self.view.presentedControllers.firstObject;
  [self.view prepareForRecycle];
  [self.view setVisible:YES];
  UIViewController *newController = self.view.presentedControllers.lastObject;
  XCTAssertNotEqual(oldController, newController);
  [self.view completePresentation];
  XCTAssertEqual(self.view.dismissedControllers.count, 1u);
  XCTAssertEqual(self.view.dismissedControllers.firstObject, oldController);
  [self.view setVisible:NO];
  XCTAssertEqual(self.view.dismissedControllers.count, 1u);
  [self.view completePresentation];
  XCTAssertEqual(self.view.dismissedControllers.count, 2u);
  XCTAssertEqual(self.view.dismissedControllers.lastObject, newController);
  [self.view completeDismissal];
}

- (void)testOldDismissalCompletionDoesNotChangeReusedHost
{
  [self.view setVisible:YES];
  [self.view completePresentation];
  [self.view setVisible:NO];
  [self.view prepareForRecycle];
  [self.view setVisible:YES];
  [self.view completeDismissal];
  [self.view setVisible:NO];
  XCTAssertEqual(self.view.dismissedControllers.count, 1u);
  [self.view completePresentation];
  XCTAssertEqual(self.view.dismissedControllers.count, 2u);
  [self.view completeDismissal];
}

@end

#endif
