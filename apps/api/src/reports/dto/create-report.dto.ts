import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const REPORT_TIPOS = [
  'Ecoponto Cheio',
  'Deposição Ilegal',
  'Dano em Equipamento',
  'Odores',
  'Vandalismo',
] as const;

export class CreateReportDto {
  @IsString()
  @MinLength(3)
  titulo!: string;

  @IsIn(REPORT_TIPOS)
  tipo!: (typeof REPORT_TIPOS)[number];

  @IsString()
  @MinLength(10)
  descricao!: string;

  @IsString()
  @MinLength(3)
  local!: string;

  @IsOptional()
  @IsString()
  imagem?: string;
}
