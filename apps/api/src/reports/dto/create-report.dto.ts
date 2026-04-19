import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export enum ReportCategoriaDto {
  ECOPONTO_CHEIO = 'ECOPONTO_CHEIO',
  ECOPONTO_PARTIDO = 'ECOPONTO_PARTIDO',
  DEPOSICAO_ILEGAL = 'DEPOSICAO_ILEGAL',
  ODORES = 'ODORES',
  GAIVOTAS_ORGANICOS = 'GAIVOTAS_ORGANICOS',
  VANDALISMO = 'VANDALISMO',
  OUTRO = 'OUTRO',
}

export class CreateReportDto {
  @IsOptional()
  @IsUUID()
  ecopontoId?: string;

  @IsEnum(ReportCategoriaDto)
  categoria!: ReportCategoriaDto;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsBoolean()
  localizacaoManual?: boolean;

  @IsOptional()
  @IsString()
  fotoUrl?: string;
}

export class UpdateReportEstadoDto {
  @IsEnum(['EM_ANALISE', 'EM_RESOLUCAO', 'RESOLVIDO', 'REJEITADO'])
  estado!: string;

  @IsOptional()
  @IsString()
  motivoRejeicao?: string;

  @IsOptional()
  @IsString()
  nota?: string;
}
