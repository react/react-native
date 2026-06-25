/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cinttypes>
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {

enum class AccessibilityTraits : uint32_t {
  None = 0,
  Button = (1 << 0),
  Link = (1 << 1),
  Image = (1 << 2),
  Selected = (1 << 3),
  PlaysSound = (1 << 4),
  KeyboardKey = (1 << 5),
  StaticText = (1 << 6),
  SummaryElement = (1 << 7),
  NotEnabled = (1 << 8),
  UpdatesFrequently = (1 << 9),
  SearchField = (1 << 10),
  StartsMediaSession = (1 << 11),
  Adjustable = (1 << 12),
  AllowsDirectInteraction = (1 << 13),
  CausesPageTurn = (1 << 14),
  Header = (1 << 15),
  Switch = (1 << 16),
  TabBar = (1 << 17),
};

constexpr enum AccessibilityTraits operator|(const enum AccessibilityTraits lhs, const enum AccessibilityTraits rhs)
{
  return (enum AccessibilityTraits)((uint32_t)lhs | (uint32_t)rhs);
}

constexpr enum AccessibilityTraits operator&(const enum AccessibilityTraits lhs, const enum AccessibilityTraits rhs)
{
  return (enum AccessibilityTraits)((uint32_t)lhs & (uint32_t)rhs);
}

struct AccessibilityAction {
  std::string name;
  std::optional<std::string> label{};
};

inline static bool operator==(const AccessibilityAction &lhs, const AccessibilityAction &rhs)
{
  return lhs.name == rhs.name && lhs.label == rhs.label;
}

struct AccessibilityState {
  bool disabled{false};
  bool selected{false};
  bool busy{false};
  std::optional<bool> expanded{std::nullopt};
  enum CheckedState { Unchecked, Checked, Mixed, None };
  CheckedState checked{CheckedState::None};
};

constexpr bool operator==(const AccessibilityState &lhs, const AccessibilityState &rhs)
{
  return lhs.disabled == rhs.disabled && lhs.selected == rhs.selected && lhs.checked == rhs.checked &&
      lhs.busy == rhs.busy && lhs.expanded == rhs.expanded;
}

struct AccessibilityLabelledBy {
  std::vector<std::string> value{};
};

inline static bool operator==(const AccessibilityLabelledBy &lhs, const AccessibilityLabelledBy &rhs)
{
  return lhs.value == rhs.value;
}

struct AccessibilityValue {
  std::optional<int> min;
  std::optional<int> max;
  std::optional<int> now;
  std::optional<std::string> text{};
};

constexpr bool operator==(const AccessibilityValue &lhs, const AccessibilityValue &rhs)
{
  return lhs.min == rhs.min && lhs.max == rhs.max && lhs.now == rhs.now && lhs.text == rhs.text;
}

enum class ImportantForAccessibility : uint8_t {
  Auto,
  Yes,
  No,
  NoHideDescendants,
};

enum class AccessibilityLiveRegion : uint8_t {
  None,
  Polite,
  Assertive,
};

enum class AccessibilityRole : uint8_t {
  None,
  Button,
  Dropdownlist,
  Togglebutton,
  Link,
  Search,
  Image,
  Keyboardkey,
  Text,
  Adjustable,
  Imagebutton,
  Header,
  Summary,
  Alert,
  Checkbox,
  Combobox,
  Menu,
  Menubar,
  Menuitem,
  Progressbar,
  Radio,
  Radiogroup,
  Scrollbar,
  Spinbutton,
  Switch,
  Tab,
  Tabbar,
  Tablist,
  Timer,
  List,
  Toolbar,
  Grid,
  Pager,
  Scrollview,
  Horizontalscrollview,
  Viewgroup,
  Webview,
  Drawerlayout,
  Slidingdrawer,
  Iconmenu,
};

enum class Role : uint8_t {
  Alert,
  Alertdialog,
  Application,
  Article,
  Banner,
  Button,
  Cell,
  Checkbox,
  Columnheader,
  Combobox,
  Complementary,
  Contentinfo,
  Definition,
  Dialog,
  Directory,
  Document,
  Feed,
  Figure,
  Form,
  Grid,
  Group,
  Heading,
  Img,
  Link,
  List,
  Listitem,
  Log,
  Main,
  Marquee,
  Math,
  Menu,
  Menubar,
  Menuitem,
  Meter,
  Navigation,
  None,
  Note,
  Option,
  Presentation,
  Progressbar,
  Radio,
  Radiogroup,
  Region,
  Row,
  Rowgroup,
  Rowheader,
  Scrollbar,
  Searchbox,
  Separator,
  Slider,
  Spinbutton,
  Status,
  Summary,
  Switch,
  Tab,
  Table,
  Tablist,
  Tabpanel,
  Term,
  Timer,
  Toolbar,
  Tooltip,
  Tree,
  Treegrid,
  Treeitem,
};

} // namespace facebook::react
