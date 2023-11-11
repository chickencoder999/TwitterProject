import { Request } from 'express'
import sharp from 'sharp'
import { UPLOAD_DIR } from '~/constants/dir'
import { getNameFromFullname, handleUploadImage } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/constants/config'
class MediasService {
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadImage(req) //đem từ uploadSingleImageController qua
    //xử lý file bằng sharp
    ////filepath là đường của file cần xử lý đang nằm trong uploads/temp
    //file.newFilename: là tên unique mới của file sau khi upload lên, ta xóa đuôi và thêm jpg
    const newFilename = getNameFromFullname(file.newFilename) + '.jpg'
    const newPath = UPLOAD_DIR + '/' + newFilename //đường dẫn mới của file sau khi xử lý
    const info = await sharp(file.filepath).jpeg().toFile(newPath)
    fs.unlinkSync(file.filepath) //xóa file cũ đi
    return isProduction
      ? `${process.env.HOST}/medias/${newFilename}`
      : `http://localhost:${process.env.PORT}/static/${newFilename}`
  }
}

const mediasService = new MediasService()

export default mediasService
