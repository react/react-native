#!/usr/bin/env fbpython
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# pyre-strict

"""Rewrite default return values in ReactNativeFeatureFlagsDefaults.h.

Reads the header from --input, writes the transformed header to stdout.
Overrides are passed as a JSON object via --overrides.
Fails with a non-zero exit code if any requested flag is not found.
"""

from __future__ import annotations

import argparse
import json
import re
import sys

import tree_sitter_cpp
from tree_sitter import Language, Parser, Query, QueryCursor


_TARGET_CLASS = "ReactNativeFeatureFlagsDefaults"


def _method_query(names: set[str]) -> str:
    alternation = "|".join(re.escape(n) for n in sorted(names))
    return f"""
(class_specifier
    name: (type_identifier) @class_name
    body: (field_declaration_list
        (function_definition
            declarator: (function_declarator
                declarator: (field_identifier) @method_name)
            body: (compound_statement
                (return_statement (_) @return_value)))
    )
    (#eq? @class_name "{_TARGET_CLASS}")
    (#match? @method_name "^({alternation})$")
)
"""


def cxx_literal(value: bool | int | float) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        s = str(value)
        if isinstance(value, int) or "." not in s:
            s += ".0"
        return s
    raise ValueError(f"Unsupported value type {type(value).__name__} for override")


def rewrite(source: bytes, overrides: dict[str, object]) -> bytes:
    lang = Language(tree_sitter_cpp.language())
    tree = Parser(lang).parse(source)
    matches = QueryCursor(Query(lang, _method_query(overrides.keys()))).matches(
        tree.root_node
    )

    matched: set[str] = set()
    replacements: list[tuple[int, int, bytes]] = []

    for _, match in matches:
        method_node = match["method_name"][0]
        name = source[method_node.start_byte : method_node.end_byte].decode("utf-8")
        rv_node = match["return_value"][0]
        replacements.append(
            (
                rv_node.start_byte,
                rv_node.end_byte,
                cxx_literal(overrides[name]).encode("utf-8"),
            )
        )
        matched.add(name)

    unmatched = set(overrides.keys()) - matched
    if unmatched:
        raise ValueError(f"Unmatched flags: {', '.join(sorted(unmatched))}")

    result = bytearray()
    pos = 0
    for start, end, replacement in replacements:
        result.extend(source[pos:start])
        result.extend(replacement)
        pos = end
    result.extend(source[pos:])

    return bytes(result)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--overrides", default="{}")
    parser.add_argument("--input", required=True)
    args = parser.parse_args()

    overrides: dict[str, object] = json.loads(args.overrides)
    with open(args.input, "rb") as f:
        source = f.read()

    sys.stdout.buffer.write(rewrite(source, overrides))


if __name__ == "__main__":
    main()
