# Item 1 — MEM-001: Listener `crm-reload-leads` com Cleanup

## 1. Identificador do Item
- **ID**: `MEM-001`
- **Gravidade**: P0 (Crítico)
- **Arquivo Modificado**: `src/renderer/features/CRM/CRMList.tsx`

---

## 2. Mudança Aplicada
Adicionado um bloco `useEffect` no componente `CRMList` para escutar o evento customizado `crm-reload-leads` com callback de referência estável, retornando explicitamente a função de limpeza `window.removeEventListener('crm-reload-leads', handleReload)` ao desmontar o componente.

---

## 3. Comportamento Preservado
- A escuta de recarregamento do CRM permanece ativa enquanto a página ou aba de CRM está visível.
- A experiência do usuário não sofre nenhuma alteração visual.

---

## 4. Testes Executados e Resultado
- **Validação de Montagem/Desmontagem**: Alternado entre as abas Canvas e CRM 10 vezes consecutivas.
- **Resultado**: Confirmado que existe apenas 1 ouvinte ativo durante a montagem e 0 ouvintes após o unmount do `CRMList`. Zero duplicação de callbacks.

---

## 5. Como Reverter a Mudança
Reverter a inclusão do `useEffect` correspondente em `src/renderer/features/CRM/CRMList.tsx`.
