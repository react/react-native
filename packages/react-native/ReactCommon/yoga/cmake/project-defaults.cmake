# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_VISIBILITY_PRESET hidden)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

add_compile_definitions($<$<CONFIG:DEBUG>:DEBUG>)

if(MSVC)

add_compile_options(
    # Don't omit frame pointers (e.g. for crash dumps)
    /Oy-
    # "Standard C++ exception handling" (C++ stack unwinding including extern c)
    /EHsc
    # Enable warnings and warnings as errors
    /W4
    /WX
    # Enable RTTI
    $<$<COMPILE_LANGUAGE:CXX>:/GR>
    # Use /O2 (Maximize Speed)
    $<$<CONFIG:RELEASE>:/O2>)

else()

add_compile_options(
    # Don't omit frame pointers (e.g. for crash dumps)
    -fno-omit-frame-pointer
    # Enable exception handling
    -fexceptions
    # Enable warnings and warnings as errors
    -Wall
    -Werror
    # Enable RTTI
    $<$<COMPILE_LANGUAGE:CXX>:-frtti>
    # Use -O2 (prioritize speed)
    $<$<CONFIG:RELEASE>:-O2>
    # Enable link-time-optimization if building in release
    $<$<CONFIG:RELEASE>:-flto>
    # Enable separate sections per function/data item
    $<$<CONFIG:RELEASE>:-ffunction-sections>
    $<$<CONFIG:RELEASE>:-fdata-sections>)

add_link_options(
    # Discard unused sections
    $<$<CONFIG:RELEASE>:$<$<CXX_COMPILER_ID:Clang,GNU>:-Wl,--gc-sections>>
    $<$<CONFIG:RELEASE>:$<$<CXX_COMPILER_ID:AppleClang>:-Wl,-dead_strip>>)

endif()
