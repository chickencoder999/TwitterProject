import {
  ChangePasswordReqBody,
  FollowReqBody,
  GetProfileReqParams,
  RefreshTokenReqBody,
  UnfollowReqParams,
  UpdateMeReqBody
} from './../models/requests/User.requests'
import { NextFunction, Request, Response } from 'express'
import {
  LoginReqBody,
  LogoutReqBody,
  RegisterReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  VerifyEmailReqBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { ErrorWithStatus } from '~/models/Error'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '~/constants/message'
import HTTP_STATUS from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enums'
import { config } from 'dotenv'
config() //để xài đc biến môi trường
export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  // throw new ErrorWithStatus({
  //   message: 'test error',
  //   status: 401
  // })
  //lấy userId từ user của req
  const user = req.user as User
  const user_id = user._id as ObjectId
  //dùng cái userId để tạo access_token và refresh_token
  const result = await usersService.login({ user_id: user_id.toString(), verify: user.verify })
  //res về access_token và refresh_token cho client
  res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
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

export const emailVerifyTokenController = async (
  req: Request<ParamsDictionary, any, VerifyEmailReqBody>,
  res: Response
) => {
  //nếu mà code vào được đây thì email verify token đã hợp lệ
  //và mình đã lấy được decoded_email_verify_token(payload) từ req
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  //dựa vào user_id để tìm user và xem thử nó đã verify chưa
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  //nếu mà ko khớp thì mình throw ra lỗi
  if (user.email_verify_token !== (req.body.email_verify_token as string)) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INCORRECT,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }

  //nếu đã verify rồi thì ko cần verify nữa
  if (user.verify === UserVerifyStatus.Verified && user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_IS_ALREADY_VERIFIED_BEFORE
    })
  }
  //nếu mà  xuống được đây thì account đó user chưa verify
  //mình sẽ update lại user đó
  const result = await usersService.verifyEmail(user_id)
  return res.json({
    message: USERS_MESSAGES.VERIFY_EMAIL_SUCCESS,
    result
  })
}

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  //nếu vào được đây thì access token hợp lệ
  //và mình đã lấy được decoded_authorization
  const { user_id } = req.decoded_authorization as TokenPayload
  //dựa vào user_id tìm xem user đã verify chưa
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  //ko tìm thấy user thì bắn lỗi not found
  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  //nếu đã verify rồi thì ko cần verify nữa
  if (user.verify === UserVerifyStatus.Verified && user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_IS_ALREADY_VERIFIED_BEFORE
    })
  }
  //nếu user này bị banned thì ko cho resend
  if (user.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_IS_BANNED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
  //user này thật sự chưa verify : mình sẽ tạo lại email_verify_token
  //cập nhật lại user
  const result = await usersService.resendEmailVerify(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  //lấy user_id từ user  của req
  const { _id, verify } = req.user as User //dùng = để đặt lại tên cho _id : user_id
  //dùng cái _id tìm và cập nhật lại user thêm vào forgot_password_token
  const result = await usersService.forgotPassword({
    user_id: (_id as ObjectId).toString(),
    verify
  })
  return res.json(result)
}

export const verifyForgotPasswordTokenController = async (req: Request, res: Response) => {
  return res.json({
    message: USERS_MESSAGES.VERTIFY_FORGOT_PASSWORD_TOKEN_SUCCESS
  })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response
) => {
  //muốn đổi mật khẩu thì cần userId và password mới
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  //cập nhật user
  const result = await usersService.resetPassword({ user_id, password })
  return res.json(result)
}

export const getMeController = async (req: Request, res: Response) => {
  //muốn lấy profile của mình thì có user_id của mình
  const { user_id } = req.decoded_authorization as TokenPayload
  //dùng user_id để tìm user
  const user = await usersService.getMe(user_id)
  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  //muốn update thì cần user_id và các thông tin cần update
  const { user_id } = req.decoded_authorization as TokenPayload
  const { body } = req
  //cách 1
  // const body = pick(req.body, [
  //   'name',
  //   'date_of_birth',
  //   'bio',
  //   'location',
  //   'website',
  //   'username',
  //   'avatar',
  //   'cover_photo'
  // ])
  //update lại user
  const result = await usersService.updateMe(user_id, body)
  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result
  })
}

export const getProfileController = async (req: Request<GetProfileReqParams>, res: Response) => {
  //tìm username
  const { username } = req.params
  const user = await usersService.getProfile(username)
  return res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: user
  })
}

export const followController = async (req: Request<ParamsDictionary, any, FollowReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload //lấy user_id từ decoded_authorization của access_token
  const { followed_user_id } = req.body //lấy followed_user_id từ req.body
  const result = await usersService.follow(user_id, followed_user_id) //chưa có method này
  return res.json(result)
}

export const unFollowController = async (req: Request<UnfollowReqParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload //lấy user_id từ decoded_authorization của access_token
  //lấy ra người mà mình muốn unfollow
  const { user_id: followed_user_id } = req.params
  //gọi hàm unfollow
  const result = await usersService.unFollow(user_id, followed_user_id)
  return res.json(result)
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response
) => {
  //muốn đổi mật khẩu thì cần user_id và password mới
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body
  //cập nhật user
  const result = await usersService.changePassword(user_id, password)
  return res.json(result)
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { refresh_token } = req.body
  const { user_id, verify } = req.decoded_refresh_token as TokenPayload
  const result = await usersService.refreshToken({ refresh_token, user_id, verify })
  return res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESSFULLY,
    result
  })
}

export const oAuthController = async (req: Request, res: Response) => {
  const { code } = req.query
  const { access_token, refresh_token, new_user, verify } = await usersService.oAuth(code as string)
  const url = `${process.env.CLIENT_REDIRECT_CALLBACK}?access_token=${access_token}&refresh_token=${refresh_token}&new_user=${new_user}&verify=${verify}`
  return res.redirect(url)
}
