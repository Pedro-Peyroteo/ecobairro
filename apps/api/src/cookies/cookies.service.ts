import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCookieLogDto } from './dto/create-cookie-log.dto';

@Injectable()
export class CookiesService {
  constructor(private db: DatabaseService) {}

  async createLog(createLogDto: CreateCookieLogDto, ipHash?: string) {
    return this.db.cookieConsentLog.create({
      data: {
        deviceId: createLogDto.deviceId,
        userId: createLogDto.userId,
        analytics: createLogDto.analytics,
        marketing: createLogDto.marketing,
        preferences: createLogDto.preferences,
        ipHash: ipHash,
      },
    });
  }
}
