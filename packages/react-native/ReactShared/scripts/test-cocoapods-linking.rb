# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require 'cocoapods'
require 'fileutils'
require 'json'
require 'open3'
require 'tmpdir'

shared_root = File.expand_path('..', __dir__)
helper = File.expand_path('../scripts/cocoapods/kmp.rb', shared_root)
output_root = ENV['RCT_KMP_LINKING_TEST_OUTPUT_DIR'] || Dir.mktmpdir('react-native-kmp-linking-')
FileUtils.mkdir_p(output_root)
results = []

# These local pods exercise CocoaPods' real dependency and target-inheritance
# handling without downloading dependencies or compiling a Kotlin framework.
[nil, 'static', 'dynamic', 'mixed'].each do |linkage|
  name = linkage || 'static-library'
  fixture = File.join(output_root, name)
  FileUtils.mkdir_p(fixture)
  project = Xcodeproj::Project.new(File.join(fixture, 'Fixture.xcodeproj'))
  host = project.new_target(:application, 'Host', :ios, '15.1')
  hosted = project.new_target(:unit_test_bundle, 'HostedTests', :ios, '15.1')
  sibling = project.new_target(:unit_test_bundle, 'SiblingHostedTests', :ios, '15.1')
  without_metadata = project.new_target(:unit_test_bundle, 'SiblingWithoutMetadata', :ios, '15.1')
  standalone = project.new_target(:unit_test_bundle, 'StandaloneTests', :ios, '15.1')
  plain_host = project.new_target(:application, 'PlainHost', :ios, '15.1')
  separate = project.new_target(:unit_test_bundle, 'TestsWithNonKMPHost', :ios, '15.1')
  stale = project.new_target(:unit_test_bundle, 'StaleHostMetadataTests', :ios, '15.1')
  mismatched = project.new_target(:unit_test_bundle, 'MismatchedLoaderTests', :ios, '15.1')
  sdk_hosted = project.new_target(:unit_test_bundle, 'SDKHostedTests', :ios, '15.1')
  unresolved = project.new_target(:unit_test_bundle, 'UnresolvedHostTests', :ios, '15.1')
  renamed = project.new_target(:application, 'OriginalName', :ios, '15.1')
  renamed.name = 'Renamed Host'
  renamed_test = project.new_target(:unit_test_bundle, 'RenamedHostTests', :ios, '15.1')

  # Neither a mere app dependency nor an unrelated KMP app is the test's host.
  [standalone, separate, stale].each { |test| test.add_dependency(host) }
  sdk_hosted.add_dependency(plain_host)
  unresolved.add_dependency(plain_host)
  [[hosted, host], [sibling, host], [without_metadata, host], [separate, plain_host],
   [stale, plain_host], [mismatched, host], [renamed_test, renamed], [sdk_hosted, host],
   [unresolved, host]].each do |test, app|
    test.add_dependency(app)
    test.build_configurations.each do |config|
      config.build_settings['TEST_HOST'] = "$(BUILT_PRODUCTS_DIR)/#{app.name}.app/#{app.name}"
      config.build_settings['BUNDLE_LOADER'] = '$(TEST_HOST)'
    end
  end
  [hosted, sibling, stale].each do |test|
    (project.root_object.attributes['TargetAttributes'] ||= {})[test.uuid] = { 'TestTargetID' => host.uuid }
  end
  mismatched.build_configurations.each do |config|
    config.build_settings['BUNDLE_LOADER'] = '$(BUILT_PRODUCTS_DIR)/PlainHost.app/PlainHost'
  end
  sdk_hosted.build_configurations.each do |config|
    config.build_settings['TEST_HOST[sdk=iphonesimulator*]'] = '$(BUILT_PRODUCTS_DIR)/PlainHost.app/PlainHost'
  end
  unresolved.build_configurations.each do |config|
    # An unresolved qualifier must not be overwritten by a later matching SDK key.
    config.build_settings['TEST_HOST[arch=arm64]'] = '$(BUILT_PRODUCTS_DIR)/PlainHost.app/PlainHost'
    config.build_settings['TEST_HOST[sdk=iphonesimulator*]'] = '$(BUILT_PRODUCTS_DIR)/Host.app/Host'
  end
  renamed.build_configurations.each do |config|
    product_config = File.join(fixture, "products-#{config.name}.xcconfig")
    File.write(product_config, <<~XCCONFIG)
      #include? "Pods/Target Support Files/Pods-Renamed Host/Pods-Renamed Host.#{config.name.downcase}.xcconfig"
      APP_BUNDLE_BASE = $(PROJECT_NAME) #{config.name}
    XCCONFIG
    config.base_configuration_reference = project.new_file(product_config)
    config.build_settings['PRODUCT_NAME'] = '$(APP_BUNDLE_BASE) Product'
    config.build_settings['PRODUCT_NAME[sdk=iphonesimulator*]'] = '$(APP_BUNDLE_BASE) Simulator Product'
    config.build_settings['EXECUTABLE_NAME'] = '$(TARGET_NAME) Binary'
    test_config = renamed_test.build_configuration_list[config.name]
    test_config.build_settings['TEST_HOST'] = "\"${BUILT_PRODUCTS_DIR}/Fixture #{config.name} Product.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/Renamed Host Binary\""
    test_config.build_settings['BUNDLE_LOADER'] = "$(BUILT_PRODUCTS_DIR)/Fixture #{config.name} Product.app/Renamed Host Binary"
    test_config.build_settings['TEST_HOST[sdk=iphonesimulator*]'] = "${BUILT_PRODUCTS_DIR}/Fixture #{config.name} Simulator Product.app/Renamed Host Binary"
    test_config.build_settings['BUNDLE_LOADER[sdk=iphonesimulator*]'] = '$(TEST_HOST)'
  end
  project.save

  %w[React-RCTFabric TestSupport].each do |pod_name|
    pod_dir = File.join(fixture, pod_name)
    FileUtils.mkdir_p(pod_dir)
    File.write(File.join(pod_dir, 'Fixture.m'), "#import <Foundation/Foundation.h>\n")
    File.write(File.join(pod_dir, "#{pod_name}.podspec"), <<~PODSPEC)
      Pod::Spec.new do |s|
        s.name = #{pod_name.dump}
        s.version = '1.0.0'
        s.summary = 'Local CocoaPods linking fixture.'
        s.homepage = 'https://reactnative.dev/'
        s.license = { :type => 'MIT', :text => 'Test fixture' }
        s.author = 'React Native'
        s.source = { :git => 'https://example.invalid/fixture.git' }
        s.platform = :ios, '15.1'
        s.source_files = 'Fixture.m'
        #{"s.dependency 'React-KMP'" if pod_name == 'React-RCTFabric'}
      end
    PODSPEC
  end

  File.write(File.join(fixture, 'helpers.rb'), <<~HELPERS)
    require #{helper.dump}
    def min_supported_versions
      { :ios => '15.1' }
    end
  HELPERS
  File.write(File.join(fixture, 'Podfile'), <<~PODFILE)
    require_relative './helpers'
    platform :ios, '15.1'
    install! 'cocoapods', :warn_for_unused_master_specs_repo => false
    project 'Fixture.xcodeproj'
    #{"use_frameworks! :linkage => :#{linkage}" if linkage && linkage != 'mixed'}
    target 'Host' do
      #{"use_frameworks! :linkage => :dynamic" if linkage == 'mixed'}
      pod 'React-KMP', :path => #{shared_root.dump}
      pod 'React-RCTFabric', :path => './React-RCTFabric'
      target 'HostedTests' do
        inherit! :search_paths
        pod 'TestSupport', :path => './TestSupport'
      end
    end
    #{['StandaloneTests', 'SiblingHostedTests', 'SiblingWithoutMetadata', 'Renamed Host', 'RenamedHostTests',
       'TestsWithNonKMPHost', 'StaleHostMetadataTests', 'MismatchedLoaderTests', 'SDKHostedTests', 'UnresolvedHostTests'].map do |target|
      <<~TARGET
        target #{target.dump} do
          #{'use_frameworks! :linkage => :static' if linkage == 'mixed'}
          pod 'React-KMP', :path => #{shared_root.dump}
          pod 'React-RCTFabric', :path => './React-RCTFabric'
        end
      TARGET
    end.join}
    target 'PlainHost' do
      pod 'TestSupport', :path => './TestSupport'
    end
    post_install do |installer|
      installer.aggregate_targets.each do |aggregate|
        aggregate.xcconfigs.each_key do |configuration|
          %w[iphoneos iphonesimulator].each do |sdk|
            target = aggregate.user_targets.first.name
            expected = %w[HostedTests SiblingHostedTests SiblingWithoutMetadata RenamedHostTests].include?(target) || (target == 'SDKHostedTests' && sdk == 'iphoneos')
            actual = ReactNativeKMPUtils.test_host_links_kmp?(aggregate, configuration, installer.aggregate_targets, sdk)
            raise "Wrong KMP host detection for \#{aggregate.label}/\#{configuration}/\#{sdk}: \#{actual}" unless actual == expected
          end
        end
      end
      ReactNativeKMPUtils.configure_aggregate_xcconfig(installer)
      ReactNativeKMPUtils.configure_aggregate_xcconfig(installer)
    end
  PODFILE

  output, status = Open3.capture2e(
    { 'COCOAPODS_DISABLE_STATS' => 'true', 'COCOAPODS_NO_BUNDLER' => 'true' },
    RbConfig.ruby, Gem.bin_path('cocoapods', 'pod'), 'install',
    "--project-directory=#{fixture}", '--no-repo-update'
  )
  File.write(File.join(fixture, 'pod-install.log'), output)
  raise "CocoaPods #{name} fixture failed: #{output}" unless status.success?

  ['Host', 'HostedTests', 'SiblingHostedTests', 'SiblingWithoutMetadata', 'Renamed Host', 'RenamedHostTests',
   'StandaloneTests', 'TestsWithNonKMPHost', 'StaleHostMetadataTests', 'MismatchedLoaderTests', 'SDKHostedTests', 'UnresolvedHostTests', 'PlainHost'].each do |target|
    %w[debug release].each do |configuration|
      config_path = File.join(fixture, 'Pods', 'Target Support Files', "Pods-#{target}", "Pods-#{target}.#{configuration}.xcconfig")
      config = Xcodeproj::Config.new(Pathname.new(config_path)).attributes
      dynamic = linkage == 'dynamic' || (linkage == 'mixed' && target == 'Host')
      counts = {}
      %w[iphoneos iphonesimulator].each do |sdk|
        hosted_kmp = %w[HostedTests SiblingHostedTests SiblingWithoutMetadata RenamedHostTests].include?(target) || (target == 'SDKHostedTests' && sdk == 'iphoneos')
        expected = target == 'PlainHost' || hosted_kmp || dynamic ? 0 : 1
        flags = config["OTHER_LDFLAGS[sdk=#{sdk}*]"].to_s
        count = flags.scan('-framework ReactNativeShared').length
        raise "#{name}/#{target}/#{configuration}/#{sdk}: expected #{expected} Kotlin links, got #{count}" unless count == expected
        search_paths = config["FRAMEWORK_SEARCH_PATHS[sdk=#{sdk}*]"].to_s
        if target != 'PlainHost' && !search_paths.include?('ReactNativeSharedKMP')
          raise "Missing inherited framework search path for #{name}/#{target}"
        end
        counts[sdk] = count
      end
      raise "Unconditional Kotlin link leaks into Catalyst for #{name}/#{target}" if config['OTHER_LDFLAGS'].to_s.include?('ReactNativeShared')
      results << { :linkage => name, :target => target, :configuration => configuration,
                   :kotlin_links_per_ios_sdk => counts }
    end
  end
end

File.write(File.join(output_root, 'results.json'), JSON.pretty_generate(results) + "\n")
puts "Passed #{results.length} CocoaPods configurations across static libraries, static frameworks, dynamic frameworks, and mixed per-target linkage."
puts "Generated fixture configs and logs: #{output_root}"
