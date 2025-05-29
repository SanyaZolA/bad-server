
import { Request, Express, Response, NextFunction } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join, extname } from 'path'
import { faker } from '@faker-js/faker'
import sharp from 'sharp'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const destinationPath = join(
      __dirname,
      process.env.UPLOAD_PATH_TEMP ? `../public/${process.env.UPLOAD_PATH_TEMP}` : '../public'
    )
    cb(null, destinationPath)
  },
  filename: (_req, file, cb) => {
    const uniqueFileName = `${faker.string.uuid()}${extname(file.originalname)}`
    cb(null, uniqueFileName)
  },
})

const types = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/svg+xml']

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  cb(null, types.includes(file.mimetype))
}

const fileSizeCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    const fileSize = req.file.size
    if (fileSize < 2) {
      return res.status(400).send({ message: 'Размер файла слишком мал. Минимум 2 КБ.' })
    }
    if (fileSize > 10 * 1024 * 1024) {
      return res.status(400).send({ message: 'Размер файла слишком велик. Максимум 10 МБ.' })
    }
  }
  next()
}

const checkImageMetadata = async (filePath: string): Promise<sharp.Metadata> => sharp(filePath).metadata()

const imageDimensionsCheck = async (req: Request, res: Response, next: NextFunction) => {
  const MIN_IMAGE_WIDTH = 50
  const MIN_IMAGE_HEIGHT = 50

  if (!req.file) return res.status(404).json({ error: 'Файл не загружен' })

  try {
    const metadata = await checkImageMetadata(req.file.path)
    const { width = 0, height = 0 } = metadata

    if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
      return res.status(400).json({
        error: `Изображение слишком маленькое. Минимум ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}.`,
      })
    }

    next()
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Неизвестная ошибка при чтении метаданных.' })
  }
}

const upload = multer({ storage, fileFilter })

export default {
  upload,
  fileSizeCheck,
  imageDimensionsCheck,
}
