/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

declare module 'selfsigned' {
  declare interface SelfsignedOptions {
    /**
     * The number of days before expiration
     *
     * @default 365 */
    days?: number;

    /**
     * The date before which the certificate should not be valid
     *
     * @default now */
    notBeforeDate?: Date;

    /**
     * the size for the private key in bits
     * @default 1024
     */
    keySize?: number;
    /**
     * additional extensions for the certificate
     */
    extensions?: unknown[];
    /**
     * The signature algorithm sha256 or sha1
     * @default "sha1"
     */
    algorithm?: string;
    /**
     * include PKCS#7 as part of the output
     * @default false
     */
    pkcs7?: boolean;
    /**
     * generate client cert signed by the original key
     * @default false
     */
    clientCertificate?: boolean;
    /**
     * client certificate's common name
     * @default "John Doe jdoe123"
     */
    clientCertificateCN?: string;
    /**
     * the size for the client private key in bits
     * @default 1024
     */
    clientCertificateKeySize?: number;
  }

  declare interface GenerateResult {
    private: string;
    public: string;
    cert: string;
    fingerprint: string;
  }

  declare export function generate(
    attrs?: pki$CertificateField[],
    opts?: SelfsignedOptions,
  ): GenerateResult;

  declare export function generate(
    attrs?: pki$CertificateField[],
    opts?: SelfsignedOptions,
    /** Optional callback, if not provided the generation is synchronous */
    done?: (err: void | Error, result: GenerateResult) => unknown,
  ): void;

  // definitions from node-forge's `pki` and `asn1` namespaces
  declare interface pki$CertificateFieldOptions {
    name?: string | void;
    type?: string | void;
    shortName?: string | void;
  }

  declare enum asn1$Class {
    UNIVERSAL = 0x00,
    APPLICATION = 0x40,
    CONTEXT_SPECIFIC = 0x80,
    PRIVATE = 0xc0,
  }

  declare interface pki$CertificateField extends pki$CertificateFieldOptions {
    valueConstructed?: boolean | void;
    valueTagClass?: asn1$Class | void;
    value?: unknown[] | string | void;
    extensions?: unknown[] | void;
  }
}
