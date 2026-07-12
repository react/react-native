/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ESNode, Program} from 'hermes-estree';

import {parse} from 'hermes-parser';

export type TransformResult = {
  code: string,
  hasResult: boolean,
  newNames: Set<string>,
};

function collectPatternNames(node: ESNode, out: Set<string>): void {
  switch (node.type) {
    case 'Identifier':
      out.add(node.name);
      break;
    case 'ObjectPattern':
      for (const property of node.properties) {
        if (property.type === 'RestElement') {
          collectPatternNames(property.argument, out);
        } else {
          collectPatternNames(property.value, out);
        }
      }
      break;
    case 'ArrayPattern':
      for (const element of node.elements) {
        if (element != null) {
          collectPatternNames(element, out);
        }
      }
      break;
    case 'AssignmentPattern':
      collectPatternNames(node.left, out);
      break;
    case 'RestElement':
      collectPatternNames(node.argument, out);
      break;
    default:
      break;
  }
}

function collectDeclaredNames(program: Program): Set<string> {
  const names = new Set<string>();
  for (const statement of program.body) {
    switch (statement.type) {
      case 'VariableDeclaration':
        for (const declaration of statement.declarations) {
          collectPatternNames(declaration.id, names);
        }
        break;
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
        if (statement.id != null) {
          names.add(statement.id.name);
        }
        break;
      case 'ImportDeclaration':
        for (const specifier of statement.specifiers) {
          names.add(specifier.local.name);
        }
        break;
      default:
        break;
    }
  }
  return names;
}

function getRange(node: ESNode): [number, number] {
  return [node.range[0], node.range[1]];
}

/**
 * Parses a line of REPL input and rewrites it into a Metro entry module that:
 *
 *  1. Brings previously declared names into scope from `$$REPL_SCOPE$$`.
 *  2. Runs the user's code verbatim (preserving Flow/JSX), capturing the value
 *     of a trailing expression into `$$REPL_RESULT$$`.
 *  3. Writes any top-level bindings back to `$$REPL_SCOPE$$` so they persist.
 *
 * The user's source is never regenerated from the AST (only sliced), so exotic
 * syntax in the body round-trips unchanged.
 *
 * Throws the underlying parse error if the input cannot be parsed.
 */
export function transform(
  input: string,
  priorNames: Set<string>,
): TransformResult {
  const ast = parse(input, {babel: false});
  const declared = collectDeclaredNames(ast);

  let body = input;
  let hasResult = false;
  const last = ast.body[ast.body.length - 1];
  if (last != null && last.type === 'ExpressionStatement') {
    // Replace the entire last statement with a result-capturing assignment,
    // using the inner expression's text. We slice the expression (not the
    // statement) so any surrounding parentheses/semicolon are dropped, then
    // re-wrap in our own parentheses — this keeps parenthesized expressions
    // like `({a: 1})` valid.
    const [statementStart] = getRange(last);
    const [exprStart, exprEnd] = getRange(last.expression);
    body =
      input.slice(0, statementStart) +
      'globalThis.$$REPL_RESULT$$ = (' +
      input.slice(exprStart, exprEnd) +
      '); globalThis.$$REPL_HAS_RESULT$$ = true;';
    hasResult = true;
  }

  const prepend = [...priorNames].filter(name => !declared.has(name));
  const writeBack = new Set([...priorNames, ...declared]);

  let code = '';
  if (prepend.length > 0) {
    code += `let {${prepend.join(', ')}} = globalThis.$$REPL_SCOPE$$;\n`;
  }
  code += body + '\n';
  for (const name of writeBack) {
    code += `globalThis.$$REPL_SCOPE$$.${name} = ${name};\n`;
  }

  return {code, hasResult, newNames: writeBack};
}

const RECOVERABLE_ERROR_PATTERNS = [
  /Unexpected end of input/i,
  /Unexpected EOF/i,
  /Unexpected token `?end/i,
  /but found end of/i,
  // Unterminated string / template / comment / regular-expression literals —
  // the user is likely still typing a multi-line construct.
  /Unterminated/i,
];

/**
 * Heuristic to decide whether a parse error is because the user hasn't finished
 * typing (e.g. an open brace or unterminated template), in which case the REPL
 * should keep reading more lines.
 */
export function isRecoverableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return RECOVERABLE_ERROR_PATTERNS.some(pattern => pattern.test(message));
}
