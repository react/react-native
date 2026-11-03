/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Ambient web globals referenced by the public API that are not part of the
// "es2020" lib used by api-extractor. Declared here so that api-extractor
// resolves them as globals and leaves references to them untouched.
declare class AbortSignal {}
