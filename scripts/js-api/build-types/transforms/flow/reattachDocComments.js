/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  Comment,
  ESNode,
  ModuleDeclaration,
  Program,
  Statement,
} from 'hermes-estree/dist';
import type {TransformVisitor} from 'hermes-transform';
import type {ParseResult} from 'hermes-transform/dist/transform/parse';
import type {TransformASTResult} from 'hermes-transform/dist/transform/transformAST';

const {transformAST} = require('hermes-transform/dist/transform/transformAST');

type BodyNode = Statement | ModuleDeclaration;

/**
 * Move the doc comment for a module's default export onto its
 * `export default` declaration.
 *
 * `flow-api-translator` strips the runtime implementation of a module, which
 * either drops or strands the doc comment for the default-exported value. This
 * matters because the doc comment must end up on the symbol that TypeScript
 * resolves a re-export to — for default exports that is the synthetic
 * `export default` const, not the inner implementation symbol it aliases via
 * `typeof`.
 */
const visitors: TransformVisitor = context => ({
  Program(node: Program): void {
    const exportDefault = node.body.find(
      bodyNode =>
        bodyNode.type === 'ExportDefaultDeclaration' ||
        (bodyNode.type === 'DeclareExportDeclaration' &&
          bodyNode.default === true),
    );
    if (exportDefault == null) {
      return;
    }

    // Leave already-documented (and inline) default exports untouched.
    if (context.getLeadingComments(exportDefault).some(isDocComment)) {
      return;
    }

    // Both forms carry the exported value via `declaration`.
    let exportedDeclaration: ?ESNode = null;
    if (exportDefault.type === 'ExportDefaultDeclaration') {
      exportedDeclaration = exportDefault.declaration;
    } else if (
      exportDefault.type === 'DeclareExportDeclaration' &&
      exportDefault.default === true
    ) {
      exportedDeclaration = exportDefault.declaration;
    }
    if (exportedDeclaration == null) {
      return;
    }

    const exportedName = getExportedIdentifierName(exportedDeclaration);
    if (exportedName == null) {
      return;
    }

    const exportedDecl = findDeclarationByName(node.body, exportedName);

    // A directly-exported class keeps its declaration, where TypeScript already
    // resolves the doc comment; moving it would hide it.
    if (exportedDecl?.kind === 'ClassDeclaration') {
      return;
    }

    for (const source of findDocCommentSources(
      node.body,
      exportedName,
      exportedDecl,
    )) {
      const docComments = context
        .getLeadingComments(source)
        .filter(isDocComment);
      if (docComments.length > 0) {
        context.addLeadingComments(exportDefault, docComments);
        context.removeComments(docComments);
        return;
      }
    }
  },
});

/**
 * A JSDoc-style block comment (`/** ... *‍/`), excluding the license/pragma
 * docblock and build directives such as `@build-types emit-as-interface`.
 */
function isDocComment(comment: Comment): boolean {
  return (
    comment.type === 'Block' &&
    comment.value.startsWith('*') &&
    !/@(flow|noflow|format|build-types)\b/.test(comment.value) &&
    !comment.value.includes('Copyright')
  );
}

/**
 * Name of the exported identifier, unwrapping `as` casts and the `typeof X`
 * form. Returns `null` for inline/anonymous declarations.
 */
function getExportedIdentifierName(declaration: ESNode): ?string {
  let node: ESNode = declaration;
  while (node.type === 'AsExpression' || node.type === 'TypeCastExpression') {
    node = node.expression;
  }
  if (node.type === 'TypeofTypeAnnotation') {
    return node.argument.type === 'Identifier' ? node.argument.name : null;
  }
  return node.type === 'Identifier' ? node.name : null;
}

/**
 * Statements whose leading comment may document the default export, in priority
 * order.
 */
function findDocCommentSources(
  body: ReadonlyArray<BodyNode>,
  exportedName: string,
  exportedDecl: ?DeclarationMatch,
): Array<BodyNode> {
  const sources: Array<BodyNode> = [];

  if (exportedDecl != null) {
    sources.push(exportedDecl.statement);
  }

  // Renamed wrappers (e.g. `memo`-wrapped, or `ScrollViewWrapper` shown as
  // `ScrollView`) carry the doc on the declaration matching the display name.
  const publicName = findDisplayNameAssignment(body, exportedName)?.publicName;
  if (publicName != null && publicName !== exportedName) {
    const publicDecl = findDeclarationByName(body, publicName);
    if (publicDecl != null) {
      sources.push(publicDecl.statement);
    }
  }

  return sources;
}

type DeclarationMatch = {
  statement: BodyNode,
  kind: string,
};

function findDeclarationByName(
  body: ReadonlyArray<BodyNode>,
  name: string,
): ?DeclarationMatch {
  for (const statement of body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' &&
      statement.declaration != null
        ? statement.declaration
        : statement;

    if (
      (declaration.type === 'ClassDeclaration' ||
        declaration.type === 'FunctionDeclaration' ||
        declaration.type === 'ComponentDeclaration') &&
      declaration.id != null &&
      declaration.id.name === name
    ) {
      return {statement, kind: declaration.type};
    }

    // `declare const X` in `.js.flow` declaration files
    if (
      declaration.type === 'DeclareVariable' &&
      declaration.id.name === name
    ) {
      return {statement, kind: declaration.type};
    }

    if (declaration.type === 'VariableDeclaration') {
      for (const declarator of declaration.declarations) {
        if (
          declarator.id.type === 'Identifier' &&
          declarator.id.name === name
        ) {
          return {statement, kind: declaration.type};
        }
      }
    }
  }

  return null;
}

type DisplayNameMatch = {statement: BodyNode, publicName: ?string};

function findDisplayNameAssignment(
  body: ReadonlyArray<BodyNode>,
  name: string,
): ?DisplayNameMatch {
  for (const statement of body) {
    if (
      statement.type === 'ExpressionStatement' &&
      statement.expression.type === 'AssignmentExpression'
    ) {
      const {left, right} = statement.expression;
      if (
        left.type === 'MemberExpression' &&
        left.object.type === 'Identifier' &&
        left.object.name === name &&
        left.property.type === 'Identifier' &&
        left.property.name === 'displayName'
      ) {
        const publicName =
          right.type === 'Literal' && typeof right.value === 'string'
            ? right.value
            : null;
        return {statement, publicName};
      }
    }
  }
  return null;
}

async function reattachDocComments(
  source: ParseResult,
): Promise<TransformASTResult> {
  return transformAST(source, visitors);
}

module.exports = reattachDocComments;
