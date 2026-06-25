# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Unit tests for parse_config()"""

import unittest

from ..parser.config import parse_config


class TestParseConfig(unittest.TestCase):
    """Test cases for parsing API view configuration."""

    # =========================================================================
    # Basic cases
    # =========================================================================

    def test_empty_config(self):
        """Empty config returns empty list"""
        result = parse_config({}, "/base/dir")
        self.assertEqual(result, [])

    def test_single_view_no_variants(self):
        """Single view without variants"""
        config = {
            "platforms": {
                "ReactCommon": {
                    "codegen": {"generate": False},
                    "inputs": ["packages/react-native/ReactCommon"],
                    "exclude_patterns": ["*/jni/*"],
                    "definitions": {"FOO": 1},
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].snapshot_name, "ReactCommon")
        self.assertEqual(
            result[0].inputs, ["/base/dir/packages/react-native/ReactCommon"]
        )
        self.assertEqual(result[0].exclude_patterns, ["*/jni/*"])
        self.assertEqual(result[0].definitions, {"FOO": 1})

    def test_single_view_with_variants(self):
        """Single view with debug and release variants"""
        config = {
            "platforms": {
                "ReactCommon": {
                    "codegen": {"generate": False},
                    "inputs": ["packages/react-native/ReactCommon"],
                    "exclude_patterns": [],
                    "definitions": {},
                    "variants": {
                        "debug": {"definitions": {"DEBUG": 1}},
                        "release": {"definitions": {"NDEBUG": 1}},
                    },
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 2)

        names = {r.snapshot_name for r in result}
        self.assertIn("ReactCommonDebug", names)
        self.assertIn("ReactCommonRelease", names)

        debug = next(r for r in result if r.snapshot_name == "ReactCommonDebug")
        self.assertEqual(debug.definitions, {"DEBUG": 1})

        release = next(r for r in result if r.snapshot_name == "ReactCommonRelease")
        self.assertEqual(release.definitions, {"NDEBUG": 1})

    # =========================================================================
    # Definition merging
    # =========================================================================

    def test_base_definitions_merged_with_variant(self):
        """Base definitions are merged with variant definitions"""
        config = {
            "platforms": {
                "ReactAndroid": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {"RN_SERIALIZABLE_STATE": 1, "ANDROID": 1},
                    "variants": {
                        "debug": {"definitions": {"DEBUG": 1}},
                        "release": {"definitions": {"NDEBUG": 1}},
                    },
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 2)

        debug = next(r for r in result if r.snapshot_name == "ReactAndroidDebug")
        self.assertEqual(
            debug.definitions,
            {"RN_SERIALIZABLE_STATE": 1, "ANDROID": 1, "DEBUG": 1},
        )

        release = next(r for r in result if r.snapshot_name == "ReactAndroidRelease")
        self.assertEqual(
            release.definitions,
            {"RN_SERIALIZABLE_STATE": 1, "ANDROID": 1, "NDEBUG": 1},
        )

    def test_variant_definitions_override_base(self):
        """Variant definitions override base definitions with same key"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {"MODE": "base", "SHARED": 1},
                    "variants": {
                        "debug": {"definitions": {"MODE": "debug"}},
                    },
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 1)
        self.assertEqual(
            result[0].definitions,
            {"MODE": "debug", "SHARED": 1},
        )

    def test_empty_variant_definitions(self):
        """Variant with empty definitions still inherits base"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {"BASE": 1},
                    "variants": {
                        "debug": {"definitions": {}},
                    },
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].definitions, {"BASE": 1})

    def test_none_variant_definitions(self):
        """Variant with None definitions still inherits base"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {"BASE": 1},
                    "variants": {
                        "debug": {"definitions": None},
                    },
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].definitions, {"BASE": 1})

    # =========================================================================
    # Input path resolution
    # =========================================================================

    def test_relative_paths_resolved(self):
        """Relative paths are joined with base_dir"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": False},
                    "inputs": ["packages/foo", "packages/bar"],
                    "exclude_patterns": [],
                    "definitions": {},
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(
            result[0].inputs,
            ["/base/dir/packages/foo", "/base/dir/packages/bar"],
        )

    def test_absolute_paths_preserved(self):
        """Absolute paths are not modified"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": False},
                    "inputs": ["/absolute/path/foo", "relative/path"],
                    "exclude_patterns": [],
                    "definitions": {},
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(
            result[0].inputs,
            ["/absolute/path/foo", "/base/dir/relative/path"],
        )

    def test_empty_inputs(self):
        """Empty inputs list"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {},
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].inputs, [])

    def test_none_inputs(self):
        """None inputs treated as empty list"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": False},
                    "inputs": None,
                    "exclude_patterns": [],
                    "definitions": {},
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].inputs, [])

    # =========================================================================
    # Codegen path handling
    # =========================================================================

    def test_codegen_platform_set_when_generate_true(self):
        """codegen_platform is set when codegen.generate is true"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": True, "platform": "android"},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {},
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].codegen_platform, "android")

    def test_codegen_platform_ios(self):
        """codegen_platform correctly stores ios platform"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": True, "platform": "ios"},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {},
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].codegen_platform, "ios")

    def test_codegen_platform_propagated_to_variants(self):
        """codegen_platform is propagated to all variant configs"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": True, "platform": "android"},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {},
                    "variants": {
                        "debug": {"definitions": {"DEBUG": 1}},
                        "release": {"definitions": {"NDEBUG": 1}},
                    },
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 2)
        for r in result:
            self.assertEqual(r.codegen_platform, "android")

    def test_codegen_missing_defaults_to_no_codegen(self):
        """Missing codegen config defaults to no codegen"""
        config = {
            "platforms": {
                "TestView": {
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {},
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result[0].inputs), 0)
        self.assertIsNone(result[0].codegen_platform)

    # =========================================================================
    # Multiple views
    # =========================================================================

    def test_multiple_views(self):
        """Multiple views are all parsed"""
        config = {
            "platforms": {
                "ViewA": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {"A": 1},
                },
                "ViewB": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {"B": 1},
                },
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 2)
        names = {r.snapshot_name for r in result}
        self.assertEqual(names, {"ViewA", "ViewB"})

    def test_multiple_views_with_variants(self):
        """Multiple views each with variants"""
        config = {
            "platforms": {
                "ViewA": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {},
                    "variants": {
                        "debug": {"definitions": {"DEBUG": 1}},
                        "release": {"definitions": {"NDEBUG": 1}},
                    },
                },
                "ViewB": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {},
                    "variants": {
                        "debug": {"definitions": {"DEBUG": 1}},
                    },
                },
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 3)
        names = {r.snapshot_name for r in result}
        self.assertEqual(names, {"ViewADebug", "ViewARelease", "ViewBDebug"})

    # =========================================================================
    # Exclude patterns
    # =========================================================================

    def test_exclude_patterns_preserved(self):
        """Exclude patterns are passed through unchanged"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": ["*/jni/*", "*/platform/ios/*"],
                    "definitions": {},
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(
            result[0].exclude_patterns,
            ["*/jni/*", "*/platform/ios/*"],
        )

    def test_none_exclude_patterns(self):
        """None exclude_patterns treated as empty list"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": None,
                    "definitions": {},
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].exclude_patterns, [])

    def test_global_exclude_patterns_prepended(self):
        """Global exclude_patterns are prepended to per-platform patterns"""
        config = {
            "exclude_patterns": ["*/test/*", "*/test_utils/*"],
            "platforms": {
                "TestView": {
                    "inputs": [],
                    "exclude_patterns": ["*/jni/*"],
                    "definitions": {},
                }
            },
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(
            result[0].exclude_patterns,
            ["*/test/*", "*/test_utils/*", "*/jni/*"],
        )

    def test_global_exclude_patterns_deduplicated(self):
        """Duplicate patterns between global and per-platform are deduplicated"""
        config = {
            "exclude_patterns": ["*/test/*", "*/jni/*"],
            "platforms": {
                "TestView": {
                    "inputs": [],
                    "exclude_patterns": ["*/test/*", "*/platform/ios/*"],
                    "definitions": {},
                }
            },
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(
            result[0].exclude_patterns,
            ["*/test/*", "*/jni/*", "*/platform/ios/*"],
        )

    def test_global_exclude_patterns_applied_to_all_platforms(self):
        """Global exclude_patterns apply to every platform"""
        config = {
            "exclude_patterns": ["*/test/*"],
            "platforms": {
                "ViewA": {
                    "inputs": [],
                    "exclude_patterns": ["*/a_only/*"],
                },
                "ViewB": {
                    "inputs": [],
                    "exclude_patterns": ["*/b_only/*"],
                },
            },
        }
        result = parse_config(config, "/base/dir")

        view_a = next(r for r in result if r.snapshot_name == "ViewA")
        self.assertEqual(view_a.exclude_patterns, ["*/test/*", "*/a_only/*"])

        view_b = next(r for r in result if r.snapshot_name == "ViewB")
        self.assertEqual(view_b.exclude_patterns, ["*/test/*", "*/b_only/*"])

    # =========================================================================
    # Exclude symbols
    # =========================================================================

    def test_exclude_symbols_parsed(self):
        """Global exclude_symbols are parsed and propagated"""
        config = {
            "exclude_symbols": ["Fantom", "::detail::"],
            "platforms": {
                "TestView": {
                    "inputs": [],
                    "definitions": {},
                }
            },
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].exclude_symbols, ["Fantom", "::detail::"])

    def test_exclude_symbols_propagated_to_variants(self):
        """Global exclude_symbols are propagated to all variant configs"""
        config = {
            "exclude_symbols": ["Fantom"],
            "platforms": {
                "TestView": {
                    "inputs": [],
                    "definitions": {},
                    "variants": {
                        "debug": {"definitions": {"DEBUG": 1}},
                        "release": {"definitions": {"NDEBUG": 1}},
                    },
                }
            },
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 2)
        for r in result:
            self.assertEqual(r.exclude_symbols, ["Fantom"])

    def test_exclude_symbols_default_empty(self):
        """Missing exclude_symbols defaults to empty list"""
        config = {
            "platforms": {
                "TestView": {
                    "inputs": [],
                    "definitions": {},
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].exclude_symbols, [])

    def test_exclude_symbols_none_treated_as_empty(self):
        """None exclude_symbols treated as empty list"""
        config = {
            "exclude_symbols": None,
            "platforms": {
                "TestView": {
                    "inputs": [],
                    "definitions": {},
                }
            },
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].exclude_symbols, [])

    def test_exclude_symbols_applied_to_all_platforms(self):
        """Global exclude_symbols apply to every platform"""
        config = {
            "exclude_symbols": ["Fantom"],
            "platforms": {
                "ViewA": {
                    "inputs": [],
                },
                "ViewB": {
                    "inputs": [],
                },
            },
        }
        result = parse_config(config, "/base/dir")

        for r in result:
            self.assertEqual(r.exclude_symbols, ["Fantom"])

    def test_per_platform_exclude_symbols(self):
        """Per-platform exclude_symbols are merged with global ones"""
        config = {
            "exclude_symbols": ["Fantom"],
            "platforms": {
                "ReactApple": {
                    "inputs": [],
                    "exclude_symbols": ["Android"],
                },
                "ReactAndroid": {
                    "inputs": [],
                },
            },
        }
        result = parse_config(config, "/base/dir")

        apple = next(r for r in result if r.snapshot_name == "ReactApple")
        self.assertEqual(apple.exclude_symbols, ["Fantom", "Android"])

        android = next(r for r in result if r.snapshot_name == "ReactAndroid")
        self.assertEqual(android.exclude_symbols, ["Fantom"])

    def test_per_platform_exclude_symbols_deduplicated(self):
        """Duplicate symbols between global and per-platform are deduplicated"""
        config = {
            "exclude_symbols": ["Fantom", "Android"],
            "platforms": {
                "TestView": {
                    "inputs": [],
                    "exclude_symbols": ["Fantom", "Detail"],
                },
            },
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].exclude_symbols, ["Fantom", "Android", "Detail"])

    def test_per_platform_exclude_symbols_propagated_to_variants(self):
        """Per-platform exclude_symbols are propagated to all variant configs"""
        config = {
            "exclude_symbols": ["Fantom"],
            "platforms": {
                "ReactApple": {
                    "inputs": [],
                    "exclude_symbols": ["Android"],
                    "variants": {
                        "debug": {"definitions": {"DEBUG": 1}},
                        "release": {"definitions": {"NDEBUG": 1}},
                    },
                },
            },
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 2)
        for r in result:
            self.assertEqual(r.exclude_symbols, ["Fantom", "Android"])

    # =========================================================================
    # Variant naming
    # =========================================================================

    def test_variant_name_capitalized(self):
        """Variant names are capitalized in snapshot name"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": {},
                    "variants": {
                        "debug": {"definitions": {}},
                        "release": {"definitions": {}},
                        "profile": {"definitions": {}},
                    },
                }
            }
        }
        result = parse_config(config, "/base/dir")

        names = {r.snapshot_name for r in result}
        self.assertEqual(names, {"TestViewDebug", "TestViewRelease", "TestViewProfile"})

    # =========================================================================
    # Edge cases
    # =========================================================================

    def test_missing_optional_fields(self):
        """Config with missing optional fields uses defaults"""
        config = {"platforms": {"TestView": {}}}
        result = parse_config(config, "/base/dir")

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].snapshot_name, "TestView")
        self.assertEqual(result[0].inputs, [])
        self.assertEqual(result[0].exclude_patterns, [])
        self.assertEqual(result[0].definitions, {})

    def test_none_definitions(self):
        """None definitions treated as empty dict"""
        config = {
            "platforms": {
                "TestView": {
                    "codegen": {"generate": False},
                    "inputs": [],
                    "exclude_patterns": [],
                    "definitions": None,
                }
            }
        }
        result = parse_config(config, "/base/dir")

        self.assertEqual(result[0].definitions, {})


if __name__ == "__main__":
    unittest.main()
