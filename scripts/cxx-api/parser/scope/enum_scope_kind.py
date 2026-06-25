# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from typing import TYPE_CHECKING

from .base_scope_kind import ScopeKind

if TYPE_CHECKING:
    from .scope import Scope


class EnumScopeKind(ScopeKind):
    def __init__(self) -> None:
        super().__init__("enum")
        self.type: str | None = None

    def to_string(self, scope: Scope) -> str:
        inheritance_string = f" : {self.type}" if self.type else ""
        header = f"\n{self.name} {scope.get_qualified_name()}{inheritance_string} "
        return header + self._format_scope_body(scope, member_suffix=",")
