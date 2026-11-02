# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Unit tests for header tier classification and boundary breaks"""

import os
import tempfile
import unittest

from ..parser.tiers import (
    build_header_graph,
    classify_headers,
    collect_headers,
    find_boundary_breaks,
    skipped_headers,
    Tier,
)

PRIVATE = "#include <react/cxxstableapi/PrivateGuard.h>\n"
FRAMEWORKS = "#include <react/cxxstableapi/FrameworksGuard.h>\n"
PUBLIC = "#include <react/cxxstableapi/UmbrellaGuard.h>\n"


class TestTiers(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = os.path.realpath(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def write(self, relative_path: str, content: str = "") -> str:
        path = os.path.join(self.root, relative_path)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(content)
        return path

    def graph(self, exclude_patterns=None):
        return classify_headers([self.root], exclude_patterns or [])

    def break_edges(self):
        return {
            (
                os.path.relpath(b.chain[0], self.root),
                os.path.relpath(b.chain[-1], self.root),
            )
            for b in find_boundary_breaks(self.graph())
        }

    # =========================================================================
    # Classification
    # =========================================================================

    def test_reads_tier_from_guard(self):
        private = self.write("a/Private.h", "#pragma once\n\n" + PRIVATE)
        frameworks = self.write("a/Frameworks.h", "#pragma once\n" + FRAMEWORKS)
        public = self.write("a/Public.h", PUBLIC)
        unguarded = self.write("a/Unguarded.h", "#pragma once\n")

        tiers = self.graph().tiers

        self.assertEqual(tiers[private], Tier.PRIVATE)
        self.assertEqual(tiers[frameworks], Tier.FRAMEWORKS)
        self.assertEqual(tiers[public], Tier.PUBLIC)
        self.assertIsNone(tiers[unguarded])

    def test_reads_guard_below_conditional(self):
        path = self.write("a/A.h", "#ifdef __cplusplus\n" + PRIVATE + "#endif\n")
        self.assertEqual(self.graph().tiers[path], Tier.PRIVATE)

    def test_reads_quoted_guard(self):
        path = self.write("a/A.h", '#include "react/cxxstableapi/PrivateGuard.h"\n')
        self.assertEqual(self.graph().tiers[path], Tier.PRIVATE)

    def test_ignores_commented_out_guard(self):
        path = self.write("a/A.h", "// " + PRIVATE)
        self.assertIsNone(self.graph().tiers[path])

    def test_exclude_patterns_skip_headers(self):
        kept = self.write("a/A.h")
        self.write("a/tests/T.h")
        self.write("a/B.cpp")

        self.assertEqual(collect_headers([self.root], ["*/tests/*"]), [kept])

    # =========================================================================
    # Include resolution
    # =========================================================================

    def test_resolves_angle_include_by_path_suffix(self):
        includer = self.write("x/A.h", "#include <react/foo/B.h>\n")
        target = self.write("ReactCommon/react/foo/B.h")
        self.write("ReactCommon/react/bar/B.h")

        self.assertEqual(self.graph().includes[includer], [target])

    def test_excluded_sibling_does_not_fall_back_to_other_headers(self):
        includer = self.write("platform/a/A.h", '#include "B.h"\n')
        self.write("platform/a/B.h")
        self.write("other/B.h")

        graph = classify_headers([self.root], ["*/platform/a/B.h"])

        self.assertEqual(graph.includes[includer], [])

    def test_resolves_quoted_include_to_sibling_first(self):
        includer = self.write("a/A.h", '#include "B.h"\n')
        sibling = self.write("a/B.h")
        self.write("b/B.h")

        self.assertEqual(self.graph().includes[includer], [sibling])

    def test_resolves_one_copy_per_platform(self):
        includer = self.write("A.h", "#include <react/foo/Platform.h>\n")
        ios = self.write("platform/ios/react/foo/Platform.h")
        android = self.write("platform/android/react/foo/Platform.h")

        self.assertCountEqual(self.graph().includes[includer], [ios, android])

    def test_resolves_every_bare_include_candidate(self):
        includer = self.write("A.h", "#include <primitives.h>\n")
        a = self.write("a/primitives.h")
        b = self.write("b/primitives.h")

        self.assertCountEqual(self.graph().includes[includer], [a, b])

    def test_guard_headers_are_not_in_the_graph(self):
        includer = self.write("a/A.h", PRIVATE + "#include <react/foo/B.h>\n")
        target = self.write("react/foo/B.h")
        guard = self.write("react/cxxstableapi/PrivateGuard.h")

        graph = self.graph()

        self.assertNotIn(guard, graph.tiers)
        self.assertEqual(graph.includes[includer], [target])

    def test_resolves_objc_import(self):
        includer = self.write("A.h", "#import <React/B.h>\n")
        target = self.write("React/B.h")

        self.assertEqual(self.graph().includes[includer], [target])

    # =========================================================================
    # Boundary breaks
    # =========================================================================

    def test_public_including_private_is_a_break(self):
        self.write("Public.h", PUBLIC + '#include "Private.h"\n')
        self.write("Private.h", PRIVATE)

        self.assertEqual(self.break_edges(), {("Public.h", "Private.h")})

    def test_public_including_frameworks_is_a_break(self):
        self.write("Public.h", PUBLIC + '#include "Frameworks.h"\n')
        self.write("Frameworks.h", FRAMEWORKS)

        self.assertEqual(self.break_edges(), {("Public.h", "Frameworks.h")})

    def test_frameworks_including_private_is_a_break(self):
        self.write("Frameworks.h", FRAMEWORKS + '#include "Private.h"\n')
        self.write("Private.h", PRIVATE)

        self.assertEqual(self.break_edges(), {("Frameworks.h", "Private.h")})

    def test_break_through_unclassified_headers_reports_chain(self):
        self.write("Public.h", PUBLIC + '#include "Middle.h"\n')
        self.write("Middle.h", '#include "Private.h"\n')
        self.write("Private.h", PRIVATE)

        breaks = find_boundary_breaks(self.graph())

        self.assertEqual(len(breaks), 1)
        self.assertEqual(
            [os.path.relpath(p, self.root) for p in breaks[0].chain],
            ["Public.h", "Middle.h", "Private.h"],
        )
        self.assertEqual(breaks[0].source_tier, Tier.PUBLIC)
        self.assertEqual(breaks[0].target_tier, Tier.PRIVATE)

    def test_including_more_visible_headers_is_not_a_break(self):
        self.write("Private.h", PRIVATE + '#include "Frameworks.h"\n')
        self.write("Frameworks.h", FRAMEWORKS + '#include "Public.h"\n')
        self.write("Public.h", PUBLIC + '#include "Public2.h"\n')
        self.write("Public2.h", PUBLIC)

        self.assertEqual(self.break_edges(), set())

    def test_unclassified_headers_do_not_start_a_walk(self):
        self.write("Unguarded.h", '#include "Private.h"\n')
        self.write("Private.h", PRIVATE)

        self.assertEqual(self.break_edges(), set())

    def test_walk_stops_at_declared_headers(self):
        self.write("Public.h", PUBLIC + '#include "Frameworks.h"\n')
        self.write("Frameworks.h", FRAMEWORKS + '#include "Private.h"\n')
        self.write("Private.h", PRIVATE)

        self.assertEqual(
            self.break_edges(),
            {("Public.h", "Frameworks.h"), ("Frameworks.h", "Private.h")},
        )

    def test_handles_include_cycles(self):
        self.write("Public.h", PUBLIC + '#include "A.h"\n')
        self.write("A.h", '#include "B.h"\n')
        self.write("B.h", '#include "A.h"\n#include "Private.h"\n')
        self.write("Private.h", PRIVATE)

        self.assertEqual(self.break_edges(), {("Public.h", "Private.h")})

    def test_build_header_graph_ignores_self_include(self):
        path = self.write("A.h", '#include "A.h"\n')
        self.assertEqual(build_header_graph([path]).includes[path], [])

    # =========================================================================
    # Skipped headers
    # =========================================================================

    def skipped(self, *included_tiers):
        args = (frozenset(included_tiers),) if included_tiers else ()
        return {
            os.path.relpath(p, self.root) for p in skipped_headers(self.graph(), *args)
        }

    def test_skips_unreached_private_and_frameworks_headers(self):
        self.write("Public.h", PUBLIC)
        self.write("Frameworks.h", FRAMEWORKS + '#include "Private.h"\n')
        self.write("Private.h", PRIVATE)
        self.write("Unguarded.h", '#include "Private.h"\n')

        self.assertEqual(self.skipped(), {"Frameworks.h", "Private.h"})

    def test_keeps_headers_reached_from_public(self):
        self.write("Public.h", PUBLIC + '#include "Middle.h"\n')
        self.write("Middle.h", '#include "Frameworks.h"\n')
        self.write("Frameworks.h", FRAMEWORKS + '#include "Private.h"\n')
        self.write("Private.h", PRIVATE)
        self.write("Other.h", PRIVATE)

        self.assertEqual(self.skipped(), {"Other.h"})

    def test_never_skips_unclassified_headers(self):
        self.write("Unguarded.h")
        self.assertEqual(self.skipped(), set())

    def test_keeps_included_tiers(self):
        self.write("Public.h", PUBLIC)
        self.write("Frameworks.h", FRAMEWORKS)
        self.write("Private.h", PRIVATE)

        self.assertEqual(self.skipped(Tier.PUBLIC, Tier.FRAMEWORKS), {"Private.h"})
        self.assertEqual(
            self.skipped(Tier.PUBLIC, Tier.FRAMEWORKS, Tier.PRIVATE), set()
        )

    def test_keeps_headers_reached_from_included_tiers(self):
        self.write("Public.h", PUBLIC)
        self.write("Frameworks.h", FRAMEWORKS + '#include "Private.h"\n')
        self.write("Private.h", PRIVATE)
        self.write("Other.h", PRIVATE)

        self.assertEqual(self.skipped(Tier.PUBLIC, Tier.FRAMEWORKS), {"Other.h"})
