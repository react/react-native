# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_performance_cdpmetrics_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_performance_cdpmetrics OBJECT ${react_performance_cdpmetrics_SRC})

target_compile_reactnative_options(react_performance_cdpmetrics PRIVATE)
target_compile_options(react_performance_cdpmetrics PRIVATE -Wpedantic)

target_include_directories(react_performance_cdpmetrics PUBLIC ${REACT_COMMON_DIR})
target_link_libraries(react_performance_cdpmetrics
        folly_runtime
        jsi
        react_cxxstableapi
        react_performance_timeline
        react_timing
        runtimeexecutor)
