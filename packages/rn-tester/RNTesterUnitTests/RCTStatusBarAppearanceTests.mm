/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import <React/RCTFabricModalHostViewController.h>
#import <React/RCTStatusBarAppearance.h>
#import <React/RCTStatusBarManager.h>
#import <React/RCTUtils.h>
#import <React/RCTUtilsUIOverride.h>

@interface RCTFabricModalHostViewController ()
- (void)captureStatusBarAppearance;
@end

@interface RCTStatusBarManager (RCTStatusBarAppearanceTests)
- (void)setStyle:(NSString *)style animated:(BOOL)animated;
- (void)setHidden:(BOOL)hidden withAnimation:(NSString *)withAnimation;
@end

@interface RCTStatusBarAppearanceTestViewController : UIViewController
@property (nonatomic, assign) NSUInteger updateCount;
@end

@implementation RCTStatusBarAppearanceTestViewController

- (void)setNeedsStatusBarAppearanceUpdate
{
  [super setNeedsStatusBarAppearanceUpdate];
  self.updateCount++;
}

@end

@interface RCTStatusBarAppearanceTests : XCTestCase
@end

@implementation RCTStatusBarAppearanceTests {
  UIStatusBarStyle _initialStyle;
  BOOL _initialHidden;
  UIStatusBarAnimation _initialAnimation;
  RCTStatusBarAppearanceTestViewController *_viewController;
}

- (void)setUp
{
  [super setUp];
  _initialStyle = RCTStatusBarAppearance.style;
  _initialHidden = RCTStatusBarAppearance.hidden;
  _initialAnimation = RCTStatusBarAppearance.updateAnimation;
  _viewController = [RCTStatusBarAppearanceTestViewController new];
  [RCTUtilsUIOverride setPresentedViewController:_viewController];
}

- (void)tearDown
{
  [RCTUtilsUIOverride setPresentedViewController:nil];
  [RCTStatusBarAppearance setStyle:_initialStyle animated:NO];
  [RCTStatusBarAppearance setHidden:_initialHidden withAnimation:_initialAnimation];
  [super tearDown];
}

- (void)waitForMainQueue
{
  XCTestExpectation *expectation = [self expectationWithDescription:@"main queue"];
  dispatch_async(dispatch_get_main_queue(), ^{
    [expectation fulfill];
  });
  [self waitForExpectations:@[ expectation ] timeout:1];
}

- (void)testSetStyleStoresStyle
{
  [RCTStatusBarAppearance setStyle:UIStatusBarStyleLightContent animated:NO];
  XCTAssertEqual(RCTStatusBarAppearance.style, UIStatusBarStyleLightContent);

  [RCTStatusBarAppearance setStyle:UIStatusBarStyleDarkContent animated:YES];
  XCTAssertEqual(RCTStatusBarAppearance.style, UIStatusBarStyleDarkContent);
}

- (void)testSetHiddenStoresHiddenAndAnimation
{
  [RCTStatusBarAppearance setHidden:YES withAnimation:UIStatusBarAnimationSlide];
  XCTAssertTrue(RCTStatusBarAppearance.hidden);
  XCTAssertEqual(RCTStatusBarAppearance.updateAnimation, UIStatusBarAnimationSlide);

  [RCTStatusBarAppearance setHidden:NO withAnimation:UIStatusBarAnimationFade];
  XCTAssertFalse(RCTStatusBarAppearance.hidden);
  XCTAssertEqual(RCTStatusBarAppearance.updateAnimation, UIStatusBarAnimationFade);
}

- (void)testSetStyleDoesNotChangeUpdateAnimation
{
  [RCTStatusBarAppearance setHidden:NO withAnimation:UIStatusBarAnimationSlide];
  [RCTStatusBarAppearance setStyle:UIStatusBarStyleLightContent animated:YES];
  XCTAssertEqual(RCTStatusBarAppearance.updateAnimation, UIStatusBarAnimationSlide);
}

- (void)testUpdateTargetsPresentedViewController
{
  [RCTStatusBarAppearance setStyle:UIStatusBarStyleLightContent animated:NO];
  XCTAssertEqual(_viewController.updateCount, 1u);

  [RCTStatusBarAppearance setHidden:YES withAnimation:UIStatusBarAnimationNone];
  XCTAssertEqual(_viewController.updateCount, 2u);
}

- (void)testAnimatedUpdateTargetsPresentedViewController
{
  [RCTStatusBarAppearance setStyle:UIStatusBarStyleLightContent animated:YES];
  XCTAssertEqual(_viewController.updateCount, 1u);

  [RCTStatusBarAppearance setHidden:YES withAnimation:UIStatusBarAnimationFade];
  XCTAssertEqual(_viewController.updateCount, 2u);
}

- (void)testLastHiddenCallWins
{
  [RCTStatusBarAppearance setHidden:YES withAnimation:UIStatusBarAnimationSlide];
  [RCTStatusBarAppearance setHidden:NO withAnimation:UIStatusBarAnimationSlide];
  XCTAssertFalse(RCTStatusBarAppearance.hidden);
  XCTAssertEqual(_viewController.updateCount, 2u);
}

- (void)testStatusBarManagerSetStyleUpdatesAppearance
{
  [[RCTStatusBarManager new] setStyle:@"light-content" animated:NO];
  [self waitForMainQueue];
  XCTAssertEqual(RCTStatusBarAppearance.style, UIStatusBarStyleLightContent);
  XCTAssertEqual(_viewController.updateCount, 1u);
}

- (void)testStatusBarManagerSetHiddenUpdatesAppearance
{
  [[RCTStatusBarManager new] setHidden:YES withAnimation:@"fade"];
  [self waitForMainQueue];
  XCTAssertTrue(RCTStatusBarAppearance.hidden);
  XCTAssertEqual(RCTStatusBarAppearance.updateAnimation, UIStatusBarAnimationFade);
  XCTAssertEqual(_viewController.updateCount, 1u);
}

- (void)testUnknownStyleFallsBackToDefault
{
  [[RCTStatusBarManager new] setStyle:@"light-content" animated:NO];
  [self waitForMainQueue];
  XCTAssertEqual(RCTStatusBarAppearance.style, UIStatusBarStyleLightContent);

  [[RCTStatusBarManager new] setStyle:@"not-a-style" animated:NO];
  [self waitForMainQueue];
  XCTAssertEqual(RCTStatusBarAppearance.style, UIStatusBarStyleDefault);
}

- (void)testDefaultRootViewControllerReportsAppearance
{
  UIViewController *rootViewController = [[RCTDefaultReactNativeFactoryDelegate new] createRootViewController];

  [RCTStatusBarAppearance setStyle:UIStatusBarStyleLightContent animated:NO];
  [RCTStatusBarAppearance setHidden:YES withAnimation:UIStatusBarAnimationSlide];

  XCTAssertEqual(rootViewController.preferredStatusBarStyle, UIStatusBarStyleLightContent);
  XCTAssertTrue(rootViewController.prefersStatusBarHidden);
  XCTAssertEqual(rootViewController.preferredStatusBarUpdateAnimation, UIStatusBarAnimationSlide);
}

- (void)testModalKeepsStatusBarCapturedBeforePresentation
{
  UIStatusBarManager *sceneStatusBar = RCTUIStatusBarManager();
  [RCTStatusBarAppearance setStyle:UIStatusBarStyleLightContent animated:NO];
  [RCTStatusBarAppearance setHidden:YES withAnimation:UIStatusBarAnimationNone];
  XCTAssertNotEqual(sceneStatusBar.statusBarStyle, UIStatusBarStyleLightContent);
  XCTAssertFalse(sceneStatusBar.isStatusBarHidden);

  RCTFabricModalHostViewController *modalViewController = [RCTFabricModalHostViewController new];
  [modalViewController captureStatusBarAppearance];

  XCTAssertEqual(modalViewController.preferredStatusBarStyle, sceneStatusBar.statusBarStyle);
  XCTAssertFalse(modalViewController.prefersStatusBarHidden);
}

- (void)testModalViewControllerReportsAppearance
{
  RCTFabricModalHostViewController *modalViewController = [RCTFabricModalHostViewController new];
  [modalViewController captureStatusBarAppearance];

  [RCTStatusBarAppearance setStyle:UIStatusBarStyleLightContent animated:NO];
  [RCTStatusBarAppearance setHidden:YES withAnimation:UIStatusBarAnimationSlide];

  XCTAssertEqual(modalViewController.preferredStatusBarStyle, UIStatusBarStyleLightContent);
  XCTAssertTrue(modalViewController.prefersStatusBarHidden);
  XCTAssertEqual(modalViewController.preferredStatusBarUpdateAnimation, UIStatusBarAnimationSlide);
}

@end
