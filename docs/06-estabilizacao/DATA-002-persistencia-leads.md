# Item 6 — DATA-002: Debounce e Flush de Atualizações Contínuas no CRMContext

## 1. Identificador do Item
- **ID**: `DATA-002`
- **Gravidade**: P1 (Alto)
- **Arquivo Modificado**: `src/renderer/features/CRM/CRMContext.tsx`

---

## 2. Mudança Aplicada
- Criado o mecanismo de debounce de 300ms (`pendingLeadUpdates` e `debouncedLeadTimers`) para mutações contínuas em `updateLead()`.
- Implementada a função `flushPendingLeadUpdate(id)` executada obrigatoriamente antes de ações explícitas (ex: `addLead`, `deleteLead`, `moveLead`, ao alterar `selectedLeadId` ou ao desmontar o provider).
- Adicionado parâmetro opcional `immediate?: boolean` em `updateLead` para forçar o salvamento síncrono quando necessário.

---

## 3. Comportamento Preservado
- Mutações no CRM continuam instantâneas na interface React, enquanto a sincronização com o Supabase é realizada de forma otimizada.

---

## 4. Testes Executados e Resultado
- Digitação rápida de texto no formulário do lead: OK (apenas 1 chamada remota de atualização ao final da pausa de digitação).
- Troca imediata de lead selecionado durante digitação: OK (flush pendente disparado antes de carregar o novo lead).

---

## 5. Como Reverter a Mudança
Reverter as alterações nos métodos `updateLead` e `flushPendingLeadUpdate` em `CRMContext.tsx`.
