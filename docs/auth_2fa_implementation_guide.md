# Guia de Implementação: Autenticação de Máxima Segurança (Enterprise-Grade)

Este guia detalha as tarefas técnicas necessárias para implementar um sistema de Autenticação completo e de máxima segurança no projeto EcoBairro. Destina-se à equipa de desenvolvimento para execução direta.

## Visão Geral dos Requisitos de Segurança
- **Duplo Fator (2FA):** App de Autenticação (TOTP) ou Email. Sem suporte a SMS. Com Códigos de Backup Seguros.
- **Auditoria e Logs:** Registo de todas as atividades de segurança com IP e User-Agent.
- **Proteção Ativa:** Bloqueio de IP e bloqueio de conta após N tentativas falhadas. Rate Limiting severo.
- **Gestão de Sessões e Tokens:** Rotação de Refresh Tokens, expiração estrita, e revogação.
- **Notificações:** Alertas por email (HTML puro) sobre logins não reconhecidos e alterações de segurança.

---

## Passo 1: Alterações no Schema de Base de Dados (Prisma)
Para suportar toda a arquitetura de segurança, o `schema.prisma` deve sofrer as seguintes adições:

```prisma
enum TwoFactorType { NONE, TOTP_APP, EMAIL }
enum SecurityEventType { LOGIN_SUCCESS, LOGIN_FAILED, PASSWORD_CHANGED, TWO_FACTOR_ENABLED, TWO_FACTOR_DISABLED, ACCOUNT_LOCKED, DEVICE_REVOKED }

model User {
  // ... campos existentes ...
  
  // 2FA & Recuperação
  twoFactorEnabled Boolean       @default(false) @map("two_factor_enabled")
  twoFactorType    TwoFactorType @default(NONE) @map("two_factor_type")
  twoFactorSecret  String?       @map("two_factor_secret")
  backupCodes      String[]      @map("backup_codes") // Array de hashes bcrypt
  
  // Proteção de Conta
  failedLoginAttempts Int       @default(0) @map("failed_login_attempts")
  lockedUntil         DateTime? @map("locked_until")
  
  // Relações
  securityLogs    SecurityLog[]
  activeSessions  ActiveSession[]
}

// Histórico e Logs de Segurança
model SecurityLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  event     SecurityEventType
  ipAddress String   @map("ip_address")
  userAgent String?  @map("user_agent")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Gestão de Sessões (Revogação e Alertas de Dispositivo)
model ActiveSession {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  refreshToken String   @unique @map("refresh_token") // Hash do token para segurança
  ipAddress    String   @map("ip_address")
  userAgent    String?  @map("user_agent")
  expiresAt    DateTime @map("expires_at") @db.Timestamptz(6)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Passo 2: Instalação de Dependências Base
```bash
pnpm --filter @ecobairro/api add otplib qrcode @nestjs/throttler device-detector-js
pnpm --filter @ecobairro/api add -D @types/qrcode
```

---

## Passo 3: Desenvolvimento Backend (NestJS)

### 3.1. Políticas e Tempos de Expiração de Tokens
Configurar os tempos de vida dos JWT no módulo de Autenticação (`JwtModule`):
- **Access Token:** Expira em **15 minutos** (muito curto, para mitigar roubo). A validade é garantida de forma "stateless" pela própria assinatura do JWT (`exp` claim).
- **Refresh Token:** Expira em **7 dias**. Guardado na Base de Dados (tabela `ActiveSession`). Obriga a **Rotação** (um token usado é invalidado; se reutilizado, revoga toda a cadeia).
- **2FA Temp Token:** Expira em **5 minutos**.

### 3.1.b. Revogação Imediata e Redis Blacklist (Kick de Utilizadores)
Para garantir que um utilizador bloqueado **não continua ativo** na app com um Access Token ainda válido:
- Quando uma conta é bloqueada, eliminada, ou a sessão é terminada remotamente, o Backend escreve imediatamente uma chave no Redis: `revoked_user:{userId}` com um tempo de vida igual à duração do Access Token (15 min).
- O `JwtAuthGuard` (que protege todas as rotas da API) faz uma leitura ultra-rápida (em milissegundos) ao Redis em todos os requests. Se a chave `revoked_user:{userId}` existir, a API devolve `401 Unauthorized` bloqueando o request **instantaneamente**. A app em React vai intercetar o 401 e redirecionar o utilizador para o ecrã de Login no mesmo segundo.

### 3.2. Bloqueio de IPs e Lock de Conta
- **Bloqueio de IP (Brute-Force global):** Usar o `@nestjs/throttler` suportado por Redis.
  - Limite de Login/IP: Máximo 10 tentativas a cada 15 minutos. Se falhar, o IP recebe Erro 429 e é bloqueado temporariamente (no Redis).
- **Bloqueio de Conta (Account Lockout):**
  - Se a mesma conta de utilizador sofrer **5 falhas de login consecutivas** (password incorreta), incrementar `failedLoginAttempts`.
  - Ao chegar a 5, definir `lockedUntil` para daqui a 30 minutos. Enviar email de aviso: "A sua conta foi bloqueada por tentativas sucessivas falhadas".

### 3.3. Logs de Segurança e Auditoria (Audit Trail)
- Criar um Interceptor/Middleware ou usar o `SecurityService` para gravar em `SecurityLog` sempre que um evento crítico ocorrer.
- Estes logs vão alimentar a tabela de "Atividade Recente" no Perfil do utilizador.

### 3.4. Gestão de Sessões e Alerta de Novo Dispositivo
- Ao fazer login, gravar a sessão em `ActiveSession`.
- Se o IP ou o User-Agent forem desconhecidos (não existem nos `SecurityLog` recentes desse utilizador), disparar um **Email de Alerta:** "Novo login efetuado a partir de um novo dispositivo/IP. Se não foi você, mude a sua password imediatamente."

### 3.5. Templates de Email Puros (HTML)
Criar constantes com strings interpoláveis no serviço de Email que contêm as estruturas de Email.
Cenários obrigatórios:
1. `WelcomeEmail`: Ativação de conta.
2. `PasswordResetEmail`: Código/Link 15min.
3. `TwoFactorCodeEmail`: Código 6 dígitos 2FA.
4. `AccountLockedEmail`: Alerta de segurança (5 tentativas falhadas).
5. `NewDeviceLoginEmail`: Alerta de acesso não reconhecido.
*(Tudo feito em HTML simples, tabelas e estilos inline que sigam a estética do EcoBairro)*.

### 3.6. Lógica de 2FA e Backups
- Geração de Secret (TOTP) e QR Code. Validação com margem de tolerância (ex: aceitar código anterior em caso de dessincronização de relógio).
- Geração de 8 códigos de recuperação por conta, guardados via hash (`bcrypt`).
- Ajustar endpoint `/login` para emitir token temporário se 2FA estiver ativo.

---

## Passo 4: Desenvolvimento Frontend (React / Web)

### 4.1. Interface de Gestão de Sessões
- Na nova aba "Segurança", listar as **Sessões Ativas** (obtidas via tabela `ActiveSession`).
- Mostrar Dispositivo, Navegador (com parse usando algo como UAParser) e IP.
- Botão "Terminar Sessão" para revogar esse acesso remotamente (apaga o Refresh Token na DB).

### 4.2. Interface de Histórico de Segurança
- Lista com paginação simples dos últimos `SecurityLogs` para o utilizador poder auditar quem andou a tentar entrar na sua conta.

### 4.3. Fluxos Modernizados
- Formulário de Login adaptado a 2-Passos (Password -> 2FA Token). Tratamento de bloqueios com mensagens claras ("Conta bloqueada temporariamente. Tente novamente em 30 minutos").
- Setup de 2FA em Modal (com exibição da chave em texto e via QR Code).
- Exibição ofuscada dos Códigos de Backup (pedir password antes de os revelar).

---

## Critérios de Aceitação e Definição de Concluído
- [ ] Bloqueio: IP é bloqueado após 10 requests inválidos à rota de `/login`. Conta bloqueada após 5 tentativas de password errada.
- [ ] Sessões: Utilizador pode revogar uma sessão noutro computador e esse computador perde imediatamente o acesso na próxima navegação de página.
- [ ] Auditoria: Fica registado na DB quem fez login e de onde, gerando email se o IP for novo.
- [ ] Emails: Recebidos no cliente de email com formatação HTML limpa.
- [ ] 2FA: Testado com sucesso via Google Authenticator e envio de Email. Códigos expirados devem falhar.
