import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ReportStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '../../.env' });
loadEnv({ path: '.env', override: true });

const databaseUrl =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.POSTGRES_USER ?? 'ecobairro'}:${process.env.POSTGRES_PASSWORD ?? 'ecobairro'}@localhost:${process.env.POSTGRES_PORT ?? '5432'}/${process.env.POSTGRES_DB ?? 'ecobairro'}`;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});
const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);

async function main(): Promise<void> {
  const cidadaoEmail = 'cidadao.seed@ecobairro.local';
  const gestorEmail = 'gestor.seed@ecobairro.local';
  const passwordPlain = 'Password12345';
  const passwordHash = await bcrypt.hash(passwordPlain, BCRYPT_ROUNDS);

  const cidadao = await prisma.user.upsert({
    where: { email: cidadaoEmail },
    update: {
      passwordHash,
      role: UserRole.CIDADAO,
      emailVerified: true,
      eliminadoEm: null,
    },
    create: {
      email: cidadaoEmail,
      passwordHash,
      role: UserRole.CIDADAO,
      emailVerified: true,
      cidadaoPerfil: {
        create: {
          nomeCompleto: 'Cidadao Seed',
          rgpdAccepted: true,
        },
      },
    },
  });

  await prisma.cidadaoPerfil.upsert({
    where: { userId: cidadao.id },
    update: {
      nomeCompleto: 'Cidadao Seed',
      rgpdAccepted: true,
    },
    create: {
      userId: cidadao.id,
      nomeCompleto: 'Cidadao Seed',
      rgpdAccepted: true,
    },
  });

  await prisma.user.upsert({
    where: { email: gestorEmail },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
      eliminadoEm: null,
    },
    create: {
      email: gestorEmail,
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  await prisma.ecoponto.deleteMany();
  await prisma.report.deleteMany();
  await prisma.partilha.deleteMany();
  await prisma.noticia.deleteMany();

  await prisma.ecoponto.createMany({
    data: [
      {
        nome: 'Ecoponto Rossio',
        codigo: 'EP-001',
        morada: 'Praça do Rossio, Aveiro',
        zona: 'Centro',
        distanciaLabel: '250 m',
        ocupacao: 25,
        tipos: ['Papel', 'Vidro', 'Plástico'],
        sensorEstado: 'online',
        ultimaRecolha: '20 Jan 2026',
        ultimaAtualizacao: 'há 12 min',
        lat: 40.6409,
        lng: -8.6537,
        ordem: 0,
      },
      {
        nome: 'Ecoponto Mercado',
        codigo: 'EP-002',
        morada: 'R. do Mercado, Aveiro',
        zona: 'Centro',
        distanciaLabel: '400 m',
        ocupacao: 95,
        tipos: ['Papel', 'Vidro', 'Plástico', 'Metal'],
        sensorEstado: 'online',
        ultimaRecolha: '21 Jan 2026',
        ultimaAtualizacao: 'há 5 min',
        lat: 40.639,
        lng: -8.651,
        ordem: 1,
      },
      {
        nome: 'Ecoponto Universidade',
        codigo: 'EP-003',
        morada: 'Campus Universitário, Aveiro',
        zona: 'Norte',
        distanciaLabel: '800 m',
        ocupacao: 60,
        tipos: ['Papel', 'Plástico'],
        sensorEstado: 'online',
        ultimaRecolha: '19 Jan 2026',
        ultimaAtualizacao: 'há 28 min',
        lat: 40.6315,
        lng: -8.6574,
        ordem: 2,
      },
      {
        nome: 'Ecoponto Glória',
        codigo: 'EP-004',
        morada: 'R. da Glória, Aveiro',
        zona: 'Sul',
        distanciaLabel: '1.1 km',
        ocupacao: 18,
        tipos: ['Vidro', 'Plástico', 'Metal'],
        sensorEstado: 'offline',
        ultimaRecolha: '18 Jan 2026',
        ultimaAtualizacao: 'há 1h',
        lat: 40.6445,
        lng: -8.648,
        ordem: 3,
      },
      {
        nome: 'Ecoponto Beira-Mar',
        codigo: 'EP-005',
        morada: 'Av. Beira-Mar, Aveiro',
        zona: 'Oeste',
        distanciaLabel: '1.5 km',
        ocupacao: 72,
        tipos: ['Papel', 'Vidro'],
        sensorEstado: 'online',
        ultimaRecolha: '17 Jan 2026',
        ultimaAtualizacao: 'há 45 min',
        lat: 40.642,
        lng: -8.661,
        ordem: 4,
      },
      {
        nome: 'Ecoponto Vera Cruz',
        codigo: 'EP-006',
        morada: 'R. Vera Cruz, Aveiro',
        zona: 'Centro',
        distanciaLabel: '900 m',
        ocupacao: 88,
        tipos: ['Papel', 'Vidro', 'Plástico', 'Metal'],
        sensorEstado: 'online',
        ultimaRecolha: '22 Jan 2026',
        ultimaAtualizacao: 'há 10 min',
        lat: 40.637,
        lng: -8.6555,
        ordem: 5,
      },
      {
        nome: 'Ecoponto São Bernardo',
        codigo: 'EP-007',
        morada: 'Av. Dr. Lourenço Peixinho, Aveiro',
        zona: 'Norte',
        distanciaLabel: '1.2 km',
        ocupacao: 42,
        tipos: ['Papel', 'Metal'],
        sensorEstado: 'offline',
        ultimaRecolha: '15 Jan 2026',
        ultimaAtualizacao: 'há 2h',
        lat: 40.643,
        lng: -8.649,
        ordem: 6,
      },
      {
        nome: 'Ecoponto Aradas',
        codigo: 'EP-008',
        morada: 'R. de Aradas, Aveiro',
        zona: 'Este',
        distanciaLabel: '2.1 km',
        ocupacao: 78,
        tipos: ['Vidro', 'Plástico'],
        sensorEstado: 'online',
        ultimaRecolha: '20 Jan 2026',
        ultimaAtualizacao: 'há 30 min',
        lat: 40.635,
        lng: -8.66,
        ordem: 7,
      },
      {
        nome: 'Ecoponto Esgueira',
        codigo: 'EP-009',
        morada: 'Zona Industrial de Aveiro',
        zona: 'Este',
        distanciaLabel: '3.4 km',
        ocupacao: 91,
        tipos: ['Papel', 'Vidro', 'Plástico', 'Metal'],
        sensorEstado: 'online',
        ultimaRecolha: '22 Jan 2026',
        ultimaAtualizacao: 'há 8 min',
        lat: 40.646,
        lng: -8.644,
        ordem: 8,
      },
    ],
  });

  // Partilhas e reports para gamificação/quiz (cada utilizador deve ver valores diferentes).
  const citizens = await prisma.user.findMany({
    where: { role: UserRole.CIDADAO, eliminadoEm: null },
    select: {
      id: true,
      email: true,
      cidadaoPerfil: { select: { nomeCompleto: true } },
      criadoEm: true,
    },
    orderBy: { criadoEm: 'asc' },
  });

  const partilhaTemplates = [
    { titulo: 'Frigorífico em bom estado', autorNome: 'Ana M.', zona: 'Rossio' },
    { titulo: 'Cadeiras de jardim (x4)', autorNome: 'Carlos V.', zona: 'Vera Cruz' },
    { titulo: 'Livros técnicos', autorNome: 'Sofia R.', zona: 'Glória' },
    { titulo: 'Bicicleta usada', autorNome: 'Miguel P.', zona: 'Centro' },
    { titulo: 'Conjunto de lâmpadas', autorNome: 'Raquel S.', zona: 'Este' },
  ];

  const reportTipos = [
    'Ecoponto Cheio',
    'Deposição Ilegal',
    'Dano em Equipamento',
    'Odores',
    'Vandalismo',
  ] as const;

  const now = new Date();
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth(); // 0-11
  const today = new Date(Date.UTC(year, monthIndex, now.getUTCDate(), 12, 0, 0));

  const reportLocais = [
    'Praça do Rossio, Aveiro',
    'R. do Mercado, Aveiro',
    'Campus Universitário, Aveiro',
    'R. da Glória, Aveiro',
    'Av. Beira-Mar, Aveiro',
    'R. Vera Cruz, Aveiro',
    'Av. Dr. Lourenço Peixinho, Aveiro',
    'R. de Aradas, Aveiro',
    'Zona Industrial de Aveiro',
  ];

  // Challenge seed (usado no /quiz).
  await prisma.quizDesafio.deleteMany({ where: { ano: year } });
  await prisma.quizDesafio.create({
    data: {
      titulo: `Herói da Reciclagem ${year}`,
      bonusXp: 50,
      tempoLimiteMin: 2,
      ano: year,
      ativo: true,
    },
  });

  // Inserção de partilhas e reports para cada cidadão existente.
  for (let idx = 0; idx < citizens.length; idx += 1) {
    const c = citizens[idx]!;
    const profileName = c.cidadaoPerfil?.nomeCompleto ?? c.email;

    const partilhaCount = idx === 0 ? 5 : idx === 1 ? 3 : idx === 2 ? 2 : 1;
    const resolvedCount = idx === 0 ? 25 : idx === 1 ? 12 : idx === 2 ? 6 : 2;
    const streakDays = idx === 0 ? 12 : idx === 1 ? 6 : idx === 2 ? 3 : 1;

    // Partilhas (marcadas com userId para serem individuais).
    const partilhasToCreate = partilhaCount;
    for (let p = 0; p < partilhasToCreate; p += 1) {
      const t = partilhaTemplates[(idx + p) % partilhaTemplates.length]!;
      const createdAt = new Date(Date.UTC(year, monthIndex, 1 + ((idx + p) % 28), 10, 0, 0));
      await prisma.partilha.create({
        data: {
          titulo: t.titulo,
          autorNome: profileName,
          zona: t.zona,
          userId: c.id,
          criadoEm: createdAt,
        },
      });
    }

    // Reports resolvidos em dias consecutivos (para streak).
    const dates = Array.from({ length: streakDays }, (_, d) => {
      const dd = new Date(today);
      dd.setUTCDate(dd.getUTCDate() - d);
      return dd;
    });

    const base = Math.floor(resolvedCount / streakDays);
    const remainder = resolvedCount - base * streakDays;

    let created = 0;
    for (let d = 0; d < dates.length; d += 1) {
      const countOnDay = base + (d < remainder ? 1 : 0);
      for (let j = 0; j < countOnDay; j += 1) {
        const tipo = reportTipos[(idx + d + j) % reportTipos.length]!;
        const local = reportLocais[(idx + d + j) % reportLocais.length]!;
        await prisma.report.create({
          data: {
            titulo: `Report ${idx}-${d}-${j}`,
            tipo,
            descricao:
              'Descricao do reporte para gamificação e métricas do utilizador (dados de seed).',
            local,
            status: ReportStatus.RESOLVIDO,
            userId: c.id,
            criadoEm: dates[d]!,
          },
        });
        created += 1;
        if (created >= resolvedCount) break;
      }
      if (created >= resolvedCount) break;
    }
  }

  await prisma.noticia.createMany({
    data: [
      {
        titulo: 'Campanha de Limpeza do Rio',
        resumo:
          'Próxima reunião marcada para sexta-feira às 15h. Venha ajudar a limpar as margens do Rio Vouga.',
        imagemUrl:
          'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?q=80&w=600&auto=format&fit=crop',
        publishedAt: new Date('2025-12-20T12:00:00.000Z'),
        tempoLeituraMin: 3,
      },
      {
        titulo: 'Novos Ecopontos Inteligentes',
        resumo:
          '15 novos equipamentos com sensores IoT e compactação solar instalados no centro de Aveiro.',
        imagemUrl:
          'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?q=80&w=600&auto=format&fit=crop',
        publishedAt: new Date('2025-12-18T12:00:00.000Z'),
        tempoLeituraMin: 2,
      },
      {
        titulo: 'Compostagem Urbana no Parque',
        resumo:
          'O município lança o programa de compostagem coletiva em 5 parques da cidade. Inscrições abertas.',
        imagemUrl:
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=600&auto=format&fit=crop',
        publishedAt: new Date('2025-12-15T12:00:00.000Z'),
        tempoLeituraMin: 4,
      },
    ],
  });

  console.log('Seed concluido com sucesso.');
  console.log('Conta cidadao:', cidadaoEmail);
  console.log('Conta gestor:', gestorEmail);
  console.log('Password (ambas):', passwordPlain);
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao executar seed');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
