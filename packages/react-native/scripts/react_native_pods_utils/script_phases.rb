# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Run test manually by running `ruby react-native/scripts/react_native_pods_utils/__tests__/script_phases.test.rb`

require "erb"

def get_script_phases_with_codegen_discovery(options)
    export_vars = {
        'RCT_SCRIPT_RN_DIR' => "$RCT_SCRIPT_POD_INSTALLATION_ROOT/#{options[:react_native_path]}",
        'RCT_SCRIPT_APP_PATH' => "$RCT_SCRIPT_POD_INSTALLATION_ROOT/#{options[:relative_app_root]}",
        'RCT_SCRIPT_OUTPUT_DIR' => "$RCT_SCRIPT_POD_INSTALLATION_ROOT",
        'RCT_SCRIPT_TYPE' => "withCodegenDiscovery",
    }
    return get_script_template(options[:react_native_path], export_vars)
end

def get_script_phases_no_codegen_discovery(options)
    export_vars = {
        'RCT_SCRIPT_RN_DIR' => "${PODS_TARGET_SRCROOT}/#{options[:react_native_path]}",
        'RCT_SCRIPT_LIBRARY_NAME' => "#{options[:library_name]}",
        'RCT_SCRIPT_OUTPUT_DIR' => "$RCT_SCRIPT_POD_INSTALLATION_ROOT/#{options[:codegen_output_dir]}",
        'RCT_SCRIPT_LIBRARY_TYPE' => "#{options[:library_type] ? options[:library_type] : 'all'}",
        'RCT_SCRIPT_JS_SRCS_PATTERN' => "#{options[:js_srcs_pattern]}",
        'RCT_SCRIPT_JS_SRCS_DIR' => "#{options[:js_srcs_dir]}",
        'RCT_SCRIPT_CODEGEN_MODULE_DIR' => "#{options[:codegen_module_dir]}",
        'RCT_SCRIPT_CODEGEN_COMPONENT_DIR' => "#{options[:codegen_component_dir]}",
        'RCT_SCRIPT_FILE_LIST' => ("#{options[:file_list]}").dump,
    }
    return get_script_template(options[:react_native_path], export_vars)
end


def get_script_template(react_native_path, export_vars={})
    template =<<~EOS
        # Use PODFILE_DIR (set by react_native_post_install) to locate the
        # Podfile directory. PODS_ROOT/.. does not work when Pods/ is a symlink.
        if [ -n "$PODFILE_DIR" ]; then
          RCT_SCRIPT_POD_INSTALLATION_ROOT="$PODFILE_DIR"
        else
          pushd "$PODS_ROOT/../" > /dev/null
          RCT_SCRIPT_POD_INSTALLATION_ROOT=$(pwd)
          popd >/dev/null
        fi
        <% export_vars.each do |(varname, value)| %>
        export <%= varname -%>=<%= value -%>
        <% end %>

        SCRIPT_PHASES_SCRIPT="$RCT_SCRIPT_RN_DIR/scripts/react_native_pods_utils/script_phases.sh"
        WITH_ENVIRONMENT="$RCT_SCRIPT_RN_DIR/scripts/xcode/with-environment.sh"
        /bin/sh -c "$WITH_ENVIRONMENT $SCRIPT_PHASES_SCRIPT"
        EOS
    result = ERB.new(template, trim_mode: '->').result(binding)
    return result
end
