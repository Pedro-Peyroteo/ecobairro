import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Forçar carregamento do ficheiro .env na pasta apps/api ou na raiz
dotenv.config({ path: resolve(process.cwd(), '../../.env') }); // Se executado dentro de apps/api
dotenv.config({ path: resolve(process.cwd(), '.env') });       // Fallback se executado na raiz

async function testSmtp() {
  console.log('=============================================');
  console.log('🔍 INICIANDO TESTE DE CONEXÃO SMTP (EcoBairro)');
  console.log('=============================================');

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || '587';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === '465';

  console.log(`📡 Servidor: ${host}:${port}`);
  console.log(`🔐 Utilizador: ${user || 'Não definido'}`);
  console.log(`🔒 Secure (SSL/TLS): ${secure}`);
  console.log('---------------------------------------------');

  if (!host) {
    console.error('❌ ERRO: A variável SMTP_HOST não está definida no ficheiro .env');
    process.exit(1);
  }

  // Criar transporte
  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure,
    auth: {
      user,
      pass,
    },
    // Algumas configurações de email requerem ignorar certificados inválidos em dev
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });

  try {
    console.log('⏳ A testar ligação com o servidor...');
    await transporter.verify();
    console.log('✅ Ligação estabelecida com sucesso!');

    const emailDestino = 'moisesmatosbraz3359@gmail.com';
    console.log(`⏳ A enviar email de teste para: ${emailDestino}...`);

    const info = await transporter.sendMail({
      from: `"EcoBairro Teste" <${process.env.SMTP_FROM || user}>`,
      to: emailDestino,
      subject: 'EcoBairro - Teste de Configuração SMTP ✔',
      text: 'Se recebeu este email, significa que o envio de emails no EcoBairro está a funcionar na perfeição!',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
          <h2 style="color: #2e7d32;">Teste Bem-Sucedido! 🎉</h2>
          <p>O seu servidor SMTP no EcoBairro conseguiu enviar este email de forma autónoma.</p>
          <hr/>
          <p style="font-size: 12px; color: #666;">Data: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    console.log('✅ Email enviado com sucesso!');
    console.log(`🆔 ID da Mensagem: ${info.messageId}`);
    console.log('=============================================');

  } catch (error) {
    console.error('\n❌ FALHA NO TESTE:');
    console.error(error);
  }
}

testSmtp();
