import { Router } from 'express'
import {
  emailVerifyTokenController,
  loginController,
  logoutController,
  registorController,
  resendEmailVerifyController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registorValidator
} from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
const usersRouter = Router()
// usersRouter.use(loginValidator)
//ko nên ghi như trên bởi vì mỗi lần truy cập vào route users nó sẽ chạy middleware
/*
des : đăng nhập
path : /users/login
method : POST
body : {email, password}
*/
usersRouter.get('/login', loginValidator, wrapAsync(loginController)) //khi nào như này thì sẽ có chỉ khi vào route login thì nó sẽ chạy middleware

usersRouter.post('/register', registorValidator, wrapAsync(registorController))

//logout là method post, nếu là method get thì sẽ là lấy cái gì đó thì phải truyền lên thành url
//nhưng logout có trả về cái gì đâu nên xài method post
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/*
des : verify email token
khi người dùng đăng ký thì họ sẽ nhận được mail có link dạng 
localhost:3000/users/verify-email?email_verify_token=xxxx
nếu mà em nhấp vào link thì sẽ tạo ra req gửi lên email_verify_token lên server 
server kiểm tra email_verify_token có hợp lệ ko 
thì từ cái decoded_email_verify_token lấy ra user_id 
và vào user_id đó để update_email_verify_email_token thành '' và verify = 1, update at 
path : /users/verify-email
method : POST
body: {email_verify_token}
*/
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapAsync(emailVerifyTokenController))

/*
des : resend email verify token
khi mail thất lạc hoặc email_verify_token hết hạn, thì người dùng có 
nhu cầu resend email_verify_token 

method : post,
path : /users/resend-verify-email
headers : {authorization: Bearer <access_token>} // đăng nhập mới được resend
body : {}
*/
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendEmailVerifyController))
export default usersRouter
//status 500 là server chưa lường trước được luôn
//thêm -T vào file nodemon thì nó sẽ ko đọc ts luôn và run luôn
