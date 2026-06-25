#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

PLATFORM_NAME="${PLATFORM_NAME:-iphoneos}"
CURRENT_ARCH="${CURRENT_ARCH}"

if [ -z "$CURRENT_ARCH" ] || [ "$CURRENT_ARCH" == "undefined_arch" ]; then
    # Xcode 10 beta sets CURRENT_ARCH to "undefined_arch", this leads to incorrect linker arg.
    # it's better to rely on platform name as fallback because architecture differs between simulator and device

    if [[ "$PLATFORM_NAME" == *"simulator"* ]]; then
        if [[ "$(uname -m)" == "arm64" ]]; then
            # Apple Silicon Mac -> arm64 simulator
            CURRENT_ARCH="arm64"
        else
            CURRENT_ARCH="x86_64"
        fi
    else
        CURRENT_ARCH="arm64"
    fi
fi

# @lint-ignore-every TXT2 Tab Literal
if [ "$CURRENT_ARCH" == "arm64" ]; then
    cat <<\EOF >>fix_glog_0.3.5_apple_silicon.patch
diff --git a/config.sub b/config.sub
index 1761d8b..43fa2e8 100755
--- a/config.sub
+++ b/config.sub
@@ -1096,6 +1096,9 @@ case $basic_machine in
 		basic_machine=z8k-unknown
 		os=-sim
 		;;
+	arm64-*)
+		basic_machine=$(echo $basic_machine | sed 's/arm64/aarch64/')
+		;;
 	none)
 		basic_machine=none-none
 		os=-none
EOF

    patch -p1 config.sub fix_glog_0.3.5_apple_silicon.patch
fi

XCRUN="$(which xcrun || true)"
if [ -n "$XCRUN" ]; then
  export CC="$(xcrun -find -sdk $PLATFORM_NAME cc) -arch $CURRENT_ARCH -isysroot $(xcrun -sdk $PLATFORM_NAME --show-sdk-path)"
  export CXX="$CC"
else
  export CC="$CC:-$(which gcc)"
  export CXX="$CXX:-$(which g++ || true)"
fi
export CXX="$CXX:-$CC"

# Remove automake symlink if it exists
if [ -h "test-driver" ]; then
    rm test-driver
fi

# Manually disable gflags include to fix issue https://github.com/facebook/react-native/issues/28446
sed -i.bak -e 's/\@ac_cv_have_libgflags\@/0/' src/glog/logging.h.in && rm src/glog/logging.h.in.bak
sed -i.bak -e 's/HAVE_LIB_GFLAGS/HAVE_LIB_GFLAGS_DISABLED/' src/config.h.in && rm src/config.h.in.bak

./configure --host arm-apple-darwin || true

cat << EOF >> src/config.h
/* Add in so we have Apple Target Conditionals */
#ifdef __APPLE__
#include <TargetConditionals.h>
#include <Availability.h>
#endif

/* Special configuration for AppleTVOS */
#if TARGET_OS_TV
#undef HAVE_SYSCALL_H
#undef HAVE_SYS_SYSCALL_H
#undef OS_MACOSX
/* NO_THREADS needed right now for Xcode 16 */
#define NO_THREADS
#endif

/* Special configuration for ucontext */
#undef HAVE_UCONTEXT_H
#undef PC_FROM_UCONTEXT
#if defined(__x86_64__)
#define PC_FROM_UCONTEXT uc_mcontext->__ss.__rip
#elif defined(__i386__)
#define PC_FROM_UCONTEXT uc_mcontext->__ss.__eip
#endif
EOF

# Prepare exported header include
EXPORTED_INCLUDE_DIR="exported/glog"
mkdir -p exported/glog
cp -f src/glog/log_severity.h "$EXPORTED_INCLUDE_DIR/"
cp -f src/glog/logging.h "$EXPORTED_INCLUDE_DIR/"
cp -f src/glog/raw_logging.h "$EXPORTED_INCLUDE_DIR/"
cp -f src/glog/stl_logging.h "$EXPORTED_INCLUDE_DIR/"
cp -f src/glog/vlog_is_on.h "$EXPORTED_INCLUDE_DIR/"


# Create a custom module.modulemap that works with Swift C++ interop
# The issue is that glog headers include other headers inside namespace blocks
# which Clang treats as module imports inside namespaces (which is illegal)
# Solution: Use textual headers to prevent submodule creation
cat > src/glog/module.modulemap << 'MODULEMAP'
module glog {
     // Use textual headers to avoid submodule generation
     // This prevents the "import within namespace" error with Swift C++ interop
     textual header "log_severity.h"
     textual header "logging.h"
     textual header "raw_logging.h"
     textual header "stl_logging.h"
     textual header "vlog_is_on.h"
     export *
}
MODULEMAP
