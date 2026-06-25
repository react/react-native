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
)
from .base import is_function_pointer_argstring, Member, MemberKind

if TYPE_CHECKING:
    from ..scope import Scope


class TypedefMember(Member):
    def __init__(
        self, name: str, type: str, argstring: str | None, visibility: str, keyword: str
    ) -> None:
        super().__init__(name, visibility)
        self.keyword: str = keyword
        self.argstring: str | None = argstring

        # Parse function pointer argstrings (e.g. ")(int x, float y)")
        self._fp_arguments: list[Argument] = (
            parse_function_pointer_argstring(argstring) if argstring else []
        )

        # Parse inline function signatures in the type so that argument
        # lists are stored as structured data, not raw strings.
        self._parsed_type: list[str | list[Argument]] = parse_type_with_argstrings(type)
        self.type: str = type

    @property
    def member_kind(self) -> MemberKind:
        return MemberKind.TYPE_ALIAS

    def close(self, scope: Scope):
        self._fp_arguments = qualify_arguments(self._fp_arguments, scope)
        self._parsed_type = qualify_parsed_type(self._parsed_type, scope)

    def get_value(self) -> str:
        if self.keyword == "using":
            return format_parsed_type(self._parsed_type)
        elif is_function_pointer_argstring(self.argstring):
            formatted_args = format_arguments(self._fp_arguments)
            qualified_type = format_parsed_type(self._parsed_type)
            if "(*" in qualified_type:
                return f"{qualified_type})({formatted_args})"
            else:
                return f"{qualified_type}(*)({formatted_args})"
        else:
            return self.type

    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        name = self._get_qualified_name(qualification)
        result = " " * indent

        if self.keyword == "using" and self.template_list is not None:
            result += self.template_list.to_string() + "\n" + " " * indent

        if not hide_visibility:
            result += self.visibility + " "

        result += self.keyword

        if self.keyword == "using":
            result += f" {name} = {format_parsed_type(self._parsed_type)};"
        elif is_function_pointer_argstring(self.argstring):
            formatted_args = format_arguments(self._fp_arguments)
            qualified_type = format_parsed_type(self._parsed_type)
            # Function pointer typedef: "typedef return_type (*name)(args);"
            # type is e.g. "void(*", argstring is ")(args...)"
            if "(*" in qualified_type:
                result += f" {qualified_type}{name})({formatted_args});"
            else:
                result += f" {qualified_type}(*{name})({formatted_args});"
        else:
            result += f" {self.type} {name};"

        return result
