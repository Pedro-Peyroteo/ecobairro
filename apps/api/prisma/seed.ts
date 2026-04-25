import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
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
