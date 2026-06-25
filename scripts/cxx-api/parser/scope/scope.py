# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from typing import Generic

from natsort import natsorted

from ..member import FriendMember, Member, TypedefMember
from ..utils import parse_qualified_path, qualify_type_str
from .base_scope_kind import _natsort_key, ScopeKindT
from .enum_scope_kind import EnumScopeKind
from .namespace_scope_kind import NamespaceScopeKind
from .struct_like_scope_kind import StructLikeScopeKind


class Scope(Generic[ScopeKindT]):
    def __init__(self, kind: ScopeKindT, name: str | None = None) -> None:
        self.name: str | None = name
        self.kind: ScopeKindT = kind
        self.parent_scope: Scope | None = None
        self.inner_scopes: dict[str, Scope] = {}
        self.location: str | None = None
        self._members: list[Member] = []
        self._private_typedefs: dict[str, TypedefMember] = {}
        self._qualifying_member: Member | None = None

    def get_qualified_name(self) -> str:
        """
        Get the qualified name of the scope, with template arguments qualified.
        """
        path = []
        current_scope = self
        while current_scope is not None:
            if current_scope.name is not None:
                name = current_scope.name
                if (
                    isinstance(current_scope.kind, StructLikeScopeKind)
                    and current_scope.kind.specialization_args is not None
                ):
                    name = (
                        f"{name}<{', '.join(current_scope.kind.specialization_args)}>"
                    )
                path.append(name)
            current_scope = current_scope.parent_scope
        path.reverse()
        return "::".join(path)

    def _get_base_name(self, name: str) -> str:
        """Strip template arguments from a name for scope lookup."""
        angle_idx = name.find("<")
        return name[:angle_idx] if angle_idx != -1 else name

    def qualify_name(self, name: str | None) -> str | None:
        """
        Qualify a name with the relevant scope if possible.
        Handles template arguments by stripping them for lookup but preserving
        them in the output.
        """
        if not name:
            return None

        path = parse_qualified_path(name)
        if not path:
            return None

        current_scope = self
        # Walk up to find a scope that contains the first path segment
        # Check both inner_scopes AND members (for type aliases, etc.)
        base_first = self._get_base_name(path[0])
        while current_scope is not None:
            # Check if it's an inner scope
            if base_first in current_scope.inner_scopes:
                break

            # Skip self-qualification if name matches current scope's name
            if (
                current_scope.name
                and self._get_base_name(current_scope.name) == base_first
            ):
                current_scope = current_scope.parent_scope
                continue

            # Check if it's a member (type alias, variable, etc.)
            for m in current_scope._members:
                if m is current_scope._qualifying_member:
                    continue
                if m.name == base_first and not isinstance(m, FriendMember):
                    prefix = current_scope.get_qualified_name()
                    return f"{prefix}::{name}" if prefix else name

            # Check private typedefs: substitute with the expanded definition
            if len(path) == 1 and base_first in current_scope._private_typedefs:
                return current_scope._private_typedefs[base_first].get_value()

            current_scope = current_scope.parent_scope

        if current_scope is None:
            return None

        # Remember the scope where we found the first segment — its qualified
        # name is the prefix that must precede the matched path segments.
        anchor_scope = current_scope

        # Walk down through the path, tracking matched segments with original template args
        matched_segments: list[str] = []
        for i, path_segment in enumerate(path):
            base_name = self._get_base_name(path_segment)
            if base_name in current_scope.inner_scopes:
                matched_segments.append(path_segment)
                current_scope = current_scope.inner_scopes[base_name]
            elif any(
                m.name == base_name
                and not isinstance(m, FriendMember)
                and m is not current_scope._qualifying_member
                for m in current_scope._members
            ) or any(
                any(m.name == base_name for m in inner._members)
                for inner in current_scope.inner_scopes.values()
                if isinstance(inner.kind, EnumScopeKind)
            ):
                # Found as a member (or as an unscoped enum value accessible
                # from the parent scope), assume following segments exist
                prefix = "::".join(matched_segments)
                suffix = "::".join(path[i:])
                anchor_prefix = anchor_scope.get_qualified_name()
                if prefix:
                    if anchor_prefix:
                        return f"{anchor_prefix}::{prefix}::{suffix}"
                    return f"{prefix}::{suffix}"
                else:
                    if anchor_prefix:
                        return f"{anchor_prefix}::{suffix}"
                    return suffix
            else:
                # Segment not found as an inner scope or a real member of
                # the current scope.  When inside a struct-like scope this
                # typically means Doxygen's refid-based qualification
                # incorrectly placed a type under a compound that does not
                # actually contain it — for example a friend declaration or
                # an inherited constructor reported as a member ref. Try
                # to re-qualify from the remaining unmatched segments so the
                # type resolves against the broader scope hierarchy.
                if isinstance(current_scope.kind, StructLikeScopeKind):
                    remaining = "::".join(path[i:])
                    return self.qualify_name(remaining)
                return None

        # Return qualified name with preserved template arguments
        prefix = anchor_scope.get_qualified_name()
        if prefix:
            return f"{prefix}::{'::'.join(matched_segments)}"
        else:
            return "::".join(matched_segments)

    def add_private_typedef(self, member: TypedefMember) -> None:
        """
        Store a private typedef for use during type resolution.

        Private typedefs are not included in the snapshot output, but their
        definitions are substituted for references to them in public members.
        """
        self._private_typedefs[member.name] = member

    def add_member(self, member: Member | None) -> None:
        """
        Add a member to the scope.
        """
        if member is None:
            return
        self._members.append(member)

    def get_members(self) -> list[Member]:
        """
        Get all members of the scope.
        """
        return self._members

    def close(self) -> None:
        """
        Close the scope by setting the kind of all temporary scopes.
        """
        # Qualify specialization args early so that members and inner scopes
        # see the fully-qualified name when they call get_qualified_name().
        if (
            isinstance(self.kind, StructLikeScopeKind)
            and self.kind.specialization_args is not None
            and self.parent_scope is not None
        ):
            self.kind.specialization_args = [
                qualify_type_str(arg, self.parent_scope)
                for arg in self.kind.specialization_args
            ]

        for typedef in self._private_typedefs.values():
            typedef.close(self)

        for member in self.get_members():
            self._qualifying_member = member
            member.close(self)
        self._qualifying_member = None

        self.kind.close(self)

        for _, inner_scope in self.inner_scopes.items():
            inner_scope.close()

    def to_string(self) -> str:
        """
        Get the string representation of the scope.
        """
        # Get this scope's content (e.g., class members, free functions, ...)
        this_content = self.kind.to_string(self)

        # Separate inner scopes into namespaces and non-namespaces
        # Keep (scope, string) tuples to sort by scope properties
        namespace_scope_items: list[tuple[Scope, str]] = []
        non_namespace_scope_items: list[tuple[Scope, str]] = []

        for _, inner_scope in self.inner_scopes.items():
            if inner_scope.name is None:
                continue
            inner_str = inner_scope.to_string()
            if not inner_str.strip():
                continue

            if isinstance(inner_scope.kind, NamespaceScopeKind):
                namespace_scope_items.append((inner_scope, inner_str))
            else:
                non_namespace_scope_items.append((inner_scope, inner_str))

        # Sort non-namespace scopes by depth (fewer :: first) then by string
        def scope_sort_key(item: tuple[Scope, str]) -> tuple:
            scope, string = item
            depth = scope.get_qualified_name().count("::")
            return (depth, _natsort_key(string))

        non_namespace_scope_items.sort(key=scope_sort_key)
        non_namespace_scope_strings = [s for _, s in non_namespace_scope_items]
        namespace_scope_strings = [s for _, s in namespace_scope_items]

        # Build result:
        # 1. Free members / this scope's content first
        # 2. Non-namespace inner scopes (classes, structs, enums), sorted by depth
        # 3. Namespace inner scopes, each separated by "\n\n\n" (two blank lines)

        local_parts = []
        if this_content.strip():
            local_parts.append(this_content)
        local_parts.extend(non_namespace_scope_strings)

        # NOTE: Don't sort local_parts together - free members should come first
        local_block = "\n\n".join(local_parts)

        # Combine with namespace scopes using one more blank line for clearer separation
        all_blocks = []
        if local_block.strip():
            all_blocks.append(local_block)
        all_blocks.extend(natsorted(namespace_scope_strings))

        return "\n\n\n".join(all_blocks).strip()

    def print(self):
        """
        Print a scope and its contents.
        """
        print(self.to_string())
