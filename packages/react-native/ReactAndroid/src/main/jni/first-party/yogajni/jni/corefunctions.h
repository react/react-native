/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jni.h> // @manual=fbsource//xplat/yoga/lib/jni:jni
#include <cstddef>

namespace facebook::yoga::vanillajni {

/**
 * This method has to be called before using the vanillajni library. This method
 * is typically called when doing initialization in the "on load" JNI hook of a
 * particular library.
 *
 * This method is thread safe, and after the first time it's called it has no
 * initialization effect.
 *
 * @param  env use this output parameter to get a JNIEnv to use for things such
 * as registering native methods and such.
 * @param  vm  the VM instance passed by JNI. This is usually the VM instance
 * that is passed to the "on load" JNI hook.
 * @return an integer value to return from the "on load" hook.
 */
jint ensureInitialized(JNIEnv** env, JavaVM* vm);

/**
 * Returns a JNIEnv* suitable for the current thread. If the current thread is
 * not attached to the Java VM, this method aborts execution.
 */
JNIEnv* getCurrentEnv();

/**
 * Logs an error message and aborts the current process.
 */
void logErrorMessageAndDie(const char* message);

/**
 * Checks whether there is a pending JNI exception. If so, it logs an error
 * message and aborts the current process. Otherwise it does nothing.
 */
void assertNoPendingJniException(JNIEnv* env);

void assertNoPendingJniExceptionIf(JNIEnv* env, bool condition);

} // namespace facebook::yoga::vanillajni
