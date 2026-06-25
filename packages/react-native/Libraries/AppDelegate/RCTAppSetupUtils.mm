/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAppSetupUtils.h"

#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>

// Turbo Module
#import <React/RCTBundleAssetImageLoader.h>
#import <React/RCTDataRequestHandler.h>
#import <React/RCTFileRequestHandler.h>
#import <React/RCTGIFImageDecoder.h>
#import <React/RCTHTTPRequestHandler.h>
#import <React/RCTImageLoader.h>
#import <React/RCTNetworking.h>

// Fabric
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceHostingProxyRootView.h>

// jsinspector-modern
#import <jsinspector-modern/InspectorFlags.h>

#import "RCTDependencyProvider.h"

NSArray<NSString *> *RCTAppSetupUnstableModulesRequiringMainQueueSetup(id<RCTDependencyProvider> dependencyProvider)
{
  // For oss, insert core main queue setup modules here
  return (dependencyProvider != nullptr) ? dependencyProvider.unstableModulesRequiringMainQueueSetup : @[];
}

id<RCTTurboModule> RCTAppSetupDefaultModuleFromClass(Class moduleClass, id<RCTDependencyProvider> dependencyProvider)
{
  // private block used to filter out modules depending on protocol conformance
  NSArray * (^extractModuleConformingToProtocol)(RCTModuleRegistry *, Protocol *) =
      ^NSArray *(RCTModuleRegistry *moduleRegistry, Protocol *protocol) {
        NSArray<NSString *> *classNames = @[];

        if (protocol == @protocol(RCTImageURLLoader)) {
          classNames = (dependencyProvider != nullptr) ? dependencyProvider.imageURLLoaderClassNames : @[];
        } else if (protocol == @protocol(RCTImageDataDecoder)) {
          classNames = (dependencyProvider != nullptr) ? dependencyProvider.imageDataDecoderClassNames : @[];
        } else if (protocol == @protocol(RCTURLRequestHandler)) {
          classNames = (dependencyProvider != nullptr) ? dependencyProvider.URLRequestHandlerClassNames : @[];
        }

        NSMutableArray *modules = [NSMutableArray new];

        for (NSString *className in classNames) {
          const char *cModuleName = [className cStringUsingEncoding:NSUTF8StringEncoding];
          id moduleFromLibrary = [moduleRegistry moduleForName:cModuleName];
          if (![moduleFromLibrary conformsToProtocol:protocol]) {
            continue;
          }
          [modules addObject:moduleFromLibrary];
        }
        return modules;
      };

  // Set up the default RCTImageLoader and RCTNetworking modules.
  if (moduleClass == RCTImageLoader.class) {
    return [[moduleClass alloc] initWithRedirectDelegate:nil
        loadersProvider:^NSArray<id<RCTImageURLLoader>> *(RCTModuleRegistry *moduleRegistry) {
          NSArray *imageURLLoaderModules =
              extractModuleConformingToProtocol(moduleRegistry, @protocol(RCTImageURLLoader));

          return [@[ [RCTBundleAssetImageLoader new] ] arrayByAddingObjectsFromArray:imageURLLoaderModules];
        }
        decodersProvider:^NSArray<id<RCTImageDataDecoder>> *(RCTModuleRegistry *moduleRegistry) {
          NSArray *imageDataDecoder = extractModuleConformingToProtocol(moduleRegistry, @protocol(RCTImageDataDecoder));
          return [@[ [RCTGIFImageDecoder new] ] arrayByAddingObjectsFromArray:imageDataDecoder];
        }];
  } else if (moduleClass == RCTNetworking.class) {
    return [[moduleClass alloc]
        initWithHandlersProvider:^NSArray<id<RCTURLRequestHandler>> *(RCTModuleRegistry *moduleRegistry) {
          NSArray *URLRequestHandlerModules =
              extractModuleConformingToProtocol(moduleRegistry, @protocol(RCTURLRequestHandler));
          return [@[
            [RCTHTTPRequestHandler new],
            [RCTDataRequestHandler new],
            [RCTFileRequestHandler new],
            [moduleRegistry moduleForName:"BlobModule"],
          ] arrayByAddingObjectsFromArray:URLRequestHandlerModules];
        }];
  }
  // No custom initializer here.
  return [moduleClass new];
}

std::unique_ptr<facebook::react::JSExecutorFactory> RCTAppSetupDefaultJsExecutorFactory(
    RCTBridge *bridge,
    RCTTurboModuleManager *turboModuleManager,
    const std::shared_ptr<facebook::react::RuntimeScheduler> &runtimeScheduler)
{
  return nullptr;
}
