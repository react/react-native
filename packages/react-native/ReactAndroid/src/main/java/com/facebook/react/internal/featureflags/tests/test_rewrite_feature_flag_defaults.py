# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# pyre-strict

from __future__ import annotations

import os
import unittest

from rewrite_feature_flag_defaults import kotlin_literal, rewrite


def _load_source() -> bytes:
    with open(os.environ["SOURCE_PATH"], "rb") as f:
        return f.read()


class RewriteFeatureFlagDefaultsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.source = _load_source()

    def test_empty_overrides_is_passthrough(self) -> None:
        self.assertEqual(rewrite(self.source, {}), self.source)

    def test_override_bool_to_true(self) -> None:
        result = rewrite(self.source, {"commonTestFlag": True})
        self.assertEqual(self._method_value(result, "commonTestFlag"), b"true")

    def test_override_bool_to_false(self) -> None:
        result = rewrite(self.source, {"commonTestFlag": False})
        self.assertEqual(self._method_value(result, "commonTestFlag"), b"false")

    def test_kotlin_literal_int_produces_double(self) -> None:
        self.assertEqual(kotlin_literal(42), "42.0")

    def test_kotlin_literal_float(self) -> None:
        self.assertEqual(kotlin_literal(3.14), "3.14")

    def test_unmatched_flag_raises(self) -> None:
        with self.assertRaises(ValueError):
            rewrite(self.source, {"bogusFlag": True})

    def test_only_target_method_changes(self) -> None:
        result = rewrite(self.source, {"commonTestFlag": True})
        src_start, src_end = self._method_value_range(self.source, "commonTestFlag")
        res_start, res_end = self._method_value_range(result, "commonTestFlag")
        self.assertEqual(self.source[:src_start], result[:res_start])
        self.assertEqual(self.source[src_end:], result[res_end:])

    def _method_value_range(self, source: bytes, name: str) -> tuple[int, int]:
        name_idx = source.find(name.encode())
        self.assertNotEqual(name_idx, -1, f"{name} not found in output")
        eq_idx = source.find(b"=", name_idx)
        eol_idx = source.find(b"\n", eq_idx)
        start = eq_idx + 2  # skip "= "
        return (start, eol_idx)

    def _method_value(self, source: bytes, name: str) -> bytes:
        start, end = self._method_value_range(source, name)
        return source[start:end].strip()
