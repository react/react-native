# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB devtoolsruntimesettings_SRCS *.cpp)
add_library(devtoolsruntimesettings OBJECT ${devtoolsruntimesettings_SRCS})

target_include_directories(devtoolsruntimesettings PUBLIC .)

target_link_libraries(devtoolsruntimesettings jsi react_codegen_rncore react_cxxstableapi)
target_compile_reactnative_options(devtoolsruntimesettings PRIVATE)
