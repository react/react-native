/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Task} from '@react-native/core-cli-utils';
import type {Result} from 'execa';
import type {ExecaPromise} from 'execa';
import type {TaskResult, TaskSpec} from 'listr2';

import {Listr} from 'listr2';
import {Observable} from 'rxjs';
import {styleText} from 'util';

export function trim(
  line: string,
  // $FlowFixMe[prop-missing]
  maxLength: number = Math.min(process.stdout?.columns, 120),
): string {
  if (process.stdout.isTTY == null) {
    return line;
  }
  const flattened = line.replaceAll('\n', ' ').trim();
  return flattened.length >= maxLength
    ? flattened.slice(0, maxLength - 3) + '...'
    : flattened.trim();
}

type ExecaPromiseMetaized = Promise<Result> & child_process$ChildProcess;

export function observe(result: ExecaPromiseMetaized): TaskResult<{}, string> {
  const obs = new Observable<string>(observer => {
    result.stderr.on('data', (data: Buffer) =>
      data
        .toString('utf8')
        .split('\n')
        .filter(line => line.length > 0)
        .forEach(line => observer.next('🟢 ' + trim(line))),
    );
    result.stdout.on('data', (data: Buffer) =>
      data
        .toString('utf8')
        .split('\n')
        .filter(line => line.length > 0)
        .forEach(line => observer.next('🟠 ' + trim(line))),
    );

    // Terminal events
    result.stdout.on('error', error => observer.error(error.trim()));
    result.then(
      (_: Result) => observer.complete(),
      cause =>
        observer.error(
          new Error(`${styleText(['red', 'bold'], cause.shortMessage)}`, {
            cause,
          }),
        ),
    );

    return () => {
      for (const out of [result.stderr, result.stdout]) {
        out.destroy();
        out.removeAllListeners();
      }
    };
  });

  return obs;
}

type MixedTasks = Task<ExecaPromise> | Task<void>;
type Tasks = {
  readonly [label: string]: MixedTasks,
};

export function run(
  tasks: Tasks,
  exclude: {[label: string]: boolean} = {},
): Promise<void> {
  let ordered: MixedTasks[] = [];
  for (const [label, task] of Object.entries(tasks)) {
    if (label in exclude) {
      continue;
    }
    ordered.push(task);
  }
  ordered = ordered.sort((a, b) => a.order - b.order);

  const spec: TaskSpec<void>[] = ordered.map(task => ({
    title: task.label,
    task: () => {
      const action = task.action();
      if (action != null) {
        return observe(action);
      }
    },
  }));
  return new Listr(spec).run();
}
