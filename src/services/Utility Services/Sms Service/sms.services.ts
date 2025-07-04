import axios from 'axios'
import config from '../../../config'
import ApiError from '../../../utils/ApiError'
import SmsServiceError from '../../../utils/SmsServiceError'
import configServices from '../Configuration/config.services'

type SmsResponse = {
  response_code: number
  message_id?: number
  success_message?: string
  error_message?: string
}

type BulkSmsResponse = {
  response_code: number
  success_count?: number
  failed_count?: number
  success_message?: string
  error_message?: string
  failed_numbers?: string[]
}

type PersonalizedMessage = {
  number: string
  message: string
}
const DEFAULT_NOTIFICATIONS = {
  withdrawRequestNotification: false,
  orderArrivalNotification: true,
  orderDeliveryNotification: true,
  orderCompletionNotification: false,
  withdrawCompletionNotification: true,
}

class SmsServices {
  private static readonly API_KEY = config.apiKey
  private static readonly SENDER_ID = config.senderId
  private static readonly BASE_URL = config.smsUrl
  private static readonly BULK_SMS_URL = config.smsUrl // Fallback to smsUrl if bulkSmsUrl not configured

  private static responseMessages: { [key: number]: string } = {
    202: 'SMS Submitted Successfully',
    1001: 'Invalid Number',
    1002: 'Sender ID not correct or disabled',
    1003: 'Required fields missing or contact system administrator',
    1005: 'Internal Error',
    1006: 'Balance validity not available',
    1007: 'Insufficient balance',
    1011: 'User ID not found',
    1012: 'Masking SMS must be sent in Bengali',
    1013: 'Sender ID not found by API key',
    1014: 'Sender type name not found using this sender by API key',
    1015: 'Sender ID has no valid gateway by API key',
    1016: 'Sender type name active price info not found by this sender ID',
    1017: 'Sender type name price info not found by this sender ID',
    1018: 'Account owner is disabled',
    1019: 'Sender type name price for this account is disabled',
    1020: 'Parent account not found',
    1021: 'Parent active sender type price for this account is not found',
    1031: 'Account not verified, please contact administrator',
    1032: 'IP not whitelisted',
  }

  /**
   * Send SMS to a single recipient
   */
  static async sendSingleSms(
    mobileNo: string,
    message: string,
  ): Promise<SmsResponse> {
    try {
      const params = {
        api_key: this.API_KEY,
        type: 'text',
        number: mobileNo,
        senderid: this.SENDER_ID,
        message: message,
      }

      const response = await axios.get(this.BASE_URL, { params })
      return this.handleSmsResponse(response.data)
    } catch (error) {
      console.error('SMS sending failed:', error)
      throw new ApiError(500, 'Failed to send SMS')
    }
  }

  /**
   * Send SMS to multiple recipients with the same message
   */
  private static async sendBulkSms(
    phoneNumbers: string[],
    message: string,
  ): Promise<BulkSmsResponse> {
    try {
      if (phoneNumbers.length === 0) {
        throw new ApiError(400, 'No phone numbers provided')
      }
      //eliminate duplicates
      const uniqueNumbers = Array.from(new Set(phoneNumbers))

      // Format: "88017XXXXXXXX,88018XXXXXXXX,88019XXXXXXXX"
      const numbers = uniqueNumbers.join(',')

      const params = {
        api_key: this.API_KEY,
        type: 'text',
        number: numbers,
        senderid: this.SENDER_ID,
        message: message,
      }

      const response = await axios.get(this.BULK_SMS_URL, { params })
      return this.handleBulkSmsResponse(response.data)
    } catch (error) {
      console.error('Bulk SMS sending failed:', error)
      throw new ApiError(500, 'Failed to send bulk SMS')
    }
  }

  /**
   * Send personalized SMS to multiple recipients
   */
  private static async sendPersonalizedBulkSms(
    messages: PersonalizedMessage[],
  ): Promise<BulkSmsResponse> {
    try {
      if (messages.length === 0) {
        throw new ApiError(400, 'No messages provided')
      }

      // Format: "88017XXXXXXXX^message1~88018XXXXXXXX^message2"
      const messagesParam = messages
        .map(m => `${m.number}^${m.message}`)
        .join('~')

      const params = {
        api_key: this.API_KEY,
        type: 'text',
        senderid: this.SENDER_ID,
        messages: messagesParam,
      }

      const response = await axios.get(this.BULK_SMS_URL, { params })
      return this.handleBulkSmsResponse(response.data)
    } catch (error) {
      console.error('Personalized bulk SMS sending failed:', error)
      throw new ApiError(500, 'Failed to send personalized bulk SMS')
    }
  }

  /**
   * Handle single SMS API response
   */
  private static handleSmsResponse(response: SmsResponse): SmsResponse {
    const { response_code } = response
    const message = this.responseMessages[response_code] || 'Unknown error code'

    if (response_code === 202) {
      return {
        ...response,
        success_message: response.success_message || message,
      }
    } else {
      throw new SmsServiceError(400, response.error_message || message)
    }
  }

  /**
   * Handle bulk SMS API response
   */
  private static handleBulkSmsResponse(response: any): BulkSmsResponse {
    const { response_code, success_count, failed_count, failed_numbers } =
      response

    if (response_code === 202) {
      return {
        response_code,
        success_count,
        failed_count,
        success_message: 'Bulk SMS submitted successfully',
        failed_numbers: failed_numbers || [],
      }
    } else {
      const errorMessage =
        this.responseMessages[response_code] || 'Unknown error occurred'
      throw new SmsServiceError(400, errorMessage)
    }
  }

  /**
   * Public method to send message(s) - automatically chooses appropriate method
   */
  static async sendMessage(
    recipients: string | string[],
    message: string | string[] | PersonalizedMessage[],
  ): Promise<SmsResponse | BulkSmsResponse> {
    if (Array.isArray(recipients)) {
      if (recipients.length === 1 && !Array.isArray(message)) {
        return this.sendSingleSms(recipients[0], message)
      }

      if (
        Array.isArray(message) &&
        message.length > 0 &&
        typeof message[0] === 'object'
      ) {
        // Personalized messages
        return this.sendPersonalizedBulkSms(message as PersonalizedMessage[])
      } else if (Array.isArray(message)) {
        // Different messages for each recipient
        if (message.length !== recipients.length) {
          throw new ApiError(400, 'Recipients and messages count must match')
        }
        const messages = recipients.map((num, i) => ({
          number: num,
          message: message[i] as string,
        }))
        return this.sendPersonalizedBulkSms(messages)
      } else {
        // Same message for all recipients
        return this.sendBulkSms(recipients, message as string)
      }
    } else {
      return this.sendSingleSms(recipients, message as string)
    }
  }

  /**
   * Send OTP via SMS
   */
  static async sendOtp(
    mobileNo: string,
    otp: string,
  ): Promise<SmsResponse | BulkSmsResponse> {
    const message = `আপনার ওটিপি কোডটি হলো: ${otp}। শপ বিডি রিসেলার জবস থেকে ধন্যবাদ।`
    if (config.env === 'development') {
      console.log(`OTP for ${mobileNo}: ${otp}`)
      return {
        response_code: 200,
        success_message: 'OTP sent successfully (development mode)',
      }
    }
    return this.sendSingleSms(mobileNo, message)
  }

  /**
   * Send password via SMS
   */
  static async sendPassword(
    mobileNo: string,
    password: string,
  ): Promise<SmsResponse | BulkSmsResponse> {
    const message = `আপনার পাসওয়ার্ডটি হলো: ${password}। শপ বিডি রিসেলার জবস থেকে ধন্যবাদ।`
    if (config.env === 'development') {
      console.log(`Password for ${mobileNo}: ${password}`)
      return {
        response_code: 200,
        success_message: 'Password sent successfully (development mode)',
      }
    }
    return this.sendSingleSms(mobileNo, message)
  }

  /**
   * Send order notification to admin(s)
   */
  static async sendOrderNotificationToAdmin({
    mobileNo,
    orderId,
  }: {
    mobileNo: string | string[]
    orderId: number
  }): Promise<SmsResponse | BulkSmsResponse> {
    const { enabled } = await configServices.checkFeature(
      'notifications',
      'orderArrivalNotification',
    )
    const message = `New order received (Order ID: ${orderId})`
    if (config.env === 'development' || !enabled) {
      console.log(message)
      return {
        response_code: 200,
        success_message: 'SMS notifications are disabled',
      }
    }
    if (Array.isArray(mobileNo)) {
      return this.sendBulkSms(mobileNo, message)
    }

    return this.sendSingleSms(mobileNo, message)
  }

  /**
   * Notify admin about seller's balance withdrawal request
   */
  static async sendWithdrawalRequestToAdmin({
    mobileNo,
    sellerName,
    sellerPhoneNo,
    amount,
  }: {
    mobileNo: string | string[]
    sellerName: string
    sellerPhoneNo: string
    amount: number
  }): Promise<SmsResponse | BulkSmsResponse> {
    const { enabled } = await configServices.checkFeature(
      'notifications',
      'withdrawRequestNotification',
    )
    const message = `Withdrawal Request: ${sellerName} (Phone: ${sellerPhoneNo}) requested ${amount} TK.`
    if (!enabled || config.env === 'development') {
      console.log(message)
      return {
        response_code: 200,
        success_message: 'SMS notifications are disabled',
      }
    }
    if (Array.isArray(mobileNo)) {
      return this.sendBulkSms(mobileNo, message)
    }
    return this.sendSingleSms(mobileNo, message)
  }

  /**
   * Notify seller that their order has been processed
   */
  static async notifyOrderProcessed({
    sellerPhoneNo,
    orderId,
  }: {
    sellerPhoneNo: string | string[]
    orderId: number
  }): Promise<SmsResponse | BulkSmsResponse> {
    const message = `Your order (#${orderId}) will be shipped soon.`
    return this.sendMessage(sellerPhoneNo, message)
  }

  /**
   * Notify seller that their order has been shipped with tracking URL
   */
  static async notifyOrderShipped({
    sellerPhoneNo,
    orderId,
    trackingUrl,
  }: {
    sellerPhoneNo: string
    orderId: number
    trackingUrl: string
  }): Promise<SmsResponse | BulkSmsResponse> {
    const { enabled } = await configServices.checkFeature(
      'notifications',
      'orderDeliveryNotification',
    )
    const message = `Your order (#${orderId}) has been shipped. Track it here: ${trackingUrl}`
    if (config.env === 'development' || !enabled) {
      console.clear()
      console.log(message)
      return {
        response_code: 200,
        success_message:
          'Order shipped message sent successfully (development mode)',
      }
    }
    return this.sendSingleSms(sellerPhoneNo, message)
  }

  /**
   * Notify seller about order completion and commission
   */
  static async notifyOrderCompleted({
    sellerPhoneNo,
    orderId,
    orderAmount,
    commission,
    orderType = 'SELLER_ORDER',
  }: {
    sellerPhoneNo: string
    orderId: number
    orderAmount: number
    commission: number
    orderType?: 'SELLER_ORDER' | 'CUSTOMER_ORDER'
  }): Promise<SmsResponse | BulkSmsResponse> {
    const { enabled } = await configServices.checkFeature(
      'notifications',
      'orderCompletionNotification',
    )
    let message = `Your order (#${orderId}) has been completed. Total amount: ${orderAmount} TK. Your commission: ${commission} TK.`
    if (orderType === 'CUSTOMER_ORDER') {
      message = `Your order (#${orderId}) has been completed. Total amount: ${orderAmount} TK.`
    }
    if (config.env === 'development' || !enabled) {
      console.clear()
      console.log(`Order completed message for ${sellerPhoneNo}: ${message}`)
      return {
        response_code: 200,
        success_message: `Order completed message sent successfully ${!enabled ? 'disabled' : '(development mode)'}`,
      }
    }
    return this.sendSingleSms(sellerPhoneNo, message)
  }

  /**
   * Notify customer about order status
   */
  static async notifyCustomer({
    customerPhoneNo,
    orderId,
    status,
    trackingUrl = '',
  }: {
    customerPhoneNo: string | string[]
    orderId: number
    status: 'processed' | 'shipped' | 'delivered' | 'cancelled'
    trackingUrl?: string
  }): Promise<SmsResponse | BulkSmsResponse> {
    let message = ''
    switch (status) {
      case 'processed':
        message = `Your order #${orderId} has been processed.`
        break
      case 'shipped':
        message = `Your order #${orderId} has been shipped. ${
          trackingUrl ? `Track your order: ${trackingUrl}` : ''
        }`
        break
      case 'delivered':
        message = `Your order #${orderId} has been delivered.`
        break
      case 'cancelled':
        message = `Your order #${orderId} has been cancelled.`
        break
    }
    return this.sendMessage(customerPhoneNo, message)
  }
}

export default SmsServices
