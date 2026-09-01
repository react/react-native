/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/element/ComponentBuilder.h>

#include <gtest/gtest.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/RawPropsParser.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/element/Element.h>
#include <react/renderer/element/testUtils.h>

namespace facebook::react {

namespace {

Element<RawTextShadowNode> rawTextElement(const char* text) {
  auto rawTextProps = std::make_shared<RawTextProps>();
  rawTextProps->text = text;
  return Element<RawTextShadowNode>().props(rawTextProps);
}

std::string roundTripTextAlignment(const char* textAlignment) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};
  TextAlignment result = TextAlignment::Natural;
  fromRawValue(parserContext, RawValue{folly::dynamic{textAlignment}}, result);
  return toString(result);
}

TextAttributes nestedTextAttributes(
    const std::shared_ptr<TextProps>& parentProps,
    const std::shared_ptr<TextProps>& childProps) {
  auto builder = simpleComponentBuilder();
  auto shadowNode = builder.build(
      Element<ParagraphShadowNode>().children({
          Element<TextShadowNode>()
              .props(parentProps)
              .children({
                  Element<TextShadowNode>()
                      .props(childProps)
                      .children({rawTextElement("Text")}),
              }),
      }));

  auto baseTextAttributes = TextAttributes::defaultTextAttributes();
  AttributedString output;
  BaseTextShadowNode::Attachments attachments;
  BaseTextShadowNode::buildAttributedString(
      baseTextAttributes, *shadowNode, output, attachments);

  EXPECT_EQ(output.getFragments().size(), 1);
  return output.getFragments()[0].textAttributes;
}

// Builds props through the real raw-prop parse path rather than assigning the
// field directly, so the test exercises the same conversion the runtime does.
std::shared_ptr<TextProps> textPropsWithRawProp(
    const char* name,
    const char* value) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};
  auto rawProps = RawProps(folly::dynamic::object(name, value));
  auto rawPropsParser = RawPropsParser{};
  rawPropsParser.prepare<TextProps>();
  rawProps.parse(rawPropsParser);
  return std::make_shared<TextProps>(parserContext, TextProps{}, rawProps);
}

} // namespace

TEST(BaseTextShadowNodeTest, textAlignmentStartAndEndRoundTrip) {
  EXPECT_EQ(roundTripTextAlignment("start"), "start");
  EXPECT_EQ(roundTripTextAlignment("end"), "end");
}

TEST(BaseTextShadowNodeTest, fragmentsWithDifferentAttributes) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto builder = simpleComponentBuilder();
  auto shadowNode = builder.build(
      Element<ParagraphShadowNode>().children({
          Element<TextShadowNode>()
              .props([]() {
                auto props = std::make_shared<TextProps>();
                props->textAttributes.fontSize = 12;
                return props;
              })
              .children({
                  rawTextElement("First fragment. "),
              }),
          Element<TextShadowNode>()
              .props([]() {
                auto props = std::make_shared<TextProps>();
                props->textAttributes.fontSize = 24;
                return props;
              })
              .children({
                  rawTextElement("Second fragment"),
              }),
      }));

  auto baseTextAttributes = TextAttributes::defaultTextAttributes();
  AttributedString output;
  BaseTextShadowNode::Attachments attachments;
  BaseTextShadowNode::buildAttributedString(
      baseTextAttributes, *shadowNode, output, attachments);

  EXPECT_EQ(output.getString(), "First fragment. Second fragment");

  const auto& fragments = output.getFragments();
  EXPECT_EQ(fragments.size(), 2);
  EXPECT_EQ(fragments[0].textAttributes.fontSize, 12);
  EXPECT_EQ(
      fragments[0].parentShadowView.tag,
      shadowNode->getChildren()[0]->getTag());
  EXPECT_EQ(fragments[1].textAttributes.fontSize, 24);
  EXPECT_EQ(
      fragments[1].parentShadowView.tag,
      shadowNode->getChildren()[1]->getTag());
}

TEST(BaseTextShadowNodeTest, rawTextIsMerged) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto builder = simpleComponentBuilder();
  auto shadowNode = builder.build(
      Element<TextShadowNode>().children({
          rawTextElement("Hello "),
          rawTextElement("World"),
      }));

  auto baseTextAttributes = TextAttributes::defaultTextAttributes();
  AttributedString output;
  BaseTextShadowNode::Attachments attachments;
  BaseTextShadowNode::buildAttributedString(
      baseTextAttributes, *shadowNode, output, attachments);

  EXPECT_EQ(output.getString(), "Hello World");
  EXPECT_EQ(output.getFragments().size(), 1);
}

TEST(BaseTextShadowNodeTest, childInheritsParentFontVariationSettings) {
  auto parentProps = std::make_shared<TextProps>();
  parentProps->textAttributes.fontVariationSettings = "'wght' 650";
  auto childProps = std::make_shared<TextProps>();

  const auto attributes = nestedTextAttributes(parentProps, childProps);

  EXPECT_EQ(attributes.fontVariationSettings, "'wght' 650");
}

TEST(BaseTextShadowNodeTest, childFontVariationSettingsReplaceParentList) {
  auto parentProps = std::make_shared<TextProps>();
  parentProps->textAttributes.fontVariationSettings = "'wght' 650, 'wdth' 90";
  auto childProps = textPropsWithRawProp("fontVariationSettings", "'wdth' 110");

  const auto attributes = nestedTextAttributes(parentProps, childProps);

  EXPECT_EQ(attributes.fontVariationSettings, "'wdth' 110");
}

TEST(
    BaseTextShadowNodeTest,
    childFontWeightCoexistsWithInheritedFontVariationSettings) {
  auto parentProps = std::make_shared<TextProps>();
  parentProps->textAttributes.fontVariationSettings = "'wght' 650";
  auto childProps = std::make_shared<TextProps>();
  childProps->textAttributes.fontWeight = FontWeight::Weight400;

  const auto attributes = nestedTextAttributes(parentProps, childProps);

  EXPECT_EQ(attributes.fontWeight, FontWeight::Weight400);
  EXPECT_EQ(attributes.fontVariationSettings, "'wght' 650");
}

TEST(BaseTextShadowNodeTest, childInheritsParentFontFeatureSettings) {
  auto parentProps = std::make_shared<TextProps>();
  parentProps->textAttributes.fontFeatureSettings = "'ss01'";
  auto childProps = std::make_shared<TextProps>();

  const auto attributes = nestedTextAttributes(parentProps, childProps);

  EXPECT_EQ(attributes.fontFeatureSettings, "'ss01'");
}

TEST(BaseTextShadowNodeTest, childFontFeatureSettingsReplaceParentList) {
  auto parentProps = std::make_shared<TextProps>();
  parentProps->textAttributes.fontFeatureSettings = "'ss01', 'onum'";
  auto childProps = textPropsWithRawProp("fontFeatureSettings", "'tnum'");

  const auto attributes = nestedTextAttributes(parentProps, childProps);

  EXPECT_EQ(attributes.fontFeatureSettings, "'tnum'");
}

// The two properties compose rather than override, so a child setting one must
// still resolve against the other inherited from the parent.
TEST(
    BaseTextShadowNodeTest,
    childFontFeatureSettingsComposeWithInheritedFontVariant) {
  auto parentProps = std::make_shared<TextProps>();
  parentProps->textAttributes.fontVariant = FontVariant::SmallCaps;
  auto childProps = textPropsWithRawProp("fontFeatureSettings", "'ss01'");

  const auto attributes = nestedTextAttributes(parentProps, childProps);

  EXPECT_EQ(attributes.fontVariant, FontVariant::SmallCaps);
  EXPECT_EQ(resolveFontFeatureSettings(attributes), "'smcp', 'ss01'");
}

} // namespace facebook::react
