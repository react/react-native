/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTSurfacePresenterStub.h>

@protocol RCTValueAnimatedNodeObserver;

NS_ASSUME_NONNULL_BEGIN

@interface RCTNativeAnimatedNodesManager : NSObject

- (nonnull instancetype)initWithSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter;

- (void)updateAnimations;

- (void)stepAnimations:(CADisplayLink *)displaylink;

- (BOOL)isNodeManagedByFabric:(NSNumber *)tag;

- (void)getValue:(NSNumber *)nodeTag saveCallback:(RCTResponseSenderBlock)saveCallback;

// graph

- (void)createAnimatedNode:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config;

- (void)connectAnimatedNodes:(NSNumber *)parentTag childTag:(NSNumber *)childTag;

- (void)disconnectAnimatedNodes:(NSNumber *)parentTag childTag:(NSNumber *)childTag;

- (void)connectAnimatedNodeToView:(NSNumber *)nodeTag viewTag:(NSNumber *)viewTag;

- (void)restoreDefaultValues:(NSNumber *)nodeTag;

- (void)disconnectAnimatedNodeFromView:(NSNumber *)nodeTag viewTag:(NSNumber *)viewTag;

- (void)dropAnimatedNode:(NSNumber *)tag;

// mutations

- (void)setAnimatedNodeValue:(NSNumber *)nodeTag value:(NSNumber *)value;

- (void)setAnimatedNodeOffset:(NSNumber *)nodeTag offset:(NSNumber *)offset;

- (void)flattenAnimatedNodeOffset:(NSNumber *)nodeTag;

- (void)extractAnimatedNodeOffset:(NSNumber *)nodeTag;

- (void)updateAnimatedNodeConfig:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config;

// drivers

- (void)startAnimatingNode:(NSNumber *)animationId
                   nodeTag:(NSNumber *)nodeTag
                    config:(NSDictionary<NSString *, id> *)config
               endCallback:(nullable RCTResponseSenderBlock)callBack;

- (void)stopAnimation:(NSNumber *)animationId;

- (void)stopAnimationLoop;

// events

- (void)addAnimatedEventToView:(NSNumber *)viewTag
                     eventName:(NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *)eventMapping;

- (void)removeAnimatedEventFromView:(NSNumber *)viewTag
                          eventName:(NSString *)eventName
                    animatedNodeTag:(NSNumber *)animatedNodeTag;

- (void)handleAnimatedEvent:(id<RCTEvent>)event;

// listeners

- (void)startListeningToAnimatedNodeValue:(NSNumber *)tag valueObserver:(id<RCTValueAnimatedNodeObserver>)valueObserver;

- (void)stopListeningToAnimatedNodeValue:(NSNumber *)tag;

- (NSSet<NSNumber *> *)getTagsOfConnectedNodesFrom:(NSNumber *)tag andEvent:(NSString *)eventName;

@end

NS_ASSUME_NONNULL_END
