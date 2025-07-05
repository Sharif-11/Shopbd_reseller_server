import { ftpUploader } from '../FtpFileUpload/ftp.services'

export async function DeleteFilesFromFTP(fileUrls: string[]) {
  if (!fileUrls || fileUrls.length === 0) return

  try {
    const deletePromises = fileUrls.map(url => {
      const fileName = url.split('/').pop()
      if (fileName) {
        return ftpUploader.deleteFile(`tickets/${fileName}`)
      }
      return Promise.resolve()
    })

    await Promise.all(deletePromises)
  } catch (error) {
    console.error('Error deleting ticket attachments:', error)
    throw error
  }
}
