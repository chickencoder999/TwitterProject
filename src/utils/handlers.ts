import { NextFunction, Request, RequestHandler, Response } from 'express'

export const wrapAsync = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    //tạo ra cấu trúc try catch
    // func(res, req, next)
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
//chỗ này làm curryning được nè
