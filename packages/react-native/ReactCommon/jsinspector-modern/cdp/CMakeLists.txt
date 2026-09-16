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

file(GLOB jsinspector_cdp_SRC CONFIGURE_DEPENDS *.cpp)

add_library(jsinspector_cdp OBJECT ${jsinspector_cdp_SRC})
target_merge_so(jsinspector_cdp)

target_include_directories(jsinspector_cdp PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(jsinspector_cdp
        folly_runtime
        react_cxxstableapi
)
