# React Native Timing

[🏠 Home](../../../../../../__docs__/README.md)

This directory contains the shared C++ implementation of high-resolution timing
primitives for React Native. These primitives provide precise time measurement
capabilities that align with Web standards while being optimized for the React
Native environment.

## 🚀 Usage

The timing primitives in this module are primarily used by internal React Native
systems that require precise time measurements. The monotonic clock is used for
these primitives: they should be used for measuring time intervals. These
primitives should not be used for wall times. They are not expected to be used
directly by application developers but serve as foundational components for
various React Native features.

Key primitives include:

- `HighResTimeStamp`: A class representing a specific point in time with high
  precision.
- `HighResDuration`: A class representing a duration of time with high
  precision.

These primitives support various operations:

```cpp
// Getting the current high-resolution timestamp
auto start = HighResTimeStamp::now();

// Creating durations
auto duration = HighResDuration::fromNanoseconds(100);
auto durationMs = HighResDuration::fromMilliseconds(100);

// Arithmetic operations
auto later = start + duration;
auto elapsed = later - start;

// Converting to absolute time units of highest precision
auto end = HighResTimeStamp::now();
int64_t nanoseconds = (end - start).toNanoseconds();

// Converting to DOMHighResTimeStamp (for JavaScript interoperability)
double jsTimeValue = now.toDOMHighResTimeStamp();
```

## 📐 Design

The timing primitives are designed to align with Web standards while leveraging
C++'s type system and the performance characteristics of native code. The
implementation uses `std::chrono` internally but provides a more specialized
interface tailored to React Native's needs.

### Platform-Specific Clock Sources

On different platforms, `HighResTimeStamp` uses different underlying clock
sources to ensure compatibility with platform-specific timing APIs:

- **iOS/macOS**: Uses `mach_absolute_time()`, which measures time since device
  boot and **excludes sleep time**. This ensures compatibility with iOS system
  APIs (like `UITouch.timestamp` and `NSProcessInfo.processInfo.systemUptime`)
  and native performance logging systems that use the same clock source.

- **Other platforms**: Uses `std::chrono::steady_clock`, which provides a
  monotonic clock that may include or exclude sleep time depending on the
  platform.

This design ensures that timestamps recorded in JavaScript and passed to native
systems will have correct timing on all platforms.

### HighResTimeStamp

This class represents a specific point in time with high precision. It
encapsulates a `std::chrono::steady_clock::time_point` and provides methods to:

- Convert to `DOMHighResTimeStamp` for JavaScript interoperability.
- Perform arithmetic operations with durations.
- Compare with other timestamps.

### HighResDuration

This class represents a duration of time with high precision. It encapsulates a
`std::chrono::duration` and provides methods to:

- Convert to `DOMHighResTimeStamp` for JavaScript interoperability.
- Convert to an absolute number of nanoseconds.
- Perform arithmetic operations.
- Compare with other durations.

## 🔗 Relationship with other systems

### Used by

- [Event Loop](../../renderer/runtimescheduler/__docs__/README.md): Uses timing
  primitives for measuring task execution times and scheduling.
- Web Performance API: Timing primitives are used to implement performance
  measurement APIs like `PerformanceObserver` entries (e.g., `longtask` and
  `event`).
- React Native DevTools: The timing primitives integrate with the React Native
  DevTools tracing infrastructure to report the timing of tasks and events.

### Related to

- Web timing APIs: The timing primitives are designed to be compatible with Web
  timing concepts, making it easier to implement Web-compatible APIs in React
  Native.
