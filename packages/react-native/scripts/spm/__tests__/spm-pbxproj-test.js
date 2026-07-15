/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {
  addArrayMembers,
  addArrayStringValues,
  ensureScalarField,
  findApplicationTargets,
  findField,
  findObjectByUuid,
  findProjectObject,
  generateUUID,
  insertObjectsIntoSection,
  namespacedUUID,
  quoteIfNeeded,
  removeArrayMembersByUuid,
  removeArrayStringValues,
  removeDanglingJavaScriptCoreRef,
  removeEmptyPodsGroup,
  removeField,
  removeObjectByUuid,
  scanToClose,
  serializeEntry,
  setScalarField,
  uuidsInArray,
} = require('../spm-pbxproj');
const fs = require('fs');
const path = require('path');

const PLAIN_PBXPROJ = fs.readFileSync(
  path.join(__dirname, '__fixtures__', 'plain-app.pbxproj'),
  'utf8',
);

// ---------------------------------------------------------------------------
// generateUUID
// ---------------------------------------------------------------------------

describe('generateUUID', () => {
  it('produces a 24-character uppercase hex string', () => {
    const result = generateUUID('test-seed');
    expect(result).toMatch(/^[0-9A-F]{24}$/);
  });

  it('is deterministic', () => {
    expect(generateUUID('same')).toBe(generateUUID('same'));
  });

  it('produces different results for different seeds', () => {
    expect(generateUUID('seed-a')).not.toBe(generateUUID('seed-b'));
  });
});

// ---------------------------------------------------------------------------
// quoteIfNeeded
// ---------------------------------------------------------------------------

describe('quoteIfNeeded', () => {
  it.each([
    ['foo.bar/baz', 'foo.bar/baz'],
    ['foo bar', '"foo bar"'],
    ['a\\b', '"a\\\\b"'],
    ['a"b', '"a\\"b"'],
    ['<group>', '"<group>"'],
  ])('quoteIfNeeded(%j) => %j', (input, expected) => {
    expect(quoteIfNeeded(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Surgical-edit toolkit (in-place injection primitives)
// ---------------------------------------------------------------------------

describe('namespacedUUID', () => {
  it('is deterministic and 24-hex', () => {
    const a = namespacedUUID('ROOT', 'sec', 'id');
    expect(a).toMatch(/^[0-9A-F]{24}$/);
    expect(namespacedUUID('ROOT', 'sec', 'id')).toBe(a);
  });

  it('differs by root, section, id, and salt', () => {
    const base = namespacedUUID('ROOT', 'sec', 'id');
    expect(namespacedUUID('OTHER', 'sec', 'id')).not.toBe(base);
    expect(namespacedUUID('ROOT', 'other', 'id')).not.toBe(base);
    expect(namespacedUUID('ROOT', 'sec', 'other')).not.toBe(base);
    expect(namespacedUUID('ROOT', 'sec', 'id', '2')).not.toBe(base);
  });
});

describe('scanToClose', () => {
  it('matches braces and parens, skipping quoted delimiters', () => {
    const t = 'x = { a = ("a)b"); };';
    const open = t.indexOf('{');
    expect(t[scanToClose(t, open)]).toBe('}');
    const paren = t.indexOf('(');
    // The ")" inside the quoted string must not close the paren early.
    expect(scanToClose(t, paren)).toBe(t.indexOf(');') + 0);
  });
});

describe('findObjectByUuid / findField', () => {
  it('locates an object body and reads scalar + array fields', () => {
    const target = findApplicationTargets(PLAIN_PBXPROJ)[0];
    expect(target.name).toBe('MyApp');
    const obj = findObjectByUuid(PLAIN_PBXPROJ, target.uuid);
    expect(obj).not.toBeNull();
    const productType = findField(PLAIN_PBXPROJ, obj, 'productType');
    expect(productType.value).toContain('application');
    const buildPhases = findField(PLAIN_PBXPROJ, obj, 'buildPhases');
    expect(uuidsInArray(buildPhases.value).size).toBe(3);
  });

  it('returns null for an absent field', () => {
    const project = findProjectObject(PLAIN_PBXPROJ);
    expect(findField(PLAIN_PBXPROJ, project, 'packageReferences')).toBeNull();
  });
});

describe('addArrayMembers', () => {
  it('creates an absent array field after the body open', () => {
    const project = findProjectObject(PLAIN_PBXPROJ);
    const out = addArrayMembers(PLAIN_PBXPROJ, project, 'packageReferences', [
      {uuid: 'CAFE0000000000000000CAFE', comment: 'ref'},
    ]);
    expect(out).toMatch(/packageReferences = \(/);
    expect(out).toContain('CAFE0000000000000000CAFE /* ref */');
  });

  it('appends to and dedupes an existing array', () => {
    const target = findApplicationTargets(PLAIN_PBXPROJ)[0];
    const member = [{uuid: 'AA0000000000000000000301'}]; // already in buildPhases
    const out = addArrayMembers(PLAIN_PBXPROJ, target, 'buildPhases', member);
    // Dedup: no second occurrence added.
    expect(out.match(/AA0000000000000000000301/g)).toHaveLength(
      PLAIN_PBXPROJ.match(/AA0000000000000000000301/g).length,
    );
  });

  it('prepends when requested', () => {
    const target = findApplicationTargets(PLAIN_PBXPROJ)[0];
    const out = addArrayMembers(
      PLAIN_PBXPROJ,
      target,
      'buildPhases',
      [{uuid: 'BEEF0000000000000000BEEF', comment: 'First'}],
      {prepend: true},
    );
    const firstIdx = out.indexOf('BEEF0000000000000000BEEF');
    const sourcesIdx = out.indexOf('AA0000000000000000000301 /* Sources */');
    expect(firstIdx).toBeLessThan(sourcesIdx);
  });
});

describe('addArrayStringValues', () => {
  function targetDebugDict(text) {
    const cfg = findObjectByUuid(text, 'AA0000000000000000000901');
    const bs = findField(text, cfg, 'buildSettings');
    return {uuid: 'x', bodyOpen: bs.valueStart, bodyClose: bs.tokenEnd - 1};
  }

  it('creates an array seeded with $(inherited)', () => {
    const out = addArrayStringValues(
      PLAIN_PBXPROJ,
      targetDebugDict(PLAIN_PBXPROJ),
      'OTHER_LDFLAGS',
      ['"-ObjC"'],
    );
    expect(out).toMatch(/OTHER_LDFLAGS = \(/);
    expect(out).toContain('"$(inherited)"');
    expect(out).toContain('"-ObjC"');
  });

  it('promotes an existing scalar to an array, preserving the old value', () => {
    const scalar = PLAIN_PBXPROJ.replace(
      'PRODUCT_NAME = "$(TARGET_NAME)";',
      'OTHER_LDFLAGS = "-lz"; PRODUCT_NAME = "$(TARGET_NAME)";',
    );
    const out = addArrayStringValues(
      scalar,
      targetDebugDict(scalar),
      'OTHER_LDFLAGS',
      ['"-ObjC"'],
    );
    expect(out).toMatch(/OTHER_LDFLAGS = \(/);
    expect(out).toContain('"-lz"');
    expect(out).toContain('"-ObjC"');
  });

  it('dedups by EXACT token, not substring (adds "-ObjC" even when "-ObjCFoo" is present)', () => {
    const withArray = PLAIN_PBXPROJ.replace(
      'PRODUCT_NAME = "$(TARGET_NAME)";',
      'OTHER_LDFLAGS = ("-ObjCFoo", ); PRODUCT_NAME = "$(TARGET_NAME)";',
    );
    const out = addArrayStringValues(
      withArray,
      targetDebugDict(withArray),
      'OTHER_LDFLAGS',
      ['"-ObjC"'],
    );
    // A substring check would have seen "-ObjC" inside "-ObjCFoo" and skipped it.
    expect(out).toContain('"-ObjC"');
    expect(out).toContain('"-ObjCFoo"');
  });

  it('does not re-add an exact existing member', () => {
    const withArray = PLAIN_PBXPROJ.replace(
      'PRODUCT_NAME = "$(TARGET_NAME)";',
      'OTHER_LDFLAGS = ("-ObjC", ); PRODUCT_NAME = "$(TARGET_NAME)";',
    );
    const out = addArrayStringValues(
      withArray,
      targetDebugDict(withArray),
      'OTHER_LDFLAGS',
      ['"-ObjC"'],
    );
    expect((out.match(/"-ObjC"/g) || []).length).toBe(1);
  });
});

describe('ensureScalarField', () => {
  it('adds a scalar only when absent', () => {
    const project = findProjectObject(PLAIN_PBXPROJ);
    const out = ensureScalarField(
      PLAIN_PBXPROJ,
      project,
      'ORGANIZATIONNAME',
      'Acme',
    );
    expect(out).toContain('ORGANIZATIONNAME = Acme;');
    // Re-running is a no-op.
    const project2 = findProjectObject(out);
    expect(ensureScalarField(out, project2, 'ORGANIZATIONNAME', 'Other')).toBe(
      out,
    );
  });
});

describe('setScalarField', () => {
  it('replaces an existing value in place, preserving field order', () => {
    const project = findProjectObject(PLAIN_PBXPROJ);
    const withOrg = ensureScalarField(
      PLAIN_PBXPROJ,
      project,
      'ORGANIZATIONNAME',
      'Acme',
    );
    const before = withOrg.indexOf('ORGANIZATIONNAME');
    const project2 = findProjectObject(withOrg);
    const out = setScalarField(withOrg, project2, 'ORGANIZATIONNAME', 'Other');
    expect(out).toContain('ORGANIZATIONNAME = Other;');
    expect(out).not.toContain('ORGANIZATIONNAME = Acme;');
    // Field stayed at the same position — no remove+re-append shuffling.
    expect(out.indexOf('ORGANIZATIONNAME')).toBe(before);
  });

  it('is byte-identical when the value is unchanged', () => {
    const project = findProjectObject(PLAIN_PBXPROJ);
    const withOrg = ensureScalarField(
      PLAIN_PBXPROJ,
      project,
      'ORGANIZATIONNAME',
      'Acme',
    );
    const project2 = findProjectObject(withOrg);
    const out = setScalarField(withOrg, project2, 'ORGANIZATIONNAME', 'Acme');
    expect(out).toBe(withOrg);
  });

  it('appends the field when absent, like ensureScalarField', () => {
    const project = findProjectObject(PLAIN_PBXPROJ);
    const out = setScalarField(
      PLAIN_PBXPROJ,
      project,
      'ORGANIZATIONNAME',
      'Acme',
    );
    expect(out).toContain('ORGANIZATIONNAME = Acme;');
    expect(
      ensureScalarField(PLAIN_PBXPROJ, project, 'ORGANIZATIONNAME', 'Acme'),
    ).toBe(out);
  });

  it('preserves a quoted value fully, including its quotes', () => {
    const project = findProjectObject(PLAIN_PBXPROJ);
    const withScript = ensureScalarField(
      PLAIN_PBXPROJ,
      project,
      'SOME_SCRIPT',
      '"echo hi"',
    );
    const project2 = findProjectObject(withScript);
    const out = setScalarField(
      withScript,
      project2,
      'SOME_SCRIPT',
      '"echo bye"',
    );
    expect(out).toContain('SOME_SCRIPT = "echo bye";');
    expect(out).not.toContain('echo hi');
  });
});

describe('insertObjectsIntoSection', () => {
  it('creates a new section before the objects dict closes', () => {
    const entry = serializeEntry({
      uuid: 'DEAD0000000000000000DEAD',
      comment: 'XCLocalSwiftPackageReference "x"',
      fields: {isa: 'XCLocalSwiftPackageReference', relativePath: 'x'},
    });
    const out = insertObjectsIntoSection(
      PLAIN_PBXPROJ,
      'XCLocalSwiftPackageReference',
      entry,
    );
    expect(out).toContain('/* Begin XCLocalSwiftPackageReference section */');
    expect(out).toContain('DEAD0000000000000000DEAD');
    // Still inside the objects dict (before rootObject).
    expect(out.indexOf('DEAD0000000000000000DEAD')).toBeLessThan(
      out.indexOf('rootObject ='),
    );
  });
});

// ---------------------------------------------------------------------------
// Surgical removal — inverses used by `deinit`
// ---------------------------------------------------------------------------

describe('surgical removal (deinit inverse)', () => {
  const FAKE = 'DEADBEEF0000000000001234';

  it('removeObjectByUuid exactly inverts insertObjectsIntoSection', () => {
    const inserted = insertObjectsIntoSection(
      PLAIN_PBXPROJ,
      'PBXBuildFile',
      serializeEntry({
        uuid: FAKE,
        comment: 'Fake',
        fields: {isa: 'PBXBuildFile'},
      }),
    );
    expect(inserted).not.toBe(PLAIN_PBXPROJ);
    expect(removeObjectByUuid(inserted, FAKE)).toBe(PLAIN_PBXPROJ);
  });

  it('removeObjectByUuid is a no-op when the uuid is absent', () => {
    expect(removeObjectByUuid(PLAIN_PBXPROJ, FAKE)).toBe(PLAIN_PBXPROJ);
  });

  it('removeArrayMembersByUuid inverts addArrayMembers on an existing array', () => {
    const [target] = findApplicationTargets(PLAIN_PBXPROJ);
    const added = addArrayMembers(PLAIN_PBXPROJ, target, 'buildPhases', [
      {uuid: FAKE, comment: 'Fake'},
    ]);
    expect(added).not.toBe(PLAIN_PBXPROJ);
    expect(removeArrayMembersByUuid(added, [FAKE])).toBe(PLAIN_PBXPROJ);
  });

  it('removeField inverts ensureScalarField', () => {
    const [target] = findApplicationTargets(PLAIN_PBXPROJ);
    const added = ensureScalarField(
      PLAIN_PBXPROJ,
      target,
      'SPM_TEST_FLAG',
      '"yes"',
    );
    expect(added).not.toBe(PLAIN_PBXPROJ);
    const [target2] = findApplicationTargets(added);
    expect(removeField(added, target2, 'SPM_TEST_FLAG')).toBe(PLAIN_PBXPROJ);
  });

  it('removeArrayStringValues removes only the named values', () => {
    const [target] = findApplicationTargets(PLAIN_PBXPROJ);
    const seeded = addArrayStringValues(PLAIN_PBXPROJ, target, 'SPM_TEST_ARR', [
      '"-A"',
    ]);
    const [t2] = findApplicationTargets(seeded);
    const appended = addArrayStringValues(seeded, t2, 'SPM_TEST_ARR', ['"-B"']);
    const [t3] = findApplicationTargets(appended);
    // Removing the appended "-B" returns to the seeded (single-value) state.
    expect(
      removeArrayStringValues(appended, t3, 'SPM_TEST_ARR', ['"-B"']),
    ).toBe(seeded);
  });
});

// ---------------------------------------------------------------------------
// removeEmptyPodsGroup — clean up the leftover empty `Pods` group after
// `pod deintegrate` (which `add --deintegrate` runs).
// ---------------------------------------------------------------------------

describe('removeEmptyPodsGroup', () => {
  // A main group referencing an empty `Pods` group (what pod deintegrate leaves).
  const WITH_EMPTY_PODS = [
    '// !$*UTF8*$!',
    '{',
    '\tobjects = {',
    '/* Begin PBXGroup section */',
    '\t\tAA0000000000000000000001 = {',
    '\t\t\tisa = PBXGroup;',
    '\t\t\tchildren = (',
    '\t\t\t\t13B07FAE1A68108700A75B9A /* App */,',
    '\t\t\t\tBBD78D7AC51CEA395F1C20DB /* Pods */,',
    '\t\t\t);',
    '\t\t\tsourceTree = "<group>";',
    '\t\t};',
    '\t\tBBD78D7AC51CEA395F1C20DB /* Pods */ = {',
    '\t\t\tisa = PBXGroup;',
    '\t\t\tchildren = (',
    '\t\t\t);',
    '\t\t\tpath = Pods;',
    '\t\t\tsourceTree = "<group>";',
    '\t\t};',
    '/* End PBXGroup section */',
    '\t};',
    '}',
    '',
  ].join('\n');

  it('removes the empty Pods group object and its parent reference', () => {
    const out = removeEmptyPodsGroup(WITH_EMPTY_PODS);
    expect(out).not.toContain('/* Pods */');
    expect(out).not.toContain('path = Pods;');
    // The unrelated child survives.
    expect(out).toContain('13B07FAE1A68108700A75B9A /* App */,');
  });

  it('leaves a NON-empty Pods group untouched (still integrated)', () => {
    const nonEmpty = WITH_EMPTY_PODS.replace(
      'children = (\n\t\t\t);\n\t\t\tpath = Pods;',
      'children = (\n\t\t\t\tDEADBEEF0000000000000001 /* libPods.a */,\n\t\t\t);\n\t\t\tpath = Pods;',
    );
    expect(removeEmptyPodsGroup(nonEmpty)).toBe(nonEmpty);
  });

  it('is a no-op when there is no Pods group', () => {
    const noPods = WITH_EMPTY_PODS.split('\n')
      .filter(l => !l.includes('Pods'))
      .join('\n');
    expect(removeEmptyPodsGroup(noPods)).toBe(noPods);
  });
});

// ---------------------------------------------------------------------------
// removeDanglingJavaScriptCoreRef — strip the community template's leftover
// `JavaScriptCore.framework` PBXFileReference (navigator-only since RN 0.60,
// meaningless under Hermes) unless it's actually linked.
// ---------------------------------------------------------------------------

describe('removeDanglingJavaScriptCoreRef', () => {
  const JSC_FILE_REF =
    '\t\tED297162215061F000B7C4FE /* JavaScriptCore.framework */ = {isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = JavaScriptCore.framework; path = System/Library/Frameworks/JavaScriptCore.framework; sourceTree = SDKROOT; };';

  // A Frameworks group referencing the dangling JavaScriptCore.framework ref.
  const WITH_DANGLING_JSC = [
    '// !$*UTF8*$!',
    '{',
    '\tobjects = {',
    '/* Begin PBXFileReference section */',
    JSC_FILE_REF,
    '/* End PBXFileReference section */',
    '/* Begin PBXGroup section */',
    '\t\t13B07FAF1A68108700A75B9A /* Frameworks */ = {',
    '\t\t\tisa = PBXGroup;',
    '\t\t\tchildren = (',
    '\t\t\t\tED297162215061F000B7C4FE /* JavaScriptCore.framework */,',
    '\t\t\t);',
    '\t\t\tname = Frameworks;',
    '\t\t\tsourceTree = "<group>";',
    '\t\t};',
    '/* End PBXGroup section */',
    '\t};',
    '}',
    '',
  ].join('\n');

  it('removes both the file reference object and its group membership when dangling', () => {
    const out = removeDanglingJavaScriptCoreRef(WITH_DANGLING_JSC);
    expect(out).not.toContain('JavaScriptCore.framework');
    expect(out).not.toContain('ED297162215061F000B7C4FE');
    // The parent group survives, now childless.
    expect(out).toContain('13B07FAF1A68108700A75B9A /* Frameworks */ = {');
  });

  it('leaves a still-linked reference untouched (a PBXBuildFile references it)', () => {
    const linked = WITH_DANGLING_JSC.replace(
      '/* Begin PBXFileReference section */',
      '/* Begin PBXBuildFile section */\n' +
        '\t\tED2971642150620600B7C4FE /* JavaScriptCore.framework in Frameworks */ = {isa = PBXBuildFile; fileRef = ED297162215061F000B7C4FE /* JavaScriptCore.framework */; };\n' +
        '/* End PBXBuildFile section */\n' +
        '/* Begin PBXFileReference section */',
    );
    expect(removeDanglingJavaScriptCoreRef(linked)).toBe(linked);
  });

  it('is a no-op when there is no JavaScriptCore reference', () => {
    const noJsc = WITH_DANGLING_JSC.split('\n')
      .filter(l => !l.includes('JavaScriptCore'))
      .join('\n');
    expect(removeDanglingJavaScriptCoreRef(noJsc)).toBe(noJsc);
  });

  it('is idempotent', () => {
    const once = removeDanglingJavaScriptCoreRef(WITH_DANGLING_JSC);
    const twice = removeDanglingJavaScriptCoreRef(once);
    expect(twice).toBe(once);
  });
});
