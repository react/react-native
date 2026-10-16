/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {extractIssueOncalls} = require('../extractIssueOncalls');

const userMap = {
  '@g': '1785',
  '@c': '1781',
  '@s': '1272',
  '@d': '1332',
  '@m': '9555',
  '@p': '6097',
  '@f': '7565',
};

const schedule = {
  '2025-04-01': ['@m', '@f'],
  '2025-04-08': ['@g', '@d'],
};

describe('extractIssueOncalls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers('modern');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });
  it('extracts m and f on 6 of April', () => {
    jest.setSystemTime(new Date(2025, 3, 6));
    const oncalls = extractIssueOncalls(schedule, userMap);
    expect(oncalls).toEqual([userMap['@m'], userMap['@f']]);
  });

  it('extracts m and f on 7 of April', () => {
    jest.setSystemTime(new Date(2025, 3, 7));
    const oncalls = extractIssueOncalls(schedule, userMap);
    expect(oncalls).toEqual([userMap['@m'], userMap['@f']]);
  });

  it('extracts g and d on 8 of April', () => {
    jest.setSystemTime(new Date(2025, 3, 8));
    const oncalls = extractIssueOncalls(schedule, userMap);
    expect(oncalls).toEqual([userMap['@g'], userMap['@d']]);
  });

  it('extracts g and d on 9 of April', () => {
    jest.setSystemTime(new Date(2025, 3, 9));
    const oncalls = extractIssueOncalls(schedule, userMap);
    expect(oncalls).toEqual([userMap['@g'], userMap['@d']]);
  });

  it('extracts g and d on 10 of April', () => {
    jest.setSystemTime(new Date(2025, 3, 10));
    const oncalls = extractIssueOncalls(schedule, userMap);
    expect(oncalls).toEqual([userMap['@g'], userMap['@d']]);
  });

  it('extracts g and d on 11 of April', () => {
    jest.setSystemTime(new Date(2025, 3, 11));
    const oncalls = extractIssueOncalls(schedule, userMap);
    expect(oncalls).toEqual([userMap['@g'], userMap['@d']]);
  });

  it('extracts g and d on 12 of April', () => {
    jest.setSystemTime(new Date(2025, 3, 12));
    const oncalls = extractIssueOncalls(schedule, userMap);
    expect(oncalls).toEqual([userMap['@g'], userMap['@d']]);
  });

  it('extracts g and d on 13 of April', () => {
    jest.setSystemTime(new Date(2025, 3, 13));
    const oncalls = extractIssueOncalls(schedule, userMap);
    expect(oncalls).toEqual([userMap['@g'], userMap['@d']]);
  });

  it('continues the latest rotation after the schedule ends', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.setSystemTime(new Date(2025, 3, 15));

    const oncalls = extractIssueOncalls(schedule, userMap);

    expect(oncalls).toEqual([userMap['@g'], userMap['@d']]);
    expect(warn).toHaveBeenCalledWith(
      'No issue oncall schedule found for 2025-04-15; continuing the rotation from 2025-04-08',
    );
  });
});
