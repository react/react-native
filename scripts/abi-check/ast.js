/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {LayoutMap} from './normalize';

/** Reads one line of clang's text AST dump at a time. */
export type AstCollector<T> = {
  onLine: (line: string) => void,
  finish: () => T,
};

export type Method = {
  name: string,
  /** The function type as written, for example `void (int) const`. */
  type: string,
  virtual: boolean,
  deleted: boolean,
};

export type ClassMembers = {
  /** The namespace that encloses the class, for example `facebook::react`. */
  namespace: string,
  /** Methods declared in the class, without constructors and destructors. */
  methods: Array<Method>,
  /** Names that using-declarations bring into the class. */
  usingNames: Array<string>,
  hasVirtualDestructor: boolean,
  hasDeletedDestructor: boolean,
};

const NODE = /^([\s|`-]*)(\S+)(.*)$/;
const SOURCE_LOCATION = / at [^()]*?:\d+:\d+\)/;

function parseNode(line: string): {depth: number, kind: string, rest: string} {
  const [, prefix = '', kind = '', rest = ''] = line.match(NODE) ?? [];
  return {depth: prefix.length, kind, rest};
}

const ENUM_CONSTANT = / (\w+) '([^']+)'(?::'[^']*')?$/;
const CONSTANT_VALUE = /^ Int (-?\d+)$/;

type Enumerator = {
  name: string,
  depth: number,
  value: ?bigint,
  // The next line of the initializer's ImplicitCastExpr -> ConstantExpr ->
  // value chain, which only constant initializers have.
  expected: ?{depth: number, node: 'expression' | 'value'},
};

type EnumBlock = {
  name: ?string,
  underlyingType: ?string,
  enumerators: Array<Enumerator>,
  dependent: boolean,
};

function formatEnum({underlyingType, enumerators}: EnumBlock): string {
  const lines = underlyingType != null ? [`: ${underlyingType}`] : [];
  let nextValue = BigInt(0);
  for (const enumerator of enumerators) {
    const value = enumerator.value ?? nextValue;
    lines.push(`${enumerator.name} = ${value.toString()}`);
    nextValue = value + BigInt(1);
  }
  return lines.join('\n');
}

/**
 * Collects `E <enum>` entries with the enumerator values of each enum whose
 * name matches `namespacePattern`. An enumerator without an initializer is one
 * more than the previous one. Enums whose values depend on a template
 * parameter, and unnamed enums, are left out.
 */
function createEnumCollector(
  namespacePattern: RegExp,
): AstCollector<LayoutMap> {
  const enums: LayoutMap = new Map();
  let block: ?EnumBlock = null;

  const finishBlock = () => {
    const finished = block;
    block = null;
    const name = finished?.name;
    if (
      finished != null &&
      name != null &&
      !finished.dependent &&
      !SOURCE_LOCATION.test(name) &&
      name.search(namespacePattern) !== -1 &&
      !enums.has(`E ${name}`)
    ) {
      enums.set(`E ${name}`, formatEnum(finished));
    }
  };

  const onLine = (line: string) => {
    const {depth, kind, rest} = parseNode(line);
    if (kind === 'EnumDecl') {
      finishBlock();
      block = {
        name: null,
        underlyingType: rest.match(/'([^']+)'/)?.[1],
        enumerators: [],
        dependent: false,
      };
      return;
    }
    const current = block;
    if (current == null) {
      return;
    }

    const constant =
      kind === 'EnumConstantDecl' ? rest.match(ENUM_CONSTANT) : null;
    if (constant != null) {
      if (current.name == null) {
        current.name = constant[2];
      }
      current.enumerators.push({
        name: constant[1],
        depth,
        value: null,
        expected: {depth: depth + 2, node: 'expression'},
      });
      return;
    }

    const enumerator = current.enumerators[current.enumerators.length - 1];
    const expected = enumerator?.expected;
    if (enumerator == null || expected == null) {
      return;
    }
    if (depth <= enumerator.depth) {
      enumerator.expected = null;
      return;
    }
    if (depth !== expected.depth) {
      return;
    }
    if (expected.node === 'value') {
      const value = kind === 'value:' ? rest.match(CONSTANT_VALUE)?.[1] : null;
      if (value != null) {
        enumerator.value = BigInt(value);
      } else {
        current.dependent = true;
      }
      enumerator.expected = null;
      return;
    }
    // An initializer comes before the attributes and doc comment.
    if (kind === 'ImplicitCastExpr') {
      enumerator.expected = {depth: depth + 2, node: 'expression'};
    } else if (kind === 'ConstantExpr') {
      enumerator.expected = {depth: depth + 2, node: 'value'};
    } else if (!kind.endsWith('Attr') && !kind.endsWith('Comment')) {
      current.dependent = true;
      enumerator.expected = null;
    }
  };

  return {
    onLine,
    finish: () => {
      finishBlock();
      return enums;
    },
  };
}

const NAMESPACE_NAME = /(?:col|line):[\d:]+ (\w+)(?: inline| nested)*$/;
const RECORD_DEFINITION = / (?:class|struct|union) (\w+) definition\b/;
const METHOD =
  /^ 0x\w+ (?:prev 0x\w+ )?(?:parent 0x\w+ )?<.*?> (?:col|line):[\d:]+ (?:(?:used|referenced|implicit|invalid|constexpr|consteval) )*(.+?) '([^']*)'(?::'[^']*')?(.*)$/;
const MEMBER_NAME = /^(?:~?[A-Za-z_]\w*|operator\b.+)$/;

type Scope = {
  depth: number,
  /** Null inside functions, templates and unnamed records. */
  qualifiedName: ?string,
  namespace: ?string,
  members: ?ClassMembers,
};

type PendingMethod = {
  depth: number,
  members: ClassMembers,
  method: Method,
  destructor: boolean,
};

function qualify(scope: ?string, name: ?string): ?string {
  if (scope == null || name == null) {
    return null;
  }
  return scope === '' ? name : `${scope}::${name}`;
}

/**
 * Collects the methods of each class whose qualified name matches
 * `namespacePattern`. Classes inside functions and templates are left out.
 */
function createClassCollector(
  namespacePattern: RegExp,
): AstCollector<Map<string, ClassMembers>> {
  const classes: Map<string, ClassMembers> = new Map();
  const scopes: Array<Scope> = [
    {depth: -1, qualifiedName: '', namespace: '', members: null},
  ];
  let pending: ?PendingMethod = null;

  const finishMethod = () => {
    const finished = pending;
    pending = null;
    if (finished == null) {
      return;
    }
    const {members, method} = finished;
    if (!finished.destructor) {
      members.methods.push(method);
    } else if (method.deleted) {
      members.hasDeletedDestructor = true;
    } else if (method.virtual) {
      members.hasVirtualDestructor = true;
    }
  };

  const onLine = (line: string) => {
    const {depth, kind, rest} = parseNode(line);
    if (pending != null) {
      if (depth <= pending.depth) {
        finishMethod();
      } else if (
        kind === 'Overrides:' ||
        kind === 'OverrideAttr' ||
        kind === 'FinalAttr'
      ) {
        pending.method.virtual = true;
      }
    }
    if (kind === 'TranslationUnitDecl' || kind === 'LinkageSpecDecl') {
      return;
    }

    while (scopes[scopes.length - 1].depth >= depth) {
      scopes.pop();
    }
    const scope = scopes[scopes.length - 1];
    const opaque: Scope = {
      depth,
      qualifiedName: null,
      namespace: null,
      members: null,
    };

    if (kind === 'NamespaceDecl') {
      const name = rest.match(NAMESPACE_NAME)?.[1] ?? '(anonymous namespace)';
      const qualifiedName = qualify(scope.qualifiedName, name);
      scopes.push({
        depth,
        qualifiedName,
        namespace: qualifiedName,
        members: null,
      });
      return;
    }

    const record =
      kind === 'CXXRecordDecl' ? rest.match(RECORD_DEFINITION) : null;
    if (record != null) {
      const qualifiedName = qualify(scope.qualifiedName, record[1]);
      const {namespace} = scope;
      let members: ?ClassMembers = null;
      if (
        qualifiedName != null &&
        namespace != null &&
        qualifiedName.search(namespacePattern) !== -1 &&
        !classes.has(qualifiedName)
      ) {
        members = {
          namespace,
          methods: [],
          usingNames: [],
          hasVirtualDestructor: false,
          hasDeletedDestructor: false,
        };
        classes.set(qualifiedName, members);
      }
      scopes.push({depth, qualifiedName, namespace, members});
      return;
    }

    scopes.push(opaque);
    const members = scope.members;
    if (members == null) {
      return;
    }
    if (kind === 'UsingDecl') {
      members.usingNames.push(rest.slice(rest.lastIndexOf('::') + 2));
      return;
    }
    const isDestructor = kind === 'CXXDestructorDecl';
    if (
      !isDestructor &&
      kind !== 'CXXMethodDecl' &&
      kind !== 'CXXConversionDecl'
    ) {
      return;
    }
    const [, name, type, flags] = rest.match(METHOD) ?? [];
    if (name == null || !MEMBER_NAME.test(name)) {
      return;
    }
    pending = {
      depth,
      members,
      destructor: isDestructor,
      method: {
        name,
        type,
        virtual: /\bvirtual\b/.test(flags),
        deleted: /\bdelete\b/.test(flags),
      },
    };
  };

  return {
    onLine,
    finish: () => {
      finishMethod();
      return classes;
    },
  };
}

module.exports = {createClassCollector, createEnumCollector};
