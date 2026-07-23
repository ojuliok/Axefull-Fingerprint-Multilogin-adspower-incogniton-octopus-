# 03 — Backlog Técnico Priorizado

## Visão Geral
Backlog unificado contendo todos os diagnósticos técnicos da Fase 3, rigorosamente ordenados pela regra de priorização real de impacto e estabilidade do sistema.

---

## Regra de Ordenação do Backlog
1. **Perda, corrupção ou conflito de dados**
2. **Vazamento de memória, listeners e efeitos sem cleanup**
3. **Travamentos e bloqueios da interface**
4. **Renderizações em cascata e requisições desnecessárias**
5. **Acoplamentos que impedem o isolamento de Tela**
6. **Código morto, arquivos monolíticos e dependências dispensáveis**

---

## Tabela do Backlog Técnico Priorizado

| Ordem | ID Item | Categoria de Prioridade | Título do Item Diagnosticado | Domínio | Status | Prioridade | Arquivo Principal |
|---|---|---|---|---|---|---|---|
| **1** | **DATA-001** | 1. Conflito de Dados | Sobrescrita silenciosa entre abas no LocalStorage (`axe_offline_canvases`) | Canvas / Docs | Confirmado | **P0 (Crítico)** | `canvasStorage.ts` |
| **2** | **DATA-002** | 1. Conflito de Dados | Mutação de Lead sem Debounce no CRM Context | CRM | Confirmado | **P1 (Alto)** | `CRMContext.tsx` |
| **3** | **MEM-001** | 2. Vazamento / Cleanup | Listener `crm-reload-leads` sem cleanup no `CRMList.tsx` | CRM | Confirmado | **P0 (Crítico)** | `CRMList.tsx` |
| **4** | **MEM-002** | 2. Vazamento / Cleanup | Listeners de mouse sem fechamento em resize de colunas | CRM | Confirmado | **P1 (Alto)** | `CRMList.tsx` |
| **5** | **PERF-001** | 3. Travamento de UI | Gravação síncrona no LocalStorage durante Drag/Drop | Canvas 2D | Confirmado | **P0 (Crítico)** | `canvasStorage.ts` |
| **6** | **PERF-002** | 4. Renders em Cascata | Re-render da Tela por expansão de `expandedFolders` | Pastas / Tela | Confirmado | **P1 (Alto)** | `CanvasPage.tsx` |
| **7** | **BUG-001** | 4. Renders / Estado | Sobrescrita silenciosa de estado de pastas na troca de Workspace | Pastas | Confirmado | **P1 (Alto)** | `CanvasPage.tsx` |
| **8** | **BUG-002** | 4. Renders / Estado | Invalidação nula de formulário ao alternar card no CRM | CRM | Confirmado | **P1 (Alto)** | `LeadDetailModal.tsx` |
| **9** | **ARCH-002** | 5. Acoplamento de Tela | Modelo unificado heterogêneo `CanvasInfo` | Arquitetura | Confirmado | **P2 (Médio)** | `canvasTypes.ts` |
| **10** | **ARCH-001** | 6. Código Monolítico | Monolito do Renderizador 2D `InfiniteCanvas.tsx` (346 KB) | Canvas 2D | Confirmado | **P2 (Médio)** | `InfiniteCanvas.tsx` |
| **11** | **HIPO-001** | Performance Gráfica | Degradação de FPS no Canvas 2D em escala (10 a 500 Nós) | Canvas 2D | Hipótese | **P2 (Médio)** | `InfiniteCanvas.tsx` |
| **12** | **HIPO-002** | Consumo de RAM | Vazamento de Heap por imagens Base64 | Documentos | Hipótese | **P2 (Médio)** | `canvasStorage.ts` |
| **13** | **DEP-001** | Peso de Dependências | Otimização de Bundling do Package `@dnd-kit` | CRM | Confirmado | **P3 (Baixo)** | `package.json` |

---

## Definição da Fase 3.1 de Estabilização (Início da Refatoração Futura)
Antes de qualquer reestruturação arquitetural ou movimentação física de pastas, a futura implementação iniciará rigorosamente pelos **4 primeiros itens do backlog**:
1. Correção do cleanup do listener `crm-reload-leads` (`MEM-001`).
2. Proteção contra gravação síncrona no LocalStorage durante drag/drop (`PERF-001`).
3. Eliminação dos re-renders em cascata causados por `expandedFolders` (`PERF-002`).
4. Proteção contra gravação concorrente sem timestamp nas abas (`DATA-001`).
