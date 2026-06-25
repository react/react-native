/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Node} from 'react';

import * as React from 'react';
import {useEffect, useState} from 'react';

// Flow enum
enum Status {
  Active,
  Inactive,
  Pending,
}

// Private class fields and methods
class Counter {
  #count: number = 0;
  static #instances: number = 0;

  constructor() {
    Counter.#instances++;
  }

  #increment(): void {
    this.#count++;
  }

  // $FlowExpectedError[unsafe-getters-setters] - Testing getter syntax
  get value(): number {
    return this.#count;
  }

  increment(): void {
    this.#increment();
  }

  // $FlowExpectedError[unsafe-getters-setters] - Testing static getter syntax
  static get instanceCount(): number {
    return Counter.#instances;
  }
}

// Async generator function
async function* asyncNumberGenerator(
  max: number,
): AsyncGenerator<number, void, void> {
  for (let i = 0; i < max; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    yield i;
  }
}

// Async/await patterns
async function fetchData(url: string): Promise<{data: unknown}> {
  const response = await fetch(url);
  const data = await response.json();
  return {data};
}

// Optional chaining and nullish coalescing
function getNestedValue(obj: ?{a?: {b?: {c?: number}}}): number {
  return obj?.a?.b?.c ?? 42;
}

// Class with various features
class Animal {
  name: string;
  #age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.#age = age;
  }

  speak(): string {
    return `${this.name} makes a sound`;
  }

  // $FlowExpectedError[unsafe-getters-setters] - Testing getter syntax
  get age(): number {
    return this.#age;
  }
}

class Dog extends Animal {
  breed: string;

  constructor(name: string, age: number, breed: string) {
    super(name, age);
    this.breed = breed;
  }

  speak(): string {
    return `${this.name} barks!`;
  }

  async fetchTreats(): Promise<Array<string>> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return ['bone', 'biscuit', 'toy'];
  }
}

// Destructuring patterns
function processUser({
  name,
  age = 18,
  ...rest
}: {
  name: string,
  age?: number,
  city?: string,
  ...
}): string {
  const {city = 'Unknown'} = rest;
  return `${name} (${age}) from ${city}`;
}

// Spread operators
function mergeConfigs<T extends {}>(
  base: T,
  ...overrides: ReadonlyArray<Partial<T>>
): T {
  // $FlowExpectedError[incompatible-return] - Testing spread syntax
  // $FlowExpectedError[incompatible-type] - Testing spread syntax
  return {...base, ...overrides.reduce((acc, o) => ({...acc, ...o}), {})};
}

// for...of with destructuring
function sumPairs(pairs: Array<[number, number]>): number {
  let total = 0;
  for (const [a, b] of pairs) {
    total += a + b;
  }
  return total;
}

// Named capturing groups in regex
function parseDate(
  dateString: string,
): ?{year: string, month: string, day: string} {
  const regex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
  const match = dateString.match(regex);
  if (match?.groups) {
    return {
      year: match.groups.year,
      month: match.groups.month,
      day: match.groups.day,
    };
  }
  return null;
}

// Try-catch with optional binding
function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

// Unicode regex
function matchEmoji(text: string): ?string {
  const match = text.match(/\p{Emoji}/u);
  return match?.[0];
}

// Class expression
const MyClass = class {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
};

// Dynamic import (syntax only)
async function loadModule(): Promise<unknown> {
  // $FlowExpectedError[cannot-resolve-module] - Testing dynamic import syntax
  const module = await import('./some-module');
  return module.default;
}

// React component using createClass pattern (legacy)
// $FlowExpectedError[prop-missing] - Testing legacy React.createClass
// $FlowExpectedError[signature-verification-failure] - Testing legacy React.createClass
const LegacyComponent = React.createClass({
  displayName: 'LegacyComponent',
  getInitialState() {
    return {count: 0};
  },
  render() {
    // $FlowExpectedError[object-this-reference] - Testing legacy this reference
    return <div>{this.state.count}</div>;
  },
});

// Modern React functional component with hooks
function ModernComponent({initialCount = 0}: {initialCount?: number}): Node {
  const [count, setCount] = useState<number>(initialCount);
  const [status, setStatus] = useState<Status>(Status.Active);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleAsyncClick(): Promise<void> {
    const data = await fetchData('/api/data');
    console.log(data);
  }

  const handleClick = async () => {
    await handleAsyncClick();
    setStatus(Status.Pending);
  };

  return (
    <div>
      <span data-testid="count">{count}</span>
      <span data-testid="status">{String(status)}</span>
      <button onClick={handleClick}>Increment</button>
      <LegacyComponent />
    </div>
  );
}

// Export default from syntax
// $FlowExpectedError[cannot-resolve-module] - Testing export default from syntax
export {fetchData as default} from './data-utils';

// Named exports
export {
  Counter,
  Animal,
  Dog,
  asyncNumberGenerator,
  getNestedValue,
  processUser,
  mergeConfigs,
  sumPairs,
  parseDate,
  safeJsonParse,
  matchEmoji,
  MyClass,
  loadModule,
  ModernComponent,
  LegacyComponent,
};

// Type exports
export type {Node};
