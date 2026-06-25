/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <XCTest/XCTest.h>

#import <OCMock/OCMock.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTBundleManager.h>
#import <React/RCTJavaScriptLoader.h>
#import <ReactCommon/RCTHermesInstance.h>
#import <ReactCommon/RCTInstance.h>
#import <ReactCommon/RCTTurboModule.h>
#import <ReactCommon/RCTTurboModuleManager.h>

using namespace facebook::react;

@interface FakeEagerModule : NSObject <RCTBridgeModule, RCTTurboModule>
@property (class, readonly) NSCountedSet<NSString *> *initCounts;
@property (class, nullable) void (^onInit)(void);
+ (void)reset;
@end

@implementation FakeEagerModule

static NSCountedSet<NSString *> *sInitCounts;
static void (^sOnInit)(void);

+ (NSCountedSet<NSString *> *)initCounts
{
  if (sInitCounts == nil) {
    sInitCounts = [NSCountedSet new];
  }
  return sInitCounts;
}

+ (void)setOnInit:(void (^)(void))block
{
  sOnInit = [block copy];
}

+ (void (^)(void))onInit
{
  return sOnInit;
}

+ (NSString *)moduleName
{
  return @"FakeEagerModule";
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

+ (void)reset
{
  [[FakeEagerModule initCounts] removeAllObjects];
  sOnInit = nil;
}

- (instancetype)init
{
  if (self = [super init]) {
    // Block FIRST, then bump the counter. This way "init has fully completed"
    // is observable as count == 1, distinct from "init has been entered".
    if (sOnInit) {
      sOnInit();
    }
    @synchronized([FakeEagerModule initCounts]) {
      [[FakeEagerModule initCounts] addObject:[[self class] moduleName]];
    }
  }
  return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

@interface RCTInstanceTests : XCTestCase
@end

@implementation RCTInstanceTests {
  id<RCTInstanceDelegate> _mockDelegate;
  id<RCTTurboModuleManagerDelegate> _mockTMMDelegate;
  id _bundleLoadObserver;
}

- (void)setUp
{
  [super setUp];
  [FakeEagerModule reset];

  _mockDelegate = OCMProtocolMock(@protocol(RCTInstanceDelegate));
  _mockTMMDelegate = OCMProtocolMock(@protocol(RCTTurboModuleManagerDelegate));

  // Match only FakeEagerModule by name; anything else returns nil so unrelated
  // lookups (RCTDevMenu, RCTImageLoader, ...) don't accidentally instantiate it.
  OCMStub([_mockTMMDelegate getModuleClassFromName:nullptr]).ignoringNonObjectArgs().andDo(^(NSInvocation *invocation) {
    const char *requestedName = nullptr;
    [invocation getArgument:&requestedName atIndex:2];
    Class result =
        (requestedName != nullptr && strcmp(requestedName, "FakeEagerModule") == 0) ? [FakeEagerModule class] : Nil;
    [invocation setReturnValue:&result];
  });
}

- (void)tearDown
{
  if (_bundleLoadObserver != nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:_bundleLoadObserver];
    _bundleLoadObserver = nil;
  }
  [FakeEagerModule reset];
  _mockDelegate = nil;
  _mockTMMDelegate = nil;
  [super tearDown];
}

- (RCTInstance *)makeInstance
{
  RCTBundleManager *bundleManager = [RCTBundleManager new];
  // bundleURL asserts the bridgeless getter is non-nil; without it the NSException
  // unwinds the JS-thread init callback before reaching _loadJSBundle:.
  NSURL * (^urlGetter)(void) = ^{
    return [NSURL URLWithString:@"file:///empty.bundle"];
  };
  [bundleManager setBridgelessBundleURLGetter:urlGetter
                                    andSetter:^(NSURL *_) {
                                    }
                             andDefaultGetter:urlGetter];
  return [[RCTInstance alloc] initWithDelegate:_mockDelegate
                              jsRuntimeFactory:std::make_shared<RCTHermesInstance>()
                                 bundleManager:bundleManager
                    turboModuleManagerDelegate:_mockTMMDelegate
                                moduleRegistry:[RCTModuleRegistry new]
                         parentInspectorTarget:nullptr
                                 launchOptions:nil];
}

- (void)testConsultsDelegateExactlyOnce
{
  OCMStub([_mockDelegate unstableModulesRequiringMainQueueSetup]).andReturn(@[]);

  RCTInstance *instance = [self makeInstance];

  OCMVerify(OCMTimes(1), [_mockDelegate unstableModulesRequiringMainQueueSetup]);

  [instance invalidate];
}

- (void)testInstantiatesRequestedModuleOnMainQueue
{
  OCMStub([_mockDelegate unstableModulesRequiringMainQueueSetup]).andReturn(@[ FakeEagerModule.moduleName ]);

  RCTInstance *instance = [self makeInstance];

  XCTAssertEqual(
      [FakeEagerModule.initCounts countForObject:FakeEagerModule.moduleName],
      1u,
      @"FakeEagerModule should have been constructed exactly once during eager setup");

  [instance invalidate];
}

- (void)testBundleLoadAwaitsMainQueueModuleSetup
{
  OCMStub([_mockDelegate unstableModulesRequiringMainQueueSetup]).andReturn(@[ FakeEagerModule.moduleName ]);

  // Hand the instance an empty bundle the moment it asks for one. The JS thread
  // will then drive _loadScriptFromSource: which invokes the wait block before
  // evaluating the script. RCTInstance posts RCTInstanceDidLoadBundle from the
  // `afterLoad` lambda, i.e. after the wait block has returned.
  RCTSource *emptySource = OCMClassMock([RCTSource class]);
  OCMStub([emptySource url]).andReturn([NSURL URLWithString:@"file:///empty.bundle"]);
  OCMStub([emptySource data]).andReturn([NSData data]);
  OCMStub([_mockDelegate loadBundleAtURL:[OCMArg any] onProgress:[OCMArg any] onComplete:[OCMArg any]])
      .andDo(^(NSInvocation *invocation) {
        __unsafe_unretained RCTSourceLoadBlock onComplete;
        [invocation getArgument:&onComplete atIndex:4];
        onComplete(nil, emptySource);
      });

  dispatch_semaphore_t initEntered = dispatch_semaphore_create(0);
  dispatch_semaphore_t releaseInit = dispatch_semaphore_create(0);

  FakeEagerModule.onInit = ^{
    dispatch_semaphore_signal(initEntered);
    dispatch_semaphore_wait(releaseInit, DISPATCH_TIME_FOREVER);
  };

  XCTestExpectation *bundleLoaded = [self expectationWithDescription:@"RCTInstanceDidLoadBundle"];
  __block NSUInteger initCountAtBundleLoad = 0;
  _bundleLoadObserver = [[NSNotificationCenter defaultCenter]
      addObserverForName:@"RCTInstanceDidLoadBundle"
                  object:nil
                   queue:nil
              usingBlock:^(NSNotification *_) {
                initCountAtBundleLoad = [FakeEagerModule.initCounts countForObject:FakeEagerModule.moduleName];
                [bundleLoaded fulfill];
              }];

  XCTestExpectation *done = [self expectationWithDescription:@"orchestration complete"];
  __block RCTInstance *instance = nil;

  // Orchestration runs off-main so the main thread is free to service the
  // RCTExecuteOnMainQueue block from _start, where FakeEagerModule.init runs.
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    instance = [self makeInstance];

    XCTAssertEqual(
        dispatch_semaphore_wait(initEntered, dispatch_time(DISPATCH_TIME_NOW, 5 * NSEC_PER_SEC)),
        0,
        @"FakeEagerModule -init did not run on main queue within timeout");

    // Releasing here unblocks main-queue setup, which signals the wait block,
    // which lets the JS thread proceed past `beforeLoad` and post the bundle
    // notification.
    dispatch_semaphore_signal(releaseInit);

    [done fulfill];
  });

  // Invalidate AFTER the notification fires; otherwise `_valid = false` makes
  // _loadScriptFromSource: short-circuit and `afterLoad` never runs.
  [self waitForExpectations:@[ bundleLoaded, done ] timeout:10.0];
  [instance invalidate];

  XCTAssertEqual(
      initCountAtBundleLoad,
      1u,
      @"FakeEagerModule -init must have fully returned before the JS bundle finishes loading");
}

@end
