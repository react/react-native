/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <random>

namespace facebook::react {

/*
 * The source of pseudo-random numbers and some problem-oriented tools built on
 * top of that. We need this class to maintain a reproducible stream of random
 * numbers and abstract away complex math of and C++ STL API behind that.
 */
class Entropy final {
 public:
  using Generator = std::mt19937;

  /*
   * Creates an instance seeded with a real, not pseudo-random, number.
   */
  Entropy() {
    std::random_device device;
    seed_ = device();
    generator_ = std::mt19937(seed_);
  }

  /*
   * Creates an instance seeded with a given number.
   */
  Entropy(uint_fast32_t seed) {
    seed_ = seed;
    generator_ = std::mt19937(seed_);
  }

  uint_fast32_t getSeed() const {
    return seed_;
  }

  /*
   * Family of methods that return uniformly distributed instances of a type
   * within a specified range.
   */
  template <typename T>
  bool random() const {
    T result;
    generateRandomValue(generator_, result);
    return result;
  }

  template <typename T, typename Arg1>
  T random(Arg1 arg1) const {
    T result;
    generateRandomValue(generator_, result, arg1);
    return result;
  }

  template <typename T, typename Arg1, typename Arg2>
  T random(Arg1 arg1, Arg2 arg2) const {
    T result;
    generateRandomValue(generator_, result, arg1, arg2);
    return result;
  }

  void generateRandomValue(
      Generator& generator,
      bool& result,
      double ratio = 0.5) const {
    result = generator() % 10000 < 10000 * ratio;
  }

  void generateRandomValue(Generator& generator, int& result) const {
    result = generator();
  }

  void generateRandomValue(Generator& generator, int& result, int min, int max)
      const {
    std::uniform_int_distribution<int> distribution(min, max);
    result = distribution(generator);
  }

  /*
   * Shuffles `std::vector` in place.
   */
  template <typename T>
  void shuffle(T array) const {
    std::shuffle(array.begin(), array.end(), generator_);
  }

  /*
   * Distribute items from a given array into buckets using a normal
   * distribution and given `deviation`.
   */
  template <typename T>
  std::vector<std::vector<T>> distribute(std::vector<T> items, double deviation)
      const {
    std::normal_distribution<> distribution{0, deviation};

    auto deviationLimit = int(deviation * 10);
    auto spreadResult = std::vector<std::vector<T>>(deviationLimit * 2);
    std::fill(spreadResult.begin(), spreadResult.end(), std::vector<T>{});

    for (const auto& item : items) {
      auto position = int(distribution(generator_) + deviationLimit);
      position = std::max(0, std::min(position, deviationLimit * 2));

      if (position < spreadResult.size()) {
        spreadResult[position].push_back(item);
      }
    }

    auto result = std::vector<std::vector<T>>{};
    for (const auto& chunk : spreadResult) {
      if (chunk.size() == 0) {
        continue;
      }
      result.push_back(chunk);
    }

    return result;
  }

 private:
  mutable std::mt19937 generator_;
  uint_fast32_t seed_;
};

} // namespace facebook::react
