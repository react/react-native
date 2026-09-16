# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

add_library(react_timing INTERFACE)

target_include_directories(react_timing INTERFACE ${REACT_COMMON_DIR})
target_include_directories(react_timing INTERFACE ${REACT_COMMON_DIR}/react/timing)

target_link_libraries(react_timing INTERFACE
        react_cxxstableapi
        react_debug)
target_compile_reactnative_options(react_timing INTERFACE)
target_compile_options(react_timing INTERFACE -Wpedantic)
