# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from .base import Member, MemberKind


class FriendMember(Member):
    def __init__(self, name: str, visibility: str = "public") -> None:
        super().__init__(name, visibility)

    @property
    def member_kind(self) -> MemberKind:
        return MemberKind.FRIEND

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
        result += f"friend {name};"
        return result
