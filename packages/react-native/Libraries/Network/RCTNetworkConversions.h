/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifdef __cplusplus

#import <string>

NS_ASSUME_NONNULL_BEGIN

inline std::string_view RCTStringViewFromNSString(NSString *string)
{
  return std::string_view{string.UTF8String, [string lengthOfBytesUsingEncoding:NSUTF8StringEncoding]};
}

NS_ASSUME_NONNULL_END

#endif
