import {
  Prisma,
  SenderType,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '@prisma/client'

import ApiError from '../../utils/ApiError'
import prisma from '../../utils/prisma'
import { ftpUploader } from '../FtpFileUpload/ftp.services'
import { notificationService } from '../Real-Time-Notification/NotificationService'
import userServices from '../UserManagement/user.services'

class SupportTicketService {
  private async validateTicketOwnership(ticketId: string, userId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { ticketId },
    })
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found')
    }
    if (ticket.userId !== userId) {
      throw new ApiError(403, 'You are not authorized to access this ticket')
    }
    return ticket
  }

  private async validateAdminAccess(userId: string) {
    await userServices.verifyUserPermission(
      userId,
      'SUPPORT_TICKET_MANAGEMENT',
      'READ'
    )
  }

  private async validateTicketNotClosed(ticketId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { ticketId },
    })
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found')
    }
    if (ticket.status === 'CLOSED') {
      throw new ApiError(400, 'Cannot modify a closed ticket')
    }
    return ticket
  }

  private validateAttachmentUrls(attachmentUrls: string[] = []) {
    if (attachmentUrls.length > 5) {
      throw new ApiError(400, 'Maximum 5 attachments allowed')
    }

    for (const url of attachmentUrls) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new ApiError(400, 'Invalid attachment URL format')
      }
    }
  }

  public async createTicket(
    userId: string,
    {
      subject,
      category,
      priority,
      message,
      attachmentUrls = [],
      orderId,
      paymentId,
      productId,
    }: {
      subject: string
      category: string
      priority?: string
      message: string
      attachmentUrls?: string[]
      orderId?: string
      paymentId?: string
      productId?: string
    }
  ) {
    const user = await userServices.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    // Validate attachments
    this.validateAttachmentUrls(attachmentUrls)

    const ticket = await prisma.$transaction(async tx => {
      const ticket = await tx.supportTicket.create({
        data: {
          subject,
          category: category as any,
          priority: (priority as any) || 'MEDIUM',
          userId: user.userId,
          userType: user.role,
          userName: user.name,
          userPhone: user.phoneNo,
          userEmail: user.email,
          shopName: user.shopName,
          orderId,
          paymentId,
          productId,
        },
      })

      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.ticketId,
          senderId: user.userId,
          senderType: 'SELLER',
          senderName: user.name,
          senderEmail: user.email,
          content: message,
          attachments: attachmentUrls,
        },
      })

      return ticket
    })
    const admins = await userServices.getUsersWithPermission(
      'SUPPORT_TICKET_MANAGEMENT',
      'READ'
    )
    const adminIds = admins.map(admin => admin.userId)
    // Notify admins about new ticket
    // notificationService.addNotification(
    notificationService.addNotification(
      {
        title: 'নতুন সাপোর্ট টিকেট',
        message: `${user.name} একটি নতুন সাপোর্ট টিকেট তৈরি করেছেন।`,
        type: 'TICKET_MESSAGE',
        ticketId: ticket.ticketId,
      },
      adminIds
    )
    return ticket
  }

  public async replyToTicket(
    userId: string,
    {
      ticketId,
      message,
      attachmentUrls = [],
      senderType,
    }: {
      ticketId: string
      message: string
      attachmentUrls?: string[]
      senderType: SenderType
    }
  ) {
    const user = await userServices.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    // Validate ticket exists and not closed
    const ticket = await this.validateTicketNotClosed(ticketId)

    // Validate attachments
    this.validateAttachmentUrls(attachmentUrls)

    // Update ticket status based on who is replying
    let statusUpdate: TicketStatus = ticket.status
    if (senderType === 'SELLER') {
      statusUpdate = 'WAITING_RESPONSE'
    } else if (senderType === 'SYSTEM') {
      statusUpdate = 'IN_PROGRESS'
    }

    const result = await prisma.$transaction(async tx => {
      await tx.supportTicket.update({
        where: { ticketId },
        data: {
          status: statusUpdate,
          updatedAt: new Date(),
        },
      })

      const newMessage = await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId: user.userId,
          senderType,
          senderName: user.name,
          senderEmail: user.email,
          content: message,
          attachments: attachmentUrls,
        },
      })

      return newMessage
    })
    if (senderType === 'SELLER') {
      const admins = await userServices.getUsersWithPermission(
        'SUPPORT_TICKET_MANAGEMENT',
        'READ'
      )
      const adminIds = admins.map(admin => admin.userId)
      // Notify admins about new ticket message
      notificationService.addNotification(
        {
          title: 'নতুন টিকেট মেসেজ',
          message: `${user.name} টিকেটে একটি নতুন মেসেজ পাঠিয়েছেন।`,
          type: 'TICKET_MESSAGE',
          ticketId: ticket.ticketId,
        },
        adminIds
      )
    }
    return result
  }

  public async closeTicket(userId: string, ticketId: string) {
    const user = await userServices.getUserById(userId)
    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    // Only admin can close tickets
    await this.validateAdminAccess(userId)

    const ticket = await this.validateTicketNotClosed(ticketId)

    return await prisma.$transaction(async tx => {
      // Close the ticket (keeping metadata)
      // At first we need to delete the ticket messages and the attachments from ftp server
      // retreive all attachments urls
      const messages = await tx.ticketMessage.findMany({
        where: { ticketId },
      })
      try {
        const attachmentUrls = messages.flatMap(msg => msg.attachments || [])
        // loop through the urls and delete them from ftp server
        await ftpUploader.deleteFilesWithUrls(attachmentUrls)
      } catch (error) {
        console.log('Error deleting attachments from FTP:', error)
      }
      // delete all messages except the last one
      // we will keep the last message as a record of the closure
      const lastMessage = messages[messages.length - 1]
      if (lastMessage) {
        await tx.ticketMessage.deleteMany({
          where: {
            ticketId,
            messageId: { not: lastMessage.messageId },
          },
        })
      }
      const closedTicket = await tx.supportTicket.update({
        where: { ticketId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closedBy: user.userId,
        },
      })

      return closedTicket
    })
  }

  public async getTicketDetails(ticketId: string, userId: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) {
      throw new ApiError(404, 'Ticket not found')
    }

    // Only ticket owner or admin can view
    if (ticket.userId !== userId) {
      await this.validateAdminAccess(userId)
    }

    return ticket
  }

  public async getUserTickets(
    userId: string,
    {
      status,
      page = 1,
      limit = 10,
      search,
    }: {
      status?: TicketStatus | TicketStatus[]
      page?: number
      limit?: number
      search?: string
    }
  ) {
    const skip = (page - 1) * limit
    const where: Prisma.SupportTicketWhereInput = { userId }

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { shopName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ])

    return {
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  public async getAllTickets(
    adminId: string,
    {
      status,
      page = 1,
      limit = 10,
      search,
      priority,
      category,
    }: {
      status?: TicketStatus | TicketStatus[]
      page?: number
      limit?: number
      search?: string
      priority?: TicketPriority | TicketPriority[]
      category?: TicketCategory | TicketCategory[]
    }
  ) {
    await this.validateAdminAccess(adminId)

    const skip = (page - 1) * limit
    const where: Prisma.SupportTicketWhereInput = {}

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status
    }
    if (priority) {
      where.priority = Array.isArray(priority) ? { in: priority } : priority
    }
    if (category) {
      where.category = Array.isArray(category) ? { in: category } : category
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { shopName: { contains: search, mode: 'insensitive' } },
        { userPhone: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 1, // Only get the first message for listing
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ])

    return {
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
  public deleteTickets = async (adminId: string, days: number = 7) => {
    await userServices.verifyUserPermission(
      adminId,
      'SUPPORT_TICKET_MANAGEMENT',
      'DELETE'
    )

    if (days < 1) {
      throw new ApiError(400, 'Days must be a positive integer')
    }
    // I need to delete tickets that are older than the specified number of days along with their messages and attachments
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - (isNaN(days) ? 7 : days))
    const ticketsToDelete = await prisma.supportTicket.findMany({
      where: {
        status: 'CLOSED',
        createdAt: {
          lt: dateThreshold,
        },
      },
      include: {
        messages: true,
      },
    })

    if (ticketsToDelete.length === 0) {
      return { message: 'No tickets to delete' }
    }
    const attachmentUrls: string[] = []
    for (const ticket of ticketsToDelete) {
      for (const message of ticket.messages) {
        if (message.attachments && message.attachments.length > 0) {
          attachmentUrls.push(...message.attachments)
        }
      }
    }
    // Delete attachments from FTP server
    try {
      await ftpUploader.deleteFilesWithUrls(attachmentUrls)
    } catch (error) {
      console.error('Error deleting attachments from FTP:', error)
    }
    // Delete messages and tickets
    await prisma.$transaction(async tx => {
      for (const ticket of ticketsToDelete) {
        await tx.ticketMessage.deleteMany({
          where: { ticketId: ticket.ticketId },
        })
        await tx.supportTicket.delete({
          where: { ticketId: ticket.ticketId },
        })
      }
    })
  }
}

export const supportTicketService = new SupportTicketService()
