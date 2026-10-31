/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInteropTestViewManager.h"
#import "RCTInteropTestView.h"

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

@implementation InteropTestViewManager

RCT_EXPORT_MODULE(InteropTestView)

- (UIView *)view
{
  return [[InteropTestView alloc] init];
}

@end

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
