/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTestRunner.h"

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTConstants.h>
#import <React/RCTDevSettings.h>
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>

#import "FBSnapshotTestController.h"
#import "RCTTestModule.h"

static const NSTimeInterval kTestTimeoutSeconds = 120;

@implementation RCTTestRunner {
  FBSnapshotTestController *_testController;
  RCTBridgeModuleListProvider _moduleProvider;
  NSString *_appPath;
  __weak id<RCTBridgeDelegate> _bridgeDelegate;
}

- (instancetype)initWithApp:(NSString *)app
         referenceDirectory:(NSString *)referenceDirectory
             moduleProvider:(RCTBridgeModuleListProvider)block
                  scriptURL:(NSURL *)scriptURL
{
  return [self initWithApp:app
        referenceDirectory:referenceDirectory
            moduleProvider:block
                 scriptURL:scriptURL
            bridgeDelegate:nil];
}

- (instancetype)initWithApp:(NSString *)app
         referenceDirectory:(NSString *)referenceDirectory
             bridgeDelegate:(id<RCTBridgeDelegate>)bridgeDelegate
{
  return [self initWithApp:app
        referenceDirectory:referenceDirectory
            moduleProvider:nil
                 scriptURL:nil
            bridgeDelegate:bridgeDelegate];
}

- (instancetype)initWithApp:(NSString *)app
         referenceDirectory:(NSString *)referenceDirectory
             moduleProvider:(RCTBridgeModuleListProvider)block
                  scriptURL:(NSURL *)scriptURL
             bridgeDelegate:(id<RCTBridgeDelegate>)bridgeDelegate
{
  RCTAssertParam(app);
  RCTAssertParam(referenceDirectory);

  if ((self = [super init])) {
    if (!referenceDirectory.length) {
      referenceDirectory =
          [[NSBundle bundleForClass:self.class].resourcePath stringByAppendingPathComponent:@"ReferenceImages"];
    }

    NSString *sanitizedAppName = [app stringByReplacingOccurrencesOfString:@"/" withString:@"-"];
    sanitizedAppName = [sanitizedAppName stringByReplacingOccurrencesOfString:@"\\" withString:@"-"];
    _testController = [[FBSnapshotTestController alloc] initWithTestName:sanitizedAppName];
    _testController.referenceImagesDirectory = referenceDirectory;
    _moduleProvider = [block copy];
    _appPath = app;
    _bridgeDelegate = bridgeDelegate;

    if (scriptURL != nil) {
      _scriptURL = scriptURL;
    } else if (!_bridgeDelegate) {
      [self updateScript];
    }
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (NSURL *)defaultScriptURL
{
  if (getenv("CI_USE_PACKAGER") || _useBundler) {
    return [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:8081/%@.bundle?platform=%@&dev=true",
                                                           _appPath,
                                                           RCTPlatformName]];
  } else {
    return [[NSBundle bundleForClass:[RCTBridge class]] URLForResource:@"main" withExtension:@"jsbundle"];
  }
}

- (void)updateScript
{
  _scriptURL = [self defaultScriptURL];
  RCTAssert(_scriptURL != nil, @"No scriptURL set");
}

- (void)setRecordMode:(BOOL)recordMode
{
  _testController.recordMode = recordMode;
}

- (BOOL)recordMode
{
  return _testController.recordMode;
}

- (void)setUseBundler:(BOOL)useBundler
{
  _useBundler = useBundler;
  [self updateScript];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
{
  [self runTest:test module:moduleName initialProps:nil configurationBlock:nil expectErrorBlock:nil];
}

- (void)runTest:(SEL)test
                module:(NSString *)moduleName
          initialProps:(NSDictionary<NSString *, id> *)initialProps
    configurationBlock:(void (^)(RCTRootView *rootView))configurationBlock
{
  [self runTest:test
                  module:moduleName
            initialProps:initialProps
      configurationBlock:configurationBlock
        expectErrorBlock:nil];
}

- (void)runTest:(SEL)test
                module:(NSString *)moduleName
          initialProps:(NSDictionary<NSString *, id> *)initialProps
    configurationBlock:(void (^)(RCTRootView *rootView))configurationBlock
      expectErrorRegex:(NSString *)errorRegex
{
  BOOL (^expectErrorBlock)(NSString *error) = ^BOOL(NSString *error) {
    return [error rangeOfString:errorRegex options:NSRegularExpressionSearch].location != NSNotFound;
  };

  [self runTest:test
                  module:moduleName
            initialProps:initialProps
      configurationBlock:configurationBlock
        expectErrorBlock:expectErrorBlock];
}

- (void)runTest:(SEL)test
                module:(NSString *)moduleName
          initialProps:(NSDictionary<NSString *, id> *)initialProps
    configurationBlock:(void (^)(RCTRootView *rootView))configurationBlock
      expectErrorBlock:(BOOL (^)(NSString *error))expectErrorBlock
{
  __weak RCTBridge *batchedBridge;
  NSNumber *rootTag;
  RCTLogFunction defaultLogFunction = RCTGetLogFunction();
  // Catch all error logs, that are equivalent to redboxes in dev mode.
  __block NSMutableArray<NSString *> *errors = nil;
  RCTSetLogFunction(
      ^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
        defaultLogFunction(level, source, fileName, lineNumber, message);
        if (level >= RCTLogLevelError) {
          if (errors == nil) {
            errors = [NSMutableArray new];
          }
          [errors addObject:message];
        }
      });

  @autoreleasepool {
    RCTBridge *bridge;
    if (_bridgeDelegate) {
      bridge = [[RCTBridge alloc] initWithDelegate:_bridgeDelegate launchOptions:nil];
    } else {
      bridge = [[RCTBridge alloc] initWithBundleURL:_scriptURL moduleProvider:_moduleProvider launchOptions:nil];
    }
    batchedBridge = [bridge batchedBridge];

    UIViewController *vc = RCTKeyWindow().rootViewController;
    vc.view = [UIView new];

    RCTTestModule *testModule = [bridge moduleForClass:[RCTTestModule class]];
    RCTAssert(_testController != nil, @"_testController should not be nil");
    testModule.controller = _testController;
    testModule.testSelector = test;
    testModule.testSuffix = _testSuffix;

    @autoreleasepool {
      // The rootView needs to be deallocated after this @autoreleasepool block exits.
      RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                       moduleName:moduleName
                                                initialProperties:initialProps];
      rootView.frame = CGRectMake(0, 0, 320, 2000); // Constant size for testing on multiple devices

      rootTag = rootView.reactTag;
      testModule.view = rootView;

      [vc.view addSubview:rootView]; // Add as subview so it doesn't get resized

      if (configurationBlock) {
        configurationBlock(rootView);
      }

      NSDate *date = [NSDate dateWithTimeIntervalSinceNow:kTestTimeoutSeconds];
      while (date.timeIntervalSinceNow > 0 && testModule.status == RCTTestStatusPending && errors == nil) {
        [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
        [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
      }

      [rootView removeFromSuperview];
      testModule.view = nil;
    }

    // From this point on catch only fatal errors.
    RCTSetLogFunction(
        ^(RCTLogLevel level, RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
          defaultLogFunction(level, source, fileName, lineNumber, message);
          if (level >= RCTLogLevelFatal) {
            if (errors == nil) {
              errors = [NSMutableArray new];
            }
            [errors addObject:message];
          }
        });

#if RCT_DEV
    NSArray<UIView *> *nonLayoutSubviews = [vc.view.subviews
        filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id subview, NSDictionary *bindings) {
          return ![NSStringFromClass([subview class]) isEqualToString:@"_UILayoutGuide"];
        }]];

    RCTAssert(nonLayoutSubviews.count == 0, @"There shouldn't be any other views: %@", nonLayoutSubviews);
#endif

    if (expectErrorBlock) {
      RCTAssert(expectErrorBlock(errors[0]), @"Expected an error but the first one was missing or did not match.");
    } else {
      RCTAssert(errors == nil, @"RedBox errors: %@", errors);
      RCTAssert(
          testModule.status != RCTTestStatusPending, @"Test didn't finish within %0.f seconds", kTestTimeoutSeconds);
      RCTAssert(testModule.status == RCTTestStatusPassed, @"Test failed");
    }

    // Wait for the rootView to be deallocated completely before invalidating the bridge.
    RCTUIManager *uiManager = [bridge moduleForClass:[RCTUIManager class]];
    NSDate *date = [NSDate dateWithTimeIntervalSinceNow:5];
    while (date.timeIntervalSinceNow > 0 && [uiManager viewForReactTag:rootTag]) {
      [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
      [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    }
    RCTAssert([uiManager viewForReactTag:rootTag] == nil, @"RootView should have been deallocated after removed.");

    [bridge invalidate];
  }

  // Wait for the bridge to disappear before continuing to the next test.
  NSDate *invalidateTimeout = [NSDate dateWithTimeIntervalSinceNow:30];
  while (invalidateTimeout.timeIntervalSinceNow > 0 && batchedBridge != nil) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  RCTAssert(errors == nil, @"RedBox errors during bridge invalidation: %@", errors);
  RCTAssert(batchedBridge == nil, @"Bridge should be deallocated after the test");

  RCTSetLogFunction(defaultLogFunction);
}

@end
