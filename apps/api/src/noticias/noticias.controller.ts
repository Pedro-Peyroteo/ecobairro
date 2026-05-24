import { Controller, Get, Inject, Query } from '@nestjs/common';
import type { ListNoticiasResponse } from '@ecobairro/contracts';
import { ListNoticiasDto } from './dto/list-noticias.dto';
import { NoticiasService } from './noticias.service';

@Controller('noticias')
export class NoticiasController {
  private readonly svc: NoticiasService;
  constructor(@Inject(NoticiasService) svc: NoticiasService) { this.svc = svc; }

  @Get()
  list(@Query() query: ListNoticiasDto): Promise<ListNoticiasResponse> {
    return this.svc.list(query);
  }
}
