import { IsString, IsEmail, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateOperadorDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  nomeCompleto!: string;

  @IsString()
  entidadeEmpregadora!: string;

  @IsOptional()
  @IsString()
  cargo?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  zonasResponsabilidade?: string[];

  @IsOptional()
  @IsString()
  role?: string;
}

export class UpdateOperadorDto {
  @IsOptional()
  @IsString()
  nomeCompleto?: string;

  @IsOptional()
  @IsString()
  entidadeEmpregadora?: string;

  @IsOptional()
  @IsString()
  cargo?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  zonasResponsabilidade?: string[];

  @IsOptional()
  @IsString()
  role?: string;
}
