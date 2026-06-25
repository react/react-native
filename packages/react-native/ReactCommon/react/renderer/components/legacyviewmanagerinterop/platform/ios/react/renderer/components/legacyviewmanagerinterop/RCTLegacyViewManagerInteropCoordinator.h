/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModuleDecorator.h>
#import <UIKit/UIKit.h>
#include <folly/dynamic.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTComponentData;
@class RCTBridge;
@class RCTBridgeProxy;

typedef void (^InterceptorBlock)(std::string eventName, folly::dynamic &&event);

@interface RCTLegacyViewManagerInteropCoordinator : NSObject

- (instancetype)initWithComponentData:(RCTComponentData *)componentData
                               bridge:(nullable RCTBridge *)bridge
                          bridgeProxy:(nullable RCTBridgeProxy *)bridgeProxy
                bridgelessInteropData:(RCTBridgeModuleDecorator *)bridgelessInteropData;

- (UIView *)createPaperViewWithTag:(NSInteger)tag;

- (void)addObserveForTag:(NSInteger)tag usingBlock:(InterceptorBlock)block;

- (void)removeObserveForTag:(NSInteger)tag;

- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(UIView *)view;

- (NSString *)componentViewName;

- (void)handleCommand:(NSString *)commandName
                 args:(NSArray *)args
             reactTag:(NSInteger)tag
            paperView:(UIView *)paperView;
@end

NS_ASSUME_NONNULL_END

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
