# 02 — Matriz de Fontes de Verdade e Sincronização

## Visão Geral
Mapeamento de todas as fontes de verdade para as entidades de dados que compõem a Área Tela (Workspace, Espaços, Pastas, Documentos, Canvas 2D, CRM Leads, Colunas, Tags e Perfis), identificando duplicações de dados em memória e riscos de concorrência.

---

## Matriz Principal de Entidades

| Entidade | Fonte de Verdade Oficial | Cópias Locais em Memória / Storage | Mecanismo de Sincronização | Risco Identificado | Arquivos Envolvidos |
|---|---|---|---|---|---|
| **Workspace / Espaço** | Supabase Cloud (tabela `workspaces`) | `WorkspaceContext.tsx` (`currentWorkspace`) + `localStorage` (`axe_current_workspace`) | Chamada REST / CustomEvent `workspace-changed` | **Confirmado no código**: Dessincronização entre abas ao trocar de espaço sem invalidação de cache de abas. | `WorkspaceContext.tsx`, `CanvasPage.tsx`, `Sidebar.tsx` |
| **Lista de Canvas / Itens** | Supabase Cloud (tabela `nodes`) | `canvasList` (state em `CanvasPage.tsx`) + `localStorage` (`axe_offline_canvases`, `axe_online_backup_nodes_*`) | `getCanvasList()` -> Leitura síncrona de LocalStorage com fallback Supabase | **Confirmado no código**: `canvasList` é um array heterogêneo contendo páginas, canvas 2D, tabelas, pastas e espaços misturados. | `canvasStorage.ts`, `CanvasPage.tsx` |
| **Payload do Canvas 2D** | Supabase Cloud (tabela `nodes.properties`) | `activeCanvasData` (state em `CanvasPage.tsx`) + state interno do `InfiniteCanvas.tsx` + `localStorage` (`axe_canvas_data_<id>`) | `flushPendingSave()` disparado com debounce de 500ms ou em `beforeunload` | **Confirmado no código**: Gravação síncrona no LocalStorage sem mutex/lock. Risco de perda se o app fechar abruptamente antes do flush. | `InfiniteCanvas.tsx`, `canvasStorage.ts`, `CanvasPage.tsx` |
| **Documentos Ricos (Notas)** | Supabase Cloud (tabela `nodes.properties`) | State interno do TipTap (`CanvasRichText.tsx`) + `localStorage` (`axe_canvas_data_<id>`) | `updateCanvasInfo()` executado a cada alteração de bloco no editor TipTap | **Confirmado no código**: Documentos lineares reutilizam os mesmos métodos de salvamento de canvas 2D, gerando payloads inflados. | `CanvasRichText.tsx`, `canvasStorage.ts` |
| **CRM Leads** | Supabase Cloud (tabela `crm_leads`) | `CRMContext.tsx` (`leads`) + `localStorage` (`axe_crm_leads`) | `saveLeadsToStorage()` -> Gravação síncrona no `localStorage` + `syncManager.ts` | **Confirmado no código**: `CRMContext` recompõe o array inteiro de leads em memória a cada mutação de um único card. | `CRMContext.tsx`, `crmStorage.ts`, `CRMList.tsx` |
| **Estágios / Colunas CRM**| Supabase Cloud (tabela `crm_columns`) | `CRMContext.tsx` (`columns`) + `localStorage` (`axe_crm_columns`) | `saveColumnsToStorage()` -> Gravação no `localStorage` | **Confirmado no código**: Mutação direta de colunas em memória sem versionamento ou lock optimist. | `CRMContext.tsx`, `crmStorage.ts`, `KanbanBoard.tsx` |
| **Pastas e Estrutura** | Supabase Cloud (tabela `nodes`) | `expandedFolders` (`Set<string>` em `CanvasPage.tsx`) + `canvasList` | Re-renderização síncrona da árvore recursiva (`renderFolderTree`) | **Confirmado no código**: Inexistência de store de pastas; a árvore é recalculada a cada re-render da Tela. | `CanvasPage.tsx` |
| **Perfis Anti-Detect** | SQLite Local (`profiles.db`) | `DashboardContext.tsx` + `FloatingProfiles.tsx` state | IPC Channels (`profile:list`, `profile:updated`) | **Confirmado no código**: Perfis são lidos via IPC Main Process. O contrato IPC `profile:*` permanece intocado. | `FloatingProfiles.tsx`, `profileIpc.ts` |

---

## Situações Críticas de Concorrência e Gravação sem Lock

1. **Gravação Dupla LocalStorage + Supabase sem Resolução de Conflitos**:
   - *Confirmado no código*: Em `canvasStorage.ts` (linhas 25-52), a gravação local ocorre de forma síncrona antes que a resposta do Supabase seja retornada. Se duas instâncias locais modificarem a mesma nota offline, a última gravação sobrescreverá a anterior silenciosamente sem timestamp delta ou CRDT.
2. **Ausência de Debounce em Inputs do CRM**:
   - *Confirmado no código*: Em `LeadDetailModal.tsx` (linhas 100-200), a digitação em campos de texto altera imediatamente o estado global do `CRMContext`, disparando `localStorage.setItem('axe_crm_leads', ...)` a cada tecla pressionada.
