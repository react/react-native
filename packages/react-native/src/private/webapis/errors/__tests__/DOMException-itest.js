/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import DOMException from '../DOMException';

describe('DOMException', () => {
  it('provides error codes as static fields and instance fields', () => {
    expect(DOMException.INDEX_SIZE_ERR).toBe(1);
    expect(DOMException.DOMSTRING_SIZE_ERR).toBe(2);
    expect(DOMException.HIERARCHY_REQUEST_ERR).toBe(3);
    expect(DOMException.WRONG_DOCUMENT_ERR).toBe(4);
    expect(DOMException.INVALID_CHARACTER_ERR).toBe(5);
    expect(DOMException.NO_DATA_ALLOWED_ERR).toBe(6);
    expect(DOMException.NO_MODIFICATION_ALLOWED_ERR).toBe(7);
    expect(DOMException.NOT_FOUND_ERR).toBe(8);
    expect(DOMException.NOT_SUPPORTED_ERR).toBe(9);
    expect(DOMException.INUSE_ATTRIBUTE_ERR).toBe(10);
    expect(DOMException.INVALID_STATE_ERR).toBe(11);
    expect(DOMException.SYNTAX_ERR).toBe(12);
    expect(DOMException.INVALID_MODIFICATION_ERR).toBe(13);
    expect(DOMException.NAMESPACE_ERR).toBe(14);
    expect(DOMException.INVALID_ACCESS_ERR).toBe(15);
    expect(DOMException.VALIDATION_ERR).toBe(16);
    expect(DOMException.TYPE_MISMATCH_ERR).toBe(17);
    expect(DOMException.SECURITY_ERR).toBe(18);
    expect(DOMException.NETWORK_ERR).toBe(19);
    expect(DOMException.ABORT_ERR).toBe(20);
    expect(DOMException.URL_MISMATCH_ERR).toBe(21);
    expect(DOMException.QUOTA_EXCEEDED_ERR).toBe(22);
    expect(DOMException.TIMEOUT_ERR).toBe(23);
    expect(DOMException.INVALID_NODE_TYPE_ERR).toBe(24);
    expect(DOMException.DATA_CLONE_ERR).toBe(25);

    expect(new DOMException().INDEX_SIZE_ERR).toBe(1);
    expect(new DOMException().DOMSTRING_SIZE_ERR).toBe(2);
    expect(new DOMException().HIERARCHY_REQUEST_ERR).toBe(3);
    expect(new DOMException().WRONG_DOCUMENT_ERR).toBe(4);
    expect(new DOMException().INVALID_CHARACTER_ERR).toBe(5);
    expect(new DOMException().NO_DATA_ALLOWED_ERR).toBe(6);
    expect(new DOMException().NO_MODIFICATION_ALLOWED_ERR).toBe(7);
    expect(new DOMException().NOT_FOUND_ERR).toBe(8);
    expect(new DOMException().NOT_SUPPORTED_ERR).toBe(9);
    expect(new DOMException().INUSE_ATTRIBUTE_ERR).toBe(10);
    expect(new DOMException().INVALID_STATE_ERR).toBe(11);
    expect(new DOMException().SYNTAX_ERR).toBe(12);
    expect(new DOMException().INVALID_MODIFICATION_ERR).toBe(13);
    expect(new DOMException().NAMESPACE_ERR).toBe(14);
    expect(new DOMException().INVALID_ACCESS_ERR).toBe(15);
    expect(new DOMException().VALIDATION_ERR).toBe(16);
    expect(new DOMException().TYPE_MISMATCH_ERR).toBe(17);
    expect(new DOMException().SECURITY_ERR).toBe(18);
    expect(new DOMException().NETWORK_ERR).toBe(19);
    expect(new DOMException().ABORT_ERR).toBe(20);
    expect(new DOMException().URL_MISMATCH_ERR).toBe(21);
    expect(new DOMException().QUOTA_EXCEEDED_ERR).toBe(22);
    expect(new DOMException().TIMEOUT_ERR).toBe(23);
    expect(new DOMException().INVALID_NODE_TYPE_ERR).toBe(24);
    expect(new DOMException().DATA_CLONE_ERR).toBe(25);
  });

  it('extends error and provides name and message', () => {
    const error = new DOMException('test', 'TestError');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TestError');
    expect(error.message).toBe('test');
  });

  it('normalizes the name correctly', () => {
    expect(new DOMException(undefined, undefined).name).toBe('Error');
    expect(new DOMException(undefined, '').name).toBe('');
    // $FlowExpectedError[incompatible-type]
    expect(new DOMException(undefined, null).name).toBe('null');
    // $FlowExpectedError[incompatible-type]
    expect(new DOMException(undefined, {}).name).toBe('[object Object]');
  });

  it('assigns the right code for the given name', () => {
    // Unknown name is code 0.
    expect(new DOMException(undefined, 'SomethingElse').code).toBe(0);

    expect(new DOMException(undefined, 'IndexSizeError').code).toBe(
      DOMException.INDEX_SIZE_ERR,
    );
    expect(new DOMException(undefined, 'HierarchyRequestError').code).toBe(
      DOMException.HIERARCHY_REQUEST_ERR,
    );
    expect(new DOMException(undefined, 'WrongDocumentError').code).toBe(
      DOMException.WRONG_DOCUMENT_ERR,
    );
    expect(new DOMException(undefined, 'InvalidCharacterError').code).toBe(
      DOMException.INVALID_CHARACTER_ERR,
    );
    expect(new DOMException(undefined, 'NoModificationAllowedError').code).toBe(
      DOMException.NO_MODIFICATION_ALLOWED_ERR,
    );
    expect(new DOMException(undefined, 'NotFoundError').code).toBe(
      DOMException.NOT_FOUND_ERR,
    );
    expect(new DOMException(undefined, 'NotSupportedError').code).toBe(
      DOMException.NOT_SUPPORTED_ERR,
    );
    expect(new DOMException(undefined, 'InUseAttributeError').code).toBe(
      DOMException.INUSE_ATTRIBUTE_ERR,
    );
    expect(new DOMException(undefined, 'InvalidStateError').code).toBe(
      DOMException.INVALID_STATE_ERR,
    );
    expect(new DOMException(undefined, 'SyntaxError').code).toBe(
      DOMException.SYNTAX_ERR,
    );
    expect(new DOMException(undefined, 'InvalidModificationError').code).toBe(
      DOMException.INVALID_MODIFICATION_ERR,
    );
    expect(new DOMException(undefined, 'NamespaceError').code).toBe(
      DOMException.NAMESPACE_ERR,
    );
    expect(new DOMException(undefined, 'InvalidAccessError').code).toBe(
      DOMException.INVALID_ACCESS_ERR,
    );
    expect(new DOMException(undefined, 'TypeMismatchError').code).toBe(
      DOMException.TYPE_MISMATCH_ERR,
    );
    expect(new DOMException(undefined, 'SecurityError').code).toBe(
      DOMException.SECURITY_ERR,
    );
    expect(new DOMException(undefined, 'NetworkError').code).toBe(
      DOMException.NETWORK_ERR,
    );
    expect(new DOMException(undefined, 'AbortError').code).toBe(
      DOMException.ABORT_ERR,
    );
    expect(new DOMException(undefined, 'URLMismatchError').code).toBe(
      DOMException.URL_MISMATCH_ERR,
    );
    expect(new DOMException(undefined, 'QuotaExceededError').code).toBe(
      DOMException.QUOTA_EXCEEDED_ERR,
    );
    expect(new DOMException(undefined, 'TimeoutError').code).toBe(
      DOMException.TIMEOUT_ERR,
    );
    expect(new DOMException(undefined, 'InvalidNodeTypeError').code).toBe(
      DOMException.INVALID_NODE_TYPE_ERR,
    );
    expect(new DOMException(undefined, 'DataCloneError').code).toBe(
      DOMException.DATA_CLONE_ERR,
    );
  });
});
