/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.instrumentation

import com.facebook.soloader.SoLoader
import com.facebook.soloader.annotation.SoLoaderLibrary

/** Hermes sampling profiler static JSI API. */
@SoLoaderLibrary("jsijniprofiler")
public object HermesSamplingProfiler {
  init {
    SoLoader.loadLibrary("jsijniprofiler")
  }

  /** Start sample profiling. */
  @JvmStatic public external fun enable()

  /** Stop sample profiling. */
  @JvmStatic public external fun disable()

  /**
   * Dump sampled stack traces to file.
   *
   * @param filename the file to dump sampling trace to.
   */
  @JvmStatic public external fun dumpSampledTraceToFile(filename: String)
}
