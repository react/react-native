/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTAssert.h>
#import <React/RCTDefines.h>

/**
 * RCTProfile
 *
 * This file provides a set of functions and macros for performance profiling
 *
 * NOTE: This API is a work in progress, please consider carefully before
 * using it.
 */

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated"

RCT_EXTERN __deprecated_msg("This API will be removed along with the legacy architecture.") NSString *const
    RCTProfileDidStartProfiling;
RCT_EXTERN __deprecated_msg("This API will be removed along with the legacy architecture.") NSString *const
    RCTProfileDidEndProfiling;

RCT_EXTERN __deprecated_msg("This API will be removed along with the legacy architecture.") const uint64_t
    RCTProfileTagAlways;

#if RCT_PROFILE

@class RCTBridge;

#define RCTProfileBeginFlowEvent()                                                                                     \
  _Pragma("clang diagnostic push") _Pragma("clang diagnostic ignored \"-Wshadow\"") NSUInteger __rct_profile_flow_id = \
      _RCTProfileBeginFlowEvent();                                                                                     \
  _Pragma("clang diagnostic pop")

#define RCTProfileEndFlowEvent() _RCTProfileEndFlowEvent(__rct_profile_flow_id)

RCT_EXTERN dispatch_queue_t RCTProfileGetQueue(void)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

RCT_EXTERN NSUInteger _RCTProfileBeginFlowEvent(void)
    __deprecated_msg("This API will be removed along with the legacy architecture.");
RCT_EXTERN void _RCTProfileEndFlowEvent(NSUInteger /*cookie*/)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Returns YES if the profiling information is currently being collected
 */
RCT_EXTERN BOOL RCTProfileIsProfiling(void)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Start collecting profiling information
 */
RCT_EXTERN void RCTProfileInit(RCTBridge * /*bridge*/)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Stop profiling and return a JSON string of the collected data - The data
 * returned is compliant with google's trace event format - the format used
 * as input to trace-viewer
 */
RCT_EXTERN void RCTProfileEnd(RCTBridge * /*bridge*/, void (^/*callback*/)(NSString *))
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Route the RCT_PROFILE_BEGIN_EVENT hooks to our loom tracing.
 */
#ifdef WITH_LOOM_TRACE
RCT_EXTERN BOOL _RCTLoomIsProfiling(void);
RCT_EXTERN void
_RCTLoomBeginEvent(NSString *name, const char *file, size_t line, NSDictionary<NSString *, NSString *> *args);
RCT_EXTERN void _RCTLoomEndEvent();
#else
#define _RCTLoomIsProfiling(...) NO
#define _RCTLoomBeginEvent(...)
#define _RCTLoomEndEvent(...)
#endif

/**
 * Collects the initial event information for the event and returns a reference ID
 */
RCT_EXTERN void _RCTProfileBeginEvent(
    NSThread *calleeThread,
    NSTimeInterval time,
    uint64_t tag,
    NSString *name,
    NSDictionary<NSString *, NSString *> *args)
    __deprecated_msg("This API will be removed along with the legacy architecture.");
#define RCT_PROFILE_BEGIN_EVENT(tag, name, args)                      \
  do {                                                                \
    if (_RCTLoomIsProfiling()) {                                      \
      _RCTLoomBeginEvent(name, __FILE__, __LINE__, args);             \
    }                                                                 \
    if (RCTProfileIsProfiling()) {                                    \
      NSThread *__calleeThread = [NSThread currentThread];            \
      NSTimeInterval __time = CACurrentMediaTime();                   \
      _RCTProfileBeginEvent(__calleeThread, __time, tag, name, args); \
    }                                                                 \
  } while (0)

/**
 * The ID returned by BeginEvent should then be passed into EndEvent, with the
 * rest of the event information. Just at this point the event will actually be
 * registered
 */
RCT_EXTERN void
_RCTProfileEndEvent(NSThread *calleeThread, NSString *threadName, NSTimeInterval time, uint64_t tag, NSString *category)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

#define RCT_PROFILE_END_EVENT(tag, category)                                    \
  do {                                                                          \
    if (_RCTLoomIsProfiling()) {                                                \
      _RCTLoomEndEvent();                                                       \
    }                                                                           \
    if (RCTProfileIsProfiling()) {                                              \
      NSThread *__calleeThread = [NSThread currentThread];                      \
      NSString *__threadName = RCTCurrentThreadName();                          \
      NSTimeInterval __time = CACurrentMediaTime();                             \
      _RCTProfileEndEvent(__calleeThread, __threadName, __time, tag, category); \
    }                                                                           \
  } while (0)

/**
 * Collects the initial event information for the event and returns a reference ID
 */
RCT_EXTERN NSUInteger
RCTProfileBeginAsyncEvent(uint64_t tag, NSString *name, NSDictionary<NSString *, NSString *> *args)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * The ID returned by BeginEvent should then be passed into EndEvent, with the
 * rest of the event information. Just at this point the event will actually be
 * registered
 */
RCT_EXTERN void
RCTProfileEndAsyncEvent(uint64_t tag, NSString *category, NSUInteger cookie, NSString *name, NSString *threadName)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * An event that doesn't have a duration (i.e. Notification, VSync, etc)
 */
RCT_EXTERN void RCTProfileImmediateEvent(uint64_t tag, NSString *name, NSTimeInterval time, char scope)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Helper to profile the duration of the execution of a block. This method uses
 * self and _cmd to name this event for simplicity sake.
 *
 * NOTE: The block can't expect any argument
 *
 * DEPRECATED: this approach breaks debugging and stepping through instrumented block functions
 */
#define RCTProfileBlock(block, tag, category, arguments)       \
  ^{                                                           \
    RCT_PROFILE_BEGIN_EVENT(tag, @(__PRETTY_FUNCTION__), nil); \
    block();                                                   \
    RCT_PROFILE_END_EVENT(tag, category, arguments);           \
  }

/**
 * Hook into a bridge instance to log all bridge module's method calls
 */
RCT_EXTERN void RCTProfileHookModules(RCTBridge * /*bridge*/)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Unhook from a given bridge instance's modules
 */
RCT_EXTERN void RCTProfileUnhookModules(RCTBridge * /*bridge*/)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Hook into all of a module's methods
 */
RCT_EXTERN void RCTProfileHookInstance(id instance)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Send systrace or cpu profiling information to the packager
 * to present to the user
 */
RCT_EXTERN void RCTProfileSendResult(RCTBridge *bridge, NSString *route, NSData *profileData)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Systrace gluecode
 *
 * allow to use systrace to back RCTProfile
 */

typedef struct {
  const char *key;
  unsigned long key_len;
  const char *value;
  unsigned long value_len;
} systrace_arg_t __deprecated_msg("This API will be removed along with the legacy architecture.");

typedef struct {
  char *(*start)(void);
  void (*stop)(void);

  void (*begin_section)(uint64_t tag, const char *name, size_t numArgs, systrace_arg_t *args);
  void (*end_section)(uint64_t tag, size_t numArgs, systrace_arg_t *args);

  void (*begin_async_section)(uint64_t tag, const char *name, int cookie, size_t numArgs, systrace_arg_t *args);
  void (*end_async_section)(uint64_t tag, const char *name, int cookie, size_t numArgs, systrace_arg_t *args);

  void (*instant_section)(uint64_t tag, const char *name, char scope);

  void (*begin_async_flow)(uint64_t tag, const char *name, int cookie);
  void (*end_async_flow)(uint64_t tag, const char *name, int cookie);
} RCTProfileCallbacks __deprecated_msg("This API will be removed along with the legacy architecture.");

RCT_EXTERN void RCTProfileRegisterCallbacks(RCTProfileCallbacks * /*cb*/)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

/**
 * Systrace control window
 */
RCT_EXTERN void RCTProfileShowControls(void)
    __deprecated_msg("This API will be removed along with the legacy architecture.");
RCT_EXTERN void RCTProfileHideControls(void)
    __deprecated_msg("This API will be removed along with the legacy architecture.");

#else

#define RCTProfileBeginFlowEvent()
#define _RCTProfileBeginFlowEvent() @0

#define RCTProfileEndFlowEvent()
#define _RCTProfileEndFlowEvent(...)

#define RCTProfileIsProfiling(...) NO
#define RCTProfileInit(...)
#define RCTProfileEnd(...) @""

#define _RCTProfileBeginEvent(...)
#define _RCTProfileEndEvent(...)

#define RCT_PROFILE_BEGIN_EVENT(...)
#define RCT_PROFILE_END_EVENT(...)

#define RCTProfileBeginAsyncEvent(...) 0
#define RCTProfileEndAsyncEvent(...)

#define RCTProfileImmediateEvent(...)

#define RCTProfileBlock(block, ...) block

#define RCTProfileHookModules(...)
#define RCTProfileHookInstance(...)
#define RCTProfileUnhookModules(...)

#define RCTProfileSendResult(...)

#define RCTProfileShowControls(...)
#define RCTProfileHideControls(...)

#endif

#pragma clang diagnostic pop
