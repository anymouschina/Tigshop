import { Module, Global } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: 'CONFIG',
      useValue: {
        port: process.env.PORT || 3000,
        databaseUrl: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/tigshop',
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      },
    },
  ],
  exports: ['CONFIG'],
})
export class ConfigModule {} 