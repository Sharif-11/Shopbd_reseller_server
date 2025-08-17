import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Application } from 'express'
import helmet from 'helmet'

import config from './config'
import globalErrorHandler from './middlewares/globalErrorHandler'
import trimRequestBody from './middlewares/trim.middlewares'
import GlobalRoutes from './routes/global.routes'
import dbController from './services/Utility Services/db.controller'

const app: Application = express()

// Security middleware
app.use(helmet())

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   standardHeaders: true,
//   legacyHeaders: false,
// })
// app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())
app.use(trimRequestBody)

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    // Development environment - allow all origins
    if (config.env === 'development') {
      return callback(null, true)
    }

    // Production environment - allow only specific origins
    const allowedOrigins = [
      'https://admin.shopbdresellerjobs.shop',
      'https://shopbdresellerjobs.shop',
      'https://shopbdresellerjob.com',
    ]
    // Allow all subdomains of shopbdresellerjobs.shop
    if (origin?.endsWith('.shopbdresellerjobs.shop')) {
      return callback(null, true)
    }
    if (origin?.endsWith('.shopbdresellerjob.com')) {
      return callback(null, true)
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // Origin not allowed
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  optionsSuccessStatus: 200,
}

app.use(cors(corsOptions))

// Routes
app.use('/api/v1', GlobalRoutes)

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    statusCode: 200,
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  })
})
app.get('/reset-database', dbController.resetDatabase)

// Handle 404
app.all('*', (req, res) => {
  res.status(404).json({
    statusCode: 404,
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`,
  })
})

// Global error handler
app.use(globalErrorHandler)

export default app
