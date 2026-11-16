/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('yaml');

const WORKFLOWS_DIR = path.join(__dirname, '..', '..', 'workflows');

const workflows = fs
  .readdirSync(WORKFLOWS_DIR)
  .filter(file => /\.ya?ml$/.test(file))
  .map(file => ({
    file,
    workflow: yaml.parse(
      fs.readFileSync(path.join(WORKFLOWS_DIR, file), 'utf8'),
    ),
  }));

const workflowNames = workflows.map(
  ({file, workflow}) => workflow.name ?? `.github/workflows/${file}`,
);

const triggers = workflows.flatMap(({file, workflow}) =>
  (workflow.on?.workflow_run?.workflows ?? []).map(name => [file, name]),
);

describe('workflow_run triggers', () => {
  test.each(triggers)(
    '%s names an existing workflow, %p, without glob characters',
    (file, name) => {
      expect(name).not.toMatch(/[*?+![\]]/);
      expect(workflowNames).toContain(name);
    },
  );
});
