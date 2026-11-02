/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponentViewDescriptor.h>
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewProtocol.h>
#import <React/RendererCore.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry of native component views.
 * Provides basic functionality for allocation, recycling, and querying (by tag) native view instances.
 */
@interface RCTComponentViewRegistry : NSObject

@property (nonatomic, strong, readonly) RCTComponentViewFactory *componentViewFactory;

/**
 * Returns a descriptor referring to a native view instance from the recycle pool (or being created on demand)
 * for given `componentHandle` and with given `tag`.
 * #RefuseSingleUse
 */
- (const RCTComponentViewDescriptor &)dequeueComponentViewWithComponentHandle:
                                          (facebook::react::ComponentHandle)componentHandle
                                                                          tag:(facebook::react::Tag)tag;

/**
 * Puts a given native component view to the recycle pool.
 * #RefuseSingleUse
 */
- (void)enqueueComponentViewWithComponentHandle:(facebook::react::ComponentHandle)componentHandle
                                            tag:(facebook::react::Tag)tag
                        componentViewDescriptor:(RCTComponentViewDescriptor)componentViewDescriptor;

/**
 * Returns a component view descriptor by given `tag`.
 */
- (const RCTComponentViewDescriptor &)componentViewDescriptorWithTag:(facebook::react::Tag)tag;

/**
 * Finds a native component view by given `tag`.
 * Returns `nil` if there is no registered component with the `tag`.
 */
- (nullable UIView<RCTComponentViewProtocol> *)findComponentViewWithTag:(facebook::react::Tag)tag;

@end

NS_ASSUME_NONNULL_END
