import { IsString, IsOptional } from 'class-validator';

export class CreatePedidoDto {
  @IsString()
  morada!: string;

  @IsString()
  tipoMaterial!: string;

  @IsOptional()
  @IsString()
  volumeEstimado?: string;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdatePedidoEstadoDto {
  @IsString()
  estado!: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
