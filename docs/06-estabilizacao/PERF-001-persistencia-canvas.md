# Item 3 — PERF-001: Remoção de Persistência Síncrona do Evento de Wheel/Drag no Canvas

## 1. Identificador do Item
- **ID**: `PERF-001`
- **Gravidade**: P0 (Crítico)
- **Arquivo Modificado**: `src/renderer/features/Canvas/InfiniteCanvas.tsx`

---

## 2. Mudança Aplicada
Removida a execução de `debouncedSaveCanvasData` de dentro da função pura de atualização de estado `setViewport(v => { ... })` no evento `onWheel`. A chamada foi movida para fora do updater do estado do React, evitando side-effects durante ciclos de render e descartando invocações síncronas redundantes no `localStorage`.

---

## 3. Comportamento Preservado
- A rolagem e zoom no Canvas 2D funcionam normalmente. As alterações de viewport continuam sendo salvas com debounce ao término do movimento.

---

## 4. Testes Executados e Resultado
- Rolagem rápida da roda do mouse (wheel) por 10 segundos continuos: A UI permaneceu responsiva, sem travamento de I/O no thread principal.

---

## 5. Como Reverter a Mudança
Re-colocar a chamada de `debouncedSaveCanvasData` dentro da função `setViewport` em `InfiniteCanvas.tsx`.
