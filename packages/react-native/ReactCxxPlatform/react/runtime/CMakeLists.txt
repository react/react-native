# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_cxx_platform_react_runtime_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_cxx_platform_react_runtime OBJECT ${react_cxx_platform_react_runtime_SRC})

target_include_directories(react_cxx_platform_react_runtime
    PUBLIC
      ${REACT_CXX_PLATFORM_DIR})

target_link_libraries(react_cxx_platform_react_runtime
      bridgeless
      bridgelesshermes
      callinvoker
      glog
      jserrorhandler
      jsinspector
      react_codegen_rncore
      react_cxx_platform_react_coremodules
      react_cxx_platform_react_devsupport
      react_cxx_platform_react_devsupport
      react_cxx_platform_react_http
      react_cxx_platform_react_io
      react_cxx_platform_react_logging
      react_cxx_platform_react_nativemodule
      react_renderer_animated
      react_renderer_animationbackend
      react_cxx_platform_react_renderer_uimanager
      react_cxx_platform_react_threading
      react_cxx_platform_react_utils
      react_cxxreact
      react_debug
      react_nativemodule_core
      react_nativemodule_defaults
      react_nativemodule_intersectionobserver
      react_nativemodule_mutationobserver
      react_nativemodule_webperformance
      react_renderer_graphics
      react_renderer_runtimescheduler
      react_renderer_scheduler
      rrc_native
      rrc_view
)
target_compile_reactnative_options(react_cxx_platform_react_runtime PRIVATE)
target_compile_options(react_cxx_platform_react_runtime PRIVATE -Wpedantic -Wno-deprecated-declarations)
