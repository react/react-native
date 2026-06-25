/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ReactCommon/RuntimeExecutor.h>
#import <UIKit/UIKit.h>
#import <react/utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTSurfacePresenter;
@class RCTBridge;

#ifndef RCT_REMOVE_LEGACY_ARCH
facebook::react::RuntimeExecutor RCTRuntimeExecutorFromBridge(RCTBridge *bridge);

/*
 * Controls a life-cycle of a Surface Presenter based on Bridge's life-cycle.
 * We are moving away from using Bridge.
 * This class is intended to be used only during the transition period.
 */
@interface RCTSurfacePresenterBridgeAdapter : NSObject

- (instancetype)initWithBridge:(RCTBridge *)bridge
              contextContainer:(std::shared_ptr<const facebook::react::ContextContainer>)contextContainer;

/*
 * Returns a stored instance of Surface Presenter which is managed by a bridge.
 */
@property (nonatomic, readonly) RCTSurfacePresenter *surfacePresenter;

/*
 * Controls a stored instance of the Bridge. A consumer can re-set the stored Bridge using that method; the class is
 * responsible to coordinate this change with a SurfacePresenter accordingly.
 */
@property (nonatomic, weak) RCTBridge *bridge;

@end
#endif

NS_ASSUME_NONNULL_END
