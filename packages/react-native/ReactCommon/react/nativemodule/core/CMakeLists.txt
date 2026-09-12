# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

react_native_android_selector(platform_SRC platform/android/ReactCommon/*.cpp "")
file(GLOB react_nativemodule_core_SRC CONFIGURE_DEPENDS
        ReactCommon/*.cpp
        ${platform_SRC})
add_library(react_nativemodule_core
        OBJECT
        ${react_nativemodule_core_SRC})

react_native_android_selector(platform_DIR ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/ "")
target_include_directories(react_nativemodule_core
        PUBLIC
          ${CMAKE_CURRENT_SOURCE_DIR}
          ${platform_DIR}
        )
target_include_directories(react_nativemodule_core INTERFACE ${REACT_COMMON_DIR}/react/nativemodule/core)

react_native_android_selector(fbjni fbjni "")
react_native_android_selector(reactnativejni reactnativejni "")
target_link_libraries(react_nativemodule_core
        ${fbjni}
        folly_runtime
        glog
        jsi
        react_bridging
        react_cxxstableapi
        react_debug
        react_utils
        react_featureflags
        reactperflogger
        ${reactnativejni})
target_compile_reactnative_options(react_nativemodule_core PRIVATE)
target_compile_options(react_nativemodule_core PRIVATE -Wpedantic)
