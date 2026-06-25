# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from typing import TYPE_CHECKING

from .argument_parsing import _find_matching_angle, _split_arguments, Argument

if TYPE_CHECKING:
    from .scope import Scope


def qualify_arguments(arguments: list[Argument], scope: Scope) -> list[Argument]:
    """Qualify type and default-value references in a list of arguments."""
    result: list[Argument] = []
    for qualifiers, arg_type, name, default in arguments:
        qualified_type = qualify_type_str(arg_type, scope)
        qualified_default = scope.qualify_name(default)
        if qualified_default is not None:
            default = qualified_default

        result.append((qualifiers, qualified_type, name, default))
    return result


def qualify_type_str(type_str: str, scope: Scope) -> str:
    """Qualify a type string, handling trailing decorators (*, &, &&, etc.)."""
    return _qualify_type_str_impl(type_str, scope, qualify_base=True)


def _qualify_prefix_with_decorators(prefix: str, scope: Scope) -> str:
    """Qualify a template prefix that may have leading const/volatile qualifiers."""
    stripped = prefix.lstrip()
    decorator_prefix = ""
    changed = True
    while changed:
        changed = False
        # Handle leading const/volatile qualifiers (must have trailing space)
        for qualifier in ("const ", "volatile "):
            if stripped.startswith(qualifier):
                decorator_prefix += qualifier
                stripped = stripped[len(qualifier) :].lstrip()
                changed = True
                break

    if decorator_prefix and stripped:
        qualified_inner = scope.qualify_name(stripped)
        if qualified_inner is not None:
            return decorator_prefix + qualified_inner

    return prefix


def _qualify_type_str_impl(type_str: str, scope: Scope, qualify_base: bool) -> str:
    """Implementation of type string qualification with control over base type handling."""
    if not type_str:
        return type_str

    # Names starting with "::" are already globally qualified - skip re-qualification
    if type_str.lstrip().startswith("::") and qualify_base:
        return type_str[2:]

    # Handle template arguments first: qualify types inside angle brackets
    angle_start = type_str.find("<")
    if angle_start != -1:
        angle_end = _find_matching_angle(type_str, angle_start)
        if angle_end != -1:
            prefix = type_str[:angle_start]
            template_args = type_str[angle_start + 1 : angle_end]
            suffix = type_str[angle_end + 1 :]

            # Qualify the prefix (outer type before the template) only if requested
            # Use recursive qualification to handle leading decorators like "const *Type"
            if qualify_base:
                # Try simple qualification first
                simple_qualified = scope.qualify_name(prefix)
                if simple_qualified is not None:
                    qualified_prefix = simple_qualified
                else:
                    # Handle prefixes with leading decorators (const, *, &, etc.)
                    qualified_prefix = _qualify_prefix_with_decorators(prefix, scope)
            else:
                qualified_prefix = prefix

            # Split template arguments and qualify each one (always qualify args)
            args = _split_arguments(template_args)
            qualified_args = [
                _qualify_type_str_impl(arg.strip(), scope, qualify_base=True)
                for arg in args
            ]
            qualified_template = "<" + ", ".join(qualified_args) + ">"

            # Recursively qualify the suffix (handles nested templates, pointers, etc.)
            qualified_suffix = (
                _qualify_type_str_impl(suffix, scope, qualify_base=False)
                if suffix
                else ""
            )

            return qualified_prefix + qualified_template + qualified_suffix

    # If not qualifying base types, return as-is for non-template types
    if not qualify_base:
        return type_str

    # Handle leading const/volatile qualifiers.
    # Strip leading qualifiers, qualify the rest, and prepend back.
    stripped = type_str.lstrip()
    prefix = ""
    changed = True
    while changed:
        changed = False
        # Handle leading const/volatile qualifiers (must have trailing space)
        for qualifier in ("const ", "volatile "):
            if stripped.startswith(qualifier):
                prefix += qualifier
                stripped = stripped[len(qualifier) :].lstrip()
                changed = True
                break

    if prefix and stripped:
        qualified_inner = _qualify_type_str_impl(stripped, scope, qualify_base=True)
        if qualified_inner != stripped:
            return prefix + qualified_inner

    # Try qualifying the entire string (handles simple cases without templates)
    qualified = scope.qualify_name(type_str)
    if qualified is not None:
        return qualified

    # Handle function pointer/reference declarator prefix: "Type(*" or "Type(&"
    for declarator in ("(*", "(&"):
        if type_str.endswith(declarator):
            prefix = type_str[: -len(declarator)].rstrip()
            if prefix:
                q = qualify_type_str(prefix, scope)
                if q != prefix:
                    return q + declarator
            return type_str

    # Strip trailing pointer/reference/const decorators and try again.
    # Loop so that mixed sequences like "Type *const" or "Type const*" are
    # fully peeled regardless of order.
    stripped = type_str.rstrip()
    suffix = ""
    changed = True
    while changed:
        changed = False
        while stripped and stripped[-1] in ("*", "&"):
            suffix = stripped[-1] + suffix
            stripped = stripped[:-1].rstrip()
            changed = True
        # Handle trailing "const" (possibly preceded by space or pointer)
        if stripped.endswith(" const") or stripped.endswith("*const"):
            is_after_ptr = stripped.endswith("*const")
            suffix = "const " + suffix
            stripped = stripped[: -len("const")].rstrip()
            if is_after_ptr:
                # Re-enter loop to peel the '*' that preceded "const"
                pass
            changed = True

    if suffix and stripped:
        qualified = scope.qualify_name(stripped)
        if qualified is not None:
            suffix = suffix.rstrip()
            if "const" in suffix:
                return qualified + " " + suffix
            return qualified + suffix

    return type_str


def _qualify_text_before_args(text: str, scope: Scope) -> str:
    """Qualify the trailing return-type in a text segment that precedes an arg list.

    When ``parse_type_with_argstrings`` splits ``"std::function< Result(Param)"``
    the text segment ``"std::function< Result"`` contains a return type at the
    end that must be qualified independently.
    """
    # Try qualifying the whole text first (covers simple "Result" etc.)
    qualified = qualify_type_str(text, scope)
    if qualified != text:
        return qualified

    # Try qualifying just the last whitespace-delimited token
    stripped = text.rstrip()
    last_space = stripped.rfind(" ")
    if last_space == -1:
        return text

    prefix = stripped[: last_space + 1]
    last_token = stripped[last_space + 1 :]

    qualified_token = scope.qualify_name(last_token)
    if qualified_token is not None:
        return prefix + qualified_token

    return text


def qualify_parsed_type(
    segments: list[str | list[Argument]], scope: Scope
) -> list[str | list[Argument]]:
    """Qualify references inside parsed-type segments."""
    result: list[str | list[Argument]] = []
    for i, seg in enumerate(segments):
        if isinstance(seg, list):
            result.append(qualify_arguments(seg, scope))
        else:
            # If the next segment is a parsed argument list, the end of this
            # text likely contains a return type that needs qualification.
            next_is_args = i + 1 < len(segments) and isinstance(segments[i + 1], list)
            if next_is_args:
                result.append(_qualify_text_before_args(seg, scope))
            else:
                result.append(qualify_type_str(seg, scope))
    return result
