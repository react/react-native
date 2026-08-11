/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <react/renderer/telemetry/TransactionTelemetry.h>
#include <react/utils/Telemetry.h>

namespace facebook::react {

/*
 * Represents telemetry data associated with a particular running Surface.
 * Contains information aggregated from multiple completed transaction.
 */
class SurfaceTelemetry final {
 public:
  constexpr static size_t kMaxNumberOfRecordedCommitTelemetries = 16;

  /*
   * Metrics
   */
  TelemetryDuration getLayoutTime() const;
  TelemetryDuration getTextMeasureTime() const;
  TelemetryDuration getCommitTime() const;
  TelemetryDuration getDiffTime() const;
  TelemetryDuration getMountTime() const;

  int getNumberOfTransactions() const;
  int getNumberOfMutations() const;
  int getNumberOfTextMeasurements() const;
  int getLastRevisionNumber() const;

  std::vector<TransactionTelemetry> getRecentTransactionTelemetries() const;

  /*
   * Incorporate data from given transaction telemetry into aggregated data
   * for the Surface.
   */
  void incorporate(
      const TransactionTelemetry& telemetry,
      int numberOfMutations);

 private:
  TelemetryDuration layoutTime_{};
  TelemetryDuration commitTime_{};
  TelemetryDuration textMeasureTime_{};
  TelemetryDuration diffTime_{};
  TelemetryDuration mountTime_{};

  int numberOfTransactions_{};
  int numberOfMutations_{};
  int numberOfTextMeasurements_{};
  int lastRevisionNumber_{};

  std::vector<TransactionTelemetry> recentTransactionTelemetries_{};
};

} // namespace facebook::react
