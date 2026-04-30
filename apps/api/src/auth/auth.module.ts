import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { readNumberEnv, requireEnv } from '@ecobairro/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: requireEnv('JWT_ACCESS_SECRET'),
      signOptions: {
        expiresIn: `${readNumberEnv('JWT_ACCESS_TTL_MINUTES', 15)}m`,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard, JwtModule],
})
export class AuthModule {}
