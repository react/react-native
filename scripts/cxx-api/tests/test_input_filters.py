# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

import unittest

from ..parser.input_filters.handle_objc_interface_generics import (
    decode_objc_generics,
    encode_objc_interface_generics,
)
from ..parser.input_filters.strip_block_comments import strip_block_comments
from ..parser.input_filters.strip_deprecated_msg import strip_deprecated_msg
from ..parser.input_filters.strip_ns_unavailable import strip_ns_unavailable


class TestDoxygenStripComments(unittest.TestCase):
    def test_strips_single_line_block_comment(self):
        content = "/* comment */ code"
        result = strip_block_comments(content)
        self.assertEqual(result, " code")

    def test_strips_multiline_block_comment(self):
        content = """/**
 * Doc comment
 * with multiple lines
 */
@interface RealInterface
@end"""
        result = strip_block_comments(content)
        # Should preserve 4 newlines (one for each line in the comment)
        self.assertEqual(
            result,
            """\n\n\n
@interface RealInterface
@end""",
        )

    def test_preserves_code_outside_comments(self):
        content = """@interface MyClass
- (void)method;
@end"""
        result = strip_block_comments(content)
        self.assertEqual(result, content)

    def test_strips_comment_with_objc_keywords(self):
        """This is the main use case - stripping comments that contain @interface etc."""
        content = """/**
 * Example:
 *   @interface RCT_EXTERN_MODULE(MyModule, NSObject)
 *   @end
 */
@interface RealInterface
@end"""
        result = strip_block_comments(content)
        self.assertNotIn("RCT_EXTERN_MODULE", result)
        self.assertIn("@interface RealInterface", result)

    def test_handles_multiple_comments(self):
        content = """/* first */ code /* second */ more"""
        result = strip_block_comments(content)
        self.assertEqual(result, " code  more")

    def test_handles_empty_content(self):
        result = strip_block_comments("")
        self.assertEqual(result, "")

    def test_handles_no_comments(self):
        content = "just code without comments"
        result = strip_block_comments(content)
        self.assertEqual(result, content)


class TestStripDeprecatedMsg(unittest.TestCase):
    def test_strips_deprecated_msg(self):
        content = '- (void)oldMethod __deprecated_msg("Use newMethod instead.");'
        result = strip_deprecated_msg(content)
        self.assertEqual(result, "- (void)oldMethod ;")

    def test_strips_standalone_deprecated(self):
        content = "- (instancetype)initWithBundleURL:(NSURL *)bundleURL launchOptions:(nullable NSDictionary *)launchOptions __deprecated;"
        result = strip_deprecated_msg(content)
        self.assertEqual(
            result,
            "- (instancetype)initWithBundleURL:(NSURL *)bundleURL launchOptions:(nullable NSDictionary *)launchOptions ;",
        )

    def test_standalone_deprecated_does_not_match_deprecated_msg(self):
        content = '__deprecated_msg("msg") and __deprecated'
        result = strip_deprecated_msg(content)
        self.assertEqual(result, "and ")

    def test_preserves_deprecated_in_identifiers(self):
        content = (
            "- (void)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag;"
        )
        result = strip_deprecated_msg(content)
        self.assertEqual(result, content)

    def test_preserves_DEPRECATED_suffix_in_names(self):
        content = "@property (weak) RCTViewRegistry *viewRegistry_DEPRECATED;"
        result = strip_deprecated_msg(content)
        self.assertEqual(result, content)

    def test_handles_no_deprecated(self):
        content = "- (void)normalMethod;"
        result = strip_deprecated_msg(content)
        self.assertEqual(result, content)

    def test_handles_empty_content(self):
        result = strip_deprecated_msg("")
        self.assertEqual(result, "")

    def test_strips_deprecated_before_interface(self):
        content = '__deprecated_msg("This API will be removed.") @interface RCTSurface : NSObject'
        result = strip_deprecated_msg(content)
        self.assertEqual(result, "@interface RCTSurface : NSObject")


class TestStripNSUnavailable(unittest.TestCase):
    def test_strips_single_line_init(self):
        content = "- (instancetype)init NS_UNAVAILABLE;"
        result = strip_ns_unavailable(content)
        self.assertEqual(result, "")

    def test_strips_single_line_new(self):
        content = "+ (instancetype)new NS_UNAVAILABLE;"
        result = strip_ns_unavailable(content)
        self.assertEqual(result, "")

    def test_strips_init_with_frame(self):
        content = "- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;"
        result = strip_ns_unavailable(content)
        self.assertEqual(result, "")

    def test_strips_property(self):
        content = "@property (nonatomic, copy, nullable) NSString *text NS_UNAVAILABLE;"
        result = strip_ns_unavailable(content)
        self.assertEqual(result, "")

    def test_strips_method_with_params(self):
        content = (
            "- (void)insertSubview:(UIView *)view atIndex:(NSInteger)index"
            " NS_UNAVAILABLE;"
        )
        result = strip_ns_unavailable(content)
        self.assertEqual(result, "")

    def test_strips_multiline_declaration(self):
        content = (
            "- (instancetype)initWithSurface:(id<RCTSurfaceProtocol>)surface\n"
            "                sizeMeasureMode:(RCTSurfaceSizeMeasureMode)"
            "sizeMeasureMode NS_UNAVAILABLE;"
        )
        result = strip_ns_unavailable(content)
        # Should preserve line count (2 lines -> 1 newline)
        self.assertEqual(result, "\n")

    def test_preserves_normal_methods(self):
        content = "- (instancetype)initWithBridge:(RCTBridge *)bridge;"
        result = strip_ns_unavailable(content)
        self.assertEqual(result, content)

    def test_preserves_normal_properties(self):
        content = "@property (nonatomic, strong) NSString *name;"
        result = strip_ns_unavailable(content)
        self.assertEqual(result, content)

    def test_preserves_designated_initializer(self):
        content = (
            "- (instancetype)initWithName:(NSString *)name NS_DESIGNATED_INITIALIZER;"
        )
        result = strip_ns_unavailable(content)
        self.assertEqual(result, content)

    def test_does_not_strip_across_semicolons(self):
        content = (
            "- (void)normalMethod;\n"
            "- (instancetype)init NS_UNAVAILABLE;\n"
            "- (void)anotherMethod;"
        )
        result = strip_ns_unavailable(content)
        self.assertEqual(result, "- (void)normalMethod;\n\n- (void)anotherMethod;")

    def test_strips_multiple_unavailable_methods(self):
        content = (
            "- (instancetype)init NS_UNAVAILABLE;\n+ (instancetype)new NS_UNAVAILABLE;"
        )
        result = strip_ns_unavailable(content)
        self.assertEqual(result, "\n")

    def test_handles_empty_content(self):
        result = strip_ns_unavailable("")
        self.assertEqual(result, "")

    def test_preserves_line_count(self):
        content = (
            "@interface RCTHost : NSObject\n"
            "- (instancetype)init NS_UNAVAILABLE;\n"
            "+ (instancetype)new NS_UNAVAILABLE;\n"
            "- (void)start;\n"
            "@end"
        )
        result = strip_ns_unavailable(content)
        self.assertEqual(result.count("\n"), content.count("\n"))

    def test_handles_leading_whitespace(self):
        content = "    - (instancetype)init NS_UNAVAILABLE;"
        result = strip_ns_unavailable(content)
        self.assertEqual(result, "")


class TestEncodeObjcInterfaceGenerics(unittest.TestCase):
    def test_single_generic_param(self):
        content = "@interface Foo<T> : NSObject\n@end"
        result = encode_objc_interface_generics(content)
        self.assertEqual(
            result,
            "@interface Foo__GENERICS__T__ENDGENERICS__ : NSObject\n@end",
        )

    def test_two_generic_params(self):
        content = "@interface MyMap<K, V> : NSObject\n@end"
        result = encode_objc_interface_generics(content)
        self.assertEqual(
            result,
            "@interface MyMap__GENERICS__K__COMMA__V__ENDGENERICS__ : NSObject\n@end",
        )

    def test_protocol_conformance_not_encoded(self):
        content = "@interface Foo : NSObject <NSCopying>"
        result = encode_objc_interface_generics(content)
        self.assertEqual(result, content)

    def test_interface_without_generics(self):
        content = "@interface MyClass : NSObject\n- (void)method;\n@end"
        result = encode_objc_interface_generics(content)
        self.assertEqual(result, content)

    def test_multiple_interfaces_both_with_generics(self):
        content = (
            "@interface Foo<T> : NSObject\n@end\n\n"
            "@interface Bar<K, V> : NSObject\n@end"
        )
        result = encode_objc_interface_generics(content)
        self.assertIn("__GENERICS__T__ENDGENERICS__", result)
        self.assertIn("__GENERICS__K__COMMA__V__ENDGENERICS__", result)


class TestDecodeObjcGenerics(unittest.TestCase):
    def test_single_generic_param(self):
        result = decode_objc_generics("Foo__GENERICS__T__ENDGENERICS__")
        self.assertEqual(result, "Foo<T>")

    def test_two_generic_params(self):
        result = decode_objc_generics("MyMap__GENERICS__K__COMMA__V__ENDGENERICS__")
        self.assertEqual(result, "MyMap<K, V>")

    def test_roundtrip_single_generic(self):
        content = "@interface Foo<T> : NSObject\n@end"
        encoded = encode_objc_interface_generics(content)
        # Extract the encoded class name (between "@interface " and " :")
        encoded_name = encoded.split("@interface ")[1].split(" :")[0]
        decoded_name = decode_objc_generics(encoded_name)
        self.assertEqual(decoded_name, "Foo<T>")

    def test_roundtrip_multiple_generics(self):
        content = "@interface MyMap<K, V> : NSObject\n@end"
        encoded = encode_objc_interface_generics(content)
        encoded_name = encoded.split("@interface ")[1].split(" :")[0]
        decoded_name = decode_objc_generics(encoded_name)
        self.assertEqual(decoded_name, "MyMap<K, V>")


if __name__ == "__main__":
    unittest.main()
