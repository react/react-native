/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict
 * @format
 */

/** OPERATOR INTERFACES */
declare interface rxjs$UnaryFunction<T, R> {
  (source: T): R;
}
declare interface rxjs$OperatorFunction<T, R>
  extends rxjs$UnaryFunction<rxjs$Observable<T>, rxjs$Observable<R>> {}
declare type rxjs$FactoryOrValue<T> = T | (() => T);
declare interface rxjs$MonoTypeOperatorFunction<T>
  extends rxjs$OperatorFunction<T, T> {}
declare interface rxjs$Timestamp<T> {
  value: T;
  timestamp: number;
}
declare interface rxjs$TimeInterval<T> {
  value: T;
  interval: number;
}
/** SUBSCRIPTION INTERFACES */
declare interface rxjs$Unsubscribable {
  unsubscribe(): void;
}
declare type rxjs$TeardownLogic = rxjs$Unsubscribable | Function | void;
declare interface rxjs$SubscriptionLike extends rxjs$Unsubscribable {
  unsubscribe(): void;
  +closed: boolean;
}
declare type rxjs$SubscribableOrPromise<T> =
  | rxjs$Subscribable<T>
  | rxjs$Subscribable<empty>
  | Promise<T>
  | rxjs$InteropObservable<T>;

/** OBSERVABLE INTERFACES */
declare interface rxjs$Subscribable<T> {
  subscribe(observer?: rxjs$PartialObserver<T>): rxjs$Unsubscribable;
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void,
  ): rxjs$Unsubscribable;
}
declare type rxjs$ObservableInput<T> =
  | rxjs$SubscribableOrPromise<T>
  | Array<T>
  | Iterable<T>;

declare type rxjs$InteropObservable<T> = {
  [string | unknown]: () => rxjs$Subscribable<T>,
  ...
};
/** OBSERVER INTERFACES */
declare interface rxjs$NextObserver<T> {
  closed?: boolean;
  +next: (value: T) => void;
  +error?: (err: any) => void;
  +complete?: () => void;
}
declare interface rxjs$ErrorObserver<T> {
  closed?: boolean;
  +next?: (value: T) => void;
  +error: (err: any) => void;
  +complete?: () => void;
}
declare interface rxjs$CompletionObserver<T> {
  closed?: boolean;
  +next?: (value: T) => void;
  +error?: (err: any) => void;
  +complete: () => void;
}
declare interface rxjs$PartialObserver<T> {
  closed?: boolean;
  +next?: (value: T) => void;
  +error?: (err: any) => void;
  +complete?: () => void;
}
declare interface rxjs$Observer<T> {
  closed?: boolean;
  next(value: T): void;
  error(err: any): void;
  complete(): void;
}
/** SCHEDULER INTERFACES */
declare interface rxjs$SchedulerLike {
  now(): number;
  schedule<T>(
    work: (state?: T) => void,
    delay?: number,
    state?: T,
  ): rxjs$Subscription;
}
declare interface rxjs$SchedulerAction<T> extends rxjs$Subscription {
  schedule(state?: T, delay?: number): rxjs$Subscription;
}

declare interface rxjs$EventListenerOptions {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
}

declare class rxjs$Observable<T> implements rxjs$Subscribable<T> {
  // @internal
  _isScalar: boolean;
  // @deprecated  This is an internal implementation detail, do not use.
  source: rxjs$Observable<any>;
  // @deprecated  This is an internal implementation detail, do not use.
  operator: rxjs$Operator<any, T>;
  constructor(
    subscribe?: (subscriber: rxjs$Subscriber<T>) => rxjs$TeardownLogic,
  ): void;
  static create(
    subscribe?: (subscriber: rxjs$Subscriber<T>) => rxjs$TeardownLogic,
  ): rxjs$Observable<T>;
  lift<R>(operator: rxjs$Operator<T, R>): rxjs$Observable<R>;
  subscribe(observer?: rxjs$PartialObserver<T>): rxjs$Subscription;
  subscribe(
    next?: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void,
  ): rxjs$Subscription;
  // @deprecated  This is an internal implementation detail, do not use.
  _trySubscribe(sink: rxjs$Subscriber<T>): rxjs$TeardownLogic;
  forEach(
    next: (value: T) => void,
    promiseCtor?: typeof Promise.constructor,
  ): Promise<void>;
  // @internal  This is an internal implementation detail, do not use.
  _subscribe(subscriber: rxjs$Subscriber<any>): rxjs$TeardownLogic;
  // @deprecated  In favor of iif creation function: import { iif } from 'rxjs';
  static if: typeof rxjs$iif;
  // @deprecated  In favor of throwError creation function: import { throwError } from 'rxjs';
  static throw: typeof rxjs$throwError;
  pipe(): rxjs$Observable<T>;
  pipe<A>(op1: rxjs$OperatorFunction<T, A>): rxjs$Observable<A>;
  pipe<A, B>(
    op1: rxjs$OperatorFunction<T, A>,
    op2: rxjs$OperatorFunction<A, B>,
  ): rxjs$Observable<B>;
  pipe<A, B, C>(
    op1: rxjs$OperatorFunction<T, A>,
    op2: rxjs$OperatorFunction<A, B>,
    op3: rxjs$OperatorFunction<B, C>,
  ): rxjs$Observable<C>;
  pipe<A, B, C, D>(
    op1: rxjs$OperatorFunction<T, A>,
    op2: rxjs$OperatorFunction<A, B>,
    op3: rxjs$OperatorFunction<B, C>,
    op4: rxjs$OperatorFunction<C, D>,
  ): rxjs$Observable<D>;
  pipe<A, B, C, D, E>(
    op1: rxjs$OperatorFunction<T, A>,
    op2: rxjs$OperatorFunction<A, B>,
    op3: rxjs$OperatorFunction<B, C>,
    op4: rxjs$OperatorFunction<C, D>,
    op5: rxjs$OperatorFunction<D, E>,
  ): rxjs$Observable<E>;
  pipe<A, B, C, D, E, F>(
    op1: rxjs$OperatorFunction<T, A>,
    op2: rxjs$OperatorFunction<A, B>,
    op3: rxjs$OperatorFunction<B, C>,
    op4: rxjs$OperatorFunction<C, D>,
    op5: rxjs$OperatorFunction<D, E>,
    op6: rxjs$OperatorFunction<E, F>,
  ): rxjs$Observable<F>;
  pipe<A, B, C, D, E, F, G>(
    op1: rxjs$OperatorFunction<T, A>,
    op2: rxjs$OperatorFunction<A, B>,
    op3: rxjs$OperatorFunction<B, C>,
    op4: rxjs$OperatorFunction<C, D>,
    op5: rxjs$OperatorFunction<D, E>,
    op6: rxjs$OperatorFunction<E, F>,
    op7: rxjs$OperatorFunction<F, G>,
  ): rxjs$Observable<G>;
  pipe<A, B, C, D, E, F, G, H>(
    op1: rxjs$OperatorFunction<T, A>,
    op2: rxjs$OperatorFunction<A, B>,
    op3: rxjs$OperatorFunction<B, C>,
    op4: rxjs$OperatorFunction<C, D>,
    op5: rxjs$OperatorFunction<D, E>,
    op6: rxjs$OperatorFunction<E, F>,
    op7: rxjs$OperatorFunction<F, G>,
    op8: rxjs$OperatorFunction<G, H>,
  ): rxjs$Observable<H>;
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: rxjs$OperatorFunction<T, A>,
    op2: rxjs$OperatorFunction<A, B>,
    op3: rxjs$OperatorFunction<B, C>,
    op4: rxjs$OperatorFunction<C, D>,
    op5: rxjs$OperatorFunction<D, E>,
    op6: rxjs$OperatorFunction<E, F>,
    op7: rxjs$OperatorFunction<F, G>,
    op8: rxjs$OperatorFunction<G, H>,
    op9: rxjs$OperatorFunction<H, I>,
  ): rxjs$Observable<I>;
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: rxjs$OperatorFunction<T, A>,
    op2: rxjs$OperatorFunction<A, B>,
    op3: rxjs$OperatorFunction<B, C>,
    op4: rxjs$OperatorFunction<C, D>,
    op5: rxjs$OperatorFunction<D, E>,
    op6: rxjs$OperatorFunction<E, F>,
    op7: rxjs$OperatorFunction<F, G>,
    op8: rxjs$OperatorFunction<G, H>,
    op9: rxjs$OperatorFunction<H, I>,
    ...operations: rxjs$OperatorFunction<any, any>[]
  ): rxjs$Observable<{...}>;
  toPromise(): Promise<T>;
  toPromise(PromiseCtor: typeof Promise): Promise<T>;
  toPromise(PromiseCtor: typeof Promise.constructor): Promise<T>;
}

declare class rxjs$Subscription implements rxjs$SubscriptionLike {
  static EMPTY: rxjs$Subscription;
  closed: boolean;
  // @internal
  _parent: rxjs$Subscription;
  // @internal
  _parents: rxjs$Subscription[];
  constructor(unsubscribe?: () => void): void;
  unsubscribe(): void;
  add(teardown: rxjs$TeardownLogic): rxjs$Subscription;
  remove(subscription: rxjs$Subscription): void;
}

declare interface rxjs$Operator<T, R> {
  call(subscriber: rxjs$Subscriber<R>, source: any): rxjs$TeardownLogic;
}

// $FlowFixMe[incompatible-type]
declare class rxjs$Subscriber<T>
  extends rxjs$Subscription
  implements rxjs$Observer<T>
{
  static create<U>(
    next?: (x?: U) => void,
    error?: (e?: any) => void,
    complete?: () => void,
  ): rxjs$Subscriber<U>;
  // @internal
  syncErrorValue: any;
  // @internal
  syncErrorThrown: boolean;
  // @internal
  syncErrorThrowable: boolean;
  isStopped: boolean;
  destination: rxjs$PartialObserver<any> | rxjs$Subscriber<any>;
  constructor(
    destinationOrNext?: rxjs$PartialObserver<any> | ((value: T) => void),
    error?: (e?: any) => void,
    complete?: () => void,
  ): void;
  next(value?: T): void;
  error(err?: any): void;
  complete(): void;
  unsubscribe(): void;
  _next(value: T): void;
  _error(err: any): void;
  _complete(): void;
  // @deprecated  This is an internal implementation detail, do not use.
  _unsubscribeAndRecycle(): rxjs$Subscriber<T>;
}

declare class rxjs$ConnectableObservable<T> extends rxjs$Observable<T> {
  source: rxjs$Observable<T>;
  subjectFactory: () => rxjs$Subject<T>;
  _subject: rxjs$Subject<T>;
  _refCount: number;
  _connection: rxjs$Subscription;
  // @internal
  _isComplete: boolean;
  constructor(
    source: rxjs$Observable<T>,
    subjectFactory: () => rxjs$Subject<T>,
  ): void;
  // @deprecated  This is an internal implementation detail, do not use.
  _subscribe(subscriber: rxjs$Subscriber<T>): rxjs$Subscription;
  getSubject(): rxjs$Subject<T>;
  connect(): rxjs$Subscription;
  refCount(): rxjs$Observable<T>;
}

declare class rxjs$Subject<T>
  extends rxjs$Observable<T>
  implements rxjs$SubscriptionLike
{
  observers: rxjs$Observer<T>[];
  closed: boolean;
  isStopped: boolean;
  hasError: boolean;
  thrownError: any;
  constructor(): void;
  static create: Function;
  lift<R>(operator: rxjs$Operator<T, R>): rxjs$Observable<R>;
  next(value?: T): void;
  error(err: any): void;
  complete(): void;
  unsubscribe(): void;
  // @deprecated  This is an internal implementation detail, do not use.
  _trySubscribe(subscriber: rxjs$Subscriber<T>): rxjs$TeardownLogic;
  // @deprecated  This is an internal implementation detail, do not use.
  _subscribe(subscriber: rxjs$Subscriber<T>): rxjs$Subscription;
  asObservable(): rxjs$Observable<T>;
}

declare class rxjs$Notification<T> {
  kind: string;
  value: T;
  error: any;
  hasValue: boolean;
  constructor(kind: string, value?: T, error?: any): void;
  observe(observer: rxjs$PartialObserver<T>): any;
  do(
    next: (value: T) => void,
    error?: (err: any) => void,
    complete?: () => void,
  ): any;
  accept(
    nextOrObserver: rxjs$PartialObserver<T> | ((value: T) => void),
    error?: (err: any) => void,
    complete?: () => void,
  ): any;
  toObservable(): rxjs$Observable<T>;
  static createNext<U>(value: U): rxjs$Notification<U>;
  static createError<U>(err?: any): rxjs$Notification<U>;
  static createComplete(): rxjs$Notification<any>;
}

declare class rxjs$GroupedObservable<K, T> extends rxjs$Observable<T> {
  key: K;
  // @deprecated  Do not construct this type. Internal use only
  constructor(
    key: K,
    groupSubject: rxjs$Subject<T>,
    refCountSubscription?: rxjs$RefCountSubscription,
  ): void;
  // @deprecated  This is an internal implementation detail, do not use.
  _subscribe(subscriber: rxjs$Subscriber<T>): rxjs$Subscription;
}

declare interface rxjs$RefCountSubscription {
  count: number;
  unsubscribe: () => void;
  closed: boolean;
  attemptedToUnsubscribe: boolean;
}

declare function rxjs$throwError(
  error: any,
  scheduler?: rxjs$SchedulerLike,
): rxjs$Observable<any>;

declare function rxjs$iif<T, F>(
  condition: () => boolean,
  trueResult?: rxjs$SubscribableOrPromise<T>,
  falseResult?: rxjs$SubscribableOrPromise<F>,
): rxjs$Observable<T | F>;

declare module 'rxjs' {
  declare module.exports: {
    Observable: typeof rxjs$Observable,
    Subscriber: typeof rxjs$Subscriber,
    Subscription: typeof rxjs$Subscription,
    throwError: typeof rxjs$throwError,
    iif: typeof rxjs$iif,
    ConnectableObservable: typeof rxjs$ConnectableObservable,
    GroupedObservable: typeof rxjs$GroupedObservable,
    observable: string | unknown,
    Subject: typeof rxjs$Subject,
    BehaviorSubject: typeof BehaviorSubject,
    ReplaySubject: typeof ReplaySubject,
    AsyncSubject: typeof AsyncSubject,
    asapScheduler: AsapScheduler,
    asyncScheduler: AsyncScheduler,
    queueScheduler: QueueScheduler,
    animationFrameScheduler: AnimationFrameScheduler,
    VirtualTimeScheduler: typeof VirtualTimeScheduler,
    VirtualAction: typeof VirtualAction,
    Scheduler: typeof Scheduler,
    Notification: typeof rxjs$Notification,
    pipe: (<T>() => rxjs$UnaryFunction<T, T>) &
      (<T, A>(fn1: rxjs$UnaryFunction<T, A>) => rxjs$UnaryFunction<T, A>) &
      (<T, A, B>(
        fn1: rxjs$UnaryFunction<T, A>,
        fn2: rxjs$UnaryFunction<A, B>,
      ) => rxjs$UnaryFunction<T, B>) &
      (<T, A, B, C>(
        fn1: rxjs$UnaryFunction<T, A>,
        fn2: rxjs$UnaryFunction<A, B>,
        fn3: rxjs$UnaryFunction<B, C>,
      ) => rxjs$UnaryFunction<T, C>) &
      (<T, A, B, C, D>(
        fn1: rxjs$UnaryFunction<T, A>,
        fn2: rxjs$UnaryFunction<A, B>,
        fn3: rxjs$UnaryFunction<B, C>,
        fn4: rxjs$UnaryFunction<C, D>,
      ) => rxjs$UnaryFunction<T, D>) &
      (<T, A, B, C, D, E>(
        fn1: rxjs$UnaryFunction<T, A>,
        fn2: rxjs$UnaryFunction<A, B>,
        fn3: rxjs$UnaryFunction<B, C>,
        fn4: rxjs$UnaryFunction<C, D>,
        fn5: rxjs$UnaryFunction<D, E>,
      ) => rxjs$UnaryFunction<T, E>) &
      (<T, A, B, C, D, E, F>(
        fn1: rxjs$UnaryFunction<T, A>,
        fn2: rxjs$UnaryFunction<A, B>,
        fn3: rxjs$UnaryFunction<B, C>,
        fn4: rxjs$UnaryFunction<C, D>,
        fn5: rxjs$UnaryFunction<D, E>,
        fn6: rxjs$UnaryFunction<E, F>,
      ) => rxjs$UnaryFunction<T, F>) &
      (<T, A, B, C, D, E, F, G>(
        fn1: rxjs$UnaryFunction<T, A>,
        fn2: rxjs$UnaryFunction<A, B>,
        fn3: rxjs$UnaryFunction<B, C>,
        fn4: rxjs$UnaryFunction<C, D>,
        fn5: rxjs$UnaryFunction<D, E>,
        fn6: rxjs$UnaryFunction<E, F>,
        fn7: rxjs$UnaryFunction<F, G>,
      ) => rxjs$UnaryFunction<T, G>) &
      (<T, A, B, C, D, E, F, G, H>(
        fn1: rxjs$UnaryFunction<T, A>,
        fn2: rxjs$UnaryFunction<A, B>,
        fn3: rxjs$UnaryFunction<B, C>,
        fn4: rxjs$UnaryFunction<C, D>,
        fn5: rxjs$UnaryFunction<D, E>,
        fn6: rxjs$UnaryFunction<E, F>,
        fn7: rxjs$UnaryFunction<F, G>,
        fn8: rxjs$UnaryFunction<G, H>,
      ) => rxjs$UnaryFunction<T, H>) &
      (<T, A, B, C, D, E, F, G, H, I>(
        fn1: rxjs$UnaryFunction<T, A>,
        fn2: rxjs$UnaryFunction<A, B>,
        fn3: rxjs$UnaryFunction<B, C>,
        fn4: rxjs$UnaryFunction<C, D>,
        fn5: rxjs$UnaryFunction<D, E>,
        fn6: rxjs$UnaryFunction<E, F>,
        fn7: rxjs$UnaryFunction<F, G>,
        fn8: rxjs$UnaryFunction<G, H>,
        fn9: rxjs$UnaryFunction<H, I>,
      ) => rxjs$UnaryFunction<T, I>) &
      (<T, A, B, C, D, E, F, G, H, I>(
        fn1: rxjs$UnaryFunction<T, A>,
        fn2: rxjs$UnaryFunction<A, B>,
        fn3: rxjs$UnaryFunction<B, C>,
        fn4: rxjs$UnaryFunction<C, D>,
        fn5: rxjs$UnaryFunction<D, E>,
        fn6: rxjs$UnaryFunction<E, F>,
        fn7: rxjs$UnaryFunction<F, G>,
        fn8: rxjs$UnaryFunction<G, H>,
        fn9: rxjs$UnaryFunction<H, I>,
        ...fns: rxjs$UnaryFunction<any, any>[]
      ) => rxjs$UnaryFunction<T, {...}>),
    noop(): void,
    identity<T>(x: T): T,
    isObservable<T>(obj: any): boolean,
    concat: (<T>(
      v1: rxjs$ObservableInput<T>,
      scheduler?: rxjs$SchedulerLike,
    ) => rxjs$Observable<T>) &
      (<T, T2>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2>) &
      (<T, T2, T3>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3>) &
      (<T, T2, T3, T4>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4>) &
      (<T, T2, T3, T4, T5>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4 | T5>) &
      (<T, T2, T3, T4, T5, T6>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        v6: rxjs$ObservableInput<T6>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4 | T5 | T6>) &
      (<T>(
        ...observables: (rxjs$ObservableInput<T> | rxjs$SchedulerLike)[]
      ) => rxjs$Observable<T>) &
      (<T, R>(
        ...observables: (rxjs$ObservableInput<any> | rxjs$SchedulerLike)[]
      ) => rxjs$Observable<R>),
    defer<T>(
      observableFactory: () => rxjs$SubscribableOrPromise<T> | null,
    ): rxjs$Observable<T>,
    forkJoin: (<T>(
      sources: [rxjs$ObservableInput<T>],
    ) => rxjs$Observable<T[]>) &
      (<T, T2>(
        sources: [rxjs$ObservableInput<T>, rxjs$ObservableInput<T2>],
      ) => rxjs$Observable<[T, T2]>) &
      (<T, T2, T3>(
        sources: [
          rxjs$ObservableInput<T>,
          rxjs$ObservableInput<T2>,
          rxjs$ObservableInput<T3>,
        ],
      ) => rxjs$Observable<[T, T2, T3]>) &
      (<T, T2, T3, T4>(
        sources: [
          rxjs$ObservableInput<T>,
          rxjs$ObservableInput<T2>,
          rxjs$ObservableInput<T3>,
          rxjs$ObservableInput<T4>,
        ],
      ) => rxjs$Observable<[T, T2, T3, T4]>) &
      (<T, T2, T3, T4, T5>(
        sources: [
          rxjs$ObservableInput<T>,
          rxjs$ObservableInput<T2>,
          rxjs$ObservableInput<T3>,
          rxjs$ObservableInput<T4>,
          rxjs$ObservableInput<T5>,
        ],
      ) => rxjs$Observable<[T, T2, T3, T4, T5]>) &
      (<T, T2, T3, T4, T5, T6>(
        sources: [
          rxjs$ObservableInput<T>,
          rxjs$ObservableInput<T2>,
          rxjs$ObservableInput<T3>,
          rxjs$ObservableInput<T4>,
          rxjs$ObservableInput<T5>,
          rxjs$ObservableInput<T6>,
        ],
      ) => rxjs$Observable<[T, T2, T3, T4, T5, T6]>) &
      (<T>(sources: Array<rxjs$ObservableInput<T>>) => rxjs$Observable<T[]>) &
      (<T>(v1: rxjs$ObservableInput<T>) => rxjs$Observable<T[]>) &
      (<T, T2>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
      ) => rxjs$Observable<[T, T2]>) &
      (<T, T2, T3>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
      ) => rxjs$Observable<[T, T2, T3]>) &
      (<T, T2, T3, T4>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
      ) => rxjs$Observable<[T, T2, T3, T4]>) &
      (<T, T2, T3, T4, T5>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
      ) => rxjs$Observable<[T, T2, T3, T4, T5]>) &
      (<T, T2, T3, T4, T5, T6>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        v6: rxjs$ObservableInput<T6>,
      ) => rxjs$Observable<[T, T2, T3, T4, T5, T6]>) &
      // @deprecated resultSelector is deprecated, pipe to map instead
      ((
        ...args: Array<rxjs$ObservableInput<any> | Function>
      ) => rxjs$Observable<any>) &
      (<T>(...sources: rxjs$ObservableInput<T>[]) => rxjs$Observable<T[]>),
    from<T>(
      input:
        | rxjs$ObservableInput<T>
        | rxjs$ObservableInput<rxjs$ObservableInput<T>>,
      scheduler?: rxjs$SchedulerLike,
    ): rxjs$Observable<T>,
    ArgumentOutOfRangeError: ArgumentOutOfRangeError,
    EmptyError: EmptyError,
    ObjectUnsubscribedError: ObjectUnsubscribedError,
    UnsubscriptionError: UnsubscriptionError,
    TimeoutError: TimeoutError,
    fromEvent: <T>(
      target: unknown,
      eventName: string,
      options?: rxjs$EventListenerOptions | ((...args: any[]) => T),
      // @deprecated resultSelector no longer supported, pipe to map instead
      resultSelector?: (...args: any[]) => T,
    ) => rxjs$Observable<T>,
    fromEventPattern: (<T>(
      addHandler: (handler: Function) => any,
      removeHandler?: (handler: Function, signal?: any) => void,
    ) => rxjs$Observable<T>) &
      // @deprecated resultSelector no longer supported, pipe to map instead
      (<T>(
        addHandler: (handler: Function) => any,
        removeHandler?: (handler: Function, signal?: any) => void,
        resultSelector?: (...args: any[]) => T,
      ) => rxjs$Observable<T>),
    generate<T, S>(
      initialState: S,
      condition: ConditionFunc<S>,
      iterate: IterateFunc<S>,
      resultSelector: ResultFunc<S, T>,
      scheduler?: rxjs$SchedulerLike,
    ): rxjs$Observable<T>,
    interval(
      period?: number,
      scheduler?: rxjs$SchedulerLike,
    ): rxjs$Observable<number>,
    merge: (<T>(
      ...observables: (rxjs$ObservableInput<T> | rxjs$SchedulerLike | number)[]
    ) => rxjs$Observable<T>) &
      (<T, R>(
        ...observables: (
          | rxjs$ObservableInput<any>
          | rxjs$SchedulerLike
          | number
        )[]
      ) => rxjs$Observable<R>) &
      (<T>(
        v1: rxjs$ObservableInput<T>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T>) &
      (<T>(
        v1: rxjs$ObservableInput<T>,
        concurrent?: number,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T>) &
      (<T, T2>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2>) &
      (<T, T2>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        concurrent?: number,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2>) &
      (<T, T2, T3>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3>) &
      (<T, T2, T3>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        concurrent?: number,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3>) &
      (<T, T2, T3, T4>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4>) &
      (<T, T2, T3, T4>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        concurrent?: number,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4>) &
      (<T, T2, T3, T4, T5>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4 | T5>) &
      (<T, T2, T3, T4, T5>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        concurrent?: number,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4 | T5>) &
      (<T, T2, T3, T4, T5, T6>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        v6: rxjs$ObservableInput<T6>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4 | T5 | T6>) &
      (<T, T2, T3, T4, T5, T6>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        v6: rxjs$ObservableInput<T6>,
        concurrent?: number,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4 | T5 | T6>),
    of: (<T>(a: T, scheduler?: rxjs$SchedulerLike) => rxjs$Observable<T>) &
      (<T, T2>(
        a: T,
        b: T2,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2>) &
      (<T, T2, T3>(
        a: T,
        b: T2,
        c: T3,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3>) &
      (<T, T2, T3, T4>(
        a: T,
        b: T2,
        c: T3,
        d: T4,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4>) &
      (<T, T2, T3, T4, T5>(
        a: T,
        b: T2,
        c: T3,
        d: T4,
        e: T5,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4 | T5>) &
      (<T, T2, T3, T4, T5, T6>(
        a: T,
        b: T2,
        c: T3,
        d: T4,
        e: T5,
        f: T6,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4 | T5 | T6>) &
      (<T, T2, T3, T4, T5, T6, T7>(
        a: T,
        b: T2,
        c: T3,
        d: T4,
        e: T5,
        f: T6,
        g: T7,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4 | T5 | T6 | T7>) &
      (<T, T2, T3, T4, T5, T6, T7, T8>(
        a: T,
        b: T2,
        c: T3,
        d: T4,
        e: T5,
        f: T6,
        g: T7,
        h: T8,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4 | T5 | T6 | T7 | T8>) &
      (<T, T2, T3, T4, T5, T6, T7, T8, T9>(
        a: T,
        b: T2,
        c: T3,
        d: T4,
        e: T5,
        f: T6,
        g: T7,
        h: T8,
        i: T9,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9>) &
      (<T>(...args: Array<T | rxjs$SchedulerLike>) => rxjs$Observable<T>),
    onErrorResumeNext: (<R>(v: rxjs$ObservableInput<R>) => rxjs$Observable<R>) &
      (<T2, T3, R>(
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
      ) => rxjs$Observable<R>) &
      (<T2, T3, T4, R>(
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
      ) => rxjs$Observable<R>) &
      (<T2, T3, T4, T5, R>(
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
      ) => rxjs$Observable<R>) &
      (<T2, T3, T4, T5, T6, R>(
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        v6: rxjs$ObservableInput<T6>,
      ) => rxjs$Observable<R>) &
      (<R>(
        ...observables: Array<
          rxjs$ObservableInput<any> | ((...values: Array<any>) => R),
        >
      ) => rxjs$Observable<R>) &
      (<R>(array: rxjs$ObservableInput<any>[]) => rxjs$Observable<R>),
    pairs<T>(
      obj: Object,
      scheduler?: rxjs$SchedulerLike,
    ): rxjs$Observable<[string, T]>,
    race: (<T>(observables: Array<rxjs$Observable<T>>) => rxjs$Observable<T>) &
      (<T>(observables: Array<rxjs$Observable<any>>) => rxjs$Observable<T>) &
      (<T>(
        ...observables: Array<rxjs$Observable<T> | Array<rxjs$Observable<T>>>
      ) => rxjs$Observable<T>),
    range(
      start?: number,
      count?: number,
      scheduler?: rxjs$SchedulerLike,
    ): rxjs$Observable<number>,
    timer(
      dueTime?: number | Date,
      periodOrScheduler?: number | rxjs$SchedulerLike,
      scheduler?: rxjs$SchedulerLike,
    ): rxjs$Observable<number>,
    using<T>(
      resourceFactory: () => rxjs$Unsubscribable | void,
      observableFactory: (
        resource: rxjs$Unsubscribable | void,
      ) => rxjs$ObservableInput<T> | void,
    ): rxjs$Observable<T>,
    config: {
      Promise: typeof Promise.constructor,
      useDeprecatedSynchronousErrorHandling: boolean,
      ...
    },
    // @deprecated  resultSelector is no longer supported, pipe to map instead
    zip: (<T, R>(
      v1: rxjs$ObservableInput<T>,
      resultSelector: (v1: T) => R,
    ) => rxjs$Observable<R>) &
      // @deprecated resultSelector is no longer supported, pipe to map instead
      (<T, T2, R>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        resultSelector: (v1: T, v2: T2) => R,
      ) => rxjs$Observable<R>) &
      // @deprecated resultSelector is no longer supported, pipe to map instead
      (<T, T2, T3, R>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        resultSelector: (v1: T, v2: T2, v3: T3) => R,
      ) => rxjs$Observable<R>) &
      // @deprecated resultSelector is no longer supported, pipe to map instead
      (<T, T2, T3, T4, R>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        resultSelector: (v1: T, v2: T2, v3: T3, v4: T4) => R,
      ) => rxjs$Observable<R>) &
      // @deprecated resultSelector is no longer supported, pipe to map instead
      (<T, T2, T3, T4, T5, R>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        resultSelector: (v1: T, v2: T2, v3: T3, v4: T4, v5: T5) => R,
      ) => rxjs$Observable<R>) &
      // @deprecated resultSelector is no longer supported, pipe to map instead
      (<T, T2, T3, T4, T5, T6, R>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        v6: rxjs$ObservableInput<T6>,
        resultSelector: (v1: T, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6) => R,
      ) => rxjs$Observable<R>) &
      (<T, T2>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
      ) => rxjs$Observable<[T, T2]>) &
      (<T, T2, T3>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
      ) => rxjs$Observable<[T, T2, T3]>) &
      (<T, T2, T3, T4>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
      ) => rxjs$Observable<[T, T2, T3, T4]>) &
      (<T, T2, T3, T4, T5>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
      ) => rxjs$Observable<[T, T2, T3, T4, T5]>) &
      (<T, T2, T3, T4, T5, T6>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        v6: rxjs$ObservableInput<T6>,
      ) => rxjs$Observable<[T, T2, T3, T4, T5, T6]>) &
      (<T>(array: rxjs$ObservableInput<T>[]) => rxjs$Observable<T[]>) &
      (<R>(array: rxjs$ObservableInput<any>[]) => rxjs$Observable<R>) &
      // @deprecated resultSelector is no longer supported, pipe to map instead
      (<T, R>(
        array: rxjs$ObservableInput<T>[],
        resultSelector: (...values: Array<T>) => R,
      ) => rxjs$Observable<R>) &
      // @deprecated resultSelector is no longer supported, pipe to map instead
      (<R>(
        array: rxjs$ObservableInput<any>[],
        resultSelector: (...values: Array<any>) => R,
      ) => rxjs$Observable<R>) &
      (<T>(
        ...observables: Array<rxjs$ObservableInput<T>>
      ) => rxjs$Observable<T[]>) &
      (<T, R>(
        ...observables: Array<
          rxjs$ObservableInput<T> | ((...values: Array<T>) => R),
        >
      ) => rxjs$Observable<R>) &
      (<R>(
        ...observables: Array<
          rxjs$ObservableInput<any> | ((...values: Array<any>) => R),
        >
      ) => rxjs$Observable<R>),
    // @deprecated  Deprecated in favor of using {@link  NEVER} constant.
    never(): rxjs$Observable<any>,
    NEVER: rxjs$Observable<any>,
    // @deprecated Deprecated in favor of using {@link EMPTY} constant.
    empty(scheduler?: rxjs$SchedulerLike): rxjs$Observable<any>,
    EMPTY: rxjs$Observable<any>,
    // @deprecated resultSelector is no longer supported, use a mapping function.
    bindCallback: ((
      callbackFunc: Function,
      resultSelector: Function,
      scheduler?: rxjs$SchedulerLike,
    ) => (...args: any[]) => rxjs$Observable<any>) &
      (<R1, R2, R3, R4>(
        callbackFunc: (
          callback: (
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => () => rxjs$Observable<unknown[]>) &
      (<R1, R2, R3>(
        callbackFunc: (callback: (res1: R1, res2: R2, res3: R3) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => () => rxjs$Observable<[R1, R2, R3]>) &
      (<R1, R2>(
        callbackFunc: (callback: (res1: R1, res2: R2) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => () => rxjs$Observable<[R1, R2]>) &
      (<R1>(
        callbackFunc: (callback: (res1: R1) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => () => rxjs$Observable<R1>) &
      ((
        callbackFunc: (callback: () => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => () => rxjs$Observable<void>) &
      (<A1, R1, R2, R3, R4>(
        callbackFunc: (
          arg1: A1,
          callback: (
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1) => rxjs$Observable<unknown[]>) &
      (<A1, R1, R2, R3>(
        callbackFunc: (
          arg1: A1,
          callback: (res1: R1, res2: R2, res3: R3) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1) => rxjs$Observable<[R1, R2, R3]>) &
      (<A1, R1, R2>(
        callbackFunc: (arg1: A1, callback: (res1: R1, res2: R2) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1) => rxjs$Observable<[R1, R2]>) &
      (<A1, R1>(
        callbackFunc: (arg1: A1, callback: (res1: R1) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1) => rxjs$Observable<R1>) &
      (<A1>(
        callbackFunc: (arg1: A1, callback: () => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1) => rxjs$Observable<void>) &
      (<A1, A2, R1, R2, R3, R4>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          callback: (
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2) => rxjs$Observable<unknown[]>) &
      (<A1, A2, R1, R2, R3>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          callback: (res1: R1, res2: R2, res3: R3) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2) => rxjs$Observable<[R1, R2, R3]>) &
      (<A1, A2, R1, R2>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          callback: (res1: R1, res2: R2) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2) => rxjs$Observable<[R1, R2]>) &
      (<A1, A2, R1>(
        callbackFunc: (arg1: A1, arg2: A2, callback: (res1: R1) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2) => rxjs$Observable<R1>) &
      (<A1, A2>(
        callbackFunc: (arg1: A1, arg2: A2, callback: () => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2) => rxjs$Observable<void>) &
      (<A1, A2, A3, R1, R2, R3, R4>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          callback: (
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3) => rxjs$Observable<unknown[]>) &
      (<A1, A2, A3, R1, R2, R3>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          callback: (res1: R1, res2: R2, res3: R3) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3) => rxjs$Observable<[R1, R2, R3]>) &
      (<A1, A2, A3, R1, R2>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          callback: (res1: R1, res2: R2) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3) => rxjs$Observable<[R1, R2]>) &
      (<A1, A2, A3, R1>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          callback: (res1: R1) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3) => rxjs$Observable<R1>) &
      (<A1, A2, A3>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          callback: () => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3) => rxjs$Observable<void>) &
      (<A1, A2, A3, A4, R1, R2, R3, R4>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          callback: (
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
      ) => rxjs$Observable<unknown[]>) &
      (<A1, A2, A3, A4, R1, R2, R3>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          callback: (res1: R1, res2: R2, res3: R3) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
      ) => rxjs$Observable<[R1, R2, R3]>) &
      (<A1, A2, A3, A4, R1, R2>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          callback: (res1: R1, res2: R2) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
      ) => rxjs$Observable<[R1, R2]>) &
      (<A1, A2, A3, A4, R1>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          callback: (res1: R1) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => rxjs$Observable<R1>) &
      (<A1, A2, A3, A4>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          callback: () => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => rxjs$Observable<void>) &
      (<A1, A2, A3, A4, A5, R1, R2, R3, R4>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          arg5: A5,
          callback: (
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
        arg5: A5,
      ) => rxjs$Observable<unknown[]>) &
      (<A1, A2, A3, A4, A5, R1, R2, R3>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          arg5: A5,
          callback: (res1: R1, res2: R2, res3: R3) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
        arg5: A5,
      ) => rxjs$Observable<[R1, R2, R3]>) &
      (<A1, A2, A3, A4, A5, R1, R2>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          arg5: A5,
          callback: (res1: R1, res2: R2) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
        arg5: A5,
      ) => rxjs$Observable<[R1, R2]>) &
      (<A1, A2, A3, A4, A5, R1>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          arg5: A5,
          callback: (res1: R1) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
        arg5: A5,
      ) => rxjs$Observable<R1>) &
      (<A1, A2, A3, A4, A5>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          arg5: A5,
          callback: () => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
        arg5: A5,
      ) => rxjs$Observable<void>) &
      (<A, R>(
        callbackFunc: (...args: Array<A | ((result: R) => any)>) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (...args: A[]) => rxjs$Observable<R>) &
      (<A, R>(
        callbackFunc: (...args: Array<A | ((...results: R[]) => any)>) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (...args: A[]) => rxjs$Observable<R[]>) &
      ((
        callbackFunc: Function,
        scheduler?: rxjs$SchedulerLike,
      ) => (...args: any[]) => rxjs$Observable<any>),
    // @deprecated resultSelector is deprecated, pipe to map instead
    bindNodeCallback: ((
      callbackFunc: Function,
      resultSelector: Function,
      scheduler?: rxjs$SchedulerLike,
    ) => (...args: any[]) => rxjs$Observable<any>) &
      (<R1, R2, R3, R4>(
        callbackFunc: (
          callback: (
            err: any,
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (...args: any[]) => rxjs$Observable<unknown[]>) &
      (<R1, R2, R3>(
        callbackFunc: (
          callback: (err: any, res1: R1, res2: R2, res3: R3) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => () => rxjs$Observable<[R1, R2, R3]>) &
      (<R1, R2>(
        callbackFunc: (callback: (err: any, res1: R1, res2: R2) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => () => rxjs$Observable<[R1, R2]>) &
      (<R1>(
        callbackFunc: (callback: (err: any, res1: R1) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => () => rxjs$Observable<R1>) &
      ((
        callbackFunc: (callback: (err: any) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => () => rxjs$Observable<void>) &
      (<T, A1, R1, R2, R3, R4>(
        callbackFunc: (
          arg1: A1,
          callback: (
            err: any,
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (...args: any[]) => rxjs$Observable<T>) &
      (<A1, R1, R2, R3>(
        callbackFunc: (
          arg1: A1,
          callback: (err: any, res1: R1, res2: R2, res3: R3) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1) => rxjs$Observable<[R1, R2, R3]>) &
      (<A1, R1, R2>(
        callbackFunc: (
          arg1: A1,
          callback: (err: any, res1: R1, res2: R2) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1) => rxjs$Observable<[R1, R2]>) &
      (<A1, R1>(
        callbackFunc: (arg1: A1, callback: (err: any, res1: R1) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1) => rxjs$Observable<R1>) &
      (<A1>(
        callbackFunc: (arg1: A1, callback: (err: any) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1) => rxjs$Observable<void>) &
      (<A1, A2, R1, R2, R3, R4>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          callback: (
            err: any,
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (...args: any[]) => rxjs$Observable<unknown[]>) &
      (<A1, A2, R1, R2, R3>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          callback: (err: any, res1: R1, res2: R2, res3: R3) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2) => rxjs$Observable<[R1, R2, R3]>) &
      (<A1, A2, R1, R2>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          callback: (err: any, res1: R1, res2: R2) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2) => rxjs$Observable<[R1, R2]>) &
      (<A1, A2, R1>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          callback: (err: any, res1: R1) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2) => rxjs$Observable<R1>) &
      (<A1, A2>(
        callbackFunc: (arg1: A1, arg2: A2, callback: (err: any) => any) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2) => rxjs$Observable<void>) &
      (<T, A1, A2, A3, R1, R2, R3, R4>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          callback: (
            err: any,
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (...args: any[]) => rxjs$Observable<T>) &
      (<A1, A2, A3, R1, R2, R3>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          callback: (err: any, res1: R1, res2: R2, res3: R3) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3) => rxjs$Observable<[R1, R2, R3]>) &
      (<A1, A2, A3, R1, R2>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          callback: (err: any, res1: R1, res2: R2) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3) => rxjs$Observable<[R1, R2]>) &
      (<A1, A2, A3, R1>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          callback: (err: any, res1: R1) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3) => rxjs$Observable<R1>) &
      (<A1, A2, A3>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          callback: (err: any) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3) => rxjs$Observable<void>) &
      (<A1, A2, A3, A4, R1, R2, R3, R4>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          callback: (
            err: any,
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (...args: any[]) => rxjs$Observable<unknown[]>) &
      (<A1, A2, A3, A4, R1, R2, R3>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          callback: (err: any, res1: R1, res2: R2, res3: R3) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
      ) => rxjs$Observable<[R1, R2, R3]>) &
      (<A1, A2, A3, A4, R1, R2>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          callback: (err: any, res1: R1, res2: R2) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
      ) => rxjs$Observable<[R1, R2]>) &
      (<A1, A2, A3, A4, R1>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          callback: (err: any, res1: R1) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => rxjs$Observable<R1>) &
      (<A1, A2, A3, A4>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          callback: (err: any) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (arg1: A1, arg2: A2, arg3: A3, arg4: A4) => rxjs$Observable<void>) &
      (<A1, A2, A3, A4, A5, R1, R2, R3, R4>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          arg5: A5,
          callback: (
            err: any,
            res1: R1,
            res2: R2,
            res3: R3,
            res4: R4,
            ...args: any[]
          ) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (...args: any[]) => rxjs$Observable<unknown[]>) &
      (<A1, A2, A3, A4, A5, R1, R2, R3>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          arg5: A5,
          callback: (err: any, res1: R1, res2: R2, res3: R3) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
        arg5: A5,
      ) => rxjs$Observable<[R1, R2, R3]>) &
      (<A1, A2, A3, A4, A5, R1, R2>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          arg5: A5,
          callback: (err: any, res1: R1, res2: R2) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
        arg5: A5,
      ) => rxjs$Observable<[R1, R2]>) &
      (<A1, A2, A3, A4, A5, R1>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          arg5: A5,
          callback: (err: any, res1: R1) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
        arg5: A5,
      ) => rxjs$Observable<R1>) &
      (<A1, A2, A3, A4, A5>(
        callbackFunc: (
          arg1: A1,
          arg2: A2,
          arg3: A3,
          arg4: A4,
          arg5: A5,
          callback: (err: any) => any,
        ) => any,
        scheduler?: rxjs$SchedulerLike,
      ) => (
        arg1: A1,
        arg2: A2,
        arg3: A3,
        arg4: A4,
        arg5: A5,
      ) => rxjs$Observable<void>) &
      ((
        callbackFunc: Function,
        scheduler?: rxjs$SchedulerLike,
      ) => (...args: any[]) => rxjs$Observable<unknown[]>),
    // @deprecated resultSelector no longer supported, pipe to map instead
    combineLatest: (<T, R>(
      v1: rxjs$ObservableInput<T>,
      resultSelector: (v1: T) => R,
      scheduler?: rxjs$SchedulerLike,
    ) => rxjs$Observable<R>) &
      // @deprecated resultSelector no longer supported, pipe to map instead
      (<T, T2, R>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        resultSelector: (v1: T, v2: T2) => R,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<R>) &
      // @deprecated resultSelector no longer supported, pipe to map instead
      (<T, T2, T3, R>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        resultSelector: (v1: T, v2: T2, v3: T3) => R,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<R>) &
      // @deprecated resultSelector no longer supported, pipe to map instead
      (<T, T2, T3, T4, R>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        resultSelector: (v1: T, v2: T2, v3: T3, v4: T4) => R,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<R>) &
      // @deprecated resultSelector no longer supported, pipe to map instead
      (<T, T2, T3, T4, T5, R>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        resultSelector: (v1: T, v2: T2, v3: T3, v4: T4, v5: T5) => R,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<R>) &
      // @deprecated resultSelector no longer supported, pipe to map instead
      (<T, T2, T3, T4, T5, T6, R>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        v6: rxjs$ObservableInput<T6>,
        resultSelector: (v1: T, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6) => R,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<R>) &
      (<T, T2>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<[T, T2]>) &
      (<T, T2, T3>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<[T, T2, T3]>) &
      (<T, T2, T3, T4>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<[T, T2, T3, T4]>) &
      (<T, T2, T3, T4, T5>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<[T, T2, T3, T4, T5]>) &
      (<T, T2, T3, T4, T5, T6>(
        v1: rxjs$ObservableInput<T>,
        v2: rxjs$ObservableInput<T2>,
        v3: rxjs$ObservableInput<T3>,
        v4: rxjs$ObservableInput<T4>,
        v5: rxjs$ObservableInput<T5>,
        v6: rxjs$ObservableInput<T6>,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<[T, T2, T3, T4, T5, T6]>) &
      (<T>(
        array: rxjs$ObservableInput<T>[],
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<T[]>) &
      (<R>(
        array: rxjs$ObservableInput<any>[],
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<R>) &
      // @deprecated resultSelector no longer supported, pipe to map instead
      (<T, R>(
        array: rxjs$ObservableInput<T>[],
        resultSelector: (...values: Array<T>) => R,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<R>) &
      // @deprecated resultSelector no longer supported, pipe to map instead
      (<R>(
        array: rxjs$ObservableInput<any>[],
        resultSelector: (...values: Array<any>) => R,
        scheduler?: rxjs$SchedulerLike,
      ) => rxjs$Observable<R>) &
      (<T>(
        ...observables: Array<rxjs$ObservableInput<T> | rxjs$SchedulerLike>
      ) => rxjs$Observable<T[]>) &
      (<T, R>(
        ...observables: Array<
          | rxjs$ObservableInput<T>
          | ((...values: Array<T>) => R)
          | rxjs$SchedulerLike,
        >
      ) => rxjs$Observable<R>) &
      (<R>(
        ...observables: Array<
          | rxjs$ObservableInput<any>
          | ((...values: Array<any>) => R)
          | rxjs$SchedulerLike,
        >
      ) => rxjs$Observable<R>),
    ...
  };

  declare class BehaviorSubject<T> extends rxjs$Subject<T> {
    constructor(_value: T): void;
    +value: T;
    // @deprecated  This is an internal implementation detail, do not use.
    _subscribe(subscriber: rxjs$Subscriber<T>): rxjs$Subscription;
    getValue(): T;
    next(value?: T): void;
  }

  declare class ReplaySubject<T> extends rxjs$Subject<T> {
    constructor(
      bufferSize?: number,
      windowTime?: number,
      scheduler?: rxjs$SchedulerLike,
    ): void;
    // @deprecated  This is an internal implementation detail, do not use.
    _subscribe(subscriber: rxjs$Subscriber<T>): rxjs$Subscription;
    _getNow(): number;
  }

  declare class AsyncSubject<T> extends rxjs$Subject<T> {
    // @deprecated  This is an internal implementation detail, do not use.
    _subscribe(subscriber: rxjs$Subscriber<any>): rxjs$Subscription;
    next(value?: T): void;
    error(error: any): void;
    complete(): void;
  }

  declare class VirtualTimeScheduler extends AsyncScheduler {
    maxFrames: number;
    static frameTimeFactor: number;
    frame: number;
    index: number;
    constructor(SchedulerAction?: typeof AsyncAction, maxFrames?: number): void;
    flush(): void;
  }

  declare class VirtualAction<T> extends AsyncAction<T> {
    scheduler: AsyncScheduler | VirtualTimeScheduler;
    work: (state?: T) => void;
    index: number;
    active: boolean;
    constructor(
      scheduler: AsyncScheduler | VirtualTimeScheduler,
      work: (state?: T) => void,
      index?: number,
    ): void;
    schedule(state?: T, delay?: number): rxjs$Subscription;
    requestAsyncId(
      scheduler: AsyncScheduler | VirtualTimeScheduler,
      id?: any,
      delay?: number,
    ): any;
    recycleAsyncId(
      scheduler: AsyncScheduler | VirtualTimeScheduler,
      id?: any,
      delay?: number,
    ): any;
    _execute(state: T, delay: number): any;
    static sortActions<U>(a: VirtualAction<U>, b: VirtualAction<U>): 1 | -1 | 0;
  }

  declare class Scheduler implements rxjs$SchedulerLike {
    static now: () => number;
    constructor(SchedulerAction: typeof Action, now?: () => number): void;
    now: () => number;
    schedule<T>(
      work: (state?: T) => void,
      delay?: number,
      state?: T,
    ): rxjs$Subscription;
  }

  declare interface ArgumentOutOfRangeError extends Error {}

  declare interface EmptyError extends Error {}

  declare interface ObjectUnsubscribedError extends Error {}

  declare interface UnsubscriptionError extends Error {
    +errors: any[];
  }

  declare interface TimeoutError extends Error {}

  declare type ConditionFunc<S> = (state: S) => boolean;
  declare type IterateFunc<S> = (state: S) => S;
  declare type ResultFunc<S, T> = (state: S) => T;
  declare interface GenerateBaseOptions<S> {
    initialState: S;
    condition?: ConditionFunc<S>;
    iterate: IterateFunc<S>;
    scheduler?: rxjs$SchedulerLike;
  }
  declare interface GenerateOptions<T, S> extends GenerateBaseOptions<S> {
    resultSelector: ResultFunc<S, T>;
  }

  declare class AsapScheduler extends AsyncScheduler {
    flush(action?: AsyncAction<unknown>): void;
  }

  declare class AsyncScheduler extends Scheduler {
    static delegate: Scheduler;
    actions: Array<AsyncAction<unknown>>;
    // @deprecated  internal use only
    active: boolean;
    // @deprecated  internal use only
    scheduled: any;
    constructor(SchedulerAction: typeof Action, now?: () => number): void;
    schedule<T>(
      work: (state?: T) => void,
      delay?: number,
      state?: T,
    ): rxjs$Subscription;
    flush(action: AsyncAction<unknown>): void;
  }

  declare class QueueScheduler extends AsyncScheduler {}

  declare class AnimationFrameScheduler extends AsyncScheduler {
    flush(action?: AsyncAction<unknown>): void;
  }

  declare class AsyncAction<T> extends Action<T> {
    scheduler: AsyncScheduler;
    work: (state?: T) => void;
    id: unknown;
    state: T;
    delay: number;
    pending: boolean;
    constructor(scheduler: AsyncScheduler, work: (state?: T) => void): void;
    schedule(state?: T, delay?: number): rxjs$Subscription;
    requestAsyncId(
      scheduler: AsyncScheduler,
      id?: unknown,
      delay?: number,
    ): any;
    recycleAsyncId(scheduler: AsyncScheduler, id: unknown, delay?: number): any;
    execute(state: T, delay: number): any;
    _execute(state: T, delay: number): any;
    // @deprecated  This is an internal implementation detail, do not use.
    _unsubscribe(): void;
  }

  declare class Action<T> extends rxjs$Subscription {
    constructor(scheduler: Scheduler, work: (state?: T) => void): void;
    schedule(state?: T, delay?: number): rxjs$Subscription;
  }
}

declare module 'rxjs/operators' {
  declare export function audit<T>(
    durationSelector: (value: T) => rxjs$SubscribableOrPromise<unknown>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function auditTime<T>(
    duration: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function buffer<T>(
    closingNotifier: rxjs$Observable<any>,
  ): rxjs$OperatorFunction<T, T[]>;

  declare export function bufferCount<T>(
    bufferSize: number,
    startBufferEvery?: number,
  ): rxjs$OperatorFunction<T, T[]>;

  declare export function bufferTime<T>(
    bufferTimeSpan: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T[]>;

  declare export function bufferTime<T>(
    bufferTimeSpan: number,
    bufferCreationInterval: ?number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T[]>;

  declare export function bufferTime<T>(
    bufferTimeSpan: number,
    bufferCreationInterval: ?number,
    maxBufferSize: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T[]>;

  declare export function bufferToggle<T, O>(
    openings: rxjs$SubscribableOrPromise<O>,
    closingSelector: (value: O) => rxjs$SubscribableOrPromise<unknown>,
  ): rxjs$OperatorFunction<T, T[]>;

  declare export function bufferWhen<T>(
    closingSelector: () => rxjs$Observable<unknown>,
  ): rxjs$OperatorFunction<T, T[]>;

  // declare export function catchError<T>(selector: (err: any, caught: rxjs$Observable<T>) => empty): rxjs$MonoTypeOperatorFunction<T>;

  declare export function catchError<T, R>(
    selector: (err: any, caught: rxjs$Observable<T>) => rxjs$ObservableInput<R>,
  ): rxjs$OperatorFunction<T, T | R>;

  declare export function combineAll<T>(): rxjs$OperatorFunction<
    rxjs$ObservableInput<T>,
    T[],
  >;

  declare export function combineAll<T>(): rxjs$OperatorFunction<unknown, T[]>;

  declare export function combineAll<T, R>(
    project: (...values: T[]) => R,
  ): rxjs$OperatorFunction<rxjs$ObservableInput<T>, R>;

  declare export function combineAll<R>(
    project: (...values: Array<unknown>) => R,
  ): rxjs$OperatorFunction<unknown, R>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, R>(
    project: (v1: T) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, T2, R>(
    v2: rxjs$ObservableInput<T2>,
    project: (v1: T, v2: T2) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, T2, T3, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    project: (v1: T, v2: T2, v3: T3) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, T2, T3, T4, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    project: (v1: T, v2: T2, v3: T3, v4: T4) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, T2, T3, T4, T5, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    project: (v1: T, v2: T2, v3: T3, v4: T4, v5: T5) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, T2, T3, T4, T5, T6, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    v6: rxjs$ObservableInput<T6>,
    project: (v1: T, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, T2>(
    v2: rxjs$ObservableInput<T2>,
  ): rxjs$OperatorFunction<T, [T, T2]>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, T2, T3>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
  ): rxjs$OperatorFunction<T, [T, T2, T3]>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, T2, T3, T4>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
  ): rxjs$OperatorFunction<T, [T, T2, T3, T4]>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, T2, T3, T4, T5>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
  ): rxjs$OperatorFunction<T, [T, T2, T3, T4, T5]>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, T2, T3, T4, T5, T6>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    v6: rxjs$ObservableInput<T6>,
  ): rxjs$OperatorFunction<T, [T, T2, T3, T4, T5, T6]>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, R>(
    ...observables: Array<
      rxjs$ObservableInput<T> | ((...values: Array<T>) => R),
    >
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, R>(
    array: rxjs$ObservableInput<T>[],
  ): rxjs$OperatorFunction<T, Array<T>>;

  // @deprecated Deprecated in favor of static combineLatest.
  declare export function combineLatest<T, TOther, R>(
    array: rxjs$ObservableInput<TOther>[],
    project: (v1: T, ...values: Array<TOther>) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated  Deprecated in favor of static concat.
  declare export function concat<T>(
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  // @deprecated Deprecated in favor of static concat.
  declare export function concat<T, T2>(
    v2: rxjs$ObservableInput<T2>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2>;

  // @deprecated Deprecated in favor of static concat.
  declare export function concat<T, T2, T3>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3>;

  // @deprecated Deprecated in favor of static concat.
  declare export function concat<T, T2, T3, T4>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3 | T4>;

  // @deprecated Deprecated in favor of static concat.
  declare export function concat<T, T2, T3, T4, T5>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3 | T4 | T5>;
  // @deprecated Deprecated in favor of static concat.
  declare export function concat<T, T2, T3, T4, T5, T6>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    v6: rxjs$ObservableInput<T6>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3 | T4 | T5 | T6>;
  // @deprecated Deprecated in favor of static concat.
  declare export function concat<T>(
    ...observables: Array<rxjs$ObservableInput<T> | rxjs$SchedulerLike>
  ): rxjs$MonoTypeOperatorFunction<T>;
  // @deprecated Deprecated in favor of static concat.
  declare export function concat<T, R>(
    ...observables: Array<rxjs$ObservableInput<unknown> | rxjs$SchedulerLike>
  ): rxjs$OperatorFunction<T, R>;

  declare export function concatAll<T>(): rxjs$OperatorFunction<
    rxjs$ObservableInput<T>,
    T,
  >;

  declare export function concatAll<R>(): rxjs$OperatorFunction<unknown, R>;

  declare export function concatMap<T, I, R>(
    project: (value: T, index: number) => rxjs$ObservableInput<I | R>,
    resultSelector?: (
      outerValue: T,
      innerValue: I,
      outerIndex: number,
      innerIndex: number,
    ) => R,
  ): rxjs$OperatorFunction<T, I | R>;

  declare export function concatMapTo<T>(
    observable: rxjs$ObservableInput<T>,
  ): rxjs$OperatorFunction<unknown, T>;

  // @deprecated
  declare export function concatMapTo<T>(
    observable: rxjs$ObservableInput<T>,
    resultSelector: void,
  ): rxjs$OperatorFunction<unknown, T>;
  // @deprecated
  declare export function concatMapTo<T, I, R>(
    observable: rxjs$ObservableInput<I>,
    resultSelector: (
      outerValue: T,
      innerValue: I,
      outerIndex: number,
      innerIndex: number,
    ) => R,
  ): rxjs$OperatorFunction<T, R>;

  declare export function count<T>(
    predicate?: (
      value: T,
      index: number,
      source: rxjs$Observable<T>,
    ) => boolean,
  ): rxjs$OperatorFunction<T, number>;

  declare export function debounce<T>(
    durationSelector: (value: T) => rxjs$SubscribableOrPromise<unknown>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function debounceTime<T>(
    dueTime: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function defaultIfEmpty<T>(
    defaultValue?: T,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function delay<T>(
    delay: number | Date,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function delayWhen<T>(
    delayDurationSelector: (
      value: T,
      index: number,
    ) => rxjs$Observable<unknown>,
    subscriptionDelay?: rxjs$Observable<unknown>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function dematerialize<T>(): rxjs$OperatorFunction<
    rxjs$Notification<T>,
    T,
  >;

  declare export function distinct<T, K>(
    keySelector?: (value: T) => K,
    flushes?: rxjs$Observable<unknown>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function distinctUntilChanged<T>(
    compare?: (x: T, y: T) => boolean,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function distinctUntilChanged<T, K>(
    compare: (x: K, y: K) => boolean,
    keySelector: (x: T) => K,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function distinctUntilKeyChanged<T>(
    key: keyof T,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function distinctUntilKeyChanged<T, K extends keyof T>(
    key: K,
    compare: (x: unknown, y: unknown) => boolean,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function elementAt<T>(
    index: number,
    defaultValue?: T,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function endWith<T>(
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function endWith<T>(
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;
  declare export function endWith<T>(
    v1: T,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;
  declare export function endWith<T>(
    v1: T,
    v2: T,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;
  declare export function endWith<T>(
    v1: T,
    v2: T,
    v3: T,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;
  declare export function endWith<T>(
    v1: T,
    v2: T,
    v3: T,
    v4: T,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;
  declare export function endWith<T>(
    v1: T,
    v2: T,
    v3: T,
    v4: T,
    v5: T,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;
  declare export function endWith<T>(
    v1: T,
    v2: T,
    v3: T,
    v4: T,
    v5: T,
    v6: T,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;
  declare export function endWith<T>(
    ...array: Array<T | rxjs$SchedulerLike>
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function every<T>(
    predicate: (value: T, index: number, source: rxjs$Observable<T>) => boolean,
    thisArg?: any,
  ): rxjs$OperatorFunction<T, boolean>;

  declare export function exhaust<T>(): rxjs$OperatorFunction<
    rxjs$ObservableInput<T>,
    T,
  >;

  declare export function exhaust<R>(): rxjs$OperatorFunction<unknown, R>;

  declare export function exhaustMap<T, I, R>(
    project: (value: T, index: number) => rxjs$ObservableInput<I | R>,
    // @deprecated resultSelector is no longer supported. Use inner map instead.
    resultSelector?: (
      outerValue: T,
      innerValue: I,
      outerIndex: number,
      innerIndex: number,
    ) => R,
  ): rxjs$OperatorFunction<T, I | R>;

  declare export function expand<T, R>(
    project: (value: T, index: number) => rxjs$ObservableInput<R>,
    concurrent?: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, R>;

  declare export function expand<T>(
    project: (value: T, index: number) => rxjs$ObservableInput<T>,
    concurrent?: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function filter<T, S extends T>(
    predicate: (value: T, index: number) => boolean,
    thisArg?: any,
  ): rxjs$OperatorFunction<T, S>;

  declare export function filter<T>(
    predicate: (value: T, index: number) => boolean,
    thisArg?: any,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function finalize<T>(
    callback: () => void,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function find<T, S extends T>(
    predicate: (value: T, index: number, source: rxjs$Observable<T>) => boolean,
    thisArg?: any,
  ): rxjs$OperatorFunction<T, T | S | void>;

  declare export function findIndex<T>(
    predicate: (value: T, index: number, source: rxjs$Observable<T>) => boolean,
    thisArg?: any,
  ): rxjs$OperatorFunction<T, number>;

  declare export function first<T>(
    predicate?: ?(
      value: T,
      index: number,
      source: rxjs$Observable<T>,
    ) => boolean,
  ): rxjs$OperatorFunction<T, T>;

  declare export function first<T, D>(
    predicate?: ?(
      value: T,
      index: number,
      source: rxjs$Observable<T>,
    ) => boolean,
    defaultValue?: D,
  ): rxjs$OperatorFunction<T, T | D>;

  declare export function groupBy<T, K>(
    keySelector: (value: T) => K,
  ): rxjs$OperatorFunction<T, rxjs$GroupedObservable<K, T>>;

  declare export function groupBy<T, K>(
    keySelector: (value: T) => K,
    elementSelector: void,
    durationSelector: (
      grouped: rxjs$GroupedObservable<K, T>,
    ) => rxjs$Observable<unknown>,
  ): rxjs$OperatorFunction<T, rxjs$GroupedObservable<K, T>>;

  declare export function groupBy<T, K, R>(
    keySelector: (value: T) => K,
    elementSelector?: (value: T) => R,
    durationSelector?: (
      grouped: rxjs$GroupedObservable<K, R>,
    ) => rxjs$Observable<unknown>,
    subjectSelector?: () => rxjs$Subject<R>,
  ): rxjs$OperatorFunction<T, rxjs$GroupedObservable<K, R>>;

  declare export function ignoreElements<T, U>(): rxjs$OperatorFunction<T, U>;

  declare export function isEmpty<T>(): rxjs$OperatorFunction<T, boolean>;

  declare export function last<T>(
    predicate?: ?(
      value: T,
      index: number,
      source: rxjs$Observable<T>,
    ) => boolean,
  ): rxjs$OperatorFunction<T, T>;

  declare export function last<T, D>(
    predicate?: ?(
      value: T,
      index: number,
      source: rxjs$Observable<T>,
    ) => boolean,
    defaultValue?: D,
  ): rxjs$OperatorFunction<T, T | D>;

  declare export function map<T, R>(
    project: (value: T, index: number) => R,
    thisArg?: any,
  ): rxjs$OperatorFunction<T, R>;

  declare export function mapTo<T, R>(value: R): rxjs$OperatorFunction<T, R>;

  declare export function materialize<T>(): rxjs$OperatorFunction<
    T,
    rxjs$Notification<T>,
  >;

  declare export function max<T>(
    comparer?: (x: T, y: T) => number,
  ): rxjs$MonoTypeOperatorFunction<T>;

  // @deprecated  Deprecated in favor of static merge.
  declare export function merge<T>(
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T>(
    concurrent?: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T, T2>(
    v2: rxjs$ObservableInput<T2>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T, T2>(
    v2: rxjs$ObservableInput<T2>,
    concurrent?: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T, T2, T3>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T, T2, T3>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    concurrent?: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T, T2, T3, T4>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3 | T4>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T, T2, T3, T4>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    concurrent?: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3 | T4>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T, T2, T3, T4, T5>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3 | T4 | T5>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T, T2, T3, T4, T5>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    concurrent?: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3 | T4 | T5>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T, T2, T3, T4, T5, T6>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    v6: rxjs$ObservableInput<T6>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3 | T4 | T5 | T6>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T, T2, T3, T4, T5, T6>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    v6: rxjs$ObservableInput<T6>,
    concurrent?: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | T2 | T3 | T4 | T5 | T6>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T>(
    ...observables: Array<rxjs$ObservableInput<T> | rxjs$SchedulerLike | number>
  ): rxjs$MonoTypeOperatorFunction<T>;

  // @deprecated Deprecated in favor of static merge.
  declare export function merge<T, R>(
    ...observables: Array<
      rxjs$ObservableInput<unknown> | rxjs$SchedulerLike | number,
    >
  ): rxjs$OperatorFunction<T, R>;

  declare export function mergeAll<T>(
    concurrent?: number,
  ): rxjs$OperatorFunction<rxjs$ObservableInput<T>, T>;

  declare export function mergeMap<T, I, R>(
    project: (value: T, index: number) => rxjs$ObservableInput<I | R>,
    // @deprecated resultSelector no longer supported, use inner map instead
    resultSelector?:
      | ((
          outerValue: T,
          innerValue: I,
          outerIndex: number,
          innerIndex: number,
        ) => R)
      | number,
    concurrent?: number,
  ): rxjs$OperatorFunction<T, I | R>;

  declare export function flatMap<T, R>(
    project: (value: T, index: number) => rxjs$ObservableInput<R>,
    concurrent?: number,
  ): rxjs$OperatorFunction<T, R>;

  declare export function mergeMapTo<T>(
    innerObservable: rxjs$ObservableInput<T>,
    concurrent?: number,
  ): rxjs$OperatorFunction<unknown, T>;

  // @deprecated
  declare export function mergeMapTo<T, I, R>(
    innerObservable: rxjs$ObservableInput<I>,
    resultSelector: (
      outerValue: T,
      innerValue: I,
      outerIndex: number,
      innerIndex: number,
    ) => R,
    concurrent?: number,
  ): rxjs$OperatorFunction<T, R>;

  declare export function mergeScan<T, R>(
    accumulator: (acc: R, value: T) => rxjs$ObservableInput<R>,
    seed: R,
    concurrent?: number,
  ): rxjs$OperatorFunction<T, R>;

  declare export function min<T>(
    comparer?: (x: T, y: T) => number,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function multicast<T>(
    subjectOrSubjectFactory: rxjs$FactoryOrValue<rxjs$Subject<T>>,
  ): rxjs$UnaryFunction<rxjs$Observable<T>, rxjs$ConnectableObservable<T>>;

  declare export function multicast<T>(
    rxjs$SubjectFactory: () => rxjs$Subject<T>,
  ): rxjs$UnaryFunction<rxjs$Observable<T>, rxjs$ConnectableObservable<T>>;

  declare export function multicast<T>(
    rxjs$SubjectFactory: () => rxjs$Subject<T>,
    selector?: rxjs$MonoTypeOperatorFunction<T>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function multicast<T, R>(
    rxjs$SubjectFactory: () => rxjs$Subject<T>,
  ): rxjs$UnaryFunction<rxjs$Observable<T>, rxjs$ConnectableObservable<R>>;

  declare export function multicast<T, R>(
    rxjs$SubjectFactory: () => rxjs$Subject<T>,
    selector?: rxjs$OperatorFunction<T, R>,
  ): rxjs$OperatorFunction<T, R>;

  declare export function observeOn<T>(
    scheduler: rxjs$SchedulerLike,
    delay?: number,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function onErrorResumeNext<T, R>(
    v: rxjs$ObservableInput<R>,
  ): rxjs$OperatorFunction<T, R>;

  declare export function onErrorResumeNext<T, T2, T3, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
  ): rxjs$OperatorFunction<T, R>;

  declare export function onErrorResumeNext<T, T2, T3, T4, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
  ): rxjs$OperatorFunction<T, R>;

  declare export function onErrorResumeNext<T, T2, T3, T4, T5, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
  ): rxjs$OperatorFunction<T, R>;

  declare export function onErrorResumeNext<T, T2, T3, T4, T5, T6, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    v6: rxjs$ObservableInput<T6>,
  ): rxjs$OperatorFunction<T, R>;

  declare export function onErrorResumeNext<T, R>(
    ...observables: Array<
      rxjs$ObservableInput<unknown> | ((...values: Array<unknown>) => R),
    >
  ): rxjs$OperatorFunction<T, R>;

  declare export function onErrorResumeNext<T, R>(
    array: rxjs$ObservableInput<unknown>[],
  ): rxjs$OperatorFunction<T, R>;

  declare export function onErrorResumeNextStatic<R>(
    v: rxjs$ObservableInput<R>,
  ): rxjs$Observable<R>;

  declare export function onErrorResumeNextStatic<T2, T3, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
  ): rxjs$Observable<R>;

  declare export function onErrorResumeNextStatic<T2, T3, T4, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
  ): rxjs$Observable<R>;

  declare export function onErrorResumeNextStatic<T2, T3, T4, T5, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
  ): rxjs$Observable<R>;

  declare export function onErrorResumeNextStatic<T2, T3, T4, T5, T6, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    v6: rxjs$ObservableInput<T6>,
  ): rxjs$Observable<R>;

  declare export function onErrorResumeNextStatic<R>(
    ...observables: Array<
      rxjs$ObservableInput<unknown> | ((...values: Array<any>) => R),
    >
  ): rxjs$Observable<R>;

  declare export function onErrorResumeNextStatic<R>(
    array: rxjs$ObservableInput<unknown>[],
  ): rxjs$Observable<R>;

  declare export function pairwise<T>(): rxjs$OperatorFunction<T, [T, T]>;

  declare export function partition<T>(
    predicate: (value: T, index: number) => boolean,
    thisArg?: any,
  ): rxjs$UnaryFunction<
    rxjs$Observable<T>,
    [rxjs$Observable<T>, rxjs$Observable<T>],
  >;

  declare export function pluck<T, R>(
    ...properties: string[]
  ): rxjs$OperatorFunction<T, R>;

  declare export function publish<T>(): rxjs$UnaryFunction<
    rxjs$Observable<T>,
    rxjs$ConnectableObservable<T>,
  >;

  declare export function publish<T, R>(
    selector: rxjs$OperatorFunction<T, R>,
  ): rxjs$OperatorFunction<T, R>;

  declare export function publish<T>(
    selector: rxjs$MonoTypeOperatorFunction<T>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function publishBehavior<T>(
    value: T,
  ): rxjs$UnaryFunction<rxjs$Observable<T>, rxjs$ConnectableObservable<T>>;

  declare export function publishLast<T>(): rxjs$UnaryFunction<
    rxjs$Observable<T>,
    rxjs$ConnectableObservable<T>,
  >;

  declare export function publishReplay<T>(
    bufferSize?: number,
    windowTime?: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function publishReplay<T, R>(
    bufferSize?: number,
    windowTime?: number,
    selector?: rxjs$OperatorFunction<T, R>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, R>;

  declare export function publishReplay<T>(
    bufferSize?: number,
    windowTime?: number,
    selector?: rxjs$MonoTypeOperatorFunction<T>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  // @deprecated  Deprecated in favor of static race.
  declare export function race<T>(
    observables: Array<rxjs$Observable<T>>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  // @deprecated Deprecated in favor of static race.
  declare export function race<T, R>(
    observables: Array<rxjs$Observable<T>>,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static race.
  declare export function race<T>(
    ...observables: Array<rxjs$Observable<T> | Array<rxjs$Observable<T>>>
  ): rxjs$MonoTypeOperatorFunction<T>;

  // @deprecated Deprecated in favor of static race.
  declare export function race<T, R>(
    ...observables: Array<
      rxjs$Observable<unknown> | Array<rxjs$Observable<unknown>>,
    >
  ): rxjs$OperatorFunction<T, R>;

  declare export function reduce<T>(
    accumulator: (acc: T, value: T, index: number) => T,
    seed?: T,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function reduce<T>(
    accumulator: (acc: T[], value: T, index: number) => T[],
    seed: T[],
  ): rxjs$OperatorFunction<T, T[]>;
  declare export function reduce<T, R>(
    accumulator: (acc: R, value: T, index: number) => R,
    seed?: R,
  ): rxjs$OperatorFunction<T, R>;

  declare export function repeat<T>(
    count?: number,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function repeatWhen<T>(
    notifier: (notifications: rxjs$Observable<any>) => rxjs$Observable<unknown>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function retry<T>(
    count?: number,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function retryWhen<T>(
    notifier: (errors: rxjs$Observable<any>) => rxjs$Observable<unknown>,
  ): rxjs$MonoTypeOperatorFunction<T>;
  // @todo - find out why this used to return: (rxjs$Observable<T>) => rxjs$Observable<T>

  declare export function refCount<T>(): rxjs$MonoTypeOperatorFunction<T>;

  declare export function sample<T>(
    notifier: rxjs$Observable<any>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function sampleTime<T>(
    period: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function scan<T>(
    accumulator: (acc: T, value: T, index: number) => T,
    seed?: T,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function scan<T>(
    accumulator: (acc: T[], value: T, index: number) => T[],
    seed?: T[],
  ): rxjs$OperatorFunction<T, T[]>;

  declare export function scan<T, R>(
    accumulator: (acc: R, value: T, index: number) => R,
    seed?: R,
  ): rxjs$OperatorFunction<T, R>;

  declare export function sequenceEqual<T>(
    compareTo: rxjs$Observable<T>,
    comparor?: (a: T, b: T) => boolean,
  ): rxjs$OperatorFunction<T, boolean>;

  declare export function share<T>(): rxjs$MonoTypeOperatorFunction<T>;

  declare export function shareReplay<T>(
    bufferSize?: number,
    windowTime?: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function single<T>(
    predicate?: (
      value: T,
      index: number,
      source: rxjs$Observable<T>,
    ) => boolean,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function skip<T>(
    count: number,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function skipLast<T>(
    count: number,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function skipUntil<T>(
    notifier: rxjs$Observable<any>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function skipWhile<T>(
    predicate: (value: T, index: number) => boolean,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function startWith<T>(
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function startWith<T>(
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function startWith<T, D>(
    v1: D,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | D>;

  declare export function startWith<T, D, E>(
    v1: D,
    v2: E,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | D | E>;

  declare export function startWith<T, D, E, F>(
    v1: D,
    v2: E,
    v3: F,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | D | E | F>;

  declare export function startWith<T, D, E, F, G>(
    v1: D,
    v2: E,
    v3: F,
    v4: G,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | D | E | F | G>;

  declare export function startWith<T, D, E, F, G, H>(
    v1: D,
    v2: E,
    v3: F,
    v4: G,
    v5: H,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | D | E | F | G | H>;

  declare export function startWith<T, D, E, F, G, H, I>(
    v1: D,
    v2: E,
    v3: F,
    v4: G,
    v5: H,
    v6: I,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | D | E | F | G | H | I>;

  declare export function startWith<T, D>(
    ...array: Array<D | rxjs$SchedulerLike>
  ): rxjs$OperatorFunction<T, D>;

  declare export function subscribeOn<T>(
    scheduler: rxjs$SchedulerLike,
    delay?: number,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function switchAll<T>(): rxjs$OperatorFunction<
    rxjs$ObservableInput<T>,
    T,
  >;

  declare export function switchMap<T, I, R>(
    project: (value: T, index: number) => rxjs$ObservableInput<I | R>,
    // @deprecated resultSelector is no longer supported, use inner map instead
    resultSelector?: (
      outerValue: T,
      innerValue: I,
      outerIndex: number,
      innerIndex: number,
    ) => R,
  ): rxjs$OperatorFunction<T, I | R>;

  declare export function switchMapTo<R>(
    observable: rxjs$ObservableInput<R>,
  ): rxjs$OperatorFunction<unknown, R>;

  // @deprecated resultSelector is no longer supported. Switch to using switchMap with an inner map
  declare export function switchMapTo<T, R>(
    observable: rxjs$ObservableInput<R>,
    resultSelector: void,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated resultSelector is no longer supported. Switch to using switchMap with an inner map
  declare export function switchMapTo<T, I, R>(
    observable: rxjs$ObservableInput<I>,
    resultSelector: (
      outerValue: T,
      innerValue: I,
      outerIndex: number,
      innerIndex: number,
    ) => R,
  ): rxjs$OperatorFunction<T, R>;

  declare export function take<T>(
    count: number,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function takeLast<T>(
    count: number,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function takeUntil<T>(
    notifier: rxjs$Observable<any>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function takeWhile<T, S extends T>(
    predicate: (value: T, index: number) => S,
    inclusive?: boolean,
  ): rxjs$OperatorFunction<T, S>;

  declare export function takeWhile<T>(
    predicate: (value: T, index: number) => boolean,
    inclusive?: boolean,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function tap<T>(
    next?: (x: T) => unknown,
    error?: (e: any) => unknown,
    complete?: () => unknown,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function tap<T>(
    observer: rxjs$PartialObserver<T>,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare interface ThrottleConfig {
    leading?: boolean;
    trailing?: boolean;
  }

  declare export function throttle<T>(
    durationSelector: (value: T) => rxjs$SubscribableOrPromise<unknown>,
    config?: ThrottleConfig,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function throttleTime<T>(
    duration: number,
    scheduler?: rxjs$SchedulerLike,
    config?: ThrottleConfig,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export var throwIfEmpty: <T>(
    errorFactory?: () => any,
  ) => rxjs$MonoTypeOperatorFunction<T>;

  declare export function timeInterval<T>(
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, rxjs$TimeInterval<T>>;

  declare export function timeout<T>(
    due: number | Date,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$MonoTypeOperatorFunction<T>;

  declare export function timeoutWith<T, R>(
    due: number | Date,
    withObservable: rxjs$ObservableInput<R>,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, T | R>;

  declare export function timestamp<T>(
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, rxjs$Timestamp<T>>;

  declare export function toArray<T>(): rxjs$OperatorFunction<T, T[]>;

  declare export function window<T>(
    windowBoundaries: rxjs$Observable<unknown>,
  ): rxjs$OperatorFunction<T, rxjs$Observable<T>>;

  declare export function windowCount<T>(
    windowSize: number,
    startWindowEvery?: number,
  ): rxjs$OperatorFunction<T, rxjs$Observable<T>>;

  declare export function windowTime<T>(
    windowTimeSpan: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, rxjs$Observable<T>>;

  declare export function windowTime<T>(
    windowTimeSpan: number,
    windowCreationInterval: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, rxjs$Observable<T>>;

  declare export function windowTime<T>(
    windowTimeSpan: number,
    windowCreationInterval: number,
    maxWindowSize: number,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$OperatorFunction<T, rxjs$Observable<T>>;

  declare export function windowToggle<T, O>(
    openings: rxjs$Observable<O>,
    closingSelector: (openValue: O) => rxjs$Observable<unknown>,
  ): rxjs$OperatorFunction<T, rxjs$Observable<T>>;

  declare export function windowWhen<T>(
    closingSelector: () => rxjs$Observable<unknown>,
  ): rxjs$OperatorFunction<T, rxjs$Observable<T>>;

  declare export function withLatestFrom<T, R>(
    project: (v1: T) => R,
  ): rxjs$OperatorFunction<T, R>;

  declare export function withLatestFrom<T, T2, R>(
    v2: rxjs$ObservableInput<T2>,
    project: (v1: T, v2: T2) => R,
  ): rxjs$OperatorFunction<T, R>;

  declare export function withLatestFrom<T, T2, T3, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    project: (v1: T, v2: T2, v3: T3) => R,
  ): rxjs$OperatorFunction<T, R>;

  declare export function withLatestFrom<T, T2, T3, T4, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    project: (v1: T, v2: T2, v3: T3, v4: T4) => R,
  ): rxjs$OperatorFunction<T, R>;

  declare export function withLatestFrom<T, T2, T3, T4, T5, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    project: (v1: T, v2: T2, v3: T3, v4: T4, v5: T5) => R,
  ): rxjs$OperatorFunction<T, R>;

  declare export function withLatestFrom<T, T2, T3, T4, T5, T6, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    v6: rxjs$ObservableInput<T6>,
    project: (v1: T, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6) => R,
  ): rxjs$OperatorFunction<T, R>;

  declare export function withLatestFrom<T, T2>(
    v2: rxjs$ObservableInput<T2>,
  ): rxjs$OperatorFunction<T, [T, T2]>;

  declare export function withLatestFrom<T, T2, T3>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
  ): rxjs$OperatorFunction<T, [T, T2, T3]>;

  declare export function withLatestFrom<T, T2, T3, T4>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
  ): rxjs$OperatorFunction<T, [T, T2, T3, T4]>;

  declare export function withLatestFrom<T, T2, T3, T4, T5>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
  ): rxjs$OperatorFunction<T, [T, T2, T3, T4, T5]>;

  declare export function withLatestFrom<T, T2, T3, T4, T5, T6>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    v6: rxjs$ObservableInput<T6>,
  ): rxjs$OperatorFunction<T, [T, T2, T3, T4, T5, T6]>;

  declare export function withLatestFrom<T, R>(
    ...observables: Array<
      rxjs$ObservableInput<unknown> | ((...values: Array<any>) => R),
    >
  ): rxjs$OperatorFunction<T, R>;

  declare export function withLatestFrom<T, R>(
    array: rxjs$ObservableInput<unknown>[],
  ): rxjs$OperatorFunction<T, R>;

  declare export function withLatestFrom<T, R>(
    array: rxjs$ObservableInput<unknown>[],
    project: (...values: Array<any>) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated  Deprecated in favor of static zip.
  declare export function zip<T, R>(
    project: (v1: T) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, T2, R>(
    v2: rxjs$ObservableInput<T2>,
    project: (v1: T, v2: T2) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, T2, T3, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    project: (v1: T, v2: T2, v3: T3) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, T2, T3, T4, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    project: (v1: T, v2: T2, v3: T3, v4: T4) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, T2, T3, T4, T5, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    project: (v1: T, v2: T2, v3: T3, v4: T4, v5: T5) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, T2, T3, T4, T5, T6, R>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    v6: rxjs$ObservableInput<T6>,
    project: (v1: T, v2: T2, v3: T3, v4: T4, v5: T5, v6: T6) => R,
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, T2>(
    v2: rxjs$ObservableInput<T2>,
  ): rxjs$OperatorFunction<T, [T, T2]>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, T2, T3>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
  ): rxjs$OperatorFunction<T, [T, T2, T3]>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, T2, T3, T4>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
  ): rxjs$OperatorFunction<T, [T, T2, T3, T4]>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, T2, T3, T4, T5>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
  ): rxjs$OperatorFunction<T, [T, T2, T3, T4, T5]>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, T2, T3, T4, T5, T6>(
    v2: rxjs$ObservableInput<T2>,
    v3: rxjs$ObservableInput<T3>,
    v4: rxjs$ObservableInput<T4>,
    v5: rxjs$ObservableInput<T5>,
    v6: rxjs$ObservableInput<T6>,
  ): rxjs$OperatorFunction<T, [T, T2, T3, T4, T5, T6]>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, R>(
    ...observables: Array<
      rxjs$ObservableInput<T> | ((...values: Array<T>) => R),
    >
  ): rxjs$OperatorFunction<T, R>;

  // @deprecated Deprecated in favor of static zip.
  declare export function zip<T, R>(
    array: Array<rxjs$ObservableInput<T>>,
  ): rxjs$OperatorFunction<T, R>;
  // @deprecated Deprecated in favor of static zip.

  declare export function zip<T, TOther, R>(
    array: Array<rxjs$ObservableInput<TOther>>,
    project: (v1: T, ...values: Array<TOther>) => R,
  ): rxjs$OperatorFunction<T, R>;

  declare export function zipAll<T>(): rxjs$OperatorFunction<
    rxjs$ObservableInput<T>,
    T[],
  >;

  declare export function zipAll<T>(): rxjs$OperatorFunction<unknown, T[]>;

  declare export function zipAll<T, R>(
    project: (...values: T[]) => R,
  ): rxjs$OperatorFunction<rxjs$ObservableInput<T>, R>;

  declare export function zipAll<R>(
    project: (...values: Array<any>) => R,
  ): rxjs$OperatorFunction<unknown, R>;

  declare export function iif<T, F>(
    condition: () => boolean,
    trueResult?: rxjs$SubscribableOrPromise<T>,
    falseResult?: rxjs$SubscribableOrPromise<F>,
  ): rxjs$Observable<T | F>;

  declare export function throwError(
    error: any,
    scheduler?: rxjs$SchedulerLike,
  ): rxjs$Observable<unknown>;
}

declare module 'rxjs/ajax' {
  declare export interface AjaxRequest {
    url?: string;
    body?: any;
    user?: string;
    async?: boolean;
    method?: string;
    headers?: Object;
    timeout?: number;
    password?: string;
    hasContent?: boolean;
    crossDomain?: boolean;
    withCredentials?: boolean;
    createXHR?: () => XMLHttpRequest;
    progressSubscriber?: rxjs$Subscriber<unknown>;
    responseType?: string;
  }

  declare export class AjaxResponse {
    originalEvent: Event;
    xhr: XMLHttpRequest;
    request: AjaxRequest;
    status: number;
    response: any;
    responseText: string;
    responseType: string;
    constructor(
      originalEvent: Event,
      xhr: XMLHttpRequest,
      request: AjaxRequest,
    ): void;
  }

  declare export interface AjaxError extends Error {
    xhr: XMLHttpRequest;
    request: AjaxRequest;
    status: number;
    responseType: string;
    response: any;
  }

  declare export interface AjaxTimeoutError extends AjaxError {}

  declare interface AjaxCreationMethod {
    (urlOrRequest: string | AjaxRequest): rxjs$Observable<AjaxResponse>;
    get(url: string, headers?: Object): rxjs$Observable<AjaxResponse>;
    post(
      url: string,
      body?: any,
      headers?: Object,
    ): rxjs$Observable<AjaxResponse>;
    put(
      url: string,
      body?: any,
      headers?: Object,
    ): rxjs$Observable<AjaxResponse>;
    patch(
      url: string,
      body?: any,
      headers?: Object,
    ): rxjs$Observable<AjaxResponse>;
    delete(url: string, headers?: Object): rxjs$Observable<AjaxResponse>;
    getJSON<T>(url: string, headers?: Object): rxjs$Observable<T>;
  }

  declare export var ajax: AjaxCreationMethod;
}

declare module 'rxjs/webSocket' {
  declare type WebSocketMessage = string | ArrayBuffer | Blob;

  declare export interface WebSocketSubjectConfig<T> {
    url: string;
    protocol?: string | Array<string>;
    // @deprecated use {@link deserializer}
    resultSelector?: (e: MessageEvent) => T;
    serializer?: (value: T) => WebSocketMessage;
    deserializer?: (e: MessageEvent) => T;
    openObserver?: rxjs$NextObserver<Event>;
    closeObserver?: rxjs$NextObserver<CloseEvent>;
    closingObserver?: rxjs$NextObserver<void>;
    WebSocketCtor?: {
      new(url: string, protocols?: string | string[]): WebSocket,
      ...
    };
    binaryType?: 'blob' | 'arraybuffer';
  }

  declare class AnonymousSubject<T> extends rxjs$Subject<T> {
    constructor(
      destination?: rxjs$Observer<T>,
      source?: rxjs$Observable<T>,
    ): void;
    next(value: ?T): void;
    error(err: any): void;
    complete(): void;
    // @deprecated This is an internal implementation detail, do not use.
    _subscribe(subscriber: rxjs$Subscriber<T>): rxjs$Subscription;
  }

  declare export class WebSocketSubject<T> extends AnonymousSubject<T> {
    // @deprecated This is an internal implementation detail, do not use.
    _output: rxjs$Subject<T>;
    constructor(
      urlConfigOrSource:
        | string
        | WebSocketSubjectConfig<T>
        | rxjs$Observable<T>,
      destination?: rxjs$Observer<T>,
    ): void;
    lift<R>(operator: rxjs$Operator<T, R>): WebSocketSubject<R>;
    multiplex(
      subMsg: () => any,
      unsubMsg: () => any,
      messageFilter: (value: T) => boolean,
    ): rxjs$Observable<unknown>;
    // @deprecated This is an internal implementation detail, do not use.
    _subscribe(subscriber: rxjs$Subscriber<T>): rxjs$Subscription;
    unsubscribe(): void;
  }

  declare export function webSocket<T>(
    urlConfigOrSource: string | WebSocketSubjectConfig<T>,
  ): WebSocketSubject<T>;
}
