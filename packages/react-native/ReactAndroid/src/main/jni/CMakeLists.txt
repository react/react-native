# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

project(ReactAndroid)

include(CheckIPOSupported)
check_ipo_supported(RESULT IPO_SUPPORT)
if (IPO_SUPPORT)
  message(STATUS "LTO support is enabled")
  set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)
endif()

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

# Convert input paths to CMake format (with forward slashes)
file(TO_CMAKE_PATH "${REACT_ANDROID_DIR}" REACT_ANDROID_DIR)
file(TO_CMAKE_PATH "${REACT_BUILD_DIR}" REACT_BUILD_DIR)
file(TO_CMAKE_PATH "${REACT_COMMON_DIR}" REACT_COMMON_DIR)

# If you have ccache installed, we're going to honor it.
find_program(CCACHE_FOUND ccache)
if(CCACHE_FOUND)
  set_property(GLOBAL PROPERTY RULE_LAUNCH_COMPILE ccache)
  set_property(GLOBAL PROPERTY RULE_LAUNCH_LINK ccache)
endif(CCACHE_FOUND)

function(add_react_android_subdir relative_path)
  add_subdirectory(${REACT_ANDROID_DIR}/${relative_path} ReactAndroid/${relative_path})
endfunction()

function(add_react_build_subdir relative_path)
  add_subdirectory(${REACT_BUILD_DIR}/${relative_path} build/${relative_path})
endfunction()

function(add_react_third_party_ndk_subdir relative_path)
  add_react_build_subdir(third-party-ndk/${relative_path})
endfunction()

function(add_react_common_subdir relative_path)
  add_subdirectory(${REACT_COMMON_DIR}/${relative_path} ReactCommon/${relative_path})
endfunction()

# Third-party prefabs
find_package(hermes-engine REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
add_library(fbjni ALIAS fbjni::fbjni)

# Third-party downloaded targets
add_react_third_party_ndk_subdir(glog)
add_react_third_party_ndk_subdir(boost)
add_react_third_party_ndk_subdir(double-conversion)
add_react_third_party_ndk_subdir(fast_float)
add_react_third_party_ndk_subdir(fmt)
add_react_third_party_ndk_subdir(folly)

# Common targets
add_react_common_subdir(yoga)
add_react_common_subdir(runtimeexecutor)
add_react_common_subdir(reactperflogger)
add_react_common_subdir(logger)
add_react_common_subdir(jsiexecutor)
add_react_common_subdir(jsitooling)
add_react_common_subdir(cxxreact)
add_react_common_subdir(jsi)
add_react_common_subdir(callinvoker)
add_react_common_subdir(oscompat)
add_react_common_subdir(jsinspector-modern)
add_react_common_subdir(jsinspector-modern/cdp)
add_react_common_subdir(jsinspector-modern/network)
add_react_common_subdir(jsinspector-modern/tracing)
add_react_common_subdir(hermes/executor)
add_react_common_subdir(hermes/inspector-modern)
add_react_common_subdir(react/cxxstableapi)
add_react_common_subdir(react/renderer/runtimescheduler)
add_react_common_subdir(react/debug)
add_react_common_subdir(react/featureflags)
add_react_common_subdir(react/performance/cdpmetrics)
add_react_common_subdir(react/performance/timeline)
add_react_common_subdir(react/renderer/animated)
add_react_common_subdir(react/renderer/animationbackend)
add_react_common_subdir(react/renderer/animations)
add_react_common_subdir(react/renderer/attributedstring)
add_react_common_subdir(react/renderer/componentregistry)
add_react_common_subdir(react/renderer/mounting)
add_react_common_subdir(react/renderer/scheduler)
add_react_common_subdir(react/renderer/telemetry)
add_react_common_subdir(react/renderer/viewtransition)
add_react_common_subdir(react/renderer/uimanager)
add_react_common_subdir(react/renderer/bridging)
add_react_common_subdir(react/renderer/core)
add_react_common_subdir(react/renderer/consistency)
add_react_common_subdir(react/renderer/css)
add_react_common_subdir(react/renderer/uimanager/consistency)
add_react_common_subdir(react/renderer/dom)
add_react_common_subdir(react/renderer/element)
add_react_common_subdir(react/renderer/debug)
add_react_common_subdir(react/renderer/graphics)
add_react_common_subdir(react/renderer/imagemanager)
add_react_common_subdir(react/renderer/components/view)
add_react_common_subdir(react/renderer/components/switch)
add_react_common_subdir(react/renderer/components/textinput)
add_react_common_subdir(react/renderer/components/progressbar)
add_react_common_subdir(react/renderer/components/root)
add_react_common_subdir(react/renderer/components/image)
add_react_common_subdir(react/renderer/components/legacyviewmanagerinterop)
add_react_common_subdir(react/renderer/componentregistry/native)
add_react_common_subdir(react/renderer/components/text)
add_react_common_subdir(react/renderer/components/unimplementedview)
add_react_common_subdir(react/renderer/components/modal)
add_react_common_subdir(react/renderer/components/scrollview)
add_react_common_subdir(react/renderer/components/safeareaview)
add_react_common_subdir(react/renderer/leakchecker)
add_react_common_subdir(react/renderer/observers/events)
add_react_common_subdir(react/renderer/observers/intersection)
add_react_common_subdir(react/renderer/observers/mutation)
add_react_common_subdir(react/renderer/textlayoutmanager)
add_react_common_subdir(react/utils)
add_react_common_subdir(react/bridging)
add_react_common_subdir(react/renderer/mapbuffer)
add_react_common_subdir(react/nativemodule/core)
add_react_common_subdir(react/nativemodule/defaults)
add_react_common_subdir(react/nativemodule/dom)
add_react_common_subdir(react/nativemodule/featureflags)
add_react_common_subdir(react/nativemodule/microtasks)
add_react_common_subdir(react/nativemodule/idlecallbacks)
add_react_common_subdir(react/nativemodule/intersectionobserver)
add_react_common_subdir(react/nativemodule/mutationobserver)
add_react_common_subdir(react/nativemodule/viewtransition)
add_react_common_subdir(react/nativemodule/webperformance)
add_react_common_subdir(react/networking)
add_react_common_subdir(jserrorhandler)
add_react_common_subdir(react/runtime)
add_react_common_subdir(react/runtime/hermes)
add_react_common_subdir(react/runtime/nativeviewconfig)
add_react_common_subdir(react/timing)

# ReactAndroid JNI targets
add_react_build_subdir(generated/source/codegen/jni)
add_react_android_subdir(src/main/jni/first-party/fbgloginit)
add_react_android_subdir(src/main/jni/first-party/yogajni)
add_react_android_subdir(src/main/jni/first-party/jni-lib-merge)
add_react_android_subdir(src/main/jni/react/jni)
add_react_android_subdir(src/main/jni/react/reactperflogger)
add_react_android_subdir(src/main/jni/react/turbomodule)
add_react_android_subdir(src/main/jni/react/uimanager)
add_react_android_subdir(src/main/jni/react/mapbuffer)
add_react_android_subdir(src/main/jni/react/reactnativeblob)
add_react_android_subdir(src/main/jni/react/fabric)
add_react_android_subdir(src/main/jni/react/featureflags)
add_react_android_subdir(src/main/jni/react/newarchdefaults)
add_react_android_subdir(src/main/jni/react/hermes/reactexecutor)
add_react_android_subdir(src/main/jni/react/hermes/tooling)
add_react_android_subdir(src/main/jni/react/hermes/instrumentation/)
add_react_android_subdir(src/main/jni/react/runtime/cxxreactpackage)
add_react_android_subdir(src/main/jni/react/runtime/jni)
add_react_android_subdir(src/main/jni/react/runtime/hermes/jni)
add_react_android_subdir(src/main/jni/react/tracing)
add_react_android_subdir(src/main/jni/react/devsupport)

# SoMerging Utils
include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)

# libreactnative.so Dependency
#
# The React Native Android Library (the .aar) should expose headers only via this target.
# This is needed in order to reduce the number of .so files that we ship in the final library
add_library(reactnative
        SHARED
          $<TARGET_OBJECTS:bridgeless>
          $<TARGET_OBJECTS:bridgelessnativeviewconfig>
          $<TARGET_OBJECTS:callinvokerholder>
          $<TARGET_OBJECTS:fabricjni>
          $<TARGET_OBJECTS:glog_init>
          $<TARGET_OBJECTS:jni_lib_merge_glue>
          $<TARGET_OBJECTS:jserrorhandler>
          $<TARGET_OBJECTS:jsinspector>
          $<TARGET_OBJECTS:jsitooling>
          $<TARGET_OBJECTS:jsinspector_cdp>
          $<TARGET_OBJECTS:jsinspector_network>
          $<TARGET_OBJECTS:jsinspector_tracing>
          $<TARGET_OBJECTS:jsireact>
          $<TARGET_OBJECTS:logger>
          $<TARGET_OBJECTS:mapbufferjni>
          $<TARGET_OBJECTS:oscompat>
          $<TARGET_OBJECTS:react_bridging>
          $<TARGET_OBJECTS:react_codegen_rncore>
          $<TARGET_OBJECTS:react_cxxreact>
          $<TARGET_OBJECTS:react_debug>
          $<TARGET_OBJECTS:react_devsupportjni>
          $<TARGET_OBJECTS:react_featureflags>
          $<TARGET_OBJECTS:react_featureflagsjni>
          $<TARGET_OBJECTS:react_nativemodule_core>
          $<TARGET_OBJECTS:react_nativemodule_defaults>
          $<TARGET_OBJECTS:react_nativemodule_dom>
          $<TARGET_OBJECTS:react_nativemodule_featureflags>
          $<TARGET_OBJECTS:react_nativemodule_idlecallbacks>
          $<TARGET_OBJECTS:react_nativemodule_intersectionobserver>
          $<TARGET_OBJECTS:react_nativemodule_microtasks>
          $<TARGET_OBJECTS:react_nativemodule_mutationobserver>
          $<TARGET_OBJECTS:react_nativemodule_viewtransition>
          $<TARGET_OBJECTS:react_nativemodule_webperformance>
          $<TARGET_OBJECTS:react_networking>
          $<TARGET_OBJECTS:react_newarchdefaults>
          $<TARGET_OBJECTS:react_performance_cdpmetrics>
          $<TARGET_OBJECTS:react_performance_timeline>
          $<TARGET_OBJECTS:react_renderer_animated>
          $<TARGET_OBJECTS:react_renderer_animationbackend>
          $<TARGET_OBJECTS:react_renderer_animations>
          $<TARGET_OBJECTS:react_renderer_attributedstring>
          $<TARGET_OBJECTS:react_renderer_componentregistry>
          $<TARGET_OBJECTS:react_renderer_consistency>
          $<TARGET_OBJECTS:react_renderer_core>
          $<TARGET_OBJECTS:react_renderer_debug>
          $<TARGET_OBJECTS:react_renderer_dom>
          $<TARGET_OBJECTS:react_renderer_element>
          $<TARGET_OBJECTS:react_renderer_graphics>
          $<TARGET_OBJECTS:react_renderer_imagemanager>
          $<TARGET_OBJECTS:react_renderer_leakchecker>
          $<TARGET_OBJECTS:react_renderer_mapbuffer>
          $<TARGET_OBJECTS:react_renderer_mounting>
          $<TARGET_OBJECTS:react_renderer_observers_events>
          $<TARGET_OBJECTS:react_renderer_observers_intersection>
          $<TARGET_OBJECTS:react_renderer_observers_mutation>
          $<TARGET_OBJECTS:react_renderer_runtimescheduler>
          $<TARGET_OBJECTS:react_renderer_scheduler>
          $<TARGET_OBJECTS:react_renderer_telemetry>
          $<TARGET_OBJECTS:react_renderer_textlayoutmanager>
          $<TARGET_OBJECTS:react_renderer_uimanager>
          $<TARGET_OBJECTS:react_renderer_uimanager_consistency>
          $<TARGET_OBJECTS:react_renderer_viewtransition>
          $<TARGET_OBJECTS:react_tracingjni>
          $<TARGET_OBJECTS:react_utils>
          $<TARGET_OBJECTS:reactnativeblob>
          $<TARGET_OBJECTS:reactnativejni>
          $<TARGET_OBJECTS:reactnativejni_common>
          $<TARGET_OBJECTS:reactperflogger>
          $<TARGET_OBJECTS:rninstance>
          $<TARGET_OBJECTS:rrc_image>
          $<TARGET_OBJECTS:rrc_legacyviewmanagerinterop>
          $<TARGET_OBJECTS:rrc_modal>
          $<TARGET_OBJECTS:rrc_native>
          $<TARGET_OBJECTS:rrc_progressbar>
          $<TARGET_OBJECTS:rrc_root>
          $<TARGET_OBJECTS:rrc_safeareaview>
          $<TARGET_OBJECTS:rrc_scrollview>
          $<TARGET_OBJECTS:rrc_switch>
          $<TARGET_OBJECTS:rrc_text>
          $<TARGET_OBJECTS:rrc_textinput>
          $<TARGET_OBJECTS:rrc_view>
          $<TARGET_OBJECTS:runtimeexecutor>
          $<TARGET_OBJECTS:turbomodulejsijni>
          $<TARGET_OBJECTS:uimanagerjni>
          $<TARGET_OBJECTS:yoga>
)
target_merge_so(reactnative)

target_link_libraries(reactnative
          PUBLIC
            android
            double-conversion
            fbjni
            folly_runtime
            glog
            jsi
            log
            yogacore
)

target_compile_reactnative_options(reactnative PRIVATE)

target_include_directories(reactnative
        PUBLIC
        $<TARGET_PROPERTY:bridgeless,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:bridgelessnativeviewconfig,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:callinvokerholder,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:fabricjni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:glog_init,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jserrorhandler,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jsinspector,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jsinspector_cdp,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jsinspector_network,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jsinspector_tracing,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:jsireact,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:mapbufferjni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_bridging,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_codegen_rncore,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_cxxreact,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_debug,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_devsupportjni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_featureflags,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_featureflagsjni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_core,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_defaults,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_dom,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_featureflags,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_idlecallbacks,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_intersectionobserver,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_microtasks,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_mutationobserver,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_viewtransition,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_nativemodule_webperformance,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_networking,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_newarchdefaults,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_performance_cdpmetrics,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_performance_timeline,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_animated,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_animationbackend,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_animations,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_attributedstring,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_componentregistry,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_componentregistry,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_consistency,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_core,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_css,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_debug,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_dom,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_element,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_graphics,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_imagemanager,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_leakchecker,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_mapbuffer,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_mounting,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_observers_events,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_observers_intersection,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_observers_mutation,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_runtimescheduler,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_scheduler,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_telemetry,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_textlayoutmanager,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_uimanager,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_uimanager_consistency,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_renderer_viewtransition,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_tracingjni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:react_utils,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:reactnativeblob,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:reactnativejni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:reactnativejni_common,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:reactperflogger,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rninstance,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_image,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_legacyviewmanagerinterop,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_modal,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_native,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_progressbar,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_root,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_safeareaview,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_scrollview,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_switch,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_text,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_textinput,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:rrc_view,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:runtimeexecutor,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:turbomodulejsijni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:uimanagerjni,INTERFACE_INCLUDE_DIRECTORIES>
        $<TARGET_PROPERTY:yoga,INTERFACE_INCLUDE_DIRECTORIES>
)

if(${CMAKE_BUILD_TYPE} MATCHES Debug OR REACT_NATIVE_DEBUG_OPTIMIZED)
  target_compile_options(reactnative PRIVATE
          -DREACT_NATIVE_DEBUGGER_ENABLED=1
          -DREACT_NATIVE_DEBUGGER_ENABLED_DEVONLY=1
  )
endif ()
