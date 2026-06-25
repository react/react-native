/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.soloader.annotation

/**
 * Stub annotation for open-source Gradle builds. The real implementation lives in
 * fbandroid/java/com/facebook/soloader/annotation/ and is used by the internal Buck build for
 * compile-time validation of native library merging.
 */
@Retention(AnnotationRetention.SOURCE)
@Target(AnnotationTarget.CLASS)
internal annotation class SoLoaderLibrary(vararg val value: String)
