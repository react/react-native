/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModuleMethod.h"

#import <objc/message.h>

#import "RCTAssert.h"
#import "RCTBridge+Private.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTCxxConvert.h"
#import "RCTLog.h"
#import "RCTManagedPointer.h"
#import "RCTParserUtils.h"
#import "RCTUtils.h"

typedef BOOL (^RCTArgumentBlock)(RCTBridge *, NSUInteger, id);

/**
 * Get the converter function for the specified type
 */
static SEL selectorForType(NSString *type)
{
  const char *input = type.UTF8String;
  return NSSelectorFromString([RCTParseType(&input) stringByAppendingString:@":"]);
}

@implementation RCTMethodArgument

- (instancetype)initWithType:(NSString *)type nullability:(RCTNullability)nullability unused:(BOOL)unused
{
  if (self = [super init]) {
    _type = [type copy];
    _nullability = nullability;
    _unused = unused;
  }
  return self;
}

@end

@implementation RCTModuleMethod {
  Class _moduleClass;
  const RCTMethodInfo *_methodInfo;
  NSString *_JSMethodName;

  SEL _selector;
  NSInvocation *_invocation;
  NSArray<RCTArgumentBlock> *_argumentBlocks;
  NSMutableArray *_retainedObjects;
}

static void RCTLogArgumentError(RCTModuleMethod *method, NSUInteger index, id valueOrType, const char *issue)
{
  RCTLogError(
      @"Argument %tu (%@) of %@.%s %s",
      index,
      valueOrType,
      RCTBridgeModuleNameForClass(method->_moduleClass),
      method.JSMethodName,
      issue);
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

RCT_EXTERN_C_BEGIN

// returns YES if the selector ends in a colon (indicating that there is at
// least one argument, and maybe more selector parts) or NO if it doesn't.
static BOOL RCTParseSelectorPart(const char **input, NSMutableString *selector)
{
  NSString *selectorPart;
  if (RCTParseSelectorIdentifier(input, &selectorPart)) {
    [selector appendString:selectorPart];
  }
  RCTSkipWhitespace(input);
  if (RCTReadChar(input, ':')) {
    [selector appendString:@":"];
    RCTSkipWhitespace(input);
    return YES;
  }
  return NO;
}

static BOOL RCTParseUnused(const char **input)
{
  return RCTReadString(input, "__attribute__((unused))") || RCTReadString(input, "__attribute__((__unused__))") ||
      RCTReadString(input, "__unused") || RCTReadString(input, "[[maybe_unused]]");
}

static RCTNullability RCTParseNullability(const char **input)
{
  if (RCTReadString(input, "nullable")) {
    return RCTNullable;
  } else if (RCTReadString(input, "nonnull")) {
    return RCTNonnullable;
  }
  return RCTNullabilityUnspecified;
}

static RCTNullability RCTParseNullabilityPostfix(const char **input)
{
  if (RCTReadString(input, "_Nullable") || RCTReadString(input, "__nullable")) {
    return RCTNullable;
  } else if (RCTReadString(input, "_Nonnull") || RCTReadString(input, "__nonnull")) {
    return RCTNonnullable;
  }
  return RCTNullabilityUnspecified;
}

// returns YES if execution is safe to proceed (enqueue callback invocation), NO if callback has already been invoked
#if RCT_DEBUG
static BOOL checkCallbackMultipleInvocations(BOOL *didInvoke)
{
  if (*didInvoke) {
    RCTFatal(RCTErrorWithMessage(
        @"Illegal callback invocation from native module. This callback type only permits a single invocation from native code."));
    return NO;
  } else {
    *didInvoke = YES;
    return YES;
  }
}
#endif

NSString *RCTParseMethodSignature(const char *input, NSArray<RCTMethodArgument *> **arguments)
{
  RCTSkipWhitespace(&input);

  NSMutableArray *args;
  NSMutableString *selector = [NSMutableString new];
  while (RCTParseSelectorPart(&input, selector)) {
    if (!args) {
      args = [NSMutableArray new];
    }

    // Parse type
    if (RCTReadChar(&input, '(')) {
      RCTSkipWhitespace(&input);

      // 5 cases that both nullable and __unused exist
      // 1: foo:(nullable __unused id)foo 2: foo:(nullable id __unused)foo
      // 3: foo:(__unused id _Nullable)foo 4: foo:(id __unused _Nullable)foo
      // 5: foo:(id _Nullable __unused)foo
      RCTNullability nullability = RCTParseNullability(&input);
      RCTSkipWhitespace(&input);

      BOOL unused = RCTParseUnused(&input);
      RCTSkipWhitespace(&input);

      NSString *type = RCTParseType(&input);
      RCTSkipWhitespace(&input);

      if (nullability == RCTNullabilityUnspecified) {
        nullability = RCTParseNullabilityPostfix(&input);
        RCTSkipWhitespace(&input);
        if (!unused) {
          unused = RCTParseUnused(&input);
          RCTSkipWhitespace(&input);
          if (unused && nullability == RCTNullabilityUnspecified) {
            nullability = RCTParseNullabilityPostfix(&input);
            RCTSkipWhitespace(&input);
          }
        }
      } else if (!unused) {
        unused = RCTParseUnused(&input);
        RCTSkipWhitespace(&input);
      }
      [args addObject:[[RCTMethodArgument alloc] initWithType:type nullability:nullability unused:unused]];
      RCTSkipWhitespace(&input);
      RCTReadChar(&input, ')');
      RCTSkipWhitespace(&input);
    } else {
      // Type defaults to id if unspecified
      [args addObject:[[RCTMethodArgument alloc] initWithType:@"id" nullability:RCTNullable unused:NO]];
    }

    // Argument name
    RCTParseArgumentIdentifier(&input, NULL);
    RCTSkipWhitespace(&input);
  }

  *arguments = [args copy];
  return selector;
}

RCT_EXTERN_C_END

- (instancetype)initWithExportedMethod:(const RCTMethodInfo *)exportedMethod moduleClass:(Class)moduleClass
{
  if (self = [super init]) {
    _moduleClass = moduleClass;
    _methodInfo = exportedMethod;
  }
  return self;
}

- (void)processMethodSignature
{
  NSArray<RCTMethodArgument *> *arguments;
  _selector = NSSelectorFromString(RCTParseMethodSignature(_methodInfo->objcName, &arguments));
  RCTAssert(_selector, @"%s is not a valid selector", _methodInfo->objcName);

  // Create method invocation
  NSMethodSignature *methodSignature = [_moduleClass instanceMethodSignatureForSelector:_selector];
  RCTAssert(methodSignature, @"%s is not a recognized Objective-C method.", sel_getName(_selector));
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
  invocation.selector = _selector;
  _invocation = invocation;
  NSMutableArray *retainedObjects = [NSMutableArray array];
  _retainedObjects = retainedObjects;

  // Process arguments
  NSUInteger numberOfArguments = methodSignature.numberOfArguments;
  NSMutableArray<RCTArgumentBlock> *argumentBlocks = [[NSMutableArray alloc] initWithCapacity:numberOfArguments - 2];

#if RCT_DEBUG
  __weak RCTModuleMethod *weakSelf = self;
#endif

#define RCT_RETAINED_ARG_BLOCK(_logic)                                                         \
  [argumentBlocks addObject:^(__unused __weak RCTBridge * bridge, NSUInteger index, id json) { \
    _logic [invocation setArgument:&value atIndex:(index) + 2];                                \
    if (value) {                                                                               \
      [retainedObjects addObject:value];                                                       \
    }                                                                                          \
    return YES;                                                                                \
  }]

#define __PRIMITIVE_CASE(_type, _nullable)                                                \
  {                                                                                       \
    isNullableType = _nullable;                                                           \
    _type (*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;                    \
    [argumentBlocks addObject:^(__unused RCTBridge * bridge, NSUInteger index, id json) { \
      _type value = convert([RCTConvert class], selector, json);                          \
      [invocation setArgument:&value atIndex:(index) + 2];                                \
      return YES;                                                                         \
    }];                                                                                   \
    break;                                                                                \
  }

#define PRIMITIVE_CASE(_type) __PRIMITIVE_CASE(_type, NO)
#define NULLABLE_PRIMITIVE_CASE(_type) __PRIMITIVE_CASE(_type, YES)

// Explicitly copy the block
#define __COPY_BLOCK(block...)         \
  id value = [block copy];             \
  if (value) {                         \
    [retainedObjects addObject:value]; \
  }

#if RCT_DEBUG
#define BLOCK_CASE(_block_args, _block)                                     \
  RCT_RETAINED_ARG_BLOCK(                                                   \
      if (json && ![json isKindOfClass:[NSNumber class]]) {                 \
        RCTLogArgumentError(weakSelf, index, json, "should be a function"); \
        return NO;                                                          \
      } __block BOOL didInvoke = NO;                                        \
      __COPY_BLOCK(^_block_args {                                           \
        if (checkCallbackMultipleInvocations(&didInvoke))                   \
          _block                                                            \
      });)
#else
#define BLOCK_CASE(_block_args, _block)             \
  RCT_RETAINED_ARG_BLOCK(__COPY_BLOCK(^_block_args{ \
      _block});)
#endif

  for (NSUInteger i = 2; i < numberOfArguments; i++) {
    const char *objcType = [methodSignature getArgumentTypeAtIndex:i];
    [[maybe_unused]] BOOL isNullableType = NO;
    RCTMethodArgument *argument = arguments[i - 2];
    NSString *typeName = argument.type;
    SEL selector = selectorForType(typeName);
    if ([RCTConvert respondsToSelector:selector]) {
      switch (objcType[0]) {
        // Primitives
        case _C_CHR:
          PRIMITIVE_CASE(char)
        case _C_UCHR:
          PRIMITIVE_CASE(unsigned char)
        case _C_SHT:
          PRIMITIVE_CASE(short)
        case _C_USHT:
          PRIMITIVE_CASE(unsigned short)
        case _C_INT:
          PRIMITIVE_CASE(int)
        case _C_UINT:
          PRIMITIVE_CASE(unsigned int)
        case _C_LNG:
          PRIMITIVE_CASE(long)
        case _C_ULNG:
          PRIMITIVE_CASE(unsigned long)
        case _C_LNG_LNG:
          PRIMITIVE_CASE(long long)
        case _C_ULNG_LNG:
          PRIMITIVE_CASE(unsigned long long)
        case _C_FLT:
          PRIMITIVE_CASE(float)
        case _C_DBL:
          PRIMITIVE_CASE(double)
        case _C_BOOL:
          PRIMITIVE_CASE(BOOL)
        case _C_SEL:
          NULLABLE_PRIMITIVE_CASE(SEL)
        case _C_CHARPTR:
          NULLABLE_PRIMITIVE_CASE(const char *)
        case _C_PTR:
          NULLABLE_PRIMITIVE_CASE(void *)

        case _C_ID: {
          isNullableType = YES;
          id (*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;
          RCT_RETAINED_ARG_BLOCK(id value = convert([RCTConvert class], selector, json););
          break;
        }

        case _C_STRUCT_B: {
          NSMethodSignature *typeSignature = [RCTConvert methodSignatureForSelector:selector];
          NSInvocation *typeInvocation = [NSInvocation invocationWithMethodSignature:typeSignature];
          typeInvocation.selector = selector;
          typeInvocation.target = [RCTConvert class];

          [argumentBlocks addObject:^(__unused RCTBridge *bridge, NSUInteger index, id json) {
            void *returnValue = malloc(typeSignature.methodReturnLength);
            if (!returnValue) {
              // CWE - 391 : Unchecked error condition
              // https://www.cvedetails.com/cwe-details/391/Unchecked-Error-Condition.html
              // https://eli.thegreenplace.net/2009/10/30/handling-out-of-memory-conditions-in-c
              abort();
            }
            [typeInvocation setArgument:&json atIndex:2];
            [typeInvocation invoke];
            [typeInvocation getReturnValue:returnValue];
            [invocation setArgument:returnValue atIndex:index + 2];
            free(returnValue);
            return YES;
          }];
          break;
        }

        default: {
          static const char *blockType = @encode(
              __typeof__(^{
              }));
          if (!strcmp(objcType, blockType)) {
            BLOCK_CASE((NSArray * args), { [bridge enqueueCallback:json args:args]; });
          } else {
            RCTLogError(@"Unsupported argument type '%@' in method %@.", typeName, [self methodName]);
          }
        }
      }
    } else if ([typeName isEqualToString:@"RCTResponseSenderBlock"]) {
      BLOCK_CASE((NSArray * args), { [bridge enqueueCallback:json args:args]; });
    } else if ([typeName isEqualToString:@"RCTResponseErrorBlock"]) {
      BLOCK_CASE((NSError * error), { [bridge enqueueCallback:json args:@[ RCTJSErrorFromNSError(error) ]]; });
    } else if ([typeName isEqualToString:@"RCTPromiseResolveBlock"]) {
      RCTAssert(
          i == numberOfArguments - 2,
          @"The RCTPromiseResolveBlock must be the second to last parameter in %@",
          [self methodName]);
      BLOCK_CASE((id result), { [bridge enqueueCallback:json args:result ? @[ result ] : @[]]; });
    } else if ([typeName isEqualToString:@"RCTPromiseRejectBlock"]) {
      RCTAssert(
          i == numberOfArguments - 1, @"The RCTPromiseRejectBlock must be the last parameter in %@", [self methodName]);
      BLOCK_CASE((NSString * code, NSString * message, NSError * error), {
        NSDictionary *errorJSON = RCTJSErrorFromCodeMessageAndNSError(code, message, error);
        [bridge enqueueCallback:json args:@[ errorJSON ]];
      });
    } else if ([typeName hasPrefix:@"JS::"]) {
      NSString *selectorNameForCxxType =
          [[typeName stringByReplacingOccurrencesOfString:@"::" withString:@"_"] stringByAppendingString:@":"];
      selector = NSSelectorFromString(selectorNameForCxxType);

      [argumentBlocks addObject:^(__unused RCTBridge *bridge, NSUInteger index, id json) {
        RCTManagedPointer *(*convert)(id, SEL, id) = (__typeof__(convert))objc_msgSend;
        RCTManagedPointer *box = convert([RCTCxxConvert class], selector, json);

        void *pointer = box.voidPointer;
        [invocation setArgument:&pointer atIndex:index + 2];
        [retainedObjects addObject:box];

        return YES;
      }];
    } else {
      // Unknown argument type
      RCTLogError(
          @"Unknown argument type '%@' in method %@. Extend RCTConvert to support this type.",
          typeName,
          [self methodName]);
    }

#if RCT_DEBUG
    RCTNullability nullability = argument.nullability;
    if (!isNullableType) {
      if (nullability == RCTNullable) {
        RCTLogArgumentError(
            weakSelf,
            i - 2,
            typeName,
            "is marked as "
            "nullable, but is not a nullable type.");
      }
      nullability = RCTNonnullable;
    }

    /**
     * Special case - Numbers are not nullable in Android, so we
     * don't support this for now. In future we may allow it.
     */
    if ([typeName isEqualToString:@"NSNumber"]) {
      BOOL unspecified = (nullability == RCTNullabilityUnspecified);
      if (!argument.unused && (nullability == RCTNullable || unspecified)) {
        RCTLogArgumentError(
            weakSelf,
            i - 2,
            typeName,
            [unspecified ? @"has unspecified nullability" : @"is marked as nullable"
                stringByAppendingString:@" but React requires that all NSNumber "
                                         "arguments are explicitly marked as `nonnull` to ensure "
                                         "compatibility with Android."]
                .UTF8String);
      }
      nullability = RCTNonnullable;
    }

    if (nullability == RCTNonnullable) {
      RCTArgumentBlock oldBlock = argumentBlocks[i - 2];
      argumentBlocks[i - 2] = ^(RCTBridge *bridge, NSUInteger index, id json) {
        if (json != nil) {
          if (!oldBlock(bridge, index, json)) {
            return NO;
          }
          if (isNullableType) {
            // Check converted value wasn't null either, as method probably
            // won't gracefully handle a nil value for a nonull argument
            void *value;
            [invocation getArgument:&value atIndex:index + 2];
            if (value == NULL) {
              return NO;
            }
          }
          return YES;
        }
        RCTLogArgumentError(weakSelf, index, typeName, "must not be null");
        return NO;
      };
    }
#endif
  }

#if RCT_DEBUG
  const char *objcType = _invocation.methodSignature.methodReturnType;
  if (_methodInfo->isSync && objcType[0] != _C_ID) {
    RCTLogError(
        @"Return type of %@.%s should be (id) as the method is \"sync\"",
        RCTBridgeModuleNameForClass(_moduleClass),
        self.JSMethodName);
  }
#endif

  _argumentBlocks = argumentBlocks;
}

- (SEL)selector
{
  if (_selector == NULL) {
    [self processMethodSignature];
  }

  return _selector;
}

- (const char *)JSMethodName
{
  NSString *methodName = _JSMethodName;
  if (!methodName) {
    const char *jsName = _methodInfo->jsName;
    if (jsName && strlen(jsName) > 0) {
      methodName = @(jsName);
    } else {
      methodName = @(_methodInfo->objcName);
      NSRange colonRange = [methodName rangeOfString:@":"];
      if (colonRange.location != NSNotFound) {
        methodName = [methodName substringToIndex:colonRange.location];
      }
      methodName = [methodName stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
      RCTAssert(
          methodName.length,
          @"%s is not a valid JS function name, please"
           " supply an alternative using RCT_REMAP_METHOD()",
          _methodInfo->objcName);
    }
    _JSMethodName = methodName;
  }
  return methodName.UTF8String;
}

- (RCTFunctionType)functionType
{
  if (strstr(_methodInfo->objcName, "RCTPromise") != NULL) {
    RCTAssert(!_methodInfo->isSync, @"Promises cannot be used in sync functions");
    return RCTFunctionTypePromise;
  } else if (_methodInfo->isSync) {
    return RCTFunctionTypeSync;
  } else {
    return RCTFunctionTypeNormal;
  }
}

- (id)invokeWithBridge:(RCTBridge *)bridge module:(id)module arguments:(NSArray *)arguments
{
  if (_argumentBlocks == nil) {
    [self processMethodSignature];
  }

#if RCT_DEBUG
  // Sanity check
  RCTAssert([module class] == _moduleClass, @"Attempted to invoke method \
            %@ on a module of class %@", [self methodName], [module class]);

  // Safety check
  if (arguments.count != _argumentBlocks.count) {
    NSInteger actualCount = arguments.count;
    NSInteger expectedCount = _argumentBlocks.count;

    // Subtract the implicit Promise resolver and rejecter functions for implementations of async functions
    if (self.functionType == RCTFunctionTypePromise) {
      actualCount -= 2;
      expectedCount -= 2;
    }

    RCTLogError(
        @"%@.%s was called with %lld arguments but expects %lld arguments. "
        @"If you haven\'t changed this method yourself, this usually means that "
        @"your versions of the native code and JavaScript code are out of sync. "
        @"Updating both should make this error go away.",
        RCTBridgeModuleNameForClass(_moduleClass),
        self.JSMethodName,
        (long long)actualCount,
        (long long)expectedCount);
    return nil;
  }
#endif

  // Set arguments
  NSUInteger index = 0;
  for (id json in arguments) {
    RCTArgumentBlock block = _argumentBlocks[index];
    if (!block(bridge, index, RCTNilIfNull(json))) {
      // Invalid argument, abort
      RCTLogArgumentError(self, index, json, "could not be processed. Aborting method call.");
      return nil;
    }
    index++;
  }

  // Invoke method
#ifdef RCT_MAIN_THREAD_WATCH_DOG_THRESHOLD
  if (RCTIsMainQueue()) {
    CFTimeInterval start = CACurrentMediaTime();
    [_invocation invokeWithTarget:module];
    CFTimeInterval duration = CACurrentMediaTime() - start;
    if (duration > RCT_MAIN_THREAD_WATCH_DOG_THRESHOLD) {
      RCTLogWarn(
          @"Main Thread Watchdog: Invocation of %@ blocked the main thread for %dms. "
           "Consider using background-threaded modules and asynchronous calls "
           "to spend less time on the main thread and keep the app's UI responsive.",
          [self methodName],
          (int)(duration * 1000));
    }
  } else {
    [_invocation invokeWithTarget:module];
  }
#else
  [_invocation invokeWithTarget:module];
#endif

  [_retainedObjects removeAllObjects];

  if (_methodInfo->isSync) {
    void *returnValue;
    [_invocation getReturnValue:&returnValue];
    return (__bridge id)returnValue;
  }
  return nil;
}

- (NSString *)methodName
{
  if (!_selector) {
    [self processMethodSignature];
  }
  return [NSString stringWithFormat:@"-[%@ %s]", _moduleClass, sel_getName(_selector)];
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; exports %@ as %s(); type: %s>",
                                    [self class],
                                    self,
                                    [self methodName],
                                    self.JSMethodName,
                                    RCTFunctionDescriptorFromType(self.functionType)];
}

@end
