// uploader.interface.ts
export interface IUploader {
  upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType?: string,
  ): Promise<string>
  deleteFile(fileName: string): Promise<void>
  download(fileUrl: string): Promise<Buffer>
}
