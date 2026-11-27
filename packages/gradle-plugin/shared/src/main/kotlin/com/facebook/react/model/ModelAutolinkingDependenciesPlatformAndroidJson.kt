/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.model

data class ModelAutolinkingDependenciesPlatformAndroidJson(
    val sourceDir: String,
    val packageImportPath: String,
    val packageImportPaths: List<String>? = null,
    val packageInstance: String,
    val buildTypes: List<String>,
    val libraryName: String? = null,
    val componentDescriptors: List<String> = emptyList(),
    val cmakeListsPath: String? = null,
    val cxxModuleCMakeListsModuleName: String? = null,
    val cxxModuleCMakeListsPath: String? = null,
    val cxxModuleHeaderName: String? = null,
    val dependencyConfiguration: String? = null,
    val isPureCxxDependency: Boolean? = null,
)
