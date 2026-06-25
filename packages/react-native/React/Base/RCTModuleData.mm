/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModuleData.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"

@implementation RCTModuleData

- (instancetype)initWithModuleClass:(Class)moduleClass
                             bridge:(RCTBridge *)bridge
                     moduleRegistry:(RCTModuleRegistry *)moduleRegistry
            viewRegistry_DEPRECATED:(RCTViewRegistry *)viewRegistry_DEPRECATED
                      bundleManager:(RCTBundleManager *)bundleManager
                  callableJSModules:(RCTCallableJSModules *)callableJSModules
{
  return self;
}

- (instancetype)initWithModuleInstance:(id<RCTBridgeModule>)instance
                                bridge:(RCTBridge *)bridge
                        moduleRegistry:(RCTModuleRegistry *)moduleRegistry
               viewRegistry_DEPRECATED:(RCTViewRegistry *)viewRegistry_DEPRECATED
                         bundleManager:(RCTBundleManager *)bundleManager
                     callableJSModules:(RCTCallableJSModules *)callableJSModules
{
  return self;
}

- (void)gatherConstants
{
}

- (void)invalidate
{
}

@end
