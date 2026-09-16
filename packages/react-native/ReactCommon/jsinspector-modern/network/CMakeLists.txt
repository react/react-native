# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)

add_compile_options(
        -fexceptions
        -std=c++20
        -Wall
        -Wpedantic)

file(GLOB jsinspector_network_SRC CONFIGURE_DEPENDS *.cpp)

add_library(jsinspector_network OBJECT ${jsinspector_network_SRC})
target_merge_so(jsinspector_network)

target_include_directories(jsinspector_network PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(jsinspector_network
        folly_runtime
        glog
        jsinspector_cdp
        react_cxxstableapi)
