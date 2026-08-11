/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "TraceSection.h"

// NOTE: This is here for a backwards compatibility and should be removed once
// all of the external references to `facebook::react::SystraceSection` are
// gone.
namespace facebook::react {

#if defined(WITH_LOOM_TRACE)
#define SystraceSection TraceSection
#else
struct [[deprecated("Use TraceSection")]] SystraceSection : public TraceSection{
  template <typename... ConvertsToStringPiece>
  explicit SystraceSection(const char* name, ConvertsToStringPiece&&... args) :
      TraceSection(name, args...){}
};
#endif

} // namespace facebook::react
