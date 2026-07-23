# 01 — Mapa de Banco de Dados e Modelos de Dados

## Visão Geral
A aplicação utiliza uma arquitetura híbrida de persistência relacional:
1. **Banco de Dados Relacional Local**: SQLite via `sql.js` (rodando em Node/WASM com persistência atômica em disco em `UserData/database/profiles.db`).
2. **Banco de Dados Relacional em Nuvem**: Supabase (PostgreSQL) para sincronização de workspaces, canvas, notas e leads.

---

## 1. Schemas do Banco Local SQLite (`profiles.db`)

| Nome da Tabela | Finalidade de Negócio | Principais Colunas | Chaves Estrangeiras (FK) | Responsável | Status |
|---|---|---|---|---|---|
| **profiles** | Armazena perfis do navegador anti-detect *(Fingerprint)* | `id`, `name`, `data_dir_path`, `notes`, `status`, `is_active`, `tags`, `category`, `folder_id`, `browser_type` | `folder_id -> folders(id)` | `src/main/database/db.ts` | Ativo *(PROTEGIDO)* |
| **folders** | Pastas de organização para perfis de navegação | `id`, `name`, `is_default`, `created_at` | Nenhuma | `db.ts` | Ativo |
| **fingerprints**| *(Fingerprint)* Atributos de spoofing de hardware e áudio | `id`, `profile_id`, `user_agent`, `platform`, `webgl_vendor`, `viewport_width`, `hardware_concurrency`, `canvas_noise_seed` | `profile_id -> profiles(id)` ON DELETE CASCADE | `db.ts` | Ativo *(PROTEGIDO)* |
| **proxies** | Configuração de proxy por perfil de navegação | `id`, `profile_id`, `type`, `host`, `port`, `username`, `password` | `profile_id -> profiles(id)` ON DELETE CASCADE | `db.ts` | Ativo |
| **proxy_pool** | Pool compartilhado de proxies para reutilização | `id`, `label`, `type`, `host`, `port`, `last_status`, `assigned_profile_id` | Nenhuma | `db.ts` | Ativo |
| **profile_templates**| Templates pré-definidos de fingerprints e configurações | `id`, `name`, `description`, `platform`, `fingerprint_snapshot` | Nenhuma | `db.ts` | Ativo |
| **activity_logs**| Log imutável de auditoria de ações no sistema | `id`, `timestamp`, `action_type`, `profile_id`, `details`, `integrity_hash` | Nenhuma | `db.ts` | Ativo |
| **security_audit_logs**| Log de auditoria de segurança | `id`, `timestamp`, `action_type`, `profile_id`, `details`, `severity` | Nenhuma | `db.ts` | Ativo |
| **sessions** | Sessões de autenticação ativas por perfil | `id`, `profile_id`, `provider`, `status`, `expires_at` | `profile_id -> profiles(id)` | `db.ts` | Ativo |
| **oauth_tokens**| Tokens encriptados de OAuth vinculados a perfis | `id`, `profile_id`, `provider`, `access_token_ref`, `refresh_token_ref` | `profile_id -> profiles(id)` | `db.ts` | Ativo |

---

## 2. Schemas do Supabase (Nuvem / PostgreSQL)

| Tabela Supabase | Domínio de Negócio | Mapeamento no Codebase | Modelo de Dados Principal |
|---|---|---|---|
| **nodes** | Elementos do Canvas 2D, Documentos e Tabelas da Tela | `src/renderer/features/Canvas/canvasStorage.ts` | `id`, `workspace_id`, `title`, `type`, `properties` (JSONB), `parent_id`, `is_deleted` |
| **crm_leads** | Leads e Oportunidades do CRM Kanban | `src/renderer/features/CRM/crmStorage.ts` | `id`, `workspace_id`, `name`, `email`, `phone`, `value`, `status`, `stage_id`, `tags` (Array) |
| **workspaces** | Espaços de Trabalho compartilhados | `src/renderer/context/WorkspaceContext.tsx` | `id`, `name`, `owner_id`, `created_at` |

---

## 3. Riscos de Persistência Identificados
- **Persistência Duplicada LocalStorage + SQLite + Supabase**: O CRM e o Canvas gravam primeiro em `localStorage` e depois disparam um backup assíncrono para o Supabase via `syncManager.ts`. Se o Supabase estiver indisponível ou desacoplado, o `localStorage` do navegador pode estourar a quota de 5MB devido a imagens e rascunhos de canvas em formato base64.
