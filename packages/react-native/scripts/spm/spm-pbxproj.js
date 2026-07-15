/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const crypto = require('crypto');

/**
 * Generate a deterministic 24-hex-character UUID from a seed string.
 * SHA-256 truncated to 24 chars (standard Xcode pbxproj UUID length). Not a
 * security use — the hash only provides stable, collision-unlikely IDs — but
 * sha256 keeps static analysis (CodeQL weak-crypto) quiet.
 */
function generateUUID(seed /*: string */) /*: string */ {
  return crypto
    .createHash('sha256')
    .update(seed)
    .digest('hex')
    .substring(0, 24)
    .toUpperCase();
}

/**
 * Escapes a string for OpenStep plist format if needed.
 */
function quoteIfNeeded(s /*: string */) /*: string */ {
  if (/^[a-zA-Z0-9._/]+$/.test(s)) {
    return s;
  }
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

/**
 * Serialize a single pbxproj object entry to its OpenStep text form,
 * including the leading `\t\t<uuid>` and trailing `};` but NO trailing
 * newline. Short entries (≤3 scalar fields) collapse to one line, matching
 * Xcode's own formatting. Used by the in-place injector to splice single
 * entries into an existing project.
 */
function serializeEntry(
  entry /*: {readonly uuid: string, readonly comment?: ?string, readonly fields: {readonly [string]: string}, ...} */,
) /*: string */ {
  const comment =
    entry.comment != null && entry.comment !== ''
      ? ` /* ${entry.comment} */`
      : '';
  let out = `\t\t${entry.uuid}${comment} = {`;
  const fieldKeys = Object.keys(entry.fields);
  if (
    fieldKeys.length <= 3 &&
    !fieldKeys.some(k => entry.fields[k].includes('\n'))
  ) {
    // Single-line format for short entries
    out += fieldKeys.map(k => `${k} = ${entry.fields[k]};`).join(' ');
    out += '};';
  } else {
    out += '\n';
    for (const key of fieldKeys) {
      out += `\t\t\t${key} = ${entry.fields[key]};\n`;
    }
    out += '\t\t};';
  }
  return out;
}

// ---------------------------------------------------------------------------
// Surgical in-place pbxproj editing.
//
// To ADD SPM packages to a user's EXISTING project.pbxproj we splice new
// objects and array members into the existing text by string anchors, leaving
// every untouched byte identical (so the git diff is just the added lines).
// These helpers operate on the raw OpenStep text — there is no AST. Quote-aware
// delimiter matching lets them skip over field values (e.g. a shellScript
// containing braces/parens) without miscounting.
// ---------------------------------------------------------------------------

/**
 * Derive a deterministic UUID for an injected object, namespaced by the host
 * project's root-object UUID so it is (a) stable across re-runs (idempotency)
 * and (b) astronomically unlikely to collide with the user's existing
 * randomly-assigned 24-hex IDs. `salt` lets the caller re-derive on the
 * ~1-in-2^96 collision.
 */
function namespacedUUID(
  rootUUID /*: string */,
  section /*: string */,
  id /*: string */,
  salt /*: string */ = '',
) /*: string */ {
  return generateUUID(`${rootUUID}:spm${salt}:${section}:${id}`);
}

function escapeRegExp(s /*: string */) /*: string */ {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Given an index pointing at an opening `"`, return the index of the matching
 * closing `"` (honoring backslash escapes).
 */
function scanString(text /*: string */, openIdx /*: number */) /*: number */ {
  for (let i = openIdx + 1; i < text.length; i++) {
    const c = text[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (c === '"') {
      return i;
    }
  }
  throw new Error('pbxproj: unterminated string literal');
}

/**
 * Given an index pointing at an opening `{` or `(`, return the index of the
 * matching close delimiter. Nesting counts both brace and paren forms; quoted
 * strings are skipped. Well-formed OpenStep never mismatches the two forms.
 */
function scanToClose(text /*: string */, openIdx /*: number */) /*: number */ {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      i = scanString(text, i);
      continue;
    }
    if (c === '{' || c === '(') {
      depth++;
    } else if (c === '}' || c === ')') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  throw new Error('pbxproj: unbalanced delimiters');
}

/*::
type ObjectRange = {uuid: string, bodyOpen: number, bodyClose: number};
// Any object whose body range is known — field accessors only need the body
// bounds, so they accept the richer shapes callers carry (e.g. app targets
// with a name, or buildSettings dicts) inexactly.
type BodyRange = {bodyOpen: number, bodyClose: number, ...};
type FieldRange = {matchStart: number, valueStart: number, value: string, tokenEnd: number};
*/

/**
 * Locate the object with the given 24-hex UUID. Returns the index of the body
 * `{` and its matching `}`. Matches both single-line and multi-line entries.
 */
function findObjectByUuid(
  text /*: string */,
  uuid /*: string */,
) /*: ObjectRange | null */ {
  const m = new RegExp(`\\n\\t*${uuid}\\b[^\\n]*?= \\{`).exec(text);
  if (m == null) {
    return null;
  }
  const bodyOpen = text.indexOf('{', m.index);
  const bodyClose = scanToClose(text, bodyOpen);
  return {uuid, bodyOpen, bodyClose};
}

/**
 * Find a field within a multi-line object body (`\n\t+key = value;`). Returns
 * the value token range (value excludes the trailing `;`; `tokenEnd` points AT
 * the `;`). Containers (`( … )` / `{ … }`) and quoted strings are matched as a
 * whole. Returns null when the key is absent.
 */
function findField(
  text /*: string */,
  obj /*: BodyRange */,
  key /*: string */,
) /*: FieldRange | null */ {
  const body = text.slice(obj.bodyOpen, obj.bodyClose);
  const m = new RegExp(`\\n\\t+${escapeRegExp(key)} = `).exec(body);
  if (m == null) {
    return null;
  }
  const matchStart = obj.bodyOpen + m.index;
  const valueStart = matchStart + m[0].length;
  const fc = text[valueStart];
  let tokenEnd;
  if (fc === '(' || fc === '{') {
    tokenEnd = scanToClose(text, valueStart) + 1;
  } else if (fc === '"') {
    tokenEnd = scanString(text, valueStart) + 1;
  } else {
    tokenEnd = text.indexOf(';', valueStart);
  }
  return {
    matchStart,
    valueStart,
    value: text.slice(valueStart, tokenEnd),
    tokenEnd,
  };
}

/** Locate the `/* Begin X section *​/ … /* End X section *​/` byte range. */
function findSection(
  text /*: string */,
  name /*: string */,
) /*: {begin: number, contentStart: number, end: number} | null */ {
  const beginTag = `/* Begin ${name} section */`;
  const endTag = `/* End ${name} section */`;
  const begin = text.indexOf(beginTag);
  const end = text.indexOf(endTag);
  if (begin < 0 || end < 0) {
    return null;
  }
  return {begin, contentStart: begin + beginTag.length, end};
}

/** The PBXProject root object (via the trailing `rootObject = <uuid>;`). */
function findProjectObject(text /*: string */) /*: ObjectRange | null */ {
  const m = /\n\trootObject = ([0-9A-Fa-f]{24})/.exec(text);
  if (m == null) {
    return null;
  }
  return findObjectByUuid(text, m[1]);
}

/**
 * Every PBXNativeTarget whose productType is an application. Returns uuid +
 * name + body range for each. Used to pick the app target to inject into
 * (and to refuse on ambiguity).
 */
function findApplicationTargets(
  text /*: string */,
) /*: Array<{uuid: string, name: string, bodyOpen: number, bodyClose: number}> */ {
  const section = findSection(text, 'PBXNativeTarget');
  if (section == null) {
    return [];
  }
  const out = [];
  const re = /\n\t\t([0-9A-Fa-f]{24})(?: \/\* (.*?) \*\/)? = \{/g;
  re.lastIndex = section.contentStart;
  for (;;) {
    const m = re.exec(text);
    if (m == null || m.index >= section.end) {
      break;
    }
    const uuid = m[1];
    const comment = m[2];
    const bodyOpen = text.indexOf('{', m.index);
    const bodyClose = scanToClose(text, bodyOpen);
    const obj = {uuid, bodyOpen, bodyClose};
    const productType = findField(text, obj, 'productType');
    if (
      productType != null &&
      /com\.apple\.product-type\.application/.test(productType.value)
    ) {
      const nameField = findField(text, obj, 'name');
      const name =
        nameField != null
          ? nameField.value.replace(/^"|"$/g, '')
          : (comment ?? uuid);
      out.push({uuid, name, bodyOpen, bodyClose});
    }
    re.lastIndex = bodyClose;
  }
  return out;
}

/** UUIDs already referenced inside a `( … )` array field value. */
function uuidsInArray(value /*: string */) /*: Set<string> */ {
  const found = new Set /*:: <string> */();
  const re = /\b([0-9A-Fa-f]{24})\b/g;
  for (;;) {
    const m = re.exec(value);
    if (m == null) {
      break;
    }
    found.add(m[1]);
  }
  return found;
}

/**
 * The leading-tab indent of fields inside an object body (e.g. `\t\t\t` for a
 * top-level object, `\t\t\t\t` for a nested dict like buildSettings). Used so
 * inserted fields/members match the surrounding depth at any nesting level.
 */
function detectFieldIndent(
  text /*: string */,
  obj /*: BodyRange */,
) /*: string */ {
  const m = /\n(\t+)\S/.exec(text.slice(obj.bodyOpen, obj.bodyClose));
  return m != null ? m[1] : '\t\t\t';
}

/**
 * Insert one or more already-serialized object entries (text produced by
 * serializeEntry, no surrounding newlines) into the named section — created
 * just before the close of the `objects` dict if the section is absent.
 */
function insertObjectsIntoSection(
  text /*: string */,
  sectionName /*: string */,
  entriesText /*: string */,
) /*: string */ {
  const section = findSection(text, sectionName);
  if (section != null) {
    return (
      text.slice(0, section.end) + entriesText + '\n' + text.slice(section.end)
    );
  }
  // No such section yet — create it just before the `objects` dict closes.
  const anchor = '\n\t};\n\trootObject = ';
  const at = text.indexOf(anchor);
  if (at < 0) {
    throw new Error('pbxproj: could not find end of objects dict');
  }
  const block =
    `/* Begin ${sectionName} section */\n${entriesText}\n` +
    `/* End ${sectionName} section */\n\n`;
  return text.slice(0, at + 1) + block + text.slice(at + 1);
}

/**
 * Append members to a `( … )` array field, deduping by UUID. Creates the field
 * (with a `$(inherited)`-free literal list) after the object's opening `{` when
 * absent. `members` are `{uuid, comment}`. Indentation is derived from the
 * object so it works for top-level fields and nested dicts alike.
 */
function addArrayMembers(
  text /*: string */,
  obj /*: BodyRange */,
  key /*: string */,
  members /*: ReadonlyArray<{readonly uuid: string, readonly comment?: ?string, ...}> */,
  options /*: {prepend?: boolean} */ = {},
) /*: string */ {
  const fieldIndent = detectFieldIndent(text, obj);
  const memberIndent = fieldIndent + '\t';
  const line = (
    m /*: {readonly uuid: string, readonly comment?: ?string, ...} */,
  ) =>
    `${memberIndent}${m.uuid}${m.comment != null && m.comment !== '' ? ` /* ${m.comment} */` : ''},\n`;

  const field = findField(text, obj, key);
  if (field != null) {
    const existing = uuidsInArray(field.value);
    const fresh = members.filter(m => !existing.has(m.uuid));
    if (fresh.length === 0) {
      return text;
    }
    // Prepend: insert right after the array's opening `(\n` so the new members
    // run first (used for the sync phase, which must precede Sources).
    const insertAt =
      options.prepend === true
        ? text.indexOf('\n', field.valueStart) + 1
        : text.lastIndexOf('\n', field.tokenEnd - 1) + 1;
    return (
      text.slice(0, insertAt) + fresh.map(line).join('') + text.slice(insertAt)
    );
  }
  const block = `\n${fieldIndent}${key} = (\n${members.map(line).join('')}${fieldIndent});`;
  return text.slice(0, obj.bodyOpen + 1) + block + text.slice(obj.bodyOpen + 1);
}

/**
 * Append raw string values to a `( … )` array build-setting (e.g.
 * OTHER_LDFLAGS), deduping by exact token. Creates the setting seeded with
 * `"$(inherited)"` when absent. Values must already be plist-quoted by caller.
 */
function addArrayStringValues(
  text /*: string */,
  obj /*: BodyRange */,
  key /*: string */,
  values /*: Array<string> */,
) /*: string */ {
  const fieldIndent = detectFieldIndent(text, obj);
  const memberIndent = fieldIndent + '\t';
  const arrayBlock = (members /*: Array<string> */) =>
    `(\n${members.map(v => `${memberIndent}${v},\n`).join('')}${fieldIndent})`;

  const field = findField(text, obj, key);
  if (field != null) {
    // Dedup by EXACT existing member, not substring — a substring check would
    // treat `"-ObjC"` as already present when only `"-ObjCFoo"` is there (and
    // vice-versa). Parse the current members (array `( … )` or bare scalar).
    const existingMembers = new Set(
      field.value
        .replace(/^\s*\(/, '')
        .replace(/\)\s*$/, '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0),
    );
    const fresh = values.filter(v => !existingMembers.has(v));
    if (fresh.length === 0) {
      return text;
    }
    if (field.value.trimStart().startsWith('(')) {
      // Existing array — splice fresh members before the closing `)`.
      const lineStart = text.lastIndexOf('\n', field.tokenEnd - 1) + 1;
      const lines = fresh.map(v => `${memberIndent}${v},\n`).join('');
      return text.slice(0, lineStart) + lines + text.slice(lineStart);
    }
    // Existing scalar — promote to an array preserving the prior value.
    const replacement = arrayBlock([
      '"$(inherited)"',
      field.value.trim(),
      ...fresh,
    ]);
    return (
      text.slice(0, field.valueStart) + replacement + text.slice(field.tokenEnd)
    );
  }
  const block = `\n${fieldIndent}${key} = ${arrayBlock(['"$(inherited)"', ...values])};`;
  return text.slice(0, obj.bodyOpen + 1) + block + text.slice(obj.bodyOpen + 1);
}

/**
 * Add a scalar field after the object's `{` only when ABSENT (never clobbers a
 * value the user already set). Returns text unchanged if the key exists.
 */
function ensureScalarField(
  text /*: string */,
  obj /*: BodyRange */,
  key /*: string */,
  value /*: string */,
) /*: string */ {
  if (findField(text, obj, key) != null) {
    return text;
  }
  const fieldIndent = detectFieldIndent(text, obj);
  const block = `\n${fieldIndent}${key} = ${value};`;
  return text.slice(0, obj.bodyOpen + 1) + block + text.slice(obj.bodyOpen + 1);
}

/**
 * Set a scalar field's value, UNLIKE ensureScalarField this overwrites an
 * existing value in place rather than leaving it alone — used by fields the
 * injector itself owns (e.g. the generated `shellScript`) that must be kept
 * in sync on re-injection. When the field is present, only the value token
 * (`findField`'s `valueStart..tokenEnd` range — the trailing `;` is NOT part
 * of that range and is preserved untouched) is replaced in place, so field
 * order never shifts and passing the same `value` again yields
 * byte-identical output. Falls back to `ensureScalarField`'s append-after-`{`
 * behavior when the field is absent.
 */
function setScalarField(
  text /*: string */,
  obj /*: BodyRange */,
  key /*: string */,
  value /*: string */,
) /*: string */ {
  const field = findField(text, obj, key);
  if (field != null) {
    return text.slice(0, field.valueStart) + value + text.slice(field.tokenEnd);
  }
  return ensureScalarField(text, obj, key, value);
}
// ---------------------------------------------------------------------------
// Surgical removal — the inverse of the additive helpers above. `deinit` uses
// these to undo exactly what injection added, leaving every other byte (incl.
// user edits made after injection) untouched. All are pure string transforms.
// ---------------------------------------------------------------------------

/**
 * Remove the object whose UUID is `uuid` (its whole `\t\t<uuid> … = { … };`
 * entry, single- or multi-line). No-op when the object is absent.
 */
function removeObjectByUuid(
  text /*: string */,
  uuid /*: string */,
) /*: string */ {
  const obj = findObjectByUuid(text, uuid);
  if (obj == null) {
    return text;
  }
  // Start at the newline preceding the entry's line; end just past its `;`.
  // Leaving the trailing newline in place preserves it as the next entry's
  // separator (byte-identical to never having inserted the line).
  const start = text.lastIndexOf('\n', obj.bodyOpen);
  let end = obj.bodyClose + 1; // past `}`
  if (text[end] === ';') {
    end++;
  }
  return text.slice(0, start) + text.slice(end);
}

/**
 * Remove array-member lines (`\n\t+<uuid> /* … *​/,`) referencing any of
 * `uuids` from every `( … )` list in the file (packageReferences,
 * packageProductDependencies, a Frameworks phase's `files`, buildPhases, …).
 * Only matches member lines (trailing comma), never the object-definition line
 * (which ends in `= {`), so it composes safely with removeObjectByUuid.
 */
function removeArrayMembersByUuid(
  text /*: string */,
  uuids /*: ReadonlyArray<string> */,
) /*: string */ {
  let out = text;
  for (const uuid of uuids) {
    out = out.replace(
      new RegExp(`\\n[\\t ]*${escapeRegExp(uuid)}\\b[^\\n]*,`, 'g'),
      '',
    );
  }
  return out;
}

/** Remove a whole `\n\t+key = value;` field from `obj`. No-op when absent. */
function removeField(
  text /*: string */,
  obj /*: BodyRange */,
  key /*: string */,
) /*: string */ {
  const f = findField(text, obj, key);
  if (f == null) {
    return text;
  }
  // f.matchStart points at the leading `\n`; f.tokenEnd points AT the `;`.
  return text.slice(0, f.matchStart) + text.slice(f.tokenEnd + 1);
}

/**
 * Remove specific raw string members from an existing `( … )` array field
 * (inverse of addArrayStringValues' append branch). Leaves the field and any
 * other members in place. No-op when the field or a value is absent.
 */
function removeArrayStringValues(
  text /*: string */,
  obj /*: BodyRange */,
  key /*: string */,
  values /*: ReadonlyArray<string> */,
) /*: string */ {
  const f = findField(text, obj, key);
  if (f == null) {
    return text;
  }
  let region = text.slice(f.valueStart, f.tokenEnd);
  for (const val of values) {
    region = region.replace(new RegExp(`\\n[\\t ]*${escapeRegExp(val)},`), '');
  }
  return text.slice(0, f.valueStart) + region + text.slice(f.tokenEnd);
}

/**
 * Remove the empty `Pods` PBXGroup that `pod deintegrate` can leave behind in
 * the navigator (build integration is already gone — xcconfigs/[CP] phases/
 * linking — but the group lingers). Removes the group object AND its membership
 * in any parent group. Only acts when the group is EMPTY (`children = ()`), so a
 * still-integrated project (non-empty Pods group) is never touched. No-op when
 * absent. PBXGroup bodies contain no nested braces, so `[^{}]` body matching is
 * safe.
 */
function removeEmptyPodsGroup(text /*: string */) /*: string */ {
  const m = /\n[\t ]*([0-9A-Fa-f]{24}) \/\* Pods \*\/ = \{[^{}]*?\};/.exec(
    text,
  );
  if (m == null) {
    return text;
  }
  const block = m[0];
  if (
    !/isa = PBXGroup;/.test(block) ||
    !/children = \(\s*\);/.test(block) ||
    !/\b(?:path|name) = Pods;/.test(block)
  ) {
    return text;
  }
  const uuid = m[1];
  // Drop the parent group's child reference first, then the group object.
  return removeObjectByUuid(removeArrayMembersByUuid(text, [uuid]), uuid);
}

/**
 * Remove the dangling `JavaScriptCore.framework` PBXFileReference the
 * community template has carried since RN 0.60 (an SDK framework reference
 * left over from the pre-Hermes JSC-via-CocoaPods era). It's navigator-only —
 * never wired into any PBXBuildFile/build phase — so it's meaningless (and
 * confusing) now that React Native uses Hermes. Only removes references that
 * are truly unlinked: if a PBXBuildFile still references the UUID (e.g. an
 * app that deliberately links JSC, such as via react-native-javascriptcore),
 * that reference is left completely untouched. Removes the file-reference
 * object AND its membership in any parent group. No-op when absent. Like
 * `removeEmptyPodsGroup`, `deinit` does not restore this removal — git is the
 * safety net.
 */
function removeDanglingJavaScriptCoreRef(text /*: string */) /*: string */ {
  const re =
    /\n[\t ]*([0-9A-Fa-f]{24}) \/\* JavaScriptCore\.framework \*\/ = \{[^{}]*?\};/g;
  const uuidsToRemove = [];
  for (const m of text.matchAll(re)) {
    const block = m[0];
    if (
      !/isa = PBXFileReference;/.test(block) ||
      !/path = System\/Library\/Frameworks\/JavaScriptCore\.framework;/.test(
        block,
      ) ||
      !/sourceTree = SDKROOT;/.test(block)
    ) {
      continue;
    }
    const uuid = m[1];
    const linked = new RegExp(`\\bfileRef = ${escapeRegExp(uuid)}\\b`).test(
      text,
    );
    if (!linked) {
      uuidsToRemove.push(uuid);
    }
  }
  if (uuidsToRemove.length === 0) {
    return text;
  }
  // Drop the parent group's child reference(s) first, then the file objects.
  let out = removeArrayMembersByUuid(text, uuidsToRemove);
  for (const uuid of uuidsToRemove) {
    out = removeObjectByUuid(out, uuid);
  }
  return out;
}

module.exports = {
  generateUUID,
  namespacedUUID,
  serializeEntry,
  quoteIfNeeded,
  // Surgical-edit toolkit (in-place injection):
  scanString,
  scanToClose,
  findObjectByUuid,
  findField,
  findSection,
  findProjectObject,
  findApplicationTargets,
  uuidsInArray,
  detectFieldIndent,
  insertObjectsIntoSection,
  addArrayMembers,
  addArrayStringValues,
  ensureScalarField,
  setScalarField,
  escapeRegExp,
  // Surgical removal (deinit):
  removeObjectByUuid,
  removeArrayMembersByUuid,
  removeField,
  removeArrayStringValues,
  removeEmptyPodsGroup,
  removeDanglingJavaScriptCoreRef,
};
