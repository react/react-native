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
  s.vendored_frameworks    = "React.xcframework"

  s.preserve_paths       = '**/*.*'
  s.header_mappings_dir  = 'React.xcframework/Headers'
  s.source_files         = 'React.xcframework/Headers/**/*.{h,hpp}'

  s.module_name          = 'React'
  s.module_map           = 'React.xcframework/Modules/module.modulemap'
  s.public_header_files  = 'React.xcframework/Headers/**/*.h'

  add_rn_third_party_dependencies(s)

  # We need to make sure that the React.xcframework is copied correctly - in the downloaded tarball
  # the root directory is the framework, but when using it we need to have it in a subdirectory
  # called React.xcframework, so we need to move the contents of the tarball into that directory.
  # This is done in the prepare_command.
  # We need to make sure that the headers are copied to the right place - local tar.gz has a different structure
  # than the one from the maven repo
  s.prepare_command = <<~'CMD'
    CURRENT_PATH=$(pwd)
    XCFRAMEWORK_PATH="${CURRENT_PATH}/React.xcframework"

    # Check if XCFRAMEWORK_PATH is empty
    if [ -z "$XCFRAMEWORK_PATH" ]; then
      echo "ERROR: XCFRAMEWORK_PATH is empty."
      exit 0
    fi

    mkdir -p "${XCFRAMEWORK_PATH}"
    find "$CURRENT_PATH" -mindepth 1 -maxdepth 1 ! -name "$(basename "$XCFRAMEWORK_PATH")" -exec mv {} "$XCFRAMEWORK_PATH" \;
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
