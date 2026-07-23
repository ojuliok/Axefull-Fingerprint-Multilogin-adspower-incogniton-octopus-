# 01 — Relatório de Código Duplicado, Legado ou Sobreposto

## Visão Geral
Identificação de trechos de código, utilitários, componentes e estilos duplicados ou que representam versões legadas mantidas em paralelo no repositório.

---

## Tabela de Duplicações e Código Legado

| Item Identificado | Arquivo A (Versão Atual/Novos) | Arquivo B (Versão Legada/Duplicada) | Descrição da Duplicação | Risco de Inconsistência | Recomendação |
|---|---|---|---|---|---|
| **Gestão de Perfis** | `src/renderer/pages/Dashboard.tsx` | `src/renderer/pages/HomeW97.tsx` | Ambas as páginas renderizam listas de perfis anti-detect com chamadas IPC duplicadas | 🔴 Alto | Manter a gestão de perfis concentrada em Dashboard / Profiles |
| **Geração de ID Único**| `src/renderer/features/Canvas/canvasStorage.ts` (`generateId`) | `src/renderer/features/CRM/crmStorage.ts` (`generateId`) | Funções idênticas para geração de UUID/String aleatória reimplementadas | 🟢 Baixo | Extrair utilitário para `src/shared/utils/uuid.ts` |
| **Sanitização de UUID**| `src/renderer/features/Canvas/canvasStorage.ts` | `src/renderer/lib/syncManager.ts` | Validação por expressão regular de UUIDv4 duplicada em 3 arquivos | 🟢 Baixo | Centralizar validação de UUID |
| **Componentes de Modal**| Modais do CRM (`SpreadsheetImportModal`) | Modais do Canvas (`ItemPinModal`) | Estilização, overlay escuro e botão de fechar duplicados em CSS Modules isolados | 🟡 Médio | Criar um componente base `<Modal />` compartilhado |
| **Contextos de Workspace**| `src/renderer/context/WorkspaceContext.tsx` | `src/renderer/features/Canvas/canvasStorage.ts` | Ambas mantêm estado próprio do `workspaceId` ativo e realizam leituras no `localStorage` | 🔴 Alto | Garantir fonte única da verdade no `WorkspaceContext` |

---

## Detalhamento Técnico das Inconsistências
1. **Redundância de IPC Listener**:
   O evento `profile:updated` é escutado simultaneamente no `Dashboard.tsx`, `FloatingProfiles.tsx` e `HomeW97.tsx`, forçando 3 re-renderizações paralelas da lista de perfis quando um perfil altera de estado.
2. **Estilos CSS Repetidos**:
   `CanvasPage.module.css` (40KB), `InfiniteCanvas.module.css` (76KB) e `CRMPage.module.css` (7KB) contêm centenas de linhas de CSS idênticas para formatação de cards, botões e barras de ferramentas.
