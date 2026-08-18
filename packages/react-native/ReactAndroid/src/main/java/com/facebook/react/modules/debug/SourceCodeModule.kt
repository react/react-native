/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.debug

import com.facebook.fbreact.specs.NativeSourceCodeSpec
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

/**
 * Module that exposes the URL to the source code map (used for exception stack trace parsing) to JS
 */
@ReactModule(name = NativeSourceCodeSpec.NAME)
public class SourceCodeModule(reactContext: ReactApplicationContext) :
    NativeSourceCodeSpec(reactContext) {
  protected override fun getTypedExportedConstants(): Map<String, Any> = mapOf(
      "scriptURL" to
          Assertions.assertNotNull<String>(
              reactApplicationContext.getSourceURL(),
              "No source URL loaded, have you initialised the instance?",
          ),
  )

  public companion object {
    public const val NAME: String = NativeSourceCodeSpec.NAME
  }
}
