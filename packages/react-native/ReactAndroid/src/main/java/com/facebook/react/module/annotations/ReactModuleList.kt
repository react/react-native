/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.module.annotations

import com.facebook.react.bridge.NativeModule
import kotlin.reflect.KClass

/**
 * Annotates a function that returns a list of ModuleSpecs from which we get a list of NativeModules
 * to create ReactModuleInfos from.
 */
@Retention(AnnotationRetention.SOURCE)
@Target(AnnotationTarget.CLASS)
public annotation class ReactModuleList(
    /**
     * The Native modules in this list should be annotated with [ReactModule].
     *
     * @return List of Native modules in the package.
     */
    public val nativeModules: Array<KClass<out NativeModule>>,
)
