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

        # Dynamic RCTFabric already contains the static Kotlin runtime.
        next if linked_pods.any? { |pod| pod.pod_name == 'React-RCTFabric' && pod.build_as_dynamic? }

        %w[iphoneos iphonesimulator].each do |sdk|
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
end
