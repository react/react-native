/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Anchor translation unit for the `react/cxxstableapi` pod.
//
// The guards in this module are pure preprocessor headers, so the pod would
// otherwise ship no compilable source. CocoaPods emits a PBXAggregateTarget for
// a pod with no compilable sources, and an aggregate target produces no
// `.framework` under `use_frameworks!` — dependents are then unable to resolve
// the guard headers. Giving the pod a single source file forces CocoaPods to
// emit a real framework target instead.
//
// This file intentionally declares nothing: `react/cxxstableapi` has no runtime
// API, only preprocessor guards. Do not add code here.
