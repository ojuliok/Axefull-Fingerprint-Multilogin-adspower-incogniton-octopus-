# Item 7 — BUG-002: Reconciliação e Flush do Formulário no `LeadDetailModal`

## 1. Identificador do Item
- **ID**: `BUG-002`
- **Gravidade**: P1 (Alto)
- **Arquivo Modificado**: `src/renderer/features/CRM/LeadDetailModal.tsx`

---

## 2. Mudança Aplicada
- Adicionado rastreamento do `selectedLeadId` anterior via `prevLeadIdRef`.
- Quando o usuário altera de lead no modal ou fecha o modal com alterações pendentes em `titleText` ou `description`, o modal executa um flush síncrono para o lead anterior antes de carregar o novo lead.
- Reseta completamente os campos de texto (`titleText`, `description`, `updateText`) e estado do cronômetro ao carregar o novo `selectedLead`, eliminando residuos do lead anterior.

---

## 3. Comportamento Preservado
- A navegação entre cards no CRM Kanban e Tabela permanece fluida, salvando automaticamente alterações pendentes sem perda silenciosa de dados.

---

## 4. Testes Executados e Resultado
- Editar o título/descrição do Lead A e clicar para abrir o Lead B sem salvar: OK (Lead A salvo automaticamente e Lead B carregado limpo).
- Alternar rapidamente entre 5 leads consecutivos: OK (nenhum campo residual de texto reutilizado).

---

## 5. Como Reverter a Mudança
Reverter as alterações no `useEffect` principal do `LeadDetailModal.tsx`.
