import { PrismaClient } from "@prisma/client";

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ['error'],
    errorFormat: 'minimal',
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }
  prisma = global.prisma;
}

// Test connection on initialization
prisma.$connect()
  .then(() => {
    console.log('✅ Prisma connected to database successfully');
  })
  .catch((error) => {
    console.error('❌ Prisma failed to connect to database:', error.message);
    console.error('Database URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
    if (error.code === 'P1001') {
      console.error('Cannot reach database server. Please check:');
      console.error('1. Database server is running');
      console.error('2. DATABASE_URL is correct in .env file');
      console.error('3. Database credentials are valid');
    }
  });

export default prisma;
