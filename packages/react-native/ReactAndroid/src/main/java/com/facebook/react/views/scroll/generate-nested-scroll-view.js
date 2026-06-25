#!/usr/bin/env node
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 * @oncall react_native
 */

/**
 * Generates ReactNestedScrollView.kt and ReactNestedScrollViewManager.kt from
 * ReactScrollView.kt and ReactScrollViewManager.kt respectively.
 *
 * This script creates variants that use NestedScrollView instead of ScrollView
 * for experimentation purposes.
 *
 * Usage:
 *     node generate-nested-scroll-view.js [--verify]
 *
 * Options:
 *     --verify    Check if generated files are up-to-date (exit 1 if not)
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// SignedSource token - this placeholder gets replaced with the actual hash
// Use string concatenation to avoid marking THIS script as generated
const SIGNING_TOKEN = '<<SignedSource::*O*zOeWoEQle#+L!plEphiEmie@IsG>>';
const GENERATED_ANNOTATION = '@' + 'generated';

/**
 * Sign the file content by replacing the signing token with a SignedSource hash.
 */
function signFileContent(content) {
  // Compute MD5 hash with the token in place
  const md5Hash = crypto
    .createHash('md5')
    .update(content, 'utf8')
    .digest('hex');

  // Replace the token with the actual signature
  return content.replace(SIGNING_TOKEN, `SignedSource<<${md5Hash}>>`);
}

/**
 * Get the signing token placeholder to embed in the file.
 */
function getSigningToken() {
  return SIGNING_TOKEN;
}

/**
 * Generate the header comment for a generated file.
 */
function generatedHeader(sourceFile) {
  return `/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${GENERATED_ANNOTATION} ${getSigningToken()}
 */

/**
 * THIS FILE IS GENERATED - DO NOT EDIT DIRECTLY
 * Source: ${sourceFile}
 * Run: node generate-nested-scroll-view.js
 */

`;
}

// Regex pattern for replacing ReactScrollView with ReactNestedScrollView
// Excludes: Helper, CommandHelper, Accessible, Accessibility, ScrollState
const REACT_SCROLL_VIEW_PATTERN =
  /ReactScrollView(?!Helper|CommandHelper|Accessible|Accessibility|ScrollState)/g;

// Regex pattern for matching the original copyright header
const COPYRIGHT_HEADER_PATTERN = /\/\*\s*\n\s*\* Copyright.*?\*\/\s*\n/s;

/**
 * Replace ReactScrollView with ReactNestedScrollView in content.
 */
function replaceClassNames(content) {
  return content.replace(REACT_SCROLL_VIEW_PATTERN, 'ReactNestedScrollView');
}

/**
 * Replace the original copyright header with the generated header.
 */
function replaceCopyrightHeader(content, sourceFile) {
  return content.replace(COPYRIGHT_HEADER_PATTERN, generatedHeader(sourceFile));
}

/**
 * Transform ReactScrollView.kt to ReactNestedScrollView.kt
 */
function transformScrollView(content) {
  // Replace import (Kotlin imports have no semicolons)
  content = content.replace(
    'import android.widget.ScrollView',
    'import androidx.core.widget.NestedScrollView',
  );

  // Replace standalone ScrollView with NestedScrollView (not when part of another word)
  // This handles: ": ScrollView(context)", "ScrollView::class.java", etc.
  // But NOT: ReactScrollView, NestedScrollView, ScrollViewHelper, etc.
  content = content.replace(
    /(?<![A-Za-z])ScrollView(?!Helper|Manager|CommandHelper|Interface|Accessible|Accessibility)/g,
    'NestedScrollView',
  );

  // Replace ReactScrollView with ReactNestedScrollView
  content = replaceClassNames(content);

  // Make the class internal to keep it out of the public API
  content = content.replace(
    'public open class ReactNestedScrollView',
    'internal open class ReactNestedScrollView',
  );

  // Remove original copyright header and add generated header
  content = replaceCopyrightHeader(content, 'ReactScrollView.kt');

  return content;
}

/**
 * Transform ReactScrollViewManager.kt to ReactNestedScrollViewManager.kt
 */
function transformViewManager(content) {
  // Replace ReactScrollView with ReactNestedScrollView
  content = replaceClassNames(content);

  // Keep the same REACT_CLASS name so this is a drop-in replacement for A/B testing
  // (no JS changes needed - both managers register as "RCTScrollView")

  // Make the class internal to keep it out of the public API
  content = content.replace(
    'public open class ReactNestedScrollViewManager',
    'internal open class ReactNestedScrollViewManager',
  );

  // Remove original copyright header and add generated header
  content = replaceCopyrightHeader(content, 'ReactScrollViewManager.kt');

  return content;
}

/**
 * Generate a file from source using the given transform function.
 * Returns true if successful (or if verify mode and files match).
 */
function generateFile(sourcePath, outputPath, transformFn, verify) {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Source file not found: ${sourcePath}`);
    return false;
  }

  const content = fs.readFileSync(sourcePath, 'utf8');
  const transformed = transformFn(content);

  // Sign the file content (replaces token with MD5 hash)
  const signed = signFileContent(transformed);

  if (verify) {
    if (!fs.existsSync(outputPath)) {
      console.error(`FAIL: Generated file does not exist: ${outputPath}`);
      return false;
    }

    const existing = fs.readFileSync(outputPath, 'utf8');

    if (existing !== signed) {
      const sourceDir =
        '~/fbsource/xplat/js/react-native-github/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/scroll';
      console.error(
        `FAIL: ${path.basename(outputPath)} is out of date. ` +
          `Run 'cd ${sourceDir} && node generate-nested-scroll-view.js' to update.`,
      );
      return false;
    }

    console.log(`OK: ${path.basename(outputPath)} is up-to-date`);
    return true;
  }

  fs.writeFileSync(outputPath, signed, 'utf8');
  console.log(`Generated: ${outputPath}`);
  return true;
}

/**
 * Parse command line arguments.
 */
function parseArgs(args) {
  const result = {
    verify: false,
    sourceDir: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--verify') {
      result.verify = true;
    } else if (arg === '--source-dir') {
      if (i + 1 < args.length) {
        result.sourceDir = args[++i];
      } else {
        console.error('Error: --source-dir requires a path argument');
        process.exit(1);
      }
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node generate-nested-scroll-view.js [--verify] [--source-dir DIR]

Options:
    --verify        Check if generated files are up-to-date (exit 1 if not)
    --source-dir    Directory containing source files (defaults to script directory)`);
      process.exit(0);
    }
  }

  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  // Use provided source dir or fall back to script's directory
  const sourceDir = args.sourceDir || path.dirname(process.argv[1]);

  const filesToGenerate = [
    {
      source: path.join(sourceDir, 'ReactScrollView.kt'),
      output: path.join(sourceDir, 'ReactNestedScrollView.kt'),
      transform: transformScrollView,
    },
    {
      source: path.join(sourceDir, 'ReactScrollViewManager.kt'),
      output: path.join(sourceDir, 'ReactNestedScrollViewManager.kt'),
      transform: transformViewManager,
    },
  ];

  let success = true;
  for (const {source, output, transform} of filesToGenerate) {
    if (!generateFile(source, output, transform, args.verify)) {
      success = false;
    }
  }

  process.exit(success ? 0 : 1);
}

main();
