import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsObject,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';

const TIPOLOGIAS_VALIDAS = ['VIDRO', 'PAPEL', 'PLASTICO', 'ORGANICO', 'GERAL', 'OUTROS'] as const;

export class CreateEcopontoDto {
  @IsOptional()
  @IsString()
  codigoExterno?: string;

  @IsString()
  nome!: string;

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
  @IsString()
  moradaTextual?: string;

  @IsUUID()
  zonaId!: string;

  @IsArray()
  @IsEnum(TIPOLOGIAS_VALIDAS, { each: true })
  tipologias!: string[];

  @IsOptional()
  @IsBoolean()
  temSensor?: boolean;

  @IsOptional()
  @IsObject()
  acessibilidade?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  horario?: Record<string, unknown>;
}
