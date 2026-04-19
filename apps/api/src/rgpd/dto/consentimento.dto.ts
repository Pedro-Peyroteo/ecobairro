import { IsString, IsBoolean, IsIn } from 'class-validator';

export const FINALIDADES = [
  'controlo_quantidade_futura',
  'marketing',
  'analytics_comportamento',
  'notificacoes_zona',
  'gamificacao',
] as const;

export type Finalidade = (typeof FINALIDADES)[number];

export class ConsentirDto {
  @IsIn(FINALIDADES)
  finalidade!: Finalidade;

  @IsString()
  versao_texto!: string;

  @IsBoolean()
  aceite!: boolean;
}
