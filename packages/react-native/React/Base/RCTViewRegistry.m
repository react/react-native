/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSurfacePresenterStub.h>
#import <React/RCTUIManager.h>

#import "RCTBridge.h"
#import "RCTBridgeModule.h"

@implementation RCTViewRegistry {
  RCTBridgelessComponentViewProvider _bridgelessComponentViewProvider;
}

- (void)setBridgelessComponentViewProvider:(RCTBridgelessComponentViewProvider)bridgelessComponentViewProvider
{
  _bridgelessComponentViewProvider = bridgelessComponentViewProvider;
}

- (UIView *)viewForReactTag:(NSNumber *)reactTag
{
  UIView *view = nil;

  if (view == nil && _bridgelessComponentViewProvider) {
    view = _bridgelessComponentViewProvider(reactTag);
  }

  return view;
}

- (void)addUIBlock:(RCTViewRegistryUIBlock)block
{
  if (!block) {
    return;
  }

  __weak __typeof(self) weakSelf = self;

  RCTExecuteOnMainQueue(^{
    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      block(strongSelf);
    }
  });
}

@end
