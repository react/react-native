/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

internal enum class DebuggerFrontendPanelName(val internalName: String) {
  CONSOLE("console"),
  MEMORY("heap-profiler"),
  NETWORK("network"),
  PERFORMANCE("timeline"),
  REACT_COMPONENTS("react-devtools-components"),
  REACT_PROFILER("react-devtools-profiler"),
  SOURCES("sources"),
  WELCOME("rn-welcome");

  override fun toString(): String = internalName
}
