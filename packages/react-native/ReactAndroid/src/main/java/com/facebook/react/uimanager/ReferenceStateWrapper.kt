/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

internal interface ReferenceStateWrapper : StateWrapper {
  /** Returns state data backed by JNI reference. The underlying object should not be modified. */
  val stateDataReference: Any?
}
