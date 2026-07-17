# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

##################
###    jsi     ###
##################

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)


file(GLOB jsi_SRC CONFIGURE_DEPENDS jsi/*.cpp)
add_library(jsi SHARED ${jsi_SRC})

target_include_directories(jsi PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_link_libraries(jsi
        folly_runtime
        glog)

target_compile_reactnative_options(jsi PRIVATE)
target_compile_options(jsi PRIVATE -O3 -Wno-unused-lambda-capture)

# Enable the in-development JSI features (e.g. jsi::Serialized / ISerialization)
# that are gated behind JSI_UNSTABLE. This must match how the Hermes prebuilt was
# built: a Hermes compiled with JSI_UNSTABLE references these JSI symbols, so JSI
# must export them or libhermesvm.so fails to load at runtime. PUBLIC so consumers
# that include jsi.h see the same declarations (consistent ABI).
target_compile_definitions(jsi PUBLIC JSI_UNSTABLE)
