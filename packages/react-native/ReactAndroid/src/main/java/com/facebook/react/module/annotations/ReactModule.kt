/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.module.annotations

/**
 * Annotation for use on [com.facebook.react.bridge.BaseJavaModule]s to describe properties for that
 * module.
 */
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.CLASS)
public annotation class ReactModule(
    /** Name used to `require()` this module from JavaScript. */
    public val name: String,
    /**
     * True if you intend to override some other native module that was registered e.g. as part of a
     * different package (such as the core one). Trying to override without returning true from this
     * method is considered an error and will throw an exception during initialization. By default
     * all modules return false.
     */
    public val canOverrideExistingModule: Boolean = false,
    /** Whether this module needs to be loaded immediately. */
    public val needsEagerInit: Boolean = false,
    /**
     * Whether this module has constants to add, defaults to true as that is safer for when a
     * correct annotation is not included
     */
    @get:Deprecated(
        """This property is unused and it's planning to be removed in a future version of
        React Native. Please refrain from using it.""",
    )
    public val hasConstants: Boolean = true,
    /**
     * Indicates if a module is a C++ module or a Java Module
     *
     * @return
     */
    public val isCxxModule: Boolean = false,
)
