#!/usr/bin/env fbpython
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import re


# Sentinel tokens used to encode ObjC generics into the class name so they
# survive Doxygen processing.  The parser decodes them back into angle-bracket
# syntax when building the snapshot.
GENERICS_START = "__GENERICS__"
GENERICS_END = "__ENDGENERICS__"
GENERICS_COMMA = "__COMMA__"


def encode_objc_interface_generics(content: str) -> str:
    """
    Encode ObjC lightweight generic type parameters on @interface declarations
    into the class name so Doxygen doesn't misinterpret them as C++ templates.

    Doxygen treats angle brackets in ``@interface Foo<T> : Base`` as template
    syntax, which corrupts the XML output (wrong base class, __pad0__
    artifacts, property attribute leaks).  We encode ``<T>`` into the class
    name as ``__GENERICS__T__ENDGENERICS__`` so the name remains a valid C
    identifier.  The parser later decodes it back to ``Foo<T>``.

    Only generics *immediately* after the class name are affected.  Protocol
    conformances like ``Base <Protocol>`` (with a space) are left untouched.
    """

    def _encode(match: re.Match) -> str:
        prefix = match.group(1)  # "@interface ClassName"
        params = match.group(2)  # "K, V"
        parts = [p.strip() for p in params.split(",")]
        encoded = GENERICS_COMMA.join(parts)
        return f"{prefix}{GENERICS_START}{encoded}{GENERICS_END}"

    # Match @interface followed by a name immediately followed by <...> (no space).
    # This distinguishes generics (no space) from protocol conformance (space before <).
    pattern = re.compile(r"(@interface\s+\w+)<([^>]+)>")
    return pattern.sub(_encode, content)


def decode_objc_generics(name: str) -> str:
    """
    Decode an encoded class name back to its original generic syntax.

    ``Foo__GENERICS__K__COMMA__V__ENDGENERICS__`` → ``Foo<K, V>``
    """
    match = re.match(
        rf"^(.+?){re.escape(GENERICS_START)}(.+?){re.escape(GENERICS_END)}$",
        name,
    )
    if not match:
        return name
    class_name = match.group(1)
    params = match.group(2).replace(GENERICS_COMMA, ", ")
    return f"{class_name}<{params}>"
