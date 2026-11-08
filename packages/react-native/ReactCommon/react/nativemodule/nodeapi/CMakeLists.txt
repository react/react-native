# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_nativemodule_nodeapi_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_nativemodule_nodeapi OBJECT ${react_nativemodule_nodeapi_SRC})

target_include_directories(react_nativemodule_nodeapi PUBLIC ${REACT_COMMON_DIR})

get_target_property(hermes_include_dirs hermes-engine::hermesvm INTERFACE_INCLUDE_DIRECTORIES)
list(TRANSFORM hermes_include_dirs APPEND /hermes/napi)
target_include_directories(react_nativemodule_nodeapi PUBLIC ${hermes_include_dirs})

target_link_libraries(react_nativemodule_nodeapi
        hermes-engine::hermesvm
        jsi
        logger
        react_codegen_rncore
        react_cxxreact
        react_cxxstableapi
)
target_compile_reactnative_options(react_nativemodule_nodeapi PRIVATE)
