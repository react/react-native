/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

declare module 'jsonc-parser' {
  /**
   * Creates a JSON scanner on the given text.
   * If ignoreTrivia is set, whitespaces or comments are ignored.
   */
  declare export const createScanner: (
    text: string,
    ignoreTrivia?: boolean,
  ) => JSONScanner;
  export type ScanError = number;
  export type SyntaxKind = number;
  /**
   * The scanner object, representing a JSON scanner at a position in the input string.
   */
  export type JSONScanner = Readonly<{
    /**
     * Sets the scan position to a new offset. A call to 'scan' is needed to get the first token.
     */
    setPosition(pos: number): void,
    /**
     * Read the next token. Returns the token code.
     */
    scan(): SyntaxKind,
    /**
     * Returns the zero-based current scan position, which is after the last read token.
     */
    getPosition(): number,
    /**
     * Returns the last read token.
     */
    getToken(): SyntaxKind,
    /**
     * Returns the last read token value. The value for strings is the decoded string content. For numbers it's of type number, for boolean it's true or false.
     */
    getTokenValue(): string,
    /**
     * The zero-based start offset of the last read token.
     */
    getTokenOffset(): number,
    /**
     * The length of the last read token.
     */
    getTokenLength(): number,
    /**
     * The zero-based start line number of the last read token.
     */
    getTokenStartLine(): number,
    /**
     * The zero-based start character (column) of the last read token.
     */
    getTokenStartCharacter(): number,
    /**
     * An error code of the last scan.
     */
    getTokenError(): ScanError,
  }>;
  /**
   * For a given offset, evaluate the location in the JSON document. Each segment in the location path is either a property name or an array index.
   */
  declare export const getLocation: (
    text: string,
    position: number,
  ) => Location;
  /**
   * Parses the given text and returns the object the JSON content represents. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
   * Therefore, always check the errors list to find out if the input was valid.
   */
  declare export const parse: (
    text: string,
    errors?: ParseError[],
    options?: ParseOptions,
  ) => any;
  /**
   * Parses the given text and returns a tree representation the JSON content. On invalid input, the parser tries to be as fault tolerant as possible, but still return a result.
   */
  declare export const parseTree: (
    text: string,
    errors?: ParseError[],
    options?: ParseOptions,
  ) => Node | void;
  /**
   * Finds the node at the given path in a JSON DOM.
   */
  declare export const findNodeAtLocation: (
    root: Node,
    path: JSONPath,
  ) => Node | void;
  /**
   * Finds the innermost node at the given offset. If includeRightBound is set, also finds nodes that end at the given offset.
   */
  declare export const findNodeAtOffset: (
    root: Node,
    offset: number,
    includeRightBound?: boolean,
  ) => Node | void;
  /**
   * Gets the JSON path of the given JSON DOM node
   */
  declare export const getNodePath: (node: Node) => JSONPath;
  /**
   * Evaluates the JavaScript object of the given JSON DOM node
   */
  declare export const getNodeValue: (node: Node) => any;
  /**
   * Parses the given text and invokes the visitor functions for each object, array and literal reached.
   */
  declare export const visit: (
    text: string,
    visitor: JSONVisitor,
    options?: ParseOptions,
  ) => any;
  /**
   * Takes JSON with JavaScript-style comments and remove
   * them. Optionally replaces every none-newline character
   * of comments with a replaceCharacter
   */
  declare export const stripComments: (
    text: string,
    replaceCh?: string,
  ) => string;
  export type ParseError = {
    error: ParseErrorCode,
    offset: number,
    length: number,
  };
  export type ParseErrorCode = number;
  declare export function printParseErrorCode(
    code: ParseErrorCode,
  ):
    | 'InvalidSymbol'
    | 'InvalidNumberFormat'
    | 'PropertyNameExpected'
    | 'ValueExpected'
    | 'ColonExpected'
    | 'CommaExpected'
    | 'CloseBraceExpected'
    | 'CloseBracketExpected'
    | 'EndOfFileExpected'
    | 'InvalidCommentToken'
    | 'UnexpectedEndOfComment'
    | 'UnexpectedEndOfString'
    | 'UnexpectedEndOfNumber'
    | 'InvalidUnicode'
    | 'InvalidEscapeCharacter'
    | 'InvalidCharacter'
    | '<unknown ParseErrorCode>';
  export type NodeType =
    | 'object'
    | 'array'
    | 'property'
    | 'string'
    | 'number'
    | 'boolean'
    | 'null';
  export type Node = {
    type: NodeType,
    value?: any,
    offset: number,
    length: number,
    colonOffset?: number,
    parent?: Node,
    children?: Node[],
  };
  /**
   * A {@linkcode JSONPath} segment. Either a string representing an object property name
   * or a number (starting at 0) for array indices.
   */
  export type Segment = string | number;
  export type JSONPath = Segment[];
  export type Location = {
    /**
     * The previous property key or literal value (string, number, boolean or null) or undefined.
     */
    previousNode?: Node,
    /**
     * The path describing the location in the JSON document. The path consists of a sequence of strings
     * representing an object property or numbers for array indices.
     */
    path: JSONPath,
    /**
     * Matches the locations path against a pattern consisting of strings (for properties) and numbers (for array indices).
     * '*' will match a single segment of any property name or index.
     * '**' will match a sequence of segments of any property name or index, or no segment.
     */
    matches: (patterns: JSONPath) => boolean,
    /**
     * If set, the location's offset is at a property key.
     */
    isAtPropertyKey: boolean,
  };
  export type ParseOptions = {
    disallowComments?: boolean,
    allowTrailingComma?: boolean,
    allowEmptyContent?: boolean,
  };
  /**
   * Visitor called by {@linkcode visit} when parsing JSON.
   *
   * The visitor functions have the following common parameters:
   * - `offset`: Global offset within the JSON document, starting at 0
   * - `startLine`: Line number, starting at 0
   * - `startCharacter`: Start character (column) within the current line, starting at 0
   *
   * Additionally some functions have a `pathSupplier` parameter which can be used to obtain the
   * current `JSONPath` within the document.
   */
  export type JSONVisitor = {
    /**
     * Invoked when an open brace is encountered and an object is started. The offset and length represent the location of the open brace.
     */
    onObjectBegin?: (
      offset: number,
      length: number,
      startLine: number,
      startCharacter: number,
      pathSupplier: () => JSONPath,
    ) => void,
    /**
     * Invoked when a property is encountered. The offset and length represent the location of the property name.
     * The `JSONPath` created by the `pathSupplier` refers to the enclosing JSON object, it does not include the
     * property name yet.
     */
    onObjectProperty?: (
      property: string,
      offset: number,
      length: number,
      startLine: number,
      startCharacter: number,
      pathSupplier: () => JSONPath,
    ) => void,
    /**
     * Invoked when a closing brace is encountered and an object is completed. The offset and length represent the location of the closing brace.
     */
    onObjectEnd?: (
      offset: number,
      length: number,
      startLine: number,
      startCharacter: number,
    ) => void,
    /**
     * Invoked when an open bracket is encountered. The offset and length represent the location of the open bracket.
     */
    onArrayBegin?: (
      offset: number,
      length: number,
      startLine: number,
      startCharacter: number,
      pathSupplier: () => JSONPath,
    ) => void,
    /**
     * Invoked when a closing bracket is encountered. The offset and length represent the location of the closing bracket.
     */
    onArrayEnd?: (
      offset: number,
      length: number,
      startLine: number,
      startCharacter: number,
    ) => void,
    /**
     * Invoked when a literal value is encountered. The offset and length represent the location of the literal value.
     */
    onLiteralValue?: (
      value: any,
      offset: number,
      length: number,
      startLine: number,
      startCharacter: number,
      pathSupplier: () => JSONPath,
    ) => void,
    /**
     * Invoked when a comma or colon separator is encountered. The offset and length represent the location of the separator.
     */
    onSeparator?: (
      character: string,
      offset: number,
      length: number,
      startLine: number,
      startCharacter: number,
    ) => void,
    /**
     * When comments are allowed, invoked when a line or block comment is encountered. The offset and length represent the location of the comment.
     */
    onComment?: (
      offset: number,
      length: number,
      startLine: number,
      startCharacter: number,
    ) => void,
    /**
     * Invoked on an error.
     */
    onError?: (
      error: ParseErrorCode,
      offset: number,
      length: number,
      startLine: number,
      startCharacter: number,
    ) => void,
  };
  /**
   * An edit result describes a textual edit operation. It is the result of a {@linkcode format} and {@linkcode modify} operation.
   * It consist of one or more edits describing insertions, replacements or removals of text segments.
   * * The offsets of the edits refer to the original state of the document.
   * * No two edits change or remove the same range of text in the original document.
   * * Multiple edits can have the same offset if they are multiple inserts, or an insert followed by a remove or replace.
   * * The order in the array defines which edit is applied first.
   * To apply an edit result use {@linkcode applyEdits}.
   * In general multiple EditResults must not be concatenated because they might impact each other, producing incorrect or malformed JSON data.
   */
  export type EditResult = Edit[];
  /**
   * Represents a text modification
   */
  export type Edit = {
    /**
     * The start offset of the modification.
     */
    offset: number,
    /**
     * The length of the modification. Must not be negative. Empty length represents an *insert*.
     */
    length: number,
    /**
     * The new content. Empty content represents a *remove*.
     */
    content: string,
  };
  /**
   * A text range in the document
   */
  export type Range = {
    /**
     * The start offset of the range.
     */
    offset: number,
    /**
     * The length of the range. Must not be negative.
     */
    length: number,
  };
  /**
   * Options used by {@linkcode format} when computing the formatting edit operations
   */
  export type FormattingOptions = Readonly<{
    /**
     * If indentation is based on spaces (`insertSpaces` = true), the number of spaces that make an indent.
     */
    tabSize?: number,
    /**
     * Is indentation based on spaces?
     */
    insertSpaces?: boolean,
    /**
     * The default 'end of line' character. If not set, '\n' is used as default.
     */
    eol?: string,
  }>;
  /**
   * Computes the edit operations needed to format a JSON document.
   *
   * @param documentText The input text
   * @param range The range to format or `undefined` to format the full content
   * @param options The formatting options
   * @returns The edit operations describing the formatting changes to the original document following the format described in {@linkcode EditResult}.
   * To apply the edit operations to the input, use {@linkcode applyEdits}.
   */
  declare export function format(
    documentText: string,
    range: Range | void,
    options: FormattingOptions,
  ): EditResult;
  /**
   * Options used by {@linkcode modify} when computing the modification edit operations
   */
  export type ModificationOptions = {
    /**
     * Formatting options.
     */
    formattingOptions: FormattingOptions,
    /**
     * Optional function to define the insertion index given an existing list of properties.
     */
    getInsertionIndex?: (properties: string[]) => number,
  };
  /**
   * Computes the edit operations needed to modify a value in the JSON document.
   *
   * @param documentText The input text
   * @param path The path of the value to change. The path represents either to the document root, a property or an array item.
   * If the path points to an non-existing property or item, it will be created.
   * @param value The new value for the specified property or item. If the value is undefined,
   * the property or item will be removed.
   * @param options Options
   * @returns The edit operations describing the changes to the original document, following the format described in {@linkcode EditResult}.
   * To apply the edit operations to the input, use {@linkcode applyEdits}.
   */
  declare export function modify(
    text: string,
    path: JSONPath,
    value: any,
    options: ModificationOptions,
  ): EditResult;
  /**
   * Applies edits to an input string.
   * @param text The input text
   * @param edits Edit operations following the format described in {@linkcode EditResult}.
   * @returns The text with the applied edits.
   * @throws An error if the edit operations are not well-formed as described in {@linkcode EditResult}.
   */
  declare export function applyEdits(text: string, edits: EditResult): string;
}
