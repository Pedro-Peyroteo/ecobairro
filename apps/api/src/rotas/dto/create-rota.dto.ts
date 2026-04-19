import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateRotaDto {
  @IsUUID()
  zonaId!: string;

  @IsDateString()
  dataExecucao!: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  ecopontos?: string[];

  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdateRotaEstadoDto {
  @IsString()
  estado!: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  ecopontos?: string[];
}
