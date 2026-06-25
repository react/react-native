# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from typing import TYPE_CHECKING

from .base_scope_kind import ScopeKind
from .extendable import Extendable

if TYPE_CHECKING:
    from .scope import Scope


class ProtocolScopeKind(ScopeKind, Extendable):
    def __init__(self) -> None:
        ScopeKind.__init__(self, "protocol")
        Extendable.__init__(self)

    def close(self, scope: Scope) -> None:
        self.qualify_base_classes(scope)

    def to_string(self, scope: Scope) -> str:
        inheritance = self.get_inheritance_string()
        header = f"{self.name} {scope.get_qualified_name()}{inheritance} "
        return header + self._format_scope_body(scope)
