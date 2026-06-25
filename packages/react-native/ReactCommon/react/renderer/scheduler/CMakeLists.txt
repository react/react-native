# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

file(GLOB react_renderer_scheduler_SRC CONFIGURE_DEPENDS *.cpp)
add_library(react_renderer_scheduler STATIC ${react_renderer_scheduler_SRC})

target_include_directories(react_renderer_scheduler PUBLIC ${REACT_COMMON_DIR})

target_link_libraries(react_renderer_scheduler
        folly_runtime
        glog
        jsi
        react_debug
        react_featureflags
        react_performance_cdpmetrics
        react_performance_timeline
        react_renderer_animationbackend
        react_renderer_componentregistry
        react_renderer_core
        react_renderer_debug
        react_renderer_graphics
        react_renderer_mounting
        react_renderer_observers_events
        react_renderer_runtimescheduler
        react_renderer_uimanager
        react_renderer_viewtransition
        react_utils
        rrc_root
        rrc_view
        yoga
)
target_compile_reactnative_options(react_renderer_scheduler PRIVATE)
target_compile_options(react_renderer_scheduler PRIVATE -Wpedantic)
