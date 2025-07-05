import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client'
import { NextFunction, Request, Response } from 'express'
import { supportTicketService } from './supportTicket.services'

class SupportTicketController {
  async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const {
        subject,
        category,
        priority,
        message,
        attachmentUrls = [],
        orderId,
        paymentId,
        productId,
      } = req.body

      const ticket = await supportTicketService.createTicket(userId!, {
        subject,
        category,
        priority,
        message,
        attachmentUrls: Array.isArray(attachmentUrls)
          ? attachmentUrls
          : [attachmentUrls],
        orderId,
        paymentId,
        productId,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Ticket created successfully',
        success: true,
        data: ticket,
      })
    } catch (error) {
      next(error)
    }
  }

  async replyToTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { ticketId, message, attachmentUrls = [] } = req.body
      console.log(req?.user)
      const senderType = req.user?.role === 'Seller' ? 'SELLER' : 'SYSTEM'

      const newMessage = await supportTicketService.replyToTicket(userId!, {
        ticketId,
        message,
        attachmentUrls: Array.isArray(attachmentUrls)
          ? attachmentUrls
          : [attachmentUrls],
        senderType,
      })

      res.status(201).json({
        statusCode: 201,
        message: 'Reply added successfully',
        success: true,
        data: newMessage,
      })
    } catch (error) {
      next(error)
    }
  }

  async closeTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { ticketId } = req.params

      const ticket = await supportTicketService.closeTicket(userId!, ticketId)

      res.status(200).json({
        statusCode: 200,
        message: 'Ticket closed successfully',
        success: true,
        data: ticket,
      })
    } catch (error) {
      next(error)
    }
  }

  async getTicketDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { ticketId } = req.params

      const ticket = await supportTicketService.getTicketDetails(
        ticketId,
        userId!,
      )

      res.status(200).json({
        statusCode: 200,
        message: 'Ticket details retrieved successfully',
        success: true,
        data: ticket,
      })
    } catch (error) {
      next(error)
    }
  }

  async getUserTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { status, page, limit, search } = req.query

      const tickets = await supportTicketService.getUserTickets(userId!, {
        status: status as TicketStatus | TicketStatus[],
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string | undefined,
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Tickets retrieved successfully',
        success: true,
        data: tickets,
      })
    } catch (error) {
      next(error)
    }
  }

  async getAllTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId
      const { status, page, limit, search, priority, category } = req.query

      const tickets = await supportTicketService.getAllTickets(userId!, {
        status: status as TicketStatus | TicketStatus[],
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string | undefined,
        priority: priority as TicketPriority | TicketPriority[],
        category: category as TicketCategory | TicketCategory[],
      })

      res.status(200).json({
        statusCode: 200,
        message: 'Tickets retrieved successfully',
        success: true,
        data: tickets,
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new SupportTicketController()
