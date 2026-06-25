# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, TypeVar

from natsort import natsort_keygen, natsorted

if TYPE_CHECKING:
    from .scope import Scope

# Pre-create natsort key function for efficiency
_natsort_key = natsort_keygen()


class ScopeKind(ABC):
    def __init__(self, name) -> None:
        self.name: str = name

    @abstractmethod
    def to_string(self, scope: Scope) -> str:
        pass

    def close(self, scope: Scope) -> None:
        """Called when the scope is closed. Override to perform cleanup."""
        pass

    def _format_scope_body(self, scope: Scope, member_suffix: str = "") -> str:
        """Format the members list inside a scope's braces."""
        stringified_members = [
            member.to_string(2) + member_suffix for member in scope.get_members()
        ]

        stringified_members = natsorted(stringified_members)
        # Deduplicate members that produce identical signatures (e.g.
        # constructors inherited from multiple bases).
        stringified_members = list(dict.fromkeys(stringified_members))

        result = "{"
        if stringified_members:
            result += "\n" + "\n".join(stringified_members)
        result += "\n}"
        return result

    def print_scope(self, scope: Scope) -> None:
        print(self.to_string(scope))


ScopeKindT = TypeVar("ScopeKindT", bound=ScopeKind)
