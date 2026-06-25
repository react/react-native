# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

import re
from dataclasses import dataclass

# Type alias for a parsed argument tuple:
#   (qualifiers, type, name, default_value)
# - qualifiers: leading CV-qualifiers like "const", "const volatile", or None
# - type: the core type without leading CV-qualifiers
# - name: the parameter name, or None if unnamedą
# - default_value: the default value expression, or None
Argument = tuple[str | None, str, str | None, str | None]


@dataclass
class FunctionModifiers:
    """Parsed function modifiers that appear after the parameter list."""

    is_const: bool = False
    is_override: bool = False
    is_final: bool = False
    is_noexcept: bool = False
    noexcept_expr: str | None = None
    is_pure_virtual: bool = False
    is_default: bool = False
    is_delete: bool = False


# Pattern for function pointer / pointer to member / reference to array:
# Matches: (*name), (Class::*name), (&name), (*name)[N]
# Group 1: the identifier name
_FUNC_PTR_PATTERN = re.compile(
    r"\(\s*"  # Opening paren
    r"(?:[a-zA-Z_][a-zA-Z0-9_]*\s*::\s*)?"  # Optional Class::
    r"[*&]\s*"  # * or &
    r"([a-zA-Z_][a-zA-Z0-9_]*)"  # Capture: identifier name
    r"\s*\)"  # Closing paren
)

# CV-qualifiers that should be extracted into the qualifiers field.
# These precede a type but are not part of the type name itself, so
# they must be separated to allow unambiguous type qualification later.
_CV_QUALIFIERS = frozenset({"const", "volatile", "mutable"})

# Type specifiers that ARE part of the type name (e.g. "unsigned long").
# They are kept in the type field, but are still used by
# _prefix_is_all_qualifiers to detect patterns like "unsigned long"
# where the last token completes the type rather than naming a parameter.
_TYPE_SPECIFIERS = frozenset({"unsigned", "signed", "long", "short"})

# Union of CV-qualifiers and type specifiers.  Used by
# _prefix_is_all_qualifiers to decide whether a prefix consists entirely
# of qualifier/specifier keywords.
_CPP_TYPE_QUALIFIERS = _CV_QUALIFIERS | _TYPE_SPECIFIERS


def _find_matching_bracket(
    s: str,
    start: int,
    open_char: str,
    close_char: str,
    ignore_inside: str | None = None,
) -> int:
    """Find the index of the closing bracket matching the opening one at start.

    Args:
        s: The string to search.
        start: The index of the opening bracket.
        open_char: The opening bracket character (e.g., '(' or '<').
        close_char: The closing bracket character (e.g., ')' or '>').
        ignore_inside: Optional bracket type inside which to ignore matches.
            If '(', ignores matches inside parentheses. If '<', ignores inside angles.

    Returns:
        The index of the matching closing bracket, or -1 if not found.
    """
    if start >= len(s) or s[start] != open_char:
        return -1

    depth = 0
    ignore_depth = 0
    ignore_open = ignore_close = ""
    if ignore_inside == "(":
        ignore_open, ignore_close = "(", ")"
    elif ignore_inside == "<":
        ignore_open, ignore_close = "<", ">"

    for i in range(start, len(s)):
        c = s[i]
        if ignore_open and c == ignore_open:
            ignore_depth += 1
        elif ignore_close and c == ignore_close:
            ignore_depth -= 1
        elif c == open_char and ignore_depth == 0:
            depth += 1
        elif c == close_char and ignore_depth == 0:
            depth -= 1
            if depth == 0:
                return i

    return -1


def _find_matching_paren(s: str, start: int = 0) -> int:
    """Find the index of the closing parenthesis matching the opening one at start."""
    return _find_matching_bracket(s, start, "(", ")")


def _find_matching_angle(s: str, start: int = 0) -> int:
    """Find the index of the closing angle bracket matching the opening one at start."""
    return _find_matching_bracket(s, start, "<", ">", ignore_inside="(")


def has_scope_resolution_outside_angles(name: str) -> bool:
    """Check if '::' appears outside angle brackets in a name.

    Returns True for class-prefixed out-of-class definitions
    (e.g. 'Strct< T >::VALUE') but False when '::' only appears inside
    template arguments (e.g. 'func<std::string>').
    """
    depth = 0
    i = 0
    while i < len(name):
        ch = name[i]
        if ch == "<":
            depth += 1
        elif ch == ">":
            depth -= 1
        elif ch == ":" and depth == 0 and i + 1 < len(name) and name[i + 1] == ":":
            return True
        i += 1
    return False


def _iter_at_depth_zero(s: str):
    """Iterate over string, yielding (index, char, at_depth_zero) tuples.

    Tracks nested parentheses, angle brackets, and braces. The at_depth_zero
    flag is True when all nesting depths are zero AFTER processing the current
    character (so brackets themselves are never at depth zero).
    """
    paren_depth = angle_depth = brace_depth = 0

    for i, c in enumerate(s):
        if c == "<":
            angle_depth += 1
        elif c == ">":
            angle_depth = max(0, angle_depth - 1)
        elif c == "(":
            paren_depth += 1
        elif c == ")":
            paren_depth = max(0, paren_depth - 1)
        elif c == "{":
            brace_depth += 1
        elif c == "}":
            brace_depth = max(0, brace_depth - 1)

        yield i, c, (paren_depth == 0 and angle_depth == 0 and brace_depth == 0)


def _split_arguments(args_str: str) -> list[str]:
    """Split arguments by comma, respecting nested structures.

    Handles:
    - Nested parentheses: std::function<int(int, int)>
    - Nested angle brackets: std::map<K, V>
    - Brace initializers: std::vector<int> v = {1, 2, 3}
    """
    result = []
    current: list[str] = []

    for _, c, at_zero in _iter_at_depth_zero(args_str):
        if c == "," and at_zero:
            result.append("".join(current).strip())
            current = []
        else:
            current.append(c)

    if current:
        result.append("".join(current).strip())

    return [arg for arg in result if arg]


def split_specialization(name: str) -> tuple[str, list[str] | None]:
    """Split a potentially specialized name into base name and specialization args.

    Examples:
        "Foo" -> ("Foo", None)
        "Foo<int>" -> ("Foo", ["int"])
        "Foo<int, float>" -> ("Foo", ["int", "float"])
        "Foo<Bar<int>>" -> ("Foo", ["Bar<int>"])
    """
    angle_start = name.find("<")
    if angle_start == -1 or not name.endswith(">"):
        return (name, None)
    args = _split_arguments(name[angle_start + 1 : -1])
    return (name[:angle_start], args if args else None)


def _prefix_is_all_qualifiers(prefix: str) -> bool:
    """Check if all tokens in the prefix are type qualifiers/specifiers.

    When the prefix consists entirely of reserved qualifiers (e.g., "const",
    "const unsigned"), the following token cannot be a parameter name — it
    must be completing the type.
    """
    return all(t in _CPP_TYPE_QUALIFIERS for t in prefix.split())


def _looks_like_type_token(token: str) -> bool:
    """Check if a token ends with type-related punctuation.

    Returns True if the token ends with pointer, reference, template closer,
    or array bracket — indicating it's part of a type, not a name.
    """
    return (
        token.endswith("*")
        or token.endswith("&")
        or token.endswith(">")
        or token.endswith("]")
    )


def _find_default_value_start(arg: str) -> int:
    """Find the position of '=' that starts a default value.

    Returns -1 if no default value found.
    Ignores '=' inside nested structures like templates or lambdas.
    """
    for i, c, at_zero in _iter_at_depth_zero(arg):
        if c == "=" and at_zero:
            return i
    return -1


def extract_qualifiers(type_str: str) -> tuple[str | None, str]:
    """Extract leading CV-qualifiers (const, volatile, mutable) from a type string.

    Returns ``(qualifiers, core_type)`` where *qualifiers* is ``None`` when
    no leading CV-qualifiers are found or when extracting them would leave
    the type empty.

    Examples::

        "const std::string&"    → ("const", "std::string&")
        "const volatile int*"   → ("const volatile", "int*")
        "unsigned long"         → (None, "unsigned long")
        "const unsigned long"   → ("const", "unsigned long")
        "int"                   → (None, "int")
        "mutable std::mutex"    → ("mutable", "std::mutex")
    """
    if not type_str:
        return (None, "")

    tokens = type_str.split()
    qual_count = 0
    for token in tokens:
        if token in _CV_QUALIFIERS:
            qual_count += 1
        else:
            break

    # No leading qualifiers, or ALL tokens are qualifiers (e.g. just "const")
    # — keep them in the type to avoid producing an empty type string.
    if qual_count == 0 or qual_count >= len(tokens):
        return (None, type_str)

    return (" ".join(tokens[:qual_count]), " ".join(tokens[qual_count:]))


def _parse_single_argument(arg: str) -> Argument:
    """Parse a single C++ argument into ``(qualifiers, type, name, default_value)``.

    Leading CV-qualifiers (``const``, ``volatile``, ``mutable``) are extracted
    into the *qualifiers* field so the *type* field contains only the core
    type reference that may later need namespace qualification.

    Handles complex cases::

        "int x"                        → (None, "int", "x", None)
        "const std::string& s"         → ("const", "std::string&", "s", None)
        "int x = 5"                    → (None, "int", "x", "5")
        "int (*callback)(int, int)"    → (None, "int (*)(int, int)", "callback", None)
        "void (Class::*method)()"      → (None, "void (Class::*)()", "method", None)
        "int (&arr)[10]"               → (None, "int (&)[10]", "arr", None)
        "void"                         → (None, "void", None, None)
        "const unsigned long"          → ("const", "unsigned long", None, None)
    """
    arg = arg.strip()
    if not arg:
        return (None, "", None, None)

    default_value: str | None = None
    base_arg = arg

    # Handle default values: split on '=' but respect nested structures
    eq_pos = _find_default_value_start(arg)
    if eq_pos != -1:
        base_arg = arg[:eq_pos].strip()
        default_value = arg[eq_pos + 1 :].strip()

    # Extract leading CV-qualifiers before further parsing
    qualifiers, base_arg = extract_qualifiers(base_arg)

    # Try to match function pointer / pointer to member / reference to array pattern
    match = _FUNC_PTR_PATTERN.search(base_arg)
    if match:
        name = match.group(1)
        # Reconstruct type by removing the name from the pattern
        type_str = base_arg[: match.start(1)] + base_arg[match.end(1) :]
        return (qualifiers, type_str.strip(), name, default_value)

    # Regular case: last token is the name
    parts = base_arg.rsplit(None, 1)
    if len(parts) == 2:
        prefix, potential_name = parts
        # The last token is NOT a name when:
        #  - it looks like a type token (ends with *, &, >, ]), OR
        #  - it is a CV-qualifier (trailing const/volatile), OR
        #  - the prefix is all qualifiers/specifiers AND the last token is
        #    also a type specifier (e.g. "unsigned long" — "long" completes
        #    the type rather than naming a parameter).
        if (
            _looks_like_type_token(potential_name)
            or potential_name in _CV_QUALIFIERS
            or (
                _prefix_is_all_qualifiers(prefix) and potential_name in _TYPE_SPECIFIERS
            )
        ):
            return (qualifiers, base_arg, None, default_value)
        # C++ parameter names cannot contain "::". Doxygen may
        # incorrectly cross-reference a parameter name to a member
        # variable, producing a qualified path (e.g. "bool
        # ns::Class::isActive" instead of "bool isActive"). Strip
        # the namespace prefix to recover the original name.
        if "::" in potential_name:
            potential_name = potential_name.rsplit("::", 1)[-1]
        return (qualifiers, prefix, potential_name, default_value)
    else:
        return (qualifiers, base_arg, None, default_value)


def _parse_modifiers(modifiers_str: str) -> FunctionModifiers:
    """Parse function modifiers after the parameter list.

    Handles: const, override, final, noexcept, noexcept(expr), = 0, = default, = delete
    """
    result = FunctionModifiers()
    s = modifiers_str.strip()

    # Handle = 0, = default, = delete
    eq_match = re.search(r"=\s*(0|default|delete)\s*$", s)
    if eq_match:
        value = eq_match.group(1)
        if value == "0":
            result.is_pure_virtual = True
        elif value == "default":
            result.is_default = True
        elif value == "delete":
            result.is_delete = True
        s = s[: eq_match.start()].strip()

    # Handle noexcept with optional expression
    noexcept_match = re.search(r"\bnoexcept\b", s)
    if noexcept_match:
        result.is_noexcept = True
        # Check for noexcept(expr)
        rest = s[noexcept_match.end() :]
        rest_stripped = rest.lstrip()
        if rest_stripped.startswith("("):
            paren_end = _find_matching_paren(rest_stripped, 0)
            if paren_end != -1:
                result.noexcept_expr = rest_stripped[1:paren_end].strip()
        # Remove noexcept and its expression from the string for further parsing
        s = s[: noexcept_match.start()] + s[noexcept_match.end() :]
        if result.noexcept_expr:
            # Also remove the (expr) part
            s = re.sub(r"\([^)]*\)", "", s, count=1)

    # Parse remaining tokens
    tokens = s.split()
    for token in tokens:
        if token == "const":
            result.is_const = True
        elif token == "override":
            result.is_override = True
        elif token == "final":
            result.is_final = True

    return result


def parse_arg_string(
    arg_string: str,
) -> tuple[list[Argument], FunctionModifiers]:
    """Parse a C++ function argument string.

    Args:
        arg_string: String in format "(type1 arg1, type2 arg2 = default) [modifiers]"

    Returns:
        Tuple of (arguments, modifiers) where:
        - arguments: list of (qualifiers, type, name, default_value) tuples
        - modifiers: FunctionModifiers dataclass with parsed modifier flags
    """
    arg_string = arg_string.strip()

    if not arg_string.startswith("("):
        return ([], FunctionModifiers())

    close_paren = _find_matching_paren(arg_string, 0)
    if close_paren == -1:
        return ([], FunctionModifiers())

    args_content = arg_string[1:close_paren].strip()
    modifiers_str = arg_string[close_paren + 1 :]

    arguments: list[Argument] = []
    if args_content:
        for arg in _split_arguments(args_content):
            parsed = _parse_single_argument(arg)
            if parsed[0] or parsed[1]:
                arguments.append(parsed)

    modifiers = _parse_modifiers(modifiers_str)

    return (arguments, modifiers)


def format_arguments(arguments: list[Argument]) -> str:
    """Format a list of parsed arguments into a comma-separated string.

    Args:
        arguments: list of (qualifiers, type, name, default_value) tuples as
            returned by parse_arg_string or _parse_single_argument.

    Returns:
        Formatted argument string, e.g. "const int x, float y = 0.0".
    """
    parts = []
    for qualifiers, arg_type, arg_name, arg_default in arguments:
        part = ""
        if qualifiers:
            part += f"{qualifiers} "
        part += arg_type
        if arg_name:
            part += f" {arg_name}"
        if arg_default:
            part += f" = {arg_default}"
        parts.append(part)
    return ", ".join(parts)


def parse_function_pointer_argstring(
    argstring: str,
) -> list[Argument]:
    """Parse a function pointer argstring of the form ')(args...)'.

    Doxygen represents function pointer arguments in the argstring field
    starting with ')(' — the ')' closes the declarator and '(' opens
    the parameter list.

    Args:
        argstring: Raw argstring from doxygen, e.g. ")(int x, float y)".

    Returns:
        List of (qualifiers, type, name, default_value) tuples for each parameter.
    """
    if not argstring or not argstring.startswith(")("):
        return []
    # Remove leading ')' to get '(args...)'
    inner = argstring[1:]
    arguments, _ = parse_arg_string(inner)
    return arguments


def parse_type_with_argstrings(
    type_str: str,
) -> list[str | list[Argument]]:
    """Parse a type string, extracting inline function argument lists.

    Doxygen sometimes embeds raw function signatures in type strings
    (e.g. for 'using' typedefs). This function splits the type into
    segments: plain-text fragments and parsed argument lists.

    Each segment is either:
    - A ``str``: literal text (e.g. ``"void"``, ``"(*)"``).
    - A ``list[Argument]``: a parsed argument list,
      where each tuple is ``(qualifiers, type, name, default_value)``.

    Handles cases like:
    - ``void(int x, float y)``
      → ``["void", [(None, "int", "x", None), (None, "float", "y", None)]]``
    - ``std::function<void(int x, float y)>``
      → ``["std::function<void", [(None, "int", "x", None), (None, "float", "y", None)], ">"]``
    - ``void(*)(int x, float y)``
      → ``["void(*)", [(None, "int", "x", None), (None, "float", "y", None)]]``
    - ``int``
      → ``["int"]``
    """
    if not type_str:
        return [type_str] if type_str is not None else []

    segments: list[str | list[Argument]] = []
    i = 0
    current_text: list[str] = []

    while i < len(type_str):
        if type_str[i] == "(":
            close = _find_matching_paren(type_str, i)
            if close == -1:
                current_text.append(type_str[i])
                i += 1
                continue

            inner = type_str[i + 1 : close]
            stripped = inner.strip()

            # Check if this is a declarator like (*) or (&) — don't parse those
            if stripped in ("*", "&") or re.match(
                r"^[a-zA-Z_][a-zA-Z0-9_]*\s*::\s*[*&]$", stripped
            ):
                current_text.append(type_str[i : close + 1])
                i = close + 1
                continue

            # Complex declarator starting with * or &, e.g. *(*fp)(int)
            # in "int(*(*fp)(int))(double)".  Argument lists never start
            # with pointer/reference characters.
            if stripped and stripped[0] in ("*", "&"):
                current_text.append(type_str[i : close + 1])
                i = close + 1
                continue

            # Try to parse as a function argument list
            args: list[Argument] = []
            if stripped:
                for arg in _split_arguments(stripped):
                    parsed = _parse_single_argument(arg)
                    if parsed[0] or parsed[1]:
                        args.append(parsed)

            if args:
                # Flush accumulated text as a plain segment
                if current_text:
                    segments.append("".join(current_text))
                    current_text = []
                segments.append(args)
            else:
                current_text.append(type_str[i : close + 1])
            i = close + 1
        else:
            current_text.append(type_str[i])
            i += 1

    if current_text:
        segments.append("".join(current_text))

    return segments


def format_parsed_type(
    segments: list[str | list[Argument]],
) -> str:
    """Format the structured output of :func:`parse_type_with_argstrings` back
    into a type string.

    Each segment is either a plain string (emitted as-is) or a parsed
    argument list (formatted as ``(qualifiers type name = default, ...)``).
    """
    parts: list[str] = []
    for seg in segments:
        if isinstance(seg, str):
            parts.append(seg)
        else:
            parts.append(f"({format_arguments(seg)})")
    return "".join(parts)
