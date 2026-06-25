# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from .scope import (
    CategoryScopeKind,
    EnumScopeKind,
    InterfaceScopeKind,
    NamespaceScopeKind,
    ProtocolScopeKind,
    Scope,
    StructLikeScopeKind,
    TemporaryScopeKind,
)
from .utils import parse_qualified_path, split_specialization


class Snapshot:
    def __init__(self) -> None:
        self.root_scope: Scope = Scope(NamespaceScopeKind())

    def ensure_scope(self, scope_path: list[str]) -> Scope:
        """
        Ensure that a scope exists in the snapshot, creating it if necessary.
        """
        current_scope = self.root_scope
        for name in scope_path:
            if name not in current_scope.inner_scopes:
                new_scope = Scope(TemporaryScopeKind(), name)
                new_scope.parent_scope = current_scope
                current_scope.inner_scopes[name] = new_scope
            current_scope = current_scope.inner_scopes[name]
        return current_scope

    def create_struct_like(
        self, qualified_name: str, type: StructLikeScopeKind.Type
    ) -> Scope[StructLikeScopeKind]:
        """
        Create a class in the snapshot.
        """
        path = parse_qualified_path(qualified_name)
        scope_path = path[0:-1]
        scope_name = path[-1]
        current_scope = self.ensure_scope(scope_path)

        base_name, specialization_args = split_specialization(scope_name)

        # Use the full name (including specialization) as the dict key so that
        # base templates and their specializations are distinct entries.
        scope_key = scope_name

        if scope_key in current_scope.inner_scopes:
            scope = current_scope.inner_scopes[scope_key]
            if scope.kind.name == "temporary":
                scope.kind = StructLikeScopeKind(type, specialization_args)
                scope.name = base_name
            else:
                raise RuntimeError(
                    f"Identifier {scope_key} already exists in scope {current_scope.name}"
                )
            return scope
        else:
            new_scope = Scope(StructLikeScopeKind(type, specialization_args), base_name)
            new_scope.parent_scope = current_scope
            current_scope.inner_scopes[scope_key] = new_scope
            return new_scope

    def create_or_get_namespace(self, qualified_name: str) -> Scope[NamespaceScopeKind]:
        """
        Create a namespace in the snapshot.
        """
        path = parse_qualified_path(qualified_name)
        scope_path = path[0:-1]
        namespace_name = path[-1] if len(path) > 0 else None
        current_scope = self.ensure_scope(scope_path)

        if namespace_name in current_scope.inner_scopes:
            scope = current_scope.inner_scopes[namespace_name]
            if scope.kind.name == "temporary":
                scope.kind = NamespaceScopeKind()
            elif scope.kind.name == "namespace":
                return scope
            else:
                raise RuntimeError(
                    f"Identifier {namespace_name} already exists in scope {current_scope.name} with kind {scope.kind.name}"
                )
            return scope
        else:
            new_scope = Scope(NamespaceScopeKind(), namespace_name)
            new_scope.parent_scope = current_scope
            current_scope.inner_scopes[namespace_name] = new_scope
            return new_scope

    def create_protocol(self, qualified_name: str) -> Scope[ProtocolScopeKind]:
        """
        Create a protocol in the snapshot.
        In Objective-C, a protocol and interface can share the same name,
        so protocols are stored with a '-p' suffix to differentiate them.
        """
        path = parse_qualified_path(qualified_name)
        scope_path = path[0:-1]
        scope_name = path[-1]
        # Use '-p' suffix to allow protocols to coexist with interfaces of the same name
        scope_key = f"{scope_name}-p"
        current_scope = self.ensure_scope(scope_path)

        if scope_key in current_scope.inner_scopes:
            scope = current_scope.inner_scopes[scope_key]
            if scope.kind.name == "temporary":
                scope.kind = ProtocolScopeKind()
            else:
                raise RuntimeError(
                    f"Identifier {scope_name} already exists in scope {current_scope.name}"
                )
            return scope
        else:
            new_scope = Scope(ProtocolScopeKind(), scope_name)
            new_scope.parent_scope = current_scope
            current_scope.inner_scopes[scope_key] = new_scope
            return new_scope

    def create_interface(self, qualified_name: str) -> Scope[InterfaceScopeKind]:
        """
        Create an interface in the snapshot.
        """
        path = parse_qualified_path(qualified_name)
        scope_path = path[0:-1]
        scope_name = path[-1]
        current_scope = self.ensure_scope(scope_path)

        if scope_name in current_scope.inner_scopes:
            scope = current_scope.inner_scopes[scope_name]
            if scope.kind.name == "temporary":
                scope.kind = InterfaceScopeKind()
            else:
                raise RuntimeError(
                    f"Identifier {scope_name} already exists in scope {current_scope.name}"
                )
            return scope
        else:
            new_scope = Scope(InterfaceScopeKind(), scope_name)
            new_scope.parent_scope = current_scope
            current_scope.inner_scopes[scope_name] = new_scope
            return new_scope

    def create_category(
        self, class_name: str, category_name: str
    ) -> Scope[CategoryScopeKind]:
        """
        Create a category in the snapshot.
        Categories are stored with a unique key: "ClassName(CategoryName)"
        """
        scope_key = f"{class_name}({category_name})"
        current_scope = self.root_scope

        if scope_key in current_scope.inner_scopes:
            scope = current_scope.inner_scopes[scope_key]
            if scope.kind.name == "temporary":
                scope.kind = CategoryScopeKind(class_name, category_name)
            else:
                raise RuntimeError(
                    f"Identifier {scope_key} already exists in scope {current_scope.name}"
                )
            return scope
        else:
            new_scope = Scope(CategoryScopeKind(class_name, category_name), scope_key)
            new_scope.parent_scope = current_scope
            current_scope.inner_scopes[scope_key] = new_scope
            return new_scope

    def create_enum(self, qualified_name: str) -> Scope[EnumScopeKind]:
        """
        Create an enum in the snapshot.
        """
        path = parse_qualified_path(qualified_name)
        scope_path = path[0:-1]
        enum_name = path[-1]
        current_scope = self.ensure_scope(scope_path)

        if enum_name in current_scope.inner_scopes:
            scope = current_scope.inner_scopes[enum_name]
            if scope.kind.name == "temporary":
                scope.kind = EnumScopeKind()
            else:
                raise RuntimeError(
                    f"Identifier {enum_name} already exists in scope {current_scope.name}"
                )
            return scope
        else:
            new_scope = Scope(EnumScopeKind(), enum_name)
            new_scope.parent_scope = current_scope
            current_scope.inner_scopes[enum_name] = new_scope
            return new_scope

    def _ensure_scope_is_defined(self, scope: Scope) -> None:
        """
        Ensure that a scope is defined in the snapshot.
        """
        if scope.kind.name == "temporary":
            raise RuntimeError(f"Scope {scope.name} is not defined in the snapshot")

        for inner_scope in scope.inner_scopes.values():
            self._ensure_scope_is_defined(inner_scope)

    def finish(self) -> None:
        """
        Finish the snapshot by setting the kind of all temporary scopes.
        """
        self._ensure_scope_is_defined(self.root_scope)
        self.root_scope.close()

    def to_string(self) -> str:
        """
        Get the string representation of the snapshot.
        """
        return self.root_scope.to_string()

    def print(self) -> None:
        """
        Print the snapshot.
        """
        self.root_scope.print()
