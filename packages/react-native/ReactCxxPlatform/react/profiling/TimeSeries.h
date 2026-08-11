/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ostream>
#include <vector>

namespace facebook::react {

class TimeSeries {
  // A "compound range" structure to account for wrapped around intervals
  struct Range {
    int idxFrom1{0};
    int idxTo1{0};
    int idxFrom2{0};
    int idxTo2{0};

    int size() const {
      return (idxTo1 - idxFrom1) + (idxTo2 - idxFrom2);
    }

    bool isEmpty() const {
      return size() == 0;
    }

    bool isContinuous() const {
      return idxTo2 - idxFrom2 == 0;
    }
  };

 public:
  static constexpr int DEFAULT_CAPACITY = 100;
  enum class Bound { Upper = 0, Lower = 1 };

  TimeSeries(int capacity = DEFAULT_CAPACITY);

  bool operator==(const TimeSeries& rhs) const;

  int getCapacity() const {
    return static_cast<int>(times_.capacity());
  }
  void setCapacity(int capacity);

  void reset();

  int findHistoryPointIndex(double t, Bound bound = Bound::Lower) const;

  int getNumPoints() const {
    return static_cast<int>(times_.size());
  }

  double& valueAtIndex(int idx) {
    const int numPoints = getNumPoints();
    return values_[(idx + position_) % numPoints];
  }

  double& timeAtIndex(int idx) {
    const int numPoints = getNumPoints();
    return times_[(idx + position_) % numPoints];
  }

  double valueAtIndex(int idx) const {
    const int numPoints = getNumPoints();
    return values_[(idx + position_) % numPoints];
  }

  double timeAtIndex(int idx) const {
    const int numPoints = getNumPoints();
    return times_[(idx + position_) % numPoints];
  }

  void appendValue(double time, double value);

  void accumulateValue(double timeFrom, double timeTo, double value);

  double getValue(double time) const;

  double getPercentile(unsigned int percentile) const;
  double getPercentile(unsigned int percentile, double timeFrom, double timeTo)
      const;

  double getAverage() const;
  double getAverage(double timeFrom, double timeTo) const;

  double getMax() const;
  double getMax(double timeFrom, double timeTo) const;

  double getMin() const;
  double getMin(double timeFrom, double timeTo) const;

  double getSum() const;
  double getSum(double timeFrom, double timeTo) const;

  int getCount(double timeFrom, double timeTo) const;

  double getMaxTime() const;
  double getMinTime() const;

  friend std::ostream& operator<<(std::ostream& os, const TimeSeries& ts);
  friend std::ostream& operator<<(
      std::ostream& os,
      const TimeSeries::Range& range);

 private:
  std::vector<double> times_;
  std::vector<double> values_;

  size_t position_{0};

  Range findHistoryPointRange(double timeFrom, double timeTo) const;
  Range wholeRange() const;

  double getPercentile(unsigned int percentile, const Range& range) const;
  double getAverage(const Range& range) const;
  double getMax(const Range& range) const;
  double getMin(const Range& range) const;
  double getSum(const Range& range) const;
};

} // namespace facebook::react
