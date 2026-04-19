import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDateString,
  ValidateNested,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuizOpcaoDto {
  @IsString()
  texto!: string;

  @IsBoolean()
  correta!: boolean;

  @IsInt()
  @Min(0)
  ordem!: number;
}

export class CreateQuizPerguntaDto {
  @IsString()
  texto!: string;

  @IsInt()
  @Min(0)
  ordem!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOpcaoDto)
  opcoes!: CreateQuizOpcaoDto[];
}

export class CreateQuizDto {
  @IsString()
  titulo!: string;

  @IsOptional()
  @IsEnum(['SEMANAL', 'ESPECIAL', 'CAMPANHA'])
  tipo?: string;

  @IsDateString()
  disponivelDe!: string;

  @IsDateString()
  disponivelAte!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizPerguntaDto)
  perguntas!: CreateQuizPerguntaDto[];
}

export class ResponderOpcaoDto {
  @IsString()
  sessaoId!: string;

  @IsString()
  perguntaId!: string;

  @IsString()
  opcaoId!: string;
}
