/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

RCT_EXTERN_C_BEGIN

void RCTSwizzleInstanceSelector(
    Class targetClass,
    Class swizzleClass,
    SEL selector);

RCT_EXTERN_C_END
