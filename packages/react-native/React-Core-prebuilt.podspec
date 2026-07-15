# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))
version = package['version']

source = ReactNativeCoreUtils.resolve_podspec_source()
Pod::Spec.new do |s|
  s.name                   = "React-Core-prebuilt"
  s.version                = version
  s.summary                = "The core of React Native prebuilt frameworks."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.source                 = source

  # We vend two xcframeworks that ship together in the prebuilt tarball:
  #  - React.xcframework: the compiled core. Its per-slice React.framework carries
  #    every <React/...> header + the framework module map, so `#import <React/...>`
  #    and `@import React;` resolve through FRAMEWORK_SEARCH_PATHS automatically.
  #  - ReactNativeHeaders.xcframework: headers-only, PURE-RN. Carries every other
  #    RN namespace (<react/...>, <yoga/...>, ...). Its headers are flattened into
  #    a top-level Headers/ (see prepare_command) and exposed via the standard pod
  #    header search path. The third-party deps namespaces (folly/glog/boost/...)
  #    are NOT here — the ReactNativeDependencies pod serves them from its own
  #    artifact (see scripts/cocoapods/__docs__/prebuilt-deps.md), wired through
  #    add_rn_third_party_dependencies below. (<hermes/...> is supplied by the
  #    hermes-engine pod here; it is folded into ReactNativeHeaders only on the
  #    SwiftPM consumer side.)
  # There is no clang VFS overlay.
  s.vendored_frameworks    = "React.xcframework"

  s.preserve_paths       = '**/*.*'
  s.header_mappings_dir  = 'Headers'
  s.source_files         = 'Headers/**/*.{h,hpp}'
  s.public_header_files  = 'Headers/**/*.h'

  add_rn_third_party_dependencies(s)

  # The downloaded tarball ships React.xcframework and ReactNativeHeaders.xcframework
  # at its root. We make sure React.xcframework is in its own subdirectory (the Maven
  # tarball lays the framework contents at the root; the local tar.gz has a different
  # structure) and flatten ReactNativeHeaders' headers into a top-level Headers/ dir
  # so CocoaPods exposes them on the header search path.
  s.prepare_command = <<~'CMD'
    CURRENT_PATH=$(pwd)
    XCFRAMEWORK_PATH="${CURRENT_PATH}/React.xcframework"

    # Flatten ReactNativeHeaders' headers (identical across slices) into Headers/
    # BEFORE we sweep stray root entries into React.xcframework. Fail closed:
    # a tarball without ReactNativeHeaders.xcframework (an artifact published
    # before the headers-spec layout, or a truncated download) would otherwise
    # yield a green install with an empty Headers/ and every <react/...> or
    # <yoga/...> include failing much later, far from the cause.
    mkdir -p Headers
    RNH_XCFRAMEWORK_PATH=$(find "$CURRENT_PATH" -type d -name "ReactNativeHeaders.xcframework" | head -n 1)
    if [ -z "$RNH_XCFRAMEWORK_PATH" ]; then
      echo "[React-Core-prebuilt] ERROR: ReactNativeHeaders.xcframework not found in the prebuilt tarball." >&2
      echo "The artifact predates the headers-spec layout or is incomplete; use a matching react-native version." >&2
      exit 1
    fi
    RNH_HEADERS_PATH=$(find "$RNH_XCFRAMEWORK_PATH" -type d -name "Headers" | head -n 1)
    if [ -z "$RNH_HEADERS_PATH" ]; then
      echo "[React-Core-prebuilt] ERROR: no Headers directory inside $RNH_XCFRAMEWORK_PATH." >&2
      exit 1
    fi
    cp -R "$RNH_HEADERS_PATH/." Headers
    rm -rf "$RNH_XCFRAMEWORK_PATH"

    mkdir -p "${XCFRAMEWORK_PATH}"
    find "$CURRENT_PATH" -mindepth 1 -maxdepth 1 \
      ! -name "$(basename "$XCFRAMEWORK_PATH")" ! -name "Headers" \
      -exec mv {} "$XCFRAMEWORK_PATH" \;
  CMD

  # If we are passing a local tarball, we don't want to switch between Debug and Release
  if !ENV["RCT_TESTONLY_RNCORE_TARBALL_PATH"]
    script_phase = {
      :name => "[RNCore] Replace React Native Core for the right configuration, if needed",
      :execution_position => :before_compile,
      :script => <<-EOS
      . "$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"

      CONFIG="Release"
      if echo $GCC_PREPROCESSOR_DEFINITIONS | grep -q "DEBUG=1"; then
        CONFIG="Debug"
      fi

      "$NODE_BINARY" "$REACT_NATIVE_PATH/scripts/replace-rncore-version.js" -c "$CONFIG" -r "#{version}" -p "$PODS_ROOT"
      EOS
    }


    # :always_out_of_date is only available in CocoaPods 1.13.0 and later
    if Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.13.0')
      # always run the script without warning
      script_phase[:always_out_of_date] = "1"
    end

    s.script_phase = script_phase
  end
end
