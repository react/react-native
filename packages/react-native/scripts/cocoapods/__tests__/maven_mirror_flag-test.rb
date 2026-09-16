# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "test/unit"
require_relative "../utils.rb"
require_relative "../rncore.rb"
require_relative "../rndependencies.rb"
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

    def test_unpublishedVersion_skipsAllArtifactLookups
        assert_false(ReactNativePodsUtils.maven_artifact_version_published?('1000.0.0'))
        assert_false(ReactNativePodsUtils.artifact_exists?('https://repo.reactnative.dev/maven2/example/1000.0.0/example.tar.gz'))
        assert_false(ReactNativePodsUtils.artifact_exists?('https://central.sonatype.com/example/1000.0.0-SNAPSHOT/example.tar.gz'))
        assert_false(ReactNativeCoreUtils.release_artifact_exists('1000.0.0'))
        assert_false(ReactNativeCoreUtils.nightly_artifact_exists('1000.0.0'))
        assert_false(ReactNativeDependenciesUtils.release_artifact_exists('1000.0.0'))
        assert_false(ReactNativeDependenciesUtils.nightly_artifact_exists('1000.0.0'))
        assert_false(release_artifact_exists('1000.0.0'))
        assert_false(hermes_artifact_exists('https://repo.reactnative.dev/maven2/example/1000.0.0/example.tar.gz'))

        assert_equal(
            ReactNativeCoreUtils.stable_tarball_urls('1000.0.0', :debug).first,
            ReactNativeCoreUtils.stable_tarball_url('1000.0.0', :debug),
        )
        assert_equal(
            ReactNativeDependenciesUtils.release_tarball_urls('1000.0.0', :debug).first,
            ReactNativeDependenciesUtils.release_tarball_url('1000.0.0', :debug),
        )
        assert_equal(release_tarball_urls('1000.0.0', :debug).first, release_tarball_url('1000.0.0', :debug))
    end

    def test_releaseVersion_isPublished
        assert_true(ReactNativePodsUtils.maven_artifact_version_published?('0.88.0'))
        assert_true(ReactNativePodsUtils.maven_artifact_version_published?('1000.0.0-abcdef123'))
    end
end
