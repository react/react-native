# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Tests for leaving entities declared in skipped headers out of a snapshot"""

import importlib.resources as ir
import os
import subprocess
import tempfile
import unittest

from ..parser import build_snapshot
from ..parser.main import make_location_filter

PUBLIC_HEADER = """
namespace ns {
class PublicClass {};
void publicFunction();
enum class PublicEnum { A };
using PublicAlias = int;
extern int publicVariable;
} // namespace ns
"""

PRIVATE_HEADER = """
namespace ns {
class PrivateClass {
 public:
  class Nested {};
};
void privateFunction();
enum class PrivateEnum { B };
using PrivateAlias = int;
extern int privateVariable;
} // namespace ns

namespace ns::detail {
void detailFunction();
} // namespace ns::detail
"""


class TestTierFiltering(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = os.path.realpath(self._tmp.name)
        for name, content in (
            ("Public.h", PUBLIC_HEADER),
            ("Private.h", PRIVATE_HEADER),
        ):
            with open(os.path.join(self.root, name), "w") as f:
                f.write(content)

        config = ir.files(__package__) / "snapshots" / ".doxygen.config.template"
        # The config reads INPUT_FILTER from this variable, and Doxygen parses
        # nothing when it expands to an empty filter.
        env = {**os.environ, "DOXYGEN_INPUT_FILTER": "cat"}
        with ir.as_file(config) as config_path:
            result = subprocess.run(
                [env.get("DOXYGEN_BIN", "doxygen"), str(config_path)],
                cwd=self.root,
                capture_output=True,
                text=True,
                env=env,
            )
        if result.returncode != 0:
            raise RuntimeError(f"Doxygen failed: {result.stderr}")
        self.xml_dir = os.path.join(self.root, "api", "xml")

    def tearDown(self):
        self._tmp.cleanup()

    def test_leaves_out_entities_declared_in_skipped_headers(self):
        location_filter = make_location_filter(
            {os.path.join(self.root, "Private.h")}, self.root
        )
        snapshot = build_snapshot(
            self.xml_dir, location_filter=location_filter
        ).to_string()

        for name in (
            "PublicClass",
            "publicFunction",
            "PublicEnum",
            "PublicAlias",
            "publicVariable",
        ):
            self.assertIn(name, snapshot)
        for name in (
            "PrivateClass",
            "Nested",
            "privateFunction",
            "PrivateEnum",
            "PrivateAlias",
            "privateVariable",
            "detail",
        ):
            self.assertNotIn(name, snapshot)

    def test_keeps_everything_without_skipped_headers(self):
        snapshot = build_snapshot(self.xml_dir).to_string()

        for name in ("PublicClass", "PrivateClass", "privateFunction", "detail"):
            self.assertIn(name, snapshot)
