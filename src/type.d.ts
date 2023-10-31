import { TokenPayload } from './models/requests/User.requests'
import User from './models/schemas/User.schema'
import { Request } from 'express'

//file này dùng để định nghĩa lại những cái có sẵn
//trong 1 request nó có thể có users
declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
  }
}
