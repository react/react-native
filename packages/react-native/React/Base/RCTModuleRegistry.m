/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBridge.h"
#import "RCTTurboModuleRegistry.h"

@class RCTBridgeModule;

@implementation RCTModuleRegistry {
  __weak id<RCTTurboModuleRegistry> _turboModuleRegistry;
}

- (void)setTurboModuleRegistry:(id<RCTTurboModuleRegistry>)turboModuleRegistry
{
  _turboModuleRegistry = turboModuleRegistry;
}

- (id)moduleForName:(const char *)moduleName
{
  return [self moduleForName:moduleName lazilyLoadIfNecessary:YES];
}

- (id)moduleForName:(const char *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad
{
  id<RCTBridgeModule> module = nil;

  id<RCTTurboModuleRegistry> turboModuleRegistry = _turboModuleRegistry;
  if (module == nil && turboModuleRegistry && (lazilyLoad || [turboModuleRegistry moduleIsInitialized:moduleName])) {
    module = [turboModuleRegistry moduleForName:moduleName];
  }

  return module;
}

- (BOOL)moduleIsInitialized:(Class)moduleClass
{
  id<RCTTurboModuleRegistry> turboModuleRegistry = _turboModuleRegistry;
  if (turboModuleRegistry) {
    NSString *moduleName = RCTBridgeModuleNameForClass(moduleClass);
    return [turboModuleRegistry moduleIsInitialized:[moduleName UTF8String]];
  }

  return NO;
}

- (id)moduleForClass:(Class)moduleClass
{
  return [self moduleForName:RCTBridgeModuleNameForClass(moduleClass).UTF8String];
}

@end
