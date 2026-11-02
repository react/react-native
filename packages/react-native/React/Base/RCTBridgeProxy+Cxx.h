/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef __cplusplus
#import <React/CallInvoker.h>
#endif

#import "RCTBridgeProxy.h"

@interface RCTBridgeProxy (Cxx)

#ifdef __cplusplus
@property (nonatomic, readwrite) std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker;
#endif

@end
