import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, Min, IsObject } from 'class-validator';
import type { ZonaTipo } from '@ecobairro/contracts';

export class CreateZonaDto {
  @IsString()
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsEnum(['OPERACIONAL', 'RESIDENCIAL', 'PRIORITARIA_IOT', 'ADMINISTRATIVA'])
  tipo!: ZonaTipo;

  @IsOptional()
  @IsBoolean()
  ativa?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limiteAntispamReports?: number;

  @IsOptional()
  @IsNumber()
  janelaAntispamHoras?: number;

  @IsOptional()
  @IsString()
  entidadeResponsavel?: string;

  @IsOptional()
  @IsObject()
  alertasConfig?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  motivo?: string;
}
