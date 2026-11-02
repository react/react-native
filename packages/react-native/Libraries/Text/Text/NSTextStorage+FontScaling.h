/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@interface NSTextStorage (FontScaling)

- (void)scaleFontSizeToFitSize:(CGSize)size
               minimumFontSize:(CGFloat)minimumFontSize
               maximumFontSize:(CGFloat)maximumFontSize;

- (void)scaleFontSizeWithRatio:(CGFloat)ratio
               minimumFontSize:(CGFloat)minimumFontSize
               maximumFontSize:(CGFloat)maximumFontSize;

/**
 * Like `-scaleFontSizeToFitSize:minimumFontSize:maximumFontSize:`, for text storages that are not laid out by an
 * attached `NSLayoutManager`. `measureBlock` lays out the text storage as it currently is and returns the size of the
 * laid out text, setting `isTruncated` if the last line is truncated.
 */
- (void)scaleFontSizeToFitSize:(CGSize)size
               minimumFontSize:(CGFloat)minimumFontSize
               maximumFontSize:(CGFloat)maximumFontSize
             measureUsingBlock:(NS_NOESCAPE CGSize (^)(BOOL *isTruncated))measureBlock;

@end
