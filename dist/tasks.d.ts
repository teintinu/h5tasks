export declare type Resolver<T> = (this: ITask<T>) => Promise<T>;
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
    log(message: string, ...args: any[]): void;
    declare<C>(opts: {
        name: string;
        count?: number;
        resolver?: Resolver<C>;
        asyncDependencies?: (this: ITask<T>, res: T) => Promise<T>;
    }): ITask<C>;
    was: {
        started(): void;
        successed(res: T | Promise<T>): void;
        rejected(reason: Error): void;
    };
    then<R>(onfulfilled?: (res: T) => R | Promise<R>, onrejected?: (reason: Error) => R | Promise<R>): Promise<R>;
}
declare const Tasks: {
    debug: boolean;
    reset(): void;
    readonly list: ITask<any>[];
    declare<T>(opts: {
        name: string;
        count?: number | undefined;
        parent?: ITask<any> | undefined;
        resolver?: Resolver<T> | undefined;
        asyncDependencies?: ((this: ITask<T>, res: T) => Promise<void>) | undefined;
    }): ITask<T>;
    on: {
        error(callback: (err: Error) => void): void;
    };
    off: {
        error(callback: (err: Error) => void): void;
    };
    log(message: string, ...args: any[]): void;
    asap(callback: () => void): void;
    delay(tm: number): Promise<{}>;
};
export default Tasks;
