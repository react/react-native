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

/**
 * This is a special datasource that will use Perfetto to start/stop
 * a FuseboxTracer trace (which will be saved to disk, not to the Perfetto
 * trace) while we wait for Fusebox to be supported in release builds.
 * Once it's supported we'll probably want to deprecate this data source.
 */
class FuseboxPerfettoDataSource
    : public perfetto::DataSource<FuseboxPerfettoDataSource> {
 public:
  void OnSetup(const SetupArgs&) override {}

  void OnStart(const StartArgs&) override;

  void OnFlush(const FlushArgs&) override;

  void OnStop(const StopArgs& a) override;

  static void RegisterDataSource() {
    perfetto::DataSourceDescriptor dsd;
    dsd.set_name("com.facebook.react.fusebox.profiler");
    FuseboxPerfettoDataSource::Register(dsd);
  }

  constexpr static perfetto::BufferExhaustedPolicy kBufferExhaustedPolicy =
      perfetto::BufferExhaustedPolicy::kStall;
};

} // namespace facebook::react

PERFETTO_DECLARE_DATA_SOURCE_STATIC_MEMBERS(
    facebook::react::FuseboxPerfettoDataSource);

#endif // WITH_PERFETTO
