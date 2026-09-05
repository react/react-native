# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Clang stamps a .pch with the time it was built, which makes it
# non-reproducible: ccache can never reuse one, and a PCH restored from the cache
# gets rejected as "modified since built" by the sources that consume it. Both
# the owner and the consumers need the flag, as it changes how the header is
# both written and read.
set(REACT_NATIVE_PCH_FLAGS "$<$<COMPILE_LANGUAGE:CXX>:-Xclang;-fno-pch-timestamp>")

add_library(reactnative_pch STATIC EXCLUDE_FROM_ALL
        ${CMAKE_CURRENT_LIST_DIR}/precompiled-header/pch-owner.cpp)

target_compile_reactnative_options(reactnative_pch PRIVATE)
set_target_properties(reactnative_pch PROPERTIES CXX_STANDARD 20 CXX_EXTENSIONS OFF)

target_link_libraries(reactnative_pch PRIVATE common_flags fbjni jsi reactnative)

target_compile_options(reactnative_pch PRIVATE ${REACT_NATIVE_PCH_FLAGS})
target_precompile_headers(reactnative_pch PRIVATE
        "$<$<COMPILE_LANGUAGE:CXX>:${CMAKE_CURRENT_LIST_DIR}/precompiled-header/pch.h>")

# Points `target` at the precompiled header owned by `reactnative_pch`. Targets
# that can't consume one - imported and interface libraries - are skipped, as
# are names that aren't targets at all: an autolinked library is allowed to skip
# itself when its source directory is missing.
function(target_reuse_reactnative_pch target)
        if (NOT TARGET ${target})
                return()
        endif ()

        get_target_property(is_imported ${target} IMPORTED)
        if (is_imported)
                return()
        endif ()

        get_target_property(target_type ${target} TYPE)
        if (target_type STREQUAL "INTERFACE_LIBRARY")
                return()
        endif ()

        # See the note on REACT_NATIVE_PCH_FLAGS above: the flag has to be on both
        # sides of the reuse.
        target_compile_options(${target} PRIVATE ${REACT_NATIVE_PCH_FLAGS})

        # clang rejects a precompiled header built with a different C++ dialect.
        set_target_properties(${target} PROPERTIES CXX_STANDARD 20 CXX_EXTENSIONS OFF)

        target_precompile_headers(${target} REUSE_FROM reactnative_pch)
endfunction()
