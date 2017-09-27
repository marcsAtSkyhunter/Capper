type Reviver = {
    toMaker(reviver: string): any,
    sendUI(res: Response, reviver: string): void;
};

type Id = {id: string}

type Saver = {
    deliver(id: Id, method: string, ...optArgs: Array<any>): Promise<any>;
    make(makerLocation: string, optInitArgs: ?Array<any>): Object;
    reviver(id: Id): string;
    hasId(ref: any): bool;
    asId(ref: any): Object;
    idToCred(id: Id): string;
    credToId(cred: string): Id;
    live(id: Id): any;
    checkpoint(): Promise<bool>,
    drop(id: Id): void;
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
