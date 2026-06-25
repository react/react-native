# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_tracingjni_SRC CONFIGURE_DEPENDS *.cpp)

add_library(react_tracingjni OBJECT ${react_tracingjni_SRC})

target_merge_so(react_tracingjni)

target_include_directories(react_tracingjni PUBLIC .)

target_link_libraries(react_tracingjni
        fbjni
        folly_runtime
        jsinspector
        jsinspector_tracing
        react_timing
        reactnativejni)

target_compile_reactnative_options(react_tracingjni PRIVATE)
