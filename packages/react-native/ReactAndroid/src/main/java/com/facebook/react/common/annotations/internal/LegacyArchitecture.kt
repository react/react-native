/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common.annotations.internal

/**
 * Annotation to mark classes or functions that are part of the legacy architecture.
 *
 * This annotation is used to indicate that the annotated class or function is part of the legacy
 * architecture. The `logLevel` parameter can be used to specify the level of logging that should be
 * applied when the annotated element is used.
 *
 * @property logLevel The logging level to be used for the annotated element. Defaults to
 *   `LegacyArchitectureLogLevel.WARNING`.
 */
@Retention(AnnotationRetention.SOURCE)
@Target(AnnotationTarget.CLASS, AnnotationTarget.FUNCTION)
public annotation class LegacyArchitecture(
    val logLevel: LegacyArchitectureLogLevel = LegacyArchitectureLogLevel.WARNING,
)
