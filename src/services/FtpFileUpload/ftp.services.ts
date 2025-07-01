import * as ftp from 'basic-ftp'

import stream from 'stream'
import config from '../../config'

class FTPUploader {
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
console.log('File uploaded to:', url);
*/
const ftpUploader = new FTPUploader({
  host: config.ftpHost,
  user: config.ftpUser,
  password: config.ftpPassword,
  baseUrl: config.ftpBaseUrl,
  secure: false, // Set to true if using FTPS
})
export { ftpUploader, FTPUploader }
