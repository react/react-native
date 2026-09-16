/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/propsConversions.h>

using namespace facebook::react;

namespace {

// Mimics the shape the React Native codegen emits for
// `codegenNativeComponent<NativeProps>(...)` (see
// `react-native-codegen/src/generators/components/GeneratePropsH.js`
// `ClassTemplate`): default ctor, the 3-arg classic ctor with
// `convertRawProp` in its initializer list, public prop fields, and
// NO `setProp` override.
class CodegenStyleProps : public Props {
 public:
  CodegenStyleProps() = default;
  CodegenStyleProps(
      const PropsParserContext& context,
      const CodegenStyleProps& sourceProps,
      const RawProps& rawProps)
      : Props(context, sourceProps, rawProps),
        customField(convertRawProp(
            context,
            rawProps,
            "customField",
            sourceProps.customField,
            0)) {}

  int customField{0};
};

// Mimics a hand-written Props subclass that opts in to the
// iterator-setter path by declaring its own `setProp`.
class HandWrittenSetPropProps : public Props {
 public:
  HandWrittenSetPropProps() = default;
  HandWrittenSetPropProps(
      const PropsParserContext& context,
      const HandWrittenSetPropProps& sourceProps,
      const RawProps& rawProps)
      : Props(context, sourceProps, rawProps),
        customField(sourceProps.customField) {}

  void setProp(
      const PropsParserContext& context,
      RawPropsPropNameHash hash,
      const char* propName,
      const RawValue& value) {
    Props::setProp(context, hash, propName, value);
    switch (hash) {
      case CONSTEXPR_RAW_PROPS_KEY_HASH("customField"):
        fromRawValue(context, value, customField, 0);
        return;
    }
  }

  int customField{0};
};

// A subclass of a hand-written setProp class that does NOT redeclare
// `setProp`. Acts like a downstream specialization (e.g. how
// `ViewShadowNodeProps` extends `ViewProps`). The concept must reject
// this — otherwise the iterator-setter dispatch would silently miss
// `extraField`.
class InheritedSetPropProps : public HandWrittenSetPropProps {
 public:
  InheritedSetPropProps() = default;
  InheritedSetPropProps(
      const PropsParserContext& context,
      const InheritedSetPropProps& sourceProps,
      const RawProps& rawProps)
      : HandWrittenSetPropProps(context, sourceProps, rawProps),
        extraField(sourceProps.extraField) {}

  int extraField{0};
};

// `using Base::setProp;` is sugar — it doesn't constitute "own"
// declaration. Concept must still reject.
class UsingDeclSetPropProps : public HandWrittenSetPropProps {
 public:
  using HandWrittenSetPropProps::setProp;
};

// Concept axioms — fail the build if the iterator-setter dispatch ever
// regresses to silently accepting classes that inherit `setProp`.
static_assert(
    !DeclaresOwnSetProp<CodegenStyleProps>,
    "Codegen'd Props classes don't declare setProp — concept must reject them.");
static_assert(
    !HasSetProp<CodegenStyleProps>,
    "HasSetProp requires DeclaresOwnSetProp.");
static_assert(
    !HasIteratorSetterCtor<CodegenStyleProps>,
    "Codegen'd Props must fall through to the classic cloneProps path. "
    "If this fires, the iterator-setter would skip every field the codegen'd "
    "ctor populates via convertRawProp, leaving the component unrendered.");

static_assert(DeclaresOwnSetProp<HandWrittenSetPropProps>);
static_assert(HasSetProp<HandWrittenSetPropProps>);
static_assert(HasIteratorSetterCtor<HandWrittenSetPropProps>);

static_assert(
    !DeclaresOwnSetProp<InheritedSetPropProps>,
    "A subclass that inherits setProp without redeclaring it must not "
    "satisfy the concept — its new fields would be skipped.");
static_assert(!HasIteratorSetterCtor<InheritedSetPropProps>);

static_assert(
    !DeclaresOwnSetProp<UsingDeclSetPropProps>,
    "`using Base::setProp;` is not an own declaration.");
static_assert(!HasIteratorSetterCtor<UsingDeclSetPropProps>);

// Baselines: `Props` itself owns `setProp`, so it satisfies the concept.
static_assert(DeclaresOwnSetProp<Props>);
static_assert(HasIteratorSetterCtor<Props>);

} // namespace

// gtest entry so the file participates in the test binary (the
// static_asserts above are the real check — this just keeps gtest's
// test discovery happy).
TEST(PropsConceptsTest, ConceptAxiomsCompile) {
  SUCCEED();
}
