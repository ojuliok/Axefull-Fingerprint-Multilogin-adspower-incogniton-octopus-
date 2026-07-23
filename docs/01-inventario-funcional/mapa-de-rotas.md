# 01 — Mapa de Rotas e Navegação da Aplicação

## Visão Geral do Roteamento
O roteamento da interface gráfica (Renderer) é controlado via `HashRouter` do `react-router-dom` em `src/renderer/App.tsx`. Todas as rotas primárias são renderizadas dentro de um layout unificado (`LayoutManager`), com proteção de autenticação (`ProtectedRoute`). Há também rotas standalone que abrem em janelas independentes do Electron.

---

## Tabela Completa de Rotas

| Rota (Path) | Componente Associado | Localização do Arquivo | Função / Domínio de Negócio | Tipo de Rota | Status | Risco |
|---|---|---|---|---|---|---|
| `/` | `LayoutManager` | `src/renderer/components/Layout/LayoutManager.tsx` | Layout Base com Sidebar, Topbar e Dock flutuante | Container | Ativo | Baixo |
| `/home` | `HomeW97` | `src/renderer/pages/HomeW97.tsx` | Dashboard Retro Windows 97 com widgets de atalhos | Protegida | Ativo | Médio |
| `/profiles` | `Dashboard` | `src/renderer/pages/Dashboard.tsx` | Gerenciamento de Perfis Anti-Detect *(Fingerprint UI)* | Protegida | Ativo | Alto (Monolito) |
| `/dadosclean` | `DadosClean` | `src/renderer/pages/DadosClean.tsx` | Limpador de Metadados EXIF/Vídeo (MetaClean) | Protegida | Ativo | Baixo |
| `/overview` | `CanvasPage` | `src/renderer/pages/CanvasPage.tsx` | Visão Geral do Canvas com chave `overview` | Protegida | Ativo | Crítico (346KB) |
| `/canvas` | `CanvasPage` | `src/renderer/pages/CanvasPage.tsx` | Editor de Canvas Infinito 2D & Módulos da Tela | Protegida | Ativo | Crítico (346KB) |
| `/tasks` | `TasksView` | `src/renderer/features/Tasks/Tasks/TasksView.tsx` | Gestão de Lista de Tarefas e Projetos | Protegida | Ativo | Baixo |
| `/agenda` | `AgendaView` | `src/renderer/features/Tasks/Tasks/AgendaView.tsx` | Calendário e Compromissos da Agenda | Protegida | Ativo | Baixo |
| `/settings` | `SettingsPage` | `src/renderer/pages/SettingsPage.tsx` | Configurações do Sistema, Temas e Contas | Protegida | Ativo | Médio |
| `/download` | `DownloadPage` | `src/renderer/pages/DownloadPage.tsx` | Central de Downloads e Atualizações | Protegida | Ativo | Baixo |
| `/vitrine` | `VitrinePage` | `src/renderer/pages/VitrinePage.tsx` | Vitrine de Aplicativos e Extensões | Protegida | Ativo | Baixo |
| `/notes` | `NotesPage` | `src/renderer/pages/NotesPage.tsx` | Editor de Documentos e Notas estilo Notion | Protegida | Ativo | Alto (149KB) |
| `/notes-widget` | `NotesWidgetWindow` | `src/renderer/pages/NotesWidgetWindow.tsx` | Janela Flutuante Desanexada de Notas RÁPIDAS | Standalone | Ativo | Baixo |
| `--` | `CRMPage` | `src/renderer/pages/CRMPage.tsx` | Painel CRM Kanban de Leads *(Sem Rota Direta no App.tsx)* | Render Interno | Ativo (Sub-rota)| Alto (64KB) |
| `--` | `LoginPage` | `src/renderer/pages/LoginPage.tsx` | Tela de Login / Cadastro | Condicional | Ativo | Baixo |
| `--` | `SalesPage` | `src/renderer/pages/SalesPage.tsx` | Landing Page de Vendas interna para não-autenticados | Condicional | Ativo | Baixo |

---

## Padrão de Carregamento e Performance das Rotas
- **Lazy Loading**: Todas as páginas são carregadas assincronamente via React `lazy()` e envelopadas com `<Suspense fallback={<PageLoader />}>`.
- **Roteador**: `HashRouter` (Garante funcionamento seguro em arquivos locais de produção via protocolo `file://`).
- **Problema de Roteamento Identificado**: A `CRMPage.tsx` é importada e exibida como uma sub-seção dinâmica dentro de `CanvasPage.tsx` ou em modais, sem ter uma rota isolada no `App.tsx`, misturando a navegação do CRM com o Canvas.
