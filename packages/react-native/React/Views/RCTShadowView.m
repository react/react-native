/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTShadowView.h"

#import "RCTConvert.h"
#import "RCTI18nUtil.h"
#import "RCTLayout.h"
#import "RCTLog.h"
#import "RCTShadowView+Layout.h"
#import "RCTUtils.h"
#import "UIView+Private.h"
#import "UIView+React.h"

@implementation RCTShadowView
@synthesize reactTag = _reactTag;
@synthesize rootTag = _rootTag;

+ (YGConfigRef)yogaConfig
{
  return YGConfigNew();
}

- (NSNumber *)reactTagAtPoint:(CGPoint)point
{
  return [NSNumber numberWithInt:0];
}

- (BOOL)isReactRootView
{
  return NO;
}

- (NSArray<RCTShadowView *> *)reactSubviews
{
  return @[];
}
- (RCTShadowView *)reactSuperview
{
  return nil;
}
- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
}
- (void)removeReactSubview:(RCTShadowView *)subview
{
}

- (void)setLocalData:(NSObject *)localData
{
}

#pragma mark - Layout
- (void)layoutWithMinimumSize:(CGSize)minimumSize
                  maximumSize:(CGSize)maximumSize
              layoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
                layoutContext:(RCTLayoutContext)layoutContext
{
}

- (void)layoutWithMetrics:(RCTLayoutMetrics)layoutMetrics layoutContext:(RCTLayoutContext)layoutContext
{
}

- (void)layoutSubviewsWithContext:(RCTLayoutContext)layoutContext
{
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  return CGSizeMake(0, 0);
}

- (BOOL)canHaveSubviews
{
  return NO;
}

- (BOOL)isYogaLeafNode
{
  return NO;
}

- (void)didUpdateReactSubviews
{
}
- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
}

- (CGRect)measureLayoutRelativeToAncestor:(RCTShadowView *)ancestor
{
  return CGRectNull;
}

- (BOOL)viewIsDescendantOf:(RCTShadowView *)ancestor
{
  return NO;
}

@end
