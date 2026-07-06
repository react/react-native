# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_renderer_runtimescheduler_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_renderer_runtimescheduler STATIC ${react_renderer_runtimescheduler_SRC})

target_include_directories(react_renderer_runtimescheduler PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_renderer_runtimescheduler
        callinvoker
        jserrorhandler
        jsi
        react_debug
        react_performance_timeline
        react_renderer_consistency
        react_renderer_debug
        react_timing
        react_utils
        react_featureflags
        runtimeexecutor
        jsinspector_tracing)
target_compile_reactnative_options(react_renderer_runtimescheduler PRIVATE)
target_compile_options(react_renderer_runtimescheduler PRIVATE -Wpedantic)
