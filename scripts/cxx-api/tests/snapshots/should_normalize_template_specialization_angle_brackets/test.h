/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

struct CSSMatrix {
  std::array<float, 6> values{};

  constexpr bool operator==(const CSSMatrix &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSMatrix> {
  static constexpr auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSMatrix>
  {
    if (!iequals(func.name, "matrix")) {
      return {};
    }

    CSSMatrix matrix{};
    for (int i = 0; i < 6; i++) {
      auto value = parser.parseNextValue<CSSNumber>(i == 0 ? CSSDelimiter::None : CSSDelimiter::Comma);
      if (std::holds_alternative<std::monostate>(value)) {
        return {};
      }
      matrix.values[i] = std::get<CSSNumber>(value).value;
    }

    return matrix;
  }
};

// Test base class inheritance with template angle brackets
template <typename ShadowNodeT>
class ConcreteComponentDescriptor {};

class AndroidSwitchComponentDescriptor : public ConcreteComponentDescriptor<AndroidSwitchShadowNode> {
 public:
  AndroidSwitchComponentDescriptor(const ComponentDescriptorParameters &parameters);
  void adopt(ShadowNode &shadowNode) const;
};
