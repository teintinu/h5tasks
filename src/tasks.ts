
export type Resolver<T> = (this: ITask<T>) => Promise<T>;

export interface ITask<T> {
    readonly parent: ITask<any> | undefined;
    readonly children: Array<ITask<any>>;
    readonly name: string;
    readonly fullname: string;
    progress: number;
    readonly ETF: Date;
    readonly running: boolean;
    readonly pending: boolean;
    readonly success: boolean;
    readonly failed: boolean;
    readonly reason: Error;
    readonly promise: Promise<T>;
    was: {
        started(): void,
        successed(res: T | Promise<T>): void,
        rejected(reason: Error): void,
    };
    log(message: string, ...args: any[]): void;
    declare<C>(opts: {
        name: string,
        count?: number,
        resolver?: Resolver<C>,
        asyncDependencies?: (this: ITask<T>, res: T) => Promise<T>,
    }): ITask<C>;
    then<R>(onfulfilled?: (res: T) => R | Promise<R>, onrejected?: (reason: Error) => R | Promise<R>): Promise<R>;
}

const Tasks = {
    debug: false,
    reset() {
        rootTasks = [];
        events.error = [];
    },
    get list() {
        return [...rootTasks];
    },
    declare<T>(opts: {
        name: string,
        count?: number,
        parent?: ITask<any>,
        resolver?: Resolver<T>,
        asyncDependencies?: (this: ITask<T>, res: T) => Promise<void>,
    }): ITask<T> {
        const j = internalTask(opts);
        rootTasks.push(j);
        return j;
    },
    off: {
        error(callback: (err: Error) => void) {
            const i = events.error.indexOf(callback);
            if (i > -1) { events.error.splice(i, 1); }
        },
    },
    on: {
        error(callback: (err: Error) => void) {
            const i = events.error.indexOf(callback);
            if (i === -1) { events.error.push(callback); }
        },
    },
    log(message: string, ...args: any[]) {
        log(null, message, ...args);
    },
    asap(callback: () => void) {
        setTimeout(callback, 1);
    },
    async delay(tm: number) {
        return new Promise((resolve) =>
            setTimeout(() => resolve(), tm),
        );
    },
};

export default Tasks;

let rootTasks: Array<ITask<any>> = [];
const events = {
    error: [] as Array<(err: Error) => void>,
};

function dispatch(event: keyof typeof events, ...args: any[]) {
    events[event].forEach((callback: (...args: any[]) => void) =>
        Tasks.asap(() => callback(...args)));
}

function dispatch_error(err: Error) {
    dispatch("error", err);
}

function internalTask<T>(opts: {
    name: string,
    parent?: ITask<any>,
    count?: number,
    resolver?: Resolver<T>,
    asyncDependencies?: (this: ITask<T>, res: T) => Promise<void>,
}): ITask<T> {
    /*
      0 - declared
      1 - running
      2 - success
      3 - error
    */
    let lState: 0 | 1 | 2 | 3 = 0;
    let sReason: Error;
    let lProgress: number;
    let lStartedAt: Date;
    let tryResolve: (res: T, noAsyncDeps?: boolean) => void;
    let tryReject: (reason: Error) => void;
    const lChildren: Array<ITask<any>> = [];
    let lPromise: Promise<T>;
    const self: ITask<T> = {
        get parent() {
            return opts.parent;
        },
        get children() {
            return [...lChildren];
        },
        get name() {
            return opts.name;
        },
        get fullname() {
            if (opts.parent) {
                return [opts.parent.fullname, opts.name].join("/");
            }
            return opts.name;
        },
        get progress() {
            return lProgress;
        },
        set progress(value) {
            lProgress = value;
        },
        get ETF() {
            return new Date(new Date().getTime() + 1);
        },
        get running() {
            return lState === 1;
        },
        get pending() {
            return lState < 2;
        },
        get success() {
            return lState === 2;
        },
        get failed() {
            return lState === 3;
        },
        get reason() {
            return sReason;
        },
        get promise() {
            return lPromise;
        },
        log(message: string, ...args: any[]) {
            log(self, message, ...args);
        },
        declare<C>(cOpts: {
            name: string,
            count?: number,
            resolver?: Resolver<C>,
            asyncDependencies?: (this: ITask<T>, res: T) => Promise<T>,
        }): ITask<C> {
            const chield: ITask<C> = internalTask<C>({
                name: cOpts.name,
                parent: self,
                resolver: cOpts.resolver,
            });
            lChildren.push(chield);
            return chield;
        },
        was: {
            started(): void {
                if (lState !== 0) { throw new Error("Can' restart"); }
                lState = 1;
                if (opts.parent && (!opts.parent.running)) {
                    opts.parent.was.started();
                }
                if (Tasks.debug) { log(self, "started"); }
            },
            successed(res: T | Promise<T>): void {
                if (lState === 3) { throw new Error("was failed"); }
                if (typeof res === "object" && res instanceof Promise) {
                    res.then(self.was.successed, self.was.rejected);
                } else {
                    tryResolve(res);
                    if (Tasks.debug) { log(self, "successed", JSON.stringify(res)); }
                }
            },
            rejected(reason: Error): void {
                tryReject(reason);
                if (Tasks.debug) { log(self, "rejected", reason); }
            },
        },
        then(onfulfilled, onrejected) {
            return lPromise.then(onfulfilled, onrejected);
        },
    };
    if (Tasks.debug) { log(self, "declared"); }
    lPromise = new Promise(
        (promResolve, promReject) => {
            lStartedAt = new Date();
            tryResolve = (res: T, noAsyncDeps?: boolean): void => {
                if (lState > 1) { return; }
                if (typeof res === "object" && res instanceof Promise) {
                    res.then(tryResolve, tryReject);
                    return;
                }
                let rChildrenSuccess = 0;
                let rReason: Error | undefined;
                const rChildrenPending: Array<Promise<any>> = [];
                for (const c of lChildren) {
                    if (c.success) { rChildrenSuccess++; } else if (c.failed) {
                        rReason = rReason || c.reason;
                    } else { rChildrenPending.push(c.promise); }
                }
                // if (Tasks.debug)
                //     log(self, JSON.stringify({
                //         l: _children.length,
                //         _childrenSuccess,
                //         _childrenFailed,
                //         _childrenPending
                //     }))
                if (rChildrenPending.length === 0) {
                    if (rReason) { tryReject(rReason); } else if (lState !== 3) {
                        if (opts.asyncDependencies && !noAsyncDeps) {
                            opts.asyncDependencies.call(self, res)
                                .then(() => tryResolve(res, true), tryReject);
                        } else {
                            lState = 2;
                            promResolve(res);
                        }
                    }
                } else {
                    Promise.all(rChildrenPending)
                        .then(() => tryResolve(res), tryReject);
                }
            };
            tryReject = (reason) => {
                if (lState === 3) { return; }
                lState = 3;
                sReason = reason;
                promReject(sReason);
                dispatch_error(sReason);
            };
            if (opts.resolver) {
                Tasks.asap(() => {
                    if (opts.resolver) {
                        try {
                            self.was.started();
                            const res = opts.resolver.call(self);
                            self.was.successed(res);
                        } catch (e) {
                            self.was.rejected(e);
                        }
                    }
                });
            }
        });
    return self;
}

function log(task: ITask<any> | null, msg: string, ...args: any[]) {
    if (task) {
        // tslint:disable:no-console
        console.log([task.fullname, msg, ...args].join(" "));
    } else {
        // tslint:disable:no-console
        console.log([msg, ...args].join(" "));
    }
}
