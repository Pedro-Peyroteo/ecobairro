
| #   | Método | Rota                   | Descrição                                                     | Auth     | Fluxo                                                   |
| --- | ------ | ---------------------- | ------------------------------------------------------------- | -------- | ------------------------------------------------------- |
| Z1  | `GET`  | `/zonas`               | Listar zonas activas com geometria resumida                   | CIDADAO+ | NestJS → Redis `zonas:ativas:lista` ou PG réplica       |
| Z2  | `GET`  | `/zonas/:id`           | Detalhe completo de uma zona                                  | CIDADAO+ | NestJS → Redis `zona:{id}` ou PG réplica                |
| Z3  | `GET`  | `/zonas/:id/ecopontos` | Ecopontos dentro desta zona com estado actual                 | CIDADAO+ | NestJS → Redis `ecopontos:mapa:zona:{id}` ou PG réplica |
| Z4  | `GET`  | `/zonas/minha`         | Zona do cidadão autenticado (baseada em `zona_residencia_id`) | CIDADAO  | NestJS → Redis `cidadao:profile:{id}` → zona_id         |
| Z5  | `GET`  | `/zonas/ponto`         | Zona que contém um ponto geográfico específico `?lat=&lng=`   | CIDADAO+ | NestJS → PG réplica ST_Within                           |
