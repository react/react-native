/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <memory>

#import <React/RCTBridgeModuleDecorator.h>
#import <React/RCTDefines.h>
#import <React/RCTTurboModuleRegistry.h>
#import <ReactCommon/RuntimeExecutor.h>
#import <ReactCommon/TurboModuleBinding.h>

#import "RCTTurboModule.h"

@class RCTBridgeProxy;
@class RCTTurboModuleManager;
@class RCTDevMenuConfigurationDecorator;

@protocol RCTTurboModuleManagerDelegate <NSObject>

/**
 * Given a module name, return its actual class. If nil is returned, basic ObjC class lookup is performed.
 */
- (Class)getModuleClassFromName:(const char *)name;

/**
 * Given a module class, provide an instance for it. If nil is returned, default initializer is used.
 */
- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass;

@optional

/**
 * This method is used to retrieve a factory object that can create a `facebook::react::TurboModule`,
 * The class implementing `RCTTurboModuleProvider` must be an Objective-C class so that we can
 * initialize it dynamically with Codegen.
 */
- (id<RCTModuleProvider>)getModuleProvider:(const char *)name;

/**
 * Create an instance of a TurboModule without relying on any ObjC++ module instance.
 */
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:
                                                          (std::shared_ptr<facebook::react::CallInvoker>)jsInvoker;

/**
 * Return a pre-initialized list of leagcy native modules.
 * These modules shouldn't be TurboModule-compatible (i.e: they should not conform to RCTTurboModule).
 *
 * This method is only used by the TurboModule interop layer.
 *
 * It must match the signature of RCTBridgeDelegate extraModulesForBridge:
 * - (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge;
 */
- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
    __attribute((deprecated("Please make all native modules returned from this method TurboModule-compatible.")));

@end

@interface RCTTurboModuleManager : NSObject <RCTTurboModuleRegistry>

- (instancetype)initWithBridgeProxy:(RCTBridgeProxy *)bridgeProxy
              bridgeModuleDecorator:(RCTBridgeModuleDecorator *)bridgeModuleDecorator
                           delegate:(id<RCTTurboModuleManagerDelegate>)delegate
                          jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
      devMenuConfigurationDecorator:(RCTDevMenuConfigurationDecorator *)devMenuConfigurationDecorator;

- (void)installJSBindings:(facebook::jsi::Runtime &)runtime;

- (void)invalidate;

@end
