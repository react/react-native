# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)
if(UNIX AND NOT APPLE)
  set(CMAKE_POSITION_INDEPENDENT_CODE ON)
  set(CMAKE_C_LINK_FLAGS "${CMAKE_C_LINK_FLAGS} -latomic")
  set(CMAKE_CXX_LINK_FLAGS "${CMAKE_CXX_LINK_FLAGS} -latomic")
endif()

project(fantom_tester)

include_directories(${REACT_ANDROID_DIR}/hermes-engine/build/prefab-headers)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake/modules/")
include(Deps)

find_library(LIB_HERMES hermesvm
  HINTS ${REACT_ANDROID_DIR}/hermes-engine/build/hermes/lib
  REQUIRED)
add_library(hermes-engine::hermesvm INTERFACE IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
  INTERFACE_LINK_LIBRARIES ${LIB_HERMES})
find_package(OpenSSL REQUIRED)

# Boost in NDK is not compatible with desktop build
add_third_party_subdir(boost)

# Third-party downloaded targets
add_react_third_party_ndk_subdir(glog)
add_react_third_party_ndk_subdir(double-conversion)
add_react_third_party_ndk_subdir(fast_float)
add_react_third_party_ndk_subdir(fmt)
add_fantom_third_party_subdir(folly)
add_fantom_third_party_subdir(gflags)
add_fantom_third_party_subdir(nlohmann_json)

add_subdirectory(${FANTOM_CODEGEN_DIR} codegen)

add_library(glog_init INTERFACE)

add_react_common_subdir(callinvoker)
add_react_common_subdir(cxxreact)
add_react_common_subdir(devtoolsruntimesettings)
add_react_common_subdir(hermes/executor)
add_react_common_subdir(hermes/inspector-modern)
add_react_common_subdir(jserrorhandler)
add_react_common_subdir(jsi)
add_react_common_subdir(jsiexecutor)
add_react_common_subdir(jsinspector-modern)
add_react_common_subdir(jsinspector-modern/cdp)
add_react_common_subdir(jsinspector-modern/network)
add_react_common_subdir(jsinspector-modern/tracing)
add_react_common_subdir(jsitooling)
add_react_common_subdir(logger)
add_react_common_subdir(oscompat)
add_react_common_subdir(react/bridging)
add_react_common_subdir(react/debug)
add_react_common_subdir(react/featureflags)
add_react_common_subdir(react/nativemodule/core)
add_react_common_subdir(react/nativemodule/cputime)
add_react_common_subdir(react/nativemodule/defaults)
add_react_common_subdir(react/nativemodule/devtoolsruntimesettings)
add_react_common_subdir(react/nativemodule/dom)
add_react_common_subdir(react/nativemodule/fantomtestspecificmethods)
add_react_common_subdir(react/nativemodule/featureflags)
add_react_common_subdir(react/nativemodule/idlecallbacks)
add_react_common_subdir(react/nativemodule/intersectionobserver)
add_react_common_subdir(react/nativemodule/microtasks)
add_react_common_subdir(react/nativemodule/mutationobserver)
add_react_common_subdir(react/nativemodule/viewtransition)
add_react_common_subdir(react/nativemodule/webperformance)
add_react_common_subdir(react/performance/cdpmetrics)
add_react_common_subdir(react/performance/timeline)
add_react_common_subdir(react/renderer/animated)
add_react_common_subdir(react/renderer/animationbackend)
add_react_common_subdir(react/renderer/attributedstring)
add_react_common_subdir(react/renderer/bridging)
add_react_common_subdir(react/renderer/componentregistry)
add_react_common_subdir(react/renderer/componentregistry/native)
add_react_common_subdir(react/renderer/components/image)
add_react_common_subdir(react/renderer/components/legacyviewmanagerinterop)
add_react_common_subdir(react/renderer/components/modal)
add_react_common_subdir(react/renderer/components/root)
add_react_common_subdir(react/renderer/components/scrollview)
add_react_common_subdir(react/renderer/components/text)
add_react_common_subdir(react/renderer/components/view)
add_react_common_subdir(react/renderer/consistency)
add_react_common_subdir(react/renderer/core)
add_react_common_subdir(react/renderer/css)
add_react_common_subdir(react/renderer/debug)
add_react_common_subdir(react/renderer/dom)
add_react_common_subdir(react/renderer/graphics)
add_react_common_subdir(react/renderer/imagemanager)
add_react_common_subdir(react/renderer/leakchecker)
add_react_common_subdir(react/renderer/mapbuffer)
add_react_common_subdir(react/renderer/mounting)
add_react_common_subdir(react/renderer/observers/events)
add_react_common_subdir(react/renderer/observers/intersection)
add_react_common_subdir(react/renderer/observers/mutation)
add_react_common_subdir(react/renderer/runtimescheduler)
add_react_common_subdir(react/renderer/scheduler)
add_react_common_subdir(react/renderer/telemetry)
add_react_common_subdir(react/renderer/textlayoutmanager)
add_react_common_subdir(react/renderer/uimanager)
add_react_common_subdir(react/renderer/viewtransition)
add_react_common_subdir(react/renderer/uimanager/consistency)
add_react_common_subdir(react/runtime)
add_react_common_subdir(react/runtime/hermes)
add_react_common_subdir(react/timing)
add_react_common_subdir(react/utils)
add_react_common_subdir(reactperflogger)
add_react_common_subdir(runtimeexecutor)
add_react_common_subdir(yoga)

# This is a hack to make sure that libraries that depend on jni yoga are linked
add_library(yoga ALIAS yogacore)

add_react_cxx_platform_subdir(react/coremodules)
add_react_cxx_platform_subdir(react/devsupport)
add_react_cxx_platform_subdir(react/http)
add_react_cxx_platform_subdir(react/io)
add_react_cxx_platform_subdir(react/logging)
add_react_cxx_platform_subdir(react/nativemodule)
add_react_cxx_platform_subdir(react/profiling)
add_react_cxx_platform_subdir(react/renderer/scheduler)
add_react_cxx_platform_subdir(react/renderer/uimanager)
add_react_cxx_platform_subdir(react/runtime)
add_react_cxx_platform_subdir(react/threading)
add_react_cxx_platform_subdir(react/utils)

file(GLOB SOURCES
    ${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/render/*.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/stubs/*.cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/platform/oss/*.cpp
)
add_executable(fantom_tester ${SOURCES})

target_include_directories(fantom_tester PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/src)

target_link_libraries(fantom_tester
  PRIVATE
    # third-party
    boost
    double-conversion
    fmt
    folly_runtime
    gflags
    glog

    # hermes
    hermes-engine::hermesvm

    # codegen
    react_codegen_rncore

    # ReactCommon
    bridgeless
    bridgelesshermes
    devtoolsruntimesettings
    hermes_executor_common
    hermes_inspector_modern
    jserrorhandler
    jsi
    jsinspector
    jsinspector_cdp
    jsinspector_network
    jsinspector_tracing
    jsireact
    jsitooling
    logger
    oscompat
    react_bridging
    react_cxxreact
    react_debug
    react_featureflags
    react_nativemodule_core
    react_nativemodule_cpu
    react_nativemodule_defaults
    react_nativemodule_devtoolsruntimesettings
    react_nativemodule_dom
    react_nativemodule_fantomspecificmethods
    react_nativemodule_featureflags
    react_nativemodule_idlecallbacks
    react_nativemodule_intersectionobserver
    react_nativemodule_microtasks
    react_nativemodule_mutationobserver
    react_nativemodule_viewtransition
    react_nativemodule_webperformance
    react_performance_cdpmetrics
    react_performance_timeline
    react_renderer_attributedstring
    react_renderer_componentregistry
    react_renderer_consistency
    react_renderer_core
    react_renderer_css
    react_renderer_debug
    react_renderer_dom
    react_renderer_graphics
    react_renderer_imagemanager
    react_renderer_leakchecker
    react_renderer_mapbuffer
    react_renderer_mounting
    react_renderer_observers_events
    react_renderer_observers_intersection
    react_renderer_observers_mutation
    react_renderer_runtimescheduler
    react_renderer_scheduler
    react_renderer_telemetry
    react_renderer_textlayoutmanager
    react_renderer_uimanager
    react_renderer_uimanager_consistency
    react_utils
    reactperflogger
    rrc_legacyviewmanagerinterop
    rrc_image
    rrc_modal
    rrc_native
    rrc_root
    rrc_scrollview
    rrc_text
    rrc_view
    runtimeexecutor
    yogacore

    # ReactCxxPlatform
    react_cxx_platform_react_coremodules
    react_cxx_platform_react_devsupport
    react_cxx_platform_react_http
    react_cxx_platform_react_io
    react_cxx_platform_react_logging
    react_cxx_platform_react_profiling
    react_renderer_animated
    react_renderer_animationbackend
    react_cxx_platform_react_renderer_scheduler
    react_cxx_platform_react_runtime
    react_cxx_platform_react_threading
    react_cxx_platform_react_utils
)

target_compile_options(fantom_tester
  PRIVATE
    -Wall
    -Werror
    -fexceptions
    -frtti
    -std=c++20)
