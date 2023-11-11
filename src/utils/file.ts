import path from 'path'
import fs from 'fs'
import { Request } from 'express'
import formidable, { File } from 'formidable'
import { Files } from 'formidable'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true //cho phép tạo folder nested vào nhau
        //uploads/image/bla bla bla
      }) //mkdirSync: giúp tạo thư mục
    }
  })
}

export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_IMAGE_TEMP_DIR), //lưu ở đâu
    maxFiles: 4, //tối đa bao nhiêu
    keepExtensions: true, //có lấy đuôi mở rộng không .png, .jpg
    maxFileSize: 300 * 1024, //tối đa bao nhiêu byte, 300kb
    maxTotalFileSize: 300 * 1024 * 4, //tổng dung lượng của tất cả các file
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })
  //hành động upload có thể xảy ra lỗi
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!files.image) {
        return reject(new Error('File is empty'))
      }
      return resolve(files.image as File[])
    })
  })
}

//viết thêm hàm khi nhận filename : abv.png thì chỉ lấy abv để sau này ta gán thêm đuôi .jpeg
export const getNameFromFullname = (filename: string) => {
  const nameArr = filename.split('.')
  nameArr.pop() //xóa phần tử cuối cùng, tức là xóa đuôi .png
  return nameArr.join('') //nối lại thành chuỗi
}

//videoNgocTrinhTeXe.mp4 => mp4
export const getExtension = (filename: string) => {
  const nameArr = filename.split('.') //[videoNgocTrinhTeXe, mp4]
  return nameArr[nameArr.length - 1] //lấy phần tử cuối cùng
}
export const handleUploadVideo = async (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_VIDEO_DIR), //lưu ở đâu
    maxFiles: 1, //tối đa bao nhiêu
    //keepExtensions: true, //có lấy đuôi mở rộng không .png, .jpg đối với video thì ko dùng cái này
    maxFileSize: 50 * 1024 * 1024, //tối đa bao nhiêu byte, 50mb
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('video/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })
  //hành động upload có thể xảy ra lỗi
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!files.video) {
        return reject(new Error('Video is empty'))
      }
      //trong file{originalFilename, filepath, newFilename}
      //vì mình đã tắt keep extensions nên cái file sẽ ko có đuôi extension
      const videos = files.video as File[] //lấy ra danh sách các video đã up lên
      //duyệt qua từng video và
      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string) //lấy đuối của tên gốc
        video.newFilename += `.${ext}` // lắp đuôi vào tên mới
        fs.renameSync(video.filepath, `${video.filepath}.${ext}`) //lắp đuôi vào filepath : đường dẫn đến file mới
      })
      return resolve(files.video as File[])
    })
  })
}
