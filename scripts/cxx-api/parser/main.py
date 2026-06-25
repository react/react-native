# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Main entry point for building API snapshots from Doxygen XML output.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass

from doxmlparser import compound, index

from .builders import (
    _member_types_reference_excluded_symbol,
    _should_exclude_symbol,
    compile_exclude_patterns,
    create_category_scope,
    create_class_scope,
    create_enum_scope,
    create_interface_scope,
    create_protocol_scope,
    get_concept_member,
    get_function_member,
    get_typedef_member,
    get_variable_member,
)
from .member import (
    FriendMember,
    FunctionMember,
    PropertyMember,
    TypedefMember,
    VariableMember,
)
from .scope import Scope, StructLikeScopeKind
from .scope.extendable import Extendable
from .snapshot import Snapshot
from .utils import (
    format_parsed_type,
    has_scope_resolution_outside_angles,
    parse_qualified_path,
)


def _process_namespace_sections(
    snapshot, namespace_scope, compound_object, exclude_symbols: list[re.Pattern]
):
    """
    Process all section definitions inside a namespace compound.
    """
    compound_name = compound_object.compoundname
    for section_def in compound_object.sectiondef:
        if section_def.kind == "var":
            for variable_def in section_def.memberdef:
                # Skip out-of-class definitions (e.g. "Strct<T>::VALUE")
                if has_scope_resolution_outside_angles(variable_def.get_name()):
                    continue
                qualified_name = f"{compound_name}::{variable_def.get_name()}"
                if _should_exclude_symbol(qualified_name, exclude_symbols):
                    continue
                is_static = variable_def.static == "yes"
                var_member = get_variable_member(variable_def, "public", is_static)
                if _member_types_reference_excluded_symbol(var_member, exclude_symbols):
                    continue
                namespace_scope.add_member(var_member)
        elif section_def.kind == "func":
            for function_def in section_def.memberdef:
                # Skip out-of-class definitions (e.g. "Strct<T>::convert")
                if has_scope_resolution_outside_angles(function_def.get_name()):
                    continue
                qualified_name = f"{compound_name}::{function_def.get_name()}"
                if _should_exclude_symbol(qualified_name, exclude_symbols):
                    continue
                function_static = function_def.static == "yes"

                if not function_static:
                    func_member = get_function_member(function_def, "public")
                    if _member_types_reference_excluded_symbol(
                        func_member, exclude_symbols
                    ):
                        continue
                    namespace_scope.add_member(func_member)
        elif section_def.kind == "typedef":
            for typedef_def in section_def.memberdef:
                qualified_name = f"{compound_name}::{typedef_def.get_name()}"
                if _should_exclude_symbol(qualified_name, exclude_symbols):
                    continue
                typedef_member = get_typedef_member(typedef_def, "public")
                if _member_types_reference_excluded_symbol(
                    typedef_member, exclude_symbols
                ):
                    continue
                namespace_scope.add_member(typedef_member)
        elif section_def.kind == "enum":
            for enum_def in section_def.memberdef:
                qualified_name = f"{compound_name}::{enum_def.get_name()}"
                if _should_exclude_symbol(qualified_name, exclude_symbols):
                    continue
                create_enum_scope(snapshot, enum_def)
        else:
            print(
                f"Unknown section kind: {section_def.kind} in {compound_object.location.file}"
            )


def _handle_namespace_compound(snapshot, compound_object, exclude_symbols=None):
    """
    Handle a namespace compound definition.
    """
    if exclude_symbols is None:
        exclude_symbols = []

    # Skip anonymous namespaces (internal linkage, not public API).
    # Doxygen encodes them with a '@' prefix in the compound name.
    if "@" in compound_object.compoundname:
        return

    namespace_scope = snapshot.create_or_get_namespace(compound_object.compoundname)

    namespace_scope.location = compound_object.location.file

    _process_namespace_sections(
        snapshot, namespace_scope, compound_object, exclude_symbols
    )


def _handle_concept_compound(snapshot, compound_object):
    """
    Handle a concept compound definition.
    """
    # Concepts belong to a namespace, so we need to find or create the parent namespace
    concept_name = compound_object.compoundname
    concept_path = parse_qualified_path(concept_name)
    namespace_path = "::".join(concept_path[:-1]) if concept_path else ""

    if namespace_path:
        namespace_scope = snapshot.create_or_get_namespace(namespace_path)
    else:
        namespace_scope = snapshot.root_scope

    namespace_scope.add_member(get_concept_member(compound_object))


def _handle_class_compound(snapshot, compound_object, exclude_symbols=None):
    """
    Handle class, struct, and union compound definitions.
    """
    # Check if this is an Objective-C interface by looking at the compound id
    # Doxygen reports ObjC interfaces as kind="class" but with id starting with "interface"
    is_objc_interface = (
        compound_object.kind == "class" and compound_object.id.startswith("interface")
    )

    # Handle Objective-C interfaces separately
    if is_objc_interface:
        create_interface_scope(snapshot, compound_object, exclude_symbols)
        return

    # classes and structs are represented by the same scope with a different kind
    create_class_scope(snapshot, compound_object, exclude_symbols)


# Dispatch table for compound kinds that map directly to a single builder call.
_COMPOUND_HANDLERS = {
    "class": _handle_class_compound,
    "struct": _handle_class_compound,
    "union": _handle_class_compound,
    "namespace": _handle_namespace_compound,
    "concept": _handle_concept_compound,
    "category": create_category_scope,
    "protocol": create_protocol_scope,
    "interface": create_interface_scope,
}

# Compound kinds that are intentionally ignored.
_IGNORED_COMPOUNDS = frozenset(
    {
        "file",
        "dir",
        # Contains deprecation info
        "page",
    }
)


@dataclass
class ExcludedSymbolReference:
    symbol: str
    pattern: str
    scope: str
    context: str


def _check_text_for_excluded_patterns(
    text: str,
    scope_name: str,
    context: str,
    exclude_symbols: list[re.Pattern],
    results: list[ExcludedSymbolReference],
) -> None:
    """Append an ExcludedSymbolReference for each pattern found in *text*."""
    for pattern in exclude_symbols:
        if pattern.search(text):
            results.append(
                ExcludedSymbolReference(
                    symbol=text,
                    pattern=pattern.pattern,
                    scope=scope_name,
                    context=context,
                )
            )


def _check_arguments_for_excluded_patterns(
    arguments: list,
    scope_name: str,
    context_prefix: str,
    exclude_symbols: list[re.Pattern],
    results: list[ExcludedSymbolReference],
) -> None:
    """Check every argument's type string for excluded patterns."""
    for arg in arguments:
        # Argument is a tuple: (qualifiers, type, name, default_value)
        arg_type = arg[1]
        if arg_type:
            _check_text_for_excluded_patterns(
                arg_type,
                scope_name,
                f"{context_prefix} parameter type",
                exclude_symbols,
                results,
            )


def _check_member_for_excluded_patterns(
    member,
    scope_name: str,
    exclude_symbols: list[re.Pattern],
    results: list[ExcludedSymbolReference],
) -> None:
    """Check a single member for type references matching excluded patterns."""
    member_name = f"{scope_name}::{member.name}"

    if isinstance(member, FunctionMember):
        if member.type:
            _check_text_for_excluded_patterns(
                member.type,
                member_name,
                "return type",
                exclude_symbols,
                results,
            )
        _check_arguments_for_excluded_patterns(
            member.arguments,
            member_name,
            "function",
            exclude_symbols,
            results,
        )

    elif isinstance(member, VariableMember):
        type_str = format_parsed_type(member._parsed_type)
        if type_str:
            _check_text_for_excluded_patterns(
                type_str,
                member_name,
                "variable type",
                exclude_symbols,
                results,
            )
        _check_arguments_for_excluded_patterns(
            member._fp_arguments,
            member_name,
            "function pointer",
            exclude_symbols,
            results,
        )

    elif isinstance(member, TypedefMember):
        value = member.get_value()
        if value:
            _check_text_for_excluded_patterns(
                value,
                member_name,
                "typedef target type",
                exclude_symbols,
                results,
            )
        _check_arguments_for_excluded_patterns(
            member._fp_arguments,
            member_name,
            "function pointer",
            exclude_symbols,
            results,
        )

    elif isinstance(member, PropertyMember):
        if member.type:
            _check_text_for_excluded_patterns(
                member.type,
                member_name,
                "property type",
                exclude_symbols,
                results,
            )

    elif isinstance(member, FriendMember):
        _check_text_for_excluded_patterns(
            member.name,
            member_name,
            "friend declaration",
            exclude_symbols,
            results,
        )

    if member.specialization_args:
        for arg in member.specialization_args:
            _check_text_for_excluded_patterns(
                arg,
                member_name,
                "member specialization argument",
                exclude_symbols,
                results,
            )


def _walk_scope_for_excluded_patterns(
    scope: Scope,
    exclude_symbols: list[re.Pattern],
    results: list[ExcludedSymbolReference],
) -> None:
    """Recursively walk a scope tree checking for excluded pattern references."""
    scope_name = scope.get_qualified_name() or "(root)"

    # Check base classes (StructLikeScopeKind, ProtocolScopeKind, InterfaceScopeKind)
    if isinstance(scope.kind, Extendable):
        for base in scope.kind.base_classes:
            _check_text_for_excluded_patterns(
                base.name,
                scope_name,
                "base class",
                exclude_symbols,
                results,
            )

    # Check specialization args
    if isinstance(scope.kind, StructLikeScopeKind) and scope.kind.specialization_args:
        for arg in scope.kind.specialization_args:
            _check_text_for_excluded_patterns(
                arg,
                scope_name,
                "specialization argument",
                exclude_symbols,
                results,
            )

    for member in scope.get_members():
        _check_member_for_excluded_patterns(
            member, scope_name, exclude_symbols, results
        )

    for inner in scope.inner_scopes.values():
        _walk_scope_for_excluded_patterns(inner, exclude_symbols, results)


def find_excluded_symbol_references(
    snapshot: Snapshot,
    exclude_symbols: list[re.Pattern],
) -> list[ExcludedSymbolReference]:
    """
    Walk the snapshot scope tree after it has been finalized and find
    references to excluded symbols in type strings, base classes, and
    other type references.

    This detects cases where a non-excluded symbol references an excluded
    symbol (e.g., a class inherits from an excluded base, a function returns
    an excluded type, etc.).
    """
    if not exclude_symbols:
        return []

    results: list[ExcludedSymbolReference] = []
    _walk_scope_for_excluded_patterns(snapshot.root_scope, exclude_symbols, results)
    return results


def build_snapshot(xml_dir: str, exclude_symbols: list[str] | None = None) -> Snapshot:
    """
    Reads the Doxygen XML output and builds a snapshot of the C++ API.

    Args:
        xml_dir: Path to the Doxygen XML output directory.
        exclude_symbols: Optional list of regex patterns. Compounds whose
            qualified name matches any of these patterns will be excluded.
    """
    if exclude_symbols is None:
        exclude_symbols = []

    compiled_patterns = compile_exclude_patterns(exclude_symbols)

    index_path = os.path.join(xml_dir, "index.xml")
    if not os.path.exists(index_path):
        raise RuntimeError(f"Doxygen entry point not found at {index_path}")

    root = index.parse(index_path, silence=True)
    snapshot = Snapshot()

    for entry in root.compound:
        detail_file = os.path.join(xml_dir, f"{entry.refid}.xml")
        if not os.path.exists(detail_file):
            print(f"Detail file not found at {detail_file}")
            continue

        doxygen_object = compound.parse(detail_file, silence=True)

        for compound_object in doxygen_object.compounddef:
            if compound_object.prot == "private":
                continue

            if _should_exclude_symbol(compound_object.compoundname, compiled_patterns):
                continue

            kind = compound_object.kind

            if kind in _IGNORED_COMPOUNDS:
                pass
            elif kind in _COMPOUND_HANDLERS:
                handler = _COMPOUND_HANDLERS[kind]
                if handler == _handle_namespace_compound:
                    handler(snapshot, compound_object, compiled_patterns)
                elif handler == _handle_class_compound:
                    handler(snapshot, compound_object, compiled_patterns)
                elif handler in (
                    create_category_scope,
                    create_protocol_scope,
                    create_interface_scope,
                ):
                    handler(snapshot, compound_object, compiled_patterns)
                else:
                    handler(snapshot, compound_object)
            else:
                print(f"Unknown compound kind: {kind}")

    snapshot.finish()

    snapshot.excluded_symbol_references = find_excluded_symbol_references(
        snapshot, compiled_patterns
    )

    return snapshot
