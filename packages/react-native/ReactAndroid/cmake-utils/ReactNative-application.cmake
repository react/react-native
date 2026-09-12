# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This CMake file takes care of creating everything you need to build and link
# your C++ source code in a React Native Application for Android.
# You just need to call `project(<my_project_name>)` and import this file.
# Specifically this file will:
# - Take care of creating a shared library called as your project
# - Take care of setting the correct compile options
# - Include all the pre-built libraries in your build graph
# - Link your library against those prebuilt libraries so you can access JSI, Fabric, etc.
# - Link your library against any autolinked library.
# - Make sure ccache is used as part of the compilation process, if you have it installed.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

include(${CMAKE_CURRENT_LIST_DIR}/folly-flags.cmake)

# We configured the REACT_COMMON_DIR variable as it's commonly used to reference
# shared C++ code in other targets.
set(REACT_COMMON_DIR ${REACT_ANDROID_DIR}/../ReactCommon)
include(${REACT_COMMON_DIR}/cmake-utils/react-native-flags.cmake)

# If you have ccache installed, we're going to honor it.
find_program(CCACHE_FOUND ccache)
if(CCACHE_FOUND)
  set_property(GLOBAL PROPERTY RULE_LAUNCH_COMPILE ccache)
  set_property(GLOBAL PROPERTY RULE_LAUNCH_LINK ccache)
endif(CCACHE_FOUND)

# If the user toolchain supports IPO, we enable it for the app build
include(CheckIPOSupported)
check_ipo_supported(RESULT IPO_SUPPORT)
if (IPO_SUPPORT)
  set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)
endif()

set(BUILD_DIR ${PROJECT_BUILD_DIR})
file(TO_CMAKE_PATH "${BUILD_DIR}" BUILD_DIR)
file(TO_CMAKE_PATH "${REACT_ANDROID_DIR}" REACT_ANDROID_DIR)

if (PROJECT_ROOT_DIR)
# This empty `if` is just to silence a CMake warning and make sure the `PROJECT_ROOT_DIR`
# variable is defined if user need to access it.
endif ()

file(GLOB override_cpp_SRC CONFIGURE_DEPENDS *.cpp)
# We check if the user is providing a custom OnLoad.cpp file. If so, we pick that
# for compilation. Otherwise we fallback to using the `default-app-setup/OnLoad.cpp` 
# file instead.
if(override_cpp_SRC)
        file(GLOB input_SRC CONFIGURE_DEPENDS
                *.cpp
                ${BUILD_DIR}/generated/autolinking/src/main/jni/*.cpp)
else()
        file(GLOB input_SRC CONFIGURE_DEPENDS
                ${REACT_ANDROID_DIR}/cmake-utils/default-app-setup/*.cpp
                ${BUILD_DIR}/generated/autolinking/src/main/jni/*.cpp)
endif()

add_library(${CMAKE_PROJECT_NAME} SHARED ${input_SRC})

target_include_directories(${CMAKE_PROJECT_NAME}
        PUBLIC
                ${CMAKE_CURRENT_SOURCE_DIR}
                ${PROJECT_BUILD_DIR}/generated/autolinking/src/main/jni)

target_compile_reactnative_options(${CMAKE_PROJECT_NAME} PRIVATE)

# Prefab packages from React Native
find_package(ReactAndroid REQUIRED CONFIG)
add_library(jsi ALIAS ReactAndroid::jsi)
add_library(reactnative ALIAS ReactAndroid::reactnative)

find_package(fbjni REQUIRED CONFIG)
add_library(fbjni ALIAS fbjni::fbjni)

target_link_libraries(${CMAKE_PROJECT_NAME}
        fbjni                               # via 3rd party prefab
        jsi                                 # prefab ready
        reactnative                         # prefab ready
)

# We use an interface target to propagate flags to all the generated targets
# such as the folly flags or others.
add_library(common_flags INTERFACE)
target_compile_options(common_flags INTERFACE ${folly_FLAGS})

# Defines the `reactnative_pch` target and `target_reuse_reactnative_pch()`, so
# the codegen targets below share a single precompiled header. Has to come after
# `common_flags`, as the precompiled header is built with the same flags as its
# consumers.
include(${CMAKE_CURRENT_LIST_DIR}/ReactNative-precompiled-header.cmake)

# If project is on RN CLI v9, then we can use the following lines to link against the autolinked 3rd party libraries.
if(EXISTS ${PROJECT_BUILD_DIR}/generated/autolinking/src/main/jni/Android-autolinking.cmake)
        include(${PROJECT_BUILD_DIR}/generated/autolinking/src/main/jni/Android-autolinking.cmake)
        target_link_libraries(${CMAKE_PROJECT_NAME} ${AUTOLINKED_LIBRARIES})
        foreach(autolinked_library ${AUTOLINKED_LIBRARIES})
            target_link_libraries(${autolinked_library} common_flags)
            target_reuse_reactnative_pch(${autolinked_library})
        endforeach()
endif()

# If project is running codegen at the app level, we want to link and build the generated library.
if(EXISTS ${PROJECT_BUILD_DIR}/generated/source/codegen/jni/CMakeLists.txt)
        add_subdirectory(${PROJECT_BUILD_DIR}/generated/source/codegen/jni/ codegen_app_build)
        get_property(APP_CODEGEN_TARGET DIRECTORY ${PROJECT_BUILD_DIR}/generated/source/codegen/jni/ PROPERTY BUILDSYSTEM_TARGETS)
        target_link_libraries(${CMAKE_PROJECT_NAME} ${APP_CODEGEN_TARGET})
        target_link_libraries(${APP_CODEGEN_TARGET} common_flags)
        target_reuse_reactnative_pch(${APP_CODEGEN_TARGET})

        # We need to pass the generated header and module provider to the OnLoad.cpp file so
        # local app modules can properly be linked.
        string(REGEX REPLACE "react_codegen_" "" APP_CODEGEN_HEADER "${APP_CODEGEN_TARGET}")
        target_compile_options(${CMAKE_PROJECT_NAME}
                PRIVATE
                -DREACT_NATIVE_APP_CODEGEN_HEADER="${APP_CODEGEN_HEADER}.h"
                -DREACT_NATIVE_APP_COMPONENT_DESCRIPTORS_HEADER="react/renderer/components/${APP_CODEGEN_HEADER}/ComponentDescriptors.h"
                -DREACT_NATIVE_APP_COMPONENT_REGISTRATION=${APP_CODEGEN_HEADER}_registerComponentDescriptorsFromCodegen
                -DREACT_NATIVE_APP_MODULE_PROVIDER=${APP_CODEGEN_HEADER}_ModuleProvider
        )
endif()

# We set REACTNATIVE_MERGED_SO so libraries/apps can selectively decide to depend on either libreactnative.so
# or link against a old prefab target (this is needed for React Native 0.76 on).
set(REACTNATIVE_MERGED_SO true)
