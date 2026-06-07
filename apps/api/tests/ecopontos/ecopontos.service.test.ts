import assert from 'node:assert/strict';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EcopontosService } from '../../src/ecopontos/ecopontos.service';
import type { TestCase } from '../test-helpers';

interface FakeEcopontoRow {
  id: string;
  nome: string;
  codigo: string | null;
  morada: string;
  zona: string | null;
  distanciaLabel: string;
  ocupacao: number;
  tipos: unknown;
  sensorEstado: string;
  ultimaRecolha: string | null;
  ultimaAtualizacao: string | null;
  lat: number;
  lng: number;
  bateria: number | null;
  temperatura: number | null;
  ativo: boolean;
  ordem: number;
}

class FakePrismaEcopontos {
  private store: FakeEcopontoRow[];
  private nextId = 1;

  constructor(initial: FakeEcopontoRow[]) {
    this.store = initial.map((r) => ({ ...r }));
  }

  readonly ecoponto = {
    findMany: async (args: {
      where?: { ativo?: boolean };
      orderBy: { ordem: 'asc' };
    }) => {
      let rows = [...this.store];
      if (args.where?.ativo === true) {
        rows = rows.filter((r) => r.ativo);
      }
      rows.sort((a, b) => a.ordem - b.ordem);
      return rows.map((r) => ({ ...r }));
    },
    create: async (args: {
      data: {
        nome: string;
        codigo: string | null;
        morada: string;
        zona: string | null;
        ocupacao: number;
        tipos: unknown;
        sensorEstado: string;
        ultimaRecolha: string | null;
        lat: number;
        lng: number;
        ordem: number;
      };
    }) => {
      const row: FakeEcopontoRow = {
        id: `eco-${this.nextId++}`,
        nome: args.data.nome,
        codigo: args.data.codigo,
        morada: args.data.morada,
        zona: args.data.zona,
        distanciaLabel: '',
        ocupacao: args.data.ocupacao,
        tipos: args.data.tipos,
        sensorEstado: args.data.sensorEstado,
        ultimaRecolha: args.data.ultimaRecolha,
        ultimaAtualizacao: null,
        lat: args.data.lat,
        lng: args.data.lng,
        bateria: null,
        temperatura: null,
        ativo: true,
        ordem: args.data.ordem,
      };
      this.store.push(row);
      return { ...row };
    },
    update: async (args: {
      where: { id: string };
      data: Partial<FakeEcopontoRow>;
    }) => {
      const idx = this.store.findIndex((r) => r.id === args.where.id);
      if (idx < 0) {
        throw new Error('P2025');
      }
      this.store[idx] = { ...this.store[idx]!, ...args.data };
      return { ...this.store[idx]! };
    },
    updateMany: async (args: { where: { id: string }; data: { ativo: boolean } }) => {
      const idx = this.store.findIndex((r) => r.id === args.where.id);
      if (idx < 0) {
        return { count: 0 };
      }
      this.store[idx]!.ativo = args.data.ativo;
      return { count: 1 };
    },
  };
}

function baseRow(overrides: Partial<FakeEcopontoRow> = {}): FakeEcopontoRow {
  return {
    id: overrides.id ?? 'eco-1',
    nome: overrides.nome ?? 'Teste',
    codigo: overrides.codigo ?? 'EP-99',
    morada: overrides.morada ?? 'Rua A',
    zona: overrides.zona ?? 'Centro',
    distanciaLabel: '',
    ocupacao: overrides.ocupacao ?? 30,
    tipos: overrides.tipos ?? ['Papel'],
    sensorEstado: overrides.sensorEstado ?? 'online',
    ultimaRecolha: null,
    ultimaAtualizacao: null,
    lat: 40.64,
    lng: -8.65,
    bateria: overrides.bateria ?? 80,
    temperatura: overrides.temperatura ?? 14,
    ativo: overrides.ativo ?? true,
    ordem: overrides.ordem ?? 0,
  };
}

export const ecopontosServiceTests: TestCase[] = [
  {
    name: 'lists only active ecopontos by default and maps nivel from ocupacao',
    run: async () => {
      const prisma = new FakePrismaEcopontos([
        baseRow({ id: 'a', ocupacao: 96, ordem: 1 }),
        baseRow({ id: 'b', ocupacao: 40, ativo: false, ordem: 0 }),
      ]);
      const service = new EcopontosService(prisma as never);

      const res = await service.list({});
      assert.equal(res.ecopontos.length, 1);
      assert.equal(res.ecopontos[0]!.id, 'a');
      assert.equal(res.ecopontos[0]!.nivel, 'cheio');
    },
  },
  {
    name: 'blocks ecoponto create for citizen role',
    run: async () => {
      const service = new EcopontosService(new FakePrismaEcopontos([]) as never);
      await assert.rejects(
        () =>
          service.create('CIDADAO', {
            nome: 'Novo',
            morada: 'Rua',
            ocupacao: 10,
            lat: 40,
            lng: -8,
          }),
        (e: unknown) => e instanceof ForbiddenException,
      );
    },
  },
  {
    name: 'allows operator to create ecoponto',
    run: async () => {
      const prisma = new FakePrismaEcopontos([]);
      const service = new EcopontosService(prisma as never);
      const row = await service.create('OPERADOR_VEOLIA', {
        nome: 'Novo EP',
        morada: 'Av. Teste',
        ocupacao: 55,
        lat: 40.1,
        lng: -8.1,
        tipos: ['Vidro'],
      });
      assert.equal(row.nome, 'Novo EP');
      assert.equal(row.nivel, 'medio');
      assert.equal(row.sensor_estado, 'online');
    },
  },
  {
    name: 'updates ecoponto ocupacao and reflects nivel',
    run: async () => {
      const prisma = new FakePrismaEcopontos([baseRow({ id: 'x', ocupacao: 20 })]);
      const service = new EcopontosService(prisma as never);
      const row = await service.update('ADMIN', 'x', { ocupacao: 90 });
      assert.equal(row.nivel, 'alto');
    },
  },
  {
    name: 'remove sets ecoponto inactive',
    run: async () => {
      const prisma = new FakePrismaEcopontos([baseRow({ id: 'z' })]);
      const service = new EcopontosService(prisma as never);
      await service.remove('TECNICO_AUTARQUIA', 'z');
      const res = await service.list({});
      assert.equal(res.ecopontos.length, 0);
    },
  },
  {
    name: 'remove throws not found for unknown id',
    run: async () => {
      const service = new EcopontosService(new FakePrismaEcopontos([]) as never);
      await assert.rejects(
        () => service.remove('ADMIN', 'missing'),
        (e: unknown) => e instanceof NotFoundException,
      );
    },
  },
];
