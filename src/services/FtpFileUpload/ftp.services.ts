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
