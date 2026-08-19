# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB rrc_unimplementedview_SRC CONFIGURE_DEPENDS *.cpp)
add_library(rrc_unimplementedview STATIC ${rrc_unimplementedview_SRC})

target_include_directories(rrc_unimplementedview PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(rrc_unimplementedview
        glog
        folly_runtime
        glog_init
        jsi
        react_cxxstableapi
        react_debug
        react_renderer_core
        react_renderer_debug
        react_renderer_graphics
        rrc_view
        yoga
)
target_compile_reactnative_options(rrc_unimplementedview PRIVATE)
target_compile_options(rrc_unimplementedview PRIVATE -Wpedantic)
