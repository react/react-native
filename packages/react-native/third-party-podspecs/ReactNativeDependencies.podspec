# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

begin
  react_native_path = File.dirname(Pod::Executable.execute_command('node', ['-p',
    'require.resolve(
    "react-native",
    {paths: [process.argv[1]]},
    )', __dir__]).strip
  )
rescue => e
  # Fallback to the parent directory if the above command fails (e.g when building locally in OOT Platform)
  react_native_path = File.join(__dir__, "..", "..")
end

# package.json
package = JSON.parse(File.read(File.join(react_native_path, "package.json")))
version = package['version']

source = ReactNativeDependenciesUtils.resolve_podspec_source()

Pod::Spec.new do |spec|
  spec.name                 = 'ReactNativeDependencies'
  spec.version              = version
  spec.summary              = 'React Native Dependencies'
  spec.description          = 'ReactNativeDependencies is a podspec that contains all the third-party dependencies of React Native.'
  spec.homepage             = 'https://github.com/facebook/react-native'
  spec.license              = package['license']
  spec.authors              = 'meta'
  spec.platforms            = min_supported_versions
  spec.user_target_xcconfig = {
    'WARNING_CFLAGS' => '-Wno-comma -Wno-shorten-64-to-32',
  }

  spec.source               = source
  spec.preserve_paths       = '**/*.*'
  spec.vendored_frameworks  = 'framework/packages/react-native/ReactNativeDependencies.xcframework'
  spec.header_mappings_dir  = 'Headers'
  spec.source_files         = 'Headers/**/*.{h,hpp}'

  # We need to make sure that the headers are copied to the right place - local tar.gz has a different structure
  # than the one from the maven repo
  spec.prepare_command    = <<-CMD
    CURRENT_PATH=$(pwd)
    mkdir -p Headers
    XCFRAMEWORK_PATH=$(find "$CURRENT_PATH" -type d -name "ReactNativeDependencies.xcframework")
    HEADERS_PATH=$(find "$XCFRAMEWORK_PATH" -type d -name "Headers" | head -n 1)

    # Check if XCFRAMEWORK_PATH is empty
    if [ -z "$XCFRAMEWORK_PATH" ]; then
      echo "ERROR: XCFRAMEWORK_PATH is empty."
      exit 1
    fi

    # Check if HEADERS_PATH is empty
    if [ -z "$HEADERS_PATH" ]; then
      echo "ERROR: HEADERS_PATH is empty."
      exit 1
    fi

    cp -R "$HEADERS_PATH/." Headers
    mkdir -p framework/packages/react-native
    cp -R "$XCFRAMEWORK_PATH/../." framework/packages/react-native/
    find "$XCFRAMEWORK_PATH/.." -type f -exec rm {} +
    find "$CURRENT_PATH" -type d -empty -delete
  CMD

  # If we are passing a local tarball, we don't want to switch between Debug and Release
  if !ENV["RCT_USE_LOCAL_RN_DEP"]
    script_phase = {
      :name => "[RNDeps] Replace React Native Dependencies for the right configuration, if needed",
      :execution_position => :before_compile,
      :script => <<-EOS
      . "$REACT_NATIVE_PATH/scripts/xcode/with-environment.sh"

      CONFIG="Release"
      if echo $GCC_PREPROCESSOR_DEFINITIONS | grep -q "DEBUG=1"; then
        CONFIG="Debug"
      fi

      "$NODE_BINARY" "$REACT_NATIVE_PATH/third-party-podspecs/replace_dependencies_version.js" -c "$CONFIG" -r "#{version}" -p "$PODS_ROOT"
      EOS
    }


    # :always_out_of_date is only available in CocoaPods 1.13.0 and later
    if Gem::Version.new(Pod::VERSION) >= Gem::Version.new('1.13.0')
      # always run the script without warning
      script_phase[:always_out_of_date] = "1"
    end

    spec.script_phase = script_phase
  end

end
