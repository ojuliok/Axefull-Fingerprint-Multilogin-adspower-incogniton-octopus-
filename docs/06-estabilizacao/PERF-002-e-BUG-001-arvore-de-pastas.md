# Item 5 — PERF-002 & BUG-001: Isolamento de `expandedFolders` e Reset por Workspace

## 1. Identificador do Item
- **ID**: `PERF-002` / `BUG-001`
- **Gravidade**: P1 (Alto)
- **Arquivo Modificado**: `src/renderer/pages/CanvasPage.tsx`

---

## 2. Mudança Aplicada
- Adicionada a instrução `setExpandedFolders(new Set())` dentro da função `reloadCanvasList` em `CanvasPage.tsx`.
- Ao alternar o workspace ativo (`currentWorkspace`), a lista de pastas expandidas é limpa, impedindo que IDs de pastas do workspace anterior permaneçam ativos na nova renderização da sidebar.

---

## 3. Comportamento Preservado
- A expansão e recolhimento de pastas funcionam normalmente dentro do workspace ativo.

---

## 4. Testes Executados e Resultado
- Expandir pastas na sidebar, trocar de workspace e retornar ao workspace inicial: OK (árvore de pastas limpa e reconstruída corretamente no contexto do novo workspace).

---

## 5. Como Reverter a Mudança
Remover a chamada `setExpandedFolders(new Set())` de `reloadCanvasList` em `CanvasPage.tsx`.
