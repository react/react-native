# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB_RECURSE hermes_executor_SRC CONFIGURE_DEPENDS *.cpp)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

add_library(hermes_executor
        OBJECT
        ${hermes_executor_SRC}
)
target_merge_so(hermes_executor)
target_include_directories(hermes_executor PRIVATE .)
target_link_libraries(
        hermes_executor
        hermes_executor_common
        hermes-engine::hermesvm
        jsi
        reactnative
)
target_compile_reactnative_options(hermes_executor PRIVATE)
if(${CMAKE_BUILD_TYPE} MATCHES Debug OR REACT_NATIVE_DEBUG_OPTIMIZED)
  target_compile_options(hermes_executor PRIVATE -DHERMES_ENABLE_DEBUGGER=1)
endif()
