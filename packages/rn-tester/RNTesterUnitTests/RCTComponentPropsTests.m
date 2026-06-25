/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>
#import <React/RCTShadowView.h>
#import <React/RCTUIManager.h>
#import <React/RCTView.h>
#import <React/RCTViewManager.h>

@interface RCTUIManager ()

- (void)createView:(NSNumber *)reactTag
          viewName:(NSString *)viewName
           rootTag:(NSNumber *)rootTag
             props:(NSDictionary *)props;

- (void)updateView:(nonnull NSNumber *)reactTag viewName:(NSString *)viewName props:(NSDictionary *)props;

@property (nonatomic, copy, readonly) NSMutableDictionary<NSNumber *, RCTShadowView *> *shadowViewRegistry;

@end

@interface RCTPropsTestView : UIView

@property (nonatomic, assign) NSInteger integerProp;
@property (nonatomic, strong) id objectProp;
@property (nonatomic, assign) CGPoint structProp;
@property (nonatomic, copy) NSString *customProp;

@end

@implementation RCTPropsTestView
@end

@interface RCTPropsTestViewManager : RCTViewManager
@end

@implementation RCTPropsTestViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RCTPropsTestView *view = [RCTPropsTestView new];
  view.integerProp = 57;
  view.objectProp = @9;
  view.structProp = CGPointMake(5, 6);
  view.customProp = @"Hello";
  return view;
}

RCT_EXPORT_VIEW_PROPERTY(integerProp, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(objectProp, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(structProp, CGPoint)
RCT_CUSTOM_VIEW_PROPERTY(customProp, NSString, RCTPropsTestView)
{
  view.customProp = json ? [RCTConvert NSString:json] : defaultView.customProp;
}

@end

@interface RCTComponentPropsTests : XCTestCase

@end

@implementation RCTComponentPropsTests {
  RCTBridge *_bridge;
  NSNumber *_rootViewReactTag;
}

- (void)setUp
{
  [super setUp];

  XCTSkip(@"Skipping RCTComponentPropsTests since they rely on deprecated RCTBridge functionality.");

  NSBundle *bundle = [NSBundle bundleForClass:[self class]];
  _bridge = [[RCTBridge alloc] initWithBundleURL:[bundle URLForResource:@"RNTesterUnitTestsBundle" withExtension:@"js"]
                                  moduleProvider:nil
                                   launchOptions:nil];

  _rootViewReactTag = @1;
  RCTUIManager *uiManager = _bridge.uiManager;

  dispatch_async(uiManager.methodQueue, ^{
    RCTShadowView *rootShadowView = [RCTShadowView new];
    rootShadowView.reactTag = self->_rootViewReactTag;
    uiManager.shadowViewRegistry[rootShadowView.reactTag] = rootShadowView;
  });

  RCT_RUN_RUNLOOP_WHILE(_bridge.isLoading);
}

- (void)testSetProps
{
  __block RCTPropsTestView *view;
  RCTUIManager *uiManager = _bridge.uiManager;
  NSDictionary *props =
      @{@"integerProp" : @58, @"objectProp" : @10, @"structProp" : @{@"x" : @7, @"y" : @8}, @"customProp" : @"Goodbye"};

  dispatch_async(uiManager.methodQueue, ^{
    [uiManager createView:@2 viewName:@"RCTPropsTestView" rootTag:self->_rootViewReactTag props:props];
    [uiManager addUIBlock:^(__unused RCTUIManager *_uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      view = (RCTPropsTestView *)viewRegistry[@2];
      XCTAssertEqual(view.integerProp, 58);
      XCTAssertEqualObjects(view.objectProp, @10);
      XCTAssertTrue(CGPointEqualToPoint(view.structProp, CGPointMake(7, 8)));
      XCTAssertEqualObjects(view.customProp, @"Goodbye");
    }];
    [uiManager setNeedsLayout];
  });

  RCT_RUN_RUNLOOP_WHILE(view == nil);
}

- (void)testNeedsOffscreenAlphaCompositing
{
  __block RCTPropsTestView *view;
  RCTUIManager *uiManager = _bridge.uiManager;

  XCTestExpectation *initialExpectation = [self expectationWithDescription:@"initial expectation"];
  XCTestExpectation *updateExpectation = [self expectationWithDescription:@"second expectation"];

  dispatch_async(uiManager.methodQueue, ^{
    [uiManager createView:@2 viewName:@"RCTPropsTestView" rootTag:self->_rootViewReactTag props:@{}];
    [uiManager addUIBlock:^(__unused RCTUIManager *_uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      view = (RCTPropsTestView *)viewRegistry[@2];
      XCTAssertEqual(view.layer.allowsGroupOpacity, TRUE);
      [initialExpectation fulfill];
    }];
    [uiManager updateView:@2 viewName:@"RCTPropsTestView" props:@{@"needsOffscreenAlphaCompositing" : @NO}];
    [uiManager addUIBlock:^(__unused RCTUIManager *_uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      view = (RCTPropsTestView *)viewRegistry[@2];
      XCTAssertEqual(view.layer.allowsGroupOpacity, FALSE);
      [updateExpectation fulfill];
    }];
    [uiManager setNeedsLayout];
  });

  [self waitForExpectations:@[ initialExpectation, updateExpectation ] timeout:0.1];
}

- (void)testResetProps
{
  __block RCTPropsTestView *view;
  RCTUIManager *uiManager = _bridge.uiManager;
  NSDictionary *props =
      @{@"integerProp" : @58, @"objectProp" : @10, @"structProp" : @{@"x" : @7, @"y" : @8}, @"customProp" : @"Goodbye"};

  NSDictionary *resetProps = @{
    @"integerProp" : [NSNull null],
    @"objectProp" : [NSNull null],
    @"structProp" : [NSNull null],
    @"customProp" : [NSNull null]
  };

  dispatch_async(uiManager.methodQueue, ^{
    [uiManager createView:@2 viewName:@"RCTPropsTestView" rootTag:self->_rootViewReactTag props:props];
    [uiManager updateView:@2 viewName:@"RCTPropsTestView" props:resetProps];
    [uiManager addUIBlock:^(__unused RCTUIManager *_uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      view = (RCTPropsTestView *)viewRegistry[@2];
      XCTAssertEqual(view.integerProp, 57);
      XCTAssertEqualObjects(view.objectProp, @9);
      XCTAssertTrue(CGPointEqualToPoint(view.structProp, CGPointMake(5, 6)));
      XCTAssertEqualObjects(view.customProp, @"Hello");
    }];
    [uiManager setNeedsLayout];
  });

  RCT_RUN_RUNLOOP_WHILE(view == nil);
}

- (void)testResetBackgroundColor
{
  __block RCTView *view;
  RCTUIManager *uiManager = _bridge.uiManager;
  NSDictionary *props = @{@"backgroundColor" : @0xffffffff};
  NSDictionary *resetProps = @{@"backgroundColor" : [NSNull null]};

  dispatch_async(uiManager.methodQueue, ^{
    [uiManager createView:@2 viewName:@"RCTView" rootTag:self->_rootViewReactTag props:props];
    [uiManager addUIBlock:^(__unused RCTUIManager *_uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      view = (RCTView *)viewRegistry[@2];
      XCTAssertEqualObjects(view.backgroundColor, [RCTConvert UIColor:@0xffffffff]);
    }];
    [uiManager updateView:@2 viewName:@"RCTView" props:resetProps];
    [uiManager
        addUIBlock:^(__unused RCTUIManager *_uiManager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
          view = (RCTView *)viewRegistry[@2];
          XCTAssertNil(view.backgroundColor);
        }];
    [uiManager setNeedsLayout];
  });

  RCT_RUN_RUNLOOP_WHILE(view == nil);
}

@end
