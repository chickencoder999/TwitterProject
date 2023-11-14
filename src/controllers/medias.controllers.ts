import { NextFunction, Request, Response } from 'express'
import formidable from 'formidable'
import path from 'path'
import { USERS_MESSAGES } from '~/constants/message'
import mediasService from '~/services/medias.services'
import { handleUploadImage } from '~/utils/file'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
import fs from 'fs'
import HTTP_STATUS from '~/constants/httpStatus'
import mime from 'mime'

export const uploadImageController = async (req: Request, res: Response) => {
  const data = await mediasService.uploadImage(req)
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: data
  })
}

export const uploadVideoController = async (req: Request, res: Response) => {
  const data = await mediasService.uploadVideo(req)
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: data
  })
}

//khỏi async vì có đợi gì đâu
export const serveVideoStreamController = (req: Request, res: Response, next: NextFunction) => {
  const { namefile } = req.params //lấy namefile từ param string
  const range = req.headers.range //lấy cái range trong headers
  console.log(range)
  // console.log(namefile)

  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, namefile) //đường dẫn tới file video
  //nếu k có range thì báo lỗi, đòi liền
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Require range header')
  }
  //1MB = 10^6 byte (tính theo hệ 10, đây là mình thấy trên đt,UI)
  //tính theo hệ nhị là 2^20 byte (1024*1024)
  //giờ ta lấy dung lượng của video
  const videoSize = fs.statSync(videoPath).size //ở đây tính theo byte
  //dung lượng cho mỗi phân đoạn muốn stream
  const CHUNK_SIZE = 10 ** 6 //10^6 = 1MB
  //lấy giá trị byte bắt đầu từ header range (vd: bytes=8257536-29377173/29377174)
  //8257536 là cái cần lấy
  const start = Number(range.replace(/\D/g, '')) //lấy số đầu tiên từ còn lại thay bằng ''
  console.log('start: ', start)

  //lấy giá trị byte kết thúc-tức là khúc cần load đến
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1) //nếu (start + CHUNK_SIZE) > videoSize thì lấy videoSize
  //dung lượng sẽ load thực tế
  const contentLength = end - start + 1 //thường thì nó luôn bằng CHUNK_SIZE, nhưng nếu là phần cuối thì sẽ nhỏ hơn
  const contentType = mime.getType(videoPath) || 'video/*' //lấy kiểu file, nếu k đc thì mặc định là video/*
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`, //end-1 vì nó tính từ 0
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers) //trả về phần nội dung
  //khai báo trong httpStatus.ts PARTIAL_CONTENT = 206: nội dung bị chia cắt nhiều đoạn
  const videoStreams = fs.createReadStream(videoPath, { start, end }) //đọc file từ start đến end
  videoStreams.pipe(res)
  //pipe: đọc file từ start đến end, sau đó ghi vào res để gữi cho client

  // const { namefile } = req.params //lấy filename từ param string
  // const range = req.headers.range //lấy range từ header

  // //lấy kích thước tối đa của video
  // const videoPath = path.resolve(UPLOAD_VIDEO_DIR, namefile)
  // const videoSize = fs.statSync(videoPath).size
  // //ko có range thì yêu cầu range
  // if (!range) {
  //   return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires range header')
  // }

  // const CHUNK_SIZE = 10 ** 6 //1MB
  // const start = Number(range.replace(/\D/g, '')) //vào trong range tìm những thằng khác số
  // const end = Math.min(start + CHUNK_SIZE, videoSize - 1) //tìm min giữa start + 1MB và kích thước video - 1
  // //dung lượng thực tế của video
  // const contentLength = end - start + 1
  // const contentType = mime.getType(videoPath) || 'video/*' //lấy kiểu của video
  // const headers = {
  //   'Content-Range': `bytes ${start}-${end}/${videoSize}`,
  //   'Accept-Ranges': 'bytes',
  //   'Content-Length': contentLength,
  //   'Content-Type': contentType
  // }
  // res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers) //ghi đè
  // const videoStreams = fs.createReadStream(videoPath, { start, end }) //đọc file từ start đến end
  // videoStreams.pipe(res) //pipe nó ra
}

export const serveImageController = async (req: Request, res: Response, next: NextFunction) => {
  const { filename } = req.params

  res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, filename), (err) => {
    if (err) {
      res.status((err as any).status).send('Not found image')
    }
  })
}
