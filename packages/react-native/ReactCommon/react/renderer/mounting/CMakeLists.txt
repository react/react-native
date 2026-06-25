# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_renderer_mounting_SRC CONFIGURE_DEPENDS
        *.cpp
        internal/*.cpp
        stubs/*.cpp)
add_library(react_renderer_mounting OBJECT ${react_renderer_mounting_SRC})

target_include_directories(react_renderer_mounting PRIVATE .)
target_include_directories(react_renderer_mounting PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_renderer_mounting
        folly_runtime
        glog
        glog_init
        jsi
        jsinspector_tracing
        react_debug
        react_renderer_core
        react_renderer_debug
        react_renderer_graphics
        react_renderer_telemetry
        react_utils
        rrc_root
        rrc_view
        rrc_scrollview
        yoga)
target_compile_reactnative_options(react_renderer_mounting PRIVATE)
target_compile_options(react_renderer_mounting PRIVATE -Wpedantic)
