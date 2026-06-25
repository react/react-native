# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/internal/react-native-platform-selector.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB_RECURSE bridgeless_hermes_SRC CONFIGURE_DEPENDS *.cpp)
add_library(
        bridgelesshermes
        OBJECT
        ${bridgeless_hermes_SRC}
)
target_include_directories(bridgelesshermes PUBLIC .)

react_native_android_selector(reactnative reactnative "")
target_link_libraries(bridgelesshermes
        hermes-engine::hermesvm
        hermes_executor_common
        hermes_inspector_modern
        jsi
        jsitooling
        jsinspector
        ${reactnative}
)

target_compile_reactnative_options(bridgelesshermes PRIVATE)
if(${CMAKE_BUILD_TYPE} MATCHES Debug OR REACT_NATIVE_DEBUG_OPTIMIZED)
        target_compile_options(
                bridgelesshermes
                PRIVATE
                -DHERMES_ENABLE_DEBUGGER=1
        )
endif()
