# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from .base import Member, MemberKind, STORE_INITIALIZERS_IN_SNAPSHOT


class EnumMember(Member):
    def __init__(self, name: str, value: str | None) -> None:
        super().__init__(name, "public")
        self.value: str | None = value

    @property
    def member_kind(self) -> MemberKind:
        return MemberKind.CONSTANT

    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        name = self._get_qualified_name(qualification)

        if not STORE_INITIALIZERS_IN_SNAPSHOT or self.value is None:
            return " " * indent + f"{name}"

        return " " * indent + f"{name} = {self.value}"
