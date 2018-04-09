export declare type Resolver<T> = (this: ITask<T>) => Promise<T>;
export declare type AsyncDependencies<T> = (this: ITask<T>, res: T) => Promise<void>;
export interface ITask<T> extends Promise<T> {
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
    was: {
        started(): void;
        successed(res: T | Promise<T>): void;
        rejected(reason: Error): void;
    };
    declare<C>(opts: {
        name: string;
        count?: number;
        resolver?: Resolver<C>;
        asyncDependencies?: AsyncDependencies<T>;
    }): ITask<C>;
    error(msg: string): Error;
}
export declare type Debug = (task: undefined | ITask<any>, ...args: any[]) => void;
declare const Tasks: {
    reset(): void;
    readonly list: ITask<any>[];
    debug: true | Debug | undefined;
    declare<T>(opts: {
        name: string;
        count?: number | undefined;
        parent?: ITask<any> | undefined;
        resolver?: Resolver<T> | undefined;
        asyncDependencies?: AsyncDependencies<T> | undefined;
    }): ITask<T>;
    off: {
        error(callback: (err: Error) => void): void;
    };
    on: {
        error(callback: (err: Error) => void): void;
    };
    asap(callback: () => void): void;
    delay(tm: number): Promise<{}>;
    error(task: ITask<any> | undefined, msg: string): Error;
};
export default Tasks;
