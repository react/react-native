# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'
require 'fileutils'

# Facade podspecs for the prebuilt React Native Core path.
#
# In prebuilt mode the compiled code AND headers for the React core pods live
# entirely inside React.xcframework + React-Core-prebuilt (which flattens the
# ReactNativeHeaders namespaces into its Headers/). Re-installing the SOURCE
# podspecs in that mode is what makes them ship duplicate headers that shadow the
# prebuilt artifact (via HEADER_SEARCH_PATHS, CocoaPods .hmap header maps, and
# the all-product-headers VFS overlay) and break the React framework's clang
# explicit-module precompile.
#
# Instead we install dependency-only FACADE podspecs for those names: they ship
# no source files and (with one narrow exception, see FACADE_REEXPOSED_HEADERS)
# no headers, so CocoaPods makes them PBXAggregateTarget
# placeholders (should_build? == false) and nothing is laid down to shadow. Each
# facade depends on React-Core-prebuilt so its consumers transitively pick up the
# prebuilt framework + headers. The pod NAMES still resolve, so ReactCodegen,
# third-party modules, and RN's own podspec graph keep resolving `React-Core`,
# `Yoga`, `React-Core/Default`, etc.
#
# MAINTENANCE MODEL: the set of facaded pods is explicit (FACADE_PODS) so the
# prebuilt rollout can be staged, but each facade's VERSION and SUBSPECS are
# DERIVED from the real podspec at `pod install` time (Pod::Specification.from_file).
# That removes the drift risk that would otherwise bite third-party libraries:
# if React adds/renames `React-Core/<Subspec>`, the facade exposes it
# automatically — nobody has to hand-maintain a parallel subspec list.
#
# This is staged: phase 1 facades a small set and KEEPS the existing
# podspec_sources / add_rncore_dependency / configure_aggregate_xcconfig /
# -fmodule-map-file machinery. The set is expanded until the cold prebuilt
# build passes; the distributed prebuilt helpers are only deleted afterwards.
module RNCoreFacades
    # pod name => podspec path (relative to the react-native package root).
    # These are the React-core pods whose code + headers are fully provided by
    # the prebuilt React.xcframework / React-Core-prebuilt. Start small; expand as
    # the cold build surfaces more shadowing pods. (NOTE: not every caller of
    # add_rncore_dependency belongs here — e.g. ReactCodegen depends on the
    # prebuilt but still builds its own generated sources, so it is NOT a facade.)
    FACADE_PODS = {
        "React-Core"       => "React-Core.podspec",
        "React-RCTFabric"  => "React/React-RCTFabric.podspec",
        "React-RCTRuntime" => "React/Runtime/React-RCTRuntime.podspec",
        "Yoga"             => "ReactCommon/yoga/Yoga.podspec",
        "RCTDeprecation"   => "ReactApple/Libraries/RCTFoundation/RCTDeprecation/RCTDeprecation.podspec",
        "FBLazyVector"     => "Libraries/FBLazyVector/FBLazyVector.podspec",
        "RCTRequired"      => "Libraries/Required/RCTRequired.podspec",
    }

    # A facade ships NO headers by default — the prebuilt React.framework /
    # React-Core-prebuilt own them. NARROW EXCEPTION: a few headers live ONLY
    # inside React.framework/Headers (served angle-only as <React/...>, e.g.
    # because they reach unguarded C++ and are excluded from the framework module
    # map) and are NOT in the flattened React-Core-prebuilt/Headers. A quoted
    # `#import "<name>.h"` therefore has no resolution target in prebuilt mode.
    #
    # Community Fabric modules quote-import RCTFabricComponentsPlugins.h (47x in a
    # full app: slider, maps, pager-view, keyboard-controller, ...). In source it
    # was vended by React-RCTFabric at header_dir "React", which put it in
    # dependents' CocoaPods header maps so the bare quoted name resolved. The
    # facade dropped it. We re-vend JUST that header here so dependents' header
    # maps carry it again, exactly as the source pod did.
    #
    # Re-exposing a SINGLE header (not the whole React/ namespace) does not put
    # <react/...>/<yoga/...> on -I, so it does NOT reintroduce the
    # -Wnon-modular-include-in-framework-module shadowing the modular prebuilt
    # layout exists to eliminate. The header is core-only (matches source: it
    # only ever declared RN's built-in components; third-party Fabric components
    # register via the codegen RCTThirdPartyComponentsProvider, shipped by the
    # non-facaded ReactCodegen pod).
    #
    # pod name => { "header_dir" => <dir>, "globs" => [<glob rel. to its podspec dir>] }
    FACADE_REEXPOSED_HEADERS = {
        "React-RCTFabric" => {
            "header_dir" => "React",
            "globs" => ["Fabric/Mounting/ComponentViews/RCTFabricComponentsPlugins.h"],
        },
    }

    # Sub-directory (relative to the install root) that holds the generated facades.
    FACADE_RELDIR = File.join("build", "rncore-facades")

    @@install_root = nil

    # True when `name` should be installed as a facade instead of its source podspec.
    def self.facade?(name)
        FACADE_PODS.key?(name)
    end

    # Generates the facade podspecs and returns the base directory holding them.
    # Each facade gets its OWN sub-directory containing a single
    # `<Name>.podspec.json`, so it can be installed as a LOCAL pod via
    # `:path => <dir>`. `:path` (PathSource) uses the spec in place and never
    # downloads `spec.source` — unlike `:podspec` (PodspecSource), which is an
    # *external* source whose `root_spec.source` CocoaPods would actually fetch
    # (i.e. git-clone react-native for every empty facade). Idempotent; safe to
    # call once per `pod install`.
    #
    # `react_native_path` locates the real podspecs we mirror. version + subspecs +
    # default_subspecs are DERIVED from the real spec so the facade stays
    # graph-equivalent to the source pod (resources are NOT carried — they live in
    # the prebuilt artifact; see the note in the loop). A facaded pod whose real
    # podspec can't be read is a hard error (see load_real_spec) — silently shipping
    # an empty facade would hide exactly the drift this guards against.
    def self.generate(react_native_path, install_root, version, ios_version)
        @@install_root = install_root.to_s
        abs_base = File.join(@@install_root, FACADE_RELDIR)
        FileUtils.mkdir_p(abs_base)
        FACADE_PODS.each do |name, podspec_rel_path|
            podspec_path = File.join(react_native_path.to_s, podspec_rel_path)
            podspec_dir = File.dirname(podspec_path)
            real = load_real_spec(podspec_path, name)
            dir = File.join(abs_base, name)
            FileUtils.mkdir_p(dir)

            spec = {
                "name" => name,
                "version" => real.version.to_s,
                "summary" => "Prebuilt facade for #{name} (code + headers live in React-Core-prebuilt).",
                "homepage" => "https://reactnative.dev/",
                "license" => "MIT",
                "authors" => "Meta Platforms, Inc. and its affiliates",
                "platforms" => { "ios" => ios_version },
                # Required podspec attribute, but never fetched: the pod is installed
                # as a LOCAL pod (`:path => <dir>`), which uses this spec in place and
                # ships no source_files. Placeholder only.
                "source" => { "git" => "https://github.com/facebook/react-native.git" },
                "dependencies" => { "React-Core-prebuilt" => [] },
            }

            # NOTE: the facade carries NO resources. The pods' non-code resources
            # (e.g. the privacy manifest) are embedded directly in the prebuilt
            # React.xcframework by the ios-prebuild compose (see ios-prebuild/framework-resources.js),
            # so they reach both CocoaPods-prebuilt and SwiftPM from the artifact —
            # the facade only needs to declare the React-Core-prebuilt dependency.

            # Re-vend the narrow set of angle-only framework headers that community
            # modules quote-import (see FACADE_REEXPOSED_HEADERS). The header is
            # COPIED into the facade dir (a self-contained snapshot — robust, no
            # `..` globs reaching out of the pod) and exposed as a public header.
            # It's header-only (a `.h` has nothing to compile, so the facade stays
            # a placeholder), but CocoaPods lays it into
            # Pods/Headers/Public/<Name>/<header_dir>/ and dependents' .hmap,
            # restoring quoted resolution exactly as the source pod did.
            reexposed = FACADE_REEXPOSED_HEADERS[name]
            if reexposed
                copied = copy_reexposed_headers(reexposed["globs"], podspec_dir, dir, name)
                unless copied.empty?
                    spec["source_files"] = copied
                    spec["public_header_files"] = copied
                    spec["header_dir"] = reexposed["header_dir"] if reexposed["header_dir"]
                end
            end

            # Preserve default_subspec so a bare `pod '<Name>'` resolves to the SAME
            # subspec graph as the source pod (without it CocoaPods pulls every
            # subspec, which is not graph-equivalent).
            defaults = Array(real.default_subspecs)
            spec["default_subspecs"] = defaults unless defaults.empty?

            subspecs = derive_subspecs(real)
            unless subspecs.empty?
                spec["subspecs"] = subspecs.map do |ss|
                    { "name" => ss, "dependencies" => { "React-Core-prebuilt" => [] } }
                end
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

    # Loads the real podspec so we can mirror its structure. A facaded pod MUST have
    # a readable real podspec — if it's missing or unparseable we raise rather than
    # ship an empty facade, since that would silently drop subspecs (the very drift
    # this mechanism exists to prevent).
    def self.load_real_spec(path, name)
        unless File.exist?(path)
            raise "[RNCoreFacades] Real podspec for facaded pod '#{name}' not found at #{path}. " \
                  "Update FACADE_PODS in rncore_facades.rb if the podspec moved."
        end
        Pod::Specification.from_file(path)
    rescue => e
        raise "[RNCoreFacades] Failed to read real podspec for facaded pod '#{name}' at #{path}: #{e.message}"
    end
    private_class_method :load_real_spec

    # Library (non-test, non-app) subspec names of the real spec, so third-party
    # libs depending on `<pod>/<subspec>` keep resolving. Derived, never hand-listed.
    def self.derive_subspecs(real)
        real.subspecs
            .reject { |ss| ss.test_specification? || (ss.respond_to?(:app_specification?) && ss.app_specification?) }
            .map(&:base_name)
    end
    private_class_method :derive_subspecs

    # Copy the re-exposed header(s) into the facade dir (flat) and return the
    # facade-relative source_files entries. `globs` are resolved against the real
    # podspec dir. A glob that matches nothing is a hard error: the whole point is
    # to keep a quoted-import header resolvable, so silently shipping a facade
    # without it would reintroduce the exact "file not found" we're fixing.
    def self.copy_reexposed_headers(globs, podspec_dir, facade_dir, name)
        copied = []
        Array(globs).each do |g|
            matches = Dir.glob(File.expand_path(g, podspec_dir))
            if matches.empty?
                raise "[RNCoreFacades] Re-exposed header glob '#{g}' for facade '#{name}' " \
                      "matched no files under #{podspec_dir}. Update FACADE_REEXPOSED_HEADERS."
            end
            matches.each do |src|
                base = File.basename(src)
                FileUtils.cp(src, File.join(facade_dir, base))
                copied << base
            end
        end
        copied.uniq
    end
    private_class_method :copy_reexposed_headers
end
