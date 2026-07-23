# Item 2 — MEM-002: Cleanup Defensivo de Resize no CRM

## 1. Identificador do Item
- **ID**: `MEM-002`
- **Gravidade**: P1 (Alto)
- **Arquivo Modificado**: `src/renderer/features/CRM/CRMList.tsx`

---

## 2. Mudança Aplicada
- Adicionada a referência `activeResizeCleanupRef` para rastrear qualquer sessão ativa de redimensionamento de coluna.
- Inserido o listener `window.addEventListener('blur', handleMouseUp)` para encerrar com segurança o redimensionamento se a janela perder o foco.
- Adicionado um `useEffect` de desativação defensiva no unmount do `CRMList` para remover listeners de `mousemove`, `mouseup` e `blur`.

---

## 3. Comportamento Preservado
- O arrasto de colunas na tabela do CRM continua fluido e gravando as larguras no `localStorage` ao soltar o mouse.

---

## 4. Testes Executados e Resultado
- Iniciar resize e liberar o mouse dentro da janela: OK.
- Iniciar resize e liberar o mouse fora da janela: OK (cleanup executado).
- Iniciar resize e dar `Alt+Tab` para desfocar a janela: OK (função de cleanup invocada no evento `blur`).

---

## 5. Como Reverter a Mudança
Reverter as modificações na função `startResize` e no `activeResizeCleanupRef` em `CRMList.tsx`.
