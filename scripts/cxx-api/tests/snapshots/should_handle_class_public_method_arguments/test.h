/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

class Clss {
 public:
  void fn0(int32_t arg1);
  void fn1(int32_t arg1, int32_t arg2);
  void fn2(std::function<int32_t(int32_t)> arg1);
  void fn3(std::function<int32_t(int32_t)> arg1, std::function<int32_t(int32_t, int32_t)> arg2);
  void fn4(std::map<std::string, int> m);
  void fn5(std::unordered_map<K, std::vector<V>> m);
  void fn6(std::tuple<int, float, std::string> t);
  void fn7(std::vector<std::vector<std::pair<int, int>>> v);
  void fn8(std::map<K, std::function<void(A, B)>> m);
  void fn9(int (*callback)(int, int));
  void fn10(void (*handler)(const char *, size_t));
  void fn11(int (*(*fp)(int))(double));
  void fn12(int x = 5, std::string s = "default");
  void fn13(std::function<void()> f = nullptr);
  void fn14(std::vector<int> v = {1, 2, 3});
  void fn15() noexcept;
  void fn16() = 0;
  void fn17() = default;
  void fn18() = delete;
  void fn19() final;
  void fn20() final override;
};

} // namespace test
