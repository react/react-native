/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

module.exports = {
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  settings: {
    react: {
      version: 'detect',
    },
  },

  overrides: {
    flow: {
      rules: {
        // Flow Plugin
        // The following rules are made available via `eslint-plugin-ft-flow`
        'ft-flow/define-flow-type': 1,
        'ft-flow/use-flow-type': 1,
      },
    },
    reactNative: {
      rules: {
        '@react-native/no-deep-imports': 1,
      },
    },
    typescript: {
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
          },
        ],
        'no-unused-vars': 'off',
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 1,
        'no-undef': 'off',
      },
    },
    jest: {
      rules: {
        'react-native/no-inline-styles': 0,
      },
    },
  },

  // Map from global var to bool specifying if it can be redefined
  globals: {
    __DEV__: true,
    __dirname: false,
    __fbBatchedBridgeConfig: false,
    AbortController: false,
    Blob: true,
    alert: false,
    cancelAnimationFrame: false,
    cancelIdleCallback: false,
    clearImmediate: true,
    clearInterval: false,
    clearTimeout: false,
    console: false,
    document: false,
    ErrorUtils: false,
    escape: false,
    Event: false,
    EventTarget: false,
    exports: false,
    fetch: false,
    File: true,
    FileReader: false,
    FormData: false,
    global: false,
    Headers: false,
    Intl: false,
    Map: true,
    module: false,
    navigator: false,
    process: false,
    Promise: true,
    requestAnimationFrame: true,
    requestIdleCallback: true,
    require: false,
    Set: true,
    setImmediate: true,
    setInterval: false,
    setTimeout: false,
    queueMicrotask: true,
    URL: false,
    URLSearchParams: false,
    WebSocket: true,
    window: false,
    XMLHttpRequest: false,
  },

  rules: {
    // General
    'no-cond-assign': 1, // disallow assignment in conditional expressions
    'no-console': 0, // disallow use of console (off by default in the node environment)
    'no-const-assign': 2, // disallow assignment to const-declared variables
    'no-constant-condition': 0, // disallow use of constant expressions in conditions
    'no-control-regex': 1, // disallow control characters in regular expressions
    'no-debugger': 1, // disallow use of debugger
    'no-dupe-class-members': 2, // Disallow duplicate name in class members
    'no-dupe-keys': 2, // disallow duplicate keys when creating object literals
    'no-empty': 0, // disallow empty statements
    'no-ex-assign': 1, // disallow assigning to the exception in a catch block
    'no-extra-boolean-cast': 1, // disallow double-negation boolean casts in a boolean context
    'no-func-assign': 1, // disallow overwriting functions written as function declarations
    'no-inner-declarations': 0, // disallow function or variable declarations in nested blocks
    'no-invalid-regexp': 1, // disallow invalid regular expression strings in the RegExp constructor
    'no-negated-in-lhs': 1, // disallow negation of the left operand of an in expression
    'no-obj-calls': 1, // disallow the use of object properties of the global object (Math and JSON) as functions
    'no-regex-spaces': 1, // disallow multiple spaces in a regular expression literal
    'no-sparse-arrays': 1, // disallow sparse arrays
    'no-unreachable': 2, // disallow unreachable statements after a return, throw, continue, or break statement
    'use-isnan': 1, // disallow comparisons with the value NaN
    'valid-jsdoc': 0, // Ensure JSDoc comments are valid (off by default)
    'valid-typeof': 1, // Ensure that the results of typeof are compared against a valid string

    // Best Practices
    // These are rules designed to prevent you from making mistakes. They either prescribe a better way of doing something or help you avoid footguns.

    'block-scoped-var': 0, // treat var statements as if they were block scoped (off by default)
    complexity: 0, // specify the maximum cyclomatic complexity allowed in a program (off by default)
    'consistent-return': 0, // require return statements to either always or never specify values
    'default-case': 0, // require default case in switch statements (off by default)
    'dot-notation': 1, // encourages use of dot notation whenever possible
    eqeqeq: [1, 'allow-null'], // require the use of === and !==
    'guard-for-in': 0, // make sure for-in loops have an if statement (off by default)
    'no-alert': 1, // disallow the use of alert, confirm, and prompt
    'no-caller': 1, // disallow use of arguments.caller or arguments.callee
    'no-div-regex': 1, // disallow division operators explicitly at beginning of regular expression (off by default)
    'no-else-return': 0, // disallow else after a return in an if (off by default)
    'no-eq-null': 0, // disallow comparisons to null without a type-checking operator (off by default)
    'no-eval': 2, // disallow use of eval()
    'no-extend-native': 1, // disallow adding to native types
    'no-extra-bind': 1, // disallow unnecessary function binding
    'no-fallthrough': 1, // disallow fallthrough of case statements
    'no-implied-eval': 1, // disallow use of eval()-like methods
    'no-labels': 1, // disallow use of labeled statements
    'no-iterator': 1, // disallow usage of __iterator__ property
    'no-lone-blocks': 1, // disallow unnecessary nested blocks
    'no-loop-func': 0, // disallow creation of functions within loops
    'no-multi-str': 0, // disallow use of multiline strings
    'no-native-reassign': 0, // disallow reassignments of native objects
    'no-new': 1, // disallow use of new operator when not part of the assignment or comparison
    'no-new-func': 2, // disallow use of new operator for Function object
    'no-new-wrappers': 1, // disallows creating new instances of String,Number, and Boolean
    'no-octal': 1, // disallow use of octal literals
    'no-octal-escape': 1, // disallow use of octal escape sequences in string literals, such as var foo = "Copyright \251";
    'no-proto': 1, // disallow usage of __proto__ property
    'no-redeclare': 0, // disallow declaring the same variable more then once
    'no-return-assign': 1, // disallow use of assignment in return statement
    'no-script-url': 1, // disallow use of javascript: urls.
    'no-self-compare': 1, // disallow comparisons where both sides are exactly the same (off by default)
    'no-sequences': 1, // disallow use of comma operator
    'no-unused-expressions': 0, // disallow usage of expressions in statement position
    'no-useless-escape': 1, // disallow escapes that don't have any effect in literals
    'no-void': 1, // disallow use of void operator (off by default)
    'no-warning-comments': 0, // disallow usage of configurable warning terms in comments": 1,                        // e.g. TODO or FIXME (off by default)
    'no-with': 1, // disallow use of the with statement
    radix: 1, // require use of the second argument for parseInt() (off by default)
    'vars-on-top': 0, // requires to declare all vars on top of their containing scope (off by default)
    yoda: 1, // require or disallow Yoda conditions

    // Variables
    // These rules have to do with variable declarations.

    'no-catch-shadow': 1, // disallow the catch clause parameter name being the same as a variable in the outer scope (off by default in the node environment)
    'no-delete-var': 1, // disallow deletion of variables
    'no-global-assign': 2, // disallow assignments to native objects or read-only global variables
    'no-label-var': 1, // disallow labels that share a name with a variable
    'no-shadow': 1, // disallow declaration of variables already declared in the outer scope
    'no-shadow-restricted-names': 1, // disallow shadowing of names such as arguments
    'no-undef': 2, // disallow use of undeclared variables unless mentioned in a /*global */ block
    'no-undefined': 0, // disallow use of undefined variable (off by default)
    'no-undef-init': 1, // disallow use of undefined when initializing variables
    'no-unused-vars': [
      1,
      {
        vars: 'all',
        args: 'none',
        caughtErrors: 'none',
        ignoreRestSiblings: true,
      },
    ], // disallow declaration of variables that are not used in the code
    'no-use-before-define': 0, // disallow use of variables before they are defined

    // Node.js
    // These rules are specific to JavaScript running on Node.js.

    'handle-callback-err': 1, // enforces error handling in callbacks (off by default) (on by default in the node environment)
    'no-mixed-requires': 1, // disallow mixing regular variable and require declarations (off by default) (on by default in the node environment)
    'no-new-require': 1, // disallow use of new operator with the require function (off by default) (on by default in the node environment)
    'no-path-concat': 1, // disallow string concatenation with __dirname and __filename (off by default) (on by default in the node environment)
    'no-process-exit': 0, // disallow process.exit() (on by default in the node environment)
    'no-restricted-modules': 1, // restrict usage of specified node modules (off by default)
    'no-sync': 0, // disallow use of synchronous methods (off by default)

    // ESLint Comments Plugin
    // The following rules are made available via `eslint-plugin-eslint-comments`
    'eslint-comments/no-aggregating-enable': 1, // disallows eslint-enable comments for multiple eslint-disable comments
    'eslint-comments/no-unlimited-disable': 1, // disallows eslint-disable comments without rule names
    'eslint-comments/no-unused-disable': 1, // disallow disables that don't cover any errors
    'eslint-comments/no-unused-enable': 1, // // disallow enables that don't enable anything or enable rules that weren't disabled

    // Stylistic Issues
    // These rules are purely matters of style and are quite subjective.

    camelcase: 0, // require camel case names
    'consistent-this': 1, // enforces consistent naming when capturing the current execution context (off by default)
    'func-names': 0, // require function expressions to have a name (off by default)
    'func-style': 0, // enforces use of function declarations or expressions (off by default)
    'new-cap': 0, // require a capital letter for constructors
    'no-nested-ternary': 0, // disallow nested ternary expressions (off by default)
    'no-array-constructor': 1, // disallow use of the Array constructor
    'no-empty-character-class': 1, // disallow the use of empty character classes in regular expressions
    'no-lonely-if': 0, // disallow if as the only statement in an else block (off by default)
    'no-new-object': 1, // disallow use of the Object constructor
    'no-ternary': 0, // disallow the use of ternary operators (off by default)
    'no-underscore-dangle': 0, // disallow dangling underscores in identifiers
    'sort-vars': 0, // sort variables within the same declaration block (off by default)
    'max-nested-callbacks': 0, // specify the maximum depth callbacks can be nested (off by default)
    'one-var': 0, // allow just one var statement per function (off by default)

    // Legacy
    // The following rules are included for compatibility with JSHint and JSLint. While the names of the rules may not match up with the JSHint/JSLint counterpart, the functionality is the same.

    'max-depth': 0, // specify the maximum depth that blocks can be nested (off by default)
    'max-params': 0, // limits the number of parameters that can be used in the function declaration. (off by default)
    'max-statements': 0, // specify the maximum number of statement allowed in a function (off by default)
    'no-bitwise': 1, // disallow use of bitwise operators (off by default)
    'no-plusplus': 0, // disallow use of unary operators, ++ and -- (off by default)

    // React Plugin
    // The following rules are made available via `eslint-plugin-react`.

    'react/display-name': 0,
    'react/jsx-boolean-value': 0,
    'react/jsx-no-comment-textnodes': 2,
    'react/jsx-no-duplicate-props': 2,
    'react/jsx-no-undef': 2,
    'react/jsx-sort-props': 0,
    'react/jsx-uses-react': 1,
    'react/jsx-uses-vars': 1,
    'react/no-did-mount-set-state': 1,
    'react/no-did-update-set-state': 1,
    'react/no-multi-comp': 0,
    'react/no-string-refs': 2,
    'react/no-unknown-property': 0,
    'react/no-unstable-nested-components': 1,
    'react/react-in-jsx-scope': 0,
    'react/self-closing-comp': 1,
    'react/wrap-multilines': 0,

    // React-Hooks Plugin
    // The following rules are made available via `eslint-plugin-react-hooks`
    'react-hooks/rules-of-hooks': 2,
    'react-hooks/exhaustive-deps': 2,

    // React-Native Plugin
    // The following rules are made available via `eslint-plugin-react-native`

    'react-native/no-inline-styles': 1,

    // Jest Plugin
    // The following rules are made available via `eslint-plugin-jest`.
    'jest/no-disabled-tests': 1,
    'jest/no-focused-tests': 1,
    'jest/no-identical-title': 1,
    'jest/valid-expect': 1,
  },
};
