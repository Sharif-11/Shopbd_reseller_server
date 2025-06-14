// utils/prisma.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
})

prisma.$on('info', e => {
  if (e.message.includes('connection established')) {
    console.log('ℹ️ Database connection event:', e.message)
  }
})

prisma.$on('warn', e => {
  console.warn('⚠️ Database warning:', e.message)
})

prisma.$on('error', e => {
  console.error('❌ Database error:', e.message)
})

// Note: 'beforeExit' is not a valid Prisma event
// You can use Node.js process events instead if needed
// process.on('beforeExit', () => {
//   console.log('ℹ️ Prisma is disconnecting from the database...')
// })

export default prisma
