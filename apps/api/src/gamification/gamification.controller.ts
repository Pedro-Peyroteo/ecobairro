import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import type { QuizMeResponse } from '@ecobairro/contracts';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { GamificationService } from './gamification.service';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(
    @Inject(GamificationService) private readonly svc: GamificationService,
  ) {}

  @Get('quiz/me')
  getQuizMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<QuizMeResponse> {
    return this.svc.getQuizMe(user);
  }
}

