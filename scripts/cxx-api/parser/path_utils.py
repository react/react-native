# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import subprocess


def get_repo_root() -> str:
    """Get the repository root directory.

    Tries sl (Meta) first, then git (OSS).
    """
    for cmd in [["sl", "root"], ["git", "rev-parse", "--show-toplevel"]]:
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except FileNotFoundError:
            continue
    raise RuntimeError("Could not determine repo root via 'sl root' or 'git rev-parse'")


def get_react_native_dir() -> str:
    """
    Get the path to the react-native package directory.

    This function handles two execution contexts:
    1. Buck execution: Uses REACT_NATIVE_DIR env var + git repo root
    2. Direct Python invocation: Uses __file__ relative path
    """
    react_native_dir = os.environ.get("REACT_NATIVE_DIR")
    if react_native_dir:
        return os.path.join(get_repo_root(), react_native_dir)

    # Use realpath to resolve symlinks — in Buck's link-tree, __file__
    # is a symlink back to the source tree, so this gives the correct
    # source location for relative path resolution.
    script_dir = os.path.dirname(os.path.realpath(__file__))
    return os.path.normpath(
        os.path.join(
            script_dir,  # scripts/cxx-api/parser/
            "..",  # scripts/cxx-api/
            "..",  # scripts/
            "..",  # react-native-github/
        )
    )
