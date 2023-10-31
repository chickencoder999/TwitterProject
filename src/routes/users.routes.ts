import { Router } from 'express'
import { loginController, logoutController, registorController } from '~/controllers/users.controllers'
import {
  accessTokenValidator,
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
export default usersRouter
//status 500 là server chưa lường trước được luôn
//thêm -T vào file nodemon thì nó sẽ ko đọc ts luôn và run luôn
