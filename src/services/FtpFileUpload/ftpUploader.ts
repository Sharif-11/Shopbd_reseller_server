import * as ftp from 'basic-ftp'

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import stream, { Readable } from 'stream'
import config from '../../config'
import { IUploader } from './uploader.interface'

class FTPUploader implements IUploader {
  private client: ftp.Client
  private config: {
    host: string
    user: string
    password: string
    secure: boolean
    baseUrl: string
  }

  constructor(config: {
    host: string
    user: string
    password: string
    secure?: boolean
    baseUrl: string
  }) {
    this.client = new ftp.Client()
    // this.client.ftp.verbose = true // Enable for debugging
    this.config = {
      secure: false,
      ...config,
    }
  }

  /**
   * Uploads a file buffer to FTP server
   * @param fileBuffer The file content as Buffer
   * @param remoteFileName Destination file name on FTP server
   * @returns URL of the uploaded file
   */
  public async upload(
    fileBuffer: Buffer,
    remoteFileName: string,
  ): Promise<string> {
    try {
      await this.connect()
      await this.uploadFile(fileBuffer, remoteFileName)
      return this.getFileUrl(remoteFileName)
    } finally {
      this.close()
    }
  }
  public async deleteFile(remoteFileName: string): Promise<void> {
    try {
      await this.connect()
      await this.client.remove(remoteFileName)
    } catch (error) {
      console.error(`Failed to delete file ${remoteFileName}:`, error)
      throw error
    } finally {
      this.close()
    }
  }
  public async deleteFilesWithUrls(remoteUrls: string[]): Promise<void> {
    try {
      await this.connect()
      const deletePromises = remoteUrls.map(url =>
        this.client.remove(this.extractFileNameFromUrl(url)),
      )
      for (const promise of deletePromises) {
        try {
          await promise
        } catch (error) {
          console.error('Failed to delete file:', error)
        }
      }
    } catch (error) {
      console.error('Failed to delete files:', error)
      throw error
    }
  }

  /**
   * Connects to FTP server
   */
  private async connect(): Promise<void> {
    await this.client.access({
      host: this.config.host,
      user: this.config.user,
      password: this.config.password,
      secure: this.config.secure,
    })
  }

  /**
   * Uploads file buffer to FTP
   * @param fileBuffer File content as Buffer
   * @param remoteFileName Destination file name
   */
  private async uploadFile(
    fileBuffer: Buffer,
    remoteFileName: string,
  ): Promise<void> {
    const bufferStream = new stream.PassThrough()
    bufferStream.end(fileBuffer)
    await this.client.uploadFrom(bufferStream, remoteFileName)
  }

  /**
   * Generates public URL for the uploaded file
   * @param fileName File name on FTP server
   * @returns Full public URL
   */
  private getFileUrl(fileName: string): string {
    return `${this.config.baseUrl}/${fileName}`
  }

  /**
   * Downloads a file from FTP server
   *
   */
  public async download(fileUrl: string): Promise<Buffer> {
    try {
      await this.connect()
      const fileName = this.extractFileNameFromUrl(fileUrl)
      return await this.downloadFile(fileName)
    } finally {
      this.close()
    }
  }

  /**
   * Downloads multiple files from the FTP server by their URLs
   * @param fileUrls Array of file URLs to download
   * @returns Array of file contents as Buffers
   */
  public async downloadMultiple(fileUrls: string[]): Promise<Buffer[]> {
    try {
      await this.connect()
      const downloadPromises = fileUrls.map(url => {
        const fileName = this.extractFileNameFromUrl(url)
        return this.downloadFile(fileName)
      })
      return await Promise.all(downloadPromises)
    } finally {
      this.close()
    }
  }

  /**
   * Extracts the file name from a given URL
   * @param url The file URL
   * @returns The file name
   */
  private extractFileNameFromUrl(url: string): string {
    const urlObj = new URL(url)
    return urlObj.pathname.split('/').pop() || ''
  }

  /**
   * Downloads a file from FTP server
   * @param fileName Name of the file to download
   * @returns File content as Buffer
   */
  private async downloadFile(fileName: string): Promise<Buffer> {
    const writableStream = new stream.PassThrough()
    const chunks: Uint8Array[] = []

    writableStream.on('data', chunk => chunks.push(chunk))

    await this.client.downloadTo(writableStream, fileName)

    return Buffer.concat(chunks)
  }

  /**
   * Closes FTP connection
   */
  private close(): void {
    this.client.close()
  }
}

// Example usage:
/*
const ftpUploader = new FTPUploader({
  host: 'your-ftp-host',
  user: 'your-username',
  password: 'your-password',
  baseUrl: 'http://admin.shopbdresellerjobs.shop/ftp_admin'
});

const fileBuffer = Buffer.from('some file content');
const url = await ftpUploader.upload(fileBuffer, 'test.txt');

*/
const ftpUploader = new FTPUploader({
  host: config.ftpHost,
  user: config.ftpUser,
  password: config.ftpPassword,
  baseUrl: config.ftpBaseUrl,
  secure: false, // Set to true if using FTPS
})
export { ftpUploader, FTPUploader }

class S3Uploader implements IUploader {
  private s3: S3Client
  private bucket: string
  private baseUrl: string

  constructor() {
    this.s3 = new S3Client({
      endpoint: config.s3Endpoint, // e.g. http://your-vps-ip:9000
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.s3AccessKey,
        secretAccessKey: config.s3SecretKey,
      },
      forcePathStyle: true, // REQUIRED for MinIO
    })

    this.bucket = config.s3Bucket
    this.baseUrl = config.s3BaseUrl
  }

  // ✅ Upload
  public async upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
      }),
    )

    return `${this.baseUrl}/${this.bucket}/${fileName}`
  }

  // ✅ Delete
  public async deleteFile(fileName: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
      }),
    )
  }

  // ✅ Download
  public async download(fileUrl: string): Promise<Buffer> {
    const fileName = this.extractFileNameFromUrl(fileUrl)

    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
      }),
    )

    return await this.streamToBuffer(response.Body as Readable)
  }

  private extractFileNameFromUrl(url: string): string {
    const urlObj = new URL(url)
    return urlObj.pathname.split('/').pop() || ''
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer)
    }
    return Buffer.concat(chunks)
  }
}

export const s3Uploader = new S3Uploader()
