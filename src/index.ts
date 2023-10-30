import express, { NextFunction, Request, Response } from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
const app = express()
app.use(express.json())
const PORT = 3000

databaseService.connect()
app.use('/users', usersRouter)
// Path: src/users.routes.ts
app.get('/', (req, res) => {
  res.send('Hello World')
})

app.use(defaultErrorHandler)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

//chúng ta đang dùng mô hình mvc
//nhưng thực tế muốn từ view qua controller thì phải qua middleware
//cấu trúc của middleware như 1 củ hành tây, tại user phải đi qua từng lớp middleware
//hàm next() để thông báo rằng việc mọi thứ đã xong, có thể đi tiếp
//tức là nếu mình chỉ gọi tới localhost:3000/api thì nó vẫn chạy middleware nhưng ko chạy qua tweets
//nếu ko có next() thì sẽ bị treo ở đây
//đây chính là hiện tượng pending trong call api
//khi cài mongodb thì cần cài lại expressjs hoặc cài lại mấy file config
