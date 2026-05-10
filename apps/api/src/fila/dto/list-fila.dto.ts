import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListFilaDto {
  @IsOptional()
  @IsIn(['pendente', 'em_curso', 'resolvido', 'todos'])
  estado?: string;
}
