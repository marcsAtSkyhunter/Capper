type Application = any;

/* TODO:
type Application = {
    get(route: string, ...handers: RequestHandler[]): void;
};
*/

type RequestHandler = (req: Request, res: Response, next: NextFunction) => any;
type NextFunction = (err: any) => void;
type Request = { };
type Response = {
    sendfile(path: string): void;
}

