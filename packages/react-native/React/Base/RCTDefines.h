/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if __OBJC__
#import <Foundation/Foundation.h>
#endif

/**
 * Make global functions usable in C++
 */
#if defined(__cplusplus)
#define RCT_EXTERN extern "C" __attribute__((visibility("default")))
#define RCT_EXTERN_C_BEGIN extern "C" {
#define RCT_EXTERN_C_END }
#else
#define RCT_EXTERN extern __attribute__((visibility("default")))
#define RCT_EXTERN_C_BEGIN
#define RCT_EXTERN_C_END
#endif

/**
 * The RCT_DEBUG macro can be used to exclude error checking and logging code
 * from release builds to improve performance and reduce binary size.
 */
#ifndef RCT_DEBUG
#ifdef DEBUG
#define RCT_DEBUG 1
#else
#define RCT_DEBUG 0
#endif
#endif

/**
 * The RCT_DEV macro can be used to enable or disable development tools
 * such as the debug executors, dev menu, red box, etc.
 */
#ifndef RCT_DEV
#ifdef DEBUG
#define RCT_DEV 1
#else
#define RCT_DEV 0
#endif
#endif

/**
 * RCT_REMOTE_PROFILE: RCT_PROFILE + RCT_ENABLE_INSPECTOR + enable the
 * connectivity functionality to control the profiler remotely, such as via Chrome DevTools.
 * If Fusebox is enabled for release builds, enable the remote profile mode, fall back to RCT_DEV by default.
 */
#ifndef RCT_REMOTE_PROFILE
#ifdef REACT_NATIVE_DEBUGGER_MODE_PROD
#define RCT_REMOTE_PROFILE REACT_NATIVE_DEBUGGER_MODE_PROD
#else
#define RCT_REMOTE_PROFILE RCT_DEV
#endif
#endif

/**
 * Enable the code to support making calls to the underlying sampling profiler mechanism.
 */
#ifndef RCT_PROFILE
#define RCT_PROFILE RCT_REMOTE_PROFILE
#endif

#ifndef RCT_ENABLE_INSPECTOR
#if (RCT_DEV || RCT_REMOTE_PROFILE)
#define RCT_ENABLE_INSPECTOR 1
#else
#define RCT_ENABLE_INSPECTOR 0
#endif
#endif

/**
 * Sanity check that these compile-time flags are compatible. RCT_REMOTE_PROFILE requires RCT_PROFILE and
 * RCT_ENABLE_INSPECTOR
 */
#if RCT_REMOTE_PROFILE
#if !RCT_PROFILE
#error "RCT_PROFILE needs to be set to fulfill RCT_REMOTE_PROFILE"
#endif // RCT_PROFILE
#if !RCT_ENABLE_INSPECTOR
#error "RCT_ENABLE_INSPECTOR needs to be set to fulfill RCT_REMOTE_PROFILE"
#endif // RCT_ENABLE_INSPECTOR
#endif // RCT_REMOTE_PROFILE

/**
 * RCT_DEV_MENU can be used to toggle the dev menu separately from RCT_DEV.
 * By default though, it will inherit from RCT_DEV.
 */
#ifndef RCT_DEV_MENU
#define RCT_DEV_MENU RCT_DEV
#endif

#if RCT_DEV
#define RCT_IF_DEV(...) __VA_ARGS__
#else
#define RCT_IF_DEV(...)
#endif

#ifndef RCT_PROFILE
#define RCT_PROFILE RCT_DEV
#endif

/**
 * Add the default Metro packager port number
 */
#ifndef RCT_METRO_PORT
#define RCT_METRO_PORT 8081
#else
// test if RCT_METRO_PORT is empty
#define RCT_METRO_PORT_DO_EXPAND(VAL) VAL##1
#define RCT_METRO_PORT_EXPAND(VAL) RCT_METRO_PORT_DO_EXPAND(VAL)
#if !defined(RCT_METRO_PORT) || (RCT_METRO_PORT_EXPAND(RCT_METRO_PORT) == 1)
// Only here if RCT_METRO_PORT is not defined
// OR RCT_METRO_PORT is the empty string
#undef RCT_METRO_PORT
#define RCT_METRO_PORT 8081
#endif
#endif

/**
 * Add the default packager name
 */
#ifndef RCT_PACKAGER_NAME
#define RCT_PACKAGER_NAME @"Metro"
#endif

/**
 * By default, only raise an NSAssertion in debug mode
 * (custom assert functions will still be called).
 */
#ifndef RCT_NSASSERT
#define RCT_NSASSERT RCT_DEBUG
#endif

/**
 * Concat two literals. Supports macro expansions,
 * e.g. RCT_CONCAT(foo, __FILE__).
 */
#define RCT_CONCAT2(A, B) A##B
#define RCT_CONCAT(A, B) RCT_CONCAT2(A, B)

/**
 * This attribute is used for static analysis.
 */
#if !defined RCT_DYNAMIC
#if __has_attribute(objc_dynamic)
#define RCT_DYNAMIC __attribute__((objc_dynamic))
#else
#define RCT_DYNAMIC
#endif
#endif

/**
 * Throw an assertion for unimplemented methods.
 */
#define RCT_NOT_IMPLEMENTED(method)                                                                     \
  _Pragma("clang diagnostic push") _Pragma("clang diagnostic ignored \"-Wmissing-method-return-type\"") \
      _Pragma("clang diagnostic ignored \"-Wunused-parameter\"")                                        \
          RCT_EXTERN NSException *_RCTNotImplementedException(SEL, Class);                              \
  method NS_UNAVAILABLE                                                                                 \
  {                                                                                                     \
    @throw _RCTNotImplementedException(_cmd, [self class]);                                             \
  }                                                                                                     \
  _Pragma("clang diagnostic pop")
