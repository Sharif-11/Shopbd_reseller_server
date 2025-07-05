import { Router } from 'express'
import { isAuthenticated } from '../../middlewares/auth.middlewares'
import validateRequest from '../../middlewares/validation.middleware'
import supportTicketController from './supportTicket.controllers'
import SupportTicketValidator from './supportTicket.validator'

class SupportTicketRouter {
  private router: Router

  constructor() {
    this.router = Router()
    this.initializeRoutes()
  }

  protected initializeRoutes(): void {
    // Seller routes
    this.router.post(
      '/',
      isAuthenticated,
      SupportTicketValidator.createTicket(),
      validateRequest,
      supportTicketController.createTicket,
    )

    this.router.post(
      '/reply',
      isAuthenticated,
      SupportTicketValidator.replyToTicket(),
      validateRequest,
      supportTicketController.replyToTicket,
    )

    this.router.get(
      '/user',
      isAuthenticated,
      SupportTicketValidator.getUserTickets(),
      validateRequest,
      supportTicketController.getUserTickets,
    )

    this.router.get(
      '/:ticketId',
      isAuthenticated,
      SupportTicketValidator.getTicketDetails(),
      validateRequest,
      supportTicketController.getTicketDetails,
    )

    // Admin routes
    this.router.post(
      '/admin/reply',
      isAuthenticated,
      SupportTicketValidator.replyToTicket(),
      validateRequest,
      supportTicketController.replyToTicket,
    )

    this.router.post(
      '/admin/close/:ticketId',
      isAuthenticated,
      SupportTicketValidator.closeTicket(),
      validateRequest,
      supportTicketController.closeTicket,
    )

    this.router.get(
      '/admin/all',
      isAuthenticated,
      SupportTicketValidator.getAllTickets(),
      validateRequest,
      supportTicketController.getAllTickets,
    )
  }

  public getRouter(): Router {
    return this.router
  }
}

export default new SupportTicketRouter().getRouter()
