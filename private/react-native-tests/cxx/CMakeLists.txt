# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# C++ unit-test harness for React Native's ReactCommon.
#
# ReactCommon's C++ test sources (`<subsystem>/tests/*.cpp`) ship to the OSS
# repo, but internally they build and run via Buck (`rn_xplat_cxx_test`), which
# is not exported. This harness builds a representative subset of those gtest
# suites on plain Linux with CMake so GitHub CI can run them as a merge gate. It
# reuses the desktop C++ toolchain already proven by the Fantom tester: the same
# ReactCommon libraries, the same Gradle-staged third-party dependencies, and
# the same generated codegen sources.

# 3.18 is the real floor for features used below: FetchContent_MakeAvailable
# (3.14) and find_library(... REQUIRED) (3.18).
cmake_minimum_required(VERSION 3.18)

set(CMAKE_VERBOSE_MAKEFILE on)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(UNIX AND NOT APPLE)
  set(CMAKE_POSITION_INDEPENDENT_CODE ON)
  set(CMAKE_C_LINK_FLAGS "${CMAKE_C_LINK_FLAGS} -latomic")
  set(CMAKE_CXX_LINK_FLAGS "${CMAKE_CXX_LINK_FLAGS} -latomic")
endif()

# Route compilation through ccache when present so the cache restored by the
# run-cxx-tests CI action is actually used. This must be set before project(),
# which is when CMake configures the compilers; merely exporting CC/CXX does not
# route through ccache.
find_program(CCACHE_PROGRAM ccache)
if(CCACHE_PROGRAM)
  set(CMAKE_C_COMPILER_LAUNCHER "${CCACHE_PROGRAM}")
  set(CMAKE_CXX_COMPILER_LAUNCHER "${CCACHE_PROGRAM}")
endif()

project(react_native_cxx_tests CXX C)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake/modules/")
include(Deps)

# ReactCommon subsystem CMakeLists call shared helpers (react_native_android_selector,
# target_compile_reactnative_options). Include the modules that define them once,
# up front, so the functions exist for every add_subdirectory() below regardless
# of the order subsystems are added.
include(${REACT_COMMON_DIR}/cmake-utils/internal/react-native-platform-selector.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

# Host-platform (cxx) header roots. In the Buck/Android build these sit on the
# global include path, so a subsystem's `platform/cxx` headers (e.g.
# HostPlatformViewProps.h) resolve even from other subsystems that include them
# transitively without linking the owner (e.g. componentregistry -> ViewProps.h).
# Expose them globally here to match that.
foreach(rn_platform_root
    react/renderer/graphics
    react/renderer/imagemanager
    react/renderer/textlayoutmanager
    react/renderer/components/view
    react/renderer/components/text
    react/renderer/components/scrollview
    react/renderer/components/modal)
  include_directories(${REACT_COMMON_DIR}/${rn_platform_root}/platform/cxx)
endforeach()

# ---------------------------------------------------------------------------
# GoogleTest — the one dependency the runtime build does not already provide.
# Fetched at configure time (CI has network; folly et al. are downloaded too).
# ---------------------------------------------------------------------------
include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/refs/tags/v1.15.2.tar.gz
  URL_HASH SHA256=7b42b4d6ed48810c5362c265a17faebe90dc2373c885e5216439d37927f02926)
FetchContent_MakeAvailable(googletest)

enable_testing()
include(GoogleTest)

# ---------------------------------------------------------------------------
# Third-party dependencies (staged by Gradle; see ../build.gradle.kts).
# ---------------------------------------------------------------------------
add_tester_third_party_subdir(boost)
add_react_third_party_ndk_subdir(glog)
add_react_third_party_ndk_subdir(double-conversion)
add_react_third_party_ndk_subdir(fast_float)
add_react_third_party_ndk_subdir(fmt)
add_staged_third_party_subdir(folly)
add_staged_third_party_subdir(gflags)

# Shim target several ReactCommon subsystems expect to link for glog setup; the
# real initialization is platform-specific and not needed for unit tests.
add_library(glog_init INTERFACE)

# Hermes VM + prefab headers (built by the Gradle prepareHermesDependencies task).
# Suites whose tests create a JS runtime via hermes::makeHermesRuntime link this.
# The shared libhermesvm.so must be on LD_LIBRARY_PATH at test-discovery/run time
# (set in the run-cxx-tests action).
include_directories(${REACT_ANDROID_DIR}/hermes-engine/build/prefab-headers)
find_library(LIB_HERMES hermesvm
  HINTS ${REACT_ANDROID_DIR}/hermes-engine/build/hermes/lib REQUIRED)
add_library(hermes-engine::hermesvm INTERFACE IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
  INTERFACE_LINK_LIBRARIES ${LIB_HERMES})

# Generated codegen sources (FBReactNativeSpec), staged by the Gradle
# prepareRNCodegen task. Defines react_codegen_rncore, which Fabric component
# libraries (e.g. rrc_modal) link against.
add_subdirectory(${RN_CODEGEN_DIR} codegen)

# ---------------------------------------------------------------------------
# ReactCommon libraries under test and their transitive dependencies.
#
# Excludes Hermes/JS-runtime subsystems: the in-scope suites construct shadow
# nodes / props directly and never instantiate a JS engine. (react/renderer/core's
# own tests DO need Hermes, so that suite is intentionally not built here.)
# ---------------------------------------------------------------------------
add_react_common_subdir(jsi)
add_react_common_subdir(logger)
add_react_common_subdir(oscompat)
add_react_common_subdir(callinvoker)
add_react_common_subdir(runtimeexecutor)
add_react_common_subdir(reactperflogger)
add_react_common_subdir(react/debug)
add_react_common_subdir(react/utils)
add_react_common_subdir(react/timing)
add_react_common_subdir(react/featureflags)
add_react_common_subdir(react/bridging)
add_react_common_subdir(react/nativemodule/core)
add_react_common_subdir(jserrorhandler)
add_react_common_subdir(jsinspector-modern)
add_react_common_subdir(jsinspector-modern/cdp)
add_react_common_subdir(jsinspector-modern/network)
add_react_common_subdir(jsinspector-modern/tracing)
add_react_common_subdir(react/performance/timeline)
add_react_common_subdir(react/renderer/debug)
add_react_common_subdir(react/renderer/consistency)
add_react_common_subdir(react/renderer/graphics)
add_react_common_subdir(react/renderer/css)
add_react_common_subdir(react/renderer/mapbuffer)
add_react_common_subdir(react/renderer/runtimescheduler)
add_react_common_subdir(react/renderer/core)
add_react_common_subdir(react/renderer/attributedstring)
add_react_common_subdir(react/renderer/textlayoutmanager)
add_react_common_subdir(react/renderer/componentregistry)
add_react_common_subdir(react/renderer/componentregistry/native)
add_react_common_subdir(react/renderer/element)
add_react_common_subdir(react/renderer/components/view)
add_react_common_subdir(react/renderer/components/root)
add_react_common_subdir(react/renderer/components/scrollview)
add_react_common_subdir(react/renderer/components/text)
add_react_common_subdir(react/renderer/components/modal)
add_react_common_subdir(react/renderer/telemetry)
add_react_common_subdir(react/renderer/mounting)
add_react_common_subdir(cxxreact)
add_react_common_subdir(react/renderer/bridging)
add_react_common_subdir(react/renderer/dom)
add_react_common_subdir(react/renderer/leakchecker)
add_react_common_subdir(react/renderer/imagemanager)
add_react_common_subdir(react/renderer/uimanager)
add_react_common_subdir(react/renderer/uimanager/consistency)
add_react_common_subdir(react/renderer/components/image)
add_react_common_subdir(react/renderer/components/legacyviewmanagerinterop)
add_react_common_subdir(react/renderer/animations)
add_react_common_subdir(react/performance/cdpmetrics)
add_react_common_subdir(react/renderer/observers/events)
add_react_common_subdir(react/renderer/viewtransition)
add_react_common_subdir(react/renderer/animationbackend)
add_react_common_subdir(react/renderer/scheduler)
add_react_common_subdir(react/renderer/animated)
# react/runtime (bridgeless ReactInstance) + its JSI executor/tooling deps
# (jsitooling, jsiexecutor=jsireact). Their transitive deps are all already built
# above (react_cxxreact, jserrorhandler, jsi, reactperflogger, folly, glog).
add_react_common_subdir(jsitooling)
add_react_common_subdir(jsiexecutor)
add_react_common_subdir(react/runtime)
add_react_common_subdir(yoga)
# Several subsystems link the target name `yoga`; the subdir defines `yogacore`.
add_library(yoga ALIAS yogacore)

# ---------------------------------------------------------------------------
# Test suites. Each entry compiles a subsystem's `tests/*.cpp` into its own
# gtest binary and registers it with CTest.
#
# ReactCommon libraries are OBJECT libraries, whose objects are not always
# pulled transitively, so callers must pass the full closure of libraries
# explicitly (subsystem lib + its ReactCommon deps + third-party), mirroring how
# the Fantom tester links.
# ---------------------------------------------------------------------------
function(react_native_add_cxx_test_suite suite_name subsystem_path)
  file(GLOB suite_SRC CONFIGURE_DEPENDS
    ${REACT_COMMON_DIR}/${subsystem_path}/tests/*.cpp
    ${REACT_COMMON_DIR}/${subsystem_path}/tests/cxx/*.cpp)
  add_executable(${suite_name} ${suite_SRC})
  target_include_directories(${suite_name} PRIVATE ${REACT_COMMON_DIR})
  target_link_libraries(${suite_name}
    PRIVATE
      ${ARGN}
      gtest
      gmock
      gtest_main
      # Linked last so its warning overrides come after the subsystem libraries'
      # interface flags (-Wall -Werror -Wpedantic) and win the ordering.
      rn_test_overrides)
  target_compile_options(${suite_name} PRIVATE -fexceptions -frtti)
  gtest_discover_tests(${suite_name})
endfunction()

# Warning overrides for test code. Test sources are held to -Werror in the
# internal Buck build, but for OSS CI we only care about pass/fail. An INTERFACE
# library (linked last by the helper) so these come after the subsystem
# libraries' interface -Werror/-Wpedantic and win the flag ordering.
add_library(rn_test_overrides INTERFACE)
target_compile_options(rn_test_overrides INTERFACE -Wno-error -Wno-embedded-directive)

# Third-party libraries every suite links.
set(RN_TEST_THIRD_PARTY
  folly_runtime
  glog
  glog_init
  double-conversion
  fmt
  boost)

# --- Small, self-contained suites (minimal closures) ---
react_native_add_cxx_test_suite(
  react_renderer_graphics_tests
  react/renderer/graphics
  react_renderer_graphics
  react_renderer_debug
  react_utils
  react_debug
  jsi
  ${RN_TEST_THIRD_PARTY})

react_native_add_cxx_test_suite(
  react_utils_tests
  react/utils
  react_utils
  react_debug
  jsi
  ${RN_TEST_THIRD_PARTY})

react_native_add_cxx_test_suite(
  react_renderer_css_tests
  react/renderer/css
  react_renderer_css
  react_utils
  react_debug
  jsi
  fast_float
  ${RN_TEST_THIRD_PARTY})

react_native_add_cxx_test_suite(
  react_renderer_mapbuffer_tests
  react/renderer/mapbuffer
  react_renderer_mapbuffer
  react_debug
  ${RN_TEST_THIRD_PARTY})

# --- Fabric renderer suites (full renderer + component + codegen closure) ---
set(RN_RENDERER_LIBS
  jsi
  logger
  oscompat
  callinvoker
  runtimeexecutor
  reactperflogger
  react_debug
  react_utils
  react_timing
  react_featureflags
  react_bridging
  react_nativemodule_core
  jserrorhandler
  jsinspector
  jsinspector_cdp
  jsinspector_network
  jsinspector_tracing
  react_performance_timeline
  react_renderer_debug
  react_renderer_consistency
  react_renderer_graphics
  react_renderer_css
  react_renderer_mapbuffer
  react_renderer_runtimescheduler
  react_renderer_core
  react_renderer_attributedstring
  react_renderer_textlayoutmanager
  react_renderer_componentregistry
  rrc_native
  react_renderer_element
  rrc_view
  rrc_root
  rrc_scrollview
  rrc_text
  rrc_modal
  react_renderer_telemetry
  react_renderer_mounting
  react_cxxreact
  react_renderer_bridging
  react_renderer_dom
  react_renderer_leakchecker
  react_renderer_imagemanager
  react_renderer_uimanager
  react_renderer_uimanager_consistency
  rrc_image
  rrc_legacyviewmanagerinterop
  react_renderer_animations
  react_codegen_rncore
  yogacore
  fast_float
  ${RN_TEST_THIRD_PARTY})

react_native_add_cxx_test_suite(
  react_renderer_components_view_tests
  react/renderer/components/view
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_mounting_tests
  react/renderer/mounting
  ${RN_RENDERER_LIBS})

# More suites whose libraries are already built above and whose tests are
# Hermes-free. (Suites whose tests instantiate a JS engine — core, uimanager,
# runtimescheduler, scheduler, jsinspector-modern integration — are deferred.)
react_native_add_cxx_test_suite(
  react_renderer_attributedstring_tests
  react/renderer/attributedstring
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_telemetry_tests
  react/renderer/telemetry
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_performance_timeline_tests
  react/performance/timeline
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_textlayoutmanager_tests
  react/renderer/textlayoutmanager
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_components_text_tests
  react/renderer/components/text
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_components_scrollview_tests
  react/renderer/components/scrollview
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_components_image_tests
  react/renderer/components/image
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_components_root_tests
  react/renderer/components/root
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_uimanager_tests
  react/renderer/uimanager
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_uimanager_consistency_tests
  react/renderer/uimanager/consistency
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_element_tests
  react/renderer/element
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_debug_tests
  react/renderer/debug
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_imagemanager_tests
  react/renderer/imagemanager
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_animations_tests
  react/renderer/animations
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_featureflags_tests
  react/featureflags
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_timing_tests
  react/timing
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  jserrorhandler_tests
  jserrorhandler
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  react_debug_redbox_tests
  react/debug/redbox
  ${RN_RENDERER_LIBS})

react_native_add_cxx_test_suite(
  reactperflogger_fusebox_tests
  reactperflogger/fusebox
  ${RN_RENDERER_LIBS})

# --- Suites whose tests create a JS runtime (Hermes) ---
set(RN_HERMES_LIBS ${RN_RENDERER_LIBS} hermes-engine::hermesvm)

react_native_add_cxx_test_suite(
  react_renderer_core_tests
  react/renderer/core
  ${RN_HERMES_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_runtimescheduler_tests
  react/renderer/runtimescheduler
  ${RN_HERMES_LIBS})

# Scheduler + animation closure (adds cdpmetrics/viewtransition/animationbackend/
# observers-events on top of the Hermes closure).
set(RN_SCHEDULER_LIBS
  ${RN_HERMES_LIBS}
  react_renderer_scheduler
  react_renderer_animationbackend
  react_performance_cdpmetrics
  react_renderer_viewtransition
  react_renderer_observers_events
  react_renderer_animated)

react_native_add_cxx_test_suite(
  react_renderer_scheduler_tests
  react/renderer/scheduler
  ${RN_SCHEDULER_LIBS})

react_native_add_cxx_test_suite(
  react_renderer_animated_tests
  react/renderer/animated
  ${RN_SCHEDULER_LIBS})

react_native_add_cxx_test_suite(
  react_cxxreact_tests
  cxxreact
  ${RN_RENDERER_LIBS})

# react/runtime (bridgeless ReactInstance). Tests live in tests/cxx/ and spin up
# a Hermes runtime; the timer-registry / message-queue-thread mocks are inline.
react_native_add_cxx_test_suite(
  react_runtime_tests
  react/runtime
  bridgeless
  jsitooling
  jsireact
  ${RN_HERMES_LIBS})
