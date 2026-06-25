#!/usr/bin/env fbpython
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import re


def strip_ns_unavailable(content: str) -> str:
    """
    Remove method and property declarations marked NS_UNAVAILABLE from content.

    NS_UNAVAILABLE marks methods/properties that are explicitly not part of the
    public API — they exist only to produce compile errors when called. Including
    them in the API snapshot is misleading, so we strip the entire declaration.
    Preserves line count by replacing matched declarations with newlines.
    """

    def replace_with_newlines(match: re.Match) -> str:
        return "\n" * match.group().count("\n")

    # Match ObjC method (-/+) or @property declarations ending with NS_UNAVAILABLE;
    # [^;]*? is non-greedy and cannot cross past a prior declaration's semicolon,
    # but [^;] *does* match newlines, so multi-line declarations are handled.
    pattern = re.compile(
        r"^[ \t]*(?:[-+]|@property\b)[^;]*?NS_UNAVAILABLE\s*;[ \t]*$",
        re.MULTILINE,
    )
    return pattern.sub(replace_with_newlines, content)
