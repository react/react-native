/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#ifndef RCTVirtualViewMode_h
#define RCTVirtualViewMode_h

// Enum for virtual view modes
using RCTVirtualViewMode = NS_ENUM(NSInteger){
    RCTVirtualViewModeVisible = 0,
    RCTVirtualViewModePrerender = 1,
    RCTVirtualViewModeHidden = 2,
};
#endif /* RCTVirtualViewMode_h */
