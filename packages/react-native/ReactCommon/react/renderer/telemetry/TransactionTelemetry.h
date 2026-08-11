/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>
#include <cstdint>
#include <functional>

#include <react/utils/Telemetry.h>

namespace facebook::react {

/*
 * Represents telemetry data associated with a particular revision of
 * `ShadowTree`.
 */
class TransactionTelemetry final {
 public:
  /*
   * Thread-local Telemetry instance
   */
  static TransactionTelemetry* threadLocalTelemetry();

  TransactionTelemetry();
  TransactionTelemetry(std::function<TelemetryTimePoint()> now);

  void setAsThreadLocal();
  void unsetAsThreadLocal();

  /*
   * Signaling
   */
  void willDiff();
  void didDiff();
  void willCommit();
  void didCommit();
  void willLayout();
  void willMeasureText();
  void didMeasureText();
  void didLayout();
  void didLayout(int affectedLayoutNodesCount);
  void willMount();
  void didMount();

  void setRevisionNumber(int revisionNumber);

  /*
   * Reading
   */
  TelemetryTimePoint getDiffStartTime() const;
  TelemetryTimePoint getDiffEndTime() const;
  TelemetryTimePoint getLayoutStartTime() const;
  TelemetryTimePoint getLayoutEndTime() const;
  TelemetryTimePoint getCommitStartTime() const;
  TelemetryTimePoint getCommitEndTime() const;
  TelemetryTimePoint getMountStartTime() const;
  TelemetryTimePoint getMountEndTime() const;

  TelemetryDuration getTextMeasureTime() const;
  int getNumberOfTextMeasurements() const;
  int getRevisionNumber() const;

  int getAffectedLayoutNodesCount() const;

 private:
  TelemetryTimePoint diffStartTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint diffEndTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint commitStartTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint commitEndTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint layoutStartTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint layoutEndTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint mountStartTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint mountEndTime_{kTelemetryUndefinedTimePoint};

  TelemetryTimePoint lastTextMeasureStartTime_{kTelemetryUndefinedTimePoint};
  TelemetryDuration textMeasureTime_{0};

  int numberOfTextMeasurements_{0};
  int revisionNumber_{0};
  std::function<TelemetryTimePoint()> now_;

  int affectedLayoutNodesCount_{0};
};

} // namespace facebook::react
