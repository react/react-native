/**
 * Differ Utilities Module Documentation
 * 
 * Purpose:
 * --------
 * Provides optimized equality comparison functions for React Native styling
 * and layout calculations. These are specialized differ functions designed for
 * high-performance use in the render loop where speed is critical.
 * 
 * Return Value Convention:
 * -----------------------
 * All differ functions return:
 *   - true  = values are DIFFERENT
 *   - false = values are EQUAL
 * 
 * This is opposite to standard JS equality (===) and is optimized for
 * React's shouldComponentUpdate pattern.
 * 
 * Available Functions:
 * -------------------
 * 
 * deepDiffer(one, two, maxDepth?, options?)
 *   Deep recursive comparison for arbitrary objects/arrays
 *   - O(n) worst case, but short-circuits on first difference
 *   - Supports max depth limiting to avoid excessive recursion
 *   - Handles circular references gracefully
 * 
 * matricesDiffer(one, two)
 *   Optimized for 4x4 transformation matrices
 *   - O(1) fixed size, checks indices by change likelihood
 *   - Critical for transform performance
 * 
 * pointsDiffer(one, two)
 *   Compares {x, y} coordinate pairs
 *   - O(1) tiny allocation footprint
 *   - Null-safe with dummy object fallback
 * 
 * sizesDiffer(one, two)
 *   Compares {width, height} dimensions
 *   - O(1) with graceful null handling
 *   - Commonly used in layout calculations
 * 
 * insetsDiffer(one, two)
 *   Compares {top, left, right, bottom} spacing
 *   - O(1) for padding/margin comparisons
 *   - Null-safe with dummy fallback
 * 
 * Performance Characteristics:
 * ---------------------------
 * All functions are allocation-free after initialization and suitable for
 * use in hot paths like render methods and event handlers.
 */
