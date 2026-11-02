# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_nativemodule_fantomspecificmethods_SRC CONFIGURE_DEPENDS *.cpp internal/*.cpp)
add_library(react_nativemodule_fantomspecificmethods OBJECT ${react_nativemodule_fantomspecificmethods_SRC})

target_include_directories(react_nativemodule_fantomspecificmethods PUBLIC ${REACT_COMMON_DIR})
target_include_directories(react_nativemodule_fantomspecificmethods PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/internal)

target_link_libraries(react_nativemodule_fantomspecificmethods
        react_codegen_rncore
        react_cxxreact
        react_cxxstableapi
        react_renderer_bridging
        react_renderer_core
        react_renderer_graphics
        react_renderer_observers_intersection
        react_renderer_runtimescheduler
        react_renderer_uimanager
        rrc_view
)
target_compile_reactnative_options(react_nativemodule_fantomspecificmethods PRIVATE)
target_compile_options(react_nativemodule_fantomspecificmethods PRIVATE -Wpedantic -Wno-deprecated-declarations)
