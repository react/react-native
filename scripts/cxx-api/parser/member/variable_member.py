# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from typing import TYPE_CHECKING

from ..utils import (
    Argument,
    format_arguments,
    format_parsed_type,
    parse_function_pointer_argstring,
    parse_type_with_argstrings,
    qualify_arguments,
    qualify_parsed_type,
    split_specialization,
)
from .base import (
    is_function_pointer_argstring,
    Member,
    MemberKind,
    STORE_INITIALIZERS_IN_SNAPSHOT,
)

if TYPE_CHECKING:
    from ..scope import Scope


class VariableMember(Member):
    def __init__(
        self,
        name: str,
        type: str,
        visibility: str,
        is_const: bool,
        is_static: bool,
        is_constexpr: bool,
        is_mutable: bool,
        value: str | None,
        definition: str,
        argstring: str | None = None,
        is_brace_initializer: bool = False,
    ) -> None:
        base_name, specialization_args = split_specialization(name)
        super().__init__(base_name, visibility)
        self.specialization_args: list[str] | None = specialization_args
        self.type: str = type
        self.value: str | None = value
        self.is_const: bool = is_const
        self.is_static: bool = is_static
        self.is_constexpr: bool = is_constexpr
        self.is_mutable: bool = is_mutable
        self.is_brace_initializer: bool = is_brace_initializer
        self.definition: str = definition
        self.argstring: str | None = argstring
        self._fp_arguments: list[Argument] = (
            parse_function_pointer_argstring(argstring) if argstring else []
        )
        self._parsed_type: list[str | list[Argument]] = parse_type_with_argstrings(type)

    @property
    def member_kind(self) -> MemberKind:
        if self.is_const or self.is_constexpr:
            return MemberKind.CONSTANT
        return MemberKind.VARIABLE

    def close(self, scope: Scope):
        self._fp_arguments = qualify_arguments(self._fp_arguments, scope)
        self._parsed_type = qualify_parsed_type(self._parsed_type, scope)
        self._qualify_specialization_args(scope)

    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        name = self._get_qualified_name(qualification)

        result = " " * indent

        if self.template_list is not None:
            result += self.template_list.to_string() + "\n" + " " * indent

        if not hide_visibility:
            result += self.visibility + " "

        if self.is_static:
            result += "static "

        if self.is_constexpr:
            result += "constexpr "

        if self.is_mutable:
            result += "mutable "

        if self.is_const and not self.is_constexpr:
            result += "const "

        if is_function_pointer_argstring(self.argstring):
            formatted_args = format_arguments(self._fp_arguments)
            qualified_type = format_parsed_type(self._parsed_type)
            # Function pointer types: argstring is ")(args...)"
            # If type already contains "(*", e.g. "void *(*" or "void(*", use directly
            # Otherwise add "(*" to form proper function pointer syntax
            if "(*" in qualified_type:
                result += f"{qualified_type}{name})({formatted_args})"
            else:
                result += f"{qualified_type} (*{name})({formatted_args})"
        else:
            result += f"{format_parsed_type(self._parsed_type)} {name}"
            if self.argstring:
                result += self.argstring

        if STORE_INITIALIZERS_IN_SNAPSHOT and self.value is not None:
            if self.is_brace_initializer:
                result += f"{{{self.value}}}"
            else:
                result += f" = {self.value}"

        result += ";"

        return result
