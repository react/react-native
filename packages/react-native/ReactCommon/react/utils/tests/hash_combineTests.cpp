/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/utils/hash_combine.h>

#include <array>
#include <cstdint>
#include <optional>
#include <string>
#include <utility>

struct Person {
  std::string firstName;
  std::string lastName;
};

namespace std {
template <>
struct hash<Person> {
  size_t operator()(const Person& person) const {
    return facebook::react::hash_combine(person.firstName, person.lastName);
  }
};
} // namespace std

namespace facebook::react {

TEST(hash_combineTests, testIntegerTemplating) {
  std::size_t seed = 0;
  hash_combine(seed, 1);

  auto hashedValue = hash_combine(1);
  EXPECT_EQ(hashedValue, seed);

  EXPECT_NE(hash_combine(1), hash_combine(2));
}

TEST(hash_combineTests, testIntegerCombinationsHashing) {
  std::size_t seed = 0;
  hash_combine(seed, 1, 2);

  auto hashedValue = hash_combine(1, 2);
  EXPECT_EQ(hashedValue, seed);

  EXPECT_NE(hash_combine(1, 2), hash_combine(2, 1));
}

TEST(hash_combineTests, testContiniousIntegerHashing) {
  std::size_t seed = 0;

  for (int i = 1; i <= 200; ++i) {
    auto previousSeed = seed;
    hash_combine(seed, i);
    EXPECT_NE(seed, previousSeed);
  }
}

TEST(hash_combineTests, testStrings) {
  std::size_t seed = 0;
  hash_combine<std::string>(seed, "react");

  auto hashedValue = hash_combine<std::string>("react");
  EXPECT_EQ(hashedValue, seed);

  EXPECT_NE(
      hash_combine<std::string>("react"),
      hash_combine<std::string>("react native"));
}

TEST(hash_combineTests, testCustomTypes) {
  auto person1 = Person{.firstName = "John", .lastName = "Doe"};
  auto person2 = Person{.firstName = "Jane", .lastName = "Doe"};

  std::size_t seed = 0;
  hash_combine(seed, person1);

  auto hashedValue = hash_combine(person1);
  EXPECT_EQ(hashedValue, seed);

  EXPECT_NE(hash_combine(person1), hash_combine(person2));
}

TEST(hash_combineTests, optionalsCombinePresenceBeforeEngagedValues) {
  std::optional<int> first{17};
  std::optional<std::string> second;
  std::optional<bool> third{true};

  std::size_t actual = 41;
  hash_combine_optionals(actual, first, second, third);

  std::size_t optionalsHash = std::uint32_t{0b101};
  hash_combine(optionalsHash, *first, *third);
  std::size_t expected = 41;
  hash_combine(expected, optionalsHash);
  EXPECT_EQ(actual, expected);
}

TEST(hash_combineTests, disengagedOptionalsOnlyCombinePresence) {
  std::optional<int> first;
  std::optional<std::string> second;

  std::size_t actual = 41;
  hash_combine_optionals(actual, first, second);

  std::size_t expected = 41;
  hash_combine(expected, std::uint32_t{0});
  EXPECT_EQ(actual, expected);
}

TEST(hash_combineTests, optionalStringContentsAffectProvidedSeed) {
  std::optional<std::string> react{"react"};
  std::optional<std::string> reactNative{"react native"};

  std::size_t reactHash = 41;
  hash_combine_optionals(reactHash, react);

  std::size_t optionalsHash = std::uint32_t{1};
  hash_combine(optionalsHash, *react);
  std::size_t expected = 41;
  hash_combine(expected, optionalsHash);
  EXPECT_EQ(reactHash, expected);

  std::size_t reactNativeHash = 41;
  hash_combine_optionals(reactNativeHash, reactNative);
  EXPECT_NE(reactHash, reactNativeHash);
}

TEST(hash_combineTests, emptyOptionalStringDiffersFromDisengaged) {
  std::optional<std::string> emptyString{""};
  std::optional<std::string> disengaged;

  std::size_t emptyStringHash = 41;
  hash_combine_optionals(emptyStringHash, emptyString);

  std::size_t disengagedHash = 41;
  hash_combine_optionals(disengagedHash, disengaged);

  EXPECT_NE(emptyStringHash, disengagedHash);
}

TEST(hash_combineTests, optionalPositionAffectsHash) {
  std::optional<int> engaged{17};
  std::optional<int> disengaged;

  std::size_t firstPosition = 0;
  hash_combine_optionals(firstPosition, engaged, disengaged);

  std::size_t secondPosition = 0;
  hash_combine_optionals(secondPosition, disengaged, engaged);

  EXPECT_NE(firstPosition, secondPosition);
}

namespace {

struct Unhashable {};

template <typename... Ts>
concept CanHashCombineOptionals =
    requires(std::size_t& seed, const std::optional<Ts>&... optionals) {
      hash_combine_optionals(seed, optionals...);
    };

template <std::size_t... Indices>
constexpr bool canHashOptionalCount(
    std::index_sequence<Indices...> /*unused*/) {
  return requires(std::size_t& seed, const std::optional<int>& optional) {
    hash_combine_optionals(seed, ((void)Indices, optional)...);
  };
}

static_assert(CanHashCombineOptionals<int, std::string, bool>);
static_assert(!CanHashCombineOptionals<Unhashable>);
static_assert(canHashOptionalCount(std::make_index_sequence<32>{}));
static_assert(!canHashOptionalCount(std::make_index_sequence<33>{}));

template <std::size_t... Indices>
void combineArrayOptionals(
    std::size_t& seed,
    const std::array<std::optional<int>, 32>& optionals,
    std::index_sequence<Indices...> /*unused*/) {
  hash_combine_optionals(seed, optionals[Indices]...);
}

} // namespace

TEST(hash_combineTests, supportsHighestPresenceBit) {
  std::array<std::optional<int>, 32> optionals;
  optionals.back() = 17;

  std::size_t actual = 41;
  combineArrayOptionals(actual, optionals, std::make_index_sequence<32>{});

  std::size_t optionalsHash = std::uint32_t{1} << 31;
  hash_combine(optionalsHash, 17);
  std::size_t expected = 41;
  hash_combine(expected, optionalsHash);
  EXPECT_EQ(actual, expected);
}

} // namespace facebook::react
