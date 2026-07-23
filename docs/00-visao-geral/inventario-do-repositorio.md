# Inventário Físico do Repositório

## Visão da Estrutura de Diretórios de Raiz

```text
Axefull - Fingerprint/
├── .env                         # Variáveis de ambiente (Supabase, Firebase, chaves de API)
├── .gitignore / .gitattributes  # Configurações de controle de versão Git
├── Product.wxs / Product.wixobj # Especificação do instalador MSI do Windows (WiX Toolset)
├── assets/                      # Ícones e recursos visuais do executável (icon.ico, icon.png)
├── build-wix-installer.ps1      # Script PowerShell para geração automatizada de pacotes MSI
├── certs/                       # Certificados digitais PFX (ex: self_signed.pfx)
├── debug-launch.log             # Log de depuração do ambiente local
├── dist/                        # Artefatos compilados pelo Vite/Electron-vite (main, renderer, preload)
├── docs/                        # Documentação técnica do projeto (00 a 05)
├── electron.vite.config.ts      # Configuração unificada do Vite para Electron Main, Preload e Renderer
├── installer.nsh                # Script NSIS customizado para instalador EXE Windows
├── package.json                 # Manifesto de dependências e scripts do projeto
├── package-lock.json            # Lockfile de dependências npm
├── postcss.config.mjs           # Configuração de pós-processamento CSS (Tailwind, Autoprefixer)
├── postinstall.js               # Script pós-instalação para verificação/build de binários nativos
├── scripts/                     # Scripts de automação e utilitários da aplicação
├── src/                         # Código fonte da aplicação (Main, Preload, Renderer, Types)
│   ├── main/                    # Processo Principal do Electron (Node.js backend)
│   ├── preload/                 # Script de ponte isolada IPC entre Main e Renderer
│   ├── renderer/                # Interface visual React (Frontend Single Page App)
│   └── types/                   # Definições globais de tipos TypeScript
├── states.txt                   # Arquivo de estado/rascunho temporário
├── supabase/                    # Schemas e migrações do banco relacional Supabase/PostgreSQL
├── tailwind.config.js           # Design Tokens, temas e utilitários Tailwind CSS
├── tsconfig.json                # Configuração do compilador TypeScript base
├── tsconfig.main.json           # Configuração TS para o processo Main
├── tsconfig.node.json           # Configuração TS para ambientes de desenvolvimento Node
├── tsconfig.preload.json        # Configuração TS para o processo Preload
└── vercel.json                  # Configurações de deploy estático no Vercel (se aplicável)
```

---

## Mapeamento Detalhado do Código Fonte (`src/`)

### 1. Processo Principal (`src/main/`)
- `index.ts`: Ponto de entrada do Electron. Inicializa IPCs, Tray, Janelas, Servidor REST Local (porta 54345) e SQLite.
- `database/`: Motor SQLite via `sql.js` em memória com sincronização em disco (`db.ts`) e cliente Supabase (`supabase-client.ts`).
- `ipc/`: Handlers de comunicação IPC separados por domínio:
  - `aiIpc.ts`, `appIpc.ts`, `authIpc.ts`, `browserIpc.ts`, `bulkVideoIpc.ts`, `dataIpc.ts`, `licenseIpc.ts`, `metacleanIpc.ts`, `profileIpc.ts`.
- `services/`: Motores de processamento Node.js:
  - `bulkEditEngine.ts` (Edição em lote de vídeos com ffmpeg).
  - `metaclean.ts` (Remoção de metadados de mídias).
  - `renderEngine.ts` (Renderização de mídia).
  - `auth-manager.ts`, `email-manager.ts`, `extensions-manager.ts`, `license-manager.ts`.
  - `firebase-listener.ts`, `supabase-listener.ts` (Sincronizadores em tempo real).
- `features/`: Motores de negócio:
  - `browser/` (Lançador do Playwright/Chromium).
  - `fingerprint/` (PROTEGIDO — Spoofing e injeções de atributos de browser).
  - `local-api/` (Servidor HTTP Express/Node para automação local).
  - `profile/`, `proxy/`, `ai/`.
- `security/`: `compliance-guard.ts` (Bloqueio de logins acidentais em webviews).

### 2. Preload (`src/preload/`)
- `preload.ts`: Expõe a API `window.electron` via `contextBridge` para a UI React de forma segura.

### 3. Processo Renderer (`src/renderer/`)
- `App.tsx`: Roteamento principal com `react-router-dom` (HashRouter), suporte a Lazy Loading de páginas e Providers globais.
- `index.tsx`: Ponto de montagem React 18 (`ReactDOM.createRoot`), ErrorBoundary customizado e escuta global de exceções.
- `pages/`: 20 arquivos contendo as telas principais da aplicação:
  - `Dashboard.tsx` (152KB) — Tela principal de gestão e perfis.
  - `NotesPage.tsx` (149KB) — Sistema completo de notas ricas.
  - `CanvasPage.tsx` (118KB) — Canvas colaborativo 2D.
  - `HomeW97.tsx` (76KB) — Tela de Início (Windows 97 style).
  - `SettingsPage.tsx` (65KB) — Configurações da aplicação.
  - `CRMPage.tsx` (64KB) — Gestão de Leads e CRM Kanban.
  - `DadosClean.tsx` (31KB) — Interface do limpador de metadados MetaClean.
  - `LoginPage.tsx`, `SalesPage.tsx`, `DownloadPage.tsx`, `VitrinePage.tsx`, `AITimelinePage.tsx`, `NotesWidgetWindow.tsx`.
- `features/`: Pastas de módulos funcionais da UI:
  - `CRM/`: Kanban, cards, listas, modais de importação e armazenamento.
  - `Canvas/`: `InfiniteCanvas.tsx` (346KB), mini-mapa, barras de ferramentas 2D, armazenamento local de canvas.
  - `Notes/`: Editores TipTap, widgets de nota flutuante.
  - `Tasks/`: Pomodoro flutuante, visões de tarefas e agenda.
  - `Dashboard/`, `Profiles/`, `BrowserData/`, `Security/`, `Settings/`, `AutomationModal/`, `Extensions/`, `Proxies/`, `Templates/`, `AI/`.
- `components/`: Componentes compartilhados de Layout (`Sidebar.tsx`, `Topbar.tsx`, `NavbarHorizontal.tsx`, `FloatingProfiles.tsx`, `LayoutManager.tsx`) e UI basais.
- `context/`: 6 React Contexts globais:
  - `AuthContext.tsx`, `WorkspaceContext.tsx`, `ThemeContext.tsx`, `ToastContext.tsx`, `PomodoroContext.tsx`, `SecurityContext.tsx`.
- `lib/`: `syncManager.ts`, `web-bridge.ts`, `supabase.ts`.
