# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Functions for resolving text content from Doxygen XML types.
"""

from __future__ import annotations

import re
from enum import Enum

from doxmlparser import compound


# Doxygen's encoding for special characters in refids, ordered longest-first
# to avoid partial matches during replacement.
_DOXYGEN_TEMPLATE_ENCODINGS = (
    ("_8_8_8", "..."),  # Variadic ellipsis
    ("_00", ", "),  # Comma (with space for readability)
    ("_01", " "),  # Space
    ("_02", "*"),  # Pointer
    ("_05", "="),  # Equals
    ("_06", "&"),  # Reference
    ("_07", "("),  # Open paren
    ("_08", ")"),  # Close paren
    ("_3", "<"),  # Template open
    ("_4", ">"),  # Template close
)


def decode_doxygen_template_encoding(encoded: str) -> str:
    """Decode Doxygen's encoding for template specializations in refids.

    Doxygen encodes special characters in refids using underscore-prefixed codes.
    e.g. 'SyncCallback_3_01R_07Args_8_8_8_08_4' -> 'SyncCallback< R(Args...)>'
    """
    result = encoded
    for pattern, replacement in _DOXYGEN_TEMPLATE_ENCODINGS:
        result = result.replace(pattern, replacement)
    return result


def extract_namespace_from_refid(refid: str) -> str:
    """Extract the namespace prefix from a doxygen refid.
    e.g. 'namespacefacebook_1_1yoga_1a...' -> 'facebook::yoga'
         'structfacebook_1_1react_1_1detail_1_1is__dynamic' -> 'facebook::react::detail::is_dynamic'
         'classfacebook_1_1react_1_1SyncCallback_3_01R_07Args_8_8_8_08_4' -> 'facebook::react::SyncCallback< R(Args...)>'

    Doxygen encoding:
    - '::' is encoded as '_1_1'
    - '_' in identifiers is encoded as '__' (double underscore)
    - Template specializations are encoded with hex-like codes (see decode_doxygen_template_encoding)
    """
    for prefix in ("namespace", "struct", "class", "union"):
        if refid.startswith(prefix):
            compound_part = refid[len(prefix) :]
            idx = compound_part.find("_1a")
            if idx != -1:
                compound_part = compound_part[:idx]
            # First replace '::' encoding (_1_1 -> ::)
            result = compound_part.replace("_1_1", "::")
            # Then replace double underscore with single underscore
            # (Doxygen encodes '_' in identifiers as '__')
            result = result.replace("__", "_")
            # Decode template specialization encodings
            result = decode_doxygen_template_encoding(result)
            return result
    return ""


def normalize_angle_brackets(text: str) -> str:
    """Doxygen adds spaces around < and > to avoid XML ambiguity.
    e.g. "NSArray< id< RCTBridgeMethod > > *" -> "NSArray<id<RCTBridgeMethod>>*"
    """
    text = re.sub(r"<\s+", "<", text)
    text = re.sub(r"\s+>", ">", text)
    return text


def normalize_nullability(text: str) -> str:
    """Normalize Objective-C nullability annotations to a consistent form.

    There are three forms of nullability annotations in Objective-C:
    - nonnull/nullable (context-sensitive keywords, typically used as prefix)
    - _Nonnull/_Nullable (type qualifiers, can appear after the type)
    - __nonnull/__nullable (legacy Apple macros, deprecated but still used)

    This function normalizes all forms to _Nonnull/_Nullable, which is the
    most flexible form that can be used in any position.
    """
    # Normalize __nonnull -> _Nonnull (must come before nonnull)
    text = re.sub(r"\b__nonnull\b", "_Nonnull", text)
    # Normalize nonnull -> _Nonnull (negative lookbehind to avoid _Nonnull)
    text = re.sub(r"(?<!_)\bnonnull\b", "_Nonnull", text)

    # Normalize __nullable -> _Nullable (must come before nullable)
    text = re.sub(r"\b__nullable\b", "_Nullable", text)
    # Normalize nullable -> _Nullable (negative lookbehind to avoid _Nullable)
    text = re.sub(r"(?<!_)\bnullable\b", "_Nullable", text)

    return text


def normalize_pointer_spacing(text: str) -> str:
    """Normalize spacing around pointer (*) and reference (&, &&) symbols.

    Doxygen outputs types with a space before * and &, e.g.:
    - "NSString *" -> "NSString*"
    - "int &" -> "int&"
    - "T &&" -> "T&&"

    But for function arguments like "NSString *name", we want "NSString* name"
    (space moved from before * to after *).

    This normalizes to have no space before the pointer/reference symbol,
    while preserving the space after if there's an identifier following.
    """
    # For patterns like "Type *name" -> "Type* name" (move space from before to after)
    # Match: word/type character or > followed by space(s), then *, then word char
    text = re.sub(r"(\w|>)\s+\*(\w)", r"\1* \2", text)
    # For patterns like "Type *" at end or before comma/paren/angle/open-paren -> "Type*"
    text = re.sub(r"(\w|>)\s+\*(?=\s*[,)>(]|$)", r"\1*", text)
    # For patterns like "Type *" followed by another * (pointer to pointer)
    text = re.sub(r"(\w|>)\s+\*(?=\*)", r"\1*", text)

    # Same for && (rvalue reference)
    text = re.sub(r"(\w|>)\s+&&(\w)", r"\1&& \2", text)
    text = re.sub(r"(\w|>)\s+&&(?=\s*[,)>(]|$)", r"\1&&", text)

    # Same for & (lvalue reference) - but don't match &&
    text = re.sub(r"(\w|>)\s+&(?!&)(\w)", r"\1& \2", text)
    text = re.sub(r"(\w|>)\s+&(?!&)(?=\s*[,)>(]|$)", r"\1&", text)

    return text


class InitializerType(Enum):
    NONE = (0,)
    ASSIGNMENT = (1,)
    BRACE = 2


def resolve_linked_text_name(
    type_def: compound.linkedTextType,
    strip_initializers: bool = False,
) -> (str, InitializerType):
    """
    Resolve the full text content of a linkedTextType, including all text
    fragments and ref elements.
    """
    name = ""
    in_string = False

    if hasattr(type_def, "content_") and type_def.content_:
        for part in type_def.content_:
            if part.category == 1:  # MixedContainer.CategoryText
                in_string = part.value.count('"') % 2 != in_string
                name += part.value
            elif part.category == 3:  # MixedContainer.CategoryComplex (ref element)
                # For ref elements, get the text content and fully qualify using refid
                text = ""
                if hasattr(part.value, "get_valueOf_"):
                    text = part.value.get_valueOf_()
                elif hasattr(part.value, "valueOf_"):
                    text = part.value.valueOf_
                else:
                    text = str(part.value)

                # Don't resolve refs inside string literals - doxygen may
                # incorrectly treat symbols in strings as references
                refid = getattr(part.value, "refid", None)
                if refid and not in_string:
                    text = _qualify_text_with_refid(text, refid)

                name += text
    elif type_def.ref:
        name = type_def.ref[0].get_valueOf_()
    else:
        name = type_def.get_valueOf_()

    initialier_type = InitializerType.NONE
    if strip_initializers:
        if name.startswith("="):
            # Detect assignment initializers: = value
            initialier_type = InitializerType.ASSIGNMENT
            name = name[1:]
        elif name.startswith("{") and name.endswith("}"):
            # Detect brace initializers: {value}
            initialier_type = InitializerType.BRACE
            name = name[1:-1].strip()

    return (
        normalize_nullability(
            normalize_pointer_spacing(normalize_angle_brackets(name.strip()))
        ),
        initialier_type,
    )


def _qualify_text_with_refid(text: str, refid: str) -> str:
    """Qualify a text symbol using the namespace extracted from its doxygen refid.

    For ref elements, doxygen provides a refid that encodes the fully qualified
    path to the referenced symbol. This function extracts the namespace from
    that refid and prepends it to the text, avoiding redundant qualification.

    Args:
        text: The symbol text (e.g., "SyncCallback")
        refid: The doxygen refid (e.g., "classfacebook_1_1react_1_1SyncCallback...")

    Returns:
        The qualified text (e.g., "facebook::react::SyncCallback")
    """
    ns = extract_namespace_from_refid(refid)

    # Skip re-qualification if text is already globally qualified
    # (starts with "::") - it's already an absolute path
    if not ns or text.startswith(ns) or text.startswith("::"):
        return text

    # The text may already start with a trailing portion of the namespace.
    # For example ns="facebook::react::HighResDuration" and
    # text="HighResDuration::zero". We need to find the longest suffix of ns
    # that is a prefix of text (on a "::" boundary) and only prepend the
    # missing part.
    ns_parts = ns.split("::")
    prepend = ns

    for i in range(1, len(ns_parts)):
        suffix = "::".join(ns_parts[i:])
        # Also compare without template args - for template specializations
        # like "SyncCallback< R(Args...)>", text "SyncCallback" should match
        base_suffix = _strip_template_args(ns_parts[i])
        if (
            text.startswith(suffix + "::")
            or text == suffix
            or text.startswith(base_suffix + "::")
            or text == base_suffix
        ):
            prepend = "::".join(ns_parts[:i])
            break

    return prepend + "::" + text


def _strip_template_args(name: str) -> str:
    """Strip template arguments from a type name.

    e.g. 'SyncCallback< R(Args...)>' -> 'SyncCallback'
    """
    angle_idx = name.find("<")
    return name[:angle_idx].rstrip() if angle_idx != -1 else name
