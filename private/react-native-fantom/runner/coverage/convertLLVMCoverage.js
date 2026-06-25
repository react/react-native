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

// LLVM-cov segment format: [line, col, count, hasCount, isRegionEntry, isGapRegion]
import type {FileCoverageData} from './types.flow';

type LLVMSegment = [
  number, // line (1-based)
  number, // column (1-based)
  number, // execution count
  boolean, // hasCount
  boolean, // isRegionEntry
  boolean, // isGapRegion
];

// LLVM-cov branch format: [startLine, startCol, endLine, endCol, trueCount, falseCount, ?, ?, branchType]
type LLVMBranch = [
  number, // startLine
  number, // startCol
  number, // endLine
  number, // endCol
  number, // trueCount (executions when true)
  number, // falseCount (executions when false)
  number, // unused
  number, // unused
  number, // branchType
];

// LLVM-cov region format: [startLine, startCol, endLine, endCol, count, ?, ?, regionType]
type LLVMRegion = [
  number, // startLine
  number, // startCol
  number, // endLine
  number, // endCol
  number, // execution count
  number, // fileId
  number, // expandedFileId
  number, // regionType (0=Code, 1=Expansion, 2=Skipped, 3=Gap, 4=Branch)
];

// LLVM-cov expansion format: represents macro/inline expansions
type LLVMExpansion = {
  branches: Array<LLVMBranch>,
  filenames: Array<string>,
  source_region: LLVMRegion,
  target_regions: Array<LLVMRegion>,
};

type LLVMSummaryEntry = {
  count: number,
  covered: number,
  percent: number,
  notcovered?: number,
};

type LLVMSummary = {
  branches: LLVMSummaryEntry,
  functions: LLVMSummaryEntry,
  lines: LLVMSummaryEntry,
  regions: LLVMSummaryEntry,
  instantiations?: LLVMSummaryEntry,
};

export type LLVMFileData = {
  branches: Array<LLVMBranch>,
  expansions: Array<LLVMExpansion>,
  filename: string,
  segments: Array<LLVMSegment>,
  summary: LLVMSummary,
};

export type LLVMFunctionData = {
  branches: Array<LLVMBranch>,
  count: number,
  filenames: Array<string>,
  name: string,
  regions: Array<LLVMRegion>,
};

// LLVM region types
const REGION_TYPE_CODE = 0;

// A segment is a "start of region" if it has a count, is a region entry,
// and is not a gap region. This matches LLVM's isStartOfRegion() function.
function isStartOfRegion(segment: LLVMSegment): boolean {
  const [, , , hasCount, isRegionEntry, isGapRegion] = segment;
  return hasCount && isRegionEntry && !isGapRegion;
}

export default function convertLLVMCoverage(
  file: LLVMFileData,
  functions: Array<LLVMFunctionData>,
): FileCoverageData {
  const coverageData: FileCoverageData = {
    path: file.filename,
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {},
  };

  // Phase 1: Line coverage from segments
  // LLVM segments describe a state machine where each segment marks a point
  // where the coverage count changes. We walk through lines and track a
  // "wrapped segment" (the last segment from a previous line) to determine
  // which lines are instrumented and their execution counts.
  const segmentsByLine: Map<number, Array<LLVMSegment>> = new Map();
  let maxLine = 0;

  for (const segment of file.segments) {
    const line = segment[0];
    let lineSegs = segmentsByLine.get(line);
    if (lineSegs == null) {
      lineSegs = [];
      segmentsByLine.set(line, lineSegs);
    }
    lineSegs.push(segment);
    maxLine = Math.max(maxLine, line);
  }

  let wrappedSegment: LLVMSegment | null = null;
  let statementIndex = 0;

  for (let line = 1; line <= maxLine; line++) {
    const lineSegs = segmentsByLine.get(line);

    let mapped = false;
    let count = 0;

    if (lineSegs != null) {
      // Check for region starts on this line
      for (const seg of lineSegs) {
        if (isStartOfRegion(seg)) {
          mapped = true;
          count = Math.max(count, seg[2]);
        }
      }

      if (mapped) {
        // When a line has region starts AND a valid wrapped segment,
        // include the wrapped segment's count in the max. The wrapped
        // segment represents the enclosing scope, which may have a higher
        // execution count than the inner region starts (e.g. an else-if
        // branch with count=0 inside a function with count=1).
        if (wrappedSegment != null && wrappedSegment[3] === true) {
          count = Math.max(count, wrappedSegment[2]);
        }
      } else {
        // No region starts on this line. Check the wrapped segment.
        // A segment with isRegionEntry=true but hasCount=false (e.g. an
        // expansion or skipped region entry) blocks the wrapped segment
        // from covering this line.
        const hasUnmappedRegionEntry = lineSegs.some(
          s => s[4] === true && s[3] === false,
        );

        if (
          !hasUnmappedRegionEntry &&
          wrappedSegment != null &&
          wrappedSegment[3] === true
        ) {
          mapped = true;
          count = wrappedSegment[2];
        }
      }

      // Update wrapped segment to the last segment on this line
      wrappedSegment = lineSegs[lineSegs.length - 1];
    } else {
      // No segments on this line — use the wrapped segment if it has a count.
      if (wrappedSegment != null && wrappedSegment[3] === true) {
        mapped = true;
        count = wrappedSegment[2];
      }
    }

    if (mapped) {
      const key = String(statementIndex);
      coverageData.statementMap[key] = {
        start: {line, column: 0},
        end: {line, column: 0},
      };
      coverageData.s[key] = count;
      statementIndex++;
    }
  }

  // Phase 2: Function coverage
  // We use file.summary.functions.count for the total number of unique functions.
  // The 'functions' array may contain multiple instantiations of template functions,
  // but we only report unique function names to match LLVM's summary.
  const totalFunctions = file.summary?.functions?.count ?? 0;

  const seenFunctionNames: Set<string> = new Set();
  let functionIndex = 0;

  for (const func of functions) {
    if (functionIndex >= totalFunctions) {
      break;
    }

    // Skip duplicate function names (different instantiations of same function)
    if (seenFunctionNames.has(func.name)) {
      continue;
    }

    // Find the first code region for this function
    const codeRegion = func.regions.find(r => r[7] === REGION_TYPE_CODE);
    if (codeRegion == null) {
      continue;
    }

    seenFunctionNames.add(func.name);

    const [startLine, startCol, endLine, endCol] = codeRegion;
    const key = String(functionIndex);

    coverageData.fnMap[key] = {
      name: func.name,
      decl: {
        start: {line: startLine, column: startCol},
        end: {line: endLine, column: endCol},
      },
      loc: {
        start: {line: startLine, column: startCol},
        end: {line: endLine, column: endCol},
      },
      line: startLine,
    };

    // Use the actual execution count from LLVM
    coverageData.f[key] = func.count;
    functionIndex++;
  }

  // Populate branch map from file branches
  // CRITICAL: Only process branches if LLVM's summary says there are branches.
  // Template instantiation branches appear in the branches array but are not
  // counted in the file's branch summary. We must match LLVM's summary count.
  const summaryBranchCount = file.summary?.branches?.count ?? 0;
  if (summaryBranchCount === 0) {
    // No branches according to LLVM summary - return early with custom coverage
    return coverageData;
  }

  // LLVM BRDA format uses cumulative case indices across all branches on the same line.
  // For example, if line 39 has 2 branches:
  //   Branch 0: cases 0,1
  //   Branch 1: cases 2,3 (cumulative from previous branch)
  //
  // LLVM also uses "-" for branches where both true and false counts are 0 (not executed).
  // We represent this with null in the array, which Istanbul will convert to "-".
  //
  // To achieve this, we group branches by line and use a single branchMap entry per line
  // with all cases accumulated.

  // Group branches by line
  const branchesByLine: Map<
    number,
    Array<{
      startCol: number,
      endCol: number,
      trueCount: number,
      falseCount: number,
    }>,
  > = new Map();

  for (const branch of file.branches) {
    const [startLine, startCol, , endCol, trueCount, falseCount] = branch;
    let lineBranches = branchesByLine.get(startLine);
    if (lineBranches == null) {
      lineBranches = [];
      branchesByLine.set(startLine, lineBranches);
    }
    lineBranches.push({startCol, endCol, trueCount, falseCount});
  }

  // Sort lines and create branch entries with cumulative case indices
  const sortedBranchLines = [...branchesByLine.keys()].sort((a, b) => a - b);
  let branchIndex = 0;

  for (const line of sortedBranchLines) {
    const lineBranches = branchesByLine.get(line);
    if (lineBranches == null) {
      continue;
    }

    // Sort branches on same line by column
    lineBranches.sort((a, b) => a.startCol - b.startCol);

    // Each branch on this line gets its own branchMap entry with key = branchIndex
    // But case indices are cumulative across all branches on the line
    for (const branchData of lineBranches) {
      const key = String(branchIndex);
      const loc = {
        start: {line, column: branchData.startCol},
        end: {line, column: branchData.endCol},
      };

      // Generate locations with cumulative case indices
      // Each branch has 2 cases: true (cumulativeCaseIndex) and false (cumulativeCaseIndex + 1)
      const locations = [];
      for (let i = 0; i < 2; i++) {
        locations.push({
          start: {line, column: branchData.startCol},
          end: {line, column: branchData.endCol},
        });
      }

      coverageData.branchMap[key] = {
        type: 'branch',
        line,
        loc,
        locations,
      };

      // For branches where both counts are 0, LLVM outputs "-" (unknown/not executed)
      // We use "-" string to represent this in the LCOV output
      const trueVal =
        branchData.trueCount === 0 && branchData.falseCount === 0
          ? '-'
          : branchData.trueCount;
      const falseVal =
        branchData.trueCount === 0 && branchData.falseCount === 0
          ? '-'
          : branchData.falseCount;

      coverageData.b[key] = [trueVal, falseVal];

      branchIndex++;
    }
  }

  return coverageData;
}
