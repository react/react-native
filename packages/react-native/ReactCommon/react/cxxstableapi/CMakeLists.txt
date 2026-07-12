# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

# Header-only: the cxxstableapi guards are pure preprocessor headers, so this is
# an INTERFACE library. Headers resolve as <react/cxxstableapi/*.h> via the
# shared ${REACT_COMMON_DIR} include root.
add_library(react_cxxstableapi INTERFACE)

target_include_directories(react_cxxstableapi INTERFACE ${REACT_COMMON_DIR})
target_compile_reactnative_options(react_cxxstableapi INTERFACE)
target_compile_options(react_cxxstableapi INTERFACE -Wpedantic)
