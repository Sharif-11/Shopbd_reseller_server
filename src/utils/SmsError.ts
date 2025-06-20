export class SmsServiceError extends Error {
  statusCode: number
  stack?: string
  constructor(status: number, message: string) {
    super(message)
    this.statusCode = status
    Error.captureStackTrace(this, this.constructor)
  }
}
