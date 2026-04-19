import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateCidadaoProfileDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  nome_completo?: string;

  @IsOptional()
  @IsBoolean()
  gamification_opt_in?: boolean;

  @IsOptional()
  @IsObject()
  notificacao_prefs?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  dashboard_widgets?: Record<string, unknown>;
}
