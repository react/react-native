# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require "shellwords"
require_relative "../rndependencies.rb"
require_relative "./test_utils/SpecMock.rb"

class RNDependenciesTests < Test::Unit::TestCase

    # A pod that exports a Swift compatibility header ships this path, and the
    # directory name contains spaces.
    SWIFT_HEADER = "${PODS_CONFIGURATION_BUILD_DIR}/MyPod/Swift Compatibility Header"

    def teardown
        ReactNativeDependenciesUtils.class_variable_set(:@@build_from_source, true)
    end

    # Xcode joins an array setting with spaces, then splits it back on
    # whitespace while honouring quotes. This is what the compiler ends up with.
    def resolved_paths(xcconfig)
        value = xcconfig["HEADER_SEARCH_PATHS"]
        Shellwords.shellsplit(value.is_a?(Array) ? value.join(" ") : value)
    end

    # ================================== #
    # TEST - append_header_search_paths  #
    # ================================== #

    def test_appendHeaderSearchPaths_whenUnset_quotesTheAddedPaths
        xcconfig = {}

        ReactNativeDependenciesUtils.append_header_search_paths(xcconfig, ["$(PODS_ROOT)/glog"])

        assert_equal(["\"$(PODS_ROOT)/glog\""], xcconfig["HEADER_SEARCH_PATHS"])
    end

    def test_appendHeaderSearchPaths_whenStringHasQuotedPathWithSpaces_keepsItIntact
        xcconfig = {"HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/DoubleConversion\" \"#{SWIFT_HEADER}\""}

        ReactNativeDependenciesUtils.append_header_search_paths(xcconfig, ["$(PODS_ROOT)/glog"])

        assert_equal(["$(PODS_ROOT)/DoubleConversion", SWIFT_HEADER, "$(PODS_ROOT)/glog"], resolved_paths(xcconfig))
    end

    def test_appendHeaderSearchPaths_whenArrayHasQuotedPathWithSpaces_keepsItIntact
        xcconfig = {"HEADER_SEARCH_PATHS" => ["\"$(PODS_ROOT)/DoubleConversion\"", "\"#{SWIFT_HEADER}\""]}

        ReactNativeDependenciesUtils.append_header_search_paths(xcconfig, ["$(PODS_ROOT)/glog"])

        assert_equal(["$(PODS_ROOT)/DoubleConversion", SWIFT_HEADER, "$(PODS_ROOT)/glog"], resolved_paths(xcconfig))
    end

    def test_appendHeaderSearchPaths_whenCalledTwice_doesNotDuplicateEntries
        xcconfig = {"HEADER_SEARCH_PATHS" => "\"#{SWIFT_HEADER}\""}

        ReactNativeDependenciesUtils.append_header_search_paths(xcconfig, ["$(PODS_ROOT)/glog"])
        ReactNativeDependenciesUtils.append_header_search_paths(xcconfig, ["$(PODS_ROOT)/glog"])

        assert_equal([SWIFT_HEADER, "$(PODS_ROOT)/glog"], resolved_paths(xcconfig))
    end

    # ======================================= #
    # TEST - add_rn_third_party_dependencies  #
    # ======================================= #

    def test_addRNThirdPartyDependencies_whenBuildingFromSource_keepsQuotedPathWithSpaces
        spec = SpecMock.new
        spec.pod_target_xcconfig = {"HEADER_SEARCH_PATHS" => "\"#{SWIFT_HEADER}\""}

        add_rn_third_party_dependencies(spec)

        paths = resolved_paths(spec.pod_target_xcconfig)
        assert_equal(SWIFT_HEADER, paths.first)
        assert(paths.include?("$(PODS_ROOT)/RCT-Folly"))
    end

    def test_addRNThirdPartyDependencies_whenUsingPrebuiltDeps_keepsQuotedPathWithSpaces
        ReactNativeDependenciesUtils.class_variable_set(:@@build_from_source, false)
        spec = SpecMock.new
        spec.pod_target_xcconfig = {"HEADER_SEARCH_PATHS" => "\"#{SWIFT_HEADER}\""}

        add_rn_third_party_dependencies(spec)

        assert_equal([SWIFT_HEADER, "$(PODS_ROOT)/ReactNativeDependencies/Headers"], resolved_paths(spec.pod_target_xcconfig))
    end
end
