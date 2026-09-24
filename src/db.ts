import { PrismaClient } from './generated/prisma/client.js'

import { getDatabaseUrl } from './database-url.js'

import { PrismaMariaDb } from '@prisma/adapter-mariadb'
const adapter = new PrismaMariaDb(getDatabaseUrl())

declare global {
  var __prisma: PrismaClient | undefined
}

export const prisma = globalThis.__prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
