/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Lightweight wrapper class around a UIView with a react tag which registers a
 * constant react tag at initialization time for a stable hash and provides the
 * udnerlying view to a caller if that underlying view's react tag has not
 * changed from the one provided at initialization time (i.e. recycled).
 */
@interface RCTReactTaggedView : NSObject {
  UIView *_view;
  NSInteger _tag;
}

+ (RCTReactTaggedView *)wrap:(UIView *)view;

- (instancetype)initWithView:(UIView *)view;
- (nullable UIView *)view;
- (NSInteger)tag;

- (BOOL)isEqual:(nullable id)other;
- (NSUInteger)hash;

@end

NS_ASSUME_NONNULL_END
