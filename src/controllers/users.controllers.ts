import { Request, Response } from 'express'
import { LoginReqBody, LogoutReqBody, RegisterReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { ErrorWithStatus } from '~/models/Error'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'
export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  // throw new ErrorWithStatus({
  //   message: 'test error',
  //   status: 401
  // })
  //lấy userId từ user của req
  const user = req.user as User
  const user_id = user._id as ObjectId
  //dùng cái userId để tạo access_token và refresh_token
  const result = await usersService.login(user_id.toString())
  //res về access_token và refresh_token cho client
  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const registorController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await usersService.register(req.body)
  res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  //lấy refresh_token từ req.body và vào database xóa refresh_token này
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  res.json(result)
}
