# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Builds the C++ unit tests in ReactCommon/**/tests against the libraries the
# Fantom tester already compiles, one GoogleTest executable per tests
# directory. Run them with ctest from this directory's build directory.

cmake_minimum_required(VERSION 3.13)

enable_testing()
include(GoogleTest)

set(INSTALL_GTEST OFF CACHE BOOL "" FORCE)
add_subdirectory(${FANTOM_THIRD_PARTY_DIR}/googletest googletest EXCLUDE_FROM_ALL)

add_react_common_subdir(react/networking)
add_react_common_subdir(react/renderer/animations)
add_react_common_subdir(react/renderer/element)

# rrc_textinput compiles the Android platform sources, which need the Android
# text layout; the tests only use the cross-platform base.
file(GLOB react_common_tests_textinput_SRC CONFIGURE_DEPENDS
  ${REACT_COMMON_DIR}/react/renderer/components/textinput/*.cpp)
add_library(react_common_tests_textinput OBJECT ${react_common_tests_textinput_SRC})
target_link_libraries(react_common_tests_textinput
  PUBLIC
    react_renderer_attributedstring
    react_renderer_core
    rrc_text
    rrc_view)
target_compile_reactnative_options(react_common_tests_textinput PRIVATE)

# The folly executors some tests use, and what they pull in, which
# folly_runtime leaves out.
set(folly_DIR ${FANTOM_THIRD_PARTY_DIR}/folly/folly)
add_library(react_common_tests_folly STATIC
  ${folly_DIR}/ExceptionString.cpp
  ${folly_DIR}/Executor.cpp
  ${folly_DIR}/SingletonThreadLocal.cpp
  ${folly_DIR}/concurrency/ProcessLocalUniqueId.cpp
  ${folly_DIR}/detail/MemoryIdler.cpp
  ${folly_DIR}/detail/StaticSingletonManager.cpp
  ${folly_DIR}/detail/ThreadLocalDetail.cpp
  ${folly_DIR}/detail/thread_local_globals.cpp
  ${folly_DIR}/executors/ManualExecutor.cpp
  ${folly_DIR}/executors/QueuedImmediateExecutor.cpp
  ${folly_DIR}/io/async/Request.cpp
  ${folly_DIR}/memory/MallctlHelper.cpp
  ${folly_DIR}/memory/ReentrantAllocator.cpp
  ${folly_DIR}/portability/SysMembarrier.cpp
  ${folly_DIR}/synchronization/AsymmetricThreadFence.cpp
  ${folly_DIR}/synchronization/Hazptr.cpp
  ${folly_DIR}/synchronization/HazptrDomain.cpp
  ${folly_DIR}/system/Pid.cpp)
target_compile_options(react_common_tests_folly PRIVATE -fexceptions -frtti)
target_link_libraries(react_common_tests_folly PUBLIC folly_runtime)

# Test headers are included by the paths Buck exports them under.
set(react_common_tests_INCLUDE_DIR ${CMAKE_CURRENT_BINARY_DIR}/include)
configure_file(
  ${REACT_COMMON_DIR}/callinvoker/ReactCommon/tests/TestCallInvoker.h
  ${react_common_tests_INCLUDE_DIR}/ReactCommon/TestCallInvoker.h
  COPYONLY)

get_target_property(react_common_tests_LIBS fantom_tester LINK_LIBRARIES)

file(GLOB_RECURSE react_common_tests_SRC CONFIGURE_DEPENDS ${REACT_COMMON_DIR}/*.cpp)
list(FILTER react_common_tests_SRC INCLUDE REGEX "/tests/")
list(FILTER react_common_tests_SRC EXCLUDE REGEX "/benchmarks/")

set(react_common_tests_DIRS)
foreach(source ${react_common_tests_SRC})
  string(REGEX REPLACE "^(.*/tests)/.*$" "\\1" test_dir ${source})
  list(APPEND react_common_tests_DIRS ${test_dir})
endforeach()
list(REMOVE_DUPLICATES react_common_tests_DIRS)
list(SORT react_common_tests_DIRS)

set(react_common_tests_TARGETS)
foreach(test_dir ${react_common_tests_DIRS})
  file(RELATIVE_PATH test_name ${REACT_COMMON_DIR} ${test_dir})
  string(MAKE_C_IDENTIFIER ${test_name} test_target)

  set(test_dir_SRC ${react_common_tests_SRC})
  list(FILTER test_dir_SRC INCLUDE REGEX "^${test_dir}/")

  add_executable(${test_target} EXCLUDE_FROM_ALL ${test_dir_SRC})
  # Header-only ReactCommon libraries export -Werror -Wpedantic, and source
  # options are the only ones placed after them on the command line.
  set_source_files_properties(${test_dir_SRC} PROPERTIES COMPILE_OPTIONS -Wno-error)
  target_include_directories(${test_target}
    PRIVATE
      ${react_common_tests_INCLUDE_DIR}
      ${test_dir}
      ${test_dir}/..)
  target_link_libraries(${test_target}
    PRIVATE
      ${react_common_tests_LIBS}
      react_common_tests_folly
      react_common_tests_textinput
      react_networking
      react_renderer_animations
      react_renderer_element
      GTest::gmock_main)
  target_compile_options(${test_target}
    PRIVATE
      -fexceptions
      -frtti
      -std=c++20)

  # One process per test case: some suites leave global state behind, such as
  # registered HostTargets in jsinspector-modern, that later suites trip over.
  gtest_discover_tests(${test_target}
    TEST_PREFIX ${test_name}/
    NO_PRETTY_TYPES
    NO_PRETTY_VALUES
    DISCOVERY_MODE PRE_TEST)
  list(APPEND react_common_tests_TARGETS ${test_target})
endforeach()

add_custom_target(react_common_tests)
add_dependencies(react_common_tests ${react_common_tests_TARGETS})
