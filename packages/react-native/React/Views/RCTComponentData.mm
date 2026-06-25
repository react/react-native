/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentData.h"

#import <objc/message.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>

#import "RCTBridge.h"
#import "RCTBridgeModule.h"
#import "RCTComponentEvent.h"
#import "RCTConstants.h"
#import "RCTConvert.h"
#import "RCTEventDispatcherProtocol.h"
#import "RCTModuleMethod.h"
#import "RCTParserUtils.h"
#import "RCTShadowView.h"
#import "RCTUtils.h"
#import "UIView+React.h"

typedef void (^RCTPropBlock)(id<RCTComponent> view, id json);
typedef NSMutableDictionary<NSString *, RCTPropBlock> RCTPropBlockDictionary;
typedef void (^InterceptorBlock)(NSString *eventName, NSDictionary *event, id sender);

/**
 * Get the converter function for the specified type
 */
static SEL selectorForType(NSString *type)
{
  const char *input = type.UTF8String;
  return NSSelectorFromString([RCTParseType(&input) stringByAppendingString:@":"]);
}

@implementation RCTComponentData {
  id<RCTComponent> _defaultView; // Only needed for RCT_CUSTOM_VIEW_PROPERTY
  RCTPropBlockDictionary *_viewPropBlocks;
  RCTPropBlockDictionary *_shadowPropBlocks;
  __weak RCTBridge *_bridge;
  __weak id<RCTEventDispatcherProtocol> _eventDispatcher;
}

@synthesize manager = _manager;
@synthesize bridgelessViewManager = _bridgelessViewManager;

- (instancetype)initWithManagerClass:(Class)managerClass
                              bridge:(RCTBridge *)bridge
                     eventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher
{
  if ((self = [super init]) != nullptr) {
    _bridge = bridge;
    _eventDispatcher = eventDispatcher;
    _managerClass = managerClass;
    _viewPropBlocks = [NSMutableDictionary new];
    _shadowPropBlocks = [NSMutableDictionary new];

    _name = RCTViewManagerModuleNameForClass(managerClass);
  }
  return self;
}

- (BOOL)isBridgeMode
{
  // If we are in bridge mode, the bridge is RCTBridge
  // If we are bridgeless, the bridge is RCTBridgeProxy
  return [_bridge isKindOfClass:[RCTBridge class]];
}

- (RCTViewManager *)manager
{
  if ((_manager == nullptr) && [self isBridgeMode]) {
    _manager = [_bridge moduleForClass:_managerClass];
  } else if ((_manager == nullptr) && (_bridgelessViewManager == nullptr)) {
    _bridgelessViewManager = [_bridge moduleForClass:_managerClass];
  }
  return (_manager != nullptr) ? _manager : _bridgelessViewManager;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (UIView *)createViewWithTag:(nullable NSNumber *)tag rootTag:(nullable NSNumber *)rootTag
{
  RCTAssertMainQueue();

  UIView *view = [self.manager view];
  view.reactTag = tag;
  view.rootTag = rootTag;
#if !TARGET_OS_TV
  view.multipleTouchEnabled = YES;
#endif
  view.userInteractionEnabled = YES; // required for touch handling
  view.layer.allowsGroupOpacity = YES; // required for touch handling
  return view;
}

- (RCTShadowView *)createShadowViewWithTag:(NSNumber *)tag
{
  RCTShadowView *shadowView = [self.manager shadowView];
  shadowView.reactTag = tag;
  shadowView.viewName = _name;
  return shadowView;
}

- (void)callCustomSetter:(SEL)setter onView:(id<RCTComponent>)view withProp:(id)json isShadowView:(BOOL)isShadowView
{
  json = RCTNilIfNull(json);
  if (!isShadowView) {
    if ((json == nullptr) && (_defaultView == nullptr)) {
      // Only create default view if json is null
      _defaultView = [self createViewWithTag:nil rootTag:nil];
    }
    ((void (*)(id, SEL, id, id, id))objc_msgSend)(self.manager, setter, json, view, _defaultView);
  } else {
    ((void (*)(id, SEL, id, id))objc_msgSend)(self.manager, setter, json, view);
  }
}

static RCTPropBlock createEventSetter(
    NSString *propName,
    SEL setter,
    InterceptorBlock eventInterceptor,
    id<RCTEventDispatcherProtocol> eventDispatcher)
{
  __weak id<RCTEventDispatcherProtocol> weakEventDispatcher = eventDispatcher;
  return ^(id target, id json) {
    void (^eventHandler)(NSDictionary *event) = nil;
    if ([RCTConvert BOOL:json]) {
      __weak id<RCTComponent> weakTarget = target;
      eventHandler = ^(NSDictionary *event) {
        // The component no longer exists, we shouldn't send the event
        id<RCTComponent> strongTarget = weakTarget;
        if (strongTarget == nullptr) {
          return;
        }

        if (eventInterceptor != nullptr) {
          eventInterceptor(propName, event, strongTarget.reactTag);
        } else {
          RCTComponentEvent *componentEvent = [[RCTComponentEvent alloc] initWithName:propName
                                                                              viewTag:strongTarget.reactTag
                                                                                 body:event];
          [weakEventDispatcher sendEvent:componentEvent];
        }
      };
    }
    ((void (*)(id, SEL, id))objc_msgSend)(target, setter, eventHandler);
  };
}

static RCTPropBlock createNSInvocationSetter(NSMethodSignature *typeSignature, SEL type, SEL getter, SEL setter)
{
  NSInvocation *typeInvocation = [NSInvocation invocationWithMethodSignature:typeSignature];
  typeInvocation.selector = type;
  typeInvocation.target = [RCTConvert class];

  __block NSInvocation *targetInvocation = nil;
  __block NSMutableData *defaultValue = nil;

  return ^(id target, id json) {
    if (target == nullptr) {
      return;
    }

    // Get default value
    if (defaultValue == nullptr) {
      if (json == nullptr) {
        // We only set the defaultValue when we first pass a non-null
        // value, so if the first value sent for a prop is null, it's
        // a no-op (we'd be resetting it to its default when its
        // value is already the default).
        return;
      }
      // Use NSMutableData to store defaultValue instead of malloc, so
      // it will be freed automatically when setterBlock is released.
      defaultValue = [[NSMutableData alloc] initWithLength:typeSignature.methodReturnLength];
      if ([target respondsToSelector:getter]) {
        NSMethodSignature *signature = [target methodSignatureForSelector:getter];
        NSInvocation *sourceInvocation = [NSInvocation invocationWithMethodSignature:signature];
        sourceInvocation.selector = getter;
        [sourceInvocation invokeWithTarget:target];
        [sourceInvocation getReturnValue:defaultValue.mutableBytes];
      }
    }

    // Get value
    BOOL freeValueOnCompletion = NO;
    void *value = defaultValue.mutableBytes;
    if (json != nullptr) {
      freeValueOnCompletion = YES;
      value = malloc(typeSignature.methodReturnLength);
      if (value == nullptr) {
        // CWE - 391 : Unchecked error condition
        // https://www.cvedetails.com/cwe-details/391/Unchecked-Error-Condition.html
        // https://eli.thegreenplace.net/2009/10/30/handling-out-of-memory-conditions-in-c
        abort();
      }
      [typeInvocation setArgument:&json atIndex:2];
      [typeInvocation invoke];
      [typeInvocation getReturnValue:value];
    }

    // Set value
    if (targetInvocation == nullptr) {
      NSMethodSignature *signature = [target methodSignatureForSelector:setter];
      targetInvocation = [NSInvocation invocationWithMethodSignature:signature];
      targetInvocation.selector = setter;
    }
    [targetInvocation setArgument:value atIndex:2];
    [targetInvocation invokeWithTarget:target];
    if (freeValueOnCompletion) {
      // Only free the value if we `malloc`d it locally, otherwise it
      // points to `defaultValue.mutableBytes`, which is managed by ARC.
      free(value);
    }
  };
}

- (RCTPropBlock)createPropBlock:(NSString *)name isShadowView:(BOOL)isShadowView
{
  // Get type
  SEL type = NULL;
  NSString *keyPath = nil;
  SEL selector =
      NSSelectorFromString([NSString stringWithFormat:@"propConfig%@_%@", isShadowView ? @"Shadow" : @"", name]);
  if ([_managerClass respondsToSelector:selector]) {
    NSArray<NSString *> *typeAndKeyPath = ((NSArray<NSString *> * (*)(id, SEL)) objc_msgSend)(_managerClass, selector);
    type = selectorForType(typeAndKeyPath[0]);
    keyPath = typeAndKeyPath.count > 1 ? typeAndKeyPath[1] : nil;
  } else {
    return ^(__unused id view, __unused id json) {
    };
  }

  // Check for custom setter
  if ([keyPath isEqualToString:@"__custom__"]) {
    // Get custom setter. There is no default view in the shadow case, so the selector is different.
    NSString *selectorString;
    if (!isShadowView) {
      selectorString =
          [NSString stringWithFormat:@"set_%@:for%@View:withDefaultView:", name, isShadowView ? @"Shadow" : @""];
    } else {
      selectorString = [NSString stringWithFormat:@"set_%@:forShadowView:", name];
    }

    SEL customSetter = NSSelectorFromString(selectorString);
    __weak RCTComponentData *weakSelf = self;
    return ^(id<RCTComponent> view, id json) {
      [weakSelf callCustomSetter:customSetter onView:view withProp:json isShadowView:isShadowView];
    };
  } else {
    // Disect keypath
    NSString *key = name;
    NSArray<NSString *> *parts = [keyPath componentsSeparatedByString:@"."];
    if (parts != nullptr) {
      key = parts.lastObject;
      parts = [parts subarrayWithRange:(NSRange){0, parts.count - 1}];
    }

    // Get property getter
    SEL getter = NSSelectorFromString(key);

    // Get property setter
    SEL setter = NSSelectorFromString(
        [NSString stringWithFormat:@"set%@%@:", [key substringToIndex:1].uppercaseString, [key substringFromIndex:1]]);

    // Build setter block
    void (^setterBlock)(id target, id json) = nil;
    if (type == NSSelectorFromString(@"RCTBubblingEventBlock:") ||
        type == NSSelectorFromString(@"RCTDirectEventBlock:") ||
        type == NSSelectorFromString(@"RCTCapturingEventBlock:")) {
      // Special case for event handlers
      setterBlock = createEventSetter(
          name, setter, self.eventInterceptor, [self isBridgeMode] ? _bridge.eventDispatcher : _eventDispatcher);
    } else {
      // Ordinary property handlers
      NSMethodSignature *typeSignature = [[RCTConvert class] methodSignatureForSelector:type];
      if (typeSignature == nullptr) {
        RCTLogError(@"No +[RCTConvert %@] function found.", NSStringFromSelector(type));
        return ^(__unused id<RCTComponent> view, __unused id json) {
        };
      }
      switch (typeSignature.methodReturnType[0]) {
#define RCT_CASE(_value, _type)                                       \
  case _value: {                                                      \
    __block BOOL setDefaultValue = NO;                                \
    __block _type defaultValue;                                       \
    _type (*convert)(id, SEL, id) = (__typeof(convert))objc_msgSend;  \
    _type (*get)(id, SEL) = (__typeof(get))objc_msgSend;              \
    void (*set)(id, SEL, _type) = (__typeof(set))objc_msgSend;        \
    setterBlock = ^(id target, id json) {                             \
      if (json) {                                                     \
        if (!setDefaultValue && target) {                             \
          if ([target respondsToSelector:getter]) {                   \
            defaultValue = get(target, getter);                       \
          }                                                           \
          setDefaultValue = YES;                                      \
        }                                                             \
        set(target, setter, convert([RCTConvert class], type, json)); \
      } else if (setDefaultValue) {                                   \
        set(target, setter, defaultValue);                            \
      }                                                               \
    };                                                                \
    break;                                                            \
  }

        RCT_CASE(_C_SEL, SEL)
        RCT_CASE(_C_CHARPTR, const char *)
        RCT_CASE(_C_CHR, char)
        RCT_CASE(_C_UCHR, unsigned char)
        RCT_CASE(_C_SHT, short)
        RCT_CASE(_C_USHT, unsigned short)
        RCT_CASE(_C_INT, int)
        RCT_CASE(_C_UINT, unsigned int)
        RCT_CASE(_C_LNG, long)
        RCT_CASE(_C_ULNG, unsigned long)
        RCT_CASE(_C_LNG_LNG, long long)
        RCT_CASE(_C_ULNG_LNG, unsigned long long)
        RCT_CASE(_C_FLT, float)
        RCT_CASE(_C_DBL, double)
        RCT_CASE(_C_BOOL, BOOL)
        RCT_CASE(_C_PTR, void *)
        RCT_CASE(_C_ID, id)

        case _C_STRUCT_B:
        default: {
          setterBlock = createNSInvocationSetter(typeSignature, type, getter, setter);
          break;
        }
      }
    }

    return ^(__unused id view, __unused id json) {
      // Follow keypath
      id target = view;
      for (NSString *part in parts) {
        target = [target valueForKey:part];
      }

      // Set property with json
      setterBlock(target, RCTNilIfNull(json));
    };
  }
}

- (RCTPropBlock)propBlockForKey:(NSString *)name isShadowView:(BOOL)isShadowView
{
  RCTPropBlockDictionary *propBlocks = isShadowView ? _shadowPropBlocks : _viewPropBlocks;
  RCTPropBlock propBlock = propBlocks[name];
  if (propBlock == nullptr) {
    propBlock = [self createPropBlock:name isShadowView:isShadowView];

#if RCT_DEBUG
    // Provide more useful log feedback if there's an error
    RCTPropBlock unwrappedBlock = propBlock;
    __weak __typeof(self) weakSelf = self;
    propBlock = ^(id<RCTComponent> view, id json) {
      NSString *logPrefix = [NSString
          stringWithFormat:@"Error setting property '%@' of %@ with tag #%@: ", name, weakSelf.name, view.reactTag];
      RCTPerformBlockWithLogPrefix(
          ^{
            unwrappedBlock(view, json);
          },
          logPrefix);
    };
#endif
    propBlocks[name] = [propBlock copy];
  }
  return propBlock;
}

- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(id<RCTComponent>)view
{
  [self setProps:props forView:view isShadowView:NO];
}

- (void)setProps:(NSDictionary<NSString *, id> *)props forShadowView:(RCTShadowView *)shadowView
{
  [self setProps:props forView:shadowView isShadowView:YES];
}

- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(id<RCTComponent>)view isShadowView:(BOOL)isShadowView
{
  if (view == nullptr) {
    return;
  }

  [props enumerateKeysAndObjectsUsingBlock:^(NSString *key, id json, __unused BOOL *stop) {
    [self propBlockForKey:key isShadowView:isShadowView](view, json);
  }];
}

+ (NSDictionary<NSString *, NSNumber *> *)commandsForViewMangerClass:(Class)managerClass
                                                             methods:(Method *)methods
                                                         methodCount:(unsigned int)methodCount
{
  NSMutableDictionary<NSString *, NSNumber *> *commands = [NSMutableDictionary new];
  static const char *prefix = "__rct_export__";
  const unsigned int prefixLength = strlen(prefix);
  int commandCount = 0;
  for (int i = 0; i < methodCount; i++) {
    SEL selector = method_getName(methods[i]);
    const char *selectorName = sel_getName(selector);
    if (strncmp(selectorName, prefix, prefixLength) != 0) {
      continue;
    }
    RCTMethodInfo *methodInfo = ((RCTMethodInfo * (*)(id, SEL)) objc_msgSend)(managerClass, selector);
    RCTModuleMethod *moduleMethod = [[RCTModuleMethod alloc] initWithExportedMethod:methodInfo
                                                                        moduleClass:managerClass];
    NSString *methodName = @(moduleMethod.JSMethodName);
    commands[methodName] = @(commandCount);
    commandCount += 1;
  }
  // View manager do not export getConstants with RCT_EXPORT_METHOD, so we inject it into "Commands" manually.
  if (commandCount > 0) {
    commands[@"getConstants"] = @(commandCount);
  }
  return commands;
}

+ (NSDictionary<NSString *, id> *)constantsForViewMangerClass:(Class)managerClass
{
  if ([managerClass instancesRespondToSelector:@selector(constantsToExport)]) {
    BOOL shouldRunOnMainThread = NO;

    if ([managerClass respondsToSelector:@selector(requiresMainQueueSetup)]) {
      shouldRunOnMainThread = [managerClass requiresMainQueueSetup];
    }
    if (shouldRunOnMainThread) {
      __block NSDictionary<NSString *, id> *constants;
      RCTUnsafeExecuteOnMainQueueSync(^{
        constants = [[managerClass new] constantsToExport];
      });
      return constants;
    } else {
      return [[managerClass new] constantsToExport];
    }
  }
  return @{};
}

+ (NSDictionary<NSString *, id> *)viewConfigForViewMangerClass:(Class)managerClass
{
  NSMutableArray<NSString *> *bubblingEvents = [NSMutableArray new];
  NSMutableArray<NSString *> *capturingEvents = [NSMutableArray new];
  NSMutableArray<NSString *> *directEvents = [NSMutableArray new];

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  if (RCTClassOverridesInstanceMethod(managerClass, @selector(customBubblingEventTypes))) {
    NSArray<NSString *> *events = [[managerClass new] customBubblingEventTypes];
    for (NSString *event in events) {
      [bubblingEvents addObject:RCTNormalizeInputEventName(event)];
    }
  }
#pragma clang diagnostic pop

  unsigned int count = 0;
  NSMutableDictionary *propTypes = [NSMutableDictionary new];
  Method *methods = class_copyMethodList(object_getClass(managerClass), &count);
  for (unsigned int i = 0; i < count; i++) {
    SEL selector = method_getName(methods[i]);
    const char *selectorName = sel_getName(selector);
    if (strncmp(selectorName, "propConfig", strlen("propConfig")) != 0) {
      continue;
    }

    // We need to handle both propConfig_* and propConfigShadow_* methods
    const char *underscorePos = strchr(selectorName + strlen("propConfig"), '_');
    if (underscorePos == nullptr) {
      continue;
    }

    NSString *name = @(underscorePos + 1);
    NSString *type = ((NSArray<NSString *> * (*)(id, SEL)) objc_msgSend)(managerClass, selector)[0];
    if (RCT_DEBUG && (propTypes[name] != nullptr) && ![propTypes[name] isEqualToString:type]) {
      RCTLogError(
          @"Property '%@' of component '%@' redefined from '%@' "
           "to '%@'",
          name,
          RCTViewManagerModuleNameForClass(managerClass),
          propTypes[name],
          type);
    }

    if ([type isEqualToString:@"RCTBubblingEventBlock"]) {
      [bubblingEvents addObject:RCTNormalizeInputEventName(name)];
      propTypes[name] = @"BOOL";
    } else if ([type isEqualToString:@"RCTCapturingEventBlock"]) {
      [capturingEvents addObject:RCTNormalizeInputEventName(name)];
      propTypes[name] = @"BOOL";
    } else if ([type isEqualToString:@"RCTDirectEventBlock"]) {
      [directEvents addObject:RCTNormalizeInputEventName(name)];
      propTypes[name] = @"BOOL";
    } else {
      propTypes[name] = type;
    }
  }

#if RCT_DEBUG
  for (NSString *event in bubblingEvents) {
    if ([directEvents containsObject:event]) {
      RCTLogError(
          @"Component '%@' registered '%@' as both a bubbling event "
           "and a direct event",
          RCTViewManagerModuleNameForClass(managerClass),
          event);
    }
  }
#endif

  Class superClass = [managerClass superclass];

  NSMutableDictionary *result = [[NSMutableDictionary alloc] initWithDictionary:@{
    @"propTypes" : propTypes,
    @"directEvents" : directEvents,
    @"bubblingEvents" : bubblingEvents,
    @"capturingEvents" : capturingEvents,
    @"baseModuleName" : superClass == [NSObject class] ? (id)kCFNull : RCTViewManagerModuleNameForClass(superClass),
  }];

  if (facebook::react::ReactNativeFeatureFlags::useNativeViewConfigsInBridgelessMode()) {
    result[@"Commands"] = [self commandsForViewMangerClass:managerClass methods:methods methodCount:count];
    result[@"Constants"] = [self constantsForViewMangerClass:managerClass];
  }

  free(methods);

  return result;
}

- (NSDictionary<NSString *, id> *)viewConfig
{
  // Make sure the manager is initialized before accessing view config.
  [self manager];
  return [RCTComponentData viewConfigForViewMangerClass:_managerClass];
}

NSString *RCTViewManagerModuleNameForClass(Class managerClass)
{
  // Hackety hack, this partially re-implements RCTBridgeModuleNameForClass
  // We want to get rid of RCT and RK prefixes, but a lot of JS code still references
  // view names by prefix. So, while RCTBridgeModuleNameForClass now drops these
  // prefixes by default, we'll still keep them around here.
  NSString *name = [managerClass moduleName];
  if (name.length == 0) {
    name = NSStringFromClass(managerClass);
  }
  if ([name hasPrefix:@"RK"]) {
    name = [name stringByReplacingCharactersInRange:(NSRange){0, @"RK".length} withString:@"RCT"];
  }
  if ([name hasSuffix:@"Manager"]) {
    name = [name substringToIndex:name.length - @"Manager".length];
  }

  RCTAssert(name.length, @"Invalid moduleName '%@'", name);

  return name;
}

@end
