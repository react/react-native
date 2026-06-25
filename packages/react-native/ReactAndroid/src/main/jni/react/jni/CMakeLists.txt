# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)


file(GLOB reactnativejni_common_SRC CONFIGURE_DEPENDS *.cpp)

#############################
### reactnativejni_common ###
#############################

# This library contains the code from reactnativejni that is used by both old and new
# arch so it can be built in a separate library.

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)

add_library(
        reactnativejni_common
        OBJECT
          JDynamicNative.cpp
          JReactMarker.cpp
          NativeArray.cpp
          NativeCommon.cpp
          NativeMap.cpp
          OnLoad-common.cpp
          ReadableNativeArray.cpp
          ReadableNativeMap.cpp
          TransformHelper.cpp
          WritableNativeArray.cpp
          WritableNativeMap.cpp
)
target_merge_so(reactnativejni_common)
target_include_directories(reactnativejni_common PUBLIC ../../)

target_link_libraries(reactnativejni_common fbjni folly_runtime react_cxxreact rrc_view)
target_compile_reactnative_options(reactnativejni_common PRIVATE)
target_compile_options(reactnativejni_common PRIVATE -Wno-unused-lambda-capture)

######################
### reactnativejni ###
######################

include(${REACT_ANDROID_DIR}/src/main/jni/first-party/jni-lib-merge/SoMerging-utils.cmake)

add_library(
        reactnativejni
        OBJECT
          InspectorNetworkRequestListener.cpp
          JExecutor.cpp
          JMessageQueueThread.cpp
          JReactSoftExceptionLogger.cpp
          JRuntimeExecutor.cpp
          JRuntimeScheduler.cpp
          JSLoader.cpp
          JSLogging.cpp
          JavaModuleWrapper.cpp
          JniJSModulesUnbundle.cpp
          MethodInvoker.cpp
          ModuleRegistryBuilder.cpp
          OnLoad.cpp
        SafeReleaseJniRef.cpp
)
target_merge_so(reactnativejni)

# TODO This should not be ../../
target_include_directories(reactnativejni PUBLIC ../../)

target_link_libraries(reactnativejni
        android
        callinvokerholder
        fbjni
        folly_runtime
        glog_init
        logger
        react_cxxreact
        react_renderer_runtimescheduler
        reactnativejni_common
        runtimeexecutor
        yoga
        )
target_compile_reactnative_options(reactnativejni PRIVATE)
target_compile_options(reactnativejni PRIVATE -Wno-unused-lambda-capture)
