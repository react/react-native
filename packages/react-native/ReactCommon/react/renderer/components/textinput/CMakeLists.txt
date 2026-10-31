# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/internal/react-native-platform-selector.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

react_native_android_selector(platform_SRC
        platform/android/react/renderer/components/androidtextinput/*.cpp
        "")
file(GLOB rrc_textinput_SRC CONFIGURE_DEPENDS *.cpp ${platform_SRC})
add_library(rrc_textinput OBJECT ${rrc_textinput_SRC})

react_native_android_selector(platform_DIR
        ${CMAKE_CURRENT_SOURCE_DIR}/platform/android/
        "")
target_include_directories(rrc_textinput PUBLIC . ${platform_DIR})

target_link_libraries(rrc_textinput
        glog
        folly_runtime
        glog_init
        jsi
        react_debug
        react_renderer_attributedstring
        react_renderer_componentregistry
        react_renderer_core
        react_renderer_debug
        react_renderer_graphics
        react_renderer_imagemanager
        react_renderer_mapbuffer
        react_renderer_mounting
        react_renderer_textlayoutmanager
        react_renderer_uimanager
        react_utils
        rrc_image
        rrc_text
        rrc_view
        yoga
)
target_compile_reactnative_options(rrc_textinput PRIVATE)
target_compile_options(rrc_textinput PRIVATE -Wpedantic)
