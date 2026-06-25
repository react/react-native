# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# This CMake file exposes the React Native Flags that all the libraries should use when
# compiling a module that will end up inside libreactnative.so

SET(reactnative_FLAGS
        -Wall
        -Werror
        -fexceptions
        -frtti
        -std=c++20
        -DFOLLY_NO_CONFIG=1
        -DLOG_TAG=\"ReactNative\"
)

# This function can be used to configure the reactnative flags for a specific target in
# a convenient way. The usage is:
#
# target_compile_reactnative_options(target_name scope)
#
# scope is either PUBLIC, PRIVATE or INTERFACE

function(target_compile_reactnative_options target_name scope)
  target_compile_options(${target_name} ${scope} ${reactnative_FLAGS})
  # TODO T228344694 improve this so that it works for all platforms
  if(ANDROID)
    target_compile_definitions(${target_name} ${scope} RN_SERIALIZABLE_STATE)
  endif()
  target_compile_definitions(${target_name} ${scope} HERMES_V1_ENABLED=1)
endfunction()
