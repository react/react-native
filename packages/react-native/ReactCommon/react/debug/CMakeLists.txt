# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_debug_SRC CONFIGURE_DEPENDS *.cpp)
file(GLOB react_debug_redbox_SRC CONFIGURE_DEPENDS redbox/*.cpp)
add_library(react_debug OBJECT ${react_debug_SRC} ${react_debug_redbox_SRC})

target_include_directories(react_debug PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_debug folly_runtime)

if(ANDROID)
  target_link_libraries(react_debug log)
endif()

target_compile_reactnative_options(react_debug PRIVATE)
target_compile_options(react_debug PRIVATE -Wpedantic)
if(NOT ${CMAKE_BUILD_TYPE} MATCHES Debug AND NOT REACT_NATIVE_DEBUG_OPTIMIZED)
        target_compile_options(react_debug PUBLIC -DNDEBUG)
endif()
