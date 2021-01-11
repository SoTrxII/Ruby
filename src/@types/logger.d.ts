interface LogFn {
    /* tslint:disable:no-unnecessary-generics */
    <T extends object>(obj: T, msg?: string, ...args: any[]): void;
    (msg: string, ...args: any[]): void;
}

export interface ILogger {
    info: LogFn;
    log: LogFn;
    error: LogFn;
    warn: LogFn;
    fatal: LogFn;
    trace: LogFn;
    debug: LogFn;
}
