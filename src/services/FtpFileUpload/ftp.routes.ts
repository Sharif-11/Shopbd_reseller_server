import { RequestHandler, Router } from 'express'
import multer from 'multer'
import { ftpController } from './ftp.controller'

class FTPRouter {
  protected router: Router
  protected upload: multer.Multer

  constructor() {
    this.router = Router()
    // Initialize multer for file uploads such that it accepts only image and maximum 5 MB size

    this.upload = multer({
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
    console.log('FTP Router initialized with multer for file uploads')
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // Single file upload
    this.router.post(
      '/upload',
      this.upload.single('image') as RequestHandler, // Expect a single file with field name 'image'
      ftpController.uploadFile,
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

// Export a singleton instance
export default new FTPRouter().getRouter()
