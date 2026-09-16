# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)
file(GLOB jsitooling_SRC CONFIGURE_DEPENDS react/runtime/*.cpp)
add_library(jsitooling OBJECT ${jsitooling_SRC})

target_include_directories(jsitooling
    PUBLIC
    ${REACT_COMMON_DIR}
    ${CMAKE_CURRENT_SOURCE_DIR}
)

target_link_libraries(jsitooling
        react_cxxreact
        folly_runtime
        glog
        jsi
        react_cxxstableapi)

target_compile_reactnative_options(jsitooling PRIVATE)
target_compile_options(jsitooling PRIVATE -Wpedantic)
