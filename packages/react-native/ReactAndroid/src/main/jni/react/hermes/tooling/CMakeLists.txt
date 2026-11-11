# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

# hermestooling is a shared library where we merge all the hermes* related libraries.
#
# It acts as an 'umbrella' library and gets removed by RNGP (see `configureJsEnginePackagingOptions`)

add_library(hermestooling
        SHARED
        $<TARGET_OBJECTS:bridgelesshermes>
        $<TARGET_OBJECTS:hermes_executor>
        $<TARGET_OBJECTS:hermes_executor_common>
        $<TARGET_OBJECTS:hermes_inspector_modern>
        $<TARGET_OBJECTS:hermesinstancejni>
        $<TARGET_OBJECTS:jni_lib_merge_glue>
        $<TARGET_OBJECTS:jsijniprofiler>
)
if(NOT RCT_DISABLE_NODE_API)
        target_sources(hermestooling PRIVATE $<TARGET_OBJECTS:react_nativemodule_nodeapi>)
        target_include_directories(hermestooling
                PUBLIC
                $<TARGET_PROPERTY:react_nativemodule_nodeapi,INTERFACE_INCLUDE_DIRECTORIES>
        )
endif()
target_merge_so(hermestooling)
target_link_libraries(hermestooling
        PUBLIC
        reactnative
        jsi
        hermes-engine::hermesvm
)
target_include_directories(hermestooling
        PUBLIC
        $<TARGET_PROPERTY:bridgelesshermes,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:hermes_executor,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:hermes_executor_common,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:hermes_inspector_modern,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:hermesinstancejni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jsijniprofiler,INTERFACE_INCLUDE_DIRECTORIES>
)
target_compile_reactnative_options(hermestooling PRIVATE)
