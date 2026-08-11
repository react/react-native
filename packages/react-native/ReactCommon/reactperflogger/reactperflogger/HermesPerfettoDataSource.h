/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef WITH_PERFETTO

#include <perfetto.h>

namespace facebook::react {

class HermesPerfettoDataSource
    : public perfetto::DataSource<HermesPerfettoDataSource> {
 public:
  void OnSetup(const SetupArgs&) override {}

  void OnStart(const StartArgs&) override;

  void OnFlush(const FlushArgs&) override;

  void OnStop(const StopArgs& a) override;

  static void RegisterDataSource() {
    perfetto::DataSourceDescriptor dsd;
    dsd.set_name("com.facebook.hermes.profiler");
    HermesPerfettoDataSource::Register(dsd);
  }

  constexpr static perfetto::BufferExhaustedPolicy kBufferExhaustedPolicy =
      perfetto::BufferExhaustedPolicy::kStall;
};

} // namespace facebook::react

PERFETTO_DECLARE_DATA_SOURCE_STATIC_MEMBERS(
    facebook::react::HermesPerfettoDataSource);

#endif // WITH_PERFETTO
