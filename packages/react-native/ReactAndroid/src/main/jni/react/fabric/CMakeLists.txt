# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB fabricjni_SRCS CONFIGURE_DEPENDS *.cpp)

add_library(
        fabricjni
        OBJECT
        ${fabricjni_SRCS}
)

target_include_directories(fabricjni PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

target_merge_so(fabricjni)

target_link_libraries(
        fabricjni
        fbjni
        folly_runtime
        glog
        jsi
        mapbufferjni
        react_codegen_rncore
        react_debug
        react_featureflags
        react_renderer_animations
        react_renderer_attributedstring
        react_renderer_componentregistry
        react_renderer_core
        react_renderer_css
        react_renderer_debug
        react_renderer_dom
        react_renderer_graphics
        react_renderer_imagemanager
        react_renderer_mapbuffer
        react_renderer_mounting
        react_renderer_runtimescheduler
        react_renderer_scheduler
        react_renderer_telemetry
        react_renderer_textlayoutmanager
        react_renderer_uimanager
        react_renderer_uimanager_consistency
        rrc_legacyviewmanagerinterop
        react_utils
        reactnativejni
        rrc_image
        rrc_modal
        rrc_progressbar
        rrc_root
        rrc_scrollview
        rrc_switch
        rrc_text
        rrc_textinput
        rrc_unimplementedview
        rrc_view
        yoga
)

target_compile_reactnative_options(fabricjni PRIVATE)
