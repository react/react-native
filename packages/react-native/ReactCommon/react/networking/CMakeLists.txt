# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_networking_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_networking OBJECT ${react_networking_SRC})

target_compile_reactnative_options(react_networking PRIVATE)
target_compile_options(react_networking PRIVATE -Wpedantic)

target_include_directories(react_networking PUBLIC ${REACT_COMMON_DIR})
target_link_libraries(react_networking
        folly_runtime
        jsinspector_network
        jsinspector_tracing
        react_cxxstableapi
        react_performance_timeline
        react_timing)

if(${CMAKE_BUILD_TYPE} MATCHES Debug OR REACT_NATIVE_DEBUG_OPTIMIZED)
  target_compile_options(react_networking PRIVATE
          -DREACT_NATIVE_DEBUGGER_ENABLED=1
          -DREACT_NATIVE_DEBUGGER_ENABLED_DEVONLY=1
  )
endif ()
