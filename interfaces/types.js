type Reviver = {
    toMaker(reviver: string): any,
    sendUI(res: Response, reviver: string): void;
};

type Saver = {
    deliver(id: Object, method: string, ...optArgs: Array<any>): Promise<any>;
    make(makerLocation: string, optInitArgs: ?Array<any>): Object;
    reviver(id: Object): string;
    hasId(ref: any): bool;
    asId(ref: any): Object;
    idToCred(id: Object): string;
    credToId(cred: string): Object;
    live(id: Object): any;
    checkpoint(): Promise<bool>,
    drop(id: Object): void;
};


type ReadAccess = {
  readBytes(): Promise<any>;
  readText(encoding: string): Promise<string>;
  subRd(other: string): ReadAccess;
}


type WriteAccess = {
    writeText(text: string): Promise<void>;
    ro(): ReadAccess;
}


type SyncAccess = {
    existsSync(): boolean;
    readTextSync(encoding: string): string;
    writeSync(text: string): void;
    unsync(): WriteAccess;
}


type SealerPair<T> = {
  seal(x: T): any;
  unseal(boxy: any): T
}
