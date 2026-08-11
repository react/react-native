/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus
extern "C" {
#endif

/**
 JSRuntimeFactory pointer representation in C.
 */
typedef void* JSRuntimeFactoryRef;

/**
 Function used to destroy instance of JSRuntimeFactory.
 */
void js_runtime_factory_destroy(JSRuntimeFactoryRef factory);

#ifdef __cplusplus
}
#endif
