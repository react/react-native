/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeProxy.h>
#import <React/RCTBundleManager.h>
#import <React/RCTViewManager.h>
#import <XCTest/XCTest.h>
#import <react/renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropComponentDescriptor.h>
#import <react/utils/ContextContainer.h>
#import <react/utils/ManagedObjectWrapper.h>

using facebook::react::ComponentDescriptorParameters;
using facebook::react::ContextContainer;
using facebook::react::LegacyViewManagerInteropComponentDescriptor;
using facebook::react::wrapManagedObject;

@interface RCTLegacyInteropDescriptorTestViewManager : RCTViewManager
@end

@implementation RCTLegacyInteropDescriptorTestViewManager
@end

static const char *const kTestComponentName = "LegacyInteropDescriptorTestView";

@interface RCTLegacyViewManagerInteropComponentDescriptorTests : XCTestCase
@end

@implementation RCTLegacyViewManagerInteropComponentDescriptorTests {
  RCTBridgeProxy *_bridgeProxy;
  // The bridge proxy only stores the runtime pointer; it is never dereferenced here.
  int _fakeRuntime;
  std::shared_ptr<ContextContainer> _contextContainer;
}

- (void)setUp
{
  [super setUp];

  _bridgeProxy = [[RCTBridgeProxy alloc] initWithViewRegistry:[RCTViewRegistry new]
      moduleRegistry:[RCTModuleRegistry new]
      bundleManager:[RCTBundleManager new]
      callableJSModules:[RCTCallableJSModules new]
      dispatchToJSThread:^(dispatch_block_t block) {
      }
      registerSegmentWithId:^(NSNumber *segmentId, NSString *path) {
      }
      runtime:&_fakeRuntime
      launchOptions:nil];

  // Stored the same way the bridgeless runtime stores it.
  _contextContainer = std::make_shared<ContextContainer>();
  _contextContainer->insert("RCTBridgeProxy", wrapManagedObject(_bridgeProxy));
}

- (void)tearDown
{
  _contextContainer.reset();
  _bridgeProxy = nil;

  [super tearDown];
}

- (std::string)constructDescriptorAndReturnComponentName
{
  ComponentDescriptorParameters parameters{
      .eventDispatcher = {},
      .contextContainer = _contextContainer,
      .flavor = std::make_shared<const std::string>(kTestComponentName),
  };
  LegacyViewManagerInteropComponentDescriptor descriptor(parameters);
  return descriptor.getComponentName();
}

// XCTest assertion macros use variadic reporting and catch framework exceptions by value.
// NOLINTBEGIN(cppcoreguidelines-pro-type-vararg, misc-throw-by-value-catch-by-reference)
- (void)testConstructsWithBridgeProxyStoredInContextContainer
{
  XCTAssertNoThrow([self constructDescriptorAndReturnComponentName]);
  XCTAssertEqual([self constructDescriptorAndReturnComponentName], std::string(kTestComponentName));
}
// NOLINTEND(cppcoreguidelines-pro-type-vararg, misc-throw-by-value-catch-by-reference)

@end
