/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSurfacePointerHandler.h"

#import <React/RCTIdentifierPool.h>
#import <React/RCTReactTaggedView.h>
#import <React/RCTUtils.h>
#import <React/RCTViewComponentView.h>

#import "RCTConversions.h"
#import "RCTTouchableComponentViewProtocol.h"

#if !TARGET_OS_TV

using namespace facebook::react;

typedef NS_ENUM(NSInteger, RCTPointerEventType) {
  RCTPointerEventTypeStart,
  RCTPointerEventTypeMove,
  RCTPointerEventTypeEnd,
  RCTPointerEventTypeCancel,
};

static BOOL AllTouchesAreCancelledOrEnded(NSSet<UITouch *> *touches)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved || touch.phase == UITouchPhaseStationary) {
      return NO;
    }
  }
  return YES;
}

static BOOL AnyTouchesChanged(NSSet<UITouch *> *touches)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved) {
      return YES;
    }
  }
  return NO;
}

struct ActivePointer {
  /*
   * Pointer ID
   */
  NSInteger identifier;

  /*
   * The component view on which the touch started.
   */
  UIView<RCTComponentViewProtocol> *initialComponentView = nil;

  /*
   * The current target component view of the pointer
   */
  UIView<RCTComponentViewProtocol> *componentView = nil;

  /*
   * The location of the pointer relative to the root component view
   */
  CGPoint clientPoint;

  /*
   * The location of the pointer relative to the device's screen
   */
  CGPoint screenPoint;

  /*
   * The location of the pointer relative to the pointer's target
   */
  CGPoint offsetPoint;

  /*
   * Current timestamp of the pointer event
   */
  NSTimeInterval timestamp;

  /*
   * The current force of the pointer
   */
  Float force;

  /*
   * The type of touch received.
   */
  UITouchType touchType;

  /*
   * The radius (in points) of the touch.
   */
  CGFloat majorRadius;

  /*
   * The altitude (in radians) of the stylus.
   */
  CGFloat altitudeAngle;

  /*
   * The azimuth angle (in radians) of the stylus.
   */
  CGFloat azimuthAngle;

  /*
   * The button mask of the touch
   */
  UIEventButtonMask buttonMask;

  /*
   * The bit mask of modifier flags in the gesture represented by the receiver.
   */
  UIKeyModifierFlags modifierFlags;

  /*
   * Indicates if the active touch represents the primary pointer of this pointer type.
   */
  BOOL isPrimary;

  /*
   * The button number that was pressed (if applicable) when the event was fired.
   */
  NSInteger button;

  /*
   * Informs the event system that when the touch is released it should be treated as the
   * pointer leaving the screen entirely.
   */
  BOOL shouldLeaveWhenReleased;

  struct Hasher {
    size_t operator()(const ActivePointer &activePointer) const
    {
      return std::hash<decltype(activePointer.identifier)>()(activePointer.identifier);
    }
  };

  struct Comparator {
    bool operator()(const ActivePointer &lhs, const ActivePointer &rhs) const
    {
      return lhs.identifier == rhs.identifier;
    }
  };
};

// Mouse and Pen pointers get reserved IDs so they stay consistent no matter the order
// at which events come in
static NSInteger constexpr kMousePointerId = 0;
static NSInteger constexpr kPencilPointerId = 1;

// If a new reserved ID is added above this should be incremented to ensure touch events
// do not conflict
static NSInteger constexpr kTouchIdentifierPoolOffset = 2;

static SharedTouchEventEmitter GetTouchEmitterFromView(UIView *componentView, CGPoint point)
{
  return [(id<RCTTouchableComponentViewProtocol>)componentView touchEventEmitterAtPoint:point];
}

static NSOrderedSet<RCTReactTaggedView *> *GetTouchableViewsInPathToRoot(UIView *componentView)
{
  NSMutableOrderedSet *results = [NSMutableOrderedSet orderedSet];
  do {
    if ([componentView respondsToSelector:@selector(touchEventEmitterAtPoint:)]) {
      [results addObject:[RCTReactTaggedView wrap:componentView]];
    }
    componentView = componentView.superview;
  } while (componentView);
  return results;
}

static UIView *FindClosestFabricManagedTouchableView(UIView *componentView)
{
  while (componentView) {
    if ([componentView respondsToSelector:@selector(touchEventEmitterAtPoint:)]) {
      return componentView;
    }
    componentView = componentView.superview;
  }
  return nil;
}

static NSInteger ButtonMaskDiffToButton(UIEventButtonMask prevButtonMask, UIEventButtonMask curButtonMask)
{
  if ((prevButtonMask & UIEventButtonMaskPrimary) != (curButtonMask & UIEventButtonMaskPrimary)) {
    return 0;
  }
  if ((prevButtonMask & 0x4) != (curButtonMask & 0x4)) {
    return 1;
  }
  if ((prevButtonMask & UIEventButtonMaskSecondary) != (curButtonMask & UIEventButtonMaskSecondary)) {
    return 2;
  }

  return -1;
}

// Returns a CGPoint which represents the tiltX/Y values (in RADIANS)
// Adapted from https://gist.github.com/k3a/2903719bb42b48c9198d20c2d6f73ac1
static CGPoint SphericalToTilt(CGFloat altitudeAngleRad, CGFloat azimuthAngleRad)
{
  if (altitudeAngleRad == M_PI / 2.0) {
    return CGPointMake(0.0, 0.0);
  } else if (altitudeAngleRad == 0.0) {
    // when pen is laying on the pad it is impossible to precisely encode but at least approximate for 4 cases
    if (azimuthAngleRad > 7.0 * M_PI / 4.0 || azimuthAngleRad <= M_PI / 4.0) {
      // for azimuthRad == 0, the pen is on the positive Y axis
      return CGPointMake(0.0, M_PI / 2.0);
    } else if (azimuthAngleRad > M_PI / 4.0 && azimuthAngleRad <= 3 * M_PI / 4.0) {
      // for azimuthRad == math.pi/2 the pen is on the positive X axis
      return CGPointMake(M_PI / 2.0, 0.0);
    } else if (azimuthAngleRad > 3.0 * M_PI / 4.0 && azimuthAngleRad <= 5.0 * M_PI / 4.0) {
      // for azimuthRad == math.pi, the pen is on the negative Y axis
      return CGPointMake(0.0, -M_PI / 2.0);
    } else if (azimuthAngleRad > 5.0 * M_PI / 4.0 && azimuthAngleRad <= 7.0 * M_PI / 4.0) {
      // for azimuthRad == math.pi + math.pi/2 pen on negative X axis
      return CGPointMake(-M_PI / 2.0, 0.0);
    }
  }

  CGFloat tanAlt = tan(altitudeAngleRad); // tan(x) = sin(x)/cos(x)

  CGFloat tiltXrad = atan(sin(azimuthAngleRad) / tanAlt);
  CGFloat tiltYrad = atan(cos(azimuthAngleRad) / tanAlt);

  return CGPointMake(tiltXrad, tiltYrad);
}

static CGFloat RadsToDegrees(CGFloat rads)
{
  return rads * 180 / M_PI;
}

static NSInteger ButtonMaskToButtons(UIEventButtonMask buttonMask)
{
  NSInteger buttonsMaskResult = 0;

  if ((buttonMask & UIEventButtonMaskPrimary) != 0) {
    buttonsMaskResult |= 1;
  }
  if ((buttonMask & UIEventButtonMaskSecondary) != 0) {
    buttonsMaskResult |= 2;
  }
  // undocumented mask value which represents the "auxiliary button" (i.e. middle mouse button)
  if ((buttonMask & 0x4) != 0) {
    buttonsMaskResult |= 4;
  }

  return buttonsMaskResult;
}

static const char *PointerTypeCStringFromUITouchType(UITouchType type)
{
  switch (type) {
    case UITouchTypeDirect:
      return "touch";
    case UITouchTypePencil:
      return "pen";
    case UITouchTypeIndirectPointer:
      return "mouse";
    case UITouchTypeIndirect:
    default:
      return "";
  }
}

static void UpdatePointerEventModifierFlags(PointerEvent &event, UIKeyModifierFlags flags)
{
  event.ctrlKey = (flags & UIKeyModifierControl) != 0;
  event.shiftKey = (flags & UIKeyModifierShift) != 0;
  event.altKey = (flags & UIKeyModifierAlternate) != 0;
  event.metaKey = (flags & UIKeyModifierCommand) != 0;
}

static PointerEvent CreatePointerEventFromActivePointer(
    ActivePointer activePointer,
    RCTPointerEventType eventType,
    UIView *rootComponentView)
{
  PointerEvent event = {};
  event.pointerId = activePointer.identifier;
  event.pointerType = PointerTypeCStringFromUITouchType(activePointer.touchType);
  event.timeStamp = RCTHighResTimeStampFromSeconds(activePointer.timestamp);

  if (eventType == RCTPointerEventTypeCancel) {
    event.clientPoint = RCTPointFromCGPoint(CGPointZero);
    event.screenPoint =
        RCTPointFromCGPoint([rootComponentView convertPoint:CGPointZero
                                          toCoordinateSpace:rootComponentView.window.screen.coordinateSpace]);
    event.offsetPoint = RCTPointFromCGPoint([rootComponentView convertPoint:CGPointZero
                                                                     toView:activePointer.componentView]);
  } else {
    event.clientPoint = RCTPointFromCGPoint(activePointer.clientPoint);
    event.screenPoint = RCTPointFromCGPoint(activePointer.screenPoint);
    event.offsetPoint = RCTPointFromCGPoint(activePointer.offsetPoint);
  }

  event.pressure = activePointer.force;

  if (@available(iOS 13.4, tvOS 13.4, *)) {
    if (activePointer.touchType == UITouchTypeIndirectPointer) {
      // pointer events with a mouse button pressed should report a pressure of 0.5
      // when the touch is down and 0.0 when it is lifted regardless of how it is reported by the OS
      event.pressure = eventType != RCTPointerEventTypeEnd ? 0.5 : 0.0;
    }
  }

  CGFloat pointerSize = activePointer.majorRadius * 2.0;

  if (@available(iOS 13.4, tvOS 13.4, *)) {
    if (activePointer.touchType == UITouchTypeIndirectPointer) {
      // mouse type pointers should always report a size of 1
      pointerSize = 1.0;
    }
  }

  event.width = pointerSize;
  event.height = pointerSize;

  CGPoint tilt = SphericalToTilt(activePointer.altitudeAngle, activePointer.azimuthAngle);
  event.tiltX = RadsToDegrees(tilt.x);
  event.tiltY = RadsToDegrees(tilt.y);

  event.detail = 0;

  event.button = activePointer.button;
  event.buttons = ButtonMaskToButtons(activePointer.buttonMask);

  UpdatePointerEventModifierFlags(event, activePointer.modifierFlags);

  event.tangentialPressure = 0.0;
  event.twist = 0;
  event.isPrimary = activePointer.isPrimary;

  return event;
}

static PointerEvent CreatePointerEventFromIncompleteHoverData(
    NSInteger pointerId,
    std::string pointerType,
    CGPoint clientLocation,
    CGPoint screenLocation,
    CGPoint offsetLocation,
    UIKeyModifierFlags modifierFlags,
    HighResTimeStamp timeStamp)
{
  PointerEvent event = {};
  event.pointerId = pointerId;
  event.pressure = 0.0;
  event.pointerType = pointerType;
  event.clientPoint = RCTPointFromCGPoint(clientLocation);
  event.screenPoint = RCTPointFromCGPoint(screenLocation);
  event.offsetPoint = RCTPointFromCGPoint(offsetLocation);
  event.width = 1.0;
  event.height = 1.0;
  event.tiltX = 0;
  event.tiltY = 0;
  event.detail = 0;
  event.button = -1;
  event.buttons = 0;
  UpdatePointerEventModifierFlags(event, modifierFlags);
  event.tangentialPressure = 0.0;
  event.twist = 0;
  event.isPrimary = true;
  event.timeStamp = timeStamp;

  return event;
}

static void UpdateActivePointerWithUITouch(
    ActivePointer &activePointer,
    UITouch *uiTouch,
    UIEvent *uiEvent,
    UIView *rootComponentView)
{
  CGPoint location = [uiTouch locationInView:rootComponentView];
  UIView *hitTestedView = [rootComponentView hitTest:location withEvent:nil];
  activePointer.componentView = FindClosestFabricManagedTouchableView(hitTestedView);

  activePointer.clientPoint = [uiTouch locationInView:rootComponentView];
  activePointer.screenPoint = [rootComponentView convertPoint:activePointer.clientPoint
                                            toCoordinateSpace:rootComponentView.window.screen.coordinateSpace];
  activePointer.offsetPoint = [uiTouch locationInView:activePointer.componentView];

  activePointer.timestamp = uiTouch.timestamp;

  activePointer.force = RCTZeroIfNaN(uiTouch.force / uiTouch.maximumPossibleForce);

  activePointer.touchType = uiTouch.type;
  activePointer.majorRadius = uiTouch.majorRadius;
  activePointer.altitudeAngle = uiTouch.altitudeAngle;
  activePointer.azimuthAngle = [uiTouch azimuthAngleInView:nil];

  UIEventButtonMask nextButtonMask = 0;
  if (uiTouch.phase != UITouchPhaseEnded) {
    nextButtonMask = uiTouch.type == UITouchTypeIndirectPointer ? uiEvent.buttonMask : 1;
  }
  activePointer.button = ButtonMaskDiffToButton(activePointer.buttonMask, nextButtonMask);
  activePointer.buttonMask = nextButtonMask;
  activePointer.modifierFlags = uiEvent.modifierFlags;
}

/**
 * Given an ActivePointer determine if it is still within the same event target tree as
 * the one which initiated the pointer gesture.
 */
static BOOL IsPointerWithinInitialTree(ActivePointer activePointer)
{
  NSOrderedSet<RCTReactTaggedView *> *initialViewSet =
      GetTouchableViewsInPathToRoot(activePointer.initialComponentView);
  for (RCTReactTaggedView *canidateTaggedView in initialViewSet) {
    if (canidateTaggedView.tag == activePointer.componentView.tag) {
      return YES;
    }
  }
  return NO;
}

/**
 * Surprisingly, `__unsafe_unretained id` pointers are not regular pointers
 * and `std::hash<>` cannot hash them.
 * This is quite trivial but decent implementation of hasher function
 * inspired by this research: https://stackoverflow.com/a/21062520/496389.
 */
template <typename PointerT>
struct PointerHasher {
  constexpr std::size_t operator()(const PointerT &value) const
  {
    return reinterpret_cast<size_t>(value);
  }
};

@interface RCTSurfacePointerHandler () <UIGestureRecognizerDelegate>
@end

@implementation RCTSurfacePointerHandler {
  std::unordered_map<__unsafe_unretained UITouch *, ActivePointer, PointerHasher<__unsafe_unretained UITouch *>>
      _activePointers;

  /*
   * We hold the view weakly to prevent a retain cycle.
   */
  __weak UIView *_rootComponentView;
  RCTIdentifierPool<17> _identifierPool;

  UIHoverGestureRecognizer *_mouseHoverRecognizer API_AVAILABLE(ios(13.0));
  UIHoverGestureRecognizer *_penHoverRecognizer API_AVAILABLE(ios(13.0));

  NSMutableDictionary<NSNumber *, NSOrderedSet<RCTReactTaggedView *> *> *_currentlyHoveredViewsPerPointer;

  NSInteger _primaryTouchPointerId;
}

- (instancetype)init
{
  if (self = [super initWithTarget:nil action:nil]) {
    // `cancelsTouchesInView` and `delaysTouches*` are needed in order
    // to be used as a top level event delegated recognizer.
    // Otherwise, lower-level components not built using React Native,
    // will fail to recognize gestures.
    self.cancelsTouchesInView = NO;
    self.delaysTouchesBegan = NO; // This is default value.
    self.delaysTouchesEnded = NO;

    self.delegate = self;

    _mouseHoverRecognizer = nil;
    _penHoverRecognizer = nil;
    _currentlyHoveredViewsPerPointer = [[NSMutableDictionary alloc] init];
    _primaryTouchPointerId = -1;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithTarget : (id)target action : (SEL)action)

- (void)attachToView:(UIView *)view
{
  RCTAssert(self.view == nil, @"RCTSurfacePointerHandler already has an attached view.");

  [view addGestureRecognizer:self];
  _rootComponentView = view;

  _mouseHoverRecognizer = [[UIHoverGestureRecognizer alloc] initWithTarget:self action:@selector(mouseHovering:)];
  _mouseHoverRecognizer.allowedTouchTypes = @[ @(UITouchTypeIndirectPointer) ];
  [view addGestureRecognizer:_mouseHoverRecognizer];

  _penHoverRecognizer = [[UIHoverGestureRecognizer alloc] initWithTarget:self action:@selector(penHovering:)];
  _penHoverRecognizer.allowedTouchTypes = @[ @(UITouchTypePencil) ];
  [view addGestureRecognizer:_penHoverRecognizer];
}

- (void)detachFromView:(UIView *)view
{
  RCTAssertParam(view);
  RCTAssert(self.view == view, @"RCTSufracePointerHandler attached to another view.");

  [view removeGestureRecognizer:self];
  _rootComponentView = nil;

  if (_mouseHoverRecognizer != nil) {
    [view removeGestureRecognizer:_mouseHoverRecognizer];
    _mouseHoverRecognizer = nil;
  }

  if (_penHoverRecognizer != nil) {
    [view removeGestureRecognizer:_penHoverRecognizer];
    _penHoverRecognizer = nil;
  }
}

#pragma mark - UITouch to ActivePointer management

- (void)_registerTouches:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  for (UITouch *touch in touches) {
    ActivePointer activePointer = {};

    // Determine the identifier of the Pointer and if it is the primary pointer

    switch (touch.type) {
      case UITouchTypeIndirectPointer:
        activePointer.identifier = kMousePointerId;
        activePointer.isPrimary = true;
        break;
      case UITouchTypePencil:
        activePointer.identifier = kPencilPointerId;
        activePointer.isPrimary = true;
        break;
      default:
        // use the identifier pool offset to ensure no conflicts between the reserved IDs and the
        // touch IDs
        activePointer.identifier = _identifierPool.dequeue() + kTouchIdentifierPoolOffset;
        if (_primaryTouchPointerId == -1) {
          _primaryTouchPointerId = activePointer.identifier;
          activePointer.isPrimary = true;
        }
        break;
    }

    // If the pointer has not been marked as hovering over views before the touch started, we register
    // that the activeTouch should not maintain its hovered state once the pointer has been lifted.
    auto currentlyHoveredViews = [_currentlyHoveredViewsPerPointer objectForKey:@(activePointer.identifier)];
    if (currentlyHoveredViews == nil || [currentlyHoveredViews count] == 0) {
      activePointer.shouldLeaveWhenReleased = YES;
    }

    activePointer.initialComponentView = FindClosestFabricManagedTouchableView(touch.view);

    UpdateActivePointerWithUITouch(activePointer, touch, event, _rootComponentView);

    _activePointers.emplace(touch, activePointer);
  }
}

- (void)_updateTouches:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  for (UITouch *touch in touches) {
    auto iterator = _activePointers.find(touch);
    RCTAssert(iterator != _activePointers.end(), @"Inconsistency between local and UIKit touch registries");
    if (iterator == _activePointers.end()) {
      continue;
    }
    UpdateActivePointerWithUITouch(iterator->second, touch, event, _rootComponentView);
  }
}

- (void)_unregisterTouches:(NSSet<UITouch *> *)touches
{
  for (UITouch *touch in touches) {
    auto iterator = _activePointers.find(touch);
    RCTAssert(iterator != _activePointers.end(), @"Inconsistency between local and UIKit touch registries");
    if (iterator == _activePointers.end()) {
      continue;
    }
    auto &activePointer = iterator->second;

    if (activePointer.identifier == _primaryTouchPointerId) {
      _primaryTouchPointerId = -1;
    }

    // only need to enqueue if the touch type isn't one with a reserved identifier
    switch (touch.type) {
      case UITouchTypeIndirectPointer:
      case UITouchTypePencil:
        break;
      default:
        // since the touch's identifier has been offset we need to re-normalize it to 0-based
        // which is what the identifier pool expects
        _identifierPool.enqueue(activePointer.identifier - kTouchIdentifierPoolOffset);
    }

    _activePointers.erase(touch);
  }
}

- (std::vector<ActivePointer>)_activePointersFromTouches:(NSSet<UITouch *> *)touches
{
  std::vector<ActivePointer> activePointers;
  activePointers.reserve(touches.count);

  for (UITouch *touch in touches) {
    auto iterator = _activePointers.find(touch);
    RCTAssert(iterator != _activePointers.end(), @"Inconsistency between local and UIKit touch registries");
    if (iterator == _activePointers.end()) {
      continue;
    }
    activePointers.push_back(iterator->second);
  }

  return activePointers;
}

- (void)_dispatchActivePointers:(std::vector<ActivePointer>)activePointers eventType:(RCTPointerEventType)eventType
{
  for (const auto &activePointer : activePointers) {
    PointerEvent pointerEvent = CreatePointerEventFromActivePointer(activePointer, eventType, _rootComponentView);

    SharedTouchEventEmitter eventEmitter = GetTouchEmitterFromView(
        activePointer.componentView,
        [_rootComponentView convertPoint:activePointer.clientPoint toView:activePointer.componentView]);

    if (eventEmitter != nil) {
      switch (eventType) {
        case RCTPointerEventTypeStart: {
          eventEmitter->onPointerDown(std::move(pointerEvent));
          break;
        }
        case RCTPointerEventTypeMove: {
          eventEmitter->onPointerMove(std::move(pointerEvent));
          break;
        }
        case RCTPointerEventTypeEnd: {
          eventEmitter->onPointerUp(pointerEvent);
          if (pointerEvent.isPrimary && pointerEvent.button == 0 && IsPointerWithinInitialTree(activePointer)) {
            eventEmitter->onClick(std::move(pointerEvent));
          }
          break;
        }
        case RCTPointerEventTypeCancel: {
          eventEmitter->onPointerCancel(std::move(pointerEvent));
          break;
        }
      }
    }
  }
}

#pragma mark - `UIResponder`-ish touch-delivery methods

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];

  [self _registerTouches:touches withEvent:event];
  [self _dispatchActivePointers:[self _activePointersFromTouches:touches] eventType:RCTPointerEventTypeStart];

  if (self.state == UIGestureRecognizerStatePossible) {
    self.state = UIGestureRecognizerStateBegan;
  } else if (self.state == UIGestureRecognizerStateBegan) {
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];

  [self _updateTouches:touches withEvent:event];
  [self _dispatchActivePointers:[self _activePointersFromTouches:touches] eventType:RCTPointerEventTypeMove];

  self.state = UIGestureRecognizerStateChanged;
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];

  [self _updateTouches:touches withEvent:event];
  [self _dispatchActivePointers:[self _activePointersFromTouches:touches] eventType:RCTPointerEventTypeEnd];
  [self _unregisterTouches:touches];

  if (AllTouchesAreCancelledOrEnded(event.allTouches)) {
    self.state = UIGestureRecognizerStateEnded;
  } else if (AnyTouchesChanged(event.allTouches)) {
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];

  [self _updateTouches:touches withEvent:event];
  [self _dispatchActivePointers:[self _activePointersFromTouches:touches] eventType:RCTPointerEventTypeCancel];
  [self _unregisterTouches:touches];

  if (AllTouchesAreCancelledOrEnded(event.allTouches)) {
    self.state = UIGestureRecognizerStateCancelled;
  } else if (AnyTouchesChanged(event.allTouches)) {
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)reset
{
  [super reset];

  if (!_activePointers.empty()) {
    std::vector<ActivePointer> activePointers;
    activePointers.reserve(_activePointers.size());

    for (const auto &pair : _activePointers) {
      activePointers.push_back(pair.second);
    }

    [self _dispatchActivePointers:activePointers eventType:RCTPointerEventTypeCancel];

    // Force-unregistering all the pointers
    _activePointers.clear();
    _identifierPool.reset();
  }
}

- (BOOL)canPreventGestureRecognizer:(UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

#pragma mark - Hover callbacks

- (void)penHovering:(UIHoverGestureRecognizer *)recognizer API_AVAILABLE(ios(13.0))
{
  [self hovering:recognizer pointerId:kPencilPointerId pointerType:"pen"];
}

- (void)mouseHovering:(UIHoverGestureRecognizer *)recognizer API_AVAILABLE(ios(13.0))
{
  [self hovering:recognizer pointerId:kMousePointerId pointerType:"mouse"];
}

- (void)hovering:(UIHoverGestureRecognizer *)recognizer
       pointerId:(int)pointerId
     pointerType:(std::string)pointerType API_AVAILABLE(ios(13.0))
{
  UIView *listenerView = recognizer.view;
  CGPoint clientLocation = [recognizer locationInView:listenerView];
  CGPoint screenLocation = [listenerView convertPoint:clientLocation
                                    toCoordinateSpace:listenerView.window.screen.coordinateSpace];

  UIView *targetView = [listenerView hitTest:clientLocation withEvent:nil];
  targetView = FindClosestFabricManagedTouchableView(targetView);

  CGPoint offsetLocation = [recognizer locationInView:targetView];

  UIKeyModifierFlags modifierFlags;

  modifierFlags = recognizer.modifierFlags;

  // For hover events, use the current time as we don't have a precise timestamp
  HighResTimeStamp eventTimestamp = HighResTimeStamp::now();

  PointerEvent event = CreatePointerEventFromIncompleteHoverData(
      pointerId, pointerType, clientLocation, screenLocation, offsetLocation, modifierFlags, eventTimestamp);

  SharedTouchEventEmitter eventEmitter = GetTouchEmitterFromView(targetView, offsetLocation);
  if (eventEmitter != nil) {
    switch (recognizer.state) {
      case UIGestureRecognizerStateEnded:
        eventEmitter->onPointerLeave(std::move(event));
        break;
      default:
        eventEmitter->onPointerMove(std::move(event));
        break;
    }
  }
}

@end

#endif // !TARGET_OS_TV
