# Passômetro

Sistema de gerenciamento de enfermaria ortopédica. Aplicação web para controle de pacientes internados, registro de evoluções médicas, acompanhamento de pendências e geração de documentos de alta.

---

## Stack

| Camada         | Tecnologia                         |
| -------------- | ---------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack) |
| Linguagem      | TypeScript                         |
| Banco de dados | SQLite via Prisma ORM              |
| Estilização    | Tailwind CSS v4 + shadcn/ui        |
| Autenticação   | JWT (jose) + cookies httpOnly      |
| PDF            | jsPDF (geração client-side)        |
| Notificações   | Sonner                             |

---

## Funcionalidades

### Autenticação

- Login com usuário e senha configurados em `.env`
- Sessão via JWT em cookie httpOnly
- Proteção de rotas via middleware (`proxy.ts`)

### Gestão de Pacientes

- Cadastro completo com CPF, leito, registro hospitalar, diagnóstico e CID-10
- Comorbidades estruturadas em checkboxes (HAS, DM2, Obesidade, etc.)
- Alergias com alerta visual e bloqueio em prescrições
- Medicamentos de uso contínuo com controle de suspensão pré-operatória (16 classes, incluindo Insulina e Sinvastatina)
- Exames laboratoriais de admissão (Hb, Plaquetas, INR) com alertas automáticos
- Trauma: mecanismo, data e tempo
- Complicações ortopédicas (soltura asséptica, luxação, falha de implante, pseudoartrose)
- Escala PPS (Palliative Performance Scale)
- Cirurgias prévias ortopédicas
- Infecção ortopédica com detalhamento (antibióticos, culturas, dreno)
- Upload de radiografias e fotos de lesões de pele

### Controle Clínico

- **Clínica médica:** seleção de médico responsável (5 opções) ou pendência automática "aguarda clínica"
- **Risco cirúrgico:** avaliação cardiológica com nível (leve/moderado/alto), indicação de UTI, status de ECO e ECG
- **Alta:** datas de alta da Ortopedia e alta hospitalar com cálculo de dias decorridos
- **DPO:** cálculo automático do dia pós-operatório a partir da data da cirurgia

### Evoluções Médicas

- Formulário estruturado com geração automática de texto médico
- Campos: estado geral, eliminações, exame físico, imobilização, curativo, pós-operatório
- **Imobilização:** tipos (gesso, tala, tipoia, tração transesquelética, robofoot, brace) + lateralidade
- **Curativo:** local + lateralidade
- **Reabilitação pós-op:** sentou, fisioterapia, dreno (volume + aspecto)
- Avaliação neurológica pós-op e avaliação cardiovascular (≥55 anos)
- Exames laboratoriais (Hb, Plt, INR, Leucócitos, PCR, VHS, Creatinina, Ureia)
- Infecção ortopédica com culturas, infectologia, antibióticos e lavagens cirúrgicas
- Edição de evoluções já registradas

### Pareceres

- Registro de pareceres de especialidades com data, médico parecerista e descrição
- Disponível no prontuário e em formulário dedicado

### Exames de Imagem

- Registro de RX, TC, RM, ECO, ECG com sítio e achados
- Acesso direto ao **WBSRad** (Hospital Memorial) e **EPACS** (Walfredo Gurgel) com credenciais salvas

### Culturas

- Registro de culturas microbiológicas com data de coleta, sítio, resultado e data do resultado
- Suporte a múltiplas culturas por paciente

### Pendências

- Geração automática de pendências por tipo (RX, risco cirúrgico, infectologia, alta, exame, clínica)
- Página dedicada `/pendencias` com todas as pendências ativas da enfermaria
- **WhatsApp:** composição automática de mensagem ao cirurgião responsável

### Relatórios e Documentos (PDF)

Todos os documentos são gerados com download direto (sem diálogo de impressão), incluindo logotipo e dados do hospital no cabeçalho:

| Documento                        | Conteúdo                                               |
| -------------------------------- | ------------------------------------------------------ |
| **Prescrição de alta**           | Medicações selecionadas com checkboxes                 |
| **Atestado médico**              | Dias de afastamento e CID configuráveis                |
| **Laudo médico**                 | Histórico, diagnóstico, cirurgia e afastamento         |
| **Atestado do acompanhante**     | Template em branco para preenchimento manual           |
| **Solicitação de fisioterapia**  | Indicação pré-preenchida com base na cirurgia          |
| **Relatório de alta hospitalar** | Texto completo gerado das evoluções                    |
| **Calendário de tratamento**     | Cronograma imprimível para o paciente                  |
| **Modelos de alta**              | Templates por cirurgião com orientações personalizadas |

### Páginas do Sistema

| Rota                                   | Descrição                                         |
| -------------------------------------- | ------------------------------------------------- |
| `/dashboard`                           | Enfermaria com métricas e lista de pacientes      |
| `/pacientes/novo`                      | Cadastro de novo paciente                         |
| `/pacientes/[id]`                      | Prontuário com 9 abas                             |
| `/pacientes/[id]/evolucao/nova`        | Nova evolução                                     |
| `/pacientes/[id]/evolucao/[id]/editar` | Editar evolução existente                         |
| `/pacientes/[id]/relatorio`            | Relatório médico de alta                          |
| `/pacientes/[id]/calendario`           | Calendário de tratamento imprimível               |
| `/evolucao-lista`                      | Histórico de evoluções agrupado por especialidade |
| `/pendencias`                          | Todas as pendências ativas                        |
| `/modelos-alta`                        | Gerador de documentos de alta                     |
| `/configuracoes`                       | Dados do hospital e ambulatório                   |

### Dashboard

- Métricas em tempo real: internados, aguardando cirurgia, infecção, pendências ativas, alta hoje
- Alertas especiais: pacientes de **Quadril D2–D3** (avaliar alta) e **ATJ 48h**

### Configurações

- Nome, logotipo, endereço e telefone do hospital
- Endereço e telefone do ambulatório
- Dados usados automaticamente no cabeçalho de todos os PDFs

---

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as credenciais desejadas

# Criar banco de dados e aplicar schema
npx prisma db push

# Iniciar servidor de desenvolvimento
npm run dev
```

### Variáveis de ambiente (`.env`)

```env
DATABASE_URL="file:./dev.db"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="sua_senha_aqui"
JWT_SECRET="chave_secreta_longa_e_aleatoria"
NEXT_PUBLIC_APP_NAME="Passômetro"
```

> **Importante:** Não use aspas simples nos valores. Não use `$` no início de valores (dotenv-expand interpreta como variável).

---

## Estrutura do Banco de Dados

```
Paciente → Cirurgia[]
         → Evolucao[] → Pendencia[]
         → Pendencia[]
         → Foto[]
         → Parecer[]
         → Cultura[]
         → ExameImagem[]

Configuracao (singleton)
AuditLog
```

---

## Cirurgiões por Especialidade

| Especialidade  | Cirurgiões                                                                |
| -------------- | ------------------------------------------------------------------------- |
| Quadril        | Hermann Gomes, Djalma Carlos, Fernando Claudino                           |
| Joelho         | Thales Assunção, Felipe Jader, Márcio Rêgo, Marcelo Rêgo, Raniere Nicácio |
| Mão e Micro    | Hélio Rubens, Wilson Alves                                                |
| Ombro          | Marcos Rêgo, Bruno Medeiros, Armando                                      |
| Pé e Tornozelo | Filippi Ranieri, Guilherme Maia                                           |
| Infantil       | Guilherme Maia, Tábata Alcântara                                          |
| Oncológica     | Heitor Maia                                                               |
| Coluna         | Fábio Fagundes                                                            |
| Trauma         | Thiago Araruna                                                            |

---

## Scripts

```bash
npm run dev        # Servidor de desenvolvimento (Turbopack)
npm run build      # Build de produção
npm run start      # Iniciar servidor de produção
npx prisma studio  # Interface visual do banco de dados
npx prisma db push # Aplicar alterações do schema sem migrations
npx prisma generate # Regenerar Prisma Client (rode após parar o servidor)
```

> **Atenção (Windows):** Ao alterar o `schema.prisma`, pare o servidor antes de rodar `prisma generate` para evitar erros de permissão (DLL bloqueada). Se o erro persistir, use `prisma generate --no-engine` e depois reinicie com `prisma generate` normal.

---

## Deploy (DigitalOcean VPS)

```bash
# Build
npm run build

# Iniciar com PM2
pm2 start npm --name passometro -- start

# Nginx como reverse proxy na porta 3000
```

Os arquivos de upload ficam em `uploads/` (pasta privada) e são servidos por rota autenticada (`/api/uploads/...`). Faça backup desta pasta junto com `prisma/dev.db`.

---

## Estrutura Atual (somente `src` e `uploads`)

```text
src/
    app/
        api/
            auth/
                login/
                    route.ts
                logout/
                    route.ts
            configuracoes/
                logo/
                    route.ts
                route.ts
            evolucoes/
                route.ts
            pacientes/
                [id]/
                    culturas/
                        route.ts
                    evolucoes/
                        [evolucaoId]/
                            route.ts
                        route.ts
                    exames-imagem/
                        route.ts
                    fotos/
                        route.ts
                    pareceres/
                        route.ts
                    pendencias/
                        route.ts
                    route.ts
                route.ts
            pendencias/
                route.ts
            uploads/
                [...path]/
                    route.ts
        configuracoes/
            layout.tsx
            page.tsx
        dashboard/
            layout.tsx
            page.tsx
        evolucao-lista/
            EvolucaoListaCliente.tsx
            layout.tsx
            page.tsx
        login/
            page.tsx
        modelos-alta/
            layout.tsx
            ModelosAltaCliente.tsx
            page.tsx
        pacientes/
            novo/
                page.tsx
            [id]/
                calendario/
                    page.tsx
                editar/
                    page.tsx
                evolucao/
                    nova/
                        page.tsx
                    [evolucaoId]/
                        editar/
                            page.tsx
                relatorio/
                    page.tsx
                page.old.tsx
                page.tsx
            layout.tsx
        pendencias/
            layout.tsx
            page.tsx
            PendenciasGlobalCliente.tsx
        favicon.ico
        globals.css
        layout.tsx
        page.tsx
    components/
        dashboard/
            DashboardMetricas.tsx
        evolucao/
            EvolucaoForm.tsx
            EvolucoesList.tsx
        layout/
            AppShell.tsx
            LogoutButton.tsx
            NavLinks.tsx
        pacientes/
            AlterarStatusButton.tsx
            CirurgiaoMultiSelect.old.tsx
            CirurgiaoMultiSelect.tsx
            ExamesImagemTab.tmp.tsx
            ExamesImagemTab.tsx
            FotosSectionView.tsx
            FotoUploadSection.tsx
            PacienteCard.old2.tsx
            PacienteCard.tsx
            PacienteDetailTabs.tsx
            PacienteForm.old.tsx
            PacienteForm.tsx
            PacienteForm_header.tmp
            PacienteListaCliente.tsx
        pendencias/
            PendenciasSection.tsx
        relatorio/
            PrintButton.tsx
            RelatorioCopiarButton.tsx
        shared/
            DownloadPDFButton.tsx
        ui/
            alert.tsx
            badge.tsx
            button.tsx
            card.tsx
            checkbox.tsx
            dialog.tsx
            input.tsx
            label.tsx
            select.tsx
            separator.tsx
            sonner.tsx
            tabs.tsx
            textarea.tsx
    lib/
        auth.ts
        cirurgioes.ts
        evolucao.ts
        medicamentos.ts
        pdfUtils.ts
        prisma.ts
        utils.ts
    types/
        index.ts
    proxy.ts

uploads/
    hospital/
        logo.jpg
        logo.jpeg
    pacientes/
        <paciente-id>/
            <arquivo-de-imagem>
```
