/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/View.h>
#import <UIKit/UIKit.h>

@protocol RCTTouchableComponentViewProtocol <NSObject>
- (facebook::react::SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point;
@end
