/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <react/renderer/components/image/ImageProps.h>
#include <react/test_utils/PropsPayloads.h>

#ifdef RN_SERIALIZABLE_STATE

namespace facebook::react {

namespace {

using folly::dynamic;

// Props 2.0 serializes every field of a source, JS only the ones it sets.
void expectPayloads(const std::vector<PropsCommit>& commits) {
  expectPayloadsMatchRawProps<ImageProps>(commits, {"source"});
}

} // namespace

// ReactImageView.setSource reads width and height at the top level of each
// source when there are several, and ReactImageManager reads the request
// headers from the top-level headers prop, which JS derives from the first
// source.
TEST(ImagePropsDiffTest, multipleSourcesCarrySizesAndHeaders) {
  dynamic headers = dynamic::object("Authorization", "token");
  expectPayloads({{dynamic::object(
      "source",
      dynamic::array(
          dynamic::object("uri", "https://a")("width", 10)("height", 20)(
              "headers", headers),
          dynamic::object("uri", "https://b")("width", 30)("height", 40)))(
      "headers", headers)}});
}

// ReactImageManager ignores a null headers prop, so only an empty map clears
// the headers of the previous source.
TEST(ImagePropsDiffTest, clearsHeadersWhenTheNewSourceHasNone) {
  dynamic headers = dynamic::object("Authorization", "old");
  expectPayloads({
      {dynamic::object(
          "source",
          dynamic::array(
              dynamic::object("uri", "https://a")("headers", headers)))(
          "headers", headers)},
      {dynamic::object(
           "source", dynamic::array(dynamic::object("uri", "https://b")))(
           "headers", nullptr),
       dynamic::object("headers", dynamic::object())},
  });
}

// ReactImageManager clears the tint only for null; 0 is a transparent SRC_IN
// tint that hides the image.
TEST(ImagePropsDiffTest, removingTintColorEmitsNull) {
  expectPayloads({
      {dynamic::object("tintColor", static_cast<int32_t>(0xFFFF0000))},
      {dynamic::object("tintColor", nullptr)},
  });
}

// ReactImageView reads the cache policy and the sizes of each source, and
// ReactImageManager the headers; a source with the same URI can change them.
TEST(ImagePropsDiffTest, emitsASameUriSourceWhenItsOtherFieldsChange) {
  dynamic headers = dynamic::object("Authorization", "old");
  dynamic source = dynamic::object("uri", "https://a")("width", 10)(
      "height", 20)("scale", 1)("cache", "default")("headers", headers);
  std::vector<PropsCommit> commits{
      {dynamic::object("source", dynamic::array(source))("headers", headers)}};
  dynamic changes = dynamic::object("cache", "reload")("width", 30)("scale", 2);
  for (const auto& [field, value] : changes.items()) {
    source[field] = value;
    // Props 2.0 sends the first source's headers whenever the sources change.
    commits.push_back(
        {dynamic::object("source", dynamic::array(source)),
         dynamic::object("headers", headers)});
  }
  source["headers"] = dynamic::object("Authorization", "new");
  commits.push_back({dynamic::object("source", dynamic::array(source))(
      "headers", source["headers"])});
  expectPayloads(commits);
}

} // namespace facebook::react

#endif
