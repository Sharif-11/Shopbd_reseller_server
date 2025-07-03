import config from '../../config'
import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
import SmsServices from './Sms Service/sms.services'

class OtpServices {
  /**
   * Send an OTP to a phone number with proper rate limiting and blocking
   * @param phoneNo - The phone number to send OTP to
   * @returns Object with OTP sending status and verification status
   */
  async sendOtp(phoneNo: string) {
    // Validate phone number format first
    this.validatePhoneNumber(phoneNo)

    // Check if user already exists
    const user = await prisma.user.findUnique({ where: { phoneNo } })
    if (user) {
      throw new ApiError(400, 'Phone number already registered with a user')
    }

    // Get or create OTP record
    let otpRecord = await this.getOtpRecord(phoneNo)

    // Handle verified records
    if (otpRecord.isVerified) {
      return {
        isVerified: true,
        isBlocked: false,
        sendOTP: false,
        message: 'Phone number already verified',
      }
    }

    // Check if blocked temporarily
    if (this.isTemporarilyBlocked(otpRecord)) {
      const timeLeft = this.getRemainingBlockTime(otpRecord)
      throw new ApiError(
        403,
        `Too many OTP requests. Try again in ${timeLeft} seconds`,
      )
    }

    // Check if permanently blocked
    if (otpRecord.isBlocked) {
      throw new ApiError(
        403,
        'This phone number is permanently blocked from OTP requests',
      )
    }

    // Check if there's a valid OTP already
    if (this.hasValidOtp(otpRecord)) {
      const timeLeft = this.getRemainingOtpTime(otpRecord)
      return {
        sendOTP: false,
        alreadySent: true,
        isBlocked: false,
        isVerified: false,
        message: `OTP already sent. Please wait ${timeLeft} seconds before requesting a new one`,
      }
    }

    // Check if OTP request limit exceeded
    if (otpRecord.totalOTP >= config.maximumOtpRequests) {
      await this.blockOtpRecord(phoneNo)
      throw new ApiError(
        403,
        'Daily OTP request limit exceeded. Phone number blocked',
      )
    }

    // Generate and send new OTP
    const otp = this.generateRandomOtp(config.otpLength)
    console.clear()

    await SmsServices.sendOtp(phoneNo, otp)

    const result = await prisma.otp.update({
      where: { phoneNo },
      data: {
        otp,
        otpCreatedAt: new Date(),
        otpExpiresAt: new Date(Date.now() + config.otpExpiresIn),
        totalOTP: otpRecord.totalOTP + 1,
        failedAttempts: 0,
        updatedAt: new Date(),
      },
    })

    return {
      sendOTP: true,
      isBlocked: false,
      isVerified: false,
      message: 'OTP sent successfully',
    }
  }

  /**
   * Verify an OTP for a phone number
   * @param phoneNo - Phone number to verify
   * @param otp - OTP code to verify
   * @returns Verification status
   */
  async verifyOtp(phoneNo: string, otp: string) {
    const otpRecord = await this.getOtpRecord(phoneNo)

    // Handle already verified numbers
    if (otpRecord.isVerified) {
      return {
        alreadyVerified: true,
        isBlocked: false,
        message: 'Phone number already verified',
      }
    }

    // Check if temporarily blocked due to failed attempts
    if (this.isTemporarilyBlocked(otpRecord)) {
      const timeLeft = this.getRemainingBlockTime(otpRecord)
      throw new ApiError(
        403,
        `Too many failed attempts. Try again in ${timeLeft} seconds`,
      )
    }

    // Check if permanently blocked
    if (otpRecord.isBlocked) {
      throw new ApiError(403, 'This phone number is blocked from verification')
    }

    // Validate OTP presence and expiration
    if (!otpRecord.otp || !otpRecord.otpCreatedAt || !otpRecord.otpExpiresAt) {
      throw new ApiError(400, 'No valid OTP found. Please request a new OTP')
    }

    if (new Date() > otpRecord.otpExpiresAt) {
      throw new ApiError(400, 'OTP has expired. Please request a new OTP')
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment failed attempts
      const updatedRecord = await this.updateOtpRecord(phoneNo, {
        failedAttempts: otpRecord.failedAttempts + 1,
        ...(otpRecord.failedAttempts + 1 >= config.maximumOtpAttempts
          ? {
              otpBlockUntil: new Date(Date.now() + config.otpBlockDuration),
            }
          : {}),
      })

      if (updatedRecord.failedAttempts >= config.maximumOtpAttempts) {
        throw new ApiError(
          403,
          `Too many failed attempts. Try again in ${
            config.otpBlockDuration / 1000
          } seconds`,
        )
      }

      throw new ApiError(400, 'Invalid OTP')
    }

    // Mark as verified
    await this.updateOtpRecord(phoneNo, {
      isVerified: true,
      failedAttempts: 0,
      otpBlockUntil: null,
    })

    return {
      otpVerified: true,
      isBlocked: false,
      message: 'Phone number verified successfully',
    }
  }

  /**
   * Check if a contact is verified
   * @param phoneNo - Phone number to check
   * @returns Verification status
   */
  async isVerified(phoneNo: string) {
    const otpRecord = await this.getOtpRecord(phoneNo)
    return {
      isVerified: otpRecord.isVerified,
      isBlocked: otpRecord.isBlocked,
    }
  }

  /**
   * Unblock a contact
   * @param phoneNo - Phone number to unblock
   * @returns Unblock status
   */
  async unblockContact(phoneNo: string) {
    const otpRecord = await this.getOtpRecord(phoneNo)

    if (!otpRecord.isBlocked && !otpRecord.otpBlockUntil) {
      return {
        isUnblocked: false,
        message: 'Contact is not blocked',
      }
    }

    await this.updateOtpRecord(phoneNo, {
      isBlocked: false,
      otpBlockUntil: null,
      failedAttempts: 0,
    })

    return {
      isUnblocked: true,
      message: 'Contact unblocked successfully',
    }
  }

  // ========== PRIVATE HELPER METHODS ========== //

  /**
   * Get OTP record for a phone number, create if doesn't exist
   * @param phoneNo - Phone number
   * @returns OTP record
   */
  private async getOtpRecord(phoneNo: string) {
    let otpRecord = await prisma.otp.findUnique({ where: { phoneNo } })

    if (!otpRecord) {
      otpRecord = await prisma.otp.create({
        data: {
          phoneNo,
          otp: '',
          isVerified: false,
          isBlocked: false,
          totalOTP: 0,
          failedAttempts: 0,
          otpBlockUntil: null,
          otpCreatedAt: new Date(),
          otpExpiresAt: new Date(Date.now() + config.otpExpiresIn),
        },
      })
    }

    return otpRecord
  }

  /**
   * Update OTP record
   * @param phoneNo - Phone number
   * @param data - Data to update
   * @returns Updated record
   */
  private async updateOtpRecord(phoneNo: string, data: any) {
    return await prisma.otp.update({
      where: { phoneNo },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Block an OTP record permanently
   * @param phoneNo - Phone number to block
   */
  private async blockOtpRecord(phoneNo: string) {
    await this.updateOtpRecord(phoneNo, {
      isBlocked: true,
      otpBlockUntil: null,
    })
  }

  /**
   * Check if record has a valid (unexpired) OTP
   * @param otpRecord - OTP record
   * @returns Boolean indicating valid OTP presence
   */
  private hasValidOtp(otpRecord: any) {
    return (
      otpRecord.otp &&
      otpRecord.otpCreatedAt &&
      new Date() <
        new Date(otpRecord.otpCreatedAt.getTime() + config.otpExpiresIn)
    )
  }

  /**
   * Check if record is temporarily blocked
   * @param otpRecord - OTP record
   * @returns Boolean indicating temporary block status
   */
  private isTemporarilyBlocked(otpRecord: any) {
    return otpRecord.otpBlockUntil && new Date() < otpRecord.otpBlockUntil
  }

  /**
   * Get remaining time for temporary block
   * @param otpRecord - OTP record
   * @returns Remaining time in seconds
   */
  private getRemainingBlockTime(otpRecord: any) {
    if (!otpRecord.otpBlockUntil) return 0
    return Math.ceil((otpRecord.otpBlockUntil.getTime() - Date.now()) / 1000)
  }

  /**
   * Get remaining time for current OTP
   * @param otpRecord - OTP record
   * @returns Remaining time in seconds
   */
  private getRemainingOtpTime(otpRecord: any) {
    if (!otpRecord.otpCreatedAt) return 0
    const expiresAt = otpRecord.otpCreatedAt.getTime() + config.otpExpiresIn
    return Math.ceil((expiresAt - Date.now()) / 1000)
  }
  /**
   * Generate a random OTP
   * @returns Random OTP string
   */
  private generateRandomOtp(length: number = 6): string {
    const digits = '0123456789'
    let otp = ''
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)]
    }
    return otp
  }
  private validatePhoneNumber(phoneNo: string): boolean {
    // phone no validation logic for Bangladesh
    const phoneRegex = /^(\+8801[3-9]\d{8}|01[3-9]\d{8})$/
    if (!phoneRegex.test(phoneNo)) {
      throw new ApiError(400, 'Invalid phone number format')
    }
    return true
  }
}

export default new OtpServices()
