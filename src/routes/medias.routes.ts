import { Router } from 'express'
import { uploadSingleImageController } from '~/controllers/medias.controllers'
import { wrapAsync } from '~/utils/handlers'

const mediasRouter = Router()

mediasRouter.post('/upload-image', wrapAsync(uploadSingleImageController))

export default mediasRouter
