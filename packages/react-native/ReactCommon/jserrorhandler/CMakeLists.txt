# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB js_error_handler_SRC CONFIGURE_DEPENDS *.cpp)
add_library(
        jserrorhandler
        OBJECT
        ${js_error_handler_SRC}
)
target_include_directories(jserrorhandler PUBLIC .)
react_native_android_selector(marbufferjni marbufferjni "")
target_link_libraries(jserrorhandler
        jsi
        callinvoker
        folly_runtime
        ${mapbufferjni}
        react_cxxstableapi
        react_featureflags
)
target_compile_reactnative_options(jserrorhandler PRIVATE)
