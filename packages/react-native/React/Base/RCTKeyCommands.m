/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTKeyCommands.h"

#import <UIKit/UIKit.h>

#import <objc/message.h>
#import <objc/runtime.h>
#import "RCTDefines.h"
#import "RCTUtils.h"

#if RCT_DEV && (TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST)

@interface UIEvent (UIPhysicalKeyboardEvent)

@property (nonatomic) NSString *_modifiedInput;
@property (nonatomic) NSString *_unmodifiedInput;
@property (nonatomic) UIKeyModifierFlags _modifierFlags;
@property (nonatomic) BOOL _isKeyDown;
@property (nonatomic) long _keyCode;

@end

@interface RCTKeyCommand : NSObject <NSCopying>

@property (nonatomic, copy, readonly) NSString *key;
@property (nonatomic, readonly) UIKeyModifierFlags flags;
@property (nonatomic, copy) void (^block)(UIKeyCommand *);

@end

@implementation RCTKeyCommand

- (instancetype)init:(NSString *)key flags:(UIKeyModifierFlags)flags block:(void (^)(UIKeyCommand *))block
{
  if ((self = [super init])) {
    _key = key;
    _flags = flags;
    _block = block;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (id)copyWithZone:(__unused NSZone *)zone
{
  return self;
}

- (NSUInteger)hash
{
  return _key.hash ^ _flags;
}

- (BOOL)isEqual:(RCTKeyCommand *)object
{
  if (![object isKindOfClass:[RCTKeyCommand class]]) {
    return NO;
  }
  return [self matchesInput:object.key flags:object.flags];
}

- (BOOL)matchesInput:(NSString *)input flags:(UIKeyModifierFlags)flags
{
  // We consider the key command a match if the modifier flags match
  // exactly or is there are no modifier flags. This means that for
  // `cmd + r`, we will match both `cmd + r` and `r` but not `opt + r`.
  return [_key isEqual:input] && (_flags == flags || flags == 0);
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@:%p input=\"%@\" flags=%lld hasBlock=%@>",
                                    [self class],
                                    self,
                                    _key,
                                    (long long)_flags,
                                    _block ? @"YES" : @"NO"];
}

@end

@interface RCTKeyCommands ()

@property (nonatomic, strong) NSMutableSet<RCTKeyCommand *> *commands;

@end

@implementation RCTKeyCommands

+ (void)initialize
{
  SEL originalKeyEventSelector = NSSelectorFromString(@"handleKeyUIEvent:");
  SEL swizzledKeyEventSelector = NSSelectorFromString(
      [NSString stringWithFormat:@"_rct_swizzle_%x_%@", arc4random(), NSStringFromSelector(originalKeyEventSelector)]);

  void (^handleKeyUIEventSwizzleBlock)(UIApplication *, UIEvent *) = ^(UIApplication *slf, UIEvent *event) {
    [[[self class] sharedInstance] handleKeyUIEventSwizzle:event];

    ((void (*)(id, SEL, id))objc_msgSend)(slf, swizzledKeyEventSelector, event);
  };

  RCTSwapInstanceMethodWithBlock(
      [UIApplication class], originalKeyEventSelector, handleKeyUIEventSwizzleBlock, swizzledKeyEventSelector);
}

- (void)handleKeyUIEventSwizzle:(UIEvent *)event
{
  NSString *modifiedInput = nil;
  UIKeyModifierFlags modifierFlags = 0;
  BOOL isKeyDown = NO;

  if ([event respondsToSelector:@selector(_modifiedInput)]) {
    modifiedInput = [event _modifiedInput];
  }

  if ([event respondsToSelector:@selector(_modifierFlags)]) {
    modifierFlags = [event _modifierFlags];
  }

  if ([event respondsToSelector:@selector(_isKeyDown)]) {
    isKeyDown = [event _isKeyDown];
  }

  if (isKeyDown && modifiedInput.length > 0) {
    UIResponder *firstResponder = nil;
    for (UIWindow *window in [self allWindows]) {
      firstResponder = [window valueForKey:@"firstResponder"];
      if (firstResponder) {
        break;
      }
    }

    // When there's an active responder, ignore key commands that don't use a
    // shortcut modifier (Command/Control/Option) so that typing into a focused
    // view (e.g. a text field) isn't intercepted. Shift and Caps Lock don't
    // count here since they're part of normal text input. Commands with a
    // shortcut modifier (e.g. Cmd+D to open the Dev Menu) should still fire.
    UIKeyModifierFlags shortcutModifiers = UIKeyModifierCommand | UIKeyModifierControl | UIKeyModifierAlternate;
    if (!firstResponder || (modifierFlags & shortcutModifiers) != 0) {
      [self RCT_handleKeyCommand:modifiedInput flags:modifierFlags];
    }
  }
};

- (NSArray<UIWindow *> *)allWindows
{
  BOOL includeInternalWindows = YES;
  BOOL onlyVisibleWindows = NO;

  // Obfuscating selector allWindowsIncludingInternalWindows:onlyVisibleWindows:
  NSArray<NSString *> *allWindowsComponents =
      @[ @"al", @"lWindo", @"wsIncl", @"udingInt", @"ernalWin", @"dows:o", @"nlyVisi", @"bleWin", @"dows:" ];
  SEL allWindowsSelector = NSSelectorFromString([allWindowsComponents componentsJoinedByString:@""]);

  NSMethodSignature *methodSignature = [[UIWindow class] methodSignatureForSelector:allWindowsSelector];
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];

  invocation.target = [UIWindow class];
  invocation.selector = allWindowsSelector;
  [invocation setArgument:&includeInternalWindows atIndex:2];
  [invocation setArgument:&onlyVisibleWindows atIndex:3];
  [invocation invoke];

  __unsafe_unretained NSArray<UIWindow *> *windows = nil;
  [invocation getReturnValue:&windows];
  return windows;
}

- (void)RCT_handleKeyCommand:(NSString *)input flags:(UIKeyModifierFlags)modifierFlags
{
  // In Bridgeless mode we might incur in some concurrency issues
  // where the React Native instance is invalidated while iterating on the
  // list of available commands.
  // That will cleanup the set while iterating, which is a not allowed mutation.
  // To work around that, we store the commands that we need to execute in a separate
  // array, local to this function call, so we don't incur in concurrency issues
  NSMutableArray<RCTKeyCommand *> *commandsToExecute = [NSMutableArray new];
  for (RCTKeyCommand *command in [RCTKeyCommands sharedInstance].commands) {
    if ([command matchesInput:input flags:modifierFlags]) {
      if (command.block) {
        [commandsToExecute addObject:command];
      }
    }
  }

  for (RCTKeyCommand *command in commandsToExecute) {
    command.block(nil);
  }
}

+ (instancetype)sharedInstance
{
  static RCTKeyCommands *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [self new];
  });

  return sharedInstance;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _commands = [NSMutableSet new];
  }
  return self;
}

- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block
{
  RCTAssertMainQueue();

  RCTKeyCommand *keyCommand = [[RCTKeyCommand alloc] init:input flags:flags block:block];
  [_commands removeObject:keyCommand];
  [_commands addObject:keyCommand];
}

- (void)unregisterKeyCommandWithInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainQueue();

  for (RCTKeyCommand *command in _commands.allObjects) {
    if ([command matchesInput:input flags:flags]) {
      [_commands removeObject:command];
      break;
    }
  }
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  RCTAssertMainQueue();

  for (RCTKeyCommand *command in _commands) {
    if ([command matchesInput:input flags:flags]) {
      return YES;
    }
  }
  return NO;
}

@end

#else

@implementation RCTKeyCommands

+ (instancetype)sharedInstance
{
  return nil;
}

- (void)registerKeyCommandWithInput:(NSString *)input
                      modifierFlags:(UIKeyModifierFlags)flags
                             action:(void (^)(UIKeyCommand *))block
{
}

- (void)unregisterKeyCommandWithInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
}

- (BOOL)isKeyCommandRegisteredForInput:(NSString *)input modifierFlags:(UIKeyModifierFlags)flags
{
  return NO;
}

@end

#endif
