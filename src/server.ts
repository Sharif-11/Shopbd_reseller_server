import fs from 'fs'
import { createServer, Server } from 'http'
import util from 'util'

import { Server as SocketIOServer } from 'socket.io'
import app from './app'
import config from './config/index'
import { notificationService } from './services/Real-Time-Notification/NotificationService'
import { NotificationSocketHandler } from './services/Real-Time-Notification/SocketHandler'
import prisma from './utils/prisma'
export const server: Server = createServer(app)
async function bootstrap() {
  const logFile = fs.createWriteStream('application.log', { flags: 'a' })

  // Override console.log
  console.log = function () {
    logFile.write(util.format.apply(null, Array.from(arguments)) + '\n')
    process.stdout.write(util.format.apply(null, Array.from(arguments)) + '\n')
  }

  try {
    try {
      await prisma.$connect()
      console.log('✅ Successfully connected to PostgreSQL database')
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL database:', error)
      throw error // This will be caught by the outer try-catch
    }
    // Start the server
    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.env} mode`)
    })

    // Configure server timeout
    server.timeout = 60000 // 60 seconds

    // Handle unhandled rejections
    process.on(
      'unhandledRejection',
      (reason: Error | any, promise: Promise<any>) => {
        console.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`)
        // Consider logging to an external service here
      }
    )

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error(`Uncaught Exception: ${error.message}`)
      // Consider logging to an external service here
      process.exit(1)
    })

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`)

      try {
        // Close server
        if (server) {
          await new Promise<void>((resolve, reject) => {
            server.close(err => {
              if (err) {
                console.error('Error while closing server:', err)
                reject(err)
              } else {
                console.log('HTTP server closed.')
                resolve()
              }
            })
          })
        }

        // Disconnect Prisma client
        await prisma.$disconnect()
        console.log('Database connection closed.')

        // Exit process
        process.exit(0)
      } catch (error) {
        console.error('Error during shutdown:', error)
        process.exit(1)
      }
    }

    // Register signal handlers
    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
  } catch (error) {
    console.error('Failed to start server:', error)

    try {
      await prisma.$disconnect()
    } catch (prismaError) {
      console.error('Failed to disconnect from database:', prismaError)
    }

    process.exit(1)
  }
}
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Adjust this in production to your client's origin
    methods: ['GET', 'POST'],
  },
})
const notificationSocketHandler = new NotificationSocketHandler(
  io,
  notificationService
)

bootstrap()
export { io, notificationSocketHandler }
