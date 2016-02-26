// cribbed from
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/node/node.d.ts
type FSAccess = {
  writeFile(filename: string, data: any, callback?: (err: ErrnoException) => void): void;
}
type FSSync = {
    existsSync(path: string): boolean;
    readFileSync<T, U>(filename: string, options?: T): U;
    writeFileSync(filename: string, data: string | Buffer, options?: { encoding?: string; mode?: number; flag?: string; }): void;
    mkdirSync(path: string, mode?: number): void;
    readdirSync(path: string): string[];
    statSync(path: string): Stats;
}

type Buffer = {
    length: number
}

type Path = {
    join(...paths: any[]): string;
    dirname(p: string): string;
}

type Stats = {
    isFile(): boolean;
    isDirectory(): boolean;
    isBlockDevice(): boolean;
    isCharacterDevice(): boolean;
    isSymbolicLink(): boolean;
    isFIFO(): boolean;
    isSocket(): boolean;
    dev: number;
    ino: number;
    mode: number;
    nlink: number;
    uid: number;
    gid: number;
    rdev: number;
    size: number;
    blksize: number;
    blocks: number;
    atime: Date;
    mtime: Date;
    ctime: Date;
    birthtime: Date;
}

type ErrnoException = any;

type Crypto = {
  randomBytes(qty: number): Array<number>
}

