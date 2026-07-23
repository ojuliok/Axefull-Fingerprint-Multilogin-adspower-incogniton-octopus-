# 01 — Mapa Completo de Páginas

## Visão Geral
Auditoria funcional de todas as telas principais da aplicação Renderer.

---

## Tabela de Mapeamento de Páginas

| Nome Funcional | Objetivo de Negócio | Localização Exata | Tamanho (Bytes/Linhas) | Dependências Chave | Dados Lidos/Gravados | Status | Risco |
|---|---|---|---|---|---|---|---|
| **Dashboard** | Gerenciamento central de perfis de navegação, estatísticas e atalhos rápidos | `src/renderer/pages/Dashboard.tsx` | 152 KB (~3.500 linhas) | `DashboardContext`, `electron.ipcRenderer`, `FloatingProfiles` | Perfis SQLite local, Supabase Cloud | Ativo | 🔴 Alto (Monolítico) |
| **NotesPage** | Editor de documentos e bloco de notas rico estilo Notion com Tiptap | `src/renderer/pages/NotesPage.tsx` | 149 KB (~3.200 linhas) | TipTap StarterKit, `WorkspaceContext`, `syncManager` | LocalStorage, Supabase (tabela `nodes`) | Ativo | 🔴 Alto (Monolítico) |
| **CanvasPage** | Container do Infinite Canvas 2D, CRM, documentos, pastas e espaços | `src/renderer/pages/CanvasPage.tsx` | 118 KB (~2.800 linhas) | `InfiniteCanvas`, `CRMList`, `canvasStorage` | LocalStorage (`axe_offline_canvases`), Supabase | Ativo | 🔴 Crítico (Sobrecarga) |
| **HomeW97** | Interface nostálgica estilo Windows 97 com ícones desktop e janelas | `src/renderer/pages/HomeW97.tsx` | 76 KB (~1.800 linhas) | `lucide-react`, `PomodoroContext`, `AuthContext` | LocalStorage (preferências da home) | Ativo | 🟡 Médio |
| **SettingsPage** | Configurações globais de conta, licença, temas, proxies e atualizações | `src/renderer/pages/SettingsPage.tsx` | 65 KB (~1.500 linhas) | `ThemeContext`, `SecurityContext`, `authIpc` | Configurações locais `config.json`, SQLite | Ativo | 🟡 Médio |
| **CRMPage** | Painel principal do CRM com visões Kanban, Tabela e importação | `src/renderer/pages/CRMPage.tsx` | 64 KB (~1.400 linhas) | `CRMContext`, `crmStorage`, `@dnd-kit/core` | LocalStorage (`axe_crm_leads`), Supabase | Ativo | 🔴 Alto |
| **DadosClean** | Utilitário MetaClean para remoção de metadados e alteração de vídeo | `src/renderer/pages/DadosClean.tsx` | 31 KB (~750 linhas) | `metacleanIpc`, `bulkVideoIpc`, FFmpeg | Sistema de arquivos local via IPC Electron | Ativo | 🟢 Baixo |
| **LoginPage** | Autenticação de usuário via Supabase (E-mail/Senha e OAuth) | `src/renderer/pages/LoginPage.tsx` | 26 KB (~600 linhas) | `AuthContext`, `supabase-client` | Autenticação Supabase, LocalStorage Tokens | Ativo | 🟢 Baixo |
| **VitrinePage** | Catálogo de soluções, extensões e integrações disponíveis | `src/renderer/pages/VitrinePage.tsx` | 19 KB (~450 linhas) | `lucide-react` | Leitura estática de dados da vitrine | Ativo | 🟢 Baixo |
| **SalesPage** | Página de boas-vindas / vendas exibida para usuários não logados | `src/renderer/pages/SalesPage.tsx` | 18 KB (~400 linhas) | `lucide-react` | Sem persistência direta | Ativo | 🟢 Baixo |
| **AITimelinePage**| Timeline e histórico de assistentes virtuais e automações por IA | `src/renderer/pages/AITimelinePage.tsx` | 3.7 KB (~100 linhas) | `aiIpc` | Histórico de prompts locais | Ativo | 🟢 Baixo |
| **NotesWidgetWindow**| Janela flutuante minimalista de rascunhos desanexados | `src/renderer/pages/NotesWidgetWindow.tsx` | 3.5 KB (~90 linhas) | `electron.ipcRenderer` | LocalStorage rascunhos rápidos | Ativo | 🟢 Baixo |
| **DownloadPage** | Tela de links para download e instalação do executável | `src/renderer/pages/DownloadPage.tsx` | 2.8 KB (~70 linhas) | `lucide-react` | Leitura de versão e release | Ativo | 🟢 Baixo |
