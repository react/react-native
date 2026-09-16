# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_featureflags_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_featureflags OBJECT ${react_featureflags_SRC})

target_include_directories(react_featureflags PUBLIC ${REACT_COMMON_DIR})
target_include_directories(react_featureflags INTERFACE ${REACT_COMMON_DIR}/react/featureflags)

target_link_libraries(react_featureflags folly_runtime react_cxxstableapi)
target_compile_reactnative_options(react_featureflags PRIVATE)
target_compile_options(react_featureflags PRIVATE -Wpedantic)
