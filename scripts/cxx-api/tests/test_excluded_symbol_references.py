# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from __future__ import annotations

import unittest

from ..parser.builders import (
    _member_types_reference_excluded_symbol,
    compile_exclude_patterns,
)
from ..parser.main import find_excluded_symbol_references
from ..parser.member import (
    FriendMember,
    FunctionMember,
    PropertyMember,
    TypedefMember,
    VariableMember,
)
from ..parser.scope import Scope, StructLikeScopeKind
from ..parser.scope.extendable import Extendable
from ..parser.snapshot import Snapshot


def _make_snapshot_with_class(
    class_name: str = "facebook::react::Foo",
) -> tuple[Snapshot, Scope]:
    """Create a snapshot with a single struct and return both."""
    snapshot = Snapshot()
    snapshot.create_or_get_namespace("facebook")
    snapshot.create_or_get_namespace("facebook::react")
    scope = snapshot.create_struct_like(class_name, StructLikeScopeKind.Type.STRUCT)
    return snapshot, scope


class TestFindExcludedSymbolReferencesEmpty(unittest.TestCase):
    def test_empty_exclude_symbols_returns_empty(self) -> None:
        snapshot = Snapshot()
        refs = find_excluded_symbol_references(snapshot, compile_exclude_patterns([]))
        self.assertEqual(refs, [])

    def test_no_references_returns_empty(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.add_member(
            FunctionMember(
                name="doStuff",
                type="int",
                visibility="public",
                arg_string="()",
                is_virtual=False,
                is_pure_virtual=False,
                is_static=False,
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental"])
        )
        self.assertEqual(refs, [])


class TestFindExcludedSymbolReferencesBaseClass(unittest.TestCase):
    def test_base_class_reference_detected(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.kind.add_base(
            Extendable.Base(
                name="ExperimentalBase",
                protection="public",
                virtual=False,
                refid="",
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental"])
        )
        self.assertEqual(len(refs), 1)
        self.assertEqual(refs[0].symbol, "ExperimentalBase")
        self.assertEqual(refs[0].pattern, "Experimental")
        self.assertEqual(refs[0].context, "base class")

    def test_base_class_no_match(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.kind.add_base(
            Extendable.Base(
                name="RegularBase",
                protection="public",
                virtual=False,
                refid="",
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental"])
        )
        self.assertEqual(refs, [])


class TestFindExcludedSymbolReferencesFunctionMember(unittest.TestCase):
    def test_return_type_reference_detected(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.add_member(
            FunctionMember(
                name="getModule",
                type="ExperimentalModule",
                visibility="public",
                arg_string="()",
                is_virtual=False,
                is_pure_virtual=False,
                is_static=False,
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental"])
        )
        self.assertEqual(len(refs), 1)
        self.assertEqual(refs[0].symbol, "ExperimentalModule")
        self.assertEqual(refs[0].context, "return type")

    def test_parameter_type_reference_detected(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.add_member(
            FunctionMember(
                name="setModule",
                type="void",
                visibility="public",
                arg_string="(ExperimentalModule module)",
                is_virtual=False,
                is_pure_virtual=False,
                is_static=False,
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental"])
        )
        self.assertEqual(len(refs), 1)
        self.assertEqual(refs[0].context, "function parameter type")

    def test_no_match_in_function(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.add_member(
            FunctionMember(
                name="doExperimentalStuff",
                type="int",
                visibility="public",
                arg_string="(int x)",
                is_virtual=False,
                is_pure_virtual=False,
                is_static=False,
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental"])
        )
        self.assertEqual(refs, [])


class TestFindExcludedSymbolReferencesVariableMember(unittest.TestCase):
    def test_variable_type_reference_detected(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.add_member(
            VariableMember(
                name="module",
                type="ExperimentalModule",
                visibility="public",
                is_const=False,
                is_static=False,
                is_constexpr=False,
                is_mutable=False,
                value=None,
                definition="ExperimentalModule module",
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental"])
        )
        self.assertEqual(len(refs), 1)
        self.assertEqual(refs[0].context, "variable type")


class TestFindExcludedSymbolReferencesTypedefMember(unittest.TestCase):
    def test_typedef_target_type_reference_detected(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.add_member(
            TypedefMember(
                name="ModuleAlias",
                type="ExperimentalModule",
                argstring=None,
                visibility="public",
                keyword="using",
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental"])
        )
        self.assertEqual(len(refs), 1)
        self.assertEqual(refs[0].context, "typedef target type")


class TestFindExcludedSymbolReferencesFriendMember(unittest.TestCase):
    def test_friend_declaration_detected(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.add_member(FriendMember(name="ExperimentalHelper"))
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental"])
        )
        self.assertEqual(len(refs), 1)
        self.assertEqual(refs[0].context, "friend declaration")


class TestFindExcludedSymbolReferencesPropertyMember(unittest.TestCase):
    def test_property_type_reference_detected(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.add_member(
            PropertyMember(
                name="module",
                type="ExperimentalModule *",
                visibility="public",
                is_static=False,
                accessor=None,
                is_readable=True,
                is_writable=True,
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental"])
        )
        self.assertEqual(len(refs), 1)
        self.assertEqual(refs[0].context, "property type")


class TestFindExcludedSymbolReferencesSpecializationArgs(unittest.TestCase):
    def test_scope_specialization_arg_detected(self) -> None:
        snapshot = Snapshot()
        snapshot.create_or_get_namespace("facebook")
        snapshot.create_or_get_namespace("facebook::react")
        scope = snapshot.create_struct_like(
            "facebook::react::Container<ExperimentalType>",
            StructLikeScopeKind.Type.STRUCT,
        )
        scope.add_member(
            FunctionMember(
                name="get",
                type="int",
                visibility="public",
                arg_string="()",
                is_virtual=False,
                is_pure_virtual=False,
                is_static=False,
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental"])
        )
        self.assertEqual(len(refs), 1)
        self.assertEqual(refs[0].context, "specialization argument")


class TestFindExcludedSymbolReferencesMultiplePatterns(unittest.TestCase):
    def test_multiple_patterns_detected(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.add_member(
            FunctionMember(
                name="getModule",
                type="ExperimentalModule",
                visibility="public",
                arg_string="(FantomArg arg)",
                is_virtual=False,
                is_pure_virtual=False,
                is_static=False,
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental", "Fantom"])
        )
        self.assertEqual(len(refs), 2)
        patterns = {r.pattern for r in refs}
        self.assertIn("Experimental", patterns)
        self.assertIn("Fantom", patterns)

    def test_same_text_matches_multiple_patterns(self) -> None:
        snapshot, scope = _make_snapshot_with_class()
        scope.add_member(
            FunctionMember(
                name="get",
                type="ExperimentalFantomModule",
                visibility="public",
                arg_string="()",
                is_virtual=False,
                is_pure_virtual=False,
                is_static=False,
            )
        )
        snapshot.finish()
        refs = find_excluded_symbol_references(
            snapshot, compile_exclude_patterns(["Experimental", "Fantom"])
        )
        self.assertEqual(len(refs), 2)
        self.assertTrue(all(r.symbol == "ExperimentalFantomModule" for r in refs))


class TestMemberTypesReferenceExcludedSymbol(unittest.TestCase):
    def test_function_return_type_detected(self) -> None:
        member = FunctionMember(
            name="get",
            type="ExperimentalFeature",
            visibility="public",
            arg_string="()",
            is_virtual=False,
            is_pure_virtual=False,
            is_static=False,
        )
        self.assertTrue(
            _member_types_reference_excluded_symbol(
                member, compile_exclude_patterns(["Experimental"])
            )
        )

    def test_function_param_type_detected(self) -> None:
        member = FunctionMember(
            name="set",
            type="void",
            visibility="public",
            arg_string="(ExperimentalFeature feature)",
            is_virtual=False,
            is_pure_virtual=False,
            is_static=False,
        )
        self.assertTrue(
            _member_types_reference_excluded_symbol(
                member, compile_exclude_patterns(["Experimental"])
            )
        )

    def test_function_no_match(self) -> None:
        member = FunctionMember(
            name="get",
            type="int",
            visibility="public",
            arg_string="(int x)",
            is_virtual=False,
            is_pure_virtual=False,
            is_static=False,
        )
        self.assertFalse(
            _member_types_reference_excluded_symbol(
                member, compile_exclude_patterns(["Experimental"])
            )
        )

    def test_variable_type_detected(self) -> None:
        member = VariableMember(
            name="feature",
            type="ExperimentalFeatureSet",
            visibility="public",
            is_const=False,
            is_static=False,
            is_constexpr=False,
            is_mutable=False,
            value=None,
            definition="ExperimentalFeatureSet feature",
        )
        self.assertTrue(
            _member_types_reference_excluded_symbol(
                member, compile_exclude_patterns(["Experimental"])
            )
        )

    def test_variable_no_match(self) -> None:
        member = VariableMember(
            name="count",
            type="int",
            visibility="public",
            is_const=False,
            is_static=False,
            is_constexpr=False,
            is_mutable=False,
            value=None,
            definition="int count",
        )
        self.assertFalse(
            _member_types_reference_excluded_symbol(
                member, compile_exclude_patterns(["Experimental"])
            )
        )

    def test_typedef_type_detected(self) -> None:
        member = TypedefMember(
            name="FeatureAlias",
            type="ExperimentalFeature",
            argstring=None,
            visibility="public",
            keyword="using",
        )
        self.assertTrue(
            _member_types_reference_excluded_symbol(
                member, compile_exclude_patterns(["Experimental"])
            )
        )

    def test_property_type_detected(self) -> None:
        member = PropertyMember(
            name="feature",
            type="ExperimentalFeature *",
            visibility="public",
            is_static=False,
            accessor=None,
            is_readable=True,
            is_writable=True,
        )
        self.assertTrue(
            _member_types_reference_excluded_symbol(
                member, compile_exclude_patterns(["Experimental"])
            )
        )

    def test_empty_exclude_symbols_returns_false(self) -> None:
        member = FunctionMember(
            name="get",
            type="ExperimentalFeature",
            visibility="public",
            arg_string="()",
            is_virtual=False,
            is_pure_virtual=False,
            is_static=False,
        )
        self.assertFalse(
            _member_types_reference_excluded_symbol(
                member, compile_exclude_patterns([])
            )
        )
