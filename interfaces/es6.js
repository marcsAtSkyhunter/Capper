// cribbed from
// https://github.com/Microsoft/TypeScript/blob/master/src/lib/es6.d.ts
//
// Proxy.create seems to be part of harmon proxies,
// which "is superseded by the newer "direct proxies API."
// http://wiki.ecmascript.org/doku.php?id=harmony:proxies

type PropertyKey = string | number | Symbol;

type ProxyHandler<T> = {
    getPrototypeOf? : (target: T) => any;
    setPrototypeOf? : (target: T, v: any) => boolean;
    isExtensible? : (target: T) => boolean;
    preventExtensions? : (target: T) => boolean;
    // getOwnPropertyDescriptor? : (target: T, p: PropertyKey) => PropertyDescriptor;
    has? : (target: T, p: PropertyKey) => boolean;
    get? : (target: T, p: PropertyKey, receiver: any) => any;
    set? : (target: T, p: PropertyKey, value: any, receiver: any) => boolean;
    deleteProperty? : (target: T, p: PropertyKey) => boolean;
    // defineProperty? : (target: T, p: PropertyKey, attributes: PropertyDescriptor) => boolean;
    enumerate? : (target: T) => PropertyKey[];
    ownKeys? : (target: T) => PropertyKey[];
    apply? : (target: T, thisArg: any, argArray?: any) => any;
    construct? : (target: T, thisArg: any, argArray?: any) => any;
}

type ProxyConstructor = {
    revocable<T>(target: T, handler: ProxyHandler<T>): { proxy: T; revoke: () => void; };
    new <T>(target: T, handler: ProxyHandler<T>): T;

    create <T>(handler: ProxyHandler<T>): T
}
declare var Proxy: ProxyConstructor;

