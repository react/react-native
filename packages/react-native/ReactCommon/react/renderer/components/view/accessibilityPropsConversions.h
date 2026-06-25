/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/debug/react_native_assert.h>
#include <react/debug/react_native_expect.h>
#include <react/renderer/components/view/AccessibilityPrimitives.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/DebugStringConvertible.h>

#include <unordered_map>

namespace facebook::react {

inline void fromString(const std::string &string, AccessibilityTraits &result)
{
  if (string == "none") {
    result = AccessibilityTraits::None;
    return;
  }
  if (string == "button" || string == "togglebutton") {
    result = AccessibilityTraits::Button;
    return;
  }
  if (string == "link") {
    result = AccessibilityTraits::Link;
    return;
  }
  if (string == "image" || string == "img") {
    result = AccessibilityTraits::Image;
    return;
  }
  if (string == "selected") {
    result = AccessibilityTraits::Selected;
    return;
  }
  if (string == "plays") {
    result = AccessibilityTraits::PlaysSound;
    return;
  }
  if (string == "keyboardkey" || string == "key") {
    result = AccessibilityTraits::KeyboardKey;
    return;
  }
  if (string == "text") {
    result = AccessibilityTraits::StaticText;
    return;
  }
  if (string == "disabled") {
    result = AccessibilityTraits::NotEnabled;
    return;
  }
  if (string == "frequentUpdates") {
    result = AccessibilityTraits::UpdatesFrequently;
    return;
  }
  if (string == "search") {
    result = AccessibilityTraits::SearchField;
    return;
  }
  if (string == "startsMedia") {
    result = AccessibilityTraits::StartsMediaSession;
    return;
  }
  if (string == "adjustable") {
    result = AccessibilityTraits::Adjustable;
    return;
  }
  if (string == "allowsDirectInteraction") {
    result = AccessibilityTraits::AllowsDirectInteraction;
    return;
  }
  if (string == "pageTurn") {
    result = AccessibilityTraits::CausesPageTurn;
    return;
  }
  if (string == "header" || string == "heading") {
    result = AccessibilityTraits::Header;
    return;
  }
  if (string == "imagebutton") {
    result = AccessibilityTraits::Image | AccessibilityTraits::Button;
    return;
  }
  if (string == "summary") {
    result = AccessibilityTraits::SummaryElement;
    return;
  }
  if (string == "switch") {
    result = AccessibilityTraits::Switch;
    return;
  }
  if (string == "tabbar") {
    result = AccessibilityTraits::TabBar;
    return;
  }
  if (string == "progressbar") {
    result = AccessibilityTraits::UpdatesFrequently;
    return;
  }
  result = AccessibilityTraits::None;
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityTraits &result)
{
  if (value.hasType<std::string>()) {
    fromString((std::string)value, result);
    return;
  }

  result = {};

  react_native_expect(value.hasType<std::vector<std::string>>());
  if (value.hasType<std::vector<std::string>>()) {
    auto items = (std::vector<std::string>)value;
    for (auto &item : items) {
      AccessibilityTraits itemAccessibilityTraits;
      fromString(item, itemAccessibilityTraits);
      result = result | itemAccessibilityTraits;
    }
  } else {
    LOG(ERROR) << "AccessibilityTraits parsing: unsupported type";
  }
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityState &result)
{
  auto map = (std::unordered_map<std::string, RawValue>)value;
  auto selected = map.find("selected");
  if (selected != map.end()) {
    fromRawValue(context, selected->second, result.selected);
  }
  auto disabled = map.find("disabled");
  if (disabled != map.end()) {
    fromRawValue(context, disabled->second, result.disabled);
  }
  auto checked = map.find("checked");
  if (checked != map.end()) {
    if (checked->second.hasType<std::string>()) {
      if ((std::string)checked->second == "mixed") {
        result.checked = AccessibilityState::Mixed;
      } else {
        result.checked = AccessibilityState::None;
      }
    } else if (checked->second.hasType<bool>()) {
      if ((bool)checked->second == true) {
        result.checked = AccessibilityState::Checked;
      } else {
        result.checked = AccessibilityState::Unchecked;
      }
    } else {
      result.checked = AccessibilityState::None;
    }
  }
  auto busy = map.find("busy");
  if (busy != map.end()) {
    fromRawValue(context, busy->second, result.busy);
  }
  auto expanded = map.find("expanded");
  if (expanded != map.end()) {
    fromRawValue(context, expanded->second, result.expanded);
  }
}

inline std::string toString(const ImportantForAccessibility &importantForAccessibility)
{
  switch (importantForAccessibility) {
    case ImportantForAccessibility::Auto:
      return "auto";
    case ImportantForAccessibility::Yes:
      return "yes";
    case ImportantForAccessibility::No:
      return "no";
    case ImportantForAccessibility::NoHideDescendants:
      return "no-hide-descendants";
  }
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, ImportantForAccessibility &result)
{
  result = ImportantForAccessibility::Auto;
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "auto") {
      result = ImportantForAccessibility::Auto;
    } else if (string == "yes") {
      result = ImportantForAccessibility::Yes;
    } else if (string == "no") {
      result = ImportantForAccessibility::No;
    } else if (string == "no-hide-descendants") {
      result = ImportantForAccessibility::NoHideDescendants;
    } else {
      LOG(ERROR) << "Unsupported ImportantForAccessibility value: " << string;
      react_native_expect(false);
    }
  } else {
    LOG(ERROR) << "Unsupported ImportantForAccessibility type";
  }
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityAction &result)
{
  auto map = (std::unordered_map<std::string, RawValue>)value;

  auto name = map.find("name");
  react_native_assert(name != map.end() && name->second.hasType<std::string>());
  if (name != map.end()) {
    fromRawValue(context, name->second, result.name);
  }

  auto label = map.find("label");
  if (label != map.end()) {
    if (label->second.hasType<std::string>()) {
      result.label = (std::string)label->second;
    }
  }
}

inline void fromRawValue(const PropsParserContext & /*unused*/, const RawValue &value, AccessibilityValue &result)
{
  auto map = (std::unordered_map<std::string, RawValue>)value;

  auto min = map.find("min");
  if (min != map.end()) {
    if (min->second.hasType<int>()) {
      result.min = (int)min->second;
    }
  }

  auto max = map.find("max");
  if (max != map.end()) {
    if (max->second.hasType<int>()) {
      result.max = (int)max->second;
    }
  }

  auto now = map.find("now");
  if (now != map.end()) {
    if (now->second.hasType<int>()) {
      result.now = (int)now->second;
    }
  }

  auto text = map.find("text");
  if (text != map.end()) {
    if (text->second.hasType<std::string>()) {
      result.text = (std::string)text->second;
    }
  }
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityLabelledBy &result)
{
  if (value.hasType<std::string>()) {
    result.value.push_back((std::string)value);
  } else if (value.hasType<std::vector<std::string>>()) {
    result.value = (std::vector<std::string>)value;
  }
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityLiveRegion &result)
{
  result = AccessibilityLiveRegion::None;
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "none") {
      result = AccessibilityLiveRegion::None;
    } else if (string == "polite") {
      result = AccessibilityLiveRegion::Polite;
    } else if (string == "assertive") {
      result = AccessibilityLiveRegion::Assertive;
    } else {
      LOG(ERROR) << "Unsupported AccessibilityLiveRegion value: " << string;
      react_native_expect(false);
    }
  } else {
    LOG(ERROR) << "Unsupported AccessibilityLiveRegion type";
  }
}

inline std::string toString(const AccessibilityRole &accessibilityRole)
{
  switch (accessibilityRole) {
    case AccessibilityRole::None:
      return "none";
    case AccessibilityRole::Button:
      return "button";
    case AccessibilityRole::Dropdownlist:
      return "dropdownlist";
    case AccessibilityRole::Togglebutton:
      return "togglebutton";
    case AccessibilityRole::Link:
      return "link";
    case AccessibilityRole::Search:
      return "search";
    case AccessibilityRole::Image:
      return "image";
    case AccessibilityRole::Keyboardkey:
      return "keyboardkey";
    case AccessibilityRole::Text:
      return "text";
    case AccessibilityRole::Adjustable:
      return "adjustable";
    case AccessibilityRole::Imagebutton:
      return "imagebutton";
    case AccessibilityRole::Header:
      return "header";
    case AccessibilityRole::Summary:
      return "summary";
    case AccessibilityRole::Alert:
      return "alert";
    case AccessibilityRole::Checkbox:
      return "checkbox";
    case AccessibilityRole::Combobox:
      return "combobox";
    case AccessibilityRole::Menu:
      return "menu";
    case AccessibilityRole::Menubar:
      return "menubar";
    case AccessibilityRole::Menuitem:
      return "menuitem";
    case AccessibilityRole::Progressbar:
      return "progressbar";
    case AccessibilityRole::Radio:
      return "radio";
    case AccessibilityRole::Radiogroup:
      return "radiogroup";
    case AccessibilityRole::Scrollbar:
      return "scrollbar";
    case AccessibilityRole::Spinbutton:
      return "spinbutton";
    case AccessibilityRole::Switch:
      return "switch";
    case AccessibilityRole::Tab:
      return "tab";
    case AccessibilityRole::Tabbar:
      return "tabbar";
    case AccessibilityRole::Tablist:
      return "tablist";
    case AccessibilityRole::Timer:
      return "timer";
    case AccessibilityRole::List:
      return "timer";
    case AccessibilityRole::Toolbar:
      return "toolbar";
    case AccessibilityRole::Grid:
      return "grid";
    case AccessibilityRole::Pager:
      return "pager";
    case AccessibilityRole::Scrollview:
      return "scrollview";
    case AccessibilityRole::Horizontalscrollview:
      return "horizontalscrollview";
    case AccessibilityRole::Viewgroup:
      return "viewgroup";
    case AccessibilityRole::Webview:
      return "webview";
    case AccessibilityRole::Drawerlayout:
      return "drawerlayout";
    case AccessibilityRole::Slidingdrawer:
      return "slidingdrawer";
    case AccessibilityRole::Iconmenu:
      return "iconmenu";
  }

  LOG(ERROR) << "Unsupported AccessibilityRole value";
  react_native_expect(false);
  // sane default for prod
  return "none";
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, AccessibilityRole &result)
{
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "none") {
      result = AccessibilityRole::None;
    } else if (string == "button") {
      result = AccessibilityRole::Button;
    } else if (string == "dropdownlist") {
      result = AccessibilityRole::Dropdownlist;
    } else if (string == "togglebutton") {
      result = AccessibilityRole::Togglebutton;
    } else if (string == "link") {
      result = AccessibilityRole::Link;
    } else if (string == "search") {
      result = AccessibilityRole::Search;
    } else if (string == "image") {
      result = AccessibilityRole::Image;
    } else if (string == "keyboardkey") {
      result = AccessibilityRole::Keyboardkey;
    } else if (string == "text") {
      result = AccessibilityRole::Text;
    } else if (string == "adjustable") {
      result = AccessibilityRole::Adjustable;
    } else if (string == "imagebutton") {
      result = AccessibilityRole::Imagebutton;
    } else if (string == "header") {
      result = AccessibilityRole::Header;
    } else if (string == "summary") {
      result = AccessibilityRole::Summary;
    } else if (string == "alert") {
      result = AccessibilityRole::Alert;
    } else if (string == "checkbox") {
      result = AccessibilityRole::Checkbox;
    } else if (string == "combobox") {
      result = AccessibilityRole::Combobox;
    } else if (string == "menu") {
      result = AccessibilityRole::Menu;
    } else if (string == "menubar") {
      result = AccessibilityRole::Menubar;
    } else if (string == "menuitem") {
      result = AccessibilityRole::Menuitem;
    } else if (string == "progressbar") {
      result = AccessibilityRole::Progressbar;
    } else if (string == "radio") {
      result = AccessibilityRole::Radio;
    } else if (string == "radiogroup") {
      result = AccessibilityRole::Radiogroup;
    } else if (string == "scrollbar") {
      result = AccessibilityRole::Scrollbar;
    } else if (string == "spinbutton") {
      result = AccessibilityRole::Spinbutton;
    } else if (string == "switch") {
      result = AccessibilityRole::Switch;
    } else if (string == "tab") {
      result = AccessibilityRole::Tab;
    } else if (string == "tabbar") {
      result = AccessibilityRole::Tabbar;
    } else if (string == "tablist") {
      result = AccessibilityRole::Tablist;
    } else if (string == "timer") {
      result = AccessibilityRole::Timer;
    } else if (string == "toolbar") {
      result = AccessibilityRole::Toolbar;
    } else if (string == "grid") {
      result = AccessibilityRole::Grid;
    } else if (string == "pager") {
      result = AccessibilityRole::Pager;
    } else if (string == "scrollview") {
      result = AccessibilityRole::Scrollview;
    } else if (string == "horizontalscrollview") {
      result = AccessibilityRole::Horizontalscrollview;
    } else if (string == "viewgroup") {
      result = AccessibilityRole::Viewgroup;
    } else if (string == "webview") {
      result = AccessibilityRole::Webview;
    } else if (string == "drawerlayout") {
      result = AccessibilityRole::Drawerlayout;
    } else if (string == "slidingdrawer") {
      result = AccessibilityRole::Slidingdrawer;
    } else if (string == "iconmenu") {
      result = AccessibilityRole::Iconmenu;
    } else {
      LOG(ERROR) << "Unsupported AccessibilityRole value: " << string;
      react_native_expect(false);
      // sane default for prod
      result = AccessibilityRole::None;
    }
    return;
  }

  LOG(ERROR) << "Unsupported AccessibilityRole type";
  react_native_expect(false);
  // sane default for prod
  result = AccessibilityRole::None;
}

inline std::string toString(const Role &role)
{
  switch (role) {
    case Role::Alert:
      return "alert";
    case Role::Alertdialog:
      return "alertdialog";
    case Role::Application:
      return "application";
    case Role::Article:
      return "article";
    case Role::Banner:
      return "banner";
    case Role::Button:
      return "button";
    case Role::Cell:
      return "cell";
    case Role::Checkbox:
      return "checkbox";
    case Role::Columnheader:
      return "columnheader";
    case Role::Combobox:
      return "combobox";
    case Role::Complementary:
      return "complementary";
    case Role::Contentinfo:
      return "contentinfo";
    case Role::Definition:
      return "definition";
    case Role::Dialog:
      return "dialog";
    case Role::Directory:
      return "directory";
    case Role::Document:
      return "document";
    case Role::Feed:
      return "feed";
    case Role::Figure:
      return "figure";
    case Role::Form:
      return "form";
    case Role::Grid:
      return "grid";
    case Role::Group:
      return "group";
    case Role::Heading:
      return "heading";
    case Role::Img:
      return "img";
    case Role::Link:
      return "link";
    case Role::List:
      return "list";
    case Role::Listitem:
      return "listitem";
    case Role::Log:
      return "log";
    case Role::Main:
      return "main";
    case Role::Marquee:
      return "marquee";
    case Role::Math:
      return "math";
    case Role::Menu:
      return "menu";
    case Role::Menubar:
      return "menubar";
    case Role::Menuitem:
      return "menuitem";
    case Role::Meter:
      return "meter";
    case Role::Navigation:
      return "navigation";
    case Role::None:
      return "none";
    case Role::Note:
      return "note";
    case Role::Option:
      return "option";
    case Role::Presentation:
      return "presentation";
    case Role::Progressbar:
      return "progressbar";
    case Role::Radio:
      return "radio";
    case Role::Radiogroup:
      return "radiogroup";
    case Role::Region:
      return "region";
    case Role::Row:
      return "row";
    case Role::Rowgroup:
      return "rowgroup";
    case Role::Rowheader:
      return "rowheader";
    case Role::Scrollbar:
      return "scrollbar";
    case Role::Searchbox:
      return "searchbox";
    case Role::Separator:
      return "separator";
    case Role::Slider:
      return "slider";
    case Role::Spinbutton:
      return "spinbutton";
    case Role::Status:
      return "status";
    case Role::Summary:
      return "summary";
    case Role::Switch:
      return "switch";
    case Role::Tab:
      return "tab";
    case Role::Table:
      return "table";
    case Role::Tablist:
      return "tablist";
    case Role::Tabpanel:
      return "tabpanel";
    case Role::Term:
      return "term";
    case Role::Timer:
      return "timer";
    case Role::Toolbar:
      return "toolbar";
    case Role::Tooltip:
      return "tooltip";
    case Role::Tree:
      return "tree";
    case Role::Treegrid:
      return "treegrid";
    case Role::Treeitem:
      return "treeitem";
  }

  LOG(ERROR) << "Unsupported Role value";
  react_native_expect(false);
  // sane default for prod
  return "none";
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, Role &result)
{
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "alert") {
      result = Role::Alert;
    } else if (string == "alertdialog") {
      result = Role::Alertdialog;
    } else if (string == "application") {
      result = Role::Application;
    } else if (string == "article") {
      result = Role::Article;
    } else if (string == "banner") {
      result = Role::Banner;
    } else if (string == "button") {
      result = Role::Button;
    } else if (string == "cell") {
      result = Role::Cell;
    } else if (string == "checkbox") {
      result = Role::Checkbox;
    } else if (string == "columnheader") {
      result = Role::Columnheader;
    } else if (string == "combobox") {
      result = Role::Combobox;
    } else if (string == "complementary") {
      result = Role::Complementary;
    } else if (string == "contentinfo") {
      result = Role::Contentinfo;
    } else if (string == "definition") {
      result = Role::Definition;
    } else if (string == "dialog") {
      result = Role::Dialog;
    } else if (string == "directory") {
      result = Role::Directory;
    } else if (string == "document") {
      result = Role::Document;
    } else if (string == "feed") {
      result = Role::Feed;
    } else if (string == "figure") {
      result = Role::Figure;
    } else if (string == "form") {
      result = Role::Form;
    } else if (string == "grid") {
      result = Role::Grid;
    } else if (string == "group") {
      result = Role::Group;
    } else if (string == "heading") {
      result = Role::Heading;
    } else if (string == "img") {
      result = Role::Img;
    } else if (string == "link") {
      result = Role::Link;
    } else if (string == "list") {
      result = Role::List;
    } else if (string == "listitem") {
      result = Role::Listitem;
    } else if (string == "log") {
      result = Role::Log;
    } else if (string == "main") {
      result = Role::Main;
    } else if (string == "marquee") {
      result = Role::Marquee;
    } else if (string == "math") {
      result = Role::Math;
    } else if (string == "menu") {
      result = Role::Menu;
    } else if (string == "menubar") {
      result = Role::Menubar;
    } else if (string == "menuitem") {
      result = Role::Menuitem;
    } else if (string == "meter") {
      result = Role::Meter;
    } else if (string == "navigation") {
      result = Role::Navigation;
    } else if (string == "none") {
      result = Role::None;
    } else if (string == "note") {
      result = Role::Note;
    } else if (string == "option") {
      result = Role::Option;
    } else if (string == "presentation") {
      result = Role::Presentation;
    } else if (string == "progressbar") {
      result = Role::Progressbar;
    } else if (string == "radio") {
      result = Role::Radio;
    } else if (string == "radiogroup") {
      result = Role::Radiogroup;
    } else if (string == "region") {
      result = Role::Region;
    } else if (string == "row") {
      result = Role::Row;
    } else if (string == "rowgroup") {
      result = Role::Rowgroup;
    } else if (string == "rowheader") {
      result = Role::Rowheader;
    } else if (string == "scrollbar") {
      result = Role::Scrollbar;
    } else if (string == "searchbox") {
      result = Role::Searchbox;
    } else if (string == "separator") {
      result = Role::Separator;
    } else if (string == "slider") {
      result = Role::Slider;
    } else if (string == "spinbutton") {
      result = Role::Spinbutton;
    } else if (string == "status") {
      result = Role::Status;
    } else if (string == "summary") {
      result = Role::Summary;
    } else if (string == "switch") {
      result = Role::Switch;
    } else if (string == "tab") {
      result = Role::Tab;
    } else if (string == "table") {
      result = Role::Table;
    } else if (string == "tablist") {
      result = Role::Tablist;
    } else if (string == "tabpanel") {
      result = Role::Tabpanel;
    } else if (string == "term") {
      result = Role::Term;
    } else if (string == "timer") {
      result = Role::Timer;
    } else if (string == "toolbar") {
      result = Role::Toolbar;
    } else if (string == "tooltip") {
      result = Role::Tooltip;
    } else if (string == "tree") {
      result = Role::Tree;
    } else if (string == "treegrid") {
      result = Role::Treegrid;
    } else if (string == "treeitem") {
      result = Role::Treeitem;
    } else {
      LOG(ERROR) << "Unsupported Role value: " << string;
      react_native_expect(false);
      // sane default for prod
      result = Role::None;
    }
    return;
  }

  LOG(ERROR) << "Unsupported Role type";
  react_native_expect(false);
  // sane default for prod
  result = Role::None;
}

inline std::string toString(AccessibilityLiveRegion accessibilityLiveRegion)
{
  switch (accessibilityLiveRegion) {
    case AccessibilityLiveRegion::None:
      return "none";
    case AccessibilityLiveRegion::Polite:
      return "polite";
    case AccessibilityLiveRegion::Assertive:
      return "assertive";
  }
}

#if RN_DEBUG_STRING_CONVERTIBLE
inline std::string toString(AccessibilityState::CheckedState state)
{
  switch (state) {
    case AccessibilityState::Unchecked:
      return "Unchecked";
    case AccessibilityState::Checked:
      return "Checked";
    case AccessibilityState::Mixed:
      return "Mixed";
    case AccessibilityState::None:
      return "None";
  }
}

inline std::string toString(const AccessibilityAction &accessibilityAction)
{
  std::string result = accessibilityAction.name;
  if (accessibilityAction.label.has_value()) {
    result += ": '" + accessibilityAction.label.value() + "'";
  }
  return result;
}

inline std::string toString(std::vector<AccessibilityAction> accessibilityActions)
{
  std::string result = "[";
  for (size_t i = 0; i < accessibilityActions.size(); i++) {
    result += toString(accessibilityActions[i]);
    if (i < accessibilityActions.size() - 1) {
      result += ", ";
    }
  }
  result += "]";
  return result;
}

inline std::string toString(const AccessibilityState &accessibilityState)
{
  return "{disabled:" + toString(accessibilityState.disabled) + ",selected:" + toString(accessibilityState.selected) +
      ",checked:" + toString(accessibilityState.checked) + ",busy:" + toString(accessibilityState.busy) +
      ",expanded:" + toString(accessibilityState.expanded) + "}";
}
#endif

} // namespace facebook::react
