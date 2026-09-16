# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

class ReactNativeKMPUtils
  def self.configure_aggregate_xcconfig(installer)
    installer.aggregate_targets.each do |aggregate_target|
      aggregate_target.xcconfigs.each do |config_name, config_file|
        # CocoaPods excludes the host's static pods from search-path-only test
        # targets here. user_target_xcconfig does not perform that exclusion.
        linked_pods = aggregate_target.build_settings(config_name).pod_targets_to_link
        next unless linked_pods.any? { |pod| pod.pod_name == 'React-KMP' }

        # Dynamic React-Core already contains the static Kotlin runtime. Other
        # consumers use their existing React-Core dependency to share that owner.
        next if linked_pods.any? { |pod| pod.pod_name == 'React-Core' && pod.build_as_dynamic? }
        %w[iphoneos iphonesimulator].each do |sdk|
          # Full-pod sibling tests also reuse their host's runtime. Resolve each
          # SDK separately because TEST_HOST and product settings can be conditional.
          next if test_host_links_kmp?(aggregate_target, config_name, installer.aggregate_targets, sdk)

          key = "OTHER_LDFLAGS[sdk=#{sdk}*]"
          flags = config_file.attributes[key] || '$(inherited)'
          unless flags.include?('-framework ReactNativeShared')
            config_file.attributes[key] = "#{flags} -framework ReactNativeShared"
          end
        end
        config_file.save_as(aggregate_target.xcconfig_path(config_name))
      end
    end
  end

  def self.test_host_links_kmp?(aggregate_target, config_name, aggregate_targets, sdk)
    user_targets = aggregate_target.user_targets
    !user_targets.empty? && user_targets.all? do |target|
      next false unless target.symbol_type == :unit_test_bundle

      settings = target_settings(target, config_name, sdk)
      test_host = expand_build_setting(settings['TEST_HOST'], settings)
      bundle_loader = expand_build_setting(settings['BUNDLE_LOADER'], settings)
      next false if test_host.to_s.empty? || bundle_loader.to_s.empty?
      next false unless Pathname.new(test_host).cleanpath == Pathname.new(bundle_loader).cleanpath

      project = aggregate_target.user_project
      host_uuid = project.root_object.attributes.dig('TargetAttributes', target.uuid, 'TestTargetID')
      # TestTargetID is optional. A dependency is only a candidate, not evidence
      # of hosting: both loader settings must identify its actual app executable.
      candidates = host_uuid ? project.targets.select { |app| app.uuid == host_uuid } : target.dependencies.map(&:target).compact
      hosts = candidates.select do |app|
        next false unless app.project == project && app.symbol_type == :application
        app_settings = target_settings(app, config_name, sdk)
        executable = expand_build_setting(app_settings['EXECUTABLE_PATH'], app_settings)
        next false if executable.to_s.empty? || executable.include?('$')
        path = expand_build_setting("$(BUILT_PRODUCTS_DIR)/#{executable}", app_settings)
        path && Pathname.new(path).cleanpath == Pathname.new(test_host).cleanpath
      end
      next false unless hosts.one?

      aggregate_targets.any? do |candidate|
        candidate.user_project == project && candidate.user_target_uuids.include?(hosts.first.uuid) &&
          candidate.build_settings(config_name).pod_targets_to_link.any? { |pod| pod.pod_name == 'React-KMP' }
      end
    end
  end

  def self.target_settings(target, config_name, sdk)
    # Xcodeproj's resolved_build_setting drops unknown SDK variables and does
    # not supply product defaults. Preserve those variables for exact path matching.
    settings = {
      'TARGET_NAME' => target.name, 'CONFIGURATION' => config_name,
      'PROJECT_NAME' => target.project.path.basename('.xcodeproj').to_s,
      'SRCROOT' => target.project.project_dir.to_s, 'PROJECT_DIR' => target.project.project_dir.to_s,
      'PRODUCT_NAME' => '$(TARGET_NAME)', 'EXECUTABLE_PREFIX' => '', 'EXECUTABLE_SUFFIX' => '',
      'EXECUTABLE_NAME' => '$(EXECUTABLE_PREFIX)$(PRODUCT_NAME)$(EXECUTABLE_SUFFIX)',
      'WRAPPER_NAME' => '$(PRODUCT_NAME).app', 'FULL_PRODUCT_NAME' => '$(WRAPPER_NAME)',
      'EXECUTABLE_FOLDER_PATH' => '$(FULL_PRODUCT_NAME)',
      'EXECUTABLE_PATH' => '$(EXECUTABLE_FOLDER_PATH)/$(EXECUTABLE_NAME)',
      'BUNDLE_EXECUTABLE_FOLDER_PATH' => '',
      'BUILT_PRODUCTS_DIR' => '$(CONFIGURATION_BUILD_DIR)',
      'TARGET_BUILD_DIR' => '$(CONFIGURATION_BUILD_DIR)',
    }
    [target.project.build_configuration_list[config_name], target.build_configuration_list[config_name]].compact.each do |config|
      path = config.base_configuration_reference&.real_path
      xcconfig = path&.file? ? Xcodeproj::Config.new(path).to_hash : {}
      [xcconfig, config.build_settings].each do |layer|
        # Conditional values override their unqualified value within the layer.
        uncertain = []
        layer.sort_by { |key, _| key.count('[') }.each do |key, value|
          next unless value.is_a?(String)
          name = key.split('[').first
          conditions = key.scan(/\[([^=]+)=([^\]]+)\]/).map do |qualifier, pattern|
            case qualifier
            when 'config' then File.fnmatch?(pattern, config_name)
            when 'sdk'
              if File.fnmatch?(pattern, sdk)
                true
              else
                # A partial/version-specific match cannot be resolved at pod install.
                prefix = pattern.split(/[*?\[]/, 2).first.to_s
                (sdk.start_with?(prefix) || prefix.start_with?(sdk)) ? nil : false
              end
            end
          end
          next if conditions.include?(false)
          # Do not guess the host if an unsupported qualifier affects its path.
          uncertain << name if conditions.include?(nil)
          inherited = /\$\(inherited\)|\$\{inherited\}/
          unresolved_inheritance = settings.key?(name) && settings[name].nil? && value.match?(inherited)
          settings[name] = unresolved_inheritance ? nil : value.gsub(inherited) { settings[name].to_s }
        end
        # Unknown precedence must not depend on the order of equally qualified keys.
        uncertain.each { |name| settings[name] = nil }
      end
    end
    settings
  end

  def self.expand_build_setting(value, settings, expanding = [])
    return nil if value.nil?

    value.to_s.sub(/\A(["'])(.*)\1\z/m, '\\2').gsub(/\$\((\w+)\)|\$\{(\w+)\}/) do
      key = Regexp.last_match(1) || Regexp.last_match(2)
      if settings.key?(key) && !expanding.include?(key)
        expanded = expand_build_setting(settings[key], settings, expanding + [key])
        return nil if expanded.nil?
        expanded
      else
        "$(#{key})"
      end
    end
  end
end
