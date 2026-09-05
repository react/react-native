# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_renderer_componentregistry_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_renderer_componentregistry OBJECT ${react_renderer_componentregistry_SRC})

target_include_directories(react_renderer_componentregistry PUBLIC ${REACT_COMMON_DIR})
target_include_directories(react_renderer_componentregistry INTERFACE ${REACT_COMMON_DIR}/react/renderer/componentregistry)

target_link_libraries(react_renderer_componentregistry
        folly_runtime
        glog_init
        jsi
        react_cxxstableapi
        react_debug
        react_renderer_core
        react_renderer_debug
        react_utils
        rrc_legacyviewmanagerinterop
)
target_compile_reactnative_options(react_renderer_componentregistry PRIVATE)
target_compile_options(react_renderer_componentregistry PRIVATE -Wpedantic)
