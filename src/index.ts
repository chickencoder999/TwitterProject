import express, { NextFunction, Request, Response } from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import { config } from 'dotenv'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from './constants/dir'
import staticRouter from './routes/static.routes'
import { MongoClient } from 'mongodb'
import tweetsRouter from './routes/tweets.routes'
config()
const app = express()
initFolder()
app.use(express.json())
const PORT = process.env.PORT || 4000

databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexFollowers()
})
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/tweets', tweetsRouter)
// app.use(express.static(UPLOAD_IMAGE_DIR)) //static file handler
// app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
//nếu viết như vậy thì link dẫn sẽ là localhost:4000/blablabla.jpg
app.use('/static', staticRouter) //nếu muốn thêm tiền tố, ta sẽ làm thế này
//vậy thì nghĩa là vào localhost:4000/static/blablabla.jpg
// Path: src/users.routes.ts
// app.get('/', (req, res) => {
//   res.send('Hello World')
// })

app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  // console.log(process.argv)
})

//chúng ta đang dùng mô hình mvc
//nhưng thực tế muốn từ view qua controller thì phải qua middleware
//cấu trúc của middleware như 1 củ hành tây, tại user phải đi qua từng lớp middleware
//hàm next() để thông báo rằng việc mọi thứ đã xong, có thể đi tiếp
//tức là nếu mình chỉ gọi tới localhost:3000/api thì nó vẫn chạy middleware nhưng ko chạy qua tweets
//nếu ko có next() thì sẽ bị treo ở đây
//đây chính là hiện tượng pending trong call api
//khi cài mongodb thì cần cài lại expressjs hoặc cài lại mấy file config
