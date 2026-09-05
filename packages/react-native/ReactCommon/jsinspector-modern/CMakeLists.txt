# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB jsinspector_SRC CONFIGURE_DEPENDS *.cpp)
# jsinspector contains singletons that hold app-global state (InspectorFlags, InspectorImpl).
# Placing it in a shared library makes the singletons safe to use from arbitrary shared libraries
# (even ones that don't depend on one another).
add_library(jsinspector OBJECT ${jsinspector_SRC})
target_merge_so(jsinspector)

target_include_directories(jsinspector PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(jsinspector
        folly_runtime
        glog
        jsinspector_network
        jsinspector_tracing
        react_cxxstableapi
        react_featureflags
        runtimeexecutor
        reactperflogger
        react_utils
)
target_compile_reactnative_options(jsinspector PRIVATE)
if(${CMAKE_BUILD_TYPE} MATCHES Debug OR REACT_NATIVE_DEBUG_OPTIMIZED)
  target_compile_options(jsinspector PRIVATE
          -DREACT_NATIVE_DEBUGGER_ENABLED=1
          -DREACT_NATIVE_DEBUGGER_ENABLED_DEVONLY=1
  )
endif ()
