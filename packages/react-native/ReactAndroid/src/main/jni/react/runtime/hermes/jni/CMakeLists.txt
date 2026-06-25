# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB_RECURSE hermes_instance_jni_SRC CONFIGURE_DEPENDS *.cpp)

add_library(hermesinstancejni
        OBJECT
        ${hermes_instance_jni_SRC}
)
target_include_directories(hermesinstancejni PRIVATE .)
target_merge_so(hermesinstancejni)

target_link_libraries(hermesinstancejni
        hermes-engine::hermesvm
        jsitooling
        fbjni
        bridgelesshermes
        reactnative
)

target_compile_reactnative_options(hermesinstancejni PRIVATE)
if(${CMAKE_BUILD_TYPE} MATCHES Debug OR REACT_NATIVE_DEBUG_OPTIMIZED)
  target_compile_options(hermesinstancejni PRIVATE -DHERMES_ENABLE_DEBUGGER=1)
endif ()
