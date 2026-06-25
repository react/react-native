# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING

from ..template import Template, TemplateList
from .base_scope_kind import ScopeKind
from .extendable import Extendable

if TYPE_CHECKING:
    from .scope import Scope


class StructLikeScopeKind(ScopeKind, Extendable):
    class Type(Enum):
        CLASS = "class"
        STRUCT = "struct"
        UNION = "union"

    def __init__(
        self, type: Type, specialization_args: list[str] | None = None
    ) -> None:
        ScopeKind.__init__(self, type.value)
        Extendable.__init__(self)

        self.template_list: TemplateList | None = None
        self.specialization_args = specialization_args

    def add_template(self, template: Template | [Template]) -> None:
        if template and self.template_list is None:
            self.template_list = TemplateList()

        if isinstance(template, list):
            for t in template:
                self.template_list.add(t)
        else:
            self.template_list.add(template)

    def close(self, scope: Scope) -> None:
        self._remove_merged_primary_bases(scope)
        self.qualify_base_classes(scope)

    def _remove_merged_primary_bases(self, scope: Scope) -> None:
        """Remove base classes that Doxygen incorrectly merged from the
        primary template into a partial specialization.

        In C++ a partial specialization's inheritance list completely
        replaces the primary template's, but Doxygen merges both lists
        into the specialization's ``basecompoundref`` elements.

        This method performs count-based subtraction: for each base in
        the primary template, one matching occurrence (by name) is removed
        from this specialization's base list.  Count-based subtraction
        correctly preserves bases that the specialization explicitly
        re-inherits from the same class as the primary template.
        """
        if self.specialization_args is None:
            return
        if scope.parent_scope is None:
            return

        for sibling in scope.parent_scope.inner_scopes.values():
            if (
                sibling is not scope
                and sibling.name == scope.name
                and isinstance(sibling.kind, StructLikeScopeKind)
                and sibling.kind.specialization_args is None
            ):
                primary_base_counts: dict[str, int] = {}
                for b in sibling.kind.base_classes:
                    primary_base_counts[b.name] = primary_base_counts.get(b.name, 0) + 1

                result = []
                for b in self.base_classes:
                    if primary_base_counts.get(b.name, 0) > 0:
                        primary_base_counts[b.name] -= 1
                    else:
                        result.append(b)
                self.base_classes = result
                break

    def to_string(self, scope: Scope) -> str:
        result = ""

        if self.template_list is not None:
            result += "\n" + self.template_list.to_string() + "\n"

        inheritance = self.get_inheritance_string()
        result += f"{self.name} {scope.get_qualified_name()}{inheritance} "
        result += self._format_scope_body(scope)
        return result
