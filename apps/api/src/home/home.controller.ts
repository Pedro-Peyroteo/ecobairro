import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import type { HomeFeedResponse } from '@ecobairro/contracts';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { OptionalUser } from '../auth/optional-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { HomeService } from './home.service';

@Controller('home')
@UseGuards(OptionalJwtAuthGuard)
export class HomeController {
  private readonly homeService: HomeService;

  constructor(@Inject(HomeService) homeService: HomeService) {
    this.homeService = homeService;
  }

  @Get()
  getFeed(
    @OptionalUser() user: AuthenticatedUser | null,
  ): Promise<HomeFeedResponse> {
    return this.homeService.getFeed(user);
  }
}
