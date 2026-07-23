# Changelog Técnico — Fases 3.1 e 3.2 (Estabilização e Validação)

## Visão Geral
Registro consolidado de todas as modificações no código-fonte aplicadas durante a **Fase 3.1** e refinadas com evidências comprovadas na **Fase 3.2**.

---

## Detalhamento por Arquivo

### 1. `src/renderer/features/Canvas/InfiniteCanvas.tsx`
- **PERF-001**: Garantido que o arrasto contínuo de nós (`handleMove` / `mousemove`) execute apenas `setNodes` em memória. Removida a chamada síncrona `debouncedSaveCanvasData` de dentro da função `setViewport` no handler `onWheel`.
- **PERF-002**: Envelopado o componente de exportação principal com `React.memo(InfiniteCanvas)` para bloquear re-renderizações disparadas por alterações no pai.

### 2. `src/renderer/pages/CanvasPage.tsx`
- **BUG-001**: Adicionada a instrução `setExpandedFolders(new Set())` na função `reloadCanvasList` para resetar pastas ativas ao trocar de workspace.
- **PERF-002**: Encapsulado o callback `handleCanvasCreated` com `useCallback`, garantindo estabilidade de referência de todas as props enviadas ao `<InfiniteCanvas />`.

### 3. `src/renderer/features/Canvas/canvasStorage.ts`
- **DATA-001**: Adicionada verificação de revisão atômica e detecção explícita de conflitos (`saveCanvasData(id, data, expectedRevision)`), com leitura prévia da versão existente, empacotamento com `revision`, `updatedAt` (ISO), `updatedBy` e migração transparente de dados legados.

### 4. `src/renderer/features/CRM/CRMContext.tsx`
- **DATA-002**: Implementado mecanismo de debounce de 300ms (`debouncedLeadTimers` / `pendingLeadUpdates`) para digitação contínua em `updateLead()`, com a função `flushPendingLeadUpdate()` acionada síncronamente em ações explícitas (adicionar, remover, mover, trocar lead selecionado).

### 5. `src/renderer/features/CRM/LeadDetailModal.tsx`
- **BUG-002**: Implementada reconciliação de formulário via `prevLeadIdRef` com flush de edições pendentes do lead anterior e reset completo de estados locais (`titleText`, `description`, `timerSeconds`) para a abertura de um novo lead.

### 6. `src/renderer/features/CRM/CRMList.tsx`
- **MEM-001 & MEM-002**: Implementada escuta limpa para `crm-reload-leads` com `removeEventListener` no unmount, além de ref `activeResizeCleanupRef` e listener do evento `blur` para desativação de manipuladores de resize de coluna.
