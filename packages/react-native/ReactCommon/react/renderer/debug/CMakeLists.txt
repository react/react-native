# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_renderer_debug_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_renderer_debug OBJECT ${react_renderer_debug_SRC})

target_include_directories(react_renderer_debug PUBLIC ${REACT_COMMON_DIR})
target_link_libraries(react_renderer_debug folly_runtime react_cxxstableapi react_debug)
target_compile_reactnative_options(react_renderer_debug PRIVATE)
target_compile_options(react_renderer_debug PRIVATE -Wpedantic)

# Enable debug string convertible for Debug builds or when explicitly requested
# This allows getRenderedOutput() to include props in tests
# Set RN_ENABLE_DEBUG_STRING_CONVERTIBLE=ON to enable for Release builds
if(${CMAKE_BUILD_TYPE} MATCHES Debug OR RN_ENABLE_DEBUG_STRING_CONVERTIBLE)
  target_compile_definitions(react_renderer_debug PUBLIC RN_ENABLE_DEBUG_STRING_CONVERTIBLE)
endif()
