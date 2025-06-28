import { Router } from 'express'
import { isAuthenticated } from '../../../middlewares/auth.middlewares'
import announcementsController from './announcement.controller'

const announcementRoutes = Router()
announcementRoutes.get('/', announcementsController.getAnnouncements)
announcementRoutes.put(
  '/',
  isAuthenticated,
  announcementsController.updateAnnouncements,
)

export default announcementRoutes
