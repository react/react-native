/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

function hasAnnotationInComments(
  comments: ?ReadonlyArray<{type: string, value: string}>,
  pattern: RegExp,
): boolean {
  return (
    Array.isArray(comments) &&
    comments.some(
      comment => comment.type === 'CommentBlock' && pattern.test(comment.value),
    )
  );
}

function hasAnnotation(path: $FlowFixMe, pattern: RegExp): boolean {
  if (hasAnnotationInComments(path.node.leadingComments, pattern)) {
    return true;
  }
  if (
    path.parentPath?.isExportNamedDeclaration() &&
    hasAnnotationInComments(path.parentPath.node.leadingComments, pattern)
  ) {
    return true;
  }
  return false;
}

function stripAnnotationComments(path: $FlowFixMe, pattern: RegExp): void {
  const filter = (comments: $FlowFixMe) =>
    comments?.filter(
      (c: $FlowFixMe) => !(c.type === 'CommentBlock' && pattern.test(c.value)),
    ) ?? [];
  path.node.leadingComments = filter(path.node.leadingComments);
  if (path.parentPath?.isExportNamedDeclaration()) {
    path.parentPath.node.leadingComments = filter(
      path.parentPath.node.leadingComments,
    );
  }
  const target = path.parentPath?.isExportNamedDeclaration()
    ? path.parentPath
    : path;
  const prevSibling = target.getPrevSibling();
  if (prevSibling?.node) {
    prevSibling.node.trailingComments = filter(
      prevSibling.node.trailingComments,
    );
  }
}

module.exports = {hasAnnotation, stripAnnotationComments};
