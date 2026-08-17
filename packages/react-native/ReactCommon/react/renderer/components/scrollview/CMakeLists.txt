# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/internal/react-native-platform-selector.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

react_native_android_selector(platform_SRC
        platform/android/react/renderer/components/scrollview/*.cpp
        platform/cxx/react/renderer/components/scrollview/*.cpp
)
file(GLOB rrc_scrollview_SRC CONFIGURE_DEPENDS *.cpp ${platform_SRC})
add_library(rrc_scrollview STATIC ${rrc_scrollview_SRC})

react_native_android_selector(platform_DIR
        ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
        ${CMAKE_CURRENT_SOURCE_DIR}/platform/cxx/)
target_include_directories(rrc_scrollview PUBLIC ${REACT_COMMON_DIR} . ${platform_DIR})

react_native_android_selector(platform_DIR_PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/react/renderer/components/scrollview/
        ${CMAKE_CURRENT_SOURCE_DIR}/platform/cxx/react/renderer/components/scrollview/)
target_include_directories(rrc_scrollview PRIVATE ${platform_DIR_PRIVATE})

target_link_libraries(rrc_scrollview
        glog
        folly_runtime
        glog_init
        jsi
        react_cxxstableapi
        react_debug
        react_renderer_core
        react_renderer_debug
        react_renderer_graphics
        react_renderer_mapbuffer
        rrc_view
        yoga
)
target_compile_reactnative_options(rrc_scrollview PRIVATE)
target_compile_options(rrc_scrollview PRIVATE -Wpedantic)
