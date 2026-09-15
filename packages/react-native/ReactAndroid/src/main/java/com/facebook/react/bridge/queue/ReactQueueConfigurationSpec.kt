/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge.queue

import com.facebook.react.bridge.queue.MessageQueueThreadSpec.Companion.newBackgroundThreadSpec

/**
 * Spec for creating a ReactQueueConfiguration. This exists so that CatalystInstance is able to set
 * Exception handlers on the MessageQueueThreads it uses and it would not be super clean if the
 * threads were configured, then passed to CatalystInstance where they are configured more. These
 * specs allows the Threads to be created fully configured.
 */
public class ReactQueueConfigurationSpec
public constructor(
    public val nativeModulesQueueThreadSpec: MessageQueueThreadSpec,
    public val jSQueueThreadSpec: MessageQueueThreadSpec,
) {
  public class Builder public constructor() {
    private var nativeModulesQueueSpec: MessageQueueThreadSpec? = null
    private var jsQueueSpec: MessageQueueThreadSpec? = null

    public fun setNativeModulesQueueThreadSpec(spec: MessageQueueThreadSpec?): Builder {
      check(nativeModulesQueueSpec == null) { "Setting native modules queue spec multiple times!" }
      nativeModulesQueueSpec = spec
      return this
    }

    public fun setJSQueueThreadSpec(spec: MessageQueueThreadSpec?): Builder {
      check(jsQueueSpec == null) { "Setting JS queue multiple times!" }
      jsQueueSpec = spec
      return this
    }

    public fun build(): ReactQueueConfigurationSpec =
        ReactQueueConfigurationSpec(checkNotNull(nativeModulesQueueSpec), checkNotNull(jsQueueSpec))
  }

  public companion object {
    public fun builder(): Builder = Builder()

    @JvmStatic
    public fun createDefault(): ReactQueueConfigurationSpec =
        ReactQueueConfigurationSpec(
            newBackgroundThreadSpec("native_modules"),
            newBackgroundThreadSpec("js"),
        )
  }
}
