# TaskHub

TaskHub é um aplicativo mobile para gerenciamento de eventos e tarefas, construído com Expo e React Native, com autenticação via Supabase, login com Google e exportação para o Google Calendar.

## Resumo

Neste projeto eu uso Expo no fluxo de desenvolvimento e mantenho a pasta nativa Android versionada para execução com `expo run:android`.

O que já está funcionando aqui:

- Autenticação com e-mail e senha
- Login com Google via Supabase
- Cadastro, edição e remoção de eventos
- Estrutura preparada para isolamento de dados por usuário com RLS no Supabase
- Exportação de eventos para o Google Calendar
- Fallback local para compatibilidade com fluxos antigos

## Stack

- Expo
- React Native
- React Navigation
- Supabase
- Expo Auth Session
- Expo SQLite

## Requisitos

Para rodar o projeto ou avaliar o repositório, esse é o setup base:

- Node.js LTS
- npm
- Git
- Android Studio
- SDK Android com `platform-tools`
- Java 17 ou a JBR do Android Studio

## Quick Start

Se a ideia for testar rápido, esse é o fluxo:

```sh
git clone <url-do-repositorio>
cd task-hub
npm install
npx expo start -c
```

Com dispositivo conectado ou emulador aberto:

```sh
npx expo run:android
```

Há também um script web no projeto, mas hoje o foco real de uso e validação está no Android.

## Scripts

Os scripts atuais do projeto são estes:

```sh
npm run start
npm run android
npm run ios
npm run web
```

Observação:

O script `ios` existe no `package.json`, mas este repositório não mantém a pasta `ios/` versionada. Hoje o foco prático do projeto está no Android.

O script `web` também existe, mas não é o fluxo principal documentado aqui.

## Configuração

As credenciais do app são lidas de `expo.extra`, que hoje está definido em `app.json`.

Os campos usados atualmente são:

- `APP_SCHEME`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

O formato esperado hoje é este:

```json
{
  "expo": {
    "extra": {
      "APP_SCHEME": "taskhub",
      "SUPABASE_URL": "https://seu-projeto.supabase.co",
      "SUPABASE_ANON_KEY": "sua-chave-anon"
    }
  }
}
```

Nota para repositório público:

`SUPABASE_ANON_KEY` não é uma chave secreta de backend, mas mesmo assim faz mais sentido evitar valor real hardcoded quando o projeto vai ficar público. Se este repositório for publicado abertamente, o caminho mais limpo é migrar essa configuração para `app.config.js` com `.env` e manter um `.env.example` no repositório.

## Banco e migrações

Os arquivos de apoio para Supabase ficam em `database/`:

- `supabase-schema.sql`
- `supabase-rls-migration.sql`
- `supabase-oauth-migration.sql`

Eles cobrem hoje:

- Estrutura de `users`
- Estrutura de `events`
- Políticas de Row Level Security
- Ajuste de autenticação para login social

## Estrutura do projeto

```text
App.js
components/
database/
navigation/
screens/
android/
```

Resumo por pasta:

- `components/`: Componentes reutilizáveis separados da lógica das telas
- `database/`: Integração com Supabase, SQLite e scripts SQL
- `navigation/`: Apoio à navegação
- `screens/`: Telas principais do app
- `android/`: Projeto nativo Android usado com `expo run:android`

## Fluxo atual

Autenticação:

- A sessão do Supabase é restaurada ao abrir o app
- O perfil é sincronizado após login
- Os tokens do Google podem ser reaproveitados para exportação ao Calendar quando necessário

Dados:

- Os eventos são persistidos com `user_id`
- Leituras e alterações seguem a estrutura prevista para RLS no Supabase
- Parte do fluxo local ainda existe como fallback

## Versionamento

O `.gitignore` já foi ajustado para o cenário atual do projeto.

Hoje a regra é:

- Ignorar cache, logs, builds e arquivos locais de máquina
- Manter o código Android versionado
- Evitar subir artefatos gerados automaticamente

Antes de publicar no GitHub, ainda vale revisar principalmente:

- `app.json`
- Credenciais e valores reais de ambiente
- Arquivos SQL de migração
- Histórico de commits, caso dados de configuração antigos já tenham sido versionados










