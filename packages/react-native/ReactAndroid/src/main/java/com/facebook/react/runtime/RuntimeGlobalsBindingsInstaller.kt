/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeMap

/**
 * Installs native values as JavaScript globals before the main bundle executes.
 *
 * Pass an instance as the host's [BindingsInstaller]. Each map key names a property on
 * `globalThis`. Values support the same types as [Arguments.makeNativeMap]: strings, booleans,
 * numbers, null, and nested maps and lists. Numbers are represented as JavaScript numbers.
 *
 * The values are copied when [create] is called and installed again for each new runtime, including
 * reloads. Writable properties with the same names are assigned the supplied values. Names must not
 * match non-writable globals defined by React Native or the JavaScript engine: assigning to them
 * throws during runtime initialization.
 */
@DoNotStripAny
public class RuntimeGlobalsBindingsInstaller private constructor(hybridData: HybridData) :
    BindingsInstaller(hybridData) {
  public companion object {
    @DoNotStrip
    @JvmStatic
    private external fun initHybrid(
        globals: NativeMap,
        bindingsInstaller: BindingsInstaller?,
    ): HybridData

    /**
     * @param globals Values to install, keyed by `globalThis` property name.
     * @param bindingsInstaller Optional installer that runs after the globals are installed.
     */
    @JvmStatic
    @JvmOverloads
    public fun create(
        globals: Map<String, Any?>,
        bindingsInstaller: BindingsInstaller? = null,
    ): RuntimeGlobalsBindingsInstaller =
        RuntimeGlobalsBindingsInstaller(
            initHybrid(Arguments.makeNativeMap(globals), bindingsInstaller),
        )
  }
}
