import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import config from '../../config'
import { IUploader } from './uploader.interface'

class S3Uploader implements IUploader {
  private s3: S3Client
  private bucket: string
  private baseUrl: string

  constructor() {
    this.s3 = new S3Client({
      endpoint: config.s3Endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.s3AccessKey,
        secretAccessKey: config.s3SecretKey,
      },
      forcePathStyle: true,
    })
    this.bucket = config.s3Bucket
    this.baseUrl = config.s3BaseUrl
  }

  async upload(
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

  async deleteFile(fileName: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: fileName }),
    )
  }

  async download(fileUrl: string): Promise<Buffer> {
    const fileName = this.extractFileNameFromUrl(fileUrl)
    const response = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: fileName }),
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
