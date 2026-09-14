# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name = 'React-KMP'
  s.version = package['version']
  s.summary = 'Opt-in shared Kotlin algorithms for React Native.'
  s.homepage = 'https://reactnative.dev/'
  s.license = package['license']
  s.author = 'Meta Platforms, Inc. and its affiliates'
  s.source = { :git => 'https://github.com/facebook/react-native.git', :tag => "v#{package['version']}" }
  s.platforms = min_supported_versions
  # The small support target establishes build ordering without trying to link an
  # iOS-only vendored XCFramework when the application is built for Catalyst.
  s.source_files = 'cocoapods/ReactNativeShared.m'
  s.preserve_paths = 'src/**/*', 'gradle/**/*', 'gradlew', '*.kts', '*.properties', 'scripts/**/*'
  s.pod_target_xcconfig = { 'ENABLE_USER_SCRIPT_SANDBOXING' => 'NO' }
  s.user_target_xcconfig = {
    'FRAMEWORK_SEARCH_PATHS[sdk=iphoneos*]' => '$(inherited) "$(PODS_CONFIGURATION_BUILD_DIR)/ReactNativeSharedKMP"',
    'FRAMEWORK_SEARCH_PATHS[sdk=iphonesimulator*]' => '$(inherited) "$(PODS_CONFIGURATION_BUILD_DIR)/ReactNativeSharedKMP"',
  }
  # Link flags are added to direct consumers in react_native_post_install.
  # user_target_xcconfig also reaches tests that inherit only search paths.
  s.script_phase = {
    :name => 'Build shared Kotlin framework',
    :execution_position => :before_compile,
    :always_out_of_date => '1',
    :script => '"${PODS_TARGET_SRCROOT}/scripts/build-apple-framework.sh"',
  }
end
