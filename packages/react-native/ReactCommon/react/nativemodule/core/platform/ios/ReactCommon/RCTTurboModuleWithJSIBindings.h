/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#ifdef __cplusplus
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#endif

@protocol RCTTurboModuleWithJSIBindings <NSObject>

#ifdef __cplusplus

@optional
- (void)installJSIBindingsWithRuntime:(facebook::jsi::Runtime &)runtime
                          callInvoker:(const std::shared_ptr<facebook::react::CallInvoker> &)callinvoker;

#endif

@end
