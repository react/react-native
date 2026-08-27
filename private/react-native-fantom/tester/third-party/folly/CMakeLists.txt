# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

SET(folly_FLAGS
        -DFOLLY_NO_CONFIG=1
        -DFOLLY_HAVE_CLOCK_GETTIME=1
        -DFOLLY_USE_LIBCPP=1
        -DFOLLY_CFG_NO_COROUTINES=1
        -DFOLLY_MOBILE=0
        -DFOLLY_HAVE_RECVMMSG=1
        -DFOLLY_HAVE_PTHREAD=1
        # If APP_PLATFORM in Application.mk targets android-23 above, please comment
        # the following line. NDK uses GNU style stderror_r() after API 23.
        -DFOLLY_HAVE_XSI_STRERROR_R=1
        )

##################
### folly_runtime ###
##################

SET(folly_runtime_SRC
        folly/Conv.cpp
        folly/Demangle.cpp
        folly/FileUtil.cpp
        folly/Format.cpp
        folly/ScopeGuard.cpp
        folly/SharedMutex.cpp
        folly/String.cpp
        folly/Unicode.cpp
        folly/concurrency/CacheLocality.cpp
        folly/container/detail/F14Table.cpp
        folly/detail/FileUtilDetail.cpp
        folly/detail/Futex.cpp
        folly/detail/SplitStringSimd.cpp
        folly/detail/UniqueInstance.cpp
        folly/hash/SpookyHashV2.cpp
        folly/io/IOBuf.cpp
        folly/json/dynamic.cpp
        folly/json/json_pointer.cpp
        folly/json/json.cpp
        folly/lang/CString.cpp
        folly/lang/Exception.cpp
        folly/lang/SafeAssert.cpp
        folly/lang/ToAscii.cpp
        folly/memory/SanitizeAddress.cpp
        folly/memory/detail/MallocImpl.cpp
        folly/net/NetOps.cpp
        folly/portability/SysUio.cpp
        folly/synchronization/SanitizeThread.cpp
        folly/synchronization/ParkingLot.cpp
        folly/system/AtFork.cpp
        folly/system/ThreadId.cpp
        folly/system/ThreadName.cpp)

add_library(folly_runtime STATIC ${folly_runtime_SRC})

target_compile_options(folly_runtime
        PRIVATE
        -fexceptions
        -fno-omit-frame-pointer
        -frtti
        -Wno-sign-compare
        ${folly_FLAGS})

target_compile_options(folly_runtime PUBLIC ${folly_FLAGS})

target_include_directories(folly_runtime PUBLIC .)
target_link_libraries(folly_runtime glog double-conversion boost fmt fast_float)
