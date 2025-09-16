import { PermissionType } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({
  path: path.join(process.cwd(), '.env'),
})

export interface IConfig {
  port: number
  env: string
  frontendUrl?: string
  database_url: string | undefined
  saltRounds: string
  jwtSecret: string | undefined
  otpLength: number
  otpExpiresIn: number
  otpBlockDuration: number
  apiKey: string
  senderId: string
  smsUrl: string
  maximumOtpAttempts: number
  maximumOtpRequests: number
  nodeEnv: string
  smsCharge: number
  maxForgotPasswordAttempts: number
  maximumWallets: number
  maximumWithdrawAmount: number
  deliveryChargeInsideDhaka: number
  deliveryChargeOutsideDhaka: number
  negativeBalanceLimit: number
  minimumOrderCompletedToBeVerified: number
  forgotPasswordRequestInterval: number
  defaultSellerPermissions: PermissionType[]
  defaultAdminPermissions: PermissionType[]
  ftpHost: string
  ftpUser: string
  ftpPassword: string
  ftpBaseUrl: string
  maxRejectedPaymentLimit: number
  extraDeliveryCharge: number
  enableSmsNotifications?: boolean
  fraudCheckerToken: string
  maxAge: number
  sellerCommissionRate: number
  // cloudinaryKey?: string;
  // cloudinarySecret?: string;
  // cloudinaryName?: string;
  welcomeBonusAmount?: number
  activateWelcomeBonusForNewSeller?: boolean
}

const config: IConfig = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  env: process.env.NODE_ENV || 'development',
  database_url: process.env.DATABASE_URL,
  saltRounds: process.env.SALT_ROUNDS || '10',
  jwtSecret: process.env.JWT_SECRET,
  otpLength: 6,
  otpExpiresIn: 5 * 60 * 1000, // 5 minutes
  otpBlockDuration: 60 * 1000, // 1 minute
  apiKey: 'hsYr6qwobYaKBZdh8xXJ',
  senderId: '8809617623563',
  smsUrl: 'http://bulksmsbd.net/api/smsapi',
  maximumOtpAttempts: 5,
  maximumOtpRequests: 5,
  nodeEnv: process.env.NODE_ENV || 'development',
  smsCharge: 1,
  maxForgotPasswordAttempts: 3,
  maximumWallets: 2,
  maximumWithdrawAmount: 10000,
  deliveryChargeInsideDhaka: 80,
  deliveryChargeOutsideDhaka: 130,
  negativeBalanceLimit: -10,
  minimumOrderCompletedToBeVerified: 1,
  forgotPasswordRequestInterval: 5 * 60 * 1000, // 5 minutes
  defaultSellerPermissions: [],
  defaultAdminPermissions: [
    PermissionType.WALLET_MANAGEMENT,
    PermissionType.ORDER_MANAGEMENT,
    PermissionType.PAYMENT_MANAGEMENT,
  ],
  ftpHost: process.env.FTP_HOST || '',
  ftpUser: process.env.FTP_USER || '',
  ftpPassword: process.env.FTP_PASSWORD || '',
  ftpBaseUrl: process.env.FTP_BASE_URL || '',
  maxRejectedPaymentLimit: 3,
  extraDeliveryCharge: 10,
  enableSmsNotifications: process.env.SMS === 'true',
  fraudCheckerToken: process.env.FRAUD_CHECKER_TOKEN || '',
  maxAge: 12 * 60 * 60 * 1000, // 24 hours
  sellerCommissionRate: 1,
  // cloudinarySecret: process.env.CLOUDINARY_SECRET,
  // cloudinaryName: process.env.CLOUDINARY_NAME,

  activateWelcomeBonusForNewSeller:
    process.env.ACTIVATE_WELCOME_BONUS_FOR_NEW_SELLER === 'true',
  welcomeBonusAmount: process.env.WELCOME_BONUS_AMOUNT
    ? parseInt(process.env.WELCOME_BONUS_AMOUNT)
    : 0,
}

export default config
