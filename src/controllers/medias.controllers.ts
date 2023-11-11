import { Request, Response } from 'express'
import formidable from 'formidable'
import path from 'path'
import { USERS_MESSAGES } from '~/constants/message'
import mediasService from '~/services/medias.services'
import { handleUploadImage } from '~/utils/file'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'

export const uploadSingleImageController = async (req: Request, res: Response) => {
  const data = await mediasService.uploadImage(req)
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: data
  })
}
