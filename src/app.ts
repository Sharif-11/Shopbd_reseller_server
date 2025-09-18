import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Application } from 'express'
import helmet from 'helmet'

import config from './config'
import globalErrorHandler from './middlewares/globalErrorHandler'
import trimRequestBody from './middlewares/trim.middlewares'
import GlobalRoutes from './routes/global.routes'

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
      'https://admin.shopbdresellerjob.com',
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
// app.get('/', async (req, res) => {
//    const result= await prisma.user.findMany({
//       where: {
//         isVerified: true,
//         referralCode: null,
//       },
//       select: {
//         userId: true,
//       },
//    })
//    const referralCodes: Record<string, string> = {}
//    const uniqueCodes = new Set<string>()
//     for (const user of result) {
//       let referralCode = generateRandomCode(8)
//       while (1) {
//         referralCode = generateRandomCode(8)
//         if (!referralCodes[user.userId as string] && !uniqueCodes.has(referralCode)) {
//           referralCodes[user.userId as string] = referralCode
//           uniqueCodes.add(referralCode)
//           break
//         }
//       }
//     }
//     const updatePromises = result.map(user =>
//       prisma.user.update({
//         where: { userId: user.userId },
//         data: { referralCode: referralCodes[user.userId as string] },
//       })
//     )
//     const results = await Promise.all(updatePromises)

//    res.status(200).json({
//       statusCode: 200,
//       success: true,
//       message: 'Referral codes generated successfully',
//       data: results,
//    })
// })

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    statusCode: 200,
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  })
})

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
