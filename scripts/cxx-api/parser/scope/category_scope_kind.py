# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from typing import TYPE_CHECKING

from .base_scope_kind import ScopeKind

if TYPE_CHECKING:
    from .scope import Scope


class CategoryScopeKind(ScopeKind):
    def __init__(self, class_name: str, category_name: str) -> None:
        super().__init__("category")
        self.class_name: str = class_name
        self.category_name: str = category_name

    def to_string(self, scope: Scope) -> str:
        header = f"{self.name} {self.class_name}({self.category_name}) "
        return header + self._format_scope_body(scope)
