/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <set>
#include <string_view>

#include <yoga/enums/Align.h>
#include <yoga/enums/BoxSizing.h>
#include <yoga/enums/Dimension.h>
#include <yoga/enums/Direction.h>
#include <yoga/enums/Display.h>
#include <yoga/enums/Edge.h>
#include <yoga/enums/Errata.h>
#include <yoga/enums/ExperimentalFeature.h>
#include <yoga/enums/FlexDirection.h>
#include <yoga/enums/GridTrackType.h>
#include <yoga/enums/Gutter.h>
#include <yoga/enums/Justify.h>
#include <yoga/enums/LogLevel.h>
#include <yoga/enums/MeasureMode.h>
#include <yoga/enums/NodeType.h>
#include <yoga/enums/Overflow.h>
#include <yoga/enums/PositionType.h>
#include <yoga/enums/Unit.h>
#include <yoga/enums/Wrap.h>
#include <yoga/enums/YogaEnums.h>

namespace facebook::yoga {
namespace {

// The scoped enums and the YG*ToString() switches are emitted from separate
// generator outputs, so ordinalCount<T>() is an independent source of truth for
// how many values each switch must handle.
template <HasOrdinality EnumT>
void expectNamesForEveryOrdinal() {
  std::set<std::string_view> names;
  for (EnumT value : ordinals<EnumT>()) {
    SCOPED_TRACE(to_underlying(value));
    const char* name = toString(value);
    EXPECT_STRNE("unknown", name);
    EXPECT_STRNE("", name);
    EXPECT_TRUE(names.insert(std::string_view{name}).second)
        << "duplicate name: " << name;
  }
  EXPECT_EQ(ordinalCount<EnumT>(), static_cast<int32_t>(names.size()));
}

} // namespace

TEST(YGEnumsTest, testToStringNamesEveryOrdinalDistinctly) {
  expectNamesForEveryOrdinal<Align>();
  expectNamesForEveryOrdinal<BoxSizing>();
  expectNamesForEveryOrdinal<Dimension>();
  expectNamesForEveryOrdinal<Direction>();
  expectNamesForEveryOrdinal<Display>();
  expectNamesForEveryOrdinal<Edge>();
  expectNamesForEveryOrdinal<ExperimentalFeature>();
  expectNamesForEveryOrdinal<FlexDirection>();
  expectNamesForEveryOrdinal<GridTrackType>();
  expectNamesForEveryOrdinal<Gutter>();
  expectNamesForEveryOrdinal<Justify>();
  expectNamesForEveryOrdinal<LogLevel>();
  expectNamesForEveryOrdinal<MeasureMode>();
  expectNamesForEveryOrdinal<NodeType>();
  expectNamesForEveryOrdinal<Overflow>();
  expectNamesForEveryOrdinal<PositionType>();
  expectNamesForEveryOrdinal<Unit>();
  expectNamesForEveryOrdinal<Wrap>();
}

// YGErrata is a bit mask rather than a sequence, so only its declared constants
// have names; a combination of flags is not one of the flags it contains and
// must not be reported as such.
TEST(YGEnumsTest, testErrataToStringNamesConstantsButNotCombinations) {
  std::set<std::string_view> names;
  for (Errata errata :
       {Errata::None,
        Errata::StretchFlexBasis,
        Errata::AbsolutePositionWithoutInsetsExcludesPadding,
        Errata::AbsolutePercentAgainstInnerSize,
        Errata::MinSizeUndefinedInsteadOfAuto,
        Errata::FlexFirstPassUsesRunningTotals,
        Errata::All,
        Errata::Classic}) {
    SCOPED_TRACE(to_underlying(errata));
    const char* name = toString(errata);
    EXPECT_STRNE("unknown", name);
    EXPECT_TRUE(names.insert(std::string_view{name}).second)
        << "duplicate name: " << name;
  }

  const Errata combination =
      Errata::StretchFlexBasis | Errata::MinSizeUndefinedInsteadOfAuto;
  EXPECT_STREQ("unknown", toString(combination));
}

} // namespace facebook::yoga
