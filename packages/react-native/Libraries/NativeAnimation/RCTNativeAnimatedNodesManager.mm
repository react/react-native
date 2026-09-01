/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTNativeAnimatedNodesManager.h>

#import <React/RCTConvert.h>

#import <React/RCTAdditionAnimatedNode.h>
#import <React/RCTAnimatedNode.h>
#import <React/RCTAnimationDriver.h>
#import <React/RCTColorAnimatedNode.h>
#import <React/RCTDecayAnimation.h>
#import <React/RCTDiffClampAnimatedNode.h>
#import <React/RCTDivisionAnimatedNode.h>
#import <React/RCTEventAnimation.h>
#import <React/RCTFrameAnimation.h>
#import <React/RCTInterpolationAnimatedNode.h>
#import <React/RCTModuloAnimatedNode.h>
#import <React/RCTMultiplicationAnimatedNode.h>
#import <React/RCTObjectAnimatedNode.h>
#import <React/RCTPropsAnimatedNode.h>
#import <React/RCTSpringAnimation.h>
#import <React/RCTStyleAnimatedNode.h>
#import <React/RCTSubtractionAnimatedNode.h>
#import <React/RCTTrackingAnimatedNode.h>
#import <React/RCTTransformAnimatedNode.h>
#import <React/RCTValueAnimatedNode.h>

// We do some normalizing of the event names in RCTEventDispatcher#RCTNormalizeInputEventName.
// To make things simpler just get rid of the parts we change in the event names we use here.
// This is a lot easier than trying to denormalize because there would be multiple possible
// denormalized forms for a single input.
static NSString *RCTNormalizeAnimatedEventName(NSString *eventName)
{
  if ([eventName hasPrefix:@"on"]) {
    return [eventName substringFromIndex:2];
  }
  if ([eventName hasPrefix:@"top"]) {
    return [eventName substringFromIndex:3];
  }
  return eventName;
}

@implementation RCTNativeAnimatedNodesManager {
  __weak id<RCTSurfacePresenterStub> _surfacePresenter;
  NSMutableDictionary<NSNumber *, RCTAnimatedNode *> *_animationNodes;
  // Mapping of a view tag and an event name to a list of event animation drivers. 99% of the time
  // there will be only one driver per mapping so all code code should be optimized around that.
  NSMutableDictionary<NSString *, NSMutableArray<RCTEventAnimation *> *> *_eventDrivers;
  NSMutableSet<id<RCTAnimationDriver>> *_activeAnimations;
  CADisplayLink *_displayLink;
}

- (instancetype)initWithSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  if ((self = [super init]) != nullptr) {
    _surfacePresenter = surfacePresenter;
    _animationNodes = [NSMutableDictionary new];
    _eventDrivers = [NSMutableDictionary new];
    _activeAnimations = [NSMutableSet new];
  }
  return self;
}

- (BOOL)isNodeManagedByFabric:(NSNumber *)tag
{
  RCTAnimatedNode *node = _animationNodes[tag];
  if (node != nullptr) {
    return [node isManagedByFabric];
  }
  return false;
}

#pragma mark-- Graph

- (void)createAnimatedNode:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config
{
  static NSDictionary *map;
  static dispatch_once_t mapToken;
  dispatch_once(&mapToken, ^{
    map = @{
      @"style" : [RCTStyleAnimatedNode class],
      @"value" : [RCTValueAnimatedNode class],
      @"color" : [RCTColorAnimatedNode class],
      @"props" : [RCTPropsAnimatedNode class],
      @"interpolation" : [RCTInterpolationAnimatedNode class],
      @"addition" : [RCTAdditionAnimatedNode class],
      @"diffclamp" : [RCTDiffClampAnimatedNode class],
      @"division" : [RCTDivisionAnimatedNode class],
      @"multiplication" : [RCTMultiplicationAnimatedNode class],
      @"modulus" : [RCTModuloAnimatedNode class],
      @"subtraction" : [RCTSubtractionAnimatedNode class],
      @"transform" : [RCTTransformAnimatedNode class],
      @"tracking" : [RCTTrackingAnimatedNode class],
      @"object" : [RCTObjectAnimatedNode class],
    };
  });

  NSString *nodeType = [RCTConvert NSString:config[@"type"]];

  Class nodeClass = map[nodeType];
  if (nodeClass == nullptr) {
    RCTLogError(@"Animated node type %@ not supported natively", nodeType);
    return;
  }

  RCTAnimatedNode *node = [[nodeClass alloc] initWithTag:tag config:config];
  node.manager = self;
  _animationNodes[tag] = node;
  [node setNeedsUpdate];
}

- (void)connectAnimatedNodes:(NSNumber *)parentTag childTag:(NSNumber *)childTag
{
  RCTAssertParam(parentTag);
  RCTAssertParam(childTag);

  RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  RCTAnimatedNode *childNode = _animationNodes[childTag];

  RCTAssertParam(parentNode);
  RCTAssertParam(childNode);

  [parentNode addChild:childNode];
  [childNode setNeedsUpdate];
}

- (void)disconnectAnimatedNodes:(NSNumber *)parentTag childTag:(NSNumber *)childTag
{
  RCTAssertParam(parentTag);
  RCTAssertParam(childTag);

  RCTAnimatedNode *parentNode = _animationNodes[parentTag];
  RCTAnimatedNode *childNode = _animationNodes[childTag];

  RCTAssertParam(parentNode);
  RCTAssertParam(childNode);

  [parentNode removeChild:childNode];
  [childNode setNeedsUpdate];
}

- (void)connectAnimatedNodeToView:(NSNumber *)nodeTag viewTag:(NSNumber *)viewTag
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if ([node isKindOfClass:[RCTPropsAnimatedNode class]]) {
    [(RCTPropsAnimatedNode *)node connectToView:viewTag surfacePresenter:_surfacePresenter];
  }
  [node setNeedsUpdate];
}

- (void)disconnectAnimatedNodeFromView:(NSNumber *)nodeTag viewTag:(NSNumber *)viewTag
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if ([node isKindOfClass:[RCTPropsAnimatedNode class]]) {
    [(RCTPropsAnimatedNode *)node disconnectFromView:viewTag];
  }
}

- (void)restoreDefaultValues:(NSNumber *)nodeTag
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  // Restoring default values needs to happen before UIManager operations so it is
  // possible the node hasn't been created yet if it is being connected and
  // disconnected in the same batch. In that case we don't need to restore
  // default values since it will never actually update the view.
  if (node == nil) {
    return;
  }
  if (![node isKindOfClass:[RCTPropsAnimatedNode class]]) {
    RCTLogError(@"Not a props node.");
  }
  [(RCTPropsAnimatedNode *)node restoreDefaultValues];
}

- (void)dropAnimatedNode:(NSNumber *)tag
{
  RCTAnimatedNode *node = _animationNodes[tag];
  if (node != nullptr) {
    [node detachNode];
    [_animationNodes removeObjectForKey:tag];
  }
}

#pragma mark-- Mutations

- (void)setAnimatedNodeValue:(NSNumber *)nodeTag value:(NSNumber *)value
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[RCTValueAnimatedNode class]]) {
    RCTLogError(@"Not a value node.");
    return;
  }
  [self stopAnimationsForNode:node];

  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)node;
  valueNode.value = value.floatValue;
  [valueNode setNeedsUpdate];
}

- (void)setAnimatedNodeOffset:(NSNumber *)nodeTag offset:(NSNumber *)offset
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[RCTValueAnimatedNode class]]) {
    RCTLogError(@"Not a value node.");
    return;
  }

  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)node;
  [valueNode setOffset:offset.floatValue];
  [valueNode setNeedsUpdate];
}

- (void)flattenAnimatedNodeOffset:(NSNumber *)nodeTag
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[RCTValueAnimatedNode class]]) {
    RCTLogError(@"Not a value node.");
    return;
  }

  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)node;
  [valueNode flattenOffset];
}

- (void)extractAnimatedNodeOffset:(NSNumber *)nodeTag
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[RCTValueAnimatedNode class]]) {
    RCTLogError(@"Not a value node.");
    return;
  }

  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)node;
  [valueNode extractOffset];
}

- (void)getValue:(NSNumber *)nodeTag saveCallback:(RCTResponseSenderBlock)saveCallback
{
  RCTAnimatedNode *node = _animationNodes[nodeTag];
  if (![node isKindOfClass:[RCTValueAnimatedNode class]]) {
    RCTLogError(@"Not a value node.");
    return;
  }
  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)node;
  ;
  saveCallback(@[ @(valueNode.value) ]);
}

- (void)updateAnimatedNodeConfig:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config
{
  // TODO (T111179606): Support platform colors for color animations
}

#pragma mark-- Drivers

- (void)startAnimatingNode:(NSNumber *)animationId
                   nodeTag:(NSNumber *)nodeTag
                    config:(NSDictionary<NSString *, id> *)config
               endCallback:(nullable RCTResponseSenderBlock)callBack
{
  // check if the animation has already started
  for (id<RCTAnimationDriver> driver in _activeAnimations) {
    if ([driver.animationId isEqual:animationId]) {
      // if the animation is running, we restart it with an updated configuration
      [driver resetAnimationConfig:config];
      return;
    }
  }

  RCTValueAnimatedNode *valueNode = (RCTValueAnimatedNode *)_animationNodes[nodeTag];

  NSString *type = config[@"type"];
  id<RCTAnimationDriver> animationDriver;

  if ([type isEqual:@"frames"]) {
    animationDriver = [[RCTFrameAnimation alloc] initWithId:animationId
                                                     config:config
                                                    forNode:valueNode
                                                   callBack:callBack];

  } else if ([type isEqual:@"spring"]) {
    animationDriver = [[RCTSpringAnimation alloc] initWithId:animationId
                                                      config:config
                                                     forNode:valueNode
                                                    callBack:callBack];

  } else if ([type isEqual:@"decay"]) {
    animationDriver = [[RCTDecayAnimation alloc] initWithId:animationId
                                                     config:config
                                                    forNode:valueNode
                                                   callBack:callBack];
  } else {
    RCTLogError(@"Unsupported animation type: %@", config[@"type"]);
    return;
  }

  [_activeAnimations addObject:animationDriver];
  [animationDriver startAnimation];
  [self startAnimationLoopIfNeeded];
}

- (void)stopAnimation:(NSNumber *)animationId
{
  for (id<RCTAnimationDriver> driver in _activeAnimations) {
    if ([driver.animationId isEqual:animationId]) {
      [driver stopAnimation];
      [_activeAnimations removeObject:driver];
      break;
    }
  }
}

- (void)stopAnimationsForNode:(RCTAnimatedNode *)node
{
  NSMutableArray<id<RCTAnimationDriver>> *discarded = [NSMutableArray new];
  for (id<RCTAnimationDriver> driver in _activeAnimations) {
    if ([driver.valueNode isEqual:node]) {
      [discarded addObject:driver];
    }
  }
  for (id<RCTAnimationDriver> driver in discarded) {
    [driver stopAnimation];
    [_activeAnimations removeObject:driver];
  }
}

#pragma mark-- Events

- (void)addAnimatedEventToView:(NSNumber *)viewTag
                     eventName:(NSString *)eventName
                  eventMapping:(NSDictionary<NSString *, id> *)eventMapping
{
  NSNumber *nodeTag = [RCTConvert NSNumber:eventMapping[@"animatedValueTag"]];
  RCTAnimatedNode *node = _animationNodes[nodeTag];

  if (node == nullptr) {
    RCTLogError(@"Animated node with tag %@ does not exist", nodeTag);
    return;
  }

  if (![node isKindOfClass:[RCTValueAnimatedNode class]]) {
    RCTLogError(@"Animated node connected to event should be of type RCTValueAnimatedNode");
    return;
  }

  NSArray<NSString *> *eventPath = [RCTConvert NSStringArray:eventMapping[@"nativeEventPath"]];

  RCTEventAnimation *driver = [[RCTEventAnimation alloc] initWithEventPath:eventPath
                                                                 valueNode:(RCTValueAnimatedNode *)node];

  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, RCTNormalizeAnimatedEventName(eventName)];
  if (_eventDrivers[key] != nil) {
    [_eventDrivers[key] addObject:driver];
  } else {
    NSMutableArray<RCTEventAnimation *> *drivers = [NSMutableArray new];
    [drivers addObject:driver];
    _eventDrivers[key] = drivers;
  }

  // Handle onScrollEnded special events.
  // These are triggered when the user stops dragging or when the
  // scroll view stops decelerating after the user swiped
  // The goal is to use this event to force a resync of the Shadow Tree
  // with the Native tree
  if ([eventName isEqualToString:@"onScroll"]) {
    [self addAnimatedEventToView:viewTag eventName:@"onScrollEnded" eventMapping:eventMapping];
  }
}

- (void)removeAnimatedEventFromView:(NSNumber *)viewTag
                          eventName:(NSString *)eventName
                    animatedNodeTag:(NSNumber *)animatedNodeTag
{
  NSString *key = [NSString stringWithFormat:@"%@%@", viewTag, RCTNormalizeAnimatedEventName(eventName)];
  if (_eventDrivers[key] != nil) {
    if (_eventDrivers[key].count == 1) {
      [_eventDrivers removeObjectForKey:key];
    } else {
      NSMutableArray<RCTEventAnimation *> *driversForKey = _eventDrivers[key];
      for (NSUInteger i = 0; i < driversForKey.count; i++) {
        if (driversForKey[i].valueNode.nodeTag == animatedNodeTag) {
          [driversForKey removeObjectAtIndex:i];
          break;
        }
      }
    }
  }
}

- (void)handleAnimatedEvent:(id<RCTEvent>)event
{
  if (_eventDrivers.count == 0) {
    return;
  }

  NSString *key = [NSString stringWithFormat:@"%@%@", event.viewTag, RCTNormalizeAnimatedEventName(event.eventName)];
  NSMutableArray<RCTEventAnimation *> *driversForKey = _eventDrivers[key];
  if (driversForKey != nullptr) {
    for (RCTEventAnimation *driver in driversForKey) {
      [self stopAnimationsForNode:driver.valueNode];
      [driver updateWithEvent:event];
    }

    [self updateAnimations];
  }
}

#pragma mark-- Listeners

- (void)startListeningToAnimatedNodeValue:(NSNumber *)tag valueObserver:(id<RCTValueAnimatedNodeObserver>)valueObserver
{
  RCTAnimatedNode *node = _animationNodes[tag];
  if ([node isKindOfClass:[RCTValueAnimatedNode class]]) {
    ((RCTValueAnimatedNode *)node).valueObserver = valueObserver;
  }
}

- (void)stopListeningToAnimatedNodeValue:(NSNumber *)tag
{
  RCTAnimatedNode *node = _animationNodes[tag];
  if ([node isKindOfClass:[RCTValueAnimatedNode class]]) {
    ((RCTValueAnimatedNode *)node).valueObserver = nil;
  }
}

#pragma mark-- Animation Loop

- (void)startAnimationLoopIfNeeded
{
  if ((_displayLink == nullptr) && _activeAnimations.count > 0) {
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(stepAnimations:)];
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
}

- (void)stopAnimationLoopIfNeeded
{
  if (_activeAnimations.count == 0) {
    [self stopAnimationLoop];
  }
}

- (void)stopAnimationLoop
{
  if (_displayLink != nullptr) {
    [_displayLink invalidate];
    _displayLink = nil;
  }
}

- (void)stepAnimations:(CADisplayLink *)displaylink
{
  NSTimeInterval time = displaylink.timestamp;
  for (id<RCTAnimationDriver> animationDriver in _activeAnimations) {
    [animationDriver stepAnimationWithTime:time];
  }

  [self updateAnimations];

  for (id<RCTAnimationDriver> animationDriver in [_activeAnimations copy]) {
    if (animationDriver.animationHasFinished) {
      [animationDriver stopAnimation];
      [_activeAnimations removeObject:animationDriver];
    }
  }

  [self stopAnimationLoopIfNeeded];
}

- (NSSet<NSNumber *> *)getTagsOfConnectedNodesFrom:(NSNumber *)tag andEvent:(NSString *)eventName
{
  NSMutableSet<NSNumber *> *tags = [NSMutableSet new];
  NSString *key = [NSString stringWithFormat:@"%@%@", tag, RCTNormalizeAnimatedEventName(eventName)];
  NSArray<RCTEventAnimation *> *eventAnimations = _eventDrivers[key];
  for (RCTEventAnimation *animation in eventAnimations) {
    NSNumber *nodeTag = [animation.valueNode nodeTag];
    if (nodeTag != nullptr) {
      [tags addObject:nodeTag];
    }
    for (NSNumber *childNodeKey in [animation.valueNode childNodes]) {
      [tags addObject:childNodeKey];
    }
  }

  return tags;
}

#pragma mark-- Updates

- (void)updateAnimations
{
  [_animationNodes enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, RCTAnimatedNode *node, BOOL *stop) {
    if (node.needsUpdate) {
      [node updateNodeIfNecessary];
    }
  }];
}

@end
