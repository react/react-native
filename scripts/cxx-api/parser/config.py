# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Config parsing module for C++ API snapshot generation.

This module handles parsing of the config.yml file and provides
structured objects representing API views and their variants.
"""

import os
from dataclasses import dataclass, field

import yaml

from .tiers import DEFAULT_TIERS, parse_tier, Tier


@dataclass
class ApiViewVariant:
    """Represents a build variant (e.g., debug, release) for an API view."""

    name: str
    definitions: dict[str, str | int] = field(default_factory=dict)
    visibility: frozenset[Tier] = DEFAULT_TIERS


@dataclass
class ApiViewSnapshotConfig:
    """
    A fully resolved configuration for generating a single snapshot.

    This combines the base view settings with variant-specific definitions.
    """

    snapshot_name: str
    inputs: list[str]
    exclude_patterns: list[str]
    definitions: dict[str, str | int]
    codegen_platform: str | None = None
    input_filter: bool = False
    exclude_symbols: list[str] = field(default_factory=list)
    visibility: frozenset[Tier] = DEFAULT_TIERS


def _parse_visibility(
    names: list[str] | None, default: frozenset[Tier]
) -> frozenset[Tier]:
    if names is None:
        return default
    return frozenset(parse_tier(name) for name in names)


def parse_config(
    raw_config: dict,
    base_dir: str,
) -> list[ApiViewSnapshotConfig]:
    """
    Parse a raw config dictionary and return a flattened list of snapshot configs.

    The config must contain:
      - An optional top-level ``exclude_patterns`` list that is prepended to
        every platform's own ``exclude_patterns``.
      - An optional top-level ``visibility`` list of C++ stable API tiers,
        used by platforms that do not set their own. Defaults to ``[public]``.
      - A ``platforms`` mapping whose values are per-platform view configs.

    Args:
        raw_config: Dictionary containing the parsed YAML config
        base_dir: Base directory for resolving relative input paths

    Returns:
        Flattened list of ApiViewSnapshotConfig objects for all views and variants
    """
    global_exclude_patterns: list[str] = raw_config.get("exclude_patterns") or []
    global_exclude_symbols: list[str] = raw_config.get("exclude_symbols") or []
    global_visibility = _parse_visibility(raw_config.get("visibility"), DEFAULT_TIERS)
    platforms: dict = raw_config.get("platforms") or {}

    snapshot_configs = []

    for view_name, view_config in platforms.items():
        inputs = [
            path if path.startswith("/") else os.path.join(base_dir, path)
            for path in (view_config.get("inputs") or [])
        ]

        codegen_config = view_config.get("codegen") or {}
        codegen_platform = codegen_config.get("platform")
        exclude_patterns = view_config.get("exclude_patterns") or []
        input_filter = view_config.get("input_filter", False)
        base_definitions = view_config.get("definitions") or {}

        exclude_platform_patterns = view_config.get("exclude_patterns") or []
        seen: set[str] = set()
        merged_patterns: list[str] = []
        for pattern in global_exclude_patterns + exclude_platform_patterns:
            if pattern not in seen:
                merged_patterns.append(pattern)
                seen.add(pattern)
        exclude_patterns = merged_patterns

        platform_exclude_symbols = view_config.get("exclude_symbols") or []
        seen_symbols: set[str] = set()
        merged_symbols: list[str] = []
        for symbol in global_exclude_symbols + platform_exclude_symbols:
            if symbol not in seen_symbols:
                merged_symbols.append(symbol)
                seen_symbols.add(symbol)
        exclude_symbols = merged_symbols
        visibility = _parse_visibility(view_config.get("visibility"), global_visibility)

        raw_variants = view_config.get("variants") or {}
        variants = [
            ApiViewVariant(
                name=variant_name,
                definitions=variant_config.get("definitions") or {},
                visibility=_parse_visibility(
                    variant_config.get("visibility"), visibility
                ),
            )
            for variant_name, variant_config in raw_variants.items()
        ]

        if not variants:
            snapshot_configs.append(
                ApiViewSnapshotConfig(
                    snapshot_name=view_name,
                    inputs=inputs,
                    exclude_patterns=exclude_patterns,
                    definitions=base_definitions,
                    codegen_platform=codegen_platform,
                    input_filter=input_filter,
                    exclude_symbols=exclude_symbols,
                    visibility=visibility,
                )
            )
        else:
            for variant in variants:
                merged_definitions = {**base_definitions, **variant.definitions}
                variant_suffix = variant.name.capitalize()
                snapshot_configs.append(
                    ApiViewSnapshotConfig(
                        snapshot_name=f"{view_name}{variant_suffix}",
                        inputs=inputs,
                        exclude_patterns=exclude_patterns,
                        definitions=merged_definitions,
                        codegen_platform=codegen_platform,
                        input_filter=input_filter,
                        exclude_symbols=exclude_symbols,
                        visibility=variant.visibility,
                    )
                )

    return snapshot_configs


def parse_config_file(
    config_path: str,
    base_dir: str,
) -> list[ApiViewSnapshotConfig]:
    """
    Parse the config.yml file and return a flattened list of snapshot configs.

    Args:
        config_path: Path to the config.yml file
        base_dir: Base directory for resolving relative input paths

    Returns:
        Flattened list of ApiViewSnapshotConfig objects for all views and variants
    """
    with open(config_path, "r") as stream:
        raw_config = yaml.safe_load(stream)

    return parse_config(raw_config, base_dir)
