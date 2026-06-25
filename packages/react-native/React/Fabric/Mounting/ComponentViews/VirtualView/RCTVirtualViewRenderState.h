/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#ifndef RCTVirtualViewRenderState_h
#define RCTVirtualViewRenderState_h

using RCTVirtualViewRenderState = NS_ENUM(NSInteger){
    RCTVirtualViewRenderStateUnknown = 0,
    RCTVirtualViewRenderStateRendered = 1,
    RCTVirtualViewRenderStateNone = 2,
};
#endif /* RCTVirtualViewRenderState_h */
