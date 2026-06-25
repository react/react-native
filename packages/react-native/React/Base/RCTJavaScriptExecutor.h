/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <objc/runtime.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>

typedef void (^RCTJavaScriptCompleteBlock)(NSError *__strong)
    __deprecated_msg("This api will be removed along with the bridge.");
typedef void (^RCTJavaScriptCallback)(__strong id, NSError *__strong)
    __deprecated_msg("This api will be removed along with the bridge.");
