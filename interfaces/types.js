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

type Loader = (path: string) => any;

type FileUtils = {
    makeNewServer(): void;
    copyRecurse(src : string, dest : string): void;
}


type SealerPair<T> = {
  seal(x: T): any;
  unseal(boxy: any): T
}

type Unique = {
  unique(): string
}

