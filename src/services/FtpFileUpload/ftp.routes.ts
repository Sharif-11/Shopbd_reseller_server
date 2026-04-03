import { Router } from 'express'
import multer from 'multer'
import { FileController } from './file.controller'
import { ftpUploader } from './ftpUploader'
import { s3Uploader } from './s3Uploader'

// Choose uploader dynamically
const useS3 = true
const controller = new FileController(useS3 ? s3Uploader : ftpUploader)

const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5 MB
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'))
    }
    cb(null, true)
  },
})
const router = Router()

router.post('/upload', upload.single('image'), controller.uploadFile)
router.delete('/delete/:fileName', controller.deleteFile)
router.post('/download', controller.downloadFile)

export default router
