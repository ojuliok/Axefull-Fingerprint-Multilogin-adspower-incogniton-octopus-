# 01 — Mapa de Serviços, Motores IPC e APIs

## Visão Geral
Mapeamento dos serviços Node.js no processo Main, canais IPC expostos via Preload e bibliotecas de persistência e sincronização.

---

## 1. Handlers IPC (`src/main/ipc/`)

| Handler IPC | Localização | Funcionalidade Principal | Eventos / Métodos IPC Expostos | Domínio | Status |
|---|---|---|---|---|---|
| **appIpc** | `src/main/ipc/appIpc.ts` | Operações gerais da janela, temas, gerenciador de proxies e extensões | `app:get-version`, `window:minimize`, `window:maximize`, `proxy:*`, `extension:*` | Infra | Ativo |
| **authIpc** | `src/main/ipc/authIpc.ts` | Autenticação local, sessão e tokens no SQLite/Keytar | `auth:login`, `auth:logout`, `auth:get-session` | Auth | Ativo |
| **profileIpc** | `src/main/ipc/profileIpc.ts` | *(Fingerprint)* Operações CRUD de perfis e fingerprints | `profile:list`, `profile:create`, `profile:delete`, `profile:update` | Fingerprint *(PROTEGIDO)* | Ativo |
| **browserIpc** | `src/main/ipc/browserIpc.ts` | *(Fingerprint)* Inicialização e fechamento de instâncias do Chromium | `browser:start`, `browser:stop`, `browser:get-active` | Fingerprint *(PROTEGIDO)* | Ativo |
| **bulkVideoIpc** | `src/main/ipc/bulkVideoIpc.ts` | Execução de tarefas em lote no processador de vídeos (MetaClean) | `bulk-video:start`, `bulk-video:cancel`, `bulk-video:progress` | MetaClean / Mídia | Ativo |
| **metacleanIpc** | `src/main/ipc/metacleanIpc.ts` | Limpeza pontual de metadados de arquivos de vídeo e foto | `metaclean:process-file`, `metaclean:get-info` | MetaClean / Mídia | Ativo |
| **dataIpc** | `src/main/ipc/dataIpc.ts` | Exportação/Importação de dados de backup do SQLite | `data:export-backup`, `data:import-backup` | Persistência | Ativo |
| **licenseIpc** | `src/main/ipc/licenseIpc.ts` | Validação de chaves de licença e hardware ID | `license:check`, `license:activate` | Licenciamento | Ativo |
| **aiIpc** | `src/main/ipc/aiIpc.ts` | Comunicação com APIs de inteligência artificial | `ai:send-prompt`, `ai:get-models` | IA | Ativo |

---

## 2. Motores e Serviços Node.js (`src/main/services/`)

| Nome do Serviço | Localização Exata | Responsabilidade de Negócio | Dependências Externas | Status |
|---|---|---|---|---|
| **bulkEditEngine** | `src/main/services/bulkEditEngine.ts` | Fila assíncrona de reencodificação e alteração de hashes de vídeos | Fluent FFmpeg, `@ffmpeg-installer/ffmpeg` | Ativo |
| **metaclean** | `src/main/services/metaclean.ts` | Remoção de tags EXIF, GPS, autor e metadados de mídia | Node `fs`, FFmpeg, buffer binário | Ativo |
| **auth-manager** | `src/main/services/auth-manager.ts` | Gerenciamento de credenciais locais encriptadas | `keytar`, `jsonwebtoken` | Ativo |
| **license-manager**| `src/main/services/license-manager.ts` | Cálculo de HWID da máquina e verificação de assinatura de licença | `crypto`, `os` | Ativo |
| **supabase-listener**| `src/main/services/supabase-listener.ts` | Inscrição em tempo real em alterações de tabelas remótas no Supabase | `@supabase/supabase-js` Realtime | Desativado (Modo local) |
| **firebase-listener**| `src/main/services/firebase-listener.ts` | Escuta de eventos em tempo real do Firebase Database | `firebase/database` | Ativo |
| **local-api-server**| `src/main/features/local-api/local-api-server.ts` | Servidor HTTP REST escutando comandos externos na porta 54345 | Node HTTP Server nativo | Ativo |

---

## 3. Serviços de Armazenamento Renderer (`src/renderer/features/*`)

| Nome do Serviço | Localização Exata | Tipo de Armazenamento | Chaves / Tabelas Afetadas | Status |
|---|---|---|---|---|
| **canvasStorage** | `src/renderer/features/Canvas/canvasStorage.ts` | LocalStorage + Supabase | Chaves `axe_offline_canvases`, `axe_online_backup_nodes_*`, tabela Supabase `nodes` | Ativo |
| **crmStorage** | `src/renderer/features/CRM/crmStorage.ts` | LocalStorage + Supabase | Chaves `axe_crm_leads`, `axe_crm_columns`, tabela Supabase `crm_leads` | Ativo |
| **syncManager** | `src/renderer/lib/syncManager.ts` | Fila de Sincronização em Background | Fila FIFO no LocalStorage com retentativa assíncrona para o Supabase | Ativo |
