#!/usr/bin/env fbpython
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import re


def strip_deprecated_msg(content: str) -> str:
    """
    Remove __deprecated_msg(...) macros and standalone __deprecated annotations
    from content.

    These macros cause Doxygen to produce malformed XML output when they appear
    before @interface declarations, creating __pad0__ artifacts and missing
    members. Standalone __deprecated on method declarations causes the annotation
    to be parsed as a parameter name. Since the macros are stripped, deprecation
    info won't appear in the API snapshot output.
    """
    # Pattern to match __deprecated_msg("...") with any content inside quotes
    pattern = re.compile(r'__deprecated_msg\s*\(\s*"[^"]*"\s*\)\s*')
    content = pattern.sub("", content)

    # Pattern to match standalone __deprecated (not followed by _msg or other suffix)
    standalone_pattern = re.compile(r"\b__deprecated\b(?!_)\s*")
    content = standalone_pattern.sub("", content)

    return content
