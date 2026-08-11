/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RNCXX_WITH_PROFILING_PROVIDER
#define RNCXX_WITH_PROFILING_PROVIDER 0
#endif

#if RNCXX_WITH_PROFILING_PROVIDER
#include <hz_tracing/TracingMacros.h>

#ifndef TRACE_FUNCTION
#if defined(__GNUC__) || defined(__clang__)
#define TRACE_FUNCTION __PRETTY_FUNCTION__
#else
#define TRACE_FUNCTION __FUNCTION__
#endif
#endif // TRACE_FUNCTION

static inline constexpr char kTraceCategory[] = "react_native";

HZT_DEFINE_TRACING_CATEGORIES(
    facebook::react,
    horizon::tracing::Category(
        kTraceCategory,
        "react_native",
        horizon::tracing::StrippingLevel::Important));

#define SCOPED_TRACE_CPU_AUTO() \
  HZT_TRACE_SCOPE_NS(::facebook::react, kTraceCategory, TRACE_FUNCTION);

#define SCOPED_TRACE_CPU(name) \
  HZT_TRACE_SCOPE_NS(::facebook::react, kTraceCategory, name);

#else
#ifndef SCOPED_TRACE_CPU_AUTO
#define SCOPED_TRACE_CPU_AUTO() ((void)0)
#endif
#ifndef SCOPED_TRACE_CPU
#define SCOPED_TRACE_CPU(name) ((void)0)
#endif
#endif
