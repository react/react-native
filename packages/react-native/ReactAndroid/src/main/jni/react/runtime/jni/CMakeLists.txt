# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB_RECURSE bridgeless_jni_SRC CONFIGURE_DEPENDS *.cpp)

add_library(rninstance
        OBJECT
        ${bridgeless_jni_SRC}
)

target_compile_reactnative_options(rninstance PRIVATE)
if(${CMAKE_BUILD_TYPE} MATCHES Debug OR REACT_NATIVE_DEBUG_OPTIMIZED)
  target_compile_options(rninstance PRIVATE -DHERMES_ENABLE_DEBUGGER=1)
endif ()

target_merge_so(rninstance)
target_include_directories(rninstance PUBLIC .)
target_link_libraries(
        rninstance
        fabricjni
        react_featureflagsjni
        turbomodulejsijni
        jsi
        jsitooling
        fbjni
        bridgeless
)
