/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow
 * @format
 */

declare module 'listr' {
  declare export type TaskResult<
    ContextT = {__proto__: null},
    ReturnT = unknown,
  > =
    | ReturnT
    | Promise<ReturnT>
    | rxjs$Observable<ReturnT>
    | stream$Readable
    | Listr<ContextT>;

  declare type TaskFn<ContextT, ReturnT> = (
    ctx: ContextT,
    task: TaskInstance,
  ) => TaskResult<ContextT, ReturnT>;

  declare type SkipResultSync = boolean | string;
  declare type SkipResult = SkipResultSync | Promise<SkipResultSync>;
  declare type SkipFn<ContextT> = (ctx: ContextT) => SkipResult;

  declare type CustomRenderer = {...}; // TODO

  declare interface TaskInstance {
    title: string;
    output: string;
    skip(reason?: string): void;
  }

  declare export type TaskSpec<
    ContextT = {__proto__: null},
    ReturnT = unknown,
  > = {
    title: string,
    task: TaskFn<ContextT, ReturnT>,
    skip?: SkipFn<ContextT>,
  };

  declare export type Options = {
    concurrent?: boolean | number,
    exitOnError?: boolean,
    renderer?: 'default' | 'verbose' | 'silent' | CustomRenderer,
    nonTTYRenderer?: 'default' | 'verbose' | 'silent' | CustomRenderer,
  };

  declare export default class Listr<ContextT> {
    constructor<ReturnT>(
      tasks: Array<TaskSpec<ContextT, ReturnT>>,
      options?: Options,
    ): void;
    add<ReturnT>(task: TaskSpec<ContextT, ReturnT>): this;
    add<ReturnT>(tasks: ReadonlyArray<TaskSpec<ContextT, ReturnT>>): this;
    run(ctx?: ContextT): Promise<ContextT>;
  }
}
