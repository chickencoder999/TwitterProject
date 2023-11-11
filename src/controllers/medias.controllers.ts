import { Request, Response } from 'express'
import formidable from 'formidable'
import path from 'path'
import { USERS_MESSAGES } from '~/constants/message'
import mediasService from '~/services/medias.services'
import { handleUploadImage } from '~/utils/file'

export const uploadSingleImageController = async (req: Request, res: Response) => {
  const data = await mediasService.handleUploadSingleImage(req)
  return res.json({
    message: USERS_MESSAGES.UPLOAD_SUCCESS,
    result: data
  })
}
