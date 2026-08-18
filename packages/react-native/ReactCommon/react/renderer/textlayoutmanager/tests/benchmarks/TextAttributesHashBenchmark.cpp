/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <benchmark/benchmark.h>

#include <react/renderer/textlayoutmanager/TextMeasureCache.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {
namespace {

size_t legacyTextAttributesHash(const TextAttributes& textAttributes) {
  size_t textEffectsHash = 0;
  for (const auto& effect : textAttributes.textEffects) {
    hash_combine(textEffectsHash, effect);
  }
  return hash_combine(
      textAttributes.foregroundColor,
      textAttributes.backgroundColor,
      textAttributes.opacity,
      textAttributes.fontFamily,
      textAttributes.fontSize,
      textAttributes.maxFontSizeMultiplier,
      textAttributes.fontSizeMultiplier,
      textAttributes.fontWeight,
      textAttributes.fontStyle,
      textAttributes.fontVariant,
      textAttributes.fontVariationSettings,
      textAttributes.allowFontScaling,
      textAttributes.letterSpacing,
      textAttributes.textTransform,
      textAttributes.lineHeight,
      textAttributes.alignment,
      textAttributes.baseWritingDirection,
      textAttributes.lineBreakStrategy,
      textAttributes.lineBreakMode,
      textAttributes.textDecorationColor,
      textAttributes.textDecorationLineType,
      textAttributes.textDecorationStyle,
      textAttributes.textShadowOffset,
      textAttributes.textShadowRadius,
      textAttributes.textShadowColor,
      textAttributes.isHighlighted,
      textAttributes.isPressable,
      textAttributes.layoutDirection,
      textAttributes.accessibilityRole,
      textAttributes.role,
      textEffectsHash);
}

size_t legacyLayoutHash(const TextAttributes& textAttributes) {
  return hash_combine(
      textAttributes.fontFamily,
      textAttributes.fontSize,
      textAttributes.fontSizeMultiplier,
      textAttributes.fontWeight,
      textAttributes.fontStyle,
      textAttributes.fontVariant,
      textAttributes.fontVariationSettings,
      textAttributes.allowFontScaling,
      textAttributes.maxFontSizeMultiplier,
      textAttributes.dynamicTypeRamp,
      textAttributes.letterSpacing,
      textAttributes.lineHeight,
      textAttributes.alignment);
}

TextAttributes sparseAttributes() {
  TextAttributes attributes;
  attributes.fontWeight = FontWeight::Weight400;
  return attributes;
}

TextAttributes partialAttributes() {
  TextAttributes attributes;
  attributes.fontFamily = "Inter";
  attributes.fontSize = 16;
  attributes.fontSizeMultiplier = 1;
  attributes.maxFontSizeMultiplier = 2;
  attributes.letterSpacing = 0.5;
  attributes.lineHeight = 20;
  attributes.fontWeight = FontWeight::Weight400;
  attributes.fontStyle = FontStyle::Normal;
  attributes.allowFontScaling = true;
  attributes.alignment = TextAlignment::Natural;
  return attributes;
}

TextAttributes fullAttributes() {
  auto attributes = partialAttributes();
  attributes.fontVariant = FontVariant::SmallCaps;
  attributes.fontVariationSettings = "'wght' 400";
  attributes.dynamicTypeRamp = DynamicTypeRamp::Body;
  attributes.textTransform = TextTransform::None;
  attributes.baseWritingDirection = WritingDirection::LeftToRight;
  attributes.lineBreakStrategy = LineBreakStrategy::Standard;
  attributes.lineBreakMode = LineBreakMode::Word;
  attributes.textDecorationLineType = TextDecorationLineType::Underline;
  attributes.textDecorationStyle = TextDecorationStyle::Solid;
  attributes.textShadowOffset = Size{.width = 1, .height = 1};
  attributes.isHighlighted = false;
  attributes.isPressable = true;
  attributes.layoutDirection = LayoutDirection{};
  attributes.accessibilityRole = AccessibilityRole{};
  attributes.role = Role{};
  return attributes;
}

struct DefaultAttributes {
  static TextAttributes make() {
    return {};
  }
};

struct SparseAttributes {
  static TextAttributes make() {
    return sparseAttributes();
  }
};

struct PartialAttributes {
  static TextAttributes make() {
    return partialAttributes();
  }
};

struct FullAttributes {
  static TextAttributes make() {
    return fullAttributes();
  }
};

struct LegacyFullHash {
  static size_t hash(const TextAttributes& attributes) {
    return legacyTextAttributesHash(attributes);
  }
};

struct OptimizedFullHash {
  static size_t hash(const TextAttributes& attributes) {
    return std::hash<TextAttributes>{}(attributes);
  }
};

struct LegacyLayoutHash {
  static size_t hash(const TextAttributes& attributes) {
    return legacyLayoutHash(attributes);
  }
};

struct OptimizedLayoutHash {
  static size_t hash(const TextAttributes& attributes) {
    return textAttributesHashLayoutWise(attributes);
  }
};

template <typename Attributes, typename Hash>
void textAttributesHashBenchmark(benchmark::State& state) {
  const auto attributes = Attributes::make();
  for (auto _ : state) {
    benchmark::DoNotOptimize(attributes);
    benchmark::DoNotOptimize(Hash::hash(attributes));
  }
}

BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    DefaultAttributes,
    LegacyFullHash)
    ->Name("LegacyFull_Default");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    DefaultAttributes,
    OptimizedFullHash)
    ->Name("OptimizedFull_Default");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    SparseAttributes,
    LegacyFullHash)
    ->Name("LegacyFull_Sparse");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    SparseAttributes,
    OptimizedFullHash)
    ->Name("OptimizedFull_Sparse");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    PartialAttributes,
    LegacyFullHash)
    ->Name("LegacyFull_Partial");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    PartialAttributes,
    OptimizedFullHash)
    ->Name("OptimizedFull_Partial");
BENCHMARK_TEMPLATE(textAttributesHashBenchmark, FullAttributes, LegacyFullHash)
    ->Name("LegacyFull_Full");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    FullAttributes,
    OptimizedFullHash)
    ->Name("OptimizedFull_Full");

BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    DefaultAttributes,
    LegacyLayoutHash)
    ->Name("LegacyLayout_Default");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    DefaultAttributes,
    OptimizedLayoutHash)
    ->Name("OptimizedLayout_Default");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    SparseAttributes,
    LegacyLayoutHash)
    ->Name("LegacyLayout_Sparse");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    SparseAttributes,
    OptimizedLayoutHash)
    ->Name("OptimizedLayout_Sparse");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    PartialAttributes,
    LegacyLayoutHash)
    ->Name("LegacyLayout_Partial");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    PartialAttributes,
    OptimizedLayoutHash)
    ->Name("OptimizedLayout_Partial");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    FullAttributes,
    LegacyLayoutHash)
    ->Name("LegacyLayout_Full");
BENCHMARK_TEMPLATE(
    textAttributesHashBenchmark,
    FullAttributes,
    OptimizedLayoutHash)
    ->Name("OptimizedLayout_Full");

} // namespace
} // namespace facebook::react

BENCHMARK_MAIN();
