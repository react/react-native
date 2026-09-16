# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB_RECURSE bridgeless_nativeviewconfig_SRC CONFIGURE_DEPENDS *.cpp)
add_library(
        bridgelessnativeviewconfig
        OBJECT
        ${bridgeless_nativeviewconfig_SRC}
)
target_include_directories(bridgelessnativeviewconfig PUBLIC .)

target_link_libraries(bridgelessnativeviewconfig jsi react_cxxstableapi)
target_compile_reactnative_options(bridgelessnativeviewconfig PRIVATE)
