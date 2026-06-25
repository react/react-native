/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#import <Foundation/Foundation.h>
#import <react/renderer/components/legacyviewmanagerinterop/RCTLegacyViewManagerInteropCoordinator.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTLegacyViewManagerInteropCoordinatorAdapter : NSObject

- (instancetype)initWithCoordinator:(RCTLegacyViewManagerInteropCoordinator *)coordinator reactTag:(NSInteger)tag;

@property (strong, nonatomic) UIView *paperView;

@property (nonatomic, copy, nullable) void (^eventInterceptor)(std::string eventName, folly::dynamic &&event);

- (void)setProps:(const folly::dynamic &)props;

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
