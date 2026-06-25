# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/internal/react-native-platform-selector.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB hermesinspectormodern_SRC CONFIGURE_DEPENDS chrome/*.cpp)

add_library(hermes_inspector_modern
        OBJECT
        ${hermesinspectormodern_SRC})

target_compile_reactnative_options(hermes_inspector_modern PRIVATE)

if(${CMAKE_BUILD_TYPE} MATCHES Debug OR REACT_NATIVE_DEBUG_OPTIMIZED)
        target_compile_options(
                hermes_inspector_modern
                PRIVATE
                -DHERMES_ENABLE_DEBUGGER=1
        )
endif()

target_include_directories(hermes_inspector_modern PUBLIC ${REACT_COMMON_DIR})
react_native_android_selector(reactnative reactnative "")
target_link_libraries(hermes_inspector_modern
        hermes-engine::hermesvm
        jsi
        jsinspector
        ${reactnative})
