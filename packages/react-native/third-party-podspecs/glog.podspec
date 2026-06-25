# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

glog_config = get_glog_config()
glog_git_url = glog_config[:git]

Pod::Spec.new do |spec|
  spec.name = 'glog'
  spec.version = '0.3.5'
  spec.license = { :type => 'Google', :file => 'COPYING' }
  spec.homepage = 'https://github.com/google/glog'
  spec.summary = 'Google logging module'
  spec.authors = 'Google'

  spec.prepare_command = File.read("../scripts/ios-configure-glog.sh")
  spec.source = { :git => glog_git_url,
                  :tag => "v#{spec.version}" }
  spec.module_name = 'glog'
  spec.header_dir = 'glog'
  spec.source_files = 'src/glog/*.h',
                      'src/demangle.cc',
                      'src/logging.cc',
                      'src/raw_logging.cc',
                      'src/signalhandler.cc',
                      'src/symbolize.cc',
                      'src/utilities.cc',
                      'src/vlog_is_on.cc'
  # workaround for https://github.com/facebook/react-native/issues/14326
  spec.preserve_paths = 'src/*.h',
                        'src/base/*.h'
  spec.exclude_files       = "src/windows/**/*"
  spec.compiler_flags      = '-Wno-shorten-64-to-32'
  spec.resource_bundles = {'glog_privacy' => 'glog/PrivacyInfo.xcprivacy'}
  spec.module_map = 'src/glog/module.modulemap'

  spec.pod_target_xcconfig = {
    "USE_HEADERMAP" => "NO",
    "HEADER_SEARCH_PATHS" => "$(PODS_TARGET_SRCROOT)/src",
    "DEFINES_MODULE" => "YES",
    "GCC_WARN_INHIBIT_ALL_WARNINGS" => "YES" # Disable warnings because we don't control this library
  }

  # Pinning to the same version as React.podspec.
  spec.platforms = min_supported_versions

end
