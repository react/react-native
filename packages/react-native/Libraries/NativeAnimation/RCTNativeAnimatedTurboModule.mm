/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>
#import <React/RCTConvert.h>
#import <React/RCTInitializing.h>
#import <React/RCTNativeAnimatedNodesManager.h>
#import <React/RCTNativeAnimatedTurboModule.h>
#import <react/debug/react_native_assert.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>

#import "RCTAnimationPlugins.h"

typedef void (^AnimatedOperation)(RCTNativeAnimatedNodesManager *nodesManager);

@interface RCTNativeAnimatedTurboModule () <NativeAnimatedModuleSpec, RCTInitializing>
@end

@implementation RCTNativeAnimatedTurboModule {
  RCTNativeAnimatedNodesManager *_nodesManager;
  __weak id<RCTSurfacePresenterStub> _surfacePresenter;
  // Operations called after views have been updated.
  NSMutableArray<AnimatedOperation> *_operations;
  // Operations called before views have been updated.
  NSMutableArray<AnimatedOperation> *_preOperations;

  NSSet<NSString *> *_userDrivenAnimationEndedEvents;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    _operations = [NSMutableArray new];
    _preOperations = [NSMutableArray new];
    _userDrivenAnimationEndedEvents = [NSSet setWithArray:@[ @"onScrollEnded" ]];
  }
  return self;
}

- (void)initialize
{
  // _surfacePresenter set in setSurfacePresenter:
  _nodesManager = [[RCTNativeAnimatedNodesManager alloc] initWithBridge:nil surfacePresenter:_surfacePresenter];
  [_surfacePresenter addObserver:self];
  [[self.moduleRegistry moduleForName:"EventDispatcher"] addDispatchObserver:self];
}

- (void)invalidate
{
  [super invalidate];
  [_nodesManager stopAnimationLoop];
  [[self.moduleRegistry moduleForName:"EventDispatcher"] removeDispatchObserver:self];
  [_surfacePresenter removeObserver:self];
}

/*
 * In bridgeless mode, `setBridge` is never called during initializtion. Instead this selector is invoked via
 * BridgelessTurboModuleSetup.
 */
- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  _surfacePresenter = surfacePresenter;
}

#pragma mark-- API

- (void)startOperationBatch
{
}

- (void)finishOperationBatch
{
}

- (void)createAnimatedNode:(double)tag config:(NSDictionary *)configJSON
{
  NSDictionary<NSString *, id> *config = [RCTConvert NSDictionary:configJSON];
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager createAnimatedNode:@(tag) config:config];
  }];
}

- (void)updateAnimatedNodeConfig:(double)tag config:(NSDictionary *)configJSON
{
  NSDictionary<NSString *, id> *config = [RCTConvert NSDictionary:configJSON];
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager updateAnimatedNodeConfig:@(tag) config:config];
  }];
}

- (void)connectAnimatedNodes:(double)parentTag childTag:(double)childTag
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager connectAnimatedNodes:@(parentTag) childTag:@(childTag)];
  }];
}

- (void)disconnectAnimatedNodes:(double)parentTag childTag:(double)childTag
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodes:@(parentTag) childTag:@(childTag)];
  }];
}

- (void)startAnimatingNode:(double)animationId
                   nodeTag:(double)nodeTag
                    config:(NSDictionary *)configJSON
               endCallback:(RCTResponseSenderBlock)callBack
{
  NSDictionary<NSString *, id> *config = [RCTConvert NSDictionary:configJSON];
  [self queueFlushedOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startAnimatingNode:@(animationId) nodeTag:@(nodeTag) config:config endCallback:callBack];
  }];
}

- (void)stopAnimation:(double)animationId
{
  [self queueFlushedOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopAnimation:@(animationId)];
  }];
}

- (void)setAnimatedNodeValue:(double)nodeTag value:(double)value
{
  [self queueFlushedOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeValue:@(nodeTag) value:@(value)];
  }];
}

- (void)setAnimatedNodeOffset:(double)nodeTag offset:(double)offset
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeOffset:@(nodeTag) offset:@(offset)];
  }];
}

- (void)flattenAnimatedNodeOffset:(double)nodeTag
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager flattenAnimatedNodeOffset:@(nodeTag)];
  }];
}

- (void)extractAnimatedNodeOffset:(double)nodeTag
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager extractAnimatedNodeOffset:@(nodeTag)];
  }];
}

- (void)connectAnimatedNodeToView:(double)nodeTag viewTag:(double)viewTag
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    // viewName is not used when node is managed by Fabric, and nodes are always managed by Fabric in Bridgeless.
    [nodesManager connectAnimatedNodeToView:@(nodeTag) viewTag:@(viewTag) viewName:nil];
  }];
}

- (void)connectAnimatedNodeToShadowNodeFamily:(double)nodeTag shadowNode:(NSDictionary *)shadowNode
{
  // This method should only be called when using CxxNativeAnimated
  react_native_assert(false);
}

- (void)disconnectAnimatedNodeFromView:(double)nodeTag viewTag:(double)viewTag
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodeFromView:@(nodeTag) viewTag:@(viewTag)];
  }];
}

- (void)restoreDefaultValues:(double)nodeTag
{
  [self queuePreOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager restoreDefaultValues:@(nodeTag)];
  }];
}

- (void)dropAnimatedNode:(double)tag
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager dropAnimatedNode:@(tag)];
  }];
}

- (void)startListeningToAnimatedNodeValue:(double)tag
{
  __weak id<RCTValueAnimatedNodeObserver> valueObserver = self;
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startListeningToAnimatedNodeValue:@(tag) valueObserver:valueObserver];
  }];
}

- (void)stopListeningToAnimatedNodeValue:(double)tag
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopListeningToAnimatedNodeValue:@(tag)];
  }];
}

- (void)addAnimatedEventToView:(double)viewTag
                     eventName:(nonnull NSString *)eventName
                  eventMapping:(JS::NativeAnimatedModule::EventMapping &)eventMapping
{
  NSMutableDictionary *eventMappingDict = [NSMutableDictionary new];
  eventMappingDict[@"nativeEventPath"] = RCTConvertVecToArray(eventMapping.nativeEventPath());

  if (eventMapping.animatedValueTag()) {
    eventMappingDict[@"animatedValueTag"] = @(*eventMapping.animatedValueTag());
  }

  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager addAnimatedEventToView:@(viewTag) eventName:eventName eventMapping:eventMappingDict];
  }];
}

- (void)removeAnimatedEventFromView:(double)viewTag
                          eventName:(nonnull NSString *)eventName
                    animatedNodeTag:(double)animatedNodeTag
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager removeAnimatedEventFromView:@(viewTag) eventName:eventName animatedNodeTag:@(animatedNodeTag)];
  }];
}

- (void)getValue:(double)nodeTag saveValueCallback:(RCTResponseSenderBlock)saveValueCallback
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager getValue:@(nodeTag) saveCallback:saveValueCallback];
  }];
}

- (void)queueAndExecuteBatchedOperations:(NSArray *)operationsAndArgs
{
  // TODO: implement in the future if we want the same optimization here as on Android
}

#pragma mark-- Batch handling

- (void)queueFlushedOperationBlock:(AnimatedOperation)operation
{
  dispatch_async(RCTGetUIManagerQueue(), ^{
    [self addOperationBlock:operation];
    // In Bridge, flushing of native animations is done from RCTCxxBridge batchDidComplete().
    // Since RCTCxxBridge doesn't exist in Bridgeless, and components are not remounted in Fabric for native
    // animations, flush here for changes in Animated.Value for Animated.event.
    [self flushOperationQueues];
  });
}

- (void)queueOperationBlock:(AnimatedOperation)operation
{
  dispatch_async(RCTGetUIManagerQueue(), ^{
    [self addOperationBlock:operation];
  });
}

- (void)queuePreOperationBlock:(AnimatedOperation)operation
{
  dispatch_async(RCTGetUIManagerQueue(), ^{
    [self addPreOperationBlock:operation];
  });
}

- (void)addOperationBlock:(AnimatedOperation)operation
{
  [_operations addObject:operation];
}

- (void)addPreOperationBlock:(AnimatedOperation)operation
{
  [_preOperations addObject:operation];
}

- (void)flushOperationQueues
{
  if (_preOperations.count == 0 && _operations.count == 0) {
    return;
  }
  NSArray<AnimatedOperation> *preOperations = _preOperations;
  NSArray<AnimatedOperation> *operations = _operations;
  _preOperations = [NSMutableArray new];
  _operations = [NSMutableArray new];

  RCTExecuteOnMainQueue(^{
    for (AnimatedOperation operation in preOperations) {
      operation(self->_nodesManager);
    }
    for (AnimatedOperation operation in operations) {
      operation(self->_nodesManager);
    }
    [self->_nodesManager updateAnimations];
  });
}

#pragma mark - RCTSurfacePresenterObserver

- (void)willMountComponentsWithRootTag:(NSInteger)rootTag
{
  RCTAssertMainQueue();
  RCTExecuteOnUIManagerQueue(^{
    NSArray<AnimatedOperation> *preOperations = self->_preOperations;
    self->_preOperations = [NSMutableArray new];

    RCTExecuteOnMainQueue(^{
      for (AnimatedOperation preOperation in preOperations) {
        preOperation(self->_nodesManager);
      }
    });
  });
}

- (void)didMountComponentsWithRootTag:(NSInteger)rootTag
{
  RCTAssertMainQueue();
  RCTExecuteOnUIManagerQueue(^{
    NSArray<AnimatedOperation> *operations = self->_operations;
    self->_operations = [NSMutableArray new];

    RCTExecuteOnMainQueue(^{
      for (AnimatedOperation operation in operations) {
        operation(self->_nodesManager);
      }
    });
  });
}

#pragma mark-- Events

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"onAnimatedValueUpdate", @"onUserDrivenAnimationEnded" ];
}

- (void)animatedNode:(RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [self sendEventWithName:@"onAnimatedValueUpdate" body:@{@"tag" : node.nodeTag, @"value" : @(value)}];
}

- (void)userDrivenAnimationEnded:(NSArray<NSNumber *> *)nodes
{
  [self sendEventWithName:@"onUserDrivenAnimationEnded" body:@{@"tags" : nodes}];
}

- (void)eventDispatcherWillDispatchEvent:(id<RCTEvent>)event
{
  // Events can be dispatched from any queue so we have to make sure handleAnimatedEvent
  // is run from the main queue.
  RCTExecuteOnMainQueue(^{
    [self->_nodesManager handleAnimatedEvent:event];

    if ([self->_userDrivenAnimationEndedEvents containsObject:event.eventName]) {
      NSSet<NSNumber *> *tags = [self->_nodesManager getTagsOfConnectedNodesFrom:event.viewTag
                                                                        andEvent:event.eventName];
      if (tags.count > 0) {
        [self userDrivenAnimationEnded:[tags allObjects]];
      }
    }
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAnimatedModuleSpecJSI>(params);
}

@end

Class RCTNativeAnimatedTurboModuleCls(void)
{
  return RCTNativeAnimatedTurboModule.class;
}
