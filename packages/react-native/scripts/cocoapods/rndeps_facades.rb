# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require 'fileutils'
# Self-contained against require ordering: this module reads
# Helpers::Constants.socket_rocket_config. react_native_pods.rb normally loads
# helpers.rb first, but requiring it here (idempotent) removes that implicit
# dependency. The defined? guard at the use site stays as a backstop.
require_relative './helpers'

# Dependency-only facade podspecs for the third-party deps in prebuilt-deps
# mode (deps-side analogue of RNCoreFacades). Design + rationale:
# scripts/cocoapods/__docs__/prebuilt-deps.md
module RNDepsFacades
    # The name of the umbrella prebuilt-deps pod every facade depends on. Its pod
    # self-serves the third-party headers + carries the binary (see
    # rndependencies.rb, ReactNativeDependencies.podspec).
    DEPS_POD = "ReactNativeDependencies"

    # pod name => podspec path (relative to the react-native package root), or
    # :synthesized for a pod with no local podspec (SocketRocket). Version +
    # subspecs + default_subspecs are DERIVED from the real podspec where one
    # exists; synthesized entries derive their version from a constant.
    FACADE_PODS = {
        "RCT-Folly"        => "third-party-podspecs/RCT-Folly.podspec",
        "glog"             => "third-party-podspecs/glog.podspec",
        "boost"            => "third-party-podspecs/boost.podspec",
        "DoubleConversion" => "third-party-podspecs/DoubleConversion.podspec",
        "fmt"              => "third-party-podspecs/fmt.podspec",
        "fast_float"       => "third-party-podspecs/fast_float.podspec",
        "SocketRocket"     => :synthesized,
    }

    # Sub-directory (relative to the install root) that holds the generated
    # deps facades. Kept separate from RNCoreFacades' `build/rncore-facades` so
    # the two families never collide.
    FACADE_RELDIR = File.join("build", "rndeps-facades")

    # Generates the facade podspecs and returns the base directory holding them.
    # Each facade gets its OWN sub-directory containing a single
    # `<Name>.podspec.json`, so it can be installed as a LOCAL pod via
    # `:path => <dir>` (PathSource uses the spec in place and never downloads
    # `spec.source`). Idempotent; safe to call once per `pod install`.
    #
    # `react_native_path` locates the real third-party podspecs we mirror.
    # version + subspecs + default_subspecs are DERIVED from the real spec (or,
    # for SocketRocket, synthesized from the socket_rocket_config version) so the
    # facade matches the source pod's spec/subspec SHAPE. It is not fully
    # graph-equivalent: every derived subspec depends only on
    # ReactNativeDependencies, so intra-pod subspec deps (e.g. RCT-Folly/Fabric
    # -> RCT-Folly/Default) are not reproduced — harmless here because the deps
    # are all declared explicitly in react_native_pods.rb. NO source_files and
    # NO headers are emitted — the ReactNativeDependencies pod supplies both. A
    # facaded pod whose real podspec can't be read is a hard error (see
    # load_real_spec) — silently shipping an empty facade would hide drift.
    def self.generate(react_native_path, install_root, ios_version)
        abs_base = File.join(install_root.to_s, FACADE_RELDIR)
        FileUtils.mkdir_p(abs_base)
        FACADE_PODS.each do |name, podspec_rel_path|
            dir = File.join(abs_base, name)
            FileUtils.mkdir_p(dir)

            if podspec_rel_path == :synthesized
                spec = synthesized_spec(name, ios_version)
            else
                podspec_path = File.join(react_native_path.to_s, podspec_rel_path)
                real = load_real_spec(podspec_path, name)
                spec = derived_spec(name, real, ios_version)
            end

            File.write(File.join(dir, "#{name}.podspec.json"), JSON.pretty_generate(spec))
        end
        abs_base
    end

    # Facade dir for `<name>`, RELATIVE to the install root — pass to `pod :path =>`.
    # Relative (not absolute) so the path CocoaPods records in Podfile.lock is
    # portable rather than machine-specific.
    def self.facade_path(name)
        File.join(FACADE_RELDIR, name)
    end

    # Base spec skeleton shared by derived + synthesized facades: dependency-only,
    # no source_files, no headers. Depends solely on ReactNativeDependencies.
    def self.base_spec(name, version, ios_version)
        {
            "name" => name,
            "version" => version,
            "summary" => "Prebuilt facade for #{name} (code + headers live in #{DEPS_POD}).",
            "homepage" => "https://reactnative.dev/",
            "license" => "MIT",
            "authors" => "Meta Platforms, Inc. and its affiliates",
            "platforms" => { "ios" => ios_version },
            # Required podspec attribute, but never fetched: installed as a LOCAL
            # pod (`:path => <dir>`), which uses this spec in place and ships no
            # source_files. Placeholder only.
            "source" => { "git" => "https://github.com/facebook/react-native.git" },
            "dependencies" => { DEPS_POD => [] },
        }
    end
    private_class_method :base_spec

    # Facade derived from a real third-party podspec: version + subspecs +
    # default_subspecs mirror the real spec so a bare `pod '<Name>'` and any
    # `pod '<Name>/<Subspec>'` resolve to the SAME graph (e.g. RCT-Folly's
    # bare + /Default + /Fabric). Each subspec is also dependency-only and
    # depends on ReactNativeDependencies.
    #
    # NOTE: resources (e.g. RCT-Folly's PrivacyInfo.xcprivacy) are intentionally
    # NOT carried. In prebuilt-deps mode the third-party code — and its privacy
    # manifest — is embedded in the ReactNativeDependencies artifact; the facade
    # only needs to declare the dependency (see the design note in the PR).
    def self.derived_spec(name, real, ios_version)
        spec = base_spec(name, real.version.to_s, ios_version)

        defaults = Array(real.default_subspecs)
        spec["default_subspecs"] = defaults unless defaults.empty?

        subspecs = derive_subspecs(real)
        unless subspecs.empty?
            spec["subspecs"] = subspecs.map do |ss|
                { "name" => ss, "dependencies" => { DEPS_POD => [] } }
            end
        end

        spec
    end
    private_class_method :derived_spec

    # Facade synthesized for a pod with NO local podspec (SocketRocket, a trunk
    # pod). Version comes from Helpers::Constants::socket_rocket_config; no
    # subspecs. A missing/blank constant is a hard error rather than a silent
    # versionless facade — a bare `pod 'SocketRocket'` in the source path is
    # `"~> #{socket_rocket_config[:version]}"`, so the facade MUST carry a version
    # that satisfies that constraint.
    def self.synthesized_spec(name, ios_version)
        version = synthesized_version(name)
        base_spec(name, version, ios_version)
    end
    private_class_method :synthesized_spec

    # Resolves the synthesized version for a no-podspec facade. Fail-closed on a
    # missing constant/version. Only SocketRocket is synthesized today.
    def self.synthesized_version(name)
        case name
        when "SocketRocket"
            unless defined?(Helpers::Constants) && Helpers::Constants.respond_to?(:socket_rocket_config)
                raise "[RNDepsFacades] Cannot synthesize facade for '#{name}': " \
                      "Helpers::Constants.socket_rocket_config is unavailable."
            end
            version = Helpers::Constants.socket_rocket_config[:version]
            if version.nil? || version.to_s.strip.empty?
                raise "[RNDepsFacades] Cannot synthesize facade for '#{name}': " \
                      "socket_rocket_config[:version] is missing or empty."
            end
            version.to_s
        else
            raise "[RNDepsFacades] No synthesized version rule for facaded pod '#{name}'. " \
                  "Add one to synthesized_version or give it a real podspec in FACADE_PODS."
        end
    end
    private_class_method :synthesized_version

    # Loads the real podspec so we can mirror its structure. A facaded pod with a
    # declared podspec path MUST have a readable real podspec — if it's missing or
    # unparseable we raise rather than ship an empty facade (which would silently
    # drop subspecs / the version, the very drift this mechanism prevents).
    def self.load_real_spec(path, name)
        unless File.exist?(path)
            raise "[RNDepsFacades] Real podspec for facaded pod '#{name}' not found at #{path}. " \
                  "Update FACADE_PODS in rndeps_facades.rb if the podspec moved."
        end
        begin
            Pod::Specification.from_file(path)
        rescue => e
            raise "[RNDepsFacades] Failed to read real podspec for facaded pod '#{name}' at #{path}: #{e.message}"
        end
    end
    private_class_method :load_real_spec

    # Library (non-test, non-app) subspec names of the real spec, so third-party
    # libs depending on `<pod>/<subspec>` (e.g. `RCT-Folly/Fabric`) keep
    # resolving. Derived, never hand-listed.
    def self.derive_subspecs(real)
        real.subspecs
            .reject { |ss| ss.test_specification? || (ss.respond_to?(:app_specification?) && ss.app_specification?) }
            .map(&:base_name)
    end
    private_class_method :derive_subspecs
end
