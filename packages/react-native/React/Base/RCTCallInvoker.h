/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus
#import <React/CallInvoker.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface RCTCallInvoker : NSObject

#ifdef __cplusplus
- (instancetype)initWithCallInvoker:(std::shared_ptr<facebook::react::CallInvoker>)callInvoker
    NS_DESIGNATED_INITIALIZER;

- (std::shared_ptr<facebook::react::CallInvoker>)callInvoker;
#endif

@end

NS_ASSUME_NONNULL_END
