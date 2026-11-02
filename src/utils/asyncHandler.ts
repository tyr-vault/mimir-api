import type { NextFunction, Request, Response } from 'express';

const asyncHandler = <TReq extends Request = Request, TRes extends Response = Response>(
    requestHandler: (req: TReq, res: TRes, next: NextFunction) => Promise<unknown>,
) => {
    return (req: TReq, res: TRes, next: NextFunction): void => {
        Promise.resolve(requestHandler(req, res, next)).catch((err: unknown) => next(err));
    };
};

export default asyncHandler;
