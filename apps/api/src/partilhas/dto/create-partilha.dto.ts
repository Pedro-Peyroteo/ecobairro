import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreatePartilhaDto {
  @IsString()
  titulo!: string;

  @IsString()
  descricao!: string;

  @IsString()
  categoria!: string;

  @IsOptional()
  @IsString()
  zonaId?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @IsBoolean()
  disclaimerAceite!: boolean;
}

export class CreateMensagemPartilhaDto {
  @IsString()
  texto!: string;
}
