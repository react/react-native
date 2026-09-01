/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <React/RCTImageResponseDelegate.h>
#import <react/renderer/components/view/ViewShadowNode.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTBackgroundImageURLLoaderDelegate <RCTImageResponseDelegate>

- (void)backgroundImagesDidLoad;

@end

@interface RCTBackgroundImageURLLoader : NSObject

@property (nonatomic, weak) id<RCTBackgroundImageURLLoaderDelegate> delegate;

- (void)updateStateWithNewState:(facebook::react::ViewShadowNode::ConcreteState::Shared)state oldState:(facebook::react::ViewShadowNode::ConcreteState::Shared)oldState;
- (nullable UIImage *)loadedImageForUri:(NSString *)uri;
- (void)reset;

@end

NS_ASSUME_NONNULL_END
