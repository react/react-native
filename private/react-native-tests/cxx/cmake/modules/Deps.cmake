# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Helpers for pulling ReactCommon subsystems and their (Gradle-staged)
# third-party dependencies into the C++ test harness. These mirror the helpers
# used by the Fantom tester (private/react-native-fantom/tester) so the harness
# reuses the exact same, already-proven, desktop C++ build of ReactCommon.

file(TO_CMAKE_PATH "${REACT_COMMON_DIR}" REACT_COMMON_DIR)
file(TO_CMAKE_PATH "${REACT_THIRD_PARTY_NDK_DIR}" REACT_THIRD_PARTY_NDK_DIR)
file(TO_CMAKE_PATH "${RN_STAGED_THIRD_PARTY_DIR}" RN_STAGED_THIRD_PARTY_DIR)
file(TO_CMAKE_PATH "${RN_TESTER_THIRD_PARTY_SRC_DIR}" RN_TESTER_THIRD_PARTY_SRC_DIR)

# A ReactCommon subsystem (e.g. react/renderer/graphics) -> builds its library.
function(add_react_common_subdir relative_path)
  add_subdirectory(
    ${REACT_COMMON_DIR}/${relative_path}
    ReactCommon/${relative_path})
endfunction()

# Third-party deps prepared into ReactAndroid/build/third-party-ndk by Gradle
# (glog, double-conversion, fast_float, fmt).
function(add_react_third_party_ndk_subdir relative_path)
  add_subdirectory(
    ${REACT_THIRD_PARTY_NDK_DIR}/${relative_path}
    ${relative_path})
endfunction()

# Third-party deps staged (untarred + desktop CMakeLists copied in) into the
# Fantom tester's build/third-party by Gradle (folly, gflags).
function(add_staged_third_party_subdir relative_path)
  add_subdirectory(
    ${RN_STAGED_THIRD_PARTY_DIR}/${relative_path}
    ${relative_path})
endfunction()

# Third-party CMake wrappers that live in the Fantom tester source tree (boost).
function(add_tester_third_party_subdir relative_path)
  add_subdirectory(
    ${RN_TESTER_THIRD_PARTY_SRC_DIR}/${relative_path}
    ${relative_path})
endfunction()
