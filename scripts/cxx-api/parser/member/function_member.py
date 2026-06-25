# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

from typing import TYPE_CHECKING

from ..utils import (
    Argument,
    format_arguments,
    parse_arg_string,
    qualify_arguments,
    qualify_type_str,
    split_specialization,
)
from .base import Member, MemberKind

if TYPE_CHECKING:
    from ..scope import Scope


class FunctionMember(Member):
    def __init__(
        self,
        name: str,
        type: str,
        visibility: str,
        arg_string: str,
        is_virtual: bool,
        is_pure_virtual: bool,
        is_static: bool,
        doxygen_params: list[Argument] | None = None,
        is_constexpr: bool = False,
    ) -> None:
        base_name, specialization_args = split_specialization(name)
        super().__init__(base_name, visibility)
        self.specialization_args: list[str] | None = specialization_args
        self.type: str = type
        self.is_virtual: bool = is_virtual
        self.is_static: bool = is_static
        self.is_constexpr: bool = is_constexpr
        parsed_arguments, self.modifiers = parse_arg_string(arg_string)
        self.arguments = (
            doxygen_params if doxygen_params is not None else parsed_arguments
        )

        # Doxygen signals pure-virtual via the virt attribute, but the arg string
        # may not contain "= 0" (e.g. trailing return type syntax), so the
        # modifiers parsed from the arg string may miss it. Propagate the flag.
        if is_pure_virtual:
            self.modifiers.is_pure_virtual = True

        self.is_const = self.modifiers.is_const
        self.is_override = self.modifiers.is_override

    @property
    def member_kind(self) -> MemberKind:
        if self.name.startswith("operator"):
            return MemberKind.OPERATOR
        return MemberKind.FUNCTION

    def close(self, scope: Scope):
        self.type = qualify_type_str(self.type, scope)
        self.arguments = qualify_arguments(self.arguments, scope)
        self._qualify_specialization_args(scope)
        self._qualify_conversion_operator_type(scope)

    def _qualify_conversion_operator_type(self, scope: Scope) -> None:
        """Qualify the type portion of conversion operator names.

        Conversion operators like ``operator jsi::Array`` contain a type
        reference that may need namespace qualification (e.g., to
        ``operator facebook::jsi::Array``).
        """
        prefix = "operator "
        if not self.name.startswith(prefix):
            return

        type_part = self.name[len(prefix) :]
        if not type_part or not (type_part[0].isalpha() or type_part[0] == "_"):
            return

        qualified = qualify_type_str(type_part, scope)
        if qualified != type_part:
            self.name = prefix + qualified

    def to_string(
        self,
        indent: int = 0,
        qualification: str | None = None,
        hide_visibility: bool = False,
    ) -> str:
        name = self._get_qualified_name(qualification)
        result = ""

        if self.template_list is not None:
            result += " " * indent + self.template_list.to_string() + "\n"

        result += " " * indent

        if not hide_visibility:
            result += self.visibility + " "

        if self.is_virtual:
            result += "virtual "

        if self.is_static:
            result += "static "

        if self.is_constexpr:
            result += "constexpr "

        if self.type:
            result += f"{self.type} "

        result += f"{name}({format_arguments(self.arguments)})"

        if self.modifiers.is_const:
            result += " const"

        if self.modifiers.is_noexcept:
            if self.modifiers.noexcept_expr:
                result += f" noexcept({self.modifiers.noexcept_expr})"
            else:
                result += " noexcept"

        if self.modifiers.is_override:
            result += " override"

        if self.modifiers.is_final:
            result += " final"

        if self.modifiers.is_pure_virtual:
            result += " = 0"
        elif self.modifiers.is_default:
            result += " = default"
        elif self.modifiers.is_delete:
            result += " = delete"

        result += ";"
        return result
