# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set(BUILD_TESTING OFF)
set(BUILD_SHARED_LIBS OFF)
add_subdirectory(
  "${FANTOM_THIRD_PARTY_DIR}/boringssl"
  "${CMAKE_CURRENT_BINARY_DIR}/boringssl"
  EXCLUDE_FROM_ALL
)
add_library(OpenSSL::Crypto ALIAS crypto)
