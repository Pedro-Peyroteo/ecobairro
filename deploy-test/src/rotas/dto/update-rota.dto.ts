import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateRotaDto {
  @IsOptional()
  @IsIn(['ativa', 'concluida', 'pendente'])
  estado?: string;

  @IsOptional()
  @IsString()
  operador?: string;
}
