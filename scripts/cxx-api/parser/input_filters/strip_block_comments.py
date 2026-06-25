#!/usr/bin/env fbpython
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import re


def strip_block_comments(content: str) -> str:
    """
    Remove all block comments (/* ... */ and /** ... */) from content.
    Preserves line count by replacing comment content with newlines.
    """

    def replace_with_newlines(match: re.Match) -> str:
        # Count newlines in original comment to preserve line numbers
        newline_count = match.group().count("\n")
        return "\n" * newline_count

    # Pattern to match block comments (non-greedy)
    comment_pattern = re.compile(r"/\*[\s\S]*?\*/")

    return comment_pattern.sub(replace_with_newlines, content)
