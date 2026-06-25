# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)


include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB reactnativeblob_SRC CONFIGURE_DEPENDS ${CMAKE_CURRENT_SOURCE_DIR}/*.cpp)
add_library(reactnativeblob OBJECT ${reactnativeblob_SRC})

target_include_directories(reactnativeblob PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})
target_merge_so(reactnativeblob)

target_link_libraries(reactnativeblob
        jsireact
        fbjni
        folly_runtime
        jsi
        reactnativejni
        turbomodulejsijni)

target_compile_reactnative_options(reactnativeblob PRIVATE)
target_compile_options(reactnativeblob PRIVATE -fvisibility=hidden)
