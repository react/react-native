# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from typing import TYPE_CHECKING

from .base import Member, MemberKind

if TYPE_CHECKING:
    from ..scope import Scope


class ConceptMember(Member):
    def __init__(
        self,
        name: str,
        constraint: str,
    ) -> None:
        super().__init__(name, "public")
        self.constraint: str = self._normalize_constraint(constraint)

    @property
    def member_kind(self) -> MemberKind:
        return MemberKind.CONCEPT

    @staticmethod
    def _normalize_constraint(constraint: str) -> str:
        """
        Normalize the whitespace in a concept constraint expression.

        Doxygen preserves original source indentation, which becomes
        inconsistent when we flatten namespaces and use qualified names.
        This method normalizes the indentation by dedenting all lines
        to the minimum non-empty indentation level.
        """
        if not constraint:
            return constraint

        lines = constraint.split("\n")
        if len(lines) <= 1:
            return constraint.strip()

        # Find minimum indentation (excluding the first line and empty lines)
        min_indent = float("inf")
        for line in lines[1:]:
            stripped = line.lstrip()
            if stripped:  # Skip empty lines
                indent = len(line) - len(stripped)
                min_indent = min(min_indent, indent)

        if min_indent == float("inf"):
            min_indent = 0

        # Dedent all lines by the minimum indentation
        result_lines = [lines[0].strip()]
        for line in lines[1:]:
            if line.strip():  # Non-empty line
                # Remove the minimum indentation to normalize
                dedented = (
                    line[int(min_indent) :]
                    if len(line) >= min_indent
                    else line.lstrip()
                )
                result_lines.append(dedented.rstrip())
            else:
                result_lines.append("")

        # Check if no line is indented
        if all(not line.startswith(" ") for line in result_lines):
            # Re-indent all lines but the first by 2 spaces
            not_indented = result_lines
            result_lines = [not_indented[0]]
            for line in not_indented[1:]:
                if line.strip():  # Non-empty line
                    result_lines.append("  " + line)
                else:
                    result_lines.append("")

        return "\n".join(result_lines)

    def close(self, scope: Scope):
        # TODO: handle unqualified references
        pass

    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        name = self._get_qualified_name(qualification)
        result = ""

        if self.template_list is not None:
            result += " " * indent + self.template_list.to_string() + "\n"

        result += " " * indent + f"concept {name} = {self.constraint};"

        return result
