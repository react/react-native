# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

import difflib
import importlib.resources as ir
import os
import subprocess
import unittest
from importlib.resources.abc import Traversable
from pathlib import Path
from typing import Iterable

from ..parser import build_snapshot, get_repo_root


def _resource_root() -> Traversable:
    """Get the root directory containing test case snapshots.

    Resources are included directly via glob(["tests/snapshots/**/*"]) in BUCK.
    Files are mapped at their original paths (e.g., tests/snapshots/test1/...).
    """
    pkg_root = ir.files(__package__ if __package__ else "__main__")
    return pkg_root / "snapshots"


def _iter_case_dirs(root: Traversable) -> Iterable[Traversable]:
    """Iterate over test case directories."""
    return sorted([p for p in root.iterdir() if p.is_dir()], key=lambda p: p.name)


def _assert_text_equal_with_diff(
    tc: unittest.TestCase, expected: str, got: str, *, case: str
) -> None:
    if expected == got:
        return
    diff = "\n".join(
        difflib.unified_diff(
            expected.splitlines(),
            got.splitlines(),
            fromfile=f"{case}/snapshot.api (expected)",
            tofile=f"{case}/generated (got)",
            lineterm="",
        )
    )
    tc.fail(diff)


def _generate_doxygen_api(
    case_dir_path: str, doxygen_config_path: str, filter_script_path: str | None = None
) -> None:
    """Run doxygen to generate XML API documentation."""
    env = os.environ.copy()
    if filter_script_path:
        env["DOXYGEN_INPUT_FILTER"] = f"python3 {filter_script_path}"

    doxygen_bin = env.get("DOXYGEN_BIN", "doxygen")
    result = subprocess.run(
        [doxygen_bin, doxygen_config_path],
        cwd=case_dir_path,
        capture_output=True,
        text=True,
        env=env,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Doxygen failed: {result.stderr}")


def _get_source_snapshots_dir() -> Path:
    """Get the actual source directory for snapshots (for writing snapshots).

    This finds the original source directory, not the packaged resources.
    Used when UPDATE_SNAPSHOT=1 to write new snapshots.
    """
    source_tests_path = os.environ.get("SOURCE_TESTS_PATH")
    if not source_tests_path:
        raise RuntimeError("SOURCE_TESTS_PATH environment variable is not set")

    return Path(get_repo_root()) / source_tests_path


def _make_case_test(case_dir: Traversable, tests_root: Traversable):
    """Create a test method for a specific test case directory.

    Snapshot update workflow:
      To regenerate snapshots, set UPDATE_SNAPSHOT=1 env
      NOTE: plain ``UPDATE_SNAPSHOT=1 buck2 test ...`` does NOT work
      because Buck2 does not forward shell environment variables to
      test processes.

      When a test case directory has no snapshot.api in the source tree
      the snapshot is generated automatically on the first run.
    """

    def _test(self: unittest.TestCase) -> None:
        update = os.environ.get("UPDATE_SNAPSHOT") == "1"

        # Use as_file() on the entire tests directory to get real filesystem paths
        # This ensures the doxygen config and case directories are accessible
        with ir.as_file(tests_root) as tests_root_path:
            case_dir_path = tests_root_path / case_dir.name
            doxygen_config_path = tests_root_path / ".doxygen.config.template"

            # Find the filter script in the package resources
            pkg_root = ir.files(__package__ if __package__ else "__main__")
            filter_script = pkg_root.parent / "parser" / "input_filters" / "main.py"

            # Get real filesystem path for filter script if it exists
            # IMPORTANT: Keep the context manager active while Doxygen runs,
            # otherwise the extracted file may be cleaned up before use
            if filter_script.is_file():
                with ir.as_file(filter_script) as fs_path:
                    _generate_doxygen_api(
                        str(case_dir_path), str(doxygen_config_path), str(fs_path)
                    )
            else:
                # No filter script available - run without filter
                _generate_doxygen_api(str(case_dir_path), str(doxygen_config_path))

            # Parse the generated XML
            xml_dir = case_dir_path / "api" / "xml"
            snapshot = build_snapshot(str(xml_dir))
            got_snapshot = snapshot.to_string().rstrip() + "\n"

            # Resolve the source-tree snapshot path (for writing)
            try:
                source_snapshots_dir = _get_source_snapshots_dir()
                source_snapshot_path = (
                    source_snapshots_dir / case_dir.name / "snapshot.api"
                )
            except RuntimeError:
                source_snapshot_path = None

            # Update mode: write the snapshot and pass unconditionally
            if update:
                if source_snapshot_path is not None:
                    source_snapshot_path.parent.mkdir(parents=True, exist_ok=True)
                    source_snapshot_path.write_text(got_snapshot)
                    print(f"Updated snapshot: {source_snapshot_path}")
                return

            # Auto-generate when no snapshot exists in the source tree yet
            if source_snapshot_path is not None and not source_snapshot_path.exists():
                source_snapshot_path.write_text(got_snapshot)
                print(f"Created snapshot: {source_snapshot_path}")
                return

            # Normal mode: compare against the packaged snapshot
            expected_snapshot_path = case_dir_path / "snapshot.api"
            if not expected_snapshot_path.exists():
                self.fail(
                    f"{case_dir.name}: no snapshot.api found; "
                    f"run with --test-env UPDATE_SNAPSHOT=1 to generate"
                )

            expected_snapshot = expected_snapshot_path.read_text()
            _assert_text_equal_with_diff(
                self, expected_snapshot, got_snapshot, case=case_dir.name
            )

    return _test


class TestApiSnapshots(unittest.TestCase):
    pass


# Dynamically generate test methods for each case directory
_root = _resource_root()
for _case_dir in _iter_case_dirs(_root):
    _test_name = f"test_{_case_dir.name}"
    setattr(TestApiSnapshots, _test_name, _make_case_test(_case_dir, _root))
