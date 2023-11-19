import { Router } from 'express'
import { createTweetController } from '~/controllers/tweets.controllers'
import { createTweetValidator } from '~/middlewares/tweets.middlewares'
import {
  accessTokenValidator,
  verifiedUserValidator
} from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'

const tweetsRouter = Router()
//làm route tạo tweet
/*
des : làm route tạo tweet 
method : POST
headers : {Authorzation : Bearer <access_token>}
phải verify account thì mới tạo được tweet 
body : TweetRequestBody
*/
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapAsync(createTweetController)
)
export default tweetsRouter
