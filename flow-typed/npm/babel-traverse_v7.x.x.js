/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

// The sections between BEGIN GENERATED and END GENERATED are generated
// by the updateBabelTraverseTypes.js script. You can update the sections with
// node <metro>/scripts/updateBabelTraverseTypes.js path/to/this/file

'use strict';

declare module '@babel/traverse' {
  declare export type TraverseOptions<TState> = {
    ...Visitor<TState>,
    scope?: Scope,
    noScope?: boolean,
  };

  declare export interface HubInterface {
    getCode(): ?string;
    getScope(): ?Scope;
    addHelper(name: string): {};
    buildError<TError extends Error>(
      node: BabelNode,
      msg: string,
      Error: Class<TError>,
    ): TError;
  }

  declare export class Hub implements HubInterface {
    constructor(): Hub;
    getCode(): ?string;
    getScope(): ?Scope;
    addHelper(name: string): {};
    buildError<TError extends Error>(
      node: BabelNode,
      msg: string,
      Error: Class<TError>,
    ): TError;
  }

  declare export interface TraversalContext {
    parentPath: NodePath<>;
    scope: Scope;
    state: any;
    opts: any;
    queue: ?Array<NodePath<>>;

    constructor(
      scope: Scope,
      opts: TraverseOptions<unknown>,
      state: any,
      parentPath: NodePath<>,
    ): TraversalContext;

    shouldVisit(node: BabelNode): boolean;
    create(
      node: BabelNode,
      obj: Array<BabelNode>,
      key: string,
      listKey: string,
    ): NodePath<>;
    maybeQueue(path: NodePath<>, notPriority?: boolean): void;
    visitMultiple(
      container: Array<BabelNode>,
      parent: BabelNode,
      listKey: string,
    ): boolean;
    visitSingle(node: BabelNode, key: string): boolean;
    visitQueue(queue: Array<NodePath<>>): boolean;
    visit(node: BabelNode, key: string): boolean;
  }

  declare export class Scope {
    static globals: Array<string>;
    static conextVariables: Array<string>;

    constructor(path: NodePath<>): Scope;
    path: NodePath<>;
    block: BabelNode;
    +labels: Map<string, NodePath<>>;
    +parentBlock: BabelNode;
    +parent: Scope;
    +hub: HubInterface;
    bindings?: {[name: string]: Binding};
    references?: {[name: string]: boolean};
    globals?: {[name: string]: BabelNode};
    uids?: {[name: string]: boolean};
    data?: {[key: string]: any};
    inited: boolean;

    /** Traverse node with current scope and path. */
    traverse<S>(
      node: BabelNode | Array<BabelNode>,
      opts: Readonly<TraverseOptions<S>>,
      state: S,
    ): void;

    /** Generate a unique identifier and add it to the current scope. */
    generateDeclaredUidIdentifier(name?: string): BabelNodeIdentifier;

    /** Generate a unique identifier. */
    generateUidIdentifier(name?: string): BabelNodeIdentifier;

    /** Generate a unique `_id1` binding. */
    generateUid(name?: string): string;

    generateUidBasedOnNode(node: BabelNode, defaultName?: string): string;

    /** Generate a unique identifier based on a node. */
    generateUidIdentifierBasedOnNode(
      parent: BabelNode,
      defaultName?: string,
    ): BabelNodeIdentifier;

    /**
     * Determine whether evaluating the specific input `node` is a consequenceless reference. ie.
     * evaluating it wont result in potentially arbitrary code from being ran. The following are
     * whitelisted and determined not to cause side effects:
     *
     *  - `this` expressions
     *  - `super` expressions
     *  - Bound identifiers
     */
    isStatic(node: BabelNode): boolean;

    /** Possibly generate a memoised identifier if it is not static and has consequences. */
    maybeGenerateMemoised(
      node: BabelNode,
      dontPush?: boolean,
    ): BabelNodeIdentifier;

    checkBlockScopedCollisions(
      local: BabelNode,
      kind: string,
      name: string,
      id: {},
    ): void;

    rename(oldName: string, newName?: string, block?: BabelNode): void;

    dump(): void;

    toArray(
      node: BabelNode,
      i?: number | boolean,
      allowArrayLike?: boolean,
    ): BabelNode;

    hasLabel(name: string): boolean;

    getLabel(name: string): NodePath<>;

    registerLabel(path: NodePath<>): void;

    registerDeclaration(path: NodePath<>): void;

    buildUndefinedNode(): BabelNode;

    registerConstantViolation(path: NodePath<>): void;

    registerBinding(
      kind: BindingKind,
      path: NodePath<>,
      bindingPath?: NodePath<>,
    ): void;

    addGlobal(node: BabelNode): void;

    hasUid(name: string): boolean;

    hasGlobal(name: string): boolean;

    hasReference(name: string): boolean;

    isPure(node: BabelNode, constantsOnly?: boolean): boolean;

    /**
     * Set some arbitrary data on the current scope.
     */
    setData(key: string, val: any): any;

    /**
     * Recursively walk up scope tree looking for the data `key`.
     */
    getData(key: string): any;

    /**
     * Recursively walk up scope tree looking for the data `key` and if it exists,
     * remove it.
     */
    removeData(key: string): void;

    init(): void;

    crawl(): void;

    push(opts: {
      id: BabelNodeLVal,
      init?: BabelNodeExpression,
      unique?: boolean,
      _blockHoist?: ?number,
      kind?: 'var' | 'let',
    }): void;

    getProgramParent(): Scope;

    getFunctionParent(): Scope | null;

    getBlockParent(): Scope;

    /** Walks the scope tree and gathers **all** bindings. */
    getAllBindings(): {[name: string]: Binding};

    getAllBindingsOfKind(...kind: Array<BindingKind>): {
      [name: string]: Binding,
    };

    bindingIdentifierEquals(name: string, node: BabelNode): boolean;

    getBinding(name: string): Binding | void;

    getOwnBinding(name: string): Binding | void;

    getBindingIdentifier(name: string): BabelNodeIdentifier | void;

    getOwnBindingIdentifier(name: string): BabelNodeIdentifier | void;

    hasOwnBinding(name: string): boolean;

    hasBinding(name: string, noGlobals?: boolean): boolean;

    parentHasBinding(name: string, noGlobals?: boolean): boolean;

    /** Move a binding of `name` to another `scope`. */
    moveBindingTo(name: string, scope: Scope): void;

    removeOwnBinding(name: string): void;

    removeBinding(name: string): void;
  }

  declare export type BindingKind =
    | 'var'
    | 'let'
    | 'const'
    | 'module'
    | 'hoisted'
    | 'unknown';

  declare export class Binding {
    constructor(opts: {
      identifier: BabelNodeIdentifier,
      scope: Scope,
      path: NodePath<>,
      kind: BindingKind,
    }): Binding;
    identifier: BabelNodeIdentifier;
    scope: Scope;
    path: NodePath<>;
    kind: BindingKind;
    referenced: boolean;
    references: number;
    referencePaths: Array<NodePath<>>;
    constant: boolean;
    constantViolations: Array<NodePath<>>;
    hasDeoptedValue: boolean;
    hasValue: boolean;
    value: any;

    deoptValue(): void;

    setValue(value: any): void;

    clearValue(): void;

    /**
     * Register a constant violation with the provided `path`.
     */
    reassign(path: NodePath<>): void;

    /**
     * Increment the amount of references to this binding.
     */
    reference(path: NodePath<>): void;

    dereference(): void;
  }

  declare type Opts = {...};

  declare export class NodePath<+TNode extends BabelNode = BabelNode> {
    parent: BabelNode;
    hub: HubInterface;
    contexts: Array<TraversalContext>;
    data: {[key: string]: unknown} | null;
    shouldSkip: boolean;
    shouldStop: boolean;
    removed: boolean;
    state: unknown;
    +opts: Readonly<TraverseOptions<unknown>> | null;
    skipKeys: null | {[key: string]: boolean};
    parentPath: ?NodePath<>;
    context: TraversalContext;
    container: null | {...} | Array<{...}>;
    listKey: null | string;
    key: null | string;

    /* Declaring node as readonly isn't entirely correct since the node can be
     * changed by e.g. calling replaceWith. However, this is needed to reasonably
     * work with `NodePath`, e.g. that passing `NodePath<CallExpression>` to a
     * `NodePath<Node> works.
     */
    +node: TNode;

    parentKey: string;
    scope: Scope;
    type: null | BabelNode['type'];
    inList: boolean;
    typeAnnotation?: BabelNodeTypeAnnotation;

    constructor(hub: HubInterface, parent: BabelNode): NodePath<TNode>;

    static get({
      hub: HubInterface,
      parentPath: ?NodePath<>,
      parent: BabelNode,
      container: null | {...} | Array<{...}>,
      listKey: null | string,
      key: null | string,
    }): NodePath<>;

    getScope(scope: Scope): Scope;

    setData<TVal>(key: string, val: TVal): TVal;
    getData<TVal = unknown>(key: string, def?: TVal): TVal;

    buildCodeFrameError<TError extends Error>(
      msg: string,
      Error?: Class<TError>,
    ): TError;

    traverse<TState>(
      visitor: Readonly<TraverseOptions<TState>>,
      state: TState,
    ): void;

    set(key: string, node: BabelNode): void;
    getPathLocation(): string;

    debug(message: string): void;

    toString(): string;

    // _ancestry
    /**
     * Starting at the parent path of the current `NodePath` and going up the
     * tree, return the first `NodePath` that causes the provided `callback`
     * to return a truthy value, or `null` if the `callback` never returns a
     * truthy value.
     */
    findParent(callback: (path: NodePath<>) => boolean): NodePath<> | null;

    /**
     * Starting at current `NodePath` and going up the tree, return the first
     * `NodePath` that causes the provided `callback` to return a truthy value,
     * or `null` if the `callback` never returns a truthy value.
     */
    find(callback: (path: NodePath<>) => boolean): NodePath<> | null;

    /**
     * Get the parent function of the current path.
     */
    getFunctionParent(): NodePath<BabelNodeFunction> | null;

    /**
     * Walk up the tree until we hit a parent node path in a list.
     */
    getStatementParent(): NodePath<BabelNodeStatement>;

    /**
     * Get the deepest common ancestor and then from it, get the earliest relationship path
     * to that ancestor.
     *
     * Earliest is defined as being "before" all the other nodes in terms of list container
     * position and visiting key.
     */
    getEarliestCommonAncestorFrom(paths: ReadonlyArray<NodePath<>>): NodePath<>;

    /**
     * Get the earliest path in the tree where the provided `paths` intersect.
     *
     * TODO: Possible optimisation target.
     */
    getDeepestCommonAncestorFrom(
      paths: ReadonlyArray<NodePath<>>,
      filter?: (
        lastCommon: BabelNode,
        lastCommonIndex: number,
        ancestries: Array<NodePath<>>,
      ) => NodePath<>,
    ): NodePath<>;

    /**
     * Build an array of node paths containing the entire ancestry of the current node path.
     *
     * NOTE: The current node path is included in this.
     */
    getAncestry(): Array<NodePath<>>;

    /**
     * A helper to find if `this` path is an ancestor of @param maybeDescendant
     */
    isAncestor(maybeDescendant: NodePath<>): boolean;

    /**
     * A helper to find if `this` path is a descendant of @param maybeAncestor
     */
    isDescendant(maybeAncestor: NodePath<>): boolean;

    inType(...candidateTypes: Array<BabelNode['type']>): boolean;

    // _inference

    /**
     * Infer the type of the current `NodePath`.
     */
    getTypeAnnotation(): BabelNodeTypeAnnotation;

    isBaseType(baseName: string, soft?: boolean): boolean;
    couldBeBaseType(
      name:
        | 'string'
        | 'number'
        | 'boolean'
        | 'any'
        | 'mixed'
        | 'empty'
        | 'void',
    ): boolean;
    baseTypeStrictlyMatches(right: NodePath<>): ?boolean;
    isGenericType(genericName: string): boolean;

    // _replacement

    /**
     * Replace a node with an array of multiple. This method performs the following steps:
     *
     *  - Inherit the comments of first provided node with that of the current node.
     *  - Insert the provided nodes after the current node.
     *  - Remove the current node.
     */
    replaceWithMultiple(node: Array<BabelNode>): Array<NodePath<>>;

    /**
     * Parse a string as an expression and replace the current node with the result.
     *
     * NOTE: This is typically not a good idea to use. Building source strings when
     * transforming ASTs is an antipattern and SHOULD NOT be encouraged. Even if it's
     * easier to use, your transforms will be extremely brittle.
     */
    replaceWithSourceString(replacement: string): Array<NodePath<>>;

    /**
     * Replace the current node with another.
     */
    replaceWith(replacement: BabelNode | NodePath<>): Array<NodePath<>>;

    /**
     * This method takes an array of statements nodes and then explodes it
     * into expressions. This method retains completion records which is
     * extremely important to retain original semantics.
     */
    replaceExpressionWithStatement(
      nodes: Array<BabelNodeStatement>,
    ): Array<NodePath<>>;

    replaceInline(nodes: BabelNode | Array<BabelNode>): Array<NodePath<>>;

    // _evaluation

    /**
     * Walk the input `node` and statically evaluate if it's truthy.
     *
     * Returning `true` when we're sure that the expression will evaluate to a
     * truthy value, `false` if we're sure that it will evaluate to a falsy
     * value and `undefined` if we aren't sure. Because of this please do not
     * rely on coercion when using this method and check with === if it's false.
     *
     * For example do:
     *
     *   if (t.evaluateTruthy(node) === false) falsyLogic();
     *
     * **AND NOT**
     *
     *   if (!t.evaluateTruthy(node)) falsyLogic();
     *
     */
    evaluateTruthy(): boolean | void;

    /**
     * Walk the input `node` and statically evaluate it.
     *
     * Returns an object in the form `{ confident, value }`. `confident` indicates
     * whether or not we had to drop out of evaluating the expression because of
     * hitting an unknown node that we couldn't confidently find the value of.
     *
     * Example:
     *
     *   t.evaluate(parse("5 + 5")) // { confident: true, value: 10 }
     *   t.evaluate(parse("!true")) // { confident: true, value: false }
     *   t.evaluate(parse("foo + foo")) // { confident: false, value: undefined }
     *
     */
    evaluate():
      | {confident: true, value: any, deopt: null}
      | {confident: false, value: void, deopt: NodePath<>};

    // conversion
    toComputedKey(): BabelNode;

    ensureBlock(): BabelNode;

    /**
     * Given an arbitrary function, process its content as if it were an arrow function, moving references
     * to "this", "arguments", "super", and such into the function's parent scope. This method is useful if
     * you have wrapped some set of items in an IIFE or other function, but want "this", "arguments", and super"
     * to continue behaving as expected.
     */
    unwrapFunctionEnvironment(): void;

    /**
     * Convert a given arrow function into a normal ES5 function expression.
     */
    arrowFunctionToExpression(options?: {
      allowInsertArrow?: boolean,
      specCompliant?: boolean,
    }): void;

    // introspection

    /**
     * Match the current node if it matches the provided `pattern`.
     *
     * For example, given the match `React.createClass` it would match the
     * parsed nodes of `React.createClass` and `React["createClass"]`.
     */
    matchesPattern(pattern: string, allowPartial?: boolean): boolean;

    /**
     * Check whether we have the input `key`. If the `key` references an array then we check
     * if the array has any items, otherwise we just check if it's falsy.
     */
    has(key: keyof TNode): boolean;

    isStatic(): boolean;

    /**
     * Alias of `has`.
     */
    is(key: keyof TNode): boolean;

    /**
     * Opposite of `has`.
     */
    isnt(key: keyof TNode): boolean;

    /**
     * Check whether the path node `key` strict equals `value`.
     */
    equals(key: keyof TNode, value: any): boolean;

    /**
     * Check the type against our stored internal type of the node. This is handy when a node has
     * been removed yet we still internally know the type and need it to calculate node replacement.
     */
    isNodeType(type: BabelNode['type']): boolean;

    /**
     * This checks whether or not we're in one of the following positions:
     *
     *   for (KEY in right);
     *   for (KEY;;);
     *
     * This is because these spots allow VariableDeclarations AND normal expressions so we need
     * to tell the path replacement that it's ok to replace this with an expression.
     */
    canHaveVariableDeclarationOrExpression(): boolean;

    /**
     * This checks whether we are swapping an arrow function's body between an
     * expression and a block statement (or vice versa).
     *
     * This is because arrow functions may implicitly return an expression, which
     * is the same as containing a block statement.
     */
    canSwapBetweenExpressionAndStatement(replacement: BabelNode): boolean;

    /**
     * Check whether the current path references a completion record
     */
    isCompletionRecord(allowInsideFunction?: boolean): boolean;

    /**
     * Check whether or not the current `key` allows either a single statement or block statement
     * so we can explode it if necessary.
     */
    isStatementOrBlock(): boolean;

    /**
     * Check if the currently assigned path references the `importName` of `moduleSource`.
     */
    referencesImport(moduleSource: string, importName?: string): boolean;

    /**
     * Get the source code associated with this node.
     */
    getSource(): string;

    willIMaybeExecuteBefore(target: NodePath<>): boolean;

    /**
     * Resolve a "pointer" `NodePath` to it's absolute path.
     */
    resolve(dangerous?: boolean, resolved?: Array<NodePath<>>): NodePath<>;

    isConstantExpression(): boolean;

    isInStrictMode(): boolean;

    // context
    call(key: string): boolean;

    isBlacklisted(): boolean;

    visit(): boolean;

    skip(): boolean;

    skipKey(key: string): boolean;

    stop(): void;

    setScope(): void;

    setContext(context: TraversalContext): NodePath<TNode>;

    /**
     * Here we resync the node paths `key` and `container`. If they've changed according
     * to what we have stored internally then we attempt to resync by crawling and looking
     * for the new values.
     */
    resync(): void;

    popContext(): void;

    pushContext(context: TraversalContext): void;

    setup(
      parentPath: NodePath<>,
      container: ?{...} | ?Array<{...}>,
      listKey: string,
      key: string,
    ): void;

    setKey(key: string): void;

    requeue(pathToQueue?: NodePath<>): void;

    // removal
    remove(): void;

    // modification

    /**
     * Insert the provided nodes before the current one.
     */
    insertBefore(nodes: BabelNode | Array<BabelNode>): Array<NodePath<>>;

    /**
     * Insert the provided nodes after the current one. When inserting nodes after an
     * expression, ensure that the completion record is correct by pushing the current node.
     */
    insertAfter(nodes: BabelNode | Array<BabelNode>): Array<NodePath<>>;

    /**
     * Update all sibling node paths after `fromIndex` by `incrementBy`.
     */
    updateSiblingKeys(fromIndex: number, incrementBy: number): void;

    unshiftContainer(
      listKey: string,
      nodes: BabelNode | Array<BabelNode>,
    ): Array<NodePath<>>;

    pushContainer(
      listKey: string,
      nodes: BabelNode | Array<BabelNode>,
    ): Array<NodePath<>>;

    /**
     * Hoist the current node to the highest scope possible and return a UID
     * referencing it.
     */
    hoist(scope?: Scope): ?NodePath<>;

    // family
    getOpposite(): ?NodePath<>;

    getCompletionRecords(): Array<NodePath<>>;

    getSibling(key: string): NodePath<>;

    getPrevSibling(): NodePath<>;

    getNextSibling(): NodePath<>;

    getAllNextSiblings(): Array<NodePath<>>;

    getAllPrevSiblings(): Array<NodePath<>>;

    get<TKey extends keyof TNode>(
      key: TKey,
      context?: boolean | TraversalContext,
    ): TNode[TKey] extends BabelNode ? NodePath<> : Array<NodePath<>>;

    get(
      key: string,
      context?: boolean | TraversalContext,
    ): NodePath<> | Array<NodePath<>>;

    getBindingIdentifiers(duplicates?: void | false): {
      [key: string]: BabelNodeIdentifier,
    };

    getBindingIdentifiers(duplicates: true): {
      [key: string]: Array<BabelNodeIdentifier>,
    };

    getOuterBindingIdentifiers(duplicates: true): {
      [key: string]: Array<BabelNodeIdentifier>,
    };
    getOuterBindingIdentifiers(duplicates?: false): {
      [key: string]: BabelNodeIdentifier,
    };
    getOuterBindingIdentifiers(duplicates: boolean): {
      [key: string]: BabelNodeIdentifier | Array<BabelNodeIdentifier>,
    };

    getBindingIdentifierPaths(
      duplicates?: void | false,
      outerOnly?: boolean,
    ): {[key: string]: NodePath<BabelNodeIdentifier>};

    getBindingIdentifierPaths(
      duplicates: true,
      outerOnly?: boolean,
    ): {[key: string]: Array<NodePath<BabelNodeIdentifier>>};

    getOuterBindingIdentifierPaths(duplicates?: void | false): {
      [key: string]: NodePath<BabelNodeIdentifier>,
    };

    getOuterBindingIdentifierPaths(duplicates: true): {
      [key: string]: Array<NodePath<BabelNodeIdentifier>>,
    };

    // comments
    shareCommentsWithSiblings(): void;

    addComment(
      type: 'leading' | 'inner' | 'trailing',
      content: string,
      line?: boolean,
    ): void;

    addComments(
      type: 'leading' | 'inner' | 'trailing',
      comments: Array<BabelNodeComment>,
    ): void;

    // This section is automatically generated. Don't edit by hand.
    // See the comment at the top of the file on how to update the definitions.
    // BEGIN GENERATED NODE PATH METHODS
    isAccessor(opts?: Opts): boolean;
    isAnyTypeAnnotation(opts?: Opts): boolean;
    isArgumentPlaceholder(opts?: Opts): boolean;
    isArrayExpression(opts?: Opts): boolean;
    isArrayPattern(opts?: Opts): boolean;
    isArrayTypeAnnotation(opts?: Opts): boolean;
    isArrowFunctionExpression(opts?: Opts): boolean;
    isAssignmentExpression(opts?: Opts): boolean;
    isAssignmentPattern(opts?: Opts): boolean;
    isAwaitExpression(opts?: Opts): boolean;
    isBigIntLiteral(opts?: Opts): boolean;
    isBinary(opts?: Opts): boolean;
    isBinaryExpression(opts?: Opts): boolean;
    isBindExpression(opts?: Opts): boolean;
    isBindingIdentifier(opts?: Opts): boolean;
    isBlock(opts?: Opts): boolean;
    isBlockParent(opts?: Opts): boolean;
    isBlockScoped(opts?: Opts): boolean;
    isBlockStatement(opts?: Opts): boolean;
    isBooleanLiteral(opts?: Opts): boolean;
    isBooleanLiteralTypeAnnotation(opts?: Opts): boolean;
    isBooleanTypeAnnotation(opts?: Opts): boolean;
    isBreakStatement(opts?: Opts): boolean;
    isCallExpression(opts?: Opts): boolean;
    isCatchClause(opts?: Opts): boolean;
    isClass(opts?: Opts): boolean;
    isClassAccessorProperty(opts?: Opts): boolean;
    isClassBody(opts?: Opts): boolean;
    isClassDeclaration(opts?: Opts): boolean;
    isClassExpression(opts?: Opts): boolean;
    isClassImplements(opts?: Opts): boolean;
    isClassMethod(opts?: Opts): boolean;
    isClassPrivateMethod(opts?: Opts): boolean;
    isClassPrivateProperty(opts?: Opts): boolean;
    isClassProperty(opts?: Opts): boolean;
    isCompletionStatement(opts?: Opts): boolean;
    isConditional(opts?: Opts): boolean;
    isConditionalExpression(opts?: Opts): boolean;
    isContinueStatement(opts?: Opts): boolean;
    isDebuggerStatement(opts?: Opts): boolean;
    isDecimalLiteral(opts?: Opts): boolean;
    isDeclaration(opts?: Opts): boolean;
    isDeclareClass(opts?: Opts): boolean;
    isDeclareExportAllDeclaration(opts?: Opts): boolean;
    isDeclareExportDeclaration(opts?: Opts): boolean;
    isDeclareFunction(opts?: Opts): boolean;
    isDeclareInterface(opts?: Opts): boolean;
    isDeclareModule(opts?: Opts): boolean;
    isDeclareModuleExports(opts?: Opts): boolean;
    isDeclareOpaqueType(opts?: Opts): boolean;
    isDeclareTypeAlias(opts?: Opts): boolean;
    isDeclareVariable(opts?: Opts): boolean;
    isDeclaredPredicate(opts?: Opts): boolean;
    isDecorator(opts?: Opts): boolean;
    isDirective(opts?: Opts): boolean;
    isDirectiveLiteral(opts?: Opts): boolean;
    isDoExpression(opts?: Opts): boolean;
    isDoWhileStatement(opts?: Opts): boolean;
    isEmptyStatement(opts?: Opts): boolean;
    isEmptyTypeAnnotation(opts?: Opts): boolean;
    isEnumBody(opts?: Opts): boolean;
    isEnumBooleanBody(opts?: Opts): boolean;
    isEnumBooleanMember(opts?: Opts): boolean;
    isEnumDeclaration(opts?: Opts): boolean;
    isEnumDefaultedMember(opts?: Opts): boolean;
    isEnumMember(opts?: Opts): boolean;
    isEnumNumberBody(opts?: Opts): boolean;
    isEnumNumberMember(opts?: Opts): boolean;
    isEnumStringBody(opts?: Opts): boolean;
    isEnumStringMember(opts?: Opts): boolean;
    isEnumSymbolBody(opts?: Opts): boolean;
    isExistentialTypeParam(opts?: Opts): boolean;
    isExistsTypeAnnotation(opts?: Opts): boolean;
    isExportAllDeclaration(opts?: Opts): boolean;
    isExportDeclaration(opts?: Opts): boolean;
    isExportDefaultDeclaration(opts?: Opts): boolean;
    isExportDefaultSpecifier(opts?: Opts): boolean;
    isExportNamedDeclaration(opts?: Opts): boolean;
    isExportNamespaceSpecifier(opts?: Opts): boolean;
    isExportSpecifier(opts?: Opts): boolean;
    isExpression(opts?: Opts): boolean;
    isExpressionStatement(opts?: Opts): boolean;
    isExpressionWrapper(opts?: Opts): boolean;
    isFile(opts?: Opts): boolean;
    isFlow(opts?: Opts): boolean;
    isFlowBaseAnnotation(opts?: Opts): boolean;
    isFlowDeclaration(opts?: Opts): boolean;
    isFlowPredicate(opts?: Opts): boolean;
    isFlowType(opts?: Opts): boolean;
    isFor(opts?: Opts): boolean;
    isForAwaitStatement(opts?: Opts): boolean;
    isForInStatement(opts?: Opts): boolean;
    isForOfStatement(opts?: Opts): boolean;
    isForStatement(opts?: Opts): boolean;
    isForXStatement(opts?: Opts): boolean;
    isFunction(opts?: Opts): boolean;
    isFunctionDeclaration(opts?: Opts): boolean;
    isFunctionExpression(opts?: Opts): boolean;
    isFunctionParameter(opts?: Opts): boolean;
    isFunctionParent(opts?: Opts): boolean;
    isFunctionTypeAnnotation(opts?: Opts): boolean;
    isFunctionTypeParam(opts?: Opts): boolean;
    isGenerated(opts?: Opts): boolean;
    isGenericTypeAnnotation(opts?: Opts): boolean;
    isIdentifier(opts?: Opts): boolean;
    isIfStatement(opts?: Opts): boolean;
    isImmutable(opts?: Opts): boolean;
    isImport(opts?: Opts): boolean;
    isImportAttribute(opts?: Opts): boolean;
    isImportDeclaration(opts?: Opts): boolean;
    isImportDefaultSpecifier(opts?: Opts): boolean;
    isImportExpression(opts?: Opts): boolean;
    isImportNamespaceSpecifier(opts?: Opts): boolean;
    isImportOrExportDeclaration(opts?: Opts): boolean;
    isImportSpecifier(opts?: Opts): boolean;
    isIndexedAccessType(opts?: Opts): boolean;
    isInferredPredicate(opts?: Opts): boolean;
    isInterfaceDeclaration(opts?: Opts): boolean;
    isInterfaceExtends(opts?: Opts): boolean;
    isInterfaceTypeAnnotation(opts?: Opts): boolean;
    isInterpreterDirective(opts?: Opts): boolean;
    isIntersectionTypeAnnotation(opts?: Opts): boolean;
    isJSX(opts?: Opts): boolean;
    isJSXAttribute(opts?: Opts): boolean;
    isJSXClosingElement(opts?: Opts): boolean;
    isJSXClosingFragment(opts?: Opts): boolean;
    isJSXElement(opts?: Opts): boolean;
    isJSXEmptyExpression(opts?: Opts): boolean;
    isJSXExpressionContainer(opts?: Opts): boolean;
    isJSXFragment(opts?: Opts): boolean;
    isJSXIdentifier(opts?: Opts): boolean;
    isJSXMemberExpression(opts?: Opts): boolean;
    isJSXNamespacedName(opts?: Opts): boolean;
    isJSXOpeningElement(opts?: Opts): boolean;
    isJSXOpeningFragment(opts?: Opts): boolean;
    isJSXSpreadAttribute(opts?: Opts): boolean;
    isJSXSpreadChild(opts?: Opts): boolean;
    isJSXText(opts?: Opts): boolean;
    isLVal(opts?: Opts): boolean;
    isLabeledStatement(opts?: Opts): boolean;
    isLiteral(opts?: Opts): boolean;
    isLogicalExpression(opts?: Opts): boolean;
    isLoop(opts?: Opts): boolean;
    isMemberExpression(opts?: Opts): boolean;
    isMetaProperty(opts?: Opts): boolean;
    isMethod(opts?: Opts): boolean;
    isMiscellaneous(opts?: Opts): boolean;
    isMixedTypeAnnotation(opts?: Opts): boolean;
    isModuleDeclaration(opts?: Opts): boolean;
    isModuleExpression(opts?: Opts): boolean;
    isModuleSpecifier(opts?: Opts): boolean;
    isNewExpression(opts?: Opts): boolean;
    isNoop(opts?: Opts): boolean;
    isNullLiteral(opts?: Opts): boolean;
    isNullLiteralTypeAnnotation(opts?: Opts): boolean;
    isNullableTypeAnnotation(opts?: Opts): boolean;
    isNumberLiteral(opts?: Opts): boolean;
    isNumberLiteralTypeAnnotation(opts?: Opts): boolean;
    isNumberTypeAnnotation(opts?: Opts): boolean;
    isNumericLiteral(opts?: Opts): boolean;
    isNumericLiteralTypeAnnotation(opts?: Opts): boolean;
    isObjectExpression(opts?: Opts): boolean;
    isObjectMember(opts?: Opts): boolean;
    isObjectMethod(opts?: Opts): boolean;
    isObjectPattern(opts?: Opts): boolean;
    isObjectProperty(opts?: Opts): boolean;
    isObjectTypeAnnotation(opts?: Opts): boolean;
    isObjectTypeCallProperty(opts?: Opts): boolean;
    isObjectTypeIndexer(opts?: Opts): boolean;
    isObjectTypeInternalSlot(opts?: Opts): boolean;
    isObjectTypeProperty(opts?: Opts): boolean;
    isObjectTypeSpreadProperty(opts?: Opts): boolean;
    isOpaqueType(opts?: Opts): boolean;
    isOptionalCallExpression(opts?: Opts): boolean;
    isOptionalIndexedAccessType(opts?: Opts): boolean;
    isOptionalMemberExpression(opts?: Opts): boolean;
    isParenthesizedExpression(opts?: Opts): boolean;
    isPattern(opts?: Opts): boolean;
    isPatternLike(opts?: Opts): boolean;
    isPipelineBareFunction(opts?: Opts): boolean;
    isPipelinePrimaryTopicReference(opts?: Opts): boolean;
    isPipelineTopicExpression(opts?: Opts): boolean;
    isPlaceholder(opts?: Opts): boolean;
    isPrivate(opts?: Opts): boolean;
    isPrivateName(opts?: Opts): boolean;
    isProgram(opts?: Opts): boolean;
    isProperty(opts?: Opts): boolean;
    isPure(opts?: Opts): boolean;
    isPureish(opts?: Opts): boolean;
    isQualifiedTypeIdentifier(opts?: Opts): boolean;
    isRecordExpression(opts?: Opts): boolean;
    isReferenced(opts?: Opts): boolean;
    isReferencedIdentifier(opts?: Opts): boolean;
    isReferencedMemberExpression(opts?: Opts): boolean;
    isRegExpLiteral(opts?: Opts): boolean;
    isRegexLiteral(opts?: Opts): boolean;
    isRestElement(opts?: Opts): boolean;
    isRestProperty(opts?: Opts): boolean;
    isReturnStatement(opts?: Opts): boolean;
    isScopable(opts?: Opts): boolean;
    isScope(opts?: Opts): boolean;
    isSequenceExpression(opts?: Opts): boolean;
    isSpreadElement(opts?: Opts): boolean;
    isSpreadProperty(opts?: Opts): boolean;
    isStandardized(opts?: Opts): boolean;
    isStatement(opts?: Opts): boolean;
    isStaticBlock(opts?: Opts): boolean;
    isStringLiteral(opts?: Opts): boolean;
    isStringLiteralTypeAnnotation(opts?: Opts): boolean;
    isStringTypeAnnotation(opts?: Opts): boolean;
    isSuper(opts?: Opts): boolean;
    isSwitchCase(opts?: Opts): boolean;
    isSwitchStatement(opts?: Opts): boolean;
    isSymbolTypeAnnotation(opts?: Opts): boolean;
    isTSAnyKeyword(opts?: Opts): boolean;
    isTSArrayType(opts?: Opts): boolean;
    isTSAsExpression(opts?: Opts): boolean;
    isTSBaseType(opts?: Opts): boolean;
    isTSBigIntKeyword(opts?: Opts): boolean;
    isTSBooleanKeyword(opts?: Opts): boolean;
    isTSCallSignatureDeclaration(opts?: Opts): boolean;
    isTSConditionalType(opts?: Opts): boolean;
    isTSConstructSignatureDeclaration(opts?: Opts): boolean;
    isTSConstructorType(opts?: Opts): boolean;
    isTSDeclareFunction(opts?: Opts): boolean;
    isTSDeclareMethod(opts?: Opts): boolean;
    isTSEntityName(opts?: Opts): boolean;
    isTSEnumBody(opts?: Opts): boolean;
    isTSEnumDeclaration(opts?: Opts): boolean;
    isTSEnumMember(opts?: Opts): boolean;
    isTSExportAssignment(opts?: Opts): boolean;
    isTSExpressionWithTypeArguments(opts?: Opts): boolean;
    isTSExternalModuleReference(opts?: Opts): boolean;
    isTSFunctionType(opts?: Opts): boolean;
    isTSImportEqualsDeclaration(opts?: Opts): boolean;
    isTSImportType(opts?: Opts): boolean;
    isTSIndexSignature(opts?: Opts): boolean;
    isTSIndexedAccessType(opts?: Opts): boolean;
    isTSInferType(opts?: Opts): boolean;
    isTSInstantiationExpression(opts?: Opts): boolean;
    isTSInterfaceBody(opts?: Opts): boolean;
    isTSInterfaceDeclaration(opts?: Opts): boolean;
    isTSIntersectionType(opts?: Opts): boolean;
    isTSIntrinsicKeyword(opts?: Opts): boolean;
    isTSLiteralType(opts?: Opts): boolean;
    isTSMappedType(opts?: Opts): boolean;
    isTSMethodSignature(opts?: Opts): boolean;
    isTSModuleBlock(opts?: Opts): boolean;
    isTSModuleDeclaration(opts?: Opts): boolean;
    isTSNamedTupleMember(opts?: Opts): boolean;
    isTSNamespaceExportDeclaration(opts?: Opts): boolean;
    isTSNeverKeyword(opts?: Opts): boolean;
    isTSNonNullExpression(opts?: Opts): boolean;
    isTSNullKeyword(opts?: Opts): boolean;
    isTSNumberKeyword(opts?: Opts): boolean;
    isTSObjectKeyword(opts?: Opts): boolean;
    isTSOptionalType(opts?: Opts): boolean;
    isTSParameterProperty(opts?: Opts): boolean;
    isTSParenthesizedType(opts?: Opts): boolean;
    isTSPropertySignature(opts?: Opts): boolean;
    isTSQualifiedName(opts?: Opts): boolean;
    isTSRestType(opts?: Opts): boolean;
    isTSSatisfiesExpression(opts?: Opts): boolean;
    isTSStringKeyword(opts?: Opts): boolean;
    isTSSymbolKeyword(opts?: Opts): boolean;
    isTSTemplateLiteralType(opts?: Opts): boolean;
    isTSThisType(opts?: Opts): boolean;
    isTSTupleType(opts?: Opts): boolean;
    isTSType(opts?: Opts): boolean;
    isTSTypeAliasDeclaration(opts?: Opts): boolean;
    isTSTypeAnnotation(opts?: Opts): boolean;
    isTSTypeAssertion(opts?: Opts): boolean;
    isTSTypeElement(opts?: Opts): boolean;
    isTSTypeLiteral(opts?: Opts): boolean;
    isTSTypeOperator(opts?: Opts): boolean;
    isTSTypeParameter(opts?: Opts): boolean;
    isTSTypeParameterDeclaration(opts?: Opts): boolean;
    isTSTypeParameterInstantiation(opts?: Opts): boolean;
    isTSTypePredicate(opts?: Opts): boolean;
    isTSTypeQuery(opts?: Opts): boolean;
    isTSTypeReference(opts?: Opts): boolean;
    isTSUndefinedKeyword(opts?: Opts): boolean;
    isTSUnionType(opts?: Opts): boolean;
    isTSUnknownKeyword(opts?: Opts): boolean;
    isTSVoidKeyword(opts?: Opts): boolean;
    isTaggedTemplateExpression(opts?: Opts): boolean;
    isTemplateElement(opts?: Opts): boolean;
    isTemplateLiteral(opts?: Opts): boolean;
    isTerminatorless(opts?: Opts): boolean;
    isThisExpression(opts?: Opts): boolean;
    isThisTypeAnnotation(opts?: Opts): boolean;
    isThrowStatement(opts?: Opts): boolean;
    isTopicReference(opts?: Opts): boolean;
    isTryStatement(opts?: Opts): boolean;
    isTupleExpression(opts?: Opts): boolean;
    isTupleTypeAnnotation(opts?: Opts): boolean;
    isTypeAlias(opts?: Opts): boolean;
    isTypeAnnotation(opts?: Opts): boolean;
    isTypeCastExpression(opts?: Opts): boolean;
    isTypeParameter(opts?: Opts): boolean;
    isTypeParameterDeclaration(opts?: Opts): boolean;
    isTypeParameterInstantiation(opts?: Opts): boolean;
    isTypeScript(opts?: Opts): boolean;
    isTypeofTypeAnnotation(opts?: Opts): boolean;
    isUnaryExpression(opts?: Opts): boolean;
    isUnaryLike(opts?: Opts): boolean;
    isUnionTypeAnnotation(opts?: Opts): boolean;
    isUpdateExpression(opts?: Opts): boolean;
    isUser(opts?: Opts): boolean;
    isUserWhitespacable(opts?: Opts): boolean;
    isV8IntrinsicIdentifier(opts?: Opts): boolean;
    isVar(opts?: Opts): boolean;
    isVariableDeclaration(opts?: Opts): boolean;
    isVariableDeclarator(opts?: Opts): boolean;
    isVariance(opts?: Opts): boolean;
    isVoidPattern(opts?: Opts): boolean;
    isVoidTypeAnnotation(opts?: Opts): boolean;
    isWhile(opts?: Opts): boolean;
    isWhileStatement(opts?: Opts): boolean;
    isWithStatement(opts?: Opts): boolean;
    isYieldExpression(opts?: Opts): boolean;
    assertAccessor(opts?: Opts): void;
    assertAnyTypeAnnotation(opts?: Opts): void;
    assertArgumentPlaceholder(opts?: Opts): void;
    assertArrayExpression(opts?: Opts): void;
    assertArrayPattern(opts?: Opts): void;
    assertArrayTypeAnnotation(opts?: Opts): void;
    assertArrowFunctionExpression(opts?: Opts): void;
    assertAssignmentExpression(opts?: Opts): void;
    assertAssignmentPattern(opts?: Opts): void;
    assertAwaitExpression(opts?: Opts): void;
    assertBigIntLiteral(opts?: Opts): void;
    assertBinary(opts?: Opts): void;
    assertBinaryExpression(opts?: Opts): void;
    assertBindExpression(opts?: Opts): void;
    assertBindingIdentifier(opts?: Opts): void;
    assertBlock(opts?: Opts): void;
    assertBlockParent(opts?: Opts): void;
    assertBlockScoped(opts?: Opts): void;
    assertBlockStatement(opts?: Opts): void;
    assertBooleanLiteral(opts?: Opts): void;
    assertBooleanLiteralTypeAnnotation(opts?: Opts): void;
    assertBooleanTypeAnnotation(opts?: Opts): void;
    assertBreakStatement(opts?: Opts): void;
    assertCallExpression(opts?: Opts): void;
    assertCatchClause(opts?: Opts): void;
    assertClass(opts?: Opts): void;
    assertClassAccessorProperty(opts?: Opts): void;
    assertClassBody(opts?: Opts): void;
    assertClassDeclaration(opts?: Opts): void;
    assertClassExpression(opts?: Opts): void;
    assertClassImplements(opts?: Opts): void;
    assertClassMethod(opts?: Opts): void;
    assertClassPrivateMethod(opts?: Opts): void;
    assertClassPrivateProperty(opts?: Opts): void;
    assertClassProperty(opts?: Opts): void;
    assertCompletionStatement(opts?: Opts): void;
    assertConditional(opts?: Opts): void;
    assertConditionalExpression(opts?: Opts): void;
    assertContinueStatement(opts?: Opts): void;
    assertDebuggerStatement(opts?: Opts): void;
    assertDecimalLiteral(opts?: Opts): void;
    assertDeclaration(opts?: Opts): void;
    assertDeclareClass(opts?: Opts): void;
    assertDeclareExportAllDeclaration(opts?: Opts): void;
    assertDeclareExportDeclaration(opts?: Opts): void;
    assertDeclareFunction(opts?: Opts): void;
    assertDeclareInterface(opts?: Opts): void;
    assertDeclareModule(opts?: Opts): void;
    assertDeclareModuleExports(opts?: Opts): void;
    assertDeclareOpaqueType(opts?: Opts): void;
    assertDeclareTypeAlias(opts?: Opts): void;
    assertDeclareVariable(opts?: Opts): void;
    assertDeclaredPredicate(opts?: Opts): void;
    assertDecorator(opts?: Opts): void;
    assertDirective(opts?: Opts): void;
    assertDirectiveLiteral(opts?: Opts): void;
    assertDoExpression(opts?: Opts): void;
    assertDoWhileStatement(opts?: Opts): void;
    assertEmptyStatement(opts?: Opts): void;
    assertEmptyTypeAnnotation(opts?: Opts): void;
    assertEnumBody(opts?: Opts): void;
    assertEnumBooleanBody(opts?: Opts): void;
    assertEnumBooleanMember(opts?: Opts): void;
    assertEnumDeclaration(opts?: Opts): void;
    assertEnumDefaultedMember(opts?: Opts): void;
    assertEnumMember(opts?: Opts): void;
    assertEnumNumberBody(opts?: Opts): void;
    assertEnumNumberMember(opts?: Opts): void;
    assertEnumStringBody(opts?: Opts): void;
    assertEnumStringMember(opts?: Opts): void;
    assertEnumSymbolBody(opts?: Opts): void;
    assertExistentialTypeParam(opts?: Opts): void;
    assertExistsTypeAnnotation(opts?: Opts): void;
    assertExportAllDeclaration(opts?: Opts): void;
    assertExportDeclaration(opts?: Opts): void;
    assertExportDefaultDeclaration(opts?: Opts): void;
    assertExportDefaultSpecifier(opts?: Opts): void;
    assertExportNamedDeclaration(opts?: Opts): void;
    assertExportNamespaceSpecifier(opts?: Opts): void;
    assertExportSpecifier(opts?: Opts): void;
    assertExpression(opts?: Opts): void;
    assertExpressionStatement(opts?: Opts): void;
    assertExpressionWrapper(opts?: Opts): void;
    assertFile(opts?: Opts): void;
    assertFlow(opts?: Opts): void;
    assertFlowBaseAnnotation(opts?: Opts): void;
    assertFlowDeclaration(opts?: Opts): void;
    assertFlowPredicate(opts?: Opts): void;
    assertFlowType(opts?: Opts): void;
    assertFor(opts?: Opts): void;
    assertForAwaitStatement(opts?: Opts): void;
    assertForInStatement(opts?: Opts): void;
    assertForOfStatement(opts?: Opts): void;
    assertForStatement(opts?: Opts): void;
    assertForXStatement(opts?: Opts): void;
    assertFunction(opts?: Opts): void;
    assertFunctionDeclaration(opts?: Opts): void;
    assertFunctionExpression(opts?: Opts): void;
    assertFunctionParameter(opts?: Opts): void;
    assertFunctionParent(opts?: Opts): void;
    assertFunctionTypeAnnotation(opts?: Opts): void;
    assertFunctionTypeParam(opts?: Opts): void;
    assertGenerated(opts?: Opts): void;
    assertGenericTypeAnnotation(opts?: Opts): void;
    assertIdentifier(opts?: Opts): void;
    assertIfStatement(opts?: Opts): void;
    assertImmutable(opts?: Opts): void;
    assertImport(opts?: Opts): void;
    assertImportAttribute(opts?: Opts): void;
    assertImportDeclaration(opts?: Opts): void;
    assertImportDefaultSpecifier(opts?: Opts): void;
    assertImportExpression(opts?: Opts): void;
    assertImportNamespaceSpecifier(opts?: Opts): void;
    assertImportOrExportDeclaration(opts?: Opts): void;
    assertImportSpecifier(opts?: Opts): void;
    assertIndexedAccessType(opts?: Opts): void;
    assertInferredPredicate(opts?: Opts): void;
    assertInterfaceDeclaration(opts?: Opts): void;
    assertInterfaceExtends(opts?: Opts): void;
    assertInterfaceTypeAnnotation(opts?: Opts): void;
    assertInterpreterDirective(opts?: Opts): void;
    assertIntersectionTypeAnnotation(opts?: Opts): void;
    assertJSX(opts?: Opts): void;
    assertJSXAttribute(opts?: Opts): void;
    assertJSXClosingElement(opts?: Opts): void;
    assertJSXClosingFragment(opts?: Opts): void;
    assertJSXElement(opts?: Opts): void;
    assertJSXEmptyExpression(opts?: Opts): void;
    assertJSXExpressionContainer(opts?: Opts): void;
    assertJSXFragment(opts?: Opts): void;
    assertJSXIdentifier(opts?: Opts): void;
    assertJSXMemberExpression(opts?: Opts): void;
    assertJSXNamespacedName(opts?: Opts): void;
    assertJSXOpeningElement(opts?: Opts): void;
    assertJSXOpeningFragment(opts?: Opts): void;
    assertJSXSpreadAttribute(opts?: Opts): void;
    assertJSXSpreadChild(opts?: Opts): void;
    assertJSXText(opts?: Opts): void;
    assertLVal(opts?: Opts): void;
    assertLabeledStatement(opts?: Opts): void;
    assertLiteral(opts?: Opts): void;
    assertLogicalExpression(opts?: Opts): void;
    assertLoop(opts?: Opts): void;
    assertMemberExpression(opts?: Opts): void;
    assertMetaProperty(opts?: Opts): void;
    assertMethod(opts?: Opts): void;
    assertMiscellaneous(opts?: Opts): void;
    assertMixedTypeAnnotation(opts?: Opts): void;
    assertModuleDeclaration(opts?: Opts): void;
    assertModuleExpression(opts?: Opts): void;
    assertModuleSpecifier(opts?: Opts): void;
    assertNewExpression(opts?: Opts): void;
    assertNoop(opts?: Opts): void;
    assertNullLiteral(opts?: Opts): void;
    assertNullLiteralTypeAnnotation(opts?: Opts): void;
    assertNullableTypeAnnotation(opts?: Opts): void;
    assertNumberLiteral(opts?: Opts): void;
    assertNumberLiteralTypeAnnotation(opts?: Opts): void;
    assertNumberTypeAnnotation(opts?: Opts): void;
    assertNumericLiteral(opts?: Opts): void;
    assertNumericLiteralTypeAnnotation(opts?: Opts): void;
    assertObjectExpression(opts?: Opts): void;
    assertObjectMember(opts?: Opts): void;
    assertObjectMethod(opts?: Opts): void;
    assertObjectPattern(opts?: Opts): void;
    assertObjectProperty(opts?: Opts): void;
    assertObjectTypeAnnotation(opts?: Opts): void;
    assertObjectTypeCallProperty(opts?: Opts): void;
    assertObjectTypeIndexer(opts?: Opts): void;
    assertObjectTypeInternalSlot(opts?: Opts): void;
    assertObjectTypeProperty(opts?: Opts): void;
    assertObjectTypeSpreadProperty(opts?: Opts): void;
    assertOpaqueType(opts?: Opts): void;
    assertOptionalCallExpression(opts?: Opts): void;
    assertOptionalIndexedAccessType(opts?: Opts): void;
    assertOptionalMemberExpression(opts?: Opts): void;
    assertParenthesizedExpression(opts?: Opts): void;
    assertPattern(opts?: Opts): void;
    assertPatternLike(opts?: Opts): void;
    assertPipelineBareFunction(opts?: Opts): void;
    assertPipelinePrimaryTopicReference(opts?: Opts): void;
    assertPipelineTopicExpression(opts?: Opts): void;
    assertPlaceholder(opts?: Opts): void;
    assertPrivate(opts?: Opts): void;
    assertPrivateName(opts?: Opts): void;
    assertProgram(opts?: Opts): void;
    assertProperty(opts?: Opts): void;
    assertPure(opts?: Opts): void;
    assertPureish(opts?: Opts): void;
    assertQualifiedTypeIdentifier(opts?: Opts): void;
    assertRecordExpression(opts?: Opts): void;
    assertReferenced(opts?: Opts): void;
    assertReferencedIdentifier(opts?: Opts): void;
    assertReferencedMemberExpression(opts?: Opts): void;
    assertRegExpLiteral(opts?: Opts): void;
    assertRegexLiteral(opts?: Opts): void;
    assertRestElement(opts?: Opts): void;
    assertRestProperty(opts?: Opts): void;
    assertReturnStatement(opts?: Opts): void;
    assertScopable(opts?: Opts): void;
    assertScope(opts?: Opts): void;
    assertSequenceExpression(opts?: Opts): void;
    assertSpreadElement(opts?: Opts): void;
    assertSpreadProperty(opts?: Opts): void;
    assertStandardized(opts?: Opts): void;
    assertStatement(opts?: Opts): void;
    assertStaticBlock(opts?: Opts): void;
    assertStringLiteral(opts?: Opts): void;
    assertStringLiteralTypeAnnotation(opts?: Opts): void;
    assertStringTypeAnnotation(opts?: Opts): void;
    assertSuper(opts?: Opts): void;
    assertSwitchCase(opts?: Opts): void;
    assertSwitchStatement(opts?: Opts): void;
    assertSymbolTypeAnnotation(opts?: Opts): void;
    assertTSAnyKeyword(opts?: Opts): void;
    assertTSArrayType(opts?: Opts): void;
    assertTSAsExpression(opts?: Opts): void;
    assertTSBaseType(opts?: Opts): void;
    assertTSBigIntKeyword(opts?: Opts): void;
    assertTSBooleanKeyword(opts?: Opts): void;
    assertTSCallSignatureDeclaration(opts?: Opts): void;
    assertTSConditionalType(opts?: Opts): void;
    assertTSConstructSignatureDeclaration(opts?: Opts): void;
    assertTSConstructorType(opts?: Opts): void;
    assertTSDeclareFunction(opts?: Opts): void;
    assertTSDeclareMethod(opts?: Opts): void;
    assertTSEntityName(opts?: Opts): void;
    assertTSEnumBody(opts?: Opts): void;
    assertTSEnumDeclaration(opts?: Opts): void;
    assertTSEnumMember(opts?: Opts): void;
    assertTSExportAssignment(opts?: Opts): void;
    assertTSExpressionWithTypeArguments(opts?: Opts): void;
    assertTSExternalModuleReference(opts?: Opts): void;
    assertTSFunctionType(opts?: Opts): void;
    assertTSImportEqualsDeclaration(opts?: Opts): void;
    assertTSImportType(opts?: Opts): void;
    assertTSIndexSignature(opts?: Opts): void;
    assertTSIndexedAccessType(opts?: Opts): void;
    assertTSInferType(opts?: Opts): void;
    assertTSInstantiationExpression(opts?: Opts): void;
    assertTSInterfaceBody(opts?: Opts): void;
    assertTSInterfaceDeclaration(opts?: Opts): void;
    assertTSIntersectionType(opts?: Opts): void;
    assertTSIntrinsicKeyword(opts?: Opts): void;
    assertTSLiteralType(opts?: Opts): void;
    assertTSMappedType(opts?: Opts): void;
    assertTSMethodSignature(opts?: Opts): void;
    assertTSModuleBlock(opts?: Opts): void;
    assertTSModuleDeclaration(opts?: Opts): void;
    assertTSNamedTupleMember(opts?: Opts): void;
    assertTSNamespaceExportDeclaration(opts?: Opts): void;
    assertTSNeverKeyword(opts?: Opts): void;
    assertTSNonNullExpression(opts?: Opts): void;
    assertTSNullKeyword(opts?: Opts): void;
    assertTSNumberKeyword(opts?: Opts): void;
    assertTSObjectKeyword(opts?: Opts): void;
    assertTSOptionalType(opts?: Opts): void;
    assertTSParameterProperty(opts?: Opts): void;
    assertTSParenthesizedType(opts?: Opts): void;
    assertTSPropertySignature(opts?: Opts): void;
    assertTSQualifiedName(opts?: Opts): void;
    assertTSRestType(opts?: Opts): void;
    assertTSSatisfiesExpression(opts?: Opts): void;
    assertTSStringKeyword(opts?: Opts): void;
    assertTSSymbolKeyword(opts?: Opts): void;
    assertTSTemplateLiteralType(opts?: Opts): void;
    assertTSThisType(opts?: Opts): void;
    assertTSTupleType(opts?: Opts): void;
    assertTSType(opts?: Opts): void;
    assertTSTypeAliasDeclaration(opts?: Opts): void;
    assertTSTypeAnnotation(opts?: Opts): void;
    assertTSTypeAssertion(opts?: Opts): void;
    assertTSTypeElement(opts?: Opts): void;
    assertTSTypeLiteral(opts?: Opts): void;
    assertTSTypeOperator(opts?: Opts): void;
    assertTSTypeParameter(opts?: Opts): void;
    assertTSTypeParameterDeclaration(opts?: Opts): void;
    assertTSTypeParameterInstantiation(opts?: Opts): void;
    assertTSTypePredicate(opts?: Opts): void;
    assertTSTypeQuery(opts?: Opts): void;
    assertTSTypeReference(opts?: Opts): void;
    assertTSUndefinedKeyword(opts?: Opts): void;
    assertTSUnionType(opts?: Opts): void;
    assertTSUnknownKeyword(opts?: Opts): void;
    assertTSVoidKeyword(opts?: Opts): void;
    assertTaggedTemplateExpression(opts?: Opts): void;
    assertTemplateElement(opts?: Opts): void;
    assertTemplateLiteral(opts?: Opts): void;
    assertTerminatorless(opts?: Opts): void;
    assertThisExpression(opts?: Opts): void;
    assertThisTypeAnnotation(opts?: Opts): void;
    assertThrowStatement(opts?: Opts): void;
    assertTopicReference(opts?: Opts): void;
    assertTryStatement(opts?: Opts): void;
    assertTupleExpression(opts?: Opts): void;
    assertTupleTypeAnnotation(opts?: Opts): void;
    assertTypeAlias(opts?: Opts): void;
    assertTypeAnnotation(opts?: Opts): void;
    assertTypeCastExpression(opts?: Opts): void;
    assertTypeParameter(opts?: Opts): void;
    assertTypeParameterDeclaration(opts?: Opts): void;
    assertTypeParameterInstantiation(opts?: Opts): void;
    assertTypeScript(opts?: Opts): void;
    assertTypeofTypeAnnotation(opts?: Opts): void;
    assertUnaryExpression(opts?: Opts): void;
    assertUnaryLike(opts?: Opts): void;
    assertUnionTypeAnnotation(opts?: Opts): void;
    assertUpdateExpression(opts?: Opts): void;
    assertUser(opts?: Opts): void;
    assertUserWhitespacable(opts?: Opts): void;
    assertV8IntrinsicIdentifier(opts?: Opts): void;
    assertVar(opts?: Opts): void;
    assertVariableDeclaration(opts?: Opts): void;
    assertVariableDeclarator(opts?: Opts): void;
    assertVariance(opts?: Opts): void;
    assertVoidPattern(opts?: Opts): void;
    assertVoidTypeAnnotation(opts?: Opts): void;
    assertWhile(opts?: Opts): void;
    assertWhileStatement(opts?: Opts): void;
    assertWithStatement(opts?: Opts): void;
    assertYieldExpression(opts?: Opts): void;
    // END GENERATED NODE PATH METHODS
  }

  declare export type VisitNodeFunction<-TNode extends BabelNode, TState> = (
    path: NodePath<TNode>,
    state: TState,
  ) => void;

  declare export type VisitNodeObject<
    -TNode extends BabelNode,
    TState,
  > = Partial<{
    enter(path: NodePath<TNode>, state: TState): void,
    exit(path: NodePath<TNode>, state: TState): void,
  }>;

  declare export type VisitNode<-TNode extends BabelNode, TState> =
    | VisitNodeFunction<TNode, TState>
    | VisitNodeObject<TNode, TState>;

  declare export type Visitor<TState = void> = Readonly<{
    enter?: VisitNodeFunction<BabelNode, TState>,
    exit?: VisitNodeFunction<BabelNode, TState>,

    // This section is automatically generated. Don't edit by hand.
    // See the comment at the top of the file on how to update the definitions.
    // BEGIN GENERATED VISITOR METHODS
    Accessor?: VisitNode<BabelNodeAccessor, TState>,
    AnyTypeAnnotation?: VisitNode<BabelNodeAnyTypeAnnotation, TState>,
    ArgumentPlaceholder?: VisitNode<BabelNodeArgumentPlaceholder, TState>,
    ArrayExpression?: VisitNode<BabelNodeArrayExpression, TState>,
    ArrayPattern?: VisitNode<BabelNodeArrayPattern, TState>,
    ArrayTypeAnnotation?: VisitNode<BabelNodeArrayTypeAnnotation, TState>,
    ArrowFunctionExpression?: VisitNode<
      BabelNodeArrowFunctionExpression,
      TState,
    >,
    AssignmentExpression?: VisitNode<BabelNodeAssignmentExpression, TState>,
    AssignmentPattern?: VisitNode<BabelNodeAssignmentPattern, TState>,
    AwaitExpression?: VisitNode<BabelNodeAwaitExpression, TState>,
    BigIntLiteral?: VisitNode<BabelNodeBigIntLiteral, TState>,
    Binary?: VisitNode<BabelNodeBinary, TState>,
    BinaryExpression?: VisitNode<BabelNodeBinaryExpression, TState>,
    BindExpression?: VisitNode<BabelNodeBindExpression, TState>,
    BindingIdentifier?: VisitNode<BabelNode, TState>,
    Block?: VisitNode<BabelNodeBlock, TState>,
    BlockParent?: VisitNode<BabelNodeBlockParent, TState>,
    BlockScoped?: VisitNode<BabelNode, TState>,
    BlockStatement?: VisitNode<BabelNodeBlockStatement, TState>,
    BooleanLiteral?: VisitNode<BabelNodeBooleanLiteral, TState>,
    BooleanLiteralTypeAnnotation?: VisitNode<
      BabelNodeBooleanLiteralTypeAnnotation,
      TState,
    >,
    BooleanTypeAnnotation?: VisitNode<BabelNodeBooleanTypeAnnotation, TState>,
    BreakStatement?: VisitNode<BabelNodeBreakStatement, TState>,
    CallExpression?: VisitNode<BabelNodeCallExpression, TState>,
    CatchClause?: VisitNode<BabelNodeCatchClause, TState>,
    Class?: VisitNode<BabelNodeClass, TState>,
    ClassAccessorProperty?: VisitNode<BabelNodeClassAccessorProperty, TState>,
    ClassBody?: VisitNode<BabelNodeClassBody, TState>,
    ClassDeclaration?: VisitNode<BabelNodeClassDeclaration, TState>,
    ClassExpression?: VisitNode<BabelNodeClassExpression, TState>,
    ClassImplements?: VisitNode<BabelNodeClassImplements, TState>,
    ClassMethod?: VisitNode<BabelNodeClassMethod, TState>,
    ClassPrivateMethod?: VisitNode<BabelNodeClassPrivateMethod, TState>,
    ClassPrivateProperty?: VisitNode<BabelNodeClassPrivateProperty, TState>,
    ClassProperty?: VisitNode<BabelNodeClassProperty, TState>,
    CompletionStatement?: VisitNode<BabelNodeCompletionStatement, TState>,
    Conditional?: VisitNode<BabelNodeConditional, TState>,
    ConditionalExpression?: VisitNode<BabelNodeConditionalExpression, TState>,
    ContinueStatement?: VisitNode<BabelNodeContinueStatement, TState>,
    DebuggerStatement?: VisitNode<BabelNodeDebuggerStatement, TState>,
    DecimalLiteral?: VisitNode<BabelNodeDecimalLiteral, TState>,
    Declaration?: VisitNode<BabelNodeDeclaration, TState>,
    DeclareClass?: VisitNode<BabelNodeDeclareClass, TState>,
    DeclareExportAllDeclaration?: VisitNode<
      BabelNodeDeclareExportAllDeclaration,
      TState,
    >,
    DeclareExportDeclaration?: VisitNode<
      BabelNodeDeclareExportDeclaration,
      TState,
    >,
    DeclareFunction?: VisitNode<BabelNodeDeclareFunction, TState>,
    DeclareInterface?: VisitNode<BabelNodeDeclareInterface, TState>,
    DeclareModule?: VisitNode<BabelNodeDeclareModule, TState>,
    DeclareModuleExports?: VisitNode<BabelNodeDeclareModuleExports, TState>,
    DeclareOpaqueType?: VisitNode<BabelNodeDeclareOpaqueType, TState>,
    DeclareTypeAlias?: VisitNode<BabelNodeDeclareTypeAlias, TState>,
    DeclareVariable?: VisitNode<BabelNodeDeclareVariable, TState>,
    DeclaredPredicate?: VisitNode<BabelNodeDeclaredPredicate, TState>,
    Decorator?: VisitNode<BabelNodeDecorator, TState>,
    Directive?: VisitNode<BabelNodeDirective, TState>,
    DirectiveLiteral?: VisitNode<BabelNodeDirectiveLiteral, TState>,
    DoExpression?: VisitNode<BabelNodeDoExpression, TState>,
    DoWhileStatement?: VisitNode<BabelNodeDoWhileStatement, TState>,
    EmptyStatement?: VisitNode<BabelNodeEmptyStatement, TState>,
    EmptyTypeAnnotation?: VisitNode<BabelNodeEmptyTypeAnnotation, TState>,
    EnumBody?: VisitNode<BabelNodeEnumBody, TState>,
    EnumBooleanBody?: VisitNode<BabelNodeEnumBooleanBody, TState>,
    EnumBooleanMember?: VisitNode<BabelNodeEnumBooleanMember, TState>,
    EnumDeclaration?: VisitNode<BabelNodeEnumDeclaration, TState>,
    EnumDefaultedMember?: VisitNode<BabelNodeEnumDefaultedMember, TState>,
    EnumMember?: VisitNode<BabelNodeEnumMember, TState>,
    EnumNumberBody?: VisitNode<BabelNodeEnumNumberBody, TState>,
    EnumNumberMember?: VisitNode<BabelNodeEnumNumberMember, TState>,
    EnumStringBody?: VisitNode<BabelNodeEnumStringBody, TState>,
    EnumStringMember?: VisitNode<BabelNodeEnumStringMember, TState>,
    EnumSymbolBody?: VisitNode<BabelNodeEnumSymbolBody, TState>,
    ExistentialTypeParam?: VisitNode<BabelNode, TState>,
    ExistsTypeAnnotation?: VisitNode<BabelNodeExistsTypeAnnotation, TState>,
    ExportAllDeclaration?: VisitNode<BabelNodeExportAllDeclaration, TState>,
    ExportDeclaration?: VisitNode<BabelNodeExportDeclaration, TState>,
    ExportDefaultDeclaration?: VisitNode<
      BabelNodeExportDefaultDeclaration,
      TState,
    >,
    ExportDefaultSpecifier?: VisitNode<BabelNodeExportDefaultSpecifier, TState>,
    ExportNamedDeclaration?: VisitNode<BabelNodeExportNamedDeclaration, TState>,
    ExportNamespaceSpecifier?: VisitNode<
      BabelNodeExportNamespaceSpecifier,
      TState,
    >,
    ExportSpecifier?: VisitNode<BabelNodeExportSpecifier, TState>,
    Expression?: VisitNode<BabelNodeExpression, TState>,
    ExpressionStatement?: VisitNode<BabelNodeExpressionStatement, TState>,
    ExpressionWrapper?: VisitNode<BabelNodeExpressionWrapper, TState>,
    Flow?: VisitNode<BabelNodeFlow, TState>,
    FlowBaseAnnotation?: VisitNode<BabelNodeFlowBaseAnnotation, TState>,
    FlowDeclaration?: VisitNode<BabelNodeFlowDeclaration, TState>,
    FlowPredicate?: VisitNode<BabelNodeFlowPredicate, TState>,
    FlowType?: VisitNode<BabelNodeFlowType, TState>,
    For?: VisitNode<BabelNodeFor, TState>,
    ForAwaitStatement?: VisitNode<BabelNode, TState>,
    ForInStatement?: VisitNode<BabelNodeForInStatement, TState>,
    ForOfStatement?: VisitNode<BabelNodeForOfStatement, TState>,
    ForStatement?: VisitNode<BabelNodeForStatement, TState>,
    ForXStatement?: VisitNode<BabelNodeForXStatement, TState>,
    Function?: VisitNode<BabelNodeFunction, TState>,
    FunctionDeclaration?: VisitNode<BabelNodeFunctionDeclaration, TState>,
    FunctionExpression?: VisitNode<BabelNodeFunctionExpression, TState>,
    FunctionParameter?: VisitNode<BabelNodeFunctionParameter, TState>,
    FunctionParent?: VisitNode<BabelNodeFunctionParent, TState>,
    FunctionTypeAnnotation?: VisitNode<BabelNodeFunctionTypeAnnotation, TState>,
    FunctionTypeParam?: VisitNode<BabelNodeFunctionTypeParam, TState>,
    Generated?: VisitNode<BabelNode, TState>,
    GenericTypeAnnotation?: VisitNode<BabelNodeGenericTypeAnnotation, TState>,
    Identifier?: VisitNode<BabelNodeIdentifier, TState>,
    IfStatement?: VisitNode<BabelNodeIfStatement, TState>,
    Immutable?: VisitNode<BabelNodeImmutable, TState>,
    Import?: VisitNode<BabelNodeImport, TState>,
    ImportAttribute?: VisitNode<BabelNodeImportAttribute, TState>,
    ImportDeclaration?: VisitNode<BabelNodeImportDeclaration, TState>,
    ImportDefaultSpecifier?: VisitNode<BabelNodeImportDefaultSpecifier, TState>,
    ImportExpression?: VisitNode<BabelNodeImportExpression, TState>,
    ImportNamespaceSpecifier?: VisitNode<
      BabelNodeImportNamespaceSpecifier,
      TState,
    >,
    ImportOrExportDeclaration?: VisitNode<
      BabelNodeImportOrExportDeclaration,
      TState,
    >,
    ImportSpecifier?: VisitNode<BabelNodeImportSpecifier, TState>,
    IndexedAccessType?: VisitNode<BabelNodeIndexedAccessType, TState>,
    InferredPredicate?: VisitNode<BabelNodeInferredPredicate, TState>,
    InterfaceDeclaration?: VisitNode<BabelNodeInterfaceDeclaration, TState>,
    InterfaceExtends?: VisitNode<BabelNodeInterfaceExtends, TState>,
    InterfaceTypeAnnotation?: VisitNode<
      BabelNodeInterfaceTypeAnnotation,
      TState,
    >,
    InterpreterDirective?: VisitNode<BabelNodeInterpreterDirective, TState>,
    IntersectionTypeAnnotation?: VisitNode<
      BabelNodeIntersectionTypeAnnotation,
      TState,
    >,
    JSX?: VisitNode<BabelNodeJSX, TState>,
    JSXAttribute?: VisitNode<BabelNodeJSXAttribute, TState>,
    JSXClosingElement?: VisitNode<BabelNodeJSXClosingElement, TState>,
    JSXClosingFragment?: VisitNode<BabelNodeJSXClosingFragment, TState>,
    JSXElement?: VisitNode<BabelNodeJSXElement, TState>,
    JSXEmptyExpression?: VisitNode<BabelNodeJSXEmptyExpression, TState>,
    JSXExpressionContainer?: VisitNode<BabelNodeJSXExpressionContainer, TState>,
    JSXFragment?: VisitNode<BabelNodeJSXFragment, TState>,
    JSXIdentifier?: VisitNode<BabelNodeJSXIdentifier, TState>,
    JSXMemberExpression?: VisitNode<BabelNodeJSXMemberExpression, TState>,
    JSXNamespacedName?: VisitNode<BabelNodeJSXNamespacedName, TState>,
    JSXOpeningElement?: VisitNode<BabelNodeJSXOpeningElement, TState>,
    JSXOpeningFragment?: VisitNode<BabelNodeJSXOpeningFragment, TState>,
    JSXSpreadAttribute?: VisitNode<BabelNodeJSXSpreadAttribute, TState>,
    JSXSpreadChild?: VisitNode<BabelNodeJSXSpreadChild, TState>,
    JSXText?: VisitNode<BabelNodeJSXText, TState>,
    LVal?: VisitNode<BabelNodeLVal, TState>,
    LabeledStatement?: VisitNode<BabelNodeLabeledStatement, TState>,
    Literal?: VisitNode<BabelNodeLiteral, TState>,
    LogicalExpression?: VisitNode<BabelNodeLogicalExpression, TState>,
    Loop?: VisitNode<BabelNodeLoop, TState>,
    MemberExpression?: VisitNode<BabelNodeMemberExpression, TState>,
    MetaProperty?: VisitNode<BabelNodeMetaProperty, TState>,
    Method?: VisitNode<BabelNodeMethod, TState>,
    Miscellaneous?: VisitNode<BabelNodeMiscellaneous, TState>,
    MixedTypeAnnotation?: VisitNode<BabelNodeMixedTypeAnnotation, TState>,
    ModuleDeclaration?: VisitNode<BabelNodeModuleDeclaration, TState>,
    ModuleExpression?: VisitNode<BabelNodeModuleExpression, TState>,
    ModuleSpecifier?: VisitNode<BabelNodeModuleSpecifier, TState>,
    NewExpression?: VisitNode<BabelNodeNewExpression, TState>,
    Noop?: VisitNode<BabelNodeNoop, TState>,
    NullLiteral?: VisitNode<BabelNodeNullLiteral, TState>,
    NullLiteralTypeAnnotation?: VisitNode<
      BabelNodeNullLiteralTypeAnnotation,
      TState,
    >,
    NullableTypeAnnotation?: VisitNode<BabelNodeNullableTypeAnnotation, TState>,
    NumberLiteral?: VisitNode<BabelNode, TState>,
    NumberLiteralTypeAnnotation?: VisitNode<
      BabelNodeNumberLiteralTypeAnnotation,
      TState,
    >,
    NumberTypeAnnotation?: VisitNode<BabelNodeNumberTypeAnnotation, TState>,
    NumericLiteral?: VisitNode<BabelNodeNumericLiteral, TState>,
    NumericLiteralTypeAnnotation?: VisitNode<BabelNode, TState>,
    ObjectExpression?: VisitNode<BabelNodeObjectExpression, TState>,
    ObjectMember?: VisitNode<BabelNodeObjectMember, TState>,
    ObjectMethod?: VisitNode<BabelNodeObjectMethod, TState>,
    ObjectPattern?: VisitNode<BabelNodeObjectPattern, TState>,
    ObjectProperty?: VisitNode<BabelNodeObjectProperty, TState>,
    ObjectTypeAnnotation?: VisitNode<BabelNodeObjectTypeAnnotation, TState>,
    ObjectTypeCallProperty?: VisitNode<BabelNodeObjectTypeCallProperty, TState>,
    ObjectTypeIndexer?: VisitNode<BabelNodeObjectTypeIndexer, TState>,
    ObjectTypeInternalSlot?: VisitNode<BabelNodeObjectTypeInternalSlot, TState>,
    ObjectTypeProperty?: VisitNode<BabelNodeObjectTypeProperty, TState>,
    ObjectTypeSpreadProperty?: VisitNode<
      BabelNodeObjectTypeSpreadProperty,
      TState,
    >,
    OpaqueType?: VisitNode<BabelNodeOpaqueType, TState>,
    OptionalCallExpression?: VisitNode<BabelNodeOptionalCallExpression, TState>,
    OptionalIndexedAccessType?: VisitNode<
      BabelNodeOptionalIndexedAccessType,
      TState,
    >,
    OptionalMemberExpression?: VisitNode<
      BabelNodeOptionalMemberExpression,
      TState,
    >,
    ParenthesizedExpression?: VisitNode<
      BabelNodeParenthesizedExpression,
      TState,
    >,
    Pattern?: VisitNode<BabelNodePattern, TState>,
    PatternLike?: VisitNode<BabelNodePatternLike, TState>,
    PipelineBareFunction?: VisitNode<BabelNodePipelineBareFunction, TState>,
    PipelinePrimaryTopicReference?: VisitNode<
      BabelNodePipelinePrimaryTopicReference,
      TState,
    >,
    PipelineTopicExpression?: VisitNode<
      BabelNodePipelineTopicExpression,
      TState,
    >,
    Placeholder?: VisitNode<BabelNodePlaceholder, TState>,
    Private?: VisitNode<BabelNodePrivate, TState>,
    PrivateName?: VisitNode<BabelNodePrivateName, TState>,
    Program?: VisitNode<BabelNodeProgram, TState>,
    Property?: VisitNode<BabelNodeProperty, TState>,
    Pure?: VisitNode<BabelNode, TState>,
    Pureish?: VisitNode<BabelNodePureish, TState>,
    QualifiedTypeIdentifier?: VisitNode<
      BabelNodeQualifiedTypeIdentifier,
      TState,
    >,
    RecordExpression?: VisitNode<BabelNodeRecordExpression, TState>,
    Referenced?: VisitNode<BabelNode, TState>,
    ReferencedIdentifier?: VisitNode<BabelNode, TState>,
    ReferencedMemberExpression?: VisitNode<BabelNode, TState>,
    RegExpLiteral?: VisitNode<BabelNodeRegExpLiteral, TState>,
    RegexLiteral?: VisitNode<BabelNode, TState>,
    RestElement?: VisitNode<BabelNodeRestElement, TState>,
    RestProperty?: VisitNode<BabelNode, TState>,
    ReturnStatement?: VisitNode<BabelNodeReturnStatement, TState>,
    Scopable?: VisitNode<BabelNodeScopable, TState>,
    Scope?: VisitNode<BabelNode, TState>,
    SequenceExpression?: VisitNode<BabelNodeSequenceExpression, TState>,
    SpreadElement?: VisitNode<BabelNodeSpreadElement, TState>,
    SpreadProperty?: VisitNode<BabelNode, TState>,
    Standardized?: VisitNode<BabelNodeStandardized, TState>,
    Statement?: VisitNode<BabelNodeStatement, TState>,
    StaticBlock?: VisitNode<BabelNodeStaticBlock, TState>,
    StringLiteral?: VisitNode<BabelNodeStringLiteral, TState>,
    StringLiteralTypeAnnotation?: VisitNode<
      BabelNodeStringLiteralTypeAnnotation,
      TState,
    >,
    StringTypeAnnotation?: VisitNode<BabelNodeStringTypeAnnotation, TState>,
    Super?: VisitNode<BabelNodeSuper, TState>,
    SwitchCase?: VisitNode<BabelNodeSwitchCase, TState>,
    SwitchStatement?: VisitNode<BabelNodeSwitchStatement, TState>,
    SymbolTypeAnnotation?: VisitNode<BabelNodeSymbolTypeAnnotation, TState>,
    TSAnyKeyword?: VisitNode<BabelNodeTSAnyKeyword, TState>,
    TSArrayType?: VisitNode<BabelNodeTSArrayType, TState>,
    TSAsExpression?: VisitNode<BabelNodeTSAsExpression, TState>,
    TSBaseType?: VisitNode<BabelNodeTSBaseType, TState>,
    TSBigIntKeyword?: VisitNode<BabelNodeTSBigIntKeyword, TState>,
    TSBooleanKeyword?: VisitNode<BabelNodeTSBooleanKeyword, TState>,
    TSCallSignatureDeclaration?: VisitNode<
      BabelNodeTSCallSignatureDeclaration,
      TState,
    >,
    TSConditionalType?: VisitNode<BabelNodeTSConditionalType, TState>,
    TSConstructSignatureDeclaration?: VisitNode<
      BabelNodeTSConstructSignatureDeclaration,
      TState,
    >,
    TSConstructorType?: VisitNode<BabelNodeTSConstructorType, TState>,
    TSDeclareFunction?: VisitNode<BabelNodeTSDeclareFunction, TState>,
    TSDeclareMethod?: VisitNode<BabelNodeTSDeclareMethod, TState>,
    TSEntityName?: VisitNode<BabelNodeTSEntityName, TState>,
    TSEnumBody?: VisitNode<BabelNodeTSEnumBody, TState>,
    TSEnumDeclaration?: VisitNode<BabelNodeTSEnumDeclaration, TState>,
    TSEnumMember?: VisitNode<BabelNodeTSEnumMember, TState>,
    TSExportAssignment?: VisitNode<BabelNodeTSExportAssignment, TState>,
    TSExpressionWithTypeArguments?: VisitNode<
      BabelNodeTSExpressionWithTypeArguments,
      TState,
    >,
    TSExternalModuleReference?: VisitNode<
      BabelNodeTSExternalModuleReference,
      TState,
    >,
    TSFunctionType?: VisitNode<BabelNodeTSFunctionType, TState>,
    TSImportEqualsDeclaration?: VisitNode<
      BabelNodeTSImportEqualsDeclaration,
      TState,
    >,
    TSImportType?: VisitNode<BabelNodeTSImportType, TState>,
    TSIndexSignature?: VisitNode<BabelNodeTSIndexSignature, TState>,
    TSIndexedAccessType?: VisitNode<BabelNodeTSIndexedAccessType, TState>,
    TSInferType?: VisitNode<BabelNodeTSInferType, TState>,
    TSInstantiationExpression?: VisitNode<
      BabelNodeTSInstantiationExpression,
      TState,
    >,
    TSInterfaceBody?: VisitNode<BabelNodeTSInterfaceBody, TState>,
    TSInterfaceDeclaration?: VisitNode<BabelNodeTSInterfaceDeclaration, TState>,
    TSIntersectionType?: VisitNode<BabelNodeTSIntersectionType, TState>,
    TSIntrinsicKeyword?: VisitNode<BabelNodeTSIntrinsicKeyword, TState>,
    TSLiteralType?: VisitNode<BabelNodeTSLiteralType, TState>,
    TSMappedType?: VisitNode<BabelNodeTSMappedType, TState>,
    TSMethodSignature?: VisitNode<BabelNodeTSMethodSignature, TState>,
    TSModuleBlock?: VisitNode<BabelNodeTSModuleBlock, TState>,
    TSModuleDeclaration?: VisitNode<BabelNodeTSModuleDeclaration, TState>,
    TSNamedTupleMember?: VisitNode<BabelNodeTSNamedTupleMember, TState>,
    TSNamespaceExportDeclaration?: VisitNode<
      BabelNodeTSNamespaceExportDeclaration,
      TState,
    >,
    TSNeverKeyword?: VisitNode<BabelNodeTSNeverKeyword, TState>,
    TSNonNullExpression?: VisitNode<BabelNodeTSNonNullExpression, TState>,
    TSNullKeyword?: VisitNode<BabelNodeTSNullKeyword, TState>,
    TSNumberKeyword?: VisitNode<BabelNodeTSNumberKeyword, TState>,
    TSObjectKeyword?: VisitNode<BabelNodeTSObjectKeyword, TState>,
    TSOptionalType?: VisitNode<BabelNodeTSOptionalType, TState>,
    TSParameterProperty?: VisitNode<BabelNodeTSParameterProperty, TState>,
    TSParenthesizedType?: VisitNode<BabelNodeTSParenthesizedType, TState>,
    TSPropertySignature?: VisitNode<BabelNodeTSPropertySignature, TState>,
    TSQualifiedName?: VisitNode<BabelNodeTSQualifiedName, TState>,
    TSRestType?: VisitNode<BabelNodeTSRestType, TState>,
    TSSatisfiesExpression?: VisitNode<BabelNodeTSSatisfiesExpression, TState>,
    TSStringKeyword?: VisitNode<BabelNodeTSStringKeyword, TState>,
    TSSymbolKeyword?: VisitNode<BabelNodeTSSymbolKeyword, TState>,
    TSTemplateLiteralType?: VisitNode<BabelNodeTSTemplateLiteralType, TState>,
    TSThisType?: VisitNode<BabelNodeTSThisType, TState>,
    TSTupleType?: VisitNode<BabelNodeTSTupleType, TState>,
    TSType?: VisitNode<BabelNodeTSType, TState>,
    TSTypeAliasDeclaration?: VisitNode<BabelNodeTSTypeAliasDeclaration, TState>,
    TSTypeAnnotation?: VisitNode<BabelNodeTSTypeAnnotation, TState>,
    TSTypeAssertion?: VisitNode<BabelNodeTSTypeAssertion, TState>,
    TSTypeElement?: VisitNode<BabelNodeTSTypeElement, TState>,
    TSTypeLiteral?: VisitNode<BabelNodeTSTypeLiteral, TState>,
    TSTypeOperator?: VisitNode<BabelNodeTSTypeOperator, TState>,
    TSTypeParameter?: VisitNode<BabelNodeTSTypeParameter, TState>,
    TSTypeParameterDeclaration?: VisitNode<
      BabelNodeTSTypeParameterDeclaration,
      TState,
    >,
    TSTypeParameterInstantiation?: VisitNode<
      BabelNodeTSTypeParameterInstantiation,
      TState,
    >,
    TSTypePredicate?: VisitNode<BabelNodeTSTypePredicate, TState>,
    TSTypeQuery?: VisitNode<BabelNodeTSTypeQuery, TState>,
    TSTypeReference?: VisitNode<BabelNodeTSTypeReference, TState>,
    TSUndefinedKeyword?: VisitNode<BabelNodeTSUndefinedKeyword, TState>,
    TSUnionType?: VisitNode<BabelNodeTSUnionType, TState>,
    TSUnknownKeyword?: VisitNode<BabelNodeTSUnknownKeyword, TState>,
    TSVoidKeyword?: VisitNode<BabelNodeTSVoidKeyword, TState>,
    TaggedTemplateExpression?: VisitNode<
      BabelNodeTaggedTemplateExpression,
      TState,
    >,
    TemplateElement?: VisitNode<BabelNodeTemplateElement, TState>,
    TemplateLiteral?: VisitNode<BabelNodeTemplateLiteral, TState>,
    Terminatorless?: VisitNode<BabelNodeTerminatorless, TState>,
    ThisExpression?: VisitNode<BabelNodeThisExpression, TState>,
    ThisTypeAnnotation?: VisitNode<BabelNodeThisTypeAnnotation, TState>,
    ThrowStatement?: VisitNode<BabelNodeThrowStatement, TState>,
    TopicReference?: VisitNode<BabelNodeTopicReference, TState>,
    TryStatement?: VisitNode<BabelNodeTryStatement, TState>,
    TupleExpression?: VisitNode<BabelNodeTupleExpression, TState>,
    TupleTypeAnnotation?: VisitNode<BabelNodeTupleTypeAnnotation, TState>,
    TypeAlias?: VisitNode<BabelNodeTypeAlias, TState>,
    TypeAnnotation?: VisitNode<BabelNodeTypeAnnotation, TState>,
    TypeCastExpression?: VisitNode<BabelNodeTypeCastExpression, TState>,
    TypeParameter?: VisitNode<BabelNodeTypeParameter, TState>,
    TypeParameterDeclaration?: VisitNode<
      BabelNodeTypeParameterDeclaration,
      TState,
    >,
    TypeParameterInstantiation?: VisitNode<
      BabelNodeTypeParameterInstantiation,
      TState,
    >,
    TypeScript?: VisitNode<BabelNodeTypeScript, TState>,
    TypeofTypeAnnotation?: VisitNode<BabelNodeTypeofTypeAnnotation, TState>,
    UnaryExpression?: VisitNode<BabelNodeUnaryExpression, TState>,
    UnaryLike?: VisitNode<BabelNodeUnaryLike, TState>,
    UnionTypeAnnotation?: VisitNode<BabelNodeUnionTypeAnnotation, TState>,
    UpdateExpression?: VisitNode<BabelNodeUpdateExpression, TState>,
    User?: VisitNode<BabelNode, TState>,
    UserWhitespacable?: VisitNode<BabelNodeUserWhitespacable, TState>,
    V8IntrinsicIdentifier?: VisitNode<BabelNodeV8IntrinsicIdentifier, TState>,
    Var?: VisitNode<BabelNode, TState>,
    VariableDeclaration?: VisitNode<BabelNodeVariableDeclaration, TState>,
    VariableDeclarator?: VisitNode<BabelNodeVariableDeclarator, TState>,
    Variance?: VisitNode<BabelNodeVariance, TState>,
    VoidPattern?: VisitNode<BabelNodeVoidPattern, TState>,
    VoidTypeAnnotation?: VisitNode<BabelNodeVoidTypeAnnotation, TState>,
    While?: VisitNode<BabelNodeWhile, TState>,
    WhileStatement?: VisitNode<BabelNodeWhileStatement, TState>,
    WithStatement?: VisitNode<BabelNodeWithStatement, TState>,
    YieldExpression?: VisitNode<BabelNodeYieldExpression, TState>,
    // END GENERATED VISITOR METHODS
  }>;

  declare type Visitors = {
    explode<TState>(visitor: Visitor<TState>): Visitor<TState>,
    verify<TState>(visitor: Visitor<TState>): void,
    merge(
      visitors: Array<Readonly<Visitor<any>>>,
      states: Array<any>,
      wrapper?: ?Function,
    ): Array<Visitor<any>>,
  };

  declare export var visitors: Visitors;

  declare export type Cache = {
    path: $ReadOnlyWeakMap<BabelNode, unknown>,
    scope: $ReadOnlyWeakMap<BabelNode, unknown>,
    clear(): void,
    clearPath(): void,
    clearScope(): void,
  };

  declare export type Traverse = {
    <TState>(
      parent?: BabelNode | Array<BabelNode>,
      opts?: Readonly<TraverseOptions<TState>>,
      scope?: ?Scope,
      state: TState,
      parentPath?: ?NodePath<BabelNode>,
    ): void,

    +cache: Cache,
    +visitors: Visitors,
    +verify: Visitors['verify'],
    +explode: Visitors['explode'],

    cheap<TOptions>(
      node: BabelNode,
      enter: (node: BabelNode, opts: TOptions) => void,
    ): void,

    node<TState>(
      node: BabelNode,
      opts: Readonly<TraverseOptions<TState>>,
      scope: Scope,
      state: TState,
      parentPath: NodePath<>,
      skipKeys?: {[key: string]: boolean},
    ): void,

    clearNode(node: BabelNode, opts?: {...}): void,
    removeProperties(tree: BabelNode, opts?: {...}): BabelNode,
    hasType(
      tree: BabelNode,
      type: BabelNode['type'],
      blacklistTypes: Array<BabelNode['type']>,
    ): boolean,
  };

  declare export default Traverse;
}
