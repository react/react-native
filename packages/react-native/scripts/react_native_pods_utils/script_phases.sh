#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -o pipefail
set -e

GENERATED_SRCS_DIR="$DERIVED_FILE_DIR/generated/source/codegen"
TEMP_OUTPUT_DIR="$GENERATED_SRCS_DIR/out"
GENERATED_SCHEMA_FILE="$GENERATED_SRCS_DIR/schema.json"

cd "$RCT_SCRIPT_RN_DIR"

CODEGEN_CLI_PATH=""

error () {
    message="$*"
    echo "$message"
    echo "[Codegen] $message" >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
    exit 1
}

find_node () {
    NODE_BINARY="${NODE_BINARY:-$(command -v node || true)}"
    if [ -z "$NODE_BINARY" ]; then
        error "[Error] Could not find node. It looks like that the .xcode.env or .xcode.env.local " \
"files are misconfigured. Please check that they are exporting a valid NODE_BINARY " \
"variable, pointing to a node executable."
    fi
}

find_codegen () {
    CODEGEN_CLI_PATH=$("$NODE_BINARY" --print "require('path').dirname(require.resolve('@react-native/codegen/package.json'))")
    if ! [ -d "$CODEGEN_CLI_PATH" ]; then
        error "error: Could not determine @react-native/codegen location, using node module resolution. Try running 'yarn install' or 'npm install' in your project root."
    fi
}

setup_dirs () {
    set +e
    rm -rf "$GENERATED_SRCS_DIR"
    set -e

    mkdir -p "$GENERATED_SRCS_DIR" "$TEMP_OUTPUT_DIR"

    # Clear output files
    true > "${SCRIPT_OUTPUT_FILE_0}"
}

describe () {
    message="

    >>>>> $1

    "
    echo "$message" >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
}

runSpecCodegen () {
    "$NODE_BINARY" "scripts/generate-specs-cli.js" --platform ios --schemaPath "$GENERATED_SCHEMA_FILE" --outputDir "$1" --libraryName "$RCT_SCRIPT_LIBRARY_NAME" --libraryType "$2"
}

generateCodegenSchemaFromJavaScript () {
    describe "Generating codegen schema from JavaScript"

    SRCS_PATTERN="$RCT_SCRIPT_JS_SRCS_PATTERN"
    SRCS_DIR="$RCT_SCRIPT_JS_SRCS_DIR"
    if [ "$SRCS_PATTERN" ]; then
        JS_SRCS=$(find "$PODS_TARGET_SRCROOT/$SRCS_DIR" -type f -name "$SRCS_PATTERN" -print0 | xargs -0)
        echo "$RCT_SCRIPT_FILE_LIST" >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
    else
        JS_SRCS="$PODS_TARGET_SRCROOT/$SRCS_DIR"
        echo "$RCT_SCRIPT_JS_SRCS_DIR" >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
    fi

    # shellcheck disable=SC2086
    # $JS_SRCS not having double quotations is intentional
    "$NODE_BINARY" "$CODEGEN_CLI_PATH/lib/cli/combine/combine-js-to-schema-cli.js" "$GENERATED_SCHEMA_FILE" $JS_SRCS
}

generateCodegenArtifactsFromSchema () {
    describe "Generating codegen artifacts from schema"
    pushd "$RN_DIR" >/dev/null || exit 1
        if [ "$RCT_SCRIPT_LIBRARY_TYPE" = "all" ]; then
            runSpecCodegen "$TEMP_OUTPUT_DIR" "modules"
            runSpecCodegen "$TEMP_OUTPUT_DIR" "components"
        elif [ "$RCT_SCRIPT_LIBRARY_TYPE" = "components" ]; then
            runSpecCodegen "$TEMP_OUTPUT_DIR" "$RCT_SCRIPT_LIBRARY_TYPE"
        elif [ "$RCT_SCRIPT_LIBRARY_TYPE" = "modules" ]; then
            runSpecCodegen "$TEMP_OUTPUT_DIR" "$RCT_SCRIPT_LIBRARY_TYPE"
        fi
    popd >/dev/null || exit 1
}

generateArtifacts () {
    describe "Generating codegen artifacts"
    pushd "$RCT_SCRIPT_RN_DIR" >/dev/null || exit 1
        "$NODE_BINARY" "scripts/generate-codegen-artifacts.js" --path "$RCT_SCRIPT_APP_PATH" --outputPath "$RCT_SCRIPT_OUTPUT_DIR" --targetPlatform "ios"
    popd >/dev/null || exit 1
}

moveOutputs () {
    mkdir -p "$RCT_SCRIPT_OUTPUT_DIR"

    # Copy all output to output_dir
    /bin/cp -R -X "$TEMP_OUTPUT_DIR/." "$RCT_SCRIPT_OUTPUT_DIR" || exit 1
    echo "$LIBRARY_NAME output has been written to $RCT_SCRIPT_OUTPUT_DIR:" >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
    ls -1 "$RCT_SCRIPT_OUTPUT_DIR" >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
}

withCodegenDiscovery () {
    find_node
    find_codegen
    generateArtifacts
}

noCodegenDiscovery () {
    setup_dirs
    find_node
    find_codegen
    generateCodegenSchemaFromJavaScript
    generateCodegenArtifactsFromSchema
    moveOutputs
}

if [ "$RCT_SCRIPT_TYPE" = "withCodegenDiscovery" ]; then
    withCodegenDiscovery "$@"
else
    noCodegenDiscovery "$@"
fi

echo 'Done.' >> "${SCRIPT_OUTPUT_FILE_0}" 2>&1
