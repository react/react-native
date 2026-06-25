# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Utilities for comparing API snapshots.
"""

import difflib
import os
import sys


def validate_snapshots(
    generated_dir: str, committed_dir: str, output_file: str | None = None
) -> bool:
    """Compare generated snapshots against committed ones.

    Returns True if validation passes (snapshots match or no committed snapshots).
    Returns False if snapshots differ.

    If output_file is provided, writes comparison results to that file
    instead of stdout.
    """
    out = open(output_file, "w") if output_file else sys.stdout
    try:
        return _check_snapshots_impl(generated_dir, committed_dir, out)
    finally:
        if output_file:
            out.close()


def _check_snapshots_impl(generated_dir: str, committed_dir: str, out) -> bool:
    if not os.path.isdir(committed_dir):
        print(f"No committed snapshots directory found at: {committed_dir}", file=out)
        print("Skipping comparison (no baseline to compare against)", file=out)
        return True

    committed_files = sorted(f for f in os.listdir(committed_dir) if f.endswith(".api"))
    generated_files = sorted(f for f in os.listdir(generated_dir) if f.endswith(".api"))

    if not committed_files:
        print("No committed snapshot files found", file=out)
        print("Skipping comparison (no baseline to compare against)", file=out)
        return True

    committed_set = set(committed_files)
    generated_set = set(generated_files)
    all_passed = True

    for filename in sorted(committed_set | generated_set):
        committed_path = os.path.join(committed_dir, filename)
        generated_path = os.path.join(generated_dir, filename)

        if filename not in generated_set:
            print(
                f"FAIL: {filename} exists in committed snapshots but was not generated",
                file=out,
            )
            all_passed = False
            continue

        if filename not in committed_set:
            print(f"OK: {filename} generated (no committed baseline)", file=out)
            continue

        with open(committed_path) as f:
            committed_content = f.read()
        with open(generated_path) as f:
            generated_content = f.read()

        if committed_content == generated_content:
            print(f"OK: {filename} matches committed snapshot", file=out)
        else:
            print(f"FAIL: {filename} differs from committed snapshot", file=out)
            diff = "\n".join(
                difflib.unified_diff(
                    committed_content.splitlines(),
                    generated_content.splitlines(),
                    fromfile=f"committed/{filename}",
                    tofile=f"generated/{filename}",
                    lineterm="",
                )
            )
            print(diff, file=out)
            all_passed = False

    return all_passed
