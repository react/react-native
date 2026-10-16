/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// Forward declaration keeps this umbrella header independent of C++ header search paths.
#ifdef __cplusplus
using JSRuntimeFactoryRef = void *;
extern "C" {
#else
typedef void *JSRuntimeFactoryRef;
#endif

JSRuntimeFactoryRef jsrt_create_hermes_factory(void);

#ifdef __cplusplus
}
#endif
