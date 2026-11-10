# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)

# Define the application dynamic library name here.
project(appmodules)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

add_subdirectory(${REACT_COMMON_DIR}/react/nativemodule/samples/platform/android/ sampleturbomodule_build)
add_subdirectory(${REACT_COMMON_DIR}/../../rn-tester/NativeCxxModuleExample/ nativecxxmoduleexample_build)
add_subdirectory(${REACT_COMMON_DIR}/../../rn-tester/NodeApiExample/ nodeapiexample_build)

# RN Tester needs to link against the sample turbomobule
target_link_libraries(${CMAKE_PROJECT_NAME}
        sampleturbomodule)
# RN Tester needs to link against the NativeCxxModuleExample
target_link_libraries(${CMAKE_PROJECT_NAME}
        nativecxxmoduleexample)
