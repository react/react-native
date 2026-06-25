# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Builder functions for extracting members from Doxygen XML and creating scopes.

This module contains:
- Member extraction functions (get_*_member)
- Scope creation functions (create_*_scope)
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from doxmlparser import compound

from .input_filters.handle_objc_interface_generics import decode_objc_generics
from .member import (
    ConceptMember,
    EnumMember,
    FriendMember,
    FunctionMember,
    PropertyMember,
    TypedefMember,
    VariableMember,
)
from .scope import InterfaceScopeKind, ProtocolScopeKind, StructLikeScopeKind
from .snapshot import Snapshot
from .template import Template
from .utils import (
    Argument,
    extract_qualifiers,
    InitializerType,
    normalize_angle_brackets,
    normalize_pointer_spacing,
    parse_qualified_path,
    resolve_linked_text_name,
    split_specialization,
)
from .utils.argument_parsing import (
    _find_matching_angle,
    _split_arguments,
    format_parsed_type,
    parse_type_with_argstrings,
)


@dataclass
class ParsedSectionKind:
    """Parsed representation of a Doxygen section kind string (e.g. 'public-static-func')."""

    visibility: str
    is_static: bool
    member_type: str

    @classmethod
    def parse(cls, kind: str) -> ParsedSectionKind:
        parts = kind.split("-")
        return cls(
            visibility=parts[0],
            is_static="static" in parts,
            member_type=parts[-1],
        )


# region Base class fixups


def _fix_base_class_default_substitution(
    base_name: str,
    template_params: list[Template],
) -> str:
    """
    Workaround for Doxygen's substitution of template parameters with their
    defaults in base class template arguments. For example, given:

        template <typename BazT = Baz>
        class Foo : public Bar<BazT> {};

    Doxygen emits ``Bar<Baz>`` instead of ``Bar<BazT>``.

    This function builds a reverse mapping (default_value -> param_name) and
    replaces matching template arguments in base_name with the parameter names.
    """
    angle_start = base_name.find("<")
    if angle_start == -1:
        return base_name

    angle_end = _find_matching_angle(base_name, angle_start)
    if angle_end == -1:
        return base_name

    # Build reverse mapping: default_value -> param_name.
    # Map both fully qualified and unqualified names.
    default_to_param: dict[str, str] = {}
    for param in template_params:
        if param.value is not None and param.name is not None:
            default_to_param[param.value] = param.name
            last_sep = param.value.rfind("::")
            if last_sep != -1:
                default_to_param[param.value[last_sep + 2 :]] = param.name

    if not default_to_param:
        return base_name

    prefix = base_name[:angle_start]
    inner = base_name[angle_start + 1 : angle_end]
    suffix = base_name[angle_end + 1 :]

    args = _split_arguments(inner)
    fixed_args = []
    for arg in args:
        stripped = arg.strip()
        if stripped in default_to_param:
            fixed_args.append(default_to_param[stripped])
        else:
            fixed_args.append(stripped)

    return f"{prefix}<{', '.join(fixed_args)}>{suffix}"


# endregion

# region Inherited constructor fixup


def _fix_inherited_constructor_name(
    func_member: FunctionMember,
    compound_name: str,
) -> None:
    """
    Fix inherited constructor names reported by Doxygen.

    When a class inherits constructors via ``using Base::Base;``, Doxygen
    reports them with the base class name instead of the derived class name.
    This function detects such constructors and renames them.
    """
    if (
        func_member.type != ""
        or func_member.name.startswith("~")
        or func_member.name.startswith("operator")
    ):
        return

    class_unqualified_name = parse_qualified_path(compound_name)[-1]
    class_base_name, _ = split_specialization(class_unqualified_name)

    if func_member.name != class_base_name:
        func_member.name = class_unqualified_name


# endregion

# region Member extraction


def get_base_classes(
    compound_object: compound.CompounddefType,
    base_class=StructLikeScopeKind.Base,
) -> list:
    """
    Get the base classes of a compound object.

    Deduplicates base classes by name. Doxygen can emit duplicate
    ``basecompoundref`` entries when a class inherits constructors via
    ``using Base::Base;`` — the using-declaration is incorrectly reported
    as an additional base class reference.
    """
    base_classes = []
    seen_names: set[str] = set()
    if compound_object.basecompoundref:
        for base in compound_object.basecompoundref:
            # base is a compoundRefType with:
            # - refid: reference ID to the base class definition
            # - prot: protection level (public, protected, private)
            # - virt: virtual inheritance (non-virtual, virtual, pure-virtual)
            # - valueOf_: the name of the base class
            base_name = normalize_angle_brackets(base.valueOf_)
            base_prot = base.prot
            base_virt = base.virt
            base_refid = base.refid

            if base_prot == "private":
                # Ignore private base classes
                continue

            if base_name in seen_names:
                continue
            seen_names.add(base_name)

            base_classes.append(
                base_class(
                    base_name,
                    base_prot,
                    base_virt == "virtual",
                    base_refid,
                )
            )
    return base_classes


def get_template_params(
    compound_object: compound.CompounddefType,
) -> [Template]:
    """
    Get the template parameters of a compound object.
    """
    template_params = []
    if compound_object.templateparamlist is not None:
        for param in compound_object.templateparamlist.param:
            template_value = (
                resolve_linked_text_name(param.defval)[0] if param.defval else None
            )
            template_name = param.defname
            template_type = resolve_linked_text_name(param.get_type())[0]

            if template_name is None:
                # Split type string and extract name from the end
                # Handles: "typename T", "class T", "int N", etc.
                parts = template_type.strip().split()
                if len(parts) >= 2:
                    template_type = " ".join(parts[:-1])
                    template_name = parts[-1]
                elif len(parts) == 1:
                    # Check if this is an unnamed template parameter
                    # (just "typename" or "class" with or without a default value)
                    # In this case, we leave name as None/empty
                    if parts[0] in ("typename", "class"):
                        # Unnamed template parameter
                        # e.g., "typename" or "typename = std::enable_if_t<...>"
                        template_name = None
                    else:
                        # Just a name like "T" with no type keyword
                        template_name = parts[0]

            template_params.append(
                Template(template_type, template_name, template_value)
            )
    return template_params


def get_variable_member(
    member_def: compound.MemberdefType,
    visibility: str,
    is_static: bool = False,
) -> VariableMember:
    """
    Get the variable member from a member definition.
    """
    variable_name = member_def.get_name()

    if len(variable_name) == 0:
        # Ignore anonymous variables
        return None

    (variable_type, _) = resolve_linked_text_name(member_def.get_type())
    variable_value = None
    variable_definition = member_def.definition
    variable_argstring = member_def.get_argsstring()

    is_constexpr = member_def.constexpr == "yes"
    is_mutable = member_def.mutable == "yes"

    if is_constexpr and variable_type.find("constexpr") != -1:
        variable_type = variable_type.replace("constexpr", "").strip()

    is_const = variable_type.startswith("const")
    if is_const:
        variable_type = variable_type[5:].strip()

    is_brace_initializer = False
    if member_def.initializer is not None:
        (variable_value, initializer_type) = resolve_linked_text_name(
            member_def.initializer,
            strip_initializers=True,
        )
        if initializer_type == InitializerType.BRACE:
            is_brace_initializer = True

    member = VariableMember(
        variable_name,
        variable_type,
        visibility,
        is_const,
        is_static,
        is_constexpr,
        is_mutable,
        variable_value,
        variable_definition,
        variable_argstring,
        is_brace_initializer,
    )

    member.add_template(get_template_params(member_def))

    return member


def get_doxygen_params(
    function_def: compound.MemberdefType,
) -> list[tuple[str | None, str, str | None, str | None]] | None:
    """
    Extract structured parameter information from doxygen <param> elements.

    Returns a list of Argument tuples (qualifiers, type, name, default_value),
    or None if no <param> elements are available.
    """
    params = function_def.param
    if not params:
        return None

    arguments: list[Argument] = []
    for param in params:
        param_type = (
            resolve_linked_text_name(param.get_type())[0].strip()
            if param.get_type()
            else ""
        )

        # Doxygen may incorrectly cross-reference parameter names inside
        # inline function pointer types to member variables of the enclosing
        # class, producing qualified paths like "const void*
        # ns::Class::data" instead of "const void* data".  Re-parse the
        # type through parse_type_with_argstrings which delegates to
        # _parse_single_argument — that already strips "::" from names.
        segments = parse_type_with_argstrings(param_type)
        if len(segments) > 1:
            param_type = format_parsed_type(segments)
        param_name = param.declname or param.defname or None
        param_default = (
            resolve_linked_text_name(param.defval)[0].strip() if param.defval else None
        )

        # Doxygen splits array dimensions into a separate <array> element.
        # For complex declarators like "PropNameID (&&propertyNames)[N]",
        # doxygen gives type="PropNameID(&&)", name="propertyNames",
        # array="[N]".  We must reconstruct the full declarator with the
        # name embedded inside the grouping parentheses:
        #   PropNameID(&&propertyNames)[N]
        param_array = param.array
        if param_array:
            # Match type ending with a pointer/reference declarator group:
            # e.g. "PropNameID(&&)", "int(&)", "void(*)"
            m = re.search(r"\([*&]+\)\s*$", param_type)
            if m and param_name:
                # Insert name before the closing ')' and append array
                insert_pos = m.end() - 1  # position of trailing ')'
                param_type = (
                    param_type[:insert_pos]
                    + param_name
                    + param_type[insert_pos:]
                    + param_array
                )
                param_name = None
            elif param_name:
                param_name += param_array
            else:
                param_type += param_array

        # Handle pointer-to-member-function types where the name must be
        # embedded inside the declarator group.  Doxygen gives:
        #   type = "void(ns::*)() const", name = "asFoo"
        # We need to produce:
        #   "void(ns::*asFoo)() const"
        if param_name:
            m = re.search(r"\([^)]*::\*\)", param_type)
            if m:
                # Insert name before the closing ')' of the ptr-to-member group
                insert_pos = m.end() - 1
                param_type = (
                    param_type[:insert_pos] + param_name + param_type[insert_pos:]
                )
                param_name = None
        else:
            # Doxygen bug: for pointer-to-member-function params with
            # ref-qualifiers (& or &&), Doxygen incorrectly embeds the
            # parameter name in the type string between cv-qualifiers
            # and the ref-qualifier, and omits <declname> entirely:
            #   <type>R(ns::*)() const asFoo &amp;</type>
            # Detect this pattern and reconstruct the correct type:
            #   R(ns::*asFoo)() const &
            m = re.search(
                r"(\([^)]*::\*\))"  # group 1: ptr-to-member declarator
                r"(.+?)"  # group 2: param list + cv-qualifiers
                r"\s+([a-zA-Z_]\w*)"  # group 3: misplaced identifier
                r"\s*(&{1,2})\s*$",  # group 4: ref-qualifier
                param_type,
            )
            if m:
                param_type = (
                    param_type[: m.end(1) - 1]  # up to ')' of (ns::*)
                    + m.group(3)  # insert extracted name
                    + param_type[m.end(1) - 1 : m.end(2)]  # ')' + params + cv-quals
                    + " "
                    + m.group(4)  # ref-qualifier
                )

        qualifiers, core_type = extract_qualifiers(param_type)
        arguments.append((qualifiers, core_type, param_name, param_default))

    return arguments


def get_function_member(
    function_def: compound.MemberdefType,
    visibility: str,
    is_static: bool = False,
) -> FunctionMember:
    """
    Get the function member from a member definition.
    """
    function_name = function_def.get_name()
    function_type = resolve_linked_text_name(function_def.get_type())[0]
    function_arg_string = function_def.get_argsstring()
    is_pure_virtual = function_def.get_virt() == "pure-virtual"
    function_virtual = function_def.get_virt() == "virtual" or is_pure_virtual
    is_constexpr = function_def.constexpr == "yes"

    # Doxygen incorrectly merges "=0" into the return type for pure-virtual
    # functions using trailing return types (e.g. "auto f() -> T = 0").
    # Strip the trailing "=0" from the type string.
    function_type = re.sub(r"\s*=\s*0\s*$", "", function_type)

    # For constexpr constructors, Doxygen outputs "constexpr" both as an
    # attribute (constexpr="yes") and as the return type (<type>constexpr</type>).
    # Remove the redundant type to avoid "constexpr constexpr" in output.
    if is_constexpr and function_type == "constexpr":
        function_type = ""

    doxygen_params = get_doxygen_params(function_def)

    function = FunctionMember(
        function_name,
        function_type,
        visibility,
        function_arg_string,
        function_virtual,
        is_pure_virtual,
        is_static,
        doxygen_params,
        is_constexpr,
    )

    function.add_template(get_template_params(function_def))

    return function


def get_typedef_member(
    typedef_def: compound.memberdefType, visibility: str
) -> TypedefMember:
    typedef_name = typedef_def.get_name()
    typedef_type = resolve_linked_text_name(typedef_def.get_type())[0]
    typedef_argstring = typedef_def.get_argsstring()
    typedef_definition = typedef_def.definition

    typedef_keyword = "using"
    if typedef_definition.startswith("typedef"):
        typedef_keyword = "typedef"

    typedef = TypedefMember(
        typedef_name,
        typedef_type,
        typedef_argstring,
        visibility,
        typedef_keyword,
    )

    typedef.add_template(get_template_params(typedef_def))

    return typedef


def get_concept_member(
    concept_def: compound.CompounddefType,
) -> ConceptMember:
    """
    Get the concept member from a compound definition.
    """
    concept_name = concept_def.compoundname
    concept_path = parse_qualified_path(concept_name)
    unqualified_name = concept_path[-1]

    initializer = concept_def.initializer
    constraint = ""

    if initializer:
        # The initializer contains the entire constraind definition.
        # We want to extract the constraint part after "="
        initializer_text = resolve_linked_text_name(initializer)[0]
        eq_pos = initializer_text.find("=")
        if eq_pos != -1:
            constraint = initializer_text[eq_pos + 1 :].strip()

    concept = ConceptMember(unqualified_name, constraint)
    concept.add_template(get_template_params(concept_def))

    return concept


def get_property_member(
    member_def: compound.MemberdefType,
    visibility: str,
    is_static: bool = False,
) -> PropertyMember:
    """
    Get the property member from a member definition.
    """
    property_name = member_def.get_name()
    property_type = resolve_linked_text_name(member_def.get_type())[0].strip()
    accessor = member_def.accessor if hasattr(member_def, "accessor") else None
    is_readable = getattr(member_def, "readable", "no") == "yes"
    is_writable = getattr(member_def, "writable", "no") == "yes"

    # Handle block properties: Doxygen splits the block type across <type> and <argsstring>
    # <type> = "void(^"
    # <argsstring> = ")(NSString *eventName, NSDictionary *event, NSNumber *reactTag)"
    # We need to combine them: "void(^eventInterceptor)(NSString *, NSDictionary *, NSNumber *)"
    if property_type.endswith("(^"):
        argsstring = member_def.get_argsstring()
        if argsstring:
            # Normalize pointer spacing in the argsstring
            normalized_argsstring = normalize_pointer_spacing(argsstring)
            property_type = f"{property_type}{property_name}{normalized_argsstring}"
            property_name = ""

    return PropertyMember(
        property_name,
        property_type,
        visibility,
        is_static,
        accessor,
        is_readable,
        is_writable,
    )


# endregion

# region Symbol exclusion


def compile_exclude_patterns(exclude_symbols: list[str]) -> list[re.Pattern]:
    """Compile exclude_symbols strings into regex patterns for efficient matching."""
    return [re.compile(pattern) for pattern in exclude_symbols]


def _should_exclude_symbol(name: str, exclude_symbols: list[re.Pattern]) -> bool:
    """
    Check if a symbol name should be excluded based on regex patterns.

    Each pattern is used as a regex search against the symbol's name.
    """
    return any(pattern.search(name) for pattern in exclude_symbols)


def _type_contains_excluded_symbol(
    type_str: str | None, exclude_symbols: list[re.Pattern]
) -> bool:
    """Return True if *type_str* matches any regex from *exclude_symbols*."""
    if not type_str or not exclude_symbols:
        return False
    return any(pattern.search(type_str) for pattern in exclude_symbols)


def _member_types_reference_excluded_symbol(
    member, exclude_symbols: list[re.Pattern]
) -> bool:
    """Check whether any type string on *member* references an excluded symbol."""
    if not exclude_symbols:
        return False

    if isinstance(member, FunctionMember):
        if _type_contains_excluded_symbol(member.type, exclude_symbols):
            return True
        for arg in member.arguments:
            if _type_contains_excluded_symbol(arg[1], exclude_symbols):
                return True

    elif isinstance(member, VariableMember):
        if _type_contains_excluded_symbol(member.type, exclude_symbols):
            return True

    elif isinstance(member, TypedefMember):
        if _type_contains_excluded_symbol(member.type, exclude_symbols):
            return True

    elif isinstance(member, PropertyMember):
        if _type_contains_excluded_symbol(member.type, exclude_symbols):
            return True

    return False


# endregion

# region Scope creation


def create_enum_scope(snapshot: Snapshot, enum_def: compound.EnumdefType) -> None:
    """
    Create an enum scope in the snapshot.
    """
    scope = snapshot.create_enum(enum_def.qualifiedname)
    scope.kind.type = resolve_linked_text_name(enum_def.get_type())[0]
    scope.location = enum_def.location.file

    for enum_value_def in enum_def.enumvalue:
        value_name = enum_value_def.get_name()
        value_value = None

        if enum_value_def.initializer is not None:
            value_value = resolve_linked_text_name(enum_value_def.initializer)

        scope.add_member(
            EnumMember(
                value_name,
                value_value,
            ),
        )


def _is_category_member(member_def: compound.MemberdefType) -> bool:
    """
    Check if a member comes from a category based on its definition.

    Doxygen merges category members into the base interface XML output, but the
    member's definition field contains the category name in parentheses, e.g.:
    "int RCTBridgeProxy(Cxx)::cxxOnlyProperty"

    We use this to filter out category members from the interface scope.
    """
    definition = member_def.definition
    if not definition:
        return False

    # Look for pattern: ClassName(CategoryName)::memberName
    # The definition contains the qualified name with category info
    return bool(re.search(r"\w+\([^)]+\)::", definition))


def _process_objc_sections(
    snapshot: Snapshot,
    scope,
    section_defs: list,
    location_file: str,
    scope_type: str,
    filter_category_members: bool = False,
    exclude_symbols: list[re.Pattern] | None = None,
) -> None:
    """
    Common section processing for protocols and interfaces.

    Args:
        filter_category_members: If True, skip members that come from categories.
            This is used for interfaces since Doxygen incorrectly merges category
            members into the base interface XML output.
    """
    for section_def in section_defs:
        section = ParsedSectionKind.parse(section_def.kind)
        visibility = section.visibility
        is_static = section.is_static
        member_type = section.member_type

        if visibility == "private":
            if member_type == "type":
                for member_def in section_def.memberdef:
                    if member_def.kind == "typedef":
                        typedef_member = get_typedef_member(member_def, visibility)
                        scope.add_private_typedef(typedef_member)
        elif visibility in ("public", "protected"):
            if member_type == "attrib":
                for member_def in section_def.memberdef:
                    if member_def.kind == "variable":
                        if filter_category_members and _is_category_member(member_def):
                            continue
                        if exclude_symbols and _should_exclude_symbol(
                            member_def.get_name(), exclude_symbols
                        ):
                            continue
                        var_member = get_variable_member(
                            member_def, visibility, is_static
                        )
                        if exclude_symbols and _member_types_reference_excluded_symbol(
                            var_member, exclude_symbols
                        ):
                            continue
                        scope.add_member(var_member)
            elif member_type == "func":
                for function_def in section_def.memberdef:
                    if filter_category_members and _is_category_member(function_def):
                        continue
                    if exclude_symbols and _should_exclude_symbol(
                        function_def.get_name(), exclude_symbols
                    ):
                        continue
                    func_member = get_function_member(
                        function_def, visibility, is_static
                    )
                    if exclude_symbols and _member_types_reference_excluded_symbol(
                        func_member, exclude_symbols
                    ):
                        continue
                    scope.add_member(func_member)
            elif member_type == "type":
                for member_def in section_def.memberdef:
                    if member_def.kind == "enum":
                        create_enum_scope(snapshot, member_def)
                    elif member_def.kind == "typedef":
                        if filter_category_members and _is_category_member(member_def):
                            continue
                        if exclude_symbols and _should_exclude_symbol(
                            member_def.get_name(), exclude_symbols
                        ):
                            continue
                        typedef_member = get_typedef_member(member_def, visibility)
                        if exclude_symbols and _member_types_reference_excluded_symbol(
                            typedef_member, exclude_symbols
                        ):
                            continue
                        scope.add_member(typedef_member)
                    else:
                        print(
                            f"Unknown section member kind: {member_def.kind} in {location_file}"
                        )
            else:
                print(
                    f"Unknown {scope_type} section kind: {section_def.kind} in {location_file}"
                )
        elif visibility == "property":
            for member_def in section_def.memberdef:
                if member_def.kind == "property":
                    if filter_category_members and _is_category_member(member_def):
                        continue
                    if exclude_symbols and _should_exclude_symbol(
                        member_def.get_name(), exclude_symbols
                    ):
                        continue
                    prop_member = get_property_member(member_def, "public", is_static)
                    if exclude_symbols and _member_types_reference_excluded_symbol(
                        prop_member, exclude_symbols
                    ):
                        continue
                    scope.add_member(prop_member)
        else:
            print(f"Unknown {scope_type} visibility: {visibility} in {location_file}")


def create_protocol_scope(
    snapshot: Snapshot,
    scope_def: compound.CompounddefType,
    exclude_symbols: list[re.Pattern] | None = None,
) -> None:
    """
    Create a protocol scope in the snapshot.
    """
    protocol_name = scope_def.compoundname
    if protocol_name.endswith("-p"):
        protocol_name = protocol_name[:-2]

    protocol_scope = snapshot.create_protocol(protocol_name)
    base_classes = get_base_classes(scope_def, base_class=ProtocolScopeKind.Base)
    for base in base_classes:
        base.name = base.name.strip("<>")
    protocol_scope.kind.add_base(base_classes)
    protocol_scope.location = scope_def.location.file

    _process_objc_sections(
        snapshot,
        protocol_scope,
        scope_def.sectiondef,
        scope_def.location.file,
        "protocol",
        exclude_symbols=exclude_symbols,
    )


# endregion


def create_interface_scope(
    snapshot: Snapshot,
    scope_def: compound.CompounddefType,
    exclude_symbols: list[re.Pattern] | None = None,
) -> None:
    """
    Create an interface scope in the snapshot (Objective-C @interface).
    """
    interface_name = scope_def.compoundname

    # Decode ObjC generics that were encoded by the input filter.
    # The input filter encodes ``@interface Foo<T>`` as
    # ``@interface Foo__GENERICS__T__ENDGENERICS__`` so Doxygen can parse it.
    # We restore the original ``Foo<T>`` name here.
    interface_name = decode_objc_generics(interface_name)

    interface_scope = snapshot.create_interface(interface_name)
    base_classes = get_base_classes(scope_def, base_class=InterfaceScopeKind.Base)

    # Doxygen incorrectly splits "Foo <Protocol1, Protocol2>" into separate base classes:
    # "Foo", "<Protocol1>", "<Protocol2>". Combine them back into "Foo <Protocol1, Protocol2>".
    combined_bases = []
    for base in base_classes:
        if base.name.startswith("<") and base.name.endswith(">") and combined_bases:
            prev_name = combined_bases[-1].name
            protocol = base.name[1:-1]  # Strip < and >
            if "<" in prev_name and prev_name.endswith(">"):
                # Previous base already has protocols, merge inside the brackets
                combined_bases[-1].name = f"{prev_name[:-1]}, {protocol}>"
            else:
                # First protocol for this base class
                combined_bases[-1].name = f"{prev_name} <{protocol}>"
        else:
            combined_bases.append(base)

    interface_scope.kind.add_base(combined_bases)
    interface_scope.location = scope_def.location.file

    _process_objc_sections(
        snapshot,
        interface_scope,
        scope_def.sectiondef,
        scope_def.location.file,
        "interface",
        filter_category_members=True,
        exclude_symbols=exclude_symbols,
    )


def create_class_scope(
    snapshot: Snapshot,
    compound_object: compound.CompounddefType,
    exclude_symbols: list[re.Pattern] | None = None,
) -> None:
    """
    Create a class/struct/union scope in the snapshot.
    """
    if compound_object.kind == "class":
        class_scope = snapshot.create_struct_like(
            compound_object.compoundname, StructLikeScopeKind.Type.CLASS
        )
    elif compound_object.kind == "struct":
        class_scope = snapshot.create_struct_like(
            compound_object.compoundname, StructLikeScopeKind.Type.STRUCT
        )
    else:
        class_scope = snapshot.create_struct_like(
            compound_object.compoundname, StructLikeScopeKind.Type.UNION
        )

    class_scope.kind.add_base(get_base_classes(compound_object))
    template_params = get_template_params(compound_object)

    # Fix Doxygen's substitution of template param defaults in base classes
    if template_params:
        for base in class_scope.kind.base_classes:
            base.name = _fix_base_class_default_substitution(base.name, template_params)

    class_scope.kind.add_template(template_params)
    class_scope.location = compound_object.location.file

    for section_def in compound_object.sectiondef:
        section = ParsedSectionKind.parse(section_def.kind)
        visibility = section.visibility
        is_static = section.is_static
        member_type = section.member_type

        if visibility == "private":
            if member_type == "type":
                for member_def in section_def.memberdef:
                    if member_def.kind == "typedef":
                        typedef_member = get_typedef_member(member_def, visibility)
                        class_scope.add_private_typedef(typedef_member)
        elif visibility in ("public", "protected"):
            if member_type == "attrib":
                for member_def in section_def.memberdef:
                    if member_def.kind == "variable":
                        (var_type, _) = resolve_linked_text_name(member_def.get_type())

                        # Skip anonymous variables
                        if "@" in var_type:
                            continue

                        if var_type == "friend":
                            class_scope.add_member(
                                FriendMember(member_def.get_name(), visibility)
                            )
                        else:
                            if exclude_symbols and _should_exclude_symbol(
                                member_def.get_name(), exclude_symbols
                            ):
                                continue
                            var_member = get_variable_member(
                                member_def, visibility, is_static
                            )
                            if (
                                exclude_symbols
                                and _member_types_reference_excluded_symbol(
                                    var_member, exclude_symbols
                                )
                            ):
                                continue
                            class_scope.add_member(var_member)
            elif member_type == "func":
                for function_def in section_def.memberdef:
                    if exclude_symbols and _should_exclude_symbol(
                        function_def.get_name(), exclude_symbols
                    ):
                        continue
                    func_member = get_function_member(
                        function_def, visibility, is_static
                    )
                    _fix_inherited_constructor_name(
                        func_member, compound_object.compoundname
                    )
                    if exclude_symbols and _member_types_reference_excluded_symbol(
                        func_member, exclude_symbols
                    ):
                        continue
                    class_scope.add_member(func_member)
            elif member_type == "type":
                for member_def in section_def.memberdef:
                    if member_def.kind == "enum":
                        create_enum_scope(snapshot, member_def)
                    elif member_def.kind == "typedef":
                        if exclude_symbols and _should_exclude_symbol(
                            member_def.get_name(), exclude_symbols
                        ):
                            continue
                        typedef_member = get_typedef_member(member_def, visibility)
                        if exclude_symbols and _member_types_reference_excluded_symbol(
                            typedef_member, exclude_symbols
                        ):
                            continue
                        class_scope.add_member(typedef_member)
                    else:
                        print(
                            f"Unknown section member kind: {member_def.kind} in {compound_object.location.file}"
                        )
            else:
                print(
                    f"Unknown class section kind: {section_def.kind} in {compound_object.location.file}"
                )
        elif visibility == "friend":
            pass
        elif visibility == "property":
            print(
                f"Property not supported: {compound_object.compoundname} in {compound_object.location.file}"
            )
        else:
            print(
                f"Unknown class visibility: {visibility} in {compound_object.location.file}"
            )


def create_category_scope(
    snapshot: Snapshot,
    scope_def: compound.CompounddefType,
    exclude_symbols: list[re.Pattern] | None = None,
) -> None:
    """
    Create a category scope in the snapshot (Objective-C category).
    Categories extend existing classes with additional methods.
    The compound name is in the format: ClassName(CategoryName)
    """
    compound_name = scope_def.compoundname

    # Parse ClassName(CategoryName) format
    match = re.match(r"^(.+)\((.+)\)$", compound_name)
    if not match:
        print(f"Invalid category name format: {compound_name}")
        return

    class_name = match.group(1)
    category_name = match.group(2)

    category_scope = snapshot.create_category(class_name, category_name)
    category_scope.location = scope_def.location.file

    _process_objc_sections(
        snapshot,
        category_scope,
        scope_def.sectiondef,
        scope_def.location.file,
        "category",
        exclude_symbols=exclude_symbols,
    )
