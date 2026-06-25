# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from .argument_parsing import (
    Argument,
    extract_qualifiers,
    format_arguments,
    format_parsed_type,
    FunctionModifiers,
    has_scope_resolution_outside_angles,
    parse_arg_string,
    parse_function_pointer_argstring,
    parse_type_with_argstrings,
    split_specialization,
)
from .qualified_path import parse_qualified_path
from .text_resolution import (
    extract_namespace_from_refid,
    InitializerType,
    normalize_angle_brackets,
    normalize_pointer_spacing,
    resolve_linked_text_name,
)
from .type_qualification import qualify_arguments, qualify_parsed_type, qualify_type_str

__all__ = [
    "Argument",
    "extract_namespace_from_refid",
    "extract_qualifiers",
    "format_arguments",
    "format_parsed_type",
    "FunctionModifiers",
    "has_scope_resolution_outside_angles",
    "InitializerType",
    "normalize_angle_brackets",
    "normalize_pointer_spacing",
    "parse_arg_string",
    "parse_function_pointer_argstring",
    "parse_qualified_path",
    "parse_type_with_argstrings",
    "qualify_arguments",
    "qualify_parsed_type",
    "qualify_type_str",
    "resolve_linked_text_name",
    "split_specialization",
]
