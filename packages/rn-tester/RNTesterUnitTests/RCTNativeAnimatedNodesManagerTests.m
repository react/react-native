/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import "OCMock/OCMock.h"

#import <React/RCTNativeAnimatedNodesManager.h>
#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTValueAnimatedNode.h>

static const NSTimeInterval FRAME_LENGTH = 1.0 / 60.0;

@interface RCTFakeDisplayLink : CADisplayLink

@end

@implementation RCTFakeDisplayLink {
  NSTimeInterval _timestamp;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _timestamp = 1124.1234143251; // Random
  }
  return self;
}

- (NSTimeInterval)timestamp
{
  _timestamp += FRAME_LENGTH;
  return _timestamp;
}

@end

@interface RCTFakeValueObserver : NSObject <RCTValueAnimatedNodeObserver>

@property (nonatomic, strong) NSMutableArray<NSNumber *> *calls;

@end

@implementation RCTFakeValueObserver

- (instancetype)init
{
  self = [super init];
  if (self) {
    _calls = [NSMutableArray new];
  }
  return self;
}

- (void)animatedNode:(__unused RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [_calls addObject:@(value)];
}

@end

@interface RCTFakeEvent : NSObject <RCTEvent>

@end

@implementation RCTFakeEvent {
  NSArray *_arguments;
}

@synthesize eventName = _eventName;
@synthesize viewTag = _viewTag;
@synthesize coalescingKey = _coalescingKey;

- (instancetype)initWithName:(NSString *)name viewTag:(NSNumber *)viewTag arguments:(NSArray *)arguments
{
  self = [super init];
  if (self) {
    _eventName = name;
    _viewTag = viewTag;
    _arguments = arguments;
  }
  return self;
}

- (NSArray *)arguments
{
  return _arguments;
}

RCT_NOT_IMPLEMENTED(+(NSString *)moduleDotMethod);
RCT_NOT_IMPLEMENTED(-(BOOL)canCoalesce);
RCT_NOT_IMPLEMENTED(-(id<RCTEvent>)coalesceWithEvent : (id<RCTEvent>)newEvent);

@end

static id RCTPropChecker(NSString *prop, NSNumber *value)
{
  return [OCMArg checkWithBlock:^BOOL(NSDictionary<NSString *, NSNumber *> *props) {
    BOOL match = fabs(props[prop].doubleValue - value.doubleValue) < FLT_EPSILON;
    if (!match) {
      NSLog(@"Props `%@` with value `%@` is not close to `%@`", prop, props[prop], value);
    }
    return match;
  }];
}

@interface RCTNativeAnimatedNodesManagerTests : XCTestCase

@end

@implementation RCTNativeAnimatedNodesManagerTests {
  id _surfacePresenter;
  RCTNativeAnimatedNodesManager *_nodesManager;
  RCTFakeDisplayLink *_displayLink;
}

- (void)setUp
{
  [super setUp];

  _surfacePresenter = [OCMockObject niceMockForProtocol:@protocol(RCTSurfacePresenterStub)];
  _nodesManager = [[RCTNativeAnimatedNodesManager alloc] initWithSurfacePresenter:_surfacePresenter];
  _displayLink = [RCTFakeDisplayLink new];
}

/**
 * Generates a simple animated nodes graph and attaches the props node to a given viewTag
 * Parameter opacity is used as a initial value for the "opacity" attribute.
 *
 * Nodes are connected as follows (nodes IDs in parens):
 * ValueNode(1) -> StyleNode(3) -> PropNode(5)
 */
- (void)createSimpleAnimatedView:(NSNumber *)viewTag withOpacity:(CGFloat)opacity
{
  [_nodesManager createAnimatedNode:@101 config:@{@"type" : @"value", @"value" : @(opacity), @"offset" : @0}];
  [_nodesManager createAnimatedNode:@201 config:@{@"type" : @"style", @"style" : @{@"opacity" : @101}}];
  [_nodesManager createAnimatedNode:@301 config:@{@"type" : @"props", @"props" : @{@"style" : @201}}];

  [_nodesManager connectAnimatedNodes:@101 childTag:@201];
  [_nodesManager connectAnimatedNodes:@201 childTag:@301];
  [_nodesManager connectAnimatedNodeToView:@301 viewTag:viewTag];
}

- (void)testFramesAnimation
{
  [self createSimpleAnimatedView:@1002 withOpacity:0];
  NSArray<NSNumber *> *frames = @[ @0, @0.2, @0.4, @0.6, @0.8, @1 ];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@101
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @1}
                        endCallback:nil];

  for (NSNumber *frame in frames) {
    [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:@1002 props:RCTPropChecker(@"opacity", frame)];
    [_nodesManager stepAnimations:_displayLink];
    [_surfacePresenter verify];
  }

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:@1002 props:RCTPropChecker(@"opacity", @1)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

- (void)testFramesAnimationLoop
{
  [self createSimpleAnimatedView:@1002 withOpacity:0];
  NSArray<NSNumber *> *frames = @[ @0, @0.2, @0.4, @0.6, @0.8, @1 ];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@101
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @1, @"iterations" : @5}
                        endCallback:nil];

  for (NSUInteger it = 0; it < 5; it++) {
    for (NSNumber *frame in frames) {
      [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:@1002 props:RCTPropChecker(@"opacity", frame)];
      [_nodesManager stepAnimations:_displayLink];
      [_surfacePresenter verify];
    }
  }

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:@1002 props:RCTPropChecker(@"opacity", @1)];

  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

- (void)testNodeValueListenerIfNotListening
{
  NSNumber *nodeId = @101;
  [self createSimpleAnimatedView:@1002 withOpacity:0];
  NSArray<NSNumber *> *frames = @[ @0, @0.2, @0.4, @0.6, @0.8, @1 ];

  RCTFakeValueObserver *observer = [RCTFakeValueObserver new];
  [_nodesManager startListeningToAnimatedNodeValue:nodeId valueObserver:observer];

  [_nodesManager startAnimatingNode:@1
                            nodeTag:nodeId
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @1}
                        endCallback:nil];

  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(observer.calls.count, 1UL);
  XCTAssertEqualObjects(observer.calls[0], @0);

  [_nodesManager stopListeningToAnimatedNodeValue:nodeId];

  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(observer.calls.count, 1UL);
}

- (void)testNodeValueListenerIfListening
{
  NSNumber *nodeId = @101;
  [self createSimpleAnimatedView:@1002 withOpacity:0];
  NSArray<NSNumber *> *frames = @[ @0, @0.2, @0.4, @0.6, @0.8, @1 ];

  RCTFakeValueObserver *observer = [RCTFakeValueObserver new];
  [_nodesManager startListeningToAnimatedNodeValue:nodeId valueObserver:observer];

  [_nodesManager startAnimatingNode:@1
                            nodeTag:nodeId
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @1}
                        endCallback:nil];

  for (NSUInteger i = 0; i < frames.count; i++) {
    [_nodesManager stepAnimations:_displayLink];
    XCTAssertEqual(observer.calls.count, i + 1);
    XCTAssertEqualWithAccuracy(observer.calls[i].doubleValue, frames[i].doubleValue, FLT_EPSILON);
  }

  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(observer.calls.count, 7UL);
  XCTAssertEqualObjects(observer.calls[6], @1);

  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(observer.calls.count, 7UL);
}

- (void)performSpringAnimationTestWithConfig:(NSDictionary *)config isCriticallyDamped:(BOOL)testForCriticallyDamped
{
  [self createSimpleAnimatedView:@1002 withOpacity:0];
  [_nodesManager startAnimatingNode:@1 nodeTag:@101 config:config endCallback:nil];

  BOOL wasGreaterThanOne = NO;
  CGFloat previousValue = 0;
  __block CGFloat currentValue;
  [[[_surfacePresenter stub] andDo:^(NSInvocation *invocation) {
    __unsafe_unretained NSDictionary<NSString *, NSNumber *> *props;
    [invocation getArgument:&props atIndex:3];
    currentValue = props[@"opacity"].doubleValue;
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];

  // Run for 3 seconds.
  for (NSUInteger i = 0; i < 3 * 60; i++) {
    [_nodesManager stepAnimations:_displayLink];

    if (currentValue > 1) {
      wasGreaterThanOne = YES;
    }

    // Verify that animation step is relatively small.
    XCTAssertLessThan(fabs(currentValue - previousValue), 0.12);

    previousValue = currentValue;
  }

  // Verify that we've reach the final value at the end of animation.
  XCTAssertEqual(previousValue, 1.0);

  // Verify that value has reached some maximum value that is greater than the final value (bounce).
  if (testForCriticallyDamped) {
    XCTAssertFalse(wasGreaterThanOne);
  } else {
    XCTAssertTrue(wasGreaterThanOne);
  }

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

- (void)testUnderdampedSpringAnimation
{
  [self performSpringAnimationTestWithConfig:@{
    @"type" : @"spring",
    @"stiffness" : @230.3,
    @"damping" : @22,
    @"mass" : @1,
    @"initialVelocity" : @0,
    @"toValue" : @1,
    @"restSpeedThreshold" : @0.001,
    @"restDisplacementThreshold" : @0.001,
    @"overshootClamping" : @NO
  }
                          isCriticallyDamped:NO];
}

- (void)testCritcallyDampedSpringAnimation
{
  [self performSpringAnimationTestWithConfig:@{
    @"type" : @"spring",
    @"stiffness" : @1000,
    @"damping" : @500,
    @"mass" : @3,
    @"initialVelocity" : @0,
    @"toValue" : @1,
    @"restSpeedThreshold" : @0.001,
    @"restDisplacementThreshold" : @0.001,
    @"overshootClamping" : @NO
  }
                          isCriticallyDamped:YES];
}

- (void)testDecayAnimation
{
  [self createSimpleAnimatedView:@1002 withOpacity:0];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@101
                             config:@{@"type" : @"decay", @"velocity" : @0.5, @"deceleration" : @0.998}
                        endCallback:nil];

  __block CGFloat previousValue;
  __block CGFloat currentValue;
  CGFloat previousDiff = CGFLOAT_MAX;

  [_nodesManager stepAnimations:_displayLink];

  [[[_surfacePresenter stub] andDo:^(NSInvocation *invocation) {
    __unsafe_unretained NSDictionary<NSString *, NSNumber *> *props;
    [invocation getArgument:&props atIndex:3];
    currentValue = props[@"opacity"].doubleValue;
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];

  // Run 3 secs of animation.
  for (NSUInteger i = 0; i < 3 * 60; i++) {
    [_nodesManager stepAnimations:_displayLink];
    CGFloat currentDiff = currentValue - previousValue;
    // Verify monotonicity.
    // Greater *or equal* because the animation stops during these 3 seconds.
    XCTAssertGreaterThanOrEqual(currentValue, previousValue);
    // Verify decay.
    XCTAssertLessThanOrEqual(currentDiff, previousDiff);
    previousValue = currentValue;
    previousDiff = currentDiff;
  }

  // Should be done in 3 secs.
  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

- (void)testDecayAnimationLoop
{
  [self createSimpleAnimatedView:@1002 withOpacity:0];
  [_nodesManager
      startAnimatingNode:@1
                 nodeTag:@101
                  config:@{@"type" : @"decay", @"velocity" : @0.5, @"deceleration" : @0.998, @"iterations" : @5}
             endCallback:nil];

  __block CGFloat previousValue;
  __block CGFloat currentValue;
  BOOL didComeToRest = NO;
  NSUInteger numberOfResets = 0;

  [[[_surfacePresenter stub] andDo:^(NSInvocation *invocation) {
    __unsafe_unretained NSDictionary<NSString *, NSNumber *> *props;
    [invocation getArgument:&props atIndex:3];
    currentValue = props[@"opacity"].doubleValue;
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];

  // Run 3 secs of animation five times.
  for (NSUInteger i = 0; i < 3 * 60 * 5; i++) {
    [_nodesManager stepAnimations:_displayLink];

    // Verify monotonicity when not resetting the animation.
    // Greater *or equal* because the animation stops during these 3 seconds.
    if (!didComeToRest) {
      XCTAssertGreaterThanOrEqual(currentValue, previousValue);
    }

    if (didComeToRest && currentValue != previousValue) {
      numberOfResets++;
      didComeToRest = NO;
    }

    // Test if animation has come to rest using the 0.1 threshold from DecayAnimation.m.
    didComeToRest = fabs(currentValue - previousValue) < 0.1;
    previousValue = currentValue;
  }

  // The animation should have reset 4 times.
  XCTAssertEqual(numberOfResets, 4u);

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

- (void)testSpringAnimationLoop
{
  [self createSimpleAnimatedView:@1002 withOpacity:0];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@101
                             config:@{
                               @"type" : @"spring",
                               @"iterations" : @5,
                               @"stiffness" : @230.2,
                               @"damping" : @22,
                               @"mass" : @1,
                               @"initialVelocity" : @0,
                               @"toValue" : @1,
                               @"restSpeedThreshold" : @0.001,
                               @"restDisplacementThreshold" : @0.001,
                               @"overshootClamping" : @NO
                             }
                        endCallback:nil];

  BOOL didComeToRest = NO;
  CGFloat previousValue = 0;
  NSUInteger numberOfResets = 0;
  __block CGFloat currentValue;
  [[[_surfacePresenter stub] andDo:^(NSInvocation *invocation) {
    __unsafe_unretained NSDictionary<NSString *, NSNumber *> *props;
    [invocation getArgument:&props atIndex:3];
    currentValue = props[@"opacity"].doubleValue;
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];

  // Run for 3 seconds five times.
  for (NSUInteger i = 0; i < 3 * 60 * 5; i++) {
    [_nodesManager stepAnimations:_displayLink];

    if (!didComeToRest) {
      // Verify that animation step is relatively small.
      XCTAssertLessThan(fabs(currentValue - previousValue), 0.12);
    }

    // Test to see if it reset after coming to rest
    if (didComeToRest && currentValue == 0) {
      didComeToRest = NO;
      numberOfResets++;
    }

    // Record that the animation did come to rest when it rests on toValue.
    didComeToRest = fabs(currentValue - 1) < 0.001 && fabs(currentValue - previousValue) < 0.001;

    previousValue = currentValue;
  }

  // Verify that value reset 4 times after finishing a full animation and is currently resting.
  XCTAssertEqual(numberOfResets, 4u);
  XCTAssertTrue(didComeToRest);

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

- (void)testAnimationCallbackFinish
{
  [self createSimpleAnimatedView:@1002 withOpacity:0];
  NSArray<NSNumber *> *frames = @[ @0, @1 ];

  __block NSInteger endCallbackCalls = 0;

  RCTResponseSenderBlock endCallback = ^(NSArray *response) {
    endCallbackCalls++;
    NSArray *expected = @[ @{@"finished" : @YES, @"value" : @1} ];
    XCTAssertEqualObjects(response, expected);
  };

  [_nodesManager startAnimatingNode:@1
                            nodeTag:@101
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @1}
                        endCallback:endCallback];

  [_nodesManager stepAnimations:_displayLink];
  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(endCallbackCalls, 0);
  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(endCallbackCalls, 1);
  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(endCallbackCalls, 1);
}

/**
 * Creates a following graph of nodes:
 * Value(1, firstValue) ----> Add(3) ---> Style(4) ---> Props(5) ---> View(viewTag)
 *                         |
 * Value(2, secondValue) --+
 *
 * Add(3) node maps to a "translateX" attribute of the Style(4) node.
 */
- (void)createAnimatedGraphWithAdditionNode:(NSNumber *)viewTag
                                 firstValue:(CGFloat)firstValue
                                secondValue:(CGFloat)secondValue
{
  [_nodesManager createAnimatedNode:@101 config:@{@"type" : @"value", @"value" : @(firstValue), @"offset" : @0}];
  [_nodesManager createAnimatedNode:@201 config:@{@"type" : @"value", @"value" : @(secondValue), @"offset" : @0}];
  [_nodesManager createAnimatedNode:@301 config:@{@"type" : @"addition", @"input" : @[ @101, @201 ]}];
  [_nodesManager createAnimatedNode:@401 config:@{@"type" : @"style", @"style" : @{@"translateX" : @301}}];
  [_nodesManager createAnimatedNode:@501 config:@{@"type" : @"props", @"props" : @{@"style" : @401}}];

  [_nodesManager connectAnimatedNodes:@101 childTag:@301];
  [_nodesManager connectAnimatedNodes:@201 childTag:@301];
  [_nodesManager connectAnimatedNodes:@301 childTag:@401];
  [_nodesManager connectAnimatedNodes:@401 childTag:@501];
  [_nodesManager connectAnimatedNodeToView:@501 viewTag:viewTag];
}

- (void)testAdditionNode
{
  NSNumber *viewTag = @52;
  [self createAnimatedGraphWithAdditionNode:viewTag firstValue:100 secondValue:1000];

  NSArray<NSNumber *> *frames = @[ @0, @1 ];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@101
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @101}
                        endCallback:nil];
  [_nodesManager startAnimatingNode:@2
                            nodeTag:@201
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @1010}
                        endCallback:nil];

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"translateX", @1100)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"translateX", @1111)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"translateX", @1111)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

/**
 * Verifies that views are updated properly when one of the addition input nodes has started animating
 * while the other one has not.
 *
 * We expect that the output of the addition node will take the starting value of the second input
 * node even though the node hasn't been connected to an active animation driver.
 */
- (void)testViewReceiveUpdatesIfOneOfAnimationHasntStarted
{
  NSNumber *viewTag = @52;
  [self createAnimatedGraphWithAdditionNode:viewTag firstValue:100 secondValue:1000];

  NSArray<NSNumber *> *frames = @[ @0, @1 ];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@101
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @101}
                        endCallback:nil];

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"translateX", @1100)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"translateX", @1101)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"translateX", @1101)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

/**
 * Verifies that views are updated properly when one of the addition input nodes animation finishes
 * before the other.
 *
 * We expect that the output of the addition node after one of the animation has finished will
 * take the last value of the animated node and the view will receive updates up until the second
 * animation is over.
 */
- (void)testViewReceiveUpdatesWhenOneOfAnimationHasFinished
{
  NSNumber *viewTag = @52;
  [self createAnimatedGraphWithAdditionNode:viewTag firstValue:100 secondValue:1000];

  NSArray<NSNumber *> *firstFrames = @[ @0, @1 ];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@101
                             config:@{@"type" : @"frames", @"frames" : firstFrames, @"toValue" : @200}
                        endCallback:nil];
  NSArray<NSNumber *> *secondFrames = @[ @0, @0.2, @0.4, @0.6, @0.8, @1 ];
  [_nodesManager startAnimatingNode:@2
                            nodeTag:@201
                             config:@{@"type" : @"frames", @"frames" : secondFrames, @"toValue" : @1010}
                        endCallback:nil];

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"translateX", @1100)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  for (NSUInteger i = 1; i < secondFrames.count; i++) {
    CGFloat expected = 1200.0 + secondFrames[i].doubleValue * 10.0;
    [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag
                                                            props:RCTPropChecker(@"translateX", @(expected))];
    [_nodesManager stepAnimations:_displayLink];
    [_surfacePresenter verify];
  }

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"translateX", @1210)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

- (void)testMultiplicationNode
{
  NSNumber *viewTag = @52;
  [_nodesManager createAnimatedNode:@101 config:@{@"type" : @"value", @"value" : @1, @"offset" : @0}];
  [_nodesManager createAnimatedNode:@201 config:@{@"type" : @"value", @"value" : @5, @"offset" : @0}];
  [_nodesManager createAnimatedNode:@301 config:@{@"type" : @"multiplication", @"input" : @[ @101, @201 ]}];
  [_nodesManager createAnimatedNode:@401 config:@{@"type" : @"style", @"style" : @{@"translateX" : @301}}];
  [_nodesManager createAnimatedNode:@501 config:@{@"type" : @"props", @"props" : @{@"style" : @401}}];

  [_nodesManager connectAnimatedNodes:@101 childTag:@301];
  [_nodesManager connectAnimatedNodes:@201 childTag:@301];
  [_nodesManager connectAnimatedNodes:@301 childTag:@401];
  [_nodesManager connectAnimatedNodes:@401 childTag:@501];
  [_nodesManager connectAnimatedNodeToView:@501 viewTag:viewTag];

  NSArray<NSNumber *> *frames = @[ @0, @1 ];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@101
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @2}
                        endCallback:nil];
  [_nodesManager startAnimatingNode:@2
                            nodeTag:@201
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @10}
                        endCallback:nil];

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"translateX", @5)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"translateX", @20)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"translateX", @20)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

- (void)testHandleStoppingAnimation
{
  [self createSimpleAnimatedView:@1002 withOpacity:0];
  NSArray<NSNumber *> *frames = @[ @0, @0.2, @0.4, @0.6, @0.8, @1 ];

  __block BOOL endCallbackCalled = NO;

  RCTResponseSenderBlock endCallback = ^(NSArray *response) {
    endCallbackCalled = YES;
    XCTAssertEqual(response.count, 1);
    XCTAssertEqualObjects(response[0][@"finished"], @NO);
  };

  [_nodesManager startAnimatingNode:@404
                            nodeTag:@101
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @1}
                        endCallback:endCallback];

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [_nodesManager stopAnimation:@404];
  XCTAssertEqual(endCallbackCalled, YES);

  // Run "update" loop a few more times -> we expect no further updates nor callback calls to be
  // triggered
  for (NSUInteger i = 0; i < 5; i++) {
    [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
    [_nodesManager stepAnimations:_displayLink];
    [_surfacePresenter verify];
  }
}

- (void)testInterpolationNode
{
  NSNumber *viewTag = @52;
  [_nodesManager createAnimatedNode:@101 config:@{@"type" : @"value", @"value" : @10, @"offset" : @0}];
  [_nodesManager createAnimatedNode:@201
                             config:@{
                               @"type" : @"interpolation",
                               @"inputRange" : @[ @10, @20 ],
                               @"outputRange" : @[ @0, @1 ],
                               @"extrapolateLeft" : @"extend",
                               @"extrapolateRight" : @"extend"
                             }];
  [_nodesManager createAnimatedNode:@301 config:@{@"type" : @"style", @"style" : @{@"opacity" : @201}}];
  [_nodesManager createAnimatedNode:@401 config:@{@"type" : @"props", @"props" : @{@"style" : @301}}];

  [_nodesManager connectAnimatedNodes:@101 childTag:@201];
  [_nodesManager connectAnimatedNodes:@201 childTag:@301];
  [_nodesManager connectAnimatedNodes:@301 childTag:@401];
  [_nodesManager connectAnimatedNodeToView:@401 viewTag:viewTag];

  NSArray<NSNumber *> *frames = @[ @0, @0.2, @0.4, @0.6, @0.8, @1 ];
  [_nodesManager startAnimatingNode:@1
                            nodeTag:@101
                             config:@{@"type" : @"frames", @"frames" : frames, @"toValue" : @20}
                        endCallback:nil];

  for (NSNumber *frame in frames) {
    [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"opacity", frame)];
    [_nodesManager stepAnimations:_displayLink];
    [_surfacePresenter verify];
  }

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"opacity", @1)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

- (id<RCTEvent>)createScrollEventWithTag:(NSNumber *)viewTag value:(CGFloat)value
{
  // The event value is the 3rd argument.
  NSArray *arguments = @[ @1, @1, @{@"contentOffset" : @{@"y" : @(value)}} ];
  return [[RCTFakeEvent alloc] initWithName:@"topScroll" viewTag:viewTag arguments:arguments];
}

- (void)testNativeAnimatedEventDoUpdate
{
  NSNumber *viewTag = @1002;
  [self createSimpleAnimatedView:viewTag withOpacity:0];

  [_nodesManager
      addAnimatedEventToView:viewTag
                   eventName:@"topScroll"
                eventMapping:@{@"animatedValueTag" : @101, @"nativeEventPath" : @[ @"contentOffset", @"y" ]}];

  // Make sure that the update actually happened synchronously in `handleAnimatedEvent` and does
  // not wait for the next animation loop.
  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:viewTag props:RCTPropChecker(@"opacity", @10)];
  [_nodesManager handleAnimatedEvent:[self createScrollEventWithTag:viewTag value:10]];
  [_surfacePresenter verify];

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

- (void)testNativeAnimatedEventDoNotUpdate
{
  NSNumber *viewTag = @1002;
  [self createSimpleAnimatedView:viewTag withOpacity:0];

  [_nodesManager
      addAnimatedEventToView:viewTag
                   eventName:@"otherEvent"
                eventMapping:@{@"animatedValueTag" : @101, @"nativeEventPath" : @[ @"contentOffset", @"y" ]}];

  [_nodesManager
      addAnimatedEventToView:@999
                   eventName:@"topScroll"
                eventMapping:@{@"animatedValueTag" : @101, @"nativeEventPath" : @[ @"contentOffset", @"y" ]}];

  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager handleAnimatedEvent:[self createScrollEventWithTag:viewTag value:10]];
  [_surfacePresenter verify];
}

- (void)testGetValue
{
  __block NSInteger saveValueCallbackCalls = 0;
  NSNumber *nodeTag = @100;
  [_nodesManager createAnimatedNode:nodeTag config:@{@"type" : @"value", @"value" : @1, @"offset" : @0}];
  RCTResponseSenderBlock saveValueCallback = ^(NSArray *response) {
    saveValueCallbackCalls++;
    XCTAssertEqualObjects(response, @[ @1 ]);
  };

  XCTAssertEqual(saveValueCallbackCalls, 0);

  [_nodesManager getValue:nodeTag saveCallback:saveValueCallback];
  XCTAssertEqual(saveValueCallbackCalls, 1);
}

/**
 * Creates a following graph of nodes:
 * Value(3, initialValue) ----> Style(4) ---> Props(5) ---> View(viewTag)
 *
 * Value(3) is set to track Value(1) via Tracking(2) node with the provided animation config
 */
- (void)createAnimatedGraphWithTrackingNode:(NSNumber *)viewTag
                               initialValue:(CGFloat)initialValue
                            animationConfig:(NSDictionary *)animationConfig
{
  [_nodesManager createAnimatedNode:@101 config:@{@"type" : @"value", @"value" : @(initialValue), @"offset" : @0}];
  [_nodesManager createAnimatedNode:@301 config:@{@"type" : @"value", @"value" : @(initialValue), @"offset" : @0}];

  [_nodesManager createAnimatedNode:@201
                             config:@{
                               @"type" : @"tracking",
                               @"animationId" : @70,
                               @"value" : @301,
                               @"toValue" : @101,
                               @"animationConfig" : animationConfig
                             }];
  [_nodesManager createAnimatedNode:@401 config:@{@"type" : @"style", @"style" : @{@"translateX" : @301}}];
  [_nodesManager createAnimatedNode:@501 config:@{@"type" : @"props", @"props" : @{@"style" : @401}}];

  [_nodesManager connectAnimatedNodes:@101 childTag:@201];
  [_nodesManager connectAnimatedNodes:@301 childTag:@401];
  [_nodesManager connectAnimatedNodes:@401 childTag:@501];
  [_nodesManager connectAnimatedNodeToView:@501 viewTag:viewTag];
}

/**
 * In this test we verify that when value is being tracked we can update destination value in the
 * middle of ongoing animation and the animation will update and animate to the new spot. This is
 * tested using simple 5 frame backed timing animation.
 */
- (void)testTracking
{
  NSArray *frames = @[ @0, @0.25, @0.5, @0.75, @1 ];
  NSDictionary *animationConfig = @{@"type" : @"frames", @"frames" : frames};
  [self createAnimatedGraphWithTrackingNode:@1002 initialValue:0 animationConfig:animationConfig];
  [_nodesManager stepAnimations:_displayLink]; // kick off the tracking

  [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:@1002 props:RCTPropChecker(@"translateX", 0)];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  // update "toValue" to 100, we expect tracking animation to animate now from 0 to 100 in 5 steps
  [_nodesManager setAnimatedNodeValue:@101 value:@100];
  [_nodesManager stepAnimations:_displayLink]; // kick off the tracking

  for (NSNumber *frame in frames) {
    NSNumber *expected = @([frame doubleValue] * 100);
    [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:@1002 props:RCTPropChecker(@"translateX", expected)];
    [_nodesManager stepAnimations:_displayLink];
    [_surfacePresenter verify];
  }

  // update "toValue" to 0 but run only two frames from the animation,
  // we expect tracking animation to animate now from 100 to 75
  [_nodesManager setAnimatedNodeValue:@101 value:@0];
  [_nodesManager stepAnimations:_displayLink]; // kick off the tracking

  for (int i = 0; i < 2; i++) {
    NSNumber *expected = @(100. * (1. - [frames[i] doubleValue]));
    [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:@1002 props:RCTPropChecker(@"translateX", expected)];
    [_nodesManager stepAnimations:_displayLink];
    [_surfacePresenter verify];
  }

  // at this point we expect tracking value to be at 75
  // we update "toValue" again to 100 and expect the animation to restart from the current place
  [_nodesManager setAnimatedNodeValue:@101 value:@100];
  [_nodesManager stepAnimations:_displayLink]; // kick off the tracking

  for (NSNumber *frame in frames) {
    NSNumber *expected = @(50. + 50. * [frame doubleValue]);
    [[_surfacePresenter expect] synchronouslyUpdateViewOnUIThread:@1002 props:RCTPropChecker(@"translateX", expected)];
    [_nodesManager stepAnimations:_displayLink];
    [_surfacePresenter verify];
  }

  [_nodesManager stepAnimations:_displayLink];
  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

/**
 * In this test we verify that when tracking is set up for a given animated node and when the
 * animation settles it will not be registered as an active animation and therefore will not
 * consume resources on running the animation that has already completed. Then we verify that when
 * the value updates the animation will resume as expected and the complete again when reaches the
 * end.
 */

- (void)testTrackingPausesWhenEndValueIsReached
{
  NSArray *frames = @[ @0, @0.5, @1 ];
  NSDictionary *animationConfig = @{@"type" : @"frames", @"frames" : frames};
  [self createAnimatedGraphWithTrackingNode:@1002 initialValue:0 animationConfig:animationConfig];

  [_nodesManager setAnimatedNodeValue:@101 value:@100];
  [_nodesManager stepAnimations:_displayLink]; // kick off the tracking

  __block int callCount = 0;
  [[[_surfacePresenter stub] andDo:^(NSInvocation *__unused invocation) {
    callCount++;
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];

  for (NSUInteger i = 0; i < frames.count; i++) {
    [_nodesManager stepAnimations:_displayLink];
  }
  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(callCount, 4);

  // the animation has completed, we expect no updates to be done
  [[[_surfacePresenter stub] andDo:^(NSInvocation *__unused invocation) {
    XCTFail("Expected not to be called");
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];

  // restore rejected method, we will use it later on
  callCount = 0;
  [[[_surfacePresenter stub] andDo:^(NSInvocation *__unused invocation) {
    callCount++;
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];

  // we update end value and expect the animation to restart
  [_nodesManager setAnimatedNodeValue:@101 value:@200];
  [_nodesManager stepAnimations:_displayLink]; // kick off the tracking

  for (NSUInteger i = 0; i < frames.count; i++) {
    [_nodesManager stepAnimations:_displayLink];
  }
  [_nodesManager stepAnimations:_displayLink];
  XCTAssertEqual(callCount, 4);

  // the animation has completed, we expect no updates to be done
  [[_surfacePresenter reject] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];
  [_nodesManager stepAnimations:_displayLink];
  [_surfacePresenter verify];
}

/**
 * In this test we verify that when tracking is configured to use spring animation and when the
 * destination value updates the current speed of the animated value will be taken into account
 * while updating the spring animation and it will smoothly transition to the new end value.
 */
- (void)testSpringTrackingRetainsSpeed
{
  // this spring config corresponds to tension 20 and friction 0.5 which makes the spring settle
  // very slowly
  NSDictionary *springConfig = @{
    @"type" : @"spring",
    @"restSpeedThreshold" : @0.001,
    @"mass" : @1,
    @"restDisplacementThreshold" : @0.001,
    @"initialVelocity" : @0.5,
    @"damping" : @2.5,
    @"stiffness" : @157.8,
    @"overshootClamping" : @NO
  };
  [self createAnimatedGraphWithTrackingNode:@1002 initialValue:0 animationConfig:springConfig];

  __block CGFloat lastTranslateX = 0;
  [[[_surfacePresenter stub] andDo:^(NSInvocation *invocation) {
    __unsafe_unretained NSDictionary *props = nil;
    [invocation getArgument:&props atIndex:3];
    lastTranslateX = [props[@"translateX"] doubleValue];
  }] synchronouslyUpdateViewOnUIThread:OCMOCK_ANY props:OCMOCK_ANY];

  // update "toValue" to 1, we expect tracking animation to animate now from 0 to 1
  [_nodesManager setAnimatedNodeValue:@101 value:@1];
  [_nodesManager stepAnimations:_displayLink]; // kick off the tracking

  // we run several steps of animation until the value starts bouncing, has negative speed and
  // passes the final point (that is 1) while going backwards
  BOOL isBoucingBack = NO;
  CGFloat previousValue = 0;
  for (int maxFrames = 500; maxFrames > 0; maxFrames--) {
    [_nodesManager stepAnimations:_displayLink]; // kick off the tracking
    if (previousValue >= 1. && lastTranslateX < 1.) {
      isBoucingBack = YES;
      break;
    }
    previousValue = lastTranslateX;
  }
  XCTAssert(isBoucingBack);

  // we now update "toValue" to 1.5 but since the value have negative speed and has also pretty
  // low friction we expect it to keep going in the opposite direction for a few more frames
  [_nodesManager setAnimatedNodeValue:@101 value:@1.5];
  [_nodesManager stepAnimations:_displayLink]; // kick off the tracking

  int bounceBackInitialFrames = 0;
  BOOL hasTurnedForward = NO;

  // we run 8 seconds of animation
  for (int i = 0; i < 8 * 60; i++) {
    [_nodesManager stepAnimations:_displayLink];
    if (!hasTurnedForward) {
      if (lastTranslateX <= previousValue) {
        bounceBackInitialFrames++;
      } else {
        hasTurnedForward = true;
      }
    }
    previousValue = lastTranslateX;
  }
  XCTAssert(hasTurnedForward);
  XCTAssertGreaterThan(bounceBackInitialFrames, 3);
  XCTAssertEqual(lastTranslateX, 1.5);
}

@end
