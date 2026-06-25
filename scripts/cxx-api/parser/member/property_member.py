# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from .base import Member, MemberKind


class PropertyMember(Member):
    def __init__(
        self,
        name: str,
        type: str,
        visibility: str,
        is_static: bool,
        accessor: str | None,
        is_readable: bool,
        is_writable: bool,
    ) -> None:
        super().__init__(name, visibility)
        self.type: str = type
        self.is_static: bool = is_static
        self.accessor: str | None = accessor
        self.is_readable: bool = is_readable
        self.is_writable: bool = is_writable

    @property
    def member_kind(self) -> MemberKind:
        return MemberKind.VARIABLE

    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        name = self._get_qualified_name(qualification)
        result = " " * indent

        if not hide_visibility:
            result += self.visibility + " "

        attributes = []
        if self.accessor:
            attributes.append(self.accessor)
        if not self.is_writable and self.is_readable:
            attributes.append("readonly")

        attrs_str = f"({', '.join(attributes)}) " if attributes else ""

        if self.is_static:
            result += "static "

        # For block properties, name is embedded in the type (e.g., "void(^eventInterceptor)(args)")
        if name:
            result += f"@property {attrs_str}{self.type} {name};"
        else:
            result += f"@property {attrs_str}{self.type};"

        return result
