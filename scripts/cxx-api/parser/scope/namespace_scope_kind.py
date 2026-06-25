# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from typing import TYPE_CHECKING

from natsort import natsorted

from ..member import MemberKind
from .base_scope_kind import ScopeKind

if TYPE_CHECKING:
    from .scope import Scope


class NamespaceScopeKind(ScopeKind):
    def __init__(self) -> None:
        super().__init__("namespace")

    def to_string(self, scope: Scope) -> str:
        qualification = scope.get_qualified_name()

        # Group members by kind
        groups: dict[MemberKind, list[str]] = {kind: [] for kind in MemberKind}

        for member in scope.get_members():
            kind = member.member_kind
            stringified = member.to_string(0, qualification, hide_visibility=True)
            groups[kind].append(stringified)

        # Sort within each group and combine in kind order
        result = []
        for kind in MemberKind:
            sorted_group = natsorted(groups[kind])
            # Deduplicate members with identical signatures.
            sorted_group = list(dict.fromkeys(sorted_group))
            result.extend(sorted_group)

        return "\n".join(result)
