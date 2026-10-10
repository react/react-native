# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Header tier classification for the C++ stable API visibility model.

Each header declares its tier by including one of the guards from
`react/cxxstableapi/`. Headers without a guard are unclassified.
"""

from __future__ import annotations

import enum
import fnmatch
import os
import re
from collections import deque
from dataclasses import dataclass


class Tier(enum.IntEnum):
    PRIVATE = 1
    FRAMEWORKS = 2
    PUBLIC = 3


DEFAULT_TIERS: frozenset[Tier] = frozenset({Tier.PUBLIC})

_GUARD_TIERS = {
    "Private": Tier.PRIVATE,
    "Frameworks": Tier.FRAMEWORKS,
    "Umbrella": Tier.PUBLIC,
}

_GUARD_RE = re.compile(
    r'^\s*#\s*include\s*[<"]react/cxxstableapi/(Private|Frameworks|Umbrella)Guard\.h[>"]',
    re.MULTILINE,
)

_INCLUDE_RE = re.compile(
    r'^\s*#\s*(?:include|import)\s*([<"])([^>"]+)[>"]',
    re.MULTILINE,
)

_GUARD_DIR = os.sep + os.path.join("react", "cxxstableapi") + os.sep


@dataclass
class HeaderGraph:
    # header path -> tier
    tiers: dict[str, Tier | None]
    # header path -> its direct includes
    includes: dict[str, list[str]]


@dataclass(frozen=True)
class BoundaryBreak:
    # From the declared header that starts the walk to the header it must not
    # reach; everything in between is unclassified.
    chain: tuple[str, ...]
    source_tier: Tier
    target_tier: Tier


def collect_headers(input_dirs: list[str], exclude_patterns: list[str]) -> list[str]:
    """
    Walk the input directories for `*.h` files, skipping any whose absolute
    path matches an exclude pattern (Doxygen `EXCLUDE_PATTERNS` semantics).
    """
    headers = set()
    for input_dir in input_dirs:
        for dirpath, _, filenames in os.walk(input_dir):
            for filename in filenames:
                if not filename.endswith(".h"):
                    continue
                path = os.path.abspath(os.path.join(dirpath, filename))
                if any(fnmatch.fnmatchcase(path, p) for p in exclude_patterns):
                    continue
                headers.add(path)
    return sorted(headers)


def _read_tier(content: str) -> Tier | None:
    match = _GUARD_RE.search(content)
    return _GUARD_TIERS[match.group(1)] if match else None


def _resolve_include(
    includer: str,
    delimiter: str,
    includee: str,
    headers: set[str],
    by_basename: dict[str, list[str]],
) -> list[str]:
    # #include "header.h"
    if delimiter == '"':
        sibling = os.path.normpath(os.path.join(os.path.dirname(includer), includee))
        # The compiler picks an existing sibling even when this view excludes
        # it, so falling back to a same-named header elsewhere would be wrong.
        if os.path.isfile(sibling):
            return [sibling] if sibling in headers else []

    # #include <header.h> or fall through
    suffix = os.sep + includee
    return [
        path
        for path in by_basename.get(os.path.basename(includee), [])
        if path.endswith(suffix)
    ]


def build_header_graph(headers: list[str]) -> HeaderGraph:
    # The guard headers declare nothing, so every header that includes one
    # would otherwise gain an edge into them.
    headers = [path for path in headers if _GUARD_DIR not in path]
    header_set = set(headers)
    by_basename: dict[str, list[str]] = {}
    for path in headers:
        by_basename.setdefault(os.path.basename(path), []).append(path)

    tiers: dict[str, Tier | None] = {}
    includes: dict[str, list[str]] = {}
    for path in headers:
        with open(path, encoding="utf-8", errors="replace") as f:
            content = f.read()
        tiers[path] = _read_tier(content)
        resolved: list[str] = []
        for delimiter, includee in _INCLUDE_RE.findall(content):
            for target in _resolve_include(
                path, delimiter, includee, header_set, by_basename
            ):
                if target != path and target not in resolved:
                    resolved.append(target)
        includes[path] = resolved

    return HeaderGraph(tiers=tiers, includes=includes)


def classify_headers(input_dirs: list[str], exclude_patterns: list[str]) -> HeaderGraph:
    return build_header_graph(collect_headers(input_dirs, exclude_patterns))


def find_boundary_breaks(graph: HeaderGraph) -> list[BoundaryBreak]:
    """
    Find every declared public or frameworks header that reaches a less
    visible declared header, directly or through unclassified headers.

    The walk stops at declared headers: whatever a declared header reaches is
    reported from that header's own walk, so each break is reported once, at
    the edge where visibility actually drops.
    """
    breaks: list[BoundaryBreak] = []
    for source_tier in (Tier.PUBLIC, Tier.FRAMEWORKS):
        sources = sorted(
            path for path, tier in graph.tiers.items() if tier == source_tier
        )
        for source in sources:
            parents: dict[str, str | None] = {source: None}
            queue = deque([source])

            while queue:
                node = queue.popleft()
                for target in graph.includes.get(node, []):
                    if target in parents:
                        continue
                    parents[target] = node
                    target_tier = graph.tiers.get(target)
                    if target_tier is None:
                        queue.append(target)
                    elif target_tier < source_tier:
                        breaks.append(
                            BoundaryBreak(
                                chain=_chain_to(target, parents),
                                source_tier=source_tier,
                                target_tier=target_tier,
                            )
                        )
    return breaks


def parse_tier(name: str) -> Tier:
    try:
        return Tier[name.upper()]
    except KeyError:
        valid = ", ".join(tier.name.lower() for tier in Tier)
        raise ValueError(f"Unknown tier '{name}', expected one of: {valid}") from None


def skipped_headers(
    graph: HeaderGraph, included_tiers: frozenset[Tier] = DEFAULT_TIERS
) -> set[str]:
    """
    Classified headers outside `included_tiers` that no header in an included
    tier reaches. A header reachable from an included one is effectively part
    of that tier, whatever its guard says.
    """
    reachable = {path for path, tier in graph.tiers.items() if tier in included_tiers}
    queue = deque(reachable)
    while queue:
        node = queue.popleft()
        for target in graph.includes.get(node, []):
            if target not in reachable:
                reachable.add(target)
                queue.append(target)

    return {
        path
        for path, tier in graph.tiers.items()
        if tier is not None and tier not in included_tiers and path not in reachable
    }


def _chain_to(target: str, parents: dict[str, str | None]) -> tuple[str, ...]:
    chain = []
    node: str | None = target
    while node is not None:
        chain.append(node)
        node = parents[node]
    return tuple(reversed(chain))
