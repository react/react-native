/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {ExceptionData} from '../../Core/NativeExceptionsManager';
import type {LogBoxLogData} from './LogBoxLog';
import type {Stack} from './LogBoxSymbolication';

import parseErrorStack from '../../Core/Devtools/parseErrorStack';
import UTFSequence from '../../UTFSequence';
import stringifySafe from '../../Utilities/stringifySafe';
import ansiRegex from 'ansi-regex';

const ANSI_REGEX = ansiRegex().source;

const RE_TRANSFORM_ERROR = /^TransformError /;
const RE_COMPONENT_STACK_LINE = /\n {4}at/;
const RE_COMPONENT_STACK_LINE_STACK_FRAME = /@.*\n/;

// "TransformError " (Optional) and either "SyntaxError: " or "ReferenceError: "
// Capturing groups:
// 1: error message
// 2: file path
// 3: line number
// 4: column number
// \n\n
// 5: code frame
const RE_BABEL_TRANSFORM_ERROR_FORMAT =
  /^(?:TransformError )?(?:SyntaxError: |ReferenceError: )(.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/;

// Capturing groups:
// - non-capturing "TransformError " (optional)
// - non-capturing Error message
// 1: file path
// 2: file name
// 3: error message
// 4: code frame, which includes code snippet indicators or terminal escape sequences for formatting.
const RE_BABEL_CODE_FRAME_ERROR_FORMAT =
  // eslint-disable-next-line no-control-regex
  /^(?:TransformError )?(?:.*):? (?:.*?)(\/.*): ([\s\S]+?)\n([ >]{2}[\d\s]+ \|[\s\S]+|\u{001b}[\s\S]+)/u;

// Capturing groups:
// - non-capturing "InternalError Metro has encountered an error:"
// 1: error title
// 2: error message
// 3: file path
// 4: line number
// 5: column number
// 6: code frame, which includes code snippet indicators or terminal escape sequences for formatting.
const RE_METRO_ERROR_FORMAT =
  /^(?:InternalError Metro has encountered an error:) (.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+)/u;

// https://github.com/babel/babel/blob/33dbb85e9e9fe36915273080ecc42aee62ed0ade/packages/babel-code-frame/src/index.ts#L183-L184
const RE_BABEL_CODE_FRAME_MARKER_PATTERN = new RegExp(
  [
    // Beginning of a line (per 'm' flag)
    '^',
    // Optional ANSI escapes for colors
    `(?:${ANSI_REGEX})*`,
    // Marker
    '>',
    // Optional ANSI escapes for colors
    `(?:${ANSI_REGEX})*`,
    // Left padding for line number
    ' +',
    // Line number
    '[0-9]+',
    // Gutter
    ' \\|',
  ].join(''),
  'm',
);

export type ExtendedExceptionData = ExceptionData & {
  isComponentError: boolean,
  ...
};
export type Category = string;
export type CodeFrame = Readonly<{
  content: string,
  location: ?{
    row: number,
    column: number,
    ...
  },
  fileName: string,

  // TODO: When React switched to using call stack frames,
  // we gained the ability to use the collapse flag, but
  // it is not integrated into the LogBox UI.
  collapse?: boolean,
}>;
export type Message = Readonly<{
  content: string,
  substitutions: ReadonlyArray<
    Readonly<{
      length: number,
      offset: number,
    }>,
  >,
}>;

const SUBSTITUTION = UTFSequence.BOM + '%s';

export function parseInterpolation(args: ReadonlyArray<unknown>): Readonly<{
  category: Category,
  message: Message,
}> {
  const categoryParts = [];
  const contentParts = [];
  const substitutionOffsets = [];

  const remaining = [...args];
  if (typeof remaining[0] === 'string') {
    const formatString = String(remaining.shift());
    const formatStringParts = formatString.split('%s');
    const substitutionCount = formatStringParts.length - 1;
    const substitutions = remaining.splice(0, substitutionCount);

    let categoryString = '';
    let contentString = '';

    let substitutionIndex = 0;
    for (const formatStringPart of formatStringParts) {
      categoryString += formatStringPart;
      contentString += formatStringPart;

      if (substitutionIndex < substitutionCount) {
        if (substitutionIndex < substitutions.length) {
          // Don't stringify a string type.
          // It adds quotation mark wrappers around the string,
          // which causes the LogBox to look odd.
          const substitution =
            typeof substitutions[substitutionIndex] === 'string'
              ? substitutions[substitutionIndex]
              : stringifySafe(substitutions[substitutionIndex]);
          substitutionOffsets.push({
            length: substitution.length,
            offset: contentString.length,
          });

          categoryString += SUBSTITUTION;
          contentString += substitution;
        } else {
          substitutionOffsets.push({
            length: 2,
            offset: contentString.length,
          });

          categoryString += '%s';
          contentString += '%s';
        }

        substitutionIndex++;
      }
    }

    categoryParts.push(categoryString);
    contentParts.push(contentString);
  }

  const remainingArgs = remaining.map(arg => {
    // Don't stringify a string type.
    // It adds quotation mark wrappers around the string,
    // which causes the LogBox to look odd.
    return typeof arg === 'string' ? arg : stringifySafe(arg);
  });
  categoryParts.push(...remainingArgs);
  contentParts.push(...remainingArgs);

  return {
    category: categoryParts.join(' '),
    message: {
      content: contentParts.join(' '),
      substitutions: substitutionOffsets,
    },
  };
}

function isComponentStack(consoleArgument: string) {
  // Component stacks are formatted as call stack frames:
  // - Hermes format: "    at Component (/path/to/file.js:1:2)"
  // - JSC format: "Component@/path/to/file.js:1:2"
  return (
    RE_COMPONENT_STACK_LINE.test(consoleArgument) ||
    RE_COMPONENT_STACK_LINE_STACK_FRAME.test(consoleArgument)
  );
}

export function parseComponentStack(message: string): {
  stack: Stack,
} {
  const stack = parseErrorStack(message);
  return {
    stack: stack ?? [],
  };
}

export function parseLogBoxException(
  error: ExtendedExceptionData,
): LogBoxLogData {
  const message =
    error.originalMessage != null ? error.originalMessage : 'Unknown';

  const metroInternalError = message.match(RE_METRO_ERROR_FORMAT);
  if (metroInternalError) {
    const [content, fileName, row, column, codeFrame] =
      metroInternalError.slice(1);

    return {
      level: 'fatal',
      type: 'Metro Error',
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        fileName,
        location: {
          row: parseInt(row, 10),
          column: parseInt(column, 10),
        },
        content: codeFrame,
      },
      message: {
        content,
        substitutions: [],
      },
      category: `${fileName}-${row}-${column}`,
      extraData: error.extraData,
    };
  }

  const babelTransformError = message.match(RE_BABEL_TRANSFORM_ERROR_FORMAT);
  if (babelTransformError) {
    // Transform errors are thrown from inside the Babel transformer.
    const [fileName, content, row, column, codeFrame] =
      babelTransformError.slice(1);

    return {
      level: 'syntax',
      stack: [],
      isComponentError: false,
      componentStack: [],
      codeFrame: {
        fileName,
        location: {
          row: parseInt(row, 10),
          column: parseInt(column, 10),
        },
        content: codeFrame,
      },
      message: {
        content,
        substitutions: [],
      },
      category: `${fileName}-${row}-${column}`,
      extraData: error.extraData,
    };
  }

  // Perform a cheap match first before trying to parse the full message, which
  // can get expensive for arbitrary input.
  if (RE_BABEL_CODE_FRAME_MARKER_PATTERN.test(message)) {
    const babelCodeFrameError = message.match(RE_BABEL_CODE_FRAME_ERROR_FORMAT);

    if (babelCodeFrameError) {
      // Codeframe errors are thrown from any use of buildCodeFrameError.
      const [fileName, content, codeFrame] = babelCodeFrameError.slice(1);
      return {
        level: 'syntax',
        stack: [],
        isComponentError: false,
        componentStack: [],
        codeFrame: {
          fileName,
          location: null, // We are not given the location.
          content: codeFrame,
        },
        message: {
          content,
          substitutions: [],
        },
        category: `${fileName}-${1}-${1}`,
        extraData: error.extraData,
      };
    }
  }

  if (message.match(RE_TRANSFORM_ERROR)) {
    return {
      level: 'syntax',
      stack: error.stack,
      isComponentError: error.isComponentError,
      componentStack: [],
      message: {
        content: message,
        substitutions: [],
      },
      category: message,
      extraData: error.extraData,
    };
  }

  const componentStack = error.componentStack;
  if (error.isFatal || error.isComponentError) {
    if (componentStack != null) {
      const {stack} = parseComponentStack(componentStack);
      return {
        level: 'fatal',
        stack: error.stack,
        isComponentError: error.isComponentError,
        componentStack: stack,
        extraData: error.extraData,
        ...parseInterpolation([message]),
      };
    } else {
      return {
        level: 'fatal',
        stack: error.stack,
        isComponentError: error.isComponentError,
        componentStack: [],
        extraData: error.extraData,
        ...parseInterpolation([message]),
      };
    }
  }

  if (componentStack != null) {
    // It is possible that console errors have a componentStack.
    const {stack} = parseComponentStack(componentStack);
    return {
      level: 'error',
      stack: error.stack,
      isComponentError: error.isComponentError,
      componentStack: stack,
      extraData: error.extraData,
      ...parseInterpolation([message]),
    };
  }

  // Most `console.error` calls won't have a componentStack. We parse them like
  // regular logs which have the component stack buried in the message.
  return {
    level: 'error',
    stack: error.stack,
    isComponentError: error.isComponentError,
    extraData: error.extraData,
    ...parseLogBoxLog([message]),
  };
}

export function withoutANSIColorStyles(message: unknown): unknown {
  if (typeof message !== 'string') {
    return message;
  }

  return message.replace(
    // eslint-disable-next-line no-control-regex
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    '',
  );
}

export function parseLogBoxLog(args: ReadonlyArray<unknown>): {
  componentStack: Stack,
  category: Category,
  message: Message,
} {
  const message = withoutANSIColorStyles(args[0]);
  let argsWithoutComponentStack: Array<unknown> = [];
  let componentStack: Stack = [];

  // Extract component stack from warnings like "Some warning%s".
  if (
    typeof message === 'string' &&
    message.slice(-2) === '%s' &&
    args.length > 0
  ) {
    const lastArg = args[args.length - 1];
    if (typeof lastArg === 'string' && isComponentStack(lastArg)) {
      argsWithoutComponentStack = args.slice(0, -1);
      argsWithoutComponentStack[0] = message.slice(0, -2);
      const {stack} = parseComponentStack(lastArg);
      componentStack = stack;
    }
  }

  if (componentStack.length === 0 && argsWithoutComponentStack.length === 0) {
    // Try finding the component stack elsewhere.
    for (const arg of args) {
      if (typeof arg === 'string' && isComponentStack(arg)) {
        // Strip out any messages before the component stack.
        let messageEndIndex = arg.search(RE_COMPONENT_STACK_LINE);
        if (messageEndIndex < 0) {
          // Handle JSC component stacks.
          messageEndIndex = arg.search(/\n/);
        }
        if (messageEndIndex > 0) {
          argsWithoutComponentStack.push(arg.slice(0, messageEndIndex));
        }

        const {stack} = parseComponentStack(arg);
        componentStack = stack;
      } else {
        argsWithoutComponentStack.push(arg);
      }
    }
  }

  return {
    ...parseInterpolation(argsWithoutComponentStack),
    componentStack,
  };
}
