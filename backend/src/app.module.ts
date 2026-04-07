import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RecordsModule } from "./modules/records/records.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120
      }
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    RecordsModule,
    DashboardModule,
    HealthModule
  ]
})
export class AppModule {}
