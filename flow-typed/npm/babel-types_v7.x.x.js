/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @generated
 * See <metro>/scripts/updateBabelTypesFlowTypes.js.
 * @flow strict
 */

declare type BabelNodeBaseComment = {
  value: string;
  start: number;
  end: number;
  loc: BabelNodeSourceLocation;
};

declare type BabelNodeCommentBlock = {
  ...BabelNodeBaseComment;
  type: "CommentBlock";
};

declare type BabelNodeCommentLine ={
  ...BabelNodeBaseComment,
  type: "CommentLine";
};

declare type BabelNodeComment = BabelNodeCommentBlock | BabelNodeCommentLine;

declare type BabelNodeSourceLocation = {
  start: {
    line: number;
    column: number;
  };

  end: {
    line: number;
    column: number;
  };
};


declare type BabelNodeArrayExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ArrayExpression";
  elements?: Array<null | BabelNodeExpression | BabelNodeSpreadElement>;
};

declare type BabelNodeAssignmentExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "AssignmentExpression";
  operator: string;
  left: BabelNodeLVal | BabelNodeOptionalMemberExpression;
  right: BabelNodeExpression;
};

declare type BabelNodeBinaryExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "BinaryExpression";
  operator: "+" | "-" | "/" | "%" | "*" | "**" | "&" | "|" | ">>" | ">>>" | "<<" | "^" | "==" | "===" | "!=" | "!==" | "in" | "instanceof" | ">" | "<" | ">=" | "<=" | "|>";
  left: BabelNodeExpression | BabelNodePrivateName;
  right: BabelNodeExpression;
};

declare type BabelNodeInterpreterDirective = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "InterpreterDirective";
  value: string;
};

declare type BabelNodeDirective = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "Directive";
  value: BabelNodeDirectiveLiteral;
};

declare type BabelNodeDirectiveLiteral = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DirectiveLiteral";
  value: string;
};

declare type BabelNodeBlockStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "BlockStatement";
  body: Array<BabelNodeStatement>;
  directives?: Array<BabelNodeDirective>;
};

declare type BabelNodeBreakStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "BreakStatement";
  label?: BabelNodeIdentifier;
};

declare type BabelNodeCallExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "CallExpression";
  callee: BabelNodeExpression | BabelNodeSuper | BabelNodeV8IntrinsicIdentifier;
  arguments: Array<BabelNodeExpression | BabelNodeSpreadElement | BabelNodeArgumentPlaceholder>;
  optional?: boolean;
  typeArguments?: BabelNodeTypeParameterInstantiation;
  typeParameters?: BabelNodeTSTypeParameterInstantiation;
};

declare type BabelNodeCatchClause = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "CatchClause";
  param?: BabelNodeIdentifier | BabelNodeArrayPattern | BabelNodeObjectPattern;
  body: BabelNodeBlockStatement;
};

declare type BabelNodeConditionalExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ConditionalExpression";
  test: BabelNodeExpression;
  consequent: BabelNodeExpression;
  alternate: BabelNodeExpression;
};

declare type BabelNodeContinueStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ContinueStatement";
  label?: BabelNodeIdentifier;
};

declare type BabelNodeDebuggerStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DebuggerStatement";
};

declare type BabelNodeDoWhileStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DoWhileStatement";
  test: BabelNodeExpression;
  body: BabelNodeStatement;
};

declare type BabelNodeEmptyStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "EmptyStatement";
};

declare type BabelNodeExpressionStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ExpressionStatement";
  expression: BabelNodeExpression;
};

declare type BabelNodeFile = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "File";
  program: BabelNodeProgram;
  comments?: Array<BabelNodeCommentBlock | BabelNodeCommentLine>;
  tokens?: Array<any>;
};

declare type BabelNodeForInStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ForInStatement";
  left: BabelNodeVariableDeclaration | BabelNodeLVal;
  right: BabelNodeExpression;
  body: BabelNodeStatement;
};

declare type BabelNodeForStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ForStatement";
  init?: BabelNodeVariableDeclaration | BabelNodeExpression;
  test?: BabelNodeExpression;
  update?: BabelNodeExpression;
  body: BabelNodeStatement;
};

declare type BabelNodeFunctionDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "FunctionDeclaration";
  id?: BabelNodeIdentifier;
  params: Array<BabelNodeFunctionParameter>;
  body: BabelNodeBlockStatement;
  generator?: boolean;
  async?: boolean;
  declare?: boolean;
  predicate?: BabelNodeDeclaredPredicate | BabelNodeInferredPredicate;
  returnType?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
  typeParameters?: BabelNodeTypeParameterDeclaration | BabelNodeTSTypeParameterDeclaration | BabelNodeNoop;
};

declare type BabelNodeFunctionExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "FunctionExpression";
  id?: BabelNodeIdentifier;
  params: Array<BabelNodeFunctionParameter>;
  body: BabelNodeBlockStatement;
  generator?: boolean;
  async?: boolean;
  predicate?: BabelNodeDeclaredPredicate | BabelNodeInferredPredicate;
  returnType?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
  typeParameters?: BabelNodeTypeParameterDeclaration | BabelNodeTSTypeParameterDeclaration | BabelNodeNoop;
};

declare type BabelNodeIdentifier = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "Identifier";
  name: string;
  decorators?: Array<BabelNodeDecorator>;
  optional?: boolean;
  typeAnnotation?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
};

declare type BabelNodeIfStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "IfStatement";
  test: BabelNodeExpression;
  consequent: BabelNodeStatement;
  alternate?: BabelNodeStatement;
};

declare type BabelNodeLabeledStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "LabeledStatement";
  label: BabelNodeIdentifier;
  body: BabelNodeStatement;
};

declare type BabelNodeStringLiteral = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "StringLiteral";
  value: string;
};

declare type BabelNodeNumericLiteral = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "NumericLiteral";
  value: number;
};

declare type BabelNodeNullLiteral = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "NullLiteral";
};

declare type BabelNodeBooleanLiteral = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "BooleanLiteral";
  value: boolean;
};

declare type BabelNodeRegExpLiteral = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "RegExpLiteral";
  pattern: string;
  flags?: string;
};

declare type BabelNodeLogicalExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "LogicalExpression";
  operator: "||" | "&&" | "??";
  left: BabelNodeExpression;
  right: BabelNodeExpression;
};

declare type BabelNodeMemberExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "MemberExpression";
  object: BabelNodeExpression | BabelNodeSuper;
  property: BabelNodeExpression | BabelNodeIdentifier | BabelNodePrivateName;
  computed?: boolean;
  optional?: boolean;
};

declare type BabelNodeNewExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "NewExpression";
  callee: BabelNodeExpression | BabelNodeSuper | BabelNodeV8IntrinsicIdentifier;
  arguments: Array<BabelNodeExpression | BabelNodeSpreadElement | BabelNodeArgumentPlaceholder>;
  optional?: boolean;
  typeArguments?: BabelNodeTypeParameterInstantiation;
  typeParameters?: BabelNodeTSTypeParameterInstantiation;
};

declare type BabelNodeProgram = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "Program";
  body: Array<BabelNodeStatement>;
  directives?: Array<BabelNodeDirective>;
  sourceType?: "script" | "module";
  interpreter?: BabelNodeInterpreterDirective;
};

declare type BabelNodeObjectExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ObjectExpression";
  properties: Array<BabelNodeObjectMethod | BabelNodeObjectProperty | BabelNodeSpreadElement>;
};

declare type BabelNodeObjectMethod = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ObjectMethod";
  kind?: "method" | "get" | "set";
  key: BabelNodeExpression | BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral;
  params: Array<BabelNodeFunctionParameter>;
  body: BabelNodeBlockStatement;
  computed?: boolean;
  generator?: boolean;
  async?: boolean;
  decorators?: Array<BabelNodeDecorator>;
  returnType?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
  typeParameters?: BabelNodeTypeParameterDeclaration | BabelNodeTSTypeParameterDeclaration | BabelNodeNoop;
};

declare type BabelNodeObjectProperty = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ObjectProperty";
  key: BabelNodeExpression | BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral | BabelNodeDecimalLiteral | BabelNodePrivateName;
  value: BabelNodeExpression | BabelNodePatternLike;
  computed?: boolean;
  shorthand?: boolean;
  decorators?: Array<BabelNodeDecorator>;
};

declare type BabelNodeRestElement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "RestElement";
  argument: BabelNodeIdentifier | BabelNodeArrayPattern | BabelNodeObjectPattern | BabelNodeMemberExpression | BabelNodeTSAsExpression | BabelNodeTSSatisfiesExpression | BabelNodeTSTypeAssertion | BabelNodeTSNonNullExpression | BabelNodeRestElement | BabelNodeAssignmentPattern;
  decorators?: Array<BabelNodeDecorator>;
  optional?: boolean;
  typeAnnotation?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
};

declare type BabelNodeReturnStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ReturnStatement";
  argument?: BabelNodeExpression;
};

declare type BabelNodeSequenceExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "SequenceExpression";
  expressions: Array<BabelNodeExpression>;
};

declare type BabelNodeParenthesizedExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ParenthesizedExpression";
  expression: BabelNodeExpression;
};

declare type BabelNodeSwitchCase = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "SwitchCase";
  test?: BabelNodeExpression;
  consequent: Array<BabelNodeStatement>;
};

declare type BabelNodeSwitchStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "SwitchStatement";
  discriminant: BabelNodeExpression;
  cases: Array<BabelNodeSwitchCase>;
};

declare type BabelNodeThisExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ThisExpression";
};

declare type BabelNodeThrowStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ThrowStatement";
  argument: BabelNodeExpression;
};

declare type BabelNodeTryStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TryStatement";
  block: BabelNodeBlockStatement;
  handler?: BabelNodeCatchClause;
  finalizer?: BabelNodeBlockStatement;
};

declare type BabelNodeUnaryExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "UnaryExpression";
  operator: "void" | "throw" | "delete" | "!" | "+" | "-" | "~" | "typeof";
  argument: BabelNodeExpression;
  prefix?: boolean;
};

declare type BabelNodeUpdateExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "UpdateExpression";
  operator: "++" | "--";
  argument: BabelNodeExpression;
  prefix?: boolean;
};

declare type BabelNodeVariableDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "VariableDeclaration";
  kind: "var" | "let" | "const" | "using" | "await using";
  declarations: Array<BabelNodeVariableDeclarator>;
  declare?: boolean;
};

declare type BabelNodeVariableDeclarator = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "VariableDeclarator";
  id: BabelNodeLVal | BabelNodeVoidPattern;
  init?: BabelNodeExpression;
  definite?: boolean;
};

declare type BabelNodeWhileStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "WhileStatement";
  test: BabelNodeExpression;
  body: BabelNodeStatement;
};

declare type BabelNodeWithStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "WithStatement";
  object: BabelNodeExpression;
  body: BabelNodeStatement;
};

declare type BabelNodeAssignmentPattern = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "AssignmentPattern";
  left: BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeArrayPattern | BabelNodeMemberExpression | BabelNodeTSAsExpression | BabelNodeTSSatisfiesExpression | BabelNodeTSTypeAssertion | BabelNodeTSNonNullExpression;
  right: BabelNodeExpression;
  decorators?: Array<BabelNodeDecorator>;
  optional?: boolean;
  typeAnnotation?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
};

declare type BabelNodeArrayPattern = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ArrayPattern";
  elements: Array<null | BabelNodePatternLike>;
  decorators?: Array<BabelNodeDecorator>;
  optional?: boolean;
  typeAnnotation?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
};

declare type BabelNodeArrowFunctionExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ArrowFunctionExpression";
  params: Array<BabelNodeFunctionParameter>;
  body: BabelNodeBlockStatement | BabelNodeExpression;
  async?: boolean;
  expression: boolean;
  generator?: boolean;
  predicate?: BabelNodeDeclaredPredicate | BabelNodeInferredPredicate;
  returnType?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
  typeParameters?: BabelNodeTypeParameterDeclaration | BabelNodeTSTypeParameterDeclaration | BabelNodeNoop;
};

declare type BabelNodeClassBody = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ClassBody";
  body: Array<BabelNodeClassMethod | BabelNodeClassPrivateMethod | BabelNodeClassProperty | BabelNodeClassPrivateProperty | BabelNodeClassAccessorProperty | BabelNodeTSDeclareMethod | BabelNodeTSIndexSignature | BabelNodeStaticBlock>;
};

declare type BabelNodeClassExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ClassExpression";
  id?: BabelNodeIdentifier;
  superClass?: BabelNodeExpression;
  body: BabelNodeClassBody;
  decorators?: Array<BabelNodeDecorator>;
  implements?: Array<BabelNodeTSExpressionWithTypeArguments | BabelNodeClassImplements>;
  mixins?: BabelNodeInterfaceExtends;
  superTypeParameters?: BabelNodeTypeParameterInstantiation | BabelNodeTSTypeParameterInstantiation;
  typeParameters?: BabelNodeTypeParameterDeclaration | BabelNodeTSTypeParameterDeclaration | BabelNodeNoop;
};

declare type BabelNodeClassDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ClassDeclaration";
  id?: BabelNodeIdentifier;
  superClass?: BabelNodeExpression;
  body: BabelNodeClassBody;
  decorators?: Array<BabelNodeDecorator>;
  abstract?: boolean;
  declare?: boolean;
  implements?: Array<BabelNodeTSExpressionWithTypeArguments | BabelNodeClassImplements>;
  mixins?: BabelNodeInterfaceExtends;
  superTypeParameters?: BabelNodeTypeParameterInstantiation | BabelNodeTSTypeParameterInstantiation;
  typeParameters?: BabelNodeTypeParameterDeclaration | BabelNodeTSTypeParameterDeclaration | BabelNodeNoop;
};

declare type BabelNodeExportAllDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ExportAllDeclaration";
  source: BabelNodeStringLiteral;
  attributes?: Array<BabelNodeImportAttribute>;
  assertions?: Array<BabelNodeImportAttribute>;
  exportKind?: "type" | "value";
};

declare type BabelNodeExportDefaultDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ExportDefaultDeclaration";
  declaration: BabelNodeTSDeclareFunction | BabelNodeFunctionDeclaration | BabelNodeClassDeclaration | BabelNodeExpression;
  exportKind?: "value";
};

declare type BabelNodeExportNamedDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ExportNamedDeclaration";
  declaration?: BabelNodeDeclaration;
  specifiers?: Array<BabelNodeExportSpecifier | BabelNodeExportDefaultSpecifier | BabelNodeExportNamespaceSpecifier>;
  source?: BabelNodeStringLiteral;
  attributes?: Array<BabelNodeImportAttribute>;
  assertions?: Array<BabelNodeImportAttribute>;
  exportKind?: "type" | "value";
};

declare type BabelNodeExportSpecifier = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ExportSpecifier";
  local: BabelNodeIdentifier;
  exported: BabelNodeIdentifier | BabelNodeStringLiteral;
  exportKind?: "type" | "value";
};

declare type BabelNodeForOfStatement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ForOfStatement";
  left: BabelNodeVariableDeclaration | BabelNodeLVal;
  right: BabelNodeExpression;
  body: BabelNodeStatement;
  await?: boolean;
};

declare type BabelNodeImportDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ImportDeclaration";
  specifiers: Array<BabelNodeImportSpecifier | BabelNodeImportDefaultSpecifier | BabelNodeImportNamespaceSpecifier>;
  source: BabelNodeStringLiteral;
  attributes?: Array<BabelNodeImportAttribute>;
  assertions?: Array<BabelNodeImportAttribute>;
  importKind?: "type" | "typeof" | "value";
  module?: boolean;
  phase?: "source" | "defer";
};

declare type BabelNodeImportDefaultSpecifier = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ImportDefaultSpecifier";
  local: BabelNodeIdentifier;
};

declare type BabelNodeImportNamespaceSpecifier = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ImportNamespaceSpecifier";
  local: BabelNodeIdentifier;
};

declare type BabelNodeImportSpecifier = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ImportSpecifier";
  local: BabelNodeIdentifier;
  imported: BabelNodeIdentifier | BabelNodeStringLiteral;
  importKind?: "type" | "typeof" | "value";
};

declare type BabelNodeImportExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ImportExpression";
  source: BabelNodeExpression;
  options?: BabelNodeExpression;
  phase?: "source" | "defer";
};

declare type BabelNodeMetaProperty = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "MetaProperty";
  meta: BabelNodeIdentifier;
  property: BabelNodeIdentifier;
};

declare type BabelNodeClassMethod = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ClassMethod";
  kind?: "get" | "set" | "method" | "constructor";
  key: BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral | BabelNodeExpression;
  params: Array<BabelNodeFunctionParameter | BabelNodeTSParameterProperty>;
  body: BabelNodeBlockStatement;
  computed?: boolean;
  static?: boolean;
  generator?: boolean;
  async?: boolean;
  abstract?: boolean;
  access?: "public" | "private" | "protected";
  accessibility?: "public" | "private" | "protected";
  decorators?: Array<BabelNodeDecorator>;
  optional?: boolean;
  override?: boolean;
  returnType?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
  typeParameters?: BabelNodeTypeParameterDeclaration | BabelNodeTSTypeParameterDeclaration | BabelNodeNoop;
};

declare type BabelNodeObjectPattern = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ObjectPattern";
  properties: Array<BabelNodeRestElement | BabelNodeObjectProperty>;
  decorators?: Array<BabelNodeDecorator>;
  optional?: boolean;
  typeAnnotation?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
};

declare type BabelNodeSpreadElement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "SpreadElement";
  argument: BabelNodeExpression;
};

declare type BabelNodeSuper = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "Super";
};

declare type BabelNodeTaggedTemplateExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TaggedTemplateExpression";
  tag: BabelNodeExpression;
  quasi: BabelNodeTemplateLiteral;
  typeParameters?: BabelNodeTypeParameterInstantiation | BabelNodeTSTypeParameterInstantiation;
};

declare type BabelNodeTemplateElement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TemplateElement";
  value: any;
  tail?: boolean;
};

declare type BabelNodeTemplateLiteral = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TemplateLiteral";
  quasis: Array<BabelNodeTemplateElement>;
  expressions: Array<BabelNodeExpression | BabelNodeTSType>;
};

declare type BabelNodeYieldExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "YieldExpression";
  argument?: BabelNodeExpression;
  delegate?: boolean;
};

declare type BabelNodeAwaitExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "AwaitExpression";
  argument: BabelNodeExpression;
};

declare type BabelNodeImport = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "Import";
};

declare type BabelNodeBigIntLiteral = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "BigIntLiteral";
  value: string;
};

declare type BabelNodeExportNamespaceSpecifier = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ExportNamespaceSpecifier";
  exported: BabelNodeIdentifier;
};

declare type BabelNodeOptionalMemberExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "OptionalMemberExpression";
  object: BabelNodeExpression;
  property: BabelNodeExpression | BabelNodeIdentifier;
  computed?: boolean;
  optional: boolean;
};

declare type BabelNodeOptionalCallExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "OptionalCallExpression";
  callee: BabelNodeExpression;
  arguments: Array<BabelNodeExpression | BabelNodeSpreadElement | BabelNodeArgumentPlaceholder>;
  optional: boolean;
  typeArguments?: BabelNodeTypeParameterInstantiation;
  typeParameters?: BabelNodeTSTypeParameterInstantiation;
};

declare type BabelNodeClassProperty = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ClassProperty";
  key: BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral | BabelNodeExpression;
  value?: BabelNodeExpression;
  typeAnnotation?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
  decorators?: Array<BabelNodeDecorator>;
  computed?: boolean;
  static?: boolean;
  abstract?: boolean;
  accessibility?: "public" | "private" | "protected";
  declare?: boolean;
  definite?: boolean;
  optional?: boolean;
  override?: boolean;
  readonly?: boolean;
  variance?: BabelNodeVariance;
};

declare type BabelNodeClassAccessorProperty = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ClassAccessorProperty";
  key: BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral | BabelNodeExpression | BabelNodePrivateName;
  value?: BabelNodeExpression;
  typeAnnotation?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
  decorators?: Array<BabelNodeDecorator>;
  computed?: boolean;
  static?: boolean;
  abstract?: boolean;
  accessibility?: "public" | "private" | "protected";
  declare?: boolean;
  definite?: boolean;
  optional?: boolean;
  override?: boolean;
  readonly?: boolean;
  variance?: BabelNodeVariance;
};

declare type BabelNodeClassPrivateProperty = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ClassPrivateProperty";
  key: BabelNodePrivateName;
  value?: BabelNodeExpression;
  decorators?: Array<BabelNodeDecorator>;
  static?: boolean;
  definite?: boolean;
  optional?: boolean;
  readonly?: boolean;
  typeAnnotation?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
  variance?: BabelNodeVariance;
};

declare type BabelNodeClassPrivateMethod = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ClassPrivateMethod";
  kind?: "get" | "set" | "method";
  key: BabelNodePrivateName;
  params: Array<BabelNodeFunctionParameter | BabelNodeTSParameterProperty>;
  body: BabelNodeBlockStatement;
  static?: boolean;
  abstract?: boolean;
  access?: "public" | "private" | "protected";
  accessibility?: "public" | "private" | "protected";
  async?: boolean;
  computed?: boolean;
  decorators?: Array<BabelNodeDecorator>;
  generator?: boolean;
  optional?: boolean;
  override?: boolean;
  returnType?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
  typeParameters?: BabelNodeTypeParameterDeclaration | BabelNodeTSTypeParameterDeclaration | BabelNodeNoop;
};

declare type BabelNodePrivateName = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "PrivateName";
  id: BabelNodeIdentifier;
};

declare type BabelNodeStaticBlock = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "StaticBlock";
  body: Array<BabelNodeStatement>;
};

declare type BabelNodeImportAttribute = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ImportAttribute";
  key: BabelNodeIdentifier | BabelNodeStringLiteral;
  value: BabelNodeStringLiteral;
};

declare type BabelNodeAnyTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "AnyTypeAnnotation";
};

declare type BabelNodeArrayTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ArrayTypeAnnotation";
  elementType: BabelNodeFlowType;
};

declare type BabelNodeBooleanTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "BooleanTypeAnnotation";
};

declare type BabelNodeBooleanLiteralTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "BooleanLiteralTypeAnnotation";
  value: boolean;
};

declare type BabelNodeNullLiteralTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "NullLiteralTypeAnnotation";
};

declare type BabelNodeClassImplements = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ClassImplements";
  id: BabelNodeIdentifier;
  typeParameters?: BabelNodeTypeParameterInstantiation;
};

declare type BabelNodeDeclareClass = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DeclareClass";
  id: BabelNodeIdentifier;
  typeParameters?: BabelNodeTypeParameterDeclaration;
  extends?: Array<BabelNodeInterfaceExtends>;
  body: BabelNodeObjectTypeAnnotation;
  implements?: Array<BabelNodeClassImplements>;
  mixins?: Array<BabelNodeInterfaceExtends>;
};

declare type BabelNodeDeclareFunction = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DeclareFunction";
  id: BabelNodeIdentifier;
  predicate?: BabelNodeDeclaredPredicate;
};

declare type BabelNodeDeclareInterface = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DeclareInterface";
  id: BabelNodeIdentifier;
  typeParameters?: BabelNodeTypeParameterDeclaration;
  extends?: Array<BabelNodeInterfaceExtends>;
  body: BabelNodeObjectTypeAnnotation;
};

declare type BabelNodeDeclareModule = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DeclareModule";
  id: BabelNodeIdentifier | BabelNodeStringLiteral;
  body: BabelNodeBlockStatement;
  kind?: "CommonJS" | "ES";
};

declare type BabelNodeDeclareModuleExports = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DeclareModuleExports";
  typeAnnotation: BabelNodeTypeAnnotation;
};

declare type BabelNodeDeclareTypeAlias = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DeclareTypeAlias";
  id: BabelNodeIdentifier;
  typeParameters?: BabelNodeTypeParameterDeclaration;
  right: BabelNodeFlowType;
};

declare type BabelNodeDeclareOpaqueType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DeclareOpaqueType";
  id: BabelNodeIdentifier;
  typeParameters?: BabelNodeTypeParameterDeclaration;
  supertype?: BabelNodeFlowType;
  impltype?: BabelNodeFlowType;
};

declare type BabelNodeDeclareVariable = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DeclareVariable";
  id: BabelNodeIdentifier;
};

declare type BabelNodeDeclareExportDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DeclareExportDeclaration";
  declaration?: BabelNodeFlow;
  specifiers?: Array<BabelNodeExportSpecifier | BabelNodeExportNamespaceSpecifier>;
  source?: BabelNodeStringLiteral;
  attributes?: Array<BabelNodeImportAttribute>;
  assertions?: Array<BabelNodeImportAttribute>;
  default?: boolean;
};

declare type BabelNodeDeclareExportAllDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DeclareExportAllDeclaration";
  source: BabelNodeStringLiteral;
  attributes?: Array<BabelNodeImportAttribute>;
  assertions?: Array<BabelNodeImportAttribute>;
  exportKind?: "type" | "value";
};

declare type BabelNodeDeclaredPredicate = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DeclaredPredicate";
  value: BabelNodeFlow;
};

declare type BabelNodeExistsTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ExistsTypeAnnotation";
};

declare type BabelNodeFunctionTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "FunctionTypeAnnotation";
  typeParameters?: BabelNodeTypeParameterDeclaration;
  params: Array<BabelNodeFunctionTypeParam>;
  rest?: BabelNodeFunctionTypeParam;
  returnType: BabelNodeFlowType;
  this?: BabelNodeFunctionTypeParam;
};

declare type BabelNodeFunctionTypeParam = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "FunctionTypeParam";
  name?: BabelNodeIdentifier;
  typeAnnotation: BabelNodeFlowType;
  optional?: boolean;
};

declare type BabelNodeGenericTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "GenericTypeAnnotation";
  id: BabelNodeIdentifier | BabelNodeQualifiedTypeIdentifier;
  typeParameters?: BabelNodeTypeParameterInstantiation;
};

declare type BabelNodeInferredPredicate = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "InferredPredicate";
};

declare type BabelNodeInterfaceExtends = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "InterfaceExtends";
  id: BabelNodeIdentifier | BabelNodeQualifiedTypeIdentifier;
  typeParameters?: BabelNodeTypeParameterInstantiation;
};

declare type BabelNodeInterfaceDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "InterfaceDeclaration";
  id: BabelNodeIdentifier;
  typeParameters?: BabelNodeTypeParameterDeclaration;
  extends?: Array<BabelNodeInterfaceExtends>;
  body: BabelNodeObjectTypeAnnotation;
};

declare type BabelNodeInterfaceTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "InterfaceTypeAnnotation";
  extends?: Array<BabelNodeInterfaceExtends>;
  body: BabelNodeObjectTypeAnnotation;
};

declare type BabelNodeIntersectionTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "IntersectionTypeAnnotation";
  types: Array<BabelNodeFlowType>;
};

declare type BabelNodeMixedTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "MixedTypeAnnotation";
};

declare type BabelNodeEmptyTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "EmptyTypeAnnotation";
};

declare type BabelNodeNullableTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "NullableTypeAnnotation";
  typeAnnotation: BabelNodeFlowType;
};

declare type BabelNodeNumberLiteralTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "NumberLiteralTypeAnnotation";
  value: number;
};

declare type BabelNodeNumberTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "NumberTypeAnnotation";
};

declare type BabelNodeObjectTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ObjectTypeAnnotation";
  properties: Array<BabelNodeObjectTypeProperty | BabelNodeObjectTypeSpreadProperty>;
  indexers?: Array<BabelNodeObjectTypeIndexer>;
  callProperties?: Array<BabelNodeObjectTypeCallProperty>;
  internalSlots?: Array<BabelNodeObjectTypeInternalSlot>;
  exact?: boolean;
  inexact?: boolean;
};

declare type BabelNodeObjectTypeInternalSlot = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ObjectTypeInternalSlot";
  id: BabelNodeIdentifier;
  value: BabelNodeFlowType;
  optional: boolean;
  static: boolean;
  method: boolean;
};

declare type BabelNodeObjectTypeCallProperty = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ObjectTypeCallProperty";
  value: BabelNodeFlowType;
  static: boolean;
};

declare type BabelNodeObjectTypeIndexer = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ObjectTypeIndexer";
  id?: BabelNodeIdentifier;
  key: BabelNodeFlowType;
  value: BabelNodeFlowType;
  variance?: BabelNodeVariance;
  static: boolean;
};

declare type BabelNodeObjectTypeProperty = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ObjectTypeProperty";
  key: BabelNodeIdentifier | BabelNodeStringLiteral;
  value: BabelNodeFlowType;
  variance?: BabelNodeVariance;
  kind: "init" | "get" | "set";
  method: boolean;
  optional: boolean;
  proto: boolean;
  static: boolean;
};

declare type BabelNodeObjectTypeSpreadProperty = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ObjectTypeSpreadProperty";
  argument: BabelNodeFlowType;
};

declare type BabelNodeOpaqueType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "OpaqueType";
  id: BabelNodeIdentifier;
  typeParameters?: BabelNodeTypeParameterDeclaration;
  supertype?: BabelNodeFlowType;
  impltype: BabelNodeFlowType;
};

declare type BabelNodeQualifiedTypeIdentifier = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "QualifiedTypeIdentifier";
  id: BabelNodeIdentifier;
  qualification: BabelNodeIdentifier | BabelNodeQualifiedTypeIdentifier;
};

declare type BabelNodeStringLiteralTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "StringLiteralTypeAnnotation";
  value: string;
};

declare type BabelNodeStringTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "StringTypeAnnotation";
};

declare type BabelNodeSymbolTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "SymbolTypeAnnotation";
};

declare type BabelNodeThisTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ThisTypeAnnotation";
};

declare type BabelNodeTupleTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TupleTypeAnnotation";
  types: Array<BabelNodeFlowType>;
};

declare type BabelNodeTypeofTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TypeofTypeAnnotation";
  argument: BabelNodeFlowType;
};

declare type BabelNodeTypeAlias = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TypeAlias";
  id: BabelNodeIdentifier;
  typeParameters?: BabelNodeTypeParameterDeclaration;
  right: BabelNodeFlowType;
};

declare type BabelNodeTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TypeAnnotation";
  typeAnnotation: BabelNodeFlowType;
};

declare type BabelNodeTypeCastExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TypeCastExpression";
  expression: BabelNodeExpression;
  typeAnnotation: BabelNodeTypeAnnotation;
};

declare type BabelNodeTypeParameter = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TypeParameter";
  bound?: BabelNodeTypeAnnotation;
  default?: BabelNodeFlowType;
  variance?: BabelNodeVariance;
  name: string;
};

declare type BabelNodeTypeParameterDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TypeParameterDeclaration";
  params: Array<BabelNodeTypeParameter>;
};

declare type BabelNodeTypeParameterInstantiation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TypeParameterInstantiation";
  params: Array<BabelNodeFlowType>;
};

declare type BabelNodeUnionTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "UnionTypeAnnotation";
  types: Array<BabelNodeFlowType>;
};

declare type BabelNodeVariance = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "Variance";
  kind: "minus" | "plus";
};

declare type BabelNodeVoidTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "VoidTypeAnnotation";
};

declare type BabelNodeEnumDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "EnumDeclaration";
  id: BabelNodeIdentifier;
  body: BabelNodeEnumBooleanBody | BabelNodeEnumNumberBody | BabelNodeEnumStringBody | BabelNodeEnumSymbolBody;
};

declare type BabelNodeEnumBooleanBody = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "EnumBooleanBody";
  members: Array<BabelNodeEnumBooleanMember>;
  explicitType: boolean;
  hasUnknownMembers: boolean;
};

declare type BabelNodeEnumNumberBody = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "EnumNumberBody";
  members: Array<BabelNodeEnumNumberMember>;
  explicitType: boolean;
  hasUnknownMembers: boolean;
};

declare type BabelNodeEnumStringBody = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "EnumStringBody";
  members: Array<BabelNodeEnumStringMember | BabelNodeEnumDefaultedMember>;
  explicitType: boolean;
  hasUnknownMembers: boolean;
};

declare type BabelNodeEnumSymbolBody = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "EnumSymbolBody";
  members: Array<BabelNodeEnumDefaultedMember>;
  hasUnknownMembers: boolean;
};

declare type BabelNodeEnumBooleanMember = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "EnumBooleanMember";
  id: BabelNodeIdentifier;
  init: BabelNodeBooleanLiteral;
};

declare type BabelNodeEnumNumberMember = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "EnumNumberMember";
  id: BabelNodeIdentifier;
  init: BabelNodeNumericLiteral;
};

declare type BabelNodeEnumStringMember = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "EnumStringMember";
  id: BabelNodeIdentifier;
  init: BabelNodeStringLiteral;
};

declare type BabelNodeEnumDefaultedMember = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "EnumDefaultedMember";
  id: BabelNodeIdentifier;
};

declare type BabelNodeIndexedAccessType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "IndexedAccessType";
  objectType: BabelNodeFlowType;
  indexType: BabelNodeFlowType;
};

declare type BabelNodeOptionalIndexedAccessType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "OptionalIndexedAccessType";
  objectType: BabelNodeFlowType;
  indexType: BabelNodeFlowType;
  optional: boolean;
};

declare type BabelNodeJSXAttribute = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXAttribute";
  name: BabelNodeJSXIdentifier | BabelNodeJSXNamespacedName;
  value?: BabelNodeJSXElement | BabelNodeJSXFragment | BabelNodeStringLiteral | BabelNodeJSXExpressionContainer;
};

declare type BabelNodeJSXClosingElement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXClosingElement";
  name: BabelNodeJSXIdentifier | BabelNodeJSXMemberExpression | BabelNodeJSXNamespacedName;
};

declare type BabelNodeJSXElement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXElement";
  openingElement: BabelNodeJSXOpeningElement;
  closingElement?: BabelNodeJSXClosingElement;
  children: Array<BabelNodeJSXText | BabelNodeJSXExpressionContainer | BabelNodeJSXSpreadChild | BabelNodeJSXElement | BabelNodeJSXFragment>;
  selfClosing?: boolean;
};

declare type BabelNodeJSXEmptyExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXEmptyExpression";
};

declare type BabelNodeJSXExpressionContainer = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXExpressionContainer";
  expression: BabelNodeExpression | BabelNodeJSXEmptyExpression;
};

declare type BabelNodeJSXSpreadChild = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXSpreadChild";
  expression: BabelNodeExpression;
};

declare type BabelNodeJSXIdentifier = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXIdentifier";
  name: string;
};

declare type BabelNodeJSXMemberExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXMemberExpression";
  object: BabelNodeJSXMemberExpression | BabelNodeJSXIdentifier;
  property: BabelNodeJSXIdentifier;
};

declare type BabelNodeJSXNamespacedName = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXNamespacedName";
  namespace: BabelNodeJSXIdentifier;
  name: BabelNodeJSXIdentifier;
};

declare type BabelNodeJSXOpeningElement = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXOpeningElement";
  name: BabelNodeJSXIdentifier | BabelNodeJSXMemberExpression | BabelNodeJSXNamespacedName;
  attributes: Array<BabelNodeJSXAttribute | BabelNodeJSXSpreadAttribute>;
  selfClosing?: boolean;
  typeArguments?: BabelNodeTypeParameterInstantiation;
  typeParameters?: BabelNodeTSTypeParameterInstantiation;
};

declare type BabelNodeJSXSpreadAttribute = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXSpreadAttribute";
  argument: BabelNodeExpression;
};

declare type BabelNodeJSXText = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXText";
  value: string;
};

declare type BabelNodeJSXFragment = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXFragment";
  openingFragment: BabelNodeJSXOpeningFragment;
  closingFragment: BabelNodeJSXClosingFragment;
  children: Array<BabelNodeJSXText | BabelNodeJSXExpressionContainer | BabelNodeJSXSpreadChild | BabelNodeJSXElement | BabelNodeJSXFragment>;
};

declare type BabelNodeJSXOpeningFragment = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXOpeningFragment";
};

declare type BabelNodeJSXClosingFragment = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "JSXClosingFragment";
};

declare type BabelNodeNoop = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "Noop";
};

declare type BabelNodePlaceholder = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "Placeholder";
  expectedNode: "Identifier" | "StringLiteral" | "Expression" | "Statement" | "Declaration" | "BlockStatement" | "ClassBody" | "Pattern";
  name: BabelNodeIdentifier;
  decorators?: Array<BabelNodeDecorator>;
  optional?: boolean;
  typeAnnotation?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop;
};

declare type BabelNodeV8IntrinsicIdentifier = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "V8IntrinsicIdentifier";
  name: string;
};

declare type BabelNodeArgumentPlaceholder = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ArgumentPlaceholder";
};

declare type BabelNodeBindExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "BindExpression";
  object: BabelNodeExpression;
  callee: BabelNodeExpression;
};

declare type BabelNodeDecorator = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "Decorator";
  expression: BabelNodeExpression;
};

declare type BabelNodeDoExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DoExpression";
  body: BabelNodeBlockStatement;
  async?: boolean;
};

declare type BabelNodeExportDefaultSpecifier = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ExportDefaultSpecifier";
  exported: BabelNodeIdentifier;
};

declare type BabelNodeRecordExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "RecordExpression";
  properties: Array<BabelNodeObjectProperty | BabelNodeSpreadElement>;
};

declare type BabelNodeTupleExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TupleExpression";
  elements?: Array<BabelNodeExpression | BabelNodeSpreadElement>;
};

declare type BabelNodeDecimalLiteral = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "DecimalLiteral";
  value: string;
};

declare type BabelNodeModuleExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "ModuleExpression";
  body: BabelNodeProgram;
};

declare type BabelNodeTopicReference = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TopicReference";
};

declare type BabelNodePipelineTopicExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "PipelineTopicExpression";
  expression: BabelNodeExpression;
};

declare type BabelNodePipelineBareFunction = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "PipelineBareFunction";
  callee: BabelNodeExpression;
};

declare type BabelNodePipelinePrimaryTopicReference = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "PipelinePrimaryTopicReference";
};

declare type BabelNodeVoidPattern = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "VoidPattern";
};

declare type BabelNodeTSParameterProperty = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSParameterProperty";
  parameter: BabelNodeIdentifier | BabelNodeAssignmentPattern;
  accessibility?: "public" | "private" | "protected";
  decorators?: Array<BabelNodeDecorator>;
  override?: boolean;
  readonly?: boolean;
};

declare type BabelNodeTSDeclareFunction = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSDeclareFunction";
  id?: BabelNodeIdentifier;
  typeParameters?: BabelNodeTSTypeParameterDeclaration | BabelNodeNoop;
  params: Array<BabelNodeFunctionParameter>;
  returnType?: BabelNodeTSTypeAnnotation | BabelNodeNoop;
  async?: boolean;
  declare?: boolean;
  generator?: boolean;
};

declare type BabelNodeTSDeclareMethod = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSDeclareMethod";
  decorators?: Array<BabelNodeDecorator>;
  key: BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral | BabelNodeExpression;
  typeParameters?: BabelNodeTSTypeParameterDeclaration | BabelNodeNoop;
  params: Array<BabelNodeFunctionParameter | BabelNodeTSParameterProperty>;
  returnType?: BabelNodeTSTypeAnnotation | BabelNodeNoop;
  abstract?: boolean;
  access?: "public" | "private" | "protected";
  accessibility?: "public" | "private" | "protected";
  async?: boolean;
  computed?: boolean;
  generator?: boolean;
  kind?: "get" | "set" | "method" | "constructor";
  optional?: boolean;
  override?: boolean;
  static?: boolean;
};

declare type BabelNodeTSQualifiedName = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSQualifiedName";
  left: BabelNodeTSEntityName;
  right: BabelNodeIdentifier;
};

declare type BabelNodeTSCallSignatureDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSCallSignatureDeclaration";
  typeParameters?: BabelNodeTSTypeParameterDeclaration;
  parameters: Array<BabelNodeArrayPattern | BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeRestElement>;
  typeAnnotation?: BabelNodeTSTypeAnnotation;
};

declare type BabelNodeTSConstructSignatureDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSConstructSignatureDeclaration";
  typeParameters?: BabelNodeTSTypeParameterDeclaration;
  parameters: Array<BabelNodeArrayPattern | BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeRestElement>;
  typeAnnotation?: BabelNodeTSTypeAnnotation;
};

declare type BabelNodeTSPropertySignature = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSPropertySignature";
  key: BabelNodeExpression;
  typeAnnotation?: BabelNodeTSTypeAnnotation;
  computed?: boolean;
  kind?: "get" | "set";
  optional?: boolean;
  readonly?: boolean;
};

declare type BabelNodeTSMethodSignature = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSMethodSignature";
  key: BabelNodeExpression;
  typeParameters?: BabelNodeTSTypeParameterDeclaration;
  parameters: Array<BabelNodeArrayPattern | BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeRestElement>;
  typeAnnotation?: BabelNodeTSTypeAnnotation;
  computed?: boolean;
  kind: "method" | "get" | "set";
  optional?: boolean;
};

declare type BabelNodeTSIndexSignature = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSIndexSignature";
  parameters: Array<BabelNodeIdentifier>;
  typeAnnotation?: BabelNodeTSTypeAnnotation;
  readonly?: boolean;
  static?: boolean;
};

declare type BabelNodeTSAnyKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSAnyKeyword";
};

declare type BabelNodeTSBooleanKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSBooleanKeyword";
};

declare type BabelNodeTSBigIntKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSBigIntKeyword";
};

declare type BabelNodeTSIntrinsicKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSIntrinsicKeyword";
};

declare type BabelNodeTSNeverKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSNeverKeyword";
};

declare type BabelNodeTSNullKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSNullKeyword";
};

declare type BabelNodeTSNumberKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSNumberKeyword";
};

declare type BabelNodeTSObjectKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSObjectKeyword";
};

declare type BabelNodeTSStringKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSStringKeyword";
};

declare type BabelNodeTSSymbolKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSSymbolKeyword";
};

declare type BabelNodeTSUndefinedKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSUndefinedKeyword";
};

declare type BabelNodeTSUnknownKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSUnknownKeyword";
};

declare type BabelNodeTSVoidKeyword = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSVoidKeyword";
};

declare type BabelNodeTSThisType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSThisType";
};

declare type BabelNodeTSFunctionType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSFunctionType";
  typeParameters?: BabelNodeTSTypeParameterDeclaration;
  parameters: Array<BabelNodeArrayPattern | BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeRestElement>;
  typeAnnotation?: BabelNodeTSTypeAnnotation;
};

declare type BabelNodeTSConstructorType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSConstructorType";
  typeParameters?: BabelNodeTSTypeParameterDeclaration;
  parameters: Array<BabelNodeArrayPattern | BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeRestElement>;
  typeAnnotation?: BabelNodeTSTypeAnnotation;
  abstract?: boolean;
};

declare type BabelNodeTSTypeReference = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTypeReference";
  typeName: BabelNodeTSEntityName;
  typeParameters?: BabelNodeTSTypeParameterInstantiation;
};

declare type BabelNodeTSTypePredicate = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTypePredicate";
  parameterName: BabelNodeIdentifier | BabelNodeTSThisType;
  typeAnnotation?: BabelNodeTSTypeAnnotation;
  asserts?: boolean;
};

declare type BabelNodeTSTypeQuery = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTypeQuery";
  exprName: BabelNodeTSEntityName | BabelNodeTSImportType;
  typeParameters?: BabelNodeTSTypeParameterInstantiation;
};

declare type BabelNodeTSTypeLiteral = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTypeLiteral";
  members: Array<BabelNodeTSTypeElement>;
};

declare type BabelNodeTSArrayType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSArrayType";
  elementType: BabelNodeTSType;
};

declare type BabelNodeTSTupleType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTupleType";
  elementTypes: Array<BabelNodeTSType | BabelNodeTSNamedTupleMember>;
};

declare type BabelNodeTSOptionalType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSOptionalType";
  typeAnnotation: BabelNodeTSType;
};

declare type BabelNodeTSRestType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSRestType";
  typeAnnotation: BabelNodeTSType;
};

declare type BabelNodeTSNamedTupleMember = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSNamedTupleMember";
  label: BabelNodeIdentifier;
  elementType: BabelNodeTSType;
  optional?: boolean;
};

declare type BabelNodeTSUnionType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSUnionType";
  types: Array<BabelNodeTSType>;
};

declare type BabelNodeTSIntersectionType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSIntersectionType";
  types: Array<BabelNodeTSType>;
};

declare type BabelNodeTSConditionalType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSConditionalType";
  checkType: BabelNodeTSType;
  extendsType: BabelNodeTSType;
  trueType: BabelNodeTSType;
  falseType: BabelNodeTSType;
};

declare type BabelNodeTSInferType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSInferType";
  typeParameter: BabelNodeTSTypeParameter;
};

declare type BabelNodeTSParenthesizedType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSParenthesizedType";
  typeAnnotation: BabelNodeTSType;
};

declare type BabelNodeTSTypeOperator = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTypeOperator";
  typeAnnotation: BabelNodeTSType;
  operator?: string;
};

declare type BabelNodeTSIndexedAccessType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSIndexedAccessType";
  objectType: BabelNodeTSType;
  indexType: BabelNodeTSType;
};

declare type BabelNodeTSMappedType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSMappedType";
  typeParameter: BabelNodeTSTypeParameter;
  typeAnnotation?: BabelNodeTSType;
  nameType?: BabelNodeTSType;
  optional?: true | false | "+" | "-";
  readonly?: true | false | "+" | "-";
};

declare type BabelNodeTSTemplateLiteralType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTemplateLiteralType";
  quasis: Array<BabelNodeTemplateElement>;
  types: Array<BabelNodeTSType>;
};

declare type BabelNodeTSLiteralType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSLiteralType";
  literal: BabelNodeNumericLiteral | BabelNodeStringLiteral | BabelNodeBooleanLiteral | BabelNodeBigIntLiteral | BabelNodeTemplateLiteral | BabelNodeUnaryExpression;
};

declare type BabelNodeTSExpressionWithTypeArguments = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSExpressionWithTypeArguments";
  expression: BabelNodeTSEntityName;
  typeParameters?: BabelNodeTSTypeParameterInstantiation;
};

declare type BabelNodeTSInterfaceDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSInterfaceDeclaration";
  id: BabelNodeIdentifier;
  typeParameters?: BabelNodeTSTypeParameterDeclaration;
  extends?: Array<BabelNodeTSExpressionWithTypeArguments>;
  body: BabelNodeTSInterfaceBody;
  declare?: boolean;
};

declare type BabelNodeTSInterfaceBody = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSInterfaceBody";
  body: Array<BabelNodeTSTypeElement>;
};

declare type BabelNodeTSTypeAliasDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTypeAliasDeclaration";
  id: BabelNodeIdentifier;
  typeParameters?: BabelNodeTSTypeParameterDeclaration;
  typeAnnotation: BabelNodeTSType;
  declare?: boolean;
};

declare type BabelNodeTSInstantiationExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSInstantiationExpression";
  expression: BabelNodeExpression;
  typeParameters?: BabelNodeTSTypeParameterInstantiation;
};

declare type BabelNodeTSAsExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSAsExpression";
  expression: BabelNodeExpression;
  typeAnnotation: BabelNodeTSType;
};

declare type BabelNodeTSSatisfiesExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSSatisfiesExpression";
  expression: BabelNodeExpression;
  typeAnnotation: BabelNodeTSType;
};

declare type BabelNodeTSTypeAssertion = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTypeAssertion";
  typeAnnotation: BabelNodeTSType;
  expression: BabelNodeExpression;
};

declare type BabelNodeTSEnumBody = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSEnumBody";
  members: Array<BabelNodeTSEnumMember>;
};

declare type BabelNodeTSEnumDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSEnumDeclaration";
  id: BabelNodeIdentifier;
  members: Array<BabelNodeTSEnumMember>;
  body?: BabelNodeTSEnumBody;
  const?: boolean;
  declare?: boolean;
  initializer?: BabelNodeExpression;
};

declare type BabelNodeTSEnumMember = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSEnumMember";
  id: BabelNodeIdentifier | BabelNodeStringLiteral;
  initializer?: BabelNodeExpression;
};

declare type BabelNodeTSModuleDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSModuleDeclaration";
  id: BabelNodeIdentifier | BabelNodeStringLiteral;
  body: BabelNodeTSModuleBlock | BabelNodeTSModuleDeclaration;
  declare?: boolean;
  global?: boolean;
  kind: "global" | "module" | "namespace";
};

declare type BabelNodeTSModuleBlock = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSModuleBlock";
  body: Array<BabelNodeStatement>;
};

declare type BabelNodeTSImportType = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSImportType";
  argument: BabelNodeStringLiteral;
  qualifier?: BabelNodeTSEntityName;
  typeParameters?: BabelNodeTSTypeParameterInstantiation;
  options?: BabelNodeObjectExpression;
};

declare type BabelNodeTSImportEqualsDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSImportEqualsDeclaration";
  id: BabelNodeIdentifier;
  moduleReference: BabelNodeTSEntityName | BabelNodeTSExternalModuleReference;
  importKind?: "type" | "value";
  isExport: boolean;
};

declare type BabelNodeTSExternalModuleReference = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSExternalModuleReference";
  expression: BabelNodeStringLiteral;
};

declare type BabelNodeTSNonNullExpression = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSNonNullExpression";
  expression: BabelNodeExpression;
};

declare type BabelNodeTSExportAssignment = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSExportAssignment";
  expression: BabelNodeExpression;
};

declare type BabelNodeTSNamespaceExportDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSNamespaceExportDeclaration";
  id: BabelNodeIdentifier;
};

declare type BabelNodeTSTypeAnnotation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTypeAnnotation";
  typeAnnotation: BabelNodeTSType;
};

declare type BabelNodeTSTypeParameterInstantiation = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTypeParameterInstantiation";
  params: Array<BabelNodeTSType>;
};

declare type BabelNodeTSTypeParameterDeclaration = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTypeParameterDeclaration";
  params: Array<BabelNodeTSTypeParameter>;
};

declare type BabelNodeTSTypeParameter = {
  leadingComments?: Array<BabelNodeComment>;
  innerComments?: Array<BabelNodeComment>;
  trailingComments?: Array<BabelNodeComment>;
  start: ?number;
  end: ?number;
  loc: ?BabelNodeSourceLocation,
  type: "TSTypeParameter";
  constraint?: BabelNodeTSType;
  default?: BabelNodeTSType;
  name: string;
  const?: boolean;
  in?: boolean;
  out?: boolean;
};

declare type BabelNode = BabelNodeArrayExpression | BabelNodeAssignmentExpression | BabelNodeBinaryExpression | BabelNodeInterpreterDirective | BabelNodeDirective | BabelNodeDirectiveLiteral | BabelNodeBlockStatement | BabelNodeBreakStatement | BabelNodeCallExpression | BabelNodeCatchClause | BabelNodeConditionalExpression | BabelNodeContinueStatement | BabelNodeDebuggerStatement | BabelNodeDoWhileStatement | BabelNodeEmptyStatement | BabelNodeExpressionStatement | BabelNodeFile | BabelNodeForInStatement | BabelNodeForStatement | BabelNodeFunctionDeclaration | BabelNodeFunctionExpression | BabelNodeIdentifier | BabelNodeIfStatement | BabelNodeLabeledStatement | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeNullLiteral | BabelNodeBooleanLiteral | BabelNodeRegExpLiteral | BabelNodeLogicalExpression | BabelNodeMemberExpression | BabelNodeNewExpression | BabelNodeProgram | BabelNodeObjectExpression | BabelNodeObjectMethod | BabelNodeObjectProperty | BabelNodeRestElement | BabelNodeReturnStatement | BabelNodeSequenceExpression | BabelNodeParenthesizedExpression | BabelNodeSwitchCase | BabelNodeSwitchStatement | BabelNodeThisExpression | BabelNodeThrowStatement | BabelNodeTryStatement | BabelNodeUnaryExpression | BabelNodeUpdateExpression | BabelNodeVariableDeclaration | BabelNodeVariableDeclarator | BabelNodeWhileStatement | BabelNodeWithStatement | BabelNodeAssignmentPattern | BabelNodeArrayPattern | BabelNodeArrowFunctionExpression | BabelNodeClassBody | BabelNodeClassExpression | BabelNodeClassDeclaration | BabelNodeExportAllDeclaration | BabelNodeExportDefaultDeclaration | BabelNodeExportNamedDeclaration | BabelNodeExportSpecifier | BabelNodeForOfStatement | BabelNodeImportDeclaration | BabelNodeImportDefaultSpecifier | BabelNodeImportNamespaceSpecifier | BabelNodeImportSpecifier | BabelNodeImportExpression | BabelNodeMetaProperty | BabelNodeClassMethod | BabelNodeObjectPattern | BabelNodeSpreadElement | BabelNodeSuper | BabelNodeTaggedTemplateExpression | BabelNodeTemplateElement | BabelNodeTemplateLiteral | BabelNodeYieldExpression | BabelNodeAwaitExpression | BabelNodeImport | BabelNodeBigIntLiteral | BabelNodeExportNamespaceSpecifier | BabelNodeOptionalMemberExpression | BabelNodeOptionalCallExpression | BabelNodeClassProperty | BabelNodeClassAccessorProperty | BabelNodeClassPrivateProperty | BabelNodeClassPrivateMethod | BabelNodePrivateName | BabelNodeStaticBlock | BabelNodeImportAttribute | BabelNodeAnyTypeAnnotation | BabelNodeArrayTypeAnnotation | BabelNodeBooleanTypeAnnotation | BabelNodeBooleanLiteralTypeAnnotation | BabelNodeNullLiteralTypeAnnotation | BabelNodeClassImplements | BabelNodeDeclareClass | BabelNodeDeclareFunction | BabelNodeDeclareInterface | BabelNodeDeclareModule | BabelNodeDeclareModuleExports | BabelNodeDeclareTypeAlias | BabelNodeDeclareOpaqueType | BabelNodeDeclareVariable | BabelNodeDeclareExportDeclaration | BabelNodeDeclareExportAllDeclaration | BabelNodeDeclaredPredicate | BabelNodeExistsTypeAnnotation | BabelNodeFunctionTypeAnnotation | BabelNodeFunctionTypeParam | BabelNodeGenericTypeAnnotation | BabelNodeInferredPredicate | BabelNodeInterfaceExtends | BabelNodeInterfaceDeclaration | BabelNodeInterfaceTypeAnnotation | BabelNodeIntersectionTypeAnnotation | BabelNodeMixedTypeAnnotation | BabelNodeEmptyTypeAnnotation | BabelNodeNullableTypeAnnotation | BabelNodeNumberLiteralTypeAnnotation | BabelNodeNumberTypeAnnotation | BabelNodeObjectTypeAnnotation | BabelNodeObjectTypeInternalSlot | BabelNodeObjectTypeCallProperty | BabelNodeObjectTypeIndexer | BabelNodeObjectTypeProperty | BabelNodeObjectTypeSpreadProperty | BabelNodeOpaqueType | BabelNodeQualifiedTypeIdentifier | BabelNodeStringLiteralTypeAnnotation | BabelNodeStringTypeAnnotation | BabelNodeSymbolTypeAnnotation | BabelNodeThisTypeAnnotation | BabelNodeTupleTypeAnnotation | BabelNodeTypeofTypeAnnotation | BabelNodeTypeAlias | BabelNodeTypeAnnotation | BabelNodeTypeCastExpression | BabelNodeTypeParameter | BabelNodeTypeParameterDeclaration | BabelNodeTypeParameterInstantiation | BabelNodeUnionTypeAnnotation | BabelNodeVariance | BabelNodeVoidTypeAnnotation | BabelNodeEnumDeclaration | BabelNodeEnumBooleanBody | BabelNodeEnumNumberBody | BabelNodeEnumStringBody | BabelNodeEnumSymbolBody | BabelNodeEnumBooleanMember | BabelNodeEnumNumberMember | BabelNodeEnumStringMember | BabelNodeEnumDefaultedMember | BabelNodeIndexedAccessType | BabelNodeOptionalIndexedAccessType | BabelNodeJSXAttribute | BabelNodeJSXClosingElement | BabelNodeJSXElement | BabelNodeJSXEmptyExpression | BabelNodeJSXExpressionContainer | BabelNodeJSXSpreadChild | BabelNodeJSXIdentifier | BabelNodeJSXMemberExpression | BabelNodeJSXNamespacedName | BabelNodeJSXOpeningElement | BabelNodeJSXSpreadAttribute | BabelNodeJSXText | BabelNodeJSXFragment | BabelNodeJSXOpeningFragment | BabelNodeJSXClosingFragment | BabelNodeNoop | BabelNodePlaceholder | BabelNodeV8IntrinsicIdentifier | BabelNodeArgumentPlaceholder | BabelNodeBindExpression | BabelNodeDecorator | BabelNodeDoExpression | BabelNodeExportDefaultSpecifier | BabelNodeRecordExpression | BabelNodeTupleExpression | BabelNodeDecimalLiteral | BabelNodeModuleExpression | BabelNodeTopicReference | BabelNodePipelineTopicExpression | BabelNodePipelineBareFunction | BabelNodePipelinePrimaryTopicReference | BabelNodeVoidPattern | BabelNodeTSParameterProperty | BabelNodeTSDeclareFunction | BabelNodeTSDeclareMethod | BabelNodeTSQualifiedName | BabelNodeTSCallSignatureDeclaration | BabelNodeTSConstructSignatureDeclaration | BabelNodeTSPropertySignature | BabelNodeTSMethodSignature | BabelNodeTSIndexSignature | BabelNodeTSAnyKeyword | BabelNodeTSBooleanKeyword | BabelNodeTSBigIntKeyword | BabelNodeTSIntrinsicKeyword | BabelNodeTSNeverKeyword | BabelNodeTSNullKeyword | BabelNodeTSNumberKeyword | BabelNodeTSObjectKeyword | BabelNodeTSStringKeyword | BabelNodeTSSymbolKeyword | BabelNodeTSUndefinedKeyword | BabelNodeTSUnknownKeyword | BabelNodeTSVoidKeyword | BabelNodeTSThisType | BabelNodeTSFunctionType | BabelNodeTSConstructorType | BabelNodeTSTypeReference | BabelNodeTSTypePredicate | BabelNodeTSTypeQuery | BabelNodeTSTypeLiteral | BabelNodeTSArrayType | BabelNodeTSTupleType | BabelNodeTSOptionalType | BabelNodeTSRestType | BabelNodeTSNamedTupleMember | BabelNodeTSUnionType | BabelNodeTSIntersectionType | BabelNodeTSConditionalType | BabelNodeTSInferType | BabelNodeTSParenthesizedType | BabelNodeTSTypeOperator | BabelNodeTSIndexedAccessType | BabelNodeTSMappedType | BabelNodeTSTemplateLiteralType | BabelNodeTSLiteralType | BabelNodeTSExpressionWithTypeArguments | BabelNodeTSInterfaceDeclaration | BabelNodeTSInterfaceBody | BabelNodeTSTypeAliasDeclaration | BabelNodeTSInstantiationExpression | BabelNodeTSAsExpression | BabelNodeTSSatisfiesExpression | BabelNodeTSTypeAssertion | BabelNodeTSEnumBody | BabelNodeTSEnumDeclaration | BabelNodeTSEnumMember | BabelNodeTSModuleDeclaration | BabelNodeTSModuleBlock | BabelNodeTSImportType | BabelNodeTSImportEqualsDeclaration | BabelNodeTSExternalModuleReference | BabelNodeTSNonNullExpression | BabelNodeTSExportAssignment | BabelNodeTSNamespaceExportDeclaration | BabelNodeTSTypeAnnotation | BabelNodeTSTypeParameterInstantiation | BabelNodeTSTypeParameterDeclaration | BabelNodeTSTypeParameter;
declare type BabelNodeStandardized = BabelNodeArrayExpression | BabelNodeAssignmentExpression | BabelNodeBinaryExpression | BabelNodeInterpreterDirective | BabelNodeDirective | BabelNodeDirectiveLiteral | BabelNodeBlockStatement | BabelNodeBreakStatement | BabelNodeCallExpression | BabelNodeCatchClause | BabelNodeConditionalExpression | BabelNodeContinueStatement | BabelNodeDebuggerStatement | BabelNodeDoWhileStatement | BabelNodeEmptyStatement | BabelNodeExpressionStatement | BabelNodeFile | BabelNodeForInStatement | BabelNodeForStatement | BabelNodeFunctionDeclaration | BabelNodeFunctionExpression | BabelNodeIdentifier | BabelNodeIfStatement | BabelNodeLabeledStatement | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeNullLiteral | BabelNodeBooleanLiteral | BabelNodeRegExpLiteral | BabelNodeLogicalExpression | BabelNodeMemberExpression | BabelNodeNewExpression | BabelNodeProgram | BabelNodeObjectExpression | BabelNodeObjectMethod | BabelNodeObjectProperty | BabelNodeRestElement | BabelNodeReturnStatement | BabelNodeSequenceExpression | BabelNodeParenthesizedExpression | BabelNodeSwitchCase | BabelNodeSwitchStatement | BabelNodeThisExpression | BabelNodeThrowStatement | BabelNodeTryStatement | BabelNodeUnaryExpression | BabelNodeUpdateExpression | BabelNodeVariableDeclaration | BabelNodeVariableDeclarator | BabelNodeWhileStatement | BabelNodeWithStatement | BabelNodeAssignmentPattern | BabelNodeArrayPattern | BabelNodeArrowFunctionExpression | BabelNodeClassBody | BabelNodeClassExpression | BabelNodeClassDeclaration | BabelNodeExportAllDeclaration | BabelNodeExportDefaultDeclaration | BabelNodeExportNamedDeclaration | BabelNodeExportSpecifier | BabelNodeForOfStatement | BabelNodeImportDeclaration | BabelNodeImportDefaultSpecifier | BabelNodeImportNamespaceSpecifier | BabelNodeImportSpecifier | BabelNodeImportExpression | BabelNodeMetaProperty | BabelNodeClassMethod | BabelNodeObjectPattern | BabelNodeSpreadElement | BabelNodeSuper | BabelNodeTaggedTemplateExpression | BabelNodeTemplateElement | BabelNodeTemplateLiteral | BabelNodeYieldExpression | BabelNodeAwaitExpression | BabelNodeImport | BabelNodeBigIntLiteral | BabelNodeExportNamespaceSpecifier | BabelNodeOptionalMemberExpression | BabelNodeOptionalCallExpression | BabelNodeClassProperty | BabelNodeClassAccessorProperty | BabelNodeClassPrivateProperty | BabelNodeClassPrivateMethod | BabelNodePrivateName | BabelNodeStaticBlock | BabelNodeImportAttribute;
declare type BabelNodeExpression = BabelNodeArrayExpression | BabelNodeAssignmentExpression | BabelNodeBinaryExpression | BabelNodeCallExpression | BabelNodeConditionalExpression | BabelNodeFunctionExpression | BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeNullLiteral | BabelNodeBooleanLiteral | BabelNodeRegExpLiteral | BabelNodeLogicalExpression | BabelNodeMemberExpression | BabelNodeNewExpression | BabelNodeObjectExpression | BabelNodeSequenceExpression | BabelNodeParenthesizedExpression | BabelNodeThisExpression | BabelNodeUnaryExpression | BabelNodeUpdateExpression | BabelNodeArrowFunctionExpression | BabelNodeClassExpression | BabelNodeImportExpression | BabelNodeMetaProperty | BabelNodeSuper | BabelNodeTaggedTemplateExpression | BabelNodeTemplateLiteral | BabelNodeYieldExpression | BabelNodeAwaitExpression | BabelNodeImport | BabelNodeBigIntLiteral | BabelNodeOptionalMemberExpression | BabelNodeOptionalCallExpression | BabelNodeTypeCastExpression | BabelNodeJSXElement | BabelNodeJSXFragment | BabelNodeBindExpression | BabelNodeDoExpression | BabelNodeRecordExpression | BabelNodeTupleExpression | BabelNodeDecimalLiteral | BabelNodeModuleExpression | BabelNodeTopicReference | BabelNodePipelineTopicExpression | BabelNodePipelineBareFunction | BabelNodePipelinePrimaryTopicReference | BabelNodeTSInstantiationExpression | BabelNodeTSAsExpression | BabelNodeTSSatisfiesExpression | BabelNodeTSTypeAssertion | BabelNodeTSNonNullExpression;
declare type BabelNodeBinary = BabelNodeBinaryExpression | BabelNodeLogicalExpression;
declare type BabelNodeScopable = BabelNodeBlockStatement | BabelNodeCatchClause | BabelNodeDoWhileStatement | BabelNodeForInStatement | BabelNodeForStatement | BabelNodeFunctionDeclaration | BabelNodeFunctionExpression | BabelNodeProgram | BabelNodeObjectMethod | BabelNodeSwitchStatement | BabelNodeWhileStatement | BabelNodeArrowFunctionExpression | BabelNodeClassExpression | BabelNodeClassDeclaration | BabelNodeForOfStatement | BabelNodeClassMethod | BabelNodeClassPrivateMethod | BabelNodeStaticBlock | BabelNodeTSModuleBlock;
declare type BabelNodeBlockParent = BabelNodeBlockStatement | BabelNodeCatchClause | BabelNodeDoWhileStatement | BabelNodeForInStatement | BabelNodeForStatement | BabelNodeFunctionDeclaration | BabelNodeFunctionExpression | BabelNodeProgram | BabelNodeObjectMethod | BabelNodeSwitchStatement | BabelNodeWhileStatement | BabelNodeArrowFunctionExpression | BabelNodeForOfStatement | BabelNodeClassMethod | BabelNodeClassPrivateMethod | BabelNodeStaticBlock | BabelNodeTSModuleBlock;
declare type BabelNodeBlock = BabelNodeBlockStatement | BabelNodeProgram | BabelNodeTSModuleBlock;
declare type BabelNodeStatement = BabelNodeBlockStatement | BabelNodeBreakStatement | BabelNodeContinueStatement | BabelNodeDebuggerStatement | BabelNodeDoWhileStatement | BabelNodeEmptyStatement | BabelNodeExpressionStatement | BabelNodeForInStatement | BabelNodeForStatement | BabelNodeFunctionDeclaration | BabelNodeIfStatement | BabelNodeLabeledStatement | BabelNodeReturnStatement | BabelNodeSwitchStatement | BabelNodeThrowStatement | BabelNodeTryStatement | BabelNodeVariableDeclaration | BabelNodeWhileStatement | BabelNodeWithStatement | BabelNodeClassDeclaration | BabelNodeExportAllDeclaration | BabelNodeExportDefaultDeclaration | BabelNodeExportNamedDeclaration | BabelNodeForOfStatement | BabelNodeImportDeclaration | BabelNodeDeclareClass | BabelNodeDeclareFunction | BabelNodeDeclareInterface | BabelNodeDeclareModule | BabelNodeDeclareModuleExports | BabelNodeDeclareTypeAlias | BabelNodeDeclareOpaqueType | BabelNodeDeclareVariable | BabelNodeDeclareExportDeclaration | BabelNodeDeclareExportAllDeclaration | BabelNodeInterfaceDeclaration | BabelNodeOpaqueType | BabelNodeTypeAlias | BabelNodeEnumDeclaration | BabelNodeTSDeclareFunction | BabelNodeTSInterfaceDeclaration | BabelNodeTSTypeAliasDeclaration | BabelNodeTSEnumDeclaration | BabelNodeTSModuleDeclaration | BabelNodeTSImportEqualsDeclaration | BabelNodeTSExportAssignment | BabelNodeTSNamespaceExportDeclaration;
declare type BabelNodeTerminatorless = BabelNodeBreakStatement | BabelNodeContinueStatement | BabelNodeReturnStatement | BabelNodeThrowStatement | BabelNodeYieldExpression | BabelNodeAwaitExpression;
declare type BabelNodeCompletionStatement = BabelNodeBreakStatement | BabelNodeContinueStatement | BabelNodeReturnStatement | BabelNodeThrowStatement;
declare type BabelNodeConditional = BabelNodeConditionalExpression | BabelNodeIfStatement;
declare type BabelNodeLoop = BabelNodeDoWhileStatement | BabelNodeForInStatement | BabelNodeForStatement | BabelNodeWhileStatement | BabelNodeForOfStatement;
declare type BabelNodeWhile = BabelNodeDoWhileStatement | BabelNodeWhileStatement;
declare type BabelNodeExpressionWrapper = BabelNodeExpressionStatement | BabelNodeParenthesizedExpression | BabelNodeTypeCastExpression;
declare type BabelNodeFor = BabelNodeForInStatement | BabelNodeForStatement | BabelNodeForOfStatement;
declare type BabelNodeForXStatement = BabelNodeForInStatement | BabelNodeForOfStatement;
declare type BabelNodeFunction = BabelNodeFunctionDeclaration | BabelNodeFunctionExpression | BabelNodeObjectMethod | BabelNodeArrowFunctionExpression | BabelNodeClassMethod | BabelNodeClassPrivateMethod;
declare type BabelNodeFunctionParent = BabelNodeFunctionDeclaration | BabelNodeFunctionExpression | BabelNodeObjectMethod | BabelNodeArrowFunctionExpression | BabelNodeClassMethod | BabelNodeClassPrivateMethod | BabelNodeStaticBlock | BabelNodeTSModuleBlock;
declare type BabelNodePureish = BabelNodeFunctionDeclaration | BabelNodeFunctionExpression | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeNullLiteral | BabelNodeBooleanLiteral | BabelNodeRegExpLiteral | BabelNodeArrowFunctionExpression | BabelNodeBigIntLiteral | BabelNodeDecimalLiteral;
declare type BabelNodeDeclaration = BabelNodeFunctionDeclaration | BabelNodeVariableDeclaration | BabelNodeClassDeclaration | BabelNodeExportAllDeclaration | BabelNodeExportDefaultDeclaration | BabelNodeExportNamedDeclaration | BabelNodeImportDeclaration | BabelNodeDeclareClass | BabelNodeDeclareFunction | BabelNodeDeclareInterface | BabelNodeDeclareModule | BabelNodeDeclareModuleExports | BabelNodeDeclareTypeAlias | BabelNodeDeclareOpaqueType | BabelNodeDeclareVariable | BabelNodeDeclareExportDeclaration | BabelNodeDeclareExportAllDeclaration | BabelNodeInterfaceDeclaration | BabelNodeOpaqueType | BabelNodeTypeAlias | BabelNodeEnumDeclaration | BabelNodeTSDeclareFunction | BabelNodeTSInterfaceDeclaration | BabelNodeTSTypeAliasDeclaration | BabelNodeTSEnumDeclaration | BabelNodeTSModuleDeclaration | BabelNodeTSImportEqualsDeclaration;
declare type BabelNodeFunctionParameter = BabelNodeIdentifier | BabelNodeRestElement | BabelNodeAssignmentPattern | BabelNodeArrayPattern | BabelNodeObjectPattern | BabelNodeVoidPattern;
declare type BabelNodePatternLike = BabelNodeIdentifier | BabelNodeMemberExpression | BabelNodeRestElement | BabelNodeAssignmentPattern | BabelNodeArrayPattern | BabelNodeObjectPattern | BabelNodeVoidPattern | BabelNodeTSAsExpression | BabelNodeTSSatisfiesExpression | BabelNodeTSTypeAssertion | BabelNodeTSNonNullExpression;
declare type BabelNodeLVal = BabelNodeIdentifier | BabelNodeMemberExpression | BabelNodeRestElement | BabelNodeAssignmentPattern | BabelNodeArrayPattern | BabelNodeObjectPattern | BabelNodeTSParameterProperty | BabelNodeTSAsExpression | BabelNodeTSSatisfiesExpression | BabelNodeTSTypeAssertion | BabelNodeTSNonNullExpression;
declare type BabelNodeTSEntityName = BabelNodeIdentifier | BabelNodeTSQualifiedName;
declare type BabelNodeLiteral = BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeNullLiteral | BabelNodeBooleanLiteral | BabelNodeRegExpLiteral | BabelNodeTemplateLiteral | BabelNodeBigIntLiteral | BabelNodeDecimalLiteral;
declare type BabelNodeImmutable = BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeNullLiteral | BabelNodeBooleanLiteral | BabelNodeBigIntLiteral | BabelNodeJSXAttribute | BabelNodeJSXClosingElement | BabelNodeJSXElement | BabelNodeJSXExpressionContainer | BabelNodeJSXSpreadChild | BabelNodeJSXOpeningElement | BabelNodeJSXText | BabelNodeJSXFragment | BabelNodeJSXOpeningFragment | BabelNodeJSXClosingFragment | BabelNodeDecimalLiteral;
declare type BabelNodeUserWhitespacable = BabelNodeObjectMethod | BabelNodeObjectProperty | BabelNodeObjectTypeInternalSlot | BabelNodeObjectTypeCallProperty | BabelNodeObjectTypeIndexer | BabelNodeObjectTypeProperty | BabelNodeObjectTypeSpreadProperty;
declare type BabelNodeMethod = BabelNodeObjectMethod | BabelNodeClassMethod | BabelNodeClassPrivateMethod;
declare type BabelNodeObjectMember = BabelNodeObjectMethod | BabelNodeObjectProperty;
declare type BabelNodeProperty = BabelNodeObjectProperty | BabelNodeClassProperty | BabelNodeClassAccessorProperty | BabelNodeClassPrivateProperty;
declare type BabelNodeUnaryLike = BabelNodeUnaryExpression | BabelNodeSpreadElement;
declare type BabelNodePattern = BabelNodeAssignmentPattern | BabelNodeArrayPattern | BabelNodeObjectPattern | BabelNodeVoidPattern;
declare type BabelNodeClass = BabelNodeClassExpression | BabelNodeClassDeclaration;
declare type BabelNodeImportOrExportDeclaration = BabelNodeExportAllDeclaration | BabelNodeExportDefaultDeclaration | BabelNodeExportNamedDeclaration | BabelNodeImportDeclaration;
declare type BabelNodeExportDeclaration = BabelNodeExportAllDeclaration | BabelNodeExportDefaultDeclaration | BabelNodeExportNamedDeclaration;
declare type BabelNodeModuleSpecifier = BabelNodeExportSpecifier | BabelNodeImportDefaultSpecifier | BabelNodeImportNamespaceSpecifier | BabelNodeImportSpecifier | BabelNodeExportNamespaceSpecifier | BabelNodeExportDefaultSpecifier;
declare type BabelNodeAccessor = BabelNodeClassAccessorProperty;
declare type BabelNodePrivate = BabelNodeClassPrivateProperty | BabelNodeClassPrivateMethod | BabelNodePrivateName;
declare type BabelNodeFlow = BabelNodeAnyTypeAnnotation | BabelNodeArrayTypeAnnotation | BabelNodeBooleanTypeAnnotation | BabelNodeBooleanLiteralTypeAnnotation | BabelNodeNullLiteralTypeAnnotation | BabelNodeClassImplements | BabelNodeDeclareClass | BabelNodeDeclareFunction | BabelNodeDeclareInterface | BabelNodeDeclareModule | BabelNodeDeclareModuleExports | BabelNodeDeclareTypeAlias | BabelNodeDeclareOpaqueType | BabelNodeDeclareVariable | BabelNodeDeclareExportDeclaration | BabelNodeDeclareExportAllDeclaration | BabelNodeDeclaredPredicate | BabelNodeExistsTypeAnnotation | BabelNodeFunctionTypeAnnotation | BabelNodeFunctionTypeParam | BabelNodeGenericTypeAnnotation | BabelNodeInferredPredicate | BabelNodeInterfaceExtends | BabelNodeInterfaceDeclaration | BabelNodeInterfaceTypeAnnotation | BabelNodeIntersectionTypeAnnotation | BabelNodeMixedTypeAnnotation | BabelNodeEmptyTypeAnnotation | BabelNodeNullableTypeAnnotation | BabelNodeNumberLiteralTypeAnnotation | BabelNodeNumberTypeAnnotation | BabelNodeObjectTypeAnnotation | BabelNodeObjectTypeInternalSlot | BabelNodeObjectTypeCallProperty | BabelNodeObjectTypeIndexer | BabelNodeObjectTypeProperty | BabelNodeObjectTypeSpreadProperty | BabelNodeOpaqueType | BabelNodeQualifiedTypeIdentifier | BabelNodeStringLiteralTypeAnnotation | BabelNodeStringTypeAnnotation | BabelNodeSymbolTypeAnnotation | BabelNodeThisTypeAnnotation | BabelNodeTupleTypeAnnotation | BabelNodeTypeofTypeAnnotation | BabelNodeTypeAlias | BabelNodeTypeAnnotation | BabelNodeTypeCastExpression | BabelNodeTypeParameter | BabelNodeTypeParameterDeclaration | BabelNodeTypeParameterInstantiation | BabelNodeUnionTypeAnnotation | BabelNodeVariance | BabelNodeVoidTypeAnnotation | BabelNodeEnumDeclaration | BabelNodeEnumBooleanBody | BabelNodeEnumNumberBody | BabelNodeEnumStringBody | BabelNodeEnumSymbolBody | BabelNodeEnumBooleanMember | BabelNodeEnumNumberMember | BabelNodeEnumStringMember | BabelNodeEnumDefaultedMember | BabelNodeIndexedAccessType | BabelNodeOptionalIndexedAccessType;
declare type BabelNodeFlowType = BabelNodeAnyTypeAnnotation | BabelNodeArrayTypeAnnotation | BabelNodeBooleanTypeAnnotation | BabelNodeBooleanLiteralTypeAnnotation | BabelNodeNullLiteralTypeAnnotation | BabelNodeExistsTypeAnnotation | BabelNodeFunctionTypeAnnotation | BabelNodeGenericTypeAnnotation | BabelNodeInterfaceTypeAnnotation | BabelNodeIntersectionTypeAnnotation | BabelNodeMixedTypeAnnotation | BabelNodeEmptyTypeAnnotation | BabelNodeNullableTypeAnnotation | BabelNodeNumberLiteralTypeAnnotation | BabelNodeNumberTypeAnnotation | BabelNodeObjectTypeAnnotation | BabelNodeStringLiteralTypeAnnotation | BabelNodeStringTypeAnnotation | BabelNodeSymbolTypeAnnotation | BabelNodeThisTypeAnnotation | BabelNodeTupleTypeAnnotation | BabelNodeTypeofTypeAnnotation | BabelNodeUnionTypeAnnotation | BabelNodeVoidTypeAnnotation | BabelNodeIndexedAccessType | BabelNodeOptionalIndexedAccessType;
declare type BabelNodeFlowBaseAnnotation = BabelNodeAnyTypeAnnotation | BabelNodeBooleanTypeAnnotation | BabelNodeNullLiteralTypeAnnotation | BabelNodeMixedTypeAnnotation | BabelNodeEmptyTypeAnnotation | BabelNodeNumberTypeAnnotation | BabelNodeStringTypeAnnotation | BabelNodeSymbolTypeAnnotation | BabelNodeThisTypeAnnotation | BabelNodeVoidTypeAnnotation;
declare type BabelNodeFlowDeclaration = BabelNodeDeclareClass | BabelNodeDeclareFunction | BabelNodeDeclareInterface | BabelNodeDeclareModule | BabelNodeDeclareModuleExports | BabelNodeDeclareTypeAlias | BabelNodeDeclareOpaqueType | BabelNodeDeclareVariable | BabelNodeDeclareExportDeclaration | BabelNodeDeclareExportAllDeclaration | BabelNodeInterfaceDeclaration | BabelNodeOpaqueType | BabelNodeTypeAlias;
declare type BabelNodeFlowPredicate = BabelNodeDeclaredPredicate | BabelNodeInferredPredicate;
declare type BabelNodeEnumBody = BabelNodeEnumBooleanBody | BabelNodeEnumNumberBody | BabelNodeEnumStringBody | BabelNodeEnumSymbolBody;
declare type BabelNodeEnumMember = BabelNodeEnumBooleanMember | BabelNodeEnumNumberMember | BabelNodeEnumStringMember | BabelNodeEnumDefaultedMember;
declare type BabelNodeJSX = BabelNodeJSXAttribute | BabelNodeJSXClosingElement | BabelNodeJSXElement | BabelNodeJSXEmptyExpression | BabelNodeJSXExpressionContainer | BabelNodeJSXSpreadChild | BabelNodeJSXIdentifier | BabelNodeJSXMemberExpression | BabelNodeJSXNamespacedName | BabelNodeJSXOpeningElement | BabelNodeJSXSpreadAttribute | BabelNodeJSXText | BabelNodeJSXFragment | BabelNodeJSXOpeningFragment | BabelNodeJSXClosingFragment;
declare type BabelNodeMiscellaneous = BabelNodeNoop | BabelNodePlaceholder | BabelNodeV8IntrinsicIdentifier;
declare type BabelNodeTypeScript = BabelNodeTSParameterProperty | BabelNodeTSDeclareFunction | BabelNodeTSDeclareMethod | BabelNodeTSQualifiedName | BabelNodeTSCallSignatureDeclaration | BabelNodeTSConstructSignatureDeclaration | BabelNodeTSPropertySignature | BabelNodeTSMethodSignature | BabelNodeTSIndexSignature | BabelNodeTSAnyKeyword | BabelNodeTSBooleanKeyword | BabelNodeTSBigIntKeyword | BabelNodeTSIntrinsicKeyword | BabelNodeTSNeverKeyword | BabelNodeTSNullKeyword | BabelNodeTSNumberKeyword | BabelNodeTSObjectKeyword | BabelNodeTSStringKeyword | BabelNodeTSSymbolKeyword | BabelNodeTSUndefinedKeyword | BabelNodeTSUnknownKeyword | BabelNodeTSVoidKeyword | BabelNodeTSThisType | BabelNodeTSFunctionType | BabelNodeTSConstructorType | BabelNodeTSTypeReference | BabelNodeTSTypePredicate | BabelNodeTSTypeQuery | BabelNodeTSTypeLiteral | BabelNodeTSArrayType | BabelNodeTSTupleType | BabelNodeTSOptionalType | BabelNodeTSRestType | BabelNodeTSNamedTupleMember | BabelNodeTSUnionType | BabelNodeTSIntersectionType | BabelNodeTSConditionalType | BabelNodeTSInferType | BabelNodeTSParenthesizedType | BabelNodeTSTypeOperator | BabelNodeTSIndexedAccessType | BabelNodeTSMappedType | BabelNodeTSTemplateLiteralType | BabelNodeTSLiteralType | BabelNodeTSExpressionWithTypeArguments | BabelNodeTSInterfaceDeclaration | BabelNodeTSInterfaceBody | BabelNodeTSTypeAliasDeclaration | BabelNodeTSInstantiationExpression | BabelNodeTSAsExpression | BabelNodeTSSatisfiesExpression | BabelNodeTSTypeAssertion | BabelNodeTSEnumBody | BabelNodeTSEnumDeclaration | BabelNodeTSEnumMember | BabelNodeTSModuleDeclaration | BabelNodeTSModuleBlock | BabelNodeTSImportType | BabelNodeTSImportEqualsDeclaration | BabelNodeTSExternalModuleReference | BabelNodeTSNonNullExpression | BabelNodeTSExportAssignment | BabelNodeTSNamespaceExportDeclaration | BabelNodeTSTypeAnnotation | BabelNodeTSTypeParameterInstantiation | BabelNodeTSTypeParameterDeclaration | BabelNodeTSTypeParameter;
declare type BabelNodeTSTypeElement = BabelNodeTSCallSignatureDeclaration | BabelNodeTSConstructSignatureDeclaration | BabelNodeTSPropertySignature | BabelNodeTSMethodSignature | BabelNodeTSIndexSignature;
declare type BabelNodeTSType = BabelNodeTSAnyKeyword | BabelNodeTSBooleanKeyword | BabelNodeTSBigIntKeyword | BabelNodeTSIntrinsicKeyword | BabelNodeTSNeverKeyword | BabelNodeTSNullKeyword | BabelNodeTSNumberKeyword | BabelNodeTSObjectKeyword | BabelNodeTSStringKeyword | BabelNodeTSSymbolKeyword | BabelNodeTSUndefinedKeyword | BabelNodeTSUnknownKeyword | BabelNodeTSVoidKeyword | BabelNodeTSThisType | BabelNodeTSFunctionType | BabelNodeTSConstructorType | BabelNodeTSTypeReference | BabelNodeTSTypePredicate | BabelNodeTSTypeQuery | BabelNodeTSTypeLiteral | BabelNodeTSArrayType | BabelNodeTSTupleType | BabelNodeTSOptionalType | BabelNodeTSRestType | BabelNodeTSUnionType | BabelNodeTSIntersectionType | BabelNodeTSConditionalType | BabelNodeTSInferType | BabelNodeTSParenthesizedType | BabelNodeTSTypeOperator | BabelNodeTSIndexedAccessType | BabelNodeTSMappedType | BabelNodeTSTemplateLiteralType | BabelNodeTSLiteralType | BabelNodeTSExpressionWithTypeArguments | BabelNodeTSImportType;
declare type BabelNodeTSBaseType = BabelNodeTSAnyKeyword | BabelNodeTSBooleanKeyword | BabelNodeTSBigIntKeyword | BabelNodeTSIntrinsicKeyword | BabelNodeTSNeverKeyword | BabelNodeTSNullKeyword | BabelNodeTSNumberKeyword | BabelNodeTSObjectKeyword | BabelNodeTSStringKeyword | BabelNodeTSSymbolKeyword | BabelNodeTSUndefinedKeyword | BabelNodeTSUnknownKeyword | BabelNodeTSVoidKeyword | BabelNodeTSThisType | BabelNodeTSTemplateLiteralType | BabelNodeTSLiteralType;
declare type BabelNodeModuleDeclaration = BabelNodeExportAllDeclaration | BabelNodeExportDefaultDeclaration | BabelNodeExportNamedDeclaration | BabelNodeImportDeclaration;

declare module "@babel/types" {
  declare export function arrayExpression(elements?: Array<null | BabelNodeExpression | BabelNodeSpreadElement>): BabelNodeArrayExpression;
  declare export function assignmentExpression(operator: string, left: BabelNodeLVal | BabelNodeOptionalMemberExpression, right: BabelNodeExpression): BabelNodeAssignmentExpression;
  declare export function binaryExpression(operator: "+" | "-" | "/" | "%" | "*" | "**" | "&" | "|" | ">>" | ">>>" | "<<" | "^" | "==" | "===" | "!=" | "!==" | "in" | "instanceof" | ">" | "<" | ">=" | "<=" | "|>", left: BabelNodeExpression | BabelNodePrivateName, right: BabelNodeExpression): BabelNodeBinaryExpression;
  declare export function interpreterDirective(value: string): BabelNodeInterpreterDirective;
  declare export function directive(value: BabelNodeDirectiveLiteral): BabelNodeDirective;
  declare export function directiveLiteral(value: string): BabelNodeDirectiveLiteral;
  declare export function blockStatement(body: Array<BabelNodeStatement>, directives?: Array<BabelNodeDirective>): BabelNodeBlockStatement;
  declare export function breakStatement(label?: BabelNodeIdentifier): BabelNodeBreakStatement;
  declare export function callExpression(callee: BabelNodeExpression | BabelNodeSuper | BabelNodeV8IntrinsicIdentifier, _arguments: Array<BabelNodeExpression | BabelNodeSpreadElement | BabelNodeArgumentPlaceholder>): BabelNodeCallExpression;
  declare export function catchClause(param?: BabelNodeIdentifier | BabelNodeArrayPattern | BabelNodeObjectPattern, body: BabelNodeBlockStatement): BabelNodeCatchClause;
  declare export function conditionalExpression(test: BabelNodeExpression, consequent: BabelNodeExpression, alternate: BabelNodeExpression): BabelNodeConditionalExpression;
  declare export function continueStatement(label?: BabelNodeIdentifier): BabelNodeContinueStatement;
  declare export function debuggerStatement(): BabelNodeDebuggerStatement;
  declare export function doWhileStatement(test: BabelNodeExpression, body: BabelNodeStatement): BabelNodeDoWhileStatement;
  declare export function emptyStatement(): BabelNodeEmptyStatement;
  declare export function expressionStatement(expression: BabelNodeExpression): BabelNodeExpressionStatement;
  declare export function file(program: BabelNodeProgram, comments?: Array<BabelNodeCommentBlock | BabelNodeCommentLine>, tokens?: Array<any>): BabelNodeFile;
  declare export function forInStatement(left: BabelNodeVariableDeclaration | BabelNodeLVal, right: BabelNodeExpression, body: BabelNodeStatement): BabelNodeForInStatement;
  declare export function forStatement(init?: BabelNodeVariableDeclaration | BabelNodeExpression, test?: BabelNodeExpression, update?: BabelNodeExpression, body: BabelNodeStatement): BabelNodeForStatement;
  declare export function functionDeclaration(id?: BabelNodeIdentifier, params: Array<BabelNodeFunctionParameter>, body: BabelNodeBlockStatement, generator?: boolean, async?: boolean): BabelNodeFunctionDeclaration;
  declare export function functionExpression(id?: BabelNodeIdentifier, params: Array<BabelNodeFunctionParameter>, body: BabelNodeBlockStatement, generator?: boolean, async?: boolean): BabelNodeFunctionExpression;
  declare export function identifier(name: string): BabelNodeIdentifier;
  declare export function ifStatement(test: BabelNodeExpression, consequent: BabelNodeStatement, alternate?: BabelNodeStatement): BabelNodeIfStatement;
  declare export function labeledStatement(label: BabelNodeIdentifier, body: BabelNodeStatement): BabelNodeLabeledStatement;
  declare export function stringLiteral(value: string): BabelNodeStringLiteral;
  declare export function numericLiteral(value: number): BabelNodeNumericLiteral;
  declare export function nullLiteral(): BabelNodeNullLiteral;
  declare export function booleanLiteral(value: boolean): BabelNodeBooleanLiteral;
  declare export function regExpLiteral(pattern: string, flags?: string): BabelNodeRegExpLiteral;
  declare export function logicalExpression(operator: "||" | "&&" | "??", left: BabelNodeExpression, right: BabelNodeExpression): BabelNodeLogicalExpression;
  declare export function memberExpression(object: BabelNodeExpression | BabelNodeSuper, property: BabelNodeExpression | BabelNodeIdentifier | BabelNodePrivateName, computed?: boolean, optional?: boolean): BabelNodeMemberExpression;
  declare export function newExpression(callee: BabelNodeExpression | BabelNodeSuper | BabelNodeV8IntrinsicIdentifier, _arguments: Array<BabelNodeExpression | BabelNodeSpreadElement | BabelNodeArgumentPlaceholder>): BabelNodeNewExpression;
  declare export function program(body: Array<BabelNodeStatement>, directives?: Array<BabelNodeDirective>, sourceType?: "script" | "module", interpreter?: BabelNodeInterpreterDirective): BabelNodeProgram;
  declare export function objectExpression(properties: Array<BabelNodeObjectMethod | BabelNodeObjectProperty | BabelNodeSpreadElement>): BabelNodeObjectExpression;
  declare export function objectMethod(kind?: "method" | "get" | "set", key: BabelNodeExpression | BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral, params: Array<BabelNodeFunctionParameter>, body: BabelNodeBlockStatement, computed?: boolean, generator?: boolean, async?: boolean): BabelNodeObjectMethod;
  declare export function objectProperty(key: BabelNodeExpression | BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral | BabelNodeDecimalLiteral | BabelNodePrivateName, value: BabelNodeExpression | BabelNodePatternLike, computed?: boolean, shorthand?: boolean, decorators?: Array<BabelNodeDecorator>): BabelNodeObjectProperty;
  declare export function restElement(argument: BabelNodeIdentifier | BabelNodeArrayPattern | BabelNodeObjectPattern | BabelNodeMemberExpression | BabelNodeTSAsExpression | BabelNodeTSSatisfiesExpression | BabelNodeTSTypeAssertion | BabelNodeTSNonNullExpression | BabelNodeRestElement | BabelNodeAssignmentPattern): BabelNodeRestElement;
  declare export function returnStatement(argument?: BabelNodeExpression): BabelNodeReturnStatement;
  declare export function sequenceExpression(expressions: Array<BabelNodeExpression>): BabelNodeSequenceExpression;
  declare export function parenthesizedExpression(expression: BabelNodeExpression): BabelNodeParenthesizedExpression;
  declare export function switchCase(test?: BabelNodeExpression, consequent: Array<BabelNodeStatement>): BabelNodeSwitchCase;
  declare export function switchStatement(discriminant: BabelNodeExpression, cases: Array<BabelNodeSwitchCase>): BabelNodeSwitchStatement;
  declare export function thisExpression(): BabelNodeThisExpression;
  declare export function throwStatement(argument: BabelNodeExpression): BabelNodeThrowStatement;
  declare export function tryStatement(block: BabelNodeBlockStatement, handler?: BabelNodeCatchClause, finalizer?: BabelNodeBlockStatement): BabelNodeTryStatement;
  declare export function unaryExpression(operator: "void" | "throw" | "delete" | "!" | "+" | "-" | "~" | "typeof", argument: BabelNodeExpression, prefix?: boolean): BabelNodeUnaryExpression;
  declare export function updateExpression(operator: "++" | "--", argument: BabelNodeExpression, prefix?: boolean): BabelNodeUpdateExpression;
  declare export function variableDeclaration(kind: "var" | "let" | "const" | "using" | "await using", declarations: Array<BabelNodeVariableDeclarator>): BabelNodeVariableDeclaration;
  declare export function variableDeclarator(id: BabelNodeLVal | BabelNodeVoidPattern, init?: BabelNodeExpression): BabelNodeVariableDeclarator;
  declare export function whileStatement(test: BabelNodeExpression, body: BabelNodeStatement): BabelNodeWhileStatement;
  declare export function withStatement(object: BabelNodeExpression, body: BabelNodeStatement): BabelNodeWithStatement;
  declare export function assignmentPattern(left: BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeArrayPattern | BabelNodeMemberExpression | BabelNodeTSAsExpression | BabelNodeTSSatisfiesExpression | BabelNodeTSTypeAssertion | BabelNodeTSNonNullExpression, right: BabelNodeExpression): BabelNodeAssignmentPattern;
  declare export function arrayPattern(elements: Array<null | BabelNodePatternLike>): BabelNodeArrayPattern;
  declare export function arrowFunctionExpression(params: Array<BabelNodeFunctionParameter>, body: BabelNodeBlockStatement | BabelNodeExpression, async?: boolean): BabelNodeArrowFunctionExpression;
  declare export function classBody(body: Array<BabelNodeClassMethod | BabelNodeClassPrivateMethod | BabelNodeClassProperty | BabelNodeClassPrivateProperty | BabelNodeClassAccessorProperty | BabelNodeTSDeclareMethod | BabelNodeTSIndexSignature | BabelNodeStaticBlock>): BabelNodeClassBody;
  declare export function classExpression(id?: BabelNodeIdentifier, superClass?: BabelNodeExpression, body: BabelNodeClassBody, decorators?: Array<BabelNodeDecorator>): BabelNodeClassExpression;
  declare export function classDeclaration(id?: BabelNodeIdentifier, superClass?: BabelNodeExpression, body: BabelNodeClassBody, decorators?: Array<BabelNodeDecorator>): BabelNodeClassDeclaration;
  declare export function exportAllDeclaration(source: BabelNodeStringLiteral, attributes?: Array<BabelNodeImportAttribute>): BabelNodeExportAllDeclaration;
  declare export function exportDefaultDeclaration(declaration: BabelNodeTSDeclareFunction | BabelNodeFunctionDeclaration | BabelNodeClassDeclaration | BabelNodeExpression): BabelNodeExportDefaultDeclaration;
  declare export function exportNamedDeclaration(declaration?: BabelNodeDeclaration, specifiers?: Array<BabelNodeExportSpecifier | BabelNodeExportDefaultSpecifier | BabelNodeExportNamespaceSpecifier>, source?: BabelNodeStringLiteral, attributes?: Array<BabelNodeImportAttribute>): BabelNodeExportNamedDeclaration;
  declare export function exportSpecifier(local: BabelNodeIdentifier, exported: BabelNodeIdentifier | BabelNodeStringLiteral): BabelNodeExportSpecifier;
  declare export function forOfStatement(left: BabelNodeVariableDeclaration | BabelNodeLVal, right: BabelNodeExpression, body: BabelNodeStatement, _await?: boolean): BabelNodeForOfStatement;
  declare export function importDeclaration(specifiers: Array<BabelNodeImportSpecifier | BabelNodeImportDefaultSpecifier | BabelNodeImportNamespaceSpecifier>, source: BabelNodeStringLiteral, attributes?: Array<BabelNodeImportAttribute>): BabelNodeImportDeclaration;
  declare export function importDefaultSpecifier(local: BabelNodeIdentifier): BabelNodeImportDefaultSpecifier;
  declare export function importNamespaceSpecifier(local: BabelNodeIdentifier): BabelNodeImportNamespaceSpecifier;
  declare export function importSpecifier(local: BabelNodeIdentifier, imported: BabelNodeIdentifier | BabelNodeStringLiteral): BabelNodeImportSpecifier;
  declare export function importExpression(source: BabelNodeExpression, options?: BabelNodeExpression): BabelNodeImportExpression;
  declare export function metaProperty(meta: BabelNodeIdentifier, property: BabelNodeIdentifier): BabelNodeMetaProperty;
  declare export function classMethod(kind?: "get" | "set" | "method" | "constructor", key: BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral | BabelNodeExpression, params: Array<BabelNodeFunctionParameter | BabelNodeTSParameterProperty>, body: BabelNodeBlockStatement, computed?: boolean, _static?: boolean, generator?: boolean, async?: boolean): BabelNodeClassMethod;
  declare export function objectPattern(properties: Array<BabelNodeRestElement | BabelNodeObjectProperty>): BabelNodeObjectPattern;
  declare export function spreadElement(argument: BabelNodeExpression): BabelNodeSpreadElement;
  declare var _super: () => BabelNodeSuper;
  declare export { _super as super }
  declare export function taggedTemplateExpression(tag: BabelNodeExpression, quasi: BabelNodeTemplateLiteral): BabelNodeTaggedTemplateExpression;
  declare export function templateElement(value: any, tail?: boolean): BabelNodeTemplateElement;
  declare export function templateLiteral(quasis: Array<BabelNodeTemplateElement>, expressions: Array<BabelNodeExpression | BabelNodeTSType>): BabelNodeTemplateLiteral;
  declare export function yieldExpression(argument?: BabelNodeExpression, delegate?: boolean): BabelNodeYieldExpression;
  declare export function awaitExpression(argument: BabelNodeExpression): BabelNodeAwaitExpression;
  declare var _import: () => BabelNodeImport;
  declare export { _import as import }
  declare export function bigIntLiteral(value: string): BabelNodeBigIntLiteral;
  declare export function exportNamespaceSpecifier(exported: BabelNodeIdentifier): BabelNodeExportNamespaceSpecifier;
  declare export function optionalMemberExpression(object: BabelNodeExpression, property: BabelNodeExpression | BabelNodeIdentifier, computed?: boolean, optional: boolean): BabelNodeOptionalMemberExpression;
  declare export function optionalCallExpression(callee: BabelNodeExpression, _arguments: Array<BabelNodeExpression | BabelNodeSpreadElement | BabelNodeArgumentPlaceholder>, optional: boolean): BabelNodeOptionalCallExpression;
  declare export function classProperty(key: BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral | BabelNodeExpression, value?: BabelNodeExpression, typeAnnotation?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop, decorators?: Array<BabelNodeDecorator>, computed?: boolean, _static?: boolean): BabelNodeClassProperty;
  declare export function classAccessorProperty(key: BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral | BabelNodeExpression | BabelNodePrivateName, value?: BabelNodeExpression, typeAnnotation?: BabelNodeTypeAnnotation | BabelNodeTSTypeAnnotation | BabelNodeNoop, decorators?: Array<BabelNodeDecorator>, computed?: boolean, _static?: boolean): BabelNodeClassAccessorProperty;
  declare export function classPrivateProperty(key: BabelNodePrivateName, value?: BabelNodeExpression, decorators?: Array<BabelNodeDecorator>, _static?: boolean): BabelNodeClassPrivateProperty;
  declare export function classPrivateMethod(kind?: "get" | "set" | "method", key: BabelNodePrivateName, params: Array<BabelNodeFunctionParameter | BabelNodeTSParameterProperty>, body: BabelNodeBlockStatement, _static?: boolean): BabelNodeClassPrivateMethod;
  declare export function privateName(id: BabelNodeIdentifier): BabelNodePrivateName;
  declare export function staticBlock(body: Array<BabelNodeStatement>): BabelNodeStaticBlock;
  declare export function importAttribute(key: BabelNodeIdentifier | BabelNodeStringLiteral, value: BabelNodeStringLiteral): BabelNodeImportAttribute;
  declare export function anyTypeAnnotation(): BabelNodeAnyTypeAnnotation;
  declare export function arrayTypeAnnotation(elementType: BabelNodeFlowType): BabelNodeArrayTypeAnnotation;
  declare export function booleanTypeAnnotation(): BabelNodeBooleanTypeAnnotation;
  declare export function booleanLiteralTypeAnnotation(value: boolean): BabelNodeBooleanLiteralTypeAnnotation;
  declare export function nullLiteralTypeAnnotation(): BabelNodeNullLiteralTypeAnnotation;
  declare export function classImplements(id: BabelNodeIdentifier, typeParameters?: BabelNodeTypeParameterInstantiation): BabelNodeClassImplements;
  declare export function declareClass(id: BabelNodeIdentifier, typeParameters?: BabelNodeTypeParameterDeclaration, _extends?: Array<BabelNodeInterfaceExtends>, body: BabelNodeObjectTypeAnnotation): BabelNodeDeclareClass;
  declare export function declareFunction(id: BabelNodeIdentifier): BabelNodeDeclareFunction;
  declare export function declareInterface(id: BabelNodeIdentifier, typeParameters?: BabelNodeTypeParameterDeclaration, _extends?: Array<BabelNodeInterfaceExtends>, body: BabelNodeObjectTypeAnnotation): BabelNodeDeclareInterface;
  declare export function declareModule(id: BabelNodeIdentifier | BabelNodeStringLiteral, body: BabelNodeBlockStatement, kind?: "CommonJS" | "ES"): BabelNodeDeclareModule;
  declare export function declareModuleExports(typeAnnotation: BabelNodeTypeAnnotation): BabelNodeDeclareModuleExports;
  declare export function declareTypeAlias(id: BabelNodeIdentifier, typeParameters?: BabelNodeTypeParameterDeclaration, right: BabelNodeFlowType): BabelNodeDeclareTypeAlias;
  declare export function declareOpaqueType(id: BabelNodeIdentifier, typeParameters?: BabelNodeTypeParameterDeclaration, supertype?: BabelNodeFlowType): BabelNodeDeclareOpaqueType;
  declare export function declareVariable(id: BabelNodeIdentifier): BabelNodeDeclareVariable;
  declare export function declareExportDeclaration(declaration?: BabelNodeFlow, specifiers?: Array<BabelNodeExportSpecifier | BabelNodeExportNamespaceSpecifier>, source?: BabelNodeStringLiteral, attributes?: Array<BabelNodeImportAttribute>): BabelNodeDeclareExportDeclaration;
  declare export function declareExportAllDeclaration(source: BabelNodeStringLiteral, attributes?: Array<BabelNodeImportAttribute>): BabelNodeDeclareExportAllDeclaration;
  declare export function declaredPredicate(value: BabelNodeFlow): BabelNodeDeclaredPredicate;
  declare export function existsTypeAnnotation(): BabelNodeExistsTypeAnnotation;
  declare export function functionTypeAnnotation(typeParameters?: BabelNodeTypeParameterDeclaration, params: Array<BabelNodeFunctionTypeParam>, rest?: BabelNodeFunctionTypeParam, returnType: BabelNodeFlowType): BabelNodeFunctionTypeAnnotation;
  declare export function functionTypeParam(name?: BabelNodeIdentifier, typeAnnotation: BabelNodeFlowType): BabelNodeFunctionTypeParam;
  declare export function genericTypeAnnotation(id: BabelNodeIdentifier | BabelNodeQualifiedTypeIdentifier, typeParameters?: BabelNodeTypeParameterInstantiation): BabelNodeGenericTypeAnnotation;
  declare export function inferredPredicate(): BabelNodeInferredPredicate;
  declare export function interfaceExtends(id: BabelNodeIdentifier | BabelNodeQualifiedTypeIdentifier, typeParameters?: BabelNodeTypeParameterInstantiation): BabelNodeInterfaceExtends;
  declare export function interfaceDeclaration(id: BabelNodeIdentifier, typeParameters?: BabelNodeTypeParameterDeclaration, _extends?: Array<BabelNodeInterfaceExtends>, body: BabelNodeObjectTypeAnnotation): BabelNodeInterfaceDeclaration;
  declare export function interfaceTypeAnnotation(_extends?: Array<BabelNodeInterfaceExtends>, body: BabelNodeObjectTypeAnnotation): BabelNodeInterfaceTypeAnnotation;
  declare export function intersectionTypeAnnotation(types: Array<BabelNodeFlowType>): BabelNodeIntersectionTypeAnnotation;
  declare export function mixedTypeAnnotation(): BabelNodeMixedTypeAnnotation;
  declare export function emptyTypeAnnotation(): BabelNodeEmptyTypeAnnotation;
  declare export function nullableTypeAnnotation(typeAnnotation: BabelNodeFlowType): BabelNodeNullableTypeAnnotation;
  declare export function numberLiteralTypeAnnotation(value: number): BabelNodeNumberLiteralTypeAnnotation;
  declare export function numberTypeAnnotation(): BabelNodeNumberTypeAnnotation;
  declare export function objectTypeAnnotation(properties: Array<BabelNodeObjectTypeProperty | BabelNodeObjectTypeSpreadProperty>, indexers?: Array<BabelNodeObjectTypeIndexer>, callProperties?: Array<BabelNodeObjectTypeCallProperty>, internalSlots?: Array<BabelNodeObjectTypeInternalSlot>, exact?: boolean): BabelNodeObjectTypeAnnotation;
  declare export function objectTypeInternalSlot(id: BabelNodeIdentifier, value: BabelNodeFlowType, optional: boolean, _static: boolean, method: boolean): BabelNodeObjectTypeInternalSlot;
  declare export function objectTypeCallProperty(value: BabelNodeFlowType): BabelNodeObjectTypeCallProperty;
  declare export function objectTypeIndexer(id?: BabelNodeIdentifier, key: BabelNodeFlowType, value: BabelNodeFlowType, variance?: BabelNodeVariance): BabelNodeObjectTypeIndexer;
  declare export function objectTypeProperty(key: BabelNodeIdentifier | BabelNodeStringLiteral, value: BabelNodeFlowType, variance?: BabelNodeVariance): BabelNodeObjectTypeProperty;
  declare export function objectTypeSpreadProperty(argument: BabelNodeFlowType): BabelNodeObjectTypeSpreadProperty;
  declare export function opaqueType(id: BabelNodeIdentifier, typeParameters?: BabelNodeTypeParameterDeclaration, supertype?: BabelNodeFlowType, impltype: BabelNodeFlowType): BabelNodeOpaqueType;
  declare export function qualifiedTypeIdentifier(id: BabelNodeIdentifier, qualification: BabelNodeIdentifier | BabelNodeQualifiedTypeIdentifier): BabelNodeQualifiedTypeIdentifier;
  declare export function stringLiteralTypeAnnotation(value: string): BabelNodeStringLiteralTypeAnnotation;
  declare export function stringTypeAnnotation(): BabelNodeStringTypeAnnotation;
  declare export function symbolTypeAnnotation(): BabelNodeSymbolTypeAnnotation;
  declare export function thisTypeAnnotation(): BabelNodeThisTypeAnnotation;
  declare export function tupleTypeAnnotation(types: Array<BabelNodeFlowType>): BabelNodeTupleTypeAnnotation;
  declare export function typeofTypeAnnotation(argument: BabelNodeFlowType): BabelNodeTypeofTypeAnnotation;
  declare export function typeAlias(id: BabelNodeIdentifier, typeParameters?: BabelNodeTypeParameterDeclaration, right: BabelNodeFlowType): BabelNodeTypeAlias;
  declare export function typeAnnotation(typeAnnotation: BabelNodeFlowType): BabelNodeTypeAnnotation;
  declare export function typeCastExpression(expression: BabelNodeExpression, typeAnnotation: BabelNodeTypeAnnotation): BabelNodeTypeCastExpression;
  declare export function typeParameter(bound?: BabelNodeTypeAnnotation, _default?: BabelNodeFlowType, variance?: BabelNodeVariance): BabelNodeTypeParameter;
  declare export function typeParameterDeclaration(params: Array<BabelNodeTypeParameter>): BabelNodeTypeParameterDeclaration;
  declare export function typeParameterInstantiation(params: Array<BabelNodeFlowType>): BabelNodeTypeParameterInstantiation;
  declare export function unionTypeAnnotation(types: Array<BabelNodeFlowType>): BabelNodeUnionTypeAnnotation;
  declare export function variance(kind: "minus" | "plus"): BabelNodeVariance;
  declare export function voidTypeAnnotation(): BabelNodeVoidTypeAnnotation;
  declare export function enumDeclaration(id: BabelNodeIdentifier, body: BabelNodeEnumBooleanBody | BabelNodeEnumNumberBody | BabelNodeEnumStringBody | BabelNodeEnumSymbolBody): BabelNodeEnumDeclaration;
  declare export function enumBooleanBody(members: Array<BabelNodeEnumBooleanMember>): BabelNodeEnumBooleanBody;
  declare export function enumNumberBody(members: Array<BabelNodeEnumNumberMember>): BabelNodeEnumNumberBody;
  declare export function enumStringBody(members: Array<BabelNodeEnumStringMember | BabelNodeEnumDefaultedMember>): BabelNodeEnumStringBody;
  declare export function enumSymbolBody(members: Array<BabelNodeEnumDefaultedMember>): BabelNodeEnumSymbolBody;
  declare export function enumBooleanMember(id: BabelNodeIdentifier): BabelNodeEnumBooleanMember;
  declare export function enumNumberMember(id: BabelNodeIdentifier, init: BabelNodeNumericLiteral): BabelNodeEnumNumberMember;
  declare export function enumStringMember(id: BabelNodeIdentifier, init: BabelNodeStringLiteral): BabelNodeEnumStringMember;
  declare export function enumDefaultedMember(id: BabelNodeIdentifier): BabelNodeEnumDefaultedMember;
  declare export function indexedAccessType(objectType: BabelNodeFlowType, indexType: BabelNodeFlowType): BabelNodeIndexedAccessType;
  declare export function optionalIndexedAccessType(objectType: BabelNodeFlowType, indexType: BabelNodeFlowType): BabelNodeOptionalIndexedAccessType;
  declare export function jsxAttribute(name: BabelNodeJSXIdentifier | BabelNodeJSXNamespacedName, value?: BabelNodeJSXElement | BabelNodeJSXFragment | BabelNodeStringLiteral | BabelNodeJSXExpressionContainer): BabelNodeJSXAttribute;
  declare export function jsxClosingElement(name: BabelNodeJSXIdentifier | BabelNodeJSXMemberExpression | BabelNodeJSXNamespacedName): BabelNodeJSXClosingElement;
  declare export function jsxElement(openingElement: BabelNodeJSXOpeningElement, closingElement?: BabelNodeJSXClosingElement, children: Array<BabelNodeJSXText | BabelNodeJSXExpressionContainer | BabelNodeJSXSpreadChild | BabelNodeJSXElement | BabelNodeJSXFragment>, selfClosing?: boolean): BabelNodeJSXElement;
  declare export function jsxEmptyExpression(): BabelNodeJSXEmptyExpression;
  declare export function jsxExpressionContainer(expression: BabelNodeExpression | BabelNodeJSXEmptyExpression): BabelNodeJSXExpressionContainer;
  declare export function jsxSpreadChild(expression: BabelNodeExpression): BabelNodeJSXSpreadChild;
  declare export function jsxIdentifier(name: string): BabelNodeJSXIdentifier;
  declare export function jsxMemberExpression(object: BabelNodeJSXMemberExpression | BabelNodeJSXIdentifier, property: BabelNodeJSXIdentifier): BabelNodeJSXMemberExpression;
  declare export function jsxNamespacedName(namespace: BabelNodeJSXIdentifier, name: BabelNodeJSXIdentifier): BabelNodeJSXNamespacedName;
  declare export function jsxOpeningElement(name: BabelNodeJSXIdentifier | BabelNodeJSXMemberExpression | BabelNodeJSXNamespacedName, attributes: Array<BabelNodeJSXAttribute | BabelNodeJSXSpreadAttribute>, selfClosing?: boolean): BabelNodeJSXOpeningElement;
  declare export function jsxSpreadAttribute(argument: BabelNodeExpression): BabelNodeJSXSpreadAttribute;
  declare export function jsxText(value: string): BabelNodeJSXText;
  declare export function jsxFragment(openingFragment: BabelNodeJSXOpeningFragment, closingFragment: BabelNodeJSXClosingFragment, children: Array<BabelNodeJSXText | BabelNodeJSXExpressionContainer | BabelNodeJSXSpreadChild | BabelNodeJSXElement | BabelNodeJSXFragment>): BabelNodeJSXFragment;
  declare export function jsxOpeningFragment(): BabelNodeJSXOpeningFragment;
  declare export function jsxClosingFragment(): BabelNodeJSXClosingFragment;
  declare export function noop(): BabelNodeNoop;
  declare export function placeholder(expectedNode: "Identifier" | "StringLiteral" | "Expression" | "Statement" | "Declaration" | "BlockStatement" | "ClassBody" | "Pattern", name: BabelNodeIdentifier): BabelNodePlaceholder;
  declare export function v8IntrinsicIdentifier(name: string): BabelNodeV8IntrinsicIdentifier;
  declare export function argumentPlaceholder(): BabelNodeArgumentPlaceholder;
  declare export function bindExpression(object: BabelNodeExpression, callee: BabelNodeExpression): BabelNodeBindExpression;
  declare export function decorator(expression: BabelNodeExpression): BabelNodeDecorator;
  declare export function doExpression(body: BabelNodeBlockStatement, async?: boolean): BabelNodeDoExpression;
  declare export function exportDefaultSpecifier(exported: BabelNodeIdentifier): BabelNodeExportDefaultSpecifier;
  declare export function recordExpression(properties: Array<BabelNodeObjectProperty | BabelNodeSpreadElement>): BabelNodeRecordExpression;
  declare export function tupleExpression(elements?: Array<BabelNodeExpression | BabelNodeSpreadElement>): BabelNodeTupleExpression;
  declare export function decimalLiteral(value: string): BabelNodeDecimalLiteral;
  declare export function moduleExpression(body: BabelNodeProgram): BabelNodeModuleExpression;
  declare export function topicReference(): BabelNodeTopicReference;
  declare export function pipelineTopicExpression(expression: BabelNodeExpression): BabelNodePipelineTopicExpression;
  declare export function pipelineBareFunction(callee: BabelNodeExpression): BabelNodePipelineBareFunction;
  declare export function pipelinePrimaryTopicReference(): BabelNodePipelinePrimaryTopicReference;
  declare export function voidPattern(): BabelNodeVoidPattern;
  declare export function tsParameterProperty(parameter: BabelNodeIdentifier | BabelNodeAssignmentPattern): BabelNodeTSParameterProperty;
  declare export function tsDeclareFunction(id?: BabelNodeIdentifier, typeParameters?: BabelNodeTSTypeParameterDeclaration | BabelNodeNoop, params: Array<BabelNodeFunctionParameter>, returnType?: BabelNodeTSTypeAnnotation | BabelNodeNoop): BabelNodeTSDeclareFunction;
  declare export function tsDeclareMethod(decorators?: Array<BabelNodeDecorator>, key: BabelNodeIdentifier | BabelNodeStringLiteral | BabelNodeNumericLiteral | BabelNodeBigIntLiteral | BabelNodeExpression, typeParameters?: BabelNodeTSTypeParameterDeclaration | BabelNodeNoop, params: Array<BabelNodeFunctionParameter | BabelNodeTSParameterProperty>, returnType?: BabelNodeTSTypeAnnotation | BabelNodeNoop): BabelNodeTSDeclareMethod;
  declare export function tsQualifiedName(left: BabelNodeTSEntityName, right: BabelNodeIdentifier): BabelNodeTSQualifiedName;
  declare export function tsCallSignatureDeclaration(typeParameters?: BabelNodeTSTypeParameterDeclaration, parameters: Array<BabelNodeArrayPattern | BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeRestElement>, typeAnnotation?: BabelNodeTSTypeAnnotation): BabelNodeTSCallSignatureDeclaration;
  declare export function tsConstructSignatureDeclaration(typeParameters?: BabelNodeTSTypeParameterDeclaration, parameters: Array<BabelNodeArrayPattern | BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeRestElement>, typeAnnotation?: BabelNodeTSTypeAnnotation): BabelNodeTSConstructSignatureDeclaration;
  declare export function tsPropertySignature(key: BabelNodeExpression, typeAnnotation?: BabelNodeTSTypeAnnotation): BabelNodeTSPropertySignature;
  declare export function tsMethodSignature(key: BabelNodeExpression, typeParameters?: BabelNodeTSTypeParameterDeclaration, parameters: Array<BabelNodeArrayPattern | BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeRestElement>, typeAnnotation?: BabelNodeTSTypeAnnotation): BabelNodeTSMethodSignature;
  declare export function tsIndexSignature(parameters: Array<BabelNodeIdentifier>, typeAnnotation?: BabelNodeTSTypeAnnotation): BabelNodeTSIndexSignature;
  declare export function tsAnyKeyword(): BabelNodeTSAnyKeyword;
  declare export function tsBooleanKeyword(): BabelNodeTSBooleanKeyword;
  declare export function tsBigIntKeyword(): BabelNodeTSBigIntKeyword;
  declare export function tsIntrinsicKeyword(): BabelNodeTSIntrinsicKeyword;
  declare export function tsNeverKeyword(): BabelNodeTSNeverKeyword;
  declare export function tsNullKeyword(): BabelNodeTSNullKeyword;
  declare export function tsNumberKeyword(): BabelNodeTSNumberKeyword;
  declare export function tsObjectKeyword(): BabelNodeTSObjectKeyword;
  declare export function tsStringKeyword(): BabelNodeTSStringKeyword;
  declare export function tsSymbolKeyword(): BabelNodeTSSymbolKeyword;
  declare export function tsUndefinedKeyword(): BabelNodeTSUndefinedKeyword;
  declare export function tsUnknownKeyword(): BabelNodeTSUnknownKeyword;
  declare export function tsVoidKeyword(): BabelNodeTSVoidKeyword;
  declare export function tsThisType(): BabelNodeTSThisType;
  declare export function tsFunctionType(typeParameters?: BabelNodeTSTypeParameterDeclaration, parameters: Array<BabelNodeArrayPattern | BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeRestElement>, typeAnnotation?: BabelNodeTSTypeAnnotation): BabelNodeTSFunctionType;
  declare export function tsConstructorType(typeParameters?: BabelNodeTSTypeParameterDeclaration, parameters: Array<BabelNodeArrayPattern | BabelNodeIdentifier | BabelNodeObjectPattern | BabelNodeRestElement>, typeAnnotation?: BabelNodeTSTypeAnnotation): BabelNodeTSConstructorType;
  declare export function tsTypeReference(typeName: BabelNodeTSEntityName, typeParameters?: BabelNodeTSTypeParameterInstantiation): BabelNodeTSTypeReference;
  declare export function tsTypePredicate(parameterName: BabelNodeIdentifier | BabelNodeTSThisType, typeAnnotation?: BabelNodeTSTypeAnnotation, asserts?: boolean): BabelNodeTSTypePredicate;
  declare export function tsTypeQuery(exprName: BabelNodeTSEntityName | BabelNodeTSImportType, typeParameters?: BabelNodeTSTypeParameterInstantiation): BabelNodeTSTypeQuery;
  declare export function tsTypeLiteral(members: Array<BabelNodeTSTypeElement>): BabelNodeTSTypeLiteral;
  declare export function tsArrayType(elementType: BabelNodeTSType): BabelNodeTSArrayType;
  declare export function tsTupleType(elementTypes: Array<BabelNodeTSType | BabelNodeTSNamedTupleMember>): BabelNodeTSTupleType;
  declare export function tsOptionalType(typeAnnotation: BabelNodeTSType): BabelNodeTSOptionalType;
  declare export function tsRestType(typeAnnotation: BabelNodeTSType): BabelNodeTSRestType;
  declare export function tsNamedTupleMember(label: BabelNodeIdentifier, elementType: BabelNodeTSType, optional?: boolean): BabelNodeTSNamedTupleMember;
  declare export function tsUnionType(types: Array<BabelNodeTSType>): BabelNodeTSUnionType;
  declare export function tsIntersectionType(types: Array<BabelNodeTSType>): BabelNodeTSIntersectionType;
  declare export function tsConditionalType(checkType: BabelNodeTSType, extendsType: BabelNodeTSType, trueType: BabelNodeTSType, falseType: BabelNodeTSType): BabelNodeTSConditionalType;
  declare export function tsInferType(typeParameter: BabelNodeTSTypeParameter): BabelNodeTSInferType;
  declare export function tsParenthesizedType(typeAnnotation: BabelNodeTSType): BabelNodeTSParenthesizedType;
  declare export function tsTypeOperator(typeAnnotation: BabelNodeTSType, operator?: string): BabelNodeTSTypeOperator;
  declare export function tsIndexedAccessType(objectType: BabelNodeTSType, indexType: BabelNodeTSType): BabelNodeTSIndexedAccessType;
  declare export function tsMappedType(typeParameter: BabelNodeTSTypeParameter, typeAnnotation?: BabelNodeTSType, nameType?: BabelNodeTSType): BabelNodeTSMappedType;
  declare export function tsTemplateLiteralType(quasis: Array<BabelNodeTemplateElement>, types: Array<BabelNodeTSType>): BabelNodeTSTemplateLiteralType;
  declare export function tsLiteralType(literal: BabelNodeNumericLiteral | BabelNodeStringLiteral | BabelNodeBooleanLiteral | BabelNodeBigIntLiteral | BabelNodeTemplateLiteral | BabelNodeUnaryExpression): BabelNodeTSLiteralType;
  declare export function tsExpressionWithTypeArguments(expression: BabelNodeTSEntityName, typeParameters?: BabelNodeTSTypeParameterInstantiation): BabelNodeTSExpressionWithTypeArguments;
  declare export function tsInterfaceDeclaration(id: BabelNodeIdentifier, typeParameters?: BabelNodeTSTypeParameterDeclaration, _extends?: Array<BabelNodeTSExpressionWithTypeArguments>, body: BabelNodeTSInterfaceBody): BabelNodeTSInterfaceDeclaration;
  declare export function tsInterfaceBody(body: Array<BabelNodeTSTypeElement>): BabelNodeTSInterfaceBody;
  declare export function tsTypeAliasDeclaration(id: BabelNodeIdentifier, typeParameters?: BabelNodeTSTypeParameterDeclaration, typeAnnotation: BabelNodeTSType): BabelNodeTSTypeAliasDeclaration;
  declare export function tsInstantiationExpression(expression: BabelNodeExpression, typeParameters?: BabelNodeTSTypeParameterInstantiation): BabelNodeTSInstantiationExpression;
  declare export function tsAsExpression(expression: BabelNodeExpression, typeAnnotation: BabelNodeTSType): BabelNodeTSAsExpression;
  declare export function tsSatisfiesExpression(expression: BabelNodeExpression, typeAnnotation: BabelNodeTSType): BabelNodeTSSatisfiesExpression;
  declare export function tsTypeAssertion(typeAnnotation: BabelNodeTSType, expression: BabelNodeExpression): BabelNodeTSTypeAssertion;
  declare export function tsEnumBody(members: Array<BabelNodeTSEnumMember>): BabelNodeTSEnumBody;
  declare export function tsEnumDeclaration(id: BabelNodeIdentifier, members: Array<BabelNodeTSEnumMember>): BabelNodeTSEnumDeclaration;
  declare export function tsEnumMember(id: BabelNodeIdentifier | BabelNodeStringLiteral, initializer?: BabelNodeExpression): BabelNodeTSEnumMember;
  declare export function tsModuleDeclaration(id: BabelNodeIdentifier | BabelNodeStringLiteral, body: BabelNodeTSModuleBlock | BabelNodeTSModuleDeclaration): BabelNodeTSModuleDeclaration;
  declare export function tsModuleBlock(body: Array<BabelNodeStatement>): BabelNodeTSModuleBlock;
  declare export function tsImportType(argument: BabelNodeStringLiteral, qualifier?: BabelNodeTSEntityName, typeParameters?: BabelNodeTSTypeParameterInstantiation): BabelNodeTSImportType;
  declare export function tsImportEqualsDeclaration(id: BabelNodeIdentifier, moduleReference: BabelNodeTSEntityName | BabelNodeTSExternalModuleReference): BabelNodeTSImportEqualsDeclaration;
  declare export function tsExternalModuleReference(expression: BabelNodeStringLiteral): BabelNodeTSExternalModuleReference;
  declare export function tsNonNullExpression(expression: BabelNodeExpression): BabelNodeTSNonNullExpression;
  declare export function tsExportAssignment(expression: BabelNodeExpression): BabelNodeTSExportAssignment;
  declare export function tsNamespaceExportDeclaration(id: BabelNodeIdentifier): BabelNodeTSNamespaceExportDeclaration;
  declare export function tsTypeAnnotation(typeAnnotation: BabelNodeTSType): BabelNodeTSTypeAnnotation;
  declare export function tsTypeParameterInstantiation(params: Array<BabelNodeTSType>): BabelNodeTSTypeParameterInstantiation;
  declare export function tsTypeParameterDeclaration(params: Array<BabelNodeTSTypeParameter>): BabelNodeTSTypeParameterDeclaration;
  declare export function tsTypeParameter(constraint?: BabelNodeTSType, _default?: BabelNodeTSType, name: string): BabelNodeTSTypeParameter;
  declare export function isArrayExpression(node: ?Object, opts?: ?Object): node is ArrayExpression;
  declare export function isAssignmentExpression(node: ?Object, opts?: ?Object): node is AssignmentExpression;
  declare export function isBinaryExpression(node: ?Object, opts?: ?Object): node is BinaryExpression;
  declare export function isInterpreterDirective(node: ?Object, opts?: ?Object): node is InterpreterDirective;
  declare export function isDirective(node: ?Object, opts?: ?Object): node is Directive;
  declare export function isDirectiveLiteral(node: ?Object, opts?: ?Object): node is DirectiveLiteral;
  declare export function isBlockStatement(node: ?Object, opts?: ?Object): node is BlockStatement;
  declare export function isBreakStatement(node: ?Object, opts?: ?Object): node is BreakStatement;
  declare export function isCallExpression(node: ?Object, opts?: ?Object): node is CallExpression;
  declare export function isCatchClause(node: ?Object, opts?: ?Object): node is CatchClause;
  declare export function isConditionalExpression(node: ?Object, opts?: ?Object): node is ConditionalExpression;
  declare export function isContinueStatement(node: ?Object, opts?: ?Object): node is ContinueStatement;
  declare export function isDebuggerStatement(node: ?Object, opts?: ?Object): node is DebuggerStatement;
  declare export function isDoWhileStatement(node: ?Object, opts?: ?Object): node is DoWhileStatement;
  declare export function isEmptyStatement(node: ?Object, opts?: ?Object): node is EmptyStatement;
  declare export function isExpressionStatement(node: ?Object, opts?: ?Object): node is ExpressionStatement;
  declare export function isFile(node: ?Object, opts?: ?Object): node is File;
  declare export function isForInStatement(node: ?Object, opts?: ?Object): node is ForInStatement;
  declare export function isForStatement(node: ?Object, opts?: ?Object): node is ForStatement;
  declare export function isFunctionDeclaration(node: ?Object, opts?: ?Object): node is FunctionDeclaration;
  declare export function isFunctionExpression(node: ?Object, opts?: ?Object): node is FunctionExpression;
  declare export function isIdentifier(node: ?Object, opts?: ?Object): node is Identifier;
  declare export function isIfStatement(node: ?Object, opts?: ?Object): node is IfStatement;
  declare export function isLabeledStatement(node: ?Object, opts?: ?Object): node is LabeledStatement;
  declare export function isStringLiteral(node: ?Object, opts?: ?Object): node is StringLiteral;
  declare export function isNumericLiteral(node: ?Object, opts?: ?Object): node is NumericLiteral;
  declare export function isNullLiteral(node: ?Object, opts?: ?Object): node is NullLiteral;
  declare export function isBooleanLiteral(node: ?Object, opts?: ?Object): node is BooleanLiteral;
  declare export function isRegExpLiteral(node: ?Object, opts?: ?Object): node is RegExpLiteral;
  declare export function isLogicalExpression(node: ?Object, opts?: ?Object): node is LogicalExpression;
  declare export function isMemberExpression(node: ?Object, opts?: ?Object): node is MemberExpression;
  declare export function isNewExpression(node: ?Object, opts?: ?Object): node is NewExpression;
  declare export function isProgram(node: ?Object, opts?: ?Object): node is Program;
  declare export function isObjectExpression(node: ?Object, opts?: ?Object): node is ObjectExpression;
  declare export function isObjectMethod(node: ?Object, opts?: ?Object): node is ObjectMethod;
  declare export function isObjectProperty(node: ?Object, opts?: ?Object): node is ObjectProperty;
  declare export function isRestElement(node: ?Object, opts?: ?Object): node is RestElement;
  declare export function isReturnStatement(node: ?Object, opts?: ?Object): node is ReturnStatement;
  declare export function isSequenceExpression(node: ?Object, opts?: ?Object): node is SequenceExpression;
  declare export function isParenthesizedExpression(node: ?Object, opts?: ?Object): node is ParenthesizedExpression;
  declare export function isSwitchCase(node: ?Object, opts?: ?Object): node is SwitchCase;
  declare export function isSwitchStatement(node: ?Object, opts?: ?Object): node is SwitchStatement;
  declare export function isThisExpression(node: ?Object, opts?: ?Object): node is ThisExpression;
  declare export function isThrowStatement(node: ?Object, opts?: ?Object): node is ThrowStatement;
  declare export function isTryStatement(node: ?Object, opts?: ?Object): node is TryStatement;
  declare export function isUnaryExpression(node: ?Object, opts?: ?Object): node is UnaryExpression;
  declare export function isUpdateExpression(node: ?Object, opts?: ?Object): node is UpdateExpression;
  declare export function isVariableDeclaration(node: ?Object, opts?: ?Object): node is VariableDeclaration;
  declare export function isVariableDeclarator(node: ?Object, opts?: ?Object): node is VariableDeclarator;
  declare export function isWhileStatement(node: ?Object, opts?: ?Object): node is WhileStatement;
  declare export function isWithStatement(node: ?Object, opts?: ?Object): node is WithStatement;
  declare export function isAssignmentPattern(node: ?Object, opts?: ?Object): node is AssignmentPattern;
  declare export function isArrayPattern(node: ?Object, opts?: ?Object): node is ArrayPattern;
  declare export function isArrowFunctionExpression(node: ?Object, opts?: ?Object): node is ArrowFunctionExpression;
  declare export function isClassBody(node: ?Object, opts?: ?Object): node is ClassBody;
  declare export function isClassExpression(node: ?Object, opts?: ?Object): node is ClassExpression;
  declare export function isClassDeclaration(node: ?Object, opts?: ?Object): node is ClassDeclaration;
  declare export function isExportAllDeclaration(node: ?Object, opts?: ?Object): node is ExportAllDeclaration;
  declare export function isExportDefaultDeclaration(node: ?Object, opts?: ?Object): node is ExportDefaultDeclaration;
  declare export function isExportNamedDeclaration(node: ?Object, opts?: ?Object): node is ExportNamedDeclaration;
  declare export function isExportSpecifier(node: ?Object, opts?: ?Object): node is ExportSpecifier;
  declare export function isForOfStatement(node: ?Object, opts?: ?Object): node is ForOfStatement;
  declare export function isImportDeclaration(node: ?Object, opts?: ?Object): node is ImportDeclaration;
  declare export function isImportDefaultSpecifier(node: ?Object, opts?: ?Object): node is ImportDefaultSpecifier;
  declare export function isImportNamespaceSpecifier(node: ?Object, opts?: ?Object): node is ImportNamespaceSpecifier;
  declare export function isImportSpecifier(node: ?Object, opts?: ?Object): node is ImportSpecifier;
  declare export function isImportExpression(node: ?Object, opts?: ?Object): node is ImportExpression;
  declare export function isMetaProperty(node: ?Object, opts?: ?Object): node is MetaProperty;
  declare export function isClassMethod(node: ?Object, opts?: ?Object): node is ClassMethod;
  declare export function isObjectPattern(node: ?Object, opts?: ?Object): node is ObjectPattern;
  declare export function isSpreadElement(node: ?Object, opts?: ?Object): node is SpreadElement;
  declare export function isSuper(node: ?Object, opts?: ?Object): node is Super;
  declare export function isTaggedTemplateExpression(node: ?Object, opts?: ?Object): node is TaggedTemplateExpression;
  declare export function isTemplateElement(node: ?Object, opts?: ?Object): node is TemplateElement;
  declare export function isTemplateLiteral(node: ?Object, opts?: ?Object): node is TemplateLiteral;
  declare export function isYieldExpression(node: ?Object, opts?: ?Object): node is YieldExpression;
  declare export function isAwaitExpression(node: ?Object, opts?: ?Object): node is AwaitExpression;
  declare export function isImport(node: ?Object, opts?: ?Object): node is Import;
  declare export function isBigIntLiteral(node: ?Object, opts?: ?Object): node is BigIntLiteral;
  declare export function isExportNamespaceSpecifier(node: ?Object, opts?: ?Object): node is ExportNamespaceSpecifier;
  declare export function isOptionalMemberExpression(node: ?Object, opts?: ?Object): node is OptionalMemberExpression;
  declare export function isOptionalCallExpression(node: ?Object, opts?: ?Object): node is OptionalCallExpression;
  declare export function isClassProperty(node: ?Object, opts?: ?Object): node is ClassProperty;
  declare export function isClassAccessorProperty(node: ?Object, opts?: ?Object): node is ClassAccessorProperty;
  declare export function isClassPrivateProperty(node: ?Object, opts?: ?Object): node is ClassPrivateProperty;
  declare export function isClassPrivateMethod(node: ?Object, opts?: ?Object): node is ClassPrivateMethod;
  declare export function isPrivateName(node: ?Object, opts?: ?Object): node is PrivateName;
  declare export function isStaticBlock(node: ?Object, opts?: ?Object): node is StaticBlock;
  declare export function isImportAttribute(node: ?Object, opts?: ?Object): node is ImportAttribute;
  declare export function isAnyTypeAnnotation(node: ?Object, opts?: ?Object): node is AnyTypeAnnotation;
  declare export function isArrayTypeAnnotation(node: ?Object, opts?: ?Object): node is ArrayTypeAnnotation;
  declare export function isBooleanTypeAnnotation(node: ?Object, opts?: ?Object): node is BooleanTypeAnnotation;
  declare export function isBooleanLiteralTypeAnnotation(node: ?Object, opts?: ?Object): node is BooleanLiteralTypeAnnotation;
  declare export function isNullLiteralTypeAnnotation(node: ?Object, opts?: ?Object): node is NullLiteralTypeAnnotation;
  declare export function isClassImplements(node: ?Object, opts?: ?Object): node is ClassImplements;
  declare export function isDeclareClass(node: ?Object, opts?: ?Object): node is DeclareClass;
  declare export function isDeclareFunction(node: ?Object, opts?: ?Object): node is DeclareFunction;
  declare export function isDeclareInterface(node: ?Object, opts?: ?Object): node is DeclareInterface;
  declare export function isDeclareModule(node: ?Object, opts?: ?Object): node is DeclareModule;
  declare export function isDeclareModuleExports(node: ?Object, opts?: ?Object): node is DeclareModuleExports;
  declare export function isDeclareTypeAlias(node: ?Object, opts?: ?Object): node is DeclareTypeAlias;
  declare export function isDeclareOpaqueType(node: ?Object, opts?: ?Object): node is DeclareOpaqueType;
  declare export function isDeclareVariable(node: ?Object, opts?: ?Object): node is DeclareVariable;
  declare export function isDeclareExportDeclaration(node: ?Object, opts?: ?Object): node is DeclareExportDeclaration;
  declare export function isDeclareExportAllDeclaration(node: ?Object, opts?: ?Object): node is DeclareExportAllDeclaration;
  declare export function isDeclaredPredicate(node: ?Object, opts?: ?Object): node is DeclaredPredicate;
  declare export function isExistsTypeAnnotation(node: ?Object, opts?: ?Object): node is ExistsTypeAnnotation;
  declare export function isFunctionTypeAnnotation(node: ?Object, opts?: ?Object): node is FunctionTypeAnnotation;
  declare export function isFunctionTypeParam(node: ?Object, opts?: ?Object): node is FunctionTypeParam;
  declare export function isGenericTypeAnnotation(node: ?Object, opts?: ?Object): node is GenericTypeAnnotation;
  declare export function isInferredPredicate(node: ?Object, opts?: ?Object): node is InferredPredicate;
  declare export function isInterfaceExtends(node: ?Object, opts?: ?Object): node is InterfaceExtends;
  declare export function isInterfaceDeclaration(node: ?Object, opts?: ?Object): node is InterfaceDeclaration;
  declare export function isInterfaceTypeAnnotation(node: ?Object, opts?: ?Object): node is InterfaceTypeAnnotation;
  declare export function isIntersectionTypeAnnotation(node: ?Object, opts?: ?Object): node is IntersectionTypeAnnotation;
  declare export function isMixedTypeAnnotation(node: ?Object, opts?: ?Object): node is MixedTypeAnnotation;
  declare export function isEmptyTypeAnnotation(node: ?Object, opts?: ?Object): node is EmptyTypeAnnotation;
  declare export function isNullableTypeAnnotation(node: ?Object, opts?: ?Object): node is NullableTypeAnnotation;
  declare export function isNumberLiteralTypeAnnotation(node: ?Object, opts?: ?Object): node is NumberLiteralTypeAnnotation;
  declare export function isNumberTypeAnnotation(node: ?Object, opts?: ?Object): node is NumberTypeAnnotation;
  declare export function isObjectTypeAnnotation(node: ?Object, opts?: ?Object): node is ObjectTypeAnnotation;
  declare export function isObjectTypeInternalSlot(node: ?Object, opts?: ?Object): node is ObjectTypeInternalSlot;
  declare export function isObjectTypeCallProperty(node: ?Object, opts?: ?Object): node is ObjectTypeCallProperty;
  declare export function isObjectTypeIndexer(node: ?Object, opts?: ?Object): node is ObjectTypeIndexer;
  declare export function isObjectTypeProperty(node: ?Object, opts?: ?Object): node is ObjectTypeProperty;
  declare export function isObjectTypeSpreadProperty(node: ?Object, opts?: ?Object): node is ObjectTypeSpreadProperty;
  declare export function isOpaqueType(node: ?Object, opts?: ?Object): node is OpaqueType;
  declare export function isQualifiedTypeIdentifier(node: ?Object, opts?: ?Object): node is QualifiedTypeIdentifier;
  declare export function isStringLiteralTypeAnnotation(node: ?Object, opts?: ?Object): node is StringLiteralTypeAnnotation;
  declare export function isStringTypeAnnotation(node: ?Object, opts?: ?Object): node is StringTypeAnnotation;
  declare export function isSymbolTypeAnnotation(node: ?Object, opts?: ?Object): node is SymbolTypeAnnotation;
  declare export function isThisTypeAnnotation(node: ?Object, opts?: ?Object): node is ThisTypeAnnotation;
  declare export function isTupleTypeAnnotation(node: ?Object, opts?: ?Object): node is TupleTypeAnnotation;
  declare export function isTypeofTypeAnnotation(node: ?Object, opts?: ?Object): node is TypeofTypeAnnotation;
  declare export function isTypeAlias(node: ?Object, opts?: ?Object): node is TypeAlias;
  declare export function isTypeAnnotation(node: ?Object, opts?: ?Object): node is TypeAnnotation;
  declare export function isTypeCastExpression(node: ?Object, opts?: ?Object): node is TypeCastExpression;
  declare export function isTypeParameter(node: ?Object, opts?: ?Object): node is TypeParameter;
  declare export function isTypeParameterDeclaration(node: ?Object, opts?: ?Object): node is TypeParameterDeclaration;
  declare export function isTypeParameterInstantiation(node: ?Object, opts?: ?Object): node is TypeParameterInstantiation;
  declare export function isUnionTypeAnnotation(node: ?Object, opts?: ?Object): node is UnionTypeAnnotation;
  declare export function isVariance(node: ?Object, opts?: ?Object): node is Variance;
  declare export function isVoidTypeAnnotation(node: ?Object, opts?: ?Object): node is VoidTypeAnnotation;
  declare export function isEnumDeclaration(node: ?Object, opts?: ?Object): node is EnumDeclaration;
  declare export function isEnumBooleanBody(node: ?Object, opts?: ?Object): node is EnumBooleanBody;
  declare export function isEnumNumberBody(node: ?Object, opts?: ?Object): node is EnumNumberBody;
  declare export function isEnumStringBody(node: ?Object, opts?: ?Object): node is EnumStringBody;
  declare export function isEnumSymbolBody(node: ?Object, opts?: ?Object): node is EnumSymbolBody;
  declare export function isEnumBooleanMember(node: ?Object, opts?: ?Object): node is EnumBooleanMember;
  declare export function isEnumNumberMember(node: ?Object, opts?: ?Object): node is EnumNumberMember;
  declare export function isEnumStringMember(node: ?Object, opts?: ?Object): node is EnumStringMember;
  declare export function isEnumDefaultedMember(node: ?Object, opts?: ?Object): node is EnumDefaultedMember;
  declare export function isIndexedAccessType(node: ?Object, opts?: ?Object): node is IndexedAccessType;
  declare export function isOptionalIndexedAccessType(node: ?Object, opts?: ?Object): node is OptionalIndexedAccessType;
  declare export function isJSXAttribute(node: ?Object, opts?: ?Object): node is JSXAttribute;
  declare export function isJSXClosingElement(node: ?Object, opts?: ?Object): node is JSXClosingElement;
  declare export function isJSXElement(node: ?Object, opts?: ?Object): node is JSXElement;
  declare export function isJSXEmptyExpression(node: ?Object, opts?: ?Object): node is JSXEmptyExpression;
  declare export function isJSXExpressionContainer(node: ?Object, opts?: ?Object): node is JSXExpressionContainer;
  declare export function isJSXSpreadChild(node: ?Object, opts?: ?Object): node is JSXSpreadChild;
  declare export function isJSXIdentifier(node: ?Object, opts?: ?Object): node is JSXIdentifier;
  declare export function isJSXMemberExpression(node: ?Object, opts?: ?Object): node is JSXMemberExpression;
  declare export function isJSXNamespacedName(node: ?Object, opts?: ?Object): node is JSXNamespacedName;
  declare export function isJSXOpeningElement(node: ?Object, opts?: ?Object): node is JSXOpeningElement;
  declare export function isJSXSpreadAttribute(node: ?Object, opts?: ?Object): node is JSXSpreadAttribute;
  declare export function isJSXText(node: ?Object, opts?: ?Object): node is JSXText;
  declare export function isJSXFragment(node: ?Object, opts?: ?Object): node is JSXFragment;
  declare export function isJSXOpeningFragment(node: ?Object, opts?: ?Object): node is JSXOpeningFragment;
  declare export function isJSXClosingFragment(node: ?Object, opts?: ?Object): node is JSXClosingFragment;
  declare export function isNoop(node: ?Object, opts?: ?Object): node is Noop;
  declare export function isPlaceholder(node: ?Object, opts?: ?Object): node is Placeholder;
  declare export function isV8IntrinsicIdentifier(node: ?Object, opts?: ?Object): node is V8IntrinsicIdentifier;
  declare export function isArgumentPlaceholder(node: ?Object, opts?: ?Object): node is ArgumentPlaceholder;
  declare export function isBindExpression(node: ?Object, opts?: ?Object): node is BindExpression;
  declare export function isDecorator(node: ?Object, opts?: ?Object): node is Decorator;
  declare export function isDoExpression(node: ?Object, opts?: ?Object): node is DoExpression;
  declare export function isExportDefaultSpecifier(node: ?Object, opts?: ?Object): node is ExportDefaultSpecifier;
  declare export function isRecordExpression(node: ?Object, opts?: ?Object): node is RecordExpression;
  declare export function isTupleExpression(node: ?Object, opts?: ?Object): node is TupleExpression;
  declare export function isDecimalLiteral(node: ?Object, opts?: ?Object): node is DecimalLiteral;
  declare export function isModuleExpression(node: ?Object, opts?: ?Object): node is ModuleExpression;
  declare export function isTopicReference(node: ?Object, opts?: ?Object): node is TopicReference;
  declare export function isPipelineTopicExpression(node: ?Object, opts?: ?Object): node is PipelineTopicExpression;
  declare export function isPipelineBareFunction(node: ?Object, opts?: ?Object): node is PipelineBareFunction;
  declare export function isPipelinePrimaryTopicReference(node: ?Object, opts?: ?Object): node is PipelinePrimaryTopicReference;
  declare export function isVoidPattern(node: ?Object, opts?: ?Object): node is VoidPattern;
  declare export function isTSParameterProperty(node: ?Object, opts?: ?Object): node is TSParameterProperty;
  declare export function isTSDeclareFunction(node: ?Object, opts?: ?Object): node is TSDeclareFunction;
  declare export function isTSDeclareMethod(node: ?Object, opts?: ?Object): node is TSDeclareMethod;
  declare export function isTSQualifiedName(node: ?Object, opts?: ?Object): node is TSQualifiedName;
  declare export function isTSCallSignatureDeclaration(node: ?Object, opts?: ?Object): node is TSCallSignatureDeclaration;
  declare export function isTSConstructSignatureDeclaration(node: ?Object, opts?: ?Object): node is TSConstructSignatureDeclaration;
  declare export function isTSPropertySignature(node: ?Object, opts?: ?Object): node is TSPropertySignature;
  declare export function isTSMethodSignature(node: ?Object, opts?: ?Object): node is TSMethodSignature;
  declare export function isTSIndexSignature(node: ?Object, opts?: ?Object): node is TSIndexSignature;
  declare export function isTSAnyKeyword(node: ?Object, opts?: ?Object): node is TSAnyKeyword;
  declare export function isTSBooleanKeyword(node: ?Object, opts?: ?Object): node is TSBooleanKeyword;
  declare export function isTSBigIntKeyword(node: ?Object, opts?: ?Object): node is TSBigIntKeyword;
  declare export function isTSIntrinsicKeyword(node: ?Object, opts?: ?Object): node is TSIntrinsicKeyword;
  declare export function isTSNeverKeyword(node: ?Object, opts?: ?Object): node is TSNeverKeyword;
  declare export function isTSNullKeyword(node: ?Object, opts?: ?Object): node is TSNullKeyword;
  declare export function isTSNumberKeyword(node: ?Object, opts?: ?Object): node is TSNumberKeyword;
  declare export function isTSObjectKeyword(node: ?Object, opts?: ?Object): node is TSObjectKeyword;
  declare export function isTSStringKeyword(node: ?Object, opts?: ?Object): node is TSStringKeyword;
  declare export function isTSSymbolKeyword(node: ?Object, opts?: ?Object): node is TSSymbolKeyword;
  declare export function isTSUndefinedKeyword(node: ?Object, opts?: ?Object): node is TSUndefinedKeyword;
  declare export function isTSUnknownKeyword(node: ?Object, opts?: ?Object): node is TSUnknownKeyword;
  declare export function isTSVoidKeyword(node: ?Object, opts?: ?Object): node is TSVoidKeyword;
  declare export function isTSThisType(node: ?Object, opts?: ?Object): node is TSThisType;
  declare export function isTSFunctionType(node: ?Object, opts?: ?Object): node is TSFunctionType;
  declare export function isTSConstructorType(node: ?Object, opts?: ?Object): node is TSConstructorType;
  declare export function isTSTypeReference(node: ?Object, opts?: ?Object): node is TSTypeReference;
  declare export function isTSTypePredicate(node: ?Object, opts?: ?Object): node is TSTypePredicate;
  declare export function isTSTypeQuery(node: ?Object, opts?: ?Object): node is TSTypeQuery;
  declare export function isTSTypeLiteral(node: ?Object, opts?: ?Object): node is TSTypeLiteral;
  declare export function isTSArrayType(node: ?Object, opts?: ?Object): node is TSArrayType;
  declare export function isTSTupleType(node: ?Object, opts?: ?Object): node is TSTupleType;
  declare export function isTSOptionalType(node: ?Object, opts?: ?Object): node is TSOptionalType;
  declare export function isTSRestType(node: ?Object, opts?: ?Object): node is TSRestType;
  declare export function isTSNamedTupleMember(node: ?Object, opts?: ?Object): node is TSNamedTupleMember;
  declare export function isTSUnionType(node: ?Object, opts?: ?Object): node is TSUnionType;
  declare export function isTSIntersectionType(node: ?Object, opts?: ?Object): node is TSIntersectionType;
  declare export function isTSConditionalType(node: ?Object, opts?: ?Object): node is TSConditionalType;
  declare export function isTSInferType(node: ?Object, opts?: ?Object): node is TSInferType;
  declare export function isTSParenthesizedType(node: ?Object, opts?: ?Object): node is TSParenthesizedType;
  declare export function isTSTypeOperator(node: ?Object, opts?: ?Object): node is TSTypeOperator;
  declare export function isTSIndexedAccessType(node: ?Object, opts?: ?Object): node is TSIndexedAccessType;
  declare export function isTSMappedType(node: ?Object, opts?: ?Object): node is TSMappedType;
  declare export function isTSTemplateLiteralType(node: ?Object, opts?: ?Object): node is TSTemplateLiteralType;
  declare export function isTSLiteralType(node: ?Object, opts?: ?Object): node is TSLiteralType;
  declare export function isTSExpressionWithTypeArguments(node: ?Object, opts?: ?Object): node is TSExpressionWithTypeArguments;
  declare export function isTSInterfaceDeclaration(node: ?Object, opts?: ?Object): node is TSInterfaceDeclaration;
  declare export function isTSInterfaceBody(node: ?Object, opts?: ?Object): node is TSInterfaceBody;
  declare export function isTSTypeAliasDeclaration(node: ?Object, opts?: ?Object): node is TSTypeAliasDeclaration;
  declare export function isTSInstantiationExpression(node: ?Object, opts?: ?Object): node is TSInstantiationExpression;
  declare export function isTSAsExpression(node: ?Object, opts?: ?Object): node is TSAsExpression;
  declare export function isTSSatisfiesExpression(node: ?Object, opts?: ?Object): node is TSSatisfiesExpression;
  declare export function isTSTypeAssertion(node: ?Object, opts?: ?Object): node is TSTypeAssertion;
  declare export function isTSEnumBody(node: ?Object, opts?: ?Object): node is TSEnumBody;
  declare export function isTSEnumDeclaration(node: ?Object, opts?: ?Object): node is TSEnumDeclaration;
  declare export function isTSEnumMember(node: ?Object, opts?: ?Object): node is TSEnumMember;
  declare export function isTSModuleDeclaration(node: ?Object, opts?: ?Object): node is TSModuleDeclaration;
  declare export function isTSModuleBlock(node: ?Object, opts?: ?Object): node is TSModuleBlock;
  declare export function isTSImportType(node: ?Object, opts?: ?Object): node is TSImportType;
  declare export function isTSImportEqualsDeclaration(node: ?Object, opts?: ?Object): node is TSImportEqualsDeclaration;
  declare export function isTSExternalModuleReference(node: ?Object, opts?: ?Object): node is TSExternalModuleReference;
  declare export function isTSNonNullExpression(node: ?Object, opts?: ?Object): node is TSNonNullExpression;
  declare export function isTSExportAssignment(node: ?Object, opts?: ?Object): node is TSExportAssignment;
  declare export function isTSNamespaceExportDeclaration(node: ?Object, opts?: ?Object): node is TSNamespaceExportDeclaration;
  declare export function isTSTypeAnnotation(node: ?Object, opts?: ?Object): node is TSTypeAnnotation;
  declare export function isTSTypeParameterInstantiation(node: ?Object, opts?: ?Object): node is TSTypeParameterInstantiation;
  declare export function isTSTypeParameterDeclaration(node: ?Object, opts?: ?Object): node is TSTypeParameterDeclaration;
  declare export function isTSTypeParameter(node: ?Object, opts?: ?Object): node is TSTypeParameter;
  declare export function isStandardized(node: ?Object, opts?: ?Object): node is (ArrayExpression | AssignmentExpression | BinaryExpression | InterpreterDirective | Directive | DirectiveLiteral | BlockStatement | BreakStatement | CallExpression | CatchClause | ConditionalExpression | ContinueStatement | DebuggerStatement | DoWhileStatement | EmptyStatement | ExpressionStatement | File | ForInStatement | ForStatement | FunctionDeclaration | FunctionExpression | Identifier | IfStatement | LabeledStatement | StringLiteral | NumericLiteral | NullLiteral | BooleanLiteral | RegExpLiteral | LogicalExpression | MemberExpression | NewExpression | Program | ObjectExpression | ObjectMethod | ObjectProperty | RestElement | ReturnStatement | SequenceExpression | ParenthesizedExpression | SwitchCase | SwitchStatement | ThisExpression | ThrowStatement | TryStatement | UnaryExpression | UpdateExpression | VariableDeclaration | VariableDeclarator | WhileStatement | WithStatement | AssignmentPattern | ArrayPattern | ArrowFunctionExpression | ClassBody | ClassExpression | ClassDeclaration | ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration | ExportSpecifier | ForOfStatement | ImportDeclaration | ImportDefaultSpecifier | ImportNamespaceSpecifier | ImportSpecifier | ImportExpression | MetaProperty | ClassMethod | ObjectPattern | SpreadElement | Super | TaggedTemplateExpression | TemplateElement | TemplateLiteral | YieldExpression | AwaitExpression | Import | BigIntLiteral | ExportNamespaceSpecifier | OptionalMemberExpression | OptionalCallExpression | ClassProperty | ClassAccessorProperty | ClassPrivateProperty | ClassPrivateMethod | PrivateName | StaticBlock | ImportAttribute);
  declare export function isExpression(node: ?Object, opts?: ?Object): node is (ArrayExpression | AssignmentExpression | BinaryExpression | CallExpression | ConditionalExpression | FunctionExpression | Identifier | StringLiteral | NumericLiteral | NullLiteral | BooleanLiteral | RegExpLiteral | LogicalExpression | MemberExpression | NewExpression | ObjectExpression | SequenceExpression | ParenthesizedExpression | ThisExpression | UnaryExpression | UpdateExpression | ArrowFunctionExpression | ClassExpression | ImportExpression | MetaProperty | Super | TaggedTemplateExpression | TemplateLiteral | YieldExpression | AwaitExpression | Import | BigIntLiteral | OptionalMemberExpression | OptionalCallExpression | TypeCastExpression | JSXElement | JSXFragment | BindExpression | DoExpression | RecordExpression | TupleExpression | DecimalLiteral | ModuleExpression | TopicReference | PipelineTopicExpression | PipelineBareFunction | PipelinePrimaryTopicReference | TSInstantiationExpression | TSAsExpression | TSSatisfiesExpression | TSTypeAssertion | TSNonNullExpression);
  declare export function isBinary(node: ?Object, opts?: ?Object): node is (BinaryExpression | LogicalExpression);
  declare export function isScopable(node: ?Object, opts?: ?Object): node is (BlockStatement | CatchClause | DoWhileStatement | ForInStatement | ForStatement | FunctionDeclaration | FunctionExpression | Program | ObjectMethod | SwitchStatement | WhileStatement | ArrowFunctionExpression | ClassExpression | ClassDeclaration | ForOfStatement | ClassMethod | ClassPrivateMethod | StaticBlock | TSModuleBlock);
  declare export function isBlockParent(node: ?Object, opts?: ?Object): node is (BlockStatement | CatchClause | DoWhileStatement | ForInStatement | ForStatement | FunctionDeclaration | FunctionExpression | Program | ObjectMethod | SwitchStatement | WhileStatement | ArrowFunctionExpression | ForOfStatement | ClassMethod | ClassPrivateMethod | StaticBlock | TSModuleBlock);
  declare export function isBlock(node: ?Object, opts?: ?Object): node is (BlockStatement | Program | TSModuleBlock);
  declare export function isStatement(node: ?Object, opts?: ?Object): node is (BlockStatement | BreakStatement | ContinueStatement | DebuggerStatement | DoWhileStatement | EmptyStatement | ExpressionStatement | ForInStatement | ForStatement | FunctionDeclaration | IfStatement | LabeledStatement | ReturnStatement | SwitchStatement | ThrowStatement | TryStatement | VariableDeclaration | WhileStatement | WithStatement | ClassDeclaration | ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration | ForOfStatement | ImportDeclaration | DeclareClass | DeclareFunction | DeclareInterface | DeclareModule | DeclareModuleExports | DeclareTypeAlias | DeclareOpaqueType | DeclareVariable | DeclareExportDeclaration | DeclareExportAllDeclaration | InterfaceDeclaration | OpaqueType | TypeAlias | EnumDeclaration | TSDeclareFunction | TSInterfaceDeclaration | TSTypeAliasDeclaration | TSEnumDeclaration | TSModuleDeclaration | TSImportEqualsDeclaration | TSExportAssignment | TSNamespaceExportDeclaration);
  declare export function isTerminatorless(node: ?Object, opts?: ?Object): node is (BreakStatement | ContinueStatement | ReturnStatement | ThrowStatement | YieldExpression | AwaitExpression);
  declare export function isCompletionStatement(node: ?Object, opts?: ?Object): node is (BreakStatement | ContinueStatement | ReturnStatement | ThrowStatement);
  declare export function isConditional(node: ?Object, opts?: ?Object): node is (ConditionalExpression | IfStatement);
  declare export function isLoop(node: ?Object, opts?: ?Object): node is (DoWhileStatement | ForInStatement | ForStatement | WhileStatement | ForOfStatement);
  declare export function isWhile(node: ?Object, opts?: ?Object): node is (DoWhileStatement | WhileStatement);
  declare export function isExpressionWrapper(node: ?Object, opts?: ?Object): node is (ExpressionStatement | ParenthesizedExpression | TypeCastExpression);
  declare export function isFor(node: ?Object, opts?: ?Object): node is (ForInStatement | ForStatement | ForOfStatement);
  declare export function isForXStatement(node: ?Object, opts?: ?Object): node is (ForInStatement | ForOfStatement);
  declare export function isFunction(node: ?Object, opts?: ?Object): node is (FunctionDeclaration | FunctionExpression | ObjectMethod | ArrowFunctionExpression | ClassMethod | ClassPrivateMethod);
  declare export function isFunctionParent(node: ?Object, opts?: ?Object): node is (FunctionDeclaration | FunctionExpression | ObjectMethod | ArrowFunctionExpression | ClassMethod | ClassPrivateMethod | StaticBlock | TSModuleBlock);
  declare export function isPureish(node: ?Object, opts?: ?Object): node is (FunctionDeclaration | FunctionExpression | StringLiteral | NumericLiteral | NullLiteral | BooleanLiteral | RegExpLiteral | ArrowFunctionExpression | BigIntLiteral | DecimalLiteral);
  declare export function isDeclaration(node: ?Object, opts?: ?Object): node is (FunctionDeclaration | VariableDeclaration | ClassDeclaration | ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration | ImportDeclaration | DeclareClass | DeclareFunction | DeclareInterface | DeclareModule | DeclareModuleExports | DeclareTypeAlias | DeclareOpaqueType | DeclareVariable | DeclareExportDeclaration | DeclareExportAllDeclaration | InterfaceDeclaration | OpaqueType | TypeAlias | EnumDeclaration | TSDeclareFunction | TSInterfaceDeclaration | TSTypeAliasDeclaration | TSEnumDeclaration | TSModuleDeclaration | TSImportEqualsDeclaration);
  declare export function isFunctionParameter(node: ?Object, opts?: ?Object): node is (Identifier | RestElement | AssignmentPattern | ArrayPattern | ObjectPattern | VoidPattern);
  declare export function isPatternLike(node: ?Object, opts?: ?Object): node is (Identifier | MemberExpression | RestElement | AssignmentPattern | ArrayPattern | ObjectPattern | VoidPattern | TSAsExpression | TSSatisfiesExpression | TSTypeAssertion | TSNonNullExpression);
  declare export function isLVal(node: ?Object, opts?: ?Object): node is (Identifier | MemberExpression | RestElement | AssignmentPattern | ArrayPattern | ObjectPattern | TSParameterProperty | TSAsExpression | TSSatisfiesExpression | TSTypeAssertion | TSNonNullExpression);
  declare export function isTSEntityName(node: ?Object, opts?: ?Object): node is (Identifier | TSQualifiedName);
  declare export function isLiteral(node: ?Object, opts?: ?Object): node is (StringLiteral | NumericLiteral | NullLiteral | BooleanLiteral | RegExpLiteral | TemplateLiteral | BigIntLiteral | DecimalLiteral);
  declare export function isImmutable(node: ?Object, opts?: ?Object): node is (StringLiteral | NumericLiteral | NullLiteral | BooleanLiteral | BigIntLiteral | JSXAttribute | JSXClosingElement | JSXElement | JSXExpressionContainer | JSXSpreadChild | JSXOpeningElement | JSXText | JSXFragment | JSXOpeningFragment | JSXClosingFragment | DecimalLiteral);
  declare export function isUserWhitespacable(node: ?Object, opts?: ?Object): node is (ObjectMethod | ObjectProperty | ObjectTypeInternalSlot | ObjectTypeCallProperty | ObjectTypeIndexer | ObjectTypeProperty | ObjectTypeSpreadProperty);
  declare export function isMethod(node: ?Object, opts?: ?Object): node is (ObjectMethod | ClassMethod | ClassPrivateMethod);
  declare export function isObjectMember(node: ?Object, opts?: ?Object): node is (ObjectMethod | ObjectProperty);
  declare export function isProperty(node: ?Object, opts?: ?Object): node is (ObjectProperty | ClassProperty | ClassAccessorProperty | ClassPrivateProperty);
  declare export function isUnaryLike(node: ?Object, opts?: ?Object): node is (UnaryExpression | SpreadElement);
  declare export function isPattern(node: ?Object, opts?: ?Object): node is (AssignmentPattern | ArrayPattern | ObjectPattern | VoidPattern);
  declare export function isClass(node: ?Object, opts?: ?Object): node is (ClassExpression | ClassDeclaration);
  declare export function isImportOrExportDeclaration(node: ?Object, opts?: ?Object): node is (ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration | ImportDeclaration);
  declare export function isExportDeclaration(node: ?Object, opts?: ?Object): node is (ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration);
  declare export function isModuleSpecifier(node: ?Object, opts?: ?Object): node is (ExportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier | ImportSpecifier | ExportNamespaceSpecifier | ExportDefaultSpecifier);
  declare export function isAccessor(node: ?Object, opts?: ?Object): node is (ClassAccessorProperty);
  declare export function isPrivate(node: ?Object, opts?: ?Object): node is (ClassPrivateProperty | ClassPrivateMethod | PrivateName);
  declare export function isFlow(node: ?Object, opts?: ?Object): node is (AnyTypeAnnotation | ArrayTypeAnnotation | BooleanTypeAnnotation | BooleanLiteralTypeAnnotation | NullLiteralTypeAnnotation | ClassImplements | DeclareClass | DeclareFunction | DeclareInterface | DeclareModule | DeclareModuleExports | DeclareTypeAlias | DeclareOpaqueType | DeclareVariable | DeclareExportDeclaration | DeclareExportAllDeclaration | DeclaredPredicate | ExistsTypeAnnotation | FunctionTypeAnnotation | FunctionTypeParam | GenericTypeAnnotation | InferredPredicate | InterfaceExtends | InterfaceDeclaration | InterfaceTypeAnnotation | IntersectionTypeAnnotation | MixedTypeAnnotation | EmptyTypeAnnotation | NullableTypeAnnotation | NumberLiteralTypeAnnotation | NumberTypeAnnotation | ObjectTypeAnnotation | ObjectTypeInternalSlot | ObjectTypeCallProperty | ObjectTypeIndexer | ObjectTypeProperty | ObjectTypeSpreadProperty | OpaqueType | QualifiedTypeIdentifier | StringLiteralTypeAnnotation | StringTypeAnnotation | SymbolTypeAnnotation | ThisTypeAnnotation | TupleTypeAnnotation | TypeofTypeAnnotation | TypeAlias | TypeAnnotation | TypeCastExpression | TypeParameter | TypeParameterDeclaration | TypeParameterInstantiation | UnionTypeAnnotation | Variance | VoidTypeAnnotation | EnumDeclaration | EnumBooleanBody | EnumNumberBody | EnumStringBody | EnumSymbolBody | EnumBooleanMember | EnumNumberMember | EnumStringMember | EnumDefaultedMember | IndexedAccessType | OptionalIndexedAccessType);
  declare export function isFlowType(node: ?Object, opts?: ?Object): node is (AnyTypeAnnotation | ArrayTypeAnnotation | BooleanTypeAnnotation | BooleanLiteralTypeAnnotation | NullLiteralTypeAnnotation | ExistsTypeAnnotation | FunctionTypeAnnotation | GenericTypeAnnotation | InterfaceTypeAnnotation | IntersectionTypeAnnotation | MixedTypeAnnotation | EmptyTypeAnnotation | NullableTypeAnnotation | NumberLiteralTypeAnnotation | NumberTypeAnnotation | ObjectTypeAnnotation | StringLiteralTypeAnnotation | StringTypeAnnotation | SymbolTypeAnnotation | ThisTypeAnnotation | TupleTypeAnnotation | TypeofTypeAnnotation | UnionTypeAnnotation | VoidTypeAnnotation | IndexedAccessType | OptionalIndexedAccessType);
  declare export function isFlowBaseAnnotation(node: ?Object, opts?: ?Object): node is (AnyTypeAnnotation | BooleanTypeAnnotation | NullLiteralTypeAnnotation | MixedTypeAnnotation | EmptyTypeAnnotation | NumberTypeAnnotation | StringTypeAnnotation | SymbolTypeAnnotation | ThisTypeAnnotation | VoidTypeAnnotation);
  declare export function isFlowDeclaration(node: ?Object, opts?: ?Object): node is (DeclareClass | DeclareFunction | DeclareInterface | DeclareModule | DeclareModuleExports | DeclareTypeAlias | DeclareOpaqueType | DeclareVariable | DeclareExportDeclaration | DeclareExportAllDeclaration | InterfaceDeclaration | OpaqueType | TypeAlias);
  declare export function isFlowPredicate(node: ?Object, opts?: ?Object): node is (DeclaredPredicate | InferredPredicate);
  declare export function isEnumBody(node: ?Object, opts?: ?Object): node is (EnumBooleanBody | EnumNumberBody | EnumStringBody | EnumSymbolBody);
  declare export function isEnumMember(node: ?Object, opts?: ?Object): node is (EnumBooleanMember | EnumNumberMember | EnumStringMember | EnumDefaultedMember);
  declare export function isJSX(node: ?Object, opts?: ?Object): node is (JSXAttribute | JSXClosingElement | JSXElement | JSXEmptyExpression | JSXExpressionContainer | JSXSpreadChild | JSXIdentifier | JSXMemberExpression | JSXNamespacedName | JSXOpeningElement | JSXSpreadAttribute | JSXText | JSXFragment | JSXOpeningFragment | JSXClosingFragment);
  declare export function isMiscellaneous(node: ?Object, opts?: ?Object): node is (Noop | Placeholder | V8IntrinsicIdentifier);
  declare export function isTypeScript(node: ?Object, opts?: ?Object): node is (TSParameterProperty | TSDeclareFunction | TSDeclareMethod | TSQualifiedName | TSCallSignatureDeclaration | TSConstructSignatureDeclaration | TSPropertySignature | TSMethodSignature | TSIndexSignature | TSAnyKeyword | TSBooleanKeyword | TSBigIntKeyword | TSIntrinsicKeyword | TSNeverKeyword | TSNullKeyword | TSNumberKeyword | TSObjectKeyword | TSStringKeyword | TSSymbolKeyword | TSUndefinedKeyword | TSUnknownKeyword | TSVoidKeyword | TSThisType | TSFunctionType | TSConstructorType | TSTypeReference | TSTypePredicate | TSTypeQuery | TSTypeLiteral | TSArrayType | TSTupleType | TSOptionalType | TSRestType | TSNamedTupleMember | TSUnionType | TSIntersectionType | TSConditionalType | TSInferType | TSParenthesizedType | TSTypeOperator | TSIndexedAccessType | TSMappedType | TSTemplateLiteralType | TSLiteralType | TSExpressionWithTypeArguments | TSInterfaceDeclaration | TSInterfaceBody | TSTypeAliasDeclaration | TSInstantiationExpression | TSAsExpression | TSSatisfiesExpression | TSTypeAssertion | TSEnumBody | TSEnumDeclaration | TSEnumMember | TSModuleDeclaration | TSModuleBlock | TSImportType | TSImportEqualsDeclaration | TSExternalModuleReference | TSNonNullExpression | TSExportAssignment | TSNamespaceExportDeclaration | TSTypeAnnotation | TSTypeParameterInstantiation | TSTypeParameterDeclaration | TSTypeParameter);
  declare export function isTSTypeElement(node: ?Object, opts?: ?Object): node is (TSCallSignatureDeclaration | TSConstructSignatureDeclaration | TSPropertySignature | TSMethodSignature | TSIndexSignature);
  declare export function isTSType(node: ?Object, opts?: ?Object): node is (TSAnyKeyword | TSBooleanKeyword | TSBigIntKeyword | TSIntrinsicKeyword | TSNeverKeyword | TSNullKeyword | TSNumberKeyword | TSObjectKeyword | TSStringKeyword | TSSymbolKeyword | TSUndefinedKeyword | TSUnknownKeyword | TSVoidKeyword | TSThisType | TSFunctionType | TSConstructorType | TSTypeReference | TSTypePredicate | TSTypeQuery | TSTypeLiteral | TSArrayType | TSTupleType | TSOptionalType | TSRestType | TSUnionType | TSIntersectionType | TSConditionalType | TSInferType | TSParenthesizedType | TSTypeOperator | TSIndexedAccessType | TSMappedType | TSTemplateLiteralType | TSLiteralType | TSExpressionWithTypeArguments | TSImportType);
  declare export function isTSBaseType(node: ?Object, opts?: ?Object): node is (TSAnyKeyword | TSBooleanKeyword | TSBigIntKeyword | TSIntrinsicKeyword | TSNeverKeyword | TSNullKeyword | TSNumberKeyword | TSObjectKeyword | TSStringKeyword | TSSymbolKeyword | TSUndefinedKeyword | TSUnknownKeyword | TSVoidKeyword | TSThisType | TSTemplateLiteralType | TSLiteralType);
  declare export function isModuleDeclaration(node: ?Object, opts?: ?Object): node is (ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration | ImportDeclaration);
  declare export function isNumberLiteral(node: ?Object, opts?: ?Object): node is NumericLiteral;
  declare export function isRegexLiteral(node: ?Object, opts?: ?Object): node is RegExpLiteral;
  declare export function isRestProperty(node: ?Object, opts?: ?Object): node is RestElement;
  declare export function isSpreadProperty(node: ?Object, opts?: ?Object): node is SpreadElement;
  declare export function createTypeAnnotationBasedOnTypeof(type: 'string' | 'number' | 'undefined' | 'boolean' | 'function' | 'object' | 'symbol'): BabelNodeTypeAnnotation
  declare export function createUnionTypeAnnotation(types: Array<BabelNodeFlowType>): BabelNodeUnionTypeAnnotation
  declare export function createFlowUnionType(types: Array<BabelNodeFlowType>): BabelNodeUnionTypeAnnotation
  declare export function buildChildren(node: { children: Array<BabelNodeJSXText | BabelNodeJSXExpressionContainer | BabelNodeJSXSpreadChild | BabelNodeJSXElement | BabelNodeJSXFragment | BabelNodeJSXEmptyExpression> }): Array<BabelNodeJSXText | BabelNodeJSXExpressionContainer | BabelNodeJSXSpreadChild | BabelNodeJSXElement | BabelNodeJSXFragment>
  declare export function clone<T>(n: T): T;
  declare export function cloneDeep<T>(n: T): T;
  declare export function cloneDeepWithoutLoc<T>(n: T): T;
  declare export function cloneNode<T>(n: T, deep?: boolean, withoutLoc?: boolean): T;
  declare export function cloneWithoutLoc<T>(n: T): T;
  declare type CommentTypeShorthand = 'leading' | 'inner' | 'trailing'
  declare export function addComment<T: Node>(node: T, type: CommentTypeShorthand, content: string, line?: boolean): T
  declare export function addComments<T: Node>(node: T, type: CommentTypeShorthand, comments: Array<Comment>): T
  declare export function inheritInnerComments(node: Node, parent: Node): void
  declare export function inheritLeadingComments(node: Node, parent: Node): void
  declare export function inheritsComments<T: Node>(node: T, parent: Node): void
  declare export function inheritTrailingComments(node: Node, parent: Node): void
  declare export function removeComments<T: Node>(node: T): T
  declare export function ensureBlock(node: BabelNode, key: string): BabelNodeBlockStatement
  declare export function toBindingIdentifierName(name?: ?string): string
  declare export function toBlock(node: BabelNodeStatement | BabelNodeExpression, parent?: BabelNodeFunction | null): BabelNodeBlockStatement
  declare export function toComputedKey(node: BabelNodeMethod | BabelNodeProperty, key?: BabelNodeExpression | BabelNodeIdentifier): BabelNodeExpression
  declare export function toExpression(node: BabelNodeExpressionStatement | BabelNodeExpression | BabelNodeClass | BabelNodeFunction): BabelNodeExpression
  declare export function toIdentifier(name?: ?string): string
  declare export function toKeyAlias(node: BabelNodeMethod | BabelNodeProperty, key?: BabelNode): string
  declare export function toStatement(node: BabelNodeStatement | BabelNodeClass | BabelNodeFunction | BabelNodeAssignmentExpression, ignore?: boolean): BabelNodeStatement | void
  declare export function valueToNode(value: any): BabelNodeExpression
  declare export function removeTypeDuplicates(types: Array<BabelNodeFlowType>): Array<BabelNodeFlowType>
  declare export function appendToMemberExpression(member: BabelNodeMemberExpression, append: BabelNode, computed?: boolean): BabelNodeMemberExpression
  declare export function inherits<T: Node>(child: T, parent: BabelNode | null | void): T
  declare export function prependToMemberExpression(member: BabelNodeMemberExpression, prepend: BabelNodeExpression): BabelNodeMemberExpression
  declare export function removeProperties<T>(n: T, opts: ?{}): void;
  declare export function removePropertiesDeep<T>(n: T, opts: ?{}): T;
  declare export function getBindingIdentifiers(node: BabelNode, duplicates: boolean, outerOnly?: boolean): { [key: string]: BabelNodeIdentifier | Array<BabelNodeIdentifier> }
  declare export function getOuterBindingIdentifiers(node: Node, duplicates: boolean): { [key: string]: BabelNodeIdentifier | Array<BabelNodeIdentifier> }
  declare export type TraversalAncestors = Array<{
    node: BabelNode,
    key: string,
    index?: number,
  }>;
  declare export type TraversalHandler<T> = (BabelNode, TraversalAncestors, T) => void;
  declare export type TraversalHandlers<T> = {
    enter?: TraversalHandler<T>,
    exit?: TraversalHandler<T>,
  };
  declare export function traverse<T>(n: BabelNode, handler: TraversalHandler<T> | TraversalHandlers<T>, state?: T): void;
  declare export function traverseFast<T>(n: Node, h: TraversalHandler<T>, state?: T): void;
  declare export function shallowEqual(actual: Object, expected: Object): boolean
  declare export function buildMatchMemberExpression(match: string, allowPartial?: boolean): (?BabelNode) => boolean
  declare export function is(type: string, n: BabelNode, opts: Object): boolean;
  declare export function isBinding(node: BabelNode, parent: BabelNode, grandparent?: BabelNode): boolean
  declare export function isBlockScoped(node: BabelNode): boolean
  declare export function isLet(node: BabelNode): node is VariableDeclaration
  declare export function isNode(node: ?Object): boolean
  declare export function isNodesEquivalent(a: any, b: any): boolean
  declare export function isPlaceholderType(placeholderType: string, targetType: string): boolean
  declare export function isReferenced(node: BabelNode, parent: BabelNode, grandparent?: BabelNode): boolean
  declare export function isScope(node: BabelNode, parent: BabelNode): node is (BlockStatement | CatchClause | DoWhileStatement | ForInStatement | ForStatement | FunctionDeclaration | FunctionExpression | Program | ObjectMethod | SwitchStatement | WhileStatement | ArrowFunctionExpression | ClassExpression | ClassDeclaration | ForOfStatement | ClassMethod | ClassPrivateMethod | TSModuleBlock)
  declare export function isSpecifierDefault(specifier: BabelNodeModuleSpecifier): boolean
  declare export function isType(nodetype: ?string, targetType: string): boolean
  declare export function isValidES3Identifier(name: string): boolean
  declare export function isValidES3Identifier(name: string): boolean
  declare export function isValidIdentifier(name: string): boolean
  declare export function isVar(node: BabelNode): node is VariableDeclaration
  declare export function matchesPattern(node: ?BabelNode, match: string | Array<string>, allowPartial?: boolean): boolean
  declare export function validate(n: BabelNode, key: string, value: mixed): void;
  declare export type Node = BabelNode;
  declare export type CommentBlock = BabelNodeCommentBlock;
  declare export type CommentLine = BabelNodeCommentLine;
  declare export type Comment = BabelNodeComment;
  declare export type SourceLocation = BabelNodeSourceLocation;
  declare export type ArrayExpression = BabelNodeArrayExpression;
  declare export type AssignmentExpression = BabelNodeAssignmentExpression;
  declare export type BinaryExpression = BabelNodeBinaryExpression;
  declare export type InterpreterDirective = BabelNodeInterpreterDirective;
  declare export type Directive = BabelNodeDirective;
  declare export type DirectiveLiteral = BabelNodeDirectiveLiteral;
  declare export type BlockStatement = BabelNodeBlockStatement;
  declare export type BreakStatement = BabelNodeBreakStatement;
  declare export type CallExpression = BabelNodeCallExpression;
  declare export type CatchClause = BabelNodeCatchClause;
  declare export type ConditionalExpression = BabelNodeConditionalExpression;
  declare export type ContinueStatement = BabelNodeContinueStatement;
  declare export type DebuggerStatement = BabelNodeDebuggerStatement;
  declare export type DoWhileStatement = BabelNodeDoWhileStatement;
  declare export type EmptyStatement = BabelNodeEmptyStatement;
  declare export type ExpressionStatement = BabelNodeExpressionStatement;
  declare export type File = BabelNodeFile;
  declare export type ForInStatement = BabelNodeForInStatement;
  declare export type ForStatement = BabelNodeForStatement;
  declare export type FunctionDeclaration = BabelNodeFunctionDeclaration;
  declare export type FunctionExpression = BabelNodeFunctionExpression;
  declare export type Identifier = BabelNodeIdentifier;
  declare export type IfStatement = BabelNodeIfStatement;
  declare export type LabeledStatement = BabelNodeLabeledStatement;
  declare export type StringLiteral = BabelNodeStringLiteral;
  declare export type NumericLiteral = BabelNodeNumericLiteral;
  declare export type NullLiteral = BabelNodeNullLiteral;
  declare export type BooleanLiteral = BabelNodeBooleanLiteral;
  declare export type RegExpLiteral = BabelNodeRegExpLiteral;
  declare export type LogicalExpression = BabelNodeLogicalExpression;
  declare export type MemberExpression = BabelNodeMemberExpression;
  declare export type NewExpression = BabelNodeNewExpression;
  declare export type Program = BabelNodeProgram;
  declare export type ObjectExpression = BabelNodeObjectExpression;
  declare export type ObjectMethod = BabelNodeObjectMethod;
  declare export type ObjectProperty = BabelNodeObjectProperty;
  declare export type RestElement = BabelNodeRestElement;
  declare export type ReturnStatement = BabelNodeReturnStatement;
  declare export type SequenceExpression = BabelNodeSequenceExpression;
  declare export type ParenthesizedExpression = BabelNodeParenthesizedExpression;
  declare export type SwitchCase = BabelNodeSwitchCase;
  declare export type SwitchStatement = BabelNodeSwitchStatement;
  declare export type ThisExpression = BabelNodeThisExpression;
  declare export type ThrowStatement = BabelNodeThrowStatement;
  declare export type TryStatement = BabelNodeTryStatement;
  declare export type UnaryExpression = BabelNodeUnaryExpression;
  declare export type UpdateExpression = BabelNodeUpdateExpression;
  declare export type VariableDeclaration = BabelNodeVariableDeclaration;
  declare export type VariableDeclarator = BabelNodeVariableDeclarator;
  declare export type WhileStatement = BabelNodeWhileStatement;
  declare export type WithStatement = BabelNodeWithStatement;
  declare export type AssignmentPattern = BabelNodeAssignmentPattern;
  declare export type ArrayPattern = BabelNodeArrayPattern;
  declare export type ArrowFunctionExpression = BabelNodeArrowFunctionExpression;
  declare export type ClassBody = BabelNodeClassBody;
  declare export type ClassExpression = BabelNodeClassExpression;
  declare export type ClassDeclaration = BabelNodeClassDeclaration;
  declare export type ExportAllDeclaration = BabelNodeExportAllDeclaration;
  declare export type ExportDefaultDeclaration = BabelNodeExportDefaultDeclaration;
  declare export type ExportNamedDeclaration = BabelNodeExportNamedDeclaration;
  declare export type ExportSpecifier = BabelNodeExportSpecifier;
  declare export type ForOfStatement = BabelNodeForOfStatement;
  declare export type ImportDeclaration = BabelNodeImportDeclaration;
  declare export type ImportDefaultSpecifier = BabelNodeImportDefaultSpecifier;
  declare export type ImportNamespaceSpecifier = BabelNodeImportNamespaceSpecifier;
  declare export type ImportSpecifier = BabelNodeImportSpecifier;
  declare export type ImportExpression = BabelNodeImportExpression;
  declare export type MetaProperty = BabelNodeMetaProperty;
  declare export type ClassMethod = BabelNodeClassMethod;
  declare export type ObjectPattern = BabelNodeObjectPattern;
  declare export type SpreadElement = BabelNodeSpreadElement;
  declare export type Super = BabelNodeSuper;
  declare export type TaggedTemplateExpression = BabelNodeTaggedTemplateExpression;
  declare export type TemplateElement = BabelNodeTemplateElement;
  declare export type TemplateLiteral = BabelNodeTemplateLiteral;
  declare export type YieldExpression = BabelNodeYieldExpression;
  declare export type AwaitExpression = BabelNodeAwaitExpression;
  declare export type Import = BabelNodeImport;
  declare export type BigIntLiteral = BabelNodeBigIntLiteral;
  declare export type ExportNamespaceSpecifier = BabelNodeExportNamespaceSpecifier;
  declare export type OptionalMemberExpression = BabelNodeOptionalMemberExpression;
  declare export type OptionalCallExpression = BabelNodeOptionalCallExpression;
  declare export type ClassProperty = BabelNodeClassProperty;
  declare export type ClassAccessorProperty = BabelNodeClassAccessorProperty;
  declare export type ClassPrivateProperty = BabelNodeClassPrivateProperty;
  declare export type ClassPrivateMethod = BabelNodeClassPrivateMethod;
  declare export type PrivateName = BabelNodePrivateName;
  declare export type StaticBlock = BabelNodeStaticBlock;
  declare export type ImportAttribute = BabelNodeImportAttribute;
  declare export type AnyTypeAnnotation = BabelNodeAnyTypeAnnotation;
  declare export type ArrayTypeAnnotation = BabelNodeArrayTypeAnnotation;
  declare export type BooleanTypeAnnotation = BabelNodeBooleanTypeAnnotation;
  declare export type BooleanLiteralTypeAnnotation = BabelNodeBooleanLiteralTypeAnnotation;
  declare export type NullLiteralTypeAnnotation = BabelNodeNullLiteralTypeAnnotation;
  declare export type ClassImplements = BabelNodeClassImplements;
  declare export type DeclareClass = BabelNodeDeclareClass;
  declare export type DeclareFunction = BabelNodeDeclareFunction;
  declare export type DeclareInterface = BabelNodeDeclareInterface;
  declare export type DeclareModule = BabelNodeDeclareModule;
  declare export type DeclareModuleExports = BabelNodeDeclareModuleExports;
  declare export type DeclareTypeAlias = BabelNodeDeclareTypeAlias;
  declare export type DeclareOpaqueType = BabelNodeDeclareOpaqueType;
  declare export type DeclareVariable = BabelNodeDeclareVariable;
  declare export type DeclareExportDeclaration = BabelNodeDeclareExportDeclaration;
  declare export type DeclareExportAllDeclaration = BabelNodeDeclareExportAllDeclaration;
  declare export type DeclaredPredicate = BabelNodeDeclaredPredicate;
  declare export type ExistsTypeAnnotation = BabelNodeExistsTypeAnnotation;
  declare export type FunctionTypeAnnotation = BabelNodeFunctionTypeAnnotation;
  declare export type FunctionTypeParam = BabelNodeFunctionTypeParam;
  declare export type GenericTypeAnnotation = BabelNodeGenericTypeAnnotation;
  declare export type InferredPredicate = BabelNodeInferredPredicate;
  declare export type InterfaceExtends = BabelNodeInterfaceExtends;
  declare export type InterfaceDeclaration = BabelNodeInterfaceDeclaration;
  declare export type InterfaceTypeAnnotation = BabelNodeInterfaceTypeAnnotation;
  declare export type IntersectionTypeAnnotation = BabelNodeIntersectionTypeAnnotation;
  declare export type MixedTypeAnnotation = BabelNodeMixedTypeAnnotation;
  declare export type EmptyTypeAnnotation = BabelNodeEmptyTypeAnnotation;
  declare export type NullableTypeAnnotation = BabelNodeNullableTypeAnnotation;
  declare export type NumberLiteralTypeAnnotation = BabelNodeNumberLiteralTypeAnnotation;
  declare export type NumberTypeAnnotation = BabelNodeNumberTypeAnnotation;
  declare export type ObjectTypeAnnotation = BabelNodeObjectTypeAnnotation;
  declare export type ObjectTypeInternalSlot = BabelNodeObjectTypeInternalSlot;
  declare export type ObjectTypeCallProperty = BabelNodeObjectTypeCallProperty;
  declare export type ObjectTypeIndexer = BabelNodeObjectTypeIndexer;
  declare export type ObjectTypeProperty = BabelNodeObjectTypeProperty;
  declare export type ObjectTypeSpreadProperty = BabelNodeObjectTypeSpreadProperty;
  declare export type OpaqueType = BabelNodeOpaqueType;
  declare export type QualifiedTypeIdentifier = BabelNodeQualifiedTypeIdentifier;
  declare export type StringLiteralTypeAnnotation = BabelNodeStringLiteralTypeAnnotation;
  declare export type StringTypeAnnotation = BabelNodeStringTypeAnnotation;
  declare export type SymbolTypeAnnotation = BabelNodeSymbolTypeAnnotation;
  declare export type ThisTypeAnnotation = BabelNodeThisTypeAnnotation;
  declare export type TupleTypeAnnotation = BabelNodeTupleTypeAnnotation;
  declare export type TypeofTypeAnnotation = BabelNodeTypeofTypeAnnotation;
  declare export type TypeAlias = BabelNodeTypeAlias;
  declare export type TypeAnnotation = BabelNodeTypeAnnotation;
  declare export type TypeCastExpression = BabelNodeTypeCastExpression;
  declare export type TypeParameter = BabelNodeTypeParameter;
  declare export type TypeParameterDeclaration = BabelNodeTypeParameterDeclaration;
  declare export type TypeParameterInstantiation = BabelNodeTypeParameterInstantiation;
  declare export type UnionTypeAnnotation = BabelNodeUnionTypeAnnotation;
  declare export type Variance = BabelNodeVariance;
  declare export type VoidTypeAnnotation = BabelNodeVoidTypeAnnotation;
  declare export type EnumDeclaration = BabelNodeEnumDeclaration;
  declare export type EnumBooleanBody = BabelNodeEnumBooleanBody;
  declare export type EnumNumberBody = BabelNodeEnumNumberBody;
  declare export type EnumStringBody = BabelNodeEnumStringBody;
  declare export type EnumSymbolBody = BabelNodeEnumSymbolBody;
  declare export type EnumBooleanMember = BabelNodeEnumBooleanMember;
  declare export type EnumNumberMember = BabelNodeEnumNumberMember;
  declare export type EnumStringMember = BabelNodeEnumStringMember;
  declare export type EnumDefaultedMember = BabelNodeEnumDefaultedMember;
  declare export type IndexedAccessType = BabelNodeIndexedAccessType;
  declare export type OptionalIndexedAccessType = BabelNodeOptionalIndexedAccessType;
  declare export type JSXAttribute = BabelNodeJSXAttribute;
  declare export type JSXClosingElement = BabelNodeJSXClosingElement;
  declare export type JSXElement = BabelNodeJSXElement;
  declare export type JSXEmptyExpression = BabelNodeJSXEmptyExpression;
  declare export type JSXExpressionContainer = BabelNodeJSXExpressionContainer;
  declare export type JSXSpreadChild = BabelNodeJSXSpreadChild;
  declare export type JSXIdentifier = BabelNodeJSXIdentifier;
  declare export type JSXMemberExpression = BabelNodeJSXMemberExpression;
  declare export type JSXNamespacedName = BabelNodeJSXNamespacedName;
  declare export type JSXOpeningElement = BabelNodeJSXOpeningElement;
  declare export type JSXSpreadAttribute = BabelNodeJSXSpreadAttribute;
  declare export type JSXText = BabelNodeJSXText;
  declare export type JSXFragment = BabelNodeJSXFragment;
  declare export type JSXOpeningFragment = BabelNodeJSXOpeningFragment;
  declare export type JSXClosingFragment = BabelNodeJSXClosingFragment;
  declare export type Noop = BabelNodeNoop;
  declare export type Placeholder = BabelNodePlaceholder;
  declare export type V8IntrinsicIdentifier = BabelNodeV8IntrinsicIdentifier;
  declare export type ArgumentPlaceholder = BabelNodeArgumentPlaceholder;
  declare export type BindExpression = BabelNodeBindExpression;
  declare export type Decorator = BabelNodeDecorator;
  declare export type DoExpression = BabelNodeDoExpression;
  declare export type ExportDefaultSpecifier = BabelNodeExportDefaultSpecifier;
  declare export type RecordExpression = BabelNodeRecordExpression;
  declare export type TupleExpression = BabelNodeTupleExpression;
  declare export type DecimalLiteral = BabelNodeDecimalLiteral;
  declare export type ModuleExpression = BabelNodeModuleExpression;
  declare export type TopicReference = BabelNodeTopicReference;
  declare export type PipelineTopicExpression = BabelNodePipelineTopicExpression;
  declare export type PipelineBareFunction = BabelNodePipelineBareFunction;
  declare export type PipelinePrimaryTopicReference = BabelNodePipelinePrimaryTopicReference;
  declare export type VoidPattern = BabelNodeVoidPattern;
  declare export type TSParameterProperty = BabelNodeTSParameterProperty;
  declare export type TSDeclareFunction = BabelNodeTSDeclareFunction;
  declare export type TSDeclareMethod = BabelNodeTSDeclareMethod;
  declare export type TSQualifiedName = BabelNodeTSQualifiedName;
  declare export type TSCallSignatureDeclaration = BabelNodeTSCallSignatureDeclaration;
  declare export type TSConstructSignatureDeclaration = BabelNodeTSConstructSignatureDeclaration;
  declare export type TSPropertySignature = BabelNodeTSPropertySignature;
  declare export type TSMethodSignature = BabelNodeTSMethodSignature;
  declare export type TSIndexSignature = BabelNodeTSIndexSignature;
  declare export type TSAnyKeyword = BabelNodeTSAnyKeyword;
  declare export type TSBooleanKeyword = BabelNodeTSBooleanKeyword;
  declare export type TSBigIntKeyword = BabelNodeTSBigIntKeyword;
  declare export type TSIntrinsicKeyword = BabelNodeTSIntrinsicKeyword;
  declare export type TSNeverKeyword = BabelNodeTSNeverKeyword;
  declare export type TSNullKeyword = BabelNodeTSNullKeyword;
  declare export type TSNumberKeyword = BabelNodeTSNumberKeyword;
  declare export type TSObjectKeyword = BabelNodeTSObjectKeyword;
  declare export type TSStringKeyword = BabelNodeTSStringKeyword;
  declare export type TSSymbolKeyword = BabelNodeTSSymbolKeyword;
  declare export type TSUndefinedKeyword = BabelNodeTSUndefinedKeyword;
  declare export type TSUnknownKeyword = BabelNodeTSUnknownKeyword;
  declare export type TSVoidKeyword = BabelNodeTSVoidKeyword;
  declare export type TSThisType = BabelNodeTSThisType;
  declare export type TSFunctionType = BabelNodeTSFunctionType;
  declare export type TSConstructorType = BabelNodeTSConstructorType;
  declare export type TSTypeReference = BabelNodeTSTypeReference;
  declare export type TSTypePredicate = BabelNodeTSTypePredicate;
  declare export type TSTypeQuery = BabelNodeTSTypeQuery;
  declare export type TSTypeLiteral = BabelNodeTSTypeLiteral;
  declare export type TSArrayType = BabelNodeTSArrayType;
  declare export type TSTupleType = BabelNodeTSTupleType;
  declare export type TSOptionalType = BabelNodeTSOptionalType;
  declare export type TSRestType = BabelNodeTSRestType;
  declare export type TSNamedTupleMember = BabelNodeTSNamedTupleMember;
  declare export type TSUnionType = BabelNodeTSUnionType;
  declare export type TSIntersectionType = BabelNodeTSIntersectionType;
  declare export type TSConditionalType = BabelNodeTSConditionalType;
  declare export type TSInferType = BabelNodeTSInferType;
  declare export type TSParenthesizedType = BabelNodeTSParenthesizedType;
  declare export type TSTypeOperator = BabelNodeTSTypeOperator;
  declare export type TSIndexedAccessType = BabelNodeTSIndexedAccessType;
  declare export type TSMappedType = BabelNodeTSMappedType;
  declare export type TSTemplateLiteralType = BabelNodeTSTemplateLiteralType;
  declare export type TSLiteralType = BabelNodeTSLiteralType;
  declare export type TSExpressionWithTypeArguments = BabelNodeTSExpressionWithTypeArguments;
  declare export type TSInterfaceDeclaration = BabelNodeTSInterfaceDeclaration;
  declare export type TSInterfaceBody = BabelNodeTSInterfaceBody;
  declare export type TSTypeAliasDeclaration = BabelNodeTSTypeAliasDeclaration;
  declare export type TSInstantiationExpression = BabelNodeTSInstantiationExpression;
  declare export type TSAsExpression = BabelNodeTSAsExpression;
  declare export type TSSatisfiesExpression = BabelNodeTSSatisfiesExpression;
  declare export type TSTypeAssertion = BabelNodeTSTypeAssertion;
  declare export type TSEnumBody = BabelNodeTSEnumBody;
  declare export type TSEnumDeclaration = BabelNodeTSEnumDeclaration;
  declare export type TSEnumMember = BabelNodeTSEnumMember;
  declare export type TSModuleDeclaration = BabelNodeTSModuleDeclaration;
  declare export type TSModuleBlock = BabelNodeTSModuleBlock;
  declare export type TSImportType = BabelNodeTSImportType;
  declare export type TSImportEqualsDeclaration = BabelNodeTSImportEqualsDeclaration;
  declare export type TSExternalModuleReference = BabelNodeTSExternalModuleReference;
  declare export type TSNonNullExpression = BabelNodeTSNonNullExpression;
  declare export type TSExportAssignment = BabelNodeTSExportAssignment;
  declare export type TSNamespaceExportDeclaration = BabelNodeTSNamespaceExportDeclaration;
  declare export type TSTypeAnnotation = BabelNodeTSTypeAnnotation;
  declare export type TSTypeParameterInstantiation = BabelNodeTSTypeParameterInstantiation;
  declare export type TSTypeParameterDeclaration = BabelNodeTSTypeParameterDeclaration;
  declare export type TSTypeParameter = BabelNodeTSTypeParameter;
  declare export type Standardized = BabelNodeStandardized;
  declare export type Expression = BabelNodeExpression;
  declare export type Binary = BabelNodeBinary;
  declare export type Scopable = BabelNodeScopable;
  declare export type BlockParent = BabelNodeBlockParent;
  declare export type Block = BabelNodeBlock;
  declare export type Statement = BabelNodeStatement;
  declare export type Terminatorless = BabelNodeTerminatorless;
  declare export type CompletionStatement = BabelNodeCompletionStatement;
  declare export type Conditional = BabelNodeConditional;
  declare export type Loop = BabelNodeLoop;
  declare export type While = BabelNodeWhile;
  declare export type ExpressionWrapper = BabelNodeExpressionWrapper;
  declare export type For = BabelNodeFor;
  declare export type ForXStatement = BabelNodeForXStatement;
  declare export type Function = BabelNodeFunction;
  declare export type FunctionParent = BabelNodeFunctionParent;
  declare export type Pureish = BabelNodePureish;
  declare export type Declaration = BabelNodeDeclaration;
  declare export type FunctionParameter = BabelNodeFunctionParameter;
  declare export type PatternLike = BabelNodePatternLike;
  declare export type LVal = BabelNodeLVal;
  declare export type TSEntityName = BabelNodeTSEntityName;
  declare export type Literal = BabelNodeLiteral;
  declare export type Immutable = BabelNodeImmutable;
  declare export type UserWhitespacable = BabelNodeUserWhitespacable;
  declare export type Method = BabelNodeMethod;
  declare export type ObjectMember = BabelNodeObjectMember;
  declare export type Property = BabelNodeProperty;
  declare export type UnaryLike = BabelNodeUnaryLike;
  declare export type Pattern = BabelNodePattern;
  declare export type Class = BabelNodeClass;
  declare export type ImportOrExportDeclaration = BabelNodeImportOrExportDeclaration;
  declare export type ExportDeclaration = BabelNodeExportDeclaration;
  declare export type ModuleSpecifier = BabelNodeModuleSpecifier;
  declare export type Accessor = BabelNodeAccessor;
  declare export type Private = BabelNodePrivate;
  declare export type Flow = BabelNodeFlow;
  declare export type FlowType = BabelNodeFlowType;
  declare export type FlowBaseAnnotation = BabelNodeFlowBaseAnnotation;
  declare export type FlowDeclaration = BabelNodeFlowDeclaration;
  declare export type FlowPredicate = BabelNodeFlowPredicate;
  declare export type EnumBody = BabelNodeEnumBody;
  declare export type EnumMember = BabelNodeEnumMember;
  declare export type JSX = BabelNodeJSX;
  declare export type Miscellaneous = BabelNodeMiscellaneous;
  declare export type TypeScript = BabelNodeTypeScript;
  declare export type TSTypeElement = BabelNodeTSTypeElement;
  declare export type TSType = BabelNodeTSType;
  declare export type TSBaseType = BabelNodeTSBaseType;
  declare export type ModuleDeclaration = BabelNodeModuleDeclaration;
}
