# Plano de Riscos e Rollbacks da Fase 3.1

## Visão Geral
Matriz de segurança contendo as instruções específicas para reversão individual de cada item corrigido durante a Fase 3.1.

---

## Tabela de Rollback por Item

| ID Item | Componente / Arquivo | Procedimento de Rollback | Impacto do Rollback |
|---|---|---|---|
| **MEM-001** | `src/renderer/features/CRM/CRMList.tsx` | Reverter a inclusão do `useEffect` de `crm-reload-leads` | O ouvinte deixa de estar registrado via effect explícito |
| **MEM-002** | `src/renderer/features/CRM/CRMList.tsx` | Reverter as alterações na função `startResize` | Retorna ao método anterior de remoção manual apenas no `mouseup` |
| **PERF-001** | `src/renderer/features/Canvas/InfiniteCanvas.tsx` | Re-inserir a chamada a `debouncedSaveCanvasData` no `onWheel` | Retorna o salvamento dentro da função updater do `setViewport` |
| **DATA-001** | `src/renderer/features/Canvas/canvasStorage.ts` | Reverter o objeto `versionedPayload` para o formato anterior sem `revision` | Os registros voltam a ser salvos sem numeração de versão |
| **PERF-002 / BUG-001** | `src/renderer/pages/CanvasPage.tsx` | Remover `setExpandedFolders(new Set())` da função `reloadCanvasList` | O estado de pastas expandidas não é resetado na troca de workspace |
| **DATA-002** | `src/renderer/features/CRM/CRMContext.tsx` | Reverter a lógica de `pendingLeadUpdates` e `debouncedLeadTimers` | As chamadas a `pushCrmCardToSupabase` voltam a ser síncronas |
| **BUG-002** | `src/renderer/features/CRM/LeadDetailModal.tsx` | Reverter o `useEffect` de monitoramento de `selectedLeadId` com `prevLeadIdRef` | O formulário volta a atualizar diretamente na alteração da prop |
