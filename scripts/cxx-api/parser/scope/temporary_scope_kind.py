# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from typing import TYPE_CHECKING

from .base_scope_kind import ScopeKind

if TYPE_CHECKING:
    from .scope import Scope


class TemporaryScopeKind(ScopeKind):
    def __init__(self) -> None:
        super().__init__("temporary")

    def to_string(self, scope: Scope) -> str:
        raise RuntimeError("Temporary scope should not be printed")
