import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { IUploader } from './uploader.interface'

export class FileController {
  private uploader: IUploader

  constructor(uploader: IUploader) {
    this.uploader = uploader
    this.uploadFile = this.uploadFile.bind(this)
    this.deleteFile = this.deleteFile.bind(this)
    this.downloadFile = this.downloadFile.bind(this)
  }

  public async uploadFile(req: Request, res: Response) {
    if (!req.file) return this.sendError(res, 400, 'No file uploaded')

    try {
      const file = req.file
      const uniqueName = `${uuidv4()}.${file.originalname.split('.').pop()}`
      const publicUrl = await this.uploader.upload(
        file.buffer,
        uniqueName,
        file.mimetype,
      )

      res.json({
        statusCode: 200,
        success: true,
        message: 'File uploaded successfully',
        data: {
          originalName: file.originalname,
          fileName: uniqueName,
          size: file.size,
          mimeType: file.mimetype,
          publicUrl,
          uploadedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('Upload error:', error)
      this.sendError(
        res,
        500,
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }

  public async deleteFile(req: Request, res: Response) {
    const { fileName } = req.params
    if (!fileName) return this.sendError(res, 400, 'File name is required')

    try {
      await this.uploader.deleteFile(fileName)
      res.json({
        statusCode: 200,
        success: true,
        message: 'File deleted successfully',
        data: { fileName, deletedAt: new Date().toISOString() },
      })
    } catch (error) {
      console.error('Delete error:', error)
      this.sendError(
        res,
        500,
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }

  public async downloadFile(req: Request, res: Response) {
    const { url } = req.body
    if (!url) return this.sendError(res, 400, 'URL is required')

    try {
      const fileBuffer = await this.uploader.download(url)
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${url.split('/').pop()}"`,
      )
      res.send(fileBuffer)
    } catch (error) {
      console.error('Download error:', error)
      this.sendError(
        res,
        500,
        error instanceof Error ? error.message : 'Unknown error',
      )
    }
  }

  private sendError(res: Response, statusCode: number, message: string) {
    res.status(statusCode).json({ statusCode, success: false, message })
  }
}
