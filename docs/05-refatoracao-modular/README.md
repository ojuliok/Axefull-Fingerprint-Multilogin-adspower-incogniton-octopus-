# 05 — Refatoração e Extração Gradual por Domínios

## Visão Geral
Este diretório registra a execução da **Fase 5 (Refatoração e Extração Gradual por Domínios)**.

Nesta fase, a estrutura do projeto foi refatorada gradualmente, segregando os serviços, contextos, tipos e componentes visuais nos domínios desacoplados (`src/renderer/domains/`), mantendo **Re-export Façades** nos caminhos antigos para garantir 100% de retrocompatibilidade e sem quebrar nenhuma dependência.

---

## ⛔ REGRA INEGOCIÁVEL DE ESCOPO
- O módulo **Fingerprint** (`src/main/features/fingerprint/`, `src/main/features/browser/`, `src/main/fingerprint/`, injetores e IPCs) permaneceu **100% INTOCADO, CONGELADO E ISOLADO DE QUALQUER MODIFICAÇÃO OU ANÁLISE INTERNA**.

---

## Etapas Executadas na Fase 5

### 1. Kernel Compartilhado (`src/renderer/shared/events/eventBus.ts`)
- Criada a classe `TypedEventBus` e a instância singleton `eventBus` com tipagem estrita via `AppEventMap`.

### 2. Contratos e Interfaces de Domínio
- Criados os contratos em `src/renderer/domains/canvas/types/`, `src/renderer/domains/crm/types/` e `src/renderer/domains/folders/types/`.

### 3. Domínio CRM (`src/renderer/domains/crm/`)
- Mapeados e transferidos `crmStorage.ts` e `CRMContext.tsx` para `src/renderer/domains/crm/`.
- Mantidas Re-export Façades em `src/renderer/features/CRM/` para suporte a importações legadas.

### 4. Domínio Canvas (`src/renderer/domains/canvas/`)
- Mapeados e transferidos `canvasStorage.ts`, `canvasTypes.ts`, `useCanvasNodes.ts` e `CanvasContext.tsx` para `src/renderer/domains/canvas/`.
- Mantidas Re-export Façades em `src/renderer/features/Canvas/` para suporte a importações legadas.

### 5. Decomposição de Componentes Visuais do Canvas
- Criados os subcomponentes visuais memoizados `CanvasStrokesLayer.tsx` e `CanvasConnectionsLayer.tsx` em `src/renderer/domains/canvas/components/`.

### 6. Decomposição de Componentes de Layout
- Criado o componente de abas memoizado `CanvasTabBar.tsx` em `src/renderer/domains/canvas/components/`.

---

## Resultados da Validação
- **TypeScript (`npx tsc --noEmit`)**: Exit code 0 (0 erros).
- **Build de Produção (`npm run build:renderer`)**: Exit code 0 (compilado com sucesso via electron-vite em 21.58s).
