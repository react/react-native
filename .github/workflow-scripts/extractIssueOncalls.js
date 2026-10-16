/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require('fs');

const MSEC_IN_DAY = 1000 * 60 * 60 * 24;

function formatUsers(users) {
  console.log(`${users[0]} ${users[1]}`.trim());
}

function extractUsersFromScheduleAndDate(schedule, userMap, date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0 is January, 1 is February
  const day = date.getDate();
  const dateStr = `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
  const scheduledDate = Object.keys(schedule)
    .filter(candidateDate => candidateDate <= dateStr)
    .sort()
    .at(-1);

  if (scheduledDate == null) {
    throw new Error(`No issue oncall schedule found on or before ${dateStr}`);
  }

  if (scheduledDate !== dateStr) {
    console.warn(
      `No issue oncall schedule found for ${dateStr}; continuing the rotation from ${scheduledDate}`,
    );
  }

  const user1 = userMap[schedule[scheduledDate][0]];
  const user2 = userMap[schedule[scheduledDate][1]];
  return [user1, user2];
}

/**
 * You can invoke this script by doing:
 * ```
 * node .github/workflow-scripts/extractIssueOncalls.js $DATA
 * ```
 *
 * the $DATA is stored in the github secrets as ONCALL_SCHEDULE variable.
 * The format of the data is:
 * ```
 * {
 *   \"userMap\": {
 *     \"discord_handle1\": \"discord_id1\",
 *     \"discord_handle2\": \"discord_id2\",
 *    ...
 *  },
 *  \"schedule\": {
 *    \"2025-07-29\": [\"discord_handle1\", \"discord_handle2\"],
 *    \"2025-08-05\": [\"discord_handle3\", \"discord_handle4\"],
 *   ...
 * }
 * ```
 *
 * Each dated entry stays active until a newer entry takes effect.
 *
 * When uploading the secret, make sure that the JSON strings are escaped!
 * The script will fail otherwise, because GitHub will remove the `"` characters.
 */
function main() {
  const configuration = process.argv[2];
  const {userMap, schedule} = JSON.parse(configuration);
  extractIssueOncalls(schedule, userMap);
}

function extractIssueOncalls(schedule, userMap) {
  const now = new Date();
  const dayOfTheWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
  let users;
  if (dayOfTheWeek === 2) {
    // exact match in the schedule
    users = extractUsersFromScheduleAndDate(schedule, userMap, now);
  } else if (dayOfTheWeek < 2) {
    // sunday
    // go to the tuesday of the last week
    const lastWeekTuesday = new Date(now - (5 + dayOfTheWeek) * MSEC_IN_DAY);
    users = extractUsersFromScheduleAndDate(schedule, userMap, lastWeekTuesday);
  } else if (dayOfTheWeek > 1) {
    // go to the previous tuesday
    const thisWeekTuesday = new Date(now - (dayOfTheWeek - 2) * MSEC_IN_DAY);
    users = extractUsersFromScheduleAndDate(schedule, userMap, thisWeekTuesday);
  }
  formatUsers(users);
  return users;
}

if (require.main === module) {
  void main();
}

module.exports = {
  extractIssueOncalls,
};
