# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

# Loaded at runtime with `dlopen` from react-native/node-api, so it's not
# linked into the app.
add_library(nodeapiexample SHARED addon.c)

# TODO: Link node-api::node-api once Hermes ships it, instead of hermesvm.
find_package(hermes-engine REQUIRED CONFIG)
get_target_property(hermes_include_dirs hermes-engine::hermesvm INTERFACE_INCLUDE_DIRECTORIES)
list(TRANSFORM hermes_include_dirs APPEND /hermes/napi)
target_include_directories(nodeapiexample PRIVATE ${hermes_include_dirs})
target_link_libraries(nodeapiexample hermes-engine::hermesvm)
target_compile_options(nodeapiexample PRIVATE -Wall -Werror)
