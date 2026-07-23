# 01 — Mapa de Componentes Relevantes da Aplicação

## Visão Geral
Listagem dos principais componentes estruturais, visuais e de funcionalidades do projeto.

---

## Tabela de Mapeamento de Componentes

| Nome do Componente | Localização Exata | Responsabilidade de UI / Lógica | Dependências Principais | Risco / Observações |
|---|---|---|---|---|
| **InfiniteCanvas** | `src/renderer/features/Canvas/InfiniteCanvas.tsx` | Motor gráfico 2D de canvas com zoom, pan, nós visuais, desenhos e conexões | 346 KB em arquivo único! CSS Modules (`InfiniteCanvas.module.css`) | 🔴 Crítico. Arquivo gigante que concentra toda a renderização visual da área Tela. |
| **CRMList** | `src/renderer/features/CRM/CRMList.tsx` | Visualização em tabela e lista de leads com ordenação e filtros avançados | `CRMContext`, `crmStorage`, `LeadDetailModal` | 🔴 Alto. 78KB. Mistura tabela com manipulação direta de DOM e exportação CSV/Excel. |
| **LeadDetailModal**| `src/renderer/features/CRM/LeadDetailModal.tsx` | Modal de edição detalhada de lead do CRM (histórico, campos customizados, tags) | `CRMContext`, `TipTap`, `lucide-react` | 🔴 Alto. 85KB em um único modal de formulário. |
| **Sidebar** | `src/renderer/components/Layout/Sidebar.tsx` | Barra lateral principal com rotas, atalhos, navegação por espaços e botões de ação | `react-router-dom`, `WorkspaceContext`, `lucide-react` | 🟡 Médio. Concentra lógica de expansão/recolhimento e contadores. |
| **FloatingProfiles**| `src/renderer/components/Layout/FloatingProfiles.tsx` | Widget flutuante de visualização e controle rápido de perfis anti-detect ativos *(Fingerprint)* | `electron.ipcRenderer`, `DashboardContext` | 🔴 Alto. Ponto de contato direto com Fingerprint. Deve ser mantido intacto. |
| **NavbarHorizontal**| `src/renderer/components/Layout/NavbarHorizontal.tsx` | Navegação horizontal superior com seletores de abas e controle de janela | `react-router-dom`, `lucide-react` | 🟢 Baixo. |
| **FloatingDock** | `src/renderer/components/Layout/FloatingDock.tsx` | Dock flutuante estilo macOS para troca rápida de ferramentas e widgets | `lucide-react`, `PomodoroContext` | 🟢 Baixo. |
| **FloatingPomodoro**| `src/renderer/features/Tasks/FloatingPomodoro.tsx` | Widget flutuante e cronômetro Pomodoro com efeitos sonoros e progresso | `PomodoroContext`, `lucide-react` | 🟢 Baixo. |
| **KanbanBoard** | `src/renderer/features/CRM/KanbanBoard.tsx` | Quadro Kanban contendo colunas customizadas de estágios de pipeline | `@dnd-kit/core`, `KanbanColumn` | 🟡 Médio. |
| **KanbanColumn** | `src/renderer/features/CRM/KanbanColumn.tsx` | Coluna drogável de cards do Kanban | `@dnd-kit/sortable`, `KanbanCard` | 🟢 Baixo. |
| **KanbanCard** | `src/renderer/features/CRM/KanbanCard.tsx` | Card individual de lead com suporte a arrastar e soltar | `@dnd-kit/sortable`, `lucide-react` | 🟢 Baixo. |
| **NoteTiptapEditor**| `src/renderer/features/Notes/NoteTiptapEditor.tsx` | Editor TipTap com suporte a cabeçalhos, imagens, listas de tarefas e blocos de código | `@tiptap/react`, `@tiptap/starter-kit` | 🟡 Médio. |
| **CanvasHome** | `src/renderer/features/Canvas/CanvasHome.tsx` | Dashboard de gerenciamento de múltiplos quadros/canvas do workspace | `canvasStorage`, `CanvasIcons` | 🟡 Médio. |
| **SpaceOverview** | `src/renderer/features/Canvas/SpaceOverview.tsx` | Visão geral dos espaços de trabalho e diretórios da Tela | `canvasStorage` | 🟢 Baixo. |
| **MembersManager** | `src/renderer/features/Canvas/MembersManager.tsx` | Modal de gerenciamento de permissões e membros de um espaço | `WorkspaceContext`, `supabase` | 🟢 Baixo. |
