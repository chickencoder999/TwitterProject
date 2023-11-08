import { Router } from 'express'
import {
  changePasswordController,
  emailVerifyTokenController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  unFollowController,
  updateMeController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
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
usersRouter.post('/login', loginValidator, wrapAsync(loginController)) //khi nào như này thì sẽ có chỉ khi vào route login thì nó sẽ chạy middleware

usersRouter.post('/register', registerValidator, wrapAsync(registerController))

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
/*
des : khi người dùng đăng nhập quên mật khẩu, họ gửi email để xin mình tạo cho họ forgot_password_token
path:/users/forgot-password
method : POST
body :{email : string}
*/
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))

/*
des : khi nguời dùng nhấp vào link trong email để reset password
họ sẽ gửi 1 req kèm theo forgot_password_token lên server 
server sẽ kiểm tra forgot_password_token có hợp lệ ko
sau đó chuyển hướng người dùng đến trang reset password
path : /users/verify-reset-password
method : POST
body : {forgot_password_token}
*/
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordTokenController)
)

/*
des : reser password 
path : /users/reset-password
method : POST
header : ko cần vì người ta quên mật khẩu rồi , thì sao mà đăng nhập để có authen đc
body : {forgot_password_token : string, new_password : string, confirm_password : string}
*/
usersRouter.post(
  '/reset-password',
  verifyForgotPasswordTokenValidator,
  resetPasswordValidator,
  wrapAsync(resetPasswordController)
)
/*
des : get profile của user 
path : '/me'
method : get 
Header : Authorization : Bearer <access_token>
body : {}
*/
usersRouter.get('/me', accessTokenValidator, wrapAsync(getMeController))

usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  wrapAsync(updateMeController)
)

/*
des: get profile của user khác bằng unsername
path: '/:username'
method: get
không cần header vì, chưa đăng nhập cũng có thể xem
*/
usersRouter.get('/:username', wrapAsync(getProfileController))
//chưa có controller getProfileController, nên bây giờ ta làm
/*
des: Follow someone
path: '/follow'
method: post
headers: {Authorization: Bearer <access_token>}
body: {followed_user_id: string}
*/
usersRouter.post('/follow', accessTokenValidator, verifiedUserValidator, followValidator, wrapAsync(followController))
//accessTokenValidator dùng dể kiểm tra xem ngta có đăng nhập hay chưa, và có đc user_id của người dùng từ req.decoded_authorization
//verifiedUserValidator dùng để kiễm tra xem ngta đã verify email hay chưa, rồi thì mới cho follow người khác
//trong req.body có followed_user_id  là mã của người mà ngta muốn follow
//followValidator: kiểm tra followed_user_id truyền lên có đúng định dạng objectId hay không
//  account đó có tồn tại hay không
//followController: tiến hành thao tác tạo document vào collection followers

/*
 * *654bc7e22b56df37b9a114c6 user 16
 * * 654bc8692b56df37b9a114ca user 17
 */

/*
  des : unfollow someone
  path : /unfollow/:followed_user_id
  method : delete
  headers : {Authorization : Bearer <access_token>}
*/
usersRouter.delete(
  '/unfollow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapAsync(unFollowController)
)

//change password
/*
des : change password
path : /change-password
method : put 
headers : {Authorization : Bearer <access_token>}
body : {old_password : string, new_password : string, new_confirm_password : string}
*/
usersRouter.put('/change-password', accessTokenValidator, changePasswordValidator, wrapAsync(changePasswordController))
export default usersRouter
//status 500 là server chưa lường trước được luôn
//thêm -T vào file nodemon thì nó sẽ ko đọc ts luôn và run luôn
