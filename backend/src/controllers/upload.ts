import { Request, Response, NextFunction } from 'express'
import { constants } from 'http2'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return next(new BadRequestError('Файл не загружен'))
  }

  try {
    const fileName = req.file.filename
    console.log('File uploaded successfully:', fileName)

    return res.status(constants.HTTP_STATUS_CREATED).send({
      fileName,
      originalName: req.file.originalname,
    })
  } catch (error) {
    console.error('Ошибка при загрузке файла:', error)
    return next(error)
  }
}
