# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_newarchdefaults_SRC CONFIGURE_DEPENDS *.cpp)

add_library(react_newarchdefaults OBJECT ${react_newarchdefaults_SRC})

target_merge_so(react_newarchdefaults)

target_include_directories(react_newarchdefaults PUBLIC .)

target_link_libraries(react_newarchdefaults
        fbjni
        fabricjni
        react_featureflagsjni
        react_nativemodule_core
        react_codegen_rncore
        react_cxxreactpackage
        react_nativemodule_defaults
        react_nativemodule_dom
        react_nativemodule_featureflags
        react_nativemodule_microtasks
        react_nativemodule_idlecallbacks
        react_renderer_attributedstring
        react_renderer_componentregistry
        react_renderer_textlayoutmanager
        rrc_image
        rrc_keyboardavoidingview
        rrc_modal
        rrc_progressbar
        rrc_safeareaview
        rrc_scrollview
        rrc_switch
        rrc_text
        rrc_textinput
        rrc_unimplementedview
        rrc_view
        jsi)

target_compile_reactnative_options(react_newarchdefaults PRIVATE)
