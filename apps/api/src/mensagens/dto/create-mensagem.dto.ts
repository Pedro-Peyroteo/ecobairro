import { IsString, IsOptional, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class CreateMensagemInstitucionalDto {
  @IsString()
  titulo!: string;

  @IsString()
  corpo!: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  zonasDestino?: string[];

  @IsOptional()
  @IsBoolean()
  publicar?: boolean;
}
