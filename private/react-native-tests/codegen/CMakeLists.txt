# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Builds the generated codegen sources (FBReactNativeSpec) that Fabric component
# tests depend on. Populated by the Gradle `prepareRNCodegen` task, which runs
# `generateCodegenArtifactsFromSchema` and stages the generated headers/sources
# next to this file. Mirrors private/react-native-fantom/tester/codegen.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB react_codegen_SRCS CONFIGURE_DEPENDS react/renderer/components/FBReactNativeSpec/*.cpp)

add_library(
  react_codegen_rncore
  OBJECT
  ${react_codegen_SRCS}
)

target_include_directories(react_codegen_rncore
  PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/.
    ${CMAKE_CURRENT_SOURCE_DIR}/react/renderer/components/FBReactNativeSpec
    ${CMAKE_CURRENT_SOURCE_DIR}/react/renderer/components)

target_link_libraries(
  react_codegen_rncore
  jsi
  react_nativemodule_core
  rrc_view
)

target_compile_options(
  react_codegen_rncore
  PRIVATE
  -DLOG_TAG=\"ReactNative\"
  -fexceptions
  -frtti
  -std=c++20
  -Wall
)
