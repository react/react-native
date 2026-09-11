# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_renderer_core_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_renderer_core OBJECT ${react_renderer_core_SRC})

target_include_directories(react_renderer_core PUBLIC ${REACT_COMMON_DIR})
target_include_directories(react_renderer_core INTERFACE ${REACT_COMMON_DIR}/react/renderer/core)
target_link_libraries(react_renderer_core
        folly_runtime
        glog
        jsi
        logger
        react_cxxstableapi
        react_debug
        react_featureflags
        react_renderer_debug
        react_renderer_graphics
        react_renderer_mapbuffer
        react_renderer_runtimescheduler
        react_utils
        runtimeexecutor
        yoga)
target_compile_reactnative_options(react_renderer_core PRIVATE)
target_compile_options(react_renderer_core PRIVATE -Wpedantic)
