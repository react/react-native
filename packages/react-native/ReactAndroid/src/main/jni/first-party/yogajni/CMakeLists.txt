# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB yoga_SRC CONFIGURE_DEPENDS jni/*.cpp)
add_library(yoga OBJECT ${yoga_SRC})

target_include_directories(yoga PUBLIC jni)
target_merge_so(yoga)

target_link_libraries(yoga
        yogacore
        fbjni
        log
        android
)

target_compile_reactnative_options(yoga PRIVATE)
target_compile_options(yoga PRIVATE -fvisibility=hidden -O3 -flto)
