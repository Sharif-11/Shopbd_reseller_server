import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { FTPUploader, ftpUploader } from './ftp.services'

class FTPController {
  private uploader: FTPUploader

  constructor(uploader: FTPUploader) {
    this.uploader = uploader
    this.uploadFile = this.uploadFile.bind(this)
    this.processUpload = this.processUpload.bind(this)
    this.sendSuccessResponse = this.sendSuccessResponse.bind(this)
    this.sendErrorResponse = this.sendErrorResponse.bind(this)
    this.handleUploadError = this.handleUploadError.bind(this)
    this.deleteFile = this.deleteFile.bind(this)
    this.downloadFile = this.downloadFile.bind(this)
  }

  /**
   * Handles file upload via HTTP POST
   * @param req Express Request
   * @param res Express Response
   */
  public async uploadFile(req: Request, res: Response) {
    if (!req.file) {
      return this.sendErrorResponse(res, 400, 'No file uploaded')
    }

    try {
      const fileInfo = await this.processUpload(req.file)
      this.sendSuccessResponse(res, fileInfo)
    } catch (error) {
      this.handleUploadError(res, error)
    }
  }
  // Add this to your FTPController class
  public async deleteFile(req: Request, res: Response) {
    const { fileName } = req.params

    if (!fileName) {
      return this.sendErrorResponse(res, 400, 'File name is required')
    }

    try {
      await this.uploader.deleteFile(fileName)
      res.json({
        statusCode: 200,
        success: true,
        message: 'File deleted successfully',
        data: {
          fileName,
          deletedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('FTP delete error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.sendErrorResponse(res, 500, `Failed to delete file: ${message}`)
    }
  }
  /**
   * Downloads a file by its public URL
   * @param req Express Request (expects { url: string } in body)
   * @param res Express Response (returns file buffer)
   */
  public async downloadFile(req: Request, res: Response) {
    const { url } = req.body

    if (!url) {
      return this.sendErrorResponse(res, 400, 'URL is required')
    }

    try {
      const fileBuffer = await this.uploader.download(url)

      // Set appropriate headers for file download
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${url.split('/').pop()}"`,
      )

      return res.send(fileBuffer)
    } catch (error) {
      console.error('FTP download error:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to download file'
      this.sendErrorResponse(res, 500, message)
    }
  }

  /**
   * Processes the file upload
   * @param file Express Multer file object
   * @returns Uploaded file information
   */
  private async processUpload(file: Express.Multer.File) {
    const originalName = file.originalname
    const extension = originalName.split('.').pop()
    const uniqueName = `${uuidv4()}.${extension}`

    const publicUrl = await this.uploader.upload(file.buffer, uniqueName)

    return {
      originalName,
      fileName: uniqueName,
      size: file.size,
      mimeType: file.mimetype,
      publicUrl,
      uploadedAt: new Date().toISOString(),
    }
  }

  /**
   * Sends a successful response
   * @param res Express Response
   * @param data Response data
   */
  private sendSuccessResponse(res: Response, data: any) {
    res.json({
      statusCode: 200,
      success: true,
      message: 'File uploaded successfully',
      data,
    })
  }

  /**
   * Sends an error response
   * @param res Express Response
   * @param statusCode HTTP status code
   * @param message Error message
   */
  private sendErrorResponse(
    res: Response,
    statusCode: number,
    message: string,
  ) {
    res.status(statusCode).json({
      statusCode,
      success: false,
      message,
    })
  }

  /**
   * Handles upload errors
   * @param res Express Response
   * @param error Error object
   */
  private handleUploadError(res: Response, error: unknown) {
    console.error('FTP upload error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'
    this.sendErrorResponse(res, 500, `Failed to upload file: ${message}`)
  }
}

export const ftpController = new FTPController(ftpUploader)
