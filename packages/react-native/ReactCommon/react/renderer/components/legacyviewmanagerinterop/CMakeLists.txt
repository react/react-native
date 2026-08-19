# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB rrc_legacyviewmanagerinterop_SRC CONFIGURE_DEPENDS *.cpp)
add_library(rrc_legacyviewmanagerinterop OBJECT ${rrc_legacyviewmanagerinterop_SRC})

target_include_directories(rrc_legacyviewmanagerinterop PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(rrc_legacyviewmanagerinterop
        glog
        glog_init
        folly_runtime
        jsi
        react_cxxstableapi
        react_renderer_core
        rrc_view
        yoga
)
target_compile_reactnative_options(rrc_legacyviewmanagerinterop PRIVATE)
target_compile_options(rrc_legacyviewmanagerinterop PRIVATE -Wpedantic)
