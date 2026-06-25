# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/internal/react-native-platform-selector.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB bridgeless_SRC "*.cpp")

add_library(bridgeless
        OBJECT
        ${bridgeless_SRC}
)
target_compile_reactnative_options(bridgeless PRIVATE)
if(${CMAKE_BUILD_TYPE} MATCHES Debug OR REACT_NATIVE_DEBUG_OPTIMIZED)
  target_compile_options(bridgeless PRIVATE -DHERMES_ENABLE_DEBUGGER=1)
endif ()
target_include_directories(bridgeless PUBLIC .)

react_native_android_selector(fabricjni fabricjni "")
react_native_android_selector(react_featureflagsjni react_featureflagsjni react_featureflags)
react_native_android_selector(turbomodulejsijni turbomodulejsijni "")

target_link_libraries(
        bridgeless
        jserrorhandler
        ${fabricjni}
        ${react_featureflagsjni}
        ${turbomodulejsijni}
        jsi
        jsitooling
        jsireact
        react_utils
        jsinspector
        react_featureflags
        react_performance_timeline
        react_utils
)
