import databaseService from '~/services/database.services'
import { USERS_MESSAGES } from '~/constants/message'
//giả sử anh Điệp muốn làm 1 cái route '/login'
//thì người dùng muốn sẽ truyền email và password
//tạo 1 cái request có body là email và password
//nhớ import Request, Response, NextFunction từ express
import { Request, Response, NextFunction, RequestHandler } from 'express'
import { checkSchema } from 'express-validator'
import { ErrorWithStatus } from '~/models/Error'
import usersService from '~/services/users.services'
import { validate } from '~/utils/validation'
import { hashPassword } from '~/utils/crypto'
import HTTP_STATUS from '~/constants/httpStatus'
import { verifyToken } from '~/utils/jwt'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'

//làm 1 cái middleware kiểm tra xem email và password được truyền lên hay ko?
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            //dựa vào email và password tìm đối tượng tương ứng
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (user === null) {
              throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }
            req.user = user
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minUppercase: 1,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1
            // returnScore: true này dùng để check độ mạnh của mật khẩu
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ['body']
  )
)
/*
 body :{
 name, 
 email, 
 password, 
 confirm_password,
 date_of_birth
 }
 */

export const registorValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 100
          },
          errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
        }
      },
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const isExist = await usersService.checkEmailExist(value)
            if (isExist) {
              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minUppercase: 1,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1
            // returnScore: true này dùng để check độ mạnh của mật khẩu
          },
          errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
        }
      },

      confirm_password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
        },
        isLength: {
          options: {
            min: 8,
            max: 50
          },
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50
        },
        isStrongPassword: {
          options: {
            minLength: 8,
            minUppercase: 1,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1
            // returnScore: true này dùng để check độ mạnh của mật khẩu
          },
          errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
            }
            return true
          }
        }
      },
      date_of_birth: {
        isISO8601: {
          options: {
            strict: true,
            strictSeparator: true
          },
          errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_BE_ISO8601
        }
      }
    },
    ['body']
  )
)
//check schema sẽ chắc tất cả các vùng của req nhưng nếu schema có thể nhận thêm object là các vùng nhớ cần check

//chúng ta sẽ verify access token tiếp đến chúng ta sẽ refesh token
//có nhiều mục đích của việc cần 2 token để đăng nhập lại

//check accesstoken
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true, //ko cho user truyền khoảng trắng
        //bắt người dùng truyền vào
        notEmpty: {
          errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            //khi truyền lên trong header sẽ có định dạng là
            //bearer <token>
            //nên ta cần split ra và cắt theo khoảng trắng và lấy phần tử số 1
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            //nếu xuống được đây thì access_token có rồi
            //vần verify access_token và lấy payload(decoded_authorization) ra và lưu lại trong req
            try {
              const decoded_authorization = await verifyToken({ token: access_token })
              //nếu ko có dấu ; ở đâu nó sẽ thành curryning mất RẤT NGUY HIỂM
              ;(req as Request).decoded_authorization = decoded_authorization
            } catch (err) {
              throw new ErrorWithStatus({
                message: capitalize((err as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

//check refresh token
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        notEmpty: {
          errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value, { req }) => {
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value }),
                databaseService.refreshTokens.findOne({
                  token: value
                })
              ])
              //tìm token đó có tôn tại hay ko

              if (!refresh_token) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (err) {
              if (err instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize((err as JsonWebTokenError).message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw err
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

//lỗi 400 là lỗi do người dùng gây ra
//manually running validator
//nếu người ta đưa cho mình thì validate ở middlewares
