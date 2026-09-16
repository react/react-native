# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_renderer_animations_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_renderer_animations STATIC ${react_renderer_animations_SRC})

target_include_directories(react_renderer_animations PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_renderer_animations
        folly_runtime
        glog
        glog_init
        jsi
        react_cxxstableapi
        react_debug
        react_renderer_componentregistry
        react_renderer_core
        react_renderer_debug
        react_renderer_graphics
        react_renderer_mounting
        react_renderer_uimanager
        rrc_view
        runtimeexecutor
        yoga
)
target_compile_reactnative_options(react_renderer_animations PRIVATE)
target_compile_options(react_renderer_animations PRIVATE -Wpedantic)
