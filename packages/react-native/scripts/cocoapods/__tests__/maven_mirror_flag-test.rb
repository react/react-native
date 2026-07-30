# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../utils.rb"
require_relative "../../../sdks/hermes-engine/hermes-utils.rb"

class MavenMirrorFlagTests < Test::Unit::TestCase
    def setup
        @original_value = ENV['RCT_REACT_NATIVE_MAVEN_MIRROR_ENABLED']
        ENV.delete('RCT_REACT_NATIVE_MAVEN_MIRROR_ENABLED')
    end

    def teardown
        if @original_value == nil
            ENV.delete('RCT_REACT_NATIVE_MAVEN_MIRROR_ENABLED')
        else
            ENV['RCT_REACT_NATIVE_MAVEN_MIRROR_ENABLED'] = @original_value
        end
    end

    def test_mavenMirror_isEnabledByDefault
        assert_true(ReactNativePodsUtils.react_native_maven_mirror_enabled?)
        assert_true(react_native_maven_mirror_enabled?)
    end

    def test_mavenMirror_isEnabledWhenExplicitlySetToTrue
        ENV['RCT_REACT_NATIVE_MAVEN_MIRROR_ENABLED'] = 'true'

        assert_true(ReactNativePodsUtils.react_native_maven_mirror_enabled?)
        assert_true(react_native_maven_mirror_enabled?)
    end

    def test_mavenMirror_isDisabledWhenExplicitlySetToFalse
        ENV['RCT_REACT_NATIVE_MAVEN_MIRROR_ENABLED'] = 'false'

        assert_false(ReactNativePodsUtils.react_native_maven_mirror_enabled?)
        assert_false(react_native_maven_mirror_enabled?)
    end
end
