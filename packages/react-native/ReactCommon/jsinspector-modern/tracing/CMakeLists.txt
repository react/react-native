# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB jsinspector_tracing_SRC CONFIGURE_DEPENDS *.cpp)

add_library(jsinspector_tracing OBJECT ${jsinspector_tracing_SRC})
target_merge_so(jsinspector_tracing)

target_include_directories(jsinspector_tracing PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(jsinspector_tracing
        folly_runtime
        jsi
        jsinspector_network
        oscompat
        react_timing
        react_utils
)
target_compile_reactnative_options(jsinspector_tracing PRIVATE)
target_compile_options(jsinspector_tracing PRIVATE -Wpedantic)
