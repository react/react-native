// flow-typed version: f7c859e705/yargs_v17.x.x/flow_>=v0.104.x

declare module 'yargs' {
  declare type Argv = {
    [key: string]: any,
    _: Array<string>,
    $0: string,
    ...
  };

  declare type Options = Partial<{
    alias: string | Array<string>,
    array: boolean,
    boolean: boolean,
    choices: Array<unknown>,
    coerce: (arg: {[key: string]: any, ...} | any) => unknown,
    config: boolean,
    configParser: (configPath: string) => {[key: string]: unknown, ...},
    conflicts: string | Array<string> | {[key: string]: string, ...},
    count: boolean,
    default: unknown,
    defaultDescription: string,
    demandOption: boolean | string,
    desc: string,
    describe: string,
    description: string,
    global: boolean,
    group: string,
    hidden: boolean,
    implies: string | {[key: string]: string, ...},
    nargs: number,
    normalize: boolean,
    number: boolean,
    required: boolean,
    requiresArg: boolean,
    skipValidation: boolean,
    string: boolean,
    type: 'array' | 'boolean' | 'count' | 'number' | 'string',
    ...
  }>;

  declare type CommonCommandModule = {|
    command?: string | Array<string>,
    aliases?: Array<string> | string,
    builder?:
      | {[key: string]: Options, ...}
      | ((yargsInstance: Yargs) => unknown),
    handler?: ((argv: Argv) => void) | ((argv: Argv) => Promise<void>),
  |};

  declare type CommandModuleDesc = {|
    ...CommonCommandModule,
    desc?: string | false,
  |};

  declare type CommandModuleDescribe = {|
    ...CommonCommandModule,
    describe?: string | false,
  |};

  declare type CommandModuleDescription = {|
    ...CommonCommandModule,
    description?: string | false,
  |};

  declare type CommandModule =
    | CommandModuleDesc
    | CommandModuleDescribe
    | CommandModuleDescription;

  declare type MiddleWareCallback = (
    argv: Argv,
    yargsInstance?: Yargs,
  ) => void | ((argv: Argv, yargsInstance?: Yargs) => Promise<void>);

  declare type Middleware = MiddleWareCallback | Array<MiddleWareCallback>;

  declare class Yargs {
    (args: Array<string>): Yargs;

    alias(key: string, alias: string): this;
    alias(alias: {[key: string]: string | Array<string>, ...}): this;
    argv: Argv | Promise<Argv>;
    array(key: string | Array<string>): this;
    boolean(parameter: string | Array<string>): this;
    check(fn: (argv: Argv, options: Array<string>) => unknown): this;
    choices(key: string, allowed: Array<string>): this;
    choices(allowed: {[key: string]: Array<string>, ...}): this;
    coerce(key: string, fn: (value: any) => unknown): this;
    coerce(object: {[key: string]: (value: any) => unknown, ...}): this;
    coerce(keys: Array<string>, fn: (value: any) => unknown): this;

    command(
      cmd: string | Array<string>,
      desc: string | false,
      builder?:
        | {[key: string]: Options, ...}
        | ((yargsInstance: Yargs) => unknown),
      handler?: Function,
    ): this;
    command(
      cmd: string | Array<string>,
      desc: string | false,
      module: CommandModule,
    ): this;
    command(module: CommandModule): this;

    commands(
      cmd: string | Array<string>,
      desc: string | false,
      builder?:
        | {[key: string]: Options, ...}
        | ((yargsInstance: Yargs) => unknown),
      handler?: Function,
    ): this;
    commands(
      cmd: string | Array<string>,
      desc: string | false,
      module: CommandModule,
    ): this;
    commands(module: CommandModule): this;

    commandDir(
      directory: string,
      options?: {
        exclude?: string | Function,
        extensions?: Array<string>,
        include?: string | Function,
        recurse?: boolean,
        visit?: Function,
        ...
      },
    ): this;

    completion(
      cmd?: string,
      description?:
        | string
        | false
        | ((
            current: string,
            argv: Argv,
            done: (compeltion: Array<string>) => void,
          ) => ?(Array<string> | Promise<Array<string>>)),
      fn?: (
        current: string,
        argv: Argv,
        done: (completion: Array<string>) => void,
      ) => ?(Array<string> | Promise<Array<string>>),
    ): this;

    config(
      key?: string,
      description?: string,
      parseFn?: (configPath: string) => {[key: string]: unknown, ...},
    ): this;
    config(
      key: string,
      parseFn?: (configPath: string) => {[key: string]: unknown, ...},
    ): this;
    config(config: {[key: string]: unknown, ...}): this;

    conflicts(key: string, value: string | Array<string>): this;
    conflicts(keys: {[key: string]: string | Array<string>, ...}): this;

    count(name: string): this;

    default(key: string, value: unknown, description?: string): this;
    default(defaults: {[key: string]: unknown, ...}): this;

    // Deprecated: use demandOption() and demandCommand() instead.
    demand(key: string, msg?: string | boolean): this;
    demand(count: number, max?: number, msg?: string | boolean): this;

    demandOption(key: string | Array<string>, msg?: string | boolean): this;

    demandCommand(): this;
    demandCommand(min: number, minMsg?: string): this;
    demandCommand(
      min: number,
      max: number,
      minMsg?: string,
      maxMsg?: string,
    ): this;

    describe(key: string, description: string): this;
    describe(describeObject: {[key: string]: string, ...}): this;

    detectLocale(shouldDetect: boolean): this;

    env(prefix?: string): this;

    epilog(text: string): this;
    epilogue(text: string): this;

    example(cmd: string, desc?: string): this;

    exitProcess(enable: boolean): this;

    fail(
      fn:
        | false
        | ((failureMessage: string, err: Error, yargs: Yargs) => unknown),
    ): this;

    getCompletion(
      args: Array<string>,
      fn: (err: Error | null, completions: Array<string> | void) => void,
    ): Promise<Array<string> | void>;

    global(globals: string | Array<string>, isGlobal?: boolean): this;

    group(key: string | Array<string>, groupName: string): this;

    help(option: boolean): this;

    help(option?: string, desc?: string): this;

    hide(key: string): this;

    implies(key: string, value: string | Array<string>): this;
    implies(keys: {[key: string]: string | Array<string>, ...}): this;

    locale(
      locale:
        | 'de'
        | 'en'
        | 'es'
        | 'fr'
        | 'hi'
        | 'hu'
        | 'id'
        | 'it'
        | 'ja'
        | 'ko'
        | 'nb'
        | 'pirate'
        | 'pl'
        | 'pt'
        | 'pt_BR'
        | 'ru'
        | 'th'
        | 'tr'
        | 'zh_CN',
    ): this;
    locale(): string;

    middleware(
      middlewareCallbacks: Middleware,
      applyBeforeValidation?: boolean,
    ): this;

    nargs(key: string, count: number): this;

    normalize(key: string): this;

    number(key: string | Array<string>): this;

    option(key: string, options?: Options): this;
    option(optionMap: {[key: string]: Options, ...}): this;

    options(key: string, options?: Options): this;
    options(optionMap: {[key: string]: Options, ...}): this;

    parse(
      args?: string | Array<string>,
      context?: {[key: string]: any, ...},
      parseCallback?: (err: Error, argv: Argv, output?: string) => void,
    ): Argv | Promise<Argv>;
    parse(
      args?: string | Array<string>,
      parseCallback?: (err: Error, argv: Argv, output?: string) => void,
    ): Argv | Promise<Argv>;

    parseAsync(
      args?: string | Array<string>,
      context?: {[key: string]: any, ...},
      parseCallback?: (err: Error, argv: Argv, output?: string) => void,
    ): Promise<Argv>;
    parseAsync(
      args?: string | Array<string>,
      parseCallback?: (err: Error, argv: Argv, output?: string) => void,
    ): Promise<Argv>;

    parseSync(
      args?: string | Array<string>,
      context?: {[key: string]: any, ...},
      parseCallback?: (err: Error, argv: Argv, output?: string) => void,
    ): Argv;
    parseSync(
      args?: string | Array<string>,
      parseCallback?: (err: Error, argv: Argv, output?: string) => void,
    ): Argv;

    parserConfiguration(configuration: {[key: string]: any, ...}): this;

    pkgConf(key: string, cwd?: string): this;

    positional(key: string, opt?: Options): this;

    recommendCommands(): this;

    // Alias of demand()
    require(key: string, msg: string | boolean): this;
    require(count: number, max?: number, msg?: string | boolean): this;

    requiresArg(key: string | Array<string>): this;

    scriptName(name: string): this;

    showCompletionScript(): this;

    showHelp(consoleLevel?: 'error' | 'warn' | 'log'): this;
    showHelp(printCallback: (usageData: string) => void): this;

    showHelpOnFail(enable: boolean, message?: string): this;

    skipValidation(key: string): this;

    showVersion(consoleLevel?: 'error' | 'warn' | 'log'): this;
    showVersion(printCallback: (usageData: string) => void): this;

    strict(enabled?: boolean): this;

    strictCommands(enabled?: boolean): this;

    strictOptions(enabled?: boolean): this;

    string(key: string | Array<string>): this;

    terminalWidth(): number;

    updateLocale(obj: {[key: string]: string, ...}): this;
    updateStrings(obj: {[key: string]: string, ...}): this;

    usage(message: string, opts?: {[key: string]: Options, ...}): this;
    usage(
      message: string,
      desc?: string,
      builder: CommonCommandModule['builder'],
      handler: CommonCommandModule['handler'],
    ): this;

    version(): this;
    version(version: string | false): this;
    version(option: string | (() => string), version: string): this;
    version(
      option: string | (() => string),
      description: string | (() => string),
      version: string,
    ): this;

    wrap(columns: number | null): this;
  }

  declare module.exports: Yargs;
}
