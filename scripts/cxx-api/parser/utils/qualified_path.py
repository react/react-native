# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from .text_resolution import normalize_angle_brackets


def parse_qualified_path(path: str) -> list[str]:
    """
    Parse a qualified path into a list of names.

    Handles template syntax correctly by not splitting on "::" inside
    angle brackets. For example:
    - "std::vector<std::string>::test" -> ["std", "vector<std::string>", "test"]
    - "ns::Foo<A, B>::Bar" -> ["ns", "Foo<A, B>", "Bar"]

    Also handles edge cases:
    - Comparison operators inside parentheses: "std::enable_if<(N > 0)>::type"
    - Arrow operators: "decltype(ptr->member)::type"
    - Bitshift operators: "std::integral_constant<int, (1 >> 2)>::value"

    Normalizes angle bracket spacing (e.g., "Foo< Bar >" -> "Foo<Bar>").
    """
    # Normalize angle bracket spacing before parsing
    path = normalize_angle_brackets(path)

    result = []
    current = ""
    angle_depth = 0
    paren_depth = 0
    i = 0

    while i < len(path):
        char = path[i]

        if char == "(":
            paren_depth += 1
            current += char
            i += 1
        elif char == ")":
            paren_depth -= 1
            current += char
            i += 1
        elif char == "<" and paren_depth == 0:
            angle_depth += 1
            current += char
            i += 1
        elif char == ">" and paren_depth == 0:
            # Check for arrow operator "->" which should not affect angle_depth
            if i > 0 and path[i - 1] == "-":
                current += char
                i += 1
            else:
                angle_depth -= 1
                current += char
                i += 1
        elif path[i : i + 2] == "::" and angle_depth == 0 and paren_depth == 0:
            if current:
                result.append(current)
            current = ""
            i += 2
        else:
            current += char
            i += 1

    if current:
        result.append(current)

    return result
