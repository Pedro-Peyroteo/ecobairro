| #   | Método   | Rota                         | Descrição                                                                  | Auth                     | Fluxo                                                       |
| --- | -------- | ---------------------------- | -------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------- |
| E6  | `POST`   | `/ecopontos`                 | Criar ecoponto                                                             | TECNICO_AUTARQUIA, ADMIN | NestJS → PG write → NOTIFY → Redis invalidar zona           |
| E7  | `PUT`    | `/ecopontos/:id`             | Actualizar dados (nome, tipologias, acessibilidade, horário)               | TECNICO_AUTARQUIA, ADMIN | NestJS → PG write → NOTIFY → del `ecoponto:{id}` + zona     |
| E8  | `PATCH`  | `/ecopontos/:id/localizacao` | Mover ecoponto — operação separada por impacto (muda zona automaticamente) | ADMIN                    | NestJS → PG write, recalcula zona_id via ST_Within → NOTIFY |
| E9  | `DELETE` | `/ecopontos/:id`             | Soft delete — só se sem reports abertos                                    | ADMIN                    | NestJS → verifica dependências → PG write eliminado_em      |
| E10 | `PATCH`  | `/ecopontos/:id/sensor`      | Associar/desassociar sensor IoT                                            | TECNICO_AUTARQUIA, ADMIN | NestJS → PG write tem_sensor + device_id config             |

**Corpo de E6/E7 (criar/actualizar ecoponto):**

```
{
  nome: string (required),
  descricao: string (optional),
  localizacao: { lat: float, lng: float } (required para E6),
  morada_textual: string (optional),
  tipologias: ("VIDRO"|"PAPEL"|"EMBALAGENS"|"ORGANICO"|"GERAL"|"OUTROS")[] (required),
  acessibilidade: {
    rampa: boolean,
    cobertura: boolean,
    iluminacao: boolean,
    piso_nivelado: boolean
  },
  horario: {
    seg: { abre: "HH:MM", fecha: "HH:MM" } | null,
    ter: ..., qua: ..., qui: ..., sex: ...,
    sab: { abre: "HH:MM", fecha: "HH:MM" } | null,
    dom: null
  } | null  (null = 24h sem restrição)
}
```