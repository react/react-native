# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

add_library(jsireact
        OBJECT
        jsireact/JSIExecutor.cpp
        jsireact/JSINativeModules.cpp)

target_include_directories(jsireact PUBLIC .)

target_link_libraries(jsireact
        react_cxxreact
        react_cxxstableapi
        reactperflogger
        folly_runtime
        glog
        jserrorhandler
        jsi
        jsitooling)

target_compile_reactnative_options(jsireact PRIVATE)
target_compile_options(jsireact PRIVATE -O3)
