# Validação Detalhada do Item PERF-002 (Isolamento da Árvore de Pastas)

## 1. Cenário e Estabilização de Props
- **Arquivo**: `CanvasPage.tsx` e `InfiniteCanvas.tsx`
- **Problema**: Alterações na variável de estado `expandedFolders` (`Set<string>`) causavam o re-render de toda a árvore da página `CanvasPage.tsx`, forçando a reconstrução do `<InfiniteCanvas />`.

---

## 2. Correção Aplicada
1. **Memoização de Callbacks do Pai**:
   - `onCanvasCreated`: Encapsulado em `useCallback(() => reloadCanvasList(), [reloadCanvasList])`.
   - `onDataChange`, `onOpenPage`, `onNodesDeleted`: Já possuíam `useCallback`.
2. **Envelopamento do Componente Filho**:
   - `InfiniteCanvas.tsx` exportado como `React.memo(InfiniteCanvas)`.

---

## 3. Resultado Obtido
- **Comportamento**: Ao clicar na seta de expandir ou recolher qualquer pasta na sidebar, a subárvore da sidebar é atualizada, enquanto o `<InfiniteCanvas />` gera **0 re-renderizações**, mantendo intacto seu estado visual, seleção e viewport.
