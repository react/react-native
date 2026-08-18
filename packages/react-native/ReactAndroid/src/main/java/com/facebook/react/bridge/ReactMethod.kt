/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

/**
 * Annotation which is used to mark methods that are exposed to React Native.
 *
 * This applies to derived classes of [BaseJavaModule], which will generate a list of exported
 * methods by searching for those which are annotated with this annotation and adding a JS callback
 * for each.
 */
@Retention(AnnotationRetention.RUNTIME)
public annotation class ReactMethod(
    /**
     * Whether the method can be called from JS synchronously **on the JS thread**, possibly
     * returning a result.
     *
     * WARNING: in the vast majority of cases, you should leave this to false which allows your
     * native module methods to be called asynchronously: calling methods synchronously can have
     * strong performance penalties and introduce threading-related bugs to your native modules.
     *
     * In order to support remote debugging, both the method args and return type must be
     * serializable to JSON: this means that we only support the same args as [ReactMethod], and the
     * hook can only be void or return JSON values (e.g. bool, number, String, [ ], or
     * [WritableArray]). Calling these methods when running under the websocket executor is
     * currently not supported.
     */
    public val isBlockingSynchronousMethod: Boolean = false,
)
