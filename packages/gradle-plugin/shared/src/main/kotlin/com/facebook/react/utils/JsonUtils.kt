/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.model.ModelAutolinkingConfigJson
import com.facebook.react.model.ModelPackageJson
import com.google.gson.Gson
import java.io.File

object JsonUtils {
  private val gsonConverter = Gson()

  fun fromPackageJson(input: File): ModelPackageJson? =
      input.bufferedReader().use {
        runCatching { gsonConverter.fromJson(it, ModelPackageJson::class.java) }.getOrNull()
      }

  fun fromAutolinkingConfigJson(input: File): ModelAutolinkingConfigJson? =
      input.bufferedReader().use { reader ->
        runCatching {
              // We sanitize the output of the `config` command as it could contain debug logs
              // such as:
              //
              // > AwesomeProject@0.0.1 npx
              // > rnc-cli config
              //
              // which will render the JSON invalid.
              val content =
                  reader
                      .readLines()
                      .filterNot { line -> line.startsWith(">") }
                      .joinToString("\n")
                      .trim()
              gsonConverter.fromJson(content, ModelAutolinkingConfigJson::class.java)
            }
            .getOrNull()
      }
}
