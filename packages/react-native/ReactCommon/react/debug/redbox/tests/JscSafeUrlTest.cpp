/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/debug/redbox/JscSafeUrl.h>

using namespace facebook::react::unstable_redbox;

// --- toNormalUrl ---

// Rewrites urls treating //& in paths as ?
TEST(JscSafeUrlTest, ToNormalUrl_RewritesMarkerInAbsolutePath) {
  EXPECT_EQ(
      toNormalUrl("/path1/path2//&foo=bar?bar=baz#frag?"),
      "/path1/path2?foo=bar&bar=baz#frag?");
  // Idempotent
  EXPECT_EQ(
      toNormalUrl("/path1/path2?foo=bar&bar=baz#frag?"),
      "/path1/path2?foo=bar&bar=baz#frag?");
}

TEST(JscSafeUrlTest, ToNormalUrl_RewritesMarkerInRelativePathWithEncoding) {
  EXPECT_EQ(
      toNormalUrl("relative/path/with%3B%26/encoded//&foo=bar?bar=baz#frag?"),
      "relative/path/with%3B%26/encoded?foo=bar&bar=baz#frag?");
  EXPECT_EQ(
      toNormalUrl("relative/path/with%3B%26/encoded?foo=bar&bar=baz#frag?"),
      "relative/path/with%3B%26/encoded?foo=bar&bar=baz#frag?");
}

TEST(JscSafeUrlTest, ToNormalUrl_RewritesMarkerInFullUrl) {
  EXPECT_EQ(
      toNormalUrl(
          "https://user:password@mydomain.com:8080/path1/path2//&foo=bar?bar=baz#frag?"),
      "https://user:password@mydomain.com:8080/path1/path2?foo=bar&bar=baz#frag?");
  EXPECT_EQ(
      toNormalUrl(
          "https://user:password@mydomain.com:8080/path1/path2?foo=bar&bar=baz#frag?"),
      "https://user:password@mydomain.com:8080/path1/path2?foo=bar&bar=baz#frag?");
}

TEST(JscSafeUrlTest, ToNormalUrl_RewritesMarkerWithoutFragment) {
  EXPECT_EQ(
      toNormalUrl("http://127.0.0.1/path1/path2//&foo=bar&bar=baz"),
      "http://127.0.0.1/path1/path2?foo=bar&bar=baz");
  EXPECT_EQ(
      toNormalUrl("http://127.0.0.1/path1/path2?foo=bar&bar=baz"),
      "http://127.0.0.1/path1/path2?foo=bar&bar=baz");
}

// Returns other strings exactly as given
TEST(JscSafeUrlTest, ToNormalUrl_PassthroughForQueryWithMarkerAfter) {
  auto url = "http://user:password/@mydomain.com/foo?bar=zoo?baz=quux//&";
  EXPECT_EQ(toNormalUrl(url), url);
}

TEST(JscSafeUrlTest, ToNormalUrl_PassthroughForSimpleQuery) {
  auto url = "/foo?bar=zoo?baz=quux";
  EXPECT_EQ(toNormalUrl(url), url);
}

TEST(JscSafeUrlTest, ToNormalUrl_PassthroughForOpaqueUri) {
  auto url = "proto:arbitrary_bad_url";
  EXPECT_EQ(toNormalUrl(url), url);
}

TEST(JscSafeUrlTest, ToNormalUrl_PassthroughForStar) {
  EXPECT_EQ(toNormalUrl("*"), "*");
}

TEST(JscSafeUrlTest, ToNormalUrl_PassthroughForRelativePath) {
  auto url = "relative/path";
  EXPECT_EQ(toNormalUrl(url), url);
}

// --- toJscSafeUrl ---

// Replaces the first ? with a JSC-friendly delimiter, url-encodes subsequent
// ?, and is idempotent
TEST(JscSafeUrlTest, ToJscSafeUrl_FullUrlWithEncodedQuestionMark) {
  auto input =
      "https://user:password@mydomain.com:8080/path1/path2?foo=bar&bar=question?#frag?";
  auto output =
      "https://user:password@mydomain.com:8080/path1/path2//&foo=bar&bar=question%3F#frag?";
  EXPECT_EQ(toJscSafeUrl(input), output);
  EXPECT_EQ(toJscSafeUrl(output), output);
}

TEST(JscSafeUrlTest, ToJscSafeUrl_SimpleUrl) {
  auto input = "http://127.0.0.1/path1/path2?foo=bar";
  auto output = "http://127.0.0.1/path1/path2//&foo=bar";
  EXPECT_EQ(toJscSafeUrl(input), output);
  EXPECT_EQ(toJscSafeUrl(output), output);
}

TEST(JscSafeUrlTest, ToJscSafeUrl_PassthroughForStar) {
  EXPECT_EQ(toJscSafeUrl("*"), "*");
  EXPECT_EQ(toJscSafeUrl("*"), "*");
}

TEST(JscSafeUrlTest, ToJscSafeUrl_PassthroughForAbsolutePath) {
  EXPECT_EQ(toJscSafeUrl("/absolute/path"), "/absolute/path");
  EXPECT_EQ(toJscSafeUrl("/absolute/path"), "/absolute/path");
}

TEST(JscSafeUrlTest, ToJscSafeUrl_PassthroughForRelativePath) {
  EXPECT_EQ(toJscSafeUrl("relative/path"), "relative/path");
  EXPECT_EQ(toJscSafeUrl("relative/path"), "relative/path");
}

TEST(JscSafeUrlTest, ToJscSafeUrl_EmptyQueryDropped) {
  EXPECT_EQ(toJscSafeUrl("/?"), "/");
  EXPECT_EQ(toJscSafeUrl("/"), "/");
}

TEST(JscSafeUrlTest, ToJscSafeUrl_PassthroughForUrlWithoutQuery) {
  auto url = "http://127.0.0.1/path1/path";
  EXPECT_EQ(toJscSafeUrl(url), url);
  EXPECT_EQ(toJscSafeUrl(url), url);
}

TEST(JscSafeUrlTest, ToJscSafeUrl_AbsolutePathWithEncodedQuestionMark) {
  auto input = "/path1/path2?foo=bar&bar=question?#frag?";
  auto output = "/path1/path2//&foo=bar&bar=question%3F#frag?";
  EXPECT_EQ(toJscSafeUrl(input), output);
  EXPECT_EQ(toJscSafeUrl(output), output);
}

TEST(JscSafeUrlTest, ToJscSafeUrl_RelativePathWithEncodedQuestionMark) {
  auto input = "relative/path?foo=bar&bar=question?#frag?";
  auto output = "relative/path//&foo=bar&bar=question%3F#frag?";
  EXPECT_EQ(toJscSafeUrl(input), output);
  EXPECT_EQ(toJscSafeUrl(output), output);
}

TEST(JscSafeUrlTest, ToJscSafeUrl_AlreadySafeWithExtraQuery) {
  auto input = "/path1/path2//&foo=bar&bar=question%3F?extra=query#frag?";
  auto output = "/path1/path2//&foo=bar&bar=question%3F&extra=query#frag?";
  EXPECT_EQ(toJscSafeUrl(input), output);
  EXPECT_EQ(toJscSafeUrl(output), output);
}

// Throws on a URL with an empty path and a query string
TEST(JscSafeUrlTest, ToJscSafeUrl_ThrowsForEmptyPathWithQuery) {
  EXPECT_THROW(toJscSafeUrl("http://127.0.0.1?foo=bar"), std::invalid_argument);
  EXPECT_THROW(toJscSafeUrl("http://127.0.0.1?q#hash"), std::invalid_argument);
  EXPECT_THROW(toJscSafeUrl("?foo=bar"), std::invalid_argument);
  EXPECT_THROW(toJscSafeUrl("?foo=/bar#hash"), std::invalid_argument);
  EXPECT_THROW(toJscSafeUrl("/?bar=baz/"), std::invalid_argument);
}

// --- isJscSafeUrl ---

TEST(JscSafeUrlTest, IsJscSafeUrl_TrueForSafeUrls) {
  EXPECT_TRUE(isJscSafeUrl("http://example.com//&foo=bar//#frag=//"));
  EXPECT_TRUE(isJscSafeUrl("http://example.com/with/path//&foo=bar//#frag=//"));
  EXPECT_TRUE(isJscSafeUrl("//&foo=bar//#frag=//"));
  EXPECT_TRUE(isJscSafeUrl("relative/path///&foo=bar//&#frag=//&"));
  EXPECT_TRUE(isJscSafeUrl("/absolute/path//&foo=bar//&#frag=//&"));
}

TEST(JscSafeUrlTest, IsJscSafeUrl_FalseForNormalUrls) {
  EXPECT_FALSE(isJscSafeUrl("http://example.com?foo=bar//&#frag=//"));
  EXPECT_FALSE(
      isJscSafeUrl("http://example.com/with/path/?foo=bar//&#frag=//"));
  EXPECT_FALSE(isJscSafeUrl("?foo=bar//&#frag=//&"));
  EXPECT_FALSE(isJscSafeUrl("relative/path/?foo=bar//#frag=//"));
  EXPECT_FALSE(isJscSafeUrl("/absolute/path/?foo=bar//&#frag=//"));
}
