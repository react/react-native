/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
#endif

#ifdef WITH_PERFETTO

// clang-format off
// Windows.h macro fail, 'interface' clashes with a function in perfetto.h
#ifdef interface
#pragma push_macro("interface")
#undef interface
#define __RCT_INTERFACE_PUSHED
#endif

#include <perfetto.h>

#ifdef __RCT_INTERFACE_PUSHED
#undef __RCT_INTERFACE_PUSHED
#pragma pop_macro("interface")
#endif
// clang-format on

#include <reactperflogger/ReactPerfettoCategories.h>
#endif

#if defined(__APPLE__)
// This is required so that OS_LOG_TARGET_HAS_10_15_FEATURES will be set.
#include <os/trace_base.h>

#if OS_LOG_TARGET_HAS_10_15_FEATURES && !defined(WITH_LOOM_TRACE)
#include <os/log.h>
#include <os/signpost.h>
#include <sstream>
#endif

#endif

namespace facebook::react {

/**
 * Allow providing an fbsystrace implementation that can short-circuit out
 * quickly and can throttle too frequent events so we can get useful traces even
 * if rendering etc. is spinning. For throttling we'll need file/line info so we
 * use a macro.
 */
#if defined(WITH_LOOM_TRACE)
#define TraceSectionUnwrapped                                   \
  static constexpr const char systraceSectionFile[] = __FILE__; \
  fbsystrace::FbSystraceSection<systraceSectionFile, __LINE__>
/**
 * This is a convenience class to avoid lots of verbose profiling
 * #ifdefs.  If WITH_FBSYSTRACE is not defined, the optimizer will
 * remove this completely.  If it is defined, it will behave as
 * FbSystraceSection, with the right tag provided. Use two separate classes to
 * to ensure that the ODR rule isn't violated, that is, if WITH_FBSYSTRACE has
 * different values in different files, there is no inconsistency in the sizes
 * of defined symbols.
 */
#elif defined(WITH_PERFETTO)
struct TraceSection {
 public:
  template <typename... ConvertsToStringPiece>
  explicit TraceSection([[maybe_unused]] const char *name, [[maybe_unused]] ConvertsToStringPiece &&...args)
  {
    TRACE_EVENT_BEGIN("react-native", perfetto::DynamicString{name}, args...);
  }

  ~TraceSection()
  {
    TRACE_EVENT_END("react-native");
  }
};
using TraceSectionUnwrapped = TraceSection;
#elif defined(WITH_FBSYSTRACE)
struct ConcreteTraceSection {
 public:
  template <typename... ConvertsToStringPiece>
  explicit ConcreteTraceSection(const char *name, ConvertsToStringPiece &&...args)
      : m_section(TRACE_TAG_REACT, name, args...)
  {
  }

 private:
  fbsystrace::FbSystraceSection m_section;
};
using TraceSectionUnwrapped = ConcreteTraceSection;
#else
struct DummyTraceSection {
 public:
  template <typename... ConvertsToStringPiece>
  explicit DummyTraceSection([[maybe_unused]] const char *name, [[maybe_unused]] ConvertsToStringPiece &&...args)
  {
  }
};
using TraceSectionUnwrapped = DummyTraceSection;
#endif

/**
 * On recent Apple platforms we want to leverage the Instruments signposts APIs.
 * To not break the other TraceSection implementations above we wrap them.
 * In the case of WITH_LOOM_TRACE we don't use the signposts APIs because of the
 * templated type for TraceSection.
 */
#if defined(__APPLE__) && OS_LOG_TARGET_HAS_10_15_FEATURES && !defined(WITH_LOOM_TRACE) && !defined(WITH_PERFETTO)

namespace systrace {

template <typename T, typename = void>
struct renderer {
  static std::string render(const T &t)
  {
    std::ostringstream oss;
    oss << t;
    return oss.str();
  }
};

template <typename T>
static auto render(const T &t) -> decltype(renderer<T>::render(std::declval<const T &>()))
{
  return renderer<T>::render(t);
}

inline os_log_t instrumentsLogHandle = nullptr;

static inline os_log_t getOrCreateInstrumentsLogHandle()
{
  static std::once_flag flag{};
  std::call_once(flag, []() {
    if (!instrumentsLogHandle) {
      instrumentsLogHandle = os_log_create("dev.reactnative.instruments", OS_LOG_CATEGORY_DYNAMIC_TRACING);
    }
  });
  return instrumentsLogHandle;
}

} // namespace systrace

struct TraceSection {
 public:
  template <typename... ConvertsToStringPiece>
  explicit TraceSection(const char *name, ConvertsToStringPiece &&...args) : systraceSectionUnwrapped_(name, args...)
  {
    os_log_t instrumentsLogHandle = systrace::getOrCreateInstrumentsLogHandle();

    // If the log isn't enabled, we don't want the performance overhead of the
    // rest of the code below.
    if (!os_signpost_enabled(instrumentsLogHandle)) {
      return;
    }

    name_ = name;

    const auto argsVector = std::vector<std::string>{systrace::render(args)...};
    std::string argsString = "";
    for (size_t i = 0; i < argsVector.size(); i += 2) {
      argsString += argsVector[i] + "=" + argsVector[i + 1] + ";";
    }

    signpostID_ = os_signpost_id_make_with_pointer(instrumentsLogHandle, this);

    os_signpost_interval_begin(instrumentsLogHandle, signpostID_, "Systrace", "%s begin: %s", name, argsString.c_str());
  }

  ~TraceSection()
  {
    // We don't need to gate on os_signpost_enabled here because it's already
    // checked in os_signpost_interval_end.
    os_signpost_interval_end(systrace::instrumentsLogHandle, signpostID_, "Systrace", "%s end", name_.data());
  }

 private:
  os_signpost_id_t signpostID_ = OS_SIGNPOST_ID_INVALID;
  std::string_view name_;
  TraceSectionUnwrapped systraceSectionUnwrapped_;
};
#else
#define TraceSection TraceSectionUnwrapped
#endif

} // namespace facebook::react
