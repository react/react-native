# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# pyre-strict

from __future__ import annotations

import os
import unittest

from rewrite_feature_flag_defaults import cxx_literal, rewrite


def _load_header() -> bytes:
    with open(os.environ["HEADER_PATH"], "rb") as f:
        return f.read()


class RewriteFeatureFlagDefaultsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.source = _load_header()

    def test_empty_overrides_is_passthrough(self) -> None:
        self.assertEqual(rewrite(self.source, {}), self.source)

    def test_override_bool_to_true(self) -> None:
        result = rewrite(self.source, {"commonTestFlag": True})
        start, end = self._method_body_range(result, "commonTestFlag")
        self.assertIn(b"return true;", result[start:end])

    def test_override_bool_to_false(self) -> None:
        result = rewrite(self.source, {"commonTestFlag": False})
        start, end = self._method_body_range(result, "commonTestFlag")
        self.assertIn(b"return false;", result[start:end])

    def test_cxx_literal_int_produces_double(self) -> None:
        self.assertEqual(cxx_literal(42), "42.0")

    def test_cxx_literal_float(self) -> None:
        self.assertEqual(cxx_literal(3.14), "3.14")

    def test_unmatched_flag_raises(self) -> None:
        with self.assertRaises(ValueError):
            rewrite(self.source, {"bogusFlag": True})

    def test_only_target_method_body_changes(self) -> None:
        result = rewrite(self.source, {"commonTestFlag": True})
        src_start, src_end = self._method_body_range(self.source, "commonTestFlag")
        res_start, res_end = self._method_body_range(result, "commonTestFlag")
        self.assertEqual(self.source[:src_start], result[:res_start])
        self.assertEqual(self.source[src_end:], result[res_end:])

    def _method_body_range(self, source: bytes, name: str) -> tuple[int, int]:
        idx = source.find(name.encode())
        self.assertNotEqual(idx, -1, f"{name} not found in output")
        open_brace = source.find(b"{", idx)
        close_brace = source.find(b"}", open_brace)
        return (open_brace, close_brace + 1)
