import 'express'

declare module 'express' {
  export interface Request {
    user?: {
      userId: string
      phoneNo: string
      role: string
      balance?: number
    }
  }
}
