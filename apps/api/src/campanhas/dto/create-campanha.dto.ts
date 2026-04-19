import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateCampanhaDto {
  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsUUID()
  zona_id?: string;

  @IsObject()
  criterios!: Record<string, unknown>;

  @IsString()
  recompensa!: string;

  @IsDateString()
  disponivel_de!: string;

  @IsDateString()
  disponivel_ate!: string;
}
