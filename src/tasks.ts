
export type Resolver<T> = (this: ITask<T>) => Promise<T>

export interface ITask<T> {
    readonly parent: ITask<any> | undefined;
    readonly children: ITask<any>[]
    readonly name: string;
    readonly fullname: string,
    progress: number,
    readonly ETF: Date;
    readonly running: boolean,
    readonly pending: boolean,
    readonly success: boolean,
    readonly failed: boolean,
    readonly reason: Error,
    readonly promise: Promise<T>;
    log(message: string, ...args: any[]): void;
    declare<C>(opts: {
        name: string,
        count?: number,
        resolver?: Resolver<C>,
        asyncDependencies?: (this: ITask<T>, res: T) => Promise<T>
    }): ITask<C>,
    was: {
        started(): void,
        successed(res: T | Promise<T>): void,
        rejected(reason: Error): void,
    },
    then<R>(onfulfilled?: (res: T) => R | Promise<R>, onrejected?: (reason: Error) => R | Promise<R>): Promise<R>,
}

const Tasks = {
    debug: false,
    reset() {
        _tasks = [];
        _on.error = [];
    },
    get list() {
        return [..._tasks];
    },
    declare<T>(opts: {
        name: string,
        count?: number,
        parent?: ITask<any>,
        resolver?: Resolver<T>,
        asyncDependencies?: (this: ITask<T>, res: T) => Promise<void>
    }): ITask<T> {
        const j = internalTask(opts);
        _tasks.push(j);
        return j;
    },
    on: {
        error(callback: (err: Error) => void) {
            const i = _on.error.indexOf(callback);
            if (i === -1) _on.error.push(callback);
        }
    },
    off: {
        error(callback: (err: Error) => void) {
            const i = _on.error.indexOf(callback);
            if (i > -1) _on.error.splice(i, 1);
        }
    },
    log(message: string, ...args: any[]) {
        log(null, message, ...args);
    },
    asap(callback: () => void) {
        setTimeout(callback, 1);
    },
    async delay(tm: number) {
        return new Promise((resolve) =>
            setTimeout(() => resolve(), tm)
        );
    },
}

export default Tasks;

let _tasks: ITask<any>[] = [];
let _on = {
    error: [] as Array<(err: Error) => void>,
}

function dispatch(event: keyof typeof _on, ...args: any[]) {
    _on[event].forEach((callback: (...args: any[]) => void) =>
        Tasks.asap(() => callback(...args)));
}

function dispatch_error(err: Error) {
    dispatch('error', err);
}

function internalTask<T>(opts: {
    name: string,
    parent?: ITask<any>,
    count?: number,
    resolver?: Resolver<T>,
    asyncDependencies?: (this: ITask<T>, res: T) => Promise<void>
}): ITask<T> {
    /*
      0 - declared
      1 - running
      2 - success
      3 - error
    */
    let _state: 0 | 1 | 2 | 3 = 0;
    let _reason: Error;
    let _progress: number;
    let _startedAt: Date;
    let _tryResolve: (res: T, noAsyncDeps?: boolean) => void;
    let _tryReject: (reason: Error) => void;
    let _children: Array<ITask<any>> = [];
    let _promise: Promise<T>;
    const self: ITask<T> = {
        get parent() {
            return opts.parent;
        },
        get children() {
            return [..._children];
        },
        get name() {
            return opts.name;
        },
        get fullname() {
            if (opts.parent)
                return [opts.parent.fullname, opts.name].join('/');
            return opts.name;
        },
        get progress() {
            return _progress;
        },
        set progress(value) {
            _progress = value;
        },
        get ETF() {
            return new Date(new Date().getTime() + 1);
        },
        get running() {
            return _state === 1;
        },
        get pending() {
            return _state < 2;
        },
        get success() {
            return _state === 2;
        },
        get failed() {
            return _state === 3;
        },
        get reason() {
            return _reason;
        },
        get promise() {
            return _promise;
        },
        log(message: string, ...args: any[]) {
            log(self, message, ...args);
        },
        declare<C>(opts: {
            name: string,
            count?: number,
            resolver?: Resolver<C>,
            asyncDependencies?: (this: ITask<T>, res: T) => Promise<T>
        }): ITask<C> {
            const chield: ITask<C> = internalTask<C>({
                parent: self,
                name: opts.name,
                resolver: opts.resolver,
            });
            _children.push(chield);
            return chield;
        },
        was: {
            started(): void {
                if (_state !== 0) throw new Error('Can\' restart');
                _state = 1;
                if (opts.parent && (!opts.parent.running))
                    opts.parent.was.started();
                if (Tasks.debug) log(self, 'started');
            },
            successed(res: T | Promise<T>): void {
                if (_state === 3) throw new Error('was failed');
                if (typeof res === 'object' && res instanceof Promise)
                    res.then(self.was.successed, self.was.rejected);
                else {
                    _tryResolve(res);
                    if (Tasks.debug) log(self, 'successed', JSON.stringify(res));
                }
            },
            rejected(reason: Error): void {
                _tryReject(reason);
                if (Tasks.debug) log(self, 'rejected', reason);
            },
        },
        then(onfulfilled, onrejected) {
            return _promise.then(onfulfilled, onrejected);
        },
    }
    if (Tasks.debug) log(self, 'declared');
    _promise = new Promise(
        (promResolve, promReject) => {
            _tryResolve = (res: T, noAsyncDeps?: boolean): void => {
                if (_state > 1) return;
                if (typeof res === 'object' && res instanceof Promise) {
                    res.then(_tryResolve, _tryReject);
                    return
                }
                let _childrenSuccess = 0;
                let _reason: Error | undefined;
                let _childrenPending: Promise<any>[] = [];
                for (let c of _children) {
                    if (c.success) _childrenSuccess++;
                    else if (c.failed) {
                        _reason = _reason || c.reason;
                    }
                    else _childrenPending.push(c.promise);
                }
                // if (Tasks.debug)
                //     log(self, JSON.stringify({ l: _children.length, _childrenSuccess, _childrenFailed, _childrenPending }))
                if (_childrenPending.length === 0) {
                    if (_reason) _tryReject(_reason);
                    else if (_state !== 3) {
                        if (opts.asyncDependencies && !noAsyncDeps) {
                            opts.asyncDependencies.call(self, res)
                                .then(() => _tryResolve(res, true), _tryReject)
                        }
                        else {
                            _state = 2;
                            promResolve(res);
                        }
                    }
                }
                else Promise.all(_childrenPending)
                    .then(() => _tryResolve(res), _tryReject);
            };
            _tryReject = (reason) => {
                if (_state === 3) return;
                _state = 3;
                _reason = reason;
                promReject(_reason);
                dispatch_error(_reason);
            };
            if (opts.resolver) {
                Tasks.asap(() => {
                    if (opts.resolver)
                        try {
                            self.was.started();
                            const res = opts.resolver.call(self);
                            self.was.successed(res);
                        }
                        catch (e) {
                            self.was.rejected(e);
                        }
                });
            }
        });
    return self;
}

function log(task: ITask<any> | null, msg: string, ...args: any[]) {
    if (task)
        console.log([task.fullname, msg, ...args].join(' '));
    else
        console.log([msg, ...args].join(' '));
}