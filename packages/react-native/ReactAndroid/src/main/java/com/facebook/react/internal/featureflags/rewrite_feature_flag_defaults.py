#!/usr/bin/env fbpython
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# pyre-strict

"""Rewrite default return values in ReactNativeFeatureFlagsDefaults.kt.

Reads the Kotlin source from --input, writes the transformed source to stdout.
Overrides are passed as a JSON object via --overrides.
Fails with a non-zero exit code if any requested flag is not found.
"""

from __future__ import annotations

import argparse
import json
import re
import sys


def kotlin_literal(value: bool | int | float) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        s = str(value)
        if isinstance(value, int) or "." not in s:
            s += ".0"
        return s
    raise ValueError(f"Unsupported value type {type(value).__name__} for override")


def rewrite(source: bytes, overrides: dict[str, object]) -> bytes:
    text = source.decode("utf-8")
    for name, value in overrides.items():
        kotlin_type = "Boolean" if isinstance(value, bool) else "Double"
        pattern = rf"""
            (
                override \s+ fun \s+
                {re.escape(name)}
                \s* \( \s* \)
                \s* : \s* {kotlin_type}
                \s* = \s*
            )
            \S+
        """
        text, n = re.subn(
            pattern,
            rf"\g<1>{kotlin_literal(value)}",
            text,
            count=1,
            flags=re.VERBOSE,
        )
        if n != 1:
            raise ValueError(f"{name} not matched")

    return text.encode("utf-8")


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
