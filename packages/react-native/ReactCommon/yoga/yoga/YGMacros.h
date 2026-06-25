/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus
#include <type_traits>
#endif

#ifdef __cplusplus
#define YG_EXTERN_C_BEGIN extern "C" {
#define YG_EXTERN_C_END }
#else
#define YG_EXTERN_C_BEGIN
#define YG_EXTERN_C_END
#endif

#if defined(__cplusplus)
#define YG_DEPRECATED(message) [[deprecated(message)]]
#elif defined(_MSC_VER)
#define YG_DEPRECATED(message) __declspec(deprecated(message))
#else
#define YG_DEPRECATED(message) __attribute__((deprecated(message)))
#endif

#ifdef _WINDLL
#define YG_EXPORT __declspec(dllexport)
#elif defined(__EMSCRIPTEN__)
#define YG_EXPORT __attribute__((visibility("default"), used))
#elif !defined(_MSC_VER)
#define YG_EXPORT __attribute__((visibility("default")))
#else
#define YG_EXPORT
#endif

#ifdef __OBJC__
#if __has_include(<Foundation/Foundation.h>)
#import <Foundation/Foundation.h>
#endif
#endif

#ifdef NS_ENUM
// Cannot use NSInteger as NSInteger has a different size than int (which is the
// default type of a enum). Therefor when linking the Yoga C library into obj-c
// the header is a mismatch for the Yoga ABI.
#define YG_ENUM_BEGIN(name) NS_ENUM(int, name)
#define YG_ENUM_END(name)
#else
#define YG_ENUM_BEGIN(name) enum name
#define YG_ENUM_END(name) name
#endif

#ifdef __cplusplus
#define YG_DEFINE_ENUM_FLAG_OPERATORS(name)                       \
  extern "C++" {                                                  \
  constexpr name operator~(name a) {                              \
    return static_cast<name>(                                     \
        ~static_cast<std::underlying_type<name>::type>(a));       \
  }                                                               \
  constexpr name operator|(name a, name b) {                      \
    return static_cast<name>(                                     \
        static_cast<std::underlying_type<name>::type>(a) |        \
        static_cast<std::underlying_type<name>::type>(b));        \
  }                                                               \
  constexpr name operator&(name a, name b) {                      \
    return static_cast<name>(                                     \
        static_cast<std::underlying_type<name>::type>(a) &        \
        static_cast<std::underlying_type<name>::type>(b));        \
  }                                                               \
  constexpr name operator^(name a, name b) {                      \
    return static_cast<name>(                                     \
        static_cast<std::underlying_type<name>::type>(a) ^        \
        static_cast<std::underlying_type<name>::type>(b));        \
  }                                                               \
  inline name& operator|=(name& a, name b) {                      \
    return reinterpret_cast<name&>(                               \
        reinterpret_cast<std::underlying_type<name>::type&>(a) |= \
        static_cast<std::underlying_type<name>::type>(b));        \
  }                                                               \
  inline name& operator&=(name& a, name b) {                      \
    return reinterpret_cast<name&>(                               \
        reinterpret_cast<std::underlying_type<name>::type&>(a) &= \
        static_cast<std::underlying_type<name>::type>(b));        \
  }                                                               \
  inline name& operator^=(name& a, name b) {                      \
    return reinterpret_cast<name&>(                               \
        reinterpret_cast<std::underlying_type<name>::type&>(a) ^= \
        static_cast<std::underlying_type<name>::type>(b));        \
  }                                                               \
  }
#else
#define YG_DEFINE_ENUM_FLAG_OPERATORS(name)
#endif

#define YG_ENUM_DECL(NAME, ...)                               \
  typedef YG_ENUM_BEGIN(NAME){__VA_ARGS__} YG_ENUM_END(NAME); \
  YG_EXPORT const char* NAME##ToString(NAME);
