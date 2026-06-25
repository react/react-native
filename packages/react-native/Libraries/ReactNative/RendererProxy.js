/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// This module allows app bundles to set up the appropriate Fabric renderer
// variant (e.g., profiling vs production) before React Native is initialized.
// The internal implementation (RendererProxy.fb.js) provides the indirection
// needed to swap the renderer implementation at runtime.
export * from './RendererImplementation';
