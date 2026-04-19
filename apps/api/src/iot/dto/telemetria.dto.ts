import { IsString, IsNumber, IsOptional, IsObject, Min, Max } from 'class-validator';

export class TelemetriaDto {
  @IsString()
  device_id!: string;

  @IsString()
  ecoponto_id!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  nivel_enchimento?: number;

  @IsOptional()
  @IsString()
  estado_reportado?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
